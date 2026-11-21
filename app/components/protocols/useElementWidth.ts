import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The rendered width of an element, for drawings that change layout on a
 * narrow screen. Null until measured: the prerendered HTML and the first
 * client render use the wide layout, and the measurement switches it after
 * hydration, so the two never disagree.
 */
export function useElementWidth<T extends HTMLElement>(): [
  (node: T | null) => void,
  number | null,
] {
  const [width, setWidth] = useState<number | null>(null);
  const observer = useRef<ResizeObserver | null>(null);
  const ref = useCallback((node: T | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;
    observer.current = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (box) setWidth(Math.round(box.width));
    });
    observer.current.observe(node);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);
  return [ref, width];
}
