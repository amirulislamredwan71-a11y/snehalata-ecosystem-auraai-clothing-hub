// Shared, browser-agnostic seed catalog for the Snehalata / Aura Neural Grid.
// Imported by both the client store (mockData.ts) and the server load (+page.server.ts)
// so the storefront renders identical data during SSR and on the client.
// Product images are REAL showcase photos served from /static/products (no mock Unsplash).
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
    description: 'শিশুদের জন্য প্রিমিয়াম কটন টি-শার্ট ও নরম পোশাক।',
    tradeLicense: 'TRD-2024-8805',
    category_id: 2,
    district: 'Dhaka',
    area: 'Bashundhara'
  },
  {
    id: 13,
    store_name: "Glamour's Touch (গ্ল্যামারস টাচ)",
    owner_name: "Glamour's Touch",
    slug: 'glamours-touch',
    website_url: 'https://glamourstouch.com',
    status: 'APPROVED',
    description: 'অথেন্টিক কোরিয়ান স্কিনকেয়ার ও বিউটি প্রোডাক্ট — Medicube, APLB, DABO সহ জনপ্রিয় ব্র্যান্ড।',
    tradeLicense: 'TRD-2025-1313',
    category_id: 3,
    district: 'Dhaka',
    area: 'Bashundhara'
  }
];

// 14 REAL showcase products — images live in /static/products (deployed with the app).
export const SEED_PRODUCTS: Product[] = [
  {
    id: 1,
    vendorId: 4,
    name: 'Nakshi Jamdani Silk Saree — Midnight Navy',
    price: 6900,
    description: 'হালকা সিল্ক-কটন জমিনে হাতে বোনা নকশি জামদানি মোটিফ, কনট্রাস্ট জড়ি পাড় ও রিচ আঁচল। উৎসব ও দাওয়াতের জন্য পারফেক্ট।',
    imageUrl: '/products/saree-1.jpg',
    category: 'Saree'
  },
  {
    id: 2,
    vendorId: 5,
    name: 'Handloom Tant Saree — Heritage Weave',
    price: 4800,
    description: 'খাঁটি সুতি টাঙ্গাইল তাঁত, ঐতিহ্যবাহী নকশা ও আরামদায়ক ড্রেপ। দৈনন্দিন ও উৎসব দুই-ই উপযোগী।',
    imageUrl: '/products/saree-2.jpg',
    category: 'Saree'
  },
  {
    id: 3,
    vendorId: 1,
    name: 'Pure Silk Jamdani Saree — Festive',
    price: 8200,
    description: 'রাজকীয় জামদানি কারুকাজ ও সূক্ষ্ম জড়ি, প্রিমিয়াম সিল্কে বোনা। Aura Neural Verified authentic weave.',
    imageUrl: '/products/saree-3.jpg',
    category: 'Saree'
  },
  {
    id: 4,
    vendorId: 7,
    name: 'Embroidered Three-Piece — Wine Purple',
    price: 3850,
    description: 'ওয়াইন পার্পল কামিজে সূক্ষ্ম এমব্রয়ডারি, ম্যাচিং সালোয়ার ও প্রিন্টেড ওড়না সহ রেডি থ্রি-পিস।',
    imageUrl: '/products/threepiece-1.jpg',
    category: 'Three-Piece'
  },
  {
    id: 5,
    vendorId: 7,
    name: 'Designer Printed Three-Piece — Autumn',
    price: 3200,
    description: 'প্রিমিয়াম কটনে ডিজাইনার প্রিন্ট, আরামদায়ক ও এলিগ্যান্ট। ঈদ ও দাওয়াতের জন্য।',
    imageUrl: '/products/threepiece-2.jpg',
    category: 'Three-Piece'
  },
  // --- Glamour's Touch (vendor 13): authentic Korean skincare & beauty ---
  {
    id: 15,
    vendorId: 13,
    name: 'Medicube Collagen Jelly Cream',
    price: 2150,
    description: 'সব ধরনের ত্বকের জন্য কোলাজেন জেলি ক্রিম — গভীর ময়েশ্চার ও স্কিন বাউন্স। অথেন্টিক কোরিয়ান ফর্মুলা।',
    imageUrl: '/products/cosmetic-1.webp',
    category: 'Cosmetics'
  },
  {
    id: 16,
    vendorId: 13,
    name: 'Celimax Retinal Shot Tightening Booster',
    price: 1650,
    description: 'Retinal 0.1% + Matrixyl 3000 — টাইট ও ফার্ম স্কিনের জন্য অ্যান্টি-এজিং বুস্টার সিরাম (১৫ml)।',
    imageUrl: '/products/cosmetic-2.jpg',
    category: 'Cosmetics'
  },
  {
    id: 17,
    vendorId: 13,
    name: 'Medicube Kojic Acid Turmeric Night Wrapping Mask',
    price: 2450,
    description: 'কোজিক অ্যাসিড, ভিটামিন-C ও রেটিনল সমৃদ্ধ নাইট মাস্ক — রাতভর ব্রাইটেনিং ও ডালনেস কেয়ার (৭৫ml)।',
    imageUrl: '/products/cosmetic-3.jpg',
    category: 'Cosmetics'
  },
  {
    id: 18,
    vendorId: 13,
    name: 'Medicube TXA Niacinamide Capsule Cream 5%',
    price: 2900,
    description: 'TXA + নায়াসিনামাইড ৫% ক্যাপসুল ক্রিম — দাগ-ছোপ ও ইভেন টোনের জন্য প্রিমিয়াম কেয়ার (৫৫g)।',
    imageUrl: '/products/cosmetic-4.jpg',
    category: 'Cosmetics'
  },
  {
    id: 19,
    vendorId: 13,
    name: 'APLB Glutathione Niacinamide Body Lotion',
    price: 1850,
    description: 'গ্লুটাথায়ন ও নায়াসিনামাইড ১২.৫% বডি লোশন — ব্রাইটেনিং, ময়েশ্চার ও স্মুথ ত্বক (৩০০ml)।',
    imageUrl: '/products/cosmetic-5.jpg',
    category: 'Cosmetics'
  },
  {
    id: 20,
    vendorId: 13,
    name: 'DABO Black Snail All-in-One Repair Cream',
    price: 1250,
    description: 'ব্ল্যাক স্নেইল ১,০০০mg — ময়েশ্চারাইজিং, অ্যান্টি-রিঙ্কেল ও হোয়াইটেনিং অল-ইন-ওয়ান রিপেয়ার ক্রিম।',
    imageUrl: '/products/cosmetic-6.jpg',
    category: 'Cosmetics'
  },
  {
    id: 21,
    vendorId: 13,
    name: 'DABO UV Protection Collagen Sun Cream SPF50+',
    price: 950,
    description: 'SPF50+ PA+++ মেরিন কোলাজেন সান ক্রিম — লিফটিং ইফেক্ট সহ ডেইলি UV প্রোটেকশন।',
    imageUrl: '/products/cosmetic-7.jpg',
    category: 'Cosmetics'
  },
  {
    id: 22,
    vendorId: 13,
    name: 'Medicube Glutathione Glow Serum',
    price: 2650,
    description: 'গ্লুটাথায়ন লাইপোজোম ৫% + নায়াসিনামাইড ৫% গ্লো সিরাম — ঝলমলে উজ্জ্বল ত্বকের জন্য (৩০g)।',
    imageUrl: '/products/cosmetic-8.jpg',
    category: 'Cosmetics'
  },
  {
    id: 23,
    vendorId: 13,
    name: 'APLB Glutathione Niacinamide Facial Cream',
    price: 1950,
    description: 'গ্লুটাথায়ন-নায়াসিনামাইড ২৪.৮% ফেসিয়াল ক্রিম — মাইল্ড উপাদানে ব্রাইটেনিং ও সুদিং কেয়ার (৫৫ml)।',
    imageUrl: '/products/cosmetic-9.jpg',
    category: 'Cosmetics'
  },
  {
    id: 24,
    vendorId: 13,
    name: 'The Face Shop Rice Water Bright Foaming Cleanser',
    price: 850,
    description: 'রাইস ওয়াটার ব্রাইট ফোমিং ক্লিনজার — কোমল ভাবে মেকআপ ও ময়লা দূর করে উজ্জ্বল ত্বক (১৫০ml)।',
    imageUrl: '/products/cosmetic-10.jpg',
    category: 'Cosmetics'
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
  slug:
    v.slug ||
    String(v.store_name || '')
      .toLowerCase()
      .replace(/['’`]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '') ||
    'shop-' + v.id,
  description: v.description || 'Verified Artisan Hub',
  website_url: v.website_url,
  category_id: v.category_id,
  category: v.category ?? null,
  commission_rate: v.commission_rate,
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
  // Never carry a giant base64 `data:` image into SSR/props — it bloats the page HTML.
  // productImg() falls back to the branded placeholder for an empty URL.
  imageUrl: typeof p.image_url === 'string' && p.image_url.startsWith('data:') ? '' : p.image_url,
  externalUrl: p.external_url,
  // Real DB schema has no vendor_id column; 0 => no vendor chip rendered.
  vendorId: p.vendor_id ?? 0,
  // Aura moderation trust score (null when the DB column is absent / not yet scored).
  moderationScore: p.moderation_score ?? null
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
