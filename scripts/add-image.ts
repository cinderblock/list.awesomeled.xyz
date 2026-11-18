#!/usr/bin/env bun
/**
 * Add (or replace) a product image on a database entry, with attribution.
 *
 *   bun run add-image <category>/<id> <image-url | page-url | local-file> \
 *       --source <page-url> --credit "<owner>" [--license "CC BY 2.0"] \
 *       [--file <name.webp>] [--keep-bg] [--primary] [--preview-dir <dir>]
 *
 *   bun run add-image <category>/<id> --attribute-only --source <url> --credit "<owner>" \
 *       [--license …] [--file <name.webp>]
 *     Attach attribution to an image file that's already committed (legacy bare
 *     `image: foo.webp`) without re-processing it.
 *
 * - A page URL (HTML) is resolved to its og:image / twitter:image, and becomes
 *   the default --source.
 * - The image goes through scripts/crop-image.ts (edge-flood background removal
 *   + trim, unless --keep-bg) and is written as optimized WebP to
 *   public/database-images/<category>/<file> (default <id>.webp).
 * - The entry's YAML gets an `images:` entry in the {file, source, credit,
 *   license?} object form. A legacy bare `image:`/`images:` string for the same
 *   file is converted in place; other images are kept (the new one is appended,
 *   or moved first with --primary).
 * - A PNG preview composited over a checkerboard is written to --preview-dir
 *   (default: <os tmp>/awesomeled-image-previews) so the crop can be eyeballed.
 *
 * Policy (plans/assets.md, CONTRIBUTING.md): only the maker's / an authorized
 * vendor's own product photo, or an openly licensed one. Set --license only when
 * a license is actually stated.
 */

import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import sharp from 'sharp';
import { parse } from 'yaml';
import { optimizeToWebp, processImage } from './crop-image';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

// Root keys that eslint (yml/sort-keys) pins before the alphabetical rest.
const FIXED_PREFIX = [
  'name',
  'status',
  'release_year',
  'creator',
  'developer',
  'manufacturers',
  'vendors',
  'notes',
  'inputs',
  'outputs',
  'power',
];

export interface ImageObject {
  file: string;
  source?: string;
  credit?: string;
  license?: string;
}

interface Args {
  target: string;
  input: string;
  source?: string;
  credit?: string;
  license?: string;
  file?: string;
  keepBg: boolean;
  attributeOnly: boolean;
  primary: boolean;
  previewDir: string;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (key === 'keep-bg' || key === 'primary' || key === 'attribute-only') flags[key] = true;
      else flags[key] = argv[++i] ?? '';
    } else positional.push(a);
  }
  const attributeOnly = !!flags['attribute-only'];
  if (positional.length !== (attributeOnly ? 1 : 2)) {
    console.error(
      'Usage: bun run add-image <category>/<id> <image-url|page-url|file> --source <url> --credit <owner> [--license <spdx-ish>] [--file <name.webp>] [--keep-bg] [--primary]'
    );
    process.exit(1);
  }
  return {
    target: positional[0]!,
    input: positional[1] ?? '',
    source: flags.source as string | undefined,
    credit: flags.credit as string | undefined,
    license: flags.license as string | undefined,
    file: flags.file as string | undefined,
    keepBg: !!flags['keep-bg'],
    attributeOnly,
    primary: !!flags.primary,
    previewDir: (flags['preview-dir'] as string) || join(tmpdir(), 'awesomeled-image-previews'),
  };
}

function extractPageImage(html: string, base: string): string | undefined {
  const meta = (prop: string) => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`,
      'i'
    );
    const m = html.match(re);
    return m ? (m[1] ?? m[2]) : undefined;
  };
  const found =
    meta('og:image:secure_url') ?? meta('og:image') ?? meta('twitter:image') ?? undefined;
  if (!found) return undefined;
  return new URL(found.replace(/&amp;/g, '&'), base).toString();
}

async function fetchBytes(url: string): Promise<{ bytes: Buffer; type: string; url: string }> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': UA, Accept: '*/*' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return {
    bytes: Buffer.from(await res.arrayBuffer()),
    type: res.headers.get('content-type') ?? '',
    url: res.url,
  };
}

/** Load the input as image bytes; HTML pages resolve to their social-preview image. */
async function loadInput(input: string): Promise<{ bytes: Buffer; page?: string; from: string }> {
  if (!/^https?:\/\//.test(input)) {
    return { bytes: readFileSync(resolve(input)), from: resolve(input) };
  }
  const first = await fetchBytes(input);
  if (first.type.includes('html')) {
    const img = extractPageImage(first.bytes.toString('utf-8'), first.url);
    if (!img) throw new Error(`No og:image/twitter:image on ${input}; pass the image URL instead`);
    const second = await fetchBytes(img);
    return { bytes: second.bytes, page: input, from: img };
  }
  return { bytes: first.bytes, from: input };
}

/** Split a YAML file into root-level blocks: [key | null (preamble), lines]. */
function rootBlocks(text: string): { key: string | null; lines: string[] }[] {
  const blocks: { key: string | null; lines: string[] }[] = [{ key: null, lines: [] }];
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*):(\s|$)/);
    if (m) blocks.push({ key: m[1]!, lines: [line] });
    else blocks[blocks.length - 1]!.lines.push(line);
  }
  return blocks;
}

function yamlScalar(v: string): string {
  // Quote anything YAML might misread; plain otherwise (prettier normalizes quotes).
  if (/^[\w./:@()+,&' -]+$/.test(v) && !/^[\s'"&*!|>%@`-]|: | #|:$/.test(v) && !/^\d/.test(v)) {
    return v;
  }
  return `'${v.replace(/'/g, "''")}'`;
}

export function renderImagesBlock(images: (string | ImageObject)[]): string[] {
  const out = ['images:'];
  for (const img of images) {
    if (typeof img === 'string') {
      out.push(`  - ${yamlScalar(img)}`);
      continue;
    }
    out.push(`  - file: ${yamlScalar(img.file)}`);
    if (img.source) out.push(`    source: ${img.source}`);
    if (img.credit) out.push(`    credit: ${yamlScalar(img.credit)}`);
    if (img.license) out.push(`    license: ${yamlScalar(img.license)}`);
  }
  return out;
}

/**
 * Rewrite an entry's YAML text so its images are exactly `images` (object or
 * string form), replacing any `image:`/`images:` root keys, inserted at the
 * alphabetical position eslint's yml/sort-keys expects.
 */
export function setEntryImages(text: string, images: (string | ImageObject)[]): string {
  const blocks = rootBlocks(text).filter((b) => b.key !== 'image' && b.key !== 'images');
  const block = { key: 'images', lines: renderImagesBlock(images) };
  let at = blocks.length;
  for (let i = 1; i < blocks.length; i++) {
    const k = blocks[i]!.key!;
    if (FIXED_PREFIX.includes(k)) continue;
    if (k > 'images') {
      at = i;
      break;
    }
  }
  // Keep a trailing newline on the file when appending at the end.
  if (at === blocks.length) {
    const last = blocks[blocks.length - 1]!;
    while (last.lines.length > 1 && last.lines[last.lines.length - 1] === '') last.lines.pop();
    blocks.push({ key: 'images', lines: [...block.lines, ''] });
  } else {
    blocks.splice(at, 0, block);
  }
  return blocks.flatMap((b) => b.lines).join('\n');
}

function currentImages(data: Record<string, unknown>): (string | ImageObject)[] {
  const out: (string | ImageObject)[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string') out.push(v);
    else if (v && typeof v === 'object' && typeof (v as ImageObject).file === 'string')
      out.push(v as ImageObject);
  };
  push(data.image);
  if (Array.isArray(data.images)) data.images.forEach(push);
  // De-duplicate by file (image + images often repeat the same file)
  const seen = new Set<string>();
  return out.filter((i) => {
    const f = typeof i === 'string' ? i : i.file;
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });
}

async function writePreview(webp: Buffer, path: string) {
  const meta = await sharp(webp).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const cell = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><pattern id="c" width="${cell * 2}" height="${cell * 2}" patternUnits="userSpaceOnUse"><rect width="${cell * 2}" height="${cell * 2}" fill="#9a9a9a"/><rect width="${cell}" height="${cell}" fill="#6a6a6a"/><rect x="${cell}" y="${cell}" width="${cell}" height="${cell}" fill="#6a6a6a"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`;
  await sharp(Buffer.from(svg))
    .composite([{ input: webp }])
    .png()
    .toFile(path);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const [category, id] = args.target.split('/');
  if (!category || !id) throw new Error(`Target must be <category>/<id>, got ${args.target}`);
  const yamlPath = join('database', category, `${id}.yaml`);
  if (!existsSync(yamlPath)) throw new Error(`No such entry: ${yamlPath}`);

  const file = args.file ?? `${id}.webp`;
  if (!file.endsWith('.webp')) throw new Error('--file must end in .webp');
  const outDir = join('public', 'database-images', category);
  let source = args.source;

  if (args.attributeOnly) {
    if (!existsSync(join(outDir, file))) throw new Error(`No existing ${join(outDir, file)}`);
  } else {
    const { bytes, page, from } = await loadInput(args.input);
    source ??= page;
    const meta = await sharp(bytes).metadata();
    console.log(`Fetched ${from}
  ${meta.width}x${meta.height} ${meta.format}`);
    const processed = args.keepBg
      ? await sharp(bytes).rotate().trim({ threshold: 10 }).png().toBuffer()
      : await processImage(bytes);
    const webp = await optimizeToWebp(processed);
    const outMeta = await sharp(webp).metadata();
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, file), webp);
    console.log(
      `  -> ${join(outDir, file)} ${outMeta.width}x${outMeta.height}, ${Math.round(webp.length / 1024)} KB`
    );
    mkdirSync(args.previewDir, { recursive: true });
    const previewPath = join(args.previewDir, `${category}--${file.replace(/\.webp$/, '')}.png`);
    await writePreview(webp, previewPath);
    console.log(`  preview: ${previewPath}`);
  }
  if (!source) throw new Error('--source <page url> is required (attribution)');
  if (!args.credit) throw new Error('--credit "<owner>" is required (attribution)');

  const text = readFileSync(yamlPath, 'utf-8');
  const data = (parse(text) ?? {}) as Record<string, unknown>;
  const entry: ImageObject = { file, source, credit: args.credit };
  if (args.license) entry.license = args.license;
  const existing = currentImages(data).filter((i) => (typeof i === 'string' ? i : i.file) !== file);
  const images = args.primary ? [entry, ...existing] : [...existing, entry];
  // A replaced file keeps its original position
  const idx = currentImages(data).findIndex((i) => (typeof i === 'string' ? i : i.file) === file);
  if (idx >= 0 && !args.primary) {
    images.splice(images.indexOf(entry), 1);
    images.splice(idx, 0, entry);
  }
  writeFileSync(yamlPath, setEntryImages(text, images));
  console.log(`  updated ${yamlPath}`);

  const fmt = spawnSync('bunx', ['prettier', '--write', '--log-level', 'warn', yamlPath], {
    shell: process.platform === 'win32',
    encoding: 'utf-8',
  });
  if (fmt.status !== 0) console.warn(fmt.stderr);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
