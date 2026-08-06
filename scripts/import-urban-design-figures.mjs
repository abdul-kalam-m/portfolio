/**
 * Import urban-design figures rendered from the source portfolio PDF.
 *
 * Source:  pages rendered at 3x zoom by a one-off PyMuPDF script into
 *          C:/Users/abdul/AppData/Local/Temp/claude/pdf-render/page<NN>.png, from
 *          "Professional Portfolio - Abdul Kalam 10MB.pdf" (Works to be displayed).
 * License: the owner's own work; committed here as portfolio assets. Owner approved
 *          publication of these six projects 2026-08-06 (see docs/urban-design-candidates.md).
 * Output:  src/assets/projects/<slug>/*.png + thumbnail.png (1200x630)
 *
 * Full annotated spreads are used as-is (not cropped to just the map) — the same pattern
 * as the AutoCarto figures: each spread's caption/legend is part of the figure.
 *
 *   node scripts/import-urban-design-figures.mjs
 */
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const RENDER_DIR = 'C:/Users/abdul/AppData/Local/Temp/claude/pdf-render';
const MAX_EDGE = 2400;
const THUMB = { width: 1200, height: 630 };
/** --color-bg (light). Card letterboxing should read as page, not as a grey box. */
const PAPER = { r: 251, g: 250, b: 248 };

/** @type {{slug: string, pages: {page: number, name: string}[], thumbFrom: number}[]} */
const JOBS = [
  {
    slug: 'adyar-basin-vision-framework',
    pages: [
      { page: 5, name: 'vision-aerial.png' },
      { page: 2, name: 'urbanization-impact.png' },
      { page: 3, name: 'infrastructure-risk.png' },
    ],
    thumbFrom: 5,
  },
  {
    slug: 'woodbridge-flood-vulnerability',
    pages: [
      { page: 6, name: 'choropleths.png' },
      { page: 7, name: 'landuse-change.png' },
    ],
    thumbFrom: 6,
  },
  {
    slug: 'pedestrian-crash-rates-manhattan',
    pages: [
      { page: 10, name: 'priority-intersections.png' },
      { page: 9, name: 'collision-density.png' },
    ],
    thumbFrom: 10,
  },
  {
    slug: 'kosasthalaiyar-sponge-city',
    pages: [
      { page: 11, name: 'aerial-bgi-framework.png' },
      { page: 12, name: 'intervention-catalogue.png' },
    ],
    thumbFrom: 11,
  },
  {
    slug: 'tsuce-smart-urbanization',
    pages: [
      { page: 17, name: 'axonometric.png' },
      { page: 16, name: 'site-plan.png' },
      { page: 18, name: 'sustainability-metrics.png' },
    ],
    thumbFrom: 17,
  },
  {
    slug: 'chennai-lakefront-restore-connect-engage',
    pages: [
      { page: 31, name: 'four-lakes-vision.png' },
      { page: 30, name: 'velachery-plan.png' },
    ],
    thumbFrom: 31,
  },
];

async function run() {
  for (const job of JOBS) {
    const outDir = path.resolve('src/assets/projects', job.slug);
    await mkdir(outDir, { recursive: true });

    for (const { page, name } of job.pages) {
      const src = path.join(RENDER_DIR, `page${String(page).padStart(2, '0')}.png`);
      if (!existsSync(src)) {
        console.warn(`  ! missing rendered page, skipped: ${src}`);
        continue;
      }
      const dest = path.join(outDir, name);
      await sharp(src)
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toFile(dest);
      console.log(`  ${job.slug}/${name}`);
    }

    /*
     * `contain`, not `cover`. These pages are two-page spreads at roughly 2.4:1; covering
     * them into the 1.905:1 card ratio crops ~21% of the width, which slices the outer
     * panel off a three-panel board and cuts the caption column mid-sentence. Containing
     * costs a thin paper-coloured band top and bottom and keeps the board whole.
     */
    const thumbSrc = path.join(RENDER_DIR, `page${String(job.thumbFrom).padStart(2, '0')}.png`);
    const thumbOut = path.join(outDir, 'thumbnail.png');
    await sharp(thumbSrc)
      .resize({ ...THUMB, fit: 'contain', background: PAPER })
      .flatten({ background: PAPER })
      .png({ compressionLevel: 9 })
      .toFile(thumbOut);
    console.log(`  ${job.slug}/thumbnail.png (1200x630, contained)`);
  }
}

await run();
console.log('done');
