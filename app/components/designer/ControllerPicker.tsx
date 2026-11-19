import { useState } from 'react';
import { Link } from 'react-router';
import { CircleCheck, Cpu, Search } from 'lucide-react';
import {
  controllerPrice,
  describeLayout,
  evaluateController,
  fmtCost,
  fmtInt,
  fmtUsd,
  fmtVolts,
  isRetired,
  PROTOCOL_LABELS,
  type ControllerFit,
  type ControllerOption,
  type GroupAnalysis,
} from '~/lib/designer';
import { SeverityIcon, Thumb } from './parts';

interface ControllerPickerProps {
  controllers: ControllerOption[];
  group: GroupAnalysis;
  /** Strings and pixels other groups already put on each controller, by controller id */
  others: Map<string, { strings: number; pixels: number }>;
  targetFps: number;
  outdoor: boolean;
  onSelect: (id: string) => void;
}

type Sort = 'price' | 'outputs' | 'name';

interface Candidate {
  controller: ControllerOption;
  fit: ControllerFit;
  totalUSD: number | null;
  /** High end when the price is a published range */
  totalMaxUSD: number | null;
  /** A starting price */
  from: boolean;
  unitText: string | null;
}

function priceLabel(c: Candidate): { main: string; sub?: string } {
  if (c.totalUSD == null) return { main: c.unitText ?? '—' };
  if (c.fit.units > 1) {
    return {
      main: fmtCost(c.totalUSD, c.totalMaxUSD, c.from),
      sub: `${c.fit.units} × ${c.unitText ?? fmtUsd(c.totalUSD / c.fit.units)}`,
    };
  }
  return { main: c.unitText ?? fmtUsd(c.totalUSD) };
}

function OptionRow({
  candidate,
  selected,
  onSelect,
}: {
  candidate: Candidate;
  selected: boolean;
  onSelect?: () => void;
}) {
  const { controller: c, fit } = candidate;
  const price = priceLabel(candidate);
  const errors = fit.issues.filter((i) => i.severity === 'error');
  const warning = fit.issues.find((i) => i.severity === 'warning' && i.code !== 'retired');
  const meta = [
    c.outputs != null ? `${fmtInt(c.outputs)} output${c.outputs === 1 ? '' : 's'}` : 'outputs?',
    c.maxPerOutput != null ? `${fmtInt(c.maxPerOutput)} px/output` : null,
    c.inputProtocols.length
      ? c.inputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join('/')
      : c.inputs.length
        ? c.inputs.join(', ')
        : null,
    c.standalone ? 'standalone' : null,
    c.kind === 'board' && c.dataVoltage != null ? `${fmtVolts(c.dataVoltage)} data pins` : null,
    c.requiresHost ? `needs ${c.requiresHost}` : null,
  ].filter(Boolean);

  return (
    <li
      className={`designer-option${selected ? ' designer-option--selected' : ''}${onSelect ? '' : ' designer-option--unfit'}`}
      data-id={c.id}
    >
      <button type="button" onClick={onSelect} disabled={!onSelect} aria-pressed={selected}>
        <Thumb src={c.image}>{c.kind === 'board' ? <Cpu size={16} /> : null}</Thumb>
        <span className="designer-option-main">
          <span className="designer-option-name">
            {c.name}
            {fit.units > 1 && fit.ok && (
              <span className="designer-badge designer-badge--neutral">{fit.units} units</span>
            )}
            {fit.support === 'listed' && (
              <span className="designer-badge designer-badge--good">
                <CircleCheck size={12} aria-hidden="true" /> listed support
              </span>
            )}
            {fit.support === 'family' && (
              <span className="designer-badge designer-badge--good">
                <CircleCheck size={12} aria-hidden="true" /> lists {fit.supportVia}
              </span>
            )}
            {c.kind === 'board' && (
              <span className="designer-badge designer-badge--neutral">
                <Cpu size={12} aria-hidden="true" /> dev board
              </span>
            )}
            {isRetired(c.status) && (
              <span className="designer-badge designer-badge--warn">discontinued</span>
            )}
          </span>
          <span className="designer-option-meta">{meta.join(' · ')}</span>
          {errors.map((issue) => (
            <span key={issue.code} className="designer-option-note designer-option-note--error">
              <SeverityIcon severity="error" size={13} /> {issue.message}
            </span>
          ))}
          {errors.length === 0 && warning && (
            <span className="designer-option-note designer-option-note--warning">
              <SeverityIcon severity="warning" size={13} /> {warning.message}
            </span>
          )}
        </span>
        <span className="designer-option-price">
          {price.main}
          {price.sub && <small>{price.sub}</small>}
        </span>
      </button>
      <Link className="designer-option-link" to={c.path}>
        details
      </Link>
    </li>
  );
}

export function ControllerPicker({
  controllers,
  group,
  others,
  targetFps,
  outdoor,
  onSelect,
}: ControllerPickerProps) {
  const selectedId = group.controller?.id ?? '';
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('price');
  const [showRetired, setShowRetired] = useState(false);
  // Someone who arrives with a dev board selected is on the DIY path already
  const [showBoards, setShowBoards] = useState(group.controller?.kind === 'board');
  const [showUnfit, setShowUnfit] = useState(false);

  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const candidates: Candidate[] = controllers
    .filter((c) => {
      if (c.id === selectedId) return true;
      if (!showRetired && isRetired(c.status)) return false;
      if (!showBoards && c.kind === 'board') return false;
      const haystack = c.name.toLowerCase();
      return words.every((w) => haystack.includes(w));
    })
    .map((controller) => {
      const other = others.get(controller.id);
      const totalStrings = group.layout.strings + (other?.strings ?? 0);
      const totalPixels = group.pixels + (other?.pixels ?? 0);
      const fit = evaluateController(controller, {
        pixel: group.pixel,
        voltage: group.voltage,
        layout: group.layout,
        totalStrings,
        totalPixels,
        power: group.power,
        targetFps,
        outdoor,
        hasShifter: !!group.shifter,
      });
      const cost = controllerPrice(controller, fit.units, Math.ceil(totalPixels / fit.units));
      return {
        controller,
        fit,
        totalUSD: cost.totalUSD,
        totalMaxUSD: cost.totalMaxUSD,
        from: cost.from,
        unitText: controller.price.text ?? (cost.unitUSD != null ? fmtUsd(cost.unitUSD) : null),
      };
    });

  const compare: Record<Sort, (a: Candidate, b: Candidate) => number> = {
    price: (a, b) => (a.totalUSD ?? Infinity) - (b.totalUSD ?? Infinity),
    outputs: (a, b) =>
      (a.controller.outputs ?? Infinity) * a.fit.units -
      (b.controller.outputs ?? Infinity) * b.fit.units,
    name: () => 0,
  };
  const byName = (a: Candidate, b: Candidate) =>
    a.controller.name.localeCompare(b.controller.name, 'en', { numeric: true });
  const sorted = [...candidates].sort((a, b) => compare[sort](a, b) || byName(a, b));

  const selected = sorted.find((c) => c.controller.id === selectedId);
  const fits = sorted.filter((c) => c.fit.ok && c.controller.id !== selectedId);
  const unfit = sorted.filter((c) => !c.fit.ok && c.controller.id !== selectedId);
  const target = group.pixel
    ? `${describeLayout(group.layout)} ${group.pixel.name}`
    : `${describeLayout(group.layout)} pixels`;

  return (
    <div className="designer-picker">
      <div className="designer-picker-tools">
        <label className="designer-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search controllers…"
            aria-label="Search controllers"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="designer-select">
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="price">Total price</option>
            <option value="outputs">Fewest spare outputs</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div className="designer-picker-filters">
        <label className="designer-check">
          <input
            type="checkbox"
            checked={showBoards}
            onChange={(e) => setShowBoards(e.target.checked)}
          />
          Bare dev boards (ESP32, Teensy, Pi…)
        </label>
        <label className="designer-check">
          <input
            type="checkbox"
            checked={showRetired}
            onChange={(e) => setShowRetired(e.target.checked)}
          />
          Discontinued
        </label>
      </div>

      {selected && (
        <ul className="designer-options" aria-label="Selected controller">
          <OptionRow candidate={selected} selected onSelect={() => onSelect('')} />
        </ul>
      )}

      <p className="designer-picker-count" role="status">
        {fmtInt(fits.length + (selected?.fit.ok ? 1 : 0))} controller
        {fits.length + (selected?.fit.ok ? 1 : 0) === 1 ? '' : 's'} can drive {target}
        {group.pixel ? '' : ' (pick pixels for a sharper list)'}.
      </p>
      <ul className="designer-options">
        {fits.map((candidate) => (
          <OptionRow
            key={candidate.controller.id}
            candidate={candidate}
            selected={false}
            onSelect={() => onSelect(candidate.controller.id)}
          />
        ))}
      </ul>

      {unfit.length > 0 && (
        <>
          <button
            type="button"
            className="btn btn--ghost btn--sm designer-picker-more"
            aria-expanded={showUnfit}
            onClick={() => setShowUnfit((v) => !v)}
          >
            {showUnfit ? 'Hide' : 'Show'} the {fmtInt(unfit.length)} that can’t
          </button>
          {showUnfit && (
            <ul className="designer-options designer-options--unfit">
              {unfit.map((candidate) => (
                <OptionRow key={candidate.controller.id} candidate={candidate} selected={false} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
