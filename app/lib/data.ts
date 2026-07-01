import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';
import type { BaseEntry, Category, RelatedItem, ResolvedRelatedItem } from './types';
import { CATEGORIES } from './types';

// Cache for git timestamps (file path -> Date)
let gitTimestampCache: Map<string, Date> | null = null;

// Parsed category data, cached only during production builds: prerendering
// scans every category per entry page for reverse links, which would otherwise
// re-read all YAML hundreds of times. Skipped in dev so YAML edits show up on
// refresh (the review-entry.ts workflow depends on that).
const categoryDataCache = new Map<string, BaseEntry[]>();

// Commits to ignore when calculating timestamps (e.g., bulk metadata changes)
const IGNORED_COMMITS = new Set([
  'b867ec196ee1f68be4e92fa369aa2bdb96018754', // Remove redundant id field from database entries
  'e2eb1e6261e16e3524b9988bedc9d2365bbb3b39', // Standardize database attribution fields and add ESLint terminology rules
  // Flat -> nested rich-schema migration (structural reshaping, not content updates)
  'dcfe5b523301ce0dd5ae6d73cff46c8728eb60b4', // controllers: F16V4 migrate, F16V5 add
  'cc4384cfd3b83fd6f191cc6166168d2268aef712', // controllers pilot (11)
  'c627399fecd8d1b01dd2fd3f51b1f68898a327f8', // controllers batch (21)
  'd28091c0d90f848c48aed902df395cdf822696f6', // controllers batch 3
  '8818fe7be0646cfa04888da614da3b237bfbf1d9', // controllers batch 4
  'ec1e8222cf281ae1f0d333663dc581acb2342954', // controllers final 5
  '7d8116e0341d4115207e035c64d94723a5cb89ed', // controllers: drop stray id
  '450dd2f6a1e9c4171bd46d2c1e0af20866013530', // pixels other_links->array
  '7531fcb45e895c39cbbc021f14be2c5d9b56ed68', // systematic fixes (pixel-ics/microboards/pattern-drivers/diffusive/adapters)
  'ad1c07b4e27e09cb30c25295cddf230c54d07563', // pixels schema + apa102
  '8ca1f9c030cfeccc8ae85726439edd80740f0268', // pixels (33)
  '6a3ad4520215849ea13cb34a1b6669e977dbce2e', // pixel-ics schema + ws2811
  '9608eccbb18f915c3641416be45fb236c08f9e6e', // pixel-ics (39)
  'b495c871a62a9860ea045604c589bfd6e01de2bf', // microboards schema + esp-32s
  'a575e0cda5f06804874df4515ea40c683626c6ca', // microboards (35)
  'a8a4e50ef8dfcb0e0487fe483548e1f9f4368fad', // connectors schema + xt60-90
  '7cd11ce8d1848d5e9b995f50c5ce45f0923fd332', // connectors (43)
  '2de760fd879f144cd471cfe633cf7becc4a7ff2e', // adapters schema + 16x-led-shield
  '046f4517968c50af0cb9f19ecadf371fcb38dc08', // adapters (45)
  'daf292b9e9fff20735085a6c5912dbd80a93a921', // level-converters schema + data
  'e7240e9ff9f851fca7798264704e1fb6d5acc644', // pixel-decoders schema + data
  '4775c6a5d05fe590c737c1e91d45e9fa39d96bbb', // drive-libraries schema + fastled
  '388c2cfa56be96ba1a3c52a3b248288decec4494', // drive-libraries (28)
  '18559cb1ec017c577adf3d2c8564ec3a0a9b1991', // commercial-systems schema + active-rgb
  'f471d3d1c3637da2b2c97bfc240f2a60bba45f1e', // commercial-systems (17)
  '402b855b5db40fda4647cf4a905e86d5b3f71ef2', // diffusive-materials schema + 3m-envision
  'f330d9ded8a62c1b3d7dc35d24d9d9b9e34fb2d9', // diffusive-materials (44)
  '495b5e52d0994f7d36cf4f81df58b0ce01ee69b8', // pattern-drivers schema + wled
  'eb1e06b7d0a3800c6a5b4357ae98f6d453a3d526', // pattern-drivers (39)
  // Pure formatting passes (prettier/lint only, no content change)
  '35c9c5310c8b6c0624a86b69ce52e67785ad2dba', // Prettier and lint free (42)
  'd9edd7574e197624c721c543e49d418ee3225f06', // Fix prettier formatting (39)
  '6f10b8f005514c02411b80e5b8d4c20a4f463260', // YAML key-order normalization (376)
  '52a377dd6218701696e55330b6d121efa368f134', // dead_links batch annotation from link sweep (30)
]);

/**
 * Get git last-modified timestamps for all database YAML files in a single batch call.
 * Results are cached for the lifetime of the process.
 */
export function getGitTimestamps(): Map<string, Date> {
  if (gitTimestampCache) {
    return gitTimestampCache;
  }

  gitTimestampCache = new Map();
  const repoRoot = resolve(getDatabasePath(), '..');

  try {
    const output = execSync(
      `git log --format="%H %aI" --name-only --diff-filter=ACMR -- "database/**/*.yaml"`,
      {
        encoding: 'utf-8',
        cwd: repoRoot,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const lines = output.trim().split('\n');
    let currentCommit: string | null = null;
    let currentTimestamp: string | null = null;

    for (const line of lines) {
      if (!line) continue;

      // Commit hash + ISO timestamp pattern (e.g., "abc123 2024-01-15T...")
      const commitMatch = line.match(/^([a-f0-9]{40}) (\d{4}-\d{2}-\d{2}T.+)$/);
      if (commitMatch) {
        currentCommit = commitMatch[1];
        currentTimestamp = commitMatch[2];
      } else if (currentTimestamp && line.endsWith('.yaml')) {
        // Skip files from ignored commits
        if (currentCommit && IGNORED_COMMITS.has(currentCommit)) {
          continue;
        }
        const fullPath = resolve(repoRoot, line);
        // Only set if not already set (we want most recent non-ignored commit)
        if (!gitTimestampCache.has(fullPath)) {
          gitTimestampCache.set(fullPath, new Date(currentTimestamp));
        }
      }
    }
  } catch (e) {
    console.warn('Failed to get git timestamps:', e);
  }

  return gitTimestampCache;
}

// Get the database directory path
export function getDatabasePath(): string {
  // In production, we need to handle both Node.js and bundled environments
  // The database is located at the project root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Navigate from app/lib to project root, then to database
  // During build: project/app/lib/data.ts -> project/database
  // During dev: same structure
  return resolve(__dirname, '../../database');
}

/**
 * Load all entries for a given category from YAML files
 */
export function loadCategoryData(categoryId: string): BaseEntry[] {
  if (process.env.NODE_ENV === 'production') {
    const cached = categoryDataCache.get(categoryId);
    if (cached) return cached;
  }

  const databasePath = getDatabasePath();
  const categoryDir = resolve(databasePath, categoryId);

  if (!existsSync(categoryDir)) {
    console.warn(`Category directory not found: ${categoryDir}`);
    return [];
  }

  const entries: BaseEntry[] = [];
  const files = readdirSync(categoryDir).filter((f) => f.endsWith('.yaml') && !f.startsWith('_'));

  const timestamps = getGitTimestamps();

  for (const file of files) {
    const filePath = resolve(categoryDir, file);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const parsed = parse(content) as BaseEntry;
      if (parsed) {
        // Infer id from filename
        parsed.id = file.replace(/\.yaml$/, '');
        // Use git timestamp if available, otherwise use current date (for new/uncommitted files)
        parsed.updated = timestamps.get(filePath) ?? new Date();
        entries.push(parsed);
      }
    } catch (e) {
      console.warn(`Failed to parse ${filePath}:`, e);
    }
  }

  // Sort by name
  entries.sort((a, b) => a.name.localeCompare(b.name));
  if (process.env.NODE_ENV === 'production') {
    categoryDataCache.set(categoryId, entries);
  }
  return entries;
}

/**
 * Load a single entry by category and id
 */
export function loadEntry(categoryId: string, entryId: string): BaseEntry | null {
  const databasePath = getDatabasePath();
  const categoryDir = resolve(databasePath, categoryId);

  const filePath = resolve(categoryDir, `${entryId}.yaml`);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = parse(content) as BaseEntry;
    // Infer id from the entryId parameter (which comes from the filename)
    parsed.id = entryId;
    // Use git timestamp if available, otherwise use current date (for new/uncommitted files)
    parsed.updated = getGitTimestamps().get(filePath) ?? new Date();
    return parsed;
  } catch (e) {
    console.warn(`Failed to parse ${filePath}:`, e);
    return null;
  }
}

/**
 * Forward cross-reference relationships declared in the data: a `field` on
 * entries in the `source` category holds ids of entries in the `target`
 * category. These are the single source of truth — the reverse ("used by")
 * direction is derived at render time so links stay bidirectional without
 * duplicating data on both ends.
 */
const CROSS_REF_RELATIONSHIPS: { source: string; field: string; target: string }[] = [
  { source: 'drive-libraries', field: 'related_pixel_ics', target: 'pixel-ics' },
  { source: 'adapters', field: 'related_connectors', target: 'connectors' },
  { source: 'adapters', field: 'related_microboards', target: 'microboards' },
  { source: 'pixel-decoders', field: 'related_connectors', target: 'connectors' },
];

export interface ReverseLinkGroup {
  /** Source category id (e.g. "drive-libraries") */
  category: string;
  /** Source category display name (e.g. "Drive Libraries") */
  categoryName: string;
  /** Source entries that reference this entry, by id + name */
  items: { id: string; name: string }[];
}

/**
 * Entries in other categories that reference this entry through a related_*
 * field. Powers the "Used by …" sections on detail pages.
 */
export function getReverseLinks(categoryId: string, entryId: string): ReverseLinkGroup[] {
  const groups: ReverseLinkGroup[] = [];
  for (const rel of CROSS_REF_RELATIONSHIPS) {
    if (rel.target !== categoryId) continue;
    const items = loadCategoryData(rel.source)
      .filter((e) => {
        const v = (e as Record<string, unknown>)[rel.field];
        return Array.isArray(v) && v.map(String).includes(entryId);
      })
      .map((e) => ({ id: String(e.id), name: e.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (items.length) {
      groups.push({
        category: rel.source,
        categoryName: getCategoryById(rel.source)?.name ?? rel.source,
        items,
      });
    }
  }
  return groups;
}

/**
 * Resolve an entry's `related` array for display: internal `ref` items get
 * their display name from the target entry; external items pass through.
 * Items that satisfy neither shape (no ref, no name) are dropped.
 */
export function resolveRelated(entry: BaseEntry): ResolvedRelatedItem[] {
  if (!Array.isArray(entry.related)) return [];
  const out: ResolvedRelatedItem[] = [];
  for (const item of entry.related) {
    if (!item || typeof item !== 'object' || !item.type) continue;
    if (item.ref) {
      const [category, id] = item.ref.split('/');
      const target = category && id ? loadEntry(category, id) : null;
      out.push({
        type: item.type,
        category,
        id,
        name: item.name ?? target?.name ?? id ?? item.ref,
        notes: item.notes,
      });
    } else if (item.name) {
      out.push({ type: item.type, name: item.name, url: item.url, notes: item.notes });
    }
  }
  return out;
}

export interface RelatedBacklink {
  /** Relationship type as declared on the source entry (the forward direction) */
  type: RelatedItem['type'];
  category: string;
  id: string;
  name: string;
  notes?: string;
}

/**
 * Entries anywhere in the database whose `related` array points at this entry.
 * Relationships are declared on one side only (see common.json#/definitions/related);
 * this derives the reverse direction so detail pages stay bidirectional.
 */
export function getRelatedBacklinks(categoryId: string, entryId: string): RelatedBacklink[] {
  const ref = `${categoryId}/${entryId}`;
  const out: RelatedBacklink[] = [];
  for (const category of CATEGORIES) {
    for (const entry of loadCategoryData(category.id)) {
      if (!Array.isArray(entry.related)) continue;
      for (const item of entry.related) {
        if (item && typeof item === 'object' && item.ref === ref) {
          out.push({
            type: item.type,
            category: category.id,
            id: String(entry.id),
            name: entry.name,
            notes: item.notes,
          });
        }
      }
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/**
 * Get the count of entries for each category
 */
export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const category of CATEGORIES) {
    const entries = loadCategoryData(category.id);
    counts[category.id] = entries.length;
  }

  return counts;
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/**
 * Get all routes that should be pre-rendered
 */
export function getAllRoutes(): string[] {
  const routes: string[] = ['/', '/about', '/system-overview'];

  routes.push('/database.csv.zip', '/database.yaml.zip');

  for (const category of CATEGORIES) {
    // Add category page
    routes.push(category.path);

    // Add CSV export
    routes.push(`/${category.id}.csv`);

    // Add individual entry pages
    const entries = loadCategoryData(category.id);
    for (const entry of entries) {
      routes.push(`${category.path}/${entry.id}`);
    }
  }

  return routes;
}
