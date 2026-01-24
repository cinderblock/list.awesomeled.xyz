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
      className="category-theme category-page"
      style={
        {
          '--category-hue': category.color.hue,
          backgroundColor: 'var(--category-bg-subtle)',
        } as React.CSSProperties
      }
    >
      <div className="container page-section">
        <nav className="breadcrumb">
          <Link to="/" className="breadcrumb-link">
            Home
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="category-breadcrumb-current">{category.name}</span>
        </nav>

        <header className="page-header">
          <h1 className="page-title category-page-title">{category.name}</h1>
          <p className="page-description">{category.description}</p>
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
