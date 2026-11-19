import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { BaseEntry } from '~/lib/types';
import { countFacet, numericRange } from '~/lib/table-model';
import {
  isBooleanFilter,
  isDateFilter,
  isNumericFilter,
  isPresenceFilter,
  isSelectFilter,
  isStringFilter,
  type FilterValue,
} from '~/lib/table-state';
import { formatQuantity, parseNumberWithUnit } from '~/lib/units';
import { useNow } from '~/hooks/useNow';
import type { TableColumn } from './table-columns';

// Filter value types live in lib/table-state; re-exported for existing imports
export type {
  BooleanFilterValue,
  DateFilterValue,
  FilterState,
  FilterValue,
  NumericFilterValue,
  SelectFilterValue,
  StringFilterValue,
} from '~/lib/table-state';
export { isFilterActive } from '~/lib/table-state';

/**
 * Loose "since" text: a year (2024), year-month (2024-06), or a full date.
 * Returns a normalized ISO day, or null when it isn't date-ish.
 */
export function parseSinceInput(raw: string): string | null {
  const s = raw.trim();
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{1,2}$/.test(s)) {
    const [y, m] = s.split('-');
    return `${y}-${m.padStart(2, '0')}-01`;
  }
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

/** A numeric bound as a person would read it ("800 kHz", "$25", "1,024"). */
export function formatBound(column: TableColumn, n: number): string {
  if (column.quantity) return formatQuantity(n, column.quantity);
  const unit = column.filterConfig?.type === 'numeric' ? column.filterConfig.unit : undefined;
  const text = n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return unit === '$' ? `$${text}` : unit ? `${text} ${unit}` : text;
}

interface FilterEditorProps {
  column: TableColumn;
  /** Every row of the category: the full option list and numeric bounds */
  allRows: BaseEntry[];
  /** Rows passing the search and every OTHER filter: what the counts count */
  rows: BaseEntry[];
  value: FilterValue | undefined;
  onChange: (value: FilterValue | undefined) => void;
}

/**
 * The filter controls for one column, by its filter kind, plus the
 * has-a-value / has-none toggles every column gets.
 */
export function FilterEditor(props: FilterEditorProps) {
  const { column, value } = props;
  const presence = value && isPresenceFilter(value) ? value : undefined;
  // A presence filter replaces the value filter; the editor shows as unset
  const own = presence ? undefined : value;

  let editor: React.ReactNode = null;
  switch (column.filterKind) {
    case 'select':
      editor = <SelectFilter {...props} value={own && isSelectFilter(own) ? own : undefined} />;
      break;
    case 'numeric':
      editor = <NumericFilter {...props} value={own && isNumericFilter(own) ? own : undefined} />;
      break;
    case 'boolean':
      editor = <BooleanFilter {...props} value={own && isBooleanFilter(own) ? own : undefined} />;
      break;
    case 'string':
      editor = <StringFilter {...props} value={own && isStringFilter(own) ? own : undefined} />;
      break;
    case 'date':
      editor = (
        <DateFilter value={own && isDateFilter(own) ? own : undefined} onChange={props.onChange} />
      );
      break;
  }

  return (
    <div className="filter-content">
      {editor}
      <PresenceToggle {...props} />
    </div>
  );
}

// "Has a value" / "No value": useful on any column, e.g. to find entries
// that still lack a price or a datasheet
function PresenceToggle({ column, rows, value, onChange }: FilterEditorProps) {
  const present = useMemo(() => rows.filter((r) => column.hasValue(r)).length, [rows, column]);
  const missing = rows.length - present;
  const current = value && isPresenceFilter(value) ? value.present : null;
  // A column every entry fills in has nothing to offer here
  if (missing === 0 && current === null) return null;
  const toggle = (want: boolean) => onChange(current === want ? undefined : { present: want });
  return (
    <div
      className="filter-presence"
      role="group"
      aria-label="Filter by whether a value is recorded"
    >
      <button
        type="button"
        className={`filter-action-btn${current === true ? ' filter-action-btn--active' : ''}`}
        aria-pressed={current === true}
        onClick={() => toggle(true)}
      >
        Has a value <span className="filter-count">{present}</span>
      </button>
      <button
        type="button"
        className={`filter-action-btn${current === false ? ' filter-action-btn--active' : ''}`}
        aria-pressed={current === false}
        onClick={() => toggle(false)}
      >
        No value <span className="filter-count">{missing}</span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Select: checkbox list with live counts
// ---------------------------------------------------------------------------

function SelectFilter({
  column,
  allRows,
  rows,
  value,
  onChange,
}: FilterEditorProps & { value: Extract<FilterValue, { selected: string[] }> | undefined }) {
  const [search, setSearch] = useState('');
  const selected = useMemo(() => value?.selected ?? [], [value]);
  const exclude = value?.exclude ?? false;
  // Remember "exclude" while nothing is selected yet
  const [pendingExclude, setPendingExclude] = useState(exclude);
  const excluding = selected.length > 0 ? exclude : pendingExclude;

  const options = useMemo(() => {
    const counts = new Map(countFacet(column, rows).map((o) => [o.value.toLowerCase(), o.count]));
    const all = countFacet(column, allRows).map((o) => ({
      value: o.value,
      count: counts.get(o.value.toLowerCase()) ?? 0,
    }));
    // Selected values no entry has any more (stale link): still show them so
    // they can be unticked
    const known = new Set(all.map((o) => o.value.toLowerCase()));
    for (const s of selected) {
      if (!known.has(s.toLowerCase())) all.push({ value: s, count: 0 });
    }
    return all.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }, [column, rows, allRows, selected]);

  const isSelected = (opt: string) => selected.some((s) => s.toLowerCase() === opt.toLowerCase());

  const visible = search
    ? options.filter((o) => o.value.toLowerCase().includes(search.toLowerCase()))
    : options;

  const commit = (next: string[], nextExclude = excluding) => {
    onChange(next.length === 0 ? undefined : { selected: next, exclude: nextExclude });
  };

  const toggleOption = (opt: string) => {
    commit(
      isSelected(opt)
        ? selected.filter((s) => s.toLowerCase() !== opt.toLowerCase())
        : [...selected, opt]
    );
  };

  return (
    <>
      <div className="filter-select-header">
        {options.length > 8 && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a value…"
            aria-label={`Find a ${column.label} value`}
            className="filter-input filter-search"
          />
        )}
        <button
          type="button"
          className={`filter-exclude-btn${excluding ? ' filter-exclude-btn--active' : ''}`}
          aria-pressed={excluding}
          onClick={() => {
            setPendingExclude(!excluding);
            if (selected.length > 0) commit(selected, !excluding);
          }}
        >
          {excluding ? 'Hiding ticked' : 'Showing ticked'}
        </button>
      </div>
      <div className="filter-select-actions">
        <button
          type="button"
          className="filter-action-btn"
          onClick={() => commit(visible.map((o) => o.value))}
        >
          Tick all
        </button>
        <button type="button" className="filter-action-btn" onClick={() => onChange(undefined)}>
          Untick all
        </button>
      </div>
      <div className="filter-options-list">
        {visible.map((opt) => (
          <label
            key={opt.value}
            className={`filter-option${opt.count === 0 ? ' filter-option--empty' : ''}`}
          >
            <input
              type="checkbox"
              checked={isSelected(opt.value)}
              onChange={() => toggleOption(opt.value)}
            />
            <span className="filter-option-label">{opt.value}</span>
            <span className="filter-count">{opt.count}</span>
          </label>
        ))}
        {visible.length === 0 && <div className="filter-no-options">No matching values</div>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Numeric: range with units
// ---------------------------------------------------------------------------

function NumericFilter({
  column,
  allRows,
  value,
  onChange,
}: FilterEditorProps & { value: Extract<FilterValue, { min?: number }> | undefined }) {
  const range = useMemo(() => numericRange(column, allRows), [column, allRows]);
  const unknown = allRows.length - (range?.known ?? 0);

  const show = (n: number | undefined) =>
    n === undefined
      ? ''
      : column.quantity
        ? formatQuantity(n, column.quantity)
        : String(Number(n.toPrecision(12)));

  const [minText, setMinText] = useState(() => show(value?.min));
  const [maxText, setMaxText] = useState(() => show(value?.max));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // What the inputs currently mean; used to tell an outside change (a chip
  // removed, a link followed) from our own
  const read = (text: string) => parseNumberWithUnit(text, column.quantity);
  const minValid = minText.trim() === '' || read(minText) !== undefined;
  const maxValid = maxText.trim() === '' || read(maxText) !== undefined;

  // When the applied value changes from outside, re-seed the inputs — but
  // not when it merely caught up with what is being typed, which would
  // rewrite the text under the cursor ("1" → "1 Hz" on the way to "12kHz")
  const [applied, setApplied] = useState({ min: value?.min, max: value?.max });
  if (applied.min !== value?.min || applied.max !== value?.max) {
    setApplied({ min: value?.min, max: value?.max });
    if (read(minText) !== value?.min) setMinText(show(value?.min));
    if (read(maxText) !== value?.max) setMaxText(show(value?.max));
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const apply = (nextMin: string, nextMax: string, strict = value?.strict ?? false) => {
    const min = read(nextMin);
    const max = read(nextMax);
    if (min === undefined && max === undefined) {
      onChange(undefined);
      return;
    }
    onChange(strict ? { min, max, strict: true } : { min, max });
  };

  const schedule = (nextMin: string, nextMax: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => apply(nextMin, nextMax), 350);
  };

  const applyNow = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    apply(minText, maxText);
  };

  const example = column.quantity && range ? `e.g. ${formatBound(column, range.min)}` : undefined;

  return (
    <>
      {range && (
        <div className="filter-hint">
          Recorded values run from {formatBound(column, range.min)} to{' '}
          {formatBound(column, range.max)}.
        </div>
      )}
      <div className="filter-numeric-inputs">
        <div className="filter-input-group">
          <label htmlFor={`min-${column.key}`}>At least</label>
          <input
            id={`min-${column.key}`}
            type="text"
            inputMode="decimal"
            value={minText}
            onChange={(e) => {
              setMinText(e.target.value);
              schedule(e.target.value, maxText);
            }}
            onKeyDown={(e) => e.key === 'Enter' && applyNow()}
            placeholder={example}
            aria-invalid={!minValid}
            className="filter-input"
          />
        </div>
        <div className="filter-input-group">
          <label htmlFor={`max-${column.key}`}>At most</label>
          <input
            id={`max-${column.key}`}
            type="text"
            inputMode="decimal"
            value={maxText}
            onChange={(e) => {
              setMaxText(e.target.value);
              schedule(minText, e.target.value);
            }}
            onKeyDown={(e) => e.key === 'Enter' && applyNow()}
            aria-invalid={!maxValid}
            className="filter-input"
          />
        </div>
      </div>
      {(!minValid || !maxValid) && (
        <div className="filter-error" role="alert">
          Enter a number{column.quantity ? ' (a unit is fine: "800kHz", "22 mA")' : ''}.
        </div>
      )}
      {unknown > 0 && (
        <label className="filter-fuzzy-toggle">
          <input
            type="checkbox"
            checked={value?.strict ?? false}
            disabled={!value}
            onChange={(e) => apply(minText, maxText, e.target.checked)}
          />
          <span>
            Hide the {unknown} {unknown === 1 ? 'entry' : 'entries'} with no value recorded
          </span>
        </label>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Boolean
// ---------------------------------------------------------------------------

function BooleanFilter({
  column,
  rows,
  value,
  onChange,
}: FilterEditorProps & { value: Extract<FilterValue, { value: boolean | null }> | undefined }) {
  const config = column.filterConfig?.type === 'boolean' ? column.filterConfig : undefined;
  const trueLabel = config?.trueLabel ?? 'Yes';
  const falseLabel = config?.falseLabel ?? 'No';
  const current = value?.value ?? null;

  const counts = useMemo(() => {
    let yes = 0;
    let no = 0;
    for (const row of rows) {
      const b = column.bool?.(row);
      if (b === true) yes++;
      else if (b === false) no++;
    }
    return { yes, no };
  }, [rows, column]);

  const option = (want: boolean | null, label: string, count?: number) => (
    <button
      type="button"
      className={`filter-boolean-btn${current === want ? ' filter-boolean-btn--active' : ''}`}
      aria-pressed={current === want}
      onClick={() => onChange(want === null ? undefined : { value: want })}
    >
      {label}
      {count !== undefined && <span className="filter-count">{count}</span>}
    </button>
  );

  return (
    <div className="filter-boolean-options" role="group" aria-label={column.label}>
      {option(null, 'Any')}
      {option(true, trueLabel, counts.yes)}
      {option(false, falseLabel, counts.no)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text contains
// ---------------------------------------------------------------------------

function StringFilter({
  column,
  value,
  onChange,
}: FilterEditorProps & { value: Extract<FilterValue, { fuzzy: boolean }> | undefined }) {
  const [text, setText] = useState(value?.value ?? '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-seed when the applied value changes from outside (a chip removed)
  const [applied, setApplied] = useState(value?.value);
  if (applied !== value?.value) {
    setApplied(value?.value);
    if ((value?.value ?? '') !== text.trim()) setText(value?.value ?? '');
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const handleChange = (next: string) => {
    setText(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(next.trim() ? { value: next.trim(), fuzzy: true } : undefined);
    }, 250);
  };

  return (
    <>
      <input
        type="text"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Contains…"
        aria-label={`${column.label} contains`}
        className="filter-input"
      />
      <div className="filter-hint filter-hint--below">Every word must appear, in any order.</div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Date: "since"
// ---------------------------------------------------------------------------

// Big obvious presets first, a forgiving text field second, and a native
// date picker only for those who go looking for it.
function DateFilter({
  value,
  onChange,
}: {
  value: Extract<FilterValue, { since: string }> | undefined;
  onChange: (value: FilterValue | undefined) => void;
}) {
  const [text, setText] = useState(value?.since ?? '');
  const [showPicker, setShowPicker] = useState(false);
  // Client clock (0 during SSR/hydration); the editor only opens
  // client-side, so this is always set before the presets are visible.
  const now = useNow();

  // Re-seed when the applied value changes from outside (a chip removed)
  const [applied, setApplied] = useState(value?.since);
  if (applied !== value?.since) {
    setApplied(value?.since);
    setText(value?.since ?? '');
  }

  const setSince = (since: string | null) => {
    setText(since ?? '');
    onChange(since ? { since } : undefined);
  };
  const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString().slice(0, 10);
  const presets: [string, string][] =
    now === 0
      ? []
      : [
          ['Last 90 days', daysAgo(90)],
          ['Last 365 days', daysAgo(365)],
          ['This year', `${new Date(now).getFullYear()}-01-01`],
        ];

  const commitText = () => {
    if (text.trim() === '') {
      setSince(null);
      return;
    }
    const parsed = parseSinceInput(text);
    if (parsed) setSince(parsed);
  };

  return (
    <div className="filter-date">
      <div className="filter-date-presets">
        {presets.map(([label, since]) => (
          <button
            key={label}
            type="button"
            className={`filter-action-btn${value?.since === since ? ' filter-action-btn--active' : ''}`}
            aria-pressed={value?.since === since}
            onClick={() => setSince(value?.since === since ? null : since)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="filter-date-since">
        <input
          type="text"
          className="filter-input"
          placeholder="since… (2024, 2024-06, or 2024-06-15)"
          aria-label="Reviewed since"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commitText}
          onKeyDown={(e) => e.key === 'Enter' && commitText()}
        />
        <button
          type="button"
          className="filter-action-btn"
          aria-expanded={showPicker}
          onClick={() => setShowPicker((v) => !v)}
        >
          Calendar
        </button>
      </div>
      {showPicker && (
        <input
          type="date"
          className="filter-input"
          aria-label="Pick a date"
          value={value?.since ?? ''}
          onChange={(e) => setSince(e.target.value || null)}
        />
      )}
      {value?.since && (
        <button type="button" className="filter-clear-btn" onClick={() => setSince(null)}>
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
