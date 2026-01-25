import { parse } from 'yaml';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import type { BaseEntry, Category } from './types';
import { CATEGORIES } from './types';

// Cache for git timestamps (file path -> Date)
let gitTimestampCache: Map<string, Date> | null = null;

/**
 * Get git last-modified timestamps for all database YAML files in a single batch call.
 * Results are cached for the lifetime of the process.
 */
function getGitTimestamps(): Map<string, Date> {
  if (gitTimestampCache) {
    return gitTimestampCache;
  }

  gitTimestampCache = new Map();
  const repoRoot = resolve(getDatabasePath(), '..');

  try {
    const output = execSync(
      `git log --format="%aI" --name-only --diff-filter=ACMR -- "database/**/*.yaml"`,
      {
        encoding: 'utf-8',
        cwd: repoRoot,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    const lines = output.trim().split('\n');
    let currentTimestamp: string | null = null;

    for (const line of lines) {
      if (!line) continue;

      // ISO timestamp pattern
      if (/^\d{4}-\d{2}-\d{2}T/.test(line)) {
        currentTimestamp = line;
      } else if (currentTimestamp && line.endsWith('.yaml')) {
        const fullPath = resolve(repoRoot, line);
        // Only set if not already set (we want most recent commit)
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
function getDatabasePath(): string {
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
  const databasePath = getDatabasePath();
  const categoryDir = resolve(databasePath, categoryId);

  if (!existsSync(categoryDir)) {
    console.warn(`Category directory not found: ${categoryDir}`);
    return [];
  }

  const entries: BaseEntry[] = [];
  const files = readdirSync(categoryDir).filter(
    (f) => f.endsWith('.yaml') && !f.startsWith('_')
  );

  const timestamps = getGitTimestamps();

  for (const file of files) {
    const filePath = resolve(categoryDir, file);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const parsed = parse(content) as BaseEntry;
      if (parsed) {
        // Infer id from filename
        parsed.id = file.replace(/\.yaml$/, '');
        const timestamp = timestamps.get(filePath);
        if (!timestamp) {
          throw new Error(`No git timestamp found for ${filePath}`);
        }
        parsed.updated = timestamp;
        entries.push(parsed);
      }
    } catch (e) {
      console.warn(`Failed to parse ${filePath}:`, e);
    }
  }

  // Sort by name
  entries.sort((a, b) => a.name.localeCompare(b.name));
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
    const timestamp = getGitTimestamps().get(filePath);
    if (!timestamp) {
      throw new Error(`No git timestamp found for ${filePath}`);
    }
    parsed.updated = timestamp;
    return parsed;
  } catch (e) {
    console.warn(`Failed to parse ${filePath}:`, e);
    return null;
  }
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
  const routes: string[] = ['/', '/about'];

  for (const category of CATEGORIES) {
    // Add category page
    routes.push(category.path);

    // Add individual entry pages
    const entries = loadCategoryData(category.id);
    for (const entry of entries) {
      routes.push(`${category.path}/${entry.id}`);
    }
  }

  return routes;
}
