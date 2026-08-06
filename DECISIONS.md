# DECISIONS.md

Append-only log of approved deviations from `OPERATING_GUIDE.md` (§13.4). One dated
paragraph each. Items marked **NEEDS OWNER APPROVAL** are flagged rather than settled.

---

## 2026-08-06 — Content config lives at `src/content.config.ts`

§6.3 places the Zod schema at `src/content/config.ts`. Astro 7 removed that location: the
build fails with `LegacyContentConfigError` and instructs you to move it. The guide's path
is not reachable with the locked framework choice (§6.1), so the file moved and collections
use the glob loader. **Proposed guide amendment:** update §6.3's tree.

## 2026-08-06 — `planned` added to the content `status` enum

§6.4 lists `live | published | in-progress | archived`. Four launch projects (FloodScope,
Jurisdiction Intelligence OS, and the two NJ dashboards) have complete, committed build
guides and zero lines of code. Calling them `in-progress` would overstate them, and §13.6
forbids presenting an intention as an outcome. `planned` was added, and the schema now
_enforces_ the honesty rules that go with it: a `planned` project must carry a
`plannedNote`, and every stat on one must set `scope: true` or the build fails.

## 2026-08-06 — MapLibre GL and PMTiles not installed in v1

§6.1 fixes MapLibre as the map library and §7 governs `MapEmbed`. No v1 project has a map
to embed: GeoFloodFin and the NJ parcel dashboards are out of scope for this release, and
AutoCarto's cartography ships as committed static figures. Shipping ~200 KB of unused map
runtime would violate §13.2's dependency rule. `MapEmbed` and `ChartEmbed` are therefore
absent from the §5.1 inventory. **Revisit when project 8, 9, or GeoFloodFin lands** — the
stack decision itself is unchanged.

## 2026-08-06 — React declared as the island framework but not installed

§6.1 requires picking one island framework in Phase 0 and staying with it. React is the
pick. It is not installed, because v1 has no island: the heat dashboard is self-contained
vanilla JS under `/labs/`, and the theme toggle and nav are a couple of KB of inline TS.
Home ships well under the §8.4 30 KB budget as a result. The first island adds the
dependency.

## 2026-08-06 — Leaflet, Chart.js, and the India boundary GeoJSON vendored locally

The ported heat dashboard originally loaded Leaflet from unpkg, Chart.js from jsDelivr, and
state boundaries from a GitHub gist. §13.5.10 makes third-party scripts owner-approval-only,
and hotlinking makes the page fail when someone else's host does. All three now ship from
this origin via `scripts/vendor-labs-assets.mjs`. Boundary coordinates are rounded to four
decimal places (~11 m), taking the file from 1000 KB to 157 KB gzipped — inside §7.2's
budget and far finer than a national-zoom choropleth resolves. A Playwright test asserts the
page loads zero third-party scripts.

## 2026-08-06 — Basemap tiles remain third-party

`/labs/heat-dashboard/` still requests raster tiles from CARTO and Esri. These are images,
not scripts, and both are keyless — consistent with §7.2's "no API-key lock-in". Replacing
them would mean self-hosting PMTiles basemaps, which is the right move when §7's `MapEmbed`
work happens, not before.

## 2026-08-06 — `/labs/heat-dashboard/` is dark-only

§4.1 requires maps and charts to re-theme with the site. The lab tool does not: its default
basemap is CARTO Dark Matter and its heat ramp is calibrated against a dark base. Its
palette was re-pointed at the site's dark tokens so it reads as the same product, and the
temperature ramp is left untouched because it is data semantics (§7.3). The case-study page
around it themes normally. **Revisit if a light basemap becomes the default.**

## 2026-08-06 — Shiki comment color overridden in CSS

Both GitHub Shiki themes paint comments `#6A737D`, which measures 4.26:1 on the light code
surface and 3.33:1 on the dark one — under the §8.3 AA floor, on the part of a snippet a
reader most needs. Shiki's `colorReplacements` does not reach Astro's dual-theme output, so
`Prose.astro` overrides the token with an attribute-matched `!important` rule. Replacement
values are contrast-checked.

## 2026-08-06 — `--color-border-strong` darkened in both themes

The first palette used `#a9a49a` (light) and `#56534c` (dark) for control borders, which
measure 2.39:1 and 2.46:1 against their backgrounds — below WCAG 1.4.11's 3:1 for non-text
UI. Now `#8a857b` and `#7a766d`, at 3.52:1 and 4.17:1. Caught by
`scripts/check-contrast.mjs`, which is the reason that script exists.

## 2026-08-06 — Urban Design & Climate Resilience ships with no projects

§10.4 requires extracting the candidate list from the owner's portfolio PDFs and proposing
it before publishing, and §13.5.6 prohibits publishing unapproved work. The section index
therefore ships a designed "in preparation" state rather than an empty grid.
`docs/urban-design-candidates.md` holds the extracted proposal. **NEEDS OWNER APPROVAL**
before anything in that section publishes.

## 2026-08-06 — The Drive staging scaffold is abandoned, not migrated

`…\3. PORTFOLIO WEBSITE\Portfolio Projects\portfolio-staging\` is a stock
`create astro --template minimal` scaffold inside Google Drive, which §6.2 forbids as a repo
location. Nothing in it was worth carrying over. It is left in place, unused.

## 2026-08-06 — Production URL is a placeholder

**NEEDS OWNER APPROVAL.** `SITE_URL` defaults to `https://abdulkalam.pages.dev`. §9.1
requires QR codes to encode the canonical production URL, and a printed code cannot be
corrected. Every QR on the site is provisional until the real domain is set and the site is
rebuilt.

## 2026-08-06 — Résumé variant and contact email

**NEEDS OWNER APPROVAL.** Three résumé variants exist (Analyst, Planner, Transportation
Planner); the Analyst one is featured as the best fit for the site's positioning. Swapping
is a one-line change in `src/lib/site.ts` plus the file in `public/files/`. Separately, the
guide's owner line gives `ar.abdulkalam.mustaq@gmail.com` while the résumé PDF gives
`abdulkalam.mustaq@rutgers.edu`. The guide is canonical (§13.5.3) so the site uses the
former, but one of the two should win everywhere.

## 2026-08-06 — No headshot

§2.1 lists a headshot on the about page. None exists on disk. Per §13.2 the page ships
without one rather than with a fabricated or stock image; the layout does not depend on it.
