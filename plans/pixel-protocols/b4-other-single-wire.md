# b4-other-single-wire: summary

Evidence, quotes and URLs: [b4-other-single-wire.yaml](b4-other-single-wire.yaml). Researched 2026-11-20.

## Short answer

- **Plain WS2811-style frame, and inside the older WorldSemi WS2812B windows on paper:** TX1818, INK1003 (and INK1002, which contains it), LB1908. All three are 24 bits per chip, R G B order, MSB first, reset by a low time.
- **Same frame, but outside the newer WorldSemi windows (WS2812B V5, WS2811 V2.1.1):** TX1818 and INK1003. Their 1-code low time (max 350 / 325 ns) never reaches WorldSemi's 580 ns minimum. LB1908 fits only in a narrow corner (T1L 580–600 ns).
- **WS2811-style bits, different frame:**
  - FW1906 takes 48 bits per chip (two RGB groups).
  - LPD1886 takes 36 bits per chip in 4096-level mode, splits each channel into 4 + 8 bits, and latches after only 10 µs of low.
- **Single wire, but not WS2812B timing (per the LED packager):** P943. WEERSOM's sheet prints 0.35 / 1.36 µs pulses, a 1.71 µs bit (≈585 kbps), a 12 µs "WT" slot between pixels and a 50 µs reset. Advatek says 800 kbps.
- **Different protocols:**
  - MBI6120: Macroblock's own single wire. Variable 1–10 µs bits with short-pulse coding, a 36-bit header, gap symbols, 12-bit channels and the last IC first.
  - TLS3001: Manchester coding with sync, reset and data frames, 39 bits per chip, and a reverse-direction second path.
  - Adafruit Pixie: plain UART, 115200 baud 8N1, latched by 1 ms of silence.
- **No maker timing found:** NS8808 / HD8808, P9412, P9883, TC2811 and QED3001.
  - NS8808 / HD8808: the maker only claims "same protocol with ws2815".
  - P9412, P9883, QED3001: controller makers only.
  - TC2811: only a product row from Fuman, the probable maker.

## Overlap arithmetic (ns)

Reference windows, from WorldSemi's printed values (see `reference_documents`):

- **R1, WS2812B (2013 sheet):** T0H 400±150 → 250–550; T1H 800±150 → 650–950; T0L 850±150 → 700–1000; T1L 450±150 → 300–600; RES > 50 µs.
- **R2, WS2812B V5 and WS2811 V2.1.1:** T0H 220–380; T1H 580–1000; T0L 580–1000; T1L 580–1000; RES > 280 µs.

`*` marks values derived from a printed period rather than printed directly.

| Part (doc)                     | T0H     | T1H       | T0L        | T1L       | reset                                | ∩ R1                                                                 | ∩ R2                                                                  |
| ------------------------------ | ------- | --------- | ---------- | --------- | ------------------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| TX1818 (TCWIN A2, ±50)         | 250–350 | 850–950   | 850–950    | 250–350   | ≥ 80 µs                              | 250–350 / 850–950 / 850–950 / **300–350**: all overlap               | T1L 250–350 vs 580–1000: **disjoint (230 ns gap)**                    |
| INK1003 (Greeled, ±75)         | 175–325 | 925–1075  | 925–1075   | 175–325   | > 24 µs                              | 250–325 / **925–950** / 925–1000 / **300–325**: all overlap (narrow) | T1L 175–325 vs 580–1000: **disjoint (255 ns gap)**                    |
| LB1908 (cycle 1.1–1.3 µs)      | 250–350 | 700–900   | 750–1050\* | 200–600\* | ≥ 200 µs; byte gaps ≤ 80 µs          | 250–350 / 700–900 / 750–1000 / 300–600: all overlap                  | T1L **580–600** only, which needs T1H ≤ 720 so the cycle stays ≤ 1300 |
| FW1906 (T = 1250 typ, no tol.) | 320–400 | 640–800   | 850–930\*  | 450–610\* | ≥ 200 µs (typ 500)                   | 320–400 / 650–800 / 850–930 / 450–600: all overlap                   | T0H 320–380; T1L **580–610** only (T1H ≤ 670)                         |
| LPD1886 (min–max)              | 150–280 | 450–9000  | 500–10000  | 150–10000 | start > 24 µs; latch after 10 µs low | **250–280** / 650–950 / 700–1000 / 300–600                           | 220–280 / 580–1000 / 580–1000 / 580–1000                              |
| P943 (WEERSOM, ±150)           | 200–500 | 1210–1510 | 1210–1510  | 200–500   | 50 µs; WT 12 µs between pixels       | T1H vs 650–950 and T0L vs 700–1000: **disjoint**                     | T1H, T0L, T1L: **disjoint**                                           |

- P943 also misses the old WS2811 400 kHz table, R3 in the YAML (T0L 1850–2150, T1L 1150–1450).
- The order is a controller setting, not a protocol difference. TX1818, INK1003, LB1908 and FW1906 print **R G B** order. That matches WS2811 V2.1.1 ("in order of RGB", p4); WS2812B prints GRB (2013 p5, V5 p4).
- Reset: every part's printed minimum is met by holding the line low ≥ 280 µs. Watch LB1908's "byte gaps ≤ 80 µs" and LPD1886's 10 µs auto-latch: the gap a transmitter leaves between bytes must stay below both.
- Controller makers agree on the grouping. Falcon's "WS2811" type lists INK1002, INK1003, LB1908 and P9883 as alternatives, and its "TLS3001" type lists QED3001. These are controller-maker statements.

## How the others differ

- **FW1906:** WS2811-style RZ bits at 800 kHz, but **48 bits per chip** (R1 G1 B1, then R2 G2 B2). A WS2811 controller sees one chip as two pixels. It powers up with white on.
- **LPD1886:** RZ bits inside both windows, but **36 bits per chip** in 4096-level mode (GM pin low). Each channel is sent bits 3..0 and then 11..4, as drawn. A frame starts after > 24 µs low and **auto-latches after 10 µs** of low. The 256-level frame (GM floating) is not described. FastLED sends 24-bit pixels for both of its LPD1886 classes.
- **MBI6120:**
  - Bit width is 1–10 µs, measured from 12 leading 1s. Logic 0 is a short high pulse (TW 0.08 µs to 0.25 × Tbit). Logic 1 is high with a short low pulse TW at the end.
  - Each packet starts after SDI is low > 750 µs. The header is 36 bits: 12 × 1, a GCLK select, CMD 0x00 or 0x55, and a 10-bit IC count (1–1023), then a gap symbol (2 bit widths).
  - Then comes each IC's 3 × 12-bit block plus a gap, **last IC first**. There is no latch command.
- **TLS3001:**
  - **Manchester coding:** high→low is 1, low→high is 0. The rate is 100 kHz–2 MHz, auto-detected, idle low, MSB first.
  - Frame types are sync (15×1 + 0001 + 11×0, then wait > chips ÷ MHz × 30 µs), reset (15×1 + 0100, then 1 ms) and data (15×1 + 0010, then 39 bits per chip = 0 + 12 bits, three times, first chip first).
  - **Backup on SOP14:** a second, reverse-direction path (SDI2 → node N … node 1 → SDO2). It carries the pixel data in reverse order; the chip prefers channel 1 and switches on a break.
  - The latch is not in the sheet; the implementations differ.
- **QED3001:** maker confirmed (QED Micro, 质能达微电子; 2019 product list). Falcon groups it with TLS3001, and Advatek's fields match TLS3001 except 5–32 V. No maker protocol text survives.
- **Adafruit Pixie:**
  - **UART 115200 8N1**, idle high, LSB first, 3 bytes (R, G, B) per Pixie, first Pixie first.
  - Each Pixie keeps the first 3 bytes and echoes the rest edge by edge (< 1 µs). It **latches after ≥ 1 ms of silence** (firmware: 30 × 32 µs = 960 µs).
  - The watchdog turns the LED off after about 2 s without data.
  - The guide says the first design used the WS28x protocol and was then changed.
- **Backup lines:** the rules differ, even where the bits match.
  - LB1908's FDIN drops the first 24 bits it receives; a controller feeding FDIN directly sends a dummy packet first.
  - TX1818's FDIN rule is not written.
  - P943 names DI1 / DI2 and draws a second stream starting at pixel 2, with no rule.
  - NS8808 has "two-signal data input" and no details.
  - TLS3001 is the reverse ring described above.

## Disagreements between documents

- **TX1818:** the reset row differs between the two A2 sheets (5050 "≥80µs --", 3535 "80µS >0us"). The data-rate symbol is printed "FDIN", the same as the backup pin's name.
- **INK1003:**
  - It claims "400~800KHz", but prints only the 800 kHz table.
  - Its refresh example "1024X0.4X2=0.8192ms" does not match 24 bits × 1.25 µs per chip.
  - INK1002 promises "up to 2048 lamps" and also "unlimited".
- **LB1908:**
  - It calls a 1.2 µs cycle "800KHz" (that is 833 kHz).
  - It requires low times "per the table" but prints none.
  - It labels the data rate "PWM refresh rate Fin".
  - It mentions an undefined "mode setting command", and its ESD sentence names Titan Micro.
  - Features say 14 mA; the electrical table says 9–11 mA.
- **FW1906:**
  - The text says 48 bits per chip, Figure 6 says "72 bits".
  - It mentions "OUTR1/2/3/4" and "four groups of RGB" for a chip with two groups.
  - The refresh calculation uses 1200 ns, Table 6 uses 1250 ns.
  - The limit table says 400–900 kHz, the switching table says 800 kHz.
- **MBI6120:** the figure says "N=1~1024", the text says 1023 maximum (10-bit NUM). NUM is called "12-bit" while bits [11:10] are reserved.
- **LPD1886:**
  - Features say "MAX is 16MHz", the parameter table says 0.1–1.6 MHz.
  - The text says "4bits+8bits … the high level is in front"; the figure sends the low nibble first.
- **TLS3001:**
  - English V2.2 says "8 bit color depth" and "100KHz~1MHz". Chinese V2.0 and the frame format say 12 bits and 100 kHz–2 MHz; V2.2's own application notice also says 2 MHz.
  - The sync frame has 11 trailing zeros in the datasheet and in mikbeng's code; ESPixelStick sends 15.
- **P943:** WEERSOM's timing gives ≈585 kbps; Advatek says 800 kbps. Figure labels "DO/DI" do not match the note's "D0/D1".
- **NS8808:**
  - Newstar's description names "GE8808B".
  - Greeled's GE8808 sheet repeats the wording and adds "1:3 duty cycle", "standard 800kHz", "Intervals between code >300us Reset" and "SDI2 will discard the 1-24bits data". That sheet was read via SlideShare OCR, and nothing was transferred to NS8808.
  - The 2024 Wayback title has no "HD8808".
- **Pixie:**
  - Latch silence: the guide and library say 1 ms, the firmware 960 µs.
  - PWM: the guide says "about 500Hz", the firmware comment 488 Hz.
  - Advatek calls it "a variant of the standard DMX512 protocol" and lists RGB/RGBW and 5–24 V. ENTTEC calls it "self-clocking" with RGBW. Adafruit describes plain async serial, RGB, 5 V.

## Database corrections (not applied)

- **pixels/tx1818:** `sources.data.type` says "Same framing and timing as the WS2812". TCWIN prints 0.3 / 0.9 µs ±50 ns. That overlaps the 2013 WS2812B windows, but T1L 250–350 ns is outside WS2812B V5 / WS2811 V2.1.1 (580–1000 ns).
- **pixels/adafruit-pixie:**
  - `technical_notes` says "PIC12F1572"; the guide (p7) says "Microchip PIC12F1571".
  - `sources.color.pwm_frequency` says "Adafruit gives no PWM rate"; guide p9 says "The PWM peripheral runs at about 500Hz".
- **pixel-ics/lpd1886:**
  - `technical_notes` says FastLED drives "LPD1886 (12-bit) or LPD1886_8BIT". In FastLED master (379b60be) both classes are identical 24-bit controllers.
  - `sources.data.type` says "4 + 8 bits, high first"; the datasheet figure sends bits 3..0 before 11..4.
- **pixel-ics/fw1906:** `sources.data.type` says "reset 200-500 us"; Table 6 prints 200 µs min and 500 µs typ, with no max.
- **pixels/p943:**
  - `notes` says "known only from controller makers' protocol pages" and `technical_notes` says "No maker datasheet found". WEERSOM (LED packager) publishes P943 sheets with pinout and timing (will-led.com /content/?70.html, ?38.html).
  - `data.bitrate: 800kHz` conflicts with that sheet's 1.71 µs bit.
  - There are 6-pin (DI2, DI1, DO2) and 8-pin (OUT, DI1, DI2, R, G, B) variants.
- **pixel-ics/tc2811:** `creator: Unknown`. Fuman (富满微电子) lists a TC2811H (SOP-8, single-wire RZ, RGB, 12 mA, 5–24 V); not confirmed to be the same part. Nothing read supports `notes: WS2811 Clone`.
- **pixel-ics/qed3001:** the creator is QED Micro (深圳市质能达微电子科技有限公司). There is no `data.type`; the only basis for one is Falcon's TLS3001 grouping, a controller maker's.
- **pixel-ics/tls3001:** add a backup line (SOP14 dual-path, reverse direction) and a data rate (100 kHz–2 MHz per V2.0; V2.2 says 100 kHz–1 MHz).
- **pixels/hd8808:** `pwm_frequency_notes` says "8kHz per the datasheet", but Newstar has only a product page. `color.order: RGB`, `gpio 3.5–5V`, `quiescent_current 2mA` and `supply_voltage 5V` are not on that page; it says "12v operating supply voltage with 7805 module inside" and "Working Voltage: 12VDC".

## Still open

- NS8808 / HD8808: any Newstar timing or backup rule. Whether it is a relabelled GE8808.
- P9412, P9883: any maker document. Advatek, ENTTEC and Falcon are the only sources.
- P943: what "WT 12 µs" means; the DI1 / DI2 rule; an IC-maker (Power MOS / DMS) sheet.
- TC2811: a readable datasheet. Fuman gives it on request only; the aggregators block scripted access.
- TX1818: the FDIN selection rule and whether it drops 24 bits.
- MBI6120: how each IC picks its block, and the "MBI6120 Application Note".
- LPD1886: the frame in 256-level mode.
- TLS3001: how data latches (not in the sheet); there is no maker-hosted copy.
