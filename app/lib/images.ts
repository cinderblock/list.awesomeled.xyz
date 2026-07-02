import type { BaseEntry } from './types';

/**
 * First image filename for an entry, handling both bare strings and
 * {file, source, credit} attribution objects (common.json#/definitions/image).
 * Served from /database-images/<category>/<file>.
 */
export function firstImageFile(entry: BaseEntry): string | undefined {
  const pick = (v: unknown): string | undefined => {
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && typeof (v as { file?: string }).file === 'string') {
      return (v as { file: string }).file;
    }
    return undefined;
  };
  const single = pick(entry.image);
  if (single) return single;
  if (Array.isArray(entry.images)) {
    for (const img of entry.images) {
      const f = pick(img);
      if (f) return f;
    }
  }
  return undefined;
}
