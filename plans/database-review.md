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

## Plan / steps

1. ✅ Orient: read plans/docs, census every category.
2. ✅ CI runs `bun run validate`; ajv-formats enforces uri/date; examples validated.
3. ✅ Packages standardized (`0bb3346`).
4. ✅ Shared output/power/connector/diy definitions (`7d3bad0`); pixel decoders structured (`64a0d09`).
5. ✅ issues.txt: F-Test → pixel-decoders, Flex Pixel Driver 1, Baldrick inputs.
6. **(current)** Package datasheet corrections (data commits; research in notes).
7. Diffusive materials: `materials` list, boolean `flexible`, ratings, tints, thickness with units, `status`; then per-entry corrections and the Silicone Sealant / LD45 merge. Closes the last issues.txt item → delete issues.txt.
8. Adapters: outputs/power adopt shared shapes (`pixel_types`/`description` → `outputs.clocked`, `max_channels` → `outputs.count`, connectors carried as strings), `diy_or_ots` enum; Pi Hat, M4/M8 facts.
9. Duplicate products: keep/merge per pair (claimed in ISSUES.md); record removed entries' sheet rows.
10. Controllers: `inputs.physical` key vocabulary, `inputs.protocols` DMX → DMX512, storage types, creator spelling, warranty case.
11. Remaining categories: connectors (AWG ints, pcb_mount, rows, IP ratings, pitch lengths, enums), microboards (memory grammar, connectivity enums, PoE boolean, BMS), pattern drivers (I/O direction enum, visualizer, pricing, demo, language), commercial systems (color types, dimming bits, creator URL), level converters (packages, electrical grammar), pixels/pixel ICs (brightness bits/method, unit trailing zeros, creators), drive libraries (language; not supported_ics).
12. Cross-cutting: shared attribution definitions (creator/vendors/links uri formats), unit formatting convention, `app/lib/types.ts` stale flat interfaces.
13. Docs: CONTRIBUTING.md schema reference, `database/_schema/README.md`, OVERHAUL-PLAN.md (pixel_rate_max done), TODO.md.

## Progress log

- [x] 2026-11-18: oriented; plan created; census of all 12 categories.
- [x] CI validation + formats + example validation (`931864c`); E2E_PORT (`6a53139`).
- [x] Packages (`0bb3346`, ignored in `d6f09fc`).
- [x] Shared definitions (`7d3bad0`); pixel decoders (`64a0d09`, ignored in follow-up).
- [x] F-Test (`3c1f084`), Flex Pixel Driver 1 (`c13218a`), Baldrick (`2222e62`).
- [ ] Package corrections from datasheets.
- [ ] Diffusive materials.
- [ ] Adapters.
- [ ] Duplicates.
- [ ] Controllers vocabulary.
- [ ] Remaining categories.
- [ ] Cross-cutting + docs.

## Open questions for the user

(none yet)

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

Not merged yet: the ESPArtStick group (`adapters/espartstick`, `controllers/espartstick`, `adapters/espartstick-wled`) disagrees on output count (2 vs 6); research pending.
