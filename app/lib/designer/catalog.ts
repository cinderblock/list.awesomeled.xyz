/**
 * Part catalog for the System Designer.
 *
 * Turns database entries into slim, client-safe options: only the fields the
 * designer reasons about, already parsed into numbers. Built once at
 * prerender time by the /designer loader; pure, so the unit tests feed it
 * synthetic entries.
 *
 * Cross-category facts (which pixels a controller lists, which firmware it
 * runs, which board it sits on) come from the relation graph
 * (app/lib/relations.ts) rather than being re-derived here, so the designer
 * improves automatically as cross-links are filled in.
 */

import type { BaseEntry } from '../types';
import { parseQuantity } from '../quantity';
import { formatPriceText, parsePrice, toUSD } from '../currency';
import { flattenPlatforms } from '../platforms';
import { firstImageFile, imageUrl } from '../images';
import { normalizeName, type Database, type RelationGraph } from '../relations';

// ---------------------------------------------------------------------------
// Shared helpers

type Dict = Record<string, unknown>;

function dict(v: unknown): Dict {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Dict) : {};
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function strings(v: unknown): string[] {
  if (typeof v === 'string') return v.trim() ? [v.trim()] : [];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim());
}

/** Small thumbnail of the entry's first image (built by scripts/thumbs.ts) */
function imagePath(category: string, entry: BaseEntry): string | undefined {
  const file = firstImageFile(entry);
  return file ? imageUrl(category, file, 'sm') : undefined;
}

/** Discontinued or end-of-life: still usable in a design, but flagged */
export function isRetired(status: string | undefined): boolean {
  return status === 'discontinued' || status === 'end-of-life';
}

/**
 * Nominal supply voltage for a database voltage value. Ranges ("3-7.5V")
 * resolve to 5 V when they include it — the rail such parts are run from —
 * and otherwise to their upper end.
 */
export function nominalVoltage(v: unknown): number | null {
  const q = parseQuantity(v, 'voltage');
  if (!q) return null;
  if (q.max == null) return q.value;
  return q.value <= 5 && q.max >= 5 ? 5 : q.max;
}

/** Loose voltage: schema-strict values, plus bare "12" / "5.5V" style strings */
function looseVoltage(v: unknown): number | null {
  const strict = nominalVoltage(v);
  if (strict != null) return strict;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d+(?:\.\d+)?)\s*V?$/i);
  return m ? parseFloat(m[1]) : null;
}

/** Loose current: schema-strict values, plus "30A" / "1.5 A" style strings */
function looseCurrent(v: unknown): number | null {
  const strict = parseQuantity(v, 'current');
  if (strict) return strict.value;
  if (typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d+(?:\.\d+)?)\s*(mA|A)$/i);
  if (!m) return null;
  return parseFloat(m[1]) * (m[2].toLowerCase() === 'ma' ? 1e-3 : 1);
}

// ---------------------------------------------------------------------------
// Prices

export interface PriceTier {
  /** Quantity this unit price applies from */
  qty: number;
  /** Unit price in USD */
  usd: number;
  sku?: string;
}

export interface PriceInfo {
  /** Quantity-tier unit prices, ascending by quantity (one tier = flat price) */
  tiers: PriceTier[];
  /** Single-unit price as written, in its original currency ("€120", "$3–8") */
  text: string | null;
  /** ISO currency the price is published in; USD figures are converted from it */
  currency: string | null;
  /** Who published the price ("LCSC"), when recorded */
  vendor?: string;
  /** YYYY-MM-DD (or YYYY-MM) the price was read */
  retrieved?: string;
}

const NO_PRICE: PriceInfo = { tiers: [], text: null, currency: null };

/**
 * Price as quantity tiers in USD. Accepts a plain price (number, "$25",
 * {amount, currency}) or published quantity tiers ([{qty, price, sku}]).
 */
export function buildPrice(entry: BaseEntry): PriceInfo {
  const source = dict(entry.price_source);
  const provenance = { vendor: str(source.vendor), retrieved: str(source.retrieved) };
  const raw = entry.price;

  if (Array.isArray(raw)) {
    const tiers: PriceTier[] = [];
    let currency: string | null = null;
    for (const item of raw) {
      const t = dict(item);
      const qty = num(t.qty);
      const parsed = parsePrice(t.price);
      const usd = parsed ? toUSD(parsed) : null;
      if (qty == null || qty < 1 || !parsed || usd == null) continue;
      tiers.push({ qty, usd, sku: str(t.sku) });
      currency ??= parsed.currency;
    }
    if (tiers.length === 0) return { ...NO_PRICE, ...provenance };
    tiers.sort((a, b) => a.qty - b.qty);
    return {
      tiers,
      text: formatPriceText({ amount: tiers[0].usd, currency: 'USD' }),
      currency,
      ...provenance,
    };
  }

  const parsed = parsePrice(raw);
  const usd = parsed ? toUSD(parsed) : null;
  if (!parsed || usd == null) return { ...NO_PRICE, ...provenance };
  return {
    tiers: [{ qty: 1, usd }],
    text: formatPriceText(parsed),
    currency: parsed.currency,
    ...provenance,
  };
}

/** Unit price in USD when buying `qty`: the deepest tier that quantity reaches */
export function unitPriceAt(price: PriceInfo, qty: number): PriceTier | null {
  if (price.tiers.length === 0) return null;
  let best = price.tiers[0];
  for (const tier of price.tiers) if (tier.qty <= qty) best = tier;
  return best;
}

// ---------------------------------------------------------------------------
// Pixels (integrated pixels and bare driver ICs)

/** 20 mA per colour channel: the classic budget when no current is recorded */
export const TYPICAL_CHANNEL_AMPS = 0.02;
/** Integrated 12 V pixels run their channels leaner; median of the recorded ones */
export const TYPICAL_HV_CHANNEL_AMPS = 0.012;

/** String voltages offered for driver ICs, which run whatever the LEDs need */
const IC_VOLTAGES = [5, 12, 24];

export interface PixelOption {
  /** Entry slug, or `ic-<slug>` for a bare driver IC from /pixel-ics */
  id: string;
  kind: 'pixel' | 'ic';
  /** Entry page */
  path: string;
  /** `<category>/<slug>`, the relation-graph key */
  ref: string;
  name: string;
  image?: string;
  status?: string;
  /** Protocol family (data.type), e.g. "WS2811/12" */
  family?: string;
  /** true = clocked (data + clock), false = data-only, null = unknown */
  clocked: boolean | null;
  /** Has a failover data wire (WS2813-style) */
  backupLine: boolean;
  /** Colour channels per pixel (3 = RGB, 4 = RGBW) */
  channels: number;
  /**
   * Pixels one part drives: 1, except driver ICs with enough outputs for
   * several pixels (a 9-channel chip runs three RGB pixels)
   */
  pixelsPerPart: number;
  colorOrder?: string;
  /** Bits per colour channel (8, 16 …), when recorded */
  channelBits: number | null;
  bitrateHz: number | null;
  /** Bits per pixel on the data line */
  bitsPerPixel: number | null;
  /** Hardware limit on string length, when the datasheet/testing gives one */
  maxPerString: number | null;
  maxPerStringNotes?: string;
  /** Nominal LED rail voltage (null = not recorded; treated as 5 V) */
  voltage: number | null;
  /** Rail voltages to choose between; one entry = fixed */
  voltageChoices: number[];
  /** Logic supply the data input is referenced to */
  logicVoltage: number | null;
  /** Lowest data voltage read as a logic high (gpio.min) */
  logicHighMin: number | null;
  /** Highest voltage the data pin tolerates (gpio.max) */
  logicMax: number | null;
  /** One colour channel fully on, in amps */
  channelAmps: number;
  ampsBasis: 'datasheet' | 'per-channel wattage' | 'typical';
  /** Datasheet channel limit when the typical figure was used instead */
  channelAmpsLimit?: number;
  /** Idle draw per pixel in amps */
  quiescentAmps: number | null;
  packages?: string;
  price: PriceInfo;
}

/**
 * Colour channels per pixel. Pixels record no channel count, so it comes from
 * the channel order ("GRBW" -> 4); driver ICs record data.channels directly.
 */
export function pixelChannels(entry: BaseEntry): number {
  const data = dict(entry.data);
  const explicit = num(data.channels);
  if (explicit != null && explicit > 0) return explicit;
  const order = str(dict(entry.color).order);
  if (order) {
    const letters = order.replace(/[^A-Za-z]/g, '').length;
    if (letters >= 3 && letters <= 6) return letters;
  }
  return /rgbw|wwa/i.test(entry.name) ? 4 : 3;
}

/** Leading integer of a bit-depth value: 8, "8+5" -> 8, "16+5" -> 16 */
function leadingBits(v: unknown): number | null {
  if (typeof v === 'number') return v > 0 ? v : null;
  if (typeof v !== 'string') return null;
  const m = v.match(/^\s*(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function wholeNumber(v: unknown): number | null {
  if (typeof v === 'number') return v > 0 ? Math.floor(v) : null;
  if (typeof v === 'string' && /^\d+$/.test(v.trim())) return parseInt(v.trim(), 10);
  return null;
}

function sharedPixelFields(entry: BaseEntry) {
  const data = dict(entry.data);
  const physical = dict(entry.physical);
  const packages = strings(physical.packages);
  return {
    name: entry.name,
    status: str(entry.status),
    family: str(data.type),
    clocked: typeof data.clocked === 'boolean' ? data.clocked : null,
    backupLine: data.backup_line === true,
    channels: pixelChannels(entry),
    bitrateHz: parseQuantity(data.bitrate, 'frequency')?.value ?? null,
    bitsPerPixel: num(data.pixel_size_bits),
    maxPerString: wholeNumber(data.max_per_string),
    maxPerStringNotes: str(data.max_per_string_notes),
    packages: packages.length ? packages.join(', ') : undefined,
    price: buildPrice(entry),
  };
}

/** An integrated pixel (LED + driver in one package) from /pixels */
export function buildPixelOption(entry: BaseEntry): PixelOption {
  const el = dict(entry.electrical);
  const color = dict(entry.color);
  const gpio = dict(el.gpio);
  const shared = sharedPixelFields(entry);

  const ledRange = parseQuantity(el.led_voltage, 'voltage');
  const voltage = nominalVoltage(el.led_voltage ?? el.vcc_voltage);
  const logicVoltage =
    nominalVoltage(el.vcc_voltage) ?? (voltage != null && voltage <= 5.5 ? voltage : null);

  // Full-white draw = one channel's current × channels × LED voltage. The
  // database's electrical.wattage is ONE channel's power (it equals
  // channel_current × led_voltage), so it only stands in for the per-channel
  // figure — it is never a per-pixel number on its own.
  const volts = voltage ?? 5;
  const current = parseQuantity(el.channel_current, 'current');
  const wattage = parseQuantity(el.wattage, 'power');
  let channelAmps = volts > 6 ? TYPICAL_HV_CHANNEL_AMPS : TYPICAL_CHANNEL_AMPS;
  let ampsBasis: PixelOption['ampsBasis'] = 'typical';
  if (current) {
    channelAmps = current.value;
    ampsBasis = 'datasheet';
  } else if (wattage) {
    channelAmps = wattage.value / volts;
    ampsBasis = 'per-channel wattage';
  }

  // A wide-range part ("3-7.5V") may be run from any common rail inside it
  const choices =
    ledRange?.max != null
      ? [3.3, 5, 12, 24].filter((v) => v >= ledRange.value && v <= ledRange.max!)
      : [];

  return {
    ...shared,
    id: String(entry.id),
    kind: 'pixel',
    pixelsPerPart: 1,
    path: `/pixels/${entry.id}`,
    ref: `pixels/${entry.id}`,
    image: imagePath('pixels', entry),
    colorOrder: str(color.order),
    channelBits: leadingBits(color.brightness_bits),
    voltage,
    voltageChoices: choices.length > 1 ? choices : voltage != null ? [voltage] : [],
    logicVoltage,
    logicHighMin: nominalVoltage(gpio.min),
    logicMax: nominalVoltage(gpio.max),
    channelAmps,
    ampsBasis,
    quiescentAmps: parseQuantity(el.quiescent_current, 'current')?.value ?? null,
  };
}

/**
 * A bare driver IC from /pixel-ics, as used in strings, strips and modules
 * ("WS2811 12 V bullet nodes"). The LED voltage is the builder's choice, so
 * the option offers the common rails the IC's output stage can take.
 */
export function buildPixelIcOption(entry: BaseEntry): PixelOption {
  const el = dict(entry.electrical);
  const color = dict(entry.color);
  const gpio = dict(el.gpio);
  const shared = sharedPixelFields(entry);

  const outputMax = parseQuantity(el.output_voltage, 'voltage');
  const outputLimit = outputMax ? (outputMax.max ?? outputMax.value) : null;
  const supply = nominalVoltage(el.supply_voltage);
  const choices = outputLimit != null ? IC_VOLTAGES.filter((v) => v <= outputLimit) : IC_VOLTAGES;
  const voltageChoices = choices.length ? choices : [5];
  // 12 V is the usual string voltage for IC-based pixels. With no output
  // rating recorded, an IC whose only known supply is 5 V is assumed to be a
  // 5 V part.
  const prefers5 = outputLimit == null && supply != null && supply <= 5.5;
  const voltage = !prefers5 && voltageChoices.includes(12) ? 12 : voltageChoices[0];

  // A chip with 6+ outputs drives several pixels: 9 channels are three RGB
  // pixels, 16 are four RGBW ones. The designer counts pixels, so the option
  // describes one pixel and remembers how many a chip covers.
  const outputs = shared.channels;
  const channels =
    outputs > 5 ? (outputs % 3 === 0 ? 3 : outputs % 4 === 0 ? 4 : outputs) : outputs;

  // max_current is what the output stage can sink, not what the LEDs are run
  // at: a 45 mA driver still feeds ordinary 20 mA LEDs.
  const limit = parseQuantity(el.max_current, 'current')?.value ?? null;
  const usesLimit = limit != null && limit <= TYPICAL_CHANNEL_AMPS;

  return {
    ...shared,
    id: `ic-${entry.id}`,
    kind: 'ic',
    channels,
    pixelsPerPart: outputs / channels,
    path: `/pixel-ics/${entry.id}`,
    ref: `pixel-ics/${entry.id}`,
    image: imagePath('pixel-ics', entry),
    colorOrder: undefined,
    channelBits: leadingBits(color.channel_bits),
    voltage,
    voltageChoices,
    logicVoltage: supply ?? 5,
    logicHighMin: nominalVoltage(gpio.min),
    logicMax: nominalVoltage(gpio.max),
    channelAmps: usesLimit ? limit : TYPICAL_CHANNEL_AMPS,
    ampsBasis: usesLimit ? 'datasheet' : 'typical',
    channelAmpsLimit: !usesLimit && limit != null ? limit : undefined,
    quiescentAmps: parseQuantity(el.quiescent_current, 'current')?.value ?? null,
  };
}

// ---------------------------------------------------------------------------
// Controllers (and bare dev boards used as controllers)

/** Control-protocol names -> canonical tokens, shared by controllers and software */
const PROTOCOL_TOKENS: Record<string, string> = {
  'art-net': 'artnet',
  artnet: 'artnet',
  sacn: 'sacn',
  'e1.31': 'sacn',
  e131: 'sacn',
  ddp: 'ddp',
  kinet: 'kinet',
  dmx: 'dmx',
  dmx512: 'dmx',
  opc: 'opc',
};

export const PROTOCOL_LABELS: Record<string, string> = {
  artnet: 'Art-Net',
  sacn: 'sACN',
  ddp: 'DDP',
  kinet: 'KiNET',
  dmx: 'DMX',
  opc: 'OPC',
};

export function protocolToken(name: string): string | null {
  const key = name
    .trim()
    .toLowerCase()
    .replace(/\s*\(.*\)$/, '');
  return PROTOCOL_TOKENS[key] ?? null;
}

export interface LicenseTier {
  name: string;
  usd: number;
  text: string;
  /** Pixel count the tier is licensed for, when it is the tier's limit */
  pixels: number | null;
}

export interface OutputConnector {
  /** Connector entry slug when the controller references one */
  id?: string;
  /** Display text: the connector's name, or the free-text description */
  label: string;
  notes?: string;
}

export interface ControllerOption {
  /** Entry slug, or `mb-<slug>` for a bare dev board from /microboards */
  id: string;
  kind: 'controller' | 'board';
  path: string;
  ref: string;
  name: string;
  image?: string;
  status?: string;
  /** Pixel data outputs per unit */
  outputs: number | null;
  maxPerOutput: number | null;
  /** Device-wide pixel limit (quoted for 8-bit RGB), when the maker states one */
  maxTotal: number | null;
  clockedSupport: 'clocked' | 'async' | 'both' | 'unknown';
  /** outputs.protocols exactly as the vendor lists them */
  listedProtocols: string[];
  /** Pixel option ids those names resolve to (via names, aliases, variants) */
  drives: string[];
  /** Normalized protocol families of the parts in `drives` */
  driveFamilies: string[];
  /** Normalized control-protocol tokens it accepts (artnet, sacn, …) */
  inputProtocols: string[];
  /** Physical inputs for display ("Ethernet", "Wi-Fi") */
  inputs: string[];
  /** Can play patterns without a live source */
  standalone: boolean;
  differential: boolean;
  /** outputs.driver.buffered: false = data straight from CPU pins */
  buffered: boolean | null;
  /** Recorded logic level of the data pins (dev boards) */
  dataVoltage: number | null;
  /** Supply range the unit accepts */
  voltageMin: number | null;
  voltageMax: number | null;
  /** Total current the board can pass to its outputs */
  boardAmps: number | null;
  /** Current limit per output */
  outputAmps: number | null;
  outputFuse?: string;
  outputConnector: OutputConnector | null;
  /** Host it has to sit on, as written (inputs.requires_host) */
  requiresHost?: string;
  /** Dev-board option ids the host resolves to */
  hostIds: string[];
  /** Controller-side refresh limit */
  fpsMax: number | null;
  /** Firmware it ships with or runs, as written */
  firmware: string[];
  /** Pattern-source ids that firmware resolves to */
  firmwareIds: string[];
  /** IP rating / waterproof flag of the enclosure, when recorded */
  waterproof: string | boolean | null;
  /** Dev boards: lower-case tokens software platforms are matched against */
  platformTokens: string[];
  price: PriceInfo;
  /** Price tiers sold by licence size ("4096 pixels") rather than by quantity */
  licenseTiers: LicenseTier[];
}

function buildLicenseTiers(raw: unknown): LicenseTier[] {
  if (!Array.isArray(raw)) return [];
  const tiers: LicenseTier[] = [];
  for (const item of raw) {
    const t = dict(item);
    const name = str(t.name);
    const parsed = parsePrice(t.price);
    const usd = parsed ? toUSD(parsed) : null;
    if (!name || !parsed || usd == null) continue;
    tiers.push({ name, usd, text: formatPriceText(parsed), pixels: num(t.pixels) });
  }
  return tiers.sort((a, b) => a.usd - b.usd);
}

function outgoingIds(
  graph: RelationGraph | undefined,
  ref: string,
  kind: string,
  categories: Record<string, (slug: string) => string>
): string[] {
  const ids: string[] = [];
  for (const edge of graph?.outgoing.get(ref) ?? []) {
    if (edge.kind !== kind) continue;
    const [category, slug] = edge.to.split('/');
    const toId = categories[category];
    if (toId && slug) ids.push(toId(slug));
  }
  return [...new Set(ids)];
}

const PIXEL_ID: Record<string, (slug: string) => string> = {
  pixels: (slug) => slug,
  'pixel-ics': (slug) => `ic-${slug}`,
};
const BOARD_ID: Record<string, (slug: string) => string> = { microboards: (slug) => `mb-${slug}` };
const SOURCE_ID: Record<string, (slug: string) => string> = { 'pattern-drivers': (slug) => slug };

export function buildControllerOption(entry: BaseEntry, graph?: RelationGraph): ControllerOption {
  const outputs = dict(entry.outputs);
  const pixels = dict(outputs.pixels);
  const driver = dict(outputs.driver);
  const inputs = dict(entry.inputs);
  const power = dict(entry.power);
  const data = dict(entry.data);
  const software = dict(entry.software);
  const ref = `controllers/${entry.id}`;

  const rawClocked = outputs.clocked;
  let clockedSupport: ControllerOption['clockedSupport'] = 'unknown';
  if (rawClocked === false || rawClocked === 'never') clockedSupport = 'async';
  else if (rawClocked === true || rawClocked === 'always') clockedSupport = 'clocked';
  else if (rawClocked === 'selectable' || rawClocked === 'both') clockedSupport = 'both';

  const inputProtocols = [
    ...new Set(
      strings(inputs.protocols)
        .map(protocolToken)
        .filter((t): t is string => t != null)
    ),
  ];

  let outputConnector: OutputConnector | null = null;
  const connector = outputs.connector;
  if (typeof connector === 'string' && connector.trim()) {
    outputConnector = { label: connector.trim() };
  } else if (connector && typeof connector === 'object') {
    const c = dict(connector);
    const id = str(c.ref);
    const label = (id && graph?.names.get(`connectors/${id}`)) || id;
    if (label) outputConnector = { id, label, notes: str(c.notes) };
  }

  const firmware = strings(software.firmware);
  if (entry.wled_compatible === true && !firmware.some((f) => normalizeName(f) === 'wled')) {
    firmware.push('WLED');
  }

  const waterproof = dict(entry.case).waterproof;

  return {
    id: String(entry.id),
    kind: 'controller',
    path: `/controllers/${entry.id}`,
    ref,
    name: entry.name,
    image: imagePath('controllers', entry),
    status: str(entry.status),
    outputs: num(outputs.count),
    maxPerOutput: num(pixels.max_per_output),
    maxTotal: num(pixels.max_total),
    clockedSupport,
    listedProtocols: strings(outputs.protocols),
    drives: outgoingIds(graph, ref, 'drives', PIXEL_ID),
    driveFamilies: [],
    inputProtocols,
    inputs: Object.entries(dict(inputs.physical))
      .filter(([, v]) => v !== false && v != null)
      .map(([k]) => k),
    standalone: inputs.standalone === true,
    differential: outputs.differential === true,
    buffered: typeof driver.buffered === 'boolean' ? driver.buffered : null,
    dataVoltage: null,
    voltageMin: nominalVoltage(dict(power.voltage).min),
    voltageMax: nominalVoltage(dict(power.voltage).max),
    boardAmps: parseQuantity(dict(power.current).max, 'current')?.value ?? null,
    outputAmps: parseQuantity(dict(outputs.current).max, 'current')?.value ?? null,
    outputFuse: str(outputs.fuse),
    outputConnector,
    requiresHost: str(inputs.requires_host),
    hostIds: outgoingIds(graph, ref, 'host', BOARD_ID),
    fpsMax: num(data.fps),
    firmware,
    firmwareIds: outgoingIds(graph, ref, 'firmware', SOURCE_ID),
    waterproof:
      typeof waterproof === 'string' || typeof waterproof === 'boolean' ? waterproof : null,
    platformTokens: [],
    price: Array.isArray(entry.price) ? NO_PRICE : buildPrice(entry),
    licenseTiers: buildLicenseTiers(entry.price),
  };
}

/**
 * A bare microboard as a controller candidate: usable pixel outputs come from
 * io.max_outputs (firmware-documented); most other specs are honestly unknown
 * and surface as "verify" notes. Returns null when the board records no
 * pixel-output capability.
 */
export function buildBoardOption(entry: BaseEntry): ControllerOption | null {
  const io = dict(entry.io);
  const outputs = num(io.max_outputs);
  if (outputs == null || outputs < 1) return null;
  const power = dict(entry.power);
  const compute = dict(entry.compute);

  const platformTokens = [entry.name, ...strings(entry.aliases), str(compute.soc), str(compute.isa)]
    .filter((t): t is string => !!t)
    .map(normalizeName);

  return {
    id: `mb-${entry.id}`,
    kind: 'board',
    path: `/microboards/${entry.id}`,
    ref: `microboards/${entry.id}`,
    name: entry.name,
    image: imagePath('microboards', entry),
    status: str(entry.status),
    outputs,
    maxPerOutput: null,
    maxTotal: null,
    clockedSupport: 'unknown',
    listedProtocols: [],
    drives: [],
    driveFamilies: [],
    inputProtocols: [],
    inputs: [],
    standalone: false,
    differential: false,
    buffered: null,
    dataVoltage: nominalVoltage(power.gpio_voltage),
    voltageMin: looseVoltage(dict(power.voltage).min),
    voltageMax: looseVoltage(dict(power.voltage).max),
    boardAmps: null,
    outputAmps: null,
    outputConnector: null,
    hostIds: [],
    fpsMax: null,
    firmware: [],
    firmwareIds: [],
    waterproof: null,
    platformTokens,
    price: buildPrice(entry),
    licenseTiers: [],
  };
}

/**
 * A dev board as the thing a controller plugs into (a cape's BeagleBone, a
 * HAT's Raspberry Pi). Every board qualifies, with or without recorded pixel
 * outputs of its own.
 */
export interface HostOption {
  /** `mb-<slug>`, matching the ids in ControllerOption.hostIds */
  id: string;
  path: string;
  name: string;
  price: PriceInfo;
}

export function buildHostOption(entry: BaseEntry): HostOption {
  return {
    id: `mb-${entry.id}`,
    path: `/microboards/${entry.id}`,
    name: entry.name,
    price: buildPrice(entry),
  };
}

// ---------------------------------------------------------------------------
// Level shifters

export interface ShifterOption {
  id: string;
  path: string;
  name: string;
  image?: string;
  status?: string;
  /** Data lines one part converts */
  channels: number | null;
  /** Highest output-side supply it takes */
  maxVoltage: number | null;
  /** Package / form factor as written */
  interface?: string;
  buffered: boolean | null;
  /** A differential line receiver, not a logic-level buffer */
  differential: boolean;
  price: PriceInfo;
}

export function buildShifterOption(entry: BaseEntry): ShifterOption {
  const io = dict(entry.io);
  const el = dict(entry.electrical);
  const iface = str(io.interface);
  return {
    id: String(entry.id),
    path: `/level-converters/${entry.id}`,
    name: entry.name,
    image: imagePath('level-converters', entry),
    status: str(entry.status),
    channels: num(io.channels),
    maxVoltage: looseVoltage(el.max_voltage),
    interface: iface,
    buffered: typeof io.buffered === 'boolean' ? io.buffered : null,
    differential: /differential/i.test(`${iface ?? ''} ${entry.name}`),
    price: buildPrice(entry),
  };
}

// ---------------------------------------------------------------------------
// Connectors

export interface ConnectorOption {
  id: string;
  path: string;
  name: string;
  image?: string;
  status?: string;
  pinsMin: number | null;
  pinsMax: number | null;
  /** Current rating per contact */
  contactAmps: number | null;
  maxVoltage: number | null;
  /** Second digit pair of the IP code as a number (IP67 -> 67); best case when a range */
  ip: number | null;
  ipText?: string;
  locking?: string;
  wireToWire: boolean | null;
  panelMount: boolean | null;
  notes?: string;
  price: PriceInfo;
}

/** Best IP rating mentioned in a rating string ("IP20-IP65" -> 65) */
export function parseIp(text: string | undefined): number | null {
  if (!text) return null;
  const codes = [...text.matchAll(/IP\s?(\d{2})/gi)].map((m) => parseInt(m[1], 10));
  return codes.length ? Math.max(...codes) : null;
}

export function buildConnectorOption(entry: BaseEntry): ConnectorOption {
  const ratings = dict(entry.ratings);
  const mech = dict(entry.mechanical);
  const ipText = str(ratings.ip_rating);
  return {
    id: String(entry.id),
    path: `/connectors/${entry.id}`,
    name: entry.name,
    image: imagePath('connectors', entry),
    status: str(entry.status),
    pinsMin: num(mech.min_pins),
    pinsMax: num(mech.max_pins),
    contactAmps: looseCurrent(ratings.max_current),
    maxVoltage: looseVoltage(ratings.max_voltage),
    ip: parseIp(ipText),
    ipText,
    locking: str(mech.locking),
    wireToWire: typeof mech.wire_to_wire === 'boolean' ? mech.wire_to_wire : null,
    panelMount: typeof mech.panel_mount === 'boolean' ? mech.panel_mount : null,
    notes: str(entry.notes),
    price: buildPrice(entry),
  };
}

// ---------------------------------------------------------------------------
// Pattern sources (software that generates the patterns)

export interface SourceOption {
  id: string;
  path: string;
  name: string;
  /** Other names it goes by ("FPP"), normalized */
  nameKeys: string[];
  status?: string;
  /** Where it runs, for display ("All OS", "Raspberry Pi") */
  platforms: string[];
  /** Hardware it runs ON (ESP32, Raspberry Pi …): firmware-style sources */
  hardware: string[];
  /** Protocol tokens it can send to a controller */
  outputProtocols: string[];
  priceText: string | null;
  /** Price in USD when it is a single number or free */
  priceUSD: number | null;
  license: string | null;
  /** Derived from the licence: true FOSS, false proprietary, null unknown */
  foss: boolean | null;
}

export function buildSourceOption(entry: BaseEntry): SourceOption {
  const outputs = dict(entry.outputs);
  const protocols = outputs.protocols;
  const outputProtocols: string[] = [];
  if (protocols && typeof protocols === 'object' && !Array.isArray(protocols)) {
    for (const [key, value] of Object.entries(protocols)) {
      // Values mark direction: Output/Both/true can drive controllers;
      // Input-only entries consume the protocol instead.
      if (value === 'Input' || value === false || value == null) continue;
      const token = protocolToken(key);
      if (token && !outputProtocols.includes(token)) outputProtocols.push(token);
    }
  }
  const pricing = dict(entry.pricing);
  const rawPrice = pricing.price;
  const priceText =
    typeof rawPrice === 'string' || typeof rawPrice === 'number' ? String(rawPrice) : null;
  let priceUSD: number | null = null;
  if (typeof rawPrice === 'number') priceUSD = rawPrice;
  else if (typeof rawPrice === 'string' && /^(free|foss)$/i.test(rawPrice.trim())) priceUSD = 0;
  else if (typeof rawPrice === 'string' && /^\$?\d+(\.\d+)?$/.test(rawPrice.trim())) {
    priceUSD = parseFloat(rawPrice.trim().replace('$', ''));
  }
  const platforms = dict(entry.platforms);

  return {
    id: String(entry.id),
    path: `/pattern-drivers/${entry.id}`,
    name: entry.name,
    nameKeys: [entry.name, ...strings(entry.aliases)].map(normalizeName),
    status: str(entry.status),
    platforms: flattenPlatforms(entry.platforms),
    hardware: strings(platforms.hardware),
    outputProtocols,
    priceText,
    priceUSD,
    license: str(entry.license) ?? null,
    foss: typeof entry.foss === 'boolean' ? entry.foss : null,
  };
}

// ---------------------------------------------------------------------------
// The catalog

export interface Catalog {
  /** Integrated pixels first, then driver ICs; each sorted by name */
  pixels: PixelOption[];
  /** Controllers and dev boards */
  controllers: ControllerOption[];
  /** Every dev board, for controllers that need a host */
  hosts: HostOption[];
  shifters: ShifterOption[];
  connectors: ConnectorOption[];
  sources: SourceOption[];
}

function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, 'en', { numeric: true });
}

/** Build every option list from loaded categories and the relation graph */
export function buildCatalog(db: Database, graph?: RelationGraph): Catalog {
  const entries = (category: string) => db.get(category) ?? [];
  const boards = entries('microboards')
    .map(buildBoardOption)
    .filter((b): b is ControllerOption => b !== null);
  const pixels = [
    ...entries('pixels').map(buildPixelOption).sort(byName),
    ...entries('pixel-ics').map(buildPixelIcOption).sort(byName),
  ];

  // A controller that lists one member of a protocol family can drive the
  // rest of it (SK6812 speaks the WS2812 protocol)
  const familyOf = new Map(pixels.map((p) => [p.id, p.family]));
  const controllers = entries('controllers').map((e) => {
    const option = buildControllerOption(e, graph);
    option.driveFamilies = [
      ...new Set(
        option.drives
          .map((id) => familyOf.get(id))
          .filter((f): f is string => !!f)
          .map(normalizeName)
      ),
    ];
    return option;
  });

  return {
    pixels,
    controllers: [...controllers.sort(byName), ...boards.sort(byName)],
    hosts: entries('microboards').map(buildHostOption).sort(byName),
    shifters: entries('level-converters').map(buildShifterOption).sort(byName),
    connectors: entries('connectors').map(buildConnectorOption).sort(byName),
    // Sources that can neither send a control protocol nor run on a board
    // give the designer nothing to check against
    sources: entries('pattern-drivers')
      .map(buildSourceOption)
      .filter((s) => s.outputProtocols.length > 0 || s.hardware.length > 0)
      .sort(byName),
  };
}

/** Id -> option lookups for a catalog (built once on the client) */
export interface CatalogIndex {
  pixels: Map<string, PixelOption>;
  controllers: Map<string, ControllerOption>;
  hosts: Map<string, HostOption>;
  shifters: Map<string, ShifterOption>;
  connectors: Map<string, ConnectorOption>;
  sources: Map<string, SourceOption>;
}

export function indexCatalog(catalog: Catalog): CatalogIndex {
  const index = <T extends { id: string }>(list: T[]) => new Map(list.map((o) => [o.id, o]));
  return {
    pixels: index(catalog.pixels),
    controllers: index(catalog.controllers),
    hosts: index(catalog.hosts),
    shifters: index(catalog.shifters),
    connectors: index(catalog.connectors),
    sources: index(catalog.sources),
  };
}
