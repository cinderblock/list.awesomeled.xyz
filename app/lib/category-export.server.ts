/**
 * Whole-category exports generated at build time: the CSV behind
 * /<category>.csv (and the zip of all of them) and the JSON behind
 * /<category>.json. Server only — route loaders call these while
 * prerendering.
 */

import { buildTableColumns } from '~/components/data/table-columns';
import { getCategoryById, loadCategoryData } from './data';
import { buildMatrix, DATABASE_LICENSE, entriesToPlain, matrixToCSV } from './export';
import { loadFieldCatalog } from './fields.server';
import { absoluteUrl } from './site';

/**
 * Every entry of a category with every field as a column — the same thing
 * "CSV — every field" downloads from the table, unfiltered.
 */
export function categoryCSV(categoryId: string): string {
  const entries = loadCategoryData(categoryId);
  const columns = buildTableColumns(categoryId, loadFieldCatalog(categoryId))
    .filter((col) => col.key !== 'links')
    .map((col) => ({ label: col.label, text: col.text }));
  return matrixToCSV(buildMatrix(entries, columns));
}

/**
 * A category as JSON: the field catalog (what each field is, how it reads)
 * and the full records. Also what the compare page loads.
 */
export function categoryJSON(categoryId: string): Record<string, unknown> {
  const category = getCategoryById(categoryId);
  const entries = loadCategoryData(categoryId);
  return {
    source: absoluteUrl(category?.path ?? `/${categoryId}`),
    license: DATABASE_LICENSE,
    category: { id: categoryId, name: category?.name ?? categoryId },
    count: entries.length,
    fields: loadFieldCatalog(categoryId),
    entries: entriesToPlain(entries),
  };
}
