import { Search as SearchIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { PageWrapper } from '~/components/layout/PageWrapper';
import { useHydrated } from '~/hooks/useHydrated';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { resultPath, SearchResult } from '~/components/search/SearchResult';
import { searchIndex, type SearchHit } from '~/lib/search';
import { useSearchIndex } from '~/lib/search-client';
import { CATEGORIES } from '~/lib/types';
import type { Route } from './+types/search';

// More than anyone will read, few enough to render instantly
const RESULT_LIMIT = 300;

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Search - Awesome LED List' },
    {
      name: 'description',
      content: 'Search every category of the Awesome LED List at once.',
    },
    // Result pages are not content: keep them out of search engines
    { name: 'robots', content: 'noindex, follow' },
  ];
}

/**
 * /search?q=… — every match across all categories, grouped by category.
 * The same engine as the Ctrl/⌘+K palette, with room for the full list and a
 * URL that can be shared.
 */
export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  // The page is prerendered without a query: hydrate that way, then read ?q=
  const hydrated = useHydrated();
  const urlQuery = hydrated ? (searchParams.get('q') ?? '') : '';
  const [text, setText] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { index, failed } = useSearchIndex(true);

  // Follow the URL when it changes from outside (back button, a link)
  const [seenQuery, setSeenQuery] = useState(urlQuery);
  if (seenQuery !== urlQuery) {
    setSeenQuery(urlQuery);
    if (text.trim() !== urlQuery) setText(urlQuery);
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const onChange = (value: string) => {
    setText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const q = value.trim();
      setSearchParams(q ? { q } : {}, { replace: true });
    }, 200);
  };

  const query = text.trim();
  const hits = useMemo(
    () => (index && query ? searchIndex(index, query, RESULT_LIMIT) : []),
    [index, query]
  );

  // Categories in order of their best hit
  const groups = useMemo(() => {
    const byCategory = new Map<string, SearchHit[]>();
    for (const hit of hits) {
      const list = byCategory.get(hit.doc.c);
      if (list) list.push(hit);
      else byCategory.set(hit.doc.c, [hit]);
    }
    return [...byCategory.entries()]
      .map(([id, list]) => ({ category: CATEGORIES.find((c) => c.id === id), hits: list }))
      .filter((group) => group.category)
      .sort((a, b) => b.hits[0].score - a.hits[0].score);
  }, [hits]);

  return (
    <PageWrapper>
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Search' }]} />

      <header className="page-header">
        <h1 className="page-title">Search</h1>
        <div className="search-page-input">
          <SearchIcon size={18} aria-hidden="true" />
          <input
            type="search"
            // The page exists to be typed into
            autoFocus
            aria-label="Search every category"
            placeholder="A part number, a maker, a protocol…"
            autoComplete="off"
            spellCheck={false}
            value={text}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <p className="search-page-status" aria-live="polite">
          {failed
            ? 'The search index could not be loaded. Check your connection and reload.'
            : !index
              ? 'Loading the index…'
              : !query
                ? `${index.docs.length} entries in ${CATEGORIES.length} categories.`
                : hits.length === 0
                  ? `Nothing matches “${query}”.`
                  : `${hits.length === RESULT_LIMIT ? `${RESULT_LIMIT}+` : hits.length} ${
                      hits.length === 1 ? 'result' : 'results'
                    } in ${groups.length} ${groups.length === 1 ? 'category' : 'categories'}.`}
        </p>
      </header>

      {groups.map(({ category, hits: categoryHits }) => (
        <section
          key={category!.id}
          className="search-page-group"
          style={{ '--chip-hue': category!.color.hue } as React.CSSProperties}
        >
          <h2 className="search-page-group-title">
            <Link to={category!.path}>{category!.name}</Link>
            <span className="search-page-group-count">{categoryHits.length}</span>
            <Link
              className="search-page-group-table"
              to={`${category!.path}?q=${encodeURIComponent(query)}`}
            >
              Open in the table
            </Link>
          </h2>
          <ul className="search-page-list">
            {categoryHits.map((hit) => (
              <li key={hit.doc.i}>
                <Link className="search-result" to={resultPath(hit.doc)}>
                  <SearchResult doc={hit.doc} query={query} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {index && !query && (
        <ul className="search-page-categories">
          {CATEGORIES.map((category) => (
            <li key={category.id}>
              <Link
                to={category.path}
                className="search-result-category"
                style={{ '--chip-hue': category.color.hue } as React.CSSProperties}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageWrapper>
  );
}
