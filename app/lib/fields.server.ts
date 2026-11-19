/**
 * Loader side of the field catalog: reads the JSON schemas from disk and
 * pairs them with a category's entries. Only route loaders import this (it
 * uses fs), so it never reaches the browser bundle.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { getDatabasePath, loadCategoryData } from './data';
import { buildFieldCatalog, type FieldMeta, type JsonSchema } from './fields';

// Category folder -> schema file (same mapping scripts/validate.ts uses)
const CATEGORY_SCHEMAS: Record<string, string> = {
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

// Catalogs are cached only in production builds (prerendering asks for the
// same category hundreds of times); dev re-reads so schema and YAML edits
// show up on refresh.
const catalogCache = new Map<string, FieldMeta[]>();

function readSchema(file: string): JsonSchema | null {
  const path = resolve(getDatabasePath(), '_schema', file);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as JsonSchema;
  } catch (e) {
    console.warn(`Failed to read schema ${path}:`, e);
    return null;
  }
}

/** Every browsable field of a category, in display order. */
export function loadFieldCatalog(categoryId: string): FieldMeta[] {
  if (process.env.NODE_ENV === 'production') {
    const cached = catalogCache.get(categoryId);
    if (cached) return cached;
  }
  const schemaFile = CATEGORY_SCHEMAS[categoryId];
  const schema = schemaFile ? readSchema(schemaFile) : null;
  const common = readSchema('common.json');
  const catalog = buildFieldCatalog(schema, common, loadCategoryData(categoryId));
  if (process.env.NODE_ENV === 'production') catalogCache.set(categoryId, catalog);
  return catalog;
}
