interface RainbowTextProps {
  children: string;
  className?: string;
}

export function RainbowText({ children, className = '' }: RainbowTextProps) {
  const letters = children.split('');
  const hueSpread = 360;

  return (
    <span className={className}>
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
