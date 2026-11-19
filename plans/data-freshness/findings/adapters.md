# Adapters findings (2026-11-18)

Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-data-freshness-bec94b8180ebeefa`

41 of the 45 entries were edited, and none are committed. After editing, these all passed: `bunx eslint --fix database/adapters` (exit 0), `bunx prettier --write database/adapters` (no changes), and `bun run validate adapters` (45/45 valid). Every status line I set or confirmed, and every replacement I added, carries a `# src: <url> | <date> | <note>` comment. There are 35 such comments, and all have exactly 3 fields.

Helper scripts are in scratchpad `adp/scripts/`:

- `tindie.mjs`: Tindie JSON-LD, retired status and price-info.
- `woo.mjs`: JSON-LD offers and stock words for WooCommerce, Ecwid and others.
- `wb.mjs`: fetches a Wayback `id_` capture, with retries over http and https.
- `apply.mjs`: applies all the YAML edits as exact-match replacements.

Shared scripts are `scripts/get.mjs`, `text.mjs`, `cdx.mjs` and `pw.mjs`. Raw pages are in `adp/pages`, `adp/wb` and `adp/pw`.

## Conventions applied (judgment calls are flagged ⚑)

- **Out of stock or seller on break:** status left unset, but the regular price is still recorded. This follows the pilot's precedent.
- **Retired product that still shows its price on a live page** (Tindie retired listing, Pimoroni, Hanson): the price is read today, with `retrieved: 2026-11-18`. The notes say "last list price on the retired listing", plus the sold-out date when the page shows one. When the page itself is gone, I used a Wayback capture, with `retrieved` set to the capture date as the addendum requires.
- ⚑ **OSH Park shared projects as the seller.** This applies to the 4 Evil Genius Labs boards and spixels. The creator's own page points buyers to the shared project, so I set `active` and recorded OSH Park's total price for 3 bare PCBs (its minimum order), with a note saying so.
- ⚑ **PCBWay shared projects are not treated the same way.** PCBWay shows no price (only "Add to cart"), so IP67 Controller and WLED shield got no price from PCBWay.

---

## database/adapters/16x-led-shield.yaml

- **Changes:**
  - `status: active` ⚑
  - price $9 → **$15.95** (OSH Park, 3 bare PCBs)
  - `links.product`: Tindie 15247 (retired) → https://www.evilgeniuslabs.org/hexadecimal-nodemcu-32s-wi-fi-and-ble-led-controller ⚑
- **Sources:**
  - https://oshpark.com/shared_projects/dDX67jyf: "NodeMCU-32S 16 Output Level Shifter Shield author: jasoncoon … Total Price: $15.95"
  - Creator page: "Buy For free shipping worldwide, you can order directly from OSH Park: https://oshpark.com/shared_projects/dDX67jyf"
  - Tindie (redirects to jasoncoon/16-output-nodemcu-esp32-wifi-ble-led-controller): "Product Retired This product is no longer available for sale", "Sold out since May 12, 2021", base price $5.32.
  - Wayback 2020-11-11: $9.00 for the PCB, with kit options.
- **Note:** the old $9 was the 2020 Tindie PCB price.

## database/adapters/4x-led-mini-shield.yaml

- **Changes:**
  - `status: active` ⚑
  - $5 → **$5.55** (OSH Park, 3 PCBs)
  - link: Tindie 9723 → https://www.evilgeniuslabs.org/mini-wifi-led-controller
- **Sources:**
  - https://oshpark.com/shared_projects/6tHcl6u3: "Wemos D1 Mini LED & Level Shifter Mini Shield v2.1 … Total Price: $5.55"
  - Tindie: retired, "Sold out since Apr 16, 2021"; the creator page's Buy section points to OSH Park.

## database/adapters/6x-led-shield.yaml

- **Changes:**
  - `status: active` ⚑
  - $8 → **$13.95**
  - link: Tindie 16255 → https://www.evilgeniuslabs.org/hex-wemos-d1-mini-wifi-led-controller
- **Sources:**
  - https://oshpark.com/shared_projects/xeBcFP0G: "Wemos D1 Mini 6x Level Shifter Shield v1.4 … Total Price: $13.95"
  - Tindie: retired, "Sold out since Apr 03, 2021"

## database/adapters/8x-led-shield.yaml

- **Changes:**
  - `status: active` ⚑
  - $7 → **$9.00**
  - link: Tindie 11579 → https://www.evilgeniuslabs.org/level-shifter-featherwing
- **Sources:**
  - https://oshpark.com/shared_projects/M36968Sg: "Level Shifter Featherwing … Total Price: $9.00"
  - Tindie "Octo Level Shifter FeatherWing": retired, "Sold out since May 09, 2021"

## database/adapters/6x-smd-led-shield.yaml

- **Changes:** `status: discontinued`; price $16 re-confirmed (last list price) and `price_source` added.
- **Source:** https://www.tindie.com/products/jasoncoon/smd-6-output-wemos-d1-mini-wi-fi-led-controller/ shows "Product Retired", "Sold out since Jul 25, 2021" and $16.00. A 2020 Wayback capture confirms that $16 bought the "Partially Assembled" board (PCB plus SMD parts).
- **Note:** the creator still shares the bare PCB (OSH Park dNnNjJRk), but the assembled product this entry describes is gone. No successor is named.
- **Link:** Tindie numeric URL left as is (live, retired).

## database/adapters/4-channel-differential-transmitter.yaml

- **Changes:** price $15 → **$11**, `price_source` added (part DD100).
- **Status:** left unset because the item is out of stock.
- **Source:** https://www.wizardofwire.com/product/data-to-differential-board/ shows "Data To Differential Transmitter … $ 11.00 … Out of stock We can email you when stock is available". JSON-LD gives OutOfStock.

## database/adapters/meanwell-pdu-with-differential-receiver.yaml

- **Changes:** `status: active`; $21 re-confirmed (part MWD100).
- **Source:** https://www.wizardofwire.com/product/meanwell-differential-receiver-w-power-injection/ is titled "Original PSU Differential Receiver" and shows "$21.00 … 47 in stock".

## database/adapters/artgateone.yaml

- **Changes (link only):** removed the stray trailing `?` from https://github.com/ArtGateOne/ArtGateOne-DMX.
- **Unresolved:** DIY-only Arduino project with no seller. No price and no status.

## database/adapters/artnet-to-ws2812-1-universe.yaml

- **No change.** The GitHub repo is live. DIY only with no seller, so no price and no status.

## database/adapters/duotrigesimalws28111.yaml

- **Changes:** `status: discontinued`; price $10 re-confirmed (last list price) and `price_source` added.
- **Source:** the GitHub README links Tindie 25767, which redirects to https://www.tindie.com/products/amoscomputing/teensy-41-pixel-pusher/: "Product Retired This product is no longer available for sale", $10.00, "Originally deemed the DuotrigesimalWS2811, the Teensy Pixel Pusher…"
- **Note:** the design files stay open on GitHub.

## database/adapters/esp-level-shifter.yaml

- **Changes:**
  - `status: discontinued`
  - `dead_links` for the Amazon URL (404), with no archive because the CDX API returns zero captures
- **Source:** the Amazon page returns 404. https://acrobotic.com/ says "Archived edition: this site no longer processes orders. Catalog pages are kept for reference." The product isn't in the archived catalog's ESP or WS2812 listings either.
- **Unresolved:** price $9 has no source, so it was left as is. There is no archive of the listing.
- **Wrong fact:** `creator` is missing (it should be ACROBOTIC).

## database/adapters/esp-pixnode-sdcard-adapter.yaml

- **Changes:** `status: discontinued`; `dead_links` added with no archive (no capture of p428060492 exists).
- **Source:** https://web.archive.org/web/20250215152729/https://jboards.ecwid.com/Boards-c61246060 lists only Diff-To-Port, Power Distro and server breakout boards. The Accessories category shows only fuses and terminals. jboards.ecwid.com and jboards.company.site now return 404, and jboards.com is for sale.
- **Unresolved:** price $7 has no source, so it was left as is.

## database/adapters/esp-pixnode.yaml

- **Changes:**
  - `status: discontinued`
  - `dead_links` + archive https://web.archive.org/web/20210123104718/https://jboards.ecwid.com/ESPixNode-p127558674
  - price $13 → **$14** (archived last list price, retrieved 2021-01-23)
- **Source:** the 2021-01-23 capture's JSON-LD reads "ESPixNode … price 14 … OutOfStock". The 2025-08-22 capture reads "Sorry, the requested product is not available". The store now returns 404.
- **Wrong fact:** `creator` is missing (it should be Jboards).

## database/adapters/pixel-string-pihat-zero.yaml

- **Changes:** `status: discontinued`; `dead_links` added with no archive.
- **Source:** the only capture (2025-06-03) reads "Sorry, the requested product is not available". The product is also absent from the 2025-02-15 Boards category, and the store now returns 404.
- **Unresolved:** price $12 has no source, so it was left as is. No capture shows the product.

## database/adapters/esp32-thingplus-dmx-to-led.yaml

- **Changes:**
  - `status: active`
  - $20 → **$18.50** (DEV-15110)
  - link moved: /products/15110 → https://www.sparkfun.com/sparkfun-esp32-thing-plus-dmx-to-led-shield.html
- **Source:** "SKU: DEV-15110 … $18.50 In stock".

## database/adapters/espartstick-wled.yaml

- **Changes:**
  - status `discontinued` confirmed, with an evidence comment
  - `dead_links` archive replaced (the old one was a placeholder of microcyb.com/index.html) with the product capture https://web.archive.org/web/20250621071152/https://espartstick.ecwid.com/WLED-5v-12V-SD-Card-WiFi-EspArtStick-pixel-controller-p170368862
  - `checked` bumped
  - price $24 → **$24.99** (archived, 2025-06-21)
- **Sources:**
  - The capture's JSON-LD: "WLED 5v - 12V SD-Card / WiFi EspArtStick pixel controller … 24.99 … InStock, seller Microcyb".
  - https://microcyb.com/shop.php?category=LED+pixel+Controller: "Showing 3 of 3 result(s) in Controllers", which are the ShowSpark Wi-Fi 8-Port Module ($24.99) and the ShowSpark 8 ETH Controller ($64.99).
  - espartstick.ecwid.com → espartstick.company.site: "The website is not available".
- **Finding:** Microcyb's Ecwid store was espartstick.ecwid.com. Its product pages are archived (2019–2026), which gives the Microcyb entries real archives and last prices.

## database/adapters/m4-port-pixel.yaml

- **Changes:**
  - status evidence added
  - archive → https://web.archive.org/web/20240519213626/https://espartstick.ecwid.com/M4-PI-Raspberry-Pi-4-Port-Pixel-controller-p468426786
  - price $35 → **$47.99** (2024-05-19 capture, InStock)
- **Note:** $35.99 in 2023-11. By the 2025-01 capture the product URL showed only the store front.

## database/adapters/m8-port-pixel.yaml

- **Changes:**
  - status evidence added
  - archive → https://web.archive.org/web/20250621084308/https://espartstick.ecwid.com/M8-PI-Raspberry-Pi-8-Port-Pixel-controller-p471859299
  - price $45 → **$76.99** (2025-06-21 capture, InStock)
- **Note:** price history $56.99 (2023-11), $66.99 (2025-02), $76.99 (2025-06).

## database/adapters/espartstick.yaml

- **Changes:**
  - `status: discontinued`
  - `dead_links` for https://espartstick.ecwid.com/ (now "The website is not available"), archive https://web.archive.org/web/20191021235104/https://espartstick.ecwid.com/
  - price $25 → **$21** (archived 2021-08-03)
- **Source:** the 2019 store page shows "ESP Art Stick 5v pixel enhanced complete $16.99 … ESP Art Stick 12v enhanced complete $25.00". The same product ID p145284289 was renamed "ESP Art Stick 5v/12v WiFi pixel Controller", priced 20 (2020) and then 21 (2021-08-03).
- **Wrong fact:** `creator` is missing (it should be Microcyb). The entry says 5V, but the product was 5V/12V.

## database/adapters/pi-hat.yaml ⚑

- **Changes:**
  - `status: discontinued`
  - `links.product` "Multiple" (not a URL) → https://espartstick.ecwid.com/Raspberry-Pi-Pixel-HAT-Controller-Dual-Output-5v-12v-p228404281, plus `dead_links` and archive https://web.archive.org/web/20250716105223/…p228404281
  - price $22 → **$28.99** (archived 2025-07-16, OutOfStock)
- **Source:** the capture's JSON-LD reads "Raspberry Pi Pixel HAT Controller Dual Output 5v - 12v … 28.99 … seller Microcyb". It was $19.99 in 2022–2023.
- **Judgment call:** I identified the entry as this dual-output HAT. That fits `pixel_types: '2'` and the ~$22 price. The later "2 Port PiHat/Picap for FPP" (p630690156, $37.99) is a different product.
- **Wrong facts:** the fields are shifted spreadsheet columns: `notes: Phoenix Screw`, `max_channels: 3200`, `pixel_types: '2'`, `connectors: Both`, `diy_or_ots: Yes`, `parent: Yes`.

## database/adapters/espixelstick.yaml ⚑

- **Changes:** `status: active`; $30 → **$28**.
- **Source:** https://forkineye.com/product/espixelstick-v3/ (the creator's store) shows "ESPixelStick V3 … $28.00 … in stock … SKU: ESPSV3", described as a "single output controller … up to 680 WS2811 pixels (4 Universes)".
- **Link:** the Amazon link (B072XT1V77, "ESPixelStick - Wireless DMX Pixel Controller Kit") is live but "Currently unavailable". I left it in place, so `price_source` points at Forkineye.
- **Wrong facts:** `creator` is missing (it should be Forkineye / Shelby Merrick). `max_channels: 4` is universes, not outputs; V3 has a single output.

## database/adapters/f32-b.yaml

- **Changes:**
  - status evidence added
  - dead_links `checked` bumped (the 2022-01-23 archive was verified to show the product)
  - price $95 → **$110** (archived last list price, 2022-01-23, out of stock)
- **Sources:**
  - https://wiredwatts.com/klf32b: "Discontinued: This product has been discontinued."
  - kulplights.com/product/f32-b/ returns 404.

## database/adapters/f8-b.yaml

- **Changes:** status evidence added; `checked` bumped; $51 re-confirmed as the last list price (2021-10-25 capture, out of stock), with `price_source` added.
- **Source:** https://wiredwatts.com/klf8b: "This product has been discontinued."

## database/adapters/f8-pb.yaml

- **Changes:**
  - status evidence added
  - archive **added**: https://web.archive.org/web/20220123003658/https://kulplights.com/product/f8-pb/
  - `checked` bumped
  - price $81 → **$86** (last list price, 2022-01-23)
- **Source:** https://wiredwatts.com/klf8pb: "This product has been discontinued."

## database/adapters/falcon-picap.yaml

- **Changes:**
  - `status: discontinued`
  - `related` replacement: Falcon PiCap V2 (name and url, not in the database)
  - `dead_links` for `index.php?id_product=47`, which now redirects to the store home page (dead per the addendum). Archive: https://web.archive.org/web/20210415104512/https://www.pixelcontroller.com/store/index.php?id_product=47&controller=product
  - $35 re-confirmed as the last list price (2021-04-15)
- **Sources:**
  - https://pixelcontroller.com/store/pixel-controllers/47-falcon-picap.html (Playwright): "This product is no longer available."
  - https://pixelcontroller.com/store/featured/99-falcon-picap-v2.html: "Can control four strings … USD $52.00 Add To Cart In Stock"
  - The archive's `product:price:amount` is 35, with "Can control two strings 800+ WS2811 pixels".

## database/adapters/ip67-controller-for-wled.yaml

- **No change.** The GitHub repo is live.
- **Unresolved:** DIY only. The README points to a PCBWay shared project (https://www.pcbway.com/project/shareproject/Controller_for_WLED_firmware_in_waterproof_enclosure.html), which has "Add to cart" but no published price. I found no Tindie listing. No price and no status.

## database/adapters/led-octopus.yaml

- **Changes:**
  - price $34 → **$33.99**, with `price_source`
  - link: tracking parameters removed (`…/EssenceEng/led-octopus/?pt=…&fbclid=…` → https://www.tindie.com/products/essenceeng/led-octopus/)
- **Status:** left unset, because the page says "This seller is taking a break" (OutOfStock in JSON-LD).
- **Wrong fact:** `creator: Tindie` should be Essence Engineering.

## database/adapters/octows2811-adaptor.yaml

- **Changes:** `status: active`; $10 re-confirmed, with SparkFun PRT-28372 as the source.
- **Sources:**
  - The PJRC page says "SparkFun is now manufacturing Teensy products. You can buy directly at SparkFun", with a link to it.
  - https://www.sparkfun.com/octows2811-adaptor-for-teensy-3-x-4-x.html: "SKU: PRT-28372 … $10.00 In stock"
- **Links:** the PJRC link is ok.

## database/adapters/orange-pi-dmx.yaml

- **No change.** http://orangepi-dmx.org/ iframes https://sites.google.com/site/rpidmx512, which is live ("Open Source Pi DMX-512, Art-Net 4, sACN E1.31…").
- **Unresolved:** DIY project (prototype boards are ordered from JLCPCB per the site), with no seller. The $12 price has no source, so it was left as is. No status.

## database/adapters/pipixel.yaml

- **Changes:** `status: discontinued`; $9 → **$8.50** (last list price on the retired listing).
- **Source:** https://www.tindie.com/products/ManiacalLabs/pipixel-raspberry-pi-led-strip-hat/: "Product Retired", $8.50.
- **Wrong fact:** `creator: Tindie` should be Maniacal Labs.

## database/adapters/pixellauncher-gen-2-micro.yaml

- **Changes:** status evidence added; dead_links `checked` bumped. The existing 2025-04-27 archive was verified to show the product.
- **Source:** https://digitalambiance.com/?s=pixellauncher&post_type=product: "No products were found matching your selection." The product URL redirects to a 404.
- **Unresolved:** no price was ever published. All captures from 2021 to 2025 show "$0.00" and "Add to Project" (quote-only), so it stays unpriced.

## database/adapters/pixelpops.yaml

- **Changes (link only):** `dead_links` for the DIYC wiki URL, archive https://web.archive.org/web/20250627191305/https://www.doityourselfchristmas.com/wiki/index.php?title=ESPixel_Stick_%26_ESPixel_Pops. The whole DIYC wiki is gone: every `/wiki/…` variant returns "Page Not Found".
- **Unresolved:** DIY only. The wiki said to buy boards from ukewarrior via a DIYC PM, or as a group of 3 from OSH Park (profile PopsElectronics). That profile now lists only 3 other projects (the Pixel Pops PCB is no longer shared). No price and no status.
- **Wrong fact:** `creator: diy/board design` should be Pops Electronics (ukewarrior), with the board based on Bill Porter's design per the wiki.

## database/adapters/plasma-2040.yaml

- **Changes:**
  - `status: discontinued`
  - `related` replacement: Plasma 2350 (name and url, not in the database)
  - $16 re-confirmed as the last list price (US store, PIM582)
- **Source:** https://shop.pimoroni.com/en-us/products/plasma-2040: "We no longer stock this product It's sad to say goodbye … ✨ Meet its successor Plasma 2350". `.json` gives PIM582 at 16.00 on the US store and 11.75 on the UK store.

## database/adapters/pocketscroller-v2.yaml

- **Changes:** `status: active`; $51 → **$28** (cape only, POCKETSCROLLER-N-None).
- **Source:** the variations JSON on https://kulplights.com/product/pocketscroller/ gives No/None $28, No/32G $45, Regular/None $68, Regular/32G $85, Industrial $88/$105. All are in stock.

## database/adapters/pro-serial-led-driver.yaml

- **Changes:**
  - price $49 → **$65** (the creator's store regular price)
  - link moved: Tindie slug redirect → https://www.tindie.com/products/electromage/electromage-pro-8x-ws2812apa102-led-driver/
- **Status:** left unset (sold out).
- **Sources:**
  - https://shop.electromage.com/products/pixelblaze-pro-output-expander-pro-8x-ws2812-apa102-led-driver: "Regular price $65.00 USD … Sold out - check distributors" (both the 5V and 12V variants)
  - Tindie lists $95.00 with "This seller is taking a break until May 29, 2027". I found no other distributor carrying it.
- **Wrong fact for the controllers workstream:** this entry duplicates `controllers/electromage-pro-8x-driver.yaml`, which still says `status: active` and price 49.

## database/adapters/serial-led-driver.yaml

- **Changes:** price $15 → **$19**. Status left unset (sold out).
- **Source:** https://shop.electromage.com/products/pixelblaze-output-expander-serial-to-8x-ws2812-apa102-driver: "Regular price $19.00 USD … Sold out - check distributors". Tindie also shows $19 with the seller on a break.
- **Wrong fact:** duplicates `controllers/electromage-8x-driver.yaml` (`status: active`, price 15).

## database/adapters/quinled-dig-quad.yaml

- **Changes:**
  - `status: active`
  - $38 → **$42.49** (ALLNET China, QLD-DQV4)
  - `links.product` was wrong (it pointed at the Dig-Uno page) → https://quinled.info/quinled-dig-quad/
- **Source:** the ALLNET `.json`/`.js` endpoints give "QuinLED Dig Quad | QLD-DQV4 | 42.49 | available true". Other variants: ext. antenna $44.49, LAN $49.99, acrylic case +$4.50.
- **Wrong fact:** duplicates `controllers/quinled-dig-quad.yaml`, which was already updated the same way by another agent.

## database/adapters/quinled-dig-uno.yaml

- **No change.** The link (2018 hardware guide, anchor present) is live. The guide says "This hardware guide is for board revision v2r5, current version is higher", and suggests ordering bare PCBs from DirtyPCBs or PCBWay.
- **Unresolved:** DIY Wemos-based v2. The current Dig-Uno is the pre-assembled v4, which is already priced in `controllers/quinled-dig-uno.yaml`. No price and no status here.
- **Wrong facts:**
  - The entry duplicates the controller entry.
  - `creator` is missing.
  - `max_channels: 6` / `Phoenix Screw` / 5V are suspect: the Dig-Uno has 2 LED outputs. I didn't verify this.

## database/adapters/rasppi-isolated-dmx.yaml

- **Changes:** `status: active`; €29.95 re-confirmed; `price_source` now has `url` and `notes`.
- **Source:** https://bitwizard.nl/shop/DMX-interface-for-Raspberry-pi: "Availability: In Stock €29.95 Available Options Pins 3 pins connector 5 pins connector (+€9.95)". The page doesn't say whether VAT is included.

## database/adapters/rpi-28d.yaml

- **Changes:**
  - `status: discontinued`
  - price $22 → **AUD 35** (inc. tax, last list price on the obsolete listing)
  - `related` replacement: rPI-28D+ (name and url, not in the database)
- **Source:** https://www.hansonelectronics.com.au/product/rpi-28d/: "rPI-28D AU$ 35.00 inc. TAX … Out of stock Category: Obsolete … This product has been superseded by https://www.hansonelectronics.com.au/product/rpi-28dplus/". The rPI-28D+ is AU$40, InStock.

## database/adapters/sp901e-pixel-data-distributor.yaml

- **Changes:**
  - `status: active`
  - $22 → **$21.98** (CONAMP-DC-2)
  - link moved (slug redirect) → https://www.superlightingled.com/4ch-spi-signal-amplifier-sp901e-for-programmable-led-light-strips-p-3125.html
- **Source:** "Model: CONAMP-DC-2 … in stock Price $21.98 Qty Discounts … 1-4 $21.98 5-9 $21.32 10-19 $20.22 20+ $18.68".
- **Wrong fact:** the SP901E is a **4-channel** amplifier ("4CH SPI Signal Amplifier"), but the entry has `max_channels: 8` and notes "duplicated to 8 output channels".

## database/adapters/spixels-board.yaml ⚑

- **Changes:**
  - `status: active`
  - price **added**: $27.85 (OSH Park, 3 PCBs)
  - link: http://spixels.org/ (redirects) → https://github.com/hzeller/spixels
- **Sources:**
  - hardware/pi-adapter-16/README.md: "It is also [shared on OSH Park] (not affiliated)" with a link to https://oshpark.com/shared_projects/BTdhLFc3.
  - That page reads "Spixels - 16 SPI LED Strip Raspberry Pi Adapter author: hzeller … Total Price: $27.85".

## database/adapters/wemos-esp32-driver-board.yaml ⚑

- **Changes:** price $9 → **GBP 7.30**, retrieved 2025-12-23 from the latest Wayback capture (MPN MLP201123).
- **Link:** ok but blocked. eBay returns 403 to Node, Playwright and WebFetch.
- **Source:** https://web.archive.org/web/20251223085343/https://www.ebay.co.uk/itm/133705567939: "Wemos ESP32 - WS2811/WS2812 LED Driver Board … Mottramlabs … £7.30 … Quantity: More than 10 available 548 sold … Registered as a private seller".
- **Status:** unset, because the listing can't be verified live.

## database/adapters/wemos-pwm-rgb-w-led-driver-board.yaml ⚑

- **Changes:** price $12 → **GBP 6.95**, retrieved 2026-02-08 from a Wayback capture (MLP201141).
- **Source:** https://web.archive.org/web/20260208103400/https://www.ebay.co.uk/itm/133875147448: "Wemos D1/ESP-12 - RGB/RGBW - PWM LED Driver Board … £6.95 … More than 10 available 243 sold".
- **Status:** unset (blocked).

## database/adapters/wled-wemos-shield.yaml

- **Changes:** price **added**: $18.99 (the creator's Tindie listing). Status left unset (out of stock).
- **Sources:**
  - The repo README says "Ready to use fully assembled shield on Tindie" and links tindie 22307, which redirects to https://www.tindie.com/products/serg74/wled-shield-board-for-addressable-leds/: "$18.99 … Out of Stock … Sold out since Nov 10, 2024".
  - MoonModules also lists a shield of the same design at $22.32 ("taking a break until Dec. 8, 2026").
- **Wrong fact:** `max_channels: 2`, but the listing says "Up to 4 LEDs outputs!".

---

## (a) Files with price/status/related changes

16x-led-shield, 4x-led-mini-shield, 6x-led-shield, 8x-led-shield, 6x-smd-led-shield, 4-channel-differential-transmitter, meanwell-pdu-with-differential-receiver, duotrigesimalws28111, esp-level-shifter, esp-pixnode-sdcard-adapter, esp-pixnode, pixel-string-pihat-zero, esp32-thingplus-dmx-to-led, espartstick-wled, espartstick, m4-port-pixel, m8-port-pixel, pi-hat, espixelstick, f32-b, f8-b, f8-pb, falcon-picap (+replacement), led-octopus, octows2811-adaptor, pipixel, pixellauncher-gen-2-micro (status evidence only), plasma-2040 (+replacement), pocketscroller-v2, pro-serial-led-driver, serial-led-driver, quinled-dig-quad, rasppi-isolated-dmx, rpi-28d (+replacement), sp901e-pixel-data-distributor, spixels-board, wemos-esp32-driver-board, wemos-pwm-rgb-w-led-driver-board, wled-wemos-shield.

## (b) Files with ONLY link changes (IGNORED_COMMITS candidates)

- artgateone: stray `?` removed from the GitHub URL.
- pixelpops: `dead_links` added (DIYC wiki gone).

## (c) Unresolved

- **Prices with no source, left as is:**
  - esp-level-shifter $9
  - esp-pixnode-sdcard-adapter $7
  - pixel-string-pihat-zero $12
  - orange-pi-dmx $12
- **Still unpriced:**
  - DIY with no seller or no published price: artgateone, artnet-to-ws2812-1-universe, ip67-controller-for-wled (PCBWay, no price), pixelpops, quinled-dig-uno (DIY v2)
  - Quote-only, never priced: pixellauncher-gen-2-micro
- **Dead links with no archive:** esp-level-shifter (Amazon, zero captures), esp-pixnode-sdcard-adapter (zero captures), pixel-string-pihat-zero (the only capture already shows "not available").
- **Status left unset:**
  - Out of stock or seller on break: 4-channel-differential-transmitter, led-octopus, pro-serial-led-driver, serial-led-driver, wled-wemos-shield
  - eBay blocked: wemos-esp32-driver-board, wemos-pwm-rgb-w-led-driver-board
  - DIY only: artgateone, artnet-to-ws2812-1-universe, ip67-controller-for-wled, orange-pi-dmx, pixelpops, quinled-dig-uno
- **Judgment calls to confirm (⚑):**
  - OSH Park shared project = authorized seller. This makes 16x/4x/6x/8x-led-shield and spixels-board `active`, priced as the total for 3 bare PCBs.
  - The 4 EGL `links.product` moved from the retired Tindie listings to the creator's evilgeniuslabs.org pages.
  - pi-hat identified as Microcyb's Dual Output Pixel HAT, with its `links.product: Multiple` replaced.
  - espixelstick mapped to the current ESPixelStick V3 at the creator's store.
  - The Mottramlabs eBay prices come from Wayback captures, with `retrieved` set to the capture date, for listings that may still be live.
  - Retired listings that still show a price on a live page were dated today, with notes saying "last list price".
  - ElectroMage: used the creator's own store price ($65 Pro) over Tindie ($95).

## (d) Wrong facts for other workstreams

- **Duplicates across categories:**
  - adapters/serial-led-driver ↔ controllers/electromage-8x-driver
  - adapters/pro-serial-led-driver ↔ controllers/electromage-pro-8x-driver. Both controller entries say `active` with old prices (15/49). The creator's store says "Sold out - check distributors" at $19/$65, and the Tindie seller is on a break until 2027-05-29.
  - adapters/quinled-dig-quad ↔ controllers/quinled-dig-quad
  - adapters/quinled-dig-uno ↔ controllers/quinled-dig-uno
- **Wrong or missing creator:**
  - led-octopus `creator: Tindie` → Essence Engineering
  - pipixel `creator: Tindie` → Maniacal Labs
  - pixelpops `creator: diy/board design` → Pops Electronics (ukewarrior)
  - Missing `creator`: espartstick (Microcyb), esp-pixnode (Jboards), esp-level-shifter (ACROBOTIC), espixelstick (Forkineye), quinled-dig-uno (Quindor), spixels-board (hzeller)
- **Garbled fields:** pi-hat fields are shifted spreadsheet columns (`notes: Phoenix Screw`, `max_channels: 3200`, `pixel_types: '2'`, `connectors: Both`, `diy_or_ots: Yes`, `parent: Yes`).
- **Wrong channel counts:**
  - sp901e is a 4-channel amplifier, not 8 (`max_channels: 8`, notes).
  - wled-wemos-shield: up to 4 outputs per the listing, not 2.
  - espixelstick: `max_channels: 4` counts universes; V3 has 1 output.
  - quinled-dig-uno: `max_channels: 6` is suspect (unverified).
- **Minor:** espartstick says 5V, but the product was 5V/12V. octows2811-adaptor `parent: Teensy 3.2`, but it now fits Teensy 3.2–4.1.
