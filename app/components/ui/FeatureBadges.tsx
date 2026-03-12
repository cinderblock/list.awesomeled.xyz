import { CheckCircle, AlertTriangle, Wifi, Cpu, Network } from 'lucide-react';
import { Link } from 'react-router';

// Expandable icon badge system for common terms/technologies
// Each badge shows an icon with a tooltip for the full meaning

interface BadgeConfig {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  color: string;
}

// Map of terms to badge configurations
// Keys should be lowercase for matching
const BADGES: Record<string, BadgeConfig> = {
  // Status
  active: {
    icon: CheckCircle,
    label: 'Active',
    color: '#22c55e', // green
  },
  deprecated: {
    icon: AlertTriangle,
    label: 'Deprecated',
    color: '#f59e0b', // amber
  },
  // Protocols
  artnet: {
    icon: Network,
    label: 'Art-Net',
    color: '#8b5cf6', // purple
  },
  'e1.31': {
    icon: Network,
    label: 'E1.31 (sACN)',
    color: '#8b5cf6',
  },
  sacn: {
    icon: Network,
    label: 'sACN',
    color: '#8b5cf6',
  },
  // Connectivity
  wifi: {
    icon: Wifi,
    label: 'WiFi',
    color: '#3b82f6', // blue
  },
  ethernet: {
    icon: Network,
    label: 'Ethernet',
    color: '#3b82f6',
  },
  // Chips/Platforms
  esp32: {
    icon: Cpu,
    label: 'ESP32',
    color: '#ef4444', // red
  },
  esp8266: {
    icon: Cpu,
    label: 'ESP8266',
    color: '#ef4444',
  },
  arm: {
    icon: Cpu,
    label: 'ARM',
    color: '#06b6d4', // cyan
  },
  rp2040: {
    icon: Cpu,
    label: 'RP2040',
    color: '#ec4899', // pink
  },
};

interface FeatureBadgesProps {
  entry: Record<string, unknown>;
}

// Check if a value contains a badge term
function findBadgesInValue(value: unknown, found: Set<string>): void {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    for (const term of Object.keys(BADGES)) {
      if (lower.includes(term) && !found.has(term)) {
        found.add(term);
      }
    }
  } else if (Array.isArray(value)) {
    for (const item of value) {
      findBadgesInValue(item, found);
    }
  }
}

// Get all applicable badges for an entry by scanning all fields
function getBadgesForEntry(entry: Record<string, unknown>): BadgeConfig[] {
  const found = new Set<string>();

  for (const value of Object.values(entry)) {
    findBadgesInValue(value, found);
  }

  return Array.from(found).map((term) => BADGES[term]);
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
      <Link to={to} title={badge.label} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <span title={badge.label} style={style}>
      {content}
    </span>
  );
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
      <Link to={to} title={text} style={{ ...style, color: 'var(--category-primary)' }}>
        {text}
      </Link>
    );
  }

  return <span style={style}>{text}</span>;
}

// Get badge for a single string value (exact match)
export function getBadgeForValue(value: string): BadgeConfig | null {
  const lower = value.toLowerCase();
  return BADGES[lower] || null;
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
