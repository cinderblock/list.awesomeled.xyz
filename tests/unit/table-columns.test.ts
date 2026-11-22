import { describe, expect, test } from 'bun:test';
import { buildTableColumns } from '../../app/components/data/table-columns';
import { matchesFilter } from '../../app/lib/table-model';
import type { BaseEntry } from '../../app/lib/types';

const row = (kind?: unknown) =>
  ({ id: 'x', name: 'X', ...(kind === undefined ? {} : { kind }) }) as BaseEntry;

describe('labelled enum columns', () => {
  // pattern-driver.json `kind`: one value, or a list
  const kind = buildTableColumns('pattern-drivers', []).find((c) => c.key === 'kind')!;

  test('one value and a list both read under their labels', () => {
    expect(kind.values(row('live'))).toEqual(['Live / VJ']);
    expect(kind.values(row(['sequencer', 'player']))).toEqual(['Sequencer', 'Player']);
    expect(kind.values(row())).toEqual([]);
  });

  test('a filter on the label matches the raw value', () => {
    const filter = { selected: ['Live / VJ'], exclude: false };
    expect(matchesFilter(kind, row(['live', 'sequencer']), filter)).toBe(true);
    expect(matchesFilter(kind, row('player'), filter)).toBe(false);
  });
});
