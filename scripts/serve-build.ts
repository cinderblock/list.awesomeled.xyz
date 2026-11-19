#!/usr/bin/env bun
/**
 * Serve the production build (build/client) the way static hosting does:
 * `/controllers` answers with `controllers/index.html`, unknown paths get
 * `404.html` with a 404 status. Used by `bun run test:prod` to test what
 * actually ships — the dev server is not prerendered, so hydration problems
 * never show up there.
 *
 *   bun scripts/serve-build.ts [dir]      # PORT=4173 by default
 */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.argv[2] ?? 'build/client');
const port = Number(process.env.PORT) || 4173;

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.data': 'text/x-script; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

function isFile(path: string): boolean {
  return existsSync(path) && statSync(path).isFile();
}

if (!existsSync(join(root, 'index.html'))) {
  console.error(`No build found in ${root}. Run \`bun run build\` first.`);
  process.exit(1);
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const target = resolve(root, `.${normalize(decodeURIComponent(pathname))}`);
  // Never serve anything outside the build directory
  const inside = target === root || target.startsWith(root + sep);

  let file: string | null = null;
  if (inside) {
    if (isFile(target)) file = target;
    else if (isFile(join(target, 'index.html'))) file = join(target, 'index.html');
  }
  let status = 200;
  if (!file) {
    status = 404;
    file = [join(root, '404.html'), join(root, '__spa-fallback.html')].find(isFile) ?? null;
  }
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  res.writeHead(status, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}`);
});
