import { json, error } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

// Live customer reviews & ratings. Service_role only (RLS-on table, no public policy),
// exactly like /api/orders. PII-safe: author_phone is stored for moderation/verification
// but NEVER returned to the public GET.
//
// Requires the `reviews` table (owner runs the 1-line SQL once). Until then this endpoint
// degrades gracefully — GET returns empty aggregates/list, POST returns a friendly setup
// message — so the storefront never errors.

function adminClient(): SupabaseClient {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw error(500, 'Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Postgres/PostgREST "relation does not exist" → the table hasn't been created yet.
function isMissingTable(e: any): boolean {
  const code = e?.code || '';
  const msg = String(e?.message || '').toLowerCase();
  return code === '42P01' || code === 'PGRST205' || code === 'PGRST202' || msg.includes('does not exist') || msg.includes('could not find the table');
}

const clampRating = (r: any) => Math.max(1, Math.min(5, Math.round(Number(r) || 0)));

export const GET: RequestHandler = async ({ url }) => {
  const admin = adminClient();
  const productId = url.searchParams.get('product_id');
  const wantAggregates = url.searchParams.get('aggregates') === '1';

  try {
    // Aggregates for the whole catalog — avg + count per product AND per vendor. One small
    // query drives the card star-badges + the vendor rail rating with no N+1 fetches.
    if (wantAggregates) {
      const { data, error: e } = await admin
        .from('reviews')
        .select('rating,product_id,vendor_id')
        .eq('status', 'PUBLISHED');
      if (e) throw e;
      const byProduct: Record<string, { sum: number; count: number }> = {};
      const byVendor: Record<string, { sum: number; count: number }> = {};
      for (const r of data || []) {
        const rt = Number(r.rating) || 0;
        if (r.product_id != null) {
          const k = String(r.product_id);
          (byProduct[k] ??= { sum: 0, count: 0 }).sum += rt;
          byProduct[k].count += 1;
        }
        if (r.vendor_id != null) {
          const k = String(r.vendor_id);
          (byVendor[k] ??= { sum: 0, count: 0 }).sum += rt;
          byVendor[k].count += 1;
        }
      }
      const finalize = (m: Record<string, { sum: number; count: number }>) =>
        Object.fromEntries(
          Object.entries(m).map(([k, v]) => [k, { avg: Math.round((v.sum / v.count) * 10) / 10, count: v.count }])
        );
      return json({ byProduct: finalize(byProduct), byVendor: finalize(byVendor) });
    }

    // A single product's review list (+ its own avg/count).
    if (productId) {
      const { data, error: e } = await admin
        .from('reviews')
        .select('id,created_at,rating,title,body,author_name')
        .eq('status', 'PUBLISHED')
        .eq('product_id', Number(productId))
        .order('created_at', { ascending: false })
        .limit(50);
      if (e) throw e;
      const reviews = data || [];
      const count = reviews.length;
      const avg = count ? Math.round((reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / count) * 10) / 10 : 0;
      return json({ reviews, avg, count });
    }

    return json({ reviews: [], avg: 0, count: 0 });
  } catch (e: any) {
    if (isMissingTable(e)) {
      // Feature not provisioned yet — behave as "no reviews" so nothing breaks.
      return json(wantAggregates ? { byProduct: {}, byVendor: {} } : { reviews: [], avg: 0, count: 0 });
    }
    throw error(500, 'Could not load reviews');
  }
};

export const POST: RequestHandler = async ({ request }) => {
  const b = await request.json().catch(() => ({}));
  const product_id = Number(b?.product_id);
  if (!product_id) throw error(400, 'A product is required');
  const rating = clampRating(b?.rating);
  if (!rating) throw error(400, 'A rating (1–5) is required');

  const row = {
    product_id,
    vendor_id: b?.vendor_id != null ? Number(b.vendor_id) : null,
    rating,
    title: String(b?.title || '').slice(0, 120) || null,
    body: String(b?.body || '').slice(0, 1500) || null,
    author_name: String(b?.author_name || '').slice(0, 80).trim() || 'একজন ক্রেতা',
    author_phone: String(b?.author_phone || '').slice(0, 20).trim() || null,
    status: 'PUBLISHED'
  };

  try {
    const admin = adminClient();
    const { data, error: e } = await admin
      .from('reviews')
      .insert(row)
      .select('id,created_at,rating,title,body,author_name')
      .single();
    if (e) throw e;
    return json({ ok: true, review: data });
  } catch (e: any) {
    if (isMissingTable(e)) {
      throw error(503, 'রিভিউ ফিচার শীঘ্রই চালু হচ্ছে — একটু পরে চেষ্টা করুন।');
    }
    throw error(500, 'Could not save your review');
  }
};
