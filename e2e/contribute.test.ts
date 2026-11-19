import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers';

const REPO = 'https://github.com/cinderblock/list.awesomeled.xyz';

test.describe('Contributing', () => {
  test('an entry page ends with ways to fix it', async ({ page }) => {
    await gotoReady(page, '/controllers/falcon-f16v4');
    const strip = page.getByRole('complementary', { name: 'Something wrong or missing?' });

    await expect(strip.getByRole('link', { name: 'Suggest an edit' })).toHaveAttribute(
      'href',
      `${REPO}/edit/master/database/controllers/falcon-f16v4.yaml`
    );
    await expect(strip.getByRole('link', { name: 'Source' })).toHaveAttribute(
      'href',
      `${REPO}/blob/master/database/controllers/falcon-f16v4.yaml`
    );
    await expect(strip.getByRole('link', { name: 'History' })).toHaveAttribute(
      'href',
      `${REPO}/commits/master/database/controllers/falcon-f16v4.yaml`
    );

    // The report opens the correction form with this entry filled in
    const report = new URL(
      (await strip.getByRole('link', { name: 'Report a problem' }).getAttribute('href'))!
    );
    expect(report.origin + report.pathname).toBe(`${REPO}/issues/new`);
    expect(report.searchParams.get('template')).toBe('1-correction.yml');
    expect(report.searchParams.get('entry')).toBe(
      'https://list.awesomeled.xyz/controllers/falcon-f16v4'
    );
    expect(report.searchParams.get('title')).toBe('Correction: Falcon F16V4');
  });

  test('copy link puts the entry address on the clipboard', async ({ page, context }) => {
    const permissions = ['clipboard-read', 'clipboard-write'];
    await context.grantPermissions(permissions);
    await gotoReady(page, '/controllers/falcon-f16v4');
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.getByText('Link copied')).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      'https://list.awesomeled.xyz/controllers/falcon-f16v4'
    );
  });

  test('the contribute page has a field reference for every category', async ({ page }) => {
    await gotoReady(page, '/contribute');
    await expect(page.locator('h1')).toHaveText('Contribute');
    await expect(page.locator('details.contribute-category')).toHaveCount(12);

    const controllers = page.locator('details#controllers');
    await controllers.locator('summary').click();
    // A field from the schema, with how it is used
    const row = controllers.locator('tr', {
      has: page.locator('code', { hasText: /^outputs\.count$/ }),
    });
    await expect(row).toContainText('number');
    await expect(row).toContainText(/\d+ of \d+/);

    // Starting an entry opens GitHub's new-file page in the right folder
    const start = new URL(
      (await controllers.getByRole('link', { name: 'Start a new entry' }).getAttribute('href'))!
    );
    expect(start.origin + start.pathname).toBe(`${REPO}/new/master/database/controllers`);
    expect(start.searchParams.get('value')).toContain('name:');
    expect(start.searchParams.get('filename')).toMatch(/\.yaml$/);
  });

  test('a link to a category opens its reference', async ({ page }) => {
    await gotoReady(page, '/contribute#pixels');
    await expect(page.locator('details#pixels')).toHaveAttribute('open', '');
    await expect(page.locator('details#controllers')).not.toHaveAttribute('open', '');
  });

  test('the issue links name forms that exist', async ({ page }) => {
    await gotoReady(page, '/contribute');
    const templates = await page
      .locator('a[href*="/issues/new?"]')
      .evaluateAll((links) =>
        links.map((a) => new URL((a as HTMLAnchorElement).href).searchParams.get('template'))
      );
    expect(new Set(templates)).toEqual(
      new Set(['1-correction.yml', '2-new-entry.yml', '3-site.yml'])
    );
  });

  test('a category page introduces itself and offers a way to add to it', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const intro = page.locator('details.category-intro');
    await expect(intro).not.toHaveAttribute('open', '');
    await intro.locator('summary').click();
    // From database/controllers/description.md
    await expect(intro.locator('li').first()).toBeVisible();

    await page.getByRole('link', { name: 'Add or fix an entry' }).click();
    await expect(page).toHaveURL(/\/contribute#controllers$/);
    await expect(page.locator('details#controllers')).toHaveAttribute('open', '');
  });

  test('a search that finds nothing offers to report the missing product', async ({ page }) => {
    await gotoReady(page, '/pixels?q=zz-not-a-real-part');
    const missing = page.locator('.data-table-empty-missing');
    const report = new URL(
      (await missing.getByRole('link', { name: 'Tell us about it' }).getAttribute('href'))!
    );
    expect(report.searchParams.get('template')).toBe('2-new-entry.yml');
    expect(report.searchParams.get('name')).toBe('zz-not-a-real-part');
    expect(report.searchParams.get('category')).toBe('Pixels');
    await expect(missing.getByRole('link', { name: 'add it yourself' })).toHaveAttribute(
      'href',
      '/contribute#pixels'
    );
  });

  test('the home page and the footer lead here', async ({ page }) => {
    await gotoReady(page, '/');
    await page.locator('.home-contribute').getByRole('link', { name: 'How to contribute' }).click();
    await expect(page).toHaveURL(/\/contribute$/);
    await expect(page.locator('footer').getByRole('link', { name: 'Contribute' })).toBeVisible();
  });
});
