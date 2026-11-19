import { FileCode2, Flag, History, Link2, Pencil } from 'lucide-react';
import { copyText } from '~/lib/download';
import {
  absoluteUrl,
  editEntryUrl,
  entryHistoryUrl,
  entrySourcePath,
  newIssueUrl,
  repoFileUrl,
} from '~/lib/site';
import { toast } from '~/lib/toast';

/**
 * Copy the entry's own address: the canonical one on the production site,
 * whatever preview deployment or table state the reader came through.
 */
export function CopyLinkButton({
  path,
  className = 'btn btn--ghost btn--sm',
}: {
  path: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={async () => {
        const copied = await copyText(absoluteUrl(path));
        toast(copied ? 'Link copied' : 'Could not copy the link', copied ? 'info' : 'error');
      }}
    >
      <Link2 size={15} aria-hidden="true" />
      Copy link
    </button>
  );
}

/**
 * The foot of an entry page: where its data lives and how to change it.
 *
 * The spreadsheet let anyone edit in place, which is also how it got
 * vandalized. Here every change is a reviewed pull request, so the way in has
 * to sit right where a mistake gets noticed.
 */
export function EntryContribute({
  categoryId,
  entryId,
  name,
  path,
}: {
  categoryId: string;
  entryId: string;
  name: string;
  /** Site path of the entry page */
  path: string;
}) {
  const external = { target: '_blank', rel: 'noopener noreferrer' } as const;
  return (
    <aside className="entry-contribute" aria-labelledby="entry-contribute-title">
      <div className="entry-contribute-text">
        <h2 id="entry-contribute-title">Something wrong or missing?</h2>
        <p>
          This page is built from one small YAML file. Changes are reviewed before they go live, so
          you can’t break anything by suggesting one.
        </p>
      </div>
      <div className="entry-contribute-actions">
        <a
          className="btn btn--outline btn--sm"
          href={editEntryUrl(categoryId, entryId)}
          {...external}
        >
          <Pencil size={14} aria-hidden="true" />
          Suggest an edit
        </a>
        <a
          className="btn btn--outline btn--sm"
          href={newIssueUrl({
            template: '1-correction.yml',
            title: `Correction: ${name}`,
            entry: absoluteUrl(path),
          })}
          {...external}
        >
          <Flag size={14} aria-hidden="true" />
          Report a problem
        </a>
        <a
          className="btn btn--ghost btn--sm"
          href={repoFileUrl(entrySourcePath(categoryId, entryId))}
          {...external}
        >
          <FileCode2 size={14} aria-hidden="true" />
          Source
        </a>
        <a
          className="btn btn--ghost btn--sm"
          href={entryHistoryUrl(categoryId, entryId)}
          {...external}
        >
          <History size={14} aria-hidden="true" />
          History
        </a>
      </div>
    </aside>
  );
}
