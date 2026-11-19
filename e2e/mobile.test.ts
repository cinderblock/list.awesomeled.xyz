import { test, expect, type Page } from '@playwright/test';
import { gotoReady } from './helpers';

// How far the page can be dragged sideways (0 = it fits)
const sidewaysOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

const PAGES = [
  '/',
  '/controllers',
  '/controllers/falcon-f16v4',
  '/compare?e=controllers/falcon-f16v4,controllers/falcon-f16v5',
  '/search?q=falcon',
  '/about',
];

test.describe('Phone widths', () => {
  for (const width of [320, 390]) {
    test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await gotoReady(page, path);
        expect(await sidewaysOverflow(page), `${path} at ${width}px`).toBe(0);
      }
    });
  }

  test('the header keeps its logo on one line and its search within reach', async ({ page }) => {
    // Four loads of the full controllers table: more than the default budget
    // on a busy machine
    test.slow();
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await gotoReady(page, '/controllers');
      const logo = await page.locator('.site-logo').boundingBox();
      expect(logo!.height, `logo height at ${width}px`).toBeLessThan(40);
      await expect(page.getByRole('button', { name: 'Search every category' })).toBeVisible();
    }
  });

  test('what the header drops on the smallest phones is in the footer', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await gotoReady(page, '/');
    await expect(page.locator('header').getByRole('link', { name: 'About' })).toBeHidden();
    await page.locator('footer').getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
  });
});
