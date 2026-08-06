const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const ARCHIVE_URL  = "https://archive-api.open-meteo.com/v1/archive";
const SNAPSHOT_URL = "./data/snapshot.json";
const TZ = "Asia/Kolkata";

// Live data with a committed fallback (portfolio OPERATING_GUIDE.md §7.4): when Open-Meteo
// is unreachable the dashboard renders the last committed snapshot and says so, rather
// than showing a broken UI. `dataSource.mode` drives the banner in dashboard.js.
const dataSource = {
  mode: "live",       // "live" | "snapshot"
  fetchedAt: null,    // ISO timestamp baked into the snapshot
  snapshot: null
};

function buildLatLon(cities) {
  return {
    latitude:  cities.map(c => c.lat).join(","),
    longitude: cities.map(c => c.lon).join(",")
  };
}

// Open-Meteo returns an array of result objects when multiple lat/lons are supplied.
// Single-coordinate requests return one object; normalize to array.
function asArray(resp) {
  return Array.isArray(resp) ? resp : [resp];
}

async function loadSnapshot() {
  if (dataSource.snapshot) return dataSource.snapshot;
  const res = await fetch(SNAPSHOT_URL);
  if (!res.ok) throw new Error(`snapshot ${res.status}`);
  const snap = await res.json();
  dataSource.snapshot = snap;
  dataSource.fetchedAt = snap.fetchedAt ?? null;
  return snap;
}

async function fetchJson(url, params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}

// Every request goes through here, so one upstream failure flips the whole page to
// snapshot mode consistently — a page half-live and half-cached is worse than either.
async function fetchOrSnapshot(key, live) {
  if (dataSource.mode === "snapshot") {
    const snap = await loadSnapshot();
    return snap.responses[key] ?? [];
  }
  try {
    return await live();
  } catch (err) {
    console.warn(`Open-Meteo unavailable (${err.message}); falling back to snapshot.`);
    dataSource.mode = "snapshot";
    const snap = await loadSnapshot();
    return snap.responses[key] ?? [];
  }
}

// Current temp, humidity, today's max, and past 24h hourly for trend delta.
async function fetchCurrentBatch(cities, key = "current") {
  const { latitude, longitude } = buildLatLon(cities);
  return fetchOrSnapshot(key, async () =>
    asArray(await fetchJson(FORECAST_URL, {
      latitude, longitude,
      current: "temperature_2m,relative_humidity_2m",
      hourly:  "temperature_2m",
      daily:   "temperature_2m_max",
      past_days: 1,
      forecast_days: 1,
      timezone: TZ
    }))
  );
}

// 7-day daily history for the trend chart.
async function fetch7DayHistory(cities, key = "history7") {
  const { latitude, longitude } = buildLatLon(cities);
  return fetchOrSnapshot(key, async () =>
    asArray(await fetchJson(FORECAST_URL, {
      latitude, longitude,
      daily: "temperature_2m_max",
      past_days: 7,
      forecast_days: 1,
      timezone: TZ
    }))
  );
}

// Archive API for historical week comparisons (2024, 2025).
async function fetchArchiveWeek(cities, startDate, endDate, key = "archive") {
  const { latitude, longitude } = buildLatLon(cities);
  return fetchOrSnapshot(key, async () =>
    asArray(await fetchJson(ARCHIVE_URL, {
      latitude, longitude,
      start_date: startDate,
      end_date:   endDate,
      daily: "temperature_2m_max",
      timezone: TZ
    }))
  );
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

// Returns {start,end} for the 7-day window ending on `endDate`, shifted by `yearOffset` years.
function weekWindow(endDate, yearOffset = 0) {
  const end = new Date(endDate);
  end.setFullYear(end.getFullYear() - yearOffset);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return { start: isoDate(start), end: isoDate(end) };
}
