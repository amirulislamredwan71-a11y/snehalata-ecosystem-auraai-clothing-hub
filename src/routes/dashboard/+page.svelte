<script lang="ts">
  import { browser } from '$app/environment';
  import { fade, scale } from 'svelte/transition';
  import { Zap, LayoutDashboard, Users, ShieldCheck, Cpu, Network, Package, Plus, Layout, Palette, Eye, Globe, BarChart3 } from '@lucide/svelte';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { analyzeWebsiteProducts } from '$lib/geminiService';
  import { getVendors, getProductsByVendor, syncWithNeuralGrid } from '$lib/mockData';
  import type { Vendor } from '$lib/types';

  const vendorToken = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('aura_vendor_token') || '' : '');

  let vendor: any = $state(null);
  let products: any[] = $state([]);
  let vendorOrders = $state<any[]>([]);
  let loading = $state(true);

  async function loadVendorOrders() {
    try {
      const res = await fetch('/api/vendor/orders', { headers: { Authorization: `Bearer ${vendorToken()}` } });
      const data = await res.json().catch(() => ({}));
      vendorOrders = res.ok ? data.items || [] : [];
    } catch {
      vendorOrders = [];
    }
  }

  async function handleItemStatus(itemId: number, status: string) {
    try {
      const res = await fetch(`/api/vendor/orders?id=${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken()}` },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await loadVendorOrders();
    } catch (err: any) {
      alert('Update failed: ' + (err?.message || 'error'));
    }
  }
  let showLogin = $state(false);
  let loginEmail = $state('');
  let loginPassword = $state('');
  let loginError: string | null = $state(null);
  let isLoggingIn = $state(false);
  let isAddingProduct = $state(false);
  let newProduct = $state({ name: '', price: '', category: 'General', description: '', imageUrl: '' });
  let isAnalysisMode = $state(false);
  let analysisProgress = $state(0);
  let detectedItems: any[] = $state([]);
  let externalUrlInput = $state('');
  let isStylizing = $state(false);
  let accentColor = $state('#7c3aed');
  let showPwModal = $state(false);
  let newPass = $state('');
  let pwMsg = $state<string | null>(null);
  let pwLoading = $state(false);
  let isSyncing = $state(false);

  async function handleSync() {
    isSyncing = true;
    try {
      const res = await fetch('/api/vendor/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${vendorToken()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      await syncWithNeuralGrid();
      loadVendorData();
      alert(`Website sync complete — ${data.imported || 0} new product(s) imported (${data.found ?? 0} detected on your site).`);
    } catch (err: any) {
      alert('Sync failed: ' + (err?.message || 'unknown error'));
    } finally {
      isSyncing = false;
    }
  }

  async function handleChangePassword() {
    if (!newPass || newPass.length < 6) { pwMsg = 'Password must be at least 6 characters'; return; }
    pwLoading = true; pwMsg = null;
    try {
      const res = await fetch('/api/vendor/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken()}` },
        body: JSON.stringify({ newPassword: newPass })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      pwMsg = 'Password updated successfully.';
      newPass = '';
      setTimeout(() => { showPwModal = false; pwMsg = null; }, 1200);
    } catch (err: any) {
      pwMsg = 'Failed: ' + (err?.message || 'unknown error');
    } finally {
      pwLoading = false;
    }
  }

  async function loadVendorData() {
    loading = true;
    const activeId = browser ? localStorage.getItem('aura_active_vendor_id') : null;
    const activeEmail = browser ? localStorage.getItem('aura_active_vendor_email') : null;
    const allVendors = getVendors();
    let currentVendor: any = null;
    if (activeId) currentVendor = allVendors.find((v: any) => String(v.id) === activeId);
    if (!currentVendor && activeEmail) currentVendor = allVendors.find((v: any) => v.email === activeEmail);
    if (currentVendor) {
      vendor = currentVendor;
      if (currentVendor.website_url) externalUrlInput = currentVendor.website_url;
      // Load THIS vendor's products (including pending-review) via the API.
      try {
        const res = await fetch('/api/vendor/products', { headers: { Authorization: `Bearer ${vendorToken()}` } });
        const data = await res.json().catch(() => ({}));
        products = res.ok
          ? (data.products || []).map((p: any) => ({ ...p, imageUrl: p.image_url, vendorId: p.vendor_id }))
          : getProductsByVendor(Number(currentVendor.id));
      } catch {
        products = getProductsByVendor(Number(currentVendor.id));
      }
      loadVendorOrders();
    }
    loading = false;
  }

  $effect(() => {
    if (browser) loadVendorData();
  });

  function handleLogout() {
    localStorage.removeItem('aura_active_vendor_id');
    localStorage.removeItem('aura_active_vendor_email');
    localStorage.removeItem('aura_vendor_token');
    window.location.reload();
  }

  async function syncWithNeuralProxy() {
    const urlToAnalyze = externalUrlInput || vendor?.website_url;
    if (!urlToAnalyze || !vendor) return;
    if (vendor.status !== 'APPROVED') {
      alert('Compliance Check Required: Your neural node is currently pending SNEHALATA CEO approval.');
      return;
    }
    isAnalysisMode = true;
    analysisProgress = 10;
    try {
      analysisProgress = 30;
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAnalyze })
      });
      if (!response.ok) throw new Error('Neural proxy failed.');
      const data = await response.json();
      analysisProgress = 60;
      const productsResult = await analyzeWebsiteProducts(data.content);
      analysisProgress = 90;
      detectedItems = productsResult || [];
      analysisProgress = 100;
    } catch (error: any) {
      console.error("Neural Sync Error:", error);
      alert(`Analysis failed: ${error.message}`);
      isAnalysisMode = false;
    }
  }

  async function vendorPost(body: any) {
    const res = await fetch('/api/vendor/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${vendorToken()}` },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  }

  async function handleImport() {
    if (!vendor || detectedItems.length === 0) return;
    try {
      for (const item of detectedItems) {
        await vendorPost({
          name: item.name,
          price: Number(item.price) || 0,
          category: 'Imported',
          description: item.description || `Verified item from ${vendor.store_name}.`,
          image_url: item.imageUrl || ''
        });
      }
      await syncWithNeuralGrid();
      loadVendorData();
      detectedItems = [];
      isAnalysisMode = false;
    } catch (err: any) {
      alert('Import failed: ' + (err?.message || 'unknown error'));
    }
  }

  async function handleAddManualProduct() {
    if (!vendor) return;
    try {
      await vendorPost({
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category,
        description: newProduct.description,
        image_url: newProduct.imageUrl || ''
      });
      await syncWithNeuralGrid();
      loadVendorData();
      isAddingProduct = false;
      newProduct = { name: '', price: '', category: 'General', description: '', imageUrl: '' };
    } catch (err: any) {
      alert('Add failed: ' + (err?.message || 'unknown error'));
    }
  }

  async function handleDelete(productId: number) {
    if (!confirm('Remove this neural asset from your catalog? This is permanent.')) return;
    try {
      const res = await fetch(`/api/vendor/products?id=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${vendorToken()}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      await syncWithNeuralGrid();
      loadVendorData();
    } catch (err: any) {
      alert('Delete failed: ' + (err?.message || 'unknown error'));
    }
  }

  async function handleLogin(e: Event) {
    e.preventDefault();
    isLoggingIn = true;
    loginError = null;
    try {
      const res = await fetch('/api/vendor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('aura_active_vendor_id', String(data.vendor.id));
      localStorage.setItem('aura_active_vendor_email', data.vendor.email || loginEmail);
      localStorage.setItem('aura_vendor_token', data.token);
      await syncWithNeuralGrid();
      loadVendorData();
      showLogin = false;
    } catch (err: any) {
      loginError = err?.message || 'Neural node authentication failed.';
    } finally {
      isLoggingIn = false;
    }
  }
</script>

{#if loading}
  <div class="min-h-screen bg-black flex items-center justify-center">
    <Zap class="text-aura-purple animate-pulse" size={40} />
  </div>
{:else if !vendor}
  <div class="min-h-screen bg-[#050505] text-white p-6 md:p-20 flex flex-col items-center justify-center relative overflow-hidden font-sans">
    <div class="absolute top-0 left-0 w-full h-full pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-aura-purple/5 blur-[120px] rounded-full animate-pulse" />
      <div class="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-900/5 blur-[120px] rounded-full animate-pulse" style="animation-delay: 1s" />
    </div>

    <div class="relative z-10 w-full max-w-xl" transition:fade={{ duration: 800 }}>
      <div class="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl relative group overflow-hidden">
        <div class="absolute inset-0 bg-aura-purple/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
        <LayoutDashboard size={40} class="text-aura-purple relative z-10" />
      </div>

      <div class="text-center mb-12">
        <h2 class="text-4xl sm:text-5xl font-serif font-black mb-6 italic tracking-tighter uppercase">
          Portal Entrance <br />
          <span class="text-aura-purple text-5xl sm:text-6xl">Locked</span>
        </h2>
        <p class="text-gray-400 leading-relaxed font-medium max-w-sm mx-auto">
          Authenticate your business identity to access the <span class="text-white">Aura Management Grid</span>. Manage products, analyze neural traffic, and scale your artisan brand.
        </p>
      </div>

      {#key showLogin}
        {#if !showLogin}
          <div transition:fade={{ duration: 300 }} class="flex flex-col gap-4">
            <button
              onclick={() => showLogin = true}
              class="w-full py-5 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_50px_rgba(124,58,237,0.3)] border border-white/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Sign In to Dashboard
            </button>
            <a href="/onboarding" class="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white hover:text-black transition-all flex items-center justify-center">
              Register New Business Node
            </a>
          </div>
        {:else}
          <div transition:fade={{ duration: 300 }} class="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl">
            <form onsubmit={handleLogin} class="space-y-6">
              {#if loginError}
                <div class="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                  <p class="text-[10px] text-red-400 font-black uppercase tracking-widest text-center">{loginError}</p>
                </div>
              {/if}
              <div class="space-y-2">
                <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Neural Email</label>
                <div class="relative group">
                  <div class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-purple transition-colors">
                    <Users size={18} />
                  </div>
                  <input
                    autofocus
                    type="email"
                    required
                    bind:value={loginEmail}
                    placeholder="enter your corporate email"
                    class="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-sm text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Access Key (Password)</label>
                <div class="relative group">
                  <div class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-purple transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    bind:value={loginPassword}
                    placeholder="vendor access key"
                    class="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-sm text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800"
                  />
                </div>
              </div>
              <div class="flex gap-4">
                <button
                  type="button"
                  onclick={() => showLogin = false}
                  class="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-black transition-all"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  class="flex-1 py-5 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoggingIn ? 'Verifying Node...' : 'Access Dashboard'}
                </button>
              </div>
            </form>
          </div>
        {/if}
      {/key}

      <div class="mt-16 flex items-center justify-center gap-10 grayscale opacity-20 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
        <ShieldCheck size={28} class="text-gray-400" />
        <div class="w-px h-6 bg-white/10" />
        <Cpu size={28} class="text-gray-400" />
        <div class="w-px h-6 bg-white/10" />
        <Network size={28} class="text-gray-400" />
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-[#050505] text-white selection:bg-aura-purple/30">
    {#if isAddingProduct}
      <div class="fixed inset-0 z-[120] flex items-center justify-center p-6" transition:fade={{ duration: 200 }}>
        <div class="absolute inset-0 bg-black/90 backdrop-blur-3xl" onclick={() => isAddingProduct = false} />
        <div class="relative bg-[#0A0A0A] border border-white/10 rounded-[3rem] w-full max-w-xl p-10 shadow-2xl overflow-hidden" transition:scale={{ duration: 300 }}>
          <div class="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Plus size={120} /></div>
          <h2 class="text-3xl font-serif font-black italic mb-8">Add Neural Asset</h2>
          <div class="space-y-6">
            <input type="text" placeholder="Item Name" bind:value={newProduct.name}
              class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all" />
            <div class="grid grid-cols-2 gap-4">
              <input type="number" placeholder="Price (৳)" bind:value={newProduct.price}
                class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all" />
              <select bind:value={newProduct.category}
                class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all appearance-none">
                <option value="General">Category</option>
                <option value="Saree">Saree</option>
                <option value="Panjabi">Panjabi</option>
                <option value="Modern">Modern</option>
              </select>
            </div>
            <textarea placeholder="Neural Description" bind:value={newProduct.description}
              class="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all resize-none" />
            <button onclick={handleAddManualProduct}
              class="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-aura-purple hover:text-white transition-all shadow-xl">
              Deploy to Catalog
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if showPwModal}
      <div class="fixed inset-0 z-[130] flex items-center justify-center p-6" transition:fade={{ duration: 200 }}>
        <div class="absolute inset-0 bg-black/90 backdrop-blur-3xl" onclick={() => showPwModal = false}></div>
        <div class="relative bg-[#0A0A0A] border border-white/10 rounded-[3rem] w-full max-w-md p-10 shadow-2xl" transition:scale={{ duration: 300 }}>
          <h2 class="text-3xl font-serif font-black italic mb-2">Change Password</h2>
          <p class="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-8">Set a new access key for your vendor node</p>
          <input type="password" bind:value={newPass} placeholder="New password (min 6 chars)"
            class="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all mb-4" />
          {#if pwMsg}
            <p class="text-[11px] font-bold mb-4 {pwMsg.startsWith('Password updated') ? 'text-green-400' : 'text-red-400'}">{pwMsg}</p>
          {/if}
          <div class="flex gap-3">
            <button onclick={() => showPwModal = false} class="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all cursor-pointer">Cancel</button>
            <button onclick={handleChangePassword} disabled={pwLoading} class="flex-[2] py-4 bg-aura-purple text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all disabled:opacity-50 cursor-pointer">
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <header class="bg-black/50 backdrop-blur-3xl border-b border-white/5 py-12 px-6">
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span
              class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors {vendor.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}"
            >
              {vendor.status === 'APPROVED' ? 'Aura Verified Node' : 'Audit Pending'}
            </span>
            {#if vendor.metadata?.vendor_type === 'SUBDOMAIN'}
              <span class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-aura-purple/10 text-aura-purple border border-aura-purple/20">
                Managed Sub-domain
              </span>
            {/if}
          </div>
          <h1 class="text-4xl sm:text-6xl font-serif font-black italic tracking-tighter mb-2 break-words">{vendor.store_name}</h1>
          <p class="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-4">
            {vendor.email} • Neural ID: {vendor.id}
            <button onclick={() => { showPwModal = true; pwMsg = null; }} class="text-aura-purple hover:underline cursor-pointer">Change Password</button>
            <button onclick={handleLogout} class="text-red-500 hover:underline cursor-pointer">Switch Account</button>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          {#if vendor.website_url}
            <button
              onclick={handleSync}
              disabled={isSyncing}
              title="Import products from your own website"
              class="group px-8 py-5 bg-white/5 border border-white/10 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:border-aura-purple transition-all disabled:opacity-50"
            >
              <Globe size={18} class={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing…' : 'Sync from Website'}</span>
            </button>
          {/if}
          <button
            onclick={() => isAddingProduct = true}
            class="group px-10 py-5 bg-aura-purple text-white rounded-3xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-white hover:text-black transition-all shadow-[0_20px_40px_rgba(124,58,237,0.2)]"
          >
            <Plus size={18} />
            <span class="relative">Add Neural Catalog Item</span>
          </button>
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-6 py-12">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div class="lg:col-span-8 space-y-12">
          <div>
            <div class="flex items-center justify-between mb-8 px-2">
              <div class="flex items-center gap-4">
                <BarChart3 class="text-aura-purple" size={28} />
                <h2 class="text-3xl font-serif font-black italic">Incoming Orders</h2>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-4 py-2 rounded-full border border-white/10">{vendorOrders.length} items</span>
            </div>
            {#if vendorOrders.length === 0}
              <div class="py-16 border-2 border-dashed border-white/5 rounded-[3rem] text-center text-gray-700 text-sm font-serif italic">No orders yet for your products.</div>
            {:else}
              <div class="space-y-4">
                {#each vendorOrders as it (it.id)}
                  <div class="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    {#if it.image_url}<img src={it.image_url} class="w-14 h-14 rounded-xl object-cover shrink-0" alt={it.name} />{/if}
                    <div class="flex-1 min-w-0">
                      <p class="text-white font-bold text-sm truncate">{it.name} <span class="text-gray-500">×{it.quantity}</span></p>
                      <p class="text-[10px] text-gray-500 truncate">ORD-{it.orders?.id} · {it.orders?.customer_name} · {it.orders?.customer_phone}</p>
                      <p class="text-[10px] text-gray-600 truncate">{it.orders?.district} — {it.orders?.address}</p>
                    </div>
                    <div class="text-right shrink-0">
                      <p class="text-green-400 font-black">৳{Number(it.vendor_payout).toLocaleString()}</p>
                      <p class="text-[8px] text-gray-500 uppercase tracking-widest">Your payout (−{it.commission_rate}%)</p>
                    </div>
                    <select value={it.item_status} onchange={(e) => handleItemStatus(it.id, e.currentTarget.value)}
                      class="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer shrink-0">
                      {#each ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as s}
                        <option value={s} class="bg-black">{s}</option>
                      {/each}
                    </select>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          {#if vendor.metadata?.vendor_type === 'SUBDOMAIN'}
            <div class="bg-gradient-to-br from-aura-purple/20 via-black to-black border border-white/5 rounded-[3rem] p-12 overflow-hidden relative group">
              <div class="absolute top-0 right-0 p-12 text-white/5 group-hover:text-white/10 transition-colors">
                <Layout size={180} />
              </div>
              <div class="relative z-10">
                <div class="flex items-center gap-4 mb-8">
                  <Zap class="text-aura-purple" size={32} />
                  <h2 class="text-4xl font-serif font-black italic">1-Click Store Generator</h2>
                </div>
                <p class="text-gray-400 text-sm leading-relaxed mb-10 max-w-xl font-medium">
                  Design your digital presence in the Aura Ecosystem. Customize colors, layout, and neural features to stand out in the global marketplace.
                </p>
                <div class="flex flex-wrap gap-4">
                  <button
                    onclick={() => isStylizing = true}
                    class="px-8 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <Palette size={16} /> Stylize Store
                  </button>
                  <button
                    onclick={() => window.open(`/store/${vendor.slug}`, '_blank')}
                    class="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <Eye size={16} /> Live Preview
                  </button>
                </div>
              </div>
            </div>
          {/if}

          {#if isStylizing}
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-6" transition:fade={{ duration: 200 }}>
              <div class="absolute inset-0 bg-black/90 backdrop-blur-3xl" onclick={() => isStylizing = false} />
              <div class="relative bg-[#0A0A0A] border border-white/10 rounded-[3rem] w-full max-w-2xl p-12 overflow-hidden shadow-2xl" transition:scale={{ duration: 300 }}>
                <h2 class="text-4xl font-serif font-black italic mb-8">Neural Identity Studio</h2>
                <div class="space-y-8">
                  <div class="space-y-4">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-500">Aura Accent Color</label>
                    <div class="flex gap-4">
                      {#each ['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'] as c}
                        <button
                          onclick={() => accentColor = c}
                          class="w-12 h-12 rounded-full border-4 transition-transform"
                          class:border-white={accentColor === c}
                          class:scale-110={accentColor === c}
                          class:border-transparent={accentColor !== c}
                          style="background-color: {c}"
                        />
                      {/each}
                    </div>
                  </div>
                  <div class="space-y-4">
                    <label class="text-[10px] font-black uppercase tracking-widest text-gray-500">Storefront Blueprint</label>
                    <div class="grid grid-cols-2 gap-4">
                      <div class="p-6 bg-white/5 border border-aura-purple rounded-2xl">
                        <p class="text-xs font-bold uppercase tracking-widest mb-1">Aura Brutalist</p>
                        <p class="text-[9px] text-gray-500">High contrast, sharp edges, bold typography.</p>
                      </div>
                      <div class="p-6 bg-white/5 border border-white/10 rounded-2xl opacity-40">
                        <p class="text-xs font-bold uppercase tracking-widest mb-1">Ethereal Soft</p>
                        <p class="text-[9px] text-gray-500">Soft shadows, glassmorphism, pastel accents.</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onclick={() => { isStylizing = false; alert('Store aesthetic updated in the Neural Grid.'); }}
                    class="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px]"
                  >
                    Apply Configuration
                  </button>
                </div>
              </div>
            </div>
          {/if}

          {#if vendor.metadata?.vendor_type === 'EXTERNAL_BRIDGE'}
            <div class="bg-white/5 border border-white/10 rounded-[3rem] p-12">
              <div class="flex items-center gap-4 mb-10">
                <Network class="text-aura-purple" size={32} />
                <h2 class="text-3xl font-serif font-black italic">Neural Website Bridge</h2>
              </div>
              <div class="flex flex-col md:flex-row gap-4 mb-8">
                <div class="flex-1 relative group">
                  <Globe class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none group-focus-within:text-aura-purple transition-colors" size={20} />
                  <input
                    type="text"
                    bind:value={externalUrlInput}
                    placeholder="https://yourbrand.com/shop"
                    class="w-full bg-black border border-white/10 rounded-3xl py-5 pl-16 pr-6 text-sm font-serif focus:outline-none focus:border-aura-purple/50 transition-all"
                  />
                </div>
                <button
                  onclick={syncWithNeuralProxy}
                  class="px-10 py-5 bg-white text-black rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-aura-purple hover:text-white transition-all shadow-xl"
                >
                  Initiate Scrape
                </button>
              </div>

              {#if isAnalysisMode}
                <div class="bg-black/50 border border-white/5 rounded-3xl p-10 text-center">
                  {#if detectedItems.length === 0}
                    <div class="py-12">
                      <div class="w-16 h-16 border-4 border-aura-purple border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                      <p class="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Neural Scraping in Progress... {analysisProgress}%</p>
                    </div>
                  {:else}
                    <div>
                      <div class="flex items-center justify-between mb-8">
                        <h3 class="text-xl font-serif font-bold italic">Artifacts Detected ({detectedItems.length})</h3>
                        <button onclick={handleImport} class="px-6 py-2 bg-green-500 text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-transform">Import Verified Items</button>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2">
                        {#each detectedItems as item, i}
                          <div class="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                            <span class="text-xs font-serif truncate pr-4">{item.name}</span>
                            <span class="text-[10px] font-bold text-green-500 whitespace-nowrap">৳{item.price}</span>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}

          <div>
            <div class="flex items-center justify-between mb-10 px-4">
              <div class="flex items-center gap-4">
                <Package class="text-aura-purple" size={32} />
                <h2 class="text-3xl font-serif font-black italic">Active Catalog</h2>
              </div>
              <div class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                {products.length} Neural Entries
              </div>
            </div>

            <div class="grid grid-cols-2 lg:grid-cols-3 gap-8">
              {#if products.length > 0}
                {#each products as p (p.id)}
                  <div class="relative group/card">
                    <button
                      onclick={() => handleDelete(p.id)}
                      class="absolute -top-2 -right-2 z-20 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-600 shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    {#if p.is_active === false}
                      <span class="absolute top-2 left-2 z-20 px-2.5 py-1 bg-amber-500 text-black rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">Pending Review</span>
                    {/if}
                    <ProductCard product={p} />
                  </div>
                {/each}
              {:else}
                <div class="col-span-full py-40 border-4 border-dashed border-white/5 rounded-[4rem] text-center flex flex-col items-center">
                  <Package size={64} class="text-gray-800 mb-6" />
                  <h3 class="text-2xl font-serif italic text-gray-600">Your Neural Vault is Empty</h3>
                  <p class="text-gray-700 text-sm mt-2 max-w-xs mx-auto">Populate your digital presence by importing artifacts or adding manual entries.</p>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <aside class="lg:col-span-4 space-y-8">
          <div class="bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-10">
            <h3 class="text-xl font-serif font-black italic mb-8 flex items-center gap-3">
              <BarChart3 size={24} class="text-aura-purple" />
              Neural Insights
            </h3>
            <div class="space-y-6">
              <div class="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:border-white/10 transition-colors group">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Total Sales</p>
                  <p class="text-xl font-serif font-bold group-hover:text-aura-purple transition-colors">৳15,500</p>
                </div>
                <div class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-green-500/10 text-green-500">+12%</div>
              </div>
              <div class="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:border-white/10 transition-colors group">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Impression Index</p>
                  <p class="text-xl font-serif font-bold group-hover:text-aura-purple transition-colors">1.2k</p>
                </div>
                <div class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-green-500/10 text-green-500">+4%</div>
              </div>
              <div class="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:border-white/10 transition-colors group">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Neural Ranking</p>
                  <p class="text-xl font-serif font-bold group-hover:text-aura-purple transition-colors">#12</p>
                </div>
                <div class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/10 text-red-500">-2</div>
              </div>
              <div class="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:border-white/10 transition-colors group">
                <div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">Try-On Pulse</p>
                  <p class="text-xl font-serif font-bold group-hover:text-aura-purple transition-colors">482</p>
                </div>
                <div class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-green-500/10 text-green-500">+24%</div>
              </div>
            </div>
          </div>

          <div class="bg-aura-purple/10 border border-aura-purple/20 rounded-[3rem] p-10 overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-aura-purple/10 blur-[60px]" />
            <h3 class="text-xl font-serif font-black italic mb-6 relative z-10">Performance Pulse</h3>
            <div class="h-40 flex items-end gap-2 relative z-10">
              {#each [40, 70, 45, 90, 65, 80, 100] as h, i}
                <div class="flex-1 bg-aura-purple rounded-t-lg transition-all duration-1000" style="height: {h}%"></div>
              {/each}
            </div>
            <div class="mt-6 flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
              <span>Mon</span><span>Sun</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
{/if}
