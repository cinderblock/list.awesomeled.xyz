import type { Config } from '@react-router/dev/config';
import { copyFile } from 'node:fs/promises';
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
  },
} satisfies Config;
