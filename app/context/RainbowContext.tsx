import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

interface RainbowContextType {
  getHue: () => number;
  isMouseOnPage: boolean;
}

const RainbowContext = createContext<RainbowContextType>({ getHue: () => 0, isMouseOnPage: false });

export function RainbowProvider({ children }: { children: ReactNode }) {
  const animationRef = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);
  const lastMouseX = useRef<number | null>(null);
  const hueRef = useRef(0);
  const isMouseOnPageRef = useRef(false);

  // Update CSS variable directly without React state
  const updateCssHue = () => {
    document.documentElement.style.setProperty('--rainbow-hue', String(hueRef.current));
  };

  useEffect(() => {
    const MOUSE_SENSITIVITY = 0.25;

    const handleMouseMove = (e: MouseEvent) => {
      if (lastMouseX.current !== null) {
        const deltaX = e.clientX - lastMouseX.current;
        hueRef.current = (hueRef.current + deltaX * MOUSE_SENSITIVITY + 360) % 360;
      }
      lastMouseX.current = e.clientX;
      isMouseOnPageRef.current = true;
    };

    const handleMouseEnter = (e: MouseEvent) => {
      lastMouseX.current = e.clientX;
      isMouseOnPageRef.current = true;
    };

    const handleMouseLeave = () => {
      lastMouseX.current = null;
      isMouseOnPageRef.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
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
      // Update CSS directly, no React state update!
      updateCssHue();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Provide getter function instead of reactive value
  const contextValue = {
    getHue: () => hueRef.current,
    isMouseOnPage: isMouseOnPageRef.current,
  };

  return <RainbowContext.Provider value={contextValue}>{children}</RainbowContext.Provider>;
}

export function useRainbow() {
  return useContext(RainbowContext);
}
