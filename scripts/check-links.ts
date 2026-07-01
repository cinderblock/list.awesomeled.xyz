#!/usr/bin/env bun
/**
 * Link-rot checker for database entries.
 *
 * Collects every http(s) URL in every entry, probes each one, and reports:
 *   - DEAD:    hard evidence (DNS failure, connection refused, HTTP 404/410)
 *   - CHECK:   suspicious but not provably dead (403, 5xx, timeouts — often
 *              just bot-blocking); needs a human look
 *   - ok:      reachable (2xx/3xx and other 4xx)
 *
 * For DEAD urls it also queries the Wayback Machine availability API and
 * prints a ready-to-paste `dead_links` YAML stub (latest capture pre-filled —
 * curate the timestamp if the domain changed hands).
 *
 * URLs already listed in an entry's `dead_links` are skipped.
 *
 *   bun run check-links                  # whole database
 *   bun run check-links controllers     # one category
 *   bun run check-links --dead-only     # only print DEAD findings
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

const DB_DIR = 'database';
const CONCURRENCY = 8;
const TIMEOUT_MS = 15000;
// Some sites 403/close on unknown agents; a browser-ish UA reduces false alarms.
const USER_AGENT =
  'Mozilla/5.0 (compatible; awesomeledlist-linkcheck/1.0; +https://awesomeledlist.com)';

interface Target {
  entry: string; // "<category>/<file>"
  url: string;
}

type Verdict = 'ok' | 'dead' | 'check';

interface Result extends Target {
  verdict: Verdict;
  detail: string;
  archive?: string;
}

// Recursively collect http(s) URLs from an entry, excluding the dead_links
// block itself (those are already known).
function collectUrls(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    const m = value.match(/^https?:\/\/\S+$/);
    if (m) out.add(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectUrls(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectUrls(v, out);
  }
}

async function probe(url: string): Promise<{ verdict: Verdict; detail: string }> {
  const attempt = async (method: 'HEAD' | 'GET') => {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: '*/*' },
    });
    // Drain nothing: for GET we abort the body by just not reading it.
    return res;
  };

  try {
    let res = await attempt('HEAD');
    // Many servers mishandle HEAD; retry with GET before judging.
    if (res.status >= 400) res = await attempt('GET');

    if (res.status === 404 || res.status === 410) {
      return { verdict: 'dead', detail: `HTTP ${res.status}` };
    }
    if (res.ok || (res.status >= 300 && res.status < 400)) {
      return { verdict: 'ok', detail: `HTTP ${res.status}` };
    }
    return { verdict: 'check', detail: `HTTP ${res.status}` };
  } catch (e) {
    const msg =
      e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e);
    // DNS failure / refused connection = the site is gone, not just grumpy.
    if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED|CERT_HAS_EXPIRED|unable to verify/i.test(msg)) {
      return { verdict: 'dead', detail: msg };
    }
    return { verdict: 'check', detail: msg };
  }
}

async function waybackLatest(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    const data = (await res.json()) as {
      archived_snapshots?: { closest?: { available?: boolean; url?: string } };
    };
    const snap = data.archived_snapshots?.closest;
    return snap?.available ? snap.url?.replace(/^http:/, 'https:') : undefined;
  } catch {
    return undefined;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const deadOnly = args.includes('--dead-only');
  const only = args.find((a) => !a.startsWith('--'));

  // Category folders = directories with entry YAML files (skips _schema,
  // LICENSE, issues/ review notes, datasheets/, …)
  const folders = readdirSync(DB_DIR).filter((f) => {
    if (f.startsWith('_') || !statSync(join(DB_DIR, f)).isDirectory()) return false;
    return readdirSync(join(DB_DIR, f)).some((x) => x.endsWith('.yaml') && !x.startsWith('_'));
  });

  // Gather targets, deduplicated per URL (an URL used by several entries is
  // probed once; all its entries are reported).
  const byUrl = new Map<string, string[]>(); // url -> entries
  for (const folder of folders) {
    if (only && folder !== only) continue;
    const files = readdirSync(join(DB_DIR, folder)).filter(
      (f) => f.endsWith('.yaml') && !f.startsWith('_')
    );
    for (const file of files) {
      let data: Record<string, unknown> | null = null;
      try {
        data = parse(readFileSync(join(DB_DIR, folder, file), 'utf-8'));
      } catch {
        continue;
      }
      if (!data) continue;

      const known = new Set<string>(
        Array.isArray(data.dead_links)
          ? data.dead_links.map((d: { url?: string }) => d?.url).filter(Boolean)
          : []
      );
      const { dead_links: _dead, ...rest } = data;
      const urls = new Set<string>();
      collectUrls(rest, urls);
      for (const url of urls) {
        if (known.has(url) || url.includes('web.archive.org')) continue;
        if (!byUrl.has(url)) byUrl.set(url, []);
        byUrl.get(url)!.push(`${folder}/${file}`);
      }
    }
  }

  console.log(`Probing ${byUrl.size} unique URLs (concurrency ${CONCURRENCY})…\n`);

  const targets = [...byUrl.keys()];
  const results: Result[] = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (targets.length > 0) {
        const url = targets.shift()!;
        const { verdict, detail } = await probe(url);
        const archive = verdict === 'dead' ? await waybackLatest(url) : undefined;
        for (const entry of byUrl.get(url)!) {
          results.push({ entry, url, verdict, detail, archive });
        }
        done++;
        if (done % 50 === 0) console.log(`  …${done}/${byUrl.size}`);
      }
    })
  );

  const dead = results
    .filter((r) => r.verdict === 'dead')
    .sort((a, b) => a.entry.localeCompare(b.entry));
  const check = results
    .filter((r) => r.verdict === 'check')
    .sort((a, b) => a.entry.localeCompare(b.entry));

  const today = new Date().toISOString().slice(0, 10);
  if (dead.length > 0) {
    console.log(`\n${'='.repeat(60)}\nDEAD (${dead.length}) — add to the entry's dead_links:\n`);
    for (const r of dead) {
      console.log(`# ${r.entry}  (${r.detail})`);
      console.log(`dead_links:`);
      console.log(`  - url: ${r.url}`);
      if (r.archive)
        console.log(`    archive: ${r.archive} # latest capture; curate if domain changed hands`);
      console.log(`    checked: '${today}'`);
      console.log();
    }
  }
  if (!deadOnly && check.length > 0) {
    console.log(
      `${'='.repeat(60)}\nCHECK MANUALLY (${check.length}) — blocked/erroring, not provably dead:\n`
    );
    for (const r of check) console.log(`  ${r.entry}: ${r.url} (${r.detail})`);
  }

  const okCount = results.length - dead.length - check.length;
  console.log(`\n${'='.repeat(60)}\nok ${okCount} | dead ${dead.length} | check ${check.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
