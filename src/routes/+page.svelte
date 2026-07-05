<script lang="ts">
  import { browser } from '$app/environment';
  import { fade, fly, scale } from 'svelte/transition';
  import { Search, LayoutGrid, Tag, ChevronRight, TrendingUp, Zap, ArrowRight, ShieldCheck, ShoppingBag, Menu, X, Filter, Globe, Store, Feather, Gem, Scissors, Flower2, History, Camera, Loader2, Sparkles } from '@lucide/svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { getProducts, getVendors, getEcosystemStats } from '$lib/mockData';
  import { BD_LOCATIONS } from '$lib/locationData';
  import { track } from '$lib/analytics';
  import { fileToCompressedDataURL } from '$lib/imageUpload';

  let { data } = $props();

  // Neural Grid A1 — prefer real server-computed stats; fall back to seed.
  const stats = $derived(data?.stats ?? getEcosystemStats());

  // Compact, honest number formatting — shows real small counts (e.g. "15", "247"), not "0K+".
  function fmt(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M+';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K+';
    return String(n ?? 0);
  }

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

  // Pick a category: clear any active photo/semantic search and scroll the results
  // into view so mobile users immediately see the filtered grid (it sits below the
  // hero + heritage strip, so without this a tap looks like "nothing happened").
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
  // Neural Grid A2 — "For You": products this visitor recently opened (client, localStorage).
  // Recently-viewed IDs live in localStorage; the product objects are DERIVED from
  // `products`. Critical: we must NEVER write `products`-dependent state inside the
  // sync effect below — reading `products` while also assigning it made the effect
  // depend on its own output → effect_update_depth_exceeded, which tore down the
  // page's reactivity (chat/add/category stopped responding until a refresh).
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
    // syncWithNeuralGrid() dispatches these once Supabase data arrives client-side.
    window.addEventListener('productUpdated', refresh);
    window.addEventListener('vendorUpdated', refresh);
    window.addEventListener('recentlyViewedUpdated', loadRecentIds);
    return () => {
      window.removeEventListener('productUpdated', refresh);
      window.removeEventListener('vendorUpdated', refresh);
      window.removeEventListener('recentlyViewedUpdated', loadRecentIds);
    };
  });

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
              offers: {
                '@type': 'Offer',
                price: p.price,
                priceCurrency: 'BDT',
                availability: 'https://schema.org/InStock'
              }
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

  // When a neural (semantic/visual) search is active, show those ranked results instead.
  let displayProducts = $derived(semanticActive ? semanticResults : filteredProducts);

  let categoryVendors = $derived(vendors.filter(v => {
    const matchesDistrict = selectedDistrict === 'all' || v.district === selectedDistrict;
    if (!matchesDistrict) return false;
    if (selectedCategory === 'all') return true;
    return products.some(p => p.vendorId === v.id && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  }));

  const ECO_CATEGORIES = [
    { id: 'all', name: 'সব সংগ্রহ (All)', icon: LayoutGrid },
    { id: 'saree', name: 'শাড়ি (Saree)', icon: Tag },
    { id: 'panjabi', name: 'পাঞ্জাবি (Panjabi)', icon: Tag },
    { id: 'three-piece', name: 'থ্রি-পিস (3-Piece)', icon: Tag },
    { id: 't-shirt', name: 'টি-শার্ট (T-Shirt)', icon: Tag },
    { id: 'pant', name: 'প্যান্ট (Pant)', icon: Tag },
    { id: 'baby', name: 'বেবি আইটেম (Baby)', icon: Tag },
    { id: 'market', name: 'মার্কেট প্লেস (Market)', icon: TrendingUp },
    { id: 'cosmetics', name: 'কসমেটিকস (Cosmetics)', icon: Tag },
    { id: 'undergarments', name: 'আন্ডারগার্মেন্টস (Undergarments)', icon: Tag },
    { id: 'gadgets', name: 'গ্যাজেট (Gadgets)', icon: Tag },
    { id: 'others', name: 'অন্যান্য (Others)', icon: Tag }
  ];

  // Heritage craft pillars — the premium-heritage story (bn + en), gold-accented.
  const HERITAGE_CRAFTS = [
    { bn: 'জামদানি', en: 'Jamdani', story: 'UNESCO-listed Dhakai muslin motifs, handwoven thread by thread.', icon: Feather },
    { bn: 'মসলিন', en: 'Muslin', story: 'The legendary feather-light weave of Bengal, reborn for today.', icon: Gem },
    { bn: 'নকশি কাঁথা', en: 'Nakshi Kantha', story: 'Story-stitched quilts from rural artisan hands.', icon: Scissors },
    { bn: 'তাঁত ও সিল্ক', en: 'Tangail & Rajshahi Silk', story: 'Lustrous silk traditions woven across generations.', icon: Flower2 }
  ];

  // The 4 superpowers — the unfamiliar magic, explained as a guide ("BD-তে এই প্রথম").
  const SUPERPOWERS = [
    { emoji: '📸', title: 'ছবি দিয়ে খুঁজুন', sub: 'পছন্দের রঙ বা কাপড়ের একটা ছবি দিন — Aura সেকেন্ডে সেই ধরনের পণ্য খুঁজে এনে দেবে।', how: 'সার্চ বারে ক্যামেরা আইকনে চাপুন' },
    { emoji: '👗', title: 'গায়ে পরে দেখুন', sub: 'নিজের ছবি দিন — পোশাকটা আপনার গায়ে কেমন লাগবে, কেনার আগেই দেখে নিন।', how: 'যেকোনো পণ্যে "TRY-ON" বাটন' },
    { emoji: '✨', title: 'Aura ইভেন্ট স্টাইলিং', sub: 'বিয়ে, হলুদ, ঈদ বা বেড়ানো — ইভেন্টের নাম বলুন, Aura পুরো সাজ সাজেস্ট করবে।', how: 'Aura চ্যাটে ইভেন্টের নাম লিখুন' },
    { emoji: '💬', title: 'বাংলায় কেনাকাটা', sub: 'বাংলায় কথা বলে পণ্য খুঁজুন, অর্ডার করুন, COD দিন — Aura সব সামলাবে।', how: 'নিচের ডান কোণে চ্যাট বাটন' }
  ];

  // Why Snehalata — bold trust claims (name carries the softness; copy carries the ambition).
  const WHY_SNEHALATA = [
    { icon: ShieldCheck, title: 'AI-Verified', sub: 'যাচাই করা বিক্রেতা — নকল ধরা পড়বেই।' },
    { icon: Store, title: 'সব ব্র্যান্ড এক জায়গায়', sub: 'ছোট দোকান থেকে বড় ব্র্যান্ড, সবার সাধ্যে।' },
    { icon: Sparkles, title: 'নিজের storefront', sub: 'প্রতিটি দোকানের নিজস্ব brand.snehalata.com।' },
    { icon: TrendingUp, title: 'COD + Live Tracking', sub: 'ক্যাশ অন ডেলিভারি ও রিয়েল-টাইম ট্র্যাকিং।' }
  ];
</script>

<svelte:head>
  <title>SNEHALATA Aura — Bangladesh's Unified AI Marketplace | Every Brand in One Place</title>
  <meta
    name="description"
    content="স্নেহলতা Aura — বাংলাদেশের সব ব্র্যান্ড, শোরুম ও দোকান এক AI প্ল্যাটফর্মে। জামদানি থেকে আধুনিক ফ্যাশন, গ্যাজেট থেকে প্রতিদিনের প্রয়োজন — virtual try-on, semantic search আর Neural Grid দিয়ে সহজ কেনাকাটা।" />
  <link rel="canonical" href="https://www.snehalata.com/" />
  <meta name="theme-color" content="#7c3aed" />

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

<div class="min-h-screen bg-[#060507] text-white selection:bg-[#7c3aed]/30 font-sans">
  <!-- Hero — bold, first-AI-marketplace voice; the 3-verb hook -->
  <section class="relative overflow-hidden border-b border-white/5">
    <div class="absolute inset-0 bg-gradient-to-b from-[#7c3aed]/20 via-transparent to-transparent pointer-events-none"></div>
    <div class="max-w-7xl mx-auto px-6 py-16 sm:py-24 lg:py-28 relative">
      <div class="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-[#7c3aed]/15 border border-[#7c3aed]/30 rounded-full">
        <span class="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse"></span>
        <span class="text-[10px] font-black uppercase tracking-[0.3em] text-[#c4b5fd]">বাংলাদেশের প্রথম AI মার্কেটপ্লেস</span>
      </div>
      <h1 class="text-4xl md:text-6xl lg:text-7xl font-serif font-black italic leading-[1.03] max-w-4xl">
        ছবি দিন। <span class="text-aura-gold">গায়ে পরে দেখুন।</span><br class="hidden sm:block" /> তারপর কিনুন।
      </h1>
      <p class="mt-6 text-gray-300 text-base md:text-lg max-w-2xl leading-relaxed">
        কেনার আগে <span class="text-white font-semibold">দেখা যায়</span> — দেশে এই প্রথম। রঙ বা কাপড়ের ছবি দিন, Aura সেকেন্ডে খুঁজে দেবে; গায়ে পরে দেখুন, তারপর নিশ্চিন্তে কিনুন।
      </p>
      <div class="mt-10 flex flex-wrap items-center gap-4">
        <a href="#collection"
          class="px-8 py-4 bg-aura-gold text-black hover:bg-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all inline-flex items-center gap-3 cursor-pointer">
          কেনাকাটা শুরু করুন <ArrowRight size={16} />
        </a>
        <a href="/sell"
          class="px-8 py-4 bg-white/5 border border-white/10 hover:border-aura-gold rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all">
          Sell on Snehalata
        </a>
      </div>
    </div>
  </section>

  <!-- Superpowers — the unfamiliar magic, GUIDED (BD-তে এই প্রথম) -->
  <section class="border-b border-white/5 bg-gradient-to-b from-[#0c0a14] to-[#060507]">
    <div class="max-w-7xl mx-auto px-6 py-16 sm:py-20">
      <div class="flex items-center gap-4 mb-3">
        <span class="h-px w-10 bg-[#7c3aed]/70"></span>
        <span class="text-[10px] font-black uppercase tracking-[0.4em] text-[#c4b5fd]">যা বাংলাদেশে আর কোথাও নেই</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-serif font-black italic mb-3 max-w-3xl leading-tight">
        Aura Intelligence — আপনার <span class="text-aura-gold">নিজের স্টাইলিস্ট</span>
      </h2>
      <p class="text-gray-400 text-sm sm:text-base max-w-2xl mb-12">
        এটি একটি <span class="text-white font-semibold">AI-নিয়ন্ত্রিত মার্কেটপ্লেস</span> — সাধারণ e-commerce যা পারে না, Aura তা পারে।
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        {#each SUPERPOWERS as sp}
          <div class="p-6 rounded-3xl bg-white/[0.03] border border-white/8 hover:border-[#7c3aed]/40 transition-colors">
            <div class="flex items-start gap-4">
              <div class="text-3xl leading-none shrink-0">{sp.emoji}</div>
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1.5">
                  <h3 class="text-lg font-black">{sp.title}</h3>
                  <span class="text-[8px] font-black uppercase tracking-[0.18em] text-[#c4b5fd] bg-[#7c3aed]/15 border border-[#7c3aed]/30 px-2 py-0.5 rounded-full">দেশে এই প্রথম</span>
                </div>
                <p class="text-sm text-gray-400 leading-relaxed">{sp.sub}</p>
                <p class="text-[11px] text-aura-gold/90 mt-2.5 font-bold flex items-center gap-1.5">
                  <ArrowRight size={12} /> {sp.how}
                </p>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Heritage Story Strip -->
  <section class="border-b border-white/5 bg-gradient-to-b from-[#0b0a0d] to-[#060507]">
    <div class="max-w-7xl mx-auto px-6 py-16 sm:py-20">
      <div class="flex items-center gap-4 mb-4">
        <span class="h-px w-10 bg-aura-gold/60"></span>
        <span class="text-[10px] font-black uppercase tracking-[0.4em] text-aura-gold">Featured Collection · Heritage of Bengal</span>
      </div>
      <h2 class="text-3xl sm:text-4xl font-serif font-black italic mb-4 max-w-3xl leading-tight">
        শতাব্দীর <span class="text-aura-gold">তাঁত ও কারুশিল্প</span>, বিশ্বমানে
      </h2>
      <p class="text-gray-400 text-sm sm:text-base max-w-2xl leading-relaxed mb-12">
        সব ব্র্যান্ড, শোরুম ও দোকানের পাশাপাশি এখানে দেশের ঐতিহ্যবাহী তাঁত ও কারুশিল্পও — যাচাই করা, Aura Neural Grid দিয়ে সাজানো। This is one of many collections on Snehalata.
      </p>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {#each HERITAGE_CRAFTS as craft}
          <div class="group relative p-6 sm:p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-aura-gold/40 transition-all duration-500 overflow-hidden">
            <div class="absolute -right-8 -bottom-8 text-aura-gold/[0.06] group-hover:text-aura-gold/10 transition-colors pointer-events-none">
              <svelte:component this={craft.icon} size={120} />
            </div>
            <div class="relative z-10">
              <div class="w-12 h-12 rounded-2xl bg-aura-gold/10 border border-aura-gold/20 flex items-center justify-center text-aura-gold mb-5">
                <svelte:component this={craft.icon} size={20} />
              </div>
              <h3 class="text-lg font-serif font-black italic text-white mb-0.5">{craft.bn}</h3>
              <p class="text-[10px] font-black uppercase tracking-widest text-aura-gold/80 mb-3">{craft.en}</p>
              <p class="text-xs text-gray-500 leading-relaxed">{craft.story}</p>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Why Snehalata — value/trust band -->
  <section class="border-b border-white/5 bg-[#060507]">
    <div class="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {#each WHY_SNEHALATA as w}
        <div class="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
          <div class="p-2.5 rounded-xl bg-aura-gold/10 text-aura-gold shrink-0"><svelte:component this={w.icon} size={18} /></div>
          <div class="min-w-0">
            <div class="text-[13px] font-black text-white">{w.title}</div>
            <div class="text-[10px] text-gray-500 leading-relaxed mt-0.5">{w.sub}</div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Search Header -->
  <div id="collection" class="sticky top-20 z-40 bg-[#060507]/95 backdrop-blur-lg border-b border-white/5 py-6 px-6 scroll-mt-24">
    <div class="max-w-7xl mx-auto flex items-center gap-6">
      <button type="button" onclick={() => isSidebarOpen = !isSidebarOpen} aria-label="Open categories menu"
        class="lg:hidden p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
        <Menu size={20} />
      </button>
      <div class="flex-1 relative group">
        <Search class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#7c3aed] transition-colors" size={20} />
        <input type="text" bind:value={searchQuery} oninput={onSearchInput}
          onkeydown={(e) => e.key === 'Enter' && runSemanticSearch()}
          placeholder="Neural search — describe what you want, or tap the camera"
          class="w-full bg-white/5 border border-white/10 rounded-[2rem] py-4 pl-16 pr-28 text-sm focus:outline-none focus:border-[#7c3aed]/50 focus:ring-8 focus:ring-[#7c3aed]/5 transition-all placeholder:text-gray-600" />
        <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <label class="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-aura-gold text-gray-400 hover:text-aura-gold transition-all cursor-pointer" title="Search by photo">
            <input type="file" accept="image/*" onchange={runVisualSearch} class="hidden" disabled={searchLoading} />
            {#if searchLoading}<Loader2 size={16} class="animate-spin" />{:else}<Camera size={16} />{/if}
          </label>
          <button onclick={runSemanticSearch} aria-label="Neural search" class="p-2.5 rounded-xl bg-[#7c3aed] text-white hover:bg-white hover:text-black transition-all cursor-pointer">
            <Sparkles size={16} />
          </button>
        </div>
      </div>
      <div class="hidden md:flex items-center gap-4">
        <div class="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
          <ShieldCheck size={14} class="text-green-500" />
          <span class="text-[10px] font-black uppercase tracking-widest text-green-500">Neural Verified</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Mobile category rail — always visible so categories never "disappear" behind a drawer -->
  <div class="lg:hidden border-b border-white/5 bg-[#060507]/70 backdrop-blur-xl">
    <div class="max-w-7xl mx-auto px-4 py-3">
      <div class="flex gap-2 overflow-x-auto no-scrollbar">
        {#each ECO_CATEGORIES as cat}
          <button type="button" onclick={() => selectCategory(cat.id)}
            class="flex-shrink-0 px-4 py-2 rounded-xl text-[11px] font-bold border transition-all touch-manipulation {selectedCategory === cat.id ? 'bg-aura-purple border-aura-purple text-white' : 'bg-white/5 border-white/10 text-gray-400'}">
            {cat.name}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto flex relative">
    <!-- Sidebar -->
    <aside class="hidden lg:block w-80 h-[calc(100vh-100px)] sticky top-[100px] overflow-y-auto p-8 border-r border-white/5 no-scrollbar">
      <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 px-4">Neural Grid Categories</h3>
      <nav class="space-y-2">
        {#each ECO_CATEGORIES as cat}
          <button onclick={() => selectCategory(cat.id)}
            class="w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group cursor-pointer {selectedCategory === cat.id ? 'bg-[#7c3aed] text-white shadow-xl shadow-[#7c3aed]/20 translate-x-2' : 'text-gray-400 hover:bg-white/5 hover:text-white'}">
            <div class="flex items-center gap-4">
              <span class={selectedCategory === cat.id ? 'text-white' : 'text-gray-600 group-hover:text-[#7c3aed] transition-colors'}>
                <svelte:component this={cat.icon} size={16} />
              </span>
              <span class="text-[13px] font-bold tracking-wide">{cat.name}</span>
            </div>
            <ChevronRight size={14} class="transition-transform {selectedCategory === cat.id ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-100'}" />
          </button>
        {/each}
      </nav>

      <div class="mt-12 p-8 bg-gradient-to-br from-[#7c3aed]/20 to-indigo-500/20 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
        <div class="relative z-10 text-center">
          <h4 class="text-lg font-serif font-black italic mb-3">SNEHALATA Sell</h4>
          <p class="text-[10px] text-gray-400 leading-relaxed mb-6 font-medium">Launch your AI-powered brand storefront today.</p>
          <a href="/onboarding" class="block w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform text-center">Join Network</a>
        </div>
        <Zap class="absolute -right-6 -bottom-6 text-white/5 group-hover:text-white/10 transition-colors" size={120} />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-6 lg:p-12">
      <!-- Neural Grid A3 — semantic/visual search results banner -->
      {#if semanticActive}
        <section class="mb-10">
          <div class="flex flex-wrap items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-[#7c3aed]/15 to-aura-gold/10 border border-white/10">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-xl bg-[#7c3aed]/20 text-[#7c3aed]"><Sparkles size={16} /></div>
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

      <!-- Neural Grid A7 — real trending rail -->
      {#if !semanticActive && selectedCategory === 'all' && searchQuery === '' && trending.length > 0}
        <section class="mb-16">
          <div class="flex items-center gap-4 mb-8">
            <div class="p-3 bg-aura-gold/10 rounded-2xl text-aura-gold"><TrendingUp size={16} /></div>
            <div>
              <h3 class="text-2xl sm:text-3xl font-serif font-black italic">Trending on the Grid</h3>
              <p class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Ranked live by real views, carts & orders</p>
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-10">
            {#each trending.slice(0, 4) as p (p.id)}
              <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
            {/each}
          </div>
        </section>
      {/if}

      <!-- Neural Grid A2 — behavioral "For You" rail -->
      {#if !semanticActive && selectedCategory === 'all' && searchQuery === '' && recentlyViewed.length > 0}
        <section class="mb-16">
          <div class="flex items-center gap-4 mb-8">
            <div class="p-3 bg-aura-purple/10 rounded-2xl text-aura-purple"><History size={16} /></div>
            <div>
              <h3 class="text-2xl sm:text-3xl font-serif font-black italic">For You · Recently Viewed</h3>
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
          <h2 class="text-4xl font-serif font-black italic leading-none">
            {selectedCategory === 'all' ? 'Neural Collection' : ECO_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </h2>
          <span class="h-px w-12 bg-white/10 hidden sm:block"></span>
          <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">{displayProducts.length} Neural Items</span>
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

      <!-- Featured Vendors -->
      {#if selectedCategory !== 'all' && categoryVendors.length > 0}
        <section class="mb-16">
          <div class="flex items-center justify-between mb-8 px-2">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">
              Verified Artisan Nodes in {ECO_CATEGORIES.find(c => c.id === selectedCategory)?.name}
            </h3>
            <div class="h-px flex-1 mx-8 bg-white/5 hidden sm:block" />
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {#each categoryVendors as v}
              <a href={`/store/${v.slug}`} class="group relative bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl hover:border-[#7c3aed] transition-all cursor-pointer flex items-center gap-6 overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Globe size={80} />
                </div>
                <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                  <Store size={24} class="text-[#7c3aed]" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-xl font-serif font-black italic mb-1 truncate group-hover:text-[#7c3aed] transition-colors">{v.store_name}</h4>
                  <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest truncate">{v.description || 'Verified Artisan Hub'}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <div class="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span class="text-[8px] font-black uppercase tracking-widest text-green-500/80">Neural Node Active</span>
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
            <h3 class="text-2xl font-serif font-bold mb-2">No Neural Signal</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">Try another category or refine your search.</p>
          </div>
        {/if}
      </div>
      {/if}

      {#if !semanticActive && filteredProducts.length > 0}
        <div class="mt-32 text-center border-t border-white/5 pt-20">
          <button class="group px-12 py-5 bg-[#0A0A0A] border border-white/10 rounded-[2rem] hover:border-[#7c3aed] transition-all duration-700 relative overflow-hidden inline-flex items-center gap-4 cursor-pointer">
            <span class="relative z-10 text-[11px] font-black uppercase tracking-[0.4em] text-white">Explore Full Collection</span>
            <ArrowRight size={16} class="group-hover:translate-x-2 transition-transform text-[#7c3aed]" />
          </button>
          <p class="mt-12 text-[10px] text-gray-700 font-black uppercase tracking-[0.5em] leading-relaxed">
            No. 1 Retail AI Ecosystem • Snehalata Aura • World Class Infrastructure
          </p>
        </div>
      {/if}
    </main>
  </div>

  <!-- Mobile Sidebar -->
  {#if isSidebarOpen}
    <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden" transition:fade onclick={() => isSidebarOpen = false} />
    <div class="fixed top-0 left-0 bottom-0 w-80 bg-black z-[60] p-10 lg:hidden border-r border-white/10" transition:fly={{ x: -300, duration: 300 }}>
      <div class="flex items-center justify-between mb-12">
        <h2 class="text-2xl font-serif font-black italic">Categories</h2>
        <button onclick={() => isSidebarOpen = false} class="p-3 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer">
          <X size={24} />
        </button>
      </div>
      <div class="space-y-4">
        {#each ECO_CATEGORIES as cat}
          <button type="button" onclick={() => selectCategory(cat.id)}
            class="w-full flex items-center gap-6 p-5 rounded-3xl border transition-all cursor-pointer {selectedCategory === cat.id ? 'bg-[#7c3aed] border-[#7c3aed] text-white shadow-2xl' : 'bg-white/5 border-white/10 text-gray-400'}">
            <svelte:component this={cat.icon} size={16} />
            <span class="font-bold tracking-wide">{cat.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
