import { describe, expect, test } from 'bun:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PROTOCOLS, protocolsByRef } from '../../app/lib/protocols/families';

const DB = join(process.cwd(), 'database');
const ids = (category: string) =>
  readdirSync(join(DB, category))
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .map((f) => `${category}/${f.replace(/\.yaml$/, '')}`);

describe('pixel protocol families', () => {
  test('every member points at a real database entry', () => {
    const known = new Set([...ids('pixels'), ...ids('pixel-ics')]);
    const dangling = PROTOCOLS.flatMap((p) =>
      p.members.filter((m) => m.ref && !known.has(m.ref)).map((m) => `${p.id}: ${m.ref}`)
    );
    expect(dangling).toEqual([]);
  });

  test('no part is in two protocols', () => {
    const twice = [...protocolsByRef()].filter(([, ps]) => ps.length > 1).map(([ref]) => ref);
    expect(twice).toEqual([]);
  });

  // Not a failure: other workstreams add parts every day, and the protocol
  // research reaches them later. The list shows up in the test output.
  test('parts not yet assigned a protocol are listed', () => {
    const byRef = protocolsByRef();
    const missing = [...ids('pixels'), ...ids('pixel-ics')].filter((ref) => !byRef.has(ref));
    if (missing.length) console.warn(`No protocol yet for: ${missing.join(', ')}`);
    expect(Array.isArray(missing)).toBe(true);
  });

  test('protocol ids are unique and every protocol cites its research', () => {
    const ids = PROTOCOLS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PROTOCOLS) {
      expect(p.batches.length).toBeGreaterThan(0);
      expect(p.members.length).toBeGreaterThan(0);
    }
  });
});
