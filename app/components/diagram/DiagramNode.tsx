import { useNavigate } from 'react-router';
import type { Category } from '~/lib/types';

interface DiagramNodeProps {
  category: Category;
  x: number;
  y: number;
  count?: number;
  isMain?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
  onMouseEnter?: (id: string) => void;
  onMouseLeave?: () => void;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 80;

function getCategoryIcon(categoryId: string, x: number, y: number) {
  const iconY = y - 12;

  switch (categoryId) {
    case 'pattern-drivers': {
      // Six rainbow stars arranged in an arc, each canted to follow the arc angle
      // Star points: 5-pointed star with R=5, r=2, centered at origin
      const starPoints =
        '0,-5 1.18,-1.62 4.76,-1.55 1.9,0.62 2.94,4.05 0,2 -2.94,4.05 -1.9,0.62 -4.76,-1.55 -1.18,-1.62';
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          {/* Far left star */}
          <polygon
            points={starPoints}
            className="rainbow-star rainbow-star-1"
            transform="translate(-25, 0) rotate(-32)"
          />
          {/* Left-middle star */}
          <polygon
            points={starPoints}
            className="rainbow-star rainbow-star-2"
            transform="translate(-15, -6) rotate(-20)"
          />
          {/* Left-center star */}
          <polygon
            points={starPoints}
            className="rainbow-star rainbow-star-3"
            transform="translate(-5, -10) rotate(-7)"
          />
          {/* Right-center star */}
          <polygon
            points={starPoints}
            className="rainbow-star rainbow-star-4"
            transform="translate(5, -10) rotate(7)"
          />
          {/* Right-middle star */}
          <polygon
            points={starPoints}
            className="rainbow-star rainbow-star-5"
            transform="translate(15, -6) rotate(20)"
          />
          {/* Far right star */}
          <polygon
            points={starPoints}
            className="rainbow-star rainbow-star-6"
            transform="translate(25, 0) rotate(32)"
          />
        </g>
      );
    }

    case 'controllers':
      // Binary data to square wave - showing signal transformation
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          {/* Scrolling binary stream on left */}
          <defs>
            <clipPath id="binary-clip-left">
              <rect x="-32" y="-10" width="24" height="20" />
            </clipPath>
            <clipPath id="square-wave-clip-right">
              <rect x="12" y="-10" width="14" height="20" />
            </clipPath>
          </defs>
          <g clipPath="url(#binary-clip-left)" mask="url(#binary-fade-mask-left)">
            <text fontSize="9" className="rainbow-binary-scroll rainbow-binary-scroll-left">
              <tspan y="4">0101010101010101</tspan>
            </text>
          </g>
          {/* Arrow in middle */}
          <line x1="-6" y1="0" x2="2" y2="0" className="diagram-arrow-line" />
          <polygon points="2,-3 8,0 2,3" className="diagram-arrow-head" />
          {/* Scrolling square wave on right */}
          <g clipPath="url(#square-wave-clip-right)" mask="url(#square-wave-mask-right)">
            <path
              d="M12,-4 L16,-4 L16,4 L20,4 L20,-4 L24,-4 L24,4 L28,4 L28,-4 L32,-4 L32,4 L36,4"
              className="square-wave-scroll"
            />
          </g>
        </g>
      );

    case 'level-converters':
      // Small square wave -> arrow -> large square wave (side by side)
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <defs>
            <clipPath id="small-wave-clip">
              <rect x="-26" y="-10" width="16" height="20" />
            </clipPath>
            <clipPath id="large-wave-clip">
              <rect x="10" y="-14" width="16" height="20" />
            </clipPath>
          </defs>
          {/* Left wave - same amplitude as controllers (input signal) - scrolling */}
          <g clipPath="url(#small-wave-clip)" mask="url(#small-wave-mask)">
            <path
              d="M-26,-4 L-22,-4 L-22,4 L-18,4 L-18,-4 L-14,-4 L-14,4 L-10,4 L-10,-4 L-6,-4 L-6,4 L-2,4"
              className="square-wave-scroll"
            />
          </g>
          {/* Arrow in middle */}
          <line x1="-8" y1="0" x2="0" y2="0" className="diagram-arrow-line" />
          <polygon points="0,-3 6,0 0,3" className="diagram-arrow-head" />
          {/* Right wave - larger amplitude (output signal) - scrolling, same baseline as left */}
          <g clipPath="url(#large-wave-clip)" mask="url(#large-wave-mask)">
            <path
              d="M10,4 L10,-12 L14,-12 L14,4 L18,4 L18,-12 L22,-12 L22,4 L26,4 L26,-12 L30,-12 L30,4 L34,4"
              className="square-wave-scroll"
            />
          </g>
        </g>
      );

    case 'pixels':
      // LED strip with rainbow-animated dots (6 pixels) - symmetric
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-28" y="-5" width="56" height="10" rx="2" />
          <circle cx="-20" cy="0" r="3" className="rainbow-pixel rainbow-pixel-1" />
          <circle cx="-12" cy="0" r="3" className="rainbow-pixel rainbow-pixel-2" />
          <circle cx="-4" cy="0" r="3" className="rainbow-pixel rainbow-pixel-3" />
          <circle cx="4" cy="0" r="3" className="rainbow-pixel rainbow-pixel-4" />
          <circle cx="12" cy="0" r="3" className="rainbow-pixel rainbow-pixel-5" />
          <circle cx="20" cy="0" r="3" className="rainbow-pixel rainbow-pixel-6" />
        </g>
      );

    case 'drive-libraries':
      // Books/library
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          {/* Three books standing upright */}
          <rect x="-16" y="-10" width="8" height="20" rx="1" />
          <rect x="-6" y="-8" width="8" height="18" rx="1" />
          <rect x="4" y="-10" width="10" height="20" rx="1" />
          {/* Book spines */}
          <line x1="-12" y1="-6" x2="-12" y2="6" />
          <line x1="-2" y1="-4" x2="-2" y2="6" />
          <line x1="9" y1="-6" x2="9" y2="6" />
        </g>
      );

    case 'microboards':
      // Horizontal PCB with mousebite holes along edges
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          {/* Main board - horizontal/landscape orientation */}
          <rect x="-20" y="-8" width="40" height="16" rx="2" />
          {/* Mousebite holes along top edge */}
          <circle cx="-14" cy="-8" r="2" className="diagram-node-icon-fill" />
          <circle cx="-7" cy="-8" r="2" className="diagram-node-icon-fill" />
          <circle cx="0" cy="-8" r="2" className="diagram-node-icon-fill" />
          <circle cx="7" cy="-8" r="2" className="diagram-node-icon-fill" />
          <circle cx="14" cy="-8" r="2" className="diagram-node-icon-fill" />
          {/* Mousebite holes along bottom edge */}
          <circle cx="-14" cy="8" r="2" className="diagram-node-icon-fill" />
          <circle cx="-7" cy="8" r="2" className="diagram-node-icon-fill" />
          <circle cx="0" cy="8" r="2" className="diagram-node-icon-fill" />
          <circle cx="7" cy="8" r="2" className="diagram-node-icon-fill" />
          <circle cx="14" cy="8" r="2" className="diagram-node-icon-fill" />
          {/* Small chip on board */}
          <rect x="-6" y="-4" width="12" height="8" rx="1" />
        </g>
      );

    case 'connectors':
      // Mating connector pair
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          {/* Left connector (male) with pins */}
          <rect x="-18" y="-8" width="14" height="16" rx="2" />
          <line x1="-4" y1="-4" x2="0" y2="-4" strokeWidth="2" />
          <line x1="-4" y1="0" x2="0" y2="0" strokeWidth="2" />
          <line x1="-4" y1="4" x2="0" y2="4" strokeWidth="2" />
          {/* Right connector (female) with sockets */}
          <rect x="4" y="-8" width="14" height="16" rx="2" />
          <circle cx="8" cy="-4" r="2" />
          <circle cx="8" cy="0" r="2" />
          <circle cx="8" cy="4" r="2" />
        </g>
      );

    case 'adapters':
      // Converter box - same size as microboards
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <rect x="-20" y="-8" width="40" height="16" rx="2" />
          <line x1="-10" y1="0" x2="10" y2="0" />
          <polygon points="-2,-4 6,0 -2,4" className="diagram-node-icon-fill" />
        </g>
      );

    case 'pixel-decoders':
      // Square wave to binary - opposite of controllers
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          <defs>
            <clipPath id="square-wave-clip-left">
              <rect x="-26" y="-10" width="16" height="20" />
            </clipPath>
            <clipPath id="binary-clip-right">
              <rect x="8" y="-10" width="22" height="20" />
            </clipPath>
          </defs>
          {/* Scrolling square wave on left */}
          <g clipPath="url(#square-wave-clip-left)" mask="url(#square-wave-mask-left)">
            <path
              d="M-26,-4 L-22,-4 L-22,4 L-18,4 L-18,-4 L-14,-4 L-14,4 L-10,4 L-10,-4 L-6,-4 L-6,4 L-2,4"
              className="square-wave-scroll"
            />
          </g>
          {/* Arrow in middle */}
          <line x1="-8" y1="0" x2="0" y2="0" className="diagram-arrow-line" />
          <polygon points="0,-3 6,0 0,3" className="diagram-arrow-head" />
          {/* Scrolling binary stream on right */}
          <g clipPath="url(#binary-clip-right)" mask="url(#binary-fade-mask-right)">
            <text fontSize="9" className="rainbow-binary-scroll rainbow-binary-scroll-right">
              <tspan x="8" y="4">
                0101010101010101
              </tspan>
            </text>
          </g>
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
      // Handshake - representing partnership/complete solutions
      return (
        <g className="diagram-node-icon" transform={`translate(${x}, ${iconY})`}>
          {/* Left hand coming from left */}
          <path d="M-20,0 L-12,0 L-8,-4 L-4,0 L0,0" />
          {/* Right hand coming from right */}
          <path d="M20,0 L12,0 L8,4 L4,0 L0,0" />
          {/* Clasped hands in middle */}
          <ellipse cx="0" cy="0" rx="6" ry="4" className="diagram-node-icon-fill" />
          {/* Wrist cuffs */}
          <line x1="-20" y1="-3" x2="-20" y2="3" strokeWidth="2" />
          <line x1="20" y1="-3" x2="20" y2="3" strokeWidth="2" />
        </g>
      );

    case 'pixel-ics':
      // Chip package with driver triangle and monochromatic output dots
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
          {/* Monochromatic LED dots on outputs - intensity varies with rainbow */}
          <circle cx="17" cy="-6" r="2.5" className="mono-led mono-led-1" />
          <circle cx="17" cy="0" r="2.5" className="mono-led mono-led-2" />
          <circle cx="17" cy="6" r="2.5" className="mono-led mono-led-3" />
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
  isDimmed = false,
  onMouseEnter,
  onMouseLeave,
}: DiagramNodeProps) {
  const navigate = useNavigate();
  const halfWidth = NODE_WIDTH / 2;
  const halfHeight = NODE_HEIGHT / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(category.path);
  };

  return (
    <a
      href={category.path}
      onClick={handleClick}
      className={`diagram-node ${isMain ? 'diagram-node--main' : ''} ${isHighlighted ? 'diagram-node--highlighted' : ''} ${isDimmed ? 'diagram-node--dimmed' : ''}`}
      style={{ '--node-hue': category.color.hue } as React.CSSProperties}
      onMouseEnter={() => onMouseEnter?.(category.id)}
      onMouseLeave={() => onMouseLeave?.()}
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
    </a>
  );
}

export { NODE_WIDTH, NODE_HEIGHT };
