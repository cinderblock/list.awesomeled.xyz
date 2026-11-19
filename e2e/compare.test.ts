import { test, expect, type Page } from '@playwright/test';
import { gotoReady } from './helpers';

const tray = (page: Page) =>
  page.getByRole('complementary', { name: 'Entries picked for comparison' });
const rowCheckbox = (page: Page, name: string) =>
  page.getByRole('checkbox', { name: `Compare ${name}`, exact: true });
const headers = (page: Page) => page.locator('.compare-header-name');
const param = (page: Page, key: string) => new URL(page.url()).searchParams.get(key);

test.describe('Picking entries', () => {
  test('ticking rows fills the tray, which follows you to other categories', async ({ page }) => {
    await gotoReady(page, '/controllers?q=falcon');
    await expect(tray(page)).toHaveCount(0);

    await rowCheckbox(page, 'Falcon F16V4').check();
    await expect(tray(page)).toContainText('Falcon F16V4');
    await expect(tray(page)).toContainText('Pick one more to compare');

    await rowCheckbox(page, 'Falcon F16V5').check();
    const go = tray(page).getByRole('link', { name: 'Compare 2' });
    await expect(go).toBeVisible();

    // The picks are still there on another category's table
    await page.locator('.category-tab', { hasText: 'Pixels' }).click();
    await expect(page.locator('h1')).toContainText('Pixels');
    await expect(tray(page)).toContainText('Falcon F16V5');

    // Unticking from the tray removes it
    await tray(page)
      .getByRole('button', { name: 'Remove Falcon F16V5 from the comparison' })
      .click();
    await expect(tray(page)).not.toContainText('Falcon F16V5');
    await tray(page).getByRole('button', { name: 'Clear' }).click();
    await expect(tray(page)).toHaveCount(0);
  });

  test('a comparison holds four entries', async ({ page }) => {
    await gotoReady(page, '/level-converters');
    const boxes = page.locator('.data-table-container td.data-table-select input');
    for (let i = 0; i < 4; i++) await boxes.nth(i).check();
    await expect(tray(page).getByRole('link', { name: 'Compare 4' })).toBeVisible();

    await boxes.nth(4).click();
    await expect(page.locator('.toast')).toContainText('holds 4 entries');
    await expect(boxes.nth(4)).not.toBeChecked();
  });

  test('an entry page can add itself', async ({ page }) => {
    await gotoReady(page, '/controllers/falcon-f16v4');
    const button = page.getByRole('button', { name: 'Compare', exact: true });
    await button.click();
    await expect(page.getByRole('button', { name: 'In comparison' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(tray(page)).toContainText('Falcon F16V4');
  });
});

test.describe('Compare page', () => {
  const pair = '/compare?e=controllers/falcon-f16v4,controllers/falcon-f16v5';

  test('from the tray to a side-by-side table', async ({ page }) => {
    await gotoReady(page, '/controllers?q=falcon');
    await rowCheckbox(page, 'Falcon F16V4').check();
    await rowCheckbox(page, 'Falcon F16V5').check();
    await tray(page).getByRole('link', { name: 'Compare 2' }).click();

    await expect(page).toHaveURL(
      /\/compare\?e=controllers\/falcon-f16v4,controllers\/falcon-f16v5$/
    );
    await expect(headers(page)).toHaveText(['Falcon F16V4', 'Falcon F16V5']);
    await expect(page.locator('.page-description')).toContainText(/2 entries, \d+ fields/);
    // the tray steps aside on the compare page
    await expect(tray(page)).toHaveCount(0);
  });

  test('a shared link needs nothing from the device that opens it', async ({ page }) => {
    await gotoReady(page, pair);
    await expect(headers(page)).toHaveText(['Falcon F16V4', 'Falcon F16V5']);
    const outputs = page.locator('.compare-row', {
      // the row header reads "Outputs", plus a hidden "(differs)" when they do
      has: page.getByRole('rowheader', { name: /^Outputs( \(differs\))?$/ }),
    });
    await expect(outputs.locator('.compare-cell')).toHaveText(['16', '16']);
  });

  test('rows that differ are marked, and "differences only" hides the rest', async ({ page }) => {
    await gotoReady(page, pair);
    const rows = page.locator('.compare-row');
    await expect(rows.first()).toBeVisible();
    const all = await rows.count();
    const differing = await page.locator('.compare-row--differs').count();
    expect(differing).toBeGreaterThan(0);
    expect(differing).toBeLessThan(all);

    await page.getByLabel('Differences only').check();
    await expect(rows).toHaveCount(differing);
    expect(param(page, 'diff')).toBe('1');

    await page.getByLabel('Differences only').uncheck();
    await expect(rows).toHaveCount(all);
    expect(param(page, 'diff')).toBeNull();
  });

  test('entries can be added, reordered and removed', async ({ page }) => {
    await gotoReady(page, pair);
    await expect(headers(page)).toHaveCount(2);

    await page.getByRole('button', { name: 'Add an entry' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search the Awesome LED List' });
    await dialog.getByRole('combobox').fill('falcon f48');
    await dialog.getByRole('option').first().click();
    await expect(headers(page)).toHaveText(['Falcon F16V4', 'Falcon F16V5', 'Falcon F48']);
    expect(param(page, 'e')).toBe(
      'controllers/falcon-f16v4,controllers/falcon-f16v5,controllers/falcon-f48'
    );

    await page.getByRole('button', { name: 'Move Falcon F48 left' }).click();
    await expect(headers(page)).toHaveText(['Falcon F16V4', 'Falcon F48', 'Falcon F16V5']);

    await page.getByRole('button', { name: 'Remove Falcon F16V4 from the comparison' }).click();
    await expect(headers(page)).toHaveText(['Falcon F48', 'Falcon F16V5']);
    expect(param(page, 'e')).toBe('controllers/falcon-f48,controllers/falcon-f16v5');

    // already-compared entries are not offered again
    await page.getByRole('button', { name: 'Add an entry' }).click();
    await dialog.getByRole('combobox').fill('falcon f48');
    await expect(dialog.getByRole('option', { name: /^Falcon F48/ })).toHaveCount(0);
  });

  test('entries from different categories line up on the fields they share', async ({ page }) => {
    await gotoReady(page, '/compare?e=pixels/ws2812,pixel-ics/ws2811');
    await expect(headers(page)).toHaveText(['WS2812', 'WS2811']);
    await expect(page.locator('.compare-head').first()).toContainText('Pixels');
    await expect(page.locator('.compare-head').nth(1)).toContainText('Pixel ICs');
    // a field both categories have: one row, two values
    const clocked = page.locator('.compare-row', {
      has: page.getByRole('rowheader', { name: /^Clocked/ }),
    });
    await expect(clocked).toHaveCount(1);
    await expect(clocked.locator('.compare-cell')).toHaveCount(2);
  });

  test('copies the comparison as a Markdown table', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoReady(page, pair);
    await expect(headers(page)).toHaveText(['Falcon F16V4', 'Falcon F16V5']);
    await page.getByRole('button', { name: 'Copy as Markdown' }).click();
    await expect(page.locator('.toast')).toContainText('as Markdown');

    const lines = (await page.evaluate(() => navigator.clipboard.readText())).split(/\r?\n/);
    expect(lines[0]).toBe('|  | Falcon F16V4 | Falcon F16V5 |');
    expect(lines[1]).toBe('| --- | --- | --- |');
    expect(lines.some((line) => /^\| Outputs \| 16 \| 16 \|$/.test(line))).toBe(true);
  });

  test('an entry that no longer exists says so and can be removed', async ({ page }) => {
    await gotoReady(page, '/compare?e=controllers/falcon-f16v4,controllers/no-such-thing');
    await expect(page.locator('.compare-head').nth(1)).toContainText('not in the database');
    await page
      .getByRole('button', { name: 'Remove controllers/no-such-thing from the comparison' })
      .click();
    await expect(headers(page)).toHaveText(['Falcon F16V4']);
  });

  test('with nothing picked it explains how to start', async ({ page }) => {
    await gotoReady(page, '/compare');
    await expect(page.locator('.compare-empty')).toContainText('Tick the box');
    await expect(page.getByRole('button', { name: 'Add an entry' })).toBeVisible();
  });
});
