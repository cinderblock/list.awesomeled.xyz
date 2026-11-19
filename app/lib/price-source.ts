/**
 * Price provenance: where and when a price was read
 * (common.json#/definitions/price_source).
 *
 * Flat-price categories carry it as top-level `price_source`; pattern drivers
 * as `pricing.source`; commercial systems per example (`pricing.examples[].source`).
 */

export interface PriceSource {
  /** YYYY-MM-DD, or YYYY-MM when only the month is known */
  retrieved: string;
  vendor?: string;
  part?: string;
  url?: string;
  notes?: string;
}

/** Prices older than this get flagged as possibly out of date. */
export const PRICE_STALE_MONTHS = 12;

export function isPriceSource(v: unknown): v is PriceSource {
  return (
    v != null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    typeof (v as { retrieved?: unknown }).retrieved === 'string'
  );
}

/** The entry-level price source, if recorded. */
export function getPriceSource(entry: Record<string, unknown>): PriceSource | null {
  if (isPriceSource(entry.price_source)) return entry.price_source;
  const pricing = entry.pricing as Record<string, unknown> | null | undefined;
  if (pricing && isPriceSource(pricing.source)) return pricing.source;
  return null;
}

/**
 * Retrieval date as a UTC Date (month-only dates count from the 1st).
 * Null when it cannot be parsed.
 */
export function retrievedDate(retrieved: string): Date | null {
  const m = retrieved.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, m[3] ? Number(m[3]) : 1));
  return isNaN(d.getTime()) ? null : d;
}

/** Whole months between the retrieval date and `now` (epoch ms). */
export function priceAgeMonths(source: PriceSource, now: number): number | null {
  const d = retrievedDate(source.retrieved);
  if (!d) return null;
  return Math.floor((now - d.getTime()) / (30.44 * 86_400_000));
}

/** Discontinued / end-of-life: the recorded price is a last list price, not a live one. */
export function isNoLongerSold(status: unknown): boolean {
  return status === 'discontinued' || status === 'end-of-life';
}

/**
 * True when the price is older than PRICE_STALE_MONTHS. False when `now` is 0
 * (SSR), and for products no longer sold (their price can't be refreshed).
 */
export function isPriceStale(source: PriceSource | null, now: number, status?: unknown): boolean {
  if (!source || now === 0 || isNoLongerSold(status)) return false;
  const age = priceAgeMonths(source, now);
  return age != null && age >= PRICE_STALE_MONTHS;
}

/** "LCSC C155753", "Digi-Key", "manufacturer" — whatever identifies the source. */
export function sourceLabel(source: PriceSource): string | null {
  const label = [source.vendor, source.part].filter(Boolean).join(' ');
  if (label) return label;
  if (source.url) {
    try {
      return new URL(source.url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }
  return null;
}
