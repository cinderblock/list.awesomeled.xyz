import type { Route } from './+types/designer';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  AlertTriangle,
  CheckCircle,
  Cpu,
  HelpCircle,
  MonitorPlay,
  Plus,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { loadCategoryData } from '~/lib/data';
import {
  buildPixelOption,
  buildControllerOption,
  buildLevelShifterOption,
  buildMicroboardControllerOption,
  buildPatternSourceOption,
  chainMaxFps,
  checkCompat,
  checkSourceCompat,
  describeLayout,
  layoutTotal,
  needsLevelShifter,
  stringLengths,
  systemPower,
  sharedOutputOverflow,
  PROTOCOL_LABELS,
  type Chain,
  type ControllerOption,
} from '~/lib/designer';
import { RainbowText } from '~/components/ui/RainbowText';
import { Tooltip } from '~/components/ui/Tooltip';
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
  // Bare dev boards with recorded pixel-output capability join the controller
  // list as DIY options (hidden behind a toggle in step 3)
  const diyBoards = loadCategoryData('microboards')
    .map(buildMicroboardControllerOption)
    .filter((c) => c !== null);
  const controllers = [
    ...loadCategoryData('controllers').map(buildControllerOption),
    ...diyBoards,
  ].sort((a, b) => (a.priceUSD ?? Infinity) - (b.priceUSD ?? Infinity));
  const sources = loadCategoryData('pattern-drivers')
    .map(buildPatternSourceOption)
    .filter((s) => s.outputProtocols.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const shifters = loadCategoryData('level-converters')
    .filter((e) => e.status !== 'discontinued' && e.status !== 'end-of-life')
    .map(buildLevelShifterOption)
    .sort((a, b) => (a.priceUSD ?? Infinity) - (b.priceUSD ?? Infinity));
  return { pixels, controllers, sources, shifters };
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

const DRAFT_KEY = 'awesomeledlist_designer_draft';

function fmt(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

function fmtHz(hz: number): string {
  return hz >= 1e6 ? `${fmt(hz / 1e6)} MHz` : `${fmt(hz / 1e3, 0)} kHz`;
}

export default function DesignerPage({ loaderData }: Route.ComponentProps) {
  const { pixels, controllers, sources, shifters } = loaderData;
  const [searchParams, setSearchParams] = useSearchParams();
  const [showIncompatible, setShowIncompatible] = useState(false);
  const [pixelQuery, setPixelQuery] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false);
  const [includeDiy, setIncludeDiy] = useState(false);
  const [fossOnly, setFossOnly] = useState(false);
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

  // n is "800" (uniform) or "150.200.80" (per-string lengths, dot-separated)
  const chains: Chain[] = raw.map((r) => {
    const lengths = r.n
      .split('.')
      .map((s) => parseInt(s, 10))
      .filter((v) => v > 0);
    return {
      pixel: pixels.find((p) => p.id === r.p) ?? null,
      layout:
        lengths.length > 1
          ? { strings: lengths.length, perString: Math.max(...lengths), lengths }
          : {
              strings: Math.max(1, parseInt(r.x, 10) || 1),
              perString: lengths[0] ?? 150,
            },
      controller: controllers.find((c) => c.id === r.c) ?? null,
    };
  });
  const chain = chains[active];
  const sourceId = searchParams.get('g');
  const source =
    sourceId === 'standalone' ? null : (sources.find((s) => s.id === sourceId) ?? null);
  const standalone = sourceId === 'standalone';

  // Drafts survive accidental navigation: every change mirrors the URL params
  // into localStorage, and a fresh /designer visit (no params) restores the
  // last draft. The URL stays the shareable source of truth.
  useEffect(() => {
    const s = searchParams.toString();
    try {
      if (s) {
        localStorage.setItem(DRAFT_KEY, s);
      } else {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) setSearchParams(new URLSearchParams(saved), { replace: true });
      }
    } catch {
      // storage unavailable; URL-only
    }
  }, [searchParams, setSearchParams]);

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

  // Downloaded diagrams carry their design in <metadata id="awesomeled-design">
  const importSvg = (file: File) => {
    file.text().then((text) => {
      try {
        const dom = new DOMParser().parseFromString(text, 'image/svg+xml');
        const json = dom.getElementById('awesomeled-design')?.textContent;
        if (!json) throw new Error('no design metadata');
        const design = JSON.parse(json) as {
          source?: unknown;
          chains?: {
            pixel?: unknown;
            strings?: unknown;
            perString?: unknown;
            lengths?: unknown;
            controller?: unknown;
          }[];
        };
        if (!Array.isArray(design.chains) || design.chains.length === 0) {
          throw new Error('no chains');
        }
        const nextRaw: RawChain[] = design.chains.map((c) => ({
          p: typeof c.pixel === 'string' ? c.pixel : '',
          x: String(typeof c.strings === 'number' ? c.strings : 1),
          n: Array.isArray(c.lengths)
            ? c.lengths.join('.')
            : String(typeof c.perString === 'number' ? c.perString : 150),
          c: typeof c.controller === 'string' ? c.controller : '',
        }));
        write(nextRaw, { g: typeof design.source === 'string' ? design.source : null });
        setActive(0);
        setImportError(null);
      } catch {
        setImportError(
          "Couldn't find a design in that SVG — import only works with diagrams downloaded from this designer."
        );
      }
    });
  };

  const power = systemPower(chains);
  const overflow = sharedOutputOverflow(chains);
  const multi = chains.length > 1;

  const visiblePixels = pixels.filter(
    (p) =>
      p.id === chain.pixel?.id ||
      p.name.toLowerCase().includes(pixelQuery.trim().toLowerCase()) ||
      (p.type ?? '').toLowerCase().includes(pixelQuery.trim().toLowerCase())
  );

  // Refresh ceiling per group; strings on separate outputs clock out in parallel
  const activeFps = chain.pixel ? chainMaxFps(chain.pixel, chain.layout) : null;
  const fpsNotes = chains.flatMap((ch, i) => {
    if (!ch.pixel) return [];
    const fps = chainMaxFps(ch.pixel, ch.layout);
    if (fps == null || fps >= 30) return [];
    const label = multi ? `Group ${i + 1}` : 'This layout';
    return [
      `${label} tops out at ~${fmt(fps, 0)} fps: ${ch.pixel.name}'s ${fmtHz(ch.pixel.bitrateHz!)} data rate across ${ch.layout.perString.toLocaleString('en-US')} pixels per string. Shorter strings on more outputs refresh faster.`,
    ];
  });

  // Unbuffered (CPU-direct, usually 3.3 V) outputs into 5 V+ pixels
  const shiftNotes = chains.flatMap((ch, i) => {
    if (!ch.pixel || !ch.controller || !needsLevelShifter(ch.controller, ch.pixel)) return [];
    const label = multi ? `Group ${i + 1}: ` : '';
    return [
      `${label}${ch.controller.name} drives data straight from its CPU pins (typically 3.3 V); ${ch.pixel.name} runs at ${fmt(ch.pixel.voltage ?? 5, 0)} V and may not register 3.3 V data reliably. Plan a level shifter on each data line.`,
    ];
  });

  // Compatibility of every controller with the ACTIVE chain. DIY boards stay
  // hidden unless toggled on — but a board already selected keeps showing.
  const evaluated = !chain.pixel
    ? []
    : controllers
        .filter(
          (c) => includeDiscontinued || (c.status !== 'discontinued' && c.status !== 'end-of-life')
        )
        .filter((c) => includeDiy || !c.diy || c.id === chain.controller?.id)
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
    .filter((s) => !fossOnly || s.foss === true)
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
          and pick a pattern source. Power estimates come out per voltage rail; your design lives in
          this page&apos;s URL and is auto-saved in this browser.
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
                    {ch.pixel ? `${describeLayout(ch.layout)} ${ch.pixel.name}` : 'empty'}
                    {ch.controller ? ` → ${ch.controller.name}` : ''}
                  </button>
                  {multi && (
                    <Tooltip content="Remove group">
                      <button
                        type="button"
                        className="designer-chain-remove"
                        onClick={() => removeChain(i)}
                      >
                        <X size={14} />
                      </button>
                    </Tooltip>
                  )}
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--ghost designer-add-chain" onClick={addChain}>
              <Plus size={14} /> Add a pixel group (different type, voltage, or run length)
            </button>
            <label className="btn btn--ghost designer-add-chain designer-import">
              <Upload size={14} /> Import a downloaded design SVG
              <input
                type="file"
                accept=".svg,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importSvg(file);
                  e.target.value = '';
                }}
              />
            </label>
            {importError && (
              <p className="designer-warning designer-warning--advisory" role="alert">
                <AlertTriangle size={15} />
                {importError}
              </p>
            )}
          </section>

          {/* Step 1: pixels */}
          <section className="designer-step">
            <h2 className="designer-step-title">
              1 · Pixels{multi ? ` (group ${active + 1})` : ''}
            </h2>
            <input
              type="search"
              className="designer-pixel-search"
              placeholder="Filter pixel types…"
              value={pixelQuery}
              onChange={(e) => setPixelQuery(e.target.value)}
            />
            <div className="designer-pixel-grid">
              {visiblePixels.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`designer-pixel-card${p.id === chain.pixel?.id ? ' designer-pixel-card--selected' : ''}`}
                  onClick={() => updateActive({ p: p.id === chain.pixel?.id ? '' : p.id, c: '' })}
                >
                  {p.image ? (
                    <img src={`/database-images/pixels/${p.image}`} alt="" loading="lazy" />
                  ) : (
                    <span className="designer-pixel-card-noimg" aria-hidden="true">
                      <Zap size={18} />
                    </span>
                  )}
                  <span className="designer-pixel-card-name">{p.name}</span>
                  <span className="designer-pixel-card-meta">
                    {p.voltage ? `${fmt(p.voltage, 0)} V` : 'V?'}
                    {p.clocked == null ? '' : p.clocked ? ' · clocked' : ' · 1-wire'}
                    {p.status === 'discontinued' || p.status === 'end-of-life'
                      ? ' · discontinued'
                      : ''}
                  </span>
                </button>
              ))}
            </div>
            {visiblePixels.length === 0 && (
              <p className="designer-hint">No pixel types match “{pixelQuery}”.</p>
            )}
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
                {chain.pixel.bitrateHz ? ` · ${fmtHz(chain.pixel.bitrateHz)} data` : ''}
              </p>
            )}
          </section>

          {/* Step 2: layout */}
          <section className="designer-step">
            <h2 className="designer-step-title">
              2 · Layout{multi ? ` (group ${active + 1})` : ''}
            </h2>
            {!chain.layout.lengths ? (
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
            ) : (
              <div className="designer-count-row">
                <label className="designer-field designer-field--grow">
                  <input
                    key={`lengths-${active}`}
                    type="text"
                    className="designer-count designer-lengths"
                    defaultValue={chain.layout.lengths.join(', ')}
                    placeholder="150, 200, 80"
                    onChange={(e) => {
                      const lengths = e.target.value
                        .split(/[\s,;+]+/)
                        .map((s) => parseInt(s, 10))
                        .filter((v) => v > 0);
                      if (lengths.length > 0) {
                        updateActive({ n: lengths.join('.'), x: String(lengths.length) });
                      }
                    }}
                  />
                  <span>pixels per string</span>
                </label>
                <span className="designer-total">
                  = {layoutTotal(chain.layout).toLocaleString('en-US')} pixels /{' '}
                  {chain.layout.strings} strings
                </span>
              </div>
            )}
            <div className="designer-count-row">
              {LAYOUT_PRESETS.map(([x, n]) => (
                <button
                  key={`${x}x${n}`}
                  type="button"
                  className={`btn btn--ghost designer-preset${!chain.layout.lengths && x === chain.layout.strings && n === chain.layout.perString ? ' designer-preset--active' : ''}`}
                  onClick={() => updateActive({ x: String(x), n: String(n) })}
                >
                  {x} × {n}
                </button>
              ))}
              <button
                type="button"
                className={`btn btn--ghost designer-preset${chain.layout.lengths ? ' designer-preset--active' : ''}`}
                onClick={() =>
                  chain.layout.lengths
                    ? updateActive({
                        n: String(chain.layout.perString),
                        x: String(chain.layout.strings),
                      })
                    : updateActive({ n: stringLengths(chain.layout).join('.') })
                }
              >
                {chain.layout.lengths ? 'uniform strings' : 'vary string lengths'}
              </button>
            </div>
            {activeFps != null && chain.pixel && (
              <p className="designer-hint">
                Refresh ceiling ~<strong>{fmt(activeFps, 0)} fps</strong> —{' '}
                {fmtHz(chain.pixel.bitrateHz!)} ÷ ({chain.pixel.bitsPerPixel} bits ×{' '}
                {chain.layout.perString.toLocaleString('en-US')} px
                {chain.layout.lengths ? ' on the longest string' : '/string'}). Strings on separate
                outputs update in parallel, so only string length matters.
              </p>
            )}
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
                  {compatible.length === 1 ? '' : 's'} for {describeLayout(chain.layout)}{' '}
                  {chain.pixel.name} (cheapest first) ·{' '}
                  <label className="designer-toggle">
                    <input
                      type="checkbox"
                      checked={includeDiscontinued}
                      onChange={(e) => setIncludeDiscontinued(e.target.checked)}
                    />
                    include discontinued
                  </label>
                  {' · '}
                  <Tooltip content="Bare dev boards (ESP32, Teensy, Pi …) — bring your own firmware (WLED/FPP) and usually a level shifter">
                    <label className="designer-toggle">
                      <input
                        type="checkbox"
                        checked={includeDiy}
                        onChange={(e) => setIncludeDiy(e.target.checked)}
                      />
                      include DIY dev boards
                    </label>
                  </Tooltip>
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
                {chain.controller && needsLevelShifter(chain.controller, chain.pixel) && (
                  <p className="designer-warning designer-warning--advisory" role="alert">
                    <AlertTriangle size={15} />
                    <span>
                      {chain.controller.name} drives data straight from its CPU pins (typically 3.3
                      V), and {chain.pixel.name} may not register that reliably. Add a level shifter
                      on each data line — e.g.{' '}
                      {shifters.slice(0, 4).map((s, i) => (
                        <span key={s.id}>
                          {i > 0 && ', '}
                          <Link to={`/level-converters/${s.id}`}>{s.name}</Link>
                          {s.channels != null || s.priceText
                            ? ` (${[s.channels != null ? `${s.channels} ch` : null, s.priceText]
                                .filter(Boolean)
                                .join(', ')})`
                            : ''}
                        </span>
                      ))}
                      .
                    </span>
                  </p>
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
                  {' · '}
                  <label className="designer-toggle">
                    <input
                      type="checkbox"
                      checked={fossOnly}
                      onChange={(e) => setFossOnly(e.target.checked)}
                    />
                    FOSS only
                  </label>
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
                              <Tooltip content={caveats.join('; ')}>
                                <span className="designer-badge designer-badge--warn">
                                  <HelpCircle size={12} /> verify
                                </span>
                              </Tooltip>
                            )}
                          </span>
                          <span className="designer-controller-meta">
                            {s.platforms.length > 0 ? s.platforms.join(' / ') : 'platforms?'}
                            {' · outputs '}
                            {s.outputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join(', ')}
                            {s.license ? ` · ${s.license}` : ''}
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
            <Zap size={16} /> Power &amp; refresh
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
                {chains.map((ch, i) => {
                  const fps = ch.pixel ? chainMaxFps(ch.pixel, ch.layout) : null;
                  if (fps == null) return null;
                  return (
                    <div key={`fps-${i}`}>
                      <dt>{multi ? `Group ${i + 1} refresh` : 'Refresh ceiling'}</dt>
                      <dd>~{fmt(fps, 0)} fps</dd>
                    </div>
                  );
                })}
              </dl>

              {power.warning !== 'none' && (
                <p className={`designer-warning designer-warning--${power.warning}`} role="alert">
                  <AlertTriangle size={15} />
                  {power.warning === 'strong'
                    ? `At ~${fmt(power.totalWatts, 0)} W this is serious power — undersized wiring or missing fuses can start fires. Strongly consider consulting someone experienced (or a licensed electrician) before building.`
                    : `Above ~20 W, wire gauge, fusing, and power injection start to matter. Worth reading up or asking experienced builders before you order parts.`}
                </p>
              )}

              {[...fpsNotes, ...shiftNotes].map((note) => (
                <p key={note} className="designer-warning designer-warning--advisory">
                  <AlertTriangle size={15} />
                  {note}
                </p>
              ))}

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
          <img
            src={`/database-images/${c.diy ? 'microboards' : 'controllers'}/${c.image}`}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className="designer-controller-noimg" aria-hidden="true" />
        )}
        <span className="designer-controller-main">
          <span className="designer-controller-name">
            {c.name}
            {c.diy && (
              <Tooltip content="Bare dev board — flash WLED/FPP (or your own firmware) and plan a level shifter for 5 V pixels">
                <span className="designer-badge designer-badge--warn">
                  <Cpu size={12} /> DIY board
                </span>
              </Tooltip>
            )}
            {explicit && (
              <Tooltip content="The vendor explicitly lists this pixel type as supported">
                <span className="designer-badge designer-badge--good">
                  <CheckCircle size={12} /> listed support
                </span>
              </Tooltip>
            )}
            {caveats.length > 0 && (
              <Tooltip content={caveats.join('; ')}>
                <span className="designer-badge designer-badge--warn">
                  <HelpCircle size={12} /> check specs
                </span>
              </Tooltip>
            )}
          </span>
          <span className="designer-controller-meta">
            {c.outputs != null ? `${c.outputs} outputs` : 'outputs?'}
            {c.maxPerOutput != null ? ` · ${c.maxPerOutput.toLocaleString('en-US')} px/output` : ''}
            {c.differential ? ' · differential' : ''}
            {c.standalone ? ' · standalone' : ''}
            {c.diy && c.dataVoltage != null ? ` · ${fmt(c.dataVoltage, 1)} V data pins` : ''}
            {reasons.length > 0 ? ` — ${reasons.join('; ')}` : ''}
          </span>
        </span>
        <span className="designer-controller-price">{c.priceText ?? '—'}</span>
      </button>
      <Link className="designer-controller-link" to={c.path ?? `/controllers/${c.id}`}>
        details
      </Link>
    </li>
  );
}
