import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { adminClient, syncVendor, isApproved } from '$lib/server/vendorSync';
import { embedText, moderateListing } from '$lib/server/gemini.server';
import { withTimeout } from '$lib/seedCatalog';
import type { RequestHandler } from './$types';

// Safety-net: guarantee every product eventually gets embedded + moderated, even
// if the vendor-POST's background waitUntil didn't fire. Best-effort, batched.
async function enrichPendingProducts(a: ReturnType<typeof adminClient>) {
  const out = { embedded: 0, moderated: 0 };
  try {
    const { data: toEmbed } = await a
      .from('products').select('id,name,category,description').is('embedding', null).limit(30);
    for (const p of toEmbed || []) {
      const emb = await withTimeout(embedText([p.name, p.category, p.description].filter(Boolean).join('. ')), 10000);
      if (emb) { await a.from('products').update({ embedding: `[${emb.join(',')}]` }).eq('id', p.id); out.embedded++; }
    }
  } catch { /* embedding column not migrated / Gemini offline — ignore */ }
  try {
    const { data: toMod } = await a
      .from('products').select('id,name,category,description,price').is('moderation_score', null).limit(40);
    for (const p of toMod || []) {
      const m = await withTimeout(moderateListing(p.name, p.description || '', Number(p.price) || 0, p.category || 'Others'), 12000);
      if (m) {
        const patch: any = { moderation_score: Math.round(Number(m.trust_score) || 0), moderation_note: m.note || null };
        if (m.verdict === 'REVIEW') patch.is_active = false;
        await a.from('products').update(patch).eq('id', p.id); out.moderated++;
      }
    }
  } catch { /* moderation columns not migrated / Gemini offline — ignore */ }
  return out;
}

// Re-syncing several vendors (each a scrape + Gemini call) needs a long budget.
export const config = { maxDuration: 60 };

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
  // Guarantee enrichment for any products the fast-path waitUntil may have missed.
  const enrich = await enrichPendingProducts(a);

  return json({ ok: true, totalImported: total, vendors: results, enrich });
};
