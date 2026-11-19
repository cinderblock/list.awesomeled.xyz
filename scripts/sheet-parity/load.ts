// cspell:ignore awesomeled
/**
 * Loading for the sheet-parity audit: the sheet (public XLSX export, or a
 * local copy) and the YAML database, plus sheet-row <-> YAML-entry matching.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';
import { readXlsx, type Cell, type Sheet } from './xlsx';

export const SHEET_ID = '10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA';
export const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;

/** Sheet tab name (trimmed) -> database folder, plus the tab's gid for deep links. */
export const TABS: Record<string, { category: string; gid: number }> = {
  'Pattern Drivers': { category: 'pattern-drivers', gid: 961824890 },
  Controllers: { category: 'controllers', gid: 0 },
  Pixels: { category: 'pixels', gid: 755169190 },
  'Pixel ICs': { category: 'pixel-ics', gid: 795156605 },
  'Pixel Decoders': { category: 'pixel-decoders', gid: 1520623513 },
  'Level Converters': { category: 'level-converters', gid: 1484346977 },
  Adapters: { category: 'adapters', gid: 866679715 },
  'DIY MicroBoards': { category: 'microboards', gid: 1497158237 },
  Connectors: { category: 'connectors', gid: 602979062 },
  'Drive Libraries': { category: 'drive-libraries', gid: 1543805468 },
  'Diffusive Materials': { category: 'diffusive-materials', gid: 554721273 },
  'Commercial Pixel Systems': { category: 'commercial-systems', gid: 248280587 },
};

export const README_GID = 1749630164;

export function cellUrl(tab: string, a1: string): string {
  const gid = TABS[tab]?.gid ?? README_GID;
  return `${SHEET_URL}/edit#gid=${gid}&range=${a1}`;
}

/** Fetch the XLSX export (or read a local copy). Downloads are cached per day. */
export async function loadSheets(localPath?: string): Promise<Sheet[]> {
  let data: Uint8Array;
  if (localPath) {
    data = readFileSync(localPath);
  } else {
    const dir = join(tmpdir(), 'awesomeled-sheet-parity');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `sheet-${new Date().toISOString().slice(0, 10)}.xlsx`);
    if (existsSync(file)) {
      data = readFileSync(file);
    } else {
      const res = await fetch(`${SHEET_URL}/export?format=xlsx`);
      if (!res.ok) throw new Error(`Sheet export failed: HTTP ${res.status}`);
      data = new Uint8Array(await res.arrayBuffer());
      writeFileSync(file, data);
    }
  }
  const sheets = await readXlsx(data);
  for (const s of sheets) s.name = s.name.trim();
  return sheets;
}

export interface Entry {
  category: string;
  slug: string;
  file: string;
  data: Record<string, unknown>;
  /** Raw YAML text, for "is this value anywhere in the entry" checks */
  text: string;
}

export function loadCategory(category: string, dbDir = 'database'): Entry[] {
  const dir = join(dbDir, category);
  const entries: Entry[] = [];
  for (const fn of readdirSync(dir).sort()) {
    if (!fn.endsWith('.yaml') || fn.startsWith('_')) continue;
    const file = join(dir, fn);
    const text = readFileSync(file, 'utf-8');
    const data = parse(text) as Record<string, unknown>;
    entries.push({ category, slug: fn.replace(/\.yaml$/, ''), file, data, text });
  }
  return entries;
}

/**
 * Lowercase alphanumerics only: "Falcon F16V4" == "falcon-f16v4". A "+" is
 * significant ("Raspberry Pi 3 Model B" vs "B+", "Teensy 2.0" vs "Teensy++").
 */
export function normName(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '');
}

export interface SheetRow {
  tab: string;
  /** 1-based sheet row number */
  rowNumber: number;
  name: string;
  cells: (Cell | null)[];
}

/** Data rows of a tab: every row after the header with a name in column A. */
export function sheetRows(sheet: Sheet): SheetRow[] {
  const rows: SheetRow[] = [];
  sheet.rows.forEach((cells, i) => {
    if (i === 0) return;
    const v = cells[0]?.v;
    const name = v === undefined ? '' : String(v).trim();
    // Blank rows (a lone space counts as blank) aren't products
    if (!name && !cells.some((c) => c?.v !== undefined && String(c.v).trim() !== '')) return;
    rows.push({ tab: sheet.name, rowNumber: i + 1, name, cells });
  });
  return rows;
}
