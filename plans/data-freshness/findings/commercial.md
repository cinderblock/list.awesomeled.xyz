# Findings: commercial systems + diffusive-materials links (2026-11-18)

Slice: `database/commercial-systems/*.yaml` (18, full research) and the 7
`database/diffusive-materials` entries from the sweep file (links only).
All dates 2026-11-18 unless noted. FX for USD/pixel: EUR 1.097, GBP 1.317.
Every status line carries a `# src: url | date | note` comment per
status-evidence.md. Checks run: `bunx eslint --fix`, `bunx prettier --write`
(no changes needed), `bun run validate commercial-systems` (18/18) and
`bun run validate diffusive-materials` (45/45), all pass.

Fetching notes: Highlite (Anubis), Sweetwater/Full Compass/B&H (bot walls),
3M, Edmund Optics and LexJet block scripts. Highlite, 3M and Edmund were read
with headless Playwright; LexJet with WebFetch. The Wayback CDX API was
unreachable for most of the session (TLS alert / "Temporarily Offline").

## USD per pixel, all systems (input for the `$` scale)

| System                                      | Price point                 | Pixels | USD     | USD/pixel                    |
| ------------------------------------------- | --------------------------- | ------ | ------- | ---------------------------- |
| SmartShow RGB panel                         | £20 incl. VAT (sale £9.99)  | 169    | 26.34   | 0.156 (sale 0.078)           |
| SmartShow RGBW panel                        | £30 incl. VAT (sale £14.99) | 169    | 39.51   | 0.234 (sale 0.117)           |
| Twinkly Strings Multicolor 250              | $119.99                     | 250    | 119.99  | 0.480 (100: 0.75, 600: 0.40) |
| Lightwalls Starter kit (2020, archived)     | £550 ex VAT                 | 343    | 724.35  | 2.11 (incl. controller)      |
| Triklit Mini Trikliks Plus 25               | $124                        | 25     | 124.00  | 4.96                         |
| Triklit Triklits Plus 25                    | $190                        | 25     | 190.00  | 7.60                         |
| Lightwalls Matrix 5x5 RGBW 16-bit           | £286.67 incl. VAT           | 25     | 377.54  | 15.10 (ex VAT 12.59)         |
| SGM LB-100 7-ball string (unverified)       | €125                        | 7      | 137.13  | 19.59                        |
| Chauvet Festoon 2 RGB EXT                   | $419.99 MAP                 | 20     | 419.99  | 21.00                        |
| Color Kinetics Flex Compact gen3            | $1,054.92                   | 50     | 1054.92 | 21.10                        |
| Martin VC-Dot 1 (discontinued)              | $2,304 MSRP                 | 100    | 2304.00 | 23.04                        |
| Chauvet Festoon 2 RGB 3-string system       | $649.99 + 2 × $419.99       | 60     | 1489.97 | 24.83                        |
| Showtec Festoon Q4 String IP65              | €465 RRP ex VAT             | 20     | 510.10  | 25.51                        |
| Lucenti Vinci Ruby                          | €28                         | 1      | 30.72   | 30.72                        |
| Showtec Q4 controller + booster + 6 strings | €3,500                      | 120    | 3839.50 | 32.00                        |
| Chauvet Festoon 2 RGB kit                   | $649.99 MAP                 | 20     | 649.99  | 32.50                        |
| Showtec Q4 controller + 3 strings           | €1,980                      | 60     | 2172.06 | 36.20                        |
| Color Kinetics iColor Flex MX gen2          | $1,937.40                   | 50     | 1937.40 | 38.75                        |
| Lucenti Vinci Pearl v2                      | €95                         | 1      | 104.22  | 104.22 (old €120: 131.64)    |
| Astera NYX Bulb                             | $115.20                     | 1      | 115.20  | 115.20                       |
| Lumisphere Active RGBW                      | quote-only                  |        |         |                              |
| Glasson DFS3000                             | quote-only                  |        |         |                              |
| TMB Intelligent Marquee System              | quote-only                  |        |         |                              |
| LEDSnaps PACE                               | quote-only                  |        |         |                              |
| ENTTEC SMART PXL dots                       | quote-only                  |        |         |                              |
| Schnick-Schnack-Systems strip/tiles         | quote-only (dealer login)   |        |         |                              |

Existing `price_range` vs USD/pixel, for the scale discussion: Twinkly `$$`
(0.48), SmartShow (none), Triklit `$$$$` (5–7.6), Festoon 2 RGB `$$$`
(21–32.5), FestoonLight Q4 `$$$` (25.5–36), Lightwalls `$$$$$` (2.1–15),
LB-100 `$$$$$` (19.6), Vinci `$$$$$` (31–104), VC-Dot 1 `$$$$$$` (23),
Flex `$$$$$$` (21–39), Astera `$$$$$$` (115). `price_range` was not changed.

## Part A: commercial systems

### database/commercial-systems/active-rgb.yaml

- Changes: `status: active`; added `links.product`
  https://lumisphere.co.uk/product/large-harness-active-rgbw-festoon-systems/
- Evidence: page lists "Large Harness Active RGBW Festoon Systems ... The
  Lumisphere Active® System uses data-over-voltage technology to provide a
  DMX-controllable RGBW solution"; no price, "please contact us".
- Price: quote-only. Checked the product page, the 2026 brochure PDF (no
  prices) and a web search for dealers (none).
- Wrong facts: the product is **Active RGBW** (3 RGBW SMD LEDs, 1 W), not RGB
  (`name`, `color_type: RGB`). Encoder drives up to 127 units (site) / 100
  (brochure), entry says `pixels_per_run: 170`. Old domain
  lumisphere.pages.dev now redirects to lumisphere.co.uk.

### database/commercial-systems/astera-nyx.yaml

- Changes: `status: active`; `links.product`
  https://astera-led.com/products/nyx-bulb/; new example "NYX Bulb (1 pixel)"
  $115.20, source Film and Video Lighting (BarnDoor), part FP-5.
- Evidence: https://www.filmandvideolighting.com/astera-nyx-bulb-led-10w-rgba-mint-practical-lamp-fp5.html
  "SKU: FP-5 Availability: Backorder ... Our Price: $115.20 Price: $128.00".
  Light Trader (Shopify, SKU ASTFP5) also $115.20.
- Wrong facts: NYX Bulb is **RGBMA** (RGB + amber + mint, "RGBMA CRMX 10W"),
  not RGBW. One bulb = one pixel; `pixels_per_run: 170` doesn't describe it
  (wireless CRMX fixtures).

### database/commercial-systems/dfs3000.yaml

- Changes: `status: active`; `links.product`
  https://glassonelectronics.co.uk/dfs3000/
- Evidence: maker's page: "With thousands of installations around the world
  the UK manufactured DFS3000 RGB / RGBW LED lamp continues to be a most
  successful product." Site homepage currently returns 503 ("temporarily
  unavailable"); the /dfs3000/ page itself is 200 (site rebuilt on WordPress
  in 2025, title still "WordPress Install").
- Price: quote-only. Only other listing found is Visual Elements' hire
  catalogue (hire.vel.uk.com), no sale price.
- Wrong facts: Glasson's page lists RGB and RGBW only (no WW) vs
  `color_type: RGB/RGBW/WW`. Up to "170 RGB or 127 RGBW" per driver matches
  `pixels_per_run: 170`.

### database/commercial-systems/festoon-2-rgb.yaml

- Changes: `status: active`; `links.product`
  https://www.chauvetdj.com/products/festoon-2-rgb/; examples: kit
  (controller + 20 bulbs, 20 pixels) $649.99 and EXT string (20 pixels)
  $419.99, both SoundPro.
- Evidence: https://soundpro.com/products/chauvet-dj-festoon2rgb "Part
  Number: FESTOON2RGB Regular price $649.99 ... MSRP: $714.00 | MAP: $649.99";
  https://soundpro.com/products/chauvet-dj-festoon2rgbext "MSRP: $462.00 |
  MAP: $419.99". Chauvet page "What's Included: Festoon 2 RGB Controller, 20
  RGB bulbs, Extension cable (5 m)". No discontinued banner on Chauvet's page
  (older Festoon/Festoon VW pages do carry "Discontinued Since").
- Other dealer prices seen: AVNow $679.99, Chuck Levin's / Above AV $649.99,
  Empire Pro $504.
- Wrong facts: product is RGB only; `color_type: RGB W/WW` is wrong.
  Brand is CHAUVET DJ.

### database/commercial-systems/festoonlight-q4.yaml

- Changes: `status: active`; `links.product`
  https://www.highlite.com/en/41750-festoonlight-q4-controller.html;
  examples: Controller (41750) €585 RRP ex VAT, Festoon Q4 String IP65
  (41757, 20 pixels) €465 RRP ex VAT, both Highlite.
- Evidence (headless Playwright, Highlite blocks scripts): "Showtec
  Festoonlight Q4 Controller Including 10 m connection cable R.R.P. € 585.-
  ex VAT"; "Showtec Festoon Q4 String IP65 20 Pixels - 15 m R.R.P. € 465.- ex
  VAT". Highlite's discontinued filter shows the original "Festoonlight Q4
  String 20 Pixels, 15 m, Product code: 41751".
- UK retail seen: Simply Sound and Lighting 41751 string £316.50 (out of
  stock), controller £459.50.
- Note: the original string 41751 is discontinued, succeeded by 41757; the
  system as a whole is current.

### database/commercial-systems/flex.yaml

- Changes: `status: active`; `links.product`
  https://www.colorkinetics.com/global/flex; examples: Flex Compact gen3 RGB
  50 nodes $1,054.92 (Marvel Lighting, 101-000079-03), iColor Flex MX gen2 50
  nodes $1,937.40 (Superior Lighting, 101-000076-06).
- Evidence: Marvel Lighting page "50 Node Flex Compact Gen3, RGB, Cone Lens,
  12" Spacing, White by Color Kinetics $1, 054.92 ... Add to Cart ... Model
  Number : 101-000079-03"; Superior Lighting "SKU: 101-000076-06 ... $ 1,937 .
  40 ... Availability: Special order - Lead times vary." CK Flex page lists
  the current family as Flex Compact gen3, Flex Micro gen3, FlexElite.
- Not used: Wiedamark 101-000079-06 has $1,860.34 in its structured data but
  the visible page says "Request a quote ... quoting orders individually
  while we restock".
- Note: iColor Flex MX gen2 is not in CK's current Flex line-up text
  (probably superseded by Flex Compact gen3); didn't confirm on CK's
  discontinued list (JS-paged).

### database/commercial-systems/intelligent-marquee-system.yaml

- Changes: `status: active`; `links.product` https://tmb.com/ims/
- Evidence: TMB's IMS page is current (cut sheets, manuals, Universe Drive
  models, Hersheypark install video).
- Price: quote-only. PSSL's IMS listings (custom cable, PDSFESTOON) now 404;
  no other dealer price found.

### database/commercial-systems/lb-100.yaml

- Changes: `status: discontinued`; `links.product`
  https://sgmlight.com/products/entertainment/lb%C2%B7100 (canonical; it
  redirects to www.sgmlighting.com); example item renamed "7-ball string (7
  pixels)".
- Evidence: https://www.sgmlighting.com/products/discontinued/pixel-lights
  lists "LB·100 LED Balls" under Discontinued Products / Pixel lights. No
  successor named.
- Unresolved: the €125 7-ball price could not be re-verified: SGM publishes
  no prices (quote list only), 4Wall lists it for rental only, no dealer
  listing found. Left as-is with no `source`.

### database/commercial-systems/ledsnaps.yaml

- Changes: `status: active`; `links.product`
  https://ledsnaps.com/products/pace-system (the dynamic, music-reactive
  pixel system; LumiLine/QUE are static white/colour).
- Price: quote-only ("Have questions or need a quote? Email us"); the Odoo
  /shop requires login. Health Club Management feature has no price.

### database/commercial-systems/lightwalls.yaml

- Changes: `status: active`; `links.product` https://www.lightwalls.co.uk/;
  existing "Learning kit" example given an archived source and a clearer
  item ("Learning (Starter) kit, 3 × 29-pixel RGBW bars + 16×16 matrix (343
  pixels)"), `retrieved: '2020-10-30'` (capture date); new example "Matrix
  5x5 RGBW 16-bit tile (25 pixels)" £286.67 incl. VAT.
- Evidence: archived
  https://web.archive.org/web/20201030185350/https://www.lightwalls.co.uk/product/starter-kit-protopixel-and-lightwalls/
  "Starter Kit ProtoPixel and Lightwalls £ 550.00" (structured data
  `valueAddedTaxIncluded: false`, so "+VAT" is right); contents from the
  2020 "Learning Kits" post. Current store
  https://www.lightwalls.co.uk/products/matrix-5x5-rgbw-16bit "Regular price
  £286.67 GBP ... Taxes included."
- Note: the learning kits are no longer sold; the current store sells 16-bit
  RGBW light engines (Matrix 1x1 £43.33, 1x5 £60, 5x5 £286.67, Linear 1x10
  £127.93, Down Light £167.87).
- Wrong facts: notes ("associated with Protopixel.io, subscription based
  control") describe the 2020 business; current products are 16-bit RGBW
  constant-current light engines.

### database/commercial-systems/rgb-pixel-panel.yaml

- Changes: `status: active`; `links.product`
  https://smartshow.lighting/product/pixel-panels/; example re-confirmed £20
  (item "RGB Pixel Panel, 13×13 (169 pixels)"), source added.
- Evidence: WooCommerce variation data: RGB-Pixel-Panel regular £20, sale
  £9.99, "51 in stock"; structured data `valueAddedTaxIncluded: true`.
  Recorded the regular price, sale in notes.

### database/commercial-systems/rgbw-pixel-panel.yaml

- Changes: `status: active`; `links.product` (same page); example
  re-confirmed £30 (item "RGBW Pixel Panel, 13×13 (169 pixels)"), source
  added.
- Evidence: RGBW-Pixel-Panel regular £30, sale £14.99, "44 in stock", incl.
  VAT.

### database/commercial-systems/smartpxl.yaml

- Changes: `status: active`; `links.product`
  https://www.enttec.com/products/led-pixel-dot-lights/
- Evidence: ENTTEC SMART PXL 40 page is current; ordering is through
  "Pixel Designer ... then a sales engineer quotes it".
- Price: quote-only. Datasheets say contact sales@enttec.com; Wired4Signs
  lists the PXL series at $0.00 (quote). Only figure found is a 2020 ENTTEC
  article anecdote, not a price for these dots.
- Wrong facts: this is **ENTTEC's SMART PXL** line ("designed and made in
  Australia"), so `creator: SmartPXL` should be ENTTEC and the name is
  styled "SMART PXL".

### database/commercial-systems/strip-and-tiles.yaml

- Changes: `status: active`; `links.product`
  https://schnick.schnack.systems/en/products/
- Evidence: current product pages, e.g. LED-Strip C25-500 CUT MK4.1
  (article 102.2552, 20 RGB pixels per 500 mm) and LED-Tile C25-8-8 MK4.1.
- Price: quote-only: every product page has "PRICES LOGIN ... REQUEST LOGIN
  CREDENTIALS" (dealer login). Only public figure is a used 120-tile M12 set
  at €2,874 on stage-experts.com (used, not a list price).
- Wrong facts: creator is "Schnick-Schnack-Systems" (entry: "Schnick
  Schnack").

### database/commercial-systems/triklit.yaml

- Changes: `status: active`; `links.product`
  https://www.minleon.com/RGB-Triklit-Light-pl68458467.html; examples:
  Triklits Plus 25-bulb $190 (MN-RGB+TRIKLIT-25-12), Mini Trikliks Plus
  25-bulb $124 (MN-RGB+MiniTriklit-25-6), both Wiedamark.
- Evidence: Wiedamark variation data "25-bulbs / 12-4 ... MN-RGB+TRIKLIT-25-12
  190 ... 100 in stock"; description "sold in connectable 25, 20, 10 & 5 bulb
  sets ... Power Supply and controller purchased separately". Each node
  "can be individually controlled".
- Note: Wiedamark's Triklits category page is now
  https://www.wiedamark.com/pcat/ledrgbminleon/minleonrgbtriklits/ (the old
  minleonrgbtriklits.aspx URL redirects there). Minleon's own site lists the
  RGB Triklit range with no prices.
- Wrong facts: creator is **Minleon** (entry: "Minelon - Rainmin").

### database/commercial-systems/twinkly.yaml

- Changes: `status: active`; `links.product`
  https://twinkly.com/products/strings-multicolor; price **$105 → $119.99**
  (item "Strings Multicolor, 250 LEDs (250 pixels)", part TWS250STP-GUS).
- Evidence: Twinkly US Shopify data: "250 / Green / Type A
  sku=TWS250STP-GUS price=119.99 available=true"; 100 LEDs $74.99, 600 LEDs
  $239.99.

### database/commercial-systems/vc-dot-1.yaml

- Changes: `status: discontinued`; `links.product`
  https://www.martin.com/en-US/products/vc-dot-1; new example "VC-Dot 1 RGB
  string, 100 dots at 100 mm pitch (100 pixels)" $2,304 MSRP (Almo Pro A/V,
  90357060HU).
- Evidence: Martin page "VC-Dot 1 Discontinued Outdoor rated string-based LED
  dots"; ordering "VC-Dot 1™ RGB, 100 mm (4.0 in.) pitch, 100 pcs., 2 m (6.6
  ft.) lead-in: P/N 90357060HU". https://almoproav.com/p/90357060HU "$
  2,304.00 (MSRP) ... Notify me when in stock". No successor named by Martin.
- Other listings: LV Guitars $2,095, World of Stereo $2,073.60 (MSRP
  $2,304).
- Wrong facts: notes say "part of Harmon Kardon group"; Harman Kardon is
  HARMAN's consumer audio brand, Martin sat under HARMAN Professional
  (spelling "Harman"). Current ownership worth re-checking.

### database/commercial-systems/vinci.yaml

- Changes: `status: active`; `links.product`
  https://www.lucenti.lighting/collection/vinci; examples: Vinci Pearl v2
  €95 (1 pixel), Ruby €28 (1 pixel), both Lucenti, out of stock.
- Evidence: "Vinci Pearl v2 95.00 EUR ... This product is out of stock";
  "Ruby 28.00 EUR ... Each bulb has a unique DMX addressable ID. Combined
  with the Vinci controller, up to 128 bulbs on a single string". VAT
  treatment not stated on the site. Vinci Controller shows "0.00 EUR"
  (enquire).
- Unresolved: `online_pricing: RGB €120 per lamp` left in place: €120 can't
  be verified (no Wayback capture with a price; the original Pearl is in
  Prolight's discontinued catalogue). The current RGB+filament lamp, Pearl
  v2, is €95.
- Wrong facts: `creator` is a URL (https://www.lucenti.lighting/products);
  should be "Lucenti".

## Part B: diffusive-materials (links only)

### database/diffusive-materials/corrugated-split-loom-conduit-tubing-sleeving.yaml

- Sweep: DEAD (404). Link was a product photo JPG
  (`/images/gallery/white-wire-loom-perfoot.jpg`, last captured 2025-08-20).
- Change: moved → replaced with the product page for the same item,
  https://cabletiesandmore.ca/white-wire-loom-tubing-split ("White Wire Loom
  Tubing - Split by Kable Kontrol ... In stock").

### database/diffusive-materials/3m-envision-diffuser.yaml

- Sweep: CHECK (403). ok (blocked): Cloudflare blocks scripts; headless
  browser shows "3M™ Envision™ Diffuser Film 3735 | 3M United Kingdom".
  No change.

### database/diffusive-materials/diffraction-grating.yaml

- Sweep: CHECK (403). ok (blocked): headless browser shows "25,400
  Lines/Inch, 6" x 12" Sheets, 2/Pack, Holographic Diffraction Grating Film
  ... Stock #40-267 20+ In Stock". No change. URL carries a `gclid` tracking
  parameter (left as-is).

### database/diffusive-materials/plastic-glass-shards.yaml

- Sweep: CHECK (HTTP/2 error). Dead: the URL now returns a 200 closure page,
  "TJ Lighting has now ceased trading". Added `dead_links` (checked
  2026-11-18) with a note. No `archive`: the Wayback Machine has no capture
  of this product page (only 4 tjlighting.co.uk product URLs captured, none
  this one).

### database/diffusive-materials/poly-pro-pipe-thin-wall.yaml

- Sweep: CHECK (403). Moved: omega.co.uk/pptst/TYPP.html 301 →
  https://www.dwyeromega.com/en-gb/omegaflex-polypropylene-tubing/p/TYPP
  ("OMEGAFLEX Polypropylene Tubing", h1 TYPP). URL replaced.

### database/diffusive-materials/polyester-film.yaml

- Sweep: CHECK (403). ok (blocked): human-verification wall for scripts;
  WebFetch shows "HP Backlit Polyester Film, 60in x 100ft (SKU CR663B)
  ... $415.64 ... Add to cart". No change. URL carries ad-tracking
  parameters (left as-is).

### database/diffusive-materials/rosco-opti-sculpt.yaml

- Sweep: CHECK (timeout). ok: 200, "OPTI-SCULPT™ | Rosco". No change.

## (a) Files with price/status/related changes

- database/commercial-systems/active-rgb.yaml (status, link)
- database/commercial-systems/astera-nyx.yaml (status, link, new price)
- database/commercial-systems/dfs3000.yaml (status, link)
- database/commercial-systems/festoon-2-rgb.yaml (status, link, new prices)
- database/commercial-systems/festoonlight-q4.yaml (status, link, new prices)
- database/commercial-systems/flex.yaml (status, link, new prices)
- database/commercial-systems/intelligent-marquee-system.yaml (status, link)
- database/commercial-systems/lb-100.yaml (status discontinued, link, item text)
- database/commercial-systems/ledsnaps.yaml (status, link)
- database/commercial-systems/lightwalls.yaml (status, link, sourced old price, new price)
- database/commercial-systems/rgb-pixel-panel.yaml (status, link, price re-confirmed + source)
- database/commercial-systems/rgbw-pixel-panel.yaml (status, link, price re-confirmed + source)
- database/commercial-systems/smartpxl.yaml (status, link)
- database/commercial-systems/strip-and-tiles.yaml (status, link)
- database/commercial-systems/triklit.yaml (status, link, new prices)
- database/commercial-systems/twinkly.yaml (status, link, price $105 → $119.99)
- database/commercial-systems/vc-dot-1.yaml (status discontinued, link, new price)
- database/commercial-systems/vinci.yaml (status, link, new prices)

No `related` replacement items added: neither SGM (LB-100) nor Martin (VC-Dot

1. names a successor.

## (b) Files with only link changes

- database/diffusive-materials/corrugated-split-loom-conduit-tubing-sleeving.yaml (URL swap)
- database/diffusive-materials/poly-pro-pipe-thin-wall.yaml (URL swap)
- database/diffusive-materials/plastic-glass-shards.yaml (dead_links, no archive exists)

## (c) Unresolved

- Quote-only, no published price: active-rgb (Lumisphere), dfs3000 (Glasson),
  intelligent-marquee-system (TMB), ledsnaps, smartpxl (ENTTEC),
  strip-and-tiles (Schnick-Schnack-Systems, dealer login).
- lb-100: €125 7-ball price unverifiable (discontinued, SGM quote-only); left
  without `source`.
- vinci: `online_pricing: RGB €120 per lamp` left (unverifiable; current Pearl
  v2 is €95, now a sourced example).
- plastic-glass-shards: dead link has no Wayback capture, so no `archive`.
- diffraction-grating / polyester-film URLs carry `gclid`/ad tracking
  parameters (working, left as-is).
- Glasson's site homepage returns 503; DFS3000 page is up but the site looks
  mid-rebuild.

## (d) Wrong facts for other workstreams

- active-rgb: product is "Active RGBW" (RGBW), not RGB; encoder max 127
  (site) / 100 (brochure) units vs `pixels_per_run: 170`.
- astera-nyx: NYX Bulb is RGBMA, not RGBW; 1 pixel per bulb, `pixels_per_run:
170` doesn't fit.
- dfs3000: Glasson lists RGB and RGBW only, no WW (`color_type:
RGB/RGBW/WW`).
- festoon-2-rgb: RGB only (`color_type: RGB W/WW` wrong); brand is CHAUVET
  DJ.
- smartpxl: creator should be ENTTEC (SMART PXL line), not "SmartPXL".
- strip-and-tiles: creator is "Schnick-Schnack-Systems".
- triklit: creator is "Minleon" (typo "Minelon - Rainmin").
- vc-dot-1: notes "Harmon Kardon group" → HARMAN (Professional); verify
  current ownership.
- vinci: `creator` is a URL; should be "Lucenti".
- lightwalls: notes describe the 2020 ProtoPixel/subscription offering;
  current products are 16-bit RGBW light engines.
