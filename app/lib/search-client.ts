/**
 * Browser side of site search: fetch the index once, share it between the
 * palette, the search page and the not-found page, and a tiny store for
 * "is the palette open".
 */

import { useEffect, useState, useSyncExternalStore } from 'react';
import { prepareIndex, type PreparedIndex, type SearchDoc } from './search';

let indexPromise: Promise<PreparedIndex> | null = null;

/** The search index, fetched on first call and cached for the page's life. */
export function loadSearchIndex(): Promise<PreparedIndex> {
  indexPromise ??= fetch('/search-index.json')
    .then((res) => {
      if (!res.ok) throw new Error(`search index: HTTP ${res.status}`);
      return res.json() as Promise<SearchDoc[]>;
    })
    .then(prepareIndex)
    .catch((error) => {
      indexPromise = null; // let the next attempt retry
      throw error;
    });
  return indexPromise;
}

export interface SearchIndexState {
  index: PreparedIndex | null;
  failed: boolean;
}

/** Load the index when `enabled` first becomes true. */
export function useSearchIndex(enabled: boolean): SearchIndexState {
  const [state, setState] = useState<SearchIndexState>({ index: null, failed: false });
  useEffect(() => {
    if (!enabled || state.index) return;
    let cancelled = false;
    loadSearchIndex().then(
      (index) => !cancelled && setState({ index, failed: false }),
      () => !cancelled && setState({ index: null, failed: true })
    );
    return () => {
      cancelled = true;
    };
  }, [enabled, state.index]);
  return state;
}

// ---------------------------------------------------------------------------
// Palette open state: any component (header button, home hero, keyboard
// shortcut, 404 page) can open the one palette the layout renders.
// ---------------------------------------------------------------------------

interface PaletteState {
  open: boolean;
  /** Text to start with when opening */
  query: string;
}

type Listener = () => void;

const listeners = new Set<Listener>();
let palette: PaletteState = { open: false, query: '' };
const closed: PaletteState = { open: false, query: '' };

function setPalette(next: PaletteState) {
  palette = next;
  listeners.forEach((listener) => listener());
}

export function openSearch(query = ''): void {
  setPalette({ open: true, query });
}

export function closeSearch(): void {
  if (palette.open) setPalette(closed);
}

export function usePaletteState(): PaletteState {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => palette,
    () => closed
  );
}
