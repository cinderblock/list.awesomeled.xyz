import { test, expect, type Page } from '@playwright/test';
import {
  columnLabels,
  columnTexts,
  gotoReady,
  headerCell,
  rowCount,
  searchParams,
} from './helpers';

// "$1,234.50" → 1234.5; "-" → null
function money(text: string): number | null {
  const m = text.replace(/,/g, '').match(/\$(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
}

function isSorted(values: number[], dir: 'asc' | 'desc'): boolean {
  return values.every(
    (v, i) => i === 0 || (dir === 'asc' ? values[i - 1] <= v : values[i - 1] >= v)
  );
}

test.describe('Sorting', () => {
  test('one click on a header sorts, the next reverses, the third clears', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const price = headerCell(page, 'price');
    const sortButton = price.getByRole('button', { name: /^Sort by Price/ });

    await sortButton.click();
    await expect(price).toHaveAttribute('aria-sort', 'ascending');
    expect(searchParams(page).get('sort')).toBe('price');
    let prices = (await columnTexts(page, 'price')).map(money).filter((n) => n !== null);
    expect(prices.length).toBeGreaterThan(10);
    expect(isSorted(prices, 'asc')).toBe(true);

    await sortButton.click();
    await expect(price).toHaveAttribute('aria-sort', 'descending');
    expect(searchParams(page).get('sort')).toBe('price.');
    prices = (await columnTexts(page, 'price')).map(money).filter((n) => n !== null);
    expect(isSorted(prices, 'desc')).toBe(true);

    await sortButton.click();
    await expect(price).not.toHaveAttribute('aria-sort', /.+/);
    expect(searchParams(page).has('sort')).toBe(false);
  });

  test('shift-click adds a tie-break level and both are listed', async ({ page }) => {
    await gotoReady(page, '/controllers');
    await headerCell(page, 'status')
      .getByRole('button', { name: /^Sort by Status/ })
      .click();
    await headerCell(page, 'price')
      .getByRole('button', { name: /^Sort by Price/ })
      .click({ modifiers: ['Shift'] });

    await expect.poll(() => searchParams(page).get('sort')).toBe('status*price');
    const chips = page.locator('.data-table-filter-tag--sort');
    await expect(chips).toHaveCount(2);
    await expect(chips.nth(0)).toContainText('Sorted by Status');
    await expect(chips.nth(1)).toContainText('then Price');
  });

  test('missing values sort last in both directions', async ({ page }) => {
    await gotoReady(page, '/controllers?sort=price.');
    const texts = await columnTexts(page, 'price');
    // Descending, yet every row without a price still comes after every
    // priced row. (Prices in a currency with no exchange rate on file cannot
    // be ordered either and sit with the blanks, so only "-" is checked.)
    const firstBlank = texts.indexOf('-');
    const priced = texts.map(money);
    let lastPriced = priced.length - 1;
    while (lastPriced >= 0 && priced[lastPriced] === null) lastPriced--;
    expect(firstBlank).toBeGreaterThan(0);
    expect(lastPriced).toBeLessThan(firstBlank);
  });
});

test.describe('Filtering', () => {
  test('a column menu lists values with counts and filters by them', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const total = await rowCount(page);

    await headerCell(page, 'inputs.protocols')
      .getByRole('button', { name: /Protocols column/ })
      .click();
    const option = page.locator('.column-header-popover .filter-option', { hasText: 'Art-Net' });
    const count = Number(await option.locator('.filter-count').innerText());
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(total);

    await option.click();
    await expect.poll(() => rowCount(page)).toBe(count);
    expect(searchParams(page).get('f')).toBe('inputs.protocols:Art\\-Net');
    await expect(page.locator('.data-table-count')).toHaveText(`${count} of ${total} entries`);
    await expect(page.locator('.data-table-filter-tag').first()).toContainText(
      'Protocols: Art-Net'
    );
  });

  test('counts on one filter reflect the others', async ({ page }) => {
    await gotoReady(page, '/controllers?f=wled_compatible:yes');
    const wledRows = await rowCount(page);

    await headerCell(page, 'status')
      .getByRole('button', { name: /Status column/ })
      .click();
    const counts = await page
      .locator('.column-header-popover .filter-option .filter-count')
      .allInnerTexts();
    // every WLED controller has exactly one status, so the counts add up to them
    expect(counts.map(Number).reduce((a, b) => a + b, 0)).toBe(wledRows);
  });

  test('the filters panel reaches fields that are not columns', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const total = await rowCount(page);

    await page.getByRole('button', { name: /^Filters/ }).click();
    const drawer = page.getByRole('dialog', { name: 'Filters' });
    await drawer.getByPlaceholder('Find a field to filter…').fill('standalone');
    await drawer.getByRole('button', { name: 'Standalone' }).click();
    await drawer.getByRole('button', { name: /^Yes/ }).click();

    await expect.poll(() => searchParams(page).get('f')).toBe('inputs.standalone:yes');
    await expect(drawer.locator('.drawer-count')).not.toHaveText(`${total} of ${total} match`);
    await drawer.getByRole('button', { name: /^Show \d+ entr/ }).click();
    await expect(drawer).toBeHidden();

    const filtered = await rowCount(page);
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(total);
    await expect(page.locator('.data-table-filter-tag').first()).toContainText('Standalone: Yes');

    await page.getByRole('button', { name: 'Clear filters' }).click();
    await expect.poll(() => rowCount(page)).toBe(total);
    expect(searchParams(page).has('f')).toBe(false);
  });

  test('clicking a pill in a cell filters by its value', async ({ page }) => {
    await gotoReady(page, '/controllers');
    await page
      .locator('.data-table-container td[data-col="inputs.protocols"] [data-pill]', {
        hasText: 'Art-Net',
      })
      .first()
      .click();
    await expect.poll(() => searchParams(page).get('f')).toBe('inputs.protocols:Art\\-Net');
    const cells = await columnTexts(page, 'inputs.protocols');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((text) => text.includes('Art-Net'))).toBe(true);
  });

  test('numeric filters understand units', async ({ page }) => {
    await gotoReady(page, '/pixels');
    const total = await rowCount(page);
    await headerCell(page, 'data.bitrate')
      .getByRole('button', { name: /Data Rate column/ })
      .click();
    await page.getByLabel('At least').fill('1 MHz');
    await page.getByLabel('At least').press('Enter');

    await expect.poll(() => searchParams(page).get('f')).toBe('data.bitrate:1MHz-');
    await page.keyboard.press('Escape');
    const rates = (await columnTexts(page, 'data.bitrate')).filter((t) => t !== '-');
    expect(rates.length).toBeGreaterThan(0);
    expect(rates.every((t) => /MHz/.test(t))).toBe(true);
    expect(await rowCount(page)).toBeLessThan(total);
  });

  test('a select value spelled like a boolean is still a select value', async ({ page }) => {
    // "Yes" is one of the Visualizer options; it must not be read as a yes/no filter
    await gotoReady(page, '/pattern-drivers?f=capabilities.visualizer:Yes');
    await expect(page.locator('.data-table-filter-tag').first()).toContainText('Visualizer: Yes');
    const cells = await columnTexts(page, 'capabilities.visualizer');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells.every((text) => text === 'Yes')).toBe(true);
  });

  test('has-a-value / no-value works on any column', async ({ page }) => {
    await gotoReady(page, '/controllers?f=price:!*');
    await expect(page.locator('.data-table-filter-tag').first()).toContainText('Price: no value');
    const prices = await columnTexts(page, 'price');
    expect(prices.every((text) => money(text) === null)).toBe(true);
  });
});

test.describe('Search', () => {
  test('search looks in every field, not just the name', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const total = await rowCount(page);
    await page.getByRole('searchbox', { name: 'Search Controllers' }).fill('art-net');

    await expect.poll(() => rowCount(page)).toBeLessThan(total);
    const matches = await rowCount(page);
    // far more controllers speak Art-Net than have it in their name
    const named = (await columnTexts(page, 'name')).filter((n) => /art-?net/i.test(n)).length;
    expect(matches).toBeGreaterThan(named);
    await expect.poll(() => searchParams(page).get('q')).toBe('art-net');
  });

  test('the best name matches come first when no sort is chosen', async ({ page }) => {
    await gotoReady(page, '/controllers?q=falcon');
    const names = await columnTexts(page, 'name');
    expect(names.length).toBeGreaterThan(1);
    expect(names[0].toLowerCase()).toContain('falcon');
  });

  test('"/" focuses the search box and an empty result offers a way out', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const total = await rowCount(page);
    await page.keyboard.press('/');
    const search = page.getByRole('searchbox', { name: 'Search Controllers' });
    await expect(search).toBeFocused();

    await search.fill('zzzz-no-such-thing');
    await expect(page.locator('.data-table-empty')).toContainText('No controllers match');
    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect.poll(() => rowCount(page)).toBe(total);
    await expect(search).toHaveValue('');
  });
});

test.describe('Columns', () => {
  test('any field can be added as a column, and the link carries it', async ({ page, browser }) => {
    await gotoReady(page, '/controllers');
    const before = await columnLabels(page);
    expect(before).not.toContain('Max voltage');

    await page.getByRole('button', { name: /^Choose columns/ }).click();
    await page.getByPlaceholder('Find a field…').fill('voltage');
    await page.locator('.column-picker label', { hasText: 'Max voltage' }).click();
    await expect(headerCell(page, 'power.voltage.max')).toBeVisible();
    await expect.poll(() => searchParams(page).get('cols')).toContain('power.voltage.max');

    // The new column shows values with their unit
    const volts = (await columnTexts(page, 'power.voltage.max')).filter((t) => t !== '-');
    expect(volts.length).toBeGreaterThan(0);
    expect(volts.every((t) => /^[\d.,–]+\s*V$/.test(t))).toBe(true);

    // Someone else opening the link sees the same columns
    const other = await browser.newContext();
    const shared = await other.newPage();
    await gotoReady(shared, new URL(page.url()).pathname + new URL(page.url()).search);
    await expect(headerCell(shared, 'power.voltage.max')).toBeVisible();
    await other.close();
  });

  test('the layout is remembered on this device and can be reset', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const defaults = await columnLabels(page);

    await headerCell(page, 'creator')
      .getByRole('button', { name: /Creator column/ })
      .click();
    await page.getByRole('button', { name: 'Hide the Creator column' }).click();
    await expect(headerCell(page, 'creator')).toHaveCount(0);

    // A bare visit resumes the saved layout
    await gotoReady(page, '/controllers');
    await expect(headerCell(page, 'creator')).toHaveCount(0);
    await expect.poll(() => searchParams(page).has('cols')).toBe(true);

    await page.getByRole('button', { name: /^Choose columns/ }).click();
    await page.getByRole('button', { name: 'Reset to default' }).click();
    await expect.poll(() => columnLabels(page)).toEqual(defaults);
    expect(searchParams(page).has('cols')).toBe(false);
  });

  test('a column can be moved from its menu', async ({ page }) => {
    await gotoReady(page, '/controllers');
    const before = await columnLabels(page);
    const index = before.indexOf('Price');
    await headerCell(page, 'price')
      .getByRole('button', { name: /Price column/ })
      .click();
    await page.getByRole('button', { name: 'Move Price left' }).click();
    await expect.poll(async () => (await columnLabels(page)).indexOf('Price')).toBe(index - 1);
  });

  test('a column menu stays on screen in a short window', async ({ page }) => {
    // Creator has dozens of values: its menu is taller than the room under the
    // table header on a small laptop. It used to flip upward, off the top.
    await page.setViewportSize({ width: 1280, height: 620 });
    await gotoReady(page, '/controllers');
    await headerCell(page, 'creator')
      .getByRole('button', { name: /Creator column/ })
      .click();
    const menu = page.locator('.column-header-popover');
    await expect(page.getByRole('button', { name: 'Hide the Creator column' })).toBeInViewport({
      ratio: 1,
    });
    const box = (await menu.boundingBox())!;
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(620);
    // What does not fit is reached by scrolling inside the menu
    const empty = menu.getByRole('button', { name: /^No value/ });
    await empty.scrollIntoViewIfNeeded();
    await expect(empty).toBeInViewport({ ratio: 1 });
  });

  test('state from one category does not leak into another', async ({ page }) => {
    await gotoReady(page, '/controllers?f=wled_compatible:yes&cols=name,price');
    await expect.poll(() => columnLabels(page)).toEqual(['Name', 'Price']);

    await page.locator('.category-tab', { hasText: 'Pixels' }).click();
    await expect(page.locator('h1')).toContainText('Pixels');
    await expect(headerCell(page, 'color.order')).toBeVisible();
    await expect(page.locator('.data-table-filter-tag')).toHaveCount(0);
  });
});

test.describe('Density', () => {
  const rowHeight = (page: Page) =>
    page
      .locator('.data-table-container tbody tr[data-row-id]')
      .first()
      .evaluate((row) => row.getBoundingClientRect().height);

  test('rows are dense by default, roomy on request, and the choice sticks', async ({ page }) => {
    // Set before first paint, as a spreadsheet would show it
    await page.goto('/controllers', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
    await gotoReady(page, '/controllers');
    const dense = await rowHeight(page);

    await page.getByRole('button', { name: 'Switch to roomy rows' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable');
    expect(dense).toBeLessThan((await rowHeight(page)) * 0.75);

    // Applied before first paint on the next load (no flash of dense rows)
    await page.goto('/controllers', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable');

    // Going back to dense goes back to the default rather than saving it
    await gotoReady(page, '/controllers');
    await page.getByRole('button', { name: 'Switch to dense rows' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-density', 'compact');
    expect(await page.evaluate(() => localStorage.getItem('awesomeledlist_density'))).toBeNull();
  });

  test('a table on a phone starts with roomy rows, for tapping', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await gotoReady(page, '/controllers');
    await page.getByRole('button', { name: 'Show as a table' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-density', 'comfortable');
    await expect(page.getByRole('button', { name: 'Switch to dense rows' })).toBeVisible();
  });
});

test.describe('Share and export', () => {
  test('copies a Markdown table of what is on screen', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoReady(page, '/controllers?f=wled_compatible:yes&cols=name,price,status');
    const rows = await rowCount(page);

    await page.getByRole('button', { name: 'Share & export' }).click();
    await page.getByRole('menuitem', { name: 'Copy as a Markdown table' }).click();
    await expect(page.locator('.toast')).toContainText('as Markdown');

    // (the Windows clipboard turns line feeds into CRLF)
    const text = await page.evaluate(() => navigator.clipboard.readText());
    const lines = text.split(/\r?\n/);
    expect(lines[0]).toBe('| Name | Price | Status |');
    expect(lines[1]).toBe('| --- | --- | --- |');
    expect(lines.length).toBe(rows + 2);
  });

  test('copies rows that paste into a spreadsheet as cells', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoReady(page, '/level-converters?cols=name,io.channels');
    const rows = await rowCount(page);

    await page.getByRole('button', { name: 'Share & export' }).click();
    await page.getByRole('menuitem', { name: 'Copy for a spreadsheet' }).click();
    await expect(page.locator('.toast')).toContainText('for a spreadsheet');

    const lines = (await page.evaluate(() => navigator.clipboard.readText())).split(/\r?\n/);
    expect(lines[0]).toBe('Name\tChannels');
    expect(lines.length).toBe(rows + 1);
    expect(lines.slice(1).every((line) => line.split('\t').length === 2)).toBe(true);
  });

  test('copies a link that reproduces the view', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await gotoReady(page, '/controllers?sort=price&f=wled_compatible:yes');
    await page.getByRole('button', { name: 'Share & export' }).click();
    await page.getByRole('menuitem', { name: 'Copy link to this view' }).click();
    await expect(page.locator('.toast')).toContainText('link');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  });

  test('downloads the filtered rows as CSV with every field', async ({ page }) => {
    await gotoReady(page, '/controllers?f=wled_compatible:yes');
    const rows = await rowCount(page);

    await page.getByRole('button', { name: 'Share & export' }).click();
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('menuitem', { name: 'CSV — every field' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^controllers_.*WLED.*\.csv$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    const csv = Buffer.concat(chunks).toString('utf-8');
    const header = csv.split('\n')[0];
    // far more fields than the nine default columns
    expect(header.split(',').length).toBeGreaterThan(25);
    expect(header).toContain('Max voltage');
    // one line per row (cells never contain raw newlines here; quoted ones would)
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(rows + 1);
  });

  test('the static exports carry every field', async ({ request }) => {
    const csv = await (await request.get('/controllers.csv')).text();
    expect(csv.split('\n')[0]).toContain('Interfaces');

    const json = await (await request.get('/controllers.json')).json();
    expect(json.license).toBe('ODbL-1.0');
    expect(json.count).toBe(json.entries.length);
    expect(json.entries[0]).toHaveProperty('id');
    expect(json.fields.some((f: { key: string }) => f.key === 'power.voltage.max')).toBe(true);
  });
});
