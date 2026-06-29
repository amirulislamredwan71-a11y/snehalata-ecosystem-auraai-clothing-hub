import type { RequestHandler } from './$types';
import {
  SEED_VENDORS,
  SEED_PRODUCTS,
  mapVendorRow,
  mapProductRow,
  dedupeById,
  withTimeout
} from '$lib/seedCatalog';
import { fetchVendorsFromSupabase, fetchProductsFromSupabase } from '$lib/server/supabaseClient';

const SITE_URL = 'https://snehalata.com';

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/studio', priority: '0.7', changefreq: 'weekly' },
  { path: '/onboarding', priority: '0.7', changefreq: 'monthly' },
  { path: '/cart', priority: '0.3', changefreq: 'monthly' },
  { path: '/tracking', priority: '0.4', changefreq: 'monthly' },
  { path: '/legal', priority: '0.3', changefreq: 'yearly' }
];

export const GET: RequestHandler = async () => {
  let vendors = [...SEED_VENDORS];
  let products = [...SEED_PRODUCTS];

  const remote = await withTimeout(
    Promise.all([fetchVendorsFromSupabase(), fetchProductsFromSupabase()]),
    2500
  );
  if (remote) {
    const [vRes, pRes] = remote;
    if (vRes?.data?.length) vendors = dedupeById([...SEED_VENDORS, ...vRes.data.map(mapVendorRow)]);
    if (pRes?.data?.length) products = dedupeById([...SEED_PRODUCTS, ...pRes.data.map(mapProductRow)]);
  }

  const urls: string[] = [];
  for (const r of STATIC_ROUTES) {
    urls.push(
      `<url><loc>${SITE_URL}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
    );
  }
  for (const v of vendors) {
    if (v.status === 'BLOCKED' || !v.slug) continue;
    urls.push(
      `<url><loc>${SITE_URL}/store/${encodeURIComponent(v.slug)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    );
  }
  for (const p of products) {
    urls.push(
      `<url><loc>${SITE_URL}/try-on/${p.id}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>`
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=0, s-maxage=3600'
    }
  });
};
