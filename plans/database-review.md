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

## Environment / context

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-database-review-33c6178cfaf35956`, branch `ws/database-review`.
- Ship: rebase onto `origin/master`, `git push origin HEAD:master` (fast-forward only, never force). Every push deploys production.
- Checks before every push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:e2e`.
- Schemas: `database/_schema/*.json` (draft-07, AJV via `scripts/validate.ts`); shared defs in `common.json`.
- Loader: `app/lib/data.ts` (derives `foss`, `pixel_rate_max`; `IGNORED_COMMITS` for the "Reviewed" column).
- UI consumers: `app/lib/columns.tsx` (table columns/filters/sort), `app/components/ui/FeatureBadges.tsx` (badges), `app/routes/entry.tsx` (detail pages), `app/lib/designer.ts` (designer reads clocked/voltage/etc.).
- Root-level YAML key order is lint-enforced (`eslint.config.js`): name, status, release_year, creator, developer, manufacturers, vendors, notes, inputs, outputs, power, then the rest.
- Edit YAML with the `yaml` Document API (`parseDocument`) so comments survive migrations.
- Field census tool (scratch, re-creatable): walks every entry and prints each leaf path's value distribution. Used to find inconsistent spellings.

## Decisions already made (don't re-ask)

- `pixel_rate_max` is derived at load time (`deriveFields` in `app/lib/data.ts`), never stored; the schema rejects stored copies. Done before this stream (commit `a1cd65f`). OVERHAUL-PLAN.md still lists it as open: fix that doc.
- Structural/migration commits are separate from per-entry data commits; non-review batch commits go into `IGNORED_COMMITS` in a follow-up commit (CLAUDE.md rule).
- Pattern-driver subcategories (`kind` field vs category split) are Cameron's parked decision: bring a recommendation, don't decide.

## Findings so far

### issues.txt items

- `controllers/f-test`: only `name`, `status: unknown`, `creator` PixelController. Belongs in pixel-decoders (F-Test is a pixel tester/decoder board). Needs research.
- `controllers/flex-pixel-driver`: name should be "Flex Pixel Driver 1", manufacturer Elation Lighting, interfaces wrong. Needs research.
- "Some controllers have inputs": in March 2026 the flat schema had a stray `inputs: 3` on Baldrick8/17 (from the Feb attribution batch `e2eb1e6`). The nested migration turned Baldrick17's into `buttons: 3` and silently dropped Baldrick8's. The nested `inputs` object is now legitimate on 135/136 controllers. Remaining work: verify what the "3" is on the vendor pages and record it correctly on both boards.
- Diffusive materials: see the category section below.

### Cross-cutting

- CI (`.github/workflows/deploy.yml`) does not run `bun run validate`, so a schema-invalid entry can deploy. Add it.
- `app/lib/types.ts` entry interfaces (ControllerEntry, PixelEntry, ConnectorEntry) describe the old flat schema; check for users and delete or regenerate.
- CONTRIBUTING.md schema reference and examples are the old flat schema (and say `npm`). Rewrite against the nested schemas.
- Clocked/async vocabulary differs per category: pixels/pixel-ics `data.clocked: bool`; controllers `outputs.clocked: always|selectable|false`; adapters `outputs.pixel_types` free text ("Single", "Single or Clocked", "single +clocked", "Single (8) or Clocked (6)", "2", "Panel", …); pixel-decoders `outputs.pixel_types` used as a free-text description.

### Per category (census)

- **pixel-ics**: `physical.package_size` joined strings ("SOP16/QFN16", "SOP8/10/14", "SOIC8/DIP8", "SO14/DIP14", "SOP8,CPC8") plus a parallel `package_sizes` array on 2 entries; `pin_count` strings ("8/10/14", "10/16"); `data.type` used on 10 of 43.
- **pixels**: `physical.package_size` joined strings ("5050, 3535, 2020", "5050 & 2020", "5/8mm T style") alongside a `package_sizes` array on most entries (duplicate data).
- **diffusive-materials**: `material_type` 34 distinct spellings for ~15 polymers, often several in one string ("PMMA, PET", "PET,PVC,PC, TPU", "PC ?"); `physical.flexible` "F"/"R"; optical 1–5 ratings mix ints and range strings ("3-4", "2 - 5", "3/4"); `optical.tinted` "T"/"C"/"T&C"; `physical.sample_thickness` mixes mm and inches with no unit (0.004 = printer paper in inches) plus "2mm", ".125-.220", "variable"; `physical.properties` 6 free values; no `status` field. Suspected row shift: "Silicone Sealant" has the Plastazote link, XLPE material and "Great for costumes" notes. `bubble-wrap` links.product is "Bubble wrap - Wikipedia" (not a URL). File `polyethelene.yaml` misspelled. "Plastic \` glass\` Shards" name has stray backticks.
- **adapters**: `diy_or_ots` "OTS"/"DIY"/"Yes"/"Both"; `parent` free text (26 spellings of a few platforms); `outputs.pixel_types` (see above); `outputs.description` "Both"/"Single" (likely single-ended vs differential: confirm against the sheet header); `outputs.connectors` free text; `power.voltage`/`power.current` not on the shared quantity grammar ("5V / 12-24V (jumper-selectable)").
- **pixel-decoders**: `outputs.pixel_types` holds descriptions; `outputs.description` holds the output kind (PWM/Data/DMX/Relay); `outputs.connectors` free text; `diy_or_ots` OTS/DIY.
- **level-converters**: `io.interface` holds packages ("PDIP largest", "SOT 23", "Through-Hole DIP") or signalling ("Differential Pairs"); `electrical.*` not on the quantity grammar.
- **commercial-systems**: `specs.color_type` "RGB W/WW", "RGB/RGBW/WW", "RGB/W"; `specs.dimming_resolution` "8 Bit"/"13 Bit"/"16bit or 8 bit"; `core_tech` mixes protocol, IC and "Proprietary"; creator "https://www.lucenti.lighting/products" is a URL; `pricing.online_pricing` deprecated but still used once.
- **controllers**: `inputs.physical` keys inconsistent (DMX vs DMX512, "RF Remote" vs "RF remote", "SD Card" vs microSD, Switch/Switch Trigger/Trigger inputs/triggers, buttons); `inputs.protocols` "DMX" vs "DMX512"; `outputs.connector` 28 free strings beside 81 refs; `data.storage[].type` SD/uSD/Flash; creator "SmartShow" vs "Smartshow"; vendor warranty "5 Years"/"5 years"; `outputs.protocols` "APA-106" vs "APA106", "WS281x"; Wi-Fi `true` vs "2.4GHz".

## Plan / steps

1. ✅ Orient: read plans/docs, census every category. **(current: finishing census of connectors, microboards, pattern-drivers, drive-libraries, pixels, pixel-ics)**
2. issues.txt items, each researched against vendor pages (one data commit per entry).
3. Add `bun run validate` to CI.
4. Shared vocabularies in `common.json` (signal type, packages, interface keys, …) and per-category schema tightening, each as: schema + migration (structural commit) → UI update → IGNORED_COMMITS follow-up.
5. Per-entry fact fixes found along the way (separate data commits, verified against sources).
6. Docs: CONTRIBUTING.md schema reference, OVERHAUL-PLAN.md, TODO.md, `database/_schema/README.md`.

## Progress log

- [x] 2026-11-18: oriented; plan created; census of all 12 categories started.

## Open questions for the user

(none yet)

## Things not to do

- Don't store derived fields (`pixel_rate_max`, `foss`).
- Don't rewrite YAML with a plain `parse`/`stringify` round-trip: it drops comments. Use `parseDocument`.
- Don't decide pattern-driver subcategories.
