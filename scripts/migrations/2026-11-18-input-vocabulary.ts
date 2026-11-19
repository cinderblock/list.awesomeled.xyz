#!/usr/bin/env bun
/**
 * Controllers' and adapters' inputs use a fixed vocabulary
 * (common.json input_interfaces / control_protocol); storage types too.
 *
 * inputs.physical keys had grown variants: DMX vs DMX512, "RF Remote" vs
 * "RF remote", "Trigger inputs" / "Switch Trigger" / "Switch" / triggers,
 * City Theatrical's "Multiverse" (its wireless DMX), and storage recorded as
 * an input ("SD Card", "microSD", "USB stick"). Values: Wi-Fi bands become a
 * list like microboards' (["2.4GHz"]); Ethernet "Dual" / "Daisy-chain"
 * become a port count (2), "100Mbps" stays true with a comment.
 * inputs.protocols "DMX" -> "DMX512", "E1.31" -> "sACN". data.storage types: uSD -> microSD,
 * Flash -> flash.
 *
 * Re-encoding only. Whether the inputs are right is a separate, researched
 * question (the sheet's Interface column was scrambled; see
 * plans/database-review-inputs-audit.md).
 */

import { isScalar, type Document } from 'yaml';
import { getJS, migrateCategory, remove, setJS } from './lib';

const RENAME: Record<string, string> = {
  DMX: 'DMX512',
  'RF Remote': 'RF remote',
  'Trigger inputs': 'triggers',
  'Switch Trigger': 'triggers',
  Switch: 'triggers',
};
const STORAGE_KEYS: Record<string, string> = {
  'SD Card': 'SD',
  'SD card': 'SD',
  microSD: 'microSD',
  'USB stick': 'USB',
};
const STORAGE_TYPE: Record<string, string> = { uSD: 'microSD', Flash: 'flash' };

function comment(doc: Document, path: string[], text: string) {
  const n = doc.getIn(path, true);
  if (isScalar(n)) n.comment = ' ' + text;
}

function addStorage(doc: Document, type: string) {
  const list = (getJS(doc, ['data', 'storage']) as { type: string }[] | null | undefined) ?? [];
  if (list.some((s) => STORAGE_TYPE[s.type] === type || s.type === type)) return;
  setJS(doc, ['data', 'storage'], [...list, { type }]);
}

function migrate(category: 'controllers' | 'adapters') {
  return migrateCategory(category, (doc, { id }) => {
    let touched = false;
    const physical = getJS(doc, ['inputs', 'physical']) as Record<string, unknown> | undefined;
    if (physical) {
      for (const [key, value] of Object.entries(physical)) {
        const path = ['inputs', 'physical', key];
        if (key in STORAGE_KEYS) {
          remove(doc, path);
          addStorage(doc, STORAGE_KEYS[key]);
          touched = true;
        } else if (key === 'Multiverse') {
          remove(doc, path);
          setJS(doc, ['inputs', 'physical', 'Wireless DMX'], 'Multiverse');
          touched = true;
        } else if (key in RENAME) {
          const to = RENAME[key];
          const existing = getJS(doc, ['inputs', 'physical', to]);
          remove(doc, path);
          // keep the more specific of two values (a count or connector beats true)
          setJS(
            doc,
            ['inputs', 'physical', to],
            existing !== undefined && value === true ? existing : value
          );
          touched = true;
        } else if (key === 'Wi-Fi' && typeof value === 'string') {
          setJS(doc, path, [value]);
          touched = true;
        } else if (key === 'Ethernet' && typeof value === 'string') {
          const dual = value.match(/^Dual(?: \((.+)\))?$/);
          if (dual) {
            setJS(doc, path, 2);
            if (dual[1]) comment(doc, path, dual[1]);
          } else if (value === 'Daisy-chain') {
            setJS(doc, path, 2);
            comment(doc, path, 'daisy-chain in + out');
          } else if (value === '100Mbps') {
            setJS(doc, path, true);
            comment(doc, path, '100 Mbps');
          } else throw new Error(`${category}/${id}: Ethernet "${value}"`);
          touched = true;
        }
      }
    }

    const protocols = getJS(doc, ['inputs', 'protocols']);
    const PROTOCOL: Record<string, string> = { DMX: 'DMX512', 'E1.31': 'sACN' };
    if (Array.isArray(protocols) && protocols.some((p) => p in PROTOCOL)) {
      const next = [...new Set(protocols.map((p) => PROTOCOL[p] ?? p))];
      setJS(doc, ['inputs', 'protocols'], next);
      touched = true;
    }

    const storage = getJS(doc, ['data', 'storage']);
    if (Array.isArray(storage) && storage.some((s) => s?.type in STORAGE_TYPE)) {
      storage.forEach((s, i) => {
        if (s?.type in STORAGE_TYPE)
          setJS(doc, ['data', 'storage', i, 'type'], STORAGE_TYPE[s.type]);
      });
      touched = true;
    }
    return touched;
  });
}

for (const c of ['controllers', 'adapters'] as const) {
  console.log(c, migrate(c).length, 'entries migrated');
}
