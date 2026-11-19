import { absoluteUrl } from '~/lib/site';

// /robots.txt: everything may be crawled; pages that are not content of
// their own (search results, comparisons) say so themselves with noindex
export async function loader() {
  const text = `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl('/sitemap.xml')}\n`;
  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
