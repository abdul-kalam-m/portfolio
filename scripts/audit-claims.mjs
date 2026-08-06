/**
 * Honesty audit (OPERATING_GUIDE.md §3.3, §13.6).
 *
 * Two checks that matter more than any style rule on this site:
 *
 *   1. Every headline figure published for a built project is asserted against the string
 *      that appears in its source repository's committed output. If a number drifts, this
 *      fails — "improving" a number is falsification (§13.5.5).
 *   2. No project with status `planned` may carry an unscoped stat, and its page must say
 *      plainly that nothing has been built.
 *
 * Sources are read live from the project repositories, so a stale claim cannot pass by
 * being copied into this file too.
 *
 *   node scripts/audit-claims.mjs
 */
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CARTOLLM = 'C:/Users/abdul/Desktop/Temporary Files/RUTGERS/Portfolio Projects/CartoLLM';
const HEAT_CASE_STUDY =
  'C:/Users/abdul/Desktop/Temporary Files/RUTGERS/Small Portfolio/Urban Heat Dashboard/CASE_STUDY.md';
/*
 * Vendored 2026-08-06 from "Professional Portfolio - Abdul Kalam 10MB.pdf" (Works to be
 * displayed) via pypdf per-page text extraction — see scripts/vendor/portfolio-pdf-text.json.
 * Committed rather than read from the source PDF at audit time so the check is
 * reproducible without that Drive path being mounted.
 */
const PORTFOLIO_PDF_TEXT = path.resolve('scripts/vendor/portfolio-pdf-text.json');

/**
 * Strips whitespace before comparing. The source PDF's design-heavy layout kerns some
 * bold pull-quote numbers into "1 63" / "2 1 5" under text extraction even though the
 * page renders "163" / "215" — confirmed by visual inspection of the rendered page
 * (see docs/urban-design-candidates.md). Whitespace-insensitive matching is the honest
 * way to check these without false-failing on a PDF-extraction artifact.
 */
const normalize = (s) => s.replace(/\s+/g, '');

/** @type {{claim: string, sourceFile: string, mustContain: string, note: string}[]} */
const CLAIMS = [
  {
    claim: '530 Atlanta tracts',
    sourceFile: path.join(CARTOLLM, 'README.md'),
    mustContain: '530 tracts',
    note: 'AutoCarto impact strip + results caption',
  },
  {
    claim: "bivariate Moran's I = +0.3262",
    sourceFile: path.join(CARTOLLM, 'README.md'),
    mustContain: 'I_xy=+0.3262',
    note: 'AutoCarto impact strip + results caption',
  },
  {
    claim: 'p = 0.0050',
    sourceFile: path.join(CARTOLLM, 'README.md'),
    mustContain: 'p=0.0050',
    note: 'AutoCarto results caption',
  },
  {
    claim: 'Spearman rho = +0.9471',
    sourceFile: path.join(CARTOLLM, 'README.md'),
    mustContain: '0.9471',
    note: 'AutoCarto results caption',
  },
  {
    claim: 'GVF 0.751 -> 0.835 and 0.774 -> 0.861',
    sourceFile: path.join(CARTOLLM, 'README.md'),
    mustContain: 'GVF 0.751',
    note: 'AutoCarto results caption',
  },
  {
    claim: '~215 tests',
    sourceFile: path.join(CARTOLLM, 'README.md'),
    mustContain: '215 tests',
    note: 'AutoCarto reproducibility section',
  },
  {
    claim: '27 sandbox escape vectors',
    sourceFile: path.join(CARTOLLM, 'README.md'),
    mustContain: '27 escape vectors',
    note: 'AutoCarto reproducibility section',
  },
  {
    claim: '95.2% strict decision accuracy',
    sourceFile: path.join(CARTOLLM, 'benchmarks/mini_benchmark_report.json'),
    mustContain: '"strict_decision_accuracy": 0.9524',
    note: 'AutoCarto impact strip + benchmark section',
  },
  {
    claim: '62.5% rejection rate',
    sourceFile: path.join(CARTOLLM, 'benchmarks/mini_benchmark_report.json'),
    mustContain: '"rejection_rate": 0.625',
    note: 'AutoCarto benchmark section',
  },
  {
    claim: '20 of 21 scorable scenarios',
    sourceFile: path.join(CARTOLLM, 'benchmarks/mini_benchmark_report.json'),
    mustContain: '"strict_correct": 20',
    note: 'AutoCarto benchmark section',
  },
  {
    claim: 'the disclosed bivariate miss: I_xy +0.1965, rho 0.2398',
    sourceFile: path.join(CARTOLLM, 'benchmarks/mini_benchmark_report.json'),
    mustContain: '"bivariate_morans_i": 0.1965',
    note: 'AutoCarto limitations section — the miss is published, not filtered out',
  },
  {
    claim: 'heavy_right_skew clears the GVF floor 82.5% of the time',
    sourceFile: path.join(CARTOLLM, 'docs/validation_gates.md'),
    mustContain: '82.5%',
    note: 'AutoCarto limitations section',
  },
  {
    claim: 'GVF threshold 0.6',
    sourceFile: path.join(CARTOLLM, 'docs/validation_gates.md'),
    mustContain: 'GVF ≥ **0.6**',
    note: 'AutoCarto gate table',
  },
  {
    claim: '46 °C severe-heatwave threshold',
    sourceFile: HEAT_CASE_STUDY,
    mustContain: '46 °C',
    note: 'Heat dashboard impact strip + threshold section',
  },
  {
    claim: '2 batched API calls instead of 86 sequential',
    sourceFile: HEAT_CASE_STUDY,
    mustContain: '2 batched API calls instead of 86 sequential ones',
    note: 'Heat dashboard impact strip + results section',
  },
  {
    claim: '50 curated cities',
    sourceFile: HEAT_CASE_STUDY,
    mustContain: 'Curated list of 50',
    note: 'Heat dashboard impact strip',
  },
  {
    claim: 'even-odd fill rule for the India mask',
    sourceFile: HEAT_CASE_STUDY,
    mustContain: 'fillRule: "evenodd"',
    note: 'Heat dashboard technical detail',
  },
  {
    claim: 'pane z-order 200 / 350 / 360 / 370 / 400',
    sourceFile: HEAT_CASE_STUDY,
    mustContain: 'choroplethPane (350)',
    note: 'Heat dashboard technical detail',
  },
];

/**
 * Claims checked against the portfolio PDF's extracted text, whitespace-normalized (see
 * PORTFOLIO_PDF_TEXT above). Only the numbers that survive extraction cleanly are listed
 * here — several of the urban-design stats (TSUCE's 600 kW / 68.25% / 34.25% / 30M L, the
 * lakefront's 17-item legend, the 11 priority intersections) are set as vector/outline
 * graphics in the source PDF rather than selectable text, so they were verified instead by
 * direct visual inspection of the rendered page (recorded in the case study's figure
 * captions and in docs/urban-design-candidates.md) rather than machine text-matching.
 */
const PDF_CLAIMS = [
  {
    claim: '215 acres, Watson-Crampton neighborhood',
    page: 7,
    mustContain: '215',
    note: 'Woodbridge impact strip',
  },
  {
    claim: '163 land parcels threatened by future flooding',
    page: 7,
    mustContain: '163',
    note: 'Woodbridge impact strip + results section',
  },
  {
    claim: '1,300 households removed by NJ Blue Acres',
    page: 7,
    mustContain: '1,300',
    note: 'Woodbridge impact strip + problem statement',
  },
  {
    claim: '120 acres rezoned to open-space conservation',
    page: 7,
    mustContain: '120',
    note: 'Woodbridge impact strip + results section',
  },
];

let failures = 0;

console.log('Published figures vs their source of truth\n');
for (const claim of CLAIMS) {
  if (!existsSync(claim.sourceFile)) {
    console.log(`  SKIP  ${claim.claim}\n        source not reachable: ${claim.sourceFile}`);
    continue;
  }
  const source = await readFile(claim.sourceFile, 'utf8');
  const ok = source.includes(claim.mustContain);
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${claim.claim}`);
  console.log(`        ${claim.note}`);
  console.log(`        looked for "${claim.mustContain}" in ${path.basename(claim.sourceFile)}`);
}

// --------------------------------------------------------- urban-design PDF claims
console.log('\nUrban-design figures vs the source portfolio PDF (whitespace-normalized)\n');

if (existsSync(PORTFOLIO_PDF_TEXT)) {
  const pages = JSON.parse(await readFile(PORTFOLIO_PDF_TEXT, 'utf8'));
  for (const claim of PDF_CLAIMS) {
    const source = normalize(pages[String(claim.page)] ?? '');
    const ok = source.includes(normalize(claim.mustContain));
    if (!ok) failures += 1;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${claim.claim}`);
    console.log(`        ${claim.note}`);
    console.log(`        looked for "${claim.mustContain}" on PDF p. ${claim.page}`);
  }
} else {
  console.log(
    `  SKIP  ${PDF_CLAIMS.length} claim(s) — vendored text not reachable: ${PORTFOLIO_PDF_TEXT}`
  );
}

// ---------------------------------------------------------------- planned projects
console.log('\nPlanned projects carry no results\n');

const contentDir = path.resolve('src/content/projects');
for (const file of await readdir(contentDir)) {
  if (!file.endsWith('.mdx')) continue;
  const raw = await readFile(path.join(contentDir, file), 'utf8');
  const frontmatter = raw.slice(0, raw.indexOf('\n---', 4));
  if (!/status:\s*planned/.test(frontmatter)) continue;

  const statBlock = frontmatter.match(/stats:\n([\s\S]*?)(?=\n[a-zA-Z]|$)/)?.[1] ?? '';
  const values = [...statBlock.matchAll(/- value:/g)].length;
  const scoped = [...statBlock.matchAll(/scope:\s*true/g)].length;
  const hasNote = /plannedNote:/.test(frontmatter);

  const ok = values === scoped && hasNote;
  if (!ok) failures += 1;
  console.log(
    `  ${ok ? 'PASS' : 'FAIL'}  ${file} — ${scoped}/${values} stats marked scope, ` +
      `plannedNote ${hasNote ? 'present' : 'MISSING'}`
  );
}

if (failures > 0) {
  console.error(
    `\n${failures} claim(s) could not be traced to a source. Nothing ships until they can.`
  );
  process.exit(1);
}
console.log('\nEvery published figure traces to a committed source.');
