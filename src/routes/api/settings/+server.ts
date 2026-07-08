import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { readSiteConfig, writeSiteConfig } from '$lib/server/siteConfig.server';
import type { RequestHandler } from './$types';

// Public GET = the live site config (categories + featured) the home reads.
// Admin POST (x-admin-pass) = the Aura Control Center writes it. Reads run server-side
// with the service_role key, so no secret is exposed to the browser.

export const GET: RequestHandler = async () => {
  const cfg = await readSiteConfig();
  return json({ ok: true, categories: cfg.categories ?? null, featured: cfg.featured ?? null });
};

export const POST: RequestHandler = async ({ request }) => {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) throw error(401, 'Unauthorized — admin access denied');
  const body = await request.json();
  await writeSiteConfig({ categories: body.categories, featured: body.featured });
  return json({ ok: true });
};
