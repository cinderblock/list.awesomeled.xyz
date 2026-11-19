/**
 * Power planning: how much a design draws, what supply it wants, where to
 * inject power, and what fuse and wire each feed needs.
 *
 * Two different numbers matter and are kept apart on purpose:
 *  - MAX (full white): every channel of every pixel fully on. Wiring and
 *    fuses have to survive this even if software misbehaves, so the safety
 *    warnings key off it.
 *  - DESIGN: max × the brightness the builder limits the show to. Supplies,
 *    feeds, fuses and wire are sized for this.
 *
 * The constants below are rules of thumb, not physics, except the copper wire
 * table. Each is named so the UI can state the assumption next to the result.
 */

import type { PixelOption } from './catalog';
import { layoutTotal, stringLengths, type Layout } from './design';

/** Run a supply at no more than this fraction of its rating */
export const SUPPLY_LOAD_FACTOR = 0.8;
/** Largest single supply worth recommending, as output current on its rail */
export const SUPPLY_MAX_AMPS = 60;
/** Voltage a feed wire may lose, as a fraction of the rail */
export const WIRE_DROP_FRACTION = 0.05;
/** A fuse is rated this much above its load so it doesn't nuisance-blow */
export const FUSE_MARGIN = 1.25;
/** Above this, wire gauge, fusing and injection start to matter */
export const POWER_ADVISORY_WATTS = 20;
/** Above this, mistakes start fires */
export const POWER_STRONG_WATTS = 200;

/** Supply ratings that are easy to buy, in watts */
const SUPPLY_SIZES = [
  10, 15, 25, 35, 50, 75, 100, 150, 200, 250, 300, 350, 450, 500, 600, 750, 1000, 1500, 2000,
];

/** Standard automotive blade-fuse ratings, in amps */
export const FUSE_SIZES = [1, 2, 3, 4, 5, 7.5, 10, 15, 20, 25, 30, 40];

/**
 * Copper wire by gauge: resistance per metre at 20 °C (exact, from the AWG
 * definition) and a conservative continuous rating (flexible-cord ratings for
 * two loaded conductors from 18 AWG up; common hook-up-wire figures below).
 */
export const WIRE_GAUGES: { awg: number; ohmsPerMeter: number; amps: number }[] = [
  { awg: 22, ohmsPerMeter: 0.05296, amps: 3 },
  { awg: 20, ohmsPerMeter: 0.03331, amps: 5 },
  { awg: 18, ohmsPerMeter: 0.02095, amps: 10 },
  { awg: 16, ohmsPerMeter: 0.01317, amps: 13 },
  { awg: 14, ohmsPerMeter: 0.008286, amps: 18 },
  { awg: 12, ohmsPerMeter: 0.005211, amps: 25 },
  { awg: 10, ohmsPerMeter: 0.003277, amps: 30 },
  { awg: 8, ohmsPerMeter: 0.002061, amps: 40 },
];

export interface PowerSettings {
  /** Percent of full white to size for (1–100) */
  brightness: number;
  /** Most current one power feed should carry */
  feedAmps: number;
  /** One-way feed wire length in metres */
  wireMeters: number;
}

// ---------------------------------------------------------------------------
// Per pixel

/** Full-white current of one pixel, in amps on its LED rail */
export function pixelMaxAmps(pixel: PixelOption): number {
  return pixel.channelAmps * pixel.channels;
}

/** Full-white power of one pixel at the given rail voltage */
export function pixelMaxWatts(pixel: PixelOption, voltage: number): number {
  return pixelMaxAmps(pixel) * voltage;
}

/** Rail voltage a group runs at: the builder's choice, else the pixel's, else 5 V */
export function effectiveVoltage(pixel: PixelOption | null, chosen: number | null): number {
  if (pixel && chosen != null && pixel.voltageChoices.includes(chosen)) return chosen;
  return pixel?.voltage ?? 5;
}

// ---------------------------------------------------------------------------
// Fuses and wire

/** Smallest standard fuse that carries `amps` with margin; null = beyond the range */
export function fuseFor(amps: number): number | null {
  const needed = amps * FUSE_MARGIN;
  return FUSE_SIZES.find((size) => size >= needed) ?? null;
}

export interface WireChoice {
  awg: number;
  /** Volts lost over the round trip at the feed's current */
  dropVolts: number;
  dropFraction: number;
  /** False when even the heaviest gauge in the table can't meet both limits */
  ok: boolean;
  /** What forced this gauge: the fuse it must outlast, or voltage drop */
  limitedBy: 'ampacity' | 'voltage drop';
}

/**
 * Thinnest wire that (a) is rated for the fuse protecting it and (b) loses at
 * most WIRE_DROP_FRACTION of the rail over the round trip.
 */
export function wireFor(
  amps: number,
  fuseAmps: number | null,
  voltage: number,
  meters: number
): WireChoice {
  const mustCarry = Math.max(amps, fuseAmps ?? amps);
  const budget = voltage * WIRE_DROP_FRACTION;
  const drop = (ohmsPerMeter: number) => amps * ohmsPerMeter * meters * 2;

  let firstRated: (typeof WIRE_GAUGES)[number] | undefined;
  for (const gauge of WIRE_GAUGES) {
    if (gauge.amps < mustCarry) continue;
    firstRated ??= gauge;
    const dropVolts = drop(gauge.ohmsPerMeter);
    if (dropVolts <= budget) {
      return {
        awg: gauge.awg,
        dropVolts,
        dropFraction: dropVolts / voltage,
        ok: true,
        limitedBy: gauge === firstRated ? 'ampacity' : 'voltage drop',
      };
    }
  }
  const heaviest = WIRE_GAUGES[WIRE_GAUGES.length - 1];
  const dropVolts = drop(heaviest.ohmsPerMeter);
  return {
    awg: heaviest.awg,
    dropVolts,
    dropFraction: dropVolts / voltage,
    ok: false,
    limitedBy: heaviest.amps < mustCarry ? 'ampacity' : 'voltage drop',
  };
}

// ---------------------------------------------------------------------------
// Per string and per group

export interface StringPower {
  /** Pixels on this string */
  pixels: number;
  /** How many strings in the group have this length */
  count: number;
  maxAmps: number;
  designAmps: number;
  /** Power feed points along the string, the start included */
  feeds: number;
  /** Design current through each feed */
  feedAmps: number;
  /** Pixels served by each feed */
  spacing: number;
  /** Suggested fuse per feed; null when one feed is too big to fuse sensibly */
  fuseAmps: number | null;
  wire: WireChoice;
}

export interface GroupPower {
  pixels: number;
  voltage: number;
  pixelMaxAmps: number;
  pixelMaxWatts: number;
  maxWatts: number;
  designWatts: number;
  /** Design current on the rail */
  designAmps: number;
  /** All pixels dark; null when the pixel records no quiescent current */
  idleWatts: number | null;
  /** One row per distinct string length, longest first */
  strings: StringPower[];
  longest: StringPower;
  /** Feed points across every string of the group */
  totalFeeds: number;
}

export function planString(
  pixels: number,
  count: number,
  ampsPerPixel: number,
  voltage: number,
  settings: PowerSettings
): StringPower {
  const maxAmps = pixels * ampsPerPixel;
  const designAmps = (maxAmps * settings.brightness) / 100;
  const feeds = Math.max(1, Math.ceil(designAmps / settings.feedAmps - 1e-9));
  const feedAmps = designAmps / feeds;
  const fuseAmps = fuseFor(feedAmps);
  return {
    pixels,
    count,
    maxAmps,
    designAmps,
    feeds,
    feedAmps,
    spacing: Math.ceil(pixels / feeds),
    fuseAmps,
    wire: wireFor(feedAmps, fuseAmps, voltage, settings.wireMeters),
  };
}

export function planGroup(
  pixel: PixelOption,
  layout: Layout,
  voltage: number,
  settings: PowerSettings
): GroupPower {
  const pixels = layoutTotal(layout);
  const ampsPerPixel = pixelMaxAmps(pixel);
  const wattsPerPixel = ampsPerPixel * voltage;

  const byLength = new Map<number, number>();
  for (const length of stringLengths(layout)) {
    byLength.set(length, (byLength.get(length) ?? 0) + 1);
  }
  const strings = [...byLength.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([length, count]) => planString(length, count, ampsPerPixel, voltage, settings));

  const maxWatts = pixels * wattsPerPixel;
  const designWatts = (maxWatts * settings.brightness) / 100;
  return {
    pixels,
    voltage,
    pixelMaxAmps: ampsPerPixel,
    pixelMaxWatts: wattsPerPixel,
    maxWatts,
    designWatts,
    designAmps: designWatts / voltage,
    idleWatts: pixel.quiescentAmps != null ? pixel.quiescentAmps * voltage * pixels : null,
    strings,
    longest: strings[0],
    totalFeeds: strings.reduce((sum, s) => sum + s.feeds * s.count, 0),
  };
}

// ---------------------------------------------------------------------------
// Rails and supplies

export interface SupplyPlan {
  count: number;
  /** Rating of each supply in watts */
  watts: number;
}

/**
 * Supplies for one rail: enough capacity that the design load sits at
 * SUPPLY_LOAD_FACTOR or below, split into several units once a single one
 * would have to deliver more than SUPPLY_MAX_AMPS.
 */
export function planSupply(designWatts: number, voltage: number): SupplyPlan {
  const needed = designWatts / SUPPLY_LOAD_FACTOR;
  const largestPractical =
    [...SUPPLY_SIZES].reverse().find((size) => size <= SUPPLY_MAX_AMPS * voltage) ??
    SUPPLY_SIZES[0];
  const count = Math.max(1, Math.ceil(needed / largestPractical - 1e-9));
  const each = needed / count;
  const watts = SUPPLY_SIZES.find((size) => size >= each - 1e-9) ?? largestPractical;
  return { count, watts };
}

export interface Rail {
  voltage: number;
  /** Indices of the groups on this rail */
  groups: number[];
  pixels: number;
  maxWatts: number;
  designWatts: number;
  designAmps: number;
  /** Sum over the groups that record a quiescent current */
  idleWatts: number;
  supply: SupplyPlan;
  feeds: number;
}

export type PowerWarning = 'none' | 'advisory' | 'strong';

export interface SystemPower {
  rails: Rail[];
  pixels: number;
  maxWatts: number;
  designWatts: number;
  idleWatts: number;
  /** False when some group's pixel records no quiescent current */
  idleComplete: boolean;
  warning: PowerWarning;
}

export function powerWarning(maxWatts: number): PowerWarning {
  if (maxWatts > POWER_STRONG_WATTS) return 'strong';
  if (maxWatts > POWER_ADVISORY_WATTS) return 'advisory';
  return 'none';
}

/** Aggregate group plans into one supply rail per distinct voltage */
export function planSystem(groups: (GroupPower | null)[]): SystemPower {
  const rails = new Map<number, Rail>();
  let idleComplete = true;
  groups.forEach((group, index) => {
    if (!group) return;
    const rail = rails.get(group.voltage) ?? {
      voltage: group.voltage,
      groups: [],
      pixels: 0,
      maxWatts: 0,
      designWatts: 0,
      designAmps: 0,
      idleWatts: 0,
      supply: { count: 1, watts: SUPPLY_SIZES[0] },
      feeds: 0,
    };
    rail.groups.push(index);
    rail.pixels += group.pixels;
    rail.maxWatts += group.maxWatts;
    rail.designWatts += group.designWatts;
    rail.designAmps += group.designAmps;
    rail.feeds += group.totalFeeds;
    if (group.idleWatts != null) rail.idleWatts += group.idleWatts;
    else idleComplete = false;
    rails.set(group.voltage, rail);
  });

  const list = [...rails.values()].sort((a, b) => a.voltage - b.voltage);
  for (const rail of list) rail.supply = planSupply(rail.designWatts, rail.voltage);

  const maxWatts = list.reduce((sum, r) => sum + r.maxWatts, 0);
  return {
    rails: list,
    pixels: list.reduce((sum, r) => sum + r.pixels, 0),
    maxWatts,
    designWatts: list.reduce((sum, r) => sum + r.designWatts, 0),
    idleWatts: list.reduce((sum, r) => sum + r.idleWatts, 0),
    idleComplete,
    warning: powerWarning(maxWatts),
  };
}

// ---------------------------------------------------------------------------
// Refresh rate and network size

/**
 * Theoretical refresh ceiling for one string: each output shifts its pixels
 * out serially at the data rate, so fps = bitrate ÷ (bits per pixel × pixels
 * on the string). Strings on separate outputs update in parallel, so only the
 * longest string matters. Ignores the protocol's reset/latch gap, so real
 * rates run a little lower.
 */
export function maxFps(pixel: PixelOption, perString: number): number | null {
  if (!pixel.bitrateHz || !pixel.bitsPerPixel || perString <= 0) return null;
  return pixel.bitrateHz / (pixel.bitsPerPixel * perString);
}

/** Longest string that still reaches `fps` */
export function maxPixelsForFps(pixel: PixelOption, fps: number): number | null {
  if (!pixel.bitrateHz || !pixel.bitsPerPixel || fps <= 0) return null;
  return Math.floor(pixel.bitrateHz / (pixel.bitsPerPixel * fps));
}

/** DMX-style channels one pixel occupies over Art-Net / sACN */
export function channelsPerPixel(pixel: PixelOption): number {
  const bytes = pixel.channelBits != null && pixel.channelBits > 8 ? 2 : 1;
  return pixel.channels * bytes;
}

/** Universes needed when pixels never straddle a universe boundary */
export function universesFor(pixel: PixelOption, pixels: number): number {
  const perUniverse = Math.max(1, Math.floor(512 / channelsPerPixel(pixel)));
  return Math.ceil(pixels / perUniverse);
}
