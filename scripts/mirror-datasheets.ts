#!/usr/bin/env bun
/**
 * Mirror datasheet PDFs to Cloudflare R2.
 *
 * Scans database YAML for entries with `datasheet.url` that have no
 * `datasheet.mirror` yet (or whose mirror was fetched from a different URL),
 * downloads the PDF, uploads it to R2, and writes a `datasheet.mirror` block
 * (url, sha256, retrieved, source) into the YAML under the datasheet block.
 *
 * Contributors only ever add `datasheet.url` in a normal PR; CI runs this after
 * merge and opens a bot PR with the mirror references for review.
 *
 *   bun run mirror-datasheets            # fetch + upload + rewrite YAML
 *   bun run mirror-datasheets --dry-run  # report what would be mirrored
 *   bun run mirror-datasheets --limit 5  # only process the first 5
 *
 * Required env (skipped in --dry-run):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 *   R2_PUBLIC_BASE_URL  e.g. https://assets.awesomeledlist.com
 */

import { readFileSync, readdirSync, writeFileSync, appendFileSync, statSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { createHash } from 'crypto';
import { S3Client } from 'bun';

const DB_DIR = 'database';
const KEY_PREFIX = 'datasheets';
const MAX_BYTES = 50 * 1024 * 1024; // refuse anything over 50 MB

const dryRun = process.argv.includes('--dry-run');
const limitIdx = process.argv.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : Infinity;

interface Candidate {
  file: string;
  category: string;
  id: string;
  url: string;
}

function findCandidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const folder of readdirSync(DB_DIR)) {
    if (folder.startsWith('_')) continue;
    const folderPath = join(DB_DIR, folder);
    if (!statSync(folderPath).isDirectory()) continue;
    for (const file of readdirSync(folderPath)) {
      if (!file.endsWith('.yaml') || file.startsWith('_')) continue;
      const path = join(folderPath, file);
      const data = parse(readFileSync(path, 'utf-8'));
      const ds = data?.datasheet;
      if (!ds || typeof ds !== 'object' || !ds.url) continue;
      // Already mirrored from this exact URL -> nothing to do
      if (ds.mirror?.source === ds.url) continue;
      out.push({ file: path, category: folder, id: file.replace(/\.yaml$/, ''), url: ds.url });
    }
  }
  return out;
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
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    bucket: need('R2_BUCKET'),
    accessKeyId: need('R2_ACCESS_KEY_ID'),
    secretAccessKey: need('R2_SECRET_ACCESS_KEY'),
  });
  return { s3, publicBase: need('R2_PUBLIC_BASE_URL').replace(/\/$/, '') };
}

async function download(url: string): Promise<Uint8Array | null> {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'awesomeledlist-datasheet-mirror/1.0 (+https://list.awesomeled.xyz)' },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    console.warn(`  HTTP ${res.status}`);
    return null;
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_BYTES) {
    console.warn(`  too large (${bytes.byteLength} bytes)`);
    return null;
  }
  // PDF magic number - vendor sites love serving HTML interstitials
  const head = new TextDecoder().decode(bytes.slice(0, 5));
  if (head !== '%PDF-') {
    console.warn(`  not a PDF (starts with ${JSON.stringify(head)})`);
    return null;
  }
  return bytes;
}

/** Insert a `mirror:` block under the existing `datasheet:` block, preserving formatting. */
function writeMirrorBlock(
  path: string,
  mirror: { url: string; sha256: string; retrieved: string; source: string }
) {
  const block = [
    '  mirror:',
    `    url: ${mirror.url}`,
    `    sha256: ${mirror.sha256}`,
    `    retrieved: "${mirror.retrieved}"`,
    `    source: ${mirror.source}`,
  ].join('\n');

  const lines = readFileSync(path, 'utf-8').split('\n');
  const dsIdx = lines.findIndex((l) => l === 'datasheet:');
  if (dsIdx < 0) return;

  // Bound the datasheet block (until the next top-level key) and locate its url line
  let end = dsIdx + 1;
  while (end < lines.length && (lines[end] === '' || /^\s/.test(lines[end]!))) end++;
  let urlIdx = -1;
  let mirrorIdx = -1;
  for (let i = dsIdx + 1; i < end; i++) {
    if (/^ {2}url:/.test(lines[i]!)) urlIdx = i;
    if (/^ {2}mirror:/.test(lines[i]!)) mirrorIdx = i;
  }

  if (mirrorIdx >= 0) {
    // Replace existing mirror block (key line + its indented children)
    let mEnd = mirrorIdx + 1;
    while (mEnd < end && /^ {4}/.test(lines[mEnd]!)) mEnd++;
    lines.splice(mirrorIdx, mEnd - mirrorIdx, block);
  } else {
    const at = urlIdx >= 0 ? urlIdx + 1 : dsIdx + 1;
    lines.splice(at, 0, block);
  }
  writeFileSync(path, lines.join('\n'));
}

async function main() {
  const candidates = findCandidates().slice(0, limit);
  console.log(`${candidates.length} datasheet(s) to mirror${dryRun ? ' (dry run)' : ''}`);
  if (candidates.length === 0) return;

  const ctx = dryRun ? null : makeS3();
  const summary: string[] = [];
  let failures = 0;

  for (const c of candidates) {
    console.log(`- ${c.category}/${c.id}: ${c.url}`);
    if (dryRun) continue;

    const bytes = await download(c.url).catch((err) => {
      console.warn(`  fetch failed: ${err?.message ?? err}`);
      return null;
    });
    if (!bytes) {
      failures++;
      summary.push(`- :warning: \`${c.category}/${c.id}\` failed: ${c.url}`);
      continue;
    }

    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const key = `${KEY_PREFIX}/${c.category}/${c.id}-${sha256.slice(0, 8)}.pdf`;
    await ctx!.s3.write(key, bytes, { type: 'application/pdf' });

    const mirror = {
      url: `${ctx!.publicBase}/${key}`,
      sha256,
      retrieved: new Date().toISOString().slice(0, 10),
      source: c.url,
    };
    writeMirrorBlock(c.file, mirror);
    console.log(`  -> ${mirror.url}`);
    summary.push(
      `- \`${c.category}/${c.id}\` (${(bytes.byteLength / 1024).toFixed(0)} KB) <- ${c.url}`
    );
  }

  if (process.env.MIRROR_SUMMARY_FILE && summary.length) {
    appendFileSync(process.env.MIRROR_SUMMARY_FILE, summary.join('\n') + '\n');
  }
  if (failures) console.warn(`\n${failures} download(s) failed; their YAML was left untouched.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
