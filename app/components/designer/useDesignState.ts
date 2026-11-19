import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router';
import { designQuery, emptyDesign, parseDesign, type Design } from '~/lib/designer';
import { useHydrated } from '~/hooks/useHydrated';

/**
 * Safari allows 100 history.replaceState calls per 30 seconds; a dragged
 * slider would blow through that. One write per 350 ms stays under it.
 */
const URL_WRITE_INTERVAL_MS = 350;

function queryToDesign(query: string): Design {
  return parseDesign(new URLSearchParams(query));
}

/**
 * The design, kept in component state and mirrored into the address bar.
 *
 * Reading: a router navigation (first load, a link, back/forward) replaces
 * the design with the URL's.
 *
 * Writing: edits update state at once and the URL follows with
 * history.replaceState — deliberately NOT a router navigation. A navigation
 * per keystroke re-ran the route (and its data fetch) and landed
 * asynchronously, so two quick edits could each be computed from the same
 * stale design and the first was lost.
 */
export function useDesignState() {
  // The page is prerendered without a query string: render the empty design
  // until hydrated, then switch to the URL's (avoids React hydration error #418)
  const hydrated = useHydrated();
  const location = useLocation();
  const routerQuery = hydrated ? location.search.replace(/^\?/, '') : '';
  // The key changes on every router navigation, even to the same URL text
  // (clicking "Designer" in the header while a design is open)
  const routerKey = hydrated ? `${location.key}?${routerQuery}` : '';

  const [design, setDesign] = useState<Design>(emptyDesign);
  const [seenKey, setSeenKey] = useState('');
  if (routerKey !== seenKey) {
    setSeenKey(routerKey);
    setDesign(queryToDesign(routerQuery));
  }

  const canonical = designQuery(design);
  const lastWrite = useRef(0);
  useEffect(() => {
    if (!hydrated) return;
    const write = () => {
      const current = window.location.search.replace(/^\?/, '');
      // Leave a link alone until the design differs from what it describes
      if (designQuery(queryToDesign(current)) === canonical) return;
      lastWrite.current = Date.now();
      try {
        window.history.replaceState(
          window.history.state,
          '',
          `${window.location.pathname}${canonical ? `?${canonical}` : ''}${window.location.hash}`
        );
      } catch {
        // Throttled by the browser; the next change writes the latest design
      }
    };
    const wait = lastWrite.current + URL_WRITE_INTERVAL_MS - Date.now();
    if (wait <= 0) {
      write();
      return;
    }
    const timer = window.setTimeout(write, wait);
    return () => window.clearTimeout(timer);
  }, [hydrated, canonical]);

  return {
    hydrated,
    design,
    /** The design's canonical query string ('' when empty) */
    canonical,
    /** Change the design; a function receives the latest one */
    update: setDesign,
    /** Replace the design with the one a query string describes */
    load: (query: string) => setDesign(queryToDesign(query)),
  };
}
