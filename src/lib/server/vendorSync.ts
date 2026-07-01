import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as gemini from '$lib/server/gemini.server';

export function adminClient(): SupabaseClient {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isApproved(status: unknown): boolean {
  return String(status ?? '').toUpperCase() === 'APPROVED';
}

/** Scrape a vendor's website and AI-extract its products. */
async function scrapeProducts(url: string) {
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const resp = await axios.get(target, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    },
    timeout: 12000
  });
  const $ = cheerio.load(resp.data);
  $('script, style, noscript, iframe, svg').remove();
  const body = $('body').html() || '';
  const result = await gemini.analyzeWebsiteProducts(body.substring(0, 30000));
  return result?.products || [];
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

  const items = await scrapeProducts(vendor.website_url);
  const { data: existing } = await a.from('products').select('name').eq('vendor_id', vendor.id);
  const have = new Set((existing || []).map((p: any) => String(p.name || '').toLowerCase().trim()));

  const rows = items
    .filter((it: any) => it?.name && (it.confidence === undefined || Number(it.confidence) >= 40))
    .filter((it: any) => !have.has(String(it.name).toLowerCase().trim()))
    .map((it: any) => ({
      name: String(it.name).slice(0, 200),
      price: Number(it.price) || 0,
      category: 'Imported',
      description: (it.description || `Imported from ${vendor.store_name}`).slice(0, 500),
      image_url: it.imageUrl || '',
      stock_quantity: 10,
      vendor_id: vendor.id
    }));

  if (!rows.length) return { imported: 0, found: items.length };
  const { error } = await a.from('products').insert(rows);
  if (error) throw new Error(error.message);
  return { imported: rows.length, found: items.length };
}
