import { Fragment } from 'react';
import { urlLabel, type LinkRecordValue } from '~/lib/url-label';

/**
 * A link's short label (host › last path part), allowed to wrap after its
 * dots, dashes and slashes before it is ever broken mid-word. <wbr> rather
 * than zero-width spaces, so copying the text gives the text.
 */
export function UrlText({ url }: { url: string }) {
  // Runs of text, each ending with the punctuation it may wrap after (no
  // lookbehind: older Safari cannot parse one)
  const parts = (urlLabel(url).match(/[^./_\-›]*[./_\-›]?/g) ?? []).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <wbr />}
          {part}
        </Fragment>
      ))}
    </>
  );
}

export function LinkRecord({ record }: { record: LinkRecordValue }) {
  return (
    <span className="entry-link-record">
      <a href={record.href} target="_blank" rel="noopener noreferrer" className="entry-value-link">
        {record.name ?? <UrlText url={record.href} />}
      </a>
      {record.host && <span className="entry-link-record-host">{record.host}</span>}
      {record.notes && <span className="entry-link-record-notes">{record.notes}</span>}
    </span>
  );
}
