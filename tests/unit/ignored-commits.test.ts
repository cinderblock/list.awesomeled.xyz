import { describe, expect, test } from 'bun:test';
import { spawnSync } from 'child_process';
import { IGNORED_COMMITS } from '../../app/lib/data';

// A mistyped hash silently stops ignoring its batch, so the rows it touched
// show that batch's date as "Reviewed". Needs the full history (CI checks
// out with fetch-depth 0); a shallow clone skips the lookup.
const git = (args: string[], input?: string) =>
  spawnSync('git', args, { input, encoding: 'utf8' }).stdout.trim();
const shallow = git(['rev-parse', '--is-shallow-repository']) !== 'false';

describe('IGNORED_COMMITS', () => {
  test('every hash is a full 40-character SHA-1', () => {
    expect([...IGNORED_COMMITS].filter((hash) => !/^[0-9a-f]{40}$/.test(hash))).toEqual([]);
  });

  if (!shallow) {
    test('every hash names a commit in this repository', () => {
      const hashes = [...IGNORED_COMMITS];
      // One line per hash: "<hash> commit <size>", or "<hash> missing"
      const lines = git(['cat-file', '--batch-check'], hashes.join('\n') + '\n').split(/\r?\n/);
      expect(lines).toHaveLength(hashes.length);
      expect(lines.filter((line: string) => !/^[0-9a-f]{40} commit \d+$/.test(line))).toEqual([]);
    });
  }
});
