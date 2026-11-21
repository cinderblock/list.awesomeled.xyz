import { useId, useMemo } from 'react';
import {
  chainCycleSeconds,
  chainPhaseAt,
  chainSendSeconds,
  hsv,
  pixelX,
  rgbCss,
  type ChainGeometry,
  type Rgb,
} from '~/lib/protocols/signals';
import { AnimatedFigure } from './Figure';
import { chainLayout, type ChainLayout } from './chainLayout';
import { useElementWidth } from './useElementWidth';
import { useTimeline } from './useTimeline';

const GEO: ChainGeometry = {
  pixels: 5,
  spacing: 150,
  frameLength: 96,
  speed: 190,
  resetSeconds: 1.6,
  holdSeconds: 1.6,
};

/** Updates per loop; the rainbow turns a full circle in that many */
const CYCLES = 5;

/** The colours of update `cycle`: a rainbow that moves along one step per update */
function colours(cycle: number): Rgb[] {
  return Array.from({ length: GEO.pixels }, (_, i) =>
    hsv(i * 60 - cycle * (360 / CYCLES), 0.85, 1)
  );
}

/** Seconds into an update when pixel k has its whole frame */
function pixelDone(k: number): number {
  return ((k - 1) * GEO.frameLength + pixelX(GEO, k) + GEO.frameLength) / GEO.speed;
}

/**
 * A single-wire chain: the controller sends one frame per pixel, back to
 * back. Each pixel keeps the first frame that reaches it and passes the rest
 * on; nothing lights up until the line has been low for the reset time, then
 * every pixel shows its new colour at once.
 */
export function SingleWireChain({
  bitsPerPixel,
  bitNs,
  resetUs,
  resetPart,
}: {
  bitsPerPixel: number;
  bitNs: number;
  /** Reset (latch) time the drawing labels, in µs */
  resetUs: number;
  /** Whose datasheet the reset time comes from */
  resetPart: string;
}) {
  const glowId = useId();
  const [measure, width] = useElementWidth<HTMLDivElement>();
  const layout = chainLayout(GEO, width != null && width < 520);
  const cycle = chainCycleSeconds(GEO);
  const send = chainSendSeconds(GEO);
  const duration = cycle * CYCLES;
  // Prerendered picture: an update half sent, the previous colours still showing
  const timeline = useTimeline({ duration, initial: cycle + send * 0.55 });
  const phase = chainPhaseAt(GEO, timeline.time);
  const next = useMemo(() => colours(phase.cycle), [phase.cycle]);
  const prev = useMemo(() => colours(phase.cycle - 1), [phase.cycle]);
  const frameUs = (bitsPerPixel * bitNs) / 1000;
  const realUs = GEO.pixels * frameUs + resetUs;

  // Moments worth stopping at: each pixel complete, the reset gap, the latch
  const moments = [
    0.01,
    ...Array.from({ length: GEO.pixels }, (_, i) => pixelDone(i + 1) + 0.01),
    send + GEO.resetSeconds * 0.5,
    send + GEO.resetSeconds + 0.2,
  ];
  const step = () => {
    const base = phase.cycle * cycle;
    const upcoming = moments.find((m) => m > timeline.time - base + 0.02);
    timeline.seek(
      upcoming != null ? base + upcoming : ((phase.cycle + 1) % CYCLES) * cycle + moments[0]
    );
  };

  const shown = (k: number): Rgb => (phase.stage === 'latched' ? next[k - 1] : prev[k - 1]);

  let status: string;
  if (phase.stage === 'sending') {
    const taking = phase.received.findIndex((r) => r > 0 && r < 1);
    const done = phase.received.filter((r) => r >= 1).length;
    if (taking >= 0) {
      status =
        taking + 1 < GEO.pixels
          ? `Pixel ${taking + 1} is taking its ${bitsPerPixel} bits; everything after them goes on to pixel ${taking + 2}.`
          : `Pixel ${taking + 1} is taking the last frame.`;
    } else if (done === 0) {
      status = `The controller sends ${GEO.pixels} frames back to back, one per pixel, ${frameUs} µs each.`;
    } else {
      status = `${done} of ${GEO.pixels} pixels have their new colour stored, but still show the old one.`;
    }
  } else if (phase.stage === 'reset') {
    status = `The line stays low. After ${resetUs} µs every pixel takes this as the end of the update.`;
  } else {
    status = 'Latched: every pixel shows its new colour at the same moment.';
  }

  return (
    <AnimatedFigure
      timeline={timeline}
      label={`Animation: a controller sends ${GEO.pixels} frames down a chain of ${GEO.pixels} pixels; each pixel keeps the first frame and passes the rest on`}
      status={status}
      onStep={step}
      caption={
        <>
          Five pixels on one data line, slowed down: in real time this whole update takes about{' '}
          {Math.round(realUs)} µs. Each frame is {bitsPerPixel} bits, {frameUs} µs on the wire. A
          pixel keeps the first frame it receives and passes everything after it on, so the stream
          is one frame shorter after every pixel. The new colour waits in each pixel (the bar under
          its number) until the line has been low for the reset time ({resetUs} µs for the{' '}
          {resetPart}); then all of them change together.
        </>
      }
    >
      <div ref={measure}>
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="proto-svg proto-chain"
          aria-hidden="true"
        >
          <defs>
            <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" />
            </filter>
          </defs>
          <ControllerBox layout={layout} label="Controller" sub="data out" />
          <line {...layout.wire(-12, layout.wireEnd)} className="proto-wire" />
          {phase.blocks.map((b) => (
            <g key={b.target}>
              <rect
                {...layout.band(b.from, b.to, 0, layout.frameThickness)}
                rx={3}
                style={{ fill: rgbCss(next[b.target - 1]) }}
                className="proto-frame"
              />
              {b.to - b.from > 30 && (
                <text
                  {...layout.point((b.from + b.to) / 2, 0)}
                  dy={4}
                  textAnchor="middle"
                  className="proto-frame-label"
                >
                  #{b.target}
                </text>
              )}
            </g>
          ))}
          {phase.stage !== 'sending' && (
            <ResetBar
              layout={layout}
              progress={phase.resetProgress}
              resetUs={resetUs}
              latched={phase.stage === 'latched'}
            />
          )}
          {Array.from({ length: GEO.pixels }, (_, i) => {
            const k = i + 1;
            const at = pixelX(GEO, k);
            const led = layout.point(at, layout.ledOffset);
            const box = layout.point(at, 0);
            return (
              <g key={k}>
                <circle
                  cx={led.x}
                  cy={led.y}
                  r={14}
                  style={{ fill: rgbCss(shown(k)) }}
                  filter={`url(#${glowId})`}
                  className="proto-led-glow"
                />
                <circle
                  cx={led.x}
                  cy={led.y}
                  r={9}
                  style={{ fill: rgbCss(shown(k)) }}
                  className="proto-led"
                />
                <rect
                  x={box.x - 22}
                  y={box.y - 22}
                  width={44}
                  height={44}
                  rx={8}
                  className="proto-pixel"
                />
                <text x={box.x} y={box.y - 5} textAnchor="middle" className="proto-pixel-label">
                  {k}
                </text>
                <rect
                  x={box.x - 14}
                  y={box.y + 4}
                  width={28}
                  height={8}
                  rx={2}
                  className="proto-store-track"
                />
                <rect
                  x={box.x - 14}
                  y={box.y + 4}
                  width={28 * phase.received[i]}
                  height={8}
                  rx={2}
                  style={{ fill: rgbCss(next[i]) }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </AnimatedFigure>
  );
}

export function ControllerBox({
  layout,
  label,
  sub,
}: {
  layout: ChainLayout;
  label: string;
  sub: string;
}) {
  const { x, y, w, h } = layout.controller;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} className="proto-box" />
      <text x={x + w / 2} y={y + h / 2 - 2} textAnchor="middle" className="proto-box-label">
        {label}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" className="proto-box-sub">
        {sub}
      </text>
    </g>
  );
}

function ResetBar({
  layout,
  progress,
  resetUs,
  latched,
}: {
  layout: ChainLayout;
  progress: number;
  resetUs: number;
  latched: boolean;
}) {
  const { x, y, w } = layout.resetBar;
  return (
    <g>
      <rect x={x} y={y} width={w} height={8} rx={4} className="proto-reset-track" />
      <rect x={x} y={y} width={w * progress} height={8} rx={4} className="proto-reset-fill" />
      <text x={x} y={y + 24} className="proto-note">
        line low: {Math.round(progress * resetUs)} of {resetUs} µs{latched ? ' → latch' : ''}
      </text>
    </g>
  );
}
