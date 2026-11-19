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

1. **Openly licensed** photos of the exact product: Wikimedia Commons (check
   the file's own license; SparkFun's Flickr uploads are mirrored there as
   CC BY 2.0), open-hardware repos whose license covers their images. Record
   `license` exactly (e.g. `CC BY 2.0`, `CC BY-SA 4.0`). Photos taken from
   sparkfun.com itself are **CC BY-NC-SA 3.0** (SparkFun news posts 735/1852),
   not CC BY 2.0 — the brief originally said otherwise; corrected 2026-11-18
   and all agents told.
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

1. [x] Coverage script + baseline numbers (`bun run coverage:assets`).
2. [x] Tooling: `bun run add-image` (fetch → crop → WebP → YAML `images:` block → checkerboard preview; `--attribute-only` for legacy files). Pushed.
3. [x] Shared `datasheet` schema block, now also on connectors, level converters, microboards, pixel decoders; datasheet icon in those tables. Pushed.
4. [x] Display: build-time thumbnails (`scripts/thumbs.ts`, 240/480 px, never committed); thumbnail before each table name; 480 px hover preview; entry hero 480 px + gallery strip + license/"cropped" credit; designer uses thumbnails (and DIY boards' images now resolve). Pushed 032204a.
5. [ ] Research batches (10 parallel agents, one per category batch) — images + datasheets. ← current
   - Agent brief: `<scratchpad>/assets-agent-brief.md`; per-batch reports in `<scratchpad>/assets-reports/`.
   - Done: converters-decoders (20/21 images, 10 datasheets) → committed 8edae09 (not pushed yet).
   - Running: controllers-a/b/c, adapters, connectors, microboards, pixels, pixel-ics, systems-diffusers.
6. [ ] Validator image checks (file exists, WebP, ≤1200 px, ≤256 KB, source+credit required, no orphans). Written in the agent tree's `scripts/validate.ts`, uncommitted: lands after the 7 legacy bare images get attribution (controllers-a + adapters batches).
7. [x] Mirror prep: `--check`/`--only`, `datasheet.sources` fallback (`mirror.fetched_from`), curl fallback, `R2_ENDPOINT`, single-quoted dates, end-to-end test vs mock S3 (`tests/unit/mirror-datasheets.test.ts`). Pushed.
8. [ ] Mirror bot commits must not bump "Reviewed" dates (workflow: commit trailer or IGNORED_COMMITS follow-up) + prettier the rewritten YAML in the workflow.
9. [ ] Step-by-step for Cameron (R2 bucket, account-owned token, repo secrets) — ask.
10. [ ] Final coverage numbers, docs (CONTRIBUTING image section, `public/database-images` README), ROADMAP.

## Working method (two worktrees)

- **Agent tree** = this thread's worktree (`ws/assets`). Research agents edit YAML + images there, uncommitted. Its branch can't be rebased while agents run.
- **Integration tree** = `<scratchpad>/verify` (detached HEAD on top of `origin/master`). Code commits are made/cherry-picked here; agent data is ported with `<scratchpad>/port-assets.ts <agentTree> <verify> <category…>` — a three-way port of only the `image`/`images`/`datasheet` root blocks + image files onto the current upstream YAML (flags conflicts and non-asset edits).
- Checks before push: `bash <scratchpad>/verify-checks.sh <verify>` (validate, lint, format, typecheck, unit, e2e on private port 5291 with `--workers=1` — the 10 agents load the machine enough that parallel e2e workers time out in `newPage`).
- Push: `git push origin HEAD:master` from the integration tree; upstream moves every few minutes, so rebase and re-run when it touches the same files.

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

- Table images were hover-preview only (full-size WebP); no thumbnails anywhere. Designer loaded full 100–200 KB originals into 42 px cards.
- Designer `DesignDiagram.tsx` hard-coded `https://list.awesomeled.xyz/database-images/controllers/…` — DIY microboards' images pointed at the wrong folder (fixed).
- Of the 38 pre-existing `datasheet.url` values, 18 failed a real download + `%PDF-` check: product pages (newstar, neon-world, world-semi), an HTML viewer (datasheet4u), a DHgate marketplace page (ucs8903), LCSC links (return HTML to non-browsers), dead hosts. The pixels / pixel-ics agents are replacing them.
- Bun 1.4.4's `fetch` on Windows fails TLS handshakes with some servers (pololu.com: `EPROTO`) that curl and Node handle; `mirror-datasheets` falls back to curl.
- `crop-image.ts` flood fill used `Array.shift()` (quadratic); multi-megapixel photos took minutes. Now linear, and inputs are pre-shrunk to 2400 px.
- The mirror script wrote `retrieved: "…"` (double quotes) — prettier wants single quotes. Fixed.
- A stale incremental `bun install --frozen-lockfile` left a nested `ajv` under `ajv-formats` and broke `tsc` locally (CI was fine); `rm -rf node_modules && bun install` fixed it.
- e2e under load: `newPage` setup timeouts and the 10 s tab-switch assertion flake when many agents run; single-worker runs pass.
- Upstream (stream 2) is merging duplicate entries listed in `ISSUES.md` (quinled-dig-quad/uno, espartstick, m4/m8-port-pixel, standard-differential-receiver). Agents may add images to both copies; whoever removes an entry must remove its image file (the orphan check will flag it).
- Upstream moved `controllers/f-test` to `pixel-decoders/f-test`; the controllers-a agent works on the old path — port its image by hand.

## Progress log

- [x] 2026-11-18: read plans, surveyed code, baseline coverage.
- [x] Tooling + schema + mirror `--check` pushed (3d0a2ee); thumbnails + mirror e2e test pushed (032204a).
- [x] converters-decoders batch reviewed (contact sheet) and committed in the integration tree (8edae09).
- [ ] Remaining 9 agent batches; validator image checks; mirror timestamp handling; Cameron's R2 steps; docs; final numbers.

## Open questions for the user

(none yet)

## Things not to do

- Don't touch Cloudflare, R2, DNS or repo secrets. Stage and ask.
- Don't use the user's Chrome for scraping (keep off the screen).
- Don't commit original full-size downloads; only the processed WebP.
