import { ExternalLink, StickyNote } from 'lucide-react';
import { Badge, getBadgeForValue, TextPill } from '~/components/ui/FeatureBadges';
import { MoreInfo } from '~/components/ui/MoreInfo';
import {
  enumLabel,
  fieldText,
  fieldValues,
  getPath,
  isEmptyValue,
  priceText,
  type FieldMeta,
} from '~/lib/fields';
import { splitQuantity } from '~/lib/units';

/** How many pills a table cell shows before folding the rest into "+n". */
const PILL_LIMIT = 4;

const Empty = () => <span className="data-table-null">-</span>;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="badge badge--success">Yes</span>
  ) : (
    <span className="badge badge--secondary">No</span>
  );
}

// "800kHz" → 800 + kHz; 24 (volts) → 24 + V. Free-form strings pass through.
function Quantity({ field, value }: { field: FieldMeta; value: unknown }) {
  let number: string;
  let unit: string;
  if (typeof value === 'number' && field.quantity) {
    const q = splitQuantity(value, field.quantity);
    number = q.value.toLocaleString('en-US');
    unit = q.unit;
  } else {
    const m = String(value).match(/^(~?[\d.,]+(?:-[\d.]+)?)\s*([A-Za-zµ]+)$/);
    if (!m) return <span>{String(value)}</span>;
    number = m[1].replace('-', '–');
    unit = m[2];
  }
  return (
    <span className="field-quantity">
      <span className="tabular-nums">{number}</span>
      <span className="field-unit">{unit}</span>
    </span>
  );
}

function Pill({ text }: { text: string }) {
  const badge = getBadgeForValue(text);
  return badge ? <Badge badge={badge} /> : <TextPill text={text} />;
}

function Pills({ values, limit }: { values: string[]; limit?: number }) {
  if (values.length === 0) return <Empty />;
  const shown = limit && values.length > limit ? values.slice(0, limit) : values;
  const hidden = values.length - shown.length;
  return (
    <div className="data-table-array">
      {shown.map((v, i) => (
        <Pill key={i} text={v} />
      ))}
      {hidden > 0 && (
        <MoreInfo label={`+${hidden}`} ariaLabel={`Show all ${values.length} values`}>
          <div className="more-info-pills">
            {values.map((v, i) => (
              <Pill key={i} text={v} />
            ))}
          </div>
        </MoreInfo>
      )}
    </div>
  );
}

// Long prose in a table cell: one clipped line, the whole text one tap away
function ClippedText({ text, items }: { text: string; items?: string[] }) {
  return (
    <span className="field-clip">
      <span className="field-clip-text">{text}</span>
      <MoreInfo label="more" ariaLabel="Show the full text" className="more-info--text">
        {items && items.length > 1 ? (
          <ul className="more-info-list">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="more-info-text">{items?.[0] ?? text}</p>
        )}
      </MoreInfo>
    </span>
  );
}

/** The footnote a `<field>_notes` sibling carries, as a tap-to-open mark. */
export function FieldNote({ field, item }: { field: FieldMeta; item: unknown }) {
  if (!field.notesKey) return null;
  const note = getPath(item, field.notesKey);
  if (typeof note !== 'string' || note.trim() === '') return null;
  return (
    <MoreInfo
      label={<StickyNote size={12} />}
      ariaLabel={`Note on ${field.label}`}
      className="more-info--note"
    >
      <p className="more-info-text">{note}</p>
    </MoreInfo>
  );
}

/**
 * Render one field's value by its kind. `compact` is the table-cell form
 * (pills fold, prose clips to a line); otherwise everything is shown.
 */
export function FieldValue({
  field,
  value,
  item,
  compact = false,
}: {
  field: FieldMeta;
  value: unknown;
  /** The entry, for the field's footnote */
  item?: unknown;
  compact?: boolean;
}) {
  const note = item != null ? <FieldNote field={field} item={item} /> : null;
  const body = renderBody(field, value, compact);
  if (!note) return body;
  return (
    <span className="field-with-note">
      {body}
      {note}
    </span>
  );
}

function renderBody(field: FieldMeta, value: unknown, compact: boolean): React.ReactNode {
  if (isEmptyValue(value)) return <Empty />;

  switch (field.kind) {
    case 'boolean':
      return typeof value === 'boolean' ? <YesNo value={value} /> : <span>{String(value)}</span>;

    case 'enum': {
      if (typeof value === 'boolean') return <YesNo value={value} />;
      const label = enumLabel(value);
      const badge = getBadgeForValue(label);
      return badge ? <Badge badge={badge} /> : <span>{label}</span>;
    }

    case 'tags':
    case 'keys':
      return <Pills values={fieldValues(field, value)} limit={compact ? PILL_LIMIT : undefined} />;

    case 'number':
      return typeof value === 'number' ? (
        <span className="tabular-nums">{value.toLocaleString('en-US')}</span>
      ) : (
        <span>{String(value)}</span>
      );

    case 'year':
      return <span className="tabular-nums">{String(value)}</span>;

    case 'quantity':
      return <Quantity field={field} value={value} />;

    case 'price': {
      const text = priceText(value);
      return text ? <span className="tabular-nums">{text}</span> : <Empty />;
    }

    case 'url': {
      const url = String(value);
      if (!/^https?:\/\//.test(url)) return <span>{url}</span>;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="data-table-external-link"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={13} />
          {hostOf(url)}
        </a>
      );
    }

    case 'textlist': {
      const items = (Array.isArray(value) ? value : [value]).map(String);
      if (!compact) {
        return (
          <ul className="field-list">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      }
      const summary = items.length > 1 ? `${items[0]} (+${items.length - 1})` : items[0];
      return <ClippedText text={summary} items={items} />;
    }

    case 'text': {
      const text = fieldText(field, value);
      return compact && field.long ? <ClippedText text={text} /> : <span>{text}</span>;
    }

    case 'entity':
    default:
      return <span>{fieldText(field, value)}</span>;
  }
}
