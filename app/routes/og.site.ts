import { ogCard } from '~/lib/og.server';
import { siteOgCard } from '~/lib/seo.server';

// /og/site.jpg: the link-preview image for every page without one of its own
export async function loader() {
  const image = await ogCard(siteOgCard());
  return new Response(new Uint8Array(image), {
    headers: { 'Content-Type': 'image/jpeg' },
  });
}
