# Roadmap

Current work queue for the Awesome LED List. The original data/UX overhaul
(per-category pages, rich datatypes, cross-links, images, pills, the System
Designer) shipped to production 2026-07-02 — see OVERHAUL-PLAN.md for that
history. This is what's next.

## In flight

- **Designer v2**
  - Part thumbnails: card-grid pixel picker, images in the diagram
  - Frame-rate math: bitrate ÷ (pixels-per-string × bits/pixel) → achievable
    fps per group, with can't-hit-30fps callouts
  - Later: level-shifter / DIY-microboard path, per-string lengths within a
    group, SVG re-import (design JSON is already embedded in downloads)

## Feature backlog

- `outputs.connector.ref`: render as links (controllers ↔ connectors) and
  populate — the last cross-link mechanism with no UI
- Field-derived badges (from schema fields instead of text scanning)
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
