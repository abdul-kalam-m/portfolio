import { getCollection, type CollectionEntry } from 'astro:content';
import type { SectionSlug } from './sections';

export type Project = CollectionEntry<'projects'>;

/** Drafts never build in production (§6.4). They stay visible in `astro dev`. */
const includeDrafts = import.meta.env.DEV;

function sortProjects(a: Project, b: Project): number {
  const orderA = a.data.order ?? 100;
  const orderB = b.data.order ?? 100;
  if (orderA !== orderB) return orderA - orderB;
  if (a.data.year !== b.data.year) return b.data.year - a.data.year;
  return a.data.title.localeCompare(b.data.title);
}

/** Every publishable project, in display order. */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', ({ data }) => includeDrafts || data.draft !== true);
  return all.sort(sortProjects);
}

/** Projects whose primary section is `section` (§2.2: exactly one primary section each). */
export async function getProjectsInSection(section: SectionSlug): Promise<Project[]> {
  const all = await getProjects();
  return all.filter((project) => project.data.section === section);
}

/** Projects that mention `section` as a cross-section tag but live elsewhere (§2.2). */
export async function getCrossListedProjects(section: SectionSlug): Promise<Project[]> {
  const all = await getProjects();
  return all.filter(
    (project) => project.data.section !== section && project.data.alsoIn?.includes(section)
  );
}

/**
 * The home page's featured projects. §6.4 caps this at 3 site-wide; exceeding it is a
 * content error, so it fails the build rather than silently truncating.
 */
export async function getFeaturedProjects(): Promise<Project[]> {
  const all = await getProjects();
  const featured = all.filter((project) => project.data.featured === true);
  if (featured.length > 3) {
    throw new Error(
      `${featured.length} projects set featured: true — §6.4 allows at most 3. ` +
        `Offenders: ${featured.map((p) => p.id).join(', ')}`
    );
  }
  return featured;
}

export function projectHref(project: Project): string {
  return `/projects/${project.id}/`;
}

/** Human labels for the status badge (§3.1). Never color-only (§8.3). */
export const STATUS_LABELS: Record<string, string> = {
  live: 'Live',
  published: 'Published',
  'in-progress': 'In progress',
  planned: 'Planned',
  archived: 'Archived',
};
