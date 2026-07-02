# Project Notes for Claude

## Package Manager / Runtime

This project uses **Bun** (not npm/node). Use `bun` commands:

- `bun install` - Install dependencies
- `bun run build` - Build the project
- `bun run dev` - Start dev server
- `bun run lint` - Run linting
- `bunx ...` - Instead of `npmx ...` for one-off commands

## Database Schema

YAML data files use these key fields for attribution:

- `creator` - Original designer/developer (primary field)
- `manufacturers` - Array of manufacturers that produce the item
- `vendors` - Array of vendors that sell/distribute the item
- `developer` - Deprecated alias for `creator` (only in drive-library/pattern-driver schemas)

## ESLint YAML Key Order

Database YAML files enforce key ordering: `name`, `creator`, `developer`, then alphabetical.

## Batch commits and "Updated" timestamps

Entry pages and tables show "Reviewed" from each YAML file's last git commit —
it means "when this row was last specifically checked for accuracy". Any commit
that touches rows WITHOUT reviewing their data MUST have its hash added to
`IGNORED_COMMITS` in `app/lib/data.ts` in a follow-up commit. Keep structural
commits and per-entry data commits separate.

The test: did someone verify this row's facts? Ignore migrations, key
reordering, prettier passes, restructures, link-liveness sweeps, and batch
enrichment derived from the entries' own notes (e.g. family cross-links). Do
NOT ignore externally verified facts (vendor-confirmed statuses, published
prices, corrected values) or per-entry research commits.

## Simple mistakes

The "Simple Browser" in VS Code doesn't support URL editing features.
