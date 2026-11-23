import { useCallback, useEffect } from 'react';
import { useHydrated } from '~/hooks/useHydrated';
import { useNarrowScreen } from '~/hooks/useNarrowScreen';
import { DENSITY_PREF, usePref } from '~/lib/prefs';

export type Density = 'comfortable' | 'compact';

/**
 * How tall table rows are. Dense is the default, as in a spreadsheet; a
 * table on a phone (cards are the default there) starts roomy, where rows
 * are tapped. Either can be chosen explicitly and the choice is remembered
 * on this device.
 *
 * The density is a `data-density` attribute on <html>, set before first
 * paint by the inline script in root.tsx.
 */
export function useDensity(): [Density, () => void] {
  const [pref, setPref] = usePref<Density>(DENSITY_PREF);
  const narrow = useNarrowScreen();
  const automatic: Density = narrow ? 'comfortable' : 'compact';
  const density: Density = pref === 'compact' || pref === 'comfortable' ? pref : automatic;

  // Neither the saved choice nor the screen width is known while hydrating:
  // leave what the inline script set until they are
  const hydrated = useHydrated();
  useEffect(() => {
    if (hydrated) document.documentElement.dataset.density = density;
  }, [hydrated, density]);

  const toggle = useCallback(() => {
    const next: Density = density === 'compact' ? 'comfortable' : 'compact';
    // Choosing what the screen size would pick anyway goes back to automatic
    setPref(next === automatic ? null : next);
  }, [density, automatic, setPref]);

  return [density, toggle];
}
