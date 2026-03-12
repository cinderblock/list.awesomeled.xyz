interface DiagramConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  bias?: 'horizontal' | 'vertical';
  startBias?: 'horizontal' | 'vertical';
  endBias?: 'horizontal' | 'vertical';
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

export function DiagramConnection({
  fromX,
  fromY,
  toX,
  toY,
  bias,
  startBias,
  endBias,
  isHighlighted = false,
  isDimmed = false,
}: DiagramConnectionProps) {
  const dx = toX - fromX;
  const dy = toY - fromY;

  // Calculate distance first (needed for approach distances)
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Determine biases - use explicit start/end biases, or fall back to shared bias, or auto-detect
  const autoBias = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
  const effectiveStartBias = startBias || bias || autoBias;
  const effectiveEndBias = endBias || bias || autoBias;

  // Approach distances - scale with distance for more natural curves
  const baseApproach = Math.min(dist * 0.3, 60);
  const startApproach = baseApproach * 0.6;
  const endApproach = baseApproach;

  // Connection point offset - how much to slide along the edge toward destination
  const connectionOffset = 8;
  const toDestX = dx / dist; // normalized direction toward destination
  const toDestY = dy / dist;
  const toOriginX = -toDestX; // normalized direction toward origin
  const toOriginY = -toDestY;

  // Calculate start point based on start bias
  let startX: number, startY: number;
  let straightStartX: number, straightStartY: number;

  if (effectiveStartBias === 'horizontal') {
    // Exiting left/right edge
    startX = fromX;
    startY = fromY + Math.sign(dy) * Math.min(connectionOffset, Math.abs(dy));
    straightStartX = Math.sign(dx);
    straightStartY = 0;
  } else {
    // Exiting top/bottom edge
    startX = fromX + Math.sign(dx) * Math.min(connectionOffset, Math.abs(dx));
    startY = fromY;
    straightStartX = 0;
    straightStartY = Math.sign(dy);
  }

  // Calculate end point based on end bias
  let endX: number, endY: number;
  let straightEndX: number, straightEndY: number;

  if (effectiveEndBias === 'horizontal') {
    // Entering left/right edge
    endX = toX;
    endY = toY - Math.sign(dy) * Math.min(connectionOffset, Math.abs(dy));
    straightEndX = -Math.sign(dx);
    straightEndY = 0;
  } else {
    // Entering top/bottom edge
    endX = toX - Math.sign(dx) * Math.min(connectionOffset, Math.abs(dx));
    endY = toY;
    straightEndX = 0;
    straightEndY = -Math.sign(dy);
  }

  // First control point - blend straight direction with toward-destination
  const blend1X = straightStartX + toDestX;
  const blend1Y = straightStartY + toDestY;
  const blend1Len = Math.sqrt(blend1X * blend1X + blend1Y * blend1Y);
  const cp1x = startX + (blend1X / blend1Len) * startApproach;
  const cp1y = startY + (blend1Y / blend1Len) * startApproach;

  // Second control point - blend straight direction with toward-origin
  const blend2X = straightEndX + toOriginX;
  const blend2Y = straightEndY + toOriginY;
  const blend2Len = Math.sqrt(blend2X * blend2X + blend2Y * blend2Y);
  const cp2x = endX + (blend2X / blend2Len) * endApproach;
  const cp2y = endY + (blend2Y / blend2Len) * endApproach;

  const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  const className = [
    'connection-line',
    isHighlighted ? 'connection-line--highlighted' : '',
    isDimmed ? 'connection-line--dimmed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return <path className={className} d={path} markerEnd="url(#arrowhead)" />;
}
