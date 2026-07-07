<script lang="ts">
  import { goto } from '$app/navigation';
  import { Search, Navigation2 } from '@lucide/svelte';

  let searchInput = $state('');

  function handleSearch(e: Event) {
    e.preventDefault();
    if (searchInput.trim()) {
      goto(`/tracking/${searchInput}`);
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
        <h1 class="text-5xl font-serif font-black text-white">Neural Hub <span class="text-aura-green">Tracking</span></h1>
      </div>

      <div class="w-full md:w-96">
        <form onsubmit={handleSearch} class="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-aura-green transition-all p-1">
          <Search class="ml-4 text-gray-600" size={18} />
          <input type="text" bind:value={searchInput} placeholder="TRACK ID: ORD-5001" class="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-700 font-mono text-sm" />
          <button type="submit" class="bg-white text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-aura-green hover:text-white transition-all">Locate</button>
        </form>
      </div>
    </div>

    <div class="text-center py-32">
      <div class="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/10">
        <Search size={32} class="text-gray-700" />
      </div>
      <h2 class="text-2xl font-serif font-bold text-white mb-3">Enter an Order ID to Track</h2>
      <p class="text-gray-500 text-sm max-w-md mx-auto">Enter your tracking number above to get real-time updates from the Aura Neural Logistics Grid.</p>
    </div>
  </div>
</div>
