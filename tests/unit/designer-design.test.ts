import { describe, expect, test } from 'bun:test';
import {
  addGroup,
  DEFAULTS,
  describeLayout,
  designQuery,
  duplicateGroup,
  emptyDesign,
  isEmptyDesign,
  layoutTotal,
  LIMITS,
  parseDesign,
  parseLayout,
  removeGroup,
  serializeDesign,
  stringLengths,
  updateGroup,
  type Design,
} from '../../app/lib/designer';

const parse = (query: string) => parseDesign(new URLSearchParams(query));

describe('links from the first version of the designer', () => {
  test('a single group', () => {
    const design = parse('p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights');
    expect(design.groups).toHaveLength(1);
    expect(design.groups[0]).toMatchObject({
      pixel: 'ws2812',
      controller: 'falcon-f16v5',
      layout: { strings: 8, perString: 500 },
      shifter: '',
      connector: '',
      voltage: null,
      name: '',
    });
    expect(design.source).toBe('xlights');
    expect(design.brightness).toBe(100);
    expect(design.targetFps).toBe(30);
  });

  test('several groups, aligned by position', () => {
    const design = parse('p=ws2812&x=2&n=100&c=a&p=apa102&x=1&n=60&c=&g=standalone');
    expect(design.groups.map((g) => g.pixel)).toEqual(['ws2812', 'apa102']);
    expect(design.groups.map((g) => g.controller)).toEqual(['a', '']);
    expect(design.groups[1].layout).toEqual({ strings: 1, perString: 60 });
    expect(design.source).toBe('standalone');
  });

  test('per-string lengths are dot separated', () => {
    const design = parse('p=ws2812&x=3&n=150.200.80&c=');
    expect(design.groups[0].layout).toEqual({
      strings: 3,
      perString: 200,
      lengths: [150, 200, 80],
    });
    expect(layoutTotal(design.groups[0].layout)).toBe(430);
  });

  test('the shortest possible link still works', () => {
    const design = parse('p=ws2812&n=500');
    expect(design.groups[0].layout).toEqual({ strings: 1, perString: 500 });
  });

  test('a dev board keeps its prefix', () => {
    expect(parse('p=ws2812&c=mb-esp-32s').groups[0].controller).toBe('mb-esp-32s');
  });
});

describe('parsing', () => {
  test('no parameters is the empty design', () => {
    expect(parse('')).toEqual(emptyDesign());
    expect(isEmptyDesign(parse(''))).toBe(true);
  });

  test('a controller-only link makes a group', () => {
    const design = parse('c=falcon-f16v5');
    expect(design.groups).toHaveLength(1);
    expect(design.groups[0].pixel).toBe('');
    expect(design.groups[0].controller).toBe('falcon-f16v5');
  });

  test('new per-group keys', () => {
    const design = parse('p=ic-ws2811&x=4&n=100&c=x&v=12&l=quad&k=pigtail&gn=Roof+line');
    expect(design.groups[0]).toMatchObject({
      pixel: 'ic-ws2811',
      voltage: 12,
      shifter: 'quad',
      connector: 'pigtail',
      name: 'Roof line',
    });
  });

  test('system keys', () => {
    const design = parse('p=a&b=30&f=60&a=5&w=7.5&o=1&t=My+show');
    expect(design).toMatchObject({
      brightness: 30,
      targetFps: 60,
      feedAmps: 5,
      wireMeters: 7.5,
      outdoor: true,
      title: 'My show',
    });
  });

  test('nonsense falls back to defaults and limits', () => {
    const design = parse('p=a&x=abc&n=-5&b=900&f=0&a=-1&w=nope&v=zero');
    expect(design.groups[0].layout).toEqual({ strings: 1, perString: DEFAULTS.perString });
    expect(design.groups[0].voltage).toBeNull();
    expect(design.brightness).toBe(100);
    expect(design.targetFps).toBe(DEFAULTS.targetFps);
    expect(design.feedAmps).toBe(DEFAULTS.feedAmps);
    expect(design.wireMeters).toBe(DEFAULTS.wireMeters);

    expect(parse('p=a&x=99999&n=99999999').groups[0].layout).toEqual({
      strings: LIMITS.strings,
      perString: LIMITS.perString,
    });
    expect(parse('p=a&b=0.2').brightness).toBe(1);
  });

  test('group count is capped', () => {
    const query = Array.from({ length: 40 }, () => 'p=a&x=1&n=10&c=').join('&');
    expect(parse(query).groups).toHaveLength(LIMITS.groups);
  });

  test('free text is cleaned and capped', () => {
    const design = parse(
      `t=${encodeURIComponent('  a\tb\n\u0007c  ')}&p=a&gn=${encodeURIComponent('x'.repeat(200))}`
    );
    expect(design.title).toBe('a b c');
    expect(design.groups[0].name).toHaveLength(LIMITS.groupName);
  });
});

describe('serializing', () => {
  test('the empty design has no query string', () => {
    expect(designQuery(emptyDesign())).toBe('');
  });

  test('defaults are left out', () => {
    const design = updateGroup(emptyDesign(), 0, { pixel: 'ws2812' });
    expect(designQuery(design)).toBe('p=ws2812&x=1&n=150&c=');
  });

  test('a first-generation link survives a round trip unchanged', () => {
    const query = 'p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights';
    expect(designQuery(parse(query))).toBe(query);
  });

  test('optional per-group keys are written for every group or none', () => {
    let design = parse('p=a&x=1&n=10&c=&p=b&x=2&n=20&c=');
    design = updateGroup(design, 1, { shifter: 'quad', name: 'Tree' });
    const params = serializeDesign(design);
    expect(params.getAll('l')).toEqual(['', 'quad']);
    expect(params.getAll('gn')).toEqual(['', 'Tree']);
    expect(params.has('k')).toBe(false);
    expect(params.has('v')).toBe(false);
    // and it parses back to the same thing
    expect(parseDesign(params)).toEqual(design);
  });

  test('everything round-trips', () => {
    const design: Design = {
      title: 'Yard & house, 2026',
      groups: [
        {
          pixel: 'ic-ws2811',
          voltage: 12,
          layout: { strings: 3, perString: 200, lengths: [150, 200, 80] },
          controller: 'falcon-f16v5',
          shifter: '',
          connector: 'pigtails',
          name: 'Roof line',
        },
        {
          pixel: 'apa102',
          voltage: null,
          layout: { strings: 4, perString: 144 },
          controller: 'mb-esp-32s',
          shifter: 'sn74ahct125n',
          connector: '',
          name: '',
        },
      ],
      source: 'xlights',
      brightness: 30,
      targetFps: 40,
      feedAmps: 3.5,
      wireMeters: 4.25,
      outdoor: true,
    };
    const query = designQuery(design);
    expect(parse(query)).toEqual(design);
    // and the canonical form is stable
    expect(designQuery(parse(query))).toBe(query);
  });
});

describe('layouts', () => {
  test('parseLayout accepts commas, spaces and plus signs', () => {
    expect(parseLayout('', '150, 200 +80').lengths).toEqual([150, 200, 80]);
    expect(parseLayout('4', '250')).toEqual({ strings: 4, perString: 250 });
    expect(parseLayout('', '')).toEqual({ strings: 1, perString: DEFAULTS.perString });
  });

  test('a single listed length is a uniform layout', () => {
    expect(parseLayout('3', '150.')).toEqual({ strings: 3, perString: 150 });
  });

  test('helpers', () => {
    const uniform = { strings: 4, perString: 250 };
    const varied = { strings: 3, perString: 200, lengths: [150, 200, 80] };
    expect(layoutTotal(uniform)).toBe(1000);
    expect(stringLengths(uniform)).toEqual([250, 250, 250, 250]);
    expect(stringLengths(varied)).toEqual([150, 200, 80]);
    expect(describeLayout(uniform)).toBe('4 × 250');
    expect(describeLayout(varied)).toBe('3 strings (150 + 200 + 80)');
    expect(describeLayout({ strings: 2, perString: 1500 })).toBe('2 × 1,500');
  });
});

describe('edits', () => {
  const base = parse('p=a&x=1&n=10&c=x&p=b&x=2&n=20&c=y');

  test('updateGroup changes one group only', () => {
    const next = updateGroup(base, 1, { controller: 'z' });
    expect(next.groups[1].controller).toBe('z');
    expect(next.groups[0]).toEqual(base.groups[0]);
    expect(base.groups[1].controller).toBe('y'); // not mutated
  });

  test('addGroup appends, up to the limit', () => {
    expect(addGroup(base).groups).toHaveLength(3);
    let full = base;
    for (let i = 0; i < 40; i++) full = addGroup(full);
    expect(full.groups).toHaveLength(LIMITS.groups);
  });

  test('duplicateGroup copies in place without sharing the layout', () => {
    const next = duplicateGroup(base, 0);
    expect(next.groups.map((g) => g.pixel)).toEqual(['a', 'a', 'b']);
    expect(next.groups[1].layout).toEqual(base.groups[0].layout);
    expect(next.groups[1].layout).not.toBe(base.groups[0].layout);
  });

  test('removing the last group leaves an empty one', () => {
    expect(removeGroup(base, 0).groups.map((g) => g.pixel)).toEqual(['b']);
    const single = parse('p=a&x=1&n=10&c=x');
    expect(removeGroup(single, 0).groups).toEqual(emptyDesign().groups);
  });
});
