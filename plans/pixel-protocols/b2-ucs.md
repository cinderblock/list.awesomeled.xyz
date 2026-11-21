# Batch b2-ucs: summary

UCS / Lianxinke (深圳联芯科微电子, szucs.cn): UCS1903, UCS1903N, UCS1904,
UCS1909, UCS1909B, UCS1912, UCS1912B, UCS2903, UCS2904B, UCS2909, UCS2912,
UCS2603, UCS5603, UCS7604, UCS7804, UCS8903, UCS8904, UCS9812. Researched
2026-11-20. Every value, URL, page and quote is in [b2-ucs.yaml](b2-ucs.yaml).
Times are in ns unless marked.

## Short answer

- **"UCS1903" is not one timing.** The name covers two printed codes, and the
  maker changed the code across its whole 19xx line around 2012:
  - **2010–11 tables** (original UCS1903, UCS1909 and UCS1912 distributor
    copies): at 800 kbps a 0 is 250 high + 1000 low and a 1 is 1000 high +
    250 low, all ±150. UCS1903 and UCS1909 have a SET pin that selects
    400 kbps, which doubles every time. Reset is a low of 24 µs.
  - **2012-on maker tables** (UCS1903N, UCS1904, UCS1909B, UCS1912B,
    UCS2904B, and UCS8903's bits): the chip regenerates 400±40 / 800±80 high.
    UCS1903N's lows are 800/400, the others' 850/450. The receiver rule is
    printed in UCS1904, UCS1909B, UCS1912B and UCS8903: the chip decides on
    the high time alone and the low only ends the bit. A high under 550 is a
    0, over 690 is a 1 (UCS8903: over 680), and the first 30 ns of a high are
    ignored. A low of 8–24 µs may already count as reset (UCS1904, UCS1909B,
    UCS1912B, UCS2904B), so a frame must not pause longer than 8 µs. The
    maker tells the controller to send 400 / 850 high, lows ≥850 / ≥400, a
    period over 1.25 µs and a reset ≥24 µs.
- **UCS1903 vs WS2811: the timing really differs.** The 0-codes are identical,
  but the 1-codes are not. The original UCS1903 sends a 1 as 1000 high +
  250 low at 800 kbps, where WorldSemi's 2011 WS2811 sends 600 + 650. With
  both ±150 windows, T1H (850–1150 vs 450–750) and T1L (100–400 vs 500–800)
  miss each other by 100 ns. At 400 kbps the gap is 500 ns (T1H 1850–2150 vs
  1050–1350). That is the reason controllers list UCS1903 as its own type.
- **The same on the wire, apart from frame length:** UCS1904 (24 bits),
  UCS1909B (72 bits = three 24-bit RGB groups), UCS1912B (96 bits = four),
  UCS2904B (32 bits RGBW) and UCS1903N (24 bits). All send R first (RGB or
  RGBW), MSB first, over single-wire RZ, and latch on a ≥24 µs low. The
  2010–11 UCS1903 (800k), UCS1909 and UCS1912 form the same kind of group
  under the older timing.
- **Need something else:** UCS8903 (reset ≥1 ms), UCS9812 (1100 kbps, 20-bit
  channels that carry a 4-bit current code), UCS7604 (a configuration
  preamble that no maker document describes, 800k or 1.6M, backup FDIN),
  UCS5603 (12-bit, backup FDIN, frame unpublished), and UCS2603 / UCS7804
  (no maker document found at all).
- **No timing found** for UCS2903, UCS2909, UCS2912, UCS8904, UCS9812,
  UCS5603 or UCS7604. None of the English datasheets for UCS2903, UCS2904B
  (ver2.x), UCS8903, UCS8904, UCS9812, UCS5603 or UCS7604 has a functional
  description or timing table. For UCS2903 (ver2.2) and UCS8903 the section
  is missing where the 19xx datasheets have it. Timing tables turned up only
  in Chinese datasheets (UCS1903, UCS1904, UCS1909/B, UCS1912/B, UCS8903),
  in the UCS1903N English ver2.2 and in one translated UCS2904B.

## Overlap arithmetic (ns)

WorldSemi reference windows. I read the 2013 WS2812B
(https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf p3), the 2011 WS2811
(https://cdn-shop.adafruit.com/datasheets/WS2811.pdf p3, world-semi.com
footer) and WS2811 V1.5 2019
(https://www.world-semi.com/web/userfiles/productfile/WS2811_V1.5_EN.pdf p3):

| WorldSemi table                                                | T0H     | T1H       | T0L       | T1L       | Reset   |
| -------------------------------------------------------------- | ------- | --------- | --------- | --------- | ------- |
| WS2812B 2013 (0.4/0.8/0.85/0.45 ±150)                          | 250–550 | 650–950   | 700–1000  | 300–600   | >50 µs  |
| WS2811 2011, 800k ("one half" of the 400k table, ±150 assumed) | 100–400 | 450–750   | 850–1150  | 500–800   | >50 µs  |
| WS2811 2011, 400k (0.5/1.2/2.0/1.3 µs ±150)                    | 350–650 | 1050–1350 | 1850–2150 | 1150–1450 | >50 µs  |
| WS2811 V1.5 2019 (min–max as printed)                          | 220–380 | 580–1000  | 580–1000  | 580–1000  | >280 µs |

UCS printed windows:

| UCS table                                                                                                     | T0H      | T1H       | T0L       | T1L      | Reset              |
| ------------------------------------------------------------------------------------------------------------- | -------- | --------- | --------- | -------- | ------------------ |
| UCS1903 800k (half of the 400k table; ±150 not restated)                                                      | 100–400  | 850–1150  | 850–1150  | 100–400  | >24 µs             |
| UCS1909, UCS1912 2011 docs, 800k as printed                                                                   | 100–400  | 850–1150  | 850–1150  | 100–400  | 24 µs ±1 µs        |
| UCS1903 400k (printed)                                                                                        | 350–650  | 1850–2150 | 1850–2150 | 350–650  | >24 µs             |
| UCS1903N controller send (no tolerance)                                                                       | 400      | 800       | 900       | 500      | >24 µs             |
| 2012-on chip output (UCS1904, UCS1909B, UCS1912B, UCS2904B)                                                   | 360–440  | 720–880   | 850       | 450      | ≥24 µs             |
| 2012-on controller send (UCS1904, UCS1912B; UCS1909B T1H 900, T1L ≥350; UCS2904B T0L >900, T1L >450, T >1300) | 400      | 850       | ≥850      | ≥400     | ≥24 µs, T ≥1250    |
| 2012-on receiver rule                                                                                         | <550 → 0 | >690 → 1  | ends bit  | ends bit | gap <8 µs in frame |

Intersections:

- **2010–11 UCS (800k) vs WS2812B 2013:** T0H 250–400, T1H 850–950,
  T0L 850–1000, T1L 300–400. A common setting exists, for example 350/950 for
  a 0 and 900/350 for a 1. WS2812B's own nominal values are not inside the
  UCS windows: T1H 800 < 850 and T1L 450 > 400.
- **2010–11 UCS vs WS2811 V1.5 / WS2812B V5:** T1L 100–400 vs 580–1000 has
  no overlap, so no common setting exists.
- **2010–11 UCS vs WS2811 2011:** the 0 is identical. The 1 misses by 100 ns
  on both T1H and T1L, so no common setting exists.
- **2012-on receivers vs WS2812B 2013:** every T0H in 250–550 reads as a 0
  (550 is the boundary). T1H reads as a 1 only from 690 to 950; 650–690 is
  undefined. The lows meet the controller table at T0L 850–1000 and
  T1L 400–600. WS2812B nominal (400/800/850/450, reset 50 µs) meets every
  2012-on number except note 3: its 1250 period equals, rather than exceeds,
  "务必要大于1.25us" ("must be greater than 1.25 µs").
- **2012-on receivers vs WS2811 V1.5:** common settings exist, for example
  350/950 and 900/600 with reset ≥280 µs. The same setting also meets
  WS2812B 2013, but not the 2010–11 UCS tables (T1L). UCS2904B's controller
  table asks for a period above 1.3 µs, which 350/950 meets only at the
  boundary.
- **2012-on receivers vs WS2811 2011 (800k):** only 690–750 of its T1H
  window reads as a 1. Its nominal 600 sits in the undefined 550–690 band.
- **2012-on output vs WS2812B 2013:** a UCS1904-family chip regenerates
  360–440 / 720–880 / 850 / 450, all inside WS2812B 2013's windows. Its T1L
  of 450 is outside WS2811 V1.5's 580–1000.
- **Old into new:** a 2010–11 800k signal decodes correctly by the 2012-on
  thresholds (T0H ≤400 < 550, T1H ≥850 > 690). Its T1L of 100–400 is below
  the 2012-on controller recommendation of ≥400, though, and no chip minimum
  for the low is printed. The UCS1903 400k T0H of 350–650 straddles the
  550 threshold.
- **Three different "400 kbps" codes:** UCS1903 / UCS1909 slow (highs
  500/2000), WS2811 2011 slow (500/1200), and the 2012-on "low-speed
  enhanced" mode (highs 400/850, lows ≥2100/≥1650, period ≥2500). The
  2012-on chips detect their mode automatically. The UCS1904 and UCS2904B
  datasheets tell installers to pick "2903 低速增强模式" ("2903 low-speed
  enhanced mode") on the controller.

## Frames, forwarding and latching

- Every UCS part with a printed frame sends **R first** (RGB / RGBW,
  MSB first). WorldSemi's WS2812B sends GRB; the WS2811 sends RGB.
- Each chip takes its own bits, holds DO low until then, then reshapes and
  forwards the rest: "接受够24bit后，DO端口开始转发数据 … 在转发之前，DO口一直拉低"
  ("after 24 bits DO starts forwarding … DO stays low before that"). The
  multi-output chips take 72, 96, 48, 64 or 240 bits instead.
- The 2011 distributor docs tell you to send a reset before the first frame.
- UCS8903 frames end on a **low of at least 1 ms** (0.1–1 ms "may" latch), and
  gaps inside the frame must stay under 0.1 ms. A WS2812-style 50 µs latch is
  below even the 0.1 ms floor. A 280 µs latch falls in the uncertain zone.
- UCS9812: each channel is BIT19–BIT4 gray (16 bits) then BIT3–BIT0 current
  (2.4–20.4 mA in 1.2 mA steps), so 240 bits per chip, at FMAX 1100 kbps.
  Falcon nonetheless lists UCS9812 under its WS2811 type.

## Backup line

- **UCS5603 and UCS7604** have the same dual-input scheme: DIN plus FDIN
  ("Auxiliary Display Data Input"). Both inputs are decoded at once (a "dual
  decoding engine"), and the chip switches in real time to the healthy one.
  Chip N+1's FDIN is wired to chip N's input line on the cable side of chip
  N's RDI resistor, so it carries the stream chip N received. The next IC
  "will automatically identify the signal source and correct data
  accordingly". The controller's FDO port feeds chip 1's FDIN and is
  optional; the DO port must not drive both DIN and FDIN of chip 1. Neither
  datasheet says what the FDO stream contains.
- **UCS2603:** only Advatek ("Redundant data line reduces chance of entire
  strip failure") and ENTTEC ("Redundant Data Line | Yes") describe it.
- No other part in the batch has a backup line.

## Disagreements between documents

- **UCS1903 supply:** the Chinese original says 6–24 V (p6); the V1.0
  English says 6–12 V (p7).
- **UCS1909 vs UCS1909B:** the 2011 distributor doc uses SET for 400/800 kbps
  and prints 250/1000 ns. Maker ver2.2 (2012) uses SET for 6 vs 9 channels,
  is 800K only, and prints 400/800 ns. The 2011 doc also prints Treset as
  "24000ns 1000ns" (typical ± tolerance), not as a minimum.
- **UCS1912 2011 vs UCS1912B ver2.3:** the same split (250/1000 vs 400/800).
  UCS1912B's controller table prints its period as "》1.25" with no unit.
- **UCS8903 reset**, three values in one datasheet: the table says "》1ms"
  (p6), the text "1.5ms以上" ("over 1.5 ms", p4), and the reused figure
  "≥24µs" (p5). Its controller T1H is printed "0.85s".
- **UCS8903 English vs Chinese:** the English copy has no timing, pin 7 "NC"
  and 17 mA. Chinese VER1.1 has pin 7 SET (18 mA floating, 32 mA to VDD).
  The revision histories differ (2010/2011 vs 2012).
- **UCS2904B:** the function text says "24 bit PWM data" against 32 bits
  everywhere else. Its controller table (T0L >900, T1L >450, T >1300)
  differs from UCS1904/UCS1912B (≥850, ≥400, ≥1250). The power-on self-test
  colour is blue (Superlighting) vs white (Greeled 2021).
- **UCS2903 ver2.2:** pin 7 is a current-set resistor to ground, but p8 keeps
  the UCS1903 sentence "When the SET pin is connected to high level, it
  should be connected to VDD".
- **UCS9812:** the datasheet says both "preset 17 mA/channel" and 2.4–20.4 mA
  set by 4 data bits, and "2.4mA To 2.4mA" is a typo. PWM is 5 kHz per the
  datasheet and maker table, but 1024 Hz per Advatek and ENTTEC. Advatek's
  page says both "Per Color: 4 Bits" and "4-bit global current control".
- **UCS8904B Chinese:** its revision dates run backwards (VER1.0 2018-3-25,
  VER1.1 2012-8-14).
- **UCS7604:** VER1.0 heads its pin section "SOP 8" over a 10-pin table;
  VER1.1 (2023-06-02) draws the SOP10 pinout. Third parties disagree on the
  preamble gaps: ~20 µs (FastLED), 10–50 µs (Teensy sketch citing a "spec"),
  8–16 µs (NeoPixelBus captures) and ~260 µs (a FastLED issue capture).
- **PWM rates:** the datasheets (1.5 kHz for UCS1904/1909B/1912B/2903) and
  the maker table (1.8 kHz for UCS1904S, UCS1909BS, UCS1912BS and UCS2903B)
  disagree throughout.

## Database corrections (not applied)

- `pixel-ics/ucs1903`: `sources.creator` cites
  shop.ledco.sk/…/UCS1903_English.pdf, which is the **UCS1903N** ver2.2.
  That is a different, 800 kbps-only, constant-current part with 400/800
  timing, not the 6–12 V, 400 Hz, SET-pin UCS1903 the entry describes. The
  Chinese original gives 6–24 V.
- `pixel-ics/ucs1909`: `bitrate_notes` (SET selects 400/800 kbps) and the
  `data.type` note (250/1000 ns) describe the 2011 UCS1909 doc. The aliased
  UCS1909B(S) uses SET for 6/9 channels and has 400/800 timing. The maker
  datasheet is https://datasheet4u.com/pdf/905176/UCS1909B.pdf.
- `pixel-ics/ucs1912`: `data.pixel_size_bits` says "Derived … No datasheet
  found". The maker UCS1912B VER2.3 (https://datasheet4u.com/pdf/753096/UCS1912B.pdf)
  prints "96bit 数据结构" ("96-bit data structure").
- `pixel-ics/ucs1904`: has no datasheet link; use
  https://datasheet4u.com/pdf/1350120/UCS1904.pdf (Chinese, distributor-branded).
- `pixel-ics/ucs8903`:
  - `release_year: 2013`: the Chinese VER1.0 is dated 2012-6-25.
  - `max_current: 17mA`: Chinese gives a preset 18 mA, or 32 mA with SET to
    VDD.
  - `output_voltage: 26V`: neither copy says 26 V (30 V max / 24 V rated in
    Chinese, 28 V / 24 V in English).
  - `notes` "(WS2811 equiv)": contradicted by the 48-bit frame and the ≥1 ms
    reset.
- `pixel-ics/ucs9812`: `pwm_frequency: 1.024kHz` should be 5 kHz (datasheet
  p1 "port scanning frequency of 5 KHz/s"; maker table 5). The entry also
  lacks `bitrate` (1100 kbps) and `pixel_size_bits` (240 per chip, 20 per
  channel).
- `pixel-ics/ucs8904`: `output_voltage: 24V` disagrees with the Chinese
  UCS8904B "输出端口耐压28V" ("output withstand 28 V"; 30 V absolute
  maximum).
- `pixel-ics/ucs7604`: the `datasheet.discrepancies` SOP8/SOP10 note is
  resolved by VER1.1 (https://www.led-stuebchen.de/download/UCS7604.pdf);
  consider linking it.
- `pixel-ics/ucs2904`: the "blue output lights at power-on" note conflicts
  with Greeled's 2021 sheet ("white color").

## Still open

- **Timing tables still missing:**
  - UCS2903/2903B, UCS2909S, UCS2912S: no datasheet beyond the English
    ver2.2 (2903) and the maker table.
  - UCS8904 and UCS9812: no copy prints timing or reset. UCS8903's 1 ms
    reset makes this worth finding before the UCS8904 is grouped with
    anything.
  - UCS5603: no timing, channel order or current-command format.
  - UCS7604: no maker protocol document. The preamble values in the YAML
    (`third_party_claims`) come from FastLED, a Teensy sketch and logic-
    analyser captures. They agree on FF FF FF FF FF FF 00 03, then a mode
    byte and four current nibbles, but not on the gaps.
- **UCS2603 and UCS7804:** no maker document anywhere; everything is from
  Advatek and ENTTEC.
- **UCS1903B and UCS1903H** (the maker's current parts): no datasheet found.
  Unknown whether UCS1903B = UCS1903N.
- **UCS1909 (2011) slow mode:** does the "上述时间增加一倍" ("the times above
  are doubled") note double Treset too?
- **UCS1909B 6-channel mode:** frame length not printed.
- **UCS1903 high-speed tolerance:** never printed.
- **Not reachable:**
  - Mouser's "UCS1903 IC manul": bot-blocked, with no Wayback copy.
  - icspec.com's UCS index: login wall.
  - LCSC / szlcsc: JavaScript / anti-bot.
  - datasheetq: Cloudflare.
