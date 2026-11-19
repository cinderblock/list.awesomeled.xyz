import { describe, expect, test } from 'bun:test';
import {
  buildPixelOption,
  estimatePower,
  nominalVoltage,
  pixelChannels,
  systemPower,
  type Chain,
} from '../../app/lib/designer/legacy';
import type { BaseEntry } from '../../app/lib/types';

// Fixtures are synthetic on purpose: other workstreams correct database rows
// all the time, and a datasheet fix must never break these tests.
function entry(fields: Record<string, unknown>): BaseEntry {
  return { id: 'fixture', name: 'Fixture', updated: new Date(0), ...fields };
}

const rgb5v = entry({
  name: 'RGB 5 V',
  color: { order: 'GRB' },
  data: { clocked: false, bitrate: '800kHz', pixel_size_bits: 24 },
  // wattage is ONE channel's power in the database: 18.5 mA × 5 V
  electrical: { led_voltage: '5V', channel_current: '18.5mA', wattage: '92.5mW' },
});

describe('per-pixel power', () => {
  test('full white is channel current × channels × voltage, not the per-channel wattage', () => {
    const pixel = buildPixelOption(rgb5v);
    expect(pixel.channels).toBe(3);
    expect(pixel.wattsPerPixel).toBeCloseTo(0.2775, 6); // 3 × 18.5 mA × 5 V
    expect(pixel.wattsBasis).toBe('channel current');
  });

  test('RGBW pixels count four channels', () => {
    const pixel = buildPixelOption(
      entry({
        color: { order: 'GRBW' },
        electrical: { led_voltage: '5V', channel_current: '20mA' },
      })
    );
    expect(pixel.channels).toBe(4);
    expect(pixel.wattsPerPixel).toBeCloseTo(0.4, 6);
  });

  test('12 V pixels draw their channel current from the 12 V rail', () => {
    const pixel = buildPixelOption(
      entry({
        color: { order: 'RGB' },
        electrical: { led_voltage: '12V', vcc_voltage: '5V', channel_current: '10mA' },
      })
    );
    expect(pixel.voltage).toBe(12);
    expect(pixel.wattsPerPixel).toBeCloseTo(0.36, 6);
  });

  test('a lone wattage value is scaled by the channel count', () => {
    const pixel = buildPixelOption(
      entry({ color: { order: 'RGB' }, electrical: { led_voltage: '5V', wattage: '100mW' } })
    );
    expect(pixel.wattsPerPixel).toBeCloseTo(0.3, 6);
    expect(pixel.wattsBasis).toBe('per-channel wattage');
  });

  test('no electrical data falls back to 20 mA per channel', () => {
    const pixel = buildPixelOption(entry({ electrical: { led_voltage: '5V' } }));
    expect(pixel.wattsPerPixel).toBeCloseTo(0.3, 6);
    expect(pixel.wattsBasis).toBe('typical estimate');
  });

  test('approximate currents ("~5mA") still parse', () => {
    const pixel = buildPixelOption(
      entry({ color: { order: 'GRB' }, electrical: { led_voltage: '5V', channel_current: '~5mA' } })
    );
    expect(pixel.wattsPerPixel).toBeCloseTo(0.075, 6);
  });
});

describe('pixelChannels', () => {
  test('reads the channel order', () => {
    expect(pixelChannels(entry({ color: { order: 'RGB' } }))).toBe(3);
    expect(pixelChannels(entry({ color: { order: 'RGBW' } }))).toBe(4);
  });

  test('prefers an explicit data.channels (driver ICs)', () => {
    expect(pixelChannels(entry({ data: { channels: 5 }, color: { order: 'RGB' } }))).toBe(5);
  });

  test('falls back to the name, then to RGB', () => {
    expect(pixelChannels(entry({ name: 'WS2815 RGBW' }))).toBe(4);
    expect(pixelChannels(entry({ name: 'SK6813' }))).toBe(3);
  });
});

describe('nominalVoltage', () => {
  test('plain values pass through', () => {
    expect(nominalVoltage('12V')).toBe(12);
    expect(nominalVoltage(5)).toBe(5);
    expect(nominalVoltage(undefined)).toBeNull();
  });

  test('ranges resolve to 5 V when they include it, else their upper end', () => {
    expect(nominalVoltage('3-7.5V')).toBe(5);
    expect(nominalVoltage('3.7-5.5V')).toBe(5);
    expect(nominalVoltage('9-13V')).toBe(13);
  });
});

describe('system power', () => {
  const pixel = buildPixelOption(rgb5v);
  const chain = (strings: number, perString: number): Chain => ({
    pixel,
    layout: { strings, perString },
    controller: null,
  });

  test('scales with pixel count and reports amps on the rail', () => {
    const power = systemPower([chain(8, 500)]);
    expect(power.totalPixels).toBe(4000);
    expect(power.totalWatts).toBeCloseTo(1110, 3);
    expect(power.rails).toHaveLength(1);
    expect(power.rails[0].voltage).toBe(5);
    expect(power.rails[0].amps).toBeCloseTo(222, 3);
  });

  test('warns from about 20 W and strongly from about 200 W', () => {
    expect(systemPower([chain(1, 60)]).warning).toBe('none'); // 16.65 W
    expect(systemPower([chain(1, 150)]).warning).toBe('advisory'); // 41.6 W
    expect(systemPower([chain(1, 720)]).warning).toBe('advisory'); // 199.8 W
    expect(systemPower([chain(1, 721)]).warning).toBe('strong'); // 200.1 W
  });

  test('estimatePower agrees with systemPower for one group', () => {
    const estimate = estimatePower(pixel, 4000);
    expect(estimate.watts).toBeCloseTo(systemPower([chain(8, 500)]).totalWatts, 6);
    expect(estimate.recommendedWatts).toBeGreaterThanOrEqual(estimate.watts * 1.25);
  });

  test('mixed voltages get one rail each', () => {
    const pixel12 = buildPixelOption(
      entry({
        color: { order: 'RGB' },
        electrical: { led_voltage: '12V', channel_current: '10mA' },
      })
    );
    const power = systemPower([
      chain(1, 100),
      { pixel: pixel12, layout: { strings: 2, perString: 100 }, controller: null },
    ]);
    expect(power.rails.map((r) => r.voltage)).toEqual([5, 12]);
    expect(power.rails[1].watts).toBeCloseTo(72, 6);
  });
});
