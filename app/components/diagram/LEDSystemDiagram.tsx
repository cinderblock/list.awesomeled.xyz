import { useState } from 'react';
import { CATEGORIES } from '~/lib/types';
import { DiagramNode, NODE_WIDTH, NODE_HEIGHT } from './DiagramNode';
import { DiagramConnection } from './DiagramConnection';

interface LEDSystemDiagramProps {
  counts: Record<string, number>;
  onCategoryClick: (categoryId: string) => void;
}

// Node positions - organized in three zones
interface NodePosition {
  id: string;
  x: number;
  y: number;
  isMain: boolean;
}

const NODE_POSITIONS: NodePosition[] = [
  // Software Zone (left side)
  { id: 'pattern-drivers', x: 120, y: 180, isMain: true },
  { id: 'drive-libraries', x: 120, y: 340, isMain: false },

  // Hardware Zone (center)
  { id: 'controllers', x: 360, y: 180, isMain: true },
  { id: 'microboards', x: 320, y: 340, isMain: false },
  { id: 'level-converters', x: 600, y: 180, isMain: true },
  { id: 'connectors', x: 600, y: 340, isMain: false },
  { id: 'adapters', x: 480, y: 480, isMain: false },
  { id: 'pixel-decoders', x: 680, y: 480, isMain: false },
  { id: 'commercial-systems', x: 360, y: 560, isMain: false },

  // Output Zone (right side)
  { id: 'pixels', x: 880, y: 180, isMain: true },
  { id: 'pixel-ics', x: 1040, y: 300, isMain: false },
  { id: 'diffusive-materials', x: 880, y: 420, isMain: false },
];

// Connections between nodes
interface Connection {
  from: string;
  to: string;
  type: 'main' | 'optional';
}

const CONNECTIONS: Connection[] = [
  // Main signal flow
  { from: 'pattern-drivers', to: 'controllers', type: 'main' },
  { from: 'controllers', to: 'level-converters', type: 'main' },
  { from: 'level-converters', to: 'pixels', type: 'main' },

  // Supporting connections
  { from: 'drive-libraries', to: 'controllers', type: 'optional' },
  { from: 'microboards', to: 'controllers', type: 'optional' },
  { from: 'adapters', to: 'controllers', type: 'optional' },
  { from: 'connectors', to: 'level-converters', type: 'optional' },
  { from: 'connectors', to: 'pixels', type: 'optional' },
  { from: 'pixel-decoders', to: 'pixels', type: 'optional' },
  { from: 'pixels', to: 'pixel-ics', type: 'optional' },
  { from: 'pixels', to: 'diffusive-materials', type: 'optional' },
  { from: 'commercial-systems', to: 'pixels', type: 'optional' },
];

// Zone definitions
const ZONES = [
  { x: 0, y: 50, width: 220, height: 570, label: 'Software', labelY: 80 },
  { x: 220, y: 50, width: 560, height: 570, label: 'Hardware', labelY: 80 },
  { x: 780, y: 50, width: 420, height: 570, label: 'Output', labelY: 80 },
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

function getConnectionPoints(fromId: string, toId: string) {
  const from = getNodePosition(fromId);
  const to = getNodePosition(toId);
  if (!from || !to) return null;

  // Determine which sides to connect based on relative positions
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  let fromSide: 'left' | 'right' | 'top' | 'bottom';
  let toSide: 'left' | 'right' | 'top' | 'bottom';

  if (Math.abs(dx) > Math.abs(dy)) {
    // Primarily horizontal
    fromSide = dx > 0 ? 'right' : 'left';
    toSide = dx > 0 ? 'left' : 'right';
  } else {
    // Primarily vertical
    fromSide = dy > 0 ? 'bottom' : 'top';
    toSide = dy > 0 ? 'top' : 'bottom';
  }

  return {
    from: getConnectionPoint(fromId, fromSide),
    to: getConnectionPoint(toId, toSide),
  };
}

export function LEDSystemDiagram({ counts, onCategoryClick }: LEDSystemDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Find which connections involve the hovered node
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
      viewBox="0 0 1200 650"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Arrow marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" className="diagram-arrow" />
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
      </g>

      {/* Connection lines */}
      <g className="diagram-connections">
        {CONNECTIONS.map((conn) => {
          const points = getConnectionPoints(conn.from, conn.to);
          if (!points) return null;
          const key = `${conn.from}-${conn.to}`;
          return (
            <DiagramConnection
              key={key}
              fromX={points.from.x}
              fromY={points.from.y}
              toX={points.to.x}
              toY={points.to.y}
              type={conn.type}
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
