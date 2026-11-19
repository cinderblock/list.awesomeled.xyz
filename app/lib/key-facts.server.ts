/**
 * The few facts that tell one entry from its neighbours: the first default
 * table columns it has a value for. Search results, page descriptions and
 * link-preview cards all show the same ones.
 */

import { buildTableColumns, type TableColumn } from '~/components/data/table-columns';
import { loadFieldCatalog } from './fields.server';
import type { BaseEntry } from './types';

// Columns that are shown elsewhere next to the facts, or say nothing about the entry
const NOT_KEY_FACTS = new Set(['links', 'name', 'creator', 'status', 'updated']);
const KEY_FACT_MAX_LENGTH = 36;

// Like the catalog itself: cached for a production build (prerendering asks
// hundreds of times per category), rebuilt on every call in dev
const factColumnCache = new Map<string, TableColumn[]>();

/** The default columns of a category that can serve as key facts, in order. */
export function factColumns(categoryId: string): TableColumn[] {
  if (process.env.NODE_ENV === 'production') {
    const cached = factColumnCache.get(categoryId);
    if (cached) return cached;
  }
  const columns = buildTableColumns(categoryId, loadFieldCatalog(categoryId)).filter(
    (c) => c.isDefault && !NOT_KEY_FACTS.has(c.key)
  );
  if (process.env.NODE_ENV === 'production') factColumnCache.set(categoryId, columns);
  return columns;
}

/** Up to `count` short facts about an entry ("Outputs 16", "sACN, Art-Net", "$219"). */
export function keyFacts(entry: BaseEntry, columns: TableColumn[], count = 3): string[] {
  const facts: string[] = [];
  for (const col of columns) {
    if (facts.length >= count) break;
    const text = col.text(entry);
    // "No" and zero counts are not what tells two entries apart
    if (!text || text.length > KEY_FACT_MAX_LENGTH || text === 'No' || text === '0') continue;
    const numeric = col.field && ['number', 'year', 'boolean'].includes(col.field.kind);
    facts.push(numeric ? `${col.label} ${text === 'Yes' ? '' : text}`.trim() : text);
  }
  return facts;
}
