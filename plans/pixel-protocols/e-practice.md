# e-practice: what transmitters send, and what measurements show

Summary of batch `e-practice` (researched 2026-11-20). Evidence, permalinks
and verbatim quotes are in [e-practice.yaml](e-practice.yaml). Code was read
at pinned commits: FastLED 3.10.10, NeoPixelBus 2.8.4, Adafruit_NeoPixel
1.15.5, WLED v16.0.1, ESPixelStick main, FPP 10.4, xLights 2026.20,
rpi_ws281x master, ESP-IDF led_strip 3.1.1. Every code quote was checked
by script to sit inside its permalinked line range; every web quote was
matched against the downloaded page. ns unless marked µs.

## 1. The WS2812-class signal as transmitters actually send it

| Transmitter (setting)                                                   | T0H                           | T1H                             | Cell             | Latch gap                                |
| ----------------------------------------------------------------------- | ----------------------------- | ------------------------------- | ---------------- | ---------------------------------------- |
| FastLED WS2812 / WS2812B / WS2852 / NEOPIXEL                            | 250                           | 875                             | 1250             | 280 µs                                   |
| FastLED WS2811 / APA104                                                 | 250                           | 600                             | 1250             | 280 µs                                   |
| FastLED SK6812 / SM16703 / GS1903 / SM16824E                            | 300                           | 900                             | 1200             | struct 80 / 0 / 280 / 200 µs             |
| FastLED WS2813, WS2814                                                  | 320                           | 640                             | 1280             | 300 µs                                   |
| FastLED WS2812B-V5 / Mini-V3                                            | 225                           | 580                             | 1225             | 280 µs                                   |
| NeoPixelBus ESP32 RMT Ws2812x (WS2812x, WS2813, WS2811, WS2816)         | 400                           | 800                             | 1250             | 300 µs                                   |
| NeoPixelBus same pulses as "Sk6812"/"Lc8812"                            | 400                           | 800                             | 1250             | 80 µs                                    |
| NeoPixelBus same pulses as "Ws2812"/800Kbps ("older model pre WS2812b") | 400                           | 800                             | 1250             | 50 µs                                    |
| NeoPixelBus I2S, ESP8266 DMA, RP2040 3-step (derived)                   | 417                           | 833                             | 1250             | per class                                |
| NeoPixelBus ESP8266 UART, RP2040 4-step (derived)                       | 312.5                         | 937.5                           | 1250             | per class                                |
| Adafruit 800 kHz: AVR 16 MHz / Teensy / nRF52 / ESP8266+ESP32 / RP2040  | 312.5 / 250 / 375 / 400 / 250 | 812.5 / 800 / 812.5 / 800 / 875 | 1250             | 300 µs hold-off                          |
| WLED "WS281x" (ESP32 RMT)                                               | 400                           | 800                             | 1250             | 300 µs (ESP8266 DMA pin: 417/833, 50 µs) |
| ESPixelStick WS2811, ESP32 / ESP8266                                    | 300 / 312                     | 700 / 975                       | 1200+1300 / 1250 | 350 µs                                   |
| FPP ws281x group, PRU / Pi DPI                                          | 320 / 312                     | 750 / 729                       | 1120 / 1250      | not in files read                        |
| rpi_ws281x (every strip type)                                           | 417                           | 833                             | 1250             | 55 µs in buffer, next frame ≥300 µs      |
| ESP-IDF led_strip WS2812 (RMT) / SPI                                    | 300 / 400                     | 900 / 800                       | 1200+1500 / 1200 | 280 µs                                   |
| ESP-IDF led_strip SK6812                                                | 300                           | 700                             | 1200+1300        | 280 µs                                   |

Across these WS2812-class settings, real transmitters send T0H 225–417,
T1H 580–975, a 1120–1500 ns cell, and a 50–350 µs gap (FastLED's struct
RESET is 0 for some names, e.g. SM16703). For the name "WS2812" alone:
T0H 250–417, T1H 729–937.5, cell 1120–1500. Two of them use a
different cell length for 0 and 1 (ESP-IDF WS2812 1200/1500; ESPixelStick
ESP32 and ESP-IDF SK6812 1200/1300). FastLED's effective latch depends on
platform (WAIT_TIME 280 on classic drivers, the struct RESET on ESP32 channel
and Teensy/SAM block drivers).

## 2. Different signal for a different name (evidence the chips differ)

- **Inverted line (idle high).** TM1814: NeoPixelBus, ESPixelStick, FPP. TM1914 and TM1829: NeoPixelBus. FastLED asks for TM1829 inverted (FLIP) but only its nRF52 backend implements it; FastLED sends TM1809/TM1804/TM1812/TM1803 non-inverted.
- **Words before the pixel data.** TM1814: 8 bytes, four current codes then their complement (NeoPixelBus, ESPixelStick, FPP). TM1914: 6 bytes, `FF FF mode` + complement, mode F5 = DIN only, FA = FDIN only, FF = auto-switch (NeoPixelBus). TM1908 command words and UCS7604 preamble (FastLED). SM16825 gain bits (NeoPixelBus feature used by WLED).
- **400 kHz cells (≈2.4–3.2 µs).** WS2811 slow/400 (all), UCS1903 (FastLED, FPP), TM1803 (FastLED 700/1800/2500; FPP 750/1875/2625), GW6205 (FastLED 800/1600/2400; FPP 750/1625/2375), DP1903.
- **Long-T1H cells.** SK6822 / APA106 / PL9823 at 1700–1750 (T1H 1350–1375): FastLED, NeoPixelBus, WLED, FPP. GE8822 1360–1375, UCS1912 1600–1625 (FastLED, FPP). TM1804 1500 (FPP only). FPP: these "are genuinely different parts, not aliases".
- **Faster cells.** TX1812 900 (NeoPixelBus), LPD1886 800, TM1908 830, GS8208 1000 (ESPixelStick), WS2805 1090 (NeoPixelBus), 1600 kHz modes of UCS7604 and TM1829 (FastLED).
- **Different latch.** SK6812 80 µs, TM1814/TM1914/TM1829 200 µs, GS1903 40 µs, TX1812 80 µs (NeoPixelBus); TM1829 500 µs (FastLED); TM1814 500 µs, UCS1903 25 µs, UCS8903 30 µs (ESPixelStick). These are library choices, often copied from datasheets, not measurements.
- **Width.** 16-bit: UCS8903/8904, UCS7604, WS2816, SM16825. 12-bit per FPP: SJ1221, TLS3001, TLC5973.

## 3. Names treated as one thing

- **FastLED:** {WS2812, WS2812B, WS2852, NEOPIXEL}; {WS2811, APA104}; {SK6812, SK6812WWA, LC8816E}; {SK6822, APA106}; {TM1809, TM1804, TM1812}; {TM1829, TX1813N1 (field-tested)}. GS1903 was split out of WS2812 after field failures.
- **NeoPixelBus:** {Ws2812x, Ws2813, Ws2811, Ws2816}; {Sk6812, Lc8812}; {Ws2805, Ws2814}.
- **WLED:** "WS281x" also drives GS8608, FW1906, UCS8903/8904 and SM16825 on the same pulses; "SK6812/WS2814 RGBW"; "APA106/PL9823".
- **FPP:** one ws281x cell for 23 names (ws2811 … ws2818, sk6812, sk6813, sm16703, gs8206, gs8208, tm1809, tm1812, ucs1904, ucs2903, apa104, apa106, and RGBW apa109, sk6812rgbw, sk6818, sm16704, ucs2904, ws2814). It says it groups them "as xLights groups them".
- **xLights / Falcon:** one WS2811 group of 37–39 names including TM1803, TM1804, TM1914, UCS1903, UCS1912, SK6822, GE8822/PL9823 (xLights). xLights: "may not be accurate". Falcon: "our best understanding". Neither publishes timings.
- **Advatek, ENTTEC:** no grouping. Every IC is its own type, including WS2811 vs WS2811 V1.4, which Advatek says has "different data timing". Advatek also says TM1804 differs from TM1803, and WS2815B, WS2818A and WS2818B have "slightly different timing".
- **rpi_ws281x:** one waveform for every strip type.

## 4. Measured tolerance envelope

| Part (source)                               | Read as 0 if high ≤ | Read as 1 if high ≥ | Min cell     | Latch when low ≥ | Internal clock |
| ------------------------------------------- | ------------------- | ------------------- | ------------ | ---------------- | -------------- |
| WS2812(S) (cpldcpu 2014/16)                 | 500                 | 563                 | 875          | >10.8 µs         | ~166           |
| WS2812B (cpldcpu 2014/16)                   | 563                 | 625                 | 1063         | >9 µs (8.95)     | ~208           |
| WS2812D 8 mm (cpldcpu 2016)                 | 600                 | 625                 | 1063         | tbd              | ~208           |
| PD9823 (cpldcpu 2016)                       | 600                 | 625                 | 1000         | >14 µs           | ~190           |
| SK6812 (cpldcpu 2016, provisional)          | tbd                 | (440)               | (725)        | tbd              | —              |
| "NeoPixels and WS2812's" (Josh Levine 2014) | max 500             | min 550             | gap 450–5000 | ~6 µs            | —              |

- **Mechanism (cpldcpu):** the bit is sampled at a fixed delay after the rising edge, 3 internal clock cycles, "latched again after cycle 2". The cell has no upper limit until the reset timeout (~9 µs). Dout is regenerated at ~2 cycles high for a 0 and ~4 for a 1. Josh saw reshaped bits of ~380 and ~770 ns that "can change over time" and with temperature and voltage. In one case a 560 ns 1-bit came out as a 0.
- **Newer WS2812B (2017 on):** WorldSemi's change notice, quoted by Particle, says timing is "exactly the same" but the reset went from >50 µs to >280 µs. Adafruit says 300 µs "according to the datasheet". Josh's 2020 note says 250 µs. Particle's 10 µs reset failed on the new parts. No measured threshold for the new parts was found. One 2022 hobby log reports a WS2812B of unknown revision needing ~55 µs.
- **Field reports in code:** GS1903 ("±50ns") failed intermittently with WS2812 timing (FastLED #739). A 417 ns T0H made the first pixel of "older WS2811 parts" read 0s as 1s (FPP). The 3-step 33/66 cadence "may not work reliably" with WS2816B (NeoPixelBus wiki). ESPixelStick's ESP32 values were "adjusted to work with seed pixels".
- **Caveats:** one or a few samples per part, 2014–2016 silicon, a single lab. cpldcpu: "can only serve as a rough indication". ENTTEC warns that re-marked chips mean "two reels with identical labels can behave very differently".
- **Derived comparison (mine):** every transmitter's WS2812 T0H (225–417) is below every measured 0/1 boundary (≥500). The 3-step 417 ns sits only ~23 ns under SK6812's provisional 440. FastLED's WS2812B-V5 T1H of 580 is below the 2014 WS2812B's 625 boundary. FPP's 1120 ns cell is above the 1063 minimum.

## 5. Disagreements (details and quotes in the YAML)

- TM18xx polarity: FPP's comment says the whole family is inverted, but FPP's code inverts only TM1814 and lists tm1809/tm1812 as plain ws281x. FastLED inverts nothing except TM1829 (nRF52 only). xLights and Falcon file TM1803/1804/1809/1812/1914 under WS2811.
- UCS1903: 400 kHz in FastLED and FPP, 800 kHz with a 25 µs idle in ESPixelStick, in the 800 kHz WS2811 group in xLights and Falcon, "400 - 800kbps" at Advatek.
- APA106: 1750 cell (FastLED, = SK6822), 1700 (NeoPixelBus ESP32), the 400 kbps method (NeoPixelBus ARM), the ws281x 1120 cell (FPP).
- WS2814: 320/640/1280 (FastLED), the WS2805 class 300/790/1090 (NeoPixelBus), the SK6812 class 400/800/1250 with 80 µs (WLED), the ws281x cell (FPP).
- WS2815: a 1890 ns cell labelled "@ 400 kHz" in FastLED. Everyone else uses the 800 kHz family.
- Internal: FastLED doc comments contradict its own structs (UCS7604, V5, WS2811_400). FPP's comment says "1.25us period" against its 1120 ns cell. ESPixelStick's GS8208 comment says T1H 600 but the code sends 750. NeoPixelBus's WS2805 cell is 1090 on RMT but 1125 in NeoBits. cpldcpu's prose reset figure (8.95 µs) matches his WS2812B column, not WS2812.
- New WS2812B reset: >280 µs (WorldSemi), 300 µs (Adafruit), 250 µs (Josh).

## 6. Database corrections

None. This batch read no database entries.

## 7. Open

- No measurement of the new (2017+) WS2812B, WS2813, WS2815 or SK6812 reset threshold or sampling point. The 280 µs figure is the maker's notice only.
- SK6812 0/1 boundary (~440 ns) is provisional in the only source.
- Falcon and Advatek don't publish the cell their firmware sends per type. ENTTEC's custom-protocol guide was not found.
- cpldcpu's 2020 WS2812 power-analysis post returns 404 and was not read.
