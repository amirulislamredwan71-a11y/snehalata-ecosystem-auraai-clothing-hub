import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';
import { adminClient } from '$lib/server/vendorSync';

export const config = { maxDuration: 60 };

// A5 — execute Aura's tool calls against live data (service_role, read-only here).
async function execTool(name: string, args: any) {
  const a = adminClient();

  if (name === 'search_catalog') {
    const q = String(args?.query || '').slice(0, 80).trim();
    if (!q) return { products: [] };
    let { data } = await a
      .from('products')
      .select('id,name,price,category,vendor_id')
      .ilike('name', `%${q}%`)
      .or('is_active.is.null,is_active.eq.true')
      .limit(6);
    if (!data?.length) {
      const { data: d2 } = await a
        .from('products')
        .select('id,name,price,category,vendor_id')
        .ilike('category', `%${q}%`)
        .or('is_active.is.null,is_active.eq.true')
        .limit(6);
      data = d2 || [];
    }
    return { products: (data || []).map((p: any) => ({ id: p.id, name: p.name, price: p.price, category: p.category })) };
  }

  if (name === 'get_order_status') {
    const id = String(args?.order_id || '').replace(/[^0-9]/g, '');
    if (!id) return { error: 'Please provide a numeric order id' };
    const { data: o } = await a
      .from('orders')
      .select('id,status,payment_method,payment_status,total,district,created_at')
      .eq('id', id)
      .single();
    if (!o) return { error: 'Order not found' };
    return o;
  }

  return { error: 'unknown tool' };
}

export const POST = async ({ request }) => {
  try {
    const { message, history, inventory, vendors } = await request.json();
    const text = await gemini.generateAuraResponseWithTools(
      message,
      history || [],
      inventory,
      vendors,
      execTool
    );
    return json({ text });
  } catch (error: any) {
    return json({ error: error.message }, { status: 500 });
  }
};
