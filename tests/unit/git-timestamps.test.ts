import { describe, expect, test } from 'bun:test';
import { lastReviewTimes } from '../../app/lib/data';

// Synthetic `git log --format='%H %aI <Not-A-Review>' --name-status -M` output,
// newest commit first, so these tests don't depend on the real history.
const hash = (n: number) => String(n).repeat(40);
const commit = (n: number, day: string, notAReview = '') =>
  `${hash(n)} 2026-11-${day}T12:00:00-08:00 ${notAReview}`.trimEnd();

describe('lastReviewTimes', () => {
  test('newest reviewing commit per file', () => {
    const log = [
      commit(3, '18'),
      '',
      'M\tdatabase/pixels/a.yaml',
      commit(2, '10'),
      '',
      'M\tdatabase/pixels/a.yaml',
      'A\tdatabase/pixels/b.yaml',
    ].join('\n');
    expect(lastReviewTimes(log, new Set())).toEqual(
      new Map([
        ['database/pixels/a.yaml', '2026-11-18T12:00:00-08:00'],
        ['database/pixels/b.yaml', '2026-11-10T12:00:00-08:00'],
      ])
    );
  });

  test('ignored and Not-A-Review commits do not count', () => {
    const log = [
      commit(3, '18', 'formatting only'),
      '',
      'M\tdatabase/pixels/a.yaml',
      commit(2, '12'),
      '',
      'M\tdatabase/pixels/a.yaml',
      commit(1, '01'),
      '',
      'M\tdatabase/pixels/b.yaml',
    ].join('\n');
    const times = lastReviewTimes(log, new Set([hash(1)]));
    expect(times.get('database/pixels/a.yaml')).toBe('2026-11-12T12:00:00-08:00');
    expect(times.has('database/pixels/b.yaml')).toBe(false);
  });

  test('a rename carries history to the new path; a new file at the old path starts fresh', () => {
    const log = [
      // newest: a different product takes over the freed slug
      commit(4, '18'),
      '',
      'A\tdatabase/microboards/teensy-2-0.yaml',
      // the rename itself is not a review
      commit(3, '17', 'slug rename'),
      '',
      'R100\tdatabase/microboards/teensy-2-0.yaml\tdatabase/microboards/teensy-plus-plus-2-0.yaml',
      // older work on the old path belongs to the renamed board
      commit(2, '05'),
      '',
      'M\tdatabase/microboards/teensy-2-0.yaml',
    ].join('\n');
    const times = lastReviewTimes(log, new Set());
    expect(times.get('database/microboards/teensy-2-0.yaml')).toBe('2026-11-18T12:00:00-08:00');
    expect(times.get('database/microboards/teensy-plus-plus-2-0.yaml')).toBe(
      '2026-11-05T12:00:00-08:00'
    );
  });

  test('chained renames credit the final path', () => {
    const log = [
      commit(3, '18', 'rename'),
      '',
      'R100\tdatabase/x/b.yaml\tdatabase/x/c.yaml',
      commit(2, '10', 'rename'),
      '',
      'R095\tdatabase/x/a.yaml\tdatabase/x/b.yaml',
      commit(1, '02'),
      '',
      'M\tdatabase/x/a.yaml',
    ].join('\n');
    const times = lastReviewTimes(log, new Set());
    expect(times.get('database/x/c.yaml')).toBe('2026-11-02T12:00:00-08:00');
    expect(times.has('database/x/a.yaml')).toBe(false);
  });
});
