#!/usr/bin/env bun
/**
 * Diffusive materials (database/issues.txt: "inconsistent material type
 * names", "type needs to be list?", "flexible should be boolean").
 *
 * - material_type (34 spellings, several polymers per string, polymer and
 *   form mixed: "Closed cell PE foam", "PET,PVC,PC, TPU") -> `materials`, a
 *   list of polymer codes, plus `form` (sheet, film, foam, tube, ...), the
 *   other half of the old strings, given for every entry
 * - optical.tinted T / C / T&C -> optical.tints [tinted, clear]
 * - physical.properties (free text) -> optical.properties list
 * - physical.flexible F / R -> boolean
 * - optical ratings: "2 - 5" / "3/4" -> "2-5" / "3-4"
 * - physical.sample_thickness: bare numbers in the sheet's inches column
 *   -> explicit units. The two pipe walls recorded as 3.2 are millimetres
 *   (1" PEX SDR 9 and 1" thin-wall PP both have a 1/8" = 3.2 mm wall).
 * - links.product: Bubble Wrap's "Bubble wrap - Wikipedia" (a pasted link
 *   title) -> the article URL
 *
 * Polymer facts are carried over as recorded; corrections from research are
 * a separate commit.
 */

import { getJS, migrateCategory, remove, setJS } from './lib';

const MATERIALS: Record<string, string[]> = {
  PMMA: ['PMMA'],
  PET: ['PET'],
  PVC: ['PVC'],
  Polyester: ['PET'],
  polyester: ['PET'],
  PC: ['PC'],
  'PC ?': ['PC'],
  'Ethylene Copolymer': ['ethylene copolymer'],
  'PVC Wire reinforcement': ['PVC'],
  'Paper with silicone or wax': ['paper'],
  'PMMA, PET': ['PMMA', 'PET'],
  'PMMA PET': ['PMMA', 'PET'],
  'Air Filled PE': ['PE'],
  'PP/ PE': ['PP', 'PE'],
  'Polyester,Acrylic': ['PET', 'PAN'],
  'Closed cell PE foam': ['PE'],
  'PE Closed cell foam': ['PE'],
  'Closed Cell LDPE foam': ['LDPE'],
  EVA: ['EVA'],
  'PCL Poly Capro Lactone': ['PCL'],
  'RTV Silicone rubber': ['silicone'],
  'doped PMMA': ['PMMA'],
  'Acrylic PMMA': ['PMMA'],
  'PP Poly Propylene': ['PP'],
  'Polyester fibre': ['PET'],
  HDPE: ['HDPE'],
  Polypropylene: ['PP'],
  'Wood Pulp': ['paper'],
  'PC Polycarbonate': ['PC'],
  'PET,PVC,PC, TPU': ['PET', 'PVC', 'PC', 'TPU'],
  'PVC, EVA': ['PVC', 'EVA'],
  XLPE: ['XLPE'],
  'PMMA Poly Methyl Meth Acrylate': ['PMMA'],
  'PMMA, PC,': ['PMMA', 'PC'],
};

// What it physically comes as. From material_type where it said so
// ("foam", "fibre"), otherwise from the entry's name and notes.
const FORM: Record<string, string[]> = {
  '3m-envision-diffuser': ['film'],
  'baking-parchment': ['film'],
  brightview: ['film', 'sheet'],
  'bubble-wrap': ['film'],
  'corrugated-split-loom-conduit-tubing-sleeving': ['tube'],
  'diffraction-grating': ['film'],
  'etched-vinyl': ['film'],
  'expanding-cable-braid': ['tube'],
  fabric: ['fabric'],
  'faux-fur': ['fabric'],
  'foam-backer-rod': ['foam'],
  'harmonia-pc-1050-24-3050-24': ['resin'],
  'hot-melt-glue': ['liquid'],
  'instamorph-polymorph': ['moldable'],
  'lcd-tv-diffuser': ['sheet'],
  'ld45-plaztazote': ['foam'],
  'lee-theatrical-filters': ['film'],
  'lexan-dclw': ['sheet'],
  'light-shaping-diffusers': ['film', 'sheet'],
  'lumieo-2': ['sheet'],
  'makrolon-dq-5122-5162': ['resin'],
  'neutral-cure-silicone': ['liquid'],
  oyumaru: ['moldable'],
  'perspex-diffuse': ['sheet'],
  'perspex-g-lux-edge-lit-acrylic': ['sheet'],
  'pex-pipe': ['tube'],
  'plastic-glass-shards': ['loose'],
  'plexiglas-led-edge-lit-was-endlightent': ['sheet'],
  'poly-pro-pipe-thin-wall': ['tube'],
  'polyester-film': ['film'],
  'polyester-pillow-fill': ['fiber'],
  polyethelene: ['sheet'],
  'polymer-clay': ['moldable'],
  'pool-noodle': ['foam'],
  'pp-push-fit-waste-pipe-thick-wall': ['tube'],
  'printer-paper': ['film'],
  'rosco-diffusion': ['film'],
  'rosco-opti-sculpt': ['film'],
  rowlux: ['film'],
  'shower-curtain': ['fabric'],
  'silicone-sealant': ['foam'],
  'suction-hose': ['tube'],
  'textured-acrylic-various': ['sheet'],
  'vinyl-dryer-hose': ['tube'],
  'white-acrylic-2447-7328-7508': ['sheet'],
};

const TINTS: Record<string, string[]> = { T: ['tinted'], C: ['clear'], 'T&C': ['tinted', 'clear'] };

const PROPERTIES: Record<string, string[]> = {
  Diffusive: ['diffusive'],
  Backlight: ['backlight'],
  Transmissive: ['transmissive'],
  Transparent: ['transparent'],
  'Edge Lit front diffuser': ['edge-lit'],
  'Backlight & Edgelight': ['backlight', 'edge-lit'],
};

const THICKNESS: Record<string, string | null> = {
  'printer-paper': '0.004in',
  'pex-pipe': '3.2mm',
  'poly-pro-pipe-thin-wall': '3.2mm',
  polyethelene: '0.04in',
  'diffraction-grating': '0.003in',
  'harmonia-pc-1050-24-3050-24': '0.087in',
  'makrolon-dq-5122-5162': '0.08in',
  rowlux: '0.015in',
  'white-acrylic-2447-7328-7508': '0.113in',
  'lumieo-2': '2mm',
  'silicone-sealant': null, // "variable"; sizes_available keeps "4-8mm"
  'textured-acrylic-various': '0.125-0.22in',
};

const rating = (v: unknown) => (typeof v === 'string' ? v.replace(/\s*[-/]\s*/, '-') : v);

const changed = migrateCategory('diffusive-materials', (doc, { id }) => {
  if (!doc.hasIn(['material_type']) && !doc.hasIn(['physical', 'properties'])) {
    if (
      !doc.hasIn(['optical', 'tinted']) &&
      typeof getJS(doc, ['physical', 'flexible']) !== 'string'
    ) {
      return false; // already migrated
    }
  }

  const type = getJS(doc, ['material_type']);
  if (typeof type === 'string') {
    const materials = MATERIALS[type];
    if (!materials) throw new Error(`${id}: unmapped material_type "${type}"`);
    remove(doc, ['material_type']);
    setJS(doc, ['materials'], materials);
  }
  const form = FORM[id];
  if (!form) throw new Error(`${id}: no form`);
  setJS(doc, ['form'], form);

  for (const key of ['color_rendition', 'light_transmission', 'diffusivity']) {
    const v = getJS(doc, ['optical', key]);
    if (typeof v === 'string') setJS(doc, ['optical', key], rating(v));
  }
  const tinted = getJS(doc, ['optical', 'tinted']);
  if (typeof tinted === 'string') {
    if (!TINTS[tinted]) throw new Error(`${id}: tinted "${tinted}"`);
    remove(doc, ['optical', 'tinted']);
    setJS(doc, ['optical', 'tints'], TINTS[tinted]);
  }

  const props = getJS(doc, ['physical', 'properties']);
  if (typeof props === 'string') {
    const list = PROPERTIES[props.trim()];
    if (!list) throw new Error(`${id}: properties "${props}"`);
    remove(doc, ['physical', 'properties']);
    setJS(doc, ['optical', 'properties'], list);
  }

  const flexible = getJS(doc, ['physical', 'flexible']);
  if (flexible === 'F' || flexible === 'R') setJS(doc, ['physical', 'flexible'], flexible === 'F');

  if (id in THICKNESS) {
    const t = THICKNESS[id];
    if (t === null) remove(doc, ['physical', 'sample_thickness']);
    else setJS(doc, ['physical', 'sample_thickness'], t);
  } else if (doc.hasIn(['physical', 'sample_thickness'])) {
    throw new Error(`${id}: unmapped sample_thickness`);
  }

  if (getJS(doc, ['links', 'product']) === 'Bubble wrap - Wikipedia') {
    setJS(doc, ['links', 'product'], 'https://en.wikipedia.org/wiki/Bubble_wrap');
  }
  return true;
});
console.log(`diffusive-materials: ${changed.length} entries migrated`);
