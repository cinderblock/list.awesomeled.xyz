/**
 * Column configurations for each data category
 */

import { ExternalLink, FileText, ShoppingCart, Youtube } from "lucide-react";
import type { BaseEntry } from "./types";

export interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, item: BaseEntry) => React.ReactNode;
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
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Helper to render link icons for an entry
function renderLinks(item: BaseEntry, linkConfigs: LinkConfig[]) {
  const links = linkConfigs
    .map((config) => {
      const value = (item as Record<string, unknown>)[config.key];
      if (typeof value !== "string" || !value.startsWith("http")) return null;
      return { ...config, url: value };
    })
    .filter(Boolean) as (LinkConfig & { url: string })[];

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="link-icon"
          title={`${link.label}: ${getDomain(link.url)}`}
          onClick={(e) => e.stopPropagation()}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

// Default links (url field)
const defaultLinks: LinkConfig[] = [
  { key: "url", label: "Product page", icon: <ExternalLink size={16} /> },
];

// Links with datasheet
const datasheetLinks: LinkConfig[] = [
  { key: "url", label: "Product page", icon: <ExternalLink size={16} /> },
  { key: "datasheet_url", label: "Datasheet", icon: <FileText size={16} /> },
];

// Links for connectors (with suppliers)
const connectorLinks: LinkConfig[] = [
  { key: "url", label: "Product page", icon: <ExternalLink size={16} /> },
  { key: "digikey_url", label: "DigiKey", icon: <ShoppingCart size={16} /> },
  { key: "mouser_url", label: "Mouser", icon: <ShoppingCart size={16} /> },
];

// Links for drive libraries (with YouTube)
const libraryLinks: LinkConfig[] = [
  { key: "url", label: "Project page", icon: <ExternalLink size={16} /> },
  { key: "youtube_url", label: "YouTube", icon: <Youtube size={16} /> },
];

// Helper for rendering arrays as badges (limited to 3)
function renderBadgeArray(v: unknown) {
  if (!Array.isArray(v)) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {v.slice(0, 3).map((i, idx) => (
        <span key={idx} className="badge badge-outline">
          {String(i)}
        </span>
      ))}
      {v.length > 3 && (
        <span className="badge badge-secondary">+{v.length - 3}</span>
      )}
    </div>
  );
}

// Helper for status badges
function renderStatus(v: unknown) {
  if (!v) return null;
  const status = String(v).toLowerCase();
  const variant =
    status === "active" ? "badge-success" : status === "discontinued" ? "badge-secondary" : "badge-outline";
  return (
    <span className={`badge ${variant}`} style={{ textTransform: "capitalize" }}>
      {status}
    </span>
  );
}

// Helper for boolean badges
function renderBool(v: unknown) {
  if (v === true) return <span className="badge badge-success">Yes</span>;
  if (v === false) return <span className="badge badge-secondary">No</span>;
  return null;
}

// Helper for formatting price (right-aligned dollar amount)
function formatPrice(v: unknown) {
  if (v == null) return <span className="text-muted">-</span>;
  const num = typeof v === "number" ? v : parseFloat(String(v).replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return <span className="text-muted">-</span>;
  return (
    <span className="tabular-nums">${num.toLocaleString()}</span>
  );
}

// Helper for formatting numeric values with units
function formatNumericWithUnit(v: unknown, unitWidth?: string) {
  if (v == null) return <span className="text-muted">-</span>;

  const str = String(v);

  // Parse number and unit from string like "30 A", "5V", "800kHz", "2.0kHz"
  const match = str.match(/^([\d.,]+)\s*(.*)$/);
  if (!match) {
    return <span>{str}</span>;
  }

  const [, numStr, unit] = match;
  const num = parseFloat(numStr.replace(/,/g, ""));

  if (isNaN(num)) {
    return <span>{str}</span>;
  }

  return (
    <span className="inline-flex items-baseline justify-end" style={{ width: "100%" }}>
      <span className="tabular-nums">{num.toLocaleString()}</span>
      {unit && (
        <span
          className="text-muted"
          style={{ marginLeft: "0.25rem", width: unitWidth, textAlign: "left", display: "inline-block" }}
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
const formatVoltage = createUnitFormatter("1ch");
const formatCurrent = createUnitFormatter("2ch");
const formatFrequency = createUnitFormatter("3ch");
const formatMemory = createUnitFormatter("5ch");

// Helper for formatting plain numeric values (right-aligned, no unit)
function formatNumericValue(v: unknown) {
  if (v == null) return <span className="text-muted">-</span>;
  const num = typeof v === "number" ? v : parseFloat(String(v).replace(/,/g, ""));
  if (isNaN(num)) return <span className="text-muted">-</span>;
  return <span className="tabular-nums">{num.toLocaleString()}</span>;
}

export const controllerColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_pixels", label: "Max Pixels", render: formatNumericValue, className: "text-right" },
  { key: "max_outputs", label: "Outputs", render: formatNumericValue, className: "text-right" },
  { key: "interfaces", label: "Interfaces", render: renderBadgeArray },
  { key: "price", label: "Price", render: formatPrice, className: "text-right" },
  { key: "wled_compatible", label: "WLED", render: renderBool },
  { key: "status", label: "Status", render: renderStatus },
];

export const pixelColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, datasheetLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "color_order", label: "Color Order" },
  { key: "led_voltage", label: "LED Voltage", render: formatVoltage, className: "text-right" },
  { key: "vcc_voltage", label: "VCC", render: formatVoltage, className: "text-right" },
  { key: "clocked", label: "Clocked", render: renderBool },
  { key: "data_bitrate", label: "Data Rate", render: formatFrequency, className: "text-right" },
  { key: "package_size", label: "Package" },
];

export const pixelICColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, datasheetLinks),
  },
  { key: "name", label: "Name" },
  { key: "channels", label: "Channels", render: formatNumericValue, className: "text-right" },
  { key: "clocked", label: "Clocked", render: renderBool },
  { key: "pwm_frequency", label: "PWM Freq", render: formatFrequency, className: "text-right" },
  { key: "data_bitrate", label: "Data Rate", render: formatFrequency, className: "text-right" },
  { key: "package_size", label: "Package" },
];

export const patternDriverColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "developer", label: "Developer" },
  { key: "price", label: "Price", render: formatPrice, className: "text-right" },
  { key: "platforms", label: "Platforms", render: renderBadgeArray },
  { key: "live", label: "Live", render: renderBool },
  { key: "designer", label: "Designer", render: renderBool },
  { key: "visualizer", label: "Visualizer", render: renderBool },
  { key: "status", label: "Status", render: renderStatus },
];

export const connectorColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, connectorLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "outline", label: "Outline" },
  { key: "max_current", label: "Max Current", render: formatCurrent, className: "text-right" },
  { key: "max_voltage", label: "Max Voltage", render: formatVoltage, className: "text-right" },
  { key: "ip_rating", label: "IP Rating" },
  { key: "locking", label: "Locking" },
];

export const microboardColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "soc", label: "SoC" },
  { key: "cpu", label: "CPU" },
  { key: "clock_speed", label: "Clock", render: formatFrequency, className: "text-right" },
  { key: "flash", label: "Flash", render: formatMemory, className: "text-right" },
  { key: "ram", label: "RAM", render: formatMemory, className: "text-right" },
  { key: "wifi", label: "WiFi" },
  { key: "ethernet", label: "Ethernet" },
  { key: "price", label: "Price", render: formatPrice, className: "text-right" },
];

export const adapterColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels", render: formatNumericValue, className: "text-right" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "price", label: "Price", render: formatPrice, className: "text-right" },
];

export const driveLibraryColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, libraryLinks),
  },
  { key: "name", label: "Name" },
  { key: "developer", label: "Developer" },
  { key: "hardware", label: "Hardware" },
  { key: "features", label: "Features" },
];

export const diffusiveMaterialColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "material_type", label: "Type" },
  { key: "color_rendition", label: "Color Rendition" },
  { key: "light_transmission", label: "Transmission" },
  { key: "flexible", label: "Flexible" },
  { key: "price_range", label: "Price Range" },
];

export const commercialSystemColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "pixels_per_run", label: "Pixels/Run", render: formatNumericValue, className: "text-right" },
  { key: "color_type", label: "Color Type" },
  { key: "price_range", label: "Price Range" },
];

// Level converters and pixel decoders use generic columns
export const levelConverterColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels", render: formatNumericValue, className: "text-right" },
  { key: "price", label: "Price", render: formatPrice, className: "text-right" },
];

export const pixelDecoderColumns: Column[] = [
  {
    key: "links",
    label: "",
    sortable: false,
    filterable: false,
    render: (_, item) => renderLinks(item, defaultLinks),
  },
  { key: "name", label: "Name" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "max_channels", label: "Channels", render: formatNumericValue, className: "text-right" },
  { key: "pixel_types", label: "Pixel Types" },
  { key: "outputs", label: "Outputs", render: formatNumericValue, className: "text-right" },
  { key: "price", label: "Price", render: formatPrice, className: "text-right" },
];

// Map category IDs to their column configurations
export function getColumnsForCategory(categoryId: string): Column[] {
  const columnMap: Record<string, Column[]> = {
    controllers: controllerColumns,
    pixels: pixelColumns,
    "pixel-ics": pixelICColumns,
    "pattern-drivers": patternDriverColumns,
    connectors: connectorColumns,
    microboards: microboardColumns,
    "level-converters": levelConverterColumns,
    adapters: adapterColumns,
    "drive-libraries": driveLibraryColumns,
    "pixel-decoders": pixelDecoderColumns,
    "diffusive-materials": diffusiveMaterialColumns,
    "commercial-systems": commercialSystemColumns,
  };

  return columnMap[categoryId] || [{ key: "name", label: "Name" }];
}

// Search keys for each category
export function getSearchKeysForCategory(categoryId: string): string[] {
  const searchKeyMap: Record<string, string[]> = {
    controllers: ["name", "manufacturer", "notes"],
    pixels: ["name", "manufacturer", "notes"],
    "pixel-ics": ["name", "notes"],
    "pattern-drivers": ["name", "developer", "notes"],
    connectors: ["name", "manufacturer", "notes"],
    microboards: ["name", "manufacturer", "soc"],
    "level-converters": ["name", "manufacturer", "notes"],
    adapters: ["name", "manufacturer", "notes"],
    "drive-libraries": ["name", "developer", "hardware"],
    "pixel-decoders": ["name", "manufacturer", "notes"],
    "diffusive-materials": ["name", "material_type", "notes"],
    "commercial-systems": ["name", "manufacturer", "notes"],
  };

  return searchKeyMap[categoryId] || ["name"];
}
