import {
  EMBED_ID,
  type BoxKind,
  type DiagramBox,
  type DiagramLabel,
  type DiagramModel,
} from '~/lib/designer';

interface Swatch {
  fill: string;
  stroke: string;
  text: string;
}

/** Literal colours for a standalone file (viewers outside a browser can't resolve CSS variables) */
export interface DiagramPalette {
  background: string;
  text: string;
  muted: string;
  wire: string;
  power: string;
  connector: string;
  boxes: Record<BoxKind, Swatch>;
}

// Box colours follow the site's category hues: controllers red, pixels
// orange, pattern drivers lime, level converters cyan; power is amber.
export const EXPORT_PALETTE: DiagramPalette = {
  background: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  wire: '#9ca3af',
  power: '#d97706',
  connector: '#15803d',
  boxes: {
    source: { fill: '#ecfccb', stroke: '#65a30d', text: '#3f6212' },
    controller: { fill: '#fee2e2', stroke: '#dc2626', text: '#991b1b' },
    pixels: { fill: '#ffedd5', stroke: '#ea580c', text: '#9a3412' },
    shifter: { fill: '#cffafe', stroke: '#0891b2', text: '#155e75' },
    supply: { fill: '#fef3c7', stroke: '#d97706', text: '#92400e' },
  },
};

const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const LINE_HEIGHT = 16;

interface SystemDiagramProps {
  model: DiagramModel;
  /** Omit on the page, where CSS themes the diagram; pass for exported files */
  palette?: DiagramPalette;
  /** Image path -> data URI, so an exported file needs nothing from the site */
  images?: Record<string, string>;
  /** Design JSON to embed in <metadata> (exports) */
  embed?: string;
  /** Link back to the design (exports) */
  link?: string;
}

function Box({
  box,
  palette,
  images,
}: {
  box: DiagramBox;
  palette?: DiagramPalette;
  images?: Record<string, string>;
}) {
  const swatch = palette?.boxes[box.kind];
  // Exports only draw images they managed to inline; the page loads them by URL
  const href = box.image ? (images ? images[box.image] : box.image) : undefined;
  const small = box.kind === 'shifter';
  const textX = small ? box.x + box.w / 2 : box.x + (href ? 72 : 14);
  const first = box.y + box.h / 2 - ((box.lines.length - 1) * LINE_HEIGHT) / 2 + 4;
  return (
    <g className={`dgm-box dgm-box--${box.kind}`} data-key={box.key}>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={small ? 6 : 9}
        fill={swatch?.fill}
        stroke={swatch?.stroke}
        strokeWidth={1.5}
        strokeDasharray={box.placeholder ? '6 4' : undefined}
      />
      {href && (
        <image
          href={href}
          x={box.x + 10}
          y={box.y + 10}
          width={52}
          height={box.h - 20}
          preserveAspectRatio="xMidYMid meet"
        />
      )}
      {box.lines.map((line, i) => (
        <text
          key={i}
          x={textX}
          y={first + i * LINE_HEIGHT}
          textAnchor={small ? 'middle' : 'start'}
          fontSize={small ? 10 : line.bold ? 13 : 11}
          fontWeight={line.bold ? 700 : 400}
          fill={swatch?.text}
          className={line.bold ? 'dgm-text dgm-text--bold' : 'dgm-text'}
        >
          {line.text}
        </text>
      ))}
    </g>
  );
}

function labelFill(label: DiagramLabel, palette?: DiagramPalette): string | undefined {
  if (!palette) return undefined;
  if (label.kind === 'title') return palette.text;
  if (label.kind === 'connector') return palette.connector;
  return palette.muted;
}

/**
 * The system diagram. Paints a DiagramModel; all geometry lives in
 * app/lib/designer/diagram.ts. Rendered on the page (CSS-themed) and again,
 * with a literal palette and inlined images, for SVG and PNG downloads.
 */
export function SystemDiagram({ model, palette, images, embed, link }: SystemDiagramProps) {
  const standalone = !!palette;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${model.width} ${model.height}`}
      width={standalone ? model.width : undefined}
      height={standalone ? model.height : undefined}
      role="img"
      aria-label={model.description}
      fontFamily={FONT}
      className="dgm"
    >
      <title>{model.description}</title>
      {embed && <metadata id={EMBED_ID}>{embed}</metadata>}
      {palette && <rect width={model.width} height={model.height} fill={palette.background} />}

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {model.wires.map((wire) => (
          <path
            key={wire.key}
            d={wire.d}
            className={`dgm-wire dgm-wire--${wire.kind}`}
            stroke={palette ? (wire.kind === 'power' ? palette.power : palette.wire) : undefined}
            strokeWidth={wire.kind === 'power' ? 2.5 : 2}
            strokeDasharray={wire.dashed ? '5 5' : undefined}
          />
        ))}
      </g>
      {model.dots.map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r={3.5} className="dgm-dot" fill={palette?.power} />
      ))}

      {model.boxes.map((box) => (
        <Box key={box.key} box={box} palette={palette} images={images} />
      ))}

      {model.labels.map((label, i) => {
        const text = (
          <text
            key={i}
            x={label.x}
            y={label.y}
            textAnchor={label.anchor}
            fontSize={label.kind === 'title' ? 17 : 10}
            fontWeight={label.kind === 'title' ? 700 : 400}
            fill={labelFill(label, palette)}
            className={`dgm-label dgm-label--${label.kind}`}
          >
            {label.text}
          </text>
        );
        // In an exported file the credit doubles as the way back to the design
        return label.kind === 'credit' && link ? (
          <a key={i} href={link}>
            {text}
          </a>
        ) : (
          text
        );
      })}
    </svg>
  );
}
