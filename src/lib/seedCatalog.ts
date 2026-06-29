// Shared, browser-agnostic seed catalog for the Snehalata / Aura Neural Grid.
// Imported by both the client store (mockData.ts) and the server load (+page.server.ts)
// so the storefront renders identical data during SSR and on the client.
import type { Product, Vendor, Category, EcosystemStats } from '$lib/types';

export const SEED_VENDORS: Vendor[] = [
  {
    id: 1,
    store_name: 'Royal Bengal Looms (রয়েল বেঙ্গল লুমস)',
    owner_name: 'Artisan Guild',
    slug: 'royal-bengal-looms',
    website_url: 'https://royal-bengal.example.com',
    status: 'APPROVED',
    description: 'ঐতিহ্যবাহী জামদানি এবং মসলিন তাঁতশিল্পের গৌরব। Heritage weavers of Bangladesh.',
    tradeLicense: 'TRD-2024-8899',
    category_id: 1,
    district: 'Dhaka',
    area: 'Dhanmondi'
  },
  {
    id: 2,
    store_name: 'Urban Dhaka Streetwear (আরবান ঢাকা)',
    owner_name: 'Dhaka Creative',
    slug: 'urban-dhaka',
    website_url: 'https://urban-dhaka.com',
    status: 'APPROVED',
    description: 'Gen Z-এর জন্য মডার্ন ওভারসাইজ টি-শার্ট এবং হুডি।',
    tradeLicense: 'TRD-2024-1122',
    category_id: 2,
    district: 'Dhaka',
    area: 'Uttara'
  },
  {
    id: 3,
    store_name: 'Shadow Market',
    owner_name: 'Unknown',
    slug: 'shadow-market',
    status: 'BLOCKED',
    description: 'Unverified seller detected by Aura Governance.',
    tradeLicense: 'INVALID',
    district: 'Unknown'
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 101,
    vendorId: 1,
    name: 'Midnight Black জামদানি শাড়ি',
    price: 15500,
    description: 'হাতে বোনা ১০০ কাউন্ট সুতার সাথে গোল্ড জড়ি কাজ। A masterpiece of Dhakai Jamdani.',
    imageUrl:
      'https://images.unsplash.com/photo-1610189012906-4783fda36799?q=80&w=800&auto=format&fit=crop',
    externalUrl: 'https://example.com/royal-bengal/p/jamdani-black',
    category: 'Saree'
  },
  {
    id: 102,
    vendorId: 1,
    name: 'Heritage মসলিন পাঞ্জাবি',
    price: 8500,
    description: 'রাজকীয় উৎসবের জন্য অথেনটিক ঢাকাই মসলিন।',
    imageUrl:
      'https://images.unsplash.com/photo-1631640989396-b1836a04e386?q=80&w=800&auto=format&fit=crop',
    category: 'Panjabi'
  },
  {
    id: 201,
    vendorId: 2,
    name: 'Neon Cyberpunk Hoodie',
    price: 2200,
    description: 'হেভিওয়েট কটন ফ্লিস এবং পাফ প্রিন্ট ডিজাইন।',
    imageUrl:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
    externalUrl: 'https://example.com/urban-dhaka/p/neon-hoodie',
    category: 'Hoodie'
  }
];

export const SEED_CATEGORIES: Category[] = [
  { id: 1, name: 'Jamdani Heritage', slug: 'jamdani-heritage', description: 'Authentic hand-loomed Jamdani masterpieces.' },
  { id: 2, name: 'Urban Streetwear', slug: 'urban-streetwear', description: 'Modern Dhaka-inspired street fashion.' },
  { id: 3, name: 'Traditional Muslin', slug: 'traditional-muslin', description: 'The legendary royal fabric of Bengal.' }
];

export const SEED_STATS: EcosystemStats = {
  totalVendors: 1250,
  activeProducts: 45000,
  monthlyVolume: 8500000,
  aiInteractions: 120000,
  trendForecast: [
    { year: '2025', trend: 'Hyper-Local Craft Revival', growth: 45 },
    { year: '2026', trend: 'AR/VR Shopping Standard', growth: 120 },
    { year: '2027', trend: 'Carbon Neutral Logistics', growth: 85 },
    { year: '2028', trend: 'Aura Automated Supply Chain', growth: 200 },
    { year: '2029', trend: 'Global Artisan Bio-Labeling', growth: 155 },
    { year: '2030', trend: 'Post-Physical Retail Nodes', growth: 310 }
  ]
};

/** Map a raw Supabase `vendors` row into the app's Vendor shape. */
export const mapVendorRow = (v: any): Vendor => ({
  id: v.id,
  store_name: v.store_name,
  owner_name: v.owner_name,
  status: (v.status?.toUpperCase() as Vendor['status']) || 'PENDING',
  slug: v.slug || v.store_name?.toLowerCase().replace(/\s+/g, '-'),
  description: v.description || 'Verified Artisan Hub',
  website_url: v.website_url,
  category_id: v.category_id,
  district: v.district || 'Bangladesh',
  area: v.area
});

/** Map a raw Supabase `products` row into the app's Product shape. */
export const mapProductRow = (p: any): Product => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: Number(p.price),
  category: p.category,
  imageUrl: p.image_url,
  externalUrl: p.external_url,
  vendorId: p.vendor_id || 1
});

/** Merge collections keeping the last occurrence per id (remote overrides seed). */
export const dedupeById = <T extends { id: string | number }>(items: T[]): T[] =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

/**
 * Resolve a promise but never block longer than `ms`. Returns null on timeout so
 * server-side loads can degrade to the seed catalog instead of hanging the page
 * when the Neural Grid (Supabase) is slow or unreachable.
 */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([
    promise.catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))
  ]);
