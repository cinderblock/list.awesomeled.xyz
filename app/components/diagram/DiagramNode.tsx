import type { Category } from '~/lib/types';

interface DiagramNodeProps {
  category: Category;
  x: number;
  y: number;
  count?: number;
  isMain?: boolean;
  isHighlighted?: boolean;
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
  onClick?: (id: string) => void;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;

function getCategoryIcon(categoryId: string, x: number, y: number) {
  const iconY = y - 12;

  switch (categoryId) {
    case 'pattern-drivers':
      // Monitor with code lines
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-16" y="-10" width="32" height="20" rx="2" />
          <line x1="-10" y1="-4" x2="10" y2="-4" />
          <line x1="-10" y1="0" x2="6" y2="0" />
          <line x1="-10" y1="4" x2="2" y2="4" />
        </g>
      );

    case 'controllers':
      // Circuit board
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-18" y="-12" width="36" height="24" rx="3" />
          <circle cx="-8" cy="-4" r="3" className="diagram-node-icon-fill" />
          <circle cx="8" cy="4" r="3" className="diagram-node-icon-fill" />
          <line x1="-8" y1="4" x2="8" y2="4" />
          <line x1="0" y1="-8" x2="0" y2="8" />
        </g>
      );

    case 'level-converters':
      // Voltage step symbol
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <path d="M-14,-6 L-6,-6 L-6,6 L6,6 L6,-6 L14,-6" />
          <line x1="-14" y1="0" x2="-10" y2="0" />
          <line x1="10" y1="0" x2="14" y2="0" />
        </g>
      );

    case 'pixels':
      // LED strip with dots
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-22" y="-5" width="44" height="10" rx="2" />
          <circle cx="-12" cy="0" r="4" className="diagram-node-icon-fill" />
          <circle cx="0" cy="0" r="4" className="diagram-node-icon-fill" />
          <circle cx="12" cy="0" r="4" className="diagram-node-icon-fill" />
        </g>
      );

    case 'drive-libraries':
      // Code blocks
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-14" y="-10" width="28" height="8" rx="1" />
          <rect x="-14" y="2" width="28" height="8" rx="1" />
          <line x1="-8" y1="-6" x2="8" y2="-6" />
          <line x1="-8" y1="6" x2="4" y2="6" />
        </g>
      );

    case 'microboards':
      // Small chip
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-12" y="-8" width="24" height="16" rx="2" />
          <line x1="-16" y1="-4" x2="-12" y2="-4" />
          <line x1="-16" y1="4" x2="-12" y2="4" />
          <line x1="12" y1="-4" x2="16" y2="-4" />
          <line x1="12" y1="4" x2="16" y2="4" />
          <circle cx="0" cy="0" r="3" className="diagram-node-icon-fill" />
        </g>
      );

    case 'connectors':
      // Plug shape
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-10" y="-8" width="12" height="16" rx="2" />
          <rect x="2" y="-6" width="10" height="12" rx="1" />
          <circle cx="-4" cy="-3" r="2" className="diagram-node-icon-fill" />
          <circle cx="-4" cy="3" r="2" className="diagram-node-icon-fill" />
        </g>
      );

    case 'adapters':
      // Converter box
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-16" y="-8" width="32" height="16" rx="2" />
          <line x1="-8" y1="0" x2="8" y2="0" />
          <polygon points="-2,-4 4,0 -2,4" className="diagram-node-icon-fill" />
        </g>
      );

    case 'pixel-decoders':
      // Signal decoder
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-14" y="-10" width="28" height="20" rx="2" />
          <path d="M-8,-4 L-4,0 L-8,4" />
          <line x1="0" y1="-4" x2="0" y2="4" />
          <line x1="4" y1="-4" x2="4" y2="4" />
          <line x1="8" y1="-4" x2="8" y2="4" />
        </g>
      );

    case 'diffusive-materials':
      // Blanket draped over something
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          {/* Draped blanket shape */}
          <path
            d="M-16,-6 Q-12,-10 -6,-6 Q0,-2 6,-6 Q12,-10 16,-6 L14,8 Q10,10 0,10 Q-10,10 -14,8 Z"
            className="diagram-node-icon-fill"
            opacity="0.5"
          />
          <path d="M-16,-6 Q-12,-10 -6,-6 Q0,-2 6,-6 Q12,-10 16,-6" />
          {/* Fold lines */}
          <path d="M-10,0 Q-6,2 -2,0" opacity="0.6" />
          <path d="M2,2 Q6,4 10,2" opacity="0.6" />
        </g>
      );

    case 'commercial-systems':
      // Complete system box
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-18" y="-10" width="36" height="20" rx="2" />
          <rect x="-14" y="-6" width="10" height="12" rx="1" className="diagram-node-icon-fill" />
          <line x1="0" y1="-4" x2="12" y2="-4" />
          <line x1="0" y1="0" x2="12" y2="0" />
          <line x1="0" y1="4" x2="8" y2="4" />
        </g>
      );

    case 'pixel-ics':
      // Chip package with driver triangle
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-10" y="-10" width="20" height="20" rx="2" />
          {/* Equilateral triangle pointing right (driver symbol) */}
          <polygon points="-4,-5 6,0 -4,5" className="diagram-node-icon-fill" />
          <line x1="-14" y1="-6" x2="-10" y2="-6" />
          <line x1="-14" y1="0" x2="-10" y2="0" />
          <line x1="-14" y1="6" x2="-10" y2="6" />
          <line x1="10" y1="-6" x2="14" y2="-6" />
          <line x1="10" y1="0" x2="14" y2="0" />
          <line x1="10" y1="6" x2="14" y2="6" />
        </g>
      );

    default:
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <circle r="10" />
        </g>
      );
  }
}

export function DiagramNode({
  category,
  x,
  y,
  count,
  isMain = false,
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: DiagramNodeProps) {
  const halfWidth = NODE_WIDTH / 2;
  const halfHeight = NODE_HEIGHT / 2;

  return (
    <g
      className={`diagram-node ${isMain ? 'diagram-node--main' : ''} ${isHighlighted ? 'diagram-node--highlighted' : ''}`}
      style={{ '--node-hue': category.color.hue } as React.CSSProperties}
      onMouseEnter={() => onMouseEnter?.(category.id)}
      onMouseLeave={() => onMouseLeave?.()}
      onClick={() => onClick?.(category.id)}
    >
      <rect
        className="diagram-node-bg"
        x={x - halfWidth}
        y={y - halfHeight}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx="10"
      />
      {getCategoryIcon(category.id, x, y)}
      <text className="diagram-node-label" x={x} y={y + 22}>
        {category.name}
      </text>
      {count !== undefined && (
        <text className="diagram-node-count" x={x} y={y + 34}>
          {count} {count === 1 ? 'entry' : 'entries'}
        </text>
      )}
    </g>
  );
}

export { NODE_WIDTH, NODE_HEIGHT };
