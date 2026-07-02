import { useState, useMemo, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { X, Check, ArrowUp, ArrowDown, ArrowUpDown, EyeOff } from 'lucide-react';
import type { Column, FilterConfig } from '~/lib/columns';
import type { BaseEntry } from '~/lib/types';
import { priceUSD } from '~/lib/currency';
import { Tooltip } from '~/components/ui/Tooltip';
import { useNow } from '~/hooks/useNow';

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

export interface DateFilterValue {
  /** ISO day (YYYY-MM-DD): keep entries updated on/after this date */
  since: string;
}

export type FilterValue =
  | NumericFilterValue
  | SelectFilterValue
  | BooleanFilterValue
  | StringFilterValue
  | DateFilterValue;

/**
 * Loose "since" text: a year (2024), year-month (2024-06), or a full date.
 * Returns a normalized ISO day, or null when it isn't date-ish.
 */
export function parseSinceInput(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{1,2}$/.test(s)) {
    const [y, m] = s.split('-');
    return `${y}-${m.padStart(2, '0')}-01`;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

export type FilterState = Record<string, FilterValue>;

interface ColumnFilterProps {
  column: Column;
  data: BaseEntry[];
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
}

// Resolve a possibly-dotted key (e.g. "outputs.count") against an object
function resolveKey(item: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((v, k) => {
    if (v == null) return null;
    return (v as Record<string, unknown>)[k];
  }, item);
}

// Parse numeric value from string (handles units like "16 A", "50 V")
function parseNumericValue(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const str = String(val);
  const match = str.match(/^([\d.,]+)/);
  if (match) {
    const num = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(num)) return num;
  }
  // Currency-shaped values ("$25", {amount, currency}, price-tier arrays)
  // compare in normalized USD, matching how price columns sort.
  return priceUSD(val);
}

// Get unique values from data for a column
function getUniqueValues(data: BaseEntry[], key: string): string[] {
  const values = new Set<string>();
  for (const item of data) {
    const val = resolveKey(item, key);
    if (val == null) continue;
    if (Array.isArray(val)) {
      val.forEach((v) => values.add(String(v)));
    } else {
      values.add(String(val));
    }
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

// Get min/max values from data for a numeric column. A column's sortValue
// normalizer (prices → USD, quantities → base units) takes precedence so the
// slider bounds match how the filter compares.
function getNumericRange(
  data: BaseEntry[],
  key: string,
  sortValue?: Column['sortValue']
): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  let hasValues = false;

  for (const item of data) {
    const raw = resolveKey(item, key);
    const normalized = sortValue ? sortValue(raw, item) : parseNumericValue(raw);
    const val = typeof normalized === 'number' ? normalized : null;
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

  if ('since' in value) {
    return !!value.since;
  }
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

// Apply filter to a single item. `sortValue` (from the column) normalizes
// values before numeric comparison so filters agree with sorting.
export function applyFilter(
  item: BaseEntry,
  key: string,
  config: FilterConfig,
  value: FilterValue,
  sortValue?: Column['sortValue']
): boolean {
  const itemValue = resolveKey(item, key);

  switch (config.type) {
    case 'date': {
      const filterVal = value as DateFilterValue;
      if (!filterVal.since) return true;
      const date =
        itemValue instanceof Date ? itemValue : itemValue ? new Date(String(itemValue)) : null;
      if (!date || isNaN(date.getTime())) return true; // don't drop unknown dates
      return date.getTime() >= new Date(`${filterVal.since}T00:00:00`).getTime();
    }

    case 'numeric': {
      const normalized = sortValue ? sortValue(itemValue, item) : parseNumericValue(itemValue);
      const numValue = typeof normalized === 'number' ? normalized : null;
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
  /** This column's place in the sort layers, if any */
  sortState: { dir: SortDirection; index: number; count: number } | null;
  /** True when other columns are already sorted (enables "add level") */
  hasOtherSort: boolean;
  onSortChange: (dir: SortDirection | null, additive?: boolean) => void;
  onHide?: () => void;
  children: React.ReactNode;
}

export function ColumnHeaderPopover({
  column,
  data,
  filterValue,
  onFilterChange,
  sortState,
  hasOtherSort,
  onSortChange,
  onHide,
  children,
}: ColumnHeaderPopoverProps) {
  const [open, setOpen] = useState(false);
  const hasFilter = column.filterConfig != null;
  const isSortable = column.sortable !== false && column.key !== 'links';
  const isFilterActive_ = isFilterActive(filterValue);
  const isSorted = sortState != null;
  const sortDir = sortState?.dir ?? null;

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
        >
          {children}
          {isSortable && (
            <span className="column-header-sort-indicator">
              {isSorted && sortDir === 'asc' && <ArrowUp size={14} />}
              {isSorted && sortDir === 'desc' && <ArrowDown size={14} />}
              {sortState && sortState.count > 1 && (
                <sup className="column-header-sort-layer">{sortState.index}</sup>
              )}
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
              <Tooltip content="Hide column">
                <button
                  className="column-header-hide-btn"
                  onClick={() => {
                    onHide();
                    setOpen(false);
                  }}
                >
                  <EyeOff size={14} />
                </button>
              </Tooltip>
            )}
          </div>

          {/* Sort controls */}
          {isSortable && (
            <div className="column-header-sort-section">
              <div className="column-header-section-label">
                Sort
                {sortState && sortState.count > 1 ? ` (level ${sortState.index})` : ''}
              </div>
              <div className="column-header-sort-buttons">
                <button
                  className={`column-header-sort-btn${sortDir === 'asc' ? ' column-header-sort-btn--active' : ''}`}
                  onClick={() => onSortChange('asc')}
                >
                  <ArrowUp size={14} />
                  Ascending
                </button>
                <button
                  className={`column-header-sort-btn${sortDir === 'desc' ? ' column-header-sort-btn--active' : ''}`}
                  onClick={() => onSortChange('desc')}
                >
                  <ArrowDown size={14} />
                  Descending
                </button>
                {isSorted && (
                  <button
                    className="column-header-sort-btn column-header-sort-btn--clear"
                    onClick={() => onSortChange(null)}
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>
              {hasOtherSort && !isSorted && (
                <div className="column-header-sort-buttons">
                  <Tooltip content="Keep the current sort and use this column to break ties">
                    <button
                      className="column-header-sort-btn"
                      onClick={() => onSortChange(column.defaultSortDir ?? 'asc', true)}
                    >
                      <ArrowUpDown size={14} />
                      Add as tie-break level
                    </button>
                  </Tooltip>
                </div>
              )}
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
    case 'date':
      return <DateFilter value={value as DateFilterValue | undefined} onChange={onChange} />;
  }
}

// "Since" filter: big obvious presets first, a forgiving text field second,
// and a native date picker only for those who go looking for it.
function DateFilter({
  value,
  onChange,
}: {
  value: DateFilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
}) {
  const [text, setText] = useState(value?.since ?? '');
  const [showPicker, setShowPicker] = useState(false);
  // Client clock (0 during SSR/hydration); the popover only opens
  // client-side, so this is always set before the presets are visible.
  const now = useNow();

  const setSince = (since: string | null) => {
    setText(since ?? '');
    onChange(since ? { since } : undefined);
  };
  const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString().slice(0, 10);
  const presets: [string, string][] =
    now === 0
      ? []
      : [
          ['Last 90 days', daysAgo(90)],
          ['Last 365 days', daysAgo(365)],
          ['This year', `${new Date(now).getFullYear()}-01-01`],
        ];

  const commitText = () => {
    if (text.trim() === '') {
      setSince(null);
      return;
    }
    const parsed = parseSinceInput(text);
    if (parsed) setSince(parsed);
  };

  return (
    <div className="filter-date">
      <div className="filter-date-presets">
        {presets.map(([label, since]) => (
          <button
            key={label}
            className={`filter-action-btn${value?.since === since ? ' filter-action-btn--active' : ''}`}
            onClick={() => setSince(value?.since === since ? null : since)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-date-since">
        <input
          type="text"
          className="filter-input"
          placeholder="since… (2024, 2024-06, or 2024-06-15)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => e.key === 'Enter' && commitText()}
        />
        <Tooltip content="Pick from a calendar instead">
          <button className="filter-action-btn" onClick={() => setShowPicker((v) => !v)}>
            📅
          </button>
        </Tooltip>
      </div>
      {showPicker && (
        <input
          type="date"
          className="filter-input"
          value={value?.since ?? ''}
          onChange={(e) => setSince(e.target.value || null)}
        />
      )}
      {value?.since && (
        <button className="filter-clear-btn" onClick={() => setSince(null)}>
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}

interface NumericFilterProps {
  column: Column;
  data: BaseEntry[];
  value: NumericFilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
  config: { type: 'numeric'; unit?: string };
}

function NumericFilter({ column, data, value, onChange, config }: NumericFilterProps) {
  const range = useMemo(
    () => getNumericRange(data, column.key, column.sortValue),
    [data, column.key, column.sortValue]
  );

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
          Range: {range.min.toLocaleString('en-US')} - {range.max.toLocaleString('en-US')}
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
        <Tooltip
          content={
            exclude
              ? 'Matching entries are hidden; click to include instead'
              : 'Matching entries are shown; click to exclude instead'
          }
        >
          <button
            className={`filter-exclude-btn${exclude ? ' filter-exclude-btn--active' : ''}`}
            onClick={toggleExclude}
          >
            {exclude ? 'Exclude' : 'Include'}
          </button>
        </Tooltip>
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
