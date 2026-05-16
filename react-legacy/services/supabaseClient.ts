
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables
declare const importMeta: { env: Record<string, string> };

const getEnv = (key: string) => {
    const viteEnv = typeof importMeta !== 'undefined' ? (importMeta as any).env?.[key] : undefined;
    const val = viteEnv || (typeof process !== 'undefined' && process.env?.[key]);
    return val && val !== 'undefined' && val !== 'null' ? val : '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Log status (without exposing full keys for security)
if (typeof window !== 'undefined') {
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase configuration missing. Ecosystem will run in Mock Mode. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in environment.');
    } else {
        console.log('SNEHALATA Neural Grid: Connecting to Supabase at', supabaseUrl.substring(0, 15) + '...');
    }
}

export const isSupabaseConfigured = () => {
    return !!supabaseUrl && 
           !!supabaseAnonKey && 
           supabaseUrl.startsWith('http');
}

// Initialize Supabase only if keys exist, otherwise return null to trigger mock mode
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Helper to handle errors and provide consistent response format
 */
const handleSupabaseError = (error: any, operation: string) => {
    // Check for "table not found" error (PGRST205)
    if (error?.code === 'PGRST205') {
        // Table missing is expected in some demo environments, returning silent error
        return { data: null, error: { ...error, isTableMissing: true } };
    }
    console.error(`Supabase Error (${operation}):`, error);
    return { data: null, error };
};

/**
 * Submits vendor request to Supabase.
 */
export const submitVendorToSupabase = async (vendorData: any) => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    // Map internal app field to SQL field names
    const sqlData = {
        store_name: vendorData.name,
        owner_name: vendorData.ownerName,
        email: vendorData.email || `${vendorData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        status: vendorData.status?.toLowerCase() || 'pending',
        website_url: vendorData.website_url,
        category_id: vendorData.category_id
    };

    try {
        const { data, error } = await supabase
            .from('vendors')
            .upsert([sqlData])
            .select();
        
        if (error) return handleSupabaseError(error, 'submitVendorToSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'submitVendorToSupabase');
    }
};

/**
 * Fetches all vendors from Supabase
 */
export const fetchVendorsFromSupabase = async () => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { data, error } = await supabase
            .from('vendors')
            .select('*');
        
        if (error) return handleSupabaseError(error, 'fetchVendorsFromSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'fetchVendorsFromSupabase');
    }
};

/**
 * Fetches all products from Supabase
 */
export const fetchProductsFromSupabase = async () => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*');
        
        if (error) return handleSupabaseError(error, 'fetchProductsFromSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'fetchProductsFromSupabase');
    }
};

/**
 * Adds a product to Supabase
 */
export const addProductToSupabase = async (productData: any) => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    // Map internal app field to SQL field names
    const sqlData = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        image_url: productData.imageUrl,
        stock_quantity: productData.stock_quantity || 10
    };

    try {
        const { data, error } = await supabase
            .from('products')
            .insert([sqlData])
            .select();
        
        if (error) return handleSupabaseError(error, 'addProductToSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'addProductToSupabase');
    }
};

/**
 * Deletes a product from Supabase
 */
export const deleteProductFromSupabase = async (productId: string | number) => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) return handleSupabaseError(error, 'deleteProductFromSupabase');
        return { data: true, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'deleteProductFromSupabase');
    }
};

/**
 * Updates a vendor's status in Supabase
 */
export const updateVendorStatusInSupabase = async (vendorId: string | number, status: string) => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { data, error } = await supabase
            .from('vendors')
            .update({ status: status.toLowerCase() })
            .eq('id', vendorId)
            .select();
        
        if (error) return handleSupabaseError(error, 'updateVendorStatusInSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'updateVendorStatusInSupabase');
    }
};

/**
 * Deletes a vendor from Supabase
 */
export const deleteVendorFromSupabase = async (vendorId: string | number) => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { error } = await supabase
            .from('vendors')
            .delete()
            .eq('id', vendorId);
        
        if (error) return handleSupabaseError(error, 'deleteVendorFromSupabase');
        return { data: true, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'deleteVendorFromSupabase');
    }
};

/**
 * Fetches all orders from Supabase
 */
export const fetchOrdersFromSupabase = async () => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { data, error } = await supabase
            .from('orders')
            .select('*');
        
        if (error) return handleSupabaseError(error, 'fetchOrdersFromSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'fetchOrdersFromSupabase');
    }
};

/**
 * Fetches all categories from Supabase
 */
export const fetchCategoriesFromSupabase = async () => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*');
        
        if (error) return handleSupabaseError(error, 'fetchCategoriesFromSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'fetchCategoriesFromSupabase');
    }
};

/**
 * Adds a category to Supabase
 */
export const addCategoryToSupabase = async (categoryData: any) => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { data, error } = await supabase
            .from('categories')
            .insert([{
                name: categoryData.name,
                slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
                description: categoryData.description
            }])
            .select();
        
        if (error) return handleSupabaseError(error, 'addCategoryToSupabase');
        return { data, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'addCategoryToSupabase');
    }
};

/**
 * Deletes a category from Supabase
 */
export const deleteCategoryFromSupabase = async (id: string | number) => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        
        if (error) return handleSupabaseError(error, 'deleteCategoryFromSupabase');
        return { data: true, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'deleteCategoryFromSupabase');
    }
};

/**
 * Uploads an image to Supabase Storage
 */
export const uploadImageToSupabase = async (file: File, bucket = 'products') => {
    if (!supabase) return { data: null, error: 'Supabase client not initialized' };

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file);

        if (uploadError) return handleSupabaseError(uploadError, 'uploadImageToSupabase');

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { data: publicUrl, error: null };
    } catch (err) {
        return handleSupabaseError(err, 'uploadImageToSupabase');
    }
};
