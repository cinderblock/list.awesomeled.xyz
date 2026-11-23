# Data freshness: prices, availability & link health

Workstream 6 of the website build-out (`plans/website-buildout.md`).
Branch `ws/data-freshness`, own worktree.

## Goal

Keeping the data current is the thing a stale spreadsheet can't do. Close
every ROADMAP "Data backlog" item about prices, availability and link rot,
then make freshness durable: the site should show how old a price is, and
the tooling should keep finding rot and staleness without someone remembering
to look.

## Status (2026-11-22, PST)

Everything below is on `master` except where marked. No owner decisions
are open. Datasheet and measured values are now recorded apart and shown
the same way everywhere; the commercial `$` rating is replaced by
experience tiers; the monthly workflow is running again; the NS/HD names
are split into IC and LED entries.

|                                                 | Start of day                  | Now                                       |
| ----------------------------------------------- | ----------------------------- | ----------------------------------------- |
| Prices with a retrieval date (`price_source`)   | 0 (40 as YAML comments)       | 287                                       |
| Priced entries with no date                     | 227                           | 39 (no real source found)                 |
| Connectors priced                               | 0 / 45                        | 34 / 45                                   |
| Pixel ICs / pixels priced                       | 12 / 10                       | 18 / 16                                   |
| Stale prices (> 12 months, still sold)          | —                             | 2 (archived captures)                     |
| Entries with status evidence (`sources.status`) | 0                             | 300 of 483                                |
| Link sweep (Node, local)                        | 12 dead · 69 check (415 URLs) | 0 dead · 106 check · 0 back (1,420 URLs)  |
| Monthly link check workflow                     | disabled (60-day inactivity)  | active; warns 28+ days into a quiet spell |

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
- **NS = the IC, HD = the LED** (Cameron, 2026-11-20: "be pedantic and
  correct. the Pixels are "HD..." and the Pixel ICs are "NS...". they
  should still be strongly linked"). Supersedes the 2026-11-18 merge with
  NS aliases. Each HD pixel declares `uses: pixel-ics/ns…`; the reverse
  link is derived. Controller protocol lists that say "NS107S" now resolve
  to the IC entry.
- **Commercial `$` → experience tiers** (Cameron, 2026-11-22: "sounds
  good"): `pricing.tier` = parts | plug-and-play | pro-kit |
  full-experience, by what the buyer gets and how it is sold, each cited
  in `sources["pricing.tier"]`. Prices are computed columns: From
  (cheapest price point, "Quote only" without one) and Per Pixel. No
  voting.
- **Datasheet vs measured** (Cameron, 2026-11-22: "we should have
  consistent visual presentation for datasheet spec vs user measured.
  both are valuable", then "sounds good. do it" to the proposal): a field
  holds the maker's spec, cited in `sources`; `measurements[path]` holds a
  list of `{value, conditions, by, date, url, notes}`. Entry pages show
  tagged Datasheet / Measured lines; table and compare cells keep the
  datasheet value and add a gauge mark that opens the same lines.

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
8. **Inactivity warning** — each monthly run looks up the latest commit and,
   28+ days into a quiet spell, says on issue #2 when GitHub will stop the
   schedule (runs are monthly, so it always warns before day 60).
9. **NS107S/NS108 merged into HD107S/HD108** (`ec19baf`): Newstar developed
   the ICs and sells each LED under both names. Aliases keep controller
   protocol lists resolving; NS8808 got alias HD8808. Sheet parity pairs the
   NS rows with the HD entries (aliases.ts, 12 acks; 0 unexplained cells);
   removed-entry map in `plans/database-review.md`.
10. **NS/HD split into IC + LED** (Cameron's follow-up): new
    `pixel-ics/ns107s`, `ns108`, `ns8808` (Newstar's own specs and pages);
    `pixels/hd107s`, `hd108` lose the NS aliases and gain `uses` links;
    `pixels/ns8808` renamed `pixels/hd8808` (image too), with channel
    current 17.5 mA and 200 mW from Newstar's page (the sheet's 9 mA /
    45 mW had no source). Not split: NS108E, since Newstar's catalog gives
    it no HD name.
11. **Experience tiers** replace the `$` rating on commercial systems:
    schema `pricing.tier`, a Tier column (sorts parts → full experience,
    definitions in the header tip) and a From column; entry pages show
    the label. All 18 systems researched 2026-11-22: 2 parts, 1 plug and
    play, 7 pro kit, 8 full experience. Changed from first guesses: Astera
    Nyx, LB-100 and LightWalls are pro kits (list prices, standard DMX /
    Art-Net); SMART PXL is full experience (made to order, quoted by a
    sales engineer). Thin evidence: LightWalls (protocol unconfirmed),
    FestoonLight Q4 (dealer page only). Sheet parity drops the Price
    Range column.
12. **Datasheet vs measured values**: `measurements` in
    `common.json`, on every category; `validate` checks each key names a
    field and each value fits the field's schema (the entry, with the
    measured value swapped in, must validate). One component
    (`app/components/data/Measured.tsx`) draws both tags on entry pages,
    table cells and the compare page. Migrated, with the datasheets
    re-read: GS8208 current (datasheet 15 mA typical, measured 10 mA
    across 3 LEDs at 12 V, from a comment on the sheet's cell, measurer
    unknown); SK6812 PWM (datasheet 1.2 kHz, cpldcpu measured 1.1 kHz);
    SK9822 PWM (datasheet 1.2 kHz, cpldcpu measured 4.7 kHz with a
    photodiode). CONTRIBUTING.md has an "add a measurement" example.

## Findings / gotchas

- **Two of the four "measured" cases weren't measurements.** WS2812's
  "measured 19-22 mA" and the "datasheet claims 49 mA" behind it: the
  Adafruit WS2812 datasheet gives 18.5 mA typical (IOL, ROUT) and 20 mA per
  color in its LED table, and no 49 mA in its text (its two images
  weren't read). No measurement was found,
  so nothing moved; the 49 mA text in `ws2812` / `apa104` notes is
  unverified. APA107's note cites the SK9822 measurement, which is now
  structured on `sk9822`.
- **GS8208's datasheet disagrees with itself**: page 1 says "Default
  17.5mA constant current output"; the electrical table (page 4) gives
  15 mA typical at VDH=12V. The field takes the table's 15 mA; the
  discrepancy is recorded under `datasheet.discrepancies`.

- **The monthly link check stopped running, then restarted itself.**
  `gh workflow list --all` showed `disabled_inactivity` at 3:34 PM PST
  (23:34Z): GitHub disables scheduled workflows on public repos after 60
  days with no commits (last commit 2026-07-17; runs Aug 3, Sep 3, Oct 3;
  none Nov 3). The bot's own issue #2 updates in Aug–Oct didn't count as
  activity. The push at 4:15 PM PST (00:15Z) that edited `check-links.yml`
  re-enabled it (workflow `updated_at` 00:15:45Z, state `active`), so no
  manual re-enable was needed.
- **Why NS and HD names exist:** NS = Newstar's IC part number. Newstar:
  "HD107s pixel RGB led used Newstar's IC, so we named 'HD107S', Newstar's
  model number is Ns107s" (ledstrip-newstar.com); Hida: "HD107S, produced by
  Hida, used Newstar's 107S IC" (hd107s-led.com); Rose Lighting's HD107S
  spec is a reworded copy of Newstar's NS107S spec (same tables; 40 MHz vs
  30 MHz). The market (AliExpress, Advatek, controller lists) uses HD.
- **Wayback rate-limits scripted downloads** ("flagged as suspected abusive
  bot traffic") after a few PDFs; retry after a pause. WebFetch can't reach
  web.archive.org at all.
- `bun run sheet-parity` hits the same Bun TLS failure on Windows; download
  the xlsx and tab CSVs with curl and pass `--xlsx` / `--csv-dir`.
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
- [x] Issue #2: body refreshed with the 2026-11-18 sweep + summary comment
      (<https://github.com/cinderblock/list.awesomeled.xyz/issues/2#issuecomment-6998997065>).
- [x] Monthly workflow: restarted by the 4:15 PM push; inactivity warning
      added (`1d8b88b`).
- [x] NS/HD pairs merged (`ec19baf`), then split into IC + LED entries.
- [x] Commercial experience tiers shipped.
- [x] Datasheet vs measured values shipped.

## Open questions for the user

None.

## Things not to do

- Don't put retrieval dates in YAML comments — use `price_source`.
- Don't treat 403/429/timeouts as dead; confirm from a browser-like fetch.
- Don't record marketplace listing prices as list prices.
- Don't take "ours" wholesale when resolving conflicts with other streams
  (see gotchas); audit dropped `related`/`sources` after every slice.
- Don't add a new currency without a rate in `currency.ts` (validate now
  enforces it).
