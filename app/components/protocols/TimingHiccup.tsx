import { useState } from 'react';
import type { Bit, PulseTiming } from '~/lib/protocols/signals';

const BITS: Bit[] = [1, 0, 0, 1, 0, 1, 1, 0];
/** Which bit the hiccup lands on (a 0, so stretching it makes a 1) */
const HIT = 2;
const LEFT = 92;
const WIDTH = 720;
const LANE_H = 92;

/**
 * The same eight bits sent twice while the sender stalls for a moment in the
 * middle of a bit: on a single wire the stall stretches a short pulse into a
 * long one and the pixel reads a different value; on a clocked line the clock
 * simply waits, and nothing changes.
 */
export function TimingHiccup({
  timing,
  stallNs,
  t0hMax,
  part,
}: {
  timing: PulseTiming;
  /** How long the sender stalls */
  stallNs: number;
  /** Latest end of a 0's pulse the datasheet allows */
  t0hMax: number;
  part: string;
}) {
  const [stall, setStall] = useState(true);
  const extra = stall ? stallNs : 0;
  const totalNs = BITS.length * timing.period + extra;
  const px = (WIDTH - LEFT - 12) / (BITS.length * timing.period + stallNs);
  const sent = byteValue(BITS);

  // Single wire: the stall lands while the line is high, lengthening that pulse
  let x = LEFT;
  let single = `M ${LEFT} 70`;
  const singleRead: Bit[] = [];
  BITS.forEach((bit, i) => {
    let high = bit ? timing.t1h : timing.t0h;
    if (i === HIT) high += extra;
    const low = timing.period - (bit ? timing.t1h : timing.t0h);
    single += ` L ${x} 70 L ${x} 30 L ${x + high * px} 30 L ${x + high * px} 70`;
    x += (high + low) * px;
    singleRead.push(high > t0hMax ? 1 : 0);
  });
  single += ` L ${x} 70`;

  // Clocked: the same stall holds the clock low; data is read at rising edges
  let cx = LEFT;
  let clock = `M ${LEFT} 140`;
  let data = '';
  const samples: { x: number; bit: Bit }[] = [];
  BITS.forEach((bit, i) => {
    const lowPart = timing.period / 2 + (i === HIT ? extra : 0);
    const rise = cx + lowPart * px;
    const end = rise + (timing.period / 2) * px;
    clock += ` L ${rise} 140 L ${rise} 112 L ${end} 112 L ${end} 140`;
    const y = bit ? 156 : 176;
    data += `${i === 0 ? 'M' : 'L'} ${cx} ${y} L ${end} ${y} `;
    samples.push({ x: rise, bit });
    cx = end;
  });

  const singleValue = byteValue(singleRead);
  const broken = singleValue !== sent;

  return (
    <figure className="proto-figure">
      <div
        className="proto-stage"
        role="group"
        aria-label="The same byte sent on a single wire and on a clocked line while the sender stalls"
      >
        <svg viewBox={`0 0 ${WIDTH} ${LANE_H * 2 + 14}`} className="proto-svg" aria-hidden="true">
          <text x={0} y={46} className="proto-chan">
            Single wire
          </text>
          <text x={0} y={64} className="proto-hex">
            reads {singleValue}
          </text>
          <path d={single} className="proto-trace" />
          {stall && (
            <rect
              x={LEFT + (HIT * timing.period + timing.t0h) * px}
              y={24}
              width={extra * px}
              height={52}
              className="proto-stall"
            />
          )}
          {singleRead.map((bit, i) => (
            <text
              key={i}
              x={
                LEFT +
                (i * timing.period +
                  (i > HIT ? extra : i === HIT ? extra / 2 : 0) +
                  timing.period / 2) *
                  px
              }
              y={88}
              textAnchor="middle"
              className={`proto-bit ${bit !== BITS[i] ? 'proto-bit--wrong' : 'proto-bit--done'}`}
            >
              {bit}
            </text>
          ))}
          <text x={0} y={132} className="proto-chan">
            Clock + data
          </text>
          <text x={0} y={150} className="proto-hex">
            reads {sent}
          </text>
          <path d={clock} className="proto-trace proto-trace--clock" />
          <path d={data.trim()} className="proto-trace" />
          {stall && (
            <rect
              x={LEFT + HIT * timing.period * px}
              y={106}
              width={extra * px}
              height={78}
              className="proto-stall"
            />
          )}
          {samples.map((s, i) => (
            <g key={i}>
              <circle
                cx={s.x}
                cy={s.bit ? 156 : 176}
                r={3.5}
                className="proto-sample proto-sample--done"
              />
              <text x={s.x} y={196} textAnchor="middle" className="proto-bit proto-bit--done">
                {s.bit}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="proto-controls">
        <label className="proto-toggle">
          <input type="checkbox" checked={stall} onChange={(e) => setStall(e.target.checked)} />
          Sender stalls for {stallNs} ns during bit {HIT + 1}
        </label>
      </div>
      <p className="proto-status" aria-live="polite">
        {stall
          ? broken
            ? `The single wire now reads ${singleValue} instead of ${sent}: the stalled 0 lasted ${timing.t0h + extra} ns, past the ${t0hMax} ns a 0 may last, so it counts as a 1. The clocked line still reads ${sent}.`
            : `Both read ${sent}.`
          : `Both lines read ${sent}; the whole byte takes ${Math.round(totalNs)} ns.`}
      </p>
      <figcaption className="proto-caption">
        Byte {sent} ({BITS.join('')}) with a {stallNs} ns pause mid-bit: stretches a 0 past the{' '}
        {part} {t0hMax} ns limit on single wire; harmless on a clocked line.
      </figcaption>
    </figure>
  );
}

function byteValue(bits: Bit[]): number {
  return bits.reduce<number>((v, b) => (v << 1) | b, 0);
}
