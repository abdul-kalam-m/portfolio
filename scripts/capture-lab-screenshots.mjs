/**
 * Capture case-study screenshots of the live /labs/heat-dashboard/ tool.
 *
 * Source:  the running dev or preview server (default http://localhost:4321).
 * Output:  src/assets/projects/india-urban-heat-dashboard/
 *            dashboard-full.png   full page, for the case-study figure
 *            dashboard-map.png    the map panel, for the map-encoding figure
 *            thumbnail.png        1200x630 card + og:image (§6.4)
 *
 * These are screenshots of the real tool rendering real data at capture time — not a
 * mock-up. The case study cites the capture date beneath each figure.
 *
 *   pnpm preview   # or pnpm dev
 *   node scripts/capture-lab-screenshots.mjs [baseUrl]
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const BASE = process.argv[2] ?? 'http://localhost:4321';
const URL = `${BASE}/labs/heat-dashboard/index.html`;
const OUT = path.resolve('src/assets/projects/india-urban-heat-dashboard');

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 2,
});

const failures = [];
page.on('requestfailed', (req) => failures.push(`${req.method()} ${req.url()}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') failures.push(`console: ${msg.text()}`);
});

console.log(`Loading ${URL} …`);
await page.goto(URL, { waitUntil: 'networkidle' });

// Wait for the data to actually land rather than for a fixed delay.
await page.waitForFunction(() => document.querySelectorAll('#ranking-body tr').length >= 50, null, {
  timeout: 60_000,
});
await page.waitForFunction(() => document.querySelectorAll('#map path').length > 50, null, {
  timeout: 60_000,
});
// Let tiles paint.
await page.waitForTimeout(3000);

await page.screenshot({ path: path.join(OUT, 'dashboard-full.png'), fullPage: true });
console.log('  dashboard-full.png');

const mapPanel = page.locator('.map-panel');
await mapPanel.screenshot({ path: path.join(OUT, 'dashboard-map.png') });
console.log('  dashboard-map.png');

// The card crops the top of the page: KPI row + map + table, which is what the tool is.
const card = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 756 } });
await sharp(card)
  .resize({ width: 1200, height: 630, fit: 'cover', position: 'top' })
  .png({ compressionLevel: 9 })
  .toFile(path.join(OUT, 'thumbnail.png'));
console.log('  thumbnail.png (1200x630)');

const summary = await page.evaluate(() => ({
  lastUpdated: document.getElementById('last-updated')?.textContent,
  rows: document.querySelectorAll('#ranking-body tr').length,
  hottest: document.getElementById('kpi-hottest')?.textContent,
}));
console.log(`  captured: ${summary.rows} rows · ${summary.hottest} · ${summary.lastUpdated}`);

await browser.close();

// Tile CDNs occasionally drop a request; anything else is a real problem.
const real = failures.filter((f) => !/basemaps\.cartocdn|arcgisonline/.test(f));
if (real.length) {
  console.error('\nRequest/console failures:');
  for (const f of real) console.error(`  ${f}`);
  process.exitCode = 1;
}
