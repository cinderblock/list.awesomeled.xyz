/**
 * Loader side of /contribute: a field reference for every category,
 * generated from the same catalog the tables use (schema + data), so it
 * cannot drift from what the validator accepts and what entries really carry.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDatabasePath, loadCategoryData } from './data';
import {
  fieldText,
  fieldValues,
  getPath,
  isEmptyValue,
  SECTION_ORDER,
  type FieldKind,
  type FieldMeta,
} from './fields';
import { loadFieldCatalog } from './fields.server';
import {
  entrySourcePath,
  newEntryUrl,
  REPO_BRANCH,
  REPO_URL,
  repoFileUrl,
  SITE_ORIGIN,
} from './site';
import { CATEGORIES, type BaseEntry, type Category } from './types';
import { baseUnit } from './units';

export interface FieldReference {
  /** Dotted path in the YAML file ("outputs.pixels.max_per_output") */
  key: string;
  label: string;
  /** What kind of value goes there, in words */
  type: string;
  description?: string;
  /** How many of the category's entries have it */
  filled: number;
  /** A few values in use, most common first */
  examples: string[];
}

export interface SectionReference {
  label: string;
  fields: FieldReference[];
}

export interface CategoryReference {
  id: string;
  name: string;
  path: string;
  hue: number;
  description: string;
  count: number;
  sections: SectionReference[];
  /** GitHub's "create a new file" page, pre-filled with a starter entry */
  newEntryUrl: string;
  /** The folder of YAML files on GitHub */
  folderUrl: string;
  /** The category's `_example.yaml`: every field filled in, with a comment on each */
  exampleUrl: string | null;
  /** A well-filled entry to copy from */
  sample: { name: string; path: string; sourceUrl: string } | null;
}

const EXAMPLE_COUNT = 4;
const EXAMPLE_MAX_LENGTH = 28;

// Derived at load time, not written in the YAML
const NOT_WRITTEN = (field: FieldMeta) => field.section === 'linked' || field.key === 'updated';

function typeInWords(field: FieldMeta): string {
  const words: Record<FieldKind, string> = {
    text: 'text',
    textlist: 'list of text',
    enum: 'one of a few values',
    tags: 'list of values',
    keys: 'map of names',
    boolean: 'true / false',
    number: 'number',
    quantity: 'number with unit',
    price: 'price',
    year: 'year',
    url: 'link',
    entity: 'name, or {name, url}',
  };
  if (field.kind === 'quantity' && field.quantity) {
    return `number with unit (${baseUnit(field.quantity)})`;
  }
  return words[field.kind];
}

/** The values a field takes across a category, most common first. */
function examplesOf(field: FieldMeta, entries: BaseEntry[]): string[] {
  if (field.kind === 'text' || field.kind === 'textlist' || field.kind === 'url') return [];
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const value = getPath(entry, field.key);
    if (isEmptyValue(value)) continue;
    const values =
      field.kind === 'number' ||
      field.kind === 'quantity' ||
      field.kind === 'price' ||
      field.kind === 'year'
        ? [fieldText(field, value)]
        : fieldValues(field, value);
    for (const v of values) {
      if (v && v.length <= EXAMPLE_MAX_LENGTH) counts.set(v, (counts.get(v) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, EXAMPLE_COUNT)
    .map(([value]) => value);
}

// The fields every category's schema accepts, in the key order the linter
// wants (eslint.config: name, status, creator, …, notes). Anything else comes
// from the field reference or a similar entry.
function starterEntry(category: Category): string {
  return [
    `# A new entry for ${category.name}.`,
    '#',
    '# 1. Name this file after the product, in lowercase with hyphens',
    '#    (falcon-f16v4.yaml). The file name becomes the page address.',
    '# 2. Fill in what you know and delete the lines you do not. Every field',
    `#    this category records: ${SITE_ORIGIN}/contribute#${category.id}`,
    '# 3. Every field, filled in and explained, is in the annotated example:',
    `#    ${repoFileUrl(`database/${category.id}/_example.yaml`)}`,
    '',
    'name: ',
    'status: active',
    'creator:',
    '  name: ',
    '  page: https://',
    'notes: ',
    '',
  ].join('\n');
}

function categoryReference(category: Category): CategoryReference {
  const entries = loadCategoryData(category.id);
  const fields = loadFieldCatalog(category.id).filter((field) => !NOT_WRITTEN(field));

  const bySection = new Map<string, { label: string; fields: FieldReference[] }>();
  for (const field of fields) {
    let section = bySection.get(field.section);
    if (!section) {
      section = { label: field.sectionLabel, fields: [] };
      bySection.set(field.section, section);
    }
    section.fields.push({
      key: field.key,
      label: field.label,
      type: typeInWords(field),
      description: field.description,
      filled: field.filled,
      examples: examplesOf(field, entries),
    });
  }
  const order = (key: string) => {
    const i = SECTION_ORDER.indexOf(key);
    return i === -1 ? SECTION_ORDER.length : i;
  };
  const sections = [...bySection.entries()]
    .sort((a, b) => order(a[0]) - order(b[0]))
    .map(([, section]) => section);

  // The entry with the most fields filled in is the best one to copy from
  let sample: BaseEntry | null = null;
  let most = -1;
  for (const entry of entries) {
    const filled = fields.filter((f) => !isEmptyValue(getPath(entry, f.key))).length;
    if (filled > most) {
      most = filled;
      sample = entry;
    }
  }

  return {
    id: category.id,
    name: category.name,
    path: category.path,
    hue: category.color.hue,
    description: category.description,
    count: entries.length,
    sections,
    newEntryUrl: newEntryUrl(category.id, starterEntry(category)),
    folderUrl: `${REPO_URL}/tree/${REPO_BRANCH}/database/${category.id}`,
    exampleUrl: existsSync(resolve(getDatabasePath(), category.id, '_example.yaml'))
      ? repoFileUrl(`database/${category.id}/_example.yaml`)
      : null,
    sample: sample
      ? {
          name: sample.name,
          path: `${category.path}/${sample.id}`,
          sourceUrl: repoFileUrl(entrySourcePath(category.id, sample.id)),
        }
      : null,
  };
}

export function loadContributeData(): { categories: CategoryReference[] } {
  return { categories: CATEGORIES.map(categoryReference) };
}
