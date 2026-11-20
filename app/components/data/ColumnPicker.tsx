import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ArrowDown, ArrowUp, Columns3, RotateCcw, X } from 'lucide-react';
import type { TableColumn } from './table-columns';

interface ColumnPickerProps {
  /** Every column the table can show */
  columns: TableColumn[];
  /** Keys of the columns shown now, in order */
  visibleKeys: string[];
  /** Keys of the default view, in order */
  defaultKeys: string[];
  /** Number of entries in the category (for "filled in N of M") */
  total: number;
  onChange: (keys: string[]) => void;
}

const columnLabel = (col: TableColumn) => col.label || 'Links';

/**
 * Choose which fields are columns and in what order. The default view is a
 * handful of curated columns; every other field in the database is one tick
 * away, grouped the way entry pages group them.
 */
export function ColumnPicker({
  columns,
  visibleKeys,
  defaultKeys,
  total,
  onChange,
}: ColumnPickerProps) {
  const [search, setSearch] = useState('');
  const byKey = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const visible = new Set(visibleKeys);
  const isDefaultView =
    visibleKeys.length === defaultKeys.length && visibleKeys.every((k, i) => k === defaultKeys[i]);
  const extra = visibleKeys.filter((k) => !defaultKeys.includes(k)).length;
  const hidden = defaultKeys.filter((k) => !visible.has(k)).length;

  // Group every column by section, in catalog order
  const groups = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const out: { section: string; label: string; columns: TableColumn[] }[] = [];
    for (const col of columns) {
      if (col.key === 'name') continue; // always shown
      if (
        needle &&
        !columnLabel(col).toLowerCase().includes(needle) &&
        !col.key.toLowerCase().includes(needle) &&
        !col.sectionLabel.toLowerCase().includes(needle)
      ) {
        continue;
      }
      let group = out.find((g) => g.section === col.section);
      if (!group)
        out.push((group = { section: col.section, label: col.sectionLabel, columns: [] }));
      group.columns.push(col);
    }
    return out;
  }, [columns, search]);

  const toggle = (key: string) => {
    if (visible.has(key)) onChange(visibleKeys.filter((k) => k !== key));
    else onChange([...visibleKeys, key]);
  };

  const move = (key: string, delta: -1 | 1) => {
    const index = visibleKeys.indexOf(key);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= visibleKeys.length) return;
    const next = [...visibleKeys];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const changed = extra + hidden;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`btn btn--ghost btn--sm${!isDefaultView ? ' btn--badge' : ''}`}
          aria-label={`Choose columns${changed > 0 ? ` (${changed} changed from the default)` : ''}`}
        >
          <Columns3 size={16} />
          <span className="btn-label">Columns</span>
          {changed > 0 && <span className="btn-badge">{changed}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="column-picker"
          aria-label="Choose columns"
          sideOffset={5}
          align="start"
          collisionPadding={8}
        >
          <div className="column-picker-header">
            <span className="column-visibility-title">Columns</span>
            {!isDefaultView && (
              <button
                type="button"
                className="filter-clear-btn"
                onClick={() => onChange(defaultKeys)}
              >
                <RotateCcw size={14} />
                Reset to default
              </button>
            )}
          </div>

          <div className="column-picker-body">
            <section aria-label="All fields">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a field…"
                aria-label="Find a field"
                className="filter-input column-picker-search"
              />
              {groups.map((group) => (
                <fieldset key={group.section} className="column-picker-group">
                  <legend>{group.label}</legend>
                  {group.columns.map((col) => (
                    <label key={col.key} className="column-visibility-option">
                      <input
                        type="checkbox"
                        checked={visible.has(col.key)}
                        onChange={() => toggle(col.key)}
                      />
                      <span className="column-visibility-label">{columnLabel(col)}</span>
                      {col.field && (
                        <span className="filter-count">
                          {col.field.filled}/{total}
                        </span>
                      )}
                    </label>
                  ))}
                </fieldset>
              ))}
              {groups.length === 0 && <div className="filter-no-options">No matching fields</div>}
              <p className="column-picker-note">
                The number is how many of the {total} entries have that field filled in.
              </p>
            </section>

            <details className="column-picker-order">
              <summary>Reorder the {visibleKeys.length} columns shown</summary>
              <ol className="column-picker-shown">
                {visibleKeys.map((key, index) => {
                  const col = byKey.get(key);
                  if (!col) return null;
                  const locked = key === 'name';
                  return (
                    <li key={key} className="column-picker-shown-item">
                      <span className="column-picker-shown-label">{columnLabel(col)}</span>
                      <button
                        type="button"
                        className="column-picker-icon-btn"
                        aria-label={`Move ${columnLabel(col)} earlier`}
                        disabled={index === 0}
                        onClick={() => move(key, -1)}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="column-picker-icon-btn"
                        aria-label={`Move ${columnLabel(col)} later`}
                        disabled={index === visibleKeys.length - 1}
                        onClick={() => move(key, 1)}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        className="column-picker-icon-btn"
                        aria-label={
                          locked
                            ? 'The name column is always shown'
                            : `Remove the ${columnLabel(col)} column`
                        }
                        disabled={locked}
                        onClick={() => toggle(key)}
                      >
                        <X size={14} />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </details>
          </div>
          <Popover.Arrow className="filter-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
