import { parse } from "yaml";
import { readdirSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { BaseEntry, Category } from "./types";
import { CATEGORIES } from "./types";

// Get the database directory path
function getDatabasePath(): string {
  // In production, we need to handle both Node.js and bundled environments
  // The database is located at the project root
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Navigate from app/lib to project root, then to database
  // During build: project/app/lib/data.ts -> project/database
  // During dev: same structure
  return resolve(__dirname, "../../database");
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
    (f) => (f.endsWith(".yaml") || f.endsWith(".yml")) && !f.startsWith("_")
  );

  for (const file of files) {
    const filePath = resolve(categoryDir, file);
    try {
      const content = readFileSync(filePath, "utf-8");
      const parsed = parse(content) as BaseEntry;
      if (parsed && parsed.id) {
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

  // Try both .yaml and .yml extensions
  const yamlPath = resolve(categoryDir, `${entryId}.yaml`);
  const ymlPath = resolve(categoryDir, `${entryId}.yml`);

  const filePath = existsSync(yamlPath) ? yamlPath : existsSync(ymlPath) ? ymlPath : null;

  if (!filePath) {
    return null;
  }

  try {
    const content = readFileSync(filePath, "utf-8");
    const parsed = parse(content) as BaseEntry;
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
  const routes: string[] = ["/", "/about"];

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
