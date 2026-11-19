import type { Route } from './+types/category';
import { data, Link } from 'react-router';
import { loadCategoryIntro } from '~/lib/category-intro.server';
import { getCategoryById, loadCategoryTableData } from '~/lib/data';
import { loadFieldCatalog } from '~/lib/fields.server';
import { pageMeta } from '~/lib/meta';
import { categorySeo } from '~/lib/seo.server';
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
  const { category, seo } = loaderData;
  // Filters, sort and columns live in the query string: one canonical page
  return pageMeta({
    title: category.name,
    description: seo.description,
    path: category.path,
    image: seo.image,
    jsonLd: seo.jsonLd,
  });
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

  return {
    category,
    entries,
    fields,
    seo: categorySeo(category, entries.length),
    // What the category is and what to look for (description.md), as HTML
    intro: loadCategoryIntro(categoryId),
  };
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
  const { category, entries, fields, intro } = loaderData;

  return (
    <PageWrapper category={category}>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: category.name }]} categoryThemed />

      <header className="page-header">
        <h1 className="page-title category-page-title">{category.name}</h1>
        <p className="page-description">{category.description}</p>
        {intro && (
          // Keyed: a category opened while reading another starts closed
          <details key={category.id} className="category-intro">
            <summary>What to look for</summary>
            <div className="category-intro-body" dangerouslySetInnerHTML={{ __html: intro }} />
          </details>
        )}
      </header>

      {/* Keyed so each category starts with its own table state */}
      <DataTable key={category.id} data={entries} fields={fields} category={category} />

      <p className="category-contribute">
        Know of {category.name.toLowerCase()} that should be here, or see a value that is wrong?{' '}
        <Link to={`/contribute#${category.id}`}>Add or fix an entry</Link>.
      </p>
    </PageWrapper>
  );
}
