import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers';

const palette = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: 'Search the Awesome LED List' });

test.describe('Search everything', () => {
  test('Ctrl+K finds an entry in another category and Enter opens it', async ({ page }) => {
    await gotoReady(page, '/connectors');
    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await expect(dialog).toBeVisible();

    // spaced and lower-cased on purpose: part numbers are typed every which way
    await dialog.getByRole('combobox').fill('falcon f16 v4');
    const first = dialog.getByRole('option').first();
    await expect(first).toContainText('Falcon F16V4');
    await expect(first).toContainText('Controllers');

    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/controllers\/falcon-f16v4$/);
    await expect(page.locator('h1')).toContainText('Falcon F16V4');
    await expect(dialog).toBeHidden();
  });

  test('arrow keys move the selection and Escape closes', async ({ page }) => {
    await gotoReady(page, '/about');
    await page.getByRole('button', { name: 'Search everything' }).click();
    const dialog = palette(page);
    const input = dialog.getByRole('combobox');
    await input.fill('ws28');

    const options = dialog.getByRole('option');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('ArrowDown');
    await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(options.first()).toHaveAttribute('aria-selected', 'false');
    // the input points assistive tech at the selected option
    await expect(input).toHaveAttribute('aria-activedescendant', 'search-option-1');
    await page.keyboard.press('ArrowUp');
    await expect(options.first()).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('with nothing typed it lists the categories and pages', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await expect(dialog.getByRole('option')).toHaveCount(12 + 3);
    await dialog.getByRole('option', { name: /^Pixel ICs/ }).click();
    await expect(page).toHaveURL(/\/pixel-ics$/);
  });

  test('"/" opens it where no table owns the key, and searches the table where one does', async ({
    page,
  }) => {
    await gotoReady(page, '/about');
    await page.keyboard.press('/');
    await expect(palette(page)).toBeVisible();
    await page.keyboard.press('Escape');

    await gotoReady(page, '/controllers');
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox', { name: 'Search Controllers' })).toBeFocused();
    await expect(palette(page)).toBeHidden();
  });

  test('a maker name finds its products', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await dialog.getByRole('combobox').fill('worldsemi');
    const options = dialog.getByRole('option');
    await expect(options.first()).toContainText('WorldSemi');
    // several products, not one lucky hit
    await expect(options.filter({ hasText: 'WorldSemi' }).nth(2)).toBeVisible();
  });

  test('nonsense says so instead of showing an empty box', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await dialog.getByRole('combobox').fill('zzzzqqqq');
    await expect(dialog).toContainText('Nothing matches');
  });
});

test.describe('Search page', () => {
  test('lists every match grouped by category, and the URL carries the query', async ({ page }) => {
    await gotoReady(page, '/search?q=falcon');
    await expect(page.locator('.search-page-status')).toContainText(/\d+ results? in \d+ categor/);
    const controllers = page.locator('.search-page-group', { hasText: 'Controllers' });
    await expect(controllers.locator('.search-result').first()).toContainText('Falcon');

    const input = page.getByRole('searchbox', { name: 'Search every category' });
    await input.fill('sk6812');
    await expect(page).toHaveURL(/\/search\?q=sk6812$/);
    await expect(page.locator('.search-page-group').first()).toContainText('SK6812');

    // into the full table, keeping the query
    await page
      .locator('.search-page-group')
      .first()
      .getByRole('link', { name: 'Open in the table' })
      .click();
    await expect(page).toHaveURL(/\?q=sk6812$/);
    await expect(page.getByRole('searchbox').first()).toHaveValue('sk6812');
  });

  test('the palette hands over to the search page for long result lists', async ({ page }) => {
    await gotoReady(page, '/');
    await page.keyboard.press('Control+k');
    const dialog = palette(page);
    await dialog.getByRole('combobox').fill('ws');
    await dialog.getByRole('option', { name: /^See all \d+\+? results/ }).click();
    await expect(page).toHaveURL(/\/search\?q=ws$/);
    await expect(page.locator('.search-page-group').first()).toBeVisible();
  });

  test('the index covers every category', async ({ request }) => {
    const docs: { c: string; i: string; n: string }[] = await (
      await request.get('/search-index.json')
    ).json();
    expect(docs.length).toBeGreaterThan(400);
    expect(new Set(docs.map((d) => d.c)).size).toBe(12);
    expect(docs.every((d) => d.i && d.n)).toBe(true);
  });
});

test.describe('Missing pages', () => {
  test('an unknown address suggests the closest entries', async ({ page }) => {
    await gotoReady(page, '/somewhere/else/falcon-f16');
    await expect(page.locator('h1')).toHaveText('There is nothing at this address');
    await expect(page).toHaveTitle(/Page not found/);

    const suggestions = page.locator('.not-found-suggestions .search-result');
    await expect(suggestions.first()).toContainText('Falcon F16');
    await suggestions.first().click();
    await expect(page).toHaveURL(/\/controllers\/falcon-f16v\d$/);
  });

  test('the search button carries what the address asked for', async ({ page }) => {
    await gotoReady(page, '/somewhere/else/sk6812-rgbw');
    await page.getByRole('button', { name: 'Search the whole list' }).click();
    const dialog = palette(page);
    await expect(dialog.getByRole('combobox')).toHaveValue('sk6812 rgbw');
    await expect(dialog.getByRole('option').first()).toContainText('SK6812');
  });
});
