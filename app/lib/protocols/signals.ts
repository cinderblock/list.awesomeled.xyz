/**
 * Pure models of the pixel signals the /protocols page animates: which bits
 * a colour becomes, what the line does while they are sent, and where every
 * frame is at a given moment of an animation. No React, no DOM, so the unit
 * tests can hold the pictures to the arithmetic.
 *
 * Times are in nanoseconds unless a name says otherwise.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type Bit = 0 | 1;

/** The eight bits of a byte, most significant first (how pixel data is sent) */
export function byteBitsMsbFirst(value: number): Bit[] {
  const v = Math.max(0, Math.min(255, Math.round(value)));
  return Array.from({ length: 8 }, (_, i) => ((v >> (7 - i)) & 1) as Bit);
}

/** The eight bits of a byte, least significant first (how a UART / DMX512 slot is sent) */
export function byteBitsLsbFirst(value: number): Bit[] {
  return byteBitsMsbFirst(value).reverse();
}

/** Channel letters in the order a part expects them, e.g. "GRB" → ['g', 'r', 'b'] */
export function channelBytes(color: Rgb, order: string): { channel: keyof Rgb; value: number }[] {
  return order
    .toLowerCase()
    .split('')
    .filter((c): c is keyof Rgb => c === 'r' || c === 'g' || c === 'b')
    .map((channel) => ({ channel, value: color[channel] }));
}

export function hex2(value: number): string {
  return Math.round(value).toString(16).toUpperCase().padStart(2, '0');
}

export function rgbCss({ r, g, b }: Rgb): string {
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
}

/** HSV (h in degrees, s and v 0..1) to 8-bit RGB */
export function hsv(h: number, s: number, v: number): Rgb {
  const hh = (((h % 360) + 360) % 360) / 60;
  const c = v * s;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const [r1, g1, b1] =
    hh < 1
      ? [c, x, 0]
      : hh < 2
        ? [x, c, 0]
        : hh < 3
          ? [0, c, x]
          : hh < 4
            ? [0, x, c]
            : hh < 5
              ? [x, 0, c]
              : [c, 0, x];
  const m = v - c;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

// ---------------------------------------------------------------------------
// Single wire: every bit is one high pulse and one low gap; the length of the
// high pulse says which bit it is

export interface PulseTiming {
  /** High time of a 0 bit */
  t0h: number;
  /** High time of a 1 bit */
  t1h: number;
  /** Bit period (high + low) */
  period: number;
}

export interface LevelSegment {
  level: 0 | 1;
  start: number;
  end: number;
}

/** The line level, as runs of high and low, while `bits` are sent back to back */
export function pulseWaveform(bits: Bit[], timing: PulseTiming): LevelSegment[] {
  const out: LevelSegment[] = [];
  bits.forEach((bit, i) => {
    const start = i * timing.period;
    const high = bit ? timing.t1h : timing.t0h;
    out.push({ level: 1, start, end: start + high });
    out.push({ level: 0, start: start + high, end: start + timing.period });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Clock + data: the receiver reads the data line at each rising clock edge,
// so the length of each bit is whatever the sender makes it

export interface FieldBits {
  /** What this run of bits is ("header", "brightness", a colour) */
  field: string;
  bits: Bit[];
}

/**
 * One APA102-style LED frame: three 1 bits that mark the start of a frame, a
 * 5-bit global brightness, then the colour bytes in the order given.
 */
export function apa102LedFrame(color: Rgb, brightness: number, order: string): FieldBits[] {
  const level = Math.max(0, Math.min(31, Math.round(brightness)));
  return [
    { field: 'marker', bits: [1, 1, 1] },
    { field: 'brightness', bits: byteBitsMsbFirst(level).slice(3) },
    ...channelBytes(color, order).map((c) => ({
      field: c.channel,
      bits: byteBitsMsbFirst(c.value),
    })),
  ];
}

/**
 * Durations of `count` clock periods when the sender is irregular: most bits
 * at the nominal period, some stretched (an interrupt, a busy CPU). The
 * pattern is fixed, so the drawing doesn't jump around between renders.
 */
export function irregularPeriods(count: number, nominal: number): number[] {
  const pattern = [1, 1, 1.6, 1, 0.8, 1, 3.2, 1, 1.3, 0.9, 1, 1, 2.1, 1, 0.85, 1.15];
  return Array.from({ length: count }, (_, i) => nominal * pattern[i % pattern.length]);
}

/**
 * How long a string of pixels takes to update, and the frame rate that
 * allows: every pixel's bits, one after another, plus the reset gap.
 */
export function refreshRate(
  pixels: number,
  bitsPerPixel: number,
  bitNs: number,
  resetNs: number
): { frameNs: number; fps: number } {
  const frameNs = pixels * bitsPerPixel * bitNs + resetNs;
  return { frameNs, fps: 1e9 / frameNs };
}

/**
 * Update time and frame rate for an APA102 / SK9822 clocked string:
 * 32-bit start frame, 32 bits per pixel, optional 32-bit SK9822 reset frame,
 * and at least n/2 end clocks. No quiet reset gap is needed between updates.
 */
export function apa102RefreshRate(
  pixels: number,
  clockHz: number,
  withResetFrame = true
): { totalBits: number; frameNs: number; fps: number } {
  const totalBits = 32 + pixels * 32 + (withResetFrame ? 32 : 0) + Math.ceil(pixels / 2);
  const frameNs = (totalBits / clockHz) * 1e9;
  return { totalBits, frameNs, fps: clockHz / totalBits };
}

// ---------------------------------------------------------------------------
// A chain of pixels, as the animations draw it: frames travel along the wire
// at a steady speed, each pixel keeps the first frame that reaches it and lets
// the rest through, and the whole chain shows its new colours together once
// the line has been quiet long enough.

export interface ChainGeometry {
  /** Pixels in the chain */
  pixels: number;
  /** Distance from the controller to pixel 1, and between pixels (px) */
  spacing: number;
  /** Length of one frame on the wire (px) */
  frameLength: number;
  /** How fast frames travel (px per animation second) */
  speed: number;
  /** Animation seconds the line stays quiet before the pixels latch */
  resetSeconds: number;
  /** Animation seconds the new colours are held before the next update starts */
  holdSeconds: number;
}

export interface ChainBlock {
  /** Which pixel (1-based) the frame is for */
  target: number;
  /** Visible extent along the wire (px from the controller) */
  from: number;
  to: number;
}

export interface ChainPhase {
  /** Which update this is (0, 1, 2, …), so colours can change between updates */
  cycle: number;
  /** Seconds since this update started */
  local: number;
  blocks: ChainBlock[];
  /** Per pixel: how much of its own frame has arrived (0..1) */
  received: number[];
  stage: 'sending' | 'reset' | 'latched';
  /** Through the reset gap (0..1); 1 once latched */
  resetProgress: number;
}

/** Position of pixel `k` (1-based) along the wire */
export function pixelX(geo: Pick<ChainGeometry, 'spacing'>, k: number): number {
  return k * geo.spacing;
}

/** Seconds until the last frame has been taken by the last pixel */
export function chainSendSeconds(geo: ChainGeometry): number {
  return (geo.pixels * geo.frameLength + pixelX(geo, geo.pixels)) / geo.speed;
}

/** Seconds one whole update takes: sending, the reset gap, holding the new colours */
export function chainCycleSeconds(geo: ChainGeometry): number {
  return chainSendSeconds(geo) + geo.resetSeconds + geo.holdSeconds;
}

/**
 * Where every frame is `seconds` into the animation. Frames leave the
 * controller back to back; frame k travels until it reaches pixel k, which
 * swallows it, so everything downstream of pixel k only ever sees frames
 * k+1 onwards.
 */
export function chainPhaseAt(geo: ChainGeometry, seconds: number): ChainPhase {
  const cycleLength = chainCycleSeconds(geo);
  const cycle = Math.max(0, Math.floor(seconds / cycleLength));
  const local = seconds - cycle * cycleLength;
  const blocks: ChainBlock[] = [];
  const received: number[] = [];
  for (let k = 1; k <= geo.pixels; k++) {
    const lead = geo.speed * local - (k - 1) * geo.frameLength;
    const trail = lead - geo.frameLength;
    const stop = pixelX(geo, k);
    const from = Math.max(0, trail);
    const to = Math.min(lead, stop);
    if (to > from) blocks.push({ target: k, from, to });
    received.push(Math.max(0, Math.min(1, (lead - stop) / geo.frameLength)));
  }
  const send = chainSendSeconds(geo);
  const stage = local < send ? 'sending' : local < send + geo.resetSeconds ? 'reset' : 'latched';
  const resetProgress =
    stage === 'sending' ? 0 : stage === 'reset' ? (local - send) / geo.resetSeconds : 1;
  return { cycle, local, blocks, received, stage, resetProgress };
}
