import type { Route } from './+types/designer';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangle, CheckCircle, HelpCircle, Zap } from 'lucide-react';
import { loadCategoryData } from '~/lib/data';
import {
  buildPixelOption,
  buildControllerOption,
  checkCompat,
  estimatePower,
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
        'Design an addressable LED system: pick pixels and a compatible controller, get a power estimate and a printable system diagram.',
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
  return { pixels, controllers };
}

const COUNT_PRESETS = [50, 150, 500, 1000, 5000];

function fmt(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export default function DesignerPage({ loaderData }: Route.ComponentProps) {
  const { pixels, controllers } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [showIncompatible, setShowIncompatible] = useState(false);
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false);

  const pixelId = searchParams.get('p');
  const count = Math.max(1, parseInt(searchParams.get('n') ?? '', 10) || 150);
  const controllerId = searchParams.get('c');

  const pixel = pixels.find((p) => p.id === pixelId) ?? null;
  const controller = controllers.find((c) => c.id === controllerId) ?? null;

  const update = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(patch)) {
          if (v == null) next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true, preventScrollReset: true }
    );
  };

  const power = pixel ? estimatePower(pixel, count) : null;

  // Compatibility for every controller against the current pixel/count
  // (cheap enough to recompute per render; React Compiler memoizes)
  const evaluated = !pixel
    ? []
    : controllers
        .filter(
          (c) => includeDiscontinued || (c.status !== 'discontinued' && c.status !== 'end-of-life')
        )
        .map((c) => ({ controller: c, compat: checkCompat(c, pixel, count) }));

  const compatible = evaluated.filter((e) => e.compat.ok);
  const incompatible = evaluated.filter((e) => !e.compat.ok);
  const selectedCompat = pixel && controller ? checkCompat(controller, pixel, count) : null;

  return (
    <div className="container page-section designer-page">
      <div className="hero-section">
        <h1 className="hero-title">
          <RainbowText>System Designer</RainbowText>
        </h1>
        <p className="designer-intro">
          Pick pixels, size the run, choose a compatible controller — get a power estimate and a
          shareable diagram. Your design lives in this page&apos;s URL.
        </p>
      </div>

      <div className="designer-layout">
        <div className="designer-config">
          {/* Step 1: pixels */}
          <section className="designer-step">
            <h2 className="designer-step-title">1 · Pixels</h2>
            <div className="designer-pixel-row">
              <select
                className="designer-select"
                value={pixelId ?? ''}
                onChange={(e) => update({ p: e.target.value || null, c: null })}
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
              {pixel?.image && (
                <img
                  className="designer-pixel-thumb"
                  src={`/database-images/pixels/${pixel.image}`}
                  alt={pixel.name}
                />
              )}
            </div>
            {pixel && (
              <p className="designer-hint">
                <Link to={`/pixels/${pixel.id}`}>{pixel.name}</Link>
                {pixel.clocked == null
                  ? ' · clocked? unknown'
                  : pixel.clocked
                    ? ' · clocked (data + clock lines)'
                    : ' · data-only (single wire)'}
                {' · ~'}
                {fmt(pixel.wattsPerPixel * 1000, 0)} mW/pixel ({pixel.wattsBasis})
              </p>
            )}
          </section>

          {/* Step 2: count */}
          <section className="designer-step">
            <h2 className="designer-step-title">2 · How many?</h2>
            <div className="designer-count-row">
              <input
                type="number"
                className="designer-count"
                min={1}
                value={count}
                onChange={(e) => update({ n: e.target.value })}
              />
              {COUNT_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn btn--ghost designer-preset${n === count ? ' designer-preset--active' : ''}`}
                  onClick={() => update({ n: String(n) })}
                >
                  {n.toLocaleString('en-US')}
                </button>
              ))}
            </div>
          </section>

          {/* Step 3: controller */}
          <section className="designer-step">
            <h2 className="designer-step-title">3 · Controller</h2>
            {!pixel ? (
              <p className="designer-hint">Choose a pixel type first.</p>
            ) : (
              <>
                <p className="designer-hint">
                  {compatible.length.toLocaleString('en-US')} compatible controller
                  {compatible.length === 1 ? '' : 's'} for {count.toLocaleString('en-US')} ×{' '}
                  {pixel.name} (cheapest first) ·{' '}
                  <label className="designer-toggle">
                    <input
                      type="checkbox"
                      checked={includeDiscontinued}
                      onChange={(e) => setIncludeDiscontinued(e.target.checked)}
                    />
                    include discontinued
                  </label>
                </p>
                <ul className="designer-controller-list">
                  {compatible.map(({ controller: c, compat }) => (
                    <ControllerRow
                      key={c.id}
                      c={c}
                      selected={c.id === controllerId}
                      explicit={compat.explicitSupport}
                      caveats={compat.caveats}
                      onSelect={() => update({ c: c.id === controllerId ? null : c.id })}
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
        </div>

        {/* Summary */}
        <aside className="designer-summary">
          <h2 className="designer-step-title">
            <Zap size={16} /> Power estimate
          </h2>
          {!pixel || !power ? (
            <p className="designer-hint">Pick pixels to see the numbers.</p>
          ) : (
            <>
              <dl className="designer-power">
                <div>
                  <dt>Max load</dt>
                  <dd>
                    {fmt(power.watts)} W ({fmt(power.amps)} A @ {fmt(power.voltage, 0)} V)
                  </dd>
                </div>
                <div>
                  <dt>Suggested supply</dt>
                  <dd>
                    {fmt(power.recommendedWatts, 0)} W+ <span>(25% headroom)</span>
                  </dd>
                </div>
                <div>
                  <dt>Basis</dt>
                  <dd>{power.basis}</dd>
                </div>
              </dl>

              {power.warning !== 'none' && (
                <p className={`designer-warning designer-warning--${power.warning}`} role="alert">
                  <AlertTriangle size={15} />
                  {power.warning === 'strong'
                    ? `At ~${fmt(power.watts, 0)} W this is serious power — undersized wiring or missing fuses can start fires. Strongly consider consulting someone experienced (or a licensed electrician) before building.`
                    : `Above ~20 W, wire gauge, fusing, and power injection start to matter. Worth reading up or asking experienced builders before you order parts.`}
                </p>
              )}

              {selectedCompat && !selectedCompat.ok && (
                <p className="designer-warning designer-warning--strong" role="alert">
                  <AlertTriangle size={15} />
                  {controller!.name}: {selectedCompat.reasons.join('; ')}
                </p>
              )}

              <DesignDiagram pixel={pixel} count={count} controller={controller} power={power} />
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
            {c.capacity != null ? ` · ${c.capacity.toLocaleString('en-US')} px max` : ''}
            {c.differential ? ' · differential' : ''}
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
