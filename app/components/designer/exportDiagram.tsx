/**
 * Diagram export: a self-contained SVG, and a PNG rasterized from it. Both
 * carry the design as embedded source (see app/lib/designer/embed.ts), so the
 * file can be imported back into the designer.
 *
 * Browser-only: called from click handlers, never during prerendering.
 */

import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import {
  buildEmbed,
  describeLayout,
  designQuery,
  EMBED_ID,
  layoutDiagram,
  writePngText,
  type Analysis,
  type DiagramModel,
} from '~/lib/designer';
import { canonicalDesignUrl } from './browser';
import { EXPORT_PALETTE, SystemDiagram } from './SystemDiagram';

/** Thumbnails are drawn about 52 px wide; 3× keeps them crisp in a 2× PNG */
const THUMB_PIXELS = 168;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

/**
 * Site images as small PNG data URIs. Converting (rather than embedding the
 * WebP files as they are) keeps the SVG readable in editors that don't
 * decode WebP. Images that fail to load are simply left out.
 */
async function inlineImages(model: DiagramModel): Promise<Record<string, string>> {
  const paths = [...new Set(model.boxes.map((b) => b.image).filter((p): p is string => !!p))];
  const out: Record<string, string> = {};
  await Promise.all(
    paths.map(async (path) => {
      try {
        const img = await loadImage(path);
        const scale = Math.min(1, THUMB_PIXELS / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        out[path] = canvas.toDataURL('image/png');
      } catch {
        // leave this thumbnail out of the export
      }
    })
  );
  return out;
}

function embedJson(analysis: Analysis): string {
  return JSON.stringify(
    buildEmbed(analysis.design, {
      pixels: analysis.power.pixels,
      maxWatts: Math.round(analysis.power.maxWatts),
      groups: analysis.groups.map((g) => ({
        pixel: g.pixel?.name ?? null,
        layout: describeLayout(g.layout),
        controller: g.controller?.name ?? null,
      })),
    })
  );
}

export interface DiagramExport {
  svg: string;
  width: number;
  height: number;
  embed: string;
}

/**
 * The diagram as a standalone SVG document with the design embedded.
 *
 * Renders the same component the page shows — with literal colours and
 * inlined images — into a detached node and serializes that as XML. (Using
 * the DOM rather than react-dom/server keeps a second copy of React's
 * renderer out of the bundle.)
 */
export async function renderDiagramSvg(analysis: Analysis): Promise<DiagramExport> {
  const model = layoutDiagram(analysis);
  const images = await inlineImages(model);
  const embed = embedJson(analysis);

  const host = document.createElement('div');
  const root = createRoot(host);
  let markup: string;
  try {
    flushSync(() =>
      root.render(
        <SystemDiagram
          model={model}
          palette={EXPORT_PALETTE}
          images={images}
          embed={embed}
          link={canonicalDesignUrl(designQuery(analysis.design))}
        />
      )
    );
    const svg = host.querySelector('svg');
    if (!svg) throw new Error('The diagram did not render');
    markup = new XMLSerializer().serializeToString(svg);
  } finally {
    root.unmount();
  }

  return {
    svg: `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`,
    width: model.width,
    height: model.height,
    embed,
  };
}

/** Rasterize an exported SVG and embed the design in the PNG */
export async function renderDiagramPng(diagram: DiagramExport, scale = 2): Promise<Uint8Array> {
  const img = await loadImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(diagram.svg)}`
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(diagram.width * scale);
  canvas.height = Math.round(diagram.height * scale);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot draw to a canvas');
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('This browser could not encode the PNG');
  return writePngText(new Uint8Array(await blob.arrayBuffer()), EMBED_ID, diagram.embed);
}
