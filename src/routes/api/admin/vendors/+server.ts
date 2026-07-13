import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

// Admin vendor management: approve / block (PATCH status) and remove (DELETE).
// Authorized with the admin password (x-admin-pass), same as /api/admin/products.
function assertAdmin(request: Request) {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) {
    throw error(401, 'Unauthorized — admin access denied by Aura Governance');
  }
}

function genPassword() {
  const a = Math.random().toString(36).slice(2, 8);
  const b = Math.random().toString(36).slice(2, 6);
  const n = Math.floor(10 + Math.random() * 89);
  return `Sneh-${a}${b}@${n}`;
}

// Fresh, complete vendor list for the admin dashboard (service_role, never cached) —
// so the admin never shows the stale/partial public-catalog copy.
export const GET: RequestHandler = async ({ request, setHeaders }) => {
  assertAdmin(request);
  setHeaders({ 'cache-control': 'no-store' });
  const { data, error: e } = await adminClient().from('vendors').select('*').order('id', { ascending: true });
  if (e) throw error(500, e.message);
  return json({ ok: true, vendors: data || [] });
};

// Admin: generate & set a fresh unique password for a vendor's login.
export const POST: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const a = adminClient();
  const { data: vend } = await a.from('vendors').select('email, store_name').eq('id', id).single();
  if (!vend?.email) throw error(404, 'No email on this vendor');

  const { data: list } = await a.auth.admin.listUsers({ page: 1, perPage: 1000 });
  let user = list?.users?.find((u) => (u.email || '').toLowerCase() === vend.email.toLowerCase());

  const password = genPassword();
  if (!user) {
    // no login yet (legacy vendor) — create one
    const { data: created, error: ce } = await a.auth.admin.createUser({ email: vend.email, password, email_confirm: true });
    if (ce) throw error(500, ce.message);
    user = created.user;
  } else {
    const { error: ue } = await a.auth.admin.updateUserById(user.id, { password });
    if (ue) throw error(500, ue.message);
  }
  return json({ ok: true, email: vend.email, store_name: vend.store_name, password });
};

// PATCH handles BOTH a status change (approve/block) AND editing vendor profile fields.
export const PATCH: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const body = await request.json();
  const update: Record<string, any> = {};

  if (body.status !== undefined) {
    const norm = String(body.status || '').toLowerCase();
    if (!['approved', 'pending', 'blocked', 'suspended'].includes(norm)) throw error(400, 'invalid status');
    update.status = norm;
  }
  // Editable profile fields (whitelist — only columns known to exist on `vendors`).
  for (const f of ['store_name', 'owner_name', 'website_url', 'district', 'area', 'description', 'category']) {
    if (body[f] !== undefined) update[f] = body[f] === '' ? null : body[f];
  }
  // Per-vendor fixed commission % (used in the global "Fixed" commission mode).
  if (body.commission_rate !== undefined) {
    const n = Number(body.commission_rate);
    if (!Number.isFinite(n) || n < 0 || n > 50) throw error(400, 'commission_rate must be 0–50');
    update.commission_rate = n;
  }
  if (Object.keys(update).length === 0) throw error(400, 'no fields to update');

  const { data, error: e } = await adminClient().from('vendors').update(update).eq('id', id).select().single();
  if (e) throw error(500, e.message);

  // The storefront filters by PRODUCT category, not the vendor tag — so setting a vendor's
  // category ALSO moves every one of its products to that category tile. This is what makes
  // "pick a category for the store → it actually fixes" work (was the recurring Others bug).
  let productsMoved = 0;
  if (body.category !== undefined && body.category) {
    const catId = String(body.category).toLowerCase();
    const CANON: Record<string, string> = {
      womens: 'Womens', saree: 'Saree', panjabi: 'Panjabi', 'three-piece': 'Three-Piece', borka: 'Borka',
      shirt: 'Shirt', 't-shirt': 'T-Shirt', pant: 'Pant', baby: 'Baby', market: 'Market',
      cosmetics: 'Cosmetics', undergarments: 'Undergarments', gadgets: 'Gadgets', others: 'Others'
    };
    const canon = CANON[catId] || catId.replace(/(^|[-\s])([a-z])/g, (_m, s, c) => s + c.toUpperCase());
    try {
      const { data: moved } = await adminClient().from('products').update({ category: canon }).eq('vendor_id', id).select('id');
      productsMoved = (moved || []).length;
    } catch { /* products move is best-effort */ }
  }
  return json({ ok: true, vendor: data, productsMoved });
};

export const DELETE: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const a = adminClient();
  // remove the vendor's products first (FK safety), then the vendor
  await a.from('products').delete().eq('vendor_id', id);
  const { error: e } = await a.from('vendors').delete().eq('id', id);
  if (e) throw error(500, e.message);
  return json({ ok: true });
};
