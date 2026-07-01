import { json, error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

const DEFAULT_COMMISSION = 10; // snehalata platform commission (%) if a vendor has none set
const money = (n: number) => Math.round(n * 100) / 100;

// Public checkout: creates one order + per-vendor line items with commission/payout.
// A cart may mix vendors — the order is single (customer-facing) but split per item
// for vendor fulfillment + payout. Prices are re-read from the DB (never trust client).
export const POST: RequestHandler = async ({ request }) => {
  const b = await request.json();
  const c = b?.customer || {};
  const items = Array.isArray(b?.items) ? b.items : [];
  const pay = b?.payment || {};
  if (!c.name || !c.phone || !c.address) throw error(400, 'Name, phone and address are required');
  if (!items.length) throw error(400, 'Your cart is empty');

  const a = adminClient();
  const ids = [...new Set(items.map((i: any) => Number(i.id)).filter(Boolean))];
  const { data: prods } = await a.from('products').select('id,name,price,image_url,vendor_id').in('id', ids);
  const byId = new Map((prods || []).map((p: any) => [p.id, p]));

  const vids = [...new Set((prods || []).map((p: any) => p.vendor_id).filter(Boolean))];
  const { data: vends } = vids.length
    ? await a.from('vendors').select('id,commission_rate').in('id', vids)
    : { data: [] as any[] };
  const rateOf = (vid: any) => {
    const r = (vends || []).find((v: any) => v.id === vid)?.commission_rate;
    return r === null || r === undefined ? DEFAULT_COMMISSION : Number(r);
  };

  let subtotal = 0, commissionTotal = 0, payoutTotal = 0;
  const lineItems: any[] = [];
  for (const it of items) {
    const p: any = byId.get(Number(it.id));
    if (!p) continue; // ignore items not present in the live catalog
    const qty = Math.max(1, Number(it.quantity) || 1);
    const unit = Number(p.price);
    const line = money(unit * qty);
    const rate = rateOf(p.vendor_id);
    const commission = money((line * rate) / 100);
    const payout = money(line - commission);
    subtotal += line; commissionTotal += commission; payoutTotal += payout;
    lineItems.push({
      product_id: p.id, vendor_id: p.vendor_id, name: p.name, image_url: p.image_url,
      unit_price: unit, quantity: qty, line_total: line,
      commission_rate: rate, commission_amount: commission, vendor_payout: payout, item_status: 'PLACED'
    });
  }
  if (!lineItems.length) throw error(400, 'No valid products in your cart');

  const shipping = String(c.district || '').toLowerCase() === 'dhaka' ? 78 : 118;
  const total = money(subtotal + shipping);
  const method = ['COD', 'BKASH', 'NAGAD'].includes(pay.method) ? pay.method : 'COD';

  const { data: order, error: oe } = await a.from('orders').insert({
    customer_name: c.name, customer_phone: c.phone, customer_email: c.email || null,
    district: c.district || '', area: c.area || '', address: c.address, note: c.note || '',
    payment_method: method, payment_txid: pay.txid || null, payment_status: 'PENDING',
    subtotal: money(subtotal), shipping, total, status: 'PLACED',
    commission_total: money(commissionTotal), vendor_payout_total: money(payoutTotal)
  }).select().single();
  if (oe) throw error(500, oe.message);

  const { error: ie } = await a.from('order_items').insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
  if (ie) throw error(500, ie.message);

  return json({ ok: true, orderId: order.id, total, itemCount: lineItems.length });
};
