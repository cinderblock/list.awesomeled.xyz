// cspell:ignore acked
/**
 * Markdown rendering of the parity results (plans/spreadsheet-parity/report.md).
 */

import { COLUMNS } from './columns';
import type { CellResult, TabResult } from './main';
import { colLetters } from './xlsx';

const OPEN = new Set(['missing', 'differs', 'rounded', 'comment']);

const ORIGIN: Record<string, string> = {
  'sheet-edited': 'sheet edited after import',
  'yaml-revised': 'YAML revised after import',
  'migration-loss': 'dropped by a later bulk migration',
  'conversion-loss': 'lost in CSV conversion',
  'new-row': 'row added after import',
  unknown: '?',
};

function origin(c: CellResult): string {
  return c.origin ? ORIGIN[c.origin] : '';
}

function esc(s: string | undefined, max = 160): string {
  if (s === undefined) return '';
  const one = s.replace(/\s+/g, ' ').trim();
  const cut = one.length > max ? `${one.slice(0, max - 1)}…` : one;
  return cut.replace(/\|/g, '\\|');
}

function localStamp(d: Date): string {
  const local = d.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
  return `${local} (${d.toISOString().slice(0, 16).replace('T', ' ')}Z)`;
}

export function renderReport(
  results: TabResult[],
  cellUrl: (tab: string, a1: string) => string
): string {
  const out: string[] = [];
  const link = (tab: string, a1: string) => `[${a1}](${cellUrl(tab, a1)})`;
  const isOpen = (c: CellResult) => OPEN.has(c.status);

  out.push('# Spreadsheet parity report');
  out.push('');
  out.push(
    `Generated ${localStamp(new Date())} from the live sheet by \`bun run sheet-parity\`. ` +
      'Do not edit by hand; see [../spreadsheet-parity.md](../spreadsheet-parity.md) for the audit plan and decisions.'
  );
  out.push('');
  out.push(
    'Statuses: **missing** = the sheet has a value the YAML lacks; **differs** = the mapped YAML field holds something else; ' +
      '**rounded** = YAML holds a rounded display copy of the sheet number; **comment** = only in a YAML comment (not on the site); ' +
      '**ack** = reviewed and deliberately not migrated (reason given). Cells that match, or whose content lives in another field, are not listed.'
  );
  out.push('');
  out.push('## Summary');
  out.push('');
  out.push(
    '| Tab | Rows | Unmatched rows | YAML-only | Open cells | Open links | Open notes | Highlights |'
  );
  out.push('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const r of results) {
    const unmatched = r.match.sheetOnly.filter((s) => !s.ack).length;
    out.push(
      `| [${r.tab}](#${r.tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}) | ${r.rows} | ${unmatched} | ${r.match.yamlOnly.length} | ` +
        `${r.cells.filter(isOpen).length} / ${r.cells.length} | ${r.links.filter(isOpen).length} / ${r.links.length} | ` +
        `${r.notes.filter(isOpen).length} / ${r.notes.length} | ${r.flags.length} |`
    );
  }
  out.push('');

  for (const r of results) {
    out.push(`## ${r.tab}`);
    out.push('');
    out.push(`Database folder: \`database/${r.category}/\`.`);
    out.push('');
    out.push('<details><summary>Column mapping</summary>');
    out.push('');
    out.push('| Col | Sheet header | YAML field(s) | Compared as | Note |');
    out.push('| --- | --- | --- | --- | --- |');
    (COLUMNS[r.tab] ?? []).forEach((spec, j) => {
      const kind =
        spec.kind.type === 'derived' || spec.kind.type === 'dropped'
          ? `${spec.kind.type}: ${spec.kind.why}`
          : spec.kind.type === 'number' && spec.kind.unit
            ? `number (${spec.kind.unit})`
            : spec.kind.type;
      const paths = [...spec.paths.map((p) => `\`${p}\``), ...(spec.derive ? ['(derived)'] : [])];
      out.push(
        `| ${colLetters(j)} | ${esc(spec.header, 40)} | ${paths.join(', ') || '—'} | ${esc(kind, 120)} | ${esc(spec.note, 160)} |`
      );
    });
    out.push('');
    out.push('</details>');
    out.push('');
    if (r.headerProblems.length) {
      out.push('Header problems:');
      out.push('');
      for (const h of r.headerProblems) out.push(`- ${h}`);
      out.push('');
    }

    const unmatched = r.match.sheetOnly;
    if (unmatched.length) {
      out.push('### Sheet rows without a YAML entry');
      out.push('');
      for (const s of unmatched) {
        const guess = s.best ? ` (closest: \`${s.best}\`, score ${s.bestScore})` : '';
        const when = s.inBaseline ? '' : ' — added to the sheet after the 2026-01-21 import';
        const ack = s.ack ? ` — **ack**: ${s.ack}` : '';
        out.push(`- ${link(r.tab, `A${s.row}`)} "${esc(s.name, 60)}"${guess}${when}${ack}`);
      }
      out.push('');
    }
    const odd = r.match.pairs.filter((p) => p.how !== 'name' || p.duplicateOf);
    if (odd.length) {
      out.push('### Rows paired by alias, URL, or as duplicates');
      out.push('');
      for (const p of odd) {
        const dup = p.duplicateOf ? `, duplicate of row ${p.duplicateOf}` : '';
        out.push(
          `- ${link(r.tab, `A${p.row}`)} "${esc(p.name, 60)}" → \`${p.entry}\` (${p.how}, score ${p.score}${dup})`
        );
      }
      out.push('');
    }
    if (r.match.yamlOnly.length) {
      out.push('### YAML entries with no sheet row');
      out.push('');
      for (const y of r.match.yamlOnly)
        out.push(`- \`${y.entry}\` "${esc(y.name, 60)}"${y.since ? `: ${esc(y.since, 140)}` : ''}`);
      out.push('');
    }

    const cells = r.cells.filter(isOpen);
    if (cells.length) {
      out.push('### Open cell differences');
      out.push('');
      out.push('| Cell | Entry | Column | Sheet | YAML | Status | Origin |');
      out.push('| --- | --- | --- | --- | --- | --- | --- |');
      for (const c of cells) {
        out.push(
          `| ${link(r.tab, c.a1)} | \`${c.entry?.split('/')[1] ?? ''}\` | ${esc(c.column, 30)} | ${esc(c.value)} | ${esc(c.yaml)} | ${c.status}${c.detail ? `: ${esc(c.detail, 120)}` : ''} | ${origin(c)} |`
        );
      }
      out.push('');
    }
    const links = r.links.filter(isOpen);
    if (links.length) {
      out.push('### Hyperlinks not in YAML');
      out.push('');
      for (const c of links) {
        out.push(
          `- ${link(r.tab, c.a1)} \`${c.entry?.split('/')[1] ?? ''}\` ${esc(c.column, 30)}: <${c.url}> (${origin(c)})`
        );
      }
      out.push('');
    }
    const notes = r.notes.filter(isOpen);
    if (notes.length) {
      out.push('### Cell notes not in YAML');
      out.push('');
      for (const c of notes) {
        out.push(
          `- ${link(r.tab, c.a1)} \`${c.entry?.split('/')[1] ?? '(no entry)'}\` ${esc(c.column, 30)} (${c.status}, ${origin(c)}): ${esc(c.note, 400)}`
        );
      }
      out.push('');
    }
    if (r.flags.length) {
      out.push('### Highlighted cells');
      out.push('');
      for (const f of r.flags) {
        out.push(
          `- ${link(r.tab, f.a1)} \`${f.entry?.split('/')[1] ?? ''}\` ${esc(f.column, 30)} = "${esc(f.value, 60)}": ${f.meaning} (#${f.color})`
        );
      }
      out.push('');
    }
    const acked = [...r.cells, ...r.links, ...r.notes].filter((c) => c.status === 'ack');
    if (acked.length) {
      out.push('<details><summary>Acknowledged differences (' + acked.length + ')</summary>');
      out.push('');
      for (const c of acked) {
        out.push(
          `- ${link(r.tab, c.a1)} \`${c.entry?.split('/')[1] ?? ''}\` ${esc(c.column, 30)} "${esc(c.value, 60)}": ${esc(c.ack, 200)}`
        );
      }
      out.push('');
      out.push('</details>');
      out.push('');
    }
  }
  return `${out.join('\n')}\n`;
}
