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

1. ~~**Price provenance schema + UI**~~ — shipped (`f7b9b7d`, `d5f86cd`):
   `price_source` (retrieved/vendor/part/url/notes), `{amount, max}` street
   ranges, entry-page "as of" line, stale (>12 mo) flag + table clock mark,
   Price column on pixels/pixel-ICs/connectors, 4-decimal sub-dollar prices.
2. **Research pass** ← current. Per-category agents, each doing link triage
   (from the 2026-11-18 Node sweep), availability/status, and price
   (re-confirm or fill) for every entry in its slice, following "Research
   conventions" below. Briefs and findings live in the scratchpad
   (`brief-*.md`, `findings/*.md`).
   - [x] Pilot: pixel-decoders + level-converters — pushed (`1d45f70`).
   - [ ] Running: connectors; commercial systems + diffusive links;
         software (pattern drivers + drive libraries); controllers
         0-9/a–e, f–k, l–o, p, q–z; adapters; microboards; pixel ICs; pixels.
3. **Integrate each slice** (main worktree is on an old base while agents
   edit it, so integration happens in a staging worktree
   `scratchpad/push-wt` on `origin/master`):
   - classify changed files (`classify.mjs`): verified price/status →
     review commit; link-only → separate commit listed in
     `ignore-subjects.txt`;
   - commit in the main worktree, cherry-pick into push-wt, resolve
     conflicts with the other streams' restructures (take theirs for
     structure, ours for price/status/links);
   - convert `# src: url | date | note` status comments into
     `sources.status` / `related[].source` (`src2sources.mjs`);
   - `push.sh`: rebase, re-point `IGNORED_COMMITS` at final hashes, strict
     checks, fast-forward push, retry on rejection.
4. **Commercial systems** — published price points for all 18; define the
   `$` scale (proposal: USD per pixel, log-spaced); check each
   `price_range`.
5. **Issue #2** — post the triage result.
6. **Durability** — done: prose URLs + docs probed, per-host pacing,
   dead_links re-probed (BACK), price-staleness section, FX rates
   refreshed, discontinued prices never "stale". Pending: workflow
   re-enabled + self-healing (needs Cameron's yes).

## Research conventions

- **Dates**: `retrieved` / `checked` = the day you actually read the page.
- **Sources, in order of preference**: the creator's own store/product page;
  authorized distributors (LCSC, szlcsc.com, Mouser, Digi-Key, Farnell,
  TME, RS, Arrow); well-known retailers (Adafruit, SparkFun, Pimoroni,
  Tindie seller page). Marketplaces (AliExpress, Amazon, eBay) only for
  generic/no-name parts, as a street range `{amount, max}` from at least 3
  listings, `vendor: AliExpress (street)`.
- **Never estimate.** No source found → leave the price as is and report it.
- **Price shape**: original currency (`{amount, currency}` for non-USD);
  ex-VAT when shown, else say "incl. VAT" in `price_source.notes`. Say what
  the price buys when it isn't obvious (board-only vs kit, per piece vs
  pair). Parts: 3 representative tiers `[{qty, price, sku}]` (MOQ / ~1k /
  largest), like the LCSC entries.
- **Re-confirmed, unchanged price** → still update `price_source.retrieved`
  (that is the "as of").
- **Status**: `discontinued` only with evidence (vendor says so, product
  gone from the creator's catalog and not sold elsewhere by them, or a
  manufacturer PCN/EOL notice). Out of stock ≠ discontinued. `end-of-life`
  = EOL announced, remaining stock still sold. `active` = currently listed
  for sale by the creator or an authorized seller. Unsure → leave it and
  report.
- **Successor**: on the discontinued entry only, `related: - type:
replacement` with `ref: <category>/<slug>` if it's in the database, else
  `name` + `url`.
- **Links**: product moved → replace the URL in place. Gone → `dead_links`
  entry (`url`, `checked`, curated `archive` = a Wayback capture that shows
  the right product). Blocked to scripts but fine in a browser-like fetch →
  leave it, report "ok (blocked)".
- **Scope**: only price, `price_source`, `status`, `related` replacement,
  link fields, `dead_links`. Other wrong facts spotted → report, don't edit
  (other workstreams own them).
- **Fetching**: WebFetch; `curl -A "Mozilla/5.0 …"`; `node -e` fetch (never
  Bun's fetch — Bun 1.4.4 on Windows fails TLS to GitHub and others);
  Shopify stores: `<product-url>.json` gives variants, prices,
  availability; Wayback: `https://archive.org/wayback/available?url=` and
  the CDX API. Headless Playwright via Node for JS-only storefronts. Never
  the Chrome extension (it drives Cameron's real browser).
- **Regular price, not sale price**; sale goes in `price_source.notes`.
- **Archived last list prices**: `retrieved` = capture date, `url` = capture.
- **Redirect to a generic brand page** without the product = dead.
- Missing product links may be added.
- **Status evidence**: `status: X # src: <url> | <date> | <note>` (and the
  same on `- type: replacement` items) until the slice is integrated, where
  it becomes `sources.status` / `related[].source` (stream 2's per-field
  provenance, on master since 2026-11-18).
- **Format**: key order `name, status, release_year, creator, developer,
manufacturers, vendors, notes, inputs, outputs, power`, then
  alphabetical; finish with `bunx eslint --fix database/<cat>`,
  `bunx prettier --write database/<cat>`, `bun run validate <cat>`.

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
- **Bun 1.4.4 on Windows can't run the link checker**: its fetch fails the
  TLS handshake to github.com and many others (`EPROTO: The TLS handshake
failed`, 213 false CHECKs). `node scripts/check-links.ts` works (Node 26
  strips the types). CI runs on Linux, unaffected.
- Node sweep 2026-11-18: **ok 390 | dead 12 | check 69** (scratchpad log
  `check-links-node-2026-11-18.log`). New dead since October: ACROBOTIC
  ESP level shifter (Amazon 404), ESPixel Pops wiki, Orange Pro Plus 32
  (winterlights.in), PB16 DIYC thread, GeoPix (geopix.io NXDOMAIN).
- `IGNORED_COMMITS` hashes go stale when a rebase rewrites the commit: add
  the entry only after the final rebase before pushing, or re-point it.
- **Pre-push checks must not be piped through `tail`** — the pipe hides the
  exit code, and one push went out while typecheck printed an error. Use the
  scratchpad `checks.sh` (`set -euo pipefail`). That error turned out to be
  a stale nested `node_modules/ajv-formats/node_modules/ajv` (8.17.1) left
  by an older lockfile; `bun install --frozen-lockfile` doesn't remove it,
  a clean reinstall does. Master was fine.
- Monthly CI had a wall of Tindie/Shopify 429s; per-host pacing removed them
  (2nd local sweep: 0 × 429).
- Pilot (21 entries): TI list prices up 15-50% since July; TC4427 priced
  from microchipDIRECT (only headless Chrome-channel Playwright gets past
  Microchip's bot wall); Pixel2Things boards discontinued (2022).
- The Bash tool strips backslashes inside heredocs — write scripts with
  the Write tool (bit me once: an escaped `\n` became a real newline in TS).
- Other streams restructured pixel-decoder `outputs` and restored 117 sheet
  hyperlinks while the pilot ran: cherry-picks conflict, resolve by taking
  master's structure plus our price/status/links.
- Pixels, pixel ICs and connectors had no Price column in their tables.
- `formatPriceText` rounded $0.0446 to $0.045 (entry) / $0.04 (table).
- The sheet's Commercial tab has no `$` legend; existing ratings imply a
  qualitative market tier (Twinkly 250-string $105 = `$$`; SGM 7-ball
  string €125 = `$$$$$`).

## Progress log

- [x] Read build-out plan, ROADMAP, CLAUDE.md, issue #2, schemas; census.
- [x] Prettier `endOfLine: auto` + `.gitattributes` (`df13595`) — format:check
      failed on every CRLF file on Windows.
- [x] Link sweep 2026-11-18 (Node): 12 dead, 69 check.
- [x] `price_source` schema + migration + UI, pushed (`f7b9b7d`..`2d7e815`).
- [ ] Link triage (in the research pass)
- [ ] Issue #2 updated
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
