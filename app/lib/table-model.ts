/**
 * The table's data logic, free of React: which rows pass the filters, how
 * many rows each facet value would leave, what a row's searchable text is and
 * how rows order. Columns are described by plain accessor functions so this
 * works for hand-written and catalog-generated columns alike.
 */

import type { BaseEntry } from './types';
import {
  isBooleanFilter,
  isDateFilter,
  isFilterActive,
  isNumericFilter,
  isPresenceFilter,
  isSelectFilter,
  isStringFilter,
  type FilterKind,
  type FilterState,
  type FilterValue,
  type SortLayer,
} from './table-state';

/** The accessors the model needs from a column. */
export interface ModelColumn {
  key: string;
  filterKind?: FilterKind;
  /** Discrete values (select filters, facets) */
  values: (item: BaseEntry) => string[];
  /** Comparable number (numeric filters) */
  number: (item: BaseEntry) => number | null;
  /** Plain text of the cell */
  text: (item: BaseEntry) => string;
  /** Sort key; null sorts last */
  sortKey: (item: BaseEntry) => number | string | null;
  hasValue: (item: BaseEntry) => boolean;
  /** For date filters */
  date?: (item: BaseEntry) => Date | null;
  /** For boolean filters: the raw true/false (null when unknown) */
  bool?: (item: BaseEntry) => boolean | null;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

const lower = (s: string) => s.toLowerCase();

/** Does one row pass one column's filter? */
export function matchesFilter(col: ModelColumn, item: BaseEntry, value: FilterValue): boolean {
  if (!isFilterActive(value)) return true;

  if (isPresenceFilter(value)) return col.hasValue(item) === value.present;

  if (isSelectFilter(value)) {
    const selected = new Set(value.selected.map(lower));
    const has = col.values(item).some((v) => selected.has(lower(v)));
    return value.exclude ? !has : has;
  }

  if (isNumericFilter(value)) {
    const n = col.number(item);
    // Unknown values stay visible unless the filter is strict: a missing
    // price is not evidence the product is out of range
    if (n == null) return !value.strict;
    if (value.min !== undefined && n < value.min) return false;
    if (value.max !== undefined && n > value.max) return false;
    return true;
  }

  if (isBooleanFilter(value)) {
    if (value.value === null) return true;
    const b = col.bool ? col.bool(item) : null;
    if (b !== null) return b === value.value;
    // Columns without a raw boolean: compare the Yes/No facet value
    const want = value.value ? 'yes' : 'no';
    return col.values(item).some((v) => lower(v) === want);
  }

  if (isDateFilter(value)) {
    const date = col.date?.(item) ?? null;
    if (!date || Number.isNaN(date.getTime())) return true; // don't drop unknown dates
    return date.getTime() >= new Date(`${value.since}T00:00:00`).getTime();
  }

  if (isStringFilter(value)) {
    const text = lower(col.text(item));
    const needle = lower(value.value.trim());
    if (!needle) return true;
    if (value.fuzzy) return needle.split(/\s+/).every((term) => text.includes(term));
    return text.includes(needle);
  }

  return true;
}

/**
 * Rows passing every active filter. `except` leaves one column's filter out —
 * that is how a facet counts what selecting one of its values would give.
 */
export function applyFilters<T extends BaseEntry>(
  rows: T[],
  columns: Map<string, ModelColumn>,
  filters: FilterState,
  except?: string
): T[] {
  const active = Object.entries(filters).filter(
    ([key, value]) => key !== except && isFilterActive(value) && columns.has(key)
  );
  if (active.length === 0) return rows;
  return rows.filter((row) =>
    active.every(([key, value]) => matchesFilter(columns.get(key)!, row, value))
  );
}

export interface FacetOption {
  value: string;
  count: number;
}

/**
 * The values of a column across `rows` with how many rows have each. Values
 * differing only by case are one option (shown in its most common spelling).
 * Ordered by count, then alphabetically.
 */
export function countFacet(col: ModelColumn, rows: BaseEntry[]): FacetOption[] {
  const groups = new Map<string, { spellings: Map<string, number>; count: number }>();
  for (const row of rows) {
    // A row counts once per value even if it lists the value twice
    const seen = new Set<string>();
    for (const value of col.values(row)) {
      const key = lower(value);
      if (seen.has(key)) continue;
      seen.add(key);
      let group = groups.get(key);
      if (!group) groups.set(key, (group = { spellings: new Map(), count: 0 }));
      group.count++;
      group.spellings.set(value, (group.spellings.get(value) ?? 0) + 1);
    }
  }
  const options: FacetOption[] = [];
  for (const group of groups.values()) {
    const [value] = [...group.spellings.entries()].sort((a, b) => b[1] - a[1])[0];
    options.push({ value, count: group.count });
  }
  return options.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

/** Min and max of a numeric column over `rows` (null when no row has a number). */
export function numericRange(
  col: ModelColumn,
  rows: BaseEntry[]
): { min: number; max: number; known: number } | null {
  let min = Infinity;
  let max = -Infinity;
  let known = 0;
  for (const row of rows) {
    const n = col.number(row);
    if (n == null) continue;
    known++;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  return known > 0 ? { min, max, known } : null;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

// Keys whose values are never useful search text
const UNSEARCHED_KEYS = new Set(['id', 'updated', 'image', 'images', 'dead_links', 'sha256']);

/**
 * Everything a person might type to find this entry: every string and number
 * in it, plus map keys ("Ethernet", "Wi-Fi"). URLs contribute their host
 * only, so "tindie" finds what is sold there without matching path noise.
 */
export function buildSearchText(item: BaseEntry): string {
  const parts: string[] = [];
  const visit = (value: unknown, depth: number) => {
    if (value == null || depth > 8) return;
    if (typeof value === 'string') {
      if (/^https?:\/\//.test(value)) {
        try {
          parts.push(new URL(value).hostname.replace(/^www\./, ''));
        } catch {
          // not a real URL: skip
        }
      } else {
        parts.push(value);
      }
    } else if (typeof value === 'number') {
      parts.push(String(value));
    } else if (Array.isArray(value)) {
      for (const child of value) visit(child, depth + 1);
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      for (const [key, child] of Object.entries(value)) {
        if (UNSEARCHED_KEYS.has(key)) continue;
        // A map key is a fact when its value is truthy ({Ethernet: true})
        if (child === true || (typeof child === 'string' && depth > 0)) parts.push(key);
        visit(child, depth + 1);
      }
    }
  };
  visit(item, 0);
  return parts.join('\n').toLowerCase();
}

/** Split a query into lower-cased terms; every term must match. */
export function searchTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesSearch(text: string, terms: string[]): boolean {
  return terms.every((term) => text.includes(term));
}

/**
 * How well a matching row answers the query: name hits outrank creator hits,
 * which outrank hits buried in other fields. Used to order results when the
 * person has not chosen a sort.
 */
export function searchScore(item: BaseEntry, terms: string[]): number {
  const name = String(item.name ?? '').toLowerCase();
  const creatorRaw = item.creator;
  const creator = (
    typeof creatorRaw === 'string'
      ? creatorRaw
      : creatorRaw && typeof creatorRaw === 'object'
        ? String((creatorRaw as { name?: unknown }).name ?? '')
        : ''
  ).toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (name === term) score += 100;
    else if (name.startsWith(term)) score += 50;
    else if (new RegExp(`(^|[^a-z0-9])${escapeRegExp(term)}`).test(name)) score += 30;
    else if (name.includes(term)) score += 20;
    else if (creator.includes(term)) score += 8;
    else score += 1;
  }
  return score;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

/** Order two sort keys ascending: numbers before text, nulls handled by the caller. */
export function compareSortKeys(a: number | string, b: number | string): number {
  const aNum = typeof a === 'number';
  const bNum = typeof b === 'number';
  if (aNum && bNum) return a - b;
  if (aNum !== bNum) return aNum ? -1 : 1;
  return (a as string).localeCompare(b as string, 'en', { numeric: true, sensitivity: 'base' });
}

/**
 * Sort through every layer; ties fall through to the next layer. Missing
 * values always sort last, whatever the direction. The sort is stable, so
 * rows that tie on everything keep their incoming order.
 */
export function sortRows<T extends BaseEntry>(
  rows: T[],
  layers: SortLayer[],
  columns: Map<string, ModelColumn>
): T[] {
  const active = layers.filter((layer) => columns.has(layer.key));
  if (active.length === 0) return rows;
  // Compute each row's keys once
  const keyed = rows.map((row) => ({
    row,
    keys: active.map((layer) => columns.get(layer.key)!.sortKey(row)),
  }));
  keyed.sort((a, b) => {
    for (let i = 0; i < active.length; i++) {
      const ak = a.keys[i];
      const bk = b.keys[i];
      if (ak == null && bk == null) continue;
      if (ak == null) return 1;
      if (bk == null) return -1;
      const cmp = compareSortKeys(ak, bk);
      if (cmp !== 0) return active[i].dir === 'desc' ? -cmp : cmp;
    }
    return 0;
  });
  return keyed.map((k) => k.row);
}
