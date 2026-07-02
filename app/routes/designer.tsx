import type { Route } from './+types/designer';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangle, CheckCircle, HelpCircle, MonitorPlay, Plus, X, Zap } from 'lucide-react';
import { loadCategoryData } from '~/lib/data';
import {
  buildPixelOption,
  buildControllerOption,
  buildPatternSourceOption,
  checkCompat,
  checkSourceCompat,
  layoutTotal,
  systemPower,
  sharedOutputOverflow,
  PROTOCOL_LABELS,
  type Chain,
  type ControllerOption,
} from '~/lib/designer';
import { RainbowText } from '~/components/ui/RainbowText';
import { DesignDiagram } from '~/components/designer/DesignDiagram';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'System Designer - Awesome LED List' },
    {
      name: 'description',
      content:
        'Design an addressable LED system: mix pixel groups (types, voltages, string layouts), pair each with a compatible controller, pick a pattern source, and get power estimates and a printable diagram.',
    },
  ];
}

export async function loader() {
  const pixels = loadCategoryData('pixels')
    .map(buildPixelOption)
    .sort((a, b) => a.name.localeCompare(b.name));
  const controllers = loadCategoryData('controllers')
    .map(buildControllerOption)
    .sort((a, b) => (a.priceUSD ?? Infinity) - (b.priceUSD ?? Infinity));
  const sources = loadCategoryData('pattern-drivers')
    .map(buildPatternSourceOption)
    .filter((s) => s.outputProtocols.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { pixels, controllers, sources };
}

// [strings, pixels per string]
const LAYOUT_PRESETS: [number, number][] = [
  [1, 150],
  [4, 250],
  [8, 500],
  [16, 680],
];

interface RawChain {
  p: string;
  x: string;
  n: string;
  c: string;
}

function fmt(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export default function DesignerPage({ loaderData }: Route.ComponentProps) {
  const { pixels, controllers, sources } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [showIncompatible, setShowIncompatible] = useState(false);
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false);
  const [activeRaw, setActive] = useState(0);

  // One chain (pixel group) per repeated p/x/n/c param, aligned by position.
  // Single-chain URLs (?p=ws2812&n=500) parse the same way.
  const ps = searchParams.getAll('p');
  const raw: RawChain[] = Array.from({ length: Math.max(ps.length, 1) }, (_, i) => ({
    p: ps[i] ?? '',
    x: searchParams.getAll('x')[i] ?? '',
    n: searchParams.getAll('n')[i] ?? '',
    c: searchParams.getAll('c')[i] ?? '',
  }));
  const active = Math.min(activeRaw, raw.length - 1);

  const chains: Chain[] = raw.map((r) => ({
    pixel: pixels.find((p) => p.id === r.p) ?? null,
    layout: {
      strings: Math.max(1, parseInt(r.x, 10) || 1),
      perString: Math.max(1, parseInt(r.n, 10) || 150),
    },
    controller: controllers.find((c) => c.id === r.c) ?? null,
  }));
  const chain = chains[active];
  const sourceId = searchParams.get('g');
  const source =
    sourceId === 'standalone' ? null : (sources.find((s) => s.id === sourceId) ?? null);
  const standalone = sourceId === 'standalone';

  const write = (nextRaw: RawChain[], patch: { g?: string | null } = {}) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        for (const r of nextRaw) {
          next.append('p', r.p);
          next.append('x', r.x || '1');
          next.append('n', r.n || '150');
          next.append('c', r.c);
        }
        const g = 'g' in patch ? patch.g : prev.get('g');
        if (g) next.set('g', g);
        return next;
      },
      { replace: true, preventScrollReset: true }
    );
  };

  const updateActive = (patch: Partial<RawChain>) => {
    write(raw.map((r, i) => (i === active ? { ...r, ...patch } : r)));
  };

  const addChain = () => {
    write([...raw, { p: '', x: '1', n: '150', c: '' }]);
    setActive(raw.length);
  };

  const removeChain = (i: number) => {
    write(raw.filter((_, idx) => idx !== i));
    setActive(Math.max(0, active - (i <= active ? 1 : 0)));
  };

  const power = systemPower(chains);
  const overflow = sharedOutputOverflow(chains);
  const multi = chains.length > 1;

  // Compatibility of every controller with the ACTIVE chain
  const evaluated = !chain.pixel
    ? []
    : controllers
        .filter(
          (c) => includeDiscontinued || (c.status !== 'discontinued' && c.status !== 'end-of-life')
        )
        .map((c) => ({ controller: c, compat: checkCompat(c, chain.pixel!, chain.layout) }));
  const compatible = evaluated.filter((e) => e.compat.ok);
  const incompatible = evaluated.filter((e) => !e.compat.ok);

  // Per-chain problems for the summary
  const chainProblems = chains.flatMap((ch, i) => {
    if (!ch.pixel || !ch.controller) return [];
    const compat = checkCompat(ch.controller, ch.pixel, ch.layout);
    return compat.ok
      ? []
      : [`Group ${i + 1} (${ch.controller.name}): ${compat.reasons.join('; ')}`];
  });

  // Pattern sources must reach EVERY selected controller (deduped)
  const selectedControllers = [
    ...new Map(
      chains.flatMap((c) => (c.controller ? [[c.controller.id, c.controller] as const] : []))
    ).values(),
  ];
  const allStandalone =
    selectedControllers.length > 0 && selectedControllers.every((c) => c.standalone);
  const evaluatedSources = sources
    .filter((s) => s.status !== 'discontinued' && s.status !== 'end-of-life')
    .map((s) => {
      const compats = selectedControllers.map((c) => ({ c, compat: checkSourceCompat(s, c) }));
      const ok = compats.every((e) => e.compat.ok);
      const shared = [...new Set(compats.flatMap((e) => e.compat.shared))];
      const caveats = [...new Set(compats.flatMap((e) => e.compat.caveats))];
      return { source: s, ok, shared, caveats };
    })
    .filter((e) => selectedControllers.length === 0 || e.ok);

  return (
    <div className="container page-section designer-page">
      <div className="hero-section">
        <h1 className="hero-title">
          <RainbowText>System Designer</RainbowText>
        </h1>
        <p className="designer-intro">
          Mix pixel groups (different types, voltages, string lengths), pair each with a controller,
          and pick a pattern source. Power estimates come out per voltage rail, and your whole
          design lives in this page&apos;s URL.
        </p>
      </div>

      <div className="designer-layout">
        <div className="designer-config">
          {/* Pixel groups */}
          <section className="designer-step">
            <h2 className="designer-step-title">Pixel groups</h2>
            <ul className="designer-chain-list">
              {chains.map((ch, i) => (
                <li
                  key={i}
                  className={`designer-chain${i === active ? ' designer-chain--active' : ''}`}
                >
                  <button type="button" onClick={() => setActive(i)}>
                    <strong>Group {i + 1}:</strong>{' '}
                    {ch.pixel
                      ? `${ch.layout.strings} × ${ch.layout.perString.toLocaleString('en-US')} ${ch.pixel.name}`
                      : 'empty'}
                    {ch.controller ? ` → ${ch.controller.name}` : ''}
                  </button>
                  {multi && (
                    <button
                      type="button"
                      className="designer-chain-remove"
                      title="Remove group"
                      onClick={() => removeChain(i)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--ghost designer-add-chain" onClick={addChain}>
              <Plus size={14} /> Add a pixel group (different type, voltage, or run length)
            </button>
          </section>

          {/* Step 1: pixels */}
          <section className="designer-step">
            <h2 className="designer-step-title">
              1 · Pixels{multi ? ` (group ${active + 1})` : ''}
            </h2>
            <div className="designer-pixel-row">
              <select
                className="designer-select"
                value={chain.pixel?.id ?? ''}
                onChange={(e) => updateActive({ p: e.target.value, c: '' })}
              >
                <option value="">Choose a pixel type…</option>
                {pixels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.clocked == null ? '' : p.clocked ? ' (clocked)' : ''}
                    {p.voltage ? ` — ${fmt(p.voltage, 0)} V` : ''}
                  </option>
                ))}
              </select>
              {chain.pixel?.image && (
                <img
                  className="designer-pixel-thumb"
                  src={`/database-images/pixels/${chain.pixel.image}`}
                  alt={chain.pixel.name}
                />
              )}
            </div>
            {chain.pixel && (
              <p className="designer-hint">
                <Link to={`/pixels/${chain.pixel.id}`}>{chain.pixel.name}</Link>
                {chain.pixel.clocked == null
                  ? ' · clocked? unknown'
                  : chain.pixel.clocked
                    ? ' · clocked (data + clock lines)'
                    : ' · data-only (single wire)'}
                {' · ~'}
                {fmt(chain.pixel.wattsPerPixel * 1000, 0)} mW/pixel ({chain.pixel.wattsBasis})
              </p>
            )}
          </section>

          {/* Step 2: layout */}
          <section className="designer-step">
            <h2 className="designer-step-title">
              2 · Layout{multi ? ` (group ${active + 1})` : ''}
            </h2>
            <div className="designer-count-row">
              <label className="designer-field">
                <input
                  type="number"
                  className="designer-count"
                  min={1}
                  value={chain.layout.strings}
                  onChange={(e) => updateActive({ x: e.target.value })}
                />
                <span>strings of</span>
              </label>
              <label className="designer-field">
                <input
                  type="number"
                  className="designer-count"
                  min={1}
                  value={chain.layout.perString}
                  onChange={(e) => updateActive({ n: e.target.value })}
                />
                <span>pixels</span>
              </label>
              <span className="designer-total">
                = {layoutTotal(chain.layout).toLocaleString('en-US')} pixels
              </span>
            </div>
            <div className="designer-count-row">
              {LAYOUT_PRESETS.map(([x, n]) => (
                <button
                  key={`${x}x${n}`}
                  type="button"
                  className={`btn btn--ghost designer-preset${x === chain.layout.strings && n === chain.layout.perString ? ' designer-preset--active' : ''}`}
                  onClick={() => updateActive({ x: String(x), n: String(n) })}
                >
                  {x} × {n}
                </button>
              ))}
            </div>
            <p className="designer-hint">
              Strings don&apos;t all have to match: use your longest run here, or add separate
              groups for runs of different lengths, types, or voltages.
            </p>
          </section>

          {/* Step 3: controller */}
          <section className="designer-step">
            <h2 className="designer-step-title">
              3 · Controller{multi ? ` (group ${active + 1})` : ''}
            </h2>
            {!chain.pixel ? (
              <p className="designer-hint">Choose a pixel type first.</p>
            ) : (
              <>
                <p className="designer-hint">
                  {compatible.length.toLocaleString('en-US')} compatible controller
                  {compatible.length === 1 ? '' : 's'} for {chain.layout.strings} ×{' '}
                  {chain.layout.perString.toLocaleString('en-US')} {chain.pixel.name} (cheapest
                  first) ·{' '}
                  <label className="designer-toggle">
                    <input
                      type="checkbox"
                      checked={includeDiscontinued}
                      onChange={(e) => setIncludeDiscontinued(e.target.checked)}
                    />
                    include discontinued
                  </label>
                  {multi && ' · groups can share a controller — pick the same one in each group.'}
                </p>
                <ul className="designer-controller-list">
                  {compatible.map(({ controller: c, compat }) => (
                    <ControllerRow
                      key={c.id}
                      c={c}
                      selected={c.id === chain.controller?.id}
                      explicit={compat.explicitSupport}
                      caveats={compat.caveats}
                      onSelect={() =>
                        updateActive({ c: c.id === chain.controller?.id ? '' : c.id })
                      }
                    />
                  ))}
                </ul>
                {incompatible.length > 0 && (
                  <button
                    type="button"
                    className="btn btn--ghost designer-show-incompat"
                    onClick={() => setShowIncompatible((v) => !v)}
                  >
                    {showIncompatible ? 'Hide' : 'Show'} {incompatible.length} incompatible
                  </button>
                )}
                {showIncompatible && (
                  <ul className="designer-controller-list designer-controller-list--incompat">
                    {incompatible.map(({ controller: c, compat }) => (
                      <ControllerRow key={c.id} c={c} reasons={compat.reasons} />
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          {/* Step 4: pattern source */}
          <section className="designer-step">
            <h2 className="designer-step-title">4 · Pattern source</h2>
            {selectedControllers.length === 0 ? (
              <p className="designer-hint">
                Choose controller(s) to see which pattern software can drive them — live or from
                pre-recorded sequences.
              </p>
            ) : (
              <>
                <p className="designer-hint">
                  Must reach{' '}
                  {selectedControllers.map((c, i) => (
                    <span key={c.id}>
                      {i > 0 && ', '}
                      {c.name}
                      {c.inputProtocols.length > 0
                        ? ` (${c.inputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join('/')})`
                        : ' (protocols unrecorded)'}
                    </span>
                  ))}
                  .
                </p>
                <ul className="designer-controller-list designer-source-list">
                  {allStandalone && (
                    <li
                      className={`designer-controller${standalone ? ' designer-controller--selected' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => write(raw, { g: standalone ? null : 'standalone' })}
                      >
                        <span className="designer-controller-noimg designer-standalone-icon">
                          <MonitorPlay size={18} />
                        </span>
                        <span className="designer-controller-main">
                          <span className="designer-controller-name">
                            Standalone playback
                            <span className="designer-badge designer-badge--good">
                              <CheckCircle size={12} /> no computer needed
                            </span>
                          </span>
                          <span className="designer-controller-meta">
                            Every selected controller can play pre-recorded sequences on its own (SD
                            card / onboard software).
                          </span>
                        </span>
                      </button>
                    </li>
                  )}
                  {evaluatedSources.map(({ source: s, shared, caveats }) => (
                    <li
                      key={s.id}
                      className={`designer-controller${s.id === sourceId ? ' designer-controller--selected' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => write(raw, { g: s.id === sourceId ? null : s.id })}
                      >
                        <span className="designer-controller-noimg designer-standalone-icon">
                          <MonitorPlay size={18} />
                        </span>
                        <span className="designer-controller-main">
                          <span className="designer-controller-name">
                            {s.name}
                            {shared.length > 0 && (
                              <span className="designer-badge designer-badge--good">
                                via {shared.map((p) => PROTOCOL_LABELS[p] ?? p).join(' / ')}
                              </span>
                            )}
                            {caveats.length > 0 && (
                              <span
                                className="designer-badge designer-badge--warn"
                                title={caveats.join('; ')}
                              >
                                <HelpCircle size={12} /> verify
                              </span>
                            )}
                          </span>
                          <span className="designer-controller-meta">
                            {s.platforms.length > 0 ? s.platforms.join(' / ') : 'platforms?'}
                            {' · outputs '}
                            {s.outputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join(', ')}
                          </span>
                        </span>
                        <span className="designer-controller-price">{s.priceText ?? ''}</span>
                      </button>
                      <Link className="designer-controller-link" to={`/pattern-drivers/${s.id}`}>
                        details
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="designer-summary">
          <h2 className="designer-step-title">
            <Zap size={16} /> Power estimate
          </h2>
          {power.totalPixels === 0 ? (
            <p className="designer-hint">Pick pixels to see the numbers.</p>
          ) : (
            <>
              <dl className="designer-power">
                <div>
                  <dt>Total pixels</dt>
                  <dd>{power.totalPixels.toLocaleString('en-US')}</dd>
                </div>
                <div>
                  <dt>Max load</dt>
                  <dd>{fmt(power.totalWatts)} W</dd>
                </div>
                {power.rails.map((rail) => (
                  <div key={rail.voltage}>
                    <dt>{fmt(rail.voltage, 0)} V rail</dt>
                    <dd>
                      {fmt(rail.watts)} W ({fmt(rail.amps)} A) → {fmt(rail.recommendedWatts, 0)} W+
                      supply
                    </dd>
                  </div>
                ))}
              </dl>

              {power.warning !== 'none' && (
                <p className={`designer-warning designer-warning--${power.warning}`} role="alert">
                  <AlertTriangle size={15} />
                  {power.warning === 'strong'
                    ? `At ~${fmt(power.totalWatts, 0)} W this is serious power — undersized wiring or missing fuses can start fires. Strongly consider consulting someone experienced (or a licensed electrician) before building.`
                    : `Above ~20 W, wire gauge, fusing, and power injection start to matter. Worth reading up or asking experienced builders before you order parts.`}
                </p>
              )}

              {[...chainProblems, ...overflow].map((problem) => (
                <p key={problem} className="designer-warning designer-warning--strong" role="alert">
                  <AlertTriangle size={15} />
                  {problem}
                </p>
              ))}

              <DesignDiagram
                chains={chains}
                source={source}
                standalone={standalone}
                power={power}
              />
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function ControllerRow({
  c,
  selected = false,
  explicit = false,
  caveats = [],
  reasons = [],
  onSelect,
}: {
  c: ControllerOption;
  selected?: boolean;
  explicit?: boolean;
  caveats?: string[];
  reasons?: string[];
  onSelect?: () => void;
}) {
  return (
    <li
      className={`designer-controller${selected ? ' designer-controller--selected' : ''}${onSelect ? '' : ' designer-controller--disabled'}`}
    >
      <button type="button" onClick={onSelect} disabled={!onSelect}>
        {c.image ? (
          <img src={`/database-images/controllers/${c.image}`} alt="" loading="lazy" />
        ) : (
          <span className="designer-controller-noimg" aria-hidden="true" />
        )}
        <span className="designer-controller-main">
          <span className="designer-controller-name">
            {c.name}
            {explicit && (
              <span
                className="designer-badge designer-badge--good"
                title="Vendor explicitly lists this pixel type"
              >
                <CheckCircle size={12} /> listed support
              </span>
            )}
            {caveats.length > 0 && (
              <span className="designer-badge designer-badge--warn" title={caveats.join('; ')}>
                <HelpCircle size={12} /> check specs
              </span>
            )}
          </span>
          <span className="designer-controller-meta">
            {c.outputs != null ? `${c.outputs} outputs` : 'outputs?'}
            {c.maxPerOutput != null ? ` · ${c.maxPerOutput.toLocaleString('en-US')} px/output` : ''}
            {c.differential ? ' · differential' : ''}
            {c.standalone ? ' · standalone' : ''}
            {reasons.length > 0 ? ` — ${reasons.join('; ')}` : ''}
          </span>
        </span>
        <span className="designer-controller-price">{c.priceText ?? '—'}</span>
      </button>
      <Link className="designer-controller-link" to={`/controllers/${c.id}`}>
        details
      </Link>
    </li>
  );
}
