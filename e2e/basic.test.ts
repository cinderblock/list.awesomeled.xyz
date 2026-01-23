import { test, expect } from "@playwright/test";

test.describe("Basic functionality", () => {
  test("home page loads with category cards", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Awesome LED List/);
    await expect(page.locator("h1")).toContainText("Awesome LED List");

    // Check that category cards are rendered
    const categoryCards = page.locator(".category-card");
    await expect(categoryCards).toHaveCount(12);

    // Check first card has entry count
    await expect(categoryCards.first()).toContainText("entries");
  });

  test("page has correct meta description", async ({ page }) => {
    await page.goto("/");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toContain("addressable LEDs");
  });

  test("navigation to category page works", async ({ page }) => {
    await page.goto("/");

    // Click on Controllers category
    await page.click('a[href="/controllers"]');

    // Wait for navigation
    await expect(page).toHaveURL(/\/controllers/);
    await expect(page.locator("h1")).toContainText("Controllers");

    // Check that table is rendered with entries
    const tableRows = page.locator(".data-table tbody tr");
    await expect(tableRows.first()).toBeVisible();
  });

  test("navigation to entry page works", async ({ page }) => {
    await page.goto("/controllers");

    // Click on first entry link
    await page.click(".data-table tbody tr:first-child a");

    // Should navigate to entry page
    await expect(page.locator("h1")).toBeVisible();

    // Should have breadcrumb navigation
    await expect(page.locator('a[href="/"]')).toContainText("Home");
    await expect(page.locator('a[href="/controllers"]')).toContainText("Controllers");
  });

  test("about page loads", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/About/);
    await expect(page.locator("h1")).toContainText("About");
  });
});

test.describe("Data loading", () => {
  test("YAML data is loaded correctly", async ({ page }) => {
    await page.goto("/controllers");

    // Should have entries in the table
    const tableRows = page.locator(".data-table tbody tr");
    const count = await tableRows.count();
    expect(count).toBeGreaterThan(0);

    // Each row should have a name link
    const firstNameLink = tableRows.first().locator("a");
    await expect(firstNameLink).toBeVisible();
  });

  test("entry page shows details from YAML", async ({ page }) => {
    // Navigate to a known entry
    await page.goto("/controllers/falcon-f16v4");

    await expect(page.locator("h1")).toContainText("Falcon F16V4");

    // Should show manufacturer in the header
    await expect(page.locator("text=by PixelController")).toBeVisible();
  });
});
