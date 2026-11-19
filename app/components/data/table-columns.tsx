/**
 * Every column a category table can show.
 *
 * The hand-written columns in lib/columns.tsx are the default view (curated
 * labels, renderers and order). Every other field in the catalog becomes an
 * optional column with a renderer, filter and sort picked from its kind. Both
 * kinds get the same accessors (text / values / number / sortKey), so
 * filtering, facets, export and copy treat them alike.
 */

import { getColumnsForCategory, type Column, type FilterConfig } from '~/lib/columns';
import {
  enumLabel,
  fieldNumber,
  fieldSortValue,
  fieldText,
  fieldValues,
  getPath,
  isEmptyValue,
  plainText,
  sectionLabel,
  type FieldKind,
  type FieldMeta,
} from '~/lib/fields';
import type { QuantityKind } from '~/lib/quantity';
import type { ModelColumn } from '~/lib/table-model';
import type { FilterKind } from '~/lib/table-state';
import type { BaseEntry } from '~/lib/types';
import { FieldValue } from './FieldValue';

export interface TableColumn extends Column, ModelColumn {
  /** Catalog metadata, when the column maps to a database field */
  field?: FieldMeta;
  section: string;
  sectionLabel: string;
  /** Part of the default view (the curated columns) */
  isDefault: boolean;
  /** Unit kind for numeric filters that accept units ("800kHz") */
  quantity?: QuantityKind;
  /** Extra information about the column, shown in its menu */
  description?: string;
}

const FILTER_FOR_KIND: Record<FieldKind, FilterKind | undefined> = {
  text: 'string',
  textlist: 'string',
  enum: 'select',
  tags: 'select',
  keys: 'select',
  entity: 'select',
  boolean: 'boolean',
  number: 'numeric',
  quantity: 'numeric',
  price: 'numeric',
  year: 'numeric',
  url: undefined, // only "has a value / has none" makes sense
};

const FACET_KINDS = new Set<FieldKind>(['enum', 'tags', 'keys', 'entity', 'boolean', 'year']);
const RIGHT_ALIGNED = new Set<FieldKind>(['number', 'quantity', 'price', 'year']);

// Columns that are not database fields
const PSEUDO_COLUMNS = new Set(['links']);

// Pattern-driver platforms: the cell collapses a full desktop set to "All
// OS", but a filter for "Windows" must still find those entries.
function platformList(item: BaseEntry): string[] {
  const p = item.platforms;
  if (p == null || typeof p !== 'object') return [];
  if (Array.isArray(p)) return p.map(String);
  const { os, mobile, web, hardware } = p as {
    os?: string[] | null;
    mobile?: string[] | null;
    web?: boolean | null;
    hardware?: string[] | null;
  };
  return [...(os ?? []), ...(mobile ?? []), ...(web ? ['Web'] : []), ...(hardware ?? [])];
}

// Per-column accessor overrides, keyed by "<category>/<column key>" or just
// the column key when it applies everywhere.
const VALUE_OVERRIDES: Record<string, (item: BaseEntry) => string[]> = {
  'pattern-drivers/platforms.os': platformList,
};

function genericValues(raw: unknown): string[] {
  if (isEmptyValue(raw)) return [];
  if (Array.isArray(raw)) return raw.map((v) => plainText(v)).filter(Boolean);
  if (typeof raw === 'object') {
    const text = plainText(raw);
    return text ? [text] : [];
  }
  return [enumLabel(raw)];
}

function genericNumber(raw: unknown): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  const m = raw.match(/^-?[\d,]*\.?\d+/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
}

function genericSortKey(raw: unknown): number | string | null {
  if (isEmptyValue(raw)) return null;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'boolean') return raw ? 1 : 0;
  if (raw instanceof Date) return raw.getTime();
  const text = plainText(raw).toLowerCase();
  return text === '' ? null : text;
}

// A curated column with the shared accessors layered on
function fromCurated(categoryId: string, col: Column, field: FieldMeta | undefined): TableColumn {
  const key = col.key;
  const pseudo = PSEUDO_COLUMNS.has(key);
  const override = VALUE_OVERRIDES[`${categoryId}/${key}`] ?? VALUE_OVERRIDES[key];
  const facetField = field && FACET_KINDS.has(field.kind) ? field : undefined;

  // Enum values shown under display labels: facets, filters and copy use
  // the same words as the cells
  const labels = col.valueLabels;
  const labelled = (raw: unknown): string[] =>
    (Array.isArray(raw) ? raw : isEmptyValue(raw) ? [] : [raw]).map(
      (v) => labels?.[String(v)] ?? enumLabel(v)
    );

  const values = (item: BaseEntry): string[] => {
    if (pseudo) return [];
    if (override) return override(item);
    const raw = getPath(item, key);
    if (labels) return labelled(raw);
    return facetField ? fieldValues(facetField, raw) : genericValues(raw);
  };

  const number = (item: BaseEntry): number | null => {
    const raw = getPath(item, key);
    if (col.sortValue) {
      const v = col.sortValue(raw, item);
      return typeof v === 'number' ? v : null;
    }
    return field ? fieldNumber(field, raw) : genericNumber(raw);
  };

  const sortKey = (item: BaseEntry): number | string | null => {
    const raw = getPath(item, key);
    if (col.sortValue) return col.sortValue(raw, item);
    if (key === 'name') return String(raw ?? '').toLowerCase() || null;
    return field ? fieldSortValue(field, raw) : genericSortKey(raw);
  };

  const text = (item: BaseEntry): string => {
    if (pseudo) return '';
    if (override) return override(item).join(', ');
    const raw = getPath(item, key);
    if (labels) return labelled(raw).join(', ');
    return field ? fieldText(field, raw) : plainText(raw);
  };

  let filterKind: FilterKind | undefined = col.filterConfig?.type;
  if (!filterKind && !pseudo && key !== 'name' && col.filterable !== false && field) {
    filterKind = FILTER_FOR_KIND[field.kind];
  }

  return {
    ...col,
    field,
    section: field?.section ?? '',
    sectionLabel: field?.sectionLabel ?? sectionLabel(''),
    isDefault: true,
    quantity: field?.quantity,
    description: col.headerTip ?? field?.description,
    filterKind,
    filterConfig: col.filterConfig ?? filterConfigFor(filterKind),
    values,
    number,
    sortKey,
    text,
    hasValue: (item) => !pseudo && !isEmptyValue(getPath(item, key)),
    date: (item) => {
      const raw = getPath(item, key);
      return raw instanceof Date ? raw : null;
    },
    bool: (item) => {
      const raw = getPath(item, key);
      return typeof raw === 'boolean' ? raw : null;
    },
  };
}

function filterConfigFor(kind: FilterKind | undefined): FilterConfig | undefined {
  switch (kind) {
    case 'select':
      return { type: 'select' };
    case 'boolean':
      return { type: 'boolean' };
    case 'numeric':
      return { type: 'numeric' };
    case 'string':
      return { type: 'string', fuzzy: true };
    case 'date':
      return { type: 'date' };
    default:
      return undefined;
  }
}

// A column generated from a catalog field
function fromField(field: FieldMeta): TableColumn {
  const key = field.key;
  const filterKind = FILTER_FOR_KIND[field.kind];
  return {
    key,
    label: field.label,
    field,
    section: field.section,
    sectionLabel: field.sectionLabel,
    isDefault: false,
    quantity: field.quantity,
    description: field.description,
    className: RIGHT_ALIGNED.has(field.kind) ? 'data-table-cell--right' : undefined,
    render: (value, item) => <FieldValue field={field} value={value} item={item} compact />,
    filterKind,
    filterConfig:
      field.kind === 'price' ? { type: 'numeric', unit: '$' } : filterConfigFor(filterKind),
    values: (item) => fieldValues(field, getPath(item, key)),
    number: (item) => fieldNumber(field, getPath(item, key)),
    sortKey: (item) => fieldSortValue(field, getPath(item, key)),
    text: (item) => fieldText(field, getPath(item, key)),
    hasValue: (item) => !isEmptyValue(getPath(item, key)),
    bool: (item) => {
      const raw = getPath(item, key);
      return typeof raw === 'boolean' ? raw : null;
    },
  };
}

/**
 * All columns for a category: the curated default view first, then every
 * remaining catalog field as an optional column.
 */
export function buildTableColumns(categoryId: string, fields: FieldMeta[]): TableColumn[] {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  const curated = getColumnsForCategory(categoryId);
  const curatedKeys = new Set(curated.map((c) => c.key));
  return [
    ...curated.map((col) => fromCurated(categoryId, col, byKey.get(col.key))),
    ...fields.filter((f) => !curatedKeys.has(f.key)).map(fromField),
  ];
}

/** Keys of the default view, in order. */
export function defaultColumnKeys(columns: TableColumn[]): string[] {
  return columns.filter((c) => c.isDefault).map((c) => c.key);
}
