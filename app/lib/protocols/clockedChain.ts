/**
 * A chain of clocked (APA102-style) pixels, as the animation draws it.
 *
 * The controller sends a start frame (32 zero bits), one LED frame per pixel,
 * optionally a "reset frame" (32 more zeros), and end clocks. Every pixel
 * passes the whole stream on, clock and all; while it reads its own LED frame
 * it sends zeros in that frame's place, so the next pixel sees a fresh start
 * frame. Measured by cpldcpu (plans/pixel-protocols/c1-apa102.yaml).
 *
 * When a pixel shows its new colour is where parts differ: the APA102 shows
 * it as soon as its frame is in; the SK9822 only after the next start frame,
 * which is why a shared stream adds the reset frame.
 */

export type ClockedBlockKind = 'start' | 'led' | 'reset' | 'end';

export interface ClockedGeometry {
  pixels: number;
  /** Controller to pixel 1, and between pixels (px) */
  spacing: number;
  /** One 32-bit frame on the wire (px) */
  frameLength: number;
  /** End clocks (px) */
  endLength: number;
  /** Where the wire stops, past the last pixel (px from the controller) */
  wireEnd: number;
  /** px per animation second */
  speed: number;
  /** Seconds the colours are held after the stream has gone by */
  holdSeconds: number;
}

export interface ClockedOptions {
  /** Pixels latch like an SK9822 (on the next start frame) instead of at once */
  sk9822: boolean;
  /** Send 32 more zero bits after the LED frames */
  resetFrame: boolean;
}

export interface ClockedSegment {
  kind: ClockedBlockKind;
  /** LED frames: the pixel (1-based) the frame is for */
  target?: number;
  /** Upstream of its pixel an LED frame carries its colour; downstream it is zeros */
  zeros: boolean;
  from: number;
  to: number;
}

export interface ClockedPhase {
  cycle: number;
  local: number;
  segments: ClockedSegment[];
  /** Per pixel: how much of its own LED frame it has read (0..1) */
  received: number[];
  /**
   * Per pixel: which update's colours it shows: this cycle's, the previous
   * one's, or the one before (an SK9822 without a reset frame runs a cycle late)
   */
  showing: number[];
}

interface Block {
  kind: ClockedBlockKind;
  target?: number;
  offset: number;
  length: number;
}

function blocks(geo: ClockedGeometry, opts: ClockedOptions): Block[] {
  const out: Block[] = [];
  let offset = 0;
  const push = (kind: ClockedBlockKind, length: number, target?: number) => {
    out.push({ kind, target, offset, length });
    offset += length;
  };
  push('start', geo.frameLength);
  for (let k = 1; k <= geo.pixels; k++) push('led', geo.frameLength, k);
  if (opts.resetFrame) push('reset', geo.frameLength);
  push('end', geo.endLength);
  return out;
}

export function clockedPixelX(geo: ClockedGeometry, k: number): number {
  return k * geo.spacing;
}

/** Seconds from the start of an update until its last block has left the wire */
export function clockedSendSeconds(geo: ClockedGeometry, opts: ClockedOptions): number {
  const all = blocks(geo, opts);
  const last = all[all.length - 1];
  return (last.offset + last.length + geo.wireEnd) / geo.speed;
}

export function clockedCycleSeconds(geo: ClockedGeometry, opts: ClockedOptions): number {
  return clockedSendSeconds(geo, opts) + geo.holdSeconds;
}

export function clockedPhaseAt(
  geo: ClockedGeometry,
  opts: ClockedOptions,
  seconds: number
): ClockedPhase {
  const cycleLength = clockedCycleSeconds(geo, opts);
  const cycle = Math.max(0, Math.floor(seconds / cycleLength));
  const local = seconds - cycle * cycleLength;
  const all = blocks(geo, opts);
  const lead = (b: Block) => geo.speed * local - b.offset;

  const segments: ClockedSegment[] = [];
  for (const b of all) {
    const front = lead(b);
    const from = Math.max(0, front - b.length);
    const to = Math.min(geo.wireEnd, front);
    if (to <= from) continue;
    if (b.kind === 'led' && b.target != null) {
      // Its colour up to its pixel, zeros after it
      const at = clockedPixelX(geo, b.target);
      if (from < at) {
        segments.push({ kind: 'led', target: b.target, zeros: false, from, to: Math.min(to, at) });
      }
      if (to > at) {
        segments.push({ kind: 'led', target: b.target, zeros: true, from: Math.max(from, at), to });
      }
    } else {
      segments.push({ kind: b.kind, zeros: b.kind !== 'end', from, to });
    }
  }

  const received: number[] = [];
  const showing: number[] = [];
  const reset = all.find((b) => b.kind === 'reset');
  for (let k = 1; k <= geo.pixels; k++) {
    const at = clockedPixelX(geo, k);
    const frame = all.find((b) => b.kind === 'led' && b.target === k)!;
    const got = Math.max(0, Math.min(1, (lead(frame) - at) / frame.length));
    received.push(got);
    if (!opts.sk9822) {
      // APA102: shows its frame as soon as it has read it
      showing.push(got >= 1 ? cycle : cycle - 1);
    } else if (reset) {
      // SK9822 with a reset frame: it shows this update once the reset frame
      // (32 zeros, a start frame to it) has gone past
      showing.push(lead(reset) - at >= reset.length ? cycle : cycle - 1);
    } else {
      // SK9822 without one: only the next update's start frame releases what
      // it read, so it always shows the update before
      const start = all[0];
      showing.push(lead(start) - at >= start.length ? cycle - 1 : cycle - 2);
    }
  }
  return { cycle, local, segments, received, showing };
}
