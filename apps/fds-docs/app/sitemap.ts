import type { MetadataRoute } from 'next';
import { loadGuides, loadShowcase } from '../src/content';

export const dynamic = 'force-static';

const BASE = 'https://fds.sitebefy.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/` },
    { url: `${BASE}/why/` },
    { url: `${BASE}/tokens/` },
    { url: `${BASE}/accessibility/` },
    { url: `${BASE}/example/` },
    { url: `${BASE}/showcase/` },
    { url: `${BASE}/recipes/` },
    { url: `${BASE}/packs/` },
    { url: `${BASE}/playground/` },
    ...loadShowcase().items.map((it) => ({ url: `${BASE}/showcase/${it.slug}/` })),
    ...loadGuides().map((g) => ({ url: `${BASE}/guides/${g.slug}/` })),
  ];
}
