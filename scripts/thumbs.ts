/**
 * Thumbnails for database images, derived from the committed originals in
 * public/database-images/<category>/<file> — never committed themselves.
 *
 * - Dev: served on request at /database-thumbs/<size>/<category>/<name>.webp.
 * - Build: emitted into the client bundle at the same paths.
 *
 * Both go through a content-addressed disk cache in
 * node_modules/.cache/database-thumbs, so restarting the dev server (e.g. for
 * every e2e run) or rebuilding doesn't re-encode unchanged images.
 *
 * URLs come from imageUrl() in app/lib/images.ts; sizes from THUMB_SIZES.
 */

import { createHash } from 'crypto';
import { existsSync, readdirSync, statSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join, parse as parsePath } from 'path';
import sharp from 'sharp';
import type { Plugin } from 'vite';
import { THUMB_SIZES, type ThumbSize } from '../app/lib/images';

const SRC_DIR = join('public', 'database-images');
const URL_PREFIX = '/database-thumbs/';
const IMAGE_EXT = /\.(webp|png|jpe?g|avif)$/i;

const ENCODE = { quality: 82, alphaQuality: 90, effort: 5 };

export async function makeThumb(input: Buffer, size: ThumbSize): Promise<Buffer> {
  const edge = THUMB_SIZES[size];
  return sharp(input)
    .resize(edge, edge, { fit: 'inside', withoutEnlargement: true })
    .webp(ENCODE)
    .toBuffer();
}

/** makeThumb through the disk cache (key: source bytes + size + encoder settings). */
async function cachedThumb(root: string, src: string, size: ThumbSize): Promise<Buffer> {
  const input = await readFile(src);
  const key = createHash('sha256')
    .update(input)
    .update(JSON.stringify([THUMB_SIZES[size], ENCODE]))
    .digest('hex')
    .slice(0, 32);
  const dir = join(root, 'node_modules', '.cache', 'database-thumbs');
  const file = join(dir, `${key}.webp`);
  try {
    return await readFile(file);
  } catch {
    const data = await makeThumb(input, size);
    await mkdir(dir, { recursive: true });
    await writeFile(file, data).catch(() => {}); // cache is best-effort
    return data;
  }
}

/** Every source image: [category, filename]. */
function listSources(root: string): [string, string][] {
  const dir = join(root, SRC_DIR);
  if (!existsSync(dir)) return [];
  const out: [string, string][] = [];
  for (const category of readdirSync(dir)) {
    const catDir = join(dir, category);
    if (!statSync(catDir).isDirectory()) continue;
    for (const file of readdirSync(catDir)) if (IMAGE_EXT.test(file)) out.push([category, file]);
  }
  return out;
}

/** Find the source for a thumb request (thumb names are always .webp). */
function findSource(root: string, category: string, name: string): string | undefined {
  const catDir = join(root, SRC_DIR, category);
  if (!existsSync(catDir)) return undefined;
  const hit = readdirSync(catDir).find((f) => IMAGE_EXT.test(f) && parsePath(f).name === name);
  return hit ? join(catDir, hit) : undefined;
}

export function databaseThumbs(): Plugin {
  let root = process.cwd();
  const cache = new Map<string, { mtime: number; data: Buffer }>();

  return {
    name: 'database-thumbs',
    configResolved(config) {
      root = config.root;
    },
    configureServer(server) {
      server.middlewares.use(URL_PREFIX, async (req, res, next) => {
        // req.url is relative to the mount point: /<size>/<category>/<name>.webp
        const m = (req.url ?? '').split('?')[0]!.match(/^\/(\w+)\/([\w-]+)\/([\w.-]+)\.webp$/);
        if (!m || !(m[1]! in THUMB_SIZES)) return next();
        const [, size, category, name] = m as unknown as [string, ThumbSize, string, string];
        const src = findSource(root, category, name);
        if (!src) return next();
        try {
          const mtime = statSync(src).mtimeMs;
          const key = `${size}/${src}`;
          let hit = cache.get(key);
          if (!hit || hit.mtime !== mtime) {
            hit = { mtime, data: await cachedThumb(root, src, size) };
            cache.set(key, hit);
          }
          res.setHeader('Content-Type', 'image/webp');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(hit.data);
        } catch (err) {
          next(err);
        }
      });
    },
    async generateBundle() {
      // Client bundle only (React Router also builds a server environment).
      const envName = (this as unknown as { environment?: { name: string } }).environment?.name;
      if (envName && envName !== 'client') return;
      const sources = listSources(root);
      const sizes = Object.keys(THUMB_SIZES) as ThumbSize[];
      const queue = sources.flatMap(([category, file]) =>
        sizes.map((size) => ({ category, file, size }))
      );
      // Bounded concurrency: sharp is already multi-threaded internally.
      const workers = Array.from({ length: 8 }, async () => {
        for (let job = queue.shift(); job; job = queue.shift()) {
          const src = join(root, SRC_DIR, job.category, job.file);
          this.emitFile({
            type: 'asset',
            fileName: `database-thumbs/${job.size}/${job.category}/${parsePath(job.file).name}.webp`,
            source: await cachedThumb(root, src, job.size),
          });
        }
      });
      await Promise.all(workers);
    },
  };
}
