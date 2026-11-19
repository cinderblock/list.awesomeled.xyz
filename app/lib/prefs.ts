/**
 * Per-device preferences in localStorage, safe to read during render.
 *
 * The site is prerendered, so the first client render must match HTML that
 * knew nothing about this device. `usePref` returns null on the server and
 * during hydration, then re-renders with the stored value — no hydration
 * mismatch, no effect + setState dance in every component.
 *
 * Preferences that change layout before React loads (density, table layout)
 * are also applied to <html> by the inline script in root.tsx.
 */

import { useCallback, useSyncExternalStore } from 'react';

export const DENSITY_PREF = 'awesomeledlist_density';
export const TABLE_VIEW_PREF = 'awesomeledlist_table_view';

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();
// Parsed values are cached against the raw string so snapshots are
// referentially stable (useSyncExternalStore requires it)
const cache = new Map<string, { raw: string | null; value: unknown }>();

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null; // storage disabled
  }
}

/** Read a preference outside React (null when unset or unreadable). */
export function getPref<T>(key: string): T | null {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T | null;
  let value: unknown = null;
  if (raw != null) {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null; // corrupted entry: behave as unset
    }
  }
  cache.set(key, { raw, value });
  return value as T | null;
}

/** Write (or with null, clear) a preference and notify every subscriber. */
export function setPref<T>(key: string, value: T | null): void {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage disabled or full: the preference just doesn't persist
  }
  cache.delete(key);
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribeTo(key: string, listener: Listener): () => void {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  // Another tab changed it
  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) {
      cache.delete(key);
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    set.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

const serverSnapshot = () => null;

/** A stored preference and its setter. Null until hydrated, and when unset. */
export function usePref<T>(key: string): [T | null, (value: T | null) => void] {
  const subscribe = useCallback((listener: Listener) => subscribeTo(key, listener), [key]);
  const getSnapshot = useCallback(() => getPref<T>(key), [key]);
  const value = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const set = useCallback((next: T | null) => setPref(key, next), [key]);
  return [value, set];
}
