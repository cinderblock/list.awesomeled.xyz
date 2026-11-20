// cspell:ignore googlefinance advateklighting advateklights curpageloguid fbclid gatewayadapt microsd polyethelene raspberrypi sdcard segs srsltid utparam wlan
/**
 * Cell-level comparison between a sheet cell and a YAML entry.
 *
 * Every sheet value is checked first against the YAML field(s) its column
 * maps to, then (so restructured data still counts) against everything the
 * entry shows on the site, then against the entry's YAML comments, which the
 * site never renders.
 */

import { parseQuantity, type QuantityKind } from '../../app/lib/quantity';
import type { Entry } from './load';

export type Status =
  | 'ok' // matches the mapped field
  | 'elsewhere' // found in another site-visible field of the entry
  | 'comment' // only in a YAML comment (not shown on the site)
  | 'rounded' // YAML holds a rounded/display copy of the sheet number
  | 'missing' // mapped field empty and value found nowhere
  | 'differs' // mapped field holds something else; value found nowhere
  | 'derived' // computed column, intentionally not stored
  | 'dropped'; // column intentionally not migrated

export interface Verdict {
  status: Status;
  /** What the mapped YAML field holds, for the report */
  yaml?: string;
  detail?: string;
}

export type Kind =
  | { type: 'text' }
  /** Case-insensitive whole-string match ("$$$" price tiers) */
  | { type: 'exact' }
  /** `scale` converts the sheet number to the YAML base unit; `tol` is a relative tolerance */
  | { type: 'number'; unit?: QuantityKind; scale?: number; tol?: number }
  | { type: 'price' }
  | { type: 'bool' }
  | { type: 'url' }
  | { type: 'enum'; map: Record<string, unknown[]> }
  /** Column-specific logic; return undefined to fall back to text rules */
  | {
      type: 'custom';
      fn: (text: string, mapped: unknown[], view: EntryView) => Verdict | undefined;
    }
  | { type: 'derived'; why: string }
  | { type: 'dropped'; why: string };

export interface DeriveContext {
  /** connectors/<slug> -> that entry's site-visible text (name, aliases, maker, ...) */
  connectorText: Map<string, string>;
}

export interface ColumnSpec {
  /** Header text as it should read (the live header may be vandalized) */
  header: string;
  /** YAML paths holding this column's data; `a[].b` maps arrays, `a@keys` lists keys */
  paths: string[];
  kind: Kind;
  /** Mapping note for the report */
  note?: string;
  /** Custom YAML-side value extraction (e.g. total pixels = count x per-output) */
  derive?: (data: Record<string, unknown>, ctx: DeriveContext) => unknown[];
  /** Rewrite the sheet value before comparing (e.g. pattern-driver price codes) */
  transform?: (v: string | number | boolean) => string | number | boolean;
  /** Fields whose `sources` citation settles a difference (default: paths) */
  cite?: string[];
}

// ---------------------------------------------------------------------------
// YAML access

export function getAt(data: unknown, path: string): unknown[] {
  const keysMode = path.endsWith('@keys');
  const segs = (keysMode ? path.slice(0, -5) : path).split('.');
  let cur: unknown[] = [data];
  for (const seg of segs) {
    const isArr = seg.endsWith('[]');
    const key = isArr ? seg.slice(0, -2) : seg;
    const next: unknown[] = [];
    for (const v of cur) {
      if (v && typeof v === 'object' && !Array.isArray(v) && key in v) {
        const x = (v as Record<string, unknown>)[key];
        if (isArr && Array.isArray(x)) next.push(...x);
        else next.push(x);
      }
    }
    cur = next;
  }
  if (keysMode) {
    return cur.flatMap((v) => (v && typeof v === 'object' ? Object.keys(v) : []));
  }
  return cur.filter((v) => v !== null && v !== undefined);
}

/** All leaf scalars (and object keys) under a value, as strings. */
export function leaves(v: unknown, withKeys = true): string[] {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v.flatMap((x) => leaves(x, withKeys));
  if (typeof v === 'object') {
    return Object.entries(v).flatMap(([k, x]) => [
      ...(withKeys ? [k] : []),
      ...leaves(x, withKeys),
    ]);
  }
  return [String(v)];
}

// ---------------------------------------------------------------------------
// Text normalization

const STOP = new Set(
  'a an and are as at be but by can for from has have if in into is it its of on or so that the this to was were will with not no yes'.split(
    ' '
  )
);

/** Spellings the database normalized; compare them as one token. */
const SYNONYMS: Record<string, string> = {
  'e1.31': 'sacn',
  e131: 'sacn',
  // SD card flavours compare as one token
  usd: 'sd',
  tf: 'sd',
  microsd: 'sd',
  sdcard: 'sd',
  dmx512: 'dmx',
  // Diffusive materials store polymer codes (2c469a1)
  polyester: 'pet',
  acrylic: 'pmma',
  polycarbonate: 'pc',
  polypropylene: 'pp',
  polyethylene: 'pe',
  polyethelene: 'pe',
  vinyl: 'pvc',
  wlan: 'wifi',
  colour: 'color',
  colours: 'color',
  fibre: 'fiber',
  grey: 'gray',
  centre: 'center',
};

/**
 * Normalized word tokens. With `joinUnits`, "400 Hz" becomes "400hz" (the
 * spelling YAML quantities use); without it, "400Hz" stays one token.
 */
export function tokens(s: string, joinUnits = true): string[] {
  let t = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d),(\d{3})/g, '$1$2');
  if (joinUnits)
    t = t.replace(/(\d)\s+(k?hz|mhz|ghz|mv|v|ma|a|mw|w|kb|mb|gb|bits?|mm|awg)\b/g, '$1$2');
  return t
    .replace(/\bwi-fi\b/g, 'wifi')
    .replace(/\bart-net\b/g, 'artnet')
    .replace(/\bmicro[\s-]?sd\b/g, 'microsd')
    .replace(/\bsd \(micro\)/g, 'microsd')
    .split(/[^a-z0-9.+]+/)
    .map((t) => t.replace(/^[.+]+|[.]+$/g, ''))
    .filter((t) => t.length > 1 || /\d/.test(t))
    .filter((t) => !STOP.has(t))
    .map((t) => t.replace(/^x(\d+)$/, '$1')) // "DMX x2"
    .map((t) => SYNONYMS[t] ?? t)
    .map((t) => (t.length > 3 && t.endsWith('s') && !t.endsWith('ss') ? t.slice(0, -1) : t));
}

function compact(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+]+/g, '');
}

/** Fraction of the sheet text's tokens present in the haystack text. */
export function coverage(needle: string, hay: string): number {
  const nt = tokens(needle);
  if (nt.length === 0) return 1;
  // Both spellings on the haystack side: "22" must match "22 AWG", and
  // "400 Hz" must match "400Hz"
  const hayTokens = new Set([...tokens(hay), ...tokens(hay, false)]);
  const hayCompact = compact(hay);
  const whole = compact(needle);
  if (whole.length >= 4 && hayCompact.includes(whole)) return 1; // "RJ-45" vs "RJ45"
  let found = 0;
  for (const t of nt) {
    if (hayTokens.has(t) || (t.length >= 4 && hayCompact.includes(compact(t)))) found++;
  }
  return found / nt.length;
}

/** Domains that moved; the same page under either host is the same link */
const MOVED_HOSTS: [RegExp, string][] = [
  [/^raspberrypi\.org\//, 'raspberrypi.com/'],
  // Advatek moved domains and renamed its protocol knowledge base
  [/^advateklights\.com\/knowledge-base\//, 'advateklighting.com/pixel-protocols/'],
  [/^advateklights\.com\//, 'advateklighting.com/'],
];

export function normUrl(u: string): string {
  let s = u.trim();
  try {
    s = decodeURI(s);
  } catch {
    // keep as-is
  }
  const n = s
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/#.*$/, '')
    .replace(
      /[?&](spm|algo_[a-z_]+|pdp_[a-z_]+|curpageloguid|utparam-url|gatewayadapt|aff_[a-z_]+|sk|src|srsltid|fbclid|_pos|_psq|_ss|_v|ref|pt|hash|attribute_pa_[a-z_]+)=[^&]*/g,
      ''
    )
    .replace(/\?$/, '')
    .replace(/\/+$/, '')
    .replace(/\/+/g, '/');
  for (const [re, to] of MOVED_HOSTS) if (re.test(n)) return n.replace(re, to);
  const ebay = n.match(/^ebay\.[a-z.]+\/itm\/(?:.*\/)?(\d{9,})/);
  if (ebay) return `ebay/itm/${ebay[1]}`;
  // Amazon share links append /ref=... to the product path
  return n.replace(/^(amazon\.[a-z.]+\/(?:.*\/)?dp\/[a-z0-9]{10})\/ref=.*$/, '$1');
}

// ---------------------------------------------------------------------------
// Entry views

export interface EntryView {
  entry: Entry;
  /** Site-visible text: every value and key of the parsed YAML */
  visible: string;
  /** YAML comments only */
  comments: string;
  urls: Set<string>;
}

export function viewOf(entry: Entry): EntryView {
  const visible = leaves(entry.data).join(' \n ');
  const comments = entry.text
    .split('\n')
    .map((l) => l.match(/(?:^|\s)#\s?(.*)$/)?.[1] ?? '')
    .filter(Boolean)
    .join(' \n ');
  const urls = new Set<string>();
  for (const s of leaves(entry.data, false)) {
    for (const m of s.matchAll(/https?:\/\/[^\s)'"<>]+/g)) urls.add(normUrl(m[0]));
  }
  for (const m of entry.text.matchAll(/https?:\/\/[^\s)'"<>]+/g)) urls.add(normUrl(m[0]));
  return { entry, visible, comments, urls };
}

export function hasUrl(view: EntryView, url: string): boolean {
  const n = normUrl(url);
  if (view.urls.has(n)) return true;
  // A sheet link to a site root is covered by any deeper link into that site
  for (const u of view.urls) if (u.startsWith(n + '/')) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Value parsing

const TRUE = /^(y|yes|true|1|✓|✔)\b/i;
const FALSE = /^(n|no|false|0|none|✗|✘|-)$/i;

export function sheetBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  const s = String(v).trim();
  if (TRUE.test(s)) return true;
  if (FALSE.test(s)) return false;
  return undefined;
}

function yamlTruthy(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') {
    const b = sheetBool(v);
    if (b !== undefined) return b;
    return v.trim() !== '';
  }
  if (Array.isArray(v)) return v.length > 0;
  if (v && typeof v === 'object') return true;
  return undefined;
}

/** A YAML value as a number in the column's base unit. */
function yamlNumber(v: unknown, unit?: QuantityKind): number | undefined {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return undefined;
  if (unit) {
    const q = parseQuantity(v.replace(/\s+/g, ''), unit) ?? parseQuantity(v, unit);
    if (q) return q.value;
  }
  const m = v.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : undefined;
}

function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= Math.max(1e-9, Math.abs(b) * 1e-6);
}

function isRounding(yaml: number, sheet: number): boolean {
  for (const d of [0, 1, 2]) {
    const f = 10 ** d;
    if (close(yaml, Math.round(sheet * f) / f)) return true;
  }
  return false;
}

/** A cell holding one number, maybe with a unit or a word: "20", "~5", "20mA", "8 outputs" */
const NUMERIC_CELL = /^[~≈]?\s*-?\d+(?:\.\d+)?\s*[a-zA-Zµ%" ]*$/;

/**
 * The text with digit runs that aren't values taken out: URLs, dates, times
 * and version numbers. A `retrieved: '2026-11-20'` date must not read as 20.
 */
function valueText(hay: string): string {
  return hay
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\b\d{4}-\d{2}(?:-\d{2})?(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?\b/g, ' ')
    .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\bv?\d+(?:\.\d+){2,}\b/gi, ' ');
}

/**
 * Whether a number appears in the text as a value of its own, never as
 * digits inside a date, URL, version or part number ("WS2812B", "ESP32").
 * With a unit, only that quantity counts: a 20 mA cell matches "20mA" or
 * "0.02A" (or a range ending in it), not "20 outputs".
 */
export function numberIn(hay: string, value: number, unit?: QuantityKind, tol = 0): boolean {
  const text = valueText(hay);
  const same = (x: number) => close(x, value) || Math.abs(x - value) <= Math.abs(value) * tol;
  // Not glued on the left to a letter, digit or dot, or to "<digit>-"
  const re =
    /(?<![\w.])(?<!\d-)(\d+(?:\.\d+)?)(?![\d.]*\d)(?:\s?-\s?(\d+(?:\.\d+)?))?\s?([a-zA-Zµ]+)?/g;
  for (const m of text.matchAll(re)) {
    if (!unit) {
      // A count in a range ("8-16 universes") is a bound, not the value
      if (m[2] === undefined && same(Number(m[1]))) return true;
      continue;
    }
    if (!m[3]) continue;
    const ends = [m[1], m[2]].filter((x): x is string => x !== undefined);
    if (
      ends.some((x) => {
        const q = parseQuantity(`${x}${m[3]}`, unit);
        return q !== null && same(q.value);
      })
    )
      return true;
  }
  return false;
}

function show(vs: unknown[]): string {
  return vs.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(' | ');
}

/**
 * What a column's YAML field(s) hold for an entry now, for display
 * (undefined = nothing), and whether the entry cites a source for them.
 */
export function mappedValue(
  spec: ColumnSpec,
  view: EntryView,
  ctx: DeriveContext
): { yaml?: string; sourced: boolean } {
  const data = view.entry.data;
  const roots = (spec.cite ?? spec.paths).map((p) => p.replace(/(\[\]|@keys).*$/, ''));
  const sources = Object.keys((data as { sources?: object }).sources ?? {});
  // A citation for the field, a parent of it, or a part of it
  const sourced = sources.some((s) =>
    roots.some((r) => r === s || r.startsWith(`${s}.`) || s.startsWith(`${r}.`))
  );
  const mapped = [
    ...spec.paths.flatMap((p) => getAt(data, p)),
    ...(spec.derive ? spec.derive(data, ctx) : []),
  ];
  return { yaml: mapped.length ? show(mapped) : undefined, sourced };
}

// ---------------------------------------------------------------------------

export function compareCell(
  value: unknown,
  spec: ColumnSpec,
  view: EntryView,
  ctx: DeriveContext,
  formula?: string,
  link?: string
): Verdict {
  const data = view.entry.data;
  const kind = spec.kind;
  if (kind.type === 'derived') return { status: 'derived', detail: kind.why };
  if (kind.type === 'dropped') return { status: 'dropped', detail: kind.why };

  const mapped = [
    ...spec.paths.flatMap((p) => getAt(data, p)),
    ...(spec.derive ? spec.derive(data, ctx) : []),
  ];
  const yamlShown = mapped.length ? show(mapped) : undefined;
  const text = String(value).trim();

  const fallback = (anyMapped: boolean): Verdict => {
    if (kind.type === 'url') {
      return { status: anyMapped ? 'differs' : 'missing', yaml: yamlShown };
    }
    // A lone number must be found as a number: word coverage would find "20"
    // in any date ending in -20, and the real difference would go unreported
    if (NUMERIC_CELL.test(text)) {
      const unit = kind.type === 'number' ? kind.unit : undefined;
      const tol = kind.type === 'number' ? (kind.tol ?? 0) : 0;
      const own = unit ? parseQuantity(text.replace(/\s+/g, ''), unit) : null;
      const n = typeof value === 'number' ? value : Number(text.match(/-?\d+(?:\.\d+)?/)?.[0]);
      const base = own?.value ?? n * (kind.type === 'number' ? (kind.scale ?? 1) : 1);
      if (numberIn(view.visible, base, unit, tol)) return { status: 'elsewhere', yaml: yamlShown };
      if (numberIn(`${view.visible}\n${view.comments}`, base, unit, tol)) {
        return { status: 'comment', yaml: yamlShown };
      }
      return { status: anyMapped ? 'differs' : 'missing', yaml: yamlShown };
    }
    if (coverage(text, view.visible) >= 0.85) return { status: 'elsewhere', yaml: yamlShown };
    if (coverage(text, `${view.visible}\n${view.comments}`) >= 0.85) {
      return { status: 'comment', yaml: yamlShown };
    }
    return { status: anyMapped ? 'differs' : 'missing', yaml: yamlShown };
  };

  switch (kind.type) {
    case 'custom': {
      const v = kind.fn(text, mapped, view);
      if (v) return { yaml: yamlShown, ...v };
      const hay = mapped.map((m) => leaves(m).join(' ')).join(' \n ');
      if (mapped.length && coverage(text, hay) >= 0.85) return { status: 'ok', yaml: yamlShown };
      return fallback(mapped.length > 0);
    }
    case 'url': {
      // The cell's hyperlink (if any) is what the column means; its text may be "Amazon"
      const target = link ?? text;
      const urls = target.match(/https?:\/\/[^\s,]+/g) ?? [];
      if (!urls.length) {
        if (coverage(text, view.visible) >= 0.85) return { status: 'elsewhere', yaml: yamlShown };
        return {
          status: mapped.length ? 'differs' : 'missing',
          yaml: yamlShown,
          detail: 'not a URL',
        };
      }
      const found = urls.filter((u) => hasUrl(view, u));
      if (found.length === urls.length) {
        const inMapped = mapped.some(
          (m) => typeof m === 'string' && urls.some((u) => normUrl(m) === normUrl(u))
        );
        return { status: inMapped || !spec.paths.length ? 'ok' : 'elsewhere', yaml: yamlShown };
      }
      return {
        status: mapped.length ? 'differs' : 'missing',
        yaml: yamlShown,
        detail: found.length
          ? `${urls.length - found.length} of ${urls.length} URLs missing`
          : undefined,
      };
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(text.replace(/[^0-9.eE+-]/g, ''));
      if (typeof value !== 'number' && !/^[~≈]?\s*-?\d+(\.\d+)?\s*[a-zA-Z%"]*$/.test(text)) {
        // Free text in a numeric column ("5-12", "Configurable"): text rules
        if (mapped.some((m) => coverage(text, String(m)) >= 0.85))
          return { status: 'ok', yaml: yamlShown };
        return fallback(mapped.length > 0);
      }
      const base = n * (kind.scale ?? 1);
      const nums = mapped.map((m) => yamlNumber(m, kind.unit)).filter((x) => x !== undefined);
      const tol = kind.tol ?? 0;
      if (nums.some((x) => close(x, base) || Math.abs(x - base) <= Math.abs(base) * tol)) {
        return { status: 'ok', yaml: yamlShown };
      }
      if (nums.some((x) => isRounding(x / (kind.scale ?? 1), n))) {
        return { status: 'rounded', yaml: yamlShown };
      }
      if (!nums.length && mapped.length) {
        if (mapped.some((m) => coverage(text, String(m)) >= 0.85))
          return { status: 'ok', yaml: yamlShown };
      }
      return fallback(mapped.length > 0);
    }
    case 'price': {
      // GOOGLEFINANCE formulas carry the original currency and amount
      const fx = formula?.match(
        /CURRENCY:([A-Z]{3})USD[^0-9]*?\*\s*(\d+(?:\.\d+)?)|(\d+(?:\.\d+)?)\s*\*\s*GOOGLEFINANCE\(\W*CURRENCY:([A-Z]{3})USD/
      );
      if (fx) {
        const cur = fx[1] ?? fx[4];
        const amt = Number(fx[2] ?? fx[3]);
        const amounts = getAt(data, 'price.amount')
          .concat(getAt(data, 'pricing.price.amount'))
          .concat(getAt(data, 'pricing.examples[].price.amount'))
          .map(Number);
        const currencies = leaves(data).join(' ');
        if (amounts.some((a) => close(a, amt)) && currencies.includes(cur)) {
          return { status: 'ok', yaml: yamlShown, detail: `${amt} ${cur}` };
        }
        // Free-text prices (pattern drivers) carry the symbol: "£70", "€299-€799"
        const symbol = ({ GBP: '£', EUR: '€' } as Record<string, string>)[cur];
        if (symbol && new RegExp(`${symbol}\\s?${amt}(?![0-9])`).test(currencies)) {
          return { status: 'ok', yaml: yamlShown, detail: `${amt} ${cur}` };
        }
        return {
          status: mapped.length ? 'differs' : 'missing',
          yaml: yamlShown,
          detail: `sheet formula: ${amt} ${cur}`,
        };
      }
      if (typeof value === 'number') {
        const nums = mapped.flatMap((m) => {
          if (typeof m === 'number') return [m];
          if (m && typeof m === 'object') {
            const o = m as Record<string, unknown>;
            if (typeof o.amount === 'number') return [o.amount];
            if (typeof o.price === 'number') return [o.price];
            if (o.price && typeof o.price === 'object') {
              const p = (o.price as Record<string, unknown>).amount;
              if (typeof p === 'number') return [p];
            }
            return [];
          }
          const y = yamlNumber(m);
          return y === undefined ? [] : [y];
        });
        if (nums.some((x) => close(x, value))) return { status: 'ok', yaml: yamlShown };
        if (nums.some((x) => isRounding(x, value))) return { status: 'rounded', yaml: yamlShown };
        return { status: mapped.length ? 'differs' : 'missing', yaml: yamlShown };
      }
      if (mapped.some((m) => coverage(text, leaves(m).join(' ')) >= 0.85)) {
        return { status: 'ok', yaml: yamlShown };
      }
      return fallback(mapped.length > 0);
    }
    case 'bool': {
      const b = sheetBool(value);
      if (b === undefined) {
        if (mapped.some((m) => coverage(text, leaves(m).join(' ')) >= 0.85)) {
          return { status: 'ok', yaml: yamlShown };
        }
        return fallback(mapped.length > 0);
      }
      const ys = mapped.map(yamlTruthy).filter((x) => x !== undefined);
      if (ys.includes(b)) {
        // "Yes, but ..." qualifiers must survive too
        const rest = text.replace(/^(y|yes|n|no|true|false)\b[\s,;:-]*/i, '');
        if (rest && coverage(rest, `${view.visible}\n${view.comments}`) < 0.85) {
          return { status: 'differs', yaml: yamlShown, detail: `qualifier lost: "${rest}"` };
        }
        return { status: 'ok', yaml: yamlShown };
      }
      if (!ys.length && b === false && !mapped.length) {
        return { status: 'missing', yaml: yamlShown, detail: 'sheet says no; YAML silent' };
      }
      return { status: ys.length ? 'differs' : 'missing', yaml: yamlShown };
    }
    case 'enum': {
      const key = Object.keys(kind.map).find((k) => k.toLowerCase() === text.toLowerCase());
      if (key) {
        const allowed = kind.map[key];
        // Array fields (outputs.types: [pwm, servo]) match on any element
        const flat = mapped.flatMap((m) => (Array.isArray(m) ? m : [m]));
        if (flat.some((m) => allowed.some((a) => a === m)))
          return { status: 'ok', yaml: yamlShown };
        return { status: mapped.length ? 'differs' : 'missing', yaml: yamlShown };
      }
      return fallback(mapped.length > 0);
    }
    case 'exact': {
      const want = text.toLowerCase();
      if (mapped.some((m) => String(m).trim().toLowerCase() === want)) {
        return { status: 'ok', yaml: yamlShown };
      }
      return { status: mapped.length ? 'differs' : 'missing', yaml: yamlShown };
    }
    case 'text': {
      const hay = mapped.map((m) => leaves(m).join(' ')).join(' \n ');
      if (mapped.length && coverage(text, hay) >= 0.85) return { status: 'ok', yaml: yamlShown };
      return fallback(mapped.length > 0);
    }
  }
}
