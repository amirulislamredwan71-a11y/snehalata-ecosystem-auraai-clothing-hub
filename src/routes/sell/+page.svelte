<script lang="ts">
  import { Store, Sparkles, Camera, ShieldCheck, TrendingUp, Truck, Wallet, ArrowRight, Check, Bot, MessageCircle } from '@lucide/svelte';

  const VALUE = [
    { icon: Camera, title: 'AI Catalog — ছবি দিলেই লিস্টিং', sub: 'শুধু পণ্যের ছবি দিন — Aura AI নাম, দাম, বিবরণ ও ক্যাটাগরি বানিয়ে ক্যাটালগে তুলে দেয়। ওয়েবসাইট থাকলে সেখান থেকেও ইমপোর্ট।', en: 'Photos → AI listings' },
    { icon: Sparkles, title: 'Virtual Try-On', sub: 'গ্রাহক কেনার আগে আপনার পোশাক নিজের ছবিতে পরে দেখে — বিক্রি বাড়ে, রিটার্ন কমে।', en: 'Customers try before they buy' },
    { icon: Truck, title: 'COD + কুরিয়ার + ট্র্যাকিং', sub: 'ক্যাশ অন ডেলিভারি, অর্ডার ম্যানেজমেন্ট ও রিয়েল-টাইম ট্র্যাকিং — সবই বিল্ট-ইন।', en: 'COD, delivery & live tracking' },
    { icon: Wallet, title: 'Dashboard + দ্রুত Payout', sub: 'অর্ডার, বিক্রি ও পেআউট এক ড্যাশবোর্ডে। স্বচ্ছ হিসাব, দ্রুত টাকা।', en: 'One dashboard, fast payouts' }
  ];

  const STEPS = [
    { n: '১', title: 'রেজিস্টার করুন', sub: 'ব্র্যান্ড, ক্যাটাগরি ও ট্রেড লাইসেন্স দিয়ে ২ মিনিটে সাইন আপ।' },
    { n: '২', title: 'AI ক্যাটালগ সাজায়', sub: 'ছবি বা ওয়েবসাইট দিন — Aura Neural Grid আপনার পণ্য সাজিয়ে দেয়।' },
    { n: '৩', title: 'বিক্রি শুরু', sub: 'যাচাই হলে পণ্য লাইভ — সারা বাংলাদেশের ক্রেতার কাছে পৌঁছান।' }
  ];
</script>

<svelte:head>
  <title>Snehalata-তে বিক্রি করুন — Sell on Snehalata | AI Vendor Onboarding</title>
  <meta name="description" content="বাংলাদেশের unified AI marketplace-এ আপনার ব্র্যান্ড, শোরুম বা দোকান আনুন। ছবি দিলেই AI ক্যাটালগ, Virtual Try-On, COD, কুরিয়ার ও দ্রুত পেআউট।" />
</svelte:head>

<div class="min-h-screen text-white">
  <!-- Hero -->
  <section class="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-aura-gold/10 border border-aura-gold/25 mb-8">
      <Store size={14} class="text-aura-gold" />
      <span class="text-[10px] font-black uppercase tracking-[0.3em] text-aura-gold">Sell on Snehalata</span>
    </div>
    <h1 class="text-4xl sm:text-6xl font-serif font-black italic leading-tight mb-6">
      আপনার ব্র্যান্ড আনুন <br /> দেশের <span class="text-aura-gold">AI Neural</span> মার্কেটপ্লেসে
    </h1>
    <p class="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
      ছবি দিলেই AI আপনার পুরো ক্যাটালগ সাজিয়ে দেয়। Virtual Try-On, COD, কুরিয়ার, ট্র্যাকিং ও দ্রুত পেআউট —
      বিক্রির সব কিছু এক জায়গায়। <span class="text-white font-semibold">দুইবার আপলোড করার ঝামেলা নেই।</span>
    </p>
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

  <!-- Value grid -->
  <section class="max-w-6xl mx-auto px-6 py-12">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      {#each VALUE as v}
        {@const Icon = v.icon}
        <div class="p-6 rounded-3xl bg-[#0A0A0A] border border-white/5 hover:border-aura-gold/25 transition-colors">
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-2xl bg-aura-gold/10 text-aura-gold shrink-0">
              <Icon size={20} />
            </div>
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
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> <span class="text-white font-bold">স্বচ্ছ হিসাব</span> — কোনো লুকানো খরচ নেই।</li>
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> <span class="text-white font-bold">Neural Verified</span> ব্যাজে গ্রাহকের আস্থা বাড়ে।</li>
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> অর্ডার, বিক্রি ও পেআউট — সব ড্যাশবোর্ডে স্বচ্ছ।</li>
            <li class="flex items-center gap-2"><Check size={14} class="text-aura-gold shrink-0" /> ছোট দোকান থেকে বড় ব্র্যান্ড — সবাই স্বাগত।</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- Final CTA -->
  <section class="max-w-3xl mx-auto px-6 py-16 text-center">
    <TrendingUp size={32} class="text-aura-gold mx-auto mb-5" />
    <h2 class="text-3xl sm:text-4xl font-serif font-black italic mb-4">আজই আপনার দোকান অনলাইনে আনুন</h2>
    <p class="text-gray-400 mb-8">সারা বাংলাদেশের ক্রেতা আপনার অপেক্ষায় — Aura Neural Grid বাকিটা সামলাবে।</p>
    <a href="/onboarding" class="inline-flex items-center gap-3 px-10 py-4 rounded-2xl bg-aura-green text-black font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-[0_0_40px_rgba(16,185,129,0.32)]">
      বিক্রেতা হিসেবে যোগ দিন <ArrowRight size={16} />
    </a>
  </section>
</div>
