/**
 * A category's introduction: what the category is and what to look for when
 * choosing from it. Written as Markdown next to the data
 * (database/<category>/description.md) and turned into HTML while prerendering.
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { marked } from 'marked';
import { getDatabasePath } from './data';

/** The introduction as HTML, or null when the category has none. */
export function loadCategoryIntro(categoryId: string): string | null {
  const file = resolve(getDatabasePath(), categoryId, 'description.md');
  if (!existsSync(file)) return null;
  // Repository content, reviewed like the rest of the database: trusted HTML
  const html = marked.parse(readFileSync(file, 'utf-8'), { async: false }).trim();
  return html || null;
}
