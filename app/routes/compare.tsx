import { ArrowLeft, ArrowRight, ClipboardCopy, Link2, Plus, Trash2, X } from 'lucide-react';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { FieldValue } from '~/components/data/FieldValue';
import { buildTableColumns, type TableColumn } from '~/components/data/table-columns';
import { useTableParams } from '~/components/data/useTableParams';
import { Breadcrumb } from '~/components/ui/Breadcrumb';
import { loadCategory, type CategoryData } from '~/lib/category-client';
import {
  COMPARE_MAX,
  compareHref,
  entryRef,
  parseCompareParam,
  setCompareItems,
  splitRef,
  useCompareItems,
} from '~/lib/compare';
import { copyText } from '~/lib/download';
import { matrixToMarkdown } from '~/lib/export';
import { entityName, getPath, SECTION_ORDER } from '~/lib/fields';
import { firstImageFile, imageUrl } from '~/lib/images';
import { openSearch } from '~/lib/search-client';
import { absoluteUrl } from '~/lib/site';
import { toast } from '~/lib/toast';
import { CATEGORIES, type BaseEntry } from '~/lib/types';
import type { Route } from './+types/compare';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Compare - Awesome LED List' },
    {
      name: 'description',
      content: 'Compare up to four entries of the Awesome LED List side by side.',
    },
    // Every combination of entries is a different page: not for search engines
    { name: 'robots', content: 'noindex, follow' },
  ];
}

// One compared entry, resolved against its category's data
interface Slot {
  ref: string;
  categoryId: string;
  state: 'loading' | 'missing' | 'ready';
  entry?: BaseEntry;
  /** The entry's category columns, by key */
  columns?: Map<string, TableColumn>;
}

interface Row {
  key: string;
  label: string;
  section: string;
  sectionLabel: string;
  /** Plain text per slot ('' = no value) */
  texts: string[];
  differs: boolean;
}

// Shown in the header or not worth a row
const SKIPPED_KEYS = new Set(['links', 'name', 'creator']);

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * /compare?e=<category>/<id>,… — two to four entries side by side, every
 * field in rows. Rows that differ are marked; "differences only" hides the
 * rest. The URL is the whole state, so a comparison can be shared.
 */
export default function ComparePage() {
  // URL state that applies in the same frame (the router catches up behind)
  const [searchParams, updateParams] = useTableParams();
  const param = searchParams.get('e');
  const refs = useMemo(() => parseCompareParam(param), [param]);
  const differencesOnly = searchParams.get('diff') === '1';
  const picks = useCompareItems();

  // ---- Load the categories involved ---------------------------------------
  const [loaded, setLoaded] = useState<Record<string, CategoryData | 'error'>>({});
  const categoryIds = useMemo(
    () => [...new Set(refs.map((ref) => splitRef(ref)!.category))],
    [refs]
  );

  useEffect(() => {
    let cancelled = false;
    for (const id of categoryIds) {
      if (loaded[id]) continue;
      loadCategory(id).then(
        (data) => !cancelled && setLoaded((prev) => ({ ...prev, [id]: data })),
        () => !cancelled && setLoaded((prev) => ({ ...prev, [id]: 'error' }))
      );
    }
    return () => {
      cancelled = true;
    };
  }, [categoryIds, loaded]);

  // Columns per category, built once per loaded category
  const columnsByCategory = useMemo(() => {
    const out = new Map<string, TableColumn[]>();
    for (const [id, data] of Object.entries(loaded)) {
      if (data !== 'error') out.set(id, buildTableColumns(id, data.fields));
    }
    return out;
  }, [loaded]);

  const slots = useMemo((): Slot[] => {
    return refs.map((ref) => {
      const { category, id } = splitRef(ref)!;
      const data = loaded[category];
      if (!data) return { ref, categoryId: category, state: 'loading' };
      const entry = data === 'error' ? undefined : data.entries.find((e) => String(e.id) === id);
      if (!entry) return { ref, categoryId: category, state: 'missing' };
      const columns = new Map((columnsByCategory.get(category) ?? []).map((c) => [c.key, c]));
      return { ref, categoryId: category, state: 'ready', entry, columns };
    });
  }, [refs, loaded, columnsByCategory]);

  const ready = slots.filter((slot) => slot.state === 'ready');
  const loading = slots.some((slot) => slot.state === 'loading');

  // ---- Rows: every field any of the entries has ----------------------------
  const rows = useMemo((): Row[] => {
    const seen = new Set<string>();
    const out: Row[] = [];
    for (const categoryId of categoryIds) {
      for (const col of columnsByCategory.get(categoryId) ?? []) {
        if (seen.has(col.key) || SKIPPED_KEYS.has(col.key)) continue;
        seen.add(col.key);
        const texts = slots.map((slot) =>
          slot.entry ? (slot.columns?.get(col.key)?.text(slot.entry) ?? '') : ''
        );
        if (texts.every((text) => text === '')) continue;
        const known = texts.filter((_, i) => slots[i].state === 'ready');
        out.push({
          key: col.key,
          label: col.label,
          section: col.section,
          sectionLabel: col.sectionLabel,
          texts,
          differs: known.some((text) => !sameText(text, known[0])),
        });
      }
    }
    const rank = (section: string) => {
      const i = SECTION_ORDER.indexOf(section);
      return i === -1 ? SECTION_ORDER.length : i;
    };
    // Stable: catalog order is kept within a section
    return out.sort((a, b) => rank(a.section) - rank(b.section));
  }, [categoryIds, columnsByCategory, slots]);

  const visibleRows = differencesOnly ? rows.filter((row) => row.differs) : rows;
  const differing = rows.filter((row) => row.differs).length;

  // ---- Editing the comparison ----------------------------------------------
  const nameOf = (ref: string) => {
    const slot = slots.find((s) => s.ref === ref);
    return slot?.entry?.name ?? picks.find((p) => p.ref === ref)?.name ?? ref;
  };

  const update = (nextRefs: string[], nextDiff = differencesOnly) => {
    // Keep the picks in step, so the tray on other pages shows the same set
    setCompareItems(nextRefs.map((ref) => ({ ref, name: nameOf(ref) })));
    updateParams(
      {
        e: nextRefs.length > 0 ? nextRefs.join(',') : null,
        diff: nextDiff && nextRefs.length > 0 ? '1' : null,
      },
      true
    );
  };

  const remove = (ref: string) => update(refs.filter((r) => r !== ref));
  const move = (ref: string, delta: -1 | 1) => {
    const index = refs.indexOf(ref);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= refs.length) return;
    const next = [...refs];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  };

  const add = () => {
    openSearch('', {
      prompt: 'Add an entry to compare',
      accept: (doc) => !refs.includes(entryRef(doc.c, doc.i)),
      onPick: (doc) => {
        const ref = entryRef(doc.c, doc.i);
        setCompareItems([...refs.map((r) => ({ ref: r, name: nameOf(r) })), { ref, name: doc.n }]);
        updateParams({ e: [...refs, ref].join(',') }, true);
      },
    });
  };

  const copy = async (text: string, what: string) => {
    const ok = await copyText(text);
    toast(
      ok ? `Copied ${what}` : 'Could not copy — your browser blocked it',
      ok ? 'info' : 'error'
    );
  };

  const copyMarkdown = () => {
    const header = ['', ...slots.map((slot) => slot.entry?.name ?? slot.ref)];
    const body = visibleRows.map((row) => [row.label, ...row.texts]);
    copy(matrixToMarkdown({ header, rows: body }), 'the comparison as Markdown');
  };

  const canAdd = refs.length < COMPARE_MAX;
  // Names line up across columns only if every header reserves the picture slot
  const anyImage = slots.some((slot) => slot.entry && firstImageFile(slot.entry));

  return (
    <div className="container page-section compare-page">
      <Breadcrumb items={[{ label: 'Home', path: '/' }, { label: 'Compare' }]} />

      <header className="page-header">
        <h1 className="page-title">Compare</h1>
        <p className="page-description">
          {refs.length === 0
            ? 'Put up to four entries side by side, field by field.'
            : loading
              ? 'Loading…'
              : `${ready.length} ${ready.length === 1 ? 'entry' : 'entries'}, ${rows.length} fields, ${differing} of them different.`}
        </p>
      </header>

      {refs.length === 0 ? (
        <div className="compare-empty">
          <p>Tick the box at the start of a row in any table to pick entries, or add them here.</p>
          <div className="compare-actions">
            {picks.length > 0 && (
              <Link className="btn btn--primary" to={compareHref(picks.map((p) => p.ref))}>
                Compare your {picks.length} {picks.length === 1 ? 'pick' : 'picks'}
              </Link>
            )}
            <button type="button" className="btn btn--outline" onClick={add}>
              <Plus size={16} />
              Add an entry
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="compare-actions">
            {canAdd && (
              <button type="button" className="btn btn--outline btn--sm" onClick={add}>
                <Plus size={16} />
                Add an entry
              </button>
            )}
            <label className="compare-toggle">
              <input
                type="checkbox"
                checked={differencesOnly}
                onChange={(e) => update(refs, e.target.checked)}
              />
              Differences only
            </label>
            <span className="compare-actions-spacer" />
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() =>
                copy(absoluteUrl(compareHref(refs, differencesOnly)), 'a link to this comparison')
              }
            >
              <Link2 size={16} />
              Copy link
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              // Nothing worth copying until the entries have loaded
              disabled={loading}
              onClick={copyMarkdown}
            >
              <ClipboardCopy size={16} />
              Copy as Markdown
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => update([])}>
              <Trash2 size={16} />
              Clear
            </button>
          </div>

          <div className="compare-scroll">
            <table className="compare-table">
              <caption className="sr-only">
                Comparison of {slots.map((slot) => slot.entry?.name ?? slot.ref).join(', ')}
              </caption>
              <thead>
                <tr>
                  <td className="compare-corner" />
                  {slots.map((slot, index) => (
                    <th key={slot.ref} scope="col" className="compare-head">
                      <CompareHeader
                        slot={slot}
                        reserveImage={anyImage}
                        onRemove={() => remove(slot.ref)}
                        onMove={(delta) => move(slot.ref, delta)}
                        canMoveLeft={index > 0}
                        canMoveRight={index < slots.length - 1}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <Fragment key={row.key}>
                    {(i === 0 || visibleRows[i - 1].section !== row.section) && (
                      <tr className="compare-section">
                        <th scope="colgroup" colSpan={slots.length + 1}>
                          {row.sectionLabel}
                        </th>
                      </tr>
                    )}
                    <tr
                      className={row.differs ? 'compare-row compare-row--differs' : 'compare-row'}
                    >
                      <th scope="row" className="compare-label">
                        {row.label}
                        {row.differs && <span className="sr-only"> (differs)</span>}
                      </th>
                      {slots.map((slot) => (
                        <td key={slot.ref} className="compare-cell">
                          <CompareCell slot={slot} columnKey={row.key} />
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                ))}
                {!loading && visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={slots.length + 1} className="compare-nothing">
                      {differencesOnly && rows.length > 0
                        ? 'These entries agree on every recorded field.'
                        : 'Nothing is recorded for these entries.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {ready.length === 1 && canAdd && (
            <p className="compare-hint">Add a second entry to see how they differ.</p>
          )}
        </>
      )}
    </div>
  );
}

function CompareHeader({
  slot,
  reserveImage,
  onRemove,
  onMove,
  canMoveLeft,
  canMoveRight,
}: {
  slot: Slot;
  /** Keep the picture's space even without one (another entry has a picture) */
  reserveImage: boolean;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
}) {
  const category = CATEGORIES.find((c) => c.id === slot.categoryId);
  const entry = slot.entry;
  const name = entry?.name ?? slot.ref;
  const image = entry ? firstImageFile(entry) : undefined;
  const maker = entry ? entityName(entry.creator) : null;
  const status = typeof entry?.status === 'string' ? entry.status : '';

  return (
    <div className="compare-header">
      <div className="compare-header-tools">
        <button
          type="button"
          className="column-picker-icon-btn"
          aria-label={`Move ${name} left`}
          disabled={!canMoveLeft}
          onClick={() => onMove(-1)}
        >
          <ArrowLeft size={14} />
        </button>
        <button
          type="button"
          className="column-picker-icon-btn"
          aria-label={`Move ${name} right`}
          disabled={!canMoveRight}
          onClick={() => onMove(1)}
        >
          <ArrowRight size={14} />
        </button>
        <button
          type="button"
          className="column-picker-icon-btn"
          aria-label={`Remove ${name} from the comparison`}
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      </div>
      {image ? (
        <img
          className="compare-header-image"
          src={imageUrl(slot.categoryId, image, 'sm')}
          alt=""
          loading="lazy"
          decoding="async"
        />
      ) : (
        reserveImage && <span className="compare-header-image" aria-hidden="true" />
      )}
      {slot.state === 'ready' ? (
        <Link
          className="compare-header-name"
          to={`${category?.path ?? `/${slot.categoryId}`}/${entry!.id}`}
        >
          {name}
        </Link>
      ) : (
        <span className="compare-header-name">{name}</span>
      )}
      {slot.state === 'loading' && <span className="compare-header-sub">Loading…</span>}
      {slot.state === 'missing' && (
        <span className="compare-header-sub">This entry is not in the database</span>
      )}
      {maker && <span className="compare-header-sub">{maker}</span>}
      <span className="compare-header-meta">
        {category && (
          <span
            className="search-result-category"
            style={{ '--chip-hue': category.color.hue } as React.CSSProperties}
          >
            {category.name}
          </span>
        )}
        {status && status !== 'active' && <span className="search-result-status">{status}</span>}
      </span>
    </div>
  );
}

function CompareCell({ slot, columnKey }: { slot: Slot; columnKey: string }) {
  const column = slot.columns?.get(columnKey);
  if (!slot.entry || !column || !column.hasValue(slot.entry)) {
    return <span className="data-table-null">-</span>;
  }
  const value = getPath(slot.entry, columnKey);
  // Catalog columns render compactly for table cells; here there is room for
  // the whole value (full lists, unclipped prose)
  if (column.field && !column.isDefault) {
    return <FieldValue field={column.field} value={value} item={slot.entry} />;
  }
  if (column.render) return <>{column.render(value, slot.entry)}</>;
  return <span>{column.text(slot.entry)}</span>;
}
