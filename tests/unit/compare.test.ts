import { describe, expect, test } from 'bun:test';
import {
  COMPARE_MAX,
  compareHref,
  entryRef,
  parseCompareParam,
  splitRef,
} from '../../app/lib/compare';

describe('compare refs', () => {
  test('a ref is <category>/<id>', () => {
    expect(entryRef('controllers', 'falcon-f16v4')).toBe('controllers/falcon-f16v4');
    expect(splitRef('controllers/falcon-f16v4')).toEqual({
      category: 'controllers',
      id: 'falcon-f16v4',
    });
    expect(splitRef('controllers')).toBeNull();
    expect(splitRef('/falcon')).toBeNull();
    expect(splitRef('controllers/')).toBeNull();
  });

  test('the URL param keeps order and drops junk, repeats and extras', () => {
    expect(parseCompareParam('pixels/ws2812, pixels/sk6812')).toEqual([
      'pixels/ws2812',
      'pixels/sk6812',
    ]);
    expect(parseCompareParam('pixels/ws2812,bogus,,pixels/ws2812')).toEqual(['pixels/ws2812']);
    expect(parseCompareParam('a/1,a/2,a/3,a/4,a/5').length).toBe(COMPARE_MAX);
    expect(parseCompareParam(null)).toEqual([]);
    expect(parseCompareParam('')).toEqual([]);
  });

  test('links stay readable and round-trip', () => {
    const refs = ['controllers/falcon-f16v4', 'pixel-ics/ws2811'];
    const href = compareHref(refs);
    expect(href).toBe('/compare?e=controllers/falcon-f16v4,pixel-ics/ws2811');
    expect(parseCompareParam(new URLSearchParams(href.split('?')[1]).get('e'))).toEqual(refs);
    expect(compareHref(refs, true)).toBe(`${href}&diff=1`);
    expect(compareHref([])).toBe('/compare');
  });

  test('ids with unusual characters are escaped', () => {
    const href = compareHref(['connectors/jst sm&x']);
    expect(href).toBe('/compare?e=connectors/jst%20sm%26x');
    expect(new URLSearchParams(href.split('?')[1]).get('e')).toBe('connectors/jst sm&x');
  });
});
