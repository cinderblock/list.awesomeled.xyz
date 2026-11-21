import { Link } from 'react-router';
import { BackupLine } from '~/components/protocols/BackupLine';
import { ClockedBits } from '~/components/protocols/ClockedBits';
import { ClockedChain } from '~/components/protocols/ClockedChain';
import { DmxPacket } from '~/components/protocols/DmxPacket';
import { SingleWireBits } from '~/components/protocols/SingleWireBits';
import { SingleWireChain } from '~/components/protocols/SingleWireChain';
import { Cite, SourcesList } from '~/components/protocols/Sources';
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
            Addressable LEDs are sold under hundreds of part numbers, but the wire only carries a
            handful of signals. This page shows what those signals do, bit by bit, so you can tell
            when two parts with different names are the same thing, and when they really are not.
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

        <section id="single-wire" className="proto-section" aria-labelledby="single-wire-title">
          <span className="proto-kicker">One data wire</span>
          <h2 id="single-wire-title">Single wire: timed pulses</h2>
          <div className="proto-prose">
            <p>
              Most pixels have one data input and no clock, so the timing has to be in the signal
              itself. Every bit starts with the line going high; how long it stays high says which
              bit it is. In the WS2812B&rsquo;s datasheet a 0 is high for 0.4 µs and a 1 for 0.8 µs,
              each ±150 ns, and a whole bit takes 1.25 µs: 800,000 bits a second.
              <Cite source="ws2812b-adafruit" /> The low part of the bit fills the rest.
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
          <div className="proto-prose">
            <p>
              Each pixel takes 24 bits: one byte per colour, most significant bit first. Which byte
              drives which colour is the part&rsquo;s business: the WS2812B wants green, red, blue
              <Cite source="ws2813b-v6" />, the WS2811 driver chip red, green, blue.
              <Cite source="ws2811-v15" /> That difference is a setting on every controller, not a
              different protocol.
            </p>
          </div>

          <h3>Down the chain</h3>
          <div className="proto-prose">
            <p>
              Pixels are wired in a chain, each one&rsquo;s data output to the next one&rsquo;s
              input. The controller never addresses a pixel: it sends one frame per pixel, in order,
              and the chain sorts them out. In WorldSemi&rsquo;s words, the first pixel collects the
              first 24 bits and the rest, reshaped, goes on to the next pixel, so &ldquo;after
              transmission for each pixel, the signal [is reduced by] 24bit.&rdquo;
              <Cite source="ws2812b-adafruit" /> Because every pixel rebuilds the signal it passes
              on, the thousandth pixel gets as clean a signal as the first.
            </p>
          </div>
          <SingleWireChain
            bitsPerPixel={24}
            bitNs={TYPICAL_BIT.period}
            resetUs={WS2813B_V6.resetMin / 1000}
            resetPart="WS2813B and current WS2811"
          />
          <div className="proto-prose">
            <p>
              The end of an update is just silence: the line stays low long enough that no bit could
              be in progress. The early WS2812B sheet asks for 50 µs.
              <Cite source="ws2812b-adafruit" /> WorldSemi&rsquo;s current sheets ask for more than
              280 µs, and say why: so that &ldquo;it won&rsquo;t cause wrong reset while
              interruption, supports the lower frequency and inexpensive MCU.&rdquo;
              <Cite source="ws2813b-v6" /> A controller that pauses mid-frame (an interrupt, a busy
              processor) for longer than the reset time ends the update early, and the pixels after
              that point show a partial frame. A transmitter that waits the longest reset any of its
              pixels needs drives all of them.
            </p>
            <p>
              Speed is a frame property too. WorldSemi&rsquo;s early WS2811 has a SET pin that
              halves the speed to 400,000 bits a second, with every time doubled;
              <Cite source="ws2811-adafruit" /> a pixel wired for 400 kHz does not read an 800 kHz
              signal, whatever its part number.
            </p>
          </div>

          <h3>One signal, many datasheets</h3>
          <div className="proto-prose">
            <p>
              Datasheets don&rsquo;t agree to the nanosecond, not even one maker&rsquo;s. The early
              WS2812B sheet lets a 0&rsquo;s high pulse run to {WS2812B_EARLY.t0h.max} ns; the
              current WS2811 and WS2813B sheets stop it at {WS2811_V15.t0h.max} ns.
              <Cite source={['ws2812b-adafruit', 'ws2811-v15', 'ws2813b-v6']} /> Put the windows of
              a dozen parts side by side and, taken literally, no single 1 fits them all:
            </p>
          </div>
          <TimingWindows />
          <div className="proto-prose">
            <p>
              Chips don&rsquo;t check windows, though. They time the high pulse and decide at one
              point. UCS prints its rule: a high under 0.55 µs is a 0, over 0.69 µs a 1, and the low
              part only ends the bit.
              <Cite source="ucs1904-cn" /> A WS2812B measured in 2014 read anything up to 563 ns as
              a 0 and anything from 625 ns as a 1; it samples the line at a fixed point after the
              rising edge, counted on its own internal clock.
              <Cite source="cpldcpu-ws2812" /> Josh Levine, after testing many pixels: &ldquo;The
              only tight timing parameter for NeoPixel signaling is the maximum width of a 0-bit
              pulse.&rdquo;
              <Cite source="josh-neopixels" /> That is why libraries drive all of these with one
              setting (FastLED sends a 0 as 250 ns and a 1 as 875 ns, NeoPixelBus 400 and 800, FPP
              312 and 729
              <Cite source={['fastled', 'neopixelbus', 'fpp']} />
              ), and it is the honest way to define this protocol: by where the chip decides, not by
              the windows a datasheet prints.
            </p>
            <p>
              Some datasheets do print a different signal. The APA106&rsquo;s asks for a 1 to stay
              high for 1.36 µs, in a bit of about 1.7 µs
              <Cite source="apa106-sparkfun" />, and NeoPixelBus sends it exactly that.
              <Cite source="neopixelbus" /> On paper that is not a WS2812B. Measured clones tell
              another story: BaiCheng&rsquo;s PD9823 controller turned out to decide exactly like a
              WS2812, and the verdict was &ldquo;Any software library that is able to drive the
              WS2812(B) is also able to drive the PD9823.&rdquo;
              <Cite source="cpldcpu-pd9823" /> A datasheet window records what its maker tested; on
              its own it doesn&rsquo;t prove a part is something else.
            </p>
            <p>
              The low part of a bit matters in one way only: held too long, it ends the frame. A
              2014 WS2812B latched after about 9 µs of low, so &ldquo;no more than 9 us of idle time
              may occur during data transfer&rdquo;
              <Cite source="cpldcpu-ws2812" />; UCS tells controllers never to pause more than 8 µs
              inside a frame.
              <Cite source="ucs1904-cn" /> Newer WorldSemi parts wait over 280 µs before latching,
              which is what makes them tolerant of an interrupted sender, and is also why a
              controller that sends them the old 50 µs reset makes them flicker.
              <Cite source={['ws2813b-v6', 'josh-neopixels']} />
            </p>
          </div>
        </section>

        <section id="clocked" className="proto-section" aria-labelledby="clocked-title">
          <span className="proto-kicker">Two wires</span>
          <h2 id="clocked-title">Clock and data (APA102-style)</h2>
          <div className="proto-prose">
            <p>
              Clocked pixels add a second wire. The controller drives a clock line, and the pixel
              reads the data line at each rising clock edge. A bit is no longer a pulse length: it
              is whatever the data line holds when the clock rises.
            </p>
          </div>
          <ClockedBits order="BGR" part="APA102" />
          <div className="proto-prose">
            <p>
              The APA102 frames everything in 32-bit words: a start frame of 32 zero bits, then one
              LED frame per pixel (three 1 bits, a 5-bit global brightness, then blue, green and red
              bytes, most significant bit first), then an end frame.
              <Cite source="apa102c-adafruit" /> Like a single-wire pixel, each one keeps one frame
              and passes the rest on. Tim of cpldcpu measured how: a pixel that has seen a start
              frame takes the next LED frame for itself, &ldquo;while zeroes are pushed to the
              output&rdquo;, then forwards everything after it.
              <Cite source="cpldcpu-apa102" /> Those zeros are a new start frame for the next pixel.
            </p>
          </div>
          <ClockedChain />
          <div className="proto-prose">
            <p>
              The datasheet draws the end frame as 32 one bits. It is really just clock edges: each
              pixel passes the data on half a clock late, but not the clock, so the controller has
              to keep clocking after the last frame, at least one edge for every two pixels.
              <Cite source="cpldcpu-apa102" /> Thirty-two bits cover 64 pixels; a longer string
              needs more.
            </p>
            <p>
              The SK9822 is sold as an APA102 replacement and reads the same bits, but it shows a
              new colour only after the <em>next</em> start frame; the APA102 shows each frame as
              soon as it arrives.
              <Cite source="cpldcpu-sk9822" /> Sent the APA102 datasheet&rsquo;s stream, a string of
              SK9822s runs one update behind. One stream drives both: start frame, LED frames, a
              &ldquo;reset frame&rdquo; of 32 zeros, then at least one zero bit for every two
              pixels.
              <Cite source="cpldcpu-sk9822" />
            </p>
            <p>
              Because the receiver only looks at the data when the clock rises, the sender can take
              as long as it likes between edges. That is why a clocked string survives a controller
              that stalls, and why the clock can run at any speed up to the part&rsquo;s maximum.
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
              Two wires don&rsquo;t make a part an APA102. The 16-bit SK9826 starts with at least
              128 zero bits, sends 64 bits per pixel (a start bit, three 5-bit current gains and
              three 16-bit values), and needs one extra clock per chip at the end.
              <Cite source="sk9826-opsco" /> An APA102 controller doesn&rsquo;t drive it, and
              neither does it drive the parts that print the same 64-bit frame, such as the NS108
              and HD108.
              <Cite source={['ns108-newstar', 'hd108-rose']} />
            </p>
          </div>
        </section>

        <section id="backup" className="proto-section" aria-labelledby="backup-title">
          <span className="proto-kicker">Single wire, two inputs</span>
          <h2 id="backup-title">Backup data line</h2>
          <div className="proto-prose">
            <p>
              In a single-wire chain every pixel relays the signal, so one dead pixel blacks out
              everything after it. Parts with a backup input, such as the WS2813, add a second data
              wire that reaches back one pixel. In WorldSemi&rsquo;s words: &ldquo;Under normal
              circumstances, the IC extracts signals from the DIN. When one IC among them is
              damaged, the latter IC extracts the signal from the BIN without affecting the signal
              transmission of the subsequent ics.&rdquo;
              <Cite source="ws2813b-v6" />
            </p>
          </div>
          <BackupLine part="WS2813" skipOnBackup />
          <div className="proto-prose">
            <p>
              The backup reaches back exactly one pixel, so it bridges one dead pixel at a time:
              WorldSemi promises that &ldquo;any single pixel failure won&rsquo;t affect the overall
              display effect.&rdquo;
              <Cite source="ws2813b-v6" /> Two dead pixels in a row still cut the chain. On the wire
              nothing changes: the controller sends the same frames as for a WS2812B, and the first
              pixel&rsquo;s backup input is tied to ground.
              <Cite source="ws2813b-v6" />
            </p>
          </div>
        </section>

        <section id="dmx512" className="proto-section" aria-labelledby="dmx512-title">
          <span className="proto-kicker">The lighting industry&rsquo;s signal</span>
          <h2 id="dmx512-title">DMX512</h2>
          <div className="proto-prose">
            <p>
              DMX512 (ANSI E1.11) is how lighting consoles talk to fixtures. It is plain
              asynchronous serial on a differential pair: {DMX512.bitRateKbps.typ},000 bits a
              second, so {DMX512.bitUs} µs a bit, one byte per slot. A packet starts with a BREAK
              (the line held low for at least {DMX512.breakTxMinUs} µs), a MARK AFTER BREAK (high
              for at least {DMX512.mabTxMinUs} µs), and a start code, followed by up to{' '}
              {DMX512.slots} slots.
              <Cite source="e1.11-2024" />
            </p>
          </div>
          <DmxPacket part="WS2821" />
          <div className="proto-prose">
            <p>
              The standard puts a full {DMX512.slots}-slot packet at {DMX512.updateMs513} ms, so a
              universe updates at most {DMX512.refreshMax} times a second.
              <Cite source="e1.11-2024" /> Lighting people count in slots (channels): an RGB pixel
              takes three, so one universe holds 170 RGB pixels, or 128 RGBW.
              <Cite source="enttec-universe" />
            </p>
            <h3>DMX pixels</h3>
            <p>
              Some pixel chips read DMX512 directly. They don&rsquo;t pass data down a chain: they
              all sit on the same data line, each with its own start address stored in the chip, and
              each takes its slots as they go by. A dead pixel doesn&rsquo;t affect the others. The
              WS2821, for example, &ldquo;adopts the parallel single wire control signal, owns the
              independent programmable address&rdquo;, and its addresses are written once over a
              separate address line, chained chip to chip.
              <Cite source="ws2821-acdc" />
            </p>
          </div>
        </section>

        <section id="sacn" className="proto-section" aria-labelledby="sacn-title">
          <span className="proto-kicker">Over a network</span>
          <h2 id="sacn-title">sACN and Art-Net</h2>
          <div className="proto-prose">
            <p>
              sACN (ANSI E1.31) carries DMX512 packets over an IP network, so one cable can carry
              thousands of universes, numbered 1 to 63999.
              <Cite source="e1.31-2018" /> Art-Net does the same job.
              <Cite source="artnet4" /> Neither reaches a pixel: an Ethernet pixel controller
              receives the universes and turns each pixel&rsquo;s slots into the pixel protocol on
              its outputs. The <Link to="/system-overview">system overview</Link> shows where each
              part sits, and the <Link to="/designer">designer</Link> checks that a controller
              speaks your pixels&rsquo; protocol.
            </p>
          </div>
        </section>

        <section id="sources" className="proto-section" aria-labelledby="sources-title">
          <h2 id="sources-title">Sources</h2>
          <div className="proto-prose">
            <p>
              Every number on this page comes from one of these documents. Datasheets are linked
              where their makers publish them; otherwise to the copy we read. Each entry lists the
              exact words this page relies on.
            </p>
            <SourcesList />
          </div>
        </section>
      </div>
    </div>
  );
}
