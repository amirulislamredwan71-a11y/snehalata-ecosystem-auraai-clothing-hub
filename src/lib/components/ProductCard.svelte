<script lang="ts">
  import { goto } from '$app/navigation';
  import { Eye, X, Plus, Minus, CheckCircle2, ShoppingBag, Shirt, Sparkles, ShieldCheck, Palette, Loader2, Share2, Zap } from '@lucide/svelte';
  import { track } from '$lib/analytics';
  import { productImg, imgFallback } from '$lib/imageUpload';
  import { fade, scale, fly } from 'svelte/transition';
  import type { Product, Vendor } from '$lib/types';

  let { product, vendor }: { product: Product; vendor?: Vendor } = $props();

  let isModalOpen = $state(false);
  let isRefineModalOpen = $state(false);
  let isRefining = $state(false);
  let currentImageUrl = $state(product.imageUrl);
  let quantity = $state(1);
  let isAdded = $state(false);
  let isQuickAdded = $state(false);

  const STYLE_PRESETS = [
    { id: 'vintage', name: 'Vintage', prompt: 'Apply a warm, nostalgic vintage film aesthetic with muted colors, soft lighting, and subtle grain.', icon: '🎬' },
    { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'Apply a cyberpunk aesthetic with neon pink and blue lighting, high contrast, and a futuristic, dark atmosphere.', icon: '🦾' },
    { id: 'minimalist', name: 'Minimal', prompt: 'Apply a minimalist aesthetic with clean lines, neutral colors, and a bright, airy, uncluttered background.', icon: '⚪' },
    { id: 'bohemian', name: 'Boho', prompt: 'Apply a bohemian aesthetic with earthy tones, natural textures, warm sunlight, and a cozy, eclectic vibe.', icon: '🌿' },
  ];

  function openModal() {
    isModalOpen = true;
    // Neural Grid A1 — product view signal (deduped per session in the tracker).
    track('view', { product_id: Number(product.id), vendor_id: vendor ? Number(vendor.id) : null });
    // Neural Grid A2 — remember recently viewed (most-recent-first, max 12) for the "For You" rail.
    try {
      const key = 'aura_recently_viewed';
      const prev: number[] = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [Number(product.id), ...prev.filter((id) => id !== Number(product.id))].slice(0, 12);
      localStorage.setItem(key, JSON.stringify(next));
      window.dispatchEvent(new Event('recentlyViewedUpdated'));
    } catch { /* ignore storage errors */ }
  }

  function addToCart(imgUrl: string, qty: number) {
    const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    const existing = cart.findIndex((i: any) => i.id === product.id);
    if (existing > -1) cart[existing].quantity += qty;
    else cart.push({ ...product, imageUrl: imgUrl, quantity: qty });
    localStorage.setItem('aura_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    track('add_to_cart', { product_id: Number(product.id), vendor_id: vendor ? Number(vendor.id) : null, meta: { qty } });
  }

  function handleQuickAdd(e: MouseEvent) {
    e.stopPropagation();
    addToCart(currentImageUrl, 1);
    isQuickAdded = true;
    setTimeout(() => isQuickAdded = false, 2000);
  }

  function handleFastCheckout(e: MouseEvent) {
    e.stopPropagation();
    addToCart(currentImageUrl, 1);
    goto('/cart');
  }

  function handleModalAdd() {
    addToCart(currentImageUrl, quantity);
    isAdded = true;
    setTimeout(() => goto('/cart'), 800);
  }

  async function handleShare(e: MouseEvent) {
    e.stopPropagation();
    const data = { title: product.name, text: `Check out ${product.name} on Snehalata Ecosystem! Price: ৳${product.price}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(data); } catch {} }
    else { navigator.clipboard.writeText(`${data.text}\n${data.url}`); alert("Product info copied to clipboard"); }
  }

  async function convertUrlToBase64(url: string): Promise<string> {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((res, rej) => { const r = new FileReader(); r.onloadend = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob); });
  }

  async function handleApplyStyle(presetPrompt: string) {
    isRefining = true;
    isRefineModalOpen = false;
    try {
      const base64 = await convertUrlToBase64(currentImageUrl);
      // Lazy-load the heavy AI service only when the user actually refines a style,
      // keeping the ProductCard's initial bundle lean (many cards hydrate on the HUB).
      const { editAuraImage } = await import('$lib/geminiService');
      const refined = await editAuraImage(presetPrompt, base64);
      if (refined.image) currentImageUrl = refined.image;
    } catch (e) { console.error("Style refinement failed", e); }
    finally { isRefining = false; }
  }

  function closeModal() { isModalOpen = false; isAdded = false; quantity = 1; }
</script>

<div class="group space-y-4">
  <div onclick={openModal}
    class="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/5 group-hover:border-aura-gold/40 transition-all duration-500 shadow-xl cursor-pointer">
    
    <img src={productImg(currentImageUrl)} onerror={imgFallback} alt={product.name} loading="lazy" decoding="async"
      class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />

    <div class="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/45 border border-aura-gold/25">
      <ShieldCheck size={10} class="text-aura-gold" />
      <span class="text-[7px] font-black uppercase tracking-[0.2em] text-aura-gold">Verified</span>
    </div>

    {#if isRefining}
      <div class="absolute inset-0 bg-black/60 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4">
        <div class="relative">
          <Loader2 size={48} class="animate-spin text-[#10b981]" />
          <Sparkles size={16} class="absolute inset-0 m-auto text-white animate-pulse" />
        </div>
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white">Aura Refinement Active</p>
      </div>
    {/if}
    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
  </div>

  <div class="space-y-3 px-1 sm:px-2">
    <div class="flex justify-between items-start gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="text-[13px] sm:text-[15px] font-bold text-white group-hover:text-[#10b981] transition-colors truncate mb-0.5">{product.name}</h3>
        {#if vendor}
          <a href={`/store/${vendor.slug}`} class="text-[8px] text-gray-600 uppercase tracking-widest block hover:text-white transition-colors">{vendor.store_name}</a>
        {/if}
        <div class="text-[13px] sm:text-[15px] font-black text-aura-gold tabular-nums mt-1">৳{product.price.toLocaleString()}</div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <button onclick={handleQuickAdd}
        class="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer {isQuickAdded ? 'bg-green-500 text-white' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black'}">
        {#if isQuickAdded}
            <CheckCircle2 size={12} /> Added
          {:else}
            <ShoppingBag size={12} /> Add
          {/if}
      </button>
      <button onclick={handleFastCheckout}
        class="flex items-center justify-center gap-1.5 py-2.5 bg-[#10b981] text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
        <Zap size={12} class="fill-current" /> Buy
      </button>
    </div>

    <div class="flex items-center justify-between pt-2 border-t border-white/5">
      <div class="flex items-center gap-3">
        <button onclick={handleShare} class="flex items-center gap-1 text-gray-600 hover:text-white transition-colors cursor-pointer" title="Share Artifact">
          <Share2 size={14} />
        </button>
        <a href={`/store/${vendor?.slug || ''}`} class="flex items-center gap-1 text-gray-600 hover:text-white transition-colors" title="Explore Brand">
          <Eye size={14} />
        </a>
      </div>
      <a href={`/try-on/${product.id}`}
        class="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] hover:bg-[#10b981]/20 border border-white/5 rounded-lg text-gray-500 hover:text-[#10b981] transition-all group/try">
        <Shirt size={10} /> <span class="text-[7px] font-black uppercase tracking-widest">Try-on</span>
      </a>
    </div>
  </div>
</div>

<!-- Style Refinement Modal -->
{#if isRefineModalOpen}
  <div class="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl" transition:fade={{ duration: 200 }}>
    <div class="relative w-full max-w-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[3rem] p-1 shadow-2xl overflow-hidden" transition:scale={{ duration: 300 }}>
      <div class="bg-black/40 backdrop-blur-3xl rounded-[2.9rem] p-10 md:p-12 relative z-10">
        <button onclick={() => isRefineModalOpen = false} class="absolute top-8 right-8 p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"><X size={24} /></button>
        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl flex items-center justify-center mx-auto mb-4"><Palette size={32} class="text-[#10b981]" /></div>
          <h2 class="text-2xl font-serif font-black text-white mb-2">Refine Style</h2>
          <p class="text-gray-500 text-xs uppercase tracking-widest font-black">Choose an AI-Powered Aesthetic Preset</p>
        </div>
        <div class="grid grid-cols-2 gap-4">
          {#each STYLE_PRESETS as preset}
            <button onclick={() => handleApplyStyle(preset.prompt)}
              class="group relative flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-[#10b981] hover:bg-[#10b981]/5 transition-all active:scale-95 cursor-pointer">
              <span class="text-3xl mb-3 group-hover:scale-125 transition-transform">{preset.icon}</span>
              <span class="text-[10px] font-black uppercase tracking-widest text-white">{preset.name}</span>
              <div class="absolute inset-0 bg-[#10b981]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            </button>
          {/each}
        </div>
        <p class="text-[9px] text-center text-gray-600 mt-10 uppercase tracking-[0.3em] font-black">Powered by Aura Vision Generative Engine</p>
      </div>
    </div>
  </div>
{/if}

<!-- Add to Cart Modal -->
{#if isModalOpen}
  <div class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl" transition:fade={{ duration: 300 }}>
    <div class="relative w-full max-w-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-[3.5rem] p-1 shadow-[0_0_100px_rgba(16,185,129,0.15)] overflow-hidden" transition:scale={{ duration: 300 }}>
      <div class="bg-black/40 backdrop-blur-3xl rounded-[3.4rem] p-10 md:p-12 relative z-10">
        <button onclick={closeModal} class="absolute top-8 right-8 p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all cursor-pointer"><X size={24} /></button>

        {#if isAdded}
          <div class="text-center py-12 space-y-8" transition:scale={{ duration: 300 }}>
            <div class="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 relative">
              <div class="absolute inset-0 bg-green-500/20 blur-2xl animate-pulse" />
              <CheckCircle2 size={48} class="text-green-400 relative z-10" />
            </div>
            <h2 class="text-3xl font-serif font-black text-white">Added to Hub</h2>
            <p class="text-gray-400 text-sm">Aura is synchronizing your selection...</p>
          </div>
        {:else}
          <div class="space-y-10">
            <header class="flex items-center gap-8">
              <div class="w-28 h-28 rounded-3xl overflow-hidden border border-white/10 shrink-0 shadow-2xl">
                <img src={productImg(currentImageUrl)} onerror={imgFallback} class="w-full h-full object-cover" alt={product.name} />
              </div>
              <div>
                <h2 class="text-3xl font-serif font-bold text-white mb-2">{product.name}</h2>
                <div class="text-aura-gold font-black text-2xl tracking-tighter">৳{product.price.toLocaleString()}</div>
              </div>
            </header>

            <div class="space-y-5">
              <label class="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em] px-2">Quantity Allocation</label>
              <div class="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem]">
                <button onclick={() => quantity = Math.max(1, quantity - 1)}
                  class="p-4 bg-white/5 hover:bg-white hover:text-black rounded-2xl transition-all text-white cursor-pointer"><Minus size={22} /></button>
                <span class="text-3xl font-black text-white tabular-nums">{quantity}</span>
                <button onclick={() => quantity += 1}
                  class="p-4 bg-white/5 hover:bg-white hover:text-black rounded-2xl transition-all text-white cursor-pointer"><Plus size={22} /></button>
              </div>
            </div>

            <div class="pt-6 grid grid-cols-2 gap-6">
              <button onclick={closeModal}
                class="py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/10 cursor-pointer">Cancel</button>
              <button onclick={handleModalAdd}
                class="bg-white text-black py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-[#10b981] hover:text-white transition-all shadow-2xl active:scale-95 cursor-pointer">
                <ShoppingBag size={18} /> Confirm Order
              </button>
            </div>

            <p class="text-[10px] text-center text-gray-600 uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3">
              <ShieldCheck size={14} class="text-[#10b981]" /> Secure Neural Transaction
            </p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
