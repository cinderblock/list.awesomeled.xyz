import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeftRight, Cable, Copy, Cpu, Lightbulb, Rows3, Trash2 } from 'lucide-react';
import {
  controllerPrice,
  dataVoltage,
  DEFAULTS,
  describeLayout,
  costOf,
  fmtAmps,
  fmtCost,
  fmtFps,
  fmtHz,
  fmtInt,
  fmtUsd,
  fmtVolts,
  fmtWatts,
  LIMITS,
  maxPixelsForFps,
  parseLayout,
  PROTOCOL_LABELS,
  stringLengths,
  type Analysis,
  type Catalog,
  type GroupAnalysis,
  type GroupDesign,
  type Issue,
  type Layout,
  type Slot,
} from '~/lib/designer';
import { Tooltip } from '~/components/ui/Tooltip';
import { ControllerPicker } from './ControllerPicker';
import { ConnectorPicker, ShifterPicker } from './PartPickers';
import { PixelPicker } from './PixelPicker';
import { IssueList, NumberField } from './parts';
import { SlotRow } from './SlotRow';

// [strings, pixels per string]: a strip, a few runs, a house outline
const LAYOUT_PRESETS: [number, number][] = [
  [1, 60],
  [1, 150],
  [4, 250],
  [8, 500],
  [16, 680],
];

interface GroupCardProps {
  group: GroupAnalysis;
  analysis: Analysis;
  catalog: Catalog;
  /** Which of this group's slots has its picker open */
  open: Slot | null;
  onOpen: (slot: Slot | null) => void;
  onChange: (patch: Partial<GroupDesign>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

function issuesFor(group: GroupAnalysis, slot: Slot): Issue[] {
  return group.issues.filter((i) => i.slot === slot);
}

function LayoutEditor({
  group,
  targetFps,
  onChange,
}: {
  group: GroupAnalysis;
  targetFps: number;
  onChange: (layout: Layout) => void;
}) {
  const { layout, pixel, fps } = group;
  const varied = !!layout.lengths;
  // Free-text lengths keep whatever is being typed; the layout follows as
  // soon as it parses to at least two strings.
  const [lengthsDraft, setLengthsDraft] = useState<string | null>(null);
  const reach = pixel ? maxPixelsForFps(pixel, targetFps) : null;
  const id = `g${group.index}`;

  return (
    <div className="designer-layout-row" id={`slot-${id}-layout`} data-slot={`${id}-layout`}>
      <span className="designer-slot-icon" aria-hidden="true">
        <Rows3 size={18} />
      </span>
      <div className="designer-slot-main">
        <h3 className="designer-slot-label">Layout</h3>
        {!varied ? (
          <div className="designer-layout-fields">
            <NumberField
              label="Number of strings"
              value={layout.strings}
              min={1}
              max={LIMITS.strings}
              onCommit={(strings) => onChange({ strings, perString: layout.perString })}
            />
            <span>{layout.strings === 1 ? 'string of' : 'strings of'}</span>
            <NumberField
              label="Pixels per string"
              value={layout.perString}
              min={1}
              max={LIMITS.perString}
              onCommit={(perString) => onChange({ strings: layout.strings, perString })}
            />
            <span>pixels</span>
            <strong className="designer-layout-total">= {fmtInt(group.pixels)} pixels</strong>
          </div>
        ) : (
          <div className="designer-layout-fields">
            <input
              type="text"
              inputMode="numeric"
              className="designer-number designer-number--wide"
              aria-label="Pixels on each string, separated by commas"
              placeholder="150, 200, 80"
              value={lengthsDraft ?? (layout.lengths ?? []).join(', ')}
              onChange={(e) => {
                setLengthsDraft(e.target.value);
                const next = parseLayout('', e.target.value);
                if (next.lengths) onChange(next);
              }}
              onBlur={() => setLengthsDraft(null)}
            />
            <strong className="designer-layout-total">
              = {fmtInt(group.pixels)} pixels on {layout.strings} strings
            </strong>
          </div>
        )}
        <div className="designer-layout-presets">
          {LAYOUT_PRESETS.map(([strings, perString]) => (
            <button
              key={`${strings}x${perString}`}
              type="button"
              className={`designer-chip${!varied && strings === layout.strings && perString === layout.perString ? ' designer-chip--on' : ''}`}
              onClick={() => {
                setLengthsDraft(null);
                onChange({ strings, perString });
              }}
            >
              {strings} × {perString}
            </button>
          ))}
          <button
            type="button"
            className={`designer-chip${varied ? ' designer-chip--on' : ''}`}
            aria-pressed={varied}
            onClick={() => {
              setLengthsDraft(null);
              if (varied) {
                onChange({ strings: layout.strings, perString: layout.perString });
              } else {
                // Two strings minimum, so the list reads as a list
                const lengths = stringLengths(
                  layout.strings > 1
                    ? { ...layout, strings: Math.min(layout.strings, LIMITS.variedStrings) }
                    : { strings: 2, perString: layout.perString }
                );
                onChange({ strings: lengths.length, perString: Math.max(...lengths), lengths });
              }
            }}
          >
            different lengths
          </button>
        </div>
        {pixel && fps != null && (
          <p className="designer-slot-facts">
            Refresh ceiling <strong>{fmtFps(fps)}</strong>:{' '}
            {pixel.bitrateHz ? fmtHz(pixel.bitrateHz) : ''} ÷ ({pixel.bitsPerPixel} bits ×{' '}
            {fmtInt(layout.perString)} pixels{varied ? ' on the longest string' : ''}).
            {reach != null && (
              <>
                {' '}
                Up to {fmtInt(reach)} pixels per string keep {fmtInt(targetFps)} fps; strings on
                separate outputs refresh in parallel.
              </>
            )}
          </p>
        )}
        {pixel && fps == null && (
          <p className="designer-slot-facts">
            Refresh ceiling unknown: {pixel.name}’s data rate isn’t recorded.
          </p>
        )}
        <IssueList issues={issuesFor(group, 'layout')} className="designer-slot-issues" />
      </div>
    </div>
  );
}

export function GroupCard({
  group,
  analysis,
  catalog,
  open,
  onOpen,
  onChange,
  onDuplicate,
  onRemove,
}: GroupCardProps) {
  const { pixel, controller, shifter, connector, power } = group;
  const { design } = analysis;
  const id = `g${group.index}`;
  const multi = analysis.groups.length > 1;
  const toggle = (slot: Slot) => () => onOpen(open === slot ? null : slot);

  // What other groups already put on each controller
  const others = new Map<string, { strings: number; pixels: number }>();
  for (const g of analysis.groups) {
    if (g.index === group.index || !g.controller) continue;
    const load = others.get(g.controller.id) ?? { strings: 0, pixels: 0 };
    load.strings += g.layout.strings;
    load.pixels += g.pixels;
    others.set(g.controller.id, load);
  }

  // Parts to buy for this group: fewer than pixels when one chip drives several
  const pixelParts = pixel ? Math.ceil(group.pixels / pixel.pixelsPerPart) : 0;
  const pixelCost = pixel ? costOf(pixel.price, pixelParts) : null;
  const use = controller
    ? analysis.controllers.find((u) => u.controller.id === controller.id)
    : null;
  const sharedWith = use && use.groups[0] !== group.index ? analysis.groups[use.groups[0]] : null;
  const controllerCost =
    controller && use
      ? controllerPrice(controller, use.units, Math.ceil(use.pixels / use.units))
      : null;
  const shifterCost =
    shifter && group.shifterFit ? costOf(shifter.price, group.shifterFit.qty) : null;
  const level = group.controllerFit?.level ?? 'unknown';
  const out = controller ? dataVoltage(controller) : null;

  return (
    <section className="designer-group" data-group={group.index} aria-label={group.label}>
      <header className="designer-group-head">
        <h2 className="designer-group-title">
          {multi ? `Pixel group ${group.index + 1}` : 'Pixels'}
        </h2>
        <input
          type="text"
          className="designer-group-name"
          aria-label={`Name for pixel group ${group.index + 1}`}
          placeholder="Name it (roof line, tree…)"
          maxLength={LIMITS.groupName}
          value={group.design.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <div className="designer-group-actions">
          <Tooltip content="Duplicate this group">
            <button
              type="button"
              className="btn btn--ghost btn--icon designer-icon-btn"
              aria-label={`Duplicate ${group.label}`}
              onClick={onDuplicate}
              disabled={analysis.groups.length >= LIMITS.groups}
            >
              <Copy size={16} />
            </button>
          </Tooltip>
          <Tooltip content={multi ? 'Remove this group' : 'Clear this group'}>
            <button
              type="button"
              className="btn btn--ghost btn--icon designer-icon-btn designer-icon-btn--danger"
              aria-label={`${multi ? 'Remove' : 'Clear'} ${group.label}`}
              onClick={onRemove}
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      </header>

      <SlotRow
        id={`${id}-pixels`}
        icon={<Lightbulb size={18} />}
        label="Pixel type"
        filled={!!pixel}
        open={open === 'pixels'}
        onToggle={toggle('pixels')}
        action={pixel ? 'Change' : 'Choose'}
        issues={issuesFor(group, 'pixels')}
        price={
          pixelCost ? (
            <Tooltip
              content={`${pixel?.price.vendor ?? 'Distributor'} price for the bare ${pixel?.kind === 'ic' ? 'chip' : 'LED'}${pixelCost.tier.qty > 1 ? ` at ${fmtInt(pixelCost.tier.qty)}+` : ''} (${fmtCost(pixelCost.unitUSD, pixelCost.unitMaxUSD, pixelCost.from)} each). Strips, strings and modules cost more.`}
            >
              <span>≈ {fmtCost(pixelCost.totalUSD, pixelCost.totalMaxUSD, pixelCost.from)}</span>
            </Tooltip>
          ) : undefined
        }
        summary={
          pixel ? (
            <>
              <Link className="designer-part-name" to={pixel.path}>
                {pixel.name}
              </Link>
              {pixel.kind === 'ic' && (
                <span className="designer-badge designer-badge--neutral">driver IC</span>
              )}
              <span className="designer-slot-facts">
                {[
                  fmtVolts(group.voltage),
                  pixel.clocked == null
                    ? null
                    : pixel.clocked
                      ? 'clocked (data + clock)'
                      : 'data-only (one wire)',
                  pixel.channels === 3 ? null : `${pixel.channels} channels`,
                  pixel.pixelsPerPart > 1 ? `${pixel.pixelsPerPart} pixels per chip` : null,
                  power ? `${fmtWatts(power.pixelMaxWatts)} at full white` : null,
                  pixel.bitrateHz ? fmtHz(pixel.bitrateHz) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              {pixel.voltageChoices.length > 1 && (
                <span className="designer-voltage">
                  <span>String voltage</span>
                  <span className="designer-segmented" role="group" aria-label="String voltage">
                    {pixel.voltageChoices.map((v) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={v === group.voltage}
                        className={v === group.voltage ? 'designer-segmented--on' : ''}
                        onClick={() => onChange({ voltage: v === pixel.voltage ? null : v })}
                      >
                        {fmtVolts(v)}
                      </button>
                    ))}
                  </span>
                </span>
              )}
            </>
          ) : (
            <span className="designer-slot-empty">
              {group.design.pixel
                ? `“${group.design.pixel}” is no longer in the database.`
                : 'An integrated pixel such as WS2812, or a driver IC such as WS2811.'}
            </span>
          )
        }
      >
        <PixelPicker
          pixels={catalog.pixels}
          selectedId={pixel?.id ?? ''}
          controller={controller}
          onSelect={(pixelId) => {
            onChange({ pixel: pixelId, voltage: null });
            onOpen(null);
          }}
        />
      </SlotRow>

      <LayoutEditor
        group={group}
        targetFps={design.targetFps}
        onChange={(layout) => onChange({ layout })}
      />

      <SlotRow
        id={`${id}-controller`}
        icon={<Cpu size={18} />}
        label="Controller"
        filled={!!controller}
        open={open === 'controller'}
        onToggle={toggle('controller')}
        action={controller ? 'Change' : 'Choose'}
        issues={issuesFor(group, 'controller')}
        price={
          controller ? (
            sharedWith ? (
              <span className="designer-slot-facts">shared</span>
            ) : controllerCost?.totalUSD != null ? (
              <Tooltip content={controllerCost.priceNote}>
                <span>
                  {use && use.units > 1
                    ? fmtCost(
                        controllerCost.totalUSD,
                        controllerCost.totalMaxUSD,
                        controllerCost.from
                      )
                    : (controller.price.text ?? fmtUsd(controllerCost.totalUSD))}
                </span>
              </Tooltip>
            ) : (
              <span className="designer-slot-facts">no price</span>
            )
          ) : undefined
        }
        summary={
          controller ? (
            <>
              <Link className="designer-part-name" to={controller.path}>
                {controller.name}
              </Link>
              {use && use.units > 1 && (
                <span className="designer-badge designer-badge--neutral">{use.units} units</span>
              )}
              {controller.kind === 'board' && (
                <span className="designer-badge designer-badge--neutral">dev board</span>
              )}
              {group.controllerFit?.support === 'listed' && (
                <span className="designer-badge designer-badge--good">listed support</span>
              )}
              {group.controllerFit?.support === 'family' && (
                <span className="designer-badge designer-badge--good">
                  lists {group.controllerFit.supportVia}
                </span>
              )}
              <span className="designer-slot-facts">
                {[
                  controller.outputs != null && use
                    ? `${fmtInt(use.strings)} of ${fmtInt(controller.outputs * use.units)} outputs used`
                    : null,
                  sharedWith ? `shared with ${sharedWith.label}` : null,
                  controller.inputProtocols.length
                    ? controller.inputProtocols.map((p) => PROTOCOL_LABELS[p] ?? p).join(' / ')
                    : null,
                  controller.standalone ? 'plays standalone' : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </>
          ) : (
            <span className="designer-slot-empty">
              {group.design.controller
                ? `“${group.design.controller}” is no longer in the database.`
                : `What turns network data into pixel signals${pixel ? ` for ${describeLayout(group.layout)} ${pixel.name}` : ''}.`}
            </span>
          )
        }
      >
        <ControllerPicker
          controllers={catalog.controllers}
          group={group}
          others={others}
          targetFps={design.targetFps}
          outdoor={design.outdoor}
          onSelect={(controllerId) => {
            onChange({ controller: controllerId });
            if (controllerId) onOpen(null);
          }}
        />
      </SlotRow>

      <SlotRow
        id={`${id}-shifter`}
        icon={<ArrowLeftRight size={18} />}
        label="Level shifter"
        filled={!!shifter}
        open={open === 'shifter'}
        onToggle={toggle('shifter')}
        action={shifter ? 'Change' : 'Add'}
        issues={issuesFor(group, 'shifter')}
        price={
          shifterCost
            ? fmtCost(shifterCost.totalUSD, shifterCost.totalMaxUSD, shifterCost.from)
            : undefined
        }
        summary={
          shifter ? (
            <>
              <Link className="designer-part-name" to={shifter.path}>
                {shifter.name}
              </Link>
              <span className="designer-slot-facts">
                {group.shifterFit?.qty} needed for {group.dataLines} data line
                {group.dataLines === 1 ? '' : 's'}
              </span>
            </>
          ) : (
            <span className="designer-slot-empty">
              {group.design.shifter
                ? `“${group.design.shifter}” is no longer in the database.`
                : level === 'ok' && controller && out != null
                  ? `Not needed: ${controller.name} already sends ${fmtVolts(out)} data.`
                  : level === 'required'
                    ? 'Needed here: see the warning below.'
                    : 'Only needed when a 3.3 V controller drives 5 V pixels.'}
            </span>
          )
        }
      >
        <ShifterPicker
          shifters={catalog.shifters}
          group={group}
          onSelect={(shifterId) => {
            onChange({ shifter: shifterId });
            onOpen(null);
          }}
        />
      </SlotRow>

      <SlotRow
        id={`${id}-connector`}
        icon={<Cable size={18} />}
        label="Connector"
        filled={!!connector}
        open={open === 'connector'}
        onToggle={toggle('connector')}
        action={connector ? 'Change' : 'Add'}
        issues={issuesFor(group, 'connector')}
        summary={
          connector ? (
            <>
              <Link className="designer-part-name" to={connector.path}>
                {connector.name}
              </Link>
              {group.connectorFit?.matchesController && (
                <span className="designer-badge designer-badge--good">on {controller?.name}</span>
              )}
              <span className="designer-slot-facts">
                {[
                  `${fmtInt(group.layout.strings)} pair${group.layout.strings === 1 ? '' : 's'}, ${group.connectorFit?.wires} conductors each`,
                  connector.contactAmps != null
                    ? `${fmtAmps(connector.contactAmps)} per contact`
                    : null,
                  connector.ipText,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </>
          ) : (
            <span className="designer-slot-empty">
              {group.design.connector
                ? `“${group.design.connector}” is no longer in the database.`
                : controller?.outputConnector
                  ? `Optional. ${controller.name}’s outputs are ${controller.outputConnector.label}.`
                  : 'Optional. How each string plugs in.'}
            </span>
          )
        }
      >
        <ConnectorPicker
          connectors={catalog.connectors}
          group={group}
          outdoor={design.outdoor}
          onSelect={(connectorId) => {
            onChange({ connector: connectorId });
            onOpen(null);
          }}
        />
      </SlotRow>

      {group.design.layout.perString === DEFAULTS.perString &&
        group.design.layout.strings === 1 &&
        !pixel &&
        !controller && (
          <p className="designer-group-hint">
            Start with the pixel type, set how many strings and how long, then pick a controller.
            Any order works: the lists adapt to what you have chosen.
          </p>
        )}
    </section>
  );
}
