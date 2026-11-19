import { describe, expect, test } from 'bun:test';
import {
  analyzeDesign,
  buildCatalog,
  DIAGRAM_WIDTH,
  EXAMPLES,
  fitText,
  indexCatalog,
  layoutDiagram,
  parseDesign,
  type DiagramBox,
  type DiagramModel,
} from '../../app/lib/designer';
import { getRelationGraph, loadCategoryData } from '../../app/lib/data';
import { CATEGORIES } from '../../app/lib/types';
import type { BaseEntry } from '../../app/lib/types';
import { fixtureIndex } from './fixtures';

const index = fixtureIndex();
const diagram = (query: string): DiagramModel =>
  layoutDiagram(analyzeDesign(parseDesign(new URLSearchParams(query)), index));
const box = (model: DiagramModel, key: string): DiagramBox => {
  const hit = model.boxes.find((b) => b.key === key);
  if (!hit) throw new Error(`no box "${key}" in ${model.boxes.map((b) => b.key).join(', ')}`);
  return hit;
};
const text = (b: DiagramBox) => b.lines.map((l) => l.text).join(' | ');

function overlaps(a: DiagramBox, b: DiagramBox): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

function expectTidy(model: DiagramModel) {
  for (const b of model.boxes) {
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.w).toBeLessThanOrEqual(model.width);
    expect(b.y + b.h).toBeLessThanOrEqual(model.height);
  }
  for (let i = 0; i < model.boxes.length; i++) {
    for (let j = i + 1; j < model.boxes.length; j++) {
      if (overlaps(model.boxes[i], model.boxes[j])) {
        throw new Error(`boxes ${model.boxes[i].key} and ${model.boxes[j].key} overlap`);
      }
    }
  }
}

describe('diagram layout', () => {
  test('an empty design still draws its placeholders', () => {
    const model = diagram('');
    expect(model.width).toBe(DIAGRAM_WIDTH);
    expect(box(model, 'group-0').placeholder).toBe(true);
    expect(box(model, 'controller-none-0').placeholder).toBe(true);
    expect(box(model, 'source').placeholder).toBe(true);
    expect(model.description).toBe('System diagram: nothing chosen yet.');
    expectTidy(model);
  });

  test('a complete design: source, controller, pixels and a supply', () => {
    const model = diagram('p=rgb5&x=8&n=500&c=big16&g=seq&t=My+rig');
    expect(text(box(model, 'source'))).toContain('Sequencer');
    expect(text(box(model, 'source'))).toContain('via Art-Net / sACN');
    expect(text(box(model, 'controller-big16'))).toContain('Big16');
    expect(text(box(model, 'controller-big16'))).toContain('8 of 16 outputs');
    expect(text(box(model, 'group-0'))).toContain('8 × 500 = 4,000 pixels');
    expect(text(box(model, 'group-0'))).toContain('power at 8 points per string');
    expect(text(box(model, 'supply-5'))).toContain('5 × 300 W');
    expect(model.labels.find((l) => l.kind === 'title')?.text).toBe('My rig');
    expect(model.labels.find((l) => l.kind === 'credit')?.text).toContain('awesomeled');
    expect(model.description).toContain('Sequencer driving 8 × 500 RGB5 on Big16');
    // one data wire, one network wire, a feed and its bus
    expect(model.wires.map((w) => w.kind).sort()).toEqual(['data', 'network', 'power', 'power']);
    expect(model.dots).toHaveLength(1);
    expectTidy(model);
  });

  test('a level shifter sits on the data line and a connector is labelled', () => {
    const model = diagram('p=rgb5&x=6&n=100&c=mb-esp&l=quad&k=pigtail');
    expect(text(box(model, 'shifter-0'))).toContain('Quad Buffer');
    expect(model.wires.filter((w) => w.kind === 'data')).toHaveLength(2);
    expect(model.labels.some((l) => l.kind === 'connector' && l.text === 'Pigtail')).toBe(true);
    expect(model.labels.some((l) => l.kind === 'wire' && l.text === 'data')).toBe(true);
    expectTidy(model);
  });

  test('clocked pixels label the wire as data + clock', () => {
    const model = diagram('p=clk5&x=1&n=100&c=big16');
    expect(model.labels.some((l) => l.text === 'data + clock')).toBe(true);
  });

  test('groups sharing a controller get one controller box between them', () => {
    const model = diagram('p=rgb5&x=3&n=100&c=async4&gn=Roof&p=rgb5&x=3&n=200&c=async4');
    const controllers = model.boxes.filter((b) => b.kind === 'controller');
    expect(controllers).toHaveLength(1);
    expect(text(controllers[0])).toContain('2 × Async4');
    const [first, second] = [box(model, 'group-0'), box(model, 'group-1')];
    const mid = controllers[0].y + controllers[0].h / 2;
    expect(mid).toBeGreaterThan(first.y);
    expect(mid).toBeLessThan(second.y + second.h);
    expect(text(first)).toContain('Roof');
    expect(text(second)).toContain('Group 2');
    expectTidy(model);
  });

  test('each rail gets its own bus and supply box', () => {
    const model = diagram('p=rgb5&x=1&n=100&c=big16&p=rgb12&x=2&n=100&c=big16');
    expect(model.boxes.filter((b) => b.kind === 'supply').map((b) => b.key)).toEqual([
      'supply-5',
      'supply-12',
    ]);
    expect(model.dots).toHaveLength(2);
    const buses = model.dots.map((d) => d.x);
    expect(buses[0]).not.toBe(buses[1]);
    expectTidy(model);
  });

  test('many groups stay tidy', () => {
    const query = Array.from(
      { length: 12 },
      (_, i) => `p=rgb5&x=1&n=${50 + i}&c=${i % 2 ? 'big16' : ''}`
    ).join('&');
    const model = diagram(query);
    expect(model.boxes.filter((b) => b.kind === 'pixels')).toHaveLength(12);
    expectTidy(model);
  });

  test('standalone playback and firmware sources say how they connect', () => {
    expect(text(box(diagram('p=rgb5&x=1&n=50&c=big16&g=standalone'), 'source'))).toContain(
      'Standalone playback'
    );
    expect(text(box(diagram('p=rgb5&x=1&n=50&c=mb-esp&g=espfw'), 'source'))).toContain(
      'runs on the controller'
    );
  });
});

describe('fitText', () => {
  test('leaves short text alone and ends long text with an ellipsis', () => {
    expect(fitText('short', 200)).toBe('short');
    const fitted = fitText('a very long label that cannot possibly fit', 100);
    expect(fitted.endsWith('…')).toBe(true);
    expect(fitted.length).toBeLessThanOrEqual(Math.floor(100 / 5.7));
  });

  test('never truncates below a few characters', () => {
    expect(fitText('abcdefgh', 1)).toBe('abc…');
  });
});

// The examples are links users click: every id in them has to exist.
describe('example designs', () => {
  const db = new Map<string, BaseEntry[]>(
    CATEGORIES.map((c) => [c.id, loadCategoryData(c.id)] as [string, BaseEntry[]])
  );
  const real = indexCatalog(buildCatalog(db, getRelationGraph()));

  for (const example of EXAMPLES) {
    test(`"${example.title}" refers only to parts in the database and has no errors`, () => {
      const design = parseDesign(new URLSearchParams(example.query));
      const analysis = analyzeDesign(design, real);
      expect(analysis.missing).toEqual([]);
      expect(analysis.issues.filter((i) => i.severity === 'error')).toEqual([]);
      expect(analysis.groups.every((g) => g.pixel && g.controller)).toBe(true);
      expect(design.title).toBe(example.title);
      expectTidy(layoutDiagram(analysis));
    });
  }
});
