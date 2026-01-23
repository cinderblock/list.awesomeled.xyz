import { test, expect } from '@playwright/test';

test.describe('Basic functionality', () => {
  test('home page loads with category cards', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Awesome LED List/);
    await expect(page.locator('h1')).toContainText('Awesome LED List');

    // Check that category cards are rendered
    const categoryCards = page.locator('.category-card');
    await expect(categoryCards).toHaveCount(12);

    // Check first card has entry count
    await expect(categoryCards.first()).toContainText('entries');
  });

  test('page has correct meta description', async ({ page }) => {
    await page.goto('/');
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain('addressable LEDs');
  });

  test('navigation to category page works', async ({ page }) => {
    await page.goto('/');

    // Click on Controllers category card
    await page.click('.category-card >> text=Controllers');

    // Wait for navigation
    await expect(page).toHaveURL(/\/controllers/);
    await expect(page.locator('h1')).toContainText('Controllers');

    // Check that table is rendered with entries
    const tableRows = page.locator('.data-table tbody tr');
    await expect(tableRows.first()).toBeVisible();
  });

  test('navigation to entry page works', async ({ page }) => {
    await page.goto('/controllers');

    // Click on first entry link in the table
    const firstLink = page.locator('.data-table tbody tr:first-child td:first-child a');
    await firstLink.click();

    // Should navigate to entry page
    await expect(page.locator('h1')).toBeVisible();

    // Should have breadcrumb with Home link
    await expect(page.locator('nav >> text=Home')).toBeVisible();
  });

  test('about page loads', async ({ page }) => {
    await page.goto('/about');
    await expect(page).toHaveTitle(/About/);
    await expect(page.locator('h1')).toContainText('About');
  });

  test('header has navigation links', async ({ page }) => {
    await page.goto('/');

    // Wait for hydration
    await page.waitForLoadState('networkidle');

    // Should have header element
    await expect(page.locator('header')).toBeVisible();

    // Should have About link
    await expect(page.locator('text=About').first()).toBeVisible();
  });

  test('category nav appears on category pages', async ({ page }) => {
    await page.goto('/controllers');

    // Category nav should be visible
    const categoryTabs = page.locator('.category-tab-colored');
    await expect(categoryTabs.first()).toBeVisible();

    // Active tab should be highlighted
    await expect(page.locator('.category-tab-colored.active >> text=Controllers')).toBeVisible();
  });
});

test.describe('Tab navigation performance', () => {
  test('switching from Controllers to Pixels tab should be fast', async ({ page }) => {
    // Start on Controllers page
    await page.goto('/controllers');
    await expect(page.locator('h1')).toContainText('Controllers');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Find and click the Pixels tab
    const pixelsTab = page.locator('.category-tab-colored >> text=Pixels');
    await expect(pixelsTab).toBeVisible();

    // Capture network requests during navigation
    const requests: { url: string; duration: number }[] = [];
    page.on('requestfinished', async (request) => {
      const timing = request.timing();
      if (timing) {
        requests.push({
          url: request.url(),
          duration: timing.responseEnd - timing.requestStart,
        });
      }
    });

    // Measure time to navigate to Pixels
    const startTime = Date.now();
    await pixelsTab.click();

    // Wait for the Pixels page to load (h1 should change)
    await expect(page.locator('h1')).toContainText('Pixels', { timeout: 10000 });
    const endTime = Date.now();

    const navigationTime = endTime - startTime;
    console.log(`Tab navigation took ${navigationTime}ms`);
    console.log(`Network requests during navigation:`, requests.length);

    // Assert navigation should be under 2 seconds
    expect(navigationTime).toBeLessThan(2000);
  });

  test('multiple tab switches should all be fast', async ({ page }) => {
    // Start on Controllers page
    await page.goto('/controllers');
    await expect(page.locator('h1')).toContainText('Controllers');
    await page.waitForLoadState('networkidle');

    const tabSwitches = [
      { tab: 'Pixels', expected: 'Pixels' },
      { tab: 'Connectors', expected: 'Connectors' },
      { tab: 'DIY MicroBoards', expected: 'DIY MicroBoards' },
      { tab: 'Controllers', expected: 'Controllers' },
    ];

    for (const { tab, expected } of tabSwitches) {
      const tabElement = page.locator(`.category-tab-colored >> text=${tab}`);
      await expect(tabElement).toBeVisible();

      const startTime = Date.now();
      await tabElement.click();
      await expect(page.locator('h1')).toContainText(expected, { timeout: 10000 });
      const endTime = Date.now();

      const navigationTime = endTime - startTime;
      console.log(`Switch to ${tab} took ${navigationTime}ms`);

      // Each tab switch should be under 2 seconds
      expect(navigationTime).toBeLessThan(2000);
    }
  });
});

test.describe('Data loading', () => {
  test('YAML data is loaded correctly', async ({ page }) => {
    await page.goto('/controllers');

    // Should have entries in the table
    const tableRows = page.locator('.data-table tbody tr');
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);

    // Each row should have a name link with entry-link class
    const firstNameLink = tableRows.first().locator('a.entry-link');
    await expect(firstNameLink).toBeVisible();
  });

  test('entry page shows details from YAML', async ({ page }) => {
    // Navigate to a known entry
    await page.goto('/controllers/falcon-f16v4');

    await expect(page.locator('h1')).toContainText('Falcon F16V4');

    // Should show manufacturer in the header
    await expect(page.locator('text=by PixelController')).toBeVisible();
  });

  test('footer is displayed', async ({ page }) => {
    await page.goto('/');

    // Footer should be visible
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('footer')).toContainText('community resource');
  });
});
