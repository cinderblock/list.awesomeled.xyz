#!/usr/bin/env bun
/**
 * Pixels and pixel ICs share one vocabulary for color depth and supply.
 *
 * - Bits per channel: pixels' color.brightness_bits and pixel ICs'
 *   color.channel_bits were the same fact under two names -> channel_bits in
 *   both, an integer or a list of selectable depths ("8/12/14/16" ->
 *   [8, 12, 14, 16]).
 * - Extra brightness control ("8+5", "16+5", brightness_method pwm / current
 *   / global / per_channel, which mixed how it works with what it applies
 *   to) -> color.brightness_control { bits, method: pwm | current, scope:
 *   global | per_channel, notes }.
 * - Pixel ICs' aggregate_bits is dropped: it is channel_bits x channels where
 *   right, and a copy of channel_bits on most rows; the GS820x "12" (12-bit
 *   gamma correction) moves to channel_bits_notes.
 * - Pixels' electrical.vcc_voltage -> supply_voltage, the pixel ICs' name.
 */

import { getJS, migrateCategory, orderKeys, remove, renameKey, setJS } from './lib';

interface Source {
  url?: string;
  notes?: string;
}

interface Control {
  bits: number;
  method?: 'pwm' | 'current';
  scope: 'global' | 'per_channel';
  notes?: string;
}

// Every pixel with extra brightness control, from its bits / method / notes
// (the 16-bit parts' 5-bit gain is per color: e9fd68f9, from the datasheets)
const CONTROL: Record<string, Control> = {
  apa102: { bits: 5, method: 'pwm', scope: 'global', notes: 'a 400 Hz PWM overlaid on the LEDs' },
  apa102c: { bits: 5, method: 'pwm', scope: 'global', notes: 'a 400 Hz PWM overlaid on the LEDs' },
  apa107: { bits: 5, scope: 'global', notes: 'likely by LED current, like SK9822' },
  ge8822: {
    bits: 5,
    method: 'current',
    scope: 'global',
    notes: 'sets the current of all three outputs together',
  },
  hd107s: { bits: 5, scope: 'global' },
  hd108: { bits: 5, method: 'current', scope: 'per_channel' },
  'lc2823-2020': { bits: 5, scope: 'global' },
  lc8823: { bits: 5, scope: 'global' },
  ns107s: { bits: 5, scope: 'global' },
  ns108: { bits: 5, method: 'current', scope: 'per_channel' },
  ns108e: { bits: 5, method: 'current', scope: 'per_channel' },
  sk9822: { bits: 5, method: 'current', scope: 'global', notes: "not PWM, unlike APA102's" },
  sk9826: { bits: 5, method: 'current', scope: 'per_channel' },
  ws2816: { bits: 5, scope: 'per_channel' },
};

// Notes that describe the channel depth, not extra brightness control
const DEPTH_NOTES: Record<string, string> = {
  gs8208: '12-bit gamma correction per colour (36 bits interpolated)',
};

function bitsList(v: unknown): number | number[] | undefined {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return undefined;
  const parts = v.split('/').map((s) => Number(s.trim()));
  if (parts.some((n) => !Number.isInteger(n))) return undefined;
  return parts.length === 1 ? parts[0] : parts;
}

const px = migrateCategory('pixels', (doc, { id }) => {
  let touched = false;
  const fail = (what: string, v: unknown) => {
    throw new Error(`pixels/${id}: ${what} ${JSON.stringify(v)}`);
  };

  const b = getJS(doc, ['color', 'brightness_bits']);
  if (b !== undefined) {
    const depth = typeof b === 'string' ? Number(b.split('+')[0]) : b;
    if (!Number.isInteger(depth)) fail('brightness_bits', b);
    if (typeof b === 'string' && !CONTROL[id]) fail('brightness_bits without a control mapping', b);
    renameKey(doc, ['color'], 'brightness_bits', 'channel_bits');
    setJS(doc, ['color', 'channel_bits'], depth);
    touched = true;
  }
  const method = getJS(doc, ['color', 'brightness_method']);
  const notes = getJS(doc, ['color', 'brightness_method_notes']);
  if (CONTROL[id]) {
    const c = CONTROL[id];
    setJS(doc, ['color', 'brightness_control'], {
      bits: c.bits,
      ...(c.method ? { method: c.method } : {}),
      scope: c.scope,
      ...(c.notes ? { notes: c.notes } : {}),
    });
    touched = true;
  } else if (method !== undefined) fail('brightness_method without a control mapping', method);
  if (DEPTH_NOTES[id]) {
    setJS(doc, ['color', 'channel_bits_notes'], DEPTH_NOTES[id]);
    touched = true;
  } else if (notes !== undefined && !CONTROL[id]) fail('brightness_method_notes', notes);
  if (remove(doc, ['color', 'brightness_method'])) touched = true;
  if (remove(doc, ['color', 'brightness_method_notes'])) touched = true;

  if (renameKey(doc, ['electrical'], 'vcc_voltage', 'supply_voltage')) touched = true;
  if (renameKey(doc, ['electrical'], 'vcc_voltage_notes', 'supply_voltage_notes')) touched = true;

  // Provenance follows the renamed fields
  for (const [from, to] of [
    ['color.brightness_bits', 'color.channel_bits'],
    ['color.brightness_method', 'color.brightness_control'],
    ['electrical.vcc_voltage', 'electrical.supply_voltage'],
  ]) {
    if (renameKey(doc, ['sources'], from, to)) touched = true;
  }

  touched =
    orderKeys(
      doc,
      ['color'],
      [
        'order',
        'channel_bits',
        'channel_bits_notes',
        'brightness_control',
        'pwm_frequency',
        'pwm_frequency_notes',
      ]
    ) || touched;
  return touched;
});

// GS820x: "aggregate bits 12" with 8-bit channels is the 12-bit gamma stage
const IC_DEPTH_NOTES: Record<string, string> = {
  gs8202: '12-bit gamma correction per colour',
  gs8206: '12-bit gamma correction per colour',
  gs8208: '12-bit gamma correction per colour',
};

// Newstar's ICs inside the HD107S / HD108 LEDs (b4dc7499): the same control
// as those pixels, from the NS107S / NS108 frame descriptions
const IC_CONTROL: Record<string, Control> = {
  ns107s: { bits: 5, scope: 'global' },
  ns108: { bits: 5, method: 'current', scope: 'per_channel' },
};

const ics = migrateCategory('pixel-ics', (doc, { id }) => {
  let touched = false;
  const ch = getJS(doc, ['color', 'channel_bits']);
  if (typeof ch === 'string') {
    const list = bitsList(ch);
    if (list === undefined) throw new Error(`pixel-ics/${id}: channel_bits ${ch}`);
    setJS(doc, ['color', 'channel_bits'], list);
    touched = true;
  }
  const agg = getJS(doc, ['color', 'aggregate_bits']);
  if (agg !== undefined) {
    const channels = getJS(doc, ['data', 'channels']);
    const bits = getJS(doc, ['color', 'channel_bits']);
    const derivable =
      agg === bits ||
      (typeof bits === 'number' && typeof channels === 'number' && agg === bits * channels);
    if (!derivable && !IC_DEPTH_NOTES[id])
      throw new Error(`pixel-ics/${id}: aggregate_bits ${agg}`);
    if (IC_DEPTH_NOTES[id]) setJS(doc, ['color', 'channel_bits_notes'], IC_DEPTH_NOTES[id]);
    remove(doc, ['color', 'aggregate_bits']);
    touched = true;
  }
  // Its evidence stays, with the depth it confirmed
  const aggSource = getJS(doc, ['sources', 'color.aggregate_bits']) as Source | undefined;
  if (aggSource !== undefined) {
    const chSource = getJS(doc, ['sources', 'color.channel_bits']) as Source | undefined;
    if (chSource === undefined) {
      renameKey(doc, ['sources'], 'color.aggregate_bits', 'color.channel_bits');
    } else if (chSource.url === aggSource.url) {
      const notes = [chSource.notes, aggSource.notes].filter(Boolean).join('; ');
      setJS(doc, ['sources', 'color.channel_bits', 'notes'], notes);
      remove(doc, ['sources', 'color.aggregate_bits']);
    } else throw new Error(`pixel-ics/${id}: sources for both channel_bits and aggregate_bits`);
    touched = true;
  }
  // ICs with extra brightness control carry it like the LEDs built on them
  // (brightness_bits here is the extra control's width, not the depth)
  if (IC_CONTROL[id]) {
    const c = IC_CONTROL[id];
    setJS(doc, ['color', 'brightness_control'], {
      bits: c.bits,
      ...(c.method ? { method: c.method } : {}),
      scope: c.scope,
    });
    remove(doc, ['color', 'brightness_bits']);
    remove(doc, ['color', 'brightness_method']);
    for (const from of ['color.brightness_bits', 'color.brightness_method'])
      renameKey(doc, ['sources'], from, 'color.brightness_control');
    touched = true;
  }
  if (getJS(doc, ['color', 'brightness_bits']) !== undefined)
    throw new Error(`pixel-ics/${id}: brightness_bits`);
  if (getJS(doc, ['color', 'brightness_method']) !== undefined)
    throw new Error(`pixel-ics/${id}: brightness_method`);
  touched =
    orderKeys(
      doc,
      ['color'],
      [
        'channel_bits',
        'channel_bits_notes',
        'brightness_control',
        'pwm_frequency',
        'pwm_frequency_notes',
      ]
    ) || touched;
  return touched;
});
console.log(`pixels: ${px.length}, pixel-ics: ${ics.length} entries migrated`);
