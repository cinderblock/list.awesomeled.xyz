import * as Popover from '@radix-ui/react-popover';

/**
 * A small button that reveals extra detail in a popover when tapped or
 * clicked. Unlike a hover tooltip it works on touch screens and from the
 * keyboard, so it is the right home for detail that is worth having but not
 * worth permanent space: a footnote on a value, the rest of a long list, the
 * full text of a truncated cell.
 */
export function MoreInfo({
  label,
  ariaLabel,
  children,
  className,
}: {
  /** What the button shows ("+3", a footnote mark, an icon) */
  label: React.ReactNode;
  /** What the button does, for screen readers ("Show note") */
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`more-info${className ? ` ${className}` : ''}`}
          aria-label={ariaLabel}
          // Rows and cards have their own click behavior
          onClick={(e) => e.stopPropagation()}
        >
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="more-info-popover"
          // A popover is a dialog to a screen reader, and a dialog needs a name
          aria-label="More information"
          sideOffset={4}
          collisionPadding={8}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
          <Popover.Arrow className="more-info-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
