# Data freshness: prices, availability & link health

Workstream 6 of the website build-out (`plans/website-buildout.md`).
Branch `ws/data-freshness`, own worktree.

## Goal

Keeping the data current is the thing a stale spreadsheet can't do. Close
every ROADMAP "Data backlog" item about prices, availability and link rot,
then make freshness durable: the site should show how old a price is, and
the tooling should keep finding rot and staleness without someone remembering
to look.

## Environment / context

- Repo `cinderblock/list.awesomeled.xyz` (public, free CI). Every push to
  `master` deploys production; run validate, lint, format:check, typecheck,
  e2e before pushing.
- Ship: rebase onto `origin/master`, `git push origin HEAD:master`. Never
  force-push. Other streams edit the same YAML files — push small batches.
- "Reviewed" column/date = last git commit touching the YAML, minus
  `IGNORED_COMMITS` in `app/lib/data.ts` (author date, `%aI`). Verified
  prices/statuses are review commits; pure link-liveness sweeps and
  structural migrations go in `IGNORED_COMMITS` (follow-up commit).
- Link checker: `bun run check-links` (`scripts/check-links.ts`), monthly
  workflow `.github/workflows/check-links.yml` updates rolling issue
  [#2](https://github.com/cinderblock/list.awesomeled.xyz/issues/2).
- Price schema: `common.json#/definitions/price` (number / "$12" / free|varies|contact|unknown /
  `{amount, currency}`), `price_tiers` (`[{qty, price, sku}]`). Retrieval
  dates exist only as YAML comments today (`price: # LCSC C155753, 2026-07`).
- Currency rates are checked in: `app/lib/currency.ts` `RATES_AS_OF = '2026-07'`.
- Original sheet: <https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA>.
  Its Commercial tab never defined the `$`…`$$$$$$` scale.

### Census at start (2026-11-18)

| Category            | Entries | Priced                                 | No price               | Status recorded                        |
| ------------------- | ------- | -------------------------------------- | ---------------------- | -------------------------------------- |
| adapters            | 45      | 37                                     | 8                      | 7 discontinued, rest none              |
| controllers         | 135     | 129                                    | 6 (+ PIXPoE `unknown`) | 88 active, 27 disc., 19 unknown, 1 EOL |
| microboards         | 36      | 33                                     | 3                      | 3 discontinued                         |
| pixel-decoders      | 12      | 12                                     | 0                      | 1 discontinued                         |
| level-converters    | 9       | 8 (7 tiered)                           | 1 (TC4427)             | none                                   |
| pixel-ics           | 41      | 12 (LCSC tiers)                        | 29                     | 1 active                               |
| pixels              | 36      | 10 (LCSC tiers)                        | 26                     | 13 active                              |
| connectors          | 45      | 0                                      | 45                     | none                                   |
| commercial-systems  | 18      | 5 with examples, 16 with `price_range` | —                      | none                                   |
| diffusive-materials | 45      | 44 `price_range`                       | 1                      | none                                   |

## Decisions already made (don't re-ask)

- Real sources only, retrieval date recorded for every price touched.
- Prices keep their original currency (`{amount, currency}`); sorting uses
  `currency.ts` USD equivalents.
- Link sweeps that only add `dead_links` are ignored for "Reviewed";
  vendor-confirmed statuses, published prices and corrected values count.
- Schema/standardization is stream 2's area, browse UX stream 7's: touch
  them only where this stream's feature needs it (price provenance field,
  price cell/entry rendering), and keep the change self-contained.

## Plan / steps

1. **Link health** ← current
   - Run the sweep locally (Nov run never happened, see Findings).
   - DEAD → `dead_links` (+ replacement URL where the product moved).
   - CHECK list (bot-blocked/timeouts) → verify by hand/browser-ish fetch,
     fix moved URLs, replace dead ones, mark dead.
   - Update issue #2 with the triage result.
2. **Price provenance schema + UI** — structured `price_source`
   (retrieved date, vendor/url/part) so "price as of" is data, not a comment;
   migrate existing comment dates; show "as of" on entry pages and in the
   price cell tooltip; flag stale (>12 months) prices.
3. **Price gaps** — pixel-ICs/pixels not on LCSC (alt distributors: szlcsc,
   Mouser/Digi-Key, manufacturer, AliExpress street price clearly labelled),
   connectors (one representative orderable SKU with qty tiers), TC4427,
   APD-2-500, generic ESP boards as street-price ranges, the 8 unpriced
   adapters and 6 unpriced controllers.
4. **Discontinued / availability audit** — per vendor catalog, mark
   `discontinued` + `related: replacement` successor; record current price
   while on the page.
5. **Commercial systems** — find published price points for all 18, define
   the `$` scale (proposal: USD per pixel, log-spaced), check each
   `price_range` against it.
6. **Durability** — check-links covers prose-embedded URLs and markdown
   docs; workflow re-enabled + self-healing against the 60-day inactivity
   disable; monthly report gains a price-staleness section; refresh
   `currency.ts` rates.

## Findings / gotchas

- **The monthly link check stopped running.** `gh workflow list --all` shows
  `Monthly link check  disabled_inactivity` — GitHub disables scheduled
  workflows on public repos after 60 days with no commits (last commit
  before today: 2026-07-17). Last report 2026-10-03; no Nov 3 run.
  Re-enabling is a repo setting change: needs Cameron's yes.
- `check-links.ts` only collects strings that are _entirely_ a URL
  (`^https?://\S+$`); URLs inside `notes` prose (e.g. the SparkFun XT60 PDF
  in `connectors/xt60-90.yaml`) are never probed. Category
  `description.md` files aren't scanned either.
- Retrieval dates exist only as YAML comments, so nothing can render
  "price as of". Exact dates recoverable from commit messages: TI level
  converters 2026-07-01 (`a4ba15a`), 10 researched prices 2026-07-02
  (`cbc48d9`), LCSC batch 1 2026-07-07 (`6385282`), LCSC batch 2 swept
  2026-07-03 (`f40746b`).
- The sheet's Commercial tab has no `$` legend; existing ratings imply a
  qualitative market tier (Twinkly 250-string $105 = `$$`; SGM 7-ball
  string €125 = `$$$$$`).

## Progress log

- [x] Read build-out plan, ROADMAP, CLAUDE.md, issue #2, schemas; census.
- [ ] Link sweep 2026-11-18 + triage
- [ ] Issue #2 updated
- [ ] `price_source` schema + migration + UI
- [ ] Price gaps
- [ ] Discontinued audit
- [ ] Commercial systems price ranges
- [ ] Durability (checker coverage, workflow, staleness report, FX rates)

## Open questions for the user

1. Re-enable the **Monthly link check** workflow (`gh workflow enable
check-links.yml`), and add a step to the deploy workflow that re-enables
   it on each push so the 60-day inactivity rule can't silently stop it
   again? Recommendation: yes to both.

## Things not to do

- Don't put retrieval dates only in comments any more — use `price_source`.
- Don't treat 403/429/timeouts as dead: GitHub runner IPs get rate-limited
  by Shopify/Tindie/Digi-Key; confirm from a normal fetch before marking.
- Don't record AliExpress/eBay listing prices as if they were list prices;
  label them as street prices with the date.
