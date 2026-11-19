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
- Checks before every push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:e2e` (Playwright, chromium).
- Coverage stats: `bun run scripts/cross-link-stats.ts` (added by this stream).
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
- **Sources** go in the link's `notes` (for `related` items) or as a YAML
  comment on the list field (`protocols: # per <url>, 2026-11`), matching the
  repo's existing comment-as-provenance practice (`price: # LCSC …`).
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
| `related[]` type `host` (new)                                 | any                              | Plugs into       | Add-ons                |
| `related[]` type `compatible` (new)                           | any                              | Compatible with  | Compatible with        |
| `related[]` replacement/predecessor/variant/accessory/related | any                              | (existing)       | (existing)             |
| pixels/pixel-ics `data.type` (protocol family)                | same-family entries (derived)    | Same protocol    | Same protocol          |

## Plan / steps

1. [x] Survey schema, data, existing UI (`entry.tsx`, `data.ts`, `validate.ts`).
2. [ ] **Current:** plan doc + `scripts/cross-link-stats.ts`; record baseline.
3. [ ] Infrastructure: `aliases` on pixel/pixel-ic/software/microboard/level-converter schemas; `related.type` += uses/host/compatible; pixel-decoder `inputs.protocols`; `app/lib/relations.ts` (alias index + edge extraction + reverse lookup, pure); validator warnings for unresolved names; entry-page "Works with" section replacing the ad-hoc `related_*` / "Used by" sections.
4. [ ] Pixel-side groundwork: aliases (variant names, common spellings), protocol families (`data.type`) on every pixel/pixel-IC from datasheets, same-part/predecessor links.
5. [ ] Controllers: `outputs.protocols`, `software.firmware/works_with`, connector refs, host boards, families — vendor docs per entry (largest chunk; batched by maker).
6. [ ] Drive libraries: clean `supported_ics` (move control protocols out), verify against repos; retire `related_pixel_ics`. Pattern drivers: hardware/firmware links.
7. [ ] Adapters (host boards, connectors), pixel decoders (decoded protocols, connectors), microboards (generations), connectors/level converters (families), commercial systems.
8. [ ] UI: compatibility columns + "compatible with X" filters (coordinate with stream 7), maker cross-links.
9. [ ] After-stats, ROADMAP/OVERHAUL-PLAN updates, close out.

## Findings / gotchas

- Controllers' pixel-IC list (`outputs.protocols`) is filled on only 7/135 entries; `software.firmware` 20/135; `works_with` 5/135; `outputs.driver.IC` 0/135. `outputs.connector` is a ref on 81 entries, free text on ~40 (ambiguous: "Screw", "JST", "Phoenix Screw/RJ45").
- `drive-libraries.related_pixel_ics` was batch-derived and is partly wrong: 10 libraries link `pixel-ics/dmx512` (a DMX512-P _pixel IC_ entry) because they output DMX512 the lighting protocol; `lightwork` links it while supporting no pixel ICs at all. It also cannot point at pixels (WS2812B, APA102 live in `pixels/`), which is why `supported_ics` carries names alongside it.
- `supported_ics` mixes pixel ICs with control protocols (Art-Net, sACN, E1.31, Renard, PixelPusher, Fadecandy, HUB75).
- Same product in two categories: QuinLED Dig-Quad/Dig-Uno, ESPArtStick, M4/M8 Port Pixel (adapters + controllers); ESPixelStick, Orange Pi DMX (adapters + drive-libraries); WLED (pattern-drivers + drive-libraries); Standard Differential Receiver (controllers + level-converters). Hardware-vs-firmware twins are legitimately distinct and get linked; true duplicates are a parity/standardization call (logged in ISSUES.md, not decided here).
- The designer (`app/lib/designer.ts` `checkCompat`) matches `outputs.protocols` against pixel names with a substring token heuristic; the resolver here can replace it (stream 3's call).

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

- [x] 2026-11-18: survey done, plan written.

## Open questions for the user

(none yet)

## Things not to do

- Don't batch-derive links from name similarity without checking a source — that is how the `dmx512` mislinks happened.
- Don't link to entries another stream may delete (cross-category duplicates) until that's settled.
- Don't edit `DataTable.tsx` / `ColumnFilter.tsx` internals (stream 7); add columns via `columns.tsx` and log the overlap.
