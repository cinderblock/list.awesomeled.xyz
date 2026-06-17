/**
 * Format a Date as YYYY-MM-DD in UTC.
 *
 * UTC (not local time) so that server-side rendering and client hydration
 * produce identical strings regardless of the server's vs. the browser's
 * timezone — avoids React hydration mismatches (error #418).
 */
export function formatDateYMD(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
