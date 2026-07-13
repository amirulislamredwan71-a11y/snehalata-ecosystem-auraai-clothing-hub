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
    // Truncate description to a short snippet — cards/modal never render it; only the home
    // JSON-LD + Aura use a snippet. Full description stays on the SSR /product/[id] page.
    // This alone cut the payload from ~1 MB to ~250 KB (478 products).
    const products = (pRes.data || []).map((p: any) => ({
      ...p,
      description: p.description ? String(p.description).slice(0, 140) : p.description
    }));
    return json(
      {
        ok: true,
        products,
        vendors: vRes.data || [],
        categories: cRes.data || []
      },
      {
        // Edge-cache the catalog longer so sparse launch traffic keeps it warm (fewer 3–4s
        // cold renders). Edits propagate within ~10 min; Aura/admin refresh still works.
        headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
      }
    );
  } catch {
    return json({ ok: false, products: [], vendors: [], categories: [] });
  }
};
