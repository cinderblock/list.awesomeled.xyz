/**
 * What the home page says about the database as a whole: how much is in it,
 * and what was looked at most recently. Computed while prerendering.
 */

import { loadCategoryData } from './data';
import { entityName } from './fields';
import { firstImageFile } from './images';
import { CATEGORIES } from './types';

export interface RecentEntry {
  /** Category id */
  category: string;
  id: string;
  name: string;
  maker: string | null;
  /** When this entry was last reviewed (see "Reviewed" in CLAUDE.md) */
  updated: Date;
  /** First image file, when the entry has one */
  image?: string;
}

export interface HomeSummary {
  counts: Record<string, number>;
  total: number;
  /** Distinct creators across every category */
  makers: number;
  /** The most recent review of any entry */
  lastReviewed: Date | null;
  recent: RecentEntry[];
}

/**
 * @param recentCount how many recently reviewed entries to list
 * @param perCategory at most this many from one category, so a bulk review of
 *   one category doesn't fill the list
 */
export function loadHomeSummary(recentCount = 8, perCategory = 2): HomeSummary {
  const counts: Record<string, number> = {};
  const makers = new Set<string>();
  const all: RecentEntry[] = [];

  for (const category of CATEGORIES) {
    const entries = loadCategoryData(category.id);
    counts[category.id] = entries.length;
    for (const entry of entries) {
      const maker = entityName(entry.creator);
      if (maker) makers.add(maker.trim().toLowerCase());
      all.push({
        category: category.id,
        id: entry.id,
        name: entry.name,
        maker,
        updated: entry.updated,
        image: firstImageFile(entry),
      });
    }
  }

  // Newest first; entries reviewed in the same commit share a timestamp, so
  // the name settles the order and the list is the same on every build
  all.sort(
    (a, b) =>
      b.updated.getTime() - a.updated.getTime() ||
      a.name.localeCompare(b.name) ||
      a.category.localeCompare(b.category)
  );

  const recent: RecentEntry[] = [];
  const taken = new Map<string, number>();
  for (const entry of all) {
    if (recent.length >= recentCount) break;
    const n = taken.get(entry.category) ?? 0;
    if (n >= perCategory) continue;
    taken.set(entry.category, n + 1);
    recent.push(entry);
  }

  return {
    counts,
    total: all.length,
    makers: makers.size,
    lastReviewed: all[0]?.updated ?? null,
    recent,
  };
}
