import { json, error } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import { moderateListing, embedText } from '$lib/server/gemini.server';
import { withTimeout } from '$lib/seedCatalog';
import type { RequestHandler } from './$types';

// Background enrichment (moderation + embedding) needs room after the response.
export const config = { maxDuration: 30 };

// Vendor-scoped product CRUD. The vendor's Supabase session token (from
// /api/vendor/login) identifies them; writes are forced to their own vendor_id
// and deletes are allowed only on their own products. service_role stays server-side.

function adminClient(): SupabaseClient {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw error(500, 'Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function vendorFromToken(request: Request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw error(401, 'Missing vendor session');
  const admin = adminClient();
  const { data: u, error: e } = await admin.auth.getUser(token);
  if (e || !u?.user?.email) throw error(401, 'Session expired — please sign in again');
  const { data: vend } = await admin
    .from('vendors')
    .select('id, store_name')
    .eq('email', u.user.email)
    .single();
  if (!vend) throw error(403, 'No vendor node linked to this account');
  return { admin, vend };
}

export const GET: RequestHandler = async ({ request }) => {
  const { admin, vend } = await vendorFromToken(request);
  const { data, error: e } = await admin
    .from('products')
    .select('*')
    .eq('vendor_id', vend.id)
    .order('id', { ascending: false });
  if (e) throw error(500, e.message);
  return json({ ok: true, products: data });
};

export const POST: RequestHandler = async ({ request, platform }) => {
  const { admin, vend } = await vendorFromToken(request);
  const b = await request.json();
  if (!b?.name || b?.price === undefined) throw error(400, 'name and price are required');
  const row = {
    name: b.name,
    price: Number(b.price),
    category: b.category || 'Others',
    description: b.description || '',
    image_url: b.image_url || b.imageUrl || '',
    stock_quantity: Number(b.stock_quantity ?? 10),
    vendor_id: vend.id
  };
  const { data, error: e } = await admin.from('products').insert(row).select().single();
  if (e) throw error(500, e.message);

  // AI enrichment (A6 moderation + A3 embedding) is SLOW (Gemini, seconds). Run it
  // in the BACKGROUND so the vendor's "Deploy to Catalog" button responds instantly.
  // On Vercel, waitUntil keeps the function alive until this resolves after the
  // response is sent; elsewhere it's fire-and-forget. Anything cut short is
  // recoverable via /api/admin/embeddings/backfill (re-embeds where embedding IS NULL).
  const enrich = async () => {
    try {
      const m = await withTimeout(moderateListing(row.name, row.description, row.price, row.category), 12000);
      if (m) {
        const patch: any = { moderation_score: Math.round(Number(m.trust_score) || 0), moderation_note: m.note || null };
        if (m.verdict === 'REVIEW') patch.is_active = false;
        await admin.from('products').update(patch).eq('id', data.id);
      }
    } catch { /* moderation columns not migrated / Gemini offline — ignore */ }

    try {
      const emb = await withTimeout(embedText([row.name, row.category, row.description].filter(Boolean).join('. ')), 10000);
      if (emb) await admin.from('products').update({ embedding: `[${emb.join(',')}]` }).eq('id', data.id);
    } catch { /* embedding column not migrated — backfill endpoint will catch it */ }
  };

  const waitUntil = (platform as any)?.context?.waitUntil;
  if (typeof waitUntil === 'function') waitUntil(enrich());
  else enrich().catch(() => {});

  return json({ ok: true, product: data });
};

// Edit one of the vendor's OWN products (price / name / description / category / image).
// vendor_id can never change here — a vendor can only edit within their own store.
export const PATCH: RequestHandler = async ({ request, url, platform }) => {
  const { admin, vend } = await vendorFromToken(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const { data: existing } = await admin.from('products').select('vendor_id').eq('id', id).single();
  if (!existing || existing.vendor_id !== vend.id) throw error(403, 'You can only edit your own products');

  const b = await request.json();
  const row: Record<string, any> = {};
  if (b.name !== undefined) row.name = String(b.name);
  if (b.price !== undefined) row.price = Number(b.price);
  if (b.category !== undefined) row.category = b.category || 'Others';
  if (b.description !== undefined) row.description = String(b.description || '');
  if (b.image_url !== undefined || b.imageUrl !== undefined) row.image_url = b.image_url || b.imageUrl || '';
  if (b.stock_quantity !== undefined) row.stock_quantity = Number(b.stock_quantity);
  if (Object.keys(row).length === 0) throw error(400, 'no fields to update');

  const { data: updated, error: e } = await admin.from('products').update(row).eq('id', id).select().single();
  if (e) throw error(500, e.message);

  // Re-score + re-embed in the background (name/desc/price may have changed). We update the
  // Aura moderation SCORE but do NOT auto-unpublish on an edit, so fixing a typo never
  // unexpectedly hides a live listing (the admin still sees the fresh score in Review).
  const enrich = async () => {
    try {
      const m = await withTimeout(moderateListing(updated.name, updated.description || '', Number(updated.price) || 0, updated.category || 'Others'), 12000);
      if (m) await admin.from('products').update({ moderation_score: Math.round(Number(m.trust_score) || 0), moderation_note: m.note || null }).eq('id', id);
    } catch { /* Gemini offline / columns absent — ignore */ }
    try {
      const emb = await withTimeout(embedText([updated.name, updated.category, updated.description].filter(Boolean).join('. ')), 10000);
      if (emb) await admin.from('products').update({ embedding: `[${emb.join(',')}]` }).eq('id', id);
    } catch { /* embedding column absent — backfill catches it */ }
  };
  const waitUntil = (platform as any)?.context?.waitUntil;
  if (typeof waitUntil === 'function') waitUntil(enrich());
  else enrich().catch(() => {});

  return json({ ok: true, product: updated });
};

export const DELETE: RequestHandler = async ({ request, url }) => {
  const { admin, vend } = await vendorFromToken(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const { data: existing } = await admin.from('products').select('vendor_id').eq('id', id).single();
  if (!existing || existing.vendor_id !== vend.id) throw error(403, 'You can only remove your own products');
  const { error: e } = await admin.from('products').delete().eq('id', id);
  if (e) throw error(500, e.message);
  return json({ ok: true });
};
