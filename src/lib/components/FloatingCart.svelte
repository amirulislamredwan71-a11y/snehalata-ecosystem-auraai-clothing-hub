<script lang="ts">
  import { ShoppingBag } from '@lucide/svelte';
  import { fade, fly } from 'svelte/transition';
  
  let count = $state(0);
  let total = $state(0);
  let pulse = $state(false);
  
  function updateStats() {
    try {
      const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
      count = cart.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0);
      total = cart.reduce((acc: number, item: any) => acc + (item.price * (item.quantity || 1)), 0);
      if (count > 0) {
        pulse = true;
        setTimeout(() => pulse = false, 1000);
      }
    } catch { count = 0; total = 0; }
  }
  
  $effect(() => {
    updateStats();
    window.addEventListener('cartUpdated', updateStats);
    return () => window.removeEventListener('cartUpdated', updateStats);
  });
</script>

<div class="fixed right-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4 items-end pointer-events-none">
  {#if count > 0}
    <div transition:fly={{ x: 100, duration: 400 }} class="pointer-events-auto">
      <button onclick={() => window.location.href = '/cart'}
        class="flex flex-col items-center bg-[#E11D48] text-white rounded-l-2xl shadow-2xl transition-all active:scale-95 border-l border-y border-white/20 cursor-pointer {pulse ? 'scale-110' : ''} {!pulse ? 'hover:scale-105' : ''}">
        <div class="p-3 flex flex-col items-center border-b border-white/10 w-full">
          <ShoppingBag size={20} class="mb-1" />
          <span class="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
            {count} ITEMS
          </span>
        </div>
        <div class="p-3 bg-black/10 w-full rounded-bl-2xl">
          <span class="text-[12px] font-black tabular-nums tracking-tighter">৳{total.toLocaleString()}</span>
        </div>
      </button>
    </div>
  {/if}
</div>
