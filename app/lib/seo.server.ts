/**
 * What search engines and link previews are told about a page: a one-line
 * description built from an entry's key facts, schema.org data, and the
 * content of its preview card. Computed in loaders, while prerendering.
 */

import { dirname, resolve } from 'path';
import { parsePrice } from './currency';
import { getDatabasePath, loadCategoryData } from './data';
import { entityName } from './fields';
import { firstImageFile, imageUrl } from './images';
import { factColumns, keyFacts } from './key-facts.server';
import { breadcrumbJsonLd } from './meta';
import type { OgCard } from './og.server';
import { absoluteUrl, SITE_NAME } from './site';
import { CATEGORIES, type BaseEntry, type Category } from './types';

// What one entry of each category is, for sentences
const SINGULAR: Record<string, string> = {
  controllers: 'pixel controller',
  pixels: 'addressable LED',
  'pixel-ics': 'LED driver IC',
  'pattern-drivers': 'pattern software',
  connectors: 'connector',
  microboards: 'microcontroller board',
  'level-converters': 'level converter',
  adapters: 'adapter',
  'drive-libraries': 'LED driver library',
  'pixel-decoders': 'pixel decoder',
  'diffusive-materials': 'diffuser material',
  'commercial-systems': 'commercial pixel system',
};

// Search results cut descriptions off around here
const DESCRIPTION_LIMIT = 160;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "a, b, and c" (the house style keeps the Oxford comma). */
function listOf(items: string[]): string {
  if (items.length <= 2) return items.join(' and ');
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

export interface PageSeo {
  description: string;
  /** Site path of the page's preview image */
  image: string;
  jsonLd: object[];
}

/** Site path of an entry's preview image (routes/og.$category.$entry.ts). */
export function entryOgPath(categoryId: string, entryId: string): string {
  return `/og/${categoryId}/${entryId}.jpg`;
}

/** Site path of a category's preview image (routes/og.$category.ts). */
export function categoryOgPath(categoryId: string): string {
  return `/og/${categoryId}.jpg`;
}

// ---------------------------------------------------------------------------
// Entry pages
// ---------------------------------------------------------------------------

function entryOffer(entry: BaseEntry, url: string): object | null {
  // Tier lists and free-text prices have no single figure to state
  const price = Array.isArray(entry.price) ? null : parsePrice(entry.price);
  if (!price || price.from) return null;
  const availability =
    entry.status === 'discontinued' ? { availability: 'https://schema.org/Discontinued' } : {};
  if (price.max != null) {
    return {
      '@type': 'AggregateOffer',
      lowPrice: price.amount,
      highPrice: price.max,
      priceCurrency: price.currency,
      url,
      ...availability,
    };
  }
  return {
    '@type': 'Offer',
    price: price.amount,
    priceCurrency: price.currency,
    url,
    ...availability,
  };
}

export function entrySeo(category: Category, entry: BaseEntry): PageSeo {
  const path = `${category.path}/${entry.id}`;
  const maker = entityName(entry.creator);
  const facts = keyFacts(entry, factColumns(category.id), 4);
  const what = SINGULAR[category.id] ?? category.name;

  const lead = [
    entry.name,
    entry.status === 'discontinued' ? ' (discontinued)' : '',
    maker && maker !== entry.name ? ` by ${maker}` : '',
  ].join('');
  const tail = `${capitalize(what)} specs, links, and compatible parts.`;
  // As many facts as fit in what a search result shows
  let description = `${lead}. ${tail}`;
  for (let n = facts.length; n > 0; n--) {
    const candidate = `${lead}: ${facts.slice(0, n).join(', ')}. ${tail}`;
    if (candidate.length <= DESCRIPTION_LIMIT) {
      description = candidate;
      break;
    }
  }

  const jsonLd: object[] = [
    breadcrumbJsonLd([
      [SITE_NAME, '/'],
      [category.name, category.path],
      [entry.name, path],
    ]),
  ];
  // A Product without an offer is reported as an error by Google's tools, so
  // only priced entries are marked up as products
  const offer = entryOffer(entry, absoluteUrl(path));
  if (offer) {
    const image = firstImageFile(entry);
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: entry.name,
      description,
      url: absoluteUrl(path),
      category: category.name,
      ...(maker ? { brand: { '@type': 'Brand', name: maker } } : {}),
      ...(image ? { image: absoluteUrl(imageUrl(category.id, image)) } : {}),
      offers: offer,
    });
  }

  return { description, image: entryOgPath(category.id, entry.id), jsonLd };
}

export function entryOgCard(category: Category, entry: BaseEntry): OgCard {
  const image = firstImageFile(entry);
  const maker = entityName(entry.creator);
  return {
    eyebrow: category.name,
    hue: category.color.hue,
    title: entry.name,
    subtitle: maker && maker !== entry.name ? maker : undefined,
    facts: keyFacts(entry, factColumns(category.id), 4),
    image: image
      ? resolve(dirname(getDatabasePath()), 'public', 'database-images', category.id, image)
      : undefined,
  };
}

// ---------------------------------------------------------------------------
// Category pages
// ---------------------------------------------------------------------------

export function categorySeo(category: Category, count: number): PageSeo {
  const columns = factColumns(category.id)
    .slice(0, 5)
    .map((c) => c.label);
  const description = `${category.description}: ${count} entries to sort, filter, and compare${
    columns.length ? ` by ${listOf(columns)}` : ''
  }.`;
  return {
    description,
    image: categoryOgPath(category.id),
    jsonLd: [
      breadcrumbJsonLd([
        [SITE_NAME, '/'],
        [category.name, category.path],
      ]),
    ],
  };
}

export function categoryOgCard(category: Category, count: number): OgCard {
  return {
    eyebrow: `${count} entries`,
    hue: category.color.hue,
    title: category.name,
    subtitle: category.description,
  };
}

// ---------------------------------------------------------------------------
// The site as a whole
// ---------------------------------------------------------------------------

export function siteOgCard(): OgCard {
  let total = 0;
  for (const category of CATEGORIES) total += loadCategoryData(category.id).length;
  return {
    title: SITE_NAME,
    rainbowTitle: true,
    subtitle: 'Addressable LEDs, the controllers that drive them, and the parts in between.',
    facts: [`${total} entries in ${CATEGORIES.length} categories`, 'Search, filter, and compare'],
  };
}
