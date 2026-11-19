/**
 * Starter designs offered on an empty designer. Each is just a link — the
 * same query string a shared design has — so they double as living examples
 * of the URL format. A unit test checks every id still exists in the
 * database, so a renamed entry can't silently break them.
 */

export interface ExampleDesign {
  title: string;
  blurb: string;
  query: string;
}

export const EXAMPLES: ExampleDesign[] = [
  {
    title: 'Desk strip',
    blurb: '150 WS2812 pixels on an ESP32 dev board running WLED, with a level shifter.',
    query: 'p=ws2812&x=1&n=150&c=mb-esp-32s&l=sn74ahct125n&g=wled&t=Desk+strip',
  },
  {
    title: 'House outline',
    blurb: 'Sixteen runs of 12 V WS2811 nodes on a Falcon F16V5, sequenced in xLights at 30%.',
    query: 'p=ic-ws2811&x=16&n=400&c=falcon-f16v5&k=pigtails&g=xlights&b=30&o=1&t=House+outline',
  },
  {
    title: 'Mixed voltages',
    blurb: 'A 5 V APA102 matrix and a 12 V WS2815 roof line, each on its own supply rail.',
    query:
      'p=apa102&x=8&n=144&c=falcon-f16v5&gn=Matrix&p=ws2815&x=4&n=300&c=falcon-f16v5&gn=Roof+line&g=xlights&t=Mixed+voltages',
  },
];
