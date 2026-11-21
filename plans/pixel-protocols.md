# Pixel protocols explainer (workstream 8)

Part of the [website build-out](website-buildout.md). Thread: workstream 8,
launched by the cross-links thread (stream 4) on 2026-11-20.

## Goal

Cameron's request (verbatim): "I want a page that explains the pixel
protocols. I'd love it to become the official system that cuts through the
bullshit of two pixels claiming different protocol when on the wire they're
the same thing. I want nice animations of the single wire protocol, dual wire
(SPI), explanations of backup data wire, DMX512, and a mention of sACN but
don't get into ethernet details." He sees it as "a new category/explainer
page/detail... a little different than the existing product pages" and will
have more input.

Two deliverables:

1. **Canonical on-the-wire protocol families**, defined by what the signal
   does (line coding, bit timing and tolerances, bits per channel, channels
   per pixel, frame structure, how each pixel passes data on, backup-line
   behaviour), not by marketing names. Parts that can't be told apart on the
   wire share a family; real differences are stated precisely. Every claim
   from a datasheet, maker page or standard.
2. **An explainer page** (`/protocols`) with animations: single wire
   (WS2811-style), clocked two-wire (APA102-style), the backup data line,
   DMX512 (plus DMX-addressed pixel ICs), and a mention of sACN. Then tie the
   database's `data.type` to the families (after Cameron approves the data
   model).

## Environment / context

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-pixel-protocols-7a0bde064d6a8372`, branch `ws/pixel-protocols`.
- Ship: rebase onto `origin/master`, `git push origin HEAD:master` (fast-forward only, never force). Every push deploys production (Cloudflare Pages; GitHub Pages is the CI backup).
- Checks before a push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:unit`, plus `bun run test:e2e` (headless chromium) for UI changes.
- Code this stream touches: new `app/routes/protocols.tsx` + components under `app/components/protocols/`, styles in `app/styles/protocols.css`; one-line additions to `app/routes.ts`, `app/lib/data.ts` (`getAllRoutes`), `app/routes/sitemap.ts`, the header nav (stream 7's) and the search palette's page list.
- Protocol families today come from `data.type` (free text) on pixels and pixel ICs. Consumers: `app/lib/relations.ts` (families, "Same protocol (…)" rows, `linked.pixels`), `tests/unit/relations.test.ts`, `scripts/cross-link-stats.ts`, the designer (`app/lib/designer/catalog.ts` `family`, `compat.ts` `familyTokens` parses "WS2811/12" shorthand), `app/lib/fields.ts` label "Protocol family".
- Research notes and evidence: `plans/pixel-protocols/` (one file per batch, every claim with its URL and quote).

## Decisions already made (don't re-ask)

- Build the explainer first; the animations and explanations don't depend on the data-model decision. SVG/CSS/JS in React, `prefers-reduced-motion` respected, light and dark, fits a phone. No `title=` tooltips: information inline or behind a tap-to-expand.
- Propose the data model (category vs typed enum, how entries reference a family, the mapping of every current `data.type` value with evidence) **before** migrating any data; Cameron approves it first.
- A schema change (new category or enum) is logged with stream 2 in ISSUES.md before landing.
- Per-entry research commits are reviews (not in `IGNORED_COMMITS`); batch commits derived only from existing notes go in `IGNORED_COMMITS` or carry `Not-A-Review:`.

## Plan / steps

1. [x] Read the build-out plan, CLAUDE.md, CONTRIBUTING.md, ROADMAP.md, ISSUES.md, cross-links plan; census of `data.type` (below).
2. [x] Research: datasheets for every family (ten delegated batches, evidence in `plans/pixel-protocols/`), spot-checked here (list under Findings).
3. [x] Explainer page `/protocols`: single-wire bits and chain, clocked bits and chain (APA102 vs SK9822 latch), stalled-sender comparison, backup line, DMX512 packet and DMX pixels, sACN / Art-Net, the timing-windows chart, "Who speaks what" and the same-on-the-wire checker, sources with quotes.
4. [x] Nav entry, search palette, sitemap, e2e + a11y coverage; ISSUES.md notes for streams 2, 3, 7.
5. [x] Data-model proposal (above) and the mapping of every `data.type` value.
6. [ ] **(current)** Full checks, rebase, push the explainer; show Cameron the proposal.
7. [ ] After approval: schema change (with stream 2), migrate entries, update `relations.ts`, its tests, `cross-link-stats.ts`, designer `familyTokens` (with stream 3), `/protocols/<id>` pages, entry-page links; apply [corrections](pixel-protocols/corrections.md).

### Research agents (delegated 2026-11-20 5:45 PM PST, 01:45Z)

Brief: [pixel-protocols/BRIEF.md](pixel-protocols/BRIEF.md). Each writes one
`plans/pixel-protocols/<batch>.yaml` (+ `.md` summary), no commits; reviewed
and committed here.

- [A1: WorldSemi single-wire](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A7a4f8658-808c-4edc-8b1d-7863708b21c2) → `a1-worldsemi`
- [A2: SK68xx, APA10x, PL9823](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Ab6155fa2-f598-480c-8ca5-e64fea11438d) → `a2-sk-apa`
- [B1: Titan Micro](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Aadb6d483-eb1d-4d98-a621-f2e3021b348c) → `b1-titan`
- [B2: UCS](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A83e4486f-06dd-444b-902a-05a99975b9f8) → `b2-ucs`
- [B3: Sunmoon SM16xxx, GS/CS/GE/LC](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A13c148b5-6792-4027-8393-ff7d42b5df2a) → `b3-sm-gs`
- [B4: other single-wire and odd protocols](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Aa434f024-a49e-43ed-a8c7-b29a377d349a) → `b4-other-single-wire`
- [C1: APA102-style and 16-bit clocked](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A9878e6c2-99f0-4332-83c8-1ce67c9b865c) → `c1-apa102`
- [C2: other clocked ICs](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Ae7194df5-bf21-4e11-8780-8c2939ed0d85) → `c2-clocked`
- [D: DMX512, sACN, DMX pixel ICs](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A0fa71b90-009f-4c0e-8d55-a43668bd2299) → `d-dmx`
- [E: what controllers and libraries send](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Afd1e3cd9-0ced-4eed-b18d-4cd66572c112) → `e-practice`

## Census of `data.type` (2026-11-20, `8c72dc72`)

126 pixels + pixel ICs; 118 with a value, 8 without (ge1603, gs8202,
icnd2110, qed3001, pixel-ics/sk6818, tc2811, ucs2603, p943). 41 distinct
values: `WS2811/12` 44, `APA102` 10, `UCS1903` 7, `4chWS2811/12` 7,
`DMX512P` 5, `SK9826` 4, `LPD6803` 3, `LPD8806` 2, `MBI6023` 2, `MY9231` 2,
`SM16716` 2, `4chSM16803` 2, `WS2801` 2, and 28 single-use labels. The
trailing-space `WS2811 ` / `WS2812 ` values mentioned in the brief are gone
already.

## Data-model proposal (for Cameron; nothing migrated yet)

### What a "protocol" is

Two layers, both visible on `/protocols`:

1. **Signal**: how bits are put on the wire. Seven kinds cover every part in
   the database: single wire with pulse-width bits (idle low), the same
   inverted (idle high), single-wire packets (MBI6120), Manchester (TLS3001),
   plain serial (Pixie), clock + data, DMX512.
2. **Protocol**: everything a transmitter must get right for a part to work:
   signal, timing class, bits per pixel or chip, header / command / gain
   words, start and end frames, latch rule. Parts in one protocol are
   interchangeable on the wire. That is the equivalence the "Same protocol"
   rows, the "compatible with X" filters and the designer need.

Inside one protocol parts can still differ in ways a controller setting
covers or the wire never sees: **channel order** (every controller has the
setting), a **backup data input** (wiring), supply voltage, and the **reset
time** (the protocol states the longest any member needs; a transmitter that
waits that long drives them all).

**Single-wire timing is defined by where the chip decides, not by the
windows datasheets print.** Taken literally, the windows contradict each
other (WorldSemi's own WS2812B revisions can't all be met; 15 sheets share
no single 1-pulse length). The documents that say how a chip decides (UCS's
printed rule: under 0.55 µs a 0, over 0.69 µs a 1; cpldcpu's measured
WS2812B: 563 / 625 ns) and what every major library sends (0 at 250–417 ns,
1 at 729–875 ns) agree. So the WS2811 protocol is "a 0 high for about
0.3 µs, a 1 for about 0.75 µs, 24-bit frames, latch on low", and a part is
in it when its printed 0 and 1 fall on the right sides of that line.

The result: **37 protocols** for the 127 pixels and pixel ICs, written in
`app/lib/protocols/families.ts` and shown on `/protocols` ("Who speaks
what" and the same-on-the-wire checker). 51 parts are the plain WS2811
protocol; 10 its RGBW version.

### Where protocols live (decision 1)

- **A. A 13th database category** (`database/protocols/`, table and entry
  pages through the generic routes). Not recommended: protocols aren't
  products, and the category nav, home grid, exports, search and link
  previews all assume products.
- **B. An enum in the schema, definitions in TypeScript** (what
  `families.ts` is today). Simple, but the facts and their sources would live
  in code, outside the database and its downloads, and a contributor adding a
  pixel would have to edit TypeScript.
- **C. (recommended) Reference data in the database, not a category:**
  `database/protocols/<id>.yaml`, one per protocol, validated by
  `database/_schema/protocol.json`: `name`, `aliases` (the names controllers
  use: "WS281x", "NeoPixel", "DotStar"), `signal`, `summary`, `timing`
  (0 and 1 high-time targets, the decision points where documented, bit
  period, reset), `frame` (bits per pixel or chip, header, start / end,
  latch), `notes`, and `sources` in the usual convention. Pages:
  `/protocols` (the explainer and the table) and `/protocols/<id>` (one page
  per protocol: definition, sourced timing, member parts, every controller
  that drives them). Members are not listed in the protocol file: entries
  point at it, so there is one place to edit.

### How entries point at a protocol (decision 2)

- **`data.protocol: ws2811`** replacing the free-text `data.type`: one id,
  or a list for parts with a speed or mode pin (TM1804: `[ws2811,
ws2811-400k]`). `validate.ts` checks every id exists.
- **How sure** (decision 3): the page marks parts whose only source is a
  controller maker's claim, or no document. Recommended: an explicit
  `data.protocol_basis: datasheet | claim` next to it (absent `protocol`
  means unknown), with the quote under `sources['data.protocol']` as usual.
  Inferring it from the source URL would be fragile.
- `data.clocked` and `data.pixel_size_bits` become checks rather than free
  facts: `validate.ts` fails an entry that contradicts its protocol.
  `data.backup_line` stays per part.
- Consumers move with it: `relations.ts` (families keyed by protocol id; the
  "Same protocol" row links to `/protocols/<id>`), its tests,
  `scripts/cross-link-stats.ts`, the designer (`catalog.ts` `family`;
  `compat.ts` `familyTokens` and its "WS2811/12" parsing go away; stream 3),
  `fields.ts` label, CSV / JSON exports, CONTRIBUTING.md, the `_example.yaml`
  files.

### Granularity (decision 4)

Recommended: **one protocol per frame layout** (WS2811 24-bit, WS2811 RGBW
32-bit, WS2805 40-bit and 16-bit are separate protocols that share the
WS2811 signal). A controller that lists only WS2811 parts isn't credited with
driving RGBW ones, which matches today's `4chWS2811/12` split and keeps the
"compatible with X" filter honest. The alternative, one WS2811 family with
the frame as a separate field, makes the filter claim RGBW support nobody
listed.

### Calls on specific parts (decision 5)

- **APA106, PL9823, SK6822, P943: their own protocol (recommended).** Their
  sheets print a 1.36 µs 1 in a ~1.7 µs bit, and libraries send exactly
  that; a measured PD9823 decides like a WS2812, so WS2811 timing probably
  works, but no datasheet promises it. Today they are filed as `WS2811/12`.
- **UCS1903 (2010–11 timing): its own protocol.** Its 1 is 1.0 µs high and
  0.25 µs low; controllers list it separately for that reason. The 2012-on
  UCS1904 / UCS1909B / UCS1912B use WS2811-class timing (and print the
  decision rule), so they move to `ws2811`. The `ucs1909` and `ucs1912`
  entries describe both the 2011 part and its 2012 "B" successor; worth
  splitting or annotating.
- **The inverted Titan parts** (TM1913, TM1814, TM1914, TM1829) are four
  separate protocols, all idle-high; TM1814 and TM1914 add command words.
- **SM16803 / SM16804 / SM16824E / SM16714** carry a trailing gain word: not
  WS2811 despite the same bits.
- **WS2816**: B / C are plain 16-bit; WS2816A adds a gain word per frame.
  The single `pixels/ws2816` entry covers both; worth splitting.

### Mapping of every current `data.type` value

Generated from `families.ts` and the database (127 entries). "(claim)": only
a maker's or controller maker's statement; "(no doc)": no document found.

| Current `data.type`                                                                                                                                                                      | Entries | Proposed protocol                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `WS2811/12`                                                                                                                                                                              |      44 | `ws2811`: apa104, apa105 (claim), cs8812, ge8812, gs8208 (LED and IC), hd8808 (claim), ink1002, lc8808b, sk6805 (LED and IC), sk6812-wwa, sk6812, sk6812-5050, sk6813-hv, sk6813, sk6851, tx1818, ws2812, ws2813, ws2815, ws2851 (claim), fw1906, gs8206, ink1003, lb1908, ns8808 (claim), sm16703, sm16712, tm1804, tm1809, tm1812, tm1903, tm1934, ws2808, ws2811-v1-4, ws2811, ws2818, ws2818a, ws2818b; `apa106`: apa106, pl9823, sk6822; `sm16711`: sm16711 (claim) |
| `APA102`                                                                                                                                                                                 |      10 | `apa102`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| (none)                                                                                                                                                                                   |       8 | `apa106`: p943; `ws2811`: ge1603, gs8202 (no doc), tc2811 (no doc), ucs2603 (claim); `icnd2110`: icnd2110; `tls3001`: qed3001 (claim); `ws2811-rgbw`: sk6818 (IC)                                                                                                                                                                                                                                                                                                        |
| `4chWS2811/12`                                                                                                                                                                           |       7 | `ws2811-rgbw`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `UCS1903`                                                                                                                                                                                |       7 | `ucs1903`: ucs1903; `ws2811`: ucs1904, ucs1909, ucs1912, ucs2903 (claim), ucs2909 (no doc), ucs2912 (no doc)                                                                                                                                                                                                                                                                                                                                                             |
| `DMX512P`                                                                                                                                                                                |       5 | `dmx512`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `SK9826`                                                                                                                                                                                 |       4 | `sk9826`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `LPD6803`                                                                                                                                                                                |       3 | `lpd6803`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `4chSM16803`                                                                                                                                                                             |       2 | `sm16804`                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `LPD8806`, `MBI6023`, `MY9231`, `SM16716`, `WS2801`                                                                                                                                      |  2 each | `lpd8806`, `mbi6023`, `my9231`, `sm16716`, `ws2801`                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `4chUCS1903`                                                                                                                                                                             |       1 | `ws2811-rgbw` (UCS2904)                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `4chUCS8903`                                                                                                                                                                             |       1 | `ws2811-16bit` (UCS8904, claim)                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `5chWS2811/12`                                                                                                                                                                           |       1 | `ws2805`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `MBI6020`                                                                                                                                                                                |       1 | `mbi6023` (same packet grammar)                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `P9412`                                                                                                                                                                                  |       1 | `ws2811-rgbw` (claim)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `P9883`                                                                                                                                                                                  |       1 | `ws2811` (claim)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `TM1803`                                                                                                                                                                                 |       1 | `ws2811-400k`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `UCS8903`, `WS2816`                                                                                                                                                                      |  1 each | `ws2811-16bit`                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `DM412`, `LD1510`, `LPD1886`, `MBI6120`, `MY9221`, `P9813`, `Pixie`, `SM16714`, `SM16803`, `TLS3001`, `TM1814`, `TM1829`, `TM1913`, `TM1914`, `UCS5603`, `UCS7604`, `UCS7804`, `UCS9812` |  1 each | their own protocol (same id, lower case)                                                                                                                                                                                                                                                                                                                                                                                                                                 |

### Migration, once approved

1. Log the schema change for stream 2 in ISSUES.md; agree the shape there.
2. `database/_schema/protocol.json` and 37 `database/protocols/*.yaml`, each
   with sourced timing and frame (from `plans/pixel-protocols/*.yaml`).
3. Schema: `data.protocol` (+ `protocol_basis`) on pixels and pixel ICs; a
   migration in `scripts/migrations/` writes them from the mapping and drops
   `data.type`. Batch commit with a `Not-A-Review:` trailer.
4. `relations.ts` / tests / `cross-link-stats.ts`, the designer's protocol
   matching (with stream 3), exports, field labels, CONTRIBUTING.md.
5. `/protocols/<id>` pages; entry pages' "Same protocol" row and a protocol
   field link to them; `families.ts` gives way to the YAML.
6. The per-entry corrections the research found
   ([corrections](pixel-protocols/corrections.md)), each as its own
   reviewed commit.

## Findings / gotchas

- **Datasheet revisions disagree on single-wire timing, and the intersection
  can be razor thin.** Read here (2026-11-20, independent of the batches):
  the early WS2812B sheet (Adafruit's copy, no revision printed) gives T0H
  0.4 µs ±150 ns, T1H 0.8 µs ±150 ns, T0L 0.85 µs ±150 ns, T1L 0.45 µs
  ±150 ns, reset "Above 50µs", TH+TL 1.25 µs ±600 ns. WorldSemi's WS2813B-V6
  (V1.1) gives T0H 220–380 ns, T1H 580 ns–1 µs, T0L and T1L 580 ns–1 µs,
  reset >280 µs. Taken literally, a 1's low time must be 580–600 ns to meet
  both. Expect the batches to show the same pattern: the high times are what
  matter (measurements, batch E), the printed low-time windows are not.
- WS2813B-V6 says why the reset grew: "RESET time>280µs, it won't cause wrong
  reset while interruption, supports the lower frequency and inexpensive
  MCU." Its backup line: "Under normal circumstances, the IC extracts signals
  from the DIN. When one IC among them is damaged, the latter IC extracts the
  signal from the BIN without affecting the signal transmission of the
  subsequent ics." The V6 package has DI, BI, DO and **BO** pins (typical
  application circuit, p. 6), and the first IC's BIN must go to GND. What BO
  carries (a passive copy of DI, or a driven one) decides what a fully dead
  chip does: open question for batch A1.
- The APA102C sheet (Shiji / iPixel, Adafruit's copy) is an image PDF: no
  text layer, quotes are transcribed. Frame: 32 zero bits, LED frames of
  111 + 5-bit global + B, G, R (MSB first), 32 one bits; the DIN/CKI diagram
  marks the rising edges.
- WorldSemi's WS2812B sheet's own diagram ("Data transmission method", p. 4)
  draws exactly the chain behaviour the animation shows: D2 carries the
  second and third 24 bits, D3 only the third, each in the same time slot as
  on D1 (the line is idle while the earlier frames go by upstream).
- **The batches' central finding: chips decide on the high time.** UCS
  prints it (UCS1904 p. 6: under 0.55 µs a 0, over 0.69 µs a 1, the low only
  ends the bit, and a low over 8 µs may count as reset); cpldcpu measured it
  (WS2812B: 0 up to 563 ns, 1 from 625 ns, sampled at a fixed internal-clock
  count after the rising edge; latch after ~9 µs of low in 2014 silicon);
  Josh Levine: "The only tight timing parameter … is the maximum width of a
  0-bit pulse". Literal datasheet windows can't define a family: WorldSemi's
  own 2017 and 2018+ WS2812B tables have disjoint T1L windows (A1), and the
  15 single-wire sheets on the chart share no single 1-pulse length.
- **Renamed datasheets are common:** CS8812 and LC8808B sheets are GS8208 V0.1
  with the name changed (hidden text still says GS8208, B3); Newstar's APA104
  is the WS2812B sheet with rows edited (A2); GE8822 and LC8823 are Opsco's
  SK9822 sheet; NS107S and APA107 copy the Shiji APA102C; Rose's HD107S /
  HD108 "behaviour" pages copy cpldcpu's 2014 article (C1).
- **The backup input drops the first frame when it takes over:** WS2813
  (2016) "compare the data with the DIN side after phagocytosis of 24bit
  data"; GS8206/8208 "SDI2 will discard the 1-24bits data and use 25-48bits
  data"; LB1908's FDIN likewise; WS2818 and TM1914 make the controller send
  one extra pixel when feeding the backup input. The animation's model
  (`backup.ts`, skip on backup) matches.
- **Controller makers contradict datasheets** in places: ENTTEC says DMX
  pixels are daisy-chained (they are on a parallel bus, D); Falcon files
  SM16804 (gain word) as plain 4-channel (B3); libraries disagree on UCS1903
  (400 vs 800 kHz) and APA106 (long cell vs WS2812 cell) (E).
- Spot-checked here against the original documents (2026-11-20): TM1814 V1.1
  (inverted, C1/C2), WS2821 (parallel bus, address line), E1.11-2024 tables,
  E1.31-2018 universe range, Art-Net 4 and ENTTEC quotes, cpldcpu's APA102,
  SK9822, WS2812 and PD9823 articles, Josh Levine's article, SK9826 REV04,
  NS108, HD108 V1.1.0, UCS1904's decision rule, SK6812 B/1, APA106
  (SparkFun), WS2811 V1.5 and the old WS2811. Every one matched the batch.
- Tooling: `python -I` ignores PYTHONIOENCODING; datasheets with fullwidth
  punctuation need `sys.stdout.reconfigure(encoding='utf-8')` to print.
- ESLint's `react-hooks/refs` rule flags any `.ref` property read in render,
  even a callback ref returned by a hook; the timeline's callback is
  `observe`.

## Progress log

- [x] 2026-11-20 5:33 PM PST (01:33Z): survey done, plan written.
- [x] 2026-11-20 5:45 PM PST (01:45Z): ten research batches delegated (above).
- [x] 2026-11-20 6:00 PM PST (02:00Z): page scaffold committed locally (`98c0f8ea`, not pushed): `/protocols` route, single-wire bits + chain (vertical on phones), clocked bits, stalled-sender comparison, backup line, DMX512 packet; header/footer/palette/sitemap links; 7 e2e tests and unit tests for the models. Values on the page are still placeholders.
- [x] 2026-11-20 6:25 PM PST (02:25Z): WS2812B (early), WS2813B-V6 and APA102C read independently; `app/lib/protocols/reference.ts` holds their sourced values and quotes; unit tests check every citation and the common-timing arithmetic.
- [x] 2026-11-20 7:00–9:30 PM PST (03:00–05:30Z): batches B1, D, C1 reviewed and committed as they landed; the rest read and spot-checked. Page text rewritten from sourced values (`reference.ts`: every number has a source, place and quote; the Sources list shows the quotes behind a tap). New: clocked chain (APA102 vs SK9822 latch), timing-windows chart, "Who speaks what" (`families.ts`: 127 parts in 37 protocols, unit-tested against the database), same-on-the-wire checker. 10 e2e tests, axe clean in both themes.
- [x] Proposal and mapping written (above); corrections collected in `plans/pixel-protocols/corrections.md`; ISSUES.md entry for streams 2, 3, 7.
- [ ] Full checks, rebase, push; Cameron's decisions on the proposal.

## Open questions for the user

1. **Where protocols live**: (C, recommended) reference files
   `database/protocols/<id>.yaml` with their own pages, not a category; or (A)
   a 13th category; or (B) keep them in TypeScript.
2. **Entry field**: `data.protocol` (one id or a list) replacing `data.type`
   (recommended), plus `data.protocol_basis: datasheet | claim` to mark parts
   known only from a controller maker's claim (recommended) or no marking.
3. **Granularity**: one protocol per frame layout, so RGBW, 5-channel and
   16-bit WS2811 parts are separate protocols (recommended), or one WS2811
   family with the frame as a separate field.
4. **APA106 / PL9823 / SK6822 / P943**: their own protocol, as their
   datasheets print (recommended), or folded into WS2811 because a measured
   clone decides the same way.
5. **Corrections** (about 80, with quotes): apply them with the migration as
   per-entry commits here (recommended), or hand the non-protocol ones to
   stream 2.

## Things not to do

- Don't migrate `data.type` values before Cameron approves the data model.
- Don't batch-derive families from name similarity; every assignment needs a datasheet or maker source.
- Don't edit `DataTable.tsx` / `ColumnFilter.tsx` internals (stream 7) or the designer's code (stream 3) without coordinating in ISSUES.md.
- Don't put `title=` tooltips on anything.
- Don't pipe a gating command into `tail`/`grep` in a chain that ends in `git push` (the pipe's status is the filter's).
