// cspell:ignore acks
/**
 * Acknowledged differences: sheet values the audit looked at and decided not
 * to migrate (vandalism, values the YAML corrected by research, rows that
 * moved or were deliberately dropped). Stored in acks.yaml next to this file.
 *
 * Keys are `<tab> | <row name> | <column>` (a column of `row` covers an
 * unmatched row; `<column> (link)` / `<column> (note)` cover hyperlinks and
 * cell notes), so they survive the sheet being re-sorted. `value` pins the
 * sheet text the reason applies to: if someone edits that cell, the
 * difference resurfaces in the report.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';

export interface Ack {
  value?: string;
  reason: string;
}

const file = join(dirname(fileURLToPath(import.meta.url)), 'acks.yaml');
const raw = (parse(readFileSync(file, 'utf-8')) ?? {}) as Record<string, Ack | Ack[]>;

export function ackKey(tab: string, name: string, column: string): string {
  return `${tab} | ${name.trim()} | ${column}`;
}

export function findAck(key: string, value: string): Ack | undefined {
  const a = raw[key];
  if (!a) return undefined;
  const list = Array.isArray(a) ? a : [a];
  return list.find((x) => x.value === undefined || String(x.value).trim() === value.trim());
}

export function allAckKeys(): string[] {
  return Object.keys(raw);
}
