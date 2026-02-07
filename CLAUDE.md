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

## Simple mistakes

The "Simple Browser" in VS Code doesn't support URL editing features.
