import { test, expect, type Page } from '@playwright/test';

// What ships is static HTML that React hydrates. A page whose first client
// render differs from that HTML — typically because it reads the query string
// or localStorage while rendering — throws React error #418 in production
// only: the dev server the main suite uses is not prerendered. These tests
// load the real build with and without query strings and fail on any console
// or page error.

const PAGES = [
  '/',
  '/about',
  '/system-overview',
  '/controllers',
  '/controllers/falcon-f16v5',
  '/pixels/ws2812',
  '/designer',
  '/designer?p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights',
  '/designer?p=ic-ws2811&x=16&n=400&c=falcon-f16v5&k=pigtails&g=xlights&b=30&o=1&t=House+outline',
];

// Known to fail today: tables read their sort / filter / search from the
// query string while rendering, so these throw React error #418. Logged in
// ISSUES.md ("Table pages with a query string fail hydration"); move them into
// PAGES when that is fixed.
const KNOWN_FAILING = ['/controllers?sort=price&f=wled_compatible:yes', '/controllers?q=falcon'];

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function hydratesCleanly(page: Page, path: string) {
  const errors = collectErrors(page);
  const response = await page.goto(path);
  expect(response?.status()).toBe(200);
  await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
}

test.describe('prerendered pages hydrate cleanly', () => {
  for (const path of PAGES) {
    test(path, ({ page }) => hydratesCleanly(page, path));
  }
  for (const path of KNOWN_FAILING) {
    test.fixme(path, ({ page }) => hydratesCleanly(page, path));
  }
});

test.describe('the designer in the production build', () => {
  test('a shared link shows its design after hydration', async ({ page }) => {
    await page.goto('/designer?p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights');
    await expect(page.locator('.designer-page[data-ready]')).toBeVisible();
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
    await expect(page.locator('#slot-g0-controller')).toContainText('Falcon F16V5');
    // Part thumbnails come from the build's own derived images
    const thumbnail = page.locator('#designer-diagram svg.dgm image').first();
    await expect(thumbnail).toHaveAttribute('href', /^\/database-thumbs\//);
    const loaded = await page.request.get((await thumbnail.getAttribute('href')) ?? '');
    expect(loaded.status()).toBe(200);
  });

  test('the prerendered page starts empty and takes edits', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
    await page.goto('/designer');
    await expect(page.locator('.designer-page[data-ready]')).toBeVisible();
    await expect(page.getByTestId('total-pixels')).toHaveText('0');
    await page.locator('#slot-g0-pixels .designer-slot-toggle').click();
    await page.locator('#slot-g0-pixels-panel [data-id="ws2812"]').click();
    await expect(page.getByTestId('total-pixels')).toHaveText('150');
    await expect(page).toHaveURL(/[?&]p=ws2812(&|$)/);
  });

  test('an unknown path is a real 404', async ({ page }) => {
    const response = await page.goto('/no-such-page-anywhere');
    expect(response?.status()).toBe(404);
  });
});
