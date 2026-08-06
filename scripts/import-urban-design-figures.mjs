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

/** @type {{slug: string, pages: {page: number, name: string}[], thumbFrom: number, thumbPosition?: string}[]} */
const JOBS = [
  {
    slug: 'adyar-basin-vision-framework',
    pages: [
      { page: 5, name: 'vision-aerial.png' },
      { page: 2, name: 'urbanization-impact.png' },
      { page: 3, name: 'infrastructure-risk.png' },
    ],
    thumbFrom: 5,
    thumbPosition: 'centre',
  },
  {
    slug: 'woodbridge-flood-vulnerability',
    pages: [
      { page: 6, name: 'choropleths.png' },
      { page: 7, name: 'landuse-change.png' },
    ],
    thumbFrom: 6,
    thumbPosition: 'top',
  },
  {
    slug: 'pedestrian-crash-rates-manhattan',
    pages: [
      { page: 10, name: 'priority-intersections.png' },
      { page: 9, name: 'collision-density.png' },
    ],
    thumbFrom: 10,
    thumbPosition: 'top',
  },
  {
    slug: 'kosasthalaiyar-sponge-city',
    pages: [
      { page: 11, name: 'aerial-bgi-framework.png' },
      { page: 12, name: 'intervention-catalogue.png' },
    ],
    thumbFrom: 11,
    thumbPosition: 'top',
  },
  {
    slug: 'tsuce-smart-urbanization',
    pages: [
      { page: 17, name: 'axonometric.png' },
      { page: 16, name: 'site-plan.png' },
      { page: 18, name: 'sustainability-metrics.png' },
    ],
    thumbFrom: 17,
    thumbPosition: 'centre',
  },
  {
    slug: 'chennai-lakefront-restore-connect-engage',
    pages: [
      { page: 31, name: 'four-lakes-vision.png' },
      { page: 30, name: 'velachery-plan.png' },
    ],
    thumbFrom: 31,
    thumbPosition: 'centre',
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

    const thumbSrc = path.join(RENDER_DIR, `page${String(job.thumbFrom).padStart(2, '0')}.png`);
    const thumbOut = path.join(outDir, 'thumbnail.png');
    await sharp(thumbSrc)
      .resize({ ...THUMB, fit: 'cover', position: job.thumbPosition ?? 'centre' })
      .png({ compressionLevel: 9 })
      .toFile(thumbOut);
    console.log(`  ${job.slug}/thumbnail.png (1200x630)`);
  }
}

await run();
console.log('done');
