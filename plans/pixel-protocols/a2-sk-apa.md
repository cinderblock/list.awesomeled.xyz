# Batch a2-sk-apa: summary

Evidence, quotes and page numbers: [a2-sk-apa.yaml](a2-sk-apa.yaml). Researched 2026-11-20.
Parts: SK6812, SK6805, SK6812RGBW, SK6812WWA, SK6813, SK6813HV, SK6822, SK6851, SK6818,
APA104, APA105, APA106, APA109, PL9823. Baseline: WS2812B.

## Baseline: there are two WS2812B tables

- Undated WorldSemi sheet (Adafruit-hosted), the one the brief quotes: T0H 0.4us ±150ns, T1H 0.8us ±150ns,
  T0L 0.85us ±150ns, T1L 0.45us ±150ns, RES above 50µs, TH+TL=1.25µs±600ns.
  Windows: T0H 250–550, T1H 650–950, T0L 700–1000, T1L 300–600 ns.
- WorldSemi V5 (2019): T0H 220–380 ns, T1H/T0L/T1L 580 ns–1µs, RES >280µs.
  The two sheets' T1L windows meet only at 580–600 ns.

The arithmetic below is against the undated sheet unless it says V5. A part "overlaps" when
each of its four windows intersects WS2812B's. "Fixed period" means one bit period T
(T0L = T − T0H, T1L = T − T1H) satisfies both parts' tables. (The script output listing every
window stayed in the research session's scratch space; the windows themselves are in the YAML.)

## Group A: printed windows overlap WS2812B's (one transmitter setting works)

| Part, sheet                                                                                                    | T0H ∩   | T1H ∩   | T0L ∩    | T1L ∩   | fixed period | reset                       |
| -------------------------------------------------------------------------------------------------------------- | ------- | ------- | -------- | ------- | ------------ | --------------------------- |
| SK6812 / SK6805 / SK6812RGBW / SK6812WWA 2015–16 sheets, APA-104-4RGB (0.3/0.6 ±0.15 µs)                       | 250–450 | 650–750 | 750–1000 | 450–600 | 1100–1350 ns | 80 µs                       |
| SK6812 2019 Normand, 2022 Opsco; SK6812RGBX 2019; SK6812WWA 2019; SK6813 2018                                  | 250–400 | 650–950 | 800–1000 | 300–600 | 1200–1400 ns | >80 µs                      |
| SK6813E 2022 (T0L ≥0.6 µs)                                                                                     | 250–400 | 650–950 | 700–1000 | 300–600 | 1200–1400 ns | ≥80 µs                      |
| SK6813HV 2019/2023, APA-104-4-12V 2021                                                                         | 250–400 | 650–950 | 800–1000 | 300–600 | 1200–1400 ns | >80 µs                      |
| Opsco 2021–2025 sheets: SK6812 B/1, SK6805MICRO B/1, SKC6812RGBW B/1, SKC6812WWA A/0, SK6813HV B/1, SK6851 B/0 | 250–400 | 650–950 | 800–1000 | 300–600 | 1200–1400 ns | >200 µs                     |
| SK6805-EC15 A/1 2025, SK6818 (Normand 2026; T 0.9–20 µs)                                                       | 250–400 | 700–950 | 700–1000 | 300–600 | 1000–1400 ns | 200 µs min (EC15) / >200 µs |
| APA109RGBW rev 02 (T1H 0.9, T1L 0.3 ±0.15 µs)                                                                  | 250–450 | 750–950 | 750–1000 | 300–450 | 1050–1400 ns | 80 µs                       |

- **One setting for all of group A plus WS2812B (undated), APA109 excluded:** T0H 250–400 ns,
  T1H 700–750 ns, period 1.20–1.35 µs (T0L 800–1000, T1L 450–600), reset ≥200 µs. Example:
  T0H 300 ns, T1H 725 ns, T 1275 ns, reset 300 µs.
- **Including APA109** leaves zero margin: T1H must be exactly 750 ns and T1L exactly 450 ns
  (T = 1.2 µs). APA109's 750 ns T1H minimum meets the 2015 sheets' 750 ns maximum.
- **Including WS2812B V5:** T0H 250–380, T1H 700–750, T1L 580–600, T 1.28–1.35 µs,
  reset ≥280 µs. Example that meets both WS2812B sheets and every group-A table except APA109:
  T0H 320 ns, T1H 720 ns, T 1310 ns (T0L 990, T1L 590), reset 300 µs. With APA109 there is
  **no** solution: APA109's T1L ≤450 ns and V5's T1L ≥580 ns.
- Inside group A, parts differ only by **frame length** (24 vs 32 bits), **channel order** and
  **reset minimum**:
  - 24-bit G R B: SK6812, SK6805, SK6813, SK6851, APA-104-4RGB. SK6813HV in 2019 only.
  - 24-bit R G B: SK6813HV 2023 A/2 and 2025 B/1 (changed from GRB).
  - 24-bit WWA: SK6812WWA. The 2015/2019 sheets keep G R B bit names and never map them to
    dies. SKC6812WWA 2021 prints **W A W**, with amber as the middle byte, and does not say which
    W is warm and which is cool.
  - 32-bit G R B W: SK6812RGBW 2019 and 2025, APA109, SK6818. SK6812RGBW rev 01 (2015)
    prints **R G B W**.
  - Reset: 80 µs on 2015–2023 sheets; >200 µs on Opsco's 2021+ template; V5 WS2812B >280 µs.
    A transmitter reset of ≥280 µs satisfies every sheet in this batch.

## Group B: printed timing does not overlap WS2812B

APA106 (Kyohritsu 2022 and SparkFun sheets), PL9823 (BaiCheng), APA104 per the
**Newstar-hosted** sheet, and SK6822 (whose text matches APA Electronic's APA-104-22C sheet) all
print T0H 0.35 / T1H 1.36 / T0L 1.36 / T1L 0.35 µs ±150 ns.

- T1H 1210–1510 ns vs WS2812B 650–950 ns: no overlap. T0L 1210–1510 vs 700–1000: no overlap.
- Against V5, T1L 200–500 ns vs 580–1000 ns also fails.
- Among themselves they print identical rows. The rows alone allow a 1.41–2.01 µs bit period.
  The Newstar heading (TH+TL=1.25µs±600ns) caps it at 1.85 µs, and SK6822's heading
  (TH+TL=1.7µs±600ns) sets 1.1–2.3 µs. Reset 50 µs (Newstar APA104: above 24 µs).
- SK6822 adds a 12 µs "WT" gap drawn between every 24-bit group, TH+TL=1.7µs±600ns, RGB order,
  and a shared DIN2/DOUT1 pin wired as a dual signal line.
- RGB order on every sheet that prints one. SparkFun's APA106 sheet prints none, and PL9823's
  order appears only in the distributor's Diamex block.
- **Practice disagrees with the printed tables.** Falcon lists APA104, APA106 and SK6822 under its
  single "WS2811" type. cpldcpu measured the PD9823 (PL9823) decoding a high pulse of 62.5–600 ns as
  0 and ≥625 ns as 1, the same as WS2812B, and concluded "Any software library that is able to
  drive the WS2812(B) is also able to drive the PD9823." Those are a controller maker and a
  third-party measurement, not maker specs.

## Group C: unknown

APA105: no datasheet found anywhere I looked. APA Electronic's current catalogue lists no
APA-105. Advatek and ENTTEC say: data-only, 8 bits, RGB, 800 kbps. Newstar sells "APA105/SK6812"
strips. Timing, reset and order are unverified.

## Disagreements between documents (details and quotes in the YAML)

1. **APA104:** APA Electronic's APA-104-4RGB prints 0.3/0.6 µs ±0.15, Trst 80 µs, GRB. The
   Newstar "APA104 LED CHIP" prints 0.35/1.36 µs, RES above 24 µs (its own diagram says ≥50 µs),
   RGB. The Newstar sheet is the undated WS2812B sheet's text almost word for word, with the name,
   timing, reset and order rows changed. APA-104-4RGB's overview says "32-bit data" while its
   section 13 draws 24 bits.
2. **SK6813HV channel order:** GRB in 2019 rev 01; RGB in 2023 A/2 and 2025 B/1.
3. **SK6812RGBW channel order:** RGBW in rev 01 (2015-07-31) and in LEDYi's 2018 rebadge; GRBW in
   Normand rev 07 (2019) and Opsco B/1 (2025).
4. **SK6812WWA mapping:** SKC6812WWA A/0 gives W-A-W with amber in the middle byte. Adafruit's 6509
   page says "what would be Red is instead Cool White". With a GRB library, red is the middle byte.
   Adafruit's page also claims 32-bit colour for a 24-bit part.
5. **SK6812 reset:** 80 µs in the table vs ">=50us" in the same LED Color rev 01 diagram, then
   > 80 µs (2019, 2022), then >200 µs (2025). The same drift appears on SK6805, RGBW, WWA and
   > SK6813HV.
6. **SK6812 2019/2022 sheets:** the heading "TH+TL=1.25µs±600ns" sits over a table with a 1.20 µs
   minimum period. The overviews say "unipolar NRZ" while the notes say "unipolar zeroing code".
7. **SK6805 (2025):** EC15 A/1 and MICRO-J B/1, issued three weeks apart, print different tables.
   EC15 allows a 0.9 µs period and gives T1H ≥0.70 µs with no maximum.
8. **SK6818 (Normand 2026, provisional):** the table's minimum period is 0.9 µs; note 2 on the same
   page says 1.2 µs.
9. **SK6813 pin 6:** "BIN Backup Data Input" in 2018; "DIN 2 Thermal data processing" in 2022.
   SK6813HV DIN2 is "Standby control signal input" (2019), "Thermal data processing" (2023),
   "备用信号 Standby signal" (2025).
10. **SK6822:** claims "800 Kbps" but its table gives 1.71 µs bits (about 585 kbit/s) plus WT. It
    prints "±0.150ns" tolerances (likely a unit slip) and lists clock parameters (TCLKH, TCLKL,
    TSETUP) on a part with no clock pin.
11. **SK6851:** the waveform figure draws each bit low-first with the 0-code's high part long,
    the inverse of its own table. The frame note says "RGB order (G7 → … B0)" over a GRB drawing.
    The input thresholds are VIH 6.3 V and VIL 5.1 V at VDD 4.2 V (AC-coupled series string).
12. **APA106 (Kyohritsu):** RES 50 µs in the table vs ≥24 µs in the diagram. The text mentions a
    low-speed mode but gives no timing for it and no way to select it.
13. **Advatek** calls SK6818 "the RGBW version of SK6822". The documents disagree: SK6822 has
    0.35/1.36 µs timing and a backup pin; the SK6818 sheet has the SK6812-style table and no
    backup pin.

## Backup lines (wiring only; no sheet says how the chip chooses or what happens on failure)

- **SK6813:** BIN of pixel N is fed from DIN of pixel N−1.
- **SK6813HV:** DIN2 of pixel N is tied to the DIN1 net of pixel N−1.
- **SK6822 / APA-104-22C:** DIN1, a shared "DIN2 AND DOUT1" pin, and DOUT2. Each node between
  pixels is driven by two chips. Note: "the default D0 port signal, D1 chip will think that the
  signal is abnormal".

## Database corrections (not applied)

- `pixels/apa104` `color.order: RGB`: the YAML's own datasheet (APA-104-4RGB, p6) sends G R B.
  Only the Newstar sheet says RGB. The data.type source note (0.35/1.36 µs) is the Newstar sheet
  and contradicts the YAML's datasheet (0.3/0.6 µs). `pixel_size_notes` "says 32 bits": the same
  PDF's section 13 is 24-bit.
- `pixels/apa109` `pwm_frequency: 1.1kHz`: its datasheet p5 says "FPWM … 1.2 … KHZ".
- `pixels/sk6822` `bitrate: 800kHz`: the sheet's timing gives about 585 kbit/s (it claims 800 Kbps
  in prose). `data.type WS2811/12` does not match its printed timing. `pixel_size_bits` (24) is
  missing.
- `pixels/apa106`, `pixels/pl9823` `data.type: WS2811/12`: the printed timing does not overlap
  WS2812B. Third-party and controller sources say WS2812 timing works. The family assignment
  needs Cameron's call. `pixels/pl9823` `pwm_frequency: 800Hz` is not on the sheet, which says
  "Internal frequency up to 800KHz".
- `pixels/sk6812-rgbw`: `color.order: GRBW` matches the 2019/2025 sheets, but its
  `datasheet.url` (rev 01) says RGBW. Cite the newer sheet or record the disagreement.
- `pixels/sk6812-wwa` technical_notes ("doesn't say which byte drives which white"): true for
  rev 01/03. SKC6812WWA A/0, already in its sources, labels the bytes W-A-W, which conflicts with
  the Adafruit note.
- `pixels/sk6813-hv`: no `color.order`; the sheets say GRB (2019) and RGB (2023, 2025).
- `pixels/sk6818` `color.order: RGBW` has no maker source. The Normand SK6818 sheet (24 V variant)
  sends GRBW. Its `datasheet.url` is a strip product sheet with no protocol content.
- `pixel-ics/sk6818`: `data.type` is missing. Normand's sheet gives single-wire 800 kbps, 32-bit
  GRBW, SK6812-style table.
- `pixels/apa105` `creator: Newstar LED Co.`: Advatek and ENTTEC attribute it to APA Electronic.
  `color.order GRB` is unsourced.
- Minor: `pixels/sk6813` pwm 1.2 kHz is the 2018 value; the 2022 A/0 says 4.0 kHz.

## Still open

- APA105 datasheet; the 5 V SK6818 datasheet; an Opsco or Normand SK6822 sheet (maker
  unconfirmed).
- The revisions where SK6812RGBW went RGBW → GRBW and SK6813HV went GRB → RGB, and the SK6812 B/0
  of 2024.
- SKC6812WWA: which W byte is warm and which is cool.
- Whether SK6822's 12 µs WT must come from the controller.
- APA106 low-speed mode.
- Whether SK6851's inverted waveform figure means anything.
- Backup-line selection logic for SK6813, SK6813HV and SK6822.
- Maker names for the APA106 and PL9823 sheets (APA106 unnamed; PL9823 shows a BaiCheng logo).
