/**
 * Datasheet mirror tests: YAML rewriting, plus a full run of the CLI against a
 * local PDF host and a mock S3 (R2) endpoint — proves the pipeline end to end
 * without Cloudflare credentials.
 *
 *   bun run test:unit
 */

import { describe, expect, test } from 'bun:test';
import { createHash } from 'crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { parse } from 'yaml';
import { insertMirrorBlock, type Mirror } from '../../scripts/mirror-datasheets';

const MIRROR: Mirror = {
  url: 'https://assets.example/datasheets/pixels/ws2812-0123abcd.pdf',
  sha256: '0123abcd'.repeat(8),
  retrieved: '2026-11-18',
  source: 'https://cdn.example/ws2812.pdf',
};

describe('insertMirrorBlock', () => {
  test('inserts after url, before other datasheet keys', () => {
    const yaml = [
      'name: WS2812',
      'datasheet:',
      '  url: https://cdn.example/ws2812.pdf',
      '  discrepancies:',
      '    - something',
      'electrical:',
      '  vcc_voltage: 5V',
      '',
    ].join('\n');
    const out = insertMirrorBlock(yaml, MIRROR);
    const data = parse(out);
    expect(data.datasheet.mirror).toEqual(MIRROR);
    expect(data.datasheet.discrepancies).toEqual(['something']);
    expect(data.electrical.vcc_voltage).toBe('5V');
    expect(out).toContain("    retrieved: '2026-11-18'");
    // Untouched lines stay byte-identical
    expect(
      out.split('\n').filter((l) => !l.startsWith('  mirror') && !l.startsWith('    '))
    ).toEqual(yaml.split('\n').filter((l) => !l.startsWith('    ')));
  });

  test('replaces an existing mirror block', () => {
    const first = insertMirrorBlock(
      'datasheet:\n  url: https://a.example/x.pdf\nname: X\n',
      MIRROR
    );
    const second = insertMirrorBlock(first, {
      ...MIRROR,
      sha256: 'f'.repeat(64),
      fetched_from: 'https://b.example/x.pdf',
    });
    const data = parse(second);
    expect(data.datasheet.mirror.sha256).toBe('f'.repeat(64));
    expect(data.datasheet.mirror.fetched_from).toBe('https://b.example/x.pdf');
    expect(second.match(/mirror:/g)?.length).toBe(1);
    expect(data.name).toBe('X');
  });

  test('works on CRLF files', () => {
    const yaml = 'name: X\r\ndatasheet:\r\n  url: https://a.example/x.pdf\r\nprice: 1\r\n';
    const data = parse(insertMirrorBlock(yaml, MIRROR));
    expect(data.datasheet.mirror.url).toBe(MIRROR.url);
    expect(data.price).toBe(1);
  });

  test('refuses flow-style or missing datasheet blocks', () => {
    expect(() => insertMirrorBlock('name: X\n', MIRROR)).toThrow();
    expect(() =>
      insertMirrorBlock('datasheet: { url: https://a.example/x.pdf }\n', MIRROR)
    ).toThrow();
  });
});

const PDF = Buffer.from('%PDF-1.4\n% test datasheet\n%%EOF\n');
const SHA = createHash('sha256').update(PDF).digest('hex');
const key = (id: string) => `datasheets/pixels/${id}-${SHA.slice(0, 8)}.pdf`;
const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

type Run = (
  env?: Record<string, string>,
  ...args: string[]
) => Promise<{ code: number; out: string }>;

/**
 * A datasheet host (/ok.pdf and /alt.pdf work, /dead.pdf 404s, /html.pdf is an
 * HTML interstitial), a mock S3 that stores PUTs and answers ListObjectsV2
 * (pre-filled from `seed`, key → size), and a temp database with four pixels.
 */
async function withFixture(
  seed: Record<string, number>,
  body: (f: {
    dir: string;
    pixels: string;
    base: string;
    puts: { path: string; bytes: number; type: string | null }[];
    run: Run;
  }) => Promise<void>
) {
  const host = Bun.serve({
    port: 0,
    fetch(req) {
      const path = new URL(req.url).pathname;
      if (path === '/ok.pdf' || path === '/alt.pdf') return new Response(PDF);
      if (path === '/html.pdf') return new Response('<!DOCTYPE html><p>blocked</p>');
      return new Response('nope', { status: 404 });
    },
  });
  const stored = new Map<string, number>(Object.entries(seed));
  const puts: { path: string; bytes: number; type: string | null }[] = [];
  const s3 = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      if (req.method === 'PUT') {
        const bytes = new Uint8Array(await req.arrayBuffer());
        puts.push({
          path: url.pathname,
          bytes: bytes.byteLength,
          type: req.headers.get('content-type'),
        });
        stored.set(url.pathname.replace(/^\/bucket\//, ''), bytes.byteLength);
        return new Response('', { status: 200, headers: { ETag: '"abc"' } });
      }
      if (req.method === 'GET' && url.searchParams.get('list-type') === '2') {
        const prefix = url.searchParams.get('prefix') ?? '';
        const hits = [...stored].filter(([k]) => k.startsWith(prefix));
        const contents = hits
          .map(
            ([k, size]) =>
              `<Contents><Key>${xml(k)}</Key><LastModified>2026-11-18T00:00:00.000Z</LastModified>` +
              `<ETag>"abc"</ETag><Size>${size}</Size><StorageClass>STANDARD</StorageClass></Contents>`
          )
          .join('');
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?>` +
            `<ListBucketResult xmlns="http://s3.amazonaws.com/doc/2006-03-01/">` +
            `<Name>bucket</Name><Prefix>${xml(prefix)}</Prefix><KeyCount>${hits.length}</KeyCount>` +
            `<MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated>${contents}</ListBucketResult>`,
          { headers: { 'Content-Type': 'application/xml' } }
        );
      }
      return new Response('', { status: 200 });
    },
  });

  const dir = mkdtempSync(join(tmpdir(), 'mirror-test-'));
  try {
    const pixels = join(dir, 'database', 'pixels');
    mkdirSync(pixels, { recursive: true });
    const base = `http://localhost:${host.port}`;
    writeFileSync(
      join(pixels, 'good.yaml'),
      `name: Good\ndatasheet:\n  url: ${base}/ok.pdf\nprice: 1\n`
    );
    writeFileSync(
      join(pixels, 'fallback.yaml'),
      `name: Fallback\ndatasheet:\n  url: ${base}/dead.pdf\n  sources:\n    - url: ${base}/html.pdf\n      host: distributor\n    - url: ${base}/alt.pdf\n      host: community\n`
    );
    writeFileSync(
      join(pixels, 'broken.yaml'),
      `name: Broken\ndatasheet:\n  url: ${base}/dead.pdf\n`
    );
    writeFileSync(join(pixels, 'none.yaml'), 'name: None\n');

    const script = resolve(import.meta.dirname, '../../scripts/mirror-datasheets.ts');
    const run: Run = async (extra = {}, ...args) => {
      const env = {
        ...process.env,
        R2_ACCOUNT_ID: 'test',
        R2_ACCESS_KEY_ID: 'key',
        R2_SECRET_ACCESS_KEY: 'secret',
        R2_BUCKET: 'bucket',
        R2_ENDPOINT: `http://localhost:${s3.port}`,
        R2_PUBLIC_BASE_URL: 'https://assets.example/',
        MIRROR_SUMMARY_FILE: join(dir, 'summary.md'),
        GITHUB_STEP_SUMMARY: '',
        MIRROR_BUDGET_MB: '',
        ...extra,
      };
      // Async spawn: the mock servers live on this event loop.
      const proc = Bun.spawn(['bun', script, ...args], { cwd: dir, env, stdout: 'pipe' });
      const out = await new Response(proc.stdout).text();
      return { code: await proc.exited, out };
    };
    await body({ dir, pixels, base, puts, run });
  } finally {
    host.stop(true);
    s3.stop(true);
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('mirror-datasheets CLI (mock R2)', () => {
  test('uploads, falls back to sources, skips stored objects, reports storage', async () => {
    // `good` is already in the bucket (same bytes, same key); `old` is a stale
    // version that no entry references any more.
    const seed = { [key('good')]: PDF.byteLength, 'datasheets/pixels/old-deadbeef.pdf': 1000 };
    await withFixture(seed, async ({ dir, pixels, base, puts, run }) => {
      const res = await run({ GITHUB_STEP_SUMMARY: join(dir, 'step.md') });
      expect(res.code).toBe(0);

      // Content-addressed: the stored copy of `good` isn't uploaded again
      expect(puts.map((p) => p.path)).toEqual([`/bucket/${key('fallback')}`]);
      expect(puts[0]).toMatchObject({ bytes: PDF.byteLength, type: 'application/pdf' });

      const good = parse(readFileSync(join(pixels, 'good.yaml'), 'utf-8'));
      expect(good.datasheet.mirror).toMatchObject({
        url: `https://assets.example/${key('good')}`,
        sha256: SHA,
        source: `${base}/ok.pdf`,
      });
      expect(good.datasheet.mirror.fetched_from).toBeUndefined();
      expect(good.price).toBe(1);

      const fb = parse(readFileSync(join(pixels, 'fallback.yaml'), 'utf-8'));
      expect(fb.datasheet.mirror.source).toBe(`${base}/dead.pdf`);
      expect(fb.datasheet.mirror.fetched_from).toBe(`${base}/alt.pdf`);
      expect(fb.datasheet.sources).toHaveLength(2);

      // Failed downloads leave the YAML alone
      expect(readFileSync(join(pixels, 'broken.yaml'), 'utf-8')).not.toContain('mirror:');
      const summary = readFileSync(join(dir, 'summary.md'), 'utf-8');
      expect(summary).toContain(':warning: `pixels/broken`');

      // Storage report: good + fallback + old, and old is unreferenced
      expect(summary).toContain('**Storage:** 3 PDFs');
      expect(summary).toContain('1 of them (0.0 MB) are no longer referenced');
      expect(readFileSync(join(dir, 'step.md'), 'utf-8')).toContain('**Storage:** 3 PDFs');
      expect(res.out).not.toContain('::warning::');

      // Mirrored entries are skipped next time; only the still-broken one remains
      const dry = await run({}, '--dry-run');
      expect(dry.out).toContain('1 datasheet(s) to mirror');
      expect(dry.out).toContain('pixels/broken');
    });
  });

  test('stops uploading at the storage budget', async () => {
    await withFixture({}, async ({ dir, pixels, puts, run }) => {
      // Room for one test PDF, not two. Files run in name order: broken
      // (fails), fallback (uploaded), good (over budget).
      const budgetMb = String((PDF.byteLength * 1.5) / (1024 * 1024));
      const res = await run({ MIRROR_BUDGET_MB: budgetMb });
      expect(res.code).toBe(0);
      expect(puts.map((p) => p.path)).toEqual([`/bucket/${key('fallback')}`]);
      const fb = parse(readFileSync(join(pixels, 'fallback.yaml'), 'utf-8'));
      expect(fb.datasheet.mirror).toBeDefined();
      expect(readFileSync(join(pixels, 'good.yaml'), 'utf-8')).not.toContain('mirror:');
      const summary = readFileSync(join(dir, 'summary.md'), 'utf-8');
      expect(summary).toContain(':warning: `pixels/good` skipped');
      expect(res.out).toContain('::warning::Datasheet mirror at');
      expect(res.out).toContain('1 datasheet(s) skipped');
    });
  });
});
