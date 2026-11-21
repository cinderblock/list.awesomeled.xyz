/**
 * The numbers the /protocols page states, each tied to the document it came
 * from. Nothing here is from memory: every value names a source in SOURCES,
 * where it was printed, and the words that printed it. The unit tests check
 * that every citation points at a source and that the figures' arithmetic
 * adds up.
 *
 * The research behind these (every part, every revision, the disagreements)
 * is in plans/pixel-protocols/.
 */

export interface ProtocolSource {
  /** What the document is, as its publisher titles it */
  title: string;
  publisher: string;
  url: string;
  /** YYYY-MM-DD the document was read */
  retrieved: string;
  /** Revision or date printed on the document */
  revision?: string;
  /** A Wayback Machine copy, for documents that move */
  archive?: string;
}

export const SOURCES = {
  'ws2812b-adafruit': {
    title: 'WS2812B Intelligent control LED integrated light source',
    publisher: 'WorldSemi (copy hosted by Adafruit)',
    url: 'https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf',
    retrieved: '2026-11-20',
    revision: 'none printed (the early datasheet)',
  },
  'ws2813b-v6': {
    title: 'WS2813B-V6 Intelligent control LED integrated light source',
    publisher: 'WorldSemi',
    url: 'https://www.world-semi.com/downloads/datasheets/en/ws2813b-v6-1.0.pdf',
    retrieved: '2026-11-20',
    revision: 'V1.1',
  },
  'apa102c-adafruit': {
    title: 'APA102C',
    publisher: 'Shiji Lighting / iPixel LED (copy hosted by Adafruit)',
    url: 'https://cdn-shop.adafruit.com/datasheets/APA102.pdf',
    retrieved: '2026-11-20',
  },
} satisfies Record<string, ProtocolSource>;

export type SourceId = keyof typeof SOURCES;

export interface Citation {
  /** Key into SOURCES */
  source: SourceId;
  /** Where in the document ("p. 3, Data transfer time") */
  where: string;
  /** The words that say it, as printed (the document's own spelling) */
  quote: string;
}

/** A timing parameter as a datasheet prints it, in nanoseconds */
export interface Window {
  min: number;
  max: number;
}

export interface SingleWireTiming {
  part: string;
  t0h: Window;
  t1h: Window;
  t0l: Window;
  t1l: Window;
  /** Shortest low time that ends a frame */
  resetMin: number;
  cite: Citation;
}

/** typ ± tol as a window */
const pm = (typ: number, tol: number): Window => ({ min: typ - tol, max: typ + tol });

/** The early WS2812B datasheet: the numbers most libraries were written against */
export const WS2812B_EARLY: SingleWireTiming = {
  part: 'WS2812B',
  t0h: pm(400, 150),
  t1h: pm(800, 150),
  t0l: pm(850, 150),
  t1l: pm(450, 150),
  resetMin: 50_000,
  cite: {
    source: 'ws2812b-adafruit',
    where: 'p. 3, Data transfer time',
    quote:
      'T0H 0 code ,high voltage time 0.4us ±150ns · T1H 1 code ,high voltage time 0.8us ±150ns · T0L 0 code , low voltage time 0.85us ±150ns · T1L 1 code ,low voltage time 0.45us ±150ns · RES low voltage time Above 50µs',
  },
};

/** WorldSemi's current WS2813B: tighter 0 pulse, longer low times, 280 µs reset */
export const WS2813B_V6: SingleWireTiming = {
  part: 'WS2813B-V6',
  t0h: { min: 220, max: 380 },
  t1h: { min: 580, max: 1000 },
  t0l: { min: 580, max: 1000 },
  t1l: { min: 580, max: 1000 },
  resetMin: 280_000,
  cite: {
    source: 'ws2813b-v6',
    where: 'p. 4, Data Transfer Time',
    quote:
      'T0H 0-code, High-level time 220ns~380ns · T1H 1-code, High-level time 580ns~1µs · T0L 0-code, Low-level time 580ns~1µs · T1L 1-code, Low-level time 580ns~1µs · RES Frame unit, Low-level time >280µs',
  },
};

/** What the single-wire section quotes, beyond the timing tables */
export const SINGLE_WIRE_FACTS = {
  keepAndPass: {
    source: 'ws2812b-adafruit',
    where: 'p. 1, General description',
    quote:
      'the first pixel collect initial 24bit data then sent to the internal data latch, the other data which reshaping by the internal signal reshaping amplification circuit sent to the next cascade pixel through the DO port. After transmission for each pixel，the signal to reduce 24bit.',
  },
  bitPeriod: {
    source: 'ws2812b-adafruit',
    where: 'p. 3',
    quote: 'Data transfer time( TH+TL=1.25µs±600ns)',
  },
  orderGrb: {
    source: 'ws2813b-v6',
    where: 'p. 5, Composition of 24bit data',
    quote: 'Data transmit in order of GRB, high bit data is first.',
  },
  longReset: {
    source: 'ws2813b-v6',
    where: 'p. 1, General description',
    quote:
      'RESET time>280µs, it won’t cause wrong reset while interruption, supports the lower frequency and inexpensive MCU.',
  },
} satisfies Record<string, Citation>;

export const BACKUP_FACTS = {
  howItWorks: {
    source: 'ws2813b-v6',
    where: 'p. 6, Remark 1',
    quote:
      'DIN is the main input signal and BIN is the bypass input signal. Under normal circumstances, the IC extracts signals from the DIN. When one IC among them is damaged, the latter IC extracts the signal from the BIN without affecting the signal transmission of the subsequent ics.',
  },
  singleFailure: {
    source: 'ws2813b-v6',
    where: 'p. 1, Features and Benefits',
    quote:
      'Single-wire Self-By pass function.One additional signal line is added to realize double signal transmission. Any single pixel failure won’t affect the overall display effect.',
  },
  firstPixel: {
    source: 'ws2813b-v6',
    where: 'p. 6, Remark 2',
    quote:
      'For the finished product application, the BIN pin of the first IC can’t be left floating. It is recommended to connect it to GND.',
  },
} satisfies Record<string, Citation>;

export const CLOCKED_FACTS = {
  frames: {
    source: 'apa102c-adafruit',
    where: 'p. 3, cascading data structure',
    quote:
      'Start Frame 32 Bits (0*32) · LED Frame 32 Bits: 111, Global (5 bits), BLUE, GREEN, RED (8 bits each), MSB first · End Frame (1*32)',
  },
  global: {
    source: 'apa102c-adafruit',
    where: 'p. 4',
    quote: 'Global bit：5-bit（32 level）brightness setting',
  },
} satisfies Record<string, Citation>;

/** Every citation on the page, for the tests and the sources list */
export const ALL_CITATIONS: Citation[] = [
  WS2812B_EARLY.cite,
  WS2813B_V6.cite,
  ...Object.values(SINGLE_WIRE_FACTS),
  ...Object.values(BACKUP_FACTS),
  ...Object.values(CLOCKED_FACTS),
];
