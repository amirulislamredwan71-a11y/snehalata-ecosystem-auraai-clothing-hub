<script lang="ts">
  import { browser } from '$app/environment';
  import { fade, fly, scale, slide } from 'svelte/transition';
  import {
    Sparkles, Video, Image as ImageIcon, Brain, Search, MapPin,
    Volume2, Loader2, Download, Maximize2, Layers, Zap, X, ShieldAlert,
    Camera, RefreshCw, CheckCircle2, User,
    Upload, Palette, Sliders, Info, Ruler, ArrowRight, Scan
  } from '@lucide/svelte';
  import {
    generateAuraVideo, generateAuraProImage, generateAuraSpeech,
    searchGroundedAura, mapsGroundedAura, complexThinkingAura,
    generateTryOnTransformation, generateStyleTransfer
  } from '$lib/geminiService';
  import { getProducts, getVendors } from '$lib/mockData';
  import { BD_LOCATIONS } from '$lib/locationData';
  import type { Product } from '$lib/types';

  let activeTool = $state<'VIDEO' | 'IMAGE' | 'THINK' | 'SEARCH' | 'MAPS' | 'TRYON' | 'STYLE'>('IMAGE');
  let prompt = $state('');
  let stylePrompt = $state('Cyberpunk / Neon / Futuristic');
  let result = $state<any>(null);
  let isProcessing = $state(false);
  let imageSize = $state<'1K' | '2K' | '4K'>('1K');
  let videoRatio = $state<'16:9' | '9:16'>('16:9');
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
  let isKeySelected = $state<boolean | null>(null);

  let filteredProducts = $derived(products.filter(p => {
    const vendor = vendors.find(v => v.id === p.vendorId);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesDistrict = districtFilter === 'All' || vendor?.district === districtFilter;
    return matchesCategory && matchesDistrict;
  }));

  $effect(() => {
    if (browser) {
      products = getProducts();
      vendors = getVendors();
      const checkKey = async () => {
        if ((window as any).aistudio?.hasSelectedApiKey) {
          isKeySelected = await (window as any).aistudio.hasSelectedApiKey();
        }
      };
      checkKey();
    }
  });

  $effect(() => {
    const currentStream = stream;
    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  });

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      stream = newStream;
      if (videoRef) {
        videoRef.srcObject = newStream;
      }
      isCameraActive = true;
      capturedImage = null;
    } catch (err) {
      console.error("Camera access denied", err);
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
        const dataUrl = canvas.toDataURL('image/png');
        capturedImage = dataUrl;
        isCameraActive = false;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
      }
    }
  };

  const handleOpenKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      isKeySelected = true;
    }
  };

  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        capturedImage = (event.target?.result as string);
        isCameraActive = false;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          stream = null;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRun = async () => {
    if (activeTool !== 'TRYON' && activeTool !== 'STYLE' && (!prompt.trim() || isProcessing)) return;
    if (activeTool === 'TRYON' && (!selectedProduct || (!capturedImage && !isCameraActive))) return;
    if (activeTool === 'STYLE' && (!capturedImage && !isCameraActive)) return;

    if (activeTool === 'VIDEO' || activeTool === 'IMAGE') {
      if (isKeySelected === false) {
        await handleOpenKeySelection();
        return;
      }
    }

    isProcessing = true;
    result = null;

    try {
      switch (activeTool) {
        case 'IMAGE': {
          const img = await generateAuraProImage(prompt, imageSize);
          result = { type: 'IMAGE', url: img };
          break;
        }
        case 'VIDEO': {
          const vidUrl = await generateAuraVideo(prompt, videoRatio);
          result = { type: 'VIDEO', url: vidUrl };
          break;
        }
        case 'THINK': {
          const thought = await complexThinkingAura(prompt);
          result = { type: 'TEXT', content: thought };
          break;
        }
        case 'SEARCH': {
          const searchData = await searchGroundedAura(prompt);
          result = { type: 'GROUNDED', ...searchData };
          break;
        }
        case 'MAPS': {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const mapsData = await mapsGroundedAura(prompt, pos.coords.latitude, pos.coords.longitude);
            result = { type: 'GROUNDED', ...mapsData };
          }, async () => {
            const mapsData = await mapsGroundedAura(prompt);
            result = { type: 'GROUNDED', ...mapsData };
          });
          break;
        }
        case 'TRYON': {
          const finalUserImg = capturedImage;
          if (isCameraActive && !capturedImage) {
            captureFrame();
            await new Promise(r => setTimeout(r, 100));
          }
          if (selectedProduct && (finalUserImg || capturedImage)) {
            const transformed = await generateTryOnTransformation(finalUserImg || (capturedImage as string), selectedProduct.imageUrl!);
            result = { type: 'TRYON', url: transformed, product: selectedProduct };
          }
          break;
        }
        case 'STYLE': {
          const baseImg = capturedImage;
          if (isCameraActive && !capturedImage) {
            captureFrame();
            await new Promise(r => setTimeout(r, 100));
          }
          if (baseImg || capturedImage) {
            const transformed = await generateStyleTransfer(baseImg || (capturedImage as string), stylePrompt);
            result = { type: 'STYLE', url: transformed };
          }
          break;
        }
      }
    } catch (error: any) {
      console.error(error);
      if (error?.message?.includes('Requested entity was not found.')) {
        isKeySelected = false;
      }
    } finally {
      isProcessing = false;
    }
  };

  const playTTS = async (text: string) => {
    const base64 = await generateAuraSpeech(text);
    if (base64) {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  };

  const STYLE_VIBES = ['Cyberpunk', 'Classic Oil', 'Sketch', 'Pop Art', 'Surrealism', 'Vaporwave'];
  const PRODUCT_CATEGORIES = ['All', 'Kamiz', 'Saree', 'Panjabi', 'Jewelry'];
</script>

{#snippet toolTab(active, IconComponent, label, sub, onClick)}
  <button
    onclick={onClick}
    class="w-full text-left p-6 rounded-3xl border transition-all flex items-center gap-4 {active ? 'bg-aura-purple border-aura-purple shadow-[0_10px_30px_rgba(124,58,237,0.3)]' : 'bg-aura-glass border-aura-glassBorder hover:border-aura-purple/50'}"
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
      <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aura-purple/10 border border-aura-purple/20 mb-6">
        <Sparkles size={14} class="text-aura-purple" />
        <span class="text-[10px] font-black uppercase tracking-widest text-aura-purple">Neural Creative Hub</span>
      </div>
      <h1 class="text-5xl font-serif font-black text-white mb-4">Aura Studio</h1>
      <p class="text-gray-500 max-w-xl mx-auto">Access the world's most advanced AI models for ecosystem growth. AR Try-On, Veo videos, and Grounded Intelligence.</p>
    </header>

    {#if isKeySelected === false && (activeTool === 'VIDEO' || activeTool === 'IMAGE')}
      <div transition:fly={{ y: -20, duration: 300 }} class="mb-12 p-8 bg-aura-purple/5 border border-aura-purple/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex items-center gap-5">
          <div class="p-4 bg-aura-purple/10 rounded-2xl shadow-inner"><ShieldAlert class="text-aura-purple" size={32} /></div>
          <div>
            <h3 class="text-xl font-bold text-white mb-1">Select a Paid API Key</h3>
            <p class="text-xs text-gray-500 max-w-sm">Generating video with Veo or high-res images with Pro 3.0 requires a billing-enabled project key.</p>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" class="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Billing info</a>
          <button onclick={handleOpenKeySelection} class="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-aura-purple hover:text-white transition-all shadow-xl shadow-aura-purple/20">Select Key</button>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-10">
      <aside class="space-y-3">
        {@render toolTab(activeTool === 'TRYON', Camera, 'Neural AR Try-On', 'Flash 2.5 \u2022 Live Vision', () => activeTool = 'TRYON')}
        {@render toolTab(activeTool === 'STYLE', Palette, 'Style Transfer', 'Flash 2.5 \u2022 Creative', () => activeTool = 'STYLE')}
        {@render toolTab(activeTool === 'IMAGE', ImageIcon, 'Neural Image Pro', 'Pro 3.0 \u2022 Up to 4K', () => activeTool = 'IMAGE')}
        {@render toolTab(activeTool === 'VIDEO', Video, 'Cinematic Video', 'Veo 3.1 \u2022 HD Motion', () => activeTool = 'VIDEO')}
        {@render toolTab(activeTool === 'THINK', Brain, 'Thinking Mode', 'Pro 3.0 \u2022 Logic Max', () => activeTool = 'THINK')}
        {@render toolTab(activeTool === 'SEARCH', Search, 'Search Grounding', 'Flash 3.0 \u2022 Live Web', () => activeTool = 'SEARCH')}
        {@render toolTab(activeTool === 'MAPS', MapPin, 'Maps Grounding', 'Flash 2.5 \u2022 Geodata', () => activeTool = 'MAPS')}
      </aside>

      <main class="lg:col-span-3 space-y-8">
        <div class="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
          <div class="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] pointer-events-none" />

          <div class="relative z-10 space-y-6">
            {#if activeTool === 'TRYON' || activeTool === 'STYLE'}
              <div class="space-y-6">
                {#if activeTool === 'TRYON'}
                  <div class="flex flex-wrap justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 gap-4">
                    <div class="flex gap-4 items-center overflow-x-auto no-scrollbar">
                      <div class="flex gap-2">
                        {#each PRODUCT_CATEGORIES as cat}
                          <button
                            onclick={() => categoryFilter = cat}
                            class="px-4 py-2 rounded-xl text-[10px] font-bold border transition-all flex-shrink-0 {categoryFilter === cat ? 'bg-aura-purple border-aura-purple text-white' : 'bg-white/5 border-white/10 text-gray-400'}"
                          >
                            {cat}
                          </button>
                        {/each}
                      </div>
                      <div class="h-4 w-px bg-white/10" />
                      <select bind:value={districtFilter} class="bg-transparent text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-aura-purple transition-colors border-none">
                        <option value="All" class="bg-aura-black">All Districts</option>
                        {#each Object.keys(BD_LOCATIONS).sort() as d}
                          <option value={d} class="bg-aura-black">{d}</option>
                        {/each}
                      </select>
                    </div>
                    <div class="flex items-center gap-4">
                      <button onclick={() => showSizeGuide = !showSizeGuide} class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-black hover:text-aura-purple transition-colors">
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
                    <label class="text-[10px] font-black uppercase tracking-widest text-aura-purple px-2">Neural Artistic Vibe</label>
                    <div class="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      {#each STYLE_VIBES as v}
                        <button
                          onclick={() => stylePrompt = v}
                          class="px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 {stylePrompt === v ? 'bg-aura-purple border-aura-purple text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-600 hover:text-white'}"
                        >
                          {v}
                        </button>
                      {/each}
                    </div>
                    <input type="text" bind:value={stylePrompt} placeholder="Or specify a custom artistic medium..." class="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-aura-purple transition-all" />
                  </div>
                {/if}

                {#if activeTool === 'TRYON' && showSizeGuide}
                  <div transition:slide class="bg-aura-purple/5 border border-aura-purple/20 rounded-3xl p-6">
                    <div class="flex justify-between items-start mb-6">
                      <h4 class="text-[10px] font-black uppercase tracking-widest text-aura-purple flex items-center gap-2">
                        <Info size={14} /> Neural Fitting Guidelines & Measurements
                      </h4>
                      <button onclick={() => showSizeGuide = false} class="text-gray-600 hover:text-white"><X size={14} /></button>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div class="space-y-4">
                        <div class="text-[10px] font-bold text-white uppercase tracking-widest pb-2 border-b border-white/5">Standard Fit Node Matrix (inches)</div>
                        <div class="space-y-2">
                          <div class="flex justify-between text-[10px]">
                            <span class="text-gray-500 uppercase tracking-widest">Small</span>
                            <span class="text-white font-mono">Chest 36 \u2022 Length 40</span>
                          </div>
                          <div class="flex justify-between text-[10px]">
                            <span class="text-gray-500 uppercase tracking-widest">Medium</span>
                            <span class="text-white font-mono">Chest 38 \u2022 Length 42</span>
                          </div>
                          <div class="flex justify-between text-[10px]">
                            <span class="text-gray-500 uppercase tracking-widest">Large</span>
                            <span class="text-white font-mono">Chest 40 \u2022 Length 44</span>
                          </div>
                        </div>
                      </div>
                      <div class="space-y-4">
                        <div class="text-[10px] font-bold text-white uppercase tracking-widest pb-2 border-b border-white/5">Neural Quality Assurance</div>
                        <p class="text-[10px] text-gray-500 leading-relaxed italic">"The engine automatically adjusts fabric drape based on identified shoulder-to-waist ratios. Ensure a clear silhouette for 98.4% fitting accuracy."</p>
                        <div class="flex gap-4">
                          <div class="p-2 bg-aura-purple/10 rounded-lg flex items-center gap-2 border border-aura-purple/20">
                            <CheckCircle2 size={10} class="text-aura-purple" />
                            <span class="text-[8px] font-black uppercase text-aura-purple">HD Mapping OK</span>
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
                        onclick={() => selectedProduct = p}
                        class="flex-shrink-0 w-32 h-40 rounded-2xl overflow-hidden border-2 transition-all group relative {selectedProduct?.id === p.id ? 'border-aura-purple scale-95 ring-4 ring-aura-purple/20' : 'border-white/10 hover:border-white/30'}"
                      >
                        <img src={p.imageUrl} alt={p.name} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent">
                          <div class="text-[8px] font-black uppercase text-white truncate">{p.name}</div>
                          <div class="text-[8px] font-bold text-gray-400">\u09F3{p.price.toLocaleString()}</div>
                        </div>
                      </button>
                    {/each}
                  </div>
                {/if}
              </div>
            {:else}
              <textarea
                bind:value={prompt}
                placeholder={activeTool === 'IMAGE' ? "A hyper-realistic Dhakai Jamdani loom with cinematic lighting..." : activeTool === 'VIDEO' ? "A drone shot over the busy streets of Dhaka at night..." : "Type your complex query or creative prompt here..."}
                class="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-700 resize-none"
              />
            {/if}

            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex gap-4">
                {#if activeTool === 'IMAGE'}
                  <div class="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
                    <label class="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-2">Scale</label>
                    <select bind:value={imageSize} class="bg-transparent text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-aura-purple transition-colors">
                      <option value="1K" class="bg-aura-black">1K Pro</option>
                      <option value="2K" class="bg-aura-black">2K Ultra</option>
                      <option value="4K" class="bg-aura-black">4K Neural</option>
                    </select>
                  </div>
                {/if}
                {#if activeTool === 'VIDEO'}
                  <div class="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
                    <label class="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-2">Aspect</label>
                    <select bind:value={videoRatio} class="bg-transparent text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-aura-purple transition-colors">
                      <option value="16:9" class="bg-aura-black">16:9 Cinematic</option>
                      <option value="9:16" class="bg-aura-black">9:16 Social</option>
                    </select>
                  </div>
                {/if}
                {#if activeTool === 'TRYON' || activeTool === 'STYLE'}
                  <div class="flex gap-3">
                    <input type="file" bind:this={fileInputRef} onchange={handleFileUpload} accept="image/*" class="hidden" />
                    <button
                      onclick={() => fileInputRef?.click()}
                      class="px-6 py-4 bg-white/5 border border-white/10 text-gray-300 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-xl"
                    >
                      <Upload size={14} /> Upload Node Photo
                    </button>
                    <button
                      onclick={startCamera}
                      class="px-6 py-4 bg-aura-purple/10 border border-aura-purple/20 text-aura-purple rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-aura-purple hover:text-white transition-all shadow-xl shadow-aura-purple/5"
                    >
                      <RefreshCw size={14} /> {isCameraActive ? 'Reset Vision' : 'Activate Vision'}
                    </button>
                  </div>
                {/if}
              </div>

              <button
                onclick={handleRun}
                disabled={isProcessing || (activeTool === 'TRYON' && !selectedProduct) || (!capturedImage && !isCameraActive && (activeTool === 'TRYON' || activeTool === 'STYLE'))}
                class="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 hover:bg-aura-purple hover:text-white transition-all shadow-xl disabled:opacity-50"
              >
                {#if isProcessing}
                  <Loader2 size={16} class="animate-spin" />
                {:else}
                  <Zap size={16} />
                {/if}
                {isProcessing ? 'Synthesizing...' : activeTool === 'TRYON' ? 'Synthesize AR Look' : activeTool === 'STYLE' ? 'Synthesize Style' : 'Generate with Aura'}
              </button>
            </div>
          </div>
        </div>

        <div class="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] min-h-[500px] flex items-center justify-center relative overflow-hidden {activeTool === 'TRYON' ? 'aspect-video' : ''}">
          {#if isProcessing}
            <div class="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-aura-purple to-transparent z-20 shadow-[0_0_20px_rgba(124,58,237,1)] scan-line" />
            <div class="flex flex-col items-center gap-6 relative z-10">
              <div class="relative">
                <div class="w-16 h-16 border-4 border-aura-purple border-t-transparent rounded-full animate-spin" />
                <div class="absolute inset-0 flex items-center justify-center">
                  <Zap size={14} class="text-aura-purple animate-pulse" />
                </div>
              </div>
              <div class="space-y-2 text-center">
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-aura-purple">Synthesizing Neural Flow</p>
                <p class="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Applying style matrices \u2022 Map reconstruction</p>
              </div>
            </div>
          {:else if result}
            <div class="w-full h-full p-6">
              {#if result.type === 'IMAGE'}
                <div class="group relative rounded-3xl overflow-hidden shadow-2xl">
                  <img src={result.url} class="w-full h-auto object-cover" alt="Generated image" />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button class="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform"><Download size={20} /></button>
                    <button class="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform"><Maximize2 size={20} /></button>
                  </div>
                </div>
              {/if}
              {#if result.type === 'VIDEO'}
                <div class="rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video">
                  <video src={result.url} controls class="w-full h-full" autoplay loop muted />
                </div>
              {/if}
              {#if result.type === 'TEXT'}
                <div transition:fade class="p-10 text-gray-200 leading-relaxed font-light whitespace-pre-wrap text-lg">
                  {result.content}
                  <button onclick={() => playTTS(result.content)} class="mt-8 flex items-center gap-2 px-6 py-3 bg-aura-purple text-white rounded-xl text-xs font-bold uppercase tracking-widest"><Volume2 size={16} /> Listen to Aura</button>
                </div>
              {/if}
              {#if result.type === 'GROUNDED'}
                <div transition:fade class="space-y-8">
                  <div class="p-10 bg-white/[0.02] rounded-[2rem] border border-white/5 text-gray-300 leading-relaxed text-lg">{result.text}</div>
                  <div class="space-y-4">
                    <h4 class="text-[10px] uppercase tracking-widest font-black text-aura-purple px-4">Sources & Verified Grounds</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {#each result.sources as chunk, i}
                        <a href={chunk.web?.uri || chunk.maps?.uri} target="_blank" class="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-aura-purple transition-all flex items-center justify-between group">
                          <span class="text-xs font-bold text-white truncate max-w-[200px]">{chunk.web?.title || chunk.maps?.title || "Verification Link"}</span>
                          <ArrowRight size={14} class="text-gray-600 group-hover:text-aura-purple" />
                        </a>
                      {/each}
                    </div>
                  </div>
                </div>
              {/if}
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
                      <div class="text-[10px] font-black uppercase tracking-widest text-aura-purple mb-1">{result.product.category}</div>
                      <div class="text-white font-bold">{result.product.name}</div>
                      <div class="text-green-400 font-mono text-sm mt-1">\u09F3{result.product.price.toLocaleString()}</div>
                    </div>
                    <button class="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-aura-purple hover:text-white transition-all">Add to Cart</button>
                  </div>
                </div>
              {/if}
              {#if result.type === 'STYLE'}
                <div transition:scale class="relative w-full h-full duration-700">
                  <img src={result.url} class="w-full h-full object-contain rounded-3xl" alt="Style transfer result" />
                  <div class="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                    <Palette size={16} class="text-aura-purple" />
                    <span class="text-[10px] font-black uppercase tracking-widest text-white">Neural Style Transfer Applied</span>
                  </div>
                  <button class="absolute bottom-6 right-6 p-6 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-transform"><Download size={24} /></button>
                </div>
              {/if}
            </div>
          {:else if activeTool === 'TRYON' || activeTool === 'STYLE'}
            <div class="w-full h-full relative group">
              <canvas bind:this={canvasRef} class="hidden" />
              {#if isCameraActive}
                <div class="relative w-full h-full bg-black">
                  <video bind:this={videoRef} autoplay playsinline class="w-full h-full object-cover scale-x-[-1]" />
                  <div class="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-2 border-dashed border-aura-purple/40 rounded-[3rem] pointer-events-none">
                    <div class="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-aura-purple rounded-tl-3xl" />
                    <div class="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-aura-purple rounded-tr-3xl" />
                    <div class="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-aura-purple rounded-bl-3xl" />
                    <div class="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-aura-purple rounded-br-3xl" />
                  </div>

                  {#if activeTool === 'TRYON' && selectedProduct}
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        class="relative w-1/2 h-2/3 shadow-[0_0_100px_rgba(124,58,237,0.2)] animate-pulse"
                        style="opacity: {overlayOpacity}"
                      >
                        <img src={selectedProduct.imageUrl} class="w-full h-full object-contain mix-blend-screen" alt="Overlay preview" />
                        <div class="absolute bottom-[-40px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase tracking-[0.4em] text-aura-purple bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">Live Projection Overlay</div>
                      </div>

                      <div class="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-48 bg-white/5 border border-white/10 rounded-full flex flex-col items-center justify-between py-6 pointer-events-auto">
                        <span class="text-[8px] font-black vertical-text uppercase tracking-widest text-gray-500">Overlay</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          bind:value={overlayOpacity}
                          class="appearance-none w-32 -rotate-90 bg-aura-purple/20 rounded-full h-1 cursor-pointer accent-aura-purple"
                        />
                        <Sliders size={14} class="text-aura-purple" />
                      </div>
                    </div>
                  {/if}

                  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    <button
                      onclick={captureFrame}
                      class="w-20 h-20 bg-white rounded-full border-8 border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
                    >
                      <div class="w-6 h-6 bg-aura-purple rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <p class="text-[10px] font-black uppercase tracking-[0.3em] text-white bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">Capture Neural Silhouette</p>
                  </div>
                </div>
              {:else if capturedImage}
                <div class="relative w-full h-full p-4">
                  <img src={capturedImage} class="w-full h-full object-contain rounded-3xl" alt="Captured" />
                  <div class="absolute top-6 right-6 flex gap-4">
                    <button onclick={() => capturedImage = null} class="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl"><X size={20} /></button>
                  </div>
                  <div class="absolute bottom-10 left-1/2 -translate-x-1/2 text-center bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                    <p class="text-[10px] font-black uppercase tracking-widest text-white mb-4">Node Profile Captured. Ready for Neural Processing.</p>
                    <div class="flex gap-4 justify-center">
                      <button onclick={() => fileInputRef?.click()} class="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Re-upload</button>
                      <div class="w-px h-3 bg-white/10" />
                      <button onclick={startCamera} class="text-[10px] font-black uppercase tracking-widest text-aura-purple hover:text-white transition-colors">Re-take Photo</button>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="flex flex-col items-center justify-center gap-8 text-center p-10">
                  <div class="flex gap-6">
                    <div class="p-10 bg-white/5 rounded-[3rem] border border-white/10 group-hover:border-aura-purple/30 transition-all duration-700 shadow-inner">
                      <User size={64} class="text-gray-500 group-hover:text-aura-purple transition-colors" />
                    </div>
                    <div class="p-10 bg-aura-purple/5 rounded-[3rem] border border-aura-purple/10 border-dashed animate-pulse flex items-center justify-center">
                      <Scan size={64} class="text-aura-purple/40" />
                    </div>
                  </div>
                  <div>
                    <h3 class="text-3xl font-serif font-black text-white mb-3 uppercase tracking-tighter">Neural Grid Vision</h3>
                    <p class="text-gray-500 text-sm max-w-sm">Capture or upload your silhouette to start the <span class="text-aura-purple font-black">Neural AR</span> transformation.</p>
                  </div>
                  <div class="flex gap-4">
                    <button
                      onclick={() => fileInputRef?.click()}
                      class="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all shadow-xl"
                    >
                      Upload Silhouette
                    </button>
                    <button
                      onclick={startCamera}
                      class="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-aura-purple hover:text-white transition-all shadow-2xl"
                    >
                      Activate Live Vision
                    </button>
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <div class="text-center space-y-4 opacity-20">
              <Layers size={64} class="mx-auto" />
              <p class="text-[10px] font-black uppercase tracking-[0.3em]">Canvas Ready for Generation</p>
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
