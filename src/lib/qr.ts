import QRCode, { type QRCodeToStringOptions } from 'qrcode';
import { absoluteUrl } from './site';

/**
 * QR generation (§9).
 *
 * - Error correction level Q, so a code survives print wear and partial occlusion (§9.4).
 * - `margin: 4` preserves the standard 4-module quiet zone (§9.4).
 * - Always black on white, in both themes: a re-themed QR is a QR that fails to scan.
 * - Encodes the canonical production URL, never a preview URL (§9.1).
 */
const QR_OPTIONS: QRCodeToStringOptions = {
  errorCorrectionLevel: 'Q',
  type: 'svg',
  margin: 4,
  color: { dark: '#000000ff', light: '#ffffffff' },
};

/** SVG markup for a site-relative path, ready to inline. */
export async function qrSvgForPath(path: string): Promise<string> {
  return qrSvgForUrl(absoluteUrl(path));
}

/** SVG markup for an arbitrary absolute URL. */
export async function qrSvgForUrl(url: string): Promise<string> {
  return QRCode.toString(url, QR_OPTIONS);
}

/**
 * Strips the XML prolog and fixed width/height so the SVG scales to its container.
 * The viewBox is preserved, so the module grid and quiet zone are untouched.
 */
export function inlineQr(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*\?>/, '')
    .replace(/<svg([^>]*)\swidth="[^"]*"/, '<svg$1')
    .replace(/<svg([^>]*)\sheight="[^"]*"/, '<svg$1')
    .replace('<svg', '<svg role="img" aria-hidden="true" focusable="false"')
    .trim();
}
