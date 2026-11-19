#!/usr/bin/env bun
/**
 * Mirror datasheet PDFs to Cloudflare R2.
 *
 * Scans database YAML for entries with `datasheet.url` that have no
 * `datasheet.mirror` yet (or whose mirror was fetched from a different URL),
 * downloads the PDF, uploads it to R2, and writes a `datasheet.mirror` block
 * (url, sha256, retrieved, source[, fetched_from]) into the YAML under the
 * datasheet block.
 *
 * Contributors only ever add `datasheet.url` in a normal PR; CI runs this after
 * merge and opens a bot PR with the mirror references for review.
 *
 *   bun run mirror-datasheets              # fetch + upload + rewrite YAML
 *   bun run mirror-datasheets --dry-run    # list what would be mirrored
 *   bun run mirror-datasheets --check      # download + PDF-check every datasheet, no upload/writes
 *   bun run mirror-datasheets --only pixels        # one category (or pixels/apa102 for one entry)
 *   bun run mirror-datasheets --limit 5    # only process the first 5
 *
 * When `datasheet.url` fails (bot-blocked, dead, HTML interstitial), the
 * entry's `datasheet.sources` are tried in order; the copy that worked is
 * recorded as `mirror.fetched_from`. `mirror.source` always records
 * `datasheet.url`, so changing the URL re-mirrors.
 *
 * Storage stays bounded and visible:
 * - Keys are content-addressed, so an object already in the bucket is never
 *   uploaded twice.
 * - Before each upload, the bytes under `datasheets/` are checked against
 *   MIRROR_BUDGET_MB. Once the budget would be exceeded, the remaining entries
 *   are skipped with a warning.
 * - Every run reports what the bucket holds. That includes objects no entry
 *   references any more, such as old versions after a datasheet URL changed.
 *   The report goes to the log, the bot PR body and the Actions job summary.
 *
 * Required env (not needed for --dry-run / --check):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   R2_PUBLIC_BASE_URL  e.g. https://assets.awesomeled.xyz
 * Optional:
 *   MIRROR_BUDGET_MB    cap on bytes under datasheets/ (default 1024)
 *   R2_ENDPOINT         override the S3 endpoint (tests / other S3 hosts)
 *   MIRROR_SUMMARY_FILE Markdown summary for the bot PR body
 *   GITHUB_STEP_SUMMARY set by Actions; the storage report is appended to it
 */

import { spawnSync } from 'child_process';
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { parse } from 'yaml';
import { createHash } from 'crypto';
import { S3Client } from 'bun';

const DB_DIR = 'database';
const KEY_PREFIX = 'datasheets';
const MAX_BYTES = 50 * 1024 * 1024; // refuse anything over 50 MB
const DEFAULT_BUDGET_MB = 1024;
const MB = 1024 * 1024;
const USER_AGENT = 'awesomeledlist-datasheet-mirror/1.0 (+https://list.awesomeled.xyz)';

export interface Candidate {
  file: string;
  category: string;
  id: string;
  url: string;
  /** Alternate hosts from datasheet.sources, tried in order when `url` fails */
  fallbacks: string[];
  mirrored: boolean;
}

export interface Mirror {
  url: string;
  sha256: string;
  retrieved: string;
  source: string;
  fetched_from?: string;
}

/** Every entry with a datasheet.url (`all`), or only those needing a (re)mirror. */
export function findCandidates(dbDir = DB_DIR, all = false): Candidate[] {
  const out: Candidate[] = [];
  for (const folder of readdirSync(dbDir).sort()) {
    if (folder.startsWith('_')) continue;
    const folderPath = join(dbDir, folder);
    if (!statSync(folderPath).isDirectory()) continue;
    for (const file of readdirSync(folderPath).sort()) {
      if (!file.endsWith('.yaml') || file.startsWith('_')) continue;
      const path = join(folderPath, file);
      const data = parse(readFileSync(path, 'utf-8'));
      const ds = data?.datasheet;
      if (!ds || typeof ds !== 'object' || typeof ds.url !== 'string' || !ds.url) continue;
      const mirrored = ds.mirror?.source === ds.url;
      if (mirrored && !all) continue;
      const fallbacks = Array.isArray(ds.sources)
        ? ds.sources
            .map((s: { url?: unknown }) => s?.url)
            .filter((u: unknown): u is string => typeof u === 'string' && u !== ds.url)
        : [];
      out.push({
        file: path,
        category: folder,
        id: file.replace(/\.yaml$/, ''),
        url: ds.url,
        fallbacks,
        mirrored,
      });
    }
  }
  return out;
}

/** Bucket keys that some entry's `datasheet.mirror.url` points at. */
export function referencedKeys(publicBase: string, dbDir = DB_DIR): Set<string> {
  const prefix = `${publicBase}/`;
  const keys = new Set<string>();
  for (const folder of readdirSync(dbDir)) {
    if (folder.startsWith('_') || !statSync(join(dbDir, folder)).isDirectory()) continue;
    for (const file of readdirSync(join(dbDir, folder))) {
      if (!file.endsWith('.yaml') || file.startsWith('_')) continue;
      const url = parse(readFileSync(join(dbDir, folder, file), 'utf-8'))?.datasheet?.mirror?.url;
      if (typeof url === 'string' && url.startsWith(prefix)) keys.add(url.slice(prefix.length));
    }
  }
  return keys;
}

/** Every object under `datasheets/`, key → size in bytes. */
async function listObjects(s3: S3Client): Promise<Map<string, number>> {
  const objects = new Map<string, number>();
  let continuationToken: string | undefined;
  do {
    const page = await s3.list({ prefix: `${KEY_PREFIX}/`, continuationToken });
    for (const o of page.contents ?? []) objects.set(o.key, o.size ?? 0);
    continuationToken = page.isTruncated ? page.nextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

const mb = (bytes: number) => (bytes / MB).toFixed(1);

/** One Markdown line on what the bucket holds against the budget. */
export function storageReport(
  objects: Map<string, number>,
  referenced: Set<string>,
  budgetBytes: number
): string {
  let total = 0;
  let unrefCount = 0;
  let unrefBytes = 0;
  for (const [key, size] of objects) {
    total += size;
    if (!referenced.has(key)) {
      unrefCount++;
      unrefBytes += size;
    }
  }
  const pct = budgetBytes > 0 ? Math.round((total / budgetBytes) * 100) : 100;
  const unref = unrefCount
    ? ` ${unrefCount} of them (${mb(unrefBytes)} MB) are no longer referenced by any entry.`
    : '';
  return `**Storage:** ${objects.size} PDFs, ${mb(total)} MB of the ${mb(budgetBytes)} MB budget (${pct}%).${unref}`;
}

function budgetBytes(): number {
  const raw = process.env.MIRROR_BUDGET_MB;
  const n = raw ? Number(raw) : DEFAULT_BUDGET_MB;
  if (!Number.isFinite(n) || n < 0) {
    console.error(`MIRROR_BUDGET_MB must be a non-negative number, got ${JSON.stringify(raw)}`);
    process.exit(1);
  }
  return n * MB;
}

function makeS3(): { s3: S3Client; publicBase: string } {
  const need = (name: string): string => {
    const v = process.env[name];
    if (!v) {
      console.error(`Missing required env var ${name}`);
      process.exit(1);
    }
    return v;
  };
  const accountId = need('R2_ACCOUNT_ID');
  const s3 = new S3Client({
    endpoint: process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`,
    bucket: need('R2_BUCKET'),
    accessKeyId: need('R2_ACCESS_KEY_ID'),
    secretAccessKey: need('R2_SECRET_ACCESS_KEY'),
  });
  return { s3, publicBase: need('R2_PUBLIC_BASE_URL').replace(/\/$/, '') };
}

type Fetched = { ok: true; bytes: Uint8Array } | { ok: false; reason: string };

function checkPdf(bytes: Uint8Array): Fetched {
  if (bytes.byteLength > MAX_BYTES)
    return { ok: false, reason: `too large (${bytes.byteLength} bytes)` };
  // PDF magic number - vendor sites love serving HTML interstitials
  const head = new TextDecoder().decode(bytes.slice(0, 5));
  if (head !== '%PDF-')
    return { ok: false, reason: `not a PDF (starts with ${JSON.stringify(head)})` };
  return { ok: true, bytes };
}

/**
 * curl fallback for transport-level failures. Bun's fetch on Windows fails the
 * TLS handshake with some servers (e.g. pololu.com, EPROTO) that curl and Node
 * handle fine; curl ships with Windows 10+ and every CI runner.
 */
function downloadWithCurl(url: string): Fetched {
  const dir = mkdtempSync(join(tmpdir(), 'ds-'));
  const out = join(dir, 'file');
  const headers = join(dir, 'headers');
  try {
    const r = spawnSync(
      'curl',
      [
        '-sSL',
        '--max-time',
        '60',
        '--max-filesize',
        String(MAX_BYTES),
        '-A',
        USER_AGENT,
        '-o',
        out,
        // Status from the dumped headers, not `-w %{http_code}`: Git for
        // Windows' bundled curl 8.8 exits 43 whenever -w is used.
        '-D',
        headers,
        url,
      ],
      { encoding: 'utf-8' }
    );
    if (r.error) return { ok: false, reason: `curl unavailable: ${r.error.message}` };
    if (r.status !== 0)
      return { ok: false, reason: `curl: ${r.stderr.trim() || `exit ${r.status}`}` };
    // With -L every hop's headers are dumped; the last status line is the final one.
    const statuses = [...readFileSync(headers, 'utf-8').matchAll(/^HTTP\/[\d.]+ (\d{3})/gm)];
    const status = Number(statuses.at(-1)?.[1] ?? 0);
    if (status < 200 || status >= 300) return { ok: false, reason: `HTTP ${status}` };
    return checkPdf(new Uint8Array(readFileSync(out)));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function download(url: string): Promise<Fetched> {
  let res: Response;
  try {
    res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/pdf,*/*;q=0.8' },
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return downloadWithCurl(url);
  }
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
  return checkPdf(new Uint8Array(await res.arrayBuffer()));
}

/** Try datasheet.url, then each alternate source. */
async function fetchCandidate(
  c: Candidate
): Promise<{ bytes: Uint8Array; from: string } | { failures: string[] }> {
  const failures: string[] = [];
  for (const url of [c.url, ...c.fallbacks]) {
    const r = await download(url);
    if (r.ok) return { bytes: r.bytes, from: url };
    failures.push(`${url}: ${r.reason}`);
  }
  return { failures };
}

/**
 * Insert (or replace) the `mirror:` block under the root `datasheet:` block of
 * an entry's YAML text, preserving everything else byte for byte.
 */
export function insertMirrorBlock(text: string, mirror: Mirror): string {
  const block = [
    '  mirror:',
    `    url: ${mirror.url}`,
    `    sha256: ${mirror.sha256}`,
    `    retrieved: '${mirror.retrieved}'`,
    `    source: ${mirror.source}`,
    ...(mirror.fetched_from ? [`    fetched_from: ${mirror.fetched_from}`] : []),
  ];

  const lines = text.split('\n');
  const dsIdx = lines.findIndex((l) => /^datasheet:\s*(#.*)?\r?$/.test(l));
  if (dsIdx < 0) throw new Error('no block-style root `datasheet:` key');

  // Bound the datasheet block (until the next root-level key) and find its children
  let end = dsIdx + 1;
  while (end < lines.length && (/^\s*\r?$/.test(lines[end]!) || /^\s/.test(lines[end]!))) end++;
  let urlIdx = -1;
  let mirrorIdx = -1;
  for (let i = dsIdx + 1; i < end; i++) {
    if (/^ {2}url:/.test(lines[i]!)) urlIdx = i;
    if (/^ {2}mirror:/.test(lines[i]!)) mirrorIdx = i;
  }

  if (mirrorIdx >= 0) {
    // Replace existing mirror block (key line + its deeper-indented children)
    let mEnd = mirrorIdx + 1;
    while (mEnd < end && /^ {4}/.test(lines[mEnd]!)) mEnd++;
    lines.splice(mirrorIdx, mEnd - mirrorIdx, ...block);
  } else {
    // Right after `url:` (and any continuation lines of a long URL)
    let at = urlIdx >= 0 ? urlIdx + 1 : dsIdx + 1;
    while (urlIdx >= 0 && at < end && /^ {4}/.test(lines[at]!)) at++;
    lines.splice(at, 0, ...block);
  }
  return lines.join('\n');
}

function parseArgs(argv: string[]) {
  const val = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    dryRun: argv.includes('--dry-run'),
    check: argv.includes('--check'),
    only: val('--only'),
    limit: val('--limit') ? Number(val('--limit')) : Infinity,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const matchesOnly = (c: Candidate) =>
    !opts.only || opts.only === c.category || opts.only === `${c.category}/${c.id}`;
  const candidates = findCandidates(DB_DIR, opts.check).filter(matchesOnly).slice(0, opts.limit);

  if (opts.check) {
    let bad = 0;
    let total = 0;
    console.log(`Checking ${candidates.length} datasheet URL(s)…`);
    for (const c of candidates) {
      const r = await fetchCandidate(c);
      if ('bytes' in r) {
        total += r.bytes.byteLength;
        const kb = (r.bytes.byteLength / 1024).toFixed(0);
        const via = r.from === c.url ? '' : ` (via fallback ${r.from})`;
        console.log(`  ok   ${c.category}/${c.id} ${kb} KB${via}`);
      } else {
        bad++;
        console.log(`  FAIL ${c.category}/${c.id}`);
        for (const f of r.failures) console.log(`         ${f}`);
      }
    }
    // The bucket would hold about this much if every datasheet were mirrored once.
    console.log(`\n${candidates.length - bad} ok, ${bad} failing; ${mb(total)} MB in total`);
    return;
  }

  console.log(`${candidates.length} datasheet(s) to mirror${opts.dryRun ? ' (dry run)' : ''}`);
  if (opts.dryRun) {
    for (const c of candidates) console.log(`- ${c.category}/${c.id}: ${c.url}`);
    return;
  }

  const ctx = makeS3();
  const budget = budgetBytes();
  const objects = await listObjects(ctx.s3);
  let used = [...objects.values()].reduce((a, b) => a + b, 0);
  const summary: string[] = [];
  let failures = 0;
  let overBudget = 0;

  for (const c of candidates) {
    console.log(`- ${c.category}/${c.id}: ${c.url}`);
    const r = await fetchCandidate(c);
    if (!('bytes' in r)) {
      failures++;
      for (const f of r.failures) console.warn(`  ${f}`);
      summary.push(`- :warning: \`${c.category}/${c.id}\` failed: ${r.failures.join('; ')}`);
      continue;
    }

    const sha256 = createHash('sha256').update(r.bytes).digest('hex');
    const key = `${KEY_PREFIX}/${c.category}/${c.id}-${sha256.slice(0, 8)}.pdf`;
    if (objects.has(key)) {
      console.log('  already in the bucket');
    } else if (used + r.bytes.byteLength > budget) {
      overBudget++;
      console.warn(`  skipped: would take the bucket past its ${mb(budget)} MB budget`);
      summary.push(
        `- :warning: \`${c.category}/${c.id}\` skipped: the bucket is at its ${mb(budget)} MB budget`
      );
      continue;
    } else {
      await ctx.s3.write(key, r.bytes, { type: 'application/pdf' });
      objects.set(key, r.bytes.byteLength);
      used += r.bytes.byteLength;
    }

    const mirror: Mirror = {
      url: `${ctx.publicBase}/${key}`,
      sha256,
      retrieved: new Date().toISOString().slice(0, 10),
      source: c.url,
      ...(r.from !== c.url ? { fetched_from: r.from } : {}),
    };
    try {
      writeFileSync(c.file, insertMirrorBlock(readFileSync(c.file, 'utf-8'), mirror));
    } catch (err) {
      failures++;
      console.warn(`  uploaded, but could not write YAML: ${(err as Error).message}`);
      summary.push(
        `- :warning: \`${c.category}/${c.id}\` uploaded to \`${key}\` but YAML not updated`
      );
      continue;
    }
    console.log(`  -> ${mirror.url}${mirror.fetched_from ? ` (from ${mirror.fetched_from})` : ''}`);
    summary.push(
      `- \`${c.category}/${c.id}\` (${(r.bytes.byteLength / 1024).toFixed(0)} KB) <- ${r.from}`
    );
  }

  const report = storageReport(objects, referencedKeys(ctx.publicBase), budget);
  console.log(`\n${report.replace(/\*\*/g, '')}`);
  if (process.env.MIRROR_SUMMARY_FILE && summary.length) {
    appendFileSync(process.env.MIRROR_SUMMARY_FILE, [...summary, '', report].join('\n') + '\n');
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
  }
  if (overBudget || used > budget * 0.8) {
    // An Actions annotation, so a nearly full bucket is visible on the run page.
    console.log(
      `::warning::Datasheet mirror at ${mb(used)} of ${mb(budget)} MB` +
        (overBudget ? `; ${overBudget} datasheet(s) skipped` : '') +
        '. Raise MIRROR_BUDGET_MB or clean up unreferenced objects.'
    );
  }
  if (failures) console.warn(`\n${failures} datasheet(s) failed; their YAML was left untouched.`);
}

if (import.meta.main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
