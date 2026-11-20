// Synthetic database for the designer unit tests.
//
// Fixtures are made up on purpose: other workstreams correct real database
// rows all the time, and a datasheet fix must never break a logic test. The
// values are realistic, but nothing here should be read as a fact about a
// real part.

import { buildRelationGraph, type Database } from '../../app/lib/relations';
import {
  buildCatalog,
  indexCatalog,
  type Catalog,
  type CatalogIndex,
} from '../../app/lib/designer';
import type { BaseEntry } from '../../app/lib/types';

export function entry(id: string, fields: Record<string, unknown>): BaseEntry {
  return { id, name: id, updated: new Date(0), ...fields };
}

export const PIXELS: BaseEntry[] = [
  entry('rgb5', {
    name: 'RGB5',
    status: 'active',
    color: { order: 'GRB', channel_bits: 8 },
    data: { type: 'WS2811/12', clocked: false, bitrate: '800kHz', pixel_size_bits: 24 },
    // channel_current wins over the maker's whole-pixel wattage
    electrical: {
      led_voltage: '5V',
      supply_voltage: '5V',
      gpio: { min: '3.5V', max: '5V' },
      channel_current: '20mA',
      quiescent_current: '1mA',
      wattage: '100mW',
    },
    variants: [{ name: 'RGB5B' }],
    price: [
      { qty: 5, price: 0.1, sku: 'RGB5-5050' },
      { qty: 1000, price: 0.06, sku: 'RGB5-5050' },
    ],
    price_source: { vendor: 'LCSC', retrieved: '2026-07-03' },
  }),
  // Sold at a street-price range rather than one figure
  entry('range5', {
    name: 'Range5',
    color: { order: 'GRB' },
    data: { type: 'WS2811/12', clocked: false, bitrate: '800kHz', pixel_size_bits: 24 },
    electrical: { led_voltage: '5V', supply_voltage: '5V', channel_current: '20mA' },
    price: { amount: 0.1, max: 0.25 },
  }),
  entry('rgb5-lowvih', {
    name: 'RGB5 LowVIH',
    color: { order: 'GRB' },
    data: { type: 'WS2811/12', clocked: false, bitrate: '800kHz', pixel_size_bits: 24 },
    electrical: {
      led_voltage: '5V',
      supply_voltage: '5V',
      gpio: { min: '3.0V', max: '5V' },
      channel_current: '20mA',
    },
  }),
  entry('rgbw5', {
    name: 'RGBW5',
    color: { order: 'GRBW' },
    data: { type: 'WS2811/12', clocked: false, bitrate: '800kHz', pixel_size_bits: 32 },
    electrical: { led_voltage: '5V', supply_voltage: '5V', channel_current: '20mA' },
  }),
  entry('clk5', {
    name: 'CLK5',
    color: {
      order: 'BGR',
      channel_bits: 8,
      brightness_control: { bits: 5, method: 'pwm', scope: 'global' },
    },
    data: {
      type: 'APA102',
      clocked: true,
      bitrate: '30MHz',
      pixel_size_bits: 32,
      max_per_string: 250,
      max_per_string_notes: 'Clock degrades along the string.',
    },
    electrical: {
      led_voltage: '5V',
      supply_voltage: '5V',
      gpio: { min: '3.5V', max: '5V' },
      channel_current: '22mA',
    },
  }),
  entry('rgb12', {
    name: 'RGB12',
    color: { order: 'RGB' },
    data: {
      type: 'WS2811/12',
      clocked: false,
      bitrate: '800kHz',
      pixel_size_bits: 24,
      backup_line: true,
    },
    electrical: {
      led_voltage: '12V',
      supply_voltage: '5V',
      gpio: { min: '3.5V', max: '5V' },
      channel_current: '10mA',
    },
  }),
  // Dice in series: one 10 mA current through all three, and the maker's
  // whole-pixel power (10 mA × 12 V) says so
  entry('series12', {
    name: 'SERIES12',
    color: { order: 'RGB' },
    data: { type: 'WS2811/12', clocked: false, bitrate: '800kHz', pixel_size_bits: 24 },
    electrical: {
      led_voltage: '12V',
      supply_voltage: '5V',
      channel_current: '10mA',
      wattage: '120mW',
    },
  }),
  entry('deep5', {
    name: 'DEEP5',
    status: 'discontinued',
    color: {
      order: 'RGB',
      channel_bits: 16,
      brightness_control: { bits: 5, method: 'current', scope: 'global' },
    },
    data: { type: 'HD108', clocked: true, bitrate: '40MHz', pixel_size_bits: 64 },
    electrical: { led_voltage: '5V', supply_voltage: '5V' },
  }),
  entry('wide', {
    name: 'WIDE',
    color: { order: 'RGB' },
    data: { clocked: true },
    electrical: { led_voltage: '3-7.5V', supply_voltage: '5V', channel_current: '18mA' },
  }),
  entry('bare', { name: 'BARE' }),
];

export const PIXEL_ICS: BaseEntry[] = [
  entry('ic12', {
    name: 'IC12',
    aliases: ['IC-Twelve'],
    data: {
      type: 'WS2811/12',
      clocked: false,
      channels: 3,
      bitrate: '800kHz',
      pixel_size_bits: 24,
    },
    electrical: {
      output_voltage: '12V',
      supply_voltage: '5V',
      gpio: { min: '3.0V', max: '5V' },
      max_current: '19mA',
    },
    price: [{ qty: 20, price: 0.04, sku: 'IC12' }],
  }),
  entry('ic-strong', {
    name: 'ICSTRONG',
    data: { clocked: true, channels: 3, bitrate: '20MHz', pixel_size_bits: 32 },
    electrical: { output_voltage: '24V', supply_voltage: '5V', max_current: '45mA' },
  }),
  entry('ic-lowv', {
    name: 'ICLOWV',
    data: { clocked: true, channels: 3 },
    electrical: { output_voltage: '7V', supply_voltage: '5V' },
  }),
  entry('ic-integrated', {
    name: 'ICINT',
    data: { clocked: false, channels: 3 },
    electrical: { supply_voltage: '5V' },
  }),
  entry('ic-unknown', { name: 'ICUNKNOWN', data: { clocked: false, channels: 4 } }),
  // nine outputs: one chip runs three RGB pixels
  entry('ic-triple', {
    name: 'ICTRIPLE',
    data: { clocked: false, channels: 9 },
    electrical: { output_voltage: '12V', supply_voltage: '5V', max_current: '18mA' },
    price: 0.3,
  }),
  entry('ic-quad-rgbw', { name: 'ICQUADRGBW', data: { clocked: false, channels: 16 } }),
];

export const CONTROLLERS: BaseEntry[] = [
  entry('big16', {
    name: 'Big16',
    status: 'active',
    inputs: {
      physical: { Ethernet: true, 'Wi-Fi': '2.4GHz', USB: false },
      protocols: ['Art-Net', 'sACN', 'DDP'],
      standalone: true,
    },
    outputs: {
      count: 16,
      clocked: 'selectable',
      pixels: { max_per_output: 1024 },
      driver: { buffered: true },
      connector: { ref: 'screw', notes: '5.08 mm pitch' },
      differential: true,
    },
    power: { voltage: { min: 5, max: 24 }, current: { max: 60 } },
    software: { firmware: ['FPP'] },
    price: 280,
  }),
  entry('async4', {
    name: 'Async4',
    inputs: { protocols: ['E1.31'], standalone: false },
    outputs: {
      count: 4,
      clocked: false,
      pixels: { max_per_output: 680 },
      driver: { buffered: true },
      protocols: ['RGB5', 'IC-Twelve'],
      current: { max: 3 },
      fuse: '3A',
    },
    power: { voltage: { max: 5 }, current: { max: 8 } },
    price: 45,
  }),
  entry('raw1', {
    name: 'Raw1',
    inputs: { protocols: ['DMX512'] },
    outputs: { count: 1, clocked: 'always', driver: { buffered: false } },
    wled_compatible: true,
    price: { amount: 20, currency: 'EUR' },
  }),
  entry('wild8', {
    name: 'Wild8',
    outputs: { count: 8, clocked: 'selectable', protocols: ['WS281x', 'LPD8806'] },
    price: { amount: 3, max: 8 },
  }),
  entry('cape', {
    name: 'Cape48',
    status: 'discontinued',
    inputs: { requires_host: 'PiBoard', protocols: ['sACN'], standalone: true },
    outputs: {
      count: 48,
      clocked: false,
      pixels: { max_per_output: 800 },
      driver: { buffered: true },
    },
    power: { voltage: { min: 12, max: 24 } },
    data: { fps: 20 },
    case: { waterproof: 'IP65' },
    price: 150,
  }),
  entry('licensed', {
    name: 'Licensed',
    outputs: { count: 8, clocked: 'selectable' },
    price: [
      { name: '1024 pixels', price: 299, pixels: 1024 },
      { name: '4096 pixels', price: 599, pixels: 4096 },
    ],
  }),
  entry('total8', {
    name: 'Total8',
    // no per-output figure, only a device-wide one
    outputs: { count: 8, clocked: false, pixels: { max_total: 2400 }, driver: { buffered: true } },
    price: 60,
  }),
  entry('mystery', { name: 'Mystery' }),
  entry('mains5', {
    name: 'Mains5',
    // AC in; its built-in supply puts 5 V on the pixel outputs
    outputs: { count: 4, clocked: false, pixels: { max_per_output: 510 } },
    power: { voltage: { min: 100, max: 240 }, ac: true, output_voltage: 5, current: { max: 40 } },
    price: 600,
  }),
  // Its protocol list names makers, not parts
  entry('prefixes', {
    name: 'Prefixes',
    outputs: { count: 4, clocked: 'selectable', protocols: ['WS', 'APA', 'SK'] },
  }),
  // A matrix-panel driver: none of its outputs takes a pixel string
  entry('panels', { name: 'Panels', outputs: { count: 6, protocols: ['HUB75', 'HUB75E'] } }),
  // A DMX node: its outputs block records DMX ports and no pixel outputs
  entry('dmxbox', { name: 'DMX Box', outputs: { auxiliary: { DMX512: 4 } }, price: 90 }),
];

export const MICROBOARDS: BaseEntry[] = [
  entry('esp', {
    name: 'ESP Board',
    compute: { soc: 'ESP32', isa: 'Xtensa' },
    power: { gpio_voltage: '3.3V', voltage: { min: '5V', max: '5V' } },
    io: { max_outputs: 8 },
    price: 10,
  }),
  entry('pi', {
    name: 'PiBoard',
    aliases: ['Pi Board 4'],
    compute: { soc: 'BCM2711', linux: true },
    power: { gpio_voltage: '3.3V' },
    io: { max_outputs: 2 },
    price: 35,
  }),
  entry('avr5', {
    name: 'AVR Five',
    compute: { soc: 'ATmega', isa: 'AVR' },
    power: { gpio_voltage: '5.0V' },
    io: { max_outputs: 1 },
  }),
  entry('no-outputs', { name: 'No Outputs', power: { gpio_voltage: '3.3V' } }),
  entry('oldboard', {
    name: 'Old Board',
    status: 'discontinued',
    compute: { soc: 'ESP8266' },
    power: { gpio_voltage: '3.3V' },
    price: 4,
  }),
];

export const ADAPTERS: BaseEntry[] = [
  // A shield built around a buffer IC, for two boards: one retired, one on sale
  entry('shield4', {
    name: 'Shield 4',
    status: 'active',
    outputs: { count: 4, clocked: false, connector: 'Screw terminals' },
    parent: 'ESP Board or Old Board',
    software: { firmware: ['EspFirmware'] },
    related: [
      { type: 'host', ref: 'microboards/oldboard' },
      { type: 'host', ref: 'microboards/esp' },
      { type: 'uses', ref: 'level-converters/quad' },
    ],
    price: 12,
  }),
  // Recorded as unbuffered: its outputs are the host's own pins
  entry('breakout2', {
    name: 'Breakout 2',
    outputs: { count: 2, clocked: 'selectable', driver: { buffered: false } },
    parent: 'ESP Board',
    related: [{ type: 'host', ref: 'microboards/esp' }],
  }),
  // Nothing recorded about its output stage
  entry('plain8', {
    name: 'Plain 8',
    outputs: { count: 8, clocked: false },
    parent: 'PiBoard',
    related: [{ type: 'host', ref: 'microboards/pi' }],
    price: 20,
  }),
  // No host link: the designer can't say what it plugs into
  entry('orphan', { name: 'Orphan', outputs: { count: 8, clocked: false }, parent: 'Something' }),
  // No pixel outputs recorded
  entry('noouts', {
    name: 'No Outs',
    parent: 'ESP Board',
    related: [{ type: 'host', ref: 'microboards/esp' }],
  }),
  // Its outputs are for matrix panels
  entry('panelcape', {
    name: 'Panel Cape',
    outputs: { count: 6, protocols: ['HUB75'] },
    parent: 'PiBoard',
    related: [{ type: 'host', ref: 'microboards/pi' }],
  }),
  // The only level converter on board is a line transceiver, there for DMX
  entry('dmxshield', {
    name: 'DMX Shield',
    outputs: { count: 2, clocked: 'selectable' },
    parent: 'ESP Board',
    related: [
      { type: 'host', ref: 'microboards/esp' },
      { type: 'uses', ref: 'level-converters/rs485' },
    ],
  }),
];

export const LEVEL_CONVERTERS: BaseEntry[] = [
  entry('quad', {
    name: 'Quad Buffer',
    io: { channels: 4, direction: 'fixed', buffered: true },
    physical: { packages: ['DIP-14'] },
    electrical: { supply_voltage: '4.5-5.5V', input_high_voltage: '2V' },
    price: [
      { qty: 1, price: 0.9, sku: 'QB' },
      { qty: 1000, price: 0.3, sku: 'QB' },
    ],
    price_source: { vendor: 'TI', retrieved: '2026-07' },
  }),
  entry('octal', { name: 'Octal Buffer', io: { channels: 8 }, price: 1.5 }),
  entry('lowv', { name: 'LowV Translator', io: { channels: 2 }, electrical: { max_voltage: 3.6 } }),
  // Plain CMOS inputs: 0.7 × VCC, out of a 3.3 V controller's reach
  entry('cmos', {
    name: 'CMOS Buffer',
    io: { channels: 8, buffered: true },
    electrical: { max_voltage: 6, input_high_voltage: '3.5V' },
    price: 0.4,
  }),
  // Reads 3.3 V happily, but holds its outputs high through pull-up resistors
  entry('passgate', {
    name: 'Pass-Gate Translator',
    io: { channels: 8, buffered: false },
    electrical: { input_high_voltage: '2.9V' },
    price: 0.7,
  }),
  entry('diff', {
    name: 'Differential Receiver',
    io: { channels: 4, buffered: true, differential: true },
    price: 22,
  }),
  // An RS-485 transceiver on a 3.3 V supply: differential by its record, not its name
  entry('rs485', {
    name: 'Line Transceiver',
    io: { channels: 1, differential: true },
    electrical: { supply_voltage: '3-3.6V' },
  }),
];

export const CONNECTORS: BaseEntry[] = [
  entry('screw', {
    name: 'Screw Terminal',
    ratings: { max_current: '10 A', max_voltage: '300 V' },
    mechanical: { min_pins: 2, max_pins: 12, locking: 'Friction', wire_to_wire: false },
  }),
  entry('pigtail', {
    name: 'Pigtail',
    ratings: { max_current: '5 A', max_voltage: '50 V', ip_rating: 'IP68' },
    mechanical: { min_pins: 2, max_pins: 4, locking: 'Screw Lock', wire_to_wire: true },
  }),
  entry('two-pin', {
    name: 'Two Pin',
    ratings: { max_current: '60 A', max_voltage: '42 V' },
    mechanical: { min_pins: 2, max_pins: 2 },
  }),
  entry('lowvolt', {
    name: 'LowVolt',
    ratings: { max_current: '2 A', max_voltage: '9 V', ip_rating: 'IP20-IP65' },
    mechanical: { min_pins: 3, max_pins: 5 },
  }),
  entry('eight', {
    name: 'Eight Way',
    ratings: { max_current: '1.5 A', max_voltage: '125 V' },
    mechanical: { min_pins: 8, max_pins: 8 },
  }),
];

export const PATTERN_DRIVERS: BaseEntry[] = [
  entry('seq', {
    name: 'Sequencer',
    status: 'active',
    outputs: { protocols: { artnet: 'Output', sacn: 'Output', dmx: 'Output' } },
    platforms: { os: ['Windows', 'macOS', 'Linux'] },
    license: 'GPL-3.0',
    foss: true,
    pricing: { price: 'Free' },
  }),
  entry('ddponly', {
    name: 'DDP Only',
    outputs: { protocols: { ddp: 'Output', artnet: 'Input' } },
    platforms: { os: ['Windows'] },
    pricing: { price: 299 },
  }),
  entry('espfw', {
    name: 'EspFirmware',
    aliases: ['WLED'],
    outputs: { protocols: { artnet: 'Input', sacn: 'Input' } },
    platforms: { hardware: ['ESP32', 'ESP8266'] },
    license: 'MIT',
    foss: true,
    pricing: { price: 'FOSS' },
  }),
  entry('player', {
    name: 'Player',
    aliases: ['FPP'],
    status: 'end-of-life',
    outputs: { protocols: { sacn: 'Both' } },
    platforms: { hardware: ['PiBoard'] },
    pricing: { price: 'Free - $99' },
  }),
  entry('wordy', {
    name: 'Wordy',
    platforms: { os: ['Windows'] },
    outputs: { protocols: { artnet: 'Output', sacn: 'Output' } },
    pricing: { price: 'Free 1 universe' },
  }),
  entry('silent', { name: 'Silent', platforms: { os: ['Windows'] } }),
];

export function fixtureDatabase(): Database {
  return new Map([
    ['pixels', PIXELS],
    ['pixel-ics', PIXEL_ICS],
    ['controllers', CONTROLLERS],
    ['microboards', MICROBOARDS],
    ['adapters', ADAPTERS],
    ['level-converters', LEVEL_CONVERTERS],
    ['connectors', CONNECTORS],
    ['pattern-drivers', PATTERN_DRIVERS],
    ['drive-libraries', []],
  ]);
}

export function fixtureCatalog(): Catalog {
  const db = fixtureDatabase();
  return buildCatalog(db, buildRelationGraph(db));
}

export function fixtureIndex(): CatalogIndex {
  return indexCatalog(fixtureCatalog());
}

/** Look up an option that must exist */
export function must<T>(map: Map<string, T>, id: string): T {
  const value = map.get(id);
  if (!value) throw new Error(`fixture "${id}" not found`);
  return value;
}
