import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

function assertAdmin(request: Request) {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) throw error(401, 'Unauthorized');
}

// All orders (master view) with their line items + vendor names + commission/payout.
export const GET: RequestHandler = async ({ request }) => {
  assertAdmin(request);
  const a = adminClient();
  const { data: orders, error: e } = await a
    .from('orders')
    .select('*, order_items(*)')
    .order('id', { ascending: false });
  if (e) throw error(500, e.message);
  // attach vendor store names (order_items.vendor_id has no FK, so map manually)
  const vids = [...new Set((orders || []).flatMap((o: any) => (o.order_items || []).map((i: any) => i.vendor_id)).filter(Boolean))];
  const names: Record<string, string> = {};
  if (vids.length) {
    const { data: vs } = await a.from('vendors').select('id, store_name').in('id', vids);
    for (const v of vs || []) names[v.id] = v.store_name;
  }
  for (const o of orders || []) for (const it of o.order_items || []) it.vendor_store_name = names[it.vendor_id] || 'Vendor';
  return json({ ok: true, orders });
};

// Update an order's fulfillment status and/or payment status.
export const PATCH: RequestHandler = async ({ request, url }) => {
  assertAdmin(request);
  const id = url.searchParams.get('id');
  if (!id) throw error(400, 'id query param required');
  const b = await request.json();
  const patch: Record<string, unknown> = {};
  if (b.status) patch.status = String(b.status);
  if (b.payment_status) patch.payment_status = String(b.payment_status);
  if (!Object.keys(patch).length) throw error(400, 'nothing to update');
  const a = adminClient();
  const { error: e } = await a.from('orders').update(patch).eq('id', id);
  if (e) throw error(500, e.message);
  // keep line items in step with the order-level fulfillment status
  if (patch.status) await a.from('order_items').update({ item_status: patch.status }).eq('order_id', id);
  return json({ ok: true });
};
