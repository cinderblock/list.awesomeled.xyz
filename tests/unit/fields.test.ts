import { describe, expect, test } from 'bun:test';
import {
  buildFieldCatalog,
  fieldNumber,
  fieldSortValue,
  fieldText,
  fieldValues,
  getPath,
  humanizeKey,
  priceText,
  type FieldMeta,
  type JsonSchema,
} from '../../app/lib/fields';
import type { BaseEntry } from '../../app/lib/types';

// Synthetic schema and rows on purpose: other workstreams reshape the real
// database all the time, and a data fix must never break these tests.
const common: JsonSchema = {
  definitions: {
    voltage: { oneOf: [{ type: 'null' }, { type: 'number' }, { type: 'string' }] },
    current: { oneOf: [{ type: 'null' }, { type: 'number' }, { type: 'string' }] },
    frequency: { oneOf: [{ type: 'null' }, { type: 'number' }, { type: 'string' }] },
    status: { type: 'string', enum: ['active', 'discontinued'] },
    price: { oneOf: [{ type: 'number' }, { type: 'string' }, { type: 'object' }] },
    image: { oneOf: [{ type: 'string' }, { type: 'null' }] },
  },
};

const schema: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    status: { anyOf: [{ $ref: 'common.json#/definitions/status' }, { type: 'null' }] },
    release_year: { type: ['integer', 'null'], description: 'Year of first availability' },
    creator: {
      oneOf: [
        { type: 'string' },
        { type: 'null' },
        { type: 'object', properties: { name: { type: 'string' }, url: { type: 'string' } } },
      ],
    },
    vendors: {
      type: 'array',
      items: {
        oneOf: [{ type: 'string' }, { type: 'object', properties: { name: { type: 'string' } } }],
      },
    },
    notes: { type: ['string', 'null'] },
    inputs: {
      type: 'object',
      properties: {
        physical: { type: 'object', additionalProperties: { type: ['string', 'boolean'] } },
        protocols: { type: 'array', items: { type: 'string' } },
        standalone: { type: 'boolean', description: 'Runs without a computer' },
      },
    },
    outputs: {
      type: 'object',
      properties: {
        count: { type: 'integer' },
        protocols: { type: 'array', items: { type: 'string' } },
        current: {
          type: 'object',
          properties: { max: { $ref: 'common.json#/definitions/current' } },
        },
        clocked: { type: ['string', 'boolean'] },
      },
    },
    power: {
      type: 'object',
      properties: {
        current: {
          type: 'object',
          properties: { max: { $ref: 'common.json#/definitions/current' } },
        },
        voltage: {
          type: 'object',
          properties: {
            max: { $ref: 'common.json#/definitions/voltage' },
            max_notes: { type: 'string' },
          },
        },
      },
    },
    compute: {
      type: 'object',
      properties: { flash: { type: ['string', 'null'] }, soc: { type: 'string' } },
    },
    data: {
      type: 'object',
      properties: {
        bitrate: { $ref: 'common.json#/definitions/frequency' },
        storage: {
          type: 'array',
          items: { type: 'object', properties: { type: { type: 'string' } } },
        },
      },
    },
    features: { type: 'array', items: { type: 'string' } },
    links: { type: 'object', properties: { product: { type: ['string', 'null'] } } },
    price: { $ref: 'common.json#/definitions/price' },
    image: { $ref: 'common.json#/definitions/image' },
    related: { type: 'array', items: { type: 'object' } },
    unused_field: { type: 'string' },
  },
};

function entry(id: string, fields: Record<string, unknown>): BaseEntry {
  return { id, name: id.toUpperCase(), updated: new Date(0), ...fields };
}

const entries: BaseEntry[] = [
  entry('a', {
    status: 'active',
    release_year: 2020,
    creator: { name: 'Acme', url: 'https://acme.example' },
    vendors: ['Shop One', { name: 'Shop Two' }],
    notes: 'A long free-form note about this product that goes on for quite a while.',
    inputs: {
      physical: { Ethernet: true, 'Wi-Fi': '2.4GHz', Bluetooth: false },
      protocols: ['Art-Net', 'sACN'],
      standalone: true,
    },
    outputs: { count: 16, current: { max: 5 }, clocked: 'selectable' },
    power: { current: { max: 60 }, voltage: { max: 24, max_notes: 'Fused at 30 V' } },
    compute: { flash: '4MB', soc: 'ESP32-S3' },
    data: { bitrate: '800kHz', storage: [{ type: 'uSD' }] },
    features: ['Has an OLED status display on the front panel', 'Daisy-chain friendly outputs'],
    links: { product: 'https://acme.example/a' },
    price: 275,
    image: 'a.webp',
    related: [{ type: 'variant', ref: 'x/b' }],
    foss: true,
  }),
  entry('b', {
    status: 'discontinued',
    creator: 'Bolt',
    inputs: {
      physical: { Ethernet: 'Dual', USB: true },
      protocols: ['Art-Net'],
      standalone: false,
    },
    outputs: { count: 4, clocked: false },
    power: { voltage: { max: '5V' } },
    compute: { flash: 'microSD', soc: 'BCM2835' },
    data: { bitrate: '30MHz' },
    price: { amount: 99, currency: 'EUR' },
    foss: false,
  }),
  entry('c', {
    status: 'active',
    creator: 'Acme',
    inputs: { protocols: ['DDP'] },
    outputs: { count: 8, clocked: true, protocols: ['WS2812', 'SK6812'] },
    compute: { flash: '16MB', soc: 'RP2040' },
    price: [
      { qty: 1, price: 0.12 },
      { qty: 100, price: 0.08 },
    ],
  }),
];

const catalog = buildFieldCatalog(schema, common, entries);
const field = (key: string): FieldMeta => {
  const f = catalog.find((x) => x.key === key);
  if (!f) throw new Error(`no field ${key} in ${catalog.map((x) => x.key).join(', ')}`);
  return f;
};

describe('catalog shape', () => {
  test('kinds come from the schema', () => {
    expect(field('status').kind).toBe('enum');
    expect(field('release_year').kind).toBe('year');
    expect(field('creator').kind).toBe('entity');
    expect(field('inputs.standalone').kind).toBe('boolean');
    expect(field('outputs.count').kind).toBe('number');
    expect(field('price').kind).toBe('price');
    expect(field('links.product').kind).toBe('url');
    expect(field('power.voltage.max')).toMatchObject({ kind: 'quantity', quantity: 'voltage' });
    expect(field('data.bitrate')).toMatchObject({ kind: 'quantity', quantity: 'frequency' });
  });

  test('open maps become one keys field, not a column per key', () => {
    expect(field('inputs.physical').kind).toBe('keys');
    expect(catalog.some((f) => f.key.startsWith('inputs.physical.'))).toBe(false);
  });

  test('lists: short repeating values are tags, prose is a text list, objects use their name', () => {
    expect(field('inputs.protocols').kind).toBe('tags');
    expect(field('features')).toMatchObject({ kind: 'textlist', long: true });
    expect(field('vendors')).toMatchObject({ kind: 'tags', itemKey: 'name' });
    expect(field('data.storage')).toMatchObject({ kind: 'tags', itemKey: 'type' });
  });

  test('strings that are measurements are detected from the data', () => {
    expect(field('compute.flash')).toMatchObject({ kind: 'quantity', quantity: 'memory' });
  });

  test('mixed boolean/string fields are facets; unique strings are text', () => {
    expect(field('outputs.clocked').kind).toBe('enum');
    expect(field('notes')).toMatchObject({ kind: 'text', long: true });
  });

  test('fields the schema does not describe are picked up from the data', () => {
    expect(field('foss').kind).toBe('boolean');
  });

  test('unfilled, internal and specially-rendered fields are left out', () => {
    const keys = catalog.map((f) => f.key);
    for (const absent of ['name', 'id', 'updated', 'image', 'related', 'unused_field']) {
      expect(keys).not.toContain(absent);
    }
  });

  test('a _notes sibling is a footnote on its field, not its own column', () => {
    expect(field('power.voltage.max').notesKey).toBe('power.voltage.max_notes');
    expect(catalog.some((f) => f.key === 'power.voltage.max_notes')).toBe(false);
  });

  test('fill counts and descriptions are carried', () => {
    expect(field('status').filled).toBe(3);
    expect(field('release_year')).toMatchObject({
      filled: 1,
      description: 'Year of first availability',
    });
    // shared definitions describe how to write a value, not what the field is
    expect(field('power.voltage.max').description).toBeUndefined();
  });
});

describe('labels and order', () => {
  test('labels are humanized and min/max read naturally', () => {
    expect(field('release_year').label).toBe('Release year');
    expect(field('power.voltage.max').label).toBe('Max voltage');
    expect(field('compute.soc').label).toBe('SoC');
    expect(humanizeKey('gpio_voltage')).toBe('GPIO voltage');
    expect(humanizeKey('wled_compatible')).toBe('WLED compatible');
  });

  test('colliding labels are qualified by section', () => {
    expect(field('outputs.current.max').label).toBe('Outputs: max current');
    expect(field('power.current.max').label).toBe('Power: max current');
    expect(field('inputs.protocols').label).toBe('Inputs: protocols');
    const labels = catalog.map((f) => f.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  test('root fields come first, then sections in a fixed order', () => {
    const sections = [...new Set(catalog.map((f) => f.section))];
    expect(sections[0]).toBe('');
    expect(sections.indexOf('inputs')).toBeLessThan(sections.indexOf('outputs'));
    expect(sections.indexOf('outputs')).toBeLessThan(sections.indexOf('power'));
    expect(sections.indexOf('power')).toBeLessThan(sections.indexOf('data'));
  });
});

describe('reading values', () => {
  const [a, b, c] = entries;

  test('facet values', () => {
    const physical = field('inputs.physical');
    // Bluetooth: false is not a value the entry has
    expect(fieldValues(physical, getPath(a, physical.key))).toEqual(['Ethernet', 'Wi-Fi']);
    expect(fieldValues(field('creator'), a.creator)).toEqual(['Acme']);
    expect(fieldValues(field('creator'), b.creator)).toEqual(['Bolt']);
    expect(fieldValues(field('vendors'), a.vendors)).toEqual(['Shop One', 'Shop Two']);
    expect(fieldValues(field('outputs.clocked'), getPath(b, 'outputs.clocked'))).toEqual(['No']);
    expect(fieldValues(field('outputs.clocked'), getPath(c, 'outputs.clocked'))).toEqual(['Yes']);
    expect(fieldValues(field('data.storage'), getPath(a, 'data.storage'))).toEqual(['uSD']);
    expect(fieldValues(field('notes'), a.notes)).toEqual([]);
    expect(fieldValues(field('status'), undefined)).toEqual([]);
  });

  test('numbers normalize units and currencies', () => {
    expect(fieldNumber(field('data.bitrate'), '800kHz')).toBe(800_000);
    expect(fieldNumber(field('power.voltage.max'), 24)).toBe(24);
    expect(fieldNumber(field('power.voltage.max'), '5V')).toBe(5);
    expect(fieldNumber(field('compute.flash'), '4MB')).toBe(4_000_000);
    expect(fieldNumber(field('compute.flash'), 'microSD')).toBeNull();
    expect(fieldNumber(field('price'), 275)).toBe(275);
    expect(fieldNumber(field('price'), c.price)).toBe(0.08);
    expect(fieldNumber(field('price'), b.price)).toBeGreaterThan(99);
  });

  test('text is what a person would write', () => {
    expect(fieldText(field('power.voltage.max'), 24)).toBe('24 V');
    expect(fieldText(field('power.voltage.max'), '5V')).toBe('5V');
    expect(fieldText(field('power.current.max'), 60)).toBe('60 A');
    expect(fieldText(field('inputs.standalone'), true)).toBe('Yes');
    expect(fieldText(field('inputs.protocols'), ['Art-Net', 'sACN'])).toBe('Art-Net, sACN');
    expect(fieldText(field('inputs.physical'), getPath(a, 'inputs.physical'))).toBe(
      'Ethernet, Wi-Fi (2.4GHz)'
    );
    expect(fieldText(field('creator'), a.creator)).toBe('Acme');
    expect(fieldText(field('vendors'), a.vendors)).toBe('Shop One, Shop Two');
    expect(fieldText(field('status'), null)).toBe('');
  });

  test('prices keep their currency and summarize tiers', () => {
    expect(priceText(275)).toBe('$275');
    expect(priceText({ amount: 99, currency: 'EUR' })).toBe('€99');
    expect(priceText('free')).toBe('Free');
    expect(priceText('varies')).toBe('varies');
    expect(priceText(c.price)).toMatch(/^from \$0\.08/);
    expect(priceText(null)).toBe('');
  });

  test('sort values are numbers for measurable fields and text otherwise', () => {
    expect(fieldSortValue(field('data.bitrate'), '30MHz')).toBe(30_000_000);
    expect(fieldSortValue(field('inputs.standalone'), false)).toBe(0);
    expect(fieldSortValue(field('creator'), { name: 'Acme' })).toBe('acme');
    expect(fieldSortValue(field('status'), undefined)).toBeNull();
  });
});

describe('robustness', () => {
  test('works without any schema', () => {
    const dataOnly = buildFieldCatalog(null, null, entries);
    const keys = dataOnly.map((f) => f.key);
    expect(keys).toContain('outputs.count');
    expect(keys).toContain('status');
    // without a schema the map's keys cannot be told apart from a group
    expect(keys).toContain('inputs.physical.Ethernet');
  });

  test('an empty category yields an empty catalog', () => {
    expect(buildFieldCatalog(schema, common, [])).toEqual([]);
  });
});
