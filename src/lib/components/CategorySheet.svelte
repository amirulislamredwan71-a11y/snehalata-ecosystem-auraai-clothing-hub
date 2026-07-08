<script lang="ts">
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { X, ShieldCheck } from '@lucide/svelte';
  import { categorySheetOpen, siteCategories } from '$lib/ui';

  function pick(id: string) {
    categorySheetOpen.set(false);
    goto('/?cat=' + id);
  }
</script>

{#if $categorySheetOpen}
  <div class="lg:hidden fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm"
    transition:fade={{ duration: 150 }} onclick={() => categorySheetOpen.set(false)}></div>
  <div class="lg:hidden fixed inset-x-0 bottom-0 z-[91] bg-[#0a0f0d] border-t border-aura-green/20 rounded-t-3xl px-5 pt-3 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[82vh] overflow-y-auto no-scrollbar shadow-2xl"
    transition:fly={{ y: 400, duration: 300 }}>
    <div class="w-10 h-1 rounded-full bg-white/15 mx-auto mb-4"></div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-display text-lg font-bold text-aura-cream">ক্যাটাগরি · Categories</h3>
      <button onclick={() => categorySheetOpen.set(false)} aria-label="Close" class="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
    </div>
    <div class="grid grid-cols-3 gap-3">
      {#each $siteCategories as cat}
        {@const Icon = cat.icon}
        <button type="button" onclick={() => pick(cat.id)}
          class="flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-white/[0.03] border border-aura-green/12 hover:border-aura-green/50 active:scale-95 transition-all touch-manipulation">
          <div class="relative w-full aspect-square rounded-xl overflow-hidden">
            {#if cat.cover}
              <img src={cat.cover} alt={cat.name} loading="lazy" class="absolute inset-0 w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"></div>
              <div class="absolute top-1 right-1"><ShieldCheck size={12} class="text-aura-green drop-shadow" /></div>
            {:else}
              <div class="w-full h-full bg-aura-green/10 flex items-center justify-center text-aura-green"><Icon size={22} /></div>
            {/if}
          </div>
          <span class="text-[11px] font-semibold text-[#dde5e1] text-center leading-tight">{cat.name}</span>
        </button>
      {/each}
    </div>
  </div>
{/if}
