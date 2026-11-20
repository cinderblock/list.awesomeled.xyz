import { describe, expect, test } from 'bun:test';
import { countFacet, facetKey, matchesFilter, type ModelColumn } from '../../app/lib/table-model';
import type { BaseEntry } from '../../app/lib/types';

// A column over a `tags` list, the shape of "works with" or "pixel ICs"
const column: ModelColumn = {
  key: 'tags',
  filterKind: 'select',
  values: (item) => (item as BaseEntry & { tags?: string[] }).tags ?? [],
  number: () => null,
  text: (item) => ((item as BaseEntry & { tags?: string[] }).tags ?? []).join(', '),
  sortKey: () => null,
  hasValue: (item) => ((item as BaseEntry & { tags?: string[] }).tags ?? []).length > 0,
};

const row = (id: string, tags: string[]) => ({ id, name: id, tags }) as unknown as BaseEntry;

describe('facetKey', () => {
  test('spellings of one name share a key', () => {
    for (const group of [
      ['Jinx', 'Jinx!', 'JINX!', 'jinx'],
      ['MadMapper', 'Mad Mapper', 'Madmapper'],
      ['SK6812 RGBW', 'SK6812RGBW', 'SK6812-RGBW', 'SK6812 (RGBW)'],
      ['APA-102', 'APA102', 'apa 102'],
      ['Light-o-Rama', 'Light-O-Rama'],
      ['GE ColorEffects', 'GE Color Effects'],
    ]) {
      expect(new Set(group.map(facetKey)).size).toBe(1);
    }
  });

  test('signs that carry meaning keep values apart', () => {
    expect(facetKey('C++')).not.toBe(facetKey('C#'));
    expect(facetKey('$$')).not.toBe(facetKey('$$$'));
    expect(facetKey('MAX3485CSA+')).not.toBe(facetKey('MAX3485CSA'));
    expect(facetKey('WS2812')).not.toBe(facetKey('WS2812B'));
    expect(facetKey('2.4GHz')).not.toBe(facetKey('24GHz'));
  });

  test('a value made only of ignored characters still has a key', () => {
    expect(facetKey('-')).toBe('-');
    expect(facetKey('!')).toBe('!');
  });
});

describe('countFacet', () => {
  const rows = [
    row('a', ['Jinx!', 'MADRIX']),
    row('b', ['Jinx', 'Madrix']),
    row('c', ['JINX!', 'Madrix']),
    row('d', ['Jinx!', 'xLights']),
  ];

  test('spellings are one option, shown as most often written, counted together', () => {
    expect(countFacet(column, rows)).toEqual([
      { value: 'Jinx!', count: 4 },
      { value: 'Madrix', count: 3 },
      { value: 'xLights', count: 1 },
    ]);
  });

  test('a row listing two spellings of a value counts once', () => {
    expect(countFacet(column, [row('a', ['APA102', 'APA-102'])])).toEqual([
      { value: 'APA102', count: 1 },
    ]);
  });
});

describe('matchesFilter', () => {
  test('ticking one spelling finds every spelling', () => {
    const filter = { selected: ['Jinx!'], exclude: false };
    expect(matchesFilter(column, row('a', ['JINX']), filter)).toBe(true);
    expect(matchesFilter(column, row('b', ['Jinx']), filter)).toBe(true);
    expect(matchesFilter(column, row('c', ['Madrix']), filter)).toBe(false);
  });

  test('excluding one spelling excludes every spelling', () => {
    const filter = { selected: ['SK6812 RGBW'], exclude: true };
    expect(matchesFilter(column, row('a', ['SK6812RGBW']), filter)).toBe(false);
    expect(matchesFilter(column, row('b', ['SK6812']), filter)).toBe(true);
  });
});
