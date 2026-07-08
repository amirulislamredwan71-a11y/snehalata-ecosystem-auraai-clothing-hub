import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as pub } from '$env/dynamic/public';

// SERVER-ONLY. Uses the service_role key (never shipped to the browser). The
// project's legacy anon key is disabled, so anon reads 401 — all server-side
// storefront reads must go through service_role. Public reads are still safe
// because these helpers only ever SELECT storefront-safe columns/rows.
const supabaseUrl = pub.PUBLIC_SUPABASE_URL || '';
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export const fetchVendorsFromSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('vendors').select('*');
};

export const fetchProductsFromSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  // Only surface products approved/live (is_active true or legacy null) on the storefront.
  // Explicit columns — NEVER the `embedding` vector (server-only; shipping it was ~9s slow).
  return supabase
    .from('products')
    .select('id,name,price,category,image_url,description,stock_quantity,vendor_id,is_active,created_at,moderation_score')
    .or('is_active.is.null,is_active.eq.true');
};

export const fetchCategoriesFromSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('categories').select('*');
};
