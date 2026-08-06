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

## 2026-08-06 — Urban Design & Climate Resilience ships with no projects (superseded same day)

§10.4 requires extracting the candidate list from the owner's portfolio PDFs and proposing
it before publishing, and §13.5.6 prohibits publishing unapproved work. The section index
shipped a designed "in preparation" state rather than an empty grid.
`docs/urban-design-candidates.md` held the extracted proposal, pending approval.

**Superseded the same day:** the owner approved 6 of the 11 candidates (Adyar Basin Vision
Framework, Woodbridge, Pedestrian-Heavy Areas Crash Rates, Kosasthalaiyar Sponge City, TSUCE,
and the Lakefront). All six are now published as full case studies; see the next entry. The
"in preparation" empty state was removed from `src/pages/urban-design/index.astro` — the
section now renders the standard project grid like the other two.

## 2026-08-06 — Six urban-design projects published; two included client work

The owner approved publishing candidates 1, 2, 3, 4, 6, and 11 from
`docs/urban-design-candidates.md`. Two of the six are professional work for named public
clients (Adyar Basin Vision Framework and Kosasthalaiyar Sponge City, both for Sponge
Collaborative / Greater Chennai Corporation) — §13.5.6 makes that approval the owner's alone
to give, and it was given explicitly, by name, rather than inferred.

Figures for all six were rendered directly from
`Works to be displayed\Professional Portfolio - Abdul Kalam 10MB.pdf` via
`scripts/import-urban-design-figures.mjs`; full annotated spreads are used as-is, the same
pattern as the AutoCarto figures. Page ranges were re-verified against the PDF's own project
numbering after an initial mismatch: pages 13–15 (the unapproved "Climate Park &
Archaeological Interpretation Centre") were caught before being attributed to the approved
Kosasthalaiyar project, which is only pages 11–12.

**Two years are estimated, not cited.** Adyar Basin Vision Framework and Woodbridge have no
explicit date in the source PDF or either résumé. Both are set to 2023: Adyar Basin as the
last year of the Sponge Collaborative engagement (Aug 2021–Jul 2024) that produced the
team's other 2023-dated deliverables on the same basin family of projects; Woodbridge as the
portfolio's own stated end year ("Selected Works 2016–2023"). The other four years (2021,
2023 ×2, 2025) are each cited directly in a résumé or the PDF text — see
`scripts/audit-claims.mjs` for the Woodbridge figures checked against the vendored PDF text.

**Four stats are checked against the source PDF text; the rest were verified visually.**
`scripts/vendor/portfolio-pdf-text.json` (pypdf extraction, committed 2026-08-06) lets
`audit-claims.mjs` check Woodbridge's 215/163/1,300/120 figures automatically, whitespace-
normalized to work around the PDF's kerning artifacts on bold pull-quote numbers. TSUCE's
sustainability metrics (600 kW, 68.25%, 34.25%, 30M L), the lakefront's 17-item legend, and
the 11 priority intersections are set as vector/outline graphics in the source PDF rather
than selectable text — pypdf extracts almost nothing from those pages (confirmed: page 18
extracts to 85 characters of unrelated labels). Those numbers were verified by direct visual
inspection of the rendered page at high resolution instead, and are cited with a page number
in each figure's caption.

## 2026-08-06 — Project pages have no separate hero image

Every project page rendered `thumbnail` full-width above the body. Two problems, both
reported by the owner: the thumbnail is a 1200×630 card crop, and the urban-design cards
are two-page PDF spreads at roughly 2.4:1 — covering them into the card ratio sliced ~21%
off the width, cutting the outer panel off a three-panel board and the caption column
mid-sentence. And because every card is drawn from a page the body also shows in full,
every project opened with a cropped duplicate of a figure that appeared intact a screen
later.

The hero block is removed. The first figure in the body is the hero (§3.1); `thumbnail` is
now only the card and og:image. Urban-design thumbnails are additionally generated with
`fit: contain` on the paper background rather than `fit: cover`, so the card shows the whole
board with a thin letterbox instead of a cropped one.

## 2026-08-06 — The `/qr/` hub page is removed (owner request)

§9.3 specifies a `/qr/` hub listing every project's code for in-person display and print.
The owner asked for it to go: "Do not need a separate section for the QR Codes, integrate it
as at the bottom of the appropriate project." Every project page already carries a `QRShare`
block at the bottom (§9.2), which is what the owner wanted, so nothing was lost there.

Removed: `src/pages/qr/index.astro`, the footer link, the `qr` OG card, and the route from
the test and budget lists. **Kept:** `src/pages/qr/[slug].svg.ts`, which still generates a
downloadable level-Q SVG per project plus the site root and resume (§9.1) — `QRShare`'s
download link depends on it. The print stylesheet that existed only for the hub went with
the page.

## 2026-08-06 — "Résumé" is spelled "Resume" site-wide (owner request)

The owner asked for the unaccented spelling everywhere. Applied to all user-facing text
(nav, footer, byline, page title and headings, download button, OG card) and to code
comments for consistency. §8.1's filename convention is unaffected — the PDF was already
`AbdulKalam_Resume_YYYY-MM.pdf`.

## 2026-08-06 — The Drive staging scaffold is abandoned, not migrated

`…\3. PORTFOLIO WEBSITE\Portfolio Projects\portfolio-staging\` is a stock
`create astro --template minimal` scaffold inside Google Drive, which §6.2 forbids as a repo
location. Nothing in it was worth carrying over. It is left in place, unused.

## 2026-08-06 — The "Antigravity" folder is confirmed unproductive, as flagged

A second, separate "Antigravity" folder was found later the same day at
`C:\Users\abdul\Desktop\Temporary Files\RUTGERS\6. PORTFOLIO\3. PORTFOLIO WEBSITE\Antigravity\`
— not the Drive tree searched at the start of the build, which is why it wasn't found
initially. It contains a `.git` with zero commits and a `portfolio\` Astro scaffold last
touched 2026-07-19, predating this build by weeks. Confirmed unproductive per the original
brief ("ignore … if it does not have anything productive") and left untouched, with one
exception: its `Works to be displayed\` subfolder was where the owner's current résumé
(`AbdulKalam_Resume.docx`) was found — a convenient drop location, not evidence of an active
parallel effort.

## 2026-08-06 — Production URL is a placeholder

**NEEDS OWNER APPROVAL.** `SITE_URL` defaults to `https://abdulkalam.pages.dev`. §9.1
requires QR codes to encode the canonical production URL, and a printed code cannot be
corrected. Every QR on the site is provisional until the real domain is set and the site is
rebuilt.

## 2026-08-06 — Résumé replaced with the owner-provided current version (resolved)

The owner provided a current résumé (`AbdulKalam_Resume.docx`, dated 2026-08-04, dropped in
the "Antigravity" scaffold's `Works to be displayed\` folder — see the next entry) and asked
for it to replace the earlier "Analyst" variant. It reflects a materially different current
state: a new role (Graduate Research Assistant, NJ Climate Change Resource Center), updated
CLiME Lab dates and scope, a corrected Sponge Collaborative title/dates
("Urban Designer & Policy Advisor," Aug 2021–Jul 2024), and updated education (MCRP,
Bloustein School, expected Dec 2026) and certifications.

Converted docx → PDF via Word COM automation (`docx2pdf`, since neither LibreOffice nor a
pure-Python renderer was available) to `public/files/AbdulKalam_Resume_2026-08.pdf`.
`src/pages/resume.astro` and the relevant parts of `src/pages/about.astro` were rewritten to
match it verbatim (§13.5.7). The superseded 2025-03 PDF was removed.

**Contact email confirmed 2026-08-06:** the owner confirmed `ar.abdulkalam.mustaq@gmail.com`
(the guide's value, §13.5.3) as correct site-wide. No code change was needed.

## 2026-08-06 — No headshot

§2.1 lists a headshot on the about page. None exists on disk. Per §13.2 the page ships
without one rather than with a fabricated or stock image; the layout does not depend on it.
