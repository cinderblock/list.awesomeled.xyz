/**
 * Which frame each pixel of a chain ends up with when some pixels are dead,
 * for chains with a second (backup) data input wired WS2813-style: each
 * pixel's backup input sits on the same wire as the previous pixel's main
 * input, so it hears everything the previous pixel heard.
 */

export interface BackupPixel {
  /** Frame (1-based) this pixel shows, or null when it gets no data */
  frame: number | null;
  /** Which input it listens to */
  via: 'main' | 'backup' | null;
  dead: boolean;
}

/**
 * @param count pixels in the chain
 * @param dead 1-based numbers of the dead pixels
 * @param skipOnBackup a pixel listening to its backup input skips the first
 *   frame there (the one meant for the dead pixel before it)
 */
export function backupChain(
  count: number,
  dead: ReadonlySet<number>,
  skipOnBackup: boolean
): BackupPixel[] {
  // What each pixel sends on: the number of the first frame in its output
  // stream, or null for silence. Index 0 is the controller (frame 1 onwards).
  const out: (number | null)[] = [1];
  const pixels: BackupPixel[] = [];
  for (let k = 1; k <= count; k++) {
    const main = out[k - 1];
    // Pixel 1's backup input is on the controller's line, like its main one
    const backup = k >= 2 ? out[k - 2] : out[0];
    if (dead.has(k)) {
      pixels.push({ frame: null, via: null, dead: true });
      out.push(null);
      continue;
    }
    let start: number | null = null;
    let via: BackupPixel['via'] = null;
    if (main != null) {
      start = main;
      via = 'main';
    } else if (backup != null) {
      start = backup + (skipOnBackup && k >= 2 ? 1 : 0);
      via = 'backup';
    }
    const frame = start != null && start <= count ? start : null;
    pixels.push({ frame, via: frame != null ? via : null, dead: false });
    out.push(frame != null && frame + 1 <= count ? frame + 1 : null);
  }
  return pixels;
}
