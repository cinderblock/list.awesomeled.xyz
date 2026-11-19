# Findings: pixels (2026-11-18)

Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-data-freshness-bec94b8180ebeefa`

31 of 36 entries edited, none committed. Checks after the last edit:

- `bunx eslint --fix database/pixels`: exit 0. A plain `bunx eslint database/pixels` also exits 0.
- `bunx prettier --write database/pixels`: exit 0.
- `bun run validate pixels`: 36/36 valid.

Every status line set or confirmed carries a `# src: url | date | note` comment, per `status-evidence.md` (26 files). No `related` replacement items were added, because no entry was found discontinued with a named successor.

Helper scripts are in the scratchpad `px/` folder:

- `lcsc2.mjs`: LCSC `__NEXT_DATA__`, including `productCycle`.
- `jlc.mjs`: the JLCPCB parts-search API. It works with Node fetch and finds LCSC C-numbers. Ignore its `C99…` "JLCPCB Assembly" rows; their $0.0398/$0.0205 prices are placeholders.
- `ali-search.mjs` and `ali-item.mjs`: headless Chrome. They capture `mtop.aliexpress.pdp` JSON and give per-SKU regular and sale prices from `PRICE.skuIdStrPriceInfoMap`.
- `probe.mjs` and `wb.mjs`: link probes, and Wayback fetches with retry.

**Method notes**

- **LCSC listings marked `productCycle: stop_product` hide the price.** The rendered page shows "Not available now" and no price table, even though `__NEXT_DATA__` still carries tiers. Those hidden tiers were not recorded. Normal listings with 0 stock show "Unit Price (Reference Only)", and those were recorded.
- **AliExpress street ranges** use per-LED regular (struck-through) prices from 100-pc lots, unless noted. They exclude shipping and the "$1.09 new shoppers" price. Each listing is given by item id.
- **Newstar treats these as the same chips under two names:** NS107S = HD107S, NS108 = HD108 and NS8808 = HD8808. Its page titles read "NS107S HD107S 5050 RGB Pixel LED Chip", "NS108 HD108 …" and "NS8808 HD8808 …".

---

### database/pixels/apa102.yaml

- **Changed:**
  - Price re-confirmed, unchanged. `retrieved` 2026-07-03 → 2026-11-18. Notes now say the price is shown "as reference only".
  - `status: active` confirmed, with src.
  - **Removed the `dead_links` item** for neon-world `cid=59&id=167`. The page is live again (200, "APA-109-RGBW - 5050 LED Series - APA ELECTRONIC CO., LTD"). The site is slow and sometimes times out.
- **Source:** https://www.lcsc.com/product-detail/C22439302.html shows APA102-2020 SuperLED (Led-Color), stock 0, cycle normal. Rendered: `1+ $0.0583 | 200+ $0.0233 | 500+ $0.0225 | 1,000+ $0.0221` under "Unit Price(Reference Only)".
- **Status evidence:** https://www.adafruit.com/product/3341, "DotStar Micro LEDs (APA102–2020) … $5.95 In stock".
- **Links:** Adafruit datasheet, pjrc and adafruit/2343 are ok.
- **Wrong facts:**
  - `datasheet.third_party_testing` points at APA's **APA-109-RGBW product page**, which is not third-party testing of the APA102.
  - The image source https://www.adafruit.com/product/2343 is now titled "DotStar Addressable 5050 RGB LED w/ Integrated Driver - 10 Pack [SK9822]". Adafruit switched that SKU to SK9822, so an image credited as APA102 may show an SK9822.

### database/pixels/apa102c.yaml

- **Changed:**
  - Price **filled**: `{amount 0.139, max 0.232}`, vendor `AliExpress (street)`. The url is the search https://www.aliexpress.us/w/wholesale-APA102C.html.
  - `status: active` confirmed, with src.
- **Source (per LED, 5050, regular lot prices):**
  - JIUFENG LIGHTING, 1000 pcs, orig $138.52 (item 3256811831981153; sale $108.05).
  - HUANUOMEI Official, "100pcs/lot", orig $15.27 (3256807987888775).
  - HUANUOMEI, lot of 1000, orig $232.47 (3256808560424329).
  - Excluded 3256808164858318: the title mixes "APA-102C SK9822".
  - Only 3 listings, 2 from the same store.
- **Status evidence:** https://neon-world.com/en/product_detail.php?cid=59&id=115 is "APA-102C-NEW", in APA Electronic's 5050 series list. That list also has APA-102C-65536, APA-102C-8192B and APA102C-NEW-3000K. Newstar also lists "APA102C RGB Pixel LED Chip 5050" (productshow756).
- **Links:** ok.

### database/pixels/apa104.yaml

- **Changed:**
  - `status: active` confirmed, with src.
  - **Removed the `dead_links` item.** http://neon-world.com/en/product_detail.php?cid=60&id=171 is live: 200, "APA-104-3535 12mA - 3535 LED Series - APA ELECTRONIC CO., LTD", with the product description.
- **Status evidence:** https://neon-world.com/en/product.php?cid=59 lists APA-104-22C, APA-104-4RGB and APA-104-4-12V (NEW). The 2020/1515/1212 page lists APA-104-2020-5mA, APA-104A-1212-5mA and others.
- **Unresolved, price:**
  - Not on LCSC or JLC.
  - AliExpress has only APA104 **1212** listings, both from one store (Wushi): 3256802886000836 sells 100/300/700/1000 pcs at regular $33.30/$88.00/$183.00/$250.99; 3256808327410851 sells 4000 pcs.
  - No 5050 listing. Not enough for a street range.

### database/pixels/apa105.yaml

- **Changed (links only):** **removed the `dead_links` item.** http://www.newstar-ledstrip.com/productshow819.html is live (200).
- **Wrong fact:** that page is Newstar's **"New APA105 144LEDs 10mm PCB Pixel LED Strip Lights"**, a strip product page, not a chip datasheet.
- **Unresolved:**
  - No price: not on LCSC or JLC, no AliExpress chip listings.
  - Status unset. Newstar's NS/APA chip catalog no longer lists an APA105 chip; it appears only as strips.

### database/pixels/apa106.yaml

- **Changed:**
  - Price **filled**, per-LED tiers from SparkFun COM-12986: qty 5 $0.95, qty 125 $0.902, qty 500 $0.856.
  - `price_source` set: SparkFun, part COM-12986, notes on pack pricing.
  - `status: active` **set**, with src.
- **Source:** https://www.sparkfun.com/led-rgb-addressable-pth-5mm-diffused-5-pack.html shows "SKU: COM-12986 $4.75 In stock … Available Discounts $4.51 | 25+ units $4.28 | 100+ units". The page's datasheet link, https://cdn.sparkfun.com/datasheets/Components/LED/COM-12877.pdf, is the **APA-106-F8/F5** sheet. SparkFun is preferred over marketplaces under the conventions.
- **Cross-check, AliExpress APA106-F5 street price (not recorded):**
  - 10-pc packs: $0.20–0.30 per LED.
  - 100-pc lots: Ray Wu $14.00, HUANUOMEI $19.25 and ZY LIGHTING $21.68, so $0.14–0.22 per LED.
- **Links:** datasheet4u is ok; it redirects to https://datasheet4u.com/datasheets/ETC/APA-106/1139107 (200, "APA-106 | RGB Lamp Datasheet").

### database/pixels/apa107.yaml

- **Changed:**
  - `status: active` **set**, with src.
  - **Removed the `dead_links` item.** http://newstar-ledstrip.com/productshow816.html is live: "APA107 RGB Pixel LED Chip 5050 … The APA107 upgrade type NS107S is coming".
- **Status evidence:** the page above is in Newstar's Pixel LED Chip > NS/APA list (products.asp?sid=195&tid=274). That list also has APA107 White, 2020 and 3535.
- **Unresolved, price:**
  - Only one AliExpress chip listing: HUANUOMEI "APA107 LED Chip 5050 … 1000pcs/bag", regular $172.50 (sale $167.32), so $0.1725/LED (item 3256807988197328).
  - Other results are HD107S listings. Not on LCSC or JLC (JLC has only a C99 placeholder).

### database/pixels/apa109.yaml

- **Changed:**
  - `status: active` **set**, with src.
  - **Removed the `dead_links` item.** http://neon-world.com/en/product_detail.php?cid=59&id=167 is live, "APA-109-RGBW".
- **Status evidence:** APA's 5050 series lists APA-109-RGBW, APA-109B-RGBW and APA-109-XX.
- **Unresolved, price:** not on LCSC or JLC. The AliExpress "APA109" search returns only Autel car-key cables.

### database/pixels/cs8812.yaml

- **Unchanged.**
- **Links:** the superlightingled PDF is ok (12-page CS8812 datasheet).
- **Unresolved:**
  - No price: not on LCSC or JLC, no AliExpress chip listing.
  - Status: Witop's site has a 2018 post, "DC12V Addressable High Brightness SMD5050 LED Chip – CS8812B". Its 2025 strip product "WS2815/SK6813HV/RT1809/CS8812 30-144Leds" still offers the CS8812 as an option. Left unset.

### database/pixels/gs8208.yaml

- **Changed:** `status: active` confirmed, with src.
- **Status evidence:** https://www.normandled.com/Product/view/id/827.html, "GS8208 LED-Shenzhen Normand Electronic Co.,Ltd", in Normand's LED Chip list. Led-Color also lists "GS8208 12V Digital Pixel Led Chip" (https://www.addressable-led.com/Products/GS8208-IC.html).
- **Links:** the Normand datasheet PDF is ok (GS8208).
- **Unresolved, price:**
  - One AliExpress chip listing only: SHENZHEN RITA LIGHTING "GS8208-12V … 1000pcs/bag" $96.00 regular, so $0.096/LED (item 2251832657161437).
  - Normand and Led-Color quote on inquiry only. JLC has only a C99 placeholder.

### database/pixels/hd107s.yaml

- **Changed:**
  - Price **filled**: `{amount 0.136, max 0.232}`, vendor `AliExpress (street)`. The url is https://www.aliexpress.us/w/wholesale-HD107S.html.
  - `status: active` confirmed, with src.
- **Price source (5050, per LED, 100-pc lots, regular):**
  - Shop1102728385 $13.59 (3256808655385584; no discount shown).
  - nicmet Official $22.10 (2261799828543945; sale $17.90).
  - JIUFENG LIGHTING $23.23 (2255799864109419; sale $19.05).
  - 1000-pc bags: HUANUOMEI $186.98, JIUFENG $174.74 and nicmet $172.77, so $0.173–0.187/LED.
- **Status evidence:** https://www.rose-lighting.com/products/fastest-digital-addressable-rgb-5050led-chip-hd107s/ has schema.org `InStock` and price 0, so no price is shown. That is the creator's page.
- **Links:**
  - rose-lighting.com returned **Cloudflare 522 for the whole site** from about 5:00 to 5:55 PM PST.
  - It was back at 6:07 PM PST (2026-11-19 02:07Z). The datasheet PDF `…/2019/10/0000155-1.pdf` is 200, a 4 MB PDF. **Ok.**
- **Unresolved:** LCSC C1021792 (HD107S-2020, Led-Color) is "Page Not Found" on LCSC; it is a JLC-only part.

### database/pixels/hd108.yaml

- **Changed:**
  - Price **filled**: `{amount 0.273, max 0.312}`, vendor `AliExpress (street)`. The url is https://www.aliexpress.us/w/wholesale-HD108-chip.html.
  - `status: active` **set**, with src.
- **Price source (per LED, 100-pc lots, regular):**
  - Shop1102728385 2020 $27.29 (3256808657160908).
  - JIUFENG LIGHTING 2020 $29.43 (3256808171214274; sale $21.48).
  - Shop1102728385 5050 $31.19 (3256810358521188).
  - Only 3 chip listings exist, 2 from the same store. This is noted in the YAML.
- **Status evidence:** https://www.rose-lighting.com/products/hd108-rgb-5050-pixel-led-chip-with-gray-lever-65536/ has `InStock`, no price. Newstar also lists "NS108 HD108 5050/2020".
- **Links:** the Rose Lighting HD108 PDF is ok (200, after the outage above).

### database/pixels/lc2823-2020.yaml

- **Unchanged.** It has no URLs.
- **Unresolved:** no "LC2823" found anywhere: Led-Color catalog, LCSC/JLC or AliExpress. Price and status left empty.
- **Possible wrong fact:** Led-Color's 2020 6-pin fast chip is the **LC8822 2020** (https://www.addressable-led.com/Products/LC8822-2020-LED.html). The entry name may be a typo.

### database/pixels/lc8808b.yaml

- **Changed:** `status: active` **set**, with src.
- **Status evidence:** https://www.addressable-led.com/Products/DC12V-Pixel-LED-LC8808.html reads "DC12V Pixel LED LC8808 … Dual-Signal … INQUIRY". The entry's datasheet (same site) is the **LC8808B** spec; pdftotext shows "LC8808B".
- **Links:** the datasheet PDF is ok (200).
- **Unresolved, price:**
  - Inquiry only. LCSC C48687401 (LC8808-5050) is "Page Not Found" (JLC-only).
  - No AliExpress listing.
- **Wrong fact (minor):** `creator: Color`. The company is Shenzhen LED Color Co., Ltd. ("Led-Color").

### database/pixels/lc8823.yaml

- **Changed:** `status: active` **set**, with src.
- **Status evidence:** https://www.addressable-led.com/Products/Fast-LED-Chip-LC8823.html, "LC8823 Fast LED Chip … 27KHz PWM … INQUIRY".
- **Unresolved, price:** inquiry only. Not on LCSC (JLC has C99 placeholders) or AliExpress.
- **Possible addition:** the entry has no creator and no links; the official page is the URL above.

### database/pixels/ns107s.yaml

- **Changed:**
  - `status: active` **set**, with src.
  - `dead_links` checked 2026-07-01 → 2026-11-18. The PDF still 404s, and the archive was verified to be the NS107S spec.
- **Status evidence:** http://newstar-ledstrip.com/productshow818.html reads "NS107S HD107S 5050 RGB Pixel LED Chip … NS107S/HD107S is the upgrade type of APA107, PWM refresh rate >26kHz".
- **Unresolved, price:**
  - LCSC **C5138289** (NS107S-2020, Newstar LEDs), stock 0, cycle normal, shows reference prices `1+ $1.4861 | 10+ $1.2583 | 30+ $1.1165 | 100+ $0.9701 | 500+ $0.9053 | 1000+ $0.8766 | 3000+ $0.8645 | 6000+ $0.8570`. That is about 10× HD107S street price, so it was **not recorded (anomalous)**.
  - AliExpress has no "NS107S" listings; the chip is sold as HD107S.
  - Decision needed: record the LCSC reference tiers, or reuse HD107S street price on the basis of Newstar's "NS107S/HD107S" naming?

### database/pixels/ns108.yaml

- **Changed:**
  - `status: active` **set**, with src.
  - **`datasheet.url` changed** from http://newstar-ledstrip.com/productshow848.html to **http://newstar-ledstrip.com/productshow847.html**.
  - **Removed the `dead_links` item.**
- **Why:**
  - productshow848 now returns 302 to `products.asp`, the generic list, so it counts as dead.
  - Every Wayback capture of 848, from 2019-10-24 to 2022-01-28, is the **NS108E** page: "NS108E LED is the economic type of NS108, the PWM is only 4Khz".
  - The NS108 page is productshow847: "NS108/HD108 LED is the upgrade type of NS107S, 16bit RGB Pixel LED Chip 5050". That matches this entry. Newstar also has productshow840 (NS108 HD108 5050) and 845 (2020).
- **Unresolved, price:** no "NS108" listings on AliExpress or LCSC/JLC; it is sold as HD108. Same question as NS107S.

### database/pixels/ns108e.yaml

- **Changed (links only):** **removed the `dead_links` item.** http://newstar-ledstrip.com/product/20191018160652775.pdf is live (200, 896 KB). Page 1 reads "NS108E-5050 … 5.5x5.0x1.6mm Top SMD".
- **Unresolved, status:** **likely discontinued, but left unset.**
  - Its product page (productshow848) now redirects to the product list.
  - It is not in Newstar's 15-item NS/APA chip catalog.
  - No seller was found on LCSC/JLC or AliExpress.
  - Newstar's Alibaba store was not checked.
  - No vendor-named successor. NS108 is the parent part.
- **Unresolved, price:** none found.

### database/pixels/ns8808.yaml

- **Changed:**
  - `status: active` **set**, with src.
  - **Removed the `dead_links` item.** http://newstar-ledstrip.com/productshow855.html is live: "NS8808 HD8808 DC12V Pixel LED Chip replace WS2815".
- **Unresolved, price:** no NS8808 or HD8808 listings on AliExpress, LCSC or JLC.

### database/pixels/pl9823.yaml

- **Changed:**
  - Price **filled**: `{amount 0.14, max 0.258}`, vendor `AliExpress (street)`. The url is https://www.aliexpress.us/w/wholesale-PL9823.html.
  - `status: active` **set**, with src.
  - **Link swap:** `third_party_testing` cpldcpu.wordpress.com → `https://cpldcpu.com/2014/06/16/timing-of-ws2812-clones-pd9823/`. The old URL gives a 301 to it, and the new page is 200 with the same article.
  - **`dead_links` added** for the instructables datasheet, with archive https://web.archive.org/web/20220130150056/https://content.instructables.com/ORIG/FW0/YN1X/IHDUL683/FW0YN1XIHDUL683.pdf and notes on the hotlink protection.
- **Instructables details:** the URL returns **403 to any request not referred from instructables.com**:
  - Node, WebFetch and real headless Chrome all get 403.
  - With `Referer: https://list.awesomeled.xyz/` it is still 403.
  - With `Referer: https://www.instructables.com/` it is 200, a 387,062-byte PDF.
  - The Wayback capture is the same 387,062-byte PDF: BaiCheng "PL9823 Shift register programmable RGB Lamp", distributed by Diamex.
- **Price source (F5 5 mm, 100-pc lots, regular):**
  - Ray Wu's store PL9823-F5 $14.00 (2255800781242981).
  - ZY LIGHTING $21.69 (3256810076401774).
  - Wushi $22.40 (3256806840997254).
  - nicmet $25.22 (2261799822989782).
  - JIUFENG $25.81 (2251832603710986).
  - F8 is $0.14–0.28.
- **Status evidence:** JIUFENG listing 2251832603710986, 11,000+ in stock, plus several other sellers. The creator is unknown, so marketplace listings are the evidence.
- **Wrong fact:** `creator: /`. The datasheet is branded **BaiCheng**.

### database/pixels/sk6805.yaml

- **Changed:**
  - LCSC C2890035 tiers: 5+ 0.0942 → **0.0964**, 500+ 0.0593 → **0.0607**, 4500+ 0.0511 → **0.0523**.
  - `retrieved` → 2026-11-18.
  - Status confirmed, with src.
- **Source:** SK6805-EC15, OPSCO, stock 37,210, cycle normal. Tiers `5+ 0.0964 | 50+ 0.0775 | 150+ 0.0670 | 500+ 0.0607 | 2500+ 0.0552 | 4500+ 0.0523`.
- **Links:** ok. Adafruit 3484 is out of stock, $4.95.

### database/pixels/sk6812-rgbw.yaml

- **Changed:**
  - LCSC C5348912 tiers: 1+ 0.1305 → **0.1357**, 500+ 0.071 → **0.0753**, 1000+ 0.07 → **0.0711**.
  - `retrieved` bumped.
  - Status src added.
- **Source:** SKC6812RGBW-NW, stock 37,000. Tiers `1+ 0.1357 | 10+ 0.1079 | 30+ 0.0940 | 100+ 0.0836 | 500+ 0.0753 | 1000+ 0.0711`.
- **Note:** the existing note "the plain 5050 listing has no price" was not re-verified.

### database/pixels/sk6812.yaml

- **Changed:**
  - LCSC C5378720 tiers: 5+ 0.0892 → **0.0908**, 1000+ 0.0518 → **0.0528**, 5000+ 0.0438 → **0.0446**.
  - `retrieved` bumped.
  - Status src added.
- **Source:** stock 15,300. Tiers `5+ 0.0908 | 50+ 0.0726 | 150+ 0.0634 | 1000+ 0.0528 | 2000+ 0.0473 | 5000+ 0.0446`.
- **Links:** the LCSC datasheet (HTML viewer, 200) and the Pololu PDF are ok.

### database/pixels/sk6813-hv.yaml

- **Changed:**
  - LCSC C5378733 tiers: 5+ 0.1985 → **0.2006**, 1000+ 0.116 → **0.1173**, 5000+ 0.0996 → **0.1007**.
  - `retrieved` bumped. Notes now say "(as reference only)".
- **Source:** stock 0, cycle normal. The rendered page shows "Unit Price(Reference Only)" with the same tiers.
- **Unresolved:** status left unset. The part is listed but out of stock, and there is no Opsco catalog evidence either way.

### database/pixels/sk6813.yaml

- **Unchanged.** It has no URLs.
- **Unresolved:**
  - LCSC/JLC have only SK6813HV and Normand "SK6813-MINI-3535" (C7570424, "Page Not Found" on LCSC).
  - AliExpress has one 5050 listing: SHENZHEN RITA LIGHTING "SK6813; 5.5x5.0x1.6mm", lot of 1000, $66.00, so $0.066/LED (2251832683478905).
  - Newstar lists "EC20 SK6813 2020 Pixel LED chip" (productshow836).
  - No price or status recorded.

### database/pixels/sk6818.yaml

- **Unchanged.**
- **Links:** the Conrad PDF is ok (200).
- **Unresolved:** no seller found on LCSC, JLC or AliExpress. Price and status are empty.
- **Wrong fact:** `datasheet.url` is a 1-page Conrad datasheet for a **Thomsen 5 m RGBW LED strip** that mentions SK6812/SK6818. It is not an SK6818 chip datasheet.

### database/pixels/sk6822.yaml

- **Changed:** `status: active` **set**, with src.
- **Status evidence:** https://www.addressable-led.com/Products/SK6822-Dual-Signal-LED.html, "SK6822 Dual-Signal LED DC5V 5050 SMD LED … INQUIRY".
- **Unresolved, price:**
  - One AliExpress listing only: SHENZHEN RITA LIGHTING "SK6822-RGB … 6pin", lot of 1000, $90.00, so $0.09/LED (3256808858044331).
  - Not on LCSC or JLC.

### database/pixels/sk9822-a.yaml

- **Changed:**
  - Price **filled** from LCSC **C5378730** (SK9822-A, OPSCO, SMD-6P 5x5mm): 5+ $0.1145, 1000+ $0.0687, 5000+ $0.058.
  - `status: active` **set**, with src.
- **Source:** rendered page shows "9,095 In stock, ships now", `5+ $0.1145 | 50+ $0.0907 | 150+ $0.0788 | 1,000+ $0.0687 | 2,000+ $0.0616 | 5,000+ $0.058`. It was found as an LCSC alternate on the SK6813HV page.
- **Other sellers:** Rose Lighting and Normand list SK9822-A too.

### database/pixels/sk9822.yaml

- **Changed:**
  - LCSC C2829089 tiers: 10+ 0.1107 → **0.1125**, 1000+ 0.0677 → **0.0687**, 10000+ 0.0571 → **0.058**.
  - `retrieved` bumped.
  - Status src added.
  - **Link swap:** `third_party_testing` → `https://cpldcpu.com/2016/12/13/sk9822-a-clone-of-the-apa102/`. The old URL gives a 301 to it.
- **Source:** stock 83,520. Tiers `10+ 0.1125 | 100+ 0.0887 | 300+ 0.0768 | 1000+ 0.0687 | 5000+ 0.0616 | 10000+ 0.0580`.
- **Links:** Pololu PDF and adafruit/2343 are ok (Adafruit 2343 now sells SK9822, $4.50, in stock).

### database/pixels/sk9826.yaml

- **Changed (links only):** **removed the `dead_links` item.** http://newstar-ledstrip.com/product/20190927165451294.pdf is live (200, 754 KB). It reads "SK9826 5.5x5.0x1.6mm Top SMD Type … Rev 04 2019-01-12". The old item had no archive.
- **Unresolved:**
  - Status unset. SK9826 is not in Newstar's SK-series chip catalog, which has 12 items: SK6812 variants, SK9822, New SK9822 and EC20 SK6813.
  - No seller found on LCSC, JLC or AliExpress.
  - No price.

### database/pixels/sm1616.yaml

- **Unchanged.** The entry is a name only.
- **Unresolved / wrong fact:** no addressable LED named SM1616 was found. The only "SM1616" parts (JLC: SM1616S QSOP28, SM1616-SOP28) are Sunmoon LED driver ICs, not pixel LEDs. The entry may be a typo, perhaps SM16716 (Sunmoon's APA102-style pixel IC), or should be removed.

### database/pixels/ws2812.yaml

- **Changed:**
  - **SKU switched.** LCSC **C2761795 WS2812B-B/T is now `stop_product`**: the rendered page shows "Not available now" and no price, stock 0.
  - The price now comes from **C114586 WS2812B-B/W**: 5+ $0.1048, 1000+ $0.0617, 5000+ $0.0567. July's B/T prices were 0.1072/0.0664/0.0613.
  - `part`, `url` and `sku` updated, with notes explaining the switch.
  - Status src added.
- **Source:** C114586 has stock 195,250, cycle normal. Tiers `5+ 0.1048 | 50+ 0.0845 | 150+ 0.0741 | 1000+ 0.0617 | 2000+ 0.0587 | 5000+ 0.0567`.
- **Alternatives:** WS2812B-B-V6 (C52941391) is cheaper: 5+ 0.0951, 1000+ 0.0565, 5000+ 0.0472, stock 13,750.
- **Links:** ok. Adafruit 1655 is out of stock, $4.50.

### database/pixels/ws2813.yaml

- **Changed:**
  - LCSC C114592 tiers rose **about 27%**: 5+ 0.1071 → **0.1356**, 1000+ 0.0582 → **0.0737**, 5000+ 0.0484 → **0.0612**.
  - `retrieved` bumped.
  - Status src added.
  - `dead_links` checked → 2026-11-18. The PDF still 404s, and the archive was verified to be the 11-page "WS2813 … NEW STAR LED" datasheet.
- **Source:** WS2813B-B, stock 79,420. Tiers `5+ 0.1356 | 50+ 0.1079 | 150+ 0.0940 | 1000+ 0.0737 | 2000+ 0.0654 | 5000+ 0.0612`.

### database/pixels/ws2815-rgbw.yaml

- **Changed:** `status: active` **set**, with src.
- **Status evidence:** https://www.world-semi.com/products-rgbic-led.html reads "WS2815 Series: 12 V addressable RGB and RGBW LED family". The site's `app.js` model list includes `'WS2815B-RGBW'`, with a product image and configurator entry.
- **Unresolved, price:**
  - LCSC **C19188610** is `stop_product`; the rendered page shows "Not available now" and no price table. Stock is 25.
  - The hidden data has `5+ 0.1737 | 1000+ 0.1016 | 5000+ 0.0875`. It is **not recorded**, because the page does not show it.
  - C42417619 (WS2815B-RGBW-4P) is also `stop_product`. C55821059 (WS2815B-RGBW-V1) is "Page Not Found" on LCSC (JLC-only).
  - No AliExpress chip listing.
- **Links:** the LCSC datasheet URL is ok (HTML viewer, 200).

### database/pixels/ws2815.yaml

- **Changed:**
  - LCSC C5446699 tiers: 5+ 0.1076 → **0.1056**, 1000+ 0.0686 → **0.0658**, 5000+ 0.0592 → **0.0563**.
  - `retrieved` bumped.
  - Status src added.
  - `dead_links` checked bumped. The PDF still 404s, and the archive was verified to be the 8-page "WS2815 Intelligent control LED" datasheet.
- **Source:** WS2815B-V1, stock 405,840.

### database/pixels/ws2816.yaml

- **Changed:**
  - LCSC C4154877 tiers: 5+ 0.1018 → **0.1059**, 500+ 0.0641 → **0.0667**, 4500+ 0.0525 → **0.0546**.
  - `retrieved` bumped.
  - Status src added.
- **Source:** WS2816B-2020, stock 11,800. Tiers `5+ 0.1059 | 50+ 0.0850 | 150+ 0.0745 | 500+ 0.0667 | 2500+ 0.0578 | 4500+ 0.0546`.
- **Possible wrong fact:** WorldSemi's current catalog lists **WS2916A/WS2916B** ("High-grayscale RGB and RGBW"), with image paths under `ws2816-family/ws2816a-package-family.webp`, and no WS2816. The WS2816 may have been renamed WS2916.

### database/pixels/ws2851.yaml

- **Changed (links only):** `dead_links` checked → 2026-11-18. The page still 404s, and the archive (2020-09-20) is titled "WS2851 LED".
- **Unresolved:**
  - Status left unset, **likely discontinued.** WS2851 is absent from WorldSemi's current catalog (`products.js`, `app.js`). It is not on LCSC or JLC, and AliExpress has no listing.
  - No vendor statement found. No price.

---

## (a) Files with price / status / related changes

- apa102: retrieved bump, status src.
- apa102c: price filled, status src.
- apa104: status src.
- apa106: price filled, status set.
- apa107: status set.
- apa109: status set.
- gs8208: status src.
- hd107s: price filled, status src.
- hd108: price filled, status set.
- lc8808b: status set.
- lc8823: status set.
- ns107s: status set.
- ns108: status set.
- ns8808: status set.
- pl9823: price filled, status set.
- sk6805: price.
- sk6812-rgbw: price.
- sk6812: price.
- sk6813-hv: price.
- sk6822: status set.
- sk9822-a: price filled, status set.
- sk9822: price.
- ws2812: price and SKU switch.
- ws2813: price.
- ws2815: price.
- ws2815-rgbw: status set.
- ws2816: price.

Several of these also have link changes: apa102, apa104, apa107, apa109, ns107s, ns108, ns8808, pl9823, sk9822, ws2813, ws2815.

## (b) Files with ONLY link changes

- apa105: dead_links removed.
- ns108e: dead_links removed.
- sk9826: dead_links removed.
- ws2851: dead_links checked bump.

Untouched: cs8812, lc2823-2020, sk6813, sk6818, sm1616.

## (c) Unresolved

- **No price found (not recorded):**
  - apa104: only 1212 listings, 1 store.
  - apa105.
  - apa107: 1 listing, $0.1725.
  - apa109.
  - cs8812.
  - gs8208: 1 listing, $0.096.
  - lc2823-2020.
  - lc8808b and lc8823: inquiry only.
  - ns107s: LCSC C5138289 reference price $1.4861…$0.857, about 10× anomalous.
  - ns108 and ns8808: sold only as HD108/HD8808.
  - ns108e.
  - sk6813: 1 listing, $0.066.
  - sk6818.
  - sk6822: 1 listing, $0.09.
  - sk9826.
  - sm1616.
  - ws2815-rgbw: LCSC listing discontinued, price hidden.
  - ws2851.
- **Decision needed:** may NS107S/NS108/NS8808 reuse HD107S/HD108 prices, given Newstar's own "NS107S HD107S" and "NS108 HD108" naming? Or record the NS107S LCSC reference tiers?
- **Status left unset:**
  - apa105.
  - cs8812.
  - lc2823-2020.
  - **ns108e (likely discontinued):** page gone from catalog, no seller found.
  - sk6813.
  - sk6813-hv: out of stock at LCSC.
  - sk6818.
  - **sk9826 (likely discontinued):** not in Newstar's catalog, no seller found.
  - sm1616.
  - **ws2851 (likely discontinued):** not in WorldSemi's catalog, no seller found.
- **rose-lighting.com outage:** the site (hd107s/hd108 datasheets) was down with Cloudflare 522 for about an hour, then came back by 6:07 PM PST (02:07Z). It is ok now. The automated sweep's CHECKs for it were this outage.
- **Official product pages found, if creator.page should be added:**
  - APA-102C-NEW: neon-world cid=59&id=115.
  - Newstar: APA107 816, NS107S 818, NS108 847, NS8808 855.
  - Led-Color: LC8808, LC8823, SK6822.
  - Normand: GS8208 827.
  - Rose Lighting: HD107S and HD108 product pages.
  - Not added, because pixel entries keep `creator` as a string. Adding pages would turn it into an object.

## (d) Wrong facts for other workstreams

- **apa102:** `datasheet.third_party_testing` is APA's APA-109-RGBW product page, not third-party testing.
- **apa102 image:** the source adafruit.com/product/2343 is now the SK9822 10-pack.
- **apa105:** `datasheet.url` is Newstar's APA105 _LED strip_ page, not a chip datasheet.
- **sk6818:** `datasheet.url` is a Conrad _Thomsen RGBW strip_ datasheet, not an SK6818 chip datasheet.
- **pl9823:** `creator: /`. The datasheet brand is BaiCheng (Diamex distributor).
- **lc8808b:** `creator: Color`. The company is Shenzhen LED Color Co., Ltd. (Led-Color).
- **lc2823-2020:** no such part found. Led-Color's 2020 fast chip is the LC8822.
- **sm1616:** no SM1616 pixel LED exists. The name matches Sunmoon QSOP28 driver ICs. Maybe SM16716, or remove the entry.
- **ns108:** the old datasheet link (productshow848) was always the NS108E page. It was fixed here to the NS108 page (847).
- **NS107S/HD107S, NS108/HD108, NS8808/HD8808:** Newstar sells each pair as one chip under two names. The entries treat them as separate products by different creators (Newstar vs Rose Lighting); they may need cross-links or variant `related` items.
- **ws2816:** WorldSemi's catalog now shows WS2916A/B, with image paths under `ws2816-family`, and no WS2816. It may have been renamed.
- **ws2815-rgbw:** `creator: World Semi`; the other entries spell it "WorldSemi".
