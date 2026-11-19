# Awesome LED List

A comprehensive database of addressable LEDs, controllers, and related products for makers and enthusiasts.

## Categories

- **Pattern Drivers** - High level software that sends data to controllers
- **Controllers** - Devices that generate the specific timings and packet formats needed to drive many addressable LEDs; usually can hold and repeat at least one frame
- **Pixels** - Addressable LEDs, the innovation that enabled this world of wonder
- **Pixel ICs** - The main chip usually embedded into pixels as a standalone component (does not include LEDs)
- **Pixel Decoders** - Devices not meant for driving pixels directly but capable of sharing the same standard communication standards that addressable pixels use
- **Level Converters** - Memoryless devices that translate pixel data from another format
- **Adapters** - Hardware that aids compatibility between commodity controller hardware and light strings/panels; likely cannot hold a frame on its own
- **DIY MicroBoards** - Microprocessor boards that can usually be used directly with certain pixel types; pairing with an adapter is common
- **Connectors** - Connectors commonly used in LED products
- **Drive Libraries** - Software to turn off-the-shelf or commodity hardware into controllers
- **Diffusive Materials** - Materials the community has tested as light diffusers
- **Commercial Systems** - Complete systems usually only compatible with a closed ecosystem; often based on common technologies but "cleaned up", "easy to use", or provided as a service

## Using the Site

<https://list.awesomeled.xyz> grew out of a shared spreadsheet, and is meant to be faster than one at everything a spreadsheet gets used for:

- **Search everything**: the box on the home page, or `Ctrl`/`⌘`+`K` on any page, searches part numbers, makers, aliases, and protocols in every category at once.
- **Sort and filter**: click a column header to sort, again to reverse, `Shift`+click to add a tie-break level. **Filters** lists every structured field with a count beside each value, and clicking a value pill in the table filters by it.
- **Columns**: the default view is curated; **Columns** adds any other field the entries record. **Dense** rows fit more on a screen. On a phone the table becomes a list of cards (**Cards** / **Table** switches either way, on any screen).
- **Compare**: tick up to four entries and open **Compare** to see them side by side, with a differences-only switch.
- **Share and export**: search, sort, filters, and columns live in the URL, so the address bar always links to exactly what you see. **Share & export** copies the table as TSV or Markdown and downloads CSV, JSON, or YAML.
- **Keyboard**: `/` jumps to the table's search, `j` / `k` move between rows, `Enter` opens one, and `x` picks it for comparison.

## System Designer

[list.awesomeled.xyz/designer](https://list.awesomeled.xyz/designer) builds a
system out of the database, the way a parts picker does for a PC:

- Pick **pixels** (or a bare driver IC), how many strings and how long, a
  **controller** (off the shelf, a dev board, or a shield with the board it
  plugs into), and optionally a level shifter, a connector and the software
  that plays the patterns. Several pixel groups can share a controller.
- Everything is **checked as you go**: clocked vs. data-only, protocol
  support, voltage, output and pixel capacity, refresh rate against string
  length, logic levels and level shifting, connector ratings and sealing,
  whether the software can reach the controller.
- A **power plan**: full-white draw from each pixel's channel current, supply
  sizing, where to inject power, fuse and wire gauge per feed, and warnings
  from about 20 W and 200 W.
- A **parts list** with prices where the database has them (ranges stay
  ranges), exportable as CSV, Markdown or text.
- A **diagram**, downloadable as SVG or PNG. The file carries the design
  inside it: drop it back on the page to load it.
- The whole design lives in the page's link, so it can be shared, bookmarked
  or posted in a forum.

The checks are only as good as the data: where a fact isn't recorded the
designer says "verify" rather than guess. The logic is a plain library in
`app/lib/designer/` (no React), the interface is in
`app/components/designer/`, and the link format and design decisions are
written up in [plans/designer.md](plans/designer.md).

## Contributing

We hope you find these lists useful.
If there is something that should be added, please do so!

All product data is stored in YAML files in the `database/` directory.
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding or updating entries.

### Formatting Guidelines

Commas are list separators.
Periods are decimal separators.
Use the Oxford comma.

## Local Development Server

### Requirements

One of the following tools is required to run the development server and build the project:

| Tool    | Version       | Note      |
| ------- | ------------- | --------- |
| Bun     | 1.x           | Preferred |
| Node.js | 18.x or later | with Npm  |

### Getting Started

Install dependencies:

```bash
bun install
# or
npm install
```

Start the development server:

```bash
bun dev
# or
npm run dev
```

The app will print the local URL to the console, usually `http://localhost:5173`.

### Review Tool

We've created a custom tool to help review and update database entries.

To start the review tool, run:

```bash
bun review
```

This tool will pick a random old entry from the database and display its details.
It also has a little tool to help download product images; for adding one
with its attribution, use `bun run add-image` (see
[CONTRIBUTING.md](CONTRIBUTING.md#adding-images)).

### Spreadsheet Parity Check

The database started as a copy of the original Google Sheet.
To check that nothing in the sheet is missing here, run:

```bash
bun run sheet-parity
```

It downloads the sheet's public export (read-only; no login needed) and compares every cell, hyperlink, cell note and highlight with the YAML entries.
The result goes to [plans/spreadsheet-parity/report.md](plans/spreadsheet-parity/report.md), with each tab's column mapping and every open difference.
Differences that were reviewed and deliberately not migrated are listed, with the reason, in `scripts/sheet-parity/acks.yaml`; the audit itself is described in [plans/spreadsheet-parity.md](plans/spreadsheet-parity.md).

<!-- cspell:ignore acks -->

### Linting, Formatting, and Spell Checking

We use code to enforce consistent formatting as much as possible.

- [Prettier](https://prettier.io/) is used for code formatting.
- [ESLint](https://eslint.org/) is used for code linting. Plugins:
  - [eslint-plugin-yml](https://ota-meshi.github.io/eslint-plugin-yml/) enables linting for YAML files.
    We enforce consistent key ordering in YAML files and other best practices.
  - Custom rules, many derived from textlint rules, enforce consistent terminology in comments and documentation.
- [textlint](https://textlint.org/) is used for checking for dead links.
  We kept this check separate from ESLint for performance reasons.
- [cSpell](https://github.com/streetsidesoftware/cspell) is used for spell checking.

We recommend using an editor with built-in support for these tools, such as VSCode with the relevant extensions.
VSCode should automatically prompt you to install the recommended extensions when you open the project.
We enable format-on-save and auto-fixing on save to make it easier to keep files properly formatted.

To manually run linting and formatting checks, use:

```bash
bun lint         # Show problems
bun lint:fix     # Fix problems where possible
bun lint:links   # Check for dead links. Takes 5+ minutes.
bun format       # Format files with Prettier
bun format:check # Check formatting
bun spell        # Spell check
```

If you find these rules too strict or have suggestions, please open an issue or a pull request.

### Tests

```bash
bun run test:unit # Unit tests (bun test, tests/unit)
bun run test:e2e  # Browser tests against the dev server (Playwright, e2e/)
bun run build && bun run test:prod # Browser tests against the built site (e2e-prod/)
```

The site ships as prerendered HTML that React then takes over. A page whose
first render in the browser differs from that HTML (because it reads the query
string or saved preferences too early) fails only in the built site, never on
the dev server, which is why `test:prod` exists. All three run in CI before a
deploy.

## Bulk Database Updates

When making large bulk changes to database entries (e.g., renaming fields, reformatting values, or mass metadata updates), the commit should be added to `IGNORED_COMMITS` in `app/lib/data.ts`. This prevents the bulk update from affecting the "last updated" timestamps shown for individual entries.

1. Make the bulk update commit
2. Get the commit hash: `git rev-parse HEAD`
3. Add the hash to `IGNORED_COMMITS` in `app/lib/data.ts` with a comment describing the change
4. Commit this update separately

## History

This project started as a [Google Sheets document](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA) to organize information about LED controllers, pixels, and related products.
As the frequency of complete changes decreased, the number of accidental, sloppy, or duplicate edits increased.
To improve data integrity and allow for community contributions, the data was copied to this GitHub repository with structured YAML files and a purpose built web interface with a lot of help from Claude.

## Tech Stack

- [React Router](https://reactrouter.com/) - Full-stack React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components

## Deployments

CloudFlare Pages is used for hosting and continuous deployment.

All branches are deployed automatically, to their own subdomains.
See CloudFlare Pages' [documentation](https://developers.cloudflare.com/pages/configuration/preview-deployments/) for more information about preview deployments.

## License

This project uses dual licensing:

- **Code** (everything except `database/`): [AGPL-3.0](LICENSE)
- **Database** (`database/` directory): [ODbL-1.0](database/LICENSE)
- **Product images** (`public/database-images/`): not covered by either license.
  Each image belongs to the owner credited on its entry (`images[].credit`,
  linked to `images[].source`) or is used under the license recorded there
  (`images[].license`). See [CONTRIBUTING.md](CONTRIBUTING.md#adding-images).

For commercial licensing inquiries, please open an issue.

## Legal

Information is provided "as-is" with no guarantee of accuracy. Product specifications may change; verify details with manufacturers before making purchasing decisions.

If you are a rights holder and wish to have content removed, please [open an issue](https://github.com/cinderblock/list.awesomeled.xyz/issues).
