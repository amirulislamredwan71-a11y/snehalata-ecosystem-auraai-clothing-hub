import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { uploadAsset } from '$lib/server/siteConfig.server';
import type { RequestHandler } from './$types';

// Admin image upload (category covers, etc.) → public Storage URL.
export const config = { maxDuration: 30 };

export const POST: RequestHandler = async ({ request }) => {
  const pass = request.headers.get('x-admin-pass') ?? '';
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) throw error(401, 'Unauthorized');
  const body = await request.json();
  if (!body?.image) throw error(400, 'image (data URL) required');
  const url = await uploadAsset(body.image, body.prefix || 'categories/cat');
  return json({ ok: true, url });
};
