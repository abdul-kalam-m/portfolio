/**
 * Run Lighthouse against the §8.4 budgets on a local preview server.
 *
 * CI uses `lhci autorun` (see .github/workflows/ci.yml and lighthouserc.json). This script
 * exists because the LHCI CLI cannot clean up its Chrome temp directory on Windows and
 * dies with EPERM after a successful run — so locally we drive Lighthouse directly against
 * a Chromium that Playwright already manages.
 *
 * Source:  a running server (default http://localhost:4322 from `pnpm preview`).
 * Output:  stdout table; exit code 1 if any budget in §8.4 is missed.
 *
 *   pnpm build && pnpm preview --port 4322
 *   node scripts/lighthouse-local.mjs [baseUrl]
 */
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';

const BASE = process.argv[2] ?? 'http://localhost:4322';

const ROUTES = ['/', '/projects/autocarto-agent/', '/geospatial/'];

/** §8.4, mobile and throttled. Budgets may be tightened, never loosened (§13.5.8). */
const BUDGETS = {
  performance: 0.95,
  accessibility: 1,
  'best-practices': 1,
  seo: 1,
};

const METRIC_BUDGETS = [
  ['largest-contentful-paint', 2500, 'ms', 'LCP'],
  ['cumulative-layout-shift', 0.05, '', 'CLS'],
  ['total-byte-weight', 512_000, 'bytes', 'Page weight'],
];

/*
 * `channel: 'chromium'` forces the full browser build. Playwright's default headless
 * binary is the headless shell, which does not composite frames — Lighthouse reports
 * NO_FCP against it and every category scores zero, which looks like a catastrophic
 * site failure rather than a tooling one.
 */
const browser = await chromium.launch({
  channel: 'chromium',
  args: ['--remote-debugging-port=9222'],
});
let failures = 0;

for (const route of ROUTES) {
  const result = await lighthouse(
    `${BASE}${route}`,
    { port: 9222, output: 'json', logLevel: 'error' },
    {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 812,
          deviceScaleFactor: 2,
          disabled: false,
        },
      },
    }
  );

  const lhr = result.lhr;
  console.log(`\n${route}`);

  // An all-zero report means the run errored, not that the page scored zero.
  if (lhr.runtimeError) {
    console.error(`  RUNTIME ERROR ${lhr.runtimeError.code}: ${lhr.runtimeError.message}`);
    failures += 1;
    continue;
  }

  for (const [key, min] of Object.entries(BUDGETS)) {
    const score = lhr.categories[key].score ?? 0;
    const ok = score >= min;
    if (!ok) failures += 1;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${key.padEnd(15)} ${Math.round(score * 100)} (needs ${Math.round(min * 100)})`
    );
  }

  for (const [id, max, unit, label] of METRIC_BUDGETS) {
    const audit = lhr.audits[id];
    if (!audit || audit.numericValue == null) continue;
    const value = audit.numericValue;
    const ok = value <= max;
    if (!ok) failures += 1;
    const shown = unit === 'bytes' ? `${Math.round(value / 1024)} KB` : `${Math.round(value)}${unit}`;
    const cap = unit === 'bytes' ? `${Math.round(max / 1024)} KB` : `${max}${unit}`;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(15)} ${shown} (max ${cap})`);
  }
}

await browser.close();

if (failures > 0) {
  console.error(`\n${failures} budget(s) missed.`);
  process.exit(1);
}
console.log('\nAll §8.4 budgets met.');
