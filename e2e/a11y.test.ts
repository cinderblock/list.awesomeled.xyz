import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { gotoReady } from './helpers';

// Automated accessibility checks (axe-core) on the pages people land on, in
// both themes. They catch what a reviewer cannot see by eye: text a shade too
// light for its background, a link that is only an icon, a button whose
// spoken name is not the word printed on it.
//
// Not covered here: the System Designer (its own stream's page).

const PAGES = [
  '/',
  '/controllers',
  '/pixels',
  '/controllers/falcon-f16v5',
  '/microboards/beaglebone-black',
  '/search?q=falcon',
  '/compare?e=controllers/falcon-f16v5,controllers/pixlite-16-mk2-eco',
  '/contribute',
  '/about',
  '/system-overview',
];

// WCAG 2.0 / 2.1 / 2.2, levels A and AA, plus axe's best practices
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

/**
 * One line per rule broken, with the first few offenders: readable in a test
 * report. `within` limits the check to one part of the page (an open menu),
 * which is much quicker than re-checking a 136-row table behind it.
 */
async function violations(page: Page, within?: string): Promise<string[]> {
  let builder = new AxeBuilder({ page }).withTags(TAGS);
  if (within) builder = builder.include(within);
  const results = await builder.analyze();
  return results.violations.map(
    (violation) =>
      `${violation.id} (${violation.nodes.length}): ${violation.help}\n` +
      violation.nodes
        .slice(0, 3)
        .map((node) => `    ${node.target.join(' ')}\n      ${node.failureSummary ?? ''}`)
        .join('\n')
  );
}

for (const theme of ['light', 'dark'] as const) {
  test.describe(`Accessibility, ${theme} theme`, () => {
    test.beforeEach(async ({ context }) => {
      await context.addInitScript((value) => localStorage.setItem('theme', value), theme);
    });

    for (const path of PAGES) {
      test(path, async ({ page }) => {
        test.slow();
        await gotoReady(page, path);
        expect(await violations(page)).toEqual([]);
      });
    }

    test('a category as cards on a phone', async ({ page }) => {
      test.slow();
      await page.setViewportSize({ width: 390, height: 844 });
      await gotoReady(page, '/controllers');
      expect(await violations(page)).toEqual([]);
    });

    test('with each menu, panel and palette open', async ({ page }) => {
      test.slow();
      await gotoReady(page, '/controllers');

      await page.getByRole('button', { name: /Creator column/ }).click();
      await expect(page.locator('.column-header-popover')).toBeVisible();
      expect(await violations(page, '.column-header-popover')).toEqual([]);
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: /^Choose columns/ }).click();
      await expect(page.locator('.column-picker')).toBeVisible();
      expect(await violations(page, '.column-picker')).toEqual([]);
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: /^Filters/ }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await violations(page, '.filter-drawer')).toEqual([]);
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: 'Search everything' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await violations(page, '.search-palette')).toEqual([]);
    });
  });
}

test.describe('Keyboard', () => {
  test('the first Tab stop skips to the page content', async ({ page }) => {
    // A category page: its tab strip scrolls the active tab into view on
    // load, which once moved the keyboard's starting point along with it
    await gotoReady(page, '/controllers');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();

    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    // The address is left alone: no #fragment to end up in a shared link
    expect(new URL(page.url()).hash).toBe('');
  });

  test("an entry's picture opens as a dialog and gives focus back", async ({ page }) => {
    await gotoReady(page, '/microboards/beaglebone-black');
    const thumb = page.getByRole('button', { name: /^Enlarge image of/ });
    await thumb.focus();
    await page.keyboard.press('Enter');

    const viewer = page.getByRole('dialog', { name: /full size$/ });
    await expect(viewer).toBeVisible();
    await expect(viewer.getByRole('img')).toBeVisible();
    // Focus is inside the dialog, and Tab cannot leave it
    await expect(viewer.getByRole('button', { name: 'Close image' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(viewer.getByRole('button', { name: 'Close image' })).toBeFocused();
    expect(await violations(page, '.image-modal')).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(viewer).toHaveCount(0);
    await expect(thumb).toBeFocused();
  });
});

test.describe('Fonts', () => {
  test('fonts and stylesheets come from this site, not a font service', async ({ page }) => {
    const origin = new URL(test.info().project.use.baseURL!).origin;
    const elsewhere: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (!['font', 'stylesheet'].includes(request.resourceType())) return;
      if (/^https?:/.test(url) && new URL(url).origin !== origin) elsewhere.push(url);
    });
    await gotoReady(page, '/controllers/falcon-f16v5');
    await page.evaluate(() => document.fonts.ready);
    expect(elsewhere).toEqual([]);

    // Inter arrived, from this site, and is what the page is set in
    const fonts = await page.evaluate(() =>
      [...document.fonts].filter((face) => face.status === 'loaded').map((face) => face.family)
    );
    expect(fonts.map((family) => family.replace(/"/g, ''))).toContain('Inter');
  });
});
