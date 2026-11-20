# Spreadsheet parity report

Generated 11/20/2026, 3:21 AM PST (2026-11-20 11:21Z) from the live sheet by `bun run sheet-parity`. Do not edit by hand; see [../spreadsheet-parity.md](../spreadsheet-parity.md) for the audit plan and decisions.

Statuses: **missing** = the sheet has a value the YAML lacks; **differs** = the mapped YAML field holds something else; **rounded** = YAML holds a rounded display copy of the sheet number; **comment** = only in a YAML comment (not on the site); **ack** = reviewed and deliberately not migrated (reason given). Cells that match, or whose content lives in another field, are not listed.

## Summary

| Tab                                                   | Rows | Unmatched rows | YAML-only | Open cells | Open links | Open notes | Highlights |
| ----------------------------------------------------- | ---: | -------------: | --------: | ---------: | ---------: | ---------: | ---------: |
| [Pattern Drivers](#pattern-drivers)                   |   44 |              0 |        13 |    0 / 642 |     0 / 86 |     0 / 16 |          1 |
| [Controllers](#controllers)                           |  133 |              0 |         6 |   0 / 2053 |    0 / 231 |     0 / 17 |          0 |
| [Pixels](#pixels)                                     |   35 |              0 |        11 |    0 / 669 |     0 / 79 |     0 / 47 |        110 |
| [Pixel ICs](#pixel-ics)                               |   41 |              0 |        43 |    0 / 451 |     0 / 63 |     0 / 15 |         77 |
| [Pixel Decoders](#pixel-decoders)                     |   14 |              0 |         1 |    0 / 118 |     0 / 26 |      0 / 0 |         14 |
| [Level Converters](#level-converters)                 |    9 |              0 |         4 |     0 / 49 |     0 / 17 |      0 / 0 |          0 |
| [Adapters](#adapters)                                 |   47 |              0 |         0 |    0 / 471 |     0 / 95 |      0 / 1 |          0 |
| [DIY MicroBoards](#diy-microboards)                   |   38 |              0 |         7 |    0 / 702 |     0 / 84 |     0 / 19 |          0 |
| [Connectors](#connectors)                             |   44 |              0 |         4 |   0 / 1066 |    44 / 98 |      0 / 9 |          0 |
| [Drive Libraries](#drive-libraries)                   |   29 |              0 |        11 |    0 / 144 |     0 / 66 |      0 / 0 |          0 |
| [Diffusive Materials](#diffusive-materials)           |   45 |              0 |         0 |    0 / 555 |     0 / 42 |      0 / 0 |          0 |
| [Commercial Pixel Systems](#commercial-pixel-systems) |   18 |              0 |         0 |    0 / 144 |     0 / 24 |      0 / 1 |          0 |

## Pattern Drivers

Database folder: `database/pattern-drivers/`.

<details><summary>Column mapping</summary>

| Col | Sheet header  | YAML field(s)                                                      | Compared as | Note |
| --- | ------------- | ------------------------------------------------------------------ | ----------- | ---- |
| A   | (name)        | `name`                                                             | text        |      |
| B   | Developer     | `creator`                                                          | text        |      |
| C   | Price         | `pricing.price`, `pricing.tiers`                                   | price       |      |
| D   | Platform      | `platforms`                                                        | text        |      |
| E   | Live          | `capabilities.live`                                                | bool        |      |
| F   | Designer      | `capabilities.designer`                                            | bool        |      |
| G   | Visualizer    | `capabilities.visualizer`, `capabilities.visualizer_notes`         | bool        |      |
| H   | ArtNet        | `outputs.protocols.artnet`                                         | text        |      |
| I   | E1.31 sACN    | `outputs.protocols.sacn`                                           | text        |      |
| J   | DMX           | `outputs.protocols.dmx`, `outputs.dmx_notes`                       | text        |      |
| K   | KiNet         | `outputs.protocols.kinet`                                          | text        |      |
| L   | DDP           | `outputs.protocols.ddp`                                            | text        |      |
| M   | GPIO          | `outputs.gpio`, `inputs.adc`                                       | text        |      |
| N   | Serial        | `outputs.serial`, `outputs.serial_notes`                           | text        |      |
| O   | Video         | `inputs.video`                                                     | text        |      |
| P   | Audio         | `inputs.audio`                                                     | text        |      |
| Q   | Programmatic  | `capabilities.programmatic`                                        | bool        |      |
| R   | Language      | `language`                                                         | text        |      |
| S   | Other Inputs  | `inputs.other`, `inputs.other_notes`, `inputs.adc`, `inputs.audio` | text        |      |
| T   | Other Outputs | `outputs.other`, `outputs.other_notes`, `outputs.protocols`        | text        |      |
| U   | Integrations  | `integrations`                                                     | text        |      |
| V   | Notes         | `notes`, `technical_notes`                                         | text        |      |
| W   | Demo/Free     | `pricing.demo`                                                     | bool        |      |
| X   | Status        | `status`                                                           | enum        |      |
| Y   | URL           | `links.url`, `links.mirror`                                        | url         |      |

</details>

### Rows paired by alias, URL, or as duplicates

- [A4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A4) "Arthet LED Mapper" → `pattern-drivers/arthet-led-mapper` (alias, score 0.86)
- [A16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A16) "Filament LED" → `pattern-drivers/filament` (url, score 0.85)
- [A19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A19) "Jinx!" → `pattern-drivers/glediator` (url, score 0.73)
- [A30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A30) "LX Studio / Chromatik" → `pattern-drivers/lx-studio-chromatik` (url, score 0.82)
- [A36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A36) "Millumin" → `pattern-drivers/millumin` (name, score 0.91, duplicate of row 35)
- [A37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A37) "ProtoPixel Create" → `pattern-drivers/protopixel-create` (alias, score 0.8)

### YAML entries with no sheet row

- `pattern-drivers/freestyler` "FreeStyler": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/grandma` "grandMA": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/hls` "HLS": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/light-o-rama` "Light-O-Rama": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/light-show-pro` "Light Show Pro": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/lightfactory` "LightFactory": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/lss-remote` "LSS Remote": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/pharos-designer` "Pharos Designer": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/pixelblaze` "Pixelblaze": in the 2026-01-21 import
- `pattern-drivers/poet-creator` "Poet Creator": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/vvvv` "vvvv": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/watchout` "WATCHOUT": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `pattern-drivers/xschedule` "xSchedule": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)

### Highlighted cells

**Pasted formatting, no meaning** (#17161F, 1 cells; 0 still empty in YAML)

<details><summary>1 cells</summary>

| Cell                                                                                                                    | Entry           | Column       | Sheet | YAML now                                                     | Sourced |
| ----------------------------------------------------------------------------------------------------------------------- | --------------- | ------------ | ----- | ------------------------------------------------------------ | ------- |
| [S40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=S40) | `smartshow-lms` | Other Inputs | vide  | ["Video files","Images","Webcam","Screen capture","NDI","Ar… | yes     |

</details>

<details><summary>Acknowledged differences (75)</summary>

- [X3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=X3) `arkaos` Status "Active": (cited) YAML cites a source for status
- [D4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=D4) `arthet-led-mapper` Platform "ubuntu, windows, mac and arm64": Same platforms in structured form (Ubuntu = Linux, mac = macOS); arm64 is in platforms.notes
- [B5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=B5) `bekonix` Developer "Bekonix ex Rocketlife": (cited) YAML cites a source for creator
- [Y5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y5) `bekonix` URL "https://www.bekonix.com/platform/": The sheet links a sub-page that is gone (404); YAML links the live site
- [V9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V9) `chataigne-wled-mod` Notes "Plug on for vcontrol of WLED, other WLED plugins from same …": Typo fixed in YAML
- [J10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=J10) `chromatik` DMX "Possible": Typed by stream 2 (e215cd7): no direct DMX; it sends Art-Net or sACN to a node (dmx_notes)
- [Q10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Q10) `chromatik` Programmatic "Possible": Typed by stream 2 (e215cd7): "Possible" became programmatic: true
- [V11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V11) `dylos` Notes "Free for 2 DMX universes and 4 Dylos RGB Pixel zones via Ar…": (cited) YAML cites a source for notes
- [C12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C12) `elm` Price "91.728": (cited) re-priced at the source (retrieved 2026-11-18)
- [Y12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y12) `elm` URL "https://www.enttec.co.uk/product/controls-gb/addressable-le…": ENTTEC's UK store moved the page; YAML links the product's enttec.com page
- [D15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=D15) `fastled-fx-engine` Platform "ESP/AVR/NRF/RP/Browser": Same platforms in structured form (web + hardware list)
- [G15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=G15) `fastled-fx-engine` Visualizer "Browser wasm Preview": Same: a browser (WebAssembly) preview
- [C16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C16) `filament` Price "59": The maker sells it for EUR 49 one-time (VAT incl.); $59 isn't on its site
- [U16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=U16) `filament` Integrations "Standalone installation player for Raspberry Pi": Same: integrations and platforms.notes describe the free Raspberry Pi standalone player
- [V16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V16) `filament` Notes "Full Resolume replacement with a complex VJ mixer and proje…": Reworded from the maker's site: VJ mixer, projection mapping and Resolume import/export are in the notes
- [Y17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y17) `geopix-2-0-full` URL "https://www.geopix.io/": geopix.io no longer answers; YAML links the GeoPix GitHub repository
- [E19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=E19) `glediator` Live "No": This row is Glediator, which streams frames live (Solderlab's page); the sheet's No was wrong
- [U19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=U19) `glediator` Integrations "Should be solderlab.de (which is down)": A remark, not an integration: Solderlab's archived page is the entry's link
- [V19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V19) `glediator` Notes "Basically a mapper/pattern generator for microcontrollers w…": Same, in more detail and sourced (this row is Glediator)
- [V20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V20) `jinx` Notes "Development ceased": Same: status discontinued; the notes give the last release (V2.4, 2016)
- [S21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=S21) `led-lab` Other Inputs "audio (input / playback), video, MIDI, /, OSC": Same, in more detail (camera, video and music inputs; MIDI, DMX, Art-Net and OSC control)
- [T21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=T21) `led-lab` Other Outputs "DDP/Minleon/TekLights, OpenPixel": Same: DDP (Minleon, TekLights) in outputs.other and OpenPixel as outputs.protocols.opc
- [S22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=S22) `led-strip-studio-software` Other Inputs "MIDI, OSC, CMD Line, DMX": Same, as a list (CMD Line = Command line)
- [D23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=D23) `lededit` Platform "Desktop": LEDEdit is Windows desktop software; "Desktop" became os: [Windows]
- [S26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=S26) `lightdesigner` Other Inputs "GPIO pins": Same, as a list
- [V26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V26) `lightdesigner` Notes "RocketLife controllers, serial/SPI pixels only": "SPI" wording normalized to clocked pixels (937d734)
- [S28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=S28) `lightmobile` Other Inputs "GPIO pins": Same, as a list
- [V28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V28) `lightmobile` Notes "RocketLife controllers, serial/SPI pixels only": "SPI" wording normalized to clocked pixels (937d734)
- [C29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C29) `lumiastream` Price "Free- $30/month": (cited) re-priced at the source (retrieved 2026-11-18)
- [W29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=W29) `lumiastream` Demo/Free "Free / premiumn Monthly": Typo fixed in YAML
- [V30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V30) `lx-studio-chromatik` Notes "Java. Next version (Chromatik) will no longer use the Proce…": (cited) YAML cites a source for notes
- [W30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=W30) `lx-studio-chromatik` Demo/Free "Open source. Comercial applications require license": Typo fixed in YAML
- [X30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=X30) `lx-studio-chromatik` Status "Active": (cited) YAML cites a source for status
- [B31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=B31) `madmapper` Developer "Smode Tech": (cited) YAML cites a source for creator
- [C31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C31) `madmapper` Price "393.864285": (cited) re-priced at the source (retrieved 2026-11-18)
- [W32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=W32) `madrix-5` Demo/Free "Demo no data out": Same in structured form: demo.available + limitations
- [B34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=B34) `mapio-pro` Developer "Vistitution": (cited) YAML cites a source for creator
- [S34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=S34) `mapio-pro` Other Inputs "Native support for PixelPusher devices": PixelPusher support is an output, which the entry lists; the sheet wrote it in Other Inputs
- [O35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=O35) `millumin` Video "Possible": Typed by stream 2 (e215cd7): "Possible" became video in and out (Both)
- [O36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=O36) `millumin` Video "Possible": Typed by stream 2 (e215cd7): "Possible" became video in and out (Both)
- [C37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C37) `protopixel-create` Price "176": (cited) re-priced at the source (retrieved 2020-08-08)
- [T37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=T37) `protopixel-create` Other Outputs "ProtoPixel proprietary protocol, OSC, UDP": Same, as a list
- [Y37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y37) `protopixel-create` URL "https://www.protopixel.io/design": ProtoPixel's old 'design' page; YAML links the Create product page
- [B38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=B38) `qlc` Developer "Massimo Calegari": (cited) YAML cites a source for creator
- [G38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=G38) `qlc` Visualizer "3D view available in V5": Same: 3D, from QLC+ 5
- [V40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=V40) `smartshow-lms` Notes "aimed at live show use , big button execute interface": Same: the notes cover live-show use and the big-button Show Mode
- [Y41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y41) `smode` URL "https://smode.fr/": Old URL; it redirects to the page YAML links
- [D42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=D42) `touchdesigner` Platform "0": Sheet cell overwritten after the import (was "Windows, MacOS"); YAML keeps the platforms
- [G42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=G42) `touchdesigner` Visualizer "Yes, DIY": "Yes, DIY" = you build the visualizer yourself: capabilities.visualizer "3D (build your own)"
- [Y43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y43) `vixen-lights` URL "https://www.vixenlights.com/downloads/": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [M44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=M44) `wled` GPIO "Possible": Typed by stream 2 (e215cd7): "Possible" became GPIO in and out (Both)
- [T44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=T44) `wled` Other Outputs "ws281x protocol, APA102, etc.": Same, in other_notes (pixels directly: WS281x, APA102 and others)
- [Y44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y44) `wled` URL "GitHub - Aircoookie/WLED: Control WS2812B and many more typ…": The old repository's link title; github.com/Aircoookie/WLED redirects to github.com/wled/WLED, which YAML links
- [Y5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y5) `bekonix` URL "https://www.bekonix.com/platform/": The sheet links a sub-page that is gone (404); YAML links the live site
- [A12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A12) `elm` (name) "ELM": ENTTEC's UK store moved the page; YAML links the product's enttec.com page
- [W12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=W12) `elm` Demo/Free "Nag for free one": The ELM download link now redirects to the ELM page, which is in other_links
- [Y12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y12) `elm` URL "https://www.enttec.co.uk/product/controls-gb/addressable-le…": ENTTEC's UK store moved the page; YAML links the product's enttec.com page
- [A17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A17) `geopix-2-0-full` (name) "GeoPix 2.0(full)": geopix.io no longer answers; YAML links the GeoPix GitHub repository
- [Y17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y17) `geopix-2-0-full` URL "https://www.geopix.io/": geopix.io no longer answers; YAML links the GeoPix GitHub repository
- [A37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A37) `protopixel-create` (name) "ProtoPixel Create": ProtoPixel's old 'design' page; YAML links the Create product page
- [Y37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y37) `protopixel-create` URL "https://www.protopixel.io/design": ProtoPixel's old 'design' page; YAML links the Create product page
- [A41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A41) `smode` (name) "Smode": Old URL; it redirects to the page YAML links
- [Y41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y41) `smode` URL "https://smode.fr/": Old URL; it redirects to the page YAML links
- [A43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=A43) `vixen-lights` (name) "Vixen Lights": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [Y43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y43) `vixen-lights` URL "https://www.vixenlights.com/downloads/": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [Y44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y44) `wled` URL "GitHub - Aircoookie/WLED: Control WS2812B and many more typ…": Old URL; it redirects to the page YAML links
- [Y19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=Y19) `glediator` URL "https://oneguyoneblog.com/download/glediator-v2-0-3/": Same: links.mirror is that third-party mirror; it and the original are archived in dead_links
- [C21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C21) `led-lab` Price "0": Same as pricing.tiers: ten in-app purchases, $9.99-$209.99
- [C25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C25) `leds-master` Price "-1": Copied from the QLC+ row: LEDs Master's site, README and releases mention no Pi build or donation
- [C32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C32) `madrix-5` Price "330+": Migrated into pricing/demo/technical_notes (b1c26ec), reworded
- [C37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C37) `protopixel-create` Price "176": Migrated into pricing/demo/technical_notes (b1c26ec), reworded
- [C38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C38) `qlc` Price "-1": In YAML (a pricing tier and the demo text); QLC+ now asks EUR 20 for the Pi image (ISSUES.md, stream 6)
- [M38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=M38) `qlc` GPIO "Output": Stream 2's I/O check (0690af1): the GPIO, SPI and UART plugins run on Linux, not only the Raspberry Pi build; SPI is an output protocol
- [N38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=N38) `qlc` Serial "Output": Stream 2's I/O check (0690af1): the GPIO, SPI and UART plugins run on Linux, not only the Raspberry Pi build; SPI is an output protocol
- [C41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=961824890&range=C41) `smode` Price "Expensive": Migrated into pricing/demo/technical_notes (b1c26ec), reworded

</details>

## Controllers

Database folder: `database/controllers/`.

<details><summary>Column mapping</summary>

| Col | Sheet header           | YAML field(s)                                                 | Compared as                                                   | Note                                                                                                      |
| --- | ---------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| A   | (name)                 | `name`                                                        | text                                                          |                                                                                                           |
| B   | Manufacturer           | `creator`, `manufacturers`, `vendors`                         | text                                                          |                                                                                                           |
| C   | Max Pixels             | (derived)                                                     | number                                                        | outputs.pixels.max_total, else outputs.count x max_per_output (or price[].pixels)                         |
| D   | Price                  | `price`, `price[]`                                            | price                                                         |                                                                                                           |
| E   | Max outputs            | `outputs.count`                                               | number                                                        |                                                                                                           |
| F   | Interface              | `inputs.physical`, `inputs.protocols`, `inputs.requires_host` | dropped: Scrambled: the column was sorted apart from its rows | Inputs were researched from vendor documentation instead                                                  |
| G   | Storage                | (derived)                                                     | bool                                                          |                                                                                                           |
| H   | Standalone             | `inputs.standalone`                                           | bool                                                          |                                                                                                           |
| I   | Pixel Types            | `outputs.clocked`                                             | enum                                                          |                                                                                                           |
| J   | Max Voltage            | `power.voltage.max`, `power.output_voltage`                   | number (voltage)                                              |                                                                                                           |
| K   | Max Current            | `power.current.max`, `outputs.current.max`                    | number (current)                                              |                                                                                                           |
| L   | Buffered               | `outputs.driver.buffered`                                     | bool                                                          |                                                                                                           |
| M   | Output Connectors      | `outputs.connector`, `power.connector`, (derived)             | custom                                                        | String, or a ref into connectors (bd300fd); "Phoenix Screw/Plug" -> connectors/mtsb-combicon              |
| N   | Outputs                | `outputs.clocked`                                             | custom                                                        | Folded into outputs.clocked (+ auxiliary/differential); configurable-vs-dedicated clock pins has no field |
| O   | Waterproof / IP Rating | `case.waterproof`                                             | text                                                          |                                                                                                           |
| P   | Auxilary Outputs       | `outputs.auxiliary@keys`, `outputs.auxiliary`                 | text                                                          |                                                                                                           |
| Q   | WLED                   | `wled_compatible`, `software.firmware`                        | bool                                                          |                                                                                                           |
| R   | Notes                  | `notes`, `technical_notes`, `features`                        | text                                                          |                                                                                                           |
| S   | Warranty               | `vendors[].warranty`                                          | text                                                          |                                                                                                           |
| T   | Introduction           | `release_year`                                                | number                                                        |                                                                                                           |
| U   | Status                 | `status`                                                      | enum                                                          |                                                                                                           |
| V   | Product URL            | `creator.page`, `vendors[].page`, `vendors[].url`             | url                                                           |                                                                                                           |

</details>

### Rows paired by alias, URL, or as duplicates

- [A3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A3) "" → `controllers/nled-pixel-controller-mini` (url, score 0.67)
- [A5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A5) "c,v.xxzzzzzzzASA" → `controllers/a1-slwf-03` (url, score 0.62)
- [A11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A11) "Standard Differential Receiver" → `level-converters/standard-differential-receiver` (url, score 0.77)
- [A20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A20) "[+" → `controllers/elite-4d-exmu` (url, score 0.85)
- [A26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A26) "M4 Port Pixel" → `controllers/m4-port-pixel` (alias, score 0.63)
- [A27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A27) "M4- Pi" → `controllers/m4-port-pixel` (alias, score 0.58)
- [A32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A32) "M8 Port Pixel" → `controllers/m8-port-pixel` (alias, score 0.75)
- [A34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A34) "Mini 8 Port Controller" → `controllers/mini-8-port-controller` (alias, score 0.62)
- [A37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A37) "Luminaxa" → `controllers/luminaxa` (url, score 0.71)
- [A44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A44) "Baldrick Board" → `controllers/baldrick-8` (alias, score 0.5)
- [A45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A45) "Flex Pixel Driver" → `controllers/flex-pixel-driver` (alias, score 0.73)
- [A47](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A47) "AN6USP10" → `controllers/an6usp10` (url, score 0.75)
- [A64](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A64) "PixelDIN" → `controllers/pixeldin` (alias, score 0.73)
- [A81](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A81) "Falcon F4V3" → `controllers/falcon-f16v3` (alias, score 0.6)
- [A94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A94) "PixOut Server" → `controllers/pixout-server` (alias, score 0.46)
- [A108](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A108) "M8 Port Pixel" → `controllers/pixel-octo` (alias, score 0.73)
- [A112](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A112) "PixNet 4+" → `controllers/pixnet-4` (alias, score 0.72)
- [A120](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A120) "DMX Core" → `controllers/dmx-core` (alias, score 0.73)
- [A132](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A132) "LEDEddy" → `controllers/led-player-s` (alias, score 0.67)
- [A134](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A134) "F-Test" → `pixel-decoders/f-test` (url, score 1)

### YAML entries with no sheet row

- `controllers/baldrick-17` "Baldrick17": added 2026-01-27 in 04a47e8 (Update Baldrick boards accurately)
- `controllers/baldrick-dmx` "Baldrick DMX": added 2026-01-27 in 04a47e8 (Update Baldrick boards accurately)
- `controllers/falcon-f16v5` "Falcon F16V5": added 2026-06-12 in dcfe5b5 (data: first rich-schema controllers - migrate F16V4, add F16V5)
- `controllers/hinkspix-pro-v3` "HinksPix PRO V3": added 2026-06-14 in 2e8cb3b (data: add HinksPix PRO V3 controller)
- `controllers/sp608e` "SP608E": added 2026-07-02 in e1795d4 (data: split the SP801E/SP608E chimera into two researched entries)
- `controllers/wb48` "WB48": added 2026-07-01 in 67d17d0 (data: add Wally's Lights WB48 controller)

<details><summary>Acknowledged differences (352)</summary>

- [H2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H2) `sp102e` Standalone "Presets": "Presets" = plays built-in patterns on its own; YAML inputs.standalone: true
- [U2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U2) `sp102e` Status "Active": (cited) YAML cites a source for status
- [D3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D3) `nled-pixel-controller-mini` Price "13.5": (cited) re-priced at the source (retrieved 2026-11-18)
- [D4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D4) `electromage-8x-driver` Price "15": (cited) re-priced at the source (retrieved 2026-11-18)
- [J4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J4) `electromage-8x-driver` Max Voltage "12": (cited) YAML cites a source for power.voltage.max
- [R4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R4) `electromage-8x-driver` Notes "Stacks up to 8 on a bus": Same: up to 8 boards share one serial line
- [A5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A5) `a1-slwf-03` (name) "c,v.xxzzzzzzzASA": Vandalized after the import (keyboard mash); was A1-SLWF-03 / SMARTLIGHT.ME
- [B5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=B5) `a1-slwf-03` Manufacturer "`QWS": Vandalized after the import (keyboard mash); was A1-SLWF-03 / SMARTLIGHT.ME
- [D6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D6) `blink-tape-controller` Price "15.99": (cited) re-priced at the source (retrieved 2026-11-18)
- [I7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I7) `dmx-to-spi` Pixel Types "Async": (cited) YAML cites a source for outputs.clocked
- [J7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J7) `dmx-to-spi` Max Voltage "24": (cited) YAML cites a source for power.voltage.max
- [P7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=P7) `dmx-to-spi` Auxilary Outputs "Groupable in 1,2,4,5,10,100 as pixel": In features (pixel grouping in 1, 2, 4, 5, 10 or 100; from the sheet, unverified)
- [D8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D8) `sp105e` Price "18.35": (cited) re-priced at the source (retrieved 2026-11-18)
- [H8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H8) `sp105e` Standalone "Presets": "Presets" = plays built-in patterns on its own; YAML inputs.standalone: true
- [C9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C9) `elite-2d-exmu` Max Pixels "4000": Gledopto publishes no pixel limit for this model
- [D9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D9) `elite-2d-exmu` Price "19": Maker's price is EUR 34.99 (gledopto.eu); the $19 couldn't be confirmed
- [I9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I9) `elite-2d-exmu` Pixel Types "Both": The manual lists only single-wire pixel ICs
- [R9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R9) `elite-2d-exmu` Notes "Built-in microphone for audioreactive patterns, USB for fla…": Same features in the entry (microphone, USB-C, relay), sourced
- [T9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=T9) `elite-2d-exmu` Introduction "2023": No evidence for 2023 (the maker's page showed another product in April 2025)
- [D10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D10) `dmx-to-led-strip` Price "20": (cited) re-priced at the source (retrieved 2026-11-18)
- [U10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U10) `dmx-to-led-strip` Status "Active": (cited) YAML cites a source for status
- [V10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V10) `dmx-to-led-strip` Product URL "https://www.boutique-electroconcept.com/dmx-signal-board-fo…": Dead now; YAML links the current page
- [H11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H11) `standard-differential-receiver` Standalone "Yes": A differential receiver has no pattern source of its own; standalone: false is right
- [I11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I11) `standard-differential-receiver` Pixel Types "Both": Moved to level-converters by stream 2; a receiver has no pixel-type setting (io.interface Differential Pairs)
- [J11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J11) `standard-differential-receiver` Max Voltage "12": Same, as the level converter's electrical.max_voltage (12V)
- [L11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=L11) `standard-differential-receiver` Buffered "Yes": Same, as the level converter's io.buffered
- [N11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=N11) `standard-differential-receiver` Outputs "Multiple": Same, as the level converter's io.channels (4)
- [D12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D12) `sp107e` Price "24.88": (cited) re-priced at the source (retrieved 2026-11-18)
- [H12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H12) `sp107e` Standalone "Presets": "Presets" = plays built-in patterns on its own; YAML inputs.standalone: true
- [V12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V12) `sp107e` Product URL "Amazon": The sheet cell says only "Amazon" (no link); YAML names a real vendor page
- [D13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D13) `sp108e` Price "24.88": (cited) re-priced at the source (retrieved 2026-11-18)
- [H13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H13) `sp108e` Standalone "Presets": "Presets" = plays built-in patterns on its own; YAML inputs.standalone: true
- [V13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V13) `sp108e` Product URL "Amazon": The sheet cell says only "Amazon" (no link); YAML names a real vendor page
- [R14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R14) `fadecandy` Notes "Please see https://github.com/scanlime/fadecandy to confirm…": (cited) YAML cites a source for notes
- [D16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D16) `quinled-dig-uno` Price "24.99": YAML revised by research since the import (newer price/hardware revision)
- [R16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R16) `quinled-dig-uno` Notes "ESP8266/ESP32 based, open to any software, often run with W…": YAML revised by research since the import (newer price/hardware revision)
- [D17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D17) `nled-pixel-controller-electron` Price "27": YAML revised by research since the import (newer price/hardware revision)
- [J17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J17) `nled-pixel-controller-electron` Max Voltage "24": (cited) YAML cites a source for power.voltage.max
- [M17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M17) `nled-pixel-controller-electron` Output Connectors "Phoenix Screw": YAML revised by research since the import (newer price/hardware revision)
- [B18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=B18) `t1000s` Manufacturer "\\]Q[5D'`": Vandalized after the import (maker was empty, Max Pixels was 2048)
- [C18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C18) `t1000s` Max Pixels "0.456": Vandalized after the import (maker was empty, Max Pixels was 2048)
- [D18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D18) `t1000s` Price "28": (cited) re-priced at the source (retrieved 2026-11-18)
- [C19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C19) `espartstick` Max Pixels "1024": (cited) YAML cites a source for outputs.pixels
- [D19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D19) `espartstick` Price "28": (cited) re-priced at the source (retrieved 2025-06)
- [E19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=E19) `espartstick` Max outputs "2": (cited) YAML cites a source for outputs.count
- [I19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I19) `espartstick` Pixel Types "Both": Stream 2's research (2a3efbf): the SD-card EspArtStick has one single-wire output
- [K19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K19) `espartstick` Max Current "30": No published current rating (stream 2's research, 2a3efbf)
- [M19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M19) `espartstick` Output Connectors "Phoenix Screw": Same: a plug-in screw terminal block (fixed on the 2022 revision)
- [N19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=N19) `espartstick` Outputs "Single or Clock": Stream 2's research (2a3efbf): one single-wire output
- [R19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R19) `espartstick` Notes "2.4 GHZ WiFi Pixel Controller, sdc-card, RF reciever": YAML revised by research since the import (rewritten notes; discontinued per vendor/dead links)
- [U19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U19) `espartstick` Status "Active": YAML revised by research since the import (rewritten notes; discontinued per vendor/dead links)
- [C20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C20) `elite-4d-exmu` Max Pixels "4000": Gledopto publishes no total; the manual's "Recommended 1600 IC Max" is in technical_notes
- [D20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D20) `elite-4d-exmu` Price "29": Maker's price is EUR 32.99 (gledopto.eu); the $29 couldn't be confirmed
- [I20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I20) `elite-4d-exmu` Pixel Types "Both": The manual lists only single-wire pixel ICs
- [R20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R20) `elite-4d-exmu` Notes "Built-in microphone for audioreactive patterns, USB for fla…": Same features in the entry (microphone, USB-C, relay), sourced
- [C21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C21) `k2-pi0` Max Pixels "1200": (cited) YAML cites a source for outputs.pixels
- [D21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D21) `k2-pi0` Price "29": (cited) re-priced at the source (retrieved 2026-11-18)
- [J21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J21) `k2-pi0` Max Voltage "12": (cited) YAML cites a source for power.voltage.max
- [C23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C23) `digiled-strip-dmx-wav-sd-micro-player` Max Pixels "850": (cited) YAML cites a source for outputs.pixels
- [D23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D23) `digiled-strip-dmx-wav-sd-micro-player` Price "30": (cited) re-priced at the source (retrieved 2026-11-18)
- [M23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M23) `digiled-strip-dmx-wav-sd-micro-player` Output Connectors "Plated Throgh Hole": (cited) YAML cites a source for outputs.connector
- [N23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=N23) `digiled-strip-dmx-wav-sd-micro-player` Outputs "SPI/ DMX/WAV": WS2812 single-wire output; DMX and WAV are alternative firmware modes chosen at purchase
- [R23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R23) `digiled-strip-dmx-wav-sd-micro-player` Notes "6 switch input trigger SPI, DMX or Wav sound scenesProgramm…": Same, reworded: six trigger inputs; WS2812, DMX or WAV modes; sequences from ArtRender
- [C24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C24) `sp801e` Max Pixels "4800": The sheet row was the SP801E/SP608E chimera; split and researched in e1795d4
- [D24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D24) `sp801e` Price "30": The sheet row was the SP801E/SP608E chimera; split and researched in e1795d4
- [M24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M24) `sp801e` Output Connectors "Screw": The sheet row was the SP801E/SP608E chimera; split and researched in e1795d4
- [R24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R24) `sp801e` Notes "8 Outputs 600 Px per Out, 4 dry Trigger Inputs, Built in Mi…": The sheet row was the SP801E/SP608E chimera; split and researched in e1795d4
- [T24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=T24) `sp801e` Introduction "2020": The sheet row was the SP801E/SP608E chimera; split and researched in e1795d4
- [V24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V24) `sp801e` Product URL "https://www.superlightingled.com/sp608e-8-output-spi-channe…": The sheet row was the SP801E/SP608E chimera; split and researched in e1795d4
- [D25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D25) `pixelblaze-v3` Price "35": (cited) re-priced at the source (retrieved 2026-11-18)
- [D26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D26) `m4-port-pixel` Price "35": (cited) re-priced at the source (retrieved 2024-05-19)
- [I26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I26) `m4-port-pixel` Pixel Types "Both": (cited) YAML cites a source for outputs.clocked
- [N26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=N26) `m4-port-pixel` Outputs "Single or Clock": (cited) YAML cites a source for outputs.clocked
- [R26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R26) `m4-port-pixel` Notes "Raspberry Pi 3B+ or Above with FPP": Same: a Raspberry Pi 3B-and-above HAT running FPP
- [U26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U26) `m4-port-pixel` Status "Active": YAML revised by research since the import (rewritten notes; discontinued per vendor/dead links)
- [D27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D27) `m4-port-pixel` Price "35": (cited) re-priced at the source (retrieved 2024-05-19)
- [U27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U27) `m4-port-pixel` Status "Active": (cited) YAML cites a source for status
- [D28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D28) `quinled-dig-quad` Price "37.5": (cited) re-priced at the source (retrieved 2026-11-18)
- [C29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C29) `led-player-m` Max Pixels "512": (cited) YAML cites a source for outputs.pixels
- [D29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D29) `led-player-m` Price "40": (cited) re-priced at the source (retrieved 2022-01-18)
- [G29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=G29) `led-player-m` Storage "No": The LED-Player-M plays from microSD (Diamex's manual); the sheet's row mixed in another product
- [V29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V29) `led-player-m` Product URL "https://www.led-genial.de/LED-Controller-L-Rev2-fuer-WS2812…": The sheet linked a different product (Diamex LED-Controller-L Rev. 2), now 404; the entry links the LED-Player-M manual
- [U30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U30) `thunderpack-wearable` Status "Active": (cited) YAML cites a source for status
- [D32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D32) `m8-port-pixel` Price "44.99": (cited) re-priced at the source (retrieved 2025-06-21)
- [I32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I32) `m8-port-pixel` Pixel Types "Both": (cited) YAML cites a source for outputs.clocked
- [N32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=N32) `m8-port-pixel` Outputs "Single or Clock": (cited) YAML cites a source for outputs.clocked
- [U32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U32) `m8-port-pixel` Status "Active": (cited) YAML cites a source for status
- [C34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C34) `mini-8-port-controller` Max Pixels "4800": (cited) YAML cites a source for outputs.pixels
- [D34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D34) `mini-8-port-controller` Price "45": (cited) re-priced at the source (retrieved 2026-11-18)
- [H34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H34) `mini-8-port-controller` Standalone "No": (cited) YAML cites a source for inputs.standalone
- [D36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D36) `electromage-pro-8x-driver` Price "49": (cited) re-priced at the source (retrieved 2026-11-18)
- [R36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R36) `electromage-pro-8x-driver` Notes "Stacks up to 8 on a bus": Same: up to 8 boards share one serial line
- [D37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D37) `luminaxa` Price "49.99": (cited) re-priced at the source (retrieved 2026-11-18)
- [R37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R37) `luminaxa` Notes "Internal 3500mAh battery Android app": (cited) YAML cites a source for notes
- [H38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H38) `www-orangepi-dmx-org` Standalone "Yes": Stream 2's inputs audit (plans/database-review-inputs-audit.md): the pixel firmware is not standalone (a separate show-player firmware is)
- [D39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D39) `8-port-led-distro` Price "55": (cited) re-priced at the source (retrieved 2026-11-18)
- [J39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J39) `8-port-led-distro` Max Voltage "24": (cited) YAML cites a source for power.voltage.max
- [P39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=P39) `8-port-led-distro` Auxilary Outputs "I.O. Pins broken out": (cited) YAML cites a source for outputs.auxiliary
- [I40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I40) `eth032f-pixel-breakout` Pixel Types "Async": The row contradicts itself (Async pixel types, Single and Clock outputs) and no copy of the maker's page survives; left as selectable
- [C41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C41) `quinled-dig-octa` Max Pixels "4096": (cited) YAML cites a source for outputs.pixels
- [D41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D41) `quinled-dig-octa` Price "65": (cited) re-priced at the source (retrieved 2026-11-18)
- [J41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J41) `quinled-dig-octa` Max Voltage "24": (cited) YAML cites a source for power.voltage.max
- [I42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I42) `lightkraken` Pixel Types "Async": (cited) YAML cites a source for outputs.clocked
- [U42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U42) `lightkraken` Status "Active": (cited) YAML cites a source for status
- [D43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D43) `k4-pb` Price "70": (cited) re-priced at the source (retrieved 2026-11-18)
- [B44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=B44) `baldrick-8` Manufacturer "Build A Light Show": Baldrick boards re-researched by Cameron (04a47e8); the sheet row predates the Baldrick8 V1.1 details
- [K44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K44) `baldrick-8` Max Current "15": Baldrick boards re-researched by Cameron (04a47e8); the sheet row predates the Baldrick8 V1.1 details
- [R44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R44) `baldrick-8` Notes "Aimed at easy set up with Xlights.": Baldrick boards re-researched by Cameron (04a47e8); the sheet row predates the Baldrick8 V1.1 details
- [T44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=T44) `baldrick-8` Introduction "2024": Baldrick boards re-researched by Cameron (04a47e8); the sheet row predates the Baldrick8 V1.1 details
- [D45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D45) `flex-pixel-driver` Price "80": Researched as Elation's "Flex Pixel Driver 1" (c13218a)
- [M45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M45) `flex-pixel-driver` Output Connectors "Phoenix Screw": Researched as Elation's "Flex Pixel Driver 1" (c13218a)
- [V45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V45) `flex-pixel-driver` Product URL "https://www.elationlighting.com/flex-pixel-driver-1": Researched as Elation's "Flex Pixel Driver 1" (c13218a)
- [M46](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M46) `replay` Output Connectors "Phoenix Screw": (cited) YAML cites a source for outputs.connector
- [A47](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A47) `an6usp10` (name) "AN6USP10": (cited) YAML cites a source for name
- [C47](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C47) `an6usp10` Max Pixels "1020": (cited) YAML cites a source for outputs.pixels
- [D48](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D48) `k8-pb` Price "98": YAML revised by research since the import (newer price/hardware revision)
- [D49](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D49) `angio-4` Price "99": (cited) re-priced at the source (retrieved 2026-11-18)
- [U49](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U49) `angio-4` Status "Active": (cited) YAML cites a source for status
- [D50](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D50) `led-player-dmx` Price "99": (cited) re-priced at the source (retrieved 2026-11-18)
- [V50](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V50) `led-player-dmx` Product URL "https://www.led-genial.de/LED-Player-DMX-TPM2-Dateien-von-D…": Dead now; YAML links the current page
- [V51](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V51) `led-player-l` Product URL "https://www.led-genial.de/LED-Player-L-fuer-Strips-und-Pane…": Dead now; YAML links the current page
- [D53](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D53) `uli-led-control` Price "99": (cited) re-priced at the source (retrieved 2026-11-18)
- [D54](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D54) `din-pixie` Price "100": (cited) re-priced at the source (retrieved 2026-11-18)
- [V54](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V54) `din-pixie` Product URL "https://www.enttec.com.au/product/lighting-show-controller/…": Old URL; it redirects to the page YAML links
- [D55](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D55) `e6804` Price "100": (cited) re-priced at the source (retrieved 2026-11-18)
- [D57](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D57) `k40d-pb` Price "108": YAML revised by research since the import (newer price/hardware revision)
- [V58](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V58) `pixlite-4-mk2-eco` Product URL "sales@advateklights.com - ask for the ECO version. once the…": Not a URL: a sales note; the ordering advice is in notes
- [D59](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D59) `k8-b` Price "123": YAML revised by research since the import (newer price/hardware revision)
- [U60](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U60) `falcon-f4v3` Status "Active": Discontinued (PixelController's store and archived pages)
- [C61](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C61) `pb16` Max Pixels "22400": (cited) YAML cites a source for outputs.pixels
- [V61](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V61) `pb16` Product URL "http://doityourselfchristmas.com/forums/showthread.php?5329…": Dead now; YAML links the current page
- [D62](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D62) `ledmx4-pro` Price "134": (cited) re-priced at the source (retrieved 2026-11-18)
- [V62](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V62) `ledmx4-pro` Product URL "https://dmxking.com/led-pixel-control/ledmx4-pro": Old URL; it redirects to the page YAML links
- [U64](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U64) `pixeldin` Status "Active": YAML revised by research since the import (rewritten notes; discontinued per vendor/dead links)
- [V64](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V64) `pixeldin` Product URL "https://yarilo.pro/en/controllers/pixel-controllers/yarilo-…": Dead now; YAML links the current page
- [D65](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D65) `spi-led-controller` Price "150": YAML revised: current price tiers; "SPI" wording normalized (937d734)
- [V65](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V65) `spi-led-controller` Product URL "https://ledstripstudio.com/spi-led-controller/": Old URL; it redirects to the page YAML links
- [D66](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D66) `k16a-b` Price "160": (cited) re-priced at the source (retrieved 2026-11-18)
- [U66](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U66) `k16a-b` Status "Active": (cited) YAML cites a source for status
- [D67](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D67) `angio-8` Price "169": (cited) re-priced at the source (retrieved 2026-11-18)
- [U67](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U67) `angio-8` Status "Active": (cited) YAML cites a source for status
- [D68](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D68) `alphapix-classic-16-v3` Price "174.95": YAML revised by research since the import (newer price/hardware revision)
- [D69](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D69) `e682` Price "180": (cited) re-priced at the source (retrieved 2026-11-18)
- [P69](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=P69) `e682` Auxilary Outputs "DMX in groups of 4": Same in structured form: outputs.auxiliary DMX512 count
- [V69](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V69) `e682` Product URL "http://sandevices.com/product/e682-assembled-tested/": Old URL; it redirects to the page YAML links
- [C70](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C70) `genius-long-range-pixel-controller` Max Pixels "21760": (cited) YAML cites a source for outputs.pixels
- [D70](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D70) `genius-long-range-pixel-controller` Price "189": (cited) re-priced at the source (retrieved 2026-11-18)
- [D71](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D71) `wb1616` Price "189": (cited) re-priced at the source (retrieved 2025-08-05)
- [J71](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J71) `wb1616` Max Voltage "12": (cited) YAML cites a source for power.voltage.max
- [U71](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U71) `wb1616` Status "Active": (cited) YAML cites a source for status
- [R72](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R72) `pixlite-16-mk2-eco` Notes "Limited stock left - no website listing - contact directly …": Reworded/typo fixed in YAML
- [D74](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D74) `alphapix-flex-with-expansion` Price "190": (cited) re-priced at the source (retrieved 2026-11-18)
- [U75](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U75) `protopixel-1-channel-ethernet` Status "Active": (cited) YAML cites a source for status
- [D76](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D76) `k32a-b` Price "195": (cited) re-priced at the source (retrieved 2026-11-18)
- [U76](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U76) `k32a-b` Status "Active": (cited) YAML cites a source for status
- [D77](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D77) `ledmx2-max` Price "199": (cited) re-priced at the source (retrieved 2026-11-18)
- [V77](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V77) `ledmx2-max` Product URL "https://dmxking.com/led-pixel-control/ledmx2-max": Sheet error: the LeDMX2 MAX row links the LeDMX4 MAX page
- [D78](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D78) `pb-complete-controller` Price "199": (cited) re-priced at the source (retrieved 2026-11-18)
- [P78](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=P78) `pb-complete-controller` Auxilary Outputs "16 x4A D.C. / 16 xServo/ 8 switch inputs": (cited) YAML cites a source for outputs.auxiliary
- [V79](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V79) `pixelbox` Product URL "https://www.lumikit.com.br/international": Generic vendor landing page; YAML links the product page
- [D80](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D80) `falcon-f48` Price "200": (cited) re-priced at the source (retrieved 2026-11-18)
- [U80](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U80) `falcon-f48` Status "Active": (cited) YAML cites a source for status
- [D81](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D81) `falcon-f16v3` Price "200": $250 is the last list price; $200 was the 2018-19 price (in price_source)
- [J81](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J81) `falcon-f16v3` Max Voltage "36": Manual: 5-12 V as shipped, 13-24 V with the R92 modification; 36 V isn't supported
- [U81](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U81) `falcon-f16v3` Status "Active": Discontinued (PixelController's store and archived pages)
- [V81](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V81) `falcon-f16v3` Product URL "https://pixelcontroller.com/store/products/48-f16v3.html": The old URL redirects to the discontinued-products page the entry links
- [D82](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D82) `brightly` Price "200": (cited) re-priced at the source (retrieved 2021-03-21)
- [C83](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C83) `protopixel-1-channel-wifi` Max Pixels "600": (cited) YAML cites a source for outputs.pixels
- [U83](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U83) `protopixel-1-channel-wifi` Status "Active": (cited) YAML cites a source for status
- [D84](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D84) `reactivo-2` Price "225": YAML revised by research since the import (newer price/hardware revision)
- [K84](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K84) `reactivo-2` Max Current "5": (cited) YAML cites a source for power.current.max
- [B85](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=B85) `k16000s` Manufacturer "KulpLights, LLC": Sheet error: KulpLights sells no K16000S; it's AUTUNEER's (sourced)
- [I85](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I85) `k16000s` Pixel Types "Async": (cited) YAML cites a source for outputs.clocked
- [V85](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V85) `k16000s` Product URL "https://www.amazon.com/dp/B09XB4QTGT": (cited) YAML cites a source for creator.page
- [D86](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D86) `k64d-b` Price "230": YAML revised by research since the import (newer price/hardware revision)
- [M87](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M87) `netpixel-one` Output Connectors "JST": YAML revised by research: 10-way plug-in harness
- [D88](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D88) `k128d-b` Price "270": (cited) re-priced at the source (retrieved 2026-11-18)
- [D89](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D89) `falcon-f16v4` Price "275": (cited) re-priced at the source (retrieved 2026-11-18)
- [D90](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D90) `orange-pro-plus-32` Price "275": (cited) re-priced at the source (retrieved 2026-05-16)
- [J90](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J90) `orange-pro-plus-32` Max Voltage "24": (cited) YAML cites a source for power.voltage.max
- [N90](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=N90) `orange-pro-plus-32` Outputs "Single and Clock": (cited) YAML cites a source for outputs.clocked
- [U90](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U90) `orange-pro-plus-32` Status "Active": (cited) YAML cites a source for status
- [D91](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D91) `ledmx4-max` Price "299": (cited) re-priced at the source (retrieved 2026-11-18)
- [V91](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V91) `ledmx4-max` Product URL "https://dmxking.com/led-pixel-control/ledmx4-max": Old URL; it redirects to the page YAML links
- [D92](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D92) `spi-matrix` Price "299": (cited) re-priced at the source (retrieved 2026-11-18)
- [K92](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K92) `spi-matrix` Max Current "20": Maker: 10 A total, 5 A per output (sourced)
- [D93](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D93) `genius-pro-32-port` Price "300": (cited) re-priced at the source (retrieved 2026-11-18)
- [H93](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H93) `genius-pro-32-port` Standalone "No": Maker: an SD card slot for standalone operation (sourced)
- [M93](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M93) `genius-pro-32-port` Output Connectors "Spring Terminal": (cited) YAML cites a source for outputs.connector
- [C94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C94) `pixout-server` Max Pixels "8192": PixOut has no pixel outputs (maker FAQ and product page); the sheet's output columns were wrong
- [D94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D94) `pixout-server` Price "300": (cited) re-priced at the source (retrieved 2026-11-18)
- [E94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=E94) `pixout-server` Max outputs "8": PixOut has no pixel outputs (maker FAQ and product page); the sheet's output columns were wrong
- [I94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I94) `pixout-server` Pixel Types "Both": PixOut has no pixel outputs (maker FAQ and product page); the sheet's output columns were wrong
- [J94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J94) `pixout-server` Max Voltage "24": PixOut has no pixel outputs (maker FAQ and product page); the sheet's output columns were wrong
- [L94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=L94) `pixout-server` Buffered "Yes": PixOut has no pixel outputs (maker FAQ and product page); the sheet's output columns were wrong
- [R94](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R94) `pixout-server` Notes "Pi based artnet recorderUp to 255 Universes IOS/Android App": Same, except up to 64 universes (the maker's current page)
- [D95](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D95) `smartshow-pro-one` Price "300": (cited) re-priced at the source (retrieved 2026-11-18)
- [C96](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C96) `digidot-c4-live-12` Max Pixels "8192": 8192 is channels (16 universes, licence-dependent), not pixels
- [D96](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D96) `digidot-c4-live-12` Price "330": (cited) re-priced at the source (retrieved 2026-11-18)
- [K96](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K96) `digidot-c4-live-12` Max Current "0": 0 in the sheet is a placeholder, not a rating; YAML leaves it empty
- [V96](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V96) `digidot-c4-live-12` Product URL "https://digidot.eu/c4/digidot-c4-live": Dead (404); YAML links DiGidot's current product page
- [D97](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D97) `octo-mk2` Price "330": (cited) re-priced at the source (retrieved 2026-11-18)
- [P97](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=P97) `octo-mk2` Auxilary Outputs "Ethernet thru": In inputs.physical: Ethernet Dual (in + thru)
- [D98](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D98) `uls-stripe` Price "330": (cited) re-priced at the source (retrieved 2026-11-18)
- [I98](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I98) `uls-stripe` Pixel Types "Async": (cited) YAML cites a source for outputs.clocked
- [R98](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R98) `uls-stripe` Notes "7 DMX Modes fom Individual to grouped": Reworded/typo fixed in YAML
- [D99](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D99) `pixlite-4-mk2` Price "339.95": (cited) re-priced at the source (retrieved 2026-11-18)
- [U99](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U99) `pixlite-4-mk2` Status "Active": (cited) YAML cites a source for status
- [V99](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V99) `pixlite-4-mk2` Product URL "https://www.advateklights.com/pixlite-4-mk2-control-board": Old URL; it redirects to the page YAML links
- [D100](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D100) `spinode` Price "349": (cited) re-priced at the source (retrieved 2026-11-18)
- [D101](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D101) `madrix-nebula` Price "350": (cited) re-priced at the source (retrieved 2026-11-18)
- [D102](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D102) `deskontrol-lite-16` Price "363": (cited) re-priced at the source (retrieved 2021-09-24)
- [M103](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M103) `pixblasters-ms1` Output Connectors "Header strip": (cited) YAML cites a source for outputs.connector
- [P103](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=P103) `pixblasters-ms1` Auxilary Outputs "Ethernet to daisy chain mult controllers": (cited) YAML cites a source for outputs.auxiliary
- [D104](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D104) `digidot-c4-extended-8` Price "385": (cited) re-priced at the source (retrieved 2026-11-18)
- [V104](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V104) `digidot-c4-extended-8` Product URL "https://digidot.eu/c4/digidot-c4-extended": Dead (404); YAML links DiGidot's current product page
- [D105](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D105) `pixlite-a4-s-mk3` Price "399": (cited) re-priced at the source (retrieved 2026-11-18)
- [V105](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V105) `pixlite-a4-s-mk3` Product URL "https://www.advateklights.com/pixlite-a4-s-mk3": Old URL; it redirects to the page YAML links
- [D106](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D106) `twinpixx16` Price "399": (cited) re-priced at the source (retrieved 2021-01-20)
- [B107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=B107) `rc4magic-s3-pixel-driver` Manufacturer "Theatre Wireless": (cited) YAML cites a source for creator
- [D107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D107) `rc4magic-s3-pixel-driver` Price "399": (cited) re-priced at the source (retrieved 2026-11-18)
- [G107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=G107) `rc4magic-s3-pixel-driver` Storage "Yes": Stream 2's inputs audit (plans/database-review-inputs-audit.md): no storage; it reshapes live console data
- [H107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H107) `rc4magic-s3-pixel-driver` Standalone "Yes": Stream 2's inputs audit (plans/database-review-inputs-audit.md): not standalone; it reshapes live console data
- [P107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=P107) `rc4magic-s3-pixel-driver` Auxilary Outputs "DMX Thru": Same in structured form: outputs.auxiliary DMX512 count
- [V107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V107) `rc4magic-s3-pixel-driver` Product URL "https://theatrewireless.com/shop/rc4magic-s3/dmxpix/": (cited) YAML cites a source for creator.page
- [A108](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A108) `pixel-octo` (name) "M8 Port Pixel": The row is ENTTEC's Pixel Octo (71520) under the wrong name (archived ENTTEC page)
- [I108](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I108) `pixel-octo` Pixel Types "Clocked": The datasheet lists single-wire and clocked ICs
- [D109](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D109) `pixlite-4-rugged-mk2` Price "439.95": (cited) re-priced at the source (retrieved 2026-11-18)
- [U109](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U109) `pixlite-4-rugged-mk2` Status "Active": (cited) YAML cites a source for status
- [V109](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V109) `pixlite-4-rugged-mk2` Product URL "https://www.advateklights.com/pixlite-4-mk2-rugged": Old URL; it redirects to the page YAML links
- [D110](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D110) `pixlite-16-long-range-mk2` Price "449.95": (cited) re-priced at the source (retrieved 2026-11-18)
- [U110](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U110) `pixlite-16-long-range-mk2` Status "Active": (cited) YAML cites a source for status
- [V110](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V110) `pixlite-16-long-range-mk2` Product URL "https://www.advateklights.com/pixlite-16-mk2-long-range-con…": Old URL; it redirects to the page YAML links
- [D111](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D111) `pixlite-16-mk2-control-board` Price "449.95": (cited) re-priced at the source (retrieved 2026-11-18)
- [U111](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U111) `pixlite-16-mk2-control-board` Status "Active": (cited) YAML cites a source for status
- [V111](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V111) `pixlite-16-mk2-control-board` Product URL "https://www.advateklights.com/pixlite-16-mk2-control-board": Old URL; it redirects to the page YAML links
- [A112](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A112) `pixnet-4` (name) "PixNet 4+": (cited) YAML cites a source for name
- [C113](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C113) `pixlite-16-plug-and-play-mk2` Max Pixels "5440": (cited) YAML cites a source for outputs.pixels
- [U113](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U113) `pixlite-16-plug-and-play-mk2` Status "Active": (cited) YAML cites a source for status
- [V113](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V113) `pixlite-16-plug-and-play-mk2` Product URL "https://www.advateklights.com/pixlite-16-mk2-plug-and-play": Old URL; it redirects to the page YAML links
- [C114](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C114) `pixlite-e4-s-mk3` Max Pixels "16320": (cited) YAML cites a source for outputs.pixels
- [D114](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D114) `pixlite-e4-s-mk3` Price "549": (cited) re-priced at the source (retrieved 2026-11-18)
- [V114](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V114) `pixlite-e4-s-mk3` Product URL "https://www.advateklights.com/pixlite-e4-s-mk3": Old URL; it redirects to the page YAML links
- [U115](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U115) `protopixel-8-channel-controller` Status "Active": (cited) YAML cites a source for status
- [D116](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D116) `epix-flex-drive` Price "600": (cited) re-priced at the source (retrieved 2026-11-18)
- [V116](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V116) `epix-flex-drive` Product URL "https://www.chauvetprofessional.com/products/epix-flex-driv…": Old URL; it redirects to the page YAML links
- [D117](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D117) `led-ethernet-controller-3` Price "625": (cited) re-priced at the source (retrieved 2026-11-18)
- [K117](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K117) `led-ethernet-controller-3` Max Current "20": Maker: 10 A total, 5 A per output (sourced); the manual's 20 A is the largest supply it allows
- [D118](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D118) `deskontroller-lite-v3-32` Price "630": (cited) re-priced at the source (retrieved 2026-11-18)
- [D119](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D119) `pixelator-mini-px1-8d` Price "700": (cited) re-priced at the source (retrieved 2022-10-06)
- [E119](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=E119) `pixelator-mini-px1-8d` Max outputs "24": The Mini has 8 PLink ports (ENTTEC UM-71066); 24 is the full Pixelator's
- [M119](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=M119) `pixelator-mini-px1-8d` Output Connectors "RJ-46": Typo: RJ45 PLink ports
- [C120](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C120) `dmx-core` Max Pixels "6800": DMX Core 100 is a DMX/Art-Net node that drives no pixels; its pixel outputs were removed (database review, plans/database-review-fixes/ctrl-afp.yaml)
- [D120](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D120) `dmx-core` Price "799": (cited) re-priced at the source (retrieved 2026-11-18)
- [I120](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I120) `dmx-core` Pixel Types "Both": DMX Core 100 is a DMX/Art-Net node that drives no pixels; its pixel outputs were removed (database review, plans/database-review-fixes/ctrl-afp.yaml)
- [K121](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K121) `led-ethernet-controller-powered` Max Current "20": Unverified either way: the maker's spec PDF didn't load; YAML keeps the sheet note's 10 A per output
- [U121](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U121) `led-ethernet-controller-powered` Status "Active": (cited) YAML cites a source for status
- [D122](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D122) `pixlite-e16-s-mk3` Price "950": (cited) re-priced at the source (retrieved 2026-11-18)
- [V122](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V122) `pixlite-e16-s-mk3` Product URL "https://www.advateklights.com/pixlite-e16-s-mk3": Old URL; it redirects to the page YAML links
- [D123](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D123) `deskontroller-lite-v3-96` Price "1060": (cited) re-priced at the source (retrieved 2026-11-18)
- [D124](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D124) `pixlite-t8-s-mk3` Price "1200": (cited) re-priced at the source (retrieved 2026-11-18)
- [V124](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V124) `pixlite-t8-s-mk3` Product URL "https://www.advateklights.com/pixlite-t8-s-mk3": Old URL; it redirects to the page YAML links
- [D125](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D125) `deskontroller-lite-v3-192` Price "1490": (cited) re-priced at the source (retrieved 2026-11-18)
- [D126](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D126) `qolorpix` Price "1500": (cited) re-priced at the source (retrieved 2026-11-18)
- [K126](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K126) `qolorpix` Max Current "120": (cited) YAML cites a source for power.current.max
- [V126](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V126) `qolorpix` Product URL "http://www.citytheatrical.com/Products/qolorpix-tape-contro…": Old URL; it redirects to the page YAML links
- [D127](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D127) `pixelator` Price "1845.0432": (cited) re-priced at the source (retrieved 2022-06-29)
- [G127](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=G127) `pixelator` Storage "Yes": The manual describes no show storage; its DMX Generator holds static looks only
- [H127](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H127) `pixelator` Standalone "Yes": Stream 2's inputs audit (plans/database-review-inputs-audit.md): not standalone (Pixelator datasheet)
- [V128](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V128) `emp-16-uni-control` Product URL "https://www.empdesigns.co.uk/portfolio-item/16-universe-led…": Old URL; it redirects to the page YAML links
- [V129](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V129) `pixpoe` Product URL "https://www.empdesigns.co.uk/portfolio-item/poe-pixel-contr…": Old page; it now redirects to the product page YAML links
- [H130](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H130) `apd-2-500-12v-art` Standalone "No": Stream 2's inputs audit (plans/database-review-inputs-audit.md): standalone, with internal programs (maker page)
- [K130](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K130) `apd-2-500-12v-art` Max Current "5": No source gives a current, and 5 A fits neither the mains input nor the 12 V side of its 150 W supply; removed (database review, plans/database-review-fixes/ctrl-afp.yaml)
- [V130](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V130) `apd-2-500-12v-art` Product URL "https://www.digitaltape.co.uk/pixel-drivers": A category page; YAML links the product's own page
- [J132](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=J132) `led-player-s` Max Voltage "5": The sheet row was misidentified (LedEddy is software); resolved as LED Player S in a61acdb
- [L132](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=L132) `led-player-s` Buffered "No": The sheet row was misidentified (LedEddy is software); resolved as LED Player S in a61acdb
- [U133](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=U133) `scenex-pp4` Status "Active": (cited) YAML cites a source for status
- [A7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A7) `dmx-to-spi` (name) "DMX to SPI": Sheet error: the DMX to SPI name links an unrelated ENTTEC page (copy-paste)
- [A9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A9) `elite-2d-exmu` (name) "Elite 2D-EXMU": AliExpress affiliate short link that no longer resolves; the entry links Gledopto's own pages
- [A10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A10) `dmx-to-led-strip` (name) "DMX to LED Strip": Dead now; YAML links the current page
- [V10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V10) `dmx-to-led-strip` Product URL "https://www.boutique-electroconcept.com/dmx-signal-board-fo…": Dead now; YAML links the current page
- [R23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R23) `digiled-strip-dmx-wav-sd-micro-player` Notes "6 switch input trigger SPI, DMX or Wav sound scenesProgramm…": Dead now; YAML links the current page
- [V24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V24) `sp801e` Product URL "https://www.superlightingled.com/sp608e-8-output-spi-channe…": The sheet row was the SP801E/SP608E chimera; split and researched in e1795d4
- [A29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A29) `led-player-m` (name) "LED Player M": The sheet linked a different product (Diamex LED-Controller-L Rev. 2), now 404; the entry links the LED-Player-M manual
- [V29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V29) `led-player-m` Product URL "https://www.led-genial.de/LED-Controller-L-Rev2-fuer-WS2812…": The sheet linked a different product (Diamex LED-Controller-L Rev. 2), now 404; the entry links the LED-Player-M manual
- [A36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A36) `electromage-pro-8x-driver` (name) "ElectroMage Pro 8x Driver": Tindie moved the listing; YAML has the current listing URL
- [A45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A45) `flex-pixel-driver` (name) "Flex Pixel Driver": Researched as Elation's "Flex Pixel Driver 1" (c13218a)
- [V45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V45) `flex-pixel-driver` Product URL "https://www.elationlighting.com/flex-pixel-driver-1": Researched as Elation's "Flex Pixel Driver 1" (c13218a)
- [A50](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A50) `led-player-dmx` (name) "LED Player DMX": Dead now; YAML links the current page
- [V50](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V50) `led-player-dmx` Product URL "https://www.led-genial.de/LED-Player-DMX-TPM2-Dateien-von-D…": Dead now; YAML links the current page
- [A51](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A51) `led-player-l` (name) "LED Player L": Dead now; YAML links the current page
- [V51](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V51) `led-player-l` Product URL "https://www.led-genial.de/LED-Player-L-fuer-Strips-und-Pane…": Dead now; YAML links the current page
- [A54](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A54) `din-pixie` (name) "DIN Pixie": Old URL; it redirects to the page YAML links
- [V54](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V54) `din-pixie` Product URL "https://www.enttec.com.au/product/lighting-show-controller/…": Old URL; it redirects to the page YAML links
- [A61](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A61) `pb16` (name) "PB16": Dead now; YAML links the current page
- [V61](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V61) `pb16` Product URL "http://doityourselfchristmas.com/forums/showthread.php?5329…": Dead now; YAML links the current page
- [A62](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A62) `ledmx4-pro` (name) "LeDMX4 Pro": Old URL; it redirects to the page YAML links
- [A64](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A64) `pixeldin` (name) "PixelDIN": Dead now; YAML links the current page
- [V64](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V64) `pixeldin` Product URL "https://yarilo.pro/en/controllers/pixel-controllers/yarilo-…": Dead now; YAML links the current page
- [A65](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A65) `spi-led-controller` (name) "SPI LED Controller": Old URL; it redirects to the page YAML links
- [V65](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V65) `spi-led-controller` Product URL "https://ledstripstudio.com/spi-led-controller/": Old URL; it redirects to the page YAML links
- [A69](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A69) `e682` (name) "E682": Old URL; it redirects to the page YAML links
- [V69](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V69) `e682` Product URL "http://sandevices.com/product/e682-assembled-tested/": Old URL; it redirects to the page YAML links
- [A77](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A77) `ledmx2-max` (name) "LeDMX2 MAX": Old URL; it redirects to the page YAML links
- [V77](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V77) `ledmx2-max` Product URL "https://dmxking.com/led-pixel-control/ledmx2-max": Sheet error: the LeDMX2 MAX row links the LeDMX4 MAX page
- [A79](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A79) `pixelbox` (name) "Pixelbox": Generic vendor landing page; YAML links the product page
- [V79](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V79) `pixelbox` Product URL "https://www.lumikit.com.br/international": Generic vendor landing page; YAML links the product page
- [V81](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V81) `falcon-f16v3` Product URL "https://pixelcontroller.com/store/products/48-f16v3.html": The old URL redirects to the discontinued-products page the entry links
- [R84](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R84) `reactivo-2` Notes "https://reactivo.lighting/first-touch/ Screen grabber, WEB …": Malformed link (notes text pasted into the URL); the page itself is in creator.page
- [A85](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A85) `k16000s` (name) "K16000S": The Amazon listing is an unrelated CANRIA decoder (stream 6)
- [V85](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V85) `k16000s` Product URL "https://www.amazon.com/dp/B09XB4QTGT": The Amazon listing is an unrelated CANRIA decoder (stream 6)
- [A91](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A91) `ledmx4-max` (name) "LeDMX4 MAX": Old URL; it redirects to the page YAML links
- [V91](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V91) `ledmx4-max` Product URL "https://dmxking.com/led-pixel-control/ledmx4-max": Old URL; it redirects to the page YAML links
- [A92](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A92) `spi-matrix` (name) "SPI Matrix": Old page; it now redirects to the SPI Matrix page the entry links
- [R92](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R92) `spi-matrix` Notes "https://www.ledstripstudio.com/download/LEC3HardwareManual.…": Malformed link (note text pasted into the URL); the hardware manual is in the entry
- [A96](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A96) `digidot-c4-live-12` (name) "DiGidot C4 Live 12": Dead (404); YAML links DiGidot's current product page
- [V99](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V99) `pixlite-4-mk2` Product URL "https://www.advateklights.com/pixlite-4-mk2-control-board": Old URL; it redirects to the page YAML links
- [A104](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A104) `digidot-c4-extended-8` (name) "DiGidot C4 Extended 8": Dead (404); YAML links DiGidot's current product page
- [A105](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A105) `pixlite-a4-s-mk3` (name) "PixLite A4-S Mk3": Old datasheet link; redirects to the download page in datasheet.url
- [V105](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V105) `pixlite-a4-s-mk3` Product URL "https://www.advateklights.com/pixlite-a4-s-mk3": Old URL; it redirects to the page YAML links
- [A107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A107) `rc4magic-s3-pixel-driver` (name) "RC4Magic S3 Pixel Driver": Old URL; it redirects to the page YAML links
- [V107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V107) `rc4magic-s3-pixel-driver` Product URL "https://theatrewireless.com/shop/rc4magic-s3/dmxpix/": Old URL; it redirects to the page YAML links
- [A109](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A109) `pixlite-4-rugged-mk2` (name) "PixLite 4 Rugged Mk2": Old URL; it redirects to the page YAML links
- [V109](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V109) `pixlite-4-rugged-mk2` Product URL "https://www.advateklights.com/pixlite-4-mk2-rugged": Old URL; it redirects to the page YAML links
- [V110](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V110) `pixlite-16-long-range-mk2` Product URL "https://www.advateklights.com/pixlite-16-mk2-long-range-con…": Old URL; it redirects to the page YAML links
- [V111](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V111) `pixlite-16-mk2-control-board` Product URL "https://www.advateklights.com/pixlite-16-mk2-control-board": Old URL; it redirects to the page YAML links
- [A112](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A112) `pixnet-4` (name) "PixNet 4+": Dead (404) with no Wayback capture
- [V113](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V113) `pixlite-16-plug-and-play-mk2` Product URL "https://www.advateklights.com/pixlite-16-mk2-plug-and-play": Old URL; it redirects to the page YAML links
- [V114](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V114) `pixlite-e4-s-mk3` Product URL "https://www.advateklights.com/pixlite-e4-s-mk3": Old URL; it redirects to the page YAML links
- [A116](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A116) `epix-flex-drive` (name) "Epix Flex Drive": Old URL; it redirects to the page YAML links
- [V116](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V116) `epix-flex-drive` Product URL "https://www.chauvetprofessional.com/products/epix-flex-driv…": Old URL; it redirects to the page YAML links
- [R117](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R117) `led-ethernet-controller-3` Notes "https://www.ledstripstudio.com/download/LEC3HardwareManual.…": Malformed link (note text pasted into the URL); the hardware manual is in the entry
- [R121](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=R121) `led-ethernet-controller-powered` Notes "https://www.ledstripstudio.com/download/LEC3HardwareManual.…": Malformed link (warranty text pasted into the URL); the manual is in other_links
- [V122](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V122) `pixlite-e16-s-mk3` Product URL "https://www.advateklights.com/pixlite-e16-s-mk3": Old URL; it redirects to the page YAML links
- [A124](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A124) `pixlite-t8-s-mk3` (name) "PixLite T8-S Mk3": Old URL; it redirects to the page YAML links
- [V124](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V124) `pixlite-t8-s-mk3` Product URL "https://www.advateklights.com/pixlite-t8-s-mk3": Old URL; it redirects to the page YAML links
- [A126](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A126) `qolorpix` (name) "Qolorpix": Old URL; it redirects to the page YAML links
- [V126](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V126) `qolorpix` Product URL "http://www.citytheatrical.com/Products/qolorpix-tape-contro…": Old URL; it redirects to the page YAML links
- [A128](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A128) `emp-16-uni-control` (name) "EMP 16 Uni control": Old URL; it redirects to the page YAML links
- [V128](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V128) `emp-16-uni-control` Product URL "https://www.empdesigns.co.uk/portfolio-item/16-universe-led…": Old URL; it redirects to the page YAML links
- [A129](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=A129) `pixpoe` (name) "PIXPoE": Old page; it now redirects to the product page YAML links
- [V129](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V129) `pixpoe` Product URL "https://www.empdesigns.co.uk/portfolio-item/poe-pixel-contr…": Old page; it now redirects to the product page YAML links
- [V130](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=V130) `apd-2-500-12v-art` Product URL "https://www.digitaltape.co.uk/pixel-drivers": A category page; YAML links the product's own page
- [I57](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I57) `k40d-pb` Pixel Types "Async": YAML says differential: true and its notes describe the RJ45 differential ports
- [I80](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I80) `falcon-f48` Pixel Types "Async": Same: outputs.differential (it drives Falcon differential receiver boards)
- [D92](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D92) `spi-matrix` Price "299": Same: price tiers 299/449/599 for 1024/2048/4096 pixels, and the one-year license in technical_notes
- [H105](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=H105) `pixlite-a4-s-mk3` Standalone "Yes": Same: standalone playback via SHOWTime (features, inputs.standalone)
- [I107](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=I107) `rc4magic-s3-pixel-driver` Pixel Types "Both": The note was copied from the 8-output Uli LED Control; this unit has 2 outputs and its maker says nothing like it (database review, plans/database-review-fixes/ctrl-lq.yaml)
- [C115](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=C115) `protopixel-8-channel-controller` Max Pixels "4800": In notes/technical_notes: 4800 LEDs across two 4-output satellites (600 per output)
- [D117](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D117) `led-ethernet-controller-3` Price "625": Same: price tiers 625/950/1250 and the lifetime license in technical_notes
- [D121](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=D121) `led-ethernet-controller-powered` Price "850": Migrated as price tiers, a technical note, and outputs.current.max 10A (b1c26ec)
- [K121](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=0&range=K121) `led-ethernet-controller-powered` Max Current "20": Migrated as price tiers, a technical note, and outputs.current.max 10A (b1c26ec)

</details>

## Pixels

Database folder: `database/pixels/`.

<details><summary>Column mapping</summary>

| Col | Sheet header          | YAML field(s)                                      | Compared as                                                                                                   | Note                                                          |
| --- | --------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| A   | (name)                | `name`                                             | text                                                                                                          |                                                               |
| B   | Colour Group          | `color.order`                                      | text                                                                                                          |                                                               |
| C   | LED Voltage           | `electrical.led_voltage`                           | number (voltage)                                                                                              |                                                               |
| D   | Clocked               | `data.clocked`                                     | bool                                                                                                          |                                                               |
| E   | VCC Voltage           | `electrical.supply_voltage`                        | number (voltage)                                                                                              |                                                               |
| F   | PWM Frequency         | `color.pwm_frequency`                              | number (frequency)                                                                                            |                                                               |
| G   | Brightness Bits       | `color.channel_bits`, `color.brightness_control`   | custom                                                                                                        |                                                               |
| H   | Data BitRate          | `data.bitrate`                                     | number (frequency)                                                                                            |                                                               |
| I   | Pixel Data Size       | `data.pixel_size_bits`                             | number                                                                                                        |                                                               |
| J   | Pixel Rate Max        | —                                                  | derived: Computed (bitrate / pixel size); the site derives it at render time (a1cd65f stripped stored copies) |                                                               |
| K   | GPIO Min              | `electrical.gpio.min`                              | number (voltage)                                                                                              |                                                               |
| L   | GPIO Max              | `electrical.gpio.max`                              | number (voltage)                                                                                              |                                                               |
| M   | Wattage               | `electrical.wattage`                               | number (power)                                                                                                |                                                               |
| N   | Channel Current       | `electrical.channel_current`                       | number (current)                                                                                              |                                                               |
| O   | Quiescent Current     | `electrical.quiescent_current`                     | number (current)                                                                                              |                                                               |
| P   | Package Size          | `physical.packages`                                | text                                                                                                          | Standardized package list (0bb3346)                           |
| Q   | Pin Count             | `physical.pin_count`                               | number                                                                                                        |                                                               |
| R   | Data Type             | `data.type`                                        | text                                                                                                          |                                                               |
| S   | Backup Data Line      | `data.backup_line`                                 | bool                                                                                                          |                                                               |
| T   | Max pixel per string  | `data.max_per_string`, `data.max_per_string_notes` | text                                                                                                          |                                                               |
| U   | Release Year          | `release_year`                                     | number                                                                                                        |                                                               |
| V   | NOTES                 | `notes`, `technical_notes`                         | text                                                                                                          |                                                               |
| W   | 3rd Party Testing     | `datasheet.third_party_testing`                    | url                                                                                                           |                                                               |
| X   | Original Manufacturer | `creator`, `manufacturers`                         | text                                                                                                          |                                                               |
| Y   | Datasheet URL         | `datasheet.url`, `datasheet.sources[].url`         | url                                                                                                           |                                                               |
| Z   | Other Links           | `other_links`                                      | url                                                                                                           | Cell text is the linked page title; the hyperlink is the data |

</details>

### Rows paired by alias, URL, or as duplicates

- [A11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A11) "HD107S" → `pixels/hd107s` (alias, score 0.77)
- [A12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A12) "HD108" → `pixels/hd108` (alias, score 0.76)
- [A13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A13) "LC2823-2020" → `pixels/lc2823-2020` (url, score 0.83)
- [A16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A16) "NS107S" → `pixels/hd107s` (alias, score 0.73)
- [A17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A17) "NS108" → `pixels/hd108` (alias, score 0.64)
- [A19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A19) "NS8808" → `pixels/hd8808` (alias, score 0.86)
- [A21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A21) "SK6812" → `pixels/sk6812-wwa` (url, score 0.77)
- [A30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A30) "SM1616" → `pixel-ics/sm16716` (alias, score 1)

### YAML entries with no sheet row

- `pixels/adafruit-pixie` "Adafruit Pixie": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixels/ge8812` "GE8812": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixels/ge8822` "GE8822": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixels/ink1002` "INK1002": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixels/p9412` "P9412": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixels/p943` "P943": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixels/sk6805` "SK6805": added 2026-06-14 in 556d5da (data: add SK6805 addressable LED)
- `pixels/sk6812-rgbw` "SK6812RGBW": added 2026-07-01 in 10c865a (data: add SK6812RGBW)
- `pixels/sk6851` "SK6851": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixels/tx1818` "TX1818": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixels/ws2822s` "WS2822S": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)

### Highlighted cells

**Missing data, easy to fill** (#FFF2CC, 95 cells; 34 still empty in YAML)

<details><summary>95 cells</summary>

| Cell                                                                                                                    | Entry         | Column            | Sheet | YAML now | Sourced |
| ----------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------- | ----- | -------- | ------- |
| [U3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U3)   | `apa102c`     | Release Year      |       | —        |         |
| [M5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M5)   | `apa105`      | Wattage           | 100   | —        |         |
| [M6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M6)   | `apa106`      | Wattage           | 0     | —        |         |
| [U6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U6)   | `apa106`      | Release Year      |       | —        |         |
| [M8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M8)   | `apa109`      | Wattage           | 0     | —        |         |
| [U9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U9)   | `cs8812`      | Release Year      |       | —        |         |
| [M11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M11) | `hd107s`      | Wattage           | 85    | —        |         |
| [M13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M13) | `lc2823-2020` | Wattage           | 90    | —        |         |
| [U13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U13) | `lc2823-2020` | Release Year      |       | —        |         |
| [U14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U14) | `lc8808b`     | Release Year      |       | —        |         |
| [M15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M15) | `lc8823`      | Wattage           | 85    | —        |         |
| [U15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U15) | `lc8823`      | Release Year      |       | —        |         |
| [M16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M16) | `hd107s`      | Wattage           | 100   | —        |         |
| [M20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M20) | `pl9823`      | Wattage           | 0     | —        |         |
| [O20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O20) | `pl9823`      | Quiescent Current |       | —        |         |
| [M23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M23) | `sk6813`      | Wattage           | 0     | —        |         |
| [U23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U23) | `sk6813`      | Release Year      |       | —        |         |
| [M24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M24) | `sk6813-hv`   | Wattage           | 0     | —        |         |
| [U24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U24) | `sk6813-hv`   | Release Year      |       | —        |         |
| [M25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M25) | `sk6818`      | Wattage           | 0     | —        |         |
| [U25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U25) | `sk6818`      | Release Year      |       | —        |         |
| [M26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M26) | `sk6822`      | Wattage           | 0     | —        |         |
| [U26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U26) | `sk6822`      | Release Year      |       | —        |         |
| [M28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M28) | `sk9822-a`    | Wattage           | 0     | —        |         |
| [N28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=N28) | `sk9822-a`    | Channel Current   |       | —        |         |
| [U28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U28) | `sk9822-a`    | Release Year      |       | —        |         |
| [M30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M30) | `sm16716`     | Wattage           | 0     | —        |         |
| [U30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U30) | `sm16716`     | Release Year      |       | —        |         |
| [M31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M31) | `ws2812`      | Wattage           | 92.5  | —        |         |
| [M32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M32) | `ws2813`      | Wattage           | 90    | —        |         |
| [M34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M34) | `ws2815-rgbw` | Wattage           | 0     | —        |         |
| [U34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U34) | `ws2815-rgbw` | Release Year      |       | —        |         |
| [M36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M36) | `ws2851`      | Wattage           | 92.5  | —        |         |
| [U37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U37) | `(no entry)`  | Release Year      |       | —        |         |
| [M2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M2)   | `apa102`      | Wattage           | 110   | 200mW    | yes     |
| [N2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=N2)   | `apa102`      | Channel Current   | 22    | 22mA     |         |
| [O2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O2)   | `apa102`      | Quiescent Current | 1     | 1mA      |         |
| [U2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U2)   | `apa102`      | Release Year      | 2014  | 2014     |         |
| [M3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M3)   | `apa102c`     | Wattage           | 110   | 200mW    | yes     |
| [N3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=N3)   | `apa102c`     | Channel Current   | 22    | 22mA     |         |
| [O3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O3)   | `apa102c`     | Quiescent Current | 1     | 1mA      |         |
| [M4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M4)   | `apa104`      | Wattage           | 100   | 250mW    | yes     |
| [N4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=N4)   | `apa104`      | Channel Current   | 20    | 20mA     |         |
| [O4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O4)   | `apa104`      | Quiescent Current | 1     | 1mA      |         |
| [U4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U4)   | `apa104`      | Release Year      | 2013  | 2013     |         |
| [U5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U5)   | `apa105`      | Release Year      | 2015  | 2015     |         |
| [M7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M7)   | `apa107`      | Wattage           | 110   | 200mW    | yes     |
| [O7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O7)   | `apa107`      | Quiescent Current | 1     | 1mA      |         |
| [U7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U7)   | `apa107`      | Release Year      | 2017  | 2017     |         |
| [U8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U8)   | `apa109`      | Release Year      | 2018  | 2018     |         |
| [M9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M9)   | `cs8812`      | Wattage           | 210   | 210mW    |         |
| [M10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M10) | `gs8208`      | Wattage           | 120   | 120mW    |         |
| [O10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O10) | `gs8208`      | Quiescent Current | 2.5   | 2.5mA    |         |
| [U10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U10) | `gs8208`      | Release Year      | 2018  | 2018     |         |
| [U11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U11) | `hd107s`      | Release Year      | 2019  | 2017     | yes     |
| [M12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M12) | `hd108`       | Wattage           | 85    | 300mW    | yes     |
| [U12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U12) | `hd108`       | Release Year      |       | 2018     | yes     |
| [M14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M14) | `lc8808b`     | Wattage           | 65    | 156mW    | yes     |
| [U16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U16) | `hd107s`      | Release Year      | 2017  | 2017     | yes     |
| [M17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M17) | `hd108`       | Wattage           | 102   | 300mW    | yes     |
| [O17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O17) | `hd108`       | Quiescent Current | 1     | 0.1mA    |         |
| [U17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U17) | `hd108`       | Release Year      | 2018  | 2018     | yes     |
| [M18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M18) | `ns108e`      | Wattage           | 91.8  | 300mW    | yes     |
| [U18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U18) | `ns108e`      | Release Year      | 2019  | 2019     |         |
| [M19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M19) | `hd8808`      | Wattage           | 45    | 200mW    | yes     |
| [O19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O19) | `hd8808`      | Quiescent Current | 2     | 2mA      |         |
| [U19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U19) | `hd8808`      | Release Year      | 2018  | 2018     |         |
| [S20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S20) | `pl9823`      | Backup Data Line  | No    | false    |         |
| [U20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U20) | `pl9823`      | Release Year      | 2014  | 2014     |         |
| [M21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M21) | `sk6812-wwa`  | Wattage           | 100   | 200mW    | yes     |
| [S21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S21) | `sk6812-wwa`  | Backup Data Line  | No    | false    |         |
| [U21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U21) | `sk6812-wwa`  | Release Year      | 2019  | 2015     | yes     |
| [M22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M22) | `sk6812`      | Wattage           | 104   | 200mW    | yes     |
| [S22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S22) | `sk6812`      | Backup Data Line  | No    | false    |         |
| [U22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U22) | `sk6812`      | Release Year      | 2013  | 2013     |         |
| [S23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S23) | `sk6813`      | Backup Data Line  | No    | true     | yes     |
| [S24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S24) | `sk6813-hv`   | Backup Data Line  | No    | true     | yes     |
| [S25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S25) | `sk6818`      | Backup Data Line  | No    | false    |         |
| [S26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S26) | `sk6822`      | Backup Data Line  | Yes   | true     |         |
| [M27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M27) | `sk9822`      | Wattage           | 100   | 200mW    | yes     |
| [O27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O27) | `sk9822`      | Quiescent Current | 1     | 1mA      |         |
| [S27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S27) | `sk9822`      | Backup Data Line  | No    | false    |         |
| [U27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U27) | `sk9822`      | Release Year      | 2016  | 2016     |         |
| [O28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O28) | `sk9822-a`    | Quiescent Current | 1     | 1mA      |         |
| [S28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S28) | `sk9822-a`    | Backup Data Line  | No    | false    |         |
| [M29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M29) | `sk9826`      | Wattage           | 90    | 300mW    | yes     |
| [U29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U29) | `sk9826`      | Release Year      | 2016  | 2016     |         |
| [O31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=O31) | `ws2812`      | Quiescent Current | 0.7   | 0.7mA    |         |
| [U31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U31) | `ws2812`      | Release Year      | 2012  | 2012     |         |
| [U32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U32) | `ws2813`      | Release Year      | 2016  | 2016     |         |
| [M33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M33) | `ws2815`      | Wattage           | 120   | 120mW    |         |
| [U33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U33) | `ws2815`      | Release Year      | 2018  | 2018     |         |
| [M35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M35) | `ws2816`      | Wattage           | 100   | 100mW    |         |
| [U35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U35) | `ws2816`      | Release Year      | 2021  | 2021     |         |
| [U36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=U36) | `ws2851`      | Release Year      | 2018  | 2018     |         |

</details>

**Needs verification** (#D9D2E9, 15 cells; 0 still empty in YAML)

- Pixel Rate Max: 12 cells; computed by the site, nothing stored

<details><summary>3 cells</summary>

| Cell                                                                                                                    | Entry    | Column          | Sheet | YAML now                                                  | Sourced |
| ----------------------------------------------------------------------------------------------------------------------- | -------- | --------------- | ----- | --------------------------------------------------------- | ------- |
| [G17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=G17) | `hd108`  | Brightness Bits | 16+5  | 16 \| {"bits":5,"method":"current","scope":"per_channel"} | yes     |
| [G18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=G18) | `ns108e` | Brightness Bits | 16+5  | 16 \| {"bits":5,"method":"current","scope":"per_channel"} | yes     |
| [G29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=G29) | `sk9826` | Brightness Bits | 16+5  | 16 \| {"bits":5,"method":"current","scope":"per_channel"} | yes     |

</details>

<details><summary>Acknowledged differences (86)</summary>

- [M2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M2) `apa102` Wattage "110": (cited) YAML cites a source for electrical.wattage
- [T2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=T2) `apa102` Max pixel per string "~250 - CLK sensitive": Same: max_per_string 250 with the clock-degradation explanation
- [M3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M3) `apa102c` Wattage "110": (cited) YAML cites a source for electrical.wattage
- [T3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=T3) `apa102c` Max pixel per string "~250 - CLK sensitive": Same: max_per_string 250 with the clock-degradation explanation
- [Z3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Z3) `apa102c` Other Links "APA102C Pixel Protocol Overview \| Advatek Lighting": Advatek folded APA102C into its APA102 page (the old URL redirects there; YAML links it)
- [M4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M4) `apa104` Wattage "100": (cited) YAML cites a source for electrical.wattage
- [M5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M5) `apa105` Wattage "100": Per-channel VCC x current (the sheet's formula), not the pixel's power; electrical.wattage now holds only makers' whole-pixel figures (database review, plans/database-review-fixes/stream5-parts.yaml)
- [M6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M6) `apa106` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [Y6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y6) `apa106` Datasheet URL "https://datasheet4u.com/datasheet-pdf/ETC/APA-106/pdf.php?i…": A datasheet aggregator page; YAML links a direct datasheet PDF
- [M7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M7) `apa107` Wattage "110": (cited) YAML cites a source for electrical.wattage
- [M8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M8) `apa109` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [G11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=G11) `hd107s` Brightness Bits "5": The sheet gives only the 5-bit global brightness; YAML has 8-bit channels plus a 5-bit global brightness_control
- [M11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M11) `hd107s` Wattage "85": Both the HD107S and NS107S specs give 20 mA per channel ("Build-20ma constant current output"), so 100 mW at 5 V, as the NS107S row says; 17 mA / 85 mW is the HD108 figure
- [V11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=V11) `hd107s` NOTES "APA107 Competitor/clone": Not a clone: Newstar developed the IC (NS107S) and sells it as HD107S (sources.creator)
- [G12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=G12) `hd108` Brightness Bits "15": (cited) YAML cites a source for color.channel_bits
- [M12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M12) `hd108` Wattage "85": (cited) YAML cites a source for electrical.wattage
- [R12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=R12) `hd108` Data Type "APA102": (cited) YAML cites a source for data.type
- [A13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A13) `lc2823-2020` (name) "LC2823-2020": (cited) YAML cites a source for name
- [M13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M13) `lc2823-2020` Wattage "90": Per-channel VCC x current (the sheet's formula), not the pixel's power; electrical.wattage now holds only makers' whole-pixel figures (database review, plans/database-review-fixes/stream5-parts.yaml)
- [M14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M14) `lc8808b` Wattage "65": (cited) YAML cites a source for electrical.wattage
- [M15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M15) `lc8823` Wattage "85": Per-channel VCC x current (the sheet's formula), not the pixel's power; electrical.wattage now holds only makers' whole-pixel figures (database review, plans/database-review-fixes/stream5-parts.yaml)
- [H16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=H16) `hd107s` Data BitRate "30000000": Row pairs with pixels/hd107s. Newstar's NS107S spec says 30 MHz, Rose Lighting's HD107S spec 40 MHz; the LED keeps 40 MHz (30 MHz in datasheet.discrepancies), and pixel-ics/ns107s carries Newstar's 3…
- [K16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=K16) `hd107s` GPIO Min "3.5": Row pairs with pixels/hd107s, which keeps the HD107S row's 3.4 V (neither spec gives an input-high level)
- [L16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=L16) `hd107s` GPIO Max "5.3": Row pairs with pixels/hd107s, which keeps the HD107S row's 5 V (neither spec gives an input-high level)
- [V16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=V16) `hd107s` NOTES "upgrade of APA107, same protocol with APA102, higher PWM 27…": Row pairs with pixels/hd107s; its notes and related links (predecessor APA107, compatible with APA102) say the same
- [Y16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y16) `hd107s` Datasheet URL "http://www.newstar-ledstrip.com/product/20190710114547839.p…": Dead now; YAML links the current page
- [B17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=B17) `hd108` Colour Group "BGR": Row pairs with pixels/hd108. Newstar's NS108 spec sends red, green, then blue (16 bits each), so RGB, as the HD108 row says
- [E17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=E17) `hd108` VCC Voltage "5.1": Row pairs with pixels/hd108, which keeps Rose Lighting's figures; Newstar's 5.1 V (max 5.5 V) is in datasheet.discrepancies
- [H17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=H17) `hd108` Data BitRate "30000000": (cited) YAML cites a source for data.bitrate
- [L17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=L17) `hd108` GPIO Max "5.6": Row pairs with pixels/hd108, which keeps Rose Lighting's figures (input high 3.4-5.3 V); Newstar's are in datasheet.discrepancies
- [M17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M17) `hd108` Wattage "102": Row pairs with pixels/hd108, which keeps Rose Lighting's 17 mA typical (85 mW); Newstar's figures are in datasheet.discrepancies
- [R17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=R17) `hd108` Data Type "APA102": (cited) YAML cites a source for data.type
- [V17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=V17) `hd108` NOTES "16bit/color version of NS107S": Row pairs with pixels/hd108; its notes and related link (predecessor HD107S) say the same
- [Y17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y17) `hd108` Datasheet URL "http://newstar-ledstrip.com/productshow848.html": The sheet linked the NS108E's page (gone); YAML links the NS108's own datasheet
- [M18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M18) `ns108e` Wattage "91.8": (cited) YAML cites a source for electrical.wattage
- [R19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=R19) `hd8808` Data Type "UCS1903": (cited) YAML cites a source for data.type
- [V19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=V19) `hd8808` NOTES "silimar to ws2815, but UCS1903 protocol": Typo fixed in YAML
- [M20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M20) `pl9823` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [P20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=P20) `pl9823` Package Size "5/8mm T style": Packages standardized (0bb3346): 5/8 mm "T style" = 5mm and 8mm through-hole
- [W20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=W20) `pl9823` 3rd Party Testing "https://cpldcpu.wordpress.com/2014/06/16/timing-of-ws2812-c…": Old URL; it redirects to the page YAML links
- [Y20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y20) `pl9823` Datasheet URL "https://cdn.instructables.com/ORIG/FW0/YN1X/IHDUL683/FW0YN1…": Instructables moved its CDN (cdn -> content.instructables.com, 2be3f66)
- [B21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=B21) `sk6812-wwa` Colour Group "CW,WW,Amber": The three dies are in the notes (cool white, warm white, amber); the datasheet doesn't give their byte order
- [F21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=F21) `sk6812-wwa` PWM Frequency "1100": Datasheets (rev 01 and 03) say 1.2 kHz
- [M21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M21) `sk6812-wwa` Wattage "100": Datasheet rating: 0.2 W
- [N21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=N21) `sk6812-wwa` Channel Current "20": The rev 03 datasheet specifies the 12 mA current version
- [V21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=V21) `sk6812-wwa` NOTES "replaces RGB LEDs with CW, WW, Amber for variable CCT": Same, in more detail
- [B22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=B22) `sk6812` Colour Group "GRB & GRBW": The RGBW version is its own entry (pixels/sk6812-rgbw)
- [M22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M22) `sk6812` Wattage "104": (cited) YAML cites a source for electrical.wattage
- [V22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=V22) `sk6812` NOTES "WS2812 copy also available in 4 channel RGBW variant": Same; the RGBW version is its own entry (pixels/sk6812-rgbw)
- [M23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M23) `sk6813` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [S23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S23) `sk6813` Backup Data Line "No": (cited) YAML cites a source for data.backup_line
- [M24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M24) `sk6813-hv` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [S24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=S24) `sk6813-hv` Backup Data Line "No": (cited) YAML cites a source for data.backup_line
- [M25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M25) `sk6818` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [M26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M26) `sk6822` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [M27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M27) `sk9822` Wattage "100": (cited) YAML cites a source for electrical.wattage
- [W27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=W27) `sk9822` 3rd Party Testing "https://cpldcpu.wordpress.com/2016/12/13/sk9822-a-clone-of-…": Old URL; it redirects to the page YAML links
- [M28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M28) `sk9822-a` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [M29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M29) `sk9826` Wattage "90": (cited) YAML cites a source for electrical.wattage
- [A30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A30) `sm16716` (name) "SM1616": No such part: the row links the SM16716 datasheet, so it maps to that pixel IC (aliases.ts)
- [M30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M30) `sm16716` Wattage "0": 0 is a placeholder
- [M31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M31) `ws2812` Wattage "92.5": Per-channel VCC x current (the sheet's formula), not the pixel's power; electrical.wattage now holds only makers' whole-pixel figures (database review, plans/database-review-fixes/stream5-parts.yaml)
- [M32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M32) `ws2813` Wattage "90": Per-channel VCC x current (the sheet's formula), not the pixel's power; electrical.wattage now holds only makers' whole-pixel figures (database review, plans/database-review-fixes/stream5-parts.yaml)
- [Y32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y32) `ws2813` Datasheet URL "http://newstar-ledstrip.com/product/20171208112004735.pdf": Dead now; YAML links the current page
- [Y33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y33) `ws2815` Datasheet URL "http://newstar-ledstrip.com/product/20180125101420006.pdf": Dead now; YAML links the current page
- [M34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M34) `ws2815-rgbw` Wattage "0": Formula artifact: Wattage = VCC x current computed 0 from empty inputs
- [P35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=P35) `ws2816` Package Size "7": Sheet error: "7" in Package Size
- [M36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=M36) `ws2851` Wattage "92.5": Per-channel VCC x current (the sheet's formula), not the pixel's power; electrical.wattage now holds only makers' whole-pixel figures (database review, plans/database-review-fixes/stream5-parts.yaml)
- [Z3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Z3) `apa102c` Other Links "APA102C Pixel Protocol Overview \| Advatek Lighting": Advatek folded APA102C into its APA102 page (the old URL redirects there; YAML links it)
- [A6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A6) `apa106` (name) "APA106": A datasheet aggregator page; YAML links a direct datasheet PDF
- [Y6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y6) `apa106` Datasheet URL "https://datasheet4u.com/datasheet-pdf/ETC/APA-106/pdf.php?i…": A datasheet aggregator page; YAML links a direct datasheet PDF
- [A16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A16) `hd107s` (name) "NS107S": Dead now; YAML links the current page
- [Y16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y16) `hd107s` Datasheet URL "http://www.newstar-ledstrip.com/product/20190710114547839.p…": Dead now; YAML links the current page
- [Y17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y17) `hd108` Datasheet URL "http://newstar-ledstrip.com/productshow848.html": The sheet linked the NS108E's page (gone); YAML links the NS108's own datasheet
- [A20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A20) `pl9823` (name) "PL9823": Instructables moved its CDN (cdn -> content.instructables.com, 2be3f66)
- [W20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=W20) `pl9823` 3rd Party Testing "https://cpldcpu.wordpress.com/2014/06/16/timing-of-ws2812-c…": Old URL; it redirects to the page YAML links
- [Y20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y20) `pl9823` Datasheet URL "https://cdn.instructables.com/ORIG/FW0/YN1X/IHDUL683/FW0YN1…": Instructables moved its CDN (cdn -> content.instructables.com, 2be3f66)
- [A21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A21) `sk6812-wwa` (name) "SK6812": Hida's page now shows its RGB LC8812B; Hida's WWA clones are in aliases
- [W27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=W27) `sk9822` 3rd Party Testing "https://cpldcpu.wordpress.com/2016/12/13/sk9822-a-clone-of-…": Old URL; it redirects to the page YAML links
- [A30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A30) `sm16716` (name) "SM1616": SM1616 is a typo for SM16716 (pixel-ics/sm16716); the row's only content is that chip's datasheet (merge flagged in ISSUES.md)
- [Y32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y32) `ws2813` Datasheet URL "http://newstar-ledstrip.com/product/20171208112004735.pdf": Dead now; YAML links the current page
- [Y33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=Y33) `ws2815` Datasheet URL "http://newstar-ledstrip.com/product/20180125101420006.pdf": Dead now; YAML links the current page
- [A35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=A35) `ws2816` (name) "WS2816": LCSC moved the datasheet; YAML has the current URL
- [F7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=F7) `apa107` PWM Frequency "9000": Kept as a doubt in color.pwm_frequency_notes, with what the datasheet does say (oscillator 800-1200 kHz)
- [N21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=N21) `sk6812-wwa` Channel Current "20": The rev 03 datasheet specifies 12 mA; the 0.2 W package rating is in wattage
- [F22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=755169190&range=F22) `sk6812` PWM Frequency "1100": (cited) YAML cites a source for color.pwm_frequency

</details>

## Pixel ICs

Database folder: `database/pixel-ics/`.

<details><summary>Column mapping</summary>

| Col | Sheet header         | YAML field(s)                                      | Compared as                                                                                                   | Note                                                          |
| --- | -------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| A   | (name)               | `name`                                             | text                                                                                                          |                                                               |
| B   | PWM Frequency        | `color.pwm_frequency`                              | number (frequency)                                                                                            |                                                               |
| C   | Channels             | `data.channels`                                    | number                                                                                                        |                                                               |
| D   | Channel Bits         | `color.channel_bits`                               | number                                                                                                        |                                                               |
| E   | Aggregate Bits       | `color.channel_bits`, `color.channel_bits_notes`   | number                                                                                                        |                                                               |
| F   | Clocked              | `data.clocked`                                     | bool                                                                                                          |                                                               |
| G   | Data BitRate         | `data.bitrate`                                     | number (frequency)                                                                                            |                                                               |
| H   | Pixel Data Size      | `data.pixel_size_bits`                             | number                                                                                                        |                                                               |
| I   | Pixel Rate Max       | —                                                  | derived: Computed (bitrate / pixel size); the site derives it at render time (a1cd65f stripped stored copies) |                                                               |
| J   | Output Voltage       | `electrical.output_voltage`                        | number (voltage)                                                                                              |                                                               |
| K   | Supply Voltage       | `electrical.supply_voltage`                        | number (voltage)                                                                                              |                                                               |
| L   | GPIO Min             | `electrical.gpio.min`                              | number (voltage)                                                                                              |                                                               |
| M   | GPIO Max             | `electrical.gpio.max`                              | number (voltage)                                                                                              |                                                               |
| N   | Max Current          | `electrical.max_current`                           | number (current)                                                                                              |                                                               |
| O   | Quiescent Current    | `electrical.quiescent_current`                     | number (current)                                                                                              |                                                               |
| P   | Package Size         | `physical.packages`                                | text                                                                                                          | Standardized package list (0bb3346)                           |
| Q   | Pin Count            | `physical.packages`                                | custom                                                                                                        | Pin counts now come from the package names (SOP8, QFN16, ...) |
| R   | Data Type            | `data.type`                                        | text                                                                                                          |                                                               |
| S   | Backup Data Line     | `data.backup_line`                                 | bool                                                                                                          |                                                               |
| T   | Max pixel per string | `data.max_per_string`, `data.max_per_string_notes` | text                                                                                                          |                                                               |
| U   | Release Year         | `release_year`                                     | number                                                                                                        |                                                               |
| V   | NOTES                | `notes`, `technical_notes`                         | text                                                                                                          |                                                               |
| W   | 3rd Party Testing    | `datasheet.third_party_testing`                    | url                                                                                                           |                                                               |
| X   | Datasheet URL        | `datasheet.url`, `datasheet.sources[].url`         | url                                                                                                           |                                                               |
| Y   | Other Links          | `other_links`                                      | url                                                                                                           | Cell text is the linked page title; the hyperlink is the data |

</details>

### Rows paired by alias, URL, or as duplicates

- [A32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=A32) "UCS2904" → `pixel-ics/sm16704` (url, score 0.92)

### YAML entries with no sheet row

- `pixel-ics/d705` "D705": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/dm412` "DM412": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/fw1906` "FW1906": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ge1603` "GE1603": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/icnd2110` "ICND2110": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/ink1003` "INK1003": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/lb1908` "LB1908": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/ld1510` "LD1510": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/lpd1886` "LPD1886": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/lpd8803` "LPD8803": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/mbi6023` "MBI6023": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/mbi6024` "MBI6024": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/mbi6120` "MBI6120": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/ns107s` "NS107S": added 2026-11-20 in b4dc749 (data: NS107S/NS108/NS8808 are pixel ICs; HD107S/HD108/HD8808 the LEDs)
- `pixel-ics/ns108` "NS108": added 2026-11-20 in b4dc749 (data: NS107S/NS108/NS8808 are pixel ICs; HD107S/HD108/HD8808 the LEDs)
- `pixel-ics/ns8808` "NS8808": added 2026-11-20 in b4dc749 (data: NS107S/NS108/NS8808 are pixel ICs; HD107S/HD108/HD8808 the LEDs)
- `pixel-ics/p9883` "P9883": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/sk6805` "SK6805": added 2026-07-01 in b3b1e7a (data: add SK6805 pixel IC)
- `pixel-ics/sm16711` "SM16711": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/sm16714` "SM16714": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/sm16726` "SM16726": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/sm16803` "SM16803": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/sm16804` "SM16804": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/sm16824e` "SM16824E": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/tm1812` "TM1812": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/tm1824` "TM1824": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/tm1903` "TM1903": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/tm1913` "TM1913": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/tm1934` "TM1934": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs1909` "UCS1909": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs1912` "UCS1912": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs2603` "UCS2603": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/ucs2909` "UCS2909": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs2912` "UCS2912": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs5603` "UCS5603": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs6909` "UCS6909": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs7604` "UCS7604": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ucs7804` "UCS7804": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ws2803` "WS2803": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ws2808` "WS2808": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)
- `pixel-ics/ws2818` "WS2818": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ws2818a` "WS2818A": added 2026-11-18 in 9ec5afe (data(pixel-ics, pixels): 27 parts controllers list by name, from their makers' documents)
- `pixel-ics/ws2821` "WS2821": added 2026-11-18 in fa24de9 (data(pixel-ics, pixels): 22 more parts controllers list, from their makers' documents)

### Highlighted cells

**Needs verification** (#D9D2E9, 45 cells; 0 still empty in YAML)

- Pixel Rate Max: 41 cells; computed by the site, nothing stored

<details><summary>4 cells</summary>

| Cell                                                                                                                    | Entry     | Column         | Sheet | YAML now | Sourced |
| ----------------------------------------------------------------------------------------------------------------------- | --------- | -------------- | ----- | -------- | ------- |
| [D12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=D12) | `p9813`   | Channel Bits   | 8     | 8        | yes     |
| [E12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=E12) | `p9813`   | Aggregate Bits | 8     | 8        | yes     |
| [D13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=D13) | `qed3001` | Channel Bits   | 12    | 12       | yes     |
| [E13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=E13) | `qed3001` | Aggregate Bits |       | 12       | yes     |

</details>

**Missing data, easy to fill** (#FFF2CC, 32 cells; 22 still empty in YAML)

<details><summary>32 cells</summary>

| Cell                                                                                                                    | Entry         | Column            | Sheet      | YAML now   | Sourced |
| ----------------------------------------------------------------------------------------------------------------------- | ------------- | ----------------- | ---------- | ---------- | ------- |
| [N2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=N2)   | `dmx512`      | Max Current       |            | —          |         |
| [O2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O2)   | `dmx512`      | Quiescent Current |            | —          |         |
| [U2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U2)   | `dmx512`      | Release Year      |            | —          |         |
| [N3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=N3)   | `gs8202`      | Max Current       |            | —          |         |
| [O3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O3)   | `gs8202`      | Quiescent Current |            | —          |         |
| [U3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U3)   | `gs8202`      | Release Year      |            | —          |         |
| [N4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=N4)   | `gs8206`      | Max Current       |            | —          |         |
| [O4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O4)   | `gs8206`      | Quiescent Current |            | —          |         |
| [U4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U4)   | `gs8206`      | Release Year      |            | —          |         |
| [N5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=N5)   | `gs8208`      | Max Current       |            | —          |         |
| [O5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O5)   | `gs8208`      | Quiescent Current |            | —          |         |
| [U5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U5)   | `gs8208`      | Release Year      |            | —          |         |
| [O6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O6)   | `lpd6803`     | Quiescent Current |            | —          |         |
| [U6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U6)   | `lpd6803`     | Release Year      |            | —          |         |
| [O7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O7)   | `lpd8806`     | Quiescent Current |            | —          |         |
| [U13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U13) | `qed3001`     | Release Year      |            | —          |         |
| [U22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U22) | `tm1803`      | Release Year      |            | —          |         |
| [U23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U23) | `tm1804`      | Release Year      |            | —          |         |
| [O40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O40) | `ws2811-v1-4` | Quiescent Current |            | —          |         |
| [U40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U40) | `ws2811-v1-4` | Release Year      |            | —          |         |
| [O41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O41) | `ws2814`      | Quiescent Current |            | —          |         |
| [U41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U41) | `ws2814`      | Release Year      |            | —          |         |
| [N6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=N6)   | `lpd6803`     | Max Current       | 45         | 45mA       |         |
| [N7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=N7)   | `lpd8806`     | Max Current       | 20         | 20mA       |         |
| [U7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U7)   | `lpd8806`     | Release Year      | 2011       | 2011       |         |
| [U12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U12) | `p9813`       | Release Year      | 2010       | 2010       |         |
| [O37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O37) | `ws2801`      | Quiescent Current | 1.5        | 1.5mA      |         |
| [P37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=P37) | `ws2801`      | Package Size      | SO14/DIP14 | ["SOP-14"] |         |
| [S37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=S37) | `ws2801`      | Backup Data Line  | No         | false      |         |
| [U37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U37) | `ws2801`      | Release Year      | 2010       | 2008       | yes     |
| [O39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=O39) | `ws2811`      | Quiescent Current | 0.7        | 0.7mA      |         |
| [U39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U39) | `ws2811`      | Release Year      | 2011       | 2011       |         |

</details>

<details><summary>Acknowledged differences (24)</summary>

- [Y3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=Y3) `gs8202` Other Links "GS8202 Pixel Protocol Overview \| Advatek Lighting": Advatek merged GS8202 into its GS8208 page (the old URL redirects there; YAML links it)
- [P7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=P7) `lpd8806` Package Size "SOP16/QFN16": Packages checked against the datasheets (7b66e88)
- [C9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=C9) `my9221` Channels "3": (cited) YAML cites a source for data.channels
- [G12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=G12) `p9813` Data BitRate "20000000": (cited) YAML cites a source for data.bitrate
- [C16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=C16) `sm16511` Channels "4": (cited) YAML cites a source for data.channels
- [P16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=P16) `sm16511` Package Size "SOP10/SOP16": (cited) YAML cites a source for physical.packages
- [Q16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=Q16) `sm16511` Pin Count "10/16": (cited) YAML cites a source for physical.packages
- [B23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=B23) `tm1804` PWM Frequency "285.7142857": 1/0.0035 s = 285.714 Hz; 285.7Hz is the honest precision
- [X23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=X23) `tm1804` Datasheet URL "http://www.ledlightmake.com/ledlightmake_serv/TM1804%20Data…": Another copy of the datasheet; YAML links LCSC's (datasheet pass)
- [B30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=B30) `ucs2903` PWM Frequency "1600": (cited) YAML cites a source for color.pwm_frequency
- [A32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=A32) `sm16704` (name) "UCS2904": Row 32 is SM16704 data under the UCS2904 name (matches Sunmoon's datasheet; links Advatek's SM16704 page)
- [J32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=J32) `sm16704` Output Voltage "30": 30 V is the absolute maximum (in output_voltage_notes); 26 V is the rated output
- [C36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=C36) `ucs9812` Channels "3": (cited) YAML cites a source for data.channels
- [P37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=P37) `ws2801` Package Size "SO14/DIP14": Packages checked against the datasheets (7b66e88)
- [U37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=U37) `ws2801` Release Year "2010": (cited) YAML cites a source for release_year
- [X37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=X37) `ws2801` Datasheet URL "https://www.futurlec.com/Others/WS2801.shtml": Futurlec's datasheet page; YAML links WorldSemi's own PDF
- [P39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=P39) `ws2811` Package Size "SOIC8/DIP8": (cited) YAML cites a source for physical.packages
- [Y3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=Y3) `gs8202` Other Links "GS8202 Pixel Protocol Overview \| Advatek Lighting": Advatek merged GS8202 into its GS8208 page (the old URL redirects there; YAML links it)
- [A23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=A23) `tm1804` (name) "TM1804": Another copy of the datasheet; YAML links LCSC's (datasheet pass)
- [X23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=X23) `tm1804` Datasheet URL "http://www.ledlightmake.com/ledlightmake_serv/TM1804%20Data…": Another copy of the datasheet; YAML links LCSC's (datasheet pass)
- [A32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=A32) `sm16704` (name) "UCS2904": Greeled's UCS2904 strip page, cited in pixel-ics/ucs2904 (this row is SM16704 data)
- [A37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=A37) `ws2801` (name) "WS2801": Futurlec's datasheet page; YAML links WorldSemi's own PDF
- [X37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=X37) `ws2801` Datasheet URL "https://www.futurlec.com/Others/WS2801.shtml": Futurlec's datasheet page; YAML links WorldSemi's own PDF
- [H10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=795156605&range=H10) `my9231` Pixel Data Size "": Migrated as a technical note (pixel data size is variable); the TODO was sheet housekeeping

</details>

## Pixel Decoders

Database folder: `database/pixel-decoders/`.

<details><summary>Column mapping</summary>

| Col | Sheet header                        | YAML field(s)                                | Compared as | Note                                                                                                                         |
| --- | ----------------------------------- | -------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| A   | (name)                              | `name`                                       | text        |                                                                                                                              |
| B   | Manufacturer/Designer               | `creator`, `manufacturers`                   | text        |                                                                                                                              |
| C   | Max Channels                        | `outputs.count`                              | number      |                                                                                                                              |
| D   | Pixel Types                         | `inputs.protocols`, `outputs.types`, `notes` | text        | Free-text description of what the decoder does; structured as inputs.protocols + outputs.types (64a0d09), the prose in notes |
| E   | Unit Price (USD)                    | `price`                                      | price       |                                                                                                                              |
| F   | Output Connectors                   | `outputs.connector`, (derived)               | custom      |                                                                                                                              |
| G   | Outputs                             | `outputs.types`                              | enum        |                                                                                                                              |
| H   | DIY/OTS                             | `diy_or_ots`                                 | text        |                                                                                                                              |
| I   | Notes                               | `notes`                                      | text        |                                                                                                                              |
| J   | Product URL                         | `links.product`                              | text        | One cell lists two URLs                                                                                                      |
| K   | (K, no header)                      | `notes`                                      | text        |                                                                                                                              |
| L   | (L, no header: shifted DIY/OTS)     | `diy_or_ots`                                 | text        |                                                                                                                              |
| M   | (M, no header: shifted Notes)       | `notes`                                      | text        |                                                                                                                              |
| N   | (N, no header: shifted Product URL) | `links.product`                              | url         |                                                                                                                              |

</details>

Header problems:

- E1 reads "Unit Price (USD)", expected "Unit Price"

### Rows paired by alias, URL, or as duplicates

- [A3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=A3) "Baldrick DMX" → `controllers/baldrick-dmx` (alias, score 0.5)
- [A7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=A7) "Pixel 2 Things Relay" → `pixel-decoders/pixel-2-things-relay` (alias, score 0.67)
- [A12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=A12) "WS2811 MosFet Driver" → `pixel-decoders/ws2811-ws2812-extender` (url, score 0.83)

### YAML entries with no sheet row

- `pixel-decoders/f-test` "F-Test": added 2026-11-18 in 3c1f084 (data: F-Test is a pixel tester/decoder, not a controller)

### Highlighted cells

**Pasted formatting, no meaning** (#E8F0FE, 14 cells; 0 still empty in YAML)

<details><summary>14 cells</summary>

| Cell                                                                                                                     | Entry                | Column                         | Sheet                                    | YAML now                                                       | Sourced |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------- | ------------------------------ | ---------------------------------------- | -------------------------------------------------------------- | ------- |
| [A11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=A11) | `quinled-dig2analog` | (name)                         | QuinLED Dig2Analog                       | QuinLED Dig2Analog                                             |         |
| [B11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=B11) | `quinled-dig2analog` | Manufacturer/Designer          | Quindor / Intermittent Technology        | Quindor / Intermittent Technology                              |         |
| [C11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=C11) | `quinled-dig2analog` | Max Channels                   | 4                                        | 4                                                              |         |
| [D11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=D11) | `quinled-dig2analog` | Pixel Types                    | ws2814 to RGBW PWM Mosfet output         | ["WS2814F","ws28xx"] \| ["pwm"] \| WS2814 to RGBW PWM MOSFET … | yes     |
| [E11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E11) | `quinled-dig2analog` | Unit Price (USD)               | 7.49                                     | 7.49                                                           |         |
| [F11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=F11) | `quinled-dig2analog` | Output Connectors              | Screw Terminals                          | Screw terminal                                                 |         |
| [G11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=G11) | `quinled-dig2analog` | Outputs                        | PWM                                      | ["pwm"]                                                        |         |
| [H11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=H11) | `quinled-dig2analog` | DIY/OTS                        | OTS                                      | OTS                                                            |         |
| [I11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=I11) | `quinled-dig2analog` | Notes                          | 4x 2kHz PWM output, 3A fuse, Daisy chai… | WS2814 to RGBW PWM MOSFET outputs. 4x 2kHz PWM output, 3A f…   |         |
| [J11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=J11) | `quinled-dig2analog` | Product URL                    | https://quinled.info/quinled-dig2analog/ | https://quinled.info/quinled-dig2analog/                       |         |
| [K11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=K11) | `quinled-dig2analog` | (K, no header)                 |                                          | WS2814 to RGBW PWM MOSFET outputs. 4x 2kHz PWM output, 3A f…   |         |
| [L11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=L11) | `quinled-dig2analog` | (L, no header: shifted DIY/OT… |                                          | OTS                                                            |         |
| [M11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=M11) | `quinled-dig2analog` | (M, no header: shifted Notes)  |                                          | WS2814 to RGBW PWM MOSFET outputs. 4x 2kHz PWM output, 3A f…   |         |
| [N11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=N11) | `quinled-dig2analog` | (N, no header: shifted Produc… |                                          | https://quinled.info/quinled-dig2analog/                       |         |

</details>

<details><summary>Acknowledged differences (32)</summary>

- [D2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=D2) `attiny10` Pixel Types "allows driving 3-wire clockless leds with 4-wire clocked pr…": Same, as inputs.protocols/outputs.types plus notes (64a0d09)
- [E2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E2) `attiny10` Unit Price (USD) "1": YAML price verified with a source since the import (1d45f70 and earlier)
- [C3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=C3) `baldrick-dmx` Max Channels "512": Baldrick DMX lives in controllers (04a47e8); checked there
- [D3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=D3) `baldrick-dmx` Pixel Types "WS28XX data to DMX 512": Baldrick DMX lives in controllers (04a47e8); checked there
- [E3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E3) `baldrick-dmx` Unit Price (USD) "75": (cited) re-priced at the source (retrieved 2026-11-18)
- [H3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=H3) `baldrick-dmx` DIY/OTS "OTS": Baldrick DMX lives in controllers (04a47e8); checked there
- [J3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=J3) `baldrick-dmx` Product URL "https://baldrickboard.com/docs/category/baldrickdmx": Baldrick DMX lives in controllers (04a47e8); checked there
- [E4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E4) `controller-changeover` Unit Price (USD) "12": YAML price verified with a source since the import (1d45f70 and earlier)
- [D5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=D5) `neopixelbooster` Pixel Types "Inline 5V buck convertor": Same, as inputs.protocols/outputs.types plus notes (64a0d09)
- [E6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E6) `pixel-2-dmx` Unit Price (USD) "40": YAML price verified with a source since the import (1d45f70 and earlier)
- [D7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=D7) `pixel-2-things-relay` Pixel Types "Converts pixel data into relay drivers capable of switching…": (cited) YAML cites a source for inputs.protocols
- [E7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E7) `pixel-2-things-relay` Unit Price (USD) "99": YAML price verified with a source since the import (1d45f70 and earlier)
- [G7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=G7) `pixel-2-things-relay` Outputs "Relay": (cited) YAML cites a source for outputs.types
- [I7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=I7) `pixel-2-things-relay` Notes "WSXX to 9 Relay ouput card": Reworded in YAML
- [E8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E8) `pixel-2-things-servo` Unit Price (USD) "99.99": YAML price verified with a source since the import (1d45f70 and earlier)
- [G10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=G10) `pixfog-pixel-based-fog-controller` Outputs "Pixel Data": This sheet row's cells are shifted three columns right; values checked against the right columns
- [H10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=H10) `pixfog-pixel-based-fog-controller` DIY/OTS "33": This sheet row's cells are shifted three columns right; values checked against the right columns
- [I10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=I10) `pixfog-pixel-based-fog-controller` Notes "Phoenix Screw": This sheet row's cells are shifted three columns right; values checked against the right columns
- [A12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=A12) `ws2811-ws2812-extender` (name) "WS2811 MosFet Driver": The seller's listing name (EagleDecorations on Tindie)
- [D12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=D12) `ws2811-ws2812-extender` Pixel Types "WS2811 to High current Mosfet": Same in structured form: WS2811/WS2812 in, PWM out (notes: high-current outputs)
- [E12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E12) `ws2811-ws2812-extender` Unit Price (USD) "10": Last list price $14 (sold out); $10 was the 2019 price (in price_source)
- [E13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E13) `ws2811-mosfet-driver` Unit Price (USD) "18": YAML price verified with a source since the import (1d45f70 and earlier)
- [C14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=C14) `ws2811-mosfetdriver` Max Channels "3": (cited) YAML cites a source for outputs.count
- [E14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E14) `ws2811-mosfetdriver` Unit Price (USD) "4": YAML price verified with a source since the import (1d45f70 and earlier)
- [D15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=D15) `led-strip-driver-module` Pixel Types "WS2811 to High current Mosfet": (cited) YAML cites a source for inputs.protocols
- [E15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=E15) `led-strip-driver-module` Unit Price (USD) "1": YAML price verified with a source since the import (1d45f70 and earlier)
- [J15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=J15) `led-strip-driver-module` Product URL "https://de.aliexpress.com/item/32786272573.html?spm=a2g0o.p…": Same product; YAML has the current URL without tracking parameters
- [A2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=A2) `attiny10` (name) "ATtiny10": Same article; YAML has its full URL
- [J2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=J2) `attiny10` Product URL "https://sites.google.com/site/wayneholder/besting-ben-heck,…": Same article; YAML has its full URL
- [A3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=A3) `baldrick-dmx` (name) "Baldrick DMX": Baldrick DMX lives in controllers (04a47e8); checked there
- [J3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=J3) `baldrick-dmx` Product URL "https://baldrickboard.com/docs/category/baldrickdmx": Baldrick DMX lives in controllers (04a47e8); checked there
- [J6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1520623513&range=J6) `pixel-2-dmx` Product URL "https://experiencelights.com/pixel2dmx---realtime-dmx-bridg…": Same product; YAML has the current URL without tracking parameters

</details>

## Level Converters

Database folder: `database/level-converters/`.

<details><summary>Column mapping</summary>

| Col | Sheet header | YAML field(s)                                         | Compared as      | Note |
| --- | ------------ | ----------------------------------------------------- | ---------------- | ---- |
| A   | (name)       | `name`                                                | text             |      |
| B   | Manufacturer | `creator`, `manufacturers`                            | text             |      |
| C   | Channels     | `io.channels`                                         | number           |      |
| D   | Interface    | `physical.packages`, `io.differential`                | custom           |      |
| E   | Notes        | `notes`                                               | text             |      |
| F   | Price        | `price`, `price[]`                                    | price            |      |
| G   | Max Voltage  | `electrical.max_voltage`, `electrical.supply_voltage` | number (voltage) |      |
| H   | Max Current  | `electrical.output_current`                           | number (current) |      |
| I   | Buffered     | `io.buffered`                                         | bool             |      |
| J   | Product URL  | `links.product`                                       | url              |      |

</details>

### YAML entries with no sheet row

- `level-converters/max3485` "MAX3485": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `level-converters/sn74hct125` "SN74HCT125": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `level-converters/sn74hct245` "SN74HCT245": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `level-converters/txb0104` "TXB0104": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)

<details><summary>Acknowledged differences (5)</summary>

- [D4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1484346977&range=D4) `sn74ahct125n` Interface "Through-Hole DIP": (cited) YAML cites a source for physical.packages
- [F4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1484346977&range=F4) `sn74ahct125n` Price "0.75": YAML has distributor price tiers verified since the import
- [G8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1484346977&range=G8) `sn74lv1t34dbvrg4` Max Voltage "7V": (cited) YAML cites a source for electrical.max_voltage
- [D9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1484346977&range=D9) `74hct244` Interface "PDIP largest": (cited) YAML cites a source for physical.packages
- [H11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1484346977&range=H11) `74hc245` Max Current "8mA": (cited) YAML cites a source for electrical.output_current

</details>

## Adapters

Database folder: `database/adapters/`.

<details><summary>Column mapping</summary>

| Col | Sheet header          | YAML field(s)                               | Compared as      | Note                                                                       |
| --- | --------------------- | ------------------------------------------- | ---------------- | -------------------------------------------------------------------------- |
| A   | (name)                | `name`                                      | text             |                                                                            |
| B   | Manufacturer/Designer | `creator`, `manufacturers`                  | text             |                                                                            |
| C   | Max Channels          | `outputs.count`                             | number           |                                                                            |
| D   | Pixel Types           | `outputs.clocked`                           | custom           | Single / Clocked / both -> outputs.clocked; other text is compared as text |
| E   | Max Voltage           | `power.voltage.max`                         | number (voltage) |                                                                            |
| F   | Max LED Current       | `power.current.max`, `outputs.current.max`  | number (current) |                                                                            |
| G   | Parent                | `parent`                                    | text             |                                                                            |
| H   | Unit Price (USD)      | `price`                                     | price            |                                                                            |
| I   | Output Connectors     | `outputs.connector`, (derived)              | custom           |                                                                            |
| J   | (J, no header)        | `outputs.differential`, `power.voltage.max` | text             | Stray values (F40D-B "Differential", Pi Hat 12)                            |
| K   | Outputs               | `outputs.clocked`                           | custom           |                                                                            |
| L   | DIY/OTS               | `diy_or_ots`                                | text             |                                                                            |
| M   | Notes                 | `notes`                                     | text             |                                                                            |
| N   | Product URL           | `links.product`                             | url              |                                                                            |
| O   | (O, no header)        | `links.product`                             | url              | One stray URL                                                              |

</details>

Header problems:

- H1 reads "Unit Price (USD)", expected "Unit Price"

### Rows paired by alias, URL, or as duplicates

- [A4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A4) "DuotrigesimalWS28111" → `adapters/duotrigesimalws28111` (url, score 0.9)
- [A6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A6) "Serial LED Driver" → `controllers/electromage-8x-driver` (alias, score 0.55)
- [A7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A7) "Pro Serial LED Driver" → `controllers/electromage-pro-8x-driver` (alias, score 0.55)
- [A23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A23) "F40D-B" → `controllers/k40d-pb` (alias, score 0.78)
- [A24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A24) "EspArtStick WLED" → `controllers/espartstick` (url, score 0.5)
- [A25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A25) "M4 Port Pixel" → `controllers/m4-port-pixel` (alias, score 0.4)
- [A26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A26) "M8 Port Pixel" → `controllers/m8-port-pixel` (alias, score 0.5)
- [A27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A27) "Pi Hat" → `adapters/pi-hat` (url, score 0.73)
- [A33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A33) "QuinLED-Dig-Uno" → `controllers/quinled-dig-uno` (alias, score 0.58)
- [A34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A34) "QuinLED-Dig-Quad" → `controllers/quinled-dig-quad` (alias, score 0.58)
- [A40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A40) "4 Channel Differntial Transmitter" → `adapters/4-channel-differential-transmitter` (alias, score 0.7)
- [A41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A41) "Meanwell PDU with Differential Reciever" → `adapters/meanwell-pdu-with-differential-receiver` (alias, score 0.8)
- [A46](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A46) "QuinLED-Dig-Uno" → `controllers/quinled-dig-uno` (alias, score 0.43)

<details><summary>Acknowledged differences (81)</summary>

- [D3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=D3) `rasppi-isolated-dmx` Pixel Types "Allows easy control of DMX-512 devices from Pi": A description in the Pixel Types column; the entry's notes say it
- [E5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=E5) `pixelpops` Max Voltage "5": (cited) YAML cites a source for power.voltage.max
- [G6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G6) `electromage-8x-driver` Parent "Any UART / Serial": Merged into controllers/electromage-8x-driver (database review); its serial input is in inputs, and controllers have no parent field
- [H6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H6) `electromage-8x-driver` Unit Price (USD) "15": (cited) re-priced at the source (retrieved 2026-11-18)
- [L6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=L6) `electromage-8x-driver` DIY/OTS "OTS": Merged into controllers/electromage-8x-driver (database review); controllers are all off the shelf, with no DIY/OTS field
- [H7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H7) `electromage-pro-8x-driver` Unit Price (USD) "49": (cited) re-priced at the source (retrieved 2026-11-18)
- [L7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=L7) `electromage-pro-8x-driver` DIY/OTS "OTS": Merged into controllers/electromage-pro-8x-driver (database review); controllers are all off the shelf, with no DIY/OTS field
- [N7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N7) `electromage-pro-8x-driver` Product URL "https://www.tindie.com/products/electromage/electromage-pro…": Tindie renamed the listing; vendors (Tindie) has the current page
- [G8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G8) `4x-led-mini-shield` Parent "Wemos Dx Mini (ESP32/ESP8266)": (cited) YAML cites a source for parent
- [H8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H8) `4x-led-mini-shield` Unit Price (USD) "5": (cited) re-priced at the source (retrieved 2026-11-18)
- [H9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H9) `8x-led-shield` Unit Price (USD) "7": (cited) re-priced at the source (retrieved 2026-11-18)
- [G10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G10) `6x-led-shield` Parent "Wemos Dx Mini (ESP32/ESP8266)": (cited) YAML cites a source for parent
- [H10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H10) `6x-led-shield` Unit Price (USD) "8": (cited) re-priced at the source (retrieved 2026-11-18)
- [H11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H11) `16x-led-shield` Unit Price (USD) "9": (cited) re-priced at the source (retrieved 2026-11-18)
- [G12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G12) `6x-smd-led-shield` Parent "Wemos Dx Mini (ESP32/ESP8266)": (cited) YAML cites a source for parent
- [C13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C13) `sp901e-pixel-data-distributor` Max Channels "8": (cited) YAML cites a source for outputs.count
- [G13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G13) `sp901e-pixel-data-distributor` Parent "8 Ch Pixel data distribution": A description in the Parent column; it has no host board
- [H13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H13) `sp901e-pixel-data-distributor` Unit Price (USD) "22": (cited) re-priced at the source (retrieved 2026-11-18)
- [M13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=M13) `sp901e-pixel-data-distributor` Notes "Pixel data duplicated to 8 output channels": (cited) YAML cites a source for notes
- [B14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=B14) `rpi-28d` Manufacturer/Designer "Hanson Electroncs": Typo fixed in YAML
- [H14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H14) `rpi-28d` Unit Price (USD) "21.85": (cited) re-priced at the source (retrieved 2026-11-18)
- [D17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=D17) `artgateone` Pixel Types "1 Universe Artnet to DMX Node": A description in the Pixel Types column; the entry is the Art-Net to DMX node
- [H19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H19) `pocketscroller-v2` Unit Price (USD) "51": (cited) re-priced at the source (retrieved 2026-11-18)
- [H21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H21) `f8-pb` Unit Price (USD) "81": (cited) re-priced at the source (retrieved 2022-01-23)
- [H22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H22) `f32-b` Unit Price (USD) "95": (cited) re-priced at the source (retrieved 2022-01-23)
- [G23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G23) `k40d-pb` Parent "BeagleBone": F40D-B = the K40D-PB under its pre-K-series name; merged into controllers/k40d-pb (a61acdb)
- [N23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N23) `k40d-pb` Product URL "https://kulplights.com/product/f40d-pb/": F40D-B = the K40D-PB under its pre-K-series name; merged into controllers/k40d-pb (a61acdb)
- [C24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C24) `espartstick` Max Channels "6": (cited) YAML cites a source for outputs.count
- [F24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=F24) `espartstick` Max LED Current "15": No published current rating (stream 2's research, 2a3efbf)
- [G24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G24) `espartstick` Parent "Wemos D1 Mini (ESP32/ESP8266)": Merged into controllers/espartstick (2a3efbf): a Wemos D1 Mini (ESP8266) shield, in its notes; ESP8266 only
- [H24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H24) `espartstick` Unit Price (USD) "24": (cited) re-priced at the source (retrieved 2025-06)
- [I24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=I24) `espartstick` Output Connectors "Phoenix Screw": Same: a plug-in screw terminal block
- [L24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=L24) `espartstick` DIY/OTS "DIY": Microcyb sold it assembled (stream 2's research); merged into controllers/espartstick
- [C25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C25) `m4-port-pixel` Max Channels "37": Sheet error: the M4-PI has 4 outputs (merged into controllers/m4-port-pixel)
- [G25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G25) `m4-port-pixel` Parent "Raspberry Pi 3B+ or above": Same, as inputs.requires_host (merged into controllers/m4-port-pixel)
- [H25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H25) `m4-port-pixel` Unit Price (USD) "35": (cited) re-priced at the source (retrieved 2024-05-19)
- [L25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=L25) `m4-port-pixel` DIY/OTS "DIY": Merged into controllers/m4-port-pixel, which has no DIY/OTS field (sold assembled)
- [C26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C26) `m8-port-pixel` Max Channels "75": Sheet error: the M8-PI has 8 outputs (merged into controllers/m8-port-pixel)
- [H26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H26) `m8-port-pixel` Unit Price (USD) "45": (cited) re-priced at the source (retrieved 2025-06-21)
- [L26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=L26) `m8-port-pixel` DIY/OTS "DIY": Merged into controllers/m8-port-pixel, which has no DIY/OTS field (sold assembled)
- [H27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H27) `pi-hat` Unit Price (USD) "22": (cited) re-priced at the source (retrieved 2025-07-16)
- [I27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=I27) `pi-hat` Output Connectors "Both": Not a connector (a stray "Both")
- [N27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N27) `pi-hat` Product URL "Multiple": Stray value in the sheet (no header / not a URL)
- [H28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H28) `wemos-esp32-driver-board` Unit Price (USD) "9": (cited) re-priced at the source (retrieved 2025-12-23)
- [D29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=D29) `wemos-pwm-rgb-w-led-driver-board` Pixel Types "Fet power output": Same: MOSFET PWM outputs (notes, outputs.auxiliary PWM)
- [H29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H29) `wemos-pwm-rgb-w-led-driver-board` Unit Price (USD) "12": (cited) re-priced at the source (retrieved 2026-02-08)
- [G30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G30) `plasma-2040` Parent "Rpi 2040": The RP2040 is on the board; it has no host board
- [G33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G33) `quinled-dig-uno` Parent "ESP8266 or ESP32": The current board runs on QuinLED's ESP32 top board (core.family ESP32)
- [H33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H33) `quinled-dig-uno` Unit Price (USD) "24.99": YAML price revised by research since the import
- [L33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=L33) `quinled-dig-uno` DIY/OTS "Both": Same: features "Available as DIY kit or pre-assembled"
- [H34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H34) `quinled-dig-quad` Unit Price (USD) "37.5": (cited) re-priced at the source (retrieved 2026-11-18)
- [L34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=L34) `quinled-dig-quad` DIY/OTS "Both": Same: features "Available as DIY kit or pre-assembled" (merged into controllers/quinled-dig-quad)
- [N34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N34) `quinled-dig-quad` Product URL "https://quinled.info/quinled-dig-uno/": Sheet error: the Dig-Quad row's Product URL is the Dig-Uno page; fixed in YAML (703a4a2)
- [C35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C35) `wled-wemos-shield` Max Channels "2": (cited) YAML cites a source for outputs.count
- [H37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H37) `esp32-thingplus-dmx-to-led` Unit Price (USD) "20": (cited) re-priced at the source (retrieved 2026-11-18)
- [A40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A40) `4-channel-differential-transmitter` (name) "4 Channel Differntial Transmitter": Typo fixed in YAML
- [H40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H40) `4-channel-differential-transmitter` Unit Price (USD) "15": (cited) re-priced at the source (retrieved 2026-11-18)
- [M40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=M40) `4-channel-differential-transmitter` Notes "4 Channel differntial transmitter output to RJ45 fir connec…": Typo fixed in YAML
- [A41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A41) `meanwell-pdu-with-differential-receiver` (name) "Meanwell PDU with Differential Reciever": Typo fixed in YAML
- [E41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=E41) `meanwell-pdu-with-differential-receiver` Max Voltage "12": Maker: 5 V or 12-24 V, set by jumper (wizardofwire's page)
- [H41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H41) `meanwell-pdu-with-differential-receiver` Unit Price (USD) "18": YAML price verified since the import
- [C43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C43) `esp-pixnode` Max Channels "6": (cited) YAML cites a source for outputs.count
- [H43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H43) `esp-pixnode` Unit Price (USD) "13": (cited) re-priced at the source (retrieved 2021-01-23)
- [C44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C44) `espartstick` Max Channels "6": (cited) YAML cites a source for outputs.count
- [G44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G44) `espartstick` Parent "Wemos Dx Mini (ESP32/ESP8266)": ESP8266 only (stream 2's research, 2a3efbf)
- [H44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H44) `espartstick` Unit Price (USD) "25": (cited) re-priced at the source (retrieved 2021-08-03)
- [C45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=C45) `espixelstick` Max Channels "4": (cited) YAML cites a source for outputs.count
- [H45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=H45) `espixelstick` Unit Price (USD) "30": (cited) re-priced at the source (retrieved 2026-11-18)
- [G46](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=G46) `quinled-dig-uno` Parent "Wemos Dx Mini (ESP32/ESP8266)": The 2018 DIY board took a Wemos D1/D32 Mini; merged into controllers/quinled-dig-uno (now an ESP32 board)
- [I46](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=I46) `quinled-dig-uno` Output Connectors "Phoniex Screw": Typo fixed in YAML (Phoenix Screw)
- [N46](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N46) `quinled-dig-uno` Product URL "https://quinled.info/2018/10/12/quinled-dig-uno-hardware-gu…": Old URL; it redirects to the page YAML links
- [B48](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=B48) `pixellauncher-gen-2-micro` Manufacturer/Designer "Digital Ambience": (cited) YAML cites a source for creator
- [A6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A6) `electromage-8x-driver` (name) "Serial LED Driver": bhencke.com now redirects to the ElectroMage docs page in other_links
- [A7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A7) `electromage-pro-8x-driver` (name) "Pro Serial LED Driver": bhencke.com now redirects to the ElectroMage docs page in other_links
- [N7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N7) `electromage-pro-8x-driver` Product URL "https://www.tindie.com/products/electromage/electromage-pro…": Tindie renamed the listing; vendors (Tindie) has the current page
- [A23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A23) `k40d-pb` (name) "F40D-B": F40D-B = the K40D-PB under its pre-K-series name; merged into controllers/k40d-pb (a61acdb)
- [N23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N23) `k40d-pb` Product URL "https://kulplights.com/product/f40d-pb/": F40D-B = the K40D-PB under its pre-K-series name; merged into controllers/k40d-pb (a61acdb)
- [N34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N34) `quinled-dig-quad` Product URL "https://quinled.info/quinled-dig-uno/": Sheet error: the Dig-Quad row's Product URL is the Dig-Uno page; fixed in YAML (703a4a2)
- [A46](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A46) `quinled-dig-uno` (name) "QuinLED-Dig-Uno": Old URL; it redirects to the page YAML links
- [N46](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=N46) `quinled-dig-uno` Product URL "https://quinled.info/2018/10/12/quinled-dig-uno-hardware-gu…": Old URL; it redirects to the page YAML links
- [A48](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=866679715&range=A48) `pixellauncher-gen-2-micro` (name) "PixelLauncher Gen 2 Micro": Dead series page; the product page (archived) is in YAML

</details>

## DIY MicroBoards

Database folder: `database/microboards/`.

<details><summary>Column mapping</summary>

| Col | Sheet header          | YAML field(s)                                     | Compared as        | Note |
| --- | --------------------- | ------------------------------------------------- | ------------------ | ---- |
| A   | (name)                | `name`                                            | text               |      |
| B   | Manufacturer          | `creator`, `manufacturers`                        | text               |      |
| C   | SoC                   | `compute.soc`                                     | text               |      |
| D   | CPU                   | `compute.cpu`                                     | text               |      |
| E   | ISA                   | `compute.isa`                                     | text               |      |
| F   | Clock Speed           | `compute.clock_speed`                             | number (frequency) |      |
| G   | Flash                 | `compute.flash`                                   | text               |      |
| H   | RAM                   | `compute.ram`                                     | text               |      |
| I   | Linux                 | `compute.linux`                                   | bool               |      |
| J   | Max outputs           | `io.max_outputs`                                  | number             |      |
| K   | Minimum Input Voltage | `power.voltage.min`                               | number (voltage)   |      |
| L   | Max Input Voltage     | `power.voltage.max`                               | number (voltage)   |      |
| M   | GPIO Voltage          | `power.gpio_voltage`                              | number (voltage)   |      |
| N   | USB                   | `connectivity.usb`                                | bool               |      |
| O   | TTL Serial            | `connectivity.serial`                             | bool               |      |
| P   | Wi-Fi                 | `connectivity.wifi`                               | bool               |      |
| Q   | PoE                   | `connectivity.poe`                                | bool               |      |
| R   | Ethernet              | `connectivity.ethernet`                           | bool               |      |
| S   | Bluetooth             | `connectivity.bluetooth`                          | bool               |      |
| T   | Storage               | `io.storage`                                      | bool               |      |
| U   | BMS                   | `io.bms`                                          | bool               |      |
| V   | IMU                   | `io.imu`                                          | bool               |      |
| W   | Unit Price (USD)      | `price`                                           | price              |      |
| X   | Release Year          | `release_year`                                    | number             |      |
| Y   | Product URL           | `creator.page`, `vendors[].url`, `vendors[].page` | url                |      |
| Z   | Notes                 | `notes`                                           | text               |      |

</details>

Header problems:

- W1 reads "Unit Price (USD)", expected "Unit Price"

### Rows paired by alias, URL, or as duplicates

- [A3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A3) "NRF 52840 Feather" → `microboards/nrf-52840-feather` (url, score 0.87)
- [A10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A10) "Ebyte NRF 52840" → `microboards/ebyte-nrf-52840` (alias, score 0.63)
- [A36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A36) "Orange Pi LTS" → `microboards/orange-pi-lts` (url, score 0.71)

### YAML entries with no sheet row

- `microboards/beaglebone-green` "BeagleBone Green": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `microboards/orange-pi-zero` "Orange Pi Zero": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `microboards/pocketbeagle-2` "PocketBeagle 2": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `microboards/raspberry-pi-5` "Raspberry Pi 5": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `microboards/raspberry-pi-zero-2-w` "Raspberry Pi Zero 2 W": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `microboards/wemos-d1-mini-pro` "Wemos D1 Mini Pro": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `microboards/wemos-d1-mini` "Wemos D1 Mini": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)

<details><summary>Acknowledged differences (91)</summary>

- [W2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W2) `trinket-m0` Unit Price (USD) "8.95": (cited) re-priced at the source (retrieved 2026-11-18)
- [V3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=V3) `nrf-52840-feather` IMU "Wing": Same in stream 2's typed microboard vocabulary (475d1d0): "Wing" is an add-on
- [W3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W3) `nrf-52840-feather` Unit Price (USD) "25": (cited) re-priced at the source (retrieved 2026-11-18)
- [V4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=V4) `feather-m0-wifi` IMU "Wing": Same in stream 2's typed microboard vocabulary (475d1d0): "Wing" is an add-on
- [W5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W5) `arduino-mega-2560-rev3` Unit Price (USD) "40.3": (cited) re-priced at the source (retrieved 2026-11-18)
- [Y5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y5) `arduino-mega-2560-rev3` Product URL "https://store-usa.arduino.cc/collections/boards/products/ar…": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [E6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=E6) `arduino-micro` ISA "AVR5": Same in stream 2's typed microboard vocabulary (475d1d0): AVR5 is AVR
- [Y6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y6) `arduino-micro` Product URL "https://store.arduino.cc/usa/arduino-micro": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [E7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=E7) `attiny85` ISA "AVR2.5": Same in stream 2's typed microboard vocabulary (475d1d0): AVR2.5 is AVR
- [F7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=F7) `attiny85` Clock Speed "16": (cited) YAML cites a source for compute.clock_speed
- [W7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W7) `attiny85` Unit Price (USD) "1": (cited) re-priced at the source (retrieved 2026-11-18)
- [Y7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y7) `attiny85` Product URL "https://www.microchip.com/wwwproducts/en/ATtiny85": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [Y8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y8) `pocketbeagle` Product URL "http://beagleboard.org/pocket": Old URL; it redirects to the page YAML links
- [G9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=G9) `beaglebone-black` Flash "4GBeMMC/microSD": Same in stream 2's typed microboard vocabulary (475d1d0): 4 GB eMMC flash; microSD is storage
- [W9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W9) `beaglebone-black` Unit Price (USD) "50": (cited) re-priced at the source (retrieved 2026-03-10)
- [Y9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y9) `beaglebone-black` Product URL "http://beagleboard.org/black": Old URL; it redirects to the page YAML links
- [A10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A10) `ebyte-nrf-52840` (name) "Ebyte NRF 52840": (cited) YAML cites a source for name
- [W10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W10) `ebyte-nrf-52840` Unit Price (USD) "10": (cited) re-priced at the source (retrieved 2026-11-18)
- [X10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=X10) `ebyte-nrf-52840` Release Year "2021": (cited) YAML cites a source for release_year
- [Y10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y10) `ebyte-nrf-52840` Product URL "https://www.ebyte.com/en/new-view-info.aspx?id=378": Ebyte's old site; YAML links its current product page (cdebyte.com)
- [D11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=D11) `t-eth-lite` CPU "Xtensa LX6": (cited) YAML cites a source for compute.cpu
- [S11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=S11) `t-eth-lite` Bluetooth "4.1": (cited) YAML cites a source for connectivity.bluetooth
- [W11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W11) `t-eth-lite` Unit Price (USD) "15": (cited) re-priced at the source (retrieved 2026-11-18)
- [N12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N12) `ttgo-esp32-poe` USB "Power + UART": (cited) YAML cites a source for connectivity.usb
- [W12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W12) `ttgo-esp32-poe` Unit Price (USD) "16": (cited) re-priced at the source (retrieved 2026-11-18)
- [Y12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y12) `ttgo-esp32-poe` Product URL "http://www.lilygo.cn/prod_view.aspx?TypeId=50033&Id=1307&FI…": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [N13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N13) `nodemcu-v2` USB "No": The sheet's "No" meant no native USB; the micro-USB is a USB-UART bridge, recorded as "Power + UART" like the other such boards
- [S13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=S13) `nodemcu-v2` Bluetooth "4.1": (cited) YAML cites a source for connectivity.bluetooth
- [S14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=S14) `esp-32s` Bluetooth "4.1": (cited) YAML cites a source for connectivity.bluetooth
- [W15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W15) `esp32-poe` Unit Price (USD) "25": (cited) re-priced at the source (retrieved 2026-11-18)
- [T16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=T16) `teensy-lc` Storage "Shield": Same in stream 2's typed microboard vocabulary (475d1d0): "Shield" is an add-on
- [W16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W16) `teensy-lc` Unit Price (USD) "11.65": (cited) re-priced at the source (retrieved 2026-11-18)
- [E17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=E17) `teensy-2-0` ISA "AVR5": (cited) YAML cites a source for compute.isa
- [T17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=T17) `teensy-2-0` Storage "Shield": Same in stream 2's typed microboard vocabulary (475d1d0): "Shield" is an add-on
- [P18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=P18) `teensy-3-2` Wi-Fi "Shield": Same in stream 2's typed microboard vocabulary (475d1d0): "Shield" is an add-on
- [T18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=T18) `teensy-3-2` Storage "Shield": Same in stream 2's typed microboard vocabulary (475d1d0): "Shield" is an add-on
- [W18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W18) `teensy-3-2` Unit Price (USD) "19.8": (cited) re-priced at the source (retrieved 2025-11-08)
- [G19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=G19) `teensy-4-0` Flash "2048kB": (cited) YAML cites a source for compute.flash
- [W19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W19) `teensy-4-0` Unit Price (USD) "19.95": (cited) re-priced at the source (retrieved 2026-11-18)
- [E20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=E20) `teensy-plus-plus-2-0` ISA "AVR5": Same in stream 2's typed microboard vocabulary (475d1d0): AVR5 is AVR
- [T20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=T20) `teensy-plus-plus-2-0` Storage "Shield": Same in stream 2's typed microboard vocabulary (475d1d0): "Shield" is an add-on
- [P21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=P21) `teensy-3-5` Wi-Fi "Shield": Same in stream 2's typed microboard vocabulary (475d1d0): "Shield" is an add-on
- [P22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=P22) `teensy-3-6` Wi-Fi "Shield": Same in stream 2's typed microboard vocabulary (475d1d0): "Shield" is an add-on
- [W25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W25) `raspberry-pi-zero-v1-3` Unit Price (USD) "5": (cited) re-priced at the source (retrieved 2026-11-18)
- [W26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W26) `raspberry-pi-zero-w` Unit Price (USD) "10": (cited) re-priced at the source (retrieved 2026-11-18)
- [N28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N28) `raspberry-pi-1-model-b` USB "OTG x4": (cited) YAML cites a source for connectivity.usb
- [W28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W28) `raspberry-pi-1-model-b` Unit Price (USD) "25": (cited) re-priced at the source (retrieved 2026-11-18)
- [N30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N30) `raspberry-pi-2-model-b` USB "OTG x4": (cited) YAML cites a source for connectivity.usb
- [N31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N31) `raspberry-pi-2-model-b-v1-2` USB "OTG x4": (cited) YAML cites a source for connectivity.usb
- [N32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N32) `raspberry-pi-3-model-b` USB "OTG x4": (cited) YAML cites a source for connectivity.usb
- [S32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=S32) `raspberry-pi-3-model-b` Bluetooth "4.0": Bluetooth 4.1 per the launch post
- [F33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=F33) `raspberry-pi-4-model-b` Clock Speed "1500": (cited) YAML cites a source for compute.clock_speed
- [N33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N33) `raspberry-pi-4-model-b` USB "OTG x2, 3.0 x2": (cited) YAML cites a source for connectivity.usb
- [R33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=R33) `raspberry-pi-4-model-b` Ethernet "Gigabit": Same in stream 2's typed microboard vocabulary (475d1d0): Gigabit is 1000BASE-T
- [N34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N34) `raspberry-pi-3-model-b-plus` USB "OTG x4": (cited) YAML cites a source for connectivity.usb
- [G35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=G35) `wt32-eth01` Flash "32Mbit": Same in stream 2's typed microboard vocabulary (475d1d0): 32 Mbit is 4 MB
- [W35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W35) `wt32-eth01` Unit Price (USD) "7": (cited) re-priced at the source (retrieved 2026-11-18)
- [C36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=C36) `orange-pi-lts` SoC "Allwinner H2+": (cited) YAML cites a source for compute.soc
- [H36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=H36) `orange-pi-lts` RAM "256MB+": Same in stream 2's typed microboard vocabulary (475d1d0): 256MB (the "+" was a note)
- [P36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=P36) `orange-pi-lts` Wi-Fi "2.4GHz & 5GHz": (cited) YAML cites a source for connectivity.wifi
- [W36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W36) `orange-pi-lts` Unit Price (USD) "8.5": (cited) re-priced at the source (retrieved 2026-11-18)
- [P37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=P37) `orange-pi-pc-plus` Wi-Fi "2.4GHz & 5GHz": (cited) YAML cites a source for connectivity.wifi
- [S38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=S38) `esp-01` Bluetooth "4.1": (cited) YAML cites a source for connectivity.bluetooth
- [Y38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y38) `esp-01` Product URL "https://www.electroschematics.com/the-mighty-esp-01-adapter/": Electroschematics moved to edn.com; YAML has the new URL in other_links
- [W39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=W39) `esp32-s3-eth` Unit Price (USD) "17": (cited) re-priced at the source (retrieved 2026-11-18)
- [Y39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y39) `esp32-s3-eth` Product URL "https://www.waveshare.com/product/arduino/boards-kits/esp32…": Waveshare moved the page; YAML has the current URL
- [Z39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Z39) `esp32-s3-eth` Notes "PoE sield available": Typo fixed in YAML
- [A5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A5) `arduino-mega-2560-rev3` (name) "Arduino Mega 2560 Rev3": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [Y5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y5) `arduino-mega-2560-rev3` Product URL "https://store-usa.arduino.cc/collections/boards/products/ar…": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [A6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A6) `arduino-micro` (name) "Arduino Micro": Same Arduino store page
- [Y6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y6) `arduino-micro` Product URL "https://store.arduino.cc/usa/arduino-micro": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [A7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A7) `attiny85` (name) "ATtiny85": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [Y7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y7) `attiny85` Product URL "https://www.microchip.com/wwwproducts/en/ATtiny85": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [A8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A8) `pocketbeagle` (name) "PocketBeagle": Old URL; it redirects to the page YAML links
- [Y8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y8) `pocketbeagle` Product URL "http://beagleboard.org/pocket": Old URL; it redirects to the page YAML links
- [A9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A9) `beaglebone-black` (name) "Beaglebone Black": Old URL; it redirects to the page YAML links
- [Y9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y9) `beaglebone-black` Product URL "http://beagleboard.org/black": Old URL; it redirects to the page YAML links
- [Y10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y10) `ebyte-nrf-52840` Product URL "https://www.ebyte.com/en/new-view-info.aspx?id=378": Ebyte's old site; YAML links its current product page (cdebyte.com)
- [A12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A12) `ttgo-esp32-poe` (name) "TTGo ESP32 PoE": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [B12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=B12) `ttgo-esp32-poe` Manufacturer "Lilygo": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [D12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=D12) `ttgo-esp32-poe` CPU "Xtensa LX6": Generic reference link (Wikipedia: Xtensa LX6) on the CPU cell, not entry data
- [Y12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y12) `ttgo-esp32-poe` Product URL "http://www.lilygo.cn/prod_view.aspx?TypeId=50033&Id=1307&FI…": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [D14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=D14) `esp-32s` CPU "Xtensa LX6": Generic reference link (Wikipedia: Xtensa LX6) on the CPU cell, not entry data
- [D15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=D15) `esp32-poe` CPU "Xtensa LX6": Generic reference link (Wikipedia: Xtensa LX6) on the CPU cell, not entry data
- [D35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=D35) `wt32-eth01` CPU "Xtensa LX6": Generic reference link (Wikipedia: Xtensa LX6) on the CPU cell, not entry data
- [A38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A38) `esp-01` (name) "ESP-01": Electroschematics moved to edn.com; YAML has the new URL in other_links
- [Y38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y38) `esp-01` Product URL "https://www.electroschematics.com/the-mighty-esp-01-adapter/": Electroschematics moved to edn.com; YAML has the new URL in other_links
- [A39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=A39) `esp32-s3-eth` (name) "ESP32-S3 ETH": Waveshare moved the page; YAML has the current URL
- [Y39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=Y39) `esp32-s3-eth` Product URL "https://www.waveshare.com/product/arduino/boards-kits/esp32…": Waveshare moved the page; YAML has the current URL
- [N12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=N12) `ttgo-esp32-poe` USB "Power + UART": (cited) YAML cites a source for connectivity.usb
- [G19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1497158237&range=G19) `teensy-4-0` Flash "2048kB": (cited) YAML cites a source for compute.flash

</details>

## Connectors

Database folder: `database/connectors/`.

<details><summary>Column mapping</summary>

| Col | Sheet header    | YAML field(s)                                                | Compared as      | Note                                          |
| --- | --------------- | ------------------------------------------------------------ | ---------------- | --------------------------------------------- |
| A   | Picture         | `name`                                                       | text             | Name column; its hyperlink is the picture URL |
| B   | Manufacturer    | `creator`, `manufacturers`                                   | text             |                                               |
| C   | Link            | `links.product`                                              | url              |                                               |
| D   | Outline         | `mechanical.outline`                                         | text             |                                               |
| E   | Max Current     | `ratings.max_current`, `ratings.max_current_notes`           | number (current) |                                               |
| F   | Max Voltage     | `ratings.max_voltage`                                        | number (voltage) |                                               |
| G   | IP Rating       | `ratings.ip_rating`, `ratings.ip_rating_notes`               | bool             |                                               |
| H   | Locking         | `mechanical.locking`                                         | text             |                                               |
| I   | Panelmount      | `mechanical.panel_mount`                                     | bool             |                                               |
| J   | Wire -To -Wire  | `mechanical.wire_to_wire`                                    | bool             |                                               |
| K   | PCB mount       | `mechanical.pcb_mount`                                       | bool             |                                               |
| L   | Smallest Guage  | `termination.smallest_gauge`                                 | text             |                                               |
| M   | Largest Guage   | `termination.largest_gauge`                                  | text             |                                               |
| N   | Pitch           | `mechanical.pitch`                                           | number           |                                               |
| O   | Contact Type    | `mechanical.contact_type`                                    | text             |                                               |
| P   | Solder?         | `termination.solder`                                         | bool             |                                               |
| Q   | Screw Terminal? | `termination.screw_terminal`                                 | bool             |                                               |
| R   | Crimp?          | `termination.crimp`                                          | bool             |                                               |
| S   | IDC?            | `termination.idc`                                            | bool             |                                               |
| T   | Board Fingers   | `mechanical.board_fingers`                                   | bool             |                                               |
| U   | Gendered        | `mechanical.gendered`                                        | bool             |                                               |
| V   | Min Pins        | `mechanical.min_pins`                                        | number           |                                               |
| W   | Max Pins        | `mechanical.max_pins`                                        | number           |                                               |
| X   | Rows            | `mechanical.rows`                                            | text             |                                               |
| Y   | Year Intoduced  | `year_introduced`                                            | number           |                                               |
| Z   | End of Life     | `status`                                                     | text             | Empty in the sheet                            |
| AA  | Pinout          | `wiring.pinout`                                              | text             |                                               |
| AB  | Convention      | `wiring.convention`                                          | text             |                                               |
| AC  | Colors          | `wiring.colors`                                              | text             |                                               |
| AD  | Digikey         | `links.digikey`                                              | url              |                                               |
| AE  | Mouser          | `links.mouser`                                               | url              |                                               |
| AF  | Notes           | `notes`, `technical_notes`, `common_applications`, `aliases` | text             |                                               |

</details>

### Rows paired by alias, URL, or as duplicates

- [A21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A21) "Mini Bucaneer" → `connectors/mini-bucaneer` (url, score 1)
- [A25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A25) "MTSB CombiCon" → `connectors/mtsb-combicon` (url, score 0.92)

### YAML entries with no sheet row

- `connectors/pcb-screw-terminal-block` "PCB Screw Terminal Block": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `connectors/rj45` "RJ45 (8P8C)": added 2026-06-14 in c4c67d3 (data: add RJ45 (8P8C) connector)
- `connectors/xconnect` "xConnect": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `connectors/xlr-4` "XLR 4": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)

### Hyperlinks not in YAML

- [A2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A2) `dupont` Picture: <https://gree-leds.com/web/userfiles/product/big/dupontwire5.jpg> (lost in CSV conversion)
- [A3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A3) `sh` Picture: <https://www.sconect.com/wp-content/uploads/2016/12/JST-SH-connector.jpg?x78740> (lost in CSV conversion)
- [A4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A4) `d-c-barrel` Picture: <https://showmecables-static.scdn3.secure.raxcdn.com/media/catalog/product/cache/0aa466c0d56d23d446bcd4aa4538d2f7/d/c/dc-power-connector-2.1mm-id-5.5mm-od-1.jpg> (lost in CSV conversion)
- [A5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A5) `ph` Picture: <https://www.pcboard.ca/image/cache/catalog/products/connectors/jst/jst-ph-3pin/3-pin-mini-micro-jst-ph-2.0-connector-set-05-800x800.jpg> (lost in CSV conversion)
- [A6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A6) `picoblade` Picture: <https://www.molex.com/product/picoblade.html> (lost in CSV conversion)
- [A7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A7) `xh` Picture: <https://www.pcboard.ca/image/cache/catalog/products/connectors/jst/jst-xh-2pin/JST-HS254-2-Pin-Connector-Set-800x800.jpg> (lost in CSV conversion)
- [A8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A8) `sm` Picture: <https://www.nooelec.com/store/media/catalog/product/cache/1/image/1200x/040ec09b1e35df139433887a97daa66f/4/_/4_jst_sm_1g_1.jpg> (lost in CSV conversion)
- [A9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A9) `df62w` Picture: <https://www.hirose.com/medias/pic_DF62W.jpg?context=bWFzdGVyfHByaXZhdGVfc3lzX3VwbG9hZHwxMTQ0MDZ8aW1hZ2UvanBlZ3xzeXMtbWFzdGVyL3ByaXZhdGVfc3lzX3VwbG9hZC9oMmUvaGI4LzkxNzE2ODU1MDcxMDIvcGljX0RGNjJXLmpwZ3wwM2E0YjY0ZTE0Y2E1MDg5OTZlNzFlOTNmOGEzMmM2MjJlNzhhMGRhNzU0M2I2ZDNhMWFmNjgyOTAxYjQ3M2Fj> (lost in CSV conversion)
- [A10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A10) `m12` Picture: <https://www.luetze.com/fileadmin/asim-override/productimages/490017.jpg> (lost in CSV conversion)
- [A11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A11) `molex-kk-aka-kf2510` Picture: <https://www.scondar.com/wp-content/uploads/2017/03/Molex-2510-connector.jpg> (lost in CSV conversion)
- [A12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A12) `rean-rt4` Picture: <https://audioverse.de/wp-content/uploads/2019/12/20210518_024114-scaled-e1621305305706.jpg> (lost in CSV conversion)
- [A13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A13) `pigtails` Picture: <https://ae01.alicdn.com/kf/Hf7499517300649b2b1673811e583c1811/Pigtails-3-Pin-Black-8-in-10-Pairs.jpg> (lost in CSV conversion)
- [A14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A14) `binder-720` Picture: <https://www.ferroberlin.de/images/product_images/info_images/491130305_2.png> (lost in CSV conversion)
- [A15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A15) `sp13` Picture: <https://ae01.alicdn.com/kf/HTB1seoERXXXXXXoXXXXq6xXFXXX8/Original-Weipu-Connector-SP13-IP68-Connector-2-3-4-5-6-7-9-Pin-Cable-Plug.jpg> (lost in CSV conversion)
- [A16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A16) `9159` Picture: <https://www.avx.com/en/wp-content/uploads/L3-4-product-images/70-9159.jpg> (lost in CSV conversion)
- [A17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A17) `bulgin-disco-8-pole` Picture: <https://2.bp.blogspot.com/-Vm_SLnI2YWo/VzJst0pIwlI/AAAAAAAAGvY/5v-wclgkoRowcCxZb7bDx_m5e2AP8wRVgCLcB/s1600/Bulgin.png> (lost in CSV conversion)
- [A18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A18) `gx-16` Picture: <https://www.sunelectronics.co.in/image/cache/catalog/Image/8%20pin%20shell%20connector1-500x500.jpg> (lost in CSV conversion)
- [A19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A19) `xlr-5` Picture: <http://media.guitarcenter.com/is/image/MMGS7/5-Pin-Male--Female-XLR-Connectors/331775000000000-00-500x500.jpg> (lost in CSV conversion)
- [A20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A20) `ld16-20-28` Picture: <https://ae01.alicdn.com/kf/S6c802c2558d94b65a26e1828ba63fbe7W/LD16-welding-free-aviation-plug-socket-IP68-waterproof-connector-2-3-4-core-screw-wiring-male.jpg_Q90.jpg_.webp> (lost in CSV conversion)
- [A21](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A21) `mini-bucaneer` Picture: <https://complete-electronics.com/media/wysiwyg/Bulgin_mini_1.jpg> (lost in CSV conversion)
- [A22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A22) `sp17` Picture: <http://leaka.com.cn/u_file/1901/products/17/853ce279ee.jpg.500x500.jpg> (lost in CSV conversion)
- [A23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A23) `chogori-standard-size` Picture: <https://www.wagneronline.com.au/prodimages/section7_images/chogori_images_1024/22003231-01.jpg> (lost in CSV conversion)
- [A24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A24) `vh-r` Picture: <https://www.master-instruments.com.au/image/61242/1/Master-CE-VHR-2N.jpg> (lost in CSV conversion)
- [A25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A25) `mtsb-combicon` Picture: <https://media.rs-online.com/t_large/F1896026-01.jpg> (lost in CSV conversion)
- [A26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A26) `deutsch-dt` Picture: <https://www.boataccessoriesaustralia.com.au/assets/full/P-1030927.jpg?20200605105831> (lost in CSV conversion)
- [A27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A27) `en3` Picture: <https://www.newark.com/productimages/large/en_US/90T0630-40.jpg> (lost in CSV conversion)
- [A28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A28) `mini-fit-jr` Picture: <https://www.scondar.com/wp-content/uploads/2017/03/Molex-5557-5559-connector.jpg> (lost in CSV conversion)
- [A29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A29) `superseal` Picture: <https://www.hall-fast.com/media/catalog/product/cache/1/image/1200x1200/9df78eab33525d08d6e5fb8d27136e95/s/s/ssc4f.png> (lost in CSV conversion)
- [A30](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A30) `xlr-3` Picture: <https://images-na.ssl-images-amazon.com/images/I/71cquRpIeiL._AC_SL1500_.jpg> (lost in CSV conversion)
- [A31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A31) `powercon` Picture: <https://www.neutrik.com/en/neutrik/products/powercon> (lost in CSV conversion)
- [A32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A32) `cee-form` Picture: <https://www.showandstage.de/media/image/product/38328/lg/cee-form-16a-240v-3pol-kupplung-blau-ip44.jpg> (lost in CSV conversion)
- [A33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A33) `eventcon` Picture: <https://ehrgeiz.glp.de/images/products/eventCON/showcase/eventCON_5.jpg> (lost in CSV conversion)
- [A34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A34) `hirschmann-ca` Picture: <https://complete-electronics.com/media/catalog/category/CA.jpg> (lost in CSV conversion)
- [A35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A35) `wieland-rst` Picture: <https://www.frame3d.de/wp-content/uploads/2018/03/Wieland-RST-Classic-04-1500x844.jpg> (lost in CSV conversion)
- [A36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A36) `teeplug` Picture: <https://www.hylec-apl.com/Content/productImage/THK.387.A5A.jpg> (lost in CSV conversion)
- [A37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A37) `mate-n-lok` Picture: <https://www.vehiclewiringproducts.co.uk/image/cache/catalog/products/normal/mnl6-1000x1000w.jpg> (lost in CSV conversion)
- [A38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A38) `socapex` Picture: <https://cdn.stormltd.co.uk/content/2016/03/socapex.png> (lost in CSV conversion)
- [A39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A39) `harting-han-lectriflex` Picture: <https://cdn.shopify.com/s/files/1/0252/4646/6100/products/lectriflex_1d167fa4-ae4b-4340-b5d8-fe2bd857d8f6_1024x1024@2x.png?v=1623856280> (lost in CSV conversion)
- [A40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A40) `speakon` Picture: <http://files.cablewholesale.com/hires/10a2-46120_01.jpg> (lost in CSV conversion)
- [A41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A41) `wago-221` Picture: <https://www.pccweb.com/wp-content/uploads/2016/02/WAGO-221-LeverNut-Image1.png> (lost in CSV conversion)
- [A42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A42) `powerpole-15-45` Picture: <https://www.master-instruments.com.au/image/61848/1/Enepower-CE081L.png> (lost in CSV conversion)
- [A43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A43) `ic5-ec5` Picture: <https://images.amain.com/images/large/spm/spmxca502.jpg?width=475> (lost in CSV conversion)
- [A44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A44) `mt30-60` Picture: <https://www.hacker-motor-shop.com/hacker_e/prodpic/MT60-connector-plug-socket-A85068_b_1.JPG> (lost in CSV conversion)
- [A45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=A45) `xt60-90` Picture: <https://cdn.sparkfun.com//assets/parts/4/9/7/1/10474-01.jpg> (lost in CSV conversion)

<details><summary>Acknowledged differences (60)</summary>

- [H3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=H3) `sh` Locking "Latching": (cited) YAML cites a source for mechanical.locking
- [J3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=J3) `sh` Wire -To -Wire "Yes": (cited) YAML cites a source for mechanical.wire_to_wire
- [W3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=W3) `sh` Max Pins "25": (cited) YAML cites a source for mechanical.max_pins
- [H5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=H5) `ph` Locking "Detent": (cited) YAML cites a source for mechanical.locking
- [AF5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=AF5) `ph` Notes "R.C, Lipo Balance connector , Internal connector in some co…": (cited) YAML cites a source for notes
- [C6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C6) `picoblade` Link "https://www.molex.com/molex/products/family/picoblade": Dead now; YAML links the current page
- [H7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=H7) `xh` Locking "Latching": (cited) YAML cites a source for mechanical.locking
- [N8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=N8) `sm` Pitch "2.54 mm": (cited) YAML cites a source for mechanical.pitch
- [C9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C9) `df62w` Link "https://www.hirose.com/product/series/DF62W#": Hirose now redirects it to its Japanese page; YAML links the English one
- [E9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=E9) `df62w` Max Current "3.5": (cited) YAML cites a source for ratings.max_current
- [C11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C11) `molex-kk-aka-kf2510` Link "https://www.molex.com/molex/products/family/kk": Old Molex link (hyperlink target differs from the cell text); YAML keeps the cell's URL
- [C15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C15) `sp13` Link "https://www.weipuconnector.com/sp13-series/": Sheet error: the SP13 link cell's hyperlink points at Hirose DF62W
- [C16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C16) `9159` Link "https://www.avx.com/products/connectors/board-to-board/stan…": Old URL; it redirects to the page YAML links
- [F16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=F16) `9159` Max Voltage "125": (cited) YAML cites a source for ratings.max_voltage
- [J16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=J16) `9159` Wire -To -Wire "Yes": (cited) YAML cites a source for mechanical.wire_to_wire
- [L16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=L16) `9159` Smallest Guage "24": Board-to-board only: it takes no wire, so the gauges were removed (database review, plans/database-review-fixes/connectors.yaml)
- [M16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=M16) `9159` Largest Guage "22": Board-to-board only: it takes no wire, so the gauges were removed (database review, plans/database-review-fixes/connectors.yaml)
- [R16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=R16) `9159` Crimp? "Yes": (cited) YAML cites a source for termination.crimp
- [S16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=S16) `9159` IDC? "Yes": (cited) YAML cites a source for termination.idc
- [W16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=W16) `9159` Max Pins "6": (cited) YAML cites a source for mechanical.max_pins
- [C22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C22) `sp17` Link "https://weipuconnector.com/product/38": Old URL; it redirects to the page YAML links
- [C25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C25) `mtsb-combicon` Link "https://in.rsdelivers.com/product/phoenix-contact/1757035/p…": Old URL; it redirects to the page YAML links
- [L25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=L25) `mtsb-combicon` Smallest Guage "20": (cited) YAML cites a source for termination.smallest_gauge
- [C26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C26) `deutsch-dt` Link "https://www.te.com/usa-en/products/connectors/automotive-co…": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [C28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C28) `mini-fit-jr` Link "https://www.molex.com/molex/products/family/minifit_power_c…": Dead now; YAML links the current page
- [G29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=G29) `superseal` IP Rating "IP68": (cited) YAML cites a source for ratings.ip_rating
- [W29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=W29) `superseal` Max Pins "8": (cited) YAML cites a source for mechanical.max_pins
- [C31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C31) `powercon` Link "https://www.neutrik.com/en/neutrik/products/powercon": Old URL; it redirects to the page YAML links
- [B34](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=B34) `hirschmann-ca` Manufacturer "Lumberg /Belden": (cited) YAML cites a source for creator
- [E35](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=E35) `wieland-rst` Max Current "16": (cited) YAML cites a source for ratings.max_current
- [M36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=M36) `teeplug` Largest Guage "16": (cited) YAML cites a source for termination.largest_gauge
- [S36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=S36) `teeplug` IDC? "Yes": (cited) YAML cites a source for termination.idc
- [C39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C39) `harting-han-lectriflex` Link "https://www.harting.com/US/en/heavy-duty-electrical-connect…": Old URL; it redirects to the page YAML links
- [C40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C40) `speakon` Link "https://www.neutrik.com/en/neutrik/products/speakon-loudspe…": Old URL; it redirects to the page YAML links
- [C41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C41) `wago-221` Link "https://www.wago.com/global/electrical-interconnections/dis…": Old URL; it redirects to the page YAML links
- [L41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=L41) `wago-221` Smallest Guage "28": (cited) YAML cites a source for termination.smallest_gauge
- [C42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C42) `powerpole-15-45` Link "https://www.andersonpower.com/us/en/resources/PowerPoleReso…": Old URL; it redirects to the page YAML links
- [G42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=G42) `powerpole-15-45` IP Rating "IP65 Available": Same: IP65 only with SpecPak shells and boots (ratings notes)
- [M42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=M42) `powerpole-15-45` Largest Guage "6": (cited) YAML cites a source for termination.largest_gauge
- [B44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=B44) `mt30-60` Manufacturer "Generic": (cited) YAML cites a source for creator
- [B45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=B45) `xt60-90` Manufacturer "Generic": (cited) YAML cites a source for creator
- [C45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C45) `xt60-90` Link "https://www.sparkfun.com/products/10474": Old URL; it redirects to the page YAML links
- [F45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=F45) `xt60-90` Max Voltage "42": (cited) YAML cites a source for ratings.max_voltage
- [B2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=B2) `dupont` Manufacturer "Harwin/ Generic": Old Harwin page; redirects to the product listing in creator.url
- [C6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C6) `picoblade` Link "https://www.molex.com/molex/products/family/picoblade": Dead now; YAML links the current page
- [C9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C9) `df62w` Link "https://www.hirose.com/product/series/DF62W#": Hirose now redirects it to its Japanese page; YAML links the English one
- [C11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C11) `molex-kk-aka-kf2510` Link "https://www.molex.com/molex/products/family/kk": Old Molex link (hyperlink target differs from the cell text); YAML keeps the cell's URL
- [C15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C15) `sp13` Link "https://www.weipuconnector.com/sp13-series/": Sheet error: the SP13 link cell's hyperlink points at Hirose DF62W
- [C16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C16) `9159` Link "https://www.avx.com/products/connectors/board-to-board/stan…": Old URL; it redirects to the page YAML links
- [C22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C22) `sp17` Link "https://weipuconnector.com/product/38": Old URL; it redirects to the page YAML links
- [C25](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C25) `mtsb-combicon` Link "https://in.rsdelivers.com/product/phoenix-contact/1757035/p…": Old URL; it redirects to the page YAML links
- [C26](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C26) `deutsch-dt` Link "https://www.te.com/usa-en/products/connectors/automotive-co…": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [C28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C28) `mini-fit-jr` Link "https://www.molex.com/molex/products/family/minifit_power_c…": Dead now; YAML links the current page
- [C31](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C31) `powercon` Link "https://www.neutrik.com/en/neutrik/products/powercon": Old URL; it redirects to the page YAML links
- [C39](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C39) `harting-han-lectriflex` Link "https://www.harting.com/US/en/heavy-duty-electrical-connect…": Old URL; it redirects to the page YAML links
- [C40](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C40) `speakon` Link "https://www.neutrik.com/en/neutrik/products/speakon-loudspe…": Old URL; it redirects to the page YAML links
- [C41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C41) `wago-221` Link "https://www.wago.com/global/electrical-interconnections/dis…": Old URL; it redirects to the page YAML links
- [C42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C42) `powerpole-15-45` Link "https://www.andersonpower.com/us/en/resources/PowerPoleReso…": Old URL; it redirects to the page YAML links
- [C45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=C45) `xt60-90` Link "https://www.sparkfun.com/products/10474": Old URL; it redirects to the page YAML links
- [R2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=602979062&range=R2) `dupont` Crimp? "Yes": Already in notes ("proper crimp tool 400USD+")

</details>

## Drive Libraries

Database folder: `database/drive-libraries/`.

<details><summary>Column mapping</summary>

| Col | Sheet header                | YAML field(s)                            | Compared as | Note |
| --- | --------------------------- | ---------------------------------------- | ----------- | ---- |
| A   | (name)                      | `name`                                   | text        |      |
| B   | Developer                   | `creator`                                | text        |      |
| C   | Hardware                    | `hardware`, `platforms`                  | text        |      |
| D   | Features                    | `features`, `supported_ics`, `protocols` | text        |      |
| E   | URL                         | `links.repo`, `links.url`                | url         |      |
| F   | YouTube                     | `links.youtube`                          | url         |      |
| G   | Instructional Resources     | `instructional_resources`                | url         |      |
| H   | Instructional Resources (2) | `instructional_resources`                | url         |      |

</details>

### Rows paired by alias, URL, or as duplicates

- [A5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=A5) "ArtNet to TMP2 Convertor" → `drive-libraries/artnet-to-tmp2-convertor` (alias, score 1)

### YAML entries with no sheet row

- `drive-libraries/circuitpython` "CircuitPython": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/esp32-fastled-web-server` "ESP32 FastLED Web Server": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/espasynce131` "ESPAsyncE131": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `drive-libraries/espeasy` "ESPEasy": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/esphome` "ESPHome": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/fastled-esp8266-web-server` "FastLED + ESP8266 Web Server": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/micropython` "MicroPython": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/moonlight` "MoonLight": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/neopixelbus` "NeoPixelBus": added 2026-11-18 in f7d10be (data: 18 boards, buffers, libraries and connectors that hardware entries name)
- `drive-libraries/open-lighting-architecture` "Open Lighting Architecture": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)
- `drive-libraries/tasmota` "Tasmota": added 2026-11-18 in 992f7b5 (data(pattern-drivers, drive-libraries): 21 programs hardware makers name)

<details><summary>Acknowledged differences (14)</summary>

- [D2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=D2) `arduino-ethernet-nano-with-enc28j60` Features "WS2811/12 Ethernet Hardwire": YAML revised by research since the import
- [C4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C4) `artnet-receive` Hardware "Arduino/Teensie/ESP8266": Same hardware, spelled out and as a list
- [A5](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=A5) `artnet-to-tmp2-convertor` (name) "ArtNet to TMP2 Convertor": (cited) YAML cites a source for name
- [C6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C6) `artnet-dmx-sd-card` Hardware "NodeMcu /ESP8266/32": Same hardware, spelled out and as a list
- [C8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C8) `artnetwifi` Hardware "ESP8266/32": Same hardware, spelled out and as a list
- [C11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C11) `espixelstick` Hardware "ESP8266/32": Same boards in structured form: hardware [ESP8266, ESP32]
- [B13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=B13) `fade` Developer "Eric Arcana": Fade is Eric Gunnerson's (riderx.info); "Eric Arcana" was a sheet error, fixed in 388c2cf
- [C16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C16) `led-mapper` Hardware "Arduino/ Esp 66/32": Same hardware, spelled out and as a list
- [C27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C27) `visuino` Hardware "Arduino/Esp66/32/ RasPi/MicroBit/Teensy": Same hardware, spelled out and as a list
- [C28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C28) `wled` Hardware "ESP8266/32": Same hardware, spelled out and as a list
- [E28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=E28) `wled` URL "https://github.com/Aircoookie/WLED": Old URL; it redirects to the page YAML links
- [C29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=C29) `xod` Hardware "Arduino/ ESP 66/32": Same hardware, spelled out and as a list
- [A28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=A28) `wled` (name) "WLED": Old URL; it redirects to the page YAML links
- [E28](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=1543805468&range=E28) `wled` URL "https://github.com/Aircoookie/WLED": Old URL; it redirects to the page YAML links

</details>

## Diffusive Materials

Database folder: `database/diffusive-materials/`.

<details><summary>Column mapping</summary>

| Col | Sheet header              | YAML field(s)                | Compared as | Note                                                                      |
| --- | ------------------------- | ---------------------------- | ----------- | ------------------------------------------------------------------------- |
| A   | (name)                    | `name`                       | text        |                                                                           |
| B   | URL                       | `links.product`              | url         |                                                                           |
| C   | Color Rendition           | `optical.color_rendition`    | number      |                                                                           |
| D   | Light Transmission        | `optical.light_transmission` | number      |                                                                           |
| E   | Flexible/Rigid            | `physical.flexible`          | enum        |                                                                           |
| F   | Purpose Made ?            | `purpose_made`               | bool        |                                                                           |
| G   | Properties                | `optical.properties`         | text        |                                                                           |
| H   | Fire Retardent?           | `physical.fire_retardant`    | bool        |                                                                           |
| I   | Tinted/Clear              | `optical.tints`              | custom      |                                                                           |
| J   | Sample thickness (inches) | `physical.sample_thickness`  | custom      | Inches in the sheet; a length with its unit in YAML (2c469a1)             |
| K   | Diffusivity               | `optical.diffusivity`        | number      |                                                                           |
| L   | Sizes Available           | `physical.sizes_available`   | text        |                                                                           |
| M   | Material Type             | `materials`, `form`, `notes` | text        | Polymer names became material codes (PET, PMMA, ...) and a form (2c469a1) |
| N   | Usage Notes               | `notes`                      | text        |                                                                           |
| O   | $                         | `pricing.price_range`        | exact       |                                                                           |

</details>

Header problems:

- J1 reads "Sample thickness (inches)", expected "Sample thickness"

### Rows paired by alias, URL, or as duplicates

- [A8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A8) "LD45 Plaztazote" → `diffusive-materials/ld45-plaztazote` (url, score 0.92)
- [A11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A11) "Polyethelene" → `diffusive-materials/polyethelene` (alias, score 1)
- [A16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A16) "Silicone Sealant" → `diffusive-materials/ld45-plaztazote` (url, score 0.75, duplicate of row 8)
- [A19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A19) "Lexan DCLW" → `diffusive-materials/lexan-dclw` (url, score 0.92)
- [A27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A27) "Plexiglas LED Edge Lit was EndlightenT" → `diffusive-materials/plexiglas-led-edge-lit-was-endlightent` (alias, score 0.82)
- [A41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A41) "Diffraction grating" → `diffusive-materials/diffraction-grating` (url, score 0.92)

<details><summary>Acknowledged differences (45)</summary>

- [M2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M2) `printer-paper` Material Type "Wood Pulp": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [M3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M3) `bubble-wrap` Material Type "Air Filled PE": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [J4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=J4) `pex-pipe` Sample thickness (inches) "3.2": Sheet error: 3.2 is millimetres in the inches column; YAML stores 3.2mm
- [M4](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M4) `pex-pipe` Material Type "Ethelyne Copolymer": Material checked against the maker since the import (6d2133d, fb3f9b7)
- [M6](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M6) `baking-parchment` Material Type "Paper with silicone or wax": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [M8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M8) `ld45-plaztazote` Material Type "Closed Cell LDPE foam": Material checked against the maker since the import (6d2133d, fb3f9b7)
- [B10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B10) `poly-pro-pipe-thin-wall` URL "https://www.omega.co.uk/pptst/TYPP.html": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [J10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=J10) `poly-pro-pipe-thin-wall` Sample thickness (inches) "3.2": Sheet error: 3.2 is millimetres in the inches column; YAML stores 3.2mm
- [M12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M12) `oyumaru` Material Type "Ethelyne Copolymer": Material checked against the maker since the import (6d2133d, fb3f9b7)
- [N12](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N12) `oyumaru` Usage Notes "Hot water mouldlble rubber,flexible. when set and possible …": Typo fixed in YAML
- [M14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M14) `pool-noodle` Material Type "PE Closed cell foam": Material checked against the maker since the import (6d2133d, fb3f9b7)
- [N14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N14) `pool-noodle` Usage Notes "See slo Plastazote and Foam Backer Rod": Typo fixed in YAML
- [M15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M15) `vinyl-dryer-hose` Material Type "PVC Wire reinforcement": Wire reinforcement kept in notes
- [A16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A16) `ld45-plaztazote` (name) "Silicone Sealant": Row mislabeled "Silicone Sealant" (it carries Plastazote data); merged into Plastazote LD45 in fb3f9b7
- [J16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=J16) `ld45-plaztazote` Sample thickness (inches) "variable": Row mislabeled "Silicone Sealant" (it carries Plastazote data); merged into Plastazote LD45 in fb3f9b7
- [N16](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N16) `ld45-plaztazote` Usage Notes "Great for costumes - search Etsy": Row mislabeled "Silicone Sealant" (it carries Plastazote data); merged into Plastazote LD45 in fb3f9b7
- [M18](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M18) `instamorph-polymorph` Material Type "PCL Poly Capro Lactone": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [A19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=A19) `lexan-dclw` (name) "Lexan DCLW": Name typo fixed in YAML (slug kept)
- [H19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=H19) `lexan-dclw` Fire Retardent? "Y": YAML revised by research since the import (6d2133d)
- [N19](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N19) `lexan-dclw` Usage Notes "Lexan DLCW (Diffused Light Cool White)special combination o…": YAML revised by research since the import (6d2133d)
- [B20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B20) `corrugated-split-loom-conduit-tubing-sleeving` URL "https://www.cabletiesandmore.ca/images/gallery/white-wire-l…": Dead now; YAML links the current page
- [M22](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M22) `foam-backer-rod` Material Type "Closed cell PE foam": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [M23](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M23) `neutral-cure-silicone` Material Type "RTV Silicone rubber": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [M24](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M24) `suction-hose` Material Type "PVC Wire reinforcement": Wire reinforcement kept in notes
- [B27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B27) `plexiglas-led-edge-lit-was-endlightent` URL "https://www.plexiglas-shop.com/en-de/products/plexiglas-led/": Plexiglas moved to Polyvantis: the old shop URL redirects to the product page YAML links
- [G27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=G27) `plexiglas-led-edge-lit-was-endlightent` Properties "Edge Lit front diffuser": Same in structured form: optical.properties edge-lit; the notes describe the diffusing particles
- [J29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=J29) `textured-acrylic-various` Sample thickness (inches) ".125-.220": Same range with units: 0.125-0.22in
- [M29](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M29) `textured-acrylic-various` Material Type "PMMA Poly Methyl Meth Acrylate": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [G32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=G32) `rowlux` Properties "Backlight & Edgelight": Same in structured form: backlight + edge-lit
- [M32](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M32) `rowlux` Material Type "PET,PVC,PC, TPU": Material checked against the maker since the import (6d2133d, fb3f9b7)
- [N33](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N33) `rosco-diffusion` Usage Notes "Rosco theatrical diffussion": Typo fixed in YAML
- [N36](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N36) `lumieo-2` Usage Notes "premium white acrylic sheet which provides both high transm…": YAML revised by research since the import (6d2133d)
- [M37](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M37) `3m-envision-diffuser` Material Type "polyester": Material checked against the maker since the import (6d2133d, fb3f9b7)
- [G38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=G38) `perspex-g-lux-edge-lit-acrylic` Properties "Edge Lit front diffuser": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [M38](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M38) `perspex-g-lux-edge-lit-acrylic` Material Type "doped PMMA": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [M41](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M41) `diffraction-grating` Material Type "PC ?": Material checked against the maker since the import (6d2133d, fb3f9b7)
- [N42](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N42) `harmonia-pc-1050-24-3050-24` Usage Notes "reflective (unknown) dopant several polymer options": YAML revised by research since the import (6d2133d)
- [N43](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=N43) `makrolon-dq-5122-5162` Usage Notes "doped polycarbonate (index mismatch)": YAML revised by research since the import (6d2133d)
- [B44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B44) `perspex-diffuse` URL "https://perspex.com/news/pom-diffuse/": YAML revised by research since the import (6d2133d)
- [L44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=L44) `perspex-diffuse` Sizes Available "upto1220x 2440": (cited) YAML cites a source for physical.sizes_available
- [M45](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=M45) `faux-fur` Material Type "Polyester,Acrylic": Same material as codes + form (2c469a1); descriptive detail kept in notes where it matters
- [B10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B10) `poly-pro-pipe-thin-wall` URL "https://www.omega.co.uk/pptst/TYPP.html": Old URL (the site blocks scripted checks); YAML links the maker's current page
- [B20](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B20) `corrugated-split-loom-conduit-tubing-sleeving` URL "https://www.cabletiesandmore.ca/images/gallery/white-wire-l…": Dead now; YAML links the current page
- [B27](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B27) `plexiglas-led-edge-lit-was-endlightent` URL "https://www.plexiglas-shop.com/en-de/products/plexiglas-led/": Plexiglas moved to Polyvantis: the old shop URL redirects to the product page YAML links
- [B44](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=554721273&range=B44) `perspex-diffuse` URL "https://perspex.com/news/pom-diffuse/": YAML revised by research since the import (6d2133d)

</details>

## Commercial Pixel Systems

Database folder: `database/commercial-systems/`.

<details><summary>Column mapping</summary>

| Col | Sheet header          | YAML field(s)                               | Compared as | Note |
| --- | --------------------- | ------------------------------------------- | ----------- | ---- |
| A   | (name)                | `name`                                      | text        |      |
| B   | Manufacturer          | `creator`, `manufacturers`                  | text        |      |
| C   | Pixels Per Run        | `specs.pixels_per_run`                      | number      |      |
| D   | Dimming Resolution    | `specs.dimming_bits`, `specs.dimming_notes` | custom      |      |
| E   | Dedicated PSU/control | `specs.dedicated_psu`                       | bool        |      |
| F   | RGB/W                 | `specs.color_type`                          | text        |      |
| G   | Online Pricing        | `pricing.examples`                          | text        |      |
| H   | Price Range           | `pricing.price_range`                       | exact       |      |
| I   | Core Tech             | `core_tech`                                 | text        |      |
| J   | Since                 | `release_year`                              | number      |      |
| K   | Target Market         | `target_market`                             | text        |      |
| L   | NOTES                 | `notes`                                     | text        |      |

</details>

### Rows paired by alias, URL, or as duplicates

- [A8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=A8) "Active RGB" → `commercial-systems/active-rgb` (alias, score 0.67)
- [A10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=A10) "Lightwalls" → `commercial-systems/lightwalls` (alias, score 0.71)
- [A11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=A11) "" → `commercial-systems/vinci` (alias, score 0.86)
- [A14](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=A14) "SmartPXL" → `commercial-systems/smartpxl` (alias, score 0.86)

<details><summary>Acknowledged differences (16)</summary>

- [F2](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=F2) `dfs3000` RGB/W "RGB/RGBW/WW": (cited) YAML cites a source for specs.color_type
- [C3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=C3) `astera-nyx` Pixels Per Run "170": Each bulb is a standalone wireless one-pixel fixture (no wired DMX), so there is no run to count; removed (database review, plans/database-review-fixes/adapters-commercial.yaml)
- [F3](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=F3) `astera-nyx` RGB/W "RGBW": (cited) YAML cites a source for specs.color_type
- [L7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=L7) `vc-dot-1` NOTES "Martin, stage lighting part of Harmon Kardon group": (cited) YAML cites a source for notes
- [C8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=C8) `active-rgb` Pixels Per Run "170": (cited) YAML cites a source for specs.pixels_per_run
- [F8](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=F8) `active-rgb` RGB/W "RGB": (cited) YAML cites a source for specs.color_type
- [G10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=G10) `lightwalls` Online Pricing "Learning kit £550+VAT": Same in structured form: pricing.examples (item, £550, +VAT)
- [L10](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=L10) `lightwalls` NOTES "Strip and panels assosciated with Protopixel.io, subscripti…": (cited) YAML cites a source for notes
- [B13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=B13) `triklit` Manufacturer "Minelon - Rainmin": (cited) YAML cites a source for creator
- [D13](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=D13) `triklit` Dimming Resolution "8 Bit": (cited) YAML cites a source for specs.dimming_bits
- [F15](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=F15) `festoon-2-rgb` RGB/W "RGB W/WW": (cited) YAML cites a source for specs.color_type
- [G17](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=G17) `twinkly` Online Pricing "250 string $105": Re-priced at the source: $119.99 for 250 LEDs (Twinkly US store, retrieved 2026-11-18)
- [B7](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=B7) `vc-dot-1` Manufacturer "Martin": Maker moved the page; YAML has the current URL
- [B9](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=B9) `lb-100` Manufacturer "SGM": Maker moved the page; YAML has the current URL
- [B11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=B11) `vinci` Manufacturer "https://www.lucenti.lighting/products": Lucenti's Vinci: creator is now {name: Lucenti, url: https://www.lucenti.lighting/}; the sheet linked the product index
- [G11](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA/edit#gid=248280587&range=G11) `vinci` Online Pricing "RGB €120 per lamp": The cell linked Lucenti's product index; its price is kept as a pricing example with the sheet's text in its notes

</details>
