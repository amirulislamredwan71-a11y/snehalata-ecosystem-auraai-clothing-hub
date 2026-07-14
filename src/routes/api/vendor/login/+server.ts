import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

// Vendor login via Supabase Auth (email + password). Returns the vendor's record
// and a session token used to authorize product writes in /api/vendor/products.
export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  // Accept either an email or a phone number as the identifier (+ the old `email` key).
  const identifier = String(body.identifier || body.email || '').trim();
  const password = body.password || '';
  if (!identifier || !password) throw error(400, 'ইমেইল/ফোন এবং পাসওয়ার্ড দিন');

  const url = pub.PUBLIC_SUPABASE_URL;
  if (!url || !pub.PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw error(500, 'Neural Grid auth not configured');
  }

  const admin = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Resolve the vendor by email OR phone → get the account's auth email to sign in with.
  const digits = identifier.replace(/[^0-9]/g, '');
  let vend: any = null;
  try {
    const orFilter = digits.length >= 6 ? `email.eq.${identifier.toLowerCase()},phone.eq.${digits}` : `email.eq.${identifier.toLowerCase()}`;
    const res = await admin.from('vendors').select('id, store_name, status, email, phone').or(orFilter).limit(1).maybeSingle();
    vend = res.data;
  } catch {
    // phone column not migrated yet → fall back to email-only lookup
    const res = await admin.from('vendors').select('id, store_name, status, email').eq('email', identifier.toLowerCase()).maybeSingle();
    vend = res.data;
  }
  const authEmail = (vend?.email || identifier).toLowerCase();

  const anon = createClient(url, pub.PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error: e } = await anon.auth.signInWithPassword({ email: authEmail, password });
  if (e || !data?.session) throw error(401, 'ভুল ইমেইল/ফোন বা পাসওয়ার্ড');

  if (!vend) throw error(403, 'এই আইডির সাথে কোনো স্টোর যুক্ত নেই');

  return json({ ok: true, vendor: vend, token: data.session.access_token });
};
