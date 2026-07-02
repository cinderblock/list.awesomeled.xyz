/**
 * Column configurations for each data category
 */

import { ExternalLink, FileText, ShoppingCart, Youtube } from 'lucide-react';
import type { BaseEntry } from './types';
import { RelativeDate } from '~/components/ui/RelativeDate';
import { Tooltip } from '~/components/ui/Tooltip';
import { parsePrice, toUSD, priceUSD, formatPriceText, RATES_AS_OF } from './currency';
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

// Pixels / pixel-ics: datasheet
const datasheetLinks: LinkConfig[] = [
  { key: 'datasheet.url', label: 'Datasheet', icon: <FileText size={16} /> },
  { key: 'creator.page', label: 'Product page', icon: <ExternalLink size={16} /> },
];

// Connectors (with suppliers)
const connectorLinks: LinkConfig[] = [
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

// Helper for rendering arrays as badges (limited to 3)
function renderBadgeArray(v: unknown) {
  if (!Array.isArray(v)) return null;
  return (
    <div className="data-table-array">
      {v.slice(0, 3).map((i, idx) => (
        <span key={idx} className="badge badge--outline">
          {String(i)}
        </span>
      ))}
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
// a "≈ $X" tooltip). Arrays of price tiers show "from <cheapest>".
function formatPrice(v: unknown) {
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
  if (!parsed) return <span className="data-table-null">-</span>;

  const usd = toUSD(parsed);
  // Decimal-align: whole-dollar prices get invisible cents so the ones digits
  // line up with prices that show cents (column is right-aligned).
  const hasCents = parsed.amount % 1 !== 0;
  const rendered = (
    <span className="tabular-nums">
      {prefix}
      {formatPriceText(parsed, hasCents)}
      {!hasCents && <span style={{ visibility: 'hidden' }}>.00</span>}
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

// Helper for formatting numeric values with units
function formatNumericWithUnit(v: unknown, unitWidth?: string) {
  if (v == null) return <span className="data-table-null">-</span>;

  const str = String(v);

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

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        width: '100%',
      }}
    >
      <span className="tabular-nums">{num.toLocaleString('en-US')}</span>
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

// Shared updated column definition
export const updatedColumn: Column = {
  key: 'updated',
  label: 'Updated',
  sortable: true,
  render: formatRelativeDate,
  // Dates previously fell through to string comparison, which mis-orders
  // across months; compare epoch millis instead.
  sortValue: (v) => (v instanceof Date ? v.getTime() : null),
  defaultSortDir: 'desc',
  filterConfig: { type: 'date' },
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
    render: renderBadgeArray,
    filterConfig: { type: 'select' },
  },
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
  { key: 'data.clocked', label: 'Clocked', render: renderBool, filterConfig: { type: 'boolean' } },
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
  { key: 'physical.package_size', label: 'Package', filterConfig: { type: 'select' } },
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
  { key: 'data.clocked', label: 'Clocked', render: renderBool, filterConfig: { type: 'boolean' } },
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
  { key: 'physical.package_size', label: 'Package', filterConfig: { type: 'select' } },
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
  { key: 'ratings.ip_rating', label: 'IP Rating', filterConfig: { type: 'select' } },
  { key: 'mechanical.locking', label: 'Locking', filterConfig: { type: 'select' } },
];

export const microboardColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, productLinks),
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
    render: formatMemory,
    sortValue: sortMemory,
    className: 'data-table-cell--right',
  },
  {
    key: 'compute.ram',
    label: 'RAM',
    render: formatMemory,
    sortValue: sortMemory,
    className: 'data-table-cell--right',
  },
  { key: 'connectivity.wifi', label: 'Wi-Fi', filterConfig: { type: 'select' } },
  { key: 'connectivity.ethernet', label: 'Ethernet', filterConfig: { type: 'select' } },
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
    key: 'outputs.max_channels',
    label: 'Channels',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  { key: 'outputs.pixel_types', label: 'Pixel Types', filterConfig: { type: 'select' } },
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
    render: renderBadgeArray,
    filterConfig: { type: 'select' },
  },
  { key: 'license', label: 'License', filterConfig: { type: 'select' } },
  {
    key: 'foss',
    label: 'FOSS',
    render: renderBool,
    filterConfig: { type: 'boolean', trueLabel: 'Open source', falseLabel: 'Proprietary' },
  },
  { key: 'status', label: 'Status', render: renderStatus, filterConfig: { type: 'select' } },
];

export const diffusiveMaterialColumns: Column[] = [
  {
    key: 'links',
    label: '',
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, productLinks),
  },
  { key: 'name', label: 'Name' },
  { key: 'material_type', label: 'Type', filterConfig: { type: 'select' } },
  { key: 'optical.color_rendition', label: 'Color Rendition', filterConfig: { type: 'select' } },
  { key: 'optical.light_transmission', label: 'Transmission', filterConfig: { type: 'select' } },
  { key: 'physical.flexible', label: 'Flexible', filterConfig: { type: 'select' } },
  { key: 'pricing.price_range', label: 'Price Range', filterConfig: { type: 'select' } },
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
  { key: 'pricing.price_range', label: 'Price Range', filterConfig: { type: 'select' } },
];

export const levelConverterColumns: Column[] = [
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

export const pixelDecoderColumns: Column[] = [
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
    key: 'outputs.max_channels',
    label: 'Channels',
    render: formatNumericValue,
    className: 'data-table-cell--right',
    filterConfig: { type: 'numeric' },
  },
  { key: 'outputs.pixel_types', label: 'Pixel Types', filterConfig: { type: 'select' } },
  { key: 'outputs.description', label: 'Outputs' },
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
    'diffusive-materials': ['name', 'material_type', 'notes'],
    'commercial-systems': ['name', 'creator', 'notes'],
  };

  return searchKeyMap[categoryId] || ['name'];
}
