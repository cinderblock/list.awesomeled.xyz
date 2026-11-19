# Findings: controllers l–o (2026-11-18)

Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-data-freshness-bec94b8180ebeefa`.
All 26 files in `database/controllers/[l-o]*.yaml` were edited. Nothing is committed.

Checks after editing:

- `bunx eslint --fix database/controllers/[l-o]*.yaml` exited 0. It rewrote "The website" to "The site" and "id" to "ID" inside a quoted note. I reworded that note so it no longer misquotes the page.
- `bunx prettier --check` passed.
- `bun run validate controllers` passed: 135/135 valid, total 140, 0 errors.

Every status I set or confirmed carries a `# src: <url> | <date> | <note>` comment, and so does every replacement I added.

Helper scripts are in the scratchpad `ctrll-scripts/`:

- `get.mjs`: Node fetch with a browser user agent. It prints the redirect chain and the title, greps the stripped text, and saves pages to `ctrll/pages/`.
- `pw.mjs`: headless Chrome with `channel: chrome` and `--disable-blink-features=AutomationControlled`.
- Wayback lookups used the shared `scripts/cdx.mjs`.

---

### database/controllers/led-ethernet-controller-3.yaml

- **Changed:**
  - Price $625 (bare) → named options in EUR excl. VAT: **1024 px €650, 2048 px €950, 4096 px €1,250**.
  - `price_source` added (part `controllerLEC3`).
  - `status: active` confirmed (src).
- **Source:** https://www.ledstripstudio.com/shop/product/led-ethernet-controller-3/
  - WooCommerce variations: `1024 Pixels (6 Art-net universes) €650 excl. VAT`, `2048 Pixels (12 …) €950`, `4096Pixels (24 …) €1 250`.
  - All `is_in_stock: true`, with "In stock Ships within 24 hours".
- **Links:**
  - creator.url and page 301 to the `www.` host. OK.
  - Notes PDF (LEC3HardwareManual.pdf): 200, OK.

### database/controllers/led-ethernet-controller-powered.yaml

- **Changed:**
  - `status` active → **discontinued**.
  - Price $850 → archived named options, EUR excl. VAT: **€850 / €1,125 / €1,400** (1024/2048/4096 px).
  - `price_source` set from the Wayback capture of 2023-12-02.
  - **related replacement → `controllers/led-ethernet-controller-3`**.
- **Evidence:**
  - `https://www.ledstripstudio.com/shop/product/led-ethernet-controller-powered/` now 301s to the LEC 3 page.
  - The product is absent from the shop listing and from `shop/product-sitemap.xml`.
  - The spec PDF says "It's basically LEC 3 with power supply."
  - Last capture: http://web.archive.org/web/20231202085638/https://www.ledstripstudio.com/shop/product/led-ethernet-controller-powered/ reads "LED Ethernet Controller Powered € 850.00 – € 1,400.00 excl. VAT". SKUs: V073 €850, V074 €1,125, V075 €1,400. All in stock.
- **Links:** creator.page (POWERED_LEC_tech_specs.pdf) 200, OK. creator.url OK.
- **Judgement call:** the replacement rests on the vendor's redirect. LED Strip Studio doesn't say "successor" anywhere.
- **The shop's "Powered SPI LED Controller 2" is a different product:** it has 1 output and 1024 px.

### database/controllers/led-player-dmx.yaml

- **Changed:**
  - `status` unknown → **active**.
  - Price $99 → **€99.90 incl. 19% VAT**.
  - `price_source` added (part 150095).
  - **Link moved:** the vendor became Diamex, with url https://www.diamex-shop.de and page https://www.diamex-shop.de/LED-Player-DMX-TPM2-Dateien-von-DMX-gesteuert-abspielen.
- **Source:** "LED-Player-DMX … Artikelnummer: 150095 … 99,90 € inkl. 19% USt., zzgl. Versand Sofort verfügbar".
- **Why the move:** the old led-genial.de URL returns 404. led-genial.de is now a notice page: "Led-Genial.de ist jetzt bei Diamex.de … gesamtes Sortiment … im offiziellen DIAMEX Onlineshop". The same slug resolves on diamex-shop.de.

### database/controllers/led-player-l.yaml

- **Changed:**
  - Price €99 re-confirmed.
  - `price_source` added (part 150188).
  - `status: active` confirmed (src).
  - **Link moved** to https://www.diamex-shop.de/LED-Player-L-fuer-Strips-und-Panels-bis-4096-LEDs, with the vendor set to Diamex.
  - Removed the inline comment "ex 19% VAT". The shop shows the **incl.** VAT price, so the comment was wrong.
- **Source:** "Artikelnummer: 150188 … Ohne USB-Kabel ab 99,00 € inkl. 19% USt., zzgl. Versand Sofort verfügbar".

### database/controllers/led-player-m.yaml

- **Changed:**
  - `status` unknown → **discontinued**.
  - Price $40 → **€49.90 incl. VAT** (archived; retrieved 2022-01-18).
  - **related replacement:** name `LED-Player-ME [2048]`, url https://www.diamex-shop.de/LED-Player-ME-fuer-Stripes-und-Panels-bis-2048-RGB-LEDs.
- **Evidence:**
  - Diamex's ME page says "LED-Player-ME [2048], der Nachfolger des erfolgreichen LED-Player-M" (€59.90, Sofort verfügbar).
  - Captures of the M page:
    - 2022-01-18: "ArtikelNr.: 150043 Lieferzeit : 2 - 5 Werktage ab : 49,90 € inkl. 19% USt."
    - 2022-05-19: "Zur Zeit nicht lieferbar".
    - 2022-10 and 2023-06-03: "Artikel ist nicht mehr lieferbar".
  - The M is not in the current Diamex "Player" category.
- **Links:** the entry has no URLs.

### database/controllers/led-player-s.yaml

- **Changed:**
  - Status comment rewritten into the src format. The status was already discontinued.
  - **dead_links** added for the led-genial URL (404). The archive is the 2017-07-27 capture, taken while the product was for sale.
  - **Price filled: €19.90 incl. VAT** (last list price; retrieved 2017-07-27).
  - **related replacement:** name `LED-Player-S2`, url the 2016 capture of its listing.
- **Evidence:**
  - 2026-04-21 capture: "Produkt-Archiv … Lieferstatus : Artikel ist nicht mehr lieferbar Preis auf Anfrage".
  - 2017-07-27 capture: "ArtikelNr.: 150081 Lieferzeit : 2 - 5 Werktage ab : 19,90 € inkl. 19% USt."
  - By 2019 it sat in the Produkt-Archiv.
  - The S2 listing was titled "LED-Player-S2, next Generation mit mehr Funktionen" (2016-06-20 capture, €24.90).
- **Note:** the S2 is itself "nicht mehr lieferbar" in the 2026-07 capture. Diamex now sells the LED-Player-S3 (€29.90). The S3 page names no predecessor.

### database/controllers/ledmx2-max.yaml

- **Changed:**
  - Price $199 → **$300**.
  - `price_source` added (DMXKING Global Shop, part 0128).
  - `status: active` confirmed (src).
  - **Link moved:** creator.page → https://dmxking.tv/max-series/ledmx2-max.
- **Source:** https://dmxking.shop/products/ledmx2-max (Shopify): "$300.00 USD Regular price … Taxes included. Free shipping, tax & duty paid."
  - `.js` shows `available: true`.
  - NZ price NZD 460.
  - The US distributor DMX Pro Sales lists $240 excl. tax and shipping, available (https://dmxprosales.com/products/dmxking-ledmx2-max).
- **Why the move:** the old dmxking.com/led-pixel-control/ledmx2-max 301s to the generic family page https://dmxking.com/pixel. Product pages now live on dmxking.tv.
- **Judgement call:** the creator's own price is a delivered (DDP) price, about 25% above the distributor's price.

### database/controllers/ledmx4-max.yaml

- **Changed:**
  - Price $299 → **$420**.
  - `price_source` added (part 0129).
  - `status: active` confirmed.
  - **Link moved** → https://dmxking.tv/max-series/ledmx4-max.
- **Source:** https://dmxking.shop/products/ledmx4-max reads "$420.00 USD … tax & duty paid", and the product is available.
- DMX Pro Sales lists it at $389 but has it sold out.

### database/controllers/ledmx4-pro.yaml

- **Changed:**
  - Status comment added (still discontinued).
  - **Link moved** → https://dmxking.tv/discontinued/ledmx4-pro.
  - Price $134 → named options **5V $145 / 12-24V $150**, from `price_source` DMX Pro Sales.
- **Evidence:** DMXking's support site files the product under its "Discontinued" menu (`/discontinued/ledmx4-pro`). The old dmxking.com URL 301s to the generic /pixel page.
- **Price source:** https://dmxprosales.com/products/dmxking-ledmx4-pro.js still lists `5V DMXKING-LEDMX4PRO-5 145 avail false` and `12-24V DMXKING-LEDMX4PRO-1224 150 avail false`.
- No vendor-named successor, so no replacement was added.

### database/controllers/lightboard-mini.yaml

- **Changed:**
  - Status comment added (discontinued).
  - **dead_links** for https://www.rocketlife.com/technology/, archive 20191115023243.
  - Price $40 re-confirmed as the archived MSRP.
  - `price_source` retrieved 2019-11-15.
  - Fixed the creator.page comment, which wrongly said "now redirects to bekonix.com".
- **Evidence:**
  - HTTPS to rocketlife.com fails the TLS handshake (Node ECONNRESET, curl schannel error 35).
  - Plain `http://www.rocketlife.com/technology/` returns **410 Gone**.
  - bekonix.com (200) is an enterprise IoT platform with no hardware for sale.
  - 2019-11-15 capture: "Suggested Retail Price $99 $40 … LightBoard Mini … MSRP: $40 Intro Price: $35 Buy at Amazon".
- **Links:** creator.url bekonix.com OK.

### database/controllers/lightbox.yaml

- **Changed:**
  - Same treatment as LightBoard Mini: status comment, dead_links and the archived MSRP.
  - **$99** re-confirmed ("LightBox … MSRP: $99 Intro Price: $89").

### database/controllers/lightkraken.yaml

- **Changed:** price $69 re-confirmed. `price_source` added.
- **Source:** https://www.tindie.com/products/tinicuro/lightkraken/ shows `"price": "69.00"`, "Out of Stock", "Sold out since Mar 24, 2022". The listing is not retired.
- **Unresolved:**
  - Status left `active` with no src. It is listed but has been unbuyable for 4.5 years.
  - https://www.lightkraken.net returns **502 Bad Gateway** (openresty), and so does `/doku.php`. Wayback shows the DokuWiki live as recently as 2026-05-19.
  - Treated as an outage and left in place.
  - The GitHub repo `tinic/lightkraken` was last pushed 2024-12-25 and is not archived.
- **Links:** vendor url https://www.tindie.com returns 403 (Cloudflare) to scripts. OK (blocked).

### database/controllers/luminaxa.yaml

- **Changed:**
  - Price $50 → **$55.99** (regular price; on sale for $32.99).
  - `price_source` added.
  - `status: active` confirmed.
  - **Product link added:** creator.page was the homepage and is now https://luminxa.com/product/luminxa-controller-only/.
- **Source:**
  - The page reads "Luminxa – Controller Only $55.99 Original price was: $55.99. $32.99 Current price is: $32.99."
  - The WooCommerce Store API shows `is_in_stock: true`.
  - Description: "Luminxa Controller and Charger. No LEDs included … HUGE Rechargeable 3500mah battery".
- **Judgement call:** I mapped the entry to the base "Controller Only" product. The Pro version (E1.31) is $69.99, and the 2.2.2 board is a battery-less ESP32 board.

### database/controllers/m4-pi.yaml

- **Changed:**
  - `status` active → **discontinued**.
  - **dead_links** for the espartstick.ecwid.com page, archive 20240519213626.
  - Price $35 → **$47.99** (archived; retrieved 2024-05-19; part 04255).
- **Evidence:**
  - The Ecwid URL 302s to espartstick.company.site, titled "Not available" ("The website is not available").
  - Microcyb's https://microcyb.com/shop.php?category=LED+pixel+Controller shows "Showing 3 of 3 result(s) in Controllers": the ShowSpark Wi-Fi module at $24.99 and the ShowSpark 8 ETH at $64.99, plus a sequence product.
  - Captures:
    - 2023-11-30: "$35.99 Out of stock", seller Microcyb.
    - 2024-05-19: "04255 $47.99 In stock".
    - 2025-01-21: the store home; the product is gone.

### database/controllers/m4-port-pixel.yaml

- **Changed:**
  - Status comment added (discontinued).
  - The dead_links archive was replaced. The old one, `20260410115123/microcyb.com/index.html`, was the empty placeholder the pilot flagged. The new archive is the 2024-05-19 capture of the same product (Ecwid id 468426786). `checked` bumped to 2026-11-18.
  - Price $35 → **$47.99** (archived).
- **Link:** still dead. The microcyb.com hash URL 301s to `microcyb.com/index.html`, which is **404 "Page Not Found - Microcyb"**.

### database/controllers/m8-port-pixel.yaml

- **Changed:**
  - Status comment added.
  - The dead_links archive was replaced with http://web.archive.org/web/20250621084308/https://espartstick.ecwid.com/M8-PI-Raspberry-Pi-8-Port-Pixel-controller-p471859299.
  - Price $45 → **$76.99** (archived; retrieved 2025-06-21).
- **Captures:**
  - 2024-04-13: "04256 $61.99 In stock".
  - 2025-06-21: "$76.99 In stock".
  - 2026-02-07: the product is gone (store home).

### database/controllers/madrix-nebula.yaml

- **Changed:**
  - `status` unknown → **active**.
  - Price $350 → **$355** (MSRP).
  - `price_source` set: GoKnight, part IA-HW-001018.
- **Source:** https://goknight.com/madrix-lighting-control-ia-hw-001018-madrix-nebula/
  - "MSRP: $355.00 Now: $248.00 (You save $107.00) SKU: IA-HW-001018".
  - BigCommerce data: `instock: true, purchasable: true`.
- MADRIX still lists NEBULA in its current product menu (https://www.madrix.com/products/nebula), with an "Average Hardware Failure … (Last Update: August 2025)" figure.
- LTT-Versand lists €240.68 incl. VAT, "Currently not available".
- **Unresolved:**
  - I couldn't confirm that GoKnight is an authorized dealer. The MADRIX reseller list loads by JS.
  - Music Store (€314.20 per search snippet) is behind a Cloudflare challenge, even with Playwright plus Chrome.

### database/controllers/magwled-1.yaml

- **Changed:**
  - Price $30 → **$29.90**.
  - `price_source` set (part SU-RZMM-NGSU).
  - `status: active` confirmed.
- **Source:** https://magwled.com/products/dgrz-led-cpd-36-1-mini, titled "MagWLED-1 USB-C WLED Controller | ESP32-C3, 5V & 12V". It reads "Regular price $29.90 USD … Add to cart", and Shopify reports `available: true`.
- **Links:** creator.page https://magwled.com/pages/magwled-1 is a setup-guide page for the same product. OK.

### database/controllers/mini-8-port-controller.yaml

- **Changed:**
  - **Link moved:** the old Tindie slug 301s to https://www.tindie.com/products/k7bbr/wasatch-pixels-basic-eight-port-led-controller/. It is the same listing renamed; its reviews go back to Nov 2022.
  - Price $45 → **$43**.
  - `status: active` confirmed.
- **Source:**
  - Tindie `"price": "43.00"`, InStock.
  - Options: "12V Basic Eight PCB + WT32 Module [48 in stock]" (base), 5V −$1, PCB only −$10 / −$11.

### database/controllers/netpixel-mini.yaml, netpixel-one.yaml, netpixel-quad.yaml

- **Changed:** status comment only. All three stay discontinued.
- **Evidence:**
  - https://smartshow.lighting/archive/ lists "Archived User Guides … NetPixel-Quad | NetPixel-ONE NetPixel-OCTO | NetPixel-Mini".
  - The current shop has only Pro-ONE, NetDMX-PoE, VIBE, Pixel Panels/Tubes and accessories.
- **Unresolved:**
  - **No price source.** SmartShow sold these through eBay: its 2020 product pages show only a "Buy on Ebay" button.
  - The eBay item pages (274037107730 for ONE, 273982361910 for Quad) return 403 to Node, headless Chrome and WebFetch, and have **no Wayback captures**. Their status can't be checked, so I left them in place and they stay unverified.
  - Prices $100 / $269 / $140 left unchanged and unverified.

### database/controllers/nled-pixel-controller-electron.yaml

- **Changed:**
  - Price $30 re-confirmed.
  - `price_source` added.
  - `status: active` confirmed.
- **Source:** "Availability: 88 In stock As low as: $30.00 … Pixel Controller Electron + $30.00 … Unpopulated/Solder Pad +$0.00".

### database/controllers/nled-pixel-controller-mini.yaml

- **Changed:**
  - Price $14 → **$13**.
  - `price_source` added.
  - `status: active` confirmed.
- **Source:** "Availability: In stock As low as: $13.00 … Pixel Controller Mini + $13.00".

### database/controllers/octo-mk2.yaml

- **Changed:**
  - Price $330 → **$249**.
  - `price_source` set (ENTTEC, part 71521).
  - `status: active` confirmed.
  - **Link moved:** the old URL 301s twice to https://www.enttec.com/product/led-pixel-control/octo-8-universe-edmx-to-led-pixel-controller/.
- **Source:**
  - JSON-LD `"sku":"71521"`, `"price":"249.00","priceCurrency":"USD","valueAddedTaxIncluded":false`, `InStock`.
  - The page reads "Buy Now $ 249.00 SKU: 71521".
  - The comparison table lists "OCTO MK2 SKU 71521 Viewing" next to a separate "OCTO MK3 SKU 71522".

### database/controllers/orange-pro-plus-32.yaml

- **Changed:**
  - `status` active → **discontinued**.
  - **dead_links** added (product page 404), archive 20260516170006.
  - Price $275 → **INR 25,000** (archived regular price; retrieved 2026-05-16).
- **Evidence:**
  - The product page returns 404.
  - The rebuilt store (https://www.winterlights.in/shop, "Made in India by Motify Innovations") lists only WL48D1, WL8v2, WL16v2 and WL24v3. "Orange" appears nowhere on the shop, catalog or pixel-controllers pages.
  - 2026-05-16 capture: "₹25,000.00 Regular Price ₹21,999.00 Sale Price", JSON-LD `"price":"21999"`, InStock.
- **Judgement call:** the discontinued status rests on the product's absence after a store rebuild. There is no explicit vendor statement.
- **Issue:** `app/lib/currency.ts` has **no INR rate**, so this price won't convert or sort until one is added.

---

## (a) Files with price/status/related changes

- led-ethernet-controller-3: price → EUR options 650/950/1250
- led-ethernet-controller-powered: discontinued, archived EUR 850/1125/1400, replacement → LEC 3
- led-player-dmx: active, EUR 99.90, link moved
- led-player-l: EUR 99 re-confirmed (incl. VAT), link moved
- led-player-m: discontinued, archived EUR 49.90, replacement LED-Player-ME
- led-player-s: price filled with archived EUR 19.90, replacement LED-Player-S2, dead_links
- ledmx2-max: $199 → $300, link moved
- ledmx4-max: $299 → $420, link moved
- ledmx4-pro: $134 → 5V $145 / 12-24V $150, link moved
- lightboard-mini: archived MSRP $40, dead_links
- lightbox: archived MSRP $99, dead_links
- lightkraken: $69 re-confirmed (price_source only)
- luminaxa: $50 → $55.99, product link added
- m4-pi: discontinued, archived $47.99, dead_links
- m4-port-pixel: archived $47.99, archive replaced
- m8-port-pixel: archived $76.99, archive replaced
- madrix-nebula: active, $350 → $355 MSRP
- magwled-1: $30 → $29.90
- mini-8-port-controller: $45 → $43, link moved
- nled-pixel-controller-electron: $30 re-confirmed
- nled-pixel-controller-mini: $14 → $13
- octo-mk2: $330 → $249, link moved
- orange-pro-plus-32: discontinued, archived INR 25,000, dead_links
- netpixel-mini, netpixel-one, netpixel-quad: status evidence comment only (still discontinued); prices untouched

## (b) Files with ONLY link changes

- None.

## (c) Unresolved

- netpixel-mini / netpixel-one / netpixel-quad have no price source. SmartShow sold them via eBay, which blocks scripts, and the listings have no Wayback captures. The eBay links (one/quad) could not be verified.
- lightkraken:
  - Status left `active` with no src. It is listed on Tindie but sold out since 2022-03-24.
  - lightkraken.net returns 502. The site was live in May 2026, so I treated it as an outage.
- madrix-nebula:
  - The price is a dealer-shown MSRP from GoKnight, and the dealer's authorization is unconfirmed.
  - MADRIX publishes no price.
  - Music Store is Cloudflare-blocked.
- ledmx2-max / ledmx4-max:
  - The creator's own US price includes shipping, tax and duty.
  - Distributor prices are lower: $240 and $389.
- orange-pro-plus-32 discontinued status is inferred from catalog absence after a store rebuild.
- led-ethernet-controller-powered replacement is inferred from the vendor's redirect to the LEC 3.
- `app/lib/currency.ts` has no INR rate, which orange-pro-plus-32 now needs.

## (d) Wrong facts for other workstreams

- **lightboard-mini, lightbox:** `inputs.physical.Ethernet: true` is wrong. The RocketLife hardware used Bluetooth BLE + NFC per the archived technology page, and had no Ethernet.
- **led-ethernet-controller-powered:** inputs list only `Wi-Fi: true`.
  - The spec PDF says 2× RJ-45 Ethernet with an internal switch, plus DMX in/out XLR and microSD. It mentions no Wi-Fi.
  - The unit runs on 88–264 VAC mains (PowerCON) and outputs 5 V/10 A per SPI output. The recorded `power` (max 24 V / 20 A) doesn't match.
- **luminaxa:**
  - The vendor spells the name "Luminxa", so the filename and name "Luminaxa" are a typo.
  - `Ethernet: true` should be Wi-Fi.
  - "controlled via Android app" conflicts with the vendor's "No app installation required" (web UI).
- **m4-pi and m4-port-pixel are the same product:** Microcyb M4-PI, Ecwid id 468426786.
  - These are duplicate entries with conflicting specs (`clocked: false` vs `selectable`, and other fields).
  - The name "M4- Pi" is a typo.
- **mini-8-port-controller:**
  - The vendor renamed it "Wasatch Pixels Basic Eight Port LED Controller".
  - It is a WT32-ETH01 (ESP32) running WLED, with Ethernet + Wi-Fi and E1.31 + DDP. So `standalone: false` and the sACN-only protocol list are incomplete.
- **nled-pixel-controller-mini:** `Ethernet: true` / `Art-Net` is wrong. The vendor says it accepts DMX-512 and TTL serial. It has an XLR connector option and no Ethernet.
- **octo-mk2:** `Wi-Fi: true`, `USB: true` and "standalone: Falcon Player (FPP)" don't match ENTTEC's spec.
  - Connectors per ENTTEC: "2 x Network (RJ45) 2 x SPI Output … 1 x Power".
  - Standalone runs ENTTEC's own FX mode, not FPP.
- **led-player-l:** the old price comment said "ex 19% VAT", but Diamex's EUR 99 is incl. VAT. Fixed here.
- **ledmx4-pro:** creator name "DMXKing" vs "DMXking" in the sibling entries. Cosmetic.
- **led-ethernet-controller-3:** the `notes:` field holds only a bare manual URL, not prose.
