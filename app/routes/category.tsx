import type { Route } from './+types/category';
import { Link, data } from 'react-router';
import { getCategoryById, loadCategoryData } from '~/lib/data';
import { getColumnsForCategory, getSearchKeysForCategory } from '~/lib/columns';
import { DataTable } from '~/components/data/DataTable';

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

  const entries = loadCategoryData(categoryId);

  return { category, entries };
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const { category, entries } = loaderData;
  const columns = getColumnsForCategory(category.id);
  const searchKeys = getSearchKeysForCategory(category.id);

  return (
    <div
      className="category-theme"
      style={
        {
          '--category-hue': category.color.hue,
          backgroundColor: 'var(--category-bg-subtle)',
          // Use flex-grow in layout instead of min-height to avoid unnecessary scrollbar
          flex: '1 0 auto',
        } as React.CSSProperties
      }
    >
      <div className="container py-8">
        <nav className="mb-2 flex items-center gap-2">
          <Link to="/" className="text-sm text-muted hover:text-foreground">
            Home
          </Link>
          <span className="text-muted">/</span>
          <span className="text-sm" style={{ color: 'var(--category-primary)' }}>
            {category.name}
          </span>
        </nav>

        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--category-primary)' }}>
            {category.name}
          </h1>
          <p className="text-muted">{category.description}</p>
        </header>

        <DataTable
          data={entries}
          columns={columns}
          categoryPath={category.path}
          categoryId={category.id}
          searchKeys={searchKeys}
        />
      </div>
    </div>
  );
}
