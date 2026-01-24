import { useEffect, useRef, useState, useCallback } from 'react';

interface PixelScrollbarProps {
  /** The scrollable element to track. If not provided, tracks window/document scroll */
  targetRef?: React.RefObject<HTMLElement | null>;
  /** Spacing between pixel centers in screen pixels (default: 20) */
  pixelSpacing?: number;
  /** Orientation of the scrollbar */
  orientation?: 'vertical' | 'horizontal';
  /** Position of the scrollbar (for vertical: right/left, for horizontal: top/bottom) */
  position?: 'right' | 'left' | 'top' | 'bottom';
  /** Additional CSS class */
  className?: string;
}

export function PixelScrollbar({
  targetRef,
  pixelSpacing = 20,
  orientation = 'vertical',
  position = 'right',
  className = '',
}: PixelScrollbarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [pixelCount, setPixelCount] = useState(0);
  const [litRange, setLitRange] = useState<{ start: number; end: number }>({ start: 0, end: 0 });
  const [isNeeded, setIsNeeded] = useState(true);
  const rafRef = useRef<number | null>(null);

  const isHorizontal = orientation === 'horizontal';

  // Calculate pixel count based on track size
  const updatePixelCount = useCallback(() => {
    if (!trackRef.current) return;
    const trackSize = isHorizontal
      ? trackRef.current.clientWidth
      : trackRef.current.clientHeight;
    const count = Math.max(1, Math.floor(trackSize / pixelSpacing));
    setPixelCount(count);
  }, [pixelSpacing, isHorizontal]);

  // Calculate which pixels should be lit based on scroll position
  const updateLitPixels = useCallback(() => {
    if (pixelCount === 0) return;

    let scrollPos: number;
    let scrollSize: number;
    let clientSize: number;

    if (targetRef?.current) {
      // Scrollable element
      if (isHorizontal) {
        scrollPos = targetRef.current.scrollLeft;
        scrollSize = targetRef.current.scrollWidth;
        clientSize = targetRef.current.clientWidth;
      } else {
        scrollPos = targetRef.current.scrollTop;
        scrollSize = targetRef.current.scrollHeight;
        clientSize = targetRef.current.clientHeight;
      }
    } else {
      // Window/document scroll (only vertical for window)
      scrollPos = window.scrollY;
      scrollSize = document.documentElement.scrollHeight;
      clientSize = window.innerHeight;
    }

    // Calculate viewport position as fraction of total scrollable area
    const maxScroll = scrollSize - clientSize;
    if (maxScroll <= 0) {
      // Content fits without scrolling - not needed
      setIsNeeded(false);
      setLitRange({ start: 0, end: pixelCount - 1 });
      return;
    }

    // Scrolling is needed
    setIsNeeded(true);

    // Calculate viewport size relative to content
    const viewportRatio = clientSize / scrollSize;
    const litPixelCount = Math.max(1, Math.round(pixelCount * viewportRatio));

    // Calculate scroll position (0 to 1)
    const scrollRatio = scrollPos / maxScroll;

    // Calculate start position, ensuring the lit range stays within bounds
    const maxStart = pixelCount - litPixelCount;
    const start = Math.round(scrollRatio * maxStart);
    const end = Math.min(start + litPixelCount - 1, pixelCount - 1);

    setLitRange({ start, end });
  }, [pixelCount, targetRef, isHorizontal]);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateLitPixels();
      });
    };

    const target = targetRef?.current;
    if (target) {
      target.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Initial update
    updateLitPixels();

    return () => {
      if (target) {
        target.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [targetRef, updateLitPixels]);

  // Handle resize and content changes
  useEffect(() => {
    const handleResize = () => {
      updatePixelCount();
      updateLitPixels();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Use ResizeObserver for track element
    const resizeObserver = new ResizeObserver(handleResize);
    if (trackRef.current) {
      resizeObserver.observe(trackRef.current);
    }

    // Also observe target element for size changes
    if (targetRef?.current) {
      resizeObserver.observe(targetRef.current);
    }

    // For window scroll, observe document body for content changes
    // This catches navigation between pages with different content heights
    if (!targetRef) {
      resizeObserver.observe(document.body);
    }

    // Initial calculation
    updatePixelCount();

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [updatePixelCount, updateLitPixels, targetRef]);

  // Update lit pixels when pixel count changes
  useEffect(() => {
    updateLitPixels();
  }, [pixelCount, updateLitPixels]);

  // Toggle class on html element for vertical scrollbar visibility (for content padding)
  useEffect(() => {
    if (orientation !== 'vertical' || targetRef) return;

    const className = `pixel-scrollbar-visible-${position}`;
    if (isNeeded) {
      document.documentElement.classList.add(className);
    } else {
      document.documentElement.classList.remove(className);
    }

    return () => {
      document.documentElement.classList.remove(className);
    };
  }, [isNeeded, orientation, position, targetRef]);

  // Handle click/drag on scrollbar
  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || pixelCount === 0) return;

      const rect = trackRef.current.getBoundingClientRect();
      const clickPos = isHorizontal
        ? e.clientX - rect.left
        : e.clientY - rect.top;
      const trackSize = isHorizontal ? rect.width : rect.height;
      const ratio = clickPos / trackSize;

      let scrollSize: number;
      let clientSize: number;

      if (targetRef?.current) {
        if (isHorizontal) {
          scrollSize = targetRef.current.scrollWidth;
          clientSize = targetRef.current.clientWidth;
        } else {
          scrollSize = targetRef.current.scrollHeight;
          clientSize = targetRef.current.clientHeight;
        }
      } else {
        scrollSize = document.documentElement.scrollHeight;
        clientSize = window.innerHeight;
      }

      const maxScroll = scrollSize - clientSize;
      const newScrollPos = ratio * maxScroll;

      if (targetRef?.current) {
        if (isHorizontal) {
          targetRef.current.scrollTo({ left: newScrollPos, behavior: 'smooth' });
        } else {
          targetRef.current.scrollTo({ top: newScrollPos, behavior: 'smooth' });
        }
      } else {
        window.scrollTo({ top: newScrollPos, behavior: 'smooth' });
      }
    },
    [pixelCount, targetRef, isHorizontal]
  );

  // Generate pixel elements
  const pixels = [];
  for (let i = 0; i < pixelCount; i++) {
    const isLit = i >= litRange.start && i <= litRange.end;
    pixels.push(
      <div
        key={i}
        className={`pixel-scrollbar-pixel ${isLit ? 'pixel-scrollbar-pixel--lit' : ''}`}
      />
    );
  }

  const positionClass = isHorizontal
    ? `pixel-scrollbar--horizontal pixel-scrollbar--${position}`
    : `pixel-scrollbar--vertical pixel-scrollbar--${position}`;

  const hiddenClass = isNeeded ? '' : 'pixel-scrollbar--hidden';

  return (
    <div
      ref={trackRef}
      className={`pixel-scrollbar ${positionClass} ${hiddenClass} ${className}`}
      onClick={handleTrackClick}
      style={{ '--pixel-spacing': `${pixelSpacing}px` } as React.CSSProperties}
    >
      <div className="pixel-scrollbar-track">{pixels}</div>
    </div>
  );
}
