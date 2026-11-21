import { useMemo, useState } from 'react';
import { backupChain } from '~/lib/protocols/backup';
import { hsv, rgbCss } from '~/lib/protocols/signals';

const COUNT = 6;
const SPACING = 104;
const X0 = 70;
const MAIN_Y = 96;
const WIDTH = X0 + COUNT * SPACING + 10;
const HEIGHT = 178;

const colour = (frame: number) => rgbCss(hsv((frame - 1) * 55, 0.85, 1));
const px = (k: number) => X0 + (k - 0.5) * SPACING;

/**
 * A chain with a backup data line. Tap a pixel to break it: the next pixel
 * stops hearing anything on its main input and listens to its backup input,
 * which is wired to the same line as the broken pixel's input. Break two
 * pixels in a row and the backup has nothing left to offer.
 */
export function BackupLine({ part, skipOnBackup }: { part: string; skipOnBackup: boolean }) {
  const [dead, setDead] = useState<Set<number>>(() => new Set([3]));
  const pixels = useMemo(() => backupChain(COUNT, dead, skipOnBackup), [dead, skipOnBackup]);
  const toggle = (k: number) =>
    setDead((d) => {
      const next = new Set(d);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const dark = pixels.filter((p) => !p.dead && p.frame == null).length;
  const rerouted = pixels.filter((p) => p.via === 'backup').map((_, i) => i);
  const status =
    dead.size === 0
      ? 'All pixels work: each one listens to its main input.'
      : dark > 0
        ? `${dark} working pixel${dark === 1 ? ' gets' : 's get'} no data: two broken pixels in a row leave the backup line nothing to carry.`
        : `${dead.size === 1 ? 'The broken pixel stays dark' : 'The broken pixels stay dark'}; ${rerouted.length === 1 ? 'the pixel after it switches' : 'the pixels after them switch'} to the backup input, and every other pixel shows its own colour.`;

  return (
    <figure className="proto-figure">
      <div
        className="proto-stage"
        role="group"
        aria-label={`A ${part}-style chain with main and backup data lines`}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="proto-svg" aria-hidden="true">
          <rect x={2} y={MAIN_Y - 22} width={56} height={44} rx={8} className="proto-box" />
          <text x={30} y={MAIN_Y + 4} textAnchor="middle" className="proto-box-label">
            Ctrl
          </text>
          {/* Main line: controller → 1 → 2 → … */}
          {Array.from({ length: COUNT }, (_, i) => {
            const k = i + 1;
            const from = k === 1 ? 58 : px(k - 1) + 22;
            const to = px(k) - 22;
            const active = pixels[i].via === 'main';
            return (
              <line
                key={`m${k}`}
                x1={from}
                x2={to}
                y1={MAIN_Y}
                y2={MAIN_Y}
                className={`proto-wire${active ? ' proto-wire--active' : ''}`}
              />
            );
          })}
          {/* Backup line: pixel k's backup input hangs off pixel k-1's main input */}
          {Array.from({ length: COUNT - 1 }, (_, i) => {
            const k = i + 2;
            const tap = k === 2 ? 58 + 6 : px(k - 2) + 22 + 6;
            const active = pixels[k - 1].via === 'backup';
            // Alternate heights so neighbouring backup runs don't overlap
            const y = MAIN_Y + (k % 2 ? 50 : 36);
            const d = `M ${tap} ${MAIN_Y} L ${tap} ${y} L ${px(k) - 8} ${y} L ${px(k) - 8} ${MAIN_Y + 22}`;
            return (
              <g key={`b${k}`}>
                <circle cx={tap} cy={MAIN_Y} r={2.5} className="proto-node" />
                <path d={d} className={`proto-backup${active ? ' proto-backup--active' : ''}`} />
              </g>
            );
          })}
          {pixels.map((p, i) => {
            const k = i + 1;
            const cx = px(k);
            const fill = p.frame != null ? colour(p.frame) : undefined;
            return (
              <g key={k} className="proto-pixel-button" onClick={() => toggle(k)}>
                <circle cx={cx} cy={MAIN_Y - 46} r={11} style={{ fill }} className="proto-led" />
                {p.frame != null && p.frame !== k && (
                  <text
                    x={cx}
                    y={MAIN_Y - 66}
                    textAnchor="middle"
                    className="proto-note proto-note--bad"
                  >
                    shows #{p.frame}
                  </text>
                )}
                <rect
                  x={cx - 22}
                  y={MAIN_Y - 22}
                  width={44}
                  height={44}
                  rx={8}
                  className={`proto-pixel${p.dead ? ' proto-pixel--dead' : ''}`}
                />
                <text x={cx} y={MAIN_Y + 1} textAnchor="middle" className="proto-pixel-label">
                  {p.dead ? '✕' : k}
                </text>
                <text x={cx - 25} y={MAIN_Y - 5} textAnchor="end" className="proto-pin">
                  DI
                </text>
                {k > 1 && (
                  <text x={cx - 11} y={MAIN_Y + 33} textAnchor="end" className="proto-pin">
                    BI
                  </text>
                )}
              </g>
            );
          })}
          <text x={X0} y={HEIGHT - 6} className="proto-note">
            solid: main data line · dashed: backup line · highlighted: what each pixel listens to
          </text>
        </svg>
      </div>
      <div className="proto-controls" role="group" aria-label="Break or repair a pixel">
        {pixels.map((p, i) => (
          <button
            key={i}
            type="button"
            className="btn btn--outline btn--sm proto-control"
            aria-pressed={p.dead}
            onClick={() => toggle(i + 1)}
          >
            {p.dead ? `Repair pixel ${i + 1}` : `Break pixel ${i + 1}`}
          </button>
        ))}
      </div>
      <p className="proto-status" aria-live="polite">
        {status}
      </p>
      <figcaption className="proto-caption">
        Six {part}-style pixels. Each has a main data input (DI) and a backup input (BI) wired to
        the line one pixel further back. Tap a pixel, or use the buttons, to break it or repair it.
      </figcaption>
    </figure>
  );
}
