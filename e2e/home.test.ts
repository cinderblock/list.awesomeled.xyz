import { test, expect, type Page } from '@playwright/test';
import { gotoReady, rowCount, searchParams } from './helpers';

const searchBox = (page: Page) => page.getByRole('searchbox', { name: 'Search every category' });
const results = (page: Page) => page.locator('.home-search-list a.search-result');

test.describe('Home page', () => {
  test('the search box finds entries in every category as you type', async ({ page }) => {
    await gotoReady(page, '/');
    await expect(results(page)).toHaveCount(0);

    await searchBox(page).fill('falcon');
    await expect(results(page).first()).toContainText(/falcon/i);
    expect(await results(page).count()).toBeLessThanOrEqual(6);

    // More than fit under the box: the rest are on the search page
    await page.getByRole('link', { name: /^See all \d+\+? results$/ }).click();
    await expect(page).toHaveURL(/\/search\?q=falcon$/);
    await expect(page.locator('h1')).toHaveText('Search');
  });

  test('Enter opens the full search; arrow keys reach a result', async ({ page }) => {
    await gotoReady(page, '/');
    await searchBox(page).fill('ws2812b');
    await expect(results(page).first()).toBeVisible();

    await searchBox(page).press('ArrowDown');
    await expect(results(page).first()).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(searchBox(page)).toBeFocused();

    await searchBox(page).press('Enter');
    await expect(page).toHaveURL(/\/search\?q=ws2812b$/);

    // And a result is a link to its entry
    await gotoReady(page, '/');
    await searchBox(page).fill('ws2812b');
    const first = results(page).first();
    const name = (await first.locator('.search-result-name').innerText()).trim();
    await first.click();
    await expect(page.locator('h1')).toContainText(name);
  });

  test('nothing found says so, and Escape starts over', async ({ page }) => {
    await gotoReady(page, '/');
    await searchBox(page).fill('zzzz-not-a-part');
    await expect(page.locator('.home-search-note')).toContainText('Nothing matches');
    await searchBox(page).press('Escape');
    await expect(searchBox(page)).toHaveValue('');
    await expect(page.locator('.home-search-examples')).toBeVisible();
  });

  test('the example searches are links', async ({ page }) => {
    await gotoReady(page, '/');
    const example = page.locator('.home-search-example').first();
    const text = (await example.innerText()).trim();
    await example.click();
    await expect.poll(() => searchParams(page).get('q')).toBe(text);
    await expect(page.locator('.search-page-list a.search-result').first()).toBeVisible();
  });

  test('every "start with a question" link lands on a view with something in it', async ({
    page,
  }) => {
    test.slow(); // one full page load per link
    await gotoReady(page, '/');
    const links = await page
      .locator('.home-start')
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute('href')!));
    expect(links.length).toBeGreaterThanOrEqual(4);

    for (const href of links) {
      await gotoReady(page, href);
      const url = new URL(page.url());
      if (url.searchParams.has('f')) {
        // A filter the table no longer understands would be dropped silently
        // and show everything: the chip proves it was applied
        await expect(page.locator('.data-table-filter-tag').first(), href).toBeVisible();
        expect(await rowCount(page), href).toBeGreaterThan(0);
      } else if (url.pathname === '/compare') {
        await expect(page.locator('.compare-header-name'), href).toHaveCount(
          url.searchParams.get('e')!.split(',').length
        );
      } else {
        await expect(page.locator('h1'), href).toBeVisible();
      }
    }
  });

  test('the numbers add up, and recently reviewed entries open', async ({ page }) => {
    await gotoReady(page, '/');
    const perCategory = await page
      .locator('.category-card-badge')
      .evaluateAll((badges) => badges.map((badge) => parseInt(badge.textContent ?? '', 10)));
    const total = perCategory.reduce((sum, n) => sum + n, 0);
    await expect(page.locator('.home-stats li').first()).toHaveText(`${total} entries`);
    await expect(searchBox(page)).toHaveAttribute('placeholder', new RegExp(`Search ${total} `));

    const recent = page.locator('.home-recent-item');
    expect(await recent.count()).toBeGreaterThanOrEqual(4);
    const name = (await recent.first().locator('.home-recent-name').innerText()).trim();
    await recent.first().click();
    await expect(page.locator('h1')).toContainText(name);
  });
});
