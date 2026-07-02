/**
 * "Design My System" wizard logic: slim part options, compatibility checks,
 * and power estimation. Pure and client-safe — the /designer loader builds
 * the option lists from the database at SSG time; everything else runs in the
 * browser as the user picks parts.
 */

import type { BaseEntry } from './types';
import { parseQuantity } from './quantity';
import { priceUSD, parsePrice, formatPriceText } from './currency';

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
  priceUSD: number | null;
  priceText: string | null;
  differential: boolean;
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
    priceUSD: priceUSD(entry.price),
    priceText: parsedPrice ? formatPriceText(parsedPrice) : null,
    differential: outputs.differential === true,
  };
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
  count: number
): Compat {
  const reasons: string[] = [];
  const caveats: string[] = [];

  if (pixel.clocked === true && controller.clockedSupport === 'async') {
    reasons.push('outputs are data-only; this pixel needs a clock line');
  }
  if (pixel.clocked === false && controller.clockedSupport === 'clocked') {
    reasons.push('outputs are clocked-only; this pixel is data-only');
  }
  if (pixel.clocked != null && controller.clockedSupport === 'unknown') {
    caveats.push('clocked/data-only support not recorded');
  }

  if (controller.capacity != null && count > controller.capacity) {
    reasons.push(
      `capacity is ${controller.capacity.toLocaleString('en-US')} pixels (need ${count.toLocaleString('en-US')})`
    );
  }
  if (controller.capacity == null) {
    caveats.push('pixel capacity not recorded');
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

export function estimatePower(pixel: PixelOption, count: number): PowerEstimate {
  const watts = pixel.wattsPerPixel * count;
  const voltage = pixel.voltage ?? 5;
  const amps = watts / voltage;
  const headroom = watts * 1.25;
  const steps = [10, 20, 30, 60, 100, 150, 200, 320, 350, 480, 600, 800, 1000, 1500, 2000];
  const recommendedWatts = steps.find((s) => s >= headroom) ?? Math.ceil(headroom / 500) * 500;
  return {
    watts,
    voltage,
    amps,
    recommendedWatts,
    warning: watts > 200 ? 'strong' : watts > 20 ? 'advisory' : 'none',
    basis: pixel.wattsBasis,
  };
}
