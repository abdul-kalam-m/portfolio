/**
 * Build a self-contained design-system bundle for Claude Design.
 *
 * Source:  the running dev server's /dev/components workbench (default
 *          http://localhost:4321). Markup and CSS are lifted from the real rendered
 *          components rather than re-written here, so a preview can never drift from
 *          what the site actually ships.
 * Output:  design-bundle/
 *            foundations/*.html   colour ramps, type scale, spacing scale
 *            components/*.html    one preview per component group
 *            tokens.css           a copy of the single source of truth
 *            README.md            what this is and what the constraints are
 *
 * Each preview opens with a `<!-- @dsCard group="…" -->` marker, which is how the Design
 * System pane indexes it.
 *
 *   pnpm dev
 *   node scripts/build-design-bundle.mjs [devUrl]
 */
import { mkdir, writeFile, copyFile, rm, readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const DEV = process.argv[2] ?? 'http://localhost:4321';
const OUT = path.resolve('design-bundle');

/** Workbench section heading → { file, group, viewport }. Order drives the pane. */
const SECTIONS = [
  ['Color tokens', 'colors', 'Foundations', 900, 720],
  ['Type scale', 'type', 'Foundations', 760, 620],
  ['Spacing scale', 'spacing', 'Foundations', 520, 520],
  ['Badges', 'badges', 'Components', 720, 260],
  ['Breadcrumb', 'breadcrumb', 'Components', 720, 180],
  ['Impact strip — verified results', 'impact-strip-results', 'Components', 900, 300],
  ['Impact strip — scope figures', 'impact-strip-scope', 'Components', 900, 380],
  ['Section cards', 'section-cards', 'Components', 1100, 320],
  ['Project cards', 'project-cards', 'Components', 1100, 560],
  ['Provenance table', 'provenance-table', 'Components', 900, 340],
  ['Disclosure', 'disclosure', 'Components', 720, 240],
  ['Prose', 'prose', 'Components', 760, 620],
  ['Architecture diagram', 'architecture-diagram', 'Components', 1100, 520],
  ['Author byline', 'author-byline', 'Components', 900, 220],
];

const SUBTITLES = {
  colors: 'Neutral ramp, accent, and the three data-only palettes',
  type: 'Inter Variable, nine steps, --text-2xs to --text-4xl',
  spacing: '4px base scale, --space-1 to --space-24',
  badges: 'Five statuses and the controlled tag vocabulary',
  breadcrumb: 'Section → project, on every case-study page',
  'impact-strip-results': '3–4 tiles, tabular numerals, verified figures',
  'impact-strip-scope': 'The same component marked as scope, not result',
  'section-cards': 'The three portfolio sections on the home page',
  'project-cards': 'Grid item: thumbnail, status, title, hook, tags',
  'provenance-table': 'Source / product / vintage / access, scrollable',
  disclosure: 'Native details, keyboard-operable with no JavaScript',
  prose: 'Case-study typography on a 68ch measure',
  'architecture-diagram': 'Theme-aware inline SVG, breaks out of the measure',
  'author-byline': 'Standalone byline for QR arrivals',
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
await page.goto(`${DEV}/dev/components/`, { waitUntil: 'networkidle' });

// Every stylesheet the workbench uses, flattened so each preview stands alone.
const css = await page.evaluate(() =>
  [...document.styleSheets]
    .map((sheet) => {
      try {
        return [...sheet.cssRules].map((r) => r.cssText).join('\n');
      } catch {
        return '';
      }
    })
    .join('\n')
);

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, 'foundations'), { recursive: true });
await mkdir(path.join(OUT, 'components'), { recursive: true });
await mkdir(path.join(OUT, 'fonts'), { recursive: true });

/*
 * The workbench's CSS points at dev-server paths for both fonts and images, which resolve
 * nowhere outside this machine. Fonts are copied beside the previews and referenced
 * relatively; images are inlined as small data URIs. A preview that needs a running dev
 * server is not a preview.
 */
const FONTS = [
  ['inter.woff2', '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2'],
  [
    'jetbrains-mono.woff2',
    '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2',
  ],
];

for (const [name, spec] of FONTS) {
  const resolved = path.resolve('node_modules', spec);
  await copyFile(resolved, path.join(OUT, 'fonts', name));
}

/** Rewrites every @font-face src to the two files we copied. */
function localiseFonts(sheet) {
  return sheet
    .replace(
      /url\(["']?[^"')]*inter-latin-wght-normal\.woff2[^"')]*["']?\)/g,
      'url("../fonts/inter.woff2")'
    )
    .replace(
      /url\(["']?[^"')]*jetbrains-mono-latin-wght-normal\.woff2[^"')]*["']?\)/g,
      'url("../fonts/jetbrains-mono.woff2")'
    )
    // Drop every remaining webfont reference; the stacks fall back to system-ui.
    .replace(/@font-face\s*\{[^}]*url\(["']?\/(?:node_modules|@fs)[^}]*\}/g, '');
}

const inlineCache = new Map();

/** Fetches an image from the dev server and returns a small webp data URI. */
async function inlineImage(url) {
  if (inlineCache.has(url)) return inlineCache.get(url);
  const absolute = url.startsWith('http') ? url : `${DEV}${url}`;
  const response = await page.request.get(absolute);
  if (!response.ok()) return null;
  const webp = await sharp(await response.body())
    .resize({ width: 520, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();
  const uri = `data:image/webp;base64,${webp.toString('base64')}`;
  inlineCache.set(url, uri);
  return uri;
}

/** Replaces src/srcset on every <img> with an inlined copy, and drops srcset. */
async function inlineImages(html) {
  let out = html.replace(/\ssrcset="[^"]*"/g, '').replace(/\ssizes="[^"]*"/g, '');
  const srcs = [...out.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  for (const src of new Set(srcs)) {
    const uri = await inlineImage(src);
    if (uri) out = out.split(`src="${src}"`).join(`src="${uri}"`);
  }
  return out;
}

const localCss = localiseFonts(css);
const written = [];

for (const [heading, slug, group, width, height] of SECTIONS) {
  const html = await page.evaluate((h) => {
    const block = [...document.querySelectorAll('.block')].find(
      (b) => b.querySelector('h2')?.textContent?.trim() === h
    );
    if (!block) return null;
    const clone = block.cloneNode(true);
    clone.querySelector('h2')?.remove();
    return clone.innerHTML;
  }, heading);

  if (!html) {
    console.warn(`  ! workbench section not found, skipped: ${heading}`);
    continue;
  }

  const dir = group === 'Foundations' ? 'foundations' : 'components';
  const body = await inlineImages(html);
  const doc = `<!-- @dsCard group="${group}" -->
<!doctype html>
<html lang="en-US">
<head>
<meta charset="utf-8">
<title>${heading}</title>
<style>
${localCss}
/* Preview chrome: the page around the component, not part of the component. */
body { margin: 0; padding: 24px; background: var(--color-bg); }
.ds-preview { max-width: ${width}px; }
</style>
</head>
<body>
<div class="ds-preview">${body}</div>
</body>
</html>
`;

  await writeFile(path.join(OUT, dir, `${slug}.html`), doc, 'utf8');
  written.push({ slug, group, heading, dir, width, height });
  console.log(`  ${dir}/${slug}.html`);
}

await browser.close();

await copyFile('src/styles/tokens.css', path.join(OUT, 'tokens.css'));
await copyFile('DESIGN_HANDOFF.md', path.join(OUT, 'DESIGN_HANDOFF.md'));

await writeFile(
  path.join(OUT, 'README.md'),
  `# Portfolio design system — Abdul Kalam

Lifted from the live components at \`/dev/components\` on ${new Date().toISOString().slice(0, 10)}.
Every preview is the real rendered markup with the real stylesheet inlined, so nothing here
is a redrawing of the site — it is the site.

Read \`DESIGN_HANDOFF.md\` first. It covers what the site has to do, where the design is
weakest, and the constraint envelope: WCAG 2.2 AA with zero axe violations, a 30 KB
gzipped JS budget, both themes, a 320px floor, no UI kit, and no third-party scripts.

\`tokens.css\` is the single source of truth for colour, type, spacing, radii, and motion.
Components reference tokens and never literals — if a value is not a token, the token comes
first.

Previews default to the light theme. Add \`data-theme="dark"\` to the \`<html>\` element to
see the dark one; both are required to be correct.
`,
  'utf8'
);

await writeFile(
  path.join(OUT, 'manifest.json'),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      source: `${DEV}/dev/components/`,
      cards: written.map((w) => ({
        name: w.heading,
        subtitle: SUBTITLES[w.slug] ?? '',
        path: `${w.dir}/${w.slug}.html`,
        group: w.group,
        viewport: { width: w.width, height: w.height },
      })),
    },
    null,
    2
  ),
  'utf8'
);

console.log(`\n${written.length} previews + tokens.css + handoff → design-bundle/`);
