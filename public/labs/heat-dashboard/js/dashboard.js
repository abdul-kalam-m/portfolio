const ALERT_THRESHOLD = 46;
const TOP_N_TREND = 5;
const REFRESH_MS = 10 * 60 * 1000;

// §4.4: reduced motion means an instant state change, not a faster animation.
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const CHART_ANIMATION = REDUCED_MOTION ? false : undefined;

// Vendored from the jbrobst gist (retrieved 2026-08-06) by scripts/vendor-labs-assets.mjs.
// Served from this origin so the page does not depend on someone else's host staying up.
const STATES_GEOJSON_URL = "./vendor/india_states.geojson";


const BASEMAPS = {
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd"
  },
  voyager: {
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd"
  },
  positron: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    subdomains: "abcd"
  },
  "esri-gray": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri"
  },
  "esri-sat": {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri"
  }
};

const state = {
  map: null,
  basemapLayer: null,
  basemapKey: "dark",
  markersLayer: null,
  choroplethLayer: null,
  outlineLayer: null,
  maskLayer: null,
  trendChart: null,
  historyChart: null,
  currentData: [],
  statesGeoJson: null,
  stateTemps: {},
  sort: { key: "temp", dir: "desc" },
  filter: ""
};

// ---------- color + sizing helpers ----------
function tempColor(t) {
  if (t == null || isNaN(t)) return "#3f3d38";  // "no data", not a temperature
  if (t < 30) return "#ffeda0";
  if (t < 35) return "#fed976";
  if (t < 40) return "#feb24c";
  if (t < 43) return "#fd8d3c";
  if (t < 46) return "#e31a1c";
  return "#800026";
}

function markerRadius(pop) {
  const r = Math.sqrt(pop) / 4 + 5;
  return Math.min(Math.max(r, 6), 28);
}

function fmt(n, digits = 1) {
  return n == null || isNaN(n) ? "—" : n.toFixed(digits);
}

function deltaCell(d) {
  if (d == null || isNaN(d)) return "—";
  const cls = d >= 0 ? "delta-up" : "delta-down";
  const sign = d >= 0 ? "+" : "";
  return `<span class="${cls}">${sign}${d.toFixed(1)}</span>`;
}

// ---------- map ----------
// Custom panes give us deterministic z-order:
// tile (200) < choropleth (350) < mask (360) < outline (370) < markers (overlay, 400)
function initMap() {
  state.map = L.map("map", { zoomControl: true, attributionControl: true })
    .setView([22.5, 80], 5);

  state.map.createPane("choroplethPane");
  state.map.getPane("choroplethPane").style.zIndex = 350;
  state.map.createPane("maskPane");
  state.map.getPane("maskPane").style.zIndex = 360;
  state.map.getPane("maskPane").style.pointerEvents = "none";
  state.map.createPane("outlinePane");
  state.map.getPane("outlinePane").style.zIndex = 370;
  state.map.getPane("outlinePane").style.pointerEvents = "none";

  setBasemap("dark");
  state.markersLayer = L.layerGroup().addTo(state.map);
}

function setBasemap(key) {
  const cfg = BASEMAPS[key];
  if (!cfg) return;
  if (state.basemapLayer) state.map.removeLayer(state.basemapLayer);
  state.basemapLayer = L.tileLayer(cfg.url, {
    attribution: cfg.attribution,
    subdomains: cfg.subdomains || "abc",
    maxZoom: 10
  }).addTo(state.map);
  state.basemapKey = key;
}

function popupHtml(r) {
  const alertBlock = r.temp >= ALERT_THRESHOLD
    ? `<div class="pop-alert">&#9888; Heatwave threshold exceeded</div>` : "";
  return `
    <div class="city-popup">
      <div class="pop-head">
        <div>
          <div class="pop-title">${r.name}</div>
          <div class="pop-state">${r.state}</div>
        </div>
        <div class="pop-temp" style="color:${tempColor(r.temp)}">${fmt(r.temp)}&deg;</div>
      </div>
      <div class="pop-body">
        <div class="pop-row"><span class="pop-label">Today peak</span><span class="pop-value">${fmt(r.todayMax)}&deg;C</span></div>
        <div class="pop-row"><span class="pop-label">24h change</span><span class="pop-value">${r.delta24h == null ? "—" : (r.delta24h >= 0 ? "+" : "") + r.delta24h.toFixed(1) + "&deg;"}</span></div>
        <div class="pop-row"><span class="pop-label">Humidity</span><span class="pop-value">${fmt(r.humidity, 0)}%</span></div>
        <div class="pop-row"><span class="pop-label">Population</span><span class="pop-value">${(r.pop * 1000).toLocaleString()}</span></div>
      </div>
      ${alertBlock}
    </div>
  `;
}

function renderMarkers(rows) {
  state.markersLayer.clearLayers();
  rows.forEach(r => {
    L.circleMarker([r.lat, r.lon], {
      radius: markerRadius(r.pop),
      fillColor: tempColor(r.temp),
      color: r.temp >= ALERT_THRESHOLD ? "#fff" : "#0a0a09",
      weight: r.temp >= ALERT_THRESHOLD ? 2 : 1,
      fillOpacity: 0.9
    })
      .bindPopup(popupHtml(r), { closeButton: true, autoPan: true })
      .addTo(state.markersLayer);
  });
}

// ---------- state choropleth ----------
async function loadStatesGeoJson() {
  if (state.statesGeoJson) return state.statesGeoJson;
  const res = await fetch(STATES_GEOJSON_URL);
  state.statesGeoJson = await res.json();
  return state.statesGeoJson;
}

// Reconcile state-name variants between Open-Meteo city list and the GeoJSON.
const STATE_ALIASES = {
  "NCT of Delhi": "Delhi",
  "Orissa": "Odisha",
  "Uttaranchal": "Uttarakhand",
  "Pondicherry": "Puducherry"
};
const canonState = s => STATE_ALIASES[s] || s;

function aggregateByState(rows) {
  const acc = {};
  rows.forEach(r => {
    if (r.temp == null) return;
    const key = canonState(r.state);
    if (!acc[key]) acc[key] = { sum: 0, n: 0, peakSum: 0, peakN: 0, names: [] };
    acc[key].sum += r.temp;
    acc[key].n += 1;
    if (r.todayMax != null) {
      acc[key].peakSum += r.todayMax;
      acc[key].peakN += 1;
    }
    acc[key].names.push(r.name);
  });
  const out = {};
  Object.keys(acc).forEach(s => {
    out[s] = {
      avg: acc[s].sum / acc[s].n,
      avgPeak: acc[s].peakN ? acc[s].peakSum / acc[s].peakN : null,
      cities: acc[s].names
    };
  });
  return out;
}

// Bbox-center of the largest ring of a feature. Good enough as a "representative point".
function featureCenter(feature) {
  const geom = feature.geometry;
  let ring;
  if (geom.type === "Polygon") {
    ring = geom.coordinates[0];
  } else if (geom.type === "MultiPolygon") {
    ring = geom.coordinates.reduce(
      (big, poly) => (poly[0].length > big.length ? poly[0] : big),
      geom.coordinates[0][0]
    );
  } else {
    return null;
  }
  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  ring.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  return { lat: (minLat + maxLat) / 2, lon: (minLng + maxLng) / 2 };
}

// Sample one current temp per state at its representative point.
async function fetchStateTemps(geo) {
  const points = geo.features
    .map(f => ({ name: canonState(f.properties.ST_NM), c: featureCenter(f) }))
    .filter(p => p.c);
  const data = await fetchCurrentBatch(points.map(p => ({ lat: p.c.lat, lon: p.c.lon })), "stateCurrent");
  const out = {};
  points.forEach((p, i) => {
    const d = data[i] || {};
    out[p.name] = {
      temp: d.current?.temperature_2m ?? null,
      humidity: d.current?.relative_humidity_2m ?? null,
      todayMax: d.daily?.temperature_2m_max?.[d.daily.temperature_2m_max.length - 1] ?? null
    };
  });
  return out;
}

// Mask non-India regions: world rectangle as outer ring, every state outer ring as a hole.
// SVG evenodd fill-rule leaves India transparent and paints everything outside in mask color.
function buildMask(geo) {
  const world = [[-85, -180], [-85, 180], [85, 180], [85, -180]];
  const holes = [];
  geo.features.forEach(f => {
    const g = f.geometry;
    if (g.type === "Polygon") {
      holes.push(g.coordinates[0].map(([lng, lat]) => [lat, lng]));
    } else if (g.type === "MultiPolygon") {
      g.coordinates.forEach(poly => holes.push(poly[0].map(([lng, lat]) => [lat, lng])));
    }
  });
  return L.polygon([world, ...holes], {
    pane: "maskPane",
    // Must match --bg in css/styles.css, or the mask reads as a grey sheet over Asia.
    fillColor: "#111110",
    fillOpacity: 0.92,
    color: "transparent",
    weight: 0,
    fillRule: "evenodd",
    interactive: false
  });
}

async function renderChoropleth(rows) {
  const geo = await loadStatesGeoJson();
  state.stateTemps = await fetchStateTemps(geo);
  const cityAgg = aggregateByState(rows);

  if (state.choroplethLayer) state.map.removeLayer(state.choroplethLayer);
  if (state.outlineLayer) state.map.removeLayer(state.outlineLayer);
  if (state.maskLayer) state.map.removeLayer(state.maskLayer);

  state.choroplethLayer = L.geoJSON(geo, {
    pane: "choroplethPane",
    style: feature => {
      const nm = canonState(feature.properties.ST_NM);
      const st = state.stateTemps[nm];
      return {
        fillColor: st && st.temp != null ? tempColor(st.temp) : "#3f3d38",
        fillOpacity: 0.6,
        color: "transparent",
        weight: 0
      };
    },
    onEachFeature: (feature, layer) => {
      const nm = canonState(feature.properties.ST_NM);
      const st = state.stateTemps[nm] || {};
      const cAgg = cityAgg[nm];
      const tempStr = fmt(st.temp);
      const trackedBlock = cAgg
        ? `<div class="pop-row"><span class="pop-label">Cities tracked</span><span class="pop-value">${cAgg.cities.length}</span></div>
           <div class="pop-row"><span class="pop-label">City avg</span><span class="pop-value">${fmt(cAgg.avg)}&deg;C</span></div>`
        : `<div class="pop-row"><span class="pop-label">Cities tracked</span><span class="pop-value">—</span></div>`;
      layer.bindPopup(`
        <div class="city-popup">
          <div class="pop-head">
            <div>
              <div class="pop-title">${nm}</div>
              <div class="pop-state">Representative point</div>
            </div>
            <div class="pop-temp" style="color:${tempColor(st.temp)}">${tempStr}&deg;</div>
          </div>
          <div class="pop-body">
            <div class="pop-row"><span class="pop-label">Current</span><span class="pop-value">${tempStr}&deg;C</span></div>
            <div class="pop-row"><span class="pop-label">Today peak</span><span class="pop-value">${fmt(st.todayMax)}&deg;C</span></div>
            <div class="pop-row"><span class="pop-label">Humidity</span><span class="pop-value">${fmt(st.humidity, 0)}%</span></div>
            ${trackedBlock}
          </div>
        </div>
      `);
    }
  });

  state.outlineLayer = L.geoJSON(geo, {
    pane: "outlinePane",
    style: { color: "#ffffff", weight: 1.2, fill: false, opacity: 0.85 },
    interactive: false
  });

  state.maskLayer = buildMask(geo);

  if (document.getElementById("toggle-choropleth").checked) state.choroplethLayer.addTo(state.map);
  if (document.getElementById("toggle-mask").checked) state.maskLayer.addTo(state.map);
  state.outlineLayer.addTo(state.map);
}

function wireMapToggles() {
  const bind = (id, layerKey) => {
    document.getElementById(id).addEventListener("change", e => {
      const layer = state[layerKey];
      if (!layer) return;
      if (e.target.checked) layer.addTo(state.map);
      else state.map.removeLayer(layer);
    });
  };
  bind("toggle-choropleth", "choroplethLayer");
  bind("toggle-mask", "maskLayer");
  bind("toggle-cities", "markersLayer");

  document.getElementById("basemap-select").addEventListener("change", e => {
    setBasemap(e.target.value);
  });
}

// ---------- ranking table ----------
function sortRows(rows) {
  const { key, dir } = state.sort;
  const mult = dir === "asc" ? 1 : -1;
  const copy = rows.slice();
  copy.sort((a, b) => {
    const va = a[key], vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === "string") return va.localeCompare(vb) * mult;
    return (va - vb) * mult;
  });
  return copy;
}

function filterRows(rows) {
  const q = state.filter.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(r => r.name.toLowerCase().includes(q) || r.state.toLowerCase().includes(q));
}

function tempBar(t) {
  if (t == null || isNaN(t)) return "";
  const pct = Math.max(0, Math.min(100, ((t - 25) / 25) * 100));
  return `<span class="temp-bar"><span class="temp-bar-fill" style="width:${pct}%;background:${tempColor(t)}"></span></span>`;
}

function renderRanking() {
  const rows = filterRows(sortRows(state.currentData));
  const body = document.getElementById("ranking-body");
  body.innerHTML = rows.map((r, i) => `
    <tr class="${r.temp >= ALERT_THRESHOLD ? "row-alert" : ""}">
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${r.state}</td>
      <td class="temp-cell" style="color:${tempColor(r.temp)}">${fmt(r.temp)}&deg;${tempBar(r.temp)}</td>
      <td>${fmt(r.todayMax)}&deg;</td>
      <td>${deltaCell(r.delta24h)}</td>
      <td>${fmt(r.humidity, 0)}</td>
    </tr>
  `).join("");
}

function wireRankingHeaders() {
  document.querySelectorAll("#ranking-table th.sortable").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.dataset.sort === "rank" ? "temp" : th.dataset.sort;
      if (state.sort.key === key) {
        state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
      } else {
        state.sort.key = key;
        state.sort.dir = (key === "name" || key === "state") ? "asc" : "desc";
      }
      document.querySelectorAll("#ranking-table th.sortable").forEach(h => {
        h.classList.remove("active", "asc", "desc");
      });
      th.classList.add("active", state.sort.dir);
      renderRanking();
    });
  });

  document.getElementById("city-filter").addEventListener("input", e => {
    state.filter = e.target.value;
    renderRanking();
  });
}

// ---------- KPIs and alerts ----------
function renderKPIs(rows) {
  const sorted = sortRows(rows);
  const hottest = sorted[0];
  const alerts = rows.filter(r => r.temp >= ALERT_THRESHOLD);
  const over40 = rows.filter(r => r.temp >= 40).length;

  document.getElementById("kpi-hottest").textContent = hottest ? `${hottest.name} ${fmt(hottest.temp)}°` : "—";
  document.getElementById("kpi-peak").textContent = hottest ? fmt(hottest.temp) : "—";
  document.getElementById("kpi-over40").textContent = over40;
  document.getElementById("kpi-alerts").textContent = alerts.length;

  const banner = document.getElementById("alert-banner");
  const bannerText = document.getElementById("alert-banner-text");
  if (alerts.length > 0) {
    bannerText.textContent = `HEATWAVE ALERT — ${alerts.length} ${alerts.length === 1 ? "city" : "cities"} at or above ${ALERT_THRESHOLD}°C: ${alerts.slice(0, 5).map(a => a.name).join(", ")}${alerts.length > 5 ? "…" : ""}`;
    banner.classList.remove("hidden");
  } else {
    banner.classList.add("hidden");
  }

  const list = document.getElementById("alert-list");
  if (alerts.length === 0) {
    list.innerHTML = `<li class="muted">No cities currently at or above ${ALERT_THRESHOLD}°C.</li>`;
  } else {
    list.innerHTML = alerts.map(a => `
      <li>
        <span class="alert-city">${a.name}, ${a.state}</span>
        <span class="alert-temp">${fmt(a.temp)}°C</span>
      </li>
    `).join("");
  }
}

function renderLastUpdated() {
  const stale = document.getElementById("stale-banner");
  const staleText = document.getElementById("stale-banner-text");

  if (dataSource.mode === "snapshot") {
    const when = dataSource.fetchedAt
      ? new Date(dataSource.fetchedAt).toLocaleString("en-GB", {
          dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata"
        })
      : "an earlier run";
    document.getElementById("last-updated").textContent = `Snapshot data · as of ${when} IST`;
    staleText.textContent =
      `Live data unavailable. Showing the committed snapshot taken ${when} IST — figures below are not current.`;
    stale.classList.remove("hidden");
    return;
  }

  const now = new Date();
  stale.classList.add("hidden");
  document.getElementById("last-updated").textContent =
    `Updated ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} · auto-refresh every 10 min`;
}

// ---------- data load ----------
async function loadCurrent() {
  const data = await fetchCurrentBatch(CITIES);
  const rows = CITIES.map((c, i) => {
    const d = data[i] || {};
    const temp = d.current?.temperature_2m ?? null;
    const humidity = d.current?.relative_humidity_2m ?? null;
    const todayMax = d.daily?.temperature_2m_max?.[d.daily.temperature_2m_max.length - 1] ?? null;
    const hourly = d.hourly?.temperature_2m || [];
    const tempNow = hourly[hourly.length - 1];
    const temp24hAgo = hourly[hourly.length - 25];
    const delta24h = (tempNow != null && temp24hAgo != null) ? (tempNow - temp24hAgo) : null;
    return { ...c, temp, humidity, todayMax, delta24h };
  });
  rows.sort((a, b) => (b.temp ?? -999) - (a.temp ?? -999));
  state.currentData = rows;
  return rows;
}

// ---------- trend chart ----------
async function renderTrendChart(topCities) {
  const data = await fetch7DayHistory(topCities, "trendTop5");
  const labels = data[0]?.daily?.time || [];
  const palette = ["#ff6b35", "#b10026", "#f9a825", "#fd8d3c", "#fee08b"];
  const datasets = topCities.map((c, i) => ({
    label: c.name,
    data: data[i]?.daily?.temperature_2m_max || [],
    borderColor: palette[i % palette.length],
    backgroundColor: palette[i % palette.length] + "22",
    tension: 0.35,
    borderWidth: 2.5,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: palette[i % palette.length],
    pointBorderColor: "#111110",
    fill: i === 0 ? "origin" : false
  }));

  if (state.trendChart) state.trendChart.destroy();
  state.trendChart = new Chart(document.getElementById("trend-chart"), {
    type: "line",
    data: { labels: labels.map(d => d.slice(5)), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: CHART_ANIMATION,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { labels: { color: "#e8ecf1", usePointStyle: true, pointStyle: "circle", padding: 14 } },
        tooltip: {
          backgroundColor: "#161c24",
          borderColor: "#2c3744",
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#e8ecf1",
          padding: 10,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}°C` }
        }
      },
      scales: {
        x: { ticks: { color: "#8a96a8" }, grid: { color: "#1f2731" } },
        y: { ticks: { color: "#8a96a8", callback: v => v + "°" }, grid: { color: "#1f2731" }, title: { display: true, text: "Daily Max (°C)", color: "#8a96a8" } }
      }
    }
  });
}

// ---------- historical comparison ----------
function avg(arr) {
  const xs = arr.filter(v => v != null && !isNaN(v));
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

async function renderHistoryComparison() {
  const today = new Date();
  const w2026 = weekWindow(today, 0);
  const w2025 = weekWindow(today, 1);
  const w2024 = weekWindow(today, 2);

  document.getElementById("history-window").textContent =
    `Comparing ${w2026.start} → ${w2026.end} vs same week in 2025 and 2024`;

  const [cur, h2025, h2024] = await Promise.all([
    fetch7DayHistory(CITIES, "history7"),
    fetchArchiveWeek(CITIES, w2025.start, w2025.end, "archive2025"),
    fetchArchiveWeek(CITIES, w2024.start, w2024.end, "archive2024")
  ]);

  const cityAvg = arr => arr.map(d => avg(d?.daily?.temperature_2m_max || []));
  const a2026 = cityAvg(cur);
  const a2025 = cityAvg(h2025);
  const a2024 = cityAvg(h2024);

  document.getElementById("hist-2024-avg").textContent = fmt(avg(a2024)) + "°";
  document.getElementById("hist-2025-avg").textContent = fmt(avg(a2025)) + "°";
  document.getElementById("hist-2026-avg").textContent = fmt(avg(a2026)) + "°";
  const hotter = a2026.filter((v, i) => v != null && a2025[i] != null && v > a2025[i]).length;
  document.getElementById("hist-hotter").textContent = `${hotter} / ${CITIES.length}`;

  const indices = a2026
    .map((v, i) => ({ v, i }))
    .filter(x => x.v != null)
    .sort((a, b) => b.v - a.v)
    .slice(0, 15)
    .map(x => x.i);

  const labels = indices.map(i => CITIES[i].name);
  if (state.historyChart) state.historyChart.destroy();
  const barOpts = { borderRadius: 4, borderSkipped: false, categoryPercentage: 0.75, barPercentage: 0.85 };
  state.historyChart = new Chart(document.getElementById("history-chart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "2024", data: indices.map(i => a2024[i]), backgroundColor: "#fed976", ...barOpts },
        { label: "2025", data: indices.map(i => a2025[i]), backgroundColor: "#fd8d3c", ...barOpts },
        { label: "2026", data: indices.map(i => a2026[i]), backgroundColor: "#b10026", ...barOpts }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: CHART_ANIMATION,
      plugins: {
        legend: { labels: { color: "#e8ecf1", usePointStyle: true, pointStyle: "rectRounded", padding: 14 } },
        tooltip: {
          backgroundColor: "#161c24",
          borderColor: "#2c3744",
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#e8ecf1",
          padding: 10,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)}°C` }
        }
      },
      scales: {
        x: { ticks: { color: "#8a96a8", maxRotation: 45, minRotation: 30 }, grid: { display: false } },
        y: { ticks: { color: "#8a96a8", callback: v => v + "°" }, grid: { color: "#1f2731" }, title: { display: true, text: "Week-mean Daily Max (°C)", color: "#8a96a8" } }
      }
    }
  });
}

// ---------- orchestration ----------
async function refreshAll() {
  const btn = document.getElementById("refresh-btn");
  btn.disabled = true;
  btn.textContent = "Loading…";
  try {
    const rows = await loadCurrent();
    renderKPIs(rows);
    renderRanking();
    renderMarkers(rows);
    await renderChoropleth(rows);
    renderLastUpdated();

    const top5 = rows.slice(0, TOP_N_TREND);
    renderTrendChart(top5);
    renderHistoryComparison();
  } catch (err) {
    // Reaching here means even the snapshot failed to load.
    console.error(err);
    const stale = document.getElementById("stale-banner");
    document.getElementById("stale-banner-text").textContent =
      "Neither the live API nor the committed snapshot could be loaded. Try refreshing.";
    stale.classList.remove("hidden");
    document.getElementById("last-updated").textContent = "Data unavailable";
  } finally {
    btn.disabled = false;
    btn.textContent = "Refresh";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  wireMapToggles();
  wireRankingHeaders();
  refreshAll();
  document.getElementById("refresh-btn").addEventListener("click", refreshAll);
  setInterval(refreshAll, REFRESH_MS);
});
