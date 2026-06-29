<script lang="ts">
  import { browser } from '$app/environment';
  import { fade, fly, scale } from 'svelte/transition';
  import { Search, LayoutGrid, Tag, ChevronRight, TrendingUp, Zap, ArrowRight, ShieldCheck, ShoppingBag, Menu, X, Filter, Globe, Store } from '@lucide/svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { getProducts, getVendors } from '$lib/mockData';
  import { BD_LOCATIONS } from '$lib/locationData';

  let { data } = $props();

  let selectedCategory = $state('all');
  let selectedDistrict = $state('all');
  let searchQuery = $state('');
  let isSidebarOpen = $state(false);
  // Seeded from the server load so the grid renders during SSR / first paint.
  let products = $state<any[]>(data?.products ?? []);
  let vendors = $state<any[]>(data?.vendors ?? []);

  $effect(() => {
    if (!browser) return;
    const refresh = () => {
      products = getProducts();
      vendors = getVendors();
    };
    refresh();
    // syncWithNeuralGrid() dispatches these once Supabase data arrives client-side.
    window.addEventListener('productUpdated', refresh);
    window.addEventListener('vendorUpdated', refresh);
    return () => {
      window.removeEventListener('productUpdated', refresh);
      window.removeEventListener('vendorUpdated', refresh);
    };
  });

  const SITE_URL = 'https://snehalata.com';
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
            'AI-powered e-commerce ecosystem empowering local Bangladeshi artisans with global-standard technology.',
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
    { id: 'others', name: 'অন্যান্য (Others)', icon: Tag }
  ];
</script>

<svelte:head>
  <title>SNEHALATA Aura — AI Neural Ecosystem for Bangladeshi Artisans</title>
  <meta
    name="description"
    content="স্নেহলতা Aura — an AI-powered marketplace connecting Bangladesh's artisans to the world. Discover Jamdani sarees, Muslin panjabis, streetwear & more with virtual try-on, neural search and verified vendors." />
  <link rel="canonical" href="https://snehalata.com/" />
  <meta name="theme-color" content="#7c3aed" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="SNEHALATA Aura" />
  <meta property="og:title" content="SNEHALATA Aura — AI Neural Ecosystem for Bangladeshi Artisans" />
  <meta
    property="og:description"
    content="AI-powered marketplace for Bangladesh's artisans: Jamdani, Muslin, streetwear & more — with virtual try-on and neural search." />
  <meta property="og:url" content="https://snehalata.com/" />
  <meta property="og:image" content="https://snehalata.com/og-cover.svg" />
  <meta property="og:locale" content="bn_BD" />
  <meta property="og:locale:alternate" content="en_US" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SNEHALATA Aura — AI Neural Ecosystem" />
  <meta
    name="twitter:description"
    content="AI-powered marketplace for Bangladesh's artisans, with virtual try-on and neural search." />
  <meta name="twitter:image" content="https://snehalata.com/og-cover.svg" />

  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<div class="min-h-screen bg-[#050505] text-white selection:bg-[#7c3aed]/30 font-sans">
  <!-- Search Header -->
  <div class="sticky top-20 z-40 bg-black/80 backdrop-blur-3xl border-b border-white/5 py-6 px-6">
    <div class="max-w-7xl mx-auto flex items-center gap-6">
      <button onclick={() => isSidebarOpen = !isSidebarOpen}
        class="lg:hidden p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
        <Menu size={20} />
      </button>
      <div class="flex-1 relative group">
        <Search class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#7c3aed] transition-colors" size={20} />
        <input type="text" bind:value={searchQuery}
          placeholder="SNEHALATA Aura AI-তে সার্চ করুন..."
          class="w-full bg-white/5 border border-white/10 rounded-[2rem] py-4 pl-16 pr-6 text-sm focus:outline-none focus:border-[#7c3aed]/50 focus:ring-8 focus:ring-[#7c3aed]/5 transition-all placeholder:text-gray-600" />
      </div>
      <div class="hidden md:flex items-center gap-4">
        <div class="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
          <ShieldCheck size={14} class="text-green-500" />
          <span class="text-[10px] font-black uppercase tracking-widest text-green-500">Neural Verified</span>
        </div>
        <a href="/cart" class="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:border-[#7c3aed] transition-colors">
          <ShoppingBag size={20} />
        </a>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto flex relative">
    <!-- Sidebar -->
    <aside class="hidden lg:block w-80 h-[calc(100vh-100px)] sticky top-[100px] overflow-y-auto p-8 border-r border-white/5 no-scrollbar">
      <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 px-4">Neural Grid Categories</h3>
      <nav class="space-y-2">
        {#each ECO_CATEGORIES as cat}
          <button onclick={() => selectedCategory = cat.id}
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
      <div class="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
        <div class="flex items-center gap-4">
          <h2 class="text-4xl font-serif font-black italic leading-none">
            {selectedCategory === 'all' ? 'Neural Collection' : ECO_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </h2>
          <span class="h-px w-12 bg-white/10 hidden sm:block"></span>
          <span class="text-[10px] font-black uppercase tracking-widest text-gray-500">{filteredProducts.length} Neural Items</span>
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

      <!-- Category Sections (All) -->
      {#if selectedCategory === 'all' && searchQuery === ''}
        <div class="space-y-32 mb-32">
          {#each ECO_CATEGORIES.filter(c => c.id !== 'all').slice(0, 4) as cat}
            {@const catProducts = products.filter(p => p.category.toLowerCase().includes(cat.id)).slice(0, 4)}
            {#if catProducts.length > 0}
              <section>
                <div class="flex items-center justify-between mb-12">
                  <div class="flex items-center gap-4">
                    <div class="p-3 bg-[#7c3aed]/10 rounded-2xl text-[#7c3aed]">
                      <svelte:component this={cat.icon} size={16} />
                    </div>
                    <h3 class="text-3xl font-serif font-black italic">{cat.name}</h3>
                  </div>
                  <button onclick={() => selectedCategory = cat.id}
                    class="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2 cursor-pointer">
                    Explore All <ChevronRight size={14} />
                  </button>
                </div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
                  {#each catProducts as p}
                    <div transition:fly={{ y: 20, duration: 300, delay: 50 * catProducts.indexOf(p) }}>
                      <ProductCard product={p} />
                    </div>
                  {/each}
                </div>
              </section>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Product Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-10">
        {#each filteredProducts as p, idx (p.id)}
          <div transition:fly={{ y: 30, duration: 400, delay: idx * 50 }}>
            <ProductCard product={p} vendor={vendors.find(v => v.id === p.vendorId)} />
          </div>
        {/each}

        {#if filteredProducts.length === 0}
          <div class="col-span-full py-40 text-center">
            <div class="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
              <Search size={32} class="text-gray-800" />
            </div>
            <h3 class="text-2xl font-serif font-bold mb-2">No Neural Signal</h3>
            <p class="text-gray-500 text-sm max-w-xs mx-auto">Try another category or decipher your search query.</p>
          </div>
        {/if}
      </div>

      {#if filteredProducts.length > 0}
        <div class="mt-32 text-center border-t border-white/5 pt-20">
          <button class="group px-12 py-5 bg-[#0A0A0A] border border-white/10 rounded-[2rem] hover:border-[#7c3aed] transition-all duration-700 relative overflow-hidden inline-flex items-center gap-4 cursor-pointer">
            <span class="relative z-10 text-[11px] font-black uppercase tracking-[0.4em] text-white">Load More Decrypted Artifacts</span>
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
          <button onclick={() => { selectedCategory = cat.id; isSidebarOpen = false; }}
            class="w-full flex items-center gap-6 p-5 rounded-3xl border transition-all cursor-pointer {selectedCategory === cat.id ? 'bg-[#7c3aed] border-[#7c3aed] text-white shadow-2xl' : 'bg-white/5 border-white/10 text-gray-400'}">
            <svelte:component this={cat.icon} size={16} />
            <span class="font-bold tracking-wide">{cat.name}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
