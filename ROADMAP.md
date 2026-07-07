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
- Warranty / support-level column — blocked on a data pass (only ~5 entries
  record warranty today)

## Data backlog

- Suspect entries found during audits (sp801e-style identity checks):
  - `controllers/led-player-m` and `led-player-l` claim `Ethernet: true` —
    the Diamex LED Player family is SD/USB/DMX; likely the same sheet-era
    fabrication the LEDEddy entry had (manual PDF is image-only, needs a look)
- Price gaps that need different treatment: pixels / pixel-ICs / connectors
  (qty-tier pricing like the TI level converters), TC4427 (Microchip blocks
  bots — manual), APD-2-500 (JS-only storefront), generic ESP/NodeMCU boards
  (street price varies)
- Commercial-systems `price_range` → verify against pricing.examples
- More images: remaining pixels (Adafruit), XT60/Phoenix-class connectors
  (manufacturer sources)
- The bot-blocked/timeout CHECK list (59 urls, tracked in the rolling
  link-rot issue #2; EMP 16 and SceneX PP4 product pages now 404)
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
