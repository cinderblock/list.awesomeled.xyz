# Findings: controllers f–k (data-freshness pass, 2026-11-18)

Slice: `database/controllers/[f-k]*.yaml` (21 files). All read on 2026-11-18. Every status line set or confirmed carries a `# src: url | date | note` comment; the one replacement added carries one too. `bunx eslint --fix`, `bunx prettier --write` and `bun run validate controllers` all pass (140/140 valid).

Fetching notes: pixelcontroller.com returns an empty body to Node fetch with a JSON-ish `accept` header, but curl with a browser UA works. autuneertech.com refuses connections (TLS alert in Node, connect failure in curl). Kulp Lights (WooCommerce) prices come from each page's `data-product_variations` JSON (`display_price` = `display_regular_price` everywhere, so no sales).

---

## controllers/f-test.yaml

- **Changes:** status `unknown` → `active`; added `creator.page`; price none → `90` with `price_source`.
- **Source:** https://pixelcontroller.com/store/diy-controllers/85-F-Test.html: "F-Test … USD $90.00 … Out-of-Stock", "Shipping 1-2 weeks". It is listed in both the Pixel Controllers and DIY Controllers categories, not in Discontinued Products.
- **Unresolved:** none. It is out of stock but still listed for sale, so `active` per the conventions.

## controllers/fadecandy.yaml

- **Changes:** status `end-of-life` → `discontinued`; price `25` → `24.95` with `price_source` (Adafruit, part 1689); bumped the existing repo `dead_links.checked` to 2026-11-18; added a `dead_links` item for the commit URL in `technical_notes` (404).
- **Sources:**
  - https://www.adafruit.com/product/1689: "Product ID: 1689 $24.95 … No longer stocked"; JSON-LD `"availability":"http://schema.org/Discontinued"`.
  - https://github.com/scanlime/fadecandy and the commit URL both 404 (GitHub API: repo Not Found). The `scanlime` login now belongs to a different, recently created account (id 188937926).
- **Archives:**
  - Commit: https://web.archive.org/web/20220107030305/https://github.com/scanlime/fadecandy/commit/82ca2b12f177cbbfbd305d349fa9754635b197b7, verified as "Update README.md · scanlime/fadecandy@82ca2b1".
  - Repo: the existing archive (2023-09-23) is still valid ("GitHub - scanlime/fadecandy: Easy to use open source hardware…").
- **Wrong facts:** `notes` ("Please see https://github.com/scanlime/fadecandy to confirm project status") and two `technical_notes` lines point readers at the dead repo and commit. The prose should probably say the repo is gone.

## controllers/falcon-f16v4.yaml

- **Changes:** price `275` → `255` with `price_source`; status `active` confirmed. Link moved: `/store/products/70-f16v4.html` now 301s to `/store/diy-controllers/70-f16v4.html`, so I replaced it in both `creator.page` and `images[].source`.
- **Source:** https://pixelcontroller.com/store/diy-controllers/70-f16v4.html: "USD $255.00 … In Stock". The Ready To Run F16V4 with PSU and enclosure is USD $510.00 (category listing, "Last items in stock").

## controllers/falcon-f16v5.yaml

- **Changes:** price `280` re-confirmed and `price_source` added; status `active` confirmed. Link OK.
- **Source:** https://pixelcontroller.com/store/featured/88-f16v5.html: "F16V5 Pixel Controller … USD $280.00 … In Stock". The Ready To Run version is $540. The vendor page's `<title>` wrongly says "F16V4"; that is a vendor-side issue.

## controllers/falcon-f48.yaml

- **Changes:**
  - Status `active` → `discontinued`.
  - Price `200` → `255` with `price_source`. This is the last list price, still shown on the live page.
  - Added `related` replacement: Falcon F48V5 Differential Controller (name + url, since it isn't in the database).
  - Link: `index.php?id_product=52&controller=product` redirects to the canonical `https://pixelcontroller.com/store/discontinued-products/52-f16v2-beta-board.html`; replaced it. The slug is odd, but the page is "F48 Differential Controller".
- **Sources:**
  - https://pixelcontroller.com/store/19-discontinued-products: "Showing 1-3 of 3 item(s) … Out-of-Stock F16V3 Pixel Controller USD $250.00 … Out-of-Stock F48 Differential Controller USD $255.00 … Out-of-Stock F48V4 Differential Controller USD $230.00".
  - The product page shows "USD $255.00 … Out-of-Stock".
  - https://pixelcontroller.com/store/diy-controllers/96-f48v5.html: "USD $270.00 … In Stock" (includes a $20 tariff charge).
- **Judgment call:** the F48 page doesn't explicitly say "replaced by". I used the vendor's own F48 → F48V4 → F48V5 naming; F48V4 is also discontinued. Drop the replacement item if that is too loose.
- **Wrong facts:** the vendor page says "4 - Dedicated RS-485 outputs", but the entry has `DMX512: 3`. The page also lists a "Wireless ESP-07 Module" (no Wi-Fi in the entry) and "96 Universes of E131/Artnet".

## controllers/falcon-f4v3.yaml

- **Changes:**
  - Status `active` → `discontinued`.
  - Price `200` → `125` from an archived capture: `retrieved: '2021-10-27'`, url = the Wayback capture, notes say it is the last list price.
  - Added `creator.page` = the vendor's live F4v3 support page.
- **Sources:**
  - Store product id 51 (slug "51-f4v2-pixel-controller", title "F4V3 Pixel Controller") is gone: `discontinued-products/51-…` returns 404, and `index.php?id_product=51` 404s.
  - The F4V3 is in none of the store's category listings, including Discontinued Products.
  - https://auschristmaslighting.com/wiki/Falcon-F4v3 lists it under "Discontinued Pixel Controllers".
  - Archive https://web.archive.org/web/20211027063641/https://www.pixelcontroller.com/store/controllers/51-f4v2-pixel-controller.html: "F4V3 Pixel Controller … 4-port Pixel Controller Completely Assembled … This product is no longer in stock … $125.00".
  - Live support page https://pixelcontroller.com/store/content/11-f4v3-pixel-controller (firmware and manual links).
- **No successor named**, so no replacement.
- **Wrong facts:** `outputs.count: 48` and `max_per_output: 340 # 16320 total across 48 outputs` look copied from another board. The vendor capture and the ACL wiki say 4 ports at 1024 pixels per output (320 per output with differential expansion), and the entry's own `related` note says "4 local outputs". `power.voltage.max: 36` conflicts with the wiki's "5V-13V DC" (the ACL table says 5–36 V; needs a primary source).

## controllers/flex-pixel-driver.yaml

- **Changes:** price `80` → `120` with `price_source` (Elation, part FLE768); status `discontinued` confirmed. Link moved: `/flex-pixel-driver-1` 301s to the canonical `/products/flex-pixel-driver-1`; replaced it.
- **Source:** https://www.elationlighting.com/products/flex-pixel-driver-1: "FLEX PIXEL DRIVER 1 Discontinued … SKU: FLE768 … Sale price $0.00 Regular price $120.00". Shopify `.json` gives `price 0.00`, `compare_at_price 120.00`. I recorded the regular price, since the $0 is how Elation marks the item unpurchasable. No successor is named.
- **Wrong facts:** the page describes a DMX device ("separate 3pin terminal blocks for DMX IN and OUT, a 6pin terminal block for LED tape output … up to 432 DMX channels"), but the entry says `inputs.physical.Ethernet: true`. The input should be DMX.

## controllers/fp48f.yaml

- **Changes:**
  - Status `discontinued` confirmed with src.
  - `dead_links` re-checked: bumped `checked` to `'2026-11-18'`, which also quotes the previously unquoted date.
  - Swapped the curated archive from the 2022 shop homepage to the 2023-02-01 capture of the shop's pixel-controller category page, which actually lists "Contrôleur de pixels FP48F". Updated the explanatory comment to match.
- **Sources:** https://go3d.fr/produit/controleur-de-pixels-fp48f/ redirects to www, which returns 404. https://www.go3d.fr/ is now titled "GO3D | Expert anti-nuisibles en Île-de-France…". The product page itself was never captured (CDX).
- **Unresolved:** price `190` has no source. The archived category page shows no prices, and no other listing was found. Left as is.

## controllers/genius-long-range-pixel-controller.yaml

- **Changes:** price `189` → `238.99` (regular) with `price_source`, part GCONTROLLER-LONGRANGE; status `active` confirmed. Link moved: experiencelights.com now 301s to `store.experiencelights.com/long-range-genius-pixel-controller/` (canonical); replaced it.
- **Source:** the store page: "Original price was: $238.99. $214.99 Current price is: $214.99. -10% … In stock". The sale is recorded in notes.
- **Wrong facts:**
  - The page says "Built in 5V 3A Mean Well Power supply. Hooks up directly to high voltage power. 1 Ethernet Port, 10 x RJ45 ports for long range receivers, 2 x RJ45 ports for DMX output". Nothing on it mentions PoE, but the entry has `PoE: true` and the feature "Power over Ethernet (PoE)".
  - The entry has `DMX512: 1`, but the page lists 2 DMX ports.
  - `power.voltage.max: 5` describes the internal PSU, not the input (mains).

## controllers/genius-pro-32-port.yaml

- **Changes:** price `300` → `331.99` (regular) with `price_source`, part GCONTROLLER-PRO-32PORT; status `active` confirmed. Link moved: `experiencelights.com/genius-pro-32-port-controller/#/` now 301s to `store.experiencelights.com/genius-pro-32-port-controller/`; replaced it. Left `creator.url` (https://experiencelights.com, the brand root, which redirects to the store) as is.
- **Source:** the store page: "Original price was: $331.99. $299.99 … -10% … In stock".
- **Wrong facts:** the page says "SD card slot for standalone operation" and "Full range 5V-24V", but the entry has `standalone: false # Falcon Player (FPP)`.

## controllers/hinkspix-pro-v3.yaml

- **Changes:** price `300` → `214.99` with a rewritten `price_source`. The old source was an undated-URL eBay listing; the new one is HolidayCoro, part 930, retrieved 2026-11-18. Status `active` confirmed. Links OK.
- **Sources:**
  - The CPU's own page, https://www.holidaycoro.com/HinksPix-Pro-CPU-for-Flex-Expansion-Boards-V3-p/930.htm, shows "Our Price: $ 999.99 … This product sold as part of the Flex Expansion system or as an option to most Ready2Run controller systems". That is a placeholder.
  - The real price is on the configurator https://www.holidaycoro.com/Flex-Modular-Lighting-Controller-System-p/951.htm: "1 of HinksPix PRO CPU Board V3 - NO TECH SUPPORT & NO WARRANTY [Add $214.99]", "… WITH TECH SUPPORT & 1YR WARRANTY [Add $249.95]", "Usually Ships in 24 Hours".
- **Price choice:** I recorded the board-only, no-support price. The $249.95 option is in notes.

## controllers/k128d-b.yaml

- **Changes:** price `270` → `180` (board only) with `price_source`, part K128D-N-N; status `active` confirmed. Link OK.
- **Source:** https://kulplights.com/product/k128d-b/, variations: None/None $180 in stock; None/32G $197; Black $280/$297 in stock; Green $225/$242 out of stock.

## controllers/k16000s.yaml

- **Changes:** `dead_links.checked` bumped to 2026-11-18. I did not touch status or price.
- **Sources:** autuneertech.com (www and bare) refuses connections, so the link is still dead. The archive (2023-06-04) is verified: "K16000S MADRIX Artnet Addressable LED Controller".
- **Unresolved:**
  - Status `active` is unverified. The creator's site is down. A WebSearch found only marketplace remnants: desertcart mirrors with a nonsensical "73 zł" price, and an expired Newegg "K16" listing.
  - A headless AliExpress search for "K16000S" returned no matching listings. "K16000 madrix controller" returned exactly one listing: a CLAUTOP-style "LED Controller K16000 16,384 Pixels …", shown at $139.95.
  - That is fewer than the 3 listings a street range needs. Price `229` has no source and was left as is.

## controllers/k16a-b.yaml

- **Changes:** price `130` re-confirmed with `price_source` (last list price, board only, part K16A-B-None-None); status `discontinued` confirmed with src. Link (Wired Watts) OK.
- **Sources:**
  - https://www.wiredwatts.com/products/klk16a-bv3: "Discontinued: This product has been discontinued. … Availability: Out of Stock".
  - https://kulplights.com/product/k16a-b/ is still reachable: $130 board only, $230 with BeagleBone Black, every variant "Out of stock". It is not among the 51 products in the kulplights.com shop listing.
- **No vendor-named successor.** Kulp's current K16 / K16-Pro / K16-Max pages don't mention the K16A-B, so I added no replacement.
- **Wrong facts:** `creator.page` points at the reseller (Wired Watts), not the creator. The creator's own page https://kulplights.com/product/k16a-b/ still exists, so another workstream may want to move Wired Watts to `vendors`.

## controllers/k2-pi0.yaml

- **Changes:** price `28` re-confirmed with `price_source`, part K2-Pi0-N-N; status `active` confirmed. Link OK.
- **Source:** https://kulplights.com/product/k2-pi0/: no Pi / no SD $28 "In stock". With a Pi: $45–$77.

## controllers/k32a-b.yaml

- **Changes:**
  - **Removed the `dead_links` item** for https://kulplights.com/product/k32a-b/, per the coordinator's extra check. The URL now answers 200 and shows this product: title "K32A-B – Kulp Lights LLC", canonical is the same URL, JSON-LD Product `"sku":"K32A-B"`, "32 Output String Cape for BeagleBone". So the link is live again, not a placeholder.
  - Price `150` re-confirmed with `price_source` (last list price, board only, part K32A-B-None-None); the old YAML comment "board-only; was $195" moved into notes.
  - Status `discontinued` confirmed with src.
- **Sources:**
  - The kulplights page: "$150.00 – $250.00", all four variants `is_in_stock: false` ("Out of stock"), JSON-LD `OutOfStock`. It is not in the kulplights.com shop listing (51 products) or the Beagle category.
  - https://wiredwatts.com/products/klk32a-b: "Discontinued: This product has been discontinued. … Availability: Out of Stock".
- **No vendor-named successor**, so no replacement. Current lines are K32, K32-Pro and K32-Max.
- **Note:** the `notes` prose ("no longer in the kulplights.com shop") is still accurate; the page is reachable but delisted.

## controllers/k4-pb.yaml

- **Changes:** price `70` → `55` (board only) with `price_source`, part K4-PB-N-N; status `active` confirmed. Link OK.
- **Source:** https://kulplights.com/product/k4-pb/: no PocketBeagle 2 / no SD $55 "In stock". $72–$132 with a PB2 and/or SD.

## controllers/k40d-pb.yaml

- **Changes:** price `115` → `110` (board only) with `price_source`, part K40D-PB-N-N; status `active` confirmed. Link OK.
- **Source:** https://kulplights.com/product/k40d-pb/: no PB2 / no SD $110 "In stock". Range $110–$187.

## controllers/k64d-b.yaml

- **Changes:** price `130` re-confirmed with `price_source`, part K64D-N-N; the YAML comment "board-only per kulplights.com" moved into notes. Status `active` confirmed. Link OK.
- **Source:** https://kulplights.com/product/k64d-b/: None/None $130 "In stock". Range $130–$247 (Green variants out of stock).

## controllers/k8-b.yaml

- **Changes:** price `80` re-confirmed with `price_source`, part K8-B-None-None. The stale comment "$80-$165" is replaced by notes giving the current range, $80–$197. Status `active` confirmed. Links OK (creator.page and image source).
- **Source:** https://kulplights.com/product/k8-b/: None/None $80 "In stock".

## controllers/k8-pb.yaml

- **Changes:** price `90` re-confirmed with `price_source`, part K8-PB-N-N; status `active` confirmed. Link OK.
- **Source:** https://kulplights.com/product/k8-pb/: no PB2 / no SD $90 "In stock". Range $90–$167.

---

## (a) Files with price/status/related changes

- controllers/f-test.yaml: status unknown→active, price none→90.
- controllers/fadecandy.yaml: status end-of-life→discontinued, price 25→24.95.
- controllers/falcon-f16v4.yaml: price 275→255.
- controllers/falcon-f16v5.yaml: price 280 re-confirmed (price_source added).
- controllers/falcon-f48.yaml: status active→discontinued, price 200→255, related replacement F48V5 (name+url).
- controllers/falcon-f4v3.yaml: status active→discontinued, price 200→125 (archived 2021-10-27).
- controllers/flex-pixel-driver.yaml: price 80→120.
- controllers/genius-long-range-pixel-controller.yaml: price 189→238.99 (sale $214.99 in notes).
- controllers/genius-pro-32-port.yaml: price 300→331.99 (sale $299.99 in notes).
- controllers/hinkspix-pro-v3.yaml: price 300→214.99 (eBay source replaced by HolidayCoro).
- controllers/k128d-b.yaml: price 270→180.
- controllers/k16a-b.yaml: price 130 re-confirmed.
- controllers/k2-pi0.yaml: price 28 re-confirmed.
- controllers/k32a-b.yaml: price 150 re-confirmed, dead_links item removed (page live again).
- controllers/k4-pb.yaml: price 70→55.
- controllers/k40d-pb.yaml: price 115→110.
- controllers/k64d-b.yaml: price 130 re-confirmed.
- controllers/k8-b.yaml: price 80 re-confirmed.
- controllers/k8-pb.yaml: price 90 re-confirmed.
- All "confirmed" statuses above also got `# src:` comments: fp48f and flex-pixel-driver (discontinued), the Kulp and Genius `active` lines, falcon-f16v4/f16v5 and hinkspix.

## (b) Files with ONLY link changes

- controllers/fp48f.yaml: dead_links re-checked (`checked` '2026-11-18'), better archive (2023-02 category capture listing the FP48F). Its status line also got a `# src:` comment; there are no price, status or related value changes.
- controllers/k16000s.yaml: dead_links `checked` bumped to '2026-11-18'.
- Link swaps inside files already listed in (a):
  - falcon-f16v4: products/ → diy-controllers/.
  - falcon-f48: index.php → canonical URL.
  - flex-pixel-driver: → /products/.
  - Both genius entries: → store.experiencelights.com.
  - falcon-f4v3 and f-test: added creator.page.
  - fadecandy: new dead_links item for the commit URL.

## (c) Unresolved

- controllers/k16000s.yaml: status `active` unverifiable and price `229` unsourced. The creator's site is down, no authorized seller was found, and only one AliExpress "K16000" listing ($139.95) exists, short of the 3 a street range needs.
- controllers/fp48f.yaml: price `190` unsourced. The vendor is gone, the product page was never archived, and the archived category page has no prices.
- controllers/falcon-f48.yaml: the F48V5 replacement rests on the vendor's version naming, not an explicit "replaced by". Drop it if that's too loose.
- controllers/k16a-b.yaml and k32a-b.yaml: no vendor-named successor. Kulp now sells K16/K16-Pro/K16-Max and K32/K32-Pro/K32-Max, but nothing links them to the A-B boards.

## (d) Wrong facts for other workstreams

- falcon-f4v3:
  - `outputs.count: 48` / `max_per_output: 340` are wrong; it is 4 ports at 1024 px/port (320 with differential expansion) per the vendor capture and ACL wiki.
  - `power.voltage.max: 36` conflicts with the wiki's 5–13 V.
- falcon-f48:
  - Vendor says 4 dedicated RS-485 outputs, but the entry has `DMX512: 3`.
  - The board has an ESP-07 Wi-Fi module, missing from `inputs.physical`.
  - 96 universes.
- flex-pixel-driver: the input is DMX (3-pin DMX IN/OUT), not Ethernet (`inputs.physical.Ethernet: true` is wrong); up to 432 DMX channels.
- genius-long-range-pixel-controller:
  - The vendor page doesn't mention PoE, yet the entry has `PoE: true` and a PoE feature.
  - 2 DMX RJ45 outputs, not 1.
  - It is powered from mains through a built-in 5V 3A Mean Well PSU, so `power.voltage.max: 5` is misleading.
- genius-pro-32-port: the vendor says "SD card slot for standalone operation", but the entry has `standalone: false`.
- k16a-b: `creator.page` is the Wired Watts reseller page; the creator page https://kulplights.com/product/k16a-b/ exists.
- fadecandy: `notes` and `technical_notes` prose still send readers to the deleted GitHub repo and commit.
