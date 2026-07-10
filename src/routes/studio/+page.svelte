<script lang="ts">
  import { browser } from '$app/environment';
  import { tick } from 'svelte';
  import { fade, scale, slide } from 'svelte/transition';
  import {
    Sparkles, Loader2, Download, Layers, Zap, X,
    Camera, RefreshCw, CheckCircle2, User,
    Upload, Palette, Sliders, Info, Ruler, Scan
  } from '@lucide/svelte';
  import { generateTryOnTransformation, generateStyleTransfer, generateMakeupTryOn } from '$lib/geminiService';
  import { getProducts, getVendors } from '$lib/mockData';
  import { fileToCompressedDataURL, productImg, imgFallback } from '$lib/imageUpload';
  import { BD_LOCATIONS } from '$lib/locationData';
  import type { Product } from '$lib/types';

  let activeTool = $state<'TRYON' | 'MAKEUP' | 'STYLE'>('TRYON');
  let stylePrompt = $state('Vintage Heritage / Warm Film');
  // Cosmetics try-on — selfie + a shade → recoloured lips/cheeks/eyes (single-image, reliable).
  const MAKEUP_KINDS = [
    { id: 'lipstick', label: 'লিপস্টিক' },
    { id: 'blush', label: 'ব্লাশ' },
    { id: 'eyeshadow', label: 'আইশ্যাডো' }
  ];
  const SHADES = [
    { name: 'Classic Red', hex: '#c8102e' },
    { name: 'Maroon', hex: '#7b1e3a' },
    { name: 'Coral', hex: '#ff6f61' },
    { name: 'Nude Pink', hex: '#c98a7a' },
    { name: 'Berry', hex: '#8e2e5d' },
    { name: 'Plum', hex: '#5e2750' },
    { name: 'Rose', hex: '#d6688a' },
    { name: 'Brick', hex: '#a63a2a' }
  ];
  let makeupKind = $state('lipstick');
  let selectedShade = $state<{ name: string; hex: string } | null>(null);
  let result = $state<any>(null);
  let studioError = $state<string | null>(null);
  let isProcessing = $state(false);
  let isCameraActive = $state(false);
  let selectedProduct = $state<Product | null>(null);
  let capturedImage = $state<string | null>(null);
  let showSizeGuide = $state(false);
  let overlayOpacity = $state(0.4);
  let videoRef: HTMLVideoElement | undefined = $state(undefined);
  let canvasRef: HTMLCanvasElement | undefined = $state(undefined);
  let fileInputRef: HTMLInputElement | undefined = $state(undefined);
  let stream = $state<MediaStream | null>(null);
  let products = $state<any[]>([]);
  let vendors = $state<any[]>([]);
  let categoryFilter = $state('All');
  let districtFilter = $state('All');

  let filteredProducts = $derived(products.filter(p => {
    const vendor = vendors.find(v => v.id === p.vendorId);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesDistrict = districtFilter === 'All' || vendor?.district === districtFilter;
    return matchesCategory && matchesDistrict;
  }));

  $effect(() => {
    if (!browser) return;
    // Deep-link: a Cosmetics product's "Try-on" opens the Makeup tab (/studio?tool=makeup).
    const t = new URLSearchParams(window.location.search).get('tool');
    if (t === 'makeup') activeTool = 'MAKEUP';
    // Refresh garments from the LIVE catalog (not just the seed) — the layout's
    // syncWithNeuralGrid fills it after mount + fires productUpdated. Without this the
    // picker showed only the handful of seed sarees.
    const refresh = () => {
      products = getProducts();
      vendors = getVendors();
    };
    refresh();
    window.addEventListener('productUpdated', refresh);
    window.addEventListener('vendorUpdated', refresh);
    return () => {
      window.removeEventListener('productUpdated', refresh);
      window.removeEventListener('vendorUpdated', refresh);
    };
  });

  $effect(() => {
    const currentStream = stream;
    return () => {
      if (currentStream) currentStream.getTracks().forEach(track => track.stop());
    };
  });

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      studioError = 'এই ব্রাউজারে ক্যামেরা সমর্থন করে না — ছবি আপলোড করুন।';
      return;
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      stream = newStream;
      capturedImage = null;
      studioError = null;
      // Render the <video> FIRST (it lives inside {#if isCameraActive}), THEN attach the
      // stream + play() — otherwise videoRef is null and the feed never shows (blank on mobile).
      isCameraActive = true;
      await tick();
      if (videoRef) {
        videoRef.srcObject = newStream;
        try { await videoRef.play(); } catch { /* iOS may need the muted attr; it's set on the element */ }
      }
    } catch (err) {
      console.error('Camera access denied', err);
      isCameraActive = false;
      studioError = 'ক্যামেরা চালু করা যায়নি — অনুমতি দিন, নাহলে ছবি আপলোড করুন।';
    }
  };

  const captureFrame = () => {
    if (videoRef && canvasRef) {
      const canvas = canvasRef;
      const video = videoRef;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // JPEG keeps the captured frame small enough for the serverless upload.
        capturedImage = canvas.toDataURL('image/jpeg', 0.85);
        isCameraActive = false;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
      }
    }
  };

  const handleFileUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      // Downscale so phone-camera photos stay under the serverless body limit.
      capturedImage = await fileToCompressedDataURL(file);
      isCameraActive = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
      }
    }
  };

  const handleRun = async () => {
    if (activeTool === 'TRYON' && (!selectedProduct || (!capturedImage && !isCameraActive))) return;
    if (activeTool === 'MAKEUP' && (!selectedShade || (!capturedImage && !isCameraActive))) return;
    if (activeTool === 'STYLE' && (!capturedImage && !isCameraActive)) return;

    isProcessing = true;
    result = null;
    studioError = null;
    const busyMsg = 'Aura is very busy right now — please try again in a few seconds.';

    try {
      if (isCameraActive && !capturedImage) {
        captureFrame();
        await new Promise((r) => setTimeout(r, 100));
      }
      if (activeTool === 'TRYON') {
        if (selectedProduct && capturedImage) {
          const transformed = await generateTryOnTransformation(capturedImage, selectedProduct.imageUrl!, selectedProduct.category);
          if (transformed.image) result = { type: 'TRYON', url: transformed.image, product: selectedProduct };
          else studioError = transformed.error || busyMsg;
        }
      } else if (activeTool === 'MAKEUP') {
        if (capturedImage && selectedShade) {
          const transformed = await generateMakeupTryOn(capturedImage, `${selectedShade.name} (${selectedShade.hex})`, makeupKind);
          if (transformed.image) result = { type: 'MAKEUP', url: transformed.image, shade: selectedShade };
          else studioError = transformed.error || busyMsg;
        }
      } else if (capturedImage) {
        const transformed = await generateStyleTransfer(capturedImage, stylePrompt);
        if (transformed.image) result = { type: 'STYLE', url: transformed.image };
        else studioError = transformed.error || busyMsg;
      }
    } catch (error: any) {
      console.error(error);
      studioError = busyMsg;
    } finally {
      isProcessing = false;
    }
  };

  const STYLE_VIBES = ['Vintage Heritage', 'Classic Oil', 'Sketch', 'Studio Portrait', 'Golden Hour', 'Editorial'];
  const PRODUCT_CATEGORIES = ['All', 'Saree', 'Panjabi', 'Three-Piece', 'Borka', 'Shirt', 'T-Shirt', 'Pant', 'Baby'];
</script>

{#snippet toolTab(active, IconComponent, label, sub, onClick)}
  <button
    type="button"
    onclick={onClick}
    class="w-full text-left p-6 rounded-3xl border transition-all flex items-center gap-4 {active ? 'bg-aura-green border-aura-green shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-aura-glass border-aura-glassBorder hover:border-aura-green/50'}"
  >
    <div class="p-3 rounded-2xl {active ? 'bg-white/20' : 'bg-white/5'}">
      <svelte:component this={IconComponent} size={16} />
    </div>
    <div>
      <div class="text-xs font-black uppercase tracking-widest {active ? 'text-white' : 'text-gray-300'}">{label}</div>
      <div class="text-[8px] uppercase tracking-widest mt-1 {active ? 'text-white/60' : 'text-gray-600'}">{sub}</div>
    </div>
  </button>
{/snippet}

<div class="min-h-screen bg-aura-black pb-20 pt-10 px-6">
  <div class="max-w-6xl mx-auto">
    <header class="mb-12 text-center">
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aura-gold/10 border border-aura-gold/20 mb-6">
        <Sparkles size={14} class="text-aura-gold" />
        <span class="text-[10px] font-black uppercase tracking-widest text-aura-gold">Neural Creative Hub</span>
      </div>
      <h1 class="text-5xl font-serif font-black text-white mb-4">Aura Studio</h1>
      <p class="text-gray-500 max-w-xl mx-auto">Try heritage looks on yourself with live AR, or restyle your photo — all powered by the Aura Neural Engine.</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-10">
      <aside class="flex lg:flex-col gap-3 overflow-x-auto no-scrollbar min-w-0">
        <div class="min-w-[220px] lg:min-w-0">
          {@render toolTab(activeTool === 'TRYON', Camera, 'Neural AR Try-On', 'Live Vision • Virtual Fit', () => activeTool = 'TRYON')}
        </div>
        <div class="min-w-[220px] lg:min-w-0">
          {@render toolTab(activeTool === 'MAKEUP', Sparkles, 'Makeup Try-On', 'Selfie • Lip & Shade', () => activeTool = 'MAKEUP')}
        </div>
        <div class="min-w-[220px] lg:min-w-0">
          {@render toolTab(activeTool === 'STYLE', Palette, 'Style Transfer', 'Creative • Photo Restyle', () => activeTool = 'STYLE')}
        </div>
      </aside>

      <main class="lg:col-span-3 space-y-8 min-w-0">
        <div class="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-aura-green/5 blur-[100px] pointer-events-none" />

          <div class="relative z-10 space-y-6">
            {#if activeTool === 'TRYON'}
              <div class="flex flex-wrap justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 gap-4">
                <div class="flex gap-4 items-center overflow-x-auto no-scrollbar">
                  <div class="flex gap-2">
                    {#each PRODUCT_CATEGORIES as cat}
                      <button
                        type="button"
                        onclick={() => categoryFilter = cat}
                        class="px-4 py-2 rounded-xl text-[10px] font-bold border transition-all flex-shrink-0 {categoryFilter === cat ? 'bg-aura-green border-aura-green text-white' : 'bg-white/5 border-white/10 text-gray-400'}"
                      >
                        {cat}
                      </button>
                    {/each}
                  </div>
                  <div class="h-4 w-px bg-white/10" />
                  <select bind:value={districtFilter} class="bg-transparent text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-aura-green transition-colors border-none">
                    <option value="All" class="bg-aura-black">All Districts</option>
                    {#each Object.keys(BD_LOCATIONS).sort() as d}
                      <option value={d} class="bg-aura-black">{d}</option>
                    {/each}
                  </select>
                </div>
                <div class="flex items-center gap-4">
                  <button type="button" onclick={() => showSizeGuide = !showSizeGuide} class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-black hover:text-aura-green transition-colors">
                    <Ruler size={14} /> Size Guide
                  </button>
                  <div class="text-[10px] uppercase tracking-widest text-gray-500 font-black">
                    {selectedProduct ? `Selected: ${selectedProduct.name}` : 'Select an item to try on'}
                  </div>
                </div>
              </div>
            {/if}

            {#if activeTool === 'STYLE'}
              <div class="space-y-4">
                <label class="text-[10px] font-black uppercase tracking-widest text-aura-green px-2">Neural Artistic Vibe</label>
                <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {#each STYLE_VIBES as v}
                    <button
                      type="button"
                      onclick={() => stylePrompt = v}
                      class="px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 {stylePrompt === v ? 'bg-aura-green border-aura-green text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-600 hover:text-white'}"
                    >
                      {v}
                    </button>
                  {/each}
                </div>
                <input type="text" bind:value={stylePrompt} placeholder="Or specify a custom artistic medium..." class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-aura-green transition-all" />
              </div>
            {/if}

            {#if activeTool === 'MAKEUP'}
              <div class="space-y-4">
                <div class="flex gap-2">
                  {#each MAKEUP_KINDS as k}
                    <button type="button" onclick={() => makeupKind = k.id}
                      class="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all {makeupKind === k.id ? 'bg-aura-green border-aura-green text-white' : 'bg-white/5 border-white/10 text-gray-400'}">{k.label}</button>
                  {/each}
                </div>
                <label class="text-[10px] font-black uppercase tracking-widest text-aura-green px-1 block">শেড বেছে নিন · Pick a shade</label>
                <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                  {#each SHADES as s}
                    <button type="button" onclick={() => selectedShade = s} title={s.name}
                      class="flex-shrink-0 flex flex-col items-center gap-1.5 group">
                      <span class="w-11 h-11 rounded-full border-2 transition-all {selectedShade?.name === s.name ? 'border-white scale-110 ring-2 ring-aura-green' : 'border-white/20 group-hover:border-white/50'}" style="background:{s.hex}"></span>
                      <span class="text-[8px] font-bold uppercase tracking-wide {selectedShade?.name === s.name ? 'text-white' : 'text-gray-500'}">{s.name}</span>
                    </button>
                  {/each}
                </div>
                <p class="text-[10px] text-gray-500 italic px-1">সেলফি তুলুন বা আপলোড করুন — Aura আপনার {makeupKind === 'blush' ? 'গালে' : makeupKind === 'eyeshadow' ? 'চোখে' : 'ঠোঁটে'} শেডটা বসিয়ে দেখাবে।</p>
              </div>
            {/if}

            {#if activeTool === 'TRYON' && showSizeGuide}
              <div transition:slide class="bg-aura-green/5 border border-aura-green/20 rounded-3xl p-6">
                <div class="flex justify-between items-start mb-6">
                  <h4 class="text-[10px] font-black uppercase tracking-widest text-aura-green flex items-center gap-2">
                    <Info size={14} /> Neural Fitting Guidelines & Measurements
                  </h4>
                  <button type="button" onclick={() => showSizeGuide = false} class="text-gray-600 hover:text-white"><X size={14} /></button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-4">
                    <div class="text-[10px] font-bold text-white uppercase tracking-widest pb-2 border-b border-white/5">Standard Fit Node Matrix (inches)</div>
                    <div class="space-y-2">
                      <div class="flex justify-between text-[10px]">
                        <span class="text-gray-500 uppercase tracking-widest">Small</span>
                        <span class="text-white font-mono">Chest 36 • Length 40</span>
                      </div>
                      <div class="flex justify-between text-[10px]">
                        <span class="text-gray-500 uppercase tracking-widest">Medium</span>
                        <span class="text-white font-mono">Chest 38 • Length 42</span>
                      </div>
                      <div class="flex justify-between text-[10px]">
                        <span class="text-gray-500 uppercase tracking-widest">Large</span>
                        <span class="text-white font-mono">Chest 40 • Length 44</span>
                      </div>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="text-[10px] font-bold text-white uppercase tracking-widest pb-2 border-b border-white/5">Neural Quality Assurance</div>
                    <p class="text-[10px] text-gray-500 leading-relaxed italic">"The engine adjusts fabric drape based on identified shoulder-to-waist ratios. Ensure a clear silhouette for the most accurate fit."</p>
                    <div class="flex gap-4">
                      <div class="p-2 bg-aura-green/10 rounded-lg flex items-center gap-2 border border-aura-green/20">
                        <CheckCircle2 size={10} class="text-aura-green" />
                        <span class="text-[8px] font-black uppercase text-aura-green">HD Mapping OK</span>
                      </div>
                      <div class="p-2 bg-green-500/10 rounded-lg flex items-center gap-2 border border-green-500/20">
                        <Zap size={10} class="text-green-500" />
                        <span class="text-[8px] font-black uppercase text-green-500">Live Calibration Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            {/if}

            {#if activeTool === 'TRYON'}
              <div class="overflow-x-auto no-scrollbar flex gap-4 pb-4">
                {#each filteredProducts as p (p.id)}
                  <button
                    type="button"
                    onclick={() => selectedProduct = p}
                    class="flex-shrink-0 w-32 h-40 rounded-2xl overflow-hidden border-2 transition-all group relative {selectedProduct?.id === p.id ? 'border-aura-green scale-95 ring-4 ring-aura-green/20' : 'border-white/10 hover:border-white/30'}"
                  >
                    <img src={productImg(p.imageUrl, 300)} onerror={imgFallback} loading="lazy" decoding="async" alt={p.name} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent">
                      <div class="text-[8px] font-black uppercase text-white truncate">{p.name}</div>
                      <div class="text-[8px] font-bold text-aura-gold">৳{p.price.toLocaleString()}</div>
                    </div>
                  </button>
                {/each}
              </div>
            {/if}

            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex gap-3">
                <input type="file" bind:this={fileInputRef} onchange={handleFileUpload} accept="image/*" class="hidden" />
                <button
                  type="button"
                  onclick={() => fileInputRef?.click()}
                  class="px-6 py-4 bg-white/5 border border-white/10 text-gray-300 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-xl"
                >
                  <Upload size={14} /> Upload Photo
                </button>
                <button
                  type="button"
                  onclick={startCamera}
                  class="px-6 py-4 bg-aura-green/10 border border-aura-green/20 text-aura-green rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-aura-green hover:text-white transition-all shadow-xl shadow-aura-green/5"
                >
                  <RefreshCw size={14} /> {isCameraActive ? 'Reset Vision' : 'Activate Vision'}
                </button>
              </div>

              <button
                type="button"
                onclick={handleRun}
                disabled={isProcessing || (activeTool === 'TRYON' && !selectedProduct) || (activeTool === 'MAKEUP' && !selectedShade) || (!capturedImage && !isCameraActive)}
                class="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 hover:bg-aura-green hover:text-white transition-all shadow-xl disabled:opacity-50"
              >
                {#if isProcessing}
                  <Loader2 size={16} class="animate-spin" />
                {:else}
                  <Zap size={16} />
                {/if}
                {isProcessing ? 'Synthesizing...' : activeTool === 'TRYON' ? 'Synthesize AR Look' : activeTool === 'MAKEUP' ? 'Apply Makeup' : 'Synthesize Style'}
              </button>
            </div>
          </div>
        </div>

        <div class="w-full bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] min-h-[420px] sm:min-h-[500px] flex items-center justify-center relative overflow-hidden {activeTool === 'TRYON' ? 'lg:aspect-video' : ''}">
          {#if isProcessing}
            <div class="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-aura-green to-transparent z-20 shadow-[0_0_20px_rgba(16,185,129,1)] scan-line" />
            <div class="flex flex-col items-center gap-6 relative z-10">
              <div class="relative">
                <div class="w-16 h-16 border-4 border-aura-green border-t-transparent rounded-full animate-spin" />
                <div class="absolute inset-0 flex items-center justify-center">
                  <Zap size={14} class="text-aura-green animate-pulse" />
                </div>
              </div>
              <div class="space-y-2 text-center">
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-aura-green">Synthesizing Neural Flow</p>
                <p class="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Applying style matrices • Map reconstruction</p>
              </div>
            </div>
          {:else if result}
            <div class="w-full h-full p-6">
              {#if result.type === 'TRYON'}
                <div transition:scale class="relative w-full h-full duration-700">
                  <img src={result.url} class="w-full h-full object-contain rounded-3xl" alt="Try-on result" />
                  <div class="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                    <CheckCircle2 size={16} class="text-green-400" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-white">Neural Try-On Complete</span>
                  </div>
                  <div class="absolute bottom-6 right-6 p-6 bg-aura-glass backdrop-blur-3xl border border-aura-glassBorder rounded-[2rem] flex items-center gap-6 shadow-2xl">
                    <div class="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                      <img src={result.product.imageUrl} class="w-full h-full object-cover" alt={result.product.name} />
                    </div>
                    <div>
                      <div class="text-[10px] font-black uppercase tracking-widest text-aura-green mb-1">{result.product.category}</div>
                      <div class="text-white font-bold">{result.product.name}</div>
                      <div class="text-aura-gold font-mono text-sm mt-1">৳{result.product.price.toLocaleString()}</div>
                    </div>
                    <a href="/cart" class="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-aura-green hover:text-white transition-all">Add to Cart</a>
                  </div>
                </div>
              {/if}
              {#if result.type === 'STYLE'}
                <div transition:scale class="relative w-full h-full duration-700">
                  <img src={result.url} class="w-full h-full object-contain rounded-3xl" alt="Style transfer result" />
                  <div class="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                    <Palette size={16} class="text-aura-green" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-white">Neural Style Transfer Applied</span>
                  </div>
                  <a href={result.url} download="aura-style.png" class="absolute bottom-6 right-6 p-6 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-transform"><Download size={24} /></a>
                </div>
              {/if}
              {#if result.type === 'MAKEUP'}
                <div transition:scale class="relative w-full h-full duration-700">
                  <img src={result.url} class="w-full h-full object-contain rounded-3xl" alt="Makeup try-on result" />
                  <div class="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                    <CheckCircle2 size={16} class="text-green-400" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-white">Makeup Applied</span>
                  </div>
                  {#if result.shade}
                    <div class="absolute bottom-6 right-6 flex items-center gap-3 bg-aura-glass backdrop-blur-3xl border border-aura-glassBorder rounded-full pl-3 pr-5 py-2 shadow-2xl">
                      <span class="w-7 h-7 rounded-full border border-white/20" style="background:{result.shade.hex}"></span>
                      <span class="text-white font-bold text-xs">{result.shade.name}</span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {:else if studioError}
            <div class="flex flex-col items-center justify-center gap-6 text-center p-10">
              <div class="w-16 h-16 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Zap size={28} class="text-amber-400" />
              </div>
              <p class="text-gray-300 text-sm max-w-xs leading-relaxed">{studioError}</p>
              <button type="button" onclick={handleRun} class="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-aura-green hover:text-white transition-all">Try Again</button>
            </div>
          {:else}
            <div class="w-full h-full relative group">
              <canvas bind:this={canvasRef} class="hidden" />
              {#if isCameraActive}
                <div class="relative w-full h-full bg-black">
                  <video bind:this={videoRef} autoplay playsinline muted class="w-full h-full object-cover scale-x-[-1]" ></video>
                  <div class="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-2 border-dashed border-aura-green/40 rounded-[3rem] pointer-events-none">
                    <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-aura-green rounded-tl-3xl" />
                    <div class="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-aura-green rounded-tr-3xl" />
                    <div class="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-aura-green rounded-bl-3xl" />
                    <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-aura-green rounded-br-3xl" />
                  </div>

                  {#if activeTool === 'TRYON' && selectedProduct}
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        class="relative w-1/2 h-2/3 shadow-[0_0_100px_rgba(16,185,129,0.2)] animate-pulse"
                        style="opacity: {overlayOpacity}"
                      >
                        <img src={selectedProduct.imageUrl} class="w-full h-full object-contain mix-blend-screen" alt="Overlay preview" />
                        <div class="absolute bottom-[-40px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase tracking-[0.4em] text-aura-green bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">Live Projection Overlay</div>
                      </div>

                      <div class="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-48 bg-white/5 border border-white/10 rounded-full flex flex-col items-center justify-between py-6 pointer-events-auto">
                        <span class="text-[8px] font-black vertical-text uppercase tracking-widest text-gray-500">Overlay</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          bind:value={overlayOpacity}
                          class="appearance-none w-32 -rotate-90 bg-aura-green/20 rounded-full h-1 cursor-pointer accent-aura-green"
                        />
                        <Sliders size={14} class="text-aura-green" />
                      </div>
                    </div>
                  {/if}

                  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onclick={captureFrame}
                      class="w-20 h-20 bg-white rounded-full border-8 border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
                    >
                      <div class="w-6 h-6 bg-aura-green rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">Capture Neural Silhouette</p>
                  </div>
                </div>
              {:else if capturedImage}
                <div class="relative w-full h-full p-4">
                  <img src={capturedImage} class="w-full h-full object-contain rounded-3xl" alt="Captured" />
                  <div class="absolute top-6 right-6 flex gap-4">
                    <button type="button" onclick={() => capturedImage = null} class="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl"><X size={20} /></button>
                  </div>
                  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 text-center bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white mb-4">Node Profile Captured. Ready for Neural Processing.</p>
                    <div class="flex gap-4 justify-center">
                      <button type="button" onclick={() => fileInputRef?.click()} class="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Re-upload</button>
                      <div class="w-px h-3 bg-white/10" />
                      <button type="button" onclick={startCamera} class="text-[10px] font-black uppercase tracking-widest text-aura-green hover:text-white transition-colors">Re-take Photo</button>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="flex flex-col items-center justify-center gap-8 text-center p-10">
                  <div class="flex gap-6">
                    <div class="p-10 bg-white/5 rounded-[3rem] border border-white/10 group-hover:border-aura-green/30 transition-all duration-700 shadow-inner">
                      <User size={64} class="text-gray-500 group-hover:text-aura-green transition-colors" />
                    </div>
                    <div class="p-10 bg-aura-green/5 rounded-[3rem] border border-aura-green/10 border-dashed animate-pulse flex items-center justify-center">
                      <Scan size={64} class="text-aura-green/40" />
                    </div>
                  </div>
                  <div>
                    <h3 class="text-3xl font-serif font-black text-white mb-3 uppercase tracking-tighter">Neural Grid Vision</h3>
                    <p class="text-gray-500 text-sm max-w-sm">Capture or upload your silhouette to start the <span class="text-aura-green font-black">Neural AR</span> transformation.</p>
                  </div>
                  <div class="flex flex-wrap gap-4 justify-center">
                    <button
                      type="button"
                      onclick={() => fileInputRef?.click()}
                      class="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all shadow-xl"
                    >
                      Upload Photo
                    </button>
                    <button
                      type="button"
                      onclick={startCamera}
                      class="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-aura-green hover:text-white transition-all shadow-2xl"
                    >
                      Activate Live Vision
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </main>
    </div>
  </div>
</div>

<style>
  .scan-line {
    animation: scan-line 2s linear infinite;
  }
  @keyframes scan-line {
    from { top: -10%; }
    to { top: 110%; }
  }
  .vertical-text {
    writing-mode: vertical-lr;
    text-orientation: mixed;
  }
</style>
