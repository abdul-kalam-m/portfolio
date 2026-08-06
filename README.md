# Portfolio — Abdul Kalam

Personal site for an urbanist and geospatial analyst working across climate resilience, data
engineering, and applied AI. The site is itself a portfolio piece: hand-built components on a
token system, no UI kit, and a hard accessibility and performance gate in CI.

**Live:** not yet deployed — see [Deploying](#deploying).
**Canonical spec:** [`OPERATING_GUIDE.md`](./OPERATING_GUIDE.md). It wins over this README.

## What's here

| Section                           | Projects                                                                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Geospatial Intelligence           | NJ Parcel Flood Risk Dashboard, NJ Hazard Vulnerability Dashboard, FloodScope                                                                                   |
| Data Engineering & Applied AI     | AutoCarto-Agent, India Urban Heat Dashboard, Jurisdiction Intelligence OS                                                                                       |
| Urban Design & Climate Resilience | Adyar Basin Vision Framework, Woodbridge, Pedestrian-Heavy Areas Crash Rates, Kosasthalaiyar Sponge City, TSUCE, Restore + Connect + Engage (Chennai Lakefront) |

Two data-ai/geospatial projects are built and shipped with verified numbers; the six
urban-design projects are completed academic, professional, and competition work sourced
from the owner's design portfolio (owner-approved for publication 2026-08-06 — see
[`docs/urban-design-candidates.md`](./docs/urban-design-candidates.md)). The remaining four
geospatial/data-ai projects are fully specified with committed build guides and **no
implementation yet** — they are labeled `planned` on the card and on the page, their stat
tiles are marked as scope rather than results, and the content schema fails the build if
that ever stops being true.

`/labs/heat-dashboard/` hosts the live India Urban Heat Dashboard: 50 cities, Open-Meteo
forecast and ERA5 archive data, with a committed snapshot fallback so an API outage shows
dated cached figures instead of a broken page.

## Stack

Astro 7 + TypeScript · Content Collections with Zod-validated MDX · Tailwind v4 over
`src/styles/tokens.css` · self-hosted Inter and JetBrains Mono · `qrcode` for build-time SVG
QR codes · pnpm · Playwright + axe-core · GitHub Actions · Cloudflare Pages target.

No UI kit, no CMS, no backend, no analytics. Static pages ship roughly 3 KB of JavaScript —
a theme toggle and the mobile nav.

## Running it

```bash
pnpm install
pnpm dev        # http://localhost:4321 — plus /dev/components, the workbench
pnpm build      # production build; fails on content-schema violations
pnpm preview
```

## Checks

```bash
pnpm verify                       # the whole local gate — same set CI runs
pnpm check                        # astro check + TypeScript
pnpm test                         # Playwright e2e + axe-core, always against a fresh build
node scripts/check-contrast.mjs   # every declared token pair vs WCAG 2.2 AA
node scripts/check-links.mjs      # internal links across dist/
node scripts/check-budgets.mjs    # JS + page-weight budgets from the built output
node scripts/audit-claims.mjs     # every published figure vs its source repo or PDF
```

All of these run in CI on every push and pull request, plus Lighthouse against the §8.4
budgets. The suite includes checks that are about honesty rather than correctness: planned
projects must never render a measured figure, and the labs page must load zero third-party
scripts.

## Regenerating assets

```bash
node scripts/import-figures.mjs             # project figures from their source repos
node scripts/generate-diagram-thumbnails.mjs # architecture diagrams → card images
node scripts/vendor-labs-assets.mjs          # Leaflet, Chart.js, boundary GeoJSON
node scripts/refresh-heat-snapshot.mjs       # Open-Meteo fallback snapshot
node scripts/generate-og.mjs                 # site-level Open Graph cards
node scripts/capture-lab-screenshots.mjs     # dashboard screenshots (needs a running server)
```

Each script documents its source, license, and output in a header docstring.

## Adding a project

Add one `.mdx` file to `src/content/projects/` and its assets to `src/assets/projects/`.
No page code changes. The build fails on schema violations.

## Deploying

Static output to Cloudflare Pages: build command `pnpm build`, output directory `dist`.

**Before the first production deploy**, set `SITE_URL` to the real domain. QR codes encode
the canonical production URL at build time (§9.1) and a printed code cannot be corrected —
everything currently generated points at the `abdulkalam.pages.dev` placeholder.

## Open items

Tracked in [`DECISIONS.md`](./DECISIONS.md). The one still needing an owner decision: the
production domain — every QR code on the site is provisional until it's set.
