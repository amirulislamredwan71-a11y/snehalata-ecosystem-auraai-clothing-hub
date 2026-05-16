<script lang="ts">
  import { page } from '$app/stores';
  import { ShoppingBag, Search, Menu, X, Sparkles, History, PackageSearch, UserPlus, Globe, LayoutDashboard, LayoutGrid } from '@lucide/svelte';
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
  
  function searchClick() {
    alert('Neural search feature coming soon in Aura v2.0');
  }
</script>

<nav class="sticky top-0 z-50 bg-black/80 backdrop-blur-3xl border-b border-white/5 shadow-2xl">
  <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
    <a href="/" class="flex items-center gap-4 group">
      <Logo />
      <span class="text-lg font-bold tracking-wider hidden sm:block">
        <span class="text-white">SNEHALATA</span>
        <span class="text-aura-purple text-xs ml-1 font-normal">ECOSYSTEM</span>
      </span>
    </a>

    <div class="hidden lg:flex items-center gap-8">
      <a href="/" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname === '/' ? 'border-aura-purple text-aura-purple' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <LayoutGrid size={14} /> Hub
      </a>
      <a href="/studio" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname === '/studio' ? 'border-aura-purple text-aura-purple' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <Sparkles size={14} /> Studio
      </a>
      <a href="/orders" class="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] py-1 border-b-2 transition-all duration-300 {$page.url.pathname.startsWith('/orders') ? 'border-aura-purple text-aura-purple' : 'text-gray-500 border-transparent hover:text-white hover:-translate-y-px'}">
        <History size={14} /> History
      </a>
    </div>

    <div class="flex items-center gap-8">
      <div class="hidden xl:flex items-center gap-6 pr-6 border-r border-white/10">
        <a href="/" class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-aura-purple transition-all group">
          <Globe size={12} class="text-gray-700 group-hover:text-aura-purple transition-colors" /> Ecosystem Hub
        </a>
        <a href="/onboarding" class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-aura-purple transition-all group">
          <UserPlus size={12} class="text-gray-700 group-hover:text-aura-purple transition-colors" /> Registration
        </a>
        <a href="/dashboard" class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-aura-purple transition-all group">
          <LayoutDashboard size={12} class="text-gray-700 group-hover:text-aura-purple transition-colors" /> Vendor Portal
        </a>
        <a href="/tracking" class="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-aura-purple transition-all group">
          <PackageSearch size={12} class="text-gray-700 group-hover:text-aura-purple transition-colors" /> Track Order
        </a>
      </div>

      <div class="flex items-center gap-6">
        <button onclick={searchClick} class="text-gray-500 hover:text-white transition-colors cursor-pointer">
          <Search size={20} />
        </button>
        <a href="/cart" class="text-gray-500 hover:text-white relative group">
          <ShoppingBag size={20} class="group-hover:scale-110 transition-transform" />
          {#if cartCount > 0}
            <span class="absolute -top-2 -right-2 bg-[#7c3aed] text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border border-black shadow-lg">{cartCount}</span>
          {/if}
        </a>
        <button onclick={() => isMobileOpen = !isMobileOpen} class="lg:hidden text-white cursor-pointer">
          {#if isMobileOpen}
            <X size={24} />
          {:else}
            <Menu size={24} />
          {/if}
        </button>
      </div>
    </div>
  </div>

  {#if isMobileOpen}
    <div class="lg:hidden bg-black/95 border-b border-white/10 py-6 px-6" transition:fade={{ duration: 200 }}>
      <div class="flex flex-col gap-6">
        <a href="/" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-purple={$page.url.pathname === '/'} class:text-gray-400={$page.url.pathname !== '/'}>
          <LayoutGrid size={16} /> Hub
        </a>
        <a href="/studio" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-purple={$page.url.pathname === '/studio'} class:text-gray-400={$page.url.pathname !== '/studio'}>
          <Sparkles size={16} /> Studio
        </a>
        <a href="/orders" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm font-black uppercase tracking-wider"
           class:text-aura-purple={$page.url.pathname.startsWith('/orders')} class:text-gray-400={!$page.url.pathname.startsWith('/orders')}>
          <History size={16} /> History
        </a>
        <div class="h-px bg-white/10 my-2" />
        <a href="/onboarding" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <UserPlus size={14} /> Vendor Registration
        </a>
        <a href="/dashboard" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <LayoutDashboard size={14} /> Vendor Portal
        </a>
        <a href="/tracking" onclick={() => isMobileOpen = false} class="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <PackageSearch size={14} /> Track Order
        </a>
      </div>
    </div>
  {/if}
</nav>
