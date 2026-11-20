// cspell:ignore differntial polyethelene reciever endlightent
/**
 * Sheet rows that can't be paired with their YAML entry automatically.
 *
 * Rows pair up by name, or by a product URL the entry also carries, scored by
 * how much of the row's content the entry holds (so mislabeled and duplicate
 * rows go to the right place). This table covers the rest: keyed by tab, then
 * by the sheet's trimmed column-A text, valued with the `<category>/<slug>`
 * the row's data lives at now. When several rows share a name, key one of
 * them as `<name> @ <url>`, with a URL the row links (its product URL).
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
    // The second "Falcon F4V3" row is the F16V3 (its product URL)
    'Falcon F4V3 @ https://pixelcontroller.com/store/products/48-f16v3.html':
      'controllers/falcon-f16v3',
    // Microcyb's Pi HATs, renamed M4-PI / M8-PI; stream 2 merged "M4- Pi" into
    // the M4 (plans/database-review.md). The second "M8 Port Pixel" row is
    // ENTTEC's Pixel Octo.
    'M4 Port Pixel': 'controllers/m4-port-pixel',
    'M4- Pi': 'controllers/m4-port-pixel',
    'M8 Port Pixel': 'controllers/m8-port-pixel',
    'M8 Port Pixel @ https://www.enttec.com/product/din/led-pixel-control-din-rail/din-rail-led-pixel-controller/':
      'controllers/pixel-octo',
  },
  Pixels: {
    // Newstar's IC part numbers. Newstar lists each LED as "NS107S HD107S",
    // "NS108 HD108", "NS8808 HD8808": the LEDs are the HD pixels, and the ICs
    // have their own pixel-ics entries. These Pixels-tab rows describe the LEDs.
    NS107S: 'pixels/hd107s',
    NS108: 'pixels/hd108',
    NS8808: 'pixels/hd8808',
    // The HD rows' Advatek protocol links also sit on the IC entries; the
    // rows describe the LEDs
    HD107S: 'pixels/hd107s',
    HD108: 'pixels/hd108',
  },
  'Pattern Drivers': {
    // The sheet's typo; the project is cyberboy666's artnet_led_mapper
    'Arthet LED Mapper': 'pattern-drivers/arthet-led-mapper',
  },
  'Pixel Decoders': {
    // Moved to controllers (it holds DMX universes, not just pixel data)
    'Baldrick DMX': 'controllers/baldrick-dmx',
  },
  Adapters: {
    // The K40D-PB's pre-K-series name; merged in a61acdb
    'F40D-B': 'controllers/k40d-pb',
    '4 Channel Differntial Transmitter': 'adapters/4-channel-differential-transmitter',
    // Both "QuinLED-Dig-Uno" rows (the current board, and the 2018 DIY guide's
    // v2r5) and the Pi HATs: stream 2 merged the adapter copies into the
    // controllers (plans/database-review.md, removed-entry map)
    'QuinLED-Dig-Uno': 'controllers/quinled-dig-uno',
    'QuinLED-Dig-Quad': 'controllers/quinled-dig-quad',
    'M4 Port Pixel': 'controllers/m4-port-pixel',
    'M8 Port Pixel': 'controllers/m8-port-pixel',
    'Meanwell PDU with Differential Reciever': 'adapters/meanwell-pdu-with-differential-receiver',
  },
  'Diffusive Materials': {
    Polyethelene: 'diffusive-materials/polyethelene',
    // Renamed by research (6d2133d): Plexiglas LED (formerly EndLighten T)
    'Plexiglas LED Edge Lit was EndlightenT':
      'diffusive-materials/plexiglas-led-edge-lit-was-endlightent',
  },
};
