import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";

interface RainbowContextType {
  hue: number;
  isMouseOnPage: boolean;
}

const RainbowContext = createContext<RainbowContextType>({ hue: 0, isMouseOnPage: false });

export function RainbowProvider({ children }: { children: ReactNode }) {
  const [hue, setHue] = useState(0);
  const [isMouseOnPage, setIsMouseOnPage] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);
  const lastMouseX = useRef<number | null>(null);
  const hueRef = useRef(0);

  useEffect(() => {
    const MOUSE_SENSITIVITY = 0.25;

    const handleMouseMove = (e: MouseEvent) => {
      if (lastMouseX.current !== null) {
        const deltaX = e.clientX - lastMouseX.current;
        hueRef.current = (hueRef.current + deltaX * MOUSE_SENSITIVITY + 360) % 360;
      }
      lastMouseX.current = e.clientX;
      setIsMouseOnPage(true);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      lastMouseX.current = e.clientX;
      setIsMouseOnPage(true);
    };

    const handleMouseLeave = () => {
      lastMouseX.current = null;
      setIsMouseOnPage(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const RAINBOW_SPEED = 60; // degrees per second

    const animate = (timestamp: number) => {
      if (lastTimestamp.current === null) {
        lastTimestamp.current = timestamp;
      }

      const deltaTime = (timestamp - lastTimestamp.current) / 1000;
      lastTimestamp.current = timestamp;

      hueRef.current = (hueRef.current + RAINBOW_SPEED * deltaTime + 360) % 360;
      setHue(hueRef.current);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--rainbow-hue", String(hue));
  }, [hue]);

  return (
    <RainbowContext.Provider value={{ hue, isMouseOnPage }}>{children}</RainbowContext.Provider>
  );
}

export function useRainbow() {
  return useContext(RainbowContext);
}
