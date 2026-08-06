/**
 * Generate the site-level Open Graph cards (1200x630).
 *
 * Project pages use their own thumbnail as og:image, per OPERATING_GUIDE.md §8.2 — this
 * script covers the pages that have no thumbnail of their own: home, the three section
 * indexes, about, resume, and contact.
 *
 * Rendered through Playwright rather than composed with sharp, so the cards use the same
 * self-hosted Inter that the site does and stay identical across machines.
 *
 * Source:  tokens transcribed from src/styles/tokens.css (light theme).
 * Output:  public/og/*.png
 *
 *   node scripts/generate-og.mjs
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const OUT = path.resolve('public/og');
const FONT_DIR = path.resolve('node_modules/@fontsource-variable/inter/files');
const fontUrl = (file) => pathToFileURL(path.join(FONT_DIR, file)).href;

const T = {
  bg: '#fbfaf8',
  surface: '#ffffff',
  border: '#ddd9d1',
  text: '#171614',
  muted: '#57534b',
  accent: '#0a6c74',
};

const CARDS = [
  {
    name: 'site',
    eyebrow: 'Abdul Kalam · Urbanist & geospatial analyst',
    title: 'I turn climate and urban data into decisions.',
    sub: 'Spatial analysis · reproducible pipelines · applied AI with deterministic validation',
  },
  {
    name: 'geospatial',
    eyebrow: 'Section · Abdul Kalam',
    title: 'Geospatial Intelligence',
    sub: 'Flood exposure and hazard vulnerability at parcel, tract, and county scale',
  },
  {
    name: 'data-ai',
    eyebrow: 'Section · Abdul Kalam',
    title: 'Data Engineering & Applied AI',
    sub: 'Validated AI systems, reproducible pipelines, and dashboards with no backend',
  },
  {
    name: 'urban-design',
    eyebrow: 'Section · Abdul Kalam',
    title: 'Urban Design & Climate Resilience',
    sub: 'Planning and design work where climate adaptation is the brief',
  },
  {
    name: 'about',
    eyebrow: 'About · Abdul Kalam',
    title: 'I work between the map and the decision.',
    sub: 'Climate resilience, risk modeling, and GIS-based hazard assessment',
  },
  {
    name: 'resume',
    eyebrow: 'Resume · Abdul Kalam',
    title: 'Geospatial data analyst and urbanist',
    sub: 'Rutgers CLiME · Sponge Collaborative · licensed architect, Council of Architecture',
  },
  {
    name: 'contact',
    eyebrow: 'Contact · Abdul Kalam',
    title: 'Get in touch',
    sub: 'ar.abdulkalam.mustaq@gmail.com · New Brunswick, New Jersey',
  },
];

const html = (card) => `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face {
    font-family: 'Inter Variable';
    src: url('${fontUrl('inter-latin-wght-normal.woff2')}') format('woff2-variations');
    font-weight: 100 900;
  }
  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 72px;
    background: ${T.bg};
    color: ${T.text};
    font-family: 'Inter Variable', system-ui, sans-serif;
  }
  .rule { height: 6px; width: 96px; background: ${T.accent}; border-radius: 3px; }
  .eyebrow {
    margin-top: 28px;
    font-size: 22px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: ${T.muted};
  }
  h1 {
    margin-top: 24px;
    font-size: 68px; font-weight: 640; line-height: 1.08;
    letter-spacing: -0.015em; max-width: 18ch;
  }
  .sub { margin-top: 28px; font-size: 27px; line-height: 1.4; color: ${T.muted}; max-width: 34ch; }
  footer {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding-top: 28px; border-top: 1px solid ${T.border};
    font-size: 22px; color: ${T.muted};
  }
  .grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(to right, ${T.border} 1px, transparent 1px),
      linear-gradient(to bottom, ${T.border} 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.28;
    mask-image: linear-gradient(to bottom left, black, transparent 62%);
  }
</style></head>
<body>
  <div class="grid"></div>
  <div>
    <div class="rule"></div>
    <p class="eyebrow">${card.eyebrow}</p>
    <h1>${card.title}</h1>
    <p class="sub">${card.sub}</p>
  </div>
  <footer>
    <span>abdulkalam.pages.dev</span>
    <span>Urbanism · Geospatial · Climate · Data · AI</span>
  </footer>
</body></html>`;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

for (const card of CARDS) {
  await page.setContent(html(card), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, `${card.name}.png`) });
  console.log(`og/${card.name}.png`);
}

await browser.close();
