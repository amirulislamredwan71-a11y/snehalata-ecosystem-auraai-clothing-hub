import { json } from '@sveltejs/kit';
import * as gemini from '$lib/server/gemini.server';
import { groqChat } from '$lib/server/groq.server';
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
  const body = await request.json().catch(() => ({} as any));
  const { message, history, inventory = '', vendors = '' } = body;

  // Primary: tool-calling chat (grounded in live data), with 503-retry inside.
  try {
    const text = await gemini.generateAuraResponseWithTools(
      message,
      history || [],
      inventory,
      vendors,
      execTool
    );
    return json({ text });
  } catch (toolErr: any) {
    console.error('AURA CHAT tool-calling failed, falling back:', toolErr?.message || toolErr);
  }

  // Fallback 1: plain no-tools reply on the stable Gemini model (still catalog-aware).
  try {
    const text = await gemini.generateAuraFallback(message, inventory, vendors);
    return json({ text });
  } catch (fallbackErr: any) {
    console.error('AURA CHAT gemini fallback failed:', fallbackErr?.message || fallbackErr);
  }

  // Fallback 2: cross-provider — Groq (free, fast, separate infra) so a Gemini
  // outage doesn't take Aura offline. No-op if GROQ_API_KEY isn't set.
  try {
    const text = await groqChat(message, inventory, vendors);
    return json({ text, via: 'groq' });
  } catch (groqErr: any) {
    console.error('AURA CHAT groq fallback failed:', groqErr?.message || groqErr);
  }

  // Fallback 3: never 500 — a friendly message so the UI never shows "unstable".
  return json({ text: 'Aura is very busy right now — please try again in a few seconds. 🙏' });
};
