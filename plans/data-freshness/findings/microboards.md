# Findings: microboards (2026-11-18)

Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-data-freshness-bec94b8180ebeefa`

All 36 entries were reviewed. 36 files were edited, and none were committed. Checks after editing:

- `bunx eslint --fix database/microboards`: exit 0.
- `bunx prettier --write database/microboards`: no changes.
- `bun run validate microboards`: 36/36 valid.

Every `status` line set or confirmed, and every `replacement` item added, carries a
`# src: <url> | <date> | <note>` comment (format checked: exactly two `|` separators, no `|` inside a note).

Helper scripts are in scratchpad `mb/`:

- `shop.mjs`: Shopify `.js` variants.
- `cards.mjs`: parses AliExpress search cards and reports the regular price, not the $1.09 deal.
- `rpi-resellers.mjs`: Raspberry Pi's official reseller API.
- `links.mjs`: rendered page links.
- `dl.mjs`: binary download.

Shared helpers used:

- `scripts/get.mjs`, `text.mjs`, `pw.mjs` (with `PW_CHANNEL=chrome`), `cdx.mjs`, `mchp-rows.mjs`, `lcsc.mjs`.
- `px/ali-search.mjs`.

PDFs were read with `/mingw64/bin/pdftotext`.

Tooling notes:

- **AliExpress item pages now return the `_____tmd_____/punish` captcha on every load.** The block also covers Wayback captures of AliExpress items. Search pages still work, so the street ranges below come from search cards. A card's price is the listing's cheapest variant.
- **raspberrypi.com returns 403 to Node.** Headless Chrome (`PW_CHANNEL=chrome`) reads it fine.
- **Raspberry Pi list prices appear only in product-brief PDFs on pip.raspberrypi.com, and only for 3B+ and 4B.** Other models have no official price. I used approved resellers from `content-api.raspberrypi.com/resellers/product_links.json?country=us&product=<slug>`.
- **Digi-Key, Mouser and Newark return 403 to both Node and headless Chrome.** WebFetch to Digi-Key also gets 403.

---

### database/microboards/arduino-mega-2560-rev3.yaml

- **Changed:**
  - `status: active`.
  - Price 40 → **49.9** (regular price).
  - Added `price_source` (part A000067).
  - `creator.page` moved from `…/collections/boards/products/arduino-mega-2560-rev3` to the canonical https://store-usa.arduino.cc/products/arduino-mega-2560-rev3 (the old URL redirects there).
- **Source:** Shopify JSON shows `sku= A000067 price= 34.93 compare= 49.9 avail= true`. The page reads "Save 30 % … Original price $49.90 … Current price $34.93".
  - Wayback captures from 2026-08-11 and 2026-10-31 show "Original price $49.90" with no sale, so $49.90 is the regular price. The sale is noted in `notes`.

### database/microboards/arduino-micro.yaml

- **Changed:**
  - `status: active`.
  - Price **22.8** re-confirmed.
  - `price_source` bumped (added part A000053, url, and a sale note).
  - `creator.page` changed from `https://store.arduino.cc/usa/arduino-micro`, which now redirects to the global EUR store (€24.15 incl. VAT), to the US store page https://store-usa.arduino.cc/products/arduino-micro.
- **Source:** `sku= A000053 price= 12.54 compare= 22.8 avail= true`. The page shows "Original price $22.80 … Current price $12.54".

### database/microboards/attiny85.yaml

- **Changed:**
  - `status: active`.
  - Price 1 → **1.66** (ATTINY85-20PU, PDIP-8, 1–24 pcs).
  - Added `price_source`.
  - `creator.page` moved from `/wwwproducts/en/ATtiny85` to https://www.microchip.com/en-us/product/ATtiny85 (the old URL 301s there).
- **Source:** The product page reads "Status: In Production".
  - Its Purchase tab loads `microchipdirect.com/api/product/ParametricChart?deviceFamily=ATTINY85`: `ATTINY85-20PU … stock 100 | buy-now: 1-24 25-99 100 + $1.66 $1.52 $1.39 … 1000-4999 5000 + *$1.27 *$1.22`. The SOIC part ATTINY85-20SU is $1.50.
- **Wrong facts:** this is a bare MCU, not a board. `creator: Atmel` is now Microchip.

### database/microboards/beaglebone-black.yaml

- **Changed:**
  - `status: active`.
  - Price 50 → **53.77**.
  - Added `price_source`.
  - `creator.page` moved from `http://beagleboard.org/black` to https://www.beagleboard.org/boards/beaglebone-black (redirect).
- **Source:**
  - The BeagleBoard page shows "Purchase at" links to Digi-Key, Mouser and Newark (all 102110420).
  - All three distributors block scripts, so the price comes from a Wayback capture of Digi-Key: https://web.archive.org/web/20260310095517/https://www.digikey.com/en/products/detail/beagleboard-by-seeed-studio/102110420/12719590. It reads "DigiKey Part Number 2820-102110420-ND … In-Stock: 3,522 … 1 $53.77000".
  - `retrieved` is the capture date, 2026-03-10.
- **Note:**
  - Adafruit 1876 shows schema `Discontinued` ($55).
  - SparkFun DEV-12857 says "This product has been retired from our catalog" ($69.95).
- **Unresolved:** the price is 8 months old. A live distributor price needs a human browser.

### database/microboards/ebyte-nrf-52840.yaml

- **Changed:**
  - `status: active`.
  - Price 10 → **6.54**.
  - Added `price_source`.
  - `creator.page` replaced with https://www.cdebyte.com/products/E73-2G4M08S1C.
- **Links:** `https://www.ebyte.com/en/new-view-info.aspx?id=378` now lands on the Chinese homepage (`ebyte.com/?id=378`). Treated as moved, not dead_links, because the product has a live official page.
  - The only Wayback capture (http://web.archive.org/web/20190605040121/http://ebyte.com/en/new-view-info.aspx?id=378) is the news item "【nRF52840】BLE SoC Module", dated 2018-08-08. Its image is titled "产品动态\_E73(2G4M08S1C)\_EN", which identifies the product as **E73-2G4M08S1C**.
- **Source:**
  - The cdebyte.com product page's "EBYTE Official Online Store" link goes to ebyteiot.com (Shopify): `"E73-2G4M08S1C" sku= E73-2G4M08S1C price= 6.54 avail= true`.
  - URL: https://www.ebyteiot.com/products/2-4ghz-ble-mesh-small-smd-e73-2g4m08s1c-nordic-nrf52840-module-small-size-ble-5-0
  - LCSC C356849 now returns "Page Not Found".
- **Wrong facts:**
  - `release_year: 2021`, but Ebyte announced the E73-2G4M08S1C on 2018-08-08.
  - The name could name the module (E73-2G4M08S1C).

### database/microboards/esp-01.yaml

- **Changed:** price (was missing) → **{amount 1.4, max 3.87}**, `vendor: AliExpress (street)`.
- **Source:** single-module ESP-01/ESP-01S search cards on aliexpress.us, at regular prices:
  - 3256811839191584: $1.40.
  - 2251832623303643: $2.11.
  - 3256803367864422: $3.72 (Ai-Thinker original, multi-model listing).
  - 3256813124418659: $3.87.
  - Excluded: multi-packs ($24–$30) and one listing whose "regular" $8.57 is a 2-pc deal.
  - Amazon multi-packs work out to $2.25–$2.80 per module: 5 pcs $11.59 / $12.99 / $13.99, 4 pcs $8.99.
  - Search URL: https://www.aliexpress.us/w/wholesale-ESP-01S-ESP8266-serial-WiFi-module.html
- **Unresolved:** `status` left unset (generic module; no creator or authorized seller to cite).
- **Wrong facts:**
  - `bluetooth: '4.1'`: the ESP8266 has no Bluetooth.
  - No `creator` (Ai-Thinker made the original module). No link could be added without adding a creator.

### database/microboards/esp-32s.yaml

- **Changed:** price (was missing) → **{amount 2.84, max 6.09}**, `vendor: AliExpress (street)`.
- **Source:** 12 ESP32 DevKit / NodeMCU-32S clone listings with 350+ sold. Regular prices:
  - $2.84, $3.13, $3.29, $3.43, $3.51 (2K+ sold), $3.80, $3.81, $3.84, $4.55, $4.55, $6.01, $6.09.
  - Item IDs: 3256806903342213, 3256810200152743, 3256811638533489, 3256805754369773, 3256807987413519, 3256807362770872, 3256804089204783, 3256805954241151, 2251832863673404, 3256808853303253, 3256812335701494, 3256812511198862.
- **Links:** the Espressif ESP32 SoC page is OK.
- **Unresolved:** `status` left unset (generic clone).
- **Wrong facts:**
  - `creator: NodeMCU` with an Espressif page: the ESP-32S module is Ai-Thinker's.
  - `bluetooth: '4.1'`: the classic ESP32 has BT 4.2.

### database/microboards/esp32-poe.yaml

- **Changed:**
  - `status: active`.
  - Price 25 (USD) → **{amount 17.95, currency EUR}**, ex-VAT.
  - Added `price_source`.
- **Source:** the Olimex page reads "ESP32-POE … Price 17.95 EUR 10 - 49 pcs 16.16 EUR 50 - 10000 pcs 14.36 EUR In Stock". Olimex's pricing FAQ says web prices are net, without VAT.
- **Links:** OK.

### database/microboards/esp32-s3-eth.yaml

- **Changed:**
  - `status: active`.
  - Price 17 → **16.99** (board only, no headers, SKU 28972).
  - Added `price_source`.
- **Source:**
  - Rendered https://www.waveshare.com/esp32-s3-eth.htm?sku=28972 reads "SKU:28972 … $16.99 … $16.39 2 … $15.97 4+".
  - SKU 28771 (with PoE module) is $20.99.
- **Links:** OK.

### database/microboards/feather-m0-wifi.yaml

- **Changed:**
  - `status: active`.
  - Price **34.95** re-confirmed.
  - `price_source` bumped (part 3010, url).
- **Source:** "PCB Antenna - Loose Headers $39.95 uFL Antenna - Loose Headers $34.95 … PCB Antenna - Headers Pre-Soldered $36.95 … 77 in stock".
- **Links:** product link and image source OK.

### database/microboards/nodemcu-v2.yaml

- **Changed:** price (was missing) → **{amount 2.03, max 4.15}**, `vendor: AliExpress (street)`.
- **Source:** single-variant "NodeMCU V2 / CP2102 (/CH9102)" listings: $2.03, $2.30, $2.65, $2.76, $2.95, $3.62, $3.92, $4.15.
  - Item IDs: 2251832117376102, 3256803446629194, 3256811898221120, 3256808984103723, 3256805512859060, 2251801781521520, 3256808820436073, 3256806556659795.
  - Combined "CH340/CP2102 V3 V2" listings show lower prices ($1.12–$2.56), but the card price there is usually the CH340 V3 variant. Item pages that would show per-variant prices are captcha-blocked.
- **Links:** components101 page OK (a third-party pinout article).
- **Unresolved:** `status` left unset (generic).
- **Wrong facts:** `bluetooth: '4.1'`: the ESP8266 has no Bluetooth.

### database/microboards/nrf-52840-feather.yaml

- **Changed:**
  - `status: active`.
  - Price 25 → **24.95**.
  - Added `price_source`.
- **Source:** "Product ID: 4062 $24.95 … Qty Discount 1-9 $24.95 10-99 $22.46 100+ $19.96 In stock".

### database/microboards/orange-pi-lts.yaml

- **Changed:**
  - `status: active`.
  - Price 9 → **31.99**.
  - Added `price_source`.
  - `creator` string → object with `page` = official Orange Pi Zero LTS page (missing product link added): http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-Zero-LTS.html
- **Source:**
  - The Amazon purchase link on orangepi.org is https://www.amazon.com/dp/B0B2RBKMC6: "Orange Pi Zero LTS AllWinner H3 512MB … Visit the Orange Pi Store … $31.99 … In Stock".
  - The official AliExpress listing 1005003627813813 (= aliexpress.us 3256803441499061) shows $31.49 on its search card (877 sold).
- **Unresolved:** `vendors[].url` https://www.aliexpress.com/item/4000049660873.html could not be checked. AliExpress item pages are captcha-blocked, and the 2026-05 and 2026-07 Wayback captures are captcha pages too.
- **Wrong facts:**
  - The entry is the **Orange Pi Zero LTS** (name says "Orange Pi LTS").
  - `wifi: [2.4GHz, 5GHz]`: the official page lists XR819, IEEE 802.11 b/g/n, which is 2.4 GHz only.
  - The official page and Amazon now say AllWinner **H3**, 256MB/512MB. The entry has H2+ (early boards were H2+).

### database/microboards/orange-pi-pc-plus.yaml

- **Changed:** `creator.page` changed from the homepage `http://www.orangepi.org/` to the official product page http://www.orangepi.org/html/hardWare/computerAndMicrocontrollers/details/Orange-Pi-PC-Plus.html (link only).
- **Unresolved, price 24 unsourced:**
  - The official Amazon purchase link https://www.amazon.com/dp/B07ZYLCC6T reads "Currently unavailable. We don't know when or if this item will be back in stock." (B0BB2NL9Q1 is a 404).
  - The official AliExpress items (1005004595413000, 1005011793167546, 1005009280899268) are captcha-blocked and did not appear in search results.
  - Other AliExpress sellers list it at $69–$230.
- **Unresolved, status:** left unset. The board is still on orangepi.org with buy links, but none could be confirmed in stock.
- **Wrong facts:**
  - `wifi: [2.4GHz, 5GHz]`: the PC Plus uses a 2.4 GHz-only RTL8189FTV.
  - `flash: microSD`: it has 8 GB eMMC.

### database/microboards/pocketbeagle.yaml

- **Changed:** `creator.page` moved from `http://beagleboard.org/pocket` to https://www.beagleboard.org/boards/pocketbeagle-original (redirect, link only).
- **Unresolved:**
  - Price 25 is unsourced. The buy links (Digi-Key, Mouser, element14/Newark 45AC6372) block scripts. There are no recent Wayback captures. SparkFun and Adafruit have no listing.
  - Status unknown. The page says "Check out PocketBeagle 2, available now!" and keeps buy links. A search snippet says Digi-Key SG marks POCKETBEAGLE-SC-569 "discontinued at Digi-Key", but I could not verify it.

### database/microboards/raspberry-pi-1-model-a.yaml

- **Changed:**
  - `status: active`.
  - Price **20** confirmed.
  - Added `price_source` (Vilros, approved reseller).
- **Source:**
  - Product page (headless Chrome): "Raspberry Pi 1 Model A+ will remain in production until at least January 2030".
  - Vilros Shopify: `sku= RP1A+ price= 20 avail= false`.
  - Adafruit 2266 shows $24.95 with schema `Discontinued`.

### database/microboards/raspberry-pi-1-model-b.yaml

- **Changed:**
  - `status: active`.
  - Price 25 → **29.95**.
  - Added `price_source` (Adafruit 1914, in stock).
- **Source:**
  - "Raspberry Pi 1 Model B+ will remain in production until at least January 2030".
  - Adafruit: "Product ID: 1914 $29.95 … In stock".
  - Vilros: `RP1B+ price= 30 avail= false`.
- **Wrong facts:** `usb: OTG x4`: the four ports are USB 2.0 host ports. The same wording appears on 2B, 2B v1.2 and 3B+.

### database/microboards/raspberry-pi-2-model-b.yaml

- **Changed:**
  - `status: discontinued`.
  - `related` replacement → name "Raspberry Pi 2 Model B v1.3" + product URL.
  - Price **35** kept as the launch price, with `price_source` set to the 2015-02-02 launch post.
- **Source:**
  - Obsolescence notice PDF (`pip-assets…/RP-009284-PC-3-Raspberry Pi 2 Model B revision 1.1, 1.2.pdf`): "Raspberry Pi 2 Model B Rev 1.1, 1.2 … EOL Date 16 Oct 2025 … Last time buy (LTB) Date 28 Nov 2025 … Last time ship (LTS) date 30 June 2026".
  - Product page: "Raspberry Pi 2 revisions 1.1 and 1.2 have now reached end-of-life, with final shipments scheduled for June 2026. For designs requiring Raspberry Pi 2, we recommend revision 1.3".
  - https://www.raspberrypi.com/news/raspberry-pi-2-on-sale/: "Raspberry Pi 2 is now on sale for $35".

### database/microboards/raspberry-pi-2-model-b-v1-2.yaml

- **Changed:**
  - `status: discontinued` (same notice).
  - `related` replacement → v1.3.
  - Price **35** confirmed, with `price_source` set to Vilros.
- **Source:**
  - Same EOL notice as the rev 1.1 entry.
  - Vilros `RP2B price= 35 avail= false` (the listing doesn't state a revision).
  - Adafruit 2358 (v1.2) shows $39.95 with schema `Discontinued`.
- **Wrong facts:** no `release_year` (v1.2 is from 2016).

### database/microboards/raspberry-pi-3-model-a.yaml

- **Changed:**
  - `status: active`.
  - Price **25** confirmed.
  - Added `price_source` (PiShop.us, SC0130(J)).
- **Source:**
  - "will remain in production until at least January 2030".
  - The product brief (April 2024) has no list price.
  - Approved resellers:
    - PiShop.us `product:price:amount 25`, "Out of stock".
    - Adafruit 4027: $25, out of stock.
    - Maker Bright: $26, in stock.
    - SparkFun: $27.50.
    - Vilros: $29.50.

### database/microboards/raspberry-pi-3-model-b.yaml

- **Changed:**
  - `status: active`.
  - Price 35 → **40**.
  - `price_source` now cites the official product brief.
- **Source:**
  - Brief https://pip-assets.raspberrypi.com/categories/532-raspberry-pi-3-model-b/documents/RP-008338-DS-2-raspberry-pi-3-b-plus-product-brief.pdf: "Published October 2025 … List price: $40 … will remain in production until at least January 2028".
  - The product page now says "January 2030".
  - PiShop.us: $40, "IN STOCK".

### database/microboards/raspberry-pi-4-model-b.yaml

- **Changed:**
  - `status: active`.
  - Price **35** (1GB) confirmed.
  - Added `price_source` (official brief).
- **Source:**
  - Brief (Published October 2026): "List price 1GB $35 2GB $67.50 3GB $83.75 4GB $100 8GB $165".
  - "Production lifetime … until at least January 2034". The page reads "From $35".
  - News post of 1 Oct 2026: "Prices for other products, including the 1GB variants of Raspberry Pi 4 … remain unchanged".
- **Wrong facts:** `ram: 1GB or 2GB or 4GB` omits 8GB and the new 3GB.

### database/microboards/raspberry-pi-zero-v1-2.yaml

- **Changed:**
  - `status: discontinued`.
  - `related` replacement → `microboards/raspberry-pi-zero-v1-3`.
  - Price **5** kept as the launch price (`retrieved: '2015-11-26'`, launch post).
- **Source:**
  - https://www.raspberrypi.com/news/zero-grows-camera-connector/ (16 May 2016): "take advantage of the resulting production hiatus to add … a camera connector … we'll be making thousands more each day".
  - Every reseller now lists only "Version 1.3" (SC0019).
  - Launch post: "Raspberry Pi Zero: the $5 computer".
- **Unresolved:** the evidence is moderate. Raspberry Pi never posted an explicit EOL notice for v1.2.

### database/microboards/raspberry-pi-zero-v1-3.yaml

- **Changed:**
  - `status: active`.
  - Price 5 → **10**.
  - Added `price_source` (PiShop.us, SC0019).
- **Source:**
  - "Raspberry Pi Zero will remain in production until at least January 2030". No official price.
  - Approved resellers:
    - PiShop.us: `product:price:amount 10`, "Out of stock".
    - Adafruit 2885: $10, out of stock.
    - Vilros: $10, out of stock.
    - Maker Bright: $11.
    - SparkFun: $14.

### database/microboards/raspberry-pi-zero-w.yaml

- **Changed:**
  - `status: active`.
  - Price 10 → **15**.
  - Added `price_source` (Adafruit 3400, in stock).
- **Source:**
  - "will remain in production until at least January 2030".
  - Adafruit: "Product ID: 3400 $15.00 … In stock".
  - Other approved resellers: Maker Bright $15, Vilros $16.43, SparkFun $16.50, PiShop.us $17.25.
- **Links:** image source OK.

### database/microboards/t-eth-lite.yaml

- **Changed:**
  - `status: active`.
  - Price 15 → **14.88** (ESP32-S3 variant H674).
  - Added `price_source`.
  - `creator.page` changed from `www.lilygo.cc` to `lilygo.cc` (redirect).
- **Source:** Shopify `"ESP32 S3 [H674]" price= 14.88 avail= true`, `"ESP32[H673]" 13.3`, `"POE Shield [H675]" 11.43`.
- **Links:** the GitHub URL in `notes` is OK.
- **Wrong facts:**
  - `cpu: Xtensa LX6` (ESP32-S3 is LX7).
  - `bluetooth: '4.1'` (S3 is BLE 5).
  - `flash: microSD`.
  - The `max_outputs: 8` comment cites classic-ESP32 RMT (S3 has 4 TX channels).
  - Lowercase name.

### database/microboards/teensy-2-0.yaml

- **Changed:**
  - `status: discontinued` confirmed; its comment rewritten in src format.
  - Price **24** confirmed, with `price_source` url added.
- **Source:** "Teensy++ USB Board, Version 2.0 $24 … Inventory Status: Out Of Stock … Teensy++ 2.0 is discontinued. PJRC has no plans to manufacture more Teensy++ 2.0 boards. 32 bit Teensy boards are recommended for new projects". No specific successor is named, so no `related` item.

### database/microboards/teensy-3-2.yaml

- **Changed:**
  - `status: discontinued`.
  - Price 20 → **24.9** (last list price, from Wayback).
  - `related` replacement → `microboards/teensy-4-0`.
- **Source:**
  - Live page: "Teensy 3.2 is Discontinued … We highly recommend migrating to Teensy 4.0". No price is shown.
  - Capture https://web.archive.org/web/20251108111313/https://www.pjrc.com/store/teensy32.html: "Sold Out … Teensy USB Board, Version 3.2 $24.90". It was $23.20 in 2023–2025.

### database/microboards/teensy-3-5.yaml / teensy-3-6.yaml

- **Changed:**
  - `status: discontinued` confirmed; comments rewritten.
  - Prices **32.45 / 38.65** confirmed, with `price_source` url added.
  - `related` replacement → `microboards/teensy-4-1`.
- **Source:** "Development Board Discontinued … $32.45 / $38.65 … These are the very last Teensy 3.5 [3.6]. It will be discontinued when all have sold. We highly recommend migrating to Teensy 4.1 … Inventory Status: Out Of Stock".

### database/microboards/teensy-4-0.yaml

- **Changed:**
  - `status: active`.
  - Price 20 → **23.8**.
  - Added `price_source` (SparkFun DEV-15583).
- **Source:**
  - PJRC page: "SparkFun is now manufacturing Teensy products. You can buy directly at SparkFun." PJRC shows no price.
  - SparkFun: "Teensy 4.0 SKU: DEV-15583 … $23.80 In stock … $21.49 | 25+ units $19.95 | 100+ units".

### database/microboards/teensy-4-1.yaml

- **Changed:**
  - `status: active`.
  - Price **31.5** confirmed (DEV-16771).
  - `creator: PJRC` → object with `page: https://www.pjrc.com/store/teensy41.html` (missing link added).
- **Source:** "Teensy 4.1 SKU: DEV-16771 … $31.50 In stock … $28.49 | 25+ units $26.49 | 100+ units".

### database/microboards/teensy-lc.yaml

- **Changed:**
  - `status: discontinued`.
  - Price 12 → **12.85** (last list price, still shown).
  - `related` replacement → `microboards/teensy-4-0`.
- **Source:** "Unavailable TEENSYLC Teensy-LC USB Board $12.85 Not recommended for new designs … Update: August 15, 2023 : We do not expect to ever have more Teensy LC available. We highly recommend migrating to Teensy 4.0. Inventory Status: Out Of Stock".

### database/microboards/trinket-m0.yaml

- **Changed:**
  - `status: active`.
  - Price 9 → **10.95**.
  - Added `price_source`.
- **Source:** "Product ID: 3500 $10.95 … 1-9 $10.95 10-99 $9.86 100+ $8.76 In stock".
- **Links:** image source OK.

### database/microboards/ttgo-esp32-poe.yaml

- **Changed:**
  - `status: active`.
  - Price 16 → **16.01**.
  - Added `price_source`.
  - `creator.page` replaced with https://lilygo.cc/products/t-internet-poe.
- **Links:** the old `http://www.lilygo.cn/prod_view.aspx?TypeId=50033&Id=1307…` gives 403/"fetch failed"; lilygo.cn is gone.
  - Capture http://web.archive.org/web/20201126221402/http://www.lilygo.cn/prod_view.aspx?TypeId=50033&Id=1307&FId=t3:50033:3 shows "LILYGO® TTGO T-Internet-POE ESP32-WROOM LAN8720A … 上市日期 2020-06-06".
  - The product now lives on lilygo.cc, so the URL was replaced in place (moved).
- **Source:** Shopify `"T-Internet-POE V2 [H438-01]" price= 16.01 avail= true`. With the downloader: $17.62.
- **Note:** the store now sells V2.

### database/microboards/wt32-eth01.yaml

- **Changed:**
  - `status: active`.
  - Price 7 → **10.93**.
  - Added `price_source` (LCSC C477837).
  - `creator.page`: the dead V1.2 datasheet PDF replaced with the live official product page https://en.wireless-tag.com/product-item-2.html, and **the existing `dead_links` item removed** because nothing in the entry uses that URL any more.
- **Links:** I re-checked the old PDF: https gives 404, http gives ECONNRESET. The old archive capture is valid (pdftotext: "WT32-ETH01 DATASHEET Version 1.1").
- **Source:**
  - Wireless-Tag page "WT32-ETH01_Shenzhen Qiming Cloud Technology Co., Ltd." offers "WT32-ETH01_datasheet_V1.4 - en.pdf … 2024-09-19".
  - LCSC `__NEXT_DATA__`: `"productCode":"C477837","productModel":"WT32-ETH01","stockNumber":0 … 1+: 10.9278 | 10+: 10.6500`.
  - AliExpress street price: $4.03–$9.88 across 12 listings with 150+ sold. Recorded in notes.
- **Review:** if you'd rather keep the datasheet link and its archive, revert to the old `creator.page` plus `dead_links`, with `checked` set to 2026-11-18.
- **Wrong facts:** creator name "Shenzhen Qiming Cloud Co., Ltd" (the site says "Shenzhen Qiming Cloud Technology Co., Ltd.").

---

## (a) Files with price / status / related changes

- arduino-mega-2560-rev3, arduino-micro (status only; price re-confirmed), attiny85, beaglebone-black
- ebyte-nrf-52840, esp-01, esp-32s, esp32-poe, esp32-s3-eth, feather-m0-wifi (status only)
- nodemcu-v2, nrf-52840-feather, orange-pi-lts
- raspberry-pi-1-model-a (status), raspberry-pi-1-model-b, raspberry-pi-2-model-b, raspberry-pi-2-model-b-v1-2
- raspberry-pi-3-model-a (status), raspberry-pi-3-model-b, raspberry-pi-4-model-b (status), raspberry-pi-zero-v1-2
- raspberry-pi-zero-v1-3, raspberry-pi-zero-w, t-eth-lite, teensy-2-0 (status comment), teensy-3-2, teensy-3-5
- teensy-3-6, teensy-4-0, teensy-4-1 (status), teensy-lc, trinket-m0, ttgo-esp32-poe, wt32-eth01

All of these also had `price_source` written or bumped.

## (b) Files with ONLY link changes

- orange-pi-pc-plus (homepage → product page)
- pocketbeagle (moved URL)

## (c) Unresolved

- pocketbeagle: price 25 unsourced (distributors block scripts, no archive); status unknown (PocketBeagle 2 promoted; Digi-Key SG reportedly "discontinued at Digi-Key", unverified).
- orange-pi-pc-plus: price 24 unsourced (official Amazon listing "Currently unavailable"; official AliExpress items captcha-blocked; other sellers $69–$230); status unknown.
- orange-pi-lts: `vendors[].url` AliExpress 4000049660873 not verifiable (item pages and their Wayback captures are captchas).
- esp-01, esp-32s, nodemcu-v2: status left unset (generic). Ranges come from search cards (cheapest variant), because AliExpress item pages are captcha-blocked.
- beaglebone-black: price from a 2026-03-10 Wayback capture of Digi-Key (live pages blocked).
- Raspberry Pi 1A+, 1B+, 3A+, Zero, Zero W: Raspberry Pi publishes no list price, so approved-reseller prices are used. US resellers differ by up to $5 (tariffs?).
- raspberry-pi-zero-v1-2: discontinued rests on the 2016 production-switch post, not a formal EOL.
- Link judgement calls to review: ebyte-nrf-52840, ttgo-esp32-poe and wt32-eth01 had dead or homepage-redirecting URLs replaced in place by live official product pages instead of `dead_links`. For wt32-eth01 this removed the old `dead_links` item.

## (d) Wrong facts for other workstreams

- **Bluetooth values:**
  - esp-01 and nodemcu-v2: `bluetooth: '4.1'` on ESP8266 (it has no Bluetooth).
  - esp-32s: `bluetooth: '4.1'` (ESP32 is 4.2).
- **esp-32s creator:** `creator: NodeMCU`; the ESP-32S module is Ai-Thinker's.
- **esp-01 creator:** none (Ai-Thinker).
- **t-eth-lite:**
  - `cpu: Xtensa LX6` for ESP32-S3 (LX7).
  - `bluetooth: '4.1'` (BLE 5).
  - `flash: microSD`.
  - `max_outputs` comment cites classic-ESP32 RMT.
  - Lowercase name.
- **orange-pi-lts:**
  - Is the Orange Pi **Zero** LTS.
  - `wifi` lists 5GHz, but the XR819 is 2.4 GHz only.
  - SoC: current boards are H3 (entry says H2+).
- **orange-pi-pc-plus:**
  - `wifi` lists 5GHz (2.4 GHz only).
  - `flash: microSD` (it has 8 GB eMMC).
- **ebyte-nrf-52840:**
  - `release_year: 2021`, but the E73-2G4M08S1C was announced 2018-08-08.
  - Name could be the module model.
- **Raspberry Pi:**
  - raspberry-pi-4-model-b: `ram` omits 8GB and 3GB.
  - raspberry-pi-1-model-b, 2-model-b, 2-model-b-v1-2, 3-model-b: `usb: OTG x4` (they are USB host ports).
  - raspberry-pi-2-model-b-v1-2: missing `release_year` (2016).
- **attiny85:**
  - A bare chip in microboards.
  - `creator: Atmel` (now Microchip).
- **wt32-eth01:** creator name should be "Shenzhen Qiming Cloud Technology Co., Ltd." (Wireless-Tag).
