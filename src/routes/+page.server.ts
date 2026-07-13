import type { PageServerLoad } from './$types';
import {
  SEED_VENDORS,
  SEED_PRODUCTS,
  SEED_STATS,
  mapVendorRow,
  mapProductRow,
  dedupeById,
  withTimeout
} from '$lib/seedCatalog';
import { fetchVendorsFromSupabase, fetchProductsFromSupabase } from '$lib/server/supabaseClient';
import { getRealStats, getTrending } from '$lib/server/stats';

// Render the storefront on the server so crawlers, link unfurlers and the first
// paint all see real products instead of an empty grid. Supabase rows (when the
// Neural Grid is configured) are merged on top of the seed catalog; if Supabase
// is slow or unavailable we degrade gracefully to the seed catalog within ~2.5s.
export const load: PageServerLoad = async ({ setHeaders }) => {
  // Edge-cache the SSR home so repeat/first visits are served from the CDN in ~ms
  // instead of waiting on the ~2.5s Supabase reads. Revalidates in the background.
  setHeaders({ 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' });

  let vendors = [...SEED_VENDORS];
  let products = [...SEED_PRODUCTS];

  const [remote, stats, trending] = await Promise.all([
    withTimeout(
      Promise.all([fetchVendorsFromSupabase(), fetchProductsFromSupabase()]),
      2500
    ),
    withTimeout(getRealStats(), 2500),
    withTimeout(getTrending(8), 2500)
  ]);

  if (remote) {
    const [vendorRes, productRes] = remote;
    if (vendorRes?.data?.length) {
      vendors = dedupeById([...SEED_VENDORS, ...vendorRes.data.map(mapVendorRow)]);
    }
    if (productRes?.data?.length) {
      // DB (Neural Grid) is the source of truth for products; seed is fallback only.
      products = dedupeById(productRes.data.map(mapProductRow));
    }
  }

  // Lighter first paint: put the featured brand first, cap the SSR grid, and truncate
  // long Bengali descriptions (kept full for SEO/JSON-LD via the first cards). The client
  // (`getProducts()` on mount) refills the FULL catalog + full descriptions right after
  // hydration, so nothing is lost — this only shrinks the initial HTML/hydration payload.
  const totalProducts = products.length;
  const featuredIds = new Set(vendors.filter((v) => v.slug === 'panjabi-kuthir').map((v) => v.id));
  const ssrProducts = [...products]
    .sort((a, b) => (featuredIds.has(b.vendorId) ? 1 : 0) - (featuredIds.has(a.vendorId) ? 1 : 0))
    .slice(0, 40)
    .map((p) => ({ ...p, description: (p.description || '').slice(0, 140) }));

  return { products: ssrProducts, vendors, stats: stats ?? SEED_STATS, trending: trending ?? [], totalProducts };
};
