import { Link } from 'react-router';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { RainbowText } from '~/components/ui/RainbowText';
import { SingleWireBits } from '~/components/protocols/SingleWireBits';
import { SingleWireChain } from '~/components/protocols/SingleWireChain';
import { ClockedBits } from '~/components/protocols/ClockedBits';
import { TimingHiccup } from '~/components/protocols/TimingHiccup';
import { BackupLine } from '~/components/protocols/BackupLine';
import { DmxPacket } from '~/components/protocols/DmxPacket';
import { pageMeta } from '~/lib/meta';
import type { Route } from './+types/protocols';

export function meta(_args: Route.MetaArgs) {
  return pageMeta({
    title: 'Pixel Protocols',
    description:
      'What addressable LEDs actually receive on the wire: single-wire pulse timing, clocked two-wire data, backup data lines and DMX512, with animations, and which part names are the same signal.',
    path: '/protocols',
  });
}

// PROVISIONAL: replaced by sourced values from ~/lib/protocols/reference
// before this page ships (plans/pixel-protocols.md, step 3)
const DRAFT = {
  timing: { t0h: 400, t1h: 800, period: 1250 },
  windows: { part: 'WS2812B', t0hMax: 550, t1hMin: 650 },
  resetUs: 280,
};

const SECTIONS = [
  { id: 'single-wire', label: 'Single wire' },
  { id: 'clocked', label: 'Clock + data' },
  { id: 'backup', label: 'Backup data line' },
  { id: 'dmx512', label: 'DMX512' },
  { id: 'sacn', label: 'sACN and Art-Net' },
];

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
            when two parts with different names are the same thing and when they really are not.
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
              Most pixels have one data input. There is no clock line, so the timing is in the
              signal itself: every bit starts with the line going high, and how long it stays high
              says whether the bit is a 0 or a 1.
            </p>
          </div>
          <SingleWireBits
            timing={DRAFT.timing}
            order="GRB"
            orderPart="WS2812B"
            windows={DRAFT.windows}
          />
          <h3>Down the chain</h3>
          <div className="proto-prose">
            <p>
              Pixels are wired in a chain, each one&rsquo;s data output to the next one&rsquo;s
              input. The controller never addresses a pixel: it just sends one frame per pixel, in
              order, and the chain sorts them out.
            </p>
          </div>
          <SingleWireChain
            bitsPerPixel={24}
            bitNs={DRAFT.timing.period}
            resetUs={DRAFT.resetUs}
            resetPart="WS2812B"
          />
        </section>

        <section id="clocked" className="proto-section" aria-labelledby="clocked-title">
          <span className="proto-kicker">Two wires</span>
          <h2 id="clocked-title">Clock and data (APA102-style)</h2>
          <div className="proto-prose">
            <p>Coming next.</p>
          </div>
          <ClockedBits order="BGR" part="APA102" />
          <TimingHiccup
            timing={DRAFT.timing}
            stallNs={1000}
            t0hMax={DRAFT.windows.t0hMax}
            part="WS2812B"
          />
        </section>

        <section id="backup" className="proto-section" aria-labelledby="backup-title">
          <h2 id="backup-title">Backup data line</h2>
          <BackupLine part="WS2813" skipOnBackup />
        </section>

        <section id="dmx512" className="proto-section" aria-labelledby="dmx512-title">
          <h2 id="dmx512-title">DMX512</h2>
          <DmxPacket
            timing={{ bitUs: 4, breakMinUs: 92, mabMinUs: 12, slots: 512 }}
            part="UCS512"
          />
        </section>

        <section id="sacn" className="proto-section" aria-labelledby="sacn-title">
          <h2 id="sacn-title">sACN and Art-Net</h2>
          <div className="proto-prose">
            <p>
              See the <Link to="/system-overview">system overview</Link> for where these fit.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
