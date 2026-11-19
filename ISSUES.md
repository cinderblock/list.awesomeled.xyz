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
- `adapters/espartstick` and `controllers/espartstick` (note, stream 4: two different boards, the 2019 shield without SD and the SD-card edition; `2a3efbf` merged the real twin, `adapters/espartstick-wled`)
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

## Sheet: a second "M8 Port Pixel" row is an ENTTEC product

For parity (stream 1). The Controllers tab has two "M8 Port Pixel" rows. One
is Microcyb's Pi HAT ($45, now `controllers/m8-port-pixel`, M8-PI). The other
says ENTTEC, $400, 2 outputs, 60 V, discontinued, and links
<https://www.enttec.com/product/din/led-pixel-control-din-rail/din-rail-led-pixel-controller/>:
an ENTTEC DIN-rail pixel controller under the wrong name. No database entry
seems to cover it; needs identifying from that URL (Wayback if dead).

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
- Connectors: 34 of 45 families now carry a representative-SKU price
  (2026-11-18); binder-720, chogori, eventcon, hirschmann-ca, ld16-20-28,
  socapex, sp13, sp17, teeplug, wago-221 and wieland-rst still have none.
- Level converters: done for the eight active parts (stream 3, 2026-11-18).
  `electrical.input_high_voltage` (+ `_notes`) is a new optional field: the
  datasheet's VIH min in the 3.3 V → 5 V role; `io.buffered` says whether the
  output is a push-pull driver. Both carry `sources` quotes. The designer
  flags 74HC245 (3.5 V threshold) and TXS0108E (pull-up outputs) from them. A
  new converter entry without the two facts is simply offered unjudged.
- Adapters: the designer offers an adapter once it has `outputs.count` and a
  `host` link to a /microboards entry (14 of 40 today). Still missing a
  host link although `parent` names a board: the Wemos D1 Mini shields
  (4x-led-mini-shield, 6x-led-shield, 6x-smd-led-shield, espartstick,
  wemos-esp32-driver-board, wled-wemos-shield), 16x-led-shield (NodeMCU
  ESP32), 8x-led-shield (Adafruit Feather), esp-level-shifter (ESP-01),
  pipixel and pixel-string-pihat-zero (Raspberry Pi), orange-pi-dmx. Several
  of those boards have no /microboards entry yet (Wemos D1 Mini, a
  Feather). `outputs.driver.buffered` is recorded on one adapter only: an
  adapter whose `related` has `uses: level-converters/…` counts as buffered,
  the rest say nothing about level shifting.
- `adapters/pocketscroller-v2` has `outputs.count: 6` with
  `protocols: [HUB75]`: panel outputs, not pixel strings. The designer
  offers it and says the pixel isn't among its listed protocols; a field
  that separates panel outputs from pixel outputs would let it leave such
  boards out.

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

- **Pattern drivers**
  ([pattern-drivers.md](plans/assets-research/pattern-drivers.md)):
  geopix.io now belongs to a gambling site (link should be
  github.com/EnviralDesign/GeoPix); Jinx! is by Live-LEDs.de, not
  Solderlab.de, and its URL is a third-party Glediator download;
  arthet-led-mapper is `artnet_led_mapper` (github.com/cyberboy666) with no
  URL; protopixel-create looks discontinued; mapio-pro's creator is probably
  Visution; elm's `status: unknown` is stale (ELM 2026 ships); wled's URL
  redirects to wled/WLED; chataigne-wled-mod links the author's profile.

## Connector and diffuser spec corrections (stream 2 or 6)

Found by cross-links research (stream 4) with the maker's datasheet or page
quoted; not applied because they're spec values, not links. Verify and apply:

- `connectors/9159` `mechanical.pitch`: "3.0 mm" → "2.0 mm" <https://datasheets.kyocera-avx.com/StandardCardEdge_00-9159.pdf>
- `connectors/9159` `mechanical.max_pins`: 6 → 5 <https://datasheets.kyocera-avx.com/StandardCardEdge_00-9159.pdf>
- `connectors/9159` `ratings.max_current`: "5 A" → "3 A" <https://datasheets.kyocera-avx.com/StandardCardEdge_00-9159.pdf>
- `connectors/9159` `ratings.max_voltage`: "125 V" → "300 V AC" <https://datasheets.kyocera-avx.com/StandardCardEdge_00-9159.pdf>
- `connectors/cee-form` `ratings.max_current`: "16 A" → "125 A (family: 16/32/63/125 A)" <https://www.epanorama.net/blog/2021/08/19/ceeform-connectors/>
- `connectors/df62w` `termination.smallest_gauge`: "20 AWG" → "26 AWG" <https://www.digikey.ca/en/product-highlight/h/hirose/df62w-series-connectors>
- `connectors/df62w` `termination.largest_gauge`: "26 AWG" → "20 AWG" <https://www.digikey.ca/en/product-highlight/h/hirose/df62w-series-connectors>
- `connectors/dupont` `termination.largest_gauge`: "24 AWG" → "22 AWG" <https://www.mattmillman.com/info/crimpconnectors/dupont-and-dupont-connectors/>
- `connectors/gx-16` `ratings.max_voltage`: "100 V" → "400 V" <https://www.renhotecpro.com/gx16-connector-data-sheet/>
- `connectors/gx-16` `ratings.max_current`: "7 A" → "10 A" <https://www.renhotecpro.com/gx16-connector-data-sheet/>
- `connectors/ic5-ec5` `creator`: "Spektrum" → "Spektrum (IC5) / E-flite (EC5), both Horizon Hobby brands" <https://www.horizonhobby.com/product/connector-ec5-battery-2/EFLAEC502.html>
- `connectors/mate-n-lok` `mechanical.pitch`: "5.08 mm" → "6.35 mm" <https://www.te.com/usa-en/products/brands/mate-n-lok.html?tab=pgp-story>
- `connectors/mate-n-lok` `mechanical.max_pins`: 10 → 15 <https://www.te.com/usa-en/products/brands/mate-n-lok.html?tab=pgp-story>
- `connectors/mini-fit-jr` `mechanical.max_pins`: 16 → 24 <https://www.digikey.ca/en/product-highlight/m/molex/mini-fit-jr-connectors>
- `connectors/mt30-60` `ratings.max_current`: "60 A" → "35 A (MT60, 12 AWG); MT30 20 A (16 AWG)" <https://www.china-amass.net/mt60-m-product/>
- `connectors/mt30-60` `ratings.max_voltage`: "60 V" → "80 V DC" <https://www.china-amass.net/mt60-m-product/>
- `connectors/mtsb-combicon` `termination.smallest_gauge`: "20 AWG" → "24 AWG" <https://novapart.co/products/1757022/pluggable-terminal-block-508-mm-3-ways-24-awg-12>
- `connectors/mtsb-combicon` `termination.largest_gauge`: "10 AWG" → "12 AWG" <https://novapart.co/products/1757022/pluggable-terminal-block-508-mm-3-ways-24-awg-12>
- `connectors/ph` `notes`: "...2.5mm not 2.54 (1/10\") pitch runs off on boards drilled for 2.54" → "JST PH pitch is 2.0 mm" <https://www.jst-mfg.com/product/detail_e.php?series=199>
- `connectors/ph` `termination.smallest_gauge`: "24 AWG" → "32 AWG" <https://www.jst-mfg.com/product/detail_e.php?series=199>
- `connectors/ph` `mechanical.locking`: "Detent" → "Friction" <https://www.jst-mfg.com/product/detail_e.php?series=199>
- `connectors/powerpole-15-45` `termination.largest_gauge`: "6 AWG" → "10 AWG" <https://www.andersonpower.com/?p=301>
- `connectors/sh` `mechanical.rows`: 2 → 1 <https://www.jst-mfg.com/product/detail_e.php?series=231>
- `connectors/sh` `mechanical.max_pins`: 25 → 20 <https://www.jst-mfg.com/product/detail_e.php?series=231>
- `connectors/sh` `termination.smallest_gauge`: "30 AWG" → "32 AWG" <https://www.jst-mfg.com/product/detail_e.php?series=231>
- `connectors/sh` `mechanical.locking`: "Latching" → "Friction" <https://www.jst-mfg.com/product/detail_e.php?series=231>
- `connectors/sh` `mechanical.wire_to_wire`: true → false <https://www.jst-mfg.com/product/detail_e.php?series=231>
- `connectors/sm` `mechanical.rows`: 1 → "1-2" <https://www.jst-mfg.com/product/detail_e.php?series=238>
- `connectors/sp13` `ratings.max_current`: "5 A" → "13 A" <https://www.weipuconnector.com/sp13-series/>
- `connectors/sp17` `links.product`: "https://weipuconnector.com/product/38" → "https://www.weipuconnector.com/sp17-series/" <https://www.weipuconnector.com/sp17-series/>
- `connectors/sp17` `ratings.max_current`: "10 A" → "50 A" <https://www.weipuconnector.com/sp17-series/>
- `connectors/sp17` `mechanical.min_pins`: 2 → 1 <https://www.weipuconnector.com/sp17-series/>
- `connectors/superseal` `mechanical.max_pins`: 8 → 6 <https://www.te.com/en/products/connectors/automotive-connectors/intersection/amp-superseal-1-5.html>
- `connectors/superseal` `ratings.ip_rating`: "IP68" → "IP67" <https://www.te.com/en/products/connectors/automotive-connectors/intersection/amp-superseal-1-5.html>
- `connectors/teeplug` `termination.largest_gauge`: "16 AWG" → "4 mm² (about 12 AWG)" <https://www.hylec-apl.com/Weatherproof-Waterproof-Connectors-Range/TeePlug-and-Sockets/THB_387_C4A.html>
- `connectors/teeplug` `termination.smallest_gauge`: "6 AWG" → null <https://www.hylec-apl.com/Weatherproof-Waterproof-Connectors-Range/TeePlug-and-Sockets/THB_387_C4A.html>
- `connectors/wago-221` `termination.smallest_gauge`: "28 AWG" → "24 AWG" <https://www.wago.com/us/products/electrical-interconnect/discover-wire-and-splicing-connectors/221-series-levernuts>
- `connectors/wieland-rst` `ratings.max_current`: "16 A" → "32 A" <https://www.wieland-electric.com/en/products/electrical-installation/connection-systems-high-protection-class/rst-classic/>
- `connectors/xh` `mechanical.locking`: "Latching" → "Friction" <https://www.jst.com/products/crimp-style-connectors-wire-to-board-type/xh-connector/>
- `connectors/xt60-90` `creator`: "Generic" → "Amass (Changzhou Amass Electronics)" <https://www.china-amass.net/about-us/>
- `connectors/xt60-90` `ratings.max_current`: "90 A" → "45 A (XT90PW-M); XT60-F 35 A at 12 AWG" <https://www.china-amass.net/uploads/XT90PW-M-SPEC.pdf>
- `connectors/xt60-90` `ratings.max_voltage`: "42 V" → "150 V DC (XT90PW-M); XT60-F 80 V DC" <https://www.china-amass.net/uploads/XT90PW-M-SPEC.pdf>
- `commercial-systems/smartpxl` `creator`: "SmartPXL" → "ENTTEC" <https://www.enttec.com/product/uncategorized/hi-res-smart-pxl-100x25-rgb-rgbw-led-pixel-dot-strings/>
- `diffusive-materials/3m-envision-diffuser` `material_type`: "polyester" → "vinyl (cast, PVC-free)" <https://www.3m.co.uk/3M/en_GB/p/d/b00024897/>
- `diffusive-materials/ld45-plaztazote` `name`: "LD45 Plaztazote" → "LD45 Plastazote" <https://www.zotefoams.com/product/azote/plastazote/>
- `diffusive-materials/lexan-dclw` `name`: "Lexan DCLW" → "LEXAN DLCW" <https://led-professional.com/products/led-optics/sabic-to-introduce-pioneering-lexantm-dlcw-light-diffusing-technology>
- `diffusive-materials/perspex-diffuse` `physical.sizes_available`: "up to 1220x2440" → "3050 x 2030 mm" <https://www.perspex.co.uk/materials/perspex-cast-acrylic/diffuse/>

## Spec errors seen during the price/status research pass (stream 2)

The data-freshness pass (stream 6, 2026-11-18) read every hardware/software
entry's vendor pages and noted, but did not edit, ~120 facts that disagree
with the maker. Each findings file ends with a "(d) Wrong facts" list, with
the source quoted in that entry's section:
[plans/data-freshness/findings/](plans/data-freshness/findings/). The
largest clusters:

- Controllers listing `Ethernet` / `Wi-Fi` / `USB` they don't have
  (ElectroMage 8x drivers, DIN Pixie, DigiLED micro player, Rocketlife
  Lightboard/Lightbox, NLed mini, Octo MK2, ULS Stripe, Flex Pixel Driver…)
- Wrong or placeholder creators (Tindie as creator on LED Octopus / PiPixel,
  `creator: /` on PL9823, "Color" on LC8808B, Vinci's creator is a URL,
  MadMapper, QLC+, Jinx, SmartPXL)
- Channel/output counts and voltage ranges (Falcon F4v3 4×1024 not
  48×340, MY9221 12 channels, SP901E 4 channels, QuinLED Dig-Octa 5–48 V)
- Datasheet links that point at the wrong part (TM1804 → TM1803 sheet,
  UCS8903 → DHgate listing, APA105 → a strip page, SK6818 → a Conrad strip)
- Possibly nonexistent parts (LC2823-2020, SM1616) and renamed ones
  (WS2816 → WS2916?, ProtoPixel Create → Mapping Tool)

Why it matters: these are the facts the tables filter on. Overlaps the
connector list above.

## Entry pages: datasheet `sources` and long URLs in narrow cards (stream 5 / 7)

Seen by cross-links (stream 4) on e.g. `/microboards/beaglebone-black` and
`/controllers/deskontroller-lite-v3-32` at 1280 px. A datasheet's alternate
hosts (`datasheet.sources`: `url` / `host` / `notes`, 53 entries) render as a
raw nested grid, and URLs there and in vendors' `page` break every few
characters down a third-width card (8 lines for one `raw.githubusercontent.com`
link). Why it matters: the datasheet card is the one people look for, and the
alternate links read as noise. Showing each link as its host name (the way
`sources` provenance does: "docs.beagleboard.org", "github.com") would fix
both; the datasheet card's design is stream 5's, the generic value rendering
stream 7's.

## Spec contradictions found while writing new entries (stream 2)

Found by cross-links (stream 4) research for the new pixel-IC and board
entries; not applied because they're existing spec values, not links:

- `pixel-ics/ws2818b`: `release_year` 2018, but the datasheet's revision
  log starts "V1.0 ... New ... 20170523"; `electrical.output_voltage` 12V,
  but V1.3 (2019-09-06) "Modify the RGB port withstand voltage and add 24V
  applications" <https://www.world-semi.com/web/userfiles/productfile/WS2818B_V1.5_EN.pdf>
- `pixel-ics/lpd8806`: `color.channel_bits` 8, but the LPD8803/LPD8806
  datasheet says "LPD8803 provides 7 bits of data" and "Color Resolution 7
  Bits" <https://cdn-shop.adafruit.com/datasheets/lpd8806+english.pdf>
- `microboards/nodemcu-v2`: `io.max_outputs` 2, but WLED's ESP8266
  multi-strip docs say "There is a maximum of 3 strips supported"
  <https://github.com/wled/WLED-Docs/blob/main/docs/features/multi-strip.md>
- `microboards/orange-pi-lts`: `compute.soc` H2+, but orangepi.org's
  Zero LTS page says "AllWinner H3"
  <http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-Zero-LTS.html>
  (CNX Software's 2019 article calls it H2+; needs a look at the board)
- Makers: `pixel-ics/p9883` says "Power MOS Microelectronics", formerly
  DMS Microelectronics, the creator on `pixel-ics/p9813`. If that's one
  company, one spelling (or a maker alias in `app/lib/relations.ts`) puts
  both under one "More from" row.
