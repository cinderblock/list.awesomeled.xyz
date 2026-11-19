/**
 * Builds the site-wide search index at build time: one compact record per
 * entry (see SearchDoc in search.ts). Served as /search-index.json and fetched
 * by the browser the first time someone searches.
 */

import { buildTableColumns } from '~/components/data/table-columns';
import { loadCategoryData } from './data';
import { entityName, fieldText, fieldValues, getPath, isEmptyValue } from './fields';
import { loadFieldCatalog } from './fields.server';
import { firstImageFile } from './images';
import type { SearchDoc } from './search';
import { CATEGORIES, type BaseEntry } from './types';

// Columns that are shown elsewhere on a result row, or say nothing about it
const NOT_KEY_FACTS = new Set(['links', 'name', 'creator', 'status', 'updated']);
const KEY_FACT_COUNT = 3;
const KEY_FACT_MAX_LENGTH = 36;
// Prose is searchable, but only its opening: the index ships to every searcher
const PROSE_LIMIT = 240;

function otherNames(entry: BaseEntry): string[] {
  const names: string[] = [];
  if (Array.isArray(entry.aliases)) names.push(...entry.aliases.map(String));
  if (Array.isArray(entry.variants)) {
    for (const variant of entry.variants) {
      const name = entityName(variant);
      if (name) names.push(name);
    }
  }
  return [...new Set(names)].filter((name) => name !== entry.name);
}

/** The whole database as search records. */
export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const category of CATEGORIES) {
    const fields = loadFieldCatalog(category.id);
    const columns = buildTableColumns(category.id, fields);
    const factColumns = columns.filter((c) => c.isDefault && !NOT_KEY_FACTS.has(c.key));

    for (const entry of loadCategoryData(category.id)) {
      const doc: SearchDoc = { c: category.id, i: String(entry.id), n: entry.name };

      const maker = entityName(entry.creator);
      if (maker) doc.b = maker;

      const status = typeof entry.status === 'string' ? entry.status : '';
      if (status && status !== 'active' && status !== 'unknown') doc.s = status;

      const aliases = otherNames(entry);
      if (aliases.length) doc.a = aliases;

      // A few facts to tell results apart: the first default columns with a value
      const facts: string[] = [];
      for (const col of factColumns) {
        if (facts.length >= KEY_FACT_COUNT) break;
        const text = col.text(entry);
        // "No" and zero counts are not what tells two results apart
        if (!text || text.length > KEY_FACT_MAX_LENGTH || text === 'No' || text === '0') continue;
        const numeric = col.field && ['number', 'year', 'boolean'].includes(col.field.kind);
        facts.push(numeric ? `${col.label} ${text === 'Yes' ? '' : text}`.trim() : text);
      }
      if (facts.length) doc.k = facts.join(' · ');

      // Everything else worth matching: facet values and the start of prose.
      // Derived link summaries (`linked.*`) stay out: they would make every
      // compatible controller match a pixel's name.
      const parts = new Set<string>();
      for (const field of fields) {
        if (field.section === 'linked' || field.kind === 'url') continue;
        const value = getPath(entry, field.key);
        if (isEmptyValue(value)) continue;
        if (field.kind === 'text' || field.kind === 'textlist') {
          parts.add(fieldText(field, value).slice(0, PROSE_LIMIT));
        } else if (['enum', 'tags', 'keys', 'entity'].includes(field.kind)) {
          for (const v of fieldValues(field, value)) parts.add(v);
        }
      }
      parts.delete(entry.name);
      if (maker) parts.delete(maker);
      if (parts.size) doc.t = [...parts].join(' | ');

      const image = firstImageFile(entry);
      if (image) doc.img = image;

      docs.push(doc);
    }
  }
  return docs;
}
