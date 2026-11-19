# Connectors research pass: findings (2026-11-18)

Slice: `database/connectors/*.yaml` (45 entries). None had a price before this pass. All `retrieved`/`checked` dates are 2026-11-18.
Checks run afterwards: `bunx eslint --fix database/connectors` (clean), `bunx prettier --write database/connectors` (clean), `bun run validate connectors` (45/45 valid).

## Sources and what was reachable

- **Mouser, Digi-Key, TME, Farnell/element14, Newark, RS, Arrow, Future, TTI, Octopart, Findchips, Bürklin, Conrad, Reichelt and Powerwerx all block scripted reads.** Tried Node fetch, curl, WebFetch, headless Chromium (bundled and `channel: 'chrome'`, with `AutomationControlled` off). Every one returned a 403, a Cloudflare/Akamai/PerimeterX challenge, an HTTP/2 reset or a timeout.
- **LCSC works.** The detail API is `wmsc.lcsc.com/ftps/wm/product/detail?productCode=C…`, and search is a POST to `wmsc.lcsc.com/ftps/wm/search/v3/global`, with a POST to `product/query/list` as the per-category fallback. Every product page I cite returned 200 and contained the MPN. LCSC is on the conventions' list of authorized distributors, and it carries genuine Molex, JST, TE, Phoenix, Hirose, Harwin, Neutrik, Amphenol, Anderson, Amass, Bulgin, Switchcraft and Kyocera AVX parts, so I used it for the branded families too.
- **Fallback retailers:**
  - Thomann (US store, prices exclude sales tax) through headless Chromium, for pro-audio and stage parts.
  - Horizon Hobby (the Spektrum store), for IC5.
  - WiredWatts, for pigtails.
- **Prices with LCSC's "0 stock / lead-time" ladder** (1 / 200 / 500 / 1000 breaks, with the 1-piece rate about 2.5× the 200 rate) are flagged in `price_source.notes`. These are 9159, Bulgin PX0551, Switchcraft EN3 and Mini Buccaneer.
- No `status` or `related` was set on any connector.

---

## database/connectors/9159.yaml

- **Price:** added tiers (LCSC C21287753, Kyocera AVX `009159003001006`): 1: $0.4971, 100: $0.2977, 750: $0.2731.
  - Source: https://www.lcsc.com/product-detail/C21287753.html
  - API showed "stock 0", ladder `1:0.4971 10:0.3943 30:0.3514 100:0.2977 750:0.2731 1500:0.2578`, category "Solid State Lighting Connector Assemblies".
- **Links:**
  - `links.product`: avx.com 301-redirects to https://www.kyocera-avx.com/product/9159-000-series/ (the same series). Replaced in place.
  - `links.digikey` (digikey.com/short/zvwmnz): Cloudflare 403. Unverifiable, left as is.
- **Wrong facts:** the Kyocera AVX page says "Connector Type: Board to Board (BtB) Technology: Card Edge # of Positions: 2, 3, 4, 5 Current Rating 3A / Contact Voltage Rating: 300 VAC … on 2.0mm pitch centers". The entry conflicts on every point:
  - `pitch: 3.0 mm`
  - `max_pins: 6`
  - `max_current: 5 A`
  - `max_voltage: 125 V`
  - `wire_to_wire: true`, crimp and IDC terminations
  - `creator: AVX` (the brand is now Kyocera AVX)

## database/connectors/binder-720.yaml

- **No price.** Not on LCSC: the only binder hit was 99-9212-00-04, another series. Not on Thomann. Farnell, Mouser and Digi-Key are blocked.
- **Links:** the Farnell category URL returns 403 to every client (blocked). Unverifiable, left.
- **Unresolved:** price; whether the Farnell link still lists the 720 range.

## database/connectors/bulgin-disco-8-pole.yaml

- **Price:** added tiers (LCSC C22226028, Bulgin PX0551): 1: $36.6998, 200: $14.6434, 1000: $13.9126.
  - Source: https://www.lcsc.com/product-detail/C22226028.html
  - API showed "stock 0", ladder `1:36.6998 200:14.6434 500:14.1552 1000:13.9126`. The notes flag it as a lead-time listing.
- **Links:**
  - Farnell product page: 403 (blocked), left.
  - Mouser datasheet PDF: 200 `application/pdf`, ok.
- **Unresolved:** whether Bulgin still lists PX0551 (bulgin.com is behind a Cloudflare block).

## database/connectors/cee-form.yaml

- **Price:** added `[{qty 1, $2.70, sku 013-6}]`. This is a PCE 013-6 "Shark" 16 A 3-pole 230 V male cable plug.
  - Thomann item 489040: https://www.thomannmusic.com/pce_013_6_shark_16a_3pol_230v_m.htm
  - Page text: "Item number 489040 … Screw Connection … IP44 … $2.70 … In stock".
- **Links:** epanorama article returns 200 and is the right page.

## database/connectors/chogori-standard-size.yaml

- **No price.** LCSC lists only Chogori accessories (806-xxxxx caps, 0 stock), and Thomann has nothing.
- **Links:**
  - chogori.pro products page: 200, ok.
  - Digi-Key filter URL: 403, blocked, left.
- **Unresolved:** price.

## database/connectors/d-c-barrel.yaml

- **Price:** added tiers (LCSC C16214, BOOMELE `DC-005 2.0`): 10: $0.057, 100: $0.0459, 1000: $0.0321.
  - Source: https://www.lcsc.com/product-detail/C16214.html
  - Listing: "Power Barrel Connector Jack 2mm ID 6.4mm OD Through Hole, Right Angle", stock 59470.
- **Links:** both Mouser search URLs return 403, blocked, left.

## database/connectors/deutsch-dt.yaml

- **Price:** added tiers (LCSC C138526, TE DT06-2S): 1: $1.0291, 100: $0.6333, 1000: $0.5179. Plug housing only; the wedge lock and sockets are separate.
  - Source: https://www.lcsc.com/product-detail/C138526.html (stock 5024)
- **Links:** te.com `/usa-en/` redirects to `/en/` (the same page). Replaced in place.

## database/connectors/df62w.yaml

- **Price:** added tiers (LCSC C2904695, Hirose DF62W-3S-2.2C): 1: $0.6829, 100: $0.4169, 1000: $0.3602.
  - Source: https://www.lcsc.com/product-detail/C2904695.html (stock 17)
- **Links:** hirose.com redirects to https://www.hirose.com/en/product/series/DF62W. Replaced.
- **Wrong facts:** `smallest_gauge: 20 AWG` and `largest_gauge: 26 AWG` look swapped.

## database/connectors/dupont.yaml

- **Price:** added tiers (LCSC C17676506, Harwin M20-1060300, 3-way crimp housing): 5: $0.3459, 50: $0.2743, 1000: $0.2053.
  - Source: https://www.lcsc.com/product-detail/C17676506.html (stock 20)
- **Links:** mattmillman.com fails in Node only because of a missing intermediate certificate. Headless Chromium loads it (200, the right article). OK.

## database/connectors/en3.yaml

- **Price:** added tiers (LCSC C22003394, Switchcraft EN3C3FX, 3-pin female cable end): 1: $20.8235, 200: $8.31, 1000: $7.8944.
  - Source: https://www.lcsc.com/product-detail/C22003394.html
  - API showed stock 0, a lead-time listing. The notes flag it.
- **Links:** the conxall.com PDF is still dead (`CERT_HAS_EXPIRED`). Bumped `dead_links[0].checked` to 2026-11-18; the archive was already curated.
- **Unresolved:** Switchcraft's own page https://www.switchcraft.com/en3-sealed-connectors/ (found by search) renders blank to scripts, both Node (846 bytes) and headless (empty). Once a human confirms it, it could replace `links.product`.

## database/connectors/eventcon.yaml

- **No price.** Not on LCSC or Thomann, and GLP publishes no price.
- **Links:** ehrgeiz.glp.de is still NXDOMAIN. Bumped `dead_links[0].checked` to 2026-11-18. The archive (2025-09-08) loads ("eventCON - EHRGEIZ by GLP").
  - No replacement page on glp.de: https://glp.de/en/products?id=54, which search surfaced, is "PD Installation/Industrial".
- **Unresolved:**
  - Price. Sommer Cable sells eventCON parts, e.g. https://www.sommercable.com/en-gb/eventCON-IP67-3-pole-female-connector-straight-black/EC-PD1F; I didn't read a price there.
  - New official URL.

## database/connectors/gx-16.yaml

- **Price:** added tiers (LCSC C22392643, chxunda XD-GX16-4P-M, 4-pin male; the entry notes say 4-pin is most common): 1: $1.0142, 100: $0.6277, 1000: $0.555.
  - Source: https://www.lcsc.com/product-detail/C22392643.html (stock 192)
- **Links:** `www.renhotecpro.com` 301-redirects to `renhotecpro.com` (the same page). Replaced.

## database/connectors/harting-han-lectriflex.yaml

- **Price:** added tiers 1: $8.20, 2: $7.69, 4: $7.59 for one 16-pole male insert for the 16-pin stage load system.
  - Thomann item 105234: https://www.thomannmusic.com/harting_09_30_016_2601.htm
  - Page text: "Harting 16pin Male Multipin chassis … Insert / For load system / 16 Pin / Male … Item number 105234 … $8.20 … Quantity Discounts $7.69 2, $7.59 4 … In stock within 1-2 weeks".
  - No `sku`: Thomann gives no Harting article number, and the URL slug "09_30_016_2601" isn't a valid Han E number.
- **Links:** the old harting.com URL now redirects to the generic homepage https://www.harting.com/en-US. Replaced with the current Han range page https://www.harting.com/en-US/c/Industrial-connectors-Han-57904/Rectangular-connectors-57905 (200, "Rectangular connectors | HARTING").

## database/connectors/hirschmann-ca.yaml

- **No price.** Not on LCSC (no CA 3 LD) or Thomann. Farnell, Digi-Key and Belden are blocked.
- **Links:** Farnell category URL: 403, blocked, left. The Belden page https://www.belden.com/products/connectors/industrial-connectors/power-connectors/ca-3-ld exists (per search) but is behind a Cloudflare block.
- **Wrong facts:** `creator: Lumberg /Belden`. CA is a Hirschmann (Belden) range. Lumberg is a separate company.
- **Unresolved:** price.

## database/connectors/ic5-ec5.yaml

- **Price:** added `7.99` for SPMXCA502, "Spektrum Connector: IC5 Device and IC5 Battery Set". It is a mated pair.
  - Source: https://www.horizonhobby.com/product/spektrum-connector-ic5-device-and-ic5-battery-set/SPMXCA502.html
  - Page text: "Spektrum - SPMXCA502 … $7.99 … In Stock".
- **Links:** the blog.ampow.com article returns a Cloudflare 521, and so does the whole blog.ampow.com host. www.ampow.com/blogs/news/ic5-vs-ec5-connector is a 404. Added a `dead_links` entry:
  - archive: https://web.archive.org/web/20250621084645/https://blog.ampow.com/ic5-vs-ec5-connector/ (title "IC5 vs EC5 Connector: Comparison - Ampow Blog")
  - checked: 2026-11-18

## database/connectors/ld16-20-28.yaml

- **No price.**
- **Links:** the AliExpress item redirects to https://www.aliexpress.us/item/3256803335013586.html (geo gateway, same listing, "LD16 IP68 Waterproof 2P-4P Screw Crimp Connector", $4.38 for the default variant). OK.
- **Unresolved:** price.
  - A street range needs at least 3 listings priced on the same variant (e.g. 3P in-line pair).
  - AliExpress shows only the default variant's price until a variant is clicked, so I didn't finish this.
  - Not on LCSC or szlcsc.

## database/connectors/m12.yaml

- **Price:** added tiers (LCSC C20828529, Amphenol M12A-04PFFP-SF8001, M12 A-coded 4-pin female straight, IP69K): 1: $8.6635, 10: $7.5086, 100: $6.2135.
  - Source: https://www.lcsc.com/product-detail/C20828529.html (stock 100)
- **Links:** the RS product URL returns 403 (Akamai) to every client. Unverifiable, left.

## database/connectors/mate-n-lok.yaml

- **Price:** added tiers (LCSC C187803, TE 1-480699-0, 2-position housing): 5: $0.1285, 50: $0.1002, 500: $0.0754.
  - Source: https://www.lcsc.com/product-detail/C187803.html
  - Listing: "Connector Housing 2 Position 6.35mm Pitch Single Row", stock 1055.
- **Links:** te.com `/usa-en/` redirects to `/en/`. Replaced.
- **Wrong facts:** `pitch: 5.1 mm`. Universal MATE-N-LOK housings are 6.35 mm per LCSC and TE.

## database/connectors/mini-bucaneer.yaml

- **Price:** added tiers (LCSC C4382455, Bulgin PX0410/03P/6065, 3-pin cable connector for 6.0–6.5 mm cable): 1: $7.6367, 200: $2.9553, 1000: $2.8007.
  - Source: https://www.lcsc.com/product-detail/C4382455.html
  - Stock 0, a lead-time listing. The notes flag it.
- **Links:** bulgin.com returns a Cloudflare 403 even headless. Unverifiable, left.

## database/connectors/mini-fit-jr.yaml

- **Price:** added tiers (LCSC C277599, Molex 39-01-2020, 2-circuit receptacle housing): 10: $0.05, 100: $0.0416, 1000: $0.0342.
  - Source: https://www.lcsc.com/product-detail/C277599.html (stock 174740)
- **Links:** the old molex.com family URL redirects to https://www.molex.com/en-us/products/connectors/wire-to-board-connectors/mini-fit-connectors. Replaced.

## database/connectors/molex-kk-aka-kf2510.yaml

- **Price:** added tiers (LCSC C185238, Molex 22-01-3037, 3-circuit KK 254 housing): 10: $0.0604, 100: $0.0504, 1000: $0.0416.
  - Source: https://www.lcsc.com/product-detail/C185238.html (stock 25980)
- **Links:** redirects to …/kk-connectors. Replaced.

## database/connectors/mt30-60.yaml

- **Price:** added tiers (LCSC C99176, Amass MT60-M): 1: $0.4992, 100: $0.3991, 1000: $0.3877.
  - Source: https://www.lcsc.com/product-detail/C99176.html
  - Listing: "3-Pin Connector MT60-M Male Plug Yellow", stock 774.
- **Links:** flyingtech.co.uk returns a Cloudflare challenge even headless. Unverifiable, left.

## database/connectors/mtsb-combicon.yaml

- **Price:** added tiers (LCSC C90073, Phoenix 1757019, 2-position 5.08 mm plug): 1: $0.7817, 100: $0.4991, 1000: $0.438.
  - Source: https://www.lcsc.com/product-detail/C90073.html (stock 4534)
- **Links:**
  - rsdelivers changed its slug for the same product 1757035. Replaced with https://in.rsdelivers.com/product/phoenix-contact/1757035/phoenix-contact-mstb-25/4-st-508-series-pluggable-terminal-block-4-contact/1896032.
  - Digi-Key: 403, blocked, left.
- **Wrong facts:** the entry name "MTSB CombiCon" should be "MSTB" (Phoenix Contact COMBICON MSTB series).

## database/connectors/ph.yaml

- **Price:** added tiers (LCSC C265393, JST PHR-3): 50: $0.0164, 500: $0.0134, 2000: $0.0117.
  - Source: https://www.lcsc.com/product-detail/C265393.html (stock 52350)
- **Links:** the old jst-mfg URL timed out for the sweep. With a longer timeout it redirects to https://www.jst-mfg.com/product/index.php?series=199&lang=2 (the PH page). Replaced.
- **Wrong facts:** the notes ("R.C, Lipo Balance connector … 2.5mm not 2.54 pitch runs off on boards drilled for 2.54") describe JST XH. JST's page says PH "features a pitch of 2.0 mm".

## database/connectors/picoblade.yaml

- **Price:** added tiers (LCSC C122445, Molex 51021-0300): 50: $0.0204, 500: $0.0163, 2000: $0.0128.
  - Source: https://www.lcsc.com/product-detail/C122445.html (stock 113150)
- **Links:** redirects to …/picoblade-connectors. Replaced.

## database/connectors/pigtails.yaml

- **Price:** added `1.05` from WiredWatts (the entry's own linked store) for one 18 in round 3-core female pigtail (Ray Wu style).
  - Source: https://wiredwatts.com/wire
  - Page text: "18 Inch Round 3 Core Female Pigtail Black Ray Wu Connector $1.05 … 18 Inch Round 3 Core Male Pigtail Black Ray Wu Connector $1.05".
  - This is one retailer's price, not a 3-listing street range.
- **Links:** wiredwatts.com/wire redirects www to apex, 200. OK.

## database/connectors/powercon.yaml

- **Price:** added tiers 1: $6.80, 10: $6.69, 50: $6.49 for Neutrik NAC3FXXA-W-S, the blue power-in cable connector for 6–12 mm cable.
  - Thomann item 564773: https://www.thomannmusic.com/neutrik_nac3fxxa_w_s.htm
  - Page text: "Quantity Discounts $6.80 1, $6.69 10, $6.59 20, $6.49 50 … In stock".
  - Note: Thomann no longer shows NAC3FCA, but LCSC still lists it (C368460, stock 2, 1: $7.8787, 100: $6.4059).
- **Links:** neutrik.com …/powercon redirects to …/powercon-r. Replaced.

## database/connectors/powerpole-15-45.yaml

- **Price:** added `[{qty 1, $0.8987, sku 1327}]` for one red PP15/30/45 housing; LCSC publishes a single break.
  - Source: https://www.lcsc.com/product-detail/C367207.html (stock 37)
- **Links:**
  - Anderson resources page redirects to https://www.andersonpower.com/product-lines/powerpole/ (the Powerpole series page). Replaced.
  - Digi-Key: 403, blocked, left.

## database/connectors/rean-rt4.yaml

- **Price:** added `[{qty 1, $2.55, sku RT4FC-B}]`.
  - Thomann item 234345: https://www.thomannmusic.com/neutrik_rean_tiny_xlr_rt_4_fcb.htm
  - Page text: "Rean RT4 FC-B … Item number 234345 … $2.55 … In stock".
- **Links:** rean-connectors.com product page: 200, ok.

## database/connectors/rj45.yaml

- **Price:** added tiers (LCSC C414201, Molex 44915-0001, unshielded 8P8C modular plug): 1: $1.3039, 100: $0.8082, 1000: $0.7156.
  - Source: https://www.lcsc.com/product-detail/C414201.html (stock 634)
- **Links:** the entry has none.

## database/connectors/sh.yaml

- **Price:** added tiers (LCSC C268100, JST SHR-03V-S-B): 5: $0.1822, 50: $0.1443, 500: $0.1079.
  - Source: https://www.lcsc.com/product-detail/C268100.html (stock 4290)
- **Links:** jst-mfg URL redirects to …/index.php?series=231&lang=2. Replaced.
- **Wrong facts:** `rows: 2`. LCSC and JST list SH housings as single row, and JST calls SH a wire-to-board connector (`wire_to_wire: true` is doubtful).

## database/connectors/sm.yaml

- **Price:** added tiers (LCSC C157908, JST SMP-03V-BC, 3-pin plug housing): 10: $0.0632, 100: $0.0505, 1000: $0.0346.
  - Source: https://www.lcsc.com/product-detail/C157908.html (stock 21880)
- **Links:**
  - jst-mfg URL redirects to …/index.php?series=238&lang=2. Replaced.
  - Adafruit image source: 200.
- **Wrong facts:** `pitch: 2.54 mm`. JST: "The SM series are 2.5 mm pitch".

## database/connectors/socapex.yaml

- **No price.** Not on LCSC or Thomann.
- **Links:** p3connectors.com article: 200, ok.
- **Unresolved:** price.

## database/connectors/sp13.yaml

- **No price.** Weipu is not on LCSC or szlcsc (searches for SP1310/SP1311 returned nothing).
  - AliExpress has "Original Weipu" listings, but the search tiles show mixed-variant "from" prices, e.g. $2.69–$12.55.
- **Links:** /sp13-series/ redirects to https://www.weipuconnector.com/products/sp13/. Replaced.
- **Unresolved:** price.

## database/connectors/sp17.yaml

- **No price**, for the same reason as SP13.
- **Links:** weipuconnector.com/product/38 now redirects to the Weipu homepage, so it counts as dead per policy. The current series page https://www.weipuconnector.com/products/sp17/ (200, "WEIPU SP17 Series Circular Connector") replaces it in place.
- **Unresolved:** price.

## database/connectors/speakon.yaml

- **Price:** added `[{qty 1, $5.30, sku NL4FXX-W-L}]` (4-pole female cable connector, 10–16 mm cable).
  - Thomann item 563043: https://www.thomannmusic.com/neutrik_nl4fxx_w_l.htm
  - Page text: "4-Pole female Cable diameter: 10 - 16 mm Rated power: 37 A … Item number 563043 … $5.30 … In stock".
  - LCSC still lists the older NL4FX (C368466, stock 2).
- **Links:** neutrik.com redirects to the speakon-r path. Replaced.

## database/connectors/superseal.yaml

- **Price:** added tiers (LCSC C86482, TE 282104-1, 2-position Superseal 1.5 housing): 1: $0.5206, 100: $0.2942, 1125: $0.2512.
  - Source: https://www.lcsc.com/product-detail/C86482.html (stock 1520)
- **Links / unresolved:** the TE PDF returns HTTP 500 to Node (consistently, same as the sweep) and 403 Access Denied (Akamai) to headless.
  - A Wayback capture exists: http://web.archive.org/web/20251012135402/https://www.te.com/content/dam/te-com/documents/automotive/global/1654292-2_AMP%20SUPERSEAL%201.5.pdf
  - Not marked dead, because a 500 or 403 isn't proof. Needs a browser check.

## database/connectors/teeplug.yaml

- **No price.** Not on LCSC or Thomann, and RS/Farnell are blocked.
- **Links:** hylec-apl.com page: 200, ok ("TeePlug & Sockets | CWP-PTM-A-S04C (THB.3…").
- **Wrong facts:** `smallest_gauge: 6 AWG` and `largest_gauge: 16 AWG` look swapped. 6 AWG also doesn't match the notes' "4.0mm2" (about 12 AWG).
- **Unresolved:** price.

## database/connectors/vh-r.yaml

- **Price:** added tiers (LCSC C157899, JST VHR-3N): 10: $0.0324, 100: $0.0254, 1000: $0.02.
  - Source: https://www.lcsc.com/product-detail/C157899.html (stock 43830)
- **Links:** jst.com eVH.pdf is behind a Cloudflare challenge even headless (blocked). Left.

## database/connectors/wago-221.yaml

- **No price.**
  - Not on LCSC: no WAGO brand at all, and "221-413" is corrected to a LAPP cable. Not on szlcsc or Thomann.
  - Crescent Electric ($4.79 per search), Core Electronics and RS are all behind Cloudflare or Akamai blocks.
- **Links:** wago.com redirects to …/global/products/electrical-interconnections/…/221 (same page). Replaced.
- **Unresolved:** price.

## database/connectors/wieland-rst.yaml

- **No price.** Not on LCSC or Thomann.
- **Links:** the wieland-electric.com RST Classic page: 200, ok.
- **Unresolved:** price.

## database/connectors/xh.yaml

- **Price:** added tiers (LCSC C144402, JST XHP-3): 20: $0.0298, 200: $0.0236, 1000: $0.0197.
  - Source: https://www.lcsc.com/product-detail/C144402.html (stock 90020)
- **Links:** the Digi-Key product-highlight URL (product and digikey) returns 403. Blocked, left.

## database/connectors/xlr-3.yaml

- **Price:** added tiers (LCSC C368472, Neutrik NC3MXX, male cable connector): 1: $3.4966, 100: $3.2356, 1000: $3.2009.
  - Source: https://www.lcsc.com/product-detail/C368472.html (stock 134)
  - Thomann has the same part at $3.44.
- **Links:** the neutrik.com page returns 200 (JS-rendered). OK.

## database/connectors/xlr-5.yaml

- **Price:** added `[{qty 1, $5.90, sku NC5MXX}]`. Not on LCSC.
  - Thomann item 283114: https://www.thomannmusic.com/neutrik_nc5_mxx.htm
  - Page text: "Item number 283114 … $5.90 … In stock".
- **Links:** neutrik.com/en/products/lightning/xlr: 200 "XLR - Neutrik". OK.

## database/connectors/xt60-90.yaml

- **Price:** added tiers (LCSC C5334533, Amass XT60H-M): 1: $0.3882, 100: $0.3271, 1000: $0.2808.
  - Source: https://www.lcsc.com/product-detail/C5334533.html (stock 215793)
- **Links:**
  - sparkfun.com/products/10474 301-redirects to https://www.sparkfun.com/xt60-connectors-male-female-pair.html. Replaced.
  - The PDF link in `notes` (http://cdn.sparkfun.com/…/xt60.pdf) redirects to https and works. Left, since it's prose.

---

## Spelling (outside my slice)

`bunx cspell database/connectors/*.yaml` now flags four new words that come from vendor and part fields and can't be reworded: **Thomann, FXXA (NAC3FXXA-W-S), PFFP (M12A-04PFFP-SF8001), SPMXCA (SPMXCA502)**. The PR-only "Spell check changed files" CI step has no `continue-on-error`, so these need adding to `.cSpell/words.txt`, which is outside my slice. `ruggedized` in rj45.yaml was already flagged before this pass.

## (a) Files with price/status/related changes (34)

9159, bulgin-disco-8-pole, cee-form, d-c-barrel, deutsch-dt, df62w, dupont, en3, gx-16, harting-han-lectriflex, ic5-ec5, m12, mate-n-lok, mini-bucaneer, mini-fit-jr, molex-kk-aka-kf2510, mt30-60, mtsb-combicon, ph, picoblade, pigtails, powercon, powerpole-15-45, rean-rt4, rj45, sh, sm, speakon, superseal, vh-r, xh, xlr-3, xlr-5, xt60-90 (all price + price_source; no status/related set).
Many of these also have link swaps:

- 9159
- deutsch-dt
- df62w
- gx-16
- harting
- ic5-ec5 (dead_links)
- mate-n-lok
- mini-fit-jr
- kk
- mtsb
- ph
- picoblade
- powercon
- powerpole
- sh
- sm
- speakon
- xt60-90
- en3 (dead_links checked bump)

## (b) Files with ONLY link changes (4)

- eventcon (dead_links checked bump)
- sp13 (URL swap)
- sp17 (URL swap)
- wago-221 (URL swap)

## (c) Unresolved

- **Unpriced, no reachable published price (11):**
  - binder-720
  - chogori-standard-size
  - eventcon
  - hirschmann-ca
  - ld16-20-28 (AliExpress needs per-variant clicks across 3+ listings)
  - socapex
  - sp13
  - sp17 (Weipu not on LCSC/szlcsc)
  - teeplug
  - wago-221
  - wieland-rst
- **Lead-time (0-stock) LCSC ladders** used for 9159, bulgin-disco-8-pole, en3 and mini-bucaneer. A Mouser/Digi-Key check by hand would give better qty-1 prices.
- **Blocked to every client, left as-is (can't verify):**
  - Digi-Key: 9159, chogori, mtsb-combicon, powerpole, xh ×2
  - Farnell: binder-720, bulgin, hirschmann-ca
  - Mouser search: d-c-barrel ×2
  - RS: m12
  - bulgin.com: mini-bucaneer
  - flyingtech.co.uk: mt30-60
  - jst.com eVH.pdf: vh-r
- **superseal:** the TE PDF gives HTTP 500 (Node) and 403 (headless). Wayback capture 2025-10-12 exists. Needs a browser check to decide dead or blocked.
- **en3:** a candidate replacement https://www.switchcraft.com/en3-sealed-connectors/ renders blank to scripts. Needs a human check before swapping.
- **eventcon:** no current GLP URL found.
- **cspell:** words Thomann/FXXA/PFFP/SPMXCA need adding to `.cSpell/words.txt` (outside the slice).

## (d) Wrong facts for other workstreams

- **9159:** Kyocera AVX says 2–5 positions, 2.0 mm pitch, 3 A, 300 VAC, coplanar board-to-board card edge. The entry has 3.0 mm, 6 max pins, 5 A, 125 V, wire-to-wire/crimp/IDC. The creator is now "Kyocera AVX".
- **sm:** pitch 2.54 mm should be 2.5 mm (JST).
- **ph:** the notes describe XH (LiPo balance, 2.5 mm). PH is 2.0 mm (JST).
- **mate-n-lok:** pitch 5.1 mm, but Universal MATE-N-LOK is 6.35 mm.
- **sh:** `rows: 2` should be single row. `wire_to_wire: true` is doubtful (JST: wire-to-board).
- **mtsb-combicon:** the name "MTSB" should be "MSTB".
- **df62w:** smallest/largest gauge look swapped (20 vs 26 AWG).
- **teeplug:** smallest/largest gauge swapped or wrong (6 vs 16 AWG; the notes say 4 mm²).
- **hirschmann-ca:** `creator: Lumberg /Belden`. CA is Hirschmann (Belden), not Lumberg.
- **powercon / speakon:** Thomann's current cable connectors are NAC3FXXA-W-S and NL4FXX-W-L, while NAC3FCA and NL4FX now appear only at LCSC with 2 in stock. The notes could mention the current part numbers.
