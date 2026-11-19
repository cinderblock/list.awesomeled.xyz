import { describe, expect, test } from 'bun:test';
import { urlLabel } from '../../app/lib/url-label';

describe('urlLabel', () => {
  test('a bare site is its host, without www', () => {
    expect(urlLabel('https://www.adafruit.com/')).toBe('adafruit.com');
    expect(urlLabel('http://pixelcontroller.com')).toBe('pixelcontroller.com');
  });

  test('the last part of the path tells links to one site apart', () => {
    expect(urlLabel('https://github.com/FastLED/FastLED')).toBe('github.com › FastLED');
    expect(urlLabel('https://www.adafruit.com/product/1138')).toBe('adafruit.com › 1138');
  });

  test('a document keeps its file name; a page loses its extension', () => {
    expect(urlLabel('https://cdn-shop.adafruit.com/datasheets/WS2812B.pdf')).toBe(
      'cdn-shop.adafruit.com › WS2812B.pdf'
    );
    expect(urlLabel('https://example.com/store/70-f16v4.html')).toBe('example.com › 70-f16v4');
  });

  test('endings every site has are left out', () => {
    expect(urlLabel('https://example.com/en/index.html')).toBe('example.com');
    expect(urlLabel('https://example.com/products/')).toBe('example.com');
  });

  test('long tails are cut, encoded ones decoded', () => {
    expect(
      urlLabel(
        'https://raw.githubusercontent.com/org/repo/main/BeagleBone_Black_System_Reference_Manual_rev_C.pdf'
      )
    ).toBe('raw.githubusercontent.com › BeagleBone_Black_System_Referen…');
    expect(urlLabel('https://example.com/docs/Data%20Sheet.pdf')).toBe(
      'example.com › Data Sheet.pdf'
    );
  });

  test('query strings and fragments are not shown', () => {
    expect(urlLabel('https://example.com/item?id=5#specs')).toBe('example.com › item');
  });

  test('something that is not a URL comes back unchanged', () => {
    expect(urlLabel('see the manual')).toBe('see the manual');
  });
});
