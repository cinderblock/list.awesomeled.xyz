import { data } from 'react-router';
import { getCategoryById, loadEntry } from '~/lib/data';
import { ogCard } from '~/lib/og.server';
import { entryOgCard } from '~/lib/seo.server';
import type { Route } from './+types/og.$category.$entry';

// /og/<category>/<entry>.jpg: the link-preview image for an entry page —
// its name, maker, key facts and photo
export async function loader({ params }: Route.LoaderArgs) {
  const category = getCategoryById(params.category);
  const entry = category ? loadEntry(params.category, params.entry) : null;
  if (!category || !entry) throw data(null, { status: 404 });
  const image = await ogCard(entryOgCard(category, entry));
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/jpeg' },
  });
}
