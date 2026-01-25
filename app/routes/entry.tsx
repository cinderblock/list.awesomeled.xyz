import type { Route } from './+types/entry';
import { data, Link } from 'react-router';
import { getCategoryById, loadEntry } from '~/lib/data';
import { formatDateYMD } from '~/lib/format';
import { getColumnsForCategory } from '~/lib/columns';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { PageWrapper } from '~/components/layout/PageWrapper';

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

export default function EntryPage({ loaderData }: Route.ComponentProps) {
  const { category, entry } = loaderData;
  const filterableFields = getFilterableFields(category.id);

  return (
    <PageWrapper category={category}>
      <Breadcrumb
        items={[
          { label: 'Home', path: '/' },
          { label: category.name, path: category.path },
          { label: entry.name },
        ]}
        categoryThemed
      />

      <header className="page-header">
        <h1 className="page-title category-page-title">{entry.name}</h1>
        {entry.manufacturer && (
          <p className="page-description">
            by{' '}
            <Link
              to={`${category.path}?f=manufacturer:${escapeFilterValue(entry.manufacturer as string)}`}
              style={{ color: 'var(--category-primary)' }}
            >
              {entry.manufacturer as string}
            </Link>
          </p>
        )}
      </header>

      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '0.5rem 1rem' }}>
          {Object.entries(entry)
            .filter(([key]) => !['id', 'name'].includes(key))
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

      {entry.url && (
        <div className="mt-4">
          <a
            href={entry.url as string}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ gap: '0.5rem' }}
          >
            Visit Website
            <ExternalLink size={16} />
          </a>
        </div>
      )}
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
