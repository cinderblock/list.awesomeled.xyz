# Browse & compare UX (workstream 7)

Part of the [website build-out](website-buildout.md). Thread:
[LED list: browse & compare UX](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:47d8a3b454a0797a131038c191a6e40c82f4aa5f198e691a62119e5dfa285a62).

## Goal

Everything a spreadsheet user does on the old Google Sheet — scan, sort,
filter, search, compare, copy, share — must be faster and nicer on
list.awesomeled.xyz, plus the things a sheet cannot do at all (global search,
facet counts, side-by-side compare, shareable views, per-entry pages that
unfurl nicely, a contribution path that cannot vandalize the data).

## Environment

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-browse-ux-0783df07136700b6`, branch `ws/browse-ux`.
- Canonical repo: `cinderblock/list.awesomeled.xyz` (public). `cinderblock/awesomeledlist` is an **archived** older repo.
- Stack: React Router 7.13 (`ssr: false` + full prerender), React 19, Radix primitives, vanilla CSS, Bun 1.4.
- Dev server for this thread: port **5773**; static preview of the build: **4773** (announced in `~/.claude/skills/workspace-contention/active-agents/`). The designer thread holds 5473.
- Heavy commands go through the compute budget: `~/.srm/bin/srmctl run --slots N --low --label "…" -- <cmd>` (build = 2 slots, one slot per Playwright worker). This repo is not on the sentinel allow-list, so everything runs locally.
- Headless only: Playwright `chromium` project. Never the `visual` project (headed).
- Audit scripts and screenshots live in the session scratchpad, not the repo.

## Decisions already made (don't re-ask)

- Ship by rebasing onto `origin/master` and pushing fast-forward; every push deploys, so validate + lint + format + typecheck + tests must pass first.
- New code goes in **new files** wherever possible. `entry.tsx`, `columns.tsx`, `components.css`, `data.ts`, `types.ts`, `playwright.config.ts` and `package.json` are being edited by other streams right now (cross-links, data-freshness, designer, database-review), so changes there stay small and surgical.
- One field catalog, many views: table columns, facets, compare rows, exports and the search index all derive from the JSON schemas plus the data, so schema improvements from workstream 2 show up without UI work.
- The curated columns in `app/lib/columns.tsx` stay as the default view; every other field becomes an optional column.
- URL state stays backward compatible (`q`, `sort`, `f`, legacy `dir`); new state is additive (`cols`).
- Density, card/table view and compare selection are per-device preferences (localStorage), not URL state; filters, sort, search and columns are shareable URL state.
- The card layout is the same `<table>` restyled by CSS (`html[data-table-layout='cards']`), not a second component: search, filters, columns, compare, keyboard and URL state cannot drift apart between the two. Cards are automatic below 640 px and a remembered choice anywhere.
- Compare lives at `/compare?e=<category>/<id>,…` (2–4 entries, same `ref` format the database uses), so it works on static hosting.
- `E2E_PORT` in `playwright.config.ts` and the `tests/unit` + `test:unit` convention belong to the designer / database-review threads (both have it uncommitted). This thread follows the convention and does not touch that file.
- The Google Sheet is read-only for this thread: Sheets API reads and the static `/htmlview`, never the editable grid (the sheet is world-editable).

## Gap list: the sheet vs. the live site (audited 2026-11-18)

Method: headless Chromium at 1440×900 and 390×844 against
<https://list.awesomeled.xyz> and the sheet's static view, plus the Sheets API
for structure (tabs, frozen panes, filter views, sort specs).

| What a sheet user does | Google Sheet                                                             | Live site before this work                                                            | Gap                                                |
| ---------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Scan many rows         | 37 rows per 900 px screen (33 on a phone)                                | 11 rows per screen                                                                    | Density mode                                       |
| Scan many columns      | 22–32 columns per tab                                                    | 6–11 fixed columns; the picker can only hide them                                     | Every field as an optional column                  |
| Keep headers in view   | Frozen header row + first column                                         | Sticky header + sticky name column                                                    | Parity (keep working with new columns)             |
| Sort                   | 2+ clicks via the filter menu; multi-level sort exists                   | 2 clicks (popover); multi-level and unit-aware                                        | One-click header sort; sort on any field           |
| Filter by values       | Checkbox list per column, no counts; conditions                          | Per-column popover on ≤ 8 columns, no counts; value types guessed from the URL text   | Facets with counts on every structured field       |
| Find text              | Ctrl+F over every cell; find across tabs                                 | Search covers 3 fields of one category                                                | Table search over all fields; global search        |
| Compare a few rows     | Hide the rest with a filter and squint                                   | Nothing                                                                               | Side-by-side compare of 2–4 entries                |
| Copy                   | Select cells, paste anywhere                                             | Text selection drags badges along; no copy actions                                    | Copy as TSV / Markdown / link                      |
| Export                 | CSV, XLSX of every column                                                | CSV of the default columns only; YAML zip                                             | Export visible or all fields; CSV, TSV, JSON, YAML |
| Share a view           | Link to a tab or a named filter view                                     | URL carries search, sort, filters; hidden columns are local only; no copy-link button | Columns in the URL; copy link                      |
| Read notes on a cell   | Cell notes and comments                                                  | `*_notes` fields only on the entry page, unlabeled                                    | Footnote marker on the value                       |
| Fix or add data        | Edit in place (also the sheet's downfall: rows 5, 18, 20 are vandalized) | "Contribute on GitHub" link pointing at an archived repo                              | Edit / report / add paths into GitHub              |
| See history            | Version history                                                          | "Reviewed" date                                                                       | Link to the entry's history                        |
| Read the intro         | README tab                                                               | About page; `database/*/description.md` unused                                        | Category intros                                    |
| Use it on a phone      | Pinch and scroll a grid                                                  | Two columns fit; logo wraps to two lines; controls wrap                               | Card list, compact header, filter drawer           |

Things a sheet cannot do, and where the site stood:

- **Search everything at once** — missing (no global search, no shortcut).
- **Land on a product from Google or a shared link** — entry pages exist, but the description is "Details about X", there are no OpenGraph tags, no canonical URL, no sitemap, no robots.txt, no structured data.
- **Unknown URLs** — `/pixels/ws2812b` returns HTTP 200 with "Oops! An unexpected error occurred." and an empty title (no `404.html`, so the host falls back to the home page shell).
- **Home page** — a title, one sentence and the category grid; nothing says why this beats the sheet or offers a search box.
- **Entry page** — price shows as `275` (no currency), `1024` wraps mid-number, "Active" appears twice, values have no units, keys are raw YAML names, and there is no edit / report / compare / copy-link action.
- **Accessibility** — icon badges fail contrast in light mode (green/amber/yellow text on a tint of itself), no skip link, no `aria-sort`, the image modal is not a dialog, the search box has no label.
- **Performance** — entry pages preload the 83 kB `DataTable` chunk only to read two helper functions; Google Fonts is a render-blocking third-party stylesheet; `controllers/index.html` is 387 kB (46 kB gzipped).

## Plan / steps

Each step ships on its own (rebase, checks, push).

1. **Foundations** — shared site constants (repo URL fix), table-state library (type-aware URL grammar) with unit tests, entry page stops importing `DataTable`.
2. **Field catalog** — schema + data → field metadata; every field an optional column; column picker with search, grouping, reorder, reset; `cols` in the URL; saved per category.
3. **Faster table** — one-click sort, facet counts, filters drawer, density toggle, search over all fields, click-to-filter on any pill, `*_notes` footnotes.
4. **Copy & export** — copy link / TSV / Markdown; download CSV / TSV / JSON / YAML, visible or all fields; `/<category>.json`.
5. **Global search** — build-time index, command palette (Ctrl/⌘+K, `/`), `/search?q=` page, friendly 404 with suggestions, real `404.html`.
6. **Compare** — row selection, compare tray, `/compare` page with differences-only, share and copy.
7. **Mobile** — card list, compact header, drawers.
8. **Home page** — search-first hero, what's here, why it beats the sheet, recently reviewed, contribute.
9. **Entry page polish** — after cross-links and data-freshness land their `entry.tsx` changes: units and labels from the catalog, actions (compare, copy link, edit, report, history), layout, JSON-LD.
10. **SEO / OpenGraph** — meta builder, canonical, sitemap, robots, per-entry OG image.
11. **Contribution funnel** — issue forms, edit/add links, `/contribute` page with a generated field reference, refreshed CONTRIBUTING.md.
12. **Accessibility + performance pass** — axe in e2e, badge contrast, focus, self-hosted font, bundle check.

**Current step: 9 (entry page polish), then 10 (SEO / OpenGraph), 11 (contribution funnel), 12 (accessibility + performance).** Steps 1–8 are done; 1–6 are live (`d406c2c`, `60cd310`, `4681573`, `632ddde`), 7–8 ship together.

Drafted ahead while test runs were in flight (uncommitted, in the worktree or the scratchpad `draft/` folder): the link-preview card renderer (`app/lib/og.server.ts`, `assets/fonts/`), the meta builder, sitemap / robots / preview-image routes, the entry-page contribute strip, the `/contribute` page with its generated field reference, and three GitHub issue forms (`.github/ISSUE_TEMPLATE/`).

## Findings / gotchas

- `bun run build` took 5 m 38 s under the compute budget with the machine at 92 % CPU (about 1,100 prerender requests). Iterate on the dev server; build only to verify.
- Baseline build (2026-11-18, `44a6f99`): `entry.client` 187 kB (59 gz), shared chunk 124 kB (42 gz), `DataTable` 83 kB (27 gz), `Tooltip`/Radix 47 kB (17 gz), CSS 62 kB (11 gz); `controllers/index.html` 387 kB (46 gz); `controllers.data` 93 kB.
- CI was red until `44a6f99` (ubuntu-latest became 26.04, which Playwright 1.58 does not support), so the GitHub Pages backup deploy was stale; Cloudflare Pages is the live path.
- The site's GitHub links point at `cinderblock/awesomeledlist`, which is archived: nobody can open an issue or PR there.
- Static hosting has no SPA fallback configured: Cloudflare Pages serves `/index.html` with 200 for unknown paths because there is no root `404.html`.
- `handleBadgeClick` in `DataTable.tsx` only fires for elements with the `badge` class. Icon pills (Art-Net, Wi-Fi…) are not clickable, and clicking the `+2` overflow pill adds a filter for the literal text `+2`.
- `parseOneFilter` guesses the filter type from the text: a select value of `yes`, `100-200` or `2024-01-01..` would be read as boolean, numeric or date.
- Maps with open-ended keys (`inputs.physical.*`, `outputs.auxiliary.*`) must be one "keys" field, not dozens of sparse columns. Maps with fixed keys (pattern-driver `outputs.protocols.*`) are real columns (the sheet has one per protocol and a saved "E1.31 Output" filter view).
- `*_notes` siblings exist in the data (`ratings.max_current_notes`, `color.pwm_frequency_notes`…): the sheet's cell notes, migrated.
- `e2e/basic.test.ts` "navigation to entry page works" clicks `td:first-child a`, which is the external product link, not the entry link; it passes by accident.
- `CONTRIBUTING.md` documents the old flat schema (`id`, `manufacturer`, `npm`). Data-freshness has it open; coordinate before rewriting.
- Other streams' uncommitted work touches `entry.tsx` (cross-links: relation graph, `FormatContext`; data-freshness: price provenance), `columns.tsx` (part price column) and `playwright.config.ts` (`E2E_PORT`, twice).
- **Sort latency.** A sort click took ~190 ms on the live site (and 1–2.6 s on a dev server): every URL write was a router navigation, which re-renders the route in a transition, and each row carried several Radix tooltip providers. Now ~30 ms in production: URL writes update a local copy first (`useTableParams`), rows are memoized and keyed by id, and there is one tooltip provider.
- **Table state leaked across categories.** `DataTable` kept one instance across `:category` navigations, so hidden columns from one category were saved under the next and saved filters were never restored after the first tab. Fixed by keying the table on the category id.
- **Master moves every minute or two** (six streams pushing). What works: rebase, run the fast checks (typecheck, lint, format, unit, validate: ~2 min), push straight away; run the full e2e just before and again on what shipped. Expect to port other streams' edits when they touch a file being rewritten (`DataTable.tsx` thumbnails).
- **e2e flakes under load are launch timeouts**, not assertions (`browserContext.newPage: Test timeout`), when the machine sits at 100 % CPU. Re-run the test alone before believing it.
- **Hydration marker.** The prerendered page looks ready before it is; tests wait for `html[data-hydrated]` (set by the layout). A Playwright screenshot taken before hydration also causes a spurious hydration-mismatch error (it touches the focused input).
- **Radix versions must match.** `bun add @radix-ui/react-dialog` pulled 1.3.1 and with it second copies of the shared internals (dismissable-layer, focus-scope, portal…), which would have doubled bundle weight and broken nested layers. Pinned to 1.1.15, the release that shares internals with the installed popover / dropdown / tooltip.
- **Stale nested dependency after a rebase.** When upstream added `ajv-formats`, `bun install` reported no changes but left `node_modules/ajv-formats/node_modules/ajv@8.17.1` behind, and `tsc` failed on mismatched types. Deleting that folder and reinstalling fixed it.
- **Shell quirks here.** `curl` fails on https (`(43) A libcurl function was given a bad argument`): use `node` `fetch`. Backslashes in an inline `python - <<EOF` are halved: write the script to a file, or use the Edit tool. Git Bash rewrites arguments that start with `/` into Windows paths.
- **The Windows clipboard turns line feeds into CRLF**; clipboard assertions split on either.
- **A query string breaks hydration on a prerendered site.** Each path is prerendered once, without a query, so `/controllers?f=…`, `/compare?e=…` and `/search?q=…` made the first client render differ from the HTML: React logged error #418 and rebuilt the page. It only shows on a production build served statically (the dev server renders each request with its query). Fix: `useTableParams` and the search page ignore the query for the hydration render and apply it in the next one; an inline script marks `<html data-url-state="pending">` so CSS holds the affected content back instead of flashing the unfiltered version; effects that read the URL (restore from / save to storage) wait for `urlReady`.
- **`data-hydrated` must mean "URL applied".** It is set in the render after hydration (`useHydrated()` true), the same one that applies the query string; setting it in a plain mount effect let tests read the pre-URL table.
- **Unknown entry URLs in production** need three things: a root `404.html` (the SPA shell, copied by `buildEnd` in `react-router.config.ts`) so the host answers with a real 404; a `clientLoader` on the entry route (without one the failure is "No result found for routeId", not a 404); and a catch-all `*` route whose client loader throws 404, so unmatched paths hydrate the shell the normal way. In dev the same URLs log a hydration mismatch because the dev server renders the error itself: harmless, dev only.
- **Route order matters for `:category.<ext>`.** A segment like `:category.json` ranks as static, so `search-index.json` must be declared before it or the category route swallows it.
- **A loader route missing from the prerender list kills the dev server** ("Invalid route exports found when prerendering with ssr:false"). Add the path to `getAllRoutes()` in `data.ts` before registering the route in `routes.ts`.
- **Background tasks stop after two hours.** The dev server and the static preview were both killed by the limit; the dev server was restarted, the preview was not (it had the maximum already). Production checks now start a short-lived preview inside one command.
- **Tests must not assume the data.** Other streams change rows all day: a price in INR (no exchange rate on file) broke "missing values sort last"; a newly filled `outputs.protocols` made `/^Outputs/` match two compare rows. Assert on structure and on values read back from the page, not on specific numbers.
- **Card layout gotchas** (all hit, all fixed): a grid item's `z-index` counts without positioning, so the sticky name column's `z-index: 2` lifted the card-wide link over the card's pills and checkbox; the pixel scrollbar turns `.data-table-scroll-inner` into a shrink-to-fit flex row and masks the right edge, which collapsed the desktop card grid to one column and clipped the last card; a `display: none` header measures as all zeros, so the sticky-header check read "scrolled past" and was never re-run when the layout changed; columns that draw zero as a lone dash are not "empty" to the model, so cards hide them with `:has(> .data-table-null:only-child)`; quantity cells carried inline alignment styles (invisible ".0", fixed-width unit slot) that only make sense down a column and are now classes the card layout can override.
- **`react-hooks/set-state-in-effect` accepts a setState fed by a DOM measurement only as one expression.** `a && b` on measured values is flagged (it compiles to control flow); arithmetic on them is not. See `checkStickyVisibility`.
- **Touching anything under `app/` during an e2e run breaks the run**, even a new file nothing imports yet. The React Router dev plugin logs "Config changed", recomputes the prerender list ("Pre-rendering 528 routes...", which loads the whole database) and the server stalls for the duration: tests in flight time out. `scripts/` is as bad (the Vite config imports `scripts/thumbs.ts`, so an edit restarts the server). While a run is going, only `plans/`, `README.md`, `.github/` and the scratchpad are safe to edit.
- **A dev server restarted just before an e2e run fails the first client-side navigations** (cold Vite transforms at 100 % CPU blow the tests' 10 s wait; `basic.test.ts` "Tab navigation performance"). Warm it with a request or two first, and re-run those tests alone before believing them.
- New unit kinds appear upstream (`length` arrived mid-rebase). `units.ts` needs a display-unit list per kind; `fields.ts` treats any shared schema definition named after a unit kind as a quantity.
- Build after this increment (`d406c2c`): category chunk 158 kB (47 gz, was 84 / 27 for table + route), `columns` chunk 40 kB (13 gz) is all an entry page loads from the table code (was 83 / 27), CSS 77 kB (13 gz), `controllers/index.html` 455 kB (52 gz). The table chunk grew; lazy-loading the drawer, picker and export menu is a candidate for step 12.

## Progress log

- [x] 2026-11-18 3:56 PM PST (23:56Z): read the build-out plan and the app; audited the live site and the sheet headlessly; measured the baseline build; wrote this plan.
- [x] Step 1 foundations — `app/lib/site.ts`, `table-state.ts`, `prefs.ts`; entry pages no longer import the table. (The archived-repo links were fixed by the parity stream minutes earlier; this stream's commit only centralizes the URL.)
- [x] Step 2 field catalog + column picker — `app/lib/fields.ts` (+ `.server`), `table-columns.tsx`, `ColumnPicker.tsx`; `cols` in the URL, layout saved per device.
- [x] Step 3 faster table — one-click sort, facet counts, filters panel, dense rows, search over all fields, pill click-to-filter, `_notes` footnotes, has-a-value filters.
- [x] Step 4 copy & export — share & export menu; static CSV with every field; `/<category>.json`.
- [x] 2026-11-18 5:49 PM PST (01:49Z): steps 1–4 pushed as `d406c2c` and live. 48 e2e tests (20 new in `e2e/table.test.ts`) and 61 unit tests pass; production smoke test clean.
- [x] Step 5 global search + 404 — `60cd310`: `/search-index.json` (490 entries, 41 kB gz), Ctrl/⌘+K palette, `/search?q=`, not-found page with suggestions, `404.html` written by `buildEnd`, catch-all route.
- [x] Step 6 compare — `4681573`: row checkboxes + tray, `/compare?e=…` with differences-only, add / reorder / remove, copy link and Markdown, entry-page button.
- [x] 2026-11-18 7:15 PM PST (03:15Z): hydration fix for URLs with a query string and the phone-width header fix pushed (`4681573`, `632ddde`). 77 e2e tests, 286 unit tests pass.
- [x] Step 7 mobile — header (`632ddde`); card list: below 640 px a category opens as one card per entry (same table, restyled), with a Sort menu, a remembered Cards / Table switch on any screen, and several cards per row on wide screens. 7 new e2e tests in `e2e/mobile.test.ts`.
- [x] Step 8 home page — search box with live results from every category, the database in numbers, six "start with a question" links (each checked by e2e to still match something), category grid, what the site does that a sheet cannot, recently reviewed entries, contribute box. README gained "Using the Site". 6 e2e tests in `e2e/home.test.ts`.
- [x] 2026-11-18 8:40 PM PST (04:40Z): full e2e on steps 7–8 after rebasing: 111 of 111 pass (one test needed a locator fix: it assumed a single `<header>` per page). 324 unit tests pass.
- [ ] Step 9 entry page polish — contribute strip and copy-link drafted; generic value rendering of long URLs (ISSUES.md, from cross-links) still to do.
- [ ] Step 10 SEO / OpenGraph — renderer, meta builder and routes drafted.
- [ ] Step 11 contribution funnel — issue forms and `/contribute` drafted; CONTRIBUTING.md examples still show the old flat schema.
- [ ] Step 12 accessibility + performance pass

## Open questions for the user

1. **Default density.** Dense mode ships as a toggle and the current roomy rows stay the default. Recommendation: make dense the default on desktop (it is what a sheet user expects); say the word and it is a one-line change.
2. **Issue labels.** The issue forms (step 11) can only apply labels that exist. The repository has GitHub's defaults plus `link-rot`; the site-bug form uses `bug`. Recommendation: add `data` and `new-entry` labels so corrections and additions sort themselves. Creating labels is a repository setting, so it waits for a yes.

## Things not to do

- Don't run the `visual` Playwright project or anything headed.
- Don't send input to the editable Google Sheet; use the API or `/htmlview`.
- Don't rewrite `entry.tsx` or `columns.tsx` wholesale while other streams have them open.
- Don't change `playwright.config.ts`; pass a scratch config for a private port instead.
- Don't start a production build while another heavy run of this thread is going (compute budget).
- Don't create or edit files under `app/`, `scripts/` or `e2e/` while an e2e run is in progress (see findings): draft in the scratchpad and copy in afterwards.
- Don't touch Cloudflare (redirect rules, headers, Pages settings); the 404 fix must work with files in the build output alone.
