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
- Checks before every push: `bun run validate`, `bun run lint`, `bunx prettier --check . --end-of-line auto` (plain `format:check` fails on Windows CRLF working copies), `bun run typecheck`, `E2E_PORT=5273 bun run test:e2e --workers=1` (parallel workers time out while 7 streams load the machine; one worker passes).
- My dev server / e2e port: 5273 (announced in `~/.claude/skills/workspace-contention/active-agents/`).
- Schemas: `database/_schema/*.json` (draft-07, AJV + ajv-formats via `scripts/validate.ts`); shared defs in `common.json`. `_example.yaml` files are validated except those in `STALE_EXAMPLES` (validate.ts), which shrinks as categories are migrated.
- Migrations: `scripts/migrations/<date>-<topic>.ts` using `scripts/migrations/lib.ts` (comment-preserving; unchanged top-level blocks keep their original bytes; root keys inserted in lint order). Re-runnable no-ops.
- IGNORED_COMMITS: my block in `app/lib/data.ts` sits under "Database review & standardization" (not at the list end, where other streams append). Push the migration commit first, then add its (now stable) hash in a follow-up commit.
- UI consumers: `app/lib/columns.tsx`, `app/components/ui/FeatureBadges.tsx`, `app/routes/entry.tsx`, `app/lib/designer.ts` (stream 3), `app/lib/relations.ts` (stream 4).

## Decisions already made (don't re-ask)

- `pixel_rate_max` is derived at load time (`deriveFields` in `app/lib/data.ts`), never stored (commit `a1cd65f`, before this stream).
- Structural/migration commits are separate from per-entry data commits; non-review batch commits go into `IGNORED_COMMITS`.
- Pattern-driver subcategories are Cameron's parked decision: recommendation only.
- **Field ownership (stream 4, cross-links, per ISSUES.md)**: controllers' `outputs.protocols`, `software.firmware`/`works_with`, `inputs.requires_host`, `outputs.driver.IC`, free-text `outputs.connector`; drive libraries' `supported_ics`; `related*`, `aliases`, `sources`; pixels'/pixel ICs' `data.type`; adapters' host boards (`parent`) and connectors. I don't batch-edit those. Spelling variants there are handled by `app/lib/relations.ts` name matching.
- Package naming: IC packages LCSC-style with pin count (`SOP-8`, `QFN-16`); LED packages as footprint codes (`5050`) or through-hole size (`5mm`). Keep the datasheet's family (SOP vs SOIC).
- Clocked vocabulary: pixels/pixel ICs `data.clocked: boolean`; boards' `outputs.clocked`: `false` (single-wire) / `selectable` / `always` (common.json `clocked_support`). Prose term for non-clocked: "single-wire" ("async" accepted in comments).

## Findings / gotchas

- `inputs: 3` on Baldrick8/17 (flat schema) = 3 external trigger inputs; the nested migration dropped it (B8) or misread it as buttons (B17). Fixed.
- The sheet itself has shifted rows (Adapters "Pi Hat", Pixel Decoders "PixFog", Diffusive "Silicone Sealant"): values landed in the wrong columns. Treat those rows' data as suspect.
- Adapters' sheet "Outputs" column (Single/Both/Clocked/DMX) is a normalized copy of "Pixel Types", not single-ended vs differential.
- Diffusive sheet header says "Sample thickness (inches)", but PEX/PP pipe "3.2" values are mm.
- `git add` with a path that no longer exists (after `git mv`) aborts the whole add: the F-Test commit first went out with the rename only. Fixed with a fixup + autosquash before push. Stage moved files by their new path only.
- Research agents' `curl` can drop files into the worktree; tell them to use the scratchpad.
- A plain `yaml` re-stringify can't round-trip the database (files mix folded and long prose lines); the block-splice in `lib.ts` does (verified: no-op over all entries is byte-identical).
- `JSON.stringify` + prettier on a schema file reformats every compact object; edit schema JSON as text.
- **The sheet's Controllers "Interface" column was sorted on its own** (values run alphabetically down the sheet while rows are ordered by price), so imported controller inputs were often another product's. Every controller was re-audited against makers' docs ([database-review-inputs-audit.md](database-review-inputs-audit.md)). Never trust or restore that column (ISSUES.md says so too).
- In common.json, refs must be fully qualified (`common.json#/definitions/x`): AJV resolves local `#/...` fine, but the table's field catalog (`app/lib/fields.ts`, stream 7) resolves file-less refs in the category schema. Category-local defs (diffusive `#/definitions/rating`) are fine as local refs.
- Fixed-key maps (common.json `input_interfaces`) are listed in `KEY_MAP_DEFS` in `app/lib/fields.ts` so the table keeps one "Interfaces" facet instead of a column per key.
- Other streams edit the same YAML constantly: rebase conflicts are routine. Resolve by taking upstream's file and re-running my (idempotent) migration on it, or merging their `sources`/`price_source`/`images` into my version. Never push mid-rebase: `scratchpad/ship.sh` (fetch, rebase-or-stop, install, validate, typecheck, push) refuses on any failure; a plain `git rebase | tail && git push` once pushed past a stopped rebase.
- E2E under load: run with `--workers=1`; parallel workers time out. One serial-run flake (designer power warnings) passes alone.

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
10. **(current)** Pi Hat (adapters) from research; then remaining categories: connectors (AWG ints, pcb_mount, rows, IP ratings, pitch lengths, enums), microboards (memory grammar, connectivity enums, PoE boolean, BMS), pattern drivers (I/O direction enum from research, visualizer, pricing, demo, language), commercial systems (color types, dimming bits, creator URL), level converters (packages from research, electrical grammar), pixels/pixel ICs (brightness bits/method, unit trailing zeros, creators), drive libraries (language; not supported_ics).
11. Cross-cutting: shared attribution definitions (creator/vendors/links uri formats), unit formatting convention, `app/lib/types.ts` stale flat interfaces.
12. Docs: CONTRIBUTING.md schema reference, `database/_schema/README.md`, OVERHAUL-PLAN.md (pixel_rate_max done), TODO.md (both items done).

## Progress log

- [x] 2026-11-18: oriented; plan created; census of all 12 categories.
- [x] CI validation + formats + example validation; E2E_PORT.
- [x] Packages: standardized (`0bb3346`), datasheet corrections, maker fixes (TLS3001, PL9823).
- [x] Shared definitions; pixel decoders (`64a0d09`).
- [x] issues.txt items; issues.txt deleted.
- [x] Diffusive materials (`2c469a1`), corrections, LD45 merge.
- [x] Adapters (`3b9da1a`); terminology lint no longer rewrites URLs (`a000cd1`).
- [x] Duplicates merged; removed-entry map below.
- [x] Input vocabulary (`df38d67`); field-catalog regressions fixed; controller inputs audit applied (`afe02c4`).
- [ ] Pi Hat.
- [ ] Remaining categories (see step 10).
- [ ] Cross-cutting + docs.

## Open questions for the user

1. `controllers/dmx-core` (a network show controller) and `controllers/pixout-server` (an Art-Net recorder/player) drive no pixels (stream 4's finding, confirmed by the inputs audit). Recommendation: treat them as "players", the same bucket as the parked pattern-driver `kind` question (sequencer / live-VJ / player / ...): if pattern drivers get a `kind` field, move both there as hardware players; until then keep them in controllers with the false pixel outputs removed. Your call, since it's tied to the parked decision.

## Things not to do

- Don't store derived fields (`pixel_rate_max`, `foss`).
- Don't rewrite YAML with a plain `parse`/`stringify` round-trip: use `scripts/migrations/lib.ts`.
- Don't batch-edit stream 4's link fields (see Decisions).
- Don't decide pattern-driver subcategories.
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

`adapters/espartstick` stays: it is the earlier 2019 shield (no SD card), a different product.
