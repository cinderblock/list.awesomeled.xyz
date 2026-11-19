/**
 * One builder for every page's <head>: title, description, canonical URL,
 * OpenGraph / Twitter card tags and structured data. Routes call it from
 * their `meta` export so a shared link unfurls the same way everywhere.
 */

import type { MetaDescriptor } from 'react-router';
import { absoluteUrl, SITE_NAME, SITE_ORIGIN } from './site';

/** The site-wide link-preview image (routes/og.site.ts) */
export const DEFAULT_OG_IMAGE = '/og/site.jpg';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export interface PageMeta {
  /** The page's own name ("Falcon F16V4 - Controllers"); the site name is appended */
  title?: string;
  /** The whole <title>, for the pages that word it themselves (the home page) */
  fullTitle?: string;
  description: string;
  /**
   * Site path without a query string ("/controllers/falcon-f16v4"). It becomes
   * the canonical URL: a filtered or sorted table is the same page as the
   * plain one as far as a search engine is concerned.
   */
  path: string;
  /** Site path of a 1200×630 preview image; the site-wide one when left out */
  image?: string;
  /** What the preview image shows */
  imageAlt?: string;
  type?: 'website' | 'article' | 'product';
  /** Views that are not content of their own (search results, comparisons) */
  noindex?: boolean;
  /** schema.org documents for this page */
  jsonLd?: object[];
}

export function pageTitle(title?: string): string {
  return title ? `${title} - ${SITE_NAME}` : SITE_NAME;
}

export function pageMeta(page: PageMeta): MetaDescriptor[] {
  const title = page.fullTitle ?? pageTitle(page.title);
  // Link previews show the site name on its own line: no need to repeat it
  const shareTitle = page.title ?? SITE_NAME;
  const url = absoluteUrl(page.path);
  const image = absoluteUrl(page.image ?? DEFAULT_OG_IMAGE);
  const imageAlt = page.imageAlt ?? shareTitle;

  const tags: MetaDescriptor[] = [
    { title },
    { name: 'description', content: page.description },
    { tagName: 'link', rel: 'canonical', href: url },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: page.type ?? 'website' },
    { property: 'og:title', content: shareTitle },
    { property: 'og:description', content: page.description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: String(OG_IMAGE_WIDTH) },
    { property: 'og:image:height', content: String(OG_IMAGE_HEIGHT) },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: shareTitle },
    { name: 'twitter:description', content: page.description },
    { name: 'twitter:image', content: image },
    { name: 'twitter:image:alt', content: imageAlt },
  ];
  if (page.noindex) tags.push({ name: 'robots', content: 'noindex, follow' });
  for (const doc of page.jsonLd ?? []) tags.push({ 'script:ld+json': doc });
  return tags;
}

/** schema.org WebSite with its search, for the home page. */
export function siteJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_ORIGIN}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/** schema.org BreadcrumbList from [name, site path] pairs, outermost first. */
export function breadcrumbJsonLd(trail: [name: string, path: string][]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: absoluteUrl(path),
    })),
  };
}
