import { test, expect, type Locator, type Page } from '@playwright/test';
import { gotoReady } from './helpers';

// The /protocols explainer: its animations run by themselves unless the
// reader asked for reduced motion, every figure can be stepped through by
// hand, and the interactive ones answer their controls.

const figure = (page: Page, label: RegExp) =>
  page.locator('figure.proto-figure').filter({ has: page.getByRole('img', { name: label }) });
const status = (fig: Locator) => fig.locator('.proto-status');

test.describe('Pixel protocols page', () => {
  test('is in the header, the footer and the search palette', async ({ page }) => {
    await gotoReady(page, '/');
    await page.getByRole('banner').getByRole('link', { name: 'Protocols' }).click();
    await expect(page).toHaveURL(/\/protocols$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pixel protocols');
    await expect(
      page.locator('footer').getByRole('link', { name: 'Pixel protocols' })
    ).toBeVisible();
    const contents = page.getByRole('navigation', { name: 'On this page' });
    for (const link of await contents.getByRole('link').all()) {
      const target = (await link.getAttribute('href'))!;
      await expect(page.locator(target), `section ${target}`).toHaveCount(1);
    }

    await gotoReady(page, '/about');
    await page.keyboard.press('Control+k');
    const palette = page.getByRole('dialog', { name: 'Search the Awesome LED List' });
    await palette.getByRole('combobox').fill('protocols');
    await palette.getByRole('option', { name: /Pixel protocols/ }).click();
    await expect(page).toHaveURL(/\/protocols$/);
  });

  test('the animations play by themselves and pause when asked', async ({ page }) => {
    await gotoReady(page, '/protocols');
    const chain = figure(page, /down a chain/);
    await chain.scrollIntoViewIfNeeded();
    const first = await status(chain).textContent();
    await expect.poll(() => status(chain).textContent(), { timeout: 10_000 }).not.toBe(first);
    await chain.getByRole('button', { name: 'Pause animation' }).click();
    const paused = await status(chain).textContent();
    await page.waitForTimeout(1200);
    expect(await status(chain).textContent()).toBe(paused);
    await expect(chain.getByRole('button', { name: 'Play animation' })).toBeVisible();
  });

  test('with reduced motion nothing moves until the reader steps or plays', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoReady(page, '/protocols');
    const bits = figure(page, /pulses on the data line/);
    await bits.scrollIntoViewIfNeeded();
    const still = await status(bits).textContent();
    await page.waitForTimeout(1500);
    expect(await status(bits).textContent()).toBe(still);
    await bits.getByRole('button', { name: 'Next bit' }).click();
    await expect(status(bits)).toHaveText(/^Bit 1 of 24/);
    await bits.getByRole('button', { name: 'Next bit' }).click();
    await expect(status(bits)).toHaveText(/^Bit 2 of 24/);
  });

  test('picking a colour sends its bytes', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoReady(page, '/protocols');
    const bits = figure(page, /pulses on the data line/);
    await bits.getByRole('button', { name: 'Teal' }).click();
    await expect(bits.getByRole('button', { name: 'Teal' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(bits.getByRole('img')).toHaveAccessibleName(/teal/);
  });

  test('a stalled sender corrupts the single wire but not the clocked line', async ({ page }) => {
    await gotoReady(page, '/protocols');
    const hiccup = page.locator('figure.proto-figure').filter({ hasText: 'Sender stalls' });
    await expect(status(hiccup)).toHaveText(/single wire now reads \d+ instead of \d+/);
    await hiccup.getByRole('checkbox').uncheck();
    await expect(status(hiccup)).toHaveText(/^Both lines read/);
  });

  test('breaking pixels on a backup-line chain', async ({ page }) => {
    await gotoReady(page, '/protocols');
    const backup = page.locator('figure.proto-figure').filter({ hasText: 'Break pixel 1' });
    // Pixel 3 starts broken and is bridged
    await expect(status(backup)).toHaveText(/switches to the backup input/);
    await backup.getByRole('button', { name: 'Break pixel 4' }).click();
    await expect(status(backup)).toHaveText(/two broken pixels in a row/);
    await backup.getByRole('button', { name: 'Repair pixel 3' }).click();
    await backup.getByRole('button', { name: 'Repair pixel 4' }).click();
    await expect(status(backup)).toHaveText(/^All pixels work/);
  });

  test('SK9822s run an update behind until the reset frame is added', async ({ page }) => {
    await gotoReady(page, '/protocols');
    const chain = figure(page, /clocked pixels in a chain/);
    await chain.getByRole('button', { name: 'SK9822' }).click();
    await expect(chain.getByRole('button', { name: 'SK9822' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(status(chain)).toHaveText(/one update behind/);
    await chain.getByRole('checkbox', { name: 'Reset frame' }).check();
    await expect(status(chain)).toHaveText(/with a reset frame/);
  });

  test('leaving datasheets out of the timing comparison', async ({ page }) => {
    await gotoReady(page, '/protocols');
    const chart = page.locator('figure.proto-windows');
    const summary = status(chart);
    await expect(summary).toHaveText(/a 1 they all accept is none/);
    // Leave out the sheets with the shortest and the longest 1s, and the
    // others agree on one
    for (const name of [/WS2816B, WS2816C/, 'INK1003', 'TX1818']) {
      await chart.getByRole('button', { name }).click();
    }
    await expect(summary).toHaveText(/a 1 they all accept is \d+–\d+ ns/);
    await expect(chart.getByRole('button', { name: 'INK1003' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  test('every footnote points at an entry in the sources list', async ({ page }) => {
    await gotoReady(page, '/protocols');
    const targets = await page
      .locator('.proto-cite a')
      .evaluateAll((links) => [...new Set(links.map((a) => a.getAttribute('href')))]);
    expect(targets.length).toBeGreaterThan(10);
    // Source ids contain dots ("e1.11-2024"), so match the id attribute, not a #selector
    for (const href of targets)
      await expect(page.locator(`[id="${href!.slice(1)}"]`)).toHaveCount(1);
  });

  test('no console errors, and nothing scrolls sideways on a phone', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 360, height: 800 });
    await gotoReady(page, '/protocols');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      )
    ).toBe(0);
    expect(errors).toEqual([]);
  });
});
