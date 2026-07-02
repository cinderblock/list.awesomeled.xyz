import * as RadixTooltip from '@radix-ui/react-tooltip';

/**
 * Styled tooltip (replaces the browser's ugly `title=` bubbles).
 * Only use for EXTRA information — never to repeat the trigger's own label.
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
    <RadixTooltip.Provider delayDuration={250}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content className="ui-tooltip" sideOffset={6} collisionPadding={8}>
            {content}
            <RadixTooltip.Arrow className="ui-tooltip-arrow" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
