import { describe, expect, test } from 'bun:test';
import {
  ALL_CITATIONS,
  DMX512,
  SOURCES,
  WS2812B_EARLY,
  WS2813B_V6,
  type SingleWireTiming,
} from '../../app/lib/protocols/reference';
import { commonTiming, intersect } from '../../app/lib/protocols/timing';

describe('protocol sources', () => {
  test('every citation names a source, a place in it and the words it prints', () => {
    for (const cite of ALL_CITATIONS) {
      expect(SOURCES[cite.source]).toBeDefined();
      expect(cite.where.trim().length).toBeGreaterThan(0);
      expect(cite.quote.trim().length).toBeGreaterThan(10);
    }
  });

  test('every source is a dated https link', () => {
    for (const source of Object.values(SOURCES)) {
      expect(source.url).toMatch(/^https:\/\//);
      expect(source.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('timing windows are well formed', () => {
    const parts: SingleWireTiming[] = [WS2812B_EARLY, WS2813B_V6];
    for (const part of parts) {
      for (const w of [part.t0h, part.t1h, part.t0l, part.t1l]) {
        expect(w.min).toBeGreaterThan(0);
        expect(w.min).toBeLessThanOrEqual(w.max);
      }
      // A 0's pulse must be shorter than a 1's, or the bits can't be told apart
      expect(part.t0h.max).toBeLessThan(part.t1h.min);
    }
  });
});

describe('DMX512 arithmetic', () => {
  test('a full packet takes the 22.7 ms the standard prints, so about 44 updates a second', () => {
    const slotUs = DMX512.bitsPerSlot * DMX512.bitUs;
    expect(slotUs).toBe(44);
    // BREAK + MARK AFTER BREAK + start code + 512 slots, all at their minimum
    const packetUs = DMX512.breakTxMinUs + DMX512.mabTxMinUs + (DMX512.slots + 1) * slotUs;
    expect(packetUs).toBe(22_676);
    expect(Math.round(packetUs / 100) / 10).toBe(DMX512.updateMs513);
    expect(Math.floor(1e6 / packetUs)).toBe(DMX512.refreshMax);
  });

  test('170 RGB pixels or 128 RGBW pixels fit in 512 slots', () => {
    expect(Math.floor(DMX512.slots / 3)).toBe(170);
    expect(Math.floor(DMX512.slots / 4)).toBe(128);
  });
});

describe('common timing', () => {
  test('intersect keeps what every window shares', () => {
    expect(
      intersect([
        { min: 250, max: 550 },
        { min: 220, max: 380 },
      ])
    ).toEqual({
      min: 250,
      max: 380,
    });
    expect(
      intersect([
        { min: 1, max: 2 },
        { min: 3, max: 4 },
      ])
    ).toBeNull();
  });

  test('the early WS2812B sheet and the WS2813B-V6 sheet share a (narrow) setting', () => {
    const common = commonTiming([WS2812B_EARLY, WS2813B_V6]);
    expect(common.ok).toBe(true);
    expect(common.t0h).toEqual({ min: 250, max: 380 });
    expect(common.t1h).toEqual({ min: 650, max: 950 });
    // The tightest: the early sheet ends a 1's low time by 600 ns, the V6 starts it at 580
    expect(common.t1l).toEqual({ min: 580, max: 600 });
    expect(common.resetMin).toBe(280_000);
  });
});
