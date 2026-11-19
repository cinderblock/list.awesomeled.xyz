# Contributing to Awesome LED List

Thank you for your interest in contributing! This guide covers how to add new entries to the database, modify the UI, and add images.

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
npm install

# Start development server
npm run dev

# Run tests
npm run test
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

3. **Use the entry ID as the filename** (lowercase, hyphens only):
   - Good: `wled-controller-v3.yaml`
   - Bad: `WLED Controller v3.yaml`

4. **Add required fields**:

   ```yaml
   id: my-new-controller
   name: My New Controller
   ```

5. **Add optional fields** relevant to your category (see [Schema Reference](#yaml-schema-reference))

### Example Entry (Controller)

```yaml
id: esp32-led-controller
name: ESP32 LED Controller
manufacturer: Example Corp
url: https://example.com/controller
price: 25
max_pixels: 2048
max_outputs: 8
interfaces:
  - WiFi
  - Ethernet
wled_compatible: true
standalone: true
status: active
notes: Great budget option for medium-sized installations
```

### Example Entry (Pixel)

```yaml
id: ws2812b-eco
name: WS2812B-ECO
manufacturer: WorldSemi
url: https://worldsemi.com
datasheet: https://example.com/datasheet.pdf
led_voltage: 5V
color_order: GRB
clocked: false
data_bitrate: 800kHz
package_size: 5050
status: active
```

### Example Entry (Software Library)

```yaml
id: fastled
name: FastLED
url: https://github.com/FastLED/FastLED
platforms:
  - Arduino
  - ESP32
  - ESP8266
  - Teensy
license: MIT
price: free
notes: Popular Arduino library with extensive pixel support
```

---

## YAML Schema Reference

### Common Fields (All Categories)

| Field          | Type          | Required | Description                                        |
| -------------- | ------------- | -------- | -------------------------------------------------- |
| `id`           | string        | **Yes**  | URL-safe identifier (`^[a-z0-9-]+$`)               |
| `name`         | string        | **Yes**  | Display name                                       |
| `manufacturer` | string        | No       | Manufacturer or vendor name                        |
| `url`          | string        | No       | Primary URL (product page)                         |
| `price`        | number/string | No       | Price (`25`, `"$50"`, `"varies"`, `"free"`)        |
| `price_source` | object        | No       | Where/when the price was read (see below)          |
| `notes`        | string        | No       | Additional information                             |
| `status`       | string        | No       | `active`, `discontinued`, `end-of-life`, `unknown` |
| `image`        | string/object | No       | Legacy single image; prefer `images`               |
| `images`       | array         | No       | `{file, source, credit, license?}` — see below     |
| `aliases`      | array         | No       | Other names the part is sold or listed under       |
| `related`      | array         | No       | Links to other entries — see below                 |
| `sources`      | object        | No       | Where facts were verified — see below              |

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

### Controllers

| Field             | Type    | Description                                  |
| ----------------- | ------- | -------------------------------------------- |
| `max_pixels`      | number  | Maximum supported pixels                     |
| `max_outputs`     | number  | Number of data outputs                       |
| `interfaces`      | array   | `WiFi`, `Ethernet`, `USB`, `Bluetooth`, etc. |
| `wled_compatible` | boolean | WLED firmware support                        |
| `standalone`      | boolean | Operates without computer                    |
| `pixel_types`     | array   | Supported protocols                          |

### Pixels

| Field          | Type    | Description                         |
| -------------- | ------- | ----------------------------------- |
| `led_voltage`  | string  | LED operating voltage (`5V`, `12V`) |
| `vcc_voltage`  | string  | Power supply voltage                |
| `color_order`  | string  | `RGB`, `GRB`, `RGBW`, etc.          |
| `clocked`      | boolean | Uses clock signal (SPI)             |
| `data_bitrate` | string  | Data rate (`800kHz`, `1MHz`)        |
| `package_size` | string  | LED package (`5050`, `2020`, etc.)  |
| `datasheet`    | string  | Datasheet URL                       |

### Connectors

| Field             | Type    | Description                         |
| ----------------- | ------- | ----------------------------------- |
| `outline`         | string  | Physical form factor                |
| `max_current`     | string  | Current rating (`10A`, `30A`)       |
| `max_voltage`     | string  | Voltage rating (`24V`, `48V`)       |
| `ip_rating`       | string  | Ingress protection (`IP20`, `IP67`) |
| `locking`         | boolean | Has locking mechanism               |
| `conductor_count` | number  | Number of conductors                |

### Microboards

| Field         | Type    | Description                  |
| ------------- | ------- | ---------------------------- |
| `soc`         | string  | System-on-chip model         |
| `cpu`         | string  | Processor type               |
| `clock_speed` | string  | CPU frequency (`240MHz`)     |
| `flash`       | string  | Flash memory (`4MB`, `16MB`) |
| `ram`         | string  | RAM size (`320KB`, `8MB`)    |
| `wifi`        | boolean | Has WiFi                     |
| `ethernet`    | boolean | Has Ethernet                 |
| `bluetooth`   | boolean | Has Bluetooth                |

### Drive Libraries

| Field       | Type   | Description         |
| ----------- | ------ | ------------------- |
| `platforms` | array  | Supported platforms |
| `license`   | string | Software license    |
| `features`  | array  | Key features        |

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

1. **Add the field to the TypeScript type** in `app/lib/types.ts`:

   ```typescript
   export interface ControllerEntry extends BaseEntry {
     // ... existing fields
     new_field?: string;
   }
   ```

2. **Add the column configuration** in `app/lib/columns.tsx`:

   ```typescript
   export const controllerColumns: ColumnConfig[] = [
     // ... existing columns
     {
       key: 'new_field',
       label: 'New Field',
       sortable: true,
     },
   ];
   ```

3. **Add to search keys** if searchable:
   ```typescript
   export const searchKeys: Record<string, string[]> = {
     controllers: ['name', 'manufacturer', 'notes', 'new_field'],
     // ...
   };
   ```

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
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Testing Your Changes

1. **Start the dev server**: `npm run dev`
2. **Navigate to your new entry**: `http://localhost:5173/category/entry-id`
3. **Check the category page**: Verify it appears in the table
4. **Test search**: Ensure searchable fields work
5. **Run the test suite**: `npm run test`

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

### Validation

The database uses JSON Schema for validation. Schemas are located in `database/_schema/`.

Before submitting:

- Ensure `id` matches the filename (without `.yaml`)
- Verify required fields are present (`id`, `name`)
- Check that URLs are valid and accessible
- Confirm the entry appears correctly on the site

---

## Questions?

- Open an issue on GitHub for questions or suggestions
- Check existing entries in the same category for examples
- Review the JSON schemas in `database/_schema/` for field details

Thank you for contributing!
