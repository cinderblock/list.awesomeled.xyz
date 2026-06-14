import * as Popover from '@radix-ui/react-popover';
import { Columns3, Download, Eye, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Badge, getBadgeForValue, TextPill } from '~/components/ui/FeatureBadges';
import type { Column } from '~/lib/columns';
import { generateCSV } from '~/lib/csv';
import type { BaseEntry } from '~/lib/types';
import {
  applyFilter,
  ColumnHeaderPopover,
  isFilterActive,
  type BooleanFilterValue,
  type FilterState,
  type FilterValue,
  type NumericFilterValue,
  type SelectFilterValue,
  type StringFilterValue,
} from './ColumnFilter';

// Height of site header (h-14 = 3.5rem = 56px + 1px border = 57px)
const HEADER_HEIGHT = 57;
// Height of category nav bar when visible (shadow doesn't add height)
const NAV_HEIGHT = 38;
// Combined height of fixed header elements
const FIXED_HEADER_HEIGHT = HEADER_HEIGHT + NAV_HEIGHT;
// Height of sticky controls bar
const CONTROLS_HEIGHT = 52;

interface DataTableProps {
  data: BaseEntry[];
  columns: Column[];
  categoryPath: string;
  categoryId: string;
  searchKeys?: string[];
}

type SortDirection = 'asc' | 'desc';

// Resolve a possibly-dotted key (e.g. "outputs.count") against an object
function resolveKey(item: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>((v, k) => {
    if (v == null) return null;
    return (v as Record<string, unknown>)[k];
  }, item);
}

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
// localStorage key prefix for hidden columns
const HIDDEN_COLUMNS_STORAGE_KEY = 'awesomeledlist_hidden_columns_';

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

// Save hidden columns to localStorage
function saveHiddenColumnsToStorage(categoryId: string, hiddenColumns: Set<string>) {
  try {
    if (hiddenColumns.size > 0) {
      localStorage.setItem(
        HIDDEN_COLUMNS_STORAGE_KEY + categoryId,
        JSON.stringify(Array.from(hiddenColumns))
      );
    } else {
      localStorage.removeItem(HIDDEN_COLUMNS_STORAGE_KEY + categoryId);
    }
  } catch {
    // localStorage may not be available
  }
}

// Load hidden columns from localStorage
function loadHiddenColumnsFromStorage(categoryId: string): Set<string> {
  try {
    const stored = localStorage.getItem(HIDDEN_COLUMNS_STORAGE_KEY + categoryId);
    if (stored) {
      const arr = JSON.parse(stored) as string[];
      return new Set(arr);
    }
  } catch {
    // localStorage may not be available or data may be corrupted
  }
  return new Set();
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

  // Hidden columns state - initialized from localStorage
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() =>
    loadHiddenColumnsFromStorage(categoryId)
  );

  // Save hidden columns to localStorage whenever they change
  useEffect(() => {
    saveHiddenColumnsToStorage(categoryId, hiddenColumns);
  }, [categoryId, hiddenColumns]);

  // Hide a column
  const hideColumn = useCallback((colKey: string) => {
    setHiddenColumns((prev) => new Set([...prev, colKey]));
  }, []);

  // Show a column
  const showColumn = useCallback((colKey: string) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      next.delete(colKey);
      return next;
    });
  }, []);

  // Show all columns
  const showAllColumns = useCallback(() => {
    setHiddenColumns(new Set());
  }, []);

  // Visible columns (filtered by hidden state)
  const visibleColumns = useMemo(
    () => columns.filter((col) => !hiddenColumns.has(col.key)),
    [columns, hiddenColumns]
  );

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

  // Handle clicks on badges to toggle filters
  const handleBadgeClick = useCallback(
    (e: React.MouseEvent<HTMLTableSectionElement>) => {
      const target = e.target as HTMLElement;

      // Check if clicked on a badge
      if (!target.classList.contains('badge')) return;

      // Find the column key from the closest td
      const td = target.closest('td[data-col]') as HTMLElement | null;
      if (!td) return;

      const colKey = td.dataset.col;
      if (!colKey) return;

      // Check if this column has a select or boolean filter
      const col = columns.find((c) => c.key === colKey);
      if (!col?.filterConfig) return;

      const filterType = col.filterConfig.type;
      if (filterType !== 'select' && filterType !== 'boolean') return;

      // Get the badge text content
      const badgeText = target.textContent?.trim();
      if (!badgeText) return;

      // For boolean filters
      if (filterType === 'boolean') {
        const currentFilter = urlFilters[colKey] as BooleanFilterValue | undefined;
        const clickedValue = badgeText.toLowerCase() === 'yes';

        if (currentFilter?.value === clickedValue) {
          // Already filtered to this value, remove filter
          setColumnFilter(colKey, undefined);
        } else {
          // Set filter to this value
          setColumnFilter(colKey, { value: clickedValue });
        }
        return;
      }

      // For select filters - toggle this value in the selection
      const currentFilter = urlFilters[colKey] as SelectFilterValue | undefined;
      const currentSelected = currentFilter?.selected || [];

      if (currentSelected.includes(badgeText)) {
        // Remove from selection
        const newSelected = currentSelected.filter((v) => v !== badgeText);
        if (newSelected.length === 0) {
          setColumnFilter(colKey, undefined);
        } else {
          setColumnFilter(colKey, {
            selected: newSelected,
            exclude: currentFilter?.exclude || false,
          });
        }
      } else {
        // Add to selection
        setColumnFilter(colKey, {
          selected: [...currentSelected, badgeText],
          exclude: currentFilter?.exclude || false,
        });
      }
    },
    [columns, urlFilters, setColumnFilter]
  );

  // Get columns with filter configs
  const filterableColumns = useMemo(() => columns.filter((col) => col.filterConfig), [columns]);

  // Filter data by search (space-separated fuzzy search)
  const searchFilteredData = useMemo(() => {
    if (!search.trim()) return data;

    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return data.filter((item) =>
      terms.every((term) =>
        searchKeys.some((key) => {
          const value = resolveKey(item, key);
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
      const aVal = resolveKey(a, sortKey);
      const bVal = resolveKey(b, sortKey);

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

  // CSV export - generate on-the-fly only when filtered (uses user's locale for dates)
  const handleDownloadCSV = useCallback(() => {
    const csv = generateCSV(sortedData, columns, { useLocale: true });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = getFilteredFilename();
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedData, columns, getFilteredFilename]);

  // Refs for sticky header sync - use refs for position to avoid re-renders on scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const stickyHeaderScrollRef = useRef<HTMLDivElement>(null);
  const stickyMaskRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<Element | null>(null);

  // Cache for element measurements to avoid getBoundingClientRect on every scroll
  const measurementsRef = useRef({
    tableLeft: 0,
    tableWidth: 0,
    theadTop: 0,
    controlsHeight: CONTROLS_HEIGHT,
    headerHeight: 44,
  });

  // RAF frame ID for batching scroll updates
  const rafIdRef = useRef<number | null>(null);

  // State only for things that need re-render (column widths for colgroup)
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [controlsHeight, setControlsHeight] = useState(CONTROLS_HEIGHT);
  const [headerHeight, setHeaderHeight] = useState(44);

  // Measure and cache all element dimensions
  const measureAll = useCallback(() => {
    if (!tableRef.current || !controlsRef.current) return;
    const thead = tableRef.current.querySelector('thead');
    if (!thead) return;

    // Cache the table container reference (only query once)
    if (!tableContainerRef.current) {
      tableContainerRef.current = tableRef.current.closest('.data-table-container');
    }
    if (!tableContainerRef.current) return;

    const containerRect = tableContainerRef.current.getBoundingClientRect();
    const theadRect = thead.getBoundingClientRect();
    const controlsRect = controlsRef.current.getBoundingClientRect();

    // Cache measurements
    measurementsRef.current = {
      tableLeft: containerRect.left,
      tableWidth: containerRect.width,
      theadTop: theadRect.top,
      controlsHeight: controlsRect.height,
      headerHeight: theadRect.height,
    };

    // Update state for things that need re-render
    const ths = thead.querySelectorAll('th');
    const widths = Array.from(ths).map((th) => th.getBoundingClientRect().width);
    setColumnWidths(widths);
    setControlsHeight(controlsRect.height);
    setHeaderHeight(theadRect.height);
  }, []);

  // Sync horizontal scroll - mirror scroll position directly (no RAF needed, very fast)
  const syncHorizontalScroll = useCallback(() => {
    if (!scrollContainerRef.current || !stickyHeaderScrollRef.current) return;
    const el = scrollContainerRef.current;
    const scrollLeft = el.scrollLeft;
    stickyHeaderScrollRef.current.scrollLeft = scrollLeft;

    // Toggle scrolled class for sticky column fade effect (1px threshold for sub-pixel rounding)
    const isScrolled = scrollLeft > 1;
    el.classList.toggle('data-table-scroll--scrolled', isScrolled);
    stickyHeaderScrollRef.current.classList.toggle('data-table-scroll--scrolled', isScrolled);

    // Toggle at-end class to hide right fade when scrolled to the end
    const isAtEnd = scrollLeft >= el.scrollWidth - el.clientWidth - 1;
    el.classList.toggle('data-table-scroll--at-end', isAtEnd);
    stickyHeaderScrollRef.current.classList.toggle('data-table-scroll--at-end', isAtEnd);
  }, []);

  // Check visibility using cached measurements where possible
  const checkStickyVisibility = useCallback(() => {
    if (!tableRef.current || !controlsRef.current) return;
    const thead = tableRef.current.querySelector('thead');
    if (!thead) return;

    const theadRect = thead.getBoundingClientRect();
    const stickyTop = FIXED_HEADER_HEIGHT + measurementsRef.current.controlsHeight;
    const shouldShow = theadRect.top < stickyTop;

    if (shouldShow !== showStickyHeader) {
      setShowStickyHeader(shouldShow);
    }
  }, [showStickyHeader]);

  useEffect(() => {
    measureAll();
    // Set initial scroll classes (for fade effect)
    syncHorizontalScroll();

    const scrollContainer = scrollContainerRef.current;

    // Horizontal scroll handler - mirror scroll position
    const handleHorizontalScroll = () => {
      syncHorizontalScroll();
    };

    // Vertical scroll handler - use RAF to batch visibility checks
    // This avoids layout thrashing from getBoundingClientRect during rapid scroll
    const handleVerticalScroll = () => {
      if (rafIdRef.current) return; // Already have a pending frame
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        checkStickyVisibility();
      });
    };

    // Resize handler - re-measure everything
    const handleResize = () => {
      measureAll();
    };

    // Horizontal scroll on container
    scrollContainer?.addEventListener('scroll', handleHorizontalScroll, { passive: true });
    // Vertical scroll on window
    window.addEventListener('scroll', handleVerticalScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    const resizeObserver = new ResizeObserver(handleResize);
    if (tableRef.current) {
      resizeObserver.observe(tableRef.current);
    }
    if (controlsRef.current) {
      resizeObserver.observe(controlsRef.current);
    }

    return () => {
      scrollContainer?.removeEventListener('scroll', handleHorizontalScroll);
      window.removeEventListener('scroll', handleVerticalScroll);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [measureAll, syncHorizontalScroll, checkStickyVisibility]);

  // Re-measure when data changes
  useEffect(() => {
    const timer = setTimeout(measureAll, 50);
    return () => clearTimeout(timer);
  }, [sortedData, measureAll]);

  // Sync scroll immediately when sticky header becomes visible
  useEffect(() => {
    if (showStickyHeader) {
      syncHorizontalScroll();
    }
  }, [showStickyHeader, syncHorizontalScroll]);

  // Render the header row content (shared between original and sticky clone)
  const renderHeaderRow = () => (
    <tr>
      {visibleColumns.map((col) => {
        const colKey = String(col.key);
        const isRightAligned = col.className?.includes('data-table-cell--right');
        const filterValue = urlFilters[colKey];
        return (
          <th key={colKey} className={col.className} data-col={colKey}>
            <div
              className={`data-table-th-content${isRightAligned ? ' data-table-th-content--right' : ''}`}
            >
              <ColumnHeaderPopover
                column={col}
                data={data}
                filterValue={filterValue}
                onFilterChange={(value) => setColumnFilter(colKey, value)}
                sortKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
                onHide={col.key !== 'name' ? () => hideColumn(colKey) : undefined}
              >
                {col.label}
              </ColumnHeaderPopover>
            </div>
          </th>
        );
      })}
    </tr>
  );

  return (
    <div className="data-table-wrapper">
      {/* Sticky controls bar - outside scroll wrapper, spans full width */}
      <div ref={controlsRef} className="data-table-controls">
        <div className="data-table-controls-inner">
          <div className="data-table-search">
            <Search size={16} className="data-table-search-icon" />
            <input
              type="text"
              placeholder="Search (space-separated)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="data-table-search-input"
            />
          </div>
          <span className="data-table-count">
            {sortedData.length} of {data.length} entries
            {activeFilterCount > 0 &&
              ` (${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''})`}
          </span>
          {hasFilters && (
            <button onClick={clearAllFilters} className="btn btn--ghost btn--sm">
              <X size={16} />
              Clear all
            </button>
          )}
          {/* Column visibility dropdown */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className={`btn btn--ghost btn--sm${hiddenColumns.size > 0 ? ' btn--badge' : ''}`}
                title="Show/hide columns"
              >
                <Columns3 size={16} />
                Columns
                {hiddenColumns.size > 0 && <span className="btn-badge">{hiddenColumns.size}</span>}
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content className="column-visibility-popover" sideOffset={5} align="start">
                <div className="column-visibility-header">
                  <span className="column-visibility-title">Columns</span>
                  {hiddenColumns.size > 0 && (
                    <button className="filter-clear-btn" onClick={showAllColumns}>
                      <Eye size={14} />
                      Show all
                    </button>
                  )}
                </div>
                <div className="column-visibility-list">
                  {columns.map((col) => {
                    const isNameCol = col.key === 'name';
                    return (
                      <label
                        key={col.key}
                        className={`column-visibility-option${isNameCol ? ' column-visibility-option--disabled' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.has(col.key)}
                          disabled={isNameCol}
                          onChange={() =>
                            hiddenColumns.has(col.key) ? showColumn(col.key) : hideColumn(col.key)
                          }
                        />
                        <span className="column-visibility-label">{col.label || 'Links'}</span>
                      </label>
                    );
                  })}
                </div>
                <Popover.Arrow className="filter-arrow" />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <div style={{ marginLeft: 'auto' }}>
            {isFiltered ? (
              <button onClick={handleDownloadCSV} className="btn btn--outline btn--sm">
                <Download size={16} />
                Download CSV
              </button>
            ) : (
              <a href={`${categoryPath}.csv`} download className="btn btn--outline btn--sm">
                <Download size={16} />
                Download CSV
              </a>
            )}
          </div>
        </div>
        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="data-table-active-filters">
            {activeFilters.map(({ key, label, description }) => (
              <span key={key} className="data-table-filter-tag">
                <strong>{label}:</strong> {description}
                <button onClick={() => setColumnFilter(key, undefined)} title="Remove filter">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Background mask to hide table rows scrolling behind sticky header and controls */}
      <div
        ref={stickyMaskRef}
        className="data-table-sticky-mask"
        style={{
          position: 'fixed',
          top: FIXED_HEADER_HEIGHT,
          left: 0,
          right: 0,
          height: controlsHeight + headerHeight,
          zIndex: 24,
          visibility: showStickyHeader ? 'visible' : 'hidden',
        }}
      />

      {/* Sticky header clone - fixed to viewport, uses scroll mirroring */}
      <div
        ref={stickyHeaderRef}
        className="data-table-sticky-header"
        style={{
          position: 'fixed',
          top: FIXED_HEADER_HEIGHT + controlsHeight,
          left: 0,
          right: 0,
          zIndex: 25,
          visibility: showStickyHeader && columnWidths.length > 0 ? 'visible' : 'hidden',
        }}
      >
        {/* Inner scroll container - mirrors horizontal scroll of main table */}
        <div ref={stickyHeaderScrollRef} className="data-table-sticky-header-scroll">
          {/* Inner wrapper to match main table's centering structure */}
          <div className="data-table-scroll-inner">
            <table
              className="data-table"
              style={{
                tableLayout: 'fixed',
                width: columnWidths.reduce((sum, w) => sum + w, 0),
              }}
            >
              <colgroup>
                {columnWidths.map((width, i) => (
                  <col key={i} style={{ width }} />
                ))}
              </colgroup>
              <thead>{renderHeaderRow()}</thead>
            </table>
            {/* Spacer to match main table's scrollbar spacer */}
            <div className="data-table-scrollbar-spacer" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Horizontal scroll wrapper */}
      <div ref={scrollContainerRef} className="data-table-scroll">
        <div className="data-table-scroll-inner">
          {/* Table */}
          <div className="data-table-container">
            <table ref={tableRef} className="data-table">
              <thead style={{ visibility: showStickyHeader ? 'hidden' : 'visible' }}>
                {renderHeaderRow()}
              </thead>
              <tbody onClick={handleBadgeClick}>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length} className="data-table-empty">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item) => (
                    <tr key={item.id}>
                      {visibleColumns.map((col) => {
                        const value = getValue(item, col.key);
                        return (
                          <td key={col.key} className={col.className} data-col={col.key}>
                            {col.render ? (
                              col.render(value, item)
                            ) : col.key === 'name' ? (
                              <Link
                                to={`${categoryPath}/${item.id}`}
                                className="data-table-entry-link"
                              >
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
          {/* Spacer for pixel scrollbar - creates scrollable space on right */}
          <div className="data-table-scrollbar-spacer" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

function CellValue({ value }: { value: unknown }) {
  if (value == null) {
    return <span className="data-table-null">-</span>;
  }

  if (typeof value === 'boolean') {
    return value ? (
      <span className="badge badge--success">Yes</span>
    ) : (
      <span className="badge badge--secondary">No</span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <div className="data-table-array">
        {value.map((v, i) => {
          const strVal = String(v);
          const badge = getBadgeForValue(strVal);
          if (badge) {
            return <Badge key={i} badge={badge} />;
          }
          return <TextPill key={i} text={strVal} />;
        })}
      </div>
    );
  }

  // Single string value - check for badge
  if (typeof value === 'string') {
    if (value.startsWith('http')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="data-table-external-link"
        >
          Link
        </a>
      );
    }
    const badge = getBadgeForValue(value);
    if (badge) {
      return <Badge badge={badge} />;
    }
  }

  return <span>{String(value)}</span>;
}
