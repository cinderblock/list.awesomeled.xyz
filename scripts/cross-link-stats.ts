#!/usr/bin/env bun
/**
 * Cross-link coverage report: how connected the database is, per category and
 * per link field, plus the names that don't resolve to any entry yet (each one
 * is either a spelling to normalize, an alias to add, or a missing entry).
 *
 * Uses the same graph the site renders (app/lib/relations.ts), so the numbers
 * describe exactly what the pages show.
 *
 *   bun run scripts/cross-link-stats.ts            # markdown report
 *   bun run scripts/cross-link-stats.ts --json     # machine-readable totals
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import type { BaseEntry } from '../app/lib/types';
import {
  buildRelationGraph,
  NAME_FIELDS,
  EDGE_KINDS,
  INDEX_CATEGORIES,
  normalizeName,
  type EdgeKind,
} from '../app/lib/relations';

const DB_DIR = 'database';

function loadDatabase(): Map<string, BaseEntry[]> {
  const db = new Map<string, BaseEntry[]>();
  for (const category of readdirSync(DB_DIR).sort()) {
    const dir = join(DB_DIR, category);
    if (category.startsWith('_') || !existsSync(join(dir, '.'))) continue;
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.endsWith('.yaml') && !f.startsWith('_'));
    } catch {
      continue;
    }
    if (files.length === 0) continue;
    db.set(
      category,
      files.map((f) => ({
        ...(parse(readFileSync(join(dir, f), 'utf-8')) as BaseEntry),
        id: f.replace(/\.yaml$/, ''),
      }))
    );
  }
  return db;
}

function get(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined),
      obj
    );
}

function pct(n: number, d: number): string {
  return d === 0 ? '–' : `${Math.round((100 * n) / d)}%`;
}

const db = loadDatabase();
const graph = buildRelationGraph(db);

// --- per category connectivity --------------------------------------------
interface CategoryStats {
  entries: number;
  outgoing: number;
  incoming: number;
  linked: number;
}
const perCategory = new Map<string, CategoryStats>();
for (const [category, entries] of db) {
  const s: CategoryStats = { entries: entries.length, outgoing: 0, incoming: 0, linked: 0 };
  for (const e of entries) {
    const ref = `${category}/${e.id}`;
    const out = (graph.outgoing.get(ref)?.length ?? 0) > 0;
    const inc = (graph.incoming.get(ref)?.length ?? 0) > 0;
    const family = graph.familyOf.get(ref);
    const fam = family ? (graph.families.get(normalizeName(family))?.length ?? 0) > 1 : false;
    if (out) s.outgoing++;
    if (inc) s.incoming++;
    if (out || inc || fam) s.linked++;
  }
  perCategory.set(category, s);
}

// --- per name field ---------------------------------------------------------
interface FieldStats {
  field: string;
  filled: number;
  entries: number;
  names: number;
  resolved: number;
}
const perField: FieldStats[] = NAME_FIELDS.map((nf) => {
  const entries = db.get(nf.category) ?? [];
  let filled = 0;
  let names = 0;
  for (const e of entries) {
    const v = get(e, nf.path);
    const list = Array.isArray(v) ? v : typeof v === 'string' ? [v] : [];
    if (list.length) filled++;
    names += list.length;
  }
  const unresolved = graph.unresolved.filter(
    (u) => u.field === nf.path && u.from.startsWith(`${nf.category}/`)
  ).length;
  return {
    field: `${nf.category} \`${nf.path}\``,
    filled,
    entries: entries.length,
    names,
    resolved: names - unresolved,
  };
});

// --- edge kinds ---------------------------------------------------------------
const kindCounts = new Map<EdgeKind, number>();
for (const e of graph.edges) kindCounts.set(e.kind, (kindCounts.get(e.kind) ?? 0) + 1);

// --- protocol families --------------------------------------------------------
let pixelEntries = 0;
for (const c of INDEX_CATEGORIES.pixel) pixelEntries += db.get(c)?.length ?? 0;

// --- unresolved names ------------------------------------------------------
const unresolvedCounts = new Map<string, { n: number; fields: Set<string> }>();
for (const u of graph.unresolved) {
  const cur = unresolvedCounts.get(u.name) ?? { n: 0, fields: new Set<string>() };
  cur.n++;
  cur.fields.add(u.field);
  unresolvedCounts.set(u.name, cur);
}

const totalEntries = [...perCategory.values()].reduce((a, s) => a + s.entries, 0);
const totalLinked = [...perCategory.values()].reduce((a, s) => a + s.linked, 0);

if (process.argv.includes('--json')) {
  console.log(
    JSON.stringify(
      {
        entries: totalEntries,
        linked: totalLinked,
        edges: graph.edges.length,
        kinds: Object.fromEntries(kindCounts),
        categories: Object.fromEntries(perCategory),
        fields: perField,
        families: { members: graph.familyOf.size, of: pixelEntries },
        unresolved: Object.fromEntries([...unresolvedCounts].map(([k, v]) => [k, v.n])),
        dangling: graph.dangling.length,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const lines: string[] = [];
lines.push(
  `**${graph.edges.length} links**; ${totalLinked}/${totalEntries} entries (${pct(totalLinked, totalEntries)}) have at least one link (either direction, or a shared protocol family).`,
  ''
);

lines.push('| Category | Entries | Declares links | Linked to | Any link |');
lines.push('| --- | ---: | ---: | ---: | ---: |');
for (const [category, s] of perCategory) {
  lines.push(
    `| ${category} | ${s.entries} | ${s.outgoing} (${pct(s.outgoing, s.entries)}) | ${s.incoming} (${pct(s.incoming, s.entries)}) | ${s.linked} (${pct(s.linked, s.entries)}) |`
  );
}
lines.push('');

lines.push('| Name-list field | Filled | Names | Resolve to an entry |');
lines.push('| --- | ---: | ---: | ---: |');
for (const f of perField) {
  lines.push(
    `| ${f.field} | ${f.filled}/${f.entries} | ${f.names} | ${f.resolved} (${pct(f.resolved, f.names)}) |`
  );
}
lines.push('');

lines.push('| Link kind | Count |');
lines.push('| --- | ---: |');
for (const kind of Object.keys(EDGE_KINDS) as EdgeKind[]) {
  if (kindCounts.get(kind)) lines.push(`| ${kind} | ${kindCounts.get(kind)} |`);
}
lines.push('');

lines.push(
  `Protocol family (\`data.type\`) recorded on ${graph.familyOf.size}/${pixelEntries} pixels + pixel ICs (${pct(graph.familyOf.size, pixelEntries)}), in ${graph.families.size} families.`,
  ''
);

if (unresolvedCounts.size) {
  const top = [...unresolvedCounts.entries()].sort(
    (a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0])
  );
  lines.push(
    `Unresolved names (${top.length} distinct, ${graph.unresolved.length} uses): ` +
      top.map(([name, v]) => `${name}${v.n > 1 ? ` ×${v.n}` : ''}`).join(', ')
  );
}
if (graph.dangling.length) {
  lines.push('', `**Dangling refs: ${graph.dangling.length}** (run \`bun run validate\`)`);
}

console.log(lines.join('\n'));
