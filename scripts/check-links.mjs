/**
 * Internal link check across the built site (§12.1 step 3).
 *
 * Source:  ./dist after `pnpm build`.
 * Output:  stdout report; exit code 1 on any broken internal link.
 *
 * External links are listed but not fetched — CI must not fail because someone else's
 * server had a bad minute, and §6.4's collection ethics apply to our own crawling too.
 *
 *   pnpm build && node scripts/check-links.mjs
 */
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

/** Resolves a site-relative href to a file that must exist in dist. */
function targetsFor(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean || clean === '/') return [path.join(DIST, 'index.html')];
  const rel = clean.replace(/^\//, '');
  return [
    path.join(DIST, rel),
    path.join(DIST, rel, 'index.html'),
    path.join(DIST, `${rel.replace(/\/$/, '')}.html`),
  ];
}

const files = await walk(DIST);
const broken = [];
const external = new Set();
let checked = 0;

for (const file of files) {
  const html = await readFile(file, 'utf8');
  const from = `/${path.relative(DIST, file).replace(/\\/g, '/')}`;

  for (const [, href] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) {
      if (href.startsWith('http')) external.add(href);
      continue;
    }
    if (!href.startsWith('/')) continue; // relative assets inside /labs are resolved by the tool itself

    checked += 1;
    if (!targetsFor(href).some((candidate) => existsSync(candidate))) {
      broken.push(`${from} → ${href}`);
    }
  }
}

console.log(
  `${files.length} pages · ${checked} internal links checked · ${external.size} external links (not fetched)`
);

if (broken.length) {
  console.error('\nBroken internal links:');
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}
console.log('No broken internal links.');
