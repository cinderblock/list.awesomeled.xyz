interface DiagramConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type?: 'main' | 'optional';
  isHighlighted?: boolean;
}

export function DiagramConnection({
  fromX,
  fromY,
  toX,
  toY,
  type = 'optional',
  isHighlighted = false,
}: DiagramConnectionProps) {
  // Calculate control points for a smooth bezier curve
  const dx = toX - fromX;
  const dy = toY - fromY;

  // For horizontal connections, curve horizontally
  // For vertical connections, curve vertically
  let path: string;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Primarily horizontal
    const midX = fromX + dx * 0.5;
    path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;
  } else {
    // Primarily vertical
    const midY = fromY + dy * 0.5;
    path = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
  }

  const className = [
    'connection-line',
    `connection-line--${type}`,
    isHighlighted ? 'connection-line--highlighted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <path
      className={className}
      d={path}
      markerEnd="url(#arrowhead)"
    />
  );
}
