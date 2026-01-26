import { useState } from 'react';
import { CATEGORIES, type Category } from '~/lib/types';
import { DiagramNode, NODE_WIDTH, NODE_HEIGHT } from './DiagramNode';
import { DiagramConnection } from './DiagramConnection';

interface LEDSystemDiagramProps {
  counts: Record<string, number>;
  onCategoryClick: (categoryId: string) => void;
}

// Node positions - reorganized layout
interface NodePosition {
  id: string;
  x: number;
  y: number;
  isMain: boolean;
}

const NODE_POSITIONS: NodePosition[] = [
  // Software Zone (left side)
  { id: 'pattern-drivers', x: 100, y: 140, isMain: true },
  { id: 'drive-libraries', x: 100, y: 350, isMain: false },

  // Hardware Zone (center) - includes microboards
  { id: 'controllers', x: 400, y: 215, isMain: true },
  { id: 'level-converters', x: 620, y: 140, isMain: true },
  { id: 'connectors', x: 620, y: 290, isMain: true },
  // Adapters and microboards horizontally aligned
  { id: 'adapters', x: 300, y: 460, isMain: false },
  { id: 'microboards', x: 500, y: 460, isMain: false },

  // Output Zone (right side) - vertically aligned
  { id: 'pixels', x: 880, y: 140, isMain: true },
  { id: 'pixel-decoders', x: 880, y: 290, isMain: false }, // aligned with connectors
  { id: 'pixel-ics', x: 880, y: 410, isMain: false },

  // Top right corner - standalone
  { id: 'diffusive-materials', x: 1100, y: 100, isMain: false },

  // Bottom standalone block - full width
  { id: 'commercial-systems', x: 600, y: 630, isMain: false },
];

// Special nodes positions
const COMBINE_NODE = { x: 400, y: 340, width: 100, height: 50 }; // Below controllers
const NETWORK_NODE = { x: 270, y: 140, width: 100, height: 60 };
const LEDS_NODE = { x: 1060, y: 410, width: 100, height: 60 };
const OTHER_OUTPUTS_NODE = { x: 1060, y: 290, width: 100, height: 60 };

// Connections between nodes - all main type now
interface Connection {
  from: string;
  to: string;
  bias?: 'horizontal' | 'vertical';
}

const CONNECTIONS: Connection[] = [
  // Main signal flow
  { from: 'controllers', to: 'level-converters' },
  { from: 'level-converters', to: 'connectors' },
  { from: 'controllers', to: 'connectors' },

  // Connectors to output (horizontal bias)
  { from: 'connectors', to: 'pixels', bias: 'horizontal' },
  { from: 'connectors', to: 'pixel-decoders', bias: 'horizontal' },
  { from: 'connectors', to: 'pixel-ics', bias: 'horizontal' },
];

// Zone definitions - all same height
const ZONES = [
  { x: 10, y: 50, width: 190, height: 470, label: 'Software', labelY: 75 },
  { x: 210, y: 50, width: 500, height: 470, label: 'Infrastructure', labelY: 75 },
  { x: 790, y: 50, width: 180, height: 470, label: 'Output', labelY: 75 },
];

function getNodePosition(id: string): NodePosition | undefined {
  return NODE_POSITIONS.find((n) => n.id === id);
}

function getConnectionPoint(
  nodeId: string,
  side: 'left' | 'right' | 'top' | 'bottom'
): { x: number; y: number } {
  const node = getNodePosition(nodeId);
  if (!node) return { x: 0, y: 0 };

  const halfWidth = NODE_WIDTH / 2;
  const halfHeight = NODE_HEIGHT / 2;

  switch (side) {
    case 'left':
      return { x: node.x - halfWidth, y: node.y };
    case 'right':
      return { x: node.x + halfWidth, y: node.y };
    case 'top':
      return { x: node.x, y: node.y - halfHeight };
    case 'bottom':
      return { x: node.x, y: node.y + halfHeight };
  }
}

function getConnectionPoints(
  fromId: string,
  toId: string,
  bias?: 'horizontal' | 'vertical'
) {
  const from = getNodePosition(fromId);
  const to = getNodePosition(toId);
  if (!from || !to) return null;

  const dx = to.x - from.x;
  const dy = to.y - from.y;

  let fromSide: 'left' | 'right' | 'top' | 'bottom';
  let toSide: 'left' | 'right' | 'top' | 'bottom';

  // Use bias if specified, otherwise auto-detect
  if (bias === 'horizontal' || (!bias && Math.abs(dx) > Math.abs(dy))) {
    fromSide = dx > 0 ? 'right' : 'left';
    toSide = dx > 0 ? 'left' : 'right';
  } else {
    fromSide = dy > 0 ? 'bottom' : 'top';
    toSide = dy > 0 ? 'top' : 'bottom';
  }

  return {
    from: getConnectionPoint(fromId, fromSide),
    to: getConnectionPoint(toId, toSide),
    bias,
  };
}

// Placeholder category for future LEDs
const LEDS_CATEGORY: Category = {
  id: 'leds',
  name: 'LEDs',
  description: 'Individual LED components (coming soon)',
  path: '/leds',
  viewType: 'table',
  color: { hue: 45, name: 'yellow' },
};

export function LEDSystemDiagram({ counts, onCategoryClick }: LEDSystemDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const getHighlightedConnections = () => {
    if (!hoveredNode) return new Set<string>();
    const highlighted = new Set<string>();
    CONNECTIONS.forEach((conn) => {
      if (conn.from === hoveredNode || conn.to === hoveredNode) {
        highlighted.add(`${conn.from}-${conn.to}`);
      }
    });
    return highlighted;
  };

  const highlightedConnections = getHighlightedConnections();

  return (
    <svg
      className="led-system-diagram"
      viewBox="0 0 1200 750"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="6"
          markerHeight="5"
          refX="5"
          refY="2.5"
          orient="auto"
        >
          <polygon points="0 0, 6 2.5, 0 5" className="diagram-arrow" />
        </marker>
      </defs>

      {/* Zone backgrounds */}
      <g className="diagram-zones">
        {ZONES.map((zone) => (
          <g key={zone.label}>
            <rect
              className="diagram-zone"
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              rx="8"
            />
            <text
              className="diagram-zone-label"
              x={zone.x + zone.width / 2}
              y={zone.labelY}
            >
              {zone.label}
            </text>
          </g>
        ))}

        {/* Diffusive Materials zone (top right) */}
        <g>
          <rect
            className="diagram-zone"
            x={1010}
            y={50}
            width={180}
            height={100}
            rx="8"
          />
          <text className="diagram-zone-label" x={1100} y={75}>
            Finishing
          </text>
        </g>

        {/* Commercial Systems zone (bottom) - full width */}
        <g>
          <rect
            className="diagram-zone"
            x={10}
            y={545}
            width={1180}
            height={165}
            rx="8"
          />
          <text className="diagram-zone-label" x={600} y={568}>
            Complete Solutions
          </text>
        </g>
      </g>

      {/* Network/Protocol box between Pattern Drivers and Controllers */}
      <g className="diagram-special-node">
        <rect
          className="diagram-network-box"
          x={NETWORK_NODE.x - NETWORK_NODE.width / 2}
          y={NETWORK_NODE.y - NETWORK_NODE.height / 2}
          width={NETWORK_NODE.width}
          height={NETWORK_NODE.height}
          rx="6"
        />
        <text className="diagram-network-label" x={NETWORK_NODE.x} y={NETWORK_NODE.y - 12}>
          Network
        </text>
        <text className="diagram-network-protocols" x={NETWORK_NODE.x} y={NETWORK_NODE.y + 4}>
          E1.31 / Artnet
        </text>
        <text className="diagram-network-protocols" x={NETWORK_NODE.x} y={NETWORK_NODE.y + 18}>
          WiFi / USB / DMX
        </text>
      </g>

      {/* Combine node for Drive Libraries + Microboards + Adapters */}
      <g className="diagram-special-node">
        <rect
          className="diagram-network-box"
          x={COMBINE_NODE.x - COMBINE_NODE.width / 2}
          y={COMBINE_NODE.y - COMBINE_NODE.height / 2}
          width={COMBINE_NODE.width}
          height={COMBINE_NODE.height}
          rx="6"
        />
        <text className="diagram-network-label" x={COMBINE_NODE.x} y={COMBINE_NODE.y - 6}>
          combine to
        </text>
        <text className="diagram-network-label" x={COMBINE_NODE.x} y={COMBINE_NODE.y + 10}>
          become
        </text>
      </g>

      {/* Arrow from combine box to Controllers (upward) */}
      <g className="diagram-becomes">
        <path
          className="connection-line"
          d={`M ${COMBINE_NODE.x} ${COMBINE_NODE.y - COMBINE_NODE.height / 2 - 5}
              L ${COMBINE_NODE.x} ${215 + NODE_HEIGHT / 2 + 5}`}
          markerEnd="url(#arrowhead)"
        />
      </g>

      {/* Other Outputs box for pixel decoders */}
      <g className="diagram-special-node">
        <rect
          className="diagram-network-box"
          x={OTHER_OUTPUTS_NODE.x - OTHER_OUTPUTS_NODE.width / 2}
          y={OTHER_OUTPUTS_NODE.y - OTHER_OUTPUTS_NODE.height / 2}
          width={OTHER_OUTPUTS_NODE.width}
          height={OTHER_OUTPUTS_NODE.height}
          rx="6"
        />
        <text className="diagram-network-label" x={OTHER_OUTPUTS_NODE.x} y={OTHER_OUTPUTS_NODE.y - 12}>
          Other
        </text>
        <text className="diagram-network-protocols" x={OTHER_OUTPUTS_NODE.x} y={OTHER_OUTPUTS_NODE.y + 4}>
          Relay / Lasers
        </text>
        <text className="diagram-network-protocols" x={OTHER_OUTPUTS_NODE.x} y={OTHER_OUTPUTS_NODE.y + 18}>
          Motors / DMX
        </text>
      </g>

      {/* LEDs future category box */}
      <g
        className="diagram-future-node"
        style={{ '--node-hue': LEDS_CATEGORY.color.hue } as React.CSSProperties}
      >
        <rect
          className="diagram-future-box"
          x={LEDS_NODE.x - LEDS_NODE.width / 2}
          y={LEDS_NODE.y - LEDS_NODE.height / 2}
          width={LEDS_NODE.width}
          height={LEDS_NODE.height}
          rx="8"
        />
        <text className="diagram-future-label" x={LEDS_NODE.x} y={LEDS_NODE.y + 5}>
          LEDs
        </text>
      </g>

      {/* Connection lines */}
      <g className="diagram-connections">
        {/* Pattern Drivers to Network */}
        <DiagramConnection
          fromX={100 + NODE_WIDTH / 2}
          fromY={140}
          toX={NETWORK_NODE.x - NETWORK_NODE.width / 2}
          toY={NETWORK_NODE.y}
          bias="horizontal"
          isHighlighted={hoveredNode === 'pattern-drivers'}
        />

        {/* Network to Controllers */}
        <DiagramConnection
          fromX={NETWORK_NODE.x + NETWORK_NODE.width / 2}
          fromY={NETWORK_NODE.y}
          toX={400}
          toY={215 - NODE_HEIGHT / 2}
          startBias="horizontal"
          endBias="vertical"
          isHighlighted={hoveredNode === 'controllers'}
        />

        {/* Drive Libraries to Combine */}
        <DiagramConnection
          fromX={100 + NODE_WIDTH / 2}
          fromY={350}
          toX={COMBINE_NODE.x - COMBINE_NODE.width / 2}
          toY={COMBINE_NODE.y}
          bias="horizontal"
          isHighlighted={hoveredNode === 'drive-libraries'}
        />

        {/* Adapters to Combine */}
        <DiagramConnection
          fromX={300}
          fromY={460 - NODE_HEIGHT / 2}
          toX={COMBINE_NODE.x - 20}
          toY={COMBINE_NODE.y + COMBINE_NODE.height / 2}
          bias="vertical"
          isHighlighted={hoveredNode === 'adapters'}
        />

        {/* Microboards to Combine */}
        <DiagramConnection
          fromX={500}
          fromY={460 - NODE_HEIGHT / 2}
          toX={COMBINE_NODE.x + 20}
          toY={COMBINE_NODE.y + COMBINE_NODE.height / 2}
          bias="vertical"
          isHighlighted={hoveredNode === 'microboards'}
        />

        {/* Pixel ICs to LEDs */}
        <DiagramConnection
          fromX={880 + NODE_WIDTH / 2}
          fromY={410}
          toX={LEDS_NODE.x - LEDS_NODE.width / 2}
          toY={LEDS_NODE.y}
          bias="horizontal"
          isHighlighted={hoveredNode === 'pixel-ics'}
        />

        {/* Pixel Decoders to Other Outputs */}
        <DiagramConnection
          fromX={880 + NODE_WIDTH / 2}
          fromY={290}
          toX={OTHER_OUTPUTS_NODE.x - OTHER_OUTPUTS_NODE.width / 2}
          toY={OTHER_OUTPUTS_NODE.y}
          bias="horizontal"
          isHighlighted={hoveredNode === 'pixel-decoders'}
        />

        {/* Regular connections */}
        {CONNECTIONS.map((conn) => {
          const points = getConnectionPoints(conn.from, conn.to, conn.bias);
          if (!points) return null;
          const key = `${conn.from}-${conn.to}`;
          return (
            <DiagramConnection
              key={key}
              fromX={points.from.x}
              fromY={points.from.y}
              toX={points.to.x}
              toY={points.to.y}
              bias={points.bias}
              isHighlighted={highlightedConnections.has(key)}
            />
          );
        })}
      </g>

      {/* Category nodes */}
      <g className="diagram-nodes">
        {NODE_POSITIONS.map((nodePos) => {
          const category = CATEGORIES.find((c) => c.id === nodePos.id);
          if (!category) return null;
          return (
            <DiagramNode
              key={nodePos.id}
              category={category}
              x={nodePos.x}
              y={nodePos.y}
              count={counts[nodePos.id]}
              isMain={nodePos.isMain}
              isHighlighted={hoveredNode === nodePos.id}
              onMouseEnter={setHoveredNode}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={onCategoryClick}
            />
          );
        })}
      </g>
    </svg>
  );
}
