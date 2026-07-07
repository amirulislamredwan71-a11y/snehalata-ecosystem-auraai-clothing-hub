<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import { ShoppingBag, Menu, X, Sparkles, History, PackageSearch, Store, LayoutGrid, Search, Camera, Loader2 } from '@lucide/svelte';
  import Logo from './Logo.svelte';
  import { fileToCompressedDataURL } from '$lib/imageUpload';

  let isMobileOpen = $state(false);
  let cartCount = $state(0);
  let q = $state('');
  let searchLoading = $state(false);

  function updateCart() {
    try {
      const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
      cartCount = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    } catch { cartCount = 0; }
  }

  // Neural search lives in the global header → text goes to the home via ?q= (matches the
  // site's SearchAction schema); the home reacts to the param and runs the semantic search.
  function submitSearch() {
    const term = q.trim();
    if (!term) return;
    goto('/?q=' + encodeURIComponent(term));
  }

  // Photo/visual search: compress → hand off via sessionStorage → home consumes it.
  async function onCamera(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    searchLoading = true;
    try {
      const base64 = await fileToCompressedDataURL(file);
      sessionStorage.setItem('aura_visual_pending', base64);
      if (location.pathname === '/') {
        window.dispatchEvent(new Event('aura-visual'));
      } else {
        goto('/');
      }
    } catch { /* ignore */ }
    finally { searchLoading = false; input.value = ''; }
  }

  $effect(() => {
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  });

</script>

<nav class="sticky top-0 z-50 bg-[#0a0f0d]/95 backdrop-blur-lg border-b border-aura-green/12 shadow-2xl">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="/" class="flex items-center gap-3 group">
      <Logo size={34} />
      <span class="hidden sm:flex flex-col leading-none">
        <span class="text-base font-bold tracking-wide font-display">
          <span class="text-white">SNEHALATA</span><span class="text-gray-500 text-xs font-normal">.com</span>
        </span>
        <span class="text-aura-gold text-[8px] font-semibold tracking-[0.25em] mt-1 font-display">AURA NEURAL GRID</span>
      </span>
    </a>

    <!-- Neural search — permanent in the header -->
    <div class="flex-1 max-w-xl mx-3 sm:mx-5">
      <div class="relative flex items-center gap-2">
        <div class="flex-1 relative group">
          <Search class="absolute left-3.5 top-1/2 -translate-y-1/2 text-aura-dim group-focus-within:text-aura-green transition-colors" size={16} />
          <input type="text" bind:value={q} onkeydown={(e) => e.key === 'Enter' && submitSearch()}
            placeholder="Neural search · products, brands, stores…"
            aria-label="Neural search"
            class="w-full bg-aura-card border border-aura-green/16 rounded-xl h-10 pl-10 pr-3 text-[13px] focus:outline-none focus:border-aura-green/55 transition-all placeholder:text-aura-dim" />
        </div>
        <label class="w-10 h-10 shrink-0 rounded-xl bg-aura-card border border-aura-green/18 flex items-center justify-center text-aura-green hover:border-aura-green transition-all cursor-pointer" title="Search by photo" aria-label="Search by photo">
          <input type="file" accept="image/*" onchange={onCamera} class="hidden" disabled={searchLoading} />
          {#if searchLoading}<Loader2 size={15} class="animate-spin" />{:else}<Camera size={16} />{/if}
        </label>
      </div>
    </div>

    <div class="hidden lg:flex items-center gap-8">
      <a href="/" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname === '/' ? 'border-aura-green text-aura-green' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <LayoutGrid size={14} /> Hub
      </a>
      <a href="/studio" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname === '/studio' ? 'border-aura-green text-aura-green' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <Sparkles size={14} /> Aura Studio
      </a>
      <a href="/orders" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname.startsWith('/orders') ? 'border-aura-green text-aura-green' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <History size={14} /> History
      </a>
    </div>

    <div class="flex items-center gap-5">
      <a href="/tracking" class="hidden xl:flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-aura-green transition-all">
        <PackageSearch size={12} /> Track Order
      </a>
      <a href="/sell" class="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-aura-gold/10 border border-aura-gold/25 text-[9px] font-black uppercase tracking-[0.25em] text-aura-gold hover:bg-aura-gold/20 transition-colors">
        <Store size={12} /> Sell on Snehalata
      </a>

      <a href="/cart" class="text-gray-500 hover:text-white relative group">
        <ShoppingBag size={20} class="group-hover:scale-110 transition-transform" />
        {#if cartCount > 0}
          <span class="absolute -top-2 -right-2 bg-aura-green text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-[#0a0f0d] shadow-lg">{cartCount}</span>
        {/if}
      </a>
      <button type="button" aria-label="Open menu" onclick={() => isMobileOpen = !isMobileOpen} class="lg:hidden text-white cursor-pointer p-2 -m-2 touch-manipulation">
        {#if isMobileOpen}
          <X size={24} />
        {:else}
          <Menu size={24} />
        {/if}
      </button>
    </div>
  </div>

  {#if isMobileOpen}
    <div class="lg:hidden bg-[#0a0f0d]/97 border-b border-aura-green/12 py-6 px-6" transition:fade={{ duration: 200 }}>
      <div class="flex flex-col gap-6">
        <a href="/" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-green={$page.url.pathname === '/'} class:text-gray-400={$page.url.pathname !== '/'}>
          <LayoutGrid size={16} /> Hub
        </a>
        <a href="/studio" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-green={$page.url.pathname === '/studio'} class:text-gray-400={$page.url.pathname !== '/studio'}>
          <Sparkles size={16} /> Aura Studio
        </a>
        <a href="/orders" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-green={$page.url.pathname.startsWith('/orders')} class:text-gray-400={!$page.url.pathname.startsWith('/orders')}>
          <History size={16} /> History
        </a>
        <a href="/tracking" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-gray-400 hover:text-white">
          <PackageSearch size={16} /> Track Order
        </a>
        <div class="h-px bg-white/10 my-2" />
        <a href="/sell" onclick={() => isMobileOpen = false} class="flex items-center justify-center gap-2 text-sm font-black uppercase tracking-wider text-aura-gold bg-aura-gold/10 border border-aura-gold/25 rounded-xl py-3">
          <Store size={16} /> Sell on Snehalata
        </a>
        <p class="text-[10px] text-gray-600 text-center -mt-1">দোকান/ব্র্যান্ড থাকলে — বিক্রেতা হন</p>
      </div>
    </div>
  {/if}
</nav>
