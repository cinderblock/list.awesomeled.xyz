import type { Route } from './+types/category';
import { data } from 'react-router';
import { getCategoryById, loadCategoryTableData } from '~/lib/data';
import { loadFieldCatalog } from '~/lib/fields.server';
import { DataTable } from '~/components/data/DataTable';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { PageWrapper } from '~/components/layout/PageWrapper';

type LoaderData = Awaited<ReturnType<typeof loader>>;

// Client-side cache for category data to make return visits instant
const categoryCache = new Map<string, LoaderData>();

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData) {
    return [{ title: 'Not Found - Awesome LED List' }];
  }
  return [
    { title: `${loaderData.category.name} - Awesome LED List` },
    { name: 'description', content: loaderData.category.description },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const categoryId = params.category;
  const category = getCategoryById(categoryId);

  if (!category) {
    throw data(null, { status: 404 });
  }

  const entries = loadCategoryTableData(categoryId);
  // Every field the category's entries carry: optional columns, filters, exports
  const fields = loadFieldCatalog(categoryId);

  return { category, entries, fields };
}

export async function clientLoader({ params, serverLoader }: Route.ClientLoaderArgs) {
  const cacheKey = params.category!;

  // Return cached data if available
  const cached = categoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Fetch from server and cache
  const loaderData = await serverLoader();
  categoryCache.set(cacheKey, loaderData);
  return loaderData;
}

// Hydrate with server data on initial load
clientLoader.hydrate = true;

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const { category, entries, fields } = loaderData;

  return (
    <PageWrapper category={category}>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: category.name }]} categoryThemed />

      <header className="page-header">
        <h1 className="page-title category-page-title">{category.name}</h1>
        <p className="page-description">{category.description}</p>
      </header>

      {/* Keyed so each category starts with its own table state */}
      <DataTable key={category.id} data={entries} fields={fields} category={category} />
    </PageWrapper>
  );
}
