# Findings: controllers 8 / a–e (2026-11-18)

Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-data-freshness-bec94b8180ebeefa`
Slice: 33 files, `database/controllers/[0-9a-e]*.yaml`. 31 edited, 2 untouched (both eBay-only, see below). Nothing committed.

Checks after editing: `bunx eslint --fix database/controllers/[0-9a-e]*.yaml` (exit 0), `bunx prettier --write …` (no changes), `bun run validate controllers` (135/135 valid).

Every status line set or confirmed carries a `# src: <url> | 2026-11-18 | <note>` comment, and so does the one replacement item added (per `status-evidence.md`).

Helper scripts: the shared scratchpad `scripts/` (get, text, pw, cdx), plus `ctrla/ebay.mjs`, `ctrla/links.mjs`, `ctrla/html.mjs` and `ctrla/wb.mjs` (Wayback fetch with retries, because web.archive.org intermittently fails TLS with `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`). Raw pages are in `ctrla/pages`, `ctrla/pw`, `ctrla/wb` and `ctrla/bald`.

---

### database/controllers/8-port-led-distro.yaml

- **Changes:** price re-confirmed at **$65**, and `price_source` added. Status `active` confirmed.
- **Source:** https://www.tindie.com/products/bong69/8-port-led-distro. `data-price-info: base_price 40.00, display_price 65.00, promotions []`. Options: `ESP32 with internal antenna v4.1 12v-48v [312 in stock]` (alter_price 25.0), `v3.1 5v-24v [22 in stock]` (+15), `external antenna v3.1 [15 in stock]` (+17). $65 is the V4.1 board the entry describes.
- **Links:** Tindie ok. GitHub repo ok ("bobko69/8PortLEDDistro: WLED hardware for controlling 8 strings of pixels").

### database/controllers/a1-slwf-03.yaml

- **Changes:** price **16 → 15.99**, and `price_source` added. Status `active` confirmed.
- **Source:** https://www.tindie.com/products/smartlightme/a1-slwf-03-wled-esp32-controller-home-assistant. `base_price 15.99, display_price 15.99, promotions []` and `Only controller [610 in stock]`. The IR-remote bundle is +$7.
- **Links:** ok.

### database/controllers/alphapix-classic-16-v3.yaml

- **Changes:** price re-confirmed at **$204.99**, and `price_source` added (part 721-V3). Status `active` confirmed.
- **Source:** https://www.holidaycoro.com/AlphaPix-16-Pixel-Controller-V3-p/721-v3.htm. Page text: "Starting At: $ 204.99 Availability / Ships: Usually Ships in 24 Hours Product Code: 721-V3". The base configuration is a bare board with no pigtails and a 30-day defects-only warranty.
- **Links:** ok.

### database/controllers/alphapix-flex-with-expansion.yaml

- **Changes:**
  - **Added** `creator.page` = https://www.holidaycoro.com/Flex-Modular-Lighting-Controller-System-p/951.htm. The entry had no product link.
  - Price changed from **190** to an **array of configurations**: CPU + 1 / 2 / 3 Flex 16-port boards = **$194.90 / $254.85 / $314.80** (5,440 / 10,880 / 16,320 px).
  - `price_source` added. Status `active` confirmed.
- **Source:** the configurator on the 951 page lists "1 of AlphaPix Evolution V2 CPU - NO TECH SUPPORT & NO WARRANTY [Add $134.95]" (with support: $164.95) and "1 of Flex 16 Port SPI Expansion Board / 3 Wire Phoenix Plugs / Blade Fuses [Add $59.95]". Expansion boards #4 and #5 are "HPP V3 ONLY", so the AlphaPix Evolution tops out at 3 boards = 48 outputs, which matches the entry. The page also says "Usually Ships in 24 Hours".
- **Note:** the prices are sums of published option prices, not single list prices. The old $190 most likely matched CPU + 1 board.

### database/controllers/an6usp10.yaml (not edited)

- **Unresolved:** the eBay link returns 403 to every scripted client, including Node, curl, Playwright's bundled browser and headless Chrome after an ebay.com warm-up (even the home page gives 403). WebFetch also gets 403. Price ($97) and status (`unknown`) are left as they were.
- **Archive evidence:** https://web.archive.org/web/20240711231103/https://www.ebay.com/itm/221181172896. In 2024-07 the listing was retitled "ARTNET sACN to TM1814 WS2811(12) WS2815 SM16703(4) RGB RGBW 12U 6120 CHANNELS". It showed seller jury_shef, MPN "AN6USPI0", brand Electron-Design, "US $89.00", "More than 10 available, 732 sold". This is not a current price, so it was not recorded.
- **Wrong fact?** The listing now describes a 12-universe / 6,120-channel unit. The entry's 6 outputs × 170 px (6 universes) may describe an older revision.

### database/controllers/angio-4.yaml

- **Changes:** price **99 → 129** (regular price), and `price_source` added (part angio4). Status `active` confirmed.
- **Source:** https://shop.chroma.tech/products/angio-4. Page text: "Regular price $129.00 USD Sale price $99.00 USD … Sold out". The Shopify `.js` endpoint shows `available: false, compare_at_price 12900`. The notes record the sale price and the sold-out state.

### database/controllers/angio-8.yaml

- **Changes:** price **169 → 199** (regular price), and `price_source` added (part angio8). Status `active` confirmed.
- **Source:** https://shop.chroma.tech/products/angio-8. Page text: "Regular price $199.00 USD Sale price $169.00 USD". The `.js` endpoint shows `available: true`.

### database/controllers/apd-2-500-12v-art.yaml

- **Changes:** `vendors[0].page` changed from the category page https://www.digitaltape.co.uk/pixel-drivers to the product page **https://digitaltape.co.uk/apd-2-500-12v-art**. The category page still works; the product page is just the more precise link. Status `active` confirmed.
- **Unresolved:** no published price, so the entry stays unpriced.
  - Both pages are JS-only (rendered with headless Playwright).
  - The product page shows a "Trade price list" label, but it is not a link; only the Dimensions and Data sheet PDFs are linked.
- **Wrong facts:**
  - The entry has `Wi-Fi: true`, but the page says "Artnet capability via Ethernet socket" and never mentions Wi-Fi.
  - The unit has a built-in PSU: "90-256v input range-12v output to pixel LEDs", "Low energy max 150w". The entry's power block (max 12 V / 5 A) reads as if it took 12 V input.

### database/controllers/baldrick-17.yaml

- **Changes:** price re-confirmed at **$189**, and `price_source` added. Status `active` confirmed.
- **Source:** https://www.baldrickstore.com/pixel-controllers/baldrick17/ ("The official US store for Baldrick"). JSON-LD shows `"price":"189.00"`, `InStock`. The creator page https://www.baldrickboard.com/en/boards/baldrick17 lists the same offer.
- **Links:** ok.

### database/controllers/baldrick-8.yaml

- **Changes:** price **80 → 75**, and `price_source` added. Status `active` confirmed.
- **Source:** the creator page https://www.baldrickboard.com/en/boards/baldrick8 has JSON-LD `"offers":{"url":"https://www.baldrickstore.com/pixel-controllers/baldrick8v2-pixel-controller/","price":"75.00","availability":"InStock"}`. The page covers v1.0, v1.1 and v2 as one product.
- **Other listings:** the v1.x listing at the Baldrick Store is $70 and OutOfStock. Wired Watts' "Baldrick 8 Port Controller Wired Watts Edition" says "Discontinued: This product has been discontinued."
- **Wrong fact (minor):** the creator says v1.1 and v2 take 5-48V (24V on v1.0), and v2 adds two Ethernet ports with a switch. The entry says "max: 24 # up to 48V on V1.1".

### database/controllers/baldrick-dmx.yaml

- **Changes:**
  - **URL moved:** `creator.page` changed from https://baldrickboard.com/docs/category/baldrickdmx (redirects) to **https://www.baldrickboard.com/en/boards/baldrickdmx**.
  - Price **75 → 70**, and `price_source` added. Status `active` confirmed.
- **Source:** https://www.baldrickstore.com/dmx-controllers/baldrickdmx/ shows `"price":"70.00"`, `InStock`. The creator page's offer matches. (A separate BaldrickDMX Pro sells for $129.)

### database/controllers/blink-tape-controller.yaml

- **Changes:** status **unknown → active**. Price **16 → 17.99**, and `price_source` added (part 1011).
- **Source:** https://shop.blinkinlabs.com/products/blinkytape-control-board.json shows `PCB (for soldering to an LED strip) | 1011 | 17.99 | inv 16` and `JST connector | 1010 | 18.99 | inv 12`.

### database/controllers/brightly.yaml

- **Changes:**
  - **dead_links:** `checked` bumped to 2026-11-18. `archive` switched from 20250416032520 (pre-launch sign-up page, no prices) to **https://web.archive.org/web/20210321145613/https://glowbrightly.io/**, which shows the product and the kits with prices.
  - Price changed from **200** (the presale price of the cheapest kit) to an **array of the three kits' regular prices**: $275 / $500 / $750. `price_source` uses retrieved = capture date 2021-03-21.
  - Status `discontinued` confirmed.
- **Source:** glowbrightly.io gives `ENOTFOUND` from DNS. The 2021-03-21 capture shows "Prelaunch kits … Base. CREATOR KIT … 1x Brightly Driver 1x D·8 breakout 1x 16x16 LED matrix 1x 5V or 12V power supply presale price $275 $200" ($275 is struck through), plus Plus $500/$350 and Pro $750/$500.
- **Wrong fact?** The product apparently never launched. The site was a pre-launch/sign-up page from 2021 until its last capture (2025-04-16). "discontinued" may really mean "never shipped".

### database/controllers/deskontrol-lite-16.yaml

- **Changes:**
  - **Added `dead_links`** for the product URL. It now redirects to the generic category page https://www.deskontrol.net/en/26-art-net-led-controllers, which lists only the LITE V3 32U–192U. The archive is the last capture, https://web.archive.org/web/20210924031804/https://www.deskontrol.net/en/art-net-led-controller/362-art-net-led-controller-deskontroller-lite-16-universes.html.
  - Price **363 (USD) → {amount: 300, currency: EUR}**, as an archived last list price (retrieved 2021-09-24).
  - Status `discontinued` confirmed.
- **Source:** the capture shows "300,00 € tax excluded … Warning: Last items in stock!". The old 363 equals €300 + 21% VAT, so it was probably a VAT-inclusive EUR price recorded as USD.
- **Unresolved:** no vendor-named successor. The redirect lands on the whole V3 category, not on one model, so no `related` item was added.

### database/controllers/deskontroller-lite-v3-192.yaml

- **Changes:** price **1490 (USD) → {amount: 1240, currency: EUR}**, and `price_source` added. Status `active` confirmed.
- **Source:** https://www.deskontrol.net/en/art-net-led-controllers/386-deskontroller-lite-v3-192-artnet-universes.html (rendered headless; plain fetch returns an empty 200). Page text: "Price: €1,240.00 … In stock · Free worldwide shipping". Page data: `price_amount 1240`, `price_tax_exc 1240`, `has_discount false`.
- **Wrong fact:** the entry lists `Wi-Fi: true` as its only physical input. The V3 pages never mention Wi-Fi, and the product takes Art-Net over Ethernet.

### database/controllers/deskontroller-lite-v3-32.yaml

- **Changes:** price **630 (USD) → {amount: 490, currency: EUR}**, and `price_source` added. Status `active` confirmed.
- **Source:** the entry's page shows "Price: €490.00 … In stock", with `price_amount 490 = price_tax_exc 490`. On the category page the "-€31.00" discount belongs to the 64U, not the 32U.
- **Wrong fact:** `Wi-Fi: true` is not mentioned on the vendor page.

### database/controllers/deskontroller-lite-v3-96.yaml

- **Changes:** price **1060 (USD) → {amount: 940, currency: EUR}**, and `price_source` added. Status `active` confirmed.
- **Source:** "Price: €940.00 … In stock", with `price_amount 940`, `price_tax_exc 940`, `has_discount false`.

### database/controllers/digidot-c4-extended-8.yaml

- **Changes:**
  - **URL moved:** `creator.page` changed from https://digidot.eu/digidot-controllers/1406-digidot-c4-extended.html (redirects to the new Odoo shop) to **https://www.digidot.eu/shop/digidot-c4-extended-127** (the canonical URL).
  - Price **385 (USD) → {amount: 645, currency: EUR}**, part 20204, and `price_source` added. Status `active` confirmed.
- **Source:** JSON-LD shows `DiGidot C4 Extended (8) price 645.0 EUR InStock sku 20204`. The other licences are (2) €420, (4) €495 and (12) €795. The variant URL is `?attribute_values=77` ("8"). The pricelist is "DiGidot List price", and VAT treatment is not stated.

### database/controllers/digidot-c4-live-12.yaml

- **Changes:**
  - **URL moved:** `creator.page` changed to **https://www.digidot.eu/shop/digidot-c4-live-125**.
  - Price **330 (USD) → {amount: 425, currency: EUR}**, part 20103, and `price_source` added. Status `active` confirmed.
- **Source:** JSON-LD shows `DiGidot C4 Live (12) 425.0 EUR InStock sku 20103`. The other licences are (8) €345, (16) €495 and (24) €623. The variant URL is `?attribute_values=74` ("12").
- **Wrong fact:** the technical note says "Up to 16 universes (8192 channels) depending on license". The page now says "up to 24 universes (12.288 channels), depending on the license".

### database/controllers/digiled-strip-dmx-wav-sd-micro-player.yaml

- **Changes:**
  - Price **30 (USD) → {amount: 20.83, currency: EUR}** (ex VAT), part SD_PLAYER_TO, and `price_source` added. Status `active` confirmed.
  - **URL moved:** the Artrender downloads link in `technical_notes` changed from …/information/downloads.html (404) to **https://www.boutique-electroconcept.com/informations/telechargements.html**. The new page lists "ArtRender V0.98e Béta". Only the URL was swapped; the prose is unchanged.
- **Source:** https://www.boutique-electroconcept.com/micro-sd-player-digiled-strip-ou-dmx-512.html shows "25,00 € 20,83 € En stock SKU SD_PLAYER_TO". The SD card option is "+ 15,00 €".
- **Wrong facts:**
  - The entry has `Ethernet: true`, but the board has 6 dry-contact inputs, an SD slot and solder pads, and no Ethernet.
  - The page gives WS2812 capacity as "4080 en WS2812 … 8 [univers] en WS2812", while the entry says max_per_output 850.

### database/controllers/din-pixie.yaml

- **Changes:**
  - **URL moved:** `creator.page` changed to **https://www.enttec.com.au/product/led-pixel-control/din-pixie-compact-2-universe-dmx-to-led-pixel-converter-controller/** (the redirect target, same product, SKU 73539).
  - Price **100 → 96**, and `price_source` added (ENTTEC US store, part 73539). Status `active` confirmed.
- **Source:** https://www.enttec.com/product/led-pixel-control/din-pixie-compact-2-universe-dmx-to-led-pixel-converter-controller/ shows "8 in stock … Buy Now $ 96.00 SKU: 73539". The AU site's JSON-LD shows AUD 137.50 with `valueAddedTaxIncluded: false`.
- **Wrong fact:** the entry lists `Ethernet: true` and Art-Net as an input. ENTTEC says the DIN PIXIE runs from "DMX inputs, or stream up to four universes from a computer through USB", and plays back shows "recorded using Art-Net via EMU software". It also says: "For an Art-Net or sACN feed straight from the network … a Pixelator Mini Mk2". The unit has no Ethernet port.

### database/controllers/dmx-core.yaml

- **Changes:** price **799 → 999**, part DMXCORE-100-LIGHT, and `price_source` added. Status `active` confirmed.
- **Source:** https://dmxprosales.com/products/dmx-core-100-wall-controller. The `.js` endpoint shows `DMX Core 100 4.3" Light Controller … DMXCORE-100-LIGHT 999 available`. https://dmxcore.com/dmx-core-100 says: "Dedicated Hardware $999 4.3" Touchscreen … $1,099 7" Touchscreen".
- **Why $999 and not $799:** a separate "DMX Core 100 4.3" Controller - External Remote Control (QSYS/Symetrix)" sells for $799. The old $799 may have been that variant, or the old price.
- **Wrong facts:**
  - "Up to 40 universes (~6800 pixels)" is out of date: the vendor now says up to 800 universes.
  - `Wi-Fi: true`: the hardware specs list GbE Ethernet and PoE or 8-28VDC, and no Wi-Fi.
  - The product is a DMX/Art-Net show controller, not a pixel driver, so `outputs.clocked: selectable` is odd.

### database/controllers/dmx-to-led-strip.yaml

- **Changes:**
  - Status **active → discontinued**.
  - **URL moved:** `creator.page` changed from the 404 English URL to the live French product page, **https://www.boutique-electroconcept.com/carte-dmx-en-signal-pour-ledstrip-digital-ws2812-et-compatible-a-souder.html**. The old `dead_links` item (which had no archive) was removed, because that URL is no longer in the entry.
  - Price **20 (USD) → {amount: 13.33, currency: EUR}**, part DMX_TO_WS2812_SOLDERING.
  - **Added `related` replacement** (name + url; not in the database): "Carte DMX en signal pour LEDStrip Digital WS2812 et compatible (à souder) RISCV", https://www.boutique-electroconcept.com/carte-dmx-en-signal-pour-ledstrip-digital-ws2812-et-compatible-a-souder-riscv.html.
- **Source:**
  - The product page breadcrumb reads "Home INFORMATIONS **Produits plus au catalogue**" ("products no longer in the catalogue"), and the page shows "16,00 € 13,33 € En rupture de stock SKU DMX_TO_WS2812_SOLDERING". The description matches the entry ("réglage du mode pixel X1 X2 X3 ou mode programme 11 canaux", "jusqu'à 850 Pixels").
  - The successor page shows "18,00 € 15,00 € En stock SKU DMX_TO_WS2812_RISCV_SOLDERING !!!NOUVELLE VERSION AVEC CONFIGURATION PAR USB!!!", filed under "CONTROLE DMX > DMX FILAIRE".
- **Wrong fact:** the entry has `Bluetooth: true` and `Audio: true` inputs. The board has only a 3-pin DMX input and DIP switches.

### database/controllers/dmx-to-spi.yaml (not edited)

- **Unresolved:** https://www.ebay.com/itm/321934091091 returns 403 to every scripted client (same as an6usp10). Price ($18) and status (`unknown`) are left as they were.
- **Archive evidence:** the 2021-06-16 capture (https://web.archive.org/web/20210616130514/https://www.ebay.com/itm/321934091091?hash=item4af4c46353:g:4~4AAOSwNphWWr1y) showed "Price: US $19.20 … More than 10 available / 452 sold", seller jury_shef, Brand Electron-Design. A search-engine summary suggests the seller's store still lists it at about $19, but I could not open the page to confirm.

### database/controllers/e6804.yaml

- **Changes:**
  - Status **unknown → active**.
  - **URL moved:** `creator.page` changed to **https://sandevices.com/product/e6804-pixel-controller-assembled-tested/** (the canonical page; the old URL redirects there).
  - Price **100 → 129**, and `price_source` added.
- **Source:** the page title is "E6804 Assembled- Limited Stock Inquire". It shows "$ 129.00 … Out of stock" and JSON-LD `OutOfStock`.
- **Judgement call:** the product is still listed with a price by the creator, so it counts as `active` under the conventions. But "Limited Stock Inquire" suggests the board is winding down. `limited` exists in the status enum but is undefined in the conventions, so I did not use it.

### database/controllers/e682.yaml

- **Changes:**
  - Status **unknown → active**.
  - **URL moved:** `creator.page` changed to **https://sandevices.com/product/e682-pixel-controller-assembled-and-tested/**.
  - Price **180 → 215**, and `price_source` added.
- **Source:** "$ 215.00", JSON-LD `InStock`, "Add to cart".

### database/controllers/electromage-8x-driver.yaml

- **Changes:** price **15 → 19**, part EM-03, and `price_source` added. Status `active` confirmed.
- **Source:** https://shop.electromage.com/products/pixelblaze-output-expander-serial-to-8x-ws2812-apa102-driver shows "Regular price $19.00 USD … Sold out - check distributors". The `.json` endpoint shows `EM-03 price 19.00`.
- **Wrong facts:** the entry has `Ethernet: true # internal switch`, `protocols: Art-Net`, and the note "Stacks up to 8 on a bus via internal Ethernet switch". The vendor describes a **serial (UART, 2 Mbps)** expander: "driven by just about any micro over serial UART … up to 8 driver boards to run from the same serial line … over CAT 5/CAT 6". The board has no Ethernet and no Art-Net.

### database/controllers/electromage-pro-8x-driver.yaml

- **Changes:** price **49 → 65**, part EM-O5-12V-PT, and `price_source` added. Status `active` confirmed.
- **Source:** "Regular price $65.00 USD … Sold out - check distributors". Both 12V and 5V variants cost $65, and both are sold out.
- **Wrong fact:** same as above. `Ethernet: true` is wrong for a serial expander (it runs its serial bus over CAT5).

### database/controllers/emp-16-uni-control.yaml (coordinator's extra check)

- **Decision:** **removed the `dead_links` item** and **replaced `creator.page` in place** with the canonical **https://www.empdesigns.co.uk/our-products/16-universe-led-pixel**. The old /portfolio-item/ URL now redirects there with a 200.
- **Evidence it is the right product:** the page is titled "16-Universe LED Pixel | EMP Designs UK". It says: "Our new, ultra-compact LED pixel controller allows you to run 16 universes from a single slice … four outputs … 2,048 RGBW LEDs … or 2,728 LEDs in RGB mode … embedded Ethernet switch … DIN rail mountable … just 19mm wide".
- **Unresolved:**
  - No price. The product is not in the online shop (https://www.empdesigns.co.uk/category/all-products lists 12 products, none of them this controller). EMP sells through distributors (Octica, LCA) and lists no prices for them. The entry stays unpriced.
  - Status left as `active`, with no `# src`. The product is presented as current, but nobody lists it for sale.
- **Wrong fact:** `Wi-Fi: true` is not mentioned on the product page.

### database/controllers/epix-flex-drive.yaml

- **Changes:**
  - Status **unknown → active**.
  - **URL moved:** `creator.page` changed to **https://chauvetprofessional.com/product/epix-flex-drive/** (the canonical page).
  - Price **600 → 786**, and `price_source` added.
- **Source:**
  - Chauvet's page shows the product in its current catalog ("ÉPIX Flex Drive SKU: EPIXFLEXDRIVE"), with no discontinued notice. Chauvet publishes no price.
  - Full Compass (authorized dealer, page rendered with headless Chrome; plain fetch gets 403) shows "Our Price: $786.00 List Price: $975.00 You save 19% … usually available to ship in 19-21 Business Days".
- **Judgement call:** I recorded the dealer's everyday price ($786) and put the $975 MSRP in the notes. If the convention is to record manufacturer list price, change the price to 975.
- **Wrong facts:** the spec block lists "Data Inputs Ethernet (RJ45) (2 total) and 5-pin XLR (2 total)". The entry's `Wi-Fi: true` and `USB: true` are not supported by the page.

### database/controllers/esp32-wled-controller-8chan.yaml

- **Changes:** price re-confirmed at **$45**, and `price_source` added. Status `active` confirmed, with the src note recording the stock state.
- **Source:** https://www.tindie.com/products/giovannicas/esp32-wled-controller-8chan/ shows `base_price 45.00, display_price 45.00`, "Out of Stock … Sold out since Aug 18, 2024". The listing is not retired. The seller still sells the "ESP32 WLED Controller 2chan" ($35).
- **Flag:** it has been sold out for over two years. By the conventions (out of stock ≠ discontinued), it stays `active`.

### database/controllers/espartstick.yaml

- **Changes:**
  - Status `discontinued` confirmed.
  - **dead_links:** `checked` bumped to 2026-11-18, and a note added.
  - **Archive replaced:** the old 20260410115123 capture only showed an empty placeholder storefront. The new one is **https://web.archive.org/web/20220311162702/https://microcyb.com/index.html**, which reads "pixelcontroller ESPArtStick, the small pixel controller for RGB LEDs".
- **Source:** microcyb.com is live again (an xLights sequences shop). https://www.microcyb.com/index.html returns 404, and the store's "Controllers (3)" are the ShowSpark products. No vendor-named successor, so no `related` item.
- **Unresolved:** the price ($28) cannot be verified. The old Ecwid store (id 17244200) was JS-only and never archived with prices. The earlier product page https://web.archive.org/web/20191020131554/http://www.microcyb.com/ESPArtStick/index.html has a description but no price.

### database/controllers/eth032f-pixel-breakout.yaml

- **Changes:**
  - Status `discontinued` confirmed.
  - **dead_links:** `checked` bumped to 2026-11-18.
  - **Archive replaced:** the old one was a homepage capture. The new one is GO 3D's archived pixel-controller category, **https://web.archive.org/web/20230201034543/https://go3d.fr/categorie-produit/controleurs-de-pixels-et-accessoires/controleurs-de-pixels/**, which lists "Carte de contrôle pour LED pixels ETH032F" (plus ETH032F8 and ETH032). The note was extended to say this.
- **Source:** the go3d.fr product URL returns 404 on an unrelated pest-control company's site ("Plus rapide que les nuisibles … Versailles").
- **Unresolved:** the product page itself was never archived (CDX has no captures for it or for any `*eth032*` URL). No price is visible in the category capture, so the price ($55) is unverified.

---

## (a) Files with price / status / related changes

- 8-port-led-distro (price re-confirmed, price_source)
- a1-slwf-03 (16 → 15.99)
- alphapix-classic-16-v3 (re-confirmed 204.99)
- alphapix-flex-with-expansion (190 → 3-config array; also creator.page added)
- angio-4 (99 → 129 regular)
- angio-8 (169 → 199 regular)
- apd-2-500-12v-art (status confirmed only, no price; also vendor page swapped to the product page)
- baldrick-17 (re-confirmed 189)
- baldrick-8 (80 → 75)
- baldrick-dmx (75 → 70; also URL moved)
- blink-tape-controller (unknown → active; 16 → 17.99)
- brightly (200 → archived kit array 275/500/750; also dead_links archive/checked)
- deskontrol-lite-16 (363 USD → €300 archived; also dead_links added)
- deskontroller-lite-v3-192 (1490 USD → €1,240)
- deskontroller-lite-v3-32 (630 USD → €490)
- deskontroller-lite-v3-96 (1060 USD → €940)
- digidot-c4-extended-8 (385 USD → €645; also URL moved)
- digidot-c4-live-12 (330 USD → €425; also URL moved)
- digiled-strip-dmx-wav-sd-micro-player (30 USD → €20.83 ex VAT; also downloads URL moved)
- din-pixie (100 → 96; also URL moved)
- dmx-core (799 → 999)
- dmx-to-led-strip (active → discontinued; 20 → €13.33; replacement added; URL moved, dead_links removed)
- e6804 (unknown → active; 100 → 129; URL moved)
- e682 (unknown → active; 180 → 215; URL moved)
- electromage-8x-driver (15 → 19)
- electromage-pro-8x-driver (49 → 65)
- epix-flex-drive (unknown → active; 600 → 786; URL moved)
- esp32-wled-controller-8chan (re-confirmed 45, sold out)
- espartstick (status confirmed; also dead_links archive/checked)
- eth032f-pixel-breakout (status confirmed; also dead_links archive/checked)

All statuses that were confirmed without any other change still received a `# src` comment.

## (b) Files with ONLY link changes

- emp-16-uni-control: `creator.page` moved to /our-products/16-universe-led-pixel, and the `dead_links` item removed (link live again).

## (c) Unresolved

- **an6usp10, dmx-to-spi:** eBay returns 403 to every scripted client, including headless Chrome. Price and status are unverified and left unchanged. The last captures show US $89 (2024-07) and US $19.20 (2021-06).
- **apd-2-500-12v-art:** no published price (the trade price list is not linked).
- **emp-16-uni-control:** no published price (not in EMP's shop). Status left `active`, unconfirmed.
- **espartstick ($28), eth032f-pixel-breakout ($55):** prices cannot be verified. No archived price exists.
- **deskontrol-lite-16:** no vendor-named successor. The whole LITE V3 range replaced it, so no `related` item was added.
- **Judgement calls to review:**
  - epix-flex-drive records the dealer price $786, not the $975 MSRP.
  - e6804 is set `active` although it is out of stock and listed as "Limited Stock Inquire".
  - esp32-wled-controller-8chan is kept `active` although it has been sold out since 2024-08.
  - brightly prices are 2021 prelaunch kit prices for a product that may never have shipped.
  - alphapix-flex prices are sums of configurator option prices.

## (d) Wrong facts for other workstreams

- **electromage-8x-driver, electromage-pro-8x-driver:** `Ethernet: true` / Art-Net / "internal Ethernet switch" are wrong. These are serial-UART expanders (2 Mbps, up to 8 boards per serial line, cabled over CAT5).
- **din-pixie:** no Ethernet. Inputs are DMX and USB, and Art-Net is used only for recording through EMU over USB.
- **digiled-strip-dmx-wav-sd-micro-player:** no Ethernet (6 dry-contact inputs). WS2812 capacity is 4,080 channels / 8 universes, not 850 px.
- **dmx-to-led-strip:** no Bluetooth and no Audio input (DMX only).
- **apd-2-500-12v-art:** no Wi-Fi (Ethernet only). The unit takes 90-256 V AC through a built-in 12 V / 150 W PSU.
- **dmx-core:** now up to 800 universes, not 40. No Wi-Fi (GbE and PoE). It is a show controller, not a pixel driver.
- **deskontroller-lite-v3-192, deskontroller-lite-v3-32:** `Wi-Fi: true` is not supported by the vendor page.
- **emp-16-uni-control:** `Wi-Fi: true` is not on the product page.
- **epix-flex-drive:** `Wi-Fi: true` and `USB: true` are unsupported. Inputs are 2× RJ45 and 2× 5-pin XLR.
- **digidot-c4-live-12:** the licence ceiling is now 24 universes / 12,288 channels, not 16.
- **baldrick-8:** v1.1 and v2 are 5-48 V. v2 adds dual Ethernet with a switch.
- **an6usp10:** the 2024 listing describes a 12-universe / 6,120-channel unit. The entry's 6 × 170 px may be an older revision.
- **brightly:** the product appears never to have launched (pre-launch/presale only, 2021–2025).
