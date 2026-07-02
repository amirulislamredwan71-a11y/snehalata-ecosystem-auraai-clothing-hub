import { adminClient } from '$lib/server/vendorSync';
import { SEED_STATS } from '$lib/seedCatalog';
import type { EcosystemStats } from '$lib/types';

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
