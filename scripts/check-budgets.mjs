/**
 * Byte budgets from §8.4, measured from the built output.
 *
 * Source:  ./dist after `pnpm build`.
 * Output:  stdout table; exit code 1 if a budget is exceeded.
 *
 * This covers the two budgets that are a property of the artifact:
 *   - JS shipped on static pages ≤ 30 KB gzipped
 *   - Page weight (initial, no islands)  ≤ 500 KB
 *
 * It deliberately does NOT claim to cover LCP, CLS, INP, or the Lighthouse category
 * scores — those are lab measurements that need a compositing browser and are gated by
 * `lhci autorun` in CI (see .github/workflows/ci.yml).
 *
 *   pnpm build && node scripts/check-budgets.mjs
 */
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const DIST = path.resolve('dist');
const JS_BUDGET_GZ = 30 * 1024;
const PAGE_BUDGET = 500 * 1024;

/** Pages representative of each template. `/labs/` is a tool, not a static page. */
const PAGES = [
  '/index.html',
  '/geospatial/index.html',
  '/projects/autocarto-agent/index.html',
  '/projects/nj-parcel-flood-risk/index.html',
  '/about/index.html',
  '/resume/index.html',
  '/qr/index.html',
];

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const allFiles = await walk(DIST);
const byUrl = new Map(allFiles.map((f) => [`/${path.relative(DIST, f).replace(/\\/g, '/')}`, f]));

const gz = (buf) => gzipSync(buf).length;
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

let failures = 0;
console.log('Per-page budgets (§8.4)\n');
console.log('  page                                   html gz    js gz   initial weight');

for (const page of PAGES) {
  const file = byUrl.get(page);
  if (!file) {
    console.log(`  ${page.padEnd(38)} MISSING`);
    failures += 1;
    continue;
  }

  const html = await readFile(file);
  const htmlGz = gz(html);
  const text = html.toString('utf8');

  // Render-blocking and deferred assets the document itself pulls in.
  const refs = [...text.matchAll(/(?:href|src)="(\/[^"]+\.(?:js|css|woff2))"/g)].map((m) => m[1]);

  let jsGz = 0;
  let assetBytes = 0;
  for (const ref of new Set(refs)) {
    const assetPath = byUrl.get(ref);
    if (!assetPath) continue;
    const buf = await readFile(assetPath);
    assetBytes += buf.length;
    if (ref.endsWith('.js')) jsGz += gz(buf);
  }

  // Inline module scripts count against the JS budget too.
  for (const [, body] of text.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    jsGz += gz(Buffer.from(body, 'utf8'));
  }

  // "Initial, no islands": document + its CSS, fonts, and JS. Images are lazy below the
  // fold and are governed by the LCP budget instead.
  const initial = html.length + assetBytes;

  const jsOk = jsGz <= JS_BUDGET_GZ;
  const weightOk = initial <= PAGE_BUDGET;
  if (!jsOk || !weightOk) failures += 1;

  console.log(
    `  ${page.padEnd(38)} ${kb(htmlGz).padStart(8)} ${(jsOk ? '' : '!') + kb(jsGz)}`.padEnd(60) +
      `${(weightOk ? '' : '!') + kb(initial)}`
  );
}

console.log(`\n  budgets: JS ≤ ${kb(JS_BUDGET_GZ)} gzipped · initial weight ≤ ${kb(PAGE_BUDGET)}`);
console.log('  not covered here: LCP, CLS, INP, Lighthouse scores — gated by lhci in CI.');

if (!existsSync(path.join(DIST, 'sitemap-index.xml'))) {
  console.error('\nsitemap-index.xml missing from the build.');
  failures += 1;
}

if (failures > 0) {
  console.error(`\n${failures} budget failure(s).`);
  process.exit(1);
}
console.log('\nAll measurable §8.4 budgets met.');
