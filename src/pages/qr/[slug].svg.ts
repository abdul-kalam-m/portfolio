import type { APIRoute, GetStaticPaths } from 'astro';
import { getProjects, projectHref } from '../../lib/projects';
import { qrSvgForPath } from '../../lib/qr';

/**
 * One downloadable SVG QR per project page, plus the site root and the resume (§9.1).
 * Generated at build time and served from /qr/<slug>.svg.
 */

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await getProjects();
  return [
    { params: { slug: 'site' }, props: { path: '/' } },
    { params: { slug: 'resume' }, props: { path: '/resume/' } },
    ...projects.map((project) => ({
      params: { slug: project.id },
      props: { path: projectHref(project) },
    })),
  ];
};

export const GET: APIRoute = async ({ props }) => {
  const svg = await qrSvgForPath((props as { path: string }).path);
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
