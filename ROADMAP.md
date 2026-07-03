# Roadmap

Current work queue for the Awesome LED List. The original data/UX overhaul
(per-category pages, rich datatypes, cross-links, images, pills, the System
Designer) shipped to production 2026-07-02 — see OVERHAUL-PLAN.md for that
history. This is what's next.

## In flight

- **Designer v2** — shipped: card-grid pixel picker, diagram thumbnails,
  refresh-ceiling math (+ sub-30fps callouts), per-string lengths within a
  group (`n=150.200.80`), SVG re-import, and level-shifter advisories
  (driver.buffered=false + 5 V pixels → level-converter suggestions)
  - Later: DIY-microboard path — needs data first (usable GPIO/output counts
    on microboards) before they can appear as controller options

## Feature backlog

- Field-derived badges: keyOnly badges shipped (Standalone / FOSS fire only
  from structured fields, negation-aware; Differential added), and URLs are
  now stripped before the prose scan — vendor slugs can't badge products
  (they produced wrong badges: IP68 from a strip datasheet on a bare LED,
  Bluetooth from a different product's URL). Remaining: notes-prose badges
  still exist by design; migrate to fields opportunistically as data firms up
- Scheduled monthly `check-links` run in CI (report as an issue)
- Warranty / support-level column — blocked on a data pass (only ~5 entries
  record warranty today)

## Data backlog

- Price fill + freshness audit (proven extractors: TI structured data,
  Shopify products.json, WooCommerce JSON-LD)
- Commercial-systems free-text `online_pricing` → structured {amount, currency}
- More images: remaining pixels (Adafruit), XT60/Phoenix-class connectors
  (manufacturer sources); TC4427 price (Microchip blocks bots — manual)
- The 65-entry bot-blocked/timeout link list (human or per-site review)
- Vendor-catalog discontinued audits beyond link-driven evidence

## Decisions parked (owner: Cameron)

- R2 credentials → unblocks the datasheet mirror pipeline
- Pattern-driver subcategories: filterable `kind` field (sequencer / live-VJ /
  player / music-reactive / on-controller) vs. real category split
- Connector line art (outline/locking icons) — needs art direction
- Real-device tilt test (Android: immediate; iOS: tap the rainbow logo);
  tilt sensitivity is one constant in RainbowContext.tsx

## Housekeeping

- Move the master worktree out of `%TEMP%` (Windows cleanup keeps eating it;
  must be done from a session not anchored inside it)
- Decide the fate of the merged `rich-schema` branch
