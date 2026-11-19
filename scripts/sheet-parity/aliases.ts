/**
 * Sheet rows that can't be paired with their YAML entry automatically.
 *
 * Rows pair up by name, or by a product URL the entry also carries, scored by
 * how much of the row's content the entry holds (so mislabeled and duplicate
 * rows go to the right place). This table covers the rest: keyed by tab, then
 * by the sheet's trimmed column-A text, valued with the `<category>/<slug>`
 * the row's data lives at now.
 */

export const ALIASES: Record<string, Record<string, string>> = {
  Controllers: {
    // Split into Baldrick8 / Baldrick17 / Baldrick DMX by Cameron (04a47e8);
    // the sheet row's 8 outputs / Ethernet / $75 is the Baldrick8
    'Baldrick Board': 'controllers/baldrick-8',
    // Misidentified in the sheet; resolved in a61acdb
    LEDEddy: 'controllers/led-player-s',
    // Researched by the database-review stream (c13218a): it is Elation's
    // "Flex Pixel Driver 1", a DMX-in, single clocked-output driver
    'Flex Pixel Driver': 'controllers/flex-pixel-driver',
  },
  'Pixel Decoders': {
    // Moved to controllers (it holds DMX universes, not just pixel data)
    'Baldrick DMX': 'controllers/baldrick-dmx',
  },
  Adapters: {
    // The K40D-PB's pre-K-series name; merged in a61acdb
    'F40D-B': 'controllers/k40d-pb',
    '4 Channel Differntial Transmitter': 'adapters/4-channel-differential-transmitter',
    'Meanwell PDU with Differential Reciever': 'adapters/meanwell-pdu-with-differential-receiver',
  },
  'Diffusive Materials': {
    Polyethelene: 'diffusive-materials/polyethelene',
    // Renamed by research (6d2133d): Plexiglas LED (formerly EndLighten T)
    'Plexiglas LED Edge Lit was EndlightenT':
      'diffusive-materials/plexiglas-led-edge-lit-was-endlightent',
  },
};
