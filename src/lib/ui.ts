import { writable } from 'svelte/store';
import { ECO_CATEGORIES } from '$lib/categories';

// Global UI state shared across components (e.g. the mobile category sheet opened
// from the bottom nav).
export const categorySheetOpen = writable(false);

// The main nav drawer (hamburger menu) — shared so it opens from the top nav AND the
// bottom-nav "Menu" tab.
export const navMenuOpen = writable(false);

// Owner-controlled site config (Aura Control Center → /api/settings). Seeded with the
// code defaults for SSR/first paint, then refreshed on the client in +layout.svelte.
// `siteCategories` drives the home category rail + the mobile CategorySheet;
// `featuredConfig` drives the "High Recommended" rail-first + grid-first ordering.
export const siteCategories = writable<any[]>(ECO_CATEGORIES);
export const featuredConfig = writable<{ vendorSlugs: string[]; productIds: number[] }>({
  vendorSlugs: ['panjabi-kuthir'],
  productIds: []
});

// Lowercased category ids that actually have ≥1 live product. The home page publishes
// this from its live catalog; the global CategorySheet reads it to hide dead-end
// (empty) categories. Empty set = "not computed yet" → show all (safe fallback).
export const stockedCategoryIds = writable<Set<string>>(new Set());

