import { writable } from 'svelte/store';

// Global UI state shared across components (e.g. the mobile category sheet opened
// from the bottom nav).
export const categorySheetOpen = writable(false);

// The main nav drawer (hamburger menu) — shared so it opens from the top nav AND the
// bottom-nav "Menu" tab.
export const navMenuOpen = writable(false);
