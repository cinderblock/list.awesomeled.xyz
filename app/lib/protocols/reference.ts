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
  'ws2811-v15': {
    title: 'WS2811 Signal line 256 Gray level 3 channel Constant current LED driver IC',
    publisher: 'WorldSemi',
    url: 'https://www.world-semi.com/web/userfiles/productfile/WS2811_V1.5_EN.pdf',
    retrieved: '2026-11-20',
    revision: 'file named V1.5; its pages print V1.4',
  },
  'ws2811-adafruit': {
    title: 'WS2811 Signal line 256 Gray level 3 channel Constant current LED drive IC',
    publisher: 'WorldSemi (copy hosted by Adafruit)',
    url: 'https://cdn-shop.adafruit.com/datasheets/WS2811.pdf',
    retrieved: '2026-11-20',
    revision: 'none printed (the early datasheet, with the SET speed pin)',
  },
  'ws2812-adafruit': {
    title: 'WS2812 Intelligent control LED integrated light source (the 6-pin WS2812)',
    publisher: 'WorldSemi (copy hosted by Adafruit)',
    url: 'https://cdn-shop.adafruit.com/datasheets/WS2812.pdf',
    retrieved: '2026-11-20',
    revision: 'none printed (2012)',
  },
  'ws2812b-2017': {
    title: 'WORLDSEMI CO., LIMITED WS2812B Specifications',
    publisher: 'WorldSemi (copy hosted by Triopak)',
    url: 'https://www.triopak.fi/files/product/Worldsemi/WS2812B.pdf',
    retrieved: '2026-11-20',
    revision: 'Mar-2017',
  },
  'ws2815b-v1': {
    title: 'WS2815B-V1 Intelligent control LED integrated light source',
    publisher: 'WorldSemi',
    url: 'https://www.world-semi.com/downloads/datasheets/en/ws2815b-v1-v1.pdf',
    retrieved: '2026-11-20',
    revision: 'V2.2 (2023)',
  },
  'ws2816b-lcsc': {
    title: 'WS2816B / WS2816C datasheet',
    publisher: 'WorldSemi (copy hosted by LCSC)',
    url: 'https://www.lcsc.com/datasheet/C4154877.pdf',
    retrieved: '2026-11-20',
    revision: 'V1.0 (2020-12-06)',
  },
  'sk6812-opsco': {
    title: 'SK6812 specification (B/1)',
    publisher: 'Opsco (copy hosted by LCSC)',
    url: 'https://datasheet.lcsc.com/datasheet/pdf/9f469126feffa69bd23486dc2acd2d83.pdf',
    retrieved: '2026-11-20',
    revision: 'B/1 (2025-08-11)',
  },
  'apa106-sparkfun': {
    title: 'APA-106 Shift register programmable RGB Lamp',
    publisher: 'copy hosted by SparkFun (COM-12877)',
    url: 'https://cdn.sparkfun.com/datasheets/Components/LED/COM-12877.pdf',
    retrieved: '2026-11-20',
  },
  'cpldcpu-pd9823': {
    title: 'Timing of WS2812 clones – PD9823',
    publisher: 'Tim (cpldcpu), measurements',
    url: 'https://web.archive.org/web/20150928223018/https://cpldcpu.wordpress.com/2014/06/16/timing-of-ws2812-clones-pd9823/',
    retrieved: '2026-11-20',
    revision: '2014-06-16',
  },
  'tm1804-v2.3': {
    title: 'TM1804 (3 通道 LED 恒流驱动专用电路)',
    publisher: 'Titan Micro Electronics',
    url: 'https://www.titanmec.com/upload/twdz_cn/20250602/20250602112122574.pdf',
    retrieved: '2026-11-20',
    revision: 'V2.3 (2025)',
  },
  'tm1903-v1.3': {
    title: 'TM1903 (3 通道LED 恒流驱动专用电路)',
    publisher: 'Titan Micro Electronics',
    url: 'https://www.titanmec.com/upload/twdz_cn/20231124/20231124144051767.pdf',
    retrieved: '2026-11-20',
    revision: 'V1.3',
  },
  'sm16703p-v1.3': {
    title: 'SM16703P Specification Sheet',
    publisher: 'Sunmoon / ChinaASIC (copy hosted by Suntech Lite)',
    url: 'https://suntechlite.com/wp-content/uploads/2024/08/SM16703P-Specification-Sheet.pdf',
    retrieved: '2026-11-20',
    revision: 'IBZGZIV1.3',
  },
  'gs8208-v0.7': {
    title: 'GS8208 3-Channel LED Constant Current Driver Chip in Series',
    publisher: 'Genesis (copy hosted by LED-Stübchen)',
    url: 'https://www.led-stuebchen.de/download/GS8208V0.7-EN.pdf',
    retrieved: '2026-11-20',
    revision: 'Version 0.7',
  },
  'tx1818-lcsc': {
    title: 'TX1818BJJ-F01 5050 内置IC 幻彩 智能外控LED 光源 产品规格书',
    publisher: 'TCWIN (copy hosted by LCSC)',
    url: 'https://datasheet.lcsc.com/datasheet/pdf/b153efab9bc27ebcdabd89857c3357d8.pdf',
    retrieved: '2026-11-20',
    revision: 'A2 (2023-03-27)',
  },
  'ink1003-greeled': {
    title: 'Data Sheet Of INK1003 IC Driver',
    publisher: 'Greeled (copy hosted by espec.ws)',
    url: 'https://monitor.espec.ws/download.php?id=205360',
    retrieved: '2026-11-20',
  },
  'lb1908-ledyi': {
    title: 'LB1908 DC12V Power supply 3 channels LED driver',
    publisher: 'copy hosted by LEDYi',
    url: 'https://media.ledyi.com/lb1908-datasheet_1309db21e23b3ebdc074abd8b810492aa543b85520f7cd25739da821d0d92aca.pdf',
    retrieved: '2026-11-20',
  },
  'ucs1904-cn': {
    title: 'UCS1904 (Chinese datasheet)',
    publisher: 'UCS (copy hosted by datasheet4u)',
    url: 'https://datasheet4u.com/pdf/1350120/UCS1904.pdf',
    retrieved: '2026-11-20',
  },
  'cpldcpu-ws2812': {
    title: 'Light_WS2812 library V2.0 – Part I: Understanding the WS2812',
    publisher: 'Tim (cpldcpu), measurements with a logic analyzer',
    url: 'https://cpldcpu.github.io/2014/01/14/light_ws2812-library-v2-0-part-i-understanding-the-ws2812/',
    retrieved: '2026-11-20',
    revision: '2014-01-14',
  },
  'josh-neopixels': {
    title: 'NeoPixels Revealed: How to (not need to) generate precisely timed signals',
    publisher: 'Josh Levine, measurements',
    url: 'https://wp.josh.com/2014/05/13/ws2812-neopixels-are-not-so-finicky-once-you-get-to-know-them/',
    retrieved: '2026-11-20',
    revision: '2014-05-13, updated 2020-11-02',
  },
  fastled: {
    title: 'FastLED led_timing.h (WS2812 timing)',
    publisher: 'FastLED',
    url: 'https://github.com/FastLED/FastLED/blob/5e831b8203bc9237394f7f5b01b1a2ca40740e81/src/fl/chipsets/led_timing.h#L109-L134',
    retrieved: '2026-11-20',
    revision: 'commit 5e831b8',
  },
  neopixelbus: {
    title: 'NeoPixelBus NeoEsp32RmtMethod.h (WS2812x speed)',
    publisher: 'Makuna / NeoPixelBus',
    url: 'https://github.com/Makuna/NeoPixelBus/blob/fd670ee534064ddf5765e4db63c213ba05bbe880/src/internal/methods/NeoEsp32RmtMethod.h#L89-L296',
    retrieved: '2026-11-20',
    revision: 'commit fd670ee',
  },
  fpp: {
    title: 'FPP DPIPixels.cpp (WS281x bit cell)',
    publisher: 'Falcon Player (FPP)',
    url: 'https://github.com/FalconChristmas/fpp/blob/123b8ca089b98a54f7f5c0b7ee7b72ed18217f21/src/non-gpl/DPIPixels/DPIPixels.cpp#L61-L84',
    retrieved: '2026-11-20',
    revision: 'commit 123b8ca',
  },
  'apa102c-adafruit': {
    title: 'APA102C',
    publisher: 'Shiji Lighting / iPixel LED (copy hosted by Adafruit)',
    url: 'https://cdn-shop.adafruit.com/datasheets/APA102.pdf',
    retrieved: '2026-11-20',
  },
  'cpldcpu-apa102': {
    title: 'Understanding the APA102 “Superled”',
    publisher: 'Tim (cpldcpu), measurements with a logic analyzer',
    url: 'https://cpldcpu.com/2014/11/30/understanding-the-apa102-superled/',
    retrieved: '2026-11-20',
    revision: '2014-11-30',
  },
  'cpldcpu-sk9822': {
    title: 'SK9822 – a clone of the APA102?',
    publisher: 'Tim (cpldcpu), measurements',
    url: 'https://cpldcpu.com/2016/12/13/sk9822-a-clone-of-the-apa102/',
    retrieved: '2026-11-20',
    revision: '2016-12-13',
  },
  'sk9826-opsco': {
    title: 'SK9826 (SPC/SK9826) specification',
    publisher: 'Dongguan Opsco Optoelectronics (copy hosted by Eckstein)',
    url: 'https://ecksteinimg.de/Datasheet/LED/LED0032/SK9826_REV04_EN.pdf',
    retrieved: '2026-11-20',
    revision: 'REV04',
  },
  'ns108-newstar': {
    title: 'NS108 specification',
    publisher: 'Newstar LED (copy hosted by voron.ua)',
    url: 'https://voron.ua/files/pdf/led/NS108_5050.pdf',
    retrieved: '2026-11-20',
  },
  'hd108-rose': {
    title: 'HD108 5050 LED Specification',
    publisher: 'Rose Lighting',
    url: 'https://web.archive.org/web/20220216182230/https://www.rose-lighting.com/wp-content/uploads/sites/53/2021/03/HD108-5050-LED-Specificaion-V1.1.0-Rose-Lighting.pdf',
    retrieved: '2026-11-20',
    revision: 'V1.1.0',
  },
  'e1.11-2024': {
    title:
      'ANSI E1.11 – 2024 Entertainment Technology—USITT DMX512-A Asynchronous Serial Digital Data Transmission Standard for Controlling Lighting Equipment and Accessories',
    publisher: 'ESTA',
    // ESTA's own download asks for a sign-in; this is the PDF it serves
    url: 'https://web.archive.org/web/20260225154802/https://tsp.esta.org/tsp/documents/docs/ANSI%20E1.11%20-%202024.pdf',
    retrieved: '2026-11-20',
    revision: 'CP/2023-1011r2a',
  },
  'enttec-universe': {
    title: 'How Many Pixels Per DMX Universe? 170 RGB, 128 RGBW',
    publisher: 'ENTTEC Support',
    url: 'https://support.enttec.com/pixel/pixel-general-knowledge/how-many-pixels-per-dmx-universe',
    retrieved: '2026-11-20',
    revision: 'updated Jul 19, 2026',
  },
  'ws2821-acdc': {
    title: 'WS2821 Parallel-Single wire-Three channels',
    publisher: 'WorldSemi (copy hosted by ACDC Shop)',
    url: 'https://www.acdcshop.gr/content/WS2821.pdf',
    retrieved: '2026-11-20',
  },
  'e1.31-2018': {
    title:
      'ANSI E1.31 – 2018 Entertainment Technology Lightweight streaming protocol for transport of DMX512 using ACN',
    publisher: 'ESTA',
    url: 'https://web.archive.org/web/20220407060206/https://tsp.esta.org/tsp/documents/docs/ANSI_E1-31-2018.pdf',
    retrieved: '2026-11-20',
    revision: 'CP/2014-1009r6a',
  },
  artnet4: {
    title: 'Art-Net 4, Specification for the Art-Net 4 Ethernet Communication Protocol',
    publisher: 'Artistic Licence',
    url: 'https://artisticlicence.com/WebSiteMaster/User%20Guides/art-net.pdf',
    retrieved: '2026-11-20',
    revision: 'Release V1.4, document revision 1.4dp (23/10/2025)',
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

/** WorldSemi's current WS2811 sheet: the same windows as the WS2813B-V6 */
export const WS2811_V15: SingleWireTiming = {
  part: 'WS2811',
  t0h: { min: 220, max: 380 },
  t1h: { min: 580, max: 1000 },
  t0l: { min: 580, max: 1000 },
  t1l: { min: 580, max: 1000 },
  resetMin: 280_000,
  cite: {
    source: 'ws2811-v15',
    where: 'p. 3, Data Transfer Time',
    quote:
      'T0H 0 code, high voltage time 220ns~380ns · T1H 1 code, high voltage time 580ns~1us · T0L 0 code, low voltage time 580ns~1us · T1L 1 code, low voltage time 580ns~1us · RES Frame unit, low voltage time >280µs',
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
  orderRgb: {
    source: 'ws2811-v15',
    where: 'p. 4, Composition of 24bit data',
    quote: 'Data transmit in order of RGB, high bit data at first.',
  },
  speedPin: {
    source: 'ws2811-adafruit',
    where: 'p. 2, PIN function',
    quote: 'SET Set work mode of IC as low speed model(connect VDD) or high speed model(vacant)',
  },
  lowSpeed: {
    source: 'ws2811-adafruit',
    where: 'p. 3, Low Speed mode time',
    quote:
      'T0H 0 code,high voltage time 0.5 µs ±150ns · T1H 1 code,high voltage time 1.2 µs ±150ns · T0L 0 code,low voltage time 2.0 µs ±150ns · T1L 1 code,low voltage time 1.3 µs ±150ns · Note: It is one half of the time when high speed mode(reset time unchanged)',
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
  forwarding: {
    source: 'cpldcpu-apa102',
    where: 'protocol analysis',
    quote:
      'Once a device detects a start frame (more than 31 zero bits), it will interpret the next “1” bit as start of its own LED frame. 32 bits are clocked into the PWM registers, while zeroes are pushed to the output. After the entire LED frame as been read, any subsequent data is simply forwarded until another start frame is detected.',
  },
  halfClock: {
    source: 'cpldcpu-apa102',
    where: 'protocol analysis',
    quote:
      'Since the data for each subsequent LED is delayed by half a clock cycle, but the clock is not, additional clock cycles have to be fed to the string even after all data has been sent. This is the sole reason for the existence of the “End frame”',
  },
  immediate: {
    source: 'cpldcpu-apa102',
    where: 'protocol analysis',
    quote: 'The LED output color is updated immediately after the first valid LED frame.',
  },
  sk9822Latch: {
    source: 'cpldcpu-sk9822',
    where: 'protocol section',
    quote:
      'The SK9822 updates the PWM registers in the first cycle after the next start frame (0x00000000), while the APA102 updates the PWM register immediately after receiving the data.',
  },
  unified: {
    source: 'cpldcpu-sk9822',
    where: 'unified protocol',
    quote:
      'A SK9822 reset frame of 32 zero bits (<0x00> <0x00> <0x00> <0x00> ). An end frame consisting of at least (n/2) bits of 0, where n is the number of LEDs in the string.',
  },
  sixteenBit: {
    source: 'sk9826-opsco',
    where: 'p. 7, data communication protocol',
    quote:
      '(A) first into at least 128bits "0" as the starting frame, … DCLK rising edge sampling data: (B) Each set of gray scale data is composed of 1bit start code + 15bits current gain adjustment value (red and green blue three ports each 5bits) + 48bits gray data (red, green and blue lights 16bits) … (D) After the completion of the gray data transmission, additional pulse corresponding to the number of chips need to add additional DCLK (that is, 512 chips in cascade, need to send additional 512 DCLK), DIN remains high, the new data that comes into effect',
  },
  ns108: {
    source: 'ns108-newstar',
    where: 'p. 7, data communication protocol',
    quote:
      '(A) first into at least 128bits "0" as the starting frame, and then moved into the data frame, the starting frame and the data frame are high first move in, DCLK rising edge sampling data: (B) Each set of gray scale data is composed of 1bit start code + 15bits current gain adjustment value',
  },
  hd108: {
    source: 'hd108-rose',
    where: 'p. 6',
    quote:
      'Each update of data format consists of a start frame of 128 zeroes, 64 bits for every LED frame and but the end frame is not required. A minimum of 128 zeroes are required to initiate a new data update',
  },
} satisfies Record<string, Citation>;

/** DMX512 as ANSI E1.11 defines it (times in µs) */
export const DMX512 = {
  bitUs: 4,
  bitRateKbps: { min: 245, typ: 250, max: 255 },
  /** Shortest BREAK a transmitter may send, and the typical one */
  breakTxMinUs: 92,
  breakTxTypUs: 176,
  /** Shortest BREAK a receiver must recognize */
  breakRxMinUs: 88,
  mabTxMinUs: 12,
  mabRxMinUs: 8,
  slots: 512,
  /** Start bit, 8 data bits, 2 stop bits */
  bitsPerSlot: 11,
  updateMs513: 22.7,
  refreshMax: 44,
} as const;

export const DMX_FACTS = {
  format: {
    source: 'e1.11-2024',
    where: 'p. 12 (PDF 26), clause 8.1',
    quote:
      'DMX512 slots shall be transmitted sequentially in asynchronous serial format, beginning with slot 0 and ending with the last implemented slot, up to slot 512 (a maximum total of 513 slots). Prior to the first data slot being transmitted, a Reset Sequence shall be transmitted – a BREAK, followed by a MARK AFTER BREAK, and a START Code.',
  },
  slot: {
    source: 'e1.11-2024',
    where: 'p. 12 (PDF 26), Table 5 - Data Slot Format',
    quote:
      '1 Start Bit, Low or SPACE · 2 through 9 Slot Value Data Bits, Least Significant Bit to Most Significant Bit · 10, 11 Stop Bits, High or MARK',
  },
  transmitter: {
    source: 'e1.11-2024',
    where: 'p. 16 (PDF 30), Table 6 - Timing Diagram Values - output of transmitting UART',
    quote:
      'Bit Rate 245 250 255 kbit / s · Bit Time 3.92 4 4.08 µs · Minimum Update Time for 513 slots – 22.7 – ms · Maximum Refresh Rate for 513 slots – 44 – updates / s · “SPACE” for BREAK 92 176 – µs · “MARK” After BREAK (MAB) 12 – < 1.00 µs / s',
  },
  receiver: {
    source: 'e1.11-2024',
    where: 'p. 16 (PDF 30), Table 7 - Timing Diagram Values for Receivers',
    quote: '“SPACE” for BREAK 88 – –< 1.00 µs / s · “MARK” After BREAK (MAB) 8 – < 1.00 µs / s',
  },
} satisfies Record<string, Citation>;

/** DMX512-addressed pixel ICs: a parallel bus, not a chain */
export const DMX_PIXEL_FACTS = {
  parallel: {
    source: 'ws2821-acdc',
    where: 'p. 1, Product overview',
    quote:
      'WS2821 is a LED driven IC,which adopts the parallel single wire control signal,owns the independent programmable address and large range programmable constant current,three channels output.',
  },
  addressLine: {
    source: 'ws2821-acdc',
    where: 'p. 1',
    quote:
      'WS2821 has the independent write code signal line,the address can be written in series at one time.',
  },
  perUniverse: {
    source: 'enttec-universe',
    where: 'answer',
    quote:
      'One DMX universe fits 170 RGB pixels (using 510 of its 512 channels) or 128 RGBW pixels (using all 512 channels exactly).',
  },
} satisfies Record<string, Citation>;

export const NETWORK_FACTS = {
  sacn: {
    source: 'e1.31-2018',
    where: 'p. 1 (PDF 13), clause 1.1 Scope',
    quote:
      'This standard describes a mechanism to transfer DMX512-A [DMX] packets over an IP network using a subset of the ACN protocol suite.',
  },
  sacnUniverses: {
    source: 'e1.31-2018',
    where: 'p. 17 (PDF 29), clause 6.2.7',
    quote: 'Universe values shall be limited to the range 1 to 63999.',
  },
  artnet: {
    source: 'artnet4',
    where: 'p. 6 (PDF 17)',
    quote:
      'Its purpose is to allow transfer of large amounts of DMX512 data over a wide area using standard networking technology.',
  },
} satisfies Record<string, Citation>;

/**
 * How long a 0's and a 1's high pulse may be, per document. Datasheets give
 * windows; the UCS rule and the measurement give the point where a chip
 * decides; libraries give what they send.
 */
export interface HighTimeRow {
  id: string;
  label: string;
  kind: 'datasheet' | 'decision' | 'library';
  /** Open-ended windows leave `min` or `max` out */
  t0h: { min?: number; max?: number };
  t1h: { min?: number; max?: number };
  cite: Citation;
}

export const HIGH_TIME_ROWS: HighTimeRow[] = [
  {
    id: 'ws2812',
    label: 'WS2812 (6-pin, 2012)',
    kind: 'datasheet',
    t0h: pm(350, 150),
    t1h: pm(700, 150),
    cite: {
      source: 'ws2812-adafruit',
      where: 'p. 4',
      quote:
        'T0H 0 code ,high voltage time 0.35us ±150ns · T1H 1 code ,high voltage time 0.7us ±150ns',
    },
  },
  {
    id: 'ws2812b-2013',
    label: 'WS2812B (early sheet)',
    kind: 'datasheet',
    t0h: WS2812B_EARLY.t0h,
    t1h: WS2812B_EARLY.t1h,
    cite: WS2812B_EARLY.cite,
  },
  {
    id: 'ws2812b-2017',
    label: 'WS2812B (Mar 2017)',
    kind: 'datasheet',
    t0h: { min: 220, max: 380 },
    t1h: { min: 750, max: 1600 },
    cite: {
      source: 'ws2812b-2017',
      where: 'p. 4, Data Transfer Time',
      quote:
        'T0H 0 code, high voltage time 220ns~380ns · T1H 1 code, high voltage time 750ns~1.6µs',
    },
  },
  {
    id: 'ws2811-current',
    label: 'WS2811, WS2812B V5+, WS2813B (2018 on)',
    kind: 'datasheet',
    t0h: WS2811_V15.t0h,
    t1h: WS2811_V15.t1h,
    cite: WS2811_V15.cite,
  },
  {
    id: 'ws2815b',
    label: 'WS2815B (2023 on)',
    kind: 'datasheet',
    t0h: { min: 220, max: 380 },
    t1h: { min: 580, max: 840 },
    cite: {
      source: 'ws2815b-v1',
      where: 'p. 3, Data Transfer Time',
      quote:
        'T0H 0 code, high voltage time 220ns~380ns · T1H 1 code, high voltage time 580ns~840ns',
    },
  },
  {
    id: 'ws2816b',
    label: 'WS2816B, WS2816C (16-bit)',
    kind: 'datasheet',
    t0h: { min: 200, max: 320 },
    t1h: { min: 520, max: 800 },
    cite: {
      source: 'ws2816b-lcsc',
      where: 'p. 4, Data Transfer Time',
      quote:
        'T0H 0 code, high voltage time 200ns~320ns · T1H 1 code, high voltage time 520ns~800ns',
    },
  },
  {
    id: 'sk6812',
    label: 'SK6812 (Opsco, 2025)',
    kind: 'datasheet',
    t0h: { min: 250, max: 400 },
    t1h: { min: 650, max: 1000 },
    cite: {
      source: 'sk6812-opsco',
      where: 'p. 7, Suggested data transmission time',
      quote:
        'T0H 0 code, high-level time 0.25 0.32 0.40 µs · T1H 1 code, high-level time 0.65 0.70 1.00 µs · Reset code, low-level time >200 µs',
    },
  },
  {
    id: 'tm1804',
    label: 'TM1804 (V2.3)',
    kind: 'datasheet',
    t0h: { min: 300, max: 390 },
    t1h: { min: 650, max: 1000 },
    cite: {
      source: 'tm1804-v2.3',
      where: 'p. 4, 高速模式时间 (high-speed mode)',
      quote: 'T0H 输入0 码，高电平时间 300 360 390 ns · T1H 输入1 码，高电平时间 650 720 1000 ns',
    },
  },
  {
    id: 'tm1903',
    label: 'TM1903 (V1.3)',
    kind: 'datasheet',
    t0h: { max: 410 },
    t1h: { min: 650 },
    cite: {
      source: 'tm1903-v1.3',
      where: 'p. 4, 时序特性 (timing)',
      quote:
        '输入0 码，高电平时间 T0H … 360 410 ns · 输入1 码，高电平时间 T1H 650 720 ns (no minimum printed for T0H, no maximum for T1H)',
    },
  },
  {
    id: 'sm16703',
    label: 'SM16703P (V1.3)',
    kind: 'datasheet',
    t0h: { min: 200, max: 400 },
    t1h: { min: 800, max: 1000 },
    cite: {
      source: 'sm16703p-v1.3',
      where: 'p. 6',
      quote: 'T0H 0, HIGH level time 200 300 400 ns · T1H 1, HIGH level time 800 900 1000 ns',
    },
  },
  {
    id: 'gs8208',
    label: 'GS8208 (1:3 duty, nominal only)',
    kind: 'datasheet',
    t0h: { min: 312.5, max: 312.5 },
    t1h: { min: 937.5, max: 937.5 },
    cite: {
      source: 'gs8208-v0.7',
      where: 'p. 11',
      quote:
        'The single code employs a duty cycle of 1:3, with a standard transmission speed of 800 kHz · 0 code 1/4T 3/4T; 1 code 3/4T 1/4T; T=1/800kHz',
    },
  },
  {
    id: 'tx1818',
    label: 'TX1818',
    kind: 'datasheet',
    t0h: pm(300, 50),
    t1h: pm(900, 50),
    cite: {
      source: 'tx1818-lcsc',
      where: 'p. 7, 数据传输时间 (data transfer time)',
      quote: 'T0H 0码，高电平时间 0.3µs ±0.05us · T1H 1码，高电平时间 0.9µs ±0.05us',
    },
  },
  {
    id: 'ink1003',
    label: 'INK1003',
    kind: 'datasheet',
    t0h: pm(250, 75),
    t1h: pm(1000, 75),
    cite: {
      source: 'ink1003-greeled',
      where: 'p. 6',
      quote:
        'T0H 0 code of high level time 0.25μs ±75ns · T1H 1 code of high level time 1.0μs ±75ns',
    },
  },
  {
    id: 'lb1908',
    label: 'LB1908',
    kind: 'datasheet',
    t0h: { min: 250, max: 350 },
    t1h: { min: 700, max: 900 },
    cite: {
      source: 'lb1908-ledyi',
      where: 'p. 3, Time sequence characteristics',
      quote:
        'Input 0 ode, high level time T0H … 250 300 350 ns · Input 1 ode, high level time T1H 700 800 900 ns',
    },
  },
  {
    id: 'apa106',
    label: 'APA106 (the long 1)',
    kind: 'datasheet',
    t0h: pm(350, 150),
    t1h: pm(1360, 150),
    cite: {
      source: 'apa106-sparkfun',
      where: 'Timing waveform table',
      quote:
        'T0H 0 code, high level time 0.35µs ±150ns · T1H 1 code, high level time 1.36µs ±150ns · T0L 0 code, low level time 1.36µs ±150ns · T1L 1 code, low level time 0.35µs ±150ns · RES RESET code 50us',
    },
  },
  {
    id: 'ucs1904',
    label: 'UCS1904 (maker’s decision rule)',
    kind: 'decision',
    t0h: { max: 550 },
    t1h: { min: 690 },
    cite: {
      source: 'ucs1904-cn',
      where: 'p. 6, note 1',
      quote:
        'IC 主要根据高电平时间判断"0"码和"1"码 … 高电平时间<0.55us,IC 判断为"0"码,高电平时间>0.69uS,判断为“1”码 (the IC tells 0 from 1 by the high time: under 0.55 µs is a 0, over 0.69 µs a 1)',
    },
  },
  {
    id: 'cpldcpu',
    label: 'WS2812B, measured (2014)',
    kind: 'decision',
    t0h: { max: 563 },
    t1h: { min: 625 },
    cite: {
      source: 'cpldcpu-ws2812',
      where: 'results',
      quote: 'The threshold between “0” and “1” is somewhere between 563 and 625 ns.',
    },
  },
  {
    id: 'fastled',
    label: 'FastLED sends (WS2812B)',
    kind: 'library',
    t0h: { min: 250, max: 250 },
    t1h: { min: 875, max: 875 },
    cite: {
      source: 'fastled',
      where: 'led_timing.h',
      quote:
        'WS2812 RGB controller @ 800 kHz … Four-phase: TH0=250ns, TH1=875ns, TL0=1000ns, TL1=375ns',
    },
  },
  {
    id: 'neopixelbus',
    label: 'NeoPixelBus sends (WS2812x, ESP32)',
    kind: 'library',
    t0h: { min: 400, max: 400 },
    t1h: { min: 800, max: 800 },
    cite: {
      source: 'neopixelbus',
      where: 'NeoEsp32RmtSpeedWs2812x',
      quote:
        'RmtBit0 = Item32Val(400, 850); RmtBit1 = Item32Val(800, 450); RmtDurationReset = FromNs(300000); // 300us',
    },
  },
  {
    id: 'fpp',
    label: 'FPP sends (WS281x, Pi DPI)',
    kind: 'library',
    t0h: { min: 312, max: 312 },
    t1h: { min: 729, max: 729 },
    cite: {
      source: 'fpp',
      where: 'DPIPixels.cpp',
      quote:
        "12 gives T0H 312ns / T1H 729ns, which is what FPP's PRU string drivers have shipped for years (320/750)",
    },
  },
];

export const MEASURED_FACTS = {
  onlyHighTime: {
    source: 'josh-neopixels',
    where: 'simplified timing constraints',
    quote:
      'The only tight timing parameter for NeoPixel signaling is the maximum width of a 0-bit pulse',
  },
  latchShort: {
    source: 'josh-neopixels',
    where: 'TLL',
    quote: 'Leave the signal low for just 6us and the LED will latch.',
  },
  newChips: {
    source: 'josh-neopixels',
    where: 'update 11/2/2020',
    quote:
      'There are some new WS2812B and WS2813 chips that require a minimum 250,000ns latch time.',
  },
  sampling: {
    source: 'cpldcpu-ws2812',
    where: 'analysis',
    quote:
      'The input is latched again after cycle 2. The voltage of the input pin at this point determines whether a ‘1’ or a ‘0’ is read.',
  },
  ucsGap: {
    source: 'ucs1904-cn',
    where: 'p. 6, note 2',
    quote:
      '低电平复位时间最小为8µs，最高为24us … 所以一帧数据传输过程中不要中断超过8µs (a low of more than 8 µs may be taken as a reset, so never pause more than 8 µs inside a frame)',
  },
  pd9823: {
    source: 'cpldcpu-pd9823',
    where: 'conclusion',
    quote:
      'The internal state machine of the PD9823 seems to be identical to that of the WS2812. … In conclusion: Any software library that is able to drive the WS2812(B) is also able to drive the PD9823.',
  },
  apa106Library: {
    source: 'neopixelbus',
    where: 'NeoEsp32RmtSpeedApa106',
    quote:
      'RmtBit0 = Item32Val(350, 1350); RmtBit1 = Item32Val(1350, 350); RmtDurationReset = FromNs(50000); // 50us',
  },
  resetMeasured: {
    source: 'cpldcpu-ws2812',
    where: 'results',
    quote:
      'minimum reset length was 8.95 us, way below the specifications. The suggested reset time of 50 us is therefore more than sufficient to reset the LEDs. On the other hand, it means that no more than 9 us of idle time may occur during data transfer',
  },
} satisfies Record<string, Citation>;

/** Every citation on the page, for the tests and the sources list */
export const ALL_CITATIONS: Citation[] = [
  WS2812B_EARLY.cite,
  WS2811_V15.cite,
  WS2813B_V6.cite,
  ...Object.values(SINGLE_WIRE_FACTS),
  ...Object.values(BACKUP_FACTS),
  ...Object.values(CLOCKED_FACTS),
  ...Object.values(DMX_FACTS),
  ...Object.values(DMX_PIXEL_FACTS),
  ...Object.values(NETWORK_FACTS),
  ...HIGH_TIME_ROWS.map((r) => r.cite),
  ...Object.values(MEASURED_FACTS),
];
