import { json, error } from '@sveltejs/kit';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import { analyzeProductImage } from '$lib/server/gemini.server';
import { withTimeout } from '$lib/seedCatalog';
import type { RequestHandler } from './$types';

// Gemini vision can be slow under load — give the function room.
export const config = { maxDuration: 60 };

function adminClient(): SupabaseClient {
  const url = pub.PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw error(500, 'Neural Grid admin not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Only a signed-in vendor may spend AI merchandising credits.
async function requireVendor(request: Request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw error(401, 'Missing vendor session');
  const admin = adminClient();
  const { data: u, error: e } = await admin.auth.getUser(token);
  if (e || !u?.user?.email) throw error(401, 'Session expired — please sign in again');
  return u.user.email;
}

// A4 — vendor AI merchandising: one product photo → a structured listing suggestion.
export const POST: RequestHandler = async ({ request }) => {
  await requireVendor(request);

  const b = await request.json().catch(() => ({}));
  const image = typeof b?.image === 'string' ? b.image : '';
  if (!image.startsWith('data:image')) throw error(400, 'A product image (data URL) is required');

  const result = await withTimeout(analyzeProductImage(image), 45000);
  if (!result) throw error(503, 'Aura merchandising is busy — please try again in a moment');

  return json({ ok: true, suggestion: result });
};
