import { test, expect } from '@playwright/test';

// Link previews and search engines read the HTML as served: they do not run
// the page's scripts. So these check the prerendered files themselves, with
// plain requests and no browser.

const ORIGIN = 'https://list.awesomeled.xyz';

/** The content of one <meta> tag in raw HTML, whatever order its attributes are in. */
function metaContent(html: string, attribute: 'name' | 'property', value: string): string | null {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/g)) {
    if (!new RegExp(`\\b${attribute}="${value}"`).test(tag)) continue;
    return tag.match(/\bcontent="([^"]*)"/)?.[1] ?? null;
  }
  return null;
}

test.describe('what crawlers and link previews are served', () => {
  test('an entry page carries its description, canonical URL and preview card', async ({
    request,
  }) => {
    const response = await request.get('/controllers/falcon-f16v5');
    expect(response.status()).toBe(200);
    const html = await response.text();

    expect(html).toContain(`<link rel="canonical" href="${ORIGIN}/controllers/falcon-f16v5"/>`);
    expect(metaContent(html, 'property', 'og:image')).toBe(
      `${ORIGIN}/og/controllers/falcon-f16v5.jpg`
    );
    expect(metaContent(html, 'name', 'twitter:card')).toBe('summary_large_image');
    const description = metaContent(html, 'name', 'description') ?? '';
    expect(description).toContain('Falcon F16V5');
    expect(metaContent(html, 'property', 'og:description')).toBe(description);
    expect(html).toContain('"@type":"BreadcrumbList"');
    expect(html).toMatch(/<title>Falcon F16V5 - Controllers - Awesome LED List<\/title>/);
  });

  test('the home and category pages have cards of their own', async ({ request }) => {
    const home = await (await request.get('/')).text();
    expect(metaContent(home, 'property', 'og:image')).toBe(`${ORIGIN}/og/site.jpg`);
    expect(home).toContain('"@type":"WebSite"');

    const category = await (await request.get('/controllers')).text();
    expect(metaContent(category, 'property', 'og:image')).toBe(`${ORIGIN}/og/controllers.jpg`);
    expect(category).toContain(`<link rel="canonical" href="${ORIGIN}/controllers"/>`);
  });

  test('the preview cards were drawn', async ({ request }) => {
    for (const path of [
      '/og/site.jpg',
      '/og/controllers.jpg',
      '/og/controllers/falcon-f16v5.jpg',
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()['content-type'], path).toBe('image/jpeg');
      const bytes = await response.body();
      expect([bytes[0], bytes[1], bytes[2]], path).toEqual([0xff, 0xd8, 0xff]);
      // A real picture, not an error page saved under an image's name
      expect(bytes.length, path).toBeGreaterThan(10_000);
    }
  });

  test('the sitemap and robots.txt are served', async ({ request }) => {
    const robots = await request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);

    const sitemap = await request.get('/sitemap.xml');
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain(`<loc>${ORIGIN}/controllers/falcon-f16v5</loc>`);
    expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThan(400);
  });

  test('pages that are not content say so before any script runs', async ({ request }) => {
    for (const path of ['/search', '/compare']) {
      const html = await (await request.get(path)).text();
      expect(metaContent(html, 'name', 'robots'), path).toContain('noindex');
    }
  });
});
