import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

type RainbowScopeElement = HTMLElement | SVGElement;

interface RainbowContextType {
  getHue: () => number;
  getIsMouseOnPage: () => boolean;
  registerScope: (el: RainbowScopeElement) => () => void;
}

const RainbowContext = createContext<RainbowContextType>({
  getHue: () => 0,
  getIsMouseOnPage: () => false,
  registerScope: () => () => {},
});

export function RainbowProvider({ children }: { children: ReactNode }) {
  const animationRef = useRef<number | null>(null);
  const lastTimestamp = useRef<number | null>(null);
  const lastMouseX = useRef<number | null>(null);
  const hueRef = useRef(0);
  const isMouseOnPageRef = useRef(false);
  // Per-frame writes go only to registered consumer elements. Setting the
  // variable on :root instead would invalidate inherited styles for the whole
  // document every frame, which crawls on large pages.
  const scopesRef = useRef(new Set<RainbowScopeElement>());

  const updateCssHue = () => {
    const hue = String(hueRef.current);
    for (const el of scopesRef.current) {
      el.style.setProperty('--rainbow-hue', hue);
    }
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

    // Touch devices have no cursor: device tilt (gamma = left/right roll)
    // plays the mouse-X role instead. Delta-based like the mouse, so only
    // CHANGES in tilt move the hue. Note: iOS requires a permission prompt
    // (DeviceOrientationEvent.requestPermission) before events flow, and we
    // don't show one for a decorative effect — Android and other platforms
    // deliver events without asking.
    const TILT_SENSITIVITY = 3; // degrees of hue per degree of roll
    let lastGamma: number | null = null;
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      if (lastGamma !== null) {
        const delta = e.gamma - lastGamma;
        // Ignore wild jumps (crossing the ±90° flip point)
        if (Math.abs(delta) < 30) {
          hueRef.current = (hueRef.current + delta * TILT_SENSITIVITY + 360) % 360;
        }
      }
      lastGamma = e.gamma;
    };
    if (typeof window.DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('deviceorientation', handleOrientation);
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

  const contextValue = useMemo(
    () => ({
      getHue: () => hueRef.current,
      getIsMouseOnPage: () => isMouseOnPageRef.current,
      registerScope: (el: RainbowScopeElement) => {
        scopesRef.current.add(el);
        el.style.setProperty('--rainbow-hue', String(hueRef.current));
        return () => {
          scopesRef.current.delete(el);
        };
      },
    }),
    []
  );

  return <RainbowContext.Provider value={contextValue}>{children}</RainbowContext.Provider>;
}

export function useRainbow() {
  return useContext(RainbowContext);
}

// Ref callback that marks an element as a rainbow scope: the animated
// --rainbow-hue is written to it each frame.
export function useRainbowScope() {
  const { registerScope } = useRainbow();
  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback(
    (el: RainbowScopeElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = el ? registerScope(el) : null;
    },
    [registerScope]
  );
}
