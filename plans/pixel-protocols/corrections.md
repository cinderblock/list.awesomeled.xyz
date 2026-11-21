# Database corrections found by the protocol research

Collected verbatim from each batch summary's "Database corrections"
section (researched 2026-11-20). None is applied yet: they wait for the
data-model decision in [../pixel-protocols.md](../pixel-protocols.md), and
each will be its own reviewed commit (spec facts outside the protocol fields
can go to stream 2 instead). The quotes behind every item are in the batch's
YAML file.

## a1-worldsemi ([summary](a1-worldsemi.md), [evidence](a1-worldsemi.yaml))

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

## a2-sk-apa ([summary](a2-sk-apa.md), [evidence](a2-sk-apa.yaml))

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

## b1-titan ([summary](b1-titan.md), [evidence](b1-titan.yaml))

- **tm1803:**
  - No `bitrate`. V1.5 says 400 kbps only.
  - `datasheet.url` is the 2011 unbranded English sheet, which contradicts
    V1.5 (SET pin, two speeds, other timing). Use Titan's V1.5.
  - `pwm_frequency: 400Hz` is the features claim. The V1.5 table says TPWM
    3–4 ms (about 250–333 Hz).
- **tm1804:** `bitrate: 800kHz` leaves out the 400 kHz mode (SET to VDD).
  V1.9 is superseded by V2.3 (2025), whose windows differ.
- **tm1809:**
  - `datasheet.url` is English Rev 01, whose timing conflicts with V1.6/V1.8.
  - `pwm_frequency: 400Hz` vs TPWM 1/1.3/1.5 ms (about 667–1000 Hz, typ
    769 Hz).
  - No `bitrate` (800 kHz, plus 400 kHz via SET).
- **tm1812:** the comment "not on titanmec.com" is wrong: Titan hosts V1.8.
  The `data.type` note's "Treset 8us min … low gaps over 8us reset" is V1.4.
  V1.6/V1.8 say Treset ≥200 µs and gaps ≤5 µs.
- **tm1903:** "not on titanmec.com" is wrong: Titan hosts V1.3. "Same framing
  and timing as WS2811" needs the 200 µs–20 ms reset range.
- **tm1934:**
  - "no maker-hosted or Chinese edition found" is wrong: Titan hosts Chinese
    V1.4.
  - `max_current: 15mA` comes from the English sheet; V1.4 says 14 mA.
  - `SOT-23-8` appears only in the English sheet; V1.4 lists SOP8 only.
- **tm1824:**
  - `status: discontinued`: Titan's single-line list still offers TM1824 V1.2,
    uploaded under a 2026-04-17 path. That shows a live listing, not
    production status, so it needs a review.
  - "Same framing as WS2814 / SK6812 RGBW": TM1824 sends R G B W. Compare the
    channel order before equating the parts.
- **tm1829:** the price, status and sku are TM1829B's (C52109855). TM1829B's
  datasheet defines a TM1814-style frame and other current steps, so it is not
  TM1829 on the wire. Split it out or annotate it.
- **tm1913:** the technical note's "600 ms" is one of three values in the
  sheet (also about 300 ms, and the 20 ms reset caution).
- **tm1914:** `backup_line` is missing; it should be true (FDIN, DO1/DO2).
- **tm1814:** nothing wrong found. `bitrate` (800 kHz) is missing, and the
  English V1.0 cited predates V1.1's changed windows.

## b2-ucs ([summary](b2-ucs.md), [evidence](b2-ucs.yaml))

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

## b3-sm-gs ([summary](b3-sm-gs.md), [evidence](b3-sm-gs.yaml))

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

## b4-other-single-wire ([summary](b4-other-single-wire.md), [evidence](b4-other-single-wire.yaml))

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

## c1-apa102 ([summary](c1-apa102.md), [evidence](c1-apa102.yaml))

1. **`pixels/sk9826` creator:** the entry says Newstar LED Co., but the sheet is
   Opsco's (SPC/SK9826 REV04, "DONGGUAN OPSCO OPTOELECTRONICS CO., LTD",
   <https://ecksteinimg.de/Datasheet/LED/LED0032/SK9826_REV04_EN.pdf>). The entry's
   Newstar PDF is the same sheet with the company name swapped.
2. **`pixels/sk9826` and `pixels/ns108e`, `color.order: RGB`:** both sheets draw
   b47-b32 OUTG, b31-b16 OUTR, b15-b0 OUTB and say "GRB order to light" (p. 7).
3. **`pixels/hd108`, `color.order: RGB`:** this matches Rose V1.1.0 but contradicts the
   IC maker's NS108 sheet (GRB). Mark it disputed.
4. **`pixels/sk9822-a`:** add `color.order: GRB`, since the frame is drawn Green | Red |
   Blue (p. 6), unlike the SK9822's B G R.
5. **`pixels/apa107`:**
   - `data.bitrate: 30MHz` is not in Newstar's sheet, which prints no clock rating.
     The only 30 MHz figure is Rose's (a reseller of the successor part).
   - The 9 kHz PWM, which the entry calls unsourced, does appear in Rose's HD107S sheet
     (pp. 3, 7), but only as Rose's claim.
6. **`pixels/lc8823`, `pwm_frequency: 27kHz`:** the datasheet table says FPWM 2.7 KHZ
   (p. 4); only the product page says 27 kHz. No clock rating exists for it.
7. **`pixels/lc2823-2020`:**
   - The ID and file name say "lc2823", but the part is the LC8823-2020.
   - `pwm_frequency: 27kHz` has no support in its datasheet, which prints no PWM figure.
   - A bitrate could be added: 20 MHz max (typ 15 MHz), p. 2-3.
8. **`pixels/apa102`, `data.bitrate: 30MHz`:**
   - Both 2020-package sheets say 15 MHz.
   - The 5050's only rating is APA's APA102C sheet: 30 MHz limit, 0-5 MHz recommended.
   - The entry's own datasheet (Shiji) prints none.
9. **`pixels/apa102c`, `datasheet.url`:** this is the Shiji/iPixel sheet. APA
   Electronic's own APA102C sheet (<https://www.lcd-module.de/eng/pdf/zubehoer/APA102C.pdf>,
   REV.01 2018-10-11) is already cited in `sources.data.type` and is the better
   `datasheet.url`.
10. **`pixels/sk9822` creator "Opsco/Newstar":** only an Opsco SK9822 sheet was found. Minor.

## c2-clocked ([summary](c2-clocked.md), [evidence](c2-clocked.yaml))

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

## d-dmx ([summary](d-dmx.md), [evidence](d-dmx.yaml))

- `pixel-ics/dmx512`: `bitrate: 650kHz` matches Advatek's 2023 page ("250 – 650 kbps"). Advatek's current page lists DMX512P at "250 - 750 kbps". Pixel size is 24 bits here but 33 in the ws2821/ws2822s entries, so the convention is inconsistent.
- `pixel-ics/sm16511`: `pwm_frequency 3.3kHz`, "configurable to 800Hz", has no maker source; only ENTTEC says "selectable 800/3300Hz". The `data.type` source URL now serves Advatek's generic DMX512 page. Add the maker's name SM16511BK as an alias.
- `pixel-ics/ucs512b`: no error. The cited document is the UCS512B3 one; the entry could add 250–750 kbit/s, single-wire parallel, and 4096-channel addressing.
- `pixel-ics/ws2821`, `pixels/ws2822s`: checked; no errors.
