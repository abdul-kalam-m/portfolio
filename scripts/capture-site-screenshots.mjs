/**
 * Capture the site for review: every key route, in both themes, at the widths the
 * responsive rules care about.
 *
 * Source:  a running server (default http://localhost:4322 from `pnpm preview`).
 * Output:  docs/screenshots/<route>-<theme>-<width>.png
 *
 * Used for the README screenshot, the design handoff, and as the visual record attached to
 * a release. Also reports horizontal overflow per route, which is the responsive failure
 * that is easiest to miss by eye.
 *
 *   pnpm build && pnpm preview --port 4322
 *   node scripts/capture-site-screenshots.mjs [baseUrl]
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';

const BASE = process.argv[2] ?? 'http://localhost:4322';
const OUT = path.resolve('docs/screenshots');

const ROUTES = [
  ['home', '/'],
  ['geospatial', '/geospatial/'],
  ['data-ai', '/data-ai/'],
  ['urban-design', '/urban-design/'],
  ['project-autocarto', '/projects/autocarto-agent/'],
  ['project-heat', '/projects/india-urban-heat-dashboard/'],
  ['project-planned', '/projects/nj-parcel-flood-risk/'],
  ['about', '/about/'],
  ['resume', '/resume/'],
  ['contact', '/contact/'],
];

const VIEWS = [
  ['desktop', 1440, 1000],
  ['mobile', 375, 812],
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const problems = [];

for (const theme of ['light', 'dark']) {
  for (const [viewName, width, height] of VIEWS) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
      colorScheme: theme,
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();

    for (const [name, route] of ROUTES) {
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);

      // Below-the-fold figures lazy-load; a full-page shot taken before they arrive
      // records empty frames rather than the page a visitor sees.
      await page.evaluate(async () => {
        for (const img of document.querySelectorAll('img[loading="lazy"]')) {
          img.loading = 'eager';
        }
        await Promise.all(
          [...document.images]
            .filter((i) => !i.complete)
            .map(
              (i) =>
                new Promise((resolve) => {
                  i.addEventListener('load', resolve, { once: true });
                  i.addEventListener('error', resolve, { once: true });
                })
            )
        );
      });
      await page.waitForTimeout(250);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 1) problems.push(`${route} overflows ${overflow}px at ${width}px`);

      await page.screenshot({
        path: path.join(OUT, `${name}-${theme}-${viewName}.png`),
        fullPage: viewName === 'desktop',
      });
    }

    console.log(`${theme} / ${viewName}: ${ROUTES.length} routes`);
    await ctx.close();
  }
}

await browser.close();

if (problems.length) {
  console.error('\nHorizontal overflow:');
  for (const p of problems) console.error(`  ${p}`);
  process.exitCode = 1;
} else {
  console.log('\nNo horizontal overflow at any captured width.');
}
