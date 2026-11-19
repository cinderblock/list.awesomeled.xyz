/**
 * Link-preview images (OpenGraph / Twitter cards): what Discord, Slack,
 * Facebook, iMessage and forums show when someone pastes a link to the site.
 *
 * Drawn at build time with sharp (already a dependency for thumbnails): an
 * SVG background, text set in the bundled Inter files through Pango, and the
 * entry's product photo when it has one. No browser and no network, and JPEG
 * because not every unfurler reads WebP.
 */

import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import sharp from 'sharp';
import { getDatabasePath } from './data';
import { SITE_NAME, SITE_ORIGIN } from './site';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Bump when the drawing changes, so cached cards are redrawn
const TEMPLATE_VERSION = 2;

const MARGIN = 64;
const PHOTO = 400; // edge of the photo tile
const PHOTO_PAD = 28;
const FOOTER_SIZE = 26;
const MAX_FACTS = 4;
const FACTS_GAP = 30; // between the subtitle (or title) and the facts

const COLORS = {
  background: '#0b0b10',
  title: '#ffffff',
  subtitle: '#a1a1aa',
  facts: '#e4e4e7',
  footer: '#8b8b96',
};

const WEIGHTS = [400, 600, 800] as const;
type Weight = (typeof WEIGHTS)[number];

// The project root, wherever the server bundle happens to run from
const projectRoot = () => dirname(getDatabasePath());

function fontFile(weight: Weight): string {
  return resolve(projectRoot(), 'assets', 'fonts', `Inter-${weight}.ttf`);
}

// Pango picks a face by family and weight among the files it has been shown.
// Show it all three once, or "Inter" at weight 800 would resolve to whichever
// file happened to be loaded first.
let fontsLoaded: Promise<void> | null = null;
function loadFonts(): Promise<void> {
  fontsLoaded ??= (async () => {
    for (const weight of WEIGHTS) {
      await sharp({ text: { text: '.', font: 'Inter', fontfile: fontFile(weight) } })
        .raw()
        .toBuffer();
    }
  })();
  return fontsLoaded;
}

export interface OgCard {
  /** Small line above the title: the category, or what kind of page this is */
  eyebrow?: string;
  /** Hue of the eyebrow and accent (the category's colour); neutral without */
  hue?: number;
  title: string;
  /** Draw the title in the site's rainbow (the site's own card) */
  rainbowTitle?: boolean;
  /** Under the title: the maker, or a one-line description */
  subtitle?: string;
  /** Short facts, one per line; as many as fit are shown */
  facts?: string[];
  /** Absolute path of a product photo for the right-hand side */
  image?: string;
}

// ---------------------------------------------------------------------------
// Colour: the site's category colours are OKLCH hues; Pango and SVG want hex
// ---------------------------------------------------------------------------

/** OKLCH → sRGB hex (Björn Ottosson's OKLab matrices), clipped to gamut. */
export function oklchToHex(l: number, c: number, hueDegrees: number): string {
  const h = (hueDegrees * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
  const channel = (x: number) => {
    const clipped = Math.min(1, Math.max(0, x));
    const srgb = clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055;
    return Math.round(srgb * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${linear.map(channel).join('')}`;
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

const escapeMarkup = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface TextLayer {
  data: Buffer;
  width: number;
  height: number;
}

interface TextOptions {
  size: number;
  weight?: Weight;
  color?: string;
  /** Wrap at this many pixels */
  width: number;
  /** Extra letter spacing in pixels (small caps lines) */
  tracking?: number;
  /** Extra space between lines, in pixels */
  leading?: number;
}

/** One block of text as a transparent image. `markup` may hold Pango spans. */
async function drawText(markup: string, options: TextOptions): Promise<TextLayer> {
  const { size, weight = 400, color = COLORS.title, width, tracking = 0, leading = 0 } = options;
  await loadFonts();
  // Pango sizes and spacing are in 1/1024 pt; at 72 dpi a point is a pixel
  const attributes = [
    `foreground="${color}"`,
    `font_weight="${weight}"`,
    `size="${Math.round(size * 1024)}"`,
    tracking ? `letter_spacing="${Math.round(tracking * 1024)}"` : '',
  ].join(' ');
  const { data, info } = await sharp({
    text: {
      text: `<span ${attributes}>${markup}</span>`,
      font: 'Inter',
      fontfile: fontFile(weight),
      width,
      dpi: 72,
      rgba: true,
      wrap: 'word-char',
      ...(leading ? { spacing: leading } : {}),
    },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** The largest title size that keeps the name to three lines. */
function titleSize(title: string, narrow: boolean): number {
  const length = title.length * (narrow ? 1.6 : 1);
  if (length <= 18) return 84;
  if (length <= 30) return 70;
  if (length <= 48) return 58;
  if (length <= 80) return 48;
  return 40;
}

/** Text with a hue per letter, as the site name is drawn in the header. */
function rainbow(text: string): string {
  const letters = [...text];
  const visible = letters.filter((ch) => ch !== ' ').length;
  let i = 0;
  return letters
    .map((ch) => {
      if (ch === ' ') return ' ';
      const hue = (i++ / visible) * 330;
      return `<span foreground="${oklchToHex(0.78, 0.17, hue)}">${escapeMarkup(ch)}</span>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

function backgroundSvg(accent: string, photo: boolean): Buffer {
  const stops = [0, 55, 110, 165, 220, 275, 330]
    .map(
      (hue, i, all) =>
        `<stop offset="${i / (all.length - 1)}" stop-color="${oklchToHex(0.72, 0.19, hue)}"/>`
    )
    .join('');
  const tileX = OG_WIDTH - MARGIN - PHOTO;
  const tileY = (OG_HEIGHT - PHOTO) / 2;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}">
      <defs>
        <linearGradient id="rainbow" x1="0" x2="1" y1="0" y2="0">${stops}</linearGradient>
        <radialGradient id="glow" cx="0" cy="0" r="1">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.22"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${COLORS.background}"/>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#glow)"/>
      <rect width="${OG_WIDTH}" height="10" fill="url(#rainbow)"/>
      ${
        photo
          ? `<rect x="${tileX}" y="${tileY}" width="${PHOTO}" height="${PHOTO}" rx="28" fill="#ffffff"/>`
          : ''
      }
    </svg>`
  );
}

/** Draw a card as a 1200×630 JPEG. */
export async function renderOgCard(card: OgCard): Promise<Buffer> {
  const accent =
    card.hue === undefined ? oklchToHex(0.8, 0.02, 270) : oklchToHex(0.8, 0.15, card.hue);
  const photoPath = card.image && existsSync(card.image) ? card.image : undefined;
  const textWidth = OG_WIDTH - 2 * MARGIN - (photoPath ? PHOTO + 48 : 0);
  const layers: sharp.OverlayOptions[] = [];

  const footerTop = OG_HEIGHT - MARGIN - FOOTER_SIZE;
  const address = `<span font_weight="400">${escapeMarkup(SITE_ORIGIN.replace(/^https?:\/\//, ''))}</span>`;
  const footer = await drawText(
    // The site's own card already has the name as its title
    card.rainbowTitle ? address : `${rainbow(SITE_NAME)}  ·  ${address}`,
    { size: FOOTER_SIZE, weight: 600, color: COLORS.footer, width: textWidth }
  );
  layers.push({ input: footer.data, left: MARGIN, top: footerTop });

  // The text block, measured first so it can sit centred between the top
  // bar and the footer
  const blocks: { layer: TextLayer; gap: number }[] = [];
  if (card.eyebrow) {
    blocks.push({
      layer: await drawText(escapeMarkup(card.eyebrow.toUpperCase()), {
        size: 26,
        weight: 600,
        color: accent,
        width: textWidth,
        tracking: 2.5,
      }),
      gap: 18,
    });
  }
  // `gap` is the space above a block
  blocks.push({
    layer: await drawText(card.rainbowTitle ? rainbow(card.title) : escapeMarkup(card.title), {
      size: titleSize(card.title, Boolean(photoPath)),
      weight: 800,
      color: COLORS.title,
      width: textWidth,
    }),
    gap: 20,
  });
  if (card.subtitle) {
    blocks.push({
      layer: await drawText(escapeMarkup(card.subtitle), {
        size: 32,
        color: COLORS.subtitle,
        width: textWidth,
        leading: 6,
      }),
      gap: 22,
    });
  }

  const available = footerTop - 28 - (MARGIN + 10);
  const used = () => blocks.reduce((sum, b, i) => sum + b.layer.height + (i ? b.gap : 0), 0);

  // The facts are one block (even line spacing); drop from the end until it fits
  const facts = (card.facts ?? []).slice(0, MAX_FACTS);
  for (let count = facts.length; count > 0; count--) {
    const layer = await drawText(facts.slice(0, count).map(escapeMarkup).join('\n'), {
      size: 29,
      color: COLORS.facts,
      width: textWidth,
      leading: 9,
    });
    if (used() + FACTS_GAP + layer.height <= available) {
      blocks.push({ layer, gap: FACTS_GAP });
      break;
    }
  }

  let y = MARGIN + 10 + Math.max(0, Math.round((available - used()) / 2));
  blocks.forEach(({ layer, gap }, i) => {
    if (i) y += gap;
    layers.push({ input: layer.data, left: MARGIN, top: y });
    y += layer.height;
  });

  if (photoPath) {
    const inner = PHOTO - 2 * PHOTO_PAD;
    const photo = await sharp(photoPath)
      .resize(inner, inner, { fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer();
    layers.push({
      input: photo,
      left: OG_WIDTH - MARGIN - PHOTO + PHOTO_PAD,
      top: (OG_HEIGHT - PHOTO) / 2 + PHOTO_PAD,
    });
  }

  return sharp(backgroundSvg(accent, Boolean(photoPath)))
    .composite(layers)
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

/**
 * renderOgCard through a disk cache keyed by everything that goes into the
 * picture, so a rebuild only redraws cards whose entry (or photo) changed.
 */
export async function ogCard(card: OgCard): Promise<Buffer> {
  const hash = createHash('sha256').update(JSON.stringify([TEMPLATE_VERSION, card]));
  if (card.image && existsSync(card.image)) hash.update(await readFile(card.image));
  const dir = resolve(projectRoot(), 'node_modules', '.cache', 'og-cards');
  const file = join(dir, `${hash.digest('hex').slice(0, 32)}.jpg`);
  try {
    return await readFile(file);
  } catch {
    const data = await renderOgCard(card);
    await mkdir(dir, { recursive: true });
    await writeFile(file, data).catch(() => {}); // the cache is best-effort
    return data;
  }
}
