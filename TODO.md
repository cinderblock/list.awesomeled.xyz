# TODO

## In Progress

- [ ] Complete database review and possible refactor — every category's
      schema reviewed and typed, ~230 facts re-checked at makers' docs
      ([plans/database-review.md](plans/database-review.md)); open: the
      owner questions listed there

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

- [x] Standardize IC packages — `physical.packages`, named the way
      distributors list them (`SOP-8`, `SOT-23-5`; LEDs `5050`, `5mm`), checked
      by `common.json` `ic_package` / `led_package` (0bb3346)
- [x] Standardize Async / clocked — hardware outputs say
      `outputs.clocked`: `false`, `selectable` or `always` (`common.json`
      `clocked_support`), shown as Single-wire / Both / Clocked; pixels and
      pixel ICs say `data.clocked: true / false`
