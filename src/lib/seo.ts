import { OWNER, SITE_URL, absoluteUrl, NARRATIVE } from './site';
import { SECTIONS } from './sections';

/**
 * Metadata generation (§8.2). Unique title (≤ 60 chars) and description (≤ 155 chars)
 * per page; Open Graph + Twitter cards everywhere; JSON-LD where §8.2 requires it.
 *
 * QR-shared pages are judged by their link preview — OG images are a deliverable (§8.2).
 */

const SITE_NAME = `${OWNER.name} — ${OWNER.role}`;

export interface SeoInput {
  title: string;
  description: string;
  /** Site-relative path of the current page, e.g. `/projects/autocarto-agent/`. */
  path: string;
  /** Site-relative OG image path (1200×630). Defaults to the site card. */
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
}

export interface SeoOutput {
  title: string;
  description: string;
  canonical: string;
  image: string;
  imageAlt: string;
  type: 'website' | 'article';
  siteName: string;
}

export function buildSeo(input: SeoInput): SeoOutput {
  const title = input.title.length > 60 ? `${input.title.slice(0, 57).trimEnd()}…` : input.title;
  const description =
    input.description.length > 155
      ? `${input.description.slice(0, 152).trimEnd()}…`
      : input.description;

  return {
    title,
    description,
    canonical: absoluteUrl(input.path),
    image: absoluteUrl(input.image ?? '/og/site.png'),
    imageAlt: input.imageAlt ?? `${OWNER.name} — ${NARRATIVE.line}`,
    type: input.type ?? 'website',
    siteName: SITE_NAME,
  };
}

/** `Person` JSON-LD for home and about (§8.2). */
export function personJsonLd(): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: OWNER.fullName,
    alternateName: OWNER.name,
    url: SITE_URL,
    email: `mailto:${OWNER.email}`,
    jobTitle: OWNER.role,
    description: NARRATIVE.body,
    sameAs: [OWNER.github, OWNER.linkedin],
    knowsAbout: [
      'Geographic information systems',
      'Spatial statistics',
      'Climate resilience planning',
      'Data engineering',
      'Applied artificial intelligence',
      'Urban design',
    ],
  });
}

export interface CreativeWorkInput {
  title: string;
  description: string;
  path: string;
  year: number;
  image: string;
  keywords: string[];
  /** Present when the project has an associated paper or poster. */
  scholarly?: boolean;
}

/** `CreativeWork` / `ScholarlyArticle` JSON-LD on project pages (§8.2). */
export function creativeWorkJsonLd(input: CreativeWorkInput): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': input.scholarly ? 'ScholarlyArticle' : 'CreativeWork',
    headline: input.title,
    name: input.title,
    description: input.description,
    url: absoluteUrl(input.path),
    image: absoluteUrl(input.image),
    datePublished: String(input.year),
    keywords: input.keywords.join(', '),
    author: {
      '@type': 'Person',
      name: OWNER.fullName,
      url: SITE_URL,
    },
  });
}

export interface Crumb {
  name: string;
  href: string;
}

/** `BreadcrumbList` JSON-LD on project pages (§8.2). */
export function breadcrumbJsonLd(crumbs: Crumb[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.href),
    })),
  });
}

export const SECTION_NAV = SECTIONS;
