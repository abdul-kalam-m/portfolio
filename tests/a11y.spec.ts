import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROUTES } from './routes';

/**
 * §8.3 is a hard gate: axe-core MUST report zero violations on every page, in both themes.
 */

const THEMES = ['light', 'dark'] as const;

for (const route of ROUTES) {
  for (const theme of THEMES) {
    test(`axe: ${route} (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.goto(route);
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();

      expect(
        results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      ).toEqual([]);
    });
  }
}

test('every page has exactly one h1 and no skipped heading levels', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);

    const h1Count = await page.locator('h1').count();
    expect(h1Count, `${route} should have exactly one h1 (§8.1)`).toBe(1);

    const levels = await page.$$eval('h1, h2, h3, h4, h5, h6', (nodes) =>
      nodes.map((n) => Number(n.tagName[1]))
    );
    for (let i = 1; i < levels.length; i += 1) {
      expect(
        levels[i]! - levels[i - 1]!,
        `${route} skips a heading level at index ${i} (${levels.join(',')})`
      ).toBeLessThanOrEqual(1);
    }
  }
});

test('the skip link is the first focusable element on every page', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route);
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(focused, `${route} should focus the skip link first (§5.1)`).toBe(
      'Skip to main content'
    );
  }
});
