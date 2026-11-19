/**
 * One pass over a design: resolve its ids against the catalog, plan the
 * power, run every compatibility check, and build the bill of materials.
 * Pure; the page calls it on every change and renders the result.
 */

import {
  isRetired,
  type CatalogIndex,
  type ConnectorOption,
  type ControllerOption,
  type PixelOption,
  type ShifterOption,
  type SourceOption,
} from './catalog';
import {
  dataLines,
  evaluateConnector,
  evaluateController,
  evaluateShifter,
  evaluateSource,
  evaluateStandalone,
  sortIssues,
  type ConnectorFit,
  type ControllerFit,
  type Issue,
  type ShifterFit,
  type Slot,
  type SourceFit,
} from './compat';
import { buildBom, type Bom } from './bom';
import { layoutTotal, STANDALONE, type Design, type GroupDesign, type Layout } from './design';
import {
  effectiveVoltage,
  maxFps,
  maxPixelsForFps,
  planGroup,
  planSystem,
  POWER_ADVISORY_WATTS,
  universesFor,
  WIRE_DROP_FRACTION,
  type GroupPower,
  type SystemPower,
} from './electrical';

export interface GroupAnalysis {
  index: number;
  design: GroupDesign;
  /** The group's name, or "Group N" */
  label: string;
  pixel: PixelOption | null;
  /** Rail voltage the group runs at */
  voltage: number;
  layout: Layout;
  pixels: number;
  controller: ControllerOption | null;
  shifter: ShifterOption | null;
  connector: ConnectorOption | null;
  power: GroupPower | null;
  /** Refresh ceiling of the longest string */
  fps: number | null;
  universes: number | null;
  controllerFit: ControllerFit | null;
  /** Data lines that would need level shifting */
  dataLines: number;
  shifterFit: ShifterFit | null;
  connectorFit: ConnectorFit | null;
  issues: Issue[];
}

/** A controller model used by the design, counted across the groups that share it */
export interface ControllerUse {
  controller: ControllerOption;
  units: number;
  groups: number[];
  strings: number;
  pixels: number;
}

export interface MissingPart {
  slot: Slot;
  group?: number;
  id: string;
}

export interface Analysis {
  design: Design;
  groups: GroupAnalysis[];
  power: SystemPower;
  controllers: ControllerUse[];
  source: SourceOption | null;
  standalone: boolean;
  sourceFit: SourceFit | null;
  /** Art-Net / sACN universes across every group that has pixels */
  universes: number;
  /** Every issue, worst first */
  issues: Issue[];
  counts: { error: number; warning: number; info: number };
  /** Ids from the link that no longer exist in the database */
  missing: MissingPart[];
  bom: Bom;
}

function n(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function groupLabel(group: GroupDesign, index: number): string {
  return group.name || `Group ${index + 1}`;
}

export function analyzeDesign(design: Design, catalog: CatalogIndex): Analysis {
  const missing: MissingPart[] = [];
  const lookup = <T>(map: Map<string, T>, id: string, slot: Slot, group?: number): T | null => {
    if (!id) return null;
    const hit = map.get(id);
    if (!hit) missing.push({ slot, group, id });
    return hit ?? null;
  };
  const settings = {
    brightness: design.brightness,
    feedAmps: design.feedAmps,
    wireMeters: design.wireMeters,
  };

  // Resolve parts and plan power
  const resolved = design.groups.map((group, index) => {
    const pixel = lookup(catalog.pixels, group.pixel, 'pixels', index);
    const voltage = effectiveVoltage(pixel, group.voltage);
    return {
      index,
      design: group,
      label: groupLabel(group, index),
      pixel,
      voltage,
      layout: group.layout,
      pixels: layoutTotal(group.layout),
      controller: lookup(catalog.controllers, group.controller, 'controller', index),
      shifter: lookup(catalog.shifters, group.shifter, 'shifter', index),
      connector: lookup(catalog.connectors, group.connector, 'connector', index),
      power: pixel ? planGroup(pixel, group.layout, voltage, settings) : null,
    };
  });

  // Controllers shared between groups: their strings add up
  const uses = new Map<string, ControllerUse>();
  for (const g of resolved) {
    if (!g.controller) continue;
    const use = uses.get(g.controller.id) ?? {
      controller: g.controller,
      units: 1,
      groups: [],
      strings: 0,
      pixels: 0,
    };
    use.groups.push(g.index);
    use.strings += g.layout.strings;
    use.pixels += g.pixels;
    uses.set(g.controller.id, use);
  }

  const groups: GroupAnalysis[] = resolved.map((g) => {
    const issues: Issue[] = [];
    const add = (issue: Omit<Issue, 'group'>) => issues.push({ ...issue, group: g.index });
    const { pixel, power, layout } = g;

    // Pixels and layout
    const fps = pixel ? maxFps(pixel, layout.perString) : null;
    if (pixel) {
      if (isRetired(pixel.status)) {
        add({
          severity: 'warning',
          code: 'retired',
          slot: 'pixels',
          message: `${pixel.name} is discontinued and may be hard to buy.`,
        });
      }
      if (pixel.voltage == null) {
        add({
          severity: 'info',
          code: 'voltage-unknown',
          slot: 'pixels',
          message: `${pixel.name}'s supply voltage isn't recorded; assuming ${n(g.voltage, 1)} V.`,
        });
      }
      if (pixel.ampsBasis === 'typical') {
        add({
          severity: 'info',
          code: 'power-estimated',
          slot: 'power',
          message: `No LED current is recorded for ${pixel.name}; power assumes ${n(pixel.channelAmps * 1000)} mA per channel.`,
          fix:
            pixel.kind === 'ic'
              ? 'Driver ICs run whatever LEDs the strip or node maker fitted — check the product listing.'
              : 'Check the datasheet for the real figure.',
        });
      }
      if (pixel.maxPerString != null && layout.perString > pixel.maxPerString) {
        add({
          severity: 'warning',
          code: 'string-limit',
          slot: 'layout',
          message: `${pixel.name} strings are only reliable to about ${n(pixel.maxPerString)} pixels; ${layout.lengths ? 'the longest is' : 'these are'} ${n(layout.perString)}.`,
          fix: pixel.maxPerStringNotes,
        });
      }
      if (fps != null && fps < design.targetFps) {
        const reach = maxPixelsForFps(pixel, design.targetFps);
        add({
          severity: 'warning',
          code: 'refresh',
          slot: 'layout',
          message: `${n(layout.perString)} pixels per string tops out at about ${n(fps, fps < 10 ? 1 : 0)} fps, below the ${n(design.targetFps)} fps target.`,
          fix: reach
            ? `Use strings of ${n(reach)} pixels or fewer on more outputs: strings refresh in parallel.`
            : undefined,
        });
      }
      if (pixel.backupLine) {
        add({
          severity: 'info',
          code: 'backup-line',
          slot: 'pixels',
          message: `${pixel.name} has a backup data line, so one dead pixel doesn't take out the rest.`,
          fix: 'Between pixels it needs four conductors; at the controller end tie the backup input as the datasheet shows.',
        });
      }
    }

    // Power feeds
    if (power && power.longest.feeds > 1) {
      const s = power.longest;
      add({
        severity: 'info',
        code: 'injection',
        slot: 'power',
        message: `${layout.lengths ? 'The longest string' : 'Each string'} needs power at ${n(s.feeds)} points — about every ${n(s.spacing)} pixels — to keep each feed at ${n(design.feedAmps, 1)} A or less.`,
      });
    }
    if (power && !power.longest.wire.ok) {
      const w = power.longest.wire;
      add({
        severity: 'warning',
        code: 'wire-run',
        slot: 'power',
        message: `Over ${n(design.wireMeters, 1)} m, even ${w.awg} AWG loses ${n(w.dropFraction * 100)}% of the ${n(g.voltage, 1)} V rail at ${n(power.longest.feedAmps, 1)} A (the target is ${n(WIRE_DROP_FRACTION * 100)}%).`,
        fix: 'Move the supply closer, split the feeds further, or use a higher-voltage pixel.',
      });
    }

    // Controller
    const use = g.controller ? uses.get(g.controller.id) : undefined;
    const controllerFit = g.controller
      ? evaluateController(g.controller, {
          pixel,
          voltage: g.voltage,
          layout,
          totalStrings: use?.strings ?? layout.strings,
          totalPixels: use?.pixels ?? g.pixels,
          power,
          targetFps: design.targetFps,
          outdoor: design.outdoor,
          hasShifter: !!g.shifter,
        })
      : null;
    if (controllerFit && use) {
      use.units = Math.max(use.units, controllerFit.units);
      for (const issue of controllerFit.issues) {
        // A shared controller reports its unit count once, on its first group
        if (issue.code === 'multiple-units' && use.groups[0] !== g.index) continue;
        add(issue);
      }
    }

    // Level shifter
    const lines = dataLines(layout, pixel);
    const shifterFit = g.shifter
      ? evaluateShifter(g.shifter, { controller: g.controller, pixel, lines })
      : null;
    shifterFit?.issues.forEach(add);

    // Connector
    const connectorFit = g.connector
      ? evaluateConnector(g.connector, {
          pixel,
          voltage: g.voltage,
          power,
          controller: g.controller,
          outdoor: design.outdoor,
        })
      : null;
    connectorFit?.issues.forEach(add);

    return {
      ...g,
      fps,
      universes: pixel ? universesFor(pixel, g.pixels) : null,
      controllerFit,
      dataLines: lines,
      shifterFit,
      connectorFit,
      issues,
    };
  });

  const power = planSystem(groups.map((g) => g.power));
  const controllers = [...uses.values()];
  const standalone = design.source === STANDALONE;
  const source = standalone ? null : lookup(catalog.sources, design.source, 'source');
  const system: Issue[] = [];

  for (const part of missing) {
    system.push({
      severity: 'warning',
      code: 'missing-part',
      slot: part.slot,
      group: part.group,
      message: `This design refers to “${part.id}”, which isn't in the database (renamed or removed).`,
      fix: 'Choose a replacement for that part.',
    });
  }

  // Total current through a controller board (first feed of every string)
  for (const use of uses.values()) {
    const limit = use.controller.boardAmps;
    if (limit == null) continue;
    let through = 0;
    for (const index of use.groups) {
      const p = groups[index].power;
      if (!p) continue;
      for (const s of p.strings) {
        through += Math.min(s.feedAmps, use.controller.outputAmps ?? Infinity) * s.count;
      }
    }
    const perUnit = through / use.units;
    if (perUnit > limit) {
      system.push({
        severity: 'warning',
        code: 'board-current',
        slot: 'power',
        group: use.groups[0],
        message: `${use.controller.name} can pass ${n(limit, 1)} A in total; feeding every string's first section through it adds up to about ${n(perUnit, 1)} A${use.units > 1 ? ' per unit' : ''}.`,
        fix: 'Power some strings straight from the supply and take only data from the controller.',
      });
    }
  }

  if (power.warning === 'strong') {
    system.push({
      severity: 'warning',
      code: 'power-strong',
      slot: 'power',
      message: `At up to ${n(power.maxWatts)} W this is serious power: undersized wiring or missing fuses can start fires.`,
      fix: 'Fuse every feed, size the wire for its fuse, and strongly consider having someone experienced (or a licensed electrician) check the plan before you build.',
    });
  } else if (power.warning === 'advisory') {
    system.push({
      severity: 'warning',
      code: 'power-advisory',
      slot: 'power',
      message: `Above about ${POWER_ADVISORY_WATTS} W, wire gauge, fusing and power injection start to matter (this design can draw ${n(power.maxWatts)} W).`,
      fix: 'Follow the feed, fuse and wire guidance below, and read up or ask experienced builders before ordering.',
    });
  }
  if (power.rails.length > 1) {
    system.push({
      severity: 'info',
      code: 'mixed-rails',
      slot: 'power',
      message: `${power.rails.map((r) => `${n(r.voltage, 1)} V`).join(' and ')} pixels need separate supplies.`,
      fix: 'Never join the positive rails; do join every ground, including the controller’s.',
    });
  }
  for (const rail of power.rails) {
    if (rail.supply.count > 1) {
      system.push({
        severity: 'info',
        code: 'supply-split',
        slot: 'power',
        message: `The ${n(rail.voltage, 1)} V rail is split across ${rail.supply.count} supplies of ${n(rail.supply.watts)} W.`,
        fix: 'Give each supply its own strings; never parallel supply outputs. Join the grounds.',
      });
    }
  }

  // Pattern source
  const sourceFit = source
    ? evaluateSource(
        source,
        controllers.map((u) => u.controller)
      )
    : null;
  if (sourceFit) system.push(...sourceFit.issues);
  if (standalone) system.push(...evaluateStandalone(controllers.map((u) => u.controller)));

  // Shared controllers can raise the same point from several groups
  const seen = new Set<string>();
  const issues = sortIssues([...system, ...groups.flatMap((g) => g.issues)]).filter((issue) => {
    const key = `${issue.code}|${issue.group ?? ''}|${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    design,
    groups,
    power,
    controllers,
    source,
    standalone,
    sourceFit,
    universes: groups.reduce((sum, g) => sum + (g.universes ?? 0), 0),
    issues,
    counts: {
      error: issues.filter((i) => i.severity === 'error').length,
      warning: issues.filter((i) => i.severity === 'warning').length,
      info: issues.filter((i) => i.severity === 'info').length,
    },
    missing,
    bom: buildBom({ design, groups, controllers, power, source, catalog }),
  };
}
