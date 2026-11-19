/**
 * Designs embedded in exported diagrams, so a picture can be re-opened as the
 * design it shows (the draw.io trick).
 *
 *  - SVG: JSON inside `<metadata id="awesomeled-design">`
 *  - PNG: the same JSON in an `iTXt` chunk with the keyword `awesomeled-design`
 *
 * The JSON carries the design's canonical query string, which is all the
 * designer needs. Files written by the first version of the designer carried a
 * `chains` list instead; those still import.
 *
 * Pure byte/string work — no DOM, no canvas — so it runs in the unit tests.
 */

import { SITE_ORIGIN } from '../site';
import { designQuery, emptyDesign, parseLayout, type Design, type GroupDesign } from './design';

export const EMBED_ID = 'awesomeled-design';
/** "list.awesomeled.xyz/designer" */
export const GENERATOR = `${new URL(SITE_ORIGIN).host}/designer`;

export interface DesignEmbed {
  generator: string;
  version: 2;
  /** Canonical query string: everything needed to re-open the design */
  query: string;
  title?: string;
  /** Snapshot for people who open the file in a text editor; never read back */
  summary?: {
    pixels: number;
    maxWatts: number;
    groups: { pixel: string | null; layout: string; controller: string | null }[];
  };
}

export function buildEmbed(design: Design, summary?: DesignEmbed['summary']): DesignEmbed {
  return {
    generator: GENERATOR,
    version: 2,
    query: designQuery(design),
    ...(design.title ? { title: design.title } : {}),
    ...(summary ? { summary } : {}),
  };
}

type Dict = Record<string, unknown>;

/** A first-generation embed: `{source, chains: [{pixel, strings, perString, lengths?, controller}]}` */
function legacyQuery(embed: Dict): string | null {
  if (!Array.isArray(embed.chains) || embed.chains.length === 0) return null;
  const design = emptyDesign();
  design.groups = embed.chains.map((raw): GroupDesign => {
    const c = (raw && typeof raw === 'object' ? raw : {}) as Dict;
    const perString = Array.isArray(c.lengths)
      ? c.lengths.join('.')
      : String(typeof c.perString === 'number' ? c.perString : '');
    return {
      pixel: typeof c.pixel === 'string' ? c.pixel : '',
      voltage: null,
      layout: parseLayout(String(typeof c.strings === 'number' ? c.strings : 1), perString),
      controller: typeof c.controller === 'string' ? c.controller : '',
      shifter: '',
      connector: '',
      name: '',
    };
  });
  design.source = typeof embed.source === 'string' ? embed.source : '';
  return designQuery(design);
}

/** Query string from embedded JSON text, or null when it isn't a design */
export function embedToQuery(json: string): string | null {
  let embed: unknown;
  try {
    embed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!embed || typeof embed !== 'object' || Array.isArray(embed)) return null;
  const e = embed as Dict;
  if (typeof e.query === 'string') return e.query.replace(/^\?/, '');
  return legacyQuery(e);
}

// ---------------------------------------------------------------------------
// SVG

function decodeXml(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, (_, inner: string) => inner.replace(/&/g, '&amp;'))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** JSON text of the design embedded in an SVG document, or null */
export function extractSvgEmbed(svg: string): string | null {
  const pattern = new RegExp(
    `<metadata\\b[^>]*\\bid\\s*=\\s*["']${EMBED_ID}["'][^>]*>([\\s\\S]*?)</metadata>`,
    'i'
  );
  const match = svg.match(pattern);
  return match ? decodeXml(match[1]).trim() : null;
}

// ---------------------------------------------------------------------------
// PNG

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= 8 && PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

let crcTable: Uint32Array | null = null;

export function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[i] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

interface PngChunk {
  type: string;
  /** Offset of the chunk's length field */
  start: number;
  /** Offset just past the chunk's CRC */
  end: number;
  data: Uint8Array;
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function writeUint32(bytes: Uint8Array, offset: number, value: number): void {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function pngChunks(bytes: Uint8Array): PngChunk[] {
  const chunks: PngChunk[] = [];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = readUint32(bytes, offset);
    const end = offset + 12 + length;
    if (end > bytes.length) break;
    chunks.push({
      type: String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)),
      start: offset,
      end,
      data: bytes.subarray(offset + 8, offset + 8 + length),
    });
    offset = end;
  }
  return chunks;
}

function latin1(bytes: Uint8Array): string {
  let text = '';
  for (const b of bytes) text += String.fromCharCode(b);
  return text;
}

/** Keyword and text of a tEXt / uncompressed iTXt chunk, or null */
function chunkText(chunk: PngChunk): { keyword: string; text: string } | null {
  if (chunk.type !== 'tEXt' && chunk.type !== 'iTXt') return null;
  const data = chunk.data;
  const nul = data.indexOf(0);
  if (nul < 1) return null;
  const keyword = latin1(data.subarray(0, nul));
  if (chunk.type === 'tEXt') return { keyword, text: latin1(data.subarray(nul + 1)) };

  // iTXt: keyword NUL flag method language NUL translated-keyword NUL text
  if (data[nul + 1] !== 0) return null; // compressed text: never written here
  const languageEnd = data.indexOf(0, nul + 3);
  if (languageEnd < 0) return null;
  const translatedEnd = data.indexOf(0, languageEnd + 1);
  if (translatedEnd < 0) return null;
  return { keyword, text: new TextDecoder().decode(data.subarray(translatedEnd + 1)) };
}

/** Text stored under `keyword` in a PNG, or null */
export function readPngText(bytes: Uint8Array, keyword: string): string | null {
  if (!isPng(bytes)) return null;
  for (const chunk of pngChunks(bytes)) {
    const entry = chunkText(chunk);
    if (entry && entry.keyword === keyword) return entry.text;
  }
  return null;
}

/**
 * Copy of a PNG with `text` stored under `keyword` (an iTXt chunk right after
 * the header). Any existing chunk with that keyword is replaced.
 */
export function writePngText(bytes: Uint8Array, keyword: string, text: string): Uint8Array {
  if (!isPng(bytes)) throw new Error('Not a PNG file');
  if (!/^[\x20-\x7e]{1,79}$/.test(keyword)) throw new Error('Invalid PNG text keyword');
  const chunks = pngChunks(bytes);
  if (chunks.length === 0 || chunks[0].type !== 'IHDR') throw new Error('Malformed PNG file');

  const payload = new TextEncoder().encode(text);
  const data = new Uint8Array(keyword.length + 5 + payload.length);
  for (let i = 0; i < keyword.length; i++) data[i] = keyword.charCodeAt(i);
  // NUL, compression flag 0, method 0, empty language NUL, empty translation NUL
  data.set(payload, keyword.length + 5);

  const chunk = new Uint8Array(12 + data.length);
  writeUint32(chunk, 0, data.length);
  chunk.set([0x69, 0x54, 0x58, 0x74], 4); // "iTXt"
  chunk.set(data, 8);
  writeUint32(chunk, 8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));

  const kept = chunks.filter((c) => chunkText(c)?.keyword !== keyword);
  const size = 8 + chunk.length + kept.reduce((sum, c) => sum + (c.end - c.start), 0);
  const out = new Uint8Array(size);
  out.set(bytes.subarray(0, 8), 0);
  let offset = 8;
  kept.forEach((c, i) => {
    out.set(bytes.subarray(c.start, c.end), offset);
    offset += c.end - c.start;
    if (i === 0) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Import

export type ImportResult = { query: string } | { error: string };

/** Recover a design's query string from an exported SVG or PNG file */
export function importDesignFile(bytes: Uint8Array): ImportResult {
  let json: string | null;
  let kind: string;
  if (isPng(bytes)) {
    kind = 'PNG';
    json = readPngText(bytes, EMBED_ID);
  } else {
    kind = 'SVG';
    const text = new TextDecoder().decode(bytes);
    if (!/<svg[\s>]/i.test(text)) {
      return { error: 'That file is neither an SVG nor a PNG exported from this designer.' };
    }
    json = extractSvgEmbed(text);
  }
  if (json == null) {
    return {
      error: `No design found in that ${kind}. Import works with diagrams downloaded from this designer; images that were re-saved or screenshotted lose the embedded design.`,
    };
  }
  const query = embedToQuery(json);
  if (query == null) return { error: `The design embedded in that ${kind} couldn't be read.` };
  return { query };
}
