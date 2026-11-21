# Batch d-dmx: DMX512, sACN, and the DMX-addressed pixel ICs (summary)

Data and every quote: [d-dmx.yaml](d-dmx.yaml). Researched 2026-11-20.

## DMX512 numbers for a timing diagram

Source: ANSI E1.11-2024 (USITT DMX512-A), Tables 6 and 7, PDF p. 30 (printed 16).
The values are identical in E1.11-2004 and E1.11-2008 (R2018), except for one
receiver BREAK cell, noted below.

| Item                | Transmitter (Table 6)                                                                                              | Receiver must accept (Table 7)                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Bit rate            | 245 / 250 / 255 kbit/s                                                                                             | same                                                                                 |
| Bit time            | 3.92 / 4 / 4.08 µs                                                                                                 | same                                                                                 |
| Slot                | 11 bits = 44 µs: 1 start bit (low), 8 data bits **LSB first**, 2 stop bits (high), no parity                       | same                                                                                 |
| BREAK (low)         | ≥ 92 µs, typical 176 µs                                                                                            | ≥ 88 µs (2024 adds "max < 1.00 s" and "Note 2: receivers may accept shorter BREAKs") |
| MAB (high)          | ≥ 12 µs, < 1.00 s                                                                                                  | ≥ 8 µs, < 1.00 s                                                                     |
| START code (slot 0) | 0x00 = NULL START Code (levels); 0x01–0xFF = Alternate START Codes (e.g. 0xCC RDM, 0x17 text, 0x55 test, 0xCF SIP) | receivers must check it                                                              |
| Data slots          | 0 to 512 (513 slots including the START code)                                                                      | —                                                                                    |
| Mark between slots  | 0 to < 1.00 s                                                                                                      | same                                                                                 |
| Mark before break   | 0 to < 1.00 s                                                                                                      | same                                                                                 |
| Break to break      | 1204 µs to 1.00 s                                                                                                  | 1196 µs to 1.25 s                                                                    |
| Idle                | high (Mark)                                                                                                        | —                                                                                    |

Earlier versions: MAB was 4 µs in 1986 and 8 µs in 1990 (E1.11's note under §8.4).
The transmitted BREAK was 88 µs in DMX512/1990 and became 92 µs in DMX512-A. That
88 µs figure comes from the ESTA-hosted PLASA _Recommended Practice for DMX512_,
because the 1990 document itself was not found.

Full packet arithmetic (my own, from the table values, with every mark set to 0):
92 + 12 + 513 × 44 = **22 676 µs, which gives 44.1 Hz**. The standard itself prints
"22.7 ms" and "44 updates/s". With receiver minimums: 88 + 8 + 22 572 = 22 668 µs
(44.12 Hz). At the bit-rate limits the same packet takes 22 233 µs at 255 kbit/s
(45.0 Hz) and 23 137 µs at 245 kbit/s (43.2 Hz). The shortest legal packet is
1204 µs (830 Hz); the standard's Note 1 says 1 Hz to about 830 Hz for transmitters
and 0.8 Hz to about 836 Hz for receivers.

Electrical: EIA-485-A on a differential pair, with one driver per link.

- **Termination:** 120 Ω +5 %/−10 % at the far end.
- **Loads:** 32 unit loads per link, with each receiver at 1 unit load or less.
- **Connector:** 5-pin XLR (pin 1 common, 2 Data 1−, 3 Data 1+, 4/5 second pair). Sockets go on transmitters and plugs on receivers.
- **Cable:** outside E1.11's scope. E1.27-1 asks for shielded twisted pair of 100–120 Ω (120 preferred) and sets no length limit.
- **300 m:** this figure is the PLASA guide's recommendation, not a requirement of the standard.

## sACN, Art-Net, universes

- **sACN.** E1.31 (2018 edition, CP/2014-1009r6a): "transfer DMX512-A [DMX] packets over an IP network using a subset of the ACN protocol suite", "packets of all START Codes". A universe is "a set of up to 512 data slots"; universe numbers run from **1 to 63999**. The 2025 public-review draft has the same range. I did not read the published 2025 edition, which needs an email sign-in.
- **Art-Net.** Art-Net 4, rev 1.4dp (23/10/2025), Artistic Licence: "Its purpose is to allow transfer of large amounts of DMX512 data over a wide area using standard networking technology". "Universe: A single DMX512 frame of 512 channels"; Port-Address valid range 1–32,767.
- **Universe arithmetic.** ENTTEC (updated Jul 19, 2026): "One DMX universe fits 170 RGB pixels (using 510 of its 512 channels) or 128 RGBW pixels (using all 512 channels exactly)". Advatek's DMX-pixel guide says the same thing.

## DMX-addressed pixel ICs

What they all share:

- **Bus.** They sit **in parallel** on one data line, so every chip sees the whole stream. Each datasheet says a failed chip does not affect the others.
- **Address.** Each chip keeps its start address in EEPROM and takes 1–4 consecutive slots from there. They are not daisy-chained for data, but most chain a separate **address line** chip to chip (PI→PO or ADRI→ADRO), used only to write addresses.
- **Framing.** DMX framing with BREAK ≥ 88 µs, MAB ≥ 8 µs and 11-bit slots. The UCS512 datasheets require a start code of 0x00.
- **Rates.** All accept 250 kbit/s and also faster rates, decoded automatically ("without any speed setting").

| Part (DB entry)                       | Input                        | Rate the maker prints                             | Slots per chip                                                                    | How the address is written                                                                                                                                                             |
| ------------------------------------- | ---------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UCS512B3 (pixel-ics/ucs512b)          | single-ended DAI             | 250–750 kbit/s (features); table 200/250/800      | 3                                                                                 | PI→PO address line, one pass                                                                                                                                                           |
| UCS512A1 (none)                       | differential A/B             | 200–500 kbit/s                                    | 1–4 (pins PT1/PT0), plus up to 192 forwarded on DO as single-wire code to UCS29xx | PI→PO, with A held high / B low                                                                                                                                                        |
| UCS512C1 / C1L / C2 / C2L (none)      | differential                 | 200–750 kbit/s (table tops at 500)                | 1–4 (parameter)                                                                   | PI→PO, cascaded or parallel                                                                                                                                                            |
| UCS512CBL (none)                      | single-ended DAI             | as above                                          | 1–4                                                                               | as above                                                                                                                                                                               |
| UCS512C3 (none)                       | differential                 | 200–750 kbit/s (table and switching spec say 500) | 1/2/3/4 (how it is chosen is not stated)                                          | over the AB data pair                                                                                                                                                                  |
| UCS512H4 / H4L / H5L / H0L, HL (none) | differential; HL single-wire | 200–750 kbit/s (table tops at 500)                | 1–4 (parameter)                                                                   | automatic coding along PI→PO, or cascade or parallel writing                                                                                                                           |
| WS2821 (pixel-ics/ws2821)             | single-ended DAI             | 250–750 kbit/s                                    | 3 channels                                                                        | ADRI→ADRO "write code" line (format not documented)                                                                                                                                    |
| WS2822S (pixels/ws2822s)              | single-ended DAI             | 250–750 kbit/s (protocol text says 200–750)       | 3                                                                                 | ADRI→ADRO: ≥ 5 ms low, then a 250 kHz packet sent MSB first with 3 frames per pixel (address low byte, range byte F0h…96h, D2h); each pixel strips its 3 frames and passes the rest on |
| SM16511BK (pixel-ics/sm16511)         | single-ended                 | 250–750 kbit/s                                    | 3 channels                                                                        | over the data bus, with no address wire (maker web page only)                                                                                                                          |
| "DMX512" / DMX512P (pixel-ics/dmx512) | single-ended (Advatek)       | 250–750 kbit/s (Advatek now; 250–650 in 2023)     | 3 (Falcon)                                                                        | factory or an external tool (Advatek)                                                                                                                                                  |

Where they depart from the standard:

- **Signal.** The single-ended parts take a logic-level signal, not EIA-485. UCS512B3's datasheet places an RS-485-to-single-line "routing amplifier" near the lamps for long runs.
- **Loading.** The differential UCS parts claim **up to 1024 loads** on one AB bus (UCS512A1/C3: "N=1024"), against EIA-485's 32 unit loads.
- **Rate and slot count.** They accept up to 500, 750 or 800 kbit/s and more than 512 slots per packet: 4096-channel addressing on the UCS512 parts and 3072 frames on the WS2822S. The UCS512C1/C3 tables give the frame rates that result: 250 k at 1024 channels → 22 fps; 500 k at 2048 → 22 fps.
- **Frame rate.** The UCS512A1/C1/C3/H tables print a minimum **reset interval of 4096 µs**. UCS512A1 spells it out: "not less than 4mS … frame rate is not greater than 250HZ". DMX512 allows 1204 µs.
- **MAB.** WS2821/WS2822S print MAB as **min 4 / typ 8 / max 12 µs**. A DMX512-A transmitter must send ≥ 12 µs with no upper bound below 1 s, so a compliant transmitter can exceed the printed maximum. Whether 12 µs is a real receive limit is not stated.

## Disagreements found

- **UCS512B3.** The rate is printed four ways (250–750, 200–750, 200–800, "F 750 Kbps"). The table's stop-bit minimum (4 µs) and field maximum (27.5 µs) contradict its own bit times. The address line reaches 50 m in one place and 100 m in another.
- **UCS512C1, C3, H.** Each timing table tops out at 500 kbit/s while the text says 750. The UCS512C3 document calls the part "UCS512CN".
- **WS2822S.** The rate is 250–750 in one place and 200–750 in another. Gray data is sent LSB first but the address packet MSB first, which the waveform confirms. The address-range table has uneven bounds (256~512, then 513~768).
- **Controller makers vs datasheets.** ENTTEC's DMX512, SM16511 and UCS512B pages say data passes down a chain and one failed pixel stops everything after it, which contradicts the parallel bus. ENTTEC also gives the SM16511 package as SOP10/16 where the maker says SOP8. Advatek lists SM16511 as RGBW where the maker says three channels. Advatek's guide calls 300 m "the DMX512-A standard … maximum", but no standard sets a length.
- **E1.11 itself.** §8.10 cites designator #13 for break-to-break, but the table names it #11 (same values). ESTA's documents list gives control number CP/2024-1011r2a while the PDF prints CP/2023-1011r2a.

## Database corrections (not edited)

- `pixel-ics/dmx512`: `bitrate: 650kHz` matches Advatek's 2023 page ("250 – 650 kbps"). Advatek's current page lists DMX512P at "250 - 750 kbps". Pixel size is 24 bits here but 33 in the ws2821/ws2822s entries, so the convention is inconsistent.
- `pixel-ics/sm16511`: `pwm_frequency 3.3kHz`, "configurable to 800Hz", has no maker source; only ENTTEC says "selectable 800/3300Hz". The `data.type` source URL now serves Advatek's generic DMX512 page. Add the maker's name SM16511BK as an alias.
- `pixel-ics/ucs512b`: no error. The cited document is the UCS512B3 one; the entry could add 250–750 kbit/s, single-wire parallel, and 4096-channel addressing.
- `pixel-ics/ws2821`, `pixels/ws2822s`: checked; no errors.

## Not verified / open

- **DMX512/1990.** The text itself was not found. The 88 µs transmitted BREAK of 1990 comes from the PLASA guide, the 1986/1990 MAB values from E1.11's note.
- **Source copies.** The official E1.11-2024 and E1.31-2025 downloads need an email sign-in, which I did not submit. I used archived copies of the same files (E1.11-2024) and the 2018 edition plus the 2025 draft (E1.31).
- **UCS512D / UCS512E.** No documents exist online that I could find. UCS512C4 (Falcon's "DMX512P-4" alternative) has no datasheet found either.
- **Chinese originals.** Not found for UCS512B3, C1 or H; the LEDYi English copies are machine-translated. UCS512A1 and C3 are bilingual or partly Chinese.
- **SM16511.** No datasheet; the maker's page link is empty. Its timing, slot use, address format and PWM are unverified.
- **WS2821.** The address-write format is not in its datasheet. I did not assume the WS2822S format applies.
- **DMX512P.** No chip datasheet exists online; Advatek's 2023 attribution to "Tianli New Technology Co." is unverified. Falcon lists "Wires: 2" for DMX512P without saying what is counted.
