import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronUp, ChevronDown, X, Download, Search } from "lucide-react";
import type { Column } from "~/lib/columns";
import type { BaseEntry } from "~/lib/types";

interface DataTableProps {
  data: BaseEntry[];
  columns: Column[];
  categoryPath: string;
  categoryId: string;
  categoryName: string;
  searchKeys?: string[];
}

type SortDirection = "asc" | "desc";

export function DataTable({
  data,
  columns,
  categoryPath,
  categoryId,
  categoryName,
  searchKeys = ["name"],
}: DataTableProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get("q") || "";
  const sortKey = searchParams.get("sort") || null;
  const sortDir = (searchParams.get("dir") as SortDirection) || null;

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
          if (value === null || value === "") {
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

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const clearAllFilters = useCallback(() => {
    updateParams({ q: null, sort: null, dir: null });
  }, [updateParams]);

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const searchLower = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = (item as Record<string, unknown>)[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, search, searchKeys]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === "asc" ? 1 : -1;
      if (bVal == null) return sortDir === "asc" ? -1 : 1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const cmp = aStr.localeCompare(bStr);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") {
        updateParams({ dir: "desc" });
      } else {
        updateParams({ sort: null, dir: null });
      }
    } else {
      updateParams({ sort: key, dir: "asc" });
    }
  };

  const hasFilters = search || sortKey;

  // CSV export
  const handleDownloadCSV = useCallback(() => {
    const headers = columns
      .filter((col) => col.key !== "links")
      .map((col) => col.label);

    const rows = sortedData.map((item) =>
      columns
        .filter((col) => col.key !== "links")
        .map((col) => {
          const value = getValue(item, col.key);
          if (value == null) return "";
          if (Array.isArray(value)) return value.join("; ");
          return String(value);
        })
    );

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${categoryId}${search ? `-filtered` : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [sortedData, columns, categoryId, search]);

  const getValue = (item: BaseEntry, key: string): unknown => {
    const parts = key.split(".");
    let value: unknown = item;
    for (const part of parts) {
      if (value == null) return null;
      value = (value as Record<string, unknown>)[part];
    }
    return value;
  };

  return (
    <div className="space-y-4">
      {/* Search and controls */}
      <div className="sticky-controls">
        <div className="flex flex-wrap items-center gap-4">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-muted text-sm">
            {sortedData.length} of {data.length} entries
          </span>
          {hasFilters && (
            <button onClick={clearAllFilters} className="btn btn-ghost btn-sm">
              <X size={16} />
              Clear all
            </button>
          )}
          <button onClick={handleDownloadCSV} className="btn btn-outline btn-sm">
            <Download size={16} />
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const colKey = String(col.key);
                const isRightAligned = col.className?.includes("text-right");
                return (
                  <th key={colKey} className={col.className}>
                    <div
                      className={`th-content ${isRightAligned ? "justify-end" : ""}`}
                    >
                      {col.sortable !== false && col.key !== "links" ? (
                        <button
                          className="sort-btn"
                          onClick={() => handleSort(colKey)}
                        >
                          {col.label}
                          {sortKey === colKey && sortDir === "asc" && (
                            <ChevronUp size={16} />
                          )}
                          {sortKey === colKey && sortDir === "desc" && (
                            <ChevronDown size={16} />
                          )}
                        </button>
                      ) : (
                        <span>{col.label}</span>
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
                        ) : col.key === "name" ? (
                          <Link
                            to={`${categoryPath}/${item.id}`}
                            className="entry-link"
                          >
                            {String(value ?? "")}
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

  if (typeof value === "boolean") {
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

  if (typeof value === "string" && value.startsWith("http")) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="external-link"
      >
        Link
      </a>
    );
  }

  return <span>{String(value)}</span>;
}
