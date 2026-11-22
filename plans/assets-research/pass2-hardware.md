# Pass 2: boards, converters, connectors, controllers

The delegated agent was interrupted (2026-11-18 ~10:45 PM PST) after its edits and
before its report, so this log is rebuilt from its diff and the review at port time
(2026-11-22). It has no skip reasons for the entries it didn't get to; the gaps
still open are listed by `bun run coverage:assets --missing`.

## Added (19 entries)

| Entry                                 | Image source                                                | Credit / license                         |
| ------------------------------------- | ----------------------------------------------------------- | ---------------------------------------- |
| connectors/pcb-screw-terminal-block   | DEGSON product page (DG301-5.0)                             | DEGSON                                   |
| connectors/xconnect                   | HolidayCoro EasyPlug3 xConnect pigtail page                 | HolidayCoro                              |
| connectors/xlr-4                      | Neutrik NC4MXX product page                                 | Neutrik                                  |
| controllers/elite-2d-exmu             | GLEDOPTO GL-C-616WL page                                    | GLEDOPTO                                 |
| controllers/elite-4d-exmu             | GLEDOPTO GL-C-618WL page                                    | GLEDOPTO                                 |
| controllers/falcon-f16v3              | PixelController discontinued-products page                  | PixelController, LLC                     |
| controllers/pixel-octo                | ENTTEC Pixel Octo datasheet (Feb 2019)                      | ENTTEC                                   |
| level-converters/sn74hct125           | TI product page                                             | Texas Instruments                        |
| level-converters/sn74hct245           | TI product page                                             | Texas Instruments                        |
| level-converters/txb0104              | TI product page                                             | Texas Instruments                        |
| microboards/beaglebone-green          | Seeed Studio product page                                   | Seeed Studio                             |
| microboards/orange-pi-zero            | Wikimedia Commons, "NanoPi NEO vs Orange Pi Zero" (cropped) | Kaspars Dambis, CC BY 2.0                |
| microboards/pocketbeagle-2            | BeagleBoard docs repo, product photo                        | BeagleBoard.org Foundation, CC BY-SA 4.0 |
| microboards/raspberry-pi-3-model-b    | Wikimedia Commons, "Raspberry Pi 3 (24651527564)"           | Gareth Halfacree, CC BY 2.0              |
| microboards/raspberry-pi-5            | Wikimedia Commons, "Raspberry Pi 5"                         | SimonWaldherr, CC BY 4.0                 |
| microboards/raspberry-pi-zero-2-w     | Wikimedia Commons, "Raspberry Pi Zero 2 W -- 2024 -- 0008"  | Anil Öztas, CC BY 4.0                    |
| microboards/wemos-d1-mini-pro         | WEMOS docs                                                  | WEMOS                                    |
| microboards/wemos-d1-mini             | WEMOS docs (current USB-C revision)                         | WEMOS                                    |
| pixel-decoders/ws2811-ws2812-extender | Tindie listing by the maker                                 | EagleDecorations                         |

Datasheet: orange-pi-zero gets the Allwinner H3 datasheet V1.2 (linux-sunxi copy; the
FriendlyELEC wiki copy and a Wayback capture as alternates). Allwinner doesn't publish
it itself.

## Review notes

- **Raspberry Pi 3 Model B:** the agent wrote to `raspberry-pi-3b`, which stream 2 then
  merged into `raspberry-pi-3-model-b`. The merged entry's existing photo
  (unattributed, from pass 1) showed a **3B+** (shielded Wi-Fi can, PoE header), so the
  agent's photo of a real 3B (exposed BCM2837, chip antenna) replaces it, now
  attributed. The agent's BCM2836-peripherals datasheet was not ported: stream 2
  recorded that the product page links no product brief or datasheet, and only the
  Pi 2 entries use that SoC document.
- **pcb-screw-terminal-block:** upstream had already replaced the LCSC datasheet link
  with the same DEGSON drawing; only the image was ported.
- Commons credits checked against each file's Artist field.

## Remaining gaps (checked 2026-11-22)

Of the 43 hardware entries still without an image, 42 are pass-1 skips with reasons
in this folder (adapters.md, connectors.md, controllers-a/b/c.md, microboards.md,
converters-decoders.md). The one entry added since, `level-converters/max3485`, is
skipped: analog.com does not answer automated clients (connection timeout), and
Analog Devices product pages show package drawings, not photos.
