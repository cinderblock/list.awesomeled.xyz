/**
 * Cross-category relationship graph.
 *
 * One definition of "what links to what", shared by the site (entry pages,
 * table columns), scripts/validate.ts (dangling refs, unresolved names) and
 * scripts/cross-link-stats.ts (coverage). Pure: callers pass entries already
 * loaded per category, so this module never touches the filesystem.
 *
 * Links are declared on ONE side (the consumer: a controller lists the pixel
 * ICs it drives and the firmware it runs) and the reverse direction is derived
 * here, so pages stay bidirectional without duplicating data. Three kinds of
 * declarations feed the graph:
 *
 *  - Name lists (NAME_FIELDS): vendor-published names such as
 *    `outputs.protocols: [WS2811, WS2812B]`, resolved through an alias index
 *    built from each target entry's `name`, `aliases` and `variants[].name`.
 *    Names with no matching entry are kept (shown as plain text) and reported
 *    as `unresolved`.
 *  - Slug refs: `outputs.connector.ref`, and the legacy `related_<category>`
 *    slug arrays.
 *  - The generic `related` array: `{type, ref}` items with any `<category>/<slug>`.
 *
 * Protocol families (pixels / pixel ICs sharing a `data.type`) are derived as
 * an implicit symmetric grouping, not stored as edges.
 */

import type { BaseEntry, SourceRecord } from './types';

/** Entries per category id, as loaded from database/<category>/*.yaml */
export type Database = ReadonlyMap<string, readonly BaseEntry[]>;

/** "<category>/<slug>" */
export type EntryRef = string;

export type EdgeKind =
  // name-list and slug fields
  | 'drives'
  | 'supports'
  | 'decodes'
  | 'firmware'
  | 'works-with'
  | 'connector'
  | 'host'
  | 'uses'
  // `related[].type` values (common.json#/definitions/related)
  | 'replacement'
  | 'predecessor'
  | 'variant'
  | 'accessory'
  | 'related'
  | 'compatible';

/** Which page section a kind renders in */
export type EdgeGroup = 'works-with' | 'family';

interface KindInfo {
  /** Row label on the declaring entry's page */
  forward: string;
  /** Row label on the pointed-at entry's page (derived reverse direction) */
  reverse: string;
  group: EdgeGroup;
}

export const EDGE_KINDS: Record<EdgeKind, KindInfo> = {
  drives: { forward: 'Drives', reverse: 'Driven by', group: 'works-with' },
  supports: { forward: 'Supports', reverse: 'Supported by', group: 'works-with' },
  decodes: { forward: 'Decodes', reverse: 'Decoded by', group: 'works-with' },
  firmware: { forward: 'Firmware', reverse: 'Runs on', group: 'works-with' },
  'works-with': { forward: 'Works with', reverse: 'Works with', group: 'works-with' },
  connector: { forward: 'Output connector', reverse: 'Output connector on', group: 'works-with' },
  host: { forward: 'Host board', reverse: 'Host for', group: 'works-with' },
  uses: { forward: 'Uses', reverse: 'Used in', group: 'works-with' },
  compatible: { forward: 'Compatible with', reverse: 'Compatible with', group: 'works-with' },
  replacement: { forward: 'Replaced by', reverse: 'Replaces', group: 'family' },
  predecessor: { forward: 'Preceded by', reverse: 'Succeeded by', group: 'family' },
  variant: { forward: 'Variants', reverse: 'Variants', group: 'family' },
  accessory: { forward: 'Accessories', reverse: 'Accessory for', group: 'family' },
  related: { forward: 'Related', reverse: 'Related', group: 'family' },
};

const RELATED_TYPES = new Set<string>([
  'replacement',
  'predecessor',
  'variant',
  'accessory',
  'related',
  'uses',
  'host',
  'compatible',
]);

/** Name indexes: which categories a name-list field resolves against */
export type IndexName = 'pixel' | 'software' | 'board' | 'level-converter';

export const INDEX_CATEGORIES: Record<IndexName, string[]> = {
  pixel: ['pixels', 'pixel-ics'],
  software: ['pattern-drivers', 'drive-libraries'],
  board: ['microboards'],
  'level-converter': ['level-converters'],
};

export interface NameField {
  /** Declaring category */
  category: string;
  /** Dotted path to a string or string[] value */
  path: string;
  index: IndexName;
  kind: EdgeKind;
}

/** Name-list fields that become links. Order = display order on pages. */
export const NAME_FIELDS: NameField[] = [
  { category: 'controllers', path: 'outputs.protocols', index: 'pixel', kind: 'drives' },
  { category: 'drive-libraries', path: 'supported_ics', index: 'pixel', kind: 'supports' },
  { category: 'pixel-decoders', path: 'inputs.protocols', index: 'pixel', kind: 'decodes' },
  { category: 'controllers', path: 'software.firmware', index: 'software', kind: 'firmware' },
  { category: 'adapters', path: 'software.firmware', index: 'software', kind: 'firmware' },
  { category: 'controllers', path: 'software.works_with', index: 'software', kind: 'works-with' },
  { category: 'adapters', path: 'software.works_with', index: 'software', kind: 'works-with' },
  { category: 'controllers', path: 'inputs.requires_host', index: 'board', kind: 'host' },
  { category: 'controllers', path: 'outputs.driver.IC', index: 'level-converter', kind: 'uses' },
];

/** Legacy `related_<category>` slug arrays → edge kind (target category comes from the field name) */
const LEGACY_SLUG_FIELDS: Record<string, EdgeKind> = {
  related_pixel_ics: 'supports',
  related_microboards: 'host',
  related_connectors: 'uses',
  related_adapters: 'related',
};

export interface Edge {
  from: EntryRef;
  to: EntryRef;
  kind: EdgeKind;
  /** Declaring field ("outputs.protocols", "related", …) */
  field: string;
  /** For name-resolved links: the name exactly as written in the data */
  via?: string;
  notes?: string;
  /** Where a curated `related` link was verified */
  source?: SourceRecord;
}

export interface UnresolvedName {
  from: EntryRef;
  field: string;
  name: string;
}

export interface DanglingRef {
  from: EntryRef;
  field: string;
  ref: string;
  problem: string;
}

/**
 * Normalize a part/product name for matching: case-, space- and
 * punctuation-insensitive ("APA-102" = "apa102", "WS2812 B" = "ws2812b").
 */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9+]+/g, '');
}

/** Name without a trailing parenthetical qualifier: "WS2811 (400kHz)" → "WS2811" */
function stripQualifier(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '');
}

/** Keys a name is reachable under: full form, plus the qualifier-free form */
function nameKeys(name: string): string[] {
  const keys = new Set([normalizeName(name), normalizeName(stripQualifier(name))]);
  keys.delete('');
  return [...keys];
}

function get(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((v, k) => {
    if (v == null || typeof v !== 'object') return undefined;
    return (v as Record<string, unknown>)[k];
  }, obj);
}

function asStrings(v: unknown): string[] {
  if (typeof v === 'string') return v.trim() ? [v] : [];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string' && !!x.trim());
  return [];
}

/** Names an entry answers to: name, aliases, variant names */
export function entryNames(entry: BaseEntry): string[] {
  const names = [entry.name, ...asStrings(entry.aliases)];
  if (Array.isArray(entry.variants)) {
    for (const v of entry.variants) {
      const n = (v as { name?: unknown } | null)?.name;
      if (typeof n === 'string') names.push(n);
    }
  }
  return names.filter((n) => typeof n === 'string' && n.trim());
}

export type NameIndex = Map<string, EntryRef[]>;

function buildIndex(db: Database, categories: string[]): NameIndex {
  const index: NameIndex = new Map();
  for (const category of categories) {
    for (const entry of db.get(category) ?? []) {
      const ref = `${category}/${entry.id}`;
      for (const name of entryNames(entry)) {
        for (const key of nameKeys(name)) {
          const refs = index.get(key) ?? [];
          if (!refs.includes(ref)) refs.push(ref);
          index.set(key, refs);
        }
      }
    }
  }
  return index;
}

/** Resolve one name against an index. Empty array = unresolved. */
export function resolveName(index: NameIndex, name: string): EntryRef[] {
  for (const key of nameKeys(name)) {
    const hit = index.get(key);
    if (hit) return hit;
  }
  return [];
}

// ---------------------------------------------------------------------------
// Makers: "more from this maker" groups entries by their creator, tolerant of
// the spelling variants the data has ("Advatek" / "Advatek Lights", "KulpLights,
// LLC" / "Kulp Lights", "WorldSemi/Newstar").

/** Creator values that aren't a maker: marketplaces, placeholders */
const NOT_A_MAKER = new Set([
  'generic',
  'unknown',
  'tindie',
  'aliexpress',
  'community',
  'opensource',
  'diy',
  'boarddesign',
]);

/** Spelling variants → one maker key (keys are normalized: lowercase alphanumerics) */
const MAKER_ALIASES: Record<string, string> = {
  advateklighting: 'advatek',
  advateklights: 'advatek',
  aircookie: 'aircoookie',
  chauvetprofessional: 'chauvet',
  deskontrolelectronics: 'deskontrol',
  digidottechnologies: 'digidot',
  kulplights: 'kulp',
  marksslee: 'markslee',
  markcslee: 'markslee',
  northernlightselectronicdesign: 'nled',
  opscooptoelectronics: 'opsco',
  bekonixexrocketlife: 'bekonix',
  arjanvanvughtopensource: 'arjanvanvught',
  quindorintermittenttechnology: 'quindor',
  teamp: 'te',
  tedeutsch: 'te',
  elationlighting: 'elation',
  newstarled: 'newstar',
};

/** Display label overrides where no spelling in the data names the maker well */
const MAKER_LABELS: Record<string, string> = {
  te: 'TE Connectivity',
  aircoookie: 'Aircoookie',
};

/** Legal-form and filler words dropped before comparing maker names */
const MAKER_NOISE = /\b(llc|inc|ltd|co|bv|sl|sarl|s\.?a|gmbh|corp|corporation|company)\b\.?/gi;

/**
 * Maker keys + display labels for an entry's creator. Multi-maker strings
 * ("WorldSemi/Newstar", "Zach Vorhies (current), Daniel Garcia") yield one
 * key per maker; "Quindor / Intermittent Technology" is one maker (alias).
 */
export function makersOf(entry: BaseEntry): { key: string; label: string }[] {
  const raw =
    typeof entry.creator === 'string'
      ? entry.creator
      : entry.creator && typeof entry.creator === 'object'
        ? (entry.creator as { name?: unknown }).name
        : null;
  if (typeof raw !== 'string' || /^https?:/i.test(raw)) return [];
  const whole = normalizeName(raw.replace(MAKER_NOISE, ''));
  const parts = MAKER_ALIASES[whole] ? [raw] : raw.split(/\s*[/,]\s*/);
  const out: { key: string; label: string }[] = [];
  for (const part of parts) {
    const label = part.replace(/\s*\((current|open source)\)\s*$/i, '').trim();
    const norm = normalizeName(label.replace(MAKER_NOISE, ''));
    const key = MAKER_ALIASES[norm] ?? norm;
    if (!key || NOT_A_MAKER.has(key) || out.some((m) => m.key === key)) continue;
    out.push({ key, label });
  }
  return out;
}

/** Protocol family label from a pixel / pixel IC entry's `data.type` */
function protocolFamily(entry: BaseEntry): string | null {
  const t = (entry.data as { type?: unknown } | undefined)?.type;
  return typeof t === 'string' && t.trim() ? t.trim() : null;
}

export interface RelationGraph {
  edges: Edge[];
  outgoing: Map<EntryRef, Edge[]>;
  incoming: Map<EntryRef, Edge[]>;
  /** ref → display name, for every entry in the database */
  names: Map<EntryRef, string>;
  indexes: Record<IndexName, NameIndex>;
  unresolved: UnresolvedName[];
  dangling: DanglingRef[];
  /** Normalized protocol family → member refs (pixels + pixel ICs) */
  families: Map<string, EntryRef[]>;
  /** ref → its protocol family label as written */
  familyOf: Map<EntryRef, string>;
  /** Derived per-entry compatibility summary (see LinkedSummary) */
  linked: Map<EntryRef, LinkedSummary>;
  /** Maker key → display label (most common spelling) + every entry it made */
  makers: Map<string, { label: string; refs: EntryRef[] }>;
}

/**
 * Derived compatibility facts attached to each entry as `linked` by the
 * loader, so tables can filter and sort on them ("controllers that can drive
 * WS2815", "pixels most controllers support"). Never stored in YAML.
 */
export interface LinkedSummary {
  /**
   * Controllers / adapters: every pixel this hardware can drive — the names
   * the maker lists, plus the same-protocol parts of those (`data.type`
   * families), or, when the maker lists none, what its firmware (WLED, FPP,
   * ESPixelStick) supports. Clocked parts are dropped for data-only outputs
   * and vice versa. Includes the maker's own spellings so a cell's pill can
   * be clicked into a filter.
   */
  pixels?: string[];
  /** Firmware the `pixels` set was inferred from (empty when the maker lists them) */
  pixelsVia?: string[];
  /** Pixels / pixel ICs: controllers + adapters whose `pixels` include this part */
  hardware?: number;
  /** `hardware` split by category ({controllers: 38, adapters: 4}) */
  hardwareBy?: Record<string, number>;
  /** Pixels / pixel ICs: libraries that support this part or a same-protocol one */
  libraries?: number;
  /** Software: controllers + adapters that run it as firmware or work with it */
  runsOn?: number;
  /** Connectors: entries that use it */
  usedBy?: number;
  /** Microboards: add-ons, capes and firmware hosted on it */
  hosts?: number;
}

const PIXEL_HARDWARE = ['controllers', 'adapters'];

function computeLinked(
  db: Database,
  names: Map<EntryRef, string>,
  outgoing: Map<EntryRef, Edge[]>,
  incoming: Map<EntryRef, Edge[]>,
  families: Map<string, EntryRef[]>,
  familyOf: Map<EntryRef, string>
): Map<EntryRef, LinkedSummary> {
  const linked = new Map<EntryRef, LinkedSummary>();
  const summary = (ref: EntryRef) => {
    if (!linked.has(ref)) linked.set(ref, {});
    return linked.get(ref)!;
  };
  const entryByRef = new Map<EntryRef, BaseEntry>();
  for (const [category, entries] of db) {
    for (const e of entries) entryByRef.set(`${category}/${e.id}`, e);
  }
  const clockedOf = (ref: EntryRef) => {
    const c = (entryByRef.get(ref)?.data as { clocked?: unknown } | undefined)?.clocked;
    return typeof c === 'boolean' ? c : null;
  };
  // A part plus every other part speaking the same protocol
  const withFamily = (refs: Iterable<EntryRef>) => {
    const out = new Set<EntryRef>();
    for (const r of refs) {
      out.add(r);
      const fam = familyOf.get(r);
      for (const m of fam ? (families.get(normalizeName(fam)) ?? []) : []) out.add(m);
    }
    return out;
  };
  const targets = (ref: EntryRef, kind: EdgeKind) =>
    (outgoing.get(ref) ?? []).filter((e) => e.kind === kind).map((e) => e.to);

  const hardwareCount = new Map<EntryRef, number>();
  const hardwareBy = new Map<EntryRef, Record<string, number>>();
  for (const category of PIXEL_HARDWARE) {
    for (const entry of db.get(category) ?? []) {
      const ref = `${category}/${entry.id}`;
      const listed = asStrings(get(entry, 'outputs.protocols'));
      let base = targets(ref, 'drives');
      const via: string[] = [];
      if (listed.length === 0) {
        for (const fw of targets(ref, 'firmware')) {
          const supported = targets(fw, 'supports');
          if (supported.length) {
            base = base.concat(supported);
            via.push(names.get(fw) ?? fw);
          }
        }
      }
      if (base.length === 0 && listed.length === 0) continue;
      const clocked = get(entry, 'outputs.clocked');
      const parts = [...withFamily(base)].filter((r) => {
        const c = clockedOf(r);
        if (clocked === false && c === true) return false;
        if ((clocked === 'always' || clocked === true) && c === false) return false;
        return true;
      });
      for (const r of parts) {
        hardwareCount.set(r, (hardwareCount.get(r) ?? 0) + 1);
        const by = hardwareBy.get(r) ?? {};
        by[category] = (by[category] ?? 0) + 1;
        hardwareBy.set(r, by);
      }
      const pixelNames = new Set<string>(listed);
      for (const r of parts) pixelNames.add(names.get(r) ?? r);
      const s = summary(ref);
      s.pixels = [...pixelNames].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
      if (via.length) s.pixelsVia = [...new Set(via)];
    }
  }

  const libraryCount = new Map<EntryRef, number>();
  for (const entry of db.get('drive-libraries') ?? []) {
    const ref = `drive-libraries/${entry.id}`;
    for (const r of withFamily(targets(ref, 'supports'))) {
      libraryCount.set(r, (libraryCount.get(r) ?? 0) + 1);
    }
  }
  for (const category of INDEX_CATEGORIES.pixel) {
    for (const entry of db.get(category) ?? []) {
      const ref = `${category}/${entry.id}`;
      const s = summary(ref);
      s.hardware = hardwareCount.get(ref) ?? 0;
      if (hardwareBy.has(ref)) s.hardwareBy = hardwareBy.get(ref);
      s.libraries = libraryCount.get(ref) ?? 0;
    }
  }

  const distinctFrom = (ref: EntryRef, kinds: EdgeKind[], fromCategories?: string[]) =>
    new Set(
      (incoming.get(ref) ?? [])
        .filter((e) => kinds.includes(e.kind))
        .filter((e) => !fromCategories || fromCategories.includes(e.from.split('/')[0]))
        .map((e) => e.from)
    ).size;
  for (const category of INDEX_CATEGORIES.software) {
    for (const entry of db.get(category) ?? []) {
      const ref = `${category}/${entry.id}`;
      summary(ref).runsOn = distinctFrom(ref, ['firmware', 'works-with'], PIXEL_HARDWARE);
    }
  }
  for (const entry of db.get('connectors') ?? []) {
    const ref = `connectors/${entry.id}`;
    summary(ref).usedBy = distinctFrom(ref, ['connector', 'uses']);
  }
  for (const entry of db.get('microboards') ?? []) {
    const ref = `microboards/${entry.id}`;
    summary(ref).hosts = distinctFrom(ref, ['host']);
  }
  return linked;
}

export function buildRelationGraph(db: Database): RelationGraph {
  const names = new Map<EntryRef, string>();
  for (const [category, entries] of db) {
    for (const e of entries) names.set(`${category}/${e.id}`, e.name);
  }

  const indexes = Object.fromEntries(
    (Object.keys(INDEX_CATEGORIES) as IndexName[]).map((k) => [
      k,
      buildIndex(db, INDEX_CATEGORIES[k]),
    ])
  ) as Record<IndexName, NameIndex>;

  const edges: Edge[] = [];
  const unresolved: UnresolvedName[] = [];
  const dangling: DanglingRef[] = [];
  const seen = new Set<string>();
  const addEdge = (edge: Edge) => {
    // The same pair can be reached twice (e.g. "WS2812" and "WS2812B" in one
    // list); keep the first so pages don't repeat a link.
    const key = `${edge.from}>${edge.to}>${edge.kind}`;
    if (seen.has(key) || edge.from === edge.to) return;
    seen.add(key);
    edges.push(edge);
  };

  for (const [category, entries] of db) {
    for (const entry of entries) {
      const from = `${category}/${entry.id}`;

      for (const nf of NAME_FIELDS) {
        if (nf.category !== category) continue;
        for (const name of asStrings(get(entry, nf.path))) {
          const refs = resolveName(indexes[nf.index], name);
          if (refs.length === 0) unresolved.push({ from, field: nf.path, name });
          for (const to of refs) addEdge({ from, to, kind: nf.kind, field: nf.path, via: name });
        }
      }

      const connector = get(entry, 'outputs.connector');
      if (connector && typeof connector === 'object') {
        const ref = (connector as { ref?: unknown }).ref;
        if (typeof ref === 'string') {
          const to = `connectors/${ref}`;
          if (names.has(to)) {
            addEdge({ from, to, kind: 'connector', field: 'outputs.connector.ref' });
          } else {
            dangling.push({
              from,
              field: 'outputs.connector.ref',
              ref,
              problem: 'no such entry in connectors',
            });
          }
        }
      }

      for (const [field, kind] of Object.entries(LEGACY_SLUG_FIELDS)) {
        const target = field.slice('related_'.length).replace(/_/g, '-');
        for (const slug of asStrings(entry[field])) {
          const to = `${target}/${slug}`;
          if (names.has(to)) addEdge({ from, to, kind, field });
          else dangling.push({ from, field, ref: slug, problem: `no such entry in ${target}` });
        }
      }

      if (Array.isArray(entry.related)) {
        for (const item of entry.related) {
          if (!item || typeof item !== 'object' || typeof item.ref !== 'string') continue;
          const [cat, slug] = item.ref.split('/');
          if (!cat || !slug || !db.has(cat)) {
            dangling.push({ from, field: 'related', ref: item.ref, problem: 'unknown category' });
          } else if (!names.has(item.ref)) {
            dangling.push({ from, field: 'related', ref: item.ref, problem: 'no such entry' });
          } else if (RELATED_TYPES.has(item.type)) {
            addEdge({
              from,
              to: item.ref,
              kind: item.type as EdgeKind,
              field: 'related',
              notes: item.notes,
              source: item.source,
            });
          }
        }
      }
    }
  }

  const outgoing = new Map<EntryRef, Edge[]>();
  const incoming = new Map<EntryRef, Edge[]>();
  for (const e of edges) {
    if (!outgoing.has(e.from)) outgoing.set(e.from, []);
    outgoing.get(e.from)!.push(e);
    if (!incoming.has(e.to)) incoming.set(e.to, []);
    incoming.get(e.to)!.push(e);
  }

  const families = new Map<string, EntryRef[]>();
  const familyOf = new Map<EntryRef, string>();
  for (const category of INDEX_CATEGORIES.pixel) {
    for (const entry of db.get(category) ?? []) {
      const fam = protocolFamily(entry);
      if (!fam) continue;
      const ref = `${category}/${entry.id}`;
      familyOf.set(ref, fam);
      const key = normalizeName(fam);
      if (!families.has(key)) families.set(key, []);
      families.get(key)!.push(ref);
    }
  }

  const makers = new Map<string, { label: string; refs: EntryRef[] }>();
  const labelCounts = new Map<string, Map<string, number>>();
  for (const [category, entries] of db) {
    for (const entry of entries) {
      for (const { key, label } of makersOf(entry)) {
        if (!makers.has(key)) makers.set(key, { label, refs: [] });
        makers.get(key)!.refs.push(`${category}/${entry.id}`);
        const counts = labelCounts.get(key) ?? new Map<string, number>();
        counts.set(label, (counts.get(label) ?? 0) + 1);
        labelCounts.set(key, counts);
      }
    }
  }
  for (const [key, counts] of labelCounts) {
    makers.get(key)!.label = MAKER_LABELS[key] ?? [...counts].sort((a, b) => b[1] - a[1])[0][0];
  }

  return {
    edges,
    outgoing,
    incoming,
    names,
    indexes,
    unresolved,
    dangling,
    families,
    familyOf,
    linked: computeLinked(db, names, outgoing, incoming, families, familyOf),
    makers,
  };
}

// ---------------------------------------------------------------------------
// Page view model

export interface LinkItem {
  name: string;
  /** Internal target (absent for unresolved names and external products) */
  category?: string;
  id?: string;
  /** External product link (related items without a ref) */
  url?: string;
  /** Internal non-entry link, e.g. a filtered category table */
  to?: string;
  notes?: string;
  /** Name as written in the declaring field, when it differs from `name` */
  via?: string;
  /** Where the link was verified */
  source?: SourceRecord;
}

export interface LinkRow {
  label: string;
  kind: EdgeKind | 'family-protocol' | 'compatible-hardware' | 'via-firmware' | 'same-maker';
  direction: 'forward' | 'reverse' | 'derived';
  items: LinkItem[];
}

export interface EntryLinks {
  /** Compatibility: drives / driven by, firmware, hosts, uses, … */
  worksWith: LinkRow[];
  /** Product family: variants, predecessors, replacements, accessories, related */
  family: LinkRow[];
}

const KIND_ORDER: EdgeKind[] = [
  'drives',
  'supports',
  'decodes',
  'firmware',
  'works-with',
  'host',
  'connector',
  'uses',
  'compatible',
  'replacement',
  'predecessor',
  'variant',
  'accessory',
  'related',
];

function itemFor(graph: RelationGraph, ref: EntryRef, edge?: Edge): LinkItem {
  const [category, id] = ref.split('/');
  const name = graph.names.get(ref) ?? id;
  // "as WS2812B": only when the declaring entry listed the TARGET under a
  // name other than the target's own (a variant or alias)
  const targetName = edge ? (graph.names.get(edge.to) ?? '') : '';
  const via =
    edge?.via && normalizeName(edge.via) !== normalizeName(targetName) ? edge.via : undefined;
  return { name, category, id, notes: edge?.notes, via, source: edge?.source };
}

/** Escape a value for the category tables' `?f=key:value` URL filter format */
export function escapeFilterValue(value: string): string {
  return value.replace(/([|:,~!-])/g, '\\$1');
}

function sortItems(items: LinkItem[]): LinkItem[] {
  return items.sort(
    (a, b) =>
      (a.category ?? '').localeCompare(b.category ?? '') ||
      a.name.localeCompare(b.name, 'en', { numeric: true })
  );
}

/**
 * Everything linked to `ref`, grouped into labeled rows for its detail page.
 * Forward name-list links are NOT included (pages render those inline, in the
 * card where the field lives — see `inlineNameLinks`); forward `related` items
 * and every reverse direction are.
 */
export function linksForEntry(graph: RelationGraph, ref: EntryRef, entry: BaseEntry): EntryLinks {
  const rows = new Map<string, LinkRow>();
  const row = (label: string, kind: LinkRow['kind'], direction: LinkRow['direction']) => {
    // Rows merge by label: symmetric kinds (variant, related, compatible)
    // read the same from both ends, so declared and derived links share a row
    const key = label;
    if (!rows.has(key)) rows.set(key, { label, kind, direction, items: [] });
    return rows.get(key)!;
  };

  for (const edge of graph.outgoing.get(ref) ?? []) {
    if (edge.field !== 'related' && !edge.field.startsWith('related_')) continue;
    row(EDGE_KINDS[edge.kind].forward, edge.kind, 'forward').items.push(
      itemFor(graph, edge.to, edge)
    );
  }
  // External `related` products (no ref) only exist on the declaring page
  if (Array.isArray(entry.related)) {
    for (const item of entry.related) {
      if (!item || typeof item !== 'object' || item.ref || !item.name) continue;
      if (!RELATED_TYPES.has(item.type)) continue;
      const kind = item.type as EdgeKind;
      row(EDGE_KINDS[kind].forward, kind, 'forward').items.push({
        name: item.name,
        url: item.url,
        notes: item.notes,
        source: item.source,
      });
    }
  }
  for (const edge of graph.incoming.get(ref) ?? []) {
    row(EDGE_KINDS[edge.kind].reverse, edge.kind, 'reverse').items.push(
      itemFor(graph, edge.from, edge)
    );
  }

  const fam = graph.familyOf.get(ref);
  if (fam) {
    const members = (graph.families.get(normalizeName(fam)) ?? []).filter((r) => r !== ref);
    if (members.length) {
      row(`Same protocol (${fam})`, 'family-protocol', 'derived').items.push(
        ...members.map((m) => itemFor(graph, m))
      );
    }
  }

  // Pixels: everything that can drive this part (listed, same protocol, or
  // via firmware) is a filtered table away
  const summary = graph.linked.get(ref);
  if (summary?.hardwareBy) {
    const r = row('All compatible hardware', 'compatible-hardware', 'derived');
    for (const [category, n] of Object.entries(summary.hardwareBy)) {
      r.items.push({
        name: `${n} ${n === 1 ? category.replace(/s$/, '') : category}`,
        to: `/${category}?f=linked.pixels:${escapeFilterValue(entry.name)}`,
        notes: 'lists it, a same-protocol part, or runs firmware that supports it',
      });
    }
  }
  // Hardware with no maker-published IC list: what its firmware supports
  if (summary?.pixelsVia?.length) {
    for (const edge of graph.outgoing.get(ref) ?? []) {
      if (edge.kind !== 'firmware') continue;
      const supported = (graph.outgoing.get(edge.to) ?? []).filter((e) => e.kind === 'supports');
      if (!supported.length) continue;
      row(
        `Drives (via ${graph.names.get(edge.to) ?? edge.to})`,
        'via-firmware',
        'derived'
      ).items.push(...supported.map((e) => itemFor(graph, e.to)));
    }
  }

  // Product family: everything else from the same maker
  for (const { key } of makersOf(entry)) {
    const maker = graph.makers.get(key);
    const others = (maker?.refs ?? []).filter((r) => r !== ref);
    if (maker && others.length) {
      row(`More from ${maker.label}`, 'same-maker', 'derived').items.push(
        ...others.map((r) => itemFor(graph, r))
      );
    }
  }

  const DERIVED_ORDER: LinkRow['kind'][] = [
    'via-firmware',
    'family-protocol',
    'compatible-hardware',
  ];
  const order = (r: LinkRow) =>
    r.kind === 'same-maker'
      ? KIND_ORDER.length + DERIVED_ORDER.length
      : DERIVED_ORDER.includes(r.kind)
        ? KIND_ORDER.length + DERIVED_ORDER.indexOf(r.kind)
        : KIND_ORDER.indexOf(r.kind as EdgeKind);
  const all = [...rows.values()]
    .map((r) => ({ ...r, items: sortItems(r.items) }))
    .sort((a, b) => order(a) - order(b) || a.direction.localeCompare(b.direction));

  const isFamily = (r: LinkRow) =>
    r.kind === 'same-maker' ||
    (!DERIVED_ORDER.includes(r.kind) && EDGE_KINDS[r.kind as EdgeKind].group === 'family');
  return {
    worksWith: all.filter((r) => !isFamily(r)),
    family: all.filter(isFamily),
  };
}

/** Resolved targets for one name, as page-ready link items (empty = unresolved) */
export type InlineNameLinks = Record<string, Record<string, LinkItem[]>>;

/**
 * For an entry's own name-list fields: path → name-as-written → link targets.
 * Pages use it to render e.g. `outputs.protocols` as links in place.
 */
export function inlineNameLinks(
  graph: RelationGraph,
  category: string,
  entry: BaseEntry
): InlineNameLinks {
  const out: InlineNameLinks = {};
  for (const nf of NAME_FIELDS) {
    if (nf.category !== category) continue;
    const values = asStrings(get(entry, nf.path));
    if (!values.length) continue;
    out[nf.path] = {};
    for (const name of values) {
      out[nf.path][name] = resolveName(graph.indexes[nf.index], name).map((ref) =>
        itemFor(graph, ref)
      );
    }
  }
  return out;
}
