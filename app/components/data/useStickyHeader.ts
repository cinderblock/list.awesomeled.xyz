import { useCallback, useEffect, useRef, useState } from 'react';

// Height of site header (h-14 = 3.5rem = 56px + 1px border = 57px)
const HEADER_HEIGHT = 57;
// Height of category nav bar when visible (shadow doesn't add height)
const NAV_HEIGHT = 38;
/** Combined height of the fixed site header and category nav */
export const FIXED_HEADER_HEIGHT = HEADER_HEIGHT + NAV_HEIGHT;
// Height of the sticky controls bar before it is measured
const CONTROLS_HEIGHT = 52;

/**
 * The table header has to stay in view while the page scrolls vertically and
 * the table scrolls horizontally inside its own container — which CSS
 * `position: sticky` cannot do (the horizontal scroll container captures it).
 * So a clone of the header is fixed to the viewport and its horizontal scroll
 * mirrors the table's. This hook owns the measuring and mirroring.
 *
 * Pass whatever changes the table's geometry (rows, columns, density); the
 * header is re-measured when any of them changes identity.
 */
export function useStickyHeader(rows: unknown, columns: unknown, density: unknown) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const stickyHeaderScrollRef = useRef<HTMLDivElement>(null);
  // Cached controls height so the scroll handler doesn't re-measure it
  const controlsHeightRef = useRef(CONTROLS_HEIGHT);
  // RAF frame ID for batching scroll updates
  const rafIdRef = useRef<number | null>(null);

  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [controlsHeight, setControlsHeight] = useState(CONTROLS_HEIGHT);
  const [headerHeight, setHeaderHeight] = useState(44);

  const measureAll = useCallback(() => {
    if (!tableRef.current || !controlsRef.current) return;
    const thead = tableRef.current.querySelector('thead');
    if (!thead) return;

    const theadRect = thead.getBoundingClientRect();
    const controlsRect = controlsRef.current.getBoundingClientRect();
    controlsHeightRef.current = controlsRect.height;

    const widths = Array.from(thead.querySelectorAll('th')).map(
      (th) => th.getBoundingClientRect().width
    );
    // Skip the state update (and re-render) when nothing moved
    setColumnWidths((prev) =>
      prev.length === widths.length && prev.every((w, i) => Math.abs(w - widths[i]) < 0.5)
        ? prev
        : widths
    );
    setControlsHeight(controlsRect.height);
    setHeaderHeight(theadRect.height);
  }, []);

  // Mirror horizontal scroll onto the clone (cheap enough to run unbatched)
  const syncHorizontalScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    const clone = stickyHeaderScrollRef.current;
    if (!el || !clone) return;
    const scrollLeft = el.scrollLeft;
    clone.scrollLeft = scrollLeft;

    // Fade on the sticky name column once scrolled (1px threshold for sub-pixel rounding)
    const isScrolled = scrollLeft > 1;
    el.classList.toggle('data-table-scroll--scrolled', isScrolled);
    clone.classList.toggle('data-table-scroll--scrolled', isScrolled);

    // Hide the right-edge fade at the end
    const isAtEnd = scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    el.classList.toggle('data-table-scroll--at-end', isAtEnd);
    clone.classList.toggle('data-table-scroll--at-end', isAtEnd);
  }, []);

  const checkStickyVisibility = useCallback(() => {
    const thead = tableRef.current?.querySelector('thead');
    if (!thead) return;
    const stickyTop = FIXED_HEADER_HEIGHT + controlsHeightRef.current;
    setShowStickyHeader(thead.getBoundingClientRect().top < stickyTop);
  }, []);

  useEffect(() => {
    measureAll();
    syncHorizontalScroll();
    checkStickyVisibility();

    const scrollContainer = scrollContainerRef.current;

    // Vertical scroll: batch visibility checks into animation frames to avoid
    // layout thrash from getBoundingClientRect during rapid scrolling
    const handleVerticalScroll = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        checkStickyVisibility();
      });
    };

    scrollContainer?.addEventListener('scroll', syncHorizontalScroll, { passive: true });
    window.addEventListener('scroll', handleVerticalScroll, { passive: true });
    window.addEventListener('resize', measureAll, { passive: true });

    const resizeObserver = new ResizeObserver(measureAll);
    if (tableRef.current) resizeObserver.observe(tableRef.current);
    if (controlsRef.current) resizeObserver.observe(controlsRef.current);

    return () => {
      scrollContainer?.removeEventListener('scroll', syncHorizontalScroll);
      window.removeEventListener('scroll', handleVerticalScroll);
      window.removeEventListener('resize', measureAll);
      resizeObserver.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [measureAll, syncHorizontalScroll, checkStickyVisibility]);

  // Re-measure when rows or columns change
  useEffect(() => {
    const timer = setTimeout(() => {
      measureAll();
      syncHorizontalScroll();
      checkStickyVisibility();
    }, 50);
    return () => clearTimeout(timer);
  }, [rows, columns, density, measureAll, syncHorizontalScroll, checkStickyVisibility]);

  // Sync scroll the moment the clone becomes visible
  useEffect(() => {
    if (showStickyHeader) syncHorizontalScroll();
  }, [showStickyHeader, syncHorizontalScroll]);

  return {
    scrollContainerRef,
    tableRef,
    controlsRef,
    stickyHeaderScrollRef,
    showStickyHeader,
    columnWidths,
    controlsHeight,
    headerHeight,
  };
}
