/**
 * Architecture diagrams for the projects that are specified but not yet built.
 *
 * Every stage below is transcribed from that project's own committed build guide
 * (`OPERATING_GUIDE.md` in its Drive folder) — this is the owner's design work redrawn,
 * not a mock-up of results. §13.6 forbids fabricated imagery; a system diagram of a
 * locked architecture is neither fabricated nor a result.
 */

export interface DiagramStage {
  label: string;
  detail?: string;
}

export interface DiagramLane {
  name: string;
  note?: string;
  stages: DiagramStage[];
}

export interface Diagram {
  /** Stated as the question the diagram answers (§7.1). */
  caption: string;
  source: string;
  lanes: DiagramLane[];
}

export const DIAGRAMS: Record<string, Diagram> = {
  floodscope: {
    caption:
      'Where does the heavy geoprocessing happen, and what does the six-hourly job actually run?',
    source: 'FloodScope build guide §6.1–§6.3 (R/Python split, locked).',
    lanes: [
      {
        name: 'R batch layer',
        note: 'local, on data refresh',
        stages: [
          { label: 'M1 ingest', detail: 'NOAA/NWS, FEMA NFHL, USGS, county assets' },
          {
            label: 'M2 scenario geoprocessing',
            detail: 'depth grids × roads, assets, parks, tracts',
          },
        ],
      },
      {
        name: 'Interchange contract',
        note: 'the only thing the two halves share',
        stages: [
          { label: 'GeoPackage', detail: 'vector' },
          { label: 'COG GeoTIFF', detail: 'raster' },
          { label: 'Parquet', detail: 'exposure tables' },
        ],
      },
      {
        name: 'Python runtime',
        note: 'local + GitHub Actions, every 6 h',
        stages: [
          { label: 'M5 forecast translator', detail: 'stage → nearest library scenario' },
          { label: 'M4 impact scoring', detail: 'five metric families + priority score' },
          { label: 'M3 DuckDB warehouse' },
          { label: 'M7 read-only API · M8 dashboard', detail: 'FastAPI + Streamlit' },
        ],
      },
    ],
  },

  'jurisdiction-intelligence-os': {
    caption: 'How does a pile of municipal PDFs become a jurisdiction scorecard with no backend?',
    source: 'Jurisdiction Intelligence OS build guide §6.1–§6.3.',
    lanes: [
      {
        name: 'Batch pipeline',
        note: 'Python, weekly via Actions',
        stages: [
          { label: 'Permit ETL', detail: 'Socrata/CKAN open-data portals' },
          { label: 'LLM extraction', detail: 'board minutes → structured actions' },
          { label: 'Gold-set eval', detail: 'gates publication on measured precision' },
        ],
      },
      {
        name: 'Working store',
        stages: [{ label: 'DuckDB', detail: 'benchmarks, crosswalks, rule engine inputs' }],
      },
      {
        name: 'Committed artifacts',
        note: 'each file ≤ 500 KB',
        stages: [
          { label: 'scorecards/*.json' },
          { label: 'playbooks/*.json' },
          { label: 'signals.json · alerts.json · meta.json' },
        ],
      },
      {
        name: 'Static app',
        note: 'no server, no runtime API calls',
        stages: [{ label: 'Vite + React + Tailwind', detail: 'Cloudflare Pages' }],
      },
    ],
  },

  'nj-parcel-flood-risk': {
    caption: 'How do 3.4 million parcels get scored and served without a backend?',
    source: 'NJ Parcel Flood Risk build guide §6.1–§6.3 (stages 00–09, county-resumable).',
    lanes: [
      {
        name: 'Python ETL',
        note: 'local, partitioned by county, every stage resumable',
        stages: [
          { label: '01 parcel core', detail: 'MOD-IV → geometry, privacy strip, class groups' },
          { label: '03 intersect', detail: 'the heavy stage — NFHL + future layers' },
          { label: '05 score', detail: '0–100 with visible drivers' },
          { label: '06 aggregate', detail: 'DuckDB → municipality and county rollups' },
        ],
      },
      {
        name: 'Published artifacts',
        note: 'Cloudflare R2, public bucket',
        stages: [
          { label: 'PMTiles', detail: 'tippecanoe, parcel-zoom bands' },
          { label: 'Parquet + summary JSON' },
          { label: 'Per-municipality search shards' },
        ],
      },
      {
        name: 'Static app',
        note: 'only runtime calls: basemap, R2, geocoder',
        stages: [
          { label: 'MapLibre + pmtiles protocol', detail: 'Vite + React, Cloudflare Pages' },
        ],
      },
    ],
  },

  'nj-hazard-vulnerability': {
    caption: 'What does it take to score one parcel against several hazard scenarios at once?',
    source: 'NJ MOD-IV Hazard Vulnerability build guide §6 (stage names verbatim).',
    lanes: [
      {
        name: 'Shared parcel core',
        note: 'consumed from the sibling project, never rebuilt',
        stages: [
          { label: '10 core sync', detail: 'checksum-verified against upstream' },
          { label: 'Social context', detail: 'CDC SVI + NJ Overburdened Communities' },
        ],
      },
      {
        name: 'Scenario pipeline',
        note: 'parcel × scenario grain',
        stages: [
          { label: '20 hazards', detail: 'current flood, future/SLR, storm surge' },
          { label: '30 fact', detail: 'county-checkpointed; coverage honesty flags' },
          { label: '40 scores', detail: 'V = 0.45·E + 0.30·S + 0.25·C' },
          { label: '50 summaries · 90 validate' },
        ],
      },
      {
        name: 'Static dashboard',
        note: 'no geoprocessing in the UI',
        stages: [
          {
            label: 'State → county → municipality → parcel',
            detail: 'scenario selector switches every view',
          },
        ],
      },
    ],
  },
};
