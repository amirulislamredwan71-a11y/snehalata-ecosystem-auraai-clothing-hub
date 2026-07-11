import { json, error } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import { uploadAsset } from '$lib/server/siteConfig.server';
import * as gemini from '$lib/server/gemini.server';
import { withTimeout } from '$lib/seedCatalog';
import type { RequestHandler } from './$types';

// Vendor folder/multi-photo AI import — one image per call (the dashboard loops for a whole
// folder). Each photo → Gemini vision → a PENDING (is_active:false) listing for the vendor,
// which then goes through the admin Review queue like the other vendor imports.
export const config = { maxDuration: 60 };

function adminClient(): SupabaseClient {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw error(500, 'Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
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
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw error(401, 'Missing vendor session');
  const a = adminClient();
  const { data: u, error: ae } = await a.auth.getUser(token);
  if (ae || !u?.user?.email) throw error(401, 'Session expired — please sign in again');

  const { data: vendor } = await a.from('vendors').select('id,store_name').eq('email', u.user.email).maybeSingle();
  if (!vendor) throw error(403, 'No vendor node linked to this account');

  const b = await request.json().catch(() => ({}));
  const image = String(b?.image || '');
  if (!image.startsWith('data:image')) throw error(400, 'A product image (data URL) is required');

  const s = await withTimeout(gemini.analyzeProductImage(image), 45000);
  if (!s) throw error(503, 'Aura vision is busy — please try again in a moment');

  let imageUrl = '';
  try {
    imageUrl = await uploadAsset(image, 'imports/product');
  } catch {
    imageUrl = ''; // non-fatal — you can add an image later in the dashboard
  }

  const row = {
    name: String(s.title || 'Imported item').slice(0, 200),
    price: s.suggested_price_bdt ? Math.round(Number(s.suggested_price_bdt)) : 0,
    category: snapCat(s.category),
    description: [s.description_bn, s.description_en].filter(Boolean).join('\n\n').slice(0, 500),
    image_url: imageUrl,
    stock_quantity: 10,
    vendor_id: vendor.id,
    is_active: false
  };
  const { error: ie } = await a.from('products').insert(row);
  if (ie) throw error(500, ie.message);
  return json({ ok: true, imported: 1, name: row.name });
};
