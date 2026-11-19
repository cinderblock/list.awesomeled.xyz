# Pixel ICs — data-freshness pass (2026-11-18)

Slice: `database/pixel-ics/*.yaml` (41 entries). All dates read 2026-11-18.

## How the sources were checked

- **LCSC**: product pages fetched with Node; prices from the page's `__NEXT_DATA__` `productPriceList` (USD; `productPrice` = regular, `discountPrice` = sale), stock from `stockNumber`, lifecycle from `productCycle` (`normal` / `sold_out` = page shows "Not recommended for new designs" / `stop_product` = discontinued).
- **C-number discovery**: LCSC search is blocked, so the JLCPCB parts-library API (`jlcpcb.com/api/overseas-pcb-order/v1/shoppingCart/smtGood/selectSmtComponentList`) was searched for every chip; it mirrors LCSC C-numbers. `C99xxxxxxx` rows there are JLC placeholders for customer-supplied parts, not stock.
- **szlcsc.com**: headless search (fresh browser per query; repeat searches hit a login wall). Every unpriced chip came back "未找到相匹配的商品" (no match) or a fuzzy match to an unrelated part (GS8202→GS2202, GS8206→Littelfuse LGS8206AUI, MBI6020→MBR6020, P9813→Knowles 9813, SK6818→SK6812, SM16511→SMA6511, TC2811→L-com TC2881, UCS512B→USI UCS512B4L).
- **Mouser / Digi-Key**: script-blocked; WebSearch found no Mouser/Digi-Key listing for any of the unpriced chips (MBI6020 only at the broker Win Source via Octopart, no price).
- **AliExpress**: headless Chrome search on aliexpress.us; item pages for variant prices until the site started serving its `_____tmd_____/punish` captcha (after ~10 item pages). Street ranges were set only where at least 3 single-part listings with a known lot size exist.

## Entries

### database/pixel-ics/dmx512.yaml

- **Re-confirmed / no change.** No URLs in the entry.
- **Unresolved:** no price. The entry is a generic "DMX512P" protocol IC with no creator or orderable part (UCS512, SM17512, TM512 … are all "DMX512" ICs), so there is nothing specific to price. Status left unset.

### database/pixel-ics/gs8202.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC, szlcsc (fuzzy match to GS2202 only), or AliExpress (no chip listings). Status unset (no maker page found).

### database/pixel-ics/gs8206.yaml

- **No change.** No URLs.
- **Unresolved:** LCSC/JLC only has Littelfuse LGS8206AUI (unrelated, "no longer manufactured"); szlcsc no match; AliExpress one listing ("GS8206 led chip;3-channel constant current LED drive … $230.3", lot size not stated). Fewer than 3 listings, so no street price.

### database/pixel-ics/gs8208.yaml

- **No change.** No URLs (`datasheet.third_party_testing` is a title string, not a URL).
- **Unresolved:** not on LCSC/JLC or szlcsc; AliExpress only has GS8208 LEDs/pixel nodes, no bare IC. Normand (normandled.com) sells GS8208 LED strips only.
- **Wrong fact:** creator disagrees with `pixels/gs8208.yaml` ("Shenzhen Greesit Technology" here vs "Genesis Systec" there).

### database/pixel-ics/lpd6803.yaml

- **Links:** `https://cdn-shop.adafruit.com/datasheets/LPD6803.pdf` ok (LPD6803 datasheet, 10 pages).
- **Unresolved:** no price: not on LCSC/JLC or szlcsc. AliExpress has only 2 fixed-lot listings (3256811670361288 "10PCS LPD6803S SOP16" $7.05; 3256809577286440 "10 pieces Genuine LPD6803S" $5.08) plus one variable "2pcs-5pcs" listing ($1.31, lot unknown; item pages were captcha-blocked), so under the 3-listing minimum. Notes say "obsolete" but there is no maker EOL evidence, so status left unset.

### database/pixel-ics/lpd8806.yaml

- **Changed:** price none → street range **{amount 0.275, max 2.03}**, `vendor: AliExpress (street)`, url https://www.aliexpress.us/w/wholesale-LPD8806-IC.html.
- **Source (item pages, regular prices, best per-piece lot per seller):**
  - YUXINYUAN 8 Store 3256807198137106 "10PCS New original LPD8806 LPD8806S SOP-16": regular $2.75 / 10 → $0.275 (the $1.09 is the new-shopper deal, ignored)
  - Shop1102133364 3256804833411595 "10PCS/LOT LPD8806S": $3.46 / 10 → $0.346
  - Xin Rong IC 3256812655880859 "10pcs/lot LPD8806": regular $4.80 / 10 → $0.48
  - Shenzhen Jinjiasheng IC 3256808548189146: 50 PCS $26.39 → $0.528 (20 PCS $11.75)
  - Excellent Chips 3256812670596938: 50PCS $32.39 → $0.648 (20PCS $13.72)
  - Silicone Patterned Store 3256812402234460 (same store 3256812465207629): 100PCS $88.76 → $0.888 (5PCS $5.07)
  - WOISN Chip 3256813149427321: 5PCS $5.07 → $1.014 (1PCS $2.02)
  - Shop1102735900 3256811449991928: 20PCS regular $40.66 → $2.03 (its other listing 3256813418429973 is higher still: 20PCS $58.69)
- **Links:** datasheet `https://cdn-shop.adafruit.com/datasheets/lpd8806+english.pdf` ok; `third_party_testing` Wayback capture of texonix.com ok ("Use of LPD8806").
- Status left unset (only brokers sell it; the creator's site was not found).

### database/pixel-ics/mbi6020.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC, szlcsc (MBR6020 fuzzy match), or AliExpress. Octopart lists only Win Source (broker) for MBI6020GP, no price. No Macroblock product page found.

### database/pixel-ics/my9221.yaml

- **Changed:** status → `active` (src http://www.my-semi.com/content/products/product_mean.aspx?id=4, "Products > LED Lighting > MY9221 … 12-Channel LED Driver"). Price none → street range **{amount 0.919, max 2.67}**, `AliExpress (street)`, url https://www.aliexpress.us/w/wholesale-MY9221SS.html.
- **Source (search results; item pages were captcha-blocked, so only listings whose title fixes the lot size were used; regular price = `originalPrice` in the search page's itemList JSON where present, else the shown price):**
  - 3256812669475721 "10Pcs new original MY9221SS SMD SSOP24": $9.19 → $0.919
  - 3256812851037395 "5pcs/lot MY9221SS": regular $5.44 → $1.088
  - 3256812223804506 "(10piece) MY9221SS": $12.15 → $1.215
  - 3256813171043621 "5PCS New/Original MY9221QD … QFN20": $7.02 → $1.404
  - 3256811633326537 "(10piece) MY9221SS": regular $15.94 → $1.594
  - 3256811842744566 "MY9221SS SSOP24 10pcs/lot": $18.09 → $1.809
  - 3256809532633730 "10pcs/lot MY9221SS": regular $20.62 → $2.062
  - 2251832647282296 "1pcs/lot MY9221SS": $2.53
  - 3256812232356168 "5pcs MY9221SS": regular $13.35 → $2.67
- **Wrong fact:** MY-Semi's page says "12-channels (R/G/B x 4)"; the entry has `data.channels: 3`.

### database/pixel-ics/my9231.yaml

- **Changed:** status → `active` (src http://www.my-semi.com/content/products/product_mean.aspx?id=5, "Products > LED Lighting > MY9231 3-Channel LED Driver").
- **Links:** datasheet `http://www.my-semi.com/file/MY9231_BF_0.91.pdf` ok (MY9231 datasheet).
- **Unresolved:** no price: not on LCSC/JLC, szlcsc, Mouser/Digi-Key; AliExpress has one listing (3256809312502134 "1piece Original MY9231SS", $1.71, struck $27).

### database/pixel-ics/my9291.yaml

- **Changed:** status → `active` (src http://www.my-semi.com/content/products/product_mean.aspx?id=6, "MY9291 4 or 3-Channel LED Driver").
- **Unresolved:** no price (same sources as MY9231, nothing found).

### database/pixel-ics/p9813.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC or szlcsc. AliExpress has one fixed-lot listing (2251832773020929 "10pcs/lot P9813 SOP-14", original $11.83 → $1.18/pc); the others don't state a lot size (3256809640561311 "Qixinruite … P9813", original $44.52; 3256812983995871 "Cascading LED Chip P9813", original $44.52) or are multi-part listings/modules. Under the 3-listing minimum.
- **Wrong fact (probable):** creator is "WorldSemi", but the P9813 datasheet (e.g. https://www.electrokit.com/upload/product/41011/41011147/P9813_datasheet.pdf) is headed "DMS MICROELECTRONICS LTD.".

### database/pixel-ics/qed3001.yaml

- **No change.** No URLs; creator Unknown.
- **Unresolved:** no listing anywhere (LCSC/JLC, szlcsc, AliExpress).

### database/pixel-ics/sk6805.yaml

- **Changed:** status → `active`; price none → LCSC tiers 5: 0.0904 / 500: 0.0536 / 6000: 0.048, sku SK6805MICRO-J, part C2909056.
- **Source:** https://www.lcsc.com/product-detail/C2909056.html — "SK6805MICRO-J, OPSCO, SMD,2.7x2.4mm", ladder "5+: 0.0904 | 50+: 0.0708 | 150+: 0.0609 | 500+: 0.0536 | 3000+: 0.0510 | 6000+: 0.0480", stock 95,510.
- Note: the IC is only sold integrated in the LED, so the price is per 2427 LED (matches the entry's SK6805-2427 datasheet). `pixels/sk6805` prices the 1515 (C2890035) instead.
- **Links:** datasheet `https://cdn-shop.adafruit.com/product-files/3484/3484_Datasheet.pdf` ok (SK6805-2427 spec).

### database/pixel-ics/sk6812-5050.yaml

- **Changed:** status → `active`; price none → LCSC tiers 5: 0.0908 / 1000: 0.0528 / 5000: 0.0446, sku SK6812, part C5378720 (same listing as `pixels/sk6812`).
- **Source:** https://www.lcsc.com/product-detail/C5378720.html — "SK6812, OPSCO, SMD-4P,5.4x5mm", ladder "5+: 0.0908 | 50+: 0.0726 | 150+: 0.0634 | 1000+: 0.0528 | 2000+: 0.0473 | 5000+: 0.0446", stock 15,300.
- **Links:** datasheet `https://cdn-shop.adafruit.com/product-files/1138/SK6812+LED+datasheet+.pdf` ok.

### database/pixel-ics/sk6818.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC, szlcsc (fuzzy SK6812) or AliExpress. Normand lists "SK6818-T52491H4RGBWP6-VC-XW-E-A" (24 V RGBW 5249 LED) at https://www.normandled.com/Product/view/id/930.html with no price; Opsco's own catalog (opscoled.com) doesn't show SK6818. Status unset.

### database/pixel-ics/sm16511.yaml

- **No change.** No URLs.
- **Unresolved:** JLC library has SM16511P / PB / PS (C41371569, C41371431, C41371568) but their LCSC pages are "Page Not Found"; szlcsc no match; AliExpress no listings.

### database/pixel-ics/sm16703.yaml

- **Changed:** status → `active`; tiers 10: 0.0446→0.0531, 1000: 0.0285→0.0339, 40000: 0.0213→0.0253; `retrieved` 2026-07-03→2026-11-18; notes record the 7% sale.
- **Source:** https://www.lcsc.com/product-detail/C155753.html — SM16703P SOP-8, "10+: 0.0531 (disc 0.0494) | 100+: 0.0428 | 300+: 0.0377 | 1000+: 0.0339 (disc 0.0316) | 4000+: 0.0274 | 8000+: 0.0258 | 20000+: 0.0255 | 40000+: 0.0253 (disc 0.0236)", stock 38,710, lifecycle normal.

### database/pixel-ics/sm16712.yaml

- **Changed:** price none → street range **{amount 0.46, max 0.94}**, `AliExpress (street)`, url https://www.aliexpress.us/w/wholesale-SM16712.html. No URLs in the entry otherwise.
- **Source (regular = `originalPrice` in the search page's itemList JSON; "Save $X" = original − sale, checked on the first listing):**
  - 3256813121356509 "(10 pieces) SM16712P SM16712 SOP16": original $4.60 (sale $2.99) → $0.46
  - 3256812936366760 "10Pcs/Lot SM16712P SM16712": original $7.78 (sale $6.69) → $0.778
  - 3256812380840008 "(5piece)100% New SM16712P sop-16": $3.81 + "Save $0.89" → original $4.70 → $0.94
- Not on LCSC (JLC lists SM16712P C5452102, but the LCSC page is "Page Not Found") or szlcsc. Status unset.

### database/pixel-ics/sm16716.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC, szlcsc, or AliExpress.

### database/pixel-ics/tc2811.yaml

- **No change.** No URLs; creator Unknown ("WS2811 Clone").
- **Unresolved:** nothing found (szlcsc fuzzy-matched an L-com cable; AliExpress no TC2811 listings).

### database/pixel-ics/tls3001.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC, szlcsc, or AliExpress (only pixel PCBAs).
- **Wrong fact (probable):** creator "Tianli Tech", but datasheet mirrors (datasheetspdf.com #905218) attribute TLS3001 to "TERALANE SEMICONDUCTOR" (Shenzhen).

### database/pixel-ics/tm1803.yaml

- **Changed:** status → `active`; tiers 5: 0.144→0.146, 500: 0.0828→0.0839, 4000: 0.0681→0.069; retrieved bumped.
- **Source:** https://www.lcsc.com/product-detail/C5159541.html — TM1803 SOP-8, "5+: 0.1460 | 50+: 0.1129 | 150+: 0.0964 | 500+: 0.0839 | 2500+: 0.0740 | 4000+: 0.0690", stock 90.

### database/pixel-ics/tm1804.yaml

- **Changed:** status → `active`; tiers 5: 0.1283→0.1318, 500: 0.0738→0.0758, 4000: 0.0607→0.0623; notes record the 5% sale.
- **Source:** https://www.lcsc.com/product-detail/C20622206.html — "TM1804(TA1610B SOP8)", "5+: 0.1318 (disc 0.1253) | … | 500+: 0.0758 (disc 0.0721) | … | 4000+: 0.0623 (disc 0.0592)", stock 1,090. (Original TM1804 DIP-8 C88266: 0 stock.)
- **Links:** datasheet URL loads (200, PDF).
- **Wrong fact:** `http://www.ledlightmake.com/ledlightmake_serv/TM1804%20Datasheet.pdf` is a **TM1803** datasheet ("TM1803 simply datasheet … TM1803 is a 3 bits LED … drive control circuit"), not TM1804.

### database/pixel-ics/tm1809.yaml

- **Changed:** status → `active` (note records the NRND flag). Tiers unchanged at regular price (5: 0.2131, 500: 0.1165, 4000: 0.0977); retrieved bumped; notes record the 3% sale.
- **Source:** https://www.lcsc.com/product-detail/C20622180.html — "TM1809(TA1515)", "5+: 0.2131 (disc 0.2068) | … | 500+: 0.1165 | … | 4000+: 0.0977", page text "2,410 In stock, ships now / Not recommended for new designs / Once stock is depleted, this item will be marked as "Out of Stock."". Original TM1809 SOP-14 C62083 is `stop_product` (discontinued).
- **Unresolved:** is a distributor NRND flag enough for `end-of-life`? Left `active` (it is listed and in stock); your call.

### database/pixel-ics/tm1814.yaml

- **Changed:** status → `active`; tiers 5: 0.1099→0.111, 500: 0.0632→0.0638, 4000: 0.052→0.0525.
- **Source:** https://www.lcsc.com/product-detail/C20622183.html — "TM1814(TA2105B)", "5+: 0.1110 | … | 500+: 0.0638 | … | 4000+: 0.0525", stock 3,125. Original C62614 confirmed `stop_product`, not for sale. TM1814B (C21882349) also in stock, 1,890 pcs.

### database/pixel-ics/tm1829.yaml

- **Changed:** status → `active`; tiers 10: 0.0704→0.0695, 1000: 0.0442→0.0431, 8000: 0.0379→0.0368.
- **Source:** https://www.lcsc.com/product-detail/C52109855.html — "TM1829B-SOP8-TA2105B", "10+: 0.0695 | … | 1000+: 0.0431 | 4000+: 0.0389 | 8000+: 0.0368", stock 50. Original TM1829 C5174518 is `stop_product`.

### database/pixel-ics/tm1914.yaml

- **Changed:** status → `active`; top tier qty 5000→4000 (TM1914A's top break is now 4000+, same $0.0466); prices unchanged; retrieved bumped.
- **Source:** https://www.lcsc.com/product-detail/C5174521.html — TM1914A, "5+: 0.0985 | … | 500+: 0.0566 | 2500+: 0.0499 | 4000+: 0.0466", stock 20,945. Original TM1914 C5174535 still 0 stock with the same ladder (its top break is 5000+), so the existing note stands.

### database/pixel-ics/ucs1903.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC or szlcsc. AliExpress has one bare-chip listing (2255801066341534 "UCS1903BC Patch SOP8 …", $8.42, lot size not stated); the rest are pixel modules.

### database/pixel-ics/ucs1904.yaml

- **No change.** No URLs.
- **Unresolved:** nothing on LCSC/JLC, szlcsc, or AliExpress.

### database/pixel-ics/ucs2903.yaml

- **No change.** No URLs.
- **Unresolved:** not on LCSC/JLC or szlcsc. AliExpress listings don't state lot sizes (3256810248145373 "New/Original UCS2903B … SOP-8", $0.97; 3256811883337040 "UCS2903B SOP-8 SMD", $1.43; 3256809480576174 mixed UCS2904B/UCS2903B 5 pcs $2.13), and item pages were captcha-blocked, so no per-chip price could be confirmed.

### database/pixel-ics/ucs2904.yaml

- **Changed:** price none → street range **{amount 0.438, max 1.334}**, `AliExpress (street)`, url https://www.aliexpress.us/w/wholesale-UCS2904B.html. No URLs in the entry otherwise.
- **Source (search cards, fixed 10-pc lots, regular price):**
  - 3256813180313747 "(10piece)100% New UCS2904B SOP-8": $3.97 + "Save $0.41" → $4.38 → $0.438
  - 3256810233106059 "(10piece)100% New UCS2904B SOP-8": $4.07, struck $4.52 → $0.452
  - 3256806535633547 "10pcs/lot UCS2904B SOP New Original Genuine Ic": $6.67, struck $13.34 (-50%) → $1.334
  - Not used (lot size not fixed): 3256812010891141 ($0.95), 3256809191135509 ("10PCS~100PCS/LOT", $4.99), 3256809480576174 (UCS2904B/UCS2903B mixed).
- Not on LCSC/JLC (only a C99 placeholder) or szlcsc. Status unset.
- **Possible wrong fact:** `other_links` is "SM16704 Pixel Protocol Overview", not UCS2904 (may be deliberate if Advatek groups them).

### database/pixel-ics/ucs512b.yaml

- **No change.** No URLs.
- **Unresolved:** nothing on LCSC/JLC, szlcsc (only USI "UCS512B4L", a different part), or AliExpress (only DMX address writers).

### database/pixel-ics/ucs8903.yaml

- **Links:** dead link re-confirmed: the DHgate URL returns **HTTP 410** "This item doesn't exist" in headless Chrome (plain fetch now gets an Akamai 403). Still no Wayback capture (CDX empty, `wayback/available` empty). `checked` 2026-07-03 → 2026-11-18. No other change.
- **Unresolved:** no price (nothing on LCSC/JLC, szlcsc, AliExpress).
- **Wrong fact:** `datasheet.url` is a DHgate store listing, not a datasheet (a UCS8903 datasheet exists at e.g. https://www.ledyilighting.com/wp-content/uploads/2025/02/UCS8903-datasheet.pdf).

### database/pixel-ics/ucs8904.yaml

- **No change.** No URLs.
- **Unresolved:** nothing on LCSC/JLC, szlcsc, or AliExpress.

### database/pixel-ics/ucs9812.yaml

- **No change.** No URLs.
- **Unresolved:** nothing on LCSC/JLC, szlcsc, or AliExpress.

### database/pixel-ics/ws2801.yaml

- **Changed:** status → `active`; tiers 5: 0.2715→0.2718, 500: 0.1592→0.1572, 6000: 0.1374→0.1349.
- **Source:** https://www.lcsc.com/product-detail/C114580.html — WS2801S SOP-14, "5+: 0.2718 | … | 500+: 0.1572 | 3000+: 0.1433 | 6000+: 0.1349", stock 2,880. WorldSemi's catalog (https://www.world-semi.com/products-led-driver-ic.html) lists WS2801.
- **Links:** datasheet `https://www.futurlec.com/Others/WS2801.shtml` ok (Futurlec "WS2801 3-Channel Constant Current LED Driver Datasheet" page).

### database/pixel-ics/ws2805.yaml

- **Changed:** status → `active`; tiers 5: 0.1346→0.1592, 500: 0.0835→0.0923, 4000: 0.0712→0.0763.
- **Source:** https://www.lcsc.com/product-detail/C5446697.html — WS2805 SOP-10, "5+: 0.1592 | … | 500+: 0.0923 | 2500+: 0.0816 | 4000+: 0.0763", stock 6,560.

### database/pixel-ics/ws2811-v1-4.yaml

- **No change.** No URLs.
- **Unresolved:** a silicon revision of WS2811, not a separately orderable part, so no price of its own. Status unset.

### database/pixel-ics/ws2811.yaml

- **Changed:** status line now carries the `# src:` evidence (was already `active`); tiers 20: 0.0417→0.0483, 600: 0.0281→0.0325, and the top tier moved 4000: 0.0211 → **20000: 0.0199** (largest break now 20000+, per "MOQ / ~1k / largest").
- **Source:** https://www.lcsc.com/product-detail/C114581.html — WS2811 SOP-8, "20+: 0.0483 | 200+: 0.0382 | 600+: 0.0325 | 4000+: 0.0245 | 8000+: 0.0215 | 20000+: 0.0199", stock 120,800.
- **Links:** datasheet `https://cdn-shop.adafruit.com/datasheets/WS2811.pdf` ok.

### database/pixel-ics/ws2814.yaml

- **Changed:** status → `active`; tiers 5: 0.0962→0.0899, 500: 0.0625→0.0559, 6000: 0.0544→0.0477; added notes "WS2814F (FSOP-8) variant; the SOP-12 WS2814 (C965562) is no longer listed".
- **Source:** https://www.lcsc.com/product-detail/C5446694.html — WS2814F FSOP-8, "5+: 0.0899 | … | 500+: 0.0559 | 3000+: 0.0504 | 6000+: 0.0477", stock 79,595. C965562 (WS2814 SOP-12) now "Page Not Found | LCSC" (JLC: "no longer manufactured"). WorldSemi's catalog lists only WS2814A / WS2814B / WS2814F.
- **Wrong fact:** `physical` says SOP12 / 12 pins; the variants still made (A/C: SOP-8, B: SOP-10, F: FSOP-8) aren't 12-pin.

### database/pixel-ics/ws2818b.yaml

- **Changed:** status → `active`; tiers 10: 0.0728→0.0805, 1000: 0.0472→0.0491, 8000: 0.037→0.0367; notes record the 5% sale. Dead link `checked` 2026-07-01 → 2026-11-18.
- **Source:** https://www.lcsc.com/product-detail/C114582.html — WS2818B SOP-8, "10+: 0.0805 (disc 0.0765) | … | 1000+: 0.0491 (disc 0.0467) | 4000+: 0.0392 | 8000+: 0.0367 (disc 0.0349)", stock 8,040.
- **Links:** `http://www.world-semi.com/technology/details-104-4.html` still 404 (nginx); its archive https://web.archive.org/web/20200720001510/http://www.world-semi.com:80/technology/details-104-4.html verified ("P/N.:WS2818B SOP8 IC … DC12V"). WorldSemi's new site has no per-product page for WS2818B (only the catalog page), so no URL swap.

## Summary lists

### (a) Price / status / related changes

- sm16703.yaml (price, status)
- tm1803.yaml (price, status)
- tm1804.yaml (price, status)
- tm1809.yaml (retrieved only, prices unchanged; status)
- tm1814.yaml (price, status)
- tm1829.yaml (price, status)
- tm1914.yaml (tier qty, status)
- ws2801.yaml (price, status)
- ws2805.yaml (price, status)
- ws2811.yaml (price, status evidence comment)
- ws2814.yaml (price, status, notes)
- ws2818b.yaml (price, status; also dead-link `checked`)
- sk6805.yaml (new price, status)
- sk6812-5050.yaml (new price, status)
- lpd8806.yaml (new street range)
- sm16712.yaml (new street range)
- ucs2904.yaml (new street range)
- my9221.yaml (new street range, status)
- my9231.yaml (status)
- my9291.yaml (status)

### (b) Link-only changes

- ucs8903.yaml (dead link re-checked, `checked` bumped)

### (c) Unresolved

- No price anywhere: dmx512 (generic), gs8202, gs8206, gs8208, mbi6020, my9291, qed3001, sk6818, sm16511, sm16716, tc2811, tls3001, ucs1904, ucs512b, ucs8903, ucs8904, ucs9812, ws2811-v1-4 (revision, not orderable).
- Under 3 AliExpress listings with a known lot size: lpd6803 (2), my9231 (1), p9813 (1), ucs1903 (1), ucs2903 (0).
- AliExpress item pages started returning a captcha partway through; LPD8806 used item-page variant prices, MY9221 / SM16712 / UCS2904 used search-result prices for fixed-lot titles.
- tm1809: LCSC flags TM1809 (TA1515) "Not recommended for new designs" and the original C62083 is discontinued. Left `active`; `end-of-life` is your call.
- Status left unset for the no-maker-evidence chips above (UCS*, GS82xx, LPD*, MBI6020, P9813, QED3001, SK6818, SM165xx/167xx, TC2811, TLS3001, DMX512, WS2811 V1.4).
- sk6805 / sk6812-5050 are priced per integrated LED (the IC isn't sold bare); say if pixel-ICs should stay unpriced instead.

### (d) Wrong facts for other workstreams

- tm1804: datasheet URL serves a TM1803 datasheet.
- ucs8903: `datasheet.url` is a (dead) DHgate listing, not a datasheet.
- my9221: maker says 12 channels (RGB x4); entry has `data.channels: 3`.
- ws2814: package SOP12 / 12 pins, but current WS2814 variants are SOP-8 / SOP-10 / FSOP-8.
- p9813: datasheet credits DMS Microelectronics, entry says WorldSemi.
- tls3001: datasheet mirrors credit Teralane Semiconductor, entry says Tianli Tech.
- gs8208: creator "Shenzhen Greesit Technology" vs `pixels/gs8208` "Genesis Systec".
- ucs2904: `other_links` names the SM16704 overview.
