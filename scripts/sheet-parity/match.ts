// cspell:ignore cand cands milli
/**
 * Sheet row <-> YAML entry pairing.
 *
 * Names alone aren't reliable: the sheet has duplicate names for different
 * products ("Jinx!" twice, one of them Glediator), vandalized names, and
 * entries renamed in YAML. So candidates come from three places (curated
 * aliases, same normalized name, shared product URL) and each candidate is
 * scored by how much of the row's content the entry holds. Pairs are assigned
 * best-score-first; a row whose best entry is taken by a better-scoring row
 * is a duplicate (if it scores well) or sheet-only.
 */

import { coverage, hasUrl, type EntryView } from './compare';
import { normName, type SheetRow } from './load';

export type How = 'alias' | 'name' | 'url';

export interface Pair {
  row: SheetRow;
  view: EntryView;
  how: How;
  score: number;
  /** Set when another row of the same tab already holds this entry */
  duplicateOf?: number;
}

export interface MatchResult {
  pairs: Pair[];
  sheetOnly: { row: SheetRow; best?: { view: EntryView; score: number } }[];
  yamlOnly: EntryView[];
}

const URL_RE = /https?:\/\/[^\s,]+/g;

export function rowUrls(row: SheetRow): string[] {
  const out = new Set<string>();
  for (const c of row.cells) {
    if (!c) continue;
    if (c.link) out.add(c.link);
    const f = c.f?.match(/HYPERLINK\("([^"]+)"/i)?.[1];
    if (f) out.add(f);
    if (typeof c.v === 'string') for (const m of c.v.matchAll(URL_RE)) out.add(m[0]);
  }
  return [...out];
}

/**
 * Loose "is this sheet value anywhere in this text" (numbers also match in
 * milli/kilo units and rounded, as the YAML may hold "18.5mA" for 18.5 or
 * "19" for a CSV-rounded 18.5).
 */
export function valuePresent(v: string | number | boolean, hay: string): boolean {
  if (typeof v === 'number') {
    const candidates = [v, v / 1000, v * 1000, Math.round(v), Math.round(v * 10) / 10];
    return candidates.some((x) =>
      new RegExp(`(^|[^0-9.])${String(x).replace('.', '\\.')}([^0-9]|$)`).test(hay)
    );
  }
  return coverage(String(v), hay) >= 0.85;
}

/** Fraction of the row's non-empty cells (name excluded) found in the entry. */
export function rowScore(row: SheetRow, view: EntryView): number {
  const hay = `${view.visible}\n${view.comments}`;
  let n = 0;
  let found = 0;
  row.cells.forEach((c, j) => {
    if (j === 0 || !c || c.v === undefined || String(c.v).trim() === '') return;
    n++;
    const s = String(c.v).trim();
    if (/^https?:\/\//.test(s)) {
      if (hasUrl(view, s)) found++;
    } else if (valuePresent(c.v, hay)) {
      found++;
    }
  });
  return n ? found / n : 0;
}

export function matchRows(
  tab: string,
  rows: SheetRow[],
  sameCategory: EntryView[],
  all: Map<string, EntryView>,
  aliases: Record<string, string>
): MatchResult {
  type Cand = { row: SheetRow; view: EntryView; how: How; score: number };
  const cands: Cand[] = [];
  const pairs: Pair[] = [];
  const taken = new Map<string, Pair>();

  for (const row of rows) {
    // Plain name, or "<name> @ <url>" for one of several same-named rows
    // "<name> @ <url>" (one of several same-named rows) beats the plain name
    const alias =
      rowUrls(row)
        .map((u) => aliases[`${row.name} @ ${u}`])
        .find(Boolean) ?? aliases[row.name];
    if (alias) {
      const view = all.get(alias);
      if (!view) throw new Error(`${tab}: alias for "${row.name}" points at missing ${alias}`);
      const p: Pair = { row, view, how: 'alias', score: rowScore(row, view) };
      pairs.push(p);
      taken.set(alias, p);
      continue;
    }
    const seen = new Set<string>();
    const key = normName(row.name);
    for (const view of sameCategory) {
      if (key && normName(view.entry.data.name) === key) {
        seen.add(`${view.entry.category}/${view.entry.slug}`);
        cands.push({ row, view, how: 'name', score: rowScore(row, view) });
      }
    }
    const urls = rowUrls(row);
    for (const [id, view] of all) {
      if (seen.has(id)) continue;
      if (urls.some((u) => hasUrl(view, u))) {
        cands.push({ row, view, how: 'url', score: rowScore(row, view) });
      }
    }
  }

  // Best first. Sharing the name is worth a little: sibling products share
  // datasheet hosts and protocol pages, so a near-tie goes to the namesake.
  const rank = (c: Cand) => c.score + (c.how === 'name' ? 0.15 : 0);
  cands.sort((a, b) => rank(b) - rank(a));
  const assigned = new Set<SheetRow>(pairs.map((p) => p.row));
  for (const c of cands) {
    if (assigned.has(c.row)) continue;
    const id = `${c.view.entry.category}/${c.view.entry.slug}`;
    if (taken.has(id)) continue;
    // URL-only matches need real content agreement (vendor home pages are shared)
    if (c.how === 'url' && c.score < 0.5) continue;
    const p: Pair = { row: c.row, view: c.view, how: c.how, score: c.score };
    pairs.push(p);
    taken.set(id, p);
    assigned.add(c.row);
  }
  // Rows whose every candidate went to a better-matching row: duplicates
  for (const c of cands) {
    if (assigned.has(c.row) || c.score < 0.6) continue;
    const holder = taken.get(`${c.view.entry.category}/${c.view.entry.slug}`);
    if (!holder) continue;
    pairs.push({ ...c, duplicateOf: holder.row.rowNumber });
    assigned.add(c.row);
  }

  const sheetOnly = rows
    .filter((r) => !assigned.has(r))
    .map((row) => {
      const mine = cands.filter((c) => c.row === row).sort((a, b) => b.score - a.score)[0];
      return { row, best: mine ? { view: mine.view, score: mine.score } : undefined };
    });
  const yamlOnly = sameCategory.filter((v) => !taken.has(`${v.entry.category}/${v.entry.slug}`));
  pairs.sort((a, b) => a.row.rowNumber - b.row.rowNumber);
  return { pairs, sheetOnly, yamlOnly };
}
