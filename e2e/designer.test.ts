import { readFileSync } from 'node:fs';
import { test, expect as baseExpect, type Page } from '@playwright/test';

// These tests name parts by id but never assert exact numbers from the
// database: other people correct datasheet values all the time. Exact maths
// is covered by the unit tests (tests/unit), which use synthetic fixtures.

// These flows are long, and the dev server rebuilds the part catalog on every
// page load: leave room for a busy machine.
test.describe.configure({ timeout: 90_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

const DESIGN = 'p=ws2812&x=8&n=500&c=falcon-f16v5&g=xlights';

/** The address bar follows the design a moment later: wait for it */
function search(page: Page) {
  return expect.poll(() => new URL(page.url()).search);
}

/** Start every navigation of this page with no saved draft */
async function withoutDraft(page: Page) {
  await page.addInitScript(() => window.localStorage.clear());
}

/** Open the designer and wait until it is interactive */
async function open(page: Page, url = '/designer') {
  await page.goto(url);
  await expect(page.locator('.designer-page[data-ready]')).toBeVisible();
}

function slot(page: Page, id: string) {
  return page.locator(`#slot-${id}`);
}

/** Open a slot's picker and return its panel */
async function openPicker(page: Page, id: string) {
  await slot(page, id).locator('.designer-slot-toggle').click();
  const panel = page.locator(`#slot-${id}-panel`);
  await expect(panel).toBeVisible();
  return panel;
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('System Designer: building a design', () => {
  test.beforeEach(async ({ page }) => withoutDraft(page));

  test('pixels, layout, controller and source, start to finish', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, '/designer');
    await expect(page.locator('h1')).toContainText('System Designer');
    await expect(page.getByTestId('total-pixels')).toHaveText('0');

    // Pixel type
    const pixels = await openPicker(page, 'g0-pixels');
    await pixels.getByLabel('Search pixel types').fill('ws2812');
    await pixels.locator('[data-id="ws2812"]').click();
    await expect(pixels).toBeHidden();
    await expect(slot(page, 'g0-pixels')).toContainText('WS2812');
    await expect(page).toHaveURL(/[?&]p=ws2812(&|$)/);

    // Layout
    await page.getByLabel('Number of strings').fill('8');
    await page.getByLabel('Pixels per string').fill('500');
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
    await expect(slot(page, 'g0-layout')).toContainText('fps');

    // Controller
    const controllers = await openPicker(page, 'g0-controller');
    await controllers.getByLabel('Search controllers').fill('falcon f16v5');
    await controllers.locator('[data-id="falcon-f16v5"] > button').click();
    await expect(controllers).toBeHidden();
    await expect(slot(page, 'g0-controller')).toContainText('Falcon F16V5');
    await expect(slot(page, 'g0-controller')).toContainText('8 of 16 outputs used');

    // Pattern source
    const sources = await openPicker(page, 'system-source');
    await sources.locator('[data-id="xlights"] > button').click();
    await expect(slot(page, 'system-source')).toContainText('xLights');

    // The link carries the whole design, in the same form the first version wrote
    await search(page).toBe(`?${DESIGN}`);

    // Parts list and diagram follow
    const bom = page.locator('#designer-bom');
    await expect(bom.locator('[data-key="pixel:ws2812@5"]')).toContainText('4,000');
    await expect(bom.locator('[data-key="controller:falcon-f16v5"]')).toContainText('Falcon F16V5');
    await expect(bom.locator('[data-key="source:xlights"]')).toContainText('xLights');
    await expect(page.getByTestId('bom-total')).toContainText('$');
    const diagram = page.locator('#designer-diagram svg.dgm');
    await expect(diagram).toContainText('Falcon F16V5');
    await expect(diagram).toContainText('WS2812');
    await expect(diagram).toContainText('xLights');

    expect(errors).toEqual([]);
  });

  test('number fields can be cleared and retyped', async ({ page }) => {
    await open(page, '/designer?p=ws2812&x=4&n=250');
    const perString = page.getByLabel('Pixels per string');
    await perString.fill('');
    // An empty field is not a layout: the design keeps its last valid value
    await expect(page.getByTestId('total-pixels')).toHaveText('1,000');
    await perString.pressSequentially('120');
    await expect(page.getByTestId('total-pixels')).toHaveText('480');
    await perString.blur();
    await expect(perString).toHaveValue('120');
    await expect(page).toHaveURL(/[?&]n=120(&|$)/);
  });

  test('strings of different lengths', async ({ page }) => {
    await open(page, '/designer?p=ws2812&x=3&n=100');
    await page.getByRole('button', { name: 'different lengths' }).click();
    const lengths = page.getByLabel('Pixels on each string, separated by commas');
    await expect(lengths).toHaveValue('100, 100, 100');
    await lengths.fill('150, 200, 80');
    await expect(page.getByTestId('total-pixels')).toHaveText('430');
    await expect(page).toHaveURL(/[?&]n=150\.200\.80(&|$)/);
  });

  test('a second pixel group, sharing the controller', async ({ page }) => {
    await open(page, '/designer?p=ws2812&x=8&n=100&c=falcon-f16v5');
    await page.getByRole('button', { name: /Add a pixel group/ }).click();
    await expect(page.locator('.designer-group[data-group]')).toHaveCount(2);

    // The new group's pixel picker opens by itself
    const pixels = page.locator('#slot-g1-pixels-panel');
    await expect(pixels).toBeVisible();
    await pixels.locator('[data-id="ws2815"]').click();
    const controllers = await openPicker(page, 'g1-controller');
    await controllers.getByLabel('Search controllers').fill('falcon f16v5');
    await controllers.locator('[data-id="falcon-f16v5"] > button').click();

    // 8 + 1 strings on one 16-output controller, two supply rails
    await expect(slot(page, 'g1-controller')).toContainText('9 of 16 outputs used');
    await expect(slot(page, 'g1-controller')).toContainText('shared with');
    await expect(page.locator('#designer-power [data-rail]')).toHaveCount(2);
    await expect(page.locator('#designer-checks [data-code="mixed-rails"]')).toBeVisible();
    await expect
      .poll(() => new URL(page.url()).searchParams.getAll('p'))
      .toEqual(['ws2812', 'ws2815']);

    await page.getByRole('button', { name: 'Remove Group 2' }).click();
    await expect(page.locator('.designer-group[data-group]')).toHaveCount(1);
    await expect.poll(() => new URL(page.url()).searchParams.getAll('p')).toEqual(['ws2812']);
  });

  test('a driver IC runs at the string voltage you choose', async ({ page }) => {
    await open(page, '/designer?p=ic-ws2811&x=1&n=100');
    const pixelSlot = slot(page, 'g0-pixels');
    await expect(pixelSlot).toContainText('WS2811');
    await expect(pixelSlot).toContainText('driver IC');
    const voltages = pixelSlot.getByRole('group', { name: 'String voltage' });
    await expect(voltages.getByRole('button', { name: '12 V' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await voltages.getByRole('button', { name: '5 V' }).click();
    await expect(page).toHaveURL(/[?&]v=5(&|$)/);
    await expect(page.locator('#designer-power [data-rail="5"]')).toBeVisible();
  });

  test('examples load as ordinary links', async ({ page }) => {
    await open(page, '/designer');
    await page.locator('.designer-examples a').first().click();
    await expect(page).toHaveURL(/[?&]p=/);
    await expect(page.getByTestId('total-pixels')).not.toHaveText('0');
    await expect(page.locator('.designer-examples')).toHaveCount(0);
  });
});

test.describe('System Designer: links', () => {
  test.beforeEach(async ({ page }) => withoutDraft(page));

  test('a link made by the first version of the designer still opens', async ({ page }) => {
    await open(page, `/designer?${DESIGN}`);
    await expect(slot(page, 'g0-pixels')).toContainText('WS2812');
    await expect(slot(page, 'g0-controller')).toContainText('Falcon F16V5');
    await expect(slot(page, 'system-source')).toContainText('xLights');
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
  });

  test('a part that left the database is reported, not dropped silently', async ({ page }) => {
    await open(page, '/designer?p=no-such-pixel&x=1&n=10&c=no-such-controller');
    await expect(slot(page, 'g0-pixels')).toContainText('no longer in the database');
    await expect(slot(page, 'g0-controller')).toContainText('no longer in the database');
    await expect(page.locator('#designer-checks [data-code="missing-part"]')).toHaveCount(2);
  });

  test('Copy link puts the design on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, `/designer?${DESIGN}`);
    await page.getByRole('button', { name: 'Copy link' }).click();
    await expect(page.locator('.designer-notice--ok')).toContainText('Link copied');
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(`/designer?${DESIGN}`);
  });

  test('a deep link produces no console errors', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, `/designer?${DESIGN}&l=sn74ahct125n&k=pigtails&b=40&o=1&t=Test`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
    expect(errors).toEqual([]);
  });
});

test.describe('System Designer: checks', () => {
  test.beforeEach(async ({ page }) => withoutDraft(page));

  test('power warnings scale with pixel count', async ({ page }) => {
    const checks = page.locator('#designer-checks');

    // 30 RGB pixels stay under ~20 W whatever the exact datasheet current
    await open(page, '/designer?p=ws2812&x=1&n=30');
    await expect(page.getByTestId('total-pixels')).toHaveText('30');
    await expect(checks.locator('[data-code="power-advisory"]')).toHaveCount(0);
    await expect(checks.locator('[data-code="power-strong"]')).toHaveCount(0);

    // 150 pixels: tens of watts -> advisory
    await open(page, '/designer?p=ws2812&x=1&n=150');
    await expect(checks.locator('[data-code="power-advisory"]')).toContainText('20 W');
    await expect(checks.locator('[data-code="power-strong"]')).toHaveCount(0);

    // 4,000 pixels: far beyond 200 W -> strong warning, and injection guidance
    await open(page, '/designer?p=ws2812&x=8&n=500');
    await expect(checks.locator('[data-code="power-strong"]')).toContainText('serious power');
    await expect(checks.locator('[data-code="injection"]')).toBeVisible();
    await expect(page.locator('#designer-power')).toContainText('Fuse each feed');
  });

  test('designing for lower brightness shrinks the supply, not the warning', async ({ page }) => {
    await open(page, '/designer?p=ws2812&x=8&n=500');
    const supply = page.locator('#designer-power [data-rail="5"]');
    const before = await supply.textContent();
    await page.getByLabel('Design brightness in percent').fill('25');
    await expect(page).toHaveURL(/[?&]b=25(&|$)/);
    await expect(supply).not.toHaveText(before ?? '');
    await expect(page.locator('#designer-checks [data-code="power-strong"]')).toBeVisible();
  });

  test('a clocked pixel on a data-only controller is an error', async ({ page }) => {
    await open(page, '/designer?p=apa102&x=1&n=100&c=baldrick-17');
    await expect(slot(page, 'g0-controller').locator('[data-code="clock-line"]')).toBeVisible();
    await expect(page.locator('.designer-status--error')).toContainText('problem');

    // The picker keeps what can't work out of the way, but explains it on request
    const controllers = await openPicker(page, 'g0-controller');
    await controllers.getByRole('button', { name: /that can’t/ }).click();
    await expect(
      controllers.locator('.designer-options--unfit .designer-option').first()
    ).toBeVisible();
  });

  test('a 3.3 V board driving 5 V pixels asks for a level shifter', async ({ page }) => {
    await open(page, '/designer?p=apa102&x=2&n=144&c=mb-esp-32s');
    const shifterSlot = slot(page, 'g0-shifter');
    await expect(shifterSlot.locator('[data-code="level-shift"]')).toBeVisible();

    const shifters = await openPicker(page, 'g0-shifter');
    await shifters.locator('[data-id="sn74ahct125n"] > button').click();
    await expect(shifterSlot.locator('[data-code="level-shift"]')).toHaveCount(0);
    await expect(shifterSlot).toContainText('SN74AHCT125N');
    await expect(page).toHaveURL(/[?&]l=sn74ahct125n(&|$)/);
    await expect(page.locator('#designer-bom [data-key="shifter:sn74ahct125n"]')).toBeVisible();
    await expect(page.locator('#designer-diagram svg.dgm')).toContainText('SN74AHCT125N');
  });

  test('outdoors, connectors are checked for sealing', async ({ page }) => {
    await open(page, '/designer?p=ws2812&x=2&n=100&k=dupont');
    const connectorSlot = slot(page, 'g0-connector');
    await expect(connectorSlot.locator('[data-code="connector-ip"]')).toHaveCount(0);
    await page.getByLabel('Installed outdoors').check();
    await expect(page).toHaveURL(/[?&]o=1(&|$)/);
    await expect(connectorSlot.locator('[data-code="connector-ip"]')).toBeVisible();
  });

  test('clicking a check jumps to the slot it is about', async ({ page }) => {
    await open(page, '/designer?p=apa102&x=1&n=100&c=baldrick-17');
    await page.locator('#designer-checks [data-code="clock-line"] button').click();
    await expect(slot(page, 'g0-controller')).toBeInViewport();
  });
});

test.describe('System Designer: saving and sharing', () => {
  test('a design is offered again after leaving, and Start over can be undone', async ({
    page,
  }) => {
    await open(page, '/designer');
    await page.evaluate(() => window.localStorage.clear());
    await open(page, `/designer?${DESIGN}`);
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');

    // A bare link starts empty and offers the draft instead of applying it
    await open(page, '/designer');
    await expect(page.getByTestId('total-pixels')).toHaveText('0');
    await expect(page.getByTestId('draft-notice')).toBeVisible();
    await page.getByRole('button', { name: 'Continue it' }).click();
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
    await expect(page).toHaveURL(/[?&]c=falcon-f16v5/);

    // Start over clears it, with a way back
    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByTestId('total-pixels')).toHaveText('0');
    await search(page).toBe('');
    await page.getByRole('button', { name: 'Undo' }).click();
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
  });

  test('a downloaded SVG opens as the same design', async ({ page }) => {
    await withoutDraft(page);
    await open(page, `/designer?${DESIGN}&t=Round+trip`);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download SVG' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('round-trip.svg');
    const path = await download.path();
    const svg = readFileSync(path, 'utf8');
    expect(svg).toContain('<svg');
    expect(svg).toContain('id="awesomeled-design"');
    expect(svg).toContain('Falcon F16V5');
    // Self-contained: nothing is loaded from the site
    expect(svg).not.toMatch(/href="\/database-images/);

    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByTestId('total-pixels')).toHaveText('0');
    await page.getByLabel('Open a design from a downloaded SVG or PNG').setInputFiles(path);
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
    await expect(slot(page, 'g0-controller')).toContainText('Falcon F16V5');
    await expect(page.getByLabel('Design name')).toHaveValue('Round trip');
  });

  test('a downloaded PNG opens as the same design', async ({ page }) => {
    await withoutDraft(page);
    await open(page, `/designer?${DESIGN}`);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download PNG' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('led-system.png');
    const path = await download.path();
    const png = readFileSync(path);
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.includes(Buffer.from('awesomeled-design'))).toBe(true);
    // A real picture, not an empty canvas
    expect(png.length).toBeGreaterThan(5000);

    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByTestId('total-pixels')).toHaveText('0');
    await page.getByLabel('Open a design from a downloaded SVG or PNG').setInputFiles(path);
    await expect(page.getByTestId('total-pixels')).toHaveText('4,000');
    await expect(slot(page, 'system-source')).toContainText('xLights');
  });

  test('a file that is not a design is refused with a reason', async ({ page }) => {
    await withoutDraft(page);
    await open(page, '/designer');
    await page.getByLabel('Open a design from a downloaded SVG or PNG').setInputFiles({
      name: 'drawing.svg',
      mimeType: 'image/svg+xml',
      buffer: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>'
      ),
    });
    await expect(page.locator('.designer-notice--error')).toContainText('No design found');
  });

  test('the parts list exports as CSV and Markdown', async ({ page, context }) => {
    await withoutDraft(page);
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await open(page, `/designer?${DESIGN}`);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download CSV' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('led-system-parts.csv');
    const csv = readFileSync(await download.path(), 'utf8');
    expect(csv.split('\r\n')[0]).toContain('Section,Category,Part');
    expect(csv).toContain('Falcon F16V5');
    expect(csv).toContain('/controllers/falcon-f16v5');

    await page.getByRole('button', { name: 'Copy as Markdown' }).click();
    await expect(page.locator('#designer-bom .designer-feedback')).toContainText('Copied');
    const markdown = await page.evaluate(() => navigator.clipboard.readText());
    expect(markdown).toContain('| Qty | Part | Category | Unit | Total |');
    expect(markdown).toContain('[WS2812]');
    expect(markdown).toContain(`/designer?${DESIGN}`);
  });
});

test.describe('System Designer: on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test.beforeEach(async ({ page }) => withoutDraft(page));

  test('the whole flow works and the page never scrolls sideways', async ({ page }) => {
    const errors = collectErrors(page);
    await open(page, '/designer');

    const pixels = await openPicker(page, 'g0-pixels');
    await pixels.locator('[data-id="sk6812"]').tap();
    await page.getByLabel('Number of strings').fill('4');
    await page.getByLabel('Pixels per string').fill('300');

    const controllers = await openPicker(page, 'g0-controller');
    await controllers
      .locator('.designer-option:not(.designer-option--unfit) > button')
      .first()
      .tap();
    await expect(slot(page, 'g0-controller').locator('.designer-part-name')).toBeVisible();

    // The summary bar keeps the totals in reach and jumps to the checks
    const bar = page.locator('.designer-mobile-bar');
    await expect(bar).toBeVisible();
    await expect(bar).toContainText('1,200');
    await bar.tap();
    await expect(page.locator('#designer-checks')).toBeInViewport();

    // Nothing of the designer's may stick out past the screen edge. (The
    // diagram scrolls sideways inside its own box, by design.)
    for (const id of ['designer-power', 'designer-bom', 'designer-diagram']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      const sticking = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const out: string[] = [];
        for (const el of document.querySelectorAll('.designer-page *')) {
          if (el.closest('.designer-diagram-scroll')) continue;
          const box = el.getBoundingClientRect();
          if (box.width > 0 && box.right > width + 1) {
            out.push(`${el.tagName.toLowerCase()}.${String(el.getAttribute('class'))}`);
          }
        }
        return out.slice(0, 5);
      });
      expect(sticking, `wider than the screen with #${id} in view`).toEqual([]);
    }
    expect(errors).toEqual([]);
  });

  test('Escape closes an open picker', async ({ page }) => {
    await open(page, '/designer?p=ws2812&x=1&n=60');
    const controllers = await openPicker(page, 'g0-controller');
    await controllers.getByLabel('Search controllers').press('Escape');
    await expect(controllers).toBeHidden();
  });
});
