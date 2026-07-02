import { adminClient } from '$lib/server/vendorSync';
import { SEED_STATS, mapProductRow } from '$lib/seedCatalog';
import type { EcosystemStats, Product } from '$lib/types';

// Neural Grid A1 — real ecosystem numbers from live data, with graceful seed fallback.
// Cheap COUNT(head) queries; Supabase returns { count, error } (never throws) so a
// not-yet-migrated `events` table just yields count=null → we fall back per-field.
// trendForecast stays curated until A7 (data-driven trends).
export async function getRealStats(): Promise<EcosystemStats> {
  try {
    const a = adminClient();
    const [vendorsC, productsC, eventsC, ordersRes] = await Promise.all([
      a.from('vendors').select('id', { count: 'exact', head: true }).ilike('status', 'approved'),
      a.from('products').select('id', { count: 'exact', head: true }).or('is_active.is.null,is_active.eq.true'),
      a.from('events').select('id', { count: 'exact', head: true }),
      a.from('orders').select('total')
    ]);

    const totalVendors = vendorsC.count ?? SEED_STATS.totalVendors;
    const activeProducts = productsC.count ?? SEED_STATS.activeProducts;
    const aiInteractions = eventsC.count ?? SEED_STATS.aiInteractions;
    const monthlyVolume =
      (ordersRes.data || []).reduce((s: number, o: any) => s + Number(o.total || 0), 0) ||
      SEED_STATS.monthlyVolume;

    return {
      totalVendors,
      activeProducts,
      monthlyVolume,
      aiInteractions,
      trendForecast: SEED_STATS.trendForecast
    };
  } catch {
    return SEED_STATS;
  }
}

// Neural Grid A7 — real trending products, ranked by the live trend_score
// (views + 3·add_to_cart + 8·purchases) aggregated in product_stats. Empty array
// until the Grid has signal, so callers can conditionally render the rail.
export async function getTrending(limit = 8): Promise<Product[]> {
  try {
    const a = adminClient();
    const { data: stats } = await a
      .from('product_stats')
      .select('product_id,trend_score')
      .gt('trend_score', 0)
      .order('trend_score', { ascending: false })
      .limit(limit);

    const ids = (stats || []).map((s: any) => s.product_id).filter((x: any) => x != null);
    if (!ids.length) return [];

    const { data: prods } = await a
      .from('products')
      .select('*')
      .in('id', ids)
      .or('is_active.is.null,is_active.eq.true');

    const byId = new Map((prods || []).map((p: any) => [p.id, p]));
    // Preserve trend order (the .in() query doesn't guarantee it).
    return ids.map((id: any) => byId.get(id)).filter(Boolean).map(mapProductRow);
  } catch {
    return [];
  }
}
