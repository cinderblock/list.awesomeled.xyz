# b1-titan: Titan Micro pixel ICs, summary

Evidence (quotes, URLs, pages): [b1-titan.yaml](b1-titan.yaml). Researched 2026-11-20.

Titan hosts the current sheets for most of these parts, several newer than
the ones the database cites. Its product lists link
`/index/article/download.html?file=<base64 URL>`, and the files open with a
titanmec.com Referer: TM1803 V1.5, TM1804 V2.3 (2025), TM1809 V1.8 (2024),
TM1812 V1.8 (2024), TM1814 V1.1, TM1824 V1.2, TM1903 V1.3 and TM1934 V1.4.
TM1829, TM1913 and TM1914 are not on titanmec.com. For those I read the
Lumikit and LCSC copies.

None of the Titan sheets claims compatibility with WS2811 or with any other
part.

## Answer: which parts take a plain WS2811-style frame

| Group | Parts                                                                           | On the wire                                                                                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A     | TM1804 (SET floating), TM1809 (SET floating), TM1812, TM1903, TM1934 (DIN path) | Idle low. 800 kHz. 24-bit packets, **R G B**, MSB first. Reset is a low level. TM1809 takes 3 packets per chip and TM1812 takes 4, so a transmitter can't tell them apart.                                                                       |
| B     | TM1824                                                                          | Group A coding with **32-bit R G B W** packets.                                                                                                                                                                                                  |
| C     | TM1803, plus TM1804 and TM1809 with SET tied to VDD                             | Group A frame at **400 kHz**, with a 1-code high of 1.6–2.0 µs (TM1803 V1.5).                                                                                                                                                                    |
| D     | TM1913                                                                          | **Inverted** (idle high, low pulses, high reset). Otherwise a plain 24-bit RGB frame. Falls back to built-in patterns when the input stops.                                                                                                      |
| E     | TM1814, TM1914                                                                  | Inverted, and every frame **starts with two command words** C1 C2. TM1814: two 32-bit constant-current words (C2 = ~C1), then 32-bit **W R G B** packets. TM1914: a 48-bit mode command (24-bit code + 24-bit inverse), then 24-bit RGB packets. |
| F     | TM1829                                                                          | Inverted, with its own timing. A 24-bit packet whose top byte is 0xFF is a **constant-current packet**, so a PWM packet's R byte must be at most 0xFE.                                                                                           |

Only group A takes what a WS2811-style transmitter sends unchanged: a
non-inverted 24-bit frame with a low reset. Even group A needs the right
channel order (RGB, not WS2812B's GRB) and a long enough reset:

- **Reset.** TM1809 and TM1812 (V1.6 and later), TM1903 and TM1934 need a
  low of ≥200 µs, and TM1804 needs ≥40 µs. The 2013 WS2812B sheet's "Above
  50µs" is too short for the 200 µs parts. WS2811 V1.5's ">280µs" covers all
  of them.
- **Gaps between bytes.** TM1804 V2.3, TM1809 V1.8 and TM1812 V1.6/V1.8
  reset if the line stays low for more than **5 µs** between bytes. TM1903
  and TM1934 allow 50 µs, and TM1809 V1.6 allows 200 µs. The WorldSemi sheets
  print no such limit.
- **Maximum reset (unclear).** TM1903 and TM1934 print a reset maximum of
  **20000 µs**. The TM1903 English V1.2 says "the low level time should not
  be more than 20000μs, or else the chip might be close output". A WS2811
  controller that idles low for more than 20 ms between frames would break
  that. See Open.

## Timing-overlap arithmetic

Reference windows, read from WorldSemi documents:

- **WS2812B** (2013 sheet, Adafruit copy, p3): T0H 0.4 µs ±150 ns gives
  [250, 550] ns. T1H 0.8 ±0.15 gives [650, 950]. T0L 0.85 ±0.15 gives
  [700, 1000]. T1L 0.45 ±0.15 gives [300, 600]. TH+TL is 1.25 µs ±600 ns,
  so [650, 1850]. RES "Above 50µs". Order is GRB.
- **WS2811 V1.5** (world-semi.com, p3): T0H [220, 380]. T1H [580, 1000].
  T0L [580, 1000]. T1L [580, 1000]. RES ">280µs". Order is RGB.

Titan's 800 kHz sheets print high-time windows and a typical 1.25 µs period.
They print no low times. The ∩ columns show each part's window intersected
with the reference window.

| Part (revision)                                  | T0H            | T1H            | ∩ WS2812B T0H / T1H | ∩ WS2811 V1.5 T0H / T1H |
| ------------------------------------------------ | -------------- | -------------- | ------------------- | ----------------------- |
| TM1804 V1.9, TM1809 V1.6, TM1812 V1.6/V1.4       | 350–450        | 700–1000       | 350–450 / 700–950   | 350–380 / 700–1000      |
| TM1804 V2.3, TM1809 V1.8, TM1812 V1.8            | 300–390        | 650–1000       | 300–390 / 650–950   | 300–380 / 650–1000      |
| TM1903 V1.0/V1.3, TM1934 V1.4                    | ≤410 (typ 360) | ≥650 (typ 720) | 250–410 / 650–950   | 220–380 / 650–1000      |
| TM1903 EN V1.2, TM1934 EN V1.0, TM1824 V1.1/V1.2 | 310–410        | 650–1000       | 310–410 / 650–950   | 310–380 / 650–1000      |

Window common to every row and both references:

- T0H: max(350, 300, 310, 250, 220) to min(450, 390, 410, 550, 380) =
  **350–380 ns**.
- T1H: max(700, 650, 650, 580) to min(1000, 950) = **700–950 ns**.

Both are non-empty, so one transmitter setting fits every group A part and
TM1824. A worked bit pair:

- 0 = 360 ns high + 900 ns low (1260 ns).
- 1 = 720 ns high + 590 ns low (1310 ns).
- WS2812B checks: T0L 900 ∈ [700, 1000]. T1L 590 ∈ [300, 600]. Both periods
  fall in [650, 1850].
- WS2811 V1.5 checks: T0L 900 and T1L 590 both fall in [580, 1000].
- Titan checks: both high times fall inside every row. The 1.26 and 1.31 µs
  periods fall inside the "1.25–2.5 µs works" note in TM1804 V2.3, TM1903,
  TM1934 and TM1824. TM1804 V1.9 and TM1809/TM1812 print a typical 1.25 µs
  with no range.
- Reset: use **≥280 µs**, and ≤20 ms if the TM1903/TM1934 maximum is real.

### Group C: 400 kHz

TM1803 V1.5 prints T0H 500–900 ns and T1H 1600–2000 ns, with a 2.5 µs
period.

- **TM1804 V1.9 low speed:** the windows are identical.
- **TM1804 V2.3 and TM1809 V1.8 low speed** (T0H 600–780, T1H 1300–2000):
  the intersection is T0H 600–780 and T1H 1600–2000.
- **Old WorldSemi WS2811 low speed** (T0H 0.5 ±0.15 = [350, 650], T1H
  1.2 ±0.15 = [1050, 1350]): T0H overlaps at 500–650, but T1H
  [1050, 1350] ∩ [1600, 2000] is **empty**. On paper TM1803 is not WS2811
  low-speed compatible.
- **800 kHz WS2812B:** T1H [650, 950] ∩ [1600, 2000] is empty.

### Inverted parts (groups D–F)

These parts time the low pulse that starts each bit. Mirror the signal and
compare those low pulses with the WS2812B high windows:

| Part                                    | T0 pulse       | T1 pulse       | ∩ WS2812B T0H / T1H                | Reset (high)                               |
| --------------------------------------- | -------------- | -------------- | ---------------------------------- | ------------------------------------------ |
| TM1913 V1.3, TM1914 V1.2, TM1814 V1.0   | 310–410        | 650–1000       | 310–410 / 650–950                  | ≥200 µs (TM1913 and TM1814 also ≤20000 µs) |
| TM1814 V1.1 (TM1814B, TM1829B the same) | ≤410 (typ 360) | ≥650 (typ 720) | 250–410 / 650–950                  | ≥200 µs                                    |
| TM1829 V1.5                             | 150–450        | 600–1000       | 250–450 / 650–950, period ≥1200 ns | ≥140 µs (typ 500)                          |

Common to all four rows: a 0-pulse of 310–410 ns and a 1-pulse of
650–1000 ns. An inverted transmitter at 360/720 ns therefore meets every
inverted part's timing. What still differs is the frame content: C1 C2 words
(TM1814, TM1914), 32-bit WRGB packets (TM1814), 0xFF current packets and the
R ≤ 0xFE limit (TM1829), and TM1913's internal-control fallback.

## Same thing on the wire (per the datasheets)

- **TM1804 (high speed) = TM1903 = TM1934 (DIN) at the pixel level:** same
  coding, same RGB 24-bit frame, overlapping windows. They differ only in
  reset minimum (40 vs 200 µs), the gap limits and TM1903/TM1934's 20 ms
  ceiling.
- **TM1809 and TM1812:** the same stream as TM1804 high speed. One chip uses
  3 or 4 packets.
- **TM1803 = TM1804 or TM1809 with SET tied to VDD** (TM1803 V1.5, TM1804
  V1.9 and TM1809 V1.6 low-speed windows are identical). The reset minimum
  differs: 8, 40 and 200 µs.
- **TM1913 = an inverted TM1903:** the low-pulse numbers equal TM1903 EN
  V1.2's high-pulse numbers, and the reset range is the same 200–20000 µs.
- **TM1814 = TM1814B** on the wire. TM1814B drops the internal-control
  fallback.
- **TM1829B (2024) is not TM1829.** It uses the TM1814 frame (C1 C2 plus
  32-bit packets with the W byte fixed at 0) and 6.5–38 mA current steps.

## Answers to the specific questions

- **TM1803 is 400 kbps.** V1.5 p1: "数据发送速度为400Kbps" (data sending
  speed is 400 Kbps). p4 "低速模式时间" (low-speed mode timing):
  - T0h 500/700/900 ns
  - T1h 1600/1800/2000 ns
  - outputs 700/1300 ns
  - period 2.5 µs
  - Treset 8 (min) / 24 (typ) µs
  - pin 7 is NC

  The older English sheet the database links (2011, unbranded) disagrees. It
  has a SET pin and two speeds, plus symmetric 0.68/1.36 µs ±150 ns timing
  whose 1-code window does not overlap V1.5's.

- **TM1814:** the line is inverted ("采用归一码的方式发送信号", sends in
  "return-to-one" code). DO stays high before forwarding, and reset is a high
  of 200–20000 µs.
  - Frame: `C1 C2 D1 … Dn Reset`.
  - C1 is 32 bits, W R G B, MSB first, with bits 7–6 of each byte fixed at 0.
    Bits [5:0] set the current, from 6.5 mA (all 0) to 38 mA (all 1), in 64
    steps.
  - C2 is C1 bit-inverted. Every chip receives and forwards C1 and C2.
  - Each Dn is 32 bits, W R G B.
  - Data loss triggers the internal-control fallback after 450–550 ms.
- **TM1824:** 4 channels, non-inverted, frame `D1 … Dn Reset(low)`. Each Dn
  is 32 bits, **R G B W**, MSB first. Timing is 310–410 / 650–1000 ns, reset
  ≥200 µs.
- **TM1829:** idle high ("Before retransmitting data, DO port is always high
  level"). Reset is a high of ≥140 µs (typ 500 µs). T0L is 150–450 ns, T1L
  600–1000 ns, and the period is ≥1200 ns. The special content is the
  0xFF-header packet: [15:11] R, [10:6] G and [5:1] B current (10 + n mA,
  10–41 mA), and [0] the test-mode bit. FastLED agrees: it sets FLIP=true
  with a 500 µs wait, and notes "FLIP is currently only honored by the nRF52
  backend".
- **TM1913 / TM1914:** both inverted, with the same bit timing. The reset
  differs: TM1913 is 200–20000 µs, TM1914 ≥200 µs.
  - **TM1914 mode command:** C1 C2 are 48 bits, a 24-bit code followed by its
    24-bit inverse, and start every frame. Codes:
    - 0xFFFFFF_000000: normal mode. Start on DIN. After more than 300 ms
      without data, switch to FDIN, and back again the same way.
    - 0xFFFFFA_000005: DIN only.
    - 0xFFFFF5_00000A: FDIN only. DIN-only and FDIN-only are meant for aging
      and installation tests.
  - **TM1914 second input:** chip k's DO1 feeds chip k+1's DIN, and its DO2
    feeds chip k+2's FDIN. The controller's Fi port sends `C1 C2 Dx D1…Dn`
    (Dx is any 24 bits), so an FDIN carries the stream meant for the previous
    chip. TM1914A has one DO feeding both.
  - **TM1913:** no command words. With no input for 600 ms (table) or about
    300 ms (text), it plays a built-in pattern and sends 2048 points
    downstream at 500 kHz.

## Disagreements between documents

- **TM1803:** V1.5 (400 kbps only, pin 7 NC) vs the old English sheet (SET
  pin, 400/800 kbps). The T1H windows are disjoint: 1600–2000 vs 1210–1510 ns.
  Inside V1.5, the features say "scan frequency ≥400 Hz" while TPWM is
  3–4 ms. The features list SOP8/DIP8, but p10 draws an MSOP8 outline.
- **TM1804:** V2.3 changes V1.9's windows (high-speed T0H 300–390 vs 350–450,
  T1H 650–1000 vs 700–1000, with low-speed changes too) and adds the 5 µs
  gap limit. The 2014 English sheet has reset 10/24 µs vs ≥40 µs, prints Fc2
  "400 KHz" for high speed, and its high-speed note says "2.5uS (800KHz)".
- **TM1809:**
  - V1.6/V1.8 tables say Treset ≥200 µs, but the text says ">15us".
  - The gap limit is 200 µs in V1.6 and 5 µs in V1.8, and V1.8 shifts the
    windows.
  - English Rev 01 (2011) is disjoint from both: high-speed T1H 530–670 ns,
    T0L 530–670 (which misses WS2812B's T0L [700, 1000]), and reset typ
    24 µs.
  - The PWM period is 4 ms in Rev 01 and 1.3 ms in V1.6/V1.8.
- **TM1812:** English V1.4 has reset ≥8 µs and an 8 µs gap limit; V1.6/V1.8
  have ≥200 µs and 5 µs. V1.8 changes the windows, and its text says each
  chip decodes "24bit" while it takes 96.
- **TM1903:**
  - Only English V1.2 has an internal-control module (Tos 600 ms, "external
    control mode") and the "might be close output" line. V1.0/V1.3 have
    neither.
  - The English windows add T0H min 310 and T1H max 1000.
  - V1.0 claims one bad chip doesn't stop the others, on a single-input part.
- **TM1934:**
  - English V1.0 refers to a mode-setting command, C1/C2 and a SET pin, none
    of which exists. Neither sheet says how the modes are selected or switched.
  - English note (1) says "low level time" where the Chinese says high.
  - Current is 14 mA (V1.4) vs 15 mA (EN). Packages: SOP8 (V1.4) vs SOP8 and
    SOT23-8 (EN).
- **TM1814:** V1.0 → V1.1 drops the T0l min and T1l max. Outputs go from
  350/700 to 360/720 ns, Tplz from 178 to 155 ns, the high gap limit from 126
  to 50 µs, and internal-mode output from 2048 to 1918 points. V1.0 also says
  W sets OUTR (a typo).
- **TM1824:** note (2) limits the **high** time between bytes on a part that
  idles low (it reads as copied from TM1814).
- **TM1829:**
  - The refresh arithmetic is off: "1200ns (frequency 800KHZ)" is 833 kHz,
    and "24×0.6uS=28.8uS" is wrong because 24 × 0.6 = 14.4.
  - The diagram labels R14..R10 where the text says RI[4:0].
  - The 800 kHz condition "DIN dangling or connect GND" doesn't apply (no
    mode pin).
  - TM1829B's sheet is a different protocol (see above).
- **TM1913:** the time to internal control appears three ways: Tos ≥600 ms
  (p4), "about 300 ms" (p7), and a reset high over 20000 µs "may switch" (p6).

## Database corrections (not applied)

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

## Open

- **WS2812B references:** only the 2013 WorldSemi sheet was read.
  world-semi.com serves datasheets through a script, so newer WS2812B windows
  are unchecked.
- **20 ms reset maximum:** what TM1903/TM1934's 20000 µs maximum means for a
  line idling low between frames. TM1913's equivalent is a high idle, which
  may trigger internal control.
- **TM1934 input switching:** the switching rule and how modes are entered.
  Whether TM1934 and TM1914 drop the first packet on FDIN is implied by the
  Fi = (C1 C2) Dx D1… structure, but not stated.
- **TM1829 power-on default:** the default constant current is not printed.
- **TM1824 gap limit:** the low-time gap limit is mis-worded, so unknown.
- **Old sheets:** which silicon the unbranded 2011 TM1803 and TM1809 English
  sheets describe is unknown.
- **Controller-maker pages:** not consulted (Advatek, ENTTEC, Falcon).
