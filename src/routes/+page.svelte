<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { fade, fly } from 'svelte/transition';
  import { Search, LayoutGrid, ChevronRight, TrendingUp, Zap, ArrowRight, ShieldCheck, Menu, X, Filter, Globe, Store, History, Camera, Sparkles, Play, Truck, Lock, ChevronDown, Wallet, Shirt, MapPin } from '@lucide/svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { priceStats, fairVerdict } from '$lib/fairPrice';
  import { getProducts, getVendors, hydrateFromSSR } from '$lib/mockData';
  import { BD_LOCATIONS } from '$lib/locationData';
  import { ECO_CATEGORIES } from '$lib/categories';
  import { siteCategories, featuredConfig, stockedCategoryIds } from '$lib/ui';
  import { reviewAgg } from '$lib/reviews';
  import Stars from '$lib/components/Stars.svelte';
  import { track } from '$lib/analytics';

  let { data } = $props();

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

  // Visual (photo) search core — takes a base64 image handed off from the header camera
  // (via sessionStorage) so it works regardless of which page took the photo.
  async function runVisualWith(base64: string) {
    searchLoading = true;
    try {
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

  // The header's Neural search hands text here via the ?q= URL param → run the semantic
  // search. `lastQ` is a plain (non-reactive) var so this effect only depends on the URL.
  let lastQ = '';
  $effect(() => {
    const qp = $page.url.searchParams.get('q') || '';
    if (qp && qp !== lastQ) {
      lastQ = qp;
      searchQuery = qp;
      runSemanticSearch().then(scrollToCollection);
    } else if (!qp) {
      lastQ = '';
    }
  });

  // Category deep-links: /?cat=<id> (from the footer, bottom-nav, anywhere) → filter the
  // grid to that category + scroll to it. `lastCat` is a plain var so no reactive loop.
  let lastCat = '';
  $effect(() => {
    const cp = $page.url.searchParams.get('cat') || '';
    if (cp && cp !== lastCat) {
      lastCat = cp;
      selectCategory(cp);
    } else if (!cp) {
      lastCat = '';
    }
  });

  // The header's camera hands a compressed photo via sessionStorage → consume + run it.
  function consumePendingVisual() {
    if (!browser) return;
    try {
      const b = sessionStorage.getItem('aura_visual_pending');
      if (b) { sessionStorage.removeItem('aura_visual_pending'); runVisualWith(b); }
    } catch { /* ignore */ }
  }
  $effect(() => {
    if (!browser) return;
    consumePendingVisual();
    window.addEventListener('aura-visual', consumePendingVisual);
    return () => window.removeEventListener('aura-visual', consumePendingVisual);
  });

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
    // Seed the store from the SSR page data so getProducts() returns REAL products on the
    // very first mount (no 16-item seed flash); the deferred catalog sync fills the full set.
    hydrateFromSSR(data?.products, data?.vendors);
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

  // Aura feature strip — recreates the "AI Powered Smart Shopping" poster's icon row as
  // real, tappable, responsive chips (each navigates to its feature). Replaces the 4 boxes.
  const HERO_FEATURES = [
    { icon: ShieldCheck, label: 'Neural Verified', href: '#trust-banner' },
    { icon: Sparkles, label: 'কীভাবে ব্যবহার', href: '/guide' },
    { icon: Shirt, label: 'AR Try-On', href: '/studio' },
    { icon: Search, label: 'Neural Search', action: 'search' },
    { icon: Globe, label: 'Live Market', href: '#collection' },
    { icon: Lock, label: 'Secure Payment', href: '#trust-banner' },
    { icon: Truck, label: 'Fast Delivery', href: '#trust-banner' },
    { icon: MapPin, label: 'Live Track', href: '/orders' },
    { icon: Wallet, label: 'সাধ্য · Everyone', href: '#budget' }
  ];
  function focusNeuralSearch() {
    if (!browser) return;
    const el = document.querySelector('input[placeholder^="Neural"], input[placeholder*="ভয়েস"]') as HTMLInputElement | null;
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
  }

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
          numberOfItems: data?.totalProducts ?? products.length,
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

  // Featured brand(s) — owner-controlled via the Aura Control Center (falls back to
  // Panjabi Kuthir). Featured vendors lead the rail; their products lead the grid.
  const featuredSlugs = $derived($featuredConfig.vendorSlugs ?? []);
  const featuredVendorIds = $derived(vendors.filter(v => featuredSlugs.includes(v.slug)).map(v => v.id));

  // Editorial vendor-showcase covers — a distinct, premium hero per vendor (avoids the
  // "same recoloured saree" repeat); falls back to the vendor's first product.
  const VENDOR_COVER: Record<string, string> = {
    'royal-bengal-looms': '/products/saree-10.jpg', // teal silk
    'rajshahi-silk-house': '/products/saree-8.jpg',  // red silk
    'tangail-tant-bazaar': '/products/saree-9.jpg',  // black
    'panjabi-kuthir': '/products/panjabi-kuthir-cover.jpg',
    'fahi-wear-house': '/products/undergarment-8.jpg', // branded set
    'fashion-wear': '/products/shirt-6.jpg' // formal & casual shirts
  };
  const coverFor = (v: any) =>
    VENDOR_COVER[v.slug] ?? products.find(p => p.vendorId === v.id)?.imageUrl;

  let filteredProducts = $derived(products.filter(p => {
    const vendor = vendors.find(v => v.id === p.vendorId);
    // Exact category match — 'shirt' must NOT match 'T-Shirt' (substring collision).
    const matchesCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'all' || vendor?.district === selectedDistrict;
    return matchesCat && matchesSearch && matchesDistrict;
  }));

  // Default browse leads with the featured brand(s); search/semantic keep relevance order.
  let displayProducts = $derived(
    semanticActive
      ? semanticResults
      : searchQuery !== '' || featuredVendorIds.length === 0
        ? filteredProducts
        : [...filteredProducts].sort(
            (a, b) => (featuredVendorIds.includes(b.vendorId) ? 1 : 0) - (featuredVendorIds.includes(a.vendorId) ? 1 : 0)
          )
  );

  // Progressive grid render — paint only the first page of cards, then auto-append more on
  // scroll (IntersectionObserver) or via the "আরও দেখুন" button. The FULL catalog stays
  // reachable, but we never mount hundreds of ProductCards at once (the real laptop/mobile cost).
  let visibleCount = $state(24);
  // Reset to the first page whenever the visible SET changes (category / search / district).
  // A background catalog refresh does NOT reset this (its deps don't change), so scroll holds.
  $effect(() => {
    void [selectedCategory, searchQuery, semanticActive, selectedDistrict];
    visibleCount = 24;
  });
  function autoloadMore(node: HTMLElement) {
    if (!browser) return;
    const io = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) visibleCount = Math.min(visibleCount + 24, displayProducts.length); },
      { rootMargin: '600px' }
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }

  let categoryVendors = $derived(vendors.filter(v => {
    const matchesDistrict = selectedDistrict === 'all' || v.district === selectedDistrict;
    if (!matchesDistrict) return false;
    if (selectedCategory === 'all') return true;
    return products.some(p => p.vendorId === v.id && p.category.toLowerCase() === selectedCategory.toLowerCase());
  }));

  // Neural Verified vendor rail — featured brand(s) first, then the rest (top 8).
  const railVendors = $derived(
    [...vendors].sort((a, b) => (featuredSlugs.includes(b.slug) ? 1 : 0) - (featuredSlugs.includes(a.slug) ? 1 : 0)).slice(0, 8)
  );

  // ── সাধ্য (Budget) Mode ── "tell Aura your budget, get the best authentic value within it".
  // Snehalata's core promise made concrete — fully client-side over the live catalog, zero cost.
  let budgetAmount = $state<number | null>(null);
  let budgetNeed = $state('');
  const BUDGET_CHIPS = [500, 1000, 2000, 5000];
  // Map a Bengali/English "need" to a category id (t-shirt BEFORE shirt to avoid the substring clash).
  const NEED_MAP: { kw: string[]; cat: string }[] = [
    { kw: ['টি-শার্ট', 'টিশার্ট', 't-shirt', 'tshirt', 'tee'], cat: 't-shirt' },
    { kw: ['পাঞ্জাবি', 'পাঞ্জাবী', 'panjabi'], cat: 'panjabi' },
    { kw: ['শাড়ি', 'শাড়ী', 'saree', 'sari'], cat: 'saree' },
    { kw: ['থ্রি', 'three', '3-piece', '3 piece', 'থ্রিপিস'], cat: 'three-piece' },
    { kw: ['শার্ট', 'shirt'], cat: 'shirt' },
    { kw: ['প্যান্ট', 'pant', 'trouser', 'জিন্স', 'jeans', 'গ্যাবার্ডিন', 'কার্গো'], cat: 'pant' },
    { kw: ['বেবি', 'বাচ্চা', 'শিশু', 'baby', 'kids', 'child'], cat: 'baby' },
    { kw: ['কসমেটিক', 'cosmetic', 'মেকআপ', 'makeup', 'ক্রিম', 'skin'], cat: 'cosmetics' },
    { kw: ['আন্ডার', 'undergarment', 'নাইটি', 'nightwear', 'ব্রা', 'bra', 'panty'], cat: 'undergarments' }
  ];
  const needCategory = (need: string): string | null => {
    const n = need.toLowerCase();
    for (const m of NEED_MAP) if (m.kw.some((k) => n.includes(k))) return m.cat;
    return null;
  };
  // Value rank: 🔥 deal first, then fair, then over-priced — the intelligence behind "best value".
  const valueRank = (p: any) => {
    const v = fairVerdict(p.price, p.category, $priceStats);
    return v?.level === 'deal' ? 0 : v?.level === 'high' ? 2 : 1;
  };
  let budgetResults = $derived.by(() => {
    const budget = Number(budgetAmount);
    if (!budget || budget <= 0) return [] as any[];
    const need = budgetNeed.trim().toLowerCase();
    const cat = need ? needCategory(need) : null;
    return products
      .filter((p) => {
        if (Number(p.price) > budget) return false;
        if (!need) return true;
        if (cat) return p.category.toLowerCase() === cat;
        return p.name.toLowerCase().includes(need) || p.category.toLowerCase().includes(need);
      })
      .sort((a, b) => valueRank(a) - valueRank(b) || a.price - b.price)
      .slice(0, 8);
  });

  // সাধ্য v2 — "পুরো সাজ" (a complete outfit within one budget). When the need mentions an
  // outfit/set word, pair the best-value top + bottom that BOTH fit the budget (deterministic,
  // client-side); fall back to a single complete-attire piece (saree/three-piece/panjabi).
  const OUTFIT_KW = ['সাজ', 'সেট', 'outfit', 'পুরো', 'ফুল', 'full', 'complete', 'কমপ্লিট', 'কম্পলিট', 'ঈদ', 'eid', 'লুক', 'look', 'পোশাক', 'set'];
  const isOutfitNeed = (need: string) => {
    const n = need.toLowerCase();
    return OUTFIT_KW.some((k) => n.includes(k));
  };
  const bestValue = (pool: any[]) =>
    [...pool].sort((a, b) => valueRank(a) - valueRank(b) || a.price - b.price)[0] || null;
  let budgetOutfit = $derived.by(() => {
    const budget = Number(budgetAmount);
    if (!budget || budget <= 0) return null as null | { items: any[]; total: number };
    const need = budgetNeed.trim();
    if (!need || !isOutfitNeed(need)) return null;
    const tops = products.filter((p) => ['panjabi', 'shirt', 't-shirt'].includes(String(p.category).toLowerCase()));
    const bottoms = products.filter((p) => String(p.category).toLowerCase() === 'pant');
    if (tops.length && bottoms.length) {
      const cheapestTop = Math.min(...tops.map((p) => Number(p.price)));
      // bottoms cheap enough to still leave room for at least the cheapest top
      const affordableBottoms = bottoms.filter((p) => Number(p.price) <= budget - cheapestTop);
      if (affordableBottoms.length) {
        const bottom = bestValue(affordableBottoms);
        const top = bestValue(tops.filter((p) => Number(p.price) <= budget - Number(bottom.price)));
        if (top) return { items: [top, bottom], total: Number(top.price) + Number(bottom.price) };
      }
    }
    // Fallback — a single complete-attire piece that fits.
    const single = bestValue(
      products.filter(
        (p) => ['saree', 'three-piece', 'panjabi'].includes(String(p.category).toLowerCase()) && Number(p.price) <= budget
      )
    );
    return single ? { items: [single], total: Number(single.price) } : null;
  });

  // Category tiles — gradient fallback for categories that don't have a cover image yet.
  const TILE_BG = [
    'linear-gradient(160deg,#332720,#1B1512)',
    'linear-gradient(160deg,#332027,#1B1114)',
    'linear-gradient(160deg,#152228,#0C1416)',
    'linear-gradient(160deg,#1B2A1E,#101A12)',
    'linear-gradient(160deg,#2B2617,#19160D)'
  ];
  // Category visibility is owner-controlled (the admin `active` flag → $siteCategories),
  // NOT product-count-driven: empty categories are intentional placeholders that fill over
  // time (market, T-Shirt, borka…). `hasProducts` is used only to badge a tile "শীঘ্রই".
  const hasProducts = (c: any) =>
    c.id === 'all' || products.some((p) => p.category?.toLowerCase() === c.id.toLowerCase());
  const categoryTiles = $derived($siteCategories.filter((c) => c.id !== 'all'));
  const navCategories = $derived($siteCategories);

  // Publish the ids that actually have ≥1 live product so the global CategorySheet can show
  // the same "Neural Verified" mark the home tiles do (empty placeholders stay unmarked).
  $effect(() => {
    stockedCategoryIds.set(new Set($siteCategories.filter((c) => hasProducts(c)).map((c) => String(c.id).toLowerCase())));
  });

  // Hero "BD → global" network: nodes scattered near the edges (the world), arcs radiate
  // from the Bangladesh origin (viewBox centre 200,108) outward to them.
  const WORLD_NODES = [
    { x: 44, y: 44 }, { x: 356, y: 52 }, { x: 78, y: 182 }, { x: 332, y: 176 },
    { x: 20, y: 118 }, { x: 384, y: 120 }, { x: 150, y: 24 }, { x: 286, y: 198 },
    { x: 116, y: 150 }, { x: 252, y: 58 }
  ];
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

  <!-- HERO — BD map background + BD→global network overlay + rotating text -->
  <section class="relative overflow-hidden border-b border-aura-green/10">
    <!-- Bangladesh map image — the "BD → spreads across the whole world" theme (owner's favourite):
         small centred at top on mobile, full-bleed texture on desktop. -->
    <img src="/bd-map.webp" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full object-contain object-center scale-[1.45] opacity-30 sm:scale-100 sm:object-cover sm:opacity-45" />
    <div class="absolute inset-0 bg-[#080b09]/[0.6]"></div>
    <div class="absolute inset-0 neural-grid pointer-events-none opacity-25"></div>

    <!-- BD → global network: origin over BD, arcs radiating out to world nodes -->
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" class="absolute inset-0 h-full w-full pointer-events-none opacity-45 sm:opacity-70" fill="none" aria-hidden="true">
      {#each WORLD_NODES as n, i}
        <path class="hero-arc" d={`M200,108 Q${(200 + n.x) / 2},${Math.min(n.y, 108) - 26} ${n.x},${n.y}`} stroke="rgba(16,185,129,0.28)" stroke-width="0.7" style="animation-delay:{i * 0.28}s" />
      {/each}
      {#each WORLD_NODES as n, i}
        <circle class="hero-node" cx={n.x} cy={n.y} r="2" fill="#10b981" style="animation-delay:{i * 0.32}s" />
      {/each}
      <circle class="hero-node" cx="200" cy="108" r="3.6" fill="#c79a3e" />
      <circle cx="200" cy="108" r="1.8" fill="#ffd77a" />
    </svg>

    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.18),transparent_70%)] blur-lg pointer-events-none" style="animation:pulseGlow 6s ease-in-out infinite;"></div>

    <div class="max-w-7xl mx-auto px-5 sm:px-6 py-16 sm:py-24 relative z-10">
      <div class="max-w-2xl">
        {#key heroIndex}
          <div style="animation:fadeSlide .4s ease;">
            <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-aura-gold/40 bg-aura-gold/[0.12] backdrop-blur-sm font-display text-[10.5px] font-semibold tracking-wide text-aura-gold">{hero.pill}</span>
            <h1 class="font-display font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.1] text-aura-cream mt-5 drop-shadow-[0_2px_14px_rgba(0,0,0,0.7)]">
              {hero.t1}<br /><span class="text-aura-green">{hero.t2}</span>
            </h1>
            <p class="text-[15px] sm:text-base leading-relaxed text-gray-200 mt-4 max-w-xl drop-shadow-[0_1px_8px_rgba(0,0,0,0.75)]">{hero.en}</p>
            <p class="font-bengali text-sm text-[#9ec9bb] mt-1.5">{hero.bn}</p>
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

        <div class="flex items-center gap-2 mt-8">
          {#each HERO_SLIDES as _, i}
            <button aria-label={`Slide ${i + 1}`} onclick={() => heroIndex = i}
              class="h-1.5 rounded-full transition-all duration-200 {i === heroIndex ? 'w-5 bg-aura-green' : 'w-1.5 bg-white/25'}"></button>
          {/each}
        </div>

        <p class="mt-7 text-[9.5px] font-black uppercase tracking-[0.28em] text-aura-green/90">Aura Neural Grid · বাংলাদেশ থেকে বিশ্বজুড়ে</p>
      </div>
    </div>
  </section>

  <!-- AURA FEATURE STRIP over the Neural-Verified shield backdrop (like the map behind the hero) -->
  <div class="relative overflow-hidden mt-6">
    <img src="/aura-hero-bg.jpg" alt="" aria-hidden="true" class="absolute inset-0 h-full w-full object-cover object-center opacity-[0.32] pointer-events-none" />
    <div class="absolute inset-0 bg-[#080b09]/55 pointer-events-none"></div>
    <section class="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6">
      <div class="text-center mb-4">
        <p class="font-display text-[10px] sm:text-[11px] font-black uppercase tracking-[0.35em] text-aura-cream drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">SNEHALATA · Neural Verified</p>
        <p class="font-display text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] text-aura-green/90 mt-1">AI Powered Smart Shopping</p>
      </div>
    <div class="flex sm:justify-center gap-3 sm:gap-5 overflow-x-auto no-scrollbar pb-1 px-1">
      {#each HERO_FEATURES as f}
        {@const Icon = f.icon}
        {#if f.action === 'search'}
          <button type="button" onclick={focusNeuralSearch} class="shrink-0 flex flex-col items-center gap-2 w-[74px] group">
            <span class="w-14 h-14 rounded-full border border-aura-green/40 bg-aura-green/[0.06] flex items-center justify-center text-aura-green shadow-[0_0_18px_rgba(16,185,129,0.18)] group-hover:border-aura-green group-hover:shadow-[0_0_26px_rgba(16,185,129,0.4)] transition-all"><Icon size={20} /></span>
            <span class="text-[9px] font-bold text-[#cfe8dd] text-center leading-tight">{f.label}</span>
          </button>
        {:else}
          <a href={f.href} class="shrink-0 flex flex-col items-center gap-2 w-[74px] group">
            <span class="w-14 h-14 rounded-full border border-aura-green/40 bg-aura-green/[0.06] flex items-center justify-center text-aura-green shadow-[0_0_18px_rgba(16,185,129,0.18)] group-hover:border-aura-green group-hover:shadow-[0_0_26px_rgba(16,185,129,0.4)] transition-all"><Icon size={20} /></span>
            <span class="text-[9px] font-bold text-[#cfe8dd] text-center leading-tight">{f.label}</span>
          </a>
        {/if}
      {/each}
    </div>
    </section>
  </div>

  <!-- NEURAL VERIFIED banner -->
  <section id="trust-banner" class="max-w-7xl mx-auto px-5 sm:px-6 mt-5 scroll-mt-24">
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

  <!-- সাধ্য (Budget) Mode — your budget, the best authentic value within it -->
  <section id="budget" class="max-w-7xl mx-auto px-5 sm:px-6 mt-5 scroll-mt-24">
    <div class="rounded-2xl border border-aura-green/25 bg-[linear-gradient(135deg,rgba(16,185,129,0.10),rgba(199,154,62,0.05))] p-4 sm:p-5">
      <div class="flex items-center gap-3 mb-3.5">
        <div class="w-9 h-9 rounded-xl bg-aura-green/16 flex items-center justify-center text-aura-green shrink-0"><Wallet size={18} /></div>
        <div class="flex-1 min-w-0">
          <div class="font-display text-sm font-bold text-aura-cream">সাধ্য Mode · আপনার বাজেটে সেরাটা</div>
          <div class="text-[11px] text-[#93a29b] mt-0.5">বাজেট বলুন — Aura যাচাই করা, ন্যায্য দামের পণ্য বেছে দেবে</div>
        </div>
        <span class="hidden sm:inline text-[8.5px] font-black uppercase tracking-[0.2em] text-aura-gold/80 shrink-0">BD-তে এই প্রথম</span>
      </div>
      <div class="flex flex-col sm:flex-row gap-2.5">
        <div class="flex items-center gap-2 px-3 rounded-xl bg-[#0a0f0d]/70 border border-aura-green/20 sm:w-40 focus-within:border-aura-green/50">
          <span class="text-aura-gold font-bold">৳</span>
          <input type="number" inputmode="numeric" min="0" bind:value={budgetAmount} placeholder="বাজেট" aria-label="বাজেট"
            class="w-full bg-transparent py-2.5 text-sm text-aura-cream placeholder:text-[#5e6d67] focus:outline-none" />
        </div>
        <input type="text" bind:value={budgetNeed} placeholder="কী খুঁজছেন? যেমন: পাঞ্জাবি, শাড়ি, বা ‘পুরো ঈদের সাজ’" aria-label="কী খুঁজছেন"
          class="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0a0f0d]/70 border border-aura-green/20 text-sm text-aura-cream placeholder:text-[#5e6d67] focus:outline-none focus:border-aura-green/50" />
      </div>
      <div class="flex flex-wrap gap-2 mt-2.5">
        {#each BUDGET_CHIPS as c}
          <button type="button" onclick={() => budgetAmount = c}
            class="px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors {budgetAmount === c ? 'bg-aura-green text-black border-aura-green' : 'bg-white/[0.03] text-[#9ec9bb] border-aura-green/20 hover:border-aura-green/50'}">৳{c.toLocaleString()}</button>
        {/each}
      </div>

      {#if budgetAmount && budgetAmount > 0}
        <div class="mt-4 pt-4 border-t border-aura-green/15">
          {#if budgetOutfit}
            <p class="text-[12.5px] text-[#cfe8dd] mb-3">
              ৳{Number(budgetAmount).toLocaleString()} বাজেটে <span class="font-bold text-aura-green">{budgetOutfit.items.length > 1 ? 'পুরো সাজ' : 'সেরা পোশাক'}</span> — মোট <span class="font-bold text-aura-gold">৳{budgetOutfit.total.toLocaleString()}</span>{#if budgetOutfit.items.length > 1} <span class="text-[#93a29b]">({budgetOutfit.items.length} পিস · টপ + বটম)</span>{/if} ✓
            </p>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {#each budgetOutfit.items as p (p.id)}
                <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
              {/each}
            </div>
          {:else if budgetResults.length > 0}
            <p class="text-[12.5px] text-[#cfe8dd] mb-3">৳{Number(budgetAmount).toLocaleString()}-এর মধ্যে <span class="font-bold text-aura-green">{budgetResults.length}</span>টি যাচাই করা পণ্য — সেরা ভ্যালু আগে ✓</p>
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {#each budgetResults as p (p.id)}
                <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
              {/each}
            </div>
          {:else}
            <p class="text-[13px] text-[#93a29b]">৳{Number(budgetAmount).toLocaleString()}-এ {budgetNeed ? `“${budgetNeed}” ` : ''}পাওয়া যায়নি — একটু বাজেট বাড়ান বা অন্য কিছু লিখুন।</p>
          {/if}
        </div>
      {/if}
    </div>
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
          <div class="relative w-24 h-24 rounded-2xl overflow-hidden border border-aura-green/15">
            {#if cat.cover}
              <img src={cat.cover} alt={cat.name} loading="lazy" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent"></div>
            {:else}
              <div class="w-full h-full flex items-center justify-center text-aura-cream/80" style="background:{TILE_BG[i % TILE_BG.length]};">
                <Icon size={26} strokeWidth={1.6} />
              </div>
            {/if}
            <div class="absolute top-1.5 right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#0a0f0d]/85 border border-aura-green/50" title="Neural Verified">
              <ShieldCheck size={9} class="text-aura-green" /><span class="text-[7px] font-black text-aura-green tracking-tight">Verified</span>
            </div>
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
          {@const cover = coverFor(v)}
          <a href={`/store/${v.slug}`} class="w-40 shrink-0">
            <div class="relative w-40 h-[104px] rounded-2xl border border-white/5 overflow-hidden bg-[linear-gradient(160deg,#1A2C24,#0D1712)]">
              {#if cover}
                <img src={cover} alt={v.store_name} loading="lazy" class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"></div>
              {:else}
                <div class="absolute inset-0 flex items-center justify-center"><Store size={30} class="text-white/20" /></div>
              {/if}
              <div class="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#0a0f0d]/80 border border-aura-green/40">
                <ShieldCheck size={9} class="text-aura-green" />
                <span class="text-[8px] font-bold text-aura-green">Neural Verified</span>
              </div>
            </div>
            <div class="text-[13px] font-bold text-aura-cream mt-2 truncate">{v.store_name}</div>
            {#if $reviewAgg.byVendor[String(v.id)]?.count > 0}
              {@const va = $reviewAgg.byVendor[String(v.id)]}
              <div class="flex items-center gap-1 mt-1">
                <Stars value={va.avg} size={10} />
                <span class="text-[10px] font-bold text-aura-gold tabular-nums">{va.avg}</span>
                <span class="text-[9.5px] text-[#93a29b]">({va.count})</span>
              </div>
            {:else}
              <div class="flex items-center gap-1.5 mt-1">
                <span class="w-1.5 h-1.5 rounded-full bg-aura-green"></span>
                <span class="text-[10.5px] text-[#93a29b] truncate">{v.description || 'Verified Storefront'}</span>
              </div>
            {/if}
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

  <!-- Mobile category rail — quick category nav + all-categories drawer -->
  <div class="lg:hidden border-y border-aura-green/10 bg-[#0a0f0d]/60 backdrop-blur-xl mt-8">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
      <button type="button" onclick={() => isSidebarOpen = !isSidebarOpen} aria-label="All categories"
        class="shrink-0 p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
        <Menu size={18} />
      </button>
      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        {#each navCategories as cat}
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
        {#each navCategories as cat}
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
            {selectedCategory === 'all' ? 'Neural Collection' : $siteCategories.find(c => c.id === selectedCategory)?.name}
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
              Verified Vendors in {$siteCategories.find(c => c.id === selectedCategory)?.name}
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
        {#each displayProducts.slice(0, visibleCount) as p, idx (p.id)}
          <div transition:fly={{ y: 30, duration: 400, delay: Math.min(idx, 11) * 40 }}>
            <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
          </div>
        {/each}

        {#if visibleCount < displayProducts.length}
          <div class="col-span-full flex justify-center pt-6 pb-2" use:autoloadMore>
            <button
              type="button"
              onclick={() => (visibleCount = Math.min(visibleCount + 24, displayProducts.length))}
              class="px-8 py-3 rounded-full border border-aura-green/30 bg-white/5 text-sm font-semibold text-aura-green hover:bg-aura-green/10 transition-colors">
              আরও দেখুন · Load more ({displayProducts.length - visibleCount})
            </button>
          </div>
        {/if}

        {#if displayProducts.length === 0}
          {@const emptyCat = selectedCategory !== 'all' && !semanticActive && searchQuery === ''}
          <div class="col-span-full py-40 text-center">
            <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border {emptyCat ? 'border-aura-gold/25' : 'border-white/10'}">
              {#if emptyCat}<Sparkles size={32} class="text-aura-gold/70" />{:else}<Search size={32} class="text-gray-800" />{/if}
            </div>
            {#if emptyCat}
              <h3 class="text-2xl font-display font-bold mb-2 text-aura-gold">শীঘ্রই আসছে · Coming Soon</h3>
              <p class="text-gray-400 text-sm max-w-xs mx-auto">এই ক্যাটাগরিতে খুব শীঘ্রই যাচাই করা পণ্য যোগ হচ্ছে।</p>
            {:else}
              <h3 class="text-2xl font-display font-bold mb-2">No Neural Signal</h3>
              <p class="text-gray-500 text-sm max-w-xs mx-auto">Try another category or refine your search.</p>
            {/if}
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
    <div class="fixed top-0 left-0 bottom-0 w-[86%] max-w-xs bg-[#0a0f0d] z-[60] p-6 lg:hidden border-r border-white/10 overflow-y-auto no-scrollbar" transition:fly={{ x: -300, duration: 300 }}>
      <div class="flex items-center justify-between mb-6 sticky top-0 bg-[#0a0f0d] pb-2 -mt-1">
        <h2 class="text-2xl font-display font-bold">Categories</h2>
        <button onclick={() => isSidebarOpen = false} class="p-2.5 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer">
          <X size={22} />
        </button>
      </div>
      <div class="space-y-2 pb-6">
        {#each navCategories as cat}
          {@const Icon = cat.icon}
          <button type="button" onclick={() => selectCategory(cat.id)}
            class="w-full flex items-center gap-4 p-3.5 rounded-2xl border transition-all cursor-pointer touch-manipulation {selectedCategory === cat.id ? 'bg-aura-green border-aura-green text-black shadow-xl' : 'bg-white/5 border-white/10 text-gray-400'}">
            <Icon size={16} class="shrink-0" />
            <span class="font-bold tracking-wide text-sm text-left">{cat.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Hero "BD → global" network animation (pure CSS) */
  .hero-arc {
    stroke-dasharray: 3 5;
    animation: hero-flow 2.6s linear infinite;
  }
  @keyframes hero-flow { to { stroke-dashoffset: -16; } }
  .hero-node {
    transform-box: fill-box;
    transform-origin: center;
    animation: hero-blip 3.4s ease-in-out infinite;
  }
  @keyframes hero-blip {
    0%, 100% { opacity: 0.45; transform: scale(0.85); }
    50% { opacity: 1; transform: scale(1.3); }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-arc, .hero-node { animation: none; }
  }
</style>
