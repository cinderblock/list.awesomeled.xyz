# Website build-out: beat the spreadsheet

## Goal

Make list.awesomeled.xyz clearly better than the original Google Sheet
(<https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA>)
so the sheet can be retired: full data parity, cleaner and verified data,
and features a spreadsheet can't offer (designer, cross-links, images,
compare, rich filtering, shareable URLs, exports).

## Environment

- Repo: `cinderblock/list.awesomeled.xyz` (public; GitHub Pages deploy on every push to `master`, CI is free).
- Main checkout: `C:\Users\camer\git\Personal Projects\list.awesomeled.xyz`.
- Each workstream runs in its own T3 thread and git worktree, branched from `origin/master`.
- Bun only. Checks: `bun run validate`, `bun run lint`, `bun run format:check`, typecheck, tests (see `package.json`).
- Existing planning docs: `ROADMAP.md` (current queue), `TODO.md`, `OVERHAUL-PLAN.md` (history), `database/issues.txt` (known data bugs).

## Decisions already made (don't re-ask)

- History is linear on `master`: rebase onto `origin/master` and push fast-forward. Never force-push.
- Spreadsheet row parity is roughly reached (sheet Controllers ≈135 rows vs 137 YAML entries); the work now is column/field parity, data quality and features.
- Cloudflare/R2 and any infra change need Cameron's explicit per-change yes (see global CLAUDE.md). Stage, don't apply.
- Parked owner decisions in `ROADMAP.md` stay Cameron's: ask, don't decide.

## Workstreams (one thread each)

Each thread keeps its own `plans/<workstream>.md` and owns the files listed. Touch another stream's area only for a small, obvious fix; otherwise log it in `ISSUES.md`.

1. **Spreadsheet parity audit** — `plans/spreadsheet-parity.md`. Column-by-column and row-by-row diff of every sheet tab against the YAML database; migrate anything missing; produce the "retire the sheet" checklist.
2. **Database review & standardization** — `plans/database-review.md`. TODO.md "Complete database review": `database/issues.txt`, standardize IC packages, async/clocked, diffusive-material types, controller `inputs`, schema tightening.
3. **System Designer** — `plans/designer.md`. `app/routes/designer.tsx`, `system-overview.tsx`: finish Stretch 2 (compatibility checks, power estimates, export, URL state, polish).
4. **Cross-links & relationships** — `plans/cross-links.md`. Research-driven population of `related` / `related_*` refs (Goal 3).
5. **Images & datasheets** — `plans/assets.md`. Images with structured attribution (Goal 4); datasheet mirror prep (R2 blocked on Cameron).
6. **Prices, availability & link health** — `plans/data-freshness.md`. ROADMAP data backlog: price gaps, commercial-system price ranges, discontinued audits, link-rot issue #2.
7. **Browse/compare UX** — `plans/browse-ux.md`. Table/category/entry/home UX beyond the spreadsheet: global search, faceted filters, column picker, side-by-side compare, shareable URL state, mobile, performance, SEO/OG, accessibility.

## Progress log

- [x] 2026-11-18: project cloned and registered in T3; workstream threads launched (links below).
- [x] 2026-11-18: CI test job pinned to `ubuntu-24.04` (`44a6f99`); `ubuntu-latest` = 26.04 broke Playwright 1.58 browser install, so every deploy was failing.

## Threads

- 1 Parity (Opus 5.5, max): [LED list: spreadsheet parity audit](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:328890dcdf41d1ba8705679e401fe9555246366c78fd42ecbe693d7ce8d4a001)
- 2 Database (Opus 5.5, max): [LED list: database review & standardization](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:59b2094884060cbff22813ce66f26c8c2c44c2966b8334e1017aff616e87b1b2)
- 3 Designer (Fable 5.2, max): [LED list: System Designer completion](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:cd14287ae444189debd11bedbe5d09926a79bde17cac99ca0238da5b52bbc54e)
- 4 Cross-links (Opus 5.5, max): [LED list: cross-links & relationships](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:8d96dda419cf21bbe3989b2ecbc4d12c3adfa03426c6df5364070c24927ae59a)
- 5 Assets (Opus 5.5, xhigh): [LED list: images & datasheets](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:fe95c4c51139162eb2c41b0116cd80b9a0d5ebe0290e9d0a6aaa786367297bca)
- 6 Freshness (Opus 5.5, xhigh): [LED list: prices, availability & link health](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:4138403f9634731146bb9a7e5e865752dc7a4436640e77594eb200abd2c717c8)
- 7 Browse UX (Fable 5.2, max): [LED list: browse & compare UX](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/mcp:launch:47d8a3b454a0797a131038c191a6e40c82f4aa5f198e691a62119e5dfa285a62)
