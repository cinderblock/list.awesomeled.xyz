// Minimal ambient types for `bun:test`, the runner behind `bun run test:unit`.
// The project doesn't depend on @types/bun (see scripts/bun-runtime.d.ts for
// the same approach), so this declares just the surface the unit tests use to
// keep `tsc` happy. Extend it when a test needs another matcher.

declare module 'bun:test' {
  type TestBody = () => void | Promise<void>;

  export function describe(name: string, body: () => void): void;
  export function test(name: string, body: TestBody): void;
  export const it: typeof test;
  export function beforeAll(body: TestBody): void;
  export function beforeEach(body: TestBody): void;
  export function afterAll(body: TestBody): void;
  export function afterEach(body: TestBody): void;

  export interface Matchers {
    not: Matchers;
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toStrictEqual(expected: unknown): void;
    toMatchObject(expected: object): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeCloseTo(expected: number, precision?: number): void;
    toBeGreaterThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toContain(expected: unknown): void;
    toHaveLength(expected: number): void;
    toMatch(expected: RegExp | string): void;
    toThrow(expected?: RegExp | string): void;
  }

  export function expect(actual: unknown): Matchers;
}
