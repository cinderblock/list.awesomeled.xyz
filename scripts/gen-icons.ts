/**
 * Regenerate the site icon set from the vector mark in scripts/icon-art.ts.
 *
 * Emits:
 *   - public/icon.svg              — scalable favicon (crisp at any size)
 *   - public/apple-touch-icon.png  — iOS home screen (180, opaque white)
 *   - public/icon-192.png / -512   — PWA manifest / Android (opaque white)
 * Rendering everything from the shared geometry keeps each size pixel-perfect
 * (no upscaling a 48px source). Dependency-free — see scripts/png.ts.
 *
 * Run: bun scripts/gen-icons.ts
 */
import fs from 'fs';
import { encodePNG } from './png';
import { raster, svg } from './icon-art';

const WHITE: [number, number, number] = [255, 255, 255];

fs.writeFileSync('public/icon.svg', svg());
console.log('wrote public/icon.svg');

for (const [name, size] of [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
] as const) {
  const px = raster(size, { pad: 0.14, bg: WHITE });
  fs.writeFileSync(`public/${name}`, encodePNG(size, size, px));
  console.log(`wrote public/${name} (${size}x${size})`);
}
