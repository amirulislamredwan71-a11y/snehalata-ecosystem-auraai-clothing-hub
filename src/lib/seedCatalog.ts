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
    id: 4,
    store_name: 'Rajshahi Silk House (রাজশাহী সিল্ক হাউস)',
    owner_name: 'Saiful Karim',
    slug: 'rajshahi-silk-house',
    website_url: 'https://rajshahi-silk.example.com',
    status: 'APPROVED',
    description: 'বিশুদ্ধ রাজশাহী সিল্ক ও কাতান শাড়ির আদি ঠিকানা। Pure Rajshahi silk weavers.',
    tradeLicense: 'TRD-2024-4401',
    category_id: 1,
    district: 'Rajshahi',
    area: 'Boalia'
  },
  {
    id: 5,
    store_name: 'Tangail Tant Bazaar (টাঙ্গাইল তাঁত বাজার)',
    owner_name: 'Mizanur Rahman',
    slug: 'tangail-tant-bazaar',
    website_url: 'https://tangail-tant.example.com',
    status: 'APPROVED',
    description: 'ঐতিহ্যবাহী টাঙ্গাইল তাঁতের শাড়ি, সরাসরি তাঁতির কাছ থেকে।',
    tradeLicense: 'TRD-2024-5502',
    category_id: 1,
    district: 'Tangail',
    area: 'Mirzapur'
  },
  {
    id: 6,
    store_name: 'Comilla Khadi & Crafts (কুমিল্লা খাদি)',
    owner_name: 'Nasrin Akter',
    slug: 'comilla-khadi-crafts',
    website_url: 'https://comilla-khadi.example.com',
    status: 'APPROVED',
    description: 'হাতে বোনা খাদি কাপড় ও এক্সক্লুসিভ পাঞ্জাবি কালেকশন।',
    tradeLicense: 'TRD-2024-6603',
    category_id: 2,
    district: 'Comilla',
    area: 'Kandirpar'
  },
  {
    id: 7,
    store_name: 'Sylhet Couture House (সিলেট কুটির)',
    owner_name: 'Rafiqul Islam',
    slug: 'sylhet-couture-house',
    website_url: 'https://sylhet-couture.example.com',
    status: 'APPROVED',
    description: 'মণিপুরী মোটিফে আধুনিক থ্রি-পিস ও ফিউশন ওয়্যার।',
    tradeLicense: 'TRD-2024-7704',
    category_id: 2,
    district: 'Sylhet',
    area: 'Kotwali'
  },
  {
    id: 8,
    store_name: 'Little Dhaka Kids (লিটল ঢাকা কিডস)',
    owner_name: 'Tahmina Begum',
    slug: 'little-dhaka-kids',
    website_url: 'https://little-dhaka.example.com',
    status: 'APPROVED',
    description: 'নবজাতক ও শিশুদের জন্য নরম অর্গানিক কটন পোশাক।',
    tradeLicense: 'TRD-2024-8805',
    category_id: 2,
    district: 'Dhaka',
    area: 'Bashundhara'
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
  },
  {
    id: 103,
    vendorId: 4,
    name: 'Rajshahi Pure Silk Saree — Maroon',
    price: 12500,
    description: 'হালকা ওজনের বিশুদ্ধ রাজশাহী সিল্ক, কনট্রাস্ট আঁচল ও সূক্ষ্ম জড়ি পাড়।',
    imageUrl: 'https://images.unsplash.com/photo-1610189012906-4783fda36799?q=80&w=800&auto=format&fit=crop',
    category: 'Saree'
  },
  {
    id: 104,
    vendorId: 5,
    name: 'Tangail Tant Saree — Off White',
    price: 4200,
    description: 'খাঁটি সুতি টাঙ্গাইল তাঁত, দৈনন্দিন ও উৎসব দুই-ই উপযোগী।',
    imageUrl: 'https://images.unsplash.com/photo-1610189012906-4783fda36799?q=80&w=800&auto=format&fit=crop',
    category: 'Saree'
  },
  {
    id: 105,
    vendorId: 4,
    name: 'Katan Silk Saree — Royal Blue',
    price: 9800,
    description: 'রিচ কাতান টেক্সচার, বিয়ে ও দাওয়াতের জন্য পারফেক্ট।',
    imageUrl: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800&auto=format&fit=crop',
    category: 'Saree'
  },
  {
    id: 202,
    vendorId: 6,
    name: 'Handloom Khadi Panjabi — Charcoal',
    price: 2650,
    description: 'হাতে বোনা খাদি কটন, ব্রিদেবল ও আরামদায়ক রেগুলার ফিট।',
    imageUrl: 'https://images.unsplash.com/photo-1631640989396-b1836a04e386?q=80&w=800&auto=format&fit=crop',
    category: 'Panjabi'
  },
  {
    id: 203,
    vendorId: 6,
    name: 'Eid Embroidered Panjabi — Ivory',
    price: 3950,
    description: 'নেক ও কাফে সূক্ষ্ম হ্যান্ড এমব্রয়ডারি, প্রিমিয়াম কটন।',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
    category: 'Panjabi'
  },
  {
    id: 301,
    vendorId: 7,
    name: 'Designer Three-Piece — Teal Fusion',
    price: 3500,
    description: 'মণিপুরী মোটিফ ও কন্ট্রাস্ট ওড়না সহ আনস্টিচড থ্রি-পিস।',
    imageUrl: 'https://images.unsplash.com/photo-1610189012906-4783fda36799?q=80&w=800&auto=format&fit=crop',
    category: 'Three-Piece'
  },
  {
    id: 302,
    vendorId: 7,
    name: 'Block-Print Three-Piece — Terracotta',
    price: 2800,
    description: 'হ্যান্ড ব্লক-প্রিন্ট সুতি, গরমে আরামদায়ক ডেইলি ওয়্যার।',
    imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop',
    category: 'Three-Piece'
  },
  {
    id: 401,
    vendorId: 2,
    name: 'Oversized Graphic Tee — Dhaka Map',
    price: 850,
    description: 'হেভিওয়েট ২৪০ জিএসএম কটন, ঢাকা-থিমড পাফ প্রিন্ট।',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
    category: 'T-Shirt'
  },
  {
    id: 402,
    vendorId: 2,
    name: 'Minimalist Cotton Tee — Sand',
    price: 650,
    description: 'সফট কম্বড কটন, রিল্যাক্সড ফিট বেসিক এসেনশিয়াল।',
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop',
    category: 'T-Shirt'
  },
  {
    id: 501,
    vendorId: 2,
    name: 'Slim-Fit Chino Pant — Olive',
    price: 1450,
    description: 'স্ট্রেচেবল টুইল চিনো, অফিস থেকে আউটিং সব জায়গায়।',
    imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?q=80&w=800&auto=format&fit=crop',
    category: 'Pant'
  },
  {
    id: 601,
    vendorId: 8,
    name: 'Organic Cotton Romper — Sky',
    price: 750,
    description: 'নবজাতকের জন্য সুপার সফট অর্গানিক কটন রম্পার সেট।',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=800&auto=format&fit=crop',
    category: 'Baby'
  },
  {
    id: 602,
    vendorId: 8,
    name: 'Newborn Nima-Set (5 pcs) — Pastel',
    price: 980,
    description: 'হাইপোঅ্যালার্জেনিক কটন, ৫ পিসের নিমা-সেট।',
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop',
    category: 'Baby'
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
