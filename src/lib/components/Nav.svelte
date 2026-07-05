<script lang="ts">
  import { page } from '$app/stores';
  import { fade } from 'svelte/transition';
  import { ShoppingBag, Menu, X, Sparkles, History, PackageSearch, Store, LayoutGrid } from '@lucide/svelte';
  import Logo from './Logo.svelte';
  
  let isMobileOpen = $state(false);
  let cartCount = $state(0);
  
  function updateCart() {
    try {
      const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
      cartCount = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
    } catch { cartCount = 0; }
  }
  
  $effect(() => {
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  });
  
</script>

<nav class="sticky top-0 z-50 bg-[#060507]/95 backdrop-blur-lg border-b border-white/5 shadow-2xl">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="/" class="flex items-center gap-4 group">
      <Logo />
      <span class="text-lg font-bold tracking-wider hidden sm:block">
        <span class="text-white">SNEHALATA</span>
        <span class="text-aura-gold text-xs ml-1 font-normal tracking-[0.3em]">ECOSYSTEM</span>
      </span>
    </a>

    <div class="hidden lg:flex items-center gap-8">
      <a href="/" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname === '/' ? 'border-aura-purple text-aura-purple' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <LayoutGrid size={14} /> Hub
      </a>
      <a href="/studio" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname === '/studio' ? 'border-aura-purple text-aura-purple' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <Sparkles size={14} /> Aura Studio
      </a>
      <a href="/orders" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname.startsWith('/orders') ? 'border-aura-purple text-aura-purple' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <History size={14} /> History
      </a>
    </div>

    <div class="flex items-center gap-5">
      <a href="/tracking" class="hidden xl:flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-aura-purple transition-all">
        <PackageSearch size={12} /> Track Order
      </a>
      <a href="/sell" class="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-aura-gold/10 border border-aura-gold/25 text-[9px] font-black uppercase tracking-[0.25em] text-aura-gold hover:bg-aura-gold/20 transition-colors">
        <Store size={12} /> Sell on Snehalata
      </a>

      <a href="/cart" class="text-gray-500 hover:text-white relative group">
        <ShoppingBag size={20} class="group-hover:scale-110 transition-transform" />
        {#if cartCount > 0}
          <span class="absolute -top-2 -right-2 bg-[#7c3aed] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-black shadow-lg">{cartCount}</span>
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
    <div class="lg:hidden bg-[#060507]/97 border-b border-aura-gold/10 py-6 px-6" transition:fade={{ duration: 200 }}>
      <div class="flex flex-col gap-6">
        <a href="/" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-purple={$page.url.pathname === '/'} class:text-gray-400={$page.url.pathname !== '/'}>
          <LayoutGrid size={16} /> Hub
        </a>
        <a href="/studio" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-purple={$page.url.pathname === '/studio'} class:text-gray-400={$page.url.pathname !== '/studio'}>
          <Sparkles size={16} /> Aura Studio
        </a>
        <a href="/orders" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-purple={$page.url.pathname.startsWith('/orders')} class:text-gray-400={!$page.url.pathname.startsWith('/orders')}>
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
