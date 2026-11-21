import { test, expect, type Page } from '@playwright/test';
import { gotoReady, searchParams } from './helpers';

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
  '/protocols',
];

test.describe('Phone widths', () => {
  for (const width of [320, 390]) {
    test(`no page scrolls sideways at ${width}px`, async ({ page }) => {
      test.slow(); // several full page loads
      await page.setViewportSize({ width, height: 800 });
      for (const path of PAGES) {
        await gotoReady(page, path);
        expect(await sidewaysOverflow(page), `${path} at ${width}px`).toBe(0);
      }
    });
  }

  test('the header still fits when the page is set in a wider font', async ({ page }) => {
    // Until Inter arrives (or if it never does) the text is in whatever the
    // device has, and on Linux that is a much wider face: the header's
    // buttons used to slide 5 to 9 px off a phone screen. Stand in for that
    // with no web font at all and extra letter spacing.
    await page.route('**/*', (route) =>
      route.request().resourceType() === 'font' ? route.abort() : route.continue()
    );
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 800 });
      await gotoReady(page, '/search?q=falcon');
      await page.addStyleTag({
        content:
          "body { font-family: Verdana, 'DejaVu Sans', sans-serif; letter-spacing: 0.02em; }",
      });
      await expect.poll(() => sidewaysOverflow(page), { message: `at ${width}px` }).toBe(0);
      // Nothing was pushed out to make it fit: search and the theme switch are still there
      await expect(page.getByRole('button', { name: 'Search everything' })).toBeInViewport({
        ratio: 1,
      });
      await expect(page.getByRole('banner').getByRole('button').last()).toBeInViewport({
        ratio: 1,
      });
    }
  });

  test('the header keeps its logo on one line and its search within reach', async ({ page }) => {
    // The header is the same on every page; this is the lightest one
    await gotoReady(page, '/about');
    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      const logo = await page.locator('.site-logo').boundingBox();
      expect(logo!.height, `logo height at ${width}px`).toBeLessThan(40);
      await expect(page.getByRole('button', { name: 'Search everything' })).toBeVisible();
    }
  });

  test('what the header drops on the smallest phones is in the footer', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await gotoReady(page, '/');
    await expect(page.getByRole('banner').getByRole('link', { name: 'About' })).toBeHidden();
    await page.locator('footer').getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);
  });
});

const html = (page: Page) => page.locator('html');
const cards = (page: Page) => page.locator('.data-table-container tbody tr[data-row-id]');
const tableHead = (page: Page) => page.locator('.data-table-container thead');
const firstName = (page: Page) => cards(page).first().locator('td[data-col="name"]').innerText();

test.describe('Card list', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
  });

  test('a phone gets a card per entry instead of a wide table', async ({ page }) => {
    await gotoReady(page, '/controllers');
    await expect(html(page)).toHaveAttribute('data-table-layout', 'cards');
    await expect(tableHead(page)).toBeHidden();

    // Cards stack down the page, each as wide as the screen allows
    const first = (await cards(page).nth(0).boundingBox())!;
    const second = (await cards(page).nth(1).boundingBox())!;
    expect(first.width).toBeGreaterThan(330);
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);

    // Each value carries its column's name; what an entry doesn't record is left out
    const label = await cards(page)
      .first()
      .locator('td[data-col="outputs.count"]')
      .evaluate((cell) => getComputedStyle(cell, '::before').content);
    expect(label).toBe('"Outputs"');
    const blanks = page.locator(
      '.data-table-container tbody :is(td[data-empty], td:has(> .data-table-null:only-child))'
    );
    expect(await blanks.count()).toBeGreaterThan(0);
    expect(
      await blanks.evaluateAll(
        (cells) => cells.filter((cell) => cell.getClientRects().length > 0).length
      )
    ).toBe(0);
  });

  test("no category's cards scroll sideways", async ({ page }) => {
    test.slow(); // a dozen full page loads
    await gotoReady(page, '/');
    const categories = await page
      .locator('.category-tab')
      .evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('href')!));
    expect(categories.length).toBeGreaterThan(10);
    for (const path of categories) {
      await gotoReady(page, path);
      await expect(cards(page).first()).toBeVisible();
      expect(await sidewaysOverflow(page), path).toBe(0);
    }
  });

  test('tapping anywhere on a card opens its entry', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const card = cards(page).first();
    const id = await card.getAttribute('data-row-id');
    const box = (await card.boundingBox())!;
    // A blank corner of the card, well away from the name
    await page.mouse.click(box.x + box.width - 12, box.y + box.height - 8);
    await expect(page).toHaveURL(new RegExp(`/controllers/${id}$`));
  });

  test("a card's own controls work without opening the entry", async ({ page }) => {
    await gotoReady(page, '/controllers?q=falcon');
    await page.getByRole('checkbox', { name: 'Compare Falcon F16V4', exact: true }).check();
    await expect(
      page.getByRole('complementary', { name: 'Entries picked for comparison' })
    ).toContainText('Falcon F16V4');

    // A value pill filters by that value, as it does in the table
    await cards(page).first().locator('td[data-col="status"] .badge').click();
    await expect.poll(() => searchParams(page).get('f')).toMatch(/^status:/);
    await expect(page).toHaveURL(/\/controllers\?/);
  });

  test('sorting moves from the column headers to a Sort menu', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const before = await firstName(page);

    await page.getByRole('button', { name: 'Sort', exact: true }).click();
    const byName = page.getByRole('menuitem', { name: /^Name/ });
    await byName.click();
    await expect.poll(() => searchParams(page).get('sort')).toBe('name');
    await expect(byName).toContainText('sorted ascending');

    // The menu stays open, so a second tap reverses
    await byName.click();
    await expect.poll(() => searchParams(page).get('sort')).toBe('name.');
    await expect(byName).toContainText('sorted descending');
    await expect.poll(() => firstName(page)).not.toBe(before);

    await page.getByRole('menuitem', { name: 'Default order' }).click();
    await expect.poll(() => searchParams(page).has('sort')).toBe(false);
    await expect.poll(() => firstName(page)).toBe(before);
  });

  test('table or cards is a choice, and it sticks', async ({ page }) => {
    await gotoReady(page, '/controllers');
    await page.getByRole('button', { name: 'Show as a table' }).click();
    await expect(html(page)).toHaveAttribute('data-table-layout', 'table');
    await expect(tableHead(page)).toBeVisible();

    // Remembered on this device, for every category
    await gotoReady(page, '/pixels');
    await expect(html(page)).toHaveAttribute('data-table-layout', 'table');

    await page.getByRole('button', { name: 'Show as cards' }).click();
    await expect(html(page)).toHaveAttribute('data-table-layout', 'cards');
    await expect(tableHead(page)).toBeHidden();
  });

  test('a wide screen keeps the table, and can ask for cards', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoReady(page, '/controllers');
    await expect(html(page)).toHaveAttribute('data-table-layout', 'table');
    await expect(tableHead(page)).toBeVisible();

    await page.getByRole('button', { name: 'Show as cards' }).click();
    await expect(html(page)).toHaveAttribute('data-table-layout', 'cards');
    // Several cards per row, none cut off at the edge
    const first = (await cards(page).nth(0).boundingBox())!;
    const second = (await cards(page).nth(1).boundingBox())!;
    expect(second.y).toBe(first.y);
    expect(second.x).toBeGreaterThan(first.x + first.width - 1);
    expect(await sidewaysOverflow(page)).toBe(0);
  });
});
