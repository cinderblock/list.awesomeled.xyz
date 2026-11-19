import { Link } from 'react-router';
import type { LinkItem, LinkRow } from '~/lib/relations';
import { CATEGORIES } from '~/lib/types';

// Rows longer than this collapse the rest behind a tap-to-expand "+N more"
const COLLAPSE_AFTER = 24;

const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]));

/**
 * One link to another entry, colored by the TARGET's category so a row that
 * mixes pixels and pixel ICs (or controllers and adapters) reads at a glance.
 * Everything a reader might need is visible inline — the name as the source
 * listed it ("as WS2812B") and any notes — never hidden behind a hover.
 */
export function EntryLinkPill({ item }: { item: LinkItem }) {
  const category = item.category ? categoryById.get(item.category) : undefined;
  const style = category
    ? ({ '--category-hue': category.color.hue } as React.CSSProperties)
    : undefined;

  let pill: React.ReactNode;
  if (item.category && item.id) {
    pill = (
      <Link
        className="entry-related-link category-theme"
        style={style}
        to={`/${item.category}/${item.id}`}
      >
        {item.name}
      </Link>
    );
  } else if (item.url) {
    pill = (
      <a className="entry-related-link" href={item.url} target="_blank" rel="noopener noreferrer">
        {item.name}
      </a>
    );
  } else {
    pill = <span className="entry-related-link entry-related-link--plain">{item.name}</span>;
  }

  const extra = [item.via ? `as ${item.via}` : null, item.notes].filter(Boolean).join(' — ');
  if (!extra) return pill;
  return (
    <span className="entry-related-item">
      {pill}
      <span className="entry-related-note">{extra}</span>
    </span>
  );
}

function Pills({ items }: { items: LinkItem[] }) {
  const head = items.slice(0, COLLAPSE_AFTER);
  const rest = items.slice(COLLAPSE_AFTER);
  return (
    <div className="entry-related">
      {head.map((item, i) => (
        <EntryLinkPill key={i} item={item} />
      ))}
      {rest.length > 0 && (
        <details className="entry-related-more">
          <summary>+{rest.length} more</summary>
          <div className="entry-related">
            {rest.map((item, i) => (
              <EntryLinkPill key={i} item={item} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/**
 * A row's items, split into labeled sub-groups when they span categories
 * ("Driven by: Controllers … / Adapters …").
 */
function RowItems({ items }: { items: LinkItem[] }) {
  const groups = new Map<string, LinkItem[]>();
  for (const item of items) {
    const key = item.category ?? '';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  if (groups.size <= 1) return <Pills items={items} />;
  return (
    <div className="entry-related-groups">
      {[...groups].map(([category, list]) => (
        <div key={category} className="entry-related-group">
          <span className="entry-related-group-label">
            {categoryById.get(category)?.name ?? 'Other'}
          </span>
          <Pills items={list} />
        </div>
      ))}
    </div>
  );
}

/** Labeled link rows for an entry page section ("Works with", "Related products") */
export function EntryLinkRows({ rows }: { rows: LinkRow[] }) {
  return (
    <dl className="detail-grid detail-grid--links">
      {rows.map((row) => (
        <div key={`${row.direction}:${row.label}`} className="detail-row">
          <dt className="detail-key">{row.label}</dt>
          <dd className="detail-value">
            <RowItems items={row.items} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A name-list field (e.g. `outputs.protocols`) rendered in place: names that
 * resolve to entries become links, the rest stay plain text. One name can
 * resolve to several entries (GS8208 is both a pixel and a pixel IC); each
 * gets its own link, labeled with its category.
 */
export function NameLinkList({
  names,
  links,
}: {
  names: string[];
  links: Record<string, LinkItem[]>;
}) {
  return (
    <div className="entry-related">
      {names.map((name, i) => {
        const targets = links[name] ?? [];
        if (targets.length === 0) {
          return (
            <span key={i} className="entry-related-link entry-related-link--plain">
              {name}
            </span>
          );
        }
        return targets.map((t, j) => (
          <EntryLinkPill
            key={`${i}-${j}`}
            item={{
              ...t,
              name:
                targets.length > 1
                  ? `${name} (${categoryById.get(t.category ?? '')?.name ?? t.category})`
                  : name,
              via: undefined,
            }}
          />
        ));
      })}
    </div>
  );
}
