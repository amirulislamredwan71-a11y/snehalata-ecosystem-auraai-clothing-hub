<script lang="ts">
  import { Search, Shirt, ShoppingBag, Truck, Wallet, Store, UploadCloud, PackageCheck, BadgeCheck, Sparkles, ArrowRight, ShieldCheck } from '@lucide/svelte';

  const shopperSteps = [
    { icon: Search, title: 'খুঁজুন — লিখে বা ছবি দিয়ে', body: 'নাম লিখে অথবা যেকোনো পোশাকের ছবি তুলে Neural Search-এ দিন — Aura মিলিয়ে পণ্য খুঁজে দেয়।' },
    { icon: Shirt, title: 'AR Try-On — কেনার আগেই গায়ে দেখুন', body: 'নিজের ছবি দিন, পোশাকটা আপনার গায়ে কেমন লাগবে AI দেখিয়ে দেবে। কসমেটিক্সে শেড ট্রাই করুন।' },
    { icon: ShoppingBag, title: 'কার্টে যোগ করে অর্ডার দিন', body: 'সাইজ বেছে কার্টে যোগ করুন, ঠিকানা দিন। ভিন্ন দোকানের পণ্য একসাথে অর্ডার করা যায়।' },
    { icon: Wallet, title: 'পেমেন্ট — COD বা অনলাইন', body: 'ক্যাশ অন ডেলিভারি, অথবা কার্ড/bKash/Nagad-এ সুরক্ষিত অনলাইন পেমেন্ট (SSLCommerz)।' },
    { icon: Truck, title: 'অর্ডার ট্র্যাক করুন', body: 'ট্র্যাকিং আইডি দিয়ে অর্ডার কোন পর্যায়ে আছে লাইভ দেখুন — কুরিয়ার হ্যান্ডওভার পর্যন্ত।' }
  ];

  const vendorSteps = [
    { icon: Store, title: 'ফ্রি রেজিস্টার করুন', body: 'দোকান থাকুক বা না থাকুক — ঘরে বানানো পণ্যও বিক্রি করুন। ২ মিনিটে সাইন আপ, ট্রেড লাইসেন্স ছাড়াই শুরু।' },
    { icon: UploadCloud, title: 'পণ্য যোগ করুন — সহজে', body: 'শুধু ছবি তুলুন — AI নাম/দাম/বর্ণনা বসিয়ে দেয়। অথবা নিজের ওয়েবসাইট লিংক দিলে পুরো ক্যাটালগ ইমপোর্ট হয়।' },
    { icon: BadgeCheck, title: 'নিজের স্টোর + সাবডোমেইন', body: 'আপনার ব্র্যান্ড পায় নিজের storefront (yourshop.snehalata.com) + "Neural Verified" ব্যাজ।' },
    { icon: PackageCheck, title: 'অর্ডার পান, ড্যাশবোর্ডে ম্যানেজ করুন', body: 'অর্ডার, স্টক, পেআউট সব এক ড্যাশবোর্ডে। এক ক্লিকে Steadfast কুরিয়ার বুকিং।' },
    { icon: Wallet, title: 'কম কমিশন — মাত্র ৬–১১%', body: 'Aura Smart Commission — ভালো রেটিং হলে কমিশন কমে। স্বচ্ছ হিসাব, কোনো লুকানো খরচ নেই।' }
  ];
</script>

<svelte:head>
  <title>কীভাবে ব্যবহার করবেন — Snehalata Guide</title>
  <meta name="description" content="Snehalata কীভাবে ব্যবহার করবেন — ক্রেতা ও বিক্রেতাদের জন্য সহজ ধাপে-ধাপে গাইড। AR Try-On, Neural Search, অর্ডার, পেমেন্ট, বিক্রি ও পেআউট।" />
  <link rel="canonical" href="https://www.snehalata.com/guide" />
</svelte:head>

<div class="min-h-screen bg-[#080b09] pb-24">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
    <!-- Hero -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aura-green/10 border border-aura-green/25 text-aura-green text-[10px] font-black uppercase tracking-widest mb-4">
        <Sparkles size={12} /> কীভাবে কাজ করে
      </div>
      <h1 class="text-3xl sm:text-4xl font-serif font-black text-white">Snehalata কীভাবে ব্যবহার করবেন</h1>
      <p class="text-gray-400 mt-3 max-w-2xl mx-auto text-sm leading-relaxed">বাংলাদেশের প্রথম AI-নিয়ন্ত্রিত মার্কেটপ্লেস — ক্রেতা ও বিক্রেতা দুজনের জন্যই সহজ। নিচে ধাপে-ধাপে দেখানো হলো।</p>
    </div>

    <!-- Video walkthrough (YouTube — adaptive streaming, light on mobile) -->
    <div class="mb-10 rounded-[2rem] overflow-hidden border border-aura-green/20 bg-black shadow-2xl shadow-aura-green/5">
      <div class="aspect-video">
        <iframe class="w-full h-full" src="https://www.youtube.com/embed/kzg8HpkXufE" title="Snehalata — কীভাবে ব্যবহার করবেন" frameborder="0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    </div>

    <!-- Branded showcase — Snehalata-র signature visuals (AR Try-On · সাধ্য Mode · Neural Verified) -->
    <div class="mb-14">
      <p class="text-center text-[11px] uppercase tracking-widest font-black text-gray-500 mb-4">এক নজরে Snehalata</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {#each ['infographic-1.jpg', 'infographic-2.jpg', 'infographic-3.jpg'] as img}
          <a href={`/guide/${img}`} target="_blank" rel="noreferrer" class="block rounded-2xl overflow-hidden border border-white/10 hover:border-aura-green/40 transition-all bg-white/[0.02]">
            <img src={`/guide/${img}`} alt="Snehalata" loading="lazy" class="w-full h-auto" />
          </a>
        {/each}
      </div>
    </div>

    <!-- Shoppers track -->
    <section class="mb-16">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-2xl bg-aura-green/15 flex items-center justify-center text-aura-green"><ShoppingBag size={20} /></div>
        <div>
          <h2 class="text-xl font-serif font-black text-white">ক্রেতাদের জন্য</h2>
          <p class="text-[11px] text-gray-500 uppercase tracking-widest font-black">For Shoppers</p>
        </div>
      </div>
      <div class="space-y-4">
        {#each shopperSteps as s, i}
          {@const Icon = s.icon}
          <div class="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5">
            <div class="shrink-0 flex flex-col items-center gap-2">
              <div class="w-9 h-9 rounded-full bg-aura-green text-black font-black flex items-center justify-center text-sm">{i + 1}</div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1"><Icon size={16} class="text-aura-green" /><h3 class="text-[15px] font-bold text-white">{s.title}</h3></div>
              <p class="text-[13px] text-gray-400 leading-relaxed">{s.body}</p>
            </div>
          </div>
        {/each}
      </div>
      <a href="/" class="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl bg-aura-green text-black font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all">
        এখন কেনাকাটা শুরু করুন <ArrowRight size={15} />
      </a>
    </section>

    <!-- Vendors track -->
    <section class="mb-12">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 rounded-2xl bg-aura-gold/15 flex items-center justify-center text-aura-gold"><Store size={20} /></div>
        <div>
          <h2 class="text-xl font-serif font-black text-white">বিক্রেতাদের জন্য</h2>
          <p class="text-[11px] text-gray-500 uppercase tracking-widest font-black">For Vendors / Partners</p>
        </div>
      </div>
      <div class="space-y-4">
        {#each vendorSteps as s, i}
          {@const Icon = s.icon}
          <div class="flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5">
            <div class="shrink-0 flex flex-col items-center gap-2">
              <div class="w-9 h-9 rounded-full bg-aura-gold text-black font-black flex items-center justify-center text-sm">{i + 1}</div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1"><Icon size={16} class="text-aura-gold" /><h3 class="text-[15px] font-bold text-white">{s.title}</h3></div>
              <p class="text-[13px] text-gray-400 leading-relaxed">{s.body}</p>
            </div>
          </div>
        {/each}
      </div>
      <a href="/sell" class="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-2xl bg-aura-gold text-black font-black text-[11px] uppercase tracking-widest hover:brightness-110 transition-all">
        বিক্রেতা হিসেবে যোগ দিন <ArrowRight size={15} />
      </a>
    </section>

    <div class="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-6 border-t border-white/5">
      <ShieldCheck size={14} class="text-aura-green" /> যাচাই করা আসল পণ্য · ন্যায্য দাম · ক্যাশ অন ডেলিভারি · নিরাপদ পেমেন্ট
    </div>
  </div>
</div>
