/**
 * Compatibility checks between the parts of a design.
 *
 * Every check returns Issues with a severity:
 *   error    it won't work as specified
 *   warning  it needs something extra, or is likely to cause trouble
 *   info     worth knowing or verifying — usually a fact the database lacks
 *
 * The same functions rate candidates in the pickers and the chosen parts in
 * the summary, so a part can never look fine in one place and broken in the
 * other. Unknown data never produces an error: the designer says "verify"
 * rather than guessing.
 */

import { normalizeName } from '../relations';
import {
  isRetired,
  PROTOCOL_LABELS,
  type ConnectorOption,
  type ControllerOption,
  type PixelOption,
  type ShifterOption,
  type SourceOption,
} from './catalog';
import type { Layout } from './design';
import type { GroupPower } from './electrical';

export type Severity = 'error' | 'warning' | 'info';
export type Slot =
  | 'pixels'
  | 'layout'
  | 'controller'
  | 'shifter'
  | 'connector'
  | 'power'
  | 'source';

export interface Issue {
  severity: Severity;
  /** Stable machine id, e.g. "clock-line" */
  code: string;
  slot: Slot;
  /** Index of the pixel group; undefined = the whole system */
  group?: number;
  /** What is wrong, in one sentence */
  message: string;
  /** What to do about it */
  fix?: string;
}

/** More units of one controller than this is treated as "pick a bigger one" */
export const MAX_CONTROLLER_UNITS = 8;

const SEVERITY_RANK: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || (a.group ?? -1) - (b.group ?? -1)
  );
}

export function worstSeverity(issues: Issue[]): Severity | null {
  if (issues.some((i) => i.severity === 'error')) return 'error';
  if (issues.some((i) => i.severity === 'warning')) return 'warning';
  if (issues.some((i) => i.severity === 'info')) return 'info';
  return null;
}

function n(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function volts(value: number): string {
  return `${n(value, 1)} V`;
}

function amps(value: number): string {
  return `${n(value, value < 10 ? 1 : 0)} A`;
}

// ---------------------------------------------------------------------------
// Protocol support

export type ProtocolSupport = 'listed' | 'family' | 'unlisted' | 'unknown';

/** "WS2811/12" -> ["ws2811", "ws2812"]; other labels -> [normalized label] */
function familyTokens(family: string | undefined): string[] {
  if (!family) return [];
  const shorthand = family.match(/^(\d*[A-Za-z]+)(\d+)\/(\d+)$/);
  if (shorthand) {
    const [, prefix, first, suffix] = shorthand;
    const second = first.slice(0, first.length - suffix.length) + suffix;
    return [normalizeName(prefix + first), normalizeName(prefix + second)];
  }
  return [normalizeName(family)];
}

/**
 * Does the vendor's protocol list cover this pixel?
 *  - listed:   the list names this very part (or one of its aliases/variants)
 *  - family:   the list names another part with the same wire protocol, or a
 *              wildcard such as "WS281x"
 *  - unlisted: there is a list, and nothing in it matches
 *  - unknown:  no list recorded (the usual case — say nothing)
 */
export function protocolSupport(
  controller: ControllerOption,
  pixel: PixelOption
): { support: ProtocolSupport; via?: string } {
  if (controller.listedProtocols.length === 0) return { support: 'unknown' };
  if (controller.drives.includes(pixel.id)) return { support: 'listed' };

  const pixelKey = normalizeName(pixel.name);
  const tokens = new Set([...familyTokens(pixel.family), pixelKey]);
  if (pixel.family && controller.driveFamilies.includes(normalizeName(pixel.family))) {
    return { support: 'family', via: pixel.family };
  }
  for (const listed of controller.listedProtocols) {
    const key = normalizeName(listed);
    if (!key) continue;
    if (tokens.has(key)) return { support: 'family', via: listed };
    // "WS281x": a trailing x stands for any one character
    if (/x$/.test(key) && key.length > 3) {
      const stem = key.slice(0, -1);
      if ([...tokens].some((t) => t.length > stem.length && t.startsWith(stem))) {
        return { support: 'family', via: listed };
      }
    }
  }
  return { support: 'unlisted' };
}

// ---------------------------------------------------------------------------
// Logic levels

export type LevelNeed = 'required' | 'marginal' | 'ok' | 'unknown';

/**
 * Logic-high voltage of a controller's data outputs:
 *  - dev boards record their GPIO level
 *  - buffered outputs are driven from a 5 V buffer
 *  - unbuffered outputs come straight from the CPU, which is 3.3 V on
 *    everything recent enough to be in the database
 */
export function dataVoltage(controller: ControllerOption): number | null {
  if (controller.dataVoltage != null) return controller.dataVoltage;
  if (controller.buffered === true) return 5;
  if (controller.buffered === false) return 3.3;
  return null;
}

/** Lowest data voltage the pixel reliably reads as high */
export function logicThreshold(pixel: PixelOption): number {
  if (pixel.logicHighMin != null) return pixel.logicHighMin;
  // 0.7 × VDD is the usual CMOS threshold. Pixels on a higher LED rail still
  // run their logic from an internal ~5 V supply.
  return 0.7 * Math.min(pixel.logicVoltage ?? 5, 5);
}

export function levelNeed(controller: ControllerOption, pixel: PixelOption): LevelNeed {
  const out = dataVoltage(controller);
  if (out == null) return 'unknown';
  const threshold = logicThreshold(pixel);
  if (out < threshold) return 'required';
  if (out - threshold < 0.5) return 'marginal';
  return 'ok';
}

// ---------------------------------------------------------------------------
// Controller ↔ pixels

export interface ControllerFit {
  /** False when at least one check is an error */
  ok: boolean;
  /** Units of this controller needed for the strings it must drive */
  units: number;
  support: ProtocolSupport;
  supportVia?: string;
  level: LevelNeed;
  issues: Issue[];
}

export interface FitInput {
  pixel: PixelOption | null;
  /** Rail voltage the group runs at */
  voltage: number;
  layout: Layout;
  /** Strings this controller drives across every group that shares it */
  totalStrings: number;
  /** Pixels it drives across those groups */
  totalPixels: number;
  power: GroupPower | null;
  targetFps: number;
  outdoor: boolean;
  /** A level shifter is already part of the group */
  hasShifter: boolean;
}

/** A controller's device-wide pixel limit for this pixel: the RGB figure, scaled by channel count */
export function totalLimit(controller: ControllerOption, pixel: PixelOption | null): number | null {
  if (controller.maxTotal == null) return null;
  const channels = pixel?.channels ?? 3;
  return channels > 3 ? Math.floor((controller.maxTotal * 3) / channels) : controller.maxTotal;
}

/**
 * Units of a controller a design needs: enough outputs for the strings, and
 * enough pixel capacity when the maker states a device-wide limit.
 */
export function unitsNeeded(
  controller: ControllerOption,
  totalStrings: number,
  totalPixels = 0,
  pixel: PixelOption | null = null
): number {
  const byOutputs =
    controller.outputs != null && controller.outputs >= 1
      ? Math.ceil(totalStrings / controller.outputs)
      : 1;
  const limit = totalLimit(controller, pixel);
  const byPixels = limit != null && limit >= 1 ? Math.ceil(totalPixels / limit) : 1;
  return Math.max(1, byOutputs, byPixels);
}

export function evaluateController(controller: ControllerOption, input: FitInput): ControllerFit {
  const { pixel, layout, voltage, power } = input;
  const issues: Issue[] = [];
  const add = (
    severity: Severity,
    code: string,
    message: string,
    fix?: string,
    slot: Slot = 'controller'
  ) => issues.push({ severity, code, slot, message, fix });
  const isBoard = controller.kind === 'board';
  const name = controller.name;

  // Clock line
  if (pixel?.clocked === true && controller.clockedSupport === 'async') {
    add('error', 'clock-line', `${name} only has data outputs; ${pixel.name} also needs a clock.`);
  } else if (pixel?.clocked === false && controller.clockedSupport === 'clocked') {
    add('error', 'clock-line', `${name} only drives clocked pixels; ${pixel.name} is data-only.`);
  } else if (pixel?.clocked === true && controller.clockedSupport === 'both') {
    add(
      'info',
      'clock-pins',
      `Clocked pixels usually take two controller pins per string.`,
      `Check how many clocked outputs ${name} really offers.`
    );
  } else if (
    pixel &&
    pixel.clocked != null &&
    controller.clockedSupport === 'unknown' &&
    !isBoard
  ) {
    add(
      'info',
      'clock-unknown',
      `Whether ${name} drives ${pixel.clocked ? 'clocked' : 'data-only'} pixels isn't recorded.`,
      'Check the vendor page before buying.'
    );
  }

  // Too few outputs, or too little pixel capacity, means more units — up to a point
  const units = unitsNeeded(controller, input.totalStrings, input.totalPixels, pixel);
  const limit = totalLimit(controller, pixel);
  const byOutputs = unitsNeeded(controller, input.totalStrings);
  // Which limit sets the unit count, in words
  const why =
    units > byOutputs && limit != null
      ? `${n(input.totalPixels)} pixels at ${n(limit)} per unit`
      : `${n(input.totalStrings)} strings at ${n(controller.outputs ?? 0)} output${controller.outputs === 1 ? '' : 's'} each`;
  if (controller.outputs == null) {
    add(
      'info',
      'outputs-unknown',
      `${name}'s number of pixel outputs isn't recorded.`,
      `Confirm it has at least ${n(input.totalStrings)}.`
    );
  }
  if (units > MAX_CONTROLLER_UNITS) {
    add(
      'error',
      'too-many-units',
      `This would take ${n(units)} × ${name}: ${why}.`,
      'Choose a larger controller, or fewer, longer strings.'
    );
  } else if (units > 1) {
    add('info', 'multiple-units', `${n(units)} × ${name} needed: ${why}.`);
  }

  // Pixels per output
  if (controller.maxPerOutput != null) {
    const limit = controller.maxPerOutput;
    if (layout.perString > limit) {
      add(
        'error',
        'per-output',
        `${name} drives at most ${n(limit)} pixels per output; ${layout.lengths ? 'the longest string is' : 'strings are'} ${n(layout.perString)}.`,
        `Split into strings of ${n(limit)} or fewer.`
      );
    } else if (pixel && pixel.channels > 3) {
      // Limits are quoted for RGB; a channel budget holds fewer RGBW pixels
      const scaled = Math.floor((limit * 3) / pixel.channels);
      if (layout.perString > scaled) {
        add(
          'warning',
          'per-output-channels',
          `${name}'s ${n(limit)} pixels per output is an RGB figure; ${pixel.name} uses ${pixel.channels} channels per pixel, so expect about ${n(scaled)}.`,
          `Use strings of ${n(scaled)} or fewer, or confirm the limit for ${pixel.channels}-channel pixels.`
        );
      }
    }
  } else if (limit != null && layout.perString > limit) {
    add(
      'error',
      'per-output',
      `${name} drives at most ${n(limit)} ${pixel && pixel.channels > 3 ? `${pixel.channels}-channel ` : ''}pixels in total; ${layout.lengths ? 'the longest string is' : 'strings are'} ${n(layout.perString)}.`,
      `Split into strings of ${n(limit)} or fewer.`
    );
  } else if (!isBoard && limit == null) {
    add(
      'info',
      'per-output-unknown',
      `${name}'s pixels-per-output limit isn't recorded.`,
      `Confirm it can drive ${n(layout.perString)} per output.`
    );
  }

  // Vendor protocol list
  const { support, via } = pixel
    ? protocolSupport(controller, pixel)
    : { support: 'unknown' as const, via: undefined };
  if (pixel && support === 'unlisted') {
    add(
      'warning',
      'protocol-unlisted',
      `${name} lists ${controller.listedProtocols.join(', ')} — not ${pixel.name}.`,
      'Vendor lists are often incomplete; confirm support before buying.'
    );
  }
  if (pixel && (pixel.channelBits ?? 8) > 8 && support !== 'listed') {
    add(
      'info',
      'deep-colour',
      `${pixel.name} sends ${pixel.channelBits} bits per channel.`,
      `Confirm ${name} (and its firmware) supports that format, not just 8-bit pixels.`
    );
  }

  // Supply voltage: can the controller sit on the pixel rail?
  if (pixel && controller.voltageMax != null && voltage > controller.voltageMax * 1.05) {
    add(
      'warning',
      'voltage-over',
      `${name} takes at most ${volts(controller.voltageMax)}; the pixels run on ${volts(voltage)}.`,
      `Don't pass pixel power through it. Power the pixels straight from their supply, join the grounds, and give ${name} its own ${volts(controller.voltageMax)} supply.`
    );
  } else if (pixel && controller.voltageMin != null && voltage < controller.voltageMin * 0.95) {
    add(
      'warning',
      'voltage-under',
      `${name} needs at least ${volts(controller.voltageMin)}; the pixels run on ${volts(voltage)}.`,
      `Give ${name} its own supply and join the grounds.`
    );
  }

  // Current through the controller's outputs: the first power feed of each
  // string normally arrives through its output connector
  if (power && controller.outputAmps != null && power.longest.feedAmps > controller.outputAmps) {
    add(
      'warning',
      'output-current',
      `Each output of ${name} is rated ${amps(controller.outputAmps)}${controller.outputFuse ? ` (${controller.outputFuse} fuse)` : ''}; a power feed carries up to ${amps(power.longest.feedAmps)}.`,
      `Plan for ${amps(controller.outputAmps)} or less per feed, or power the strings straight from the supply and take only data from ${name}.`,
      'power'
    );
  }

  // Logic level
  const level: LevelNeed = pixel ? levelNeed(controller, pixel) : 'unknown';
  const out = dataVoltage(controller);
  if (pixel && out != null) {
    const threshold = logicThreshold(pixel);
    if (level === 'required' && !input.hasShifter) {
      add(
        'warning',
        'level-shift',
        `${name} sends ${volts(out)} data${controller.dataVoltage == null ? ' (unbuffered CPU pins)' : ''}; ${pixel.name} wants at least ${volts(threshold)} for a logic high.`,
        'Add a level shifter on each data line.',
        'shifter'
      );
    } else if (level === 'marginal' && !input.hasShifter) {
      add(
        'info',
        'level-marginal',
        `${volts(out)} data is only just above ${pixel.name}'s ${volts(threshold)} threshold.`,
        'Fine on short leads; add a level shifter for long runs or if the first pixels flicker.',
        'shifter'
      );
    }
    if (pixel.logicMax != null && out > pixel.logicMax + 0.3) {
      add(
        'error',
        'data-overvoltage',
        `${name} sends ${volts(out)} data; ${pixel.name}'s data pin tolerates ${volts(pixel.logicMax)} at most.`
      );
    }
  }

  if (controller.fpsMax != null && controller.fpsMax < input.targetFps) {
    add(
      'info',
      'controller-fps',
      `${name} refreshes at ${n(controller.fpsMax)} fps at most, below the ${n(input.targetFps)} fps target.`
    );
  }
  if (controller.requiresHost) {
    add(
      'info',
      'requires-host',
      `${name} is not standalone hardware: it needs a ${controller.requiresHost}.`
    );
  }
  if (isBoard) {
    add(
      'info',
      'diy-board',
      `${name} is a bare dev board.`,
      'Flash pixel firmware (WLED, FPP, your own), and bring your own power distribution — never power pixels through the board.'
    );
  }
  if (isRetired(controller.status)) {
    add('warning', 'retired', `${name} is discontinued and may be hard to buy.`);
  }
  if (input.outdoor && !isWeatherproof(controller.waterproof)) {
    add(
      'info',
      'outdoor-enclosure',
      `${name} isn't recorded as weatherproof.`,
      'Mount it in a rated enclosure outdoors.'
    );
  }

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    units,
    support,
    supportVia: via,
    level,
    issues,
  };
}

function isWeatherproof(value: string | boolean | null): boolean {
  if (value === true) return true;
  if (typeof value !== 'string') return false;
  const m = value.match(/IP(\d{2})/i);
  return m ? parseInt(m[1], 10) >= 65 : false;
}

// ---------------------------------------------------------------------------
// Level shifter

export interface ShifterFit {
  ok: boolean;
  /** Parts needed to cover every data line of the group */
  qty: number;
  issues: Issue[];
}

/** Data lines a group needs converting: one per string, two when clocked */
export function dataLines(layout: Layout, pixel: PixelOption | null): number {
  return layout.strings * (pixel?.clocked ? 2 : 1);
}

export function evaluateShifter(
  shifter: ShifterOption,
  input: { controller: ControllerOption | null; pixel: PixelOption | null; lines: number }
): ShifterFit {
  const { controller, pixel } = input;
  const issues: Issue[] = [];
  const add = (severity: Severity, code: string, message: string, fix?: string) =>
    issues.push({ severity, code, slot: 'shifter', message, fix });

  const qty = shifter.channels ? Math.ceil(input.lines / shifter.channels) : input.lines;
  if (shifter.channels == null) {
    add('info', 'shifter-channels', `${shifter.name}'s channel count isn't recorded.`);
  }
  if (shifter.differential && !controller?.differential) {
    add(
      'warning',
      'shifter-differential',
      `${shifter.name} is a differential line receiver, not a logic-level buffer.`,
      'It pairs with a controller that has differential (long-range) outputs.'
    );
  }
  const logic = pixel?.logicVoltage ?? 5;
  if (shifter.maxVoltage != null && shifter.maxVoltage < logic - 0.01) {
    add(
      'error',
      'shifter-voltage',
      `${shifter.name} is rated to ${volts(shifter.maxVoltage)}; the pixels' ${volts(logic)} logic is beyond it.`
    );
  }
  if (controller && pixel && levelNeed(controller, pixel) === 'ok') {
    add(
      'info',
      'shifter-unneeded',
      `${controller.name} already sends ${volts(dataVoltage(controller) ?? 5)} data.`,
      'The level shifter is optional here.'
    );
  }
  if (isRetired(shifter.status)) {
    add('warning', 'retired', `${shifter.name} is discontinued and may be hard to buy.`);
  }
  return { ok: !issues.some((i) => i.severity === 'error'), qty, issues };
}

// ---------------------------------------------------------------------------
// Connector

/** IP rating from which a mated connector is treated as outdoor-safe */
export const OUTDOOR_IP = 65;

export interface ConnectorFit {
  ok: boolean;
  /** Conductors the string needs through the connector */
  wires: number;
  /** Same connector the chosen controller's outputs use */
  matchesController: boolean;
  issues: Issue[];
}

/** Conductors between controller and string: V+, GND, data, and clock if clocked */
export function wiresNeeded(pixel: PixelOption | null): number {
  return pixel?.clocked ? 4 : 3;
}

export function evaluateConnector(
  connector: ConnectorOption,
  input: {
    pixel: PixelOption | null;
    voltage: number;
    power: GroupPower | null;
    controller: ControllerOption | null;
    outdoor: boolean;
  }
): ConnectorFit {
  const { pixel, power, voltage } = input;
  const issues: Issue[] = [];
  const add = (severity: Severity, code: string, message: string, fix?: string) =>
    issues.push({ severity, code, slot: 'connector', message, fix });
  const wires = wiresNeeded(pixel);
  const wireList = pixel?.clocked ? 'power, ground, data and clock' : 'power, ground and data';

  if (connector.pinsMax != null && connector.pinsMax < wires) {
    add(
      'error',
      'connector-pins',
      `${connector.name} has ${n(connector.pinsMax)} contact${connector.pinsMax === 1 ? '' : 's'}; a string needs ${wires} (${wireList}).`
    );
  } else if (connector.pinsMin != null && connector.pinsMin > wires) {
    add(
      'info',
      'connector-spare',
      `${connector.name} has at least ${n(connector.pinsMin)} contacts; only ${wires} are needed.`
    );
  }
  if (connector.maxVoltage != null && connector.maxVoltage < voltage) {
    add(
      'error',
      'connector-voltage',
      `${connector.name} is rated ${volts(connector.maxVoltage)}; the pixels run on ${volts(voltage)}.`
    );
  }
  if (power && connector.contactAmps != null && power.longest.feedAmps > connector.contactAmps) {
    add(
      'warning',
      'connector-current',
      `${connector.name}'s contacts are rated ${amps(connector.contactAmps)}; each power feed carries up to ${amps(power.longest.feedAmps)}.`,
      'Lower the amps per feed (more injection points), or run power through a heavier connector.'
    );
  }
  if (input.outdoor && (connector.ip == null || connector.ip < OUTDOOR_IP)) {
    add(
      'warning',
      'connector-ip',
      connector.ipText
        ? `${connector.name} is rated ${connector.ipText}, short of IP${OUTDOOR_IP} for outdoor use.`
        : `${connector.name} has no recorded IP rating for outdoor use.`,
      'Pick a sealed connector or keep the joint inside an enclosure.'
    );
  }
  if (isRetired(connector.status)) {
    add('warning', 'retired', `${connector.name} is discontinued and may be hard to buy.`);
  }

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    wires,
    matchesController:
      !!input.controller?.outputConnector?.id &&
      input.controller.outputConnector.id === connector.id,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Pattern source ↔ controllers

export type SourceLink =
  /** Runs on the controller itself (its firmware) */
  | 'onboard'
  /** Reaches it over a shared control protocol */
  | 'protocol'
  /** The controller's inputs aren't recorded */
  | 'unverified'
  | 'none';

export interface SourceFit {
  ok: boolean;
  /** Protocol tokens shared with every controller that was matched by protocol */
  shared: string[];
  /** How the source reaches each controller, in the order given */
  links: SourceLink[];
  issues: Issue[];
}

/** Does this firmware-style source run on the controller? */
export function runsOn(source: SourceOption, controller: ControllerOption): boolean {
  if (controller.firmwareIds.includes(source.id)) return true;
  if (controller.firmware.some((f) => source.nameKeys.includes(normalizeName(f)))) return true;
  if (controller.kind !== 'board') return false;
  return source.hardware.some((hw) => {
    const key = normalizeName(hw);
    return key.length > 2 && controller.platformTokens.some((t) => t.includes(key));
  });
}

export function evaluateSource(source: SourceOption, controllers: ControllerOption[]): SourceFit {
  const issues: Issue[] = [];
  const links: SourceLink[] = [];
  let shared: string[] | null = null;

  for (const controller of controllers) {
    if (runsOn(source, controller)) {
      links.push('onboard');
      continue;
    }
    if (controller.inputProtocols.length === 0) {
      links.push('unverified');
      issues.push({
        severity: 'info',
        code: 'source-unverified',
        slot: 'source',
        message:
          controller.kind === 'board'
            ? `${controller.name} takes its protocols from the firmware you flash.`
            : `${controller.name}'s input protocols aren't recorded.`,
        fix: `Confirm it accepts ${source.outputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join(' or ') || `data from ${source.name}`}.`,
      });
      continue;
    }
    const common = source.outputProtocols.filter((p) => controller.inputProtocols.includes(p));
    if (common.length === 0) {
      links.push('none');
      issues.push({
        severity: 'error',
        code: 'source-protocol',
        slot: 'source',
        message: `${source.name} can't reach ${controller.name}: it sends ${
          source.outputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join(', ') ||
          'no network protocol'
        }, the controller accepts ${controller.inputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join(', ')}.`,
      });
      continue;
    }
    links.push('protocol');
    shared = shared == null ? common : shared.filter((p) => common.includes(p));
  }

  if (isRetired(source.status)) {
    issues.push({
      severity: 'warning',
      code: 'retired',
      slot: 'source',
      message: `${source.name} is no longer maintained.`,
    });
  }
  return { ok: !issues.some((i) => i.severity === 'error'), shared: shared ?? [], links, issues };
}

/** Standalone playback works only when every controller can play on its own */
export function evaluateStandalone(controllers: ControllerOption[]): Issue[] {
  return controllers
    .filter((c) => !c.standalone)
    .map((c) => ({
      severity: 'error' as const,
      code: 'standalone-unsupported',
      slot: 'source' as const,
      message:
        c.kind === 'board'
          ? `${c.name} only plays on its own once you flash firmware that does (for example WLED).`
          : `${c.name} isn't recorded as able to play patterns without a live source.`,
      fix: 'Pick a pattern source instead of standalone playback.',
    }));
}
