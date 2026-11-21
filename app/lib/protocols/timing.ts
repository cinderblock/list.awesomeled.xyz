import type { SingleWireTiming, Window } from './reference';

/** The part of every window that all of them share, or null when they don't overlap */
export function intersect(windows: Window[]): Window | null {
  if (windows.length === 0) return null;
  const min = Math.max(...windows.map((w) => w.min));
  const max = Math.min(...windows.map((w) => w.max));
  return min <= max ? { min, max } : null;
}

export interface CommonTiming {
  t0h: Window | null;
  t1h: Window | null;
  t0l: Window | null;
  t1l: Window | null;
  /** A reset that satisfies every part: the longest any of them asks for */
  resetMin: number;
  /** One transmitter setting can satisfy every table */
  ok: boolean;
}

/**
 * What a transmitter must do to meet every datasheet at once: each pulse and
 * gap inside every part's window, and a reset long enough for the slowest.
 */
export function commonTiming(parts: SingleWireTiming[]): CommonTiming {
  const t0h = intersect(parts.map((p) => p.t0h));
  const t1h = intersect(parts.map((p) => p.t1h));
  const t0l = intersect(parts.map((p) => p.t0l));
  const t1l = intersect(parts.map((p) => p.t1l));
  return {
    t0h,
    t1h,
    t0l,
    t1l,
    resetMin: Math.max(...parts.map((p) => p.resetMin)),
    ok: !!(t0h && t1h && t0l && t1l),
  };
}
