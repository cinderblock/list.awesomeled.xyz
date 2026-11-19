/**
 * The field catalog: one description of every field a category's entries
 * carry, derived from the JSON schema (types, units, descriptions, order)
 * and the data itself (fill rate, whether a string field repeats enough to be
 * a facet). Table columns, filters, exports, compare rows and the search
 * index all read from it, so a schema improvement shows up everywhere without
 * UI work.
 *
 * This module is pure (no fs, no React): the schema JSON is handed in. See
 * fields.server.ts for the loader side.
 */

import type { BaseEntry } from './types';
import { parseQuantity, type QuantityKind } from './quantity';
import { formatPriceText, parsePrice, priceUSD, toUSD, type ParsedPrice } from './currency';
import { formatQuantity, QUANTITY_KINDS } from './units';

export type FieldKind =
  | 'text' // free text (contains filter)
  | 'textlist' // list of free-text items (notes, features)
  | 'enum' // one of a few repeating values (select facet)
  | 'tags' // list of short values (multi-select facet)
  | 'keys' // open map; the keys with a truthy value are the facet values
  | 'boolean'
  | 'number'
  | 'quantity' // number with a unit kind (voltage, current, …)
  | 'price'
  | 'year'
  | 'url'
  | 'entity'; // a name, optionally with links: "Acme" | {name, url, page}

export interface FieldMeta {
  /** Dotted path into the entry ("power.voltage.max") */
  key: string;
  /** Short label, unique within the category */
  label: string;
  /** Top-level group key ('' for root-level fields) */
  section: string;
  sectionLabel: string;
  kind: FieldKind;
  quantity?: QuantityKind;
  /** Schema description: extra information for a header tooltip */
  description?: string;
  /** Number of entries that have a value */
  filled: number;
  /** For lists of objects: the property naming each item (vendors → name, storage → type) */
  itemKey?: string;
  /** Path of a sibling free-text note about this field's value ("…_notes") */
  notesKey?: string;
  /** Long free text: truncate in tables */
  long?: boolean;
}

// Loose JSON Schema (draft-07) shape: just what the catalog reads.
export interface JsonSchema {
  $ref?: string;
  type?: string | string[];
  enum?: unknown[];
  format?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  definitions?: Record<string, JsonSchema>;
}

// ---------------------------------------------------------------------------
// Labels
// ---------------------------------------------------------------------------

/** Section titles for known top-level groups (fallback: humanize the key). */
export const SECTION_LABELS: Record<string, string> = {
  '': 'Overview',
  data: 'Data & Protocol',
  color: 'Color & Brightness',
  electrical: 'Electrical',
  physical: 'Physical',
  inputs: 'Inputs',
  outputs: 'Outputs',
  power: 'Power',
  core: 'Processor',
  case: 'Enclosure',
  compute: 'Compute',
  connectivity: 'Connectivity',
  io: 'I/O',
  ratings: 'Ratings',
  mechanical: 'Mechanical',
  termination: 'Termination',
  wiring: 'Wiring',
  pricing: 'Pricing',
  capabilities: 'Capabilities',
  platforms: 'Platforms',
  specs: 'Specifications',
  optical: 'Optical',
  software: 'Software',
  datasheet: 'Datasheet',
  links: 'Links',
};

/** Preferred section order; unknown sections follow in schema order. */
export const SECTION_ORDER = [
  '',
  'inputs',
  'outputs',
  'power',
  'data',
  'color',
  'electrical',
  'physical',
  'core',
  'compute',
  'connectivity',
  'io',
  'case',
  'ratings',
  'mechanical',
  'termination',
  'wiring',
  'optical',
  'capabilities',
  'platforms',
  'specs',
  'software',
  'pricing',
  'datasheet',
  'links',
];

// Words that are not plain sentence case
const WORD_CASE: Record<string, string> = {
  ic: 'IC',
  ics: 'ICs',
  gpio: 'GPIO',
  usb: 'USB',
  pwm: 'PWM',
  dmx: 'DMX',
  ip: 'IP',
  pcb: 'PCB',
  idc: 'IDC',
  soc: 'SoC',
  cpu: 'CPU',
  ram: 'RAM',
  isa: 'ISA',
  bms: 'BMS',
  imu: 'IMU',
  poe: 'PoE',
  fps: 'FPS',
  os: 'OS',
  url: 'URL',
  diy: 'DIY',
  ots: 'OTS',
  adc: 'ADC',
  wled: 'WLED',
  led: 'LED',
  vcc: 'VCC',
  psu: 'PSU',
  wifi: 'Wi-Fi',
  artnet: 'Art-Net',
  sacn: 'sACN',
  ddp: 'DDP',
  kinet: 'KiNET',
  opc: 'OPC',
  spi: 'SPI',
  uart: 'UART',
  i2c: 'I²C',
  sd: 'SD',
  id: 'ID',
  awg: 'AWG',
  oem: 'OEM',
  sku: 'SKU',
  youtube: 'YouTube',
  digikey: 'DigiKey',
  foss: 'FOSS',
};

/** "max_per_output" → "Max per output"; "gpio_voltage" → "GPIO voltage". */
export function humanizeKey(key: string): string {
  const words = key
    .replace(/[_.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => WORD_CASE[word.toLowerCase()] ?? word);
  if (words.length === 0) return key;
  const [first, ...rest] = words;
  // Capitalize the first word unless it has its own casing (sACN, IC, Wi-Fi…)
  const head = /^[a-z]/.test(first) && !WORD_CASE[first.toLowerCase()] ? cap(first) : first;
  return [head, ...rest].join(' ');
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? humanizeKey(section);
}

// Labels the generic humanizer gets wrong or leaves vague out of context
const LABEL_OVERRIDES: Record<string, string> = {
  'inputs.physical': 'Interfaces',
  'outputs.count': 'Outputs',
  'outputs.auxiliary': 'Aux outputs',
  'outputs.driver.buffered': 'Buffered',
  'outputs.pixels.max_per_output': 'Max pixels per output',
  'core.IC': 'MCU',
  'core.family': 'MCU family',
  'case.waterproof': 'IP rating',
  'data.type': 'Protocol family',
  'data.pixel_size_bits': 'Bits per pixel',
  'data.pixel_rate_max': 'Max pixel rate',
  'data.max_per_string': 'Max pixels per string',
  'color.order': 'Color order',
  'datasheet.url': 'Datasheet',
  'datasheet.third_party_testing': 'Third-party testing',
  'links.product': 'Product page',
  'links.url': 'Website',
  'links.repo': 'Repository',
  'pricing.demo.available': 'Demo',
  diy_or_ots: 'DIY or off-the-shelf',
};

// "power.voltage.max" (in section "power") → "Max voltage"
function labelForPath(path: string, section: string): string {
  if (LABEL_OVERRIDES[path]) return LABEL_OVERRIDES[path];
  const rest = section ? path.slice(section.length + 1) : path;
  const parts = rest.split('.');
  const leaf = parts[parts.length - 1];
  // One column per protocol: the protocol name says it all ("Art-Net")
  if (parts.length >= 2 && parts[parts.length - 2] === 'protocols') return humanizeKey(leaf);
  if ((leaf === 'max' || leaf === 'min') && parts.length >= 2) {
    const subject = humanizeKey(parts.slice(0, -1).join(' '));
    // Keep acronym casing ("Max GPIO"), lower-case ordinary words ("Max voltage")
    const lowered = /^[A-Z][a-z]/.test(subject)
      ? subject.charAt(0).toLowerCase() + subject.slice(1)
      : subject;
    return `${cap(leaf)} ${lowered}`;
  }
  return humanizeKey(parts.join(' '));
}

// ---------------------------------------------------------------------------
// Schema reading
// ---------------------------------------------------------------------------

interface NodeInfo {
  types: Set<string>;
  /** Names of shared definitions this node references (voltage, price, …) */
  defs: Set<string>;
  enum?: unknown[];
  format?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  mapOf?: JsonSchema;
  items?: JsonSchema;
}

interface SchemaContext {
  root: JsonSchema | null;
  common: JsonSchema | null;
}

function describeNode(
  node: JsonSchema | undefined,
  ctx: SchemaContext,
  into: NodeInfo = { types: new Set(), defs: new Set() },
  depth = 0
): NodeInfo {
  if (!node || depth > 8) return into;
  // Only the property's own description: shared definitions describe how to
  // write a value, not what the field means
  if (depth === 0 && node.description) into.description = node.description;
  if (node.$ref) {
    const [file, pointer = ''] = node.$ref.split('#');
    const name = pointer.split('/').pop();
    const source = file ? ctx.common : ctx.root;
    if (name) {
      into.defs.add(name);
      describeNode(source?.definitions?.[name], ctx, into, depth + 1);
    }
  }
  for (const t of node.type == null ? [] : Array.isArray(node.type) ? node.type : [node.type]) {
    into.types.add(t);
  }
  if (node.enum) into.enum = [...(into.enum ?? []), ...node.enum];
  if (node.format) into.format = node.format;
  if (node.properties) into.properties = { ...into.properties, ...node.properties };
  if (node.additionalProperties && typeof node.additionalProperties === 'object') {
    into.mapOf = node.additionalProperties;
  }
  if (node.items) into.items = node.items;
  for (const member of [...(node.oneOf ?? []), ...(node.anyOf ?? []), ...(node.allOf ?? [])]) {
    describeNode(member, ctx, into, depth + 1);
  }
  return into;
}

// Fields that are rendered specially elsewhere or carry no browsable value
const SKIPPED_PATHS = [
  /^id$/,
  /^name$/,
  /^updated$/,
  /^images?$/,
  /^dead_links$/,
  /^related$/,
  /^related_/,
  /^variants$/,
  /^price_source$/,
  /^sources$/, // per-field provenance, shown under each field on entry pages
  /^datasheet\.mirror(\.|$)/,
  /^datasheet\.sources$/,
  /(^|\.)source$/,
];

function isSkipped(path: string): boolean {
  return SKIPPED_PATHS.some((re) => re.test(path));
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);
}

// Maps with a fixed key vocabulary that still read as one field whose truthy
// keys are the values (common.json input_interfaces: "Ethernet", "Wi-Fi", …),
// exactly like an open map
const KEY_MAP_DEFS = ['input_interfaces'];

function isKeyMap(info: NodeInfo | undefined): boolean {
  if (!info) return false;
  return (info.mapOf != null && !info.properties) || KEY_MAP_DEFS.some((d) => info.defs.has(d));
}

// A node is one field (not a group to descend into) when it is a scalar, a
// list, an open map, or a string-or-object union such as creator.
function isLeafNode(info: NodeInfo, path: string): boolean {
  if (leafKey(path) === 'price') return true;
  if (info.defs.has('price') || info.defs.has('price_tiers')) return true;
  if (isKeyMap(info)) return true;
  if (!info.properties) return true;
  if (info.types.has('string') || info.types.has('array')) return true; // union with object
  return false;
}

function leafKey(path: string): string {
  return path.slice(path.lastIndexOf('.') + 1);
}

interface SchemaLeaf {
  path: string;
  info: NodeInfo;
}

function walkSchema(schema: JsonSchema | null, ctx: SchemaContext): SchemaLeaf[] {
  const leaves: SchemaLeaf[] = [];
  const visit = (node: JsonSchema, path: string, depth: number) => {
    const info = describeNode(node, ctx);
    if (path && (isLeafNode(info, path) || depth > 6)) {
      leaves.push({ path, info });
      return;
    }
    for (const [key, child] of Object.entries(info.properties ?? {})) {
      visit(child, path ? `${path}.${key}` : key, depth + 1);
    }
  };
  if (schema) visit(schema, '', 0);
  return leaves;
}

// ---------------------------------------------------------------------------
// Data statistics
// ---------------------------------------------------------------------------

interface PathStats {
  filled: number;
  values: unknown[];
}

function collectStats(entries: BaseEntry[], leafPaths: Set<string>): Map<string, PathStats> {
  const stats = new Map<string, PathStats>();
  const record = (path: string, value: unknown) => {
    if (isEmptyValue(value)) return;
    let s = stats.get(path);
    if (!s) stats.set(path, (s = { filled: 0, values: [] }));
    s.filled++;
    s.values.push(value);
  };
  const visit = (value: unknown, path: string, depth: number) => {
    if (value == null) return;
    if (path && (leafPaths.has(path) || !isPlainObject(value) || depth > 6)) {
      record(path, value);
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      visit(child, path ? `${path}.${key}` : key, depth + 1);
    }
  };
  for (const entry of entries) visit(entry, '', 0);
  return stats;
}

// ---------------------------------------------------------------------------
// Kind inference
// ---------------------------------------------------------------------------

// A string field is a facet when its values repeat, or there are only a few
const ENUM_MAX_DISTINCT = 14;
const ENUM_FEW_DISTINCT = 6;
const LONG_TEXT = 48;
const TAG_MAX_LENGTH = 28;

const QUANTITY_KEY_HINTS: [RegExp, QuantityKind][] = [
  [/volt|vcc|vdd|gpio/i, 'voltage'],
  [/current|amp/i, 'current'],
  [/freq|bitrate|clock|speed|rate/i, 'frequency'],
  [/watt|power/i, 'power'],
  [/flash|ram|memory|storage/i, 'memory'],
  [/thick|pitch|diameter|width|height|depth/i, 'length'],
];

function detectQuantity(path: string, strings: string[]): QuantityKind | undefined {
  if (strings.length === 0) return undefined;
  const hinted = QUANTITY_KEY_HINTS.filter(([re]) => re.test(leafKey(path))).map(([, k]) => k);
  for (const kind of hinted.length ? hinted : QUANTITY_KINDS) {
    const parsed = strings.filter((s) => parseLenientQuantity(s, kind) != null).length;
    // Hinted by the key name: a good share is enough (real columns mix in
    // values like "microSD"). Unhinted: nearly all.
    const needed = hinted.length ? 0.4 : 0.9;
    if (parsed / strings.length >= needed && parsed >= 2) return kind;
  }
  return undefined;
}

// "8MB PSRAM" → 8 MB; "10 A" → 10 A; "microSD" → null
function parseLenientQuantity(v: unknown, kind: QuantityKind): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const direct = parseQuantity(v, kind);
  if (direct) return direct.value;
  const first = v.trim().split(/\s+/)[0];
  return parseQuantity(first, kind)?.value ?? null;
}

interface Inferred {
  kind: FieldKind;
  quantity?: QuantityKind;
  itemKey?: string;
  long?: boolean;
}

function inferKind(
  path: string,
  info: NodeInfo | undefined,
  stats: PathStats | undefined,
  ctx: SchemaContext
): Inferred | null {
  const leaf = leafKey(path);
  const values = stats?.values ?? [];
  const defs = info?.defs ?? new Set<string>();
  const types = new Set(info?.types ?? []);
  types.delete('null');
  // Fall back to the data's own types where the schema is silent
  if (types.size === 0) {
    for (const v of values) {
      types.add(Array.isArray(v) ? 'array' : isPlainObject(v) ? 'object' : typeof v);
    }
  }

  if (leaf === 'price' || defs.has('price') || defs.has('price_tiers')) return { kind: 'price' };
  // A shared definition named after a unit kind (voltage, current, length…)
  for (const kind of QUANTITY_KINDS) {
    if (defs.has(kind)) return { kind: 'quantity', quantity: kind };
  }

  // Open map (or fixed-vocabulary key map): its keys are the values
  if (isKeyMap(info)) return { kind: 'keys' };

  if (types.has('array')) {
    const itemInfo = info?.items ? describeNode(info.items, ctx) : undefined;
    const items = values.flatMap((v) => (Array.isArray(v) ? v : []));
    const objectItems = itemInfo?.properties != null || items.some((item) => isPlainObject(item));
    if (objectItems) {
      const keys = new Set([
        ...Object.keys(itemInfo?.properties ?? {}),
        ...items.flatMap((item) => (isPlainObject(item) ? Object.keys(item) : [])),
      ]);
      const itemKey = keys.has('name') ? 'name' : keys.has('type') ? 'type' : undefined;
      return itemKey ? { kind: 'tags', itemKey } : null;
    }
    const strings = items.map(String);
    const longest = strings.reduce((max, s) => Math.max(max, s.length), 0);
    if (longest > TAG_MAX_LENGTH && new Set(strings).size > strings.length * 0.7) {
      return { kind: 'textlist', long: true };
    }
    return { kind: 'tags' };
  }

  // String-or-object unions name a thing: creator, connector
  if (types.has('object') && (types.has('string') || info?.properties || values.length > 0)) {
    if (!types.has('string') && !values.some((v) => typeof v === 'string')) {
      // A pure object that reached here is an open map the schema didn't describe
      return values.every(isPlainObject) ? { kind: 'keys' } : null;
    }
    return { kind: 'entity' };
  }

  const onlyTypes = (...allowed: string[]) =>
    types.size > 0 && [...types].every((t) => allowed.includes(t));

  if (onlyTypes('boolean')) return { kind: 'boolean' };

  if (onlyTypes('integer', 'number')) {
    if (defs.has('year') || /(^|_)year(_|$)|^since$/.test(leaf)) return { kind: 'year' };
    return { kind: 'number' };
  }

  const strings = values.filter((v): v is string => typeof v === 'string');
  const longest = values.reduce<number>((max, v) => Math.max(max, enumLabel(v).length), 0);

  // Notes are prose even when the only one on record happens to be a link
  if (leaf === 'notes' || leaf.endsWith('_notes')) {
    return { kind: 'text', long: longest > LONG_TEXT };
  }

  if (
    path.startsWith('links.') ||
    info?.format === 'uri' ||
    defs.has('url') ||
    /(^|_)url$/.test(leaf) ||
    (strings.length > 0 && strings.length === values.length && strings.every(isUrl))
  ) {
    return { kind: 'url' };
  }

  // Strings that are really measurements ("240MHz", "10 A", "8MB PSRAM")
  if (strings.length > 0 && strings.length >= values.length * 0.5) {
    const quantity = detectQuantity(path, strings);
    if (quantity) return { kind: 'quantity', quantity };
  }

  if (info?.enum?.length) return { kind: 'enum' };

  // A facet when there are only a handful of values, or the values repeat
  const distinct = new Set(values.map((v) => enumLabel(v).toLowerCase())).size;
  const repeats = distinct <= values.length * 0.6;
  if (
    values.length > 0 &&
    longest <= LONG_TEXT &&
    (distinct <= ENUM_FEW_DISTINCT || (distinct <= ENUM_MAX_DISTINCT && repeats))
  ) {
    return { kind: 'enum' };
  }
  return { kind: 'text', long: longest > LONG_TEXT };
}

function isUrl(s: string): boolean {
  return /^https?:\/\//.test(s);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/**
 * Build the field catalog for one category.
 * `schema` is the category's JSON schema, `common` the shared definitions;
 * either may be null (the data alone still yields a usable catalog).
 */
export function buildFieldCatalog(
  schema: JsonSchema | null,
  common: JsonSchema | null,
  entries: BaseEntry[]
): FieldMeta[] {
  const ctx: SchemaContext = { root: schema, common };
  const schemaLeaves = walkSchema(schema, ctx);
  const leafPaths = new Set(schemaLeaves.map((l) => l.path));
  const stats = collectStats(entries, leafPaths);

  // Schema order first (it is the authored, logical order), then anything the
  // data has that the schema doesn't describe (e.g. derived fields)
  const ordered: { path: string; info?: NodeInfo }[] = [...schemaLeaves];
  for (const path of stats.keys()) {
    if (!leafPaths.has(path)) ordered.push({ path });
  }

  const fields: FieldMeta[] = [];
  for (const { path, info } of ordered) {
    if (isSkipped(path)) continue;
    const pathStats = stats.get(path);
    // A field nobody has filled in is noise in pickers and exports
    if (!pathStats) continue;
    const inferred = inferKind(path, info, pathStats, ctx);
    if (!inferred) continue;
    const section = path.includes('.') ? path.slice(0, path.indexOf('.')) : '';
    const field: FieldMeta = {
      key: path,
      label: labelForPath(path, section),
      section,
      sectionLabel: sectionLabel(section),
      kind: inferred.kind,
      filled: pathStats.filled,
    };
    if (inferred.quantity) field.quantity = inferred.quantity;
    if (inferred.itemKey) field.itemKey = inferred.itemKey;
    if (inferred.long) field.long = true;
    if (info?.description) field.description = info.description;
    fields.push(field);
  }

  attachNotes(fields);
  disambiguateLabels(fields);
  return sortBySection(fields);
}

// "<field>_notes" is a footnote on <field>, not a column of its own
function attachNotes(fields: FieldMeta[]): void {
  const byKey = new Map(fields.map((f) => [f.key, f]));
  for (let i = fields.length - 1; i >= 0; i--) {
    const field = fields[i];
    if (!field.key.endsWith('_notes')) continue;
    const base = byKey.get(field.key.slice(0, -'_notes'.length));
    if (!base) continue;
    base.notesKey = field.key;
    fields.splice(i, 1);
  }
}

// Two fields may humanize to the same label ("Max current" under Outputs and
// Power): qualify both with their section.
function disambiguateLabels(fields: FieldMeta[]): void {
  const counts = new Map<string, number>();
  for (const f of fields) counts.set(f.label, (counts.get(f.label) ?? 0) + 1);
  for (const f of fields) {
    if ((counts.get(f.label) ?? 0) > 1 && f.section) {
      f.label = `${f.sectionLabel}: ${f.label.charAt(0).toLowerCase()}${f.label.slice(1)}`;
    }
  }
}

function sortBySection(fields: FieldMeta[]): FieldMeta[] {
  const rank = (section: string) => {
    const i = SECTION_ORDER.indexOf(section);
    return i === -1 ? SECTION_ORDER.length : i;
  };
  // Stable sort: schema order is kept within a section
  return [...fields].sort((a, b) => rank(a.section) - rank(b.section));
}

// ---------------------------------------------------------------------------
// Reading values through a field
// ---------------------------------------------------------------------------

/** Resolve a possibly-dotted key ("outputs.count") against an entry. */
export function getPath(item: unknown, key: string): unknown {
  let value: unknown = item;
  for (const part of key.split('.')) {
    if (value == null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

export function isEmptyValue(v: unknown): boolean {
  if (v == null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (isPlainObject(v)) return Object.keys(v).length === 0;
  return false;
}

// A value that negates the capability its key names (`Wi-Fi: false`)
function isNegated(v: unknown): boolean {
  if (v === false || v == null) return true;
  return typeof v === 'string' && ['no', 'none', 'never', 'false', 'n/a'].includes(v.toLowerCase());
}

/** Display form of a scalar facet value: booleans read Yes / No. */
export function enumLabel(v: unknown): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return String(v);
}

/** The display name of a string-or-object value (creator, connector, vendor). */
export function entityName(v: unknown, itemKey?: string): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (isPlainObject(v)) {
    const named = (itemKey ? v[itemKey] : undefined) ?? v.name ?? v.type ?? v.ref ?? v.oem;
    return named == null ? null : String(named);
  }
  return String(v);
}

/**
 * The discrete values an entry has for a field: what a select filter matches
 * and what a facet counts. Empty for free text and missing values.
 */
export function fieldValues(field: Pick<FieldMeta, 'kind' | 'itemKey'>, value: unknown): string[] {
  if (isEmptyValue(value)) return [];
  switch (field.kind) {
    case 'tags': {
      const items = Array.isArray(value) ? value : [value];
      return items
        .map((item) => entityName(item, field.itemKey))
        .filter((s): s is string => s != null && s !== '');
    }
    case 'keys':
      if (!isPlainObject(value)) return Array.isArray(value) ? value.map(String) : [String(value)];
      return Object.entries(value)
        .filter(([, v]) => !isNegated(v))
        .map(([k]) => k);
    case 'entity': {
      const name = entityName(value);
      return name ? [name] : [];
    }
    case 'boolean':
    case 'enum':
    case 'year':
      return Array.isArray(value) ? value.map(enumLabel) : [enumLabel(value)];
    default:
      return [];
  }
}

/** A comparable number for numeric filters and sorting, or null. */
export function fieldNumber(
  field: Pick<FieldMeta, 'kind' | 'quantity'>,
  value: unknown
): number | null {
  if (value == null) return null;
  switch (field.kind) {
    case 'price':
      return priceUSD(value);
    case 'quantity':
      return field.quantity ? parseLenientQuantity(value, field.quantity) : null;
    case 'number':
    case 'year':
    case 'enum': {
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      const m = String(value).match(/^-?[\d,]*\.?\d+/);
      if (!m) return null;
      const n = parseFloat(m[0].replace(/,/g, ''));
      return Number.isNaN(n) ? null : n;
    }
    default:
      return null;
  }
}

function cheapest(prices: ParsedPrice[]): ParsedPrice {
  return prices.reduce((min, p) => ((toUSD(p) ?? Infinity) < (toUSD(min) ?? Infinity) ? p : min));
}

/** "$275", "from $0.02", "Free", "varies" — the price as a person would write it. */
export function priceText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' && /^(free|varies|contact|unknown)$/i.test(value.trim())) {
    const label = value.trim().toLowerCase();
    return label === 'free' ? 'Free' : label;
  }
  if (Array.isArray(value)) {
    const tiers = value.map(parsePrice).filter((p): p is ParsedPrice => p != null);
    if (tiers.length === 0) return '';
    return `${tiers.length > 1 ? 'from ' : ''}${formatPriceText(cheapest(tiers))}`;
  }
  const parsed = parsePrice(value);
  return parsed ? formatPriceText(parsed) : typeof value === 'string' ? value : '';
}

// "Wi-Fi (2.4GHz)" for a map entry whose value says more than "yes"
function keyWithDetail(key: string, v: unknown): string {
  if (v === true) return key;
  if (Array.isArray(v)) return `${key} (${v.join(', ')})`;
  return `${key} (${String(v)})`;
}

/** Plain-text form of a value: exports, clipboard, search and compare. */
export function fieldText(
  field: Pick<FieldMeta, 'kind' | 'quantity' | 'itemKey'>,
  value: unknown
): string {
  if (isEmptyValue(value)) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  switch (field.kind) {
    case 'price':
      return priceText(value);
    case 'quantity':
      return typeof value === 'number' && field.quantity
        ? formatQuantity(value, field.quantity)
        : String(value);
    case 'boolean':
      return enumLabel(value);
    case 'keys':
      if (isPlainObject(value)) {
        return Object.entries(value)
          .filter(([, v]) => !isNegated(v))
          .map(([k, v]) => keyWithDetail(k, v))
          .join(', ');
      }
      return String(value);
    case 'tags':
    case 'textlist':
    case 'entity':
      return plainText(value, field.itemKey);
    default:
      return plainText(value);
  }
}

/** Generic stringification for values with no field metadata. */
export function plainText(value: unknown, itemKey?: string): string {
  if (isEmptyValue(value)) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'boolean') return enumLabel(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => (isPlainObject(item) ? (entityName(item, itemKey) ?? '') : plainText(item)))
      .filter(Boolean)
      .join(', ');
  }
  if (isPlainObject(value)) {
    const name = entityName(value, itemKey);
    if (name != null) return name;
    return Object.entries(value)
      .filter(([, v]) => !isEmptyValue(v))
      .map(([k, v]) => `${humanizeKey(k)}: ${plainText(v)}`)
      .join('; ');
  }
  return String(value);
}

/**
 * Sort key for a field: numbers for measurable kinds, lower-cased text
 * otherwise, null (sorts last) when there is no value.
 */
export function fieldSortValue(field: FieldMeta, value: unknown): number | string | null {
  if (isEmptyValue(value)) return null;
  if (field.kind === 'boolean') return value === true ? 1 : 0;
  if (['number', 'year', 'quantity', 'price'].includes(field.kind)) {
    return fieldNumber(field, value);
  }
  if (field.kind === 'enum') {
    // Mostly-numeric enums ("8", "8+5", "16") order by their leading number
    const n = fieldNumber(field, value);
    if (n != null) return n;
  }
  const text = fieldText(field, value).toLowerCase();
  return text === '' ? null : text;
}
