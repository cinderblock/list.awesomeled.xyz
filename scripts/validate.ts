#!/usr/bin/env bun
/**
 * Validate all database YAML files against their JSON schemas.
 *
 * Every entry must match its category schema in database/_schema (formats
 * included: `uri` and `date` are enforced via ajv-formats) and every
 * cross-reference must resolve. Each category's `_example.yaml` (multi-document
 * contributor documentation) is validated too, so the examples can't drift
 * from the schema; their refs are illustrative, so cross-refs aren't checked.
 *
 *   bun run validate                 # validate everything
 *   bun run validate controllers     # only one category folder
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parse, parseAllDocuments } from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import type { BaseEntry } from '../app/lib/types';
import { buildRelationGraph, type DanglingRef } from '../app/lib/relations';

const DB_DIR = 'database';
const SCHEMA_DIR = 'database/_schema';

// Folder name -> schema file
const FOLDER_SCHEMAS: Record<string, string> = {
  controllers: 'controller.json',
  pixels: 'pixel.json',
  'pixel-ics': 'pixel-ic.json',
  'pattern-drivers': 'pattern-driver.json',
  connectors: 'connector.json',
  microboards: 'microboard.json',
  'level-converters': 'level-converter.json',
  adapters: 'adapter.json',
  'drive-libraries': 'drive-library.json',
  'pixel-decoders': 'pixel-decoder.json',
  'diffusive-materials': 'diffusive-material.json',
  'commercial-systems': 'commercial-system.json',
};

// Categories whose _example.yaml still shows the pre-migration flat schema.
// Each is rewritten when its category's schema review lands (see
// plans/database-review.md); remove it from this list in the same commit.
const STALE_EXAMPLES = new Set([
  'adapters',
  'commercial-systems',
  'connectors',
  'diffusive-materials',
  'drive-libraries',
  'level-converters',
  'microboards',
  'pattern-drivers',
  'pixel-ics',
  'pixels',
]);

/**
 * `sources` keys (common.json#/definitions/sources) must name a field the
 * entry actually has: catches typos and provenance left behind when a field
 * is removed or renamed.
 */
function checkSources(data: Record<string, unknown>): string[] {
  const sources = data?.sources;
  if (!sources || typeof sources !== 'object') return [];
  const problems: string[] = [];
  for (const path of Object.keys(sources)) {
    const value = path
      .split('.')
      .reduce<unknown>(
        (v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined),
        data
      );
    if (value == null) problems.push(`sources "${path}": the entry has no such field`);
  }
  return problems;
}

/**
 * Parse every entry in every category up front: cross-references are checked
 * against the whole database even when validating a single category.
 * Unparseable files map to their error message instead of an entry.
 */
function loadAll(folders: string[]): Map<string, Map<string, BaseEntry | Error>> {
  const all = new Map<string, Map<string, BaseEntry | Error>>();
  for (const folder of folders) {
    const files = new Map<string, BaseEntry | Error>();
    for (const file of readdirSync(join(DB_DIR, folder))) {
      if (!file.endsWith('.yaml') || file.startsWith('_')) continue;
      try {
        files.set(file, parse(readFileSync(join(DB_DIR, folder, file), 'utf-8')));
      } catch (e) {
        files.set(file, e instanceof Error ? e : new Error('parse error'));
      }
    }
    all.set(folder, files);
  }
  return all;
}

async function main() {
  const only = process.argv[2]; // optional category filter
  // strict:false tolerates non-validation keywords in the schemas; formats
  // (uri, date) are real checks via ajv-formats.
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);

  // Register shared definitions so cross-schema $refs (common.json#/...) resolve
  ajv.addSchema(JSON.parse(readFileSync(join(SCHEMA_DIR, 'common.json'), 'utf-8')));

  let total = 0;
  let valid = 0;
  let errored = 0;

  const folders = readdirSync(DB_DIR).filter(
    (f) => !f.startsWith('_') && existsSync(join(DB_DIR, f, '.')) && FOLDER_SCHEMAS[f]
  );
  const all = loadAll(folders);

  // Cross-reference checks beyond what JSON Schema can express, using the same
  // relationship graph the site renders (app/lib/relations.ts): every
  // `related[].ref`, legacy `related_<category>` slug and
  // `outputs.connector.ref` must point at an existing entry.
  const db = new Map<string, BaseEntry[]>();
  for (const [folder, files] of all) {
    const entries: BaseEntry[] = [];
    for (const [file, data] of files) {
      if (data && !(data instanceof Error) && typeof data === 'object') {
        entries.push({ ...data, id: file.replace(/\.yaml$/, '') });
      }
    }
    db.set(folder, entries);
  }
  const graph = buildRelationGraph(db);
  const danglingByEntry = new Map<string, DanglingRef[]>();
  for (const d of graph.dangling) {
    if (!danglingByEntry.has(d.from)) danglingByEntry.set(d.from, []);
    danglingByEntry.get(d.from)!.push(d);
  }

  for (const folder of folders) {
    if (only && folder !== only) continue;
    const schemaPath = join(SCHEMA_DIR, FOLDER_SCHEMAS[folder]!);
    if (!existsSync(schemaPath)) continue;

    const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf-8')));
    const files = all.get(folder)!;

    let folderValid = 0;
    for (const [file, data] of files) {
      total++;
      if (data instanceof Error) {
        errored++;
        console.log(`  ✗ ${folder}/${file}: ${data.message}`);
        continue;
      }
      const refProblems = [
        ...(danglingByEntry.get(`${folder}/${file.replace(/\.yaml$/, '')}`) ?? []).map(
          (p) => `${p.field} "${p.ref}": ${p.problem}`
        ),
        ...checkSources(data as Record<string, unknown>),
      ];
      if (validate(data) && refProblems.length === 0) {
        valid++;
        folderValid++;
      } else {
        errored++;
        console.log(`  ✗ ${folder}/${file}`);
        for (const err of validate.errors ?? []) {
          console.log(`      ${err.instancePath || '/'}: ${err.message}`);
        }
        for (const p of refProblems) console.log(`      ${p}`);
      }
    }
    console.log(`${folder}: ${folderValid}/${files.size} valid`);

    const examplePath = join(DB_DIR, folder, '_example.yaml');
    if (existsSync(examplePath) && !STALE_EXAMPLES.has(folder)) {
      const docs = parseAllDocuments(readFileSync(examplePath, 'utf-8'));
      const list = Array.isArray(docs) ? docs : [docs];
      list.forEach((doc, i) => {
        total++;
        const label = `${folder}/_example.yaml (document ${i + 1})`;
        if (doc.errors.length > 0) {
          errored++;
          console.log(`  ✗ ${label}: ${doc.errors[0].message}`);
        } else if (validate(doc.toJS())) {
          valid++;
        } else {
          errored++;
          console.log(`  ✗ ${label}`);
          for (const err of validate.errors ?? []) {
            console.log(`      ${err.instancePath || '/'}: ${err.message}`);
          }
        }
      });
    }
  }

  // Names in link lists (outputs.protocols, software.firmware, …) that match no
  // entry. Not an error — vendors list parts this database doesn't have yet —
  // but each one is a spelling to normalize, an `aliases` entry to add, or a
  // missing entry. scripts/cross-link-stats.ts has the full picture.
  const unresolved = graph.unresolved.filter((u) => !only || u.from.startsWith(`${only}/`));
  if (unresolved.length) {
    const byField = new Map<string, Map<string, number>>();
    for (const u of unresolved) {
      if (!byField.has(u.field)) byField.set(u.field, new Map());
      const names = byField.get(u.field)!;
      names.set(u.name, (names.get(u.name) ?? 0) + 1);
    }
    console.log('\nUnresolved link names (warnings; add an alias or entry to link them):');
    for (const [field, names] of byField) {
      const list = [...names]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([n, c]) => (c > 1 ? `${n} ×${c}` : n));
      console.log(`  ${field}: ${list.join(', ')}`);
    }
  }

  console.log(`\n${'='.repeat(40)}\nTotal ${total} | valid ${valid} | errors ${errored}`);
  if (errored > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
