/**
 * Capture an Open-Meteo snapshot for the /labs/heat-dashboard/ offline fallback.
 *
 * Source:   Open-Meteo Forecast API (GFS/ICON blend) and Archive API (ERA5 reanalysis).
 *           https://open-meteo.com — free for non-commercial use, no API key, CC-BY 4.0.
 * Output:   public/labs/heat-dashboard/data/snapshot.json
 * Contract: `responses` is keyed by the same strings js/api.js passes to fetchOrSnapshot.
 *           Each value is the raw API response array, so the fallback path and the live
 *           path run identical rendering code.
 *
 * §7.5: this is a snapshot and is labeled as one in the UI — the dashboard shows
 * "Snapshot data · as of <fetchedAt>" whenever it serves from here. Never presented as live.
 *
 *   node scripts/refresh-heat-snapshot.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const TZ = 'Asia/Kolkata';
const OUT = path.resolve('public/labs/heat-dashboard/data/snapshot.json');
const TOP_N_TREND = 5;

/** Reads the committed city list rather than duplicating it. */
async function loadCities() {
  const src = await readFile('public/labs/heat-dashboard/js/cities.js', 'utf8');
  const body = src.slice(src.indexOf('['), src.lastIndexOf(']') + 1);
  // The file is a plain array literal with unquoted keys.
  return new Function(`return ${body}`)();
}

const latLon = (points) => ({
  latitude: points.map((p) => p.lat).join(','),
  longitude: points.map((p) => p.lon).join(','),
});

const asArray = (r) => (Array.isArray(r) ? r : [r]);

async function get(url, params) {
  const res = await fetch(`${url}?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`);
  return asArray(await res.json());
}

const isoDate = (d) => d.toISOString().slice(0, 10);

function weekWindow(endDate, yearOffset = 0) {
  const end = new Date(endDate);
  end.setFullYear(end.getFullYear() - yearOffset);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { start: isoDate(start), end: isoDate(end) };
}

/** Bbox centre of a feature's largest ring — mirrors featureCenter() in dashboard.js. */
function featureCenter(feature) {
  const geom = feature.geometry;
  const ring =
    geom.type === 'Polygon'
      ? geom.coordinates[0]
      : geom.coordinates.reduce(
          (big, poly) => (poly[0].length > big.length ? poly[0] : big),
          geom.coordinates[0][0]
        );
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lng, lat] of ring) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { lat: (minLat + maxLat) / 2, lon: (minLng + maxLng) / 2 };
}

const CITIES = await loadCities();
const geo = JSON.parse(
  await readFile('public/labs/heat-dashboard/vendor/india_states.geojson', 'utf8')
);
const statePoints = geo.features.map(featureCenter);

const today = new Date();
const w2025 = weekWindow(today, 1);
const w2024 = weekWindow(today, 2);

const currentParams = {
  current: 'temperature_2m,relative_humidity_2m',
  hourly: 'temperature_2m',
  daily: 'temperature_2m_max',
  past_days: 1,
  forecast_days: 1,
  timezone: TZ,
};

console.log(`Fetching ${CITIES.length} cities and ${statePoints.length} state points…`);

const current = await get(FORECAST_URL, { ...latLon(CITIES), ...currentParams });
const stateCurrent = await get(FORECAST_URL, { ...latLon(statePoints), ...currentParams });

// The trend chart requests only the five hottest; ordering must match what the page
// computes at render time, so rank the cities the same way here.
const ranked = CITIES.map((c, i) => ({
  c,
  temp: current[i]?.current?.temperature_2m ?? -999,
})).sort((a, b) => b.temp - a.temp);
const top5 = ranked.slice(0, TOP_N_TREND).map((r) => r.c);

const historyParams = { daily: 'temperature_2m_max', past_days: 7, forecast_days: 1, timezone: TZ };
const trendTop5 = await get(FORECAST_URL, { ...latLon(top5), ...historyParams });
const history7 = await get(FORECAST_URL, { ...latLon(CITIES), ...historyParams });

const archiveParams = { daily: 'temperature_2m_max', timezone: TZ };
const archive2025 = await get(ARCHIVE_URL, {
  ...latLon(CITIES),
  start_date: w2025.start,
  end_date: w2025.end,
  ...archiveParams,
});
const archive2024 = await get(ARCHIVE_URL, {
  ...latLon(CITIES),
  start_date: w2024.start,
  end_date: w2024.end,
  ...archiveParams,
});

const snapshot = {
  fetchedAt: new Date().toISOString(),
  source: 'Open-Meteo Forecast API + Archive API (ERA5)',
  license: 'CC-BY 4.0 — https://open-meteo.com/en/license',
  note: 'Cached fallback for /labs/heat-dashboard/. Served only when the live API fails, and labeled as a snapshot in the UI.',
  cityCount: CITIES.length,
  windows: { archive2025: w2025, archive2024: w2024 },
  responses: { current, stateCurrent, trendTop5, history7, archive2025, archive2024 },
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(snapshot), 'utf8');

const bytes = Buffer.byteLength(JSON.stringify(snapshot));
const hottest = ranked[0];
console.log(`Wrote ${OUT} (${Math.round(bytes / 1024)} KB)`);
console.log(`  fetchedAt : ${snapshot.fetchedAt}`);
console.log(`  hottest   : ${hottest.c.name}, ${hottest.c.state} @ ${hottest.temp} °C`);
console.log(`  windows   : 2025 ${w2025.start}→${w2025.end} · 2024 ${w2024.start}→${w2024.end}`);
