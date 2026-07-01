import { json, error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

// Public vendor self-registration. Creates a Supabase Auth login + a vendor row
// with status 'pending' (admin must approve before the vendor goes live).
export const POST: RequestHandler = async ({ request }) => {
  const b = await request.json();
  const shopName = (b.shopName || '').trim();
  const email = (b.email || '').trim().toLowerCase();
  const password = b.password || '';
  if (!shopName || !email || !password) throw error(400, 'Shop name, email and password are required');
  if (String(password).length < 6) throw error(400, 'Password must be at least 6 characters');

  const a = adminClient();

  // Reject if a vendor already uses this email
  const { data: dup } = await a.from('vendors').select('id').eq('email', email).maybeSingle();
  if (dup) throw error(409, 'A vendor is already registered with this email');

  // Create the auth login (ignore "already registered" so re-tries work)
  const { error: ae } = await a.auth.admin.createUser({ email, password, email_confirm: true });
  if (ae && !/already|registered|exists/i.test(ae.message)) throw error(400, ae.message);

  const row = {
    store_name: shopName,
    owner_name: (b.ownerName || '').trim(),
    email,
    status: 'pending',
    description: b.description || '',
    website_url: b.websiteUrl || '',
    district: b.district || '',
    area: b.area || '',
    category_id: b.category_id ? Number(b.category_id) : null,
    vendor_type: b.vendorType || 'SUBDOMAIN'
  };
  const { data: vend, error: ve } = await a.from('vendors').insert(row).select().single();
  if (ve) throw error(500, ve.message);

  return json({ ok: true, vendor: vend });
};
