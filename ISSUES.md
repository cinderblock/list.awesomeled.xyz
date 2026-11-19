# Issues

Side issues found while working on something else, plus cross-workstream
coordination notes. Each entry: what was seen, why it matters. Claim an entry
(`in progress — <thread/branch>`) before working on it; remove it or mark it
fixed with the commit hash when done. Workstreams: see
[plans/website-buildout.md](plans/website-buildout.md).

## Same product in two categories

**in progress — database review (stream 2, `ws/database-review`)**: keep/merge
calls and the merges, recorded in [plans/database-review.md](plans/database-review.md)
with the sheet row each removed entry came from (for the parity audit).

Seen by cross-links (stream 4). These entries describe one product twice:

- `adapters/quinled-dig-quad` and `controllers/quinled-dig-quad`
- `adapters/quinled-dig-uno` and `controllers/quinled-dig-uno`
- `adapters/espartstick` and `controllers/espartstick`
- `adapters/m4-port-pixel` and `controllers/m4-port-pixel` (and `controllers/m4-pi`: Microcyb M4-PI, a third copy)
- `adapters/m8-port-pixel` and `controllers/m8-port-pixel`
- `controllers/standard-differential-receiver` and `level-converters/standard-differential-receiver`
- `diffusive-materials/silicone-sealant` carries Plastazote LD45 foam data (link, XLPE, sizes), duplicating `diffusive-materials/ld45-plaztazote`

Why it matters: specs drift apart, and compatibility links and filters show the
product twice. Needs a keep/merge call (parity or standardization stream).
Cross-links leaves these pairs unlinked until that's decided. (Hardware vs.
firmware twins such as `adapters/espixelstick` vs.
`drive-libraries/espixelstick`, or `pattern-drivers/wled` vs.
`drive-libraries/wled`, are distinct things and get linked.)

## Coordination: link fields belong to cross-links (stream 4)

Stream 4 is researching and filling these fields across the database
([plans/cross-links.md](plans/cross-links.md)): controllers'
`outputs.protocols`, `software.firmware` / `works_with`,
`inputs.requires_host`, `outputs.driver.IC` and the free-text
`outputs.connector` values; drive libraries' `supported_ics` (being split
from control protocols) and the legacy `related_*` arrays (being retired);
every entry's `related`, `aliases` and `sources`; pixels' and pixel ICs'
`data.type` protocol families. Please don't batch-edit those; log findings
here instead. Spelling variants ("APA-106" vs "APA106", "WS2812b") don't need
rewriting: `app/lib/relations.ts` matches names case- and
punctuation-insensitively, through `aliases` and `variants[].name`.

## Entry-page and table changes from cross-links (stream 7, FYI)

Entry pages now have a "Works with" section (driven by, supported by, runs on,
host for, used in, same protocol) and a "Related products" section, both from
`app/components/ui/EntryLinks.tsx`; they replaced the old "Related Products",
`related_*` and "Used by …" sections. Name-list fields render as link pills in
their card, and `sources` provenance renders under the field it documents.
Stream 4 also added compatibility columns through `app/lib/columns.tsx` only
(no `DataTable` / `ColumnFilter` internals): controllers and adapters get
"Pixel ICs" (filter `linked.pixels`, which matches same-protocol parts and
firmware-supported ones, e.g. `/controllers?f=linked.pixels:WS2815`); pixels
and pixel ICs get "Hardware" and "Libraries" counts; pattern drivers and
drive libraries "Hardware"; connectors "Used by"; microboards "Add-ons". The
values come from `entry.linked`, derived at load time in `relations.ts`.
Shout here if that collides with the browse-UX work.

## Schema changes from database review (stream 2, FYI)

Validation (`bun run validate`, now also in CI) rejects the old shapes, so a
rebased branch with entries in them fails until they're converted. Each
migration in `scripts/migrations/` is re-runnable (no-op on migrated data).
Plan and field-by-field detail: [plans/database-review.md](plans/database-review.md).

- **Packages**: pixels' and pixel ICs' `physical.package_size` /
  `package_sizes` → one `physical.packages` array (`SOP-8`, `QFN-16`, `5050`,
  `5mm`; common.json `ic_package` / `led_package`). Pixel ICs lost `pin_count`
  (the package names carry it).
- **Shared shapes**: controllers' `outputs` / `power` now live in common.json
  (`pixel_outputs`, `power_input`), with `clocked_support`, `output_connector`
  and `diy_or_ots`. `outputs.clocked: true` is no longer accepted (use
  `always` or `selectable`).
- **Pixel decoders**: `outputs.{count, types, connector}` replace
  `max_channels` / `pixel_types` / `connectors` / `description`; the old
  free-text description moved into `notes`. For cross-links (stream 4): that
  migration mapped four connector strings to refs (`mtsb-combicon` for
  controller-changeover, pixel-2-things-servo and PixFog; `xlr-3` for Pixel 2
  DMX), following the controllers precedent. Adapters' connector strings will
  be carried over as strings only, and `parent` is left untouched for your
  host-board links.
- **Next** (not landed yet): adapters' outputs/power adopt the shared shapes
  (`pixel_types` → `outputs.clocked`); diffusive materials' `material_type` →
  `materials` list and boolean `flexible`.

## Price tiers: SKU squeezed into a vertical letter stack

On narrow entry-page cards the price-tier SKU column wraps one character per
line (seen on `/pixel-ics/ws2811`: "W S 2 8 11" beside each tier price).
Repro: open any pixel IC with `price` tiers + `sku` at a 1600 px wide window.
Probably a flex/grid min-width issue in the price-tier renderer. For prices
(stream 6) or browse UX (stream 7).

## Table: header tips are hover-only; "+N" pill click filters on "+N" (stream 7)

Seen by stream 4 while adding columns. `Column.headerTip` renders as a hover
tooltip on the header label (`DataTable.tsx`), so touch users never see it;
the column popover (tap) could show the same text. Separately,
`handleBadgeClick` toggles a filter on any `.badge` in a cell, and the
overflow pill from `renderBadgeArray` ("+3", class `badge`) is one: clicking
it filters the column on the literal "+3", which matches nothing.

## Sheet's Controllers "Interface" column is scrambled — don't restore from it

**in progress — database review (stream 2, `ws/database-review`)**: verifying
every controller's `inputs` against vendor docs.

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

## Prices that disagree with the maker (stream 6)

Seen while verifying links (not changed; prices are stream 6's):

- `controllers/spi-led-controller`: one 1024-pixel model at EUR 170 ex VAT,
  not the 1024/2048/4096 tiers.
  <https://www.ledstripstudio.com/shop/product/spi-led-controller/>
- `pattern-drivers/protopixel-create`: EUR 149 per month subscription
  (YAML 176). <http://web.archive.org/web/20200808024716/https://www.protopixel.io/pricing>

## Sheet: a second "M8 Port Pixel" row is an ENTTEC product

For parity (stream 1). The Controllers tab has two "M8 Port Pixel" rows. One
is Microcyb's Pi HAT ($45, now `controllers/m8-port-pixel`, M8-PI). The other
says ENTTEC, $400, 2 outputs, 60 V, discontinued, and links
<https://www.enttec.com/product/din/led-pixel-control-din-rail/din-rail-led-pixel-controller/>:
an ENTTEC DIN-rail pixel controller under the wrong name. No database entry
seems to cover it; needs identifying from that URL (Wayback if dead).

## Header is wider than a phone: every page scrolls sideways (stream 7)

Seen by the designer's phone test (stream 3) after the header search landed.
At a 390 px viewport `.site-nav` ends at x = 399, so `document.documentElement`
is 399 px wide on every page (`/controllers` too, not just `/designer`).
Repro: any page at 390 × 844, then
`document.documentElement.scrollWidth - document.documentElement.clientWidth`
is 9. The logo, the search icon and the four nav items don't fit together.

Why it matters: the whole site slides sideways under a thumb on phones. The
designer's own test now checks only the designer's content, so this needs its
own fix and test in the header.

## Pixels' `electrical.wattage` is one channel's power, not the pixel's (stream 2)

Found by the designer (stream 3). The schema describes `wattage` as "Power
per pixel", but the stored values are `channel_current × led_voltage` for a
single colour channel: WS2812 18.5 mA × 5 V = 92.5 mW, APA102 22 mA × 5 V =
110 mW (a WS2812 at full white draws about three times that). The ratio is
1.00 on 15 of the 21 rows that have both fields. Rows that don't follow the
pattern: `lc8808b`, `ns8808` and `ws2851` (computed at 5 V although
`led_voltage` is 12 V), `sk6805` (100 mW with a ~5 mA channel), `ns108`,
`ns108e` and `sk6812` (off by 2–4%).

Why it matters: the old designer multiplied this field by the pixel count and
under-reported power about 3× (fixed: it now uses channel current × channels
× voltage and never reads `wattage` as a per-pixel figure). The entry pages
and the Pixels table still show it as the pixel's wattage. Either the field
means "per channel" and should say so, or the values should become true
full-white figures. Not changed here: the data is stream 2's.

## Designer facts that depend on unrecorded data (FYI, streams 2 / 4 / 6)

Not bugs — where the designer says "verify" because the database is silent.
Filling any of these makes its checks sharper with no code change:

- `outputs.driver.buffered` is unrecorded on about a third of controllers, so
  the designer can't say whether they need a level shifter. Dev boards without
  `power.gpio_voltage` (Teensy 4.x, ESP32-S3 boards, Arduino Mega) are in the
  same position.
- `inputs.protocols` is missing on about half of the controllers, which makes
  every pattern source "verify" for them.
- Connectors have no prices, so every parts list with a connector is
  incomplete.
- Level converters record no logic-family facts (push-pull buffer vs.
  auto-direction translator, output drive). The designer offers them all
  alike; the usual advice (a 74AHCT/74HCT buffer, not a TXS-style translator)
  isn't in the data.
- Adapters still use `parent` free text and `outputs.max_channels` /
  `pixel_types`. Once they adopt the shared `pixel_outputs` shape and
  `host` links (stream 2 "Next", stream 4), the designer can offer shields
  for dev boards.

## Suspected data errors seen while sourcing images & datasheets (stream 5)

Not fixed by stream 5 (facts belong to streams 2 and 6). Each was noticed on
the maker's own page or datasheet; the per-entry research notes with source
URLs are in [plans/assets-research/](plans/assets-research/).

- **Pixel ICs** ([pixel-ics.md](plans/assets-research/pixel-ics.md)):
  p9813's datasheet names DMS Microelectronics, not WorldSemi; UCS-series
  datasheets point to UCS (szucs.cn), not Normand; GS82xx datasheets say
  Genesis Systech, not "Shenzhen Greesit"; sm16511 is a 3-channel DMX512 SOP8
  per its maker (entry: 4 channels, SOP10/16); ucs2904's `other_links` text
  names SM16704; ws2814's price SKU is the WS2814F; qed3001's specs duplicate
  tls3001's.
- **Pixels** ([pixels.md](plans/assets-research/pixels.md)): Adafruit
  product 2343 (apa102's image source) is now titled "[SK9822]"; ns108e and
  sk9826 `dead_links` mark PDFs that load today; sk9822-a's creator is probably
  Normand, not Newstar; ws2816's 5-bit brightness claim isn't in WorldSemi's
  datasheets; pl9823's datasheet names BaiCheng (entry creator "/");
  lc2823-2020 and sm1616 couldn't be identified at all.
- **Microboards** ([microboards.md](plans/assets-research/microboards.md)):
  esp-01 and nodemcu-v2 list Bluetooth 4.1 (ESP8266 has none); t-eth-lite
  lists an LX6 core / BT 4.1 / classic-ESP32 outputs for an ESP32-S3 board and
  `flash: microSD`; Orange Pi Zero LTS and PC Plus claim 5 GHz Wi-Fi (2.4 GHz
  only); PC Plus has 8 GB eMMC, not microSD; ttgo-esp32-poe needs an external
  programmer (entry: USB serial); orange-pi-lts isn't a product name (specs
  match the Zero LTS, which is H3, entry says H2+); esp-32s is ambiguous
  (module vs dev board).
- **Connectors** ([connectors.md](plans/assets-research/connectors.md)): ph's
  notes describe XH; sh says `rows: 2`, `max_pins: 25`; df62w and teeplug have
  their wire-gauge limits swapped; xt60-90 and mt30-60 say `creator: Generic`
  (Amass originated them) and their ratings differ from Amass's specs;
  "MTSB" → "MSTB", "Bucaneer" → "Buccaneer".
- **Adapters** ([adapters.md](plans/assets-research/adapters.md)):
  `max_channels` looks wrong on espartstick(-wled) 6, espixelstick 4,
  quinled-dig-uno 6; pipixel and led-octopus have `creator: Tindie` (makers:
  Maniacal Labs, Essence Engineering); pi-hat has `links.product: Multiple`,
  `parent: Yes`; rasppi-isolated-dmx's linked BitWizard board isn't called
  isolated; rpi-28d is superseded by the rPi-28D+.
- **Controllers** ([controllers-a.md](plans/assets-research/controllers-a.md),
  [controllers-b.md](plans/assets-research/controllers-b.md)): radios listed
  that the maker pages don't show — blink-tape-controller (Bluetooth),
  dmx-to-led-strip (Bluetooth, audio), apd-2-500-12v-art and
  deskontroller-lite-v3-192 (Wi-Fi); Ethernet/Art-Net listed on DMX-only units
  (din-pixie, flex-pixel-driver) and on lightbox, lightboard-mini, luminaxa,
  nled-pixel-controller-mini; falcon-f4v3's specs look copied from the F48;
  falcon-f48 is discontinued per its maker; led-player-m has 8 channels;
  lightkraken shows 2 outputs; pb16 is a PocketBeagle cape (entry: BeagleBone
  Black); ledmx4-pro's photo is the 5 V unit (entry: 24 V max); LEC Powered and
  orange-pro-plus-32 look discontinued
  ([controllers-c.md](plans/assets-research/controllers-c.md)): pixnet-4 has
  4 outputs (8 only expanded); pixpoe and spi-matrix pages mention no Wi-Fi;
  protopixel-8-channel's USB is power only (input is Ethernet);
  uli-led-control takes 7–24 V; uls-stripe's output has a Clock pin (entry:
  not clocked); replay has JST outputs and no Ethernet per its manual;
  sp102e is an IR-remote controller; qolorpix and spinode pages are live
  (status could be `active`); pixout-server's pixel outputs don't match any
  Pixout hardware.
- **Level converters / pixel decoders**
  ([converters-decoders.md](plans/assets-research/converters-decoders.md)):
  ws2811-mosfetdriver links Freetronics' single-MOSFET FREENFET but says 3
  channels (FREENFET3 is the triple); pixel-2-things-relay is the Pixel2AC
  triac dimmer; pixel2things.com now redirects to Experience Lights;
  pixfog has no product link (live page:
  innotronix.net/PixFog-Pixel-Based-Fog-Controller-p232730399, $39.99 vs
  $33); 74hct244 has a stray `interface: PDIP largest`.
- **Commercial systems / diffusive materials**
  ([systems-diffusers.md](plans/assets-research/systems-diffusers.md)):
  active-rgb is sold as RGBW now; smartpxl is an ENTTEC line (creator);
  vinci's `creator` is a URL (Lucenti); silicone-sealant carries Plastazote
  foam data (also listed under "Same product in two categories"); ALP no
  longer lists "Lumieo II"; rosco-diffusion redirects to Rosco's myColor app;
  the Plexiglas shop link redirects to polyvantis-shop.com; "Plaztazote" and
  "polyethelene" are misspelled.

## e2e: "missing values sort last in both directions" fails on master

`e2e/table.test.ts:63` (`/controllers?sort=price.`) fails in master's CI
(run 44444691531, 2026-11-18 ~6:37 PM PST) and locally: a blank price lands
before a priced row in descending order. Blocks every deploy (the deploy job
needs the test job). Seen by stream 5 while verifying; not investigated —
owner is the table (stream 7) or price data (stream 6).
