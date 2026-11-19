#!/usr/bin/env bun
/**
 * Standardize IC / LED packages (TODO "Standardize IC packages").
 *
 * pixel-ics + pixels: `physical.package_size` (joined strings like
 * "SOP16/QFN16", "SOP8/10/14", "5050, 3535, 2020") and the parallel
 * `physical.package_sizes` array become one `physical.packages` array of
 * canonical names (common.json ic_package / led_package):
 *   IC packages  — LCSC style, pin count last: SOP-8, SSOP-16, QFN-16, DIP-14
 *   LED packages — footprint code (5050, 3535, 2020) or through-hole size (5mm)
 * pixel-ics also drop `physical.pin_count`: every IC package name carries it.
 *
 * Pure re-encoding: no package is added or removed here. Datasheet
 * corrections are separate per-entry commits.
 */

import { getJS, migrateCategory, remove, renameKey, setJS } from './lib';

/** "SOP8" -> "SOP-8", "SSOP16" -> "SSOP-16"; LED codes pass through. */
function canonical(name: string): string {
  const s = name.trim().toUpperCase();
  if (/^\d{4}$/.test(s)) return s; // LED footprint code
  const m = s.match(/^([A-Z]+)-?(\d+)$/);
  if (!m) throw new Error(`unrecognized package "${name}"`);
  return `${m[1]}-${m[2]}`;
}

/**
 * Split a joined package string. Slash groups may abbreviate a shared prefix
 * ("SOP8/10/14" = SOP8, SOP10, SOP14).
 */
function splitPackages(joined: string): string[] {
  if (/^5\/8mm T style$/i.test(joined.trim())) return ['5mm', '8mm']; // PL9823 through-hole
  const out: string[] = [];
  for (const group of joined.split(/[,&]/)) {
    let prefix = '';
    for (const raw of group.split('/')) {
      const part = raw.trim();
      if (!part) continue;
      if (/^\d+$/.test(part) && prefix && part.length < 4) {
        out.push(`${prefix}${part}`);
        continue;
      }
      prefix = part.match(/^([A-Za-z]+)/)?.[1] ?? '';
      out.push(part);
    }
  }
  return out;
}

const unique = (xs: string[]) => [...new Set(xs)];

function migrate(category: 'pixel-ics' | 'pixels') {
  const notes: string[] = [];
  const changed = migrateCategory(category, (doc, { id }) => {
    const single = getJS(doc, ['physical', 'package_size']);
    const list = getJS(doc, ['physical', 'package_sizes']);
    if (single === undefined && list === undefined) return false;

    const fromList = Array.isArray(list) ? list.map((p) => canonical(String(p))) : [];
    const fromSingle =
      typeof single === 'string'
        ? splitPackages(single).map((p) => (/mm$/.test(p) ? p : canonical(p)))
        : [];
    if (fromList.length && fromSingle.length) {
      const a = [...fromList].sort().join(',');
      const b = [...fromSingle].sort().join(',');
      if (a !== b)
        notes.push(
          `${id}: package_sizes [${fromList}] vs package_size [${fromSingle}] — kept the union`
        );
    }
    const packages = unique([...fromSingle, ...fromList]);

    // Put `packages` where the old field sat, then drop the leftovers
    if (single !== undefined) {
      renameKey(doc, ['physical'], 'package_size', 'packages');
      if (list !== undefined) remove(doc, ['physical', 'package_sizes']);
    } else {
      renameKey(doc, ['physical'], 'package_sizes', 'packages');
    }
    setJS(doc, ['physical', 'packages'], packages);

    if (category === 'pixel-ics') {
      const pins = getJS(doc, ['physical', 'pin_count']);
      if (pins !== undefined) {
        const counts = packages.map((p) => Number(p.match(/-(\d+)$/)?.[1]));
        const recorded = String(pins).split('/').map(Number);
        if (recorded.some((n) => !counts.includes(n))) {
          notes.push(`${id}: pin_count ${pins} not implied by [${packages}]`);
        }
        remove(doc, ['physical', 'pin_count']);
      }
    }
    return true;
  });
  console.log(`${category}: ${changed.length} entries migrated`);
  for (const n of notes) console.log(`  ! ${n}`);
}

migrate('pixel-ics');
migrate('pixels');
