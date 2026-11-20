import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';
import type { BaseEntry, Category } from './types';
import { CATEGORIES } from './types';
import { parseQuantity } from './quantity';
import { buildRelationGraph, type RelationGraph } from './relations';

// Cache for git timestamps (file path -> Date)
let gitTimestampCache: Map<string, Date> | null = null;

// Parsed category data. Production builds cache it for good: prerendering
// reads every category for each entry page's links, which would otherwise
// re-read all YAML hundreds of times. Dev trusts it for 2 seconds, so the many
// reads within one request share a parse, then checks the folder's files
// (names, sizes, modified times) and parses again only if one changed. YAML
// edits still show up on refresh (the review-entry.ts workflow depends on
// that), without re-parsing the whole database every couple of seconds: that
// parse takes longer than the 2 seconds on a busy machine, so every request
// used to pay for it.
const categoryDataCache = new Map<
  string,
  { at: number; signature: string; entries: BaseEntry[] }
>();
const DEV_CACHE_MS = 2000;
const isFresh = (at: number) =>
  process.env.NODE_ENV === 'production' || Date.now() - at < DEV_CACHE_MS;
// Counts every parse of a category, so the relation graph knows when the
// entries it was built from have been replaced
let dataVersion = 0;

/** What a folder's YAML files look like from outside: changes when any is edited, added or removed. */
function folderSignature(dir: string, files: string[]): string {
  return files
    .map((file) => {
      const { mtimeMs, size } = statSync(resolve(dir, file));
      return `${file}:${mtimeMs}:${size}`;
    })
    .join('|');
}

// Commits to ignore when calculating timestamps (e.g., bulk metadata changes)
export const IGNORED_COMMITS = new Set([
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
  // Database review & standardization (plans/database-review.md): schema
  // re-encodings via scripts/migrations/, no facts re-checked
  '0bb334628be9cf26df3824c235c8d8612730996c', // physical.packages standardization (64)
  '64a0d0908b7b554c4b0f26dd530caff189e029df', // pixel-decoders structured outputs (12)
  '2c469a1a615992642492bca92a1b015ecdf3d6a2', // diffusive-materials typed fields (45)
  'a000cd191ccf4077410dd556070f58d2b2ab032b', // URLs the terminology lint had rewritten (3)
  '3b9da1ae9940b220a03c622d1bdf074d2454de3d', // adapters shared output/power shapes (40)
  'df38d673dd54f288b2a62300dc855a2e9548bd92', // controllers/adapters input vocabulary (~60)
  '795a04fe41886738781c6b62d0e048cdb4aa74c0', // connectors typed ratings, pitch, gauges (45)
  '475d1d0f23032e36c868b267fac4464d744c7d67', // microboards typed memory and connectivity (36)
  'e215cd7833a0ce2ba29ef9c927978f8b60efb7bf', // pattern-driver I/O tags, visualizer, language (46)
  '22607e1b60712e2214701c63fd4f3865972c1bce', // commercial-system / level-converter typed fields (16)
  '6eeac08bda881e1facc06c92472e4d89a812d9a5', // quantities without trailing zeros (68)
  'da15001b698688ad5b751fc573d6d71b948b640d', // pixel / pixel-IC color-depth vocabulary (52)
  '6a19578e216915d8ffa6223f9c1e2ff01e393016', // later entries moved to the new shapes (5)
  '6bae201244d9db8651c41eb4fe6ad1da29f73d14', // shared creator/manufacturers/vendors (1)
  '80b4911db8c56f17ff0502ad3fb3dd7b9dbb6559', // OLA's protocol list in the library vocabulary (1)
  '6db9e30248ced5d1e8a60a0b7679298b48ba39fa', // NS pixel ICs in the color-depth vocabulary (3)
  '63d7e3463bf759f9857e693e012ca2373ec97f28', // Pi 3 Model B duplicate merged, links repointed (4)
  'd1d23db4a29db1e5f4669b32bd354929367ae368', // mains-powered controllers: power.ac, output_voltage (6)
  '8c69b346b930ebfa3231eca917bdbe27eda63c47', // drive libraries' websites moved to links.url (9)
  // Pure formatting passes (prettier/lint only, no content change)
  '35c9c5310c8b6c0624a86b69ce52e67785ad2dba', // Prettier and lint free (42)
  'd9edd7574e197624c721c543e49d418ee3225f06', // Fix prettier formatting (39)
  '6f10b8f005514c02411b80e5b8d4c20a4f463260', // YAML key-order normalization (376)
  'a1cd65f60bc252584b158bfaaa744255d7180cca', // strip derived pixel_rate_max, integer pixel_size_bits (41)
  // The column means "last REVIEWED for accuracy". These batches touched rows
  // without reviewing their data (link checks, restructures, note-derived
  // enrichment), so they don't count:
  '52a377dd6218701696e55330b6d121efa368f134', // dead_links batch annotation, first sweep (30)
  'aa2e5cf13526f4e200edfcf45b58ae1eb53bacae', // dead_links batch annotation, CHECK-list triage (18)
  'aa7bf76ae139b6922ddd7e6746570cc108a9a832', // pattern-driver platforms restructure (39)
  '5218cd812e5ef10cb48c601dcc4ab71063b2d6a6', // dual-band Wi-Fi strings -> arrays (5)
  '5a1dd7a4cd6d2045e0c70bb04a3fec801fe4b569', // wattage export-artifact cleanup (10)
  'efdf32cc85642852066153fd38725dac60975674', // combined-connector max_current canonicalization (2)
  'b9ce0139132af8d24deab4126a92823981c3936d', // WS281x family cross-links (6)
  '3feb8e0cd763d812f100522eccad4ef1b0b640e8', // SK68xx family cross-links (3)
  'ef8ce927247f0cc8ad299f031d034565b89d8159', // APA/HD/SK98xx family cross-links (11)
  'fea0bcd468e4c9bfe3865bcd87ccdfd4d8422879', // same-part links across pixel-ics <-> pixels (3)
  'cf992c8026008958e62656dd09ab1367e8cb3fa2', // PixLite family cross-links (9)
  'c0c03c3fbf8bd2cec12c9a13a72edbecf0d64f18', // Falcon/K8 family cross-links (3)
  'bd300fda7dd59fd0eb082fa6d3919bcbd76f68b8', // outputs.connector string -> ref migration (81)
  '481e6aad540b7ef19170a6aa5f58d5479ee7fd13', // online_pricing -> pricing.examples restructure (6)
  '2c7bf116f257fdb787dadcc2ce956769d1c0850e', // prose-only facts -> structured fields (46)
  '937d73473061d5c8503d68da7d67fe1abd3b4979', // SPI -> clocked/single-wire wording normalization (15)
  'd26e73ca66c720ed6dc7efafcb09f5788b00f173', // sheet-parity: restore hyperlinks the sheet import dropped (117)
  'b1c26ecaec5aad615383c97334f20d5cd511dc40', // sheet-parity: restore sheet cell notes the import dropped (59)
  '66342a416add1a219a50abb707e75137733129a7', // sheet-parity: restore sheet values the import rounded or migrations dropped (46)
  '919d9dadf64eecaf86c02013808bd17191083bd9', // sheet-parity: restore controller pixel totals the migration dropped (19)
  'f92675844c3c7a32b799dea0760bf620ea53ff89', // sheet-parity: restore more sheet values the import lost (28)
  'd5f86cd5f5e66092311965397ae2384c8dfd3be5', // price comments -> price_source (40)
  '3575aabbe87ca8955e2bded24b3925721644aae6', // data-freshness: Microcyb link live again (1)
  '51b4e0768f715e8fb90f611fdc01aa1e9849374c', // data-freshness: diffusive-material link fixes (3)
  '6106eeb4e1c050d83afdd2c84def90588787a330', // data-freshness: controllers f–k dead-link re-checks (2)
  'bd81611df795e78f9d473c35d46a695af670030a', // data-freshness: EMP link live again (1)
  'd860c62d8cd13d86c0a6190139b1d4e6fcc32515', // data-freshness: Jinx / LEDs Master links (2)
  'c1ff0a0bf27b587a8d69ad42fe7d59dcdc49f269', // data-freshness: pixel dead-link re-checks (4)
  '23323c6ba53fb7aaaf416a5cf4ca6f34d1b7c918', // data-freshness: UCS8903 dead-link re-check (1)
  'd673e019502956d3a3922afe711163fd62ba4fef', // data-freshness: connector link fixes (4)
  '5ec2efe3bf57ceb9083ca41084cf6818234ca844', // data-freshness: PB16 link (1)
  '5715fc89d2165dfa8af8b20f63a5a4ba94cf7af7', // data-freshness: adapter link fixes (2)
  'aa3c3935ca3ad0b81b0b511ee900c32d7f2447da', // data-freshness: microboard link fixes (2)
  '1ae1a4d59a148a5d1ac41f9430afb679a97fbc9f', // retire legacy related_* arrays (16)
  'a1f669e1491de8d6891bb95208172739638cd221', // data-freshness: commercial item pixels -> field (17)
  '2547ac35f618d4ddd7eae8166945047748cec2b8', // data-freshness: EspArtStick/Lightwalls links (2)
  '193f50df5a792fef720824377dae122ef9a073f8', // data-freshness: K16000S Amazon link (1)
  '0c6abd22bfcb554bf555f021fc5e832d806637c1', // data-freshness: PiCap/SceneX evidence pages archived (2)
  '5f4241dce8033437c6b06b7ca9fb82faacffccf9', // data-freshness: NS108E ref re-pointed for the NS108 merge (1)
]);

/**
 * Get git last-modified timestamps for all database YAML files in a single batch call.
 * Results are cached for the lifetime of the process.
 */
/**
 * Newest reviewing commit per database file, from `git log --name-status -M`
 * output (newest first). A rename carries the file's history to its new path:
 * commits older than the rename count for the renamed file, while a file
 * added later at the old path starts fresh. Ignored and `Not-A-Review:`
 * commits don't count, but the renames they make still apply.
 */
export function lastReviewTimes(log: string, ignored: Set<string>): Map<string, string> {
  const times = new Map<string, string>();
  // old path -> the path whose history it now is
  const movedTo = new Map<string, string>();
  const current = (path: string) => movedTo.get(path) ?? path;
  let timestamp: string | null = null;
  let skip = false;

  for (const line of log.split('\n')) {
    if (!line) continue;
    // Commit hash + ISO timestamp (+ Not-A-Review trailer value, usually empty)
    const commit = line.match(/^([a-f0-9]{40}) (\d{4}-\d{2}-\d{2}T\S+) ?(.*)$/);
    if (commit) {
      timestamp = commit[2];
      skip = commit[3].trim() !== '' || ignored.has(commit[1]);
      continue;
    }
    const [status, ...paths] = line.split('\t');
    if (!timestamp || !paths.length) continue;
    const path = current(paths[paths.length - 1]);
    // Older commits on the old path belong to the renamed file
    if (status.startsWith('R') && paths.length === 2) movedTo.set(paths[0], path);
    if (skip || !path.endsWith('.yaml')) continue;
    // Newest first, so the first time a path appears is its latest review
    if (!times.has(path)) times.set(path, timestamp);
  }
  return times;
}

export function getGitTimestamps(): Map<string, Date> {
  if (gitTimestampCache) {
    return gitTimestampCache;
  }

  gitTimestampCache = new Map();
  const repoRoot = resolve(getDatabasePath(), '..');

  try {
    // A `Not-A-Review: <reason>` commit trailer works like IGNORED_COMMITS for
    // commits whose hash isn't known in advance (CI bots, e.g. the datasheet
    // mirror's PR, which may be rebased or squashed on merge).
    const output = execFileSync(
      'git',
      [
        'log',
        '--format=%H %aI %(trailers:key=Not-A-Review,valueonly,separator=%x2C)',
        '--name-status',
        '-M',
        '--diff-filter=ACMR',
        '--',
        'database/**/*.yaml',
      ],
      {
        encoding: 'utf-8',
        cwd: repoRoot,
        maxBuffer: 10 * 1024 * 1024,
      }
    );

    for (const [path, time] of lastReviewTimes(output, IGNORED_COMMITS)) {
      gitTimestampCache.set(resolve(repoRoot, path), new Date(time));
    }
  } catch (e) {
    console.warn('Failed to get git timestamps:', e);
  }

  return gitTimestampCache;
}

// Get the database directory path
let databasePath: string | null = null;

export function getDatabasePath(): string {
  if (databasePath) return databasePath;
  // The database sits at the project root. This module runs from app/lib in
  // dev, and from wherever the bundler put it in a build: build/server, or
  // build/server/assets as soon as any route uses a dynamic import() and the
  // server bundle is split into chunks. Walk up until the directory appears
  // instead of assuming a fixed depth.
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    const candidate = resolve(dir, 'database');
    if (existsSync(resolve(candidate, '_schema'))) return (databasePath = candidate);
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return (databasePath = resolve(process.cwd(), 'database'));
}

// SPDX ids that make an entry FOSS (drives the derived `foss` flag)
const FOSS_LICENSES = new Set([
  'MIT',
  'Apache-2.0',
  'GPL-2.0',
  'GPL-2.0-or-later',
  'GPL-3.0',
  'AGPL-3.0',
  'LGPL-2.1',
  'LGPL-3.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BSD-3-Clause-Clear',
  'EUPL-1.2',
  'MPL-2.0',
  'Unlicense',
  'Zlib',
]);

/**
 * Fields computed from stored data at load time. The schema rejects stored
 * copies (e.g. data.pixel_rate_max is an additionalProperties error), so the
 * database can never drift out of sync with the inputs.
 */
function deriveFields(categoryId: string, entry: BaseEntry): void {
  if (categoryId === 'pattern-drivers' || categoryId === 'drive-libraries') {
    if (typeof entry.license === 'string') {
      entry.foss = FOSS_LICENSES.has(entry.license);
    }
    return;
  }

  if (categoryId !== 'pixels' && categoryId !== 'pixel-ics') return;
  const data = entry.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return;
  const bits = data.pixel_size_bits;
  const freq = parseQuantity(data.bitrate, 'frequency');
  if (typeof bits === 'number' && bits > 0 && freq) {
    const rate = freq.value / bits;
    data.pixel_rate_max =
      rate >= 1e6 ? `${(rate / 1e6).toFixed(2)} Mpx/s` : `${(rate / 1e3).toFixed(1)} kpx/s`;
  }
}

/**
 * Load all entries for a given category from YAML files, each carrying its
 * derived `linked` compatibility summary (relations.ts LinkedSummary) for
 * table columns and filters.
 */
export function loadCategoryData(categoryId: string): BaseEntry[] {
  const entries = readCategory(categoryId);
  const linked = getRelationGraph().linked;
  for (const e of entries) {
    const summary = linked.get(`${categoryId}/${e.id}`);
    if (summary) e.linked = summary;
    // Entries outlive a rebuilt graph in dev, so a summary that is gone goes
    else delete e.linked;
  }
  return entries;
}

/**
 * A category's entries as its table page ships them: everything but the
 * per-field provenance (`sources`), which only entry pages show and which is
 * a quarter to a half of a researched entry's size. Exports keep it
 * (they use `loadCategoryData`).
 */
export function loadCategoryTableData(categoryId: string): BaseEntry[] {
  return loadCategoryData(categoryId).map(({ sources: _sources, ...entry }) => entry as BaseEntry);
}

/** Parse a category's YAML (plus load-time derived fields), without cross-links */
function readCategory(categoryId: string): BaseEntry[] {
  const cached = categoryDataCache.get(categoryId);
  if (cached && isFresh(cached.at)) return cached.entries;

  const databasePath = getDatabasePath();
  const categoryDir = resolve(databasePath, categoryId);

  if (!existsSync(categoryDir)) {
    console.warn(`Category directory not found: ${categoryDir}`);
    return [];
  }

  const entries: BaseEntry[] = [];
  const files = readdirSync(categoryDir).filter((f) => f.endsWith('.yaml') && !f.startsWith('_'));

  // Nothing on disk changed since the last parse: keep it
  const signature = folderSignature(categoryDir, files);
  if (cached && cached.signature === signature) {
    cached.at = Date.now();
    return cached.entries;
  }

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
        deriveFields(categoryId, parsed);
        entries.push(parsed);
      }
    } catch (e) {
      console.warn(`Failed to parse ${filePath}:`, e);
    }
  }

  // Sort by name
  entries.sort((a, b) => a.name.localeCompare(b.name));
  categoryDataCache.set(categoryId, { at: Date.now(), signature, entries });
  dataVersion++;
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
    deriveFields(categoryId, parsed);
    const summary = getRelationGraph().linked.get(`${categoryId}/${entryId}`);
    if (summary) parsed.linked = summary;
    return parsed;
  } catch (e) {
    console.warn(`Failed to parse ${filePath}:`, e);
    return null;
  }
}

// The cross-category relationship graph (relations.ts), built from every
// category at once, cached like the category data (for good in production
// builds, briefly in dev).
let relationGraphCache: { at: number; version: number; graph: RelationGraph } | null = null;

export function getRelationGraph(): RelationGraph {
  if (relationGraphCache && isFresh(relationGraphCache.at)) return relationGraphCache.graph;
  const db = new Map<string, BaseEntry[]>();
  for (const category of CATEGORIES) db.set(category.id, readCategory(category.id));
  // No category was parsed again, so the graph still describes these entries
  if (relationGraphCache && relationGraphCache.version === dataVersion) {
    relationGraphCache.at = Date.now();
    return relationGraphCache.graph;
  }
  relationGraphCache = { at: Date.now(), version: dataVersion, graph: buildRelationGraph(db) };
  return relationGraphCache.graph;
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
  const routes: string[] = [
    '/',
    '/about',
    '/contribute',
    '/system-overview',
    '/designer',
    '/search',
    '/compare',
  ];

  routes.push('/database.csv.zip', '/database.yaml.zip', '/search-index.json');
  // For search engines and link previews (routes/sitemap.ts, robots.ts, og.*.ts)
  routes.push('/sitemap.xml', '/robots.txt', '/og/site.jpg');

  for (const category of CATEGORIES) {
    // Add category page and its link-preview image
    routes.push(category.path);
    routes.push(`/og/${category.id}.jpg`);

    // Add CSV and JSON exports
    routes.push(`/${category.id}.csv`);
    routes.push(`/${category.id}.json`);

    // Add individual entry pages, each with its link-preview image
    const entries = loadCategoryData(category.id);
    for (const entry of entries) {
      routes.push(`${category.path}/${entry.id}`);
      routes.push(`/og/${category.id}/${entry.id}.jpg`);
    }
  }

  return routes;
}
