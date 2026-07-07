<script lang="ts">
  import { browser } from '$app/environment';
  import { fade, fly } from 'svelte/transition';
  import { Search, LayoutGrid, ChevronRight, TrendingUp, Zap, ArrowRight, ShieldCheck, Menu, X, Filter, Globe, Store, History, Camera, Loader2, Sparkles, Play, Truck, Lock, ChevronDown } from '@lucide/svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { getProducts, getVendors } from '$lib/mockData';
  import { BD_LOCATIONS } from '$lib/locationData';
  import { track } from '$lib/analytics';
  import { fileToCompressedDataURL } from '$lib/imageUpload';

  let { data } = $props();

  // Debounced search-intent capture for the Grid.
  let searchTimer: ReturnType<typeof setTimeout>;
  function onSearchInput() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchQuery.trim();
      if (q.length >= 2) track('search', { meta: { q: q.slice(0, 80) } });
    }, 900);
  }

  let selectedCategory = $state('all');
  let selectedDistrict = $state('all');
  let searchQuery = $state('');
  let isSidebarOpen = $state(false);
  let bannerExpanded = $state(false);

  // Neural Grid A3 — semantic + visual "search by photo".
  let semanticActive = $state(false);
  let semanticResults = $state<any[]>([]);
  let semanticCaption = $state('');
  let searchLoading = $state(false);

  async function runSemanticSearch() {
    const q = searchQuery.trim();
    if (!q) { semanticActive = false; return; }
    searchLoading = true;
    try {
      const res = await fetch('/api/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q })
      });
      const d = await res.json().catch(() => ({}));
      semanticResults = d.products || [];
      semanticCaption = '';
      semanticActive = true;
    } catch {
      semanticActive = false; // fall back to the client-side keyword filter
    } finally {
      searchLoading = false;
    }
  }

  async function runVisualSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    searchLoading = true;
    try {
      const base64 = await fileToCompressedDataURL(file);
      const res = await fetch('/api/search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });
      const d = await res.json().catch(() => ({}));
      semanticResults = d.products || [];
      semanticCaption = d.caption || '';
      semanticActive = true;
      track('search', { meta: { mode: 'visual' } });
      scrollToCollection();
    } catch {
      semanticActive = false;
    } finally {
      searchLoading = false;
      input.value = '';
    }
  }

  function clearSemantic() {
    semanticActive = false;
    semanticResults = [];
    semanticCaption = '';
    searchQuery = '';
  }

  function scrollToCollection() {
    if (browser) setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  // Top search bar (design places search at the very top) → run neural search, then
  // bring the product grid into view so results are visible.
  async function runTopSearch() {
    await runSemanticSearch();
    scrollToCollection();
  }

  // Pick a category: clear any active photo/semantic search and scroll the results
  // into view so users immediately see the filtered grid.
  function selectCategory(id: string) {
    selectedCategory = id;
    semanticActive = false;
    searchQuery = '';
    isSidebarOpen = false;
    if (browser) {
      setTimeout(() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    }
  }

  // Seeded from the server load so the grid renders during SSR / first paint.
  let products = $state<any[]>(data?.products ?? []);
  let vendors = $state<any[]>(data?.vendors ?? []);

  // Neural Grid A7 — real trending products (server, ranked by trend_score).
  const trending = $derived<any[]>(data?.trending ?? []);

  // Neural Grid A2 — "For You": recently-opened products. Recently-viewed IDs live in
  // localStorage; the product objects are DERIVED from `products`. Critical: never write
  // `products`-dependent state inside the sync effect below (that self-dependency caused
  // effect_update_depth_exceeded → chat/add/category dead until refresh).
  let recentIds = $state<number[]>([]);

  function loadRecentIds() {
    if (!browser) return;
    try {
      recentIds = (JSON.parse(localStorage.getItem('aura_recently_viewed') || '[]') as any[]).map(Number);
    } catch {
      recentIds = [];
    }
  }

  const recentlyViewed = $derived.by(() => {
    if (!recentIds.length) return [];
    const map = new Map(products.map((p) => [Number(p.id), p]));
    return recentIds.map((id) => map.get(Number(id))).filter(Boolean).slice(0, 4);
  });

  $effect(() => {
    if (!browser) return;
    // This effect ONLY writes state (products / vendors / recentIds) and never reads
    // reactive state, so it runs once on mount + on events — no self-dependency loop.
    const refresh = () => {
      products = getProducts();
      vendors = getVendors();
    };
    refresh();
    loadRecentIds();
    window.addEventListener('productUpdated', refresh);
    window.addEventListener('vendorUpdated', refresh);
    window.addEventListener('recentlyViewedUpdated', loadRecentIds);
    return () => {
      window.removeEventListener('productUpdated', refresh);
      window.removeEventListener('vendorUpdated', refresh);
      window.removeEventListener('recentlyViewedUpdated', loadRecentIds);
    };
  });

  // Hero carousel — 3 rotating slides. The interval callback runs OUTSIDE effect
  // tracking, so reading heroIndex there is NOT a reactive dependency → no loop.
  const HERO_SLIDES = [
    { pill: 'AI-Powered · Neural Verified', t1: 'The Future of', t2: 'Shopping is Here', en: "Bangladesh's first AI marketplace — try before you buy, powered by Aura Neural Grid.", bn: 'বিশ্বাসের সাথে কেনাকাটা।' },
    { pill: 'AR Try-On · Powered by AI', t1: 'See It On You', t2: 'Before You Buy', en: 'Virtual try-on lets you preview fashion & beauty instantly — before you spend a taka.', bn: 'আসল পণ্য, সঠিক দামে।' },
    { pill: 'Trust-First Marketplace', t1: 'Every Vendor,', t2: 'Neural Verified', en: 'From small local shops to big brands — every seller is authenticated for your safety.', bn: 'সবার বাজেটে, সবার জন্য।' }
  ];
  let heroIndex = $state(0);
  const hero = $derived(HERO_SLIDES[heroIndex]);
  $effect(() => {
    const id = setInterval(() => { heroIndex = (heroIndex + 1) % HERO_SLIDES.length; }, 6000);
    return () => clearInterval(id);
  });

  const TRUST_PILLS = [
    { icon: Sparkles, en: 'AI-Powered Smart Shopping', bn: 'এআই-চালিত স্মার্ট শপিং' },
    { icon: ShieldCheck, en: 'Neural Verified Vendors', bn: 'যাচাইকৃত বিক্রেতা' },
    { icon: Lock, en: 'Secure & Safe Transactions', bn: 'নিরাপদ লেনদেন' },
    { icon: Truck, en: 'Fast Delivery Across BD', bn: 'দ্রুত ডেলিভারি' }
  ];

  const SITE_URL = 'https://www.snehalata.com';
  let jsonLd = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'SNEHALATA Aura Neural Ecosystem',
          url: SITE_URL,
          description:
            "Bangladesh's unified AI marketplace — every brand, showroom and shop in one place, with AI try-on, semantic search and Neural Grid intelligence that makes shopping effortless.",
          areaServed: 'BD'
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: 'SNEHALATA Aura',
          inLanguage: ['bn-BD', 'en'],
          potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
          }
        },
        {
          '@type': 'ItemList',
          name: 'Neural Collection',
          numberOfItems: products.length,
          itemListElement: products.slice(0, 24).map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: {
              '@type': 'Product',
              name: p.name,
              image: p.imageUrl,
              description: p.description,
              category: p.category,
              offers: { '@type': 'Offer', price: p.price, priceCurrency: 'BDT', availability: 'https://schema.org/InStock' }
            }
          }))
        }
      ]
    })
  );

  let filteredProducts = $derived(products.filter(p => {
    const vendor = vendors.find(v => v.id === p.vendorId);
    const matchesCat = selectedCategory === 'all' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'all' || vendor?.district === selectedDistrict;
    return matchesCat && matchesSearch && matchesDistrict;
  }));

  let displayProducts = $derived(semanticActive ? semanticResults : filteredProducts);

  let categoryVendors = $derived(vendors.filter(v => {
    const matchesDistrict = selectedDistrict === 'all' || v.district === selectedDistrict;
    if (!matchesDistrict) return false;
    if (selectedCategory === 'all') return true;
    return products.some(p => p.vendorId === v.id && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }));

  // Neural Verified vendor rail — real vendors (top 8).
  const railVendors = $derived(vendors.slice(0, 8));

  const ECO_CATEGORIES = [
    { id: 'all', name: 'সব সংগ্রহ (All)', icon: LayoutGrid },
    { id: 'saree', name: 'শাড়ি (Saree)', icon: Store },
    { id: 'panjabi', name: 'পাঞ্জাবি (Panjabi)', icon: Store },
    { id: 'three-piece', name: 'থ্রি-পিস (3-Piece)', icon: Store },
    { id: 't-shirt', name: 'টি-শার্ট (T-Shirt)', icon: Store },
    { id: 'pant', name: 'প্যান্ট (Pant)', icon: Store },
    { id: 'baby', name: 'বেবি আইটেম (Baby)', icon: Store },
    { id: 'market', name: 'মার্কেট প্লেস (Market)', icon: TrendingUp },
    { id: 'cosmetics', name: 'কসমেটিকস (Cosmetics)', icon: Sparkles },
    { id: 'undergarments', name: 'আন্ডারগার্মেন্টস (Undergarments)', icon: Store },
    { id: 'gadgets', name: 'গ্যাজেট (Gadgets)', icon: Zap },
    { id: 'others', name: 'অন্যান্য (Others)', icon: LayoutGrid }
  ];

  // Category tiles (mockup rail) — real categories with a rotating gradient palette.
  const TILE_BG = [
    'linear-gradient(160deg,#332720,#1B1512)',
    'linear-gradient(160deg,#332027,#1B1114)',
    'linear-gradient(160deg,#152228,#0C1416)',
    'linear-gradient(160deg,#1B2A1E,#101A12)',
    'linear-gradient(160deg,#2B2617,#19160D)'
  ];
  const categoryTiles = ECO_CATEGORIES.filter(c => c.id !== 'all');
</script>

<svelte:head>
  <title>SNEHALATA Aura — Bangladesh's Unified AI Marketplace | Every Brand in One Place</title>
  <meta
    name="description"
    content="স্নেহলতা Aura — বাংলাদেশের সব ব্র্যান্ড, শোরুম ও দোকান এক AI প্ল্যাটফর্মে। জামদানি থেকে আধুনিক ফ্যাশন, গ্যাজেট থেকে প্রতিদিনের প্রয়োজন — virtual try-on, semantic search আর Neural Grid দিয়ে সহজ কেনাকাটা।" />
  <link rel="canonical" href="https://www.snehalata.com/" />
  <meta name="theme-color" content="#0a0f0d" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SNEHALATA Aura" />
  <meta property="og:title" content="SNEHALATA Aura — Bangladesh's Unified AI Marketplace" />
  <meta
    property="og:description"
    content="Every brand, showroom & shop in Bangladesh — unified in one AI platform. Virtual try-on, semantic search & Neural Grid intelligence that makes shopping effortless." />
  <meta property="og:url" content="https://www.snehalata.com/" />
  <meta property="og:image" content="https://www.snehalata.com/og-cover.svg" />
  <meta property="og:locale" content="bn_BD" />
  <meta property="og:locale:alternate" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SNEHALATA Aura — Bangladesh's Unified AI Marketplace" />
  <meta
    name="twitter:description"
    content="Every brand, showroom & shop in Bangladesh — unified in one AI platform, with try-on, semantic search & Neural Grid." />
  <meta name="twitter:image" content="https://www.snehalata.com/og-cover.svg" />

  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<div class="min-h-screen bg-transparent text-aura-cream selection:bg-aura-green/30 font-sans">

  <!-- SEARCH — at the very top, like the design (real neural + visual search) -->
  <div class="max-w-7xl mx-auto px-5 sm:px-6 pt-4 pb-1">
    <div class="flex gap-2.5">
      <div class="flex-1 relative group">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-aura-dim group-focus-within:text-aura-green transition-colors" size={18} />
        <input type="text" bind:value={searchQuery} oninput={onSearchInput}
          onkeydown={(e) => e.key === 'Enter' && runTopSearch()}
          placeholder="Search products, brands or stores…"
          class="w-full bg-aura-card border border-aura-green/16 rounded-2xl h-12 pl-12 pr-4 text-sm focus:outline-none focus:border-aura-green/55 transition-all placeholder:text-aura-dim" />
      </div>
      <label class="w-12 h-12 shrink-0 rounded-2xl bg-aura-card border border-aura-green/18 flex items-center justify-center text-aura-green hover:border-aura-green transition-all cursor-pointer" title="Search by photo">
        <input type="file" accept="image/*" onchange={runVisualSearch} class="hidden" disabled={searchLoading} />
        {#if searchLoading}<Loader2 size={17} class="animate-spin" />{:else}<Camera size={18} />{/if}
      </label>
    </div>
  </div>

  <!-- HERO — rotating carousel, neural-grid backdrop -->
  <section class="relative overflow-hidden border-b border-aura-green/10">
    <div class="absolute inset-0 neural-grid pointer-events-none opacity-60"></div>
    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.22),transparent_70%)] blur-lg pointer-events-none" style="animation:pulseGlow 6s ease-in-out infinite;"></div>
    <div class="absolute top-40 -left-24 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(199,154,62,0.14),transparent_70%)] blur pointer-events-none" style="animation:pulseGlow 7s ease-in-out infinite 1.2s;"></div>

    <div class="max-w-7xl mx-auto px-5 sm:px-6 py-12 sm:py-20 relative grid lg:grid-cols-2 gap-12 items-center">
      <!-- text -->
      <div>
        {#key heroIndex}
          <div style="animation:fadeSlide .4s ease;">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-aura-gold/40 bg-aura-gold/[0.08] font-display text-[10.5px] font-semibold tracking-wide text-aura-gold">{hero.pill}</span>
            <h1 class="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-aura-cream mt-5">
              {hero.t1}<br /><span class="text-aura-green">{hero.t2}</span>
            </h1>
            <p class="text-[15px] sm:text-base leading-relaxed text-aura-muted mt-4 max-w-xl">{hero.en}</p>
            <p class="font-bengali text-sm text-[#6e8a80] mt-1.5">{hero.bn}</p>
          </div>
        {/key}

        <div class="flex flex-wrap items-center gap-5 mt-7">
          <a href="#collection" class="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-br from-aura-green-deep to-aura-green-bright text-black font-bold text-sm shadow-[0_10px_24px_rgba(16,185,129,0.3)] hover:brightness-110 transition-all">
            Shop Smarter Today <ArrowRight size={15} strokeWidth={2.4} />
          </a>
          <a href="/heritage" class="inline-flex items-center gap-2 text-[#3fce96] font-bold text-[13px] hover:text-aura-green transition-colors">
            <Play size={16} class="fill-current" /> How Snehalata Works
          </a>
        </div>

        <!-- dots -->
        <div class="flex items-center gap-2 mt-8">
          {#each HERO_SLIDES as _, i}
            <button aria-label={`Slide ${i + 1}`} onclick={() => heroIndex = i}
              class="h-1.5 rounded-full transition-all duration-200 {i === heroIndex ? 'w-5 bg-aura-green' : 'w-1.5 bg-white/20'}"></button>
          {/each}
        </div>
      </div>

      <!-- neural orb visual -->
      <div class="relative h-56 sm:h-72 rounded-3xl overflow-hidden bg-[radial-gradient(circle_at_60%_35%,#16221D,#0B1210)] border border-aura-green/15 hidden sm:block">
        <div class="absolute inset-0 neural-grid opacity-70"></div>
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-aura-green/35" style="animation:floatGlow 5s ease-in-out infinite;"></div>
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border border-aura-gold/30"></div>
        <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.28),transparent_75%)] flex items-center justify-center text-aura-green">
          {#if heroIndex === 0}<Sparkles size={34} />{:else if heroIndex === 1}<Camera size={32} />{:else}<ShieldCheck size={32} />{/if}
        </div>
      </div>
    </div>
  </section>

  <!-- TRUST PILLS -->
  <section class="max-w-7xl mx-auto px-5 sm:px-6 mt-8">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {#each TRUST_PILLS as t}
        {@const Icon = t.icon}
        <div class="bg-aura-card border border-aura-green/14 rounded-2xl p-4 flex flex-col items-center text-center gap-2.5">
          <div class="w-10 h-10 rounded-xl bg-aura-green/10 flex items-center justify-center text-aura-green shrink-0"><Icon size={18} /></div>
          <span class="text-[11px] font-bold text-aura-cream leading-tight">{t.en}</span>
          <span class="font-bengali text-[9px] text-aura-dim">{t.bn}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- NEURAL VERIFIED banner -->
  <section class="max-w-7xl mx-auto px-5 sm:px-6 mt-5">
    <button type="button" onclick={() => bannerExpanded = !bannerExpanded}
      class="w-full text-left rounded-2xl border border-aura-green/30 bg-[linear-gradient(120deg,rgba(16,185,129,0.14),rgba(199,154,62,0.05))] p-4 sm:p-5">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-aura-green/16 flex items-center justify-center text-aura-green shrink-0"><ShieldCheck size={19} /></div>
        <div class="flex-1 min-w-0">
          <div class="font-display text-[11px] font-bold tracking-[1.4px] text-aura-gold">NEURAL VERIFIED</div>
          <div class="text-sm font-semibold text-aura-cream mt-0.5">Trusted &amp; Authentic Marketplace</div>
        </div>
        <ChevronDown size={16} class="text-aura-muted transition-transform {bannerExpanded ? 'rotate-180' : ''}" />
      </div>
      {#if bannerExpanded}
        <p transition:fade={{ duration: 150 }} class="mt-3 pt-3 border-t border-aura-green/15 text-[13px] leading-relaxed text-[#93a29b]">
          প্রতিটি বিক্রেতা Snehalata-তে যুক্ত হওয়ার আগে পরিচয়, পণ্যের সত্যতা ও ডেলিভারি যাচাই পার হয় — ছোট দোকান থেকে বড় ব্র্যান্ড, সবাই।
        </p>
      {/if}
    </button>
  </section>

  <!-- CATEGORIES rail -->
  <section class="max-w-7xl mx-auto px-5 sm:px-6 mt-8">
    <div class="flex items-baseline justify-between mb-3">
      <h2 class="font-display text-lg font-bold text-aura-cream">Shop by Categories</h2>
      <a href="#collection" class="text-[12.5px] font-bold text-aura-green">View All</a>
    </div>
    <div class="flex gap-3 overflow-x-auto no-scrollbar pb-1">
      {#each categoryTiles as cat, i}
        {@const Icon = cat.icon}
        <button type="button" onclick={() => selectCategory(cat.id)} class="w-24 shrink-0 text-center">
          <div class="w-24 h-24 rounded-2xl flex items-center justify-center border border-white/5 text-aura-cream/80" style="background:{TILE_BG[i % TILE_BG.length]};">
            <Icon size={26} strokeWidth={1.6} />
          </div>
          <div class="text-[11.5px] font-semibold text-[#dde5e1] mt-2 leading-tight">{cat.name}</div>
        </button>
      {/each}
    </div>
  </section>

  <!-- NEURAL VERIFIED VENDORS rail -->
  {#if railVendors.length > 0}
    <section class="max-w-7xl mx-auto px-5 sm:px-6 mt-8">
      <div class="flex items-baseline justify-between mb-3">
        <h2 class="font-display text-lg font-bold text-aura-cream">Neural Verified Vendors</h2>
        <a href="#collection" class="text-[12.5px] font-bold text-aura-green">View All</a>
      </div>
      <div class="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {#each railVendors as v}
          <a href={`/store/${v.slug}`} class="w-40 shrink-0">
            <div class="relative w-40 h-[104px] rounded-2xl bg-[linear-gradient(160deg,#1A2C24,#0D1712)] border border-white/5 flex items-center justify-center overflow-hidden">
              <Store size={30} class="text-white/20" />
              <div class="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#0a0f0d]/80 border border-aura-green/40">
                <ShieldCheck size={9} class="text-aura-green" />
                <span class="text-[8px] font-bold text-aura-green">Neural Verified</span>
              </div>
            </div>
            <div class="text-[13px] font-bold text-aura-cream mt-2 truncate">{v.store_name}</div>
            <div class="flex items-center gap-1.5 mt-1">
              <span class="w-1.5 h-1.5 rounded-full bg-aura-green"></span>
              <span class="text-[10.5px] text-[#93a29b] truncate">{v.description || 'Verified Storefront'}</span>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- PROMO cards -->
  <section class="max-w-7xl mx-auto px-5 sm:px-6 mt-8">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <a href="#collection" class="relative overflow-hidden rounded-3xl p-5 h-40 flex flex-col bg-[linear-gradient(145deg,#1A1934,#0D0D1C)] border border-aura-ai/35">
        <Sparkles size={56} class="absolute top-2 right-2 text-aura-ai/30" />
        <span class="font-display text-[9.5px] font-bold tracking-[1.4px] text-[#9c90f5]">AI CURATED</span>
        <span class="text-[15px] font-bold text-aura-cream mt-1.5">Neural Collection</span>
        <span class="text-[11.5px] text-[#8e96ae] mt-1">Curated for You by AI</span>
        <span class="mt-auto self-start px-3.5 py-2 rounded-lg border border-aura-ai text-[#9c90f5] text-[11.5px] font-bold">Explore Now</span>
      </a>
      <a href="#collection" class="relative overflow-hidden rounded-3xl p-5 h-40 flex flex-col bg-[linear-gradient(145deg,#123024,#0A1A12)] border border-aura-gold/40">
        <Zap size={56} class="absolute top-2 right-2 text-aura-gold/30" />
        <span class="font-display text-[9.5px] font-bold tracking-[1.4px] text-aura-gold">LIMITED TIME</span>
        <span class="text-[15px] font-bold text-aura-cream mt-1.5">Mega Deals</span>
        <span class="text-[13px] font-bold text-aura-gold mt-1">Up to 70% OFF</span>
        <span class="mt-auto self-start px-3.5 py-2 rounded-lg bg-gradient-to-br from-aura-green-deep to-aura-green-bright text-black text-[11.5px] font-bold">Shop Now</span>
      </a>
    </div>
  </section>

  <!-- Mobile category rail (sticky) — quick category nav + all-categories drawer -->
  <div class="lg:hidden sticky top-20 z-40 border-y border-aura-green/10 bg-[#0a0f0d]/85 backdrop-blur-xl mt-8">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
      <button type="button" onclick={() => isSidebarOpen = !isSidebarOpen} aria-label="All categories"
        class="shrink-0 p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
        <Menu size={18} />
      </button>
      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        {#each ECO_CATEGORIES as cat}
          <button type="button" onclick={() => selectCategory(cat.id)}
            class="flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all touch-manipulation {selectedCategory === cat.id ? 'bg-aura-green border-aura-green text-black' : 'bg-white/5 border-white/10 text-gray-400'}">
            {cat.name}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div id="collection" class="max-w-7xl mx-auto flex relative scroll-mt-24 mt-6 lg:mt-10">
    <!-- Sidebar (desktop) -->
    <aside class="hidden lg:block w-80 h-[calc(100vh-100px)] sticky top-[100px] overflow-y-auto p-8 border-r border-white/5 no-scrollbar">
      <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 px-4">Neural Grid Categories</h3>
      <nav class="space-y-2">
        {#each ECO_CATEGORIES as cat}
          {@const Icon = cat.icon}
          <button onclick={() => selectCategory(cat.id)}
            class="w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group cursor-pointer {selectedCategory === cat.id ? 'bg-aura-green text-black shadow-xl shadow-aura-green/20 translate-x-2' : 'text-gray-400 hover:bg-white/5 hover:text-white'}">
            <div class="flex items-center gap-4">
              <span class={selectedCategory === cat.id ? 'text-black' : 'text-gray-600 group-hover:text-aura-green transition-colors'}>
                <Icon size={16} />
              </span>
              <span class="text-[13px] font-bold tracking-wide">{cat.name}</span>
            </div>
            <ChevronRight size={14} class="transition-transform {selectedCategory === cat.id ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-100'}" />
          </button>
        {/each}
      </nav>

      <div class="mt-12 p-8 bg-gradient-to-br from-aura-green/15 to-aura-ai/15 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
        <div class="relative z-10 text-center">
          <h4 class="font-display text-lg font-bold mb-3">Sell on Snehalata</h4>
          <p class="text-[10px] text-gray-400 leading-relaxed mb-6 font-medium">Launch your AI-powered brand storefront today.</p>
          <a href="/sell" class="block w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform text-center">Join Network</a>
        </div>
        <Zap class="absolute -right-6 -bottom-6 text-white/5 group-hover:text-white/10 transition-colors" size={120} />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-5 sm:p-6 lg:p-12">
      <!-- semantic/visual search results banner -->
      {#if semanticActive}
        <section class="mb-10">
          <div class="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-aura-green/15 to-aura-gold/10 border border-white/10">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-aura-green/20 text-aura-green"><Sparkles size={16} /></div>
              <div>
                <p class="text-sm font-black">Neural results · {semanticResults.length} matches</p>
                {#if semanticCaption}<p class="text-[10px] text-gray-400 mt-0.5 italic">From your photo: “{semanticCaption}”</p>{/if}
              </div>
            </div>
            <button onclick={clearSemantic} class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
              <X size={14} /> Clear
            </button>
          </div>
        </section>
      {/if}

      <!-- trending rail -->
      {#if !semanticActive && selectedCategory === 'all' && searchQuery === '' && trending.length > 0}
        <section class="mb-16">
          <div class="flex items-center gap-4 mb-8">
            <div class="p-3 bg-aura-gold/10 rounded-2xl text-aura-gold"><TrendingUp size={16} /></div>
            <div>
              <h3 class="text-2xl sm:text-3xl font-display font-bold">Trending on the Grid</h3>
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Ranked live by real views, carts &amp; orders</p>
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-10">
            {#each trending.slice(0, 4) as p (p.id)}
              <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
            {/each}
          </div>
        </section>
      {/if}

      <!-- behavioral "For You" rail -->
      {#if !semanticActive && selectedCategory === 'all' && searchQuery === '' && recentlyViewed.length > 0}
        <section class="mb-16">
          <div class="flex items-center gap-4 mb-8">
            <div class="p-3 bg-aura-green/10 rounded-2xl text-aura-green"><History size={16} /></div>
            <div>
              <h3 class="text-2xl sm:text-3xl font-display font-bold">For You · Recently Viewed</h3>
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Picked from what you explored</p>
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-10">
            {#each recentlyViewed as p (p.id)}
              <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
            {/each}
          </div>
        </section>
      {/if}

      <div class="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div class="flex items-center gap-4">
          <h2 class="text-3xl sm:text-4xl font-display font-bold leading-none">
            {selectedCategory === 'all' ? 'Neural Collection' : ECO_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </h2>
          <span class="h-px w-12 bg-white/10 hidden sm:block"></span>
          <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">{displayProducts.length} Items</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden sm:flex -space-x-4">
            {#each categoryVendors.slice(0, 5) as v}
              <div class="w-10 h-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] font-bold overflow-hidden" title={v.store_name}>
                {v.store_name?.[0] || '?'}
              </div>
            {/each}
          </div>
          <div class="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
            <Filter size={14} />
            <select bind:value={selectedDistrict} class="bg-transparent border-none focus:ring-0 cursor-pointer outline-none text-white">
              <option value="all" class="bg-black text-white">All Bangladesh</option>
              {#each Object.keys(BD_LOCATIONS).sort() as district}
                <option value={district} class="bg-black text-white">{district}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- Featured Vendors (category-scoped) -->
      {#if selectedCategory !== 'all' && categoryVendors.length > 0}
        <section class="mb-16">
          <div class="flex items-center justify-between mb-8 px-2">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
              Verified Vendors in {ECO_CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </h3>
            <div class="h-px flex-1 mx-8 bg-white/5 hidden sm:block" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {#each categoryVendors as v}
              <a href={`/store/${v.slug}`} class="group relative bg-aura-card border border-white/5 p-5 rounded-3xl hover:border-aura-green transition-all cursor-pointer flex items-center gap-6 overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Globe size={80} />
                </div>
                <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Store size={24} class="text-aura-green" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-xl font-display font-bold mb-1 truncate group-hover:text-aura-green transition-colors">{v.store_name}</h4>
                  <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest truncate">{v.description || 'Verified Vendor Hub'}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-aura-green" />
                    <span class="text-[8px] font-black uppercase tracking-widest text-aura-green/80">Neural Node Active</span>
                  </div>
                </div>
                <div class="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0 -translate-x-4">
                  <ArrowRight size={16} />
                </div>
              </a>
            {/each}
          </div>
        </section>
      {/if}

      <!-- Product Grid -->
      {#if searchLoading}
        <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-10">
          {#each Array(8) as _, si (si)}
            <div class="animate-pulse space-y-3">
              <div class="aspect-[3/4] rounded-[2.5rem] bg-white/5 border border-white/5"></div>
              <div class="h-3 rounded-full bg-white/5 w-3/4"></div>
              <div class="h-3 rounded-full bg-white/5 w-1/3"></div>
            </div>
          {/each}
        </div>
      {:else}
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-10">
        {#each displayProducts as p, idx (p.id)}
          <div transition:fly={{ y: 30, duration: 400, delay: idx * 50 }}>
            <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
          </div>
        {/each}

        {#if displayProducts.length === 0}
          <div class="col-span-full py-40 text-center">
            <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
              <Search size={32} class="text-gray-800" />
            </div>
            <h3 class="text-2xl font-display font-bold mb-2">No Neural Signal</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">Try another category or refine your search.</p>
          </div>
        {/if}
      </div>
      {/if}

      {#if !semanticActive && filteredProducts.length > 0}
        <div class="mt-28 text-center border-t border-white/5 pt-16">
          <p class="text-[10px] text-gray-700 font-black uppercase tracking-[0.5em] leading-relaxed">
            Bangladesh's AI Marketplace • Snehalata Aura • Neural Verified
          </p>
        </div>
      {/if}
    </main>
  </div>

  <!-- Mobile Sidebar drawer -->
  {#if isSidebarOpen}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden" transition:fade onclick={() => isSidebarOpen = false} />
    <div class="fixed top-0 left-0 bottom-0 w-80 bg-[#0a0f0d] z-[60] p-10 lg:hidden border-r border-white/10" transition:fly={{ x: -300, duration: 300 }}>
      <div class="flex items-center justify-between mb-12">
        <h2 class="text-2xl font-display font-bold">Categories</h2>
        <button onclick={() => isSidebarOpen = false} class="p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer">
          <X size={24} />
        </button>
      </div>
      <div class="space-y-4">
        {#each ECO_CATEGORIES as cat}
          {@const Icon = cat.icon}
          <button type="button" onclick={() => selectCategory(cat.id)}
            class="w-full flex items-center gap-6 p-5 rounded-3xl border transition-all cursor-pointer {selectedCategory === cat.id ? 'bg-aura-green border-aura-green text-black shadow-2xl' : 'bg-white/5 border-white/10 text-gray-400'}">
            <Icon size={16} />
            <span class="font-bold tracking-wide">{cat.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
