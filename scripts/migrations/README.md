# Database migrations

One-shot scripts that reshaped the YAML database when a schema changed. Each
was run once, in the commit that introduced it, and is kept as a record of how
the data was transformed (and so a branch with entries in the old shape can
re-run it after rebasing). They are not part of the build.

- `lib.ts` — shared helpers. Edits go through the `yaml` Document API, so
  comments survive, and unchanged top-level blocks keep their original bytes,
  so a migration's diff shows only what it changed.
- `<date>-<topic>.ts` — one migration each; run with `bun scripts/migrations/<file>`.

Re-running a migration on already-migrated data is a no-op.

Every migration commit is structural (no facts re-checked), so its hash goes
into `IGNORED_COMMITS` in `app/lib/data.ts` in a follow-up commit (see
CLAUDE.md, "Batch commits and Updated timestamps").
