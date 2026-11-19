import { ChevronDown } from 'lucide-react';
import type { Issue } from '~/lib/designer';
import { IssueList } from './parts';

interface SlotRowProps {
  /** DOM id base, unique on the page: "g0-controller" */
  id: string;
  icon: React.ReactNode;
  label: string;
  /** What is chosen (or what to do), shown beside the label */
  summary: React.ReactNode;
  price?: React.ReactNode;
  issues?: Issue[];
  /** Picker shown? */
  open: boolean;
  onToggle: () => void;
  /** Button text while closed: "Choose", "Change", "Add" */
  action: string;
  /** Something is chosen */
  filled: boolean;
  children: React.ReactNode;
}

/**
 * One line of the build list: a part slot that shows what is chosen and
 * opens its picker in place. Pickers expand inline rather than in a modal so
 * the page scrolls normally on a phone and nothing sits above the tooltips.
 */
export function SlotRow({
  id,
  icon,
  label,
  summary,
  price,
  issues = [],
  open,
  onToggle,
  action,
  filled,
  children,
}: SlotRowProps) {
  const panelId = `slot-${id}-panel`;
  return (
    <section
      id={`slot-${id}`}
      className={`designer-slot${open ? ' designer-slot--open' : ''}${filled ? ' designer-slot--filled' : ''}`}
      data-slot={id}
    >
      <div className="designer-slot-head">
        <span className="designer-slot-icon" aria-hidden="true">
          {icon}
        </span>
        <div className="designer-slot-main">
          <h3 className="designer-slot-label">{label}</h3>
          <div className="designer-slot-summary">{summary}</div>
        </div>
        {price != null && <div className="designer-slot-price">{price}</div>}
        <button
          type="button"
          className="btn btn--outline btn--sm designer-slot-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`${open ? 'Done choosing' : action} ${label.toLowerCase()}`}
          onClick={onToggle}
        >
          {open ? 'Done' : action}
          <ChevronDown size={14} className="designer-slot-chevron" aria-hidden="true" />
        </button>
      </div>
      <IssueList issues={issues} className="designer-slot-issues" />
      {open && (
        <div className="designer-slot-panel" id={panelId}>
          {children}
        </div>
      )}
    </section>
  );
}
