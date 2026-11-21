import { Fragment } from 'react';
import { ALL_CITATIONS, SOURCES, type SourceId } from '~/lib/protocols/reference';

const ORDER = Object.keys(SOURCES) as SourceId[];

/** The footnote number of a source: its place in the sources list */
export function sourceNumber(id: SourceId): number {
  return ORDER.indexOf(id) + 1;
}

/** Superscript links to one or more entries in the sources list */
export function Cite({ source }: { source: SourceId | SourceId[] }) {
  const ids = Array.isArray(source) ? source : [source];
  return (
    <sup className="proto-cite">
      {ids.map((id, i) => (
        <Fragment key={id}>
          {i > 0 && ','}
          <a href={`#src-${id}`} aria-label={`Source ${sourceNumber(id)}: ${SOURCES[id].title}`}>
            {sourceNumber(id)}
          </a>
        </Fragment>
      ))}
    </sup>
  );
}

/**
 * Every document the page relies on, numbered as the footnotes are, each
 * with the exact words the page takes from it behind a tap.
 */
export function SourcesList() {
  return (
    <ol className="proto-sources">
      {ORDER.map((id) => {
        const source = SOURCES[id];
        const quotes = ALL_CITATIONS.filter((c) => c.source === id);
        return (
          <li key={id} id={`src-${id}`}>
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {source.title}
            </a>
            . {source.publisher}
            {'revision' in source && source.revision ? `, ${source.revision}` : ''}. Read{' '}
            {source.retrieved}.
            {quotes.length > 0 && (
              <details className="proto-quotes">
                <summary>
                  What it says ({quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'})
                </summary>
                <ul>
                  {quotes.map((q, i) => (
                    <li key={i}>
                      <span className="proto-quote-where">{q.where}:</span>{' '}
                      <q className="proto-quote">{q.quote}</q>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </li>
        );
      })}
    </ol>
  );
}
