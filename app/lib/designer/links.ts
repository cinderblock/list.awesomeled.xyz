/**
 * Links into the designer from the rest of the site.
 *
 * Used at build time (entry-page loaders), so it may lean on the catalog
 * builders: whatever they would leave out of a picker gets no link either.
 */
import type { RelationGraph } from '../relations';
import type { BaseEntry } from '../types';
import { buildAdapterOption, buildBoardOption, buildSourceOption, isUsableSource } from './catalog';

/**
 * The link that starts a design from one database entry, with the part
 * already in its slot. Null when the designer has no slot for the entry: a
 * category it doesn't use, or a part it can't offer yet (a dev board with no
 * pixel outputs recorded, an adapter without a host board in the database).
 */
export function designerHref(
  categoryId: string,
  entry: BaseEntry,
  graph?: RelationGraph
): string | null {
  const id = String(entry.id);
  const link = (key: string, value: string) => `/designer?${key}=${encodeURIComponent(value)}`;
  switch (categoryId) {
    case 'pixels':
      return link('p', id);
    case 'pixel-ics':
      return link('p', `ic-${id}`);
    case 'controllers':
      return link('c', id);
    case 'microboards':
      return buildBoardOption(entry) ? link('c', `mb-${id}`) : null;
    case 'adapters': {
      const adapter = buildAdapterOption(entry, graph);
      return adapter ? link('c', adapter.id) : null;
    }
    case 'level-converters':
      return link('l', id);
    case 'connectors':
      return link('k', id);
    case 'pattern-drivers':
      return isUsableSource(buildSourceOption(entry)) ? link('g', id) : null;
    default:
      return null;
  }
}
