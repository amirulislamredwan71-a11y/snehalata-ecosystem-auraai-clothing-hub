import { json, error } from '@sveltejs/kit';
import { adminClient } from '$lib/server/vendorSync';
import type { RequestHandler } from './$types';

// Public vendor self-registration. Creates a Supabase Auth login + a vendor row
// with status 'pending' (admin must approve before the vendor goes live).
export const POST: RequestHandler = async ({ request }) => {
  const b = await request.json();
  const shopName = (b.shopName || '').trim();
  const phone = String(b.phone || '').replace(/[^0-9]/g, '');
  const emailIn = (b.email || '').trim().toLowerCase();
  const password = b.password || '';
  // Phone is the primary identity in BD (email optional). Login works with either.
  if (!shopName || !phone || !password) throw error(400, 'Shop name, phone and password are required');
  if (phone.length < 11) throw error(400, 'একটি সঠিক মোবাইল নম্বর দিন (১১ ডিজিট)');
  if (String(password).length < 6) throw error(400, 'Password must be at least 6 characters');
  // Auth account is email-keyed in Supabase → use the real email, or a synthetic one from the phone.
  const authEmail = emailIn || `v${phone}@snehalata.local`;

  const a = adminClient();

  // Reject if a vendor already uses this phone (or the real email).
  // Falls back to email-only if the `phone` column isn't migrated yet.
  let dup: any = null;
  try {
    const dupFilter = emailIn ? `phone.eq.${phone},email.eq.${authEmail}` : `phone.eq.${phone}`;
    const res = await a.from('vendors').select('id').or(dupFilter).maybeSingle();
    if (res.error) throw res.error;
    dup = res.data;
  } catch {
    if (emailIn) {
      const res = await a.from('vendors').select('id').eq('email', authEmail).maybeSingle();
      dup = res.data;
    }
  }
  if (dup) throw error(409, 'এই ফোন নম্বর/ইমেইল দিয়ে ইতিমধ্যে একটি স্টোর আছে');

  // Create the auth login (ignore "already registered" so re-tries work)
  const { error: ae } = await a.auth.admin.createUser({ email: authEmail, password, email_confirm: true });
  if (ae && !/already|registered|exists/i.test(ae.message)) throw error(400, ae.message);

  const row: Record<string, any> = {
    store_name: shopName,
    owner_name: (b.ownerName || '').trim(),
    email: authEmail,
    phone,
    status: 'pending',
    description: b.description || '',
    website_url: b.websiteUrl || '',
    district: b.district || '',
    area: b.area || '',
    category: b.category || null,
    vendor_type: b.vendorType || 'SUBDOMAIN'
  };
  let { data: vend, error: ve } = await a.from('vendors').insert(row).select().single();
  // If the `phone` column doesn't exist yet, retry without it so registration never hard-breaks.
  if (ve && /phone/i.test(ve.message) && /column|schema|does not exist/i.test(ve.message)) {
    const { phone: _drop, ...rowNoPhone } = row;
    ({ data: vend, error: ve } = await a.from('vendors').insert(rowNoPhone).select().single());
  }
  if (ve) throw error(500, ve.message);

  return json({ ok: true, vendor: vend });
};
