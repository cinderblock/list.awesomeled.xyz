# Contributing to Awesome LED List

Thank you for your interest in contributing! This guide covers how to add new entries to the database, modify the UI, and add images.

**Not here to write code?** <https://list.awesomeled.xyz/contribute> has the short version: forms to report a wrong value or a missing product, an edit link on every entry page, and a field reference for every category.

## Table of Contents

- [Quick Start](#quick-start)
- [Adding New Entries](#adding-new-entries)
- [YAML Schema Reference](#yaml-schema-reference)
- [Modifying the UI](#modifying-the-ui)
- [Adding Images](#adding-images)
- [Development Workflow](#development-workflow)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/list.awesomeled.xyz.git
cd list.awesomeled.xyz

# Install dependencies
bun install

# Start development server
bun run dev

# Run tests (unit, then end-to-end in headless Chromium)
bun run test:unit
bun run test:e2e
```

---

## Adding New Entries

### Database Structure

The database lives in the `database/` directory with 12 categories:

| Directory              | Category               |
| ---------------------- | ---------------------- |
| `controllers/`         | LED Controllers        |
| `pixels/`              | LED Pixels             |
| `pixel-ics/`           | Pixel Driver ICs       |
| `pattern-drivers/`     | Pattern Drivers        |
| `connectors/`          | Connectors             |
| `microboards/`         | Microcontroller Boards |
| `level-converters/`    | Level Converters       |
| `adapters/`            | Adapters               |
| `drive-libraries/`     | Software Libraries     |
| `pixel-decoders/`      | Pixel Decoders         |
| `diffusive-materials/` | Diffusive Materials    |
| `commercial-systems/`  | Commercial Systems     |

### Creating a New Entry

1. **Choose the correct category** for your entry

2. **Create a YAML file** in the appropriate directory:

   ```
   database/controllers/my-new-controller.yaml
   ```

3. **Name the file for the entry** (lowercase, hyphens only); the file name
   is the entry's id and its URL:
   - Good: `wled-controller-v3.yaml`
   - Bad: `WLED Controller v3.yaml`

4. **Start from the category's example.** Every category has a
   `database/<category>/_example.yaml` with every field filled in and a
   comment on each; `bun run validate` checks the examples against the schema
   too, so they are always current. Only `name` is required:

   ```yaml
   name: My New Controller
   status: active
   ```

5. **Fill in what you can verify** and say where it came from (see
   [Sources](#sources)). Leave a field out rather than guess.

### Example Entry (Controller)

```yaml
name: ESP32 LED Controller
status: active
release_year: 2024
creator:
  name: Example Corp
  url: https://example.com
  page: https://example.com/esp32-led-controller
vendors:
  - name: Example Corp
    page: https://example.com/shop/esp32-led-controller
notes: Budget controller for medium-sized installations
inputs:
  physical:
    Wi-Fi:
      - 2.4GHz
    Ethernet: 1
  protocols:
    - Art-Net
    - sACN
    - DDP
outputs:
  count: 8
  clocked: selectable
  pixels:
    max_per_output: 1024
    max_total: 4096
power:
  voltage:
    min: 5
    max: 24
price: 25
price_source:
  retrieved: '2026-11-18'
  vendor: Example Corp
  url: https://example.com/shop/esp32-led-controller
wled_compatible: true
```

---

## YAML Schema Reference

Each category's fields, with descriptions, are in its JSON schema
(`database/_schema/<category>.json`, shared definitions in `common.json`) and
shown in use in its `_example.yaml`. This section covers what applies across
categories.

### Common Fields

| Field                   | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| `name`                  | Display name, as the maker writes it (**required**)                         |
| `status`                | `active`, `discontinued`, `end-of-life`, `limited` or `unknown`             |
| `release_year`          | Year it first went on sale                                                  |
| `creator`               | Who designed it (see below)                                                 |
| `manufacturers`         | Who builds it, when that differs from the creator                           |
| `vendors`               | Who sells it                                                                |
| `notes`                 | One or two sentences: what it is and what sets it apart                     |
| `aliases`               | Other names it is sold or listed under (search and links use them)          |
| `images`                | `{file, source, credit, license?}`; see [Adding Images](#adding-images)     |
| `datasheet`             | `{url, sources?}`; see [Datasheets](#datasheets)                            |
| `price`, `price_source` | See [Prices](#prices)                                                       |
| `related`               | Links to other entries; see [Links between entries](#links-between-entries) |
| `other_links`           | Further pages: guides, protocol notes, forum threads                        |
| `technical_notes`       | Longer facts, one per item                                                  |
| `sources`               | Where facts were verified; see [Sources](#sources)                          |
| `measurements`          | Values measured on real parts; see [Measurements](#measurements)            |
| `dead_links`            | Links that stopped working, with an archive copy when there is one          |

### Who made it: creator, manufacturers, vendors

- `creator` is who designed it: a company, a person or a project. A bare name
  (`creator: WorldSemi`) or `{name, url, page}`, where `url` is their site and
  `page` is this product's page there.
- `manufacturers` lists who builds it, only when that differs from the
  creator (a clone maker, a contract manufacturer).
- `vendors` lists who sells it: bare names or `{name, url, page, warranty}`,
  `page` being the listing.

### Values

- **Quantities carry their unit**, without trailing zeros: `5V`, `20mA`,
  `800kHz`, `1.5kHz`, `300mW`, `2.54mm`; `~` marks an approximate figure
  (`~5mA`). Exception: controllers' and adapters' `power.voltage`,
  `power.current` and `outputs.current` are bare numbers in volts and amps.
  `app/lib/quantity.ts` reads both forms.
- **Ranges** are `{min, max}`; a fixed value has both equal. A part sold in
  several versions records the family's range and says which version does
  what in a comment or a `_notes` field.
- **Vocabularies are closed.** Enumerated fields (protocols, interfaces,
  packages, color types, statuses) take only the schema's spellings; add a
  value to the schema (or `common.json`) when something new appears rather
  than writing a near-synonym.
- **One value or a list.** Where a part can be either (`channel_bits: 8`, or
  `[8, 16]` when selectable), a single value is written bare, never as a
  one-item list.
- **`<field>_notes`** carries what the structured value can't
  (`channel_bits: 8` with `channel_bits_notes: 12-bit gamma correction per
colour`). Keep facts in the field and context in the note.
- **Directions** on pattern drivers' protocols and I/O are `Input`, `Output`,
  `Both` or `false` (checked and unsupported); leave the field out when
  unknown.
- **Absent means unknown.** Write `false` only when a source says it has no
  such thing.

### Prices

Every price you add or re-check should say where and when it was read, so the
site can show "as of" and flag prices older than a year:

```yaml
price: 24.95 # or {amount: 150, currency: EUR}, or quantity tiers
price_source:
  retrieved: '2026-11-18' # YYYY-MM-DD; update it when you re-confirm the price
  vendor: Adafruit # distributor, manufacturer store, or marketplace
  part: '1234' # vendor part number, when it pins the exact SKU (e.g. LCSC C155753)
  url: https://www.adafruit.com/product/1234
```

Generic parts sold by many sellers at varying prices take a street-price
range: `price: {amount: 3, max: 8}` with the marketplace as `vendor`.
Commercial-system `pricing.examples[]` and pattern-driver `pricing` take the
same object as `source`.

### Links between entries

Declare a link once, on the entry that uses the other one. The other
direction ("Driven by", "Runs on", "Host for") is derived and shown on the
other entry's page.

**Name lists** keep the names the maker publishes. A name becomes a link when
some entry answers to it through its `name`, `aliases` or `variants[].name`
(matching ignores case, spaces and punctuation, so `APA-102` finds `APA102`):

| Field                                        | Names                             |
| -------------------------------------------- | --------------------------------- |
| controllers `outputs.protocols`              | pixel ICs and pixels it can drive |
| drive libraries `supported_ics`              | pixel ICs and pixels it supports  |
| pixel decoders `inputs.protocols`            | pixel protocols it decodes        |
| controllers / adapters `software.firmware`   | firmware it runs                  |
| controllers / adapters `software.works_with` | software that can drive it        |
| controllers `inputs.requires_host`           | the dev board it plugs into       |
| controllers `outputs.driver.IC`              | the level-shifter / buffer IC     |

A name nothing answers to stays plain text, and `bun run validate` lists it:
that's a part the database is missing. When a maker spells a part
differently, add the spelling to that part's `aliases` (with a source) rather
than rewriting the maker's list.

**`related`** links to one specific entry by `<category>/<id>`:

```yaml
related:
  - type: host # also: uses, compatible, variant, predecessor, replacement, accessory, related
    ref: microboards/pocketbeagle
    notes: Cape for the PocketBeagle
    source:
      url: https://example.com/product-page
      retrieved: '2026-11-18'
```

`outputs.connector.ref` names a connector entry by its id. Pixels and pixel
ICs that speak the same protocol share a `data.type` family (`WS2811/12`,
`APA102`, `TM1814`, …): hardware that drives one part of a family can drive
the rest, which is what the tables' "Pixel ICs" filter relies on, so set it
from the datasheet.

### Sources

Say where a fact was verified under `sources`, keyed by the field's dotted
path (one source or a list):

```yaml
sources:
  data.type:
    url: https://example.com/datasheet.pdf
    retrieved: '2026-11-18'
    notes: "'Compatible with the WS2811 protocol'" # optional: what it says
```

Entry pages show the source under the field. `bun run validate` checks that
every key names a field the entry has.

### Measurements

A field holds the maker's spec, from the datasheet. When you have measured a
real part and got something else, add it under `measurements`, keyed by the
field's dotted path like `sources`, and leave the field as the datasheet
says. Both are worth having: the datasheet is what the maker promises, the
measurement is what a part did on a bench.

```yaml
measurements:
  electrical.channel_current:
    - value: 10mA # written exactly like the field
      conditions: 3 LEDs in series at 12V # how: supply, load, sample, instrument
      by: your name or handle
      date: '2026-11-22'
      url: https://example.com/write-up # write-up, scope capture or video
      notes: Five parts from one reel # optional
```

Only `value` is required, but a measurement nobody can check is worth
little: give the conditions and a link whenever you can. Entry pages show
the pair, tagged Datasheet and Measured; tables and the compare page keep
the datasheet value and add a gauge mark that opens the measurements.
`bun run validate` checks that every key names a field the entry has and
that each value fits that field (a current is a current).

### Category fields

| Category            | Schema                                                              | Example                                                      |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Controllers         | [controller.json](database/_schema/controller.json)                 | [\_example.yaml](database/controllers/_example.yaml)         |
| Pixels              | [pixel.json](database/_schema/pixel.json)                           | [\_example.yaml](database/pixels/_example.yaml)              |
| Pixel ICs           | [pixel-ic.json](database/_schema/pixel-ic.json)                     | [\_example.yaml](database/pixel-ics/_example.yaml)           |
| Pattern Drivers     | [pattern-driver.json](database/_schema/pattern-driver.json)         | [\_example.yaml](database/pattern-drivers/_example.yaml)     |
| Connectors          | [connector.json](database/_schema/connector.json)                   | [\_example.yaml](database/connectors/_example.yaml)          |
| Microboards         | [microboard.json](database/_schema/microboard.json)                 | [\_example.yaml](database/microboards/_example.yaml)         |
| Level Converters    | [level-converter.json](database/_schema/level-converter.json)       | [\_example.yaml](database/level-converters/_example.yaml)    |
| Adapters            | [adapter.json](database/_schema/adapter.json)                       | [\_example.yaml](database/adapters/_example.yaml)            |
| Drive Libraries     | [drive-library.json](database/_schema/drive-library.json)           | [\_example.yaml](database/drive-libraries/_example.yaml)     |
| Pixel Decoders      | [pixel-decoder.json](database/_schema/pixel-decoder.json)           | [\_example.yaml](database/pixel-decoders/_example.yaml)      |
| Diffusive Materials | [diffusive-material.json](database/_schema/diffusive-material.json) | [\_example.yaml](database/diffusive-materials/_example.yaml) |
| Commercial Systems  | [commercial-system.json](database/_schema/commercial-system.json)   | [\_example.yaml](database/commercial-systems/_example.yaml)  |

The same fields are listed for reading at
<https://list.awesomeled.xyz/contribute>: each category's fields, what they
hold, how many entries fill them in and the values in use. That page is
generated from the schemas and the data, so it cannot drift from what the
validator accepts. Its **Start a new entry** button opens GitHub's editor in
the right directory with a starter file.

Changing a schema means migrating the entries with it; see
[database/\_schema/README.md](database/_schema/README.md).

---

## Modifying the UI

### Project Structure

```
app/
├── components/
│   ├── layout/           # Header, Footer, CategoryNav, Layout
│   ├── data/             # DataTable
│   └── ui/               # RainbowText, ThemeToggle
├── context/
│   └── RainbowContext.tsx   # Rainbow animation state
├── hooks/
│   └── useTheme.ts          # Theme management
├── lib/
│   ├── data.ts              # YAML loading functions
│   ├── types.ts             # TypeScript types & categories
│   └── columns.tsx          # Column configurations
├── routes/
│   ├── home.tsx             # Category grid
│   ├── category.tsx         # Category table view
│   ├── entry.tsx            # Entry detail page
│   └── about.tsx            # About page
├── app.css                  # All styles (vanilla CSS)
└── root.tsx                 # App wrapper
```

### Styling

All styles are in `app/app.css` using vanilla CSS with CSS custom properties.

#### Theme Colors

```css
/* Light mode (default) */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  /* ... */
}

/* Dark mode */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}
```

#### Category Colors (12 hues, 30° apart)

| Category            | Hue            |
| ------------------- | -------------- |
| Controllers         | 0° (red)       |
| Pixels              | 30° (orange)   |
| Pixel ICs           | 55° (gold)     |
| Pattern Drivers     | 85° (lime)     |
| Connectors          | 145° (green)   |
| Microboards         | 175° (teal)    |
| Level Converters    | 200° (cyan)    |
| Adapters            | 230° (blue)    |
| Drive Libraries     | 265° (indigo)  |
| Pixel Decoders      | 295° (purple)  |
| Diffusive Materials | 325° (magenta) |
| Commercial Systems  | 350° (rose)    |

#### Common CSS Classes

```css
/* Buttons */
.btn              /* Base button */
.btn-primary      /* Primary action */
.btn-ghost        /* Minimal style */
.btn-outline      /* Bordered */
.btn-sm           /* Small size */

/* Badges */
.badge            /* Base badge */
.badge-success    /* Green */
.badge-secondary  /* Gray */
.badge-outline    /* Bordered */

/* Layout */
.container        /* Max-width wrapper */
.flex             /* Flexbox */
.grid             /* Grid layout */
```

### Adding a New Column

Every field in a category's schema is already a column: the field catalog
(`app/lib/fields.ts`) reads the schema, and the table's column picker offers
every field. To make one a default column, or to give it custom rendering,
sorting or filtering, add it to the category's list in `app/lib/columns.tsx`:

```typescript
export const controllerColumns: Column[] = [
  // ... existing columns
  {
    key: 'outputs.count', // dotted path into the entry
    label: 'Outputs',
    filterConfig: { type: 'numeric' },
  },
];
```

Enumerated values show through `valueLabels` (raw value to label), which the
filters and copied text use too, so they match the cells.

### Adding a New Component

1. Create the component in the appropriate directory:

   ```typescript
   // app/components/ui/MyComponent.tsx
   export function MyComponent({ children }: { children: React.ReactNode }) {
     return <div className="my-component">{children}</div>;
   }
   ```

2. Add styles to `app/app.css`:

   ```css
   .my-component {
     padding: var(--space-4);
     border-radius: var(--radius-md);
     background: var(--background);
   }
   ```

3. Import and use in your route or layout

---

## Adding Images

Every hardware entry should show what the product looks like. Images are
optimized WebP files committed under `public/database-images/<category>/`,
referenced from the entry with their attribution:

```yaml
images:
  - file: falcon-f16v4.webp
    source: https://pixelcontroller.com/store/products/70-f16v4.html # page the photo came from
    credit: PixelController, LLC # who to credit
    license: CC BY 2.0 # only when the source states a license
```

### Which images are OK

1. **Openly licensed photos of the exact product** — Wikimedia Commons files
   (including SparkFun's Flickr uploads mirrored there, CC BY 2.0), open-hardware
   repos whose license covers their images. Copy the license exactly into
   `license` and the author into `credit`. Photos taken from sparkfun.com itself
   are CC BY-NC-SA 3.0 — record that license.
2. **The maker's own product photo** (or an authorized vendor's own photo of
   what it sells — Adafruit, SparkFun, Pololu, the maker's store), linked from
   its product page. No `license` field: rights stay with the owner and the
   image identifies the product.

Don't use marketplace listings that re-host other people's photos
(AliExpress, Amazon, eBay, …), images watermarked by a third party, stock
photos, renders of a different variant, or forum/blog photos without a license.
For a product whose site is gone, a Wayback Machine capture of the maker's page
is fine (`source` = the archived URL).

Entry pages show the credit (linked to `source`), plus the license and a
"cropped" note for openly licensed images, as CC licenses require.

### Adding one

```bash
bun run add-image controllers/my-entry https://maker.example/img/large.jpg \
  --source https://maker.example/products/my-entry --credit "Maker Inc"
```

- Accepts an image URL, a product page URL (uses its `og:image`), or a local file.
- Removes a solid white/black background, trims, resizes to ≤1200 px and
  encodes WebP ≤200 KB (`scripts/crop-image.ts`), writes
  `public/database-images/<category>/<id>.webp`, and adds the `images:` entry.
- Prints a preview PNG on a checkerboard — look at it. If light parts of the
  product were eaten by the background removal, re-run with `--keep-bg`.
- `--license "CC BY 2.0"` for openly licensed images; `--primary` to put a new
  image first; `--attribute-only` to add attribution to an image already in the
  repo.

`bun run validate` checks that every referenced image exists, is a WebP within
the size limits and carries `source` + `credit`, and that no image file is left
unreferenced. Thumbnails (240/480 px) for tables, the designer and entry pages
are generated at build time — don't commit them. `bun run coverage:assets
--missing` lists entries still without an image or datasheet.

### Datasheets

Parts (pixels, pixel ICs, level converters, connectors, microboards, pixel
decoders) record their datasheet as a direct PDF link; CI mirrors it to R2
(see [docs/datasheet-mirroring.md](docs/datasheet-mirroring.md)):

```yaml
datasheet:
  url: https://manufacturer.example/part.pdf
```

Check it with `bun run mirror-datasheets --check --only <category>/<id>`.

---

## Development Workflow

### Running Locally

```bash
# Development server with hot reload
bun run dev

# Build for production
bun run build

# Serve the production build the way static hosting does
bun scripts/serve-build.ts

# Run tests (unit, then end-to-end in headless Chromium)
bun run test:unit
bun run test:e2e

# Type checking
bun run typecheck

# Linting
bun run lint
```

### Testing Your Changes

1. **Start the dev server**: `bun run dev`
2. **Navigate to your new entry**: `http://localhost:5173/category/entry-id`
3. **Check the category page**: Verify it appears in the table
4. **Test search**: Ensure searchable fields work
5. **Run the test suite**: `bun run test:unit` and `bun run test:e2e`

### Submitting a Pull Request

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b add-new-controller`
3. **Make your changes**
4. **Test locally**
5. **Commit with a clear message**:

   ```
   Add ESP32-S3 Controller to database

   - Added new controller entry with full specifications
   - Includes WiFi and Ethernet interfaces
   - WLED compatible
   ```

6. **Push and create a PR**

The first time you open a pull request, a bot asks you to agree to the contributor agreement ([data](CLA-DATABASE.md), [code](CLA-CODE.md)) by posting a comment.

### Validation

The database uses JSON Schema for validation. Schemas are located in `database/_schema/`.

Before submitting:

- Run `bun run validate`: it checks every entry and every `_example.yaml`
  against its schema, and that each `sources` and `measurements` key names a
  field the entry has
- Check that URLs are valid and accessible
- Confirm the entry appears correctly on the site

---

## Questions?

- [Open an issue](https://github.com/cinderblock/list.awesomeled.xyz/issues/new/choose): there are forms for a correction, a missing product and a problem with the site
- Check existing entries in the same category for examples
- Review the JSON schemas in `database/_schema/` for field details

Thank you for contributing!
