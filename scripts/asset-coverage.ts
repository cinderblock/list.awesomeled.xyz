#!/usr/bin/env bun
/**
 * Image + datasheet coverage report for the database.
 *
 *   bun run coverage:assets                 # per-category table (Markdown)
 *   bun run coverage:assets --missing       # also list entries without an image/datasheet
 *   bun run coverage:assets --missing pixels  # ...for one category
 *   bun run coverage:assets --json          # machine-readable
 *
 * "Attributed" means every image on the entry uses the {file, source, credit}
 * object form (common.json#/definitions/image_object). Datasheet columns only
 * count categories whose schema has a `datasheet` block.
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

const DB_DIR = 'database';
const SCHEMA_DIR = join(DB_DIR, '_schema');
const IMG_DIR = join('public', 'database-images');

// Category folder -> schema file (mirrors scripts/validate.ts)
const SCHEMAS: Record<string, string> = {
  adapters: 'adapter.json',
  'commercial-systems': 'commercial-system.json',
  connectors: 'connector.json',
  controllers: 'controller.json',
  'diffusive-materials': 'diffusive-material.json',
  'drive-libraries': 'drive-library.json',
  'level-converters': 'level-converter.json',
  microboards: 'microboard.json',
  'pattern-drivers': 'pattern-driver.json',
  'pixel-decoders': 'pixel-decoder.json',
  'pixel-ics': 'pixel-ic.json',
  pixels: 'pixel.json',
};

interface ImageRef {
  file: string;
  attributed: boolean;
  license?: string;
}

function imagesOf(data: Record<string, unknown>): ImageRef[] {
  const out: ImageRef[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string') out.push({ file: v, attributed: false });
    else if (v && typeof v === 'object' && typeof (v as { file?: unknown }).file === 'string') {
      const o = v as { file: string; source?: string; credit?: string; license?: string };
      out.push({ file: o.file, attributed: !!(o.source && o.credit), license: o.license });
    }
  };
  push(data.image);
  if (Array.isArray(data.images)) data.images.forEach(push);
  return out;
}

interface Row {
  category: string;
  entries: number;
  withImage: number;
  attributed: number;
  licensed: number;
  hasDatasheetField: boolean;
  withDatasheet: number;
  mirrored: number;
  missingImage: string[];
  missingDatasheet: string[];
  brokenImages: string[];
}

function schemaHasDatasheet(schemaFile: string): boolean {
  const schema = JSON.parse(readFileSync(join(SCHEMA_DIR, schemaFile), 'utf-8'));
  return !!schema?.properties?.datasheet;
}

export function coverage(): Row[] {
  const rows: Row[] = [];
  for (const category of Object.keys(SCHEMAS).sort()) {
    const dir = join(DB_DIR, category);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    const row: Row = {
      category,
      entries: 0,
      withImage: 0,
      attributed: 0,
      licensed: 0,
      hasDatasheetField: schemaHasDatasheet(SCHEMAS[category]!),
      withDatasheet: 0,
      mirrored: 0,
      missingImage: [],
      missingDatasheet: [],
      brokenImages: [],
    };
    for (const file of readdirSync(dir).sort()) {
      if (!file.endsWith('.yaml') || file.startsWith('_')) continue;
      const id = file.replace(/\.yaml$/, '');
      const data = (parse(readFileSync(join(dir, file), 'utf-8')) ?? {}) as Record<string, unknown>;
      row.entries++;

      const imgs = imagesOf(data);
      if (imgs.length) {
        row.withImage++;
        if (imgs.every((i) => i.attributed)) row.attributed++;
        if (imgs.every((i) => i.license)) row.licensed++;
        for (const i of imgs) {
          if (!existsSync(join(IMG_DIR, category, i.file)))
            row.brokenImages.push(`${id}: ${i.file}`);
        }
      } else {
        row.missingImage.push(id);
      }

      const ds = data.datasheet as { url?: string; mirror?: unknown } | null | undefined;
      if (ds && typeof ds === 'object' && ds.url) {
        row.withDatasheet++;
        if (ds.mirror) row.mirrored++;
      } else if (row.hasDatasheetField) {
        row.missingDatasheet.push(id);
      }
    }
    rows.push(row);
  }
  return rows;
}

const pct = (n: number, d: number) => (d ? `${Math.round((100 * n) / d)}%` : '—');

function printTable(rows: Row[]) {
  const total = rows.reduce(
    (t, r) => ({
      entries: t.entries + r.entries,
      withImage: t.withImage + r.withImage,
      attributed: t.attributed + r.attributed,
      licensed: t.licensed + r.licensed,
      dsEntries: t.dsEntries + (r.hasDatasheetField ? r.entries : 0),
      withDatasheet: t.withDatasheet + r.withDatasheet,
      mirrored: t.mirrored + r.mirrored,
    }),
    {
      entries: 0,
      withImage: 0,
      attributed: 0,
      licensed: 0,
      dsEntries: 0,
      withDatasheet: 0,
      mirrored: 0,
    }
  );
  console.log(
    '| Category | Entries | Image | Attributed | Open license | Datasheet | Mirrored |\n' +
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: |'
  );
  for (const r of rows) {
    const ds = r.hasDatasheetField
      ? `${r.withDatasheet} (${pct(r.withDatasheet, r.entries)})`
      : r.withDatasheet
        ? `${r.withDatasheet} (no field)`
        : '—';
    console.log(
      `| ${r.category} | ${r.entries} | ${r.withImage} (${pct(r.withImage, r.entries)}) | ` +
        `${r.attributed} | ${r.licensed} | ${ds} | ${r.hasDatasheetField ? r.mirrored : '—'} |`
    );
  }
  console.log(
    `| **Total** | ${total.entries} | ${total.withImage} (${pct(total.withImage, total.entries)}) | ` +
      `${total.attributed} | ${total.licensed} | ${total.withDatasheet}/${total.dsEntries} ` +
      `(${pct(total.withDatasheet, total.dsEntries)}) | ${total.mirrored} |`
  );
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const rows = coverage();
  if (args.includes('--json')) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    printTable(rows);
    const broken = rows.flatMap((r) => r.brokenImages.map((b) => `${r.category}/${b}`));
    if (broken.length)
      console.log(`\nMissing image files:\n${broken.map((b) => `- ${b}`).join('\n')}`);
    const mi = args.indexOf('--missing');
    if (mi >= 0) {
      const only = args[mi + 1] && !args[mi + 1]!.startsWith('--') ? args[mi + 1] : undefined;
      for (const r of rows) {
        if (only && r.category !== only) continue;
        console.log(`\n## ${r.category}`);
        console.log(`No image (${r.missingImage.length}): ${r.missingImage.join(', ')}`);
        if (r.hasDatasheetField) {
          console.log(
            `No datasheet (${r.missingDatasheet.length}): ${r.missingDatasheet.join(', ')}`
          );
        }
      }
    }
  }
}
