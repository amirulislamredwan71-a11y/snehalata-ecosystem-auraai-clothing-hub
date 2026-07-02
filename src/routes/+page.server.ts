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
import { getRealStats } from '$lib/server/stats';

// Render the storefront on the server so crawlers, link unfurlers and the first
// paint all see real products instead of an empty grid. Supabase rows (when the
// Neural Grid is configured) are merged on top of the seed catalog; if Supabase
// is slow or unavailable we degrade gracefully to the seed catalog within ~2.5s.
export const load: PageServerLoad = async () => {
  let vendors = [...SEED_VENDORS];
  let products = [...SEED_PRODUCTS];

  const [remote, stats] = await Promise.all([
    withTimeout(
      Promise.all([fetchVendorsFromSupabase(), fetchProductsFromSupabase()]),
      2500
    ),
    withTimeout(getRealStats(), 2500)
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

  return { products, vendors, stats: stats ?? SEED_STATS };
};
