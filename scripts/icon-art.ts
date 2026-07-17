/**
 * Vector geometry for the Awesome LED List mark, reconstructed from the
 * original 48px favicon: three black nodes plus a red zig-zag connector
 * (a round-joined stroke through three points). Defined once here and used to
 * emit both a crisp scalable `icon.svg` and sharply anti-aliased PNG rasters,
 * so every icon size stays pixel-perfect (no upscaling a 48px source).
 *
 * Art coordinate space matches the favicon's 48×48 grid.
 */

export const BLACK = '#000000';
export const RED = '#c00000';

const R = 4.5; // node / stroke radius (⌀9, from the favicon)
const NODES: [number, number][] = [
  [3.9, 32.1], // bottom-left
  [43.1, 32.1], // bottom-right
  [14.1, 23.3], // mid-left
];
const RED_PATH: [number, number][] = [
  [24, 14.5], // top
  [33, 23.5], // middle (kink toward the right)
  [24, 32], // bottom
];

function bbox() {
  let minx = Infinity,
    miny = Infinity,
    maxx = -Infinity,
    maxy = -Infinity;
  for (const [x, y] of [...NODES, ...RED_PATH]) {
    minx = Math.min(minx, x - R);
    miny = Math.min(miny, y - R);
    maxx = Math.max(maxx, x + R);
    maxy = Math.max(maxy, y + R);
  }
  return { minx, miny, maxx, maxy, w: maxx - minx, h: maxy - miny };
}

// Map art coords into a size×size canvas, centred, with `pad` fraction margin.
function fit(size: number, pad: number) {
  const b = bbox();
  const s = (size * (1 - 2 * pad)) / Math.max(b.w, b.h);
  return {
    s,
    tx: (size - b.w * s) / 2 - b.minx * s,
    ty: (size - b.h * s) / 2 - b.miny * s,
  };
}

/** Scalable SVG mark (transparent background). */
export function svg(size = 48, pad = 0.06): string {
  const { s, tx, ty } = fit(size, pad);
  const m = ([x, y]: [number, number]) => `${(tx + x * s).toFixed(2)} ${(ty + y * s).toFixed(2)}`;
  const r = (R * s).toFixed(2);
  const circles = NODES.map(
    (n) =>
      `<circle cx="${(tx + n[0] * s).toFixed(2)}" cy="${(ty + n[1] * s).toFixed(2)}" r="${r}" fill="${BLACK}"/>`
  ).join('');
  const d = `M ${m(RED_PATH[0])} L ${m(RED_PATH[1])} L ${m(RED_PATH[2])}`;
  const stroke = `<path d="${d}" fill="none" stroke="${RED}" stroke-width="${(R * 2 * s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${circles}${stroke}</svg>`;
}

function distToSeg(px: number, py: number, a: [number, number], b: [number, number]): number {
  const vx = b[0] - a[0],
    vy = b[1] - a[1];
  const wx = px - a[0],
    wy = py - a[1];
  const len2 = vx * vx + vy * vy;
  let t = len2 ? (wx * vx + wy * vy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (a[0] + t * vx),
    dy = py - (a[1] + t * vy);
  return Math.hypot(dx, dy);
}

/**
 * Anti-aliased RGBA raster of the mark at size×size.
 * `bg` = flatten onto this opaque colour (for app icons); omit for transparent.
 */
export function raster(
  size: number,
  { pad = 0.12, bg }: { pad?: number; bg?: [number, number, number] } = {}
): Uint8Array {
  const { s, tx, ty } = fit(size, pad);
  const SS = 4; // supersampling
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rr = 0,
        gg = 0,
        bb = 0,
        aa = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          // sub-pixel centre → art space
          const ax = (x + (sx + 0.5) / SS - tx) / s;
          const ay = (y + (sy + 0.5) / SS - ty) / s;
          let col: [number, number, number] | null = null;
          // red stroke on top of black nodes (they don't overlap anyway)
          if (
            distToSeg(ax, ay, RED_PATH[0], RED_PATH[1]) <= R ||
            distToSeg(ax, ay, RED_PATH[1], RED_PATH[2]) <= R
          ) {
            col = [0xc0, 0x00, 0x00];
          } else if (NODES.some(([nx, ny]) => Math.hypot(ax - nx, ay - ny) <= R)) {
            col = [0, 0, 0];
          }
          if (col) {
            rr += col[0];
            gg += col[1];
            bb += col[2];
            aa += 255;
          }
        }
      }
      const n = SS * SS;
      const cov = aa / (n * 255);
      const di = (y * size + x) * 4;
      if (bg) {
        out[di] = Math.round(rr / n + bg[0] * (1 - cov));
        out[di + 1] = Math.round(gg / n + bg[1] * (1 - cov));
        out[di + 2] = Math.round(bb / n + bg[2] * (1 - cov));
        out[di + 3] = 255;
      } else {
        // straight (un-premultiplied) alpha
        out[di] = cov ? Math.round((rr / aa) * 255) : 0;
        out[di + 1] = cov ? Math.round((gg / aa) * 255) : 0;
        out[di + 2] = cov ? Math.round((bb / aa) * 255) : 0;
        out[di + 3] = Math.round(cov * 255);
      }
    }
  }
  return out;
}
