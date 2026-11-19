/**
 * Minimal XLSX reader for the Google Sheets export of the original sheet.
 *
 * Reads exactly what the parity audit needs and nothing more: cell values,
 * formulas, hyperlinks, cell notes (exported as legacy comments), solid fill
 * colors (the sheet's "needs verification" / "missing data" highlights), and
 * custom number formats (the sheet keeps units in formats, not in values).
 *
 * The export is machine-generated, well-formed XML, so targeted regexes are
 * enough; no XML library needed.
 */

import JSZip from 'jszip';

export interface Cell {
  /** Cached cell value (formula results included). */
  v?: string | number | boolean;
  /** Formula text including the leading '=' */
  f?: string;
  /** Cell hyperlink target */
  link?: string;
  /** Cell note (Google Sheets "Insert note") */
  note?: string;
  /** Solid background fill as RRGGBB (white omitted) */
  fill?: string;
  /** Number format code, when not General */
  fmt?: string;
}

export interface Sheet {
  name: string;
  /** rows[r][c], 0-based; row 0 is the header row */
  rows: (Cell | null)[][];
}

const BUILTIN_FORMATS: Record<number, string> = {
  0: 'General',
  1: '0',
  2: '0.00',
  3: '#,##0',
  4: '#,##0.00',
  9: '0%',
  10: '0.00%',
  14: 'm/d/yyyy',
  49: '@',
};

export function decodeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? decodeXml(m[1]) : undefined;
}

/** Concatenate every <t> run inside an XML fragment (shared strings, comments). */
function textRuns(xml: string): string {
  let out = '';
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)) {
    out += decodeXml(m[1] ?? '');
  }
  return out;
}

export function colIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function colLetters(index: number): string {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function relsMap(xml: string | undefined): Map<string, { type: string; target: string }> {
  const map = new Map<string, { type: string; target: string }>();
  if (!xml) return map;
  for (const m of xml.matchAll(/<Relationship\s[^>]*>/g)) {
    const id = attr(m[0], 'Id');
    const type = attr(m[0], 'Type') ?? '';
    const target = attr(m[0], 'Target') ?? '';
    if (id) map.set(id, { type: type.split('/').pop() ?? type, target });
  }
  return map;
}

function resolvePath(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const parts = base.split('/');
  parts.pop();
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

export async function readXlsx(data: ArrayBuffer | Uint8Array): Promise<Sheet[]> {
  const zip = await JSZip.loadAsync(data);
  const read = async (path: string) => zip.file(path)?.async('string');

  const shared: string[] = [];
  const sst = await read('xl/sharedStrings.xml');
  if (sst) for (const m of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(textRuns(m[1]));

  // Styles: cellXfs index -> { numFmt code, fill rgb }
  const stylesXml = (await read('xl/styles.xml')) ?? '';
  const numFmts = new Map<number, string>();
  for (const m of stylesXml.matchAll(/<numFmt\s[^>]*\/>/g)) {
    numFmts.set(Number(attr(m[0], 'numFmtId')), attr(m[0], 'formatCode') ?? '');
  }
  const fills: (string | undefined)[] = [];
  const fillsBlock = stylesXml.match(/<fills[^>]*>([\s\S]*?)<\/fills>/)?.[1] ?? '';
  for (const m of fillsBlock.matchAll(/<fill>([\s\S]*?)<\/fill>|<fill\/>/g)) {
    const body = m[1] ?? '';
    const solid = /patternType="solid"/.test(body);
    const rgb = body.match(/<fgColor\s[^>]*rgb="([0-9A-Fa-f]{8})"/)?.[1];
    fills.push(solid && rgb ? rgb.slice(2).toUpperCase() : undefined);
  }
  const xfs: { fmt?: string; fill?: string }[] = [];
  const xfBlock = stylesXml.match(/<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/)?.[1] ?? '';
  for (const m of xfBlock.matchAll(/<xf\s[^>]*?(?:\/>|>[\s\S]*?<\/xf>)/g)) {
    const tag = m[0].match(/<xf\s[^>]*>/)?.[0] ?? m[0];
    const numFmtId = Number(attr(tag, 'numFmtId') ?? 0);
    const fillId = Number(attr(tag, 'fillId') ?? 0);
    const fmt = numFmts.get(numFmtId) ?? BUILTIN_FORMATS[numFmtId] ?? 'General';
    const fill = fills[fillId];
    xfs.push({
      fmt: fmt === 'General' ? undefined : fmt,
      fill: fill && fill !== 'FFFFFF' ? fill : undefined,
    });
  }

  const workbook = (await read('xl/workbook.xml')) ?? '';
  const wbRels = relsMap(await read('xl/_rels/workbook.xml.rels'));
  const sheets: Sheet[] = [];

  for (const m of workbook.matchAll(/<sheet\s[^>]*\/>/g)) {
    const name = attr(m[0], 'name') ?? '';
    const rid = attr(m[0], 'r:id') ?? '';
    const rel = wbRels.get(rid);
    if (!rel) continue;
    const path = resolvePath('xl/workbook.xml', rel.target);
    const xml = (await read(path)) ?? '';
    const relsPath = path.replace(/([^/]+)$/, '_rels/$1.rels');
    const rels = relsMap(await read(relsPath));

    const cells = new Map<string, Cell>();
    const get = (r: number, c: number) => {
      const key = `${r},${c}`;
      let cell = cells.get(key);
      if (!cell) {
        cell = {};
        cells.set(key, cell);
      }
      return cell;
    };

    for (const cm of xml.matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = ` ${cm[1]}`;
      const ref = attr(attrs, 'r') ?? '';
      const rm = ref.match(/^([A-Z]+)(\d+)$/);
      if (!rm) continue;
      const r = Number(rm[2]) - 1;
      const c = colIndex(rm[1]);
      const style = xfs[Number(attr(attrs, 's') ?? 0)] ?? {};
      const body = cm[2] ?? '';
      const t = attr(attrs, 't');
      // Shared-formula dependents are self-closing (<f t="shared" si="0"/>):
      // the text lives on the master cell, but the cell is still computed.
      const fm = body.match(/<f(?:\s[^>]*)?>([\s\S]*?)<\/f>/) ?? body.match(/<f\s[^>]*\/>()/);
      const vm = body.match(/<v>([\s\S]*?)<\/v>/);
      let v: Cell['v'];
      if (t === 's' && vm) v = shared[Number(vm[1])];
      else if (t === 'inlineStr') v = textRuns(body.match(/<is>([\s\S]*?)<\/is>/)?.[1] ?? '');
      else if (t === 'b' && vm) v = vm[1] === '1';
      else if ((t === 'str' || t === 'e') && vm) v = decodeXml(vm[1]);
      else if (vm) v = Number(vm[1]);
      const hasContent = v !== undefined && v !== '';
      if (!hasContent && !fm && !style.fill) continue;
      const cell = get(r, c);
      if (hasContent) cell.v = v;
      if (fm) cell.f = fm[1] ? `=${decodeXml(fm[1])}` : '=(shared formula)';
      if (style.fill) cell.fill = style.fill;
      if (style.fmt && hasContent) cell.fmt = style.fmt;
    }

    for (const hm of xml.matchAll(/<hyperlink\s[^>]*\/>/g)) {
      const ref = attr(hm[0], 'ref') ?? '';
      const rid2 = attr(hm[0], 'r:id');
      const target = rid2 ? rels.get(rid2)?.target : attr(hm[0], 'location');
      const rm = ref.match(/^([A-Z]+)(\d+)/);
      if (rm && target) get(Number(rm[2]) - 1, colIndex(rm[1])).link = target;
    }

    for (const rel2 of rels.values()) {
      if (rel2.type !== 'comments') continue;
      const cxml = (await read(resolvePath(path, rel2.target))) ?? '';
      for (const com of cxml.matchAll(/<comment\s([^>]*)>([\s\S]*?)<\/comment>/g)) {
        const ref = attr(` ${com[1]}`, 'ref') ?? '';
        const rm = ref.match(/^([A-Z]+)(\d+)$/);
        if (rm) get(Number(rm[2]) - 1, colIndex(rm[1])).note = textRuns(com[2]).trim();
      }
    }

    let maxR = -1;
    let maxC = -1;
    for (const [key, cell] of cells) {
      if (cell.v === undefined && !cell.f && !cell.link && !cell.note) continue;
      const [r, c] = key.split(',').map(Number);
      maxR = Math.max(maxR, r);
      maxC = Math.max(maxC, c);
    }
    const rows: (Cell | null)[][] = [];
    for (let r = 0; r <= maxR; r++) {
      const row: (Cell | null)[] = [];
      for (let c = 0; c <= maxC; c++) row.push(cells.get(`${r},${c}`) ?? null);
      rows.push(row);
    }
    sheets.push({ name, rows });
  }
  return sheets;
}
