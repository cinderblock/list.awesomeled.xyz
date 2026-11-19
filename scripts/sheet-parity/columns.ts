/**
 * Sheet column -> YAML field mapping, one list per tab, in sheet column order.
 *
 * This table is the audit's column mapping: every sheet column appears here,
 * either with the YAML path(s) that now hold its data or with the reason it
 * was intentionally not migrated. Column A of every tab is the entry name.
 */

import type { ColumnSpec, DeriveContext, Kind } from './compare';
import { coverage, getAt } from './compare';

const text: Kind = { type: 'text' };
const exact: Kind = { type: 'exact' };
const bool: Kind = { type: 'bool' };
const url: Kind = { type: 'url' };
const num: Kind = { type: 'number' };
const price: Kind = { type: 'price' };
const volts: Kind = { type: 'number', unit: 'voltage' };
const amps: Kind = { type: 'number', unit: 'current' };
const milliamps: Kind = { type: 'number', unit: 'current', scale: 1e-3 };
const milliwatts: Kind = { type: 'number', unit: 'power', scale: 1e-3 };
const hertz: Kind = { type: 'number', unit: 'frequency' };
const megahertz: Kind = { type: 'number', unit: 'frequency', scale: 1e6 };

const col = (header: string, kind: Kind, paths: string[], extra: Partial<ColumnSpec> = {}) => ({
  header,
  kind,
  paths,
  ...extra,
});

const name = col('(name)', text, ['name']);

const STATUS: Kind = {
  type: 'enum',
  map: {
    Active: ['active'],
    Alive: ['active'],
    Beta: ['beta', 'active'],
    Discontinued: ['discontinued', 'end-of-life'],
    'End of Life': ['end-of-life', 'discontinued'],
    'No Development': ['discontinued', 'end-of-life'],
    'Dead SEE Bekonix': ['discontinued', 'end-of-life'],
  },
};

const pixelTotal = (data: Record<string, unknown>) => {
  const count = getAt(data, 'outputs.count')[0];
  const per = getAt(data, 'outputs.pixels.max_per_output')[0];
  const out: unknown[] = [];
  if (typeof count === 'number' && typeof per === 'number') out.push(count * per);
  return out.concat(getAt(data, 'price[].pixels'));
};

const connectorNames = (data: Record<string, unknown>, ctx: DeriveContext) =>
  getAt(data, 'outputs.connector.ref').flatMap((ref) => ctx.connectorText.get(String(ref)) ?? []);

/** The sheet's "Phoenix Screw" / "Phoenix Plug" became a ref to the Phoenix COMBICON entry */
const phoenix: Kind = {
  type: 'custom',
  fn: (text, _mapped, view) => {
    const ref = getAt(view.entry.data, 'outputs.connector.ref')[0];
    if (/phoenix/i.test(text) && ref === 'mtsb-combicon') {
      // longest word first: /plug/ would leave "gable" of "pluggable"
      const extra = text.replace(/pluggable|phoenix|screw|plug/gi, '').trim();
      return extra ? undefined : { status: 'ok' };
    }
    return undefined;
  },
};

/** IC pin counts ("8", "8/10/14") must each appear in a package name (SOP8, QFN16) */
const packagePins: Kind = {
  type: 'custom',
  fn: (text, mapped) => {
    const want = text.match(/\d+/g);
    if (!want) return undefined;
    const pins = new Set(
      mapped
        .flatMap((m) => (Array.isArray(m) ? m : [m]))
        .flatMap((p) => String(p).match(/\d+$/) ?? [])
    );
    return want.every((n) => pins.has(n))
      ? { status: 'ok' }
      : { status: mapped.length ? 'differs' : 'missing' };
  },
};

/** Pixel-decoder "Outputs" words -> outputs.types enum (64a0d09) */
const decoderOutputs: Kind = {
  type: 'enum',
  map: {
    PWM: ['pwm'],
    Data: ['pixel-data'],
    'Pixel Data': ['pixel-data'],
    DMX: ['dmx512'],
    Relay: ['relay'],
  },
};

/** Inches in the sheet; YAML lengths carry their unit ('0.06in', '3mm') */
const LENGTH_MM: Record<string, number> = { um: 1e-3, µm: 1e-3, mm: 1, cm: 10, m: 1000, in: 25.4 };
const sheetInches: Kind = {
  type: 'custom',
  fn: (text, mapped) => {
    const inches = Number(text);
    if (!Number.isFinite(inches)) return undefined; // "variable", ranges, "2mm": text rules
    for (const m of mapped) {
      const q = String(m).match(/^~?(\d+(?:\.\d+)?)\s?(µm|um|mm|cm|m|in)$/);
      if (!q) continue;
      const mm = Number(q[1]) * LENGTH_MM[q[2]];
      if (Math.abs(mm - inches * 25.4) <= inches * 25.4 * 0.02) return { status: 'ok' };
    }
    return { status: mapped.length ? 'differs' : 'missing' };
  },
};

/** Tinted/Clear: T, C, T&C -> optical.tints */
const tints: Kind = {
  type: 'custom',
  fn: (text, mapped) => {
    const want = new Set<string>();
    if (/t/i.test(text)) want.add('tinted');
    if (/c/i.test(text)) want.add('clear');
    const have = new Set(mapped.flatMap((m) => (Array.isArray(m) ? m.map(String) : [String(m)])));
    if (!want.size) return undefined;
    return [...want].every((w) => have.has(w))
      ? { status: 'ok' }
      : { status: mapped.length ? 'differs' : 'missing' };
  },
};

/** Storage presence + kinds: data.storage, or a storage-ish physical input */
const storage = (data: Record<string, unknown>) => {
  const kinds = [
    ...getAt(data, 'data.storage[].type').map(String),
    ...getAt(data, 'inputs.physical@keys')
      .map(String)
      .filter((k) => /sd|storage|usb stick|flash/i.test(k)),
  ];
  return kinds.length ? [true, ...kinds] : [false];
};

/**
 * Controllers "Outputs": Single / Single or Clock (pins configurable) /
 * Single and Clock (dedicated clock pins), plus extras (DMX, SPI, long range).
 * YAML folds the clock part into outputs.clocked; extras must appear somewhere.
 */
const controllerOutputs: Kind = {
  type: 'custom',
  fn: (text, mapped, view) => {
    const t = text.toLowerCase().replace('singnal', 'single').replace(/&/g, 'and');
    const clocked = getAt(view.entry.data, 'outputs.clocked')[0];
    const clockOk = clocked === 'selectable' || clocked === 'always' || clocked === true;
    const wantsClock = /clock|spi|configurable|multiple/.test(t);
    if (wantsClock && !clockOk)
      return { status: 'differs', detail: 'sheet: clock-capable outputs' };
    // "SPI" in the sheet means clocked output (937d734 retired the jargon)
    const extras = t
      .replace(/single|signal|data|clock(ed)?|spi|and|or|configurable|multiple|ground/g, ' ')
      .replace(/[,/]/g, ' ')
      .trim();
    if (extras && coverage(extras, `${view.visible}\n${view.comments}`) < 0.85) {
      return { status: 'differs', detail: `not in YAML: "${extras}"` };
    }
    if (/single or clock/.test(t) || /single and clock/.test(t)) {
      // The pins-configurable vs dedicated-clock-pins distinction has no field
      return {
        status: 'ok',
        detail: t.includes(' or ') ? 'configurable pins' : 'dedicated clock pins',
      };
    }
    void mapped;
    return { status: 'ok' };
  },
};

/** Pattern-driver prices use the format `$0;"FOSS";"Free";@`: -1 = FOSS, 0 = Free. */
const pdPrice = (v: string | number | boolean) => (v === 0 ? 'Free' : v === -1 ? 'FOSS' : v);

const pixelRate: Kind = {
  type: 'derived',
  why: 'Computed (bitrate / pixel size); the site derives it at render time (a1cd65f stripped stored copies)',
};

export const COLUMNS: Record<string, ColumnSpec[]> = {
  'Pattern Drivers': [
    name,
    col('Developer', text, ['creator']),
    col('Price', price, ['pricing.price', 'pricing.tiers'], { transform: pdPrice }),
    col('Platform', text, ['platforms']),
    col('Live', bool, ['capabilities.live']),
    col('Designer', bool, ['capabilities.designer']),
    col('Visualizer', bool, ['capabilities.visualizer', 'capabilities.visualizer_notes']),
    col('ArtNet', text, ['outputs.protocols.artnet']),
    col('E1.31 sACN', text, ['outputs.protocols.sacn']),
    col('DMX', text, ['outputs.protocols.dmx', 'outputs.dmx_notes']),
    col('KiNet', text, ['outputs.protocols.kinet']),
    col('DDP', text, ['outputs.protocols.ddp']),
    col('GPIO', text, ['outputs.gpio', 'inputs.adc']),
    col('Serial', text, ['outputs.serial', 'outputs.serial_notes']),
    col('Video', text, ['inputs.video']),
    col('Audio', text, ['inputs.audio']),
    col('Programmatic', bool, ['capabilities.programmatic']),
    col('Language', text, ['language']),
    // Tag lists since the pattern-driver migration; prose in *_notes, and
    // items naming a typed field (ADC, Audio, DDP) moved to that field
    col('Other Inputs', text, ['inputs.other', 'inputs.other_notes', 'inputs.adc', 'inputs.audio']),
    col('Other Outputs', text, ['outputs.other', 'outputs.other_notes', 'outputs.protocols']),
    col('Integrations', text, ['integrations']),
    col('Notes', text, ['notes', 'technical_notes']),
    col('Demo/Free', bool, ['pricing.demo']),
    col('Status', STATUS, ['status']),
    col('URL', url, ['links.url', 'links.mirror']),
  ],

  Controllers: [
    name,
    col('Manufacturer', text, ['creator', 'manufacturers', 'vendors']),
    col('Max Pixels', num, [], {
      derive: pixelTotal,
      note: 'outputs.count x outputs.pixels.max_per_output (or price[].pixels)',
    }),
    col('Price', price, ['price', 'price[]']),
    col('Max outputs', num, ['outputs.count']),
    // Sorted on its own at some point: the values run alphabetically down the
    // price-sorted rows (" ", "ArtNet Ethernet", "Bluetooth" x4, ... "WiFi"),
    // so most cells describe some other controller. Only rows edited after
    // the sort are right, and those were researched anyway (ISSUES.md)
    col(
      'Interface',
      { type: 'dropped', why: 'Scrambled: the column was sorted apart from its rows' },
      ['inputs.physical', 'inputs.protocols', 'inputs.requires_host'],
      { note: 'Inputs were researched from vendor documentation instead' }
    ),
    col('Storage', bool, [], { derive: storage }),
    col('Standalone', bool, ['inputs.standalone']),
    col(
      'Pixel Types',
      {
        type: 'enum',
        map: { Both: ['selectable', true], Async: [false], Clocked: ['always', true] },
      },
      ['outputs.clocked']
    ),
    col('Max Voltage', volts, ['power.voltage.max']),
    col('Max Current', amps, ['power.current.max', 'outputs.current.max']),
    col('Buffered', bool, ['outputs.driver.buffered']),
    col('Output Connectors', phoenix, ['outputs.connector', 'power.connector'], {
      derive: connectorNames,
      note: 'String, or a ref into connectors (bd300fd); "Phoenix Screw/Plug" -> connectors/mtsb-combicon',
    }),
    col('Outputs', controllerOutputs, ['outputs.clocked'], {
      note: 'Folded into outputs.clocked (+ auxiliary/differential); configurable-vs-dedicated clock pins has no field',
    }),
    col('Waterproof / IP Rating', text, ['case.waterproof']),
    col('Auxilary Outputs', text, ['outputs.auxiliary@keys', 'outputs.auxiliary']),
    col('WLED', bool, ['wled_compatible', 'software.firmware']),
    col('Notes', text, ['notes', 'technical_notes', 'features']),
    col('Warranty', text, ['vendors[].warranty']),
    col('Introduction', num, ['release_year']),
    col('Status', STATUS, ['status']),
    col('Product URL', url, ['creator.page', 'vendors[].page', 'vendors[].url']),
  ],

  Pixels: [
    name,
    col('Colour Group', text, ['color.order']),
    col('LED Voltage', volts, ['electrical.led_voltage']),
    col('Clocked', bool, ['data.clocked']),
    col('VCC Voltage', volts, ['electrical.vcc_voltage']),
    col('PWM Frequency', hertz, ['color.pwm_frequency']),
    col('Brightness Bits', num, ['color.brightness_bits']),
    col('Data BitRate', hertz, ['data.bitrate']),
    col('Pixel Data Size', num, ['data.pixel_size_bits']),
    col('Pixel Rate Max', pixelRate, []),
    col('GPIO Min', volts, ['electrical.gpio.min']),
    col('GPIO Max', volts, ['electrical.gpio.max']),
    col('Wattage', milliwatts, ['electrical.wattage']),
    col('Channel Current', milliamps, ['electrical.channel_current']),
    col('Quiescent Current', milliamps, ['electrical.quiescent_current']),
    col('Package Size', text, ['physical.packages'], {
      note: 'Standardized package list (0bb3346)',
    }),
    col('Pin Count', num, ['physical.pin_count']),
    col('Data Type', text, ['data.type']),
    col('Backup Data Line', bool, ['data.backup_line']),
    col('Max pixel per string', text, ['data.max_per_string', 'data.max_per_string_notes']),
    col('Release Year', num, ['release_year']),
    col('NOTES', text, ['notes', 'technical_notes']),
    col('3rd Party Testing', url, ['datasheet.third_party_testing']),
    col('Original Manufacturer', text, ['creator', 'manufacturers']),
    col('Datasheet URL', url, ['datasheet.url', 'datasheet.sources[].url']),
    col('Other Links', url, ['other_links'], {
      note: 'Cell text is the linked page title; the hyperlink is the data',
    }),
  ],

  'Pixel ICs': [
    name,
    col('PWM Frequency', hertz, ['color.pwm_frequency']),
    col('Channels', num, ['data.channels']),
    col('Channel Bits', num, ['color.channel_bits']),
    col('Aggregate Bits', num, ['color.aggregate_bits']),
    col('Clocked', bool, ['data.clocked']),
    col('Data BitRate', hertz, ['data.bitrate']),
    col('Pixel Data Size', num, ['data.pixel_size_bits']),
    col('Pixel Rate Max', pixelRate, []),
    col('Output Voltage', volts, ['electrical.output_voltage']),
    col('Supply Voltage', volts, ['electrical.supply_voltage']),
    col('GPIO Min', volts, ['electrical.gpio.min']),
    col('GPIO Max', volts, ['electrical.gpio.max']),
    col('Max Current', milliamps, ['electrical.max_current']),
    col('Quiescent Current', milliamps, ['electrical.quiescent_current']),
    col('Package Size', text, ['physical.packages'], {
      note: 'Standardized package list (0bb3346)',
    }),
    col('Pin Count', packagePins, ['physical.packages'], {
      note: 'Pin counts now come from the package names (SOP8, QFN16, ...)',
    }),
    col('Data Type', text, ['data.type']),
    col('Backup Data Line', bool, ['data.backup_line']),
    col('Max pixel per string', text, ['data.max_per_string', 'data.max_per_string_notes']),
    col('Release Year', num, ['release_year']),
    col('NOTES', text, ['notes', 'technical_notes']),
    col('3rd Party Testing', url, ['datasheet.third_party_testing']),
    col('Datasheet URL', url, ['datasheet.url', 'datasheet.sources[].url']),
    col('Other Links', url, ['other_links'], {
      note: 'Cell text is the linked page title; the hyperlink is the data',
    }),
  ],

  'Pixel Decoders': [
    name,
    col('Manufacturer/Designer', text, ['creator', 'manufacturers']),
    col('Max Channels', num, ['outputs.count']),
    col('Pixel Types', text, ['inputs.protocols', 'outputs.types', 'notes'], {
      note: 'Free-text description of what the decoder does; structured as inputs.protocols + outputs.types (64a0d09), the prose in notes',
    }),
    col('Unit Price (USD)', price, ['price']),
    col('Output Connectors', phoenix, ['outputs.connector'], { derive: connectorNames }),
    col('Outputs', decoderOutputs, ['outputs.types']),
    col('DIY/OTS', text, ['diy_or_ots']),
    col('Notes', text, ['notes']),
    col('Product URL', text, ['links.product'], { note: 'One cell lists two URLs' }),
    // Columns K-N have no header; one row (PixFog) has its last three values
    // shifted three columns right (DIY/OTS, Notes, Product URL).
    col('(K, no header)', text, ['notes']),
    col('(L, no header: shifted DIY/OTS)', text, ['diy_or_ots']),
    col('(M, no header: shifted Notes)', text, ['notes']),
    col('(N, no header: shifted Product URL)', url, ['links.product']),
  ],

  'Level Converters': [
    name,
    col('Manufacturer', text, ['creator', 'manufacturers']),
    col('Channels', num, ['io.channels']),
    col('Interface', text, ['io.interface']),
    col('Notes', text, ['notes']),
    col('Price', price, ['price', 'price[]']),
    col('Max Voltage', volts, ['electrical.max_voltage']),
    col('Max Current', amps, ['electrical.max_current']),
    col('Buffered', bool, ['io.buffered']),
    col('Product URL', url, ['links.product']),
  ],

  Adapters: [
    name,
    col('Manufacturer/Designer', text, ['creator', 'manufacturers']),
    col('Max Channels', num, ['outputs.max_channels']),
    col('Pixel Types', text, ['outputs.pixel_types']),
    col('Max Voltage', volts, ['power.voltage']),
    col('Max LED Current', amps, ['power.current']),
    col('Parent', text, ['parent']),
    col('Unit Price (USD)', price, ['price']),
    col('Output Connectors', text, ['outputs.connectors']),
    col('(J, no header)', text, ['outputs.description', 'power.voltage'], {
      note: 'Stray values (F40D-B "Differential", Pi Hat 12)',
    }),
    col('Outputs', text, ['outputs.description']),
    col('DIY/OTS', text, ['diy_or_ots']),
    col('Notes', text, ['notes']),
    col('Product URL', url, ['links.product']),
    col('(O, no header)', url, ['links.product'], { note: 'One stray URL' }),
  ],

  'DIY MicroBoards': [
    name,
    col('Manufacturer', text, ['creator', 'manufacturers']),
    col('SoC', text, ['compute.soc']),
    col('CPU', text, ['compute.cpu']),
    col('ISA', text, ['compute.isa']),
    col('Clock Speed', megahertz, ['compute.clock_speed']),
    col('Flash', text, ['compute.flash']),
    col('RAM', text, ['compute.ram']),
    col('Linux', bool, ['compute.linux']),
    col('Max outputs', num, ['io.max_outputs']),
    col('Minimum Input Voltage', volts, ['power.voltage.min']),
    col('Max Input Voltage', volts, ['power.voltage.max']),
    col('GPIO Voltage', volts, ['power.gpio_voltage']),
    col('USB', bool, ['connectivity.usb']),
    col('TTL Serial', bool, ['connectivity.serial']),
    col('Wi-Fi', bool, ['connectivity.wifi']),
    col('PoE', bool, ['connectivity.poe']),
    col('Ethernet', bool, ['connectivity.ethernet']),
    col('Bluetooth', bool, ['connectivity.bluetooth']),
    col('Storage', bool, ['io.storage']),
    col('BMS', bool, ['io.bms']),
    col('IMU', bool, ['io.imu']),
    col('Unit Price (USD)', price, ['price']),
    col('Release Year', num, ['release_year']),
    col('Product URL', url, ['creator.page', 'vendors[].url', 'vendors[].page']),
    col('Notes', text, ['notes']),
  ],

  Connectors: [
    col('Picture', text, ['name'], { note: 'Name column; its hyperlink is the picture URL' }),
    col('Manufacturer', text, ['creator', 'manufacturers']),
    col('Link', url, ['links.product']),
    col('Outline', text, ['mechanical.outline']),
    col('Max Current', amps, ['ratings.max_current', 'ratings.max_current_notes']),
    col('Max Voltage', volts, ['ratings.max_voltage']),
    col('IP Rating', bool, ['ratings.ip_rating', 'ratings.ip_rating_notes']),
    col('Locking', text, ['mechanical.locking']),
    col('Panelmount', bool, ['mechanical.panel_mount']),
    col('Wire -To -Wire', bool, ['mechanical.wire_to_wire']),
    col('PCB mount', bool, ['mechanical.pcb_mount']),
    col('Smallest Guage', text, ['termination.smallest_gauge']),
    col('Largest Guage', text, ['termination.largest_gauge']),
    col('Pitch', num, ['mechanical.pitch']),
    col('Contact Type', text, ['mechanical.contact_type']),
    col('Solder?', bool, ['termination.solder']),
    col('Screw Terminal?', bool, ['termination.screw_terminal']),
    col('Crimp?', bool, ['termination.crimp']),
    col('IDC?', bool, ['termination.idc']),
    col('Board Fingers', bool, ['mechanical.board_fingers']),
    col('Gendered', bool, ['mechanical.gendered']),
    col('Min Pins', num, ['mechanical.min_pins']),
    col('Max Pins', num, ['mechanical.max_pins']),
    col('Rows', text, ['mechanical.rows']),
    col('Year Intoduced', num, ['year_introduced']),
    col('End of Life', text, ['status'], { note: 'Empty in the sheet' }),
    col('Pinout', text, ['wiring.pinout']),
    col('Convention', text, ['wiring.convention']),
    col('Colors', text, ['wiring.colors']),
    col('Digikey', url, ['links.digikey']),
    col('Mouser', url, ['links.mouser']),
    col('Notes', text, ['notes', 'technical_notes', 'common_applications', 'aliases']),
  ],

  'Drive Libraries': [
    name,
    col('Developer', text, ['creator']),
    col('Hardware', text, ['hardware', 'platforms']),
    col('Features', text, ['features', 'supported_ics', 'protocols']),
    col('URL', url, ['links.repo']),
    col('YouTube', url, ['links.youtube']),
    col('Instructional Resources', url, ['instructional_resources']),
    col('Instructional Resources (2)', url, ['instructional_resources']),
  ],

  'Diffusive Materials': [
    name,
    col('URL', url, ['links.product']),
    col('Color Rendition', num, ['optical.color_rendition']),
    col('Light Transmission', num, ['optical.light_transmission']),
    col('Flexible/Rigid', { type: 'enum', map: { F: [true], R: [false] } }, ['physical.flexible']),
    col('Purpose Made ?', bool, ['purpose_made']),
    col('Properties', text, ['optical.properties']),
    col('Fire Retardent?', bool, ['physical.fire_retardant']),
    col('Tinted/Clear', tints, ['optical.tints']),
    col('Sample thickness (inches)', sheetInches, ['physical.sample_thickness'], {
      note: 'Inches in the sheet; a length with its unit in YAML (2c469a1)',
    }),
    col('Diffusivity', num, ['optical.diffusivity']),
    col('Sizes Available', text, ['physical.sizes_available']),
    col('Material Type', text, ['materials', 'form', 'notes'], {
      note: 'Polymer names became material codes (PET, PMMA, ...) and a form (2c469a1)',
    }),
    col('Usage Notes', text, ['notes']),
    col('$', exact, ['pricing.price_range']),
  ],

  'Commercial Pixel Systems': [
    name,
    col('Manufacturer', text, ['creator', 'manufacturers']),
    col('Pixels Per Run', num, ['specs.pixels_per_run']),
    col('Dimming Resolution', text, ['specs.dimming_resolution']),
    col('Dedicated PSU/control', bool, ['specs.dedicated_psu']),
    col('RGB/W', text, ['specs.color_type']),
    col('Online Pricing', text, ['pricing.online_pricing', 'pricing.examples']),
    col('Price Range', exact, ['pricing.price_range']),
    col('Core Tech', text, ['core_tech']),
    col('Since', num, ['since']),
    col('Target Market', text, ['target_market']),
    col('NOTES', text, ['notes']),
  ],
};

/** Header cells known to be overwritten in the live sheet (vandalism / stray pastes). */
export const KNOWN_BAD_HEADERS: Record<string, Record<number, string>> = {
  Controllers: { 0: '?>' },
  Pixels: { 0: 'li' },
  'Level Converters': { 0: '206' },
  'Drive Libraries': { 0: '3' },
};
