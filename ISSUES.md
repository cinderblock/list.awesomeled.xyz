# Issues

Side issues found while working on something else, plus cross-workstream
coordination notes. Each entry: what was seen, why it matters. Claim an entry
(`in progress — <thread/branch>`) before working on it; remove it or mark it
fixed with the commit hash when done. Workstreams: see
[plans/website-buildout.md](plans/website-buildout.md).

## Same product in two categories

Seen by cross-links (stream 4). These entries describe one product twice:

- `adapters/quinled-dig-quad` and `controllers/quinled-dig-quad`
- `adapters/quinled-dig-uno` and `controllers/quinled-dig-uno`
- `adapters/espartstick` and `controllers/espartstick`
- `adapters/m4-port-pixel` and `controllers/m4-port-pixel`
- `adapters/m8-port-pixel` and `controllers/m8-port-pixel`
- `controllers/standard-differential-receiver` and `level-converters/standard-differential-receiver`

Why it matters: specs drift apart, and compatibility links and filters show the
product twice. Needs a keep/merge call (parity or standardization stream).
Cross-links leaves these pairs unlinked until that's decided. (Hardware vs.
firmware twins such as `adapters/espixelstick` vs.
`drive-libraries/espixelstick`, or `pattern-drivers/wled` vs.
`drive-libraries/wled`, are distinct things and get linked.)

## Coordination: link fields belong to cross-links (stream 4)

Stream 4 is researching and filling these fields across the database
([plans/cross-links.md](plans/cross-links.md)): controllers'
`outputs.protocols`, `software.firmware` / `works_with`,
`inputs.requires_host`, `outputs.driver.IC` and the free-text
`outputs.connector` values; drive libraries' `supported_ics` (being split
from control protocols) and the legacy `related_*` arrays (being retired);
every entry's `related`, `aliases` and `sources`; pixels' and pixel ICs'
`data.type` protocol families. Please don't batch-edit those; log findings
here instead. Spelling variants ("APA-106" vs "APA106", "WS2812b") don't need
rewriting: `app/lib/relations.ts` matches names case- and
punctuation-insensitively, through `aliases` and `variants[].name`.

## Designer: shared name resolver available (stream 3, FYI)

`app/lib/designer.ts` `checkCompat` decides "vendor lists this pixel" with a
substring token match between `outputs.protocols` and pixel names/types.
`app/lib/relations.ts` now resolves those names to exact entries
(`resolveName` against `graph.indexes.pixel`, aliases and variants included)
and exposes protocol families (`graph.familyOf` / `graph.families`, from
`data.type`). Switching would make the explicit-support check exact and let
"WS2811 listed" count for every WS2811/12-family pixel. Not a bug; the
designer's call.

## Entry-page and table changes from cross-links (stream 7, FYI)

Entry pages now have a "Works with" section (driven by, supported by, runs on,
host for, used in, same protocol) and a "Related products" section, both from
`app/components/ui/EntryLinks.tsx`; they replaced the old "Related Products",
`related_*` and "Used by …" sections. Name-list fields render as link pills in
their card, and `sources` provenance renders under the field it documents.
Next from stream 4: compatibility columns and "compatible with X" filters,
added through `app/lib/columns.tsx` only (no `DataTable` / `ColumnFilter`
internals). Shout here if that collides with the browse-UX work.
