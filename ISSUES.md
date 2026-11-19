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

## Designer: shared name resolver available (stream 3, FYI)

`app/lib/designer.ts` `checkCompat` decides "vendor lists this pixel" with a
substring token match between `outputs.protocols` and pixel names/types.
`app/lib/relations.ts` now resolves those names to exact entries
(`resolveName` against `graph.indexes.pixel`, aliases and variants included)
and exposes protocol families (`graph.familyOf` / `graph.families`, from
`data.type`). Switching would make the explicit-support check exact and let
"WS2811 listed" count for every WS2811/12-family pixel. Not a bug; the
designer's call.

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
