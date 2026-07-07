<script lang="ts">
  import { page } from '$app/stores';
  import { getVendorBySlug, getProductsByVendor } from '$lib/mockData';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { ArrowLeft, Globe, MapPin } from '@lucide/svelte';
  import type { Vendor } from '$lib/types';

  let vendor: Vendor | undefined = $state();
  let products: any[] = $state([]);

  $effect(() => {
    const slug = $page.params.slug;
    const v = slug ? getVendorBySlug(slug) : undefined;
    vendor = v;
    products = v ? getProductsByVendor(Number(v.id)) : [];
  });
</script>

{#if !vendor}
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#080b09]">
    <h1 class="text-2xl font-serif text-gray-500">স্টোর খুঁজে পাওয়া যায়নি</h1>
    <a href="/" class="text-aura-gold hover:underline">নীড়ে ফিরে যান</a>
  </div>
{:else}
  <div class="min-h-screen bg-[#080b09] pb-20">
    <div class="h-64 bg-gradient-to-r from-[#1b1410] to-[#060507] relative overflow-hidden">
      <div class="absolute inset-0 opacity-[0.15]" style="background-image: radial-gradient(circle at 20% 30%, rgba(199,154,62,0.25), transparent 45%)"></div>
      <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#060507] to-transparent"></div>
    </div>

    <div class="max-w-7xl mx-auto px-6 -mt-32 relative z-10">
      <a href="/" class="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft size={16} /> নীড়ে ফিরে যান
      </a>

      <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl">
        <div class="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-4xl font-serif font-bold text-white">{vendor.store_name}</h1>
              {#if vendor.status === 'APPROVED'}
                <span class="text-green-500 bg-green-500/10 px-2 py-1 rounded text-xs font-bold uppercase border border-green-500/20">অফিসিয়াল পার্টনার</span>
              {:else}
                <span class="text-red-500 bg-red-500/10 px-2 py-1 rounded text-xs font-bold uppercase border border-red-500/20">রিভিউ চলছে</span>
              {/if}
            </div>
            <p class="text-gray-400 max-w-2xl text-lg font-light leading-relaxed">{vendor.description}</p>
            <div class="mt-4 flex flex-wrap gap-4 text-xs font-bold uppercase tracking-widest text-gray-500">
              <span>ID: #{String(vendor.id).padStart(4, '0')}</span>
              <span>•</span>
              <span>Artisan: {vendor.owner_name}</span>
              {#if vendor.district}
                <span>•</span>
                <span class="flex items-center gap-1">
                  <MapPin size={12} class="text-aura-gold" /> {vendor.district}{vendor.area ? `, ${vendor.area}` : ''}
                </span>
              {/if}
            </div>
          </div>

          {#if vendor.website_url}
            <div class="flex items-start">
              <a href={vendor.website_url} target="_blank" rel="noreferrer" class="bg-gradient-to-br from-aura-green-deep to-aura-green-bright text-black px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:brightness-110 transition-all flex items-center gap-2">
                Visit Official Website <Globe size={16} />
              </a>
            </div>
          {/if}
        </div>
      </div>

      <h2 class="text-2xl font-serif font-bold mb-8 border-l-4 border-aura-gold pl-4">এক্সক্লুসিভ কালেকশন</h2>
      {#if products.length === 0}
        <div class="text-center py-24 border border-white/5 rounded-3xl bg-white/[0.02]">
          <div class="text-5xl mb-5">🧵</div>
          <h3 class="text-xl font-serif font-bold text-white mb-2">নতুন কালেকশন শীঘ্রই আসছে</h3>
          <p class="text-gray-500 text-sm max-w-md mx-auto mb-8">এই দোকানের পণ্য যাচাই ও সাজানো হচ্ছে — খুব শিগগিরই Aura Neural Grid-এ লাইভ হবে।</p>
          <a href="/" class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-br from-aura-green-deep to-aura-green-bright text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">অন্যান্য কালেকশন দেখুন</a>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {#each products as product (product.id)}
            <ProductCard {product} {vendor} />
          {/each}
        </div>
      {/if}

      <div class="mt-16 text-center">
        <a href="/dashboard" class="text-[11px] text-gray-600 hover:text-aura-green transition-colors uppercase tracking-widest font-bold">এই দোকানটি আপনার? — Manage Shop →</a>
      </div>
    </div>
  </div>
{/if}
