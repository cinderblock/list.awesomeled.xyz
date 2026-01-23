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
git clone https://github.com/your-username/awesomeledlist-reactrouter.git
cd awesomeledlist-reactrouter

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
| `notes`        | string        | No       | Additional information                             |
| `status`       | string        | No       | `active`, `discontinued`, `end-of-life`, `unknown` |
| `image`        | string        | No       | Filename in `images/` subdirectory                 |
| `images`       | array         | No       | Multiple image filenames                           |

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

### Current Status

Image support is defined in the schema but not yet fully implemented. Here's how to prepare for it:

### Schema Support

Every category supports image fields:

```yaml
# Single image
image: my-product.jpg

# Multiple images
images:
  - front-view.jpg
  - back-view.jpg
  - detail.jpg
```

### Image Directory Structure (Planned)

```
database/
├── controllers/
│   ├── images/
│   │   ├── esp32-controller.jpg
│   │   └── wled-board.png
│   ├── esp32-controller.yaml
│   └── wled-board.yaml
├── pixels/
│   ├── images/
│   │   └── ws2812b.jpg
│   └── ws2812b.yaml
```

### Image Guidelines

- **Format**: JPEG or PNG (prefer JPEG for photos, PNG for graphics)
- **Size**: Maximum 1200px on longest edge
- **File size**: Under 200KB when possible
- **Naming**: Match the entry ID (`my-entry.jpg` for `my-entry.yaml`)

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
