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

/**
 * Format a Date as YYYY-MM-DD in the viewer's local timezone.
 *
 * Local-time output is timezone-dependent, so it must NOT be used during SSR
 * (it would differ from client hydration and trigger React error #418). Render
 * it only after mount — see the LocalDate component, which falls back to
 * formatDateYMD (UTC) on the server and swaps to this once hydrated.
 */
export function formatDateYMDLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
