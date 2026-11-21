import { useMemo, useState } from 'react';
import {
  apa102LedFrame,
  irregularPeriods,
  rgbCss,
  type Bit,
  type Rgb,
} from '~/lib/protocols/signals';
import { AnimatedFigure } from './Figure';
import { useTimeline } from './useTimeline';

const COLOUR: Rgb = { r: 255, g: 140, b: 0 };
const BRIGHTNESS = 31;

const ROW_LABELS: Record<string, string> = {
  header: 'Header',
  r: 'Red',
  g: 'Green',
  b: 'Blue',
};

const LEFT = 64;
const ROW_W = 8 * 44;
const ROW_H = 74;
/** Room above the first row for its field labels */
const TOP = 14;
const CLK_HIGH = 6;
const CLK_LOW = 22;
const DATA_HIGH = 32;
const DATA_LOW = 48;
const WIDTH = LEFT + ROW_W + 8;
/** Animation seconds per nominal clock period */
const SECONDS_PER_PERIOD = 0.32;

interface Row {
  key: string;
  channel: string;
  bits: Bit[];
  /** Start of each bit and the end of the last, in nominal periods from the frame start */
  edges: number[];
}

/**
 * One APA102-style LED frame as clock and data: the receiver reads the data
 * line at every rising clock edge (the dots), so it doesn't matter how long
 * each bit lasts. "Irregular clock" stretches some bits the way a busy
 * controller would, and the pixel reads the same colour.
 */
export function ClockedBits({ order, part }: { order: string; part: string }) {
  const [irregular, setIrregular] = useState(false);
  const rows = useMemo<Row[]>(() => {
    const fields = apa102LedFrame(COLOUR, BRIGHTNESS, order);
    // First byte: the three marker bits and the brightness; then one byte per colour
    const header: Bit[] = [...fields[0].bits, ...fields[1].bits];
    const bytes = [
      { key: 'header', channel: 'header', bits: header },
      ...fields.slice(2).map((f) => ({ key: f.field, channel: f.field, bits: f.bits })),
    ];
    const periods = irregular ? irregularPeriods(32, 1) : Array<number>(32).fill(1);
    let t = 0;
    return bytes.map((b, row) => {
      const edges = [t];
      for (let i = 0; i < 8; i++) {
        t += periods[row * 8 + i];
        edges.push(t);
      }
      return { ...b, edges };
    });
  }, [irregular, order]);

  const totalPeriods = rows[rows.length - 1].edges[8];
  const duration = totalPeriods * SECONDS_PER_PERIOD + 2.5;
  const timeline = useTimeline({ duration, initial: duration - 1 });
  const now = timeline.time / SECONDS_PER_PERIOD;
  // A bit is read at its rising edge, halfway through its clock period
  const sampled = rows.flatMap((r) => r.bits.map((_, i) => (r.edges[i] + r.edges[i + 1]) / 2));
  const read = sampled.filter((s) => s <= now).length;
  const allBits = rows.flatMap((r) => r.bits);

  const status =
    read >= allBits.length
      ? `Frame complete: brightness ${BRIGHTNESS} of 31, then ${rows
          .slice(1)
          .map((r) => `${ROW_LABELS[r.channel].toLowerCase()} ${byteValue(r.bits)}`)
          .join(', ')}${irregular ? ', the same as with a steady clock' : ''}.`
      : read === 0
        ? 'The clock line ticks; the data line holds each bit until the next tick.'
        : `Bit ${read} of 32 read at a rising clock edge: ${allBits[read - 1]}.`;

  return (
    <AnimatedFigure
      timeline={timeline}
      label={`Clock and data lines carrying one ${part} LED frame: a three-bit header, five brightness bits, then ${order.split('').join(', ')}`}
      status={status}
      onStep={() => {
        const next = read >= sampled.length ? 0 : read;
        timeline.seek(sampled[next] * SECONDS_PER_PERIOD + 0.001);
      }}
      stepLabel="Next bit"
      extraControls={
        <label className="proto-toggle">
          <input
            type="checkbox"
            checked={irregular}
            onChange={(e) => {
              setIrregular(e.target.checked);
              timeline.seek(0);
              timeline.play();
            }}
          />
          Irregular clock
        </label>
      }
      caption={
        <>
          One 32-bit {part} frame: <code>111</code> marker, 5-bit brightness, then {order}. Dots
          mark rising-edge samples; toggle <em>Irregular clock</em> to test a jittery sender.
        </>
      }
    >
      <div className="proto-bits">
        <svg
          viewBox={`0 0 ${WIDTH} ${TOP + rows.length * ROW_H + 4}`}
          className="proto-svg proto-bits-svg"
          aria-hidden="true"
        >
          {rows.map((row, r) => {
            const y0 = TOP + r * ROW_H;
            const span = row.edges[8] - row.edges[0];
            const x = (t: number) => LEFT + ((t - row.edges[0]) / span) * ROW_W;
            const rowRead = Math.max(0, Math.min(8, read - r * 8));
            const cursor = now >= row.edges[0] && now < row.edges[8] ? x(now) : null;
            return (
              <g key={row.key} transform={`translate(0 ${y0})`}>
                <text
                  x={0}
                  y={CLK_LOW}
                  className={`proto-chan proto-chan--${row.channel === 'header' ? 'w' : row.channel}`}
                >
                  {ROW_LABELS[row.channel]}
                </text>
                <text x={0} y={DATA_LOW} className="proto-hex">
                  {r === 0
                    ? 'clock / data'
                    : `0x${byteValue(row.bits).toString(16).toUpperCase().padStart(2, '0')}`}
                </text>
                <path d={clockPath(row.edges, x)} className="proto-trace proto-trace--clock" />
                <path
                  d={dataPath(row.bits, row.edges, x)}
                  className={`proto-trace proto-trace--${row.channel === 'header' ? 'muted' : row.channel}`}
                />
                {row.bits.map((bit, i) => {
                  const mid = x((row.edges[i] + row.edges[i + 1]) / 2);
                  const done = i < rowRead;
                  return (
                    <g key={i}>
                      <circle
                        cx={mid}
                        cy={bit ? DATA_HIGH : DATA_LOW}
                        r={done ? 3.5 : 2.5}
                        className={done ? 'proto-sample proto-sample--done' : 'proto-sample'}
                      />
                      <text
                        x={mid}
                        y={DATA_LOW + 18}
                        textAnchor="middle"
                        className={`proto-bit proto-bit--${done ? 'done' : 'todo'}`}
                      >
                        {r === 0 && i < 3 ? '1' : bit}
                      </text>
                    </g>
                  );
                })}
                {r === 0 && (
                  <>
                    <text
                      x={x((row.edges[0] + row.edges[3]) / 2)}
                      y={CLK_HIGH - 8}
                      textAnchor="middle"
                      className="proto-note proto-note--tiny"
                    >
                      start of frame
                    </text>
                    <text
                      x={x((row.edges[3] + row.edges[8]) / 2)}
                      y={CLK_HIGH - 8}
                      textAnchor="middle"
                      className="proto-note proto-note--tiny"
                    >
                      brightness
                    </text>
                  </>
                )}
                {cursor != null && (
                  <line
                    x1={cursor}
                    x2={cursor}
                    y1={CLK_HIGH - 2}
                    y2={DATA_LOW + 4}
                    className="proto-cursor"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="proto-register" aria-hidden="true">
          <div className="proto-register-label">Pixel holds</div>
          {rows.slice(1).map((row, i) => {
            const got = Math.max(0, Math.min(8, read - (i + 1) * 8));
            return (
              <div key={row.key} className="proto-register-row">
                <span className={`proto-chan proto-chan--${row.channel}`}>
                  {row.channel.toUpperCase()}
                </span>
                <span className="proto-register-bits">
                  {row.bits.map((bit, j) => (
                    <span key={j} className={j < got ? 'is-in' : undefined}>
                      {j < got ? bit : '·'}
                    </span>
                  ))}
                </span>
                <span className="proto-register-value">{got === 8 ? byteValue(row.bits) : ''}</span>
              </div>
            );
          })}
          <div
            className="proto-register-swatch"
            style={{ background: read >= allBits.length ? rgbCss(COLOUR) : undefined }}
          />
        </div>
      </div>
    </AnimatedFigure>
  );
}

function byteValue(bits: Bit[]): number {
  return bits.reduce<number>((v, b) => (v << 1) | b, 0);
}

/** Clock: low for the first half of each bit, high for the second (rising edge mid-bit) */
function clockPath(edges: number[], x: (t: number) => number): string {
  let d = `M ${x(edges[0])} ${CLK_LOW}`;
  for (let i = 0; i < edges.length - 1; i++) {
    const mid = x((edges[i] + edges[i + 1]) / 2);
    d += ` L ${mid} ${CLK_LOW} L ${mid} ${CLK_HIGH} L ${x(edges[i + 1])} ${CLK_HIGH} L ${x(edges[i + 1])} ${CLK_LOW}`;
  }
  return d;
}

/** Data: changes at the start of each bit (the clock's falling edge) and holds */
function dataPath(bits: Bit[], edges: number[], x: (t: number) => number): string {
  let d = '';
  bits.forEach((bit, i) => {
    const y = bit ? DATA_HIGH : DATA_LOW;
    d += `${i === 0 ? 'M' : 'L'} ${x(edges[i])} ${y} L ${x(edges[i + 1])} ${y} `;
  });
  return d.trim();
}
