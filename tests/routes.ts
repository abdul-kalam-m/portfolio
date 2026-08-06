/** Every route the site publishes (§2.1), shared by the e2e and a11y suites. */
export const PROJECT_SLUGS = [
  'autocarto-agent',
  'india-urban-heat-dashboard',
  'nj-parcel-flood-risk',
  'nj-hazard-vulnerability',
  'floodscope',
  'jurisdiction-intelligence-os',
  'adyar-basin-vision-framework',
  'woodbridge-flood-vulnerability',
  'pedestrian-crash-rates-manhattan',
  'kosasthalaiyar-sponge-city',
  'tsuce-smart-urbanization',
  'chennai-lakefront-restore-connect-engage',
] as const;

export const SECTION_ROUTES = ['/geospatial/', '/data-ai/', '/urban-design/'] as const;

export const ROUTES = [
  '/',
  ...SECTION_ROUTES,
  ...PROJECT_SLUGS.map((slug) => `/projects/${slug}/`),
  '/about/',
  '/resume/',
  '/contact/',
  '/404.html',
] as const;

/** Projects with no implementation — these must never show a measured result (§13.6). */
export const PLANNED_SLUGS = [
  'nj-parcel-flood-risk',
  'nj-hazard-vulnerability',
  'floodscope',
  'jurisdiction-intelligence-os',
] as const;
