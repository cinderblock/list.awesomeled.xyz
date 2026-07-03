import type { Route } from './+types/entry';
import { data, Link, useNavigate } from 'react-router';
import {
  getCategoryById,
  loadEntry,
  loadCategoryData,
  getReverseLinks,
  resolveRelated,
  getRelatedBacklinks,
} from '~/lib/data';
import { LocalDate } from '~/components/ui/LocalDate';
import { getColumnsForCategory } from '~/lib/columns';
import { parsePrice, formatPriceText } from '~/lib/currency';
import {
  FileText,
  ShoppingCart,
  Youtube,
  Globe,
  Github,
  X,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  parseFilters,
  getFilterDescription,
  FILTER_STORAGE_KEY,
} from '~/components/data/DataTable';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { PageWrapper } from '~/components/layout/PageWrapper';
import { FeatureBadges, ValueBadges } from '~/components/ui/FeatureBadges';
import { Tooltip } from '~/components/ui/Tooltip';

// Escape special chars for filter URL values (matches DataTable format)
function escapeFilterValue(val: string): string {
  return val.replace(/([|:,~!-])/g, '\\$1');
}

// Get filterable fields for a category (fields with select or boolean filterConfig)
function getFilterableFields(categoryId: string): Set<string> {
  const columns = getColumnsForCategory(categoryId);
  const filterable = new Set<string>();
  for (const col of columns) {
    if (col.filterConfig?.type === 'select' || col.filterConfig?.type === 'boolean') {
      // Both the full dotted key and its leaf are useful for matching
      filterable.add(col.key);
      filterable.add(col.key.split('.').pop()!);
    }
  }
  return filterable;
}

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData) {
    return [{ title: 'Not Found - Awesome LED List' }];
  }
  return [
    { title: `${loaderData.entry.name} - ${loaderData.category.name} - Awesome LED List` },
    { name: 'description', content: `Details about ${loaderData.entry.name}` },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const category = getCategoryById(params.category);
  if (!category) throw data(null, { status: 404 });
  const entry = loadEntry(params.category, params.entry);
  if (!entry) throw data(null, { status: 404 });
  const reverseLinks = getReverseLinks(params.category, params.entry);
  const relatedProducts = resolveRelated(entry);
  const relatedBacklinks = getRelatedBacklinks(params.category, params.entry);
  // Siblings (name order) for j/k prev/next navigation and its hint
  const siblings = loadCategoryData(params.category).map((e) => ({
    id: String(e.id),
    name: e.name,
  }));
  // Bare-slug connector refs (outputs.connector.ref) resolve to display names
  // at build time so the page can render them as links
  const refSlugs = new Set<string>();
  collectConnectorRefs(entry, refSlugs);
  const connectorNames: Record<string, string> = {};
  if (refSlugs.size > 0) {
    for (const c of loadCategoryData('connectors')) {
      if (refSlugs.has(String(c.id))) connectorNames[String(c.id)] = c.name;
    }
  }
  return {
    category,
    entry,
    reverseLinks,
    relatedProducts,
    relatedBacklinks,
    siblings,
    connectorNames,
  };
}

function collectConnectorRefs(value: unknown, out: Set<string>): void {
  if (!value || typeof value !== 'object') return;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (k === 'connector' && v && typeof v === 'object') {
      const ref = (v as Record<string, unknown>).ref;
      if (typeof ref === 'string') out.add(ref);
    }
    collectConnectorRefs(v, out);
  }
}

interface EntryImage {
  file: string;
  source?: string;
  credit?: string;
}

// Images are bare filename strings or {file, source?, credit?, license?}
// objects (see common.json#/definitions/image).
function getEntryImages(entry: Record<string, unknown>): EntryImage[] {
  const images: EntryImage[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string') {
      images.push({ file: v });
    } else if (v && typeof v === 'object' && typeof (v as EntryImage).file === 'string') {
      const { file, source, credit } = v as EntryImage;
      images.push({ file, source, credit });
    }
  };
  push(entry.image);
  if (Array.isArray(entry.images)) for (const img of entry.images) push(img);
  return images;
}

function stripSchemaAndWww(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

interface EntryLink {
  url: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  /** Set when the original URL is dead and `url` points at an archived copy */
  deadOriginal?: string;
}

// One item of an entry's `dead_links` array (common.json#/definitions/dead_links)
interface DeadLink {
  url: string;
  archive?: string;
  notes?: string;
}

// Newest Wayback Machine capture (their server redirects to it)
function waybackUrl(url: string): string {
  return `https://web.archive.org/web/${url}`;
}

function getDeadLinks(entry: Record<string, unknown>): Map<string, DeadLink> {
  const map = new Map<string, DeadLink>();
  if (Array.isArray(entry.dead_links)) {
    for (const item of entry.dead_links) {
      if (item && typeof item === 'object' && typeof (item as DeadLink).url === 'string') {
        map.set((item as DeadLink).url, item as DeadLink);
      }
    }
  }
  return map;
}

// Collect external links from the rich nested schema (links.*, creator.page,
// datasheet.url) plus any legacy top-level url / *_url fields. Links listed in
// `dead_links` are swapped for their archived copies.
function getEntryLinks(
  entry: Record<string, unknown>,
  deadLinks: Map<string, DeadLink>
): EntryLink[] {
  const out: EntryLink[] = [];
  const seen = new Set<string>();
  const add = (url: unknown, label: string, icon: EntryLink['icon']) => {
    if (typeof url !== 'string' || !url.startsWith('http') || seen.has(url)) return;
    seen.add(url);
    const dead = deadLinks.get(url);
    if (dead) {
      out.push({
        url: dead.archive ?? waybackUrl(url),
        label: `${label} (archived)`,
        icon: Archive,
        deadOriginal: url,
      });
    } else {
      out.push({ url, label, icon });
    }
  };

  const creator = entry.creator as { page?: string; url?: string } | undefined;
  if (creator && typeof creator === 'object') {
    add(creator.page, 'Product page', Globe);
    add(creator.url, stripSchemaAndWww(creator.url ?? ''), Globe);
  }
  const links = entry.links as Record<string, string> | undefined;
  if (links && typeof links === 'object') {
    add(links.product, 'Product page', Globe);
    add(links.url, 'Website', Globe);
    add(links.repo, 'Repository', Github);
    add(links.youtube, 'YouTube', Youtube);
    add(links.digikey, 'DigiKey', ShoppingCart);
    add(links.mouser, 'Mouser', ShoppingCart);
    add(links.mirror, 'Mirror', Globe);
  }
  const datasheet = entry.datasheet as
    | { url?: string; sources?: { url?: string; host?: string; notes?: string }[] }
    | undefined;
  if (datasheet && typeof datasheet === 'object') {
    add(datasheet.url, 'Datasheet', FileText);
    if (Array.isArray(datasheet.sources)) {
      for (const s of datasheet.sources) {
        if (s && typeof s === 'object') {
          add(s.url, `Datasheet (${s.host ?? 'alt'})`, FileText);
        }
      }
    }
  }

  // Legacy / flat fallbacks
  add(entry.url, 'Website', Globe);
  add(entry.datasheet_url, 'Datasheet', FileText);
  add(entry.youtube_url, 'YouTube', Youtube);
  return out;
}

// Nicer section titles for known nested groups (fallback: humanize the key)
const SECTION_LABELS: Record<string, string> = {
  data: 'Data & Protocol',
  color: 'Color & Brightness',
  electrical: 'Electrical',
  physical: 'Physical',
  inputs: 'Inputs',
  outputs: 'Outputs',
  power: 'Power',
  compute: 'Compute',
  connectivity: 'Connectivity',
  io: 'I/O',
  ratings: 'Ratings',
  mechanical: 'Mechanical',
  termination: 'Termination',
  wiring: 'Wiring',
  pricing: 'Pricing',
  capabilities: 'Capabilities',
  specs: 'Specifications',
  optical: 'Optical',
  datasheet: 'Datasheet',
  technical_notes: 'Technical Notes',
  datasheet_discrepancies: 'Datasheet Discrepancies',
  related_pixel_ics: 'Related Pixel ICs',
  related_connectors: 'Related Connectors',
  related_microboards: 'Related Microboards',
  related_adapters: 'Related Adapters',
};

// Preferred section order; unknown groups are appended after.
const SECTION_ORDER = [
  'inputs',
  'outputs',
  'power',
  'data',
  'color',
  'electrical',
  'compute',
  'connectivity',
  'io',
  'ratings',
  'mechanical',
  'termination',
  'wiring',
  'optical',
  'capabilities',
  'specs',
  'pricing',
  'datasheet',
];

// related_<x> field -> target category id
const RELATED_MAP: Record<string, string> = {
  related_pixel_ics: 'pixel-ics',
  related_connectors: 'connectors',
  related_microboards: 'microboards',
  related_adapters: 'adapters',
};

// `related[].type` -> row label, from the declaring entry's point of view…
const RELATED_FORWARD_LABELS: Record<string, string> = {
  replacement: 'Replaced by',
  predecessor: 'Preceded by',
  variant: 'Variants',
  accessory: 'Accessories',
  related: 'Related',
};
// …and from the pointed-at entry's point of view (derived reverse direction).
const RELATED_REVERSE_LABELS: Record<string, string> = {
  replacement: 'Replaces',
  predecessor: 'Succeeded by',
  variant: 'Variants',
  accessory: 'Accessory for',
  related: 'Related',
};

interface RelatedRow {
  name: string;
  to?: string;
  url?: string;
  notes?: string;
}

// Keys handled specially (not rendered as Overview rows or group cards)
const SKIP_KEYS = new Set([
  'id',
  'name',
  'image',
  'images',
  'updated',
  'creator',
  'status',
  'links',
  'related', // rendered as the Related Products section
  'dead_links', // applied to the links they describe, plus a hero callout
]);

function humanize(key: string): string {
  return SECTION_LABELS[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function isGroup(v: unknown): v is Record<string, unknown> {
  return (
    v != null &&
    typeof v === 'object' &&
    !Array.isArray(v) &&
    !(v instanceof Date) &&
    Object.keys(v).length > 0
  );
}

const emptySubscribe = () => () => {};

export default function EntryPage({ loaderData }: Route.ComponentProps) {
  const { category, entry, reverseLinks, relatedProducts, relatedBacklinks, siblings } = loaderData;
  const connectorNames = loaderData.connectorNames ?? {};
  const filterableFields = getFilterableFields(category.id);
  const images = getEntryImages(entry);
  const deadLinks = getDeadLinks(entry);
  const links = getEntryLinks(entry, deadLinks);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const navigate = useNavigate();

  // The order the category table last showed (sessionStorage handoff — the
  // user's active filters + sort); '' on the server / for deep links, which
  // falls back to name order below.
  const storedOrderRaw = useSyncExternalStore(
    emptySubscribe,
    () => {
      try {
        return sessionStorage.getItem(`entry-order:${category.id}`) ?? '';
      } catch {
        return '';
      }
    },
    () => ''
  );
  let order: string[] = siblings.map((s) => s.id);
  try {
    const stored = JSON.parse(storedOrderRaw || 'null');
    if (Array.isArray(stored) && stored.includes(entry.id)) order = stored.map(String);
  } catch {
    // fall back to name order
  }
  const orderIndex = order.indexOf(String(entry.id));
  const nameOf = (id: string | undefined) => siblings.find((s) => s.id === id)?.name;
  const prevEntry = orderIndex > 0 ? { id: order[orderIndex - 1] } : null;
  const nextEntry = orderIndex >= 0 ? { id: order[orderIndex + 1] } : null;

  // The category's saved filters (what the table restores when you go back)
  const savedFiltersRaw = useSyncExternalStore(
    emptySubscribe,
    () => {
      try {
        return localStorage.getItem(FILTER_STORAGE_KEY + category.id) ?? '';
      } catch {
        return '';
      }
    },
    () => ''
  );
  const filterChips: { key: string; text: string }[] = [];
  try {
    const saved = JSON.parse(savedFiltersRaw || 'null') as { f?: string; q?: string } | null;
    if (saved?.q) filterChips.push({ key: 'q', text: `search: "${saved.q}"` });
    if (saved?.f) {
      const columns = getColumnsForCategory(category.id);
      for (const [key, value] of Object.entries(parseFilters(saved.f))) {
        const label = columns.find((c) => c.key === key)?.label ?? key;
        filterChips.push({ key, text: `${label}: ${getFilterDescription(value)}` });
      }
    }
  } catch {
    // no saved filters
  }

  // j/k: previous/next entry without going back up to the table.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key !== 'j' && e.key !== 'k') return;
      const t = e.target as HTMLElement;
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        t.isContentEditable
      ) {
        return;
      }
      const target = e.key === 'j' ? nextEntry?.id : prevEntry?.id;
      if (target) {
        e.preventDefault();
        navigate(`${category.path}/${target}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prevEntry?.id, nextEntry?.id, category.path, navigate]);

  const status = typeof entry.status === 'string' ? entry.status : null;

  // Partition the entry into overview scalars, group cards, notes, and related links
  const overview: [string, unknown][] = [];
  const groups: [string, Record<string, unknown>][] = [];
  const related: [string, string[]][] = [];
  let notes: string | null = null;
  const lists: [string, string[]][] = []; // technical_notes, datasheet_discrepancies
  let variants: Record<string, unknown>[] | null = null;

  for (const [key, value] of Object.entries(entry)) {
    if (SKIP_KEYS.has(key)) continue;
    if (key.endsWith('_url') || key === 'url') continue; // handled in links
    if (value == null) continue;

    if (key === 'notes' && typeof value === 'string') {
      notes = value;
      continue;
    }
    if (key === 'variants' && Array.isArray(value)) {
      variants = value as Record<string, unknown>[];
      continue;
    }
    if (key in RELATED_MAP && Array.isArray(value)) {
      related.push([key, value.map(String)]);
      continue;
    }
    if ((key === 'technical_notes' || key === 'datasheet_discrepancies') && Array.isArray(value)) {
      lists.push([humanize(key), value.map(String)]);
      continue;
    }
    if (isGroup(value)) {
      groups.push([key, value]);
      continue;
    }
    overview.push([key, value]);
  }

  groups.sort((a, b) => {
    const ai = SECTION_ORDER.indexOf(a[0]);
    const bi = SECTION_ORDER.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  // Group forward `related` items and derived backlinks into labeled rows
  const relatedRows = new Map<string, RelatedRow[]>();
  const addRelatedRow = (label: string, row: RelatedRow) => {
    if (!relatedRows.has(label)) relatedRows.set(label, []);
    relatedRows.get(label)!.push(row);
  };
  for (const item of relatedProducts) {
    addRelatedRow(RELATED_FORWARD_LABELS[item.type] ?? item.type, {
      name: item.name,
      to: item.category && item.id ? `/${item.category}/${item.id}` : undefined,
      url: item.url,
      notes: item.notes,
    });
  }
  for (const item of relatedBacklinks) {
    addRelatedRow(RELATED_REVERSE_LABELS[item.type] ?? item.type, {
      name: item.name,
      to: `/${item.category}/${item.id}`,
      notes: item.notes,
    });
  }

  return (
    <PageWrapper category={category}>
      <div className="entry-topbar">
        <Breadcrumb
          items={[
            { label: 'Home', path: '/' },
            { label: category.name, path: category.path },
            { label: entry.name },
          ]}
          categoryThemed
        />
        {filterChips.length > 0 && (
          <Tooltip content="Filters active on the category table — click to go back to the filtered list">
            <Link to={category.path} className="entry-filter-chips">
              {filterChips.map((chip) => (
                <span key={chip.key} className="entry-filter-chip">
                  {chip.text}
                </span>
              ))}
            </Link>
          </Tooltip>
        )}
        <span className="entry-topbar-spacer" />
        {(prevEntry || nextEntry) && (
          <span className="entry-nav-hint" aria-label="Previous / next entry (k / j)">
            <kbd>k</kbd>
            {prevEntry ? (
              <Link to={`${category.path}/${prevEntry.id}`}>‹ {nameOf(prevEntry.id)}</Link>
            ) : (
              <span className="entry-nav-hint-end">‹</span>
            )}
            <span className="entry-nav-hint-sep">·</span>
            {nextEntry ? (
              <Link to={`${category.path}/${nextEntry.id}`}>{nameOf(nextEntry.id)} ›</Link>
            ) : (
              <span className="entry-nav-hint-end">›</span>
            )}
            <kbd>j</kbd>
          </span>
        )}
        <Tooltip content="Last reviewed for accuracy">
          <span className="entry-updated">
            <LocalDate date={entry.updated as Date} />
          </span>
        </Tooltip>
      </div>

      <header className="entry-hero">
        {images.length > 0 && (
          <figure className="entry-hero-figure">
            <button
              className="entry-hero-image"
              onClick={() => setModalImage(`/database-images/${category.id}/${images[0].file}`)}
            >
              <img src={`/database-images/${category.id}/${images[0].file}`} alt={entry.name} />
            </button>
            <ImageCredit image={images[0]} />
          </figure>
        )}
        <div className="entry-hero-main">
          <div className="entry-title-row">
            <h1 className="page-title category-page-title">{entry.name}</h1>
            {status && <StatusBadge status={status} />}
          </div>
          {entry.creator ? (
            <CreatorLine
              creator={entry.creator}
              categoryPath={category.path}
              deadLinks={deadLinks}
            />
          ) : null}
          <FeatureBadges entry={entry} />
          {links.length > 0 && (
            <div className="entry-links">
              {links.map(({ url, label, icon: Icon, deadOriginal }) => (
                <Tooltip
                  key={url}
                  content={
                    deadOriginal
                      ? `Original link no longer works (${deadOriginal}) — showing an archived copy`
                      : stripSchemaAndWww(url)
                  }
                >
                  <a href={url} target="_blank" rel="noopener noreferrer" className="entry-link">
                    <Icon size={15} />
                    {label}
                  </a>
                </Tooltip>
              ))}
            </div>
          )}
          {deadLinks.size > 0 && (
            <p className="entry-dead-note">
              <AlertTriangle size={13} />
              {deadLinks.size === 1
                ? 'An original link for this entry no longer works'
                : 'Some original links for this entry no longer work'}
              {' — archived copies from the Wayback Machine are linked instead.'}
            </p>
          )}
        </div>
      </header>

      <div className="entry-sections">
        {overview.length > 0 && (
          <Section title="Overview">
            <KeyValueGrid
              entries={overview}
              categoryPath={category.path}
              filterableFields={filterableFields}
              connectorNames={connectorNames}
            />
          </Section>
        )}

        {groups.map(([key, group]) => (
          <Section key={key} title={humanize(key)}>
            <KeyValueGrid
              entries={Object.entries(group).filter(([, v]) => v != null)}
              categoryPath={category.path}
              filterableFields={filterableFields}
              connectorNames={connectorNames}
            />
          </Section>
        ))}

        {variants && variants.length > 0 && (
          <Section title="Variants" wide>
            <div className="entry-variants">
              {variants.map((v, i) => (
                <div key={i} className="entry-variant">
                  <strong>
                    {String(v.name ?? '')}
                    {v.suffix ? ` (${v.suffix})` : ''}
                  </strong>
                  {v.differences ? <span>{String(v.differences)}</span> : null}
                </div>
              ))}
            </div>
          </Section>
        )}

        {relatedRows.size > 0 && (
          <Section title="Related Products">
            <dl className="detail-grid">
              {[...relatedRows.entries()].map(([label, rows]) => (
                <div key={label} className="detail-row">
                  <dt className="detail-key">{label}</dt>
                  <dd className="detail-value">
                    <div className="entry-related">
                      {rows.map((row, i) => (
                        <Tooltip key={i} content={row.notes}>
                          {row.to ? (
                            <Link className="entry-related-link" to={row.to}>
                              {row.name}
                            </Link>
                          ) : row.url ? (
                            <a
                              className="entry-related-link"
                              href={row.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {row.name}
                            </a>
                          ) : (
                            <span className="entry-related-link">{row.name}</span>
                          )}
                        </Tooltip>
                      ))}
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        )}

        {related.map(([key, ids]) => (
          <Section key={key} title={humanize(key)}>
            <div className="entry-related">
              {ids.map((id) => (
                <Link key={id} className="entry-related-link" to={`/${RELATED_MAP[key]}/${id}`}>
                  {id}
                </Link>
              ))}
            </div>
          </Section>
        ))}

        {reverseLinks.map((group) => (
          <Section key={group.category} title={`Used by ${group.categoryName}`}>
            <div className="entry-related">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  className="entry-related-link"
                  to={`/${group.category}/${item.id}`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </Section>
        ))}

        {notes && (
          <Section title="Notes" wide>
            <p className="entry-notes">{notes}</p>
          </Section>
        )}

        {lists.map(([title, items]) => (
          <Section key={title} title={title} wide>
            <ul className="entry-tech-list">
              {items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </Section>
        ))}
      </div>

      {modalImage && (
        <div className="image-modal" onClick={() => setModalImage(null)}>
          <button
            className="image-modal-close"
            onClick={() => setModalImage(null)}
            aria-label="Close"
          >
            <X size={32} />
          </button>
          <img src={modalImage} alt={entry.name} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </PageWrapper>
  );
}

function Section({
  title,
  wide,
  children,
}: {
  title: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`detail-section${wide ? ' detail-section--wide' : ''}`}>
      <h2 className="detail-section-title">{title}</h2>
      {children}
    </section>
  );
}

function KeyValueGrid({
  entries,
  categoryPath,
  filterableFields,
  connectorNames = {},
}: {
  entries: [string, unknown][];
  categoryPath: string;
  filterableFields: Set<string>;
  connectorNames?: Record<string, string>;
}) {
  return (
    <dl className="detail-grid">
      {entries.map(([key, value]) => (
        <div key={key} className="detail-row">
          <dt className="detail-key">{key.replace(/_/g, ' ')}</dt>
          <dd className="detail-value">
            {formatValue(key, value, categoryPath, filterableFields, connectorNames)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Attribution line under the hero image: links to the original source when known
function ImageCredit({ image }: { image: EntryImage }) {
  if (!image.source && !image.credit) return null;
  const text = `Image: ${image.credit ?? stripSchemaAndWww(image.source ?? '').split('/')[0]}`;
  if (image.source) {
    return (
      <a
        className="entry-image-credit"
        href={image.source}
        target="_blank"
        rel="noopener noreferrer"
      >
        {text}
      </a>
    );
  }
  return <span className="entry-image-credit">{text}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const variant =
    s === 'active'
      ? 'badge--success'
      : s === 'discontinued' || s === 'end-of-life'
        ? 'badge--secondary'
        : 'badge--outline';
  return (
    <span className={`badge ${variant}`} style={{ textTransform: 'capitalize' }}>
      {status}
    </span>
  );
}

function CreatorLine({
  creator,
  categoryPath,
  deadLinks,
}: {
  creator: unknown;
  categoryPath: string;
  deadLinks: Map<string, DeadLink>;
}) {
  if (creator && typeof creator === 'object') {
    const c = creator as { name?: string; url?: string; page?: string };
    let href = c.page || c.url;
    let deadNote: string | undefined;
    if (href && deadLinks.has(href)) {
      const dead = deadLinks.get(href)!;
      deadNote = `Original link no longer works (${href}) — showing an archived copy`;
      href = dead.archive ?? waybackUrl(href);
    }
    return (
      <p className="page-description">
        by{' '}
        {href ? (
          <Tooltip content={deadNote}>
            <a href={href} target="_blank" rel="noopener noreferrer" className="entry-creator-link">
              {c.name}
            </a>
          </Tooltip>
        ) : (
          c.name
        )}
      </p>
    );
  }
  return (
    <p className="page-description">
      by{' '}
      <Link
        className="entry-creator-link"
        to={`${categoryPath}?f=creator:${escapeFilterValue(creator as string)}`}
      >
        {creator as string}
      </Link>
    </p>
  );
}

function formatValue(
  key: string,
  value: unknown,
  categoryPath: string,
  filterableFields: Set<string>,
  connectorNames: Record<string, string> = {}
): React.ReactNode {
  if (value === null || value === undefined) return <span className="data-table-null">-</span>;

  if (Array.isArray(value)) {
    const hasObjects = value.some((v) => v && typeof v === 'object' && !(v instanceof Date));
    if (hasObjects) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {value.map((item, idx) => (
            <div key={idx}>
              {formatValue(key, item, categoryPath, filterableFields, connectorNames)}
            </div>
          ))}
        </div>
      );
    }
    const arrBadges = ValueBadges({ value, categoryPath, fieldKey: key });
    if (arrBadges) return arrBadges;
    if (filterableFields.has(key)) {
      return (
        <span>
          {value.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && ', '}
              <Link
                className="entry-value-link"
                to={`${categoryPath}?f=${key}:${escapeFilterValue(String(item))}`}
              >
                {String(item)}
              </Link>
            </span>
          ))}
        </span>
      );
    }
    return value.join(', ');
  }

  // Non-USD prices are {amount, currency} objects — render them as money,
  // not as a nested key/value grid
  if (key === 'price' && typeof value === 'object' && !Array.isArray(value)) {
    const parsed = parsePrice(value);
    if (parsed) return formatPriceText(parsed);
  }

  // Connector reference ({ref: <slug>, pins?, notes?}) → link into /connectors
  if (key === 'connector' && typeof value === 'object' && !(value instanceof Date)) {
    const { ref, pins, notes } = value as { ref?: unknown; pins?: unknown; notes?: unknown };
    if (typeof ref === 'string' && connectorNames[ref]) {
      return (
        <span>
          <Link className="entry-value-link" to={`/connectors/${ref}`}>
            {connectorNames[ref]}
          </Link>
          {typeof pins === 'number' ? `, ${pins}-pin` : ''}
          {typeof notes === 'string' ? ` (${notes})` : ''}
        </span>
      );
    }
  }

  // Nested sub-object (e.g. power.voltage {min,max}, protocols {...})
  if (typeof value === 'object' && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).filter((k) => obj[k] != null);
    if (keys.length === 0) return <span className="data-table-null">-</span>;
    return (
      <dl className="detail-subgrid">
        {keys.map((k) => (
          <div key={k} className="detail-row">
            <dt className="detail-key">{k.replace(/_/g, ' ')}</dt>
            <dd>{formatValue(k, obj[k], categoryPath, filterableFields, connectorNames)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  const badges = ValueBadges({ value, categoryPath, fieldKey: key });
  if (badges) return badges;

  if (typeof value === 'boolean') {
    if (filterableFields.has(key)) {
      return (
        <Link className="entry-value-link" to={`${categoryPath}?f=${key}:${value ? 'yes' : 'no'}`}>
          {value ? 'Yes' : 'No'}
        </Link>
      );
    }
    return value ? 'Yes' : 'No';
  }

  if (value instanceof Date) return <LocalDate date={value} />;

  const strValue = String(value);

  if (strValue.startsWith('http')) {
    return (
      <a
        href={strValue}
        target="_blank"
        rel="noopener noreferrer"
        className="entry-value-link"
        style={{ wordBreak: 'break-all' }}
      >
        {stripSchemaAndWww(strValue)}
      </a>
    );
  }

  if (filterableFields.has(key)) {
    return (
      <Link
        className="entry-value-link"
        to={`${categoryPath}?f=${key}:${escapeFilterValue(strValue)}`}
      >
        {strValue}
      </Link>
    );
  }

  return strValue;
}
