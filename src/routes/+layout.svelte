<script lang="ts">
  import '../app.css';
  import Nav from '$lib/components/Nav.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import CategorySheet from '$lib/components/CategorySheet.svelte';
  import FloatingCart from '$lib/components/FloatingCart.svelte';
  import NeuralBackground from '$lib/components/NeuralBackground.svelte';
  import { browser } from '$app/environment';
  import { syncWithNeuralGrid, getProducts } from '$lib/mockData';
  import { priceStats, buildPriceStats } from '$lib/fairPrice';
  import { siteCategories, featuredConfig } from '$lib/ui';
  import { loadReviewAgg } from '$lib/reviews';
  import { ECO_CATEGORIES } from '$lib/categories';
  import { LayoutGrid } from '@lucide/svelte';

  let { children } = $props();

  // Aura chat is a floating, non-critical widget → load it AFTER the page is
  // interactive so it never blocks initial hydration (was slowing the HUB page).
  let ChatAssistant = $state<any>(null);

  $effect(() => {
    if (!browser) return;
    syncWithNeuralGrid();
    // Fair-Price Truth stats — rebuilt from the live catalog (global, all pages).
    const refreshStats = () => priceStats.set(buildPriceStats(getProducts()));
    refreshStats();
    window.addEventListener('productUpdated', refreshStats);

    // Owner-controlled site config (categories + featured) from the Aura Control Center.
    // Icons only live in code, so merge saved cover/name over the ECO_CATEGORIES defaults
    // (matched by id) to keep an icon fallback for tiles without a cover.
    const refreshConfig = () =>
      fetch('/api/settings')
        .then((r) => r.json())
        .then((cfg) => {
          if (Array.isArray(cfg?.categories) && cfg.categories.length) {
            const byId = new Map(ECO_CATEGORIES.map((c) => [c.id, c]));
            const allTile = byId.get('all') ?? { id: 'all', name: 'সব সংগ্রহ (All)', icon: LayoutGrid, cover: '' };
            const mapped = cfg.categories
              .filter((c: any) => c.active !== false && c.id !== 'all')
              .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
              .map((c: any) => ({ icon: LayoutGrid, ...(byId.get(c.id) ?? {}), id: c.id, name: c.name, cover: c.cover ?? '' }));
            siteCategories.set([allTile, ...mapped]);
          }
          if (cfg?.featured) featuredConfig.set({ vendorSlugs: cfg.featured.vendorSlugs ?? [], productIds: cfg.featured.productIds ?? [] });
        })
        .catch(() => {});
    refreshConfig();
    window.addEventListener('siteConfigUpdated', refreshConfig);

    // Live review aggregates (product + vendor avg/count) — one global fetch drives every
    // ProductCard star-badge and the vendor rail rating. No-op if the table isn't provisioned.
    loadReviewAgg();

    const load = () =>
      import('$lib/components/ChatAssistant.svelte').then((m) => {
        ChatAssistant = m.default;
      });
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load, { timeout: 2500 });
    } else {
      setTimeout(load, 400);
    }
    return () => {
      window.removeEventListener('productUpdated', refreshStats);
      window.removeEventListener('siteConfigUpdated', refreshConfig);
    };
  });
</script>

<svelte:head>
  <title>SNEHALATA Aura — AI Neural Ecosystem</title>
  <meta
    name="description"
    content="স্নেহলতা Aura — AI-powered ecosystem empowering local Bangladeshi artisans with global-standard technology." />
  <meta name="theme-color" content="#0a0f0d" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SNEHALATA Aura" />
  <meta property="og:image" content="https://www.snehalata.com/og-cover.svg" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<NeuralBackground />
<div class="bg-aura-glow">
  <div class="glow-orb top-[-20%] left-[-10%]" />
  <div class="glow-orb bottom-[-20%] right-[-10%] top-auto" />
</div>

<div class="min-h-screen flex flex-col">
  <Nav />
  <main class="flex-1 pb-16 lg:pb-0">
    {@render children()}
  </main>
  <Footer />
</div>

<BottomNav />
<CategorySheet />
<FloatingCart />
{#if ChatAssistant}
  <ChatAssistant />
{/if}
