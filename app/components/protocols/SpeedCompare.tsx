import { useId, useState } from 'react';
import { apa102RefreshRate, refreshRate } from '~/lib/protocols/signals';
import { WS2813B_V6 } from '~/lib/protocols/reference';

const CLOCK_OPTIONS_MHZ = [2, 4, 8, 16, 24] as const;
const PIXEL_PRESETS = [150, 500, 1000, 2000] as const;

const RESET_NS = WS2813B_V6.resetMin;

function formatMs(ns: number): string {
  const ms = ns / 1e6;
  return ms >= 10 ? `${ms.toFixed(1)} ms` : `${ms.toFixed(2)} ms`;
}

function formatFps(fps: number): string {
  return fps >= 100 ? `${Math.round(fps)} fps` : `${fps.toFixed(1)} fps`;
}

/**
 * Interactive throughput comparison: one output driving N RGB pixels on
 * single-wire (400 kHz, 800 kHz, 1.6 MHz) vs clocked APA102/SK9822 at a chosen
 * SPI clock rate. Shows why clocked strips unlock high-FPS rigs and long runs.
 */
export function SpeedCompare() {
  const sliderId = useId();
  const [pixels, setPixels] = useState(1000);
  const [clockMhz, setClockMhz] = useState<(typeof CLOCK_OPTIONS_MHZ)[number]>(8);

  const slow = refreshRate(pixels, 24, 2500, RESET_NS);
  const ws = refreshRate(pixels, 24, 1250, RESET_NS);
  const fastSw = refreshRate(pixels, 24, 625, RESET_NS);
  const spi = apa102RefreshRate(pixels, clockMhz * 1e6, true);

  const rows = [
    {
      id: 'sw-400',
      label: 'Single wire · 400 kHz',
      sub: 'TM1803, WS2811 slow',
      frameNs: slow.frameNs,
      fps: slow.fps,
      highlight: false,
    },
    {
      id: 'sw-800',
      label: 'Single wire · 800 kHz',
      sub: 'WS2812B, SK6812, WS2815',
      frameNs: ws.frameNs,
      fps: ws.fps,
      highlight: false,
    },
    {
      id: 'sw-1600',
      label: 'Single wire · 1.6 MHz',
      sub: 'UCS7604 fast mode',
      frameNs: fastSw.frameNs,
      fps: fastSw.fps,
      highlight: false,
    },
    {
      id: 'spi',
      label: `Clock + data · ${clockMhz} MHz`,
      sub: 'APA102 / SK9822 (32-bit + reset)',
      frameNs: spi.frameNs,
      fps: spi.fps,
      highlight: true,
    },
  ];

  const maxFps = Math.max(...rows.map((r) => r.fps));
  const speedup = spi.fps / ws.fps;

  return (
    <figure className="proto-figure proto-speed">
      <div className="proto-speed-controls">
        <div className="proto-speed-field">
          <label htmlFor={sliderId} className="proto-speed-label">
            String length: <strong>{pixels.toLocaleString('en-US')} RGB pixels</strong>
          </label>
          <div className="proto-speed-slider-row">
            <input
              id={sliderId}
              type="range"
              min={50}
              max={2000}
              step={50}
              value={pixels}
              onChange={(e) => setPixels(Number(e.target.value))}
              className="proto-range"
            />
            <div className="proto-speed-presets" role="group" aria-label="Preset pixel counts">
              {PIXEL_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className="proto-preset"
                  aria-pressed={pixels === n}
                  onClick={() => setPixels(n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="proto-speed-field">
          <span className="proto-speed-label">SPI clock speed</span>
          <div className="proto-segmented" role="group" aria-label="SPI clock speed">
            {CLOCK_OPTIONS_MHZ.map((mhz) => (
              <button
                key={mhz}
                type="button"
                aria-pressed={clockMhz === mhz}
                onClick={() => setClockMhz(mhz)}
              >
                {mhz} MHz
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="proto-speed-bars"
        role="group"
        aria-label={`Maximum frame rate for ${pixels} RGB pixels by protocol`}
      >
        {rows.map((row) => {
          const widthPct = Math.max(2, (row.fps / maxFps) * 100);
          return (
            <div
              key={row.id}
              className={`proto-speed-row${row.highlight ? ' proto-speed-row--hi' : ''}`}
            >
              <div className="proto-speed-meta">
                <span className="proto-speed-name">{row.label}</span>
                <span className="proto-speed-sub">{row.sub}</span>
              </div>
              <div className="proto-speed-track" aria-hidden="true">
                <span className="proto-speed-fill" style={{ width: `${widthPct}%` }} />
              </div>
              <div className="proto-speed-val">
                <strong>{formatFps(row.fps)}</strong>
                <span>{formatMs(row.frameNs)}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="proto-status" aria-live="polite">
        {pixels.toLocaleString('en-US')} RGB pixels on one output: {clockMhz} MHz clocked hits{' '}
        {formatFps(spi.fps)} ({formatMs(spi.frameNs)}) &mdash;{' '}
        {speedup >= 1 ? `${speedup.toFixed(1)}× faster` : `${(1 / speedup).toFixed(1)}× slower`}{' '}
        than 800 kHz single wire ({formatFps(ws.fps)}).
        {clockMhz === 24 && pixels > 144
          ? ' At 24 MHz, clock distortion already nears its margin around 144 APA102s.'
          : ''}
      </p>
      <figcaption className="proto-caption">
        Theoretical max update rate per output (280 µs reset on single-wire; unified 32-bit reset
        plus n/2 end clocks on APA102/SK9822).
      </figcaption>
    </figure>
  );
}
