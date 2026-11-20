import type { Config } from '@react-router/dev/config';
import { copyFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { getAllRoutes } from './app/lib/data';

export default {
  ssr: false,
  // Pre-render routes for static site generation
  // This generates static HTML files for each route
  async prerender() {
    // Get all routes from the database
    const routes = getAllRoutes();
    console.log(`Pre-rendering ${routes.length} routes...`);
    return routes;
  },
  // Static hosts (Cloudflare Pages, GitHub Pages) answer an unknown path with
  // /404.html and a real 404 status when that file exists. Without it,
  // Cloudflare Pages serves the home page with a 200, and the app then fails
  // on a missing data file instead of showing its not-found page. The SPA
  // fallback shell is the right 404 document: it boots the router at whatever
  // URL was asked for, and the router renders the not-found page.
  async buildEnd({ reactRouterConfig }) {
    const client = join(reactRouterConfig.buildDirectory, 'client');
    await copyFile(join(client, '__spa-fallback.html'), join(client, '404.html'));

    // Every prerendered path also gets a `.data` file, which the app fetches
    // when it navigates to a page. Nothing navigates to a link-preview image,
    // the sitemap or robots.txt (crawlers fetch the files themselves), and an
    // image's `.data` is the picture again at two and a half times the size:
    // 600 of them were 40 MB of upload for nothing.
    const unused = [join(client, 'sitemap.xml.data'), join(client, 'robots.txt.data')];
    for (const file of await readdir(join(client, 'og'), { recursive: true })) {
      if (file.endsWith('.jpg.data')) unused.push(join(client, 'og', file));
    }
    await Promise.all(unused.map((file) => rm(file, { force: true })));
  },
} satisfies Config;
