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
  BRL: 0.172,
};

const CODE_TO_SYMBOL: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
const SYMBOL_TO_CODE: Record<string, string> = { $: 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY' };

export interface ParsedPrice {
  amount: number;
  /** High end of a range ({amount, max}, "€299-799"); `amount` is the low end */
  max?: number;
  /** "330+": a starting price, more for bigger editions */
  from?: boolean;
  currency: string;
}

// One money amount: optional symbol, number with thousands commas, or "free"
const AMOUNT = String.raw`(free|foss|[$€£¥]?\s*[\d,]+(?:\.\d+)?)`;
const SINGLE = new RegExp(String.raw`^${AMOUNT}\s*([A-Z]{3})?(\+)?$`, 'i');
const RANGE = new RegExp(String.raw`^${AMOUNT}\s*[-–]\s*${AMOUNT}\s*([A-Z]{3})?$`, 'i');

function amountOf(token: string): { amount: number; symbol: string } | null {
  if (/^(free|foss)$/i.test(token)) return { amount: 0, symbol: '' };
  const m = token.match(/^([$€£¥]?)\s*([\d,]+(?:\.\d+)?)$/);
  if (!m) return null;
  const amount = parseFloat(m[2].replace(/,/g, ''));
  return isNaN(amount) ? null : { amount, symbol: m[1] };
}

/**
 * Parse a price value from the database into {amount, currency}.
 * Handles: bare numbers (USD), "$25" / "€25" / "25 EUR" strings, "free" /
 * "FOSS", ranges ("€299-799", "Free - $399", "125 - 450"), starting prices
 * ("330+"), {amount, max?, currency} objects, and {name, price, …} tier
 * objects. Returns null for unpriceable values ("varies", "contact",
 * "unknown", free text, null).
 */
export function parsePrice(v: unknown): ParsedPrice | null {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? { amount: v, currency: 'USD' } : null;
  }
  if (typeof v === 'string') {
    const s = v.trim();
    const single = s.match(SINGLE);
    if (single) {
      const a = amountOf(single[1]);
      if (!a) return null;
      const currency = single[2]?.toUpperCase() ?? SYMBOL_TO_CODE[a.symbol] ?? 'USD';
      return single[3]
        ? { amount: a.amount, from: true, currency }
        : { amount: a.amount, currency };
    }
    const range = s.match(RANGE);
    if (range) {
      const lo = amountOf(range[1]);
      const hi = amountOf(range[2]);
      if (!lo || !hi || hi.amount <= lo.amount) return null;
      const currency =
        range[3]?.toUpperCase() ?? SYMBOL_TO_CODE[lo.symbol] ?? SYMBOL_TO_CODE[hi.symbol] ?? 'USD';
      return { amount: lo.amount, max: hi.amount, currency };
    }
    return null;
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
 * "€1,500", "$25", "1,500 SEK", "$3–8" (range), "Free–$399", "$330+" —
 * original currency, never converted. `forceCents` renders exactly two
 * decimals (for decimal-aligned columns).
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
  const money = (x: number) => (symbol ? `${symbol}${fmt(x)}` : `${fmt(x)} ${p.currency}`);
  if (p.max != null) {
    if (p.amount === 0) return `Free–${money(p.max)}`;
    return symbol
      ? `${symbol}${fmt(p.amount)}–${fmt(p.max)}`
      : `${fmt(p.amount)}–${fmt(p.max)} ${p.currency}`;
  }
  if (p.amount === 0) return 'Free';
  return p.from ? `${money(p.amount)}+` : money(p.amount);
}

/**
 * Cheapest published price per pixel, in USD, across a commercial system's
 * `pricing.examples` that say how many pixels they buy. Null when no example
 * has both a parseable price and a pixel count (quote-only systems).
 */
export function perPixelUSD(pricing: unknown): number | null {
  const examples = (pricing as { examples?: unknown } | null | undefined)?.examples;
  if (!Array.isArray(examples)) return null;
  let best: number | null = null;
  for (const ex of examples) {
    const { price, pixels } = (ex ?? {}) as { price?: unknown; pixels?: unknown };
    if (typeof pixels !== 'number' || pixels <= 0) continue;
    const usd = priceUSD(price);
    if (usd == null || usd <= 0) continue;
    const per = usd / pixels;
    if (best == null || per < best) best = per;
  }
  return best;
}
