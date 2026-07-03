import {
  CheckCircle,
  AlertTriangle,
  Wifi,
  Cpu,
  Network,
  Bluetooth,
  Usb,
  Radio,
  Monitor,
  PlugZap,
  Clock,
  Cable,
  Lightbulb,
  MemoryStick,
  SlidersHorizontal,
  AppWindow,
  CircuitBoard,
  Smartphone,
  Globe,
  Code,
  Droplets,
  Package,
  Play,
  Unlock,
} from 'lucide-react';
import { Link } from 'react-router';

// Expandable icon badge system for common terms/technologies
// Each badge shows an icon with a tooltip for the full meaning

interface BadgeConfig {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  color: string;
  // Lowercase terms that map to this badge. The canonical id (map key) is
  // always matched too. Matching is whole-word, so short ids like "spi" or
  // "arm" won't fire inside unrelated words ("firmware", "inspiration").
  match?: string[];
  // Terms only used for exact whole-value matches (ValueBadges), never for the
  // free-text hero scan — for terms too generic or ambiguous to scan ("web",
  // "sd", "usd" the storage type).
  valueOnlyMatch?: string[];
  // Fires only off object KEYS (negation-aware: `standalone: true`), never
  // free text — prose can negate ("not a standalone controller") and the
  // word scan can't see that.
  keyOnly?: boolean;
}

// Shared colors so related badges read as a family
const C = {
  green: '#22c55e',
  amber: '#f59e0b',
  control: '#8b5cf6', // pixel-control protocols (Art-Net, sACN, DDP, ...)
  net: '#3b82f6', // wired/wireless connectivity
  rf: '#0ea5e9', // radio links
  bus: '#14b8a6', // low-level buses (I2C, SPI, UART, ...)
  port: '#64748b', // physical ports (USB, HDMI, ...)
  chip: '#ef4444', // SoC / MCU families
  pixel: '#ec4899', // pixel data / IC families
  power: '#eab308', // power features
  software: '#06b6d4', // software ecosystems
  platform: '#f97316', // OS / runtime platforms
  rating: '#0284c7', // ingress-protection ratings
} as const;

// Map of canonical id -> badge configuration.
// Keys and `match` terms must be lowercase.
const BADGES: Record<string, BadgeConfig> = {
  // Status
  active: { icon: CheckCircle, label: 'Active', color: C.green },
  deprecated: {
    icon: AlertTriangle,
    label: 'Deprecated',
    color: C.amber,
    match: ['discontinued', 'end-of-life', 'eol'],
  },

  // Pixel-control protocols
  artnet: { icon: Network, label: 'Art-Net', color: C.control, match: ['art-net', 'art net'] },
  sacn: { icon: Network, label: 'sACN', color: C.control, match: ['e1.31', 'e1.31 (sacn)'] },
  ddp: { icon: Network, label: 'DDP', color: C.control },
  kinet: { icon: Network, label: 'KiNET', color: C.control },
  opc: { icon: Network, label: 'OPC', color: C.control, match: ['open pixel control'] },
  tpm2: { icon: Network, label: 'TPM2', color: C.control, match: ['tpm2.net'] },
  dmx: { icon: SlidersHorizontal, label: 'DMX', color: C.control, match: ['dmx512'] },

  // Connectivity
  wifi: { icon: Wifi, label: 'Wi-Fi', color: C.net, match: ['wi-fi'] },
  // Band pills for Wi-Fi columns; exact-value only so they don't double up
  // with the Wi-Fi pill in hero scans (see note below).
  'wifi-2-4': { icon: Wifi, label: '2.4 GHz', color: C.net, valueOnlyMatch: ['2.4ghz', '2.4 ghz'] },
  'wifi-5': { icon: Wifi, label: '5 GHz', color: C.net, valueOnlyMatch: ['5ghz', '5 ghz'] },
  ethernet: { icon: Network, label: 'Ethernet', color: C.net },
  // Speed pills for Ethernet columns (exact values only; the hero already
  // shows plain Ethernet via the field key)
  'ethernet-100': {
    icon: Network,
    label: '100 Mbps',
    color: C.net,
    valueOnlyMatch: ['100base-tx', '100base-t', '100mbps', '10/100'],
  },
  'ethernet-1g': {
    icon: Network,
    label: 'Gigabit',
    color: C.net,
    valueOnlyMatch: ['gigabit', '1000base-t', 'gigabit ethernet'],
  },
  bluetooth: { icon: Bluetooth, label: 'Bluetooth', color: C.net, match: ['ble'] },
  // Note: "2.4 GHz" deliberately has no badge — in this database it only ever
  // appears as a WiFi band qualifier (`Wi-Fi: 2.4GHz`), so a separate pill just
  // doubles up the WiFi pill. Reintroduce only if a non-WiFi 2.4 GHz radio
  // (nRF24, ESP-NOW, proprietary wireless DMX) shows up as its own field.
  lora: { icon: Radio, label: 'LoRa', color: C.rf },
  zigbee: { icon: Radio, label: 'Zigbee', color: C.rf },

  // Physical ports
  usb: {
    icon: Usb,
    label: 'USB',
    color: C.port,
    match: ['usb-c', 'usb-a', 'micro usb', 'mini usb'],
  },
  hdmi: { icon: Monitor, label: 'HDMI', color: C.port },

  // Low-level buses
  i2c: { icon: Cable, label: 'I²C', color: C.bus },
  spi: { icon: Cable, label: 'SPI', color: C.bus },
  uart: { icon: Cable, label: 'UART', color: C.bus },
  'can-bus': { icon: Cable, label: 'CAN bus', color: C.bus, match: ['canbus', 'can bus'] },

  // Storage
  microsd: {
    icon: MemoryStick,
    label: 'microSD',
    color: C.port,
    match: ['micro sd', 'micro-sd', 'tf card'],
    valueOnlyMatch: ['usd'], // storage.type: uSD ("usd" is unscannable: currency)
  },
  'sd-card': {
    icon: MemoryStick,
    label: 'SD card',
    color: C.port,
    match: ['sd card', 'sdcard'],
    valueOnlyMatch: ['sd'], // storage.type: SD
  },

  // Pixel data line
  clocked: { icon: Clock, label: 'Clocked', color: C.pixel },
  'backup-line': {
    icon: Cable,
    label: 'Backup Line',
    color: C.pixel,
    match: ['backup data line', 'backup line', 'backup_line', 'back up data line'],
  },
  // Fires off outputs.differential: true (key scan); prose mentions of
  // differential ports are the same capability
  differential: { icon: Cable, label: 'Differential', color: C.pixel },

  // Ingress protection (dust/water) ratings
  ip20: { icon: Droplets, label: 'IP20', color: C.rating },
  ip30: { icon: Droplets, label: 'IP30', color: C.rating },
  ip40: { icon: Droplets, label: 'IP40', color: C.rating },
  ip65: { icon: Droplets, label: 'IP65', color: C.rating },
  ip66: { icon: Droplets, label: 'IP66', color: C.rating },
  ip67: { icon: Droplets, label: 'IP67', color: C.rating },
  ip68: { icon: Droplets, label: 'IP68', color: C.rating },

  // Pixel/IC package sizes. The numeric ones are valueOnly — "2020" or "5050"
  // in free text is more likely a year or a quantity than a package.
  'pkg-5050': { icon: Package, label: '5050', color: C.pixel, valueOnlyMatch: ['5050'] },
  'pkg-3535': { icon: Package, label: '3535', color: C.pixel, valueOnlyMatch: ['3535'] },
  'pkg-2020': { icon: Package, label: '2020', color: C.pixel, valueOnlyMatch: ['2020'] },
  'pkg-2040': { icon: Package, label: '2040', color: C.pixel, valueOnlyMatch: ['2040'] },
  'pkg-1515': { icon: Package, label: '1515', color: C.pixel, valueOnlyMatch: ['1515'] },
  'pkg-1212': { icon: Package, label: '1212', color: C.pixel, valueOnlyMatch: ['1212'] },
  'pkg-2427': { icon: Package, label: '2427', color: C.pixel, valueOnlyMatch: ['2427'] },
  sop8: { icon: Package, label: 'SOP8', color: C.pixel, match: ['sop-8'] },
  sop10: { icon: Package, label: 'SOP10', color: C.pixel, match: ['sop-10'] },
  sop12: { icon: Package, label: 'SOP12', color: C.pixel, match: ['sop-12'] },
  sop14: { icon: Package, label: 'SOP14', color: C.pixel, match: ['sop-14', 'so14'] },
  sop16: { icon: Package, label: 'SOP16', color: C.pixel, match: ['sop-16'] },
  soic8: { icon: Package, label: 'SOIC8', color: C.pixel, match: ['soic-8'] },
  dip8: { icon: Package, label: 'DIP8', color: C.pixel, match: ['dip-8'] },
  dip14: { icon: Package, label: 'DIP14', color: C.pixel, match: ['dip-14'] },

  // SoC / MCU families
  esp32: { icon: Cpu, label: 'ESP32', color: C.chip },
  esp8266: { icon: Cpu, label: 'ESP8266', color: C.chip },
  rp2040: { icon: Cpu, label: 'RP2040', color: C.chip },
  teensy: { icon: Cpu, label: 'Teensy', color: C.chip },
  'raspberry-pi': {
    icon: Cpu,
    label: 'Raspberry Pi',
    color: C.chip,
    match: ['raspberry pi', 'rpi'],
  },
  arm: { icon: Cpu, label: 'ARM', color: C.chip },
  stm32: { icon: Cpu, label: 'STM32', color: C.chip },
  fpga: { icon: CircuitBoard, label: 'FPGA', color: C.chip },
  arduino: { icon: Cpu, label: 'Arduino', color: C.chip },

  // Power
  poe: { icon: PlugZap, label: 'PoE', color: C.power, match: ['power over ethernet'] },

  // Capabilities from structured booleans (inputs.standalone, derived foss)
  standalone: { icon: Play, label: 'Standalone', color: C.software, keyOnly: true },
  foss: { icon: Unlock, label: 'FOSS', color: C.software, keyOnly: true },

  // Software ecosystems
  wled: { icon: Lightbulb, label: 'WLED', color: C.software },
  fpp: {
    icon: AppWindow,
    label: 'FPP',
    color: C.software,
    match: ['falcon player', 'falconplayer'],
  },
  xlights: { icon: AppWindow, label: 'xLights', color: C.software },

  // Languages (drive libraries)
  cpp: { icon: Code, label: 'C++', color: C.software, match: ['c++'] },
  javascript: { icon: Code, label: 'JavaScript', color: C.software },
  python: { icon: Code, label: 'Python', color: C.software },

  // OS / runtime platforms (pattern drivers, drive libraries)
  windows: { icon: Monitor, label: 'Windows', color: C.platform },
  macos: { icon: Monitor, label: 'macOS', color: C.platform, match: ['mac os', 'os x'] },
  linux: { icon: Monitor, label: 'Linux', color: C.platform, match: ['ubuntu', 'raspbian'] },
  android: { icon: Smartphone, label: 'Android', color: C.platform },
  ios: { icon: Smartphone, label: 'iOS', color: C.platform },
  // "web" is far too generic to free-text scan (web UI, web-based config, …):
  // only badge exact platform values.
  'web-app': {
    icon: Globe,
    label: 'Web',
    color: C.platform,
    valueOnlyMatch: ['web', 'browser'],
  },
};

// Escape a term for use inside a RegExp literal
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Precompute: every matchable term -> canonical id, plus whole-word matchers.
// `\b` boundaries keep short ids ("spi", "arm", "opc") from matching inside
// longer words, which the old substring scan got wrong. keyOnly badges get a
// key matcher but no free-text matcher.
const TERM_TO_ID: Record<string, string> = {};
const TEXT_MATCHERS: { id: string; re: RegExp }[] = [];
const KEY_MATCHERS: { id: string; re: RegExp }[] = [];
for (const [id, cfg] of Object.entries(BADGES)) {
  for (const term of [id, ...(cfg.match ?? [])]) {
    TERM_TO_ID[term] = id;
    const matcher = {
      id,
      re: new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(term)}(?![a-z0-9])`, 'i'),
    };
    KEY_MATCHERS.push(matcher);
    if (!cfg.keyOnly) TEXT_MATCHERS.push(matcher);
  }
  for (const term of cfg.valueOnlyMatch ?? []) {
    TERM_TO_ID[term] = id;
  }
}

interface FeatureBadgesProps {
  entry: Record<string, unknown>;
}

// A value that negates the capability its key names (`clocked: never`,
// `bms: No`, `wled_compatible: false`) — the key must not produce a badge.
function isNegatedValue(v: unknown): boolean {
  if (v === false || v == null) return true;
  return typeof v === 'string' && ['no', 'none', 'never', 'false', 'n/a'].includes(v.toLowerCase());
}

function scanString(
  s: string,
  found: Set<string>,
  matchers: { id: string; re: RegExp }[] = TEXT_MATCHERS
): void {
  for (const { id, re } of matchers) {
    if (!found.has(id) && re.test(s)) found.add(id);
  }
}

// URLs are not facts about the product: a vendor slug like
// ".../sp107e-spi-music-controller..." must not produce an SPI badge (and has
// produced outright-wrong ones, e.g. IP68 from a datasheet hosted for a
// different product). Strip them before scanning.
function stripUrls(s: string): string {
  return s.replace(/https?:\/\/\S+/g, ' ');
}

// Prose fields are source material for converting facts INTO structured
// fields — never direct badge input. Free text can negate ("not a standalone
// controller"), qualify ("optional Wi-Fi add-on"), or mention other products
// ("V3 (discontinued)"), and a word scan can't see any of that.
const PROSE_FIELDS = new Set([
  'notes',
  'technical_notes',
  'features',
  'credit',
  'source',
  'sku',
  'dead_links',
]);

// Scan a value (recursing into arrays/objects) for badge matches, collecting
// canonical ids into `found`. Three structured signals only:
//  - object KEYS (`protocols: {artnet: Both}`, `inputs.physical: {Ethernet:
//    true}`), unless their value negates the capability;
//  - whole-word matches in short structured leaf values (names, protocol
//    lists, common_applications) — never in PROSE_FIELDS;
//  - exact whole-value matches (storage `type: uSD`, `package_size: '5050'`,
//    Wi-Fi band values) via the valueOnly term table.
function findBadgesInValue(value: unknown, found: Set<string>): void {
  if (typeof value === 'string') {
    scanString(stripUrls(value), found);
    const exact = TERM_TO_ID[value.trim().toLowerCase()];
    if (exact) found.add(exact);
  } else if (Array.isArray(value)) {
    for (const item of value) findBadgesInValue(item, found);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (PROSE_FIELDS.has(key)) continue;
      if (!isNegatedValue(item)) scanString(key, found, KEY_MATCHERS);
      findBadgesInValue(item, found);
    }
  }
}

// Get all applicable badges for an entry by scanning all (nested) fields.
// Insertion order of BADGES drives display order so related pills stay grouped.
function getBadgesForEntry(entry: Record<string, unknown>): BadgeConfig[] {
  const found = new Set<string>();
  findBadgesInValue(entry, found);
  return Object.keys(BADGES)
    .filter((id) => found.has(id))
    .map((id) => BADGES[id]);
}

// Pill styling shared across badge variants
const pillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  fontSize: '0.8125rem',
  padding: '0.125rem 0.5rem',
  borderRadius: '9999px',
  textDecoration: 'none',
};

// Escape special chars for filter URL values
function escapeFilterValue(val: string): string {
  return val.replace(/([|:,~!-])/g, '\\$1');
}

interface BadgeProps {
  badge: BadgeConfig;
  to?: string;
}

// Render a single badge pill, optionally as a link
export function Badge({ badge, to }: BadgeProps) {
  const Icon = badge.icon;
  const style: React.CSSProperties = {
    ...pillStyle,
    color: badge.color,
    backgroundColor: `${badge.color}18`,
    border: `1px solid ${badge.color}40`,
  };

  const content = (
    <>
      <Icon size={14} />
      <span>{badge.label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} style={style}>
        {content}
      </Link>
    );
  }

  return <span style={style}>{content}</span>;
}

// Render a plain text pill (for non-badge values in mixed arrays)
export function TextPill({ text, to }: { text: string; to?: string }) {
  const style: React.CSSProperties = {
    ...pillStyle,
    color: 'var(--text-muted)',
    backgroundColor: 'var(--bg-tertiary, #f3f4f6)',
    border: '1px solid var(--border-color, #e5e7eb)',
  };

  if (to) {
    return (
      <Link to={to} style={{ ...style, color: 'var(--category-primary)' }}>
        {text}
      </Link>
    );
  }

  return <span style={style}>{text}</span>;
}

// Get badge for a single string value (exact match against a term or alias)
export function getBadgeForValue(value: string): BadgeConfig | null {
  const id = TERM_TO_ID[value.trim().toLowerCase()];
  return id ? BADGES[id] : null;
}

interface ValueBadgesProps {
  value: unknown;
  categoryPath?: string;
  fieldKey?: string;
}

// Render badges for a value (string or array), returns null if no badges found
// For arrays with mixed content, renders badges for matches and text pills for non-matches
export function ValueBadges({ value, categoryPath, fieldKey }: ValueBadgesProps): React.ReactNode {
  const makeLinkTo = (val: string) => {
    if (categoryPath && fieldKey) {
      return `${categoryPath}?f=${fieldKey}:${escapeFilterValue(val)}`;
    }
    return undefined;
  };

  if (typeof value === 'string') {
    const badge = getBadgeForValue(value);
    if (badge) {
      return <Badge badge={badge} to={makeLinkTo(value)} />;
    }
    return null;
  }

  if (Array.isArray(value)) {
    // Check if any items have badges
    const hasBadges = value.some(
      (item) => typeof item === 'string' && getBadgeForValue(item) !== null
    );

    if (!hasBadges) return null;

    // Render each item as a pill - badge if available, text pill otherwise
    return (
      <span
        style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.375rem', alignItems: 'center' }}
      >
        {value.map((item, idx) => {
          const strItem = String(item);
          const badge = typeof item === 'string' ? getBadgeForValue(item) : null;
          if (badge) {
            return <Badge key={idx} badge={badge} to={makeLinkTo(strItem)} />;
          }
          return <TextPill key={idx} text={strItem} to={makeLinkTo(strItem)} />;
        })}
      </span>
    );
  }

  return null;
}

export function FeatureBadges({ entry }: FeatureBadgesProps) {
  const badges = getBadgesForEntry(entry);

  if (badges.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.25rem' }}>
      {badges.map((badge, idx) => (
        <Badge key={idx} badge={badge} />
      ))}
    </div>
  );
}
