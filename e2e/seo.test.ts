import { test, expect, type Page } from '@playwright/test';
import { gotoReady } from './helpers';

const ORIGIN = 'https://list.awesomeled.xyz';

const meta = (page: Page, selector: string) =>
  page.locator(`head ${selector}`).first().getAttribute('content');
const canonical = (page: Page) => page.locator('head link[rel="canonical"]').getAttribute('href');
const jsonLd = (page: Page) =>
  page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((scripts) => scripts.map((s) => JSON.parse(s.textContent ?? 'null')));

test.describe('What a shared link and a search engine see', () => {
  test('an entry page describes itself and points at its own preview card', async ({ page }) => {
    await gotoReady(page, '/controllers/falcon-f16v4');
    expect(await canonical(page)).toBe(`${ORIGIN}/controllers/falcon-f16v4`);
    expect(await meta(page, 'meta[property="og:title"]')).toBe('Falcon F16V4 - Controllers');
    expect(await meta(page, 'meta[property="og:url"]')).toBe(`${ORIGIN}/controllers/falcon-f16v4`);
    expect(await meta(page, 'meta[property="og:image"]')).toBe(
      `${ORIGIN}/og/controllers/falcon-f16v4.jpg`
    );
    expect(await meta(page, 'meta[name="twitter:card"]')).toBe('summary_large_image');

    // The description is about this product, not a template
    const description = (await meta(page, 'meta[name="description"]'))!;
    expect(description).toContain('Falcon F16V4');
    expect(description.length).toBeGreaterThan(60);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(await meta(page, 'meta[property="og:description"]')).toBe(description);

    const docs = await jsonLd(page);
    const crumbs = docs.find((doc) => doc['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement.map((item: { name: string }) => item.name)).toEqual([
      'Awesome LED List',
      'Controllers',
      'Falcon F16V4',
    ]);
  });

  test('a filtered table is the same page as the plain one', async ({ page }) => {
    await gotoReady(page, '/controllers?f=wled_compatible:yes&sort=price');
    expect(await canonical(page)).toBe(`${ORIGIN}/controllers`);
    expect(await meta(page, 'meta[property="og:image"]')).toBe(`${ORIGIN}/og/controllers.jpg`);
    expect(await meta(page, 'meta[name="description"]')).toMatch(/\d+ entries to sort, filter/);
  });

  test('the home page offers its search to search engines', async ({ page }) => {
    await gotoReady(page, '/');
    expect(await canonical(page)).toBe(`${ORIGIN}/`);
    expect(await meta(page, 'meta[property="og:image"]')).toBe(`${ORIGIN}/og/site.jpg`);
    const site = (await jsonLd(page)).find((doc) => doc['@type'] === 'WebSite');
    expect(site.potentialAction.target.urlTemplate).toBe(`${ORIGIN}/search?q={search_term_string}`);
  });

  test('views that are not content of their own stay out of the index', async ({ page }) => {
    for (const path of ['/search?q=falcon', '/compare?e=controllers/falcon-f16v4']) {
      await gotoReady(page, path);
      expect(await meta(page, 'meta[name="robots"]'), path).toContain('noindex');
    }
    await gotoReady(page, '/controllers/falcon-f16v4');
    await expect(page.locator('head meta[name="robots"]')).toHaveCount(0);
  });

  test('preview cards are 1200×630 JPEGs', async ({ page, request }) => {
    for (const path of [
      '/og/site.jpg',
      '/og/controllers.jpg',
      '/og/controllers/falcon-f16v4.jpg',
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()['content-type'], path).toContain('image/jpeg');
      const bytes = await response.body();
      // JPEG magic number
      expect([bytes[0], bytes[1], bytes[2]], path).toEqual([0xff, 0xd8, 0xff]);
    }
    await gotoReady(page, '/about');
    const size = await page.evaluate(async () => {
      const image = new Image();
      image.src = '/og/controllers/falcon-f16v4.jpg';
      await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    });
    expect(size).toEqual([1200, 630]);

    expect((await request.get('/og/controllers/no-such-entry.jpg')).status()).toBe(404);
  });

  test('the sitemap lists every kind of page, and robots.txt points at it', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
    expect(robots).not.toMatch(/Disallow: \/\s*$/m);

    const response = await request.get('/sitemap.xml');
    expect(response.headers()['content-type']).toContain('xml');
    const xml = await response.text();
    for (const path of [
      '/',
      '/controllers',
      '/controllers/falcon-f16v4',
      '/about',
      '/contribute',
    ]) {
      expect(xml, path).toContain(`<loc>${ORIGIN}${path}</loc>`);
    }
    // Entries carry the day they were last reviewed
    expect(xml).toMatch(
      /<loc>https:\/\/list\.awesomeled\.xyz\/controllers\/falcon-f16v4<\/loc><lastmod>\d{4}-\d\d-\d\d<\/lastmod>/
    );
    // Not content: search results, comparisons, downloads
    expect(xml).not.toContain('/search');
    expect(xml).not.toContain('/compare');
    expect(xml).not.toContain('.json');
  });
});
