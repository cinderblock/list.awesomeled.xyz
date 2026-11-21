import { pixelX, type ChainGeometry } from '~/lib/protocols/signals';

/**
 * Where a chain drawing puts things. Positions are given along the wire
 * ("along", the chain model's coordinate) and across it ("across", negative
 * = the side the LEDs are drawn on in the wide layout). The wide layout runs
 * the wire left to right; the narrow one (phones) runs it top to bottom, so
 * the drawing stays readable instead of shrinking to a sliver.
 */
export interface ChainLayout {
  vertical: boolean;
  width: number;
  height: number;
  /** Along-the-wire position where the wire ends (the last pixel) */
  wireEnd: number;
  /** Thickness of a frame drawn on the wire */
  frameThickness: number;
  /** Across-the-wire offset of the LEDs from their pixel */
  ledOffset: number;
  controller: { x: number; y: number; w: number; h: number };
  resetBar: { x: number; y: number; w: number };
  point(along: number, across: number): { x: number; y: number };
  wire(
    from: number,
    to: number,
    across?: number
  ): { x1: number; y1: number; x2: number; y2: number };
  band(
    from: number,
    to: number,
    across: number,
    thickness: number
  ): { x: number; y: number; width: number; height: number };
}

export function chainLayout(geo: ChainGeometry, narrow: boolean, extraBelow = 0): ChainLayout {
  const wireEnd = pixelX(geo, geo.pixels);
  if (!narrow) {
    const x0 = 96;
    const wireY = 70;
    const point = (along: number, across: number) => ({ x: x0 + along, y: wireY + across });
    return {
      vertical: false,
      width: x0 + wireEnd + 38,
      height: 150 + extraBelow,
      wireEnd,
      frameThickness: 18,
      ledOffset: -42,
      controller: { x: 4, y: wireY - 26, w: 80, h: 52 },
      resetBar: { x: x0, y: wireY + 34, w: wireEnd - 20 },
      point,
      wire: (from, to, across = 0) => ({
        x1: x0 + from,
        y1: wireY + across,
        x2: x0 + to,
        y2: wireY + across,
      }),
      band: (from, to, across, thickness) => ({
        x: x0 + from,
        y: wireY + across - thickness / 2,
        width: Math.max(0, to - from),
        height: thickness,
      }),
    };
  }
  // Phones: the wire runs down the page, squeezed so five pixels fit a screen
  const scale = 0.6;
  const wireX = 104;
  const y0 = 68;
  const point = (along: number, across: number) => ({ x: wireX - across, y: y0 + along * scale });
  const end = y0 + wireEnd * scale;
  return {
    vertical: true,
    width: 250,
    height: end + 74 + extraBelow,
    wireEnd,
    frameThickness: 24,
    ledOffset: -46,
    controller: { x: wireX - 64, y: 8, w: 128, h: 48 },
    resetBar: { x: 16, y: end + 40, w: 218 },
    point,
    wire: (from, to, across = 0) => ({
      x1: wireX - across,
      y1: y0 + from * scale,
      x2: wireX - across,
      y2: y0 + to * scale,
    }),
    band: (from, to, across, thickness) => ({
      x: wireX - across - thickness / 2,
      y: y0 + from * scale,
      width: thickness,
      height: Math.max(0, (to - from) * scale),
    }),
  };
}
