import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient, syncVendor, isApproved } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

// Daily Vercel Cron: re-sync every approved vendor that has a linked website,
// so their snehalata catalog mirrors their own site automatically.
// Protected by CRON_SECRET (Vercel Cron sends it as a Bearer token).
export const GET: RequestHandler = async ({ request, url }) => {
  const secret = env.CRON_SECRET;
  const provided =
    (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '') ||
    url.searchParams.get('key') ||
    '';
  if (secret && provided !== secret) throw error(401, 'Unauthorized');

  const a = adminClient();
  const { data: vendors } = await a
    .from('vendors')
    .select('id, store_name, website_url, status')
    .not('website_url', 'is', null);

  let total = 0;
  const results: any[] = [];
  for (const v of vendors || []) {
    if (!isApproved(v.status) || !v.website_url) continue;
    try {
      const r = await syncVendor(a, v);
      total += r.imported || 0;
      results.push({ vendor: v.store_name, ...r });
    } catch (e: any) {
      results.push({ vendor: v.store_name, error: e?.message || 'sync failed' });
    }
  }
  return json({ ok: true, totalImported: total, vendors: results });
};
