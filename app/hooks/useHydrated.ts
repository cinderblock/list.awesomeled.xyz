import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False while prerendering and during hydration, true afterwards.
 *
 * Pages are prerendered without a query string, so anything derived from the
 * URL (or from localStorage) must render its default first and switch over
 * once hydrated — otherwise the first client render disagrees with the static
 * HTML and React throws a hydration error (#418).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
