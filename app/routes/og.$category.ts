import { data } from 'react-router';
import { getCategoryById, loadCategoryData } from '~/lib/data';
import { ogCard } from '~/lib/og.server';
import { categoryOgCard } from '~/lib/seo.server';
import type { Route } from './+types/og.$category';

// /og/<category>.jpg: the link-preview image for a category's table
export async function loader({ params }: Route.LoaderArgs) {
  const category = getCategoryById(params.category);
  if (!category) throw data(null, { status: 404 });
  const count = loadCategoryData(category.id).length;
  const image = await ogCard(categoryOgCard(category, count));
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/jpeg' },
  });
}
