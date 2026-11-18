# Workstream 5: images & datasheets

## Goal

Every entry that can have a product image has one, with structured
`{file, source, credit, license?}` attribution, processed by
`scripts/crop-image.ts` into small WebP files under `public/database-images/`.
Every part that has a datasheet (pixels, pixel ICs, level converters,
connectors, microboards, …) has `datasheet.url`. Images display well in tables
(thumbnails), entry pages and the designer. The R2 datasheet mirror is ready to
switch on the moment Cameron supplies credentials.

Part of `plans/website-buildout.md` (workstream 5).

## Environment / context

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-assets-2f1e4d009a2dad75`, branch `ws/assets`.
- Ship: rebase onto `origin/master`, `git push origin HEAD:master` (fast-forward only). Every push deploys production.
- Checks before every push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:e2e` (Playwright).
- Coverage report: `bun run coverage:assets` (`--missing [category]`, `--json`) — `scripts/asset-coverage.ts`.
- Image schema: `database/_schema/common.json#/definitions/image_object` (`file`, `source`, `credit`, `license`).
- Mirror pipeline: `scripts/mirror-datasheets.ts`, `.github/workflows/mirror-datasheets.yml`, `docs/datasheet-mirroring.md`.
- Timestamps: commits that touch rows without reviewing them go in `IGNORED_COMMITS` (`app/lib/data.ts`).

## Decisions already made (don't re-ask)

- Images live in git as optimized WebP (≤1200 px, ≤200 KB); datasheet PDFs never do (R2 mirror). From OVERHAUL-PLAN "Asset strategy".
- R2/Cloudflare: Cameron's explicit per-change yes, account-owned API token. This thread stages, never applies.
- Image sources allowed by the brief: manufacturer/vendor pages for that product, or permissively licensed sources. Skip anything we can't legitimately use.

## Image sourcing policy (this stream's rules)

In order of preference:

1. **Openly licensed** photos of the exact product: SparkFun product photos
   (CC BY 2.0), Wikimedia Commons (check the file's own license), open-hardware
   repos whose license covers their images. Record `license` exactly
   (e.g. `CC BY 2.0`, `CC BY-SA 4.0`).
2. **The maker's or an authorized vendor's own product photo** of that product,
   from its product page. `credit` = the company, `source` = the product page,
   no `license` (rights stay with the owner; used to identify the product).
3. **Skip**: marketplace listings re-hosting someone else's photo
   (AliExpress/Amazon/eBay resellers), watermarked images of a third party,
   stock photos, renders of a different variant, forum/blog photos with no
   license, pages whose terms forbid reuse.

Every new image uses the object form. `license` only when a license is actually
stated. CC licenses need attribution + license name + "changes made" on display,
so the entry page shows them (see Plan step 4).

## Plan / steps

1. [x] Coverage script + baseline numbers.
2. [ ] Tooling: `scripts/add-image.ts` (fetch → crop → WebP → YAML `images:` block → preview PNG); validator checks (image file exists, no orphans, size budget).
3. [ ] Datasheet field for level converters, connectors, microboards, pixel decoders (shared `common.json` definition); datasheet column in those tables.
4. [ ] Display: build-time thumbnails; thumbnail in table name cells; entry-page gallery + license/credit line; designer uses thumbnails.
5. [ ] Research batches (parallel agents) per category: images + datasheets. ← current
6. [ ] Mirror prep: local end-to-end test against a mock S3, `--check` mode, fallback to `datasheet.sources`, prettier-clean YAML output, timestamp-safe bot commits.
7. [ ] Step-by-step for Cameron (R2 bucket, token, secrets) — ask.
8. [ ] Final coverage numbers, docs (CONTRIBUTING image section, README), ROADMAP.

## Coverage

### Before (2026-11-18, `origin/master` 44a6f99)

| Category            | Entries |   Image | Attributed | Open license |   Datasheet | Mirrored |
| ------------------- | ------: | ------: | ---------: | -----------: | ----------: | -------: |
| adapters            |      45 |  1 (2%) |          0 |            0 |           — |        — |
| commercial-systems  |      18 |  0 (0%) |          0 |            0 |           — |        — |
| connectors          |      45 |  1 (2%) |          1 |            0 |           — |        — |
| controllers         |     135 | 10 (7%) |          4 |            0 |           — |        — |
| diffusive-materials |      45 |  0 (0%) |          0 |            0 |           — |        — |
| drive-libraries     |      29 |  0 (0%) |          0 |            0 |           — |        — |
| level-converters    |       9 |  0 (0%) |          0 |            0 |           — |        — |
| microboards         |      36 |  3 (8%) |          3 |            0 |           — |        — |
| pattern-drivers     |      40 |  0 (0%) |          0 |            0 |           — |        — |
| pixel-decoders      |      12 |  0 (0%) |          0 |            0 |           — |        — |
| pixel-ics           |      41 |  0 (0%) |          0 |            0 |    10 (24%) |        0 |
| pixels              |      36 |  3 (8%) |          3 |            0 |    28 (78%) |        0 |
| **Total**           |     491 | 18 (4%) |         11 |            0 | 38/77 (49%) |        0 |

Only pixels and pixel ICs had a `datasheet` field at all.

### After

(filled in at the end)

## Findings / gotchas

- Table images were hover-preview only (full-size WebP); no thumbnails anywhere.
- Designer `DesignDiagram.tsx` hard-codes `https://list.awesomeled.xyz/database-images/` (SVG export needs absolute URLs).
- The mirror script writes `retrieved: "…"` (double quotes) — prettier/lint want single quotes; the workflow validates but doesn't format.
- Bot mirror commits touch YAML rows without reviewing them → would bump "Reviewed" dates unless ignored.

## Progress log

- [x] 2026-11-18: read plans, surveyed code, baseline coverage.

## Open questions for the user

(none yet)

## Things not to do

- Don't touch Cloudflare, R2, DNS or repo secrets. Stage and ask.
- Don't use the user's Chrome for scraping (keep off the screen).
- Don't commit original full-size downloads; only the processed WebP.
