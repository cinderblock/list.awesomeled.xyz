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

## Data-model proposal (DRAFT: mapping pending research; not approved)

### Two layers

1. **Signal**: how bits are put on the wire. Four kinds cover every part in
   the database: single-wire pulse-width, clock + data, asynchronous serial
   with a break (DMX512), plain asynchronous serial (UART). The explainer's
   sections follow these.
2. **Protocol**: everything a transmitter must get right for a part to work:
   signal, bit timing, bits per channel, channels per frame, extra frame
   content (headers, brightness, command words, start / end frames) and the
   latch rule. Parts with the same protocol are interchangeable on the wire;
   that is the equivalence the "Same protocol" rows, the "compatible with X"
   filters and the designer need.

Within one protocol, parts may still differ in ways a controller setting
covers or that don't touch the wire: **channel order** (GRB vs RGB: every
controller has the setting), **backup data line** (wiring, per part),
**reset time** (the protocol records the longest any member needs; a
transmitter that waits that long drives them all), supply voltage, current.

### Where protocols live (options)

- **A. A 13th database category** (`database/protocols/`, table + entry
  pages through the generic routes). Rejected: protocols aren't products,
  and the category nav, home grid, exports, search and OG images all assume
  products.
- **B. A typed enum in the schema + definitions in TypeScript.** Simple, but
  the facts and their sources would live in code, outside the database and
  its YAML downloads.
- **C. (recommended) Reference data in the database, not a category:**
  `database/protocols/<id>.yaml` validated by `database/_schema/protocol.json`
  (name, aliases, signal, timing with min/max per parameter, frame layout,
  latch, notes, `sources` in the usual convention). Pages: `/protocols` (the
  explainer, with the protocol list) and `/protocols/<id>` (definition,
  sourced timing table, member parts, hardware that drives them). Entries
  reference a protocol by id; `validate.ts` checks the reference.

### How entries reference a protocol

- `data.protocol: ws2811` (one id, or a list for parts with a mode pin or a
  compatibility mode), replacing the free-text `data.type`.
- `data.clocked` and `data.pixel_size_bits` become checks: `validate.ts`
  fails an entry whose values contradict its protocol. `data.backup_line`
  stays per part.
- Consumers move with it: `relations.ts` (families from `data.protocol`),
  its tests, `cross-link-stats.ts`, the designer (`catalog.ts` family,
  `compat.ts` `familyTokens` no longer needed), `fields.ts` label, CSV/JSON
  exports, CONTRIBUTING.md.

### Mapping of every current `data.type` value

Pending the research batches (A1–E). Each row will give the value, its
entries, the proposed protocol id and the evidence.

## Findings / gotchas

- **Datasheet revisions disagree on single-wire timing, and the intersection
  can be razor thin.** Read here (2026-11-20, independent of the batches):
  the early WS2812B sheet (Adafruit's copy, no revision printed) gives T0H
  0.4 µs ±150 ns, T1H 0.8 µs ±150 ns, T0L 0.85 µs ±150 ns, T1L 0.45 µs
  ±150 ns, reset "Above 50µs", TH+TL 1.25 µs ±600 ns. WorldSemi's WS2813B-V6
  (V1.1) gives T0H 220–380 ns, T1H 580 ns–1 µs, T0L and T1L 580 ns–1 µs,
  reset >280 µs. Taken literally, a 1's low time must be 580–600 ns to meet
  both. Expect the batches to show the same pattern: the high times are what
  matter (measurements, batch E), the printed low-time windows are not.
- WS2813B-V6 says why the reset grew: "RESET time>280µs, it won't cause wrong
  reset while interruption, supports the lower frequency and inexpensive
  MCU." Its backup line: "Under normal circumstances, the IC extracts signals
  from the DIN. When one IC among them is damaged, the latter IC extracts the
  signal from the BIN without affecting the signal transmission of the
  subsequent ics." The V6 package has DI, BI, DO and **BO** pins (typical
  application circuit, p. 6), and the first IC's BIN must go to GND. What BO
  carries (a passive copy of DI, or a driven one) decides what a fully dead
  chip does: open question for batch A1.
- The APA102C sheet (Shiji / iPixel, Adafruit's copy) is an image PDF: no
  text layer, quotes are transcribed. Frame: 32 zero bits, LED frames of
  111 + 5-bit global + B, G, R (MSB first), 32 one bits; the DIN/CKI diagram
  marks the rising edges.
- WorldSemi's WS2812B sheet's own diagram ("Data transmission method", p. 4)
  draws exactly the chain behaviour the animation shows: D2 carries the
  second and third 24 bits, D3 only the third, each in the same time slot as
  on D1 (the line is idle while the earlier frames go by upstream).
- Tooling: `python -I` ignores PYTHONIOENCODING; datasheets with fullwidth
  punctuation need `sys.stdout.reconfigure(encoding='utf-8')` to print.
- ESLint's `react-hooks/refs` rule flags any `.ref` property read in render,
  even a callback ref returned by a hook; the timeline's callback is
  `observe`.

## Progress log

- [x] 2026-11-20 5:33 PM PST (01:33Z): survey done, plan written.
- [x] 2026-11-20 5:45 PM PST (01:45Z): ten research batches delegated (above).
- [x] 2026-11-20 6:00 PM PST (02:00Z): page scaffold committed locally (`98c0f8ea`, not pushed): `/protocols` route, single-wire bits + chain (vertical on phones), clocked bits, stalled-sender comparison, backup line, DMX512 packet; header/footer/palette/sitemap links; 7 e2e tests and unit tests for the models. Values on the page are still placeholders.
- [x] 2026-11-20 6:25 PM PST (02:25Z): WS2812B (early), WS2813B-V6 and APA102C read independently; `app/lib/protocols/reference.ts` holds their sourced values and quotes; unit tests check every citation and the common-timing arithmetic.
- [ ] Batches report back; review, spot-check, commit evidence; finish the page text from sourced values; proposal + mapping for Cameron.

## Open questions for the user

- (none yet; the data-model proposal will bring some)

## Things not to do

- Don't migrate `data.type` values before Cameron approves the data model.
- Don't batch-derive families from name similarity; every assignment needs a datasheet or maker source.
- Don't edit `DataTable.tsx` / `ColumnFilter.tsx` internals (stream 7) or the designer's code (stream 3) without coordinating in ISSUES.md.
- Don't put `title=` tooltips on anything.
- Don't pipe a gating command into `tail`/`grep` in a chain that ends in `git push` (the pipe's status is the filter's).
