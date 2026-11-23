import { Gauge } from 'lucide-react';
import { Fragment } from 'react';
import { MoreInfo } from '~/components/ui/MoreInfo';
import { urlLabel } from '~/lib/url-label';
import { FieldValue } from '~/components/data/FieldValue';
import { getPath, type FieldMeta } from '~/lib/fields';
import { measurementsOf, type Measurement } from '~/lib/types';

/**
 * Datasheet vs measured values (common.json#/definitions/measurements).
 *
 * A field holds the maker's spec; `measurements[path]` holds what people got
 * on real parts. Wherever both are shown they look the same: one line per
 * value, each led by a tag, Datasheet first. Entry pages show the lines in
 * place; table and compare cells keep the datasheet value and add a gauge
 * mark that opens the same lines.
 */

export function SpecTag({ kind }: { kind: 'datasheet' | 'measured' }) {
  return (
    <span className={`spec-tag spec-tag--${kind}`}>
      {kind === 'datasheet' ? 'Datasheet' : 'Measured'}
    </span>
  );
}

/** "Datasheet 15mA" */
export function DatasheetLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="spec-line">
      <SpecTag kind="datasheet" />
      <span className="spec-line-value">{children}</span>
    </div>
  );
}

/** "Measured 10mA · 3 LEDs in series at 12V · cpldcpu, 2016-03-09 · write-up" */
export function MeasurementLine({ m, children }: { m: Measurement; children: React.ReactNode }) {
  const who = [m.by, m.date].filter(Boolean).join(', ');
  const meta: React.ReactNode[] = [];
  if (m.conditions) meta.push(m.conditions);
  if (who) meta.push(who);
  if (m.url) {
    meta.push(
      <a href={m.url} target="_blank" rel="noopener noreferrer">
        {urlLabel(m.url)}
      </a>
    );
  }
  return (
    <div className="spec-line">
      <SpecTag kind="measured" />
      <span className="spec-line-value">{children}</span>
      {meta.length > 0 && (
        <span className="spec-line-meta">
          {meta.map((part, i) => (
            <Fragment key={i}>
              {i > 0 && ' · '}
              {part}
            </Fragment>
          ))}
        </span>
      )}
      {m.notes && <span className="spec-line-notes">{m.notes}</span>}
    </div>
  );
}

/**
 * The gauge mark after a table or compare cell whose field has measurements.
 * Tapping it shows the datasheet value and each measurement, as on the entry
 * page. Renders nothing when there are none.
 */
export function MeasuredMark({
  measurements,
  label,
  datasheet,
  renderValue,
}: {
  measurements: Measurement[];
  /** The field's name, for screen readers */
  label: string;
  /** The cell's own (datasheet) value, rendered */
  datasheet: React.ReactNode;
  renderValue: (value: unknown) => React.ReactNode;
}) {
  if (measurements.length === 0) return null;
  return (
    <MoreInfo
      label={<Gauge size={12} aria-hidden="true" />}
      ariaLabel={`Measured ${label}`}
      className="more-info--measured"
    >
      <div className="spec-lines">
        <DatasheetLine>{datasheet}</DatasheetLine>
        {measurements.map((m, i) => (
          <MeasurementLine key={i} m={m}>
            {renderValue(m.value)}
          </MeasurementLine>
        ))}
      </div>
    </MoreInfo>
  );
}

/**
 * A table or compare cell, with the gauge mark after it when the entry has
 * measurements of the column's field. Values in the popover render like the
 * field's own (units styled), or as plain text for a column with no field.
 */
export function WithMeasuredMark({
  item,
  columnKey,
  field,
  label,
  children,
}: {
  item: unknown;
  columnKey: string;
  field?: FieldMeta;
  label: string;
  children: React.ReactNode;
}) {
  const measured = measurementsOf(item, columnKey);
  if (measured.length === 0) return <>{children}</>;
  const render = (v: unknown) => (field ? <FieldValue field={field} value={v} /> : String(v));
  return (
    <span className="field-with-note">
      {children}
      <MeasuredMark
        measurements={measured}
        label={label}
        datasheet={render(getPath(item, columnKey))}
        renderValue={render}
      />
    </span>
  );
}
