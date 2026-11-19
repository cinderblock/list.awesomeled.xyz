#!/usr/bin/env bun
/**
 * Quantities drop trailing zeros: "20.0mA" -> "20mA", "1.0GHz" -> "1GHz",
 * "5.10V" -> "5.1V". Same value, one spelling (the sheet mixed "27kHz" and
 * "27.0kHz" for the same figure). Only whole scalar values that are a number
 * plus a unit are touched; prose is left alone.
 */

import { isScalar, visit } from 'yaml';
import { CATEGORIES, migrateCategory } from './lib';

const QUANTITY =
  /^(~?)(\d+)\.(\d*?)0+(\s?)(mV|V|uA|µA|mA|A|Hz|kHz|MHz|GHz|mW|W|B|kB|MB|GB|TB|µm|um|mm|cm|m)$/;

let total = 0;
for (const category of CATEGORIES) {
  const changed = migrateCategory(category, (doc) => {
    let touched = false;
    visit(doc, {
      Scalar(_, node) {
        if (!isScalar(node) || typeof node.value !== 'string') return;
        const m = node.value.match(QUANTITY);
        if (!m) return;
        const [, approx, whole, frac, space, unit] = m;
        node.value = `${approx}${whole}${frac ? `.${frac}` : ''}${space}${unit}`;
        touched = true;
      },
    });
    return touched;
  });
  if (changed.length) console.log(`${category}: ${changed.length}`);
  total += changed.length;
}
console.log(`${total} entries`);
