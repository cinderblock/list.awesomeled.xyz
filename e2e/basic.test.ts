import { test, expect } from "@playwright/test";

test.describe("Basic functionality", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Awesome LED List/);
    await expect(page.locator("h1")).toContainText("Awesome LED List");
  });

  test("page has correct meta description", async ({ page }) => {
    await page.goto("/");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toContain("addressable LEDs");
  });
});
