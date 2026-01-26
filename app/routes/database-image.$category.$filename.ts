import type { Route } from './+types/database-image.$category.$filename';
import { data } from 'react-router';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// MIME types for common image formats
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

function getDatabasePath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, '../../database');
}

export async function loader({ params }: Route.LoaderArgs) {
  const { category, filename } = params;

  // Validate filename to prevent directory traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    throw data(null, { status: 400 });
  }

  // Get file extension and MIME type
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  const mimeType = MIME_TYPES[ext];

  if (!mimeType) {
    throw data(null, { status: 400 });
  }

  const imagePath = resolve(getDatabasePath(), category, 'images', filename);

  if (!existsSync(imagePath)) {
    throw data(null, { status: 404 });
  }

  try {
    const imageBuffer = readFileSync(imagePath);

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    throw data(null, { status: 500 });
  }
}
