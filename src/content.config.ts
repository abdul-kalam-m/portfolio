import { defineCollection } from 'astro:content';
// Re-exported `z` from 'astro:content' is deprecated in Astro 7.
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Project content schema (§6.4), enforced at build time. Build MUST fail on violations.
 *
 * Adding a project = adding one MDX file + assets; no page code changes.
 */

/** Controlled tag vocabulary (§6.5). This enum IS the vocabulary's home — extend it here. */
export const TAGS = [
  'gis',
  'spatial-statistics',
  'cartography',
  'remote-sensing',
  'climate',
  'flood',
  'heat',
  'housing',
  'census',
  'data-pipeline',
  'reproducible-research',
  'dashboard',
  'llm-agents',
  'machine-learning',
  'urban-design',
  'planning',
  'policy',
  'python',
  'javascript',
  'webgl',
] as const;

/**
 * `planned` extends the §6.4 enum. Four projects (FloodScope, Jurisdiction Intelligence OS,
 * and the two NJ dashboards) are fully specified in committed build guides but have zero
 * code — `in-progress` would overstate them. See DECISIONS.md, 2026-08-06.
 */
export const STATUSES = ['live', 'published', 'in-progress', 'planned', 'archived'] as const;

export const TIERS = ['flagship', 'standard', 'gallery'] as const;

const statSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  /**
   * `true` marks a scope or target figure rather than a measured result.
   * Mandatory on every stat of a `planned` project — §13.6 forbids presenting an
   * intention as an outcome. Renders with an explicit "scope" affordance.
   */
  scope: z.boolean().optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(60),
        hook: z
          .string()
          .max(120)
          .refine((value) => /\d/.test(value), {
            message: 'hook must contain a digit — numbers over adjectives (§1.4)',
          }),
        section: z.enum(['geospatial', 'data-ai', 'urban-design']),
        tier: z.enum(TIERS),
        year: z.number().int().min(2015).max(2100),
        status: z.enum(STATUSES),
        tags: z.array(z.enum(TAGS)).min(1),
        stats: z.array(statSchema).max(4).optional(),
        thumbnail: image(),
        thumbnailAlt: z.string().min(1),
        links: z
          .object({
            repo: z.string().url().optional(),
            demo: z.string().url().optional(),
            paper: z.string().url().optional(),
            poster: z.string().url().optional(),
            /** Internal route for a self-hosted tool under /labs/ (§7.4). */
            lab: z.string().startsWith('/').optional(),
            /** Path to the committed build guide this project is specified by. */
            guide: z.string().optional(),
          })
          .optional(),
        /** Max 3 projects site-wide may set this (§6.4) — enforced in src/lib/projects.ts. */
        featured: z.boolean().optional(),
        draft: z.boolean().optional(),
        /** Cross-section tags: sections this project also speaks to (§2.2). */
        alsoIn: z.array(z.enum(['geospatial', 'data-ai', 'urban-design'])).optional(),
        /** One honest sentence shown on every `planned` project. Required for them. */
        plannedNote: z.string().optional(),
        /** Sort weight within a section index; lower sorts first. */
        order: z.number().optional(),
      })
      .superRefine((data, ctx) => {
        // §6.4: 3–4 stat tiles for tiers >= standard. Gallery items may omit them.
        if (data.tier !== 'gallery') {
          if (!data.stats || data.stats.length < 3) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['stats'],
              message: `tier "${data.tier}" requires 3–4 stats (§6.4)`,
            });
          }
        }

        // §13.6: a project with no implementation cannot present measured results.
        if (data.status === 'planned') {
          if (!data.plannedNote) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['plannedNote'],
              message: 'planned projects must state plainly that they are not built yet',
            });
          }
          const unscoped = (data.stats ?? []).filter((stat) => stat.scope !== true);
          if (unscoped.length > 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['stats'],
              message:
                `every stat on a planned project must set scope: true — ` +
                `"${unscoped[0]!.label}" does not (§13.6: no fabricated results)`,
            });
          }
        }
      }),
});

export const collections = { projects };
