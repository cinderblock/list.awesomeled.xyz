#!/usr/bin/env bun
/**
 * Pattern drivers (and drive libraries' language): typed I/O, visualizer and
 * language.
 *
 * - I/O directions (inputs.video / audio, outputs.protocols.*, outputs.gpio /
 *   serial, capabilities.programmatic) keep the sheet's Input / Output / Both
 *   / false; the schema now allows only those (true and "Possible" were
 *   resolved from research in the previous commit).
 * - inputs.other / outputs.other: comma lists ("MIDI,OSC,Spout") become tag
 *   lists with one spelling per name (MIDI, OSCQuery, Syphon and Spout
 *   apart); prose moves to other_notes. Items that name a typed field move
 *   there: "ADC" -> inputs.adc, LedFx's "Audio" -> inputs.audio, xLights' and
 *   LX Studio's DDP / OPC -> outputs.protocols, MapIO's PixelPusher is an
 *   output.
 * - capabilities.visualizer: free text ("Yes Basic 2D", "3D view available
 *   in V5") -> false / true / 1D / 2D / 3D, the qualifier in
 *   visualizer_notes.
 * - language: "Python, GLSL" / "C++ / Python" -> a list; "JS subset" ->
 *   JavaScript (subset noted). Shared common.json programming_language,
 *   also used by drive libraries.
 * - Nested keys follow the schema's order.
 */

import { isScalar, type Document } from 'yaml';
import { getJS, migrateCategory, orderKeys, remove, setJS } from './lib';

const DIRECTIONS = new Set(['Input', 'Output', 'Both', false]);
const IO_PATHS = [
  ['inputs', 'video'],
  ['inputs', 'audio'],
  ['outputs', 'gpio'],
  ['outputs', 'serial'],
  ['capabilities', 'programmatic'],
  ...['artnet', 'sacn', 'dmx', 'kinet', 'ddp', 'opc', 'spi'].map((p) => [
    'outputs',
    'protocols',
    p,
  ]),
];

const VISUALIZER: Record<string, [false | true | '1D' | '2D' | '3D', string?]> = {
  Yes: [true],
  'Yes Basic 2D': ['2D', 'basic'],
  'Browser Wasm Preview': [true, 'browser (WebAssembly) preview'],
  '3D view available in V5': ['3D', 'QLC+ 5 and later'],
  '3D (build your own)': ['3D', 'build your own'],
  'Limited 1D': ['1D', 'limited'],
};

interface Other {
  tags?: string[];
  notes?: string;
  /** Typed fields the text really describes: dotted path -> value */
  move?: Record<string, unknown>;
}

const CHATAIGNE = [
  'OSC',
  'OSCQuery',
  'MIDI',
  'Serial',
  'TCP',
  'UDP',
  'HTTP',
  'MQTT',
  'GPIO',
  'Ableton Live',
  'Stream Deck',
];

// Every distinct inputs.other value on record
const INPUTS_OTHER: Record<string, Other> = {
  'OSC, OSCQuery': { tags: ['OSC', 'OSCQuery'] },
  'OSC, OSCQuery, MIDI': { tags: ['OSC', 'OSCQuery', 'MIDI'] },
  'OSC, OSCQuery, Midi, Serial, TCP, UDP, HTTP, MQTT, GPIO, AbletonLive, Stream Deck...': {
    tags: CHATAIGNE,
    notes: 'and more, through modules',
  },
  'MIDI, OSC, DMX': { tags: ['MIDI', 'OSC', 'DMX'] },
  'MIDI, OSC': { tags: ['MIDI', 'OSC'] },
  'OSC, Spout, NDI': { tags: ['OSC', 'Spout', 'NDI'] },
  'NDI, SDI, Midi': { tags: ['NDI', 'SDI', 'MIDI'] },
  'Pixelnet,Renard': { tags: ['Pixelnet', 'Renard'] },
  'MIDI, OSC, MQTT': { tags: ['MIDI', 'OSC', 'MQTT'] },
  'MIDI, OSC, CMD Line, DMX': { tags: ['MIDI', 'OSC', 'Command line', 'DMX'] },
  Audio: { move: { 'inputs.audio': 'Input' } },
  'GPIO pins': { tags: ['GPIO'] },
  'MIDI,OSC,Spout,Syphon, Ambilight': { tags: ['MIDI', 'OSC', 'Spout', 'Syphon', 'Ambilight'] },
  'viewer controlled stream responsive control': {
    notes: 'Viewer-controlled, stream-responsive control',
  },
  Any: { notes: 'Any' },
  'MIDI,OSC,Spout,Syphon,NDI': { tags: ['MIDI', 'OSC', 'Spout', 'Syphon', 'NDI'] },
  'MIDI, HTTP, MA-net, CITP, SMPTE, Spout, GamePort': {
    tags: ['MIDI', 'HTTP', 'MA-Net', 'CITP', 'SMPTE', 'Spout', 'Game Port'],
  },
  'Native support for PixelPusher devices': { move: { 'outputs.other': ['PixelPusher'] } },
  'Websockets, ADC': { tags: ['WebSocket'], move: { 'inputs.adc': true } },
  'OSC, NDI, Syphon, UDP': { tags: ['OSC', 'NDI', 'Syphon', 'UDP'] },
  'OSC, MIDI, Web API': { tags: ['OSC', 'MIDI', 'Web API'] },
  'MIDI, OSC, Spout, Syphon': { tags: ['MIDI', 'OSC', 'Spout', 'Syphon'] },
  'MIDI, OSC, UDP, SMPTE, Spout, Game Port': {
    tags: ['MIDI', 'OSC', 'UDP', 'SMPTE', 'Spout', 'Game Port'],
  },
  'MIDI, OSC, MQTT, NDI, Syphon/Spout, TCP, UDP, Ableton, SMPTE/LTC': {
    tags: ['MIDI', 'OSC', 'MQTT', 'NDI', 'Syphon', 'Spout', 'TCP', 'UDP', 'Ableton Live', 'SMPTE'],
  },
  'UDP Sync': { tags: ['WLED UDP Sync'] },
  'Audacity plug-in,MIDI,video files': { tags: ['Audacity plug-in', 'MIDI', 'Video files'] },
};

// Every distinct outputs.other value on record
const OUTPUTS_OTHER: Record<string, Other> = {
  'glediator files, pixel data': { tags: ['Glediator files', 'Pixel data'] },
  Klingnet: { tags: ['Kling-Net'] },
  'NRF52840 target board Adafruit or Ebyte board': {
    notes: 'nRF52840 target board (Adafruit or Ebyte)',
  },
  'OSC, OSCQuery': { tags: ['OSC', 'OSCQuery'] },
  'OSC, OSCQuery, MIDI': { tags: ['OSC', 'OSCQuery', 'MIDI'] },
  'OSC, OSCQuery, Midi, Serial, TCP, UDP, HTTP, MQTT, GPIO, AbletonLive, Stream Deck...': {
    tags: CHATAIGNE,
    notes: 'and more, through modules',
  },
  'NDI, DVI': { tags: ['NDI', 'DVI'] },
  'Pixelnet, Renard, UDP, HTTP, MQTT': { tags: ['Pixelnet', 'Renard', 'UDP', 'HTTP', 'MQTT'] },
  MIDI: { tags: ['MIDI'] },
  'Proprietary compressed LSS protocol for LSS controllers': {
    notes: 'Proprietary compressed LSS protocol for LSS controllers',
  },
  'T/K 1000 Player': { notes: 'T-1000 and K-1000 players' },
  UDP: { tags: ['UDP'] },
  'Bluetooth/NFC to RocketLife hardware': {
    tags: ['Bluetooth', 'NFC'],
    notes: 'to Rocketlife hardware',
  },
  'Tuya, Govee,Hue, Nano, etc home automation and ArtNet': {
    tags: ['Tuya', 'Govee', 'Philips Hue', 'Nanoleaf'],
    notes: 'and other home-automation lights',
  },
  'DDP, OPC, Fadecandy': {
    tags: ['Fadecandy'],
    move: { 'outputs.protocols.ddp': 'Output', 'outputs.protocols.opc': 'Output' },
  },
  'MIDI, OSC, EtherDream, Arduino': { tags: ['MIDI', 'OSC', 'Ether Dream', 'Arduino'] },
  'DVI, Robe, Insta, Hue': { tags: ['DVI', 'Robe', 'Insta', 'Philips Hue'] },
  'Direct or expansion board 8-64 channels': {
    notes: 'Pixels directly, or 8-64 channels through an expansion board',
  },
  'ProtoPixel proprietary protocol, OSC, UDP': { tags: ['ProtoPixel protocol', 'OSC', 'UDP'] },
  'USB, OSC': { tags: ['USB', 'OSC'] },
  'OSC, MIDI, UDP, Spout, NDI': { tags: ['OSC', 'MIDI', 'UDP', 'Spout', 'NDI'] },
  'MIDI, OSC, MQTT, NDI, Syphon/Spout, TCP, UDP, Ableton': {
    tags: ['MIDI', 'OSC', 'MQTT', 'NDI', 'Syphon', 'Spout', 'TCP', 'UDP', 'Ableton Live'],
  },
  Renard: { tags: ['Renard'] },
  'ws281x protocol, APA102, etc.': { notes: 'Pixels directly: WS281x, APA102 and others' },
  'LOR, DDP': { tags: ['LOR'], move: { 'outputs.protocols.ddp': 'Output' } },
};

function comment(doc: Document, path: (string | number)[], text: string) {
  const n = doc.getIn(path, true);
  if (isScalar(n)) n.comment = ' ' + text;
}

/** A language string -> one language or a list. Returns true if changed. */
export function language(doc: Document): boolean {
  const lang = getJS(doc, ['language']);
  if (lang === null) return remove(doc, ['language']);
  if (typeof lang !== 'string') return false;
  if (lang === 'JS subset') {
    setJS(doc, ['language'], 'JavaScript');
    comment(doc, ['language'], 'a subset');
    return true;
  }
  const parts = lang.split(/\s*[,/]\s*/).filter(Boolean);
  if (parts.length < 2) return false;
  setJS(doc, ['language'], parts);
  return true;
}

const pd = migrateCategory('pattern-drivers', (doc, { id }) => {
  let touched = false;
  const fail = (what: string, v: unknown) => {
    throw new Error(`pattern-drivers/${id}: ${what} ${JSON.stringify(v)}`);
  };
  for (const p of IO_PATHS) {
    const v = getJS(doc, p);
    if (v === undefined || DIRECTIONS.has(v as string | false)) continue;
    // programmatic: true = user code, direction not recorded
    if (p[1] === 'programmatic' && v === true) continue;
    fail(p.join('.'), v);
  }

  for (const [section, table] of [
    ['inputs', INPUTS_OTHER],
    ['outputs', OUTPUTS_OTHER],
  ] as const) {
    const v = getJS(doc, [section, 'other']);
    if (typeof v !== 'string') continue;
    const m = table[v];
    if (!m) fail(`${section}.other`, v);
    remove(doc, [section, 'other']);
    for (const [path, value] of Object.entries(m.move ?? {})) {
      const p = path.split('.');
      const old = getJS(doc, p);
      // Never overwrite a researched value with the sheet's free text
      if (old === undefined || old === null) setJS(doc, p, value);
    }
    if (m.tags) setJS(doc, [section, 'other'], m.tags);
    if (m.notes) setJS(doc, [section, 'other_notes'], m.notes);
    touched = true;
  }

  const vis = getJS(doc, ['capabilities', 'visualizer']);
  if (typeof vis === 'string' && !['1D', '2D', '3D'].includes(vis)) {
    const m = VISUALIZER[vis];
    if (!m) fail('visualizer', vis);
    setJS(doc, ['capabilities', 'visualizer'], m[0]);
    if (m[1]) setJS(doc, ['capabilities', 'visualizer_notes'], m[1]);
    touched = true;
  }

  if (language(doc)) touched = true;

  touched =
    orderKeys(doc, ['inputs'], ['video', 'audio', 'adc', 'other', 'other_notes']) || touched;
  touched =
    orderKeys(
      doc,
      ['outputs'],
      ['protocols', 'dmx_notes', 'gpio', 'serial', 'serial_notes', 'other', 'other_notes']
    ) || touched;
  touched =
    orderKeys(
      doc,
      ['outputs', 'protocols'],
      ['artnet', 'sacn', 'dmx', 'kinet', 'ddp', 'opc', 'spi']
    ) || touched;
  touched =
    orderKeys(
      doc,
      ['capabilities'],
      ['live', 'designer', 'visualizer', 'visualizer_notes', 'programmatic']
    ) || touched;
  return touched;
});
// Drive libraries: protocol names as in common.json control_protocol, and
// the free-text hardware summary spelled consistently
const LIB_PROTOCOLS: Record<string, [string, string?]> = {
  'Open Pixel Control': ['OPC'],
  'DMX512-A': ['DMX512', 'DMX512-A (ANSI E1.11)'],
};
const LIB_HARDWARE: Record<string, string> = {
  'Arduino Nano &Ethernet Shield': 'Arduino Nano + Ethernet shield',
  'NodeMcu / ESP8266/32 + SD card': 'NodeMCU / ESP8266 / ESP32 + SD card',
  'Arduino/Teensie/ESP8266': 'Arduino / Teensy / ESP8266',
  'ESP8266/32': 'ESP8266 / ESP32',
  'Arduino/ Esp 66/32': 'Arduino / ESP8266 / ESP32',
  'Arduino/ ESP32': 'Arduino / ESP32',
  'Teensy4.0': 'Teensy 4.0',
  'Arduino/Esp66/32/ RasPi/MicroBit/Teensy':
    'Arduino / ESP8266 / ESP32 / Raspberry Pi / micro:bit / Teensy',
  'Arduino/ ESP 66/32': 'Arduino / ESP8266 / ESP32',
};

const dl = migrateCategory('drive-libraries', (doc) => {
  let touched = language(doc);
  const protocols = getJS(doc, ['protocols']);
  if (Array.isArray(protocols)) {
    protocols.forEach((p, i) => {
      const m = LIB_PROTOCOLS[String(p)];
      if (!m) return;
      setJS(doc, ['protocols', i], m[0]);
      if (m[1]) comment(doc, ['protocols', i], m[1]);
      touched = true;
    });
  }
  const hardware = getJS(doc, ['hardware']);
  if (typeof hardware === 'string' && hardware in LIB_HARDWARE) {
    setJS(doc, ['hardware'], LIB_HARDWARE[hardware]);
    touched = true;
  }
  return touched;
});
console.log(`pattern-drivers: ${pd.length}, drive-libraries: ${dl.length} entries migrated`);
