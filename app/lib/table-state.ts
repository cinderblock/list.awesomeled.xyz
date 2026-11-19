/**
 * URL / storage state for category tables: filters, sort layers and visible
 * columns. Pure functions (no React, no DOM), shared by the table, entry
 * pages and anything that builds a link into a table view.
 *
 * URL grammar (all of it survives URL encoding untouched):
 *
 *   ?q=<search text>
 *   ?sort=<col>[.]*<col>[.]…          layers separated by `*`; a trailing `.`
 *                                     reverses that column's default direction
 *   ?cols=<col>,<col>,…               visible columns, in order
 *   ?f=<col>:<value>|<col>:<value>…   column filters:
 *
 *     status:active,limited           select: any of
 *     status:!discontinued            select: none of
 *     price:100-500                   numeric range (either end optional)
 *     price:100-500!                  …and hide entries with no value
 *     data.bitrate:800kHz-30MHz       numeric range with units
 *     wled_compatible:yes             boolean (yes / no)
 *     notes:~art-net bridge           text contains every word
 *     notes:art-net                   text contains the phrase
 *     updated:2026-01-01..            date: on or after
 *     price:*   /   price:!*          has a value / has no value
 *
 * Values escape `| : , ~ ! - *` with a backslash. Parsing is type-aware when
 * the caller knows the column's filter kind, so a select option that happens
 * to be spelled "yes" or "5-12" is never mistaken for a boolean or a range.
 */

import { parseNumberWithUnit } from './units';

export type SortDirection = 'asc' | 'desc';

export interface SortLayer {
  key: string;
  dir: SortDirection;
}

export interface NumericFilterValue {
  min?: number;
  max?: number;
  /** Hide entries that have no value for this column (default: keep them) */
  strict?: boolean;
}

export interface SelectFilterValue {
  selected: string[];
  exclude: boolean;
}

export interface BooleanFilterValue {
  value: boolean | null;
}

export interface StringFilterValue {
  value: string;
  fuzzy: boolean;
}

export interface DateFilterValue {
  /** ISO day (YYYY-MM-DD): keep entries updated on/after this date */
  since: string;
}

export interface PresenceFilterValue {
  /** true: only entries that have a value; false: only entries that don't */
  present: boolean;
}

export type FilterValue =
  | NumericFilterValue
  | SelectFilterValue
  | BooleanFilterValue
  | StringFilterValue
  | DateFilterValue
  | PresenceFilterValue;

export type FilterState = Record<string, FilterValue>;

/** How a column filters; mirrors `FilterConfig['type']` in columns.tsx. */
export type FilterKind = 'numeric' | 'select' | 'boolean' | 'string' | 'date';

// localStorage key prefixes
export const FILTER_STORAGE_KEY = 'awesomeledlist_filters_';
export const COLUMNS_STORAGE_KEY = 'awesomeledlist_columns_';
/** Pre-column-picker format: a list of hidden default columns */
export const LEGACY_HIDDEN_COLUMNS_STORAGE_KEY = 'awesomeledlist_hidden_columns_';

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

export function isPresenceFilter(v: FilterValue): v is PresenceFilterValue {
  return 'present' in v;
}
export function isDateFilter(v: FilterValue): v is DateFilterValue {
  return 'since' in v;
}
export function isSelectFilter(v: FilterValue): v is SelectFilterValue {
  return 'selected' in v;
}
export function isNumericFilter(v: FilterValue): v is NumericFilterValue {
  return 'min' in v || 'max' in v;
}
export function isBooleanFilter(v: FilterValue): v is BooleanFilterValue {
  return 'value' in v && (typeof v.value === 'boolean' || v.value === null);
}
export function isStringFilter(v: FilterValue): v is StringFilterValue {
  return 'value' in v && typeof v.value === 'string';
}

/** Does this filter actually constrain anything? */
export function isFilterActive(value: FilterValue | undefined): boolean {
  if (!value) return false;
  if (isPresenceFilter(value)) return true;
  if (isDateFilter(value)) return !!value.since;
  if (isSelectFilter(value)) return value.selected.length > 0;
  if (isNumericFilter(value)) return value.min !== undefined || value.max !== undefined;
  if (isBooleanFilter(value)) return value.value !== null;
  if (isStringFilter(value)) return value.value.trim() !== '';
  return false;
}

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

/** Escape characters that carry meaning in the `f` grammar. */
export function escapeFilterValue(val: string): string {
  return val.replace(/([|:,~!*\\-])/g, '\\$1');
}

export function unescapeFilterValue(val: string): string {
  return val.replace(/\\([|:,~!*\\-])/g, '$1');
}

// Split on an unescaped separator, keeping escapes intact in the pieces.
function splitUnescaped(str: string, separator: string): string[] {
  const parts: string[] = [];
  let current = '';
  let escaped = false;
  for (const char of str) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
      current += char;
    } else if (char === separator) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts;
}

function splitFilterValues(str: string): string[] {
  return splitUnescaped(str, ',')
    .filter((part) => part !== '')
    .map(unescapeFilterValue);
}

// ---------------------------------------------------------------------------
// Serialize
// ---------------------------------------------------------------------------

export interface SerializeOptions {
  /** Render a numeric bound for the URL (e.g. 800000 → "800kHz"); default: plain number */
  formatNumber?: (key: string, n: number) => string;
}

function serializeOneFilter(key: string, value: FilterValue, opts: SerializeOptions): string {
  if (isPresenceFilter(value)) return `${key}:${value.present ? '*' : '!*'}`;
  if (isDateFilter(value)) {
    // "updated:2026-01-01.." = on/after that day ('.' needs no URL encoding)
    return `${key}:${value.since}..`;
  }
  if (isSelectFilter(value)) {
    const prefix = value.exclude ? '!' : '';
    return `${key}:${prefix}${value.selected.map(escapeFilterValue).join(',')}`;
  }
  if (isNumericFilter(value)) {
    const fmt = (n: number | undefined) =>
      n === undefined ? '' : opts.formatNumber ? opts.formatNumber(key, n) : String(n);
    return `${key}:${fmt(value.min)}-${fmt(value.max)}${value.strict ? '!' : ''}`;
  }
  if (isBooleanFilter(value)) return `${key}:${value.value ? 'yes' : 'no'}`;
  if (isStringFilter(value)) {
    return `${key}:${value.fuzzy ? '~' : ''}${escapeFilterValue(value.value)}`;
  }
  return '';
}

/** All active filters as one `f` param value ('' when nothing is active). */
export function serializeFilters(filters: FilterState, opts: SerializeOptions = {}): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    if (!isFilterActive(value)) continue;
    const serialized = serializeOneFilter(key, value, opts);
    if (serialized) parts.push(serialized);
  }
  return parts.join('|');
}

// ---------------------------------------------------------------------------
// Parse
// ---------------------------------------------------------------------------

export interface ParseOptions {
  /** The column's filter kind, when known. Unknown columns fall back to guessing from the text. */
  kindOf?: (key: string) => FilterKind | undefined;
  /** Read a numeric bound from the URL (units allowed); default understands plain numbers and unit suffixes */
  parseNumber?: (key: string, text: string) => number | undefined;
}

// A bound is a number with an optional unit suffix ("100", "-5", "800kHz", ".5").
const BOUND = String.raw`-?(?:\d+\.?\d*|\.\d+)[A-Za-zµ]*`;
const RANGE_RE = new RegExp(`^(${BOUND})?-(${BOUND})?(!?)$`);
const SINCE_RE = /^(\d{4}-\d{2}-\d{2})\.\.$/;

function parseRange(key: string, raw: string, opts: ParseOptions): NumericFilterValue | null {
  const m = raw.match(RANGE_RE);
  if (!m) return null;
  const read = (text: string | undefined) => {
    if (!text) return undefined;
    return opts.parseNumber ? opts.parseNumber(key, text) : parseNumberWithUnit(text);
  };
  const min = read(m[1]);
  const max = read(m[2]);
  if (min === undefined && max === undefined) return null;
  const value: NumericFilterValue = { min, max };
  if (m[3] === '!') value.strict = true;
  return value;
}

function parseSelect(raw: string): SelectFilterValue | null {
  const exclude = raw.startsWith('!');
  const selected = splitFilterValues(exclude ? raw.slice(1) : raw);
  return selected.length > 0 ? { selected, exclude } : null;
}

function parseString(raw: string): StringFilterValue | null {
  const fuzzy = raw.startsWith('~');
  const value = unescapeFilterValue(fuzzy ? raw.slice(1) : raw);
  return value.trim() === '' ? null : { value, fuzzy };
}

function parseOneFilter(part: string, opts: ParseOptions): [string, FilterValue] | null {
  const colonIdx = part.indexOf(':');
  if (colonIdx === -1) return null;
  const key = part.slice(0, colonIdx);
  const raw = part.slice(colonIdx + 1);
  if (!key || raw === '') return null;

  // Presence is the same for every kind
  if (raw === '*') return [key, { present: true }];
  if (raw === '!*') return [key, { present: false }];

  const kind = opts.kindOf?.(key);
  let value: FilterValue | null = null;

  switch (kind) {
    case 'select':
      value = parseSelect(raw);
      break;
    case 'boolean':
      value = raw === 'yes' ? { value: true } : raw === 'no' ? { value: false } : null;
      break;
    case 'numeric':
      value = parseRange(key, raw, opts);
      break;
    case 'date': {
      const m = raw.match(SINCE_RE);
      value = m ? { since: m[1] } : null;
      break;
    }
    case 'string':
      value = parseString(raw);
      break;
    default: {
      // Unknown column: guess from the text, most specific shape first
      if (raw === 'yes') value = { value: true };
      else if (raw === 'no') value = { value: false };
      else if (SINCE_RE.test(raw)) value = { since: raw.match(SINCE_RE)![1] };
      else if (raw.startsWith('~')) value = parseString(raw);
      else value = parseRange(key, raw, opts) ?? parseSelect(raw);
    }
  }

  return value ? [key, value] : null;
}

/** Parse an `f` param value. Malformed parts are dropped, never thrown. */
export function parseFilters(str: string | null | undefined, opts: ParseOptions = {}): FilterState {
  const filters: FilterState = {};
  if (!str) return filters;
  for (const part of splitUnescaped(str, '|')) {
    if (!part) continue;
    const parsed = parseOneFilter(part, opts);
    if (parsed) filters[parsed[0]] = parsed[1];
  }
  return filters;
}

// ---------------------------------------------------------------------------
// Descriptions (filter chips)
// ---------------------------------------------------------------------------

export interface DescribeOptions {
  formatNumber?: (n: number) => string;
  trueLabel?: string;
  falseLabel?: string;
}

/** Human-readable description of a filter value, for chips. */
export function getFilterDescription(value: FilterValue, opts: DescribeOptions = {}): string {
  const num = (n: number) => (opts.formatNumber ? opts.formatNumber(n) : n.toLocaleString('en-US'));
  if (isPresenceFilter(value)) return value.present ? 'has a value' : 'no value';
  if (isDateFilter(value)) return `since ${value.since}`;
  if (isSelectFilter(value)) {
    const prefix = value.exclude ? 'not ' : '';
    if (value.selected.length <= 2) return prefix + value.selected.join(', ');
    return `${prefix}${value.selected.length} selected`;
  }
  if (isNumericFilter(value)) {
    const suffix = value.strict ? ' (known only)' : '';
    if (value.min !== undefined && value.max !== undefined) {
      return `${num(value.min)} – ${num(value.max)}${suffix}`;
    }
    if (value.min !== undefined) return `≥ ${num(value.min)}${suffix}`;
    if (value.max !== undefined) return `≤ ${num(value.max)}${suffix}`;
    return '';
  }
  if (isBooleanFilter(value)) {
    if (value.value === null) return '';
    return value.value ? (opts.trueLabel ?? 'Yes') : (opts.falseLabel ?? 'No');
  }
  if (isStringFilter(value)) return value.fuzzy ? `~ "${value.value}"` : `"${value.value}"`;
  return '';
}

// ---------------------------------------------------------------------------
// Sort
// ---------------------------------------------------------------------------

/**
 * Sort layers from the `sort` param. Legacy `&dir=desc` links are honored for
 * the first layer.
 */
export function parseSort(
  raw: string | null | undefined,
  defaultDirFor: (key: string) => SortDirection,
  legacyDir?: string | null
): SortLayer[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const layers: SortLayer[] = [];
  raw
    .split('*')
    .filter(Boolean)
    .forEach((token, i) => {
      const reversed = token.endsWith('.');
      const key = reversed ? token.slice(0, -1) : token;
      if (!key || seen.has(key)) return;
      seen.add(key);
      const def = defaultDirFor(key);
      let dir: SortDirection = reversed ? (def === 'asc' ? 'desc' : 'asc') : def;
      if (i === 0 && !reversed && (legacyDir === 'asc' || legacyDir === 'desc')) dir = legacyDir;
      layers.push({ key, dir });
    });
  return layers;
}

export function serializeSort(
  layers: SortLayer[],
  defaultDirFor: (key: string) => SortDirection
): string | null {
  if (layers.length === 0) return null;
  return layers.map((l) => l.key + (l.dir === defaultDirFor(l.key) ? '' : '.')).join('*');
}

/**
 * Next sort state when a header is clicked. A plain click cycles this column
 * through default direction → reversed → unsorted and drops other layers;
 * `additive` (shift-click) keeps the other layers and adds / flips / removes
 * this one as a tie-break.
 */
export function cycleSort(
  layers: SortLayer[],
  key: string,
  defaultDir: SortDirection,
  additive = false
): SortLayer[] {
  const index = layers.findIndex((l) => l.key === key);
  const current = index >= 0 ? layers[index] : null;
  const reversed: SortDirection = defaultDir === 'asc' ? 'desc' : 'asc';
  const next: SortLayer | null = !current
    ? { key, dir: defaultDir }
    : current.dir === defaultDir
      ? { key, dir: reversed }
      : null;

  if (!additive) {
    // A column that was only a tie-break becomes the primary sort
    if (current && index > 0) return [{ key, dir: defaultDir }];
    return next ? [next] : [];
  }
  if (!current) return [...layers, next!];
  return next ? layers.map((l) => (l.key === key ? next : l)) : layers.filter((l) => l.key !== key);
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

/** Ordered column keys from the `cols` param (null when absent/empty). */
export function parseCols(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  const keys = [...new Set(raw.split(',').filter(Boolean))];
  return keys.length > 0 ? keys : null;
}

/** `cols` param value, or null when the selection is exactly the default view. */
export function serializeCols(keys: string[], defaults: string[]): string | null {
  if (keys.length === defaults.length && keys.every((k, i) => k === defaults[i])) return null;
  return keys.join(',');
}

/**
 * Reconcile a requested column list with what the table can show: unknown
 * keys are dropped, required keys (the name column) are always present.
 */
export function resolveVisibleColumns(
  requested: string[] | null,
  defaults: string[],
  known: (key: string) => boolean,
  required: string[] = ['name']
): string[] {
  const base = (requested ?? defaults).filter(known);
  const out = [...new Set(base)];
  for (const key of required) {
    if (known(key) && !out.includes(key)) {
      // Keep the name where the default view has it: right after any leading
      // columns that are still shown
      const defaultIndex = defaults.indexOf(key);
      const before = defaults.slice(0, Math.max(defaultIndex, 0)).filter((k) => out.includes(k));
      const insertAt = before.length ? out.indexOf(before[before.length - 1]) + 1 : 0;
      out.splice(insertAt, 0, key);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Links into a table view
// ---------------------------------------------------------------------------

/** `?f=` link selecting one value of a select column (entry pages, badges). */
export function selectFilterHref(categoryPath: string, key: string, value: string): string {
  return `${categoryPath}?f=${key}:${escapeFilterValue(value)}`;
}

/** `?f=` link for a boolean column. */
export function booleanFilterHref(categoryPath: string, key: string, value: boolean): string {
  return `${categoryPath}?f=${key}:${value ? 'yes' : 'no'}`;
}
