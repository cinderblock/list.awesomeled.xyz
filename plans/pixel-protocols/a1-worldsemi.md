# a1-worldsemi: summary

Evidence (every value with URL, page and quote) is in [a1-worldsemi.yaml](a1-worldsemi.yaml).
Researched 2026-11-20. All parts: single wire, idle low, MSB first, 8 bits per channel except WS2816
(16), each chip keeps its own word and re-shapes the rest onto DO (tPLZ ≤ 300 ns where printed).

## The timing tables (ns; reset in µs)

WorldSemi reuses a few tables across parts. Letters are used below.

| Table | Where printed                                                                                                                      | T0H     | T1H      | T0L         | T1L         | Reset            |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ----------- | ----------- | ---------------- |
| A     | WS2811 2011, high speed = low-speed ÷ 2 (no tolerance printed)                                                                     | 250     | 600      | 1000        | 650         | >50              |
| A′    | same, if the low-speed ±150 ns carried over                                                                                        | 100–400 | 450–750  | 850–1150    | 500–800     | >50              |
| C     | WS2812 6-pin (2012), ±150                                                                                                          | 200–500 | 550–850  | 650–950     | 450–750     | >50              |
| D     | WS2812B 2013, ±150                                                                                                                 | 250–550 | 650–950  | 700–1000    | 300–600     | >50              |
| E     | WS2812B V1.0 Jan-2016, ±150                                                                                                        | 250–550 | 700–1000 | 700–1000    | 250–550     | >50              |
| F     | WS2812B Mar-2017                                                                                                                   | 220–380 | 750–1600 | 750–1600    | 220–420     | >300             |
| H     | WS2813 2016 (period 1.25 µs ±300 ns)                                                                                               | 300–450 | 750–1000 | 300–100 000 | 300–100 000 | ≥300 (text: 250) |
| J     | WS2815 2017, WS2815B 2018, WS2818A V1.0 2017                                                                                       | 220–380 | 580–1600 | 580–1600    | 220–420     | >280             |
| L     | WS2818 (undated, "Low Speed Mode Time")                                                                                            | 220–480 | 750–2000 | 750–2000    | 220–480     | ≥300             |
| G     | WS2811 V1.4–V2.2, WS2812B V5/V6/V7, WS2813B-B/-V6, WS2813A-V7, WS2818B, WS2808 V1.0, WS2805, WS2814 SOP12, WS2814B/F, WS2816A-V2-B | 220–380 | 580–1000 | 580–1000    | 580–1000    | >280             |
| G′    | WS2811 English V1.52 (2026): T1H 540–1000, rest = G                                                                                |         |          |             |             | >280             |
| G″    | WS2811 Chinese V2.5 (2026), WS2814A V2.1: = G but reset                                                                            |         |          |             |             | ≥350             |
| K     | WS2815B-V1 V2.2+ (2023), WS2808 V1.1 (2022-12) and world-semi.com V1.2, WS2815B-RGBW                                               | 220–380 | 580–840  | 900–5000    | 600–5000    | >280             |
| P     | WS2816B, WS2816C, WS2816A-V1-B                                                                                                     | 200–320 | 520–800  | 800–1200    | 480–1000    | >280             |

Most sheets from 2020 on add a bit period T0H+T0L and T1H+T1L ≥ 1250 ns: every K, P and G″ sheet,
and WS2808 V1.0, WS2805, WS2814, WS2813B and WS2812B-V6/V7 in G. These G sheets don't: WS2812B V5
(2019), WS2811 V1.5 and V2.2, WS2818B V1.5 and English V2.3.

## Is there one setting for WS2811 HS, WS2812, WS2812B (all), WS2813, WS2815, WS2818x?

Window per parameter = [largest printed minimum, smallest printed maximum] over tables A–N
(A, C, D, E, F, G, G′, G″, H, J, K, L).

- **T0H**: max(min) = 300 (H); min(max) = 380 (F, G, J, K) → **300–380**. (325 if A's tolerance is
  halved; 320 if WS2816 is added.)
- **T1H**: max(min) = 750 (F, H, L); min(max) = 840 (K) → **750–840**, but A puts 1 at 600 nominal.
  Only A′ reaches 750, so with the 2011 WS2811 included the window is the single point 750, or
  empty if its tolerance is less than ±150 ns.
- **T0L**: max(min) = 900 (K); min(max) = 950 (C) → **900–950**.
- **T1L**: max(min) = 600 (K) (580 for G); min(max) = 420 (F, J) → **600 > 420: empty.**
- **Reset**: largest minimum 350 µs (G″), 300 µs without it; no maximum printed → **≥ 350 µs**.

**The set is empty, because of T1L.** The 2017-era tables (WS2812B Mar-2017, WS2815/WS2815B
2017–18, WS2818A V1.0: T1L ≤ 420 ns; WS2818: ≤ 480 ns) and the 2018+ tables (WS2811 ≥ V1.4,
WS2812B ≥ V5, WS2813B, WS2818B: T1L ≥ 580 ns; WS2815B-V1 2023+: ≥ 600 ns) don't overlap. The
2012 WS2812 (T1L ≥ 450 ns) also misses the 2017 tables. WorldSemi's own logs record the change:
WS2811 "V1.4 … T1L timing" (2018-09-10) and WS2818B "V1.2 … T1L time" (2018-02-07).

Pairwise inside one part name: WS2812B 2013 (D) ∩ V5 (G) is non-empty (T1L only 580–600);
Jan-2016 (E) ∩ G and Mar-2017 (F) ∩ G are empty (T1L).

**Current production only** (every sheet on world-semi.com in 2026: G, G′, G″, K, plus P for
WS2816B/C):

- T0H 220–380 ∩ 200–320 → 220–320.
- T1H 580–840 ∩ 520–800 → 580–800.
- T0L 900–1000.
- T1L 600–1000.
- Bit period ≥ 1250 forces T0H ≥ 250 when T0L ≤ 1000.
- Reset ≥ 350 µs.

So one setting does exist, for example 0 = 300 / 960 ns, 1 = 690 / 700 ns, reset 400 µs. The binding
limits are T0L ≥ 900 and T1H ≤ 840 (K), T0L ≤ 1000 (G), T0H ≤ 320 (P) and reset ≥ 350 µs (G″).

## What differs

- **Channel order only** (same table G, 24 bits, reset > 280 µs):
  - WS2811 ≥ V1.4 (RGB) ≡ WS2818B (RGB, plus backup input).
  - WS2812B V5–V7 (GRB) ≡ WS2813B / WS2813A-V7 (GRB, plus backup) ≡ WS2808 V1.0 (GRB, plus backup).
  - Table K: WS2815B-V1 2023+ ≡ WS2808 V1.1 (both GRB, plus backup).
- **Frame length**:
  - WS2814 SOP12: 32 bits RGBW, table G.
  - WS2814A/B/F: 32 bits **WRGB**, table G. The same family name with a different wire order.
  - WS2815B-RGBW: 32 bits GRBW, table K.
  - WS2805: 40 bits RGBW1W2, table G.
  - WS2816B/C: 48 bits (16-bit GRB), table P.
  - WS2816A adds a gain word once per frame: 15 bits (V1-B, table P) or 16 bits (V2-B: 15 gain bits
    plus a check bit "may be 0 or 1", table G). The gain is per channel but shared by the whole
    chain, not per pixel.
- **Reset only**: WS2811 Chinese V2.5 (≥ 350 µs) vs V1.4–V2.2 (> 280); WS2814A V2.1 (> 350) vs
  WS2814B/F (> 280).
- **WS2816 vs WS2812B**: B, C and A-V1 use table P, not WS2812B's. A-V2 uses WS2812B's table G.
- **Backup line**:
  - WS2813 / WS2815 2016–18: "BIN … compare the data with the DIN side after phagocytosis of
    24bit data, if DIN do NOT receive the signal, then switching to BIN … until restart after
    power-off".
  - WS2818/WS2818A: either input may feed the first chip; on BIN the controller sends 24 extra bits.
  - All 2025–26 sheets: "DIN is the main input … When one IC … is damaged, the latter IC extracts
    the signal from the BIN … BIN pin of the first IC … connect it to GND".
  - Traced circuits wire BIN(n) ← DIN(n−1): WS2815 2017, WS2818A, WS2813A-V7, WS2815B-V1,
    WS2815B-RGBW V1.3. The BO-pin parts wire BO(n) → BI(n+1) instead: WS2813B-V6 (pin 1 BO) and
    WS2816. WS2815B-RGBW V0.1 had a DOUT2 pin, gone in V1.3. WS2805 and WS2814B circuits were not
    traced net by net.

## Disagreements between documents (details in the YAML)

1. WS2811 2026 English V1.52 vs Chinese V2.5 (same date):
   - T1H 540 vs 580 ns min.
   - Reset > 280 vs ≥ 350 µs.
   - The English figure itself says > 350.
2. WS2811 revision dates: English log V1.5 = 2019-09-20 (and "20182207"), Chinese logs 2018-09-20.
3. WS2808: two "V1.2" sheets with different tables:
   - szlcsc WS2808F 2025-12-02 keeps G.
   - world-semi.com 2026-07-16 has K.
   - English V1.1 (K) logs "Optimization of Timing Description".
4. WS2812B Mar-2017: table reset > 300 µs, figure ≥ 50 µs. WS2813 2016: table 300 µs, text and
   figure 250 µs.
5. Channel table vs note:
   - WS2813 2016 and WS2818 draw R G B but the note says GRB.
   - WS2808 and WS2815B-V1 (Chinese) print "G1 R0" for G0.
   - WS2815B-RGBW V1.3 labels W bits W1..W8.
6. WS2814A V2.1: table > 350 µs, figure > 280 µs. WS2814F V2.1: VDD pin described as "Backup signal
   input".
7. WS2815B-V1 V2.2: English log 2023-03-15 vs Chinese 2022-12-21. Feature list says 2 kHz,
   description says 4 kHz. VIH 2.7 V (English) vs 3.0 V (Chinese V2.4).
8. WS2818 (and WS2811 2011): "Low Speed Mode Time" heading on a single-speed part. The WS2812 6-pin
   sheet keeps WS2811 low/high-speed text and "DIN, SET".
9. Advatek says WS2816A has 4-bit per-colour current control; WorldSemi prints 5 bits (32 levels).
10. Terminology: older English "single NZR", newer "single wire RZ", Chinese 单线归零码
    (return-to-zero). Same waveform drawings.

## Database corrections (not edited)

- **pixels/ws2813** `color.order: RGB` → **GRB**. Every sheet:
  - 2016 p6: "Note: Data transmit in order of GRB".
  - WS2813B-V6 p5: same.
  - WS2813B-B p4: "按照GRB 的顺序发送".
- **pixels/ws2815** `color.order: RGB` → **GRB**: 2017 p4 and WS2815B-V1 p4, "Data transmit in
  order of GRB".
- **pixels/ws2815** `sources.data.type` says the LCSC C5446699 sheet has a "revision record up to
  V1.4". That PDF (= world-semi en/ws2815b-v1-v1.pdf) now logs to V2.2 "Timing sequence modified"
  with table K. `pwm_frequency: 2kHz` is the 2017 value; current sheets say 4 kHz (Chinese V2.4 p1
  "端口扫描频率4KHz").
- **pixel-ics/ws2808**:
  - "Same framing and timing as the WS2812B" is true for V1.0 only. English V1.1 and
    world-semi.com Chinese V1.2 use table K.
  - The datasheet comment "not on world-semi.com" is stale: /downloads/datasheets/en/ws2808-v1.1.pdf
    and zh-CN/ws2808-1.2.pdf.
- **pixel-ics/ws2811** `pwm_frequency: 2kHz`: V2.0+ sheets say 4 kHz. V2.2 p1 "扫描频率4KHz";
  English V1.52 p1 "scanning frequency of 4 kHz".
- **pixel-ics/ws2814** mixes two wire orders:
  - The linked SOP12 sheet is RGBW with DIN1/DIN2.
  - WS2814A/B/F (price and status source WS2814F) are WRGB, and only WS2814B has BIN.
  - Any single `color.order` or `backup_line` on this entry is wrong for some of them.
- **pixels/ws2816**:
  - `brightness_control.scope: per_channel` is per channel but **global**: one gain word per frame,
    not per pixel.
  - WS2816A frames are 15/16 + 48·n bits, not 48·n.
  - `data.bitrate: 800kHz` is not printed in any WS2816 sheet read.
- **pixels/ws2812**: `datasheet.url` is the 6-pin WS2812 (pins DOUT, DIN, VCC, NC, VDD, VSS; reset
  50 µs) while `physical.pin_count: 4` and the sources describe WS2812B V5 (reset 280 µs).
- **pixel-ics/ws2818** technical note "WS2818A/WS2818B … (T0H 220-380ns, T1H 580ns-1.6us)" holds
  for WS2818A only. WS2818B V1.5+ prints T1H/T0L/T1L 580ns~1us.
- **pixels/ws2851**: no datasheet exists online. `color.order`, `pwm_frequency: 2kHz`, currents,
  gpio and pin_count are unsupported, and Advatek lists PWM 400 Hz.
- **Gaps**:
  - Channel order not recorded for WS2811/WS2818A/WS2818B (RGB).
  - WS2805 lacks 800 kbps / 40 bits.
  - WS2815-RGBW lacks `backup_line: true`.

## Still open

- Tables not found:
  - WS2811 2017–18 pre-V1.4.
  - WS2812B V1.1/V1.2 (2017-10 / 2018-02).
  - WS2815B-V1 V1.1–V2.1 (2019–2022).
  - WS2818B V1.0–V1.1.
  - WS2813 2017–2024 (WS2813B-V5/W).
- No WS2851 datasheet; which WS2811 revision it contains is unknown.
- The 2011 WS2811 prints no high-speed tolerance; the FastLED-reported "800/1700, 1600/900 ns"
  original table is unverified.
- Not printed:
  - What WS2813B-V6's BO pin outputs.
  - The WS2814 SOP12 DIN1/DIN2 switching rule.
  - A WS2816 bit rate.
- WorldSemi's site files WS2916A/B images under "ws2816-family", but no document says WS2816 was
  renamed.
