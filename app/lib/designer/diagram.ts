/**
 * Layout of the system diagram: boxes, wires and labels in a fixed coordinate
 * space, computed from an analysis. Pure geometry — the React component
 * (app/components/designer/SystemDiagram.tsx) only paints what this returns,
 * which keeps the on-page diagram and the exported files identical.
 *
 * Columns, left to right:
 *   pattern source -> controller(s) -> [level shifter] -> pixel groups -> power rails
 * with one supply box per rail underneath the pixel groups.
 */

import type { Analysis } from './analysis';
import { PROTOCOL_LABELS } from './catalog';
import { describeLayout } from './design';
import { GENERATOR } from './embed';
import { fmtFps, fmtInt, fmtVolts, fmtWatts } from './format';

export type BoxKind = 'source' | 'controller' | 'pixels' | 'shifter' | 'supply';

export interface DiagramLine {
  text: string;
  bold?: boolean;
}

export interface DiagramBox {
  key: string;
  kind: BoxKind;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Nothing chosen yet: drawn dashed */
  placeholder?: boolean;
  /** Site-relative image path */
  image?: string;
  lines: DiagramLine[];
}

export interface DiagramLabel {
  x: number;
  y: number;
  text: string;
  anchor: 'start' | 'middle' | 'end';
  kind: 'wire' | 'connector' | 'title' | 'credit';
}

export interface DiagramWire {
  key: string;
  kind: 'network' | 'data' | 'power';
  /** SVG path data */
  d: string;
  dashed?: boolean;
}

export interface DiagramModel {
  width: number;
  height: number;
  boxes: DiagramBox[];
  wires: DiagramWire[];
  labels: DiagramLabel[];
  /** Junction dots where a group meets its power rail */
  dots: { x: number; y: number }[];
  /** One-sentence description for screen readers */
  description: string;
}

export const DIAGRAM_WIDTH = 1000;

const SOURCE = { x: 16, w: 180, h: 76 };
const CONTROLLER = { x: 262, w: 220, h: 76 };
const SHIFTER = { x: 492, w: 100, h: 30 };
const GROUP = { x: 600, w: 300, h: 84 };
const BUS_X = 922;
const BUS_GAP = 24;
const ROW = 104;
const SUPPLY_H = 46;
const SUPPLY_GAP = 10;
const PAD = 20;

/**
 * Text that fits a box. No text metrics are available here (the same layout
 * feeds the page and the exported file), so widths are estimated: about
 * 5.7 px per character at the 11 px body size, 7.2 px for 13 px bold.
 */
export function fitText(text: string, width: number, charWidth = 5.7): string {
  const max = Math.max(4, Math.floor(width / charWidth));
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function curve(x1: number, y1: number, x2: number, y2: number): string {
  const mid = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
}

export function layoutDiagram(analysis: Analysis): DiagramModel {
  const { design, groups, power, controllers, source, standalone, sourceFit } = analysis;
  const boxes: DiagramBox[] = [];
  const wires: DiagramWire[] = [];
  const labels: DiagramLabel[] = [];
  const dots: { x: number; y: number }[] = [];

  const top = design.title ? 56 : PAD;
  if (design.title) {
    labels.push({
      x: PAD - 4,
      y: 34,
      text: fitText(design.title, 640, 9),
      anchor: 'start',
      kind: 'title',
    });
  }
  const multi = groups.length > 1;
  const groupY = (index: number) => top + index * ROW;
  const groupMid = (index: number) => groupY(index) + GROUP.h / 2;

  // Pixel groups
  for (const g of groups) {
    const y = groupY(g.index);
    const textWidth = GROUP.w - (g.pixel?.image ? 76 : 24);
    if (!g.pixel) {
      boxes.push({
        key: `group-${g.index}`,
        kind: 'pixels',
        x: GROUP.x,
        y,
        w: GROUP.w,
        h: GROUP.h,
        placeholder: true,
        lines: [
          { text: multi || g.design.name ? g.label : 'Pixels', bold: true },
          { text: `${describeLayout(g.layout)} — no pixel type yet` },
        ],
      });
      continue;
    }
    const named = multi || !!g.design.name;
    const lines: DiagramLine[] = [
      { text: fitText(named ? g.label : g.pixel.name, textWidth, 7.2), bold: true },
      {
        text: fitText(
          named
            ? `${describeLayout(g.layout)} ${g.pixel.name}`
            : `${describeLayout(g.layout)} = ${fmtInt(g.pixels)} pixels`,
          textWidth
        ),
      },
      {
        text: fitText(
          `${named ? `${fmtInt(g.pixels)} px · ` : ''}${fmtVolts(g.voltage)} · up to ${fmtWatts(g.power?.maxWatts ?? 0)}`,
          textWidth
        ),
      },
    ];
    const extra = [
      g.fps != null ? fmtFps(g.fps) : null,
      g.power && g.power.longest.feeds > 1
        ? `power at ${g.power.longest.feeds} points per string`
        : null,
    ].filter(Boolean);
    if (extra.length) lines.push({ text: fitText(extra.join(' · '), textWidth) });
    boxes.push({
      key: `group-${g.index}`,
      kind: 'pixels',
      x: GROUP.x,
      y,
      w: GROUP.w,
      h: GROUP.h,
      image: g.pixel.image,
      lines,
    });
  }

  // Controllers: one box per model, centred on the groups it drives. Groups
  // without a controller get a placeholder of their own.
  interface Node {
    key: string;
    groups: number[];
    box: Omit<DiagramBox, 'x' | 'y' | 'w' | 'h' | 'key' | 'kind'>;
  }
  const nodes: Node[] = [];
  const placed = new Set<string>();
  for (const g of groups) {
    if (!g.controller) {
      nodes.push({
        key: `controller-none-${g.index}`,
        groups: [g.index],
        box: {
          placeholder: true,
          lines: [
            { text: 'No controller yet', bold: true },
            {
              text: `needs ${fmtInt(g.layout.strings)} output${g.layout.strings === 1 ? '' : 's'}`,
            },
          ],
        },
      });
      continue;
    }
    if (placed.has(g.controller.id)) continue;
    placed.add(g.controller.id);
    const use = controllers.find((u) => u.controller.id === g.controller?.id);
    if (!use) continue;
    const c = use.controller;
    const textWidth = CONTROLLER.w - (c.image ? 76 : 24);
    const facts = [
      c.outputs != null
        ? `${fmtInt(use.strings)} of ${fmtInt(c.outputs * use.units)} outputs`
        : `${fmtInt(use.strings)} outputs`,
      c.kind === 'board' ? 'dev board' : null,
    ].filter(Boolean);
    nodes.push({
      key: `controller-${c.id}`,
      groups: use.groups,
      box: {
        image: c.image,
        lines: [
          {
            text: fitText(`${use.units > 1 ? `${use.units} × ` : ''}${c.name}`, textWidth, 7.2),
            bold: true,
          },
          { text: fitText(facts.join(' · '), textWidth) },
          ...(c.requiresHost ? [{ text: fitText(`on a ${c.requiresHost}`, textWidth) }] : []),
        ],
      },
    });
  }

  let floor = top;
  const nodeMid = new Map<string, number>();
  for (const node of nodes) {
    const centre = node.groups.reduce((sum, i) => sum + groupMid(i), 0) / node.groups.length;
    const y = Math.max(floor, centre - CONTROLLER.h / 2);
    floor = y + CONTROLLER.h + 12;
    nodeMid.set(node.key, y + CONTROLLER.h / 2);
    boxes.push({
      key: node.key,
      kind: 'controller',
      x: CONTROLLER.x,
      y,
      w: CONTROLLER.w,
      h: CONTROLLER.h,
      ...node.box,
    });

    // Data wires out to each group, through its level shifter if it has one
    for (const index of node.groups) {
      const g = groups[index];
      const mid = groupMid(index);
      const from = y + CONTROLLER.h / 2;
      const startX = CONTROLLER.x + CONTROLLER.w;
      if (g.shifter) {
        wires.push({
          key: `data-${index}-a`,
          kind: 'data',
          d: curve(startX, from, SHIFTER.x, mid),
        });
        wires.push({
          key: `data-${index}-b`,
          kind: 'data',
          d: `M ${SHIFTER.x + SHIFTER.w} ${mid} L ${GROUP.x} ${mid}`,
        });
        boxes.push({
          key: `shifter-${index}`,
          kind: 'shifter',
          x: SHIFTER.x,
          y: mid - SHIFTER.h / 2,
          w: SHIFTER.w,
          h: SHIFTER.h,
          lines: [
            {
              text: fitText(
                `${g.shifterFit && g.shifterFit.qty > 1 ? `${g.shifterFit.qty}× ` : ''}${g.shifter.name}`,
                SHIFTER.w - 8,
                5.4
              ),
            },
          ],
        });
      } else {
        wires.push({
          key: `data-${index}`,
          kind: 'data',
          d: curve(startX, from, GROUP.x, mid),
          dashed: !g.controller || !g.pixel,
        });
      }
      const wireLabelX = GROUP.x - 6;
      if (g.pixel) {
        labels.push({
          x: wireLabelX,
          y: mid - (g.shifter ? SHIFTER.h / 2 + 5 : 7),
          text: g.pixel.clocked ? 'data + clock' : 'data',
          anchor: 'end',
          kind: 'wire',
        });
      }
      if (g.connector) {
        labels.push({
          x: wireLabelX,
          y: mid + (g.shifter ? SHIFTER.h / 2 + 13 : 15),
          text: fitText(g.connector.name, 100, 5.6),
          anchor: 'end',
          kind: 'connector',
        });
      }
    }
  }

  // Pattern source, centred on the controllers
  const mids = [...nodeMid.values()];
  const sourceMid = mids.length ? (Math.min(...mids) + Math.max(...mids)) / 2 : top + SOURCE.h / 2;
  const sourceName = standalone ? 'Standalone playback' : source?.name;
  const onboard =
    !!sourceFit && sourceFit.links.length > 0 && sourceFit.links.every((l) => l === 'onboard');
  const via = standalone
    ? ''
    : onboard
      ? 'runs on the controller'
      : sourceFit?.shared.length
        ? `via ${sourceFit.shared.map((p) => PROTOCOL_LABELS[p] ?? p).join(' / ')}`
        : '';
  boxes.push({
    key: 'source',
    kind: 'source',
    x: SOURCE.x,
    y: sourceMid - SOURCE.h / 2,
    w: SOURCE.w,
    h: SOURCE.h,
    placeholder: !sourceName,
    lines: sourceName
      ? [
          { text: fitText(sourceName, SOURCE.w - 20, 7.2), bold: true },
          {
            text: fitText(
              standalone
                ? 'stored on the controller'
                : source?.platforms.length
                  ? source.platforms.join(' / ')
                  : 'pattern software',
              SOURCE.w - 24
            ),
          },
          ...(via ? [{ text: fitText(via, SOURCE.w - 24) }] : []),
        ]
      : [{ text: 'No pattern source yet', bold: true }, { text: 'what makes the patterns' }],
  });
  for (const node of nodes) {
    wires.push({
      key: `network-${node.key}`,
      kind: 'network',
      d: curve(SOURCE.x + SOURCE.w, sourceMid, CONTROLLER.x, nodeMid.get(node.key) ?? sourceMid),
      dashed: !sourceName || standalone,
    });
  }

  // Power: a bus per rail beside the groups, down to that rail's supply box
  const railsTop = Math.max(top + groups.length * ROW, floor) + 6;
  power.rails.forEach((rail, i) => {
    const busX = BUS_X + i * BUS_GAP;
    const supplyY = railsTop + i * (SUPPLY_H + SUPPLY_GAP);
    const supplyMid = supplyY + SUPPLY_H / 2;
    const first = Math.min(...rail.groups.map(groupMid));
    for (const index of rail.groups) {
      const mid = groupMid(index);
      wires.push({
        key: `feed-${index}`,
        kind: 'power',
        d: `M ${GROUP.x + GROUP.w} ${mid} L ${busX} ${mid}`,
      });
      dots.push({ x: busX, y: mid });
    }
    wires.push({
      key: `bus-${rail.voltage}`,
      kind: 'power',
      d: `M ${busX} ${first} L ${busX} ${supplyMid} L ${GROUP.x + GROUP.w} ${supplyMid}`,
    });
    boxes.push({
      key: `supply-${rail.voltage}`,
      kind: 'supply',
      x: GROUP.x,
      y: supplyY,
      w: GROUP.w,
      h: SUPPLY_H,
      lines: [
        {
          text: fitText(
            `${fmtVolts(rail.voltage)} supply: ${rail.supply.count > 1 ? `${rail.supply.count} × ` : ''}${fmtInt(rail.supply.watts)} W or more`,
            GROUP.w - 24,
            7.2
          ),
          bold: true,
        },
        {
          text: fitText(
            `${fmtWatts(rail.designWatts)}${design.brightness < 100 ? ` at ${fmtInt(design.brightness)}%` : ' full white'} · ${fmtInt(rail.feeds)} fused feed${rail.feeds === 1 ? '' : 's'}`,
            GROUP.w - 24
          ),
        },
      ],
    });
  });

  const railsBottom = railsTop + power.rails.length * (SUPPLY_H + SUPPLY_GAP);
  const height = Math.max(railsBottom, floor, top + groups.length * ROW) + PAD + 6;
  labels.push({
    x: PAD - 4,
    y: height - 8,
    text: GENERATOR,
    anchor: 'start',
    kind: 'credit',
  });
  const drawn = groups.filter((g) => g.pixel);
  const description = drawn.length
    ? `System diagram: ${sourceName ?? 'no pattern source yet'} driving ${drawn
        .map(
          (g) =>
            `${describeLayout(g.layout)} ${g.pixel?.name}${g.controller ? ` on ${g.controller.name}` : ''}`
        )
        .join('; ')}. ${fmtInt(power.pixels)} pixels, up to ${fmtWatts(power.maxWatts)}.`
    : 'System diagram: nothing chosen yet.';

  return { width: DIAGRAM_WIDTH, height, boxes, wires, labels, dots, description };
}
