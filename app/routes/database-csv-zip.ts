import JSZip from 'jszip';
import { CATEGORIES } from '~/lib/types';
import { loadCategoryData } from '~/lib/data';
import { getColumnsForCategory } from '~/lib/columns';
import { generateCSV } from '~/lib/csv';

export async function loader() {
  const zip = new JSZip();

  for (const category of CATEGORIES) {
    const entries = loadCategoryData(category.id);
    const columns = getColumnsForCategory(category.id);
    const csv = generateCSV(entries, columns);
    zip.file(`${category.id}.csv`, csv);
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
