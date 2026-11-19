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
2. [x] Tooling: `bun run add-image` (fetch → crop → WebP → YAML `images:` block → checkerboard preview; `--attribute-only`; honest UA for Wikimedia).
3. [x] Shared `datasheet` schema block on connectors, level converters, microboards, pixel decoders (stream 2 later added controllers/adapters); datasheet icon in those tables.
4. [x] Display: build-time thumbnails (`scripts/thumbs.ts`, 240/480 px, content-addressed cache, never committed); thumbnail before each table name; 480 px hover preview; entry hero 480 px + gallery strip + credit line with license link and "cropped" note; designer uses thumbnails (DIY boards' images now resolve).
5. [x] Research: 10 parallel agents, one per category batch; every image reviewed on contact sheets; ported onto upstream with a three-way root-key port. Per-entry sources in `plans/assets-research/`.
6. [x] Validator image checks (exists, WebP, ≤1200 px, ≤256 KB, source + credit, no orphans).
7. [x] Mirror prep: `--check`/`--only`, `datasheet.sources` fallback (`mirror.fetched_from`), curl fallback (Git-for-Windows safe), `R2_ENDPOINT`, single-quoted dates, end-to-end test vs mock S3 (`tests/unit/mirror-datasheets.test.ts`).
8. [x] Mirror bot commits keep "Reviewed" dates: `Not-A-Review:` trailer honored by `app/lib/data.ts`; workflow sets it and runs prettier + validate.
9. [x] Docs: CONTRIBUTING "Adding Images", README licence carve-out for product images, `docs/datasheet-mirroring.md` (incl. owner setup), ROADMAP, ISSUES.md (suspected data errors).
10. [x] Pattern-driver screenshots (30/40) and controller/adapter datasheets (54).
11. [ ] R2 setup — Cameron, one step at a time (see Open questions). ← current (blocked on Cameron)

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

### After (2026-11-18 ~9:30 PM PST, `origin/master` 9ef42f2)

Entry counts changed meanwhile (stream 2 merged duplicates and moved entries);
the datasheet columns now include controllers and adapters (stream 2 extended
the shared block to them).

| Category            | Entries |     Image | Attributed | Open license |     Datasheet | Mirrored |
| ------------------- | ------: | --------: | ---------: | -----------: | ------------: | -------: |
| adapters            |      40 |  28 (70%) |         28 |            1 |        1 (3%) |        0 |
| commercial-systems  |      18 | 18 (100%) |         18 |            0 |             — |        — |
| connectors          |      45 |  38 (84%) |         38 |           11 |      36 (80%) |        0 |
| controllers         |     132 | 115 (87%) |        115 |            1 |      53 (40%) |        0 |
| diffusive-materials |      44 |  28 (64%) |         28 |           13 |             — |        — |
| drive-libraries     |      29 |    0 (0%) |          0 |            0 |             — |        — |
| level-converters    |       9 |  9 (100%) |          9 |            0 |       8 (89%) |        0 |
| microboards         |      36 |  32 (89%) |         32 |           13 |     36 (100%) |        0 |
| pattern-drivers     |      40 |  30 (75%) |         30 |            0 |             — |        — |
| pixel-decoders      |      13 |  12 (92%) |         12 |            1 |       2 (15%) |        0 |
| pixel-ics           |      41 |    3 (7%) |          3 |            0 |      34 (83%) |        0 |
| pixels              |      36 |  20 (56%) |         20 |            2 |      32 (89%) |        0 |
| **Total**           |     483 | 333 (69%) |        333 |           42 | 202/352 (57%) |        0 |

- **Images: 18 → 333**, every one attributed (was 11 of 18). Hardware entries: 303 / 414 (73%); pattern drivers 30 / 40 (official app screenshots); drive libraries none by decision (code libraries; a logo isn't a product image).
- **Datasheets: 38 → 202**, every one a verified direct PDF (18 of the original 38 weren't). Part categories (pixels, pixel ICs, level converters, connectors, microboards, pixel decoders): 148 / 180 (82%). Controllers 53 / 132 and adapters 1 / 40: most makers publish web pages, Google Docs or nothing.
- Remaining gaps are deliberate skips with reasons (marketplace-only photos, maker sites that block bots, pixel ICs without real chip photos, standards without an originator's datasheet, unarchived discontinued products): `bun run coverage:assets --missing` and `plans/assets-research/`.

## Findings / gotchas

- **SparkFun licence:** photos on sparkfun.com are **CC BY-NC-SA 3.0** (SparkFun news 735/1852), not CC BY 2.0. Only SparkFun's Flickr uploads (mirrored on Commons) are CC BY 2.0. The original brief had this wrong; the connectors agent caught it before any wrong tag shipped (two sparkfun.com images now carry CC BY-NC-SA 3.0).
- Code licences (MIT/GPL) don't cover photos: repo images were recorded as maker photos without a licence unless a docs/hardware licence (CC BY-SA, CERN-OHL) explicitly covered them.
- Table images were hover-preview only (full-size WebP); the designer loaded 100–200 KB originals into 42 px cards.
- `DesignDiagram.tsx` pointed DIY microboards' images at `controllers/` (fixed).
- 18 of the 38 pre-existing `datasheet.url` values failed a real download + `%PDF-` check (product pages, datasheet4u viewer, a DHgate listing, LCSC links that serve HTML to bots, dead hosts). Product-page URLs moved to `other_links` (keeping their `dead_links` archive) rather than being dropped.
- Bun 1.4.4's `fetch` on Windows fails TLS handshakes with some servers (pololu.com, raspberrypi.com: `EPROTO`); Git for Windows' curl 8.8 exits 43 whenever `-w` is used. The mirror's curl fallback reads the status from dumped headers.
- Wikimedia's upload host 429s browser-imitating User-Agents and only serves standard thumbnail sizes to bots.
- `crop-image.ts` flood fill was quadratic (`Array.shift()`); fixed, and inputs are pre-shrunk.
- Upstream churn: other streams edited the same YAML constantly. Agents worked on an older tree; `<scratchpad>/port-assets.ts` ported only `image`/`images`/`datasheet` blocks three-way, and `<scratchpad>/merge-blocks.ts` resolved rebase conflicts per root key (both sides changing the same key → manual).
- Stream 2 merged duplicate entries mid-pass (QuinLED, M4/M8-PI, standard-differential-receiver; F-Test moved): images were re-homed onto the surviving entries; the validator's orphan check catches leftovers.
- e2e under load: `newPage` setup timeouts and the first-navigation test flake on a cold dev server; single-worker runs pass. Master CI currently fails `table.test.ts` "missing values sort last" (not this stream; logged in ISSUES.md).
- A stale incremental `bun install` left a nested `ajv` under `ajv-formats` and broke `tsc` locally; a clean install fixed it.

## Progress log

- [x] 2026-11-18: read plans, surveyed code, baseline coverage.
- [x] Tooling + schema + mirror `--check` pushed (3d0a2ee); thumbnails + mirror e2e test (032204a).
- [x] converters-decoders, trailer, workflow, docs (c92c4bc).
- [x] pixels, pixel ICs, microboards, connectors, adapters, controllers, validator, CONTRIBUTING/README (a694a76).
- [x] commercial systems, diffusive materials, ISSUES.md (41295f3).
- [x] Pattern-driver screenshots (ea8f9ac); controller/adapter datasheets (9ef42f2).
- [ ] R2 mirror switched on (Cameron).

## Open questions for the user

1. **R2 mirror setup** (blocked on Cameron; infra needs per-change approval). Proposed: bucket `awesomeled-datasheets` declared in the ops IaC (`cloudflare/config/projects/awesomeled.yaml`: `- r2: awesomeled-datasheets`), public custom domain `assets.awesomeled.xyz`, an account-owned R2 token (Object Read & Write, that bucket only), four repo secrets + one variable, Actions allowed to open PRs. Full list: `docs/datasheet-mirroring.md` → "One-time setup". Gap: the ops IaC has no R2 custom-domain support, and its DNS sync manages the `awesomeled.xyz` zone, so a dashboard-made R2 domain record must be declared external there first (or the IaC taught R2 domains). Recommendation: teach the IaC (a small handler), in an ops thread.
   - **Why R2 at all** (Cameron asked, 2026-11-18): so we hold our own copy of each datasheet PDF, plus a sha256 of it, for when a maker moves or deletes the PDF. Makers do this a lot: 18 of the 38 pre-existing links were already bad.
   - **Gap:** nothing on the site displays `datasheet.mirror` yet. `entry.tsx` shows only `datasheet.url` and `sources`, so even a working mirror would need a one-line UI change before anyone saw it.
   - **No-infra alternative:** the site already falls back to the newest Wayback Machine capture for anything listed in `dead_links`. CI could submit each datasheet URL to Wayback's Save Page Now instead of uploading to R2. That needs no Cloudflare work and avoids re-hosting manufacturers' copyrighted PDFs on our own domain. It is less certain: Wayback can miss bot-blocked hosts and has had outages.
   - Recommendation: Wayback first; keep R2 for any datasheets Wayback can't capture.
2. **Borderline image calls** worth a glance (details in `plans/assets-research/`): neopixelbooster recorded as CC BY-NC-SA 4.0 (README) though its LICENCE file says CC BY-SA 4.0; LED-strip sellers (LEDYi, Superlighting) as `community` datasheet hosts for Titan/UCS ICs whose makers publish none; a few retailer photos for generic diffusers (Screwfix, eplastics).

## Things not to do

- Don't touch Cloudflare, R2, DNS or repo secrets. Stage and ask.
- Don't use the user's Chrome for scraping (keep off the screen).
- Don't commit original full-size downloads; only the processed WebP.
