import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as gemini from '$lib/server/gemini.server';
import { withTimeout } from '$lib/seedCatalog';

export function adminClient(): SupabaseClient {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isApproved(status: unknown): boolean {
  return String(status ?? '').toUpperCase() === 'APPROVED';
}

// ─────────────────────────────────────────────────────────────────────────────
// Robust "give us your link" catalog importer. Tries the reliable, FREE, structured
// paths first (Shopify feed → JSON-LD → sitemap sweep) and only falls back to the AI
// text extractor when a site has no machine-readable product data. This is what lets
// a website-owning brand onboard with ZERO re-typing — and the daily cron keeps it fresh.
// ─────────────────────────────────────────────────────────────────────────────

export type ImportedProduct = {
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category?: string;
  url?: string; // the product's own page — used to recover an image when JSON-LD omits it
  confidence?: number;
};

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// The bare domain and its www. counterpart, so a store that only serves (or only
// keeps a valid cert / feed) on one host still imports. axios follows clean 3xx
// redirects on its own; this covers the cases where the other host hard-fails.
function originVariants(origin: string): string[] {
  try {
    const u = new URL(origin);
    const alt = u.host.startsWith('www.') ? u.host.slice(4) : 'www.' + u.host;
    const a = `${u.protocol}//${u.host}`;
    const b = `${u.protocol}//${alt}`;
    return a === b ? [a] : [a, b];
  } catch {
    return [origin];
  }
}

async function httpGet(target: string, timeout = 12000): Promise<any | null> {
  try {
    const r = await axios.get(target, {
      headers: {
        'User-Agent': UA,
        // Browser-like headers reduce Cloudflare/WAF "bot" blocks that silently 403 a bare UA.
        'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout,
      maxContentLength: 12_000_000,
      maxRedirects: 5,
      // Some feeds/sites 403 without a referer; keep it forgiving.
      validateStatus: (s) => s >= 200 && s < 400
    });
    return r.data ?? null;
  } catch {
    return null;
  }
}

function toAbsolute(src: string, origin: string): string {
  if (!src) return '';
  try {
    return new URL(src, origin).href;
  } catch {
    return src;
  }
}

function parsePrice(v: any): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : 0;
}

function pickImage(img: any, origin: string): string {
  if (!img) return '';
  if (typeof img === 'string') return toAbsolute(img, origin);
  if (Array.isArray(img)) return pickImage(img[0], origin);
  if (typeof img === 'object') return toAbsolute(img.url || img.src || img.contentUrl || '', origin);
  return '';
}

// ── 1. Shopify: /products.json returns the WHOLE catalog, cleanly, in a few calls ──
async function fromShopify(origin: string): Promise<ImportedProduct[]> {
  const out: ImportedProduct[] = [];
  for (let page = 1; page <= 4; page++) {
    const data = await httpGet(`${origin}/products.json?limit=250&page=${page}`, 10000);
    const list = data && Array.isArray(data.products) ? data.products : null;
    if (!list || !list.length) break;
    for (const p of list) {
      const variant = Array.isArray(p.variants) ? p.variants[0] : null;
      out.push({
        name: String(p.title || '').trim(),
        price: parsePrice(variant?.price),
        imageUrl: pickImage(p.images, origin),
        description: cheerio.load(String(p.body_html || '')).text().trim().slice(0, 500),
        category: String(p.product_type || '').trim() || undefined,
        confidence: 100
      });
    }
    if (list.length < 250) break;
  }
  return out.filter((p) => p.name);
}

// ── 1b. WooCommerce Store API (public, no auth) — the full catalog as JSON on any WP/Woo
// store. A huge share of BD shops run WooCommerce, which has NO /products.json (that's
// Shopify) but DOES expose /wp-json/wc/store/v1/products. Prices are in minor units. ──
async function fromWooStore(origin: string): Promise<ImportedProduct[]> {
  const out: ImportedProduct[] = [];
  for (const base of [`${origin}/wp-json/wc/store/v1/products`, `${origin}/wp-json/wc/store/products`]) {
    for (let page = 1; page <= 4; page++) {
      const data = await httpGet(`${base}?per_page=100&page=${page}`, 10000);
      const list = Array.isArray(data) ? data : null;
      if (!list || !list.length) break;
      for (const p of list) {
        const minor = Number(p?.prices?.currency_minor_unit ?? 2);
        const raw = p?.prices?.price ?? p?.prices?.sale_price ?? p?.prices?.regular_price;
        const price = raw != null && raw !== '' ? Number(raw) / Math.pow(10, minor) : 0;
        out.push({
          name: String(p?.name || '').trim(),
          price: Number.isFinite(price) ? price : 0,
          imageUrl: p?.images?.[0]?.src ? String(p.images[0].src) : '',
          description: cheerio.load(String(p?.short_description || '')).text().trim().slice(0, 500),
          category: Array.isArray(p?.categories) && p.categories[0]?.name ? String(p.categories[0].name) : undefined,
          url: p?.permalink ? String(p.permalink) : undefined,
          confidence: 100
        });
      }
      if (list.length < 100) break;
    }
    if (out.length) break; // v1 worked → skip the legacy path
  }
  return out.filter((p) => p.name);
}

// ── 2. JSON-LD Product schema (Shopify, Woo, Wix, most SEO'd customs emit this) ──
// Deep-walks the whole graph so it catches BOTH plain `Product` nodes AND the nested
// `Store → OfferCatalog → Offer → itemOffered:Product` shape (price sits on the Offer).
function jsonLdProducts(html: string, origin: string): ImportedProduct[] {
  const out: ImportedProduct[] = [];
  const $ = cheerio.load(html);
  $('script[type="application/ld+json"]').each((_, el) => {
    let json: any;
    try {
      json = JSON.parse($(el).contents().text());
    } catch {
      return;
    }
    const visit = (n: any) => {
      if (!n || typeof n !== 'object') return;
      if (Array.isArray(n)) return n.forEach(visit);
      const types = ([] as string[]).concat(n['@type'] || []).map(String);
      if (types.includes('Offer') && n.itemOffered && typeof n.itemOffered === 'object') {
        const p = n.itemOffered;
        out.push({
          name: String(p.name || '').trim(),
          price: parsePrice(n.price ?? n.lowPrice ?? p.price),
          imageUrl: pickImage(p.image || n.image, origin),
          description: String(p.description || '').trim().slice(0, 500),
          category: String(p.category || '').trim() || undefined,
          url: p.url || n.url ? toAbsolute(String(p.url || n.url), origin) : undefined,
          confidence: 90
        });
      } else if (types.includes('Product')) {
        const offers = Array.isArray(n.offers) ? n.offers[0] : n.offers;
        out.push({
          name: String(n.name || '').trim(),
          price: parsePrice(offers?.price ?? offers?.lowPrice ?? n.price),
          imageUrl: pickImage(n.image, origin),
          description: String(n.description || '').trim().slice(0, 500),
          category: String(n.category || '').trim() || undefined,
          url: n.url || offers?.url ? toAbsolute(String(n.url || offers?.url), origin) : undefined,
          confidence: 90
        });
      }
      for (const k of Object.keys(n)) visit(n[k]); // recurse into every value
    };
    visit(json);
  });
  return out.filter((p) => p.name);
}

// ── 3. Sitemap sweep — for non-Shopify sites, collect product URLs and extract each ──
// Per product page: JSON-LD Product first; if none, fall back to OpenGraph tags (og:title/
// og:image/price). The og fallback is what lets custom + SPA stores that only server-inject
// per-product meta (no JSON-LD) still import — the common case for Laravel/React BD shops.
async function fromSitemap(origin: string, cap = 48): Promise<ImportedProduct[]> {
  const seen = new Set<string>();
  const productUrls: string[] = [];
  const sitemaps = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/product-sitemap.xml`,
    `${origin}/sitemap-products.xml`
  ];
  const queue = [...sitemaps];
  const tried = new Set<string>();
  let fetched = 0;
  while (queue.length && productUrls.length < cap && fetched < 10) {
    const sm = queue.shift()!;
    if (tried.has(sm)) continue;
    tried.add(sm);
    const xml = await httpGet(sm, 8000);
    if (!xml || typeof xml !== 'string') continue;
    fetched++;
    const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);
    for (const loc of locs) {
      if (/\.xml($|\?|\.gz)/i.test(loc)) {
        // Follow child sitemaps; prioritise ones that look product/catalog-related.
        if (/product|catalog|shop|item|collection/i.test(loc)) queue.unshift(loc);
        else queue.push(loc);
        continue;
      }
      // Match /product/<slug>, /products/<slug>, /shop/<slug>, /item/<slug>, /p/<slug>.
      if (/\/(product|products|shop|item|p)\/[^/]/i.test(loc) && !seen.has(loc)) {
        seen.add(loc);
        productUrls.push(loc);
      }
    }
  }
  const out: ImportedProduct[] = [];
  // Small concurrency so we stay within the serverless budget.
  const batch = 6;
  for (let i = 0; i < productUrls.length && i < cap; i += batch) {
    const slice = productUrls.slice(i, i + batch);
    const pages = await Promise.all(slice.map((u) => httpGet(u, 8000).then((h) => [u, h] as const)));
    for (const [u, html] of pages) {
      if (typeof html !== 'string') continue;
      const ld = jsonLdProducts(html, origin);
      if (ld.length) {
        out.push(...ld);
      } else {
        const og = ogProduct(html, origin, u); // custom/SPA stores: per-product OpenGraph
        if (og) out.push(og);
      }
    }
  }
  return out;
}

// ── 4. AI fallback — unstructured site: let Gemini read the visible text ──
async function geminiFallback(html: string): Promise<ImportedProduct[]> {
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, svg').remove();
  const body = ($('body').html() || '').substring(0, 18000);
  for (let i = 0; i < 2; i++) {
    const result = await withTimeout(gemini.analyzeWebsiteProducts(body), 22000);
    if (result) return (result.products || []) as ImportedProduct[];
    await new Promise((r) => setTimeout(r, 1500));
  }
  return [];
}

// Extract a representative image from a product page when its JSON-LD had none:
// og:image / twitter:image / the first real JSON-LD product image on that page.
function ogImage(html: string, origin: string): string {
  const og =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (og?.[1]) return toAbsolute(og[1], origin);
  const ld = jsonLdProducts(html, origin).find((p) => p.imageUrl);
  return ld?.imageUrl || '';
}

// Read a <meta property|name="X" content="Y"> value (either attribute order).
function metaContent(html: string, key: string): string {
  const k = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]+content=["']([^"']*)["']`, 'i')) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${k}["']`, 'i'));
  return m?.[1] ? m[1].trim() : '';
}

// Best-effort price from a product page: OpenGraph/product price meta first, else the
// first BDT/৳/Tk price token in the HTML. Returns 0 when the price is client-rendered.
function extractPrice(html: string): number {
  const meta =
    metaContent(html, 'product:price:amount') ||
    metaContent(html, 'og:price:amount') ||
    metaContent(html, 'twitter:data1');
  if (meta) {
    const p = parsePrice(meta);
    if (p > 0) return p;
  }
  const m = html.match(/(?:৳|Tk\.?|BDT|Rs\.?)\s?([0-9][0-9,]{1,7})(?:\.[0-9]{1,2})?/i);
  return m ? parsePrice(m[1]) : 0;
}

// Build ONE product from a product page's OpenGraph tags — the reliable path for custom
// & SPA stores (Laravel/React/Vue) that render products client-side but STILL server-inject
// per-product og:title / og:image for SEO (e.g. koreanmartbd.com). JSON-LD is preferred
// (fromSitemap tries it first); this catches the large class of sites that lack it.
function ogProduct(html: string, origin: string, url: string): ImportedProduct | null {
  const type = metaContent(html, 'og:type').toLowerCase();
  const title = metaContent(html, 'og:title') || metaContent(html, 'twitter:title');
  const image = metaContent(html, 'og:image') || metaContent(html, 'twitter:image');
  if (!title || !image) return null;
  // Skip non-product og pages (home / blog / category) unless the URL itself is a product.
  const looksProduct = /\/(product|products|item|p)\//i.test(url);
  if (!looksProduct && type && !type.includes('product')) return null;
  return {
    name: title.slice(0, 200),
    price: extractPrice(html),
    imageUrl: toAbsolute(image, origin),
    description: (metaContent(html, 'og:description') || '').slice(0, 500),
    category: undefined,
    url,
    confidence: 72
  };
}

// For products that came through without an image but DO have their own page URL,
// fetch that page and recover the image. Capped + concurrent to respect the budget.
async function enrichImages(items: ImportedProduct[], origin: string, cap = 30): Promise<void> {
  const need = items.filter((p) => !p.imageUrl && p.url).slice(0, cap);
  const batch = 6;
  for (let i = 0; i < need.length; i += batch) {
    const slice = need.slice(i, i + batch);
    const pages = await Promise.all(slice.map((p) => httpGet(p.url!, 8000)));
    slice.forEach((p, j) => {
      const html = pages[j];
      if (typeof html === 'string') p.imageUrl = ogImage(html, origin);
    });
  }
}

function dedupeByName(items: ImportedProduct[]): ImportedProduct[] {
  const map = new Map<string, ImportedProduct>();
  const score = (x: ImportedProduct) => (x.price > 0 ? 2 : 0) + (x.imageUrl ? 1 : 0);
  for (const it of items) {
    const k = it.name.toLowerCase().trim();
    if (!k) continue;
    const prev = map.get(k);
    if (!prev || score(it) > score(prev)) map.set(k, it); // keep the richest version
  }
  return [...map.values()];
}


// Per-import diagnostics — so the admin sees WHICH strategy ran and WHY a store yielded
// 0 products, instead of a silent black box. Surfaced by the sync endpoints.
export type ImportDiag = {
  origin: string;
  engine: string; // shopify | woo | sitemap | jsonld | structured+ai | ai | none
  shopify: number;
  woo: number;
  jsonld: number; // homepage JSON-LD
  sitemap: number; // JSON-LD + OpenGraph swept from product pages
  ai: number;
  note?: string;
};

/** Import a vendor's whole catalog from their website — structured first, AI last. */
export async function scrapeProducts(url: string, diag: Partial<ImportDiag> = {}): Promise<ImportedProduct[]> {
  const target = normalizeUrl(url);
  let origin = target;
  try {
    origin = new URL(target).origin;
  } catch {
    /* keep as-is */
  }
  Object.assign(diag, { origin, engine: 'none', shopify: 0, woo: 0, jsonld: 0, sitemap: 0, ai: 0 });

  // 1 / 1b. Structured whole-catalog feeds — try the given host AND its www. counterpart
  // (a store may only serve a valid cert / feed on one of them).
  for (const o of originVariants(origin)) {
    const shopify = await fromShopify(o);
    if (shopify.length) {
      diag.shopify = shopify.length; diag.engine = 'shopify'; diag.origin = o;
      return dedupeByName(shopify);
    }
    const woo = await fromWooStore(o);
    if (woo.length) {
      diag.woo = woo.length; diag.engine = 'woo'; diag.origin = o;
      return dedupeByName(woo);
    }
  }

  const html = await httpGet(target, 12000);
  if (typeof html === 'string') {
    // 2. JSON-LD on the landing page.
    const onPage = jsonLdProducts(html, origin);
    // 3. Sitemap sweep — FULL catalog via JSON-LD OR OpenGraph on each product page.
    const swept = await fromSitemap(origin);
    diag.jsonld = onPage.length;
    diag.sitemap = swept.length;
    const structured = dedupeByName([...onPage, ...swept]);
    if (structured.length) {
      // Recover images for products whose JSON-LD omitted them (fetch their page → og:image).
      await enrichImages(structured, origin);
    }
    if (structured.length >= 3) {
      diag.engine = swept.length >= onPage.length ? 'sitemap' : 'jsonld';
      return structured;
    }
    if (structured.length) {
      // A couple structured hits — try AI too and merge for better coverage.
      const ai = await geminiFallback(html);
      diag.ai = ai.length; diag.engine = 'structured+ai';
      return dedupeByName([...structured, ...ai]);
    }
    // 4. No structured data at all → AI reads the visible page.
    const ai = await geminiFallback(html);
    diag.ai = ai.length; diag.engine = ai.length ? 'ai' : 'none';
    if (!ai.length) {
      diag.note =
        'No Shopify/WooCommerce feed, no JSON-LD or OpenGraph product pages in the sitemap, and nothing the AI could read on the homepage. This is almost certainly a client-rendered (SPA) store with no public product feed — it needs the store’s own API or a headless render to import.';
    }
    return dedupeByName(ai);
  }
  diag.note = `Could not fetch ${target} — the site blocked the request, is down, or is behind a bot challenge (Cloudflare/WAF).`;
  return [];
}

// Snap a scraped/free-form source category onto a real storefront category so imported
// products (once approved) never land in an orphan category the home rail can't show.
// Mirrors the dashboard snapCategory; "Others" is the safe catch-all.
function snapImportedCategory(raw?: string): string {
  const n = String(raw || '').toLowerCase().trim();
  if (!n) return 'Others';
  const KNOWN = ['saree', 'panjabi', 'three-piece', 'borka', 'shirt', 't-shirt', 'pant', 'baby', 'cosmetics', 'undergarments', 'gadgets', 'others'];
  const exact = KNOWN.find((c) => c === n);
  if (exact) return exact.replace(/\b\w/g, (m) => m.toUpperCase());
  if (n.includes('saree') || n.includes('sari')) return 'Saree';
  if (n.includes('panjabi') || n.includes('punjabi') || n.includes('kurta')) return 'Panjabi';
  if (n.includes('three') || n.includes('3-piece') || n.includes('3 piece') || n.includes('salwar') || n.includes('kameez')) return 'Three-Piece';
  if (n.includes('borka') || n.includes('borkha') || n.includes('burka') || n.includes('hijab') || n.includes('niqab') || n.includes('nikab') || n.includes('abaya')) return 'Borka';
  if (n.includes('t-shirt') || n.includes('tshirt') || n.includes('tee')) return 'T-Shirt';
  if (n.includes('shirt')) return 'Shirt';
  if (n.includes('pant') || n.includes('trouser') || n.includes('jean') || n.includes('cargo') || n.includes('gabardine')) return 'Pant';
  if (n.includes('baby') || n.includes('kid') || n.includes('child') || n.includes('infant')) return 'Baby';
  if (n.includes('cosmetic') || n.includes('makeup') || n.includes('beauty') || n.includes('skin') || n.includes('cream') || n.includes('lipstick')) return 'Cosmetics';
  if (n.includes('under') || n.includes('lingerie') || n.includes('night') || n.includes('bra') || n.includes('panty')) return 'Undergarments';
  if (n.includes('gadget') || n.includes('electronic') || n.includes('device')) return 'Gadgets';
  return 'Others';
}

/**
 * Sync one vendor's catalog from their own website into snehalata's DB.
 * Idempotent: only inserts products whose name isn't already present for the
 * vendor (so daily re-syncs don't create duplicates). Vendor-scoped via vendor_id.
 */
export async function syncVendor(
  a: SupabaseClient,
  vendor: { id: number; store_name: string; website_url?: string | null }
) {
  if (!vendor.website_url) return { imported: 0, found: 0, note: 'no website configured' };

  const diagnostics: Partial<ImportDiag> = {};
  const items = await scrapeProducts(vendor.website_url, diagnostics);
  const { data: existing } = await a.from('products').select('name').eq('vendor_id', vendor.id);
  const have = new Set((existing || []).map((p: any) => String(p.name || '').toLowerCase().trim()));

  const rows = items
    .filter((it) => it?.name && (it.confidence === undefined || Number(it.confidence) >= 40))
    .filter((it) => !have.has(String(it.name).toLowerCase().trim()))
    .map((it) => ({
      name: String(it.name).slice(0, 200),
      price: Number(it.price) || 0,
      category: snapImportedCategory(it.category),
      description: (it.description || `Imported from ${vendor.store_name}`).slice(0, 500),
      image_url: it.imageUrl || '',
      stock_quantity: 10,
      vendor_id: vendor.id,
      is_active: false // pending admin review before going live on the storefront
    }));

  if (!rows.length) return { imported: 0, found: items.length, diagnostics };
  const { error } = await a.from('products').insert(rows);
  if (error) throw new Error(error.message);
  return { imported: rows.length, found: items.length, diagnostics };
}
