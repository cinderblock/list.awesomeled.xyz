import type { Route } from './+types/datasheet.$filename';
import { data } from 'react-router';
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// MIME types for datasheet formats
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
};

function getDatabasePath(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, '../../database');
}

export async function loader({ params }: Route.LoaderArgs) {
  const { filename } = params;

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

  const datasheetPath = resolve(getDatabasePath(), 'datasheets', filename);

  if (!existsSync(datasheetPath)) {
    throw data(null, { status: 404 });
  }

  try {
    const fileBuffer = readFileSync(datasheetPath);

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    throw data(null, { status: 500 });
  }
}
