import type { RequestHandler } from './$types';
import { SEED_VENDORS, SEED_PRODUCTS, mapVendorRow, mapProductRow, withTimeout } from '$lib/seedCatalog';
import { fetchVendorsFromSupabase, fetchProductsFromSupabase } from '$lib/server/supabaseClient';

const SITE = 'https://www.snehalata.com';

// CSV cell — wrap in quotes, escape embedded quotes, strip newlines.
const cell = (v: unknown) => {
  const s = String(v ?? '').replace(/\r?\n/g, ' ').replace(/"/g, '""').trim();
  return `"${s}"`;
};
const abs = (u: string) => (u?.startsWith('http') ? u : `${SITE}${u || ''}`);

// Meta / Google product catalog feed (CSV). Point Meta Commerce Manager (Data source → Data
// feed) or Google Merchant Center at https://www.snehalata.com/feed.csv → powers FB/IG Shop,
// catalog / dynamic retargeting ads, and Google Shopping — auto-refreshed from the live catalog.
export const GET: RequestHandler = async ({ setHeaders }) => {
  let vendors = [...SEED_VENDORS];
  let products = [...SEED_PRODUCTS];
  const [vRes, pRes] = await Promise.all([
    withTimeout(fetchVendorsFromSupabase(), 2500),
    withTimeout(fetchProductsFromSupabase(), 2500)
  ]);
  if (vRes?.data?.length) vendors = vRes.data.map(mapVendorRow);
  if (pRes?.data?.length) products = pRes.data.map(mapProductRow);
  const vName = new Map(vendors.map((v: any) => [Number(v.id), v.store_name]));

  const cols = ['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'product_type', 'google_product_category'];
  const rows = [cols.join(',')];
  for (const p of products) {
    if (!p || p.price == null || !p.imageUrl) continue;
    const brand = vName.get(Number(p.vendorId)) || 'Snehalata';
    const desc = (p.description && String(p.description).slice(0, 400)) || `${p.name} — যাচাই করা আসল পণ্য, ন্যায্য দামে Snehalata-তে।`;
    rows.push([
      cell(p.id),
      cell(p.name),
      cell(desc),
      cell('in stock'),
      cell('new'),
      cell(`${Number(p.price).toFixed(2)} BDT`),
      cell(`${SITE}/product/${p.id}`),
      cell(abs(p.imageUrl)),
      cell(brand),
      cell(p.category || 'Others'),
      cell('Apparel & Accessories')
    ].join(','));
  }

  setHeaders({ 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' });
  return new Response(rows.join('\n'));
};
