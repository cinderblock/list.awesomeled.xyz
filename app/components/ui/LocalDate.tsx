import { useSyncExternalStore } from 'react';
import { formatDateYMD, formatDateYMDLocal } from '~/lib/format';

const emptySubscribe = () => () => {};

/**
 * Renders a date as YYYY-MM-DD in the viewer's local timezone.
 *
 * Dates are always displayed local. But local formatting is timezone-dependent,
 * so SSR (server's TZ) and client hydration (browser's TZ) would disagree and
 * trigger React hydration error #418. To stay deterministic, this renders the
 * UTC day on the server / first paint, then swaps to the local day after mount.
 */
export function LocalDate({ date, className }: { date: Date; className?: string }) {
  // false on the server and during hydration, true after mount — matches the
  // ThemeToggle pattern, so the hydration render agrees with the server HTML.
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <time className={className} dateTime={date.toISOString()}>
      {mounted ? formatDateYMDLocal(date) : formatDateYMD(date)}
    </time>
  );
}
