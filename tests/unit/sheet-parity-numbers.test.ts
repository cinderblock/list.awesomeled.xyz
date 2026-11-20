import { describe, expect, test } from 'bun:test';
import { numberIn } from '../../scripts/sheet-parity/compare';

// The sheet-parity tool settles a numeric cell as "elsewhere" when the entry
// states that number somewhere else. Digits inside dates, URLs, versions and
// part numbers must not count, or real differences vanish from the report.
describe('numberIn', () => {
  test('a standalone count matches', () => {
    expect(numberIn('Up to 40 universes (~6800 pixels)', 6800)).toBe(true);
    expect(numberIn('8 outputs, 1360 pixels each', 1360)).toBe(true);
  });

  test('digits inside dates, times and URLs do not', () => {
    expect(numberIn("retrieved: '2026-11-20'", 20)).toBe(false);
    expect(numberIn('released 2022-06', 6)).toBe(false);
    expect(numberIn('checked 11/18/2026 at 9:35', 18)).toBe(false);
    expect(numberIn('https://example.com/products/20/item-12', 12)).toBe(false);
  });

  test('digits inside part numbers and versions do not', () => {
    expect(numberIn('Uses the WS2812B and an ESP32', 32)).toBe(false);
    expect(numberIn('SM16703-P', 16703)).toBe(false);
    expect(numberIn('firmware v1.2.3', 2)).toBe(false);
  });

  test('a count inside a range is a bound, not the value', () => {
    expect(numberIn('8-16 universes', 16)).toBe(false);
  });

  test('with a unit, only that quantity counts, in any prefix', () => {
    expect(numberIn('20 outputs', 0.02, 'current')).toBe(false);
    expect(numberIn('Channel current 20mA', 0.02, 'current')).toBe(true);
    expect(numberIn('up to 0.02 A per channel', 0.02, 'current')).toBe(true);
    expect(numberIn("retrieved: '2026-11-20'", 0.02, 'current')).toBe(false);
  });

  test('a unit range matches at either end', () => {
    expect(numberIn('Accepts 5-24V input', 24, 'voltage')).toBe(true);
    expect(numberIn('Accepts 5-24V input', 5, 'voltage')).toBe(true);
    expect(numberIn('Accepts 5-24V input', 12, 'voltage')).toBe(false);
  });

  test('a relative tolerance widens the match', () => {
    expect(numberIn('about 102 pixels', 100, undefined, 0.05)).toBe(true);
    expect(numberIn('about 110 pixels', 100, undefined, 0.05)).toBe(false);
  });
});
