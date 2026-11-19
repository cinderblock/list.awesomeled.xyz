import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useHydrated } from '~/hooks/useHydrated';

interface Optimistic {
  /** What the page should show right now */
  params: URLSearchParams;
  /** The router's params object when the last write was made */
  base: URLSearchParams;
  /** Serialized states written but not yet reached by the router */
  queued: string[];
}

// What the prerendered HTML was rendered with: no query string at all
const NO_PARAMS = new URLSearchParams();

/**
 * URL state for pages driven by their query string (tables, compare), with
 * two things `useSearchParams` alone does not give:
 *
 * - **Writes take effect immediately.** The URL stays the source of truth
 *   (shareable, back button works), but a router navigation is a transition:
 *   loaders re-run and the whole route re-renders before the new search
 *   params arrive, which made a sort click take a fifth of a second. Here a
 *   write updates a local copy first — the page re-renders in the same frame
 *   — and the router catches up behind it.
 * - **Hydration matches the prerendered page.** The HTML was prerendered
 *   without a query string, so the first client render must ignore it too;
 *   the real params apply in the render right after (`ready` turns true).
 *
 * Returns the effective params, an updater taking `{key: value | null}`
 * (null / '' deletes the key), and whether the real URL is in effect yet.
 */
export function useTableParams(): [
  URLSearchParams,
  (updates: Record<string, string | null>, replace?: boolean) => void,
  boolean,
] {
  const [routerParams, setRouterParams] = useSearchParams();
  const [optimistic, setOptimistic] = useState<Optimistic | null>(null);
  const ready = useHydrated();

  let params = ready ? routerParams : NO_PARAMS;
  if (ready && optimistic) {
    const current = routerParams.toString();
    if (current === optimistic.params.toString()) {
      // The router caught up
      setOptimistic(null);
    } else if (optimistic.base !== routerParams && !optimistic.queued.includes(current)) {
      // The URL moved somewhere we didn't send it (back button, a link):
      // the router wins
      setOptimistic(null);
    } else {
      // Still waiting — possibly passing through an earlier write of ours
      params = optimistic.params;
    }
  }

  const update = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const next = new URLSearchParams(params);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') next.delete(key);
        else next.set(key, value);
      }
      if (next.toString() === params.toString()) return;
      setOptimistic((prev) => ({
        params: next,
        base: routerParams,
        queued: [...(prev?.queued ?? []), next.toString()],
      }));
      setRouterParams(next, { replace, preventScrollReset: true });
    },
    [params, routerParams, setRouterParams]
  );

  return [params, update, ready];
}
