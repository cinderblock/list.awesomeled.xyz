#!/usr/bin/env bun
/**
 * Agent Review Script
 *
 * AI-powered database entry reviewer that:
 * 1. Selects old entries for review (random from oldest pool)
 * 2. Analyzes neighboring entries for patterns
 * 3. Checks URL health
 * 4. Outputs structured context for Claude Code to research and update
 *
 * Usage:
 *   bun run agent-review                    # Random old entry
 *   bun run agent-review controllers        # Random from category
 *   bun run agent-review controllers/wled   # Specific entry
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { basename, resolve } from 'path';
import { parse as parseYaml } from 'yaml';

// Import shared utilities from the app
import { getDatabasePath, getGitTimestamps } from '../app/lib/data';
import { CATEGORIES } from '../app/lib/types';

const DATABASE_PATH = getDatabasePath();
const ISSUES_PATH = resolve(DATABASE_PATH, 'issues');

// Get category IDs for validation
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

interface NeighborAnalysis {
  category: string;
  totalEntries: number;
  neighbors: Entry[];
  fieldFrequency: Record<string, number>;
  statusValues: string[];
  creatorValues: string[];
  missingFields: string[];
}

interface UrlStatus {
  url: string;
  status: 'live' | 'redirect' | 'dead' | 'error';
  statusCode?: number;
  redirectUrl?: string;
  error?: string;
}

interface ReviewContext {
  entry: Entry;
  neighbors: NeighborAnalysis;
  urlStatuses: UrlStatus[];
  searchQueries: string[];
  reportPath: string;
}

// ANSI colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color: keyof typeof colors, ...args: unknown[]) {
  console.log(colors[color], ...args, colors.reset);
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
  return [...new Set(urls)];
}

/**
 * Load all entries from the database
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
 * Select an entry based on criteria
 */
function selectEntry(
  entries: Entry[],
  options: { category?: string; entryId?: string; poolSize?: number }
): Entry | null {
  let pool = entries;

  // Filter by category if specified
  if (options.category) {
    pool = pool.filter((e) => e.category === options.category);
    if (pool.length === 0) {
      log('red', `No entries found in category: ${options.category}`);
      return null;
    }
  }

  // Select specific entry if ID provided
  if (options.entryId) {
    const entry = pool.find((e) => e.id === options.entryId);
    if (!entry) {
      log('red', `Entry not found: ${options.entryId}`);
      return null;
    }
    return entry;
  }

  // Sort by age (oldest first, null dates first)
  pool.sort((a, b) => {
    if (!a.updated && !b.updated) return 0;
    if (!a.updated) return -1;
    if (!b.updated) return 1;
    return a.updated.getTime() - b.updated.getTime();
  });

  // Pick random from oldest pool
  const poolSize = options.poolSize || 10;
  const oldest = pool.slice(0, Math.min(poolSize, pool.length));
  const randomIndex = Math.floor(Math.random() * oldest.length);
  return oldest[randomIndex];
}

/**
 * Analyze neighboring entries for patterns
 */
function analyzeNeighbors(entry: Entry, allEntries: Entry[]): NeighborAnalysis {
  // Get entries from same category
  const categoryEntries = allEntries.filter((e) => e.category === entry.category);

  // Find similar entries (same creator, similar name prefix)
  const creator = entry.data.creator as string | undefined;
  const namePrefix = entry.name.split(/[-_\s]/)[0];

  const neighbors = categoryEntries
    .filter((e) => e.id !== entry.id)
    .map((e) => {
      let score = 0;
      // Same creator
      if (creator && e.data.creator === creator) score += 3;
      // Similar name prefix
      if (e.name.startsWith(namePrefix)) score += 2;
      // Has more fields (good reference)
      score += Object.keys(e.data).length / 10;
      return { entry: e, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((x) => x.entry);

  // Calculate field frequency across category
  const fieldFrequency: Record<string, number> = {};
  for (const e of categoryEntries) {
    for (const field of Object.keys(e.data)) {
      fieldFrequency[field] = (fieldFrequency[field] || 0) + 1;
    }
  }

  // Normalize to percentages
  for (const field of Object.keys(fieldFrequency)) {
    fieldFrequency[field] = Math.round((fieldFrequency[field] / categoryEntries.length) * 100);
  }

  // Extract unique values for key fields
  const statusValues = [
    ...new Set(categoryEntries.map((e) => e.data.status as string).filter(Boolean)),
  ];
  const creatorValues = [
    ...new Set(categoryEntries.map((e) => e.data.creator as string).filter(Boolean)),
  ];

  // Find fields this entry is missing that are common (>50%) in the category
  const entryFields = new Set(Object.keys(entry.data));
  const missingFields = Object.entries(fieldFrequency)
    .filter(([field, pct]) => pct > 50 && !entryFields.has(field))
    .map(([field]) => field);

  return {
    category: entry.category,
    totalEntries: categoryEntries.length,
    neighbors,
    fieldFrequency,
    statusValues,
    creatorValues,
    missingFields,
  };
}

/**
 * Check URL health
 */
async function checkUrlHealth(url: string): Promise<UrlStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual',
    });

    clearTimeout(timeout);

    if (response.status >= 200 && response.status < 300) {
      return { url, status: 'live', statusCode: response.status };
    } else if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get('location') || undefined;
      return { url, status: 'redirect', statusCode: response.status, redirectUrl };
    } else {
      return { url, status: 'dead', statusCode: response.status };
    }
  } catch (error) {
    return {
      url,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate search queries for research
 */
function generateSearchQueries(entry: Entry): string[] {
  const queries: string[] = [];
  const name = entry.name;
  const creator = entry.data.creator as string | undefined;

  // Primary search: product name + creator
  if (creator) {
    queries.push(`"${name}" ${creator}`);
  } else {
    queries.push(`"${name}" LED`);
  }

  // Pricing search
  queries.push(`"${name}" buy price 2026`);

  // Availability search
  queries.push(`"${name}" discontinued OR "end of life" OR "no longer available"`);

  // Category-specific searches
  if (['pixels', 'pixel-ics', 'controllers'].includes(entry.category)) {
    queries.push(`"${name}" datasheet specifications`);
  }

  if (['pattern-drivers', 'drive-libraries'].includes(entry.category)) {
    queries.push(`"${name}" download github`);
  }

  return queries;
}

/**
 * Generate the review report
 */
function generateReport(context: ReviewContext): string {
  const { entry, neighbors, urlStatuses, searchQueries } = context;

  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push(`AGENT REVIEW: ${entry.name}`);
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Category: ${entry.category}`);
  lines.push(`Entry ID: ${entry.id}`);
  lines.push(`File: ${entry.filePath}`);
  lines.push(
    `Last Updated: ${entry.updated ? entry.updated.toISOString().split('T')[0] : 'Never'}`
  );
  lines.push(`Review Date: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');

  // Current YAML
  lines.push('-'.repeat(40));
  lines.push('CURRENT ENTRY DATA');
  lines.push('-'.repeat(40));
  for (const [key, value] of Object.entries(entry.data)) {
    if (typeof value === 'object') {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push('');

  // URL Status
  if (urlStatuses.length > 0) {
    lines.push('-'.repeat(40));
    lines.push('URL STATUS');
    lines.push('-'.repeat(40));
    for (const urlStatus of urlStatuses) {
      const icon =
        urlStatus.status === 'live'
          ? '[OK]'
          : urlStatus.status === 'redirect'
            ? '[REDIRECT]'
            : urlStatus.status === 'dead'
              ? '[DEAD]'
              : '[ERROR]';
      lines.push(`${icon} ${urlStatus.url}`);
      if (urlStatus.redirectUrl) {
        lines.push(`     -> ${urlStatus.redirectUrl}`);
      }
      if (urlStatus.error) {
        lines.push(`     Error: ${urlStatus.error}`);
      }
    }
    lines.push('');
  }

  // Neighbor Analysis
  lines.push('-'.repeat(40));
  lines.push('CATEGORY PATTERNS');
  lines.push('-'.repeat(40));
  lines.push(`Total entries in ${entry.category}: ${neighbors.totalEntries}`);
  lines.push('');

  lines.push('Common fields in this category:');
  const sortedFields = Object.entries(neighbors.fieldFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  for (const [field, pct] of sortedFields) {
    const hasField = field in entry.data;
    lines.push(`  ${hasField ? '[x]' : '[ ]'} ${field}: ${pct}%`);
  }
  lines.push('');

  if (neighbors.missingFields.length > 0) {
    lines.push('Missing common fields (>50% of entries have these):');
    for (const field of neighbors.missingFields) {
      lines.push(`  - ${field}`);
    }
    lines.push('');
  }

  if (neighbors.statusValues.length > 0) {
    lines.push(`Status values used: ${neighbors.statusValues.join(', ')}`);
  }
  lines.push('');

  // Similar entries for reference
  lines.push('Similar entries for reference:');
  for (const neighbor of neighbors.neighbors.slice(0, 5)) {
    const status = neighbor.data.status ? ` [${neighbor.data.status}]` : '';
    lines.push(`  - ${neighbor.name}${status}`);
  }
  lines.push('');

  // Search queries for Claude
  lines.push('-'.repeat(40));
  lines.push('RESEARCH QUERIES');
  lines.push('-'.repeat(40));
  lines.push('Use these queries to research this product:');
  for (const query of searchQueries) {
    lines.push(`  - ${query}`);
  }
  lines.push('');

  // Instructions for Claude
  lines.push('-'.repeat(40));
  lines.push('REVIEW INSTRUCTIONS');
  lines.push('-'.repeat(40));
  lines.push('Please research this entry and:');
  lines.push('1. Verify URLs are current (update if redirected, remove if dead)');
  lines.push('2. Check if product is still available or discontinued');
  lines.push('3. Update pricing if significantly changed');
  lines.push('4. Add missing common fields if information is available');
  lines.push('5. Correct any factual errors found');
  lines.push('');
  lines.push('Confidence levels for auto-commit:');
  lines.push('  HIGH: Dead URL removal, confirmed discontinuation');
  lines.push('  MEDIUM: Price updates, new field additions');
  lines.push('  LOW: Major content changes, unverified info');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main function
 */
async function main() {
  console.clear();
  log('bright', '');
  log('bright', '  +---------------------------------------------------------+');
  log('bright', '  |           Agent Review - Database Entry Checker         |');
  log('bright', '  +---------------------------------------------------------+');
  log('bright', '');

  // Parse arguments
  const args = process.argv.slice(2);
  let category: string | undefined;
  let entryId: string | undefined;

  if (args[0]) {
    if (args[0].includes('/')) {
      [category, entryId] = args[0].split('/');
    } else if (CATEGORY_IDS.includes(args[0])) {
      category = args[0];
    } else {
      log('red', `Unknown category: ${args[0]}`);
      log('dim', `Available: ${CATEGORY_IDS.join(', ')}`);
      process.exit(1);
    }
  }

  // Load entries
  log('cyan', '  Loading database entries...');
  const entries = loadAllEntries();
  log('green', `  Found ${entries.length} entries across ${CATEGORY_IDS.length} categories`);
  log('dim', '');

  // Select entry
  const entry = selectEntry(entries, { category, entryId });
  if (!entry) {
    process.exit(1);
  }

  log('magenta', `  Selected: ${entry.category}/${entry.id}`);
  log('dim', `  Name: ${entry.name}`);
  log(
    'dim',
    `  Last updated: ${entry.updated ? entry.updated.toISOString().split('T')[0] : 'Never'}`
  );
  log('dim', `  URLs: ${entry.urls.length} found`);
  log('dim', '');

  // Analyze neighbors
  log('cyan', '  Analyzing category patterns...');
  const neighbors = analyzeNeighbors(entry, entries);
  log('green', `  Found ${neighbors.neighbors.length} similar entries`);
  if (neighbors.missingFields.length > 0) {
    log('yellow', `  Missing common fields: ${neighbors.missingFields.join(', ')}`);
  }
  log('dim', '');

  // Check URL health
  const urlStatuses: UrlStatus[] = [];
  if (entry.urls.length > 0) {
    log('cyan', '  Checking URL health...');
    for (const url of entry.urls) {
      const status = await checkUrlHealth(url);
      urlStatuses.push(status);
      const icon =
        status.status === 'live'
          ? colors.green + '[OK]'
          : status.status === 'redirect'
            ? colors.yellow + '[REDIRECT]'
            : colors.red + '[' + status.status.toUpperCase() + ']';
      console.log(
        `  ${icon}${colors.reset} ${url.substring(0, 50)}${url.length > 50 ? '...' : ''}`
      );
    }
    log('dim', '');
  }

  // Generate search queries
  const searchQueries = generateSearchQueries(entry);

  // Ensure issues directory exists
  if (!existsSync(ISSUES_PATH)) {
    mkdirSync(ISSUES_PATH, { recursive: true });
  }

  // Generate and save report
  const reportPath = resolve(ISSUES_PATH, `${entry.id}-review.txt`);
  const context: ReviewContext = {
    entry,
    neighbors,
    urlStatuses,
    searchQueries,
    reportPath,
  };

  const report = generateReport(context);

  // Save to file
  writeFileSync(reportPath, report);
  log('green', `  Report saved: ${reportPath}`);
  log('dim', '');

  // Print report to console
  log('bright', '  ' + '='.repeat(58));
  console.log(report);

  // Print next steps
  log('bright', '');
  log('bright', '  +---------------------------------------------------------+');
  log('bright', '  |                      NEXT STEPS                         |');
  log('bright', '  +---------------------------------------------------------+');
  log('cyan', '');
  log('cyan', '  Use the search queries above with WebSearch to research');
  log('cyan', '  this entry, then update the YAML file as needed.');
  log('dim', '');
  log('dim', `  Entry file: ${entry.filePath}`);
  log('dim', `  Report file: ${reportPath}`);
  log('dim', '');
}

main().catch(console.error);
