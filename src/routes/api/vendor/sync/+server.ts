import { json, error } from '@sveltejs/kit';
import { adminClient, syncVendor, isApproved } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

// Scraping + a Gemini extraction call can take >10s; allow up to 60s (Vercel).
export const config = { maxDuration: 60 };

// Vendor-triggered "Sync Now": pull products from the vendor's own website into
// snehalata's catalog (so they don't have to upload twice). Vendor-scoped via token.
export const POST: RequestHandler = async ({ request }) => {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw error(401, 'Missing vendor session');

  const a = adminClient();
  const { data: u, error: ae } = await a.auth.getUser(token);
  if (ae || !u?.user?.email) throw error(401, 'Session expired — please sign in again');

  const { data: vendor } = await a
    .from('vendors')
    .select('id, store_name, website_url, status')
    .eq('email', u.user.email)
    .single();
  if (!vendor) throw error(403, 'No vendor node linked to this account');
  if (!isApproved(vendor.status)) throw error(403, 'Your node is pending SNEHALATA approval');
  if (!vendor.website_url) throw error(400, 'No website is linked to your vendor profile');

  try {
    const result = await syncVendor(a, vendor);
    return json({ ok: true, ...result });
  } catch (e: any) {
    throw error(502, 'Website sync failed: ' + (e?.message || 'unknown error'));
  }
};
