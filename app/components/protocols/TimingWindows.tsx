import { useMemo, useState } from 'react';
import { HIGH_TIME_ROWS, type HighTimeRow } from '~/lib/protocols/reference';
import { Cite } from './Sources';

/** The axis runs 0–1200 ns; longer windows run off the right edge */
const AXIS_NS = 1200;
const TICKS = [0, 200, 400, 600, 800, 1000, 1200];
/** Where a measured WS2812B decides between 0 and 1 (cpldcpu, 2014) */
const BAND = { min: 563, max: 625 };

const pct = (ns: number) => `${(Math.min(ns, AXIS_NS) / AXIS_NS) * 100}%`;

interface Span {
  min: number;
  max: number;
}

/** A window as a span on the axis: open ends run to the edge */
function span(w: { min?: number; max?: number }): Span {
  return { min: w.min ?? 0, max: w.max ?? Infinity };
}

/** Both pulses given as single numbers: a nominal value, not a window */
function nominalOnly(row: HighTimeRow): boolean {
  return row.t0h.min === row.t0h.max && row.t1h.min === row.t1h.max;
}

function common(rows: HighTimeRow[], key: 't0h' | 't1h'): Span | null {
  if (rows.length === 0) return null;
  const min = Math.max(...rows.map((r) => span(r[key]).min));
  const max = Math.min(...rows.map((r) => span(r[key]).max));
  return min <= max ? { min, max } : null;
}

const fmt = (s: Span | null) =>
  !s
    ? 'none'
    : s.max === Infinity
      ? `${s.min} ns or more`
      : s.min === s.max
        ? `exactly ${s.min} ns`
        : `${s.min}–${s.max} ns`;

/**
 * Every datasheet's high-pulse windows for a 0 and a 1, side by side, with
 * where real chips decide and what real libraries send. Tap a datasheet to
 * leave it out of the common window.
 */
export function TimingWindows() {
  const datasheets = HIGH_TIME_ROWS.filter((r) => r.kind === 'datasheet');
  const [off, setOff] = useState<Set<string>>(() => new Set());
  // A sheet that prints only nominal values (no window) can't bound the
  // common window: every real pulse would miss an exact number
  const chosen = useMemo(
    () => datasheets.filter((r) => !off.has(r.id) && !nominalOnly(r)),
    [datasheets, off]
  );
  const nominal = datasheets.filter((r) => !off.has(r.id) && nominalOnly(r));
  const zero = common(chosen, 't0h');
  const one = common(chosen, 't1h');
  const toggle = (id: string) =>
    setOff((o) => {
      const next = new Set(o);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Which windows keep the 1 from having a common length
  const tightestOne = chosen.length
    ? {
        low: chosen.reduce((a, b) => (span(b.t1h).max < span(a.t1h).max ? b : a)),
        high: chosen.reduce((a, b) => (span(b.t1h).min > span(a.t1h).min ? b : a)),
      }
    : null;

  return (
    <figure className="proto-figure proto-windows">
      <div className="proto-windows-legend" aria-hidden="true">
        <span className="proto-key proto-key--0">a 0&rsquo;s high pulse</span>
        <span className="proto-key proto-key--1">a 1&rsquo;s high pulse</span>
        <span className="proto-key proto-key--band">where a measured WS2812B decides</span>
      </div>
      <div className="proto-windows-grid" role="group" aria-label="High-pulse windows by datasheet">
        <div className="proto-windows-axis" aria-hidden="true">
          {TICKS.map((t) => (
            <span key={t} style={{ left: pct(t) }}>
              {t}
            </span>
          ))}
        </div>
        {(['datasheet', 'decision', 'library'] as const).map((kind) => (
          <div key={kind} className="proto-windows-group">
            <div className="proto-windows-heading">
              {kind === 'datasheet'
                ? 'Datasheets (tap one to leave it out)'
                : kind === 'decision'
                  ? 'Where chips decide'
                  : 'What libraries send'}
            </div>
            {HIGH_TIME_ROWS.filter((r) => r.kind === kind).map((row) => {
              const excluded = off.has(row.id);
              const label = (
                <>
                  {row.label}
                  <Cite source={row.cite.source} />
                </>
              );
              return (
                <div key={row.id} className={`proto-windows-row${excluded ? ' is-off' : ''}`}>
                  {kind === 'datasheet' ? (
                    <div className="proto-windows-label">
                      <button
                        type="button"
                        className="proto-windows-toggle"
                        aria-pressed={!excluded}
                        onClick={() => toggle(row.id)}
                      >
                        {row.label}
                      </button>
                      <Cite source={row.cite.source} />
                    </div>
                  ) : (
                    <div className="proto-windows-label">{label}</div>
                  )}
                  <Bars row={row} />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <p className="proto-status" aria-live="polite">
        {chosen.length === 0
          ? 'Tap a datasheet to bring it back.'
          : `${chosen.length} datasheet${chosen.length === 1 ? '' : 's'} with windows: a 0 they all accept is ${fmt(zero)}; a 1 they all accept is ${fmt(one)}${
              !one && tightestOne
                ? ` (${tightestOne.low.label} ends a 1 by ${span(tightestOne.low.t1h).max} ns, ${tightestOne.high.label} starts it at ${span(tightestOne.high.t1h).min} ns)`
                : ''
            }.${nominal.length ? ` ${nominal.map((r) => r.label.replace(/\s*\(.*\)$/, '')).join(', ')} print${nominal.length === 1 ? 's' : ''} only nominal values, so ${nominal.length === 1 ? 'it is' : 'they are'} left out.` : ''}`}
      </p>
      <figcaption className="proto-caption">
        High-pulse windows from each datasheet, in nanoseconds. Read literally, they don&rsquo;t
        agree on a single 1. The documents that say how a chip actually decides (the maker&rsquo;s
        own rule for the UCS1904, and measurements of the WS2812B) both put the line between about
        0.55 and 0.69 µs, and every library&rsquo;s 0 sits well below it and every 1 well above.
      </figcaption>
    </figure>
  );
}

function Bars({ row }: { row: HighTimeRow }) {
  const zero = span(row.t0h);
  const one = span(row.t1h);
  return (
    <div className="proto-windows-track" aria-hidden="true">
      <span
        className="proto-windows-band"
        style={{ left: pct(BAND.min), width: `${((BAND.max - BAND.min) / AXIS_NS) * 100}%` }}
      />
      <Bar span={zero} kind="0" />
      <Bar span={one} kind="1" />
    </div>
  );
}

function Bar({ span: s, kind }: { span: Span; kind: '0' | '1' }) {
  const point = s.min === s.max;
  const open = { left: s.min === 0, right: s.max === Infinity || s.max > AXIS_NS };
  const left = point ? `calc(${pct(s.min)} - 3px)` : pct(s.min);
  const width = point ? '6px' : `${((Math.min(s.max, AXIS_NS) - s.min) / AXIS_NS) * 100}%`;
  return (
    <span
      className={`proto-windows-bar proto-windows-bar--${kind}${point ? ' is-point' : ''}${
        open.left ? ' is-open-left' : ''
      }${open.right ? ' is-open-right' : ''}`}
      style={{ left, width }}
    />
  );
}
