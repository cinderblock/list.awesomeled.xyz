import { describe, expect, test } from 'bun:test';
import {
  buildCatalog,
  buildConnectorOption,
  buildPixelIcOption,
  buildPixelOption,
  buildPrice,
  costOf,
  buildShifterOption,
  buildSourceOption,
  isRetired,
  nominalVoltage,
  parseIp,
  pixelChannels,
  pixelMaxWatts,
  unitPriceAt,
} from '../../app/lib/designer';
import { loadCategoryData, getRelationGraph } from '../../app/lib/data';
import { CATEGORIES } from '../../app/lib/types';
import type { BaseEntry } from '../../app/lib/types';
import { entry, fixtureCatalog, fixtureIndex, must } from './fixtures';

describe('pixel options', () => {
  const index = fixtureIndex();

  test('full white is channel current × channels × voltage when the channel current is known', () => {
    const pixel = must(index.pixels, 'rgb5');
    expect(pixel.channels).toBe(3);
    expect(pixel.channelAmps).toBeCloseTo(0.02, 9);
    expect(pixel.ampsBasis).toBe('datasheet');
    expect(pixelMaxWatts(pixel, 5)).toBeCloseTo(0.3, 9); // not 0.1 W
  });

  test('RGBW counts four channels', () => {
    const pixel = must(index.pixels, 'rgbw5');
    expect(pixel.channels).toBe(4);
    expect(pixelMaxWatts(pixel, 5)).toBeCloseTo(0.4, 9);
  });

  test('12 V pixels draw their channel current from the 12 V rail', () => {
    const pixel = must(index.pixels, 'rgb12');
    expect(pixel.voltage).toBe(12);
    expect(pixel.logicVoltage).toBe(5);
    expect(pixelMaxWatts(pixel, 12)).toBeCloseTo(0.36, 9);
    expect(pixel.backupLine).toBe(true);
  });

  test('a lone wattage value is the whole pixel at full white', () => {
    const pixel = buildPixelOption(
      entry('w', { color: { order: 'RGB' }, electrical: { led_voltage: '5V', wattage: '300mW' } })
    );
    expect(pixel.ampsBasis).toBe('pixel wattage');
    expect(pixel.channelAmps).toBeCloseTo(0.02, 9);
    expect(pixelMaxWatts(pixel, 5)).toBeCloseTo(0.3, 9);
  });

  test('no electrical data falls back to a typical channel current', () => {
    const bare = must(index.pixels, 'bare');
    expect(bare.ampsBasis).toBe('typical');
    expect(bare.voltage).toBeNull();
    expect(bare.clocked).toBeNull();
    expect(pixelMaxWatts(bare, 5)).toBeCloseTo(0.3, 9);

    // integrated high-voltage pixels run leaner than 20 mA per channel
    const hv = buildPixelOption(entry('hv', { electrical: { led_voltage: '12V' } }));
    expect(hv.channelAmps).toBeLessThan(0.02);
  });

  test('a wide supply range offers the common rails inside it, defaulting to 5 V', () => {
    const wide = must(index.pixels, 'wide');
    expect(wide.voltage).toBe(5);
    expect(wide.voltageChoices).toEqual([3.3, 5]);
  });

  test('records protocol facts used by the checks', () => {
    const clk = must(index.pixels, 'clk5');
    expect(clk.clocked).toBe(true);
    expect(clk.family).toBe('APA102');
    expect(clk.bitrateHz).toBe(30e6);
    expect(clk.bitsPerPixel).toBe(32);
    expect(clk.maxPerString).toBe(250);
    expect(clk.channelBits).toBe(8);
    expect(clk.logicHighMin).toBe(3.5);
    expect(must(index.pixels, 'deep5').channelBits).toBe(16);
  });

  test('ids, paths and refs', () => {
    const pixel = must(index.pixels, 'rgb5');
    expect(pixel.kind).toBe('pixel');
    expect(pixel.path).toBe('/pixels/rgb5');
    expect(pixel.ref).toBe('pixels/rgb5');
    expect(pixel.image).toBeUndefined();
    // images are the small build-time thumbnails
    const pictured = buildPixelOption(entry('pic', { images: [{ file: 'pic.webp' }] }));
    expect(pictured.image).toBe('/database-thumbs/sm/pixels/pic.webp');
  });
});

describe('driver IC options', () => {
  const index = fixtureIndex();

  test('are prefixed so they never collide with pixels', () => {
    const ic = must(index.pixels, 'ic-ic12');
    expect(ic.kind).toBe('ic');
    expect(ic.path).toBe('/pixel-ics/ic12');
    expect(ic.ref).toBe('pixel-ics/ic12');
  });

  test('offer the common string voltages the output stage allows, defaulting to 12 V', () => {
    expect(must(index.pixels, 'ic-ic12').voltageChoices).toEqual([5, 12]);
    expect(must(index.pixels, 'ic-ic12').voltage).toBe(12);
    expect(must(index.pixels, 'ic-ic-strong').voltageChoices).toEqual([5, 12, 24]);
    expect(must(index.pixels, 'ic-ic-lowv').voltageChoices).toEqual([5]);
    expect(must(index.pixels, 'ic-ic-lowv').voltage).toBe(5);
  });

  test('an IC known only by its 5 V supply is treated as a 5 V part', () => {
    expect(must(index.pixels, 'ic-ic-integrated').voltage).toBe(5);
    expect(must(index.pixels, 'ic-ic-unknown').voltage).toBe(12);
  });

  test('LED current is the datasheet limit only when it is an LED-sized current', () => {
    const modest = must(index.pixels, 'ic-ic12');
    expect(modest.channelAmps).toBeCloseTo(0.019, 9);
    expect(modest.ampsBasis).toBe('datasheet');

    const strong = must(index.pixels, 'ic-ic-strong');
    expect(strong.channelAmps).toBeCloseTo(0.02, 9);
    expect(strong.ampsBasis).toBe('typical');
    expect(strong.channelAmpsLimit).toBeCloseTo(0.045, 9);
  });

  test('a chip with outputs for several pixels describes one pixel', () => {
    const triple = must(index.pixels, 'ic-ic-triple');
    expect(triple.channels).toBe(3);
    expect(triple.pixelsPerPart).toBe(3);
    expect(pixelMaxWatts(triple, 12)).toBeCloseTo(3 * 0.018 * 12, 9);
    const quad = must(index.pixels, 'ic-ic-quad-rgbw');
    expect(quad.channels).toBe(4);
    expect(quad.pixelsPerPart).toBe(4);
    expect(must(index.pixels, 'ic-ic12').pixelsPerPart).toBe(1);
    expect(must(index.pixels, 'rgb5').pixelsPerPart).toBe(1);
  });

  test('channel count comes from data.channels', () => {
    expect(must(index.pixels, 'ic-ic-unknown').channels).toBe(4);
    expect(buildPixelIcOption(entry('x', { data: { channels: 5 } })).channels).toBe(5);
  });
});

describe('controller options', () => {
  const index = fixtureIndex();

  test('clocked support', () => {
    expect(must(index.controllers, 'big16').clockedSupport).toBe('both');
    expect(must(index.controllers, 'async4').clockedSupport).toBe('async');
    expect(must(index.controllers, 'raw1').clockedSupport).toBe('clocked');
    expect(must(index.controllers, 'mystery').clockedSupport).toBe('unknown');
  });

  test('input protocols are normalized and de-duplicated', () => {
    expect(must(index.controllers, 'big16').inputProtocols).toEqual(['artnet', 'sacn', 'ddp']);
    expect(must(index.controllers, 'async4').inputProtocols).toEqual(['sacn']);
    expect(must(index.controllers, 'raw1').inputProtocols).toEqual(['dmx']);
  });

  test('physical inputs skip the ones marked false', () => {
    expect(must(index.controllers, 'big16').inputs).toEqual(['Ethernet', 'Wi-Fi']);
  });

  test('electrical limits', () => {
    const big = must(index.controllers, 'big16');
    expect(big.voltageMin).toBe(5);
    expect(big.voltageMax).toBe(24);
    expect(big.boardAmps).toBe(60);
    const small = must(index.controllers, 'async4');
    expect(small.outputAmps).toBe(3);
    expect(small.outputFuse).toBe('3A');
    expect(small.maxPerOutput).toBe(680);
    expect(small.maxTotal).toBeNull();
    expect(must(index.controllers, 'total8').maxTotal).toBe(2400);
    expect(must(index.controllers, 'total8').maxPerOutput).toBeNull();
  });

  test('listed pixel protocols resolve through names, aliases and variants', () => {
    const c = must(index.controllers, 'async4');
    expect(c.listedProtocols).toEqual(['RGB5', 'IC-Twelve']);
    expect(c.drives).toEqual(['rgb5', 'ic-ic12']);
    expect(c.driveFamilies).toEqual(['ws281112']);
    expect(must(index.controllers, 'big16').drives).toEqual([]);
  });

  test('the output connector resolves to its entry', () => {
    expect(must(index.controllers, 'big16').outputConnector).toEqual({
      id: 'screw',
      label: 'Screw Terminal',
      notes: '5.08 mm pitch',
    });
    expect(must(index.controllers, 'mystery').outputConnector).toBeNull();
  });

  test('firmware and host boards resolve through the relation graph', () => {
    const big = must(index.controllers, 'big16');
    expect(big.firmware).toEqual(['FPP']);
    expect(big.firmwareIds).toEqual(['player']);

    const cape = must(index.controllers, 'cape');
    expect(cape.requiresHost).toBe('PiBoard');
    expect(cape.hostIds).toEqual(['mb-pi']);
    expect(cape.fpsMax).toBe(20);
    expect(cape.waterproof).toBe('IP65');
  });

  test('wled_compatible counts as WLED firmware', () => {
    expect(must(index.controllers, 'raw1').firmware).toEqual(['WLED']);
  });

  test('prices keep their currency; licence tiers stay separate', () => {
    const eur = must(index.controllers, 'raw1').price;
    expect(eur.currency).toBe('EUR');
    expect(eur.text).toBe('€20');
    expect(eur.tiers[0].usd).toBeGreaterThan(20);

    const range = must(index.controllers, 'wild8').price;
    expect(range.text).toBe('$3–8');
    expect(range.tiers[0].usd).toBe(3);

    const licensed = must(index.controllers, 'licensed');
    expect(licensed.price.tiers).toHaveLength(0);
    expect(licensed.licenseTiers.map((t) => [t.usd, t.pixels])).toEqual([
      [299, 1024],
      [599, 4096],
    ]);
  });
});

describe('dev boards as controllers', () => {
  const index = fixtureIndex();

  test('boards with recorded pixel outputs join the list, prefixed', () => {
    const esp = must(index.controllers, 'mb-esp');
    expect(esp.kind).toBe('board');
    expect(esp.path).toBe('/microboards/esp');
    expect(esp.outputs).toBe(8);
    expect(esp.dataVoltage).toBe(3.3);
    expect(esp.voltageMax).toBe(5);
    expect(esp.clockedSupport).toBe('unknown');
    expect(esp.platformTokens).toContain('esp32');
  });

  test('boards without recorded outputs are left out', () => {
    expect(index.controllers.has('mb-no-outputs')).toBe(false);
  });

  test('but every board can be the host a controller plugs into', () => {
    expect(must(index.hosts, 'mb-no-outputs').name).toBe('No Outputs');
    expect(must(index.hosts, 'mb-pi')).toMatchObject({ name: 'PiBoard', path: '/microboards/pi' });
    expect(must(index.hosts, 'mb-pi').price.tiers[0].usd).toBe(35);
  });

  test('aliases and the instruction set become platform tokens', () => {
    expect(must(index.controllers, 'mb-pi').platformTokens).toContain('piboard4');
    expect(must(index.controllers, 'mb-avr5').platformTokens).toContain('avr');
  });
});

describe('adapters as controllers', () => {
  const catalog = fixtureCatalog();
  const adapter = (id: string) => catalog.controllers.find((c) => c.id === id);

  test('offered once the outputs and the host board are known', () => {
    const ids = catalog.controllers.filter((c) => c.kind === 'adapter').map((c) => c.id);
    expect(ids).toEqual(['ad-breakout2', 'ad-plain8', 'ad-shield4']);
    expect(adapter('ad-orphan')).toBeUndefined(); // no host link
    expect(adapter('ad-noouts')).toBeUndefined(); // no outputs
  });

  test('carries the shared controller facts and its own page', () => {
    const shield = adapter('ad-shield4')!;
    expect(shield.path).toBe('/adapters/shield4');
    expect(shield.ref).toBe('adapters/shield4');
    expect(shield.outputs).toBe(4);
    expect(shield.clockedSupport).toBe('async');
    expect(shield.requiresHost).toBe('ESP Board or Old Board');
    expect(shield.outputConnector?.label).toBe('Screw terminals');
    expect(shield.price.tiers[0].usd).toBe(12);
  });

  test('hosts still on sale come first', () => {
    expect(adapter('ad-shield4')!.hostIds).toEqual(['mb-esp', 'mb-oldboard']);
  });

  test('a buffer IC on board means buffered outputs', () => {
    expect(adapter('ad-shield4')!.buffered).toBe(true);
    expect(adapter('ad-shield4')!.dataVoltage).toBeNull(); // buffered: 5 V by rule
    expect(adapter('ad-plain8')!.buffered).toBeNull();
  });

  test('only outputs recorded as unbuffered take the host’s logic level', () => {
    expect(adapter('ad-breakout2')!.dataVoltage).toBe(3.3);
    // Unrecorded is not unbuffered: most adapters exist to add a buffer
    expect(adapter('ad-plain8')!.dataVoltage).toBeNull();
  });

  test('software platforms are matched through the host boards', () => {
    const tokens = adapter('ad-shield4')!.platformTokens;
    for (const token of ['esp32', 'esp8266', 'espboard']) expect(tokens).toContain(token);
  });

  test('every dev board is a possible host, with its level and platform names', () => {
    const esp = catalog.hosts.find((h) => h.id === 'mb-esp')!;
    expect(esp.dataVoltage).toBe(3.3);
    expect(esp.platformTokens).toContain('esp32');
    expect(catalog.hosts.find((h) => h.id === 'mb-oldboard')!.status).toBe('discontinued');
  });
});

describe('level shifters, connectors and sources', () => {
  test('level shifter fields', () => {
    const quad = buildShifterOption(
      entry('q', { name: 'Q', io: { channels: 4 }, electrical: { max_voltage: '5.5V' } })
    );
    expect(quad.channels).toBe(4);
    expect(quad.maxVoltage).toBe(5.5);
    expect(quad.differential).toBe(false);
    // bare numbers and differential receivers
    expect(buildShifterOption(entry('n', { electrical: { max_voltage: 6 } })).maxVoltage).toBe(6);
    expect(buildShifterOption(entry('d', { io: { differential: true } })).differential).toBe(true);
    // ICs record a supply range: the top of it is the limit; packages list
    const ic = buildShifterOption(
      entry('r', {
        electrical: { supply_voltage: '1.65-5.5V' },
        physical: { packages: ['SOT-23-5', 'SC-70-5'] },
      })
    );
    expect(ic.maxVoltage).toBe(5.5);
    expect(ic.interface).toBe('SOT-23-5, SC-70-5');
  });

  test('connector ratings parse with or without a space before the unit', () => {
    const c = buildConnectorOption(
      entry('c', {
        ratings: { max_current: '10 A', max_voltage: '300 V', ip_rating: 'IP67' },
        mechanical: { min_pins: 2, max_pins: 4, wire_to_wire: true },
      })
    );
    expect(c.contactAmps).toBe(10);
    expect(c.maxVoltage).toBe(300);
    expect(c.ip).toBe(67);
    expect(c.pinsMax).toBe(4);
    expect(
      buildConnectorOption(entry('m', { ratings: { max_current: '500mA' } })).contactAmps
    ).toBe(0.5);
  });

  test('IP ratings take the best case of a range', () => {
    expect(parseIp('IP68')).toBe(68);
    expect(parseIp('IP20-IP65')).toBe(65);
    expect(parseIp('IP65 Available')).toBe(65);
    expect(parseIp(undefined)).toBeNull();
    expect(parseIp('sealed')).toBeNull();
  });

  test('sources list what they can send, and what they run on', () => {
    const seq = buildSourceOption(
      entry('s', {
        outputs: { protocols: { artnet: 'Output', sacn: 'Both', ddp: 'Input', kinet: true } },
        pricing: { price: 'Free' },
      })
    );
    expect(seq.outputProtocols).toEqual(['artnet', 'sacn', 'kinet']);
    expect(seq.price.tiers[0].usd).toBe(0);
    expect(seq.price.text).toBe('Free');

    const fw = buildSourceOption(
      entry('f', {
        name: 'Fw',
        aliases: ['F W'],
        platforms: { hardware: ['ESP32'] },
        pricing: { price: 'Free - $99' },
      })
    );
    expect(fw.hardware).toEqual(['ESP32']);
    expect(fw.nameKeys).toEqual(['fw', 'fw']);
    // A range is a figure with two ends; free text stays as written
    expect(fw.price.tiers[0].usd).toBe(0);
    expect(fw.price.maxUSD).toBe(99);
    expect(fw.price.text).toBe('Free–$99');
    expect(fw.priceText).toBeNull();
    expect(buildSourceOption(entry('p', { pricing: { price: 299 } })).price.tiers[0].usd).toBe(299);
    const odd = buildSourceOption(entry('o', { pricing: { price: 'Free 1 universe' } }));
    expect(odd.price.tiers).toHaveLength(0);
    expect(odd.priceText).toBe('Free 1 universe');
  });

  test('sources that can neither send a protocol nor run on a board are left out', () => {
    const ids = fixtureCatalog().sources.map((s) => s.id);
    expect(ids).toContain('seq');
    expect(ids).toContain('espfw');
    expect(ids).not.toContain('silent');
  });
});

describe('prices', () => {
  test('quantity tiers pick the deepest tier the quantity reaches', () => {
    const price = buildPrice(
      entry('p', {
        price: [
          { qty: 1000, price: 0.06 },
          { qty: 5, price: 0.1 },
          { qty: 5000, price: 0.05 },
        ],
        price_source: { vendor: 'LCSC', retrieved: '2026-07-03' },
      })
    );
    expect(price.vendor).toBe('LCSC');
    expect(price.tiers.map((t) => t.qty)).toEqual([5, 1000, 5000]);
    expect(unitPriceAt(price, 1)?.usd).toBe(0.1); // below the first tier: its price
    expect(unitPriceAt(price, 999)?.usd).toBe(0.1);
    expect(unitPriceAt(price, 1000)?.usd).toBe(0.06);
    expect(unitPriceAt(price, 40000)?.usd).toBe(0.05);
  });

  test('unpriceable values have no tiers', () => {
    for (const value of [undefined, null, 'varies', 'contact', 'unknown']) {
      const price = buildPrice(entry('p', { price: value }));
      expect(price.tiers).toHaveLength(0);
      expect(unitPriceAt(price, 10)).toBeNull();
    }
    expect(buildPrice(entry('f', { price: 'free' })).tiers[0].usd).toBe(0);
  });

  test('a published range keeps both ends through to the total', () => {
    const price = buildPrice(entry('p', { price: { amount: 0.1, max: 0.25 } }));
    expect(price.text).toBe('$0.10–0.25');
    expect(price.maxUSD).toBe(0.25);
    const cost = costOf(price, 200);
    expect(cost?.unitUSD).toBe(0.1);
    expect(cost?.unitMaxUSD).toBe(0.25);
    expect(cost?.totalUSD).toBeCloseTo(20, 9);
    expect(cost?.totalMaxUSD).toBeCloseTo(50, 9);
    expect(cost?.from).toBe(false);
  });

  test('ranges in another currency convert at both ends', () => {
    const price = buildPrice(entry('p', { price: '€100-200' }));
    expect(price.currency).toBe('EUR');
    const cost = costOf(price, 1)!;
    expect(cost.unitMaxUSD! / cost.unitUSD).toBeCloseTo(2, 9);
  });

  test('a starting price is marked as one', () => {
    const cost = costOf(buildPrice(entry('p', { price: '330+' })), 2);
    expect(cost?.totalUSD).toBe(660);
    expect(cost?.totalMaxUSD).toBeNull();
    expect(cost?.from).toBe(true);
  });

  test('a single figure has no range, and quantity tiers ignore one', () => {
    expect(costOf(buildPrice(entry('p', { price: 25 })), 3)).toMatchObject({
      unitUSD: 25,
      unitMaxUSD: null,
      totalUSD: 75,
      totalMaxUSD: null,
      from: false,
    });
    expect(costOf(buildPrice(entry('p', { price: 'varies' })), 3)).toBeNull();
  });
});

describe('helpers', () => {
  test('nominalVoltage', () => {
    expect(nominalVoltage('12V')).toBe(12);
    expect(nominalVoltage(5)).toBe(5);
    expect(nominalVoltage('3-7.5V')).toBe(5);
    expect(nominalVoltage('9-13V')).toBe(13);
    expect(nominalVoltage(undefined)).toBeNull();
  });

  test('pixelChannels', () => {
    expect(pixelChannels(entry('a', { color: { order: 'RGB' } }))).toBe(3);
    expect(pixelChannels(entry('b', { color: { order: 'RGBW' } }))).toBe(4);
    expect(pixelChannels(entry('c', { name: 'Thing RGBW' }))).toBe(4);
    expect(pixelChannels(entry('d', { data: { channels: 5 }, color: { order: 'RGB' } }))).toBe(5);
  });

  test('isRetired', () => {
    expect(isRetired('discontinued')).toBe(true);
    expect(isRetired('end-of-life')).toBe(true);
    expect(isRetired('active')).toBe(false);
    expect(isRetired(undefined)).toBe(false);
  });
});

// The real database: only invariants, never specific values, so a data
// correction elsewhere can't fail this — but a schema change that breaks the
// designer's assumptions will. The bounds are deliberately loose: they catch
// a unit mix-up (milliamps read as amps), not an unusual part.
describe('the real database builds a sane catalog', () => {
  const db = new Map<string, BaseEntry[]>(
    CATEGORIES.map((c) => [c.id, loadCategoryData(c.id)] as [string, BaseEntry[]])
  );
  const catalog = buildCatalog(db, getRelationGraph());

  test('every list has options and unique ids', () => {
    for (const list of [
      catalog.pixels,
      catalog.controllers,
      catalog.shifters,
      catalog.connectors,
      catalog.sources,
    ]) {
      expect(list.length).toBeGreaterThan(0);
      expect(new Set(list.map((o) => o.id)).size).toBe(list.length);
    }
  });

  test('every pixel has a usable power figure', () => {
    for (const pixel of catalog.pixels) {
      // channels are per pixel: a many-output chip counts as several pixels
      expect(pixel.channels).toBeGreaterThanOrEqual(1);
      expect(pixel.channels).toBeLessThanOrEqual(48);
      expect(Number.isInteger(pixel.pixelsPerPart)).toBe(true);
      expect(pixel.pixelsPerPart).toBeGreaterThanOrEqual(1);
      expect(pixel.channelAmps).toBeGreaterThan(0);
      // one colour channel is tens of milliamps, a watt-class pixel a few hundred
      expect(pixel.channelAmps).toBeLessThan(2);
      expect(pixelMaxWatts(pixel, pixel.voltage ?? 5)).toBeGreaterThan(0);
      for (const choice of pixel.voltageChoices) expect(choice).toBeGreaterThan(0);
      if (pixel.voltage != null && pixel.voltageChoices.length) {
        expect(pixel.voltageChoices).toContain(pixel.voltage);
      }
    }
  });

  test('controllers and boards carry consistent limits', () => {
    for (const c of catalog.controllers) {
      if (c.outputs != null) expect(c.outputs).toBeGreaterThanOrEqual(1);
      if (c.maxPerOutput != null) expect(c.maxPerOutput).toBeGreaterThan(0);
      if (c.voltageMin != null && c.voltageMax != null) {
        expect(c.voltageMin).toBeLessThanOrEqual(c.voltageMax);
      }
      if (c.kind === 'board') expect(c.id.startsWith('mb-')).toBe(true);
      for (const id of c.drives) expect(catalog.pixels.some((p) => p.id === id)).toBe(true);
      for (const id of c.hostIds) expect(catalog.hosts.some((b) => b.id === id)).toBe(true);
    }
  });

  test('prices are non-negative and tiers ascend by quantity', () => {
    const priced = [
      ...catalog.pixels,
      ...catalog.controllers,
      ...catalog.shifters,
      ...catalog.connectors,
    ];
    for (const option of priced) {
      const tiers = option.price.tiers;
      for (let i = 0; i < tiers.length; i++) {
        expect(tiers[i].usd).toBeGreaterThanOrEqual(0);
        if (i > 0) expect(tiers[i].qty).toBeGreaterThanOrEqual(tiers[i - 1].qty);
      }
    }
  });
});
