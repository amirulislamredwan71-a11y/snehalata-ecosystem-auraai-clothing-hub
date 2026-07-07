<script lang="ts">
  import { ShoppingBag, ArrowLeft, Trash2, Minus, Plus, ShoppingCart, Truck, Wallet, CheckCircle2 } from '@lucide/svelte';
  import { fade, fly, scale } from 'svelte/transition';
  import { getOrders, addOrder, getProducts } from '$lib/mockData';
  import { BD_LOCATIONS } from '$lib/locationData';
  import type { Order, Product, OrderStatus, TimelineEntry } from '$lib/types';

  interface CartItem extends Product {
    quantity: number;
  }

  let cartItems = $state<CartItem[]>([]);
  let checkoutStep = $state<'CART' | 'DETAILS' | 'DONE'>('CART');
  let completedOrder = $state<Order | null>(null);
  let error = $state<string | null>(null);

  let formData = $state({
    name: '', phone: '', district: '', area: '', address: '', email: '', note: ''
  });

  let saveAddress = $state(true);
  let payMethod = $state('COD');
  let payTxid = $state('');
  let placing = $state(false);
  let completedOrderId = $state<number | null>(null);
  let completedTracking = $state<string | null>(null);
  const PAY_NUMBER = '01712-426871';

  $effect(() => {
    cartItems = JSON.parse(localStorage.getItem('aura_cart') || '[]');

    const handler = () => {
      cartItems = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    };
    window.addEventListener('cartUpdated', handler);
    return () => window.removeEventListener('cartUpdated', handler);
  });

  function updateQuantity(id: string | number, delta: number) {
    const newCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
    cartItems = newCart;
    localStorage.setItem('aura_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  }

  function removeItem(id: string | number) {
    const newCart = cartItems.filter(item => item.id !== id);
    cartItems = newCart;
    localStorage.setItem('aura_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  }

  const subtotal = $derived(cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0));
  const shipping = $derived(formData.district === 'Dhaka' ? 78 : 118);
  const total = $derived(subtotal + shipping);

  async function handlePlaceOrder() {
    error = null;
    if (!formData.name || !formData.phone || !formData.address) {
      error = 'Please fill in all required fields (Name, Phone, Address)';
      return;
    }
    if (payMethod !== 'COD' && !payTxid.trim()) {
      error = `Please enter your ${payMethod === 'BKASH' ? 'bKash' : 'Nagad'} Transaction ID`;
      return;
    }
    placing = true;
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: formData.name, phone: formData.phone, email: formData.email,
            district: formData.district, area: formData.area, address: formData.address, note: formData.note
          },
          items: cartItems.map((i) => ({ id: i.id, quantity: i.quantity })),
          payment: { method: payMethod, txid: payTxid || null }
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not place order');
      localStorage.removeItem('aura_cart');
      cartItems = [];
      window.dispatchEvent(new Event('cartUpdated'));
      completedOrderId = data.orderId;
      completedTracking = data.tracking || ('ORD-' + data.orderId);
      // Persist the order so the customer keeps a real-time tracking record (their
      // lightweight identity = their saved orders, keyed by phone + tracking code).
      try {
        const mine = JSON.parse(localStorage.getItem('aura_my_orders') || '[]');
        mine.unshift({ id: data.orderId, tracking: completedTracking, phone: formData.phone, name: formData.name, total: data.total, at: new Date().toISOString() });
        localStorage.setItem('aura_my_orders', JSON.stringify(mine.slice(0, 50)));
      } catch { /* ignore storage errors */ }
      checkoutStep = 'DONE';
    } catch (e: any) {
      error = e?.message || 'Could not place order. Please try again.';
    } finally {
      placing = false;
    }
  }
</script>

{#snippet stepNode(number: number, label: string, active: boolean, completed: boolean)}
  <div class="flex flex-col items-center gap-3 z-10 relative">
    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 {completed ? 'bg-green-500 text-white' : active ? 'bg-aura-green text-white ring-8 ring-aura-green/10' : 'bg-gray-200 text-gray-400'}">
      {#if completed}
        <CheckCircle2 size={16} />
      {:else}
        {number}
      {/if}
    </div>
    <span class="text-[8px] font-black uppercase tracking-widest transition-colors {(active || completed) ? 'text-gray-900' : 'text-gray-400'}">{label}</span>
  </div>
{/snippet}

{#if checkoutStep === 'DONE'}
  <div class="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
    <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
      <CheckCircle2 size={40} class="text-green-500" />
    </div>
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Order Received!</h1>
    <p class="text-gray-500 mb-5 text-sm max-w-xs">Save your Tracking ID to follow your order in real-time.</p>
    <div class="mb-8 px-8 py-4 bg-gray-50 border border-gray-200 rounded-2xl">
      <p class="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 mb-1">Your Tracking ID</p>
      <p class="text-2xl sm:text-3xl font-black text-aura-green tracking-tight break-all">{completedTracking}</p>
    </div>
    <div class="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
      <a href={`/tracking/${completedTracking}`} class="flex-1 px-6 py-4 bg-aura-green text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-900 transition-all">
        Track My Order
      </a>
      <a href="/" class="flex-1 px-6 py-4 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-aura-green transition-all">
        Continue Shopping
      </a>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-[#faf6ee] pb-32 pt-24 font-sans text-[#1b1410]">
    <div class="max-w-6xl mx-auto px-4 sm:px-6">

      <div class="flex items-center justify-center gap-2 mb-16 relative">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-0.5 bg-gray-200 -z-10" />
        <div class="absolute top-1/2 left-[15%] -translate-y-1/2 h-0.5 bg-green-500 transition-all duration-700 -z-10 {checkoutStep === 'CART' ? 'w-0' : 'w-[35%]'}" />
        {@render stepNode(1, 'CART', true, checkoutStep !== 'CART')}
        {@render stepNode(2, 'DETAILS', checkoutStep === 'DETAILS', false)}
        {@render stepNode(3, 'DONE', false, false)}
      </div>

      <header class="flex items-center justify-center gap-4 mb-20">
        {#if checkoutStep === 'DETAILS'}
          <button onclick={() => checkoutStep = 'CART'} class="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white transition-all">
            <ArrowLeft size={18} />
          </button>
        {/if}
        <h1 class="text-4xl font-serif font-black italic tracking-tight">Checkout</h1>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

        <div class="lg:col-span-7 space-y-6">
          {#if checkoutStep === 'CART'}
            <div transition:fly={{ x: -20, duration: 300 }} class="bg-white rounded-[2rem] p-5 sm:p-8 shadow-sm border border-gray-100">
              <h2 class="text-lg font-bold mb-8 flex items-center gap-2">
                <ShoppingBag size={20} class="text-aura-green" /> Your Items
              </h2>
              {#if cartItems.length === 0}
                <div class="text-center py-20">
                  <p class="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Your bag is empty</p>
                  <a href="/" class="text-aura-green font-bold text-sm mt-4 inline-block underline">Shop Now</a>
                </div>
              {:else}
                <div class="space-y-6">
                  {#each cartItems as item (item.id)}
                    <div class="flex gap-3 sm:gap-6 items-center">
                      <img src={item.imageUrl} alt={item.name} class="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-gray-100 shrink-0" />
                      <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-sm truncate">{item.name}</h4>
                        <p class="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">৳{item.price}</p>
                      </div>
                      <div class="flex items-center gap-2 sm:gap-4 bg-gray-50 rounded-full px-3 sm:px-4 py-1 shrink-0">
                        <button onclick={() => updateQuantity(item.id, -1)} class="p-1 hover:text-aura-green transition-colors"><Minus size={14} /></button>
                        <span class="font-black tabular-nums text-xs">{item.quantity}</span>
                        <button onclick={() => updateQuantity(item.id, 1)} class="p-1 hover:text-aura-green transition-colors"><Plus size={14} /></button>
                      </div>
                      <button onclick={() => removeItem(item.id)} class="text-gray-300 hover:text-red-500 transition-colors shrink-0"><Trash2 size={18} /></button>
                    </div>
                  {/each}
                  <button onclick={() => checkoutStep = 'DETAILS'} class="w-full py-5 bg-aura-green text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-gray-900 transition-all mt-6">
                    Proceed to Details
                  </button>
                </div>
              {/if}
            </div>
          {:else}
            <div transition:fly={{ x: 20, duration: 500 }} class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
                  <input type="text" placeholder="Your Name" bind:value={formData.name} class="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm focus:border-aura-green outline-none transition-all shadow-sm" />
                </div>
                <div class="space-y-2">
                  <label class="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Phone Number</label>
                  <input type="tel" placeholder="Mobile Number" bind:value={formData.phone} class="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm focus:border-aura-green outline-none transition-all shadow-sm" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select bind:value={formData.district} onchange={() => formData.area = ''} class="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm appearance-none outline-none focus:border-aura-green shadow-sm transition-all focus:bg-[#f5f0e6]">
                  <option value="">Select District</option>
                  {#each Object.keys(BD_LOCATIONS).sort() as d}
                    <option value={d}>{d}</option>
                  {/each}
                </select>
                <select bind:value={formData.area} disabled={!formData.district} class="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm appearance-none outline-none focus:border-aura-green shadow-sm transition-all focus:bg-[#f5f0e6] disabled:bg-gray-50 disabled:text-gray-400">
                  <option value="">{formData.district ? 'Select Area/Upazila' : 'Select District First'}</option>
                  {#if formData.district}
                    {#each BD_LOCATIONS[formData.district] as a}
                      <option value={a}>{a}</option>
                    {/each}
                  {/if}
                </select>
              </div>

              <textarea placeholder="Full Address" bind:value={formData.address} class="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm h-32 resize-none outline-none focus:border-aura-green shadow-sm" />

              <input type="email" placeholder="Email (optional)" bind:value={formData.email} class="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm outline-none focus:border-aura-green shadow-sm" />

              <input type="text" placeholder="Order Note (optional)" bind:value={formData.note} class="w-full bg-white border border-gray-100 rounded-2xl px-6 py-8 text-sm outline-none focus:border-aura-green shadow-sm" />

              <label class="flex items-center gap-3 cursor-pointer group mt-4">
                <input type="checkbox" bind:checked={saveAddress} class="w-5 h-5 rounded-lg border-gray-200 accent-aura-green" />
                <span class="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Save delivery address for next time</span>
              </label>

              <div class="pt-10">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                  <Truck size={14} class="text-aura-green" /> Shipping Region
                </h3>
                <div class="p-6 bg-white border border-[#e2d9c9] rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <p class="text-xs font-bold text-gray-900">{formData.district === 'Dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
                    <p class="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                      {formData.district === 'Dhaka' ? '১-২ কার্যদিবস (Standard)' : '২-৩ কার্যদিবস (Standard)'}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs font-black text-aura-green">৳{shipping}</p>
                    <p class="text-[8px] text-gray-400 uppercase tracking-widest mt-1">Delivery Charge</p>
                  </div>
                </div>
              </div>

              <div class="mt-10">
                <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                  <Wallet size={14} class="text-aura-green" /> Payment Method
                </h3>
                <div class="grid grid-cols-3 gap-3">
                  {#each [['COD', 'Cash on Delivery'], ['BKASH', 'bKash'], ['NAGAD', 'Nagad']] as opt}
                    <button type="button" onclick={() => payMethod = opt[0]}
                      class="p-3 sm:p-4 rounded-2xl border text-center transition-all {payMethod === opt[0] ? 'border-aura-green bg-[#f5f0e6] ring-2 ring-aura-green/15' : 'border-gray-100 bg-white hover:border-gray-300'}">
                      <span class="text-[10px] sm:text-[11px] font-black text-gray-900 leading-tight block">{opt[1]}</span>
                    </button>
                  {/each}
                </div>
                {#if payMethod === 'COD'}
                  <p class="mt-4 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed">
                    ডেলিভারির সময় নগদ পরিশোধ করুন — কোনো অগ্রিম টাকা লাগবে না। <span class="text-gray-400">(Cash on Delivery)</span>
                  </p>
                {:else}
                  <div class="mt-4 space-y-3 bg-[#f5f0e6] border border-[#e2d9c9] rounded-xl p-4">
                    <p class="text-[11px] text-gray-700 leading-relaxed">
                      {payMethod === 'BKASH' ? 'bKash' : 'Nagad'} <b>Send Money</b> → <b class="text-aura-green">{PAY_NUMBER}</b> (৳{total.toLocaleString()}), তারপর নিচে <b>Transaction ID</b> লিখুন:
                    </p>
                    <input type="text" bind:value={payTxid} placeholder="Transaction ID (e.g. 9A7B6C5D)"
                      class="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-aura-green transition-all" />
                  </div>
                {/if}
              </div>

              {#if error}
                <p transition:scale class="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 animate-bounce">
                  {error}
                </p>
              {/if}

              <button onclick={handlePlaceOrder} disabled={placing} class="w-full py-6 bg-aura-ink text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-aura-green transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-60">
                <CheckCircle2 size={18} /> {placing ? 'PLACING ORDER…' : 'CONFIRM & PLACE ORDER'}
              </button>
            </div>
          {/if}
        </div>

        <div class="lg:col-span-5">
          <div class="bg-aura-ink text-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 sticky top-32 shadow-2xl overflow-hidden group">
            <div class="absolute top-0 right-0 p-32 bg-aura-gold/10 blur-[80px] rounded-full pointer-events-none" />
            <h3 class="text-xl font-bold flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
              <ShoppingCart size={22} class="text-aura-gold" /> Order Summary
            </h3>
            <div class="space-y-6 mb-10 max-h-[300px] overflow-y-auto scrollbar-hide">
              {#each cartItems as item (item.id)}
                <div class="flex gap-4 items-center">
                  <img src={item.imageUrl} alt={item.name} class="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div class="flex-1 min-w-0">
                    <h4 class="font-bold text-xs truncate">{item.name}</h4>
                    <p class="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                  </div>
                  <span class="font-black tabular-nums text-sm">৳{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              {/each}
            </div>
            <div class="space-y-4 py-8 border-t border-white/5">
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-500 font-bold uppercase tracking-widest">Subtotal</span>
                <span class="font-black tabular-nums">৳{subtotal.toLocaleString()}</span>
              </div>
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-500 font-bold uppercase tracking-widest">Shipping {formData.district === 'Dhaka' ? '(Inside Dhaka)' : ''}</span>
                <span class="font-black tabular-nums">৳{shipping}</span>
              </div>
            </div>
            <div class="mb-8 pt-6 border-t border-white/5">
              <div class="flex justify-between items-end mb-8">
                <span class="text-2xl font-serif font-black italic">Total</span>
                <span class="text-2xl font-black text-aura-gold tracking-tighter">৳{total.toLocaleString()}</span>
              </div>
              <div class="bg-aura-green text-white p-5 rounded-2xl flex items-center justify-between shadow-xl">
                <span class="text-[10px] font-black uppercase tracking-widest">{cartItems.length} ITEMS</span>
                <span class="text-lg font-black tabular-nums">৳{total.toLocaleString()}</span>
              </div>
            </div>
            <p class="text-[8px] text-center text-gray-600 font-black uppercase tracking-[0.2em]">SNEHALATA NEURAL COMMERCE v4.0 SECURED</p>
          </div>
        </div>

      </div>
    </div>
  </div>
{/if}
