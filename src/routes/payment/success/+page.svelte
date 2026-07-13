<script lang="ts">
  import { page } from '$app/stores';
  import { CheckCircle2, Truck, ShoppingBag } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { metaTrack } from '$lib/pixel';

  const orderId = $derived($page.url.searchParams.get('order') || '');
  const tracking = $derived($page.url.searchParams.get('t') || '');

  // Payment settled → clear the cart so it isn't re-ordered + fire the Meta Purchase conversion.
  onMount(() => {
    try {
      localStorage.setItem('aura_cart', '[]');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch { /* ignore */ }
    const v = Number($page.url.searchParams.get('v')) || 0;
    metaTrack('Purchase', { value: v, currency: 'BDT' });
  });
</script>

<svelte:head><title>পেমেন্ট সফল — Snehalata</title></svelte:head>

<div class="min-h-screen bg-[#080b09] flex items-center justify-center p-6">
  <div class="max-w-md w-full text-center space-y-6 bg-white/[0.03] border border-aura-green/25 rounded-[2.5rem] p-8 sm:p-10">
    <div class="w-20 h-20 rounded-[1.75rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
      <CheckCircle2 size={44} class="text-green-400" />
    </div>
    <div>
      <h1 class="text-2xl font-serif font-black text-white">পেমেন্ট সফল হয়েছে ✓</h1>
      <p class="text-gray-400 mt-2 text-sm">আপনার অর্ডার নিশ্চিত হয়েছে। Aura আপনার অর্ডার প্রসেস করছে।</p>
    </div>
    {#if tracking}
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4">
        <p class="text-[10px] uppercase tracking-widest text-gray-500 font-black">ট্র্যাকিং আইডি</p>
        <p class="text-lg font-black text-aura-green tabular-nums">{tracking}</p>
      </div>
    {/if}
    <div class="grid grid-cols-1 gap-3">
      {#if tracking}
        <a href={`/tracking/${tracking}`} class="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-aura-green text-black font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all">
          <Truck size={16} /> অর্ডার ট্র্যাক করুন
        </a>
      {/if}
      <a href="/" class="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-black transition-all">
        <ShoppingBag size={16} /> আরও কেনাকাটা করুন
      </a>
    </div>
  </div>
</div>
