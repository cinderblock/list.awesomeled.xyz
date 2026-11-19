#!/usr/bin/env bun
/**
 * Pixel decoders: structured outputs (plans/database-review.md).
 *
 * The sheet's columns landed in mis-named fields: `outputs.pixel_types` held
 * a free-text description of what the device does, `outputs.description`
 * held the output kind (Data / DMX / PWM / Relay), `outputs.connectors` a
 * free-text connector, `outputs.max_channels` the channel count. They become:
 *
 *   outputs.count      (was max_channels; a DMX512 output = 1 per universe)
 *   outputs.types      enum list: pixel-data, dmx512, pwm, relay, servo, power
 *   outputs.connector  common.json output_connector (ref when in connectors/)
 *   notes              the function description, prepended
 *
 * Mapping is per entry (12 entries) so nothing is guessed by pattern.
 * PixFog's "single" / "Pixel Data" came from a shifted sheet row and are
 * dropped rather than mapped.
 */

import { getJS, migrateCategory, remove, setJS } from './lib';

interface Mapping {
  count?: number;
  types?: string[];
  connector?: string | { ref: string; notes?: string };
  /** Function description (replaces outputs.pixel_types), prepended to notes */
  does?: string;
}

const MAP: Record<string, Mapping> = {
  attiny10: {
    count: 1,
    types: ['pixel-data'],
    connector: 'Solder pads / breakout',
    does: 'Drives 3-wire clockless LEDs from a 4-wire clocked protocol. Experimental.',
  },
  'controller-changeover': {
    count: 2,
    types: ['pixel-data'],
    connector: { ref: 'mtsb-combicon' },
    does: 'WLED override from other pixel control to a single output.',
  },
  'led-strip-driver-module': {
    count: 3,
    types: ['pwm'],
    connector: 'Screw terminal',
    does: 'WS2811 to high-current MOSFET outputs.',
  },
  neopixelbooster: {
    types: ['power'],
    connector: 'Solder pads',
    does: 'Inline 5 V buck converter.',
  },
  'pixel-2-dmx': {
    count: 1,
    types: ['dmx512'],
    connector: { ref: 'xlr-3', notes: 'xConnect pixel-data input' },
    does: 'WS28xx pixel data to DMX512 (512 channels).',
  },
  'pixel-2-things-relay': {
    count: 9,
    types: ['relay'],
    connector: 'Screw terminal',
    does: 'Converts pixel data into relay drivers capable of switching 120 VAC.',
  },
  'pixel-2-things-servo': {
    count: 15,
    types: ['pwm', 'servo'],
    connector: { ref: 'mtsb-combicon' },
    does: 'Converts pixel data into hobby servo outputs.',
  },
  'pixel-data-isolator': {
    count: 1,
    types: ['pixel-data'],
    connector: 'Solder pads',
    does: 'Provides a 5 kV isolated data connection from controller to LEDs when each is powered separately.',
  },
  'pixfog-pixel-based-fog-controller': {
    count: 1,
    connector: { ref: 'mtsb-combicon' },
  },
  'quinled-dig2analog': {
    count: 4,
    types: ['pwm'],
    connector: 'Screw terminal',
    does: 'WS2814 to RGBW PWM MOSFET outputs.',
  },
  'ws2811-mosfet-driver': {
    count: 3,
    types: ['pwm'],
    does: 'WS2811 to high-current MOSFET outputs.',
  },
  'ws2811-mosfetdriver': {
    count: 3,
    types: ['pwm'],
    does: 'WS2811 to high-current MOSFET outputs.',
  },
};

const changed = migrateCategory('pixel-decoders', (doc, { id }) => {
  if (!doc.hasIn(['outputs', 'pixel_types']) && !doc.hasIn(['outputs', 'max_channels'])) {
    return false; // already migrated
  }
  const m = MAP[id];
  if (!m) throw new Error(`pixel-decoders/${id}: no mapping`);

  for (const old of ['max_channels', 'pixel_types', 'connectors', 'description']) {
    remove(doc, ['outputs', old]);
  }
  if (m.count !== undefined) setJS(doc, ['outputs', 'count'], m.count);
  if (m.types) setJS(doc, ['outputs', 'types'], m.types);
  if (m.connector) setJS(doc, ['outputs', 'connector'], m.connector);

  if (m.does) {
    const notes = getJS(doc, ['notes']);
    setJS(doc, ['notes'], typeof notes === 'string' ? `${m.does} ${notes}` : m.does);
  }
  return true;
});
console.log(`pixel-decoders: ${changed.length} entries migrated`);
