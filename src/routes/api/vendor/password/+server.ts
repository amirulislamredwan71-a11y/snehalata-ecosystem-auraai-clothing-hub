import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

// Vendor self-service password change. Verifies the caller's Supabase session
// token, then updates their auth password via the service_role admin API.
export const POST: RequestHandler = async ({ request }) => {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) throw error(401, 'Missing vendor session');

  const { newPassword } = await request.json();
  if (!newPassword || String(newPassword).length < 6) {
    throw error(400, 'Password must be at least 6 characters');
  }

  const url = pub.PUBLIC_SUPABASE_URL;
  if (!url || !env.SUPABASE_SERVICE_ROLE_KEY) throw error(500, 'Neural Grid auth not configured');
  const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  const { data: u, error: e } = await admin.auth.getUser(token);
  if (e || !u?.user?.id) throw error(401, 'Session expired — please sign in again');

  const { error: ue } = await admin.auth.admin.updateUserById(u.user.id, { password: String(newPassword) });
  if (ue) throw error(500, ue.message);

  return json({ ok: true });
};
