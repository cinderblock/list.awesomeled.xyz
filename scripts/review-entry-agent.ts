#!/usr/bin/env bun
/**
 * Database Entry Review Script (agent edition)
 *
 * A headless version of review-entry.ts meant to be driven by Claude Code
 * instead of a human. It drops the parts an agent doesn't need — the local
 * webserver, the image-picker bookmarklet, browser/VS Code launching, and the
 * interactive commit prompt — and keeps the parts an agent can't easily do on
 * its own: selecting an old entry and the sharp image pipeline
 * (download -> background removal -> crop -> save -> patch YAML).
 *
 * The agent reviews/edits the YAML and commits using its own tools; this script
 * just feeds it context and handles images.
 *
 * Usage:
 *   bun run review:agent                              # pick + dump an old entry
 *   bun run review:agent pick [category]              # pick + dump an old entry
 *   bun run review:agent show <category/id>           # dump a specific entry
 *   bun run review:agent add-image <category/id> <url> [url...]
 *   bun run review:agent reoptimize [category]        # webp-optimize existing images
 *
 * `pick`/`show` print machine-readable JSON to stdout (entry path, URLs,
 * current images, full data) so the agent has everything in one call.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import { parse as parseYaml, parseDocument } from 'yaml';

// Import shared utilities from the app
import { getDatabasePath, getGitTimestamps } from '../app/lib/data';
import { CATEGORIES } from '../app/lib/types';
// Single source of truth for image processing (background removal + WebP).
import { optimizeToWebp, processImage } from './crop-image';

const DATABASE_PATH = getDatabasePath();
const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

interface Entry {
  id: string;
  category: string;
  filePath: string;
  name: string;
  url?: string;
  urls: string[];
  updated: Date | null;
  data: Record<string, unknown>;
}

/**
 * The web-served image directory for a category. Images live under
 * <repo>/public/database-images/<category>/ (served at /database-images/...),
 * NOT in a per-category database/<category>/images/ folder.
 */
function imagesDirFor(category: string): string {
  return resolve(DATABASE_PATH, '..', 'public', 'database-images', category);
}

/**
 * Extract all URLs from an entry
 */
function extractUrls(data: Record<string, unknown>): string[] {
  const urls: string[] = [];

  function extract(obj: unknown) {
    if (typeof obj === 'string') {
      if (obj.match(/^https?:\/\//)) {
        urls.push(obj);
      }
    } else if (Array.isArray(obj)) {
      obj.forEach(extract);
    } else if (obj && typeof obj === 'object') {
      Object.values(obj).forEach(extract);
    }
  }

  extract(data);
  return [...new Set(urls)]; // Deduplicate
}

/**
 * Load all entries with their timestamps
 */
function loadAllEntries(): Entry[] {
  const entries: Entry[] = [];
  const timestamps = getGitTimestamps();

  for (const category of CATEGORY_IDS) {
    const categoryPath = resolve(DATABASE_PATH, category);
    if (!existsSync(categoryPath)) continue;

    const files = readdirSync(categoryPath).filter(
      (f) => f.endsWith('.yaml') && !f.startsWith('_')
    );

    for (const file of files) {
      const filePath = resolve(categoryPath, file);
      const id = basename(file, '.yaml');

      try {
        const content = readFileSync(filePath, 'utf-8');
        const data = parseYaml(content) as Record<string, unknown>;

        entries.push({
          id,
          category,
          filePath,
          name: (data.name as string) || id,
          url: data.url as string | undefined,
          urls: extractUrls(data),
          // getGitTimestamps() returns full paths as keys
          updated: timestamps.get(filePath) || null,
          data,
        });
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
      }
    }
  }

  return entries;
}

/**
 * Sort by updated date (oldest first, null/never first)
 */
function sortByAge(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    if (!a.updated && !b.updated) return 0;
    if (!a.updated) return -1;
    if (!b.updated) return 1;
    return a.updated.getTime() - b.updated.getTime();
  });
}

/**
 * Pick a random entry from the oldest N entries (optionally within a category)
 */
function pickRandomOldest(entries: Entry[], category?: string, poolSize = 10): Entry | null {
  let pool = entries;
  if (category) {
    pool = pool.filter((e) => e.category === category);
    if (pool.length === 0) return null;
  }
  const sorted = sortByAge(pool);
  const oldest = sorted.slice(0, Math.min(poolSize, sorted.length));
  return oldest[Math.floor(Math.random() * oldest.length)] || null;
}

/**
 * Current images referenced by an entry
 */
function currentImages(data: Record<string, unknown>): string[] {
  const images: string[] = [];
  if (typeof data.image === 'string') images.push(data.image);
  if (Array.isArray(data.images)) {
    for (const i of data.images) if (typeof i === 'string') images.push(i);
  }
  return [...new Set(images)];
}

/**
 * Print an entry as JSON for the agent to consume
 */
function dumpEntry(entry: Entry) {
  const sorted = sortByAge(loadAllEntries());
  const rank = sorted.findIndex((e) => e.filePath === entry.filePath);
  console.log(
    JSON.stringify(
      {
        id: entry.id,
        category: entry.category,
        filePath: entry.filePath,
        imagesDir: imagesDirFor(entry.category),
        name: entry.name,
        updated: entry.updated ? entry.updated.toISOString().split('T')[0] : null,
        ageRank: rank >= 0 ? `${rank + 1} of ${sorted.length} (1 = oldest)` : null,
        urls: entry.urls,
        currentImages: currentImages(entry.data),
        data: entry.data,
      },
      null,
      2
    )
  );
}

/**
 * Update the entry's YAML file with a new image
 */
function updateEntryImage(entry: Entry, filename: string) {
  // Edit through the Document API so inline comments and formatting survive.
  const doc = parseDocument(readFileSync(entry.filePath, 'utf-8'));
  const js = doc.toJS() as Record<string, unknown>;

  // Idempotent: skip if this image is already referenced.
  if (js.image === filename || (Array.isArray(js.images) && js.images.includes(filename))) {
    console.log(`  • ${entry.id}.yaml already references ${filename}`);
    return;
  }

  if (Array.isArray(js.images)) {
    doc.addIn(['images'], filename);
  } else if (js.image != null) {
    doc.delete('image');
    doc.set('images', [js.image, filename]);
  } else {
    doc.set('image', filename);
  }

  writeFileSync(entry.filePath, doc.toString({ lineWidth: 0 }));
  console.log(`  ✓ Updated ${entry.id}.yaml with image: ${filename}`);
}

/**
 * Replace an image filename reference in an entry's YAML (e.g. on .png -> .webp
 * conversion). Returns true if a reference was found and rewritten.
 */
function renameImageRef(entry: Entry, oldName: string, newName: string): boolean {
  // Edit through the Document API so inline comments and formatting survive.
  const doc = parseDocument(readFileSync(entry.filePath, 'utf-8'));
  const js = doc.toJS() as Record<string, unknown>;
  let changed = false;

  if (js.image === oldName) {
    doc.set('image', newName);
    changed = true;
  }
  if (Array.isArray(js.images)) {
    js.images.forEach((i, idx) => {
      if (i === oldName) {
        doc.setIn(['images', idx], newName);
        changed = true;
      }
    });
  }

  if (changed) {
    writeFileSync(entry.filePath, doc.toString({ lineWidth: 0 }));
    console.log(`  ✓ ${entry.id}.yaml: ${oldName} -> ${newName}`);
  }
  return changed;
}

/**
 * Re-optimize the images already committed under public/database-images/.
 *
 * Optimize-only: resize + convert to WebP (no background removal, so
 * hand-cleaned images aren't degraded). Rewrites YAML refs on rename, and for
 * orphaned files (no YAML ref) whose base name matches an entry id, adds a ref.
 */
async function reoptimizeExisting(entries: Entry[], onlyCategory?: string) {
  const PROCESSABLE = /\.(png|jpe?g)$/i; // leave svg (vector) and gif (animated) alone
  const categories = onlyCategory ? [onlyCategory] : CATEGORY_IDS;

  for (const category of categories) {
    const dir = imagesDirFor(category);
    if (!existsSync(dir)) continue;

    const files = readdirSync(dir).filter((f) => PROCESSABLE.test(f));
    if (files.length === 0) continue;

    console.log(`\n[${category}] ${files.length} image(s)`);
    for (const oldName of files) {
      const base = oldName.replace(PROCESSABLE, '');
      const newName = `${base}.webp`;
      const oldPath = resolve(dir, oldName);
      const newPath = resolve(dir, newName);

      const before = readFileSync(oldPath);
      const after = await optimizeToWebp(before);
      writeFileSync(newPath, after);
      console.log(
        `  ${oldName} (${Math.round(before.length / 1024)}KB) -> ${newName} (${Math.round(after.length / 1024)}KB)`
      );

      // Rewrite any YAML reference to the old filename.
      const referencing = entries.filter(
        (e) => e.category === category && currentImages(e.data).includes(oldName)
      );
      for (const e of referencing) renameImageRef(e, oldName, newName);

      // Orphan: no entry referenced the old file. If a same-named entry exists,
      // add the new ref so the image actually displays.
      if (referencing.length === 0) {
        const match = entries.find((e) => e.category === category && e.id === base);
        if (match) {
          updateEntryImage(match, newName);
        } else {
          console.log(`  ⚠ orphan ${newName}: no entry id matches "${base}" — left unreferenced`);
        }
      }

      // Remove the original now that the WebP replaces it.
      if (newPath !== oldPath) rmSync(oldPath);
    }
  }
}

/**
 * Download an image from a URL, process it, save it, and patch the YAML
 */
async function addImage(
  url: string,
  entry: Entry
): Promise<{ success: boolean; filename?: string; error?: string }> {
  try {
    const imagesDir = imagesDirFor(entry.category);
    if (!existsSync(imagesDir)) {
      mkdirSync(imagesDir, { recursive: true });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const contentType = response.headers.get('content-type') || '';
    const isSvg = contentType.includes('svg');
    const isGif = contentType.includes('gif');

    const baseFilename = entry.id;
    const buffer = Buffer.from(await response.arrayBuffer());

    let finalBuffer: Buffer;
    let filename: string;

    if (isSvg) {
      finalBuffer = buffer;
      filename = `${baseFilename}.svg`;
    } else if (isGif) {
      finalBuffer = buffer;
      filename = `${baseFilename}.gif`;
    } else {
      console.log(`    Processing image (bg removal, crop, resize, optimize)...`);
      finalBuffer = await optimizeToWebp(await processImage(buffer));
      filename = `${baseFilename}.webp`; // WebP keeps transparency + compresses well
    }

    // Ensure unique filename
    let finalPath = resolve(imagesDir, filename);
    let counter = 1;
    while (existsSync(finalPath)) {
      const ext = filename.split('.').pop();
      const base = filename.replace(`.${ext}`, '');
      filename = `${base}-${counter}.${ext}`;
      finalPath = resolve(imagesDir, filename);
      counter++;
    }

    writeFileSync(finalPath, finalBuffer);
    updateEntryImage(entry, filename);

    return { success: true, filename };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

function findEntry(entries: Entry[], ref: string): Entry | null {
  const [category, id] = ref.includes('/') ? ref.split('/') : [undefined, ref];
  return entries.find((e) => (category ? e.category === category : true) && e.id === id) || null;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] && !args[0].includes('/') ? args[0] : 'pick';
  const entries = loadAllEntries();

  if (command === 'reoptimize') {
    const category = args[1];
    if (category && !CATEGORY_IDS.includes(category)) {
      console.error(`Unknown category: ${category}`);
      console.error(`Available: ${CATEGORY_IDS.join(', ')}`);
      process.exit(1);
    }
    await reoptimizeExisting(entries, category);
    return;
  }

  if (command === 'add-image') {
    const ref = args[1];
    const urls = args.slice(2);
    if (!ref || urls.length === 0) {
      console.error('Usage: review:agent add-image <category/id> <url> [url...]');
      process.exit(1);
    }
    const entry = findEntry(entries, ref);
    if (!entry) {
      console.error(`Entry not found: ${ref}`);
      process.exit(1);
    }
    for (const url of urls) {
      console.log(`  📥 ${url}`);
      const result = await addImage(url, entry);
      if (!result.success) {
        console.error(`  ✗ Failed: ${result.error}`);
      }
    }
    return;
  }

  if (command === 'show') {
    const ref = args[1] || (args[0]?.includes('/') ? args[0] : undefined);
    if (!ref) {
      console.error('Usage: review:agent show <category/id>');
      process.exit(1);
    }
    const entry = findEntry(entries, ref);
    if (!entry) {
      console.error(`Entry not found: ${ref}`);
      process.exit(1);
    }
    dumpEntry(entry);
    return;
  }

  // pick (default)
  const category = command === 'pick' ? args[1] : undefined;
  if (category && !CATEGORY_IDS.includes(category)) {
    console.error(`Unknown category: ${category}`);
    console.error(`Available: ${CATEGORY_IDS.join(', ')}`);
    process.exit(1);
  }
  const entry = pickRandomOldest(entries, category);
  if (!entry) {
    console.error('No entries found.');
    process.exit(1);
  }
  dumpEntry(entry);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
