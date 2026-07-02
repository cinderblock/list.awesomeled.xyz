import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import type { PixelOption, ControllerOption, PowerEstimate } from '~/lib/designer';

interface DesignDiagramProps {
  pixel: PixelOption;
  count: number;
  controller: ControllerOption | null;
  power: PowerEstimate;
}

function fmt(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

/**
 * Printable system diagram. The current design is embedded as JSON in the
 * SVG's <metadata> (draw.io style), so a downloaded file carries its own
 * source and can be re-imported later.
 */
export function DesignDiagram({ pixel, count, controller, power }: DesignDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const design = {
    generator: 'awesomeledlist.com/designer',
    pixel: pixel.id,
    count,
    controller: controller?.id ?? null,
    estimatedWatts: Math.round(power.watts * 10) / 10,
    voltage: power.voltage,
  };

  const download = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + svg.outerHTML], {
      type: 'image/svg+xml',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `led-system-${pixel.id}-x${count}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const controllerLabel = controller ? controller.name : 'Controller (not chosen)';
  const wire = 'var(--muted-foreground, #888)';

  return (
    <div className="design-diagram">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 860 240"
        role="img"
        aria-label={`System diagram: power supply, ${controllerLabel}, ${count} × ${pixel.name}`}
        style={{ width: '100%', height: 'auto', fontFamily: 'system-ui, sans-serif' }}
      >
        <metadata id="awesomeled-design">{JSON.stringify(design)}</metadata>

        {/* Power supply */}
        <g>
          <rect x="20" y="70" width="180" height="100" rx="10" fill="#fef3c7" stroke="#d97706" />
          <text x="110" y="105" textAnchor="middle" fontSize="16" fontWeight="700" fill="#92400e">
            Power Supply
          </text>
          <text x="110" y="130" textAnchor="middle" fontSize="13" fill="#92400e">
            {fmt(power.voltage, 0)} V · {fmt(power.recommendedWatts, 0)} W+
          </text>
          <text x="110" y="150" textAnchor="middle" fontSize="11" fill="#b45309">
            ({fmt(power.watts)} W estimated load)
          </text>
        </g>

        {/* Power wires */}
        <line x1="200" y1="105" x2="320" y2="105" stroke="#dc2626" strokeWidth="3" />
        <line x1="200" y1="135" x2="320" y2="135" stroke="#404040" strokeWidth="3" />
        <text x="260" y="95" textAnchor="middle" fontSize="10" fill={wire}>
          V+ / GND
        </text>

        {/* Controller */}
        <g>
          <rect
            x="320"
            y="55"
            width="220"
            height="130"
            rx="10"
            fill="#dbeafe"
            stroke="#2563eb"
            strokeDasharray={controller ? undefined : '6 4'}
          />
          <text x="430" y="85" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1e40af">
            {controllerLabel}
          </text>
          {controller?.outputs != null && (
            <text x="430" y="108" textAnchor="middle" fontSize="12" fill="#1e40af">
              {controller.outputs} outputs
              {controller.differential ? ' (differential)' : ''}
            </text>
          )}
          <text x="430" y="130" textAnchor="middle" fontSize="11" fill="#3b82f6">
            {controller
              ? (controller.clockedSupport === 'both'
                  ? 'data-only or clocked pixels'
                  : controller.clockedSupport === 'clocked'
                    ? 'clocked pixels'
                    : controller.clockedSupport === 'async'
                      ? 'data-only pixels'
                      : '') || ' '
              : 'pick one from the list'}
          </text>
        </g>

        {/* Data wire */}
        <line x1="540" y1="120" x2="640" y2="120" stroke={wire} strokeWidth="2" />
        <text x="590" y="110" textAnchor="middle" fontSize="10" fill={wire}>
          data{pixel.clocked ? ' + clock' : ''}
        </text>

        {/* Pixel run */}
        <g>
          <rect x="640" y="90" width="200" height="60" rx="8" fill="#fce7f3" stroke="#db2777" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={665 + i * 30} cy={120} r={8} fill="#db2777" opacity={0.75} />
          ))}
          <text x="740" y="170" textAnchor="middle" fontSize="13" fontWeight="700" fill="#9d174d">
            {count.toLocaleString('en-US')} × {pixel.name}
          </text>
          <text x="740" y="188" textAnchor="middle" fontSize="11" fill="#be185d">
            {pixel.clocked == null ? '' : pixel.clocked ? 'clocked (data + clock)' : 'data-only, '}
            {fmt(power.voltage, 0)} V
          </text>
        </g>

        {/* Power injection hint for larger runs */}
        {power.watts > 60 && (
          <>
            <path
              d="M 110 170 C 110 215, 740 215, 740 155"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <text x="425" y="228" textAnchor="middle" fontSize="11" fill="#dc2626">
              power injection recommended at this load
            </text>
          </>
        )}
      </svg>

      <div className="design-diagram-actions">
        <button type="button" className="btn btn--ghost" onClick={download}>
          <Download size={15} /> Download SVG
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </button>
      </div>
    </div>
  );
}
