import type { Route } from './+types/csv.$category';
import { data } from 'react-router';
import { getCategoryById, loadCategoryData } from '~/lib/data';
import { getColumnsForCategory } from '~/lib/columns';
import { generateCSV } from '~/lib/csv';

export async function loader({ params }: Route.LoaderArgs) {
  const categoryId = params.category;
  const category = getCategoryById(categoryId);

  if (!category) {
    throw data(null, { status: 404 });
  }

  const entries = loadCategoryData(categoryId);
  const columns = getColumnsForCategory(categoryId);
  const csv = generateCSV(entries, columns);

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${categoryId}.csv"`,
    },
  });
}
