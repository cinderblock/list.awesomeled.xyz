import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers';

test.describe('Entry page', () => {
  test('field labels are worded, not raw keys with capitals', async ({ page }) => {
    await gotoReady(page, '/microboards/beaglebone-black');
    const labels = (await page.locator('.detail-key--label').allInnerTexts()).map((text) =>
      text.trim()
    );
    expect(labels.length).toBeGreaterThan(5);

    // No YAML key leaks through, and acronyms keep their casing: the page
    // used to capitalize each word of the key ("Gpio Voltage", "Soc", "Cpu").
    // (Which fields the entry has is the database's business, so this checks
    // the wording of whatever is there.)
    for (const label of labels) {
      expect(label).not.toMatch(/_/);
      expect(label).not.toMatch(/\b(Soc|Cpu|Gpio|Usb|Wifi|Isa|Bms|Imu|Ic|Pwm|Dmx)\b/);
      expect(label).toMatch(/^[A-Z0-9]/);
    }
  });

  test('long web addresses read as where they go and fit their card', async ({ page }) => {
    await gotoReady(page, '/microboards/beaglebone-black');
    // Nothing on the page is wider than the window, at desktop or phone width
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 800 });
      // Polled: the layout takes a moment to settle after the resize
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), {
          message: `at ${width}px`,
        })
        .toBeLessThanOrEqual(0);
    }
  });
});
