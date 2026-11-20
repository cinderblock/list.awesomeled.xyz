import { useEffect, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  EyeOff,
  Filter,
  X,
} from 'lucide-react';
import type { BaseEntry } from '~/lib/types';
import { isFilterActive, type FilterValue, type SortDirection } from '~/lib/table-state';
import { FilterEditor } from './ColumnFilter';
import type { TableColumn } from './table-columns';

// Space kept between the menu and the bottom of the window (the gap under the
// trigger, the arrow, a margin), and the least height worth opening downward
const MENU_CLEARANCE = 24;
const MENU_MIN_HEIGHT = 220;

export interface ColumnSortState {
  dir: SortDirection;
  /** 1-based position among the sort layers */
  index: number;
  /** Total number of sort layers */
  count: number;
}

interface ColumnHeaderProps {
  column: TableColumn;
  sortState: ColumnSortState | null;
  /** True when other columns are already sorted (enables "add as tie-break") */
  hasOtherSort: boolean;
  /** Header click: cycle this column's sort; additive keeps the other layers */
  onCycleSort: (additive: boolean) => void;
  /** Explicit direction from the menu (null clears this column's sort) */
  onSortChange: (dir: SortDirection | null, additive?: boolean) => void;
  filterValue: FilterValue | undefined;
  onFilterChange: (value: FilterValue | undefined) => void;
  allRows: BaseEntry[];
  /** Rows for facet counts; computed lazily, only while the menu is open */
  facetRows: () => BaseEntry[];
  onHide?: () => void;
  onMove?: (delta: -1 | 1) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}

/**
 * A table header cell: the label sorts with one click (shift-click adds a
 * tie-break level); the small menu beside it holds filtering, explicit sort
 * directions, the column's description and layout actions.
 */
export function ColumnHeader({
  column,
  sortState,
  hasOtherSort,
  onCycleSort,
  onSortChange,
  filterValue,
  onFilterChange,
  allRows,
  facetRows,
  onHide,
  onMove,
  canMoveLeft,
  canMoveRight,
}: ColumnHeaderProps) {
  const [open, setOpenState] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  // How tall the menu may be. A column with many values makes a menu taller
  // than the room under the table header on a laptop screen; left alone it
  // flips upward and runs off the top of the window. Measured when it opens
  // (it closes on scroll, so the number stays true while it is open), the menu
  // opens downward and scrolls inside instead.
  const [room, setRoom] = useState<number | undefined>(undefined);
  const setOpen = (next: boolean) => {
    if (next && triggerRef.current) {
      const below = window.innerHeight - triggerRef.current.getBoundingClientRect().bottom;
      setRoom(Math.max(MENU_MIN_HEIGHT, Math.floor(below - MENU_CLEARANCE)));
    }
    setOpenState(next);
  };
  const sortable = column.sortable !== false && column.key !== 'links';
  const filterable = column.filterKind != null || column.key !== 'links';
  const filtered = isFilterActive(filterValue);
  const sortDir = sortState?.dir ?? null;
  const label = column.label || 'Links';

  // Close on scroll so the menu cannot detach from the sticky header
  useEffect(() => {
    if (!open) return;
    const close = () => setOpenState(false);
    window.addEventListener('scroll', close, { passive: true });
    return () => window.removeEventListener('scroll', close);
  }, [open]);

  // The links column has nothing to sort, filter or describe
  if (column.key === 'links') {
    return <span className="sr-only">Links</span>;
  }

  return (
    <>
      {sortable ? (
        <button
          type="button"
          className={`column-header-trigger${sortDir ? ' column-header-trigger--sorted' : ''}`}
          onClick={(e) => onCycleSort(e.shiftKey)}
          aria-label={`Sort by ${label}${
            sortDir ? ` (sorted ${sortDir === 'asc' ? 'ascending' : 'descending'})` : ''
          }`}
        >
          {column.label}
          <span className="column-header-sort-indicator" aria-hidden="true">
            {sortDir === 'asc' && <ArrowUp size={14} />}
            {sortDir === 'desc' && <ArrowDown size={14} />}
            {sortState && sortState.count > 1 && (
              <sup className="column-header-sort-layer">{sortState.index}</sup>
            )}
            {!sortDir && <ArrowUpDown size={14} className="column-header-sort-hint" />}
          </span>
        </button>
      ) : (
        <span>{column.label}</span>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className={`column-header-menu${filtered ? ' column-header-menu--filtered' : ''}`}
            aria-label={`${label} column: filter and options${filtered ? ' (filter active)' : ''}`}
          >
            {filtered ? <Filter size={13} /> : <ChevronDown size={13} />}
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="column-header-popover"
            aria-label={`${label} column: sort, filter and options`}
            sideOffset={5}
            align="start"
            collisionPadding={8}
          >
            <div className="column-header-popover-body" style={{ maxHeight: room }}>
              <div className="column-header-popover-header">
                <span className="column-header-popover-title">{label}</span>
                <div className="column-header-popover-actions">
                  {onMove && (
                    <>
                      <button
                        type="button"
                        className="column-header-hide-btn"
                        aria-label={`Move ${label} left`}
                        disabled={!canMoveLeft}
                        onClick={() => onMove(-1)}
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <button
                        type="button"
                        className="column-header-hide-btn"
                        aria-label={`Move ${label} right`}
                        disabled={!canMoveRight}
                        onClick={() => onMove(1)}
                      >
                        <ArrowRight size={14} />
                      </button>
                    </>
                  )}
                  {onHide && (
                    <button
                      type="button"
                      className="column-header-hide-btn"
                      aria-label={`Hide the ${label} column`}
                      onClick={() => {
                        onHide();
                        setOpen(false);
                      }}
                    >
                      <EyeOff size={14} />
                      Hide
                    </button>
                  )}
                </div>
              </div>

              {column.description && (
                <p className="column-header-description">{column.description}</p>
              )}

              {sortable && (
                <div className="column-header-sort-section">
                  <div className="column-header-section-label">
                    Sort
                    {sortState && sortState.count > 1 ? ` (level ${sortState.index})` : ''}
                  </div>
                  <div className="column-header-sort-buttons">
                    <button
                      type="button"
                      className={`column-header-sort-btn${sortDir === 'asc' ? ' column-header-sort-btn--active' : ''}`}
                      aria-pressed={sortDir === 'asc'}
                      onClick={() => onSortChange('asc')}
                    >
                      <ArrowUp size={14} />
                      Ascending
                    </button>
                    <button
                      type="button"
                      className={`column-header-sort-btn${sortDir === 'desc' ? ' column-header-sort-btn--active' : ''}`}
                      aria-pressed={sortDir === 'desc'}
                      onClick={() => onSortChange('desc')}
                    >
                      <ArrowDown size={14} />
                      Descending
                    </button>
                    {sortDir && (
                      <button
                        type="button"
                        className="column-header-sort-btn column-header-sort-btn--clear"
                        onClick={() => onSortChange(null)}
                      >
                        <X size={14} />
                        Clear
                      </button>
                    )}
                  </div>
                  {hasOtherSort && !sortDir && (
                    <div className="column-header-sort-buttons">
                      <button
                        type="button"
                        className="column-header-sort-btn"
                        onClick={() => onSortChange(column.defaultSortDir ?? 'asc', true)}
                      >
                        <ArrowUpDown size={14} />
                        Add as tie-break
                      </button>
                    </div>
                  )}
                  <p className="column-header-tip">
                    Tip: click a header to sort, shift-click to break ties with it.
                  </p>
                </div>
              )}

              {filterable && (
                <div className="column-header-filter-section">
                  <div className="column-header-section-header">
                    <span className="column-header-section-label">Filter</span>
                    {filtered && (
                      <button
                        type="button"
                        className="filter-clear-btn"
                        onClick={() => onFilterChange(undefined)}
                      >
                        <X size={14} />
                        Clear
                      </button>
                    )}
                  </div>
                  {open && (
                    <FilterEditor
                      column={column}
                      allRows={allRows}
                      rows={facetRows()}
                      value={filterValue}
                      onChange={onFilterChange}
                    />
                  )}
                </div>
              )}
            </div>

            <Popover.Arrow className="filter-arrow" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}
