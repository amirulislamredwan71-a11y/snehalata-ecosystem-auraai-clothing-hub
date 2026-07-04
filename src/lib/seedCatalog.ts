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
  {
    id: 6,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Classic Croc',
    price: 750,
    description: 'নরম কম্বড কটন, বাচ্চাদের জন্য প্রিমিয়াম প্রিন্টেড টি-শার্ট। 4Y–16Y সাইজ।',
    imageUrl: '/products/kids-tee-1.jpg',
    category: 'T-Shirt'
  },
  {
    id: 7,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Pastel Set',
    price: 780,
    description: 'প্যাস্টেল কালারের নরম কটন টি-শার্ট, ব্রিদেবল ও আরামদায়ক। বাচ্চাদের ডেইলি ওয়্যার।',
    imageUrl: '/products/kids-tee-2.jpg',
    category: 'T-Shirt'
  },
  {
    id: 8,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Bold Colors',
    price: 780,
    description: 'উজ্জ্বল রঙের প্রিমিয়াম কটন টি-শার্ট, রঙ ফিকে হয় না। 4Y–16Y।',
    imageUrl: '/products/kids-tee-3.jpg',
    category: 'T-Shirt'
  },
  {
    id: 9,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Everyday Pack',
    price: 720,
    description: 'প্রতিদিনের জন্য আরামদায়ক নরম কটন টি-শার্ট, টেকসই সেলাই।',
    imageUrl: '/products/kids-tee-4.jpg',
    category: 'T-Shirt'
  },
  {
    id: 10,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Summer Brights',
    price: 700,
    description: 'গরমের জন্য হালকা ও ব্রিদেবল কটন, উজ্জ্বল সামার কালার।',
    imageUrl: '/products/kids-tee-5.jpg',
    category: 'T-Shirt'
  },
  {
    id: 11,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Olive & Earth',
    price: 720,
    description: 'আর্থ-টোন কালারের প্রিমিয়াম কটন টি-শার্ট, স্টাইলিশ ও আরামদায়ক।',
    imageUrl: '/products/kids-tee-6.jpg',
    category: 'T-Shirt'
  },
  {
    id: 12,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Coral & Teal',
    price: 740,
    description: 'কোরাল ও টিল কালারের নরম কটন টি-শার্ট, বাচ্চাদের প্রিয় রঙ।',
    imageUrl: '/products/kids-tee-7.jpg',
    category: 'T-Shirt'
  },
  {
    id: 13,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Heather Grey',
    price: 690,
    description: 'ক্লাসিক হেদার গ্রে, যেকোনো কিছুর সাথে মানানসই বেসিক এসেনশিয়াল।',
    imageUrl: '/products/kids-tee-8.jpg',
    category: 'T-Shirt'
  },
  {
    id: 14,
    vendorId: 8,
    name: 'Premium Kids Cotton Tee — Signature',
    price: 760,
    description: 'সিগনেচার প্রিন্ট ও প্রিমিয়াম কটন, বাচ্চাদের জন্য স্পেশাল কালেকশন।',
    imageUrl: '/products/kids-tee-9.jpg',
    category: 'T-Shirt'
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
  // Real DB schema has no vendor_id column; 0 => no vendor chip rendered.
  vendorId: p.vendor_id ?? 0
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
