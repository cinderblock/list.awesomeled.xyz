# Data freshness: prices, availability & link health

Workstream 6 of the website build-out (`plans/website-buildout.md`).
Branch `ws/data-freshness`, own worktree.

## Goal

Keeping the data current is the thing a stale spreadsheet can't do. Close
every ROADMAP "Data backlog" item about prices, availability and link rot,
then make freshness durable: the site should show how old a price is, and
the tooling should keep finding rot and staleness without someone remembering
to look.

## Status (2026-11-18, evening PST)

Everything below is on `master` except where marked. One owner decision is
open (monthly workflow re-enable); the `$` scale for commercial systems is a
proposal waiting on Cameron.

|                                                 | Start of day                  | Now                       |
| ----------------------------------------------- | ----------------------------- | ------------------------- |
| Prices with a retrieval date (`price_source`)   | 0 (40 as YAML comments)       | 287                       |
| Priced entries with no date                     | 227                           | 39 (no real source found) |
| Connectors priced                               | 0 / 45                        | 34 / 45                   |
| Pixel ICs / pixels priced                       | 12 / 10                       | 18 / 16                   |
| Stale prices (> 12 months, still sold)          | —                             | 2 (archived captures)     |
| Entries with status evidence (`sources.status`) | 0                             | 300 of 483                |
| Link sweep (Node, local)                        | 12 dead · 69 check (415 URLs) | see Issue #2 comment      |

## Environment / context

- Repo `cinderblock/list.awesomeled.xyz` (public, free CI). Every push to
  `master` deploys production.
- "Reviewed" column/date = last git commit touching the YAML, minus
  `IGNORED_COMMITS` in `app/lib/data.ts` (author date, `%aI`). Verified
  prices/statuses are review commits; link-liveness-only and structural
  commits go in `IGNORED_COMMITS`.
- Link checker: `node scripts/check-links.ts` locally on Windows (see
  gotchas), `bun run check-links` in CI; monthly workflow
  `.github/workflows/check-links.yml` updates rolling issue
  [#2](https://github.com/cinderblock/list.awesomeled.xyz/issues/2).
- Price schema (`database/_schema/common.json`): `price` (number, "$12",
  free|varies|contact|unknown, `{amount, max?, currency?}`), `price_tiers`
  (`[{qty, price, sku}]`), `price_source` (`retrieved`, `vendor`, `part`,
  `url`, `notes`). Pattern drivers: `pricing.source`; commercial systems:
  `pricing.examples[].source` and `pixels`.
- Status provenance uses stream 2's per-field `sources` map
  (`sources.status`), replacement provenance `related[].source`.
- Currency rates: `app/lib/currency.ts` (ECB via frankfurter.dev,
  `RATES_AS_OF = '2026-11-18'`); `bun run validate` fails any currency
  without a rate.
- Research evidence (per-entry quotes, URLs, unresolved items, wrong facts
  for other streams): [`plans/data-freshness/findings/`](data-freshness/findings/).
- Original sheet: <https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA>.

## Decisions already made (don't re-ask)

- Real sources only, retrieval date recorded for every price touched; never
  estimate.
- Prices keep their original currency; sorting uses USD equivalents.
- **Regular price, not sale price** (sale goes in `price_source.notes`).
- **Archived last list prices** (discontinued products) are dated by the
  capture and never flagged stale; the site says "last list price".
- A product URL that now redirects to a generic brand page counts as dead.
- Generic/no-name parts get a street-price range `{amount, max}` from ≥ 3
  marketplace listings, `vendor: AliExpress (street)`.
- Connectors are families: price one representative orderable SKU, with
  `price_source.notes` saying exactly what it buys.
- Status `discontinued` only with evidence; out of stock ≠ discontinued.
- Link-liveness-only commits are excluded from "Reviewed"; status
  re-confirmed with evidence counts as a review.

## What shipped

1. **Price provenance** — `price_source` on every flat-price category;
   entry pages show "as of <date> · <vendor part>" linking the source, or
   "price date not recorded"; > 12-month-old prices are flagged on the entry
   page and get a clock mark in table cells; discontinued products read
   "last list price" and never go stale. 40 comment dates migrated.
2. **Price display** — Price column on pixels / pixel ICs / connectors;
   four decimals below $1; shared tier SKU named once; ranges, "FOSS",
   "330+" and "Free–$399" parse and sort; unparseable software pricing shows
   as muted text instead of "-".
3. **Commercial systems** — every system has a product link, status with
   evidence and (where published) sourced price points with pixel counts;
   new **Per Pixel** column (cheapest example ÷ pixels, USD).
4. **Research pass** — 12 parallel research agents + a pilot covered every
   hardware/software entry: link triage, status with evidence, current
   regular price. Summaries are in the commit messages; evidence in
   `plans/data-freshness/findings/`.
5. **Link checker** — probes prose URLs, `description.md` and MDX pages;
   keeps parenthesised URLs whole; one request per host at a time (no more
   429 walls); re-probes `dead_links` and lists ones that came back (same
   site only); flags deep links that redirect to a homepage; price-staleness
   section in the monthly report (`--prices` for offline use).
6. **Guards** — `validate` rejects prices in currencies without a rate (an
   INR price broke the table e2e on master until `a026c50`); prettier
   follows platform line endings (format:check failed on every Windows
   file).
7. **Reviewed date** — entry pages say "Reviewed <date>" and link to the
   YAML file's GitHub history (was a hover-only tooltip).

## Findings / gotchas

- **The monthly link check stopped running.** `gh workflow list --all` →
  `Monthly link check  disabled_inactivity`: GitHub disables scheduled
  workflows on public repos after 60 days with no commits (2026-07-17 →
  2026-11-18). No Nov 3 run. Re-enabling needs Cameron's yes.
- **Bun 1.4.4 on Windows fails TLS** to github.com and many hosts
  (`EPROTO: The TLS handshake failed`, 213 false CHECKs). Use
  `node scripts/check-links.ts` locally; CI (Linux) is fine.
- **Bot walls**: Mouser, Digi-Key, TME, Farnell, RS, Arrow, Octopart and eBay
  block every scripted client, headless Chrome included. Microchip only via
  headless Playwright with `channel: 'chrome'` +
  `--disable-blink-features=AutomationControlled`. LCSC product pages work
  with Node fetch (search doesn't). Shopify `<product>.json` is the most
  reliable price/availability source. AliExpress needs Playwright and
  captcha-walls after a while.
- **Concurrent streams and integration**: other streams restructured
  adapters/pixel-decoders, merged duplicate entries and added `sources` /
  `related` while agents ran. Cherry-picks conflicted on almost every slice.
  Lessons: resolve with a 3-way-aware rule (master owns structure and other
  fields; ours owns price/status/dead_links; merge `sources` and `related`);
  a key only our side has is kept only if the merge base lacked it
  (otherwise master deleted it on purpose — luminaxa's `software`, the
  merged `m4-pi.yaml`); audit every slice for dropped `related`/`sources`.
- **`IGNORED_COMMITS` hashes change on every rebase**: add entries only in
  the last commit before the push and regenerate them after each rebase.
- **`origin/master` is shared across worktrees**: another stream's fetch
  moves it mid-rebase. Pin the base SHA before `rebase -i --autosquash`.
- Pre-push checks must not be piped through `tail` (hid a typecheck
  failure once; that one was a stale nested `ajv` in `node_modules`).
- The Bash tool strips backslashes in heredocs: write scripts with the
  Write tool.
- ESLint's terminology autofix ("repo" → "repository") corrupts `''`-escaped
  YAML strings ("Unexpected scalar at node end"): avoid the word in quoted
  notes.
- The sheet's Commercial tab never defined the `$` scale, and the existing
  ratings don't track price per pixel (Festoon 2 `$$$` at $21–33/pixel,
  Triklit `$$$$` at $5–8/pixel).

## Progress log

- [x] Plan, census, schemas, issue #2 read.
- [x] Prettier `endOfLine: auto` + `.gitattributes`.
- [x] `price_source` schema, migration, entry/table UI, e2e.
- [x] Checker v2 (prose URLs, pacing, BACK, prices), FX refresh, Reviewed
      label.
- [x] Research pass, 13 slices, all pushed (`1d45f70` … `e4804a6`).
- [x] Commercial per-pixel comparison; price-range parsing; BRL rate.
- [x] ISSUES.md: closed "prices that disagree with the maker", "price tier
      SKU squeezed", "e2e missing values sort last" (cause: our INR price).
- [x] Checker v3 (parentheses, homepage redirects, BACK same-site,
      discontinued never stale).
- [ ] Issue #2 comment with the final sweep.
- [ ] Owner decisions below.

## Open questions for the user

1. **Monthly link check workflow** — re-enable it (`gh workflow enable
check-links.yml`) and add a deploy-workflow job that re-enables it on
   every push, so the 60-day inactivity rule can't silently stop it again?
   Recommendation: yes to both.
2. **Commercial `$` scale** — define `price_range` as USD per pixel,
   ×4 per step: `$` < $0.25, `$$` < $1, `$$$` < $4, `$$$$` < $16,
   `$$$$$` < $64, `$$$$$$` ≥ $64? That would re-rate Festoon 2 and Q4
(`$$$` → `$$$$$`), Flex and VC-Dot (`$$$$$$`→`$$$$$`), Lightwalls
   (`$$$$$`→`$$$`), and rate the SmartShow panels `$`. Alternative: keep
`$` as the sheet's qualitative market tier and rely on the new Per Pixel
   column. Recommendation: keep the qualitative tier, document it as such,
   and let Per Pixel carry the objective comparison.
3. **Same chip, two names** (NS107S/HD107S, NS108/HD108, NS8808/HD8808 —
   Newstar sells both): reuse the HD price on the NS entries, or merge
   them (stream 2's duplicates call)?

## Things not to do

- Don't put retrieval dates in YAML comments — use `price_source`.
- Don't treat 403/429/timeouts as dead; confirm from a browser-like fetch.
- Don't record marketplace listing prices as list prices.
- Don't take "ours" wholesale when resolving conflicts with other streams
  (see gotchas); audit dropped `related`/`sources` after every slice.
- Don't add a new currency without a rate in `currency.ts` (validate now
  enforces it).
