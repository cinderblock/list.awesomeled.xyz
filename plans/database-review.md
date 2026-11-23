# Database review & standardization (workstream 2)

## Goal

Make the YAML database clean, consistent and strongly typed, so the site beats
the old Google Sheet on data quality and so filters, sorting and badges can
trust the fields. Scope (from `plans/website-buildout.md` and TODO.md
"Complete database review and possible refactor"):

1. Fix and remove every item in `database/issues.txt`.
2. TODO "Standardize IC packages" and "Standardize Async / clocked".
3. Diffusive materials: material-type naming, list vs string, boolean `flexible`.
4. Controllers with stray `inputs`.
5. Full schema review of `database/_schema/` across all 12 categories: tighten
   loose strings into enums/structured types where the data supports it, kill
   inconsistent spellings/units, decide derived-vs-stored fields, and make the
   UI (filters, sorting, badges) use the improved types.
6. Verify facts against datasheets/vendor pages whenever a value is touched.

Research findings with sources: [database-review-research.md](database-review-research.md).

## Environment / context

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-database-review-33c6178cfaf35956`, branch `ws/database-review`.
- Ship: rebase onto `origin/master`, `git push origin HEAD:master` (fast-forward only, never force). Every push deploys production.
- Checks before every push: `bun run validate`, `bun run lint`, `bunx prettier --check . --end-of-line auto` (plain `format:check` fails on Windows CRLF working copies), `bun run typecheck`, `bun run test:unit`, e2e with `--workers=1` (parallel workers time out while 7 streams load the machine). All of it runs in `scratchpad/ship-wt.sh <commit>`, which ships from a second worktree (see Findings).
- Ports: 5273 for the main worktree's dev server, 5274 for the ship worktree's e2e (announced in `~/.claude/skills/workspace-contention/active-agents/2ef4421f.md`).
- Schemas: `database/_schema/*.json` (draft-07, AJV + ajv-formats via `scripts/validate.ts`); shared defs in `common.json`; how to change one: `database/_schema/README.md`. Every `_example.yaml` is validated.
- Sheet parity (stream 1's tool): `bun run sheet-parity` fetches the live sheet and rewrites `plans/spreadsheet-parity/report.md`; `scripts/sheet-parity/columns.ts` maps sheet columns to YAML paths (with custom comparison kinds), `aliases.ts` pairs renamed rows, `acks.yaml` records deliberate differences. My changes must leave it at zero open differences.
- Migrations: `scripts/migrations/<date>-<topic>.ts` using `scripts/migrations/lib.ts` (comment-preserving; unchanged top-level blocks keep their original bytes; root keys inserted in lint order). Re-runnable no-ops.
- IGNORED_COMMITS: my block in `app/lib/data.ts` sits under "Database review & standardization" (not at the list end, where other streams append). Push the migration commit first, then add its (now stable) hash in a follow-up commit.
- UI consumers: `app/lib/columns.tsx`, `app/components/ui/FeatureBadges.tsx`, `app/routes/entry.tsx`, `app/lib/designer.ts` (stream 3), `app/lib/relations.ts` (stream 4).

## Decisions already made (don't re-ask)

- `pixel_rate_max` is derived at load time (`deriveFields` in `app/lib/data.ts`), never stored (commit `a1cd65f`, before this stream).
- Structural/migration commits are separate from per-entry data commits; non-review batch commits go into `IGNORED_COMMITS`.
- Pattern drivers get a `kind` field, not a category split (Cameron, 2026-11-22): one value or a list from `sequencer` / `live` / `player` / `music-reactive` / `on-controller`, shown as the Kind column ("Live / VJ" etc.) with a filter. `music-reactive` means built for it, not "has an audio-reactive effect". DMX Core 100 and the Pixout recorder moved to pattern drivers as players (same day).
- **Field ownership (stream 4, cross-links, per ISSUES.md)**: controllers' `outputs.protocols`, `software.firmware`/`works_with`, `inputs.requires_host`, `outputs.driver.IC`, free-text `outputs.connector`; drive libraries' `supported_ics`; `related*`, `aliases`, `sources`; pixels'/pixel ICs' `data.type`; adapters' host boards (`parent`) and connectors. I don't batch-edit those. Spelling variants there are handled by `app/lib/relations.ts` name matching.
- Package naming: IC packages LCSC-style with pin count (`SOP-8`, `QFN-16`); LED packages as footprint codes (`5050`) or through-hole size (`5mm`). Keep the datasheet's family (SOP vs SOIC).
- Clocked vocabulary: pixels/pixel ICs `data.clocked: boolean`; boards' `outputs.clocked`: `false` (single-wire) / `selectable` / `always` (common.json `clocked_support`). Prose term for non-clocked: "single-wire" ("async" accepted in comments).
- Pattern-driver I/O directions keep the sheet's readable `Input` / `Output` / `Both`, plus `false` for a checked "not supported" (blank = unknown). Lowercase tokens would need relabeling in every UI; these display as-is.
- "One or a list" for multi-valued facts: `language`, commercial `color_type`, `channel_bits` / `dimming_bits` (selectable depths), microboard `ram`. A plain value when there is one.
- Family entries (a connector series, an IC with several package suffixes): ratings take the family's highest member, variants go in `*_notes`; packages list every package the entry's aliases name.
- Mains-powered controllers: `power.ac: true`, `power.voltage` = the AC range their built-in supply takes, `power.output_voltage` = the DC rail on the pixel outputs (a list when versions differ), `power.current.max` = what the board passes to its outputs. The designer checks pixels against the built-in rail.
- `electrical.wattage` on pixels is the maker's whole-pixel figure ("0.2Watt Power"); one channel's VCC x current (the sheet's formula) is derivable from `channel_current` and was removed where no maker figure exists. The designer prefers channel current and spreads a lone wattage over the channels.
- Attribution is shared: `common.json` `organization` / `vendor` / `creator` / `manufacturers` / `vendors` (name required on objects, URI formats, unique lists); each category keeps its own column-tooltip description.
- Quantities carry their unit everywhere except controllers' and adapters' `power.voltage` / `power.current` / `outputs.current`, which are bare volts and amps (consistent per field; `app/lib/quantity.ts` reads both). Not migrating: ~200 entries and the designer for no change in meaning.
- Duplicates take the slug that fits their siblings: the Pi 3 Model B is `microboards/raspberry-pi-3-model-b` (cross-links' `raspberry-pi-3b` merged into it).
- Slugs are URLs: a misspelled slug stays once its display name is right (`controllers/luminaxa` shows "Luminxa"); the site has no redirects, so renaming would break links for no gain.
- Verified corrections carry `sources.<field>` on the entry; the full records (quotes, URLs, rejected and unverifiable items) live in `plans/database-review-fixes/*.yaml` (excluded from eslint so quotes stay verbatim).
- Controllers have no `aliases` field (stream 4's infrastructure); a real former name goes in the notes instead.

## Findings / gotchas

- `inputs: 3` on Baldrick8/17 (flat schema) = 3 external trigger inputs; the nested migration dropped it (B8) or misread it as buttons (B17). Fixed.
- The sheet itself has shifted rows (Adapters "Pi Hat", Pixel Decoders "PixFog", Diffusive "Silicone Sealant"): values landed in the wrong columns. Treat those rows' data as suspect.
- Adapters' sheet "Outputs" column (Single/Both/Clocked/DMX) is a normalized copy of "Pixel Types", not single-ended vs differential.
- Diffusive sheet header says "Sample thickness (inches)", but PEX/PP pipe "3.2" values are mm.
- Pattern-driver kinds: judgment calls the research flagged, kept as classified: MADRIX 5 `live` (it has cue lists and timelines too), Mapio Pro `live` (playlist decks), LED Strip Studio `sequencer` (strong live control too), WATCHOUT `sequencer` + `player` (also a media server), Lightjams `live` + `music-reactive` (music leads its page), Lumia Stream and ProtoPixel Create `live` (nearest fit). LightDesigner / LightMobile (dead maker site, Microsoft Store listing), LEDEdit (third-party page only) and Faith Chapel (script-only page; inferred from its inputs) have weak sources. Records: `plans/database-review-fixes/pattern-driver-kinds.yaml`.
- `git mv` stages the old content at the new path: a later `git add` of other paths plus `git commit` takes the rename along. Commit a move with its rewritten content in one commit.
- `git add` with a path that no longer exists (after `git mv`) aborts the whole add: the F-Test commit first went out with the rename only. Fixed with a fixup + autosquash before push. Stage moved files by their new path only.
- Research agents' `curl` can drop files into the worktree; tell them to use the scratchpad.
- A plain `yaml` re-stringify can't round-trip the database (files mix folded and long prose lines); the block-splice in `lib.ts` does (verified: no-op over all entries is byte-identical).
- `JSON.stringify` + prettier on a schema file reformats every compact object; edit schema JSON as text.
- **The sheet's Controllers "Interface" column was sorted on its own** (values run alphabetically down the sheet while rows are ordered by price), so imported controller inputs were often another product's. Every controller was re-audited against makers' docs ([database-review-inputs-audit.md](database-review-inputs-audit.md)). Never trust or restore that column (ISSUES.md says so too).
- In common.json, refs must be fully qualified (`common.json#/definitions/x`): AJV resolves local `#/...` fine, but the table's field catalog (`app/lib/fields.ts`, stream 7) resolves file-less refs in the category schema. Category-local defs (diffusive `#/definitions/rating`) are fine as local refs.
- Fixed-key maps (common.json `input_interfaces`) are listed in `KEY_MAP_DEFS` in `app/lib/fields.ts` so the table keeps one "Interfaces" facet instead of a column per key.
- Other streams edit the same YAML constantly: rebase conflicts are routine. Resolve by taking upstream's file and re-running my (idempotent) migration on it, or merging their `sources`/`price_source`/`images` into my version. Never push mid-rebase: `scratchpad/ship.sh` (fetch, rebase-or-stop, install, validate, typecheck, push) refuses on any failure; a plain `git rebase | tail && git push` once pushed past a stopped rebase.
- E2E under load: run with `--workers=1`; parallel workers time out. One serial-run flake (designer power warnings) passes alone.
- **A pipeline masks exit codes**: `e2e | grep | tail; ship.sh` pushed microboards with one e2e failure. Checks now run through `scratchpad/check-ship.sh` / `ship-wt.sh`, which stop on any failed step.
- **Ship from a second worktree** (`scratchpad/ship-wt.sh`): snapshots a commit into `scratchpad/ship-wt`, rebases, runs every check with e2e on port 5274 and pushes, while work continues in the main worktree. Its dev server starts cold, so the first tests can time out on route compiles: e2e runs with `--retries=1` and reports flaky tests.
- The phone-header e2e loads `/controllers` four times; it needed `test.slow()` on a busy machine (fixed).
- `setJS` keeps a replaced node's comment: after a data correction, check the diff for comments that now contradict the value (XT90 "60 A", AN6USPI0 "1020 total"). Replacing a whole map drops comments on its children (Dig-Octa's "48 V only with Power-5HV").
- Re-rendering a block re-quotes its scalars: replacing a list rewrote `retrieved: '…'` dates unquoted. Append to sequences instead; `setJS` now quotes dates.
- Renaming a field must rename its `sources` key too (validate rejects sources for missing fields).
- Other streams keep adding entries in the old shapes after a migration lands (cross-links' 2026-11-18 wave): re-run every migration after each rebase; extend its mappings when a new value appears.
- Files here are CRLF on Windows: string replacements in `bun -e` that include `\n` miss; use the Edit tool, or a Python script (written to a file, not a bash heredoc) that normalizes to LF and writes back the file's own line endings.
- A Claude session ending kills a running ship: the e2e workers die with exit code 3221225794 (0xC0000142, DLL init failed) and the step fails. Check `scratchpad/logs/ship/e2e.log` before assuming a test regression.
- Rebasing my migration commits onto new upstream data: take upstream's file (`git checkout --ours`), re-run that commit's migration, extend its maps when it throws (stream 1's NS ICs needed `IC_CONTROL`; a `sources.color.aggregate_bits` had to merge into `channel_bits`' source), then continue. A later commit that changes the same map lines conflicts again unless the earlier resolution already holds its exact change.
- The fix-applying script must not overwrite a value another stream changed since the record was written: `_tmp-apply-fixes.ts` sends any record whose `current` no longer matches to manual review (LED-Player-M's per-channel limit, which stream 1 had set from the older manual; the current manual, read directly, says 256).
- My typed fields open differences in stream 1's parity report (sheet "8+5" vs `channel_bits` + `brightness_control`, "16bit or 8 bit" vs `[8, 16]`, renamed rows): fix them in the same push with comparison kinds in `columns.ts`, aliases, or acks citing the evidence file, and regenerate the report.
- Sources keyed by list index (`technical_notes.1`) validate but break when the list shifts; key sources by field only.
- The apply script replaces a changed field's source; when the old source still backs part of the new value (Genius Pro's microSD feature), keep both as a list. Check every diff for removed `url:` lines under `sources`.
- Never type a commit hash from memory: copy it from `git rev-parse`. A mistyped tail left the July prose-to-fields batch un-ignored for months (`2c7bf1195c27…` for `2c7bf116f257…`); `tests/unit/ignored-commits.test.ts` now fails on any hash that names no commit.

## Plan / steps

1. ✅ Orient: read plans/docs, census every category.
2. ✅ CI runs `bun run validate`; ajv-formats enforces uri/date; examples validated.
3. ✅ Packages standardized, then corrected from datasheets.
4. ✅ Shared output/power/connector/diy definitions; pixel decoders structured.
5. ✅ issues.txt fully resolved and deleted (F-Test, Flex Pixel Driver 1, Baldrick inputs, diffusive materials).
6. ✅ Diffusive materials typed + researched corrections + Silicone Sealant → Plastazote LD45 merge.
7. ✅ Adapters adopt shared shapes (TODO async/clocked); ESPArtStick researched and merged.
8. ✅ Duplicate products merged (QuinLED ×2, M4-PI ×3, M8-PI, differential receiver, ESPArtStick).
9. ✅ Input vocabulary (controllers + adapters) and the full controller inputs audit (119 entries corrected).
10. ✅ Remaining categories typed: Pi Hat; connectors; microboards; pattern drivers (I/O from research, tags for other I/O, visualizer, language) and drive libraries; commercial systems (color types, dimming bits, release_year); level converters (packages, supply range, direction, drive from TI/Microchip); pixels/pixel ICs (channel_bits, brightness_control, supply_voltage); trailing zeros; every `_example.yaml` validates.
11. ✅ Verified the ~230 "wrong facts" other streams reported (data-freshness findings, ISSUES.md connector list) with 9 research agents; applied per category with sources on the entries (`plans/database-review-fixes/`).
12. ✅ Shipped `5b734cc..6db9e30` (2026-11-20); IGNORED_COMMITS follow-up; stream-5 suspected errors applied; pixels' `wattage` meaning decided; Pi 3 Model B duplicate merged; parity report back to zero.
13. ✅ Cross-cutting: shared attribution definitions; unit convention (documented); stale flat entry types removed; mains-supply convention (`power.ac`, `output_voltage`).
14. ✅ Docs: CONTRIBUTING.md schema reference and value conventions, `database/_schema/README.md`, CLAUDE.md, OVERHAUL-PLAN.md, TODO.md.
15. ✅ Shipped `0507cb7..d1d23db` and `ee64cc8..c6b3a69`; drive libraries' website field (`links.url`) and their repositories; the last research batch (`plans/database-review-fixes/issues-final.yaml`); the mistyped ignored hash fixed with a guard test; ISSUES.md: my sections closed with hashes, hand-offs to streams 3-6, pattern-driver pricing recommendation for stream 6.
16. ✅ Cleanup: temp apply script, ship worktree, backup branches, safety stashes, port marker.
17. ✅ Cameron answered both open questions (2026-11-22): `kind` field (`1de71b94`), every pattern driver classified from its maker's pages (`1d8cad0e`), DMX Core 100 and the Pixout recorder moved to pattern drivers (`b97322c5`); parity still at zero open cells.
18. ✅ Shipped `0c68a3c..6d57a02` (2026-11-22, all checks, 180 e2e) plus a follow-up merging the entry page's link labels with commercial tiers' (`05345ce3` landed alongside). Nothing is open in this stream.

## Progress log

- [x] 2026-11-18: oriented; plan created; census of all 12 categories.
- [x] CI validation + formats + example validation; E2E_PORT.
- [x] Packages: standardized (`0bb3346`), datasheet corrections, maker fixes (TLS3001, PL9823).
- [x] Shared definitions; pixel decoders (`64a0d09`).
- [x] issues.txt items; issues.txt deleted.
- [x] Diffusive materials (`2c469a1`), corrections, LD45 merge.
- [x] Adapters (`3b9da1a`); terminology lint no longer rewrites URLs (`a000cd1`).
- [x] Duplicates merged; removed-entry map below.
- [x] Input vocabulary (`df38d67`); field-catalog regressions fixed; controller inputs audit applied (`de0730f`).
- [x] Pi Hat (`c246e98`); connectors (`795a04f`); microboards (`475d1d0`); phone-header e2e budget.
- [x] Pattern drivers: research data (`0690af1`), structure (`e215cd7`).
- [x] Table enums filter by their cell labels; commercial systems and level converters typed; level-converter datasheet facts; trailing zeros; LPD8806 7-bit; pixels/pixel ICs vocabulary; follow-up for entries added since.
- [x] Fix lists applied: connectors, controllers, microboards/decoders, pixels (SM1616 stub removed), software, adapters/commercial (ElectroMage duplicates merged), Perspex size.
- [x] Pushed `5b734cc..6db9e30` (all checks, 114 e2e); IGNORED_COMMITS follow-up.
- [x] Stream-5 suspected errors: 45 records applied with sources, the rest already fixed, rejected or handed over (`plans/database-review-fixes/stream5-*.yaml`); wattage meaning.
- [x] Pi 3 Model B duplicate merged; parity report at zero open differences again.
- [x] Cross-cutting (attribution, mains supplies, types) + docs.
- [x] Second and third batches shipped (`0507cb7..d1d23db`, `ee64cc8..c6b3a69`; all checks, 114 e2e each); their IGNORED_COMMITS.
- [x] Last research batch applied (`5abe386`).
- [x] ISSUES.md closures and hand-offs.
- [x] Cleanup.
- [x] Open questions 1 and 2 answered and implemented (`1de71b94`, `b97322c5`, `1d8cad0e`).
- [x] Shipped (`0c68a3c..6d57a02`) and the follow-up.

## Open questions for the user

None open. Answered:

1. ✅ (Cameron: ok, 2026-11-22) **Pattern-driver subcategories** (parked in ROADMAP): a filterable `kind` field or a real category split? Recommendation: a `kind` field, one-or-a-list from a closed vocabulary (`sequencer`, `live`, `player`, `music-reactive`, `on-controller`), shown as a badge and a facet. The 56 entries share one schema (I/O directions, protocols, platforms, pricing), and many programs are several kinds at once (LedFx: live and music-reactive; WLED: on-controller and music-reactive), so a split would duplicate the schema and force one bucket per program. Classifying the entries is a research pass once you pick.
2. ✅ (Cameron: ok, 2026-11-22) `controllers/dmx-core` (a network show controller) and `controllers/pixout-server` (the Pixout ArtNet DMX Recorder) drive no pixels (stream 4's finding, confirmed by the inputs audit; their pixel outputs are now gone). Recommendation: they are hardware `player`s: if pattern drivers get `kind`, move both there; until then they stay in controllers without pixel outputs. Depends on question 1.

## Things not to do

- Don't store derived fields (`pixel_rate_max`, `foss`).
- Don't rewrite YAML with a plain `parse`/`stringify` round-trip: use `scripts/migrations/lib.ts`.
- Don't batch-edit stream 4's link fields (see Decisions).
- Don't append to the end of `IGNORED_COMMITS` (conflict magnet); use my block.

## Removed or moved entries (for the parity audit)

| Removed / moved entry                        | Sheet tab: row                                                      | Now covered by                                    |
| -------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------- |
| `controllers/f-test` (moved)                 | Controllers: "F-Test"                                               | `pixel-decoders/f-test`                           |
| `diffusive-materials/silicone-sealant`       | Diffusive Materials: "Silicone Sealant" (row holds Plastazote data) | `diffusive-materials/ld45-plaztazote`             |
| `adapters/quinled-dig-quad`                  | Adapters: "QuinLED-Dig-Quad"                                        | `controllers/quinled-dig-quad`                    |
| `adapters/quinled-dig-uno`                   | Adapters: second "QuinLED-Dig-Uno " row (no maker, 6 outputs, 5 V)  | `controllers/quinled-dig-uno`                     |
| `adapters/m4-port-pixel`                     | Adapters: "M4 Port Pixel"                                           | `controllers/m4-port-pixel` (M4-PI)               |
| `controllers/m4-pi`                          | Controllers: "M4- Pi"                                               | `controllers/m4-port-pixel` (M4-PI)               |
| `adapters/m8-port-pixel`                     | Adapters: "M8 Port Pixel"                                           | `controllers/m8-port-pixel` (M8-PI)               |
| `controllers/standard-differential-receiver` | Controllers: "Standard Differential Receiver"                       | `level-converters/standard-differential-receiver` |
| `adapters/espartstick-wled`                  | Adapters: "EspArtStick WLED" (same product as the controller)       | `controllers/espartstick`                         |
| `pixels/ns107s`                              | Pixels: "NS107S" (Newstar's part number for the HD107S)             | `pixels/hd107s`; IC `pixel-ics/ns107s`            |
| `pixels/ns108`                               | Pixels: "NS108" (Newstar's part number for the HD108)               | `pixels/hd108`; IC `pixel-ics/ns108`              |
| `pixels/ns8808`                              | Pixels: "NS8808" (Newstar's IC in the HD8808 LED)                   | `pixels/hd8808`; IC `pixel-ics/ns8808`            |
| `adapters/serial-led-driver`                 | Adapters: "Serial LED Driver" (ElectroMage, also a controller)      | `controllers/electromage-8x-driver`               |
| `adapters/pro-serial-led-driver`             | Adapters: "Pro Serial LED Driver"                                   | `controllers/electromage-pro-8x-driver`           |
| `pixels/sm1616`                              | Pixels: "SM1616" (no such part; links the SM16716 datasheet)        | `pixel-ics/sm16716`                               |
| `microboards/raspberry-pi-3b`                | none (cross-links' duplicate of the Pi 3 Model B)                   | `microboards/raspberry-pi-3-model-b`              |
| `controllers/dmx-core` (moved)               | Controllers: "DMX Core"                                             | `pattern-drivers/dmx-core`                        |
| `controllers/pixout-server` (moved)          | Controllers: "PixOut Server"                                        | `pattern-drivers/pixout-server`                   |

`adapters/espartstick` stays: it is the earlier 2019 shield (no SD card), a different product.
