import { useState, useMemo, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { X, Check, ArrowUp, ArrowDown, ArrowUpDown, EyeOff } from 'lucide-react';
import type { Column, FilterConfig } from '~/lib/columns';
import type { BaseEntry } from '~/lib/types';

type SortDirection = 'asc' | 'desc';

// Filter value types
export interface NumericFilterValue {
  min?: number;
  max?: number;
}

export interface SelectFilterValue {
  selected: string[];
  exclude: boolean;
}

export interface BooleanFilterValue {
  value: boolean | null;
}

export interface StringFilterValue {
  value: string;
  fuzzy: boolean;
}

export type FilterValue =
  | NumericFilterValue
  | SelectFilterValue
  | BooleanFilterValue
  | StringFilterValue;

export type FilterState = Record<string, FilterValue>;

interface ColumnFilterProps {
  column: Column;
  data: BaseEntry[];
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
}

// Parse numeric value from string (handles units like "16 A", "50 V")
function parseNumericValue(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const str = String(val);
  const match = str.match(/^([\d.,]+)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// Get unique values from data for a column
function getUniqueValues(data: BaseEntry[], key: string): string[] {
  const values = new Set<string>();
  for (const item of data) {
    const val = (item as Record<string, unknown>)[key];
    if (val == null) continue;
    if (Array.isArray(val)) {
      val.forEach((v) => values.add(String(v)));
    } else {
      values.add(String(val));
    }
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

// Get min/max values from data for a numeric column
function getNumericRange(data: BaseEntry[], key: string): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  let hasValues = false;

  for (const item of data) {
    const val = parseNumericValue((item as Record<string, unknown>)[key]);
    if (val !== null) {
      hasValues = true;
      min = Math.min(min, val);
      max = Math.max(max, val);
    }
  }

  return hasValues ? { min, max } : null;
}

// Check if filter has any active value
export function isFilterActive(value: FilterValue | undefined): boolean {
  if (!value) return false;

  if ('min' in value || 'max' in value) {
    return value.min !== undefined || value.max !== undefined;
  }
  if ('selected' in value) {
    return value.selected.length > 0;
  }
  if ('value' in value && typeof value.value === 'boolean') {
    return value.value !== null;
  }
  if ('value' in value && typeof value.value === 'string') {
    return value.value.trim() !== '';
  }
  return false;
}

// Apply filter to a single item
export function applyFilter(
  item: BaseEntry,
  key: string,
  config: FilterConfig,
  value: FilterValue
): boolean {
  const itemValue = (item as Record<string, unknown>)[key];

  switch (config.type) {
    case 'numeric': {
      const numValue = parseNumericValue(itemValue);
      if (numValue === null) return true; // Don't filter out items with no value
      const filterVal = value as NumericFilterValue;
      if (filterVal.min !== undefined && numValue < filterVal.min) return false;
      if (filterVal.max !== undefined && numValue > filterVal.max) return false;
      return true;
    }

    case 'select': {
      const filterVal = value as SelectFilterValue;
      if (filterVal.selected.length === 0) return true;

      let itemValues: string[];
      if (Array.isArray(itemValue)) {
        itemValues = itemValue.map(String);
      } else if (itemValue != null) {
        itemValues = [String(itemValue)];
      } else {
        itemValues = [];
      }

      if (filterVal.exclude) {
        // Exclude mode: item passes if it doesn't have ANY of the selected values
        return !filterVal.selected.some((sel) => itemValues.includes(sel));
      } else {
        // Include mode: item passes if it has ANY of the selected values
        return filterVal.selected.some((sel) => itemValues.includes(sel));
      }
    }

    case 'boolean': {
      const filterVal = value as BooleanFilterValue;
      if (filterVal.value === null) return true;
      return itemValue === filterVal.value;
    }

    case 'string': {
      const filterVal = value as StringFilterValue;
      if (!filterVal.value.trim()) return true;
      const itemStr = String(itemValue ?? '').toLowerCase();

      if (filterVal.fuzzy) {
        // Space-separated fuzzy search: all terms must match
        const terms = filterVal.value.toLowerCase().split(/\s+/).filter(Boolean);
        return terms.every((term) => itemStr.includes(term));
      } else {
        return itemStr.includes(filterVal.value.toLowerCase());
      }
    }
  }
}

interface ColumnHeaderPopoverProps {
  column: Column;
  data: BaseEntry[];
  filterValue: FilterValue | undefined;
  onFilterChange: (value: FilterValue | undefined) => void;
  sortKey: string | null;
  sortDir: SortDirection | null;
  onSort: (key: string) => void;
  onHide?: () => void;
  children: React.ReactNode;
}

export function ColumnHeaderPopover({
  column,
  data,
  filterValue,
  onFilterChange,
  sortKey,
  sortDir,
  onSort,
  onHide,
  children,
}: ColumnHeaderPopoverProps) {
  const [open, setOpen] = useState(false);
  const hasFilter = column.filterConfig != null;
  const isSortable = column.sortable !== false && column.key !== 'links';
  const isFilterActive_ = isFilterActive(filterValue);
  const isSorted = sortKey === column.key;

  // Close popover on scroll to prevent it from detaching from sticky header
  useEffect(() => {
    if (!open) return;

    const handleScroll = () => {
      setOpen(false);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [open]);

  // If column has no filter and is not sortable, just render children
  if (!hasFilter && !isSortable) {
    return <>{children}</>;
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={`column-header-trigger${isFilterActive_ ? ' column-header-trigger--filtered' : ''}${isSorted ? ' column-header-trigger--sorted' : ''}`}
          title={`${column.label} options`}
        >
          {children}
          {isSortable && (
            <span className="column-header-sort-indicator">
              {isSorted && sortDir === 'asc' && <ArrowUp size={14} />}
              {isSorted && sortDir === 'desc' && <ArrowDown size={14} />}
              {!isSorted && <ArrowUpDown size={14} className="column-header-sort-hint" />}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="column-header-popover" sideOffset={5} align="start">
          <div className="column-header-popover-header">
            <span className="column-header-popover-title">{column.label || column.key}</span>
            {onHide && (
              <button
                className="column-header-hide-btn"
                onClick={() => {
                  onHide();
                  setOpen(false);
                }}
                title="Hide column"
              >
                <EyeOff size={14} />
              </button>
            )}
          </div>

          {/* Sort controls */}
          {isSortable && (
            <div className="column-header-sort-section">
              <div className="column-header-section-label">Sort</div>
              <div className="column-header-sort-buttons">
                <button
                  className={`column-header-sort-btn${isSorted && sortDir === 'asc' ? ' column-header-sort-btn--active' : ''}`}
                  onClick={() => {
                    if (isSorted && sortDir === 'asc') {
                      onSort(column.key); // Will toggle to desc
                    } else {
                      onSort(column.key);
                      if (sortDir === 'desc' || !isSorted) {
                        // Need to set to asc - call twice if currently desc
                        if (sortDir === 'desc') onSort(column.key);
                      }
                    }
                  }}
                >
                  <ArrowUp size={14} />
                  Ascending
                </button>
                <button
                  className={`column-header-sort-btn${isSorted && sortDir === 'desc' ? ' column-header-sort-btn--active' : ''}`}
                  onClick={() => {
                    if (!isSorted) {
                      onSort(column.key); // asc
                      onSort(column.key); // desc
                    } else if (sortDir === 'asc') {
                      onSort(column.key); // toggle to desc
                    }
                    // if already desc, do nothing (already active)
                  }}
                >
                  <ArrowDown size={14} />
                  Descending
                </button>
                {isSorted && (
                  <button
                    className="column-header-sort-btn column-header-sort-btn--clear"
                    onClick={() => {
                      // Toggle through to clear
                      if (sortDir === 'asc') {
                        onSort(column.key); // desc
                        onSort(column.key); // clear
                      } else {
                        onSort(column.key); // clear
                      }
                    }}
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Filter controls */}
          {hasFilter && (
            <div className="column-header-filter-section">
              <div className="column-header-section-header">
                <span className="column-header-section-label">Filter</span>
                {isFilterActive_ && (
                  <button className="filter-clear-btn" onClick={() => onFilterChange(undefined)}>
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>
              <FilterContent
                column={column}
                data={data}
                value={filterValue}
                onChange={onFilterChange}
              />
            </div>
          )}

          <Popover.Arrow className="filter-arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

// Legacy export for backwards compatibility - keeping the old function signature
interface ColumnFilterProps {
  column: Column;
  data: BaseEntry[];
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
}

function FilterContent({ column, data, value, onChange }: ColumnFilterProps) {
  const config = column.filterConfig!;

  switch (config.type) {
    case 'numeric':
      return (
        <NumericFilter
          column={column}
          data={data}
          value={value as NumericFilterValue | undefined}
          onChange={onChange}
          config={config}
        />
      );
    case 'select':
      return (
        <SelectFilter
          column={column}
          data={data}
          value={value as SelectFilterValue | undefined}
          onChange={onChange}
          config={config}
        />
      );
    case 'boolean':
      return (
        <BooleanFilter
          column={column}
          value={value as BooleanFilterValue | undefined}
          onChange={onChange}
          config={config}
        />
      );
    case 'string':
      return (
        <StringFilter
          column={column}
          value={value as StringFilterValue | undefined}
          onChange={onChange}
          config={config}
        />
      );
  }
}

interface NumericFilterProps {
  column: Column;
  data: BaseEntry[];
  value: NumericFilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  config: { type: 'numeric'; unit?: string };
}

function NumericFilter({ column, data, value, onChange, config }: NumericFilterProps) {
  const range = useMemo(() => getNumericRange(data, column.key), [data, column.key]);

  // Initialize local state from value, will be reset when popover opens
  const [localMin, setLocalMin] = useState(value?.min?.toString() ?? '');
  const [localMax, setLocalMax] = useState(value?.max?.toString() ?? '');

  // Reset local state when popover opens (value prop is current at that point)
  const resetToCurrentValue = () => {
    setLocalMin(value?.min?.toString() ?? '');
    setLocalMax(value?.max?.toString() ?? '');
  };

  // Call reset on mount effect - safe because it's inside popover content
  useEffect(() => {
    resetToCurrentValue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = () => {
    const min = localMin ? parseFloat(localMin) : undefined;
    const max = localMax ? parseFloat(localMax) : undefined;

    if (min === undefined && max === undefined) {
      onChange(undefined);
    } else {
      onChange({ min, max });
    }
  };

  return (
    <div className="filter-content">
      {range && (
        <div className="filter-hint">
          Range: {range.min.toLocaleString()} - {range.max.toLocaleString()}
          {config.unit && ` ${config.unit}`}
        </div>
      )}
      <div className="filter-numeric-inputs">
        <div className="filter-input-group">
          <label>Min</label>
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder={range?.min.toString() ?? ''}
            className="filter-input"
          />
        </div>
        <div className="filter-input-group">
          <label>Max</label>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder={range?.max.toString() ?? ''}
            className="filter-input"
          />
        </div>
      </div>
      <button className="filter-apply-btn" onClick={handleApply}>
        Apply
      </button>
    </div>
  );
}

interface SelectFilterProps {
  column: Column;
  data: BaseEntry[];
  value: SelectFilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  config: { type: 'select'; options?: string[]; multi?: boolean; exclude?: boolean };
}

function SelectFilter({ column, data, value, onChange, config }: SelectFilterProps) {
  const options = useMemo(
    () => config.options ?? getUniqueValues(data, column.key),
    [config.options, data, column.key]
  );

  const [search, setSearch] = useState('');
  const [exclude, setExclude] = useState(value?.exclude ?? false);
  const selected = value?.selected ?? [];

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) => opt.toLowerCase().includes(searchLower));
  }, [options, search]);

  const toggleOption = (opt: string) => {
    const newSelected = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];

    if (newSelected.length === 0) {
      onChange(undefined);
    } else {
      onChange({ selected: newSelected, exclude });
    }
  };

  const toggleExclude = () => {
    const newExclude = !exclude;
    setExclude(newExclude);
    if (selected.length > 0) {
      onChange({ selected, exclude: newExclude });
    }
  };

  const selectAll = () => {
    onChange({ selected: filteredOptions, exclude });
  };

  const clearAll = () => {
    onChange(undefined);
  };

  return (
    <div className="filter-content">
      <div className="filter-select-header">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search options..."
          className="filter-input filter-search"
        />
        <button
          className={`filter-exclude-btn${exclude ? ' filter-exclude-btn--active' : ''}`}
          onClick={toggleExclude}
          title={exclude ? 'Excluding selected values' : 'Including selected values'}
        >
          {exclude ? 'Exclude' : 'Include'}
        </button>
      </div>
      <div className="filter-select-actions">
        <button className="filter-action-btn" onClick={selectAll}>
          Select all
        </button>
        <button className="filter-action-btn" onClick={clearAll}>
          Clear
        </button>
      </div>
      <div className="filter-options-list">
        {filteredOptions.map((opt) => (
          <label key={opt} className="filter-option">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggleOption(opt)}
            />
            <span className="filter-option-label">{opt}</span>
            {selected.includes(opt) && <Check size={14} className="filter-check" />}
          </label>
        ))}
        {filteredOptions.length === 0 && (
          <div className="filter-no-options">No matching options</div>
        )}
      </div>
    </div>
  );
}

interface BooleanFilterProps {
  column: Column;
  value: BooleanFilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  config: { type: 'boolean'; trueLabel?: string; falseLabel?: string };
}

function BooleanFilter({ value, onChange, config }: BooleanFilterProps) {
  const currentValue = value?.value ?? null;
  const trueLabel = config.trueLabel ?? 'Yes';
  const falseLabel = config.falseLabel ?? 'No';

  const handleChange = (newValue: boolean | null) => {
    if (newValue === null) {
      onChange(undefined);
    } else {
      onChange({ value: newValue });
    }
  };

  return (
    <div className="filter-content">
      <div className="filter-boolean-options">
        <button
          className={`filter-boolean-btn${currentValue === null ? ' filter-boolean-btn--active' : ''}`}
          onClick={() => handleChange(null)}
        >
          Any
        </button>
        <button
          className={`filter-boolean-btn${currentValue === true ? ' filter-boolean-btn--active' : ''}`}
          onClick={() => handleChange(true)}
        >
          {trueLabel}
        </button>
        <button
          className={`filter-boolean-btn${currentValue === false ? ' filter-boolean-btn--active' : ''}`}
          onClick={() => handleChange(false)}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  );
}

interface StringFilterProps {
  column: Column;
  value: StringFilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  config: { type: 'string'; fuzzy?: boolean };
}

function StringFilter({ value, onChange, config }: StringFilterProps) {
  const [localValue, setLocalValue] = useState(value?.value ?? '');
  const [fuzzy, setFuzzy] = useState(value?.fuzzy ?? config.fuzzy ?? false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset local state when popover opens
  useEffect(() => {
    setLocalValue(value?.value ?? '');
    setFuzzy(value?.fuzzy ?? config.fuzzy ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (newValue: string, newFuzzy: boolean) => {
    setLocalValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!newValue.trim()) {
        onChange(undefined);
      } else {
        onChange({ value: newValue, fuzzy: newFuzzy });
      }
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="filter-content">
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value, fuzzy)}
        placeholder="Filter text..."
        className="filter-input"
      />
      <label className="filter-fuzzy-toggle">
        <input
          type="checkbox"
          checked={fuzzy}
          onChange={(e) => {
            setFuzzy(e.target.checked);
            if (localValue) {
              onChange({ value: localValue, fuzzy: e.target.checked });
            }
          }}
        />
        <span>Fuzzy match (space-separated terms)</span>
      </label>
    </div>
  );
}
