#!/usr/bin/env bun
/**
 * Freshness checker: link rot + price staleness.
 *
 * Links — collects every http(s) URL in every entry (whole-URL fields AND
 * URLs inside prose such as `notes`), plus the category `description.md`
 * files and the site's MDX pages, probes each one, and reports:
 *   - DEAD:    hard evidence (DNS failure, connection refused, HTTP 404/410)
 *   - CHECK:   suspicious but not provably dead (403, 429, 5xx, timeouts —
 *              often just bot-blocking); needs a human look
 *   - ok:      reachable (2xx/3xx and other 4xx)
 *
 * For DEAD urls it also queries the Wayback Machine availability API and
 * prints a ready-to-paste `dead_links` YAML stub (latest capture pre-filled —
 * curate the timestamp if the domain changed hands). URLs already listed in
 * an entry's `dead_links` are re-probed too: any that answer again are listed
 * under BACK so a human can confirm and drop the entry (a parked domain also
 * answers, so look before deleting).
 *
 * Requests are paced per host (one at a time, PER_HOST_GAP_MS apart, one
 * retry after a 429) so shared hosts like Tindie or Shopify don't rate-limit
 * the sweep into a wall of false CHECKs.
 *
 * Prices — no network: lists priced entries whose `price_source.retrieved`
 * is older than STALE_MONTHS, and counts priced entries with no date.
 *
 *   bun run check-links                  # whole database
 *   bun run check-links controllers     # one category
 *   bun run check-links --dead-only     # only print DEAD findings
 *   bun run check-links --prices        # price staleness only (offline)
 *
 * On Windows, run it with Node instead (`node scripts/check-links.ts`):
 * Bun 1.4's fetch fails the TLS handshake to github.com and many other
 * hosts there, which turns most of the sweep into false CHECKs.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

const DB_DIR = 'database';
const CONTENT_DIR = 'app/content';
const CONCURRENCY = 8; // hosts probed in parallel
const PER_HOST_GAP_MS = 1000;
const TIMEOUT_MS = 15000;
const STALE_MONTHS = 12;
// Some sites 403/close on unknown agents; a browser-ish UA reduces false alarms.
const USER_AGENT =
  'Mozilla/5.0 (compatible; awesomeledlist-linkcheck/1.0; +https://awesomeled.xyz)';

type Verdict = 'ok' | 'dead' | 'check';

interface Result {
  entry: string; // "<category>/<file>" or a content path
  url: string;
  verdict: Verdict;
  detail: string;
  archive?: string;
  /** Listed in the entry's dead_links (re-probe) */
  known?: boolean;
  /** Final URL after redirects (ok verdicts) */
  final?: string;
}

interface Targets {
  byUrl: Map<string, string[]>; // url -> places it appears
  knownDead: Set<string>; // `${entry}\n${url}` pairs listed in that entry's dead_links
}

// Whole-URL strings are taken as-is; URLs embedded in prose end at whitespace
// or quotes. Parentheses are legal in URLs (Wikimedia `File:…_(123).jpg`,
// `Manual (EN).pdf`), so only a trailing `)` that closes a parenthetical
// (unbalanced) is dropped, along with sentence punctuation.
const WHOLE_URL = /^https?:\/\/\S+$/;
const URL_IN_TEXT = /https?:\/\/[^\s<>"'`]+/g;
function trimUrl(u: string): string {
  for (;;) {
    const t = u.replace(/[.,;:!?\]]+$/, '');
    const open = (t.match(/\(/g) ?? []).length;
    const close = (t.match(/\)/g) ?? []).length;
    const next = t.endsWith(')') && close > open ? t.slice(0, -1) : t;
    if (next === u) return u;
    u = next;
  }
}
function urlsInText(text: string): string[] {
  if (WHOLE_URL.test(text)) return [text];
  return (text.match(URL_IN_TEXT) ?? []).map(trimUrl);
}

// Recursively collect http(s) URLs from an entry value.
function collectUrls(value: unknown, out: Set<string>): void {
  if (typeof value === 'string') {
    for (const u of urlsInText(value)) out.add(u);
  } else if (Array.isArray(value)) {
    for (const v of value) collectUrls(v, out);
  } else if (value && typeof value === 'object') {
    for (const v of Object.values(value)) collectUrls(v, out);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A deep link (with a path) that ended up at a bare site root. */
function redirectedHome(from: string, to: string): boolean {
  try {
    const a = new URL(from);
    const b = new URL(to);
    const deep = a.pathname.replace(/\/$/, '') !== '' || a.search !== '';
    return deep && (b.pathname === '/' || b.pathname === '') && b.search === '';
  } catch {
    return false;
  }
}

async function probe(url: string): Promise<{ verdict: Verdict; detail: string; final?: string }> {
  const attempt = (method: 'HEAD' | 'GET') =>
    fetch(url, {
      method,
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'user-agent': USER_AGENT, accept: '*/*' },
    });

  try {
    let res = await attempt('HEAD');
    // Many servers mishandle HEAD; retry with GET before judging.
    if (res.status >= 400) res = await attempt('GET');
    // Rate-limited: honor a short Retry-After once.
    if (res.status === 429) {
      const after = Number(res.headers.get('retry-after'));
      await sleep(Math.min(Number.isFinite(after) && after > 0 ? after * 1000 : 10000, 30000));
      res = await attempt('GET');
    }
    // Don't keep sockets open on bodies we never read.
    await res.body?.cancel().catch(() => {});

    if (res.status === 404 || res.status === 410) {
      return { verdict: 'dead', detail: `HTTP ${res.status}` };
    }
    if (res.ok && redirectedHome(url, res.url)) {
      // A product page that now redirects to the site's front page is gone,
      // even though the final response is a 200.
      return { verdict: 'check', detail: `redirects to the homepage (${res.url})` };
    }
    if (res.ok || (res.status >= 300 && res.status < 400)) {
      return { verdict: 'ok', detail: `HTTP ${res.status}`, final: res.url };
    }
    return { verdict: 'check', detail: `HTTP ${res.status}` };
  } catch (e) {
    const msg =
      e instanceof Error ? (e.cause instanceof Error ? e.cause.message : e.message) : String(e);
    // DNS failure / refused connection = the site is gone, not just grumpy.
    // TLS problems are deliberately NOT dead: browsers tolerate incomplete
    // cert chains (AIA fetching) that strict clients reject.
    if (/ENOTFOUND|EAI_AGAIN|ECONNREFUSED/i.test(msg)) {
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

// Category folders = directories with entry YAML files (skips _schema,
// LICENSE, issues/ review notes, datasheets/, …)
function categoryFolders(): string[] {
  return readdirSync(DB_DIR).filter((f) => {
    if (f.startsWith('_') || !statSync(join(DB_DIR, f)).isDirectory()) return false;
    return readdirSync(join(DB_DIR, f)).some((x) => x.endsWith('.yaml') && !x.startsWith('_'));
  });
}

interface Entry {
  path: string; // "<category>/<file>"
  data: Record<string, unknown>;
}

function loadEntries(only?: string): Entry[] {
  const entries: Entry[] = [];
  for (const folder of categoryFolders()) {
    if (only && folder !== only) continue;
    const files = readdirSync(join(DB_DIR, folder)).filter(
      (f) => f.endsWith('.yaml') && !f.startsWith('_')
    );
    for (const file of files) {
      try {
        const data = parse(readFileSync(join(DB_DIR, folder, file), 'utf-8'));
        if (data && typeof data === 'object') entries.push({ path: `${folder}/${file}`, data });
      } catch {
        // validate.ts reports parse errors
      }
    }
  }
  return entries;
}

function gatherTargets(entries: Entry[], only?: string): Targets {
  const byUrl = new Map<string, string[]>();
  const knownDead = new Set<string>();
  const add = (url: string, where: string) => {
    if (url.includes('web.archive.org') || /^https?:\/\/localhost\b/.test(url)) return;
    if (!byUrl.has(url)) byUrl.set(url, []);
    if (!byUrl.get(url)!.includes(where)) byUrl.get(url)!.push(where);
  };

  for (const { path, data } of entries) {
    const known = new Set<string>(
      Array.isArray(data.dead_links)
        ? data.dead_links
            .map((d: { url?: string }) => d?.url)
            .filter((u: string | undefined): u is string => typeof u === 'string')
        : []
    );
    const { dead_links: _dead, ...rest } = data;
    const urls = new Set<string>();
    collectUrls(rest, urls);
    for (const url of urls) add(url, path);
    for (const url of known) {
      add(url, path);
      knownDead.add(`${path}\n${url}`);
    }
  }

  // Prose pages: category descriptions (always, or just the one category)
  // and the site's MDX content (whole-database runs only).
  for (const folder of categoryFolders()) {
    if (only && folder !== only) continue;
    const desc = join(DB_DIR, folder, 'description.md');
    if (existsSync(desc)) {
      for (const url of urlsInText(readFileSync(desc, 'utf-8'))) {
        add(url, `${folder}/description.md`);
      }
    }
  }
  if (!only && existsSync(CONTENT_DIR)) {
    for (const file of readdirSync(CONTENT_DIR).filter((f) => /\.mdx?$/.test(f))) {
      for (const url of urlsInText(readFileSync(join(CONTENT_DIR, file), 'utf-8'))) {
        add(url, `${CONTENT_DIR}/${file}`);
      }
    }
  }
  return { byUrl, knownDead };
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

async function checkLinks({ byUrl, knownDead }: Targets): Promise<Result[]> {
  // One queue per host; CONCURRENCY workers each drain whole hosts, so no
  // host ever sees parallel requests from us.
  const hosts = new Map<string, string[]>();
  for (const url of byUrl.keys()) {
    const h = hostOf(url);
    if (!hosts.has(h)) hosts.set(h, []);
    hosts.get(h)!.push(url);
  }
  // Biggest hosts first so they don't become the long tail.
  const queue = [...hosts.values()].sort((a, b) => b.length - a.length);

  console.log(
    `Probing ${byUrl.size} unique URLs on ${hosts.size} hosts (${CONCURRENCY} hosts at a time)…\n`
  );

  const results: Result[] = [];
  let done = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const urls = queue.shift()!;
        for (const [i, url] of urls.entries()) {
          if (i > 0) await sleep(PER_HOST_GAP_MS);
          const { verdict, detail, final } = await probe(url);
          const places = byUrl.get(url)!;
          const isKnown = (entry: string) => knownDead.has(`${entry}\n${url}`);
          const archive =
            verdict === 'dead' && !places.every(isKnown) ? await waybackLatest(url) : undefined;
          for (const entry of places) {
            results.push({ entry, url, verdict, detail, archive, final, known: isKnown(entry) });
          }
          done++;
          if (done % 50 === 0) console.log(`  …${done}/${byUrl.size}`);
        }
      }
    })
  );
  return results;
}

function printLinkReport(all: Result[], deadOnly: boolean): string {
  // Already-annotated dead links only matter if they came back.
  // Same site only: a dead domain that now redirects to someone else's page
  // (a new owner, a parent company's catalog) hasn't come back.
  const sameSite = (r: Result) =>
    !r.final || hostOf(r.final).replace(/^www\./, '') === hostOf(r.url).replace(/^www\./, '');
  const back = all
    .filter((r) => r.known && r.verdict === 'ok' && sameSite(r))
    .sort((a, b) => a.entry.localeCompare(b.entry));
  const results = all.filter((r) => !r.known);
  const dead = results
    .filter((r) => r.verdict === 'dead')
    .sort((a, b) => a.entry.localeCompare(b.entry));
  const check = results
    .filter((r) => r.verdict === 'check')
    .sort((a, b) => a.entry.localeCompare(b.entry));

  // Local calendar day (en-CA formats as YYYY-MM-DD); CI runs in UTC anyway.
  const today = new Date().toLocaleDateString('en-CA');
  if (dead.length > 0) {
    console.log(`\n${'='.repeat(60)}\nDEAD (${dead.length}) — add to the entry's dead_links:\n`);
    for (const r of dead) {
      console.log(`# ${r.entry}  (${r.detail})`);
      if (!r.entry.endsWith('.yaml')) {
        console.log(`  ${r.url}  — prose page: fix or remove the link by hand\n`);
        continue;
      }
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

  if (!deadOnly && back.length > 0) {
    console.log(
      `\n${'='.repeat(60)}\nBACK (${back.length}) — in dead_links but answering again; check the page shows the right product, then drop the dead_links entry:\n`
    );
    for (const r of back) console.log(`  ${r.entry}: ${r.url} (${r.detail})`);
  }

  const okCount = results.length - dead.length - check.length;
  return `ok ${okCount} | dead ${dead.length} | check ${check.length} | back ${back.length}`;
}

// --- Prices -----------------------------------------------------------------

interface PricedEntry {
  path: string;
  retrieved?: string;
}

// Entry-level price + its source, across the category shapes: top-level
// price/price_source, pattern drivers' pricing.price/pricing.source, and
// commercial systems' pricing.examples[] (oldest example source wins).
function priceInfo(data: Record<string, unknown>): { priced: boolean; retrieved?: string } {
  const label = (v: unknown) => typeof v === 'string' && /^(unknown|contact|varies)$/i.test(v);
  const retrievedOf = (s: unknown) =>
    s && typeof s === 'object' && typeof (s as { retrieved?: unknown }).retrieved === 'string'
      ? (s as { retrieved: string }).retrieved
      : undefined;

  if (data.price != null && !label(data.price)) {
    return { priced: true, retrieved: retrievedOf(data.price_source) };
  }
  const pricing = data.pricing as Record<string, unknown> | null | undefined;
  if (!pricing) return { priced: false };
  if (pricing.price != null && !label(pricing.price) && !/^free$/i.test(String(pricing.price))) {
    return { priced: true, retrieved: retrievedOf(pricing.source) };
  }
  if (Array.isArray(pricing.examples) && pricing.examples.length > 0) {
    const dates = pricing.examples.map((e) => retrievedOf((e as { source?: unknown })?.source));
    if (dates.some((d) => d == null)) return { priced: true };
    return { priced: true, retrieved: (dates as string[]).sort()[0] };
  }
  return { priced: false };
}

function monthsSince(retrieved: string, now: Date): number | null {
  const m = retrieved.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!m) return null;
  const then = Date.UTC(Number(m[1]), Number(m[2]) - 1, m[3] ? Number(m[3]) : 1);
  return Math.floor((now.getTime() - then) / (30.44 * 86_400_000));
}

function printPriceReport(entries: Entry[]): string {
  const now = new Date();
  const stale: (PricedEntry & { months: number })[] = [];
  const undated = new Map<string, number>(); // category -> count
  let dated = 0;

  for (const { path, data } of entries) {
    const { priced, retrieved } = priceInfo(data);
    if (!priced) continue;
    if (!retrieved) {
      const cat = path.split('/')[0];
      undated.set(cat, (undated.get(cat) ?? 0) + 1);
      continue;
    }
    dated++;
    const months = monthsSince(retrieved, now);
    if (months != null && months >= STALE_MONTHS) stale.push({ path, retrieved, months });
  }

  const undatedTotal = [...undated.values()].reduce((a, b) => a + b, 0);
  console.log(
    `\n${'='.repeat(60)}\nPRICES — ${dated} dated (${stale.length} older than ${STALE_MONTHS} months), ${undatedTotal} undated\n`
  );
  if (stale.length > 0) {
    console.log(`Stale (re-check and bump price_source.retrieved):`);
    for (const s of stale.sort((a, b) => a.retrieved!.localeCompare(b.retrieved!))) {
      console.log(`  ${s.path}: retrieved ${s.retrieved} (${s.months} months ago)`);
    }
    console.log();
  }
  if (undatedTotal > 0) {
    console.log(`Undated (price with no price_source), per category:`);
    for (const [cat, n] of [...undated.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: ${n}`);
    }
  }
  return `prices: ${dated} dated | ${stale.length} stale | ${undatedTotal} undated`;
}

async function main() {
  const args = process.argv.slice(2);
  const deadOnly = args.includes('--dead-only');
  const pricesOnly = args.includes('--prices');
  const only = args.find((a) => !a.startsWith('--'));

  const entries = loadEntries(only);

  let linkSummary: string | null = null;
  if (!pricesOnly) {
    const results = await checkLinks(gatherTargets(entries, only));
    linkSummary = printLinkReport(results, deadOnly);
  }
  const priceSummary = deadOnly ? null : printPriceReport(entries);

  console.log(`\n${'='.repeat(60)}`);
  if (priceSummary) console.log(priceSummary);
  if (linkSummary) console.log(linkSummary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
