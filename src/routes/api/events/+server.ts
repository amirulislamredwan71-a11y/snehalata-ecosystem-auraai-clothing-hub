import { json } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

const TYPES = new Set(['view', 'search', 'add_to_cart', 'purchase', 'try_on']);

// Neural Grid A1 — ingest batched client events. ALWAYS returns 200 so the client
// tracker never surfaces errors; if the Grid tables aren't migrated yet (or Supabase
// is unreachable) we degrade silently and drop the batch.
export const POST: RequestHandler = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ ok: true, ingested: 0 });
  }

  const raw = Array.isArray(body?.events) ? body.events : [];
  const rows = raw
    .filter((e: any) => e && TYPES.has(e.event_type))
    .slice(0, 50) // hard cap per batch
    .map((e: any) => ({
      event_type: e.event_type,
      product_id: e.product_id != null ? Number(e.product_id) || null : null,
      vendor_id: e.vendor_id != null ? Number(e.vendor_id) || null : null,
      session_id: typeof e.session_id === 'string' ? e.session_id.slice(0, 64) : null,
      meta: e.meta && typeof e.meta === 'object' ? e.meta : {}
    }));

  if (!rows.length) return json({ ok: true, ingested: 0 });

  try {
    const a = adminClient();
    await a.from('events').insert(rows);

    // Real-time per-product stat bumps (best-effort; RPC is atomic).
    const bumps = new Map<number, { views: number; add_to_cart: number }>();
    for (const r of rows) {
      if (r.product_id == null) continue;
      const cur = bumps.get(r.product_id) || { views: 0, add_to_cart: 0 };
      if (r.event_type === 'view') cur.views++;
      if (r.event_type === 'add_to_cart') cur.add_to_cart++;
      bumps.set(r.product_id, cur);
    }
    await Promise.all(
      [...bumps.entries()]
        .filter(([, b]) => b.views || b.add_to_cart)
        .map(([pid, b]) =>
          a
            .rpc('bump_product_stats', { p_product_id: pid, p_views: b.views, p_add_to_cart: b.add_to_cart })
            .then(() => {}, () => {})
        )
    );
  } catch {
    // Grid tables not migrated yet, or Supabase offline — ignore.
  }

  return json({ ok: true, ingested: rows.length });
};
