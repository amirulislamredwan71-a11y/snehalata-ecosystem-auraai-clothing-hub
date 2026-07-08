<script lang="ts">
  import { page } from '$app/stores';
  import { Home, LayoutGrid, PackageSearch, User, Shirt } from '@lucide/svelte';
  import { categorySheetOpen } from '$lib/ui';

  // Cart intentionally omitted — the FloatingCart side toggle appears whenever the cart
  // has items, so a dedicated cart tab would be redundant. AR Try-On sits centre (the
  // signature feature); the main nav drawer stays reachable from the top-nav ☰.
  const TABS: { label: string; icon: any; match: (p: string) => boolean; href?: string; action?: () => void }[] = [
    { label: 'Home', href: '/', icon: Home, match: (p) => p === '/' },
    { label: 'Categories', icon: LayoutGrid, action: () => categorySheetOpen.set(true), match: () => false },
    { label: 'AR Try-On', href: '/studio', icon: Shirt, match: (p) => p.startsWith('/studio') },
    { label: 'Track', href: '/tracking', icon: PackageSearch, match: (p) => p.startsWith('/tracking') },
    { label: 'Account', href: '/orders', icon: User, match: (p) => p.startsWith('/orders') }
  ];
</script>

<nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0a0f0d]/95 backdrop-blur-xl border-t border-aura-green/14 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] flex justify-between">
  {#each TABS as t}
    {@const active = t.match($page.url.pathname)}
    {@const Icon = t.icon}
    {#if t.href}
      <a href={t.href} class="flex-1 flex flex-col items-center gap-1 py-1">
        <Icon size={21} class={active ? 'text-aura-green' : 'text-[#5e6d67]'} strokeWidth={1.8} />
        <span class="text-[10px] font-bold whitespace-nowrap {active ? 'text-aura-green' : 'text-[#5e6d67]'}">{t.label}</span>
      </a>
    {:else}
      <button type="button" onclick={t.action} class="flex-1 flex flex-col items-center gap-1 py-1 touch-manipulation">
        <Icon size={21} class="text-[#5e6d67]" strokeWidth={1.8} />
        <span class="text-[10px] font-bold text-[#5e6d67]">{t.label}</span>
      </button>
    {/if}
  {/each}
</nav>
