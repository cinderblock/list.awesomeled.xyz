import { describe, expect, test } from 'bun:test';
import { designerHref, parseDesign } from '../../app/lib/designer';
import { buildRelationGraph } from '../../app/lib/relations';
import type { BaseEntry } from '../../app/lib/types';
import {
  ADAPTERS,
  CONNECTORS,
  CONTROLLERS,
  entry,
  fixtureDatabase,
  fixtureIndex,
  LEVEL_CONVERTERS,
  MICROBOARDS,
  PATTERN_DRIVERS,
  PIXEL_ICS,
  PIXELS,
} from './fixtures';

const graph = buildRelationGraph(fixtureDatabase());
const index = fixtureIndex();
const pick = (list: BaseEntry[], id: string): BaseEntry => {
  const found = list.find((e) => e.id === id);
  if (!found) throw new Error(`fixture "${id}" not found`);
  return found;
};

/** The design a link opens */
const opened = (href: string | null) => {
  expect(href).toMatch(/^\/designer\?/);
  return parseDesign(new URLSearchParams(href!.split('?')[1]));
};

describe('links from entry pages into the designer', () => {
  test('a pixel or a driver IC starts a group with it', () => {
    expect(designerHref('pixels', pick(PIXELS, 'rgb5'), graph)).toBe('/designer?p=rgb5');
    const ic = opened(designerHref('pixel-ics', pick(PIXEL_ICS, 'ic12'), graph));
    expect(ic.groups[0].pixel).toBe('ic-ic12');
    expect(index.pixels.has(ic.groups[0].pixel)).toBe(true);
  });

  test('a controller, a dev board and an adapter land in the controller slot', () => {
    const controller = opened(designerHref('controllers', pick(CONTROLLERS, 'big16'), graph));
    expect(controller.groups[0].controller).toBe('big16');
    const board = opened(designerHref('microboards', pick(MICROBOARDS, 'esp'), graph));
    expect(board.groups[0].controller).toBe('mb-esp');
    const adapter = opened(designerHref('adapters', pick(ADAPTERS, 'shield4'), graph));
    expect(adapter.groups[0].controller).toBe('ad-shield4');
    for (const design of [controller, board, adapter]) {
      expect(index.controllers.has(design.groups[0].controller)).toBe(true);
    }
  });

  test('parts the designer cannot offer get no link', () => {
    // A board with no pixel outputs recorded, an adapter with no host or no outputs
    expect(designerHref('microboards', pick(MICROBOARDS, 'no-outputs'), graph)).toBeNull();
    expect(designerHref('adapters', pick(ADAPTERS, 'orphan'), graph)).toBeNull();
    expect(designerHref('adapters', pick(ADAPTERS, 'noouts'), graph)).toBeNull();
    // Software that neither sends a protocol nor runs on a board
    expect(designerHref('pattern-drivers', pick(PATTERN_DRIVERS, 'silent'), graph)).toBeNull();
    // Hardware for matrix panels: the designer lays out pixel strings
    expect(designerHref('controllers', pick(CONTROLLERS, 'panels'), graph)).toBeNull();
    expect(designerHref('adapters', pick(ADAPTERS, 'panelcape'), graph)).toBeNull();
    // A DMX node: no pixel outputs on record
    expect(designerHref('controllers', pick(CONTROLLERS, 'dmxbox'), graph)).toBeNull();
  });

  test('shifters, connectors and software go to their own slots', () => {
    const shifter = opened(designerHref('level-converters', pick(LEVEL_CONVERTERS, 'quad'), graph));
    expect(shifter.groups[0].shifter).toBe('quad');
    const connector = opened(designerHref('connectors', pick(CONNECTORS, 'pigtail'), graph));
    expect(connector.groups[0].connector).toBe('pigtail');
    const source = opened(designerHref('pattern-drivers', pick(PATTERN_DRIVERS, 'seq'), graph));
    expect(source.source).toBe('seq');
  });

  test('categories the designer has no slot for get no link', () => {
    for (const category of ['drive-libraries', 'diffusive-materials', 'commercial-systems']) {
      expect(designerHref(category, entry('x', { name: 'X' }), graph)).toBeNull();
    }
  });

  test('ids are encoded for the query string', () => {
    expect(designerHref('pixels', entry('a b&c', { name: 'Odd' }), graph)).toBe(
      '/designer?p=a%20b%26c'
    );
  });
});
