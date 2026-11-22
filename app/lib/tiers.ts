/**
 * Commercial systems' experience tier (commercial-system.json
 * `pricing.tier`): what the buyer gets and how it is sold, like a restaurant
 * guide, not how much it costs. Prices stay numbers (From, Per Pixel).
 */

export const TIERS = ['parts', 'plug-and-play', 'pro-kit', 'full-experience'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABELS: Record<Tier, string> = {
  parts: 'Parts',
  'plug-and-play': 'Plug and play',
  'pro-kit': 'Pro kit',
  'full-experience': 'Full experience',
};

export const TIER_TIP =
  'Parts: pixels for any generic controller; bring your own controller, power and software. ' +
  'Plug and play: a complete kit that works out of the box. ' +
  'Pro kit: pro fixtures run by the maker’s controller over DMX, Art-Net or sACN, bought at a list price. ' +
  'Full experience: a closed system from a pro lighting brand, sold through dealers with design support, often by quote.';

/** Sort position (parts first); null for anything else */
export function tierRank(v: unknown): number | null {
  const i = TIERS.indexOf(v as Tier);
  return i < 0 ? null : i;
}
