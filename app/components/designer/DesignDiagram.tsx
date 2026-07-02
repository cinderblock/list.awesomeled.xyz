import { useRef } from 'react';
import { Download, Printer } from 'lucide-react';
import {
  chainMaxFps,
  layoutTotal,
  type Chain,
  type PatternSourceOption,
  type SystemPower,
} from '~/lib/designer';

// Absolute so downloaded SVGs still resolve their thumbnails offline-shared
const IMG_BASE = 'https://list.awesomeled.xyz/database-images/';

interface DesignDiagramProps {
  chains: Chain[];
  source: PatternSourceOption | null;
  standalone: boolean;
  power: SystemPower;
}

function fmt(n: number, digits = 1): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}

const ROW_H = 100;
const TOP = 20;

/**
 * Printable system diagram: pattern source fanning out to each pixel group's
 * controller, with a per-voltage power-rail summary. The design is embedded as
 * JSON in the SVG's <metadata> (draw.io style), so a downloaded file carries
 * its own source.
 */
export function DesignDiagram({ chains, source, standalone, power }: DesignDiagramProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const rows = chains.filter((c) => c.pixel);
  const railsY = TOP + rows.length * ROW_H + 10;
  const height = railsY + 46 + power.rails.length * 18;
  const sourceCenterY = TOP + (rows.length * ROW_H) / 2 - 10;

  const design = {
    generator: 'awesomeled.xyz/designer',
    source: standalone ? 'standalone' : (source?.id ?? null),
    chains: chains.map((c) => {
      const fps = c.pixel ? chainMaxFps(c.pixel, c.layout) : null;
      return {
        pixel: c.pixel?.id ?? null,
        strings: c.layout.strings,
        perString: c.layout.perString,
        controller: c.controller?.id ?? null,
        fpsMax: fps != null ? Math.round(fps) : null,
      };
    }),
    totalWatts: Math.round(power.totalWatts * 10) / 10,
    rails: power.rails.map((r) => ({ voltage: r.voltage, watts: Math.round(r.watts) })),
  };

  const download = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + svg.outerHTML], {
      type: 'image/svg+xml',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'led-system.svg';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const sourceLabel = standalone
    ? 'Standalone playback'
    : (source?.name ?? 'Pattern source (not chosen)');
  const wire = '#8888';

  return (
    <div className="design-diagram">
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 860 ${height}`}
        role="img"
        aria-label={`System diagram: ${sourceLabel} driving ${rows.length} pixel group${rows.length === 1 ? '' : 's'}, ${power.totalPixels} pixels total`}
        style={{ width: '100%', height: 'auto', fontFamily: 'system-ui, sans-serif' }}
      >
        <metadata id="awesomeled-design">{JSON.stringify(design)}</metadata>

        {/* Pattern source */}
        <g>
          <rect
            x="16"
            y={sourceCenterY - 40}
            width="170"
            height="80"
            rx="10"
            fill="#dcfce7"
            stroke="#16a34a"
            strokeDasharray={source || standalone ? undefined : '6 4'}
          />
          <text
            x="101"
            y={sourceCenterY - 10}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            fill="#166534"
          >
            {sourceLabel.length > 22 ? sourceLabel.slice(0, 21) + '…' : sourceLabel}
          </text>
          <text x="101" y={sourceCenterY + 10} textAnchor="middle" fontSize="10" fill="#15803d">
            {standalone
              ? 'pre-recorded on controller'
              : source
                ? 'live / sequenced data'
                : 'pick one in step 4'}
          </text>
        </g>

        {/* Per-chain rows */}
        {rows.map((chain, i) => {
          const y = TOP + i * ROW_H;
          const midY = y + 45;
          const total = layoutTotal(chain.layout);
          const ctrl = chain.controller;
          return (
            <g key={i}>
              {/* source -> controller wire */}
              <path
                d={`M 186 ${sourceCenterY} C 230 ${sourceCenterY}, 220 ${midY}, 262 ${midY}`}
                fill="none"
                stroke={wire}
                strokeWidth="2"
              />

              {/* Controller */}
              <rect
                x="262"
                y={y + 10}
                width="200"
                height="70"
                rx="8"
                fill="#dbeafe"
                stroke="#2563eb"
                strokeDasharray={ctrl ? undefined : '6 4'}
              />
              {ctrl?.image && (
                <image
                  href={`${IMG_BASE}controllers/${ctrl.image}`}
                  x="268"
                  y={y + 18}
                  width="52"
                  height="54"
                  preserveAspectRatio="xMidYMid meet"
                />
              )}
              <text
                x={ctrl?.image ? 390 : 362}
                y={y + 38}
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="#1e40af"
              >
                {(ctrl?.name ?? 'Controller?').slice(0, ctrl?.image ? 20 : 24)}
              </text>
              <text
                x={ctrl?.image ? 390 : 362}
                y={y + 58}
                textAnchor="middle"
                fontSize="10"
                fill="#3b82f6"
              >
                {ctrl
                  ? `${chain.layout.strings} of ${ctrl.outputs ?? '?'} outputs used`
                  : `needs ${chain.layout.strings} outputs`}
              </text>

              {/* controller -> pixels wire */}
              <line x1="462" y1={midY} x2="540" y2={midY} stroke={wire} strokeWidth="2" />
              <text x="501" y={midY - 8} textAnchor="middle" fontSize="9" fill={wire}>
                data{chain.pixel!.clocked ? '+clk' : ''}
              </text>

              {/* Pixel group */}
              <rect
                x="540"
                y={y + 10}
                width="300"
                height="70"
                rx="8"
                fill="#fce7f3"
                stroke="#db2777"
              />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                <circle key={d} cx={565 + d * 25} cy={y + 32} r={6} fill="#db2777" opacity={0.7} />
              ))}
              {chain.pixel!.image && (
                <image
                  href={`${IMG_BASE}pixels/${chain.pixel!.image}`}
                  x="784"
                  y={y + 14}
                  width="48"
                  height="40"
                  preserveAspectRatio="xMidYMid meet"
                />
              )}
              <text
                x="690"
                y={y + 60}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="#9d174d"
              >
                {chain.layout.strings} × {fmt(chain.layout.perString, 0)} {chain.pixel!.name} (
                {fmt(total, 0)} px, {fmt(chain.pixel!.voltage ?? 5, 0)} V)
              </text>
            </g>
          );
        })}

        {/* Power rails */}
        <g>
          <rect
            x="262"
            y={railsY}
            width="578"
            height={36 + power.rails.length * 18}
            rx="8"
            fill="#fef3c7"
            stroke="#d97706"
          />
          <text x="278" y={railsY + 22} fontSize="12" fontWeight="700" fill="#92400e">
            Power: {fmt(power.totalWatts)} W total
            {power.totalWatts > 60 ? ' — plan power injection along long runs' : ''}
          </text>
          {power.rails.map((rail, i) => (
            <text key={rail.voltage} x="278" y={railsY + 42 + i * 18} fontSize="11" fill="#b45309">
              {fmt(rail.voltage, 0)} V rail: {fmt(rail.watts)} W ({fmt(rail.amps)} A) — use a{' '}
              {fmt(rail.recommendedWatts, 0)} W+ supply
            </text>
          ))}
        </g>
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
