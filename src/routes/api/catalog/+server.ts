import { json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

// Public read-only storefront catalog. The project's legacy anon key is disabled,
// so the browser can't read Supabase directly — it reads live products/vendors
// through this service_role-backed endpoint instead (only storefront-safe rows).
export const GET: RequestHandler = async () => {
  try {
    const a = adminClient();
    const [pRes, vRes, cRes] = await Promise.all([
      // NEVER select the `embedding` vector here — it's server-only (semantic search)
      // and shipping it made this endpoint multi-second. Storefront columns only.
      a
        .from('products')
        .select('id,name,price,category,image_url,description,stock_quantity,vendor_id,is_active,created_at,moderation_score')
        .or('is_active.is.null,is_active.eq.true'),
      a.from('vendors').select('*'),
      a.from('categories').select('*')
    ]);
    return json(
      {
        ok: true,
        products: pRes.data || [],
        vendors: vRes.data || [],
        categories: cRes.data || []
      },
      {
        // Edge-cache the catalog: near-instant for visitors, revalidates in the
        // background. Product edits propagate within ~2 min (the DB stays source of truth).
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600' }
      }
    );
  } catch {
    return json({ ok: false, products: [], vendors: [], categories: [] });
  }
};
