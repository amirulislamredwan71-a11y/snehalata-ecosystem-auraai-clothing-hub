import { LayoutGrid, Store, TrendingUp, Sparkles, Zap } from '@lucide/svelte';

// Single source of truth for the marketplace categories — shared by the home grid,
// the mobile category sheet, and the desktop sidebar. `cover` = the category's own
// dedicated image in /static/categories (falls back to a gradient when absent).
export const ECO_CATEGORIES = [
  { id: 'all', name: 'সব সংগ্রহ (All)', icon: LayoutGrid, cover: '' },
  { id: 'womens', name: "নারী (Women's)", icon: Store, cover: '' },
  { id: 'saree', name: 'শাড়ি (Saree)', icon: Store, cover: '/categories/saree.jpg' },
  { id: 'panjabi', name: 'পাঞ্জাবি (Panjabi)', icon: Store, cover: '/categories/panjabi.jpg' },
  { id: 'three-piece', name: 'থ্রি-পিস (3-Piece)', icon: Store, cover: '/categories/three-piece.jpg' },
  { id: 'borka', name: 'বোরকা ও হিজাব / নিকাব (Borka & Hijab)', icon: Store, cover: '' },
  { id: 'shirt', name: 'শার্ট (Shirt)', icon: Store, cover: '/products/shirt-7.jpg' },
  { id: 't-shirt', name: 'টি-শার্ট (T-Shirt)', icon: Store, cover: '/categories/t-shirt.jpg' },
  { id: 'pant', name: 'প্যান্ট (Pant)', icon: Store, cover: '/categories/pant.jpg' },
  { id: 'baby', name: 'বেবি আইটেম (Baby)', icon: Store, cover: '/categories/baby.jpg' },
  { id: 'market', name: 'মার্কেট প্লেস (Market)', icon: TrendingUp, cover: '/categories/market.jpg' },
  { id: 'cosmetics', name: 'কসমেটিকস (Cosmetics)', icon: Sparkles, cover: '/categories/cosmetics.jpg' },
  { id: 'undergarments', name: 'আন্ডারগার্মেন্টস (Undergarments)', icon: Store, cover: '/categories/undergarments.jpg' },
  { id: 'gadgets', name: 'গ্যাজেট (Gadgets)', icon: Zap, cover: '/categories/gadgets.jpg' },
  { id: 'others', name: 'অন্যান্য (Others)', icon: LayoutGrid, cover: '/categories/others.jpg' }
];
