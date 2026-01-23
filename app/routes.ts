import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route(':category.csv', 'routes/csv.$category.ts'),
  route(':category', 'routes/category.tsx'),
  route(':category/:entry', 'routes/entry.tsx'),
] satisfies RouteConfig;
