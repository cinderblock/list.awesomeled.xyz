import type { Locator, Page } from '@playwright/test';

/**
 * Open a page and wait until React has hydrated it. The site is prerendered,
 * so it looks ready before its buttons do anything; clicking earlier is lost.
 */
export async function gotoReady(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.locator('html[data-hydrated]').waitFor({ state: 'attached' });
}

/** The real table header (not its sticky clone). */
export function headerCell(page: Page, columnKey: string): Locator {
  return page.locator(`.data-table-container thead th[data-col="${columnKey}"]`);
}

/** Labels of the visible columns, left to right. */
export async function columnLabels(page: Page): Promise<string[]> {
  const cells = page.locator('.data-table-container thead th');
  return (await cells.allInnerTexts()).map((text) => text.trim());
}

/** Trimmed text of every body cell in a column. */
export async function columnTexts(page: Page, columnKey: string): Promise<string[]> {
  return page
    .locator(`.data-table-container tbody td[data-col="${columnKey}"]`)
    .evaluateAll((cells) => cells.map((cell) => (cell.textContent ?? '').trim()));
}

/** Number of data rows in the table. */
export function rowCount(page: Page): Promise<number> {
  return page.locator('.data-table-container tbody tr[data-row-id]').count();
}

/** The search params of the current URL, decoded. */
export function searchParams(page: Page): URLSearchParams {
  return new URL(page.url()).searchParams;
}
