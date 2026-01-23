export interface CategoryColor {
  hue: number; // OKLCH hue value (0-360)
  name: string; // Human-readable color name
}

export interface Category {
  id: string;
  name: string;
  description: string;
  path: string;
  viewType: 'table' | 'tile' | 'both';
  color: CategoryColor;
}

// Rainbow colors distributed across 12 categories (30° apart on the color wheel)
export const CATEGORIES: Category[] = [
  {
    id: 'controllers',
    name: 'Controllers',
    description: 'Devices that generate pixel data signals',
    path: '/controllers',
    viewType: 'table',
    color: { hue: 0, name: 'red' },
  },
  {
    id: 'pixels',
    name: 'Pixels',
    description: 'Addressable LEDs with integrated ICs',
    path: '/pixels',
    viewType: 'both',
    color: { hue: 30, name: 'orange' },
  },
  {
    id: 'pixel-ics',
    name: 'Pixel ICs',
    description: 'Standalone LED driver chips',
    path: '/pixel-ics',
    viewType: 'table',
    color: { hue: 55, name: 'gold' },
  },
  {
    id: 'pattern-drivers',
    name: 'Pattern Drivers',
    description: 'Software for creating and sending LED patterns',
    path: '/pattern-drivers',
    viewType: 'table',
    color: { hue: 85, name: 'lime' },
  },
  {
    id: 'connectors',
    name: 'Connectors',
    description: 'Common connectors used in LED products',
    path: '/connectors',
    viewType: 'both',
    color: { hue: 145, name: 'green' },
  },
  {
    id: 'microboards',
    name: 'DIY MicroBoards',
    description: 'Microcontroller boards for driving pixels',
    path: '/microboards',
    viewType: 'table',
    color: { hue: 175, name: 'teal' },
  },
  {
    id: 'level-converters',
    name: 'Level Converters',
    description: 'Devices that translate signal levels',
    path: '/level-converters',
    viewType: 'table',
    color: { hue: 200, name: 'cyan' },
  },
  {
    id: 'adapters',
    name: 'Adapters',
    description: 'Hardware adapters for pixel systems',
    path: '/adapters',
    viewType: 'table',
    color: { hue: 230, name: 'blue' },
  },
  {
    id: 'drive-libraries',
    name: 'Drive Libraries',
    description: 'Software libraries for driving pixels',
    path: '/drive-libraries',
    viewType: 'table',
    color: { hue: 265, name: 'indigo' },
  },
  {
    id: 'pixel-decoders',
    name: 'Pixel Decoders',
    description: 'Devices that decode pixel protocols',
    path: '/pixel-decoders',
    viewType: 'table',
    color: { hue: 295, name: 'purple' },
  },
  {
    id: 'diffusive-materials',
    name: 'Diffusive Materials',
    description: 'Materials for diffusing LED light',
    path: '/diffusive-materials',
    viewType: 'both',
    color: { hue: 325, name: 'magenta' },
  },
  {
    id: 'commercial-systems',
    name: 'Commercial Systems',
    description: 'Complete commercial pixel systems',
    path: '/commercial-systems',
    viewType: 'table',
    color: { hue: 350, name: 'rose' },
  },
];

// Base entry interface that all category entries extend
export interface BaseEntry {
  id: string;
  name: string;
  [key: string]: unknown;
}

// Specific entry types for each category
export interface ControllerEntry extends BaseEntry {
  manufacturer?: string;
  max_pixels?: number;
  price?: number;
  max_outputs?: number;
  interfaces?: string[];
  storage?: string;
  standalone?: boolean;
  pixel_types?: string;
  max_voltage?: number;
  max_current?: string;
  buffered?: boolean;
  output_connectors?: string;
  outputs?: string;
  waterproof?: boolean;
  auxiliary_outputs?: string;
  wled_compatible?: boolean;
  notes?: string;
  warranty?: string;
  release_year?: number;
  status?: string;
  url?: string;
}

export interface PixelEntry extends BaseEntry {
  manufacturer?: string;
  color_order?: string;
  led_voltage?: string;
  vcc_voltage?: string;
  clocked?: boolean;
  data_bitrate?: string;
  package_size?: string;
  datasheet_url?: string;
}

export interface ConnectorEntry extends BaseEntry {
  manufacturer?: string;
  outline?: string;
  max_current?: string;
  max_voltage?: string;
  ip_rating?: string;
  locking?: string;
  url?: string;
  digikey_url?: string;
  mouser_url?: string;
}

// Generic category data type
export type CategoryEntry = BaseEntry;
