import { Zap } from 'lucide-react';
import {
  fmt,
  fmtAmps,
  fmtInt,
  fmtMeters,
  fmtVolts,
  fmtWatts,
  FUSE_MARGIN,
  LIMITS,
  SUPPLY_LOAD_FACTOR,
  SUPPLY_MAX_AMPS,
  WIRE_DROP_FRACTION,
  type Analysis,
  type Design,
} from '~/lib/designer';
import { Cell, IssueList, labelIssues, NumberField } from './parts';

interface PowerPanelProps {
  analysis: Analysis;
  onChange: (patch: Partial<Design>) => void;
}

export function PowerPanel({ analysis, onChange }: PowerPanelProps) {
  const { design, power, groups } = analysis;
  const dimmed = design.brightness < 100;
  const multi = groups.length > 1;
  const powerIssues = analysis.issues.filter((i) => i.slot === 'power');
  const planned = groups.filter((g) => g.power);

  return (
    <section
      className="designer-card designer-power"
      id="designer-power"
      aria-labelledby="designer-power-title"
    >
      <h2 className="designer-card-title" id="designer-power-title">
        <Zap size={16} aria-hidden="true" /> Power plan
      </h2>

      <div className="designer-settings">
        <div className="designer-setting designer-setting--wide">
          <label htmlFor="designer-brightness">Design for</label>
          <div className="designer-setting-control">
            <input
              id="designer-brightness"
              type="range"
              min={5}
              max={100}
              step={5}
              value={design.brightness}
              onChange={(e) => onChange({ brightness: Number(e.target.value) })}
            />
            <NumberField
              label="Design brightness in percent"
              value={design.brightness}
              min={LIMITS.brightness[0]}
              max={LIMITS.brightness[1]}
              onCommit={(brightness) => onChange({ brightness })}
            />
            <span>% of full white</span>
          </div>
          <p className="designer-setting-hint">
            Supplies, feeds, fuses and wire are sized for this. Only lower it if the controller
            enforces the same limit (a brightness cap or current limiter).
          </p>
        </div>
        <div className="designer-setting">
          <label htmlFor="designer-feed-amps">Most per power feed</label>
          <div className="designer-setting-control">
            <NumberField
              id="designer-feed-amps"
              label="Most amps per power feed"
              integer={false}
              value={design.feedAmps}
              min={LIMITS.feedAmps[0]}
              max={LIMITS.feedAmps[1]}
              onCommit={(feedAmps) => onChange({ feedAmps })}
            />
            <span>A</span>
          </div>
          <p className="designer-setting-hint">About 4 A suits typical strip copper.</p>
        </div>
        <div className="designer-setting">
          <label htmlFor="designer-wire">Feed wire length</label>
          <div className="designer-setting-control">
            <NumberField
              id="designer-wire"
              label="Feed wire length in metres, one way"
              integer={false}
              value={design.wireMeters}
              min={LIMITS.wireMeters[0]}
              max={LIMITS.wireMeters[1]}
              onCommit={(wireMeters) => onChange({ wireMeters })}
            />
            <span>m</span>
          </div>
          <p className="designer-setting-hint">
            Supply to feed point, one way ({fmt(design.wireMeters * 3.28084, 1)} ft).
          </p>
        </div>
        <div className="designer-setting">
          <label htmlFor="designer-fps">Refresh target</label>
          <div className="designer-setting-control">
            <NumberField
              id="designer-fps"
              label="Target refresh rate in frames per second"
              value={design.targetFps}
              min={LIMITS.targetFps[0]}
              max={LIMITS.targetFps[1]}
              onCommit={(targetFps) => onChange({ targetFps })}
            />
            <span>fps</span>
          </div>
          <p className="designer-setting-hint">Strings too long to reach it are flagged.</p>
        </div>
        <div className="designer-setting">
          <label className="designer-check">
            <input
              type="checkbox"
              checked={design.outdoor}
              onChange={(e) => onChange({ outdoor: e.target.checked })}
            />
            Installed outdoors
          </label>
          <p className="designer-setting-hint">Checks connector and enclosure sealing.</p>
        </div>
      </div>

      {power.pixels === 0 ? (
        <p className="designer-empty">Choose a pixel type to see the numbers.</p>
      ) : (
        <>
          <dl className="designer-stats">
            <div>
              <dt>Pixels</dt>
              <dd>{fmtInt(power.pixels)}</dd>
            </div>
            <div>
              <dt>Full white</dt>
              <dd data-testid="max-watts">{fmtWatts(power.maxWatts)}</dd>
            </div>
            {dimmed && (
              <div>
                <dt>At {fmtInt(design.brightness)}%</dt>
                <dd>{fmtWatts(power.designWatts)}</dd>
              </div>
            )}
            {power.idleWatts > 0 && (
              <div>
                <dt>All dark</dt>
                <dd>
                  {power.idleComplete ? '' : '≥ '}
                  {fmtWatts(power.idleWatts)}
                </dd>
              </div>
            )}
            {analysis.universes > 0 && (
              <div>
                <dt>Universes</dt>
                <dd>{fmtInt(analysis.universes)}</dd>
              </div>
            )}
          </dl>

          <IssueList issues={powerIssues.filter((i) => i.group == null)} />

          <h3 className="designer-subtitle">Supplies</h3>
          <table className="designer-table designer-table--stack">
            <thead>
              <tr>
                <th scope="col">Rail</th>
                <th scope="col">Full white</th>
                <th scope="col">{dimmed ? `At ${fmtInt(design.brightness)}%` : 'Current'}</th>
                <th scope="col">Supply</th>
              </tr>
            </thead>
            <tbody>
              {power.rails.map((rail) => (
                <tr key={rail.voltage} data-rail={rail.voltage}>
                  <Cell label="Rail" head>
                    {fmtVolts(rail.voltage)}
                    {power.rails.length > 1 && (
                      <small> {rail.groups.map((i) => groups[i].label).join(', ')}</small>
                    )}
                  </Cell>
                  <Cell label="Full white">{fmtWatts(rail.maxWatts)}</Cell>
                  <Cell label={dimmed ? `At ${fmtInt(design.brightness)}%` : 'Current'}>
                    {dimmed ? `${fmtWatts(rail.designWatts)} · ` : ''}
                    {fmtAmps(rail.designAmps)}
                  </Cell>
                  <Cell label="Supply">
                    <strong>
                      {rail.supply.count > 1 ? `${rail.supply.count} × ` : ''}
                      {fmtInt(rail.supply.watts)} W
                    </strong>{' '}
                    or more
                  </Cell>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 className="designer-subtitle">Power feeds, fuses and wire</h3>
          <table className="designer-table designer-table--stack">
            <thead>
              <tr>
                <th scope="col">Strings</th>
                <th scope="col">Each draws</th>
                <th scope="col">Feed power at</th>
                <th scope="col">Fuse each feed</th>
                <th scope="col">Feed wire</th>
              </tr>
            </thead>
            <tbody>
              {planned.flatMap((g) =>
                (g.power?.strings ?? []).map((s) => (
                  <tr key={`${g.index}-${s.pixels}`} data-group={g.index}>
                    <Cell label="Strings" head>
                      {multi && <small>{g.label}: </small>}
                      {s.count} × {fmtInt(s.pixels)} px
                    </Cell>
                    <Cell label="Each draws">{fmtAmps(s.designAmps)}</Cell>
                    <Cell label="Feed power at">
                      {s.feeds === 1 ? (
                        'the start only'
                      ) : (
                        <>
                          <strong>{s.feeds} points</strong>, about every {fmtInt(s.spacing)} px (
                          {fmtAmps(s.feedAmps)} each)
                        </>
                      )}
                    </Cell>
                    <Cell label="Fuse each feed">
                      {s.fuseAmps != null ? `${fmt(s.fuseAmps, 1)} A` : 'split further'}
                    </Cell>
                    <Cell label="Feed wire">
                      {s.wire.ok ? '' : 'beyond '}
                      {s.wire.awg} AWG
                      <small> ({fmt(s.wire.dropFraction * 100, 1)}% drop)</small>
                    </Cell>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <IssueList
            issues={labelIssues(
              powerIssues.filter((i) => i.group != null),
              analysis
            )}
          />

          <p className="designer-footnote">
            Full white is the datasheet maximum (every channel fully on); real shows draw less, but
            wiring and fuses must survive it. Rules of thumb used here: supplies run at no more than{' '}
            {fmtInt(SUPPLY_LOAD_FACTOR * 100)}% of their rating and no more than {SUPPLY_MAX_AMPS} A
            each; a fuse is rated {fmtInt((FUSE_MARGIN - 1) * 100)}% above its feed; feed wire may
            lose {fmtInt(WIRE_DROP_FRACTION * 100)}% of the rail over {fmtMeters(design.wireMeters)}{' '}
            each way and must be rated for its fuse. These are starting points, not an electrical
            design.
          </p>
        </>
      )}
    </section>
  );
}
