import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Timeline } from './useTimeline';

/**
 * One animated figure: the drawing, its controls and a caption.
 *
 * The status line names what the drawing shows right now. It is a live
 * region only while the animation is paused, so a screen reader hears each
 * step the reader asks for, not a commentary every few seconds.
 */
export function AnimatedFigure({
  timeline,
  label,
  status,
  caption,
  onStep,
  stepLabel = 'Next step',
  onRestart,
  extraControls,
  interactive = false,
  children,
  className,
}: {
  timeline: Timeline;
  /** What the drawing is, for a screen reader */
  label: string;
  /** The drawing has its own controls (a group, not a picture) */
  interactive?: boolean;
  /** What is happening at this moment (one short sentence) */
  status: ReactNode;
  caption: ReactNode;
  /** Jump to the next key moment (paused), for reading at one's own pace */
  onStep?: () => void;
  stepLabel?: string;
  onRestart?: () => void;
  extraControls?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { wantsToPlay, toggle, seek, observe } = timeline;
  return (
    <figure ref={observe} className={`proto-figure${className ? ` ${className}` : ''}`}>
      <div className="proto-stage" role={interactive ? 'group' : 'img'} aria-label={label}>
        {children}
      </div>
      <div className="proto-controls">
        <button
          type="button"
          className="btn btn--outline btn--sm proto-control"
          onClick={toggle}
          aria-label={wantsToPlay ? 'Pause animation' : 'Play animation'}
        >
          {wantsToPlay ? (
            <Pause size={14} aria-hidden="true" />
          ) : (
            <Play size={14} aria-hidden="true" />
          )}
          <span>{wantsToPlay ? 'Pause' : 'Play'}</span>
        </button>
        {onStep && (
          <button type="button" className="btn btn--outline btn--sm proto-control" onClick={onStep}>
            <SkipForward size={14} aria-hidden="true" />
            <span>{stepLabel}</span>
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost btn--sm proto-control"
          onClick={onRestart ?? (() => seek(0))}
        >
          <RotateCcw size={14} aria-hidden="true" />
          <span>Restart</span>
        </button>
        {extraControls}
      </div>
      <p className="proto-status" aria-live={wantsToPlay ? 'off' : 'polite'}>
        {status}
      </p>
      <figcaption className="proto-caption">{caption}</figcaption>
    </figure>
  );
}

/** A still figure (no clock), styled like the animated ones */
export function StillFigure({
  label,
  caption,
  children,
  className,
}: {
  label: string;
  caption: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`proto-figure${className ? ` ${className}` : ''}`}>
      <div className="proto-stage" role="img" aria-label={label}>
        {children}
      </div>
      <figcaption className="proto-caption">{caption}</figcaption>
    </figure>
  );
}
