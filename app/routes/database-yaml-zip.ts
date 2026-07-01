import JSZip from 'jszip';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { CATEGORIES } from '~/lib/types';

export async function loader() {
  const zip = new JSZip();

  for (const category of CATEGORIES) {
    const dir = join(process.cwd(), 'database', category.id);
    const files = readdirSync(dir).filter((f) => f.endsWith('.yaml'));
    for (const file of files) {
      zip.file(`${category.id}/${file}`, readFileSync(join(dir, file)));
    }
  }

  // Copy into a fresh Uint8Array<ArrayBuffer>: JSZip's Uint8Array<ArrayBufferLike>
  // isn't assignable to BodyInit under TS 5.7 lib.dom types.
  const content = new Uint8Array(await zip.generateAsync({ type: 'uint8array' }));

  return new Response(content, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="database.yaml.zip"',
    },
  });
}
