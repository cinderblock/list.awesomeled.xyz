# Controller inputs audit (database review)

Why: the sheet's Controllers "Interface" column was sorted on its own, so
imported `inputs` often belong to another controller (ISSUES.md). Each
controller's inputs were re-checked against the maker's pages/manuals
(2026-11-18). Keys follow the controlled vocabulary in
`plans/database-review.md`. "(host)" = the interface is the host board's
(BeagleBone, Pi), not the cape's. Applying these: one data commit per batch.

## Batch 2 (falcon-f16v4 .. m4-port-pixel)

- `falcon-f16v4` — Ethernet 2; Wi-Fi 2.4GHz (ESP-07, config/upload only); buttons 6; triggers 4 — sACN, Art-Net, DDP, ZCPP (+ FPP MultiSync remote) — standalone (FSEQ from microSD, schedules) — microSD. <https://pixelcontroller.com/store/products/70-f16v4.html>, spec sheet <https://docs.google.com/spreadsheets/d/1LTQzdvSYMrRGI62KTGdh5EmUhVB9uZZMQ4iwWtK7yYk>
- `falcon-f16v5` — Ethernet 2; Wi-Fi 2.4GHz (config only); buttons 6; triggers 2 — sACN, Art-Net, DDP, ZCPP — standalone — microSD. <https://pixelcontroller.com/store/featured/88-f16v5.html>
- `falcon-f48` — Ethernet 2; Wi-Fi 2.4GHz (limited config); buttons 6 — sACN, Art-Net, DDP (fw 2.58+), ZCPP — standalone (fw 2.50+) — microSD. **Discontinued** (PixelController's Discontinued category; superseded by F48V4/V5). <https://pixelcontroller.com/store/discontinued-products/52-f16v2-beta-board.html>, manual <https://docs.google.com/document/d/1sAzoFztiKdI3BPDl_Kegu28DKKlIM4PlSNaCNvvDtgk/>
- `falcon-f4v3` — Ethernet 2; Wi-Fi (config only); buttons 6 — sACN, Art-Net, DDP, ZCPP — standalone — microSD. Likely **discontinued** (gone from store; wiki lists it). <https://pixelcontroller.com/store/content/11-f4v3-pixel-controller>, <https://auschristmaslighting.com/wiki/F4v3>
- `flex-pixel-driver` — DMX512 3-pin terminal in + out; buttons 2 — DMX512 — not standalone. <https://www.elationlighting.com/cdn/shop/files/FLEX_PIXEL_DRIVER_1_-_Specification_Sheet.pdf>
- `fp48f` — unknown (go3d.fr now unrelated; no capture). Probably FPP on BeagleBone (Ethernet via host; sACN/Art-Net/DDP) — inference only.
- `genius-long-range-pixel-controller` — Ethernet 1; Wi-Fi (config hotspot; client in fw 2.0); Bluetooth (fw 2.0); buttons 2; **no PoE** — DDP, sACN, Art-Net (+ FPP sync) — standalone (SD FSEQ, fw 1.3.1+) — microSD. <https://experiencelights.com/long-range-genius-pixel-controller/>, manual <https://drive.google.com/file/d/1TxbGltzQDkVF4Rtoo1eURyIWos7Nxecd/view>
- `genius-pro-32-port` — Ethernet 1; Wi-Fi; Bluetooth; buttons 2 (USB is firmware-update only) — DDP, sACN, Art-Net — **standalone: true** — microSD. <https://experiencelights.com/genius-pro-32-port-controller/>
- `hinkspix-pro-v3` — Ethernet 2; Wi-Fi (firmware/sync only); buttons 5 — sACN, Art-Net, DDP — **standalone: true** — SD (32 GB). <https://www.holidaycoro.com/HinksPixVSEvolution>
- `k128d-b` — Ethernet 1 (host); buttons 7; GPIO 8 — sACN, Art-Net, DDP — standalone — host microSD/eMMC. <https://kulplights.com/manuals/boards/k128d-b/>
- `k16000s` — unknown (maker site down; the Amazon link now sells a CANRIA DMX decoder).
- `k16a-b` — Ethernet 1 (host); buttons 6; GPIO 9 — sACN, Art-Net, DDP — standalone — host microSD. Retired. <https://kulplights.com/manuals/boards/k16a-b/>
- `k2-pi0` — Wi-Fi 2.4GHz (host Pi Zero 2 W); GPIO 5 — sACN, Art-Net, DDP — standalone — Pi microSD. Fits Pi 3B+/4/5 too (Ethernet). <https://kulplights.com/manuals/boards/k2-pi0/>
- `k32a-b` — Ethernet 1 (host); buttons 6; GPIO 9; **no PoE** — sACN, Art-Net, DDP — standalone — host microSD. Retired. <https://kulplights.com/manuals/boards/k32a-b/>
- `k4-pb` — USB "USB-A host" (network only via USB adapter); buttons 2; GPIO 6 — sACN, Art-Net, DDP — standalone — PocketBeagle microSD. <https://kulplights.com/manuals/boards/k4-pb/>
- `k40d-pb` — USB "USB-A host"; buttons 4; GPIO 4 — sACN, Art-Net, DDP — standalone — PocketBeagle microSD. <https://kulplights.com/manuals/boards/k40d-pb/>
- `k64d-b` — Ethernet 1 (host); buttons 7; GPIO 8 — sACN, Art-Net, DDP — standalone — host microSD. <https://kulplights.com/manuals/boards/k64d-b/>
- `k8-b` — Ethernet 1 (host); buttons 6; GPIO 4 — sACN, Art-Net, DDP — standalone — host microSD. <https://kulplights.com/manuals/boards/k8-b/>
- `k8-pb` — USB "USB-A host"; buttons 4 — sACN, Art-Net, DDP — standalone — PocketBeagle 2 microSD. <https://kulplights.com/manuals/boards/k8-pb/>
- `led-ethernet-controller-3` — Ethernet 2; DMX512 "XLR-3 in + thru (XLR-5 optional)"; buttons; **no USB** — Art-Net, DMX512 (+ LSS protocol) — standalone — microSD (32 GB). <https://www.ledstripstudio.com/shop/product/led-ethernet-controller-3/>, <https://www.ledstripstudio.com/shop/wp-content/uploads/2026/09/LEC3HardwareManual-fix.pdf>
- `led-ethernet-controller-powered` — same as LEC 3 (LEC 3 with built-in 320 W PSU); **no Wi-Fi** — Art-Net, DMX512 — standalone — microSD. URL now redirects to LEC 3; status doubtful.
- `led-player-dmx` — DMX512 "XLR-3 in + thru"; buttons 2 (USB = power/firmware) — DMX512 — standalone (TPM2 from microSD) — microSD. **Active** (EUR 99.90, diamex-shop.de). <https://www.diamex-shop.de/LED-Player-DMX-TPM2-Dateien-von-DMX-gesteuert-abspielen>
- `led-player-l` — USB mini-USB (live TPM2 + config); buttons 4 — TPM2 over USB — standalone — microSD + USB stick (move out of inputs). <https://www.diamex-shop.de/LED-Player-L-fuer-Strips-und-Panels-bis-4096-LEDs>
- `led-player-m` — USB mini-USB; buttons 2; triggers 4 — TPM2/Glediator over USB — standalone — microSD. Likely discontinued. <https://www.diamex-shop.de/mediafiles/LG/LED-Player-M_Anleitung.pdf>
- `led-player-s` — USB (TPM2 virtual serial); buttons 2 — standalone — microSD. Discontinued. <https://www.diamex-shop.de/mediafiles/LG/led-player_s2.pdf>
- `ledmx2-max` — Ethernet 1; USB-C (DMX data); DMX512 3-pin terminal (in or out) — Art-Net, sACN, DMX512, USB DMX — standalone — internal microSD. <https://dmxking.tv/max-series/ledmx2-max>
- `ledmx4-max` — Ethernet 1; USB-C; DMX512 3-pin terminal; triggers 8; buttons 2; **no Wi-Fi** — Art-Net, sACN, DMX512, USB DMX — standalone — internal microSD. <https://dmxking.tv/max-series/ledmx4-max>
- `ledmx4-pro` — Ethernet 1; DMX512 3-pin terminal; triggers 4 (RJ12 accessory port) — Art-Net, sACN, DMX512 — standalone — microSD. <https://dmxking.tv/discontinued/ledmx4-pro>
- `lightboard-mini` — Bluetooth BLE (+ NFC); GPIO 4; **no Ethernet** — proprietary (LightDesigner/LightMobile) — standalone (scheduled programs). <https://web.archive.org/web/20191119161838/https://rocketlife.com/technology/>
- `lightbox` — Bluetooth BLE (+ NFC); GPIO 4; **no Ethernet** (micro-USB charges only) — proprietary — standalone. Same source.
- `lightkraken` — Ethernet 1; PoE "PoE++" — Art-Net, sACN — **standalone: false**. Likely discontinued (sold out since Mar 2022). <https://www.tindie.com/products/tinicuro/lightkraken/>, <https://github.com/tinic/lightkraken>
- `luminaxa` — Wi-Fi 2.4GHz; **no Ethernet** (Audio Reactive variant: Microphone; an ESP32 variant: IR) — no network protocols on the regular unit (sACN on Pro/Audio Reactive) — standalone. Name typo: "Luminxa". <https://luminxa.com/product/luminxa-controller-only/>
- `m4-pi` / `m4-port-pixel` (merged) — Ethernet 1 (host), Wi-Fi (host), buttons (joystick) — sACN, Art-Net, DDP — standalone — Pi microSD. Supports Pi 3B and up plus Zero/Zero 2.

Other findings to route: led-genial.de product pages 404 (moved to diamex-shop.de); go3d.fr now unrelated; dmxking.com product URLs land on a generic page (docs on dmxking.tv); `ledmx4-pro` maker spelled "DMXKing" vs "DMXking" elsewhere.

## Batch 4 (pixpoe .. www-orangepi-dmx-org)

- `pixpoe` — Ethernet 1; PoE "PoE+"; buttons 1 (reset); no Wi-Fi — protocols unpublished — not standalone. EMP calls it "PoE+ Pixel Controller" (not Glen Akins' unrelated PixPoE). <https://www.empdesigns.co.uk/our-products/poe-%2B-pixel>
- `protopixel-1-channel-ethernet` — Ethernet 1 — ProtoPixel's own protocol only — standalone (microSD recordings) — microSD. Likely discontinued (lineup is now Gate series). <https://web.archive.org/web/20210622162832/https://protopixel.net/doc/1ch_controller/pages/technical_features.html>
- `protopixel-1-channel-wifi` — Wi-Fi 2.4GHz — Art-Net (fw 0.5.4+) — standalone — microSD. <https://web.archive.org/web/20210413065904/https://protopixel.net/doc/1ch_wifi/pages/10-technical_features.html>
- `protopixel-8-channel-controller` — Ethernet 1; buttons 1 — proprietary (ProtoPixel Create) — not standalone. USB is power only. <https://web.archive.org/web/20200929142224/https://protopixel.fra1.digitaloceanspaces.com/production-website/documents/products/spec-sheets/LED_controller_spec_sheet.pdf>
- `qolorpix` — DMX512 "XLR-5 in + thru"; Wireless DMX "Multiverse" (built-in, RP-SMA antenna); buttons — DMX512 (+ RDM; no sACN/Art-Net) — standalone (4 presets, effects) — microSD is firmware only. **Active** (page live 2026). <https://www.citytheatrical.com/products/electronics/qolorflex-led-tape-and-accessories/qolorpix-tape-controller-eight-output>, manual <https://www.citytheatrical.com/docs/default-source/manuals/5850-qolorpix-tape-controller.pdf>
- `quinled-dig-octa` — Ethernet 1; Wi-Fi 2.4GHz; USB "USB-C"; buttons 2; triggers 2; Microphone (v4); GPIO 4 — sACN, Art-Net, DDP, TPM2.net (WLED) — standalone — microSD + 16MB flash. No onboard PoE. <https://quinled.info/quinled-dig-octa-brainboard-32-8l-specifications/>
- `quinled-dig-quad` — Wi-Fi 2.4GHz; Ethernet (optional ABE variant); USB "USB-C"; buttons 2; Microphone; GPIO 6 — sACN, Art-Net, DDP, TPM2.net — standalone — 8MB flash. v4 is ESP32 only (notes say ESP8266/ESP32). <https://quinled.info/quinled-dig-quad-pre-assembled-v4-specifications/>
- `quinled-dig-uno` — Wi-Fi 2.4GHz; Ethernet (optional ABE); USB "USB-C"; buttons 2; Microphone; GPIO 6 — sACN, Art-Net, DDP, TPM2.net (**no DMX512**) — standalone — 8MB flash. <https://quinled.info/quinled-dig-uno-pre-assembled-v4-specifications/>
- `quinled-dig2go` — Wi-Fi 2.4GHz; USB "USB-C"; buttons 1; IR; Microphone; GPIO 4 — sACN, Art-Net, DDP, TPM2.net (**no DMX**) — standalone — 4MB flash. <https://quinled.info/quinled-dig2go-full-specifications/>
- `rc4magic-s3-pixel-driver` — DMX512 "3.5mm miniplug in/out"; Wireless DMX "RC4Magic"; buttons 3; **no TTL serial** — DMX512 (+ RDM) — **not standalone** (reshapes live console data) — no storage. Maker now RC4 Wireless; 2.4GHz line End-of-Life. <https://rc4wireless.com/shop/rc4magic-s3/dmxpix/>
- `reactivo-2` — Ethernet 1; Wi-Fi 2.4GHz; triggers 2; buttons 1 (USB power only) — Art-Net — standalone — microSD (16GB). <https://reactivo.lighting/reactivo-controller/>
- `replay` — no live-control input (**remove Ethernet**) — plays Jinx .OUT / xLights FSEQ — standalone — microSD. SmartShow "SD-Card Pixel Player". <https://web.archive.org/web/20240221121510/https://smartshow.lighting/wp-content/uploads/2023/10/REPLAY.pdf>
- `scenex-pp4` — Ethernet 1; buttons 1; **no Wi-Fi** — sACN, Art-Net — not standalone. Likely discontinued (page 404). Brand: Scenex Lighting (GLP US). <https://www.germanlightproducts.com/wp-content/uploads/2016/01/PP4-Controller-Operating-Manual_08_2015.pdf>
- `smartshow-pro-one` — Ethernet 2 (isolated switch); USB (firmware); buttons 1 (joystick); **no Wi-Fi** — Art-Net, sACN — not standalone. <https://smartshow.lighting/product/smartshow-pro-one/>
- `sp102e` — IR (24-key remote) — standalone — no storage. "LED IR Controller", 5–12 V; likely discontinued. <https://web.archive.org/web/20171226092940/http://www.sperll.com:80/a/Product/SP102E/2017/0731/81.html>
- `sp105e` — ok (Bluetooth 4.0; standalone). <https://sperll.com/product/82>
- `sp107e` — ok; Audio "line-in" (AUX), Microphone, Bluetooth. <https://sperll.com/product/84>
- `sp108e` — Wi-Fi (band not stated; "2.4GHz" unverified); buttons 1 — standalone. <https://sperll.com/product/78>
- `sp608e` — Bluetooth; RF remote (16-key; "15 m range" unsourced); Microphone; Audio "line-in"; triggers 4 — standalone. <https://sperll.com/product/104>
- `sp801e` — Wi-Fi 2.4GHz; Bluetooth (BluFi setup only); buttons 1 — Art-Net — standalone (flash) — flash. <https://sperll.com/product/62>
- `spi-led-controller` — DMX512 "RJ45 in + out"; buttons 2; **no Ethernet / Wi-Fi** — DMX512 (no Art-Net) — standalone — microSD. <https://www.ledstripstudio.com/products/spi_led_controller/>
- `spi-matrix` — Ethernet 2; DMX512 "XLR-3 in + out (XLR-5 optional)"; **no Wi-Fi** — Art-Net, sACN, DMX512 — standalone — microSD. <https://www.ledstripstudio.com/products/spi_matrix/>
- `spinode` — Ethernet 1; PoE "802.3af Class 1"; buttons 1 — Art-Net, sACN — not standalone. **Active.** <https://www.visualproductions.nl/products/spinode/>
- `t1000s` — buttons 4; Serial "A/B cascade sync in"; **no USB** — standalone (16 LedEdit programs) — SD (128MB–2GB). Reseller source only. <https://derunledlights.com/t1000s-led-controller-with-sd-card>
- `thunderpack-wearable` — ok (USB native; GPIO 12; buttons 1). <https://github.com/jgillick/ThunderPack>
- `twinpixx16` — Ethernet 1; USB power only; **no trigger input** — Art-Net — not standalone. Likely discontinued. <http://www.dmx4all.de/download/manuals_english/artnet_twinpixx_16_english.pdf>
- `uli-led-control` — Ethernet 1; USB (firmware only) — Art-Net, sACN — not standalone. **Active** (EUR 79.98); supply now 7–24 V. <https://www.radig.online/4096-Kanal-LED-Strip-Controller/SW10008>
- `uls-stripe` — DMX512 "XLR-5 + XLR-3 in and out"; buttons (rotary encoder); **no Ethernet/USB/Wi-Fi** — DMX512 — not standalone. <https://ultralightsound.co.uk/product/uls-stripe-addressable-led-pixel-controller>
- `wb1616` — Ethernet 1 (host BBB); USB (host); buttons 6; GPIO — sACN, Art-Net, DDP (FPP) — standalone — microSD. In stock Aug 2025 ($174.99): "discontinued" unconfirmed. <https://web.archive.org/web/20250805175734/https://wallyslights.com/products/wallys-lights-wb1616-controller>
- `wb48` — Ethernet 1 (host BBB); USB (host); buttons 1 — sACN, Art-Net, DDP — standalone — microSD. In stock Oct 2025 ($159). <https://web.archive.org/web/20251006173741/https://wallyslights.com/products/wallys-lights-wb48-controller>
- `www-orangepi-dmx-org` — Ethernet 1 (Orange Pi); DMX512 (add-on board); Wi-Fi (ESP8266 add-on only) — Art-Net, sACN, DDP, DMX512 (+ OSC) — pixel firmware not standalone (separate showfile-player firmware) — microSD. Open-source firmware, not one product. <https://www.orangepi-dmx.org/>

## Batch 1 (8-port-led-distro .. fadecandy)

Standalone rule: built-in test patterns don't count; stored effects, scenes, presets or recordings do.

- `8-port-led-distro` — Ethernet (WT32-ETH01); Wi-Fi 2.4GHz; USB "USB-C" (programming); GPIO 4 — sACN, DDP, Art-Net (WLED) — standalone. <https://www.tindie.com/products/bong69/8-port-led-distro>
- `a1-slwf-03` — Wi-Fi 2.4GHz; USB "USB-C"; buttons 1; IR; Microphone; **no Bluetooth** (only as an ESPHome BT proxy) — Art-Net, sACN, DDP — standalone. Brand: SMLIGHT. <https://smlight.tech/product/slwf-03>
- `alphapix-classic-16-v3` — Ethernet; buttons 5; **no Wi-Fi** — sACN, Art-Net — not standalone. <https://www.holidaycoro.com/AlphaPix-16-Pixel-Controller-V3-p/721-v3.htm>
- `alphapix-flex-with-expansion` — Ethernet 2 (switch); buttons 5 — sACN only (Evolution CPU: Art-Net No, DDP No) — not standalone. <https://www.holidaycoro.com/HinksPixVSEvolution>
- `an6usp10` — ok (Ethernet; Art-Net, sACN). Model is "AN6USPI0"; Electron-Design; still sold ($85). <https://www.electrondigit.com/products/art-net-controllers/product/dmx-512-art-net-sacn-6-universe-to-ws2811-ws2812-ws2813-ws2801-sk6812-sm16703>
- `angio-4`, `angio-8` — Ethernet (100 Mbps); Wi-Fi (band unstated); Bluetooth "5 LE" (hardware only, support promised) — **Art-Net only** (sACN/OPC promised for future releases) — not standalone. <https://shop.chroma.tech/products/angio-4>
- `apd-2-500-12v-art` — Ethernet; Microphone; buttons; **no Wi-Fi** — Art-Net — standalone ("Internal programs"). <https://digitaltape.co.uk/apd-2-500-12v-art>
- `baldrick-17` — ok. `baldrick-8` — Ethernet (2 on v2); buttons 3; triggers 3 — DDP, Art-Net, sACN — **standalone: true** (CunningFX). <https://www.baldrickboard.com/en/boards/baldrick8/manual>
- `baldrick-dmx` — Ethernet — DDP, Art-Net, sACN — standalone (static DMX presets at boot or via the Turnip network). <https://www.baldrickboard.com/en/boards/baldrickdmx/manual>
- `blink-tape-controller` — USB "micro-USB" (live data and uploads); buttons 1; **no Bluetooth** — standalone (stored patterns) — flash. <https://shop.blinkinlabs.com/products/blinkytape-control-board>
- `brightly` — Ethernet; Wi-Fi; Bluetooth "BLE"; USB "USB-C"; buttons 1 — Art-Net, sACN, OPC, MadLED — standalone — SD. Domain gone; may never have shipped. <https://web.archive.org/web/20250416032520/https://glowbrightly.io/>
- `deskontrol-lite-16` — Ethernet — Art-Net only — not standalone. <https://web.archive.org/web/20190719190409/https://www.deskontrol.net/en/art-net-led-controller/362-art-net-led-controller-deskontroller-lite-16-universes.html>
- `deskontroller-lite-v3-192`, `-32` — Ethernet; **no Wi-Fi** — Art-Net — not standalone. `-96` ok. <https://deskontroller.com/download/deskontroller-lite-V3-user-manual.pdf>
- `digidot-c4-extended-8` — Ethernet 2; Wi-Fi 2.4GHz; DMX512 "6-pin I/O terminal (up to 2 inputs)"; buttons 1; triggers 3 — Art-Net, sACN, DMX512 — standalone — microSD. <https://www.digidot.eu/shop/digidot-c4-extended-127>
- `digidot-c4-live-12` — Ethernet 2; Wi-Fi 2.4GHz; DMX512 (same terminal); buttons 1; **no USB** — Art-Net, sACN, DMX512 — not standalone. <https://www.digidot.eu/shop/digidot-c4-live-125>
- `digiled-strip-dmx-wav-sd-micro-player` — triggers 6; **no Ethernet** — plays SD files — standalone — microSD (up to 4 GB). <https://www.boutique-electroconcept.com/media/Productattachments//m/i/micro_player_sd.pdf>
- `din-pixie` — USB "USB-B" (config and live input); DMX512 "RJ45 x2"; **no Ethernet** — DMX512 — standalone — flash. <https://cdn.enttec.com.cn/pdf/assets/73539/73539_DIN_PIXIE_DATASHEET.pdf>
- `dmx-core` — Ethernet (1 GbE); PoE; USB "USB-A"; buttons; DMX512 (optional 2-port board); triggers 4 (optional ADIO); **no Wi-Fi** — Art-Net, sACN, KiNET, DMX512 — standalone — eMMC + microSD. Now "DMX Core 100" (800 universes); no pixel outputs. <https://docs.dmxcore.com/dmx-core-100/main/specifications/>
- `dmx-to-led-strip` — DMX512 "3-pin input (solder; optional XLR or wireless-DMX card)"; USB "USB-C"; **no Bluetooth/Audio** — DMX512 — not standalone. <https://www.boutique-electroconcept.com/media/Productattachments//d/m/dmx_to_ws2812_v2.pdf>
- `dmx-to-spi` — DMX512 "3-pin screw terminal"; **no Bluetooth** — DMX512 — not standalone. Model "miniDMX V3.0", still sold. <https://www.electrondigit.com/products/dmx-controllers/product/dmx-to-spi-sk6812-ws2812-b-ws2813-ws2801-sm16703-pixels-combination-controller>
- `e6804` — Ethernet — sACN, Art-Net (fw v4+) — not standalone. <https://sandevices.com/product/e6804-pixel-controller-assembled-tested/>
- `e682` — ok. <http://sandevices.com/wp-content/uploads/2017/11/E682_Operating_Manual.pdf>
- `electromage-8x-driver`, `electromage-pro-8x-driver` — Serial "TTL UART" (Pixelblaze expander bus); **no Ethernet** — not standalone. <https://shop.electromage.com/products/pixelblaze-output-expander-serial-to-8x-ws2812-apa102-driver>
- `emp-16-uni-control` — Ethernet 2 (switch); **no Wi-Fi** — Art-Net — not standalone. <https://www.empdesigns.co.uk/our-products/16-universe-led-pixel>
- `epix-flex-drive` — Ethernet 2 (Etherkon in/thru); DMX512 "XLR in + thru"; buttons 4; **no USB/Wi-Fi** — Art-Net, sACN, DMX512 — standalone. Active. <https://chauvetprofessional.com/wp-content/uploads/2018/10/EPIX_Flex_Drive_UM_Rev4.pdf>
- `esp32-wled-controller-8chan` — Wi-Fi 2.4GHz; USB "micro-USB"; triggers 1; GPIO; **no Ethernet** — Art-Net, sACN, DDP — standalone. Sold out since Aug 2024. <https://www.tindie.com/products/giovannicas/esp32-wled-controller-8chan/>
- `eth032f-pixel-breakout` — unknown (go3d.fr is unrelated now).
- `fadecandy` — ok (USB; OPC via the host's fcserver). Adafruit: no longer stocked.

## Batch 3 (m8-port-pixel .. pixout-server)

Advatek: Mk2 boards have 1 RJ45, 2 PCB buttons, Art-Net + sACN, no stored shows; Mk3 boards have microSD SHOWTime (standalone), an RS-485 aux port for DMX512 in or out, and 2 buttons; A4-S and T8-S have dual gigabit, the E-series a single 10/100 port. No Advatek board has USB or Wi-Fi. Spec PDFs: `https://cdn.sanity.io/files/3y31615s/production/`.

- `m8-port-pixel` — Ethernet (host Pi); Wi-Fi (host); buttons (joystick) — Art-Net, sACN, DDP — standalone — Pi microSD.
- `madrix-nebula` — Ethernet 2 (switch); USB "USB-B" — Art-Net, sACN — not standalone. **No RF remote, Bluetooth, Audio or switch.** Active. <https://www.madrix.com/products/nebula>
- `magwled-1` — Wi-Fi 2.4GHz; USB "USB-C"; buttons 1 — Art-Net, sACN, DDP, TPM2.net — standalone. <https://magwled.com/pages/magwled-1>
- `mini-8-port-controller` — Ethernet; Wi-Fi 2.4GHz — Art-Net, sACN, DDP, TPM2.net — standalone. Renamed "Basic Eight Port LED Controller". <https://www.tindie.com/products/k7bbr/wasatch-pixels-basic-eight-port-led-controller/>
- `netpixel-mini`, `netpixel-one` — Ethernet; buttons 1 — Art-Net, sACN. `netpixel-quad` — Ethernet; USB "mini-USB" — Art-Net. None standalone. <https://smartshow.lighting/wp-content/uploads/2023/10/NetPixel-ONE.pdf>
- `nled-pixel-controller-electron` — USB "micro-USB"; Serial "TTL"; DMX512 (add-on RS-485 card); buttons 1 — DMX512 — standalone — flash. <https://nledshop.com/downloads/datasheets/nled-pixel-controller-electron.pdf>
- `nled-pixel-controller-mini` — DMX512 "screw terminal"; Serial "TTL"; **no Ethernet or Art-Net** — DMX512 — not standalone. <https://nledshop.com/downloads/datasheets/nled-pixel-controller-mini-v4a.pdf>
- `octo-mk2` — Ethernet 2; buttons 1; **no USB or Wi-Fi** — Art-Net, sACN, ESP, KiNET — standalone (built-in FX). <https://cdn.enttec.com/pdf/assets/71521/71521_OCTO_DATASHEET.pdf>
- `orange-pro-plus-32` — Ethernet; buttons 5 — Art-Net, sACN, DDP — standalone — microSD (+ USB-A). Likely discontinued.
- `pb-complete-controller` — USB "USB-A host"; triggers 8 (Ethernet/Wi-Fi only via a USB adapter) — Art-Net, sACN, DDP — standalone — microSD. The DMX ports are outputs. Active ($195). <https://kurtcontrollers.com/?product=pb-complete-controller>
- `pb16` — USB "USB-A host"; buttons 2; GPIO 1 — Art-Net, sACN, DDP — standalone — microSD. PocketBeagle host; designer Scott Hanson. <https://github.com/computergeek1507/PB_16>
- `pixblasters-ms1` — HDMI; USB "USB-C"; **no SD card or Ethernet** (the RJ45 chain ports carry LVDS) — not standalone. Active. <https://pixblasters.com/wp-content/uploads/2024/07/Pixblasters-MS1-Users-Guide_v2.10.pdf>
- `pixelator-mini-px1-8d` — Ethernet — Art-Net, sACN, ESP, Kling-Net — not standalone. Discontinued.
- `pixelator` — Ethernet (gigabit); buttons 4; Serial "RS-232 (profile select; not on RevC)"; **no Wi-Fi** — Art-Net, sACN, ESP, KiNET — not standalone. <https://enttec-web-cdn.s3-ap-southeast-2.amazonaws.com/pdf/datasheets/70060_Datasheet_Pixelator.pdf>
- `pixelblaze-v3` — Wi-Fi 2.4GHz; buttons 1; GPIO 18 — no network protocol input — standalone — flash. <https://electromage.com/pixelblaze>
- `pixelbox` — Ethernet — Art-Net — standalone (20 programs) — USB pen drive. Discontinued. <https://lumikit.com.br/pixelbox>
- `pixeldin` — Ethernet; buttons 4 — Art-Net, sACN — not standalone. <https://yarilo.pro/service/manuals/Yarilo_PixelDIN_datasheet_en.pdf>
- `pixie` — Wi-Fi 2.4GHz; **no Ethernet** — Art-Net, sACN (sACN needs an unlock code) — not standalone. <https://smartshow.lighting/wp-content/uploads/2023/10/PIXIE.pdf>
- `pixlite-16-long-range-mk2`, `pixlite-16-mk2-control-board`, `pixlite-16-plug-and-play-mk2`, `pixlite-4-mk2`, `pixlite-4-rugged-mk2` — Ethernet; buttons 2 — Art-Net, sACN — not standalone (4 Mk2: **no Wi-Fi or USB**).
- `pixlite-16-mk2-eco`, `pixlite-4-mk2-eco` — unknown (no source; probably as the non-ECO boards).
- `pixlite-a4-s-mk3`, `pixlite-t8-s-mk3` — Ethernet 2 (gigabit); DMX512 "RS-485 aux (in/out)"; buttons 2 — Art-Net, sACN, DMX512 — standalone — microSD.
- `pixlite-e16-s-mk3`, `pixlite-e4-s-mk3` — Ethernet (10/100); DMX512 "RS-485 aux (in/out)"; buttons 2 — Art-Net, sACN, DMX512 — standalone — microSD.
- `pixlite-t8-s-mk2` — Ethernet (1, not "Dual") — Art-Net, sACN — not standalone. Discontinued Aug 2022. <https://web.archive.org/web/20221205190147/https://www.advateklights.com/pixlite-t8-s-mk2>
- `pixnet-4` — Ethernet; PoE; **no USB** — Art-Net, sACN — not standalone. <https://pixnetcontrol.com/pixel-controllers/20-pixnet-4.html>
- `pixout-server` — Ethernet; Wi-Fi; GPIO (triggers) — Art-Net (+ MIDI, ArtTrigger, UDP, REST) — standalone — SD. An Art-Net recorder/player, not a pixel controller. <https://pixout.lighting/products/recorder/>
