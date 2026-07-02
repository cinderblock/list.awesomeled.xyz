/**
 * Structured platforms (pattern-driver schema): {os, mobile, web, hardware}.
 * Flattening collapses a full desktop-OS set to "All OS" instead of listing
 * every name.
 */

export const ALL_DESKTOP_OS = ['Windows', 'macOS', 'Linux'] as const;

export interface Platforms {
  os?: string[] | null;
  mobile?: string[] | null;
  web?: boolean | null;
  hardware?: string[] | null;
  notes?: string | null;
}

/** Display list for tables/pickers, e.g. ["All OS", "Android", "Web"]. */
export function flattenPlatforms(value: unknown): string[] {
  if (value == null || typeof value !== 'object') return [];
  // Legacy flat arrays pass through untouched
  if (Array.isArray(value)) return value.map(String);

  const p = value as Platforms;
  const out: string[] = [];
  const os = p.os ?? [];
  if (ALL_DESKTOP_OS.every((o) => os.includes(o))) out.push('All OS');
  else out.push(...os);
  out.push(...(p.mobile ?? []));
  if (p.web) out.push('Web');
  out.push(...(p.hardware ?? []));
  return out;
}
