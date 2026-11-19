import { describe, expect, test } from 'bun:test';
import { breadcrumbJsonLd, pageMeta, pageTitle, siteJsonLd } from '../../app/lib/meta';
import { asLinkRecord } from '../../app/lib/url-label';

type Tag = Record<string, unknown>;

const find = (tags: Tag[], key: string, value: string) =>
  tags.find((tag) => tag[key] === value) as Tag | undefined;

describe('pageMeta', () => {
  const tags = pageMeta({
    title: 'Falcon F16V4 - Controllers',
    description: 'A pixel controller.',
    path: '/controllers/falcon-f16v4',
    image: '/og/controllers/falcon-f16v4.jpg',
  }) as Tag[];

  test('the title carries the site name; the share title does not repeat it', () => {
    expect(tags[0]).toEqual({ title: 'Falcon F16V4 - Controllers - Awesome LED List' });
    expect(find(tags, 'property', 'og:title')?.content).toBe('Falcon F16V4 - Controllers');
    expect(find(tags, 'property', 'og:site_name')?.content).toBe('Awesome LED List');
  });

  test('canonical and og:url are absolute, on the production origin', () => {
    expect(find(tags, 'rel', 'canonical')).toEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://list.awesomeled.xyz/controllers/falcon-f16v4',
    });
    expect(find(tags, 'property', 'og:url')?.content).toBe(
      'https://list.awesomeled.xyz/controllers/falcon-f16v4'
    );
  });

  test('the preview image is absolute, with its size and a large-card hint', () => {
    expect(find(tags, 'property', 'og:image')?.content).toBe(
      'https://list.awesomeled.xyz/og/controllers/falcon-f16v4.jpg'
    );
    expect(find(tags, 'property', 'og:image:width')?.content).toBe('1200');
    expect(find(tags, 'property', 'og:image:height')?.content).toBe('630');
    expect(find(tags, 'name', 'twitter:card')?.content).toBe('summary_large_image');
    expect(find(tags, 'name', 'twitter:image')?.content).toBe(
      'https://list.awesomeled.xyz/og/controllers/falcon-f16v4.jpg'
    );
  });

  test('the description is repeated for link previews', () => {
    for (const [key, value] of [
      ['name', 'description'],
      ['property', 'og:description'],
      ['name', 'twitter:description'],
    ]) {
      expect(find(tags, key, value)?.content).toBe('A pixel controller.');
    }
  });

  test('pages are indexable unless they say otherwise', () => {
    expect(find(tags, 'name', 'robots')).toBeUndefined();
    const hidden = pageMeta({ description: 'x', path: '/search', noindex: true }) as Tag[];
    expect(find(hidden, 'name', 'robots')?.content).toBe('noindex, follow');
  });

  test('a page without an image of its own gets the site card', () => {
    const plain = pageMeta({ title: 'About', description: 'x', path: '/about' }) as Tag[];
    expect(find(plain, 'property', 'og:image')?.content).toBe(
      'https://list.awesomeled.xyz/og/site.jpg'
    );
  });

  test('a page may word its whole title', () => {
    const home = pageMeta({
      fullTitle: 'Awesome LED List: all of it',
      description: 'x',
      path: '/',
    });
    expect(home[0]).toEqual({ title: 'Awesome LED List: all of it' });
    expect(find(home as Tag[], 'property', 'og:title')?.content).toBe('Awesome LED List');
    expect(pageTitle()).toBe('Awesome LED List');
    expect(pageTitle('About')).toBe('About - Awesome LED List');
  });

  test('structured data rides along as ld+json', () => {
    const withData = pageMeta({
      description: 'x',
      path: '/',
      jsonLd: [siteJsonLd(), breadcrumbJsonLd([['Awesome LED List', '/']])],
    }) as Tag[];
    const docs = withData.filter((tag) => 'script:ld+json' in tag).map((t) => t['script:ld+json']);
    expect(docs).toHaveLength(2);
    expect((docs[0] as Tag)['@type']).toBe('WebSite');
  });
});

describe('structured data', () => {
  test('breadcrumbs number from one and use absolute addresses', () => {
    const crumbs = breadcrumbJsonLd([
      ['Awesome LED List', '/'],
      ['Controllers', '/controllers'],
    ]) as { itemListElement: { position: number; name: string; item: string }[] };
    expect(crumbs.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Awesome LED List',
        item: 'https://list.awesomeled.xyz/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Controllers',
        item: 'https://list.awesomeled.xyz/controllers',
      },
    ]);
  });

  test('the site offers its search page as a search action', () => {
    const site = siteJsonLd() as { potentialAction: { target: { urlTemplate: string } } };
    expect(site.potentialAction.target.urlTemplate).toBe(
      'https://list.awesomeled.xyz/search?q={search_term_string}'
    );
  });
});

describe('asLinkRecord', () => {
  test('a link with a kind and a note is one record', () => {
    expect(
      asLinkRecord({ url: 'https://example.com/a.pdf', host: 'distributor', notes: 'rev 02' })
    ).toEqual({
      href: 'https://example.com/a.pdf',
      name: undefined,
      host: 'distributor',
      notes: 'rev 02',
    });
  });

  test('a named place prefers its product page', () => {
    expect(
      asLinkRecord({
        name: 'Adafruit',
        url: 'https://adafruit.com',
        page: 'https://adafruit.com/p/1',
      })
    ).toMatchObject({ href: 'https://adafruit.com/p/1', name: 'Adafruit' });
  });

  test('records with other fields, or without a web address, are left alone', () => {
    expect(asLinkRecord({ url: 'https://example.com', retrieved: '2026-01-01' })).toBeNull();
    expect(asLinkRecord({ name: 'Acme' })).toBeNull();
    expect(asLinkRecord({ url: 'see the box' })).toBeNull();
    expect(asLinkRecord({ url: 'https://example.com', pins: 4 })).toBeNull();
    expect(asLinkRecord('https://example.com')).toBeNull();
    expect(asLinkRecord(['https://example.com'])).toBeNull();
    expect(asLinkRecord(null)).toBeNull();
  });

  test('empty fields do not disqualify a record', () => {
    expect(asLinkRecord({ url: 'https://example.com', notes: null })).toMatchObject({
      href: 'https://example.com',
    });
  });
});
