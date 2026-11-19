import { describe, expect, test } from 'bun:test';
import {
  channelsPerPixel,
  effectiveVoltage,
  fuseFor,
  maxFps,
  maxPixelsForFps,
  planGroup,
  planString,
  planSupply,
  planSystem,
  powerWarning,
  universesFor,
  wireFor,
  WIRE_DROP_FRACTION,
  type PowerSettings,
} from '../../app/lib/designer';
import { fixtureIndex, must } from './fixtures';

const index = fixtureIndex();
const rgb5 = must(index.pixels, 'rgb5'); // 3 × 20 mA at 5 V = 60 mA, 0.3 W
const rgb12 = must(index.pixels, 'rgb12'); // 3 × 10 mA at 12 V = 30 mA, 0.36 W
const full: PowerSettings = { brightness: 100, feedAmps: 4, wireMeters: 2 };

describe('fuses', () => {
  test('the next standard size above 125% of the load', () => {
    expect(fuseFor(4)).toBe(5);
    expect(fuseFor(1.5)).toBe(2);
    expect(fuseFor(0.5)).toBe(1);
    expect(fuseFor(6)).toBe(7.5);
    expect(fuseFor(8)).toBe(10);
    expect(fuseFor(30)).toBe(40);
  });

  test('nothing sensible beyond the largest blade fuse', () => {
    expect(fuseFor(40)).toBeNull();
  });
});

describe('wire gauge', () => {
  test('a short low-current feed is limited by the fuse it must outlast', () => {
    const wire = wireFor(1, 2, 12, 1);
    expect(wire.awg).toBe(22);
    expect(wire.ok).toBe(true);
    expect(wire.limitedBy).toBe('ampacity');
  });

  test('5 V feeds are limited by voltage drop', () => {
    // 4 A over 2 m (4 m round trip) on 5 V: 5% is 0.25 V
    const wire = wireFor(4, 5, 5, 2);
    expect(wire.limitedBy).toBe('voltage drop');
    expect(wire.dropVolts).toBeLessThanOrEqual(5 * WIRE_DROP_FRACTION + 1e-9);
    expect(wire.awg).toBe(16); // 4 A × 0.01317 Ω/m × 4 m = 0.21 V
    expect(wire.dropVolts).toBeCloseTo(0.2107, 3);
  });

  test('the same feed on 12 V gets by with thinner wire', () => {
    expect(wireFor(4, 5, 12, 2).awg).toBe(20);
  });

  test('longer runs need heavier wire', () => {
    const short = wireFor(4, 5, 5, 1).awg;
    const long = wireFor(4, 5, 5, 6).awg;
    expect(long).toBeLessThan(short); // a lower AWG number is thicker
  });

  test('reports when nothing in the table is enough', () => {
    const wire = wireFor(10, 15, 5, 30);
    expect(wire.ok).toBe(false);
    expect(wire.awg).toBe(8);
    expect(wire.dropFraction).toBeGreaterThan(WIRE_DROP_FRACTION);
  });
});

describe('string power and injection', () => {
  test('a short string is fed from one end', () => {
    const s = planString(50, 1, 0.06, 5, full); // 3 A
    expect(s.maxAmps).toBeCloseTo(3, 9);
    expect(s.feeds).toBe(1);
    expect(s.feedAmps).toBeCloseTo(3, 9);
    expect(s.spacing).toBe(50);
    expect(s.fuseAmps).toBe(4);
  });

  test('exactly at the feed limit is still one feed', () => {
    const s = planString(200, 1, 0.02, 5, full); // 4.0 A
    expect(s.feeds).toBe(1);
  });

  test('long strings get more feeds, each under the limit', () => {
    const s = planString(500, 8, 0.06, 5, full); // 30 A
    expect(s.maxAmps).toBeCloseTo(30, 9);
    expect(s.feeds).toBe(8);
    expect(s.feedAmps).toBeCloseTo(3.75, 9);
    expect(s.feedAmps).toBeLessThanOrEqual(full.feedAmps);
    expect(s.spacing).toBe(63);
    expect(s.fuseAmps).toBe(5);
    expect(s.count).toBe(8);
  });

  test('designing for lower brightness cuts feeds, but never the maximum', () => {
    const dim = planString(500, 1, 0.06, 5, { ...full, brightness: 30 });
    expect(dim.maxAmps).toBeCloseTo(30, 9);
    expect(dim.designAmps).toBeCloseTo(9, 9);
    expect(dim.feeds).toBe(3);
  });

  test('a higher feed limit means fewer feeds', () => {
    expect(planString(500, 1, 0.06, 5, { ...full, feedAmps: 10 }).feeds).toBe(3);
  });
});

describe('group power', () => {
  test('uniform layout', () => {
    const g = planGroup(rgb5, { strings: 8, perString: 500 }, 5, full);
    expect(g.pixels).toBe(4000);
    expect(g.pixelMaxWatts).toBeCloseTo(0.3, 9);
    expect(g.maxWatts).toBeCloseTo(1200, 6);
    expect(g.designWatts).toBeCloseTo(1200, 6);
    expect(g.designAmps).toBeCloseTo(240, 6);
    expect(g.idleWatts).toBeCloseTo(20, 6); // 1 mA × 5 V × 4000
    expect(g.strings).toHaveLength(1);
    expect(g.totalFeeds).toBe(64);
  });

  test('varied lengths are planned per distinct length, longest first', () => {
    const g = planGroup(
      rgb5,
      { strings: 4, perString: 200, lengths: [150, 200, 80, 150] },
      5,
      full
    );
    expect(g.strings.map((s) => [s.pixels, s.count])).toEqual([
      [200, 1],
      [150, 2],
      [80, 1],
    ]);
    expect(g.longest.pixels).toBe(200);
    // 12 A -> 3 feeds; 9 A -> 3 feeds each; 4.8 A -> 2 feeds
    expect(g.totalFeeds).toBe(3 + 3 * 2 + 2);
  });

  test('idle draw is unknown without a quiescent current', () => {
    expect(planGroup(rgb12, { strings: 1, perString: 100 }, 12, full).idleWatts).toBeNull();
  });

  test('brightness scales the design load only', () => {
    const g = planGroup(rgb5, { strings: 1, perString: 1000 }, 5, { ...full, brightness: 25 });
    expect(g.maxWatts).toBeCloseTo(300, 6);
    expect(g.designWatts).toBeCloseTo(75, 6);
  });
});

describe('supplies', () => {
  test('sized so the load is at most 80% of the rating', () => {
    expect(planSupply(100, 12)).toEqual({ count: 1, watts: 150 }); // needs 125 W
    expect(planSupply(16, 5)).toEqual({ count: 1, watts: 25 }); // needs 20 W
    expect(planSupply(240, 5)).toEqual({ count: 1, watts: 300 });
  });

  test('big 5 V loads are split: one supply stays under about 60 A', () => {
    // 1200 W -> 1500 W of capacity -> 5 × 300 W
    expect(planSupply(1200, 5)).toEqual({ count: 5, watts: 300 });
    // 333 W -> 416 W -> 2 × 250 W
    expect(planSupply(333, 5)).toEqual({ count: 2, watts: 250 });
  });

  test('higher rails carry more per supply', () => {
    expect(planSupply(1200, 12)).toEqual({ count: 3, watts: 500 });
    expect(planSupply(400, 12)).toEqual({ count: 1, watts: 500 });
  });
});

describe('system power', () => {
  test('one rail per voltage, in ascending order', () => {
    const power = planSystem([
      planGroup(rgb12, { strings: 2, perString: 100 }, 12, full),
      planGroup(rgb5, { strings: 1, perString: 100 }, 5, full),
      null,
    ]);
    expect(power.rails.map((r) => r.voltage)).toEqual([5, 12]);
    expect(power.rails[0].groups).toEqual([1]);
    expect(power.rails[1].groups).toEqual([0]);
    expect(power.rails[1].maxWatts).toBeCloseTo(72, 6);
    expect(power.pixels).toBe(300);
    expect(power.maxWatts).toBeCloseTo(102, 6);
    expect(power.idleComplete).toBe(false);
  });

  test('groups on the same rail add up', () => {
    const power = planSystem([
      planGroup(rgb5, { strings: 1, perString: 100 }, 5, full),
      planGroup(rgb5, { strings: 1, perString: 300 }, 5, full),
    ]);
    expect(power.rails).toHaveLength(1);
    expect(power.rails[0].maxWatts).toBeCloseTo(120, 6);
    expect(power.rails[0].designAmps).toBeCloseTo(24, 6);
    expect(power.rails[0].supply).toEqual({ count: 1, watts: 150 });
    expect(power.idleComplete).toBe(true);
  });

  test('warnings come from the full-white maximum, not the brightness limit', () => {
    const dim = { ...full, brightness: 10 };
    const power = planSystem([planGroup(rgb5, { strings: 1, perString: 1000 }, 5, dim)]);
    expect(power.designWatts).toBeCloseTo(30, 6);
    expect(power.maxWatts).toBeCloseTo(300, 6);
    expect(power.warning).toBe('strong');
  });

  test('about 20 W is advisory, about 200 W is strong', () => {
    expect(powerWarning(19.9)).toBe('none');
    expect(powerWarning(20)).toBe('none');
    expect(powerWarning(20.1)).toBe('advisory');
    expect(powerWarning(200)).toBe('advisory');
    expect(powerWarning(200.1)).toBe('strong');
  });

  test('an empty design draws nothing', () => {
    const power = planSystem([null]);
    expect(power.rails).toEqual([]);
    expect(power.maxWatts).toBe(0);
    expect(power.warning).toBe('none');
  });
});

describe('voltage a group runs at', () => {
  test("a chosen voltage is honoured only when it is one of the pixel's choices", () => {
    const ic = must(index.pixels, 'ic-ic12'); // 5 or 12 V, default 12
    expect(effectiveVoltage(ic, null)).toBe(12);
    expect(effectiveVoltage(ic, 5)).toBe(5);
    expect(effectiveVoltage(ic, 24)).toBe(12);
    expect(effectiveVoltage(rgb5, 12)).toBe(5);
  });

  test('falls back to 5 V when nothing is known', () => {
    expect(effectiveVoltage(null, null)).toBe(5);
    expect(effectiveVoltage(must(index.pixels, 'bare'), null)).toBe(5);
  });
});

describe('refresh rate and network size', () => {
  test('fps = bitrate ÷ (bits per pixel × pixels per string)', () => {
    expect(maxFps(rgb5, 500)).toBeCloseTo(800000 / (24 * 500), 6); // 66.7
    expect(maxFps(rgb5, 2000)).toBeCloseTo(16.67, 2);
    expect(maxFps(must(index.pixels, 'bare'), 500)).toBeNull();
  });

  test('the longest string that still reaches a target', () => {
    expect(maxPixelsForFps(rgb5, 30)).toBe(1111);
    expect(maxPixelsForFps(rgb5, 60)).toBe(555);
    expect(maxPixelsForFps(must(index.pixels, 'bare'), 30)).toBeNull();
  });

  test('channels per pixel count colour depth', () => {
    expect(channelsPerPixel(rgb5)).toBe(3);
    expect(channelsPerPixel(must(index.pixels, 'rgbw5'))).toBe(4);
    expect(channelsPerPixel(must(index.pixels, 'deep5'))).toBe(6);
  });

  test('universes hold whole pixels', () => {
    expect(universesFor(rgb5, 170)).toBe(1);
    expect(universesFor(rgb5, 171)).toBe(2);
    expect(universesFor(rgb5, 4000)).toBe(24);
    expect(universesFor(must(index.pixels, 'rgbw5'), 128)).toBe(1);
    expect(universesFor(must(index.pixels, 'rgbw5'), 129)).toBe(2);
  });
});
