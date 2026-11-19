/**
 * Loads a whole category in the browser from its prerendered JSON export
 * (/<category>.json): the field catalog plus every record. Used where a page
 * needs entries it was not prerendered with — the compare page, which can
 * show any combination of entries.
 */

import type { FieldMeta } from './fields';
import type { BaseEntry } from './types';

export interface CategoryData {
  category: { id: string; name: string };
  fields: FieldMeta[];
  entries: BaseEntry[];
}

interface CategoryExport {
  category: { id: string; name: string };
  fields: FieldMeta[];
  entries: (Record<string, unknown> & { id: string; name: string; reviewed?: string })[];
}

const cache = new Map<string, Promise<CategoryData>>();

/** Fetch (once) and revive a category. Rejects when the category does not exist. */
export function loadCategory(categoryId: string): Promise<CategoryData> {
  let promise = cache.get(categoryId);
  if (!promise) {
    promise = fetch(`/${encodeURIComponent(categoryId)}.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`${categoryId}: HTTP ${res.status}`);
        return res.json() as Promise<CategoryExport>;
      })
      .then((doc) => ({
        category: doc.category,
        fields: doc.fields,
        // The export writes the review date as an ISO day; tables expect a Date
        entries: doc.entries.map(({ reviewed, ...rest }) => ({
          ...rest,
          updated: reviewed ? new Date(`${reviewed}T00:00:00Z`) : new Date(NaN),
        })) as BaseEntry[],
      }))
      .catch((error) => {
        cache.delete(categoryId); // let a later attempt retry
        throw error;
      });
    cache.set(categoryId, promise);
  }
  return promise;
}
