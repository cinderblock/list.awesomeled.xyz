import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ArrowDown, ArrowDownUp, ArrowUp, Rows3, Rows4, Scale, Search, X } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Badge, getBadgeForValue, TextPill } from '~/components/ui/FeatureBadges';
import { getPath, type FieldMeta } from '~/lib/fields';
import { COMPARE_MAX, entryRef, toggleCompare, useCompareItems } from '~/lib/compare';
import { firstImageFile, imageUrl } from '~/lib/images';
import { DENSITY_PREF, getPref, setPref, usePref } from '~/lib/prefs';
import {
  applyFilters,
  buildSearchText,
  matchesSearch,
  searchScore,
  searchTerms,
  sortRows,
} from '~/lib/table-model';
import {
  COLUMNS_STORAGE_KEY,
  cycleSort,
  FILTER_STORAGE_KEY,
  isBooleanFilter,
  isFilterActive,
  isSelectFilter,
  LEGACY_HIDDEN_COLUMNS_STORAGE_KEY,
  parseCols,
  parseFilters,
  parseSort,
  resolveVisibleColumns,
  serializeCols,
  serializeFilters,
  serializeSort,
  type FilterValue,
  type SortDirection,
  type SortLayer,
} from '~/lib/table-state';
import { toast } from '~/lib/toast';
import type { BaseEntry } from '~/lib/types';
import { formatQuantity, parseNumberWithUnit } from '~/lib/units';
import { ColumnHeader } from './ColumnHeader';
import { ColumnPicker } from './ColumnPicker';
import { ExportMenu } from './ExportMenu';
import { describeFilter, FilterDrawer } from './FilterDrawer';
import { buildTableColumns, defaultColumnKeys, type TableColumn } from './table-columns';
import { FIXED_HEADER_HEIGHT, useStickyHeader } from './useStickyHeader';
import { useTableParams } from './useTableParams';

// Re-exported for existing imports; these live in lib/table-state now
export { FILTER_STORAGE_KEY, getFilterDescription, parseFilters } from '~/lib/table-state';

interface DataTableProps {
  data: BaseEntry[];
  /** The category's field catalog (see lib/fields) */
  fields: FieldMeta[];
  category: { id: string; name: string; path: string };
}

export type Density = 'comfortable' | 'compact';

const INACTIVE_STATUSES = ['discontinued', 'end-of-life'];

// Table state kept per category in localStorage (same clean format as the URL)
interface StoredFilters {
  q?: string;
  sort?: string;
  dir?: string;
  f?: string;
}

function saveFiltersToStorage(categoryId: string, searchParams: URLSearchParams) {
  try {
    const stored: StoredFilters = {};
    for (const key of ['q', 'sort', 'dir', 'f'] as const) {
      const value = searchParams.get(key);
      if (value) stored[key] = value;
    }
    if (Object.keys(stored).length > 0) {
      localStorage.setItem(FILTER_STORAGE_KEY + categoryId, JSON.stringify(stored));
    } else {
      localStorage.removeItem(FILTER_STORAGE_KEY + categoryId);
    }
  } catch {
    // localStorage may not be available
  }
}

function loadFiltersFromStorage(categoryId: string): StoredFilters | null {
  try {
    const stored = localStorage.getItem(FILTER_STORAGE_KEY + categoryId);
    if (stored) return JSON.parse(stored) as StoredFilters;
  } catch {
    // localStorage may not be available or data may be corrupted
  }
  return null;
}

// Saved column layout, migrating the old "hidden columns" list on first read
function loadSavedColumns(categoryId: string, defaults: string[]): string[] | null {
  const saved = getPref<string[]>(COLUMNS_STORAGE_KEY + categoryId);
  if (Array.isArray(saved)) return saved;
  const legacy = getPref<string[]>(LEGACY_HIDDEN_COLUMNS_STORAGE_KEY + categoryId);
  if (Array.isArray(legacy) && legacy.length > 0) {
    const migrated = defaults.filter((key) => !legacy.includes(key));
    setPref(COLUMNS_STORAGE_KEY + categoryId, migrated);
    setPref(LEGACY_HIDDEN_COLUMNS_STORAGE_KEY + categoryId, null);
    return migrated;
  }
  return null;
}

/**
 * The category table: search, sort, filter, pick columns, change density,
 * copy and export. All shareable state lives in the URL (see
 * lib/table-state); per-device preferences live in localStorage.
 *
 * Mount with `key={category.id}` so each category gets fresh state.
 */
export function DataTable({ data, fields, category }: DataTableProps) {
  const categoryId = category.id;
  const categoryPath = category.path;
  // URL state with writes that apply in the same frame (see useTableParams)
  // `urlReady` is false while hydrating: the prerendered table has no query
  // string, so nothing here may act on the URL until it turns true
  const [searchParams, updateParams, urlReady] = useTableParams();
  const navigate = useNavigate();

  // ---- Columns -------------------------------------------------------------
  const columns = useMemo(() => buildTableColumns(categoryId, fields), [categoryId, fields]);
  const columnMap = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const defaultKeys = useMemo(() => defaultColumnKeys(columns), [columns]);
  const isKnown = useCallback((key: string) => columnMap.has(key), [columnMap]);

  const [savedCols, setSavedCols] = usePref<string[]>(COLUMNS_STORAGE_KEY + categoryId);
  const colsParam = searchParams.get('cols');
  const visibleKeys = useMemo(
    () => resolveVisibleColumns(parseCols(colsParam) ?? savedCols, defaultKeys, isKnown),
    [colsParam, savedCols, defaultKeys, isKnown]
  );
  const visibleColumns = useMemo(
    () => visibleKeys.map((key) => columnMap.get(key)!),
    [visibleKeys, columnMap]
  );

  // ---- URL state -----------------------------------------------------------
  const urlSearch = searchParams.get('q') || '';
  const sortParam = searchParams.get('sort');
  const legacyDir = searchParams.get('dir');
  const filterParam = searchParams.get('f');

  const defaultDirFor = useCallback(
    (key: string): SortDirection => columnMap.get(key)?.defaultSortDir ?? 'asc',
    [columnMap]
  );
  const sortLayers = useMemo(
    () => parseSort(sortParam, defaultDirFor, legacyDir),
    [sortParam, defaultDirFor, legacyDir]
  );

  const filters = useMemo(
    () =>
      parseFilters(filterParam, {
        kindOf: (key) => columnMap.get(key)?.filterKind,
        parseNumber: (key, text) => parseNumberWithUnit(text, columnMap.get(key)?.quantity),
      }),
    [filterParam, columnMap]
  );

  // Bare visits resume where this device left off: the last filters / sort /
  // search, and the saved column layout. A URL that already carries state wins.
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (!urlReady || hasRestoredRef.current) return;
    hasRestoredRef.current = true;

    const restore: Record<string, string> = {};
    const hasUrlState = ['q', 'sort', 'dir', 'f'].some((key) => searchParams.has(key));
    if (!hasUrlState) {
      const saved = loadFiltersFromStorage(categoryId);
      for (const key of ['q', 'sort', 'dir', 'f'] as const) {
        if (saved?.[key]) restore[key] = saved[key]!;
      }
    }
    if (!searchParams.has('cols')) {
      const saved = loadSavedColumns(categoryId, defaultKeys);
      const cols = saved
        ? serializeCols(resolveVisibleColumns(saved, defaultKeys, isKnown), defaultKeys)
        : null;
      if (cols) restore.cols = cols;
    }
    if (Object.keys(restore).length > 0) updateParams(restore, true);
  }, [urlReady, categoryId, searchParams, defaultKeys, isKnown, updateParams]);

  // Remember filters / sort / search whenever they change
  useEffect(() => {
    if (urlReady) saveFiltersToStorage(categoryId, searchParams);
  }, [urlReady, categoryId, searchParams]);

  // ---- Column layout -------------------------------------------------------
  const setColumns = useCallback(
    (keys: string[]) => {
      const resolved = resolveVisibleColumns(keys, defaultKeys, isKnown);
      const serialized = serializeCols(resolved, defaultKeys);
      setSavedCols(serialized ? resolved : null);
      updateParams({ cols: serialized }, true);
    },
    [defaultKeys, isKnown, setSavedCols, updateParams]
  );

  const hideColumn = (key: string) => setColumns(visibleKeys.filter((k) => k !== key));
  const moveColumn = (key: string, delta: -1 | 1) => {
    const index = visibleKeys.indexOf(key);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= visibleKeys.length) return;
    const next = [...visibleKeys];
    [next[index], next[target]] = [next[target], next[index]];
    setColumns(next);
  };

  // ---- Search --------------------------------------------------------------
  // Local state for immediate input response; the URL follows after a pause
  const [search, setSearchLocal] = useState(urlSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when the URL changes from outside (back button, links)
  useEffect(() => {
    setSearchLocal(urlSearch);
  }, [urlSearch]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchLocal(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => updateParams({ q: value || null }, true), 150);
    },
    [updateParams]
  );

  // ---- Filters -------------------------------------------------------------
  const writeFilters = useCallback(
    (next: Record<string, FilterValue>) => {
      const serialized = serializeFilters(next, {
        formatNumber: (key, n) => {
          const quantity = columnMap.get(key)?.quantity;
          return quantity ? formatQuantity(n, quantity, true) : String(n);
        },
      });
      updateParams({ f: serialized || null });
    },
    [columnMap, updateParams]
  );

  const setColumnFilter = useCallback(
    (key: string, value: FilterValue | undefined) => {
      const next = { ...filters };
      if (value && isFilterActive(value)) next[key] = value;
      else delete next[key];
      writeFilters(next);
    },
    [filters, writeFilters]
  );

  const clearAllFilters = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearchLocal('');
    // Sorting has its own reset
    updateParams({ f: null, q: null });
  }, [updateParams]);

  // ---- Rows ----------------------------------------------------------------
  const searchTexts = useMemo(
    () => new Map(data.map((item) => [item.id, buildSearchText(item)])),
    [data]
  );
  const terms = useMemo(() => searchTerms(search), [search]);

  const searchRows = useMemo(() => {
    if (terms.length === 0) return data;
    return data.filter((item) => matchesSearch(searchTexts.get(item.id) ?? '', terms));
  }, [data, searchTexts, terms]);

  const filteredRows = useMemo(
    () => applyFilters(searchRows, columnMap, filters),
    [searchRows, columnMap, filters]
  );

  const sortedData = useMemo(() => {
    if (sortLayers.length > 0) return sortRows(filteredRows, sortLayers, columnMap);
    // No sort chosen: a search puts the best matches first
    if (terms.length > 0) {
      return filteredRows
        .map((row) => ({ row, score: searchScore(row, terms) }))
        .sort((a, b) => b.score - a.score)
        .map((scored) => scored.row);
    }
    return filteredRows;
  }, [filteredRows, sortLayers, columnMap, terms]);

  // What a facet counts: rows passing the search and every other filter
  const facetRows = useCallback(
    (exceptKey: string) => applyFilters(searchRows, columnMap, filters, exceptKey),
    [searchRows, columnMap, filters]
  );

  // ---- Sort ----------------------------------------------------------------
  const writeSort = useCallback(
    (layers: SortLayer[]) => {
      updateParams({ sort: serializeSort(layers, defaultDirFor), dir: null });
    },
    [updateParams, defaultDirFor]
  );

  // Explicit direction from a column menu. Non-additive replaces all layers;
  // additive appends / updates it as a tie-break level. dir=null removes.
  const setSort = (key: string, dir: SortDirection | null, additive = false) => {
    let next = sortLayers.filter((l) => l.key !== key);
    if (dir) {
      if (!additive) next = [{ key, dir }];
      else if (sortLayers.some((l) => l.key === key)) {
        next = sortLayers.map((l) => (l.key === key ? { key, dir } : l));
      } else next = [...next, { key, dir }];
    }
    writeSort(next);
  };

  // ---- Density -------------------------------------------------------------
  const [densityPref, setDensityPref] = usePref<Density>(DENSITY_PREF);
  const density: Density = densityPref === 'compact' ? 'compact' : 'comfortable';
  useEffect(() => {
    // Also set before first paint by the inline script in root.tsx
    document.documentElement.dataset.density = density;
  }, [density]);

  // ---- Picking rows to compare ---------------------------------------------
  const compareItems = useCompareItems();
  const pickedIds = useMemo(() => {
    const prefix = `${categoryId}/`;
    return new Set(
      compareItems
        .filter((item) => item.ref.startsWith(prefix))
        .map((item) => item.ref.slice(prefix.length))
    );
  }, [compareItems, categoryId]);

  const togglePick = useCallback(
    (item: BaseEntry) => {
      const added = toggleCompare({ ref: entryRef(categoryId, String(item.id)), name: item.name });
      if (!added) {
        toast(`A comparison holds ${COMPARE_MAX} entries. Remove one to add another.`, 'error');
      }
    },
    [categoryId]
  );

  // ---- Keyboard navigation -------------------------------------------------
  // "/" focuses search, j/k walk the (filtered, sorted) rows, Enter opens the
  // active row, Esc clears.
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeRow, setActiveRow] = useState(-1);
  const clampedActive = Math.min(activeRow, sortedData.length - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const typing =
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        t.isContentEditable;
      if (typing) {
        if (e.key === 'Escape') t.blur();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Leave keys alone while a dialog or menu is open
      if (document.querySelector('[role="dialog"], [role="menu"]')) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        const delta = e.key === 'j' ? 1 : -1;
        const base = clampedActive < 0 ? (delta > 0 ? -1 : 0) : clampedActive;
        const next = Math.max(0, Math.min(sortedData.length - 1, base + delta));
        setActiveRow(next);
        document
          .querySelector(`tr[data-row-id="${CSS.escape(String(sortedData[next].id))}"]`)
          ?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && clampedActive >= 0 && sortedData[clampedActive]) {
        if (t instanceof HTMLButtonElement || t instanceof HTMLAnchorElement) return;
        navigate(`${categoryPath}/${sortedData[clampedActive].id}`);
      } else if (e.key === 'x' && clampedActive >= 0 && sortedData[clampedActive]) {
        togglePick(sortedData[clampedActive]);
      } else if (e.key === 'Escape') {
        setActiveRow(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sortedData, clampedActive, categoryPath, navigate, togglePick]);

  // Hand the currently visible order to entry pages, so j/k there walks the
  // same filtered + sorted list the user was just looking at.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        `entry-order:${categoryId}`,
        JSON.stringify(sortedData.map((d) => d.id))
      );
    } catch {
      // best effort only
    }
  }, [sortedData, categoryId]);

  // ---- Hover image preview -------------------------------------------------
  // Neighbors' images are preloaded so scanning up and down a column of rows
  // feels instant (files are statically served and cached hard).
  const indexById = useMemo(
    () => new Map(sortedData.map((item, index) => [String(item.id), index])),
    [sortedData]
  );
  const [preview, setPreview] = useState<{ id: string; top: number } | null>(null);
  const previewIndex = preview ? (indexById.get(preview.id) ?? -1) : -1;
  const previewEntry = previewIndex >= 0 ? sortedData[previewIndex] : null;
  const previewFile = previewEntry ? firstImageFile(previewEntry) : null;
  // Thumbnails in the name column, only for categories that have images at all
  // (keeps names aligned without a blank gutter on software tables).
  const showThumbs = useMemo(() => data.some((d) => firstImageFile(d)), [data]);

  useEffect(() => {
    if (previewIndex < 0) return;
    for (let d = -2; d <= 2; d++) {
      const neighbor = sortedData[previewIndex + d];
      const file = neighbor && firstImageFile(neighbor);
      if (file) new Image().src = imageUrl(categoryId, file, 'md');
    }
  }, [previewIndex, sortedData, categoryId]);

  // Stable handlers so memoized rows don't re-render on unrelated updates
  const handleRowEnter = useCallback((id: string, top: number) => setPreview({ id, top }), []);
  const handleRowLeave = useCallback(
    (id: string) => setPreview((p) => (p?.id === id ? null : p)),
    []
  );

  // ---- Click a pill to filter by it ----------------------------------------
  const handleCellClick = useCallback(
    (e: React.MouseEvent<HTMLTableSectionElement>) => {
      const pill = (e.target as HTMLElement).closest<HTMLElement>('[data-pill], .badge');
      if (!pill) return;
      const td = pill.closest<HTMLElement>('td[data-col]');
      const tr = td?.closest<HTMLElement>('tr[data-row-id]');
      const col = td?.dataset.col ? columnMap.get(td.dataset.col) : undefined;
      const rowIndex = tr?.dataset.rowId != null ? indexById.get(tr.dataset.rowId) : undefined;
      const item = rowIndex != null ? sortedData[rowIndex] : undefined;
      const text = pill.textContent?.trim();
      if (!col || !item || !text) return;

      const current = filters[col.key];
      if (col.filterKind === 'boolean') {
        const clicked = text.toLowerCase() === 'yes';
        const same = current && isBooleanFilter(current) && current.value === clicked;
        setColumnFilter(col.key, same ? undefined : { value: clicked });
        return;
      }
      if (col.filterKind !== 'select') return;

      // The pill shows a label ("sACN"); the filter needs the stored value
      // ("E1.31"). Find which of this row's values the pill stands for.
      const candidates = col.values(item);
      const lower = text.toLowerCase();
      const value =
        candidates.find((v) => v === text) ??
        candidates.find((v) => getBadgeForValue(v)?.label === text) ??
        candidates.find((v) => v.toLowerCase() === lower);
      if (!value) return;

      const select = current && isSelectFilter(current) ? current : undefined;
      const selected = select?.selected ?? [];
      const has = selected.some((s) => s.toLowerCase() === value.toLowerCase());
      const next = has
        ? selected.filter((s) => s.toLowerCase() !== value.toLowerCase())
        : [...selected, value];
      setColumnFilter(
        col.key,
        next.length === 0 ? undefined : { selected: next, exclude: select?.exclude ?? false }
      );
    },
    [columnMap, sortedData, indexById, filters, setColumnFilter]
  );

  // ---- Derived UI state ----------------------------------------------------
  const activeFilters = useMemo(
    () =>
      Object.entries(filters)
        .filter(([, value]) => isFilterActive(value))
        .map(([key, value]) => {
          const col = columnMap.get(key);
          return {
            key,
            label: col?.label ?? key,
            description: col ? describeFilter(col, value) : '',
          };
        }),
    [filters, columnMap]
  );
  const hasFilters = search !== '' || activeFilters.length > 0;

  // Quick toggle: hide discontinued / end-of-life entries (only offered when
  // the category records a status)
  const statusColumn = columnMap.get('status');
  const statusFilter = filters['status'];
  const hidingInactive =
    !!statusFilter &&
    isSelectFilter(statusFilter) &&
    statusFilter.exclude &&
    INACTIVE_STATUSES.every((s) => statusFilter.selected.includes(s));
  const toggleHideInactive = () => {
    setColumnFilter(
      'status',
      hidingInactive ? undefined : { selected: INACTIVE_STATUSES, exclude: true }
    );
  };

  const sortableColumns = visibleColumns.filter((c) => c.sortable !== false && c.key !== 'links');

  // ---- Sticky header -------------------------------------------------------
  const {
    scrollContainerRef,
    tableRef,
    controlsRef,
    stickyHeaderScrollRef,
    showStickyHeader,
    columnWidths,
    controlsHeight,
    headerHeight,
  } = useStickyHeader(sortedData, visibleKeys, density);

  // Shared between the real header and its sticky clone
  const renderHeaderRow = () => (
    <tr>
      <th scope="col" className="data-table-select" data-col="__select">
        <Scale size={14} aria-hidden="true" />
        <span className="sr-only">Compare</span>
      </th>
      {visibleColumns.map((col, index) => {
        const layerIndex = sortLayers.findIndex((l) => l.key === col.key);
        const layer = layerIndex >= 0 ? sortLayers[layerIndex] : null;
        const isRightAligned = col.className?.includes('data-table-cell--right');
        return (
          <th
            key={col.key}
            scope="col"
            className={col.className}
            data-col={col.key}
            aria-sort={layer ? (layer.dir === 'asc' ? 'ascending' : 'descending') : undefined}
          >
            <div
              className={`data-table-th-content${isRightAligned ? ' data-table-th-content--right' : ''}`}
            >
              <ColumnHeader
                column={col}
                sortState={
                  layer ? { dir: layer.dir, index: layerIndex + 1, count: sortLayers.length } : null
                }
                hasOtherSort={sortLayers.some((l) => l.key !== col.key)}
                onCycleSort={(additive) =>
                  writeSort(cycleSort(sortLayers, col.key, defaultDirFor(col.key), additive))
                }
                onSortChange={(dir, additive) => setSort(col.key, dir, additive)}
                filterValue={filters[col.key]}
                onFilterChange={(value) => setColumnFilter(col.key, value)}
                allRows={data}
                facetRows={() => facetRows(col.key)}
                onHide={col.key !== 'name' ? () => hideColumn(col.key) : undefined}
                onMove={(delta) => moveColumn(col.key, delta)}
                canMoveLeft={index > 0}
                canMoveRight={index < visibleColumns.length - 1}
              />
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
            <Search size={16} className="data-table-search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder={`Search ${category.name.toLowerCase()}…`}
              aria-label={`Search ${category.name}`}
              aria-keyshortcuts="/"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="data-table-search-input"
            />
            <kbd className="data-table-search-kbd" aria-hidden="true">
              /
            </kbd>
          </div>
          <span className="data-table-count" aria-live="polite">
            {sortedData.length === data.length
              ? `${data.length} entries`
              : `${sortedData.length} of ${data.length} entries`}
          </span>

          <div className="data-table-tools">
            <FilterDrawer
              columns={columns}
              visibleKeys={visibleKeys}
              filters={filters}
              allRows={data}
              facetRows={facetRows}
              matchCount={sortedData.length}
              onFilterChange={setColumnFilter}
              onClearAll={clearAllFilters}
            />
            <SortMenu
              columns={sortableColumns}
              layers={sortLayers}
              onPick={(key) => writeSort(cycleSort(sortLayers, key, defaultDirFor(key)))}
              onReset={() => writeSort([])}
            />
            <ColumnPicker
              columns={columns}
              visibleKeys={visibleKeys}
              defaultKeys={defaultKeys}
              total={data.length}
              onChange={setColumns}
            />
            <button
              type="button"
              className="btn btn--ghost btn--sm data-table-density"
              aria-pressed={density === 'compact'}
              aria-label={
                density === 'compact'
                  ? 'Dense rows are on. Switch to roomy rows'
                  : 'Switch to dense rows'
              }
              onClick={() => setDensityPref(density === 'compact' ? 'comfortable' : 'compact')}
            >
              {density === 'compact' ? <Rows4 size={16} /> : <Rows3 size={16} />}
              <span className="btn-label">{density === 'compact' ? 'Dense' : 'Roomy'}</span>
            </button>
            {statusColumn && (
              <button
                type="button"
                onClick={toggleHideInactive}
                aria-pressed={hidingInactive}
                className={`btn btn--ghost btn--sm${hidingInactive ? ' btn--badge' : ''}`}
              >
                {hidingInactive ? 'Discontinued hidden' : 'Hide discontinued'}
              </button>
            )}
          </div>

          <div className="data-table-tools data-table-tools--end">
            <ExportMenu
              category={category}
              rows={sortedData}
              total={data.length}
              visibleColumns={visibleColumns}
              allColumns={columns}
              state={{
                q: search || undefined,
                sort: sortParam,
                filters: activeFilters.map((f) => `${f.label}-${f.description}`),
              }}
            />
          </div>
        </div>

        {/* What is narrowing or ordering the list right now */}
        {(hasFilters || sortLayers.length > 0) && (
          <div className="data-table-active-filters">
            {activeFilters.map(({ key, label, description }) => (
              <span key={key} className="data-table-filter-tag">
                <strong>{label}:</strong> {description}
                <button
                  type="button"
                  aria-label={`Remove the ${label} filter`}
                  onClick={() => setColumnFilter(key, undefined)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {sortLayers.map((layer, i) => {
              const col = columnMap.get(layer.key);
              if (!col) return null;
              return (
                <span key={layer.key} className="data-table-filter-tag data-table-filter-tag--sort">
                  {i === 0 ? 'Sorted by' : 'then'} <strong>{col.label}</strong>
                  {layer.dir === 'asc' ? (
                    <ArrowUp size={12} aria-label="ascending" />
                  ) : (
                    <ArrowDown size={12} aria-label="descending" />
                  )}
                  <button
                    type="button"
                    aria-label={`Stop sorting by ${col.label}`}
                    onClick={() => setSort(layer.key, null)}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            {hasFilters && (
              <button type="button" onClick={clearAllFilters} className="btn btn--ghost btn--sm">
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Background mask to hide table rows scrolling behind sticky header and controls */}
      <div
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
          <div className="data-table-container">
            <table ref={tableRef} className="data-table">
              <caption className="sr-only">
                {category.name}: {sortedData.length} of {data.length} entries
              </caption>
              <thead style={{ visibility: showStickyHeader ? 'hidden' : 'visible' }}>
                {renderHeaderRow()}
              </thead>
              <tbody onClick={handleCellClick}>
                {sortedData.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumns.length + 1} className="data-table-empty">
                      <p>No {category.name.toLowerCase()} match.</p>
                      {hasFilters && (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="btn btn--outline btn--sm"
                        >
                          <X size={14} />
                          Clear search and filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  sortedData.map((item, rowIndex) => (
                    <TableRow
                      key={item.id}
                      item={item}
                      columns={visibleColumns}
                      categoryPath={categoryPath}
                      thumbCategory={showThumbs ? categoryId : undefined}
                      active={rowIndex === clampedActive}
                      picked={pickedIds.has(String(item.id))}
                      onTogglePick={togglePick}
                      onEnter={handleRowEnter}
                      onLeave={handleRowLeave}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Spacer for pixel scrollbar - creates scrollable space on right */}
          <div className="data-table-scrollbar-spacer" aria-hidden="true" />
        </div>
      </div>

      {/* Floating image preview for the hovered row */}
      {preview && previewFile && previewEntry && (
        <div
          className="data-table-img-preview"
          style={{
            top: Math.max(70, Math.min(preview.top - 40, window.innerHeight - 280)),
          }}
          aria-hidden="true"
        >
          <img
            src={imageUrl(categoryId, previewFile, 'md')}
            alt=""
            loading="lazy"
            decoding="async"
          />
          <span>{String(previewEntry.name)}</span>
        </div>
      )}
    </div>
  );
}

// Memoized: sorting only moves rows, and filtering only adds or removes
// them, so the rows that stay keep their rendered cells.
const TableRow = memo(function TableRow({
  item,
  columns,
  categoryPath,
  thumbCategory,
  active,
  picked,
  onTogglePick,
  onEnter,
  onLeave,
}: {
  item: BaseEntry;
  columns: TableColumn[];
  categoryPath: string;
  /** Category id when names carry a product thumbnail */
  thumbCategory?: string;
  active: boolean;
  /** Picked for comparison */
  picked: boolean;
  onTogglePick: (item: BaseEntry) => void;
  onEnter: (id: string, top: number) => void;
  onLeave: (id: string) => void;
}) {
  const id = String(item.id);
  const classes = [active && 'data-table-row--active', picked && 'data-table-row--picked']
    .filter(Boolean)
    .join(' ');
  return (
    <tr
      data-row-id={id}
      className={classes || undefined}
      onMouseEnter={(e) => onEnter(id, e.currentTarget.getBoundingClientRect().top)}
      onMouseLeave={() => onLeave(id)}
    >
      <td className="data-table-select" data-col="__select">
        <input
          type="checkbox"
          checked={picked}
          aria-label={`Compare ${item.name}`}
          onChange={() => onTogglePick(item)}
        />
      </td>
      {columns.map((col) => (
        <TableCell
          key={col.key}
          column={col}
          item={item}
          categoryPath={categoryPath}
          thumbCategory={thumbCategory}
        />
      ))}
    </tr>
  );
});

function TableCell({
  column,
  item,
  categoryPath,
  thumbCategory,
}: {
  column: TableColumn;
  item: BaseEntry;
  categoryPath: string;
  thumbCategory?: string;
}) {
  const value = getPath(item, column.key);
  const isName = column.key === 'name';
  // In the card layout empty cells are dropped; the links cell always stays
  const empty = column.key !== 'links' && !isName && !column.hasValue(item);
  const clickable = column.filterKind === 'select' || column.filterKind === 'boolean';
  return (
    <td
      className={column.className}
      data-col={column.key}
      data-label={column.label || undefined}
      data-empty={empty ? '' : undefined}
      data-filterable={clickable ? '' : undefined}
    >
      {column.render ? (
        column.render(value, item)
      ) : isName ? (
        <Link to={`${categoryPath}/${item.id}`} className="data-table-entry-link">
          {thumbCategory && <NameThumb category={thumbCategory} entry={item} />}
          {String(value ?? '')}
        </Link>
      ) : (
        <CellValue value={value} />
      )}
    </td>
  );
}

// Small product thumbnail before the entry name (blank placeholder keeps names aligned)
function NameThumb({ category, entry }: { category: string; entry: BaseEntry }) {
  const file = firstImageFile(entry);
  return (
    <span className="data-table-thumb" aria-hidden="true">
      {file && (
        <img
          src={imageUrl(category, file, 'sm')}
          alt=""
          loading="lazy"
          decoding="async"
          width={40}
          height={30}
        />
      )}
    </span>
  );
}

// Sorting for layouts without column headers (the card list on phones)
function SortMenu({
  columns,
  layers,
  onPick,
  onReset,
}: {
  columns: TableColumn[];
  layers: SortLayer[];
  onPick: (key: string) => void;
  onReset: () => void;
}) {
  const primary = layers[0];
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={`btn btn--ghost btn--sm data-table-sort-menu${primary ? ' btn--badge' : ''}`}
          aria-label="Sort"
        >
          <ArrowDownUp size={16} />
          <span className="btn-label">Sort</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu" sideOffset={5} align="start" collisionPadding={8}>
          <DropdownMenu.Label className="menu-label">Sort by</DropdownMenu.Label>
          {columns.map((col) => {
            const layer = layers.find((l) => l.key === col.key);
            return (
              <DropdownMenu.Item
                key={col.key}
                className="menu-item"
                // Keep the menu open so a second tap flips the direction
                onSelect={(e) => {
                  e.preventDefault();
                  onPick(col.key);
                }}
              >
                <span className="menu-item-check" aria-hidden="true">
                  {layer?.dir === 'asc' && <ArrowUp size={14} />}
                  {layer?.dir === 'desc' && <ArrowDown size={14} />}
                </span>
                {col.label}
              </DropdownMenu.Item>
            );
          })}
          {primary && (
            <>
              <DropdownMenu.Separator className="menu-separator" />
              <DropdownMenu.Item className="menu-item" onSelect={onReset}>
                <span className="menu-item-check" aria-hidden="true">
                  <X size={14} />
                </span>
                Default order
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
