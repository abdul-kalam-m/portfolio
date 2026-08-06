/**
 * Site-wide constants. Owner identity and contact are §13.5-protected — do not edit
 * without the owner's explicit approval.
 */

/**
 * Canonical production origin, no trailing slash.
 *
 * Sourced from `astro.config.mjs` (`site`), which reads `SITE_URL` from the build
 * environment. QR codes encode this value (§9.1) — a build with the wrong SITE_URL
 * produces QR codes that are wrong forever once printed.
 */
export const SITE_URL: string = (import.meta.env.SITE ?? 'https://abdulkalam.pages.dev').replace(
  /\/$/,
  ''
);

export const OWNER = {
  name: 'Abdul Kalam',
  fullName: 'Abdul Kalam Azad Mustaq',
  role: 'Urbanist & geospatial analyst',
  /* From OPERATING_GUIDE.md §0, canonical per §13.5.3. Confirmed by owner 2026-08-06. */
  email: 'ar.abdulkalam.mustaq@gmail.com',
  github: 'https://github.com/abdul-kalam-m',
  linkedin: 'https://www.linkedin.com/in/abdul-kalam-m',
  location: 'New Brunswick, New Jersey',
  repo: 'https://github.com/abdul-kalam-m/portfolio',
} as const;

/** The core narrative (§1.3) — locked verbatim by §13.5.3. */
export const NARRATIVE = {
  line: 'I turn climate and urban data into decisions.',
  body: 'From flood-finance atlases and heat dashboards to AI agents that make maps, my work connects spatial analysis, reproducible data pipelines, and urban design into evidence people can act on.',
} as const;

/** Résumé asset. Filename convention: AbdulKalam_Resume_YYYY-MM.pdf (§8.1). */
export const RESUME = {
  href: '/files/AbdulKalam_Resume_2026-08.pdf',
  label: 'Résumé (PDF, 2 pages)',
  /* Owner-provided 2026-08-04, converted from AbdulKalam_Resume.docx (§13.5.7). */
  variant: 'GIS Specialist',
} as const;

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
