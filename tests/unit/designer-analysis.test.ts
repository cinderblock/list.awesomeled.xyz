import { describe, expect, test } from 'bun:test';
import {
  analyzeDesign,
  bomSummary,
  bomToCsv,
  bomToMarkdown,
  bomToText,
  parseDesign,
  type Analysis,
  type BomLine,
} from '../../app/lib/designer';
import { fixtureIndex } from './fixtures';

const index = fixtureIndex();
const analyze = (query: string): Analysis =>
  analyzeDesign(parseDesign(new URLSearchParams(query)), index);
const codes = (a: Analysis) => a.issues.map((i) => i.code);
const line = (a: Analysis, key: string): BomLine => {
  const hit = a.bom.lines.find((l) => l.key === key);
  if (!hit) throw new Error(`no BOM line "${key}" in ${a.bom.lines.map((l) => l.key).join(', ')}`);
  return hit;
};

describe('an empty design', () => {
  const a = analyze('');

  test('has nothing to report', () => {
    expect(a.issues).toEqual([]);
    expect(a.counts).toEqual({ error: 0, warning: 0, info: 0 });
    expect(a.bom.lines).toEqual([]);
    expect(a.power.maxWatts).toBe(0);
    expect(a.groups).toHaveLength(1);
    expect(a.groups[0].pixel).toBeNull();
    expect(a.groups[0].label).toBe('Group 1');
  });
});

describe('a complete single-group design', () => {
  // 8 × 500 RGB5 on a 16-output controller, pigtail connectors, free sequencer
  const a = analyze('p=rgb5&x=8&n=500&c=big16&k=pigtail&g=seq');
  const g = a.groups[0];

  test('resolves every part', () => {
    expect(g.pixel?.name).toBe('RGB5');
    expect(g.controller?.name).toBe('Big16');
    expect(g.connector?.name).toBe('Pigtail');
    expect(a.source?.name).toBe('Sequencer');
    expect(a.missing).toEqual([]);
  });

  test('plans the power', () => {
    expect(g.pixels).toBe(4000);
    expect(g.voltage).toBe(5);
    expect(a.power.maxWatts).toBeCloseTo(1200, 6);
    expect(a.power.rails).toHaveLength(1);
    expect(a.power.rails[0].supply).toEqual({ count: 5, watts: 300 });
    expect(g.power?.longest.feeds).toBe(8);
    expect(a.power.warning).toBe('strong');
  });

  test('computes refresh and universes', () => {
    expect(g.fps).toBeCloseTo(66.67, 2);
    expect(a.universes).toBe(24);
  });

  test('is compatible, with the expected warnings and notes', () => {
    expect(a.counts.error).toBe(0);
    expect(g.controllerFit?.ok).toBe(true);
    expect(g.controllerFit?.units).toBe(1);
    expect(a.sourceFit?.shared).toEqual(['artnet', 'sacn']);
    expect(codes(a)).toContain('power-strong');
    expect(codes(a)).toContain('injection');
    expect(codes(a)).toContain('supply-split');
    expect(codes(a)).not.toContain('power-advisory');
  });

  test('issues carry their group index, not a text prefix', () => {
    const injection = a.issues.find((i) => i.code === 'injection');
    expect(injection?.group).toBe(0);
    expect(injection?.message.startsWith('Each string')).toBe(true);
    expect(a.issues.find((i) => i.code === 'power-strong')?.group).toBeUndefined();
  });

  test('issues are sorted worst first', () => {
    const ranks = a.issues.map((i) => ['error', 'warning', 'info'].indexOf(i.severity));
    expect(ranks).toEqual([...ranks].sort((x, y) => x - y));
  });

  test('bill of materials', () => {
    const pixels = line(a, 'pixel:rgb5@5');
    expect(pixels.qty).toBe(4000);
    expect(pixels.unitUSD).toBe(0.06); // the 1000+ tier
    expect(pixels.totalUSD).toBeCloseTo(240, 6);
    expect(pixels.priceNote).toContain('LCSC');
    expect(pixels.priceNote).toContain('1,000+');

    const ctrl = line(a, 'controller:big16');
    expect(ctrl.qty).toBe(1);
    expect(ctrl.totalUSD).toBe(280);
    expect(ctrl.detail).toBe('8 of 16 outputs used');

    const conn = line(a, 'connector:pigtail');
    expect(conn.qty).toBe(8);
    expect(conn.unit).toBe('pairs');
    expect(conn.totalUSD).toBeNull();

    expect(line(a, 'source:seq').totalUSD).toBe(0);

    expect(a.bom.totalUSD).toBeCloseTo(520, 6);
    expect(a.bom.priced).toBe(3);
    expect(a.bom.unpriced).toBe(1);
  });

  test('extras are sized by the power plan and never priced', () => {
    const supply = line(a, 'supply:5');
    expect(supply.section).toBe('extras');
    expect(supply.qty).toBe(5);
    expect(supply.name).toContain('300 W');
    const fuse = line(a, 'fuse:5');
    expect(fuse.qty).toBe(64); // 8 strings × 8 feeds
    expect(a.bom.lines.filter((l) => l.section === 'extras').every((l) => l.totalUSD == null)).toBe(
      true
    );
    const wire = a.bom.lines.find((l) => l.category === 'Feed wire');
    expect(wire?.qty).toBe(64);
    expect(wire?.unit).toBe('runs');
  });
});

describe('level shifting in a design', () => {
  test('a 3.3 V board with 5 V pixels warns until a shifter is added', () => {
    const without = analyze('p=rgb5&x=6&n=100&c=mb-esp');
    expect(codes(without)).toContain('level-shift');
    expect(without.groups[0].dataLines).toBe(6);

    const withShifter = analyze('p=rgb5&x=6&n=100&c=mb-esp&l=quad');
    expect(codes(withShifter)).not.toContain('level-shift');
    expect(withShifter.groups[0].shifterFit?.qty).toBe(2);
    const part = line(withShifter, 'shifter:quad');
    expect(part.qty).toBe(2);
    expect(part.unitUSD).toBe(0.9);
    expect(part.detail).toBe('6 data lines, 4 per part');
  });
});

describe('several groups', () => {
  // two groups share one 4-output controller: 3 + 3 strings -> 2 units
  const a = analyze('p=rgb5&x=3&n=100&c=async4&gn=Roof&p=rgb5&x=3&n=200&c=async4');

  test('strings on a shared controller add up', () => {
    expect(a.controllers).toHaveLength(1);
    expect(a.controllers[0].strings).toBe(6);
    expect(a.controllers[0].units).toBe(2);
    expect(a.controllers[0].groups).toEqual([0, 1]);
    const ctrl = line(a, 'controller:async4');
    expect(ctrl.qty).toBe(2);
    expect(ctrl.totalUSD).toBe(90);
    expect(ctrl.detail).toBe('6 of 8 outputs used, shared by Roof, Group 2');
  });

  test('the unit count is reported once', () => {
    expect(a.issues.filter((i) => i.code === 'multiple-units')).toHaveLength(1);
  });

  test('each group reports its own issues', () => {
    const injection = a.issues.filter((i) => i.code === 'injection');
    expect(injection.map((i) => i.group)).toEqual([0, 1]);
    expect(a.groups.map((g) => g.label)).toEqual(['Roof', 'Group 2']);
    expect(a.groups[1].issues.every((i) => i.group === 1)).toBe(true);
  });

  test('the same pixel in two groups is one purchase at the volume price', () => {
    const pixels = line(a, 'pixel:rgb5@5');
    expect(pixels.qty).toBe(900);
    expect(pixels.unitUSD).toBe(0.1); // 900 is below the 1000 tier
    expect(pixels.detail).toBe('Roof: 3 × 100; Group 2: 3 × 200');
  });

  test('mixed voltages get separate rails and a note', () => {
    const mixed = analyze('p=rgb5&x=1&n=100&c=&p=rgb12&x=2&n=100&c=');
    expect(mixed.power.rails.map((r) => r.voltage)).toEqual([5, 12]);
    expect(codes(mixed)).toContain('mixed-rails');
    expect(mixed.bom.lines.filter((l) => l.category === 'Power supply')).toHaveLength(2);
  });
});

describe('hard incompatibilities', () => {
  test('a clocked pixel on a data-only controller', () => {
    const a = analyze('p=clk5&x=1&n=100&c=async4');
    expect(a.counts.error).toBeGreaterThan(0);
    expect(codes(a)).toContain('clock-line');
    expect(a.groups[0].controllerFit?.ok).toBe(false);
  });

  test('a source that can’t reach the controller', () => {
    const a = analyze('p=rgb5&x=1&n=100&c=async4&g=ddponly');
    expect(codes(a)).toContain('source-protocol');
    expect(a.sourceFit?.ok).toBe(false);
  });

  test('standalone playback on a controller that needs a live source', () => {
    const a = analyze('p=rgb5&x=1&n=100&c=async4&g=standalone');
    expect(a.standalone).toBe(true);
    expect(a.source).toBeNull();
    expect(codes(a)).toContain('standalone-unsupported');
    expect(codes(analyze('p=rgb5&x=1&n=100&c=big16&g=standalone'))).not.toContain(
      'standalone-unsupported'
    );
  });
});

describe('layout checks', () => {
  test('long strings fall below the refresh target', () => {
    const a = analyze('p=rgb5&x=1&n=2000&c=');
    const issue = a.issues.find((i) => i.code === 'refresh');
    expect(issue?.severity).toBe('warning');
    expect(issue?.fix).toContain('1,111');
    // raising the target makes a shorter string fail too
    expect(codes(analyze('p=rgb5&x=1&n=600&c='))).not.toContain('refresh');
    expect(codes(analyze('p=rgb5&x=1&n=600&c=&f=60'))).toContain('refresh');
  });

  test('a hardware string limit is flagged with its explanation', () => {
    const issue = analyze('p=clk5&x=1&n=300&c=').issues.find((i) => i.code === 'string-limit');
    expect(issue?.severity).toBe('warning');
    expect(issue?.fix).toBe('Clock degrades along the string.');
    expect(codes(analyze('p=clk5&x=1&n=250&c='))).not.toContain('string-limit');
  });

  test('pixel notes: backup line, discontinued, estimated power', () => {
    expect(codes(analyze('p=rgb12&x=1&n=10&c='))).toContain('backup-line');
    expect(codes(analyze('p=deep5&x=1&n=10&c='))).toContain('retired');
    const bare = analyze('p=bare&x=1&n=10&c=');
    expect(codes(bare)).toContain('power-estimated');
    expect(codes(bare)).toContain('voltage-unknown');
  });
});

describe('power settings', () => {
  test('brightness shrinks supplies and feeds but not the safety warning', () => {
    const dim = analyze('p=rgb5&x=8&n=500&c=&b=25');
    expect(dim.power.maxWatts).toBeCloseTo(1200, 6);
    expect(dim.power.designWatts).toBeCloseTo(300, 6);
    expect(dim.power.rails[0].supply).toEqual({ count: 2, watts: 200 });
    expect(dim.groups[0].power?.longest.feeds).toBe(2);
    expect(codes(dim)).toContain('power-strong');
  });

  test('small systems stay quiet; mid-sized ones get the advisory', () => {
    expect(codes(analyze('p=rgb5&x=1&n=30&c='))).not.toContain('power-advisory');
    const mid = analyze('p=rgb5&x=1&n=150&c=');
    expect(codes(mid)).toContain('power-advisory');
    expect(codes(mid)).not.toContain('power-strong');
  });

  test('a very long feed run that no wire in the table can serve', () => {
    const a = analyze('p=rgb5&x=1&n=200&c=&w=60');
    expect(codes(a)).toContain('wire-run');
    expect(codes(analyze('p=rgb5&x=1&n=200&c='))).not.toContain('wire-run');
  });

  test('a driver IC runs at the chosen string voltage', () => {
    const at12 = analyze('p=ic-ic12&x=1&n=100&c=');
    expect(at12.groups[0].voltage).toBe(12);
    expect(at12.power.maxWatts).toBeCloseTo(100 * 3 * 0.019 * 12, 6);
    const at5 = analyze('p=ic-ic12&x=1&n=100&c=&v=5');
    expect(at5.groups[0].voltage).toBe(5);
    expect(at5.power.maxWatts).toBeCloseTo(100 * 3 * 0.019 * 5, 6);
    expect(at5.bom.lines[0].name).toBe('IC12, 5 V');
    // a voltage the part can't run at is ignored
    expect(analyze('p=ic-ic12&x=1&n=100&c=&v=24').groups[0].voltage).toBe(12);
  });
});

describe('controller current', () => {
  test('feeding every string through a small board is flagged', () => {
    // Async4: 8 A board, 3 A outputs. 4 strings × 3 A first feed = 12 A
    const a = analyze('p=rgb5&x=4&n=100&c=async4');
    expect(codes(a)).toContain('board-current');
    expect(codes(analyze('p=rgb5&x=2&n=100&c=async4'))).not.toContain('board-current');
  });
});

describe('driver chips that run several pixels', () => {
  test('are bought once per few pixels', () => {
    const a = analyze('p=ic-ic-triple&x=2&n=100&c=');
    expect(a.groups[0].pixels).toBe(200);
    expect(a.power.maxWatts).toBeCloseTo(200 * 3 * 0.018 * 12, 6);
    const chips = line(a, 'pixel:ic-ic-triple@12');
    expect(chips.qty).toBe(67); // 200 pixels ÷ 3 per chip, rounded up
    expect(chips.totalUSD).toBeCloseTo(67 * 0.3, 6);
    expect(chips.detail).toContain('one chip per 3 pixels (200 pixels)');
  });
});

describe('controllers with a device-wide pixel limit', () => {
  test('pixels on groups sharing the controller add up', () => {
    // 1,500 + 1,500 pixels on a 2,400-pixel device: two units
    const a = analyze('p=rgb5&x=3&n=500&c=total8&p=rgb5&x=3&n=500&c=total8');
    expect(a.controllers[0].pixels).toBe(3000);
    expect(a.controllers[0].units).toBe(2);
    expect(line(a, 'controller:total8').qty).toBe(2);
    expect(a.issues.filter((i) => i.code === 'multiple-units')).toHaveLength(1);
  });
});

describe('parts that left the database', () => {
  const a = analyze('p=gone-pixel&x=1&n=100&c=gone-controller&l=gone-shifter&g=gone-source');

  test('are reported, not silently dropped', () => {
    expect(a.missing.map((m) => m.id).sort()).toEqual([
      'gone-controller',
      'gone-pixel',
      'gone-shifter',
      'gone-source',
    ]);
    const issues = a.issues.filter((i) => i.code === 'missing-part');
    expect(issues).toHaveLength(4);
    expect(issues.every((i) => i.severity === 'warning')).toBe(true);
    expect(a.groups[0].pixel).toBeNull();
  });
});

describe('host boards and licence tiers in the BOM', () => {
  test('a cape brings its host board along', () => {
    const a = analyze('p=rgb12&x=4&n=100&c=cape');
    const host = line(a, 'host:cape');
    expect(host.name).toBe('PiBoard');
    expect(host.path).toBe('/microboards/pi');
    expect(host.totalUSD).toBe(35);
  });

  test('licence tiers pick the cheapest one that covers the pixels', () => {
    expect(line(analyze('p=rgb5&x=4&n=200&c=licensed'), 'controller:licensed').totalUSD).toBe(299);
    const big = line(analyze('p=rgb5&x=8&n=400&c=licensed'), 'controller:licensed');
    expect(big.totalUSD).toBe(599);
    expect(big.priceNote).toContain('4096 pixels');
    const huge = line(analyze('p=rgb5&x=8&n=1000&c=licensed'), 'controller:licensed');
    expect(huge.priceNote).toContain("doesn't cover");
  });

  test('other currencies keep their published price beside the USD figure', () => {
    const eur = line(analyze('p=clk5&x=1&n=50&c=raw1'), 'controller:raw1');
    expect(eur.priceText).toBe('€20');
    expect(eur.unitUSD).toBeGreaterThan(20);
  });

  test('software with a price range is listed but not totalled', () => {
    const a = analyze('p=rgb5&x=1&n=50&c=big16&g=player');
    const software = line(a, 'source:player');
    expect(software.totalUSD).toBeNull();
    expect(software.priceText).toBe('Free - $99');
  });
});

describe('BOM exports', () => {
  const a = analyze('p=rgb5&x=8&n=500&c=big16&k=pigtail&g=seq&t=Test+rig');
  const options = {
    title: 'Test rig',
    origin: 'https://example.test',
    url: 'https://example.test/designer?p=rgb5',
  };

  test('summary says how complete the total is', () => {
    expect(bomSummary(a.bom)).toBe('$520.00 for 3 of 4 parts (1 has no recorded price)');
    expect(bomSummary(analyze('p=bare&x=1&n=10&c=').bom)).toBe(
      'No prices recorded for these parts'
    );
    expect(bomSummary(analyze('p=rgb5&x=1&n=10&c=big16').bom)).toBe('$281.00 for all 2 parts');
  });

  test('Markdown', () => {
    const md = bomToMarkdown(a.bom, options);
    expect(md).toContain('# Test rig — bill of materials');
    expect(md).toContain(
      '| 4,000 | [RGB5](https://example.test/pixels/rgb5) — 8 × 500 | Pixels | $0.06 | $240.00 |'
    );
    expect(md).toContain('| 8 pairs | [Pigtail](https://example.test/connectors/pigtail)');
    expect(md).toContain('**Estimated total: $520.00 for 3 of 4 parts');
    expect(md).toContain('Also needed');
    expect(md).toContain('5 A blade fuse and holder');
    expect(md.trimEnd().endsWith('Design: https://example.test/designer?p=rgb5')).toBe(true);
  });

  test('CSV quotes what needs quoting and keeps numbers numeric', () => {
    const csv = bomToCsv(a.bom, options);
    const rows = csv.trimEnd().split('\r\n');
    expect(rows[0]).toBe(
      'Section,Category,Part,Detail,Qty,Unit,Unit price (USD),Total (USD),Price as published,Price note,Link'
    );
    expect(rows).toHaveLength(a.bom.lines.length + 1);
    expect(rows[1]).toContain('Part,Pixels,RGB5,8 × 500,4000,,0.06,240,');
    expect(rows[1]).toContain(
      '"LCSC price for the bare LED at 1,000+; strips, strings and modules cost more"'
    );
    expect(rows[1].endsWith('https://example.test/pixels/rgb5')).toBe(true);
  });

  test('plain text', () => {
    const text = bomToText(a.bom, options);
    expect(text).toContain('4,000 × RGB5 (Pixels) — $240.00');
    expect(text).toContain('8 pairs × Pigtail (Connector) — no price recorded');
    expect(text).toContain('1 × Sequencer (Pattern software) — Free');
    expect(text).toContain('Also needed:');
  });
});
