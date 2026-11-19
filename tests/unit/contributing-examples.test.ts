import { describe, expect, test } from 'bun:test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { CATEGORIES } from '../../app/lib/types';

// The example entries in CONTRIBUTING.md are what a new contributor copies.
// They once showed a schema the validator had stopped accepting (an `id`
// field, flat `max_pixels`…), so a first pull request failed its checks.
// These tests hold the guide to the real schemas and the real key order.
// (Each category's `_example.yaml` is held to its schema by `bun run validate`.)

const ROOT = join(import.meta.dirname, '..', '..');
const SCHEMAS = join(ROOT, 'database', '_schema');

const SCHEMA_FOR: Record<string, string> = {
  Controller: 'controller.json',
  Pixel: 'pixel.json',
  'Software Library': 'drive-library.json',
};

// eslint.config.js, yml/sort-keys for database/**/*.yaml
const KEY_ORDER = [
  'name',
  'status',
  'release_year',
  'creator',
  'developer',
  'manufacturers',
  'vendors',
  'notes',
  'inputs',
  'outputs',
  'power',
];

const guide = readFileSync(join(ROOT, 'CONTRIBUTING.md'), 'utf-8').replace(/\r\n/g, '\n');
const examples = [
  ...guide.matchAll(/### Example Entry \((.+?)\)\n[\s\S]*?```yaml\n([\s\S]*?)```/g),
].map((match) => ({ title: match[1], yaml: match[2] }));

function rank(key: string): [number, string] {
  const i = KEY_ORDER.indexOf(key);
  return i === -1 ? [KEY_ORDER.length, key] : [i, ''];
}

describe('CONTRIBUTING.md example entries', () => {
  test('the guide has an example, and each is of a kind this test knows', () => {
    expect(examples.length).toBeGreaterThan(0);
    for (const { title } of examples) expect(Object.keys(SCHEMA_FOR)).toContain(title);
  });

  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  ajv.addSchema(JSON.parse(readFileSync(join(SCHEMAS, 'common.json'), 'utf-8')));

  for (const { title, yaml } of examples) {
    test(`${title}: passes its category's schema`, () => {
      const validate = ajv.compile(
        JSON.parse(readFileSync(join(SCHEMAS, SCHEMA_FOR[title]), 'utf-8'))
      );
      const entry = parse(yaml);
      validate(entry);
      expect(validate.errors ?? []).toEqual([]);
      // The id is the file name; an `id` field is not part of any schema
      expect(Object.keys(entry)).not.toContain('id');
    });

    test(`${title}: keys are in the order the linter enforces`, () => {
      const keys = Object.keys(parse(yaml));
      const sorted = [...keys].sort((a, b) => {
        const [ra, na] = rank(a);
        const [rb, nb] = rank(b);
        return ra - rb || na.localeCompare(nb);
      });
      expect(keys).toEqual(sorted);
    });
  }
});

describe('issue forms', () => {
  const forms = join(ROOT, '.github', 'ISSUE_TEMPLATE');
  const read = (file: string) => parse(readFileSync(join(forms, file), 'utf-8'));

  test('the new-entry form offers every category, by the name the site links with', () => {
    const form = read('2-new-entry.yml') as {
      body: { id?: string; attributes?: { options?: string[] } }[];
    };
    const options = form.body.find((field) => field.id === 'category')?.attributes?.options ?? [];
    // The table's "Not on the list?" link pre-selects the category by its name
    expect(options.slice(0, CATEGORIES.length).sort()).toEqual(
      CATEGORIES.map((category) => category.name).sort()
    );
  });

  test('the fields the site pre-fills exist in the forms', () => {
    const ids = (file: string) =>
      (read(file) as { body: { id?: string }[] }).body.map((field) => field.id).filter(Boolean);
    expect(ids('1-correction.yml')).toContain('entry');
    expect(ids('2-new-entry.yml')).toContain('name');
    expect(ids('3-site.yml')).toContain('page');
  });
});
