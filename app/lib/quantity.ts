/**
 * Physical-quantity parsing for database values.
 *
 * Entry YAML keeps human-friendly strings ("800kHz", "22mA", "3.7-5.5V") —
 * contributors write units, not base-unit integers — but the schema constrains
 * them to a strict grammar (common.json: frequency/current/power/voltage) and
 * this module parses them into SI base numbers for sorting, filtering, and
 * compatibility math. Bare numbers mean the base unit of the field's kind.
 *
 * Grammar: optional `~` (approximate), decimal number, optional space, unit.
 * Voltage additionally allows a `min-max` range ("3-7.5V").
 */

export type QuantityKind = 'frequency' | 'current' | 'power' | 'voltage' | 'memory';

// Multipliers to the SI base unit (Hz, A, W, V, B)
const UNITS: Record<QuantityKind, Record<string, number>> = {
  frequency: { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9 },
  current: { µA: 1e-6, uA: 1e-6, mA: 1e-3, A: 1 },
  power: { mW: 1e-3, W: 1 },
  voltage: { mV: 1e-3, V: 1 },
  memory: { B: 1, kB: 1e3, KB: 1e3, kb: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 },
};

export interface Quantity {
  /** Value in the SI base unit (Hz, A, W, V). For ranges, the minimum. */
  value: number;
  /** Set for voltage ranges like "3-7.5V" */
  max?: number;
  /** True when the source was marked approximate ("~5mA") */
  approx?: boolean;
}

/** Parse a database quantity value (string with unit, or bare base-unit number). */
export function parseQuantity(v: unknown, kind: QuantityKind): Quantity | null {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? { value: v } : null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();

  const units = UNITS[kind];
  const unitPattern = Object.keys(units)
    .map((u) => u.replace('µ', '[µu]'))
    .join('|');

  if (kind === 'voltage') {
    const range = s.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\s?V$/);
    if (range) return { value: parseFloat(range[1]), max: parseFloat(range[2]) };
  }

  const m = s.match(new RegExp(`^(~?)(\\d+(?:\\.\\d+)?)\\s?(${unitPattern})$`));
  if (!m) return null;
  const unit = Object.keys(units).find((u) => u === m[3] || (u === 'µA' && m[3] === 'uA')) ?? m[3];
  const mult = units[unit];
  if (mult == null) return null;
  const q: Quantity = { value: parseFloat(m[2]) * mult };
  if (m[1] === '~') q.approx = true;
  return q;
}

/**
 * Column sortValue factory: normalized base-unit number, or null (sorts last)
 * for unparseable values. Fixes e.g. "30MHz" sorting below "800kHz".
 * `lenient` keeps only the leading token first, so "8MB PSRAM" sorts as 8 MB
 * while "microSD" still falls to the end.
 */
export function quantitySortValue(kind: QuantityKind, lenient = false) {
  return (v: unknown): number | null => {
    const value = lenient && typeof v === 'string' ? v.trim().split(/\s+/)[0] : v;
    return parseQuantity(value, kind)?.value ?? null;
  };
}
