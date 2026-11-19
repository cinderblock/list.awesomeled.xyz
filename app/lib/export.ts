/**
 * Turning rows into text people can take elsewhere: CSV and TSV for
 * spreadsheets, a Markdown table for forums and chat, and plain objects for
 * JSON / YAML. Pure functions; the browser side (clipboard, downloads) lives
 * in lib/download.ts.
 */

import type { BaseEntry } from './types';

export const DATABASE_LICENSE = 'ODbL-1.0';

/** What an export needs from a column. */
export interface ExportColumn {
  label: string;
  text: (item: BaseEntry) => string;
}

export interface Matrix {
  header: string[];
  rows: string[][];
}

/** Rows × columns as display text. */
export function buildMatrix(rows: BaseEntry[], columns: ExportColumn[]): Matrix {
  return {
    header: columns.map((c) => c.label),
    rows: rows.map((row) => columns.map((c) => c.text(row))),
  };
}

// Spreadsheets run cells that start with = + - @ as formulas. A value like
// "+5V" would show as an error, and a hostile one could do worse, so those
// cells get a leading apostrophe (which spreadsheets hide and treat as "this
// is text"). Plain signed numbers are left alone.
function guardFormula(cell: string): string {
  if (!/^[=+\-@]/.test(cell)) return cell;
  if (/^[+-]?\d[\d,.]*$/.test(cell)) return cell;
  return `'${cell}`;
}

function csvCell(cell: string): string {
  const guarded = guardFormula(cell);
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

/** RFC 4180 CSV (quotes only where needed). */
export function matrixToCSV(matrix: Matrix): string {
  return [matrix.header, ...matrix.rows].map((row) => row.map(csvCell).join(',')).join('\n');
}

// A TSV cell cannot contain a tab or newline; flatten them to spaces
function tsvCell(cell: string): string {
  return guardFormula(cell.replace(/[\t\r\n]+/g, ' '));
}

/** Tab-separated text: pastes straight into spreadsheet cells. */
export function matrixToTSV(matrix: Matrix): string {
  return [matrix.header, ...matrix.rows].map((row) => row.map(tsvCell).join('\t')).join('\n');
}

function markdownCell(cell: string): string {
  return cell.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

/** A GitHub-flavored Markdown table (Reddit, Discord, GitHub, forums). */
export function matrixToMarkdown(matrix: Matrix): string {
  const line = (cells: string[]) => `| ${cells.map(markdownCell).join(' | ')} |`;
  return [line(matrix.header), line(matrix.header.map(() => '---')), ...matrix.rows.map(line)].join(
    '\n'
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** An HTML table, for the rich-text clipboard flavor (documents, email). */
export function matrixToHTML(matrix: Matrix): string {
  const row = (cells: string[], tag: 'th' | 'td') =>
    `<tr>${cells.map((c) => `<${tag}>${escapeHtml(c)}</${tag}>`).join('')}</tr>`;
  return `<table><thead>${row(matrix.header, 'th')}</thead><tbody>${matrix.rows
    .map((r) => row(r, 'td'))
    .join('')}</tbody></table>`;
}

/**
 * Entries as plain data for JSON / YAML: the stored fields plus `id`, with
 * the review date as an ISO day. Key order follows the YAML source.
 */
export function entriesToPlain(rows: BaseEntry[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const { id, updated, ...rest } = row;
    const out: Record<string, unknown> = { id, ...rest };
    if (updated instanceof Date && !Number.isNaN(updated.getTime())) {
      out.reviewed = updated.toISOString().slice(0, 10);
    }
    return out;
  });
}

/** The wrapper every data export carries: where it came from and its license. */
export function exportDocument(
  source: string,
  category: { id: string; name: string },
  rows: BaseEntry[]
): Record<string, unknown> {
  return {
    source,
    license: DATABASE_LICENSE,
    category: category.id,
    count: rows.length,
    entries: entriesToPlain(rows),
  };
}

/** "controllers_q-falcon_sort-price.csv" — a filename that says what is in it. */
export function exportFilename(
  categoryId: string,
  state: { q?: string; sort?: string | null; filters?: string[] },
  ext: string
): string {
  const clean = (s: string) => s.replace(/[^a-zA-Z0-9.-]+/g, '-').replace(/^-+|-+$/g, '');
  const parts = [categoryId];
  if (state.q) parts.push(`q-${clean(state.q).slice(0, 24)}`);
  for (const f of (state.filters ?? []).slice(0, 3)) {
    const c = clean(f).slice(0, 28);
    if (c) parts.push(c);
  }
  if (state.sort) parts.push(`sort-${clean(state.sort).slice(0, 24)}`);
  return `${parts.join('_')}.${ext}`;
}
