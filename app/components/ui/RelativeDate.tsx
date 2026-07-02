import { formatDateYMD, formatDateYMDLocal } from '~/lib/format';
import { Tooltip } from '~/components/ui/Tooltip';
import { useNow } from '~/hooks/useNow';

function relativeLabel(date: Date, now: number): string {
  const days = Math.floor((now - date.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 60) return `${days} days ago`;
  if (days < 365) return `${Math.round(days / 30.44)} months ago`;
  const years = days / 365.25;
  return years < 10 ? `${Math.round(years * 2) / 2} years ago` : `${Math.round(years)} years ago`;
}

/**
 * "3 days ago" / "2 months ago" with the actual date in a tooltip.
 * Relative wording depends on "now", so the server/first paint renders the
 * absolute date (deterministic for hydration) and swaps to relative once
 * mounted, when the effect captures the client clock.
 */
export function RelativeDate({ date, className }: { date: Date; className?: string }) {
  const now = useNow();

  if (now === 0) {
    return (
      <time className={className} dateTime={date.toISOString()}>
        {formatDateYMD(date)}
      </time>
    );
  }
  return (
    <Tooltip content={formatDateYMDLocal(date)}>
      <time className={className} dateTime={date.toISOString()}>
        {relativeLabel(date, now)}
      </time>
    </Tooltip>
  );
}
