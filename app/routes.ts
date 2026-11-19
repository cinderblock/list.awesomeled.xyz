import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('system-overview', 'routes/system-overview.tsx'),
  route('designer', 'routes/designer.tsx'),
  route('about', 'routes/about.tsx'),
  route('search', 'routes/search.tsx'),
  route('compare', 'routes/compare.tsx'),
  // Fixed file names come before the `:category.<ext>` patterns: a segment
  // like ":category.json" ranks as static, so the first match wins.
  route('search-index.json', 'routes/search-index.ts'),
  route('database.csv.zip', 'routes/database-csv-zip.ts'),
  route('database.yaml.zip', 'routes/database-yaml-zip.ts'),
  route(':category.csv', 'routes/csv.$category.ts'),
  route(':category.json', 'routes/json.$category.ts'),
  route(':category', 'routes/category.tsx'),
  route(':category/:entry', 'routes/entry.tsx'),
  route('*', 'routes/not-found.tsx'),
] satisfies RouteConfig;
