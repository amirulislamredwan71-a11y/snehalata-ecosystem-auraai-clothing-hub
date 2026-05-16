import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const fetchVendorsFromSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('vendors').select('*');
};

export const fetchProductsFromSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('products').select('*');
};

export const fetchCategoriesFromSupabase = async () => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('categories').select('*');
};

export const addVendorToSupabase = async (vendor: any) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('vendors').insert(vendor);
};

export const addProductToSupabase = async (product: any) => {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return supabase.from('products').insert(product);
};
