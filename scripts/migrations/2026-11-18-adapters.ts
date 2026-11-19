#!/usr/bin/env bun
/**
 * Adapters adopt the controllers' output and power shapes
 * (common.json pixel_outputs / power_input), TODO "Standardize Async /
 * clocked".
 *
 * - outputs.pixel_types ("Single", "Single or Clocked", "single +clocked",
 *   "Single (8) or Clocked (6)", ...) and outputs.description (the sheet's
 *   normalized copy: Single / Both / Clocked) -> outputs.clocked
 *   (false | selectable | always), the vocabulary controllers already use
 * - outputs.max_channels -> outputs.count; DMX-only adapters get
 *   outputs.auxiliary.DMX512 instead, the PWM board auxiliary.PWM, the HUB75
 *   panel driver outputs.protocols [HUB75]
 * - outputs.connectors -> outputs.connector, spelling normalized but kept as
 *   text (connector refs are cross-links' to set)
 * - power.voltage / power.current strings ("12V", "15A", the sheet's max
 *   columns) -> power.voltage.max / power.current.max in volts / amps
 * - diy_or_ots: "Both" -> both; Pi Hat's shifted-row "Yes" is dropped
 *
 * Pi Hat's row is shifted in the sheet; its unmappable values (3200
 * channels, "2", "Both", "Multiple") are dropped here and replaced from
 * research in a separate commit. `parent` is untouched (cross-links).
 */

import { isScalar } from 'yaml';
import { getJS, migrateCategory, remove, setJS } from './lib';

type Clocked = false | 'selectable' | 'always';

const CLOCKED: Record<string, Clocked> = {
  single: false,
  Single: false,
  Clocked: 'always',
  Both: 'selectable',
  'Single or Clocked': 'selectable',
  'Single+Clocked': 'selectable',
  'Single and Clocked': 'selectable',
  'single +clocked': 'selectable',
  'Single (8) or Clocked (6)': 'selectable',
};

// pixel_types / description values that aren't a pixel signal type
const NOT_PIXEL = new Set([
  'Panel',
  'Fet power output',
  '1 Universe Artnet to DMX Node',
  'DMX - allows easy control of DMX-512 devices from Pi',
  '2',
]);

const CONNECTOR: Record<string, string | null> = {
  Solder: 'Solder pads',
  solder: 'Solder pads',
  'Screw Terminals': 'Screw terminals',
  'screw Terminals': 'Screw terminals',
  'Screw Terminal': 'Screw terminals',
  Screw: 'Screw terminals',
  'Phoenix Screw': 'Phoenix Screw',
  'RJ-45': 'RJ45',
  'Poke Home': 'Poke-home terminals',
  'IP67 plug': 'IP67 plug',
  HUB75: 'HUB75',
  JST: 'JST',
  'XLR3/5': 'XLR-3 / XLR-5',
  Both: null, // Pi Hat's shifted row
};

const DIY: Record<string, string | null> = { DIY: 'DIY', OTS: 'OTS', Both: 'both', Yes: null };

const number = (v: unknown, unit: string): number | undefined => {
  if (typeof v === 'number') return v;
  const m = typeof v === 'string' ? v.match(new RegExp(`^(\\d+(?:\\.\\d+)?)${unit}$`)) : null;
  return m ? Number(m[1]) : undefined;
};

const changed = migrateCategory('adapters', (doc, { id }) => {
  const legacy = ['max_channels', 'pixel_types', 'connectors', 'description'].some((k) =>
    doc.hasIn(['outputs', k])
  );
  const power = getJS(doc, ['power']) as Record<string, unknown> | undefined;
  const legacyPower =
    power && (typeof power.voltage !== 'object' || typeof power.current !== 'object');
  const diy = getJS(doc, ['diy_or_ots']);
  if (!legacy && !legacyPower && !(typeof diy === 'string' && diy in DIY && DIY[diy] !== diy)) {
    return false;
  }

  // --- outputs
  const max = getJS(doc, ['outputs', 'max_channels']);
  const types = getJS(doc, ['outputs', 'pixel_types']);
  const desc = getJS(doc, ['outputs', 'description']);
  const conn = getJS(doc, ['outputs', 'connectors']);
  for (const k of ['max_channels', 'pixel_types', 'connectors', 'description']) {
    remove(doc, ['outputs', k]);
  }

  const signal = [types, desc].filter((v): v is string => typeof v === 'string');
  const clocked = signal
    .filter((s) => !NOT_PIXEL.has(s))
    .map((s) => {
      if (!(s in CLOCKED)) throw new Error(`adapters/${id}: unmapped pixel type "${s}"`);
      return CLOCKED[s];
    });
  if (new Set(clocked).size > 1) {
    throw new Error(`adapters/${id}: conflicting pixel types ${JSON.stringify(signal)}`);
  }

  if (id === 'artgateone' || id === 'rasppi-isolated-dmx') {
    setJS(doc, ['outputs', 'auxiliary'], { DMX512: 1 });
  } else if (id === 'wemos-pwm-rgb-w-led-driver-board') {
    setJS(doc, ['outputs', 'auxiliary'], { PWM: max });
  } else if (id === 'pi-hat') {
    // shifted sheet row: 3200 / "2" aren't output counts; fixed from research
  } else {
    if (typeof max === 'number') setJS(doc, ['outputs', 'count'], max);
    if (id === 'pocketscroller-v2') setJS(doc, ['outputs', 'protocols'], ['HUB75']);
    if (clocked.length) setJS(doc, ['outputs', 'clocked'], clocked[0]);
    if (types === 'Single (8) or Clocked (6)') {
      const n = doc.getIn(['outputs', 'clocked'], true);
      if (isScalar(n)) n.comment = ' 8 single-wire or 6 clocked outputs';
    }
  }
  if (id === '4-channel-differential-transmitter') setJS(doc, ['outputs', 'differential'], true);

  if (typeof conn === 'string') {
    if (!(conn in CONNECTOR)) throw new Error(`adapters/${id}: unmapped connector "${conn}"`);
    const c = CONNECTOR[conn];
    if (c) setJS(doc, ['outputs', 'connector'], c);
  }
  if (doc.hasIn(['outputs']) && (getJS(doc, ['outputs']) as object | null) === null) {
    remove(doc, ['outputs']);
  }

  // --- power (sheet columns were "Max Voltage" / "Max LED Current")
  if (power && legacyPower) {
    const v = power.voltage;
    const a = power.current;
    remove(doc, ['power']);
    if (v === '5V / 12-24V (jumper-selectable)') {
      setJS(doc, ['power', 'voltage'], { min: 5, max: 24 });
      const n = doc.getIn(['power', 'voltage', 'min'], true);
      if (isScalar(n)) n.comment = ' 5 V or 12-24 V, jumper-selectable';
    } else if (v !== undefined) {
      const volts = number(v, 'V');
      if (volts === undefined) throw new Error(`adapters/${id}: voltage "${v}"`);
      setJS(doc, ['power', 'voltage', 'max'], volts);
    }
    if (a !== undefined) {
      const amps = number(a, 'A');
      if (amps === undefined) throw new Error(`adapters/${id}: current "${a}"`);
      setJS(doc, ['power', 'current', 'max'], amps);
    }
  }

  // --- diy_or_ots
  if (typeof diy === 'string') {
    if (!(diy in DIY)) throw new Error(`adapters/${id}: diy_or_ots "${diy}"`);
    if (DIY[diy] === null) remove(doc, ['diy_or_ots']);
    else setJS(doc, ['diy_or_ots'], DIY[diy]);
  }

  // --- Pi Hat: drop the shifted row's non-URL "link"
  if (getJS(doc, ['links', 'product']) === 'Multiple') remove(doc, ['links', 'product']);
  return true;
});
console.log(`adapters: ${changed.length} entries migrated`);
