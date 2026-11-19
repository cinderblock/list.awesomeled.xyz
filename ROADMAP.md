# Roadmap

Current work queue for the Awesome LED List. The original data/UX overhaul
(per-category pages, rich datatypes, cross-links, images, pills, the System
Designer) shipped to production 2026-07-02 — see OVERHAUL-PLAN.md for that
history. This is what's next.

## In flight

- **System Designer** — rebuilt and shipped 2026-11-18 (plan, link format
  and decisions: [plans/designer.md](plans/designer.md)). A parts-picker flow
  (pixels or a bare driver IC → strings → controller, dev board or adapter
  with its host board → level shifter, connector, pattern software) with
  compatibility checks at every step, a power plan (supplies, injection
  points, fuses, wire gauge, the ~20 W / ~200 W warnings), a priced parts
  list with CSV / Markdown / text export, a diagram that downloads as SVG or
  PNG with the design inside it, the whole design in the page's link, and a
  "Use in the designer" link on every part page it has a slot for.
  What's next for it:
  - **Choose the host board** under an adapter: the parts list names the
    first board still on sale and lists the others it fits; a picker would
    let the builder choose
  - **Power supplies, fuses and wire as database entries**: today they are
    sized by the power plan but not priced, because the database has no such
    categories
  - More adapters appear by themselves as they gain output counts and `host`
    links to /microboards (14 of 40 are offered today), and more checks
    sharpen as the facts in ISSUES.md ("Designer facts that depend on
    unrecorded data") are filled in

## Feature backlog

- Field-derived badges: keyOnly badges shipped (Standalone / FOSS fire only
  from structured fields, negation-aware; Differential added), and URLs are
  now stripped before the prose scan — vendor slugs can't badge products
  (they produced wrong badges: IP68 from a strip datasheet on a bare LED,
  Bluetooth from a different product's URL). Remaining: notes-prose badges
  still exist by design; migrate to fields opportunistically as data firms up
- Warranty / support-level column — blocked on a data pass (only ~5 entries
  record warranty today)

## Data backlog

- Prices still missing after the 2026-11-18 freshness pass (every one was
  searched; reasons in `plans/data-freshness/findings/`): 11 connector
  families (Binder 720, Chogori, EventCon, Hirschmann CA, LD16/20/28,
  Socapex, SP13/SP17, TeePlug, WAGO 221, Wieland RST — distributors block
  scripts), 23 pixel ICs and 20 pixels (no distributor stocks them; lot-only
  AliExpress listings), quote-only commercial systems (Lumisphere, Glasson,
  TMB, LEDSnaps, ENTTEC SMART PXL, Schnick-Schnack). `node
scripts/check-links.ts --prices` lists undated/stale prices
- Commercial-systems `$` scale: undefined in the sheet and doesn't track
  price per pixel — owner call (see `plans/data-freshness.md`); the Per
  Pixel column gives the objective comparison meanwhile
- Remaining images (2026-11-18 pass covered 73% of hardware entries; every
  skip has a reason in `plans/assets-research/`): molex.com /
  phoenixcontact.com block bots (XH, PicoBlade, Mini-Fit Jr, KK, MSTB),
  pixel ICs rarely have real chip photos, discontinued boards whose images
  were never archived. `bun run coverage:assets --missing` lists them
- The CHECK list in the rolling link-rot issue #2 (mostly distributor bot
  walls: Digi-Key, Mouser, Farnell, RS, eBay) needs a human with a browser;
  the monthly workflow is disabled by GitHub's 60-day inactivity rule until
  re-enabled

## Decisions parked (owner: Cameron)

- Re-enable the monthly link-check workflow (GitHub disabled it for
  inactivity) and add a self-heal step to the deploy workflow
- Commercial systems' `$`…`$$$$$$` scale: per-pixel bands or a documented
  qualitative tier (`plans/data-freshness.md`, open question 2)
- R2 bucket + public domain + account-owned token → switches on the
  datasheet mirror (pipeline, tests and docs are ready:
  `docs/datasheet-mirroring.md` "One-time setup"; plan: `plans/assets.md`)
- Pattern-driver subcategories: filterable `kind` field (sequencer / live-VJ /
  player / music-reactive / on-controller) vs. real category split
- Connector line art (outline/locking icons) — needs art direction
- Real-device tilt test (Android: immediate; iOS: tap the rainbow logo);
  tilt sensitivity is one constant in RainbowContext.tsx

## Housekeeping

- Move the master worktree out of `%TEMP%` (Windows cleanup keeps eating it;
  must be done from a session not anchored inside it)
- Decide the fate of the merged `rich-schema` branch
