import { useSyncExternalStore } from 'react';

/**
 * Phone width: below this a table shows two columns at best. The inline
 * script in root.tsx uses the same query to set layout and density before
 * first paint.
 */
export const NARROW = '(max-width: 640px)';

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

/** Whether the window is phone width (false while prerendering and hydrating). */
export function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false
  );
}
