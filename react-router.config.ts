import type { Config } from '@react-router/dev/config';
import { getAllRoutes } from './app/lib/data';

export default {
  // Enable SSR for pre-rendering
  ssr: true,
  // Pre-render routes for static site generation
  // This generates static HTML files for each route
  async prerender() {
    // Get all routes from the database
    const routes = getAllRoutes();
    console.log(`Pre-rendering ${routes.length} routes...`);
    return routes;
  },
} satisfies Config;
