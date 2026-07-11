import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient, syncVendor } from '$lib/server/vendorSync';
import { renderAndExtract } from '$lib/server/deepImport.server';
import { uploadAsset } from '$lib/server/siteConfig.server';
import * as gemini from '$lib/server/gemini.server';
import { withTimeout } from '$lib/seedCatalog';
import type { RequestHandler } from './$types';

// Admin Import Console — the admin runs website-sync / deep-import / photo(folder) AI import
// FOR ANY vendor from the admin dashboard. All results land as pending (is_active:false) for
// the Review tab. Guarded by the admin password. Headless (deep) needs room → maxDuration.
export const config = { maxDuration: 60, memory: 1536 };

function assertAdmin(request: Request) {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) throw error(401, 'Unauthorized — admin only');
}

const KNOWN = ['Saree', 'Panjabi', 'Three-Piece', 'Borka', 'Shirt', 'T-Shirt', 'Pant', 'Baby', 'Cosmetics', 'Undergarments', 'Gadgets', 'Others'];
function snapCat(raw?: string): string {
  const n = String(raw || '').toLowerCase().trim();
  const exact = KNOWN.find((c) => c.toLowerCase() === n);
  if (exact) return exact;
  if (n.includes('saree') || n.includes('sari')) return 'Saree';
  if (n.includes('panjabi') || n.includes('punjabi') || n.includes('kurta')) return 'Panjabi';
  if (n.includes('three') || n.includes('salwar') || n.includes('kameez')) return 'Three-Piece';
  if (n.includes('borka') || n.includes('hijab') || n.includes('niqab') || n.includes('nikab') || n.includes('abaya')) return 'Borka';
  if (n.includes('t-shirt') || n.includes('tshirt') || n.includes('tee')) return 'T-Shirt';
  if (n.includes('shirt')) return 'Shirt';
  if (n.includes('pant') || n.includes('trouser') || n.includes('jean')) return 'Pant';
  if (n.includes('baby') || n.includes('kid') || n.includes('child')) return 'Baby';
  if (n.includes('cosmetic') || n.includes('makeup') || n.includes('beauty') || n.includes('cream') || n.includes('lip')) return 'Cosmetics';
  if (n.includes('under') || n.includes('lingerie') || n.includes('night') || n.includes('bra') || n.includes('panty')) return 'Undergarments';
  if (n.includes('gadget') || n.includes('electronic')) return 'Gadgets';
  return 'Others';
}

export const POST: RequestHandler = async ({ request }) => {
  assertAdmin(request);
  const b = await request.json().catch(() => ({}));
  const vendorId = Number(b?.vendorId);
  const action = String(b?.action || '');
  if (!vendorId) throw error(400, 'vendorId is required');

  const a = adminClient();
  const { data: vendor } = await a.from('vendors').select('id,store_name,website_url').eq('id', vendorId).maybeSingle();
  if (!vendor) throw error(404, 'Vendor not found');

  // ── set/fix the website URL ──
  if (action === 'set-url') {
    const raw = String(b?.website_url || '').trim();
    const url = raw && !/^https?:\/\//i.test(raw) ? 'https://' + raw : raw;
    const { error: e } = await a.from('vendors').update({ website_url: url || null }).eq('id', vendorId);
    if (e) throw error(500, e.message);
    return json({ ok: true, website_url: url });
  }

  // ── website sync (Shopify feed / WooCommerce Store API / JSON-LD / sitemap / AI) ──
  if (action === 'sync') {
    if (!vendor.website_url) throw error(400, 'Set a website URL for this vendor first');
    try {
      const result = await syncVendor(a, vendor as any);
      return json({ ok: true, ...result });
    } catch (e: any) {
      throw error(502, 'Sync failed: ' + (e?.message || 'unknown error'));
    }
  }

  // ── deep import (headless Chromium render) ──
  if (action === 'deep') {
    if (!vendor.website_url) throw error(400, 'Set a website URL for this vendor first');
    let items: { name: string; price: number; imageUrl: string }[];
    try {
      items = await renderAndExtract(vendor.website_url);
    } catch {
      throw error(503, 'Deep render is unavailable right now — the standard Sync works for most sites.');
    }
    const { data: existing } = await a.from('products').select('name').eq('vendor_id', vendorId);
    const have = new Set((existing || []).map((p: any) => String(p.name || '').toLowerCase().trim()));
    const rows = items
      .filter((it) => it.name && !have.has(it.name.toLowerCase().trim()))
      .slice(0, 60)
      .map((it) => ({
        name: it.name.slice(0, 200),
        price: Number(it.price) || 0,
        category: 'Others',
        description: `Imported from ${vendor.store_name}`,
        image_url: it.imageUrl || '',
        stock_quantity: 10,
        vendor_id: vendorId,
        is_active: false
      }));
    if (!rows.length) return json({ ok: true, imported: 0, found: items.length });
    const { error: ie } = await a.from('products').insert(rows);
    if (ie) throw error(500, ie.message);
    return json({ ok: true, imported: rows.length, found: items.length });
  }

  // ── photo / folder AI import — ONE image per call (the UI loops for a whole folder) ──
  if (action === 'photo') {
    const image = String(b?.image || '');
    if (!image.startsWith('data:image')) throw error(400, 'A product image (data URL) is required');
    const s = await withTimeout(gemini.analyzeProductImage(image), 45000);
    if (!s) throw error(503, 'Aura vision is busy — please try again in a moment');
    // Store the image in public Storage (a clean URL, not a giant base64 blob in the DB).
    let imageUrl = '';
    try {
      imageUrl = await uploadAsset(image, 'imports/product');
    } catch {
      imageUrl = ''; // non-fatal — the listing still imports, admin can add an image in Review
    }
    const row: Record<string, any> = {
      name: String(s.title || 'Imported item').slice(0, 200),
      price: s.suggested_price_bdt ? Math.round(Number(s.suggested_price_bdt)) : 0,
      category: snapCat(s.category),
      description: [s.description_bn, s.description_en].filter(Boolean).join('\n\n').slice(0, 500),
      image_url: imageUrl,
      stock_quantity: 10,
      vendor_id: vendorId,
      is_active: false
    };
    // Aura auto-verification: score the listing so Review shows a trust verdict (non-fatal).
    try {
      const m = await withTimeout(gemini.moderateListing(row.name, row.description, row.price, row.category), 12000);
      if (m) { row.moderation_score = Math.round(Number(m.trust_score) || 0); row.moderation_note = m.note || null; }
    } catch { /* Gemini busy / columns absent — cron backfill scores it later */ }
    const { error: ie } = await a.from('products').insert(row);
    if (ie) throw error(500, ie.message);
    return json({ ok: true, imported: 1, name: row.name });
  }

  throw error(400, 'Unknown import action');
};
