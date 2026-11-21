import { useId, useState } from 'react';
import {
  clockedCycleSeconds,
  clockedPhaseAt,
  clockedPixelX,
  type ClockedGeometry,
  type ClockedOptions,
} from '~/lib/protocols/clockedChain';
import { hsv, rgbCss, type Rgb } from '~/lib/protocols/signals';
import { AnimatedFigure } from './Figure';
import { chainLayout } from './chainLayout';
import { ControllerBox } from './SingleWireChain';
import { useElementWidth } from './useElementWidth';
import { useTimeline } from './useTimeline';

const GEO: ClockedGeometry = {
  pixels: 4,
  spacing: 160,
  frameLength: 84,
  endLength: 42,
  wireEnd: 4 * 160 + 90,
  speed: 210,
  holdSeconds: 1.2,
};

const CYCLES = 6;

function colours(cycle: number): Rgb[] {
  return Array.from({ length: GEO.pixels }, (_, i) =>
    hsv(i * 70 + 200 - cycle * (360 / CYCLES), 0.85, 1)
  );
}

const LABELS = { start: 'start', reset: 'reset', end: 'end clocks' } as const;

/**
 * Clocked pixels in a chain. Each pixel reads the first LED frame after a
 * start frame and sends zeros in its place, so the next pixel sees a fresh
 * start frame. Whether it shows its colour at once (APA102) or only after the
 * next start frame (SK9822) is the one place these "compatible" parts differ.
 */
export function ClockedChain() {
  const glowId = useId();
  const [opts, setOpts] = useState<ClockedOptions>({ sk9822: false, resetFrame: false });
  const [measure, width] = useElementWidth<HTMLDivElement>();
  const layout = chainLayout(GEO, width != null && width < 520, -36, GEO.wireEnd);
  const cycle = clockedCycleSeconds(GEO, opts);
  const timeline = useTimeline({ duration: cycle * CYCLES, initial: cycle * 1.55 });
  const phase = clockedPhaseAt(GEO, opts, timeline.time);
  const shown = (k: number) => colours(phase.showing[k - 1])[k - 1];

  const reading = phase.received.findIndex((r) => r > 0 && r < 1);
  const status = opts.sk9822
    ? opts.resetFrame
      ? 'SK9822s with a reset frame: 32 more zero bits after the last LED frame count as a start frame, so every pixel shows this update before the next one begins.'
      : 'SK9822s without a reset frame: each pixel shows what it read only when the next update’s start frame arrives, so the string runs one update behind.'
    : reading >= 0
      ? `Pixel ${reading + 1} is reading its LED frame and sending zeros in its place: the next pixel sees a new start frame.`
      : 'APA102s show each colour as soon as their frame is in, one pixel after another.';

  const toggle = (patch: Partial<ClockedOptions>) => {
    setOpts((o) => ({ ...o, ...patch }));
    timeline.seek(0);
    timeline.play();
  };

  return (
    <AnimatedFigure
      timeline={timeline}
      label="Animation: clocked pixels in a chain; each takes the first LED frame after a start frame and sends zeros in its place"
      status={status}
      extraControls={
        <>
          <div className="proto-segmented" role="group" aria-label="Pixel type">
            <button
              type="button"
              aria-pressed={!opts.sk9822}
              onClick={() => toggle({ sk9822: false })}
            >
              APA102
            </button>
            <button
              type="button"
              aria-pressed={opts.sk9822}
              onClick={() => toggle({ sk9822: true })}
            >
              SK9822
            </button>
          </div>
          <label className="proto-toggle">
            <input
              type="checkbox"
              checked={opts.resetFrame}
              onChange={(e) => toggle({ resetFrame: e.target.checked })}
            />
            Reset frame
          </label>
        </>
      }
      caption={
        <>
          Four clocked pixels. The controller sends a start frame, one LED frame per pixel, and end
          clocks; the clock (the dashed line) runs through every pixel. Grey blocks are zero bits.
          Switch the pixels to SK9822s to see them fall one update behind, then add the reset frame
          that fixes it for both kinds.
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
          <ControllerBox layout={layout} label="Controller" sub="clock + data" />
          <line
            {...layout.wire(-12, layout.wireEnd, 13)}
            // The clock keeps running through every pixel: its dashes move with the data
            style={{ strokeDashoffset: -GEO.speed * timeline.time }}
            className="proto-wire proto-wire--clock proto-clock-line"
          />
          <line {...layout.wire(-12, layout.wireEnd)} className="proto-wire" />
          {phase.segments.map((s, i) => {
            const fill =
              s.kind === 'led' && !s.zeros && s.target != null
                ? rgbCss(colours(phase.cycle)[s.target - 1])
                : undefined;
            const label = s.kind === 'led' ? (s.zeros ? '0…0' : `#${s.target}`) : LABELS[s.kind];
            const mid = layout.point((s.from + s.to) / 2, 0);
            return (
              <g key={i}>
                <rect
                  {...layout.band(s.from, s.to, 0, layout.frameThickness)}
                  rx={3}
                  style={{ fill }}
                  className={`proto-frame${fill ? '' : s.kind === 'end' ? ' proto-frame--end' : ' proto-frame--control'}`}
                />
                {s.to - s.from > (layout.vertical ? 50 : 44) && (
                  <text
                    x={mid.x}
                    y={mid.y}
                    dy={4}
                    textAnchor="middle"
                    className={`proto-frame-label${fill ? '' : ' proto-frame-label--plain'}`}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          {Array.from({ length: GEO.pixels }, (_, i) => {
            const k = i + 1;
            const at = clockedPixelX(GEO, k);
            const led = layout.point(at, layout.ledOffset);
            const box = layout.point(at, 0);
            const colour = rgbCss(shown(k));
            return (
              <g key={k}>
                <circle
                  cx={led.x}
                  cy={led.y}
                  r={14}
                  style={{ fill: colour }}
                  filter={`url(#${glowId})`}
                  className="proto-led-glow"
                />
                <circle
                  cx={led.x}
                  cy={led.y}
                  r={9}
                  style={{ fill: colour }}
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
                  style={{ fill: rgbCss(colours(phase.cycle)[i]) }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </AnimatedFigure>
  );
}
