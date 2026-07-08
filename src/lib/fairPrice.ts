import { writable } from 'svelte/store';

// Fair-Price Truth — Snehalata's trust wedge: prove a price is fair by comparing it to
// peers in the same category, instead of just claiming "best price". Populated globally
// (see +layout.svelte) from the live catalog; ProductCard reads it reactively.

export type PriceStat = { median: number; count: number };
export const priceStats = writable<Record<string, PriceStat>>({});

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function buildPriceStats(products: { price: number; category?: string }[]): Record<string, PriceStat> {
  const byCat: Record<string, number[]> = {};
  for (const p of products) {
    const c = String(p.category || '').toLowerCase().trim();
    const price = Number(p.price);
    if (!c || !price) continue;
    (byCat[c] ||= []).push(price);
  }
  const out: Record<string, PriceStat> = {};
  for (const c in byCat) out[c] = { median: median(byCat[c]), count: byCat[c].length };
  return out;
}

export type Verdict = { level: 'fair' | 'deal' | 'high'; label: string; cls: string };

// Only give a verdict when there are ≥3 comparables — otherwise the signal is noise, not truth.
export function fairVerdict(
  price: number,
  category: string | undefined,
  stats: Record<string, PriceStat>
): Verdict | null {
  const c = String(category || '').toLowerCase().trim();
  const st = stats[c];
  if (!st || st.count < 3 || !price) return null;
  const r = Number(price) / st.median;
  if (r <= 0.82) return { level: 'deal', label: '🔥 সেরা দাম', cls: 'text-aura-gold border-aura-gold/40 bg-aura-gold/10' };
  if (r >= 1.35) return { level: 'high', label: '⚠ বাজারের চেয়ে বেশি', cls: 'text-amber-400 border-amber-400/30 bg-amber-400/10' };
  return { level: 'fair', label: '✓ ন্যায্য দাম', cls: 'text-aura-green border-aura-green/30 bg-aura-green/10' };
}
