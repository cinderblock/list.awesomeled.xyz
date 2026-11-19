import { test, expect } from '@playwright/test';

// These tests name parts by id but never assert exact numbers from the
// database: other people correct datasheet values all the time. Exact maths
// is covered by the unit tests (tests/unit), which use synthetic fixtures.

test.describe('System Designer', () => {
  test.beforeEach(async ({ page }) => {
    // A saved draft would otherwise leak between tests through localStorage
    await page.addInitScript(() => window.localStorage.clear());
  });

  test('a shared link restores the design', async ({ page }) => {
    await page.goto('/designer?p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights');

    await expect(page.locator('h1')).toContainText('System Designer');
    await expect(page.locator('.designer-chain--active')).toContainText('8 × 500 WS2812');
    await expect(page.locator('.designer-chain--active')).toContainText('Falcon F16V5');
    await expect(page.locator('.designer-power')).toContainText('4,000');
  });

  test('power warnings scale with pixel count', async ({ page }) => {
    const strong = page.locator('.designer-summary .designer-warning--strong');
    const advisory = page.locator('.designer-summary .designer-warning--advisory');

    // 30 RGB pixels stay under ~20 W whatever the exact datasheet current
    await page.goto('/designer?p=ws2812&x=1&n=30');
    await expect(page.locator('.designer-power')).toContainText('30');
    await expect(strong).toHaveCount(0);
    await expect(advisory).toHaveCount(0);

    // 150 pixels: tens of watts -> advisory
    await page.goto('/designer?p=ws2812&x=1&n=150');
    await expect(advisory).toContainText('20 W');
    await expect(strong).toHaveCount(0);

    // 4,000 pixels: far beyond 200 W -> strong warning
    await page.goto('/designer?p=ws2812&x=8&n=500');
    await expect(strong).toContainText('serious power');
  });

  test('full-white power counts every colour channel', async ({ page }) => {
    await page.goto('/designer?p=ws2812&x=1&n=150');
    await expect(page.locator('.designer-step').nth(1)).toContainText('3 channels');
  });

  test('a deep link produces no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/designer?p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.designer-power')).toContainText('4,000');

    expect(errors).toEqual([]);
  });
});
