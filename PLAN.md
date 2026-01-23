# Awesome LED List - React Router Rebuild Plan

## Overview

Recreate the Awesome LED List project with a new software stack based on React Router 7, Radix UI (no Tailwind/shadcn), and Playwright for testing.

## Key Differences from Original

- **No Tailwind CSS** - use vanilla CSS with CSS custom properties
- **No shadcn** - use Radix UI primitives directly with custom theming
- **Playwright** for browser testing instead of Vitest
- **React Router 7** with SSG (static site generation)
- Same: Fully static output, seamless client-side navigation, fast load times

## Phase 1: Setup Foundation

### 1.1 Remove Tailwind CSS

- Remove `@tailwindcss/vite` and `tailwindcss` from package.json
- Remove Tailwind plugin from vite.config.ts
- Create new `app/styles/` directory with vanilla CSS

### 1.2 Add Radix UI

- Install Radix UI primitives: `@radix-ui/react-*` packages
- Create custom theme system using CSS custom properties

### 1.3 Create Base Theme System

- CSS custom properties for colors, spacing, typography
- Light/dark mode support using `prefers-color-scheme` and class toggle
- OKLCH color space for rainbow effects (same as original)

### 1.4 Configure SSG

- Set up React Router for static pre-rendering
- Configure routes to generate `index.html` files in directories
- Ensure nice URLs work on simple web servers

### 1.5 Verify Dev Experience

- Hot reload working for all file types
- Fast builds
- Type checking

## Phase 2: Data Layer & Testing

### 2.1 Copy YAML Database

- Copy `database/` directory from original project
- Includes: controllers, pixels, pixel-ics, connectors, etc.

### 2.2 YAML Loading with Bun

- Import YAML files using Bun's file watching
- Data available at build time for SSG
- Hot reload on YAML file changes

### 2.3 Playwright Setup

- Install `@playwright/test`
- Configure for browser testing

### 2.4 Tests

- Test: Can build content from YAML
- Test: Development hot reload works
- Test: Static build generates correct files

## Phase 3: Full UI Implementation

### 3.1 Header

- Rainbow animated title (RainbowText component)
- Mouse-responsive hue animation
- GitHub link
- Theme toggle (light/dark)
- About link

### 3.2 Category Navigation

- Horizontal scrolling tab bar
- Rainbow colors per category (prescribed hue values)
- Smooth scroll with arrow buttons
- Active state highlighting

### 3.3 Home Page

- Grid of category cards
- Each card shows: name, description, entry count
- Rainbow-colored based on category hue
- Click animation (expand/fade)

### 3.4 About Page

- Simple content page
- Breadcrumb navigation
- Prose styling

### 3.5 Tabular Pages

- DataTable component with sortable columns
- Column-specific rendering (badges, links, etc.)
- Responsive design

### 3.6 Filtering & Search

- Global search input
- Column-specific filters
- Filter state in URL for shareability

### 3.7 CSV Export

- Generate CSV for current view
- Download button
- Pre-generated CSVs for each category

### 3.8 Print Optimizations

- Landscape orientation
- Remove UI chrome
- Scale tables to fit
- Keep rainbow colors

### 3.9 Footer

- Rainbow title
- Community disclaimer
- GitHub contribution link

## Technology Stack

### Dependencies

```
react, react-dom: ^19.x
react-router: 7.12.0
@radix-ui/react-*: Latest (dropdown-menu, popover, select, tooltip)
yaml: For parsing YAML
marked: For markdown rendering
lucide-react: Icons
```

### Dev Dependencies

```
@playwright/test: Browser testing
typescript: ^5.x
vite: ^7.x
```

## File Structure

```
awesomeledlist-reactrouter/
├── app/
│   ├── routes/
│   │   ├── home.tsx
│   │   ├── about.tsx
│   │   ├── $category.tsx
│   │   └── $category.$entry.tsx
│   ├── components/
│   │   ├── layout/
│   │   ├── data/
│   │   └── ui/
│   ├── styles/
│   │   ├── base.css
│   │   ├── theme.css
│   │   └── print.css
│   ├── lib/
│   │   ├── data.ts
│   │   ├── types.ts
│   │   └── utils.ts
│   ├── context/
│   └── hooks/
├── database/
│   ├── controllers/
│   ├── pixels/
│   └── ...
├── e2e/
│   └── *.test.ts
└── public/
```

## Commit Strategy

- Commit at end of each phase
- Additional commits for significant milestones within phases
- Clear, descriptive commit messages
