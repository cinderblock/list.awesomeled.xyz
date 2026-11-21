import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const REDUCED = '(prefers-reduced-motion: reduce)';

function subscribeReduced(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** The reader asked their system for less motion (false while prerendering) */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}

function subscribeVisibility(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange);
  return () => document.removeEventListener('visibilitychange', onChange);
}

/** The browser tab is in front (true while prerendering) */
function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribeVisibility,
    () => document.visibilityState === 'visible',
    () => true
  );
}

export interface Timeline {
  /** Animation seconds */
  time: number;
  /** Running right now (wanted, on screen and in a visible tab) */
  playing: boolean;
  /** The reader's choice, or the default when they haven't made one */
  wantsToPlay: boolean;
  reducedMotion: boolean;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  /** Jump to a moment and stay there */
  seek: (seconds: number) => void;
  /** Callback ref for the figure, so the clock stops while it is off screen */
  observe: (node: HTMLElement | null) => void;
}

/**
 * A clock for one animated figure.
 *
 * - Plays by itself only when the reader hasn't asked for reduced motion;
 *   with reduced motion it waits for the Play button (or a step button that
 *   seeks), so nothing moves unless asked to.
 * - Stops while the figure is off screen or the tab is hidden, so a long page
 *   of animations costs nothing until it is read.
 * - Starts at `initial` on the server and in the first client render, so the
 *   prerendered page shows a meaningful still picture and hydrates cleanly.
 */
export function useTimeline({
  duration,
  initial = 0,
  loop = true,
  rate = 1,
}: {
  /** Seconds before the clock wraps (or stops, without `loop`) */
  duration: number;
  initial?: number;
  loop?: boolean;
  /** Animation seconds per real second */
  rate?: number;
}): Timeline {
  const reducedMotion = usePrefersReducedMotion();
  const pageVisible = usePageVisible();
  const [time, setTime] = useState(initial);
  // The clock's own copy, so a frame can tell it has reached the end
  const clock = useRef(initial);
  // null: the reader hasn't pressed anything, so follow their motion setting
  const [choice, setChoice] = useState<boolean | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const wantsToPlay = choice ?? !reducedMotion;
  const playing = wantsToPlay && onScreen && pageVisible;

  const observe = useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!node) return;
    observer.current = new IntersectionObserver(
      (entries) => setOnScreen(entries.some((e) => e.isIntersecting)),
      { threshold: 0.15 }
    );
    observer.current.observe(node);
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      // A long pause (tab switch, debugger) shouldn't jump the picture ahead
      const dt = last == null ? 0 : Math.min(0.1, (now - last) / 1000);
      last = now;
      let next = clock.current + dt * rate;
      let ended = false;
      if (next >= duration) {
        if (loop) next %= duration;
        else {
          next = duration;
          ended = true;
        }
      }
      clock.current = next;
      setTime(next);
      if (ended) setChoice(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, duration, loop, rate]);

  const play = useCallback(() => {
    // A finished one-shot animation starts over
    if (!loop && clock.current >= duration) {
      clock.current = 0;
      setTime(0);
    }
    setChoice(true);
  }, [loop, duration]);
  const pause = useCallback(() => setChoice(false), []);
  const toggle = useCallback(() => (wantsToPlay ? pause() : play()), [wantsToPlay, pause, play]);
  const seek = useCallback(
    (seconds: number) => {
      const t = Math.max(0, Math.min(duration, seconds));
      clock.current = t;
      setTime(t);
      setChoice(false);
    },
    [duration]
  );

  return { time, playing, wantsToPlay, reducedMotion, toggle, play, pause, seek, observe };
}
