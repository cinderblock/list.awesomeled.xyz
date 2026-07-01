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

Entry pages show "Updated" from each YAML file's last git commit. Any
schema-level / database-wide / mechanical commit (migrations, key reordering,
prettier passes) MUST have its hash added to `IGNORED_COMMITS` in
`app/lib/data.ts` in a follow-up commit, so batch touches don't masquerade as
real data updates. Keep structural commits and per-entry data commits separate.

The test is information, not batch size: a commit that records newly verified
facts about entries (dead-link annotations, confirmed statuses, corrected
values) is a genuine update and must NOT be ignored, even when it touches many
files at once. Ignore only reshaping that adds no new information.

## Simple mistakes

The "Simple Browser" in VS Code doesn't support URL editing features.
