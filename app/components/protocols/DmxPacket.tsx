import { byteBitsLsbFirst, hsv, rgbCss, type Rgb } from '~/lib/protocols/signals';
import { DMX512 } from '~/lib/protocols/reference';
import { AnimatedFigure } from './Figure';
import { useTimeline } from './useTimeline';

/** Pixels on the bus, by DMX start address (three slots each) */
const ADDRESSES = [1, 4, 7, 10];
const SHOWN_SLOTS = 12;
const COLOURS: Rgb[] = ADDRESSES.map((_, i) => hsv(20 + i * 75, 0.85, 1));
/** Slot values the animation sends: each pixel's R, G, B */
const VALUES = COLOURS.flatMap((c) => [c.r, c.g, c.b].map(Math.round));

// Packet lane (not to scale: a real BREAK is about two slots long)
const LANE_X = 74;
const HI = 26;
const LO = 54;
const BREAK_W = 74;
const MAB_W = 22;
const SLOT_W = 30;
const IDLE_W = 26;
const GAP_W = 40; // the "…" between the last slot shown and slot 512
const WIDTH = LANE_X + IDLE_W + BREAK_W + MAB_W + (SHOWN_SLOTS + 2) * SLOT_W + GAP_W + IDLE_W;

// One slot, zoomed: start bit, eight data bits, two stop bits
const ZOOM_Y = 92;
const ZOOM_HI = ZOOM_Y + 6;
const ZOOM_LO = ZOOM_Y + 30;
const ZOOM_BIT = 34;

const BUS_Y = 178;

/** Animation seconds for each part of the packet */
const T_IDLE = 0.6;
const T_BREAK = 1.4;
const T_MAB = 0.6;
const T_SLOT = 0.9;

const x0 = LANE_X + IDLE_W;
const xMab = x0 + BREAK_W;
const xSlots = xMab + MAB_W;
/** Left edge of slot n on the packet lane (0 = the start code) */
const slotX = (n: number) => xSlots + n * SLOT_W;
const lastX = slotX(SHOWN_SLOTS + 1) + GAP_W;

/**
 * One DMX512 packet: a BREAK (line low), a MARK AFTER BREAK (high), the start
 * code, then the slots, each an asynchronous serial byte. Below it the slot
 * being sent, bit by bit, and four DMX pixels sharing one data line, each set
 * to a start address and taking its three slots as they go past.
 */
export function DmxPacket({ part }: { part: string }) {
  const slotUs = DMX512.bitUs * DMX512.bitsPerSlot;
  const duration = T_IDLE + T_BREAK + T_MAB + (SHOWN_SLOTS + 1) * T_SLOT + 2.5;
  const timeline = useTimeline({ duration, initial: duration - 1.5 });
  const t = timeline.time;

  const tBreak = T_IDLE;
  const tMab = tBreak + T_BREAK;
  const tStart = tMab + T_MAB;
  const tEnd = tStart + (SHOWN_SLOTS + 1) * T_SLOT;
  // Slots fully sent so far, counting the start code (slot 0)
  const sent = Math.max(0, Math.min(SHOWN_SLOTS + 1, Math.floor((t - tStart) / T_SLOT)));
  const stage =
    t < tBreak ? 'idle' : t < tMab ? 'break' : t < tStart ? 'mab' : t < tEnd ? 'slots' : 'done';
  // The slot on the zoom lane: the one being sent, or slot 1 between packets
  const zoomSlot = stage === 'slots' ? sent : 1;
  const zoomValue = zoomSlot === 0 ? 0 : (VALUES[zoomSlot - 1] ?? 0);
  const zoomProgress = stage === 'slots' ? (t - tStart) / T_SLOT - sent : stage === 'done' ? 1 : 0;

  let cursorX: number | null = null;
  if (stage === 'idle') cursorX = LANE_X + (t / T_IDLE) * IDLE_W;
  else if (stage === 'break') cursorX = x0 + ((t - tBreak) / T_BREAK) * BREAK_W;
  else if (stage === 'mab') cursorX = xMab + ((t - tMab) / T_MAB) * MAB_W;
  else if (stage === 'slots') cursorX = xSlots + ((t - tStart) / T_SLOT) * SLOT_W;

  const moments = [
    0.01,
    tBreak + 0.05,
    tMab + 0.05,
    ...Array.from({ length: SHOWN_SLOTS + 1 }, (_, n) => tStart + n * T_SLOT + T_SLOT * 0.6),
    tEnd + 0.1,
  ];
  const step = () => {
    const upcoming = moments.find((m) => m > t + 0.02);
    timeline.seek(upcoming ?? moments[0]);
  };

  const status =
    stage === 'idle'
      ? 'Between packets the line idles high, the "mark".'
      : stage === 'break'
        ? `BREAK: the transmitter holds the line low for at least ${DMX512.breakTxMinUs} µs, longer than any byte can stay low. Every receiver knows a packet is starting.`
        : stage === 'mab'
          ? `MARK AFTER BREAK: high again for at least ${DMX512.mabTxMinUs} µs.`
          : stage === 'slots'
            ? sent === 0
              ? 'Slot 0, the start code. 0 (the NULL START Code) means the slots that follow are levels.'
              : `Slot ${sent}: ${VALUES[sent - 1] ?? 0}, least significant bit first. ${ownerText(sent)}`
            : `Each pixel on the line has its three slots. A packet with all ${DMX512.slots} slots takes at least ${DMX512.updateMs513} ms, so a universe updates at most ${DMX512.refreshMax} times a second.`;

  return (
    <AnimatedFigure
      timeline={timeline}
      label={`Animation: a DMX512 packet (break, mark after break, start code, slots), one slot bit by bit, and four ${part} pixels on one data line taking their slots`}
      status={status}
      onStep={step}
      caption={
        <>
          Not to scale. Each slot is 11 bits ({slotUs} µs, LSB first); the four {part} pixels share
          one bus and grab their assigned slots.
        </>
      }
    >
      <svg viewBox={`0 0 ${WIDTH} 238`} className="proto-svg" aria-hidden="true">
        <text x={0} y={HI + 12} className="proto-chan">
          Packet
        </text>
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
        {Array.from({ length: SHOWN_SLOTS + 1 }, (_, n) => (
          <g key={n}>
            <path
              d={slotPath(
                slotX(n),
                HI,
                LO,
                SLOT_W / DMX512.bitsPerSlot,
                n === 0 ? 0 : (VALUES[n - 1] ?? 0)
              )}
              className={`proto-trace${n === 0 ? ' proto-trace--muted' : ''}`}
            />
            <text
              x={slotX(n) + SLOT_W / 2}
              y={LO + 16}
              textAnchor="middle"
              className={`proto-note proto-note--tiny${n === zoomSlot && stage === 'slots' ? ' proto-note--now' : ''}`}
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
        <path
          d={slotPath(lastX - SLOT_W, HI, LO, SLOT_W / DMX512.bitsPerSlot, 0)}
          className="proto-trace proto-trace--muted"
        />
        <text
          x={lastX - SLOT_W / 2}
          y={LO + 16}
          textAnchor="middle"
          className="proto-note proto-note--tiny"
        >
          {DMX512.slots}
        </text>
        <path d={`M ${lastX} ${HI} L ${lastX + IDLE_W} ${HI}`} className="proto-trace" />
        {cursorX != null && (
          <line x1={cursorX} x2={cursorX} y1={HI - 14} y2={LO + 4} className="proto-cursor" />
        )}

        {/* The slot being sent, bit by bit */}
        <text x={0} y={ZOOM_HI + 16} className="proto-chan">
          {zoomSlot === 0 ? 'Start code' : `Slot ${zoomSlot}`}
        </text>
        <text x={0} y={ZOOM_LO + 14} className="proto-hex">
          = {zoomValue}
        </text>
        <path
          d={slotPath(LANE_X + 24, ZOOM_HI, ZOOM_LO, ZOOM_BIT, zoomValue)}
          className="proto-trace"
        />
        {slotLabels(zoomValue).map((label, i) => (
          <text
            key={i}
            x={LANE_X + 24 + (i + 0.5) * ZOOM_BIT}
            y={ZOOM_LO + 18}
            textAnchor="middle"
            className={`proto-bit proto-bit--${i / DMX512.bitsPerSlot < zoomProgress ? 'done' : 'todo'}`}
          >
            {label}
          </text>
        ))}
        <text
          x={LANE_X + 24 + 0.5 * ZOOM_BIT}
          y={ZOOM_Y - 2}
          textAnchor="middle"
          className="proto-note proto-note--tiny"
        >
          start
        </text>
        <text
          x={LANE_X + 24 + 1.5 * ZOOM_BIT}
          y={ZOOM_Y - 2}
          textAnchor="start"
          className="proto-note proto-note--tiny"
        >
          bit 0 (least significant) … bit 7
        </text>
        <text
          x={LANE_X + 24 + 10 * ZOOM_BIT}
          y={ZOOM_Y - 2}
          textAnchor="middle"
          className="proto-note proto-note--tiny"
        >
          stop
        </text>

        {/* The data line and its pixels */}
        <line x1={LANE_X} x2={WIDTH - 10} y1={BUS_Y} y2={BUS_Y} className="proto-bus" />
        <text x={0} y={BUS_Y + 4} className="proto-chan">
          Data line
        </text>
        {ADDRESSES.map((address, i) => {
          const cx = LANE_X + 60 + i * ((WIDTH - LANE_X - 120) / (ADDRESSES.length - 1));
          const have = Math.max(0, Math.min(3, sent - address));
          return (
            <g key={address}>
              <line x1={cx} x2={cx} y1={BUS_Y} y2={BUS_Y + 14} className="proto-bus" />
              <rect
                x={cx - 44}
                y={BUS_Y + 14}
                width={88}
                height={42}
                rx={8}
                className="proto-pixel"
              />
              <circle
                cx={cx}
                cy={BUS_Y + 28}
                r={8}
                style={{ fill: have === 3 ? rgbCss(COLOURS[i]) : undefined }}
                className="proto-led"
              />
              <text
                x={cx}
                y={BUS_Y + 50}
                textAnchor="middle"
                className="proto-note proto-note--tiny"
              >
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
    : 'No pixel on this line uses it.';
}

/** Labels under the zoomed slot: S, the eight data bits LSB first, P P */
function slotLabels(value: number): string[] {
  return ['S', ...byteBitsLsbFirst(value).map(String), 'P', 'P'];
}

/** One slot as a line level: start bit low, data bits LSB first, two stop bits high */
function slotPath(x: number, hi: number, lo: number, bitW: number, value: number): string {
  const levels = [0, ...byteBitsLsbFirst(value), 1, 1];
  let d = `M ${x} ${hi}`;
  levels.forEach((bit, i) => {
    const y = bit ? hi : lo;
    d += ` L ${x + i * bitW} ${y} L ${x + (i + 1) * bitW} ${y}`;
  });
  return d;
}
