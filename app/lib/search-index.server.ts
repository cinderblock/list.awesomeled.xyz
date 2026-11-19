/**
 * Builds the site-wide search index at build time: one compact record per
 * entry (see SearchDoc in search.ts). Served as /search-index.json and fetched
 * by the browser the first time someone searches.
 */

import { loadCategoryData } from './data';
import { entityName, fieldText, fieldValues, getPath, isEmptyValue } from './fields';
import { loadFieldCatalog } from './fields.server';
import { factColumns, keyFacts } from './key-facts.server';
import { firstImageFile } from './images';
import type { SearchDoc } from './search';
import { CATEGORIES, type BaseEntry } from './types';

const KEY_FACT_COUNT = 3;
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
    const columns = factColumns(category.id);

    for (const entry of loadCategoryData(category.id)) {
      const doc: SearchDoc = { c: category.id, i: String(entry.id), n: entry.name };

      const maker = entityName(entry.creator);
      if (maker) doc.b = maker;

      const status = typeof entry.status === 'string' ? entry.status : '';
      if (status && status !== 'active' && status !== 'unknown') doc.s = status;

      const aliases = otherNames(entry);
      if (aliases.length) doc.a = aliases;

      // A few facts to tell results apart: the first default columns with a value
      const facts = keyFacts(entry, columns, KEY_FACT_COUNT);
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
