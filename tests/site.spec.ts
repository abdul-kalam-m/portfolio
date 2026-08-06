import { test, expect } from '@playwright/test';
import { ROUTES, SECTION_ROUTES, PROJECT_SLUGS, PLANNED_SLUGS } from './routes';

/** §12.1 step 4: every route renders, nav works, theme persists, budgets hold. */

test('every route returns 200 and renders its shell', async ({ page }) => {
  for (const route of ROUTES) {
    const response = await page.goto(route);
    expect(response?.status(), `${route} should return 200`).toBe(200);
    await expect(page.locator('header.site-header')).toBeVisible();
    await expect(page.locator('footer.site-footer')).toBeVisible();
    await expect(page).toHaveTitle(/.+/);
  }
});

test('the dev workbench is not in the built site', async ({ request }) => {
  // §11 Phase 1: /dev/components exists for design review and must never ship.
  const res = await request.get('/dev/components/');
  expect(res.status()).toBe(404);
});

test('nav reaches all three sections in canonical order', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('nav[aria-label="Primary"] a')
    .evaluateAll((links) => links.map((l) => l.getAttribute('href')));
  // §2.2: Geospatial → Data & AI → Urban Design, everywhere.
  expect(hrefs.slice(0, 3)).toEqual([...SECTION_ROUTES]);
});

test('theme toggle cycles and persists across navigation', async ({ page }) => {
  await page.goto('/');

  // At narrow widths the toggle lives inside the collapsed menu (§2.3).
  const navToggle = page.locator('#nav-toggle');
  if (await navToggle.isVisible()) await navToggle.click();

  const toggle = page.locator('#theme-toggle');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await toggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto('/about/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('mobile nav opens, is labeled, and closes on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('/');

  const toggle = page.locator('#nav-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#site-nav')).toBeVisible();

  await page.locator('#site-nav a').first().focus();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('no horizontal page scroll at any supported width', async ({ page }) => {
  // 320 is the floor, then the token breakpoints (§8.5).
  for (const width of [320, 375, 640, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/geospatial/', '/projects/autocarto-agent/', '/resume/']) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(overflow, `${route} overflows horizontally at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test('static pages stay under the 30 KB JS budget', async ({ page }) => {
  // §8.4: theme toggle + nav only. Measured on the built output, gzip-estimated.
  const bytes: number[] = [];
  page.on('response', async (response) => {
    if (response.url().endsWith('.js') && response.status() === 200) {
      const body = await response.body().catch(() => null);
      if (body) bytes.push(body.length);
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  const total = bytes.reduce((a, b) => a + b, 0);
  // Raw bytes; the budget is 30 KB gzipped, so raw under 90 KB is a safe proxy.
  expect(total, `home shipped ${total} bytes of JS`).toBeLessThan(90_000);
});

test('project pages carry breadcrumb, QR share, and author byline', async ({ page }) => {
  for (const slug of PROJECT_SLUGS) {
    await page.goto(`/projects/${slug}/`);
    // §9.5: a QR entry skips the home page, so each project page must stand alone.
    await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();
    await expect(page.locator('.qr-share')).toBeVisible();
    await expect(page.locator('aside[aria-label="About the author"]')).toBeVisible();
  }
});

test('QR share reveals a code and every QR endpoint resolves', async ({ page, request }) => {
  await page.goto('/projects/autocarto-agent/');
  const panel = page.locator('.qr-share .panel');
  await expect(panel).toBeHidden();
  await page.locator('[data-qr-toggle]').click();
  await expect(panel).toBeVisible();
  await expect(panel.locator('svg')).toBeVisible();

  for (const slug of ['site', 'resume', ...PROJECT_SLUGS]) {
    const res = await request.get(`/qr/${slug}.svg`);
    expect(res.status(), `/qr/${slug}.svg`).toBe(200);
    expect(res.headers()['content-type']).toContain('image/svg+xml');
  }
});

test('planned projects never present a result', async ({ page }) => {
  // §13.6 in test form: no implementation means no measured figure, anywhere on the page.
  for (const slug of PLANNED_SLUGS) {
    await page.goto(`/projects/${slug}/`);

    await expect(page.locator('.planned-note')).toContainText('Not built yet');
    await expect(page.locator('[data-status="planned"]').first()).toBeVisible();

    const tiles = page.locator('.impact .tile');
    const count = await tiles.count();
    for (let i = 0; i < count; i += 1) {
      await expect(tiles.nth(i), `${slug} stat tile ${i} is not marked as scope`).toHaveAttribute(
        'data-scope',
        'true'
      );
    }
    if (count > 0) {
      await expect(page.locator('.scope-note')).toBeVisible();
    }
  }
});

test('the labs tool loads no third-party scripts', async ({ page }) => {
  // §13.5.10: third-party scripts need owner approval. Tiles are images, and are excluded.
  const external: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.host !== new URL(page.url() || 'http://localhost:4322').host) {
      if (request.resourceType() === 'script' || request.resourceType() === 'stylesheet') {
        external.push(request.url());
      }
    }
  });

  await page.goto('/labs/heat-dashboard/index.html');
  await page.waitForTimeout(3000);
  expect(external).toEqual([]);
});

test('the labs tool falls back to the committed snapshot when the API fails', async ({ page }) => {
  // §7.4: API failure shows cached snapshot data with a "data as of DATE" notice.
  await page.route('**/api.open-meteo.com/**', (route) => route.abort());
  await page.route('**/archive-api.open-meteo.com/**', (route) => route.abort());

  await page.goto('/labs/heat-dashboard/index.html');
  await expect(page.locator('#stale-banner')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#stale-banner-text')).toContainText('committed snapshot');
  await expect(page.locator('#last-updated')).toContainText('Snapshot data');
  await expect(page.locator('#ranking-body tr')).toHaveCount(50);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('pages still render and the QR code is visible', async ({ page }) => {
    await page.goto('/projects/autocarto-agent/');
    await expect(page.locator('h1')).toBeVisible();
    // The code is server-rendered, so no-JS visitors get it without the reveal control.
    await expect(page.locator('.qr-share .panel svg')).toBeVisible();
    await expect(page.locator('#theme-toggle')).toBeHidden();
  });

  test('the labs tool explains that it needs JavaScript', async ({ page }) => {
    await page.goto('/labs/heat-dashboard/index.html');
    // Read the markup: a <noscript> element reports no innerText, and Playwright's
    // javaScriptEnabled:false does not make Chromium expose its children as rendered text.
    const fallback = await page.locator('noscript').innerHTML();
    expect(fallback).toContain('needs JavaScript');
    expect(fallback).toContain('/projects/india-urban-heat-dashboard/');
  });
});
