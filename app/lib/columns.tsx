/**
 * Column configurations for each data category
 */

import { ExternalLink, FileText, ShoppingCart, Youtube } from 'lucide-react';
import type { BaseEntry } from './types';
import { Badge, getBadgeForValue, packageBadge, TextPill } from '~/components/ui/FeatureBadges';
import { RelativeDate } from '~/components/ui/RelativeDate';
import { Tooltip } from '~/components/ui/Tooltip';
import { parsePrice, toUSD, priceUSD, perPixelUSD, formatPriceText, RATES_AS_OF } from './currency';
import { getPriceSource } from './price-source';
import { PriceStaleMark } from '~/components/data/PriceSource';
import { quantitySortValue } from './quantity';
import { flattenPlatforms } from './platforms';

const sortVoltage = quantitySortValue('voltage');
const sortCurrent = quantitySortValue('current');
const sortFrequency = quantitySortValue('frequency');
// lenient: "8MB PSRAM" sorts as 8 MB; "microSD" (not a size) sorts last
const sortMemory = quantitySortValue('memory', true);

// Filter type definitions
export type FilterType = 'numeric' | 'select' | 'boolean' | 'string' | 'date';

export interface NumericFilterConfig {
  type: 'numeric';
  unit?: string; // e.g., 'V', 'A', 'Hz'
}

export interface DateFilterConfig {
  type: 'date';
}

export interface SelectFilterConfig {
  type: 'select';
  options?: string[]; // Static options, or auto-detected from data
  multi?: boolean; // Allow multiple selections
  exclude?: boolean; // If true, filter excludes selected values
}

export interface BooleanFilterConfig {
  type: 'boolean';
  trueLabel?: string;
  falseLabel?: string;
}

export interface StringFilterConfig {
  type: 'string';
  fuzzy?: boolean; // Enable fuzzy/space-separated matching
}

export type FilterConfig =
  | NumericFilterConfig
  | SelectFilterConfig
  | BooleanFilterConfig
  | StringFilterConfig
  | DateFilterConfig;

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterConfig?: FilterConfig;
  render?: (value: unknown, item: BaseEntry) => React.ReactNode;
  // Normalize the resolved value for sorting (e.g. prices → USD equivalent).
  // Nulls sort last; without this, raw values compare numerically/lexically.
  sortValue?: (value: unknown, item: BaseEntry) => number | string | null;
  // First-click sort direction (default 'asc'). Use 'desc' where bigger-first
  // reads naturally (e.g. wire gauge, capacities).
  defaultSortDir?: 'asc' | 'desc';
  className?: string;
  // Header tooltip with EXTRA information (jargon translation, units) —
  // never a restatement of the label.
  headerTip?: string;
}

// Link configuration for external URLs
interface LinkConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
}

// Helper to extract domain from URL for tooltip
function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

// Resolve a possibly-dotted key (e.g. "links.product") against an object
function resolveKey(item: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((v, k) => {
    if (v == null) return null;
    return (v as Record<string, unknown>)[k];
  }, item);
}

// Helper to render link icons for an entry
function renderLinks(item: BaseEntry, linkConfigs: LinkConfig[]) {
  const links = linkConfigs
    .map((config) => {
      const value = resolveKey(item, config.key);
      if (typeof value !== 'string' || !value.startsWith('http')) return null;
      return { ...config, url: value };
    })
    .filter(Boolean) as (LinkConfig & { url: string })[];

  if (links.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      {links.map((link) => (
        <Tooltip key={link.key} content={`${link.label}: ${getDomain(link.url)}`}>
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="data-table-link-icon"
            onClick={(e) => e.stopPropagation()}
          >
            {link.icon}
          </a>
        </Tooltip>
      ))}
    </div>
  );
}

// Link locations vary by category in the nested schema.
// Product page lives in creator.page for hardware with a creator, else links.product.
const productLinks: LinkConfig[] = [
  { key: 'creator.page', label: 'Product page', icon: <ExternalLink size={16} /> },
  { key: 'links.product', label: 'Product page', icon: <ExternalLink size={16} /> },
];

const datasheetLink: LinkConfig = {
  key: 'datasheet.url',
  label: 'Datasheet',
  icon: <FileText size={16} />,
};

// Pixels / pixel-ics: datasheet
const datasheetLinks: LinkConfig[] = [
  datasheetLink,
  { key: 'creator.page', label: 'Product page', icon: <ExternalLink size={16} /> },
];

// Other parts with datasheets (microboards, level converters, pixel decoders)
const partLinks: LinkConfig[] = [datasheetLink, ...productLinks];

// Connectors (with suppliers)
const connectorLinks: LinkConfig[] = [
  datasheetLink,
  { key: 'links.product', label: 'Product page', icon: <ExternalLink size={16} /> },
  { key: 'links.digikey', label: 'DigiKey', icon: <ShoppingCart size={16} /> },
  { key: 'links.mouser', label: 'Mouser', icon: <ShoppingCart size={16} /> },
];

// Pattern drivers
const patternDriverLinks: LinkConfig[] = [
  { key: 'links.url', label: 'Project page', icon: <ExternalLink size={16} /> },
];

// Drive libraries (repo + YouTube)
const libraryLinks: LinkConfig[] = [
  { key: 'links.repo', label: 'Repository', icon: <ExternalLink size={16} /> },
  { key: 'links.youtube', label: 'YouTube', icon: <Youtube size={16} /> },
];

// Render a creator that may be a string or { name, url, page } object
function renderCreator(v: unknown): React.ReactNode {
  if (v == null) return <span className="data-table-null">-</span>;
  if (typeof v === 'object') {
    const name = (v as { name?: string }).name;
    return name ? <span>{name}</span> : <span className="data-table-null">-</span>;
  }
  return <span>{String(v)}</span>;
}

// Helper for rendering arrays as badges (limited to 3). Known protocols /
// platforms / features (Art-Net, Wi-Fi, WLED, Linux, …) render with their icon
// badge; unmatched values fall back to a plain pill — same pattern as the
// Package column and CellValue arrays. `labels` maps enum values to display
// text (e.g. pixel-data -> Pixel data).
function renderBadgeArray(v: unknown, labels?: Record<string, string>) {
  if (!Array.isArray(v)) return null;
  return (
    <div className="data-table-array">
      {v.slice(0, 3).map((i, idx) => {
        const str = labels?.[String(i)] ?? String(i);
        const badge = getBadgeForValue(str);
        return badge ? <Badge key={idx} badge={badge} /> : <TextPill key={idx} text={str} />;
      })}
      {v.length > 3 && <span className="badge badge--secondary">+{v.length - 3}</span>}
    </div>
  );
}

// Helper for status badges
function renderStatus(v: unknown) {
  if (!v) return null;
  const status = String(v).toLowerCase();
  const variant =
    status === 'active'
      ? 'badge--success'
      : status === 'discontinued'
        ? 'badge--secondary'
        : 'badge--outline';
  return (
    <span className={`badge ${variant}`} style={{ textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

// Helper for boolean badges
function renderBool(v: unknown) {
  if (v === true) return <span className="badge badge--success">Yes</span>;
  if (v === false) return <span className="badge badge--secondary">No</span>;
  return null;
}

// Helper for formatting price (right-aligned, original currency; non-USD gets
// a "≈ $X" tooltip). Arrays of price tiers show "from <cheapest>". Prices
// older than PRICE_STALE_MONTHS get a small clock mark (entry page has the date).
function formatPrice(v: unknown, item?: Record<string, unknown>) {
  if (v == null) return <span className="data-table-null">-</span>;

  if (typeof v === 'string' && /^(free|varies|contact|unknown)$/i.test(v.trim())) {
    const label = v.trim().toLowerCase();
    if (label === 'free') return <span>Free</span>;
    return <span className="data-table-null">{label}</span>;
  }

  let prefix = '';
  let parsed = parsePrice(v);
  if (Array.isArray(v)) {
    const tiers = v.map(parsePrice).filter((p): p is NonNullable<typeof p> => p != null);
    if (tiers.length > 0) {
      parsed = tiers.reduce((min, p) =>
        (toUSD(p) ?? Infinity) < (toUSD(min) ?? Infinity) ? p : min
      );
      if (tiers.length > 1) prefix = 'from ';
    }
  }
  if (!parsed) {
    // Free-text software pricing ("39/week +", "€15 donation") is still
    // information: show it muted rather than a bare dash.
    return typeof v === 'string' && v.trim() ? (
      <span className="data-table-null">{v.trim()}</span>
    ) : (
      <span className="data-table-null">-</span>
    );
  }

  const usd = toUSD(parsed);
  // Decimal-align: whole-dollar prices get invisible cents so the ones digits
  // line up with prices that show cents (column is right-aligned).
  const hasCents = parsed.amount % 1 !== 0;
  // "Free", ranges and "$330+" aren't single numbers: no alignment padding
  const plain = parsed.max == null && parsed.amount !== 0 && !parsed.from;
  const rendered = (
    <span className="tabular-nums">
      {item && <PriceStaleMark source={getPriceSource(item)} status={item.status} />}
      {prefix}
      {formatPriceText(parsed, hasCents)}
      {plain && !hasCents && <span style={{ visibility: 'hidden' }}>.00</span>}
    </span>
  );
  if (parsed.currency !== 'USD' && usd != null) {
    return (
      <Tooltip
        content={`≈ $${Math.round(usd).toLocaleString('en-US')} USD (rates as of ${RATES_AS_OF})`}
      >
        {rendered}
      </Tooltip>
    );
  }
  return rendered;
}

// Package column: physical.packages (canonical names, common.json
// ic_package / led_package), one package pill each
function renderPackages(v: unknown) {
  if (!Array.isArray(v) || v.length === 0) return <span className="data-table-null">-</span>;
  return (
    <div className="data-table-array">
      {v.map((p, i) => (
        <Badge key={i} badge={packageBadge(String(p))} />
      ))}
    </div>
  );
}

// Helper for formatting numeric values with units
function formatNumericWithUnit(v: unknown, unitWidth?: string) {
  if (v == null) return <span className="data-table-null">-</span>;

  const str = String(v);

  // Ranges like "3.7-5.5V" render as "3.7–5.5" + unit
  const range = str.match(/^([\d.]+)-([\d.]+)\s*(.*)$/);
  if (range) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        <span className="tabular-nums">
          {range[1]}–{range[2]}
        </span>
        {range[3] && (
          <span
            className="data-table-null"
            style={{
              marginLeft: '0.25rem',
              width: unitWidth,
              textAlign: 'left',
              display: 'inline-block',
            }}
          >
            {range[3]}
          </span>
        )}
      </span>
    );
  }

  // Parse number and unit from string like "30 A", "5V", "800kHz", "2.0kHz"
  const match = str.match(/^([\d.,]+)\s*(.*)$/);
  if (!match) {
    return <span>{str}</span>;
  }

  const [, numStr, unit] = match;
  const num = parseFloat(numStr.replace(/,/g, ''));

  if (isNaN(num)) {
    return <span>{str}</span>;
  }

  const formatted = num.toLocaleString('en-US');

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        width: '100%',
      }}
    >
      <span className="tabular-nums">{formatted}</span>
      {/* Decimal-align: whole numbers get invisible tenths so "1 GHz" lines
          up with "1.2 GHz" */}
      {!formatted.includes('.') && (
        <span className="tabular-nums" style={{ visibility: 'hidden' }}>
          .0
        </span>
      )}
      {unit && (
        <span
          className="data-table-null"
          style={{
            marginLeft: '0.25rem',
            width: unitWidth,
            textAlign: 'left',
            display: 'inline-block',
          }}
        >
          {unit}
        </span>
      )}
    </span>
  );
}

// Factory to create a formatter with a specific unit width
function createUnitFormatter(unitWidth: string) {
  return (v: unknown) => formatNumericWithUnit(v, unitWidth);
}

// Pre-built formatters for common unit types
const formatVoltage = createUnitFormatter('1ch');
const formatCurrent = createUnitFormatter('2ch');
const formatFrequency = createUnitFormatter('3ch');
const formatMemory = createUnitFormatter('5ch');

// Helper for formatting plain numeric values (right-aligned, no unit)
function formatNumericValue(v: unknown) {
  if (v == null) return <span className="data-table-null">-</span>;
  const num = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''));
  if (isNaN(num)) return <span className="data-table-null">-</span>;
  return <span className="tabular-nums">{num.toLocaleString('en-US')}</span>;
}

// Helper for formatting dates as relative time ("3 days ago", date on hover)
function formatRelativeDate(v: unknown) {
  if (v == null) return <span className="data-table-null">-</span>;
  const date = v instanceof Date ? v : new Date(String(v));
  if (isNaN(date.getTime())) return <span className="data-table-null">-</span>;
  return <RelativeDate date={date} />;
}

// --- Cross-link columns (values derived in relations.ts → entry.linked) ----

// What a controller/adapter drives, as the maker lists it — or "via WLED" when
// the set comes from its firmware. The column's value (linked.pixels) is the
// wider compatible set, so filtering "WS2815" also finds controllers that list
// WS2811 (same protocol).
function renderDrives(_: unknown, item: BaseEntry) {
  const listed = (item.outputs as { protocols?: unknown } | undefined)?.protocols;
  if (Array.isArray(listed) && listed.length > 0) return renderBadgeArray(listed);
  const via = (item.linked as { pixelsVia?: string[] } | undefined)?.pixelsVia;
  if (via?.length) return <span className="data-table-null">via {via.join(', ')}</span>;
  return <span className="data-table-null">-</span>;
}

const sortByLength = (v: unknown) => (Array.isArray(v) ? v.length : null);

// Ecosystem counts: 0 reads as "none recorded", shown muted
function formatLinkCount(v: unknown) {
  if (typeof v !== 'number' || v === 0) return <span className="data-table-null">–</span>;
  return <span className="tabular-nums">{v}</span>;
}

function linkCountColumn(key: string, label: string, headerTip: string): Column {
  return {
    key,
    label,
    render: formatLinkCount,
    sortValue: (v) => (typeof v === 'number' ? v : null),
    defaultSortDir: 'desc',
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
    headerTip,
  };
}

// outputs.clocked (common.json clocked_support): which pixel signal types a
// board's outputs drive
const CLOCKED_LABELS: Record<string, string> = {
  false: 'Single-wire',
  selectable: 'Both',
  always: 'Clocked',
};

const clockedColumn: Column = {
  key: 'outputs.clocked',
  label: 'Pixel Signal',
  render: (v) =>
    v == null ? (
      <span className="data-table-null">-</span>
    ) : (
      <span>{CLOCKED_LABELS[String(v)]}</span>
    ),
  filterConfig: { type: 'select' },
  headerTip:
    'Single-wire: data only (WS2811 family). Clocked: data + clock lines (APA102 family). Both: selectable per output.',
};

const drivesColumn: Column = {
  key: 'linked.pixels',
  label: 'Pixel ICs',
  render: renderDrives,
  sortValue: sortByLength,
  defaultSortDir: 'desc',
  filterConfig: { type: 'select', multi: true },
  headerTip:
    'Pixel ICs the maker lists. The filter also matches parts that speak the same protocol (listing WS2811 covers WS2815) and, when the maker lists none, what the board’s firmware supports.',
};

const pixelHardwareColumn = linkCountColumn(
  'linked.hardware',
  'Hardware',
  'Controllers and adapters here that can drive it: the maker lists it or a same-protocol part, or their firmware supports it'
);
const pixelLibrariesColumn = linkCountColumn(
  'linked.libraries',
  'Libraries',
  'Drive libraries here that support it or a same-protocol part'
);
const softwareHardwareColumn = linkCountColumn(
  'linked.runsOn',
  'Hardware',
  'Controllers and adapters here that run it as firmware or name it as compatible software'
);

// Shared reviewed column: when the row was last specifically checked for
// accuracy (git history, minus the IGNORED_COMMITS batches in data.ts)
export const updatedColumn: Column = {
  key: 'updated',
  label: 'Reviewed',
  sortable: true,
  render: formatRelativeDate,
  // Dates previously fell through to string comparison, which mis-orders
  // across months; compare epoch millis instead.
  sortValue: (v) => (v instanceof Date ? v.getTime() : null),
  defaultSortDir: 'desc',
  filterConfig: { type: 'date' },
};

// Price column for part-level tables (pixels, pixel ICs, connectors): quantity
// tiers show "from <cheapest tier>", stale prices get the clock mark
const partPriceColumn: Column = {
  key: 'price',
  label: 'Price',
  render: formatPrice,
  sortValue: priceUSD,
  className: 'data-table-cell--right',
  filterConfig: { type: 'numeric', unit: '$' },
};

export const controllerColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, productLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  {
    key: 'outputs.count',
    label: 'Outputs',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  {
    key: 'outputs.pixels.max_per_output',
    label: 'Max px/out',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  {
    key: 'inputs.protocols',
    label: 'Protocols',
    render: (v) => renderBadgeArray(v),
    filterConfig: { type: 'select' },
  },
  drivesColumn,
  {
    key: 'price',
    label: 'Price',
    render: formatPrice,
    sortValue: priceUSD,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric', unit: '$' },
  },
  { key: 'wled_compatible', label: 'WLED', render: renderBool, filterConfig: { type: 'boolean' } },
  { key: 'status', label: 'Status', render: renderStatus, filterConfig: { type: 'select' } },
];

export const pixelColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, datasheetLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  { key: 'color.order', label: 'Color Order', filterConfig: { type: 'select' } },
  {
    key: 'electrical.led_voltage',
    label: 'LED Voltage',
    render: formatVoltage,
    sortValue: sortVoltage,
    className: 'data-table-cell--right',
  },
  {
    key: 'electrical.vcc_voltage',
    label: 'VCC',
    render: formatVoltage,
    sortValue: sortVoltage,
    className: 'data-table-cell--right',
  },
  {
    key: 'data.clocked',
    label: 'Clocked',
    render: renderBool,
    filterConfig: { type: 'boolean' },
    headerTip: "Data + clock lines — often sold as 'SPI' pixels",
  },
  {
    key: 'data.backup_line',
    label: 'Backup Line',
    render: renderBool,
    filterConfig: { type: 'boolean' },
  },
  {
    key: 'data.bitrate',
    label: 'Data Rate',
    render: formatFrequency,
    sortValue: sortFrequency,
    className: 'data-table-cell--right',
  },
  {
    key: 'physical.packages',
    label: 'Package',
    render: renderPackages,
    filterConfig: { type: 'select' },
  },
  pixelHardwareColumn,
  pixelLibrariesColumn,
  partPriceColumn,
];

export const pixelICColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, datasheetLinks),
  },
  { key: 'name', label: 'Name' },
  {
    key: 'data.channels',
    label: 'Channels',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  {
    key: 'data.clocked',
    label: 'Clocked',
    render: renderBool,
    filterConfig: { type: 'boolean' },
    headerTip: "Data + clock lines — often sold as 'SPI' pixels",
  },
  {
    key: 'data.backup_line',
    label: 'Backup Line',
    render: renderBool,
    filterConfig: { type: 'boolean' },
  },
  {
    key: 'color.pwm_frequency',
    label: 'PWM Freq',
    render: formatFrequency,
    sortValue: sortFrequency,
    className: 'data-table-cell--right',
  },
  {
    key: 'data.bitrate',
    label: 'Data Rate',
    render: formatFrequency,
    sortValue: sortFrequency,
    className: 'data-table-cell--right',
  },
  {
    key: 'physical.packages',
    label: 'Package',
    render: renderPackages,
    filterConfig: { type: 'select' },
  },
  pixelHardwareColumn,
  pixelLibrariesColumn,
  partPriceColumn,
];

export const patternDriverColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, patternDriverLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  {
    key: 'pricing.price',
    label: 'Price',
    render: formatPrice,
    sortValue: priceUSD,
    className: 'data-table-cell--right',
  },
  {
    key: 'platforms.os',
    label: 'Platforms',
    render: (_, item) => renderBadgeArray(flattenPlatforms(item.platforms)),
    filterConfig: { type: 'select' },
  },
  {
    key: 'foss',
    label: 'FOSS',
    render: renderBool,
    filterConfig: { type: 'boolean', trueLabel: 'Open source', falseLabel: 'Proprietary' },
  },
  {
    key: 'capabilities.live',
    label: 'Live',
    render: renderBool,
    filterConfig: { type: 'boolean' },
  },
  { key: 'capabilities.visualizer', label: 'Visualizer', filterConfig: { type: 'select' } },
  softwareHardwareColumn,
  { key: 'status', label: 'Status', render: renderStatus, filterConfig: { type: 'select' } },
];

export const connectorColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, connectorLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  { key: 'mechanical.outline', label: 'Outline', filterConfig: { type: 'select' } },
  {
    key: 'ratings.max_current',
    label: 'Max Current',
    render: formatCurrent,
    sortValue: sortCurrent,
    className: 'data-table-cell--right',
  },
  {
    key: 'ratings.max_voltage',
    label: 'Max Voltage',
    render: formatVoltage,
    sortValue: sortVoltage,
    className: 'data-table-cell--right',
  },
  {
    key: 'ratings.ip_rating',
    label: 'IP Rating',
    // common.json ip_rating: 'IP67', a range across variants, or false (unsealed)
    render: (v) =>
      v === false ? (
        <span className="data-table-null">Unsealed</span>
      ) : v == null ? null : (
        <span>{String(v)}</span>
      ),
    filterConfig: { type: 'select' },
  },
  { key: 'mechanical.locking', label: 'Locking', filterConfig: { type: 'select' } },
  linkCountColumn(
    'linked.usedBy',
    'Used by',
    'Controllers, adapters and decoders here that use this connector'
  ),
  partPriceColumn,
];

// Microboard flash / RAM (common.json memory): one size, or a list of
// variants ("1GB", "2GB", ...) shown together and sorted by the smallest
function renderMemoryVariants(v: unknown) {
  if (Array.isArray(v)) return <span className="tabular-nums">{v.map(String).join(' / ')}</span>;
  return formatMemory(v);
}
const sortMemoryVariants = (v: unknown) => sortMemory(Array.isArray(v) ? v[0] : v);

// Microboard connectivity (microboard.json): a list of Wi-Fi bands or one
// Ethernet speed, false when absent, or 'add-on' (dongle, shield, module)
function renderConnectivity(v: unknown) {
  if (v === false) return <span className="data-table-null">No</span>;
  if (v === 'add-on') return <TextPill text="Add-on" />;
  if (Array.isArray(v)) return renderBadgeArray(v);
  if (typeof v === 'string') {
    const badge = getBadgeForValue(v);
    return badge ? <Badge badge={badge} /> : <TextPill text={v} />;
  }
  return null;
}

export const microboardColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, partLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  { key: 'compute.soc', label: 'SoC', filterConfig: { type: 'select' } },
  { key: 'compute.cpu', label: 'CPU', filterConfig: { type: 'select' } },
  {
    key: 'compute.clock_speed',
    label: 'Clock',
    render: formatFrequency,
    sortValue: sortFrequency,
    className: 'data-table-cell--right',
  },
  {
    key: 'compute.flash',
    label: 'Flash',
    render: renderMemoryVariants,
    sortValue: sortMemoryVariants,
    className: 'data-table-cell--right',
  },
  {
    key: 'compute.ram',
    label: 'RAM',
    render: renderMemoryVariants,
    sortValue: sortMemoryVariants,
    className: 'data-table-cell--right',
  },
  {
    key: 'connectivity.wifi',
    label: 'Wi-Fi',
    render: renderConnectivity,
    filterConfig: { type: 'select' },
    headerTip: 'Bands on the board; Add-on = through a USB dongle or shield',
  },
  {
    key: 'connectivity.ethernet',
    label: 'Ethernet',
    render: renderConnectivity,
    filterConfig: { type: 'select' },
    headerTip: 'On-board speed; Add-on = through a USB adapter or module',
  },
  linkCountColumn(
    'linked.hosts',
    'Add-ons',
    'Shields, hats, capes, controllers and software here that are built for this board'
  ),
  {
    key: 'price',
    label: 'Price',
    render: formatPrice,
    sortValue: priceUSD,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric', unit: '$' },
  },
];

export const adapterColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, productLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  {
    key: 'outputs.count',
    label: 'Outputs',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  clockedColumn,
  drivesColumn,
  {
    key: 'price',
    label: 'Price',
    render: formatPrice,
    sortValue: priceUSD,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric', unit: '$' },
  },
];

export const driveLibraryColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, libraryLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  {
    // Plain text: badge icons only cover some languages, and a mixed
    // pill/plain column reads worse than a uniform one
    key: 'language',
    label: 'Language',
    render: (v) => (v == null ? null : <span>{String(v)}</span>),
    filterConfig: { type: 'select' },
  },
  {
    key: 'platforms',
    label: 'Platforms',
    render: (v) => renderBadgeArray(v),
    filterConfig: { type: 'select' },
  },
  { key: 'license', label: 'License', filterConfig: { type: 'select' } },
  {
    key: 'foss',
    label: 'FOSS',
    render: renderBool,
    filterConfig: { type: 'boolean', trueLabel: 'Open source', falseLabel: 'Proprietary' },
  },
  softwareHardwareColumn,
  { key: 'status', label: 'Status', render: renderStatus, filterConfig: { type: 'select' } },
];

// Diffusive-material ratings (diffusive-material.json definitions/rating):
// 1-5, or a range "3-4" when it varies by grade. Sorts by the midpoint.
function ratingValue(v: unknown): number | null {
  if (typeof v === 'number') return v;
  const m = typeof v === 'string' ? v.match(/^([1-5])-([1-5])$/) : null;
  return m ? (Number(m[1]) + Number(m[2])) / 2 : null;
}

function renderRating(v: unknown) {
  if (v == null) return <span className="data-table-null">-</span>;
  return <span className="tabular-nums">{String(v).replace('-', '–')}</span>;
}

const RATING_TIP = '1 (poor) to 5 (excellent); a range when it varies by grade';

// Price bands ($ to $$$$$$) sort by length, not lexically
const priceRangeSort = (v: unknown) => (typeof v === 'string' ? v.length : null);

export const diffusiveMaterialColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, productLinks),
  },
  { key: 'name', label: 'Name' },
  {
    key: 'materials',
    label: 'Material',
    render: (v) => renderBadgeArray(v),
    filterConfig: { type: 'select' },
    headerTip:
      'PMMA = acrylic, PC = polycarbonate, PET = polyester, PAN = acrylic fibre, XLPE = cross-linked polyethylene (PEX, Plastazote)',
  },
  {
    key: 'form',
    label: 'Form',
    render: (v) => renderBadgeArray(v),
    filterConfig: { type: 'select' },
  },
  {
    key: 'optical.diffusivity',
    label: 'Diffusivity',
    render: renderRating,
    sortValue: ratingValue,
    defaultSortDir: 'desc',
    className: 'data-table-cell--right',
    filterConfig: { type: 'select' },
    headerTip: RATING_TIP,
  },
  {
    key: 'optical.light_transmission',
    label: 'Transmission',
    render: renderRating,
    sortValue: ratingValue,
    defaultSortDir: 'desc',
    className: 'data-table-cell--right',
    filterConfig: { type: 'select' },
    headerTip: RATING_TIP,
  },
  {
    key: 'optical.color_rendition',
    label: 'Color Rendition',
    render: renderRating,
    sortValue: ratingValue,
    defaultSortDir: 'desc',
    className: 'data-table-cell--right',
    filterConfig: { type: 'select' },
    headerTip: RATING_TIP,
  },
  {
    key: 'physical.flexible',
    label: 'Flexibility',
    render: (v) => (v === true ? <span>Flexible</span> : v === false ? <span>Rigid</span> : null),
    filterConfig: { type: 'boolean', trueLabel: 'Flexible', falseLabel: 'Rigid' },
  },
  {
    key: 'pricing.price_range',
    label: 'Price Range',
    sortValue: priceRangeSort,
    filterConfig: { type: 'select' },
  },
];

export const commercialSystemColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, productLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  {
    key: 'specs.pixels_per_run',
    label: 'Pixels/Run',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  { key: 'specs.color_type', label: 'Color Type', filterConfig: { type: 'select' } },
  {
    key: 'pricing.price_range',
    label: 'Price Range',
    sortValue: priceRangeSort,
    filterConfig: { type: 'select' },
  },
  {
    key: 'pricing',
    label: 'Per Pixel',
    filterable: false,
    // Cheapest published price point ÷ the pixels it buys, in USD
    render: (v) => {
      const per = perPixelUSD(v);
      if (per == null) return <span className="data-table-null">-</span>;
      return (
        <span className="tabular-nums">
          ${per.toLocaleString('en-US', { maximumSignificantDigits: 3 })}
        </span>
      );
    },
    sortValue: (v) => perPixelUSD(v),
    className: 'data-table-cell--right',
    headerTip: `Cheapest published price point divided by the pixels it buys, in USD (rates as of ${RATES_AS_OF})`,
  },
];

export const levelConverterColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, partLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  {
    key: 'io.channels',
    label: 'Channels',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  {
    key: 'price',
    label: 'Price',
    render: formatPrice,
    sortValue: priceUSD,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric', unit: '$' },
  },
];

// pixel-decoder.json outputs.types enum -> display label
const DECODER_OUTPUT_LABELS: Record<string, string> = {
  'pixel-data': 'Pixel data',
  dmx512: 'DMX512',
  pwm: 'PWM',
  relay: 'Relay',
  servo: 'Servo',
  power: 'Power',
};

export const pixelDecoderColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, partLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'creator', label: 'Creator', render: renderCreator },
  {
    key: 'outputs.types',
    label: 'Output',
    render: (v) => renderBadgeArray(v, DECODER_OUTPUT_LABELS),
    filterConfig: { type: 'select' },
    headerTip: 'What the decoder turns pixel data into (or passes it on as)',
  },
  {
    key: 'outputs.count',
    label: 'Channels',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  {
    key: 'price',
    label: 'Price',
    render: formatPrice,
    sortValue: priceUSD,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric', unit: '$' },
  },
];

// Map category IDs to their column configurations
export function getColumnsForCategory(categoryId: string): Column[] {
  const columnMap: Record<string, Column[]> = {
    controllers: controllerColumns,
    pixels: pixelColumns,
    'pixel-ics': pixelICColumns,
    'pattern-drivers': patternDriverColumns,
    connectors: connectorColumns,
    microboards: microboardColumns,
    'level-converters': levelConverterColumns,
    adapters: adapterColumns,
    'drive-libraries': driveLibraryColumns,
    'pixel-decoders': pixelDecoderColumns,
    'diffusive-materials': diffusiveMaterialColumns,
    'commercial-systems': commercialSystemColumns,
  };

  const columns = columnMap[categoryId] || [{ key: 'name', label: 'Name' }];
  return [...columns, updatedColumn];
}

// Search keys for each category
export function getSearchKeysForCategory(categoryId: string): string[] {
  const searchKeyMap: Record<string, string[]> = {
    controllers: ['name', 'creator', 'notes'],
    pixels: ['name', 'creator', 'notes'],
    'pixel-ics': ['name', 'notes'],
    'pattern-drivers': ['name', 'creator', 'notes'],
    connectors: ['name', 'creator', 'notes'],
    microboards: ['name', 'creator', 'compute.soc'],
    'level-converters': ['name', 'creator', 'notes'],
    adapters: ['name', 'creator', 'notes'],
    'drive-libraries': ['name', 'creator', 'hardware'],
    'pixel-decoders': ['name', 'creator', 'notes'],
    'diffusive-materials': ['name', 'materials', 'notes'],
    'commercial-systems': ['name', 'creator', 'notes'],
  };

  return searchKeyMap[categoryId] || ['name'];
}
