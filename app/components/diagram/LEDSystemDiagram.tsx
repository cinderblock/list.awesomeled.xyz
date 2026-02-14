import { useState } from 'react';
import { CATEGORIES, type Category } from '~/lib/types';
import { DiagramNode, NODE_WIDTH, NODE_HEIGHT } from './DiagramNode';
import { DiagramConnection } from './DiagramConnection';

interface LEDSystemDiagramProps {
  counts: Record<string, number>;
  simpleMode?: boolean;
}

// Nodes visible in simple mode
const SIMPLE_MODE_NODES = new Set([
  'pattern-drivers',
  'controllers',
  'connectors',
  'pixels',
  'diffusive-materials',
  'commercial-systems',
]);

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
  { id: 'controllers', x: 400, y: 230, isMain: true },
  { id: 'level-converters', x: 620, y: 170, isMain: true },
  { id: 'connectors', x: 620, y: 290, isMain: true },
  // Adapters and microboards horizontally aligned
  { id: 'microboards', x: 300, y: 460, isMain: false },
  { id: 'adapters', x: 500, y: 460, isMain: false },

  // Output Zone (right side) - vertically aligned
  { id: 'pixels', x: 880, y: 170, isMain: true },
  { id: 'pixel-decoders', x: 880, y: 290, isMain: false }, // aligned with connectors
  { id: 'pixel-ics', x: 880, y: 410, isMain: false },
  { id: 'diffusive-materials', x: 1060, y: 170, isMain: false },

  // Bottom block - full width
  { id: 'commercial-systems', x: 600, y: 630, isMain: false },
];

// Special nodes positions
const COMBINE_NODE = { x: 400, y: 340, width: 100, height: 50 }; // Below controllers
const NETWORK_NODE = { x: 285, y: 140, width: 100, height: 60 };
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
  { x: 210, y: 50, width: 540, height: 470, label: 'Infrastructure', labelY: 75 },
  { x: 760, y: 50, width: 430, height: 470, label: 'Output', labelY: 75 },
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

// Placeholder category for future Discrete LEDs
const LEDS_CATEGORY: Category = {
  id: 'discrete-leds',
  name: 'Discrete LEDs',
  description: 'Individual LED components (coming soon)',
  path: '/discrete-leds',
  viewType: 'table',
  color: { hue: 45, name: 'yellow' },
};

export function LEDSystemDiagram({ counts, simpleMode = false }: LEDSystemDiagramProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const isNodeDimmed = (nodeId: string) => {
    if (simpleMode) {
      return !SIMPLE_MODE_NODES.has(nodeId);
    }
    // Advanced mode: only dim commercial-systems
    return nodeId === 'commercial-systems';
  };

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
      className={`led-system-diagram ${simpleMode ? 'simple-mode' : ''}`}
      viewBox="0 0 1200 750"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Arrow marker and gradient definitions */}
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
        {/* Rainbow gradient for binary text - tiles every 20px to match scroll animation */}
        <linearGradient
          id="rainbow-text-gradient"
          x1="0"
          y1="0"
          x2="20"
          y2="0"
          gradientUnits="userSpaceOnUse"
          spreadMethod="repeat"
        >
          <stop offset="0%" className="rainbow-gradient-stop-1" />
          <stop offset="25%" className="rainbow-gradient-stop-2" />
          <stop offset="50%" className="rainbow-gradient-stop-3" />
          <stop offset="75%" className="rainbow-gradient-stop-4" />
          <stop offset="100%" className="rainbow-gradient-stop-1" />
        </linearGradient>
        {/* Fade mask for binary text edges */}
        <linearGradient id="binary-fade-gradient-left" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="black" />
          <stop offset="20%" stopColor="white" />
          <stop offset="80%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>
        <linearGradient id="binary-fade-gradient-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="black" />
          <stop offset="20%" stopColor="white" />
          <stop offset="80%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>
        <mask id="binary-fade-mask-left">
          <rect x="-32" y="-10" width="24" height="20" fill="url(#binary-fade-gradient-left)" />
        </mask>
        <mask id="binary-fade-mask-right">
          <rect x="8" y="-10" width="22" height="20" fill="url(#binary-fade-gradient-right)" />
        </mask>
        {/* Fade masks for square wave edges */}
        <linearGradient id="wave-fade-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="black" />
          <stop offset="15%" stopColor="white" />
          <stop offset="85%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </linearGradient>
        <mask id="square-wave-mask-right">
          <rect x="12" y="-10" width="14" height="20" fill="url(#wave-fade-gradient)" />
        </mask>
        <mask id="square-wave-mask-left">
          <rect x="-26" y="-10" width="16" height="20" fill="url(#wave-fade-gradient)" />
        </mask>
        <mask id="small-wave-mask">
          <rect x="-26" y="-10" width="16" height="20" fill="url(#wave-fade-gradient)" />
        </mask>
        <mask id="large-wave-mask">
          <rect x="10" y="-14" width="16" height="20" fill="url(#wave-fade-gradient)" />
        </mask>
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

        {/* Commercial Systems zone (bottom) - full width */}
        <g className={isNodeDimmed('commercial-systems') ? 'diagram-zone--dimmed' : ''}>
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
      <g className={`diagram-special-node ${simpleMode ? 'diagram-special-node--dimmed' : ''}`}>
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
      <g className={`diagram-becomes ${simpleMode ? 'diagram-becomes--dimmed' : ''}`}>
        <path
          className="connection-line"
          d={`M ${COMBINE_NODE.x} ${COMBINE_NODE.y - COMBINE_NODE.height / 2}
              L ${COMBINE_NODE.x} ${230 + NODE_HEIGHT / 2 + 5}`}
          markerEnd="url(#arrowhead)"
        />
      </g>

      {/* Other Outputs box for pixel decoders */}
      <g className={`diagram-special-node ${simpleMode ? 'diagram-special-node--dimmed' : ''}`}>
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
        className={`diagram-future-node ${simpleMode ? 'diagram-future-node--dimmed' : ''}`}
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
        {/* RGB LED dots - vertical arrangement, shifted up for label */}
        <circle cx={LEDS_NODE.x} cy={LEDS_NODE.y - 22} r="5" className="rgb-led rgb-led-r" />
        <circle cx={LEDS_NODE.x} cy={LEDS_NODE.y - 8} r="5" className="rgb-led rgb-led-g" />
        <circle cx={LEDS_NODE.x} cy={LEDS_NODE.y + 6} r="5" className="rgb-led rgb-led-b" />
        <text className="diagram-future-label" x={LEDS_NODE.x} y={LEDS_NODE.y + 24}>
          Discrete LEDs
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
          toY={230 - NODE_HEIGHT / 2}
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
          isDimmed={isNodeDimmed('drive-libraries')}
        />

        {/* Microboards to Combine */}
        <DiagramConnection
          fromX={300}
          fromY={460 - NODE_HEIGHT / 2}
          toX={COMBINE_NODE.x - 20}
          toY={COMBINE_NODE.y + COMBINE_NODE.height / 2}
          bias="vertical"
          isHighlighted={hoveredNode === 'microboards'}
          isDimmed={isNodeDimmed('microboards')}
        />

        {/* Adapters to Combine */}
        <DiagramConnection
          fromX={500}
          fromY={460 - NODE_HEIGHT / 2}
          toX={COMBINE_NODE.x + 20}
          toY={COMBINE_NODE.y + COMBINE_NODE.height / 2}
          bias="vertical"
          isHighlighted={hoveredNode === 'adapters'}
          isDimmed={isNodeDimmed('adapters')}
        />

        {/* Pixel ICs to LEDs */}
        <DiagramConnection
          fromX={880 + NODE_WIDTH / 2}
          fromY={410}
          toX={LEDS_NODE.x - LEDS_NODE.width / 2}
          toY={LEDS_NODE.y}
          bias="horizontal"
          isHighlighted={hoveredNode === 'pixel-ics'}
          isDimmed={isNodeDimmed('pixel-ics')}
        />

        {/* Pixel Decoders to Other Outputs */}
        <DiagramConnection
          fromX={880 + NODE_WIDTH / 2}
          fromY={290}
          toX={OTHER_OUTPUTS_NODE.x - OTHER_OUTPUTS_NODE.width / 2}
          toY={OTHER_OUTPUTS_NODE.y}
          bias="horizontal"
          isHighlighted={hoveredNode === 'pixel-decoders'}
          isDimmed={isNodeDimmed('pixel-decoders')}
        />

        {/* Regular connections */}
        {CONNECTIONS.map((conn) => {
          const points = getConnectionPoints(conn.from, conn.to, conn.bias);
          if (!points) return null;
          const key = `${conn.from}-${conn.to}`;
          const connDimmed = isNodeDimmed(conn.from) || isNodeDimmed(conn.to);
          return (
            <DiagramConnection
              key={key}
              fromX={points.from.x}
              fromY={points.from.y}
              toX={points.to.x}
              toY={points.to.y}
              bias={points.bias}
              isHighlighted={highlightedConnections.has(key)}
              isDimmed={connDimmed}
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
              isDimmed={isNodeDimmed(nodePos.id)}
              onMouseEnter={setHoveredNode}
              onMouseLeave={() => setHoveredNode(null)}
            />
          );
        })}
      </g>
    </svg>
  );
}
