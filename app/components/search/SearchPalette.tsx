import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { searchIndex, type SearchDoc } from '~/lib/search';
import { closeSearch, openSearch, usePaletteState, useSearchIndex } from '~/lib/search-client';
import { CATEGORIES } from '~/lib/types';
import { resultPath, SearchResult } from './SearchResult';

const ENTRY_LIMIT = 10;
const HIT_LIMIT = 200;

const PAGES = [
  { label: 'System Designer', hint: 'Plan a controller, pixels and power', path: '/designer' },
  {
    label: 'System overview',
    hint: 'How the parts of an LED system connect',
    path: '/system-overview',
  },
  { label: 'About', hint: 'History, downloads, license', path: '/about' },
];

interface Item {
  id: string;
  path: string;
  group: string;
  render: () => React.ReactNode;
}

// A plain destination row: a label, a line of explanation, an arrow
function linkRow(label: string, hint: string) {
  return (
    <>
      <span className="search-result-main">
        <span className="search-result-name">{label}</span>
        {hint && <span className="search-result-facts">{hint}</span>}
      </span>
      <ArrowRight size={14} aria-hidden="true" />
    </>
  );
}

/**
 * Search everything from anywhere: Ctrl/⌘+K (or "/" where no table claims it)
 * opens a palette over the whole database. Arrow keys move, Enter opens.
 * Mounted once by the layout; open it from code with openSearch().
 */
export function SearchPalette() {
  const { open, query } = usePaletteState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) closeSearch();
        else openSearch();
        return;
      }
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || open) return;
      const t = e.target as HTMLElement;
      const typing =
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        t.isContentEditable;
      // Category tables use "/" for their own search box
      if (typing || document.querySelector('.data-table-search-input, [role="dialog"]')) return;
      e.preventDefault();
      openSearch();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? openSearch() : closeSearch())}>
      <Dialog.Portal>
        <Dialog.Overlay className="drawer-overlay" />
        <Dialog.Content className="search-palette" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Search the Awesome LED List</Dialog.Title>
          {/* Mounted fresh on every open, so it starts clean */}
          <PaletteBody initialQuery={query} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function PaletteBody({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const { index, failed } = useSearchIndex(true);
  const trimmed = query.trim();

  const hits = useMemo(
    () => (index && trimmed ? searchIndex(index, trimmed, HIT_LIMIT) : []),
    [index, trimmed]
  );

  const items = useMemo((): Item[] => {
    const out: Item[] = [];
    const categoryItem = (category: (typeof CATEGORIES)[number]): Item => ({
      id: `cat-${category.id}`,
      path: category.path,
      group: 'Categories',
      render: () => linkRow(category.name, category.description),
    });
    const pageItem = (page: (typeof PAGES)[number]): Item => ({
      id: `page-${page.path}`,
      path: page.path,
      group: 'Pages',
      render: () => linkRow(page.label, page.hint),
    });

    if (!trimmed) {
      return [...CATEGORIES.map(categoryItem), ...PAGES.map(pageItem)];
    }

    for (const hit of hits.slice(0, ENTRY_LIMIT)) {
      const doc: SearchDoc = hit.doc;
      out.push({
        id: `entry-${doc.c}-${doc.i}`,
        path: resultPath(doc),
        group: 'Entries',
        render: () => <SearchResult doc={doc} query={trimmed} />,
      });
    }
    if (hits.length > ENTRY_LIMIT) {
      const total = hits.length === HIT_LIMIT ? `${HIT_LIMIT}+` : String(hits.length);
      out.push({
        id: 'all',
        path: `/search?q=${encodeURIComponent(trimmed)}`,
        group: 'Entries',
        render: () => linkRow(`See all ${total} results`, ''),
      });
    }

    // The category tables search full text and can filter further: offer the
    // tables with the most matches
    const perCategory = new Map<string, number>();
    for (const hit of hits) perCategory.set(hit.doc.c, (perCategory.get(hit.doc.c) ?? 0) + 1);
    const busiest = [...perCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    for (const [categoryId, count] of busiest) {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      if (!category || count < 2) continue;
      out.push({
        id: `table-${categoryId}`,
        path: `${category.path}?q=${encodeURIComponent(trimmed)}`,
        group: 'In the tables',
        render: () =>
          linkRow(
            `${category.name} matching “${trimmed}”`,
            'Open the table to sort, filter and compare'
          ),
      });
    }

    const needle = trimmed.toLowerCase();
    for (const category of CATEGORIES) {
      if (category.name.toLowerCase().includes(needle)) out.push(categoryItem(category));
    }
    for (const page of PAGES) {
      if (page.label.toLowerCase().includes(needle)) out.push(pageItem(page));
    }
    return out;
  }, [trimmed, hits]);

  const activeIndex = Math.min(active, Math.max(items.length - 1, 0));
  const activeItem = items[activeIndex];

  const go = (item: Item) => {
    closeSearch();
    navigate(item.path);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length === 0) return;
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const next = (activeIndex + delta + items.length) % items.length;
      setActive(next);
      listRef.current
        ?.querySelector(`[data-index="${next}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && activeItem) {
      e.preventDefault();
      go(activeItem);
    }
  };

  return (
    <>
      <div className="search-palette-input">
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="search-palette-results"
          aria-activedescendant={activeItem ? `search-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          aria-label="Search every category"
          placeholder="Search every category…"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
        />
        <kbd>esc</kbd>
      </div>

      <div ref={listRef} id="search-palette-results" role="listbox" className="search-palette-list">
        {items.map((item, i) => (
          <div key={item.id} role="presentation">
            {(i === 0 || items[i - 1].group !== item.group) && (
              <div className="search-palette-group" role="presentation">
                {item.group}
              </div>
            )}
            <a
              id={`search-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              data-index={i}
              href={item.path}
              className={`search-result${i === activeIndex ? ' search-result--active' : ''}`}
              onMouseMove={() => setActive(i)}
              onClick={(e) => {
                // Let the browser handle open-in-new-tab gestures
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                go(item);
              }}
            >
              {item.render()}
            </a>
          </div>
        ))}
        {trimmed && index && items.length === 0 && (
          <p className="search-palette-empty">
            Nothing matches “{trimmed}”. Try a part number, a maker, or a protocol.
          </p>
        )}
        {trimmed && !index && !failed && <p className="search-palette-empty">Loading the index…</p>}
        {failed && (
          <p className="search-palette-empty" role="alert">
            The search index could not be loaded. Check your connection and try again.
          </p>
        )}
      </div>

      <div className="search-palette-footer" aria-hidden="true">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> to move
        </span>
        <span>
          <kbd>
            <CornerDownLeft size={11} />
          </kbd>{' '}
          to open
        </span>
        {index && <span className="search-palette-size">{index.docs.length} entries</span>}
      </div>
    </>
  );
}
