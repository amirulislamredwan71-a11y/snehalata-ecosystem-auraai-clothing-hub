<script lang="ts">
  import { page } from '$app/stores';
  import { fade, scale } from 'svelte/transition';
  import { ArrowLeft, Upload, Sparkles, RefreshCcw, Camera, X, ShoppingBag, CheckCircle2, Trash2 } from '@lucide/svelte';
  import { getProducts } from '$lib/mockData';
  import { generateTryOnTransformation, generateStyleSuggestion } from '$lib/geminiService';
  import { track } from '$lib/analytics';
  import type { Product } from '$lib/types';

  let allProducts = $state<Product[]>([]);
  let product: Product | undefined = $state();
  let userImage: string | null = $state(null);
  let productImage: string | null = $state(null);
  let generatedImage: string | null = $state(null);
  let isProcessing = $state(false);
  let error: string | null = $state(null);
  let suggestion: string | null = $state(null);

  $effect(() => {
    allProducts = getProducts();
    const id = $page.params.id;
    if (id) {
      const found = getProducts().find(p => p.id === Number(id));
      product = found;
      if (found) productImage = found.imageUrl || null;
    }
  });

  $effect(() => {
    if (product) {
      generateStyleSuggestion(product.name, product.category || 'Apparel').then(setSuggestion);
    } else {
      setSuggestion(null);
    }
  });

  async function convertUrlToBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function processFile(file: File, type: 'user' | 'product') {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'user') {
        userImage = reader.result as string;
      } else {
        productImage = reader.result as string;
        product = undefined;
      }
      generatedImage = null;
      error = null;
    };
    reader.readAsDataURL(file);
  }

  function handleImageUpload(e: Event, type: 'user' | 'product') {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) processFile(file, type);
  }

  function handleDrop(e: DragEvent, type: 'user' | 'product') {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file, type);
  }

  function selectCatalogProduct(p: Product) {
    product = p;
    productImage = p.imageUrl || null;
    generatedImage = null;
    error = null;
  }

  async function handleGenerate() {
    if (!userImage || !productImage) return;
    isProcessing = true;
    error = null;

    try {
      let productBase64 = '';

      if (productImage.startsWith('data:')) {
        productBase64 = productImage;
      } else {
        try {
          productBase64 = await convertUrlToBase64(productImage);
        } catch {
          error = 'ইকোসিস্টেমের ছবি অ্যাক্সেস করতে সমস্যা হচ্ছে। দয়া করে আপনার ডিভাইসে ছবিটি ডাউনলোড করে আপলোড করুন।';
          isProcessing = false;
          return;
        }
      }

      const result = await generateTryOnTransformation(userImage, productBase64);

      if (result) {
        generatedImage = result;
        // Neural Grid A1 — try-on is a signature signal.
        track('try_on', { product_id: product ? Number(product.id) : null, vendor_id: product ? Number(product.vendorId) : null });
      } else {
        error = 'AI ট্রান্সফরমেশন ব্যর্থ হয়েছে। দয়া করে আরো পরিষ্কার ছবি ব্যবহার করে পুনরায় চেষ্টা করুন।';
      }
    } catch {
      error = 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। Aura সিস্টেম পুনরায় চেক করা হচ্ছে।';
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class="min-h-screen bg-[#060507] pb-20 selection:bg-aura-purple selection:text-white">
  <div class="max-w-7xl mx-auto px-6 py-10">
    <a href="/" class="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-xs font-bold uppercase tracking-widest">
      <ArrowLeft size={14} /> Back to Hub
    </a>

    <div class="flex flex-col lg:flex-row gap-12">
      <div class="w-full lg:w-1/3 space-y-8">
        <div>
          <h1 class="text-4xl font-serif font-bold text-white mb-3">
            Aura <span class="text-aura-purple">Vision</span> Try-On
          </h1>
          <p class="text-gray-400 text-sm leading-relaxed">
            আপনার নিজের ফটো এবং পোশাকের ছবি আপলোড করুন অথবা আমাদের কালেকশন থেকে বেছে নিন। Aura AI আপনাকে রিয়েল-টাইম প্রিভিউ দেখাবে।
          </p>
        </div>

        <div class="space-y-3">
          <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">1</span>
            আপনার ছবি দিন
          </h3>
          <div ondragover={(e) => e.preventDefault()} ondrop={(e) => handleDrop(e, 'user')}
            class="relative h-48 rounded-2xl border-2 border-dashed transition-all overflow-hidden {userImage ? 'border-aura-purple bg-aura-purple/5' : 'border-white/10 bg-white/5 hover:border-white/20'}">
            {#if userImage}
              <img src={userImage} alt="User" class="w-full h-full object-cover" />
              <button onclick={() => userImage = null} class="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors cursor-pointer"><X size={14} /></button>
            {:else}
              <label class="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                <Camera class="text-gray-500 mb-2" size={24} />
                <span class="text-xs font-bold text-gray-400">আপনার ছবি আপলোড করুন</span>
                <input type="file" accept="image/*" onchange={(e) => handleImageUpload(e, 'user')} class="hidden" />
              </label>
            {/if}
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex justify-between items-end">
            <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
              <span class="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">2</span>
              পোশাক নির্বাচন করুন
            </h3>
            <label class="cursor-pointer text-[9px] font-bold text-aura-purple hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
              <Upload size={10} /> Upload Custom
              <input type="file" accept="image/*" onchange={(e) => handleImageUpload(e, 'product')} class="hidden" />
            </label>
          </div>

          <div ondragover={(e) => e.preventDefault()} ondrop={(e) => handleDrop(e, 'product')}
            class="relative h-48 rounded-2xl border-2 border-dashed transition-all overflow-hidden {productImage ? 'border-aura-purple bg-aura-purple/5' : 'border-white/10 bg-white/5 hover:border-white/20'}">
            {#if productImage}
              <div class="w-full h-full flex p-3 gap-4">
                <div class="w-1/3 h-full rounded-xl overflow-hidden border border-white/10 bg-black/20">
                  <img src={productImage} alt="Item" class="w-full h-full object-contain" />
                </div>
                <div class="flex-1 flex flex-col justify-center py-2">
                  <h4 class="text-white font-bold text-sm truncate">{product ? product.name : 'Custom Upload'}</h4>
                  <p class="text-xs text-gray-500 mb-4">{product ? `৳${product.price.toLocaleString()}` : 'User provided image'}</p>
                  <div class="flex gap-2">
                    <label class="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer" title="Replace Image">
                      <RefreshCcw size={14} />
                      <input type="file" accept="image/*" onchange={(e) => handleImageUpload(e, 'product')} class="hidden" />
                    </label>
                    <button onclick={() => { productImage = null; product = undefined; }} class="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all cursor-pointer" title="Remove">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            {:else}
              <label class="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center group">
                <div class="p-4 bg-white/5 rounded-full mb-3 group-hover:bg-aura-purple/20 transition-colors">
                  <Upload class="text-gray-400 group-hover:text-aura-purple" size={24} />
                </div>
                <span class="text-xs font-bold text-gray-300 group-hover:text-white">Upload Product Image</span>
                <span class="text-[9px] text-gray-600 mt-1 uppercase tracking-widest">or drag & drop here</span>
                <input type="file" accept="image/*" onchange={(e) => handleImageUpload(e, 'product')} class="hidden" />
              </label>
            {/if}
          </div>
        </div>

        {#if suggestion}
          <div class="p-4 bg-gradient-to-r from-aura-purple/10 to-transparent border border-aura-purple/20 rounded-2xl flex gap-3" transition:fade>
            <div class="p-2 bg-aura-purple/20 rounded-lg h-fit">
              <Sparkles size={14} class="text-aura-purple shrink-0" />
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest text-aura-purple mb-1">Aura Suggestion</p>
              <p class="text-xs text-gray-300 italic leading-relaxed">"{suggestion}"</p>
            </div>
          </div>
        {/if}

        <button onclick={handleGenerate} disabled={!userImage || !productImage || isProcessing}
          class="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all cursor-pointer {!userImage || !productImage || isProcessing ? 'bg-white/10 text-gray-500 cursor-not-allowed opacity-50' : 'bg-white text-black hover:bg-aura-purple hover:text-white shadow-[0_0_30px_rgba(124,58,237,0.3)]'}">
          {#if isProcessing}
            <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Aura AI জেনারেট করছে...
          {:else}
            <Sparkles size={16} /> জেনারেট প্রিভিউ
          {/if}
        </button>

        {#if error}
          <div class="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 leading-relaxed" transition:fade>{error}</div>
        {/if}

        <div class="pt-6 border-t border-white/5">
          <h3 class="text-[10px] uppercase tracking-widest font-bold text-gray-600 mb-4 flex items-center gap-2">
            <ShoppingBag size={12} /> কালেকশন থেকে বেছে নিন
          </h3>
          <div class="grid grid-cols-4 gap-2">
            {#each allProducts.slice(0, 4) as p}
              <button onclick={() => selectCatalogProduct(p)}
                class="aspect-square rounded-lg overflow-hidden border transition-all cursor-pointer {product?.id === p.id ? 'border-aura-purple scale-95 ring-2 ring-aura-purple/20' : 'border-white/5 hover:border-white/20'}">
                <img src={p.imageUrl} alt={p.name} class="w-full h-full object-cover" />
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="flex-1 h-[700px] bg-white/5 border border-white/10 rounded-[32px] overflow-hidden relative flex items-center justify-center shadow-2xl">
        <div class="absolute top-0 right-0 w-96 h-96 bg-aura-purple/10 blur-[100px] rounded-full" />

        {#if generatedImage}
          <div class="w-full h-full p-2 relative" transition:scale={{ duration: 700 }}>
            <img src={generatedImage} alt="AI Result" class="w-full h-full object-contain rounded-2xl" />
            <div class="absolute bottom-6 right-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
              <CheckCircle2 size={12} class="text-green-400" /> Aura AI Verified Result
            </div>
          </div>
        {:else}
          <div class="text-center space-y-6 max-w-sm px-6">
            <div class="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 animate-pulse">
              <Sparkles size={32} class="text-aura-purple" />
            </div>
            <h2 class="text-2xl font-serif font-bold text-white opacity-40">Aura Vision Preview</h2>
            <p class="text-sm text-gray-600 leading-relaxed italic">
              "আপনার স্টাইল, আপনার নিয়ম। Aura AI আপনার কল্পনাকে বাস্তব রূপ দেবে।"
            </p>
          </div>
        {/if}

        {#if isProcessing}
          <div class="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4" transition:fade>
            <div class="relative">
              <div class="w-16 h-16 border-4 border-aura-purple/20 border-t-aura-purple rounded-full animate-spin"></div>
              <Sparkles size={24} class="absolute inset-0 m-auto text-aura-purple animate-pulse" />
            </div>
            <p class="text-xs font-bold uppercase tracking-[0.3em] text-white animate-pulse">Aura is thinking...</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
