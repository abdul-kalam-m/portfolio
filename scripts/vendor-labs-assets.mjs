/**
 * Vendor the /labs/heat-dashboard/ runtime dependencies into public/.
 *
 * Why: the original dashboard loaded Leaflet from unpkg, Chart.js from jsDelivr, and the
 * state boundaries from a GitHub gist. OPERATING_GUIDE.md §13.5.10 makes third-party
 * scripts owner-approval-only, and hotlinking a gist makes the page fail when someone
 * else's host does. Everything now ships from this origin.
 *
 * Sources and licenses:
 *   Leaflet 1.9.4        node_modules/leaflet/dist         BSD-2-Clause
 *   Chart.js 4.4.1       node_modules/chart.js/dist        MIT
 *   India states GeoJSON scripts/vendor/india_states.geojson
 *                        from gist.github.com/jbrobst/56c13bbbf9d97d187fea01ca62ea5112
 *                        (retrieved 2026-08-06; 36 features, ST_NM property)
 *
 * Output: public/labs/heat-dashboard/vendor/
 *
 * Coordinates are rounded to 4 decimal places (~11 m) — far finer than a national-zoom
 * state choropleth resolves, and it takes the file from 1000 KB to well under the
 * §7.2 committed-GeoJSON budget.
 *
 *   node scripts/vendor-labs-assets.mjs
 */
import { mkdir, copyFile, readFile, writeFile, cp } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const OUT = path.resolve('public/labs/heat-dashboard/vendor');
const PRECISION = 4;

const round = (n) => Math.round(n * 10 ** PRECISION) / 10 ** PRECISION;

/** Recursively round every coordinate pair in a GeoJSON coordinate array. */
function roundCoords(coords) {
  if (typeof coords[0] === 'number') return coords.map(round);
  return coords.map(roundCoords);
}

const kb = (p) => `${Math.round(statSync(p).size / 1024)} KB`;

await mkdir(OUT, { recursive: true });

await copyFile('node_modules/leaflet/dist/leaflet.js', path.join(OUT, 'leaflet.js'));
await copyFile('node_modules/leaflet/dist/leaflet.css', path.join(OUT, 'leaflet.css'));
await cp('node_modules/leaflet/dist/images', path.join(OUT, 'images'), { recursive: true });
await copyFile('node_modules/chart.js/dist/chart.umd.js', path.join(OUT, 'chart.umd.js'));

console.log(`leaflet.js      ${kb(path.join(OUT, 'leaflet.js'))}`);
console.log(`leaflet.css     ${kb(path.join(OUT, 'leaflet.css'))}`);
console.log(`chart.umd.js    ${kb(path.join(OUT, 'chart.umd.js'))}`);

const raw = JSON.parse(await readFile('scripts/vendor/india_states.geojson', 'utf8'));
for (const feature of raw.features) {
  feature.geometry.coordinates = roundCoords(feature.geometry.coordinates);
  // Only ST_NM is read by the dashboard; drop everything else.
  feature.properties = { ST_NM: feature.properties.ST_NM };
}
const geojson = JSON.stringify(raw);
await writeFile(path.join(OUT, 'india_states.geojson'), geojson, 'utf8');
console.log(
  `india_states.geojson ${kb(path.join(OUT, 'india_states.geojson'))} ` +
    `(${Math.round(gzipSync(Buffer.from(geojson)).length / 1024)} KB gzipped, ` +
    `${raw.features.length} features)`
);
