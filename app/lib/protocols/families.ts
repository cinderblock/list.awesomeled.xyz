/**
 * Which pixel parts are the same thing on the wire.
 *
 * A protocol here is everything a transmitter must get right for a part to
 * work: the signal (how bits are coded), the timing class, the frame (bits per
 * pixel or chip, header words, start and end frames) and the latch. Parts in
 * one protocol are interchangeable on the wire. Within a protocol, parts can
 * still differ in ways a controller setting covers or the wire never sees:
 * channel order, a backup data input, supply voltage, the reset time (the
 * protocol states the longest any member needs).
 *
 * The evidence for every assignment (datasheet, page, quote) is in
 * plans/pixel-protocols/*.yaml; the batch is named on each protocol.
 *
 * This is the research result the data-model proposal in
 * plans/pixel-protocols.md is built from; the database's own `data.type`
 * values have not been changed to match yet.
 */

export type SignalKind =
  | 'single-wire'
  | 'single-wire-inverted'
  | 'clocked'
  | 'dmx512'
  | 'uart'
  | 'manchester'
  | 'packet';

export const SIGNAL_LABELS: Record<SignalKind, string> = {
  'single-wire': 'Single wire, pulse width',
  'single-wire-inverted': 'Single wire, inverted',
  clocked: 'Clock and data',
  dmx512: 'DMX512',
  uart: 'Asynchronous serial',
  manchester: 'Manchester code',
  packet: 'Single wire, packets',
};

/** How sure the assignment is */
export type Evidence =
  /** The maker's datasheet shows the frame and timing */
  | 'datasheet'
  /** A maker's or controller maker's statement, with no timing to check it against */
  | 'claim'
  /** No document describes the protocol: the assignment is a placeholder */
  | 'none';

export const EVIDENCE_LABELS: Record<Evidence, string> = {
  datasheet: 'datasheet',
  claim: 'a maker or controller maker says so',
  none: 'no document found',
};

export interface ProtocolMember {
  /** As it appears on the page */
  name: string;
  /** Database entry, `<category>/<id>` */
  ref?: string;
  /** What sets it apart within the protocol */
  note?: string;
  evidence: Evidence;
}

export interface PixelProtocol {
  id: string;
  name: string;
  signal: SignalKind;
  /** What a transmitter sends, in one or two sentences */
  wire: string;
  members: ProtocolMember[];
  /** The research batches with the evidence */
  batches: string[];
}

const ds = (name: string, ref?: string, note?: string): ProtocolMember => ({
  name,
  ref,
  note,
  evidence: 'datasheet',
});
const cm = (name: string, ref?: string, note?: string): ProtocolMember => ({
  name,
  ref,
  note,
  evidence: 'claim',
});
const none = (name: string, ref?: string, note?: string): ProtocolMember => ({
  name,
  ref,
  note,
  evidence: 'none',
});

export const PROTOCOLS: PixelProtocol[] = [
  // ---------------------------------------------------------------------
  // Single wire, idle low, bit value from the high time (800 kbit/s class)
  {
    id: 'ws2811',
    name: 'WS2811 (24-bit)',
    signal: 'single-wire',
    wire: 'A 0 high for about 0.3 µs and a 1 for about 0.75 µs in a 1.25 µs bit; 24 bits per pixel, most significant bit first; latched by holding the line low (≥280 µs covers every member).',
    batches: [
      'a1-worldsemi',
      'a2-sk-apa',
      'b1-titan',
      'b2-ucs',
      'b3-sm-gs',
      'b4-other-single-wire',
    ],
    members: [
      ds('WS2811', 'pixel-ics/ws2811', 'RGB order'),
      ds('WS2811 V1.4', 'pixel-ics/ws2811-v1-4', 'RGB order; reset >280 µs'),
      ds('WS2812, WS2812B', 'pixels/ws2812', 'GRB order; reset >280 µs since V5 (2019)'),
      ds('WS2813', 'pixels/ws2813', 'GRB; backup input'),
      ds('WS2815', 'pixels/ws2815', 'GRB; backup input; 12 V'),
      ds('WS2818', 'pixel-ics/ws2818', 'backup input'),
      ds('WS2818A', 'pixel-ics/ws2818a', 'backup input'),
      ds('WS2818B', 'pixel-ics/ws2818b', 'RGB; backup input'),
      ds('WS2808', 'pixel-ics/ws2808', 'GRB; backup input'),
      cm('WS2851', 'pixels/ws2851', 'no datasheet found'),
      ds('SK6812', 'pixels/sk6812', 'GRB'),
      ds('SK6812 (5050 driver)', 'pixel-ics/sk6812-5050'),
      ds('SK6805', 'pixels/sk6805', 'GRB'),
      ds('SK6805 (driver)', 'pixel-ics/sk6805'),
      ds('SK6812WWA', 'pixels/sk6812-wwa', 'white, amber and white bytes instead of RGB'),
      ds('SK6813', 'pixels/sk6813', 'backup input'),
      ds('SK6813 HV', 'pixels/sk6813-hv', 'backup input; GRB in 2019, RGB from 2023'),
      ds('SK6851', 'pixels/sk6851'),
      ds(
        'APA104',
        'pixels/apa104',
        "per APA's own sheet; a Newstar-hosted sheet prints APA106 timing"
      ),
      cm('APA105', 'pixels/apa105', 'no datasheet found'),
      ds('TM1804', 'pixel-ics/tm1804', 'RGB; a SET pin selects 400 kbit/s'),
      ds('TM1809', 'pixel-ics/tm1809', 'three RGB pixels per chip'),
      ds('TM1812', 'pixel-ics/tm1812', 'four RGB pixels per chip'),
      ds('TM1903', 'pixel-ics/tm1903', 'RGB; reset 200 µs–20 ms'),
      ds('TM1934', 'pixel-ics/tm1934', 'RGB; backup input'),
      ds('SM16703', 'pixel-ics/sm16703', 'RGB'),
      ds('SM16712', 'pixel-ics/sm16712', 'four RGB pixels per chip'),
      ds('GS8206', 'pixel-ics/gs8206', 'backup input'),
      ds('GS8208', 'pixel-ics/gs8208', 'backup input'),
      ds('GS8208 (LED)', 'pixels/gs8208', 'backup input'),
      ds('CS8812', 'pixels/cs8812', 'a renamed GS8208 datasheet'),
      ds('LC8808B', 'pixels/lc8808b', 'a renamed GS8208 datasheet'),
      ds('GE8812', 'pixels/ge8812', 'GRB'),
      ds('GE1603', 'pixel-ics/ge1603', 'RGB; backup input'),
      ds('TX1818', 'pixels/tx1818', 'RGB; backup input'),
      ds('INK1002', 'pixels/ink1002', 'contains the INK1003'),
      ds('INK1003', 'pixel-ics/ink1003', 'RGB'),
      ds('LB1908', 'pixel-ics/lb1908', 'RGB; backup input'),
      ds('FW1906', 'pixel-ics/fw1906', 'two RGB pixels (48 bits) per chip'),
      ds('UCS1904', 'pixel-ics/ucs1904', 'RGB; may latch after 8 µs of low'),
      ds(
        'UCS1909B',
        'pixel-ics/ucs1909',
        'three RGB pixels per chip; the 2011 UCS1909 used UCS1903 timing'
      ),
      ds(
        'UCS1912B',
        'pixel-ics/ucs1912',
        'four RGB pixels per chip; the 2011 UCS1912 used UCS1903 timing'
      ),
      cm('UCS2903', 'pixel-ics/ucs2903', 'no timing published'),
      none('UCS2909', 'pixel-ics/ucs2909', 'no datasheet found'),
      none('UCS2912', 'pixel-ics/ucs2912', 'no datasheet found'),
      cm('UCS2603', 'pixel-ics/ucs2603', 'backup input; no datasheet found'),
      cm('NS8808', 'pixel-ics/ns8808', 'maker: "same protocol with ws2815"; no timing published'),
      cm('HD8808', 'pixels/hd8808', 'no timing published'),
      cm('P9883', 'pixel-ics/p9883', 'no maker document'),
      none('TC2811', 'pixel-ics/tc2811', 'no datasheet read'),
      none('GS8202', 'pixel-ics/gs8202', 'no datasheet found'),
    ],
  },
  {
    id: 'ws2811-rgbw',
    name: 'WS2811 with four channels (32-bit)',
    signal: 'single-wire',
    wire: 'The WS2811 signal with 32 bits per pixel: a fourth (white) byte.',
    batches: ['a1-worldsemi', 'a2-sk-apa', 'b1-titan', 'b2-ucs', 'b3-sm-gs'],
    members: [
      ds('SK6812RGBW', 'pixels/sk6812-rgbw', 'GRBW (RGBW on the 2015 sheet)'),
      ds('APA109', 'pixels/apa109', 'GRBW'),
      ds('SK6818', 'pixels/sk6818', 'GRBW'),
      ds('SK6818 (driver)', 'pixel-ics/sk6818', 'GRBW'),
      ds('SM16704', 'pixel-ics/sm16704'),
      ds('TM1824', 'pixel-ics/tm1824', 'RGBW'),
      ds('UCS2904', 'pixel-ics/ucs2904', 'RGBW (UCS2904B)'),
      ds('WS2814', 'pixel-ics/ws2814', 'RGBW on the SOP12 part, WRGB on WS2814A/B/F'),
      ds('WS2815B-RGBW', 'pixels/ws2815-rgbw', 'GRBW; backup input'),
      cm('P9412', 'pixels/p9412', 'no maker document'),
    ],
  },
  {
    id: 'ws2805',
    name: 'WS2811 with five channels (40-bit)',
    signal: 'single-wire',
    wire: 'The WS2811 signal with 40 bits per pixel: R, G, B and two whites.',
    batches: ['a1-worldsemi'],
    members: [ds('WS2805', 'pixel-ics/ws2805', 'backup input')],
  },
  {
    id: 'ws2811-16bit',
    name: '16-bit channels (48-bit)',
    signal: 'single-wire',
    wire: 'WS2811-style bits, 16 bits per channel: 48 bits per RGB pixel.',
    batches: ['a1-worldsemi', 'b2-ucs'],
    members: [
      ds('WS2816B, WS2816C', 'pixels/ws2816', 'the WS2816A adds a gain word per frame'),
      ds('UCS8903', 'pixel-ics/ucs8903', 'needs ≥1 ms of low to latch'),
      cm('UCS8904', 'pixel-ics/ucs8904', 'RGBW (64 bits); no timing published'),
    ],
  },
  {
    id: 'apa106',
    name: 'APA106 (long 1)',
    signal: 'single-wire',
    wire: 'Datasheets print a 1 high for 1.36 µs in a bit of about 1.7 µs. A measured clone decides like a WS2811, so WS2811 timing probably works, but no datasheet promises it.',
    batches: ['a2-sk-apa', 'b4-other-single-wire', 'e-practice'],
    members: [
      ds('APA106', 'pixels/apa106', 'RGB'),
      ds('PL9823', 'pixels/pl9823', 'RGB'),
      ds('SK6822', 'pixels/sk6822', 'adds a 12 µs gap after every pixel; backup input'),
      ds('P943', 'pixels/p943', 'adds a 12 µs gap after every pixel; two inputs'),
    ],
  },
  {
    id: 'ucs1903',
    name: 'UCS1903 (2010–11)',
    signal: 'single-wire',
    wire: 'A 1 is high for 1.0 µs and low for 0.25 µs at 800 kbit/s (a SET pin halves the speed); 24 bits per chip. The 1 sits at the far edge of WS2811 timing.',
    batches: ['b2-ucs'],
    members: [ds('UCS1903', 'pixel-ics/ucs1903', 'RGB; reset 24 µs')],
  },
  {
    id: 'ws2811-400k',
    name: 'WS2811 at 400 kbit/s',
    signal: 'single-wire',
    wire: 'Half speed: a 2.5 µs bit, a 0 high for about 0.7 µs and a 1 for about 1.8 µs. Several 800 kbit/s chips switch to it with a SET pin.',
    batches: ['b1-titan', 'a1-worldsemi'],
    members: [ds('TM1803', 'pixel-ics/tm1803', '400 kbit/s only (V1.5)')],
  },
  {
    id: 'lpd1886',
    name: 'LPD1886 (12-bit)',
    signal: 'single-wire',
    wire: 'WS2811-style bits, 36 bits per chip (12 per channel, low nibble first); latches after only 10 µs of low.',
    batches: ['b4-other-single-wire'],
    members: [ds('LPD1886', 'pixel-ics/lpd1886')],
  },
  {
    id: 'ucs9812',
    name: 'UCS9812',
    signal: 'single-wire',
    wire: '1.1 Mbit/s; 20 bits per channel (16-bit level and a 4-bit current code), 240 bits per 12-channel chip.',
    batches: ['b2-ucs'],
    members: [ds('UCS9812', 'pixel-ics/ucs9812')],
  },
  {
    id: 'sm16803',
    name: 'SM16803 (gain word)',
    signal: 'single-wire',
    wire: 'WS2811-style bits, 24 bits per chip, then one 16-bit current-gain word after the last chip; reset ≥200 µs.',
    batches: ['b3-sm-gs'],
    members: [ds('SM16803', 'pixel-ics/sm16803')],
  },
  {
    id: 'sm16804',
    name: 'SM16804 (RGBW + gain word)',
    signal: 'single-wire',
    wire: 'WS2811-style bits, 32 bits per chip, then one 16-bit R, G, B, W gain word; reset ≥200 µs.',
    batches: ['b3-sm-gs'],
    members: [ds('SM16804', 'pixel-ics/sm16804'), ds('SM16824E', 'pixel-ics/sm16824e')],
  },
  {
    id: 'sm16714',
    name: 'SM16714 (RGBW + 20-bit gain word)',
    signal: 'single-wire',
    wire: 'WS2811-style bits, 32 bits per chip, then a 20-bit W, B, G, R gain word.',
    batches: ['b3-sm-gs'],
    members: [
      ds('SM16714', 'pixel-ics/sm16714', 'SM16714P and SM16714PHT print different 1-bit timing'),
    ],
  },
  {
    id: 'sm16711',
    name: 'SM16711',
    signal: 'single-wire',
    wire: 'Gain and polarity set by an instruction register in the stream; the only datasheet found prints no frame or timing.',
    batches: ['b3-sm-gs'],
    members: [cm('SM16711', 'pixel-ics/sm16711', 'frame unpublished')],
  },
  {
    id: 'ucs7604',
    name: 'UCS7604',
    signal: 'single-wire',
    wire: 'A configuration preamble before the pixel data (no maker document describes it), 16-bit channels at 800 kbit/s or 1.6 Mbit/s; backup input.',
    batches: ['b2-ucs', 'e-practice'],
    members: [ds('UCS7604', 'pixel-ics/ucs7604')],
  },
  {
    id: 'ucs5603',
    name: 'UCS5603',
    signal: 'single-wire',
    wire: '12-bit channels with a backup input; the frame is not published.',
    batches: ['b2-ucs'],
    members: [ds('UCS5603', 'pixel-ics/ucs5603')],
  },
  {
    id: 'ucs7804',
    name: 'UCS7804',
    signal: 'single-wire',
    wire: 'RGB or RGBW by configuration; known only from controller makers.',
    batches: ['b2-ucs'],
    members: [cm('UCS7804', 'pixel-ics/ucs7804')],
  },
  // ---------------------------------------------------------------------
  // Single wire, idle high
  {
    id: 'tm1913',
    name: 'TM1913 (inverted)',
    signal: 'single-wire-inverted',
    wire: 'The line idles high and every bit starts with a low pulse; otherwise a plain 24-bit RGB frame. Reset is a high level.',
    batches: ['b1-titan'],
    members: [ds('TM1913', 'pixel-ics/tm1913')],
  },
  {
    id: 'tm1814',
    name: 'TM1814 (inverted, current words)',
    signal: 'single-wire-inverted',
    wire: 'Inverted line; every frame starts with two 32-bit current words (the second the complement of the first), then 32 bits of W, R, G, B per chip.',
    batches: ['b1-titan', 'e-practice'],
    members: [ds('TM1814', 'pixel-ics/tm1814')],
  },
  {
    id: 'tm1914',
    name: 'TM1914 (inverted, mode word)',
    signal: 'single-wire-inverted',
    wire: 'Inverted line; every frame starts with a 48-bit mode command (a code and its complement), then 24-bit RGB per chip; a second input takes over after 300 ms without data.',
    batches: ['b1-titan', 'e-practice'],
    members: [ds('TM1914', 'pixel-ics/tm1914', 'backup input')],
  },
  {
    id: 'tm1829',
    name: 'TM1829 (inverted)',
    signal: 'single-wire-inverted',
    wire: 'Inverted line with its own timing; a 24-bit packet starting with 0xFF sets the current, so a colour packet’s first byte stays below 0xFF.',
    batches: ['b1-titan'],
    members: [ds('TM1829', 'pixel-ics/tm1829', 'the newer TM1829B uses the TM1814 frame instead')],
  },
  // ---------------------------------------------------------------------
  // Other single-wire codings
  {
    id: 'mbi6120',
    name: 'MBI6120',
    signal: 'packet',
    wire: 'Macroblock’s own coding: a measured bit width, a 36-bit header with the chip count, 12-bit channels, last chip first.',
    batches: ['b4-other-single-wire'],
    members: [ds('MBI6120', 'pixel-ics/mbi6120')],
  },
  {
    id: 'tls3001',
    name: 'TLS3001 (Manchester)',
    signal: 'manchester',
    wire: 'Manchester code at 100 kHz–2 MHz with sync, reset and data frames, 39 bits per chip.',
    batches: ['b4-other-single-wire'],
    members: [
      ds('TLS3001', 'pixel-ics/tls3001'),
      cm('QED3001', 'pixel-ics/qed3001', 'grouped with TLS3001 by Falcon only'),
    ],
  },
  {
    id: 'pixie',
    name: 'Adafruit Pixie (serial)',
    signal: 'uart',
    wire: 'Plain serial, 115200 baud 8N1, three bytes per Pixie; latches after 1 ms of silence.',
    batches: ['b4-other-single-wire'],
    members: [ds('Adafruit Pixie', 'pixels/adafruit-pixie')],
  },
  // ---------------------------------------------------------------------
  // Clock and data
  {
    id: 'apa102',
    name: 'APA102',
    signal: 'clocked',
    wire: '32 zero bits, then 32 bits per pixel (111, 5-bit brightness, B, G, R), then at least one clock edge for every two pixels. Data is read on the rising clock edge.',
    batches: ['c1-apa102'],
    members: [
      ds('APA102', 'pixels/apa102'),
      ds('APA102C', 'pixels/apa102c'),
      ds('APA107', 'pixels/apa107'),
      ds('SK9822', 'pixels/sk9822', 'shows each frame only after the next start frame'),
      ds('SK9822-A', 'pixels/sk9822-a', 'sends G, R, B'),
      ds('HD107S', 'pixels/hd107s', 'up to 40 MHz'),
      ds('NS107S', 'pixel-ics/ns107s'),
      ds('GE8822', 'pixels/ge8822'),
      ds('LC8823', 'pixels/lc8823'),
      ds('LC8823-2020', 'pixels/lc2823-2020'),
    ],
  },
  {
    id: 'sk9826',
    name: 'SK9826 (16-bit)',
    signal: 'clocked',
    wire: 'At least 128 zero bits, then 64 bits per pixel (a start bit, three 5-bit gains, three 16-bit values), then one extra clock per chip.',
    batches: ['c1-apa102'],
    members: [
      ds('SK9826', 'pixels/sk9826'),
      ds('NS108', 'pixel-ics/ns108'),
      ds('NS108E', 'pixels/ns108e'),
      ds('HD108', 'pixels/hd108', "Rose Lighting's sheet: RGB order, no end frame needed"),
    ],
  },
  {
    id: 'ws2801',
    name: 'WS2801',
    signal: 'clocked',
    wire: '24 bits per chip, no start or end frame; latched by holding the clock low for more than 500 µs.',
    batches: ['c2-clocked'],
    members: [
      ds('WS2801', 'pixel-ics/ws2801'),
      cm('WS2803', 'pixel-ics/ws2803', '18 outputs; latch not documented'),
    ],
  },
  {
    id: 'lpd6803',
    name: 'LPD6803 (15-bit)',
    signal: 'clocked',
    wire: '32 zero bits, then a 16-bit word per pixel (a 1 and three 5-bit values), then one extra clock per word.',
    batches: ['c2-clocked'],
    members: [
      ds('LPD6803', 'pixel-ics/lpd6803'),
      ds('D705', 'pixel-ics/d705'),
      ds('UCS6909', 'pixel-ics/ucs6909', 'three words per chip; slower clock'),
    ],
  },
  {
    id: 'lpd8806',
    name: 'LPD8806 (7-bit)',
    signal: 'clocked',
    wire: 'Three bytes per LED, each a 1 and a 7-bit value; zero bytes reset the strip (from Adafruit’s library; the maker prints no frame).',
    batches: ['c2-clocked'],
    members: [ds('LPD8806', 'pixel-ics/lpd8806'), ds('LPD8803', 'pixel-ics/lpd8803')],
  },
  {
    id: 'sm16716',
    name: 'SM16716',
    signal: 'clocked',
    wire: 'At least 50 zero bits, then 25 bits per chip (a 1 and 24 bits of colour), then one extra clock per chip.',
    batches: ['c2-clocked'],
    members: [
      ds('SM16716', 'pixel-ics/sm16716'),
      ds('SM16726', 'pixel-ics/sm16726', 'with SET high'),
    ],
  },
  {
    id: 'p9813',
    name: 'P9813',
    signal: 'clocked',
    wire: 'A 32-bit start frame, then 32 bits per pixel: 11, six inverted check bits, then B, G, R.',
    batches: ['c2-clocked'],
    members: [ds('P9813', 'pixel-ics/p9813')],
  },
  {
    id: 'my9221',
    name: 'MY9221',
    signal: 'clocked',
    wire: '208 bits per chip (a 16-bit command, twelve 16-bit words) on both clock edges; latched by DI pulses with the clock parked.',
    batches: ['c2-clocked'],
    members: [ds('MY9221', 'pixel-ics/my9221')],
  },
  {
    id: 'my9231',
    name: 'MY9231',
    signal: 'clocked',
    wire: 'An 8-bit command per chip in its own phase, then 8- to 16-bit words on both clock edges; latched by DI pulses.',
    batches: ['c2-clocked'],
    members: [ds('MY9231', 'pixel-ics/my9231'), ds('MY9291', 'pixel-ics/my9291', 'four channels')],
  },
  {
    id: 'mbi6023',
    name: 'Macroblock MBI602x',
    signal: 'clocked',
    wire: 'Packets read on the falling clock edge: a long zero prefix, a header with the data type and chip count, then data for the last chip first.',
    batches: ['c2-clocked'],
    members: [
      ds('MBI6020', 'pixel-ics/mbi6020', 'three words per chip'),
      ds('MBI6023', 'pixel-ics/mbi6023'),
      ds('MBI6024', 'pixel-ics/mbi6024', 'adds correction and configuration packets'),
    ],
  },
  {
    id: 'dm412',
    name: 'DM412',
    signal: 'clocked',
    wire: '48 bits per chip into a shift register, latched on a third (strobe) wire.',
    batches: ['c2-clocked'],
    members: [ds('DM412', 'pixel-ics/dm412')],
  },
  {
    id: 'ld1510',
    name: 'LD1510',
    signal: 'clocked',
    wire: '24 or 36 bits per chip into a shift register, latched by toggling data with the clock low.',
    batches: ['c2-clocked'],
    members: [ds('LD1510', 'pixel-ics/ld1510')],
  },
  {
    id: 'icnd2110',
    name: 'ICND2110',
    signal: 'clocked',
    wire: 'A continuous clock; 128 ones, a register word, two 96-bit blocks per chip, 145 ones.',
    batches: ['c2-clocked'],
    members: [ds('ICND2110', 'pixel-ics/icnd2110')],
  },
  // ---------------------------------------------------------------------
  // DMX512
  {
    id: 'dmx512',
    name: 'DMX512 pixels',
    signal: 'dmx512',
    wire: 'Standard DMX512 (250 kbit/s, also faster); every chip on one line, each taking its slots from a start address stored in the chip.',
    batches: ['d-dmx'],
    members: [
      cm('DMX512 (DMX512P)', 'pixel-ics/dmx512', 'a generic pixel type; no chip datasheet'),
      ds('UCS512B', 'pixel-ics/ucs512b'),
      ds('WS2821', 'pixel-ics/ws2821'),
      ds('WS2822S', 'pixels/ws2822s'),
      cm('SM16511', 'pixel-ics/sm16511', 'maker page only'),
    ],
  },
];

/** Every member's database ref, with its protocol */
export function protocolsByRef(): Map<string, PixelProtocol[]> {
  const out = new Map<string, PixelProtocol[]>();
  for (const p of PROTOCOLS) {
    for (const m of p.members) {
      if (!m.ref) continue;
      out.set(m.ref, [...(out.get(m.ref) ?? []), p]);
    }
  }
  return out;
}
