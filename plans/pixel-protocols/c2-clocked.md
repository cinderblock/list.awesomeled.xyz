# Batch c2-clocked: clocked pixel ICs, summary

Researched 2026-11-20 for workstream 8 ([plan](../pixel-protocols.md), [brief](BRIEF.md)).
Evidence for every statement below is in [c2-clocked.yaml](c2-clocked.yaml): verbatim quotes with
URLs and PDF page numbers. "Library" and "controller" sources are third-party and are labelled so.

19 parts: WS2801, WS2803, LPD6803, D705, UCS6909, LPD8806, LPD8803, P9813, SM16716, SM16726,
MY9221, MY9231, MY9291, MBI6020, MBI6023, MBI6024, DM412, LD1510, ICND2110.

## What a transmitter must send

None of the 19 parts can be driven with an APA102 frame (32 zero bits, then per LED `111` +
5-bit brightness + B, G, R bytes, then an end frame). They fall into nine wire formats.

1. **Time-latched 24-bit (WS2801).** No start or end frame. 24 bits per chip, R7…R0 G7…G0 B7…B0,
   MSB first, sampled on the rising edge, up to 25 MHz. The first chip keeps the first 24 bits and
   relays the rest. The latch is the clock held low for more than 500 µs.
   - WS2803: WorldSemi's product page gives only a 144-bit shift register (18 × 8), the rising edge
     and 25 MHz. Its latch is not documented anywhere readable. Only Falcon and FastLED group it
     with the WS2801.
2. **32 zero bits, then 16-bit words (LPD6803 family).** Each word is `1` + 5-bit R + 5-bit G +
   5-bit B, MSB first, on the rising edge. After the data, one extra clock per word with data low.
   The first word goes to the nearest chip.
   - LPD6803: one word per chip. Recommended clock 0–15 MHz (the limit table says 25 MHz and the
     features 24 MHz). With CMODE=0 the data clock is the PWM clock, so the controller must keep
     clocking. With CMODE=1 or floating (the default) a 1.2 MHz oscillator free-runs.
   - D705: one word per chip, the same recommended timing table value for value, abs max 20 MHz.
     It has a 1.2 MHz oscillator and no CMODE.
   - UCS6909: three words per chip (R1/G1/B1 first), with "N" extra pulses where N is the number of
     points. Slower: clock high and low ≥50 ns, recommended under 10 MHz (limit under 15 MHz).
3. **Zero bits, then 25-bit words (SM16716 family).** At least 50 zero bits, then per chip `1` +
   24 bits, MSB first, on the rising edge, up to 30 MHz. After the data, one extra clock per chip
   with data low.
   - SM16726: its own datasheet says that with SET=1 (the default) it uses "the same two-wire data
     protocol as SM16716". With SET=0 the start is ≥52 zero bits and each chip gets `11` + 24-bit
     gray, or `10` + a 24-bit status register (current gains plus 13 fixed check bits).
4. **Bytes with the top bit set, reset by zero bytes (LPD8806 family).** The maker datasheet prints
   no frame. Adafruit's library documents 3 bytes per LED, each `0x80 | 7-bit value`, in G, R, B
   order on its strips. The first bytes go to the nearest LED, and each byte latches as the next
   one arrives. (LEDs + 31) / 32 zero bytes reset the strip.
   - LPD8803: shares the LPD8806 datasheet, which documents no frame for it either.
5. **P9813.** A 32-bit start frame (its value is not printed), then 32 bits per pixel: `11` +
   ~B7 ~B6 ~G7 ~G6 ~R7 ~R6 + B, G, R bytes, MSB first, rising edge. The features give 15 MHz and
   the absolute table 20 MHz. No end frame or latch is printed. FastLED sends 32 zero bits
   afterwards. The check bits are verified only with JEN=0, and JEN has a pull-up.
6. **MY-Semi shift registers latched by DI pulses.**
   - MY9221: 208 bits per chip, a 16-bit command then 12 × 16-bit words (A3 first … C0 last).
     8/12/14-bit modes pad each word to 16 bits. Data is sampled on both DCKI edges (10 MHz clock,
     20 Mbit/s). To latch, park DCKI at either level for more than 220 µs, then send 4 DI pulses;
     data loads on the 2nd falling edge. It is a plain shift register, so the first bits sent end
     up in the farthest chip.
   - MY9231 and MY9291: the only maker documents found are one-page briefs. Per two related
     libraries (my92xx, ESPHome): an 8-bit command per chip in a separate phase (12 DI pulses,
     command, 16 DI pulses), then words of the selected width (8, 12, 14 or 16 bits), 3 per chip
     (MY9231) or 4 per chip (MY9291), on both edges. The latch is 8 DI pulses after ≥12 µs.
7. **Plain shift registers with a strobe.**
   - DM412: 48 bits per chip (R15…B0), rising edge, up to 20 MHz (10 MHz when cascaded with SDO=L).
     It latches on the STI pin (a third wire, passed on as STO), or automatically when CKI is held
     high and DAI carries 8 pulses (only with SDO=H).
   - LD1510: 24 bits (MOD=L) or 36 bits (MOD=H) per chip, R, G, B, MSB first, up to 10 MHz (V3.0
     lowered it from 20 MHz). The strobe is sent ≥10 µs after the last clock: CLKI low while DI
     toggles 5 times, each phase ≥100 ns + 1 ns per chip.
8. **Macroblock packets (MBI6020, MBI6023, MBI6024).** Sampled on the CKI **falling** edge,
   0.2–10 MHz. Each packet is:
   - a prefix: CKI and SDI both low for more than 172 CKI cycles;
   - a header: 48 bits (H, A=0, H, L=N−1, parity, X, L) or 30 bits (H, parity, A, L), where
     H[5:0] picks the data type;
   - data for the last IC first.

   There is no latch command.
   - MBI6020: 3 words per IC (C, B, A). Six commands: gray, dot correction and configuration.
   - MBI6023: 12 words per IC (C3 … A0), gray commands only.
   - MBI6024: the MBI6023's gray packets plus dot-correction and configuration packets.

9. **ICND2110 (Chipone).** The clock must run "continuously, without interruption", rising edge,
   up to 30 MHz. Each frame is:
   - 128 ones (start);
   - a 16-bit register, with 16-bit zero blanks between all items;
   - per chip, two 96-bit blocks (OUT5…OUT0, then OUT11…OUT6, 16-bit words, MSB first);
   - 145 ones (end).

   SDI then stays low until the next frame. 12 outputs (4 RGB) per chip, first chip first.

Cross-cutting facts:

- **Sampling edge:** rising for most parts. MBI602x samples on the falling edge, MY9221 on both
  edges, and MY9231/MY9291 on both edges per the libraries.
- **Chain order:**
  - Nearest chip first: WS2801, the LPD6803 family, the SM167x6 pair, P9813, LPD8806 (Adafruit)
    and ICND2110.
  - First data ends in the farthest chip (shift register, shown in figures): MY9221, DM412, LD1510.
  - Last IC first, as the datasheet states: MBI602x.
- **Keep clocking:** ICND2110 always, and LPD6803 only with CMODE=0. Every other part free-runs on
  an internal oscillator, except UCS6909 and SM16726, whose datasheets do not say.

## Pairs asked about

- **D705 = LPD6803 on the wire** as documented: the same 32-bit zero start, the same
  `1`+5+5+5 word on the rising edge, the same trailing clocks and the same recommended timing table.
  The only gap is that the D705 sheet states MSB-first for the start frame alone. The D705 sheet
  never names the LPD6803; that grouping is Falcon's.
- **UCS6909** sends the same word stream with 3 words per chip, but needs ≥50 ns clock phases
  (≤10 MHz recommended).
- **LPD8803 vs LPD8806:** one shared datasheet. With PMOD=0 the LPD8806 "occupies only three sets of
  data on the data link". Neither frame is documented by the maker, so bit-for-bit identity is
  unverified. Falcon and Advatek treat them as one type.
- **SM16726 = SM16716** with SET=1, by the maker's own statement and identical frame text. SET=0 is
  a different frame.
- **MY9291 vs MY9231:** the same code in the my92xx library, with 4 channels per chip instead of 3.
  This is unverified against maker documents.
- **MY9221 ≠ MY9231:** command length, word padding and latch all differ. Falcon's "MY9231?"
  alternative under MY9221 is contradicted.
- **MBI6024 = MBI6023** for gray-scale packets, bit for bit (same commands, header layout and
  12-words-per-IC order). The MBI6024 adds packet types. The MBI6020 uses the same packet grammar
  with 3 words per IC, so for the same pixel count the header's IC count differs.

## Disagreements between documents

- **WS2801:**
  - The V0.3 → V2.0 POL polarity text flipped, and V2.0 contradicts itself.
  - Output voltage absolute maximum went from 7 V to 6 V, and ESD from 4000 V to 2000 V.
  - The text's "first bit is the data frame signal" conflicts with Fig 10, which shows 24 bits with
    R7 first.
- **LPD6803:** maximum clock is given as 24, 25 and 15 MHz in three places.
- **LPD8806/LPD8803:**
  - Colour depth: the datasheet says 256 levels, Adafruit and Advatek say 7 bits, ENTTEC says
    8 bits.
  - Clock: 20 MHz absolute vs 0–2 MHz recommended.
- **P9813:**
  - Clock: 15 MHz vs 20 MHz.
  - LED voltage: 17 V vs 12 V.
  - The check-bit text covers only blue, while the figure shows all three colours.
  - A pin-map caption says "P9816".
- **SM16716:** the DCLKO output is labelled "Clock input", and VDD typ-max 7.0 V exceeds the
  6.0 V absolute maximum.
- **SM16726:**
  - Package: SOP16 in the datasheet vs SOP14 on Sunmoon's product page.
  - Current: 10–33 mA in the datasheet vs 18–60 mA in the 2023 guide's SM16726P row.
- **MY9221:** V1.0 gives a 3–5.5 V supply and 17 V outputs; V3.0 gives 3.3–5 V ±10% and 24 V.
- **MBI6020:**
  - V1.01 has a configurable CKI time-out (95~172 cycles default); V2.00 makes those bits reserved.
  - V1.01 allows an external GCLK; V2.00 is internal only.
- **MBI6023:** the CKI time-out is "95 CKI cycles" in V1.00 and "2 CKI cycles" in VB.01 (checked
  on the rendered page).
- **LD1510:**
  - Between revisions the clock went from 20 MHz to 10 MHz, and the strobe from 2 DI toggles to 5.
  - Figure bit labels have typos (clock 1 "R00", 12-bit words labelled "…012").
- **ICND2110:**
  - RGB per chip: 4 in the datasheet vs 3 on Advatek.
  - Supply figures differ across the datasheet, Advatek and ENTTEC.
  - Chips are numbered chip0 in one place and chip1 in another.
  - The waveform draws one 96-bit block per chip where the steps send two.

## Database corrections (proposed, not applied)

- **`pixel-ics/ws2801`:** `electrical.output_voltage: 7V` is V0.3's absolute maximum. The linked
  V2.0 gives 6 V absolute and 5.5 V in the electrical characteristics.
- **`pixel-ics/lpd8806`:**
  - `data.pixel_size_bits: 32`: the only frame source (Adafruit) sends 24 bits (3 bytes) per RGB
    LED.
  - `color.pwm_frequency: 9.375kHz` is derived (1.2 MHz / 128). The datasheet prints "refresh rate
    greater than 4000Hz", and `lpd8803` already uses 4 kHz from the same document.
- **`pixel-ics/sm16716`:** `color.pwm_frequency: 2.5kHz` is not in the V1.1 datasheet, which prints
  fOSC 1.03 MHz and 256 levels. `data.bitrate` is missing; the datasheet prints 30 MHz.
- **`pixel-ics/sm16726`:**
  - The note "the frame layout is taken from Falcon's grouping" is superseded by the Sunmoon
    datasheet ([datasheet4u copy](https://datasheet4u.com/pdf/796033/SM16726.pdf)).
  - `packages: SOP-14` conflicts with the datasheet's SOP16.
  - `current_range: 18-60mA` is the SM16726P selection-guide value; the datasheet gives 10–33 mA.
- **`pixel-ics/my9231`:** `data.bitrate: 20MHz` should be a 10 MHz clock (20 Mbit/s on both edges).
  `max_per_string: 2010` has no source in the brief.
- **`pixel-ics/my9221`:** cite the V1.0 maker datasheet for `data.type`, not the Seeed library.
  `output_voltage: 24V` is V3.0; V1.0 says 17 V.
- **`pixel-ics/mbi6020`:**
  - `output_voltage: 12V` should be 17 V.
  - `channel_bits: 10` should be 16 or 10.
  - Add the QFN-16 package, CKI 0.2–10 MHz, 5–50 mA and 3–5.5 V.
  - Replace the DatasheetCafe source with Macroblock's VA.00, V2.00 and V1.01 PDFs.
- **`pixel-ics/icnd2110`:** "No maker datasheet found" is out of date; Chipone V1.1 (Aug 2018) is at
  [olympianled.com](https://downloads.olympianled.com/PDF/Driver%20ICs/ICND2110-datasheet-EN-2018-V1.1-including-PG.pdf).
  Add 12 channels (4 RGB), 30 MHz, VDD 3.3–5.5 V and 0.5–25 mA. It needs its own `data.type`.
- **`pixel-ics/ws2803`:** `data.type: WS2801` rests on FastLED and Falcon only.
- **`pixel-ics/p9813`:** `color.pwm_frequency: 4.687kHz` is derived (1.2 MHz / 256), not printed.
  `supply_voltage: 4.5V` is the bottom of the recommended 4.5–7.5 V; the features say 5–6.5 V.
- **`pixel-ics/lpd6803`:** the datasheet names no maker; the database says Greeled and Advatek says
  Qiancai.

## Still open

- **WS2803:** no datasheet is readable. The WorldSemi spec `.rar` was never archived, Scribd blocks
  scripted fetches, and alldatasheet (403) and datasheetspdf (DNS) failed. Its latch, bit order and
  channel order are unknown.
- **LPD8806/LPD8803:** the maker frame format was never found; every frame fact is Adafruit's
  reverse engineering.
- **MY9231/MY9291:** there is no full datasheet. The frame comes from two non-independent libraries,
  and set-up, hold and latch timing limits are unverified.
- **P9813:** the start-frame value, end frame and latch are not printed.
- **SM16716:** which 8-bit group drives OUT1, OUT2 and OUT3 is not printed.
- **D705:** MSB-first is stated only for the start frame.
- **ICND2110:** it is not said whether CLK is the PWM clock, or how the start and end runs of ones
  are told apart from data.
