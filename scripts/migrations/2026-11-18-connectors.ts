#!/usr/bin/env bun
/**
 * Connectors: typed ratings, pitch and gauges.
 *
 * - ratings.max_current / max_voltage: "10 A" / "250 V" -> "10A" / "250V",
 *   the no-space spelling the rest of the database uses
 * - ratings.ip_rating: shared common.json ip_rating. "No" (the sheet's
 *   value for unsealed) -> false; "IP65 Available" (Powerpole: unsealed
 *   unless you add SpecPak shells) -> false, with the option in the notes
 * - mechanical.pitch: common.json length grammar ("2.54 mm" -> "2.54mm",
 *   "10.0 mm" -> "10mm")
 * - mechanical.rows "N/A" (circular connectors) -> omitted
 * - mechanical.pcb_mount "Both" -> "both" (enum false / PTH / SMT / both)
 * - mechanical.outline "Rectangular/Triangular" -> a list
 * - termination.*_gauge "28 AWG" -> 28 (integer AWG)
 * - creator spacing around "/" normalized ("TE /AMP" -> "TE / AMP")
 */

import { getJS, migrateCategory, remove, setJS } from './lib';

const unspace = (v: unknown) =>
  typeof v === 'string' ? v.replace(/^(~?\d+(?:\.\d+)?)\s+([A-Za-zµ]+)$/, '$1$2') : v;
const trimZero = (v: string) => v.replace(/\.0(?=[a-z]+$)/i, '');

const changed = migrateCategory('connectors', (doc, { id }) => {
  let touched = false;
  const set = (path: string[], value: unknown) => {
    if (JSON.stringify(getJS(doc, path)) === JSON.stringify(value)) return;
    setJS(doc, path, value);
    touched = true;
  };

  for (const key of ['max_current', 'max_voltage']) {
    const v = getJS(doc, ['ratings', key]);
    if (typeof v === 'string') set(['ratings', key], unspace(v));
  }

  const ip = getJS(doc, ['ratings', 'ip_rating']);
  if (ip === 'No') set(['ratings', 'ip_rating'], false);
  else if (ip === 'IP65 Available') {
    set(['ratings', 'ip_rating'], false);
    const notes = getJS(doc, ['ratings', 'ip_rating_notes']);
    set(
      ['ratings', 'ip_rating_notes'],
      `IP65 with ${typeof notes === 'string' ? notes.replace(/ for waterproofing$/, '') : 'optional sealing shells'}`
    );
  } else if (ip === null) {
    remove(doc, ['ratings', 'ip_rating']);
    touched = true;
  }

  const pitch = getJS(doc, ['mechanical', 'pitch']);
  if (typeof pitch === 'string') set(['mechanical', 'pitch'], trimZero(String(unspace(pitch))));

  if (getJS(doc, ['mechanical', 'rows']) === 'N/A') {
    remove(doc, ['mechanical', 'rows']);
    touched = true;
  }
  if (getJS(doc, ['mechanical', 'pcb_mount']) === 'Both') set(['mechanical', 'pcb_mount'], 'both');

  const outline = getJS(doc, ['mechanical', 'outline']);
  if (typeof outline === 'string' && outline.includes('/')) {
    set(
      ['mechanical', 'outline'],
      outline.split('/').map((s) => s.trim())
    );
  }

  for (const key of ['smallest_gauge', 'largest_gauge']) {
    const v = getJS(doc, ['termination', key]);
    if (typeof v === 'string') {
      const m = v.match(/^(\d+)\s*AWG$/i);
      if (!m) throw new Error(`connectors/${id}: ${key} "${v}"`);
      set(['termination', key], Number(m[1]));
    }
  }

  const creator = getJS(doc, ['creator']);
  if (typeof creator === 'string' && /\s?\/\s?/.test(creator) && !/ \/ /.test(creator)) {
    set(['creator'], creator.replace(/\s*\/\s*/g, ' / '));
  }
  return touched;
});
console.log(`connectors: ${changed.length} entries migrated`);
