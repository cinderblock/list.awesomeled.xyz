import { useState } from 'react';
import { Link } from 'react-router';
import { ClipboardCopy, FileSpreadsheet, ReceiptText } from 'lucide-react';
import {
  bomSummary,
  bomToCsv,
  bomToMarkdown,
  bomToText,
  designQuery,
  fmtInt,
  fmtUsd,
  type Analysis,
  type BomLine,
} from '~/lib/designer';
import { SITE_ORIGIN } from '~/lib/site';
import { canonicalDesignUrl, copyText, downloadBlob, fileSlug } from './browser';

function qty(line: BomLine): string {
  return line.unit ? `${fmtInt(line.qty)} ${line.unit}` : fmtInt(line.qty);
}

function unitPrice(line: BomLine): string {
  if (line.unitUSD != null) {
    const usd = fmtUsd(line.unitUSD);
    return line.priceText ? `${line.priceText} (≈ ${usd})` : usd;
  }
  return line.priceText ?? '—';
}

export function BomTable({ analysis }: { analysis: Analysis }) {
  const { bom, design } = analysis;
  const [copied, setCopied] = useState<string | null>(null);
  const parts = bom.lines.filter((l) => l.section === 'parts');
  const extras = bom.lines.filter((l) => l.section === 'extras');
  const title = design.title || 'LED system';

  const exportOptions = () => ({
    title,
    origin: SITE_ORIGIN,
    url: canonicalDesignUrl(designQuery(design)),
  });
  const copy = async (kind: 'Markdown' | 'text') => {
    const text =
      kind === 'Markdown' ? bomToMarkdown(bom, exportOptions()) : bomToText(bom, exportOptions());
    const ok = await copyText(text);
    setCopied(ok ? `Copied as ${kind}` : 'Copy failed: your browser blocked clipboard access');
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <section
      className="designer-card designer-bom"
      id="designer-bom"
      aria-labelledby="designer-bom-title"
    >
      <h2 className="designer-card-title" id="designer-bom-title">
        <ReceiptText size={16} aria-hidden="true" /> Parts list
      </h2>

      {parts.length === 0 ? (
        <p className="designer-empty">Parts you choose are listed here with prices where known.</p>
      ) : (
        <>
          <table className="designer-table designer-bom-table">
            <thead>
              <tr>
                <th scope="col" className="designer-num">
                  Qty
                </th>
                <th scope="col">Part</th>
                <th scope="col" className="designer-num designer-bom-each">
                  Each
                </th>
                <th scope="col" className="designer-num">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {parts.map((line) => (
                <tr key={line.key} data-key={line.key}>
                  <td className="designer-num">{qty(line)}</td>
                  <th scope="row">
                    <small className="designer-bom-category">{line.category}</small>
                    {line.path ? <Link to={line.path}>{line.name}</Link> : line.name}
                    {line.detail && <small>{line.detail}</small>}
                    {/* Phones drop the Each column; the unit price moves in here */}
                    {line.qty > 1 && (
                      <small className="designer-bom-each-inline">{unitPrice(line)} each</small>
                    )}
                    {line.priceNote && (
                      <small className="designer-bom-note">{line.priceNote}</small>
                    )}
                  </th>
                  <td className="designer-num designer-bom-each">{unitPrice(line)}</td>
                  <td className="designer-num">
                    {line.totalUSD != null ? fmtUsd(line.totalUSD) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2}>
                  Estimated total
                </th>
                <td className="designer-bom-each" />
                <td className="designer-num" data-testid="bom-total">
                  {bom.priced > 0 ? fmtUsd(bom.totalUSD) : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
          <p className="designer-footnote">
            {bomSummary(bom)}. Prices are the ones recorded in the database, in US dollars; check
            each part’s page for where and when the price was read.
          </p>
        </>
      )}

      {extras.length > 0 && (
        <>
          <h3 className="designer-subtitle">Also needed</h3>
          <ul className="designer-extras">
            {extras.map((line) => (
              <li key={line.key} data-key={line.key}>
                <strong>
                  {qty(line)} × {line.name}
                </strong>
                {line.detail && <small> — {line.detail}</small>}
              </li>
            ))}
          </ul>
          <p className="designer-footnote">
            Sized by the power plan above. The database doesn’t list supplies, fuses or wire, so
            these aren’t priced.
          </p>
        </>
      )}

      {bom.lines.length > 0 && (
        <div className="designer-actions designer-no-print">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => copy('Markdown')}
          >
            <ClipboardCopy size={14} aria-hidden="true" /> Copy as Markdown
          </button>
          <button type="button" className="btn btn--outline btn--sm" onClick={() => copy('text')}>
            <ClipboardCopy size={14} aria-hidden="true" /> Copy as text
          </button>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() =>
              downloadBlob(
                new Blob([bomToCsv(bom, exportOptions())], { type: 'text/csv;charset=utf-8' }),
                `${fileSlug(design.title)}-parts.csv`
              )
            }
          >
            <FileSpreadsheet size={14} aria-hidden="true" /> Download CSV
          </button>
          <span className="designer-feedback" role="status">
            {copied}
          </span>
        </div>
      )}
    </section>
  );
}
