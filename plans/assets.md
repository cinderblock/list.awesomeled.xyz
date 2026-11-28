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
- **Keep our own copies in R2** (Cameron, 2026-11-18 ~9:15 PM PST): "I'm ok with keeping our own copies. We just need to keep an eye on storage/usage." Wayback-only was the alternative; not chosen.
- The sheet's connector "Picture" links (third-party sellers' photos: AliExpress, scondar, pcboard.ca, RS) are not used. Same rule as every other image: the maker's own photo or an open license (closes the ISSUES.md item from parity).
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
    - [x] Repo side: storage budget (`MIRROR_BUDGET_MB`, default 1024), per-run storage report (log, job summary, PR body), no re-upload of stored keys, `--check` total; entry pages link the mirror (2eab8e6).
    - [x] Ops change staged, uncommitted: worktree `C:/Users/camer/.t3/worktrees/ops/awesomeled-datasheets-r2` (branch `awesomeled-datasheets-r2`, no upstream). It adds R2 custom-domain support to the IaC and declares bucket `awesomeled-datasheets` + `assets.awesomeled.xyz`. Read-only dry run: exactly 2 creates; tests 405 pass. Plan: `plans/awesomeled-datasheets-r2.md` there.
    - [x] Cameron's yes (2026-11-22 "go for it") → ops `34faf883` pushed; CI applied 6:51 PM PST (02:51Z Nov 23): bucket `awesomeled-datasheets` (wnam) + custom domain `assets.awesomeled.xyz`; `sync-verify` green; a missing key returns 404 from R2.
    - [x] Cameron: account-owned R2 token `awesomeled-list-datasheet-mirror` (Object Read & Write, that bucket only); keys verified 2026-11-22 (write, read, delete a probe object)
    - [x] Repo secrets R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET + variable R2_PUBLIC_BASE_URL set 7:51 PM PST (03:51Z Nov 23)
    - [x] Actions may create PRs: Cameron's yes 2026-11-22; set via `gh api` (default workflow permissions stay read)
    - [x] First run (workflow_dispatch, 8:17–8:29 PM PST, 04:17–04:29Z Nov 23): 255 PDFs, 432.3 MB of the 1 GB budget (42%); bot PR https://github.com/cinderblock/list.awesomeled.xyz/pull/3 (commit carries `Not-A-Review:`). Spot-checked 4 mirror URLs: 200 application/pdf.
    - [x] 2 failures: pixeldin (yarilo.pro times out from runners → byte-identical Wayback copy added as `datasheet.sources`); ns8808 (datasheet.url is an HTML page, stream 2's b4dc7499 → ISSUES.md)
    - [x] Second run (push of b364d575, 9:18 PM PST, 05:18Z Nov 23) mirrored pixeldin via the plain URL this time and updated PR #3 (256 files). Storage 263 PDFs, 434.0 MB; 7 objects (1.0 MB) unreferenced: likely PDFs whose bytes changed between the two runs (content-addressed keys). Watch whether that recurs on later runs before adding any cleanup.
    - [x] PR #3 rebase-merged 2026-11-27 ~5:55 PM PST (01:55Z Nov 28) as 1006d242 (trailer kept), on Cameron's go-ahead after review: 245 mirror blocks, additions only, each `source` = the entry's `url`, hash in the key; validate 609/609 at its head. Post-merge CI, deploy and mirror run green; production entry pages link `assets.awesomeled.xyz` copies. Follow-up bot PR https://github.com/cinderblock/list.awesomeled.xyz/pull/4 (1 more).
    - [ ] 11 entries not mirrored: their hosts (sandevices.com, dmxking.com/.tv, lumikit.com.br, smartshow.lighting) now answer GitHub runners with HTTP 415, though runs 1–2 fetched them and they still download fine from here; teeplug (hylec-apl.com) timed out. See Findings. Watch the next run; if it persists, add Wayback `id_` copies as `sources` (as for pixeldin). ← current
    - [x] docs/datasheet-mirroring.md setup rewritten for the ops-managed bucket and domain
12. [x] Second sourcing pass for entries added by other streams after step 5 (~85 without images, 18 without datasheets; 40 of the image gaps are pixel ICs, usually skipped for want of a real chip photo).
    - [x] pixel ICs + pixels (f4c3620): 3 images, 1 datasheet added, 2 LCSC viewer URLs replaced by direct PDFs; 47 image skips and 12 parts with no published datasheet, reasons in `plans/assets-research/pass2-pixels-ics.md`.
    - [x] pattern drivers: 12 official screenshots (Pharos swapped at review for the help's Layout view); light-show-pro (500 px only), watchout (callouts/marketing render) and xschedule (none exists) skipped. `plans/assets-research/pass2-pattern-drivers.md`.
    - [x] boards / converters / connectors / controllers: agent interrupted before its report; 19 images + 1 datasheet ported and reviewed 2026-11-22. The Pi 3 Model B's pass-1 photo turned out to be a 3B+ and was replaced. `plans/assets-research/pass2-hardware.md`.
    - [x] Remaining hardware image gaps (43: adapters 12, connectors 7, controllers 17, level-converters 1, microboards 5, pixel-decoders 1): 42 are pass-1 skips with recorded reasons; max3485 (added since) skipped, analog.com refuses bots and shows no photos.
13. [x] Maker-first datasheet pass (Cameron's yes, 2026-11-27).
    - [x] Result: 22 entries switched to the maker's own copy (SK parts → Normand; ws2811/ws2812/ws2808/ws2821 → Worldsemi; apa102/apa102c → APA; dm412 → Silicon Touch; 7 Titan TM parts → Wayback copies of titanmec.com's old downloads; picoblade → Molex via Wayback; ebyte-nrf-52840 → Ebyte's module manual), old links kept as `sources`. ws2816 gained the maker's file as a source. ~40 unchanged with reasons (maker publishes nothing, files behind sign-up forms, email-only, or only other variants). All 23 changed entries pass `--check`.
    - [x] ebyte-nrf-52840: the old link was Nordic's chip spec, a different document, so it went to `other_links`, not `sources` (a mirror fallback must be the same document).
    - [x] Suspected spec errors from the makers' sheets → ISSUES.md for stream 2.
    - [ ] Open: six Titan parts now link a Chinese maker sheet as primary (Titan published no English edition); the English LEDYi/Superlighting copy is the first source. See Open questions.
    - Audit (2026-11-27): of 257 `datasheet.url`s, ~65 point at a vendor, distributor, aggregator or forum copy rather than the maker. The Adafruit-hosted chip sheets were inherited and marked "unchanged (ok)" in pass 1 without a maker check; LEDYi/Superlighting copies were chosen because the maker doesn't host them (pass-1 notes); 5 are datasheet aggregators (datasheet4u, datasheetbank).
    - Rule: if the maker publishes the same document (or a newer revision of the same part/variant), its URL becomes `url` and the old link moves to `sources` with its `host`; otherwise keep the link and log why. Wayback captures of the maker's own file count as the maker.
    - Three agents (effort `high`): chip sheets on vendor CDNs + connectors/boards; aggregators + distributors + forums; LEDYi/Superlighting. Logs: `plans/assets-research/pass3-*.md`.

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

### After pass 2 (2026-11-22, `origin/master` 477aa795 + the hardware batch)

Other streams kept adding entries (483 → 579 counted here), mostly pixel ICs and
pattern drivers.

| Category            | Entries |     Image | Attributed | Open license |     Datasheet | Mirrored |
| ------------------- | ------: | --------: | ---------: | -----------: | ------------: | -------: |
| adapters            |      38 |  26 (68%) |         26 |            1 |        1 (3%) |        0 |
| commercial-systems  |      18 | 18 (100%) |         18 |            0 |             — |        — |
| connectors          |      48 |  41 (85%) |         41 |           11 |      38 (79%) |        0 |
| controllers         |     136 | 119 (88%) |        119 |            1 |      56 (41%) |        0 |
| diffusive-materials |      44 |  28 (64%) |         28 |           13 |             — |        — |
| drive-libraries     |      40 |    0 (0%) |          0 |            0 |             — |        — |
| level-converters    |      13 |  12 (92%) |         12 |            0 |      12 (92%) |        0 |
| microboards         |      45 |  40 (89%) |         40 |           18 |      43 (96%) |        0 |
| pattern-drivers     |      56 |  42 (75%) |         42 |            1 |             — |        — |
| pixel-decoders      |      14 |  13 (93%) |         13 |            1 |       2 (14%) |        0 |
| pixel-ics           |      84 |    4 (5%) |          4 |            0 |      67 (80%) |        0 |
| pixels              |      43 |  22 (51%) |         22 |            2 |      38 (88%) |        0 |
| **Total**           |     579 | 365 (63%) |        365 |           48 | 257/421 (61%) |        0 |

- **Images: 18 → 365** across both passes, all attributed. Excluding drive libraries (no images by decision) and pixel ICs (rarely a real chip photo): 361 / 455 (79%).
- **Datasheets: 38 → 257.** "Mirrored": 245 of 257 on master since PR #3 (2026-11-27); 1 more in PR #4, ns8808 is an HTML page (stream 2), and 11 are blocked from runners (step 11).

## Findings / gotchas

- **Datasheet storage measured** (2026-11-18 ~10 PM PST): 249 datasheets download as PDFs, 419.6 MB in total. The biggest are wieland-rst 30 MB, ebyte-nrf-52840 17 MB and chogori 15 MB. That's 4% of R2's free 10 GB and 41% of the 1 GB mirror budget.
- **Monitoring already exists in ops.** The uptime worker (`cloudflare/workers/uptime`) charts R2 storage per bucket and alerts at 50/75/90/100% of the 10 GB account total, plus on projected growth; it also polls Class A/B operations hourly into cost alerts. The spend breaker only blocks `api.openslate.us`, so it can't throttle `assets.awesomeled.xyz`.
- Lumikit's PDFs start with a UTF-8 BOM before `%PDF-`. The check now accepts `%PDF-` anywhere in the first 1024 bytes, like PDF readers do.
- Several LCSC `datasheet.url` values added by other streams serve HTML to bots (logged in ISSUES.md). LCSC's direct-file form (`datasheet.lcsc.com/datasheet/pdf/<hash>.pdf`) works.
- Titan Micro's own TM18xx/TM19xx PDFs (`titanmec.com/index/article/download.html?file=…`) download only with a `titanmec.com` Referer, otherwise a 439-byte 404. Not worth teaching the mirror: entry-page links are `rel="noopener noreferrer"`, so visitors would get the 404 too. Keep the community copies (Lumikit, LEDYi).

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
- **Dev server hung at startup** (2026-11-20 ~3 AM PST): every request returned 500 with `transport invoke timed out after 60000ms … fetchModule /app/app.css`, so e2e failed on Playwright's 60 s `webServer` wait. One failed fetch is cached, so waiting longer doesn't help. The cause was a stale Vite dependency-optimizer cache in `node_modules/.vite`, probably left behind by a start that died while the machine was pegged (Defender and other threads at 100% CPU). A start that logs "Re-optimizing dependencies because vite config has changed" rebuilds it; deleting `node_modules/.vite` should do the same. Clean `origin/master` sharing the same `node_modules` reproduced the rebuild and then served 200 in 32 s.
- A stale incremental `bun install` left a nested `ajv` under `ajv-formats` and broke `tsc` locally; a clean install fixed it.

- **Bot PR regenerates from master each run** (peter-evans/create-pull-request): an entry mirrored by an earlier run drops out of the open bot PR if a later run fails to download it, although its object is still in R2. PR #3 went from 256 to 245 files this way (2026-11-27 run: `HTTP 415` from runners). Merging bot PRs promptly avoids it; a fuller fix would record the source URL as object metadata and reuse a stored object when the download fails.
- **Unreferenced objects:** 49 (41.7 MB) after PR #3: the 11 dropped entries' copies plus old copies of the 22 datasheets switched to maker hosts in step 13. Harmless at this size; clean up only if it grows.

## Progress log

- [x] 2026-11-18: read plans, surveyed code, baseline coverage.
- [x] Tooling + schema + mirror `--check` pushed (3d0a2ee); thumbnails + mirror e2e test (032204a).
- [x] converters-decoders, trailer, workflow, docs (c92c4bc).
- [x] pixels, pixel ICs, microboards, connectors, adapters, controllers, validator, CONTRIBUTING/README (a694a76).
- [x] commercial systems, diffusive materials, ISSUES.md (41295f3).
- [x] Pattern-driver screenshots (ea8f9ac); controller/adapter datasheets (9ef42f2).
- [x] Storage guard + report, mirror links on entry pages (2eab8e6); ops R2 change staged (not committed).
- [ ] R2 mirror switched on (Cameron).
- [ ] Second sourcing pass for new entries (step 12).

## Open questions for the user

1. ~~R2 mirror setup~~: answered 2026-11-22 ("go for it", as staged); see step 11.
2. **Borderline image calls** worth a glance (details in `plans/assets-research/`): neopixelbooster recorded as CC BY-NC-SA 4.0 (README) though its LICENCE file says CC BY-SA 4.0; LED-strip sellers (LEDYi, Superlighting) as `community` datasheet hosts for Titan/UCS ICs whose makers publish none; a few retailer photos for generic diffusers (Screwfix, eplastics).
3. **Keep both editions, with version metadata** (Cameron, 2026-11-27: "can we keep both? having translations (and the modern version) are both valuable. we could even mark things like version number"). Proposal, awaiting a yes: `version`, `language`, `date` on `datasheet`; a new `datasheet.editions[]` (`{url, version, language, date, host, notes}`) for other revisions and translations, listed under the datasheet link on entry pages; `sources` stays "the same file on another host" (the mirror's fallback), so the Titan English copies, ws2811's original Adafruit sheet and similar move from `sources` to `editions`. Editions not mirrored at first. Primary stays the maker's newest.

## Things not to do

- Don't run bare `bunx playwright test`: it includes the `visual` project, which is headed (`headless: false`, slowMo) and puts Chrome windows on Cameron's screen. Use `bun run test:e2e` (`--project=chromium`) or pass `--project=chromium`. Wrap e2e in `srmctl run --slots 2 --low`.

- Don't touch Cloudflare, R2, DNS or repo secrets. Stage and ask.
- Don't use the user's Chrome for scraping (keep off the screen).
- Don't commit original full-size downloads; only the processed WebP.
