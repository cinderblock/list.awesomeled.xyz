import { describe, expect, test } from 'bun:test';
import {
  buildRelationGraph,
  escapeFilterValue,
  fieldNames,
  inlineNameLinks,
  linksForEntry,
  makersOf,
  normalizeName,
  type Database,
  type LinkRow,
} from '../../app/lib/relations';
import type { BaseEntry } from '../../app/lib/types';
import { entry } from './fixtures';

// Synthetic database: names follow real parts so the rules read naturally,
// but nothing here is a fact about a real part.
const SOURCE = { url: 'https://example.com/ds.pdf', retrieved: '2026-11-18' };

const db: Database = new Map<string, BaseEntry[]>([
  [
    'pixel-ics',
    [
      entry('ws2811', {
        name: 'WS2811',
        creator: 'WorldSemi',
        aliases: ['WS281X'],
        data: { type: 'WS2811/12', clocked: false },
        related: [
          { type: 'variant', ref: 'pixel-ics/ws2811-v14', notes: 'newer die', source: SOURCE },
        ],
      }),
      entry('ws2811-v14', {
        name: 'WS2811 V1.4',
        creator: 'WorldSemi',
        data: { type: 'WS2811/12', clocked: false },
      }),
      entry('ws2801', {
        name: 'WS2801',
        creator: 'WorldSemi',
        data: { type: 'WS2801', clocked: true },
      }),
    ],
  ],
  [
    'pixels',
    [
      entry('ws2812', {
        name: 'WS2812',
        creator: 'WorldSemi',
        variants: [{ name: 'WS2812B' }],
        data: { type: 'WS2811/12', clocked: false },
      }),
      entry('apa102', {
        name: 'APA102',
        creator: 'APA Electronic',
        aliases: ['DotStar'],
        data: { type: 'APA102', clocked: true },
      }),
    ],
  ],
  [
    'controllers',
    [
      entry('box', {
        name: 'Box',
        creator: 'Acme LLC',
        outputs: { protocols: ['WS2812B', 'ws-2801', 'Mystery9000'], clocked: 'selectable' },
      }),
      entry('data-only', {
        name: 'Data Only',
        creator: 'Acme, Inc.',
        outputs: { protocols: ['WS2811'], clocked: false },
      }),
      entry('fw-only', { name: 'FW Only', software: { firmware: ['wled'] } }),
      entry('cape', {
        name: 'Cape',
        inputs: { requires_host: 'BeagleBone Black, or PocketBeagle' },
        outputs: { connector: { ref: 'no-such-connector' } },
      }),
    ],
  ],
  ['drive-libraries', [entry('wled', { name: 'WLED', supported_ics: ['WS281X', 'DotStar'] })]],
  [
    'microboards',
    [
      entry('bbb', {
        name: 'BeagleBone Black',
        creator: 'beagleboard.org',
        related: [
          { type: 'related', ref: 'microboards/pocketbeagle' },
          { type: 'related', ref: 'microboards/gone' },
        ],
      }),
      entry('pocketbeagle', { name: 'PocketBeagle', creator: 'beagleboard.org' }),
      entry('bbg', { name: 'BeagleBone Green', creator: 'BeagleBoard.org' }),
    ],
  ],
]);

const graph = buildRelationGraph(db);
const byId = (ref: string) => {
  const [category, id] = ref.split('/');
  return db.get(category)!.find((e) => e.id === id)!;
};
const links = (ref: string) => linksForEntry(graph, ref, byId(ref));
const rowOf = (rows: LinkRow[], label: string, subject?: string) =>
  rows.find((r) => r.label === label && r.subject === subject);
const namesIn = (row?: LinkRow) => row?.items.map((i) => i.name) ?? [];

describe('names', () => {
  test('match case-, space- and punctuation-insensitively, keeping +', () => {
    expect(normalizeName('APA-102')).toBe('apa102');
    expect(normalizeName('WS2812 B')).toBe('ws2812b');
    expect(normalizeName('QLC+')).toBe('qlc+');
  });

  test('a single-string field lists names separated by commas', () => {
    expect(fieldNames('PocketBeagle, PocketBeagle 2')).toEqual(['PocketBeagle', 'PocketBeagle 2']);
    expect(fieldNames('a Mac, or a Node')).toEqual(['a Mac', 'a Node']);
    expect(fieldNames(['WS2811, 400kHz', 7])).toEqual(['WS2811, 400kHz']);
    expect(fieldNames(undefined)).toEqual([]);
  });

  test('resolve through variant names and aliases', () => {
    const drives = graph.outgoing.get('controllers/box')!.filter((e) => e.kind === 'drives');
    expect(drives.map((e) => [e.to, e.via])).toEqual([
      ['pixels/ws2812', 'WS2812B'],
      ['pixel-ics/ws2801', 'ws-2801'],
    ]);
    const supports = graph.outgoing.get('drive-libraries/wled')!.map((e) => e.to);
    expect(supports).toEqual(['pixel-ics/ws2811', 'pixels/apa102']);
  });

  test('names with no entry are reported, not linked', () => {
    const unresolved = graph.unresolved.map((u) => `${u.from} ${u.field} ${u.name}`);
    expect(unresolved).toEqual(['controllers/box outputs.protocols Mystery9000']);
  });

  test('refs to missing entries are dangling', () => {
    const problems = graph.dangling.map((d) => `${d.from} ${d.field} ${d.ref}`);
    expect(problems).toContain('controllers/cape outputs.connector.ref no-such-connector');
    expect(problems).toContain('microboards/bbb related microboards/gone');
  });

  test('a page shows each field name in place, linked where it resolves', () => {
    const inline = inlineNameLinks(graph, 'controllers', byId('controllers/box'));
    expect(inline['outputs.protocols']['Mystery9000']).toEqual([]);
    expect(inline['outputs.protocols']['WS2812B'].map((i) => `${i.category}/${i.id}`)).toEqual([
      'pixels/ws2812',
    ]);
  });
});

describe('makers', () => {
  test('legal forms and punctuation spell one maker', () => {
    expect(makersOf(entry('a', { creator: 'Acme, Inc.' }))).toEqual([
      { key: 'acme', label: 'Acme' },
    ]);
    expect(makersOf(entry('b', { creator: 'Acme LLC' }))[0].key).toBe('acme');
  });

  test('a slash or comma lists several makers', () => {
    const keys = makersOf(entry('c', { creator: 'WorldSemi/Newstar' })).map((m) => m.key);
    expect(keys).toEqual(['worldsemi', 'newstar']);
  });

  test("the label is the data's most common spelling", () => {
    expect(graph.makers.get('beagleboardorg')?.label).toBe('beagleboard.org');
  });
});

describe('linked summary', () => {
  test('listed pixels grow by protocol family, keeping the maker spelling', () => {
    expect(new Set(graph.linked.get('controllers/box')?.pixels)).toEqual(
      new Set(['Mystery9000', 'ws-2801', 'WS2801', 'WS2811', 'WS2811 V1.4', 'WS2812', 'WS2812B'])
    );
  });

  test('a data-only output drops clocked parts', () => {
    expect(graph.linked.get('controllers/data-only')?.pixels).toEqual([
      'WS2811',
      'WS2811 V1.4',
      'WS2812',
    ]);
  });

  test("with no pixels listed, the firmware's supported parts stand in", () => {
    const s = graph.linked.get('controllers/fw-only');
    expect(s?.pixelsVia).toEqual(['WLED']);
    expect(s?.pixels).toContain('APA102');
    expect(s?.pixels).toContain('WS2812');
  });

  test('pixels count the hardware and libraries that can drive them', () => {
    const s = graph.linked.get('pixels/ws2812');
    expect(s?.hardware).toBe(3);
    expect(s?.hardwareBy).toEqual({ controllers: 3 });
    expect(s?.libraries).toBe(1);
  });

  test('boards count what they host', () => {
    expect(graph.linked.get('microboards/bbb')?.hosts).toBe(1);
  });
});

describe('entry page rows', () => {
  test('reverse links say which name the declaring entry used', () => {
    const driven = rowOf(links('pixels/ws2812').worksWith, 'Driven by');
    expect(driven?.items.map((i) => [i.id, i.via])).toEqual([['box', 'WS2812B']]);
    // listed under its own name: nothing to add
    const ws2811 = rowOf(links('pixel-ics/ws2811').worksWith, 'Driven by');
    expect(ws2811?.items.map((i) => [i.id, i.via])).toEqual([['data-only', undefined]]);
  });

  test('same-protocol parts are a row named after the family', () => {
    const row = rowOf(links('pixel-ics/ws2811').worksWith, 'Same protocol', '(WS2811/12)');
    expect(namesIn(row)).toEqual(['WS2811 V1.4', 'WS2812']);
  });

  test('all compatible hardware is one filtered-table link per category, explained once', () => {
    const row = rowOf(links('pixels/ws2812').worksWith, 'All compatible hardware');
    expect(row?.items).toEqual([
      { name: '3 controllers', to: '/controllers?f=linked.pixels:WS2812' },
    ]);
    expect(row?.note).toBeTruthy();
  });

  test('firmware-inferred pixels name the firmware', () => {
    const row = rowOf(links('controllers/fw-only').worksWith, 'Drives', '(via WLED)');
    expect(namesIn(row)).toEqual(['WS2811', 'APA102']);
  });

  test('curated links carry their notes and source', () => {
    const variants = rowOf(links('pixel-ics/ws2811').family, 'Variants');
    expect(variants?.items).toHaveLength(1);
    expect(variants?.items[0]).toMatchObject({
      name: 'WS2811 V1.4',
      notes: 'newer die',
      source: SOURCE,
    });
    // and read the same from the other end
    expect(namesIn(rowOf(links('pixel-ics/ws2811-v14').family, 'Variants'))).toEqual(['WS2811']);
  });

  test('"More from" leaves out what the family rows already show', () => {
    const family = links('pixel-ics/ws2811').family;
    expect(namesIn(rowOf(family, 'More from', 'WorldSemi'))).toEqual(['WS2801', 'WS2812']);
    const pocket = links('microboards/pocketbeagle').family;
    expect(pocket.map((r) => r.label)).toEqual(['Related', 'More from']);
    expect(namesIn(rowOf(pocket, 'More from', 'beagleboard.org'))).toEqual(['BeagleBone Green']);
    // with no other family rows, it lists every other board
    const bbg = links('microboards/bbg').family;
    expect(namesIn(rowOf(bbg, 'More from', 'beagleboard.org'))).toEqual([
      'BeagleBone Black',
      'PocketBeagle',
    ]);
  });

  test('"More from" disappears when the family rows show everything', () => {
    const boards = new Map([['microboards', db.get('microboards')!.slice(0, 2)]]);
    const solo = linksForEntry(
      buildRelationGraph(boards),
      'microboards/bbb',
      byId('microboards/bbb')
    );
    expect(solo.family.map((r) => r.label)).toEqual(['Related']);
  });

  test('a host board lists what it hosts, whichever of several hosts it is', () => {
    expect(namesIn(rowOf(links('microboards/bbb').worksWith, 'Host for'))).toEqual(['Cape']);
    expect(namesIn(rowOf(links('microboards/pocketbeagle').worksWith, 'Host for'))).toEqual([
      'Cape',
    ]);
  });
});

test('filter values escape the table URL syntax', () => {
  expect(escapeFilterValue('WS2811/12-B:x|y,z')).toBe('WS2811/12\\-B\\:x\\|y\\,z');
});
