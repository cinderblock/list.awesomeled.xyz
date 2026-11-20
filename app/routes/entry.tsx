import type { Route } from './+types/entry';
import { data, Link, useNavigate } from 'react-router';
import { getCategoryById, loadEntry, loadCategoryData, getRelationGraph } from '~/lib/data';
import { fieldNames, linksForEntry, inlineNameLinks, type InlineNameLinks } from '~/lib/relations';
import { LocalDate } from '~/components/ui/LocalDate';
import { getColumnsForCategory } from '~/lib/columns';
import { parsePrice, formatPriceText } from '~/lib/currency';
import { getPriceSource, isPriceSource } from '~/lib/price-source';
import { PriceAsOf, PriceDetail } from '~/components/data/PriceSource';
import {
  FileText,
  ShoppingCart,
  Youtube,
  Globe,
  Github,
  Archive,
  AlertTriangle,
  Link2,
  PencilRuler,
} from 'lucide-react';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { parseFilters, getFilterDescription, FILTER_STORAGE_KEY } from '~/lib/table-state';
import { CompareButton } from '~/components/compare/CompareTray';
import { designerHref } from '~/lib/designer/links';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { PageWrapper } from '~/components/layout/PageWrapper';
import { FeatureBadges, ValueBadges } from '~/components/ui/FeatureBadges';
import { Tooltip } from '~/components/ui/Tooltip';
import {
  EntryLinkRows,
  NameLinkList,
  FieldSources,
  type FieldSource,
} from '~/components/ui/EntryLinks';
import { entryImages, imageUrl, licenseUrl, type EntryImage } from '~/lib/images';
import { CopyLinkButton, EntryContribute } from '~/components/entry/EntryActions';
import { ImageViewer } from '~/components/entry/ImageViewer';
import { pageMeta } from '~/lib/meta';
import { entrySeo } from '~/lib/seo.server';
import { LinkRecord, UrlText } from '~/components/entry/LinkRecord';
import { asLinkRecord } from '~/lib/url-label';

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
  const { category, entry, seo } = loaderData;
  return pageMeta({
    title: `${entry.name} - ${category.name}`,
    description: seo.description,
    path: `${category.path}/${entry.id}`,
    image: seo.image,
    imageAlt: `${entry.name}: ${category.name} on the Awesome LED List`,
    jsonLd: seo.jsonLd,
  });
}

export async function loader({ params }: Route.LoaderArgs) {
  const category = getCategoryById(params.category);
  if (!category) throw data(null, { status: 404 });
  const entry = loadEntry(params.category, params.entry);
  if (!entry) throw data(null, { status: 404 });
  // Cross-category links (relations.ts): everything that points here or that
  // this entry's `related` declares, plus its own name-list fields resolved to
  // entries so they render as links in place.
  const graph = getRelationGraph();
  const links = linksForEntry(graph, `${params.category}/${params.entry}`, entry);
  const nameLinks = inlineNameLinks(graph, params.category, entry);
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
  for (const slug of refSlugs) {
    const name = graph.names.get(`connectors/${slug}`);
    if (name) connectorNames[slug] = name;
  }
  return {
    category,
    entry,
    links,
    nameLinks,
    siblings,
    connectorNames,
    // Parts the System Designer can use get a link that starts a design with them
    designer: designerHref(params.category, entry, graph),
    // Description, preview image and structured data for the page's <head>
    seo: entrySeo(category, entry),
  };
}

// A URL for an entry that does not exist has no prerendered data file; the
// static host answers the request for it with a 404. Going through a client
// loader turns that into a proper not-found response (the root error boundary
// then suggests the closest entries) instead of a generic loader failure.
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  return serverLoader();
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

function stripSchemaAndWww(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

interface EntryLink {
  url: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  /** Set when the original URL is dead and `url` points at an archived copy */
  deadOriginal?: string;
  /** Extra tooltip text, e.g. a datasheet source's notes */
  note?: string;
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
  const add = (url: unknown, label: string, icon: EntryLink['icon'], note?: string) => {
    if (typeof url !== 'string' || !url.startsWith('http') || seen.has(url)) return;
    seen.add(url);
    const dead = deadLinks.get(url);
    if (dead) {
      out.push({
        url: dead.archive ?? waybackUrl(url),
        label: `${label} (archived)`,
        icon: Archive,
        deadOriginal: url,
        note,
      });
    } else {
      out.push({ url, label, icon, note });
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
    | {
        url?: string;
        mirror?: { url?: string; retrieved?: string };
        sources?: { url?: string; host?: string; notes?: string }[];
      }
    | undefined;
  if (datasheet && typeof datasheet === 'object') {
    // Our R2 copy (scripts/mirror-datasheets.ts). When the original is dead,
    // it replaces the Wayback guess, unless an explicit archive was curated.
    const mirror = typeof datasheet.mirror?.url === 'string' ? datasheet.mirror.url : undefined;
    const mirrorNote = datasheet.mirror?.retrieved
      ? `Our copy, retrieved ${datasheet.mirror.retrieved}`
      : 'Our copy';
    const dead = typeof datasheet.url === 'string' ? deadLinks.get(datasheet.url) : undefined;
    if (dead && mirror && !dead.archive && !seen.has(dead.url)) {
      seen.add(dead.url);
      seen.add(mirror);
      out.push({
        url: mirror,
        label: 'Datasheet (archived)',
        icon: Archive,
        deadOriginal: dead.url,
        note: mirrorNote,
      });
    } else {
      add(datasheet.url, 'Datasheet', FileText);
      add(mirror, 'Datasheet (mirror)', FileText, mirrorNote);
    }
    if (Array.isArray(datasheet.sources)) {
      for (const s of datasheet.sources) {
        if (s && typeof s === 'object') {
          add(s.url, `Datasheet (${s.host ?? 'alt'})`, FileText, s.notes);
        }
      }
    }
  }

  // Other pages about the product (protocol write-ups, series overviews,
  // old product pages), labelled by site
  if (Array.isArray(entry.other_links)) {
    for (const url of entry.other_links) {
      if (typeof url === 'string') add(url, stripSchemaAndWww(url).split('/')[0], Link2);
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
  'related', // rendered as the Works with / Related products sections
  'dead_links', // applied to the links they describe, plus a hero callout
  'other_links', // shown with the other external links
  'price_source', // shown as the "as of" line under the price
  'sources', // shown under each field it documents
  'linked', // derived compatibility summary, shown in Works with
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
  const { category, entry, links: entryLinks, siblings } = loaderData;
  const connectorNames = loaderData.connectorNames ?? {};
  const nameLinks = loaderData.nameLinks ?? {};
  // Per-field provenance (common.json#/definitions/sources)
  const fieldSources = (
    entry.sources && typeof entry.sources === 'object' ? entry.sources : {}
  ) as Record<string, FieldSource | FieldSource[]>;
  const filterableFields = getFilterableFields(category.id);
  const images = entryImages(entry);
  const [activeImage, setActiveImage] = useState(0);
  const hero = images[Math.min(activeImage, images.length - 1)];
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
    // Price in any shape (number, {amount, currency}, tiers) is one Overview
    // row with its provenance line, never a group card
    if (key === 'price') {
      overview.push([key, value]);
      continue;
    }
    if (key === 'variants' && Array.isArray(value)) {
      variants = value as Record<string, unknown>[];
      continue;
    }
    if ((key === 'technical_notes' || key === 'datasheet_discrepancies') && Array.isArray(value)) {
      lists.push([humanize(key), value.map(String)]);
      continue;
    }
    if (isGroup(value)) {
      // The datasheet, its mirror and its alternate hosts are all in the links
      // bar (source notes in their tooltips). As raw URLs and nested grids in a
      // narrow card they were noise; the card keeps the rest.
      if (key === 'datasheet') {
        const rest = Object.fromEntries(
          Object.entries(value).filter(([k]) => !['url', 'mirror', 'sources'].includes(k))
        );
        if (isGroup(rest)) groups.push([key, rest]);
        continue;
      }
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
        {/* Last commit that reviewed this entry's facts (data.ts IGNORED_COMMITS
            excludes bulk reshaping); links to the file's history */}
        <a
          className="entry-updated"
          href={`https://github.com/cinderblock/list.awesomeled.xyz/commits/master/database/${category.id}/${entry.id}.yaml`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Reviewed <LocalDate date={entry.updated as Date} />
        </a>
      </div>

      <header className="entry-hero">
        {hero && (
          <figure className="entry-hero-figure">
            <button
              type="button"
              className="entry-hero-image"
              onClick={() => setModalImage(imageUrl(category.id, hero.file))}
              aria-label={`Enlarge image of ${entry.name}`}
            >
              <img src={imageUrl(category.id, hero.file, 'md')} alt={entry.name} />
            </button>
            {images.length > 1 && (
              <div className="entry-hero-thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.file}
                    type="button"
                    className={img === hero ? 'entry-hero-thumb--active' : undefined}
                    onClick={() => setActiveImage(i)}
                    aria-label={`Show image ${i + 1} of ${images.length}`}
                  >
                    <img src={imageUrl(category.id, img.file, 'sm')} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            <ImageCredit image={hero} />
          </figure>
        )}
        <div className="entry-hero-main">
          <div className="entry-title-row">
            <h1 className="page-title category-page-title">{entry.name}</h1>
            {status && <StatusBadge status={status} />}
            <CompareButton categoryId={category.id} entryId={String(entry.id)} name={entry.name} />
            {loaderData.designer && (
              <Link className="btn btn--outline btn--sm" to={loaderData.designer}>
                <PencilRuler size={14} aria-hidden="true" /> Use in the designer
              </Link>
            )}
            <CopyLinkButton path={`${category.path}/${entry.id}`} />
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
              {links.map(({ url, label, icon: Icon, deadOriginal, note }) => (
                <Tooltip
                  key={url}
                  content={[
                    deadOriginal
                      ? `Original link no longer works (${deadOriginal}) — showing an archived copy`
                      : stripSchemaAndWww(url),
                    note,
                  ]
                    .filter(Boolean)
                    .join('. ')}
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
              priceSource={getPriceSource(entry)}
              nameLinks={nameLinks}
              sources={fieldSources}
              status={status}
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
              nameLinks={nameLinks}
              sources={fieldSources}
              pathPrefix={key}
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

        {entryLinks.worksWith.length > 0 && (
          <Section title="Works with" wide>
            <EntryLinkRows rows={entryLinks.worksWith} />
          </Section>
        )}

        {entryLinks.family.length > 0 && (
          <Section title="Related products" wide>
            <EntryLinkRows rows={entryLinks.family} />
          </Section>
        )}

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

      <EntryContribute
        categoryId={category.id}
        entryId={String(entry.id)}
        name={entry.name}
        path={`${category.path}/${entry.id}`}
      />

      <ImageViewer src={modalImage} alt={entry.name} onClose={() => setModalImage(null)} />
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
  priceSource,
  nameLinks = {},
  sources = {},
  pathPrefix,
  status,
}: {
  entries: [string, unknown][];
  categoryPath: string;
  filterableFields: Set<string>;
  connectorNames?: Record<string, string>;
  /** Provenance for a top-level `price` row (undefined = not a price grid) */
  priceSource?: ReturnType<typeof getPriceSource>;
  nameLinks?: InlineNameLinks;
  /** The entry's `sources` map (field path → provenance) */
  sources?: Record<string, FieldSource | FieldSource[]>;
  /** Dotted path of the group these entries sit in ("outputs"), for nameLinks/sources lookup */
  pathPrefix?: string;
  status?: string | null;
}) {
  const ctx: FormatContext = {
    categoryPath,
    filterableFields,
    connectorNames,
    nameLinks,
    sources,
  };
  return (
    <dl className="detail-grid">
      {entries.map(([key, value]) => (
        <div key={key} className="detail-row">
          <dt className="detail-key">{key.replace(/_/g, ' ')}</dt>
          <dd className="detail-value">
            {key === 'price' && priceSource !== undefined ? (
              <PriceDetail value={value} source={priceSource} status={status} />
            ) : (
              formatValue(key, value, ctx, pathPrefix ? `${pathPrefix}.${key}` : key)
            )}
            <FieldSources sources={sources[pathPrefix ? `${pathPrefix}.${key}` : key]} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

// Attribution line under the hero image: links to the original source when known
/**
 * Attribution under the hero image: credit (linked to the source page), plus
 * the license and a "modified" note for openly licensed images — CC licenses
 * require naming the license and saying the image was changed (all images are
 * background-removed / cropped / resized by scripts/crop-image.ts).
 */
function ImageCredit({ image }: { image: EntryImage }) {
  if (!image.source && !image.credit) return null;
  const who = image.credit ?? stripSchemaAndWww(image.source ?? '').split('/')[0];
  const licHref = image.license ? licenseUrl(image.license) : undefined;
  return (
    <figcaption className="entry-image-credit">
      Image:{' '}
      {image.source ? (
        <a href={image.source} target="_blank" rel="noopener noreferrer">
          {who}
        </a>
      ) : (
        who
      )}
      {image.license && (
        <>
          {' · '}
          {licHref ? (
            <a href={licHref} target="_blank" rel="noopener noreferrer license">
              {image.license}
            </a>
          ) : (
            image.license
          )}
          {' · cropped'}
        </>
      )}
    </figcaption>
  );
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

interface FormatContext {
  categoryPath: string;
  filterableFields: Set<string>;
  connectorNames: Record<string, string>;
  nameLinks: InlineNameLinks;
  sources: Record<string, FieldSource | FieldSource[]>;
}

function formatValue(
  key: string,
  value: unknown,
  ctx: FormatContext,
  path: string = key
): React.ReactNode {
  const { categoryPath, filterableFields, connectorNames } = ctx;
  if (value === null || value === undefined) return <span className="data-table-null">-</span>;

  // Name-list link fields (outputs.protocols, software.firmware, …): names
  // that match an entry become links to it, in place
  const linked = ctx.nameLinks[path];
  if (linked && (typeof value === 'string' || Array.isArray(value))) {
    const names = fieldNames(value);
    if (names.length) return <NameLinkList names={names} links={linked} />;
  }

  if (Array.isArray(value)) {
    const hasObjects = value.some((v) => v && typeof v === 'object' && !(v instanceof Date));
    if (hasObjects) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {value.map((item, idx) => (
            <div key={idx}>{formatValue(key, item, ctx, path)}</div>
          ))}
        </div>
      );
    }
    if (value.length > 0 && value.every((v) => typeof v === 'string' && v.startsWith('http'))) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {(value as string[]).map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="entry-value-link"
              style={{ overflowWrap: 'break-word' }}
            >
              <UrlText url={url} />
            </a>
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

  // Nested price provenance (pricing.source, pricing.examples[].source)
  if (key === 'source' && isPriceSource(value)) {
    return <PriceAsOf source={value} />;
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

  // A link with a few words about it ({url, host, notes}, {name, page}):
  // one line instead of a nested grid of its keys
  const linkRecord = asLinkRecord(value);
  if (linkRecord) return <LinkRecord record={linkRecord} />;

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
            <dd>
              {formatValue(k, obj[k], ctx, `${path}.${k}`)}
              <FieldSources sources={ctx.sources[`${path}.${k}`]} />
            </dd>
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
        style={{ overflowWrap: 'break-word' }}
      >
        <UrlText url={strValue} />
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
