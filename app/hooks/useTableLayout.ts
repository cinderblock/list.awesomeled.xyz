import { useCallback, useEffect } from 'react';
import { useHydrated } from '~/hooks/useHydrated';
import { useNarrowScreen } from '~/hooks/useNarrowScreen';
import { TABLE_VIEW_PREF, usePref } from '~/lib/prefs';

export type TableLayout = 'table' | 'cards';

/**
 * How category tables are laid out: a real table, or one card per entry.
 * Cards are the default on phones; either can be chosen explicitly and the
 * choice is remembered on this device.
 *
 * The layout is a `data-table-layout` attribute on <html> (the same table
 * markup is restyled by CSS), set before first paint by the inline script in
 * root.tsx so a phone never flashes the wide table.
 */
export function useTableLayout(): [TableLayout, () => void] {
  const [pref, setPref] = usePref<TableLayout>(TABLE_VIEW_PREF);
  // At phone width a table shows two columns at best; a card per entry reads better
  const narrow = useNarrowScreen();
  const automatic: TableLayout = narrow ? 'cards' : 'table';
  const layout: TableLayout = pref === 'cards' || pref === 'table' ? pref : automatic;

  // Neither the saved choice nor the screen width is known while hydrating:
  // leave what the inline script set until they are
  const hydrated = useHydrated();
  useEffect(() => {
    if (hydrated) document.documentElement.dataset.tableLayout = layout;
  }, [hydrated, layout]);

  const toggle = useCallback(() => {
    const next: TableLayout = layout === 'cards' ? 'table' : 'cards';
    // Choosing what the screen size would pick anyway goes back to automatic
    setPref(next === automatic ? null : next);
  }, [layout, automatic, setPref]);

  return [layout, toggle];
}
