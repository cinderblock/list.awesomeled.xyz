/**
 * Unit helpers layered on quantity.ts: formatting base-unit numbers back into
 * the friendliest unit ("800 kHz", "22 mA") and recognizing a unit string
 * without being told its kind (for filter text typed by a person or carried in
 * a URL).
 */

import { parseQuantity, type QuantityKind } from './quantity';

// Largest first, so the first unit whose multiplier fits is the display unit.
const DISPLAY_UNITS: Record<QuantityKind, [string, number][]> = {
  frequency: [
    ['GHz', 1e9],
    ['MHz', 1e6],
    ['kHz', 1e3],
    ['Hz', 1],
  ],
  current: [
    ['A', 1],
    ['mA', 1e-3],
    ['µA', 1e-6],
  ],
  power: [
    ['W', 1],
    ['mW', 1e-3],
  ],
  voltage: [
    ['V', 1],
    ['mV', 1e-3],
  ],
  memory: [
    ['TB', 1e12],
    ['GB', 1e9],
    ['MB', 1e6],
    ['kB', 1e3],
    ['B', 1],
  ],
  length: [
    ['m', 1],
    ['mm', 1e-3],
    ['µm', 1e-6],
  ],
};

export const QUANTITY_KINDS = Object.keys(DISPLAY_UNITS) as QuantityKind[];

/** The base unit of a quantity kind ("Hz", "A", "W", "V", "B", "m"). */
export function baseUnit(kind: QuantityKind): string {
  const units = DISPLAY_UNITS[kind];
  return units.find(([, mult]) => mult === 1)![0];
}

// Trim float noise ("0.30000000000000004") without losing real precision.
function trimNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const rounded = Number(n.toPrecision(6));
  return String(rounded);
}

/**
 * Split a base-unit number into a display number and unit: 800000 Hz →
 * {value: 800, unit: "kHz"}. Zero and sub-smallest values use the base /
 * smallest unit.
 */
export function splitQuantity(value: number, kind: QuantityKind): { value: number; unit: string } {
  const units = DISPLAY_UNITS[kind];
  const abs = Math.abs(value);
  if (abs === 0) return { value: 0, unit: baseUnit(kind) };
  for (const [unit, mult] of units) {
    if (abs >= mult) return { value: Number((value / mult).toPrecision(6)), unit };
  }
  const [unit, mult] = units[units.length - 1];
  return { value: Number((value / mult).toPrecision(6)), unit };
}

/**
 * "800 kHz" / "22 mA" / "5 V" from a base-unit number. `compact` drops the
 * space ("800kHz"), the form used in URLs and accepted by parseQuantity.
 */
export function formatQuantity(value: number, kind: QuantityKind, compact = false): string {
  const q = splitQuantity(value, kind);
  return `${trimNumber(q.value)}${compact ? '' : ' '}${q.unit}`;
}

/**
 * Parse text that may carry a unit ("800kHz", "22 mA", "5") into a base-unit
 * number. With `kind`, bare numbers mean that kind's base unit; without it the
 * unit decides the kind (unit names are unique across kinds) and bare numbers
 * are taken as-is.
 */
export function parseNumberWithUnit(text: string, kind?: QuantityKind): number | undefined {
  const s = text.trim().replace(/,/g, '');
  if (s === '') return undefined;
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s);
  const kinds = kind ? [kind] : QUANTITY_KINDS;
  for (const k of kinds) {
    const q = parseQuantity(s, k);
    if (q) return q.value;
  }
  // "$25" style input for price ranges
  const money = s.match(/^\$(\d+\.?\d*|\.\d+)$/);
  if (money) return parseFloat(money[1]);
  return undefined;
}
