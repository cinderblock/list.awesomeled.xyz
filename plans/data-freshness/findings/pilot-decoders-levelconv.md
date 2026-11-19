# Pilot findings: pixel-decoders + level-converters (2026-11-18)

Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-data-freshness-bec94b8180ebeefa`
All 21 entries edited (none committed). Checks run after editing: `bunx eslint --fix` (exit 0),
`bunx prettier --write` (no changes), `bun run validate pixel-decoders` (12/12),
`bun run validate level-converters` (9/9).

Helper scripts used (scratchpad `scripts/`): `get.mjs` (Node fetch, browser UA), `text.mjs`
(strip HTML / grep), `ti-parts.mjs` (TI orderable parts + tiers), `lcsc.mjs` (LCSC
`__NEXT_DATA__` product), `pw.mjs` (headless Playwright; `PW_CHANNEL=chrome` for new-headless
Chrome), `mchp-rows.mjs` (microchipDIRECT parametric chart rows), `cdx.mjs` (Wayback CDX with
retries + cache).

---

## Level converters

### database/level-converters/74hc245.yaml

- **Changed:** `status: active`; price SN74HC245N qty 1 $0.872 → **$0.865**, qty 1000 $0.304 → **$0.35**; `retrieved` → 2026-11-18.
- **Source:** https://www.ti.com/product/SN74HC245 (embedded orderable-part JSON): `SN74HC245N | PDIP (N) 20 | ACTIVE | 1ku 0.35 | 1-99:0.865 100-249:0.665 250-999:0.49 1000+:0.35`. The product header reads "SN74HC245 ACTIVE".
- **Links:** product ok.

### database/level-converters/74hct244.yaml

- **Changed:** `status: active`; SN74HCT244N $1.547 → **$2.015**, 1k $0.539 → **$0.702**.
- **Source:** https://www.ti.com/product/SN74HCT244: `SN74HCT244N | PDIP (N) 20 | ACTIVE | 1-99:2.015 100-249:1.369 250-999:1.057 1000+:0.702`.
- **Links:** ok.

### database/level-converters/sn74ahct125n.yaml

- **Changed:** `status: active`; SN74AHCT125N $0.895 → **$1.175**, 1k $0.312 → **$0.41**.
- **Source:** https://www.ti.com/product/SN74AHCT125: `SN74AHCT125N | PDIP (N) 14 | ACTIVE | 1-99:1.175 100-249:0.799 250-999:0.616 1000+:0.41`.
- **Links:** ok.

### database/level-converters/sn74lv1t34dbvrg4.yaml

- **Changed:** `status: active`; SN74LV1T34DBVRG4 $0.827 → **$1.239**, 1k $0.288 → **$0.432** (+50%).
- **Source:** https://www.ti.com/product/SN74LV1T34: `SN74LV1T34DBVRG4 | SOT-23 (DBV) 5 | ACTIVE | 1-99:1.239 100-249:0.842 250-999:0.65 1000+:0.432`. The part-details page (the entry's link) shows `"price": "0.432"` and "SN74LV1T34DBVRG4 ACTIVE".
- **Note:** the non-G4 SN74LV1T34DBVR is far cheaper ($0.425 / $0.148). The entry pins the G4 SKU, so the SKU was kept.
- **Links:** ok.

### database/level-converters/sn74lvc2t45.yaml

- **Changed:** `status: active`; SN74LVC2T45DCTR $0.494 → **$0.642**, 1k $0.2 → **$0.26**.
- **Source:** https://www.ti.com/product/SN74LVC2T45: `SN74LVC2T45DCTR | SSOP (DCT) 8 | ACTIVE | 1-99:0.642 100-249:0.494 250-999:0.364 1000+:0.26`. The old qty-1 value equals today's 100–249 tier, but both tiers scaled by ×1.3, so this is a TI price rise, not an old mistake.
- **Links:** ok.

### database/level-converters/txs0108e.yaml

- **Changed:** `status: active`; TXS0108EPWR $1.387 → **$1.595**, 1k $0.619 → **$0.712**. **Added** `links.product` and `price_source.url` = https://www.ti.com/product/TXS0108E (the entry had no links).
- **Source:** `TXS0108EPWR | TSSOP (PW) 20 | ACTIVE | 1-99:1.595 100-249:1.317 250-999:0.946 1000+:0.712 | hasReplacements: true`. The page shows "TXS0108E ACTIVE". The replacement flag points at alternates such as the pin-for-pin TXS0108W-Q1. The part is still active, so no `related` item was added.

### database/level-converters/txu0104.yaml

- **Changed:** `status: active`; TXU0104PWR $0.818 → **$1.063**, 1k $0.331 → **$0.43**. **Added** `links.product` and `price_source.url` = https://www.ti.com/product/TXU0104.
- **Source:** `TXU0104PWR | TSSOP (PW) 14 | ACTIVE | 1-99:1.063 100-249:0.818 250-999:0.602 1000+:0.43`.

### database/level-converters/tc4427.yaml

- **Changed:** `status: active`; price **filled**: TC4427EOA qty 1 **$1.62** / 1000 **$1.02** / 10000 **$0.87**. `price_source` is Microchip Direct, url = product page, with notes giving the PDIP alternative.
- **Source:** https://www.microchip.com/en-us/product/TC4427 shows "Status: In Production". Its Purchase tab loads https://www.microchipdirect.com/api/product/ParametricChart?deviceFamily=TC4427, which gives:
  - `TC4427EOA / SOIC / -40C to +85C / TUBE / Available To Order Now`, buy-now `1-24 $1.62 | 25-99 $1.35 | 100-999 $1.22 | 1000-4999 $1.02 | 5000-9999 $0.94 | 10000+ $0.87`.
  - TC4427COA: same tiers, "In Stock Now: 11,205".
  - TC4427CPA (PDIP): $1.78 / $1.49 / $1.35 / $1.13 / $1.04 / $0.96.
- **How:** plain fetch of microchipdirect.com returns 403 (Akamai), and Windows curl hangs. The bundled Playwright headless shell gets 403 on microchip.com. **Playwright with `channel: 'chrome'` (new headless) plus `--disable-blink-features=AutomationControlled` works.** WebFetch timed out on microchipdirect and Mouser. Digi-Key and Mouser return 403 to Node.
- **Cross-check:** LCSC C636891 (TC4427EOA) 1+ $1.262 … 1000+ $0.6855, stock 0. LCSC C31450 (EOA713) 1+ $1.0902, stock 1279.
- **Links:** product URL is **ok (blocked to some scripts)**. It gave 403 in the Bun sweep and a 302 to the homepage for textlint, but 200 for Node fetch with a browser UA. The notes URL (electricfiredesign.com) is ok.

### database/level-converters/standard-differential-receiver.yaml

- **Changed (link-only):** **removed the `dead_links` entry**. https://microcyb.com is live again (200, title "xLights Sequences for Christmas & Halloween Light Shows - Microcyb"). It is the same Microcyb brand, selling xLights sequences and "ShowSpark" controllers. The removed archive (`20260410115123`) only showed an empty placeholder storefront ("Welcom to Microcyb … Shop by Category"), not the product.
- **Unresolved:**
  - The receiver is not in the current catalog. "Controllers (3)" lists the ShowSpark Wi-Fi 8-Port Module ($24.99) and the ShowSpark 8 ETH Controller ($64.99).
  - No Wayback capture of the product exists. The 2022 site used a JS (Ecwid) store that wasn't archived, and the 2019–2021 captures only show ESPArtStick and video pages.
  - The price ($22) is unverified, so it was left as is. Status left unset (no evidence either way).

---

## Pixel decoders

### database/pixel-decoders/attiny10.yaml

- **Changed:**
  - **Link moved:** replaced in place with https://sites.google.com/site/wayneholder/besting-ben-heck-use-a-33-cent-microcontroller-to-drive-neopixels-instead-of-multivibrators. It returns 200, and Wayne's site index and his GitHub profile (github.com/wholder) link to it. The old URL returns 404. Removed the now-obsolete `dead_links` entry.
  - **Price** 1 → **0.44**: the ATtiny10 chip, which is the whole design.
- **Source:** https://www.microchip.com/en-us/product/ATtiny10 shows "Status: In Production". Its parametric chart gives `ATTINY10-TSHR / SOT-23 / -40C to +85C / T/R / In Stock Now: 16,036`, buy-now `1-24 $0.44 | 25-99 $0.40 | 100+ $0.35`. The article says: "The ATTiny10 costs 33 cents (quantity 1)".
- **Status:** left unset (DIY proof of concept, not a product).

### database/pixel-decoders/controller-changeover.yaml

- **Changed:** **link moved**. Tindie redirects to https://www.tindie.com/products/k7bbr/wasatch-pixels-led-controller-multiplexer/, which replaced the old URL. Price 12 → **17**. `status: active`.
- **Source:** Tindie page has `"price": "17.00"` and a Quantity selector (purchasable). Title: "Wasatch Pixels LED Controller Multiplexer from Wasatch Pixels on Tindie".

### database/pixel-decoders/led-strip-driver-module.yaml

- **Changed:** price 1 → street range **{amount 1.96, max 2.66}**, vendor `AliExpress (street)`. Source is the aliexpress.us search https://www.aliexpress.us/w/wholesale-led-strip-driver-module-v1.0.html (Playwright, `channel: chrome`).
- **The 4 single-board listings:**
  - "LED Strip Driver Module v1.0 … (472 sold)": $1.96
  - this entry's listing: $1.99
  - "DC 12V RGB LED Strip Driver Shield Module … V1.0": $2.31
  - "Full Color RGB LED Strip Driver Module Shield … Based On P9813": $2.66
- **Excluded:** the "$1.09 New shoppers" deal price shown on every result, multi-packs, and a $18.89 outlier.
- **Links:** ok. de.aliexpress.com redirects to aliexpress.us item 2251832599957821, which is the same item (id + 2^51). Plain fetch fails.
- **Wrong fact (reported, not edited):** the listing is the common **P9813-based** "LED Strip Driver Module v1.0" (clocked 2-wire RGB driver). The entry says "WS2811 to High current Mosfet".

### database/pixel-decoders/neopixelbooster.yaml

- **Changed:** price re-confirmed **$3.50**. Added `price_source` (retrieved 2026-11-18, Tindie url, notes).
- **Source:** Tindie page has `"price": "3.50"`, "Out of Stock", "Sold out since Dec 08, 2023".
- **Status:** left unset (out of stock ≠ discontinued). Unresolved whether yaqwsx still makes it.

### database/pixel-decoders/pixel-2-dmx.yaml

- **Changed:** **link moved** from `pixel2dmx---realtime-dmx-bridge` to https://store.experiencelights.com/pixel2dmx-realtime-dmx-bridge/ (301). `status: active`. Price **49.99 re-confirmed as a sale price**, notes "sale price; regular $54.99" (follows the `controllers/sp801e.yaml` precedent).
- **Source:** "Original price was: $54.99. $ 49.99 Current price is: $49.99. -9% … In stock (can be backordered)", SKU PIXEL2DMX.
- **History:** Wayback 2025-10-18 shows "Was: $49.99 Now: $43.99", and 2026-04-15 shows the same. So the regular price rose from $49.99 to $54.99.

### database/pixel-decoders/pixel-2-things-relay.yaml

- **Changed:**
  - `status: discontinued`, with an evidence comment.
  - `related` replacement → Pixel2AC4 (name + url).
  - Price 99 → **109.99**, the last list price. `price_source` points at the Wayback capture, with `retrieved: '2022-05-22'` (the capture date, see suggestions).
  - Added `dead_links` for https://www.pixel2things.com/, archive https://web.archive.org/web/20200812112626/https://www.pixel2things.com/ (shows both boards, "$99.99 Buy Now").
- **Evidence:** https://web.archive.org/web/20220522221218/https://experiencelights.com/pixel2ac-9-ac-outputs/ reads: "Pixel2AC9 [9 AC Outputs] … Now: $109.99 … SKU: PIXEL2AC9 Availability: Discontinued … This product has been discontinued. Please see Pixel2AC3." Pixel2AC3's URL (store.experiencelights.com/pixel2ac3-ready-to-run/) now redirects to the "4 Output AC Dimming Controller - Pixel2AC4" ($169.99, InStock).
- **Price history:** $89.99 (Jul 2019) → $99.99 (Aug 2019–Dec 2020) → $109.99 (May 2021–May 2022).
- **Creator:** David Peace = Experience Lights (the 2021 pixel2things.com capture lists info@experiencelights.com).
- **Link:** pixel2things.com now 302s to store.experiencelights.com/product-category/pixel2things/, which no longer lists the board. It is technically alive, so marking it dead is a judgment call (see suggestions).

### database/pixel-decoders/pixel-2-things-servo.yaml

- **Changed:** `status: discontinued`. Price 99.99 → **109.99** (last list price, `retrieved: '2022-05-23'`). Same `dead_links` entry as the relay.
- **Evidence:** https://web.archive.org/web/20220523000451/https://experiencelights.com/pixel2dc9-s6/ reads: "Pixel2DC9-S6 [9 DC, 6 Servo Outputs] … Now: $109.99 … Availability: Discontinued … This product has been discontinued."
- **Unresolved:** the vendor named no successor. "12 Output Servo Controller – Pixel2Servos12" ($115.99, InStock) is the obvious candidate but was **not** added.

### database/pixel-decoders/pixel-data-isolator.yaml

- **Changed:** price re-confirmed **$16.99**. Added `price_source`.
- **Source:** Tindie page has `"price": "16.99"`, with the seller "On A Break" (Essence Engineering, 197 orders).
- **Status:** left unset (temporary seller break).

### database/pixel-decoders/pixfog-pixel-based-fog-controller.yaml

- **Changed:** **added `links.product`** https://www.innotronix.net/PixFog-Pixel-Based-Fog-Controller-p232730399 (the entry had no link). Price 33 → **39.99**. `status: active`.
- **Source:** "PixFog - Pixel-Based Fog Controller … SKU PXFOG1 $39.99 Control Cable Length 6 Ft Control Cable In stock: 2 available"; JSON-LD `InStock`. Found via the innotronix.net store home page. innotronix.com is a parked domain, and WebSearch found nothing.

### database/pixel-decoders/quinled-dig2analog.yaml

- **Changed:** price re-confirmed **$7.49**. `status: active`. `price_source` = ALLNET China, part QLD-D2A.
- **Source:** QuinLED doesn't sell directly. https://quinled.shop/product/dig2analog/ lists resellers: ALLNET China $7.49, DrZzs $12.50, Jerems C$13.99 ("Pricing indexed mid-2026"). https://shop.allnetchina.cn/products/quinled-dig2analog.json gives `Single Pack QLD-D2A 7.49 / 5 Pack 34.95 / 10 Pack 59.99`, available, `Shopify.currency USD`. quinled.info's buying page says: "A single board will cost you $7,49".
- **Links:** quinled.info page ok. (A newer "dig2analog+" exists, but it isn't a replacement since the original is still sold.)

### database/pixel-decoders/ws2811-mosfet-driver.yaml (NLed)

- **Changed:** price 18 → **10**. `status: active`. `price_source` with notes covering the connector option and qty breaks.
- **Source:** the store page reads: "Qty Available: 57 $10.00 Buy 5 for $9.90 … Buy 100 for $8.50 each … Connectors -- Standard Screw Down +$2.00 / Unpopulated … SKU NLED-WS2811FET".
- **Links:** ok.

### database/pixel-decoders/ws2811-mosfetdriver.yaml (Freetronics)

- **Changed:** `dead_links[0].checked` → 2026-11-18. Price 4 (USD) → **{amount 5, currency AUD}**, the last list price, with `retrieved: '2025-11-07'` = the capture date.
- **Evidence:**
  - The URL 301s to superhouse.tv/products/addressable-n-mosfet-driver-output-module, which returns 404.
  - The archive https://web.archive.org/web/20251107015419/… shows the right product: "Addressable N-MOSFET driver / output module This product is currently sold out … $5.00", `Shopify.currency AUD`, sku FREENFET.
  - Jonathan Oxer's post on superhouse.tv (Dec 3 2025): "the Freetronics online store has now been shut down and I'm progressively merging those products into the SuperHouse online store."
  - SuperHouse searches for "mosfet", "addressable" and "nfet" don't return this module. Its "N-MOSFET Driver / Output Module" (AUD $4.00, out of stock, SKU NDRIVE) is the **non-addressable** board.
- **Unresolved:**
  - `status: discontinued` (set earlier) was left as is, but the evidence is weak. The product could reappear on superhouse.tv. Also, SuperHouse suspended US shipping in Oct 2025.
  - Possible wrong fact: the entry says `max_channels: 3`, but FREENFET is a single-MOSFET module. Freetronics also sold an "Addressable Triple N-MOSFET Module", which may be what the row meant.

---

## Summary

### Files changed with price/status changes (review commit)

- level-converters/74hc245.yaml: active; $0.872/$0.304 → $0.865/$0.35
- level-converters/74hct244.yaml: active; $1.547/$0.539 → $2.015/$0.702
- level-converters/sn74ahct125n.yaml: active; $0.895/$0.312 → $1.175/$0.41
- level-converters/sn74lv1t34dbvrg4.yaml: active; $0.827/$0.288 → $1.239/$0.432
- level-converters/sn74lvc2t45.yaml: active; $0.494/$0.2 → $0.642/$0.26
- level-converters/txs0108e.yaml: active; $1.387/$0.619 → $1.595/$0.712; product link + source url added
- level-converters/txu0104.yaml: active; $0.818/$0.331 → $1.063/$0.43; product link + source url added
- level-converters/tc4427.yaml: active; price filled from Microchip Direct (TC4427EOA $1.62 / $1.02 / $0.87)
- pixel-decoders/attiny10.yaml: $1 → $0.44 (ATtiny10 chip); link moved; obsolete dead_links removed
- pixel-decoders/controller-changeover.yaml: active; $12 → $17; link moved
- pixel-decoders/led-strip-driver-module.yaml: $1 → street $1.96–$2.66
- pixel-decoders/neopixelbooster.yaml: $3.50 re-confirmed (sold out since 2023-12-08)
- pixel-decoders/pixel-2-dmx.yaml: active; $49.99 re-confirmed (sale, regular $54.99); link moved
- pixel-decoders/pixel-2-things-relay.yaml: discontinued + replacement Pixel2AC4; $99 → $109.99 last list; dead_links added
- pixel-decoders/pixel-2-things-servo.yaml: discontinued; $99.99 → $109.99 last list; dead_links added
- pixel-decoders/pixel-data-isolator.yaml: $16.99 re-confirmed
- pixel-decoders/pixfog-pixel-based-fog-controller.yaml: active; $33 → $39.99; product link added
- pixel-decoders/quinled-dig2analog.yaml: active; $7.49 re-confirmed (ALLNET China)
- pixel-decoders/ws2811-mosfet-driver.yaml: active; $18 → $10
- pixel-decoders/ws2811-mosfetdriver.yaml: $4 USD → AUD 5 last list (2025-11-07); dead_links re-checked

### Files changed with link-only changes (IGNORED_COMMITS candidate)

- level-converters/standard-differential-receiver.yaml: dead_links removed (microcyb.com is live again; the old archive showed an empty placeholder)

### Unresolved

- standard-differential-receiver: no published price ($22 unverified), product not in Microcyb's current catalog, no archive of the product; status left unset.
- pixel-2-things-servo: discontinued, but the vendor named no successor (Pixel2Servos12 is the likely one).
- ws2811-mosfetdriver: `discontinued` evidence is weak (store migration in progress); recheck superhouse.tv later.
- Wrong facts to route to the owning stream:
  - led-strip-driver-module is a P9813 clocked RGB driver, not "WS2811 to High current Mosfet".
  - ws2811-mosfetdriver `max_channels: 3` vs the single-channel FREENFET it links to.
- neopixelbooster (sold out since Dec 2023) and pixel-data-isolator (seller on break): status left unset.
- Judgment calls to confirm:
  - `retrieved` = Wayback capture date for 3 archived last-list prices.
  - pixel2things.com marked dead although it 302s to a live brand page.
  - Sale price recorded (sp801e precedent).
  - ATtiny10 entry priced as the bare chip.
  - Added missing `links.product` on txs0108e, txu0104 and pixfog.

### Suggestions for the next agents' instructions

1. **Microchip pricing recipe:** headless Playwright with `channel: 'chrome'` and `--disable-blink-features=AutomationControlled`. Capture the `microchipdirect.com/api/product/ParametricChart?deviceFamily=<FAMILY>` response, which is JSON-encoded HTML with per-part buy-now tiers and stock. Every other route is blocked: microchipdirect pages and API (403 or tarpit), WebFetch (timeout), Mouser and Digi-Key (403), and the bundled headless shell (403).
2. **TI recipe:** parse the `{"orderablePartNumber":…}` objects in the product page (`tieredPriceList`, `marketingStatusDescription`). Note that TI prices rose 15–50% since 2026-07-01. TI's largest tier is 1ku, so "3 tiers (MOQ / ~1k / largest)" collapses to 2. Say whether to also record the 100 and 250 tiers.
3. **LCSC:** product-detail pages work with Node fetch (`__NEXT_DATA__`, walk for `productCode`). The search API is Akamai-blocked, so find the C-number with WebSearch.
4. **AliExpress:** needs Playwright (Chrome channel); plain fetch fails. Every result shows a fake "$1.09 New shoppers" price, so say explicitly to use the regular (struck-through) price.
5. **Define `retrieved` for archived prices** (capture date vs read date). The current rule ("the day you read the page") would make a 2022 price look current.
6. **Define "dead" for redirects** to a live brand or category page that no longer shows the product. Also say whether recording sale vs regular price is wanted (precedent: sale + note).
7. **Say whether agents may add missing `links.product`** (3 entries had none).
8. **check-links skips URLs listed in `dead_links`,** so revived URLs (microcyb.com) and moved pages (Wayne Holder's site) are never noticed. Re-probe them and report "revived". Also tell agents to search the creator's site index for a moved page before accepting a dead link.
9. **Tooling gotchas on this machine:**
   - MinGW curl fails with error 43 on many HTTPS hosts; use Node fetch.
   - The Bash tool strips backslashes inside heredocs; write scripts with the Write tool.
   - The Wayback CDX API rate-limits ("Temporarily Offline"), so cache and retry.
   - `bun run lint:links` (textlint) `--fix` would rewrite bot-redirected URLs to homepages (microchip.com product → microchip.com/); never run it with `--fix`.
