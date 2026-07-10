import { writable } from 'svelte/store';

// Catalog-wide review aggregates (avg + count) keyed by product id and vendor id. Loaded
// once globally (in +layout) so ProductCard star-badges and the vendor rail rating read
// straight from the store — no per-card fetch. Empty until loaded / if the table is absent.
export type Agg = { avg: number; count: number };
export const reviewAgg = writable<{ byProduct: Record<string, Agg>; byVendor: Record<string, Agg> }>({
  byProduct: {},
  byVendor: {}
});

let loaded = false;
export async function loadReviewAgg(force = false) {
  if (loaded && !force) return;
  loaded = true;
  try {
    const res = await fetch('/api/reviews?aggregates=1');
    if (!res.ok) return;
    const d = await res.json().catch(() => null);
    if (d && d.byProduct) reviewAgg.set({ byProduct: d.byProduct || {}, byVendor: d.byVendor || {} });
  } catch {
    /* offline / not provisioned — leave empty, cards just show no rating */
  }
}
