import { json, error } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

// P5 — DEEP IMPORT (opt-in, heavy). Renders a vendor's site in a real headless Chromium so
// pure-SPA shops (products injected by JS, images lazy-loaded from private storage) can be
// imported when the fast static importer (/api/vendor/sync — Shopify feed + JSON-LD +
// og:image) can't see them. Products are inserted as pending (is_active:false) for admin
// review, exactly like the static importer. Big + slow → separate route, own maxDuration.
export const config = { maxDuration: 60, memory: 1536 };

function adminClient(): SupabaseClient {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw error(500, 'Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function requireVendor(request: Request): Promise<string> {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw error(401, 'Missing vendor session');
  const admin = adminClient();
  const { data: u, error: e } = await admin.auth.getUser(token);
  if (e || !u?.user?.email) throw error(401, 'Session expired — please sign in again');
  return u.user.email;
}

// Launch @sparticuz/chromium + puppeteer-core, render the URL (with lazy-load scroll),
// and heuristically pull product tiles (name + price + image) from the live DOM.
async function renderAndExtract(targetUrl: string): Promise<{ name: string; price: number; imageUrl: string }[]> {
  const chromium = (await import('@sparticuz/chromium')).default;
  const puppeteer = await import('puppeteer-core');

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 1800 },
    executablePath: await chromium.executablePath(),
    headless: true
  });
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (compatible; AuraNeuralGrid/1.0; +https://www.snehalata.com)');
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
    // Trigger lazy-load: scroll the page in steps, then settle.
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let y = 0;
        const step = () => {
          window.scrollTo(0, y);
          y += 700;
          if (y < document.body.scrollHeight && y < 12000) setTimeout(step, 180);
          else resolve();
        };
        step();
      });
    });
    await new Promise((r) => setTimeout(r, 1500));

    const items = await page.evaluate(() => {
      const priceRe = /(?:৳|Tk\.?|BDT|Rs\.?|\$)\s?[\d,]{2,}|[\d,]{3,}\s?(?:৳|টাকা|tk)/i;
      const out: { name: string; price: number; imageUrl: string }[] = [];
      const seen = new Set<string>();
      const imgs = Array.from(document.querySelectorAll('img')) as HTMLImageElement[];
      for (const img of imgs) {
        const src = img.currentSrc || img.src || '';
        if (!src || src.startsWith('data:')) continue;
        if (/logo|icon|sprite|banner|favicon|placeholder|avatar/i.test(src)) continue;
        const w = img.naturalWidth || img.width || 0;
        if (w && w < 90) continue; // skip tiny UI images
        // walk up to find a container that also carries a price
        let el: HTMLElement | null = img;
        let container: HTMLElement | null = null;
        let priceText = '';
        for (let i = 0; i < 6 && el; i++) {
          el = el.parentElement;
          if (!el) break;
          const t = (el as HTMLElement).innerText || '';
          const m = t.match(priceRe);
          if (m) {
            container = el;
            priceText = m[0];
            break;
          }
        }
        if (!container) continue;
        const lines = ((container.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean)).filter((s) => !priceRe.test(s));
        const name = (lines.filter((s) => s.length >= 3 && s.length <= 100).sort((a, b) => a.length - b.length)[0] || (img.alt || '').trim());
        if (!name) continue;
        const digits = (priceText.match(/[\d,]{2,}/) || [''])[0].replace(/,/g, '');
        const price = parseInt(digits) || 0;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ name: name.slice(0, 200), price, imageUrl: src });
        if (out.length >= 80) break;
      }
      return out;
    });
    return items;
  } finally {
    await browser.close().catch(() => {});
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const email = await requireVendor(request);
  const admin = adminClient();

  // Resolve the caller's vendor + website.
  const { data: vendor } = await admin
    .from('vendors')
    .select('id,store_name,website_url')
    .eq('email', email)
    .maybeSingle();
  if (!vendor) throw error(404, 'Vendor not found');
  if (!vendor.website_url) throw error(400, 'Add your website URL first, then Deep Import.');

  let items: { name: string; price: number; imageUrl: string }[];
  try {
    items = await renderAndExtract(vendor.website_url);
  } catch (e: any) {
    // Headless not available (e.g. bundle/size limit) or the site blocked rendering.
    throw error(503, 'Deep render is unavailable right now — the standard Import still works for most sites.');
  }

  const { data: existing } = await admin.from('products').select('name').eq('vendor_id', vendor.id);
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
      vendor_id: vendor.id,
      is_active: false
    }));

  if (!rows.length) return json({ ok: true, imported: 0, found: items.length });
  const { error: insErr } = await admin.from('products').insert(rows);
  if (insErr) throw error(500, insErr.message);
  return json({ ok: true, imported: rows.length, found: items.length });
};
