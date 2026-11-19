/**
 * Side-by-side comparison: which entries are picked, and the URL that shows
 * them.
 *
 * Entries are named by the same `<category>/<id>` refs the database uses for
 * `related`. The picks live in localStorage (they follow you from table to
 * table); the compare page itself is driven by its URL, so a comparison can
 * be shared: /compare?e=controllers/falcon-f16v4,controllers/falcon-f16v5
 */

import { getPref, setPref, usePref } from './prefs';

export const COMPARE_PREF = 'awesomeledlist_compare';
/** More than four columns stops being a comparison and becomes a table again */
export const COMPARE_MAX = 4;

export interface CompareItem {
  /** `<category>/<id>` */
  ref: string;
  /** Display name, so the tray never has to look entries up */
  name: string;
}

export function entryRef(categoryId: string, entryId: string): string {
  return `${categoryId}/${entryId}`;
}

export function splitRef(ref: string): { category: string; id: string } | null {
  const slash = ref.indexOf('/');
  if (slash <= 0 || slash === ref.length - 1) return null;
  return { category: ref.slice(0, slash), id: ref.slice(slash + 1) };
}

/** Refs from the `e` param: well-formed, de-duplicated, at most COMPARE_MAX. */
export function parseCompareParam(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const refs: string[] = [];
  for (const part of raw.split(',')) {
    const ref = part.trim();
    if (ref && splitRef(ref) && !refs.includes(ref)) refs.push(ref);
    if (refs.length === COMPARE_MAX) break;
  }
  return refs;
}

/** The compare page for a set of entries. */
export function compareHref(refs: string[], differencesOnly = false): string {
  if (refs.length === 0) return '/compare';
  // Slashes and commas are legal in a query string and far easier to read
  const e = refs.map((ref) => encodeURIComponent(ref).replace(/%2F/gi, '/')).join(',');
  return `/compare?e=${e}${differencesOnly ? '&diff=1' : ''}`;
}

function sanitize(value: unknown): CompareItem[] {
  if (!Array.isArray(value)) return [];
  const items: CompareItem[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === 'object' &&
      typeof (item as CompareItem).ref === 'string' &&
      splitRef((item as CompareItem).ref) &&
      !items.some((existing) => existing.ref === (item as CompareItem).ref)
    ) {
      const { ref, name } = item as CompareItem;
      items.push({ ref, name: typeof name === 'string' && name ? name : ref });
    }
  }
  return items.slice(0, COMPARE_MAX);
}

/** The current picks (outside React). */
export function getCompareItems(): CompareItem[] {
  return sanitize(getPref<CompareItem[]>(COMPARE_PREF));
}

export function setCompareItems(items: CompareItem[]): void {
  const clean = sanitize(items);
  setPref(COMPARE_PREF, clean.length > 0 ? clean : null);
}

/**
 * Add or remove one entry. Returns false when the entry could not be added
 * because the comparison is full.
 */
export function toggleCompare(item: CompareItem): boolean {
  const items = getCompareItems();
  if (items.some((existing) => existing.ref === item.ref)) {
    setCompareItems(items.filter((existing) => existing.ref !== item.ref));
    return true;
  }
  if (items.length >= COMPARE_MAX) return false;
  setCompareItems([...items, item]);
  return true;
}

export function clearCompare(): void {
  setPref(COMPARE_PREF, null);
}

const NONE: CompareItem[] = [];

/** The current picks, reactive. Empty on the server and during hydration. */
export function useCompareItems(): CompareItem[] {
  const [raw] = usePref<CompareItem[]>(COMPARE_PREF);
  // usePref hands back the same parsed object until storage changes, so the
  // sanitized list only needs recomputing when it does
  return raw == null ? NONE : sanitizeCached(raw);
}

let lastRaw: unknown = null;
let lastClean: CompareItem[] = NONE;
function sanitizeCached(raw: unknown): CompareItem[] {
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastClean = sanitize(raw);
  }
  return lastClean;
}
