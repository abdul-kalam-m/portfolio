# Portfolio Website — Operating Guide

**Owner:** Abdul Kalam (ar.abdulkalam.mustaq@gmail.com) — urbanist & geospatial analyst.
**Status:** Source-of-truth manual, v1.0 (2026-07-18).
**Audience of this document:** Claude Opus, Sonnet, and any other coding agent that designs, builds, tests, or maintains the site. Humans read it too, but every rule is written to be executable by an agent without further clarification.

---

## 0. How to use this document

1. This file is **canonical**. If code, comments, or prior chat history conflict with this guide, the guide wins. If the guide is wrong, propose an edit to the guide first — do not silently diverge.
2. Rules use RFC-2119 language: **MUST** (hard requirement), **SHOULD** (default; deviate only with a written reason in the PR/commit), **MAY** (allowed).
3. Anything in **§13.5 "Never change without approval"** requires the owner's explicit sign-off before modification.
4. When this guide leaves a decision open, apply the decision rules in §13.2. Do not ask the owner about anything §13.2 already resolves.
5. Copy this file into the repository root as `OPERATING_GUIDE.md` when the repo is created, and keep the repo copy as the live version. `CLAUDE.md` in the repo MUST point here.

---

## 1. Purpose, audiences, and narrative

### 1.1 What this site is for

1. **Hiring** — make it effortless for a hiring manager to conclude, within 60 seconds, that the owner does rigorous spatial/data work at a professional level.
2. **Networking** — every project and the site itself must be shareable in person via QR code (§9). Conference, poster session, and coffee-chat use is a first-class scenario, not an afterthought.
3. **Professional identity** — position the owner at the intersection of five things: **urbanism, geospatial technology, climate resilience, data engineering, and applied AI**. The site itself is evidence: it must demonstrate the craft it claims (working maps, live data, reproducible methods).

### 1.2 Target audiences, in priority order

| Priority | Audience                                                                                            | What they need in the first 30 seconds                            |
| -------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1        | Hiring managers (planning firms, climate/resilience orgs, geospatial teams, civic tech, data teams) | Who this is, what they do, 2–3 flagship projects, résumé, contact |
| 2        | Spatial-analysis / GeoAI / data-science community                                                   | Technical depth: methods, code, reproducibility, live demos       |
| 3        | Planning & climate-resilience practitioners                                                         | Applied outcomes: places, policies, maps, design work             |
| 4        | Conference contacts scanning a QR code on a phone                                                   | A single project page that loads fast on mobile and stands alone  |

### 1.3 Core narrative (use verbatim as the tone anchor)

> **"I turn climate and urban data into decisions."** From flood-finance atlases and heat dashboards to AI agents that make maps, my work connects spatial analysis, reproducible data pipelines, and urban design into evidence people can act on.

Every page must serve this narrative. Copy that drifts into generic "passionate about technology" territory MUST be rewritten. Show, don't claim: prefer "203 census tracts, five cities, pre-specified robustness battery" over "detail-oriented analyst."

### 1.4 Voice and tone

- First person, plain, confident, specific. Short sentences.
- Numbers over adjectives. Every project headline includes at least one concrete quantity (tracts, cities, °C, rejection rates, DPI, years of data).
- No buzzword strings. "Applied AI" is always shown via a working artifact, never asserted.

---

## 2. Information architecture

### 2.1 Site map (required pages)

```
/                         Home (hero, narrative, 3 section cards, featured projects, contact)
/geospatial/              Section index: Geospatial Intelligence
/data-ai/                 Section index: Data Engineering & Applied AI
/urban-design/            Section index: Urban Design & Climate Resilience
/projects/<slug>/         One page per project case study (all sections share this route)
/about/                   Bio, skills matrix, education, tools, headshot
/resume/                  HTML résumé + downloadable PDF
/contact/                 Email, LinkedIn, GitHub, location; no contact form in v1
/qr/                      QR landing hub (§9)
/404                      Custom 404 with links back to the three sections
```

### 2.2 The three portfolio sections (canonical names — do not rename without approval)

The owner's original working names were "Spatial Planning," "Data Analysis," and "Urban Design." The canonical public-facing names are:

| Canonical name                        | Slug             | Contents                                                                                                                                              |
| ------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Geospatial Intelligence**           | `/geospatial/`   | GIS and spatial-analysis projects: suitability and site analysis, census/ACS spatial work, zoning digitization, spatial statistics, cartography       |
| **Data Engineering & Applied AI**     | `/data-ai/`      | Big-data pipelines, reproducible research, dashboards, and AI systems. Launch content: AutoCarto-Agent, GeoFloodFin, India Urban Heat Dashboard (§10) |
| **Urban Design & Climate Resilience** | `/urban-design/` | Urban planning, urban design, and climate-resilience studio/professional work (sourced from the existing portfolio PDFs — §10.4)                      |

Rules:

- Every project belongs to exactly **one** primary section (its index page) but MAY carry cross-section tags.
- Section order everywhere (nav, home, footer) is: Geospatial Intelligence → Data Engineering & Applied AI → Urban Design & Climate Resilience.
- Section index pages are card grids of project summaries plus a 2–3 sentence section intro tying it to the core narrative.

### 2.3 Navigation

- Persistent top nav: wordmark/name (→ home), the three sections, About, Résumé. Contact lives in the footer and home hero.
- Mobile: collapses to a menu button; nav MUST be fully keyboard- and screen-reader-operable (§8.3).
- Breadcrumb on project pages: `Section name → Project title`.
- Footer on every page: email, LinkedIn, GitHub, "Built with …" line linking to the site's own repo (the site is itself a portfolio piece).

---

## 3. Project case-study structure

Every project page follows the same template. All fields below map 1:1 to the content schema in §6.4.

### 3.1 Required blocks, in order

1. **Header** — title, one-line hook (≤ 120 chars, contains a number), primary section, tags, year, status badge (`Live` / `Published` / `In progress` / `Archived`).
2. **Impact strip** — 3–4 stat tiles (e.g., "203 tracts", "5 cities", "50 cities tracked", "+0.33 bivariate Moran's I"). Numbers MUST come from the project's own verified outputs, never invented.
3. **Hero visual** — the project's best single artifact: interactive map, dashboard embed, or a full-width image. Interactive when the project is interactive; static export as fallback (§7.6).
4. **Problem** — 2–4 sentences: what question, why it matters, for whom.
5. **Approach** — data sources (as a provenance table when applicable), methods, architecture. Diagrams over prose where the pipeline has ≥ 3 stages.
6. **Results** — findings with figures. Every figure has a caption and, where relevant, the number behind it.
7. **What I'd do next / limitations** — one short honest paragraph. This block signals research maturity; do not omit it.
8. **Links & reproducibility** — repo, live demo, paper/poster, data sources. If the project is reproducible, say exactly how ("runs top-to-bottom in Colab, no GPU").
9. **QR / share block** — auto-generated QR for this page's URL + copy-link button (§9).

### 3.2 Depth tiers

- **Flagship** (the three §10 data projects + 1–2 best urban-design works): full template, interactive hero, 800–1500 words.
- **Standard**: full template, static hero allowed, 300–800 words.
- **Gallery item** (older design boards): title, hook, 1–3 images, 100–200 words. Lives on the section index or a lightweight project page.

### 3.3 Writing rules for case studies

- Lead with the outcome, then the method. A hiring manager who reads only blocks 1–3 must still get the point.
- Method details go under a "Technical detail" disclosure (`<details>`-style progressive disclosure) rather than being cut.
- Claims about performance, statistics, or results MUST be traceable to the source project's committed outputs (e.g., GeoFloodFin's frozen run, AutoCarto's blessed traces). If a number can't be traced, don't publish it.

---

## 4. Visual and interaction design principles

### 4.1 Identity

- Aesthetic: **cartographic modern** — the restraint of a well-set map: generous whitespace, a disciplined grid, one accent color, typography doing the hierarchy work. Think map plate + swiss grid, not tech-startup gradient.
- Maps and data graphics are the ornamentation. No decorative stock imagery, no generic "city skyline" photos, no particle backgrounds.
- Dark and light themes both supported; default follows `prefers-color-scheme`. Maps and charts MUST re-theme with the site (no dark page / blinding-white map).

### 4.2 Design tokens (single source of truth)

All colors, type scale, spacing, radii, and breakpoints are defined **once** as CSS custom properties / Tailwind theme tokens in one file (`src/styles/tokens.css`). Components MUST reference tokens, never hard-coded values. The concrete palette is chosen in Phase 1 (§11) with these constraints:

- One neutral ramp (background/surface/border/text), one **accent** (used for links, active states, and the primary data color), one **alert/heat** color reserved for data semantics (e.g., heat, flood risk) — never for UI chrome.
- All text/background pairs MUST pass WCAG 2.2 AA contrast (§8.3); data-viz categorical palettes MUST be colorblind-safe (Okabe-Ito or ColorBrewer as defaults).
- Type: one variable sans for UI/body (system-adjacent, e.g., Inter or IBM Plex Sans), optional mono for data/code accents. Max two families. Self-hosted, `font-display: swap`.

### 4.3 Layout

- 12-column fluid grid, max content width 1200px; case-study prose measure 60–75ch.
- Spacing on a 4px base scale; only token values.
- Cards, stat tiles, and figures share one radius and one elevation treatment site-wide.

### 4.4 Interaction

- Interactions are **purposeful**: hover/focus states, map interactions, chart tooltips, theme toggle, QR reveal. No scroll-jacking, no autoplaying carousels, no cursor effects.
- Motion: 150–250ms ease transitions only; everything gated behind `prefers-reduced-motion: reduce` (reduced = instant state change, maps skip flyTo animations).
- Every interactive element has visible focus (`:focus-visible`) and a hit target ≥ 44×44px on touch.

---

## 5. Design system and reusable components

### 5.1 Component inventory (build these once, reuse everywhere)

| Component                               | Purpose                         | Notes                                                        |
| --------------------------------------- | ------------------------------- | ------------------------------------------------------------ |
| `SiteHeader` / `SiteFooter`             | Global chrome                   | Nav rules §2.3                                               |
| `SectionCard`                           | The 3 section entries on home   | Icon/thumbnail + name + 1-liner + project count              |
| `ProjectCard`                           | Grid item on section indexes    | Thumbnail, title, hook, tags, year, status badge             |
| `StatTile` / `ImpactStrip`              | Case-study block 2              | Number + label; number is `tabular-nums`                     |
| `Figure`                                | Every image/chart with caption  | Handles caption, alt, lazy-load, lightbox for boards         |
| `MapEmbed`                              | Interactive map island          | §7; lazy, static fallback                                    |
| `ChartEmbed`                            | Chart island                    | §7.4                                                         |
| `ProvenanceTable`                       | Data-sources table              | Source / product / access columns (GeoFloodFin README style) |
| `TagBadge`, `StatusBadge`               | Metadata chips                  | Tag vocabulary §6.5                                          |
| `QRShare`                               | QR + copy-link block            | §9                                                           |
| `Prose`                                 | Markdown/MDX typography wrapper | Enforces measure, heading rhythm                             |
| `DetailsBlock`                          | "Technical detail" disclosure   | §3.3                                                         |
| `Breadcrumb`, `SkipLink`, `ThemeToggle` | A11y/navigation                 | SkipLink is first focusable element on every page            |

### 5.2 Design-system rules

1. **No one-off styles.** If a page needs a new visual pattern, it becomes a component or token first, then gets used.
2. Components live in `src/components/`, one directory per component when it has more than one file; each exports typed props.
3. Variants via typed props (`variant="flagship" | "standard"`), never by copy-pasting a component.
4. Any third-party UI kit is **prohibited** (no shadcn/Material/Bootstrap themes). Primitives are hand-built on the token system — the site's craft is part of the portfolio.
5. Every component MUST render correctly in both themes and at 320px width before it's considered done.

---

## 6. Technology stack and repository structure

### 6.1 Stack (decided — change requires approval, §13.5)

| Layer               | Choice                                                                                                                                      | Rationale                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework           | **Astro** (latest stable) + TypeScript                                                                                                      | Content-first, zero-JS-by-default static output, islands for interactive maps/charts — matches a portfolio that is 90% content, 10% high-value interactivity |
| Interactive islands | **Svelte** or **React** components inside Astro islands (pick one in Phase 0 and stay with it; default **React** for ecosystem familiarity) | Maps/charts/dashboards only; static pages ship no framework JS                                                                                               |
| Content             | **Astro Content Collections** with MDX + Zod-validated frontmatter                                                                          | Case studies are content, not code; schema enforced at build time (§6.4)                                                                                     |
| Styling             | **Tailwind CSS v4** on top of `tokens.css` custom properties                                                                                | Utility speed + single token source                                                                                                                          |
| Maps                | **MapLibre GL JS** (+ PMTiles for self-hosted vector/raster tiles)                                                                          | Open-source, no API-key lock-in, WebGL performance; §7                                                                                                       |
| Charts              | **Observable Plot** (default) or D3 for bespoke graphics; Chart.js allowed only when porting the existing India dashboard                   | §7.4                                                                                                                                                         |
| QR                  | `qrcode` npm package, generated at build time as SVG                                                                                        | §9                                                                                                                                                           |
| Package manager     | **pnpm**, version pinned via `packageManager` field                                                                                         | Deterministic installs                                                                                                                                       |
| Hosting             | **Cloudflare Pages** (primary choice) or GitHub Pages; static output only, no server runtime in v1                                          | Free, fast, custom domain + HTTPS                                                                                                                            |
| CI                  | **GitHub Actions**                                                                                                                          | Build, test, Lighthouse, link-check on every PR (§12)                                                                                                        |
| Analytics           | None in v1, or privacy-preserving (Plausible/GoatCounter) if added later; never Google Analytics                                            | Privacy posture                                                                                                                                              |

**Explicitly out of scope for v1:** CMS, databases, serverless functions, auth, comments, newsletters, contact forms. The site is a static artifact with client-side interactivity only.

### 6.2 Repository location and relationship to this folder

- The git repository MUST live on a local disk (e.g., `C:\Users\abdul\projects\portfolio`), **not** inside Google Drive — Drive sync corrupts `.git` state and file watchers.
- This Drive folder (`…\3. PORTFOLIO WEBSITE\`) is the **asset inbox**: source PDFs, images, and drafts live here; curated/optimized copies are committed to the repo. Never make the Drive folder itself the repo.
- Remote: GitHub, public (`portfolio` or `<username>.github.io`). The repo being public and clean is itself a portfolio signal.

### 6.3 Repository structure

```
portfolio/
├── OPERATING_GUIDE.md          # this file — canonical
├── CLAUDE.md                   # 10-line pointer: read OPERATING_GUIDE.md; repo-specific commands
├── README.md                   # what/stack/run/deploy, screenshot, live URL
├── DECISIONS.md                # append-only log of approved deviations (§13.4)
├── package.json  pnpm-lock.yaml  astro.config.mjs  tsconfig.json  tailwind.config.*
├── public/
│   ├── files/                  # resume.pdf, poster PDFs
│   ├── fonts/                  # self-hosted, subset
│   └── tiles/                  # PMTiles archives if self-hosting tiles
├── src/
│   ├── content/
│   │   ├── projects/           # one .mdx per project — THE content of the site
│   │   └── config.ts           # Zod schemas (§6.4)
│   ├── components/             # §5.1 inventory
│   ├── islands/                # interactive map/chart/dashboard components only
│   ├── layouts/                # BaseLayout, ProjectLayout, SectionLayout
│   ├── pages/                  # routes per §2.1
│   ├── styles/tokens.css       # design tokens — single source (§4.2)
│   ├── lib/                    # utils: qr.ts, seo.ts, formatters.ts
│   └── data/                   # small static JSON/GeoJSON committed with provenance headers
├── scripts/                    # asset optimization, data snapshot/refresh scripts
├── tests/                      # Playwright e2e + a11y (§12)
└── .github/workflows/ci.yml
```

### 6.4 Content schema (Zod, enforced at build)

Every `src/content/projects/*.mdx` frontmatter MUST validate against:

```ts
{
  title: string,                    // ≤ 60 chars
  hook: string,                     // ≤ 120 chars, must contain a digit
  section: 'geospatial' | 'data-ai' | 'urban-design',
  tier: 'flagship' | 'standard' | 'gallery',
  year: number,                     // completion or last-major-update year
  status: 'live' | 'published' | 'in-progress' | 'archived',
  tags: string[],                   // from controlled vocabulary §6.5
  stats: { value: string, label: string }[],   // 3–4 items for tiers ≥ standard
  thumbnail: image(),               // 1200×630 min, used for cards AND og:image
  links?: { repo?: url, demo?: url, paper?: url, poster?: url },
  featured?: boolean,               // max 3 projects site-wide may set this
  draft?: boolean                   // drafts never build in production
}
```

Build MUST fail on schema violations. Adding a project = adding one MDX file + assets; no page code changes.

### 6.5 Tag vocabulary (controlled)

`gis`, `spatial-statistics`, `cartography`, `remote-sensing`, `climate`, `flood`, `heat`, `housing`, `census`, `data-pipeline`, `reproducible-research`, `dashboard`, `llm-agents`, `machine-learning`, `urban-design`, `planning`, `policy`, `python`, `javascript`, `webgl`.
Add a tag only by editing the Zod enum (which is the vocabulary's home) in the same PR that first uses it.

---

## 7. GIS, maps, data visualization, and interactive analysis

### 7.1 Principles

1. **Maps are content, not decoration.** Every map on the site answers a stated question; its caption states that question.
2. **Interactive only where interaction adds analysis** (filtering, hovering for values, toggling layers). A pattern that a static map shows equally well SHOULD be a static image — cheaper, faster, more accessible.
3. **Honest cartography**: classed choropleths state their classification method and class count; normalized variables state the denominator; sources are cited on or under every map.

### 7.2 Map implementation rules

- MapLibre GL JS, loaded **only as a lazy island** (`client:visible`); a map must never block initial page render.
- Basemaps: self-hosted PMTiles or a keyless style (e.g., OpenFreeMap / Protomaps). No Mapbox/Google tokens committed or required.
- Project data layers: GeoJSON < 500 KB gzipped may be committed to `src/data/` with a provenance comment header (source, retrieval date, license, processing script). Anything larger becomes PMTiles in `public/tiles/`, generated by a committed script in `scripts/`.
- Every `MapEmbed` MUST provide: legend, scale/attribution, keyboard-accessible controls, and a **static PNG fallback** rendered when JS is unavailable or `prefers-reduced-motion` + `save-data` contexts apply (§7.6).
- Layer z-order via explicit named layers/panes — the India-dashboard pane lesson (§10.3) is the pattern: never rely on insertion order.

### 7.3 Data-visualization rules

- Follow the site token palette; sequential/diverging ramps from ColorBrewer/viridis families; categorical from Okabe-Ito. Semantic consistency: heat = the alert/warm ramp, flood/water = the cool ramp, site-wide.
- Every chart: title as a sentence stating the takeaway, axis labels with units, source line. No dual y-axes, no 3D, no pie charts with > 4 slices.
- Charts render as islands with an inline SVG static fallback where feasible, and MUST be legible at 320px width (responsive redraw or horizontal-scroll container — never squashed).

### 7.4 Interactive-analysis embeds (dashboards)

- The India Urban Heat Dashboard is the reference pattern: a self-contained static HTML/JS app. Such apps are embedded on their case-study page via a **screenshot + "Launch dashboard" link** to the full-page live version under the same domain (e.g., `/labs/heat-dashboard/`) — not iframed into the prose column.
- `/labs/` MAY host self-contained live tools verbatim (their own HTML/JS, ported to site theming when practical). Each labs entry MUST have a corresponding case-study page; no orphan tools.
- Live-data apps degrade gracefully: API failure shows cached snapshot data with a "data as of DATE" notice, never a broken UI.

### 7.5 Reproducibility standards for shown analysis

- Any figure derived from analysis links to the repo/notebook that produced it.
- Data snapshots used by the site are versioned: `scripts/` contains the fetch/processing code; committed data carries retrieval date + license.
- Never claim "live data" unless it is; label snapshots as snapshots.

### 7.6 Fallback matrix (MUST implement)

| Context                                   | Behavior                                                                                                        |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| JS disabled / island failed               | Static PNG/SVG of the map/chart + caption + link to source                                                      |
| `prefers-reduced-motion`                  | No flyTo/zoom animations; instant transitions                                                                   |
| Slow network (lazy island not yet loaded) | Sized placeholder (no CLS) with static preview image                                                            |
| Screen reader                             | Map/chart has a text alternative summarizing the pattern and a data-table `<details>` where the data is tabular |

---

## 8. Content, metadata, accessibility, performance, SEO, responsive standards

### 8.1 Content standards

- All copy in en-US; sentence case for headings; Oxford comma; SI units with °C where relevant.
- Images: AVIF/WebP with dimensions set (no CLS), lazy-loaded below the fold, descriptive `alt` (or `alt=""` if truly decorative — rare here). Boards/plans from PDFs are re-exported at 2× display resolution, not screenshot-blurry.
- Every page has exactly one `<h1>`; heading levels never skip.
- Résumé PDF filename: `AbdulKalam_Resume_YYYY-MM.pdf`; the link text states it's a PDF.

### 8.2 Metadata & SEO

- Unique `<title>` (≤ 60 chars) and `meta description` (≤ 155 chars) per page, generated from frontmatter via `src/lib/seo.ts`.
- Open Graph + Twitter cards on every page; project pages use the project `thumbnail` (1200×630) as `og:image`. **QR-shared pages are judged by their link preview — treat OG images as a deliverable, not a chore.**
- JSON-LD: `Person` on home/about; `CreativeWork` (or `ScholarlyArticle` where a paper exists) on project pages; `BreadcrumbList` on project pages.
- `sitemap.xml`, `robots.txt`, canonical URLs, RSS optional. Human-readable, stable URLs — slugs never change after publication (§13.5); renames get redirects.

### 8.3 Accessibility (WCAG 2.2 AA — hard gate)

- Automated: `axe-core` via Playwright MUST report zero violations on every page in CI.
- Manual checklist per release: full keyboard traversal (skip link, nav, theme toggle, maps, lightbox); visible focus everywhere; screen-reader pass on one project page; contrast of all token pairs; forms/controls labeled; `prefers-reduced-motion` respected.
- Maps/charts follow §7.6 text alternatives. Color never the sole channel for meaning.

### 8.4 Performance budgets (hard gate, enforced in CI on throttled mobile)

| Metric                                               | Budget                                  |
| ---------------------------------------------------- | --------------------------------------- |
| Lighthouse Performance / A11y / Best Practices / SEO | ≥ 95 / 100 / 100 / 100                  |
| LCP                                                  | ≤ 2.0 s (home), ≤ 2.5 s (project pages) |
| CLS                                                  | ≤ 0.05                                  |
| INP                                                  | ≤ 200 ms                                |
| JS shipped on static pages                           | ≤ 30 KB gz (theme toggle + nav only)    |
| JS per map/chart island                              | ≤ 250 KB gz, lazy-loaded                |
| Page weight (initial, no islands)                    | ≤ 500 KB                                |

Fonts subset + preloaded; images responsive `srcset`; islands `client:visible`.

### 8.5 Responsive design

- Breakpoints (tokens): 320 (floor) / 640 / 768 / 1024 / 1280. Design mobile-first; test at 320, 375, 768, 1440.
- QR scans land on phones: project pages MUST be excellent at 375px — impact strip wraps to 2×2, maps go full-bleed with touch controls, tables become scrollable containers.
- No horizontal page scroll at any width; wide artifacts scroll within their own container.

---

## 9. QR-code sharing system

Networking via QR is a first-class feature.

1. Build step generates an SVG QR per project page and for the site root, encoding the canonical production URL (never preview URLs). Stored under `public/qr/<slug>.svg` and downloadable.
2. `QRShare` component (case-study block 9) shows the page's QR on demand ("Share" reveals it) with a copy-link button.
3. `/qr/` hub page: grid of all projects + résumé + site root, each with its QR — the owner opens this page to display any code in person, and it prints cleanly (print stylesheet, black-on-white).
4. QR codes MUST use high error-correction (level Q), quiet zone preserved, and be scannable from a printed poster at arm's length (test at 3 cm print size).
5. Because entry via QR skips the home page, every project page must stand alone: breadcrumb, footer contact, and a compact "About the author" byline strip on project pages.

---

## 10. Initial project registry (launch content)

Facts below are verified against the source repositories — reuse them; do not re-invent numbers. Each project's case study is written from its own repo/README as ground truth.

### 10.1 AutoCarto-Agent (CartoLLM) — `data-ai`, flagship

- **Hook:** A neuro-symbolic AI agent for thematic cartography — the LLM proposes, deterministic spatial-validation gates dispose.
- **Facts:** Poster at Spatiotemporal Data Science Symposium (STDS) 2026. Implemented gates: classification-diagnostic engine (prescriptive rejection, GVF) and bivariate justification (bivariate Moran's I, 199-permutation test, Spearman). Sandbox AST sanitizer; offline deterministic demo (< 3 s, byte-identical traces); mini-benchmark of naive-proposal rejection rates. Atlanta case: 530 tracts, I_xy = +0.3262 (p = 0.0050), ρ = +0.9471, GVF 0.751→0.835 / 0.774→0.861.
- **Source:** `C:\Users\abdul\Desktop\Temporary Files\RUTGERS\Portfolio Projects\CartoLLM` (README + `Fable Review/` docs).
- **Hero:** architecture diagram + Atlanta results panel; stats strip from the Atlanta numbers.

### 10.2 GeoFloodFin — `data-ai`, flagship

- **Hook:** A reproducible census-tract atlas joining modelled flood losses with mortgage-credit patterns in five low-income NJ cities.
- **Facts:** Newark, Trenton, Camden, Paterson, Elizabeth — 203 tracts. Joins a modelled flood Average Annual Loss surface (FEMA NFHL) with 2022 HMDA mortgage-denial patterns; pre-specified E8 robustness battery shows the pooled flood–credit association is an artifact of thin-count tracts and between-city composition. Submitted to _NHESS_. End-to-end Colab pipeline (Python 3.10, no GPU), frozen reproducible run, MIT code + CC-BY-4.0 data. Sources: FEMA NFHL, ACS 2018–2022, CDC SVI 2022, CFPB HMDA 2022, TIGER/Line 2022.
- **Source:** `I:\My Drive\geofloodfin` (README, manuscript, figures F1–F5).
- **Hero:** interactive tract-level MapLibre map of the AAL/denial atlas (rebuilt from the project's GeoPackage); provenance table straight from the README.

### 10.3 India Urban Heat Dashboard — `data-ai`, flagship

- **Hook:** A live dashboard tracking dangerous heat across 50 Indian cities — population-weighted, historically contextualized, one screen.
- **Facts:** Static HTML/JS; Open-Meteo Forecast + Archive APIs (ERA5); 50 curated cities with baked-in population; state choropleth via ~36 state-centroid batch request; India figure-ground mask (`fillRule: "evenodd"`); explicit Leaflet panes for z-order; Chart.js trends; 46 °C heatwave alert logic; 2024/25/26 historical comparison.
- **Source:** `C:\Users\abdul\Desktop\Temporary Files\RUTGERS\Small Portfolio\Urban Heat Dashboard` (`CASE_STUDY.md` is nearly publication-ready — adapt, don't rewrite).
- **Hero:** live dashboard under `/labs/heat-dashboard/` per §7.4, with snapshot fallback.

### 10.4 Urban Design & Climate Resilience section — seeded from PDFs

- Source material: `Works to be displayed\Portfolio - Abdul Kalam.pdf` (17.5 MB) and the 8 MB variant. Agents MUST extract project names, boards, and narratives from these PDFs (read in ≤ 20-page chunks), re-export imagery at web resolution, and propose the project list to the owner for approval **before** publishing this section.
- Expect mostly `standard` and `gallery` tier entries; 1–2 strongest works may be promoted to flagship with owner approval.

### 10.5 Geospatial Intelligence section — initial candidates

Candidate projects from work history (owner to confirm scope/shareability before publication — client work may be confidential): Census/ACS data pipelines and pulls (Philadelphia Chinatown), zoning-map digitization (Maurice River Township), Jersey Shore housing-market temporality analysis, GSP transportation-flow visualization. **Rule:** nothing from client or consulting work is published without explicit owner approval (§13.5).

---

## 11. Development phases and completion criteria

Work proceeds in phases; a phase is complete only when its exit criteria pass. Do not start Phase N+1 with Phase N criteria failing.

**Phase 0 — Foundation.** Repo scaffold (§6.3), Astro + TS + Tailwind + tokens.css, CI skeleton, CLAUDE.md, deploy pipeline to production URL with a placeholder page.
_Exit:_ CI green; production URL live over HTTPS; `pnpm build && pnpm test` clean locally.

**Phase 1 — Design system.** Tokens finalized (palette, type, spacing), all §5.1 components built with both themes, a components preview page (`/dev/components`, excluded from prod build).
_Exit:_ every component passes axe, renders at 320px, both themes; owner approves the visual direction from the preview page.

**Phase 2 — Core pages + content pipeline.** Content collections + Zod schema, layouts, home, section indexes, about, résumé, contact, 404; one placeholder project proving the MDX pipeline.
_Exit:_ all §2.1 routes render; schema violations fail the build; Lighthouse budgets met.

**Phase 3 — Flagship case studies.** The three §10 data-ai projects written and built, including the GeoFloodFin interactive map, AutoCarto figures, and the heat dashboard under `/labs/`.
_Exit:_ all three pages meet §3 template, §7 map rules, §8 budgets; owner approves copy.

**Phase 4 — Remaining sections.** Urban-design section from PDFs (§10.4), geospatial section (§10.5), QR system (§9), OG images for all pages.
_Exit:_ every published project passes the case-study checklist; `/qr/` prints correctly; owner has approved the §10.4/§10.5 project lists.

**Phase 5 — Hardening & launch.** Full §12 test pass, manual a11y checklist, link check, meta/JSON-LD validation, custom domain, README screenshot, DECISIONS.md current.
_Exit — site completion criteria:_ all CI gates green; Lighthouse ≥ 95/100/100/100 on home + one page per section (mobile, throttled); zero axe violations; zero broken links; all flagship stats traceable to sources; owner sign-off.

**Maintenance mode** (after launch): adding a project = one MDX file + assets + PR through the same CI gates. Dependency updates monthly, patch-level auto-merge allowed if CI is green; major framework upgrades require approval.

---

## 12. Testing and deployment workflow

### 12.1 CI pipeline (GitHub Actions, on every PR and main)

1. `pnpm install --frozen-lockfile`
2. `astro check` + `tsc --noEmit` (types), ESLint + Prettier check
3. `pnpm build` (fails on Zod schema violations, broken internal links via link-check step)
4. Playwright e2e: nav works, theme toggle persists, each route renders, map island loads and falls back correctly (JS-disabled project-page snapshot contains the static fallback)
5. `axe-core` a11y scan on all routes — zero violations
6. Lighthouse CI on home + one project page against §8.4 budgets

### 12.2 Branch & deploy rules

- `main` is always deployable and is the production branch. Feature work on `feat/<slug>` branches; PRs into main with CI green. No direct pushes to main once the site is live.
- Every PR gets a preview deployment (Cloudflare Pages previews). QR codes always encode production URLs, never previews.
- Production deploy is automatic on merge to main. Rollback = revert commit; never hotfix in the hosting dashboard.

### 12.3 Verification beyond CI (per release)

- Manual a11y checklist (§8.3), one real phone test of a QR scan → project page, print preview of `/qr/`, link-preview check (OG image renders in a validator).

---

## 13. Instructions for coding agents

### 13.1 Session protocol

1. Read repo `CLAUDE.md`, then this guide's relevant sections, then look at existing code **before** writing anything. Match existing patterns; don't introduce parallel idioms.
2. Work in small, verifiable increments; run the test suite before claiming completion. "Done" means CI-green, both themes, 320px, and a11y-clean — not "compiles."
3. Report honestly: failing tests are reported as failing, with output.

### 13.2 Decision rules (apply without asking)

- **Content vs. code:** if a change can be made in MDX/frontmatter instead of components, do it in content.
- **Token vs. value:** if a style needs a value that isn't a token, add the token first.
- **Static vs. island:** default static; islands only for §7-justified interactivity.
- **Dependency rule:** prefer zero new dependencies. A new dependency needs: > 50 LOC saved, active maintenance, no overlapping existing dep, and a note in DECISIONS.md.
- **Ambiguous copy:** draft it following §1.3–§1.4, mark it `<!-- DRAFT: owner review -->`, and continue; never block on wording.
- **Missing asset:** use a sized, labeled placeholder and log it in the PR description; never ship an empty box or a fabricated image.
- **Conflict found between guide and reality:** flag it in the PR; guide wins until the owner amends it.

### 13.3 Naming conventions

- Files/routes/slugs: `kebab-case` (`geofloodfin.mdx`, `/projects/geofloodfin/`). Slugs are short, stable, lowercase.
- Components: `PascalCase.astro/.tsx`; islands end in nothing special but live in `src/islands/`.
- Variables/functions `camelCase`; types/interfaces `PascalCase`; constants `SCREAMING_SNAKE` only for true constants.
- Assets: `<project-slug>-<descriptor>.<ext>` (`geofloodfin-aal-map.webp`). QRs: `public/qr/<slug>.svg`.
- Branches `feat/<slug>`, `fix/<slug>`; commits in imperative mood, ≤ 72-char subject.

### 13.4 Documentation expectations

- `README.md`: what the site is, stack, `pnpm dev/build/test`, deploy notes, live URL, screenshot — kept current.
- `DECISIONS.md`: append-only; every approved deviation from this guide, dated, one paragraph.
- Code comments only for non-obvious constraints (e.g., "pane order matters: mask must sit below markers"). No narrative comments.
- Each `scripts/` data script documents source, license, and output location in a header docstring.
- PR descriptions state: what changed, how it was verified, any placeholders/drafts left behind.

### 13.5 Never change without explicit owner approval

1. The three section names, their order, and their slugs (§2.2).
2. Published project slugs/URLs (redirects required even with approval).
3. The core narrative line (§1.3) and the owner's name/contact details.
4. The tech stack table (§6.1) — framework, map library, hosting.
5. Verified project facts and statistics in §10 — these trace to frozen research outputs; "improving" a number is falsification.
6. Publishing anything from client/consulting work, or anything from the PDFs not yet approved (§10.4–§10.5).
7. Résumé content, headshot, and bio facts.
8. Performance/a11y budgets (§8.3–§8.4) — they may be tightened, never loosened.
9. Deleting any project page or `/labs/` tool.
10. Analytics, tracking, third-party scripts of any kind.

### 13.6 Prohibited at all times

- Fabricating statistics, results, testimonials, or imagery presented as real work.
- Committing secrets/API keys (the stack requires none — a change that needs a key is a red flag; see §6.1).
- Adding UI frameworks/component kits (§5.2), CMSs, or backends in v1.
- Publishing draft-flagged content or unapproved client work to production.
- Bypassing CI gates (`--no-verify`, skipping tests) to get a deploy out.

---

_End of guide. Amendments: edit this file via PR; the owner approves changes to §13.5-protected items; everything else follows §13.2._
