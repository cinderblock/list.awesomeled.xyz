import { useState } from 'react';
import { Link } from 'react-router';
import { Search, Zap } from 'lucide-react';
import { fmtVolts, isRetired, type ControllerOption, type PixelOption } from '~/lib/designer';

interface PixelPickerProps {
  pixels: PixelOption[];
  selectedId: string;
  /** Controller already chosen for the group, to flag pixels it can't drive */
  controller: ControllerOption | null;
  onSelect: (id: string) => void;
}

type KindFilter = 'all' | 'pixel' | 'ic';

function clockLabel(pixel: PixelOption): string {
  if (pixel.clocked == null) return '';
  return pixel.clocked ? 'clocked' : 'data-only';
}

/** Why the chosen controller can't drive this pixel, if it can't */
function clockConflict(pixel: PixelOption, controller: ControllerOption | null): string | null {
  if (!controller) return null;
  if (pixel.clocked === true && controller.clockedSupport === 'async') {
    return `needs a clock; ${controller.name} is data-only`;
  }
  if (pixel.clocked === false && controller.clockedSupport === 'clocked') {
    return `data-only; ${controller.name} is clocked-only`;
  }
  return null;
}

function matches(pixel: PixelOption, query: string): boolean {
  if (!query) return true;
  const haystack = `${pixel.name} ${pixel.family ?? ''} ${pixel.packages ?? ''}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

export function PixelPicker({ pixels, selectedId, controller, onSelect }: PixelPickerProps) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');

  const visible = pixels.filter(
    (p) => (kind === 'all' || p.kind === kind) && matches(p, query.trim())
  );
  const sections: { title: string; hint: string; items: PixelOption[] }[] = [
    {
      title: 'Integrated pixels',
      hint: 'LED and driver chip in one package: most strips, matrices and rings',
      items: visible.filter((p) => p.kind === 'pixel'),
    },
    {
      title: 'Driver ICs',
      hint: 'A separate chip driving ordinary LEDs: bullet strings, 12 V and 24 V strips, modules',
      items: visible.filter((p) => p.kind === 'ic'),
    },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="designer-picker">
      <div className="designer-picker-tools">
        <label className="designer-search">
          <Search size={15} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search pixels: WS2812, APA102, 2020…"
            aria-label="Search pixel types"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="designer-segmented" role="group" aria-label="Kind of pixel">
          {(
            [
              ['all', 'All'],
              ['pixel', 'Integrated'],
              ['ic', 'Driver ICs'],
            ] as [KindFilter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              className={kind === value ? 'designer-segmented--on' : ''}
              onClick={() => setKind(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {sections.length === 0 && <p className="designer-empty">No pixel types match “{query}”.</p>}

      {sections.map((section) => (
        <div key={section.title} className="designer-picker-section">
          <h4 className="designer-picker-heading">
            {section.title} <span>{section.hint}</span>
          </h4>
          <ul className="designer-pixel-grid">
            {section.items.map((p) => {
              const conflict = clockConflict(p, controller);
              const selected = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`designer-pixel-card${selected ? ' designer-pixel-card--selected' : ''}${conflict ? ' designer-pixel-card--conflict' : ''}`}
                    aria-pressed={selected}
                    data-id={p.id}
                    onClick={() => onSelect(selected ? '' : p.id)}
                  >
                    {p.image ? (
                      <img src={p.image} alt="" loading="lazy" />
                    ) : (
                      <span className="designer-pixel-card-noimg" aria-hidden="true">
                        <Zap size={18} />
                      </span>
                    )}
                    <span className="designer-pixel-card-name">{p.name}</span>
                    <span className="designer-pixel-card-meta">
                      {[
                        p.voltageChoices.length > 1
                          ? p.voltageChoices.map((v) => fmtVolts(v).replace(' V', '')).join('/') +
                            ' V'
                          : p.voltage != null
                            ? fmtVolts(p.voltage)
                            : null,
                        clockLabel(p),
                        p.channels !== 3 ? `${p.channels} ch` : null,
                        isRetired(p.status) ? 'discontinued' : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                    {conflict && <span className="designer-pixel-card-conflict">{conflict}</span>}
                  </button>
                  <Link className="designer-pixel-card-link" to={p.path}>
                    details
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
