import { useMemo } from 'react';
import { byteBitsLsbFirst, hsv, rgbCss, type Rgb } from '~/lib/protocols/signals';
import { AnimatedFigure } from './Figure';
import { useTimeline } from './useTimeline';

export interface DmxTiming {
  /** Bit time (µs) */
  bitUs: number;
  /** Shortest BREAK a transmitter may send (µs) */
  breakMinUs: number;
  /** Shortest MARK AFTER BREAK a transmitter may send (µs) */
  mabMinUs: number;
  /** Data slots after the start code */
  slots: number;
}

/** Pixels on the bus, by DMX start address (three slots each) */
const ADDRESSES = [1, 4, 7, 10];
const SHOWN_SLOTS = 12;
const COLOURS: Rgb[] = ADDRESSES.map((_, i) => hsv(20 + i * 75, 0.85, 1));
/** Slot values the animation sends: each pixel's R, G, B */
const VALUES = COLOURS.flatMap((c) => [c.r, c.g, c.b].map(Math.round));

// Packet lane geometry (not to scale: a break is about two slots long)
const LANE_X = 70;
const HI = 26;
const LO = 54;
const BREAK_W = 74;
const MAB_W = 22;
const SLOT_W = 30;
const IDLE_W = 26;
const GAP_W = 40; // the "…" between slot 12 and the last slot
const WIDTH = LANE_X + IDLE_W + BREAK_W + MAB_W + (SHOWN_SLOTS + 2) * SLOT_W + GAP_W + IDLE_W;

/** Animation seconds for each part of the packet */
const T_IDLE = 0.6;
const T_BREAK = 1.2;
const T_MAB = 0.5;
const T_SLOT = 0.55;

/**
 * One DMX512 packet: a BREAK (line low), a MARK AFTER BREAK (high), the start
 * code, then the slots, each an asynchronous serial byte. Four DMX pixels
 * share the bus, each set to a start address, and each takes its three slots
 * as they go past.
 */
export function DmxPacket({ timing, part }: { timing: DmxTiming; part: string }) {
  const slotUs = timing.bitUs * 11;
  const packetUs = timing.breakMinUs + timing.mabMinUs + (timing.slots + 1) * slotUs;
  const duration = T_IDLE + T_BREAK + T_MAB + (SHOWN_SLOTS + 1) * T_SLOT + 2.5;
  const timeline = useTimeline({ duration, initial: duration - 1.5 });
  const t = timeline.time;

  // Which part of the packet the animation is in, and how many slots have passed
  const tBreak = T_IDLE;
  const tMab = tBreak + T_BREAK;
  const tStart = tMab + T_MAB;
  const slotsDone = Math.max(0, Math.min(SHOWN_SLOTS + 1, Math.floor((t - tStart) / T_SLOT)));
  const stage =
    t < tBreak
      ? 'idle'
      : t < tMab
        ? 'break'
        : t < tStart
          ? 'mab'
          : slotsDone <= SHOWN_SLOTS
            ? 'slots'
            : 'done';
  // slotsDone counts the start code too: data slot n is done when slotsDone > n
  const cursorX = useMemo(() => {
    if (t < tBreak) return LANE_X + (t / T_IDLE) * IDLE_W;
    if (t < tMab) return LANE_X + IDLE_W + ((t - tBreak) / T_BREAK) * BREAK_W;
    if (t < tStart) return LANE_X + IDLE_W + BREAK_W + ((t - tMab) / T_MAB) * MAB_W;
    const slots = Math.min(SHOWN_SLOTS + 1, (t - tStart) / T_SLOT);
    return LANE_X + IDLE_W + BREAK_W + MAB_W + slots * SLOT_W;
  }, [t, tBreak, tMab, tStart]);

  const status =
    stage === 'idle'
      ? 'Between packets the line idles high (a "mark").'
      : stage === 'break'
        ? `BREAK: the line is held low for at least ${timing.breakMinUs} µs, longer than any byte could be. Every receiver knows a new packet starts.`
        : stage === 'mab'
          ? `MARK AFTER BREAK: high again for at least ${timing.mabMinUs} µs.`
          : stage === 'slots'
            ? slotsDone === 0
              ? 'The start code: 0 means the slots that follow are ordinary dimmer levels.'
              : `Slot ${slotsDone}: value ${VALUES[slotsDone - 1] ?? 0}. ${ownerText(slotsDone)}`
            : `Every pixel on the bus has its three slots. A full packet of ${timing.slots} slots takes at least ${(packetUs / 1000).toFixed(1)} ms.`;

  const x0 = LANE_X + IDLE_W;
  const xMab = x0 + BREAK_W;
  const xSlots = xMab + MAB_W;
  const slotX = (n: number) => xSlots + n * SLOT_W; // n = 0 is the start code
  const lastX = slotX(SHOWN_SLOTS + 1) + GAP_W;

  return (
    <AnimatedFigure
      timeline={timeline}
      label={`Animation: a DMX512 packet (break, mark after break, start code, slots) and four ${part} pixels on one bus taking their slots`}
      status={status}
      caption={
        <>
          One DMX512 packet, not to scale. Each slot is one byte sent as {timing.bitUs} µs bits: a
          start bit (low), eight data bits with the least significant first, and two stop bits
          (high): {slotUs} µs per slot. The four {part} pixels below hang on the same pair of wires;
          each was given a start address and takes the three slots from there.
        </>
      }
    >
      <svg viewBox={`0 0 ${WIDTH} 210`} className="proto-svg" aria-hidden="true">
        <text x={0} y={HI + 12} className="proto-chan">
          DMX line
        </text>
        {/* idle, break, MAB */}
        <path
          d={`M ${LANE_X} ${HI} L ${x0} ${HI} L ${x0} ${LO} L ${xMab} ${LO} L ${xMab} ${HI} L ${xSlots} ${HI}`}
          className="proto-trace"
        />
        <text x={(x0 + xMab) / 2} y={LO + 16} textAnchor="middle" className="proto-dim-label">
          BREAK
        </text>
        <text x={(xMab + xSlots) / 2} y={HI - 8} textAnchor="middle" className="proto-dim-label">
          MAB
        </text>
        {/* start code + slots */}
        {Array.from({ length: SHOWN_SLOTS + 1 }, (_, n) => (
          <g key={n}>
            <path
              d={slotPath(slotX(n), n === 0 ? 0 : (VALUES[n - 1] ?? 0))}
              className={`proto-trace${n === 0 ? ' proto-trace--muted' : ''}`}
            />
            <text
              x={slotX(n) + SLOT_W / 2}
              y={LO + 16}
              textAnchor="middle"
              className="proto-note proto-note--tiny"
            >
              {n === 0 ? 'SC' : n}
            </text>
          </g>
        ))}
        <text
          x={slotX(SHOWN_SLOTS + 1) + GAP_W / 2}
          y={(HI + LO) / 2 + 4}
          textAnchor="middle"
          className="proto-note"
        >
          …
        </text>
        <path d={slotPath(lastX - SLOT_W, 0)} className="proto-trace proto-trace--muted" />
        <text
          x={lastX - SLOT_W / 2}
          y={LO + 16}
          textAnchor="middle"
          className="proto-note proto-note--tiny"
        >
          {timing.slots}
        </text>
        <path d={`M ${lastX} ${HI} L ${lastX + IDLE_W} ${HI}`} className="proto-trace" />
        {stage !== 'done' && (
          <line x1={cursorX} x2={cursorX} y1={HI - 14} y2={LO + 4} className="proto-cursor" />
        )}

        {/* The bus and its pixels */}
        <line x1={LANE_X} x2={WIDTH - 10} y1={120} y2={120} className="proto-bus" />
        <line x1={LANE_X} x2={WIDTH - 10} y1={126} y2={126} className="proto-bus" />
        <text x={0} y={127} className="proto-chan">
          Bus
        </text>
        {ADDRESSES.map((address, i) => {
          const cx = LANE_X + 60 + i * ((WIDTH - LANE_X - 120) / (ADDRESSES.length - 1));
          const have = Math.max(0, Math.min(3, slotsDone - address));
          const full = have === 3;
          return (
            <g key={address}>
              <line x1={cx} x2={cx} y1={126} y2={146} className="proto-bus" />
              <rect x={cx - 42} y={146} width={84} height={40} rx={8} className="proto-pixel" />
              <circle
                cx={cx}
                cy={160}
                r={8}
                style={{ fill: full ? rgbCss(COLOURS[i]) : undefined }}
                className="proto-led"
              />
              <text x={cx} y={180} textAnchor="middle" className="proto-note proto-note--tiny">
                address {address} · {have}/3
              </text>
            </g>
          );
        })}
      </svg>
    </AnimatedFigure>
  );
}

function ownerText(slot: number): string {
  const i = ADDRESSES.findIndex((a) => slot >= a && slot < a + 3);
  return i >= 0
    ? `The pixel at address ${ADDRESSES[i]} takes it.`
    : 'No pixel on this bus uses it.';
}

/** One slot as a line level: start bit low, data bits LSB first, two stop bits high */
function slotPath(x: number, value: number): string {
  const w = SLOT_W / 11;
  const levels = [0, ...byteBitsLsbFirst(value), 1, 1];
  let d = `M ${x} ${HI}`;
  levels.forEach((bit, i) => {
    const y = bit ? HI : LO;
    d += ` L ${x + i * w} ${y} L ${x + (i + 1) * w} ${y}`;
  });
  return d;
}
