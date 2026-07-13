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
  import { page } from '$app/stores';
  import { env as pubenv } from '$env/dynamic/public';

  // Meta (Facebook) Pixel — activates only when PUBLIC_META_PIXEL_ID is set in Vercel env, so
  // ad optimization + retargeting light up the moment the owner drops in the pixel id. No-op otherwise.
  const metaPixelId = pubenv.PUBLIC_META_PIXEL_ID || '';

  let { children } = $props();

  // The admin Control Center (/admin, /admin-login) is a full-screen dashboard with its OWN
  // header + search + nav — so hide all the customer-facing chrome (the "Neural search" top
  // nav, footer, mobile bottom-nav, category sheet, floating cart, shopping-assistant chat)
  // there. It was showing on top of the CEO command center = out of place / wasted space.
  const isAdmin = $derived($page.url.pathname.startsWith('/admin'));

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
            // Append any code-defined (ECO) category the saved config doesn't have yet (e.g.
            // borka) so new categories always appear without the owner re-saving the config.
            const have = new Set(cfg.categories.map((c: any) => c.id));
            const missing = ECO_CATEGORIES.filter((e) => e.id !== 'all' && !have.has(e.id));
            siteCategories.set([allTile, ...mapped, ...missing]);
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
  {#if metaPixelId}
    {@html `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');<\/script>`}
    {@html `<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"/><\/noscript>`}
  {/if}
</svelte:head>

<NeuralBackground />
<div class="bg-aura-glow">
  <div class="glow-orb top-[-20%] left-[-10%]" />
  <div class="glow-orb bottom-[-20%] right-[-10%] top-auto" />
</div>

<div class="min-h-screen flex flex-col">
  {#if !isAdmin}<Nav />{/if}
  <main class="flex-1 {isAdmin ? '' : 'pb-16 lg:pb-0'}">
    {@render children()}
  </main>
  {#if !isAdmin}<Footer />{/if}
</div>

{#if !isAdmin}
  <BottomNav />
  <CategorySheet />
  <FloatingCart />
  {#if ChatAssistant}
    <ChatAssistant />
  {/if}
{/if}
