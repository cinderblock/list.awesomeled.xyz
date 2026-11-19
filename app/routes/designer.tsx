import type { Route } from './+types/designer';
import { getRelationGraph, loadCategoryData } from '~/lib/data';
import { buildCatalog } from '~/lib/designer';
import type { BaseEntry } from '~/lib/types';
import { Designer } from '~/components/designer/Designer';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'System Designer - Awesome LED List' },
    {
      name: 'description',
      content:
        'Design an addressable LED system: pick pixels, a controller, level shifters and connectors, with live compatibility checks, a power plan with injection and fusing guidance, a priced parts list, a shareable link and a downloadable diagram.',
    },
  ];
}

// Categories the designer draws parts from
const PART_CATEGORIES = [
  'pixels',
  'pixel-ics',
  'controllers',
  'microboards',
  'level-converters',
  'connectors',
  'pattern-drivers',
  'adapters',
];

// Runs at prerender time: the page ships a slim catalog, not the database
export async function loader() {
  const db = new Map<string, BaseEntry[]>(
    PART_CATEGORIES.map((id) => [id, loadCategoryData(id)] as [string, BaseEntry[]])
  );
  return { catalog: buildCatalog(db, getRelationGraph()) };
}

// The catalog is the same for every design: a changed query string (an
// example link, back/forward) must not fetch it again
export function shouldRevalidate() {
  return false;
}

export default function DesignerPage({ loaderData }: Route.ComponentProps) {
  return <Designer catalog={loaderData.catalog} />;
}
