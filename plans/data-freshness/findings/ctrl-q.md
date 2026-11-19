# Controllers q–z: data-freshness findings (2026-11-18)

Slice: `database/controllers/[q-z]*.yaml` (28 files). All pages read 2026-11-18.

## controllers/qolorpix.yaml

- **Changes**: price 1500 → 2861.3 (MSRP); `price_source` added; status unknown → active; `creator.page` moved (old `http://www.citytheatrical.com/Products/qolorpix-tape-controller-eight-output` 301s to the new canonical URL, now in place).
- **Sources**:
  - https://www.citytheatrical.com/products/electronics/qolorflex-led-tape-and-accessories/qolorpix-tape-controller-eight-output: current product page "QolorPIX® Tape Controller, Eight Output — Part Number(s) 5850", under Electronics > QolorFLEX (not under "Legacy Products"; the Legacy Products page does not mention QolorPIX). No price (dealer-only).
  - https://soundpro.com/products/city-theatrical-5850.json (Environmental Lights / SoundPro): `price 2432.11`, `compare_at_price 2861.30`.
  - https://www.filmandvideolighting.com/city-theatrical-qolorpix-led-tape-controller-8-port-5850.html: "Our Price: $2,432.99 Price: $2,861.30 You Save: $428.31 (15%)".
  - https://proadv.com/city-theatrical-8-output-qolorpix-tape-controller/: $2,432.11, `"instock":true`, `"purchasable":true`.
  - https://goknight.com/city-theatrical-5850-qolorpix-8-output-pixel-tape-controller/: $2,432.11.
- **Notes**: recorded the $2,861.30 MSRP per the regular/list-price rule; every dealer sells at the $2,432.11 MAP price (in notes).
- **Wrong facts**: the old $1500 was far off (no source anywhere near it).

## controllers/quinled-dig-octa.yaml

- **Changes**: price 65 → 70.48; `price_source` added. Status active re-confirmed. Link ok.
- **Sources**: https://quinled.shop/product/dig-octa-system/: "A working Brainboard-plus-Powerboard pair starts from $70.48". ALLNET China Shopify JSON: https://shop.allnetchina.cn/products/quinled-dig-octa-brainboard-32-8l-v4 `[QLD-DOBBV4] 37.49 available=true`; https://shop.allnetchina.cn/products/quinled-dig-octa-power-5 `[QLD-DOP5] 32.99`; power-7 `34.99`; power-5hv `39.99`; power-7hc `44.99`. (`quinled.shop/product/dig-octa/` is a 404; the system page is the right one.)
- **Wrong facts**: `power.voltage.max: 24`: the system is "5V – 48V\*" with the Power-5HV board (30 A at up to 48 V). `power.current.max: 100` only with the Power-7HC board (Power-5/7 are 50 A).

## controllers/quinled-dig-quad.yaml

- **Changes**: price 38 → 42.49; `price_source` added (part QLD-DQV4). Status active re-confirmed. Link ok (page is now "QuinLED Dig-Quad v4").
- **Sources**: https://shop.allnetchina.cn/products/quinled-dig-quad-v4-digital-led-controller.json: `[QLD-DQV4] QuinLED Dig Quad: price=42.49 compare= available=true`; ext. antenna 44.49, LAN 49.99. https://quinled.shop/product/dig-quad/: "ALLNET China Worldwide $42.49 USD … DrZzs United States $47.00 USD".
- **Wrong facts**: `notes`/`core.family` say ESP8266/ESP32; the v4 page only offers the QuinLED-ESP32 ("can be purchased with a board antenna, external or wired Ethernet option and comes included with every pre-assembled board"); no ESP8266 option is listed any more.

## controllers/quinled-dig-uno.yaml

- **Changes**: price 27.5 → 32.49; `price_source` added (part QLD-DUV4). Status active re-confirmed. Links ok.
- **Sources**: https://shop.allnetchina.cn/products/quinled-dig-uno-v4-digital-led-controller.json: `[QLD-DUV4] QuinLED Dig Uno: price=32.49 available=true`; ext. antenna 34.99, LAN 39.99. https://quinled.shop/product/dig-uno/: "ALLNET China Worldwide $32.49 USD … DrZzs United States $39.00 USD".

## controllers/quinled-dig2go.yaml

- **Changes**: price 25 → 24.99; `price_source` added (part QLED-D2G). Status active re-confirmed. Link ok.
- **Sources**: https://shop.allnetchina.cn/products/quinled-dig2go-portable-digital-led-controller.json: `[QLED-D2G] Default Title: price=24.99 available=true`. https://quinled.shop/product/dig2go/: "ALLNET China Worldwide $24.99 USD … DrZzs United States $28.00 USD".

## controllers/rc4magic-s3-pixel-driver.yaml

- **Changes**: price 399 → 640 (regular); `price_source` added (part RC4-M2400-PIX); status active confirmed; `creator.url`/`creator.page` moved theatrewireless.com → rc4wireless.com (old URLs 301 to the new ones).
- **Sources**: https://rc4wireless.com/shop/rc4magic-s3/dmxpix/: "Save 15% on listed prices … $640.00 USD Original price was: $640.00 USD. $544.00 USD Current price is: $544.00 USD"; JSON-LD `"sku":"RC4-M2400-PIX"`, `"availability":"https://schema.org/InStock"`; "Each pixel driver purchase includes a set of Phoenix Connectors".
- **Wrong facts**: `creator.name` "Theatre Wireless": the company now trades as RC4 Wireless (site title "RC4 Wireless", theatrewireless.com redirects there).

## controllers/reactivo-2.yaml

- **Changes**: price EUR 150 re-confirmed (unchanged); `price_source` refreshed (vendor LED Strip Studio, part VP036, url added); status active confirmed. Links ok.
- **Sources**: https://www.ledstripstudio.com/shop/product/reactivo-2-art-net-standalone-pixel-controller/ (WooCommerce Store API): variants `["OEM","Art-net Only"] 15000 EUR sku VP036 in_stock`, `["Full-kit","Art-net Only"] 23000`, `["OEM","LED Strip Studio Software"] 40000`, `["Full-kit","LED Strip Studio Software"] 48000`; page text "excl. VAT". https://www.ledstripstudio.com/products/reactivo2/: "OEM Edition Controllers only REACTIVO 2 150 € / excl. VAT". https://reactivo.lighting/shop/: "REACTIVO 2 – Digital Pixel Controller 225.00 € … REACTIVO 2 OEM 150.00 €" (OEM "88 in stock").
- **Notes**: `creator.page` points at the reactivo.lighting "First touch" setup guide, not a product page; the product page is https://www.ledstripstudio.com/products/reactivo2/ (left as is).

## controllers/spi-led-controller.yaml

- **Changes**: price array (1024/2048/4096 px: 299/449/599) → `{amount: 170, currency: EUR}`; `price_source` added (part VP007); status active confirmed; `creator.page` moved `https://ledstripstudio.com/spi-led-controller/` → `https://www.ledstripstudio.com/products/spi_led_controller/` (301).
- **Sources**: https://www.ledstripstudio.com/products/spi_led_controller/: "SPI LED CONTROLLER 1024-pixels | 1 SPI Output 170 € excl. VAT … 3 × SPI LED CONTROLLER SAVE 50 EUR 460 € excl. VAT". Shop https://www.ledstripstudio.com/shop/product/spi-led-controller/: "€ 170 excl. VAT In stock", simple product, SKU VP007.
- **Why the shape changed**: the vendor sells one configuration only. The old 299/449/599 tiers by pixel count match the SPI Matrix's LITE/STANDARD/PRO tiers (EUR 300/450/600), so they were copied from the wrong product.
- **Wrong facts**: `inputs.physical.Ethernet: true`: the comparison table on the product page gives SPI LED Controller "Ethernet Ports –", "Real-time Art-Net Software Control –", DMX IN connector "RJ-45" (DMX on an RJ45 jack, not Ethernet). `technical_notes` "Price varies by pixel count software license (1 year included)" is wrong for this product (single 1024-px SKU).

## controllers/spi-matrix.yaml

- **Changes**: price 299 → array LITE/STANDARD/PRO EUR 300/450/600 (1024/2048/4096 px); `price_source` added; status active confirmed; added `creator.page` https://www.ledstripstudio.com/products/spi_matrix/ (was missing).
- **Sources**: https://www.ledstripstudio.com/products/spi_matrix/: "LITE 1024-pixels 6 Universes 300 € excl. VAT … STANDARD 2048-pixels 12 Universes 450 € excl. VAT … PRO 4096-pixels 24 Universes 600 € excl. VAT". Store API for https://www.ledstripstudio.com/shop/product/spi-matrix-pixel-led-decoder-for-art-net/: variants 30000/45000/60000 EUR, all in stock. Vendor link (TLS Lighting, SPI Matrix Lite) ok, shows no price.
- **Wrong facts**: `notes` is just a URL to `LEC3HardwareManual.pdf` (the LED Ethernet Controller 3 manual, not the SPI Matrix's).

## controllers/replay.yaml

- **Changes**: status discontinued re-confirmed (evidence comment added); added the official product link (`creator` string → object with `url` https://smartshow.lighting/ and `page` https://smartshow.lighting/replay/) plus a `dead_links` item for that page (404 now) with archive https://web.archive.org/web/20230129030107/https://smartshow.lighting/replay/ (capture shows "REPLAY is a four output Micro SD-Card Pixel Player…").
- **Sources**: https://smartshow.lighting/archive/: "Archived User Guides … REPLAY | Replay and xLights" (REPLAY no longer in the shop; WooCommerce Store API product list has no Replay). https://smartshow.lighting/replay/ → "404 Oops! That page can't be found". Wayback CDX: last 200 capture of /replay/ is 2023-01-29.
- **Unresolved**: price 80 has no source. The archived product page shows no price (sales were via eBay); the Feb 2022 capture of the smartshow-uk eBay store (https://web.archive.org/web/20220212221756/https://www.ebay.co.uk/sch/smartshow-uk/m.html) lists 5 items, none of them REPLAY. Left as is.
- **Wrong facts**: `inputs.physical.Ethernet: true`: the archived page describes an SD-card-only player (no network interface mentioned). `outputs.connector: mtsb-combicon`: page says "four JST outputs" / "7-way plug-in connector". `outputs.protocols` WS2812/SK6812 fits ("WS2812 (or compatible)").

## controllers/smartshow-pro-one.yaml

- **Changes**: price 300 (USD) → `{amount: 250, currency: GBP}` (regular); `price_source` added; status active confirmed; added `creator.page` https://smartshow.lighting/product/smartshow-pro-one/ (was missing).
- **Sources**: https://smartshow.lighting/product/smartshow-pro-one/: "Sale! Pro-ONE £ 250.00 Original price was: £250.00. £ 199.00 Current price is: £199.00." Store API: `Pro-ONE … 19900 25000 19900 GBP |stock true`. No VAT statement on the page or the purchasing policy.

## controllers/scenex-pp4.yaml

- **Changes**: status active → discontinued (evidence comment); price added: 1249 (archived last listed price, `retrieved: '2026-07-21'` = capture date); `dead_links` `checked` 2026-07-01 → 2026-11-18 (archive 2025-08-05 capture re-verified: it shows "PP4 LED Pixel Tape Driver" with full specs).
- **Sources**:
  - https://www.germanlightproducts.com/product/pp4-pixel-led-tape-drivers/ → 404 "Page not found".
  - https://www.germanlightproducts.com/product-category/scenex-lighting/ → 404; GLP's product menu now lists only "GLP Cosmic Truss Fusion by GLP NEXUS" (the Aug 2025 capture still had "Scenex Lighting"); https://www.germanlightproducts.com/product-sitemap.xml contains no Scenex/PP4 product; site search for "PP4" returns only 2015–2016 news posts.
  - https://usedlighting.com/38474/new-scenex-lighting-led-driver-box-4-output: "This listing (NEW Scenex Lighting LED Driver Box, 4 Output) is no longer available".
  - Price: https://web.archive.org/web/20260721043704/https://www.usedlighting.com/38474/new-scenex-lighting-led-driver-box-4-output?ref=product.nf: "NEW Scenex Lighting LED Driver Box, 4 Output QTY: $1,249.00 In Stock" (earlier capture 2021-10-26: $1,125.00). GLP's own page only said "Contact us for more information on the PP4".
- **Unresolved / for review**: discontinued rests on "gone from the creator's catalog" (whole Scenex line removed) plus the dealer listing ending; GLP has published no explicit EOL notice. No successor named. UsedLighting/NewLighting sells new GLP stock, but I couldn't confirm it is an authorized GLP dealer.
- **Wrong facts**: `inputs.physical.Wi-Fi: true`: the archived spec lists no Wi-Fi (Ethernet sACN/Art-Net only). The archived spec says "Power output: 5V DC / 40 Amp", "Power input: 100 – 240VAC" (the `power` block holds the output figures; fine as is, but `notes` "Internal PSU" could say so).

## SP-series (Sperll) common notes

Sperll's own site (https://sperll.com/) lists current models but shows no prices (JS-rendered product pages titled "Product - SPxxxE"; SP105E = /product/82, SP107E = /product/84, SP108E = /product/78, SP608E = /product/104, SP801E = /product/62). Retail prices differ a lot between stores and most show permanent strike-through "regular" prices. I priced each entry at the retailer it already links (SuperLightingLED for SP107E/SP608E, LED Lighting Hut for SP108E, BTF-Lighting for SP801E as before), regular price per the addendum, with the other stores in `notes`. SP105E only listed "Amazon", so I used BTF-Lighting's dedicated SP105E listing.

## controllers/sp102e.yaml

- **Changes**: status active → discontinued (evidence comment). Price untouched.
- **Sources**: current catalog at https://sperll.com/ lists SP002E, SP103E, SP104E, SP106E, SP201E, SP901E, SP902E, SP11XE, SP105E… but no SP102E. Wayback: Sperll's SP102E pages were captured 2017–2020 only (last https://web.archive.org/web/20200706141248/http://www.sperll.com/a/Product/SP102E/2017/0731/81.html, title "SP102E IR remote controller operating instructions"; https://web.archive.org/web/20200706044651/http://www.sperll.com/a/chanpinzhongxin/SP102E/2017/0802/115.html: "SP102E是斯泊尔研发的一款红外控制器" = "an infrared controller developed by Sperll"). Web searches for "SP102E" find no current listing at any retailer.
- **Unresolved**: price 13 has no source (no current listing anywhere); left as is. Discontinued rests on "gone from Sperll's catalog + no seller found"; review if you want explicit EOL wording.
- **Wrong facts**: Sperll's SP102E is an **IR-remote** controller ("infrared controller … 70 kinds of" effects), not a unit with "onboard buttons + display" as `inputs.physical.buttons` and its comments claim. The 1024 px and 12 V max are unverified.

## controllers/sp105e.yaml

- **Changes**: price 18 → 21.32 (BTF regular); `price_source` added; status active confirmed; added `creator` url/page (https://sperll.com/product/82; creator was a bare string).
- **Sources**: https://www.btf-lighting.com/products/sp105e-spi-led-controller.json: `[SP105E] price=15.99 compare=21.32 available=true`. https://www.ledlightinghut.com/sp105e-bluetooth-spi-controller.html: "Special Price $24.50 Regular Price $30.00 In stock SKU LLH-SC-SP105E". https://www.superlightingled.com/dc51224v-sp105e-new-style-dream-color-led-bluetooth-controller-control-by-ios-android-smart-iphone-device-for-280128112812-led-tape-lights-led-pixel-module-p-497.html: "Starting at: $12.98".

## controllers/sp107e.yaml

- **Changes**: price 25 → 16.98; `price_source` added (part CONFULL-SP107E); status active confirmed; added `creator` url/page (https://sperll.com/product/84). Vendor link ok.
- **Sources**: SuperLightingLED page (entry's vendor link): "Model: CONFULL-SP107E … Various options in stock Starting at: $16.98 … Type: WiFi - "Tuya" APP Bluetooth - "LED Chord" APP"; JSON-LD `"price":16.98`, `InStock`. LED Lighting Hut "Special Price $24.50 Regular Price $30.00"; BTF variant SP107E `compare=26.65`.
- **Wrong facts**: SuperLightingLED now sells SP107E in a Wi-Fi (Tuya) version too; entry only knows Bluetooth (fine for the original, just noting).

## controllers/sp108e.yaml

- **Changes**: price 25 → 35 (LLH regular); `price_source` added (part LLH-SP108E); status active confirmed; added `creator` url/page (https://sperll.com/product/78). Vendor link ok (sweep's NGHTTP2 error not reproduced; 200 with product).
- **Sources**: https://www.ledlightinghut.com/sp108e-wifi-spi-led-controller.html: "Special Price $29.50 Regular Price $35.00 In stock SKU LLH-SP108E". BTF-Lighting SP108E `price=21.27 compare=30.00`; SuperLightingLED "Price $21.99".

## controllers/sp608e.yaml

- **Changes**: price 30 → 49.98 (regular); `price_source` added (part CONFULL-SP608E); status active confirmed. Link ok.
- **Sources**: SuperLightingLED page (creator.page): "Model: CONFULL-SP608E … Various options in stock Starting at: $49.98 $36.98 26% off" (controller only; trigger kits +$8–32). BTF-Lighting `[SP608E] price=33.59 compare=55.99`.
- **Notes**: `creator.page` is a SuperLightingLED retail page; Sperll's own page is https://sperll.com/product/104 (left as is).

## controllers/sp801e.yaml

- **Changes**: price 23 (sale) → 45.32 (BTF regular, per the brief); `price_source` updated (url + part added). Status active confirmed. Link ok.
- **Sources**: https://www.btf-lighting.com/products/sp801e-wifi-art-net-led-controller-led-matrix-panel-module-wireless-control-dc5-24v.json: `[SP801E] price=22.66 compare=45.32 available=true`. SuperLightingLED (creator.page): "Model: CONFULL-SP801E … Price $28.99" (no strike-through).
- **Notes**: BTF's "regular" is a permanent compare-at price; the typical street price is $22.66–28.99 (in notes). `creator.page` is a SuperLightingLED retail page; Sperll's own page is https://sperll.com/product/62 (left as is).

## controllers/spinode.yaml

- **Changes**: status unknown → active (evidence comment); price 349 → 600 (MSRP); `price_source` added (part VPSpiNode); added `creator.page` https://www.visualproductions.nl/products/spinode/ (was missing).
- **Sources**: https://www.visualproductions.nl/products/spinode/: current product page "SpiNode 4-port SPI converter … Art-Net and sACN into SPI … up to 2 SpiNodes to CueCore3" (no price; Visual Productions sells via distributors). https://visualproductions.nl/news/vp_spinode_2025: launch news ("Meet the latest game-changer in the Visual Productions family: SpiNode!"). https://goknight.com/visual-productions-vpspinode-visual-productions-din-rail-4port-spi-ethernet-node/: "MSRP: $600.00 Now: $450.00 (You save $150.00 ) SKU: VPSpiNode", `"instock":true`. (Full Compass blocked by Cloudflare.)
- **Notes**: the product launched in 2025 (news post URL); entry has no `release_year`.

## controllers/standard-differential-receiver.yaml

- **Changes**: none.
- **Sources**: https://microcyb.com (both `creator.url` and `creator.page`) answers 200 but is now "xLights Sequences for Christmas & Halloween Light Shows - Microcyb"; its shop https://microcyb.com/shop.php?category=LED+pixel+Controller lists only "MicroCyb ShowSpark Wi-Fi: 8-Port Wireless Module $24.99" and "ShowSpark 8 ETH Controller $64.99". No receiver anywhere on the site; Wayback CDX for microcyb.com has no product/shop/receiver URLs; web searches for a Microcyb differential receiver find nothing.
- **Unresolved**: status stays unknown and price 22 stays unsourced (no published source found). `creator.page` is just the homepage (never a product page); left as is.
- **Wrong facts (possible)**: attribution to Microcyb could not be verified at all; the description (4 ports, RJ45, 5/12 V jumper, works with Falcon/Kulp) matches generic "standard differential receivers" sold by several makers (e.g. Wasatch Pixels on Tindie).

## controllers/t1000s.yaml

- **Changes**: status unknown → active (evidence comment); price 28 → 29.98 (regular); `price_source` added (SuperLightingLED, part T-1000S). Link (amazon.com homepage) ok but generic.
- **Sources**: https://www.superlightingled.com/dc524vmax-2048-pixelsoriginal-t1000s-series-programmable-pixel-module-full-color-controller-with-sd-card-for-programmable-ic-led-lighting-p-378.html (old p-378 URL redirects here): "Original T-1000S Series … Model: T-1000S … Various options in stock Starting at: $29.98 $21.98 27% off"; JSON-LD `InStock`.
- **Notes**: generic controller with no named creator; a marketplace street range could replace this if preferred (AliExpress needs Playwright; not done).
- **Wrong facts (minor)**: `inputs.physical.USB: true # for SD card programming via LedEdit`: the T-1000S has no USB port; it only reads the SD card (written on a PC via a card reader).

## controllers/thunderpack-wearable.yaml

- **Changes**: price 40 unchanged; `price_source` added with `retrieved: '2026-05-03'` (capture date) and the capture URL. Status not changed and not evidenced.
- **Sources**: https://www.tindie.com/stores/jeremy/ → 403 Cloudflare "Just a moment..." to Node fetch, WebFetch and headless Chrome alike (ok-but-blocked-to-scripts). Latest capture https://web.archive.org/web/20260503133025/https://www.tindie.com/stores/jeremy/: "ThunderPack - Standard 18650 Jeremy Gillick Labs $40.00 Free Shipping!".
- **Unresolved**: live stock/status not verifiable by script. A search-engine snippet of https://www.tindie.com/products/jeremy/thunderpack-standard-18650/ said "This seller is taking a break", so it may not be purchasable right now; needs a browser check.

## controllers/twinpixx16.yaml

- **Changes**: status unknown → discontinued (evidence comment); price 399 (USD, unsourced) → `{amount: 339, currency: EUR}` archived last list price (`retrieved: '2021-01-20'` = capture date, capture URL, part 99-3616); `dead_links` `checked` → 2026-11-18 (archive re-verified: shows "ArtNet TwinPixx 16 Product No.: 99-3616 … 339,00 EUR … incl. 19% tax").
- **Sources**: old URL now redirects to https://dmx4all.store/en/dmx4all-products/magiarled-solutions/magiarled-controller/artnet-twinpixx-16.html → 404. https://dmx4all.store/en/search?search=twinpixx: "0 products found for "twinpixx"" (same for "magiarled"). Wayback: last capture of the product page is 2021-01-20.
- **Notes**: DMX4ALL names no successor; the current 2-output Art-Net pixel controller is "ArtNet PixxControl PX2" (90-1602), but nothing on its page says it replaces the TwinPixx, so no `related` item added.

## controllers/uli-led-control.yaml

- **Changes**: status unknown → active (evidence comment); price 99 (USD) → `{amount: 79.98, currency: EUR}`; `price_source` added; `creator.page` moved: `https://shop.ulrichradig.de/Module/Light-Control-DMX/4096-Kanal-LED-Strip-Controller.html` (now redirects to the radig.online homepage) → https://www.radig.online/4096-Kanal-LED-Strip-Controller/SW10008 (same product on Ulrich Radig's new shop).
- **Sources**: https://www.radig.online/4096-Kanal-LED-Strip-Controller/SW10008: "4096 Kanal LED Strip Controller … Regulärer Preis: 79,98 € Preise inkl. MwSt. zzgl. Versandkosten … Sofort verfügbar, Lieferzeit: 1-3 Tage … Maximale Anzahl an RGB LEDs: 1360 LEDs, 4096 Kanäle, 8 Universen … Betriebsspannung: 7-24V, 200mA … Protokolle: Art Net und sACN E1.31 … Lieferumfang: Leiterkarte mit allen SMD-Bauteilen (bestückt) sowie Steckern und Buchsen, Gehäuse".
- **Wrong facts**: `power.voltage.max: 12`: the shop says "Betriebsspannung: 7-24V". Protocols (Art-Net + sACN) not recorded in the entry.

## controllers/uls-stripe.yaml

- **Changes**: price 330 (USD) → `{amount: 199, currency: GBP}` (single unit, ex VAT); `price_source` added; status active confirmed. Link ok (sweep's NGHTTP2 error not reproduced; 301 adds a trailing slash).
- **Sources**: https://ultralightsound.co.uk/product/uls-stripe-addressable-led-pixel-controller/: "ULStripe Dmx addressable Pixel Led Controller £ 1.20 – £ 720.00 … +VAT"; variations JSON: "Single unit" 199 in stock, "Kit of 4 10% off" 720, "Gx16 Female Plug" 1.2; JSON-LD `InStock`.
- **Wrong facts**: the product page describes a DMX-in unit ("5pin and 3pin xlr in and out", "no web interfaces, no dip switches", onboard colour display + encoder, integrated PSU) with 4 identical GX16 outputs carrying "5v, 12v, Data, Clock and Ground" and supporting APA102. So `inputs.physical` Ethernet/USB/Wi-Fi, `standalone` "Falcon Player (FPP) remote mode" and `software.firmware: FPP` look wrong (no network or FPP mention), and `outputs.clocked: false` conflicts with the clock line/APA102 support. `power.voltage.max: 12` / `current.max: 18` matches "12v 18amps 216 watts".

## controllers/wb1616.yaml (coordinator's extra check)

- **Decision**: the URL does not show the product: `https://wallyslights.com/products/wallys-lights-wb1616-controller` → HTTP 302 to `https://wallyslights.com/` (the sweep saw the homepage's 200), and `…/wallys-lights-wb1616-controller.json` → 404. Kept the `dead_links` item, bumped `checked` to 2026-11-18 and added the missing `archive` https://web.archive.org/web/20250805175734/https://wallyslights.com/products/wallys-lights-wb1616-controller (title "Wally's Lights WB1616 Controller", the last of 10 captures 2022-08 → 2025-08).
- **Other changes**: status discontinued re-confirmed (evidence comment); price 189 (unsourced) → 209 archived last regular price (`retrieved: '2025-08-05'`, capture URL).
- **Sources**: every capture 2022-08-07 … 2025-08-05: "Wally's Lights WB1616 Controller Regular price $174.99 Sale price $174.99 Regular price $209.00 Sale" (i.e. $209 list, $174.99 sale; theme badges make the "Sold out" text unreliable).
- **Notes**: the existing `related` replacement → controllers/wb48 (not added by me, so no `# src:`) has no vendor wording behind it, and the WB48 is itself sold out now.

## controllers/wb48.yaml

- **Changes**: price 159 → 199 (regular); `price_source` added (part CB-WB48); status active confirmed (listed, but sold out). Links ok.
- **Sources**: https://wallyslights.com/products/wallys-lights-wb48-controller: "Regular price $159.00 Sale price $159.00 Regular price $199.00 Sale Sold out … Default Title - Sold out"; `.json`: `[CB-WB48] price=159.00 compare=199.00`, `.js`: `available=false`.
- **Unresolved**: sold out, no restock date shown. Out of stock ≠ discontinued, so it stays active.

## controllers/www-orangepi-dmx-org.yaml

- **Changes**: status active confirmed (evidence comment). Links ok (`http://` → 301 to `https://www.orangepi-dmx.org/`).
- **Sources**: https://www.orangepi-dmx.org/: documents "Multi port pixel prototype boards … 8 Output (8x 4 Universes) BOM Schematic and board … How to order @jlcpcb". https://api.github.com/repos/vanvught/rpidmx512: `pushed_at 2026-07-26`, not archived.
- **Unresolved**: price 50 has no source. It is an open-source DIY design ordered from JLCPCB with a BOM; nobody sells it at a fixed price. Left as is.

---

## (a) Files with price / status / related changes

All status lines I set or confirmed carry a `# src: <url> | 2026-11-18 | <note>` comment. No `related` items were added (no vendor-named successors found).

- controllers/qolorpix.yaml: 1500 → 2861.3 (MSRP); unknown → active; creator.page moved
- controllers/quinled-dig-octa.yaml: 65 → 70.48 (Brainboard v4 + Power-5)
- controllers/quinled-dig-quad.yaml: 38 → 42.49
- controllers/quinled-dig-uno.yaml: 27.5 → 32.49
- controllers/quinled-dig2go.yaml: 25 → 24.99
- controllers/rc4magic-s3-pixel-driver.yaml: 399 → 640 (regular; $544 sale); creator url/page moved to rc4wireless.com
- controllers/reactivo-2.yaml: EUR 150 re-confirmed; price_source refreshed
- controllers/replay.yaml: discontinued confirmed; creator page + dead_links/archive added; price unchanged (unsourced)
- controllers/scenex-pp4.yaml: active → discontinued; price added 1249 (archived 2026-07-21 dealer price); dead_links checked bumped
- controllers/smartshow-pro-one.yaml: 300 USD → GBP 250 (regular; GBP 199 sale); creator.page added
- controllers/sp102e.yaml: active → discontinued (price unchanged, unsourced)
- controllers/sp105e.yaml: 18 → 21.32 (BTF regular); creator url/page added
- controllers/sp107e.yaml: 25 → 16.98; creator url/page added
- controllers/sp108e.yaml: 25 → 35 (LLH regular); creator url/page added
- controllers/sp608e.yaml: 30 → 49.98 (regular; $36.98 sale)
- controllers/sp801e.yaml: 23 (sale) → 45.32 (BTF regular)
- controllers/spi-led-controller.yaml: tier array 299/449/599 → EUR 170 (single SKU); creator.page moved
- controllers/spi-matrix.yaml: 299 → EUR 300/450/600 tier array; creator.page added
- controllers/spinode.yaml: 349 → 600 (MSRP); unknown → active; creator.page added
- controllers/t1000s.yaml: 28 → 29.98 (regular); unknown → active
- controllers/thunderpack-wearable.yaml: 40 unchanged; price_source added (2026-05-03 capture)
- controllers/twinpixx16.yaml: 399 USD → EUR 339 (archived 2021 list price); unknown → discontinued; dead_links checked bumped
- controllers/uli-led-control.yaml: 99 USD → EUR 79.98; unknown → active; creator.page moved to radig.online
- controllers/uls-stripe.yaml: 330 USD → GBP 199 (ex VAT)
- controllers/wb1616.yaml: 189 → 209 (archived 2025-08-05 list price); discontinued confirmed; dead_links archive added + checked bumped
- controllers/wb48.yaml: 159 → 199 (regular; $159 sale, sold out)
- controllers/www-orangepi-dmx-org.yaml: active confirmed (status evidence comment only)

## (b) Files with ONLY link changes

- none (every link change landed in a file that also got a price/status change; see (a)). No changes at all: controllers/standard-differential-receiver.yaml.

## (c) Unresolved

- controllers/standard-differential-receiver.yaml: no source anywhere; status unknown and price 22 left; Microcyb attribution unverifiable (site now sells xLights sequences + ShowSpark only)
- controllers/replay.yaml: price 80 unsourced (no archived price; not in 2022 eBay store capture)
- controllers/sp102e.yaml: price 13 unsourced; discontinued based on absence from Sperll's catalog + no seller found (no explicit EOL)
- controllers/www-orangepi-dmx-org.yaml: price 50 unsourced (open-source DIY board, JLCPCB/BOM only)
- controllers/thunderpack-wearable.yaml: Tindie blocks all scripted access; price from 2026-05-03 capture; a search snippet says "This seller is taking a break": needs a browser check of status
- controllers/scenex-pp4.yaml: discontinued rests on GLP dropping the whole Scenex line from its site (no explicit EOL notice); UsedLighting/NewLighting's dealer status unverified
- controllers/wb48.yaml: sold out with no restock info (kept active)
- controllers/sp801e.yaml (and other SP-series): "regular" prices are retailers' permanent compare-at prices; street prices are much lower (in notes)
- controllers/t1000s.yaml: generic, no creator; priced at SuperLightingLED rather than an AliExpress street range

## (d) Wrong facts for other workstreams

- controllers/qolorpix.yaml: old price $1500 had no basis (MSRP $2,861.30)
- controllers/quinled-dig-octa.yaml: `power.voltage.max: 24`, but the system supports 5–48 V with the Power-5HV board; `current.max: 100` only with Power-7HC
- controllers/quinled-dig-quad.yaml: notes/core.family say ESP8266/ESP32; v4 ships only with the QuinLED-ESP32
- controllers/rc4magic-s3-pixel-driver.yaml: creator.name "Theatre Wireless" is now "RC4 Wireless"
- controllers/replay.yaml: `Ethernet: true` (SD-card-only player); connector is JST / 7-way plug, not mtsb-combicon
- controllers/scenex-pp4.yaml: `Wi-Fi: true` not in the archived spec (Ethernet sACN/Art-Net only)
- controllers/sp102e.yaml: Sperll's SP102E is an IR-remote controller, not "onboard buttons + display"
- controllers/spi-led-controller.yaml: `Ethernet: true` (no Ethernet; DMX on an RJ45 jack); technical_notes "Price varies by pixel count software license" is the SPI Matrix's
- controllers/spi-matrix.yaml: `notes` is a URL to the LEC3 (LED Ethernet Controller 3) manual
- controllers/standard-differential-receiver.yaml: attribution to Microcyb unverifiable
- controllers/t1000s.yaml: `USB: true` comment (T-1000S has no USB; SD card only)
- controllers/uli-led-control.yaml: `power.voltage.max: 12`, but the shop says 7–24 V
- controllers/uls-stripe.yaml: Ethernet/USB/Wi-Fi inputs, FPP remote mode and FPP firmware not supported by the product page (DMX-in unit, "no web interfaces"); `clocked: false` conflicts with the clock line / APA102 support
- controllers/wb1616.yaml: existing `related` replacement → wb48 has no vendor statement behind it (and WB48 is sold out)
