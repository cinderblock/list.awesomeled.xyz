# Database review: research notes

Sourced findings gathered for `plans/database-review.md`. Each fact carries
its source; apply them when the matching category is migrated. Dates are when
the source was read.

## Pattern drivers: I/O directions (read 2026-11-18)

Direction vocabulary: `in` (software receives), `out` (software sends),
`both`, `false` (not supported).

Corrections to the sheet's values:

- Chromatik DMX "Possible": no built-in USB/serial DMX; outputs are Art-Net, ArtSync, sACN, DDP, OPC (incl. Fadecandy), KiNET. → `false` + note (DMX only via an Art-Net/sACN node or a Java plugin). <https://chromatik.co/guide/dmx/>, <https://github.com/heronarts/LX/tree/master/src/main/java/heronarts/lx/output>
- WLED GPIO "Possible": built in (button/switch/PIR in, relay out) → `both`. <https://kno.wled.ge/features/relay-control/>, <https://kno.wled.ge/features/settings/>
- WLED sends DDP (0.13+) and Art-Net (0.14.0+) but not sACN (empty send branch). <https://kno.wled.ge/advanced/ddp/>, <https://github.com/wled/WLED/blob/main/wled00/udp.cpp>
- Millumin video "Possible": live input built in → `both`. <https://help.millumin.com/docs/connect/capture/>
- QLC+ GPIO "Output": plugin does input and output (Linux) → `both`. <https://github.com/mcallegari/qlcplus/blob/master/plugins/gpio/gpioplugin.cpp>
- Jinx! GPIO "Input": not in the v2.4 manual, Windows-only → `false`. <https://live-leds.de/download/190/>
- Jinx! lives at <https://live-leds.de/>; solderlab.de (Glediator's maker) is a placeholder.

Per product (item → direction):

- **MADRIX 5** — Art-Net both (input = Art-Net Remote, 4 universes); sACN both; DMX512 USB both (MADRIX-brand interfaces only, Windows); KiNET out; DDP/OPC/serial/GPIO false; audio both; video both (NDI/Spout send+receive, capture, DVI out). Visualizer 3D. Demo: free download, no Art-Net/DMX/KiNET/sACN output and black DVI without a MADRIX 5 KEY. Perpetual license on a USB key; MADRIX publishes no prices ("contact a reseller"); Wiedamark lists Start $63.53, Entry $519.75, Basic $1,466.85, Professional $3,811.50 (low confidence). <https://www.madrix.com/products/madrix-5>, <https://help.madrix.com/m5/html/madrix/hid_remotecontrol_dmx.html>, <https://help.madrix.com/m5/html/madrix/hidd_madrix_key.html>, <https://www.wiedamark.com/pcat/controlsolutions/madrixcontrolsolutions/>
- **Resolume 7.29** — Art-Net both (Arena only; Avenue false); sACN false ("only support Art-Net based devices"); DMX USB false; KiNET/DDP/OPC/serial/GPIO false; audio both; video both. Visualizer 2D. Demo free, all features, watermark + occasional robot voice. Perpetual + 12 months updates: Avenue €299, Arena €799, Wire €399; renewals €79/€219/€119. <https://resolume.com/support/en/dmx>, <https://resolume.com/support/en/avenue-arena-difference>, <https://resolume.com/shop>
- **TouchDesigner** — Art-Net, sACN, DMX USB, KiNET both; DDP/OPC false (scriptable only); serial both; GPIO false; audio both; video both. Visualizer 3D. Free Non-Commercial license (1280×1280 cap, non-commercial). Perpetual + 1 yr updates (USD): Educational $300, Commercial $600, Pro $2,200. <https://docs.derivative.ca/DMX_Out_CHOP>, <https://docs.derivative.ca/DMX_In_CHOP>, <https://derivative.ca/UserGuide/TouchDesigner_Products>
- **Chromatik** — Art-Net both; sACN out; DMX false; KiNET, DDP, OPC out; serial/GPIO false; audio both; video false. <https://chromatik.co/guide/custom-fixtures/>, <https://chromatik.co/guide/audio/>
- **WLED 16.0.1** — Art-Net both; sACN in; DMX512 both (RS-485 on GPIO, special builds); KiNET/OPC false; DDP both; serial in; GPIO both; audio in (AudioReactive, 0.15+); video false. <https://kno.wled.ge/interfaces/e1.31-dmx/>, <https://kno.wled.ge/interfaces/ddp/>, <https://kno.wled.ge/interfaces/dmx-output/>, <https://kno.wled.ge/interfaces/serial/>
- **Millumin 5.14** — Art-Net both; sACN both; DMX USB both (Enttec Pro/Mk2); KiNET/DDP/OPC false; serial false; GPIO both via Arduino/Teensy; audio both; video both. <https://help.millumin.com/docs/connect/devices/>, <https://help.millumin.com/v4/tutorials/using-electronic-devices-such-as-arduino/>
- **QLC+ 5.3.1** — Art-Net, sACN both; DMX USB both (Open DMX/Vince out only); KiNET/OPC only via OLA (out); DDP false; serial out (UART DMX framing, Linux); GPIO both; audio both; video out. <https://docs.qlcplus.org/v4/plugins/art-net>, <https://docs.qlcplus.org/v4/plugins/dmx-usb>
  - SPI out (the sheet's "also SPI"): `plugins/spi/spiplugin.cpp` "This plugin provides DMX output for SPI devices", capabilities `Output`, opens `/dev/spidev0.0`. UART: `plugins/uart/uartplugin.cpp` "This plugin provides output for UART devices", `Output` only (Input commented out). <https://github.com/mcallegari/qlcplus/tree/master/plugins/spi>, <https://github.com/mcallegari/qlcplus/tree/master/plugins/uart>
- **Jinx! 2.4** — Art-Net both; sACN both; DMX USB both; KiNET/DDP/OPC false; serial both (tpm2/Glediator/MiniDMX out, tpm2 in); GPIO false; audio in; video both. <https://live-leds.de/features/>, <https://live-leds.de/download/190/>

## Diffusive materials: compositions and identities (read 2026-11-18)

Material codes: paper, PE, LDPE, HDPE, XLPE, PP, PET, PVC, EVA, PCL, PC, PMMA,
PAN (acrylic fibre), TPU, silicone. Codes found to be needed beyond that list:
modacrylic (faux fur), PA/nylon (some split loom), POE/TPE (Oyumaru, if
confirmed), cellulose propionate (custom Rowlux), glass (Luminit).

Corrections to existing data:

- **3M Envision** "polyester" → **PVC**: 3M Envision Diffuser Film 3735-50/-60 is cast PVC, 50 µm, 50/60 % transmission. <https://www.foliencenter24.com/mediafiles/pdf/werbetechnik/lichtwerbung/lichtmanagement-folien/3m_envision_diffusor_folie_3735_techn_datenblatt.pdf>
- **Diffraction grating** "PC ?" → **PET**: Edmund Optics #40-267, 25,400 grooves/in, clear polyester film, 0.003 in (≈76 µm). <https://edmundoptics.in/f/PdfExport/11661>
- **PEX pipe** "Ethylene Copolymer" → **XLPE** (PEX is cross-linked PE); 3.2 is mm: 1" PEX SDR 9 wall = 0.125 in (3.18 mm). <https://engineeringtoolbox.com/ASTM-F876-PEX-tube-d_2139.html>
- **Thin-wall PP pipe** 3.2 is mm: Omega TYPP 1–2" OD tubes have a 1/8" (3.18 mm) wall; 1/4–3/4" OD have 1/16" (1.59 mm). <https://assets.dwyeromega.com/spec/TYPP.pdf>
- **"Silicone Sealant" row** describes Zotefoams **Plastazote LD45** cosplay/"LED foam" sheets (2–8 mm, 40×80"): crosslinked LDPE foam → **XLPE**. Probably a duplicate of the LD45 row. <https://www.zotefoams.com/product/azote/plastazote/>, <https://www.zotefoams.com/who-we-are/3-stage-process/>
- **LD45 Plastazote** "Closed Cell LDPE foam" → **XLPE** (crosslinked); name typo "Plaztazote".
- **Lexan DLCW** (not "DCLW"): "Diffused Light Cool White", translucent PC sheet, 60–85 % transmission; UL94 **HB** (row says fire-retardant: true). LEXAN is SABIC's trademark; the sheet business is now **Polyvantis** (2024). <https://www.led-professional.com/products/led-optics/sabic-to-introduce-pioneering-lexantm-dlcw-light-diffusing-technology>, <https://www.polymershapes.com/wp-content/uploads/2021/06/Polymershapes_DataSheet_DLCW-Data-Sheet-2021-002.pdf>, <https://www.businesswire.com/news/home/20240901257346/en/>
- **Makrolon DQ** (Covestro, "Diffusion Quality"): PC injection-moulding resins DQ5122/5142/5162, not sheet. <https://solutions.covestro.com/en/products/makrolon/makrolon-dq5162_000000000086298880>
- **HARMON(i)A®** (MAIP Group, Italy): diffusing compounds (reflective micro-spheres), bases mainly PMMA and PC; grade 3050 is "HARMON(i)A PMMA 3050". <https://plastics.ulprospector.com/datasheet/e384449/harmonia-pmma-3050>
- **PLEXIGLAS LED** (formerly EndLighten T): PMMA with diffusing particles; Röhm trademark, sold by **Polyvantis** (plexiglas-shop.com → polyvantis-shop.com). <https://www.polyvantis-shop.com/ie/products/plexiglas-led/>
- **PERSPEX Diffuse**: PMMA diffuser sheet (no POM product exists). **PERSPEX S-Lux & G-Lux**: cast acrylic edge-lit panels. Maker **Perspex International** (3A Composites / Schweiter). <https://www.perspex.co.uk/materials/perspex-cast-acrylic/diffuse/>, <https://www.perspex.co.uk/materials/perspex-cast-acrylic/s-lux-and-g-lux/>
- **Lumieo 2**: A.L.P. Lighting Components (now ALP Lighting Components LLC), white PMMA, 80 % transmission, 0.030/0.080 in; likely **discontinued** (URL redirects, no listing). <https://web.archive.org/web/20210120184855/https://alpadvantage.com/products/lumieo-ii/>
- **LEE Filters** diffusion: polyester (PET) or polycarbonate film; Zircon 810–812 on 180 µm polyester. <https://usa.leefiltersdirect.com/apps/frequently-asked-questions>, <https://leefilters.com/lighting/zircon.html>
- **Rosco** diffusion: "Tough" PET or "Soft" PVC. <https://emea.rosco.com/sites/default/files/content/resource/2016-10/RoscoUKFilterFacts_nov09.pdf>. **Rosco OPTI-SCULPT**: clear flame-retardant PC, 10 mil, 24×20" and 24×40". <https://us.rosco.com/sites/default/files/content/resource/2019-04/OPTI-SCULPT_DataSheet_v12%20copy.pdf>
- **ORAFOL RowLux** Illusion film: PC (vinyl/cellulose-propionate versions per a distributor); TPU/PET unsupported. <https://www.orafol.com/en/americas/products/advanced-polymer-films>, <https://www.eplastics.com/films/ROW-PC-13-005>
- **BrightView Technologies**: microlens coating on PET, UV-PET or PC film; rigid sheets laminate to PMMA or PC → PET, PC, PMMA. <https://www.brightviewtechnologies.com/pdf/BrightView_Technologies-Film-Materials-Product-Note.pdf>
- **Luminit** Light Shaping Diffusers: PC, PET, acrylic substrates (also glass). <https://luminitco.com/light-shaping-diffusers/>
- **InstaMorph** (Happy Wire Dog): PCL (CAS 24980-41-4). <https://cdn.shopify.com/s/files/1/0615/5901/3537/files/20220814_InstaMorph_MSDS_updated.pdf>
- **Faux fur**: typically acrylic/modacrylic, sometimes polyester. <https://en.wikipedia.org/wiki/Fake_fur>
- **Shower curtain**: PEVA (EVA) or PVC typical; "PVC, EVA" fits (product page unreachable).
- **Split loom**: general-purpose loom is usually PE; PP and nylon versions exist. <https://www.remingtonindustries.com/content/Polyethylene%20Wire%20Loom%20Tubing%20Data%20Sheet.pdf>
- **Oyumaru**: polymer unconfirmed (TPE per blogs; a similar product's SDS says ethylene alpha-olefin copolymer). Keep "ethylene copolymer" unresolved.

## issues.txt hardware (read 2026-11-18)

### PixelController F-Test → pixel-decoders

Handheld "Pixel Tester/Data Analyzer" ("F-Test Pixel, DMX and SmartReceiver Tester"). Inputs: 1 xConnect pixel-data, 1 Smart Remote, 1 DMX (RJ45). Outputs: the same three. USB power jack, microSD (firmware/logging), navigation buttons. WS2811/WS281x only (limited RGBW); receiver modes Dumb, Falcon V3, Falcon V4/Genius, FPP V1/V2, HinksPix; monitor mode reads Advatek and some AlphaPix long-range data. Serial: DMX (512 ch), LOR, Renard. Up to 1400 test pixels. Power 5–13 V via the pixel port ("does NOT support 24V") or USB. US$90.00. Released 2023 (video 2023-03-19). Out of stock on US and AU stores 2026-11-18; firmware build 3 posted 2024-09-09. It generates test patterns and decodes/analyzes/passes through incoming data; no network input, so not a controller.
<https://pixelcontroller.com/store/diy-controllers/85-F-Test.html>, manual <https://docs.google.com/document/d/120dhIltqEcNxDoGgmjNeP6NHb6vISE70OXnZNWJYHhk>, <https://www.youtube.com/watch?v=05cvmRJRxQg>, <https://github.com/Pixelcontroller/f-test_issues>

Side finding: `database/pixel-decoders/description.md` describes network→pixel decoders, contradicting the category's contents (inline pixel-data gear).

### Elation FLEX PIXEL DRIVER 1

Name "FLEX PIXEL DRIVER 1" (SKU FLE768). Documents say Elation Professional; the current site brands "Elation Lighting". Drives Elation FLEX PIXEL WP tape (72 RGB px/10 ft, 5 V) and later P40WP (APA102 protocol). **Input: DMX512 only** (DMX in + thru on 3-pin terminals, 432 channels); no Ethernet/Art-Net/sACN. **Output: 1** 6-pin terminal (GND, NC, Data, CLK, NC, +5V) = one clocked data+clock output. 144 px max ("/ 2 tapes", 72 each). 5 VDC, 5 A max. IP20, 90×40×20 mm, 2-button LED display. B&H sold it at $74.99 (Nov 2014, Jun 2015); no MSRP confirmed. Discontinued.
<https://web.archive.org/web/20260611031333/https://www.elationlighting.com/products/flex-pixel-driver-1>, spec sheet <https://www.elationlighting.eu/mwdownloads/download/link/id/7855>, wiring <https://elationlighting.eu/mwdownloads/download/link/id/4178>, P40WP <https://www.elationlighting.eu/mwdownloads/download/link/id/4644>, B&H <https://web.archive.org/web/20141108233524/http://www.bhphotovideo.com/c/product/1036496-REG/elation_professional_flex_pixel_driver1.html>

### ILIGHTTHAT Baldrick

"Inputs: 3" = the **3 external trigger inputs** (contact closures: buttons, beam breaks, motion sensors), not network inputs.

- **Baldrick8**: Ethernet 1 × 100 Mb (v1.0/1.1), 2 with switch on v2; 3 onboard buttons (network reset, set IP, factory reset); 3 trigger inputs (pre-Turniput); 2 power inputs (4 ports each), 5–48 V (5–24 V on v1.0); 8 × 750 px @ 40 fps. <https://www.baldrickboard.com/en/boards/baldrick8>, <https://www.baldrickboard.com/en/boards/baldrick8/manual>
- **Baldrick17**: Ethernet 2 × 100 Mb (daisy-chain); 3 Turniput trigger inputs with lamp control; test buttons present (count not stated); 5 power inputs; 5–48 V; RTC battery. <https://www.baldrickboard.com/en/boards/baldrick17/manual>, <https://www.baldrickboard.com/en/breakthroughs/turniput>
- **BaldrickDMX**: network-only input (DDP, Art-Net, E1.31) on 1 Ethernet port; does not take pixel data. Output: 1 DMX universe on RJ45 + 3-pin XLR + 5-pin XLR (same universe). 1 button (factory reset). 5–24 V (5–48 V on v1.1), barrel or 2-pin Phoenix. Old /docs/category/baldrickdmx URL redirects to <https://www.baldrickboard.com/en/boards/baldrickdmx>. BaldrickDMX Pro is a separate product. <https://www.baldrickboard.com/en/boards/baldrickdmx/faq>

### Microcyb (store espartstick.ecwid.com, now offline)

- **M4-PI / M8-PI** Raspberry Pi pixel HATs: 4 / 8 outputs, "up to 1600 pixel per port at 20 FPS"; single-wire only (FPP DPIPixels, xLights protocol ws2811); 12 V supply with onboard buck for the Pi; OLED + joystick; FPP 6+ with a separate license key; released ~mid-2022; likely discontinued (store offline by Nov 2025). Prices M4/M8: Nov 2022 $34.99/$44.99; Nov 2023 $35.99/$56.99; May 2024 $47.99/$61.99; Nov 2024 $52.99/$66.99; May 2025 $59.99/$76.99. The sheet's "Max Channels" 37/75 = universes (6,400 and 12,800 px × 3 ÷ 512). <https://web.archive.org/web/20231130050450/https://espartstick.ecwid.com/M4-PI-Raspberry-Pi-4-Port-Pixel-controller-p468426786>, <https://web.archive.org/web/20231130050208/https://espartstick.ecwid.com/M8-PI-Raspberry-Pi-8-Port-Pixel-controller-p471859299>, <https://github.com/xLightsSequencer/xLights/blob/master/resources/controllers/microcyb.xcontroller>
- **"Pi Hat" ($22)** = most likely "Raspberry Pi Pixel HAT Controller Dual Output 5v - 12v" (SKU 0302): 2 outputs with data level amp, 512+ px/output (1,024 @ 40 fps), 5 or 12 V pixels, powers the Pi, FPP RPIWS281X (single-wire); $21.99 Aug 2021. "3200" unexplained; connector unverified. <https://web.archive.org/web/20210803012831/https://espartstick.ecwid.com/Raspberry-Pi-Pixel-HAT-Controller-Duel-Output-5v-12v-p228404281>
- **Standard Differential Receiver**: existed in the store sitemap (2022); no page capture; specs unconfirmed; probably a receiver for the M16-PI's differential outputs.

### Kulp

"F40D-B" never existed; the product is the **F40D-PB** (PocketBeagle), renamed **K40D-PB**. <https://web.archive.org/web/20190720101414/https://kulplights.com/product/f40d-pb/>

## IC and LED packages vs datasheets (read 2026-11-18)

Pixel driver ICs:

- **LPD6803**: SOP16 / QFN16 (also COB, die). <https://cdn-shop.adafruit.com/datasheets/LPD6803.pdf>
- **LPD8806**: 16 pins, package unnamed in the datasheet; Advatek/Enttec say SOP16; no source for QFN16 (likely copied from LPD6803). <https://cdn-shop.adafruit.com/datasheets/lpd8806+english.pdf>, <https://advatek.netlify.app/pixel-protocols/lpd8806>
- **MY9231**: SSOP16 (SS), TSSOP16 with exposed pad (TE), SOP16 (SC), QFN16 3×3 (QB). <http://www.my-semi.com.tw/file/MY9231_BF_0.91.pdf>
- **P9813**: SOP14 / DIP14 (also COB, die); maker on the datasheet: DMS Microelectronics. <https://files.seeedstudio.com/wiki/Grove-Chainable_RGB_LED/res/P9813_datasheet.pdf>
- **QED3001**: SOP8 / SOP10 / SOP14 (only SOP14 has the backup line); maker per Advatek: QED Microelectronics (China); low confidence. <https://advatek.netlify.app/pixel-protocols/qed3001>
- **TLS3001**: SOP8 (5 V only) / **SSOP10** / SOP14; maker **Teralane Semiconductor (Shenzhen)**, not Tianli; V2.2 datasheet says 8-bit PWM (Advatek says 12-bit). <https://datasheet4u.com/datasheet-pdf/TERALANESEMICONDUCTOR/TLS3001/pdf.php?id=905218>
- **SM16511**: SOP10 / SOP16 (third-party pages only); Advatek lists it as a DMX512-protocol chip. <https://enttec.com.cn/pixel-protocols/SM16511>
- **WS2801**: SOP-14 (current WS2801S datasheet); DIP-14 only in the 2009 preliminary datasheet. <https://www.lcsc.com/datasheet/C114580.pdf>, <https://cdn-shop.adafruit.com/datasheets/WS2801.pdf>
- **WS2811**: current V2.2 (Aug 2024) lists **SOP8 / MSOP8 / FSOP8** (FSOP8 added Nov 2022); 2017 V1.1 listed SOP8 and MSOP8; DIP8 only before 2017. Not "SOIC8". <https://www.lcsc.com/datasheet/C114581.pdf>
- **WS2818B**: currently **SOP8 / FSOP8**; V1.5 (Oct 2022) removed CPC8 (a WorldSemi ~2.6×2.6 mm 8-lead package) and added FSOP8. <https://atta.szlcsc.com/upload/public/pdf/source/20241202/4A771CD25CA8D056BF075AD1E8527C36.pdf>
- **WS2814**: SOP12 (plain dual-input WS2814, V1.4); variants WS2814A SOP8/FSOP8, WS2814C SOP8, WS2814F FSOP8. Our price is for WS2814F (FSOP-8). <https://www.superlightingled.com/PDF/SPEC/WS2814-RGBW-Datasheet.pdf>
- **TM1914**: **MSOP10 / SSOP10 / ESOP8** (Titan Micro V1.2); TM1914A is SOP8 (our price is for TM1914A). <https://www.lcsc.com/datasheet/C5174535.pdf>
- **TM1809**: SOP14 / **DIP14** (V1.6). <https://www.lcsc.com/datasheet/C20622180.pdf>
- **UCS9812**: SOP16 / SSOP16 / QFN16 (4×4); third-party-hosted VER1.0 datasheet; Advatek credits "Lianxinke". <https://www.ledyilighting.com/wp-content/uploads/2025/02/UCS9812-datasheet.pdf>
- **GS8206**: SOP8 (datasheet credits Genesis Systech). <https://www.ledyilighting.com/wp-content/uploads/2025/02/GS8206-datasheet.pdf>. **GS8208**: SOP8. <https://www.slideshare.net/slideshow/gs8208-led-datasheet/96675022>. GS8202: nothing found. The GS82xx datasheets credit "Genesis"; our entries say "Shenzhen Greesit Technology".
- **MY9221**: SOP24 / SSOP24 / TSSOP24-EP / QFN20. <https://files.seeedstudio.com/wiki/Grove-LED_Bar/res/MY9221_DS_1.0.pdf>
- **MY9291**: SSOP20 / TSSOP20-EP / QFN20. <http://www.my-semi.com.tw/file/MY9291_BF_0.91.pdf>
- **MBI6020**: SSOP16 (MBI6020GP); QFN16 per an aggregator only. <https://www.datasheetcafe.com/mbi6020-pdf-27424/>
- **SK6818**: built into a 5050 LED; no standalone package. <https://advatek.netlify.app/pixel-protocols/sk6818>
- **SM16703P**: SOP8. <https://www.lcsc.com/datasheet/C155753.pdf>. TC2811: nothing found.

Level converters / buffers (TI datasheets):

- **SN74HCT244**: 20 pins: N (PDIP), DW (SOIC), DB (SSOP), NS (SOP), PW (TSSOP), DGS (VSSOP); PDIP is the largest (24.33 × 9.4 mm). <https://www.ti.com/lit/ds/symlink/sn74hct244.pdf>
- **SN74AHCT125N**: PDIP-14. <https://www.ti.com/lit/ds/symlink/sn74ahct125.pdf>
- **SN74LV1T34DBVRG4**: DBV = SOT-23-5 (R = reel, G4 = old green suffix). <https://www.ti.com/lit/ds/symlink/sn74lv1t34.pdf>
- **SN74HC245N**: PDIP-20. **SN74LVC2T45DCT**: 8 pins ("SM8" in the datasheet, "SSOP (DCT)" on TI's page). **TXS0108EPW**: TSSOP-20. **TXU0104PW**: TSSOP-14. <https://www.ti.com/lit/ds/symlink/sn74hc245.pdf>, <https://www.ti.com/lit/ds/symlink/sn74lvc2t45.pdf>, <https://www.ti.com/lit/ds/symlink/txs0108e.pdf>, <https://www.ti.com/lit/ds/symlink/txu0104.pdf>
- **TC4427**: 8-lead PDIP, SOIC, MSOP, DFN 6×5. <https://static.chipdip.ru/lib/264/DOC005264183.pdf>

Pixels:

- **PL9823**: F5 (5 mm round), F8 (8 mm round), and a 5050 SMD version; 4 pins; datasheet carries a "BaiCheng" logo (our creator is "/"). <https://www.led-genial.de/mediafiles//Sonstiges/PL9823.pdf>
- **SK6805**: 2427 (2.4×2.7 mm), EC15 = 1515, EC20 = 2020 (LCSC C2890036, missing from our list). <https://cdn.hackaday.io/files/272011163767584/sk6805-2427%20smd%20led%20specificaiton.pdf>, <https://www.lcsc.com/product-detail/C2890036.html>
