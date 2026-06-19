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

  const content = await zip.generateAsync({ type: 'arraybuffer' });

  return new Response(content, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="database.csv.zip"',
    },
  });
}
