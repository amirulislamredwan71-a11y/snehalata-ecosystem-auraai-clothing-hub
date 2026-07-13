import { browser } from '$app/environment';
import type { Product, Vendor, Order, EcosystemStats, Category } from '$lib/types';
import { SEED_VENDORS, SEED_PRODUCTS, SEED_CATEGORIES, SEED_STATS, mapVendorRow, mapProductRow } from '$lib/seedCatalog';

const loadFromDB = <T>(key: string): T[] => {
  if (!browser) return [];
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : [];
  } catch {
    return [];
  }
};

const saveToDB = (key: string, data: any[]) => {
  if (!browser) return;
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

// Browser-agnostic seed catalog, shared with the server-side load (see $lib/seedCatalog).
const INITIAL_VENDORS = SEED_VENDORS;
const INITIAL_PRODUCTS = SEED_PRODUCTS;
const INITIAL_CATEGORIES = SEED_CATEGORIES;

let remoteVendors: Vendor[] = [];
let remoteProducts: Product[] = [];
let remoteCategories: Category[] = [];

let syncInFlight: Promise<void> | null = null;
const _doSync = async () => {
  if (!browser) return;

  // The project's legacy anon key is disabled, so we can't read Supabase directly
  // from the browser. Fetch the live catalog through the service_role-backed
  // /api/catalog endpoint instead (falls back to seed if it fails).
  try {
    const res = await fetch('/api/catalog');
    const d = await res.json().catch(() => ({}));

    if (Array.isArray(d?.categories)) {
      remoteCategories = d.categories.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
        description: c.description
      }));
    }
    if (Array.isArray(d?.vendors)) {
      remoteVendors = d.vendors.map(mapVendorRow);
      MOCK_STATS.totalVendors = remoteVendors.length;
    }
    if (Array.isArray(d?.products)) {
      remoteProducts = d.products.map(mapProductRow);
      MOCK_STATS.activeProducts = remoteProducts.length;
    }
  } catch (err) {
    console.warn('Sync failed.', err);
  }

  if (browser) window.dispatchEvent(new Event('productUpdated'));
  if (browser) window.dispatchEvent(new Event('vendorUpdated'));
};

// Dedupe concurrent calls: the module-load call + the layout $effect both trigger a sync on
// first load — without this they'd each pull the catalog. One in-flight fetch per burst;
// later refreshes (after admin edits) still re-fetch once the previous one settles.
export const syncWithNeuralGrid = async (): Promise<void> => {
  if (!browser) return;
  if (syncInFlight) return syncInFlight;
  syncInFlight = _doSync().finally(() => { syncInFlight = null; });
  return syncInFlight;
};

const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-5001",
    customerName: "Rahim Ahmed",
    totalAmount: 17700,
    items: [INITIAL_PRODUCTS[0], INITIAL_PRODUCTS[2]],
    currentStatus: "SHIPPED",
    estimatedDelivery: "24 Feb, 2025",
    timeline: [
      { status: 'PLACED', label: 'অর্ডার প্লেস করা হয়েছে', timestamp: '20 Feb, 10:00 AM', completed: true, description: "Customer placed order via Aura Hub" },
      { status: 'CONFIRMED', label: 'ভেন্ডর কনফার্মেশন', timestamp: '20 Feb, 10:30 AM', completed: true, description: "Royal Bengal Looms accepted the request" },
      { status: 'QUALITY_CHECK', label: 'Aura কোয়ালিটি চেক', timestamp: '21 Feb, 02:15 PM', completed: true, description: "Passes Aura Governance Standards (Thread Count: 100)" },
      { status: 'SHIPPED', label: 'শিপিং-এর জন্য প্রস্তুত', timestamp: '22 Feb, 09:00 AM', completed: true, description: "Handed over to Pathao Courier" },
      { status: 'DELIVERED', label: 'ডেলিভারি সম্পন্ন', timestamp: '-', completed: false, description: "Estimated: 24 Feb" },
    ]
  }
];

export const MOCK_STATS: EcosystemStats = { ...SEED_STATS };

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
  // Remote (Supabase) is the source of truth; fall back to seed only when empty.
  const base = remoteProducts.length ? remoteProducts : INITIAL_PRODUCTS;
  const combined = [...base, ...dbProducts];
  return Array.from(new Map(combined.map(item => [item.id, item])).values())
    .filter(p => !deleted.includes(p.id));
};

export const addProduct = (product: Product) => {
  const dbProducts = loadFromDB<Product>('aura_products');
  dbProducts.unshift(product);
  saveToDB('aura_products', dbProducts);
  if (browser) window.dispatchEvent(new Event('productUpdated'));
};

export const deleteProduct = (productId: number | string) => {
  trackDeletedId(productId);
  let dbProducts = loadFromDB<Product>('aura_products');
  dbProducts = dbProducts.filter(p => p.id !== productId);
  saveToDB('aura_products', dbProducts);
  remoteProducts = remoteProducts.filter(p => p.id !== productId);
  if (browser) window.dispatchEvent(new Event('productUpdated'));
};

export const deleteVendor = (vendorId: number | string) => {
  trackDeletedId(vendorId);
  let dbVendors = loadFromDB<Vendor>('aura_vendors');
  dbVendors = dbVendors.filter(v => v.id !== vendorId);
  saveToDB('aura_vendors', dbVendors);
  remoteVendors = remoteVendors.filter(v => v.id !== vendorId);
  if (browser) window.dispatchEvent(new Event('vendorUpdated'));
};

export const deleteCategory = (categoryId: number | string) => {
  trackDeletedId(categoryId);
  let dbCategories = loadFromDB<Category>('aura_categories');
  dbCategories = dbCategories.filter(c => c.id !== categoryId);
  saveToDB('aura_categories', dbCategories);
  remoteCategories = remoteCategories.filter(c => c.id !== categoryId);
  if (browser) window.dispatchEvent(new Event('categoryUpdated'));
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
  if (browser) window.dispatchEvent(new Event('orderUpdated'));
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

if (browser) syncWithNeuralGrid();
