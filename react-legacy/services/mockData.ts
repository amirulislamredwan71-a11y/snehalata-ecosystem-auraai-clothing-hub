import { Product, Vendor, Order, EcosystemStats, Category } from '../types';
import { 
    supabase, 
    fetchVendorsFromSupabase, 
    fetchProductsFromSupabase,
    fetchCategoriesFromSupabase
} from './supabaseClient';

// --- PERSISTENCE LAYER (Acting as Database) ---
const loadFromDB = <T>(key: string): T[] => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : [];
    } catch {
        return [];
    }
};

const saveToDB = (key: string, data: any[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const getDeletedIds = (): (string | number)[] => loadFromDB('aura_deleted_ids');
const trackDeletedId = (id: string | number) => {
    const deleted = getDeletedIds();
    if (!deleted.includes(id)) {
        deleted.push(id);
        saveToDB('aura_deleted_ids', deleted);
    }
};

// --- INITIAL SEED DATA ---
const INITIAL_VENDORS: any[] = [
  {
    id: 1,
    store_name: "Royal Bengal Looms (রয়েল বেঙ্গল লুমস)",
    owner_name: "Artisan Guild",
    slug: "royal-bengal-looms",
    website_url: "https://royal-bengal.example.com",
    status: "APPROVED",
    description: "ঐতিহ্যবাহী জামদানি এবং মসলিন তাঁতশিল্পের গৌরব। Heritage weavers of Bangladesh.",
    tradeLicense: "TRD-2024-8899",
    category_id: 1,
    district: "Dhaka",
    area: "Dhanmondi"
  },
  {
    id: 2,
    store_name: "Urban Dhaka Streetwear (আরবান ঢাকা)",
    owner_name: "Dhaka Creative",
    slug: "urban-dhaka",
    website_url: "https://urban-dhaka.com",
    status: "APPROVED",
    description: "Gen Z-এর জন্য মডার্ন ওভারসাইজ টি-শার্ট এবং হুডি।",
    tradeLicense: "TRD-2024-1122",
    category_id: 2,
    district: "Dhaka",
    area: "Uttara"
  },
  {
    id: 3,
    store_name: "Shadow Market",
    owner_name: "Unknown",
    slug: "shadow-market",
    status: "BLOCKED",
    description: "Unverified seller detected by Aura Governance.",
    tradeLicense: "INVALID",
    district: "Unknown"
  }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 101,
    vendorId: 1,
    name: "Midnight Black জামদানি শাড়ি",
    price: 15500,
    description: "হাতে বোনা ১০০ কাউন্ট সুতার সাথে গোল্ড জড়ি কাজ। A masterpiece of Dhakai Jamdani.",
    imageUrl: "https://images.unsplash.com/photo-1610189012906-4783fda36799?q=80&w=800&auto=format&fit=crop",
    externalUrl: "https://example.com/royal-bengal/p/jamdani-black",
    category: "Saree"
  },
  {
    id: 102,
    vendorId: 1,
    name: "Heritage মসলিন পাঞ্জাবি",
    price: 8500,
    description: "রাজকীয় উৎসবের জন্য অথেনটিক ঢাকাই মসলিন।",
    imageUrl: "https://images.unsplash.com/photo-1631640989396-b1836a04e386?q=80&w=800&auto=format&fit=crop",
    category: "Panjabi"
  },
  {
    id: 201,
    vendorId: 2,
    name: "Neon Cyberpunk Hoodie",
    price: 2200,
    description: "হেভিওয়েট কটন ফ্লিস এবং পাফ প্রিন্ট ডিজাইন।",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop",
    externalUrl: "https://example.com/urban-dhaka/p/neon-hoodie",
    category: "Hoodie"
  }
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 1, name: "Jamdani Heritage", slug: "jamdani-heritage", description: "Authentic hand-loomed Jamdani masterpieces." },
  { id: 2, name: "Urban Streetwear", slug: "urban-streetwear", description: "Modern Dhaka-inspired street fashion." },
  { id: 3, name: "Traditional Muslin", slug: "traditional-muslin", description: "The legendary royal fabric of Bengal." }
];

// In-memory cache for remote data
let remoteVendors: Vendor[] = [];
let remoteProducts: Product[] = [];
let remoteCategories: Category[] = [];

/**
 * Synchronize with Supabase if available
 */
export const syncWithNeuralGrid = async () => {
    if (!supabase) return;

    try {
        const { data: cData } = await fetchCategoriesFromSupabase();
        if (cData) {
            remoteCategories = cData.map((c: any) => ({
                id: c.id,
                name: c.name,
                slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
                description: c.description
            }));
        }

        const { data: vData } = await fetchVendorsFromSupabase();
        if (vData) {
            remoteVendors = vData.map((v: any) => ({
                id: v.id,
                store_name: v.store_name,
                owner_name: v.owner_name,
                email: v.email,
                status: v.status?.toUpperCase() || 'PENDING',
                slug: v.store_name?.toLowerCase().replace(/\s+/g, '-'),
                description: v.description || "Verified Artisan Hub",
                website_url: v.website_url,
                category_id: v.category_id,
                district: v.district,
                area: v.area
            }));
            
            // Sync Stats
            MOCK_STATS.totalVendors = remoteVendors.length + INITIAL_VENDORS.length;
        }

        const { data: pData } = await fetchProductsFromSupabase();
        if (pData) {
            remoteProducts = pData.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: Number(p.price),
                category: p.category,
                imageUrl: p.image_url,
                vendorId: p.vendor_id || 1
            }));
            
            // Sync Stats
            MOCK_STATS.activeProducts = remoteProducts.length + INITIAL_PRODUCTS.length;
        }
    } catch (err) {
        console.warn("Sync failed partially. Some tables might be missing.", err);
    }

    window.dispatchEvent(new Event('productUpdated'));
};

// Initial sync
syncWithNeuralGrid();

const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-5001",
    customerName: "Rahim Ahmed",
    totalAmount: 17700,
    items: [INITIAL_PRODUCTS[0], INITIAL_PRODUCTS[2]],
    currentStatus: "SHIPPED",
    estimatedDelivery: "24 Feb, 2025",
    timeline: [
      { status: 'PLACED', label: 'অর্ডার প্লেস করা হয়েছে', timestamp: '20 Feb, 10:00 AM', completed: true, description: "Customer placed order via Aura Hub" },
      { status: 'CONFIRMED', label: 'ভেন্ডর কনফার্মেশন', timestamp: '20 Feb, 10:30 AM', completed: true, description: "Royal Bengal Looms accepted the request" },
      { status: 'QUALITY_CHECK', label: 'Aura কোয়ালিটি চেক', timestamp: '21 Feb, 02:15 PM', completed: true, description: "Passes Aura Governance Standards (Thread Count: 100)" },
      { status: 'SHIPPED', label: 'শিপিং-এর জন্য প্রস্তুত', timestamp: '22 Feb, 09:00 AM', completed: true, description: "Handed over to Pathao Courier" },
      { status: 'DELIVERED', label: 'ডেলিভারি সম্পন্ন', timestamp: '-', completed: false, description: "Estimated: 24 Feb" },
    ]
  }
];

export const MOCK_STATS: EcosystemStats = {
    totalVendors: 1250,
    activeProducts: 45000,
    monthlyVolume: 8500000,
    aiInteractions: 120000,
    trendForecast: [
        { year: "2025", trend: "Hyper-Local Craft Revival", growth: 45 },
        { year: "2026", trend: "AR/VR Shopping Standard", growth: 120 },
        { year: "2027", trend: "Carbon Neutral Logistics", growth: 85 },
        { year: "2028", trend: "Aura Automated Supply Chain", growth: 200 },
        { year: "2029", trend: "Global Artisan Bio-Labeling", growth: 155 },
        { year: "2030", trend: "Post-Physical Retail Nodes", growth: 310 }
    ]
};

// --- DATA ACCESS LAYER (API) ---

export const getVendors = (): Vendor[] => {
    const deleted = getDeletedIds();
    const dbVendors = loadFromDB<Vendor>('aura_vendors');
    const combined = [...INITIAL_VENDORS, ...dbVendors, ...remoteVendors];
    return Array.from(new Map(combined.map(item => [item.id, item])).values())
        .filter(v => !deleted.includes(v.id));
};

export const addVendor = (vendor: Vendor) => {
    const vendors = getVendors();
    if (!vendors.find(v => v.id === vendor.id)) {
        const dbVendors = loadFromDB<Vendor>('aura_vendors');
        dbVendors.push(vendor);
        saveToDB('aura_vendors', dbVendors);
        
        // Auto-generate a starter product
        const starterProduct: Product = {
            id: Date.now() + 999,
            vendorId: vendor.id,
            name: `${vendor.store_name} Starter Item`,
            price: 1500,
            description: `Signature item from the newly joined ${vendor.store_name} collection.`,
            imageUrl: `https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?q=80&w=800&auto=format&fit=crop`,
            category: "New Arrival"
        };
        addProduct(starterProduct);
    }
};

export const getProducts = (): Product[] => {
    const deleted = getDeletedIds();
    const dbProducts = loadFromDB<Product>('aura_products');
    const combined = [...INITIAL_PRODUCTS, ...dbProducts, ...remoteProducts];
    return Array.from(new Map(combined.map(item => [item.id, item])).values())
        .filter(p => !deleted.includes(p.id));
};

export const addProduct = (product: Product) => {
    const dbProducts = loadFromDB<Product>('aura_products');
    dbProducts.unshift(product);
    saveToDB('aura_products', dbProducts);
    // Trigger Real-time Update
    window.dispatchEvent(new Event('productUpdated'));
};

export const deleteProduct = (productId: number | string) => {
    // 1. Mark as deleted globally (for initial data)
    trackDeletedId(productId);

    // 2. Update localStorage
    let dbProducts = loadFromDB<Product>('aura_products');
    dbProducts = dbProducts.filter(p => p.id !== productId);
    saveToDB('aura_products', dbProducts);

    // 3. Update remote cache (in case we're in mock mode)
    remoteProducts = remoteProducts.filter(p => p.id !== productId);

    // 4. Trigger Real-time Update
    window.dispatchEvent(new Event('productUpdated'));
};

export const deleteVendor = (vendorId: number | string) => {
    // 1. Mark as deleted globally
    trackDeletedId(vendorId);

    // 2. Update localStorage
    let dbVendors = loadFromDB<Vendor>('aura_vendors');
    dbVendors = dbVendors.filter(v => v.id !== vendorId);
    saveToDB('aura_vendors', dbVendors);

    // 3. Update remote cache
    remoteVendors = remoteVendors.filter(v => v.id !== vendorId);

    window.dispatchEvent(new Event('vendorUpdated'));
};

export const deleteCategory = (categoryId: number | string) => {
    // 1. Mark as deleted globally
    trackDeletedId(categoryId);

    // 2. Update localStorage
    let dbCategories = loadFromDB<Category>('aura_categories');
    dbCategories = dbCategories.filter(c => c.id !== categoryId);
    saveToDB('aura_categories', dbCategories);

    // 3. Update remote cache
    remoteCategories = remoteCategories.filter(c => c.id !== categoryId);

    window.dispatchEvent(new Event('categoryUpdated'));
};

export const getOrders = (): Order[] => {
    const dbOrders = loadFromDB<Order>('aura_orders');
    const combined = [...dbOrders, ...INITIAL_ORDERS];
    return Array.from(new Map(combined.map(item => [item.id, item])).values());
};

export const addOrder = (order: Order) => {
    const dbOrders = loadFromDB<Order>('aura_orders');
    dbOrders.unshift(order);
    saveToDB('aura_orders', dbOrders);
    window.dispatchEvent(new Event('orderUpdated'));
};

export const getOrderById = (orderId: string): Order | undefined => {
    return getOrders().find(o => o.id === orderId);
};

export const getVendorBySlug = (slug: string) => getVendors().find(v => v.slug === slug);
export const getProductsByVendor = (vendorId: number) => getProducts().filter(p => p.vendorId === vendorId);
export const getCategories = (): Category[] => {
    const deleted = getDeletedIds();
    const dbCategories = loadFromDB<Category>('aura_categories');
    const combined = [...INITIAL_CATEGORIES, ...dbCategories, ...remoteCategories];
    return Array.from(new Map(combined.map(item => [item.id, item])).values())
        .filter(c => !deleted.includes(c.id));
};

export const getEcosystemStats = () => MOCK_STATS;
export const getLiveSales = () => 2540000;