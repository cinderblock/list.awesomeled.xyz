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

describe('mirror-datasheets CLI (mock R2)', () => {
  test('uploads, falls back to sources, writes valid mirror blocks', async () => {
    const pdf = Buffer.from('%PDF-1.4\n% test datasheet\n%%EOF\n');
    const sha = createHash('sha256').update(pdf).digest('hex');

    // Datasheet host: /ok.pdf works, /dead.pdf 404s, /html.pdf is an interstitial
    const host = Bun.serve({
      port: 0,
      fetch(req) {
        const path = new URL(req.url).pathname;
        if (path === '/ok.pdf' || path === '/alt.pdf') return new Response(pdf);
        if (path === '/html.pdf') return new Response('<!DOCTYPE html><p>blocked</p>');
        return new Response('nope', { status: 404 });
      },
    });
    // Mock S3: accept PUTs, remember them
    const puts: { path: string; bytes: number; type: string | null }[] = [];
    const s3 = Bun.serve({
      port: 0,
      async fetch(req) {
        if (req.method === 'PUT') {
          const body = new Uint8Array(await req.arrayBuffer());
          puts.push({
            path: new URL(req.url).pathname,
            bytes: body.byteLength,
            type: req.headers.get('content-type'),
          });
          return new Response('', { status: 200, headers: { ETag: '"abc"' } });
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
      const env = {
        ...process.env,
        R2_ACCOUNT_ID: 'test',
        R2_ACCESS_KEY_ID: 'key',
        R2_SECRET_ACCESS_KEY: 'secret',
        R2_BUCKET: 'bucket',
        R2_ENDPOINT: `http://localhost:${s3.port}`,
        R2_PUBLIC_BASE_URL: 'https://assets.example/',
        MIRROR_SUMMARY_FILE: join(dir, 'summary.md'),
      };
      // Async spawn: the mock servers live on this event loop.
      const run = async (...args: string[]) => {
        const proc = Bun.spawn(['bun', script, ...args], { cwd: dir, env, stdout: 'pipe' });
        const out = await new Response(proc.stdout).text();
        return { code: await proc.exited, out };
      };
      expect((await run()).code).toBe(0);

      const key = (id: string) => `datasheets/pixels/${id}-${sha.slice(0, 8)}.pdf`;
      expect(puts.map((p) => p.path).sort()).toEqual(
        [`/bucket/${key('fallback')}`, `/bucket/${key('good')}`].sort()
      );
      expect(puts.every((p) => p.bytes === pdf.byteLength && p.type === 'application/pdf')).toBe(
        true
      );

      const good = parse(readFileSync(join(pixels, 'good.yaml'), 'utf-8'));
      expect(good.datasheet.mirror).toMatchObject({
        url: `https://assets.example/${key('good')}`,
        sha256: sha,
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

      // Mirrored entries are skipped next time; only the still-broken one remains
      const dry = await run('--dry-run');
      expect(dry.out).toContain('1 datasheet(s) to mirror');
      expect(dry.out).toContain('pixels/broken');
    } finally {
      host.stop(true);
      s3.stop(true);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
