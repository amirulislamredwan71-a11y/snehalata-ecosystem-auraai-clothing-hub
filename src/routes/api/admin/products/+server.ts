import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

// Admin-only product CRUD against the live Neural Grid (Supabase).
// The service_role key stays server-side; the client authorizes with the admin
// password (x-admin-pass header), verified here against ADMIN_PASSWORD.

function adminClient() {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw error(500, 'Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function assertAdmin(request: Request) {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) {
    throw error(401, 'Unauthorized — admin access denied by Aura Governance');
  }
}

const PRODUCT_FIELDS = ['name', 'price', 'category', 'image_url', 'description', 'stock_quantity', 'vendor_id'] as const;

function cleanProduct(body: any) {
  const row: Record<string, unknown> = {};
  for (const f of PRODUCT_FIELDS) {
    let v = body[f];
    if (f === 'image_url' && v === undefined) v = body.imageUrl;
    if (v === undefined) continue;
    if (f === 'price' || f === 'stock_quantity' || f === 'vendor_id') v = Number(v);
    row[f] = v;
  }
  if (body.is_active !== undefined) row.is_active = Boolean(body.is_active);
  return row;
}

// List products for admin review. ?pending=1 → only items awaiting review (is_active=false).
export const GET: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const sb = adminClient();
  let query = sb.from('products').select('*, vendors(store_name)').order('id', { ascending: false });
  if (url.searchParams.get('pending') === '1') query = query.eq('is_active', false);
  const { data, error: e } = await query;
  if (e) throw error(500, e.message);
  return json({ ok: true, products: data });
};

export const POST: RequestHandler = async ({ request }) => {
  assertAdmin(request);
  const body = await request.json();
  if (!body?.name || body?.price === undefined) throw error(400, 'name and price are required');
  const row = cleanProduct(body);
  if (row.stock_quantity === undefined) row.stock_quantity = 10;
  const { data, error: e } = await adminClient().from('products').insert(row).select().single();
  if (e) throw error(500, e.message);
  return json({ ok: true, product: data });
};

export const PATCH: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const row = cleanProduct(await request.json());
  const { error: e } = await adminClient().from('products').update(row).eq('id', id);
  if (e) throw error(500, e.message);
  return json({ ok: true });
};

export const DELETE: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const { error: e } = await adminClient().from('products').delete().eq('id', id);
  if (e) throw error(500, e.message);
  return json({ ok: true });
};
