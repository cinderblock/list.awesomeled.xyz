import type { Route } from './+types/entry';
import { data, Link } from 'react-router';
import { getCategoryById, loadEntry } from '~/lib/data';
import { formatDateYMD } from '~/lib/format';
import { getColumnsForCategory } from '~/lib/columns';
import { FileText, ShoppingCart, Youtube, Globe, X } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { PageWrapper } from '~/components/layout/PageWrapper';
import { FeatureBadges, ValueBadges } from '~/components/ui/FeatureBadges';

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
      filterable.add(col.key);
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
  const categoryId = params.category;
  const entryId = params.entry;

  const category = getCategoryById(categoryId);
  if (!category) {
    throw data(null, { status: 404 });
  }

  const entry = loadEntry(categoryId, entryId);
  if (!entry) {
    throw data(null, { status: 404 });
  }

  return { category, entry };
}

// Collect all images from entry (handles both 'image' and 'images' fields)
function getEntryImages(entry: Record<string, unknown>): string[] {
  const images: string[] = [];
  if (typeof entry.image === 'string') {
    images.push(entry.image);
  }
  if (Array.isArray(entry.images)) {
    for (const img of entry.images) {
      if (typeof img === 'string') {
        images.push(img);
      }
    }
  }
  return images;
}

// URL type configuration with icons and labels
interface UrlConfig {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}

const URL_CONFIGS: Record<string, UrlConfig> = {
  datasheet_url: { icon: FileText, label: 'Datasheet' },
  digikey_url: { icon: ShoppingCart, label: 'DigiKey' },
  mouser_url: { icon: ShoppingCart, label: 'Mouser' },
  youtube_url: { icon: Youtube, label: 'YouTube' },
};

// Strip schema (http:// or https://) and www. prefix from URL for display
function stripSchemaAndWww(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/^www\./, '');
}

// Collect all URL fields from entry
function getEntryUrls(entry: Record<string, unknown>): Array<{ key: string; url: string; label: string; icon: React.ComponentType<{ size?: number }> }> {
  const urls: Array<{ key: string; url: string; label: string; icon: React.ComponentType<{ size?: number }> }> = [];
  for (const [key, value] of Object.entries(entry)) {
    if ((key === 'url' || key.endsWith('_url')) && typeof value === 'string' && value) {
      const config = URL_CONFIGS[key];
      if (config) {
        urls.push({ key, url: value, label: config.label, icon: config.icon });
      } else {
        // For main url or unknown URL types, show the full URL without schema
        urls.push({ key, url: value, label: stripSchemaAndWww(value), icon: Globe });
      }
    }
  }
  return urls;
}

export default function EntryPage({ loaderData }: Route.ComponentProps) {
  const { category, entry } = loaderData;
  const filterableFields = getFilterableFields(category.id);
  const images = getEntryImages(entry);
  const urls = getEntryUrls(entry);
  const [modalImage, setModalImage] = useState<string | null>(null);

  return (
    <PageWrapper category={category}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', paddingRight: '1rem' }}>
        <Breadcrumb
          items={[
            { label: 'Home', path: '/' },
            { label: category.name, path: category.path },
            { label: entry.name },
          ]}
          categoryThemed
        />
        <span
          style={{
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            flexShrink: 0,
          }}
          title="Last updated"
        >
          {formatDateYMD(entry.updated as Date)}
        </span>
      </div>

      {images.length > 0 && (
        <div className="entry-images">
          {images.map((filename, idx) => (
            <button
              key={idx}
              onClick={() => setModalImage(`/database-images/${category.id}/${filename}`)}
              style={{
                display: 'block',
                maxWidth: '500px',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                borderRadius: '0.5rem',
                overflow: 'hidden',
              }}
            >
              <img
                src={`/database-images/${category.id}/${filename}`}
                alt={`${entry.name} - ${filename}`}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
            </button>
          ))}
        </div>
      )}

      <header className="page-header">
        <h1 className="page-title category-page-title">{entry.name}</h1>
        <FeatureBadges entry={entry} />
        {entry.creator && (
          <p className="page-description">
            by{' '}
            <Link
              to={`${category.path}?f=creator:${escapeFilterValue(entry.creator as string)}`}
              style={{ color: 'var(--category-primary)' }}
            >
              {entry.creator as string}
            </Link>
          </p>
        )}
        {urls.length > 0 && (
          <div className="entry-urls" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.75rem' }}>
            {urls.map(({ key, url, label, icon: Icon }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  color: 'var(--category-primary)',
                  fontSize: '0.875rem',
                }}
                title={url}
              >
                <Icon size={16} />
                {label}
              </a>
            ))}
          </div>
        )}
      </header>

      {modalImage && (
        <div
          className="image-modal"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            cursor: 'pointer',
          }}
          onClick={() => setModalImage(null)}
        >
          <button
            onClick={() => setModalImage(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0.5rem',
            }}
            aria-label="Close"
          >
            <X size={32} />
          </button>
          <img
            src={modalImage}
            alt={entry.name}
            style={{
              maxWidth: 'min(90vw, 100%)',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="border rounded-lg p-4" style={{ width: 'fit-content', minWidth: '300px' }}>
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content auto', gap: '0.5rem 1rem' }}>
          {Object.entries(entry)
            .filter(([key]) => !['id', 'name', 'image', 'images', 'updated'].includes(key) && key !== 'url' && !key.endsWith('_url'))
            .map(([key, value]) => (
              <div key={key} style={{ display: 'contents' }}>
                <dt className="font-medium" style={{ textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </dt>
                <dd className="text-muted">{formatValue(key, value, category.path, filterableFields)}</dd>
              </div>
            ))}
        </dl>
      </div>
    </PageWrapper>
  );
}

function formatValue(
  key: string,
  value: unknown,
  categoryPath: string,
  filterableFields: Set<string>
): React.ReactNode {
  if (value === null || value === undefined) return '-';

  // Check if value can be rendered as badges
  const badges = ValueBadges({ value, categoryPath, fieldKey: key });
  if (badges) return badges;

  // Handle booleans - make clickable if filterable
  if (typeof value === 'boolean') {
    if (filterableFields.has(key)) {
      return (
        <Link
          to={`${categoryPath}?f=${key}:${value ? 'yes' : 'no'}`}
          style={{ color: 'var(--category-primary)' }}
        >
          {value ? 'Yes' : 'No'}
        </Link>
      );
    }
    return value ? 'Yes' : 'No';
  }

  // Handle arrays - make each item clickable if filterable
  if (Array.isArray(value)) {
    if (filterableFields.has(key)) {
      return (
        <span>
          {value.map((item, idx) => (
            <span key={idx}>
              {idx > 0 && ', '}
              <Link
                to={`${categoryPath}?f=${key}:${escapeFilterValue(String(item))}`}
                style={{ color: 'var(--category-primary)' }}
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

  if (value instanceof Date) return formatDateYMD(value);
  if (typeof value === 'object') return JSON.stringify(value);

  const strValue = String(value);

  // Make filterable string fields clickable
  if (filterableFields.has(key)) {
    return (
      <Link
        to={`${categoryPath}?f=${key}:${escapeFilterValue(strValue)}`}
        style={{ color: 'var(--category-primary)' }}
      >
        {strValue}
      </Link>
    );
  }

  // Make URLs clickable
  if (key.endsWith('_url') || key === 'url') {
    return (
      <a
        href={strValue}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: 'var(--category-primary)', wordBreak: 'break-all' }}
      >
        {strValue}
      </a>
    );
  }

  return strValue;
}
