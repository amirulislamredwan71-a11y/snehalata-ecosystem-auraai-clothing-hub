import { json, error } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

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

export const POST: RequestHandler = async ({ request }) => {
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
  return json({ ok: true, product: data });
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
