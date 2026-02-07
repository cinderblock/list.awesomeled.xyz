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
It also has a little tool to help download product images.

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

Run the test suite with:

```bash
bun test
```

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

For commercial licensing inquiries, please open an issue.

## Legal

Information is provided "as-is" with no guarantee of accuracy. Product specifications may change; verify details with manufacturers before making purchasing decisions.

If you are a rights holder and wish to have content removed, please [open an issue](https://github.com/awesomeledlist/awesomeledlist-reactrouter/issues).
