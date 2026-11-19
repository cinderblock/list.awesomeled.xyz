import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ClipboardCopy, Download, FileDown, Link2, Share2 } from 'lucide-react';
import { copyText, downloadText } from '~/lib/download';
import {
  buildMatrix,
  exportDocument,
  exportFilename,
  matrixToCSV,
  matrixToHTML,
  matrixToMarkdown,
  matrixToTSV,
} from '~/lib/export';
import { absoluteUrl } from '~/lib/site';
import { toast } from '~/lib/toast';
import type { BaseEntry } from '~/lib/types';
import type { TableColumn } from './table-columns';

interface ExportMenuProps {
  category: { id: string; name: string; path: string };
  /** The rows on screen, in their current order */
  rows: BaseEntry[];
  /** Total rows in the category */
  total: number;
  visibleColumns: TableColumn[];
  allColumns: TableColumn[];
  /** Current view state, for filenames */
  state: { q?: string; sort?: string | null; filters?: string[] };
}

const exportable = (columns: TableColumn[]) =>
  columns.filter((c) => c.key !== 'links').map((c) => ({ label: c.label, text: c.text }));

/**
 * Take the current view somewhere else: copy a link to it, copy the rows as a
 * table (for a spreadsheet, or as Markdown for a forum post), or download
 * them as CSV / JSON / YAML.
 */
export function ExportMenu({
  category,
  rows,
  total,
  visibleColumns,
  allColumns,
  state,
}: ExportMenuProps) {
  const scope = rows.length === total ? `all ${total}` : `${rows.length} of ${total}`;
  const noun = rows.length === 1 ? 'entry' : 'entries';

  const copy = async (text: string, what: string, html?: string) => {
    const ok = await copyText(text, html);
    toast(
      ok ? `Copied ${what}` : 'Could not copy — your browser blocked it',
      ok ? 'info' : 'error'
    );
  };

  const copyLink = () => copy(window.location.href, 'a link to this view');

  const copyTable = (format: 'tsv' | 'markdown') => {
    const matrix = buildMatrix(rows, exportable(visibleColumns));
    if (format === 'tsv') {
      copy(matrixToTSV(matrix), `${rows.length} ${noun} for a spreadsheet`, matrixToHTML(matrix));
    } else {
      copy(matrixToMarkdown(matrix), `${rows.length} ${noun} as Markdown`);
    }
  };

  const downloadCSV = (columns: TableColumn[]) => {
    const csv = matrixToCSV(buildMatrix(rows, exportable(columns)));
    downloadText(exportFilename(category.id, state, 'csv'), csv, 'text/csv');
  };

  const source = () =>
    absoluteUrl(`${category.path}${typeof window === 'undefined' ? '' : window.location.search}`);

  const downloadJSON = () => {
    const doc = exportDocument(source(), category, rows);
    downloadText(
      exportFilename(category.id, state, 'json'),
      JSON.stringify(doc, null, 2),
      'application/json'
    );
  };

  const downloadYAML = async () => {
    // The YAML library is only needed here: load it on demand
    const { stringify } = await import('yaml');
    const doc = exportDocument(source(), category, rows);
    downloadText(exportFilename(category.id, state, 'yaml'), stringify(doc), 'application/yaml');
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="btn btn--outline btn--sm" aria-label="Share and export">
          <Share2 size={16} />
          <span className="btn-label">Share &amp; export</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu" sideOffset={5} align="end" collisionPadding={8}>
          <DropdownMenu.Label className="menu-label">
            {scope} {noun}, as shown
          </DropdownMenu.Label>
          <DropdownMenu.Item className="menu-item" onSelect={copyLink}>
            <Link2 size={15} />
            Copy link to this view
          </DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item" onSelect={() => copyTable('tsv')}>
            <ClipboardCopy size={15} />
            Copy for a spreadsheet
          </DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item" onSelect={() => copyTable('markdown')}>
            <ClipboardCopy size={15} />
            Copy as a Markdown table
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="menu-separator" />
          <DropdownMenu.Label className="menu-label">Download</DropdownMenu.Label>
          <DropdownMenu.Item className="menu-item" onSelect={() => downloadCSV(visibleColumns)}>
            <Download size={15} />
            CSV — the columns shown
          </DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item" onSelect={() => downloadCSV(allColumns)}>
            <Download size={15} />
            CSV — every field
          </DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item" onSelect={downloadJSON}>
            <FileDown size={15} />
            JSON — full records
          </DropdownMenu.Item>
          <DropdownMenu.Item className="menu-item" onSelect={downloadYAML}>
            <FileDown size={15} />
            YAML — full records
          </DropdownMenu.Item>
          <DropdownMenu.Arrow className="menu-arrow" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
