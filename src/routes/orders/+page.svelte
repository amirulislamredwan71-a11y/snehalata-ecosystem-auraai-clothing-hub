<script lang="ts">
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { History, ArrowRight, ShoppingBag, Clock, CheckCircle2, Truck, Search } from '@lucide/svelte';
  import { getOrders } from '$lib/mockData';
  import type { Order, OrderStatus } from '$lib/types';

  let orders = $state<Order[]>([]);

  $effect(() => {
    if (browser) {
      orders = getOrders();

      const handler = () => { orders = getOrders(); };
      window.addEventListener('orderUpdated', handler);
      window.addEventListener('cartUpdated', handler);
      return () => {
        window.removeEventListener('orderUpdated', handler);
        window.removeEventListener('cartUpdated', handler);
      };
    }
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

<div class="min-h-screen bg-aura-black pb-20 pt-16 px-6">
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center gap-4 mb-16">
      <div class="p-4 bg-aura-purple/10 border border-aura-purple/20 rounded-[2rem]">
        <History class="text-aura-purple" size={36} />
      </div>
      <div>
        <h1 class="text-4xl font-serif font-black text-white">Hub History</h1>
        <p class="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold mt-2">Neural Access • Synced 2m ago</p>
      </div>
    </div>

    {#if orders.length === 0}
      <div class="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
        <ShoppingBag size={48} class="text-gray-600 mx-auto mb-4" />
        <h3 class="text-xl font-bold text-gray-400 mb-2">No Active Orders</h3>
        <p class="text-xs text-gray-600 mb-8">Start your journey in the Snehalata ecosystem.</p>
        <a href="/" class="text-aura-purple uppercase tracking-widest font-black text-[10px] hover:underline">Browse Catalog</a>
      </div>
    {:else}
      <div class="space-y-6">
        {#each orders as order (order.id)}
          <div onclick={() => goto(`/orders/${order.id}`)}
            class="group bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 hover:border-aura-purple/50 transition-all duration-500 cursor-pointer shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-48 h-48 bg-aura-purple/5 blur-[80px] rounded-full pointer-events-none" />
            <div class="flex flex-col md:flex-row justify-between gap-8 relative z-10">
              <div class="flex gap-4">
                <div class="flex -space-x-6">
                  {#each order.items.slice(0, 3) as it, i}
                    <div key={i} class="w-16 h-16 rounded-2xl border-4 border-aura-black overflow-hidden shadow-2xl">
                      <img src={it.imageUrl} class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={it.name} />
                    </div>
                  {/each}
                </div>
                <div class="flex flex-col justify-center ml-2">
                  <h4 class="text-xl font-bold text-white mb-1">{order.items.length} Artisan Items</h4>
                  <p class="text-[10px] text-gray-500 uppercase tracking-widest font-black">Tracking ID: {order.id}</p>
                </div>
              </div>
              <div class="flex items-center gap-10">
                <div class="text-right">
                  <div class="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest mb-2 {getStatusColor(order.currentStatus)}">
                    <svelte:component this={getStatusIcon(order.currentStatus)} size={14} />
                    {order.currentStatus.replace('_', ' ')}
                  </div>
                  <div class="text-2xl font-black text-white">৳{order.totalAmount.toLocaleString()}</div>
                </div>
                <div class="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-500 group-hover:bg-aura-purple group-hover:text-white transition-all">
                  <ArrowRight size={20} />
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
