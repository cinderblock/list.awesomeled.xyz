import JSZip from 'jszip';
import { CATEGORIES } from '~/lib/types';
import { categoryCSV } from '~/lib/category-export.server';

export async function loader() {
  const zip = new JSZip();

  for (const category of CATEGORIES) {
    zip.file(`${category.id}.csv`, categoryCSV(category.id));
  }

  // Copy into a fresh Uint8Array<ArrayBuffer>: JSZip's Uint8Array<ArrayBufferLike>
  // isn't assignable to BodyInit under TS 5.7 lib.dom types.
  const content = new Uint8Array(await zip.generateAsync({ type: 'uint8array' }));

  return new Response(content, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="database.csv.zip"',
    },
  });
}
