import type { Route } from './+types/entry';
import { data } from 'react-router';
import { getCategoryById, loadEntry } from '~/lib/data';
import { formatDateYMD } from '~/lib/format';
import { ExternalLink } from 'lucide-react';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { PageWrapper } from '~/components/layout/PageWrapper';

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
        {entry.manufacturer && <p className="page-description">by {entry.manufacturer as string}</p>}
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
                <dd className="text-muted">{formatValue(key, value)}</dd>
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

function formatValue(key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.join(', ');
  if (value instanceof Date) return formatDateYMD(value);
  if (typeof value === 'object') return JSON.stringify(value);

  const strValue = String(value);

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
