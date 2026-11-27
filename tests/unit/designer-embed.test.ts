import { describe, expect, test } from 'bun:test';
import {
  buildEmbed,
  crc32,
  EMBED_ID,
  embedToQuery,
  extractSvgEmbed,
  importDesignFile,
  isPng,
  parseDesign,
  readPngText,
  writePngText,
} from '../../app/lib/designer';

const QUERY = 'p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights';
const design = parseDesign(
  new URLSearchParams(`${QUERY}&t=${encodeURIComponent('Café & “bar” <1>')}`)
);

// A real 1×1 transparent PNG (IHDR, IDAT, IEND)
const PNG_1X1 = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  ),
  (c) => c.charCodeAt(0)
);

const bytes = (text: string) => new TextEncoder().encode(text);

describe('embed JSON', () => {
  test('carries the canonical query string', () => {
    const embed = buildEmbed(design);
    expect(embed.version).toBe(2);
    expect(embed.generator).toBe('awesomeled.xyz/designer');
    expect(embed.title).toBe('Café & “bar” <1>');
    expect(embedToQuery(JSON.stringify(embed))).toBe(embed.query);
    expect(parseDesign(new URLSearchParams(embed.query))).toEqual(design);
  });

  test('a leading question mark is tolerated', () => {
    expect(embedToQuery(JSON.stringify({ query: `?${QUERY}` }))).toBe(QUERY);
  });

  test('first-generation embeds (a chains list) still import', () => {
    const legacy = {
      generator: 'awesomeled.xyz/designer',
      source: 'xlights',
      chains: [
        { pixel: 'ws2812', strings: 8, perString: 500, controller: 'falcon-f16v5', fpsMax: 67 },
        { pixel: 'apa102', strings: 3, perString: 200, lengths: [150, 200, 80], controller: null },
      ],
      totalWatts: 1234,
    };
    const query = embedToQuery(JSON.stringify(legacy));
    expect(query).toBe('p=ws2812&x=8&n=500&c=falcon-f16v5&p=apa102&x=3&n=150.200.80&c=&g=xlights');
  });

  test('anything else is rejected', () => {
    for (const text of ['', 'not json', '[]', '"text"', 'null', '{}', '{"chains":[]}']) {
      expect(embedToQuery(text)).toBeNull();
    }
  });
});

describe('SVG', () => {
  const json = JSON.stringify(buildEmbed(design));
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  const svg = (inner: string) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><metadata id="${EMBED_ID}">${inner}</metadata><rect width="10" height="10"/></svg>`;

  test('reads escaped JSON back, including quotes, ampersands and non-ASCII text', () => {
    expect(extractSvgEmbed(svg(escaped))).toBe(json);
  });

  test('reads a CDATA section', () => {
    expect(extractSvgEmbed(svg(`<![CDATA[${json}]]>`))).toBe(json);
  });

  test('ignores other metadata elements', () => {
    const other = svg(escaped).replace(`id="${EMBED_ID}"`, 'id="something-else"');
    expect(extractSvgEmbed(other)).toBeNull();
    expect(extractSvgEmbed('<svg xmlns="http://www.w3.org/2000/svg"/>')).toBeNull();
  });

  test('importDesignFile returns the query', () => {
    expect(importDesignFile(bytes(svg(escaped)))).toEqual({ query: buildEmbed(design).query });
  });

  test('importDesignFile explains what went wrong', () => {
    const noDesign = importDesignFile(bytes('<svg xmlns="http://www.w3.org/2000/svg"/>'));
    expect('error' in noDesign && noDesign.error).toContain('No design found in that SVG');
    const notImage = importDesignFile(bytes('hello'));
    expect('error' in notImage && notImage.error).toContain('neither an SVG nor a PNG');
    const broken = importDesignFile(bytes(svg('{broken')));
    expect('error' in broken && broken.error).toContain("couldn't be read");
  });
});

describe('PNG', () => {
  test('crc32 matches the PNG specification', () => {
    // CRC of "IEND" with no data is the well-known AE 42 60 82
    expect(crc32(bytes('IEND'))).toBe(0xae426082);
    // and the fixture's own IHDR chunk checks out
    const ihdr = PNG_1X1.subarray(12, 12 + 4 + 13);
    const stored = new DataView(PNG_1X1.buffer).getUint32(12 + 4 + 13);
    expect(crc32(ihdr)).toBe(stored);
  });

  test('recognizes PNG data', () => {
    expect(isPng(PNG_1X1)).toBe(true);
    expect(isPng(bytes('<svg/>'))).toBe(false);
    expect(isPng(new Uint8Array(3))).toBe(false);
  });

  test('text survives a write and read, including non-ASCII', () => {
    const json = JSON.stringify(buildEmbed(design));
    const out = writePngText(PNG_1X1, EMBED_ID, json);
    expect(isPng(out)).toBe(true);
    expect(out.length).toBe(PNG_1X1.length + 12 + EMBED_ID.length + 5 + bytes(json).length);
    expect(readPngText(out, EMBED_ID)).toBe(json);
    expect(readPngText(PNG_1X1, EMBED_ID)).toBeNull();
  });

  test('the image data is untouched and the new chunk sits right after the header', () => {
    const out = writePngText(PNG_1X1, EMBED_ID, 'x');
    // signature + IHDR (8 + 25 bytes) are unchanged
    expect([...out.subarray(0, 33)]).toEqual([...PNG_1X1.subarray(0, 33)]);
    expect(String.fromCharCode(...out.subarray(37, 41))).toBe('iTXt');
    // everything after the inserted chunk is the original remainder
    const inserted = 12 + EMBED_ID.length + 5 + 1;
    expect([...out.subarray(33 + inserted)]).toEqual([...PNG_1X1.subarray(33)]);
  });

  test('writing again replaces the old text instead of adding a second chunk', () => {
    const once = writePngText(PNG_1X1, EMBED_ID, 'first');
    const twice = writePngText(once, EMBED_ID, 'second');
    expect(readPngText(twice, EMBED_ID)).toBe('second');
    expect(twice.length).toBe(once.length + 1);
  });

  test('other keywords are left alone', () => {
    const withOther = writePngText(PNG_1X1, 'Software', 'something');
    const both = writePngText(withOther, EMBED_ID, 'design');
    expect(readPngText(both, 'Software')).toBe('something');
    expect(readPngText(both, EMBED_ID)).toBe('design');
  });

  test('reads a plain tEXt chunk too', () => {
    const keyword = EMBED_ID;
    const text = '{"query":"p=a"}';
    const data = bytes(`${keyword}\0${text}`);
    const chunk = new Uint8Array(12 + data.length);
    new DataView(chunk.buffer).setUint32(0, data.length);
    chunk.set(bytes('tEXt'), 4);
    chunk.set(data, 8);
    new DataView(chunk.buffer).setUint32(
      8 + data.length,
      crc32(chunk.subarray(4, 8 + data.length))
    );
    const png = new Uint8Array(PNG_1X1.length + chunk.length);
    png.set(PNG_1X1.subarray(0, 33), 0);
    png.set(chunk, 33);
    png.set(PNG_1X1.subarray(33), 33 + chunk.length);
    expect(readPngText(png, keyword)).toBe(text);
    expect(importDesignFile(png)).toEqual({ query: 'p=a' });
  });

  test('rejects bad input', () => {
    expect(() => writePngText(bytes('nope'), EMBED_ID, 'x')).toThrow('Not a PNG');
    expect(() => writePngText(PNG_1X1, 'bad\nkeyword', 'x')).toThrow('keyword');
    const result = importDesignFile(PNG_1X1);
    expect('error' in result && result.error).toContain('No design found in that PNG');
  });

  test('importDesignFile round-trips a PNG', () => {
    const png = writePngText(PNG_1X1, EMBED_ID, JSON.stringify(buildEmbed(design)));
    const result = importDesignFile(png);
    expect(result).toEqual({ query: buildEmbed(design).query });
  });
});
