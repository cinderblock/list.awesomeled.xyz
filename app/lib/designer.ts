/**
 * "Design My System" wizard logic: slim part options, compatibility checks,
 * and power estimation. Pure and client-safe — the /designer loader builds
 * the option lists from the database at SSG time; everything else runs in the
 * browser as the user picks parts.
 */

import type { BaseEntry } from './types';
import { parseQuantity } from './quantity';
import { priceUSD, parsePrice, formatPriceText } from './currency';
import { flattenPlatforms } from './platforms';

// Classic per-pixel budget when the database has no electrical data:
// 60 mA at 5 V for a 5050 RGB pixel at full white.
const DEFAULT_WATTS_PER_PIXEL = 0.3;

export interface PixelOption {
  id: string;
  name: string;
  image?: string;
  status?: string;
  /** true = clocked (data+clock), false = data-only, null = unknown */
  clocked: boolean | null;
  /** LED supply voltage in volts (null = unknown, assume 5) */
  voltage: number | null;
  /** Estimated max draw per pixel in watts */
  wattsPerPixel: number;
  wattsBasis: 'measured wattage' | 'channel current' | 'typical 5050 estimate';
  /** Protocol family, e.g. "WS2811/12" — used to spot explicit controller support */
  type?: string;
}

export interface ControllerOption {
  id: string;
  name: string;
  image?: string;
  status?: string;
  outputs: number | null;
  maxPerOutput: number | null;
  /** outputs × maxPerOutput (null when either is unknown) */
  capacity: number | null;
  clockedSupport: 'clocked' | 'async' | 'both' | 'unknown';
  /** outputs.protocols — pixel IC names the vendor explicitly lists */
  protocols: string[];
  /** Normalized control-protocol tokens the controller accepts (artnet, sacn, …) */
  inputProtocols: string[];
  /** Can play patterns without a live source (FPP/WLED/SD playback) */
  standalone: boolean;
  priceUSD: number | null;
  priceText: string | null;
  differential: boolean;
}

/** A pixel layout: N strings of M pixels (a matrix is just its strings). */
export interface Layout {
  strings: number;
  perString: number;
}

export function layoutTotal(layout: Layout): number {
  return layout.strings * layout.perString;
}

// Control-protocol names -> canonical tokens, shared by controllers (arrays
// of names) and pattern drivers (map keys).
const PROTOCOL_TOKENS: Record<string, string> = {
  'art-net': 'artnet',
  artnet: 'artnet',
  sacn: 'sacn',
  'e1.31': 'sacn',
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

function protocolToken(name: string): string | null {
  return (
    PROTOCOL_TOKENS[
      name
        .trim()
        .toLowerCase()
        .replace(/\s*\(.*\)$/, '')
    ] ?? null
  );
}

function firstImage(entry: BaseEntry): string | undefined {
  const pick = (v: unknown): string | undefined => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && typeof (v as { file?: string }).file === 'string') {
      return (v as { file: string }).file;
    }
    return undefined;
  };
  const single = pick(entry.image);
  if (single) return single;
  if (Array.isArray(entry.images)) {
    for (const img of entry.images) {
      const f = pick(img);
      if (f) return f;
    }
  }
  return undefined;
}

export function buildPixelOption(entry: BaseEntry): PixelOption {
  const data = (entry.data ?? {}) as Record<string, unknown>;
  const el = (entry.electrical ?? {}) as Record<string, unknown>;

  const clocked = typeof data.clocked === 'boolean' ? data.clocked : null;
  const voltage =
    parseQuantity(el.led_voltage ?? el.supply_voltage ?? el.vcc_voltage, 'voltage')?.value ?? null;

  let wattsPerPixel = DEFAULT_WATTS_PER_PIXEL;
  let wattsBasis: PixelOption['wattsBasis'] = 'typical 5050 estimate';
  const wattage = parseQuantity(el.wattage, 'power');
  if (wattage) {
    wattsPerPixel = wattage.value;
    wattsBasis = 'measured wattage';
  } else {
    const current = parseQuantity(el.channel_current ?? el.max_current, 'current');
    if (current) {
      const channels = typeof data.channels === 'number' ? data.channels : 3;
      wattsPerPixel = current.value * channels * (voltage ?? 5);
      wattsBasis = 'channel current';
    }
  }

  return {
    id: String(entry.id),
    name: entry.name,
    image: firstImage(entry),
    status: typeof entry.status === 'string' ? entry.status : undefined,
    clocked,
    voltage,
    wattsPerPixel,
    wattsBasis,
    type: typeof data.type === 'string' ? data.type : undefined,
  };
}

export function buildControllerOption(entry: BaseEntry): ControllerOption {
  const outputs = (entry.outputs ?? {}) as Record<string, unknown>;
  const pixels = (outputs.pixels ?? {}) as Record<string, unknown>;

  const count = typeof outputs.count === 'number' ? outputs.count : null;
  const maxPerOutput = typeof pixels.max_per_output === 'number' ? pixels.max_per_output : null;

  const rawClocked = outputs.clocked;
  let clockedSupport: ControllerOption['clockedSupport'] = 'unknown';
  if (rawClocked === false || rawClocked === 'never') clockedSupport = 'async';
  else if (rawClocked === true || rawClocked === 'always') clockedSupport = 'clocked';
  else if (rawClocked === 'selectable' || rawClocked === 'both') clockedSupport = 'both';

  const parsedPrice = Array.isArray(entry.price) ? null : parsePrice(entry.price);
  const inputs = (entry.inputs ?? {}) as Record<string, unknown>;
  const inputProtocols = Array.isArray(inputs.protocols)
    ? [...new Set(inputs.protocols.map((p) => protocolToken(String(p))).filter(Boolean))]
    : [];

  return {
    id: String(entry.id),
    name: entry.name,
    image: firstImage(entry),
    status: typeof entry.status === 'string' ? entry.status : undefined,
    outputs: count,
    maxPerOutput,
    capacity: count != null && maxPerOutput != null ? count * maxPerOutput : null,
    clockedSupport,
    protocols: Array.isArray(outputs.protocols) ? outputs.protocols.map(String) : [],
    inputProtocols: inputProtocols as string[],
    standalone: inputs.standalone === true,
    priceUSD: priceUSD(entry.price),
    priceText: parsedPrice ? formatPriceText(parsedPrice) : null,
    differential: outputs.differential === true,
  };
}

export interface PatternSourceOption {
  id: string;
  name: string;
  status?: string;
  platforms: string[];
  /** Normalized protocol tokens this software can OUTPUT (artnet, sacn, …) */
  outputProtocols: string[];
  priceText: string | null;
}

export function buildPatternSourceOption(entry: BaseEntry): PatternSourceOption {
  const outputs = (entry.outputs ?? {}) as Record<string, unknown>;
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
  const pricing = (entry.pricing ?? {}) as Record<string, unknown>;
  return {
    id: String(entry.id),
    name: entry.name,
    status: typeof entry.status === 'string' ? entry.status : undefined,
    platforms: flattenPlatforms(entry.platforms),
    outputProtocols,
    priceText:
      typeof pricing.price === 'string' || typeof pricing.price === 'number'
        ? String(pricing.price)
        : null,
  };
}

export interface SourceCompat {
  ok: boolean;
  /** Protocol tokens both sides speak */
  shared: string[];
  caveats: string[];
}

/** Can this pattern source drive this controller over a shared protocol? */
export function checkSourceCompat(
  source: PatternSourceOption,
  controller: ControllerOption
): SourceCompat {
  if (controller.inputProtocols.length === 0) {
    return {
      ok: true,
      shared: [],
      caveats: ['controller input protocols not recorded — verify pairing'],
    };
  }
  const shared = source.outputProtocols.filter((p) => controller.inputProtocols.includes(p));
  return { ok: shared.length > 0, shared, caveats: [] };
}

export interface Compat {
  ok: boolean;
  /** Hard incompatibilities (empty when ok) */
  reasons: string[];
  /** Unknowns worth double-checking */
  caveats: string[];
  /** Vendor explicitly lists this pixel family in supported protocols */
  explicitSupport: boolean;
}

// Tokens from a pixel's name/type that might appear in a controller's
// protocol list ("WS2811/12" -> ws2811, ws2812)
function pixelTokens(pixel: PixelOption): string[] {
  const tokens = new Set<string>();
  for (const raw of [pixel.name, pixel.type ?? '']) {
    for (const part of raw.split(/[\s/,]+/)) {
      const t = part.trim().toLowerCase();
      if (/^[a-z]+\d+/.test(t)) tokens.add(t);
    }
  }
  // "WS2811/12" style: expand the shorthand suffix
  const m = (pixel.type ?? '').match(/^([A-Za-z]+)(\d+)\/(\d+)$/);
  if (m) tokens.add((m[1] + m[2].slice(0, m[2].length - m[3].length) + m[3]).toLowerCase());
  return [...tokens];
}

export function checkCompat(
  controller: ControllerOption,
  pixel: PixelOption,
  layout: Layout
): Compat {
  const reasons: string[] = [];
  const caveats: string[] = [];
  const total = layoutTotal(layout);

  if (pixel.clocked === true && controller.clockedSupport === 'async') {
    reasons.push('outputs are data-only; this pixel needs a clock line');
  }
  if (pixel.clocked === false && controller.clockedSupport === 'clocked') {
    reasons.push('outputs are clocked-only; this pixel is data-only');
  }
  if (pixel.clocked != null && controller.clockedSupport === 'unknown') {
    caveats.push('clocked/data-only support not recorded');
  }

  if (controller.outputs != null && layout.strings > controller.outputs) {
    reasons.push(`${controller.outputs} outputs (need ${layout.strings} strings)`);
  }
  if (controller.maxPerOutput != null && layout.perString > controller.maxPerOutput) {
    reasons.push(
      `max ${controller.maxPerOutput.toLocaleString('en-US')} pixels per output (strings are ${layout.perString.toLocaleString('en-US')})`
    );
  }
  if (
    controller.maxPerOutput == null &&
    controller.capacity != null &&
    total > controller.capacity
  ) {
    reasons.push(
      `capacity is ${controller.capacity.toLocaleString('en-US')} pixels (need ${total.toLocaleString('en-US')})`
    );
  }
  if (controller.outputs == null || controller.maxPerOutput == null) {
    caveats.push('output/capacity specs incomplete');
  }

  const tokens = pixelTokens(pixel);
  const explicitSupport = controller.protocols.some((p) => {
    const proto = p.toLowerCase();
    return tokens.some((t) => proto.includes(t) || t.includes(proto));
  });

  return { ok: reasons.length === 0, reasons, caveats, explicitSupport };
}

export interface PowerEstimate {
  watts: number;
  voltage: number;
  amps: number;
  /** Suggested supply size with 25% headroom, rounded up to something buyable */
  recommendedWatts: number;
  warning: 'none' | 'advisory' | 'strong';
  basis: PixelOption['wattsBasis'];
}

/** One pixel group: a pixel type, its strings, and the controller driving it. */
export interface Chain {
  pixel: PixelOption | null;
  layout: Layout;
  controller: ControllerOption | null;
}

export interface RailTotal {
  voltage: number;
  watts: number;
  amps: number;
  recommendedWatts: number;
}

export interface SystemPower {
  totalWatts: number;
  totalPixels: number;
  /** One supply rail per distinct pixel voltage */
  rails: RailTotal[];
  warning: 'none' | 'advisory' | 'strong';
}

const SUPPLY_STEPS = [10, 20, 30, 60, 100, 150, 200, 320, 350, 480, 600, 800, 1000, 1500, 2000];

function recommendSupply(watts: number): number {
  const headroom = watts * 1.25;
  return SUPPLY_STEPS.find((s) => s >= headroom) ?? Math.ceil(headroom / 500) * 500;
}

/** Aggregate power across chains, grouped into per-voltage supply rails. */
export function systemPower(chains: Chain[]): SystemPower {
  const byVoltage = new Map<number, number>();
  let totalWatts = 0;
  let totalPixels = 0;
  for (const chain of chains) {
    if (!chain.pixel) continue;
    const total = layoutTotal(chain.layout);
    const watts = chain.pixel.wattsPerPixel * total;
    const voltage = chain.pixel.voltage ?? 5;
    totalWatts += watts;
    totalPixels += total;
    byVoltage.set(voltage, (byVoltage.get(voltage) ?? 0) + watts);
  }
  const rails = [...byVoltage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([voltage, watts]) => ({
      voltage,
      watts,
      amps: watts / voltage,
      recommendedWatts: recommendSupply(watts),
    }));
  return {
    totalWatts,
    totalPixels,
    rails,
    warning: totalWatts > 200 ? 'strong' : totalWatts > 20 ? 'advisory' : 'none',
  };
}

/**
 * Output-count check that accounts for several chains sharing one controller
 * (e.g. 5 V and 12 V groups on separate outputs of the same board): the sum of
 * their strings must fit the controller's outputs.
 */
export function sharedOutputOverflow(chains: Chain[]): string[] {
  const used = new Map<string, { name: string; outputs: number | null; strings: number }>();
  for (const chain of chains) {
    if (!chain.controller) continue;
    const cur = used.get(chain.controller.id) ?? {
      name: chain.controller.name,
      outputs: chain.controller.outputs,
      strings: 0,
    };
    cur.strings += chain.layout.strings;
    used.set(chain.controller.id, cur);
  }
  const problems: string[] = [];
  for (const { name, outputs, strings } of used.values()) {
    if (outputs != null && strings > outputs) {
      problems.push(`${name}: ${strings} strings across groups, but only ${outputs} outputs`);
    }
  }
  return problems;
}

export function estimatePower(pixel: PixelOption, count: number): PowerEstimate {
  const watts = pixel.wattsPerPixel * count;
  const voltage = pixel.voltage ?? 5;
  return {
    watts,
    voltage,
    amps: watts / voltage,
    recommendedWatts: recommendSupply(watts),
    warning: watts > 200 ? 'strong' : watts > 20 ? 'advisory' : 'none',
    basis: pixel.wattsBasis,
  };
}
