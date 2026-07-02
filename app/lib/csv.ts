/**
 * Shared CSV generation logic used by both frontend export and build-time generation
 */

import type { BaseEntry } from './types';
import type { Column } from './columns';

/**
 * Get a nested value from an object using dot notation
 */
function getValue(obj: BaseEntry, path: string): unknown {
  let value: unknown = obj;
  for (const part of path.split('.')) {
    if (value == null) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

export interface GenerateCSVOptions {
  /** Use user's locale for dates (browser), otherwise ISO UTC (server) */
  useLocale?: boolean;
}

/**
 * Generate CSV content from data and column configuration
 */
export function generateCSV(
  data: BaseEntry[],
  columns: Column[],
  options: GenerateCSVOptions = {}
): string {
  const { useLocale = false } = options;

  // Filter out non-data columns (like 'links')
  const dataColumns = columns.filter((col) => col.key !== 'links');

  const headers = dataColumns.map((col) => col.label);

  const rows = data.map((item) =>
    dataColumns.map((col) => {
      const value = getValue(item, col.key);
      if (value == null) return '';
      if (Array.isArray(value)) return value.join('; ');
      if (value instanceof Date) {
        return useLocale ? value.toLocaleString() : value.toISOString();
      }
      // Object values (e.g. creator { name, url, page }) -> use the name
      if (typeof value === 'object') {
        const name = (value as { name?: unknown }).name;
        return name != null ? String(name) : '';
      }
      return String(value);
    })
  );

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csv;
}
