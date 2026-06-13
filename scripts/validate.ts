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
        if (validate(data)) {
          valid++;
          folderValid++;
        } else {
          errored++;
          console.log(`  ✗ ${folder}/${file}`);
          for (const err of validate.errors ?? []) {
            console.log(`      ${err.instancePath || '/'}: ${err.message}`);
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
