import { describe, expect, test } from 'bun:test';
import { backupChain } from '../../app/lib/protocols/backup';
import {
  clockedCycleSeconds,
  clockedPhaseAt,
  type ClockedGeometry,
} from '../../app/lib/protocols/clockedChain';
import {
  apa102LedFrame,
  byteBitsLsbFirst,
  byteBitsMsbFirst,
  chainCycleSeconds,
  chainPhaseAt,
  chainSendSeconds,
  channelBytes,
  irregularPeriods,
  pulseWaveform,
  refreshRate,
  type ChainGeometry,
} from '../../app/lib/protocols/signals';

describe('bits', () => {
  test('pixel data goes most significant bit first, DMX slots least significant first', () => {
    expect(byteBitsMsbFirst(0x8c)).toEqual([1, 0, 0, 0, 1, 1, 0, 0]);
    expect(byteBitsLsbFirst(0x8c)).toEqual([0, 0, 1, 1, 0, 0, 0, 1]);
  });

  test('channel order picks the bytes in the order the part wants them', () => {
    const color = { r: 255, g: 140, b: 0 };
    expect(channelBytes(color, 'GRB').map((c) => c.value)).toEqual([140, 255, 0]);
    expect(channelBytes(color, 'RGB').map((c) => c.channel)).toEqual(['r', 'g', 'b']);
    expect(channelBytes(color, 'bgr').map((c) => c.channel)).toEqual(['b', 'g', 'r']);
  });

  test('an APA102-style frame is 32 bits: 111, five brightness bits, three colour bytes', () => {
    const frame = apa102LedFrame({ r: 1, g: 2, b: 3 }, 31, 'BGR');
    expect(frame.map((f) => f.field)).toEqual(['marker', 'brightness', 'b', 'g', 'r']);
    expect(frame.flatMap((f) => f.bits)).toHaveLength(32);
    expect(frame[0].bits).toEqual([1, 1, 1]);
    expect(frame[1].bits).toEqual([1, 1, 1, 1, 1]);
    expect(apa102LedFrame({ r: 0, g: 0, b: 0 }, 5, 'BGR')[1].bits).toEqual([0, 0, 1, 0, 1]);
  });

  test('irregular clock periods keep their pattern and never shrink to nothing', () => {
    const periods = irregularPeriods(32, 1);
    expect(periods).toHaveLength(32);
    expect(Math.min(...periods)).toBeGreaterThan(0.5);
    expect(irregularPeriods(32, 1)).toEqual(periods);
  });
});

describe('single-wire waveform', () => {
  const timing = { t0h: 400, t1h: 800, period: 1250 };

  test('each bit is one high pulse then low until the next bit', () => {
    const wave = pulseWaveform([0, 1], timing);
    expect(wave).toEqual([
      { level: 1, start: 0, end: 400 },
      { level: 0, start: 400, end: 1250 },
      { level: 1, start: 1250, end: 2050 },
      { level: 0, start: 2050, end: 2500 },
    ]);
  });

  test('refresh rate: every pixel’s bits plus the reset gap', () => {
    // 1000 pixels × 24 bits × 1.25 µs = 30 ms, plus 280 µs of reset
    const { frameNs, fps } = refreshRate(1000, 24, 1250, 280_000);
    expect(frameNs).toBe(30_280_000);
    expect(fps).toBeCloseTo(33.03, 2);
  });
});

describe('chain animation model', () => {
  const geo: ChainGeometry = {
    pixels: 3,
    spacing: 100,
    frameLength: 50,
    speed: 100,
    resetSeconds: 1,
    holdSeconds: 1,
  };

  test('frame k stops at pixel k, so the stream is one frame shorter after each pixel', () => {
    // 2.6 s in: frame 1 has been swallowed by pixel 1; frame 2 sits partly in pixel 2
    const phase = chainPhaseAt(geo, 2.6);
    expect(phase.stage).toBe('sending');
    expect(phase.received[0]).toBe(1);
    for (const block of phase.blocks) {
      expect(block.to).toBeLessThanOrEqual(block.target * geo.spacing);
      expect(block.from).toBeLessThan(block.to);
    }
    expect(phase.blocks.map((b) => b.target)).not.toContain(1);
  });

  test('nothing latches until the reset gap has passed', () => {
    const send = chainSendSeconds(geo);
    expect(chainPhaseAt(geo, send - 0.01).stage).toBe('sending');
    expect(chainPhaseAt(geo, send + 0.5).stage).toBe('reset');
    expect(chainPhaseAt(geo, send + 0.5).resetProgress).toBeCloseTo(0.5, 5);
    expect(chainPhaseAt(geo, send + 1.01).stage).toBe('latched');
    expect(chainPhaseAt(geo, send + 0.5).received).toEqual([1, 1, 1]);
  });

  test('updates repeat with the cycle length', () => {
    const cycle = chainCycleSeconds(geo);
    const later = chainPhaseAt(geo, cycle + 0.1);
    const first = chainPhaseAt(geo, 0.1);
    expect(later.cycle).toBe(1);
    expect(later.blocks.map((b) => b.target)).toEqual(first.blocks.map((b) => b.target));
    later.blocks.forEach((b, i) => {
      expect(b.from).toBeCloseTo(first.blocks[i].from, 6);
      expect(b.to).toBeCloseTo(first.blocks[i].to, 6);
    });
  });
});

describe('backup data line', () => {
  test('with every pixel working, each listens to its main input and shows its own frame', () => {
    const chain = backupChain(5, new Set(), true);
    expect(chain.map((p) => p.frame)).toEqual([1, 2, 3, 4, 5]);
    expect(chain.every((p) => p.via === 'main')).toBe(true);
  });

  test('one dead pixel: the next one switches to its backup input and skips the dead pixel’s frame', () => {
    const chain = backupChain(5, new Set([3]), true);
    expect(chain.map((p) => p.frame)).toEqual([1, 2, null, 4, 5]);
    expect(chain[3].via).toBe('backup');
    expect(chain[4].via).toBe('main');
  });

  test('two dead pixels in a row leave everything after them without data', () => {
    const chain = backupChain(6, new Set([3, 4]), true);
    expect(chain.map((p) => p.frame)).toEqual([1, 2, null, null, null, null]);
  });

  test('two dead pixels apart are each bridged', () => {
    const chain = backupChain(6, new Set([2, 4]), true);
    expect(chain.map((p) => p.frame)).toEqual([1, null, 3, null, 5, 6]);
  });

  test('without skipping, a bridged pixel takes the dead pixel’s frame and the rest shift', () => {
    const chain = backupChain(5, new Set([3]), false);
    expect(chain.map((p) => p.frame)).toEqual([1, 2, null, 3, 4]);
  });
});

describe('clocked chain model', () => {
  const geo: ClockedGeometry = {
    pixels: 3,
    spacing: 100,
    frameLength: 50,
    endLength: 25,
    wireEnd: 400,
    speed: 100,
    holdSeconds: 1,
  };
  const apa = { sk9822: false, resetFrame: false };

  test('an LED frame carries its colour up to its pixel and zeros after it', () => {
    // 3 s in: frame 1 (offset 50) has its front at 250, well past pixel 1 at 100
    const phase = clockedPhaseAt(geo, apa, 3);
    const frame1 = phase.segments.filter((s) => s.kind === 'led' && s.target === 1);
    expect(frame1.every((s) => s.zeros)).toBe(true);
    const frame3 = phase.segments.filter((s) => s.kind === 'led' && s.target === 3);
    expect(frame3.length).toBeGreaterThan(0);
    for (const s of frame3) expect(s.zeros ? s.from >= 300 : s.to <= 300).toBe(true);
  });

  test('APA102s show a frame as soon as it is in; SK9822s wait for a start frame', () => {
    const cycle = clockedCycleSeconds(geo, apa);
    const late = cycle + cycle - 1.01; // the end of the second update
    expect(clockedPhaseAt(geo, apa, late).showing).toEqual([1, 1, 1]);
    // Without a reset frame an SK9822 string still shows the first update
    expect(clockedPhaseAt(geo, { sk9822: true, resetFrame: false }, late).showing).toEqual([
      0, 0, 0,
    ]);
    const withReset = { sk9822: true, resetFrame: true };
    const lateReset = clockedCycleSeconds(geo, withReset) * 2 - 1.01;
    expect(clockedPhaseAt(geo, withReset, lateReset).showing).toEqual([1, 1, 1]);
  });
});
