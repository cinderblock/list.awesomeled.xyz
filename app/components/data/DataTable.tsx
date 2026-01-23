import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronUp, ChevronDown, X, Download, Search } from 'lucide-react';
import type { Column } from '~/lib/columns';
import type { BaseEntry } from '~/lib/types';
import { generateCSV } from '~/lib/csv';
import {
  ColumnFilter,
  isFilterActive,
  applyFilter,
  type FilterState,
  type FilterValue,
  type NumericFilterValue,
  type SelectFilterValue,
  type BooleanFilterValue,
  type StringFilterValue,
} from './ColumnFilter';

interface DataTableProps {
  data: BaseEntry[];
  columns: Column[];
  categoryPath: string;
  categoryId: string;
  searchKeys?: string[];
}

type SortDirection = 'asc' | 'desc';

// Parse numeric value from string for sorting (handles "16 A", "50 V", etc.)
function parseNumericForSort(val: unknown): number | null {
  if (val == null) return null;
  if (typeof val === 'number') return val;
  const str = String(val);
  const match = str.match(/^([\d.,]+)/);
  if (!match) return null;
  const num = parseFloat(match[1].replace(/,/g, ''));
  return isNaN(num) ? null : num;
}

// Get human-readable description of a filter value
function getFilterDescription(value: FilterValue): string {
  if ('min' in value || 'max' in value) {
    const v = value as NumericFilterValue;
    if (v.min !== undefined && v.max !== undefined) {
      return `${v.min} - ${v.max}`;
    }
    if (v.min !== undefined) return `≥ ${v.min}`;
    if (v.max !== undefined) return `≤ ${v.max}`;
    return '';
  }
  if ('selected' in value) {
    const v = value as SelectFilterValue;
    const prefix = v.exclude ? 'not ' : '';
    if (v.selected.length <= 2) {
      return prefix + v.selected.join(', ');
    }
    return `${prefix}${v.selected.length} selected`;
  }
  if ('value' in value && typeof value.value === 'boolean') {
    return (value as BooleanFilterValue).value ? 'Yes' : 'No';
  }
  if ('value' in value && typeof value.value === 'string') {
    const v = value as StringFilterValue;
    return v.fuzzy ? `"${v.value}" (fuzzy)` : `"${v.value}"`;
  }
  return '';
}

// =============================================================================
// Clean URL Format for Filters
// Format: ?f=col:value|col:min-max|col:!val1,val2|col:~fuzzy text
//
// Examples:
//   manufacturer:Falcon,HolidayCoro     - select: include Falcon OR HolidayCoro
//   manufacturer:!Falcon,HolidayCoro    - select: exclude Falcon AND HolidayCoro
//   price:100-500                       - numeric: between 100 and 500
//   price:100-                          - numeric: >= 100
//   price:-500                          - numeric: <= 500
//   wled:yes / wled:no                  - boolean
//   features:~led strip                 - string with fuzzy matching
//   features:led                        - string exact contains
// =============================================================================

// Escape special chars in filter values for URL encoding
function escapeFilterValue(val: string): string {
  // Escape | : , ~ ! - that have special meaning
  return val.replace(/([|:,~!-])/g, '\\$1');
}

// Unescape special chars
function unescapeFilterValue(val: string): string {
  return val.replace(/\\([|:,~!-])/g, '$1');
}

// Serialize a single filter value to compact string
function serializeOneFilter(key: string, value: FilterValue): string {
  if ('min' in value || 'max' in value) {
    const v = value as NumericFilterValue;
    const min = v.min !== undefined ? v.min : '';
    const max = v.max !== undefined ? v.max : '';
    return `${key}:${min}-${max}`;
  }
  if ('selected' in value) {
    const v = value as SelectFilterValue;
    const prefix = v.exclude ? '!' : '';
    const vals = v.selected.map(escapeFilterValue).join(',');
    return `${key}:${prefix}${vals}`;
  }
  if ('value' in value && typeof value.value === 'boolean') {
    return `${key}:${(value as BooleanFilterValue).value ? 'yes' : 'no'}`;
  }
  if ('value' in value && typeof value.value === 'string') {
    const v = value as StringFilterValue;
    const prefix = v.fuzzy ? '~' : '';
    return `${key}:${prefix}${escapeFilterValue(v.value)}`;
  }
  return '';
}

// Parse a single filter from compact string
function parseOneFilter(str: string): { key: string; value: FilterValue } | null {
  const colonIdx = str.indexOf(':');
  if (colonIdx === -1) return null;

  const key = str.slice(0, colonIdx);
  const rawValue = str.slice(colonIdx + 1);

  if (!key || rawValue === '') return null;

  // Boolean: yes/no
  if (rawValue === 'yes') {
    return { key, value: { value: true } as BooleanFilterValue };
  }
  if (rawValue === 'no') {
    return { key, value: { value: false } as BooleanFilterValue };
  }

  // Numeric range: check for pattern like "100-500", "100-", "-500"
  // But avoid matching select values that happen to contain hyphens
  const numericMatch = rawValue.match(/^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/);
  if (numericMatch) {
    const [, minStr, maxStr] = numericMatch;
    const min = minStr ? parseFloat(minStr) : undefined;
    const max = maxStr ? parseFloat(maxStr) : undefined;
    if (min !== undefined || max !== undefined) {
      return { key, value: { min, max } as NumericFilterValue };
    }
  }

  // String with fuzzy: starts with ~
  if (rawValue.startsWith('~')) {
    return {
      key,
      value: { value: unescapeFilterValue(rawValue.slice(1)), fuzzy: true } as StringFilterValue,
    };
  }

  // Select with exclude: starts with !
  if (rawValue.startsWith('!')) {
    const vals = splitFilterValues(rawValue.slice(1));
    return { key, value: { selected: vals, exclude: true } as SelectFilterValue };
  }

  // Select (include): comma-separated values
  if (rawValue.includes(',') || !rawValue.includes('~')) {
    const vals = splitFilterValues(rawValue);
    // If single value without special chars, could be string filter
    // Heuristic: if it looks like multiple values or has commas, it's select
    if (vals.length > 1 || rawValue.includes(',')) {
      return { key, value: { selected: vals, exclude: false } as SelectFilterValue };
    }
    // Single value - treat as select with one option
    return { key, value: { selected: vals, exclude: false } as SelectFilterValue };
  }

  // Default: string filter
  return {
    key,
    value: { value: unescapeFilterValue(rawValue), fuzzy: false } as StringFilterValue,
  };
}

// Split comma-separated values respecting escapes
function splitFilterValues(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let escaped = false;

  for (const char of str) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === ',') {
      if (current) result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) result.push(current);

  return result.map(unescapeFilterValue);
}

// Serialize all filters to single URL param value
function serializeFilters(filters: FilterState): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(filters)) {
    if (isFilterActive(value)) {
      const serialized = serializeOneFilter(key, value);
      if (serialized) parts.push(serialized);
    }
  }
  return parts.join('|');
}

// Parse all filters from URL param value
function parseFilters(str: string): FilterState {
  const filters: FilterState = {};
  if (!str) return filters;

  // Split by | but respect escaped \|
  const parts: string[] = [];
  let current = '';
  let escaped = false;

  for (const char of str) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
      current += char;
    } else if (char === '|') {
      if (current) parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current) parts.push(current);

  for (const part of parts) {
    const parsed = parseOneFilter(part);
    if (parsed) {
      filters[parsed.key] = parsed.value;
    }
  }

  return filters;
}

// localStorage key prefix for saved filters
const FILTER_STORAGE_KEY = 'awesomeledlist_filters_';

// Storage format for localStorage (same clean format as URL)
interface StoredFilters {
  q?: string;
  sort?: string;
  dir?: string;
  f?: string;
}

// Save filter state to localStorage for a category
function saveFiltersToStorage(categoryId: string, searchParams: URLSearchParams) {
  try {
    const filterData: StoredFilters = {};
    const q = searchParams.get('q');
    const sort = searchParams.get('sort');
    const dir = searchParams.get('dir');
    const f = searchParams.get('f');

    if (q) filterData.q = q;
    if (sort) filterData.sort = sort;
    if (dir) filterData.dir = dir;
    if (f) filterData.f = f;

    if (Object.keys(filterData).length > 0) {
      localStorage.setItem(FILTER_STORAGE_KEY + categoryId, JSON.stringify(filterData));
    } else {
      localStorage.removeItem(FILTER_STORAGE_KEY + categoryId);
    }
  } catch {
    // localStorage may not be available
  }
}

// Load filter state from localStorage for a category
function loadFiltersFromStorage(categoryId: string): StoredFilters | null {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY + categoryId);
    if (stored) {
      return JSON.parse(stored) as StoredFilters;
    }
  } catch {
    // localStorage may not be available or data may be corrupted
  }
  return null;
}

export function DataTable({
  data,
  columns,
  categoryPath,
  categoryId,
  searchKeys = ['name'],
}: DataTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('q') || '';
  const sortKey = searchParams.get('sort') || null;
  const sortDir = (searchParams.get('dir') as SortDirection) || null;

  // Track if we've already restored from localStorage
  const hasRestoredRef = useRef(false);

  // Restore filters from localStorage on initial mount (only if URL has no filters)
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    // Check if URL already has filter params
    const hasUrlFilters = Array.from(searchParams.keys()).some(
      (key) => key === 'q' || key === 'sort' || key === 'dir' || key === 'f'
    );

    if (hasUrlFilters) return; // Don't override URL params

    const savedFilters = loadFiltersFromStorage(categoryId);
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (savedFilters.q) next.set('q', savedFilters.q);
          if (savedFilters.sort) next.set('sort', savedFilters.sort);
          if (savedFilters.dir) next.set('dir', savedFilters.dir);
          if (savedFilters.f) next.set('f', savedFilters.f);
          return next;
        },
        { replace: true }
      ); // Use replace to avoid adding to history
    }
  }, [categoryId, searchParams, setSearchParams]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    saveFiltersToStorage(categoryId, searchParams);
  }, [categoryId, searchParams]);

  // Parse filters from URL (new clean format)
  const urlFilters = useMemo(() => {
    const filterParam = searchParams.get('f') || '';
    return parseFilters(filterParam);
  }, [searchParams]);

  // Local search state for immediate input response
  const [search, setSearchLocal] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when URL changes externally
  useEffect(() => {
    setSearchLocal(urlSearch);
  }, [urlSearch]);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(updates)) {
          if (value === null || value === '') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchLocal(value);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        updateParams({ q: value || null });
      }, 150);
    },
    [updateParams]
  );

  // Update a column filter (using clean URL format)
  const setColumnFilter = useCallback(
    (colKey: string, value: FilterValue | undefined) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        // Parse current filters
        const currentFilters = parseFilters(prev.get('f') || '');

        // Update or remove the filter
        if (value && isFilterActive(value)) {
          currentFilters[colKey] = value;
        } else {
          delete currentFilters[colKey];
        }

        // Serialize back
        const serialized = serializeFilters(currentFilters);
        if (serialized) {
          next.set('f', serialized);
        } else {
          next.delete('f');
        }

        return next;
      });
    },
    [setSearchParams]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearAllFilters = useCallback(() => {
    // Clear localStorage for this category
    try {
      localStorage.removeItem(FILTER_STORAGE_KEY + categoryId);
    } catch {
      // localStorage may not be available
    }
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      // Only keep non-filter params
      for (const [key, value] of prev.entries()) {
        if (key !== 'f' && key !== 'q' && key !== 'sort' && key !== 'dir') {
          next.set(key, value);
        }
      }
      return next;
    });
  }, [setSearchParams, categoryId]);

  // Get columns with filter configs
  const filterableColumns = useMemo(() => columns.filter((col) => col.filterConfig), [columns]);

  // Filter data by search (space-separated fuzzy search)
  const searchFilteredData = useMemo(() => {
    if (!search.trim()) return data;

    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return data.filter((item) =>
      terms.every((term) =>
        searchKeys.some((key) => {
          const value = (item as Record<string, unknown>)[key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(term);
        })
      )
    );
  }, [data, search, searchKeys]);

  // Apply column filters
  const filteredData = useMemo(() => {
    let result = searchFilteredData;

    for (const col of filterableColumns) {
      const filterValue = urlFilters[col.key];
      if (filterValue && isFilterActive(filterValue) && col.filterConfig) {
        result = result.filter((item) =>
          applyFilter(item, col.key, col.filterConfig!, filterValue)
        );
      }
    }

    return result;
  }, [searchFilteredData, filterableColumns, urlFilters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? 1 : -1;
      if (bVal == null) return sortDir === 'asc' ? -1 : 1;

      // Handle numeric values with units (e.g., "16 A", "50 V")
      const aNum = parseNumericForSort(aVal);
      const bNum = parseNumericForSort(bVal);
      if (aNum !== null && bNum !== null) {
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') {
        updateParams({ dir: 'desc' });
      } else {
        updateParams({ sort: null, dir: null });
      }
    } else {
      updateParams({ sort: key, dir: 'asc' });
    }
  };

  // Count active filters
  const activeFilterCount = Object.values(urlFilters).filter(isFilterActive).length;
  const hasFilters = search || sortKey || activeFilterCount > 0;

  // Get active filter descriptions for display
  const activeFilters = useMemo(() => {
    const result: { key: string; label: string; description: string }[] = [];
    for (const col of filterableColumns) {
      const filterValue = urlFilters[col.key];
      if (filterValue && isFilterActive(filterValue)) {
        result.push({
          key: col.key,
          label: col.label,
          description: getFilterDescription(filterValue),
        });
      }
    }
    return result;
  }, [filterableColumns, urlFilters]);

  const getValue = (item: BaseEntry, key: string): unknown => {
    const parts = key.split('.');
    let value: unknown = item;
    for (const part of parts) {
      if (value == null) return null;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  };

  // Check if data is filtered (search or column filters active)
  const isFiltered = search || activeFilterCount > 0;

  // Build filename with filter info
  const getFilteredFilename = useCallback(() => {
    const parts = [categoryId];

    if (search) {
      parts.push(`q-${search.replace(/\s+/g, '_').slice(0, 20)}`);
    }

    if (sortKey) {
      parts.push(`sort-${sortKey}${sortDir === 'desc' ? '-desc' : ''}`);
    }

    for (const { key, description } of activeFilters.slice(0, 3)) {
      const sanitized = description.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 15);
      if (sanitized) parts.push(`${key}-${sanitized}`);
    }

    return `${parts.join('_')}.csv`;
  }, [categoryId, search, sortKey, sortDir, activeFilters]);

  // CSV export - generate on-the-fly only when filtered
  const handleDownloadCSV = useCallback(() => {
    const csv = generateCSV(sortedData, columns);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFilteredFilename();
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedData, columns, getFilteredFilename]);

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      <div className="sticky-controls">
        <div className="flex flex-wrap items-center gap-4">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search (space-separated)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-muted text-sm">
            {sortedData.length} of {data.length} entries
            {activeFilterCount > 0 &&
              ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''})`}
          </span>
          {hasFilters && (
            <button onClick={clearAllFilters} className="btn btn-ghost btn-sm">
              <X size={16} />
              Clear all
            </button>
          )}
          {isFiltered ? (
            <button onClick={handleDownloadCSV} className="btn btn-outline btn-sm">
              <Download size={16} />
              Download CSV
            </button>
          ) : (
            <a href={`${categoryPath}.csv`} download className="btn btn-outline btn-sm">
              <Download size={16} />
              Download CSV
            </a>
          )}
        </div>
        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map(({ key, label, description }) => (
              <span key={key} className="active-filter-tag">
                <strong>{label}:</strong> {description}
                <button onClick={() => setColumnFilter(key, undefined)} title="Remove filter">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const colKey = String(col.key);
                const isRightAligned = col.className?.includes('text-right');
                const hasFilter = col.filterConfig != null;
                const filterValue = urlFilters[colKey];
                return (
                  <th key={colKey} className={col.className}>
                    <div className={`th-content ${isRightAligned ? 'justify-end' : ''}`}>
                      {col.sortable !== false && col.key !== 'links' ? (
                        <button className="sort-btn" onClick={() => handleSort(colKey)}>
                          {col.label}
                          {sortKey === colKey && sortDir === 'asc' && <ChevronUp size={16} />}
                          {sortKey === colKey && sortDir === 'desc' && <ChevronDown size={16} />}
                        </button>
                      ) : (
                        <span>{col.label}</span>
                      )}
                      {hasFilter && (
                        <ColumnFilter
                          column={col}
                          data={data}
                          value={filterValue}
                          onChange={(value) => setColumnFilter(colKey, value)}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="empty-state">
                  No results found.
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={item.id}>
                  {columns.map((col) => {
                    const value = getValue(item, col.key);
                    return (
                      <td key={col.key} className={col.className}>
                        {col.render ? (
                          col.render(value, item)
                        ) : col.key === 'name' ? (
                          <Link to={`${categoryPath}/${item.id}`} className="entry-link">
                            {String(value ?? '')}
                          </Link>
                        ) : (
                          <CellValue value={value} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: unknown }) {
  if (value == null) {
    return <span className="text-muted">-</span>;
  }

  if (typeof value === 'boolean') {
    return value ? (
      <span className="badge badge-success">Yes</span>
    ) : (
      <span className="badge badge-secondary">No</span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1">
        {value.map((v, i) => (
          <span key={i} className="badge badge-outline">
            {String(v)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'string' && value.startsWith('http')) {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="external-link">
        Link
      </a>
    );
  }

  return <span>{String(value)}</span>;
}
