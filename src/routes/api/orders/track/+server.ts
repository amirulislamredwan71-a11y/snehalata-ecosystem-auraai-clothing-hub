import { json, error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

// Public order tracking by ID. Returns only non-sensitive fields (no phone/address/name)
// so a guessable id can't leak customer PII.
export const GET: RequestHandler = async ({ url }) => {
  const raw = (url.searchParams.get('id') || '').replace(/^ORD-/i, '').trim();
  if (!/^\d+$/.test(raw)) throw error(400, 'Enter a valid order ID (e.g. ORD-1)');
  const a = adminClient();
  const { data: o } = await a
    .from('orders')
    .select('id, status, total, created_at, payment_method, payment_status, district')
    .eq('id', raw)
    .single();
  if (!o) throw error(404, 'Order not found');
  const { data: items } = await a
    .from('order_items')
    .select('name, quantity, image_url, item_status, line_total')
    .eq('order_id', raw);
  return json({ ok: true, order: { ...o, items: items || [] } });
};
