import * as RadixTooltip from '@radix-ui/react-tooltip';

/**
 * One provider for every tooltip on the page (mounted by the layout). A
 * provider per tooltip made each table row carry several of them, which
 * showed up as slow renders on the big tables.
 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <RadixTooltip.Provider delayDuration={250}>{children}</RadixTooltip.Provider>;
}

/**
 * Styled tooltip (replaces the browser's ugly `title=` bubbles).
 * Only use for EXTRA information — never to repeat the trigger's own label.
 * Hover and keyboard focus only: anything a touch user needs belongs inline
 * or behind a tap (see MoreInfo).
 * Renders children unwrapped when there is no content.
 */
export function Tooltip({
  content,
  children,
}: {
  content: React.ReactNode;
  children: React.ReactElement;
}) {
  if (content == null || content === '') return children;
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content className="ui-tooltip" sideOffset={6} collisionPadding={8}>
          {content}
          <RadixTooltip.Arrow className="ui-tooltip-arrow" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
