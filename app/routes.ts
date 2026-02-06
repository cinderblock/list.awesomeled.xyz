import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('system-overview', 'routes/system-overview.tsx'),
  route('about', 'routes/about.tsx'),
  route('database-images/:category/:filename', 'routes/database-image.$category.$filename.ts'),
  route('datasheets/:filename', 'routes/datasheet.$filename.ts'),
  route(':category.csv', 'routes/csv.$category.ts'),
  route('database.csv.zip', 'routes/database-csv-zip.ts'),
  route('database.yaml.zip', 'routes/database-yaml-zip.ts'),
  route(':category', 'routes/category.tsx'),
  route(':category/:entry', 'routes/entry.tsx'),
] satisfies RouteConfig;
