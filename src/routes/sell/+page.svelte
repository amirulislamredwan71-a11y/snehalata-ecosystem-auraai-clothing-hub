<script lang="ts">
  import { Store, Sparkles, Camera, ShieldCheck, TrendingUp, Truck, Wallet, ArrowRight, Check, Bot, MessageCircle, Link2, RefreshCw, Search, Globe } from '@lucide/svelte';

  // The two pillars a standalone website can NEVER give itself — the reason Snehalata is essential.
  const PILLARS = [
    {
      icon: Search,
      title: 'চাহিদা — যা তুমি নিজে বানাতে পারো না',
      sub: 'তোমার নিজের সাইট একটা গন্তব্য — ক্রেতাকে আগে চিনতে হয়, নাহলে বিজ্ঞাপনে টাকা ঢালতে হয়। Snehalata একটা discovery engine: বাজেট, উপলক্ষ ও ছবি দিয়ে খোঁজা ক্রেতা তোমাকে খুঁজে পায়। বিক্রি হলে তবেই খরচ।',
      en: 'Demand you can’t self-generate'
    },
    {
      icon: ShieldCheck,
      title: 'ট্রাস্ট — যা তুমি নিজেকে দিতে পারো না',
      sub: 'নিজের সাইটে "আমরা আসল" লেখা যায়, প্রমাণ করা যায় না। Neural Verified একটা নিরপেক্ষ ট্রাস্ট-স্ট্যাম্প — নকল এই ব্যাজ পায় না, তুমি পাও। BD-র নকল-আতঙ্কের বাজারে এটাই তোমার সবচেয়ে বড় শক্তি।',
      en: 'Trust you can’t self-grant'
    }
  ];

  const VALUE = [
    { icon: Link2, title: 'লিংক দাও → পুরো ক্যাটালগ', sub: 'নিজের ওয়েবসাইট আছে? শুধু লিংকটা দাও — Aura নাম, দাম ও ছবি তুলে আনে। বেশিরভাগ সাইটে সম্পূর্ণ অটো; নাহলে কয়েকটা ছবি দাও, AI বাকিটা সাজায়।', en: 'Your link → full catalog' },
    { icon: RefreshCw, title: 'নিজে থেকে আপডেট থাকে', sub: 'নিজের সাইটে নতুন পণ্য দাও, দাম বদলাও, স্টক শেষ হোক — Snehalata-তে আপনাআপনি বদলে যায়। দুইবার আপলোড নেই, আঙুলও নাড়তে হবে না।', en: 'Stays in sync, automatically' },
    { icon: Sparkles, title: 'Virtual Try-On + ছবি-সার্চ', sub: 'গ্রাহক কেনার আগে তোমার পোশাক নিজের ছবিতে পরে দেখে; ছবি দিয়ে পণ্য খুঁজে পায় — যে প্রযুক্তি তুমি নিজে বানাবে না।', en: 'AI try-on & visual search' },
    { icon: Truck, title: 'COD + কুরিয়ার + ড্যাশবোর্ড', sub: 'ক্যাশ অন ডেলিভারি, অর্ডার ম্যানেজমেন্ট, লাইভ ট্র্যাকিং ও দ্রুত পেআউট — এক ড্যাশবোর্ডে, বিল্ট-ইন।', en: 'COD, tracking & fast payout' }
  ];

  const STEPS = [
    { n: '১', title: 'লিংক বা ছবি দাও', sub: 'নিজের সাইটের লিংক দাও — নাহলে কয়েকটা পণ্যের ছবি। ২ মিনিটে সাইন আপ।' },
    { n: '২', title: 'Aura ক্যাটালগ সাজায়', sub: 'Aura Neural Grid তোমার পুরো ক্যাটালগ তুলে আনে — নাম, দাম, ছবি। তুমি শুধু একবার দেখে নাও।' },
    { n: '৩', title: 'যাচাই → লাইভ → auto-fresh', sub: 'Neural Verified হলে পণ্য লাইভ; এরপর নিজের সাইটে বদলালে এখানেও নিজে থেকে বদলায়।' }
  ];
</script>

<svelte:head>
  <title>Snehalata-তে বিক্রি করুন — লিংক দাও, বাকি Aura করবে | Sell on Snehalata</title>
  <meta name="description" content="নিজের ওয়েবসাইট আছে? শুধু লিংক দাও — Aura তোমার পুরো ক্যাটালগ তুলে আনে ও নিজে থেকে আপডেট রাখে। Neural Verified ট্রাস্ট, Virtual Try-On, COD ও দ্রুত পেআউট। ছোট দোকান থেকে বড় ব্র্যান্ড — এক প্ল্যাটফর্ম, কোনো বেদাবেদ নেই।" />
</svelte:head>

<div class="min-h-screen text-white">
  <!-- Hero -->
  <section class="max-w-5xl mx-auto px-6 pt-20 pb-14 text-center">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aura-gold/10 border border-aura-gold/25 mb-8">
      <Store size={14} class="text-aura-gold" />
      <span class="text-[10px] font-black uppercase tracking-[0.3em] text-aura-gold">Sell on Snehalata · Neural Verified</span>
    </div>
    <h1 class="text-4xl sm:text-6xl font-serif font-black italic leading-tight mb-6">
      শুধু <span class="text-aura-green">লিংকটা</span> দাও — <br /> বাকি সব <span class="text-aura-gold">Aura</span> করবে
    </h1>
    <p class="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-4">
      নিজের ওয়েবসাইট আছে? লিংক দাও — Aura তোমার <span class="text-white font-semibold">পুরো ক্যাটালগ</span> তুলে আনে (নাম, দাম, ছবি)।
      নিজের সাইটে যা বদলাবে, এখানেও বদলে যাবে। <span class="text-white font-semibold">দুইবার আপলোড নেই, আঙুলও নাড়তে হবে না।</span>
    </p>
    <p class="text-gray-500 text-sm max-w-2xl mx-auto mb-10">ওয়েবসাইট নেই? কয়েকটা ছবি দাও — AI নাম, দাম, বিবরণ বানিয়ে তোমার পুরো দোকান সাজিয়ে দেয়।</p>

    <!-- Link-import highlight -->
    <div class="max-w-xl mx-auto mb-10">
      <div class="flex items-center gap-2 p-2 rounded-2xl bg-[#0a0f0d]/80 border border-aura-green/25">
        <div class="pl-3 text-aura-green"><Globe size={18} /></div>
        <div class="flex-1 text-left text-sm text-gray-500 py-2.5 truncate">https://your-shop.com</div>
        <a href="/onboarding" class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-aura-green text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all shrink-0">
          ক্যাটালগ আনো <ArrowRight size={14} />
        </a>
      </div>
      <p class="mt-2 text-[11px] text-gray-600">লিংক দিলেই Aura তোমার পণ্যগুলো টেনে আনে — তুমি শুধু একবার দেখে Approve করো।</p>
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="/onboarding" class="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-aura-green text-black font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-[0_0_40px_rgba(16,185,129,0.32)]">
        বিক্রেতা হিসেবে যোগ দিন <ArrowRight size={16} class="group-hover:translate-x-1 transition-transform" />
      </a>
      <a href="/dashboard" class="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-colors">
        <Bot size={16} class="text-aura-gold" /> Vendor Login
      </a>
    </div>
    <p class="mt-6 text-sm text-gray-400">
      সাহায্য লাগবে? সরাসরি কল বা WhatsApp করুন —
      <a href="tel:01911877091" class="text-aura-green font-bold hover:text-white transition-colors">01911-877091</a>
      <a href="https://wa.me/8801911877091" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-lg bg-aura-green/12 border border-aura-green/30 text-aura-green text-xs font-bold hover:bg-aura-green/20 transition-colors">
        <MessageCircle size={13} /> WhatsApp
      </a>
      <br class="sm:hidden" />
      <span class="text-gray-500">অথবা মেইল করুন</span>
      <a href="mailto:contact@snehalata.com" class="text-aura-green font-semibold hover:text-white transition-colors">contact@snehalata.com</a>
    </p>
  </section>

  <!-- Why it's essential — the two pillars -->
  <section class="max-w-6xl mx-auto px-6 py-8">
    <p class="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-6">নিজের সাইট থাকা সত্ত্বেও কেন Snehalata</p>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      {#each PILLARS as p}
        {@const Icon = p.icon}
        <div class="p-7 rounded-3xl bg-gradient-to-br from-aura-green/[0.08] to-transparent border border-aura-green/20">
          <div class="p-3 rounded-2xl bg-aura-green/12 text-aura-green w-fit mb-4"><Icon size={22} /></div>
          <h3 class="text-xl font-serif font-black italic mb-2">{p.title}</h3>
          <p class="text-sm text-gray-300 leading-relaxed">{p.sub}</p>
          <p class="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600 mt-3">{p.en}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Value grid -->
  <section class="max-w-6xl mx-auto px-6 py-10">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      {#each VALUE as v}
        {@const Icon = v.icon}
        <div class="p-6 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:border-aura-gold/25 transition-colors">
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-2xl bg-aura-gold/10 text-aura-gold shrink-0"><Icon size={20} /></div>
            <div>
              <h3 class="text-lg font-serif font-black italic mb-1">{v.title}</h3>
              <p class="text-sm text-gray-400 leading-relaxed">{v.sub}</p>
              <p class="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600 mt-3">{v.en}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Two audiences, one platform, no discrimination -->
  <section class="max-w-5xl mx-auto px-6 py-10">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="p-7 rounded-3xl bg-white/[0.03] border border-white/8">
        <div class="p-3 rounded-2xl bg-aura-gold/10 text-aura-gold w-fit mb-4"><Camera size={20} /></div>
        <h3 class="text-lg font-bold mb-2">ঘরে-বানানো / ছোট দোকান</h3>
        <p class="text-sm text-gray-400 leading-relaxed">ওয়েবসাইট নেই, try-on নেই, reach নেই? Snehalata তোমাকে <span class="text-white font-semibold">পুরো দোকান + নিজস্ব সাবডোমেইন + AI + COD + সারা দেশের ক্রেতা</span> দেয় — যা তুমি কোনোদিন নিজে বানাতে পারতে না।</p>
      </div>
      <div class="p-7 rounded-3xl bg-white/[0.03] border border-white/8">
        <div class="p-3 rounded-2xl bg-aura-green/10 text-aura-green w-fit mb-4"><Globe size={20} /></div>
        <h3 class="text-lg font-bold mb-2">নিজের ওয়েবসাইট আছে</h3>
        <p class="text-sm text-gray-400 leading-relaxed">লিংক দাও → <span class="text-white font-semibold">শূন্য এন্ট্রি</span>, বাড়তি চাহিদা যা তোমার বিজ্ঞাপন পায় না, একই <span class="text-white font-semibold">Neural Verified</span> ব্যাজ। কিছুই হারাও না, একটা চ্যানেল পাও।</p>
      </div>
    </div>
    <p class="text-center text-sm text-gray-500 mt-6">এক প্ল্যাটফর্ম, <span class="text-white font-semibold">কোনো বেদাবেদ নেই</span> — ছোট কারিগর আর বড় ব্র্যান্ড একই ব্যাজ পরে। সততাই একমাত্র পার্থক্য; নকল বাদ পড়ে যায়।</p>
  </section>

  <!-- How it works -->
  <section class="max-w-5xl mx-auto px-6 py-12">
    <h2 class="text-center text-3xl font-serif font-black italic mb-12">কীভাবে শুরু করবেন</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each STEPS as s}
        <div class="relative p-8 rounded-3xl bg-white/[0.03] border border-white/5 text-center">
          <div class="w-14 h-14 mx-auto mb-5 rounded-2xl bg-aura-green/15 border border-aura-green/30 flex items-center justify-center text-2xl font-black text-aura-green">{s.n}</div>
          <h3 class="text-lg font-bold mb-2">{s.title}</h3>
          <p class="text-sm text-gray-400 leading-relaxed">{s.sub}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- Trust / commission -->
  <section class="max-w-4xl mx-auto px-6 py-12">
    <div class="rounded-3xl bg-gradient-to-br from-aura-gold/10 to-transparent border border-aura-gold/20 p-8 sm:p-10">
      <div class="flex flex-col sm:flex-row items-start gap-6">
        <div class="p-4 rounded-2xl bg-aura-gold/10 text-aura-gold shrink-0"><ShieldCheck size={28} /></div>
        <div class="space-y-3">
          <h3 class="text-2xl font-serif font-black italic">স্বচ্ছ ও ন্যায্য</h3>
          <ul class="space-y-2 text-sm text-gray-300">
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> <span class="text-white font-bold">স্বচ্ছ হিসাব</span> — কোনো লুকানো খরচ নেই, বিক্রি হলে তবেই খরচ।</li>
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> <span class="text-white font-bold">Neural Verified</span> ব্যাজে গ্রাহকের আস্থা বাড়ে; নকল এই ব্যাজ পায় না।</li>
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> অর্ডার, বিক্রি ও পেআউট — সব ড্যাশবোর্ডে স্বচ্ছ।</li>
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> ছোট দোকান থেকে বড় ব্র্যান্ড — এক প্ল্যাটফর্ম, সবাই স্বাগত।</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="max-w-3xl mx-auto px-6 py-16 text-center">
    <TrendingUp size={32} class="text-aura-gold mx-auto mb-5" />
    <h2 class="text-3xl sm:text-4xl font-serif font-black italic mb-4">লিংকটা দাও — আজই শুরু করো</h2>
    <p class="text-gray-400 mb-8">সারা বাংলাদেশের ক্রেতা তোমার অপেক্ষায় — Aura Neural Grid বাকিটা সামলাবে।</p>
    <a href="/onboarding" class="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-aura-green text-black font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-[0_0_40px_rgba(16,185,129,0.32)]">
      বিক্রেতা হিসেবে যোগ দিন <ArrowRight size={16} />
    </a>
  </section>
</div>
