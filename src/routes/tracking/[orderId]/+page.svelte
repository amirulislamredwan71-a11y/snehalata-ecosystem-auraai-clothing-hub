<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fade, scale, fly } from 'svelte/transition';
  import { Search, Truck, MapPin, Loader2, ArrowRight, Navigation2, Zap, Volume2, Clock, ShieldCheck, Box, AlertCircle, Sparkles } from '@lucide/svelte';
  import { generateAuraSpeech } from '$lib/geminiService';

  let searchInput = $state($page.params.orderId || '');
  let order: any = $state(null);
  let loading = $state(false);
  let error = $state('');
  let isSpeaking = $state(false);

  const STATUS_FLOW = ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const STATUS_LABEL: Record<string, string> = {
    PLACED: 'অর্ডার প্লেস হয়েছে',
    CONFIRMED: 'ভেন্ডর কনফার্মড',
    SHIPPED: 'শিপিং চলছে',
    DELIVERED: 'ডেলিভারড'
  };
  const STATUS_DESC: Record<string, string> = {
    PLACED: 'অর্ডার গ্রহণ করা হয়েছে — ভেন্ডর যাচাই করছে',
    CONFIRMED: 'ভেন্ডর কনফার্ম করেছে — প্যাকিং চলছে',
    SHIPPED: 'কুরিয়ারে হ্যান্ডওভার — পথে আছে',
    DELIVERED: 'সফলভাবে আপনার ঠিকানায় পৌঁছে গেছে ✓'
  };

  async function fetchOrder(id: string, silent = false) {
    if (!silent) loading = true;
    error = '';
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Not found');
      const o = data.order;
      const curIdx = STATUS_FLOW.indexOf(o.status);
      const cancelled = o.status === 'CANCELLED';
      order = {
        id: o.tracking || ('ORD-' + o.id),
        currentStatus: o.status,
        totalAmount: Number(o.total),
        estimatedDelivery: o.district === 'Dhaka' ? '১-২ কার্যদিবস' : '২-৩ কার্যদিবস',
        items: (o.items || []).map((it: any) => ({ name: it.name, category: it.item_status || 'ITEM', imageUrl: it.image_url })),
        timeline: STATUS_FLOW.map((s, i) => ({
          status: s,
          label: STATUS_LABEL[s],
          timestamp: !cancelled && i <= curIdx ? '✓' : '—',
          completed: !cancelled && i <= curIdx,
          current: !cancelled && s === o.status,
          description: STATUS_DESC[s]
        }))
      };
    } catch {
      order = null;
      error = 'অর্ডারটি খুঁজে পাওয়া যায়নি। দয়া করে Order ID টি চেক করুন।';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    const orderId = $page.params.orderId;
    if (!orderId) return;
    fetchOrder(orderId);
    // Real-time: silently re-poll status every 25s until delivered/cancelled, so
    // admin status changes appear without the customer refreshing.
    const iv = setInterval(() => {
      if (order && (order.currentStatus === 'DELIVERED' || order.currentStatus === 'CANCELLED')) return;
      fetchOrder(orderId, true);
    }, 25000);
    return () => clearInterval(iv);
  });

  function handleSearch(e: Event) {
    e.preventDefault();
    if (searchInput.trim()) {
      goto(`/tracking/${searchInput}`);
    }
  }

  async function playStatusBriefing() {
    if (!order || isSpeaking) return;
    isSpeaking = true;
    const text = `আসসালামু আলাইকুম। আপনার অর্ডার ${order.id} বর্তমানে ${order.currentStatus} পর্যায়ে আছে। এটি ${order.estimatedDelivery}-এর মধ্যে আপনার ঠিকানায় পৌঁছাবে বলে আশা করা হচ্ছে।`;

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
      source.onended = () => isSpeaking = false;
      source.start();
    } else {
      isSpeaking = false;
    }
  }
</script>

<div class="min-h-screen bg-aura-black pb-32 selection:bg-aura-green selection:text-white">
  <div class="max-w-7xl mx-auto px-6 py-12">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aura-green/10 border border-aura-green/20 mb-4">
          <Navigation2 size={14} class="text-aura-green" />
          <span class="text-[10px] font-black uppercase tracking-widest text-aura-green">Neural Logistics System</span>
        </div>
        <h1 class="text-4xl sm:text-5xl font-serif font-black text-white">Neural Hub <span class="text-aura-green">Tracking</span></h1>
      </div>

      <div class="w-full md:w-96">
        <form onsubmit={handleSearch} class="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-aura-green transition-all p-1">
          <Search class="ml-4 text-gray-600 shrink-0" size={18} />
          <input type="text" bind:value={searchInput} placeholder="TRACK ID: SNH-250707-XXXX" class="flex-1 min-w-0 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-700 font-mono text-sm" />
          <button type="submit" class="bg-white text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-aura-green hover:text-white transition-all shrink-0">Locate</button>
        </form>
      </div>
    </div>

    {#if loading}
      <div class="flex flex-col items-center justify-center py-32 space-y-6">
        <div class="relative">
          <Loader2 size={64} class="animate-spin text-aura-green" />
          <Sparkles size={24} class="absolute inset-0 m-auto text-white animate-pulse" />
        </div>
        <p class="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing with Aura Neural Grid...</p>
      </div>
    {:else if error}
      <div class="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto" transition:fade>
        <AlertCircle class="mx-auto text-red-500 mb-6" size={48} />
        <h2 class="text-2xl font-serif font-bold text-white mb-2">Order Not Synced</h2>
        <p class="text-gray-500 text-sm mb-8">{error}</p>
        <a href="/" class="text-aura-green font-black uppercase tracking-widest text-xs hover:underline">Explore Hub Collections</a>
      </div>
    {:else if order}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10" transition:fade={{ duration: 700 }}>
        <div class="lg:col-span-4 space-y-8">
          <div class="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div class="flex items-center justify-between mb-10">
              <h2 class="text-xl font-serif font-bold text-white">অর্ডার অগ্রগতি <span class="text-aura-green">· Progress</span></h2>
              <button onclick={playStatusBriefing} disabled={isSpeaking}
                class="p-3 rounded-xl transition-all cursor-pointer {isSpeaking ? 'bg-aura-green text-white animate-pulse' : 'bg-white/5 text-aura-green border border-aura-green/20 hover:bg-aura-green hover:text-white'}">
                <Volume2 size={20} />
              </button>
            </div>

            <div class="relative pl-10 space-y-12">
              <div class="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/5"></div>
              {#each order.timeline as step}
                <div class="relative group {step.completed ? 'opacity-100' : 'opacity-20'}">
                  <div class="absolute -left-[10px] top-0 w-5 h-5 rounded-full border-4 border-aura-black z-10 transition-all duration-500 {step.completed ? 'bg-aura-green shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-gray-800'}">
                    {#if step.status === order.currentStatus}
                      <div class="absolute inset-0 bg-aura-green rounded-full animate-ping opacity-50"></div>
                    {/if}
                  </div>
                  <div>
                    <div class="flex justify-between items-start mb-1">
                      <h4 class="text-xs font-black uppercase tracking-widest text-white group-hover:text-aura-green transition-colors">{step.label}</h4>
                      <span class="text-[9px] font-mono text-gray-600">{step.timestamp}</span>
                    </div>
                    <p class="text-[10px] text-gray-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="bg-aura-green/5 border border-aura-green/10 rounded-[2.5rem] p-8">
            <div class="flex items-center gap-3 mb-4">
              <Zap class="text-aura-green" size={20} />
              <h3 class="text-[10px] font-black uppercase tracking-widest text-white">Neural Delivery Insights</h3>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed italic">
              "Aura has analyzed current traffic patterns. Expect arrival {order.currentStatus === 'SHIPPED' ? 'shortly' : 'on schedule'}. Payment: {order.currentStatus}."
            </p>
          </div>
        </div>

        <div class="lg:col-span-8 space-y-8">
          <div class="bg-aura-glass border border-aura-glassBorder rounded-[3rem] overflow-hidden relative group h-[380px] sm:h-[500px] shadow-2xl">
            <div class="absolute inset-0 bg-[#0a0a0a]">
              <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0); background-size: 40px 40px" />
              <svg class="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 500">
                <path d="M100 400 Q 200 100, 400 250 T 700 100" stroke="#10b981" stroke-width="4" fill="none" stroke-dasharray="10,10" />
                <circle cx="100" cy="400" r="8" fill="#10b981" />
                <circle cx="700" cy="100" r="8" fill="#10b981" />
              </svg>
              <div class="absolute" style="top: 25%; left: 45%">
                <div class="relative animate-bounce">
                  <div class="absolute inset-0 bg-aura-green blur-xl rounded-full opacity-40 scale-150"></div>
                  <div class="bg-aura-green p-4 rounded-2xl border border-white/20 shadow-2xl relative z-10">
                    <Truck class="text-white" size={32} />
                  </div>
                  <div class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/50 blur-sm rounded-full"></div>
                </div>
                <div class="mt-6 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full whitespace-nowrap">
                  <span class="text-[10px] font-black uppercase tracking-widest text-white">Courier ID: Aura-Logix-09</span>
                </div>
              </div>
            </div>

            <div class="absolute top-8 left-8 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl">
              <div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Order</div>
              <div class="text-white font-serif text-lg font-bold flex items-center gap-2">
                <MapPin class="text-aura-green" size={18} /> {order.id}
              </div>
            </div>

            <div class="absolute bottom-8 right-8 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl">
              <div class="flex items-center gap-6">
                <div>
                  <div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status</div>
                  <div class="text-white font-bold">{order.currentStatus}</div>
                </div>
                <div class="w-px h-8 bg-white/10"></div>
                <div>
                  <div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">ETA</div>
                  <div class="text-white font-bold">{order.estimatedDelivery}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-aura-glass border border-aura-glassBorder rounded-3xl p-6 flex items-center gap-4 hover:border-aura-green/30 transition-all">
              <div class="p-3 bg-white/5 rounded-2xl border border-white/10"><Box class="text-aura-green" size={24} /></div>
              <div>
                <div class="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Package</div>
                <div class="text-xs font-bold text-white">{order.items.length} Item{order.items.length === 1 ? '' : 's'}</div>
              </div>
            </div>
            <div class="bg-aura-glass border border-aura-glassBorder rounded-3xl p-6 flex items-center gap-4 hover:border-aura-green/30 transition-all">
              <div class="p-3 bg-white/5 rounded-2xl border border-white/10"><ShieldCheck class="text-green-500" size={24} /></div>
              <div>
                <div class="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">Security</div>
                <div class="text-xs font-bold text-white">Aura Quality Insured</div>
              </div>
            </div>
            <div class="bg-aura-glass border border-aura-glassBorder rounded-3xl p-6 flex items-center gap-4 hover:border-aura-green/30 transition-all">
              <div class="p-3 bg-white/5 rounded-2xl border border-white/10"><Clock class="text-amber-500" size={24} /></div>
              <div>
                <div class="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">ETA</div>
                <div class="text-xs font-bold text-white">{order.estimatedDelivery}</div>
              </div>
            </div>
          </div>

          <div class="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-6 sm:p-10">
            <div class="flex justify-between items-center mb-8">
              <h3 class="text-xl font-serif font-bold text-white">Package Manifest</h3>
              <div class="text-2xl font-black text-white">৳{order.totalAmount.toLocaleString()}</div>
            </div>
            <div class="space-y-4">
              {#each order.items as item}
                <div class="flex items-center gap-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-aura-green/30 transition-all">
                  {#if item.imageUrl}<img src={item.imageUrl} class="w-16 h-16 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" alt={item.name} />{/if}
                  <div class="flex-1 min-w-0">
                    <h4 class="text-sm font-bold text-white truncate">{item.name}</h4>
                    <p class="text-[10px] text-gray-600 uppercase font-black tracking-widest">{item.category}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
