# System Designer (workstream 3)

Part of the [website build-out](website-buildout.md). Owner of `app/routes/designer.tsx`,
`app/routes/system-overview.tsx`, `app/lib/designer/`, `app/components/designer/`,
`app/components/diagram/`, `app/styles/designer.css`, `e2e/designer.test.ts` and the
`tests/unit/designer-*.test.ts` files.

## Goal

Make `/designer` the headline feature a spreadsheet can't do: a PCPartPicker-style flow where
someone picks pixels → controller or DIY board → level shifter / connectors / power, and gets
live compatibility checks, a power budget with injection and fusing guidance, a bill of
materials with prices where known, a shareable URL, and SVG/PNG exports that carry their own
re-importable source. It has to work well on a phone.

## Environment

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-designer-4898e829197c5f7d`, branch `ws/designer`.
- Ship: rebase onto `origin/master`, then `git push origin HEAD:master` (fast-forward only, never force). Every push deploys production.
- Bun 1.4.4, Node 26, Playwright 1.58.1 (Chromium already installed).
- Checks before any push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:unit`, `bun run test:e2e`, `bun run build`.
- **This worktree's e2e port is 5473**: `E2E_PORT=5473 bunx playwright test --project=chromium --workers=2 --retries=1`. Playwright starts and stops its own dev server on that port. Seven workstreams share the machine; the default 5173 may be another worktree's server.
- Heavy runs go through the compute broker: `~/.srm/bin/srmctl run --slots 2 --label "…" -- <cmd>` (no `--low`, see Findings).
- Production-only behaviour is checked against `build/client` with a short-lived static server (prerendered HTML, hydration); the dev server is not prerendered.
- Screenshots are taken headless with Playwright only. Nothing may open a window on Cameron's screen.

## Decisions already made (don't re-ask)

- **A link is the saved file.** The design's canonical query string is everything; localStorage only keeps a draft that is _offered_ on a bare `/designer` visit, never applied by itself. First-generation links (`p`/`x`/`n`/`c`/`g`) must keep working forever and re-serialize byte-identically; new keys are additive and defaults are left out.
- **Design state lives in the component; the address bar follows it with `history.replaceState`** (throttled to one write per 350 ms, Safari allows 100 per 30 s). Router navigations (first load, a link, back/forward) replace the design. Reason: a router navigation per keystroke re-ran the route and landed asynchronously, so two quick edits overwrote each other.
- **Full-white power = channel current × channels × LED voltage.** The database's `electrical.wattage` is one channel's power, so it is never used as a per-pixel figure.
- **The ~20 W / ~200 W safety warnings use the full-white maximum**; supplies, feeds, fuses and wire are sized for the brightness the user designs for. Reason: wiring and fuses must survive what the pixels can pull if software misbehaves.
- **Too few outputs means "N units", not "incompatible"** (up to 8 units). A device-wide pixel limit (`outputs.pixels.max_total`) counts toward the unit count too.
- **Unknown data never produces an error.** Missing facts become "verify" notes; only recorded facts can make a part incompatible.
- **Pickers open in place (accordion), not in modal dialogs.** Page scroll instead of nested scroll boxes; nothing sits above the Radix tooltips. One open at a time.
- **The diagram's geometry is a pure function** (`app/lib/designer/diagram.ts`). The page paints it CSS-themed; exports paint it again with a literal light palette and inlined PNG thumbnails, serialized with `XMLSerializer` from a detached React root.
- **Cross-category facts come from the relation graph** (`app/lib/relations.ts`, stream 4): listed pixel support, firmware, host boards, output connectors. The designer does no name matching of its own beyond protocol-family wildcards ("WS281x").
- **Driver ICs (`pixel-ics`) are selectable as pixels** (`p=ic-ws2811`) with a chosen string voltage. A chip with six or more outputs counts as several pixels (`pixelsPerPart`).
- **Unit tests run under `bun test tests/unit`** with an ambient `bun:test` type shim, so no new dependency. Fixtures are synthetic; the two files that load the real database assert invariants only, never values.
- **Exported files point at the canonical site** (`SITE_ORIGIN`), "Copy link" copies the current origin.
- **No database edits from this stream.** Data problems go to `ISSUES.md`.

## What shipped

| Area          | State                                                                                                                                                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flow          | Build list with one slot per part: pixel type, layout, controller, level shifter, connector per pixel group; pattern source for the system. Pickers search, sort, explain what doesn't fit and keep the current choice pinned. Any order works. Several groups can share a controller.              |
| Parts         | 36 integrated pixels + 41 driver ICs, 132 controllers + dev boards with recorded outputs, 9 level converters, 45 connectors, pattern sources that send a protocol or run on a board.                                                                                                                |
| Compatibility | Clock line, unit count, pixels per output (RGBW-scaled), device-wide pixel limit, vendor protocol lists (listed / same family / unlisted), supply-voltage range, output and board current, logic thresholds, refresh target, string limits, connector contacts / current / sealing, protocol reach. |
| Power         | Full white vs. design brightness, supplies per rail (≤ 80% load, ≤ 60 A each), power-injection feeds, fuse and wire gauge per feed (5% drop), idle draw, universes, the 20 W / 200 W warnings.                                                                                                      |
| Parts list    | Quantity-tier prices, same part merged across groups, host boards, licence tiers, other currencies shown with a USD figure; supplies, fuses and wire as unpriced extras. Copy as Markdown or text, download CSV.                                                                                    |
| Sharing       | Copy link, start over with undo, offered draft, notice for parts that left the database.                                                                                                                                                                                                            |
| Export        | Self-contained SVG and PNG with the design embedded (SVG metadata, PNG iTXt); open or drop a file to load it; first-generation SVGs still import. Print stylesheet.                                                                                                                                 |
| Phone         | One column, page scroll, compact tables, fixed summary bar; tested at 390 px.                                                                                                                                                                                                                       |
| Tests         | 222 unit tests in `tests/unit/designer-*.test.ts`, 23 Playwright flows in `e2e/designer.test.ts`.                                                                                                                                                                                                   |

## Plan / steps

1. ~~Power math fix + unit-test harness~~ — shipped 2026-11-18 (`293659f`, `7649798`).
2. ~~Logic library~~ — shipped.
3. ~~UI rebuild~~ — shipped.
4. ~~e2e coverage~~ — shipped. **Remaining ← current:** a build-based check in CI for production-only failures (hydration).
5. **System overview**: link it to the designer; check it on a phone.
6. **Docs**: README, ROADMAP ("Designer v2" → shipped), OVERHAUL-PLAN S2 status.
7. **Polish pass**: keyboard / focus behaviour, print layout, picker details on a phone, catalog size.
8. **Stretch**: shields (adapters) as a slot for dev boards once adapters adopt the shared `pixel_outputs` shape and `host` links (streams 2 and 4); "Use in the designer" links on entry pages (stream 7 owns `entry.tsx`).

## URL scheme

Per pixel group, repeated and aligned by position (every group writes every key that any group uses):

| Key  | Meaning                                                  | Since |
| ---- | -------------------------------------------------------- | ----- |
| `p`  | pixel id; `ic-<id>` for a driver IC                      | v1    |
| `x`  | number of strings                                        | v1    |
| `n`  | pixels per string, or dot-separated lengths `150.200.80` | v1    |
| `c`  | controller id; `mb-<id>` for a dev board                 | v1    |
| `v`  | string voltage override (driver ICs, wide-range pixels)  | v2    |
| `l`  | level shifter id                                         | v2    |
| `k`  | connector id                                             | v2    |
| `gn` | group name                                               | v2    |

System-wide: `g` pattern source (`standalone` = on-controller playback), `b` design brightness %
(default 100), `f` target fps (30), `a` max amps per power feed (4), `w` feed wire length in m (2),
`o=1` outdoor, `t` title. Defaults are omitted from the URL.

## Code map

- `app/lib/designer/` — pure, client-safe: `catalog` (entries → options), `design` (model + URL codec), `electrical` (power, supplies, feeds, fuses, wire, fps), `compat` (checks → issues), `analysis` (one pass over a design), `bom`, `embed` (SVG / PNG source), `diagram` (geometry), `examples`, `format`.
- `app/components/designer/` — `Designer` (orchestrator), `useDesignState` (state ↔ URL), `GroupCard` + `SlotRow`, the pickers, `PowerPanel`, `BomTable`, `SystemDiagram`, `exportDiagram`, `parts` (small shared pieces), `browser` (clipboard, downloads).
- `app/routes/designer.tsx` — loader builds the catalog at prerender time; `shouldRevalidate` is `false`.

## Findings / gotchas

- **`electrical.wattage` on pixels is per channel** (`channel_current × led_voltage`, e.g. WS2812: 18.5 mA × 5 V = 92.5 mW). The old designer multiplied it by pixel count, so 4,000 WS2812 showed 370 W instead of ~1,110 W. Logged in `ISSUES.md` for stream 2.
- **Shared links threw React error #418 in production.** The page is prerendered with no query string, so a first client render that reads the URL disagrees with the static HTML. Anything from the URL or localStorage waits for `useHydrated()`.
- **The e2e suite runs against the Vite dev server, which is not prerendered**, so it cannot see hydration errors.
- **A dynamic `import()` in app code broke the production build**: Rollup split the server bundle into `build/server/assets/`, and `getDatabasePath()`'s `../../database` then pointed at `build/database` ("Category directory not found" for every route). Fixed in `app/lib/data.ts` (walks up until `database/_schema` appears).
- **A lazily imported dependency reloads every page on the dev server.** `import('react-dom/server')` made Vite re-optimize dependencies mid-run and broadcast a full reload, which wiped the state of every e2e test in flight. Export now renders through `react-dom/client` (already loaded).
- **`setSearchParams` on a prerendered route re-fetches `/designer.data` on every call** unless the route exports `shouldRevalidate`.
- **Chromium does not confine a sticky grid item to its grid area**: the side column slid over a later full-width row. The diagram row lives outside the grid.
- **Hiding a table header with a 1 px clip leaves its cells laid out** (and off-screen on a phone). Stacked tables carry their labels in each cell instead.
- Pixels have no channel-count field; it is derived from `color.order` (`GRBW` → 4). Driver ICs record `data.channels` as the chip's outputs (6, 9, 12, 16 for multi-pixel chips).
- `led_voltage` can be a range (`3-7.5V`); `parseQuantity` returns the minimum. Nominal is 5 V when the range includes it.
- A controller's host board may be a dev board with no recorded pixel outputs, so hosts are looked up in their own list (`catalog.hosts`), not among the selectable boards.
- Real-database tests break when another stream changes data in a way the designer assumed away. That is their job, but keep their bounds loose: twice in one day they failed on legitimate data (multi-pixel chips, a host board without outputs).
- The site header is 9 px wider than a 390 px phone since the header search landed, so every page scrolls sideways (logged for stream 7). The designer's phone test measures against the designer's own box for that reason.
- Machine notes: `srmctl run --low` starved Playwright completely at 100% CPU (10 minutes at 0.0 cores) — run at normal priority. Under load, other streams' e2e tests time out creating a browser page; `--retries=1` separates those from real failures. Background tasks are killed after 2 hours, so no long-lived dev server: let Playwright start its own.
- Git Bash rewrites arguments that start with `/` (`/designer` → `C:/Program Files/Git/designer`, `origin/master:path` breaks). Use `MSYS_NO_PATHCONV=1` or avoid the leading slash.
- Piping a long command into `tail` hides all output until it exits. Log to a file and wrap in `timeout`.
- Master moves every few minutes. Rebase, run the fast checks (they include the real-database tests), and push at once; run the slow suites before that on a base a few commits older.

## Progress log

- [x] 2026-11-18: read build-out plan, ROADMAP, OVERHAUL-PLAN; audited designer code, data coverage and UI.
- [x] 2026-11-18: step 1 pushed — full-white power fix, hydration fix for shared links, `bun test` harness.
- [x] 2026-11-18: step 2 — logic library with unit tests.
- [x] 2026-11-18: step 3 — UI rebuild (build list, pickers, power plan, parts list, diagram, export / import, phone layout).
- [x] 2026-11-18: step 4 — 23 Playwright flows.
- [x] 2026-11-18 6:53 PM PST (2026-11-19 02:53Z): pushed to master as `c035b19` (9 commits, rebased onto 80+ concurrent upstream commits): thumbnails, `max_total`, multi-pixel chips, host boards, canonical links, `ISSUES.md` entries.
- [ ] Step 4 remainder: build-based check in CI
- [ ] Step 5 system overview
- [ ] Step 6 docs
- [ ] Step 7 polish pass
- [ ] Step 8 stretch

## Open questions for the user

None.

## Things not to do

- Don't run Playwright against port 5173 on this machine: it may be another workstream's server and the config reuses it silently.
- Don't use `electrical.wattage` as a per-pixel number.
- Don't treat a missing `outputs.protocols` list as "unsupported", or any missing fact as an incompatibility.
- Don't drive design edits through router navigations (`setSearchParams`): see Decisions.
- Don't add a dynamic `import()` of a dependency that isn't already loaded at startup: it reloads every open page in dev and breaks e2e runs.
- Don't assert database values in tests; fixtures are synthetic and real-data tests check invariants.
- Don't add dependencies without a strong reason: seven streams share `bun.lock`.
- Don't touch database YAML rows; if a structural commit ever does, it carries a `Not-A-Review` trailer or its hash goes in `IGNORED_COMMITS` (`app/lib/data.ts`).
- Don't fix the shared header, table or entry pages from here: log it in `ISSUES.md` for the owning stream.
- Don't force-push; on rejection refetch and rebase.
