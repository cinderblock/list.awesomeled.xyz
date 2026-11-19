import type { Route } from './+types/csv.$category';
import { data } from 'react-router';
import { getCategoryById } from '~/lib/data';
import { categoryCSV } from '~/lib/category-export.server';

export async function loader({ params }: Route.LoaderArgs) {
  const categoryId = params.category;
  const category = getCategoryById(categoryId);

  if (!category) {
    throw data(null, { status: 404 });
  }

  return new Response(categoryCSV(categoryId), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${categoryId}.csv"`,
    },
  });
}
