import type { Route } from './+types/json.$category';
import { data } from 'react-router';
import { getCategoryById } from '~/lib/data';
import { categoryJSON } from '~/lib/category-export.server';

// /<category>.json — the whole category as data: field catalog + records.
// Prerendered to a static file, so it is a free, cacheable API.
export async function loader({ params }: Route.LoaderArgs) {
  const categoryId = params.category;
  const category = getCategoryById(categoryId);

  if (!category) {
    throw data(null, { status: 404 });
  }

  return new Response(JSON.stringify(categoryJSON(categoryId)), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
