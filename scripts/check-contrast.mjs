/**
 * Verify every declared token pair against WCAG 2.2 AA (§4.2, §8.3).
 *
 * Source:  src/styles/tokens.css — values are parsed from the file, not duplicated here,
 *          so a token edit that breaks contrast fails this check rather than shipping.
 * Output:  stdout table; exit code 1 on any failure.
 *
 *   node scripts/check-contrast.mjs
 */
import { readFile } from 'node:fs/promises';

const AA_TEXT = 4.5;
const AA_LARGE = 3.0;
const AA_NON_TEXT = 3.0;

const css = await readFile('src/styles/tokens.css', 'utf8');

/**
 * Pulls `--name: #hex;` declarations out of the block opened by `startMarker`.
 * Brace-matched rather than indentation-matched — the dark overrides are nested inside
 * `@layer base`, and an indentation heuristic silently reads the wrong block.
 */
function parseBlock(startMarker) {
  const start = css.indexOf(startMarker);
  if (start === -1) throw new Error(`marker not found: ${startMarker}`);
  let depth = 0;
  let i = start + startMarker.length - 1;
  const open = i;
  do {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') depth -= 1;
    i += 1;
  } while (depth > 0 && i < css.length);

  const body = css.slice(open, i);
  const out = {};
  for (const [, name, hex] of body.matchAll(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[name] = hex;
  }
  return out;
}

const light = parseBlock('@theme {');
const dark = { ...light, ...parseBlock(":root[data-theme='dark'] {") };

const srgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
};

const luminance = (hex) => {
  const [r, g, b] = srgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const ratio = (a, b) => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Every pair that actually appears in the UI. Add a row when you add a pairing. */
const PAIRS = [
  ['--color-text', '--color-bg', AA_TEXT, 'body text on page background'],
  ['--color-text', '--color-surface', AA_TEXT, 'body text on card'],
  ['--color-text', '--color-surface-2', AA_TEXT, 'body text on inset surface'],
  ['--color-text-muted', '--color-bg', AA_TEXT, 'muted text on page background'],
  ['--color-text-muted', '--color-surface', AA_TEXT, 'muted text on card'],
  ['--color-text-muted', '--color-surface-2', AA_TEXT, 'muted text on inset surface'],
  ['--color-text-subtle', '--color-bg', AA_TEXT, 'subtle text on page background'],
  ['--color-text-subtle', '--color-surface', AA_TEXT, 'subtle text on card'],
  ['--color-text-subtle', '--color-surface-2', AA_TEXT, 'subtle text on inset surface'],
  ['--color-accent', '--color-bg', AA_TEXT, 'link on page background'],
  ['--color-accent', '--color-surface', AA_TEXT, 'link on card'],
  ['--color-accent', '--color-surface-2', AA_TEXT, 'link on inset surface'],
  ['--color-accent-contrast', '--color-accent', AA_TEXT, 'button label on accent fill'],
  ['--color-accent', '--color-accent-soft', AA_TEXT, 'accent text on accent tint'],
  ['--color-heat', '--color-bg', AA_TEXT, 'alert text on page background'],
  ['--color-border-strong', '--color-bg', AA_NON_TEXT, 'control border on background'],
  ['--color-border-strong', '--color-surface', AA_NON_TEXT, 'control border on card'],
  ['--color-border-strong', '--color-surface-2', AA_NON_TEXT, 'control border on inset surface'],
  ['--color-focus', '--color-bg', AA_NON_TEXT, 'focus ring on background'],
  ['--color-focus', '--color-surface', AA_NON_TEXT, 'focus ring on card'],
  ['--color-focus', '--color-surface-2', AA_NON_TEXT, 'focus ring on inset surface'],
];

let failed = 0;
for (const [themeName, tokens] of [
  ['light', light],
  ['dark', dark],
]) {
  console.log(`\n${themeName.toUpperCase()}`);
  for (const [fg, bg, min, label] of PAIRS) {
    const a = tokens[fg];
    const b = tokens[bg];
    if (!a || !b) {
      console.log(`  SKIP  ${label} — ${!a ? fg : bg} not defined`);
      continue;
    }
    const r = ratio(a, b);
    const ok = r >= min;
    if (!ok) failed += 1;
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (needs ${min})  ${label}  ${a} on ${b}`
    );
  }
}

// AA_LARGE is referenced so the constant stays meaningful if a large-text pair is added.
void AA_LARGE;

if (failed > 0) {
  console.error(
    `\n${failed} token pair(s) below WCAG 2.2 AA — §8.4 budgets may be tightened, never loosened.`
  );
  process.exit(1);
}
console.log('\nAll token pairs pass WCAG 2.2 AA.');
