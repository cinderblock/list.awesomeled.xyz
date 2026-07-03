#!/usr/bin/env bun
/**
 * Validate all database YAML files against their JSON schemas.
 *
 * The schemas in database/_schema are the rich, nested target schema. During
 * the flat -> nested migration this doubles as a progress meter: un-migrated
 * (still-flat) entries fail with `additionalProperties` errors until converted.
 *
 *   bun run validate                 # validate everything
 *   bun run validate controllers     # only one category folder
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import Ajv from 'ajv';

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

/**
 * Cross-reference checks (beyond what JSON Schema can express):
 *  - `related[].ref` items ("<category>/<slug>") must point at an existing entry.
 *  - Legacy `related_<category>` arrays (e.g. related_pixel_ics) hold slugs in
 *    the category derived from the field name; each slug must exist there.
 *  - `outputs.connector.ref` (controllers) holds a bare slug into connectors.
 * Returns human-readable problem strings (empty array = ok).
 */
function checkCrossRefs(data: Record<string, unknown>, slugs: Map<string, Set<string>>): string[] {
  const problems: string[] = [];

  const connector = (data.outputs as Record<string, unknown> | undefined)?.connector;
  if (connector && typeof connector === 'object') {
    const ref = (connector as Record<string, unknown>).ref;
    if (typeof ref === 'string' && !slugs.get('connectors')?.has(ref)) {
      problems.push(`outputs.connector.ref "${ref}": no such entry in connectors`);
    }
  }

  if (Array.isArray(data.related)) {
    for (const item of data.related) {
      const ref = item?.ref;
      if (typeof ref !== 'string') continue;
      const [category, slug] = ref.split('/');
      if (!category || !slug || !slugs.has(category)) {
        problems.push(`related ref "${ref}": unknown category`);
      } else if (!slugs.get(category)!.has(slug)) {
        problems.push(`related ref "${ref}": no such entry`);
      }
    }
  }

  for (const [field, value] of Object.entries(data)) {
    if (!field.startsWith('related_') || !Array.isArray(value)) continue;
    const category = field.slice('related_'.length).replace(/_/g, '-');
    if (!slugs.has(category)) continue; // not a category-shaped field
    for (const slug of value) {
      if (typeof slug !== 'string') continue;
      if (!slugs.get(category)!.has(slug)) {
        problems.push(`${field} "${slug}": no such entry in ${category}`);
      }
    }
  }

  return problems;
}

function listEntrySlugs(folder: string): Set<string> {
  return new Set(
    readdirSync(join(DB_DIR, folder))
      .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
      .map((f) => f.replace(/\.yaml$/, ''))
  );
}

async function main() {
  const only = process.argv[2]; // optional category filter
  // strict:false makes AJV ignore `format` keywords (uri/date) as no-ops,
  // which is fine for migration validation and avoids an ajv-formats dep.
  const ajv = new Ajv({ allErrors: true, strict: false });

  // Register shared definitions so cross-schema $refs (common.json#/...) resolve
  ajv.addSchema(JSON.parse(readFileSync(join(SCHEMA_DIR, 'common.json'), 'utf-8')));

  let total = 0;
  let valid = 0;
  let errored = 0;

  const folders = readdirSync(DB_DIR).filter(
    (f) => !f.startsWith('_') && existsSync(join(DB_DIR, f, '.')) && FOLDER_SCHEMAS[f]
  );

  // Slugs across ALL categories (even with a category filter) so cross-category
  // refs can always be resolved.
  const slugs = new Map<string, Set<string>>(folders.map((f) => [f, listEntrySlugs(f)]));

  for (const folder of folders) {
    if (only && folder !== only) continue;
    const schemaPath = join(SCHEMA_DIR, FOLDER_SCHEMAS[folder]!);
    if (!existsSync(schemaPath)) continue;

    const validate = ajv.compile(JSON.parse(readFileSync(schemaPath, 'utf-8')));
    const files = readdirSync(join(DB_DIR, folder)).filter(
      (f) => f.endsWith('.yaml') && !f.startsWith('_')
    );

    let folderValid = 0;
    for (const file of files) {
      total++;
      const path = join(DB_DIR, folder, file);
      try {
        const data = parse(readFileSync(path, 'utf-8'));
        const refProblems = data ? checkCrossRefs(data, slugs) : [];
        if (validate(data) && refProblems.length === 0) {
          valid++;
          folderValid++;
        } else {
          errored++;
          console.log(`  ✗ ${folder}/${file}`);
          for (const err of validate.errors ?? []) {
            console.log(`      ${err.instancePath || '/'}: ${err.message}`);
          }
          for (const problem of refProblems) {
            console.log(`      ${problem}`);
          }
        }
      } catch (e) {
        errored++;
        console.log(`  ✗ ${folder}/${file}: ${e instanceof Error ? e.message : 'parse error'}`);
      }
    }
    console.log(`${folder}: ${folderValid}/${files.length} valid`);
  }

  console.log(`\n${'='.repeat(40)}\nTotal ${total} | valid ${valid} | errors ${errored}`);
  if (errored > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
