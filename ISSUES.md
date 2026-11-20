# Issues

Side issues found while working on something else, plus cross-workstream
coordination notes. Each entry: what was seen, why it matters. Claim an entry
(`in progress — <thread/branch>`) before working on it; remove it or mark it
fixed with the commit hash when done. Workstreams: see
[plans/website-buildout.md](plans/website-buildout.md).

## Dev server took minutes to start on Windows — fixed (stream 3, FYI)

If an e2e run died with "Timed out waiting 60000ms from config.webServer", or
the dev server answered 500 with "transport invoke timed out after 60000ms …
/app/app.css": Vite was opening a file watcher for every file under the
root, twice (React Router runs a second Vite server), and a `build/` left by
`bun run build` tripled the count. `vite.config.ts` now keeps the watcher out
of `build/`, `database/` and `playwright-report/` (2026-11-20). Rebase to get
it; no need to delete `build/` before running e2e. YAML edits still show up
on refresh: the database is read with `fs`, not through Vite.

## Same product in two categories

**Fixed (stream 2).** Merged: QuinLED-Dig-Quad and Dig-Uno, the M4-PI
(three copies), M8-PI and the differential receiver (d487f110); the
"Silicone Sealant" row into Plastazote LD45 (fb3f9b76); ESPArtStick WLED
(2a3efbf1); the SM1616 stub, whose sheet row maps to `pixel-ics/sm16716`
(a2e23ddd); ElectroMage's two expanders into their controller entries
(f39db2f5); and the Raspberry Pi 3 Model B, which cross-links added as
`raspberry-pi-3b` while parity gave it `raspberry-pi-3-model-b` (63d7e346).
Each removed entry and the sheet row it came from: the removed-entry map in
[plans/database-review.md](plans/database-review.md).

## Coordination: link fields belong to cross-links (stream 4)

Stream 4 researched and filled these fields across the database
([plans/cross-links.md](plans/cross-links.md)): controllers'
`outputs.protocols`, `software.firmware` / `works_with`,
`inputs.requires_host`, `outputs.driver.IC` and the free-text
`outputs.connector` values; drive libraries' `supported_ics` (pixel parts
only; control protocols moved to `protocols`); every entry's `related`
(including adapters' `host` boards), `aliases` and `sources`; pixels' and
pixel ICs' `data.type` protocol families. The legacy `related_*` arrays are
retired: the schemas reject them. Please don't batch-edit those fields; log
findings here instead. Spelling variants ("APA-106" vs "APA106", "WS2812b")
don't need rewriting: `app/lib/relations.ts` matches names case- and
punctuation-insensitively, through `aliases` and `variants[].name`.

## Entry-page and table changes from cross-links (stream 7, FYI)

Entry pages now have a "Works with" section (driven by, supported by, runs on,
host for, used in, same protocol) and a "Related products" section, both from
`app/components/ui/EntryLinks.tsx`; they replaced the old "Related Products",
`related_*` and "Used by …" sections. Name-list fields render as link pills in
their card (a long list shows 12, then a tap-to-expand "+N more"), and
`sources` provenance renders under the field it documents as "source: host,
date", with the source's own words behind a "note" toggle. "Related products"
ends with "More from <maker>", minus what its other rows already show.
Table pages now load entries through `loadCategoryTableData`, which drops
`sources` (a quarter to a half of a researched entry, never shown in a
table); exports and entry pages keep it.
Stream 4 also added compatibility columns through `app/lib/columns.tsx` only
(no `DataTable` / `ColumnFilter` internals): controllers and adapters get
"Pixel ICs" (filter `linked.pixels`, which matches same-protocol parts and
firmware-supported ones, e.g. `/controllers?f=linked.pixels:WS2815`); pixels
and pixel ICs get "Hardware" and "Libraries" counts; pattern drivers and
drive libraries "Hardware"; connectors "Used by"; microboards "Add-ons". The
values come from `entry.linked`, derived at load time in `relations.ts`.
Shout here if that collides with the browse-UX work.

## Schema changes from database review (stream 2, FYI)

Validation (`bun run validate`, also in CI) rejects the old shapes, so a
rebased branch with entries in them fails until they're converted: run the
migrations in `scripts/migrations/` again after rebasing (they're no-ops on
migrated data, and stop on a value they don't know). How to change a schema:
[database/\_schema/README.md](database/_schema/README.md); how to write
values: CONTRIBUTING.md, "Values". Field-by-field detail:
[plans/database-review.md](plans/database-review.md).

- Packages: `physical.packages`, LCSC-style (`SOP-8`, `QFN-16`; LEDs `5050`,
  `5mm`).
- Controllers and adapters share `outputs` / `power` shapes;
  `outputs.clocked` is `false`, `selectable` or `always`; inputs use a fixed
  vocabulary. Mains-powered units: `power.ac`, `power.output_voltage` (d1d23db4).
- Pixels and pixel ICs: `color.channel_bits` (one or a list),
  `color.brightness_control {bits, method, scope}`,
  `electrical.supply_voltage`; `aggregate_bits` is gone. `electrical.wattage`
  is the maker's whole-pixel figure (52de8d86).
- Pattern drivers: I/O directions `Input` / `Output` / `Both` / `false`, other
  I/O as tag lists, visualizer `1D` / `2D` / `3D`, `language` one or a list.
  Drive libraries: `language` likewise; `links.url` for a website, `links.repo`
  for code only (8c69b346).
- Typed connectors, microboards, diffusive materials, commercial systems and
  level converters; attribution (`creator`, `manufacturers`, `vendors`) is one
  shared definition (6bae2012); quantities drop trailing zeros (`20mA`).

## Sheet's Controllers "Interface" column is scrambled — don't restore from it

**Done (stream 2)**: every controller's `inputs` re-checked against makers'
docs (de0730ff; evidence in
[plans/database-review-inputs-audit.md](plans/database-review-inputs-audit.md)).

In the Google Sheet's Controllers tab the Interface column was sorted on its
own: its values run alphabetically down the sheet (" ", "ArtNet Ethernet",
"Bluetooth" ×4, … "DMX" …, "Ethernet" …, "FPP" …, "SD Card" ×3, "Switch
Trigger", "TTL Serial" ×2, "USB" …, "WiFi" …) while every other column follows
the rows, which are sorted by price. Rows added after the sort (GLEDOPTO,
SpiNode, deskontroller V3, …) are fine. So for most original rows the sheet's
Interface value belongs to some other controller: Fadecandy "DMX", PixLite 4
Rugged "USB", Qolorpix "WiFi", Flex Pixel Driver "Ethernet" (the issues.txt
"wrong interfaces"). The nested migration researched some entries but kept
the sheet's value on others (e.g. `controllers/pixlite-4-rugged-mk2` inputs
are USB only; `octo-mk2` lists USB and Wi-Fi).

Why it matters: `inputs.physical` / `inputs.protocols` drive the Protocols
column, badges and the designer's controller facts. **Parity (stream 1):
please don't restore or compare controllers' interfaces from that column**;
treat it as unknown. Other Controllers columns follow their rows.

Parity (stream 1): the parity tool no longer compares this column (1381b72).
Parity's research also checked 16 controllers' inputs against maker docs
(c17aa57: DiGidot C4 Live 12 and C4 Extended 8, Falcon F16V4, Genius Pro 32,
K16000S, LED Ethernet Controller 3, LeDMX4 MAX, MagWLED-1, Octo Mk2,
Pixelator Mini, Pixelblaze V3, PixOut Server, ProtoPixel 1-ch Wi-Fi,
QuinLED-Dig-Quad, SmartShow Pro ONE, SPI Matrix). Where stream 2's pass
(de0730f) recorded the same facts, its encoding was kept on rebase and both
citations merged.

## Two "controllers" drive no pixels (parity / standardization)

Found by cross-links research (stream 4), from the makers' own pages:

- `controllers/dmx-core`: a network show controller (Raspberry Pi CM4
  appliance, gigabit Ethernet/PoE, up to 800 Art-Net/sACN/KiNET universes),
  no pixel outputs. <https://dmxcore.com/dmx-core-100>
- `controllers/pixout-server`: Art-Net recorder/player; PixOut's FAQ says
  direct SPI pixel output "is not available yet", so its 8 × 1024 pixel
  outputs are wrong. <https://pixout.lighting/products/recorder/>

Why it matters: they show up in "what drives my pixels" filters and the
designer. Keep (with outputs removed) or move out of controllers: the
category call isn't stream 4's.

Parity (stream 1): PixOut's outputs and 24 V are gone, with the 2019 FAQ and
the current product page cited (caf6035); the category call is still open.
Its `requires_host: Raspberry Pi` is doubtful for the boxed unit, which has
the Pi inside.

Stream 2: DMX Core 100's pixel outputs are gone too (899dc868); the PixOut
entry carries its maker's name ("Pixout ArtNet DMX Recorder"), the D-100's
four DMX outputs and its 12 V supply (899dc868, b4389253). Where both belong
is Cameron's call, tied to the parked pattern-driver kinds: open questions
1-2 in [plans/database-review.md](plans/database-review.md).

Designer (stream 3, 2026-11-20): an entry whose `outputs` block lists only
`auxiliary` outputs is no longer offered as a pixel controller, so the PixOut
recorder and Baldrick DMX are out of the designer wherever they end up. DMX
Core 100 has no `outputs` block at all, which reads as "not recorded": it is
still offered, with a note that its pixel outputs are unknown.

## Pixels' `electrical.wattage` is one channel's power, not the pixel's (stream 2)

**Fixed (stream 2).** `wattage` is now the maker's whole-pixel figure
(52de8d86); per-channel values were replaced by datasheet figures or
removed where the maker gives none (f8749eae). The designer already
prefers `channel_current`; a lone wattage is now spread over the channels.

## Designer facts that depend on unrecorded data (FYI, streams 2 / 4 / 6)

Not bugs — where the designer says "verify" because the database is silent.
Filling any of these makes its checks sharper with no code change:

- `outputs.driver.buffered` is unrecorded on about a third of controllers, so
  the designer can't say whether they need a level shifter. Dev boards without
  `power.gpio_voltage` (Teensy 4.x, ESP32-S3 boards, Arduino Mega) are in the
  same position.
- `inputs.protocols` is missing on about half of the controllers, which makes
  every pattern source "verify" for them.
- Connectors: 34 of 45 families now carry a representative-SKU price
  (2026-11-18); binder-720, chogori, eventcon, hirschmann-ca, ld16-20-28,
  socapex, sp13, sp17, teeplug, wago-221 and wieland-rst still have none.
- Level converters: done for the eleven parts that shift logic levels
  (stream 3, 2026-11-18 and 2026-11-20, the second pass for SN74HCT125,
  SN74HCT245 and TXB0104). `electrical.input_high_voltage` (+ `_notes`) is
  the datasheet's VIH min in the 3.3 V → 5 V role; `io.buffered` says whether
  the outputs can drive a cable (the schema now spells that out: TI calls the
  TXB0104 "a buffered architecture", but its outputs sit behind 4 kΩ and are
  rated for 70 pF, so it is `false`). Both carry `sources` quotes. The
  designer flags 74HC245 (3.5 V threshold), TXS0108E and TXB0104 (weak
  outputs) from them. A new converter entry without the two facts is offered
  unjudged, after the ones that have them; `io.direction: auto` alone is
  enough for the weak-output warning. MAX3485 (`io.differential`) is set
  apart like the differential receiver, not offered as a buffer.
- Adapters: the designer offers an adapter once it has `outputs.count` and a
  `host` link to a /microboards entry: 22 of 40 after cross-links' new-entry
  pass (2026-11-18), which added the Wemos D1 Mini / Pro, BeagleBone Green,
  Pi 3 B, Pi 5, Pi Zero 2 W, PocketBeagle 2 and Orange Pi Zero entries and
  linked the D1 Mini shields, wled-wemos-shield, espartstick and
  orange-pi-dmx. Still without one, for lack of a source naming a board in
  the database: wemos-esp32-driver-board (an ESP32 D1 Mini), 16x-led-shield
  (NodeMCU-32S), 8x-led-shield (any Feather), esp-level-shifter (no source
  survives), pipixel ("the Raspberry Pi family") and pixel-string-pihat-zero
  (no maker text). `outputs.driver.buffered` is recorded on one adapter
  only: an adapter whose `related` has `uses: level-converters/…` counts as
  buffered (13 adapters now name their 74HCT245 / 74HCT125 / TXB0104), the
  rest say nothing about level shifting. Since 2026-11-20 the converter has
  to be one that can put 5 V logic on a data line: a MAX3485 on the same
  board is there for DMX and proves nothing about the pixel outputs.
- Hardware whose `outputs.protocols` lists only matrix-panel interfaces
  (HUB75, HUB75E, HUB08…) is no longer offered by the designer
  (`adapters/pocketscroller-v2` today). A panel driver recorded with no
  protocol list at all would still be offered.
- FYI, one row corrected by stream 3 (2026-11-20):
  `controllers/pixlite-4-rugged-mk2` had `max_per_output: 85`, which made
  the designer reject it for any string over 85 pixels. Advatek's manual
  gives 4 universes on each of 4 outputs, halved on 8 in expanded mode, so
  340 for the 8 outputs the entry counts (quote under `sources`). The other
  PixLite rows follow the same arithmetic and looked right.

## Suspected data errors seen while sourcing images & datasheets (stream 5)

**Processed (stream 2).** Every bullet was re-checked at the maker's page or
datasheet: records in
[stream5-boards.yaml](plans/database-review-fixes/stream5-boards.yaml) and
[stream5-parts.yaml](plans/database-review-fixes/stream5-parts.yaml), applied
in b4389253, f8749eae, 219a1408 (most were already fixed by earlier passes).
What belongs to other streams is under "Hand-offs from the database review".

**Not yet processed:** stream 5's second pass, after the review above.

- **Pixel ICs** ([pass2-pixels-ics.md](plans/assets-research/pass2-pixels-ics.md)):
  tm1804 says 24 V outputs, but the V1.9 sheet it cites and Titan's current
  V2.3 both say 30 V; ge1603's Greeled may be its vendor, not its designer.
- **Pattern drivers** ([pass2-pattern-drivers.md](plans/assets-research/pass2-pattern-drivers.md)):
  grandma's link redirects to `/special/grandma3-software/`; hls's notes may
  understate its last version (an `HLS_Install_26A.zip` was published);
  lightfactory's site refuses non-browser downloads, so a link checker may
  call it dead; Pharos now announces Designer 3 (the entry describes 2).

## Datasheet URLs that serve HTML instead of a PDF (stream 2)

**Fixed.** `connectors/pcb-screw-terminal-block` links Degson's own DG301-5.0
drawing (5abe3867); `pixel-ics/tm1804` and `pixels/tx1818` already had direct
PDFs from stream 5 (f4c36200).

## Connector and diffuser spec corrections (stream 2 or 6)

**Processed (stream 2).** Every item verified at the maker's datasheet or
catalog: 61 applied with sources (c014d639, efdd7703 for the Perspex sheet
size, 8ca4f3e0 for JST SM's dual-row housings), 8 already fixed, 4 unverifiable,
1 rejected. Records:
[connectors.yaml](plans/database-review-fixes/connectors.yaml).

## Spec errors seen during the price/status research pass (stream 2)

**Processed (stream 2).** The ~120 "(d) Wrong facts" in
[plans/data-freshness/findings/](plans/data-freshness/findings/) were each
re-read at the maker and applied with sources: controllers (899dc868),
microboards and pixel decoders (4d013eb7), pixels and pixel ICs (a2e23ddd),
software (3bf00c3a), adapters and commercial systems (f39db2f5). Records,
including rejected and unverifiable ones:
[plans/database-review-fixes/](plans/database-review-fixes/). Hand-offs below.

## Spec contradictions found while writing new entries (stream 2)

**Processed (stream 2).** WS2818B: first datasheet May 2017, R/G/B ports
rated 20 V since V1.3, one chip for 12 V and 24 V strips (5abe3867); LPD8806 7
bits per channel (04566515); NodeMCU v2 three WLED outputs (5abe3867); Orange
Pi Zero LTS is H3 (4d013eb7). P9883 / P9813 keep their makers' names: only
Advatek says Power MOS was DMS (hand-off below). Records:
[issues-final.yaml](plans/database-review-fixes/issues-final.yaml).

## Facts to check, found by parity research (stream 2)

**Processed (stream 2).** LEDs Master's platforms, DiGidot C4 Extended 8's
pixel capacity (its 4096-channel licence: 1365 RGB pixels) and supply, and
Genius Pro 32's editions (eFuses 2024, Power Banks 2025) (5abe3867); Pixelator
Mini's 9-48 V (3b973400) and ProtoPixel 1-ch Wi-Fi's specs and status were
already right; Genius Pro's connector name was fixed in 943342f5. Mains
supplies have a convention (d1d23db4); `aggregate_bits` is gone (da15001b).
LEDs Master's "FOSS" price and QLC+'s contribution are stream 6's (hand-off
below). Records:
[issues-final.yaml](plans/database-review-fixes/issues-final.yaml).

## HD108's quiescent current is unsourced (parity research)

`pixels/hd108` has `quiescent_current: 0.1mA` from the import, with no
source, and the sheet's two rows for the part disagree (HD108 0.1 mA, NS108
1.0 mA). The datasheets back neither: static IDD typical 0 (Newstar NS108
spec Rev. 04, <https://voron.ua/files/pdf/led/NS108_5050.pdf>), maximum 1 µA
(Rose Lighting HD108 V1.1.0, the entry's datasheet). The designer's idle
power uses this field. Needs a measurement or a better source. (The parity
report acknowledges the sheet's 1 mA by pointing here.)

## Link fields for cross-links, from parity research (stream 4)

- `inputs.requires_host`: PB16 says BeagleBone Black, but it's a PocketBeagle
  board; WB1616 lacks its BeagleBone Black; K2-Pi0's maker names the Pi Zero
  2 W.
- Successors for `related`: Pixelator → `controllers/pixelator-mini-px1-8d`;
  not in the database yet: Diamex LED-Player-ME (the LED-Player-M's
  successor), Falcon F48V4/V5, Kulp K16/K32 Pro/Max.
- FYI, slug renames: `microboards/teensy-2-0` → `teensy-plus-plus-2-0` and
  `raspberry-pi-3-model-b` → `raspberry-pi-3-model-b-plus` (8b59374); the old
  slugs now hold the real Teensy 2.0 and Pi 3 Model B (387602d). Three
  `related` refs that meant the B+ follow it (10fc268); the rest mean the Pi
  3 family and stay.

## Hand-offs from the database review (streams 3, 4, 5, 6)

Found while verifying other streams' reports; each has its source and quote
in the named file under [plans/database-review-fixes/](plans/database-review-fixes/).

- Stream 4 (links, aliases, sources):
  - `microboards/ebyte-nrf-52840`: renamed to its module, E73-2G4M08S1C; an
    alias "Ebyte nRF52840" keeps the old name findable
    (microboards-decoders.yaml).
  - `microboards/orange-pi-lts`: its only alias now equals its name
    (microboards-decoders.yaml).
  - `pixel-decoders/led-strip-driver-module`: diymore's P9813 board;
    `inputs.protocols: [P9813]` and a `uses` link to `pixel-ics/p9813`
    (microboards-decoders.yaml).
  - `pixel-decoders/ws2811-mosfetdriver`: `sources.outputs.count.url` drops
    "-output" from the product slug (stream5-boards.yaml).
  - `pixels/ws2816`: WorldSemi now lists the WS2916 series where the WS2816
    was (pixels.yaml).
  - `controllers/electromage-8x-driver`: `outputs.connector` "Solder/3 pin
    servo"; the maker documents 5 mm screw terminals or 0.1" headers
    (adapters-commercial.yaml).
  - Makers: only Advatek says Power MOS Microelectronics (`pixel-ics/p9883`)
    is the former DMS Microelectronics (`pixel-ics/p9813`); every maker
    document says DMS. A maker alias in `app/lib/relations.ts` would put both
    under one "More from" row (issues-final.yaml).
- Stream 3 (designer): **done 2026-11-20.** 12 V "series" pixels run R, G
  and B on one current, so a pixel draws its channel current once, not
  three times (CS8812: "It is RGB LED series structure ... the LED constant
  current is 18mA"; stream5-parts.yaml: cs8812, gs8208, ws2815). The
  designer no longer puts a WS2815 at 0.36 W. No flag was needed: a part
  counts as series when the maker's whole-pixel `wattage` is about one
  channel's `channel_current` x `led_voltage` on a rail of 9 V or more
  (six parts today: cs8812, gs8208, hd8808, lc8808b, tx1818, ws2815).
  `sk6813-hv`, `ws2815-rgbw` and `ws2851` record no maker power, so they
  are still budgeted as parallel channels, two to three times high if they
  are series parts too; recording `electrical.wattage` settles each one.
- Stream 5 (datasheets, images):
  - `pixels/apa102`: its image's source page (Adafruit 2343) now sells the
    SK9822; `datasheet.third_party_testing` links APA's page for another
    part (cpldcpu's APA102 measurements fit) (pixels.yaml, stream5-parts.yaml).
  - `pixels/sk6818`: `datasheet.url` is a strip's one-page spec sheet, not
    the part's (pixels.yaml).
- Stream 6 (prices, statuses, product links):
  - Pattern-driver pricing: MADRIX 5's tiers, TouchDesigner's
    non-commercial limits, ELM's and Smode's demos, Smode's license, QLC+'s
    Raspberry Pi contribution (EUR 20), artnet_led_mapper's tiers, LEDs
    Master's "FOSS" (no license file) (software.yaml).
  - ElectroMage's two expanders are sold out at the maker; the passes used
    different rules for that (adapters-commercial.yaml).
  - `microboards/esp-01` and `esp-32s`: Ai-Thinker pages for `creator.page`
    (microboards-decoders.yaml).
  - `diffusive-materials/rosco-diffusion` and `lumieo-2`: product links that
    redirect elsewhere; Pi Hat's dead Microcyb page (stream5-parts.yaml,
    stream5-boards.yaml).

## Pattern drivers' pricing fields are still free text (stream 6, recommendation)

Database review (stream 2) typed the pattern drivers' I/O, visualizer and
language but left `pricing` alone: prices are stream 6's. What's loose now
(2026-11-18 census):

- `pricing.demo.available` mixes booleans with prose ("Demo", "Free",
  "Limited Demo", "30 day trial", "Watermarked demo", "<1000 LEDs free,
  various paid options", "Open Source", "w/PixelBlaze purchase", "€15
  Donation requested"). Suggested shape: `demo.kind`: `free` / `trial` /
  `limited` / `none` (plus `demo.limitations` text, which exists), with
  "Open Source" moving to `license` and donations to `license_type`.
- `pricing.license_type` is prose on 2 of 5 rows ("Free for small projects;
  larger commercial projects need a license"). Suggested enum: `free`,
  `perpetual`, `subscription`, `donationware`, `freemium`, with the prose in
  notes.
- `pricing.price` is a string on free rows ("Free", "Free - $399"): the
  tiers already carry the numbers.

Why it matters: "free to try?" and "subscription or perpetual?" are the
questions people filter software on, and the sheet couldn't answer them.

## Designer intro: a link told from its sentence only by color (stream 3)

Found by browse UX's accessibility audit (axe, rule `link-in-text-block`,
serious), light and dark: on `/designer`, the "system overview" link in
`.designer-intro` is blue on grey text with no underline, 1.04:1 against the
words around it (3:1 is the minimum when color is the only cue). An underline
fixes it. `e2e/a11y.test.ts` covers the rest of the site and leaves the
designer out for this reason; add `/designer` to its `PAGES` once this is in.
