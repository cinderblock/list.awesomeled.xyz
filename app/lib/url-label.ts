/**
 * Short text for a link: where it goes rather than its whole address.
 *
 * A full URL in a third-width card breaks every few characters down eight
 * lines. The host says whose page it is, and the last part of the path tells
 * two links to the same site apart (a datasheet's file name, a repository).
 */

const TAIL_LIMIT = 32;
// Page-file extensions that say nothing; document extensions (.pdf, .zip) stay
const PAGE_EXTENSION = /\.(html?|php|aspx?|jsp)$/i;
// Path endings that are the same on every site
const GENERIC_TAIL = /^(index|home|default|products?|detail|details|view|en|en-us)$/i;

export function urlLabel(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  const host = parsed.hostname.replace(/^www\./, '');
  const segments = parsed.pathname.split('/').filter(Boolean);
  let tail = segments.at(-1) ?? '';
  try {
    tail = decodeURIComponent(tail);
  } catch {
    // keep the raw segment
  }
  tail = tail.replace(PAGE_EXTENSION, '');
  if (!tail || GENERIC_TAIL.test(tail)) return host;
  if (tail.length > TAIL_LIMIT) tail = `${tail.slice(0, TAIL_LIMIT - 1)}…`;
  return `${host} › ${tail}`;
}

// A record made of these and nothing else is "a link with a few words about it"
const LINK_RECORD_KEYS = new Set(['url', 'page', 'name', 'title', 'label', 'host', 'notes']);

export interface LinkRecordValue {
  href: string;
  /** The record's own name; the link's short label when it has none */
  name?: string;
  /** What kind of place the link is ("manufacturer", "mirror") */
  host?: string;
  notes?: string;
}

/**
 * Recognise records like a datasheet's alternate sources ({url, host, notes})
 * or a vendor ({name, page}). Shown key by key they become a nested grid three
 * levels deep with the URL broken down a 90px column; they read as one line.
 */
export function asLinkRecord(value: unknown): LinkRecordValue | null {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value instanceof Date) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).filter((key) => record[key] != null);
  if (!keys.every((key) => LINK_RECORD_KEYS.has(key) && typeof record[key] === 'string')) {
    return null;
  }
  const text = (key: string) => record[key] as string | undefined;
  const href = [text('page'), text('url')].find((v) => v && /^https?:\/\//.test(v));
  if (!href) return null;
  return {
    href,
    name: text('name') ?? text('title') ?? text('label'),
    host: text('host'),
    notes: text('notes'),
  };
}
