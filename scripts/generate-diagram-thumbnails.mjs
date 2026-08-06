/**
 * Rasterise each planned project's architecture diagram to a 1200x630 card image.
 *
 * Source:  src/lib/diagrams.ts (transcribed from each project's committed build guide)
 *          rendered through src/lib/diagram-svg.ts — the same renderer the page uses, so
 *          the card and the page can never show different architectures.
 * Output:  src/assets/projects/<slug>/thumbnail.png
 *
 * The card is a system diagram, never a screenshot: these projects have no UI yet, and
 * §13.6 forbids imagery that implies otherwise.
 *
 *   node scripts/generate-diagram-thumbnails.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Both modules use erasable-only TypeScript syntax, so Node's built-in type stripping
// loads them directly — no build step for a script that runs a handful of times.
const { DIAGRAMS } = await import('../src/lib/diagrams.ts');
const { renderDiagramSvg, renderDiagramCard } = await import('../src/lib/diagram-svg.ts');

/** Card titles — shorter than the project title so they fit one line at 42px. */
const CARD_TITLES = {
  floodscope: 'FloodScope',
  'jurisdiction-intelligence-os': 'Jurisdiction Intelligence OS',
  'nj-parcel-flood-risk': 'NJ Parcel Flood Risk',
  'nj-hazard-vulnerability': 'NJ Hazard Vulnerability',
};

/** Light-theme literals: the card is also the og:image, which has no theme context. */
const CARD_COLORS = {
  bg: '#fbfaf8',
  surface: '#ffffff',
  border: '#8a857b',
  text: '#171614',
  muted: '#57534b',
  accent: '#0a6c74',
};

const CARD = { width: 1200, height: 630 };

for (const [slug, diagram] of Object.entries(DIAGRAMS)) {
  const outDir = path.resolve('src/assets/projects', slug);
  await mkdir(outDir, { recursive: true });

  // The card is a lower-resolution telling of the same architecture: full detail is
  // illegible at the ~185px a grid card gets, and an illegible card reads as a blank one.
  const cardSvg = renderDiagramCard(diagram, CARD_TITLES[slug] ?? slug, CARD_COLORS);
  await sharp(Buffer.from(cardSvg), { density: 144 })
    .resize({ ...CARD, fit: 'contain', background: CARD_COLORS.bg })
    .flatten({ background: CARD_COLORS.bg })
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, 'thumbnail.png'));

  // The full diagram is what the page renders inline; keep the SVG for the design bundle.
  await writeFile(
    path.join(outDir, 'architecture.svg'),
    renderDiagramSvg(diagram, CARD_COLORS),
    'utf8'
  );
  console.log(`${slug}/thumbnail.png + architecture.svg`);
}
