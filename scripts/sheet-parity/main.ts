#!/usr/bin/env bun
// cspell:ignore acks
/**
 * Spreadsheet parity audit: diff the original Google Sheet against the YAML
 * database, cell by cell, including cell notes, hyperlinks, and the sheet's
 * "verify" / "missing data" highlights.
 *
 *   bun run sheet-parity                     # fetch the live sheet, write the report
 *   bun run sheet-parity --xlsx f.xlsx --csv-dir dir   # use a local export
 *   bun run sheet-parity --json out.json     # also dump every verdict as JSON
 *
 * Report: plans/spreadsheet-parity/report.md. See plans/spreadsheet-parity.md.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { format, resolveConfig } from 'prettier';
import { IGNORED_COMMITS } from '../../app/lib/data';
import { ackKey, findAck } from './acks';
import { ALIASES } from './aliases';
import { COLUMNS, KNOWN_BAD_HEADERS } from './columns';
import {
  compareCell,
  coverage,
  hasUrl,
  viewOf,
  type DeriveContext,
  type EntryView,
  type Status,
} from './compare';
import {
  alignBaseline,
  baselineCsv,
  currentCsv,
  entryCommits,
  importedEntries,
  parseCsv,
} from './history';
import { cellUrl, loadCategory, loadSheets, SHEET_URL, sheetRows, TABS } from './load';
import { matchRows, valuePresent, type MatchResult } from './match';
import { renderReport } from './report';
import { colLetters, type Cell } from './xlsx';

export const HIGHLIGHTS: Record<string, string> = {
  D9D2E9: 'needs verification',
  FFF2CC: 'missing data, easy to fill',
};
/** Row banding / header colors with no meaning */
const DECORATIVE = new Set(['FEF8E3', 'F3F3F3', 'FFE599', 'FFFFFF']);

/** Where a difference came from (see history.ts) */
export type Origin =
  | 'sheet-edited'
  | 'yaml-revised'
  | 'migration-loss'
  | 'conversion-loss'
  | 'new-row'
  | 'unknown';

export interface CellResult {
  a1: string;
  row: number;
  name: string;
  entry?: string;
  column: string;
  value: string;
  status: Status | 'ack';
  yaml?: string;
  detail?: string;
  ack?: string;
  /** Display text of this cell in the 2026-01-21 baseline, when the row existed */
  baseline?: string;
  origin?: Origin;
}

export interface TabResult {
  tab: string;
  category: string;
  rows: number;
  headerProblems: string[];
  match: {
    pairs: {
      row: number;
      name: string;
      entry: string;
      how: string;
      score: number;
      duplicateOf?: number;
    }[];
    sheetOnly: {
      row: number;
      name: string;
      best?: string;
      bestScore?: number;
      ack?: string;
      inBaseline: boolean;
    }[];
    yamlOnly: { entry: string; name: string; since?: string }[];
  };
  cells: CellResult[];
  links: (CellResult & { url: string })[];
  notes: (CellResult & { note: string })[];
  flags: (CellResult & { color: string; meaning: string })[];
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
}

/** Date-formatted cells hold rating ranges Sheets auto-converted ("3-4" -> Mar 4). */
function displayValue(cell: Cell): string | number | boolean | undefined {
  const v = cell.v;
  if (typeof v === 'number' && cell.fmt && /^m+[-/]d+$/i.test(cell.fmt)) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    const sep = cell.fmt.includes('/') ? '/' : '-';
    return `${d.getUTCMonth() + 1}${sep}${d.getUTCDate()}`;
  }
  return v;
}

function cellLink(cell: Cell): string | undefined {
  return cell.link ?? cell.f?.match(/HYPERLINK\("([^"]+)"/i)?.[1];
}

const norm = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

async function main() {
  const sheets = await loadSheets(arg('--xlsx'));
  const csvDir = arg('--csv-dir');
  const all = new Map<string, EntryView>();
  const byCategory = new Map<string, EntryView[]>();
  for (const { category } of Object.values(TABS)) {
    const views = loadCategory(category).map(viewOf);
    byCategory.set(category, views);
    for (const v of views) all.set(`${category}/${v.entry.slug}`, v);
  }
  const imported = importedEntries([...byCategory.keys()]);
  const ctx: DeriveContext = { connectorText: new Map() };
  for (const v of byCategory.get('connectors') ?? [])
    ctx.connectorText.set(v.entry.slug, v.visible);

  const results: TabResult[] = [];
  for (const sheet of sheets) {
    const tab = TABS[sheet.name];
    if (!tab) continue;
    const specs = COLUMNS[sheet.name];
    const res: TabResult = {
      tab: sheet.name,
      category: tab.category,
      rows: 0,
      headerProblems: [],
      match: { pairs: [], sheetOnly: [], yamlOnly: [] },
      cells: [],
      links: [],
      notes: [],
      flags: [],
    };

    // Three-way context: today's display text, and the 2026-01-21 baseline
    const slug = sheet.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const current =
      csvDir && existsSync(join(csvDir, `${slug}.csv`))
        ? parseCsv(readFileSync(join(csvDir, `${slug}.csv`), 'utf-8'))
        : await currentCsv(SHEET_URL, tab.gid);
    const baseline = alignBaseline(current, await baselineCsv(sheet.name));

    // Header check: a changed header means the sheet moved or lost a column
    const header = sheet.rows[0] ?? [];
    const width = Math.max(header.length, ...sheet.rows.map((r) => r.length));
    if (width > specs.length) {
      res.headerProblems.push(
        `${width - specs.length} unmapped column(s) beyond ${colLetters(specs.length - 1)}`
      );
    }
    specs.forEach((spec, j) => {
      if (spec.header.startsWith('(')) return;
      const live = String(header[j]?.v ?? '').trim();
      const want = spec.header.replace(/\s*\(.*\)$/, '').trim();
      if (live.toLowerCase() === want.toLowerCase()) return;
      const known = KNOWN_BAD_HEADERS[sheet.name]?.[j];
      res.headerProblems.push(
        `${colLetters(j)}1 reads "${live}", expected "${want}"${known === live ? ' (known vandalism)' : ''}`
      );
    });

    const rows = sheetRows(sheet);
    res.rows = rows.length;
    const m: MatchResult = matchRows(
      sheet.name,
      rows,
      byCategory.get(tab.category) ?? [],
      all,
      ALIASES[sheet.name] ?? {}
    );
    res.match.pairs = m.pairs.map((p) => ({
      row: p.row.rowNumber,
      name: p.row.name,
      entry: `${p.view.entry.category}/${p.view.entry.slug}`,
      how: p.how,
      score: Math.round(p.score * 100) / 100,
      duplicateOf: p.duplicateOf,
    }));
    res.match.sheetOnly = m.sheetOnly.map(({ row, best }) => ({
      row: row.rowNumber,
      name: row.name,
      best: best ? `${best.view.entry.category}/${best.view.entry.slug}` : undefined,
      bestScore: best ? Math.round(best.score * 100) / 100 : undefined,
      ack: findAck(ackKey(sheet.name, row.name, 'row'), '')?.reason,
      inBaseline: Boolean(baseline[row.rowNumber - 1]),
    }));
    res.match.yamlOnly = m.yamlOnly.map((v) => {
      const first = entryCommits(v.entry.file, new Set()).at(-1);
      return {
        entry: `${v.entry.category}/${v.entry.slug}`,
        name: String(v.entry.data.name),
        since: imported.has(`${v.entry.category}/${v.entry.slug}`)
          ? 'in the 2026-01-21 import'
          : first
            ? `added ${first.date} in ${first.hash.slice(0, 7)} (${first.subject})`
            : undefined,
      };
    });

    const pairByRow = new Map(m.pairs.map((p) => [p.row.rowNumber, p]));
    const commitCache = new Map<string, string>();
    const revisedBy = (pairEntry: EntryView) => {
      const file = pairEntry.entry.file;
      if (!commitCache.has(file)) {
        const cs = entryCommits(file, IGNORED_COMMITS);
        commitCache.set(
          file,
          cs.map((c) => `${c.hash.slice(0, 7)} ${c.date} ${c.subject}`).join('; ')
        );
      }
      return commitCache.get(file) ?? '';
    };

    for (let r = 1; r < sheet.rows.length; r++) {
      const cells = sheet.rows[r];
      const rowNumber = r + 1;
      const pair = pairByRow.get(rowNumber);
      const name = String(cells[0]?.v ?? '').trim();
      const baseRow = baseline[r];
      const curRow = current[r];
      const entryId = pair ? `${pair.view.entry.category}/${pair.view.entry.slug}` : undefined;
      const importText = entryId ? imported.get(entryId) : undefined;

      cells.forEach((cell, j) => {
        if (!cell) return;
        const a1 = `${colLetters(j)}${rowNumber}`;
        const spec = specs[j];
        const column = spec?.header ?? `(${colLetters(j)}, unmapped)`;
        const shown = displayValue(cell);
        const base: CellResult = {
          a1,
          row: rowNumber,
          name,
          entry: entryId,
          column,
          value: String(shown ?? ''),
          status: 'ok',
          baseline: baseRow ? baseRow[j] : undefined,
        };
        const origin = (
          x: CellResult,
          sheetValue: string | number | boolean | undefined
        ): Origin => {
          if (!baseRow) return 'new-row';
          if (norm(baseRow[j]) !== norm(curRow?.[j])) return 'sheet-edited';
          // CSV exports carry no notes or hyperlinks, and print numbers at
          // their format's precision: those were lost converting
          if (sheetValue === undefined || x.status === 'rounded') return 'conversion-loss';
          if (importText === undefined) return 'unknown';
          if (!valuePresent(sheetValue, importText)) return 'conversion-loss';
          // In the import but not now: a research commit changed it, or a
          // bulk migration (IGNORED_COMMITS) dropped it
          return pair && revisedBy(pair.view) ? 'yaml-revised' : 'migration-loss';
        };
        const finish = <T extends CellResult>(
          x: T,
          ackValue: string,
          suffix: string,
          sv?: string | number | boolean
        ): T => {
          if (['ok', 'elsewhere', 'derived', 'dropped'].includes(x.status)) return x;
          const o = origin(x, sv);
          const withOrigin = {
            ...x,
            origin: o,
            detail: [
              x.detail,
              o === 'yaml-revised' && pair ? `YAML commits: ${revisedBy(pair.view) || 'none'}` : '',
            ]
              .filter(Boolean)
              .join('; '),
          };
          const ack = findAck(ackKey(sheet.name, name, `${column}${suffix}`), ackValue);
          return ack ? { ...withOrigin, status: 'ack', ack: ack.reason } : withOrigin;
        };

        if (shown !== undefined && String(shown).trim() !== '' && pair && spec) {
          const value = spec.transform ? spec.transform(shown) : shown;
          const v = compareCell(value, spec, pair.view, ctx, cell.f, cellLink(cell));
          res.cells.push(finish({ ...base, ...v }, String(shown), '', shown));
        }

        const link = cellLink(cell);
        if (link && pair) {
          const ok = hasUrl(pair.view, link);
          res.links.push(
            finish({ ...base, url: link, status: ok ? 'ok' : 'missing' }, link, ' (link)')
          );
        }

        if (cell.note) {
          let status: Status = 'missing';
          if (pair) {
            if (coverage(cell.note, pair.view.visible) >= 0.75) status = 'ok';
            else if (coverage(cell.note, `${pair.view.visible}\n${pair.view.comments}`) >= 0.75) {
              status = 'comment';
            }
          }
          res.notes.push(finish({ ...base, note: cell.note, status }, cell.note, ' (note)'));
        }

        if (cell.fill && !DECORATIVE.has(cell.fill)) {
          res.flags.push({
            ...base,
            color: cell.fill,
            meaning: HIGHLIGHTS[cell.fill] ?? 'unknown highlight',
          });
        }
      });
    }
    results.push(res);
  }

  const out = arg('--out') ?? 'plans/spreadsheet-parity/report.md';
  mkdirSync(dirname(out), { recursive: true });
  // Prettier-clean, so the committed report passes format:check
  const config = (await resolveConfig(out)) ?? {};
  writeFileSync(out, await format(renderReport(results, cellUrl), { ...config, filepath: out }));
  const json = arg('--json');
  if (json) writeFileSync(json, JSON.stringify(results, null, 1));

  // Console summary
  const open = (s: string) => !['ok', 'elsewhere', 'derived', 'dropped', 'ack'].includes(s);
  for (const r of results) {
    const cellOpen = r.cells.filter((c) => open(c.status)).length;
    const linkOpen = r.links.filter((c) => open(c.status)).length;
    const noteOpen = r.notes.filter((c) => open(c.status)).length;
    const rowOpen = r.match.sheetOnly.filter((s) => !s.ack).length;
    console.log(
      `${r.tab.padEnd(26)} rows ${String(r.rows).padStart(3)}  unmatched ${rowOpen}  cells ${cellOpen}/${r.cells.length}  links ${linkOpen}/${r.links.length}  notes ${noteOpen}/${r.notes.length}  flags ${r.flags.length}`
    );
  }
  console.log(`Report: ${out}`);
}

await main();
