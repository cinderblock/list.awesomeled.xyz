import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
let cached: number | null = null;
const clientNow = () => (cached ??= Date.now());
const serverNow = () => 0;

/**
 * The client clock, captured once per page load; 0 on the server and during
 * hydration. Lets relative-time UI render deterministically on first paint
 * (matching the server HTML) and swap in wall-clock wording after mount —
 * without impure Date.now() calls in render.
 */
export function useNow(): number {
  return useSyncExternalStore(emptySubscribe, clientNow, serverNow);
}
