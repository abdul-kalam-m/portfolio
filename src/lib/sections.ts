/**
 * The three portfolio sections (§2.2).
 *
 * LOCKED by §13.5.1: names, order, and slugs may not change without the owner's
 * explicit approval. Order is Geospatial Intelligence → Data Engineering & Applied AI
 * → Urban Design & Climate Resilience, everywhere: nav, home, footer (§2.2).
 */

export type SectionSlug = 'geospatial' | 'data-ai' | 'urban-design';

export interface Section {
  slug: SectionSlug;
  name: string;
  /** Shortened form for nav bars at narrow widths. */
  navName: string;
  href: string;
  /** 2–3 sentence section intro tying it to the core narrative (§2.2). */
  intro: string;
  /** ≤ 155 chars, used as the section index meta description (§8.2). */
  description: string;
}

export const SECTIONS: readonly Section[] = [
  {
    slug: 'geospatial',
    name: 'Geospatial Intelligence',
    navName: 'Geospatial',
    href: '/geospatial/',
    intro:
      'Spatial analysis that ends in a decision, not a map for its own sake. Parcel-, tract-, and municipality-scale work on flood exposure and hazard vulnerability, built so the numbers can be traced back to the source layer and the vintage that produced them.',
    description:
      'Spatial analysis and GIS work: flood exposure, hazard vulnerability, and multi-scale geospatial pipelines across New Jersey.',
  },
  {
    slug: 'data-ai',
    name: 'Data Engineering & Applied AI',
    navName: 'Data & AI',
    href: '/data-ai/',
    intro:
      'Pipelines and AI systems that are checkable. An LLM cartography agent whose every numeric decision passes a deterministic statistical gate, a live climate dashboard with no backend, and permitting-data infrastructure designed around a measured evaluation set.',
    description:
      'Reproducible data pipelines, live dashboards, and AI systems with deterministic validation — built to be audited, not just demoed.',
  },
  {
    slug: 'urban-design',
    name: 'Urban Design & Climate Resilience',
    navName: 'Urban Design',
    href: '/urban-design/',
    intro:
      'Planning and urban design work where climate adaptation is the brief, not an afterthought. Studio and professional projects covering resilience strategy, public space, and the physical form that follows from a risk map.',
    description:
      'Urban planning and design work on climate resilience: adaptation strategy, public space, and the built form that follows a risk map.',
  },
] as const;

const SECTION_BY_SLUG = new Map(SECTIONS.map((section) => [section.slug, section]));

export function getSection(slug: SectionSlug): Section {
  const section = SECTION_BY_SLUG.get(slug);
  if (!section) throw new Error(`Unknown section slug: ${slug}`);
  return section;
}
