#!/usr/bin/env bun
/**
 * Image processing for the database.
 *
 * Removes a solid background using flood-fill from the edges, trims to content,
 * then resizes and encodes as WebP — the project's standard image format
 * (optimized WebP committed under public/database-images/; see
 * docs/datasheet-mirroring.md and CONTRIBUTING.md).
 *
 * Used as a CLI (`bun scripts/crop-image.ts <file...>`) and imported as the
 * single source of truth for image processing by scripts/review-entry-agent.ts.
 */

import { basename, dirname, extname, resolve } from 'path';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import sharp from 'sharp';

// Web-optimization targets (see CONTRIBUTING.md "Image Guidelines")
export const MAX_EDGE = 1200; // px on the longest edge
export const MAX_BYTES = 200 * 1024; // 200KB

/**
 * Process image: remove solid background from edges (if not already transparent), then trim.
 * Returns an encoded PNG (with alpha). SVG/GIF are returned unchanged.
 */
export async function processImage(inputBuffer: Buffer): Promise<Buffer> {
  const image = sharp(inputBuffer);
  const metadata = await image.metadata();

  // Skip SVGs and GIFs (animated)
  if (metadata.format === 'svg' || metadata.format === 'gif') {
    return inputBuffer;
  }

  // Get raw pixel data with alpha
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Sample corners to check transparency and color
  const getPixel = (x: number, y: number) => {
    const idx = (y * width + x) * channels;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2],
      a: data[idx + 3],
    };
  };

  const corners = [
    getPixel(0, 0),
    getPixel(width - 1, 0),
    getPixel(0, height - 1),
    getPixel(width - 1, height - 1),
  ];

  // Check if corners are already transparent
  const isTransparent = (p: { a: number }) => p.a < 128;
  const transparentCorners = corners.filter(isTransparent).length;

  if (transparentCorners >= 3) {
    // Already has transparent background, just trim
    console.log('  Corners already transparent, just trimming...');
    const result = await sharp(inputBuffer).trim({ threshold: 10 }).png().toBuffer();
    return result;
  }

  // Check if corners have solid white/black background
  const isWhitish = (p: { r: number; g: number; b: number }) => p.r > 240 && p.g > 240 && p.b > 240;
  const isBlackish = (p: { r: number; g: number; b: number }) => p.r < 15 && p.g < 15 && p.b < 15;

  const whiteBg = corners.filter(isWhitish).length >= 3;
  const blackBg = corners.filter(isBlackish).length >= 3;

  if (!whiteBg && !blackBg) {
    // No solid background detected, just trim
    console.log('  No solid background detected, just trimming...');
    const result = await sharp(inputBuffer).trim({ threshold: 10 }).png().toBuffer();
    return result;
  }

  const bgColor = whiteBg ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  const tolerance = 30;
  console.log(`  Detected ${whiteBg ? 'white' : 'black'} background, flood-filling from edges...`);

  // Create output buffer with alpha
  const newData = Buffer.from(data);

  // Track visited pixels
  const visited = new Uint8Array(width * height);

  // Check if pixel matches background color
  const matchesBg = (x: number, y: number): boolean => {
    const idx = (y * width + x) * channels;
    const r = data[idx],
      g = data[idx + 1],
      b = data[idx + 2];
    const dist = Math.sqrt(
      Math.pow(r - bgColor.r, 2) + Math.pow(g - bgColor.g, 2) + Math.pow(b - bgColor.b, 2)
    );
    return dist < tolerance;
  };

  // Flood fill from edges using a queue (BFS)
  const queue: [number, number][] = [];

  // Add all edge pixels that match background to queue
  for (let x = 0; x < width; x++) {
    if (matchesBg(x, 0)) queue.push([x, 0]);
    if (matchesBg(x, height - 1)) queue.push([x, height - 1]);
  }
  for (let y = 1; y < height - 1; y++) {
    if (matchesBg(0, y)) queue.push([0, y]);
    if (matchesBg(width - 1, y)) queue.push([width - 1, y]);
  }

  // Process queue
  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const pixelIdx = y * width + x;

    if (visited[pixelIdx]) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (!matchesBg(x, y)) continue;

    visited[pixelIdx] = 1;

    // Make this pixel transparent
    const idx = pixelIdx * channels;
    newData[idx + 3] = 0; // Set alpha to 0

    // Add neighbors
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Create image from modified data and trim
  const result = await sharp(newData, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .trim({ threshold: 10 })
    .toBuffer();

  return result;
}

/**
 * Resize to <= MAX_EDGE and encode as WebP under MAX_BYTES, preserving the
 * alpha channel produced by background removal (WebP keeps transparency, unlike
 * JPEG, and compresses far better than PNG).
 */
export async function optimizeToWebp(inputBuffer: Buffer): Promise<Buffer> {
  const resized = sharp(inputBuffer).resize(MAX_EDGE, MAX_EDGE, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  // Start high-quality; step down only as needed to fit the budget.
  let best = await resized.clone().webp({ quality: 90, alphaQuality: 100, effort: 6 }).toBuffer();
  for (const quality of [80, 70, 60]) {
    if (best.length <= MAX_BYTES) break;
    const candidate = await resized
      .clone()
      .webp({ quality, alphaQuality: 100, effort: 6 })
      .toBuffer();
    if (candidate.length < best.length) best = candidate;
  }

  if (best.length > MAX_BYTES) {
    console.log(
      `  ⚠ Still ${Math.round(best.length / 1024)}KB after optimization (target <${MAX_BYTES / 1024}KB)`
    );
  }
  return best;
}

async function cropImage(imagePath: string): Promise<void> {
  const fullPath = resolve(imagePath);

  if (!existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }

  console.log(`Processing: ${imagePath}`);

  const inputBuffer = readFileSync(fullPath);
  const inputMetadata = await sharp(inputBuffer).metadata();
  console.log(`  Original: ${inputMetadata.width}x${inputMetadata.height} (${inputMetadata.format})`);

  // Leave vector / animated formats untouched.
  if (inputMetadata.format === 'svg' || inputMetadata.format === 'gif') {
    console.log('  Skipping (vector/animated) — left as-is');
    return;
  }

  const cropped = await processImage(inputBuffer);
  const outputBuffer = await optimizeToWebp(cropped);
  const outputMetadata = await sharp(outputBuffer).metadata();
  console.log(
    `  Result: ${outputMetadata.width}x${outputMetadata.height} webp, ${Math.round(outputBuffer.length / 1024)}KB`
  );

  // Always write WebP; remove the original if it had a different extension.
  const webpPath = resolve(dirname(fullPath), `${basename(fullPath, extname(fullPath))}.webp`);
  writeFileSync(webpPath, outputBuffer);
  if (webpPath !== fullPath) {
    rmSync(fullPath);
    console.log(`  ✓ Saved ${basename(webpPath)} (removed ${basename(fullPath)})`);
  } else {
    console.log(`  ✓ Saved ${basename(webpPath)}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: bun scripts/crop-image.ts <image1> [image2] ...');
    console.log('Example: bun scripts/crop-image.ts public/database-images/controllers/baldrick-17.png');
    console.log('Output is always WebP; a differently-named original is removed.');
    process.exit(1);
  }

  for (const imagePath of args) {
    await cropImage(imagePath);
    console.log('');
  }

  console.log('Done!');
}

// Only run the CLI when executed directly, so this module can be imported.
if (import.meta.main) {
  main().catch(console.error);
}
