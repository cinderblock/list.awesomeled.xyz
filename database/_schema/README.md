# Database schemas

One JSON Schema (draft-07) per category, named for one entry
(`controller.json` describes `database/controllers/*.yaml`), plus
`common.json` with the definitions they share: quantities (`voltage`,
`current`, `power`, `frequency`, `length`), `year`, `status`, attribution
(`creator`, `manufacturers`, `vendors`), prices, images, datasheets, links
between entries, `sources`, and the closed vocabularies (control protocols,
input interfaces, IC packages, programming languages, color depth).

How to write values (units, ranges, lists, `_notes`, directions) is in
[CONTRIBUTING.md](../../CONTRIBUTING.md#values); every category's
`_example.yaml` shows all of its fields in use.

## How the site reads them

- **The schema types the site.** The field catalog (`app/lib/fields.ts`)
  derives each field's kind from its schema: an `enum` filters as a set of
  values, a quantity definition sorts and filters by number with its unit, a
  string-or-object union reads as a name with links. A field typed as a plain
  string gets none of that, so use the shared definitions.
- **A property's own `description` is its column tooltip.** Write what the
  field means there. Descriptions inside shared definitions explain how to
  write a value and are not shown.
- **`$ref`s into `common.json` are fully qualified**
  (`common.json#/definitions/voltage`), including refs inside `common.json`
  itself: the validator and the field catalog both resolve them that way.

## Validation

`bun run validate` (`scripts/validate.ts`) checks every entry and every
`_example.yaml` against its schema, that each `sources` and `measurements`
key names a field the entry has, and that each measured value fits its
field's schema. Unresolved link names are reported as warnings.

## Changing a schema

Change the entries with it, in the same commit:

1. Write a migration, `scripts/migrations/<date>-<name>.ts`, with the helpers
   in `scripts/migrations/lib.ts` (`migrateCategory`, `getJS`, `setJS`,
   `remove`, `renameKey`, `orderKeys`). They edit YAML in place, keeping
   comments and key order. Map every old value explicitly and throw on any it
   doesn't know, so an entry in an unexpected shape stops the migration
   instead of being mangled; the migrations in that folder are examples.
2. Update the schema, the category's `_example.yaml`, and whatever reads the
   field: curated table columns (`app/lib/columns.tsx`), the system designer
   (`app/lib/designer/`), the spreadsheet parity map
   (`scripts/sheet-parity/columns.ts`).
3. Keep the migration commit apart from corrections to the data, and add its
   hash to `IGNORED_COMMITS` in `app/lib/data.ts` in a follow-up commit: a
   re-encoding is not a review, and the entry pages' "Reviewed" date must not
   move for it.
4. After rebasing onto other work, run the migration again: entries added
   elsewhere arrive in the old shape.
