/**
 * The design model and its URL encoding.
 *
 * A design lives entirely in the page's query string, so a link IS the saved
 * file. The encoding is additive: links made by the first version of the
 * designer (`p`/`x`/`n`/`c` per group plus `g`) must keep parsing forever, so
 * new facts get new keys and defaults are simply left out.
 *
 * Per pixel group — repeated keys, aligned by position:
 *   p   pixel id (`ic-<slug>` for a bare driver IC)
 *   x   number of strings
 *   n   pixels per string, or dot-separated lengths ("150.200.80")
 *   c   controller id (`mb-<slug>` for a dev board)
 *   v   string voltage override (driver ICs, wide-range pixels)
 *   l   level shifter id
 *   k   connector id
 *   gn  group name
 * System-wide:
 *   g   pattern source id, or "standalone"
 *   b   design brightness in percent (default 100)
 *   f   target refresh rate in fps (default 30)
 *   a   most amps one power feed should carry (default 4)
 *   w   feed wire length in metres, one way (default 2)
 *   o   "1" = installed outdoors
 *   t   title
 */

/** A pixel layout: N strings of M pixels (a matrix is just its strings) */
export interface Layout {
  strings: number;
  /** Pixels per string — the LONGEST string when lengths vary */
  perString: number;
  /** Each string's length, when they differ */
  lengths?: number[];
}

export interface GroupDesign {
  /** Pixel option id, '' when not chosen yet */
  pixel: string;
  /** Chosen string voltage; null = the pixel's own */
  voltage: number | null;
  layout: Layout;
  controller: string;
  shifter: string;
  connector: string;
  name: string;
}

export interface Design {
  title: string;
  groups: GroupDesign[];
  /** Pattern source id, 'standalone', or '' */
  source: string;
  /** Percent of full white the supply and wiring are sized for */
  brightness: number;
  targetFps: number;
  /** Most current one power feed should carry, in amps */
  feedAmps: number;
  /** One-way length of a power feed wire, in metres */
  wireMeters: number;
  outdoor: boolean;
}

export const DEFAULTS = {
  perString: 150,
  brightness: 100,
  targetFps: 30,
  feedAmps: 4,
  wireMeters: 2,
} as const;

export const LIMITS = {
  groups: 12,
  strings: 512,
  perString: 100_000,
  variedStrings: 64,
  title: 60,
  groupName: 32,
  brightness: [1, 100],
  targetFps: [1, 240],
  feedAmps: [0.5, 30],
  wireMeters: [0.1, 100],
} as const;

export const STANDALONE = 'standalone';

function clamp(value: number, [min, max]: readonly [number, number]): number {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

export function emptyGroup(): GroupDesign {
  return {
    pixel: '',
    voltage: null,
    layout: { strings: 1, perString: DEFAULTS.perString },
    controller: '',
    shifter: '',
    connector: '',
    name: '',
  };
}

export function emptyDesign(): Design {
  return {
    title: '',
    groups: [emptyGroup()],
    source: '',
    brightness: DEFAULTS.brightness,
    targetFps: DEFAULTS.targetFps,
    feedAmps: DEFAULTS.feedAmps,
    wireMeters: DEFAULTS.wireMeters,
    outdoor: false,
  };
}

// ---------------------------------------------------------------------------
// Layout helpers

export function layoutTotal(layout: Layout): number {
  return layout.lengths
    ? layout.lengths.reduce((a, b) => a + b, 0)
    : layout.strings * layout.perString;
}

/** Every string's pixel count, expanding uniform layouts */
export function stringLengths(layout: Layout): number[] {
  return layout.lengths ?? Array.from({ length: layout.strings }, () => layout.perString);
}

export function describeLayout(layout: Layout): string {
  return layout.lengths
    ? `${layout.strings} strings (${layout.lengths.join(' + ')})`
    : `${layout.strings} × ${layout.perString.toLocaleString('en-US')}`;
}

/** Parse "150" or "150.200.80" (also comma/space/plus separated) into a layout */
export function parseLayout(strings: string, perString: string): Layout {
  const lengths = perString
    .split(/[.,;+\s]+/)
    .map((s) => parseInt(s, 10))
    .filter((v) => Number.isFinite(v) && v > 0)
    .map((v) => Math.min(v, LIMITS.perString))
    .slice(0, LIMITS.variedStrings);
  if (lengths.length > 1) {
    return { strings: lengths.length, perString: Math.max(...lengths), lengths };
  }
  return {
    strings: clampInt(parseInt(strings, 10) || 1, 1, LIMITS.strings),
    perString: lengths[0] ?? DEFAULTS.perString,
  };
}

// ---------------------------------------------------------------------------
// URL codec

const GROUP_KEYS = ['p', 'x', 'n', 'c', 'v', 'l', 'k', 'gn'] as const;

function trimNumber(n: number): string {
  return String(Number(n.toFixed(2)));
}

/** Free text from a URL: control characters out, whitespace collapsed, length capped */
function cleanText(value: string | null | undefined, max: number): string {
  let text = '';
  for (const ch of value ?? '') {
    const code = ch.codePointAt(0) ?? 0;
    text += code < 0x20 || code === 0x7f ? ' ' : ch;
  }
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

function positive(value: string | null | undefined): number | null {
  const n = parseFloat(value ?? '');
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseDesign(params: URLSearchParams): Design {
  const columns = Object.fromEntries(GROUP_KEYS.map((key) => [key, params.getAll(key)])) as Record<
    (typeof GROUP_KEYS)[number],
    string[]
  >;
  const count = clampInt(
    Math.max(1, ...GROUP_KEYS.map((key) => columns[key].length)),
    1,
    LIMITS.groups
  );

  const groups: GroupDesign[] = Array.from({ length: count }, (_, i) => ({
    pixel: (columns.p[i] ?? '').trim(),
    voltage: positive(columns.v[i]),
    layout: parseLayout(columns.x[i] ?? '', columns.n[i] ?? ''),
    controller: (columns.c[i] ?? '').trim(),
    shifter: (columns.l[i] ?? '').trim(),
    connector: (columns.k[i] ?? '').trim(),
    name: cleanText(columns.gn[i], LIMITS.groupName),
  }));

  return {
    title: cleanText(params.get('t'), LIMITS.title),
    groups,
    source: (params.get('g') ?? '').trim(),
    brightness: clamp(positive(params.get('b')) ?? DEFAULTS.brightness, LIMITS.brightness),
    targetFps: clamp(positive(params.get('f')) ?? DEFAULTS.targetFps, LIMITS.targetFps),
    feedAmps: clamp(positive(params.get('a')) ?? DEFAULTS.feedAmps, LIMITS.feedAmps),
    wireMeters: clamp(positive(params.get('w')) ?? DEFAULTS.wireMeters, LIMITS.wireMeters),
    outdoor: params.get('o') === '1',
  };
}

function groupIsEmpty(g: GroupDesign): boolean {
  return (
    !g.pixel &&
    !g.controller &&
    !g.shifter &&
    !g.connector &&
    !g.name &&
    g.voltage == null &&
    !g.layout.lengths &&
    g.layout.strings === 1 &&
    g.layout.perString === DEFAULTS.perString
  );
}

/** Nothing chosen and nothing changed from the defaults */
export function isEmptyDesign(design: Design): boolean {
  return (
    design.groups.length === 1 &&
    groupIsEmpty(design.groups[0]) &&
    !design.title &&
    !design.source &&
    !design.outdoor &&
    design.brightness === DEFAULTS.brightness &&
    design.targetFps === DEFAULTS.targetFps &&
    design.feedAmps === DEFAULTS.feedAmps &&
    design.wireMeters === DEFAULTS.wireMeters
  );
}

export function serializeDesign(design: Design): URLSearchParams {
  const params = new URLSearchParams();
  if (isEmptyDesign(design)) return params;

  const groups = design.groups.slice(0, LIMITS.groups);
  // Optional per-group keys are all-or-none so positions stay aligned
  const any = {
    v: groups.some((g) => g.voltage != null),
    l: groups.some((g) => g.shifter),
    k: groups.some((g) => g.connector),
    gn: groups.some((g) => g.name),
  };
  for (const g of groups) {
    params.append('p', g.pixel);
    params.append('x', String(g.layout.strings));
    params.append('n', g.layout.lengths ? g.layout.lengths.join('.') : String(g.layout.perString));
    params.append('c', g.controller);
    if (any.v) params.append('v', g.voltage != null ? trimNumber(g.voltage) : '');
    if (any.l) params.append('l', g.shifter);
    if (any.k) params.append('k', g.connector);
    if (any.gn) params.append('gn', g.name);
  }
  if (design.source) params.set('g', design.source);
  if (design.brightness !== DEFAULTS.brightness) params.set('b', trimNumber(design.brightness));
  if (design.targetFps !== DEFAULTS.targetFps) params.set('f', trimNumber(design.targetFps));
  if (design.feedAmps !== DEFAULTS.feedAmps) params.set('a', trimNumber(design.feedAmps));
  if (design.wireMeters !== DEFAULTS.wireMeters) params.set('w', trimNumber(design.wireMeters));
  if (design.outdoor) params.set('o', '1');
  if (design.title) params.set('t', design.title);
  return params;
}

/** Canonical query string for a design ('' for the empty design) */
export function designQuery(design: Design): string {
  return serializeDesign(design).toString();
}

// ---------------------------------------------------------------------------
// Pure edits

export function updateGroup(design: Design, index: number, patch: Partial<GroupDesign>): Design {
  return {
    ...design,
    groups: design.groups.map((g, i) => (i === index ? { ...g, ...patch } : g)),
  };
}

export function addGroup(design: Design, group: GroupDesign = emptyGroup()): Design {
  if (design.groups.length >= LIMITS.groups) return design;
  return { ...design, groups: [...design.groups, group] };
}

export function duplicateGroup(design: Design, index: number): Design {
  const source = design.groups[index];
  if (!source || design.groups.length >= LIMITS.groups) return design;
  const copy: GroupDesign = { ...source, layout: { ...source.layout }, name: '' };
  const groups = [...design.groups];
  groups.splice(index + 1, 0, copy);
  return { ...design, groups };
}

export function removeGroup(design: Design, index: number): Design {
  if (design.groups.length <= 1) return { ...design, groups: [emptyGroup()] };
  return { ...design, groups: design.groups.filter((_, i) => i !== index) };
}
