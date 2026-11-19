# Findings: controllers p\* (2026-11-18)

Checks run from the repo root: `bunx eslint --fix database/controllers/p*.yaml` (exit 0), `bunx prettier --write database/controllers/p*.yaml` (all unchanged), `bun run validate controllers` (135/135 valid, exit 0). No git state changes. Every status line set or confirmed has a `# src: url | date | note` comment, and so does every replacement item added.

Advatek moved domains: every `advateklights.com` URL now redirects to `advateklighting.com`. I replaced those URLs in place, both `creator.url` and `creator.page`. The site's Nuxt payload has a per-product `discontinued` flag, AU prices (`prices`, AUD) and US prices (`pricesUs`, USD). US visitors see "$X RRP USD Exc. tax" after choosing a variant. Mk2 boards show no USD price, only "Limited stock available - contact us".

---

## database/controllers/pb-complete-controller.yaml

- **Changes:** status unknown → **active**. Price 199 → **195**. Added `price_source`.
- **Source:** https://kurtcontrollers.com/?product=pb-complete-controller says "PB Complete Controller $ 195.00 In stock" (JSON-LD agrees: 195.00 USD, InStock). That price includes the PocketBeagle, screw terminals, fuses and a 32GB SD card.
- **Links:** page ok.
- **Wrong facts:** `inputs.protocols: [DMX512]`, but the vendor lists "2 universes of DMX 512" as outputs. Networking is "USB type-A OTG ... networking", so `Ethernet: true` is questionable.

## database/controllers/pb16.yaml

- **Changes, links:** `creator.page` had a typo, `...Pixel-Controlleri`, which I fixed to `...Pixel-Controller`. The whole DIYC forum is gone: the thread, `/forums/` and the new-style thread URLs all return 404. Added a `dead_links` item with archive https://web.archive.org/web/20230604010133/http://doityourselfchristmas.com/forums/showthread.php?53296-FPP-PB16-Pixel-Controller, which shows the thread "FPP PB16 Pixel Controller". The GitHub repo is ok (last push 2026-10-05).
- **Status:** left `unknown`. It's open hardware and nobody sells it. The creator wrote "I don't plan on selling complete controller... just selling raw PCB" ($10 raw PCB).
- **Unresolved:** price 130 has no source.
- **Wrong facts:** the notes ("cape for the BeagleBone Black") and `requires_host: BeagleBone Black` are wrong. The repo README says PB16 is the PocketBeagle version ("The 'Original' Pocketbeagle Version"); the BBB16 is the BeagleBone version.

## database/controllers/pixblasters-ms1.yaml

- **Changes:** status unknown → **active**. `creator` changed from a string to an object with url https://pixblasters.com and page https://pixblasters.com/products/ms1-controller/. Price 375 confirmed; added `price_source`.
- **Sources:** https://pixblasters.com/how-to-order/ says "can be ordered from Mouser ... CS-PIXBLASTER-01 : MS1 Video LED Controller", and also direct and via Crowd Supply. The Crowd Supply page blocks scripts (Cloudflare 403). Its latest capture, https://web.archive.org/web/20260522230919/https://www.crowdsupply.com/pixblasters/video-led-controller, says "Pixblasters MS1 ... $ 375 $10 US Shipping / $20 Worldwide In stock". `price_source.retrieved` is the capture date, 2026-05-22.

## database/controllers/pixelator-mini-px1-8d.yaml

- **Coordinator check (dead_links):** the old support URL now returns 200 via a redirect to https://support.enttec.com/legacy-product/legacy-products/pixelator-mini-px1-8d-71066-legacy-product. That page shows this product: "Pixelator Mini PX1-8D (71066): Legacy Product ... DISCONTINUED: This product has been discontinued. See our latest Pixel Controllers." **Decision:** replaced `creator.page` with the new URL and removed the `dead_links` item.
- **Status:** discontinued, confirmed by the same page. The vendor names no successor.
- **Price:** 700 → **735**, the last list price. Source capture: https://web.archive.org/web/20221006200506/https://www.enttec.com/product-tag/px18d/ shows "Pixelator Mini PX1-8D $ 735.00 Buy Now". The Feb 2023 capture shows "$ 735.00 Read more", and Mar 2021 showed $700 (SKU 71066).

## database/controllers/pixelator.yaml

- **Status:** discontinued, confirmed. ENTTEC's product search (https://www.enttec.com/?s=pixelator&post_type=product) lists only PIXELATOR MINI ($625) and MINI MK2 ($975). The old US URL returns 404.
- **Links:** the dead UK URL has no Wayback capture. I added archive https://web.archive.org/web/20220629132059/https://www.enttec.co.uk/product/controls/addressable-led-pixel-control/24-port-ethernet-pixel-controller/ (same product, the later UK path, still live then) and bumped `checked`.
- **Price:** 1891 (USD, no source) → **{1475, GBP}**, the last list price. That capture says "PIXELATOR ... £ 1,475.00 + VAT SKU: 70060". The US store's last capture (Mar 2021) showed $2,100.

## database/controllers/pixelblaze-v3.yaml

- **Changes:** status active confirmed. Price 35 → **39**; added `price_source`.
- **Source:** Shopify `.json` / `.js` for https://shop.electromage.com/products/pixelblaze-v3-standard-wifi-led-controller shows variant "XL" EM-PIXELBLAZE-PB32XL, price 39.00, no compare-at price, available. The Pico+ (EM-PB-PICO32P6A) is $35, which is probably where the old 35 came from.

## database/controllers/pixelbox.yaml

- **Changes:** I rewrote the status comment in the `src` format. Added a `related` replacement: name "Lumikit PixelBOX 8 AMP DMX SINGLENET", url https://www.lumikit.com.br/pixelbox-8-amp (not in the database).
- **Source:** https://lumikit.com.br/pixelbox (rendered) says "Controlador Lumikit PixelBOX DMX 90023. Este produto não está mais ativo. O produto que substitui é Controlador Lumikit PixelBOX 8 AMP DMX SINGLENET."
- **Unresolved price:** 199 has no source. The only published price I found is R$690,00 "Preço normal", in https://web.archive.org/web/20190101040936/http://www.lumikit.com.br/pixelbox (product 90023, in stock). I didn't record it because BRL isn't in `app/lib/currency.ts` `USD_PER`. Recommendation: add BRL, then set `{amount: 690, currency: BRL}` with retrieved 2019-01-01.

## database/controllers/pixeldin.yaml

- **Links:** the English site is gone. `/en/...` returns 404, and `/en/` redirects to `/ru//`. The archived English page at the entry's URL was titled "Yarilo PixelDIN2" and described 4 outputs and 5440 pixels, which is this entry. Its current page is https://yarilo.pro/ru/contollers/pixel/yarilo-pixeldin2 (the site's own spelling, "contollers"). I replaced `creator.page` with it and removed the stale `dead_links` item.
- **Status:** discontinued, confirmed: the PixelDIN2 page says "Снят с производства" (discontinued).
- **Price:** 142 confirmed as the last list price. Source: https://web.archive.org/web/20241105183413/https://yarilo.pro/en/controllers/pixel-controllers/yarilo-pixeldin says "Price: USD $142". The Aug 2022 capture showed $122.
- **Wrong facts:** the entry is named "PixelDIN", but the 4-output/5440-pixel product is Yarilo's **PixelDIN2**. Yarilo's current "PixelDIN" is a different 2-output/2720-pixel model, still sold at 11,625 RUB (https://yarilo.pro/ru/contollers/pixel/yarilo-pixeldin).

## database/controllers/pixie.yaml

- **Changes:** status discontinued confirmed. Added `creator.url` https://smartshow.lighting.
- **Source:** https://smartshow.lighting/archive/ lists "PIXIE+ | PIXIE" under "Archived User Guides". The site has no product page, and `/products/pixie` redirects to a PDF manual.
- **Unresolved:** the eBay listing returns 403 to every automated fetch I tried: Node, curl, headless Chromium, headless Chrome and WebFetch. Wayback has no captures, so the link stays unverified, neither ok nor dead. Price 47 has no source.

## database/controllers/pixlite-16-long-range-mk2.yaml

- **Changes:** status active → **end-of-life**. The URLs moved to advateklighting.com, with page https://www.advateklighting.com/products/shop/pixlite-16-long-range-mk2. Price 450 (USD) → **{1175, AUD}**, part PIX16LRMKII.
- **Source:** the page renders "Limited stock available - contact us". The CMS has `discontinued: true`, and the schema.org Offer is `availability: Discontinued, price 1175 AUD`. There is no USD price; the AU store shows in stock and the US store doesn't. GST treatment isn't stated.
- **Possible successor (not added):** the vendor's related products are T8-S Mk3, R2F-S and R4D-S.

## database/controllers/pixlite-16-mk2-control-board.yaml

- **Changes:** status active → **end-of-life**. Page is now https://www.advateklighting.com/products/shop/pixlite-16-mk2. Price 450 → **{1175, AUD}**, part PIX16MKII.
- **Source:** same evidence pattern as the long-range board: "Limited stock available - contact us" and "For our newest generation products check out the PixLite® Mk3 Range". The only related product listed is E16-S Mk3.

## database/controllers/pixlite-16-mk2-eco.yaml

- **Changes:** status discontinued confirmed. `creator.url` moved to the new domain.
- **Source:** there is no ECO listing anywhere on advateklighting.com (`/products/shop/pixlite-16-mk2-eco` returns 404), and the base 16 Mk2 is flagged discontinued.
- **Unresolved:** price 190 has no source; it was never listed publicly.

## database/controllers/pixlite-16-plug-and-play-mk2.yaml

- **Changes:** status active → **end-of-life**. Page is now https://www.advateklighting.com/products/shop/pixlite-16-plug-and-play-mk2 (vendor title "PixLite 16 Plug And Play Mk2 Conformal Coated"; 6 variants, 5V/12V × US/EU/AU plug).
- **Unresolved:** price 500 has no source. The AU offer price is 0 and there's no USD price.

## database/controllers/pixlite-4-mk2-eco.yaml

- **Changes:** status discontinued confirmed (no ECO listing; the base 4 Mk2 is flagged discontinued). `creator.url` moved to the new domain.
- **Unresolved:** price 115 has no source.

## database/controllers/pixlite-4-mk2.yaml

- **Changes:** status active → **end-of-life**. Page is now https://www.advateklighting.com/products/shop/pixlite-4-mk2. Price 340 → **{499, AUD}**, part PIX4MKII. The vendor's related products are A4-S Mk3 and E4-S Mk3.

## database/controllers/pixlite-4-rugged-mk2.yaml

- **Changes:** status active → **end-of-life**. Page is now https://www.advateklighting.com/products/shop/pixlite-4-rugged-mk2. Price 440 → **{809, AUD}**, part PIX4MKIIRUGKITCC. That is the only listed variant: "PixLite 4 Rugged Mk2 Conformal Coated (inc. Power Cable)".

## database/controllers/pixlite-a4-s-mk3.yaml

- **Changes:** status active confirmed. Page is now https://www.advateklighting.com/products/a4-s-mk3. Price 399 → **649**.
- **Source:** with Coating "None" selected (headless Playwright), the page shows "$ 649 RRP USD Exc. tax", or $715 conformal coated. In stock in the US.

## database/controllers/pixlite-e16-s-mk3.yaml

- **Changes:** status active confirmed. Page is now https://www.advateklighting.com/products/e16-s-mk3. Price 950 → **1099**: "$ 1099 RRP USD Exc. tax", or $1,209 coated.

## database/controllers/pixlite-e4-s-mk3.yaml

- **Changes:** status active confirmed. Page is now https://www.advateklighting.com/products/e4-s-mk3. Price 549 → **449**: "$ 449 RRP USD Exc. tax", or $499 coated. The old value had E4-S priced above A4-S, which was inverted.

## database/controllers/pixlite-t8-s-mk2.yaml

- **Links:** https://www.advateklighting.com/pixlite-t8-s-mk2 now redirects to the T8-S Mk3 page, so it's dead. Added a `dead_links` item with archive https://web.archive.org/web/20220118111855/https://www.advateklights.com/pixlite-t8-s-mk2 (the live product page on the old domain).
- **Status:** discontinued, confirmed by the Sep 2023 capture: "This item was discontinued in August 2022. The T8-S Mk2 is now replaced by the more powerful T8-S Mk3."
- **Related:** added replacement `ref: controllers/pixlite-t8-s-mk3`. To keep the relationship declared on one side only, I removed the duplicate `predecessor` item from `pixlite-t8-s-mk3.yaml`. Detail pages derive "Replaces" and "Replaced by" automatically.
- **Price:** this entry had no price. I filled it with **879.95** from the archived store's dataLayer: `"name":"PixLite T8-S Mk2","id":"PIXT8SMK2","price":"879.95"`, currency USD. The visible page showed no price (the May 2022 capture says "out of stock until further notice").

## database/controllers/pixlite-t8-s-mk3.yaml

- **Changes:** status active confirmed. Page is now https://www.advateklighting.com/products/t8-s-mk3. Price 1200 → **1150**: with No Cable and Coating None selected, the page shows "$ 1150 RRP USD Exc. tax". Removed the `related: predecessor` item, now declared as a replacement on the Mk2.

## database/controllers/pixnet-4.yaml

- **Changes:** status active confirmed. `creator.page` changed from the homepage to https://pixnetcontrol.com/pixel-controllers/20-pixnet-4.html.
- **Source:** the product page says "PixNet 4 ... Trade pricing only. Please log in to request trade pricing."
- **Unresolved:** price 450 has no source (trade pricing only).
- **Wrong facts:** the vendor's name is "PixNet 4", not "4+". The vendor lists only "Single 100M Ethernet Port with POE", so `inputs.physical.USB: true` is doubtful. DMX node mode is 4 × 512, but the entry has `auxiliary DMX512: 1`.

## database/controllers/pixout-server.yaml

- **Changes:** status active confirmed. Added `creator.page` https://pixout.lighting/products/recorder/. Price 300 → a **named-options array in EUR**: S-100 Outdoor at €344 for 1 universe, €664 for 16 and €1,197 for 64, plus a software-only licence for your own Raspberry Pi from €104.
- **Source:** the page says "All prices are MSRP in EUR, exclusive of VAT and shipping". I-100 Indoor costs €304, €624 or €1,157 (1, 16 or 64 universes), and D-100 starts at €389. In 2019 the product was sold as the "Pixout Controller" (BOX/DIY tiers, sales@pixoutserver.com).
- **Wrong facts:** the product is now the "Pixout ArtNet DMX Recorder". The current maximum is 64 universes, not 255. It records and plays Art-Net, and the D-100 has 4 DMX outputs. It doesn't drive pixels, so `outputs.count: 8`, `pixels.max_per_output: 1024`, `clocked` and `driver` look wrong.

## database/controllers/pixpoe.yaml

- **Changes:** status active confirmed. Added `creator.page` https://www.empdesigns.co.uk/our-products/poe-%2B-pixel. The vendor calls it "PoE + Pixel": "delivering both data and power — up to 30W — through a single PoE+ ... cable", 67×45×25 mm.
- **Unresolved:** price stays `unknown`. The product isn't in EMP's online shop, and the page only says "Contact Us".

## database/controllers/protopixel-1-channel-ethernet.yaml, protopixel-1-channel-wifi.yaml, protopixel-8-channel-controller.yaml

- **Links:** https://www.protopixel.io/pricing now redirects to `/tools/product-overview`, a generic overview that no longer lists these controllers, so it counts as dead. Added `dead_links` with archive https://web.archive.org/web/20210218144636/https://www.protopixel.io/pricing. That capture shows "8-channel Controller" and "Mini Controller ... WiFi and Ethernet options ... up to 600 RGB LEDs".
- **Status:** active → **discontinued**. ProtoPixel's current lineup is only Brain, Brain Experience and Gates (SPI wired, SPI wired long-range, SPI wireless, DALI and Casambi), and the old `/mini-controller` page returns 404. There's no explicitly named successor. Gate SPI wireless (1 SPI output, 1200 px at 30 fps, microSD) looks like the functional successor of the 1-channel Wi-Fi, but the vendor doesn't say so, so I didn't add it.
- **Unresolved:** prices 191, 221 and 573 have no source. `/pricing` never showed hardware prices, from the first capture (Aug 2020) onward ("Looking to purchase hardware products? Contact us and we'll provide a trusted re-seller"). The Luz Negra distributor catalog pages (refs 41.043 and 41.044) return 410.
- **Wrong facts:** the 8-channel `technical_notes` says "design software from $149/month, deployment from $79/month", but the vendor's prices were € 149 and € 79 per month.

---

## (a) Files with price/status/related changes

- pb-complete-controller (unknown→active; 199→195)
- pixblasters-ms1 (unknown→active; 375 sourced; creator object + links)
- pixelator-mini-px1-8d (700→735 archived; status src; page URL moved; dead_links removed)
- pixelator (1891 USD→£1475 archived; status src; dead_links archive added)
- pixelblaze-v3 (35→39; status src)
- pixelbox (status src; related replacement → PixelBOX 8 AMP DMX SINGLENET)
- pixeldin (142 sourced, archived; status src; page URL moved; dead_links removed)
- pixie (status src; creator.url added)
- pixlite-16-long-range-mk2 (active→end-of-life; 450→AUD 1175; URLs)
- pixlite-16-mk2-control-board (active→end-of-life; 450→AUD 1175; URLs)
- pixlite-16-plug-and-play-mk2 (active→end-of-life; URL)
- pixlite-4-mk2 (active→end-of-life; 340→AUD 499; URLs)
- pixlite-4-rugged-mk2 (active→end-of-life; 440→AUD 809; URLs)
- pixlite-16-mk2-eco, pixlite-4-mk2-eco (status src; creator.url)
- pixlite-a4-s-mk3 (399→649), pixlite-e16-s-mk3 (950→1099), pixlite-e4-s-mk3 (549→449), pixlite-t8-s-mk3 (1200→1150; predecessor item removed); all have status src and new URLs
- pixlite-t8-s-mk2 (price added 879.95 archived; status src; replacement → pixlite-t8-s-mk3; dead_links)
- pixnet-4 (status src; product page link)
- pixout-server (300→EUR options array; status src; page link)
- pixpoe (status src; page link)
- protopixel-1-channel-ethernet, protopixel-1-channel-wifi, protopixel-8-channel-controller (active→discontinued; dead_links)

## (b) Files with ONLY link changes

- pb16 (page typo fix + DIYC `dead_links` with archive)

## (c) Unresolved

- pb16: price 130 has no source (open hardware, never sold; raw PCB $10). Status left unknown.
- pixelbox: price 199 has no source. The archived price is R$690 (Jan 2019), but BRL isn't in `currency.ts`.
- pixie: eBay link unverifiable (403 everywhere, no Wayback captures). Price 47 has no source.
- pixlite-16-plug-and-play-mk2: price 500 has no source (AU offer price is 0, no USD price).
- pixlite-16-mk2-eco / pixlite-4-mk2-eco: prices 190 / 115 have no source.
- pixnet-4: price 450 has no source (trade pricing only).
- pixpoe: price stays `unknown` (contact only).
- protopixel ×3: prices 191, 221 and 573 have no source; hardware prices were never published.
- Advatek Mk2 AUD prices come from the page's schema.org offer and aren't shown to US visitors. GST isn't stated, though the AUD figures track the USD ex-tax RRPs.
- pixblasters-ms1: price source is the May 2026 Crowd Supply capture; the live page blocks scripts.
- Mk2 successors weren't added because those boards are end-of-life, not discontinued. The candidates are: 16 Mk2 → E16-S Mk3, 16 LR Mk2 → T8-S Mk3, and 4 Mk2 → A4-S Mk3 / E4-S Mk3. They're already linked as `related` from the Mk3 entries.

## (d) Wrong facts for other workstreams

- pb16: PB16 is the PocketBeagle version. "cape for the BeagleBone Black" and `requires_host: BeagleBone Black` are wrong (that describes the BBB16).
- pixeldin: this product is Yarilo's "PixelDIN2". Yarilo's current "PixelDIN" is a different 2-output/2720-pixel model, still sold.
- pixout-server: product name is now "Pixout ArtNet DMX Recorder". Max is 64 universes, not 255. The pixel output fields (8 outputs, 1024 px/output, clocked, driver) don't fit an Art-Net recorder.
- pixnet-4: vendor name is "PixNet 4". It has no USB (Ethernet + PoE only). DMX node mode is 4 × 512.
- pb-complete-controller: DMX512 is an output (2 universes), not an input protocol. Networking is via USB OTG.
- protopixel-8-channel-controller: subscription prices were €, not $.
- Advatek creator names are inconsistent: "Advatek Lights" (4 Rugged Mk2) and "Advatek Lighting" (T8-S Mk2) versus "Advatek".
