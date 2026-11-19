import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Link } from 'react-router';
import {
  Download,
  FolderOpen,
  ImageDown,
  Link2,
  ListChecks,
  MonitorPlay,
  Plus,
  Printer,
  RotateCcw,
  Undo2,
  Workflow,
  X,
} from 'lucide-react';
import {
  addGroup,
  analyzeDesign,
  duplicateGroup,
  emptyDesign,
  EXAMPLES,
  fmtFps,
  fmtCost,
  fmtInt,
  fmtWatts,
  importDesignFile,
  indexCatalog,
  isEmptyDesign,
  layoutDiagram,
  LIMITS,
  PROTOCOL_LABELS,
  removeGroup,
  STANDALONE,
  updateGroup,
  type Analysis,
  type Catalog,
  type GroupDesign,
  type Issue,
  type Slot,
} from '~/lib/designer';
import { RainbowText } from '~/components/ui/RainbowText';
import { BomTable } from './BomTable';
import { copyText, designUrl, downloadBlob, fileSlug } from './browser';
import { renderDiagramPng, renderDiagramSvg } from './exportDiagram';
import { GroupCard } from './GroupCard';
import { SourcePicker } from './PartPickers';
import { SeverityIcon } from './parts';
import { PowerPanel } from './PowerPanel';
import { SlotRow } from './SlotRow';
import { SystemDiagram } from './SystemDiagram';
import { useDesignState } from './useDesignState';

const DRAFT_KEY = 'awesomeledlist_designer_draft';

/** Which picker is open: a slot of one group, or the system-wide source */
interface OpenSlot {
  group: number | 'system';
  slot: Slot;
}

interface Notice {
  kind: 'ok' | 'error';
  text: string;
}

const subscribeNever = () => () => {};

function readDraft(): string | null {
  try {
    return window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
}

function slotElementId(issue: Issue): string {
  if (issue.slot === 'power') return 'designer-power';
  if (issue.slot === 'source' || issue.group == null) return 'slot-system-source';
  return `slot-g${issue.group}-${issue.slot}`;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function slotDomId(slot: OpenSlot): string {
  return slot.group === 'system' ? 'slot-system-source' : `slot-g${slot.group}-${slot.slot}`;
}

/** Once a picker has opened: bring it into view and, with a keyboard at hand, start in its search box */
function enterPicker(slot: OpenSlot) {
  const id = slotDomId(slot);
  requestAnimationFrame(() => {
    scrollToId(id);
    // Not on touch screens: focusing an input there throws up the keyboard
    if (window.matchMedia('(pointer: fine)').matches) {
      document
        .querySelector<HTMLInputElement>(`#${id}-panel input[type="search"]`)
        ?.focus({ preventScroll: true });
    }
  });
}

/** Once a picker has closed: put focus back on its slot, where the choice now shows */
function leavePicker(slot: OpenSlot) {
  const id = slotDomId(slot);
  requestAnimationFrame(() => {
    const element = document.getElementById(id);
    element
      ?.querySelector<HTMLButtonElement>('.designer-slot-toggle')
      ?.focus({ preventScroll: true });
    element?.scrollIntoView({ block: 'nearest' });
  });
}

/** No valid part chosen yet, and nothing wrong with the link either */
function nothingToCheck(analysis: Analysis): boolean {
  return (
    analysis.power.pixels === 0 && analysis.controllers.length === 0 && analysis.issues.length === 0
  );
}

function statusText(analysis: Analysis): string {
  const { error, warning, info } = analysis.counts;
  if (nothingToCheck(analysis)) return 'Nothing to check yet';
  const parts = [
    error ? `${error} problem${error === 1 ? '' : 's'}` : null,
    warning ? `${warning} warning${warning === 1 ? '' : 's'}` : null,
    info ? `${info} note${info === 1 ? '' : 's'}` : null,
  ].filter(Boolean);
  if (error) return parts.join(' · ');
  return parts.length ? `Compatible · ${parts.join(' · ')}` : 'Compatible: no problems found';
}

function Summary({ analysis }: { analysis: Analysis }) {
  const { power, bom, groups, counts } = analysis;
  const slowest = groups.reduce<number | null>(
    (min, g) => (g.fps != null && (min == null || g.fps < min) ? g.fps : min),
    null
  );
  const status = nothingToCheck(analysis)
    ? 'info'
    : counts.error
      ? 'error'
      : counts.warning
        ? 'warning'
        : 'ok';
  return (
    <section className="designer-card designer-summary" aria-labelledby="designer-summary-title">
      <h2 className="designer-card-title" id="designer-summary-title">
        Your system
      </h2>
      <dl className="designer-summary-list">
        <div>
          <dt>Pixels</dt>
          <dd data-testid="total-pixels">{fmtInt(power.pixels)}</dd>
        </div>
        <div>
          <dt>Full white</dt>
          <dd>{power.pixels ? fmtWatts(power.maxWatts) : '—'}</dd>
        </div>
        {analysis.design.brightness < 100 && (
          <div>
            <dt>At {fmtInt(analysis.design.brightness)}%</dt>
            <dd>{fmtWatts(power.designWatts)}</dd>
          </div>
        )}
        <div>
          <dt>Refresh</dt>
          <dd>{slowest != null ? fmtFps(slowest) : '—'}</dd>
        </div>
        <div>
          <dt>Parts priced so far</dt>
          <dd>
            {bom.priced > 0 ? fmtCost(bom.totalUSD, bom.totalMaxUSD, bom.open) : '—'}
            {bom.unpriced > 0 && <small> + {bom.unpriced} unpriced</small>}
          </dd>
        </div>
      </dl>
      <p className={`designer-status designer-status--${status}`} role="status" aria-live="polite">
        <SeverityIcon severity={status} />
        {statusText(analysis)}
      </p>
    </section>
  );
}

function Checks({ analysis }: { analysis: Analysis }) {
  const multi = analysis.groups.length > 1;
  const empty = nothingToCheck(analysis);
  return (
    <section
      className="designer-card designer-checks"
      id="designer-checks"
      aria-labelledby="designer-checks-title"
    >
      <h2 className="designer-card-title" id="designer-checks-title">
        <ListChecks size={16} aria-hidden="true" /> Checks
      </h2>
      {empty ? (
        <p className="designer-empty">
          Parts are checked against each other as you choose them: clock lines, output count, pixels
          per output, voltage, logic levels, current, refresh rate and protocols.
        </p>
      ) : analysis.issues.length === 0 ? (
        <p className="designer-empty">No problems found with the parts chosen so far.</p>
      ) : (
        <ul className="designer-issues designer-checks-list">
          {analysis.issues.map((issue, i) => (
            <li
              key={`${issue.code}-${issue.group ?? 's'}-${i}`}
              className={`designer-issue designer-issue--${issue.severity}`}
              data-code={issue.code}
            >
              <SeverityIcon severity={issue.severity} />
              <button type="button" onClick={() => scrollToId(slotElementId(issue))}>
                {multi && issue.group != null && (
                  <strong>{analysis.groups[issue.group].label}: </strong>
                )}
                {issue.message}
                {issue.fix && <span className="designer-issue-fix"> {issue.fix}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Designer({ catalog }: { catalog: Catalog }) {
  const { hydrated, design, canonical, update, load } = useDesignState();
  const index = useMemo(() => indexCatalog(catalog), [catalog]);
  const analysis = useMemo(() => analyzeDesign(design, index), [design, index]);
  const diagram = useMemo(() => layoutDiagram(analysis), [analysis]);
  const empty = isEmptyDesign(design);

  const [open, setOpen] = useState<OpenSlot | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [undo, setUndo] = useState<string | null>(null);
  const [draftDismissed, setDraftDismissed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // The draft is whatever was last on screen in this browser. It is only
  // offered, never applied by itself: a bare /designer link starts empty.
  const draft = useSyncExternalStore(subscribeNever, readDraft, () => null);
  useEffect(() => {
    if (!hydrated || !canonical) return;
    try {
      window.localStorage.setItem(DRAFT_KEY, canonical);
    } catch {
      // storage unavailable: the URL is still the design
    }
  }, [hydrated, canonical]);

  // A named design names its browser tab (and its bookmark)
  useEffect(() => {
    if (!hydrated) return;
    const base = 'System Designer - Awesome LED List';
    document.title = design.title ? `${design.title} · ${base}` : base;
  }, [hydrated, design.title]);

  const changeGroup = (i: number) => (patch: Partial<GroupDesign>) =>
    update((current) => updateGroup(current, i, patch));

  const toggleSlot = (group: OpenSlot['group']) => (slot: Slot | null) => {
    const next = slot ? { group, slot } : null;
    setOpen(next);
    if (next) enterPicker(next);
    else if (open) leavePicker(open);
  };

  const startOver = () => {
    setUndo(canonical);
    setOpen(null);
    setNotice(null);
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // nothing to clear
    }
    update(emptyDesign());
  };

  const importFile = async (file: File) => {
    const result = importDesignFile(new Uint8Array(await file.arrayBuffer()));
    if ('error' in result) {
      setNotice({ kind: 'error', text: result.error });
      return;
    }
    setUndo(canonical || null);
    setOpen(null);
    load(result.query);
    setNotice({ kind: 'ok', text: `Opened the design from ${file.name}.` });
  };

  const share = async () => {
    const ok = await copyText(designUrl(canonical));
    setNotice(
      ok
        ? { kind: 'ok', text: 'Link copied. Anyone who opens it sees this exact design.' }
        : { kind: 'error', text: 'Could not copy. Copy the address from your browser instead.' }
    );
  };

  const exportDiagram = async (format: 'svg' | 'png') => {
    setBusy(format);
    try {
      const svg = await renderDiagramSvg(analysis);
      const name = fileSlug(design.title);
      if (format === 'svg') {
        downloadBlob(new Blob([svg.svg], { type: 'image/svg+xml' }), `${name}.svg`);
      } else {
        const png = await renderDiagramPng(svg);
        downloadBlob(new Blob([png.slice()], { type: 'image/png' }), `${name}.png`);
      }
      setNotice({
        kind: 'ok',
        text: `Saved ${name}.${format}. The file carries the design: use Open to load it here again.`,
      });
    } catch (error) {
      setNotice({
        kind: 'error',
        text: `Could not create the ${format.toUpperCase()}: ${error instanceof Error ? error.message : 'unknown error'}`,
      });
    } finally {
      setBusy(null);
    }
  };

  const selectedControllers = analysis.controllers.map((u) => u.controller);
  const sourceIssues = analysis.issues.filter((i) => i.slot === 'source');
  const showDraft = hydrated && empty && !!draft && !draftDismissed && !undo;
  const hasPixels = analysis.power.pixels > 0;

  return (
    <div
      className={`container page-section designer-page${empty ? '' : ' designer-page--active'}`}
      data-ready={hydrated ? 'true' : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          setOpen(null);
          leavePicker(open);
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) e.preventDefault();
      }}
      onDrop={(e) => {
        const file = e.dataTransfer.files[0];
        if (!file) return;
        e.preventDefault();
        void importFile(file);
      }}
    >
      <header className="designer-hero">
        <h1 className="hero-title">
          <RainbowText>System Designer</RainbowText>
        </h1>
        <p className="designer-intro">
          Pick pixels, a controller and the parts between them. Everything is checked for
          compatibility as you go, with a power plan, a parts list and a diagram at the end. Your
          design lives in this page’s link.{' '}
          <Link to="/system-overview">New to pixel systems? See how the parts fit together.</Link>
        </p>
        {/* On paper the name field is gone, so the name is printed here */}
        {design.title.trim() && <p className="designer-print-title">{design.title.trim()}</p>}
      </header>

      <div className="designer-toolbar designer-no-print">
        <input
          type="text"
          className="designer-title-input"
          aria-label="Design name"
          placeholder="Name this design"
          maxLength={LIMITS.title}
          value={design.title}
          onChange={(e) => update((current) => ({ ...current, title: e.target.value }))}
        />
        <button type="button" className="btn btn--primary btn--sm" onClick={share} disabled={empty}>
          <Link2 size={15} aria-hidden="true" /> Copy link
        </button>
        <label className="btn btn--outline btn--sm designer-file">
          <FolderOpen size={15} aria-hidden="true" /> Open
          <input
            type="file"
            accept=".svg,.png,image/svg+xml,image/png"
            aria-label="Open a design from a downloaded SVG or PNG"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importFile(file);
              e.target.value = '';
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={startOver}
          disabled={empty}
        >
          <RotateCcw size={15} aria-hidden="true" /> Start over
        </button>
      </div>

      <div className="designer-notices" aria-live="polite">
        {notice && (
          <p className={`designer-notice designer-notice--${notice.kind}`} role="status">
            <span>{notice.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setNotice(null)}>
              <X size={14} />
            </button>
          </p>
        )}
        {undo != null && (
          <p className="designer-notice">
            <span>{empty ? 'Design cleared.' : 'A design was replaced.'}</span>
            <button
              type="button"
              className="designer-notice-action"
              onClick={() => {
                load(undo);
                setUndo(null);
                setNotice(null);
              }}
            >
              <Undo2 size={14} aria-hidden="true" /> Undo
            </button>
            <button type="button" aria-label="Dismiss" onClick={() => setUndo(null)}>
              <X size={14} />
            </button>
          </p>
        )}
        {showDraft && (
          <p className="designer-notice" data-testid="draft-notice">
            <span>You were working on a design in this browser.</span>
            <button
              type="button"
              className="designer-notice-action"
              onClick={() => load(draft ?? '')}
            >
              Continue it
            </button>
            <button
              type="button"
              aria-label="Discard the saved design"
              onClick={() => {
                try {
                  window.localStorage.removeItem(DRAFT_KEY);
                } catch {
                  // nothing to clear
                }
                setDraftDismissed(true);
              }}
            >
              <X size={14} />
            </button>
          </p>
        )}
      </div>

      <div className="designer-grid">
        <div className="designer-area-build">
          {empty && (
            <div className="designer-examples designer-no-print">
              <h2 className="designer-card-title">Start from an example</h2>
              <ul>
                {EXAMPLES.map((example) => (
                  <li key={example.title}>
                    <Link to={`/designer?${example.query}`} replace preventScrollReset>
                      <strong>{example.title}</strong>
                      <span>{example.blurb}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.groups.map((group) => (
            <GroupCard
              key={group.index}
              group={group}
              analysis={analysis}
              catalog={catalog}
              open={open?.group === group.index ? open.slot : null}
              onOpen={toggleSlot(group.index)}
              onChange={changeGroup(group.index)}
              onDuplicate={() => update((current) => duplicateGroup(current, group.index))}
              onRemove={() => {
                setOpen(null);
                update((current) => removeGroup(current, group.index));
              }}
            />
          ))}

          <button
            type="button"
            className="btn btn--outline designer-add-group designer-no-print"
            onClick={() => {
              update((current) => addGroup(current));
              toggleSlot(design.groups.length)('pixels');
            }}
            disabled={design.groups.length >= LIMITS.groups}
          >
            <Plus size={15} aria-hidden="true" /> Add a pixel group
            <small>another type, voltage or run length</small>
          </button>

          <section className="designer-group designer-group--system" aria-label="Whole system">
            <header className="designer-group-head">
              <h2 className="designer-group-title">Whole system</h2>
            </header>
            <SlotRow
              id="system-source"
              icon={<MonitorPlay size={18} />}
              label="Pattern source"
              filled={!!analysis.source || analysis.standalone}
              open={open?.group === 'system'}
              onToggle={() => toggleSlot('system')(open?.group === 'system' ? null : 'source')}
              action={analysis.source || analysis.standalone ? 'Change' : 'Choose'}
              issues={sourceIssues}
              price={
                analysis.source
                  ? (analysis.source.price.text ?? analysis.source.priceText ?? undefined)
                  : undefined
              }
              summary={
                analysis.standalone ? (
                  <>
                    <span className="designer-part-name">Standalone playback</span>
                    <span className="designer-slot-facts">
                      The controller plays stored sequences or built-in effects by itself.
                    </span>
                  </>
                ) : analysis.source ? (
                  <>
                    <Link className="designer-part-name" to={analysis.source.path}>
                      {analysis.source.name}
                    </Link>
                    <span className="designer-slot-facts">
                      {[
                        analysis.sourceFit?.links.length &&
                        analysis.sourceFit.links.every((l) => l === 'onboard')
                          ? 'runs on the controller'
                          : analysis.sourceFit?.shared.length
                            ? `via ${analysis.sourceFit.shared.map((p) => PROTOCOL_LABELS[p] ?? p).join(' / ')}`
                            : null,
                        analysis.source.platforms.join(' / ') || null,
                        analysis.universes > 0 &&
                        !analysis.sourceFit?.links.every((l) => l === 'onboard')
                          ? `${fmtInt(analysis.universes)} universe${analysis.universes === 1 ? '' : 's'}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </>
                ) : (
                  <span className="designer-slot-empty">
                    {design.source && design.source !== STANDALONE
                      ? `“${design.source}” is no longer in the database.`
                      : 'The software that makes the patterns: a sequencer or VJ tool on a computer, or firmware on the controller.'}
                  </span>
                )
              }
            >
              <SourcePicker
                sources={catalog.sources}
                controllers={selectedControllers}
                selected={design.source}
                onSelect={(source) => {
                  update((current) => ({ ...current, source }));
                  if (source) toggleSlot('system')(null);
                }}
              />
            </SlotRow>
          </section>
        </div>

        <aside className="designer-area-side">
          <Summary analysis={analysis} />
          <Checks analysis={analysis} />
        </aside>

        <div className="designer-area-detail">
          <PowerPanel
            analysis={analysis}
            onChange={(patch) => update((current) => ({ ...current, ...patch }))}
          />
          <BomTable analysis={analysis} />
        </div>
      </div>

      <div className="designer-area-wide">
        <section
          className="designer-card designer-diagram"
          id="designer-diagram"
          aria-labelledby="designer-diagram-title"
        >
          <h2 className="designer-card-title" id="designer-diagram-title">
            <Workflow size={16} aria-hidden="true" /> Diagram
          </h2>
          {hasPixels || analysis.controllers.length > 0 ? (
            <>
              <div className="designer-diagram-scroll">
                <SystemDiagram model={diagram} />
              </div>
              <div className="designer-actions designer-no-print">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => exportDiagram('svg')}
                  disabled={busy != null}
                >
                  <Download size={14} aria-hidden="true" /> Download SVG
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => exportDiagram('png')}
                  disabled={busy != null}
                >
                  <ImageDown size={14} aria-hidden="true" /> Download PNG
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} aria-hidden="true" /> Print
                </button>
              </div>
              <p className="designer-footnote designer-no-print">
                Downloads carry the design inside the file. Drop one on this page, or use Open, to
                load it again.
              </p>
            </>
          ) : (
            <p className="designer-empty">The diagram draws itself once you choose parts.</p>
          )}
        </section>
      </div>

      {hasPixels && (
        <button
          type="button"
          className="designer-mobile-bar designer-no-print"
          onClick={() => scrollToId('designer-checks')}
        >
          <span>
            <strong>{fmtInt(analysis.power.pixels)}</strong> px
          </span>
          <span>
            <strong>{fmtWatts(analysis.power.maxWatts)}</strong>
          </span>
          {analysis.bom.priced > 0 && (
            <span>
              <strong>
                {fmtCost(analysis.bom.totalUSD, analysis.bom.totalMaxUSD, analysis.bom.open)}
              </strong>
            </span>
          )}
          <span
            className={`designer-mobile-status designer-mobile-status--${analysis.counts.error ? 'error' : analysis.counts.warning ? 'warning' : 'ok'}`}
          >
            <SeverityIcon
              severity={
                analysis.counts.error ? 'error' : analysis.counts.warning ? 'warning' : 'ok'
              }
            />
            {analysis.counts.error + analysis.counts.warning || 'OK'}
          </span>
          <span className="sr-only">Jump to the checks</span>
        </button>
      )}
    </div>
  );
}
