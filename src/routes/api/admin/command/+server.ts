import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient } from '$lib/server/vendorSync';
import { planAdminCommand } from '$lib/server/gemini.server';
import type { RequestHandler } from './$types';

// Aura Command Console — natural-language admin agent. Two phases, always confirm-gated for
// mutations: POST {command} → Aura returns a structured, previewed action plan (NO execution);
// POST {confirm:[actions]} → the server validates + executes the plan deterministically.
export const config = { maxDuration: 60, memory: 1536 };

function assertAdmin(request: Request) {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) throw error(401, 'Unauthorized — admin only');
}

// Compact CONTEXT for the planner: every vendor + its pending/total product counts.
async function buildContext(a: any) {
  const { data: vendors } = await a.from('vendors').select('id,store_name,status').order('id');
  const { data: prods } = await a.from('products').select('id,vendor_id,is_active');
  const pending: Record<number, number> = {};
  const total: Record<number, number> = {};
  for (const p of prods || []) {
    const v = Number(p.vendor_id) || 0;
    total[v] = (total[v] || 0) + 1;
    if (p.is_active === false) pending[v] = (pending[v] || 0) + 1;
  }
  const totalPending = Object.values(pending).reduce((s, n) => s + n, 0);
  const lines = (vendors || []).map((v: any) => `#${v.id} · ${v.store_name} · pending ${pending[v.id] || 0} · total ${total[v.id] || 0} · ${v.status}`);
  return { text: `Total pending across all vendors: ${totalPending}\n${lines.join('\n')}`, vendors: vendors || [], pending, total };
}

const vname = (ctx: any, id: number) => ctx.vendors.find((v: any) => v.id === id)?.store_name || `vendor #${id}`;
const allPending = (ctx: any) => Object.values(ctx.pending).reduce((s: number, n: any) => s + Number(n), 0);

// A human, reviewable one-liner for a planned action (shown BEFORE the owner confirms).
function previewAction(act: any, ctx: any): string {
  switch (act.type) {
    case 'approve_pending': return act.all ? `Approve ALL ${allPending(ctx)} pending products` : act.vendor_id ? `Approve ${ctx.pending[act.vendor_id] || 0} pending of ${vname(ctx, act.vendor_id)}` : `Approve ${(act.product_ids || []).length} products`;
    case 'reject_pending': return act.all ? `⚠ Reject (delete) ALL ${allPending(ctx)} pending products` : act.vendor_id ? `⚠ Reject ${ctx.pending[act.vendor_id] || 0} pending of ${vname(ctx, act.vendor_id)}` : `⚠ Reject ${(act.product_ids || []).length} products`;
    case 'import_url': return `Import from ${act.url}${act.deep ? ' (deep render)' : ''}${act.store_name ? ` → store "${act.store_name}"` : ''}`;
    case 'delete_products': return act.vendor_id ? `⚠ DELETE all products of ${vname(ctx, act.vendor_id)}` : `⚠ DELETE ${(act.product_ids || []).length} products`;
    case 'edit_product': return `Edit product #${act.product_id}` + [act.price != null ? ` · price ৳${act.price}` : '', act.name ? ` · name "${act.name}"` : '', act.category ? ` · category ${act.category}` : '', act.is_active != null ? ` · ${act.is_active ? 'live' : 'pending'}` : ''].join('');
    case 'set_price': return `Set price ${act.above_market ? 'ABOVE market avg (+15%)' : `৳${act.price}`} on ` + (act.vendor_id ? `all products of ${vname(ctx, act.vendor_id)}` : `${(act.product_ids || []).length} products`);
    case 'set_vendor_status': return `Set ${vname(ctx, act.vendor_id)} status → ${act.status}`;
    default: return `Unknown action: ${act.type}`;
  }
}

async function execAction(a: any, act: any, event: any): Promise<{ ok: boolean; affected?: number; note: string }> {
  switch (act.type) {
    case 'approve_pending': {
      let q = a.from('products').update({ is_active: true }).eq('is_active', false);
      if (act.vendor_id) q = q.eq('vendor_id', act.vendor_id);
      else if (Array.isArray(act.product_ids) && act.product_ids.length) q = q.in('id', act.product_ids);
      else if (!act.all) return { ok: false, note: 'no target specified' };
      const { data, error: e } = await q.select('id');
      if (e) throw new Error(e.message);
      return { ok: true, affected: (data || []).length, note: `approved ${(data || []).length} products` };
    }
    case 'reject_pending': {
      let q = a.from('products').delete().eq('is_active', false);
      if (act.vendor_id) q = q.eq('vendor_id', act.vendor_id);
      else if (Array.isArray(act.product_ids) && act.product_ids.length) q = q.in('id', act.product_ids);
      else if (!act.all) return { ok: false, note: 'no target specified' };
      const { data, error: e } = await q.select('id');
      if (e) throw new Error(e.message);
      return { ok: true, affected: (data || []).length, note: `rejected ${(data || []).length} products` };
    }
    case 'import_url': {
      if (!act.url) return { ok: false, note: 'no url' };
      const res = await event.fetch('/api/admin/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pass': env.ADMIN_PASSWORD as string },
        body: JSON.stringify({ url: act.url, storeName: act.store_name, deep: !!act.deep })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'import failed');
      return { ok: true, affected: d.imported || 0, note: `imported ${d.imported || 0} into ${d.vendor?.store_name || 'store'} (pending → Review)` };
    }
    case 'delete_products': {
      let q = a.from('products').delete();
      if (Array.isArray(act.product_ids) && act.product_ids.length) q = q.in('id', act.product_ids);
      else if (act.vendor_id) q = q.eq('vendor_id', act.vendor_id);
      else return { ok: false, note: 'no target specified' };
      const { data, error: e } = await q.select('id');
      if (e) throw new Error(e.message);
      return { ok: true, affected: (data || []).length, note: `deleted ${(data || []).length} products` };
    }
    case 'edit_product': {
      if (!act.product_id) return { ok: false, note: 'no product_id' };
      const patch: any = {};
      if (act.price != null) patch.price = Number(act.price);
      if (act.name) patch.name = String(act.name);
      if (act.category) patch.category = String(act.category);
      if (act.is_active != null) patch.is_active = !!act.is_active;
      if (!Object.keys(patch).length) return { ok: false, note: 'nothing to change' };
      const { error: e } = await a.from('products').update(patch).eq('id', act.product_id);
      if (e) throw new Error(e.message);
      return { ok: true, affected: 1, note: `edited product #${act.product_id}` };
    }
    case 'set_price': {
      let ids: number[] = [];
      if (Array.isArray(act.product_ids) && act.product_ids.length) ids = act.product_ids.map(Number);
      else if (act.vendor_id) { const { data } = await a.from('products').select('id').eq('vendor_id', act.vendor_id); ids = (data || []).map((p: any) => p.id); }
      if (!ids.length) return { ok: false, note: 'no target products' };
      let price = Number(act.price) || 0;
      if (act.above_market) {
        const { data: one } = await a.from('products').select('category').eq('id', ids[0]).maybeSingle();
        const cat = one?.category || 'Others';
        const { data: peers } = await a.from('products').select('price').eq('category', cat).or('is_active.is.null,is_active.eq.true');
        const avg = (peers || []).reduce((s: number, p: any) => s + Number(p.price || 0), 0) / Math.max(1, (peers || []).length);
        price = Math.round((avg || 1000) * 1.15);
      }
      if (price <= 0) return { ok: false, note: 'invalid price' };
      const { error: e } = await a.from('products').update({ price }).in('id', ids);
      if (e) throw new Error(e.message);
      return { ok: true, affected: ids.length, note: `set price ৳${price} on ${ids.length} products` };
    }
    case 'set_vendor_status': {
      if (!act.vendor_id || !act.status) return { ok: false, note: 'missing vendor_id/status' };
      const st = String(act.status).toLowerCase();
      if (!['approved', 'blocked', 'pending', 'suspended'].includes(st)) return { ok: false, note: 'invalid status' };
      const { error: e } = await a.from('vendors').update({ status: st }).eq('id', act.vendor_id);
      if (e) throw new Error(e.message);
      return { ok: true, affected: 1, note: `vendor #${act.vendor_id} → ${st}` };
    }
    default:
      return { ok: false, note: `unknown action type: ${act.type}` };
  }
}

export const POST: RequestHandler = async (event) => {
  assertAdmin(event.request);
  const b = await event.request.json().catch(() => ({}));
  const a = adminClient();
  const ctx = await buildContext(a);

  // ── Phase B: execute the actions the owner confirmed ──
  if (Array.isArray(b?.confirm)) {
    const results: any[] = [];
    for (const act of b.confirm) {
      try {
        const r = await execAction(a, act, event);
        results.push({ type: act.type, preview: previewAction(act, ctx), ...r });
      } catch (e: any) {
        results.push({ type: act.type, preview: previewAction(act, ctx), ok: false, note: e?.message || 'failed' });
      }
    }
    const affected = results.filter((r) => r.ok).reduce((s, r) => s + (r.affected || 0), 0);
    return json({ ok: true, results, summary: `${results.filter((r) => r.ok).length}/${results.length} action(s) ran · ${affected} item(s) affected` });
  }

  // ── Phase A: plan (no execution) ──
  const command = String(b?.command || '').trim();
  if (!command) throw error(400, 'command is required');
  let plan;
  try {
    plan = await planAdminCommand(command, ctx.text);
  } catch (e: any) {
    throw error(503, 'Aura is busy — please try again. ' + (e?.message || ''));
  }
  const actions = (plan.actions || []).map((act: any) => ({ ...act, preview: previewAction(act, ctx) }));
  return json({ ok: true, reply: plan.reply, actions });
};
