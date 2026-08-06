// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { rm } from 'node:fs/promises';

// OPERATING_GUIDE.md §9.1: QR codes encode the canonical production URL, never a preview URL.
// Set SITE_URL in the production build environment before generating QR codes for print.
const SITE_URL = process.env.SITE_URL ?? 'https://abdulkalam.pages.dev';

/**
 * `/dev/*` is a component workbench for design review only (§11 Phase 1: "excluded from
 * prod build"). It is reachable via `pnpm dev` and never present in built output.
 *
 * Removal happens after the build rather than by mutating resolved routes: Astro 7 treats
 * the `astro:routes:resolved` route list as informational, so mutating it logs a reassuring
 * message while the page ships anyway. Deleting the emitted directory is verifiable, and
 * `tests/site.spec.ts` asserts the route 404s in a built site.
 *
 * @returns {import('astro').AstroIntegration}
 */
function excludeDevRoutes() {
  return {
    name: 'exclude-dev-routes',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        await rm(new URL('dev/', dir), { recursive: true, force: true });
        logger.info('removed /dev routes from the build — reach them with `pnpm dev`');
      },
    },
  };
}

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [mdx(), excludeDevRoutes(), sitemap({ filter: (page) => !page.includes('/dev/') })],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
      // Comment-token contrast is corrected in src/components/Prose.astro — Shiki's
      // colorReplacements does not reach the dual-theme output path.
    },
  },
});
