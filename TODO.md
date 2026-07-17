# TODO

## In Progress

- [ ] Complete database review and possible refactor

## Done

- [x] Add apple-touch-icon — plus full site icon set (favicon links,
      PWA icons 192/512, web manifest, theme-color). Regenerate with
      `bun scripts/gen-icons.ts`.
- [x] Sort logically (take units into account) — `quantitySortValue`
      parses SI units (Hz/A/W/V/B) to a base number per column `sortValue`
- [x] Right align numbers — `data-table-cell--right` + decimal alignment
      (invisible `.0`/`.00`) so ones/decimal points line up
- [x] Add icons for most common protocols/features/options — Protocols /
      Platforms table columns now use the icon `Badge` system (Art-Net,
      Wi-Fi, WLED, Linux, …) instead of plain outline pills

## Pending

- [ ] Standardize IC packages
- [ ] Standardize Async / clocked
