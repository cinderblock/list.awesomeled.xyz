/**
 * Three-way context for the audit.
 *
 * The YAML database was created on 2026-01-21 from a CSV export of every tab
 * (kept in the predecessor repo cinderblock/awesomeledlist @ 3755125, and
 * imported here in e176865). With that baseline each difference can be read:
 *
 *  - sheet cell changed since the baseline -> a post-import sheet edit
 *    (new info, or vandalism) that the YAML never saw;
 *  - sheet unchanged, value present in the imported YAML but not now ->
 *    the YAML was deliberately changed later (usually research);
 *  - sheet unchanged, value absent from the imported YAML -> lost in the
 *    CSV conversion (CSV exports drop notes, hyperlinks and decimals that a
 *    number format hides).
 */

import { execFileSync } from 'child_process';
import { parse } from 'yaml';
import { leaves } from './compare';

export const BASELINE_COMMIT = '3755125'; // cinderblock/awesomeledlist "Import original dataset 2026-01-21"
export const IMPORT_COMMIT = 'e176865'; // this repo: "Phase 2: Add YAML database..."

const BASELINE_FILE: Record<string, string> = {
  'Commercial Pixel Systems': ' Commercial Pixel Systems',
};

/** Minimal RFC 4180 CSV parser */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);
  return res.text();
}

/** The 2026-01-21 CSV snapshot of a tab (display text, as the converter saw it). */
export async function baselineCsv(tab: string): Promise<string[][]> {
  const file = `Addressable LED Controllers, Drivers, and Related Products - ${BASELINE_FILE[tab] ?? tab}.csv`;
  const url = `https://raw.githubusercontent.com/cinderblock/awesomeledlist/${BASELINE_COMMIT}/original%20dataset/${encodeURIComponent(file)}`;
  return parseCsv(await fetchText(url));
}

/** Today's CSV export of a tab: display text aligned row-for-row with the XLSX. */
export async function currentCsv(sheetUrl: string, gid: number): Promise<string[][]> {
  return parseCsv(await fetchText(`${sheetUrl}/export?format=csv&gid=${gid}`));
}

/**
 * Pair each current row with its baseline row: most equal cells wins (names
 * were vandalized or fixed since, so names alone can't be trusted).
 */
export function alignBaseline(current: string[][], baseline: string[][]): (string[] | undefined)[] {
  const used = new Set<number>();
  const out: (string[] | undefined)[] = [];
  const norm = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
  const scored: { c: number; b: number; score: number }[] = [];
  for (let c = 1; c < current.length; c++) {
    const cur = current[c];
    const filled = cur.filter((x) => norm(x)).length || 1;
    for (let b = 1; b < baseline.length; b++) {
      const base = baseline[b];
      let eq = 0;
      for (let j = 0; j < Math.max(cur.length, base.length); j++) {
        if (norm(cur[j]) && norm(cur[j]) === norm(base[j])) eq++;
      }
      const sameName = norm(cur[0]) && norm(cur[0]) === norm(base[0]) ? 0.25 : 0;
      const score = eq / filled + sameName;
      if (score >= 0.5) scored.push({ c, b, score });
    }
  }
  scored.sort((x, y) => y.score - x.score);
  const assigned = new Map<number, number>();
  for (const s of scored) {
    if (assigned.has(s.c) || used.has(s.b)) continue;
    assigned.set(s.c, s.b);
    used.add(s.b);
  }
  for (let c = 0; c < current.length; c++) {
    const b = assigned.get(c);
    out.push(c === 0 ? baseline[0] : b === undefined ? undefined : baseline[b]);
  }
  return out;
}

/** Site-visible text of every entry as first imported (flat schema), keyed `<category>/<slug>`. */
export function importedEntries(categories: string[]): Map<string, string> {
  const out = new Map<string, string>();
  const paths: string[] = [];
  for (const cat of categories) {
    let listing = '';
    try {
      listing = execFileSync(
        'git',
        ['ls-tree', '--name-only', `${IMPORT_COMMIT}:database/${cat}`],
        {
          encoding: 'utf-8',
        }
      );
    } catch {
      continue;
    }
    for (const f of listing.split('\n')) {
      if (f.endsWith('.yaml') && !f.startsWith('_')) paths.push(`database/${cat}/${f}`);
    }
  }
  const input = paths.map((p) => `${IMPORT_COMMIT}:${p}`).join('\n') + '\n';
  const raw = execFileSync('git', ['cat-file', '--batch'], { input, maxBuffer: 64 * 1024 * 1024 });
  let pos = 0;
  for (const p of paths) {
    const nl = raw.indexOf(0x0a, pos);
    const header = raw.subarray(pos, nl).toString('utf-8');
    const size = Number(header.split(' ')[2]);
    const body = raw.subarray(nl + 1, nl + 1 + size).toString('utf-8');
    pos = nl + 1 + size + 1;
    const [, cat, file] = p.split('/');
    try {
      out.set(`${cat}/${file.replace(/\.yaml$/, '')}`, leaves(parse(body)).join(' \n '));
    } catch {
      out.set(`${cat}/${file.replace(/\.yaml$/, '')}`, body);
    }
  }
  return out;
}

/** Commits since the import that touched a file, minus IGNORED_COMMITS (bulk/structural). */
export function entryCommits(
  file: string,
  ignored: Set<string>
): { hash: string; date: string; subject: string }[] {
  const log = execFileSync(
    'git',
    [
      'log',
      '--format=%H%x09%ad%x09%s',
      '--date=short',
      '--follow',
      `${IMPORT_COMMIT}..HEAD`,
      '--',
      file,
    ],
    { encoding: 'utf-8' }
  );
  return log
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [hash, date, subject] = l.split('\t');
      return { hash, date, subject };
    })
    .filter((c) => !ignored.has(c.hash));
}
