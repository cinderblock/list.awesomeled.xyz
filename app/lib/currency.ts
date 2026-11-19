/**
 * Price parsing and currency normalization.
 *
 * Prices in the database are USD unless written as {amount, currency}
 * (see common.json#/definitions/price). Display always keeps the original
 * currency; sorting and range filters compare semi-recent USD equivalents.
 * Ordering only needs to be roughly right, so the rates are checked in and
 * refreshed occasionally rather than fetched live (the site is fully static).
 */

// ECB reference rates → USD (via https://api.frankfurter.dev/v1/latest?base=USD).
// Refresh occasionally; update RATES_AS_OF with them.
export const RATES_AS_OF = '2026-11-18';
export const USD_PER: Record<string, number> = {
  USD: 1,
  EUR: 1.097,
  GBP: 1.317,
  CAD: 0.699,
  AUD: 0.673,
  JPY: 0.00627,
  CNY: 0.15,
  INR: 0.0107,
};

const CODE_TO_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
const SYMBOL_TO_CODE: Record<string, string> = { $: 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY' };

export interface ParsedPrice {
  amount: number;
  /** High end of a street-price range ({amount, max}); `amount` is the low end */
  max?: number;
  currency: string;
}

/**
 * Parse a price value from the database into {amount, currency}.
 * Handles: bare numbers (USD), "$25" / "€25" / "25 EUR" strings, "free",
 * {amount, currency} objects, and {name, price, …} tier objects.
 * Returns null for unpriceable values ("varies", "contact", "unknown", null).
 */
export function parsePrice(v: unknown): ParsedPrice | null {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? { amount: v, currency: 'USD' } : null;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    if (/^free$/i.test(s)) return { amount: 0, currency: 'USD' };
    const m = s.match(/^([$€£¥]?)\s*([\d,]+(?:\.\d+)?)\s*([A-Z]{3})?$/);
    if (!m) return null;
    const amount = parseFloat(m[2].replace(/,/g, ''));
    if (isNaN(amount)) return null;
    return { amount, currency: m[3] ?? SYMBOL_TO_CODE[m[1]] ?? 'USD' };
  }
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    const o = v as { amount?: unknown; max?: unknown; currency?: unknown; price?: unknown };
    if (typeof o.amount === 'number') {
      const currency = typeof o.currency === 'string' ? o.currency : 'USD';
      return typeof o.max === 'number' && o.max > o.amount
        ? { amount: o.amount, max: o.max, currency }
        : { amount: o.amount, currency };
    }
    if (o.price != null) return parsePrice(o.price); // price tier {name, price, …}
  }
  return null;
}

/** USD equivalent for comparison, or null if the currency has no known rate. */
export function toUSD(p: ParsedPrice): number | null {
  const rate = USD_PER[p.currency];
  return rate == null ? null : p.amount * rate;
}

/**
 * Normalized USD value for sorting/filtering. Arrays (price tiers) compare by
 * their cheapest tier.
 */
export function priceUSD(v: unknown): number | null {
  if (Array.isArray(v)) {
    const vals = v.map(priceUSD).filter((n): n is number => n != null);
    return vals.length ? Math.min(...vals) : null;
  }
  const p = parsePrice(v);
  return p ? toUSD(p) : null;
}

/**
 * "€1,500", "$25", "1,500 SEK", "$3–8" (street-price range) — original
 * currency, never converted. `forceCents` renders exactly two decimals (for
 * decimal-aligned columns).
 */
export function formatPriceText(p: ParsedPrice, forceCents = false): string {
  const symbol = CODE_TO_SYMBOL[p.currency];
  // Sub-dollar parts (pixel ICs at volume) need four places: $0.0213, not $0.02
  const fmt = (x: number) =>
    x.toLocaleString(
      'en-US',
      x < 1 && x > 0
        ? { minimumFractionDigits: 2, maximumFractionDigits: 4 }
        : forceCents
          ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
          : undefined
    );
  const n = p.max != null ? `${fmt(p.amount)}–${fmt(p.max)}` : fmt(p.amount);
  return symbol ? `${symbol}${n}` : `${n} ${p.currency}`;
}
