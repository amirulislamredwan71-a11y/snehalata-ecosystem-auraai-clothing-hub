<script lang="ts">
  import { page } from '$app/stores';
  import { Home, LayoutGrid, PackageSearch, ShoppingBag, User } from '@lucide/svelte';

  let cartCount = $state(0);
  function updateCart() {
    try {
      const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
      cartCount = cart.reduce((a: number, i: any) => a + (i.quantity || 1), 0);
    } catch { cartCount = 0; }
  }
  $effect(() => {
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  });

  const TABS = [
    { label: 'Home', href: '/', icon: Home, match: (p: string) => p === '/' },
    { label: 'Categories', href: '/#collection', icon: LayoutGrid, match: () => false },
    { label: 'Track', href: '/tracking', icon: PackageSearch, match: (p: string) => p.startsWith('/tracking') },
    { label: 'Cart', href: '/cart', icon: ShoppingBag, match: (p: string) => p.startsWith('/cart') },
    { label: 'Account', href: '/orders', icon: User, match: (p: string) => p.startsWith('/orders') }
  ];
</script>

<nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-xl border-t border-aura-green/14 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] flex justify-between">
  {#each TABS as t}
    {@const active = t.match($page.url.pathname)}
    {@const Icon = t.icon}
    <a href={t.href} class="flex-1 flex flex-col items-center gap-1 py-1 relative">
      <div class="relative">
        <Icon size={21} class={active ? 'text-aura-green' : 'text-[#5e6d67]'} strokeWidth={1.8} />
        {#if t.label === 'Cart' && cartCount > 0}
          <span class="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-aura-green text-black text-[8px] font-black flex items-center justify-center">{cartCount}</span>
        {/if}
      </div>
      <span class="text-[10px] font-bold {active ? 'text-aura-green' : 'text-[#5e6d67]'}">{t.label}</span>
    </a>
  {/each}
</nav>
