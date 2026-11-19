import type { BaseEntry } from './types';

/**
 * Entry images: committed WebP originals under public/database-images/<category>/
 * (≤1200 px, see scripts/crop-image.ts), plus thumbnails derived at build time
 * (dev: on request) by the database-thumbs Vite plugin (scripts/thumbs.ts).
 */

/** Thumbnail sizes: longest edge in px. `sm` for table/designer chips, `md` for hover previews. */
export const THUMB_SIZES = { sm: 240, md: 480 } as const;
export type ThumbSize = keyof typeof THUMB_SIZES;
export type ImageSize = ThumbSize | 'full';

/** Public URL of an entry image (full original, or a derived thumbnail). */
export function imageUrl(category: string, file: string, size: ImageSize = 'full'): string {
  if (size === 'full') return `/database-images/${category}/${file}`;
  return `/database-thumbs/${size}/${category}/${file.replace(/\.[^.]+$/, '')}.webp`;
}

export interface EntryImage {
  file: string;
  source?: string;
  credit?: string;
  license?: string;
}

/**
 * All images of an entry, in order, handling both bare filename strings and
 * {file, source, credit, license} attribution objects
 * (common.json#/definitions/image). `image` and `images` repeats are merged.
 */
export function entryImages(entry: Record<string, unknown>): EntryImage[] {
  const out: EntryImage[] = [];
  const seen = new Set<string>();
  const push = (v: unknown) => {
    let img: EntryImage | null = null;
    if (typeof v === 'string') img = { file: v };
    else if (v && typeof v === 'object' && typeof (v as EntryImage).file === 'string') {
      const { file, source, credit, license } = v as EntryImage;
      img = { file, source, credit, license };
    }
    if (img && !seen.has(img.file)) {
      seen.add(img.file);
      out.push(img);
    }
  };
  push(entry.image);
  if (Array.isArray(entry.images)) for (const img of entry.images) push(img);
  return out;
}

/** First image filename for an entry (served from /database-images/<category>/<file>). */
export function firstImageFile(entry: BaseEntry): string | undefined {
  return entryImages(entry as Record<string, unknown>)[0]?.file;
}

/**
 * Link for a license string, for the common Creative Commons / public-domain
 * forms ("CC BY 2.0", "CC BY-SA 4.0", "CC0"). Unknown strings get no link.
 */
export function licenseUrl(license: string): string | undefined {
  const s = license.trim();
  if (/^CC0\b/i.test(s)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (/^(public domain|PD)\b/i.test(s)) return 'https://creativecommons.org/publicdomain/mark/1.0/';
  const m = s.match(/^CC[ -](BY(?:-(?:NC|SA|ND))*)[ -]?(\d\.\d)/i);
  if (m) return `https://creativecommons.org/licenses/${m[1]!.toLowerCase()}/${m[2]}/`;
  return undefined;
}
