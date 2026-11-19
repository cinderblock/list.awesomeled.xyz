# Cross-links & relationships (workstream 4)

## Goal

Make the database a connected graph instead of 12 separate tables: every entry
page answers "what does this work with?" in both directions, and the tables can
filter by compatibility ("controllers that drive WS2815", "boards WLED runs on").
That is something the old Google Sheet structurally cannot do. Every link must
be verified from a real source (datasheet, vendor page, project docs), with the
source recorded where the schema allows. Part of
[plans/website-buildout.md](website-buildout.md) (OVERHAUL-PLAN.md Goal 3).

## Environment / context

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-cross-links-ccc4dd628eae1019`, branch `ws/cross-links`.
- Ship: rebase onto `origin/master`, push fast-forward `git push origin HEAD:master`. Never force-push. Every push deploys production.
- Checks before every push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:e2e` (Playwright, chromium; `E2E_PORT=5373` to use this worktree's dev server port), `bun run build` for loader changes.
- Coverage stats: `bun run scripts/cross-link-stats.ts` (added by this stream).
- Code: `app/lib/relations.ts` (graph, name index, derived `linked` summary, page rows), `app/components/ui/EntryLinks.tsx` (rendering), `app/lib/data.ts` (`getRelationGraph`, `loadCategoryData` attaches `entry.linked`), `app/lib/columns.tsx` (compatibility columns), `scripts/validate.ts` (dangling refs, `sources` keys, unresolved-name warnings).
- Research pipeline (local, git-ignored via `.git/info/exclude`): `.research/BRIEF.md` (rules + JSON format for research agents), `.research/vocab.md` (entry slugs/names), `.research/out/<batch>.json` (agent findings), `.research/apply.ts` (applies findings to YAML with the `yaml` Document API, comment-preserving, lint key order; corrections and missing entities are only printed). The `.research/*.ts` scripts carry `/* eslint-disable */`; run Prettier's check with an extra ignore file for `.research/`.
- Other streams own: parity (1), schema/standardization (2), designer (3), images (5), prices/link health (6), browse UX (7). Overlaps go through `ISSUES.md`.

## Decisions already made (don't re-ask)

- **Vendor names stay as names; a resolver turns them into links.** List-type
  compatibility fields (`outputs.protocols`, `supported_ics`,
  `software.firmware`, `software.works_with`, …) keep the names the vendor
  publishes. An alias index built from each target entry's `name`,
  `variants[].name` and a new `aliases` field resolves them to entries. Unknown
  names stay plain text and are reported (not fatal) by `validate` and the
  stats script, which is how missing entries get found. Why: YAML stays
  readable and checkable against the vendor's own list, and parts not yet in
  the database are still recorded.
- **One-sided declarations, derived reverse direction** (existing convention in
  `common.json#/definitions/related`): the consumer declares (a controller lists
  the ICs it drives, the firmware it runs); the IC/firmware pages derive "Driven
  by", "Runs on".
- **Curated structural links use the generic `related` array**, with the type
  vocabulary extended by `uses`, `host`, `compatible` (see below). The legacy
  per-category `related_<category>` slug arrays are retired in its favor.
- **Sources are structured data, not YAML comments** (stream 6 moved price
  provenance into `price_source` the same day): `sources` maps a dotted field
  path to `{url, retrieved, notes}` (one or a list); `related[]` items carry
  their own `source`. Entry pages show them inline under the field / next to
  the link; `validate` checks every `sources` key names an existing field.
- Per-entry research commits are reviews (stay out of `IGNORED_COMMITS`);
  mechanical batch commits (alias seeding, legacy-field migration) go into
  `IGNORED_COMMITS` in a follow-up commit.

## Link model

| Field (declaring side)                                        | Resolves to                      | Forward label    | Reverse label          |
| ------------------------------------------------------------- | -------------------------------- | ---------------- | ---------------------- |
| controllers `outputs.protocols[]`                             | pixels, pixel-ics (by name)      | Drives           | Driven by              |
| drive-libraries `supported_ics[]`                             | pixels, pixel-ics (by name)      | Supports         | Supported by libraries |
| pixel-decoders `inputs.protocols[]` (new)                     | pixels, pixel-ics (by name)      | Decodes          | Decoded by             |
| controllers/adapters `software.firmware[]`                    | pattern-drivers, drive-libraries | Firmware         | Runs on                |
| controllers/adapters `software.works_with[]`                  | pattern-drivers, drive-libraries | Works with       | Works with (hardware)  |
| controllers `outputs.connector.ref`                           | connectors (slug)                | Output connector | Used by                |
| controllers `inputs.requires_host`                            | microboards (by name)            | Host board       | Host for               |
| `related[]` type `uses` (new)                                 | any `<category>/<slug>`          | Uses             | Used in                |
| `related[]` type `host` (new)                                 | any                              | Host board       | Host for               |
| `related[]` type `compatible` (new)                           | any                              | Compatible with  | Compatible with        |
| `related[]` replacement/predecessor/variant/accessory/related | any                              | (existing)       | (existing)             |
| pixels/pixel-ics `data.type` (protocol family)                | same-family entries (derived)    | Same protocol    | Same protocol          |

## Plan / steps

1. [x] Survey schema, data, existing UI (`entry.tsx`, `data.ts`, `validate.ts`).
2. [x] Plan doc + `scripts/cross-link-stats.ts`; baseline recorded.
3. [x] Infrastructure (pushed): `aliases`, `related.type` += uses/host/compatible, pixel-decoder `inputs.protocols`, `sources` provenance; `relations.ts` graph; validator; entry-page "Works with" / "Related products"; compatibility columns + "compatible with X" filters + ecosystem counts (`entry.linked`).
4. [x] Research: 15 delegated agents (threads below) wrote `.research/out/<batch>.json`; each batch reviewed (sources spot-checked), applied with `.research/apply.ts`, committed as a review commit, plus a separate corrections commit for spec fixes found on the way.
5. [x] Pixel side: protocol family (`data.type`) on every pixel IC and pixel, aliases, generation / IC links.
6. [x] Controllers: `outputs.protocols` (114/132), firmware / works-with, connector refs, host boards, families.
7. [x] Drive libraries: `supported_ics` holds pixel parts only, control protocols moved to `protocols`; `related_*` arrays retired (`1ae1a4d`, in IGNORED_COMMITS). Pattern drivers: aliases, hardware support.
8. [x] Adapters (host boards, connectors, firmware), pixel decoders (`inputs.protocols`), microboards (generations), level converters (buffer-IC users), connectors (families, aliases), commercial systems, diffusers.
9. [ ] **Current:** missing entities. Three delegated agents (below) write new entries for the most-referenced unresolved names into `.research/new/<category>/` (git-ignored). Review each (schema, sources), move into `database/`, add the host / uses links that now resolve, commit as research commits.
10. [x] Maker cross-links: "More from <maker>" row (`bc36452`), minus what the other family rows already show.
11. [x] UI at real data volume (screenshots of WS2811, xLights, BeagleBone Black, deskontroller LITE V3 32): source notes behind a "note" toggle, card lists collapse at 12, maker names keep their spelling in row labels, one explanation per "All compatible hardware" row; unit tests for `relations.ts`.
12. [ ] After-stats, ROADMAP / OVERHAUL-PLAN Goal 3 status, README check, close out.

### Research agents (delegated 2026-11-18)

- [controllers A (Falcon/Kulp/FPP)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Aabacf233-3e7b-40b8-ac72-969e9864b744)
- [controllers B (Advatek/DMXking)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A26367982-d5a3-4b55-a1c4-f946da59a7eb)
- [controllers C (HolidayCoro/Genius/SanDevices/hobby)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Acabd1e64-30b1-47da-8c7e-5108b8e5408f)
- [controllers D (WLED/ESP/DIY)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A4e8241a2-9cb1-4e09-9d79-56e405cfd71b)
- [controllers E (ENTTEC/DiGidot/Deskontrol/pro)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A3fb409c4-9c7d-4ee7-b705-8bcdcce181fb)
- [controllers F (pro/stage/SmartShow/misc)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Ae091f76b-1d8c-492e-b76d-f0e8027add67)
- [controllers G (SP-series/Diamex/misc)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Ac5d381de-64b3-4e1b-916e-b28d5c7e56b8)
- [controllers H (LED Strip Studio/ProtoPixel/RocketLife)](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A61353f24-e86e-4b67-87dd-876748f36c65)
- [pixel ICs](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A1ca1d8cf-42ce-4184-b223-297ad314fca2)
- [pixels](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A261bd66d-bf58-4ca1-8caa-0ce36dcba765)
- [drive libraries](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Aacbe8c8f-aa2b-466a-b1bc-0579af1b674c)
- [pattern drivers](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A7d4ff777-031f-41c7-93c3-c2f74b9e85dc)
- [adapters + pixel decoders](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A25c5e3f0-fbfb-462a-9a96-5ab537e37836)
- [microboards + level converters](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A9e2d71b7-95d4-4fb5-8eea-28e81908584a)
- [connectors + commercial + diffusers](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A869f8115-e2aa-4ab6-99a1-e4963f1fc98c)

### New-entry agents (delegated 2026-11-18, step 9)

Brief: `.research/NEW-ENTRIES.md`. Output: `.research/new/<category>/<slug>.yaml` (staging, git-ignored).

- [pixel ICs A](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A8e9e21de-4727-497a-a5ce-af2186c5af81): WS2818, SM16704, TM1812, INK1003, WS2803, UCS2912, P9883, SM16804, LPD8803, SM16714, MBI6023, SM16803
- [pixel ICs B](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Aadbd4739-9927-44be-88af-141d4411141c): UCS5603, TM1903, UCS1912, UCS2909, UCS7604, TM1934, SM16726, INK1002, TM1824, LPD1886, UCS6909, UCS1909, FW1906, UCS7804
- [boards, buffers, software, connectors](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A6b9a1fdc-f773-4695-8dd0-8f5378a1625a): Wemos D1 Mini / Pro, Pi Zero 2 W, Pi 3 B, Pi 5, PocketBeagle 2, BeagleBone Green, Orange Pi Zero; SN74HCT245, SN74HCT125, TXB0104, MAX3485; Glediator; NeoPixelBus, ESPAsyncE131; xConnect, PCB screw terminal block, XLR 4
- [pixel ICs C](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Ae6c16bb6-5247-48ab-a7ad-67c80df963de): D705 (D707/D708), LPD1101, LB1908, P9412, DM412, UCS6912, GS8304, NS107, SM16711, TLS3002, TX1818, WS2808
- [pixel ICs D](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3Ad3c7260f-219e-4278-ae47-7b25167e79e9): GE8822 (GE8812/GE1603), MBI6024, MBI6120, UCS2603, WS2821, WS2822, UCS512, DMX512-D, APA101, CY3005, GW6205, ICND2110, LD1510, LPD1882, P943, SK6851, SM16824, TM1913, Adafruit Pixie
- [software](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3Ad77378e9-1111-4e9e-98df-d008601d2b3d%3Adelegate-task%3A234fd594-0b18-46c2-92eb-ae81ea32cf4f): grandMA, Light-O-Rama, Light Show Pro, LightFactory, vvvv, WATCHOUT, FreeStyler, HLS, Pharos, POET, OLA, ESPHome, MoonLight, CircuitPython, MicroPython, Tasmota, ESPEasy, the fastled-webservers; aliases for MagicQ, Mapio, ArKaos, AllPixMatrix, MADRIX (to `.research/out/software-aliases.json`)

## Findings / gotchas

- Controllers' pixel-IC list (`outputs.protocols`) is filled on only 7/135 entries; `software.firmware` 20/135; `works_with` 5/135; `outputs.driver.IC` 0/135. `outputs.connector` is a ref on 81 entries, free text on ~40 (ambiguous: "Screw", "JST", "Phoenix Screw/RJ45").
- `drive-libraries.related_pixel_ics` was batch-derived and is partly wrong: 10 libraries link `pixel-ics/dmx512` (a DMX512-P _pixel IC_ entry) because they output DMX512 the lighting protocol; `lightwork` links it while supporting no pixel ICs at all. It also cannot point at pixels (WS2812B, APA102 live in `pixels/`), which is why `supported_ics` carries names alongside it.
- `supported_ics` mixes pixel ICs with control protocols (Art-Net, sACN, E1.31, Renard, PixelPusher, Fadecandy, HUB75).
- Same product in two categories: QuinLED Dig-Quad/Dig-Uno, ESPArtStick, M4/M8 Port Pixel (adapters + controllers); ESPixelStick, Orange Pi DMX (adapters + drive-libraries); WLED (pattern-drivers + drive-libraries); Standard Differential Receiver (controllers + level-converters). Hardware-vs-firmware twins are legitimately distinct and get linked; true duplicates were a parity/standardization call (logged in ISSUES.md). Stream 2 merged them (`d487f11`, `2a3efbf`); the remaining ESPArtStick pair are two different boards (2019 shield without SD, and the SD-card edition).
- The designer (`app/lib/designer.ts` `checkCompat`) matches `outputs.protocols` against pixel names with a substring token heuristic; the resolver here can replace it (stream 3's call, offered in ISSUES.md).
- `pixel-ics/dmx512` is the DMX512 _pixel_ protocol (single-wire DMX512 pixel chips: UCS512 etc.; Advatek's "DMX512" pixel type, see advatek.netlify.app/pixel-protocols/dmx512), not the DMX512 lighting bus. "DMX512" in a controller's `outputs.protocols` (pixel types) means the pixel protocol; DMX universes belong in `outputs.auxiliary`.
- Several pixels carry a doubtful `data.type` (e.g. HD108 labeled APA102 although its frame is 16-bit). The pixel batches verify every family against datasheets, because "compatible with X" filtering trusts families.
- Stream 2 reshaped controllers' `outputs`/`power` into shared common.json defs (`pixel_outputs`, `output_connector`, `clocked_support`: `false | selectable | always`) and pixel decoders' `outputs`; every link field used here survived (`outputs.protocols`, `outputs.driver.IC`, `outputs.connector.ref`, decoder `inputs.protocols`).
- Local gotchas: a stale nested `node_modules/ajv-formats/node_modules/ajv` made typecheck fail after another stream added ajv-formats — a clean `bun install --frozen-lockfile` fixes it. Under load (7 streams), the e2e tab-switch timing and stale-price tests flake on first run and pass on re-run.
- `Column.headerTip` is hover-only (invisible on touch), so the "compatible with" semantics are also spelled out on entry pages ("All compatible hardware": every controller and adapter that lists the part or a same-protocol one, or runs firmware that supports it); logged for stream 7.
- **Pipes hide failures.** `git rebase … | tail` and `bun run validate | tail` return the exit status of `tail`, so a chained `git push` once ran in the middle of a conflicted rebase and pushed the commits replayed so far. They happened to be valid (verified by validating a `git archive` of the pushed tree), but since then shipping goes through a fail-fast script (`set -euo pipefail`, logs to files, no pipes on gating steps): fetch, rebase, frozen install, validate, typecheck, lint, unit tests, Prettier, push.
- **Rebase merges can silently drop corrections.** Other streams edit the same YAML files concurrently; a hand-merged conflict once concatenated nested keys (duplicate `page:`) and another lost three corrections (WS2801 release year, SK9822-A creator, PB16 notes), re-applied in `dabde25` and later commits. The local conflict resolver now merges top-level maps key by key (`sources` / `related` / `software` lists unioned, prices upstream's) and stops for a human when both sides changed the same value.
- CSS `text-transform: capitalize` on `.detail-key` turned "beagleboard.org" into "Beagleboard.Org"; proper nouns in row labels now sit in a span that keeps their spelling (`LinkRow.subject`).
- `inputs.requires_host` is one string, and several controllers list alternatives in it ("PocketBeagle, PocketBeagle 2"; M4-PI's four Raspberry Pis), which never resolved. The resolver now splits a single-string name field on commas (`fieldNames`), everywhere (graph, page, validate, stats); the schema and the designer's `requiresHost` string stay as they were.
- Brand names controllers use: "NeoPixel" (Adafruit's brand for WS2812-protocol pixels) and "DotStar" (Adafruit's name for APA102-compatible LEDs) are aliases on `pixels/ws2812` and `pixels/apa102`, sourced from Adafruit's guides; family expansion then covers the rest of each protocol family.
- The slug `microboards/raspberry-pi-3-model-b` belongs to the 3 Model B+ entry, so the new original 3 Model B is `raspberry-pi-3b`. The B+ declares it as its `predecessor` (newer entry declares, per BRIEF.md).
- New-entry agents wrote microboards in the pre-tightening style; stream 2 made the microboard schema stricter the same day (`compute.flash` a memory size only, removable cards in `io.storage`; `connectivity.wifi` a list of bands; enums for `isa`, `ethernet`, `poe`, `bms`). Converted on integration: lists for Wi-Fi bands and RAM variants, `flash: microSD` dropped, "Gigabit" → `1000BASE-T`, PoE HAT → `add-on`.
- ESLint lints the git-ignored `.research/` too (it doesn't read `.git/info/exclude`), so staged entries with lint errors failed the local ship script; it now runs `eslint . --ignore-pattern '.research/**'`, matching what CI sees.
- Research found several entries that were wrong beyond links (column-shifted sheet rows, wrong makers, output counts that were DMX universes); spec values outside this stream's fields went to ISSUES.md for streams 2 and 6 rather than being edited here.

## Coverage stats

### Before (2026-11-18, `44a6f99`)

Measured with `bun run scripts/cross-link-stats.ts` against the unchanged data (the graph counts the connector refs and legacy `related_pixel_ics` that already existed).

**280 links**; 191/491 entries (39%) have at least one link (either direction, or a shared protocol family).

| Category            | Entries | Declares links | Linked to | Any link |
| ------------------- | ------: | -------------: | --------: | -------: |
| adapters            |      45 |         2 (4%) |    0 (0%) |   2 (4%) |
| commercial-systems  |      18 |         0 (0%) |    0 (0%) |   0 (0%) |
| connectors          |      45 |         0 (0%) |    3 (7%) |   3 (7%) |
| controllers         |     135 |       97 (72%) |   10 (7%) | 98 (73%) |
| diffusive-materials |      45 |         0 (0%) |    0 (0%) |   0 (0%) |
| drive-libraries     |      29 |       24 (83%) |    2 (7%) | 24 (83%) |
| level-converters    |       9 |         0 (0%) |    0 (0%) |   0 (0%) |
| microboards         |      36 |         0 (0%) |    2 (6%) |   2 (6%) |
| pattern-drivers     |      40 |         0 (0%) |    3 (8%) |   3 (8%) |
| pixel-decoders      |      12 |         0 (0%) |    0 (0%) |   0 (0%) |
| pixel-ics           |      41 |        6 (15%) |  23 (56%) | 27 (66%) |
| pixels              |      36 |       19 (53%) |  18 (50%) | 32 (89%) |

| Name-list field                    | Filled | Names | Resolve to an entry |
| ---------------------------------- | -----: | ----: | ------------------: |
| controllers `outputs.protocols`    |  7/135 |    23 |            22 (96%) |
| drive-libraries `supported_ics`    |  26/29 |   117 |            98 (84%) |
| pixel-decoders `inputs.protocols`  |   0/12 |     0 |               0 (–) |
| controllers `software.firmware`    | 20/135 |    22 |             4 (18%) |
| adapters `software.firmware`       |   1/45 |     1 |              0 (0%) |
| controllers `software.works_with`  |  5/135 |     8 |             4 (50%) |
| adapters `software.works_with`     |   2/45 |     2 |            2 (100%) |
| controllers `inputs.requires_host` | 16/135 |    16 |             9 (56%) |
| controllers `outputs.driver.IC`    |  0/135 |     0 |               0 (–) |

| Link kind   | Count |
| ----------- | ----: |
| drives      |    26 |
| supports    |   107 |
| firmware    |     7 |
| works-with  |     7 |
| connector   |    81 |
| host        |     9 |
| replacement |     1 |
| predecessor |     4 |
| variant     |    19 |
| related     |    19 |

Protocol family (`data.type`) recorded on 38/77 pixels + pixel ICs (49%), in 13 families.

Unresolved names (24 distinct, 50 uses): FPP ×18, DMX ×5, Raspberry Pi ×4, Android ×2, sACN ×2, Arduino, Art-Net, CircuitPython, Computer running ProtoPixel software, E1.31, Fadecandy, FW1906, GECE, HUB75, iOS, LPD1886, PixelPusher, PocketBeagle 2, Raspberry Pi Zero, Renard, SK6812W, TLC59711, WS281x, WS281X

### After

(pending)

## Progress log

- [x] 2026-11-18: survey done, plan written, baseline recorded.
- [x] 2026-11-18: relationship graph + entry-page sections + validator + stats (`316dfdc`, `908d58d`), pushed.
- [x] 2026-11-18: `sources` provenance (`4f75f95`), ISSUES.md coordination (`aab5be7`), pushed.
- [x] 2026-11-18: "compatible with X" filters + ecosystem counts (`edb3de8`), pushed.
- [x] 2026-11-18: 15 research agents delegated (see list above).
- [x] 2026-11-18: "More from <maker>" rows (`bc36452`); long inline name lists collapse (`055c79c`).
- [x] 2026-11-18: all 15 batches applied and pushed, each a review commit plus a corrections commit: software ↔ hardware (`53e14cd`, `b3e5fea`), Advatek / DMXking (`d06a9da`, `6db00d3`), LED Strip Studio / ProtoPixel / RocketLife (`1ea6142`), WLED / ESP (`794114f`), pro / stage (`cbcc0be`), pixel ICs (`62d686a`), pixels (`d84d17a`, `8312a25`), Falcon / Kulp (`9ea88f0`, `08d3a64`), HolidayCoro and hobby (`083ebca`, `943342f`, `dabde25`), ENTTEC / DiGidot / Deskontrol (`457af9f`, `3b97340`), SP-series / Diamex (`dcb5674`, `093c845`), drive libraries (`c41def6`), adapters / decoders (`db0559d`, `f58a359`), boards / level converters (`33d1371`), connectors / commercial / diffusers (`766e632`, `f57a6f4`), WS2816A / DMX512-P (`bbd5320`).
- [x] 2026-11-18: legacy `related_*` retired (`1ae1a4d`, ignored in `0b6d14a`); ISSUES.md entries for spec corrections (`1791181`) and the two pixel-less "controllers".
- [x] 2026-11-18: UI pass at real data volume + `tests/unit/relations.test.ts`.
- [ ] New entries for missing parts (step 9), then after-stats and close-out.

## Open questions for the user

(none yet)

## Things not to do

- Don't batch-derive links from name similarity without checking a source — that is how the `dmx512` mislinks happened.
- Don't link to entries another stream may delete (cross-category duplicates) until that's settled.
- Don't edit `DataTable.tsx` / `ColumnFilter.tsx` internals (stream 7); add columns via `columns.tsx` and log the overlap.
- Don't pipe a gating command (`git rebase`, `bun run validate`, tests) into `tail` / `grep` in a chain that ends in `git push`: the pipe's status is the filter's. Ship with the fail-fast script.
- Don't resolve YAML conflicts by concatenating both sides; merge maps key by key and re-check that every correction from both sides survived.
- Don't put `title=` tooltips on anything (touch users never see them); provenance and notes are inline or behind a tap-to-expand `<details>`.
