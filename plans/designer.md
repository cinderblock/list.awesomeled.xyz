# System Designer (workstream 3)

Part of the [website build-out](website-buildout.md). Owner of `app/routes/designer.tsx`,
`app/routes/system-overview.tsx`, `app/lib/designer/`, `app/components/designer/`,
`app/components/diagram/`, `app/styles/designer.css`, `e2e/designer.test.ts`, `e2e-prod/` and the
`tests/unit/designer-*.test.ts` files.

## Goal

Make `/designer` the headline feature a spreadsheet can't do: a PCPartPicker-style flow where
someone picks pixels → controller, DIY board or adapter → level shifter / connectors / power, and
gets live compatibility checks, a power budget with injection and fusing guidance, a bill of
materials with prices where known, a shareable URL, and SVG/PNG exports that carry their own
re-importable source. It has to work well on a phone.

**Status: shipped.** Everything in the brief is live on master; what could come next is listed in
[ROADMAP.md](../ROADMAP.md) under "System Designer".

## Environment

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-designer-4898e829197c5f7d`, branch `ws/designer`.
- Ship: rebase onto `origin/master`, then `git push origin HEAD:master` (fast-forward only, never force). Every push deploys production.
- Bun 1.4.4, Node 26, Playwright 1.58.1 (Chromium already installed).
- Checks before any push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:unit`, `bun run test:e2e`, `bun run build`, `bun run test:prod`. CI runs the same before it deploys.
- **This worktree's e2e port is 5473**: `E2E_PORT=5473 bunx playwright test --project=chromium --workers=2 --retries=1`. Playwright starts and stops its own dev server on that port, unless one is already listening there (with `CI` unset it reuses it). The production suite uses `E2E_PROD_PORT=5474`. Seven workstreams share the machine; the default 5173 may be another worktree's server.
- Heavy runs go through the compute broker: `~/.srm/bin/srmctl run --slots 2 --label "…" -- <cmd>` (no `--low`, see Findings).
- Production-only behaviour (prerendered HTML, hydration) is tested against `build/client`: `bun run build && bun run test:prod` (`e2e-prod/`, `playwright.prod.config.ts`, `scripts/serve-build.ts`). The dev server is not prerendered.
- Screenshots are taken headless with Playwright only. Nothing may open a window on Cameron's screen.

## Decisions already made (don't re-ask)

- **A link is the saved file.** The design's canonical query string is everything; localStorage only keeps a draft that is _offered_ on a bare `/designer` visit, never applied by itself. First-generation links (`p`/`x`/`n`/`c`/`g`) must keep working forever and re-serialize byte-identically; new keys are additive and defaults are left out.
- **Design state lives in the component; the address bar follows it with `history.replaceState`** (throttled to one write per 350 ms, Safari allows 100 per 30 s). Router navigations (first load, a link, back/forward) replace the design. Reason: a router navigation per keystroke re-ran the route and landed asynchronously, so two quick edits overwrote each other.
- **Full-white power = channel current × channels × LED voltage, except for series parts.** A 12 V pixel that strings its dice in series (WS2815, GS8208, CS8812…) passes one current through all of them, so it draws its channel current once. The designer reads a part as series when the maker’s whole-pixel power (`electrical.wattage`) is within 30% of one channel’s `channel_current` × `led_voltage` on a rail of 9 V or more, and then sizes for the larger of the two figures. Without a recorded maker power a 12 V pixel keeps the higher, parallel assumption. `electrical.wattage` alone (no channel current) is the whole pixel at full white, shared across the channels (stream 2 redefined the field on 2026-11-20, `52de8d86`; before that it held one channel’s power).
- **The ~20 W / ~200 W safety warnings use the full-white maximum**; supplies, feeds, fuses and wire are sized for the brightness the user designs for. Reason: wiring and fuses must survive what the pixels can pull if software misbehaves.
- **Too few outputs means "N units", not "incompatible"** (up to 8 units). A device-wide pixel limit (`outputs.pixels.max_total`) counts toward the unit count too.
- **Unknown data never produces an error or a wrong warning.** Missing facts become "verify" notes; only recorded facts can make a part incompatible. Example: an adapter whose output stage isn't recorded is not assumed to be unbuffered, because most adapters exist to add a buffer.
- **Pickers open in place (accordion), not in modal dialogs.** Page scroll instead of nested scroll boxes; nothing sits above the Radix tooltips. One open at a time.
- **The diagram's geometry is a pure function** (`app/lib/designer/diagram.ts`). The page paints it CSS-themed; exports paint it again with a literal light palette and inlined PNG thumbnails, serialized with `XMLSerializer` from a detached React root.
- **Cross-category facts come from the relation graph** (`app/lib/relations.ts`, stream 4): listed pixel support, firmware, host boards, output connectors, the buffer IC inside an adapter. The designer does no name matching of its own beyond protocol-family wildcards ("WS281x").
- **Driver ICs (`pixel-ics`) are selectable as pixels** (`p=ic-ws2811`) with a chosen string voltage. A chip with six or more outputs counts as several pixels (`pixelsPerPart`).
- **An adapter is a controller that brings its host board** (`c=ad-<slug>`). It is offered once it has `outputs.count` and a `host` link to a /microboards entry. The parts list names the first host still on sale and lists the others it fits. Firmware that runs on the host counts as running on the adapter. An adapter that names a level converter able to put 5 V logic on a data line (`isDataBuffer`) sends 5 V data; an RS-485 transceiver on the board doesn't count.
- **Hardware for matrix panels is not offered.** A controller or adapter whose `outputs.protocols` lists only panel interfaces (HUB75, HUB75E, HUB08…) is left out of the catalog and gets no "Use in the designer" link (`isPanelOnly`). The designer lays out pixel strings.
- **A level shifter is judged on two recorded facts**: its input-high threshold in the 3.3 V → 5 V role (`electrical.input_high_voltage`) and whether its outputs can drive a cable (`io.buffered`). Parts that fail either are flagged and sorted last, not hidden. Parts with a fact missing are not judged; they sort after the ones the database can vouch for. An auto-direction part (`io.direction: auto`) counts as weak-output even without `io.buffered`: it has to let the other side overdrive it. Parts recorded as differential (`io.differential`: a line receiver, an RS-485 transceiver) are set apart, not offered as buffers.
- **A vendor list that names a maker's prefix alone ("WS", "SK", "APA") covers that maker's range**, the same way "WS281x" does. Without it every pixel was "not on the list" for those controllers.
- **Price ranges stay ranges.** A published range or starting price carries through slot prices, parts-list lines, the total and the exports; nothing is silently counted at its low end.
- **Unit tests run under `bun test tests/unit`** with an ambient `bun:test` type shim, so no new dependency. Fixtures are synthetic; the files that load the real database assert invariants only, never values.
- **Exported files point at the canonical site** (`SITE_ORIGIN`), "Copy link" copies the current origin.
- **Database edits from this stream are limited to one additive field and its data**: `electrical.input_high_voltage` (+ `_notes`) on level converters and `io.buffered`, each value read from the maker's datasheet and quoted under `sources`. Everything else about data goes to `ISSUES.md`. When another stream adds a level converter, this stream adds the two facts for it (done for SN74HCT125, SN74HCT245 and TXB0104 on 2026-11-20). One exception so far: a value that was plainly wrong and made the designer reject a part (PixLite 4 Rugged Mk2's pixels per output) was corrected from the maker's manual, quoted under `sources` and noted in `ISSUES.md`.
- **`io.buffered` on a level converter means "can drive a cable"**, and the schema says so. TI describes the TXB0104 as "a buffered architecture", yet its outputs sit behind 4 kΩ and are rated for 70 pF: it is recorded `false`, with the datasheet quotes under `sources`.

## What shipped

| Area           | State                                                                                                                                                                                                                                                                                                                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flow           | Build list with one slot per part: pixel type, layout, controller, level shifter, connector per pixel group; pattern source for the system. Pickers search, sort, explain what doesn't fit and keep the current choice pinned. Any order works. Several groups can share a controller.                                                                                             |
| Parts          | As of 2026-11-20: 43 integrated pixels + 84 driver ICs; 136 controllers, 35 dev boards with recorded outputs, 19 adapters with a known host board; 13 level converters, 48 connectors, 49 pattern sources. The catalog is about 366 KB of JSON (35 KB gzipped), built at prerender time.                                                                                           |
| Compatibility  | Clock line, unit count, pixels per output (RGBW-scaled), device-wide pixel limit, vendor protocol lists (listed / same family / unlisted), supply-voltage range (or the rail of a built-in mains supply, added by stream 2), output and board current, logic thresholds and level shifting, refresh target, string limits, connector contacts / current / sealing, protocol reach. |
| Level shifters | Needed / marginal / not needed from the controller's data level and the pixel's threshold; each shifter checked for reading 3.3 V and for driving a cable (74HC245, TXS0108E and TXB0104 are flagged from datasheet facts; RS-485 parts are set apart as differential). Each row says whether the part comes in a through-hole package.                                            |
| Power          | Full white vs. design brightness, supplies per rail (≤ 80% load, ≤ 60 A each), power-injection feeds, fuse and wire gauge per feed (5% drop), idle draw, universes, the 20 W / 200 W warnings. 12 V pixels with their dice in series are budgeted at one channel current, not three.                                                                                               |
| Parts list     | Quantity-tier prices, published ranges and starting prices carried through to the total, same part merged across groups, host boards, licence tiers, other currencies shown with a USD figure; supplies, fuses and wire as unpriced extras. Copy as Markdown or text, download CSV.                                                                                                |
| Sharing        | Copy link, start over with undo, offered draft, notice for parts that left the database, design name in the tab title.                                                                                                                                                                                                                                                             |
| Export         | Self-contained SVG and PNG with the design embedded (SVG metadata, PNG iTXt); open or drop a file to load it; first-generation SVGs still import. Print stylesheet: the design's name heads the page, controls and empty optional slots are dropped.                                                                                                                               |
| Phone          | One column, page scroll, compact tables, fixed summary bar that stays clear of the compare tray and toasts; tested at 390 px.                                                                                                                                                                                                                                                      |
| Keyboard       | Opening a picker focuses its search box (fine pointers only), closing one returns focus to its slot, Escape closes, slot buttons are labelled for screen readers.                                                                                                                                                                                                                  |
| Ways in        | The system overview's main action, the site header, and a "Use in the designer" link on every part page the designer has a slot for (worked out at build time by `designerHref`).                                                                                                                                                                                                  |
| Tests          | 264 unit tests in `tests/unit/designer-*.test.ts`, 30 Playwright flows in `e2e/designer.test.ts`, 21 production-build checks in `e2e-prod/` (hydration of prerendered pages, including other streams' URL-driven pages).                                                                                                                                                           |

## Plan / steps

1. ~~Power math fix + unit-test harness~~ — shipped 2026-11-18 (`293659f`, `7649798`).
2. ~~Logic library~~ — shipped.
3. ~~UI rebuild~~ — shipped (`c035b19`).
4. ~~e2e coverage~~ and ~~a build-based check in CI~~ — shipped (`7956122`, `981a51a`).
5. ~~System overview~~: links to the designer, readable on a phone — shipped (`d3ada41`).
6. ~~Docs~~: README, ROADMAP, OVERHAUL-PLAN S2 — shipped (`2eb191a`).
7. ~~Polish pass~~: keyboard and focus, print layout, pickers, price ranges, shifter suitability — shipped (`40b57ed`, `16885f4`).
8. ~~Stretch~~: adapters with their host boards; "Use in the designer" links on entry pages — shipped (`15ad2fb`, `3266523`).
9. ~~Follow-up on the data other streams added~~ (2026-11-20): facts for the three new level converters, auto-direction parts counted as weak-output, panel-only hardware left out, the 5 V inference for adapters tightened, maker-prefix protocol lists, one wrong controller row corrected.
10. ~~Dev server start-up~~ (2026-11-20): the e2e runs could no longer start their server on this machine; Vite's watcher now stays out of `build/` and `database/` (see Findings).
11. ~~Series pixels~~ (2026-11-20, handed over by the database review): 12 V parts with their dice in series were budgeted at two to three times their real power; fixed in the power model (see Decisions).

Nothing is in progress. Ideas that were considered and left for later are in ROADMAP.md.

## URL scheme

Per pixel group, repeated and aligned by position (every group writes every key that any group uses):

| Key  | Meaning                                                        | Since |
| ---- | -------------------------------------------------------------- | ----- |
| `p`  | pixel id; `ic-<id>` for a driver IC                            | v1    |
| `x`  | number of strings                                              | v1    |
| `n`  | pixels per string, or dot-separated lengths `150.200.80`       | v1    |
| `c`  | controller id; `mb-<id>` for a dev board, `ad-<id>` an adapter | v1    |
| `v`  | string voltage override (driver ICs, wide-range pixels)        | v2    |
| `l`  | level shifter id                                               | v2    |
| `k`  | connector id                                                   | v2    |
| `gn` | group name                                                     | v2    |

System-wide: `g` pattern source (`standalone` = on-controller playback), `b` design brightness %
(default 100), `f` target fps (30), `a` max amps per power feed (4), `w` feed wire length in m (2),
`o=1` outdoor, `t` title. Defaults are omitted from the URL. A link with a single key
(`/designer?c=falcon-f16v5`) is a valid design with that one slot filled: entry pages use it.

## Code map

- `app/lib/designer/` — pure, client-safe: `catalog` (entries → options, prices, adapters and hosts), `design` (model + URL codec), `electrical` (power, supplies, feeds, fuses, wire, fps), `compat` (checks → issues), `analysis` (one pass over a design), `bom`, `embed` (SVG / PNG source), `diagram` (geometry), `links` (entry page → designer), `examples`, `format`.
- `app/components/designer/` — `Designer` (orchestrator), `useDesignState` (state ↔ URL), `GroupCard` + `SlotRow`, the pickers, `PowerPanel`, `BomTable`, `SystemDiagram`, `exportDiagram`, `parts` (small shared pieces), `browser` (clipboard, downloads).
- `app/routes/designer.tsx` — loader builds the catalog at prerender time; `shouldRevalidate` is `false`.
- `app/routes/entry.tsx` — its loader calls `designerHref` (the only designer code outside the designer's own files).
- `e2e-prod/prerendered.test.ts`, `playwright.prod.config.ts`, `scripts/serve-build.ts` — the production-build suite.

## Findings / gotchas

- **`electrical.wattage` on pixels held one channel's power** (`channel_current × led_voltage`, e.g. WS2812: 18.5 mA × 5 V = 92.5 mW). The old designer multiplied it by pixel count, so 4,000 WS2812 showed 370 W instead of ~1,110 W. Logged in `ISSUES.md`; stream 2 redefined the field on 2026-11-20 as the maker's whole-pixel power and changed the designer's fallback to match (`52de8d86`).
- **Other streams edit the designer's library when their schema changes.** On 2026-11-20 stream 2 changed `catalog.ts`, `compat.ts`, the fixtures and the tests four times in a few hours (bit-depth vocabulary, pixel wattage, typed level-converter fields with `io.differential` / `io.direction` / `supply_voltage`, built-in mains supplies), each time keeping the tests green. Fetch and read their diff before touching those files: a change made on a base an hour old conflicted in five places, and one of mine (spotting RS-485 parts by their `io.interface` text) was already obsolete.
- **Shared links threw React error #418 in production.** The page is prerendered with no query string, so a first client render that reads the URL disagrees with the static HTML. Anything from the URL or localStorage waits for `useHydrated()`. The production suite found the same bug on table pages; stream 7 fixed it (`b69e9fb`) and those URLs are now in the checked list.
- **The e2e suite runs against the Vite dev server, which is not prerendered**, so it cannot see hydration errors. `bun run test:prod` can.
- **A dynamic `import()` in app code broke the production build**: Rollup split the server bundle into `build/server/assets/`, and `getDatabasePath()`'s `../../database` then pointed at `build/database` ("Category directory not found" for every route). Fixed in `app/lib/data.ts` (walks up until `database/_schema` appears).
- **A lazily imported dependency reloads every page on the dev server.** `import('react-dom/server')` made Vite re-optimize dependencies mid-run and broadcast a full reload, which wiped the state of every e2e test in flight. Export now renders through `react-dom/client` (already loaded).
- **`setSearchParams` on a prerendered route re-fetches `/designer.data` on every call** unless the route exports `shouldRevalidate`.
- **Chromium does not confine a sticky grid item to its grid area**: the side column slid over a later full-width row. The diagram row lives outside the grid.
- **Hiding a table header with a 1 px clip leaves its cells laid out** (and off-screen on a phone). Stacked tables carry their labels in each cell instead.
- **Price sorting put the wrong level shifter first.** 74HC245 was the cheapest per line and led the list, although on 5 V it needs 3.5 V to read a high (datasheet: 0.7 × VCC). The fix needed a recorded fact, hence the schema field. TXS0108E reads 3.3 V fine but its datasheet says its outputs source "hundreds of micro-amperes" through pull-ups.
- **A range used to count at its low end.** `{amount, max}` prices (APA102C, ESP-01, …) and, since the price parser learned them, strings such as `Free - $399` and `330+`. `PriceInfo` now carries `maxUSD` and `from`; `costOf()` is the one place totals are made.
- **CSS custom properties defined on `.designer-page` don't reach the compare tray or the toaster** (they live outside it). Rules that move those use literal values.
- **Two fixed bars at the bottom of a phone**: the compare tray (stream 7) docks at `bottom: 0`, so does the designer's summary bar. The designer lifts the tray and the toasts above its bar with `body:has(.designer-mobile-bar)`.
- **Playwright's "scroll into view" can park a button under a fixed bar** and then report the bar as intercepting the click, forever. The e2e helper centres a slot's button before clicking it.
- Pixels have no channel-count field; it is derived from `color.order` (`GRBW` → 4). Driver ICs record `data.channels` as the chip's outputs (6, 9, 12, 16 for multi-pixel chips).
- `led_voltage` can be a range (`3-7.5V`); `parseQuantity` returns the minimum. Nominal is 5 V when the range includes it.
- A controller's host board may be a dev board with no recorded pixel outputs, so hosts are looked up in their own list (`catalog.hosts`), not among the selectable boards.
- `adapters/pocketscroller-v2` counts HUB75 panel outputs in `outputs.count`. It used to be offered with a "not on its list" warning; panel-only hardware is now left out (see Decisions).
- **A `uses` link to a level converter is not always the pixel buffer.** `adapters/esp32-thingplus-dmx-to-led` names a MAX3485 (its DMX transceiver, 3.3 V) next to its TXB0104. Any level-converter link used to make an adapter "buffered, 5 V data"; the converter now has to pass `isDataBuffer`.
- **New database entries change what the designer says without touching its code.** Within a day of shipping, other streams had added 4 level converters, 10 dev boards, 40 driver ICs, 16 pattern sources and the host links for six more adapters. Three of the converters lacked the facts the shifter checks need, so they sat unjudged among the good ones (one of them the TXB0104). Worth a look after every large data pass: count what the catalog offers, run every controller against a common pixel and read which checks fire for whom (an error on two or three controllers is usually a data slip), then open the shifter picker.
- Two controllers (`lightbox`, `lightboard-mini`) list their pixels as "APA, SK, WS". Every pixel got a "not on the list" warning until a bare maker prefix counted as a family.
- Real-database tests break when another stream changes data in a way the designer assumed away. That is their job, but keep their bounds loose: twice in one day they failed on legitimate data (multi-pixel chips, a host board without outputs).
- Reading datasheet tables: `pdftotext -layout` scrambles TI's tables; grouping PyMuPDF's words by their y coordinate rebuilds the rows reliably.
- Machine notes: `srmctl run --low` starved Playwright completely at 100% CPU (10 minutes at 0.0 cores) — run at normal priority. Under load, other streams' e2e tests time out (`e2e/mobile.test.ts` loads `/controllers` four times inside a 30 s test and failed here at 99% CPU, alone and in the full run; it is not a designer failure). Background tasks are killed after 2 hours, so no long-lived dev server: let Playwright start its own.
- **A cold dev server took minutes to serve its first page, and the cause was file watching, not compiling** (2026-11-20). Symptoms: Playwright's "Timed out waiting 60000ms from config.webServer", or in the server log "transport invoke timed out after 60000ms … fetchModule /app/app.css" followed by a 500 for every request until restart. Vite opens a watcher per file under the root, React Router's child compiler (a second Vite server) opens them all again, and with a leftover `build/` plus `database/` that was about 6,700 blocking `fs.watch` calls on Windows: 7 s on a quiet machine, 100 to 120 s at 90% CPU. How it was found: `DEBUG=vite:transform` showed 83 s inside the transform of `/app/app.css` (the first module to wait on the starved event loop); `preprocessCSS` on that file took 0.2 s without the project's config and 98 s with it; a CPU profile of that put 57% of the time in `FSWatcher` start, called from Vite's bundled chokidar. Fixed in `vite.config.ts` (`quietWatcher` keeps the watcher out of `build/`, `database/` and `playwright-report/`): first page after 19 s instead of 207 s on the same busy machine. If it creeps back, look for a new large directory under the root. A stuck run still holds its broker slots: kill the `srmctl` process tree, not just the shell.
- Git Bash rewrites arguments that start with `/` (`/designer` → `C:/Program Files/Git/designer`, `origin/master:path` breaks). Use `MSYS_NO_PATHCONV=1` or avoid the leading slash. Shell heredocs and `node -e` strings break on backticks and quotes: write edit scripts to a file first.
- Piping a long command into `tail` hides all output until it exits. Log to a file and wrap in `timeout`.
- Master moves every few minutes. Rebase, run the fast checks (they include the real-database tests), and push at once; run the slow suites before that on a base a few commits older.

## Progress log

- [x] 2026-11-18: read build-out plan, ROADMAP, OVERHAUL-PLAN; audited designer code, data coverage and UI.
- [x] 2026-11-18: step 1 pushed — full-white power fix, hydration fix for shared links, `bun test` harness.
- [x] 2026-11-18: step 2 — logic library with unit tests.
- [x] 2026-11-18: step 3 — UI rebuild (build list, pickers, power plan, parts list, diagram, export / import, phone layout).
- [x] 2026-11-18: step 4 — Playwright flows.
- [x] 2026-11-18 6:53 PM PST (2026-11-19 02:53Z): pushed to master as `c035b19` (9 commits, rebased onto 80+ concurrent upstream commits): thumbnails, `max_total`, multi-pixel chips, host boards, canonical links, `ISSUES.md` entries.
- [x] 2026-11-18 8:15 PM PST (2026-11-19 04:15Z): pushed to master as `16885f4` (8 commits): production-build suite in CI, system overview, focus and tab title, level-converter thresholds (schema + data from datasheets), shifter checks, price ranges, print layout.
- [x] 2026-11-18 8:53 PM PST (2026-11-19 04:53Z): pushed to master as `2eb191a` (3 commits): adapters with their host boards, picker search by host and firmware, "Use in the designer" on entry pages, README / ROADMAP / OVERHAUL-PLAN / ISSUES. CI run 44461388722 passed every job, deploy included.
- [x] 2026-11-20: re-checked the designer against the 63 commits other streams landed since (master's CI green at `f4c3620`), and followed up on the new data: step 9. A sweep of every controller through the checks (WS2812 and APA102, 100 per string) turned up one wrong row: PixLite 4 Rugged Mk2 was recorded at 85 pixels per output; Advatek's manual gives 340 in expanded mode (corrected, with the quote under `sources`).
- [x] 2026-11-20: the e2e runs could not start their dev server any more; traced to file watching and fixed in `vite.config.ts` (step 10).
- [x] 2026-11-20: rebased twice over the database review's schema changes (typed level-converter fields, whole-pixel wattage, built-in mains supplies), which had already adapted the designer's library; took its hand-off for 12 V series pixels (step 11): six parts now match their makers' whole-pixel power instead of three times it.

## Open questions for the user

None.

## Things not to do

- Don't run Playwright against port 5173 on this machine: it may be another workstream's server and the config reuses it silently.
- Don't multiply a 12 V pixel's channel current by its channels without asking whether it is a series part (`PixelOption.series`): go through `pixelMaxAmps()`. And don't size from `electrical.wattage` alone when a channel current is recorded: the maker's whole-pixel figure is the fallback and the series test, not the budget.
- Don't treat a missing `outputs.protocols` list as "unsupported", or any missing fact as an incompatibility. An unrecorded `buffered` is not `false`.
- Don't total a price without going through `costOf()`: a range's low end is not its price.
- Don't drive design edits through router navigations (`setSearchParams`): see Decisions.
- Don't add a dynamic `import()` of a dependency that isn't already loaded at startup: it reloads every open page in dev and breaks e2e runs.
- Don't import `~/lib/designer` into another route's component: the catalog builders are meant for loaders (build time). `entry.tsx` imports `~/lib/designer/links` and uses it in its loader only.
- Don't assert database values in tests; fixtures are synthetic and real-data tests check invariants.
- Don't add dependencies without a strong reason: seven streams share `bun.lock`.
- Don't edit database rows beyond the level-converter facts above (a single plainly wrong value, checked against the maker's document and quoted under `sources`, is the only exception: see Decisions). A commit that touches rows without checking their facts carries a `Not-A-Review` trailer or its hash goes in `IGNORED_COMMITS` (`app/lib/data.ts`).
- Don't fix the shared header or tables from here: log it in `ISSUES.md` for the owning stream.
- Don't force-push; on rejection refetch and rebase.
