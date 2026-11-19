import { ArrowRight, Search as SearchIcon } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { resultPath, SearchResult } from '~/components/search/SearchResult';
import { searchIndex } from '~/lib/search';
import { useSearchIndex } from '~/lib/search-client';

// Results shown under the box; the rest are one click away on /search
const SHOWN = 6;
// Enough to say how many there are without ranking the whole database twice
const COUNT_LIMIT = 300;

// Searches that show what the index understands: a part number, a maker, a
// board family, a protocol, a colour arrangement, a connector
const EXAMPLES = ['WS2812B', 'Falcon', 'ESP32', 'sACN', 'RGBW', 'JST SM'];

const searchHref = (query: string) =>
  query ? `/search?q=${encodeURIComponent(query)}` : '/search';

/**
 * The home page's search box: results from every category as you type.
 *
 * It is a real form, so it works before the page's scripts have loaded
 * (Enter goes to /search?q=…), and the input is uncontrolled so text typed
 * that early is not wiped when React takes over.
 */
export function HomeSearch({ total }: { total: number }) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const navigate = useNavigate();
  // The index (41 kB) is fetched the first time the box is used
  const { index, failed } = useSearchIndex(focused || text !== '');

  const query = text.trim();
  const hits = useMemo(
    () => (index && query ? searchIndex(index, query, COUNT_LIMIT) : []),
    [index, query]
  );
  const shown = hits.slice(0, SHOWN);
  const count = hits.length === COUNT_LIMIT ? `${COUNT_LIMIT}+` : String(hits.length);

  // Arrow keys walk from the box down the results and back
  const focusResult = (position: number) => {
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>('a.search-result');
    if (!links || position < 0) inputRef.current?.focus();
    else links[Math.min(position, links.length - 1)]?.focus();
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = '';
    setText('');
    inputRef.current?.focus();
  };

  const status = !query
    ? ''
    : failed
      ? 'The search index could not be loaded.'
      : !index
        ? 'Searching…'
        : hits.length === 0
          ? `Nothing matches “${query}”.`
          : `${count} ${hits.length === 1 ? 'result' : 'results'}.`;

  return (
    <div className="home-search">
      <form
        className="home-search-form"
        role="search"
        action="/search"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(searchHref((inputRef.current?.value ?? '').trim()));
        }}
      >
        <label htmlFor="home-search-input" className="sr-only">
          Search every category
        </label>
        <SearchIcon size={20} aria-hidden="true" className="home-search-icon" />
        <input
          ref={inputRef}
          id="home-search-input"
          name="q"
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={`Search ${total} entries: a part number, a maker, a protocol…`}
          aria-controls="home-search-results"
          onFocus={() => setFocused(true)}
          onInput={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && shown.length > 0) {
              e.preventDefault();
              focusResult(0);
            } else if (e.key === 'Escape' && text) {
              e.preventDefault();
              clear();
            }
          }}
        />
        <button type="submit" className="btn btn--primary home-search-submit">
          Search
        </button>
      </form>

      <p className="sr-only" role="status">
        {status}
      </p>

      <div id="home-search-results" className="home-search-results">
        {query &&
          (shown.length > 0 ? (
            <>
              <ul ref={listRef} className="search-page-list home-search-list">
                {shown.map((hit, position) => (
                  <li key={`${hit.doc.c}/${hit.doc.i}`}>
                    <Link
                      className="search-result"
                      to={resultPath(hit.doc)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          focusResult(position + 1);
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          focusResult(position - 1);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          clear();
                        }
                      }}
                    >
                      <SearchResult doc={hit.doc} query={query} />
                    </Link>
                  </li>
                ))}
              </ul>
              <Link className="home-search-all" to={searchHref(query)}>
                {hits.length > SHOWN ? `See all ${count} results` : 'Open these in search'}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </>
          ) : (
            <p className="home-search-note">{status}</p>
          ))}
      </div>

      {!query && (
        <p className="home-search-examples">
          <span>Try</span>
          {EXAMPLES.map((example) => (
            <Link key={example} to={searchHref(example)} className="home-search-example">
              {example}
            </Link>
          ))}
        </p>
      )}
    </div>
  );
}
