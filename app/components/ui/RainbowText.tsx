import { useRainbow } from "~/context/RainbowContext";

interface RainbowTextProps {
  children: string;
  className?: string;
}

export function RainbowText({ children, className = "" }: RainbowTextProps) {
  const { hue } = useRainbow();
  const letters = children.split("");
  const hueSpread = 360;

  return (
    <span className={className}>
      {letters.map((letter, index) => {
        const letterHue = (hue + (index / letters.length) * hueSpread) % 360;

        return (
          <span
            key={index}
            className="rainbow-letter"
            style={{
              "--letter-hue": letterHue,
            } as React.CSSProperties}
          >
            {letter}
          </span>
        );
      })}
    </span>
  );
}
