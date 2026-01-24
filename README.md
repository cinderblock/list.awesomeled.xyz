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

## Requirements

| Tool | Version |
| ---- | ------- |
| Bun  | 1.x     |

## Getting Started

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun dev
```

The app will be available at `http://localhost:5173`.

## Contributing

We hope you find these lists useful. If there is something that should be added, please do so!

All product data is stored in YAML files in the `database/` directory. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding or updating entries.

### Formatting Guidelines

- Commas are list separators. Periods are decimal separators. Use the Oxford comma.
- Numeric columns should only contain numbers (units are appended for display).
- Remove all formatting when adding information.

## History

This project started as a [Google Sheets document](https://docs.google.com/spreadsheets/d/10pHG7_VIVltyqJK1Y0T5g3Iq6YJV2MnhMp3UcAVB-GA) to organize information about LED controllers, pixels, and related products.
As the frequency of complete changes decreased, the number of accidental, sloppy, or duplicate edits increased.
To improve data integrity and allow for community contributions, the data was migrated to a GitHub repository with structured YAML files and a purpose built web interface.

## Tech Stack

- [React Router](https://reactrouter.com/) - Full-stack React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Radix UI](https://www.radix-ui.com/) - Accessible UI components

## License

This project uses dual licensing:

- **Code** (everything except `database/`): [AGPL-3.0](LICENSE)
- **Database** (`database/` directory): [ODbL-1.0](database/LICENSE)

For commercial licensing inquiries, please open an issue.

## Legal

Information is provided "as-is" with no guarantee of accuracy. Product specifications may change; verify details with manufacturers before making purchasing decisions.
