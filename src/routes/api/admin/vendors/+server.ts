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

export const PATCH: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const { status } = await request.json();
  const norm = String(status || '').toLowerCase();
  if (!['approved', 'pending', 'blocked', 'suspended'].includes(norm)) throw error(400, 'invalid status');
  const { error: e } = await adminClient().from('vendors').update({ status: norm }).eq('id', id);
  if (e) throw error(500, e.message);
  return json({ ok: true, status: norm });
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
