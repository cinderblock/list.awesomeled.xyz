#!/usr/bin/env bun
/**
 * Microboards: typed memory and connectivity.
 *
 * - compute.flash / ram: common.json memory grammar; qualifiers move to
 *   flash_notes / ram_notes ("8GB eMMC" -> 8GB + "eMMC"); variant lists
 *   become arrays ("1GB, 2GB, ... or 8GB"). "microSD" recorded as flash is
 *   removable storage: it moves to io.storage. "32Mbit" -> 4MB.
 * - compute.soc spelled as makers do (nRF52840, AM3358, ESP32-S3,
 *   i.MX RT1062, Allwinner H3); compute.isa enum (ARMv7 -> ARMv7-A,
 *   ARMv8 -> ARMv8-A, AVR5 / AVR2.5 -> AVR)
 * - connectivity: Wi-Fi bands as a list (like controllers' inputs);
 *   "USB" / "Shield" (a dongle or shield) -> "add-on"; Ethernet enum
 *   (100BASE-TX, 1000BASE-T, add-on); PoE Y/N -> boolean, "optional (...)"
 *   -> add-on; usb "No" -> false
 * - io: bms "No" -> false, "Diode" -> diode; imu "Wing" -> add-on;
 *   storage "Shield" -> add-on
 * - power.gpio_voltage "5.0V" -> "5V"
 */

import { isScalar, type Document } from 'yaml';
import { getJS, migrateCategory, remove, setJS } from './lib';

const SOC: Record<string, string> = {
  'NRF 52840': 'nRF52840',
  am3358: 'AM3358',
  'ESP32 S3': 'ESP32-S3',
  iMXRT1062: 'i.MX RT1062',
  'Allwinner Quad Core H3': 'Allwinner H3',
};
const ISA: Record<string, string> = {
  ARMv7: 'ARMv7-A',
  ARMv8: 'ARMv8-A',
  AVR5: 'AVR',
  'AVR2.5': 'AVR',
};

const memory = /^\d+(\.\d+)?\s?(B|kB|MB|GB|TB)$/;

function comment(doc: Document, path: (string | number)[], text: string) {
  const n = doc.getIn(path, true);
  if (isScalar(n)) n.comment = ' ' + text;
}

const changed = migrateCategory('microboards', (doc, { id }) => {
  let touched = false;
  const set = (path: (string | number)[], value: unknown) => {
    if (JSON.stringify(getJS(doc, path)) === JSON.stringify(value)) return;
    setJS(doc, path, value);
    touched = true;
  };
  const fail = (what: string, v: unknown) => {
    throw new Error(`microboards/${id}: ${what} ${JSON.stringify(v)}`);
  };

  // --- flash / storage
  const flash = getJS(doc, ['compute', 'flash']);
  if (typeof flash === 'string' && !memory.test(flash)) {
    if (flash === 'microSD') {
      remove(doc, ['compute', 'flash']);
      set(['io', 'storage'], 'microSD');
      touched = true;
    } else if (flash === '4GBeMMC/microSD') {
      set(['compute', 'flash'], '4GB');
      set(['compute', 'flash_notes'], 'eMMC');
      set(['io', 'storage'], 'microSD');
    } else if (flash === '32Mbit') {
      set(['compute', 'flash'], '4MB');
      comment(doc, ['compute', 'flash'], '32 Mbit');
    } else {
      const m = flash.match(/^(\d+(?:\.\d+)?(?:B|kB|MB|GB))\s*(?:\((.+)\)|(.+))$/);
      if (!m) fail('flash', flash);
      set(['compute', 'flash'], m![1]);
      set(['compute', 'flash_notes'], (m![2] ?? m![3]).trim());
    }
  }

  // --- ram
  const ram = getJS(doc, ['compute', 'ram']);
  if (typeof ram === 'string' && !memory.test(ram)) {
    const list = ram.split(/,\s*|\s+or\s+/).filter(Boolean);
    if (list.length > 1 && list.every((r) => memory.test(r))) set(['compute', 'ram'], list);
    else if (ram === '256MB+') {
      set(['compute', 'ram'], '256MB');
      set(['compute', 'ram_notes'], 'larger variants exist');
    } else {
      const m = ram.match(/^(\d+(?:\.\d+)?(?:B|kB|MB|GB))\s*\((.+)\)$/);
      if (!m) fail('ram', ram);
      set(['compute', 'ram'], m![1]);
      set(['compute', 'ram_notes'], m![2]);
    }
  }

  const soc = getJS(doc, ['compute', 'soc']);
  if (typeof soc === 'string' && soc in SOC) set(['compute', 'soc'], SOC[soc]);
  const isa = getJS(doc, ['compute', 'isa']);
  if (typeof isa === 'string' && isa in ISA) set(['compute', 'isa'], ISA[isa]);

  // --- connectivity
  const wifi = getJS(doc, ['connectivity', 'wifi']);
  if (typeof wifi === 'string') {
    if (/^\d(\.\d)?GHz$/.test(wifi)) set(['connectivity', 'wifi'], [wifi]);
    else if (wifi === 'USB' || wifi === 'Shield') {
      set(['connectivity', 'wifi'], 'add-on');
      comment(doc, ['connectivity', 'wifi'], wifi === 'USB' ? 'USB dongle' : 'shield');
    } else fail('wifi', wifi);
  }
  const eth = getJS(doc, ['connectivity', 'ethernet']);
  if (typeof eth === 'string' && !['100BASE-TX', '1000BASE-T', 'add-on'].includes(eth)) {
    if (eth === 'USB') {
      set(['connectivity', 'ethernet'], 'add-on');
      comment(doc, ['connectivity', 'ethernet'], 'USB adapter');
    } else if (/^Gigabit/.test(eth)) {
      set(['connectivity', 'ethernet'], '1000BASE-T');
      const note = eth.match(/\((.+)\)/)?.[1];
      if (note) comment(doc, ['connectivity', 'ethernet'], note);
    } else fail('ethernet', eth);
  }
  const bt = getJS(doc, ['connectivity', 'bluetooth']);
  if (bt === 'USB') {
    set(['connectivity', 'bluetooth'], 'add-on');
    comment(doc, ['connectivity', 'bluetooth'], 'USB dongle');
  } else if (bt === '5 (LE)') set(['connectivity', 'bluetooth'], '5.0 LE');
  if (getJS(doc, ['connectivity', 'usb']) === 'No') set(['connectivity', 'usb'], false);
  const poe = getJS(doc, ['connectivity', 'poe']);
  if (poe === 'Y') set(['connectivity', 'poe'], true);
  else if (poe === 'N') set(['connectivity', 'poe'], false);
  else if (typeof poe === 'string' && poe.startsWith('optional')) {
    set(['connectivity', 'poe'], 'add-on');
    const note = poe.match(/\((.+)\)/)?.[1];
    if (note) comment(doc, ['connectivity', 'poe'], note);
  } else if (typeof poe === 'string' && poe !== 'add-on') fail('poe', poe);

  // --- io
  const bms = getJS(doc, ['io', 'bms']);
  if (bms === 'No') set(['io', 'bms'], false);
  else if (bms === 'Diode') set(['io', 'bms'], 'diode');
  if (getJS(doc, ['io', 'imu']) === 'Wing') {
    set(['io', 'imu'], 'add-on');
    comment(doc, ['io', 'imu'], 'FeatherWing');
  }
  if (getJS(doc, ['io', 'storage']) === 'Shield') {
    set(['io', 'storage'], 'add-on');
    comment(doc, ['io', 'storage'], 'shield');
  }

  const gpio = getJS(doc, ['power', 'gpio_voltage']);
  if (typeof gpio === 'string' && /\.0V$/.test(gpio))
    set(['power', 'gpio_voltage'], gpio.replace('.0V', 'V'));
  return touched;
});
console.log(`microboards: ${changed.length} entries migrated`);
