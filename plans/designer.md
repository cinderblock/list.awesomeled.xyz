# System Designer (workstream 3)

Part of the [website build-out](website-buildout.md). Owner of `app/routes/designer.tsx`,
`app/routes/system-overview.tsx`, `app/lib/designer/`, `app/components/designer/`,
`app/components/diagram/`, `app/styles/designer.css`, `e2e/designer.test.ts`, `tests/unit/`.

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
- **Dev server for this worktree runs on port 5473** (`bunx react-router dev --port 5473 --strictPort --host 127.0.0.1`). Seven workstreams share this machine; the default 5173 may belong to another worktree, and `playwright.config.ts` reuses whatever server is already listening. `E2E_PORT=5473` points Playwright at this worktree's server.
- Heavy runs (Playwright, build) go through the compute broker: `~/.srm/bin/srmctl run --slots N --label "…" -- <cmd>`.
- Screenshots are taken headless with Playwright only. Nothing may open a window on Cameron's screen.

## Decisions already made (don't re-ask)

- **The URL is the source of truth for a design.** localStorage only keeps a draft for "come back later". Old links (`p`/`x`/`n`/`c`/`g`) must keep working forever; new keys are additive.
- **Full-white power = channel current × channels × LED voltage.** The database's `electrical.wattage` is one channel's power (it equals `channel_current × led_voltage` on 20 of 21 rows that have both), so it is never used as a per-pixel figure. See Findings.
- **The ~20 W / ~200 W safety warnings use the full-white maximum**, not the brightness-limited figure. Supply sizing uses the brightness the user designs for. Reason: wiring and fuses must survive what the pixels can pull if software misbehaves.
- **Pickers are inline accordions, not modal dialogs.** One open at a time, page scroll instead of nested scroll boxes. Reason: the site's Radix tooltips portal to `<body>` and would render underneath a native `<dialog>`; inline panels are also the better phone experience.
- **The diagram is a React component with a palette prop.** On the page it follows the site theme; exports render it again with the light palette and inlined images, so a downloaded file never depends on the site.
- **Unit tests run under `bun test tests/unit`** with a small ambient `bun:test` type shim (same approach as `scripts/bun-runtime.d.ts`), so no new dependency and no `bun.lock` churn across seven concurrent streams.
- **No database edits from this stream** beyond what compatibility logic strictly needs. Data problems go to `ISSUES.md` for streams 1/2/6.
- **Driver ICs (`pixel-ics`) are selectable as pixels** (`p=ic-ws2811`), with a chosen string voltage. WS2811 12 V strings are the most common real-world build and live in that category.

## Audit: what shipped before this stream (2026-11-18)

Working: card-grid pixel picker, layout with per-string lengths, controller list with
clocked/output/capacity checks, DIY boards behind a toggle, level-shifter advisory text, pattern
source matching by protocol, per-voltage power rails, 20 W / 200 W warnings, refresh ceiling,
SVG download with embedded JSON, SVG re-import, URL state, localStorage draft.

Gaps found:

| Area          | Gap                                                                                                                                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Power         | **Under-reports full-white power about 3×** (uses per-channel wattage as per-pixel). RGBW treated as 3 channels. No injection, fusing, wire or supply-count guidance. No idle draw.                                                                                             |
| Compatibility | No voltage check against the controller's input range. No per-output or board current check. No protocol-family check. Level shifting ignores the pixel's recorded logic threshold. `data.max_per_string` ignored. Too few outputs = "incompatible" instead of "needs N units". |
| Parts         | No connector selection. Level shifter is advice only, not a part. Driver ICs (WS2811…) can't be chosen. Host boards (`requires_host`) not surfaced.                                                                                                                             |
| BOM           | None.                                                                                                                                                                                                                                                                           |
| Sharing       | No copy-link button; no notice when a link references a removed part; no way to start over (draft restores silently).                                                                                                                                                           |
| Export        | SVG only, hot-links images from the live site, no PNG. Import is SVG only.                                                                                                                                                                                                      |
| UX            | Long single page, nested scroll boxes, selected controller scrolls out of view, diagram is thumbnail-sized, number fields snap back to 1 while typing. On a phone the page is ~9,500 px tall and the summary sits at the very bottom.                                           |
| Tests         | No designer coverage at all (unit or e2e).                                                                                                                                                                                                                                      |

## Plan / steps

1. ~~**Power math fix + unit-test harness**~~ — done, shipped first because it was a safety-relevant bug in production.
2. **Logic library** `app/lib/designer/` ← current: catalog builders, design model + URL codec, electrical planning, compatibility engine, BOM, embed format (SVG metadata, PNG iTXt). Unit tests for each.
3. **UI rebuild**: build list with accordion pickers (pixels, layout, controller, level shifter, connector, pattern source), compatibility banner, power panel, BOM table, diagram, share/export/import, mobile summary bar, print styles.
4. **e2e coverage** (`e2e/designer.test.ts`): main flow, warnings, URL round-trip, legacy links, SVG and PNG import round-trip, BOM, mobile viewport, no console errors.
5. **System overview**: link it to the designer; check it on mobile.
6. **Docs**: README, ROADMAP ("Designer v2" → shipped), OVERHAUL-PLAN S2 status, ISSUES.md for cross-stream data findings.
7. **Stretch** (only after 1–6 ship): adapters/shields as an optional slot for DIY boards; "Open in designer" links from entry pages (stream 7 owns `entry.tsx` — coordinate through `ISSUES.md`).

## URL scheme

Per pixel group, repeated and aligned by position (every group writes every key that any group uses):

| Key  | Meaning                                                  | Since |
| ---- | -------------------------------------------------------- | ----- |
| `p`  | pixel id; `ic-<id>` for a driver IC                      | v1    |
| `x`  | number of strings                                        | v1    |
| `n`  | pixels per string, or dot-separated lengths `150.200.80` | v1    |
| `c`  | controller id; `mb-<id>` for a DIY board                 | v1    |
| `v`  | string voltage override (driver ICs, wide-range pixels)  | v2    |
| `l`  | level shifter id                                         | v2    |
| `k`  | connector id                                             | v2    |
| `gn` | group name                                               | v2    |

System-wide: `g` pattern source (`standalone` = on-controller playback), `b` design brightness %
(default 100), `f` target fps (30), `a` max amps per power feed (4), `w` feed wire length in m (2),
`o=1` outdoor, `t` title. Defaults are omitted from the URL.

## Findings / gotchas

- **`electrical.wattage` on pixels is per channel.** `bun run <scratchpad>/wattage.ts` shows `wattage ÷ (channel_current × led_voltage) = 1.00` for 17 of 21 rows (e.g. WS2812: 18.5 mA × 5 V = 92.5 mW), 1.02–1.04 for three, and four outliers: `lc8808b`, `ns8808`, `ws2851` (0.42 — computed at 5 V although `led_voltage` is 12 V) and `sk6805` (4.00). The schema describes the field as "Power per pixel". The old designer multiplied it by pixel count, so 4,000 WS2812 showed 370 W instead of ~1,110 W.
- Pixels have no channel-count field; it is derived from `color.order` (`GRBW` → 4).
- `led_voltage` can be a range (`3-7.5V` on LC8823/LC2823); `parseQuantity` returns the minimum, which is why those cards showed "3 V". Nominal is taken as 5 V when the range includes it.
- Git Bash rewrites arguments that start with `/` (`/designer` became `C:/Program Files/Git/designer`). Pass URL paths without the leading slash to helper scripts.
- `outputs.protocols` is recorded on only 7 of 135 controllers, so protocol matching can confirm support but its absence proves nothing.
- Connectors have no prices (0 of 45) and level converters 8 of 9; pixels 10 of 36 (LCSC bare-part tiers). The BOM must say what a price is for and count unpriced lines.
- `related_microboards` / `related_connectors` on adapters are empty (0 of 45) and `parent` is free text, so shield ↔ board matching is fuzzy.
- **Shared links threw React error #418 in production.** The page is prerendered with no query string, so the first client render (design from the URL) disagreed with the static HTML. Anything read from the URL or localStorage must wait for `useHydrated()` (`app/hooks/useHydrated.ts`).
- **The e2e suite runs against the Vite dev server, which is not prerendered**, so it cannot see hydration errors. Production-only behaviour has to be checked against `build/client` (a static server on port 5474 was used here). Step 4 adds a build-based check.
- `srmctl run --low` starved Playwright completely while the machine sat at 100% CPU: the run idled for 10 minutes at 0.0 cores. Run test suites at normal priority; keep `--slots`.
- `bun run format:check` flagged all 633 files on Windows (CRLF checkout, Prettier defaulting to `lf`). `.prettierrc` now has `endOfLine: auto`; git still stores LF.
- Piping a long command into `tail` hides all output until it exits, which makes a hang look like slowness. Log to a file and wrap in `timeout`.

## Progress log

- [x] 2026-11-18: read build-out plan, ROADMAP, OVERHAUL-PLAN; audited designer code, data coverage and current UI (desktop, dark, phone screenshots).
- [x] 2026-11-18: plan written.
- [x] 2026-11-18: step 1 — full-white power fix, hydration fix for shared links, `bun test` harness (15 tests), first designer e2e tests (4), `E2E_PORT`, Prettier line endings.
- [ ] Step 2 logic library
- [ ] Step 3 UI rebuild
- [ ] Step 4 e2e
- [ ] Step 5 system overview
- [ ] Step 6 docs
- [ ] Step 7 stretch

## Open questions for the user

None yet.

## Things not to do

- Don't run Playwright against port 5173 on this machine: it may be another workstream's server and the config reuses it silently.
- Don't use `electrical.wattage` as a per-pixel number.
- Don't treat a missing `outputs.protocols` list as "unsupported".
- Don't add dependencies without a strong reason: seven streams share `bun.lock`.
- Don't touch database YAML rows for convenience; if a structural commit ever does, its hash goes in `IGNORED_COMMITS` (`app/lib/data.ts`).
- Don't force-push; on rejection refetch and rebase.
