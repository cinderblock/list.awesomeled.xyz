import { useState } from 'react';
import { Link } from 'react-router';
import { CircleCheck, MonitorPlay, Search } from 'lucide-react';
import {
  evaluateConnector,
  evaluateShifter,
  evaluateSource,
  costOf,
  fmtAmps,
  fmtCost,
  fmtVolts,
  isRetired,
  PROTOCOL_LABELS,
  STANDALONE,
  wiresNeeded,
  type ConnectorOption,
  type ControllerOption,
  type GroupAnalysis,
  type Issue,
  type ShifterOption,
  type SourceOption,
} from '~/lib/designer';
import { SeverityIcon, Thumb } from './parts';

/** The one note worth showing in a list row: the first error, else the first warning */
function RowNote({ issues }: { issues: Issue[] }) {
  const issue =
    issues.find((i) => i.severity === 'error') ??
    issues.find((i) => i.severity === 'warning' && i.code !== 'retired');
  if (!issue) return null;
  return (
    <span className={`designer-option-note designer-option-note--${issue.severity}`}>
      <SeverityIcon severity={issue.severity} size={13} /> {issue.message}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Level shifters

interface ShifterPickerProps {
  shifters: ShifterOption[];
  group: GroupAnalysis;
  onSelect: (id: string) => void;
}

export function ShifterPicker({ shifters, group, onSelect }: ShifterPickerProps) {
  const selectedId = group.shifter?.id ?? '';
  const rows = shifters
    .filter((s) => s.id === selectedId || !isRetired(s.status))
    .map((shifter) => {
      const fit = evaluateShifter(shifter, {
        controller: group.controller,
        pixel: group.pixel,
        lines: group.dataLines,
      });
      const cost = costOf(shifter.price, fit.qty);
      // Parts that can't read the controller or drive the cable go last
      const doubts = fit.issues.filter(
        (i) => i.code === 'shifter-threshold' || i.code === 'shifter-drive'
      ).length;
      return { shifter, fit, doubts, cost, totalUSD: cost?.totalUSD ?? null };
    })
    .sort(
      (a, b) =>
        Number(b.shifter.id === selectedId) - Number(a.shifter.id === selectedId) ||
        Number(b.fit.ok) - Number(a.fit.ok) ||
        a.doubts - b.doubts ||
        Number(a.shifter.differential) - Number(b.shifter.differential) ||
        (a.totalUSD ?? Infinity) - (b.totalUSD ?? Infinity) ||
        a.shifter.name.localeCompare(b.shifter.name)
    );

  return (
    <div className="designer-picker">
      <p className="designer-picker-count">
        {group.dataLines} data line{group.dataLines === 1 ? '' : 's'} to convert
        {group.pixel?.clocked ? ' (data and clock for each string)' : ' (one per string)'}. The
        shifter sits right next to the controller, before the cable to the pixels: it has to read
        the controller’s 3.3 V as a high and drive that cable at 5 V. Buffers that do both come
        first.
      </p>
      <ul className="designer-options">
        {rows.map(({ shifter: s, fit, cost }) => {
          const selected = s.id === selectedId;
          return (
            <li
              key={s.id}
              className={`designer-option${selected ? ' designer-option--selected' : ''}`}
              data-id={s.id}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(selected ? '' : s.id)}
              >
                <Thumb src={s.image} />
                <span className="designer-option-main">
                  <span className="designer-option-name">
                    {s.name}
                    <span className="designer-badge designer-badge--neutral">{fit.qty} needed</span>
                  </span>
                  <span className="designer-option-meta">
                    {[
                      s.channels != null
                        ? `${s.channels} channel${s.channels === 1 ? '' : 's'}`
                        : 'channels?',
                      s.interface,
                      s.inputHighMin != null ? `reads ${fmtVolts(s.inputHighMin)} as high` : null,
                      s.maxVoltage != null ? `up to ${fmtVolts(s.maxVoltage)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                  <RowNote issues={fit.issues} />
                </span>
                <span className="designer-option-price">
                  {cost ? fmtCost(cost.totalUSD, cost.totalMaxUSD, cost.from) : '—'}
                  {cost && fit.qty > 1 && (
                    <small>
                      {fit.qty} × {fmtCost(cost.unitUSD, cost.unitMaxUSD, cost.from)}
                    </small>
                  )}
                </span>
              </button>
              <Link className="designer-option-link" to={s.path}>
                details
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Connectors

interface ConnectorPickerProps {
  connectors: ConnectorOption[];
  group: GroupAnalysis;
  outdoor: boolean;
  onSelect: (id: string) => void;
}

export function ConnectorPicker({ connectors, group, outdoor, onSelect }: ConnectorPickerProps) {
  const selectedId = group.connector?.id ?? '';
  const [query, setQuery] = useState('');
  const [showUnfit, setShowUnfit] = useState(false);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const rows = connectors
    .filter((c) => c.id === selectedId || words.every((w) => c.name.toLowerCase().includes(w)))
    .map((connector) => ({
      connector,
      fit: evaluateConnector(connector, {
        pixel: group.pixel,
        voltage: group.voltage,
        power: group.power,
        controller: group.controller,
        outdoor,
      }),
    }))
    .sort(
      (a, b) =>
        Number(b.connector.id === selectedId) - Number(a.connector.id === selectedId) ||
        Number(b.fit.matchesController) - Number(a.fit.matchesController) ||
        a.fit.issues.filter((i) => i.severity === 'warning').length -
          b.fit.issues.filter((i) => i.severity === 'warning').length ||
        a.connector.name.localeCompare(b.connector.name)
    );
  const fits = rows.filter((r) => r.fit.ok || r.connector.id === selectedId);
  const unfit = rows.filter((r) => !r.fit.ok && r.connector.id !== selectedId);
  const wires = wiresNeeded(group.pixel);
  const feed = group.power?.longest.feedAmps;

  const row = ({ connector: c, fit }: (typeof rows)[number], selectable: boolean) => {
    const selected = c.id === selectedId;
    return (
      <li
        key={c.id}
        className={`designer-option${selected ? ' designer-option--selected' : ''}${selectable ? '' : ' designer-option--unfit'}`}
        data-id={c.id}
      >
        <button
          type="button"
          aria-pressed={selected}
          disabled={!selectable}
          onClick={() => onSelect(selected ? '' : c.id)}
        >
          <Thumb src={c.image} />
          <span className="designer-option-main">
            <span className="designer-option-name">
              {c.name}
              {fit.matchesController && (
                <span className="designer-badge designer-badge--good">
                  <CircleCheck size={12} aria-hidden="true" /> on {group.controller?.name}
                </span>
              )}
              {c.ip != null && c.ipText && (
                <span className="designer-badge designer-badge--neutral">{c.ipText}</span>
              )}
            </span>
            <span className="designer-option-meta">
              {[
                c.pinsMin != null || c.pinsMax != null
                  ? c.pinsMin === c.pinsMax
                    ? `${c.pinsMin} contacts`
                    : `${c.pinsMin ?? '?'}–${c.pinsMax ?? '?'} contacts`
                  : null,
                c.contactAmps != null ? `${fmtAmps(c.contactAmps)} per contact` : null,
                c.maxVoltage != null ? fmtVolts(c.maxVoltage) : null,
                c.locking,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <RowNote issues={fit.issues} />
          </span>
        </button>
        <Link className="designer-option-link" to={c.path}>
          details
        </Link>
      </li>
    );
  };

  return (
    <div className="designer-picker">
      <p className="designer-picker-count">
        Each string needs {wires} conductors (
        {wires === 4 ? 'power, ground, data, clock' : 'power, ground, data'})
        {feed != null ? ` and carries up to ${fmtAmps(feed)} per power feed` : ''} at{' '}
        {fmtVolts(group.voltage)}
        {outdoor ? ', outdoors' : ''}.
        {group.controller?.outputConnector && (
          <>
            {' '}
            {group.controller.name}’s outputs are {group.controller.outputConnector.label}
            {group.controller.outputConnector.notes
              ? ` (${group.controller.outputConnector.notes})`
              : ''}
            .
          </>
        )}
      </p>
      <div className="designer-picker-tools">
        <label className="designer-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search connectors…"
            aria-label="Search connectors"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <ul className="designer-options">{fits.map((r) => row(r, true))}</ul>
      {unfit.length > 0 && (
        <>
          <button
            type="button"
            className="btn btn--ghost btn--sm designer-picker-more"
            aria-expanded={showUnfit}
            onClick={() => setShowUnfit((v) => !v)}
          >
            {showUnfit ? 'Hide' : 'Show'} the {unfit.length} that can’t
          </button>
          {showUnfit && (
            <ul className="designer-options designer-options--unfit">
              {unfit.map((r) => row(r, false))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pattern sources

interface SourcePickerProps {
  sources: SourceOption[];
  /** Controllers the design uses (each model once) */
  controllers: ControllerOption[];
  selected: string;
  onSelect: (id: string) => void;
}

const LINK_RANK = { onboard: 0, protocol: 1, unverified: 2, none: 3 } as const;

export function SourcePicker({ sources, controllers, selected, onSelect }: SourcePickerProps) {
  const [query, setQuery] = useState('');
  const [fossOnly, setFossOnly] = useState(false);
  const [showUnfit, setShowUnfit] = useState(false);
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  const rows = sources
    .filter((s) => {
      if (s.id === selected) return true;
      if (isRetired(s.status)) return false;
      if (fossOnly && s.foss !== true) return false;
      return words.every((w) => s.name.toLowerCase().includes(w));
    })
    .map((source) => {
      const fit = evaluateSource(source, controllers);
      // How well it reaches the controllers overall: the weakest link decides
      const rank = Math.max(-1, ...fit.links.map((l) => LINK_RANK[l]));
      return { source, fit, rank };
    })
    .sort(
      (a, b) =>
        Number(b.source.id === selected) - Number(a.source.id === selected) ||
        a.rank - b.rank ||
        a.source.name.localeCompare(b.source.name)
    );
  const fits = rows.filter((r) => r.fit.ok || r.source.id === selected);
  const unfit = rows.filter((r) => !r.fit.ok && r.source.id !== selected);
  const allStandalone = controllers.length > 0 && controllers.every((c) => c.standalone);
  // Controllers whose accepted protocols the database doesn't record
  const unverified = controllers.filter(
    (c) => c.inputProtocols.length === 0 && fits.some((r) => r.fit.links.includes('unverified'))
  );

  const row = ({ source: s, fit }: (typeof rows)[number], selectable: boolean) => {
    const isSelected = s.id === selected;
    const onboard = fit.links.length > 0 && fit.links.every((l) => l === 'onboard');
    return (
      <li
        key={s.id}
        className={`designer-option${isSelected ? ' designer-option--selected' : ''}${selectable ? '' : ' designer-option--unfit'}`}
        data-id={s.id}
      >
        <button
          type="button"
          aria-pressed={isSelected}
          disabled={!selectable}
          onClick={() => onSelect(isSelected ? '' : s.id)}
        >
          <Thumb>
            <MonitorPlay size={16} />
          </Thumb>
          <span className="designer-option-main">
            <span className="designer-option-name">
              {s.name}
              {onboard && (
                <span className="designer-badge designer-badge--good">
                  <CircleCheck size={12} aria-hidden="true" /> runs on the controller
                </span>
              )}
              {!onboard && fit.shared.length > 0 && (
                <span className="designer-badge designer-badge--good">
                  via {fit.shared.map((p) => PROTOCOL_LABELS[p] ?? p).join(' / ')}
                </span>
              )}
              {fit.ok && fit.links.includes('unverified') && (
                <span className="designer-badge designer-badge--warn">verify</span>
              )}
              {s.foss === true && (
                <span className="designer-badge designer-badge--neutral">FOSS</span>
              )}
            </span>
            <span className="designer-option-meta">
              {[
                s.platforms.length ? s.platforms.join(' / ') : null,
                s.outputProtocols.length
                  ? `sends ${s.outputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join(', ')}`
                  : null,
                s.license,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <RowNote issues={fit.issues} />
          </span>
          <span className="designer-option-price">{s.price.text ?? s.priceText ?? ''}</span>
        </button>
        <Link className="designer-option-link" to={s.path}>
          details
        </Link>
      </li>
    );
  };

  return (
    <div className="designer-picker">
      <p className="designer-picker-count">
        {controllers.length === 0
          ? 'Choose a controller to see which software can drive it.'
          : `Software that reaches ${controllers
              .map(
                (c) =>
                  `${c.name}${c.inputProtocols.length ? ` (${c.inputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join('/')})` : ''}`
              )
              .join(', ')}: over a shared network protocol, or running on the controller itself.`}
      </p>
      {unverified.length > 0 && (
        <p className="designer-picker-hint">
          <span className="designer-badge designer-badge--warn">verify</span> The database doesn’t
          record which protocols {unverified.map((c) => c.name).join(' or ')} accepts
          {unverified.some((c) => c.kind !== 'controller')
            ? ' (a dev board takes them from its firmware)'
            : ''}
          , so these can’t be confirmed here: check its documentation.
        </p>
      )}
      <div className="designer-picker-tools">
        <label className="designer-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search software…"
            aria-label="Search pattern software"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="designer-check">
          <input
            type="checkbox"
            checked={fossOnly}
            onChange={(e) => setFossOnly(e.target.checked)}
          />
          Open source only
        </label>
      </div>
      <ul className="designer-options">
        {(allStandalone || selected === STANDALONE) && (
          <li
            className={`designer-option${selected === STANDALONE ? ' designer-option--selected' : ''}`}
            data-id={STANDALONE}
          >
            <button
              type="button"
              aria-pressed={selected === STANDALONE}
              onClick={() => onSelect(selected === STANDALONE ? '' : STANDALONE)}
            >
              <Thumb>
                <MonitorPlay size={16} />
              </Thumb>
              <span className="designer-option-main">
                <span className="designer-option-name">
                  Standalone playback
                  <span className="designer-badge designer-badge--good">
                    <CircleCheck size={12} aria-hidden="true" /> no computer needed
                  </span>
                </span>
                <span className="designer-option-meta">
                  The controller plays stored sequences or built-in effects by itself.
                </span>
              </span>
            </button>
          </li>
        )}
        {fits.map((r) => row(r, true))}
      </ul>
      {unfit.length > 0 && (
        <>
          <button
            type="button"
            className="btn btn--ghost btn--sm designer-picker-more"
            aria-expanded={showUnfit}
            onClick={() => setShowUnfit((v) => !v)}
          >
            {showUnfit ? 'Hide' : 'Show'} the {unfit.length} that can’t reach{' '}
            {controllers.length === 1 ? 'it' : 'them all'}
          </button>
          {showUnfit && (
            <ul className="designer-options designer-options--unfit">
              {unfit.map((r) => row(r, false))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
