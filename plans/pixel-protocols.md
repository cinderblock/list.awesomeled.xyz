# Pixel protocols explainer (workstream 8)

Part of the [website build-out](website-buildout.md). Thread: workstream 8,
launched by the cross-links thread (stream 4) on 2026-11-20.

## Goal

Cameron's request (verbatim): "I want a page that explains the pixel
protocols. I'd love it to become the official system that cuts through the
bullshit of two pixels claiming different protocol when on the wire they're
the same thing. I want nice animations of the single wire protocol, dual wire
(SPI), explanations of backup data wire, DMX512, and a mention of sACN but
don't get into ethernet details." He sees it as "a new category/explainer
page/detail... a little different than the existing product pages" and will
have more input.

Two deliverables:

1. **Canonical on-the-wire protocol families**, defined by what the signal
   does (line coding, bit timing and tolerances, bits per channel, channels
   per pixel, frame structure, how each pixel passes data on, backup-line
   behaviour), not by marketing names. Parts that can't be told apart on the
   wire share a family; real differences are stated precisely. Every claim
   from a datasheet, maker page or standard.
2. **An explainer page** (`/protocols`) with animations: single wire
   (WS2811-style), clocked two-wire (APA102-style), the backup data line,
   DMX512 (plus DMX-addressed pixel ICs), and a mention of sACN. Then tie the
   database's `data.type` to the families (after Cameron approves the data
   model).

## Environment / context

- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-pixel-protocols-7a0bde064d6a8372`, branch `ws/pixel-protocols`.
- Ship: rebase onto `origin/master`, `git push origin HEAD:master` (fast-forward only, never force). Every push deploys production (Cloudflare Pages; GitHub Pages is the CI backup).
- Checks before a push: `bun run validate`, `bun run lint`, `bun run format:check`, `bun run typecheck`, `bun run test:unit`, plus `bun run test:e2e` (headless chromium) for UI changes.
- Code this stream touches: new `app/routes/protocols.tsx` + components under `app/components/protocols/`, styles in `app/styles/protocols.css`; one-line additions to `app/routes.ts`, `app/lib/data.ts` (`getAllRoutes`), `app/routes/sitemap.ts`, the header nav (stream 7's) and the search palette's page list.
- Protocol families today come from `data.type` (free text) on pixels and pixel ICs. Consumers: `app/lib/relations.ts` (families, "Same protocol (…)" rows, `linked.pixels`), `tests/unit/relations.test.ts`, `scripts/cross-link-stats.ts`, the designer (`app/lib/designer/catalog.ts` `family`, `compat.ts` `familyTokens` parses "WS2811/12" shorthand), `app/lib/fields.ts` label "Protocol family".
- Research notes and evidence: `plans/pixel-protocols/` (one file per batch, every claim with its URL and quote).

## Decisions already made (don't re-ask)

- Build the explainer first; the animations and explanations don't depend on the data-model decision. SVG/CSS/JS in React, `prefers-reduced-motion` respected, light and dark, fits a phone. No `title=` tooltips: information inline or behind a tap-to-expand.
- Propose the data model (category vs typed enum, how entries reference a family, the mapping of every current `data.type` value with evidence) **before** migrating any data; Cameron approves it first.
- A schema change (new category or enum) is logged with stream 2 in ISSUES.md before landing.
- Per-entry research commits are reviews (not in `IGNORED_COMMITS`); batch commits derived only from existing notes go in `IGNORED_COMMITS` or carry `Not-A-Review:`.

## Plan / steps

1. [x] Read the build-out plan, CLAUDE.md, CONTRIBUTING.md, ROADMAP.md, ISSUES.md, cross-links plan; census of `data.type` (below).
2. [ ] **(current)** Research: datasheets for every family (delegated batches, evidence in `plans/pixel-protocols/`), spot-checked here.
3. [ ] Explainer page `/protocols`: single-wire animation, clocked animation, backup line, DMX512, sACN mention, family table.
4. [ ] Nav entry, search palette, sitemap, e2e + a11y coverage; ISSUES.md notes for streams 2, 3, 7.
5. [ ] Data-model proposal (this file) and the mapping of every `data.type` value; show Cameron.
6. [ ] After approval: schema change (with stream 2), migrate entries, update `relations.ts`, its tests, `cross-link-stats.ts`, designer `familyTokens` (with stream 3), link entry pages and "Same protocol" rows to the explainer.

### Research agents (delegated 2026-11-20 5:45 PM PST, 01:45Z)

Brief: [pixel-protocols/BRIEF.md](pixel-protocols/BRIEF.md). Each writes one
`plans/pixel-protocols/<batch>.yaml` (+ `.md` summary), no commits; reviewed
and committed here.

- [A1: WorldSemi single-wire](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A7a4f8658-808c-4edc-8b1d-7863708b21c2) → `a1-worldsemi`
- [A2: SK68xx, APA10x, PL9823](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Ab6155fa2-f598-480c-8ca5-e64fea11438d) → `a2-sk-apa`
- [B1: Titan Micro](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Aadb6d483-eb1d-4d98-a621-f2e3021b348c) → `b1-titan`
- [B2: UCS](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A83e4486f-06dd-444b-902a-05a99975b9f8) → `b2-ucs`
- [B3: Sunmoon SM16xxx, GS/CS/GE/LC](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A13c148b5-6792-4027-8393-ff7d42b5df2a) → `b3-sm-gs`
- [B4: other single-wire and odd protocols](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Aa434f024-a49e-43ed-a8c7-b29a377d349a) → `b4-other-single-wire`
- [C1: APA102-style and 16-bit clocked](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A9878e6c2-99f0-4332-83c8-1ce67c9b865c) → `c1-apa102`
- [C2: other clocked ICs](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Ae7194df5-bf21-4e11-8780-8c2939ed0d85) → `c2-clocked`
- [D: DMX512, sACN, DMX pixel ICs](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3A0fa71b90-009f-4c0e-8d55-a43668bd2299) → `d-dmx`
- [E: what controllers and libraries send](t3-thread://v2/ab3781d7-a1dd-4bbb-b3e9-6331e19b7569/thread:delegated-task:command%3Amcp%3A9275f472-123d-44e2-bf22-0b5aee7cc4a0%3Adelegate-task%3Afd1e3cd9-0ced-4eed-b18d-4cd66572c112) → `e-practice`

## Census of `data.type` (2026-11-20, `8c72dc72`)

126 pixels + pixel ICs; 118 with a value, 8 without (ge1603, gs8202,
icnd2110, qed3001, pixel-ics/sk6818, tc2811, ucs2603, p943). 41 distinct
values: `WS2811/12` 44, `APA102` 10, `UCS1903` 7, `4chWS2811/12` 7,
`DMX512P` 5, `SK9826` 4, `LPD6803` 3, `LPD8806` 2, `MBI6023` 2, `MY9231` 2,
`SM16716` 2, `4chSM16803` 2, `WS2801` 2, and 28 single-use labels. The
trailing-space `WS2811 ` / `WS2812 ` values mentioned in the brief are gone
already.

## Findings / gotchas

- (none yet)

## Progress log

- [x] 2026-11-20 5:33 PM PST (01:33Z): survey done, plan written.

## Open questions for the user

- (none yet; the data-model proposal will bring some)

## Things not to do

- Don't migrate `data.type` values before Cameron approves the data model.
- Don't batch-derive families from name similarity; every assignment needs a datasheet or maker source.
- Don't edit `DataTable.tsx` / `ColumnFilter.tsx` internals (stream 7) or the designer's code (stream 3) without coordinating in ISSUES.md.
- Don't put `title=` tooltips on anything.
- Don't pipe a gating command into `tail`/`grep` in a chain that ends in `git push` (the pipe's status is the filter's).
