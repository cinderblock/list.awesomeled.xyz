/**
 * System Designer logic: pure, client-safe, unit-tested (tests/unit).
 *
 *   catalog     database entries -> slim part options
 *   design      the design model and its URL encoding
 *   electrical  power, supplies, injection, fuses, wire, refresh rate
 *   compat      compatibility checks between parts
 *   analysis    one pass that runs all of the above for a design
 *   bom         bill of materials and its export formats
 *   embed       designs embedded in exported SVG / PNG files
 */

export * from './catalog';
export * from './design';
export * from './electrical';
export * from './compat';
export * from './analysis';
export * from './bom';
export * from './embed';
