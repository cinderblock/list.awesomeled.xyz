import { buildSearchIndex } from '~/lib/search-index.server';

// /search-index.json — every entry as a compact search record. Prerendered to
// a static file; the browser fetches it the first time someone searches.
export async function loader() {
  return new Response(JSON.stringify(buildSearchIndex()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
