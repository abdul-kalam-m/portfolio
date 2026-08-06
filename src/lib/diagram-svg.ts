import type { Diagram } from './diagrams';

/**
 * Renders a Diagram to standalone SVG markup.
 *
 * Shared by the page component (inline, theme-aware via CSS custom properties) and by
 * scripts/generate-diagram-thumbnails.mjs (rasterised with explicit colors), so the card
 * image and the page can never drift apart.
 */

export interface DiagramColors {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
}

/** Uses the live tokens so the inline diagram re-themes with the page (§4.1). */
export const TOKEN_COLORS: DiagramColors = {
  bg: 'transparent',
  surface: 'var(--color-surface)',
  border: 'var(--color-border-strong)',
  text: 'var(--color-text)',
  muted: 'var(--color-text-muted)',
  accent: 'var(--color-accent)',
};

const WIDTH = 1000;
const PAD = 28;
const LANE_LABEL_H = 30;
const BOX_MIN_H = 52;
const BOX_GAP = 12;
const LANE_GAP = 40;
const ARROW_H = LANE_GAP;
const CHAR_W = 6.1;
const DETAIL_CHAR_W = 5.2;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy wrap by estimated advance width; good enough for short diagram labels. */
function wrap(text: string, maxWidth: number, charWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length * charWidth > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * A 1200x630 card reduction of the same diagram.
 *
 * The full diagram is unreadable at the ~185px a grid card gets — thin strokes and 11px
 * labels vanish, and the card reads as blank. This draws the same lanes as bands with only
 * the lane name and stage count, at a size that survives the reduction. It is the same
 * architecture, told at lower resolution — not different information.
 */
export function renderDiagramCard(diagram: Diagram, title: string, colors: DiagramColors): string {
  const W = 1200;
  const H = 630;
  const PAD_X = 72;
  const TOP = 150;
  const BOTTOM = 72;
  const lanes = diagram.lanes;
  const gap = 22;
  const bandH = (H - TOP - BOTTOM - gap * (lanes.length - 1)) / lanes.length;

  const bands = lanes
    .map((lane, i) => {
      const y = TOP + i * (bandH + gap);
      const count = lane.stages.length;
      const cellGap = 12;
      const cellW = (W - PAD_X * 2 - cellGap * (count - 1)) / count;

      const cells = lane.stages
        .map((_, j) => {
          const x = PAD_X + j * (cellW + cellGap);
          return `<rect x="${x.toFixed(1)}" y="${(y + 34).toFixed(1)}" width="${cellW.toFixed(1)}" height="${(bandH - 34).toFixed(1)}" rx="5" fill="${colors.surface}" stroke="${colors.border}" stroke-width="1.5"/>`;
        })
        .join('');

      return `${cells}
<text x="${PAD_X}" y="${(y + 20).toFixed(1)}" fill="${colors.muted}" font-family="Inter Variable, system-ui, sans-serif" font-size="19" font-weight="620" letter-spacing="1.4">${esc(lane.name.toUpperCase())}</text>`;
    })
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)} — system architecture">
<rect width="${W}" height="${H}" fill="${colors.bg}"/>
<rect x="${PAD_X}" y="56" width="96" height="7" rx="3.5" fill="${colors.accent}"/>
<text x="${PAD_X}" y="112" fill="${colors.text}" font-family="Inter Variable, system-ui, sans-serif" font-size="42" font-weight="640" letter-spacing="-0.6">${esc(title)}</text>
${bands}
<text x="${PAD_X}" y="${H - 32}" fill="${colors.muted}" font-family="Inter Variable, system-ui, sans-serif" font-size="20">Specified, not yet built — architecture from the project&#8217;s build guide</text>
</svg>`;
}

export function renderDiagramSvg(diagram: Diagram, colors: DiagramColors = TOKEN_COLORS): string {
  const innerWidth = WIDTH - PAD * 2;
  const parts: string[] = [];
  let y = PAD;

  diagram.lanes.forEach((lane, laneIndex) => {
    parts.push(
      `<text x="${PAD}" y="${y + 12}" class="lane-name">${esc(lane.name)}</text>`,
      lane.note ? `<text x="${PAD}" y="${y + 26}" class="lane-note">${esc(lane.note)}</text>` : ''
    );
    y += lane.note ? LANE_LABEL_H + 8 : LANE_LABEL_H;

    const count = lane.stages.length;
    const boxWidth = (innerWidth - BOX_GAP * (count - 1)) / count;
    const textWidth = boxWidth - 24;

    const laid = lane.stages.map((stage) => {
      const labelLines = wrap(stage.label, textWidth, CHAR_W);
      const detailLines = stage.detail ? wrap(stage.detail, textWidth, DETAIL_CHAR_W) : [];
      const height = Math.max(BOX_MIN_H, 22 + labelLines.length * 16 + detailLines.length * 14);
      return { labelLines, detailLines, height };
    });
    const laneHeight = Math.max(...laid.map((l) => l.height));

    laid.forEach((box, i) => {
      const x = PAD + i * (boxWidth + BOX_GAP);
      parts.push(
        `<rect x="${x}" y="${y}" width="${boxWidth.toFixed(1)}" height="${laneHeight}" rx="6" class="box"/>`
      );
      let ty = y + 22;
      for (const line of box.labelLines) {
        parts.push(`<text x="${x + 12}" y="${ty}" class="box-label">${esc(line)}</text>`);
        ty += 16;
      }
      ty += box.detailLines.length ? 2 : 0;
      for (const line of box.detailLines) {
        parts.push(`<text x="${x + 12}" y="${ty}" class="box-detail">${esc(line)}</text>`);
        ty += 14;
      }
    });

    y += laneHeight;

    if (laneIndex < diagram.lanes.length - 1) {
      const cx = WIDTH / 2;
      parts.push(
        `<line x1="${cx}" y1="${y + 10}" x2="${cx}" y2="${y + ARROW_H - 14}" class="arrow"/>`,
        `<path d="M ${cx - 5} ${y + ARROW_H - 16} L ${cx} ${y + ARROW_H - 8} L ${cx + 5} ${y + ARROW_H - 16} Z" class="arrow-head"/>`
      );
      y += ARROW_H;
    }
  });

  const height = y + PAD;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" width="${WIDTH}" height="${height}" role="img" aria-label="${esc(diagram.caption)}">
<style>
  .box { fill: ${colors.surface}; stroke: ${colors.border}; stroke-width: 1; }
  .box-label { fill: ${colors.text}; font: 600 13px 'Inter Variable', ui-sans-serif, system-ui, sans-serif; }
  .box-detail { fill: ${colors.muted}; font: 400 11px 'Inter Variable', ui-sans-serif, system-ui, sans-serif; }
  .lane-name { fill: ${colors.text}; font: 620 12px 'Inter Variable', ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.06em; text-transform: uppercase; }
  .lane-note { fill: ${colors.muted}; font: 400 11px 'Inter Variable', ui-sans-serif, system-ui, sans-serif; }
  .arrow { stroke: ${colors.accent}; stroke-width: 1.5; }
  .arrow-head { fill: ${colors.accent}; }
</style>
${colors.bg === 'transparent' ? '' : `<rect width="${WIDTH}" height="${height}" fill="${colors.bg}"/>`}
${parts.filter(Boolean).join('\n')}
</svg>`;
}
