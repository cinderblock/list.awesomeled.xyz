/**
 * Helpers for one-shot database migrations (see scripts/migrations/README.md).
 *
 * Migrations edit entries through the `yaml` Document API so comments survive,
 * then splice the result back into the original text: every top-level block
 * whose content is unchanged keeps its original bytes (line folding, quoting,
 * blank lines), so a migration's diff shows only what it actually changed.
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { isMap, isScalar, isSeq, parseDocument, type Document, type Node } from 'yaml';

export const DB_DIR = 'database';

/** The 12 category folders. */
export const CATEGORIES = [
  'adapters',
  'commercial-systems',
  'connectors',
  'controllers',
  'diffusive-materials',
  'drive-libraries',
  'level-converters',
  'microboards',
  'pattern-drivers',
  'pixel-decoders',
  'pixel-ics',
  'pixels',
] as const;

export interface EntryContext {
  /** Category folder, e.g. "pixel-ics" */
  category: string;
  /** Entry slug (filename without .yaml) */
  id: string;
  /** Path relative to the repo root */
  path: string;
}

/** Entry files (not `_example.yaml`) in a category, sorted. */
export function entryFiles(category: string): string[] {
  return readdirSync(join(DB_DIR, category))
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .sort();
}

const TOP_LEVEL_KEY = /^(?:'[^']*'|"[^"]*"|[^\s#'"-][^:]*):(?:\s|$)/;

/** Split YAML text into its prelude and one block per top-level key. */
function splitBlocks(text: string): { prelude: string[]; blocks: Map<string, string[]> } {
  const prelude: string[] = [];
  const blocks = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const line of text.split('\n')) {
    if (TOP_LEVEL_KEY.test(line)) {
      const key = line.slice(0, line.indexOf(':')).replace(/^['"]|['"]$/g, '');
      current = [];
      blocks.set(key, current);
    }
    (current ?? prelude).push(line);
  }
  return { prelude, blocks };
}

const normalize = (lines: string[]) => lines.join(' ').replace(/\s+/g, ' ').trim();

/**
 * Render `doc`, reusing the original text of every top-level block whose
 * content (whitespace-normalized) is unchanged.
 */
export function renderPreserving(original: string, doc: Document): string {
  const rendered = doc.toString({ lineWidth: 0, singleQuote: true });
  const before = splitBlocks(original);
  const after = splitBlocks(rendered);
  const out: string[] = [...before.prelude];
  for (const [key, lines] of after.blocks) {
    const old = before.blocks.get(key);
    out.push(...(old && normalize(old) === normalize(lines) ? old : lines));
  }
  // Keep exactly one trailing newline
  return out.join('\n').replace(/\n*$/, '\n');
}

/**
 * Run `fn` over every entry of a category. `fn` mutates the Document and
 * returns true when it changed something; changed files are written back with
 * their original line endings. Returns the changed entry ids.
 */
export function migrateCategory(
  category: string,
  fn: (doc: Document, ctx: EntryContext) => boolean | void
): string[] {
  const changed: string[] = [];
  for (const file of entryFiles(category)) {
    const path = join(DB_DIR, category, file);
    const raw = readFileSync(path, 'utf-8');
    const crlf = raw.includes('\r\n');
    const text = raw.replace(/\r\n/g, '\n');
    const doc = parseDocument(text);
    if (doc.errors.length > 0) throw new Error(`${path}: ${doc.errors[0].message}`);
    const id = file.replace(/\.yaml$/, '');
    if (fn(doc, { category, id, path }) !== true) continue;
    const next = renderPreserving(text, doc);
    if (next === text) continue;
    writeFileSync(path, crlf ? next.replace(/\n/g, '\r\n') : next);
    changed.push(id);
  }
  return changed;
}

/** Plain JS value of a node path, or undefined. */
export function getJS(doc: Document, path: (string | number)[]): unknown {
  const node = doc.getIn(path, true) as Node | undefined;
  if (node === undefined) return undefined;
  if (isScalar(node)) return node.value;
  if (isMap(node) || isSeq(node)) return node.toJSON();
  return node;
}

/** True when the path exists in the document. */
export function has(doc: Document, path: (string | number)[]): boolean {
  return doc.hasIn(path);
}

/**
 * Set `path` to a plain value, rendering arrays as block sequences. Existing
 * comments on a replaced node are carried over to the new node.
 */
export function setJS(doc: Document, path: (string | number)[], value: unknown): void {
  const old = doc.getIn(path, true) as Node | undefined;
  const node = doc.createNode(value) as Node;
  if (old && 'comment' in old && old.comment)
    (node as { comment?: string | null }).comment = old.comment;
  if (old && 'commentBefore' in old && old.commentBefore) {
    (node as { commentBefore?: string | null }).commentBefore = old.commentBefore;
  }
  doc.setIn(path, node);
}

/** Delete `path`; also removes parent maps left empty. Returns true if deleted. */
export function remove(doc: Document, path: (string | number)[]): boolean {
  if (!doc.hasIn(path)) return false;
  doc.deleteIn(path);
  for (let i = path.length - 1; i > 0; i--) {
    const parent = doc.getIn(path.slice(0, i), true);
    if (isMap(parent) && parent.items.length === 0) doc.deleteIn(path.slice(0, i));
    else break;
  }
  return true;
}

/** Rename a key in place (same position in its parent map). */
export function renameKey(
  doc: Document,
  parentPath: (string | number)[],
  from: string,
  to: string
): boolean {
  const parent = parentPath.length ? doc.getIn(parentPath, true) : doc.contents;
  if (!isMap(parent)) return false;
  const pair = parent.items.find((p) => isScalar(p.key) && p.key.value === from);
  if (!pair || !isScalar(pair.key)) return false;
  pair.key.value = to;
  return true;
}
