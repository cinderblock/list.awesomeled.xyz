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

/**
 * Generate CSV content from data and column configuration
 */
export function generateCSV(data: BaseEntry[], columns: Column[]): string {
  // Filter out non-data columns (like 'links')
  const dataColumns = columns.filter((col) => col.key !== 'links');

  const headers = dataColumns.map((col) => col.label);

  const rows = data.map((item) =>
    dataColumns.map((col) => {
      const value = getValue(item, col.key);
      if (value == null) return '';
      if (Array.isArray(value)) return value.join('; ');
      return String(value);
    })
  );

  const csv = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csv;
}
