# Design handoff

**For:** Claude Design, taking on a visual overhaul of this site.
**From:** the build session that shipped v1, 2026-08-06.
**Canonical spec:** [`OPERATING_GUIDE.md`](./OPERATING_GUIDE.md) — it outranks this document
and outranks anything you or I would prefer.

The site is built, tested, and green. What follows is what exists, what constrains it, and
where I think the design is weakest.

---

## 1. What the site has to do

A hiring manager should conclude within 60 seconds that this person does rigorous
spatial and data work at a professional level. Secondary audiences: the spatial-analysis
community wanting technical depth, planning practitioners wanting applied outcomes, and
conference contacts arriving cold via a QR code on a phone.

The narrative line is fixed and cannot be reworded (§13.5.3):

> **"I turn climate and urban data into decisions."**

The aesthetic brief is **cartographic modern** — the restraint of a well-set map. Generous
whitespace, a disciplined grid, one accent, typography doing the hierarchy work. Maps and
data graphics are the ornament. That framing is what I built toward; it is a brief, not a
result, and it is fair game to push on.

---

## 2. Where I think this is weakest

Read this before the inventory. It is the useful part.

1. **The home page is competent and unmemorable.** It reads as a well-organised index. For
   someone whose whole pitch is turning spatial data into decisions, the first screen has no
   spatial artifact in it at all — just type on paper. The strongest raw material on the
   site (three Atlanta choropleths, a dark map of India with population-scaled markers) is
   buried two clicks down. **This is the highest-value thing to attack.**

2. **The two built projects and the four planned ones are visually equal citizens.** The
   home page separates them into "Start here" and "Everything else" with a sentence of
   explanation, but the cards themselves carry the same weight. A visitor skimming sees six
   projects and no visual signal about which two are real. The `planned` badge does the
   honest work; it does not do the _hierarchy_ work.

3. **Card thumbnails are inconsistent in kind.** Two are real artifacts (a figure, a
   screenshot); four are system diagrams generated from the build guides. They sit in one
   grid and read as one family, which slightly flatters the planned four. I regenerated the
   planned cards as deliberate schematics with a "Specified, not yet built" line baked into
   the image, which helps, but the tension is still there.

4. **Case-study pages are long and monotone.** The AutoCarto page is roughly 5,000 px of
   alternating prose and full-width figures with no rhythm change and no way to skim. There
   is no table of contents, no pull-quote, no sticky section marker. Blocks 1–3 do their job;
   after that a reader is on their own.

5. **The three section indexes are near-identical grids.** Nothing distinguishes
   Geospatial Intelligence from Data & AI except the words. Each section has a genuinely
   different character and the design does not exploit that.

6. **Dark mode is correct rather than considered.** Every pair passes AA and the neutral
   ramp inverts cleanly, but it was derived from the light theme rather than designed. The
   warm paper neutral has real character in light; the dark theme is closer to generic.

7. **The `/labs/` tool is visually a different product.** Its palette is pointed at the site's
   dark tokens, but its layout, density, and type are the original standalone dashboard's.
   Crossing from a case study into the lab is a jolt.

---

## 3. The constraint envelope

These are hard. They come from the operating guide, not from taste, and CI enforces most of
them — a design that violates one will fail the build, not just the review.

| Constraint                                                         | Where it is enforced                               |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| WCAG 2.2 AA, **zero** axe violations on every route in both themes | `tests/a11y.spec.ts`                               |
| Every token pair meets AA (4.5:1 text, 3:1 non-text UI)            | `scripts/check-contrast.mjs`                       |
| ≤ 30 KB gzipped JS on static pages                                 | `scripts/check-budgets.mjs` — currently 0.7–1.7 KB |
| Initial page weight ≤ 500 KB                                       | same — currently 45–72 KB                          |
| Lighthouse ≥ 95 / 100 / 100 / 100, LCP ≤ 2.5 s, CLS ≤ 0.05         | `lhci` in CI                                       |
| No horizontal scroll at 320, 375, 640, 768, 1024, 1440             | `tests/site.spec.ts`                               |
| Both themes correct; 320 px is the floor                           | manual + screenshots                               |
| Motion 150–250 ms, all gated behind `prefers-reduced-motion`       | `global.css`                                       |
| Visible `:focus-visible` everywhere; touch targets ≥ 44×44         | axe + `.hit-target`                                |
| Colour is never the only channel for meaning                       | axe + `StatusBadge` design                         |

And these are prohibitions:

- **No UI kit.** No shadcn, Material, Bootstrap, or any component library. Primitives are
  hand-built on the token system — the craft is part of the portfolio (§5.2.4).
- **No decorative stock imagery**, no city-skyline photos, no particle backgrounds,
  no gradient-as-decoration (§4.1).
- **No third-party scripts of any kind**, including fonts from a CDN and analytics
  (§13.5.10). Both typefaces are self-hosted from npm.
- **No one-off styles.** A new visual pattern becomes a token or a component first, then
  gets used (§5.2.1). If a value is not a token, add the token.

### Off-limits without the owner's sign-off (§13.5)

Section names, their order, and their slugs. Published project slugs. The narrative line.
The tech stack. Any verified statistic. Résumé and bio facts. The performance and
accessibility budgets — they may be tightened, never loosened.

You can restyle the section cards freely; you cannot rename "Geospatial Intelligence" or
move it out of first position.

---

## 4. What exists

### Tokens — `src/styles/tokens.css`

One file, single source of truth. Components reference tokens and never literals.

**Neutral ramp.** Warm paper, not grey. Light: `#fbfaf8` background, `#ffffff` surface,
`#f3f1ec` inset, `#171614` text. Dark: `#111110`, `#1a1a18`, `#232320`, `#f0eee9`.

**Accent.** Ink teal — `#0a6c74` light, `#4fd1d9` dark. One accent, used for links, active
states, primary buttons, and the primary data colour. There is no secondary brand colour by
design.

**Data-only ramps.** A warm heat ramp and a cool water ramp, plus Okabe-Ito categorical.
Their meaning is fixed site-wide (§7.3: heat = warm, flood = cool) and they must **never**
be used for UI chrome. This separation is load-bearing — it is what lets a reader trust that
a warm colour on this site means something.

**Type.** Inter Variable everywhere, JetBrains Mono Variable for code, chips, and any number
in a table. Two families, both self-hosted, `font-display: swap`. Nine-step scale from
`--text-2xs` to `--text-4xl`.

**Spacing.** 4 px base. Component `<style>` blocks use `var(--space-n)` rather than
Tailwind's `--spacing(n)` — Tailwind compiles each block in isolation without theme context,
so the function is unavailable there. Same scale either way.

**One radius, one elevation** for cards, stat tiles, and figures. Breakpoints 640 / 768 /
1024 / 1280, with 320 as the floor.

Current contrast measurements are in the `scripts/check-contrast.mjs` output — every pair,
both themes. Run it after any palette change; it fails the build below AA.

### Components — `src/components/`

`SiteHeader` · `SiteFooter` · `SkipLink` · `ThemeToggle` · `Breadcrumb` · `PageHeader` ·
`SectionCard` · `ProjectCard` · `ImpactStrip` · `StatusBadge` · `TagBadge` · `Figure` ·
`ProvenanceTable` · `DetailsBlock` · `Prose` · `QRShare` · `AuthorByline` ·
`ArchitectureDiagram`

`MapEmbed` and `ChartEmbed` from the §5.1 inventory are **not built** — no v1 project has a
map or chart island, and shipping an unused map runtime would break the dependency rule. See
`DECISIONS.md`.

**Two components carry meaning, not just style:**

- `ImpactStrip` has a `scope` variant that renders a dashed tile with a
  "SCOPE, NOT A RESULT" label. It exists so a project with no implementation cannot look
  like one with results. The content schema _fails the build_ if a planned project has an
  unscoped stat. Restyle it freely; do not make it look the same as a result tile.
- `StatusBadge` distinguishes statuses by dot fill and border style as well as colour,
  because colour alone is not an accessible channel.

### Where to look

**`/dev/components`** is a workbench with every component, the full colour ramps, the type
scale, and the spacing scale in one page. It is deleted from every build and reachable only
via `pnpm dev`. Start there.

`docs/screenshots/` has all 11 key routes × 2 themes × desktop and mobile, captured from
the built site.

### Pages

`/` · `/geospatial/` · `/data-ai/` · `/urban-design/` · `/projects/<slug>/` × 6 ·
`/about/` · `/resume/` · `/contact/` · `/qr/` · `/404` · `/labs/heat-dashboard/`

Two states worth knowing about:

- **`/urban-design/` has no projects.** Publishing that section needs the owner to approve a
  candidate list first (`docs/urban-design-candidates.md`). It currently ships a designed
  "in preparation" state, which is a real design surface, not a placeholder to delete.
- **`/qr/`** has a print stylesheet: black on white, site chrome hidden, three columns. The
  owner opens it to show a code in person and prints it for posters. Any restyle has to
  survive `Ctrl+P`.

---

## 5. Content model — restyle without touching content

Adding a project is one MDX file in `src/content/projects/`. Frontmatter is Zod-validated
and fails the build on violation. Fields a design can key off:

`tier` (`flagship` | `standard` | `gallery`) · `status`
(`live` | `published` | `in-progress` | `planned` | `archived`) · `featured` (max 3) ·
`section` · `alsoIn` · `tags` · `stats[].scope` · `year`

**`tier` and `status` are currently under-used by the design.** Both are already in the data
and neither drives much visual difference. That is the cheapest available lever for the
hierarchy problem in §2.2 — a `flagship` card could be genuinely, structurally different
from a `gallery` one without any content change.

---

## 6. If I were doing the overhaul

In priority order, with the reasoning:

1. **Put a real artifact on the home page above the fold.** The Atlanta choropleths or the
   India map, full-bleed or as a hero pane beside the narrative line. The site's claim is
   "I turn climate and urban data into decisions" and the current first screen shows
   neither climate nor data. This is the single highest-leverage change.
2. **Make flagship cards structurally different from gallery cards.** Use the `tier` field
   that is already there. The honest hierarchy should be visible before anyone reads a badge.
3. **Give case studies a spine.** A sticky section nav, or a running rail with the impact
   stats, so a 5,000 px page can be skimmed and re-entered. Blocks 1–3 already carry the
   point; blocks 4–8 need navigation.
4. **Differentiate the three sections.** Each has a distinct character — parcel-scale
   exposure, validated AI systems, adaptation design. One shared grid does not.
5. **Design the dark theme deliberately** rather than deriving it. The warm paper neutral
   is the most distinctive thing about the light theme and the dark theme drops that idea
   entirely.
6. **Bring `/labs/` closer to the site** — type scale and density, not just palette.

Two things worth preserving:

- The **scope-vs-result distinction** in `ImpactStrip`. It is the most unusual thing about
  this portfolio and it is the reason the four unbuilt projects can be shown at all.
- The **data-ramp reservation**. If accent and data colours start mixing, every map on the
  site gets less trustworthy.

---

## 7. Working on it

```bash
pnpm install
pnpm dev                  # /dev/components is the workbench
pnpm verify               # check + format + contrast + claims + build + budgets + links + test
pnpm shots                # re-capture docs/screenshots/ (needs a running preview)
```

`pnpm verify` is the whole local gate. It takes about a minute and it is the same set CI
runs. If it is green, the design change is shippable.
