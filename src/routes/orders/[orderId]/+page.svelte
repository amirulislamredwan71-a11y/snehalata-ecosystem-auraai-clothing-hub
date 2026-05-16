<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fade, scale } from 'svelte/transition';
  import { ArrowRight, ChevronLeft, ShoppingBag, MapPin, ShieldCheck, Calendar, Navigation2, FileText, X, CheckCircle2, Search, Truck, Clock } from '@lucide/svelte';
  import { getOrders, getOrderById } from '$lib/mockData';
  import Logo from '$lib/components/Logo.svelte';
  import type { Order, OrderStatus } from '$lib/types';

  let orders = $state<Order[]>([]);
  let selectedOrder: Order | null = $state(null);
  let showReceipt = $state(false);

  $effect(() => {
    orders = getOrders();
    const orderId = $page.params.orderId;
    selectedOrder = orders.find(o => o.id === orderId) || null;

    const handler = () => {
      orders = getOrders();
      if (orderId) selectedOrder = orders.find(o => o.id === orderId) || null;
    };
    window.addEventListener('orderUpdated', handler);
    window.addEventListener('cartUpdated', handler);
    return () => {
      window.removeEventListener('orderUpdated', handler);
      window.removeEventListener('cartUpdated', handler);
    };
  });

  function getStatusColor(status: OrderStatus) {
    switch (status) {
      case 'DELIVERED': return 'text-green-400 border-green-400/20 bg-green-400/10';
      case 'SHIPPED': return 'text-aura-purple border-aura-purple/20 bg-aura-purple/10';
      case 'QUALITY_CHECK': return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
      case 'PLACED': return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
      default: return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
    }
  }

  function getStatusIcon(status: OrderStatus) {
    switch (status) {
      case 'DELIVERED': return CheckCircle2;
      case 'SHIPPED': return Truck;
      case 'QUALITY_CHECK': return Search;
      default: return Clock;
    }
  }
</script>

{#if !selectedOrder}
  <div class="min-h-screen bg-aura-black pb-20 pt-16 px-6 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-serif text-gray-500 mb-4">Order not found</h1>
      <a href="/orders" class="text-aura-purple hover:underline">Back to orders</a>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-aura-black pb-20 pt-10 px-6" transition:fade={{ duration: 500 }}>
    <div class="max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-12">
        <a href="/orders" class="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group">
          <ChevronLeft size={16} class="group-hover:-translate-x-1 transition-transform" /> Back to Log
        </a>
        <button onclick={() => showReceipt = true}
          class="flex items-center gap-2 bg-aura-purple/10 border border-aura-purple/20 text-aura-purple px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-aura-purple hover:text-white transition-all cursor-pointer">
          <FileText size={14} /> View Hub Receipt
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div class="lg:col-span-8 space-y-12">
          <div class="bg-aura-glass border border-aura-glassBorder rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
            <div class="absolute top-0 right-0 w-80 h-80 bg-aura-purple/5 blur-[120px] rounded-full"></div>
            <div class="relative z-10 flex flex-col md:flex-row justify-between gap-10">
              <div class="space-y-4">
                <div class="flex items-center gap-2 px-4 py-1.5 rounded-full border w-fit text-[10px] font-black uppercase tracking-widest {getStatusColor(selectedOrder.currentStatus)}">
                  <svelte:component this={getStatusIcon(selectedOrder.currentStatus)} size={14} />
                  {selectedOrder.currentStatus.replace('_', ' ')}
                </div>
                <h1 class="text-5xl font-serif font-black text-white leading-tight">Order Insight <span class="text-aura-purple">#{selectedOrder.id.split('-')[1]}</span></h1>
                <p class="text-gray-500 text-sm max-w-sm">Synchronized with Aura Neural Hub. Security verified for artisan-to-customer direct transfer.</p>
              </div>
              <div class="bg-white/5 border border-white/10 p-6 rounded-[2rem] h-fit text-center min-w-[160px]">
                <div class="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Final Amount</div>
                <div class="text-3xl font-black text-white">৳{selectedOrder.totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div class="bg-aura-glass border border-aura-glassBorder rounded-[3rem] p-10 shadow-2xl">
            <h3 class="text-xl font-serif font-bold text-white mb-12 flex items-center gap-3"><Navigation2 class="text-aura-purple" /> Node Propagation Timeline</h3>
            <div class="relative pl-12 space-y-12">
              <div class="absolute left-[23px] top-4 bottom-4 w-0.5 bg-white/5" />
              {#each selectedOrder.timeline as step, idx}
                <div class="relative flex gap-10 transition-all duration-700 {step.completed ? 'opacity-100' : 'opacity-20'}">
                  <div class="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 z-10 {step.completed ? 'bg-aura-purple border-aura-purple text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'bg-black border-white/5 text-gray-700'}">
                    {#if step.completed}
                      <CheckCircle2 size={20} />
                    {:else}
                      <div class="w-2 h-2 rounded-full bg-current" />
                    {/if}
                  </div>
                  <div class="flex-1">
                    <div class="flex justify-between items-start mb-1">
                      <h4 class="text-lg font-bold text-white">{step.label}</h4>
                      <span class="text-[10px] font-mono text-gray-500">{step.timestamp}</span>
                    </div>
                    <p class="text-sm text-gray-500 leading-relaxed font-light">{step.description}</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="lg:col-span-4 space-y-8">
          <div class="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 shadow-2xl">
            <h4 class="text-[10px] font-black uppercase tracking-[0.3em] text-aura-purple mb-8">Manifest Details</h4>
            <div class="space-y-4">
              {#each selectedOrder.items as item, idx}
                <div key={idx} class="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-aura-purple/30 transition-all">
                  <div class="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                    <img src={item.imageUrl} class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.name} />
                  </div>
                  <div class="flex-1 min-w-0">
                    <h5 class="text-xs font-bold text-white truncate">{item.name}</h5>
                    <p class="text-[8px] text-gray-600 font-black uppercase tracking-widest">{item.category}</p>
                  </div>
                  <div class="text-sm font-black text-white">৳{item.price.toLocaleString()}</div>
                </div>
              {/each}
            </div>
          </div>

          <div class="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8">
            <div class="space-y-6">
              <div class="flex gap-4">
                <div class="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 h-fit"><MapPin size={16} /></div>
                <div>
                  <div class="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Delivery Target</div>
                  <div class="text-xs font-bold text-white">Uttara, Sector 4, Dhaka</div>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 h-fit"><ShieldCheck size={16} /></div>
                <div>
                  <div class="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Security Hash</div>
                  <div class="text-xs font-bold text-white">SHA-256 Verified</div>
                </div>
              </div>
              <div class="flex gap-4">
                <div class="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 h-fit"><Calendar size={16} /></div>
                <div>
                  <div class="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">Est. Arrival</div>
                  <div class="text-xs font-bold text-white">{selectedOrder.estimatedDelivery}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {#if showReceipt}
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl" transition:fade>
        <div class="relative w-full max-w-2xl">
          <button onclick={() => showReceipt = false}
            class="absolute -top-12 right-0 p-3 bg-white/5 hover:bg-red-500 text-white rounded-2xl transition-all cursor-pointer">
            <X size={24} />
          </button>
          <div class="bg-aura-black text-white p-8 md:p-12 rounded-[3rem] border border-aura-glassBorder relative overflow-hidden shadow-2xl w-full mx-auto" transition:scale>
            <div class="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] pointer-events-none" />
            <div class="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/5 blur-[100px] pointer-events-none" />

            <div class="relative z-10 space-y-10">
              <header class="flex justify-between items-start">
                <div class="space-y-4">
                  <Logo />
                  <div class="bg-aura-purple/10 border border-aura-purple/20 px-3 py-1 rounded-full w-fit">
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-aura-purple">Official Neural Receipt</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Receipt Number</div>
                  <div class="text-sm font-mono font-bold text-white">#RC-{selectedOrder.id.split('-')[1]}-{selectedOrder.id.slice(-4)}</div>
                </div>
              </header>

              <div class="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
                <div class="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 class="text-lg font-bold text-white leading-tight">Payment Confirmed</h3>
                  <p class="text-xs text-gray-500 uppercase tracking-widest font-bold">Transaction Synced with Aura Node</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-8">
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-widest"><ShoppingBag size={14} /> Customer</div>
                  <div class="text-xs font-bold text-white leading-relaxed truncate">{selectedOrder.customerName}</div>
                </div>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-widest"><Calendar size={14} /> Order Date</div>
                  <div class="text-xs font-bold text-white leading-relaxed truncate">{selectedOrder.timeline[0]?.timestamp || '-'}</div>
                </div>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-widest"><MapPin size={14} /> Shipping To</div>
                  <div class="text-xs font-bold text-white leading-relaxed truncate">Uttara, Dhaka</div>
                </div>
                <div class="space-y-1.5">
                  <div class="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-widest"><Navigation2 size={14} /> Method</div>
                  <div class="text-xs font-bold text-white leading-relaxed truncate">Direct Gateway</div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="flex justify-between items-center px-2">
                  <h4 class="text-[10px] font-black uppercase tracking-widest text-gray-600">Items Manifest</h4>
                  <div class="h-px flex-1 bg-white/5 mx-4" />
                </div>
                <div class="space-y-3">
                  {#each selectedOrder.items as item, idx}
                    <div key={idx} class="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                      <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                          <img src={item.imageUrl} class="w-full h-full object-cover grayscale opacity-60" alt={item.name} />
                        </div>
                        <div>
                          <h5 class="text-xs font-bold text-white">{item.name}</h5>
                          <p class="text-[9px] text-gray-600 font-black uppercase tracking-widest">{item.category}</p>
                        </div>
                      </div>
                      <div class="text-sm font-black text-white">৳{item.price.toLocaleString()}</div>
                    </div>
                  {/each}
                </div>
              </div>

              <div class="pt-6 border-t border-white/5 space-y-3">
                <div class="flex justify-between text-xs text-gray-500">
                  <span>Ecosystem Fee (0%)</span>
                  <span>৳0</span>
                </div>
                <div class="flex justify-between text-xs text-gray-500">
                  <span>Logistic Allocation</span>
                  <span>৳120</span>
                </div>
                <div class="flex justify-between items-end pt-4">
                  <div>
                    <div class="text-[10px] text-aura-purple font-black uppercase tracking-widest mb-1">Grand Total</div>
                    <div class="text-4xl font-black text-white">৳{(selectedOrder.totalAmount + 120).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div class="pt-10 flex items-center justify-between gap-6 border-t border-white/5">
                <div class="flex items-center gap-3">
                  <ShieldCheck class="text-aura-purple" size={20} />
                  <span class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Aura Authenticity Guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
