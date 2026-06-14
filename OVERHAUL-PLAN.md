# Database Overhaul Plan

Status of the data/UX overhaul for the Awesome LED List, tracked against the
original goals. Schema = the nested JSON Schemas in `database/_schema/`; the
whole database validates with `bun run validate`.

## Goals & status

| # | Goal | Status |
| - | ---- | ------ |
| 1 | **Per-category single-entry pages** — pixel pages differ from software pages | ✅ Done. `app/routes/entry.tsx` renders a hero + one card per nested group, so each category's layout follows its own data shape. |
| 2 | **Advanced, consistent datatypes** for interoperability | ✅ Done. All 12 categories migrated to rich nested schemas; 485/485 validate. |
| 3 | **Cross-category links everywhere** | ◑ Schema supports it (`related_*`, `outputs.connector.ref`, `outputs.driver.IC`); detail pages render `related_*`. Data is sparsely populated (~16 entries). Remaining: research-driven population. |
| 4 | **Pictures + PDFs with attribution** | ◑ Strategy decided + pipeline built (see [Assets](#asset-strategy)). Remaining: add images, run the datasheet mirror once R2 secrets are set. |
| 5 | **New entries** | ◑ F16V5 added. Pending: HinksPix Pro V3, RJ45, SK6805, 74AHCT125 (verified, to author in the rich schema), plus ongoing additions. |
| 6 | **More pills/icons for known terms** (Ethernet, WiFi, 2.4GHz, Clocked, I2C, microSD, USB…) | ⚠️ `FeatureBadges` is a near-empty stub. Remaining: populate the vocabulary. |
| S1 | **Validate all data points** (+ keep human review tooling working) | ◑ `bun run validate` is wired and gates every change. Per-entry data verification remains; keep `scripts/agent-review.ts` / `review-entry.ts` working. |
| S2 | **PcPartPicker-style "design my system" wizard** | ◑ Repo already has `app/routes/system-overview.tsx` (a diagram). Remaining: part selection + compatibility checks (clocked/async, capacity, voltage, level-shifter), power estimate with warnings (~>20 W advisory, ~>200 W strong, tied to pixel count), URL-encoded selection, SVG/PNG export with embedded source. |

## Asset strategy

**Images — committed to the repo, no LFS.**

- Stored as plain optimized files under `public/database-images/<category>/<filename>`,
  served statically at `/database-images/<category>/<filename>`.
- Referenced by filename in an entry's `image` (string) or `images` (array) field.
- Processed/cropped with `scripts/crop-image.ts` (sharp: edge-flood background
  removal + trim). Keep files small (prefer PNG/WebP, ≤~200 KB).
- Record the original author/source of each image in the entry's `notes` or a
  vendor/creator link. Contributors add images via normal PRs.

**Datasheet PDFs — NOT in the repo. Original URL + a Cloudflare R2 mirror.**

- `datasheet.url` holds the original/manufacturer URL (attribution; never lost).
- CI mirrors the PDF to R2 and records `datasheet.mirror` (`url`, `sha256`,
  `retrieved`, `source`). See `docs/datasheet-mirroring.md`.
- Rationale: avoids git-LFS bandwidth quotas on a public repo while keeping the
  simple PR workflow for images; R2 (zero egress) is the natural fit on Cloudflare.

## Suggested order for remaining work

1. **Goal 6 — pills/icons** (fast, high-visibility; the badge registry is empty).
2. **Goal 5 — port the 4 verified new entries.**
3. **Goal 4 — assets**: wire the datasheet-mirror R2 secrets and run it; add images.
4. **Goal 3 — cross-links** (research workflow across the database).
5. **Stretch 2 — wizard** onto the existing `system-overview` diagram.
6. Merge `rich-schema` → `master` once the preview looks good.
