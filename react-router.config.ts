import type { Config } from "@react-router/dev/config";

export default {
  // Enable SSR for pre-rendering
  ssr: true,
  // Pre-render routes for static site generation
  // This generates static HTML files for each route
  async prerender() {
    // For now, just pre-render the home page
    // In Phase 2, we'll add all category routes dynamically
    return ["/"];
  },
} satisfies Config;
