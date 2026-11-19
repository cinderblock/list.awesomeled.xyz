import { describe, expect, test } from 'bun:test';
import {
  dataLines,
  dataVoltage,
  evaluateConnector,
  evaluateController,
  evaluateShifter,
  evaluateSource,
  evaluateStandalone,
  levelNeed,
  logicThreshold,
  planGroup,
  protocolSupport,
  runsOn,
  sortIssues,
  unitsNeeded,
  wiresNeeded,
  worstSeverity,
  type ControllerOption,
  type FitInput,
  type Issue,
  type Layout,
  type PixelOption,
} from '../../app/lib/designer';
import { fixtureIndex, must } from './fixtures';

const index = fixtureIndex();
const pixel = (id: string) => must(index.pixels, id);
const controller = (id: string) => must(index.controllers, id);
const shifter = (id: string) => must(index.shifters, id);
const connector = (id: string) => must(index.connectors, id);
const source = (id: string) => must(index.sources, id);

const settings = { brightness: 100, feedAmps: 4, wireMeters: 2 };

function fit(
  c: ControllerOption,
  p: PixelOption | null,
  layout: Layout,
  extra: Partial<FitInput> = {}
) {
  const voltage = p?.voltage ?? 5;
  return evaluateController(c, {
    pixel: p,
    voltage,
    layout,
    totalStrings: layout.strings,
    power: p ? planGroup(p, layout, voltage, settings) : null,
    targetFps: 30,
    outdoor: false,
    hasShifter: false,
    ...extra,
  });
}

const codes = (issues: Issue[]) => issues.map((i) => i.code);
const find = (issues: Issue[], code: string) => issues.find((i) => i.code === code);

describe('clock line', () => {
  test('a clocked pixel on data-only outputs is an error', () => {
    const result = fit(controller('async4'), pixel('clk5'), { strings: 1, perString: 100 });
    expect(result.ok).toBe(false);
    expect(find(result.issues, 'clock-line')?.severity).toBe('error');
  });

  test('a data-only pixel on clocked-only outputs is an error', () => {
    const result = fit(controller('raw1'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(find(result.issues, 'clock-line')?.severity).toBe('error');
  });

  test('selectable outputs take both, with a note about pin count for clocked', () => {
    const data = fit(controller('big16'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(codes(data.issues)).not.toContain('clock-line');
    expect(codes(data.issues)).not.toContain('clock-pins');
    const clocked = fit(controller('big16'), pixel('clk5'), { strings: 1, perString: 100 });
    expect(clocked.ok).toBe(true);
    expect(find(clocked.issues, 'clock-pins')?.severity).toBe('info');
  });

  test('unknown support is a note, never an error', () => {
    const result = fit(controller('mystery'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(result.ok).toBe(true);
    expect(find(result.issues, 'clock-unknown')?.severity).toBe('info');
  });
});

describe('outputs', () => {
  test('too few outputs means more units', () => {
    expect(unitsNeeded(controller('async4'), 4)).toBe(1);
    expect(unitsNeeded(controller('async4'), 5)).toBe(2);
    expect(unitsNeeded(controller('mystery'), 99)).toBe(1); // unknown count

    const result = fit(controller('async4'), pixel('rgb5'), { strings: 10, perString: 100 });
    expect(result.ok).toBe(true);
    expect(result.units).toBe(3);
    expect(find(result.issues, 'multiple-units')?.severity).toBe('info');
  });

  test('strings on other groups sharing the controller count too', () => {
    const result = fit(
      controller('async4'),
      pixel('rgb5'),
      { strings: 2, perString: 100 },
      { totalStrings: 9 }
    );
    expect(result.units).toBe(3);
  });

  test('an absurd number of units is an error', () => {
    const result = fit(controller('raw1'), pixel('clk5'), { strings: 9, perString: 50 });
    expect(result.units).toBe(9);
    expect(find(result.issues, 'too-many-units')?.severity).toBe('error');
    expect(result.ok).toBe(false);
  });

  test('an unrecorded output count is flagged for checking', () => {
    const result = fit(controller('mystery'), pixel('rgb5'), { strings: 3, perString: 100 });
    expect(find(result.issues, 'outputs-unknown')?.severity).toBe('info');
  });
});

describe('pixels per output', () => {
  test('over the limit is an error; at the limit is fine', () => {
    const over = fit(controller('async4'), pixel('rgb5'), { strings: 1, perString: 681 });
    expect(find(over.issues, 'per-output')?.severity).toBe('error');
    const at = fit(controller('async4'), pixel('rgb5'), { strings: 1, perString: 680 });
    expect(codes(at.issues)).not.toContain('per-output');
  });

  test('the longest of varied strings is what counts', () => {
    const result = fit(controller('async4'), pixel('rgb5'), {
      strings: 2,
      perString: 700,
      lengths: [100, 700],
    });
    expect(find(result.issues, 'per-output')?.message).toContain('longest string');
  });

  test('RGBW pixels fit fewer per output than the RGB figure', () => {
    // 680 RGB pixels of channel budget hold 510 RGBW pixels
    const over = fit(controller('async4'), pixel('rgbw5'), { strings: 1, perString: 600 });
    expect(find(over.issues, 'per-output-channels')?.severity).toBe('warning');
    expect(find(over.issues, 'per-output-channels')?.message).toContain('510');
    expect(over.ok).toBe(true);
    const under = fit(controller('async4'), pixel('rgbw5'), { strings: 1, perString: 510 });
    expect(codes(under.issues)).not.toContain('per-output-channels');
  });

  test('an unrecorded limit is a note on controllers, silent on dev boards', () => {
    const c = fit(controller('wild8'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(find(c.issues, 'per-output-unknown')?.severity).toBe('info');
    const b = fit(controller('mb-esp'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(codes(b.issues)).not.toContain('per-output-unknown');
  });
});

describe('vendor protocol lists', () => {
  test('no list says nothing', () => {
    expect(protocolSupport(controller('big16'), pixel('rgb5')).support).toBe('unknown');
  });

  test('a part named in the list (by name, alias or variant) is listed', () => {
    expect(protocolSupport(controller('async4'), pixel('rgb5')).support).toBe('listed');
    expect(protocolSupport(controller('async4'), pixel('ic-ic12')).support).toBe('listed');
  });

  test('another part of the same protocol family counts as family support', () => {
    const result = protocolSupport(controller('async4'), pixel('rgb12'));
    expect(result.support).toBe('family');
    expect(result.via).toBe('WS2811/12');
  });

  test('wildcards such as "WS281x" match the family', () => {
    const result = protocolSupport(controller('wild8'), pixel('rgb5'));
    expect(result.support).toBe('family');
    expect(result.via).toBe('WS281x');
  });

  test('a list that matches nothing is a warning, not an error', () => {
    expect(protocolSupport(controller('async4'), pixel('wide')).support).toBe('unlisted');
    const result = fit(controller('wild8'), pixel('clk5'), { strings: 1, perString: 100 });
    expect(result.support).toBe('unlisted');
    expect(find(result.issues, 'protocol-unlisted')?.severity).toBe('warning');
    expect(result.ok).toBe(true);
  });

  test('deep-colour pixels get a note unless explicitly listed', () => {
    const result = fit(controller('big16'), pixel('deep5'), { strings: 1, perString: 100 });
    expect(find(result.issues, 'deep-colour')?.severity).toBe('info');
    const plain = fit(controller('big16'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(codes(plain.issues)).not.toContain('deep-colour');
  });
});

describe('supply voltage', () => {
  test('pixels above the controller’s maximum must be powered separately', () => {
    const result = fit(controller('async4'), pixel('rgb12'), { strings: 1, perString: 100 });
    const issue = find(result.issues, 'voltage-over');
    expect(issue?.severity).toBe('warning');
    expect(issue?.fix).toContain('join the grounds');
    expect(result.ok).toBe(true);
  });

  test('pixels below the controller’s minimum need a second supply', () => {
    const result = fit(controller('cape'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(find(result.issues, 'voltage-under')?.severity).toBe('warning');
  });

  test('inside the range is silent; an unrecorded range is silent', () => {
    for (const id of ['big16', 'mystery']) {
      const result = fit(controller(id), pixel('rgb12'), { strings: 1, perString: 100 });
      expect(codes(result.issues)).not.toContain('voltage-over');
      expect(codes(result.issues)).not.toContain('voltage-under');
    }
  });

  test('a dev board is never put on a 12 V rail', () => {
    const result = fit(controller('mb-esp'), pixel('rgb12'), { strings: 1, perString: 100 });
    expect(find(result.issues, 'voltage-over')?.severity).toBe('warning');
  });
});

describe('output current', () => {
  test('a feed heavier than the output rating is flagged', () => {
    // 100 px × 60 mA = 6 A -> 2 feeds of 3 A: exactly the 3 A rating
    const ok = fit(controller('async4'), pixel('rgb5'), { strings: 1, perString: 100 });
    expect(codes(ok.issues)).not.toContain('output-current');
    // 60 px = 3.6 A in one feed: over the 3 A rating
    const over = fit(controller('async4'), pixel('rgb5'), { strings: 1, perString: 60 });
    const issue = find(over.issues, 'output-current');
    expect(issue?.severity).toBe('warning');
    expect(issue?.slot).toBe('power');
    expect(issue?.message).toContain('3A fuse');
  });
});

describe('logic levels', () => {
  test('where the data voltage comes from', () => {
    expect(dataVoltage(controller('big16'))).toBe(5); // buffered
    expect(dataVoltage(controller('raw1'))).toBe(3.3); // unbuffered CPU pins
    expect(dataVoltage(controller('mb-esp'))).toBe(3.3); // recorded GPIO level
    expect(dataVoltage(controller('mb-avr5'))).toBe(5);
    expect(dataVoltage(controller('mystery'))).toBeNull();
  });

  test('the threshold is the recorded one, else 0.7 × a 5 V logic supply', () => {
    expect(logicThreshold(pixel('rgb5'))).toBe(3.5);
    expect(logicThreshold(pixel('rgb5-lowvih'))).toBe(3.0);
    expect(logicThreshold(pixel('rgbw5'))).toBeCloseTo(3.5, 9);
    // a 12 V pixel still has ~5 V logic inside
    expect(logicThreshold(pixel('ic-ic-strong'))).toBeCloseTo(3.5, 9);
  });

  test('3.3 V data into a 3.5 V threshold needs a shifter', () => {
    expect(levelNeed(controller('mb-esp'), pixel('rgb5'))).toBe('required');
    const result = fit(controller('mb-esp'), pixel('rgb5'), { strings: 1, perString: 100 });
    const issue = find(result.issues, 'level-shift');
    expect(issue?.severity).toBe('warning');
    expect(issue?.slot).toBe('shifter');
    expect(result.level).toBe('required');
  });

  test('a shifter already in the design answers the warning', () => {
    const result = fit(
      controller('mb-esp'),
      pixel('rgb5'),
      { strings: 1, perString: 100 },
      { hasShifter: true }
    );
    expect(codes(result.issues)).not.toContain('level-shift');
  });

  test('3.3 V data into a 3.0 V threshold is marginal', () => {
    expect(levelNeed(controller('mb-esp'), pixel('rgb5-lowvih'))).toBe('marginal');
    const result = fit(controller('mb-esp'), pixel('rgb5-lowvih'), { strings: 1, perString: 50 });
    expect(find(result.issues, 'level-marginal')?.severity).toBe('info');
  });

  test('5 V data is fine; unknown outputs say nothing', () => {
    expect(levelNeed(controller('big16'), pixel('rgb5'))).toBe('ok');
    expect(levelNeed(controller('mb-avr5'), pixel('rgb5'))).toBe('ok');
    expect(levelNeed(controller('mystery'), pixel('rgb5'))).toBe('unknown');
    const result = fit(controller('mystery'), pixel('rgb5'), { strings: 1, perString: 50 });
    expect(codes(result.issues)).not.toContain('level-shift');
  });
});

describe('other controller notes', () => {
  test('host board, refresh limit, discontinued', () => {
    const result = fit(
      controller('cape'),
      pixel('rgb12'),
      { strings: 1, perString: 100 },
      { targetFps: 40 }
    );
    expect(find(result.issues, 'requires-host')?.message).toContain('PiBoard');
    expect(find(result.issues, 'controller-fps')?.severity).toBe('info');
    expect(find(result.issues, 'retired')?.severity).toBe('warning');
  });

  test('dev boards carry a do-it-yourself note', () => {
    const result = fit(controller('mb-esp'), pixel('rgb5'), { strings: 1, perString: 50 });
    expect(find(result.issues, 'diy-board')?.severity).toBe('info');
  });

  test('outdoors, an unrated controller needs an enclosure', () => {
    const bare = fit(
      controller('big16'),
      pixel('rgb5'),
      { strings: 1, perString: 50 },
      { outdoor: true }
    );
    expect(find(bare.issues, 'outdoor-enclosure')?.severity).toBe('info');
    const sealed = fit(
      controller('cape'),
      pixel('rgb12'),
      { strings: 1, perString: 50 },
      { outdoor: true }
    );
    expect(codes(sealed.issues)).not.toContain('outdoor-enclosure');
  });

  test('a controller can be rated before any pixel is chosen', () => {
    const result = fit(controller('async4'), null, { strings: 6, perString: 700 });
    expect(result.units).toBe(2);
    expect(find(result.issues, 'per-output')?.severity).toBe('error');
    expect(result.support).toBe('unknown');
  });
});

describe('level shifters', () => {
  test('one data line per string, two when clocked', () => {
    expect(dataLines({ strings: 8, perString: 100 }, pixel('rgb5'))).toBe(8);
    expect(dataLines({ strings: 8, perString: 100 }, pixel('clk5'))).toBe(16);
    expect(dataLines({ strings: 3, perString: 100 }, null)).toBe(3);
  });

  test('quantity covers every line', () => {
    const input = { controller: controller('mb-esp'), pixel: pixel('rgb5') };
    expect(evaluateShifter(shifter('quad'), { ...input, lines: 8 }).qty).toBe(2);
    expect(evaluateShifter(shifter('quad'), { ...input, lines: 9 }).qty).toBe(3);
    expect(evaluateShifter(shifter('octal'), { ...input, lines: 8 }).qty).toBe(1);
  });

  test('a part that can’t reach 5 V logic is an error', () => {
    const result = evaluateShifter(shifter('lowv'), {
      controller: controller('mb-esp'),
      pixel: pixel('rgb5'),
      lines: 1,
    });
    expect(result.ok).toBe(false);
    expect(find(result.issues, 'shifter-voltage')?.severity).toBe('error');
  });

  test('a differential receiver only suits differential outputs', () => {
    const wrong = evaluateShifter(shifter('diff'), {
      controller: controller('mb-esp'),
      pixel: pixel('rgb5'),
      lines: 4,
    });
    expect(find(wrong.issues, 'shifter-differential')?.severity).toBe('warning');
    const right = evaluateShifter(shifter('diff'), {
      controller: controller('big16'),
      pixel: pixel('rgb5'),
      lines: 4,
    });
    expect(codes(right.issues)).not.toContain('shifter-differential');
  });

  test('a shifter on already-5 V outputs is noted as optional', () => {
    const result = evaluateShifter(shifter('quad'), {
      controller: controller('big16'),
      pixel: pixel('rgb5'),
      lines: 4,
    });
    expect(find(result.issues, 'shifter-unneeded')?.severity).toBe('info');
    expect(result.ok).toBe(true);
  });
});

describe('connectors', () => {
  const input = (
    p: PixelOption,
    layout: Layout,
    extra: Partial<Parameters<typeof evaluateConnector>[1]> = {}
  ) => ({
    pixel: p,
    voltage: p.voltage ?? 5,
    power: planGroup(p, layout, p.voltage ?? 5, settings),
    controller: null,
    outdoor: false,
    ...extra,
  });

  test('three conductors for data-only pixels, four for clocked', () => {
    expect(wiresNeeded(pixel('rgb5'))).toBe(3);
    expect(wiresNeeded(pixel('clk5'))).toBe(4);
    expect(wiresNeeded(null)).toBe(3);
  });

  test('too few contacts is an error', () => {
    const result = evaluateConnector(
      connector('two-pin'),
      input(pixel('rgb5'), { strings: 1, perString: 50 })
    );
    expect(result.ok).toBe(false);
    expect(find(result.issues, 'connector-pins')?.message).toContain('needs 3');
    // a 4-way connector takes a clocked string
    const four = evaluateConnector(
      connector('pigtail'),
      input(pixel('clk5'), { strings: 1, perString: 50 })
    );
    expect(codes(four.issues)).not.toContain('connector-pins');
  });

  test('spare contacts are only a note', () => {
    const result = evaluateConnector(
      connector('eight'),
      input(pixel('rgb5'), { strings: 1, perString: 10 })
    );
    expect(find(result.issues, 'connector-spare')?.severity).toBe('info');
    expect(result.ok).toBe(true);
  });

  test('a feed heavier than the contact rating is a warning', () => {
    // 60 px × 60 mA = 3.6 A through a 2 A contact
    const result = evaluateConnector(
      connector('lowvolt'),
      input(pixel('rgb5'), { strings: 1, perString: 60 })
    );
    expect(find(result.issues, 'connector-current')?.severity).toBe('warning');
    // the 5 A pigtail carries it
    const ok = evaluateConnector(
      connector('pigtail'),
      input(pixel('rgb5'), { strings: 1, perString: 60 })
    );
    expect(codes(ok.issues)).not.toContain('connector-current');
  });

  test('a voltage rating below the rail is an error', () => {
    const result = evaluateConnector(
      connector('lowvolt'),
      input(pixel('rgb12'), { strings: 1, perString: 10 })
    );
    expect(find(result.issues, 'connector-voltage')?.severity).toBe('error');
  });

  test('outdoors wants IP65 or better', () => {
    const p = pixel('rgb5');
    const layout = { strings: 1, perString: 10 };
    const sealed = evaluateConnector(connector('pigtail'), input(p, layout, { outdoor: true }));
    expect(codes(sealed.issues)).not.toContain('connector-ip');
    const range = evaluateConnector(connector('lowvolt'), input(p, layout, { outdoor: true }));
    expect(codes(range.issues)).not.toContain('connector-ip'); // IP20-IP65: best case
    const open = evaluateConnector(connector('screw'), input(p, layout, { outdoor: true }));
    expect(find(open.issues, 'connector-ip')?.severity).toBe('warning');
    const indoors = evaluateConnector(connector('screw'), input(p, layout));
    expect(codes(indoors.issues)).not.toContain('connector-ip');
  });

  test('knows when it is the connector the controller already uses', () => {
    const p = pixel('rgb5');
    const layout = { strings: 1, perString: 10 };
    const same = evaluateConnector(
      connector('screw'),
      input(p, layout, { controller: controller('big16') })
    );
    expect(same.matchesController).toBe(true);
    const other = evaluateConnector(
      connector('pigtail'),
      input(p, layout, { controller: controller('big16') })
    );
    expect(other.matchesController).toBe(false);
  });
});

describe('pattern sources', () => {
  test('a shared protocol reaches the controller', () => {
    const result = evaluateSource(source('seq'), [controller('big16')]);
    expect(result.ok).toBe(true);
    expect(result.links).toEqual(['protocol']);
    expect(result.shared).toEqual(['artnet', 'sacn']);
  });

  test('every controller must be reachable; shared protocols intersect', () => {
    const result = evaluateSource(source('seq'), [controller('big16'), controller('async4')]);
    expect(result.ok).toBe(true);
    expect(result.shared).toEqual(['sacn']);
  });

  test('no protocol in common is an error', () => {
    const result = evaluateSource(source('ddponly'), [controller('async4')]);
    expect(result.ok).toBe(false);
    expect(result.links).toEqual(['none']);
    expect(find(result.issues, 'source-protocol')?.message).toContain('DDP');
  });

  test('firmware named by the controller runs on it', () => {
    expect(runsOn(source('player'), controller('big16'))).toBe(true); // "FPP" alias
    expect(runsOn(source('espfw'), controller('raw1'))).toBe(true); // wled_compatible
    expect(runsOn(source('seq'), controller('big16'))).toBe(false);
    const result = evaluateSource(source('player'), [controller('big16')]);
    expect(result.links).toEqual(['onboard']);
  });

  test('firmware runs on dev boards whose platform it lists', () => {
    expect(runsOn(source('espfw'), controller('mb-esp'))).toBe(true);
    expect(runsOn(source('espfw'), controller('mb-avr5'))).toBe(false);
    expect(runsOn(source('player'), controller('mb-pi'))).toBe(true);
  });

  test('unrecorded inputs are a note, not an error', () => {
    const result = evaluateSource(source('seq'), [controller('mb-esp')]);
    expect(result.ok).toBe(true);
    expect(result.links).toEqual(['unverified']);
    expect(find(result.issues, 'source-unverified')?.severity).toBe('info');
  });

  test('unmaintained software is flagged', () => {
    const result = evaluateSource(source('player'), [controller('big16')]);
    expect(find(result.issues, 'retired')?.severity).toBe('warning');
  });

  test('standalone playback needs every controller to play on its own', () => {
    expect(evaluateStandalone([controller('big16'), controller('cape')])).toEqual([]);
    const issues = evaluateStandalone([controller('big16'), controller('async4')]);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe('error');
    expect(issues[0].message).toContain('Async4');
  });
});

describe('issue helpers', () => {
  const issues: Issue[] = [
    { severity: 'info', code: 'a', slot: 'pixels', group: 1, message: '' },
    { severity: 'error', code: 'b', slot: 'controller', group: 1, message: '' },
    { severity: 'warning', code: 'c', slot: 'power', message: '' },
    { severity: 'error', code: 'd', slot: 'controller', group: 0, message: '' },
  ];

  test('worst first, then system-wide before groups in order', () => {
    expect(sortIssues(issues).map((i) => i.code)).toEqual(['d', 'b', 'c', 'a']);
  });

  test('worstSeverity', () => {
    expect(worstSeverity(issues)).toBe('error');
    expect(worstSeverity(issues.filter((i) => i.severity !== 'error'))).toBe('warning');
    expect(worstSeverity([issues[0]])).toBe('info');
    expect(worstSeverity([])).toBeNull();
  });
});
