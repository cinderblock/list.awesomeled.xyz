#!/usr/bin/env bun
/**
 * Commercial systems and level converters: typed fields.
 *
 * Commercial systems
 * - since -> release_year (the name every other category uses)
 * - specs.color_type "RGB W/WW", "RGB/RGBW/WW", "RGB/W" -> a list of color
 *   types (RGB, RGBW, W, WW, CTA); one type stays a plain value
 * - specs.dimming_resolution "8 Bit" / "16bit or 8 bit" -> dimming_bits (an
 *   integer, or a list when selectable), qualifiers in dimming_notes
 * - pricing.online_pricing (deprecated free text) -> a pricing.examples
 *   entry, marked as the original spreadsheet's figure
 * - a creator recorded as a bare URL -> name + url
 *
 * Level converters
 * - io.interface held packages ("PDIP largest", "SOT 23", "Through-Hole
 *   DIP") or signalling ("Differential Pairs"). Packages get their own
 *   field (physical.packages, filled from datasheets in the next commit);
 *   signalling becomes io.differential.
 * - electrical.max_voltage: a bare 6 -> "6V"; max_current -> output_current (it is
 *   the drive per output, not a supply limit)
 */

import { isSeq } from 'yaml';
import { getJS, migrateCategory, remove, renameKey, setJS } from './lib';

const COLOR: Record<string, string[]> = {
  'RGB W/WW': ['RGB', 'W', 'WW'],
  'RGB/RGBW/WW': ['RGB', 'RGBW', 'WW'],
  'RGB/W': ['RGB', 'W'],
  'RGB/RGBW/CTA': ['RGB', 'RGBW', 'CTA'],
};
const COLOR_TYPES = new Set(['RGB', 'RGBW', 'W', 'WW', 'CTA']);

const cs = migrateCategory('commercial-systems', (doc, { id }) => {
  let touched = false;
  const fail = (what: string, v: unknown) => {
    throw new Error(`commercial-systems/${id}: ${what} ${JSON.stringify(v)}`);
  };

  if (getJS(doc, ['since']) !== undefined) {
    const year = getJS(doc, ['since']);
    remove(doc, ['since']);
    setJS(doc, ['release_year'], year); // inserted at its lint-enforced place
    touched = true;
  }

  const color = getJS(doc, ['specs', 'color_type']);
  if (typeof color === 'string' && !COLOR_TYPES.has(color)) {
    if (!COLOR[color]) fail('color_type', color);
    setJS(doc, ['specs', 'color_type'], COLOR[color]);
    touched = true;
  }

  const dim = getJS(doc, ['specs', 'dimming_resolution']);
  if (dim !== undefined) {
    if (typeof dim !== 'string') fail('dimming_resolution', dim);
    const bits = [...(dim as string).matchAll(/(\d+)\s*-?\s*bit/gi)]
      .map((m) => Number(m[1]))
      .sort((a, b) => a - b);
    if (bits.length === 0) fail('dimming_resolution', dim);
    const note = (dim as string).match(/\((.+)\)/)?.[1];
    renameKey(doc, ['specs'], 'dimming_resolution', 'dimming_bits');
    setJS(doc, ['specs', 'dimming_bits'], bits.length === 1 ? bits[0] : bits);
    if (note) setJS(doc, ['specs', 'dimming_notes'], note);
    touched = true;
  }

  const online = getJS(doc, ['pricing', 'online_pricing']);
  if (online !== undefined) {
    if (online !== 'RGB €120 per lamp') fail('online_pricing', online);
    remove(doc, ['pricing', 'online_pricing']);
    const example = {
      item: 'RGB lamp',
      pixels: 1,
      price: { amount: 120, currency: 'EUR' },
      notes: 'The original spreadsheet\'s "RGB €120 per lamp" (undated, no source)',
    };
    // Append, so the existing examples keep their exact text
    const seq = doc.getIn(['pricing', 'examples'], true);
    if (isSeq(seq)) seq.items.push(doc.createNode(example));
    else setJS(doc, ['pricing', 'examples'], [example]);
    touched = true;
  }

  const creator = getJS(doc, ['creator']);
  if (typeof creator === 'string' && /^https?:\/\//.test(creator)) {
    if (creator !== 'https://www.lucenti.lighting/products') fail('creator', creator);
    setJS(doc, ['creator'], { name: 'Lucenti', url: 'https://www.lucenti.lighting/' });
    touched = true;
  }
  return touched;
});

const lc = migrateCategory('level-converters', (doc, { id }) => {
  let touched = false;
  const iface = getJS(doc, ['io', 'interface']);
  if (iface !== undefined) {
    remove(doc, ['io', 'interface']);
    if (iface === 'Differential Pairs') setJS(doc, ['io', 'differential'], true);
    else if (!['PDIP largest', 'Through-Hole DIP', 'SOT 23'].includes(String(iface))) {
      throw new Error(`level-converters/${id}: io.interface ${JSON.stringify(iface)}`);
    }
    touched = true;
  }
  if (renameKey(doc, ['electrical'], 'max_current', 'output_current')) touched = true;
  const max = getJS(doc, ['electrical', 'max_voltage']);
  if (typeof max === 'number') {
    setJS(doc, ['electrical', 'max_voltage'], `${max}V`);
    touched = true;
  }
  return touched;
});
console.log(`commercial-systems: ${cs.length}, level-converters: ${lc.length} entries migrated`);
