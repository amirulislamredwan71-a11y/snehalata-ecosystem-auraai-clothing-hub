import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient, syncVendor } from '$lib/server/vendorSync';
import { renderAndExtract } from '$lib/server/deepImport.server';
import type { RequestHandler } from './$types';

// Admin "Import from ANY website URL" — paste any shop link (WooCommerce / Shopify /
// WordPress / JSON-LD / SPA like glamourstouch), Aura scrapes the catalog and files the
// products under a store AUTO-CREATED from that site (a new snehalata vendor/storefront).
// NOT limited to registered vendors. Everything lands pending (is_active:false) for Review.
export const config = { maxDuration: 60, memory: 1536 };

function assertAdmin(request: Request) {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) throw error(401, 'Unauthorized — admin only');
}

function normalizeUrl(u: string): string {
  const s = String(u || '').trim();
  return /^https?:\/\//i.test(s) ? s : 'https://' + s;
}

function hostOf(u: string): string {
  try {
    return new URL(normalizeUrl(u)).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

// A clean, human store name from a domain: glamourstouch.com → "Glamourstouch".
function storeNameFromUrl(u: string): string {
  const host = hostOf(u);
  const base = (host.split('.')[0] || host).replace(/[-_]+/g, ' ').trim();
  if (!base) return 'Imported Store';
  return base.replace(/\b\w/g, (m) => m.toUpperCase());
}

export const POST: RequestHandler = async ({ request }) => {
  assertAdmin(request);
  const b = await request.json().catch(() => ({}));
  const url = normalizeUrl(b?.url || '');
  const deep = Boolean(b?.deep);
  if (!/^https?:\/\/[^\s.]+\.[^\s]+/.test(url)) throw error(400, 'A valid website URL is required');

  const a = adminClient();
  const origin = (() => {
    try {
      return new URL(url).origin;
    } catch {
      return url;
    }
  })();
  const host = hostOf(url);

  // ── find-or-create the store (vendor) for this site — idempotent by host, so a
  //    re-import of the same site fills the existing store instead of spawning a duplicate.
  const { data: allV } = await a.from('vendors').select('id,store_name,website_url').not('website_url', 'is', null);
  let vendor = (allV || []).find((v: any) => host && hostOf(v.website_url) === host) as any;

  let created = false;
  if (!vendor) {
    const store_name = String(b?.storeName || '').trim() || storeNameFromUrl(url);
    const emailSlug = (host || store_name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'store';
    const row = {
      store_name,
      owner_name: 'Imported',
      email: `import-${emailSlug}@snehalata.import`,
      status: 'approved', // a real storefront; products still land pending for Review
      website_url: origin,
      description: `Imported from ${host || url}`,
      vendor_type: 'IMPORTED',
      commission_rate: 10
    };
    const { data: ins, error: ve } = await a
      .from('vendors')
      .insert(row)
      .select('id,store_name,website_url')
      .single();
    if (ve) throw error(500, 'Could not create the store: ' + ve.message);
    vendor = ins;
    created = true;
  }

  // ── import the catalog into that store (all pending / is_active:false) ──
  let imported = 0;
  let found = 0;
  let diagnostics: any = null;

  if (deep) {
    let items: { name: string; price: number; imageUrl: string }[] = [];
    try {
      items = await renderAndExtract(url);
    } catch {
      throw error(503, 'Deep render is unavailable right now — try the normal Fetch, which works for most sites.');
    }
    found = items.length;
    const { data: existing } = await a.from('products').select('name').eq('vendor_id', vendor.id);
    const have = new Set((existing || []).map((p: any) => String(p.name || '').toLowerCase().trim()));
    const rows = items
      .filter((it) => it.name && !have.has(it.name.toLowerCase().trim()))
      .slice(0, 80)
      .map((it) => ({
        name: it.name.slice(0, 200),
        price: Number(it.price) || 0,
        category: 'Others',
        description: `Imported from ${vendor.store_name}`,
        image_url: it.imageUrl || '',
        stock_quantity: 10,
        vendor_id: vendor.id,
        is_active: false
      }));
    if (rows.length) {
      const { error: ie } = await a.from('products').insert(rows);
      if (ie) throw error(500, ie.message);
    }
    imported = rows.length;
  } else {
    // Structured import: Shopify feed / WooCommerce Store API / JSON-LD / sitemap / AI —
    // reuses the exact engine the vendor dashboard uses (scrapeProducts inside syncVendor),
    // which snaps categories + dedupes + inserts pending. Scrape the pasted URL faithfully.
    try {
      const r = await syncVendor(a, { id: vendor.id, store_name: vendor.store_name, website_url: url });
      imported = r.imported || 0;
      found = r.found || 0;
      diagnostics = (r as any).diagnostics || null;
    } catch (e: any) {
      throw error(502, 'Fetch failed: ' + (e?.message || 'unknown error'));
    }
  }

  return json({ ok: true, imported, found, diagnostics, vendor: { id: vendor.id, store_name: vendor.store_name, created } });
};
