import { json, redirect } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import { validatePayment } from '$lib/server/sslcommerz.server';
import { encodeTracking } from '$lib/trackingCode';
import type { RequestHandler } from './$types';

// Single handler for SSLCommerz success / fail / cancel redirects AND the server-to-server IPN.
// On a valid, settled payment (validated by val_id) it marks the order PAID exactly once, then
// redirects the browser to the right page. The pure IPN call (no ?redirect) returns 200 JSON.
export const POST: RequestHandler = async ({ request, url }) => {
  const mode = url.searchParams.get('redirect'); // 'success' | 'fail' | 'cancel' | null(IPN)
  let form: URLSearchParams;
  try {
    form = new URLSearchParams(await request.text());
  } catch {
    form = new URLSearchParams();
  }
  const tranId = form.get('tran_id') || '';
  const valId = form.get('val_id') || '';
  const orderId = Number((tranId.split('-')[1] || '').trim()) || 0;

  if (mode === 'fail') throw redirect(303, `/payment/fail?order=${orderId}`);
  if (mode === 'cancel') throw redirect(303, `/payment/cancel?order=${orderId}`);

  // success redirect OR IPN → validate the payment server-side before trusting it.
  let paid = false;
  let tracking = '';
  let orderTotal = 0;
  if (orderId && valId) {
    const v = await validatePayment(valId);
    if (v.valid) {
      const a = adminClient();
      const { data: o } = await a.from('orders').select('id,total,payment_status,created_at').eq('id', orderId).single();
      if (o) {
        orderTotal = Number(o.total) || 0;
        // amount must match (guard against tampering); allow a 1-taka rounding slack
        const amountOk = v.amount == null || Math.abs(Number(v.amount) - Number(o.total)) <= 1;
        if (amountOk && o.payment_status !== 'PAID') {
          await a.from('orders').update({ payment_status: 'PAID', payment_txid: v.bankTranId || valId }).eq('id', orderId);
        }
        paid = amountOk;
        tracking = encodeTracking(o.id, new Date(o.created_at || Date.now()));
      }
    }
  }

  if (mode === 'success') {
    if (paid) throw redirect(303, `/payment/success?order=${orderId}&t=${encodeURIComponent(tracking)}&v=${orderTotal}`);
    throw redirect(303, `/payment/fail?order=${orderId}`);
  }
  return json({ ok: true, paid });
};
