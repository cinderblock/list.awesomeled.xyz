# Spreadsheet parity audit (workstream 1)

## Goal

Prove that list.awesomeled.xyz holds everything the original Google Sheet
holds, so the sheet can be retired. For every tab: map every column to a YAML
field (or record why it is intentionally dropped), diff every row against
`database/<category>/`, find sheet values (incl. cell notes, comments,
hyperlinks, highlight flags) missing or different in YAML, migrate what's
missing (conflicts resolved by research, not by trusting either side), port
the sheet's README tab into the site's About page, and finish with a concrete
"ready to retire the sheet" checklist.

Parent plan: [website-buildout.md](website-buildout.md).

## Environment / context

- Sheet: <https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA>
  ("Addressable LED Controllers, Drivers, and Related Products"), owned by
  Cameron, created 2019-11-06, link-shared ("UNLISTED"), **still being edited**:
  599 Drive revisions, latest 2026-11-18 7:30 AM PST (15:30Z), roughly one
  edit every few days through Sep–Nov 2026.
- Read-only access: public XLSX/CSV export
  (`/export?format=xlsx`, `/export?format=csv&gid=<gid>`) needs no auth; the
  Google Sheets/Drive MCP tools also work. **Never edit the sheet.**
- 13 tabs (gid): README 1749630164, Pattern Drivers 961824890, Controllers 0,
  Pixels 755169190, Pixel ICs 795156605, Pixel Decoders 1520623513,
  Level Converters 1484346977, Adapters 866679715, DIY MicroBoards 1497158237,
  Connectors 602979062, Drive Libraries 1543805468, Diffusive Materials
  554721273, " Commercial Pixel Systems" (leading space) 248280587.
- Worktree: `C:\Users\camer\.t3\worktrees\list.awesomeled.xyz\ws-spreadsheet-parity-687910563e855f27`,
  branch `ws/spreadsheet-parity`. Ship = rebase onto `origin/master`,
  `git push origin HEAD:master` (fast-forward only). Every push deploys prod.
- Checks before push: `bun run validate`, `bun run lint`,
  `bun run format:check`, `bun run typecheck`, `bun test`.

## Decisions already made (don't re-ask)

- Row parity is roughly reached; the work is column/field parity + data
  quality (parent plan).
- Read-only on the sheet; fetch via public export.
- Keep structural commits separate from per-entry data commits; batch commits
  that don't review row data go into `IGNORED_COMMITS` (CLAUDE.md).
- Other workstreams own: DB standardization (2), designer (3), cross-links (4),
  images/datasheets (5), prices/link health (6), browse UX (7). Cross-cutting
  bugs go to `ISSUES.md`.

## Sheet conventions (from its README tab)

- Cell highlight legend: purple `#D9D2E9` = "needs to be verified";
  light yellow `#FFF2CC` = "likely missing data that should be easy to fill in".
- Numeric columns hold bare numbers; units come from custom number formats
  (e.g. `0V`, `0.0"mA"`, `[>=1000]0.0,"kHz";0"Hz"`).
- Cell _Notes_ carry per-cell extra info; the _Notes column_ is for high-level
  notes; _Comments_ are for contentious changes.

## Plan / steps

1. ~~Orient: read parent plan, CLAUDE.md, ROADMAP, TODO, issues.~~
2. ~~Fetch the sheet (XLSX + CSV), inventory tabs/headers/notes/links/fills.~~
3. **(current)** Build a re-runnable parity tool (`scripts/sheet-parity.ts`):
   XLSX reader (values, formulas, links, notes, fills, number formats),
   row matching sheet↔YAML, per-column comparators, report output.
4. Row parity: unmatched rows on either side → add / record why absent.
5. Column mapping per tab (table below), incl. intentionally dropped columns.
6. Cell-level triage per tab: sheet-only values → migrate; conflicts →
   research; YAML-better → record.
7. Notes, comments, hyperlinks, highlight flags, formulas (currency source).
8. README tab → About page.
9. Retire-the-sheet checklist; final re-run of the tool right before freeze.

## Column mapping

(filled in per tab as the audit proceeds)

## Findings / gotchas

- Header cells have been vandalized/accidentally overwritten: Controllers A1
  is `?>`, Pixels A1 `li`, Level Converters A1 `206`, Drive Libraries A1 `3`
  carrying a stray note ("measured current across 3 LEDs at 12V. datasheet
  claims 15mA") that belongs to some pixel row.
- Diffusive Materials has 15 cells with date formats (`m-d`, `m/d`): likely
  Sheets auto-converted rating ranges like `3-4` into dates. Check values.

## Progress log

- [x] 2026-11-18: oriented; sheet downloaded and inventoried.
- [ ] Parity tool
- [ ] Row parity
- [ ] Column mapping
- [ ] Per-tab cell triage (12 tabs)
- [ ] Notes / comments / links / highlights / formulas
- [ ] README → About
- [ ] Retire checklist

## Open questions for the user

(none yet)

## Things not to do

- Don't edit the Google Sheet (read-only audit).
- Don't blindly overwrite YAML with sheet values: many YAML values were
  researched after the sheet copy; resolve conflicts with sources.
