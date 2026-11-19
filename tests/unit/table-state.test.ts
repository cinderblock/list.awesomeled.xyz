import { describe, expect, test } from 'bun:test';
import {
  cycleSort,
  escapeFilterValue,
  getFilterDescription,
  isFilterActive,
  parseCols,
  parseFilters,
  parseSort,
  resolveVisibleColumns,
  selectFilterHref,
  serializeCols,
  serializeFilters,
  serializeSort,
  unescapeFilterValue,
  type FilterKind,
  type FilterState,
  type SortDirection,
} from '../../app/lib/table-state';

const kinds: Record<string, FilterKind> = {
  status: 'select',
  'inputs.protocols': 'select',
  'capabilities.visualizer': 'select',
  wled_compatible: 'boolean',
  price: 'numeric',
  'data.bitrate': 'numeric',
  updated: 'date',
  notes: 'string',
};
const kindOf = (key: string) => kinds[key];

describe('filter grammar', () => {
  test('round-trips every filter shape', () => {
    const filters: FilterState = {
      status: { selected: ['active', 'limited'], exclude: false },
      'inputs.protocols': { selected: ['Art-Net'], exclude: true },
      wled_compatible: { value: true },
      price: { min: 100, max: 500 },
      updated: { since: '2026-01-01' },
      notes: { value: 'art-net bridge', fuzzy: true },
    };
    const serialized = serializeFilters(filters);
    expect(serialized).toBe(
      'status:active,limited|inputs.protocols:!Art\\-Net|wled_compatible:yes|price:100-500|updated:2026-01-01..|notes:~art\\-net bridge'
    );
    expect(parseFilters(serialized, { kindOf })).toEqual(filters);
  });

  test('legacy links without type information still parse', () => {
    expect(parseFilters('status:!discontinued,end\\-of\\-life')).toEqual({
      status: { selected: ['discontinued', 'end-of-life'], exclude: true },
    });
    expect(parseFilters('price:100-')).toEqual({ price: { min: 100, max: undefined } });
    expect(parseFilters('price:-500')).toEqual({ price: { min: undefined, max: 500 } });
    expect(parseFilters('wled_compatible:no')).toEqual({ wled_compatible: { value: false } });
    expect(parseFilters('updated:2026-01-01..')).toEqual({ updated: { since: '2026-01-01' } });
  });

  test('a select option spelled like another filter type stays a select value', () => {
    // "yes" on a select column is an option, not a boolean
    expect(parseFilters('capabilities.visualizer:yes', { kindOf })).toEqual({
      'capabilities.visualizer': { selected: ['yes'], exclude: false },
    });
    // an unescaped hyphenated option is not a numeric range
    expect(parseFilters('status:end-of-life', { kindOf })).toEqual({
      status: { selected: ['end-of-life'], exclude: false },
    });
    expect(parseFilters('status:5-12', { kindOf })).toEqual({
      status: { selected: ['5-12'], exclude: false },
    });
  });

  test('hyphenated words are never read as a range, even untyped', () => {
    expect(parseFilters('status:end-of-life')).toEqual({
      status: { selected: ['end-of-life'], exclude: false },
    });
  });

  test('numeric ranges accept units and the strict marker', () => {
    expect(parseFilters('data.bitrate:800kHz-30MHz', { kindOf })).toEqual({
      'data.bitrate': { min: 800_000, max: 30_000_000 },
    });
    expect(parseFilters('price:100-500!', { kindOf })).toEqual({
      price: { min: 100, max: 500, strict: true },
    });
    expect(serializeFilters({ price: { min: 100, max: undefined, strict: true } })).toBe(
      'price:100-!'
    );
  });

  test('numeric bounds are formatted by the caller when asked', () => {
    const out = serializeFilters(
      { 'data.bitrate': { min: 800_000, max: 30_000_000 } },
      { formatNumber: (_key, n) => (n >= 1e6 ? `${n / 1e6}MHz` : `${n / 1e3}kHz`) }
    );
    expect(out).toBe('data.bitrate:800kHz-30MHz');
  });

  test('presence filters work on any column', () => {
    expect(parseFilters('price:*|notes:!*', { kindOf })).toEqual({
      price: { present: true },
      notes: { present: false },
    });
    expect(serializeFilters({ price: { present: true }, notes: { present: false } })).toBe(
      'price:*|notes:!*'
    );
  });

  test('special characters in values survive a round trip', () => {
    const tricky = 'a|b:c,d~e!f-g*h\\i';
    expect(unescapeFilterValue(escapeFilterValue(tricky))).toBe(tricky);
    const filters: FilterState = { status: { selected: [tricky, 'plain'], exclude: false } };
    expect(parseFilters(serializeFilters(filters), { kindOf })).toEqual(filters);
  });

  test('malformed input is dropped, never thrown', () => {
    expect(parseFilters('')).toEqual({});
    expect(parseFilters(null)).toEqual({});
    expect(parseFilters('nocolon|:novalue|key:')).toEqual({});
    expect(parseFilters('wled_compatible:maybe', { kindOf })).toEqual({});
    expect(parseFilters('price:cheap', { kindOf })).toEqual({});
    expect(parseFilters('updated:yesterday', { kindOf })).toEqual({});
  });

  test('inactive filters are not serialized', () => {
    expect(
      serializeFilters({
        status: { selected: [], exclude: false },
        wled_compatible: { value: null },
        notes: { value: '  ', fuzzy: false },
        price: { min: undefined, max: undefined },
      })
    ).toBe('');
    expect(isFilterActive(undefined)).toBe(false);
    expect(isFilterActive({ present: false })).toBe(true);
  });

  test('descriptions read naturally', () => {
    expect(getFilterDescription({ selected: ['a', 'b', 'c'], exclude: true })).toBe(
      'not 3 selected'
    );
    expect(getFilterDescription({ min: 1000, max: undefined })).toBe('≥ 1,000');
    expect(getFilterDescription({ min: 5, max: 12, strict: true })).toBe('5 – 12 (known only)');
    expect(getFilterDescription({ value: false }, { falseLabel: 'Proprietary' })).toBe(
      'Proprietary'
    );
    expect(getFilterDescription({ present: false })).toBe('no value');
  });

  test('filter links escape the value', () => {
    expect(selectFilterHref('/controllers', 'inputs.protocols', 'Art-Net')).toBe(
      '/controllers?f=inputs.protocols:Art\\-Net'
    );
  });
});

describe('sort layers', () => {
  const defaults: Record<string, SortDirection> = { updated: 'desc' };
  const defaultDirFor = (key: string): SortDirection => defaults[key] ?? 'asc';

  test('parse and serialize layered sorts', () => {
    const layers = parseSort('price*name.*updated', defaultDirFor);
    expect(layers).toEqual([
      { key: 'price', dir: 'asc' },
      { key: 'name', dir: 'desc' },
      { key: 'updated', dir: 'desc' },
    ]);
    expect(serializeSort(layers, defaultDirFor)).toBe('price*name.*updated');
    expect(serializeSort([], defaultDirFor)).toBeNull();
  });

  test('legacy dir param applies to the first layer only', () => {
    expect(parseSort('price*name', defaultDirFor, 'desc')).toEqual([
      { key: 'price', dir: 'desc' },
      { key: 'name', dir: 'asc' },
    ]);
  });

  test('duplicate layers are ignored', () => {
    expect(parseSort('price*price.', defaultDirFor)).toEqual([{ key: 'price', dir: 'asc' }]);
  });

  test('plain clicks cycle default → reversed → off', () => {
    let layers = cycleSort([], 'price', 'asc');
    expect(layers).toEqual([{ key: 'price', dir: 'asc' }]);
    layers = cycleSort(layers, 'price', 'asc');
    expect(layers).toEqual([{ key: 'price', dir: 'desc' }]);
    layers = cycleSort(layers, 'price', 'asc');
    expect(layers).toEqual([]);
  });

  test('a plain click replaces other layers', () => {
    const layers = cycleSort([{ key: 'price', dir: 'asc' }], 'updated', 'desc');
    expect(layers).toEqual([{ key: 'updated', dir: 'desc' }]);
  });

  test('a plain click on a tie-break column promotes it to the primary sort', () => {
    const layers = cycleSort(
      [
        { key: 'price', dir: 'asc' },
        { key: 'name', dir: 'desc' },
      ],
      'name',
      'asc'
    );
    expect(layers).toEqual([{ key: 'name', dir: 'asc' }]);
  });

  test('shift-clicks add, flip and remove a tie-break level', () => {
    let layers = cycleSort([{ key: 'price', dir: 'asc' }], 'name', 'asc', true);
    expect(layers).toEqual([
      { key: 'price', dir: 'asc' },
      { key: 'name', dir: 'asc' },
    ]);
    layers = cycleSort(layers, 'name', 'asc', true);
    expect(layers).toEqual([
      { key: 'price', dir: 'asc' },
      { key: 'name', dir: 'desc' },
    ]);
    layers = cycleSort(layers, 'name', 'asc', true);
    expect(layers).toEqual([{ key: 'price', dir: 'asc' }]);
  });
});

describe('columns', () => {
  const defaults = ['links', 'name', 'creator', 'price'];
  const known = (key: string) => [...defaults, 'power.voltage.max', 'notes'].includes(key);

  test('the default view serializes to nothing', () => {
    expect(serializeCols(defaults, defaults)).toBeNull();
    expect(serializeCols(['name', 'price'], defaults)).toBe('name,price');
    // same set, different order is a different view
    expect(serializeCols(['name', 'links', 'creator', 'price'], defaults)).toBe(
      'name,links,creator,price'
    );
  });

  test('parse drops empties and duplicates', () => {
    expect(parseCols('name,,price,name')).toEqual(['name', 'price']);
    expect(parseCols('')).toBeNull();
    expect(parseCols(null)).toBeNull();
  });

  test('unknown columns are dropped and the name column is always shown', () => {
    expect(resolveVisibleColumns(null, defaults, known)).toEqual(defaults);
    expect(resolveVisibleColumns(['price', 'bogus', 'notes'], defaults, known)).toEqual([
      'name',
      'price',
      'notes',
    ]);
    // name goes back after the leading columns that are still shown
    expect(resolveVisibleColumns(['links', 'price'], defaults, known)).toEqual([
      'links',
      'name',
      'price',
    ]);
  });
});
