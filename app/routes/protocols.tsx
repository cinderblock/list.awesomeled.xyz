import { Link } from 'react-router';
import { BackupLine } from '~/components/protocols/BackupLine';
import { ClockedBits } from '~/components/protocols/ClockedBits';
import { ClockedChain } from '~/components/protocols/ClockedChain';
import { DmxPacket } from '~/components/protocols/DmxPacket';
import { ProtocolTable, SameChecker } from '~/components/protocols/ProtocolTable';
import { SingleWireBits } from '~/components/protocols/SingleWireBits';
import { SingleWireChain } from '~/components/protocols/SingleWireChain';
import { Cite, SourcesList } from '~/components/protocols/Sources';
import { SpeedCompare } from '~/components/protocols/SpeedCompare';
import { TimingHiccup } from '~/components/protocols/TimingHiccup';
import { TimingWindows } from '~/components/protocols/TimingWindows';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { RainbowText } from '~/components/ui/RainbowText';
import { pageMeta } from '~/lib/meta';
import { DMX512, WS2811_V15, WS2812B_EARLY, WS2813B_V6 } from '~/lib/protocols/reference';
import type { Route } from './+types/protocols';

export function meta(_args: Route.MetaArgs) {
  return pageMeta({
    title: 'Pixel Protocols',
    description:
      'What addressable LEDs actually receive on the wire: single-wire pulse timing, clocked two-wire data, backup data lines and DMX512, animated, with which part names are the same signal.',
    path: '/protocols',
  });
}

const SECTIONS = [
  { id: 'single-wire', label: 'Single wire' },
  { id: 'clocked', label: 'Clock + data' },
  { id: 'backup', label: 'Backup data line' },
  { id: 'dmx512', label: 'DMX512' },
  { id: 'sacn', label: 'sACN and Art-Net' },
  { id: 'who', label: 'Who speaks what' },
  { id: 'sources', label: 'Sources' },
];

/** The early WS2812B sheet's typical bit, which the figures draw */
const TYPICAL_BIT = {
  t0h: (WS2812B_EARLY.t0h.min + WS2812B_EARLY.t0h.max) / 2,
  t1h: (WS2812B_EARLY.t1h.min + WS2812B_EARLY.t1h.max) / 2,
  period: 1250,
};

export default function Protocols() {
  return (
    <div className="protocols-page">
      <div className="container page-section">
        <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Pixel protocols' }]} />
        <header className="page-header proto-prose">
          <h1 className="page-title">
            <RainbowText>Pixel protocols</RainbowText>
          </h1>
          <p className="proto-lead">
            Hundreds of pixel part numbers share a handful of wire signals. Here is what each signal
            actually does&mdash;and which parts are identical on the wire.
          </p>
          <nav aria-label="On this page">
            <ul className="proto-toc">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <div className="proto-table-wrap">
          <table className="proto-table">
            <thead>
              <tr>
                <th scope="col">Signal</th>
                <th scope="col">Wires</th>
                <th scope="col">Bit rate</th>
                <th scope="col">1,000 RGB px (1 line)</th>
                <th scope="col">Addressing</th>
                <th scope="col">Stall-tolerant?</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  <a href="#single-wire">Single wire</a>
                </th>
                <td>1 data (+ optional backup)</td>
                <td>800 kbit/s typical (some dual-speed: 400k, 1.6M)</td>
                <td className="num">~33 fps (30.3 ms)</td>
                <td>Chain: keep first, pass rest</td>
                <td>No</td>
              </tr>
              <tr>
                <th scope="row">
                  <a href="#clocked">Clock + data</a>
                </th>
                <td>2 (clock + data)</td>
                <td>Variable: 4&ndash;16 MHz typical (rated 15&ndash;40 MHz)</td>
                <td className="num">~246 fps at 8 MHz (4.1 ms)</td>
                <td>Chain: eat frame, emit zeros</td>
                <td>Yes</td>
              </tr>
              <tr>
                <th scope="row">
                  <a href="#dmx512">DMX512</a>
                </th>
                <td>RS-485 pair (D+, D&minus;)</td>
                <td>Fixed 250 kbit/s</td>
                <td className="num">170 px/universe (44 fps)</td>
                <td>Shared bus: stored address</td>
                <td>No</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section id="single-wire" className="proto-section" aria-labelledby="single-wire-title">
          <span className="proto-kicker">One data wire</span>
          <h2 id="single-wire-title">Single wire: timed pulses</h2>
          <div className="proto-prose">
            <p>
              With no clock wire, bit timing lives inside every pulse: the line goes high, and a
              short pulse is a 0 (~0.4 µs) while a long pulse is a 1 (~0.8 µs), at 1.25 µs per bit
              (800 kbit/s).
              <Cite source="ws2812b-adafruit" /> Each RGB pixel takes 24 bits MSB first; channel
              order (GRB on WS2812B vs RGB on WS2811) is a controller setting, not a different
              protocol.
              <Cite source={['ws2813b-v6', 'ws2811-v15']} />
            </p>
          </div>
          <SingleWireBits
            timing={TYPICAL_BIT}
            order="GRB"
            orderPart="WS2812B"
            windows={{
              part: 'early WS2812B',
              t0hMax: WS2812B_EARLY.t0h.max,
              t1hMin: WS2812B_EARLY.t1h.min,
            }}
          />

          <h3>Down the chain &amp; reset latch</h3>
          <div className="proto-prose">
            <p>
              Pixels have no addresses. Pixel 1 keeps the first 24 bits, then reshapes and forwards
              the rest to Pixel 2, so the thousandth pixel still sees a clean signal.
              <Cite source="ws2812b-adafruit" /> Holding the line low ends the update and latches
              every pixel at once: older sheets ask for 50 µs, newer WorldSemi sheets for &gt;280 µs
              so brief controller interrupts don&rsquo;t cut a frame short.
              <Cite source={['ws2812b-adafruit', 'ws2813b-v6']} /> Waiting the longest reset time
              drives both.
            </p>
          </div>
          <SingleWireChain
            bitsPerPixel={24}
            bitNs={TYPICAL_BIT.period}
            resetUs={WS2813B_V6.resetMin / 1000}
            resetPart="WS2813B / current WS2811"
          />
          <div className="proto-prose">
            <p>
              <strong>Speed modes:</strong> Most single-wire pixels run at 800 kbit/s, though some
              support two speeds: early WS2811 and TM1804 use a <code>SET</code> pin to halve the
              rate to 400 kbit/s
              <Cite source={['ws2811-adafruit', 'tm1804-v2.3']} />, UCS1904/2904B auto-detect 400 or
              800 kbit/s
              <Cite source="ucs1904-cn" />, and newer chips like the UCS7604 add an optional{' '}
              <strong>1.6 Mbit/s</strong> mode.
              <Cite source="ucs7604-ver1.1" />
            </p>
          </div>

          <h3>One signal, many datasheets</h3>
          <div className="proto-prose">
            <p>
              Datasheet windows disagree&mdash;even WorldSemi&rsquo;s own revisions stop a 0 at{' '}
              {WS2812B_EARLY.t0h.max} ns in one sheet and {WS2811_V15.t0h.max} ns in another, and no
              single 1-pulse fits every table below.
              <Cite source={['ws2812b-adafruit', 'ws2811-v15', 'ws2813b-v6']} /> Real chips
              don&rsquo;t check windows; they sample the high pulse at one threshold (~550&ndash;690
              ns), which is why FastLED, NeoPixelBus, and FPP drive all of them with one timing.
              <Cite
                source={[
                  'ucs1904-cn',
                  'cpldcpu-ws2812',
                  'josh-neopixels',
                  'fastled',
                  'neopixelbus',
                  'fpp',
                ]}
              />
            </p>
          </div>
          <TimingWindows />
          <details className="proto-dig">
            <summary>Dig deeper: APA106&rsquo;s long 1, clones, and mid-frame pauses</summary>
            <div className="proto-prose">
              <p>
                <strong>APA106 vs clones:</strong> The APA106 datasheet prints a 1.36 µs 1-pulse in
                a ~1.7 µs bit
                <Cite source="apa106-sparkfun" />, and NeoPixelBus sends exactly that.
                <Cite source="neopixelbus" /> Yet Tim (cpldcpu) measured BaiCheng&rsquo;s PD9823
                clone and found its state machine decides identically to a WS2812B.
                <Cite source="cpldcpu-pd9823" /> A printed window only proves what the maker tested.
              </p>
              <p>
                <strong>Low time &amp; pauses:</strong> The low phase only ends the bit&mdash;until
                it lasts long enough to latch. A 2014 WS2812B latched after ~9 µs of low
                <Cite source="cpldcpu-ws2812" /> and UCS warns never to pause over 8 µs mid-frame
                <Cite source="ucs1904-cn" />. Newer WorldSemi parts wait &gt;280 µs, which tolerates
                longer pauses but flickers if a controller only sends the old 50 µs reset.
                <Cite source={['ws2813b-v6', 'josh-neopixels']} />
              </p>
            </div>
          </details>
        </section>

        <section id="clocked" className="proto-section" aria-labelledby="clocked-title">
          <span className="proto-kicker">Two wires (SPI-style)</span>
          <h2 id="clocked-title">Clock and data (APA102-style)</h2>
          <div className="proto-prose">
            <p>
              Adding a clock wire drops pulse-width timing completely: each pixel samples{' '}
              <code>DATA</code> on every rising <code>CLK</code> edge.
              <Cite source="apa102c-adafruit" />
            </p>
          </div>
          <ClockedBits order="BGR" part="APA102" />

          <h3>How each pixel knows its frame (and APA102 vs SK9822)</h3>
          <div className="proto-prose">
            <p>
              APA102-style strips still have no pixel addresses. Every chip runs a tiny 3-step loop
              on rising clock edges:
              <Cite source={['apa102c-adafruit', 'cpldcpu-apa102']} />
            </p>
            <ol className="proto-steps">
              <li>
                <strong>Arm on 32 zeros:</strong> Seeing a 32-bit Start Frame (all <code>0</code>s)
                arms the pixel to wait for the next <code>1</code> bit.
              </li>
              <li>
                <strong>Eat 32 bits, output 32 zeros:</strong> On that first <code>1</code> (the{' '}
                <code>111</code> header + 5-bit brightness + B, G, R), the pixel clocks 32 bits into
                itself while driving <code>0</code> onto <code>DOUT</code>&mdash;creating a fresh
                Start Frame for the next pixel.
              </li>
              <li>
                <strong>Pass-through + end clocks:</strong> Everything after its 32 bits forwards
                straight down the chain, delayed half a clock per pixel, so the controller appends
                at least <code>n/2</code> extra clock edges to flush the last pixel (32 bits only
                cover 64 pixels).
              </li>
            </ol>
            <p>
              <strong>Immediate vs latched updates:</strong> Genuine APA102s update each LED the
              moment its 32 bits arrive (a slight cascade down long strips). SK9822s look identical
              on paper but double-buffer, updating only after the <em>next</em> 32-zero start
              frame&mdash;so a standard APA102 end frame leaves them one update behind.
              <Cite source="cpldcpu-sk9822" /> One stream drives both cleanly: Start Frame, LED
              frames, a 32-zero reset frame, then at least <code>n/2</code> zero end clocks.
              <Cite source="cpldcpu-sk9822" />
            </p>
          </div>
          <ClockedChain />

          <h3>Way faster than single wire</h3>
          <div className="proto-prose">
            <p>
              With no fixed 800 kbit/s bit cell and no 280 µs quiet reset, clocked strips run as
              fast as the chips and wiring allow&mdash;commonly <strong>4&ndash;16 MHz</strong> in
              real rigs, delivering 5&ndash;15&times; the frame rate of WS2812B for high-FPS POV,
              camera-friendly runs, or longer strings per port.
            </p>
          </div>
          <SpeedCompare />
          <div className="proto-prose">
            <p>
              <strong>The real-world ceiling:</strong> Datasheets advertise 30&ndash;40 MHz
              <Cite source={['apa102c-2018', 'sk9822-opsco']} />, even while their own{' '}
              <code>TCLKH/TCLKL &gt; 30 ns</code> specs cap at 16.7 MHz and APA recommends &le;5 MHz
              for typical runs.
              <Cite source="apa102c-2018" /> On long strips, cascading clock distortion hits first:{' '}
              <a
                href="https://www.pjrc.com/why-apa102-leds-have-trouble-at-24-mhz/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Paul Stoffregen&rsquo;s (PJRC) oscilloscope tests
              </a>{' '}
              showed each APA102 slightly shrinks the clock-low pulse it passes on, leaving only ~3
              ns of margin after 144 LEDs at 24 MHz.
              <Cite source="pjrc-24mhz" />
            </p>
          </div>

          <h3>Stall-tolerant, too</h3>
          <div className="proto-prose">
            <p>
              Because the receiver only checks data on rising clock edges, a slow or interrupted
              controller can pause mid-byte without corrupting anything.
            </p>
          </div>
          <TimingHiccup
            timing={TYPICAL_BIT}
            stallNs={1000}
            t0hMax={WS2812B_EARLY.t0h.max}
            part="early WS2812B"
          />

          <div className="proto-prose">
            <h3>Same wires, different protocol</h3>
            <p>
              Two wires don&rsquo;t guarantee APA102 compatibility. 16-bit parts like the SK9826,
              NS108, and HD108 need a &ge;128-zero start frame, 64 bits per pixel (1 start bit,
              three 5-bit current gains, three 16-bit colours), and extra end clocks.
              <Cite source={['sk9826-opsco', 'ns108-newstar', 'hd108-rose']} />
            </p>
          </div>
        </section>

        <section id="backup" className="proto-section" aria-labelledby="backup-title">
          <span className="proto-kicker">Single wire, two inputs</span>
          <h2 id="backup-title">Backup data line</h2>
          <div className="proto-prose">
            <p>
              In a plain single-wire chain, one dead pixel blacks out everything downstream. Parts
              with a backup input (WS2813, WS2815, GS8208) wire each pixel&rsquo;s <code>BI</code>{' '}
              pin one pixel further back: if its neighbour dies, it switches to <code>BI</code> and
              skips the dead pixel&rsquo;s 24 bits.
              <Cite source="ws2813b-v6" /> Two dead pixels in a row still break the chain. On the
              wire nothing changes&mdash;send the same WS2812B stream and tie pixel 1&rsquo;s{' '}
              <code>BI</code> to ground.
              <Cite source="ws2813b-v6" />
            </p>
          </div>
          <BackupLine part="WS2813" skipOnBackup />
        </section>

        <section id="dmx512" className="proto-section" aria-labelledby="dmx512-title">
          <span className="proto-kicker">The lighting industry&rsquo;s signal</span>
          <h2 id="dmx512-title">DMX512</h2>
          <div className="proto-prose">
            <p>
              DMX512 (ANSI E1.11) is {DMX512.bitRateKbps.typ} kbit/s asynchronous serial over RS-485
              ({DMX512.bitUs} µs/bit): a BREAK (&ge;{DMX512.breakTxMinUs} µs low), MARK AFTER BREAK
              (&ge;{DMX512.mabTxMinUs} µs high), a start code, and up to {DMX512.slots} byte slots.
              <Cite source="e1.11-2024" /> A full packet takes {DMX512.updateMs513} ms (max{' '}
              {DMX512.refreshMax} fps), holding 170 RGB or 128 RGBW pixels per universe.
              <Cite source={['e1.11-2024', 'enttec-universe']} />
            </p>
          </div>
          <DmxPacket part="WS2821" />
          <div className="proto-prose">
            <h3>DMX pixels</h3>
            <p>
              DMX pixel ICs sit in parallel on one bus rather than relaying down a chain. Each chip
              holds a stored start address (written once over a separate address line on parts like
              the WS2821) and grabs its own slots as they pass, so a dead pixel never takes out the
              rest.
              <Cite source="ws2821-acdc" />
            </p>
          </div>
        </section>

        <section id="sacn" className="proto-section" aria-labelledby="sacn-title">
          <span className="proto-kicker">Over a network</span>
          <h2 id="sacn-title">sACN and Art-Net</h2>
          <div className="proto-prose">
            <p>
              sACN (ANSI E1.31, universes 1&ndash;63999)
              <Cite source="e1.31-2018" /> and Art-Net
              <Cite source="artnet4" /> transport DMX512 universes over IP networks. Neither reaches
              a pixel directly: an Ethernet pixel controller receives those universes and outputs
              single-wire or clocked pixel signals. See the{' '}
              <Link to="/system-overview">system overview</Link> for how the pieces fit together, or
              check controller compatibility in the <Link to="/designer">designer</Link>.
            </p>
          </div>
        </section>

        <section id="who" className="proto-section" aria-labelledby="who-title">
          <span className="proto-kicker">Same thing, different names</span>
          <h2 id="who-title">Who speaks what</h2>
          <div className="proto-prose">
            <p>
              Every pixel and pixel IC in this database, grouped by wire signal. Parts in one
              protocol are interchangeable once channel order and reset time are set; every
              datasheet quote lives in the{' '}
              <a href="https://github.com/cinderblock/list.awesomeled.xyz/tree/master/plans/pixel-protocols">
                research notes
              </a>
              .
            </p>
          </div>
          <SameChecker />
          <ProtocolTable />
        </section>

        <section id="sources" className="proto-section" aria-labelledby="sources-title">
          <h2 id="sources-title">Sources</h2>
          <div className="proto-prose">
            <p>
              Every number on this page comes from these documents, with verbatim quotes behind each
              tap.
            </p>
            <SourcesList />
          </div>
        </section>
      </div>
    </div>
  );
}
