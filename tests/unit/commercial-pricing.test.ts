import { describe, expect, test } from 'bun:test';
import { fromUSD, perPixelUSD, USD_PER } from '../../app/lib/currency';
import { TIERS, TIER_LABELS, tierRank } from '../../app/lib/tiers';

describe('fromUSD', () => {
  test('the cheapest price point, whatever it buys', () => {
    const pricing = {
      examples: [
        { item: '25-bulb string', pixels: 25, price: 190 },
        { item: 'Mini string', pixels: 25, price: 124 },
        { item: 'Controller', price: 99 },
      ],
    };
    expect(fromUSD(pricing)).toBe(99);
    // Per pixel only counts examples that say how many pixels they buy
    expect(perPixelUSD(pricing)).toBeCloseTo(124 / 25);
  });

  test('other currencies convert to USD', () => {
    const pricing = { examples: [{ price: { amount: 28, currency: 'EUR' } }] };
    expect(fromUSD(pricing)).toBeCloseTo(28 * USD_PER.EUR);
  });

  test('quote-only systems have no From price', () => {
    expect(fromUSD({ tier: 'full-experience' })).toBeNull();
    expect(fromUSD({ examples: [{ price: 'contact' }] })).toBeNull();
    expect(fromUSD(null)).toBeNull();
  });
});

describe('tiers', () => {
  test('sort from parts to full experience; anything else sorts last', () => {
    expect(TIERS.map(tierRank)).toEqual([0, 1, 2, 3]);
    expect(tierRank('$$$')).toBeNull();
    expect(tierRank(undefined)).toBeNull();
  });

  test('every tier has a label', () => {
    for (const t of TIERS) expect(TIER_LABELS[t]).toBeTruthy();
  });
});
