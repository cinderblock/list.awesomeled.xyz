import { Scale, X } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import {
  clearCompare,
  COMPARE_MAX,
  compareHref,
  entryRef,
  toggleCompare,
  useCompareItems,
} from '~/lib/compare';
import { toast } from '~/lib/toast';

/**
 * The entries picked for comparison, docked at the bottom of every page so
 * picks can be gathered across tables and categories. Hidden while nothing is
 * picked, and on the compare page itself.
 */
export function CompareTray() {
  const items = useCompareItems();
  const { pathname } = useLocation();
  if (items.length === 0 || pathname.startsWith('/compare')) return null;

  return (
    <aside className="compare-tray" aria-label="Entries picked for comparison">
      <span className="compare-tray-title">
        <Scale size={16} aria-hidden="true" />
        Compare
      </span>
      <ul className="compare-tray-items">
        {items.map((item) => (
          <li key={item.ref} className="compare-tray-item">
            <Link to={`/${item.ref}`}>{item.name}</Link>
            <button
              type="button"
              aria-label={`Remove ${item.name} from the comparison`}
              onClick={() => toggleCompare(item)}
            >
              <X size={12} />
            </button>
          </li>
        ))}
      </ul>
      {items.length >= 2 ? (
        <Link className="btn btn--primary btn--sm" to={compareHref(items.map((item) => item.ref))}>
          Compare {items.length}
        </Link>
      ) : (
        <span className="compare-tray-hint">Pick one more to compare</span>
      )}
      <button type="button" className="btn btn--ghost btn--sm" onClick={clearCompare}>
        Clear
      </button>
    </aside>
  );
}

/**
 * Add an entry to (or take it out of) the comparison. Used on entry pages;
 * tables have a checkbox per row for the same thing.
 */
export function CompareButton({
  categoryId,
  entryId,
  name,
  className = 'btn btn--outline btn--sm',
}: {
  categoryId: string;
  entryId: string;
  name: string;
  className?: string;
}) {
  const items = useCompareItems();
  const ref = entryRef(categoryId, entryId);
  const picked = items.some((item) => item.ref === ref);

  return (
    <button
      type="button"
      className={`${className} compare-button${picked ? ' compare-button--on' : ''}`}
      aria-pressed={picked}
      onClick={() => {
        if (!toggleCompare({ ref, name })) {
          toast(`A comparison holds ${COMPARE_MAX} entries. Remove one to add another.`, 'error');
        }
      }}
    >
      <Scale size={15} aria-hidden="true" />
      {picked ? 'In comparison' : 'Compare'}
    </button>
  );
}
