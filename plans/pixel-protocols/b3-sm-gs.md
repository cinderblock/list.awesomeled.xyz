# Batch b3-sm-gs: summary

Sunmoon SM16703/04/11/12/14/803/804/824E, Genesis GS8202/06/08 (and the
CS8812 and LC8808B rebrands), Greeled GE8812 and GE1603R. Researched
2026-11-20. Every value, URL, page and quote is in
[b3-sm-gs.yaml](b3-sm-gs.yaml). Times below are in ns unless marked.

## What every part here has in common

Every part with a datasheet uses the same line code. It is a single wire,
unipolar return-to-zero: each bit starts high, the width of the high part
decides 0 or 1, and the line idles and latches low. Channels are 8 bits, sent
MSB first wherever a document states the order (SM16711's copy does not).

- Sunmoon's 2023 selection guide (p16) labels every SM part in this batch
  "SID", except SM16711, which it does not list. It tells them apart only by
  its "Current Gain" column: 无 (none), 16级 or 32级.
- Genesis calls its code "e-RZ (extended return to zero code)… compatible
  with the traditional RZ code". It specifies the bit as a 1:3 duty cycle
  (¼T and ¾T) at T = 1/800 kHz, and prints no tolerances.

## Timing against WorldSemi (window intersections)

The two WorldSemi generations disagree with each other:

| WorldSemi table                          | T0H     | T1H      | T0L      | T1L      | Reset   |
| ---------------------------------------- | ------- | -------- | -------- | -------- | ------- |
| WS2812B, 2013 copy (the brief's table)   | 250–550 | 650–950  | 700–1000 | 300–600  | >50 µs  |
| WS2812B V5 (2019) and WS2811 V2.2 (2024) | 220–380 | 580–1000 | 580–1000 | 580–1000 | >280 µs |

TH+TL in the 2013 copy is 1250 ± 600. The two generations share T1L only at
580–600.

How each part's printed windows meet those two tables:

| Part (document)                                                                                             | T0H     | T1H         | T0L           | T1L           | Reset                       | Meets WS2812B 2013                          | Meets V5 / WS2811 V2.2                        |
| ----------------------------------------------------------------------------------------------------------- | ------- | ----------- | ------------- | ------------- | --------------------------- | ------------------------------------------- | --------------------------------------------- |
| SM16703P IBZGZIV1.3, SM16704PB IBIBZIV1.3, SM16712P IBOQZIV1.4 (identical tables)                           | 200–400 | 800–1000    | ≥800 (<20 µs) | ≥200 (<20 µs) | ≥200 µs, T ≥1200            | yes: 250–400 / 800–950 / 800–1000 / 300–600 | yes: 220–380 / 800–1000 / 800–1000 / 580–1000 |
| SM16714PHT IBGSZZV1.0                                                                                       | 200–400 | 700–1000    | ≥800          | ≥200          | ≥200 µs, T 1200–20000       | yes                                         | yes                                           |
| SM16703P IAV1.1 (2014), SM16803PB, SM16804PB/EB, SM16824E, old SM16704 copy, GE8812B (all 0.3/0.9 ±0.05 µs) | 250–350 | 850–950     | 850–950       | 250–350       | ≥200 µs (IAV1.1: 80 µs typ) | yes, T1L overlap 300–350                    | **no**: T1L 250–350 vs 580–1000               |
| SM16714P IBGSIBV1.1                                                                                         | 250–350 | **550–650** | 850–950       | **550–650**   | ≥200 µs                     | T1H touches only at exactly 650             | yes: T1H 580–650, T1L 580–650                 |
| GS8206 V0.2, GS8208 V0.1/V0.7, CS8812, LC8808B (1:3 at 800 kHz, computed)                                   | 312.5   | 937.5       | 937.5         | 312.5         | >300 µs                     | yes                                         | **no**: T1L 312.5 < 580                       |
| GE1603R                                                                                                     | 200–350 | 550–1000    | 600–1500      | 300–1500      | ≥350 µs, T ≥1200            | yes                                         | yes                                           |

The GS82xx code is a ratio. A 1:3 "1" with T1H ≤ 1000 has T1L ≤ 333, so no
1:3 bit can meet V5's T1L ≥ 580 at any frequency.

Two transmitter settings follow from the tables:

- **800 kHz at 1:3 duty (312.5/937.5 ns) with reset ≥350 µs.** This meets
  every printed table in the batch except two: WorldSemi's V5-era tables
  (T1L) and SM16714P V1.1 (T1H 0.6 µs).
- **300/900 and 900/590 ns with reset ≥350 µs.** This meets both WorldSemi
  tables, SM16703P V1.3, SM16704PB, SM16712P, SM16714PHT and GE1603R. It
  fails the ±0.05 µs tables (T1L ≤ 350), the GS82xx 1:3 shape and SM16714P.

On paper, then, the batch splits into a "T1L ≈ 0.3 µs" camp (the ±50 ns
tables, Genesis, GE8812B) and WorldSemi's newer "T1L ≥ 0.58 µs" tables.
Sunmoon's newer min/max tables and GE1603R sit in both camps.

## Indistinguishable on the wire (plain frame, latch on low)

These parts take the same code, have overlapping windows (above) and use the
same frame shape. Only the bits per chip and the channel order differ.

1. **24 bits per chip.**
   - SM16703P: R G B.
   - GE8812B: G R B.
   - GE1603R: R G B.
   - GS8206, GS8208 (IC and LED5050), CS8812 and LC8808B: Ch00 Ch01 Ch02.
     Which channel drives which output is not stated.
2. **32 bits per chip, RGBW:** SM16704PB.
3. **96 bits per chip:** SM16712P, sent R1 G1 B1 … R4 G4 B4. This is exactly
   four WS2811-style RGB pixels per chip, so it differs only by frame length.

## Different on the wire

All of these use the same code as above. The difference is a current-gain
word sent once after the last chip's data and before the reset. Every chip
receives it: the input diagrams show the word at the end of each chip's
stream.

- **SM16803PB:** 24 bits per chip, then a 16-bit word: 4 reserved bits, then
  R, G and B at 4 bits each.
- **SM16804PB/EB and SM16824E:** 32 bits per chip, then a 16-bit word: R, G,
  B and W at 4 bits each, with no reserved bits (Chinese datasheets).
- **SM16714P and SM16714PHT:** 32 bits per chip, then a 20-bit word: W, B, G
  and R at 5 bits each, white first. SM16714P V1.1 also prints a different
  "1" bit: T1H 0.6 ±0.05 µs and T1L 0.6 ±0.05 µs.
- **SM16711:** the output current and polarity are set by data. The datasheet
  mentions an instruction register (bit 23 = polarity P; R white-balance gain
  in "Bit14-16"). The only copy found prints no timing values and no frame
  layout, and its speed is chosen by a SET pin: 833 or 417 kHz typical.

**SM16803/SM16804/SM16824E vs SM16703/SM16704.** The code is the same, and
the bit-time table is identical to SM16703P IAV1.1. Two things differ on the
wire:

- **Reset:** ≥200 µs, against IAV1.1's 80 µs typical. SM16703P's newer
  IBZGZIV1.3 also says ≥200 µs.
- **Trailing gain word:** 16 bits.

Two other differences are not on the wire. Internally, 8 bits are
gamma-corrected to 65,536 levels at 4 kHz PWM. And SM16803PB, SM16804PB and
SM16804EB label both DIN and DOUT as "input / cascade output"
(级联信号输出端/信号输入端). SM16824E does not, and none of them explain it.

None of the datasheets says what a chip does when the gain word is missing.
Falcon nonetheless lists SM16804 under its plain 4-channel APA109 type.

## Backup line

**GS8206, GS8208 (IC and LED), CS8812 and LC8808B.** The text is the same in
all of them, and both Genesis application drawings show the wiring.

- Each chip's SDI2 ("Redundant series data input") is wired to the previous
  chip's SDI.
- SDI is the default after power-on. The chip "switches between SDI and SDI2
  when the transmission data is abnormal".
- "SDI uses the 1-24bits received data… SDI2 will discard the 1-24bits data
  and use 25-48bits data". So when the pixel before it dies, a pixel still
  finds its own 24 bits on SDI2.
- Under a test controller, a faulty channel lights white.
- GS8208 V0.7 adds that a reversed data cable turns that pixel's PWM off.

**GE1603R.** The IC has "redundant data to prevent signal interrupt". Pin 7
is drawn as "NC" but described as "Redundant Data", and DOUT is the
"Forwarding redundant data flow output". The strip has DI/BI and DO/BO pads.
How BI is fed and how the chip chooses an input is not documented.

**None** on any Sunmoon part in this batch or on GE8812B.

## Disagreements between documents

- **SM16703P:**
  - IAV1.1 (2014) prints 0.3/0.9 ±0.05 µs with an 80 µs typical reset.
    IBZGZIV1.3 prints min/max windows with Trst ≥200 µs.
  - IAV1.1 gives the rate test condition as "占空比67%(数据1)" (67% duty for
    a 1), but its own table gives 75%.
- **SM16714:**
  - The SM16714P V1.1 T1H window (550–650) and the SM16714PHT T1H window
    (700–1000) do not overlap.
  - Port voltage: 15 V on the SM16714P against 26 V on the SM16714PHT/TH.
  - Current: 39.7 mA in the table, 40 mA in the briefs, 38 mA in the guide.
- **SM16804PB English IBSZZIV1.1** describes the gain word as "16bits, with 4
  reserved bits" plus 4 bits each for R, G, B and W, which is 20 bits. The
  Chinese IBSZZOV1.0 (PB and EB) and SM16824E say 16 bits = R, G, B, W with
  no reserved bits. The English header, and Sunmoon's own PB brief, read
  "SM16804EB".
- **SM16704PB English IBIBZIV1.3** draws only 24 RGB cells under "32bits…
  Bit31…bit0". The Chinese edition draws W7…W0 too.
- **SM16824E:** its feature list says "SOP8", but the order table and the
  pin diagram say ESOP8.
- **GS8208 V0.1 against V0.7:**
  - Maximum rate: 1 MHz against 1.2 MHz.
  - Supply: 9–15 V against 8–36 V, with a 50 V port.
  - With no input, V0.1 shows built-in patterns. V0.7 turns PWM off "in the
    external control state" and adds the GS8208B and GS8208B_10 without
    animations.
  - Output stagger: OUT1→2→3 against OUTB→G→R.
- **GE1603R:** the IC sheet gives a minimum T of 1.20 µs; the strip sheet
  says TH+TL ≥1.25 µs. The IC sheet also calls the protocol "SPI" and lists a
  "SET" input that has no pin.
- **GE8812B:** p2 says "unipolar NRZ" while the timing and the product page
  are RZ.
- **Controller makers against datasheets:**
  - Advatek gives GS8206/GS8208 "Current Control Global: 2 Bits", but the
    Genesis frames have no such bits.
  - Falcon lists SM16804 as plain 4-channel, but its frame carries a gain
    word.
  - Advatek calls SM16714 "very similar to SM16712".
- **CS8812 and LC8808B documents are renamed GS8208 V0.1 datasheets.**
  - The hidden text layers (CS8812 p1, LC8808B p2) still say "GS8208".
  - The LC8808B PDF has the same title ("BS0815") and creation timestamp
    (2018-05-18 16:58:56 +08) as the Genesis GS8208 copy on artleds.com.
  - Advatek's CS8812 LED table equals GS8208 V0.7's LED table.
  - Witop sells CS8812 "version A" (with programs) and "version B" (without),
    matching GS8208 and GS8208B.

## Database corrections

1. **`pixel-ics/sm16804` (`sources.data.type`):** "the 16-bit gain word is 4
   reserved bits then 4 bits each for R, G, B and W" is wrong. Per
   SM16804PB/EB IBSZZOV1.0 p7, it is 16 bits = R, G, B, W at 4 bits each.
2. **`pixel-ics/sm16714`:** the entry merges SM16714P with SM16714PHT/TH.
   - SM16714P: T1H 0.6 µs, 15 V ports. SM16714PHT/TH: T1H 0.7–1.0 µs, 26 V
     ports. So `output_voltage: 26V` and `aliases: SM16714P` conflict.
   - The frame (32 bits per chip + a 20-bit W/B/G/R gain word) is now
     documented, which replaces the WLED-forum source.
3. **`pixel-ics/sm16711` (`data.type: WS2811/12`):** this rests only on
   Falcon. The datasheet shows command/gain data in the stream; the frame and
   timing are unverified.
4. **`pixel-ics/sm16703`:** the `datasheet.url` ("English V1.3") is the
   one-page brief IBOBISV1.3. The full English datasheet is IBZGZIV1.3.
   `sources.data.type` quotes the 2014 IAV1.1 "reset 80 us"; IBZGZIV1.3 says
   ≥200 µs.
5. **`pixel-ics/sm16803`:** the frame is now documented (SM16803PB
   IBSZZOV1.0). It is 24 bits per chip + a 16-bit word (4 reserved, then R,
   G, B), not the SM16804 layout.
6. **`pixel-ics/sm16824e`:** the full datasheet IBZOZOV1.2 exists and
   confirms 32 + 16 bits (R, G, B, W, no reserved bits). It can replace the
   FastLED and NeoPixelBus sources.
7. **`pixels/lc8808b`:**
   - `electrical.supply_voltage: 5V` is wrong. p6 gives VDH 9/12/15 V; 5 V
     is the internal VCC.
   - `color.order: BGR` is not stated in the datasheet.
8. **`pixels/gs8208`:**
   - `led_voltage_notes` "Datasheet 10.8-13.2V" is in neither V0.1 (9–15 V)
     nor V0.7 (8–36 V).
   - The note "onboard patterns - now eliminated" is not right: V0.7 still
     sells GS8208 with animations, and GS8208B without.
   - `color.order: RGB` is not stated in either revision.
9. **`pixel-ics/gs8206` and `pixel-ics/gs8208`** have no
   `data.backup_line`. Both have SDI2, so the value is `true`.
10. **`pixel-ics/ge1603`:** "no datasheet found" is out of date. Greeled's
    "GE1603R Mini IC" datasheet is archived (URL in the yaml). `data.type`
    can be filled: single-wire RZ, 24-bit RGB, 800 kbps, reset ≥350 µs, and
    Greeled calls it "Compatible with SK6812 Protocol".
11. **`pixel-ics/gs8202`:** `creator: Shenzhen Greesit Technology` has no
    source, and none was found.
12. **`pixels/cs8812`:** the evidence says its datasheet is GS8208's, so a
    relation to `pixel-ics/gs8208` citing the shared datasheet fits better
    than the note "Similar to GS8208". The same goes for `pixels/lc8808b`
    ("Very similar to the GS8208").

## Still open

- **GS8202:** no datasheet anywhere.
- **SM16711:** bit times, reset and frame layout.
- **GS82xx family:** the tolerance of the 1:3 code, and which data channel
  drives which output or colour.
- **SM168xx and SM16714:** behaviour without the gain word, and how the
  "bidirectional" DIN/DOUT works.
- **GE1603R:** the BI mechanism.
