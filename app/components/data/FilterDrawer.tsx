import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { SlidersHorizontal, X } from 'lucide-react';
import type { BaseEntry } from '~/lib/types';
import {
  getFilterDescription,
  isFilterActive,
  type FilterState,
  type FilterValue,
} from '~/lib/table-state';
import { FilterEditor, formatBound } from './ColumnFilter';
import type { TableColumn } from './table-columns';

interface FilterDrawerProps {
  /** Every column; only the filterable ones are listed */
  columns: TableColumn[];
  visibleKeys: string[];
  filters: FilterState;
  allRows: BaseEntry[];
  /** Rows passing search and every filter except `exceptKey`'s */
  facetRows: (exceptKey: string) => BaseEntry[];
  /** Number of rows passing everything */
  matchCount: number;
  onFilterChange: (key: string, value: FilterValue | undefined) => void;
  onClearAll: () => void;
}

/** Chip text for an active filter on a column. */
export function describeFilter(column: TableColumn, value: FilterValue): string {
  const config = column.filterConfig?.type === 'boolean' ? column.filterConfig : undefined;
  return getFilterDescription(value, {
    formatNumber: (n) => formatBound(column, n),
    trueLabel: config?.trueLabel,
    falseLabel: config?.falseLabel,
  });
}

/**
 * Every filter in one place: a side panel listing each filterable field with
 * live counts. Fields already in the table come first; the rest follow by
 * section, so a column does not have to be visible to filter on it.
 */
export function FilterDrawer({
  columns,
  visibleKeys,
  filters,
  allRows,
  facetRows,
  matchCount,
  onFilterChange,
  onClearAll,
}: FilterDrawerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  // Which fields are expanded; active filters open by default
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const activeCount = columns.filter((c) => isFilterActive(filters[c.key])).length;

  const groups = useMemo(() => {
    const filterable = columns.filter((c) => c.key !== 'links' && c.key !== 'name');
    const needle = search.trim().toLowerCase();
    const matches = (c: TableColumn) =>
      !needle ||
      c.label.toLowerCase().includes(needle) ||
      c.sectionLabel.toLowerCase().includes(needle) ||
      c.key.toLowerCase().includes(needle);
    const visible = new Set(visibleKeys);
    const out: { id: string; label: string; columns: TableColumn[] }[] = [];
    const shown = filterable.filter((c) => visible.has(c.key) && matches(c));
    if (shown.length) out.push({ id: '__shown', label: 'In the table', columns: shown });
    for (const col of filterable) {
      if (visible.has(col.key) || !matches(col)) continue;
      let group = out.find((g) => g.id === col.section);
      if (!group) out.push((group = { id: col.section, label: col.sectionLabel, columns: [] }));
      group.columns.push(col);
    }
    return out;
  }, [columns, visibleKeys, search]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={`btn btn--ghost btn--sm${activeCount > 0 ? ' btn--badge' : ''}`}
          aria-label={`Filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
        >
          <SlidersHorizontal size={16} />
          <span className="btn-label">Filters</span>
          {activeCount > 0 && <span className="btn-badge">{activeCount}</span>}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="drawer filter-drawer" aria-describedby={undefined}>
          <div className="drawer-header">
            <Dialog.Title className="drawer-title">Filters</Dialog.Title>
            <span className="drawer-count" aria-live="polite">
              {matchCount} of {allRows.length} match
            </span>
            <Dialog.Close asChild>
              <button type="button" className="btn btn--ghost btn--icon" aria-label="Close filters">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="drawer-toolbar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find a field to filter…"
              aria-label="Find a field to filter"
              className="filter-input"
            />
            {activeCount > 0 && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={onClearAll}>
                <X size={14} />
                Clear all
              </button>
            )}
          </div>

          <div className="drawer-body">
            {groups.map((group) => (
              <section key={group.id} className="filter-drawer-group">
                <h3 className="column-picker-heading">{group.label}</h3>
                {group.columns.map((col) => {
                  const value = filters[col.key];
                  const active = isFilterActive(value);
                  const isOpen = expanded[col.key] ?? active;
                  return (
                    <div
                      key={col.key}
                      className={`filter-drawer-field${active ? ' filter-drawer-field--active' : ''}`}
                    >
                      <button
                        type="button"
                        className="filter-drawer-field-header"
                        aria-expanded={isOpen}
                        onClick={() => setExpanded((prev) => ({ ...prev, [col.key]: !isOpen }))}
                      >
                        <span className="filter-drawer-field-label">{col.label}</span>
                        {active && value && (
                          <span className="filter-drawer-field-value">
                            {describeFilter(col, value)}
                          </span>
                        )}
                        <span className="filter-drawer-chevron" aria-hidden="true">
                          {isOpen ? '−' : '+'}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="filter-drawer-field-body">
                          {col.description && (
                            <p className="column-header-description">{col.description}</p>
                          )}
                          <FilterEditor
                            column={col}
                            allRows={allRows}
                            rows={facetRows(col.key)}
                            value={value}
                            onChange={(next) => onFilterChange(col.key, next)}
                          />
                          {active && (
                            <button
                              type="button"
                              className="filter-clear-btn"
                              onClick={() => onFilterChange(col.key, undefined)}
                            >
                              <X size={14} />
                              Clear this filter
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            ))}
            {groups.length === 0 && <div className="filter-no-options">No matching fields</div>}
          </div>

          <div className="drawer-footer">
            <Dialog.Close asChild>
              <button type="button" className="btn btn--primary">
                Show {matchCount} {matchCount === 1 ? 'entry' : 'entries'}
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
