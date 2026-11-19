/**
 * Bill of materials for a design.
 *
 * Two sections:
 *   parts   things that are entries in the database, priced where the database
 *           records a price
 *   extras  things every build needs that the database doesn't list (power
 *           supplies, fuses, feed wire) — sized by the power plan, never priced
 *
 * Prices are whatever the database recorded, converted to USD for the total.
 * A total is only as complete as the priced lines, so the BOM always reports
 * how many lines it could price.
 */

import { formatPriceText } from '../currency';
import {
  unitPriceAt,
  type CatalogIndex,
  type ControllerOption,
  type PixelOption,
  type PriceInfo,
  type SourceOption,
} from './catalog';
import type { ControllerUse, GroupAnalysis } from './analysis';
import { describeLayout, type Design } from './design';
import { SUPPLY_LOAD_FACTOR, type SystemPower } from './electrical';

export type BomSection = 'parts' | 'extras';

export interface BomLine {
  key: string;
  section: BomSection;
  /** "Pixels", "Controller", "Power supply" … */
  category: string;
  name: string;
  /** Entry page, for database parts */
  path?: string;
  /** Where the quantity comes from */
  detail?: string;
  qty: number;
  /** Unit of the quantity when it isn't pieces ("pairs", "runs") */
  unit?: string;
  unitUSD: number | null;
  totalUSD: number | null;
  /** Price as published when it isn't a plain USD figure ("€120", "Free - $399") */
  priceText?: string;
  /** What the price is for, and its caveats */
  priceNote?: string;
}

export interface Bom {
  lines: BomLine[];
  /** Sum of the lines that have a price */
  totalUSD: number;
  /** Database parts with / without a usable price */
  priced: number;
  unpriced: number;
}

export interface BomInput {
  design: Design;
  groups: GroupAnalysis[];
  controllers: ControllerUse[];
  power: SystemPower;
  source: SourceOption | null;
  catalog: CatalogIndex;
}

function n(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function priced(price: PriceInfo, qty: number) {
  const tier = unitPriceAt(price, qty);
  return {
    tier,
    unitUSD: tier?.usd ?? null,
    totalUSD: tier ? tier.usd * qty : null,
    // Show the published figure next to the USD conversion for other currencies
    priceText: price.currency && price.currency !== 'USD' ? (price.text ?? undefined) : undefined,
  };
}

function controllerPrice(controller: ControllerOption, units: number, pixelsPerUnit: number) {
  if (controller.licenseTiers.length === 0) {
    const p = priced(controller.price, units);
    return { ...p, priceNote: undefined as string | undefined };
  }
  // Sold by licence size: the cheapest tier that covers the pixels per unit
  const tiers = controller.licenseTiers;
  const fits = tiers.find((t) => t.pixels == null || t.pixels >= pixelsPerUnit);
  const tier = fits ?? tiers[tiers.length - 1];
  return {
    tier: null,
    unitUSD: tier.usd,
    totalUSD: tier.usd * units,
    priceText: undefined,
    priceNote: fits
      ? `“${tier.name}” tier`
      : `largest tier (“${tier.name}”) doesn't cover ${n(pixelsPerUnit)} pixels per unit`,
  };
}

export function buildBom(input: BomInput): Bom {
  const { groups, controllers, power, source, catalog, design } = input;
  const lines: BomLine[] = [];

  // Pixels: the same part in several groups is one purchase
  const pixelLines = new Map<
    string,
    { pixel: PixelOption; voltage: number; qty: number; where: string[] }
  >();
  for (const g of groups) {
    if (!g.pixel) continue;
    const key = `pixel:${g.pixel.id}@${g.voltage}`;
    const line = pixelLines.get(key) ?? { pixel: g.pixel, voltage: g.voltage, qty: 0, where: [] };
    line.qty += g.pixels;
    line.where.push(
      groups.length > 1 ? `${g.label}: ${describeLayout(g.layout)}` : describeLayout(g.layout)
    );
    pixelLines.set(key, line);
  }
  for (const [key, { pixel, voltage, qty, where }] of pixelLines) {
    const p = priced(pixel.price, qty);
    const what = pixel.kind === 'ic' ? 'chip' : 'LED';
    lines.push({
      key,
      section: 'parts',
      category: pixel.kind === 'ic' ? 'Pixels (driver IC)' : 'Pixels',
      name: pixel.voltageChoices.length > 1 ? `${pixel.name}, ${n(voltage, 1)} V` : pixel.name,
      path: pixel.path,
      detail: where.join('; '),
      qty,
      unitUSD: p.unitUSD,
      totalUSD: p.totalUSD,
      priceText: p.priceText,
      priceNote: p.tier
        ? `${pixel.price.vendor ?? 'Distributor'} price for the bare ${what}${p.tier.qty > 1 ? ` at ${n(p.tier.qty)}+` : ''}; strips, strings and modules cost more`
        : undefined,
    });
  }

  // Controllers, and the host boards some of them sit on
  for (const use of controllers) {
    const c = use.controller;
    const p = controllerPrice(c, use.units, Math.ceil(use.pixels / use.units));
    const capacity =
      c.outputs != null
        ? `${n(use.strings)} of ${n(c.outputs * use.units)} outputs used`
        : `${n(use.strings)} outputs needed`;
    lines.push({
      key: `controller:${c.id}`,
      section: 'parts',
      category: c.kind === 'board' ? 'Controller (dev board)' : 'Controller',
      name: c.name,
      path: c.path,
      detail:
        use.groups.length > 1
          ? `${capacity}, shared by ${use.groups.map((i) => groups[i].label).join(', ')}`
          : capacity,
      qty: use.units,
      unitUSD: p.unitUSD,
      totalUSD: p.totalUSD,
      priceText: p.priceText,
      priceNote: p.priceNote,
    });

    if (c.requiresHost) {
      const host = c.hostIds.map((id) => catalog.controllers.get(id)).find((h) => h != null);
      const hp = host ? priced(host.price, use.units) : null;
      lines.push({
        key: `host:${c.id}`,
        section: 'parts',
        category: 'Host board',
        name: host?.name ?? c.requiresHost,
        path: host?.path,
        detail: `${c.name} plugs into it`,
        qty: use.units,
        unitUSD: hp?.unitUSD ?? null,
        totalUSD: hp?.totalUSD ?? null,
        priceText: hp?.priceText,
      });
    }
  }

  // Level shifters and connectors: merge the same part across groups
  const shifters = new Map<string, { qty: number; lines: number }>();
  const connectors = new Map<string, number>();
  for (const g of groups) {
    if (g.shifter && g.shifterFit) {
      const cur = shifters.get(g.shifter.id) ?? { qty: 0, lines: 0 };
      cur.qty += g.shifterFit.qty;
      cur.lines += g.dataLines;
      shifters.set(g.shifter.id, cur);
    }
    if (g.connector) {
      connectors.set(g.connector.id, (connectors.get(g.connector.id) ?? 0) + g.layout.strings);
    }
  }
  for (const [id, { qty, lines: dataLines }] of shifters) {
    const shifter = catalog.shifters.get(id);
    if (!shifter) continue;
    const p = priced(shifter.price, qty);
    lines.push({
      key: `shifter:${id}`,
      section: 'parts',
      category: 'Level shifter',
      name: shifter.name,
      path: shifter.path,
      detail: shifter.channels
        ? `${n(dataLines)} data line${dataLines === 1 ? '' : 's'}, ${shifter.channels} per part`
        : `${n(dataLines)} data line${dataLines === 1 ? '' : 's'}`,
      qty,
      unitUSD: p.unitUSD,
      totalUSD: p.totalUSD,
      priceText: p.priceText,
      priceNote:
        p.tier && shifter.price.vendor
          ? `${shifter.price.vendor} price${p.tier.qty > 1 ? ` at ${n(p.tier.qty)}+` : ''}`
          : undefined,
    });
  }
  for (const [id, qty] of connectors) {
    const connector = catalog.connectors.get(id);
    if (!connector) continue;
    const p = priced(connector.price, qty);
    lines.push({
      key: `connector:${id}`,
      section: 'parts',
      category: 'Connector',
      name: connector.name,
      path: connector.path,
      detail: 'one mating pair per string',
      qty,
      unit: 'pairs',
      unitUSD: p.unitUSD,
      totalUSD: p.totalUSD,
      priceText: p.priceText,
    });
  }

  if (source) {
    lines.push({
      key: `source:${source.id}`,
      section: 'parts',
      category: 'Pattern software',
      name: source.name,
      path: source.path,
      qty: 1,
      unitUSD: source.priceUSD,
      totalUSD: source.priceUSD,
      priceText: source.priceUSD == null ? (source.priceText ?? undefined) : undefined,
    });
  }

  // Extras the database doesn't list, sized by the power plan
  for (const rail of power.rails) {
    lines.push({
      key: `supply:${rail.voltage}`,
      section: 'extras',
      category: 'Power supply',
      name: `${n(rail.voltage, 1)} V DC supply, ${n(rail.supply.watts)} W or more`,
      detail: `${n(rail.designWatts)} W load at ${n(design.brightness)}% brightness, kept under ${n(SUPPLY_LOAD_FACTOR * 100)}% of the rating`,
      qty: rail.supply.count,
      unitUSD: null,
      totalUSD: null,
    });
  }
  const fuses = new Map<number, number>();
  const wire = new Map<number, number>();
  for (const g of groups) {
    for (const s of g.power?.strings ?? []) {
      const feeds = s.feeds * s.count;
      if (s.fuseAmps != null) fuses.set(s.fuseAmps, (fuses.get(s.fuseAmps) ?? 0) + feeds);
      wire.set(s.wire.awg, (wire.get(s.wire.awg) ?? 0) + feeds);
    }
  }
  for (const [rating, qty] of [...fuses].sort((a, b) => a[0] - b[0])) {
    lines.push({
      key: `fuse:${rating}`,
      section: 'extras',
      category: 'Fuse',
      name: `${n(rating, 1)} A blade fuse and holder`,
      detail: 'one per power feed, at the supply end',
      qty,
      unitUSD: null,
      totalUSD: null,
    });
  }
  for (const [awg, qty] of [...wire].sort((a, b) => b[0] - a[0])) {
    lines.push({
      key: `wire:${awg}`,
      section: 'extras',
      category: 'Feed wire',
      name: `${awg} AWG two-conductor wire`,
      detail: `${n(design.wireMeters, 1)} m per feed, about ${n(qty * design.wireMeters)} m in all`,
      qty,
      unit: 'runs',
      unitUSD: null,
      totalUSD: null,
    });
  }

  const parts = lines.filter((l) => l.section === 'parts');
  return {
    lines,
    totalUSD: lines.reduce((sum, l) => sum + (l.totalUSD ?? 0), 0),
    priced: parts.filter((l) => l.totalUSD != null).length,
    unpriced: parts.filter((l) => l.totalUSD == null).length,
  };
}

// ---------------------------------------------------------------------------
// Export formats

export function formatUSD(value: number, cents = true): string {
  return formatPriceText({ amount: value, currency: 'USD' }, cents);
}

function unitCell(line: BomLine): string {
  if (line.unitUSD != null) {
    const usd = line.unitUSD === 0 ? 'Free' : formatUSD(line.unitUSD, false);
    return line.priceText ? `${line.priceText} (≈ ${usd})` : usd;
  }
  return line.priceText ?? '—';
}

function totalCell(line: BomLine): string {
  if (line.totalUSD == null) return '—';
  return line.totalUSD === 0 ? 'Free' : formatUSD(line.totalUSD);
}

function qtyCell(line: BomLine): string {
  return line.unit ? `${n(line.qty)} ${line.unit}` : n(line.qty);
}

export function bomSummary(bom: Bom): string {
  if (bom.priced === 0) return 'No prices recorded for these parts';
  const total = formatUSD(bom.totalUSD);
  return bom.unpriced === 0
    ? `${total} for all ${bom.priced} parts`
    : `${total} for ${bom.priced} of ${bom.priced + bom.unpriced} parts (${bom.unpriced} ${bom.unpriced === 1 ? 'has' : 'have'} no recorded price)`;
}

export interface BomExportOptions {
  title: string;
  /** Site origin for part links, e.g. https://list.awesomeled.xyz */
  origin: string;
  /** Link back to the design */
  url: string;
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|');
}

export function bomToMarkdown(bom: Bom, options: BomExportOptions): string {
  const rows = (section: BomSection) =>
    bom.lines
      .filter((l) => l.section === section)
      .map((l) => {
        const name = l.path
          ? `[${escapeCell(l.name)}](${options.origin}${l.path})`
          : escapeCell(l.name);
        const detail = l.detail ? ` — ${escapeCell(l.detail)}` : '';
        return section === 'parts'
          ? `| ${qtyCell(l)} | ${name}${detail} | ${l.category} | ${unitCell(l)} | ${totalCell(l)} |`
          : `| ${qtyCell(l)} | ${name}${detail} | ${l.category} |`;
      });

  const out = [`# ${options.title} — bill of materials`, ''];
  const parts = rows('parts');
  if (parts.length) {
    out.push(
      '| Qty | Part | Category | Unit | Total |',
      '| ---: | --- | --- | ---: | ---: |',
      ...parts,
      '',
      `**Estimated total: ${bomSummary(bom)}.**`,
      ''
    );
  }
  const extras = rows('extras');
  if (extras.length) {
    out.push(
      'Also needed (sized by the power plan, not priced):',
      '',
      '| Qty | Item | Category |',
      '| ---: | --- | --- |',
      ...extras,
      ''
    );
  }
  out.push(`Design: ${options.url}`);
  return out.join('\n');
}

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function bomToCsv(bom: Bom, options: BomExportOptions): string {
  const header = [
    'Section',
    'Category',
    'Part',
    'Detail',
    'Qty',
    'Unit',
    'Unit price (USD)',
    'Total (USD)',
    'Price as published',
    'Price note',
    'Link',
  ];
  const rows = bom.lines.map((l) => [
    l.section === 'parts' ? 'Part' : 'Also needed',
    l.category,
    l.name,
    l.detail,
    l.qty,
    l.unit,
    l.unitUSD != null ? Number(l.unitUSD.toFixed(4)) : null,
    l.totalUSD != null ? Number(l.totalUSD.toFixed(2)) : null,
    l.priceText,
    l.priceNote,
    l.path ? options.origin + l.path : null,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

/** Plain text for forums and chat */
export function bomToText(bom: Bom, options: BomExportOptions): string {
  const out = [`${options.title} — bill of materials`, ''];
  for (const l of bom.lines.filter((l) => l.section === 'parts')) {
    const price = l.totalUSD != null ? totalCell(l) : (l.priceText ?? 'no price recorded');
    out.push(`${qtyCell(l)} × ${l.name} (${l.category}) — ${price}`);
  }
  out.push('', `Estimated total: ${bomSummary(bom)}`);
  const extras = bom.lines.filter((l) => l.section === 'extras');
  if (extras.length) {
    out.push('', 'Also needed:');
    for (const l of extras) out.push(`${qtyCell(l)} × ${l.name}`);
  }
  out.push('', options.url);
  return out.join('\n');
}
