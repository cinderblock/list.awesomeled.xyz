import { useRainbow, useRainbowScope } from '~/context/RainbowContext';

interface RainbowTextProps {
  children: string;
  className?: string;
}

export function RainbowText({ children, className = '' }: RainbowTextProps) {
  const scopeRef = useRainbowScope();
  // First tap on any rainbow text doubles as the user gesture iOS needs
  // before it will deliver tilt events (no-op everywhere else)
  const { requestTilt } = useRainbow();
  const letters = children.split('');
  const hueSpread = 360;

  return (
    <span ref={scopeRef} className={className} onClick={requestTilt}>
      {letters.map((letter, index) => {
        // Calculate offset for this letter (static, doesn't change)
        const letterOffset = (index / letters.length) * hueSpread;

        return (
          <span
            key={index}
            className="rainbow-letter"
            style={
              {
                // Use CSS calc to add offset to the animated --rainbow-hue
                '--letter-hue': `calc(var(--rainbow-hue, 0) + ${letterOffset})`,
              } as React.CSSProperties
            }
          >
            {letter}
          </span>
        );
      })}
    </span>
  );
}
