import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react';
import type { Analysis, Issue, Severity } from '~/lib/designer';

/**
 * A box that scrolls sideways when its content doesn't fit (a diagram on a
 * phone). While it scrolls it is a tab stop, so the arrow keys can move it;
 * when everything fits it is not one.
 */
export function ScrollRegion({
  className,
  label,
  children,
}: {
  className: string;
  /** What is in the box, for a screen reader */
  label: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrolls, setScrolls] = useState(false);
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const measure = () => setScrolls(box.scrollWidth > box.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    if (box.firstElementChild) observer.observe(box.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      role="group"
      aria-label={label}
      tabIndex={scrolls ? 0 : undefined}
    >
      {children}
    </div>
  );
}

/** Icon for an issue severity (or a green check for "ok") */
export function SeverityIcon({
  severity,
  size = 15,
}: {
  severity: Severity | 'ok';
  size?: number;
}) {
  const className = `designer-sev designer-sev--${severity}`;
  if (severity === 'error') return <CircleX size={size} className={className} aria-hidden="true" />;
  if (severity === 'warning') {
    return <TriangleAlert size={size} className={className} aria-hidden="true" />;
  }
  if (severity === 'info') return <Info size={size} className={className} aria-hidden="true" />;
  return <CircleCheck size={size} className={className} aria-hidden="true" />;
}

const SEVERITY_LABEL: Record<Severity, string> = {
  error: 'Problem',
  warning: 'Warning',
  info: 'Note',
};

/** Issues as a list: what is wrong, then what to do about it */
export function IssueList({ issues, className = '' }: { issues: Issue[]; className?: string }) {
  if (issues.length === 0) return null;
  return (
    <ul className={`designer-issues ${className}`}>
      {issues.map((issue, i) => (
        <li
          key={`${issue.code}-${issue.group ?? 's'}-${i}`}
          className={`designer-issue designer-issue--${issue.severity}`}
          data-code={issue.code}
        >
          <SeverityIcon severity={issue.severity} />
          <span>
            <span className="sr-only">{SEVERITY_LABEL[issue.severity]}: </span>
            {issue.message}
            {issue.fix && <span className="designer-issue-fix"> {issue.fix}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Issues with their group's name in front, for lists that mix several groups */
export function labelIssues(issues: Issue[], analysis: Analysis): Issue[] {
  if (analysis.groups.length < 2) return issues;
  return issues.map((issue) =>
    issue.group == null
      ? issue
      : { ...issue, message: `${analysis.groups[issue.group].label}: ${issue.message}` }
  );
}

/**
 * Cell of a stacking table. On narrow screens the header row is dropped,
 * each row becomes a block, and every cell shows its own column label (real
 * text, so it is read out too); on wide screens the label is hidden and the
 * header row does the job. See .designer-table--stack.
 */
export function Cell({
  label,
  head = false,
  num = false,
  children,
}: {
  label: string;
  head?: boolean;
  num?: boolean;
  children: React.ReactNode;
}) {
  const Tag = head ? 'th' : 'td';
  return (
    <Tag scope={head ? 'row' : undefined} className={num ? 'designer-num' : undefined}>
      <span className="designer-cell-label">{label}</span>
      <span className="designer-cell">{children}</span>
    </Tag>
  );
}

/** Part thumbnail, or a neutral placeholder so rows line up */
export function Thumb({ src, children }: { src?: string; children?: React.ReactNode }) {
  return src ? (
    <img className="designer-thumb" src={src} alt="" loading="lazy" />
  ) : (
    <span className="designer-thumb designer-thumb--empty" aria-hidden="true">
      {children}
    </span>
  );
}

interface NumberFieldProps {
  value: number;
  onCommit: (value: number) => void;
  min: number;
  max: number;
  /** Whole numbers only (default) */
  integer?: boolean;
  /** Accessible name */
  label: string;
  className?: string;
  id?: string;
}

/**
 * Numeric input that tolerates in-between states. The field keeps whatever
 * is being typed (so clearing it to type a new number works) and commits
 * every valid value as it appears; on blur it snaps back to the real value.
 */
export function NumberField({
  value,
  onCommit,
  min,
  max,
  integer = true,
  label,
  className = '',
  id,
}: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null);

  const parse = (text: string): number | null => {
    const trimmed = text.trim();
    if (!(integer ? /^\d+$/ : /^\d*\.?\d+$/).test(trimmed)) return null;
    const n = Number(trimmed);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  };

  return (
    <input
      id={id}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      autoComplete="off"
      className={`designer-number ${className}`}
      aria-label={label}
      aria-invalid={draft != null && parse(draft) == null}
      value={draft ?? String(value)}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const text = e.target.value;
        setDraft(text);
        const n = parse(text);
        if (n != null && n !== value) onCommit(n);
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
