# Software slice: pattern drivers + drive libraries (research pass, 2026-11-18)

Scope: `database/pattern-drivers/*.yaml` (40) and `database/drive-libraries/*.yaml` (29).
Every URL in every entry was fetched (Node fetch; headless Playwright for JS pages). GitHub
status from `gh api` (`archived`, `pushed_at`, latest commit, releases). Raw evidence log:
`C:\Users\camer\AppData\Local\Temp\claude\bd0b9027989833f3\64f3c4bf-0f67-4b5f-adf7-9fb5959390be\scratchpad\findings\software-notes.md`
(plus `sw\gh-repos.txt`, `sw\probe.tsv`, `sw\dl-activity.txt` in the same scratchpad).

Applied the policy addendum (regular not sale prices; brand-page redirects = dead; missing links
may be added) and the status-evidence rule: every status I set or confirmed carries a
`# src: <url> | 2026-11-18 | <note>` comment, as does every replacement item I added.
No GitHub repo in the slice is archived. Checks: `bunx eslint --fix`, `bunx prettier --write`,
`bun run validate pattern-drivers` (40/40) and `bun run validate drive-libraries` (29/29) all pass.

---

## Pattern drivers

### pattern-drivers/allpixmatrix.yaml

- Changes: none. Link OK (github.com/NLED/allpixmatrix).
- Evidence: no commit since 2018-12-20 ("Add files via upload"); README "Software Version: v.1b, Date Updated: December 19, 2018"; not archived. https://www.nledshop.com/nledallpixmatrix/ still offers "Download Software - Source Only".
- Unresolved: status stays `unknown` (downloadable, but no update in ~8 years and no support statement either way).

### pattern-drivers/arkaos.yaml

- Changes: status active → **discontinued** (src); `related` replacement → ChamSys MediaMaster (name+url); `dead_links` for https://www.arkaos.com/ (archive 2025-09-06 capture).
- Evidence: www.arkaos.com returns Cloudflare 522 (also on recheck); https://arkaos.com TLS error. Wayback: 301 → https://chamsyslighting.com/media-control/ Nov 2025–Feb 2026, 522 since 2026-06-27. ChamSys bought Arkaos SA's software portfolio (isp-audio.com, 2025-09-11: "Arkaos customers will be able to access MediaMaster and other Arkaos products through the ChamSys website"). https://chamsyslighting.com/support/product-policy/ lists ArKaos VJ, VJ Pro, NuVJ, GrandVJ ("GrandVJ 2.7.3 | Discontinued"), GrandVJ XT, LEDMaster, MediaMaster 1–6 ("MediaMaster 6.4.1 | Discontinued") and "MediaMaster 26 | In Development". Successor page https://chamsyslighting.com/product/mediamaster-software/ ("MediaMaster 26 ... built-in LED Mapper ... automatic Kling-Net discovery"). Archive https://web.archive.org/web/20250906170847/https://arkaos.com/ shows "Arkaos – Video For Lighting People ... Buy GrandVJ here!".
- Unresolved: price 299 left as is. The entry doesn't say which ArKaos product it means (GrandVJ? MediaMaster Express?), and the store is gone, so it can't be re-confirmed.
- Wrong facts: entry is a vendor-level "ArKaos" with no product name.

### pattern-drivers/arthet-led-mapper.yaml

- Changes: status unknown → **active** (src); added `links.url: https://github.com/cyberboy666/artnet_led_mapper` (entry had no link).
- Evidence: the repo README matches the entry's notes word for word ("input video from connected devices (webcams, capture cards etc) or over NDI ... output artnet across multiple universes"). Release `1_0_0` 2024-09-23, GPL-3.0. https://underscores.shop/product/artnet_led_mapper/: "name your price between 10-100 ... download compiled versions for linux mac_os, windows" (in stock).
- Wrong facts: name typo, "Arthet" should be "Artnet" (project is `artnet_led_mapper`). Price "Free" holds for the source code only; compiled builds are pay-what-you-want, €10–100.

### pattern-drivers/bekonix.yaml

- Changes: status `active` confirmed (src: Microsoft Store listing). Price left as is.
- Evidence: https://www.bekonix.com/ is now an enterprise "Bekonix Platform" page (Contact only; no downloads or plans). /plans → bekonix.outseta.com login, /platform 404. The Microsoft Store API for 9MTMCZTPVXWK gives "Bekonix Designer | Bekonix, Inc. | LastUpdateDateUtc 2026-04-02 | Free". App Store "Bekonix Mobile" (id1513072328): "Bekonix Designer (Mac) ... Bekonix OS ... for Adafruit Itsy Bitsy and Feather boards".
- Unresolved: price "Free- $99" can't be re-confirmed. The last public plans (Wayback 2024-05-19 /plans) were "Free $0/month, Pro $7/month, $149/month", and no plans are published now. The homepage link no longer shows the LED designer specifically; I left it, since it's the company/platform page and not a redirect.
- Wrong facts: "Bekonix ex Rocketlife / Rocketlife reborn" has no vendor statement behind it that I could find. The store descriptions do reuse RocketLife wording.

### pattern-drivers/bento.yaml

- Changes: status unknown → **active** (src).
- Evidence: GitHub releases "2.1.0b1 2025-11-17"; repo pushed 2026-01-15. Link http://github.com/benkuper/BenTo OK.

### pattern-drivers/blux.yaml

- Changes: status unknown → **active** (src).
- Evidence: github.com/benkuper/Blux last commit 2026-10-07. Product page http://benjamin.kuperberg.fr/blux (→ /blux/en, a language redirect, left as is) offers "Download the stable version" and "Download the beta version".

### pattern-drivers/chataigne-wled-mod.yaml

- Changes: status `active` confirmed (src).
- Evidence: https://github.com/zak-45/WLED-Chataigne-Module, not archived, last commit 2025-01-16 ("remove autoadd disable"), no releases. Sibling repos are active (WLEDVideoSync 2026-07-06, WLEDAudioSyncEssentia 2026-02-03).
- Wrong facts: `links.url` is the developer's GitHub profile, not the module repo (above).

### pattern-drivers/chataigne.yaml

- Changes: status `active` confirmed (src).
- Evidence: http://benjamin.kuperberg.fr/chataigne/en: "Download the stable version, current version is : 1.10.4". GitHub last commit 2026-11-17.

### pattern-drivers/chromatik.yaml

- Changes: status `active` confirmed (src); added `links.url: https://chromatik.co/` (entry had none); added `pricing.source` (price "Free - $399" re-confirmed).
- Evidence: https://chromatik.co/download/ "Version 1.2.1"; "Pro $399 / €399 / £319 ... Basic $199 / €199 / £159 ... Lite $99 / €99 / £79 ... Free"; network output 50,000 / 20,000 / 5,000 / 1,000 pixels; "All licenses are perpetual for the version purchased and can authorize 2 machines."
- Wrong facts: platforms list Windows+macOS only, but the download page also has Linux (x64/aarch64) command-line builds.

### pattern-drivers/dylos.yaml

- Changes: status `active` confirmed (src); `links.url` https://obsidiancontrol.com/dylos → https://www.obsidiancontrol.com/pages/dylos (redirect target); `dead_links` for the notes URL https://support.obsidiancontrol.com/Content/Onyx/Onyx_PC_Modes.htm (404), with archive https://web.archive.org/web/20211112071836/... (shows "ONYX FREE ... Universe 1 is completely free to use for Art-Net and sACN ... 2 DyLOS Zones are enabled"); `pricing.source` added (price "Free 1 universe" re-confirmed).
- Evidence: https://www.obsidiancontrol.com/pages/onyx "Universe 1 unlocked via Art-Net and sACN (ONYX "Free" License)"; Dylos page "5 DYLOS Zones / 2 DYLOS Zones in "Free" Mode / Up to 128 Universes, depending on ONYX License"; Obsidian store "ONYX Software $0.00".
- Wrong facts: notes say "Free for 2 DMX universes and 4 Dylos RGB Pixel zones". Current and archived pages both say 1 free universe and 2 free Dylos zones.

### pattern-drivers/elm.yaml

- Changes: status unknown → **active** (src); price **94 → 250** (ELM 2026 Professional, part 70581-PROF) plus `pricing.source` and `pricing.tiers` (Demo $0, Free $0, Professional $250, Architectural $1,999); `links.url` moved to https://www.enttec.com/product/dmx-lighting-control-software/pixel-mapping-software/ (old enttec.co.uk path redirects there; the .co.uk equivalent is /product/dmx-lighting-control-software/pixel-mapping-software/).
- Evidence (rendered page): "ELM 2026 drives up to 32,768 universes per protocol ... free to start, with perpetual licenses"; licensing table "Free $0 70581-FREE / Professional $250 70581-PROF / Architectural $1,999 70581-ARCH"; universes "2 / 16 base · packs → 32,768 / 256"; "ELM Free requires telemetry / marketing opt-in". Prices are from the US site (geo-redirected).
- Wrong facts: demo "Nag for free one" is outdated. There is now a watermarked Demo and a no-watermark Free edition (2 universes).

### pattern-drivers/faith-chapel.yaml

- Changes: none. Link OK. The page renders by JS; the `?fbclid=` tracking parameter is harmless but could be dropped.
- Evidence: "Chris Monson - 11.26.18 ... Download v1.0.4".
- Unresolved: status stays `unknown` (one 2018 release, no newer activity found).

### pattern-drivers/falconplayer.yaml

- Changes: status unknown → **active** (src).
- Evidence: github.com/FalconChristmas/fpp release "10.4 2026-11-09".

### pattern-drivers/fastled-fx-engine.yaml

- Changes: status unknown → **active** (src); added `links.url: https://github.com/FastLED/FastLED` (entry had no link).
- Evidence: FastLED commit 2026-03-21 "remove src/fx and update tests". The FX engine now lives at https://github.com/FastLED/FastLED/tree/master/src/fl/fx (fx_engine.h, fx1d/fx2d, video, wled), last changed 2026-10-08. FastLED release 3.10.9 2026-11-01.

### pattern-drivers/geopix-2-0-full.yaml

- Changes: status unknown → **active** (src); `dead_links` for https://www.geopix.io/ (NXDOMAIN), archive https://web.archive.org/web/20220926122338/https://www.geopix.io/ ("GeoPix 2.0 is now open source!"); added `links.mirror: https://github.com/EnviralDesign/GeoPix`.
- Evidence: repo not archived. Last release "oct-2023" (v2.0.15523). The last commit (2026-02-27, "tweak") updated GeoPix.exe and GeoPix_2.0.toe and bumped the README to "GeoPix v2.0.15534 (2024-02-22)". geopix.io 301'd from 2025-03 and is now NXDOMAIN.
- Unresolved/soft: "active" rests on that 2026-02 build commit. Feature development otherwise stopped around 2023–24.

### pattern-drivers/geopix0-9.yaml

- Changes: status unknown → **discontinued** (src); `related` replacement → `pattern-drivers/geopix-2-0-full` (src).
- Evidence: the 2020 capture https://web.archive.org/web/20201030041622/https://www.enviral-design.com/ shows "GeoPix 1.0 now available! Get it at www.geopix.io ... GeoPix v0.9.07 FREE (Locked Network) / GeoPix v0.9.07 PAID (Open Network)". The current https://www.enviral-design.com/ is a portfolio page with no 0.9 download.
- Note: the link (creator homepage) still works but no longer shows 0.9. I left it, since it's not a redirect.

### pattern-drivers/jinx.yaml

- Changes: `links.url` https://oneguyoneblog.com/download/glediator-v2-0-3/ → **https://live-leds.de/** (Jinx!'s official site). The old URL was a third-party _Glediator_ download page, not Jinx!, and it has been dead since 2025-02 (Cloudflare 522 live; Wayback captures all 526).
- Evidence: https://live-leds.de/ "Jinx! – LED Matrix Control ... free available software"; /downloads/ "latest Jinx! Version: (Version 2.4)"; feed "Jinx! V2.4" posted 2016-05-16.
- Unresolved: status `end-of-life` left without a src comment. Still downloadable, last release 2016, but I found no EOL announcement.
- Wrong facts: creator "Solderlab.de" (Solderlab made Glediator; Jinx! is from live-leds.de). `integrations: Should be solderlab.de (which is down)` is an editorial note, not an integration.

### pattern-drivers/led-strip-studio-software.yaml

- Changes: status `active` confirmed (src); `links.url` → https://www.ledstripstudio.com/products/lss4/ (old URL redirects there); **price added: €53** (`pricing.price` was missing) with `pricing.source`.
- Evidence: product page "LSS4 — Pixel LED Mapping Software ... Version 4.0.42 ... DOWNLOAD FOR WINDOWS / DOWNLOAD FOR MACOS". Shop https://www.ledstripstudio.com/shop/product/pixel-led-mapping-software/ variation data (EUR, "excl. VAT"), regular → current sale: 1 universe 53→15, 6: 200→57, 12: 336→96, 64: 1008→288, 512: 3584→1024. A separate "Art-Net License for LED Strip Studio 4 – 5 Years" listing has the same regular prices (sale from €45). Regular price recorded, sale noted (per addendum).
- Wrong facts: platforms Windows only, but LSS4 now has a native macOS build.

### pattern-drivers/lededit.yaml

- Changes: none. Link OK ("Download LED Edit 2014 2016 2017 2018 Software", third-party blog).
- Unresolved: status `unknown` (no official vendor page found; creator field empty).

### pattern-drivers/ledfx.yaml

- Changes: status `active` confirmed (src). Evidence: release v2.2.1 2026-10-04.

### pattern-drivers/leds-master.yaml

- Changes: added `links.mirror: https://github.com/spectrenoir06/LED_master` (the project's repo, linked from its own page).
- Evidence: https://antoine.doussaud.org/leds_master and the whole doussaud.org site return Cloudflare 502 Bad gateway. This is a server error, not a 404, so I didn't mark it dead. Last good capture is 2025-07-11 ("LEDs master is a software for controlling big RGB LED matrix ... Github repo"). Repo last commit 2021-04-25, release V0.4 2020-07-08, not archived.
- Unresolved: status `unknown`. Recheck the 502 later; if it persists, add `dead_links` with archive https://web.archive.org/web/20250711014323/https://antoine.doussaud.org/leds_master.
- Wrong facts: price "FOSS", but the repo has no license file.

### pattern-drivers/lightdesigner.yaml

- Changes: status `discontinued` confirmed (src); `dead_links` for https://www.rocketlife.com/technology/, archive https://web.archive.org/web/20191115023243/https://www.rocketlife.com/technology/ (shows "LightDesigner", "LightMobile", "LightBox & LightBoard Mini").
- Evidence: HTTPS connection reset; http://www.rocketlife.com/technology/ → HTTP 410; domain parked (2025 captures). Note: the Microsoft Store still lists "RocketLife LightDesigner | RocketLife, Inc | Free" (9NWK9DKV7DFL, LastUpdateDateUtc 2026-05-29), but there's no vendor site or support.
- Unresolved: no vendor statement that Bekonix is the successor, so no replacement item added.

### pattern-drivers/lightjams.yaml

- Changes: status `active` confirmed (src); `pricing.source` added (price "125 - 450" re-confirmed).
- Evidence: https://www.lightjams.com/portal/buy-lightjams.php "Lightjams Express 1U $125.00 USD / Pro 4U $250.00 / Super 16U $350.00 / Ultimate 256U $450.00"; rental "2 Days $40 / 33 Days $125 / 1 year $250". history.html top entry "August 6, 2026".

### pattern-drivers/lightmobile.yaml

- Changes: status `discontinued` confirmed (src); same `dead_links` entry as lightdesigner.
- Evidence: as for lightdesigner. A guessed Google Play id 404'd and no App Store listing was found.

### pattern-drivers/lumiastream.yaml

- Changes: price **"Free- $30/month" → "Free - $5.99/month"** plus `pricing.source`; status `active` confirmed (src).
- Evidence: https://lumiastream.com/pricing (rendered): "Premium $5.99 per month* $32.99 every 6 months* $59.99 per year\*"; a lifetime plan is mentioned with no price.

### pattern-drivers/lx-studio-chromatik.yaml

- Changes: status active → **end-of-life** (src); `related` replacement → `pattern-drivers/chromatik` (src).
- Evidence: https://lx.studio/ "LXStudio is now chromatik ... The next generation has arrived. LX Studio has become Chromatik." The GitHub heronarts/LXStudio description reads "END OF LIFECYCLE. See: https://github.com/heronarts/Chromatik" (not archived, still downloadable, pushed 2024-02-23). The LXStudio-IDE README has "END OF LIFECYCLE NOTICE ... LX Studio has been superceded by the Chromatik Digital Lighting Workstation".
- Wrong facts: name "LX Studio / Chromatik" and notes ("Next version (Chromatik) will no longer use the Processing graphics library") are outdated. Chromatik has its own entry, so this one is effectively LX Studio.

### pattern-drivers/madmapper.yaml

- Changes: price **420 → €479** plus `pricing.source`; status `active` confirmed (src).
- Evidence: https://madmapper.com/madmapper/software (rendered, US): "Buy MadMapper 6 ... From $545.44 excl tax ... A perpetual license that works forever for the current 6.xx MadMapper version. One extra seat included"; "Rent ... From $50.10/month excl tax"; "UPGRADE FROM $181.05 + TAX". The page's product data is `"version":6,"temporary":45,"perpetual":479,"upgrade":159`, and the api.madmapper.com `priceByProduct` call returns `euroNetPrice: 479`. So the shop's base price is €479 excl. VAT; the US figure is a conversion.
- Wrong facts: creator "Smode Tech". The site says "MadMapper sàrl" (legal notice), "a collaborative software project between the french installation studio 1024 architecture and the swiss software makers GarageCube".

### pattern-drivers/madrix-5.yaml

- Changes: status `active` confirmed (src). Prices not changed.
- Evidence: https://www.madrix.com/products/software lists licenses start (1,024 DMX ch), entry (6,144), basic (18,432), professional (67,584), ultimate (264,192), maximum (2,101,248), plus preprogrammer, with no prices: "Contact A Reseller For Your Individual Quote".
- Unresolved: tier prices (330/600/1650/3300) can't be re-confirmed from the vendor. Reseller prices vary widely (search snippet only: Buzz-shop NL professional €3,540.25 list; Steinigke "List price: on demand").
- Wrong facts: the tiers are misnamed and misordered. "Start" is the smallest license (described in the YAML as "Increased universe count" above Entry). Basic and Ultimate are missing, and "Maximum" exists alongside Ultimate.

### pattern-drivers/magicq.yaml

- Changes: status `active` confirmed (src); `pricing.source` added (price "Free 64 universes" re-confirmed).
- Evidence: https://chamsyslighting.com/software/magicq-software-licensing/ "DEMO MODE – Free Software with no ChamSys Hardware connected ... 64 universes Art-Net / ACN Output fully enabled." https://downloads.chamsys.co.uk/magicq "18 Nov 2026 · Latest Stable".

### pattern-drivers/mapio-pro.yaml

- Changes: price **234 → €200** plus `pricing.source`; status `active` confirmed (src).
- Evidence: https://visution.com/ "PRO €200 + VAT (for buyers in the Euro zone)", "LITE €100", "BUY NOW" (2Checkout). Feed: last update post "MAPIO update 2.3.4 changelog" 2020-06-10. "Attention! macOS version is outdated. MAPIO for macOS development is currently suspended."
- Wrong facts: creator "Vistitution" should be "Visution". The entry has no `platforms` (Windows; Linux free beta; macOS frozen at 2.2.9).

### pattern-drivers/millumin.yaml

- Changes: status `active` confirmed (src); `pricing.source` added (price "39/week +" re-confirmed in USD).
- Evidence (rendered for a US visitor): "Rent ... One week, month or year STARTS AT US$ 39", "Permanent license STARTS AT US$ 499", upgrade "US$ 110". Static (EUR) HTML: "Starts at 29€" / "Starts at 399€" / "Starts at 85€". "Millumin V5 requires macOS Big Sur 11 minimum."
- Note: `links.url` `https://www.millumin.com//` has a stray double slash (works, redirects to /v5/index.php).

### pattern-drivers/pixelblaze.yaml

- Changes: status `active` confirmed (src); `pricing.source` added (price 39 re-confirmed, part EM-PIXELBLAZE-PB32XL).
- Evidence: shop.electromage.com product .json/.js "Pixelblaze V3 Standard - WiFi LED Controller | XL EM-PIXELBLAZE-PB32XL $39.00", available=true. Pico+ (EM-PB-PICO32P6A) $35.00.

### pattern-drivers/protopixel-create.yaml

- Changes: status unknown → **active** (src); `links.url` https://www.protopixel.io/design → **https://www.protopixel.io/product/mapping-tool** (product renamed).
- Evidence: /design now renders "404 – Page Not Found" (soft 404); the Wayback 2022-11-27 capture showed "ProtoPixel Create ... Try ProtoPixel Create for free". Help-center article https://protopixel.zendesk.com/hc/en-us/articles/31199693048977-Content (updated 2026-04-14): "These instructions only work for the Mapping Tool (formerly known as Create) 3.0 or higher versions." Product page: "Mapping Tool ... SPI DMX NDI Art-Net Syphon ... Download Mapping Tool". Install guides for macOS (2026-02-16) and Windows (2026-04-14).
- Unresolved: price 176 left. No public price on the product, compare-products or help pages.
- Wrong facts: the product is now "Mapping Tool" (name). Platforms should add Windows.

### pattern-drivers/qlc.yaml

- Changes: status `active` confirmed (src). Evidence: release "QLC+\_5.3.1 2026-11-05". Links OK.
- Wrong facts: creator "Massimo Calegari" should be "Massimo Callegari" (qlcplus.org title: "QLC+ by Massimo Callegari"). Demo "€15 Donation requested" not verified.

### pattern-drivers/resolume.yaml

- Changes: price/tiers changed to original currency: `price` "299-799" → "€299-799"; tiers 299/799 → "€299"/"€799" (the bare numbers rendered as USD). Added `pricing.source`; status `active` confirmed (src).
- Evidence: https://resolume.com/shop "Avenue € 299.00 Euro", "Arena € 799.00 Euro" (also "Wire € 399.00 Euro"); 12 months of updates included, renewable. The shop doesn't state VAT.

### pattern-drivers/smode.yaml

- Changes: `links.url` https://smode.fr/ → https://www.smode.io/en/ (redirect target); status `active` confirmed (src).
- Evidence: https://www.smode.io/en/product/live-media-server: LIVE BASIC / LIVE 1 / LIVE 2 / LIVE 4 all "CONTACT US"; Smode Compose "300 € / year ( Excl. VAT. )"; Smode Community free.
- Unresolved: price "Expensive" left as is. Smode Live (the LED/pixel-mapping product) has no published price.
- Wrong facts: demo "Free for SD card output" is outdated. Smode Community is "fully usable without watermarks up to the Full HD resolution (1920x1080)", non-commercial. The creator field is missing (Smode Tech).

### pattern-drivers/touchdesigner.yaml

- Changes: status `active` confirmed (src); `pricing.source` added (tiers Free/300/600/2200 re-confirmed, USD).
- Evidence: https://derivative.ca/UserGuide/Licensing table: Non-Commercial "No Charge", Educational "$300 USD", Commercial "$600 USD", Pro "$2200 USD". The shop shows "TouchDesigner Pro - $2,200.00", "TouchDesigner Commercial - $600.00".
- Wrong facts: Non-Commercial limitation "watermark on export". The licensing page says the limit is "1280x1280 limited" resolution; no watermark is mentioned.

### pattern-drivers/vixen-lights.yaml

- Changes: status unknown → **active** (src); `links.url` https://www.vixenlights.com/downloads/ (403 to everyone, including Wayback since 2025-06) → https://www.vixenlights.com/download/ (the site nav's current Download page).
- Evidence: GitHub VixenLights/Vixen release "3.13u4 2026-10-22", DevBuild-1557 2026-11-12.

### pattern-drivers/wled.yaml

- Changes: `links.url` https://github.com/Aircoookie/WLED → https://github.com/wled/WLED (repo moved); status `active` confirmed (src).
- Evidence: release v16.0.1 2026-07-07; repo pushed 2026-11-18.

### pattern-drivers/xlights.yaml

- Changes: status `active` confirmed (src). Evidence: release "2026.20 2026-11-12". Link OK.

---

## Drive libraries

### drive-libraries/arduino-ethernet-nano-with-enc28j60.yaml

- Changes: none. Link OK. Last commit 2019-03-04, no releases, not archived.
- Unresolved: status `unknown` (stale, no discontinuation statement).

### drive-libraries/artemis.yaml

- Changes: status `active` confirmed (src). Evidence: github.com/Artemis-RGB/Artemis last commit 2026-10-27; https://artemis-rgb.com/ (rendered) "RELEASES / DOWNLOAD".
- Wrong facts: `links.repo` is the website, not the repo (https://github.com/Artemis-RGB/Artemis). GitHub reports the license as NOASSERTION; the YAML's PolyForm-Noncommercial-1.0.0 wasn't checked.

### drive-libraries/artnet-dmx-sd-card.yaml

- Changes: none. Link OK. Last commit 2018-11-14 ("Bug fixes"), not archived, no license.
- Unresolved: status `end-of-life` has no evidence (no EOL notice). Left as is, with no src.

### drive-libraries/artnet-receive.yaml

- Changes: none. Link OK.
- Unresolved: status `active` not confirmed. Last commit 2021-11-03, last release v1.0 2014-12-01 (pushed_at 2024-07-09 is not a default-branch commit). No discontinuation statement either; left without src.

### drive-libraries/artnet-to-tmp2-convertor.yaml

- Changes: none. Link http://www.tlhome.de/ATCE.htm OK ("ATCE Artnet to TPM2 Converter + Editor", ZIP installer and PDF manual downloads).
- Unresolved: status `unknown` (page undated).
- Wrong facts: name says "TMP2"; the format is TPM2. Features say "TMP2(Jinx native)".

### drive-libraries/artnet2twinkly.yaml

- Changes: status end-of-life → **discontinued** (src). `dead_links` entry updated: checked → 2026-11-18, archive added https://web.archive.org/web/20240705183448/http://www.artnet2twinkly.com/artnet2twinkly.html.
- Evidence: artnet2twinkly.com NXDOMAIN. The 2024-07-05 capture says: "Important Note: Artnet 2 Twinkly PC App in its current form is being retired. I am working on a new cross-platform solution ... -John Lord". The 2025 captures are a parked "/lander". No successor found (searched). YouTube channel link OK.

### drive-libraries/artnetwifi.yaml

- Changes: status `active` confirmed (src). Evidence: release 1.6.3 2026-07-28.

### drive-libraries/blip.yaml

- Changes: status `active` confirmed (src). Evidence: last commit 2026-10-01 "Fix OSCQuery enum labels and release 1.2.3" (tag 1.2.3).

### drive-libraries/branchcontroller2.yaml

- Changes: none. Link OK. Last commit 2020-03-01, tag v0.0.
- Unresolved: status `unknown`.
- Wrong facts: features say "over TCP-IP"; the repo description says "over UDP".

### drive-libraries/esp-131-gpio.yaml

- Changes: status `active` confirmed (src). Evidence: last commit 2025-09-28 (README update; the code itself is older).

### drive-libraries/espixelstick.yaml

- Changes: status `active` confirmed (src). Evidence: last commit 2026-11-11 (latest tagged release v4.0-beta5, 2023-12-01).

### drive-libraries/fab-led.yaml

- Changes: none. Link OK. Last commit 2022-05-30, no releases, not archived.
- Unresolved: the entry has no `status` field. Stale; no evidence for any value.

### drive-libraries/fade.yaml

- Changes: none. Links OK (blog post dated "Jul 24, 2021"; YouTube OK).
- Unresolved: status `unknown`. No code repo is linked from the post.
- Wrong facts: `links.repo` is a blog post.

### drive-libraries/fastled.yaml

- Changes: status `active` confirmed (src). Evidence: release 3.10.9 2026-11-01. YouTube OK.

### drive-libraries/fastledvirtualdriver.yaml

- Changes: none. Link OK. Last commit 2021-08-08; the README is still the stock FastLED 3.2 README; no deprecation notice.
- Unresolved: status `unknown`.

### drive-libraries/led-mapper.yaml

- Changes: status `active` confirmed (src). Evidence: last commit 2025-04-29 ("Add Clone controls to Map Config tab.").

### drive-libraries/led-strip-effects-generator.yaml

- Changes: none. Link OK. Last commit 2024-04-08, last release v3.0 2019-10-22.
- Unresolved: status `unknown` (just outside the ~2-year window).

### drive-libraries/lightwork.yaml

- Changes: none. Link OK. Last release v0.2.1-alpha 2018-02-03 (tag v0.3-alpha); pushed 2019-06-28.
- Unresolved: the entry has no `status` field.

### drive-libraries/mobaledlib.yaml

- Changes: status `active` confirmed (src). Evidence: last commit 2026-11-13; release v3.5.0 2025-11-07.

### drive-libraries/neopixel.yaml

- Changes: status `active` confirmed (src). Evidence: release 1.15.5 2026-05-12; last commit 2026-11-12. YouTube OK.

### drive-libraries/nightdriverstrip.yaml

- Changes: status `active` confirmed (src). Evidence: release v2.0.1 2026-06-14. YouTube OK.

### drive-libraries/octows2811.yaml

- Changes: status `active` confirmed (src). Evidence: the PJRC library page is live; the library ships with Teensyduino. GitHub PaulStoffregen/OctoWS2811 last commit 2023-07-28, release 1.5 2022-03-30.
- Note: this is the softest "active" in the slice (supported rather than recently updated).

### drive-libraries/openrgb.yaml

- Changes: status `active` confirmed (src). Evidence: GitLab CalcProgrammer1/OpenRGB "release_1.1 2026-10-16"; openrgb.org "Version 1.1".
- Wrong facts: `links.repo` is the website; the repo is https://gitlab.com/CalcProgrammer1/OpenRGB.

### drive-libraries/orange-pi-dmx.yaml

- Changes: status `active` confirmed (src). Evidence: github.com/vanvught/rpidmx512 last commit 2026-07-26; www.orangepi-dmx.org OK.

### drive-libraries/teensydmx.yaml

- Changes: none. Link OK. Last commit 2023-06-27 (FUNDING.yml), last release v4.2.0 2021-05-29.
- Unresolved: status `unknown`.

### drive-libraries/triantaduows2811.yaml

- Changes: none. Link OK. Last commit 2020-01-12.
- Unresolved: status `unknown`.

### drive-libraries/visuino.yaml

- Changes: status `active` confirmed (src). Evidence: https://www.visuino.com/visuino-downloads/ "For Windows · Version 8.0.0.167"; Pro version sold. http://visuino.com/ → https://www.visuino.com/ (plain redirect, left).
- Wrong facts: `links.repo` is the vendor site (closed-source product).

### drive-libraries/wled.yaml

- Changes: `links.repo` Aircoookie/WLED → https://github.com/wled/WLED; the existing `dead_links` entry for https://www.welcometothefuture.one/blog/wled-get-started got checked → 2026-11-18 and archive https://web.archive.org/web/20211113051625/https://www.welcometothefuture.one/blog/wled-get-started ("Getting Started With WLED in 2021"); status `active` confirmed (src).
- Evidence: the blog URL still returns 404; install.wled.me OK; YouTube OK; release v16.0.1 2026-07-07.

### drive-libraries/xod.yaml

- Changes: none. Links OK.
- Evidence: https://xod.io/ "Download Desktop IDE v0.38.0 (2021-03-12)"; GitHub last default-branch commit 2021-03-12, release v0.38.0 2021-03-14 (pushed_at 2026-10-28 is not a default-branch commit).
- Unresolved: status `unknown` (still downloadable, no updates since 2021, no statement).

---

## Lists

### (a) Files with price / status / related changes

Pattern drivers:

- arkaos: status → discontinued, replacement ChamSys MediaMaster (+ dead_links)
- arthet-led-mapper: status → active (+ links.url added)
- bento: status → active
- blux: status → active
- chromatik: pricing.source added (price re-confirmed) (+ links.url added)
- dylos: pricing.source added (+ dead_links, url moved)
- elm: status → active, price 94 → 250, tiers added (+ url moved)
- falconplayer: status → active
- fastled-fx-engine: status → active (+ links.url added)
- geopix-2-0-full: status → active (+ dead_links, mirror added)
- geopix0-9: status → discontinued, replacement → geopix-2-0-full
- led-strip-studio-software: price added €53 (+ url moved)
- lightjams: pricing.source added (re-confirmed)
- lumiastream: price → Free - $5.99/month
- lx-studio-chromatik: status → end-of-life, replacement → chromatik
- madmapper: price 420 → €479
- magicq: pricing.source added (re-confirmed)
- mapio-pro: price 234 → €200
- millumin: pricing.source added (re-confirmed)
- pixelblaze: pricing.source added (re-confirmed)
- protopixel-create: status → active (+ url moved to Mapping Tool)
- resolume: price/tiers → EUR (€299-799)
- touchdesigner: pricing.source added (re-confirmed)
- vixen-lights: status → active (+ url moved)

Drive libraries:

- artnet2twinkly: status → discontinued (+ dead_links archive)

Status only re-confirmed (`# src:` comment added, value unchanged):

- Pattern drivers: bekonix, chataigne-wled-mod, chataigne, ledfx, madrix-5, qlc, xlights
- Drive libraries: artemis, artnetwifi, blip, esp-131-gpio, espixelstick, fastled, led-mapper, mobaledlib, neopixel, nightdriverstrip, octows2811, openrgb, orange-pi-dmx, visuino

### (b) Files with ONLY link changes (`dead_links` / URL swaps; some also got a status src comment)

- pattern-drivers/jinx: url swapped to live-leds.de (old link was a dead Glediator page)
- pattern-drivers/leds-master: links.mirror added (GitHub)
- pattern-drivers/lightdesigner: dead_links rocketlife.com/technology (+ src comment)
- pattern-drivers/lightmobile: dead_links rocketlife.com/technology (+ src comment)
- pattern-drivers/smode: smode.fr → smode.io/en (+ src comment)
- pattern-drivers/wled: Aircoookie/WLED → wled/WLED (+ src comment)
- drive-libraries/wled: repo → wled/WLED, dead_links archive + checked (+ src comment)

### (c) Unresolved

- Prices not re-confirmable:
  - arkaos 299 (product unknown, store gone)
  - bekonix "Free- $99" (no public plans; 2024 plans were $0 / $7 / $149 per month)
  - madrix-5 tiers (vendor publishes none; resellers vary)
  - protopixel-create 176 (no public price)
  - smode "Expensive" (Live tiers are "Contact us")
- Status left unknown or unconfirmed:
  - Pattern drivers: allpixmatrix, faith-chapel, lededit, leds-master
  - jinx (end-of-life, no EOL notice; last release 2016)
  - geopix-2-0-full "active" rests on a 2026-02 build commit
- Drive libraries:
  - artnet-receive: "active" unconfirmed, last commit 2021-11
  - artnet-dmx-sd-card: "end-of-life" unconfirmed, 2018
  - arduino-ethernet-nano-with-enc28j60: 2019
  - artnet-to-tmp2-convertor: undated
  - branchcontroller2: 2020
  - fab-led: no status field, 2022
  - fade: 2021
  - fastledvirtualdriver: 2021
  - led-strip-effects-generator: 2024-04
  - lightwork: no status field, 2018–19
  - teensydmx: 2023
  - triantaduows2811: 2020
  - xod: 2021
- Links:
  - leds-master: whole site Cloudflare 502. Not marked dead; archive ready if it persists (20250711014323).
- Schema mismatch: the drive-library schema says "end-of-life = archived/unmaintained", while this pass's brief says archived = discontinued. No archived repos in the slice, so nothing hinged on it.

### (d) Wrong facts for other workstreams

- madmapper: creator "Smode Tech" → MadMapper sàrl (GarageCube + 1024 architecture)
- mapio-pro: creator "Vistitution" → Visution; platforms missing (Windows; macOS dev suspended)
- madrix-5: tier names/order wrong (start < entry < basic < professional < ultimate < maximum)
- touchdesigner: Non-Commercial is 1280x1280-capped, not "watermark on export"
- dylos: notes "2 universes + 4 Dylos zones" → 1 free universe, 2 free zones
- elm: demo "Nag for free one" → watermarked Demo plus a Free edition (2 universes)
- smode: demo "Free for SD card output" → Community edition free to 1920x1080, non-commercial; creator missing
- protopixel-create: product renamed "Mapping Tool"; add Windows platform
- led-strip-studio-software: add macOS platform
- chromatik: add Linux (CLI builds)
- lx-studio-chromatik: name/notes outdated; effectively LX Studio (Chromatik has its own entry)
- jinx: creator should be live-leds.de, not Solderlab.de (Glediator's maker); `integrations` holds an editorial note
- arthet-led-mapper: name typo (artnet_led_mapper); compiled builds are pay-what-you-want €10–100
- leds-master: "FOSS" but the repo has no license
- qlc: creator "Calegari" → Callegari
- chataigne-wled-mod: url is the dev's profile; module repo is zak-45/WLED-Chataigne-Module
- bekonix: "ex Rocketlife / reborn" has no vendor source
- arkaos: entry names no product
- artnet-to-tmp2-convertor: "TMP2" → TPM2
- branchcontroller2: "TCP-IP" → UDP per repo
- links.repo holds a website, not a repo: artemis, openrgb (repo is on GitLab), visuino (closed source), xod, fade (blog post)
- display: pattern-driver range strings ("125 - 450", "Free-$2200", "€299-799", "39/week +") don't parse, so the table shows "-"
