import { loadCategoryData } from '~/lib/data';
import { absoluteUrl } from '~/lib/site';
import { CATEGORIES } from '~/lib/types';

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const day = (date: Date) => date.toISOString().slice(0, 10);

// /sitemap.xml: every page worth indexing, with the day each entry was last
// reviewed. Search results, comparisons and data downloads are left out.
export async function loader() {
  const urls: { path: string; lastmod?: Date }[] = [
    { path: '/' },
    { path: '/designer' },
    { path: '/system-overview' },
    { path: '/protocols' },
    { path: '/about' },
    { path: '/contribute' },
  ];
  for (const category of CATEGORIES) {
    const entries = loadCategoryData(category.id);
    const newest = entries.reduce<Date | undefined>(
      (latest, entry) => (!latest || entry.updated > latest ? entry.updated : latest),
      undefined
    );
    urls.push({ path: category.path, lastmod: newest });
    for (const entry of entries) {
      urls.push({ path: `${category.path}/${entry.id}`, lastmod: entry.updated });
    }
  }

  const body = urls
    .map(
      ({ path, lastmod }) =>
        `  <url><loc>${escapeXml(absoluteUrl(path))}</loc>${
          lastmod ? `<lastmod>${day(lastmod)}</lastmod>` : ''
        }</url>`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
