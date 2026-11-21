import { useMemo, useState } from 'react';
import {
  byteBitsMsbFirst,
  channelBytes,
  hex2,
  rgbCss,
  type Bit,
  type PulseTiming,
  type Rgb,
} from '~/lib/protocols/signals';
import { AnimatedFigure } from './Figure';
import { useTimeline } from './useTimeline';

export interface BitWindows {
  /** Name of the part the windows come from, for the caption */
  part: string;
  /** Latest a 0's high pulse may end (ns) */
  t0hMax: number;
  /** Earliest a 1's high pulse may end (ns) */
  t1hMin: number;
}

const COLOURS: { name: string; color: Rgb }[] = [
  { name: 'Orange', color: { r: 255, g: 140, b: 0 } },
  { name: 'Teal', color: { r: 0, g: 180, b: 160 } },
  { name: 'Purple', color: { r: 120, g: 40, b: 220 } },
  { name: 'Warm white', color: { r: 255, g: 190, b: 120 } },
];

const CHANNEL_NAMES = { r: 'Red', g: 'Green', b: 'Blue' } as const;

// Drawing: one row per byte, eight bits per row
const LEFT = 64;
const BIT_W = 44;
const ROW_H = 62;
const TOP = 8;
const HIGH_Y = 8;
const LOW_Y = 34;
const WIDTH = LEFT + 8 * BIT_W + 8;
/** Animation seconds per bit while the reader watches it being decoded */
const SECONDS_PER_BIT = 0.45;

/**
 * A colour becomes 24 bits, and each bit one high pulse: short for 0, long
 * for 1. A cursor walks along the line the way a pixel reads it, and the
 * register on the right fills as it goes.
 */
export function SingleWireBits({
  timing,
  order,
  orderPart,
  windows,
}: {
  timing: PulseTiming;
  /** Channel order on the wire, e.g. "GRB" */
  order: string;
  /** Which part sends that order, for the caption */
  orderPart: string;
  windows?: BitWindows;
}) {
  const [pick, setPick] = useState(0);
  const color = COLOURS[pick].color;
  const bytes = useMemo(() => channelBytes(color, order), [color, order]);
  const bits = useMemo(() => bytes.flatMap((b) => byteBitsMsbFirst(b.value)), [bytes]);
  const total = bits.length;
  const duration = total * SECONDS_PER_BIT + 2.5;
  const timeline = useTimeline({ duration, initial: duration - 1 });
  const read = Math.min(total, Math.floor(timeline.time / SECONDS_PER_BIT));
  // Cursor position inside the bit being read (0..1)
  const within = read < total ? (timeline.time - read * SECONDS_PER_BIT) / SECONDS_PER_BIT : 1;

  const px = BIT_W / timing.period;
  const rows = bytes.length;
  const height = TOP + rows * ROW_H + 4;

  const status =
    read >= total
      ? `All ${total} bits are in: the pixel now holds ${bytes
          .map((b) => `${CHANNEL_NAMES[b.channel].toLowerCase()} ${b.value}`)
          .join(', ')}.`
      : `Bit ${read + 1} of ${total}: high for ${bits[read] ? timing.t1h : timing.t0h} ns, ${
          bits[read] ? 'a long pulse, so a 1' : 'a short pulse, so a 0'
        }.`;

  return (
    <AnimatedFigure
      timeline={timeline}
      label={`The colour ${COLOURS[pick].name.toLowerCase()} as ${total} pulses on the data line, ${order} order`}
      status={status}
      onStep={() => timeline.seek((read >= total ? 0 : read + 1) * SECONDS_PER_BIT + 0.001)}
      stepLabel="Next bit"
      extraControls={
        <div className="proto-swatches" role="group" aria-label="Colour to send">
          {COLOURS.map((c, i) => (
            <button
              key={c.name}
              type="button"
              aria-pressed={i === pick}
              className="proto-swatch"
              onClick={() => {
                setPick(i);
                timeline.seek(0);
                timeline.play();
              }}
            >
              <span className="proto-swatch-chip" style={{ background: rgbCss(c.color) }} />
              {c.name}
            </button>
          ))}
        </div>
      }
      caption={
        <>
          Pick a colour or step bit by bit ({order} order, {orderPart}).
          {windows && (
            <>
              {' '}
              Shaded bands mark the {windows.part} 0-max ({windows.t0hMax} ns) and 1-min (
              {windows.t1hMin} ns) pulse limits.
            </>
          )}
        </>
      }
    >
      <div className="proto-bits">
        <svg
          viewBox={`0 0 ${WIDTH} ${height}`}
          className="proto-svg proto-bits-svg"
          aria-hidden="true"
        >
          {bytes.map((byte, row) => {
            const y0 = TOP + row * ROW_H;
            const rowBits = bits.slice(row * 8, row * 8 + 8);
            return (
              <g key={row} transform={`translate(0 ${y0})`}>
                <text x={0} y={HIGH_Y + 10} className={`proto-chan proto-chan--${byte.channel}`}>
                  {CHANNEL_NAMES[byte.channel]}
                </text>
                <text x={0} y={LOW_Y + 8} className="proto-hex">
                  0x{hex2(byte.value)}
                </text>
                {/* Where the bit being read may end its high pulse: by the
                    first band for a 0, inside the second for a 1 */}
                {windows && Math.floor(read / 8) === row && read < total && (
                  <g className="proto-window">
                    <rect
                      x={LEFT + (read % 8) * BIT_W}
                      y={HIGH_Y - 4}
                      width={windows.t0hMax * px}
                      height={LOW_Y - HIGH_Y + 8}
                      className="proto-window-0"
                    />
                    <rect
                      x={LEFT + (read % 8) * BIT_W + windows.t1hMin * px}
                      y={HIGH_Y - 4}
                      width={(timing.period - windows.t1hMin) * px}
                      height={LOW_Y - HIGH_Y + 8}
                      className="proto-window-1"
                    />
                  </g>
                )}
                <path
                  d={wavePath(rowBits, timing, LEFT, px)}
                  className={`proto-trace proto-trace--${byte.channel}`}
                />
                {rowBits.map((bit, i) => {
                  const index = row * 8 + i;
                  const state = index < read ? 'done' : index === read ? 'now' : 'todo';
                  return (
                    <text
                      key={i}
                      x={LEFT + i * BIT_W + BIT_W / 2}
                      y={LOW_Y + 20}
                      className={`proto-bit proto-bit--${state}`}
                      textAnchor="middle"
                    >
                      {bit}
                    </text>
                  );
                })}
                {Math.floor(read / 8) === row && read < total && (
                  <line
                    x1={LEFT + ((read % 8) + within) * BIT_W}
                    x2={LEFT + ((read % 8) + within) * BIT_W}
                    y1={HIGH_Y - 6}
                    y2={LOW_Y + 6}
                    className="proto-cursor"
                  />
                )}
              </g>
            );
          })}
        </svg>
        <div className="proto-register" aria-hidden="true">
          <div className="proto-register-label">Pixel holds</div>
          {bytes.map((byte, row) => {
            const got = Math.max(0, Math.min(8, read - row * 8));
            const value = byteBitsMsbFirst(byte.value)
              .slice(0, got)
              .reduce<number>((v, bit, i) => v | (bit << (7 - i)), 0);
            return (
              <div key={row} className="proto-register-row">
                <span className={`proto-chan proto-chan--${byte.channel}`}>
                  {byte.channel.toUpperCase()}
                </span>
                <span className="proto-register-bits">
                  {byteBitsMsbFirst(byte.value).map((bit, i) => (
                    <span key={i} className={i < got ? 'is-in' : undefined}>
                      {i < got ? bit : '·'}
                    </span>
                  ))}
                </span>
                <span className="proto-register-value">{got === 8 ? value : ''}</span>
              </div>
            );
          })}
          <div
            className="proto-register-swatch"
            style={{ background: read >= total ? rgbCss(color) : undefined }}
          />
        </div>
      </div>
    </AnimatedFigure>
  );
}

/** SVG path of the line level for a run of bits, starting low before the first bit */
function wavePath(bits: Bit[], timing: PulseTiming, x0: number, px: number): string {
  let d = `M ${x0} ${LOW_Y}`;
  bits.forEach((bit, i) => {
    const start = x0 + i * timing.period * px;
    const fall = start + (bit ? timing.t1h : timing.t0h) * px;
    d += ` L ${start} ${LOW_Y} L ${start} ${HIGH_Y} L ${fall} ${HIGH_Y} L ${fall} ${LOW_Y}`;
  });
  d += ` L ${x0 + bits.length * timing.period * px} ${LOW_Y}`;
  return d;
}
