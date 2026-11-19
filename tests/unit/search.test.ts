import { describe, expect, test } from 'bun:test';
import {
  highlightParts,
  prepareIndex,
  queryFromPath,
  searchIndex,
  squash,
  type SearchDoc,
} from '../../app/lib/search';

// Synthetic index: real entries change under other workstreams' feet.
const docs: SearchDoc[] = [
  { c: 'pixels', i: 'ws2812', n: 'WS2812', b: 'WorldSemi', a: ['WS2812B', 'NeoPixel'] },
  { c: 'pixels', i: 'ws2815', n: 'WS2815', b: 'WorldSemi' },
  { c: 'pixels', i: 'sk6812-rgbw', n: 'SK6812 RGBW', b: 'Opsco' },
  { c: 'pixel-ics', i: 'ws2811', n: 'WS2811', b: 'WorldSemi', t: 'SOP8 12V strips' },
  {
    c: 'controllers',
    i: 'falcon-f16v4',
    n: 'Falcon F16V4',
    b: 'PixelController, LLC',
    k: '16 outputs',
    t: 'Art-Net sACN DDP Ethernet',
  },
  { c: 'controllers', i: 'falcon-f48', n: 'Falcon F48', b: 'PixelController, LLC' },
  {
    c: 'controllers',
    i: 'old-box',
    n: 'Old Box',
    b: 'Acme',
    s: 'discontinued',
    t: 'Art-Net bridge',
  },
  { c: 'controllers', i: 'new-box', n: 'New Box', b: 'Acme', t: 'Art-Net bridge' },
  { c: 'drive-libraries', i: 'fastled', n: 'FastLED', b: 'Daniel Garcia', t: 'WS2812 APA102' },
  { c: 'pattern-drivers', i: 'wled', n: 'WLED', b: 'Aircoookie' },
];
const index = prepareIndex(docs);
const ids = (query: string) => searchIndex(index, query).map((hit) => hit.doc.i);
const expectAll = (found: string[], wanted: string[]) => {
  for (const id of wanted) expect(found).toContain(id);
};

describe('matching', () => {
  test('part numbers match in any case, spacing or punctuation', () => {
    expect(ids('ws2812')[0]).toBe('ws2812');
    expect(ids('WS 2812')[0]).toBe('ws2812');
    expect(ids('ws-2812')[0]).toBe('ws2812');
    expect(ids('f16 v4')).toEqual(['falcon-f16v4']);
    expect(squash('WS2812-B')).toBe(squash('ws 2812 b'));
  });

  test('a partial number finds the family', () => {
    expectAll(ids('281'), ['ws2812', 'ws2815', 'ws2811']);
    expect(ids('281')).not.toContain('sk6812-rgbw');
  });

  test('other names for the same part find it', () => {
    expect(ids('neopixel')[0]).toBe('ws2812');
    expect(ids('ws2812b')[0]).toBe('ws2812');
  });

  test('every word must match somewhere', () => {
    expect(ids('falcon f48')).toEqual(['falcon-f48']);
    expect(ids('falcon ethernet')).toEqual(['falcon-f16v4']);
    expect(ids('falcon zigbee')).toEqual([]);
  });

  test('one-letter slips still find the name', () => {
    expectAll(ids('falcn'), ['falcon-f16v4', 'falcon-f48']);
    expect(ids('fastld')).toEqual(['fastled']);
  });

  test('nothing matches an empty query or nonsense', () => {
    expect(ids('')).toEqual([]);
    expect(ids('   ')).toEqual([]);
    expect(ids('qqqqqqq')).toEqual([]);
  });
});

describe('ranking', () => {
  test('a name match outranks a mention in other fields', () => {
    const result = ids('ws2812');
    expect(result[0]).toBe('ws2812');
    // FastLED only mentions WS2812 in its text
    expect(result.indexOf('fastled')).toBeGreaterThan(result.indexOf('ws2812'));
  });

  test('an exact name beats a longer name that starts with it', () => {
    expect(ids('wled')[0]).toBe('wled');
  });

  test('maker matches rank below name matches but are found', () => {
    expectAll(ids('worldsemi'), ['ws2812', 'ws2815', 'ws2811']);
    expectAll(ids('pixelcontroller'), ['falcon-f16v4', 'falcon-f48']);
  });

  test('current products come before discontinued ones among equals', () => {
    const result = ids('art-net bridge');
    expect(result.indexOf('new-box')).toBeLessThan(result.indexOf('old-box'));
  });

  test('the limit is honored', () => {
    expect(searchIndex(index, 'w', 2).length).toBe(2);
  });
});

describe('highlighting', () => {
  test('marks literal occurrences of each term', () => {
    expect(highlightParts('Falcon F16V4', 'falc 16')).toEqual([
      { text: 'Falc', match: true },
      { text: 'on F', match: false },
      { text: '16', match: true },
      { text: 'V4', match: false },
    ]);
  });

  test('no query, no marks', () => {
    expect(highlightParts('Falcon', '')).toEqual([{ text: 'Falcon', match: false }]);
  });
});

describe('missing-page suggestions', () => {
  test('the last path segment becomes the query', () => {
    expect(queryFromPath('/pixels/ws2812b')).toBe('ws2812b');
    expect(queryFromPath('/controllers/falcon-f16-v4/')).toBe('falcon f16 v4');
    expect(queryFromPath('/old/page.html')).toBe('page');
    expect(queryFromPath('/')).toBe('');
    expect(queryFromPath('/a/%E0%A4%A')).toBe('%E0%A4%A');
  });
});
