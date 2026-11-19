import { imageUrl } from '~/lib/images';
import { highlightParts, type SearchDoc } from '~/lib/search';
import { CATEGORIES } from '~/lib/types';

export function categoryOf(doc: SearchDoc) {
  return CATEGORIES.find((category) => category.id === doc.c);
}

/** Where a result goes. */
export function resultPath(doc: SearchDoc): string {
  return `${categoryOf(doc)?.path ?? `/${doc.c}`}/${doc.i}`;
}

/** Text with the matched parts of the query marked. */
export function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, i) =>
        part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>
      )}
    </>
  );
}

/**
 * The inside of one search result: thumbnail, name, maker, a few facts and
 * the category it lives in. The caller supplies the link / option wrapper.
 */
export function SearchResult({ doc, query }: { doc: SearchDoc; query: string }) {
  const category = categoryOf(doc);
  return (
    <>
      <span className="search-result-thumb" aria-hidden="true">
        {doc.img && (
          <img src={imageUrl(doc.c, doc.img, 'sm')} alt="" loading="lazy" decoding="async" />
        )}
      </span>
      <span className="search-result-main">
        <span className="search-result-title">
          <span className="search-result-name">
            <Highlighted text={doc.n} query={query} />
          </span>
          {doc.b && <span className="search-result-maker">{doc.b}</span>}
          {doc.s && <span className="search-result-status">{doc.s}</span>}
        </span>
        {doc.k && <span className="search-result-facts">{doc.k}</span>}
      </span>
      {category && (
        <span
          className="search-result-category"
          style={{ '--chip-hue': category.color.hue } as React.CSSProperties}
        >
          {category.name}
        </span>
      )}
    </>
  );
}
