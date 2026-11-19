import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { queryFromPath, searchIndex } from '~/lib/search';
import { openSearch, useSearchIndex } from '~/lib/search-client';
import { CATEGORIES } from '~/lib/types';
import { resultPath, SearchResult } from './SearchResult';

/**
 * The page for a URL that leads nowhere. Entries get renamed and links get
 * mistyped, so instead of a dead end it searches for what the address seems
 * to be asking for and offers the closest entries.
 */
export function NotFound() {
  const { pathname } = useLocation();
  const query = queryFromPath(pathname);
  const { index } = useSearchIndex(query !== '');
  const suggestions = useMemo(
    () => (index && query ? searchIndex(index, query, 6) : []),
    [index, query]
  );

  return (
    <div className="container page-section">
      <div className="not-found">
        <p className="not-found-code">404</p>
        <h1 className="not-found-title">There is nothing at this address</h1>
        <p className="not-found-text">
          The page may have been renamed, or the link may be mistyped.
        </p>

        {suggestions.length > 0 && (
          <section className="not-found-suggestions" aria-label="Closest entries">
            <h2>Were you looking for one of these?</h2>
            <ul className="search-page-list">
              {suggestions.map((hit) => (
                <li key={`${hit.doc.c}/${hit.doc.i}`}>
                  <Link className="search-result" to={resultPath(hit.doc)}>
                    <SearchResult doc={hit.doc} query={query} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="not-found-actions">
          <button type="button" className="btn btn--primary" onClick={() => openSearch(query)}>
            <Search size={16} />
            Search the whole list
          </button>
          <Link to="/" className="btn btn--outline">
            Go to the home page
          </Link>
        </div>

        <nav className="not-found-categories" aria-label="Categories">
          {CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={category.path}
              className="search-result-category"
              style={{ '--chip-hue': category.color.hue } as React.CSSProperties}
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
