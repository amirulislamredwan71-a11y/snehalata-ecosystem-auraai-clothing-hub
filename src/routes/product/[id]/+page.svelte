<script lang="ts">
  import { goto } from '$app/navigation';
  import { ArrowLeft, ShoppingBag, Zap, Shirt, ShieldCheck, Star, CheckCircle2, Loader2, ChevronRight } from '@lucide/svelte';
  import { productImg, imgFallback } from '$lib/imageUpload';
  import Stars from '$lib/components/Stars.svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { track } from '$lib/analytics';
  import { metaTrack } from '$lib/pixel';

  let { data } = $props();

  const product = $derived(data.product);
  const vendor = $derived(data.vendor);
  const related = $derived(data.related || []);

  const SITE = 'https://www.snehalata.com';
  const canonical = $derived(`${SITE}/product/${product.id}`);
  const absImg = $derived(
    product.imageUrl?.startsWith('http') ? product.imageUrl : `${SITE}${product.imageUrl || ''}`
  );
  const catLower = $derived(String(product.category || '').toLowerCase());
  const metaDesc = $derived(
    (product.description && String(product.description).slice(0, 155)) ||
      `${product.name} — ৳${Number(product.price).toLocaleString()}${vendor ? ` · ${vendor.store_name}` : ''}। Snehalata-তে যাচাই করা আসল পণ্য, ন্যায্য দাম, ক্যাশ অন ডেলিভারি।`
  );

  // Product + Breadcrumb structured data (Google product rich results).
  const jsonLd = $derived(
    JSON.stringify([
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: [absImg],
        description: product.description || metaDesc,
        sku: String(product.id),
        category: product.category,
        brand: { '@type': 'Brand', name: vendor?.store_name || 'Snehalata' },
        offers: {
          '@type': 'Offer',
          url: canonical,
          price: Number(product.price),
          priceCurrency: 'BDT',
          availability: 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition'
        },
        ...(data.ratingCount > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: data.ratingAvg,
                reviewCount: data.ratingCount
              }
            }
          : {})
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'নীড় · Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: product.category || 'পণ্য', item: `${SITE}/?cat=${encodeURIComponent(catLower)}` },
          { '@type': 'ListItem', position: 3, name: product.name, item: canonical }
        ]
      }
    ])
  );

  // Size + cart (same localStorage shape as ProductCard).
  const SIZED_CATS = ['panjabi', 'shirt', 't-shirt', 'pant', 'three-piece'];
  const SIZES = ['XS', 'S', 'M', 'L', 'XL'];
  const needsSize = $derived(SIZED_CATS.includes(catLower));
  let selectedSize = $state('M');
  let qty = $state(1);
  let added = $state(false);

  function addToCart(buyNow = false) {
    const size = needsSize ? selectedSize : null;
    const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    const i = cart.findIndex((x: any) => x.id === product.id);
    if (i > -1) {
      cart[i].quantity += qty;
      if (size) cart[i].size = size;
    } else {
      cart.push({ ...product, quantity: qty, size });
    }
    localStorage.setItem('aura_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    track('add_to_cart', { product_id: Number(product.id), vendor_id: vendor ? Number(vendor.id) : null, meta: { qty, size } });
    metaTrack('AddToCart', { content_ids: [String(product.id)], content_type: 'product', content_name: product.name, value: Number(product.price) * qty, currency: 'BDT' });
    if (buyNow) goto('/cart');
    else {
      added = true;
      setTimeout(() => (added = false), 2000);
    }
  }

  const tryOnHref = $derived(catLower === 'cosmetics' ? '/studio?tool=makeup' : `/try-on/${product.id}`);

  // Reviews — SSR list + inline write form (reuses /api/reviews).
  let reviews = $state<any[]>(data.reviews || []);
  let showForm = $state(false);
  let rvName = $state('');
  let rvPhone = $state('');
  let rvRating = $state(5);
  let rvBody = $state('');
  let rvSubmitting = $state(false);
  let rvThanks = $state(false);
  let rvError = $state('');

  async function submitReview() {
    if (rvSubmitting) return;
    rvError = '';
    rvSubmitting = true;
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: Number(product.id),
          vendor_id: vendor ? Number(vendor.id) : null,
          rating: rvRating,
          author_name: rvName,
          author_phone: rvPhone,
          body: rvBody
        })
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d?.message || 'রিভিউ সেভ হয়নি');
      if (d.review) reviews = [d.review, ...reviews];
      rvThanks = true;
      rvBody = ''; rvName = ''; rvPhone = '';
      showForm = false;
      setTimeout(() => (rvThanks = false), 2500);
    } catch (e: any) {
      rvError = e?.message || 'রিভিউ সেভ হয়নি';
    } finally {
      rvSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>{product.name} · ৳{Number(product.price).toLocaleString()}{vendor ? ` — ${vendor.store_name}` : ''} | Snehalata</title>
  <meta name="description" content={metaDesc} />
  <link rel="canonical" href={canonical} />
  <meta property="og:type" content="product" />
  <meta property="og:title" content={`${product.name} — Snehalata`} />
  <meta property="og:description" content={metaDesc} />
  <meta property="og:image" content={absImg} />
  <meta property="og:url" content={canonical} />
  <meta property="product:price:amount" content={String(product.price)} />
  <meta property="product:price:currency" content="BDT" />
  <meta name="twitter:card" content="summary_large_image" />
  {@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<div class="min-h-screen bg-[#080b09] pb-24">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-1.5 text-[11px] text-gray-500 mb-5 flex-wrap">
      <a href="/" class="hover:text-white transition-colors">নীড়</a>
      <ChevronRight size={12} />
      <a href={`/?cat=${encodeURIComponent(catLower)}`} class="hover:text-white transition-colors">{product.category}</a>
      <ChevronRight size={12} />
      <span class="text-gray-300 truncate max-w-[50vw]">{product.name}</span>
    </nav>

    <div class="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <!-- Image -->
      <div class="relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 shadow-2xl">
        <img src={productImg(product.imageUrl, 900)} onerror={imgFallback} alt={product.name} class="w-full h-full object-cover" />
        {#if product.moderationScore == null || product.moderationScore >= 55}
          <div class="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/45 border border-aura-gold/25">
            <ShieldCheck size={11} class="text-aura-gold" />
            <span class="text-[8px] font-black uppercase tracking-[0.2em] text-aura-gold">Neural Verified</span>
          </div>
        {/if}
      </div>

      <!-- Details -->
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">{product.name}</h1>
          {#if vendor}
            <a href={`/store/${vendor.slug}`} class="inline-block mt-2 text-[12px] text-gray-400 hover:text-aura-green transition-colors uppercase tracking-widest font-bold">{vendor.store_name} →</a>
          {/if}
          {#if data.ratingCount > 0}
            <div class="flex items-center gap-2 mt-2">
              <Stars value={data.ratingAvg} size={15} />
              <span class="text-[12px] font-bold text-aura-gold tabular-nums">{data.ratingAvg}</span>
              <span class="text-[11px] text-gray-500">({data.ratingCount} রিভিউ)</span>
            </div>
          {/if}
        </div>

        <div class="text-3xl font-black text-aura-gold tabular-nums">৳{Number(product.price).toLocaleString()}</div>

        {#if product.description}
          <p class="text-[14px] text-gray-300 leading-relaxed whitespace-pre-line">{product.description}</p>
        {/if}

        {#if needsSize}
          <div class="space-y-2">
            <span class="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em]">সাইজ · Size</span>
            <div class="flex gap-2">
              {#each SIZES as s}
                <button type="button" onclick={() => (selectedSize = s)}
                  class="flex-1 py-2.5 rounded-xl text-sm font-black border transition-all cursor-pointer {selectedSize === s ? 'bg-aura-green border-aura-green text-black' : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30'}">{s}</button>
              {/each}
            </div>
          </div>
        {/if}

        <div class="flex items-center gap-3">
          <span class="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em]">পরিমাণ</span>
          <div class="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5">
            <button onclick={() => (qty = Math.max(1, qty - 1))} class="px-2 text-xl text-white cursor-pointer">−</button>
            <span class="text-lg font-black text-white tabular-nums w-6 text-center">{qty}</span>
            <button onclick={() => (qty += 1)} class="px-2 text-xl text-white cursor-pointer">+</button>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button onclick={() => addToCart(false)}
            class="flex items-center justify-center gap-2 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer {added ? 'bg-green-500 text-white' : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black'}">
            {#if added}<CheckCircle2 size={16} /> যোগ হয়েছে{:else}<ShoppingBag size={16} /> কার্টে যোগ{/if}
          </button>
          <button onclick={() => addToCart(true)}
            class="flex items-center justify-center gap-2 py-4 bg-[#10b981] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
            <Zap size={16} class="fill-current" /> এখনই কিনুন
          </button>
        </div>

        <a href={tryOnHref}
          class="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-gray-300 hover:text-[#10b981] hover:border-[#10b981]/40 transition-all">
          <Shirt size={15} /> <span class="text-[11px] font-black uppercase tracking-widest">AR Try-On</span>
        </a>

        <div class="flex items-center gap-2 text-[11px] text-gray-500 pt-2">
          <ShieldCheck size={14} class="text-[#10b981]" /> যাচাই করা আসল পণ্য · ক্যাশ অন ডেলিভারি · সহজ রিটার্ন
        </div>
      </div>
    </div>

    <!-- Reviews -->
    <section class="mt-14 max-w-3xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-serif font-bold text-white">রিভিউ ও রেটিং</h2>
        {#if !showForm}
          <button onclick={() => { showForm = true; rvError = ''; }}
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white hover:bg-[#10b981] hover:border-[#10b981] transition-all cursor-pointer">
            <Star size={13} /> রিভিউ লিখুন
          </button>
        {/if}
      </div>

      {#if rvThanks}
        <p class="text-[13px] text-[#10b981] font-bold flex items-center gap-2 mb-3"><CheckCircle2 size={15} /> ধন্যবাদ! আপনার রিভিউ যোগ হয়েছে।</p>
      {/if}

      {#if showForm}
        <div class="space-y-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10 mb-5">
          <div class="flex items-center gap-1.5">
            <span class="text-[11px] text-gray-500 mr-1">আপনার রেটিং:</span>
            {#each [1, 2, 3, 4, 5] as i}
              <button type="button" onclick={() => (rvRating = i)} aria-label={`${i} star`} class="cursor-pointer">
                <Star size={20} class={i <= rvRating ? 'text-aura-gold fill-aura-gold' : 'text-gray-600'} />
              </button>
            {/each}
          </div>
          <input type="text" bind:value={rvName} placeholder="আপনার নাম" maxlength="80"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#10b981] outline-none" />
          <input type="tel" bind:value={rvPhone} placeholder="ফোন (ঐচ্ছিক · গোপন থাকবে)" maxlength="20"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#10b981] outline-none" />
          <textarea bind:value={rvBody} placeholder="আপনার অভিজ্ঞতা লিখুন…" maxlength="1500" rows="3"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#10b981] outline-none resize-none"></textarea>
          {#if rvError}<p class="text-[11px] text-red-400">{rvError}</p>{/if}
          <div class="flex gap-2">
            <button onclick={() => (showForm = false)} class="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-gray-400 border border-white/10 hover:text-white transition-colors cursor-pointer">বাতিল</button>
            <button onclick={submitReview} disabled={rvSubmitting}
              class="flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest bg-[#10b981] text-white hover:bg-white hover:text-black transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer">
              {#if rvSubmitting}<Loader2 size={13} class="animate-spin" />{/if} জমা দিন
            </button>
          </div>
        </div>
      {/if}

      {#if reviews.length > 0}
        <div class="space-y-3">
          {#each reviews.slice(0, 20) as rv (rv.id)}
            <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[13px] font-bold text-white truncate">{rv.author_name || 'একজন ক্রেতা'}</span>
                <Stars value={rv.rating} size={12} />
              </div>
              {#if rv.body}<p class="text-[13px] text-gray-400 mt-1.5 leading-snug">{rv.body}</p>{/if}
            </div>
          {/each}
        </div>
      {:else if !showForm}
        <p class="text-[13px] text-gray-500">এখনো কোনো রিভিউ নেই — প্রথম রিভিউটি আপনিই দিন।</p>
      {/if}
    </section>

    <!-- Related -->
    {#if related.length > 0}
      <section class="mt-16">
        <h2 class="text-lg font-serif font-bold text-white mb-6 border-l-4 border-aura-gold pl-3">একই ধরনের পণ্য</h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {#each related as p (p.id)}
            <ProductCard product={p} vendor={vendor && p.vendorId === vendor.id ? vendor : undefined} />
          {/each}
        </div>
      </section>
    {/if}

    <a href="/" class="inline-flex items-center gap-2 text-gray-500 hover:text-white mt-14 transition-colors text-sm">
      <ArrowLeft size={16} /> নীড়ে ফিরে যান
    </a>
  </div>
</div>
