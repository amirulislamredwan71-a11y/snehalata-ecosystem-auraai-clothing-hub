import { json, error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import { decodeTracking, encodeTracking } from '$lib/trackingCode';
import type { RequestHandler } from './$types';

// Public order tracking by tracking code (SNH-YYMMDD-XXXX) or legacy id/ORD-<n>. Returns
// only non-sensitive fields (no phone/address/name) so a code can't leak customer PII.
export const GET: RequestHandler = async ({ url }) => {
  const id = decodeTracking(url.searchParams.get('id') || '');
  if (!id) throw error(400, 'Enter a valid tracking ID (e.g. SNH-250707-XXXX)');
  const a = adminClient();
  const { data: o } = await a
    .from('orders')
    .select('id, status, total, created_at, payment_method, payment_status, district')
    .eq('id', id)
    .single();
  if (!o) throw error(404, 'Order not found');
  const { data: items } = await a
    .from('order_items')
    .select('name, quantity, image_url, item_status, line_total')
    .eq('order_id', id);
  const tracking = encodeTracking(o.id, new Date(o.created_at || Date.now()));
  return json({ ok: true, order: { ...o, tracking, items: items || [] } });
};
