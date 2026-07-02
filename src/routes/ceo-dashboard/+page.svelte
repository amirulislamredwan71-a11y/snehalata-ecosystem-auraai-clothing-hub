<script lang="ts">
  import { browser } from '$app/environment';
  import { fade, slide, scale } from 'svelte/transition';
  import { TrendingUp, Users, ShoppingCart, Activity, Globe, Zap, ShieldCheck, ShieldAlert, Shield, Trash2, CheckCircle, XCircle, Plus, Search, Filter, RefreshCw, Package, Tag, Building2, BarChart3, CreditCard, Upload, Loader2, Image as ImageIcon, Network, KeyRound, ChevronDown } from '@lucide/svelte';
  import { getEcosystemStats, getVendors, getProducts, getOrders, getCategories, addProduct, deleteProduct, deleteVendor, deleteCategory, getOrderById, getLiveSales, syncWithNeuralGrid } from '$lib/mockData';

  const adminPass = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('aura_admin_pass') || '' : '');
  import type { EcosystemStats, Vendor, Product, Category } from '$lib/types';
  import { BD_LOCATIONS } from '$lib/locationData';

  type Tab = 'OVERVIEW' | 'VENDORS' | 'PRODUCTS' | 'REVIEW' | 'ORDERS' | 'CATEGORIES' | 'TRACKING';

  let isAuthenticated = $state(false);
  let stats = $state<EcosystemStats | null>(null);
  let activeTab = $state<Tab>('OVERVIEW');
  let vendors = $state<Vendor[]>([]);
  let products = $state<Product[]>([]);
  let orders = $state<any[]>([]);
  let categories = $state<Category[]>([]);
  let isLoading = $state(false);
  let liveStats = $state<EcosystemStats | null>(null);
  let searchTerm = $state('');
  let isProductModalOpen = $state(false);
  let isCategoryModalOpen = $state(false);
  let trackingOrderId = $state('');
  let trackedOrder = $state<any>(null);
  let isTrackingLoading = $state(false);
  let isUploadingImage = $state(false);
  let newProduct = $state({ name: '', price: '', category: '', description: '', imageUrl: '' });
  let newCategory = $state({ name: '', description: '' });
  let vendorCred = $state<{ email: string; password: string; store: string } | null>(null);
  let pendingProducts = $state<any[]>([]);
  let dbOrders = $state<any[]>([]);
  let expandedOrder = $state<number | null>(null);

  async function loadOrders() {
    try {
      const res = await fetch('/api/admin/orders', { headers: { 'x-admin-pass': adminPass() } });
      const data = await res.json().catch(() => ({}));
      dbOrders = res.ok ? data.orders || [] : [];
    } catch {
      dbOrders = [];
    }
  }

  async function handleOrderStatus(id: number, status: string) {
    try {
      const res = await fetch(`/api/admin/orders?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pass': adminPass() },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await loadOrders();
    } catch (err: any) {
      alert('Order update failed: ' + (err?.message || 'error'));
    }
  }

  async function loadPending() {
    try {
      const res = await fetch('/api/admin/products?pending=1', { headers: { 'x-admin-pass': adminPass() } });
      const data = await res.json().catch(() => ({}));
      pendingProducts = res.ok ? data.products || [] : [];
    } catch {
      pendingProducts = [];
    }
  }

  async function handleApproveProduct(id: string | number) {
    isLoading = true;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pass': adminPass() },
        body: JSON.stringify({ is_active: true })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await loadPending();
      await syncWithNeuralGrid();
      loadData();
    } catch (err: any) {
      alert('Approve failed: ' + (err?.message || 'error'));
    } finally {
      isLoading = false;
    }
  }

  async function handleRejectProduct(id: string | number) {
    if (!confirm('Reject and delete this imported product?')) return;
    isLoading = true;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE', headers: { 'x-admin-pass': adminPass() } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await loadPending();
    } catch (err: any) {
      alert('Reject failed: ' + (err?.message || 'error'));
    } finally {
      isLoading = false;
    }
  }

  async function handleResetVendorPassword(id: string | number) {
    if (!confirm('Generate a brand-new password for this vendor? Their old password stops working.')) return;
    isLoading = true;
    try {
      const res = await fetch(`/api/admin/vendors?id=${id}`, { method: 'POST', headers: { 'x-admin-pass': adminPass() } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      vendorCred = { email: data.email, password: data.password, store: data.store_name };
    } catch (err: any) {
      alert('Password reset failed: ' + (err?.message || 'unknown error'));
    } finally {
      isLoading = false;
    }
  }

  function loadData() {
    isLoading = true;
    const freshStats = getEcosystemStats();
    stats = freshStats;
    liveStats = freshStats;
    vendors = getVendors();
    products = getProducts();
    orders = getOrders();
    categories = getCategories();
    loadPending();
    loadOrders();
    isLoading = false;
  }

  $effect(() => {
    if (!browser) return;
    const token = localStorage.getItem('aura_admin_token');
    if (!token) {
      window.location.hash = '/admin-login';
    } else {
      isAuthenticated = true;
      loadData();
    }
  });

  let hasLiveStats = $derived(!!liveStats);
  $effect(() => {
    if (!hasLiveStats) return;
    const interval = setInterval(() => {
      liveStats = (prev => {
        if (!prev) return prev;
        return {
          ...prev,
          totalVendors: prev.totalVendors + (Math.random() > 0.98 ? 1 : 0),
          activeProducts: prev.activeProducts + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0),
          monthlyVolume: prev.monthlyVolume + (Math.random() > 0.7 ? Math.floor(Math.random() * 50) : 0),
          aiInteractions: prev.aiInteractions + Math.floor(Math.random() * 3),
          trendForecast: prev.trendForecast.map(item => ({
            ...item,
            growth: Number((item.growth + (Math.random() > 0.5 ? 0.05 : -0.05)).toFixed(2))
          }))
        };
      })(liveStats!);
    }, 2000);
    return () => clearInterval(interval);
  });

  const tabBtnBase = "flex items-center gap-2.5 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer relative z-10 whitespace-nowrap active:scale-95 group border";
  const tabBtnActive = "bg-aura-purple text-white shadow-[0_15px_40px_rgba(124,58,237,0.4)] border-white/20";
  const tabBtnInactive = "bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10";
  function tabBtnClass(tab: string) {
    return tabBtnBase + " " + (activeTab === tab ? tabBtnActive : tabBtnInactive);
  }

  async function handleUpdateVendorStatus(id: string | number, status: string) {
    isLoading = true;
    try {
      const res = await fetch(`/api/admin/vendors?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-pass': adminPass() },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await syncWithNeuralGrid();
      loadData();
    } catch (err: any) {
      alert('Vendor update failed: ' + (err?.message || 'unknown error'));
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteVendor(id: string | number) {
    if (!confirm('Permanently remove this vendor AND all their products?')) return;
    isLoading = true;
    try {
      const res = await fetch(`/api/admin/vendors?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pass': adminPass() }
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await syncWithNeuralGrid();
      loadData();
    } catch (err: any) {
      alert('Vendor delete failed: ' + (err?.message || 'unknown error'));
    } finally {
      isLoading = false;
    }
  }

  async function handleDeleteProduct(id: string | number) {
    if (!confirm('Delete this product from the Neural Grid? This is permanent.')) return;
    isLoading = true;
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pass': adminPass() }
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await syncWithNeuralGrid();
      loadData();
    } catch (err: any) {
      alert('Delete failed: ' + (err?.message || 'unknown error'));
    } finally {
      isLoading = false;
    }
  }

  async function handleAddProduct(e: Event) {
    e.preventDefault();
    isLoading = true;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-pass': adminPass() },
        body: JSON.stringify({
          name: newProduct.name,
          price: Number(newProduct.price),
          category: newProduct.category,
          description: newProduct.description,
          image_url: newProduct.imageUrl || ''
        })
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`);
      await syncWithNeuralGrid();
      loadData();
      isProductModalOpen = false;
      newProduct = { name: '', price: '', category: '', description: '', imageUrl: '' };
    } catch (err: any) {
      alert('Add failed: ' + (err?.message || 'unknown error'));
    } finally {
      isLoading = false;
    }
  }

  function handleImageUpload(file: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }
    isUploadingImage = true;
    const reader = new FileReader();
    reader.onload = () => {
      newProduct = { ...newProduct, imageUrl: reader.result as string };
      isUploadingImage = false;
    };
    reader.onerror = () => {
      isUploadingImage = false;
      alert('Failed to read file.');
    };
    reader.readAsDataURL(file);
  }

  function handleAddCategory(e: Event) {
    e.preventDefault();
    isLoading = true;
    const dbCategories = JSON.parse(localStorage.getItem('aura_categories') || '[]');
    const newCat: Category = {
      id: Date.now(),
      name: newCategory.name,
      slug: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      description: newCategory.description
    };
    dbCategories.push(newCat);
    localStorage.setItem('aura_categories', JSON.stringify(dbCategories));
    window.dispatchEvent(new Event('categoryUpdated'));
    categories = getCategories();
    isCategoryModalOpen = false;
    newCategory = { name: '', description: '' };
    isLoading = false;
  }

  function handleDeleteCategory(id: string | number) {
    if (confirm('Delete this category?')) {
      deleteCategory(id);
      categories = getCategories();
    }
  }

  function handleSearchOrder(id: string) {
    isTrackingLoading = true;
    setTimeout(() => {
      const found = getOrderById(id);
      trackedOrder = found || null;
      isTrackingLoading = false;
    }, 800);
  }

  function handleOverridePhase(phase: string) {
    if (!trackedOrder) return;
    const updated = {
      ...trackedOrder,
      currentStatus: phase,
      timeline: trackedOrder.timeline.map((t: any) =>
        t.status === phase || (phase === 'DELIVERED' && t.status !== 'PLACED')
          ? { ...t, completed: true, timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
          : t
      )
    };
    trackedOrder = updated;
    const allOrders = getOrders();
    const idx = allOrders.findIndex(o => o.id === trackedOrder.id);
    if (idx !== -1) {
      allOrders[idx] = updated;
      localStorage.setItem('aura_orders', JSON.stringify(allOrders));
    }
  }

  let filteredVendors = $derived(vendors.filter(v => v?.store_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false));
  let pendingCount = $derived(vendors.filter((v: any) => String(v.status).toLowerCase() === 'pending').length);
  let filteredProducts = $derived(products.filter(p => p?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false));
</script>

{#if !isAuthenticated || !stats}
  <div class="min-h-screen bg-black flex items-center justify-center text-aura-purple animate-pulse font-mono tracking-widest uppercase">Initializing Command Center...</div>
{:else}
  <div class="min-h-screen bg-black text-white pb-20">
    <header class="bg-[#050505] border-b border-white/10 sticky top-20 z-40">
      <div class="max-w-7xl mx-auto px-6 py-6 border-x border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <h1 class="text-3xl font-serif font-black text-white tracking-tight">CEO COMMAND CENTER</h1>
              <div class="px-2 py-0.5 bg-aura-purple/20 border border-aura-purple/30 rounded text-[8px] font-black uppercase tracking-widest text-aura-purple">Root Access</div>
            </div>
            <p class="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold">Snehalata Ecosystem Infrastructure</p>
          </div>
          <div class="flex items-center gap-4">
            <button
              onclick={loadData}
              class="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all {isLoading ? 'animate-spin' : ''}"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onclick={() => {
                localStorage.removeItem('aura_admin_token');
                window.location.hash = '/admin-login';
              }}
              class="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
              title="Sign Out"
            >
              <XCircle size={18} />
            </button>
            <div class="flex items-center gap-2 px-4 py-2.5 bg-green-500/5 border border-green-500/20 rounded-xl">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              <span class="text-[10px] font-mono text-green-400 uppercase tracking-widest">Aura Core: Live</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 md:gap-4 mt-8 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
          <button onclick={() => activeTab = 'OVERVIEW'}
            class="flex items-center gap-2.5 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer relative z-10 whitespace-nowrap active:scale-95 group border {activeTab === 'OVERVIEW' ? 'bg-aura-purple text-white shadow-[0_15px_40px_rgba(124,58,237,0.4)] border-white/20' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'}"
          >
            <span class="{activeTab === 'OVERVIEW' ? 'text-white' : 'text-gray-600'} group-hover:text-aura-purple transition-colors"><BarChart3 size={14} /></span>
            <span>Overview</span>
          </button>
          <button onclick={() => activeTab = 'VENDORS'}
            class="flex items-center gap-2.5 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer relative z-10 whitespace-nowrap active:scale-95 group border {activeTab === 'VENDORS' ? 'bg-aura-purple text-white shadow-[0_15px_40px_rgba(124,58,237,0.4)] border-white/20' : 'bg-white/5 text-gray-400 border-white/5 hover:text-white hover:bg-white/10'}"
          >
            <span class="{activeTab === 'VENDORS' ? 'text-white' : 'text-gray-600'} group-hover:text-aura-purple transition-colors"><Building2 size={14} /></span>
            <span>Vendors</span>
            {#if pendingCount > 0}
              <span class="ml-1 px-2 py-0.5 bg-amber-500 text-black rounded-full text-[9px] font-black animate-pulse" title="{pendingCount} pending approval">{pendingCount}</span>
            {/if}
          </button>
          <button onclick={() => activeTab = 'PRODUCTS'} class={tabBtnClass('PRODUCTS')}>
            <span class="{activeTab === 'PRODUCTS' ? 'text-white' : 'text-gray-600'} group-hover:text-aura-purple transition-colors"><Package size={14} /></span>
            <span>Inventory</span>
          </button>
          <button onclick={() => activeTab = 'REVIEW'} class={tabBtnClass('REVIEW')}>
            <span class="{activeTab === 'REVIEW' ? 'text-white' : 'text-gray-600'} group-hover:text-aura-purple transition-colors"><ShieldCheck size={14} /></span>
            <span>Review</span>
            {#if pendingProducts.length > 0}
              <span class="ml-1 px-2 py-0.5 bg-amber-500 text-black rounded-full text-[9px] font-black animate-pulse">{pendingProducts.length}</span>
            {/if}
          </button>
          <button onclick={() => activeTab = 'ORDERS'} class={tabBtnClass('ORDERS')}>
            <span class="{activeTab === 'ORDERS' ? 'text-white' : 'text-gray-600'} group-hover:text-aura-purple transition-colors"><CreditCard size={14} /></span>
            <span>Orders</span>
          </button>
          <button onclick={() => activeTab = 'CATEGORIES'} class={tabBtnClass('CATEGORIES')}>
            <span class="{activeTab === 'CATEGORIES' ? 'text-white' : 'text-gray-600'} group-hover:text-aura-purple transition-colors"><Tag size={14} /></span>
            <span>Categories</span>
          </button>
          <button onclick={() => activeTab = 'TRACKING'} class={tabBtnClass('TRACKING')}>
            <span class="{activeTab === 'TRACKING' ? 'text-white' : 'text-gray-600'} group-hover:text-aura-purple transition-colors"><Activity size={14} /></span>
            <span>Product Tracking</span>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-6 py-10 space-y-12">
      {#key activeTab}
        {#if activeTab === 'OVERVIEW'}
          <div transition:fade={{ duration: 500 }} class="space-y-12">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div class="bg-aura-glass border border-aura-glassBorder rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
                <div class="absolute top-0 right-0 p-10 bg-white/5 blur-[40px] rounded-full"></div>
                <div class="flex justify-between items-start mb-4 relative z-10">
                  <div class="p-3 bg-black rounded-xl border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Users class="text-blue-400" size={20} />
                  </div>
                  <span class="text-[8px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">+12% weekly</span>
                </div>
                <div class="relative z-10">
                  <h3 class="text-2xl font-black text-white mb-0.5 tracking-tight">{(liveStats || stats!).totalVendors.toLocaleString()}</h3>
                  <p class="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">Total Vendors</p>
                </div>
              </div>
              <div class="bg-aura-glass border border-aura-glassBorder rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
                <div class="absolute top-0 right-0 p-10 bg-white/5 blur-[40px] rounded-full"></div>
                <div class="flex justify-between items-start mb-4 relative z-10">
                  <div class="p-3 bg-black rounded-xl border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <ShoppingCart class="text-purple-400" size={20} />
                  </div>
                  <span class="text-[8px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Stock Heavy</span>
                </div>
                <div class="relative z-10">
                  <h3 class="text-2xl font-black text-white mb-0.5 tracking-tight">{(liveStats || stats!).activeProducts.toLocaleString()}</h3>
                  <p class="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">Active Inventory</p>
                </div>
              </div>
              <div class="bg-aura-glass border border-aura-glassBorder rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
                <div class="absolute top-0 right-0 p-10 bg-white/5 blur-[40px] rounded-full"></div>
                <div class="flex justify-between items-start mb-4 relative z-10">
                  <div class="p-3 bg-black rounded-xl border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Activity class="text-green-400" size={20} />
                  </div>
                  <span class="text-[8px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Stable</span>
                </div>
                <div class="relative z-10">
                  <h3 class="text-2xl font-black text-white mb-0.5 tracking-tight">৳{((liveStats || stats!).monthlyVolume / 1000).toLocaleString()}k</h3>
                  <p class="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">Ecosystem Volume</p>
                </div>
              </div>
              <div class="bg-aura-glass border border-aura-glassBorder rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
                <div class="absolute top-0 right-0 p-10 bg-white/5 blur-[40px] rounded-full"></div>
                <div class="flex justify-between items-start mb-4 relative z-10">
                  <div class="p-3 bg-black rounded-xl border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                    <Zap class="text-yellow-400" size={20} />
                  </div>
                  <span class="text-[8px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">Automated</span>
                </div>
                <div class="relative z-10">
                  <h3 class="text-2xl font-black text-white mb-0.5 tracking-tight">{(liveStats || stats!).aiInteractions.toLocaleString()}</h3>
                  <p class="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">AI Operations</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] rounded-full group-hover:bg-aura-purple/10 transition-all"></div>
                <div class="flex items-center gap-3 mb-6">
                  <TrendingUp class="text-aura-purple" size={20} />
                  <h2 class="text-lg font-bold font-serif text-white uppercase tracking-wider">Predictive Trend Analysis</h2>
                </div>
                <div class="space-y-6">
                  {#each (liveStats || stats!).trendForecast as item, idx}
                    <div key={idx} class="relative group/item">
                      <div class="flex justify-between items-end mb-2">
                        <div>
                          <div class="flex items-center gap-2 mb-1">
                            <span class="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{item.year} Projection</span>
                            <span class="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
                          </div>
                          <h3 class="text-base font-bold text-white transition-colors group-hover/item:text-aura-purple">{item.trend}</h3>
                        </div>
                        <div class="text-right">
                          <span class="text-xl font-black text-green-400 font-mono tracking-tighter">+{item.growth.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div class="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <div class="h-full bg-gradient-to-r from-aura-purple to-pink-500 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-all duration-300" style="width: {Math.min(item.growth / 2, 100)}%"></div>
                      </div>
                      <div class="absolute -inset-x-3 -inset-y-1.5 bg-white/[0.02] rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                  {/each}
                </div>
              </div>
              <div class="flex flex-col gap-6">
                <div class="bg-gradient-to-br from-aura-purple/20 to-indigo-900/20 border border-aura-purple/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full">
                  <Globe size={40} class="text-aura-purple/50 mb-3 group-hover:scale-110 group-hover:text-aura-purple transition-all duration-700" />
                  <h3 class="text-base font-bold text-white mb-1">Network Expansion</h3>
                  <p class="text-gray-400 text-[10px] mb-4 leading-relaxed line-clamp-2">System ready for cross-border logistics mapping. Regional hub synchronization required.</p>
                  <button class="w-full py-3 bg-white text-black rounded-lg font-black uppercase tracking-widest text-[8px] hover:bg-aura-purple hover:text-white transition-all shadow-xl active:scale-95">Deploy Global Modules</button>
                </div>
              </div>
            </div>
          </div>

        {:else if activeTab === 'VENDORS'}
          <div transition:fade={{ duration: 500 }} class="space-y-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div class="relative w-full md:w-96">
                <Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="text" placeholder="Search artisans..." bind:value={searchTerm} class="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-aura-purple transition-all" />
              </div>
              <div class="flex items-center gap-4">
                <button class="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white"><Filter size={14} /> Filter</button>
              </div>
            </div>

            <div class="bg-white/5 border border-white/10 rounded-[2rem] overflow-x-auto">
              <table class="w-full text-left min-w-[720px]">
                <thead class="bg-white/[0.02] border-b border-white/5">
                  <tr>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Artisan Brand</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Identity</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Website</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                    <th class="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ecosystem Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  {#each filteredVendors as v (v.id)}
                    <tr class="group hover:bg-white/[0.02] transition-colors">
                      <td class="px-8 py-5">
                        <div class="flex items-center gap-4">
                          <div class="w-10 h-10 bg-aura-purple/10 rounded-xl flex items-center justify-center text-aura-purple font-black">{(v.store_name || 'V')[0]}</div>
                          <div>
                            <div class="text-sm font-bold text-white">{v.store_name || 'Legacy Vendor'}</div>
                            <div class="text-[10px] text-gray-500 font-mono">{v.id}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-8 py-5">
                        <div class="text-xs text-gray-300 font-medium">{(v as any).owner_name}</div>
                        <div class="text-[10px] text-gray-600 truncate max-w-[150px]">{(v as any).email}</div>
                      </td>
                      <td class="px-8 py-5">
                        {#if (v as any).website_url}
                          <a href={(v as any).website_url} target="_blank" rel="noreferrer" class="text-[10px] text-aura-purple hover:underline font-mono truncate max-w-[120px] block">{(v as any).website_url.replace(/^https?:\/\//, '')}</a>
                        {:else}
                          <span class="text-[10px] text-gray-700 italic">None</span>
                        {/if}
                      </td>
                      <td class="px-8 py-5">
                        {#if (v.status+'').toLowerCase() === 'approved'}
                          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[9px] font-black uppercase tracking-widest">
                            <ShieldCheck size={12} /> Authorized
                          </div>
                        {:else if (v.status+'').toLowerCase() === 'pending'}
                          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
                            <Shield size={12} /> Pending Hub
                          </div>
                        {:else}
                          <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[9px] font-black uppercase tracking-widest">
                            <ShieldAlert size={12} /> Restricted
                          </div>
                        {/if}
                      </td>
                      <td class="px-8 py-5 text-right">
                        <div class="flex items-center justify-end gap-3">
                          {#if (v.status+'').toLowerCase() !== 'approved'}
                            <button
                              onclick={() => handleUpdateVendorStatus(v.id, 'APPROVED')}
                              class="p-2.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-lg"
                              title="Authorize Vendor"
                            >
                              <CheckCircle size={16} />
                            </button>
                          {/if}
                          {#if (v.status+'').toLowerCase() !== 'blocked'}
                            <button
                              onclick={() => handleUpdateVendorStatus(v.id, 'BLOCKED')}
                              class="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-lg"
                              title="Restrict System Access"
                            >
                              <ShieldAlert size={16} />
                            </button>
                          {/if}
                          <button
                            onclick={() => handleResetVendorPassword(v.id)}
                            class="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                            title="Reset Vendor Password"
                          >
                            <KeyRound size={16} />
                          </button>
                          <button
                            onclick={() => handleDeleteVendor(v.id)}
                            class="p-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg"
                            title="Purge Identity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  {:else}
                    <tr>
                      <td colspan={5} class="px-8 py-20 text-center text-gray-600 font-black uppercase tracking-[0.3em] text-xs">No vendors found matching the search criteria</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>

        {:else if activeTab === 'PRODUCTS'}
          <div transition:fade={{ duration: 500 }} class="space-y-8">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div class="relative w-full md:w-96">
                <Search size={18} class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input type="text" placeholder="Inventory scan..." bind:value={searchTerm} class="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-aura-purple transition-all" />
              </div>
              <button
                onclick={() => isProductModalOpen = true}
                class="flex items-center gap-3 px-6 py-3.5 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all"
              >
                <Plus size={16} /> Load Global Inventory
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {#each filteredProducts as p (p.id)}
                <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-aura-purple/30 transition-all relative">
                  <div class="aspect-[4/5] overflow-hidden relative">
                    <img src={p.imageUrl} alt={p.name} class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                    <div class="absolute top-4 right-4 flex flex-col gap-2">
                      <button
                        onclick={() => handleDeleteProduct(p.id)}
                        class="p-2.5 bg-red-500/80 backdrop-blur-md text-white rounded-xl shadow-2xl hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div class="absolute bottom-4 left-4 right-4">
                      <span class="text-[10px] font-black uppercase tracking-widest text-aura-purple bg-black/40 backdrop-blur-md px-2 py-0.5 rounded mb-2 inline-block border border-aura-purple/20">{p.category || 'Legacy'}</span>
                      <h3 class="text-white font-bold truncate">{p.name}</h3>
                      <p class="text-green-400 font-black text-sm">৳{p.price.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="col-span-full py-20 text-center text-gray-600 font-black uppercase tracking-[0.3em] text-xs">No products found matching the search criteria</div>
              {/each}
            </div>
          </div>

        {:else if activeTab === 'REVIEW'}
          <div transition:fade={{ duration: 500 }} class="space-y-8">
            <div class="flex items-center justify-between gap-6 flex-wrap">
              <div>
                <h2 class="text-2xl font-serif font-black text-white">Import Review Queue</h2>
                <p class="text-[10px] text-gray-500 uppercase tracking-widest font-black">Products auto-imported from vendor websites — approve to publish live</p>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full">{pendingProducts.length} Pending</span>
            </div>
            {#if pendingProducts.length === 0}
              <div class="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <ShieldCheck size={48} class="text-gray-800 mx-auto mb-4" />
                <p class="text-gray-600 font-black uppercase tracking-widest text-xs">No products awaiting review</p>
              </div>
            {:else}
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each pendingProducts as p (p.id)}
                  <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div class="aspect-[4/3] overflow-hidden bg-black/40">
                      {#if p.image_url}<img src={p.image_url} alt={p.name} class="w-full h-full object-cover" />{/if}
                    </div>
                    <div class="p-5 space-y-3">
                      <div>
                        <p class="text-[9px] text-amber-400 font-black uppercase tracking-widest">{p.vendors?.store_name || 'Vendor'}</p>
                        <h3 class="text-white font-bold truncate">{p.name}</h3>
                        <p class="text-green-400 font-black text-sm">৳{Number(p.price).toLocaleString()}</p>
                      </div>
                      <p class="text-[10px] text-gray-500 line-clamp-2">{p.description}</p>
                      <div class="grid grid-cols-2 gap-3 pt-2">
                        <button onclick={() => handleRejectProduct(p.id)} class="py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer">Reject</button>
                        <button onclick={() => handleApproveProduct(p.id)} class="py-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all cursor-pointer">Approve</button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

        {:else if activeTab === 'ORDERS'}
          <div transition:fade={{ duration: 500 }} class="space-y-6">
            <div class="flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <h2 class="text-2xl font-serif font-black text-white">Orders</h2>
                <p class="text-[10px] text-gray-500 uppercase tracking-widest font-black">All customer orders · commission & vendor payouts</p>
              </div>
              <div class="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest">
                <span class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300">{dbOrders.length} Orders</span>
                <span class="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">Sales ৳{dbOrders.reduce((s, o) => s + Number(o.total || 0), 0).toLocaleString()}</span>
                <span class="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400">Commission ৳{dbOrders.reduce((s, o) => s + Number(o.commission_total || 0), 0).toLocaleString()}</span>
                <span class="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">Payouts ৳{dbOrders.reduce((s, o) => s + Number(o.vendor_payout_total || 0), 0).toLocaleString()}</span>
              </div>
            </div>

            {#if dbOrders.length === 0}
              <div class="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <CreditCard size={48} class="text-gray-800 mx-auto mb-4" />
                <p class="text-gray-600 font-black uppercase tracking-widest text-xs">No orders yet</p>
              </div>
            {:else}
              <div class="space-y-4">
                {#each dbOrders as o (o.id)}
                  <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div class="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="font-mono text-aura-purple text-sm font-black">ORD-{o.id}</span>
                          <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border {o.payment_method === 'COD' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'}">{o.payment_method}</span>
                          <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border {o.payment_status === 'PAID' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}">{o.payment_status}</span>
                          {#if o.fraud_score != null && o.fraud_score >= 50}
                            <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-red-500/10 text-red-400 border-red-500/20" title={o.fraud_reason || ''}>⚠ Risk {o.fraud_score}</span>
                          {:else if o.fraud_score != null && o.fraud_score >= 25}
                            <span class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border bg-amber-500/10 text-amber-400 border-amber-500/20" title={o.fraud_reason || ''}>Risk {o.fraud_score}</span>
                          {/if}
                        </div>
                        <p class="text-white font-bold text-sm mt-1 truncate">{o.customer_name} · {o.customer_phone}</p>
                        <p class="text-[10px] text-gray-500 truncate">{o.district} · {o.area} — {o.address}</p>
                        {#if o.payment_txid}<p class="text-[9px] text-gray-600 font-mono">TxID: {o.payment_txid}</p>{/if}
                      </div>
                      <div class="text-right shrink-0">
                        <p class="text-lg font-black text-white">৳{Number(o.total).toLocaleString()}</p>
                        <p class="text-[9px] text-green-400 font-black uppercase tracking-widest">Commission ৳{Number(o.commission_total).toLocaleString()}</p>
                        <p class="text-[9px] text-gray-500 font-black uppercase tracking-widest">Payout ৳{Number(o.vendor_payout_total).toLocaleString()}</p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <select value={o.status} onchange={(e) => handleOrderStatus(o.id, e.currentTarget.value)}
                          class="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer">
                          {#each ['PLACED', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as s}
                            <option value={s} class="bg-black">{s}</option>
                          {/each}
                        </select>
                        <button onclick={() => expandedOrder = expandedOrder === o.id ? null : o.id}
                          class="p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all">
                          <ChevronDown size={16} class="transition-transform {expandedOrder === o.id ? 'rotate-180' : ''}" />
                        </button>
                      </div>
                    </div>
                    {#if expandedOrder === o.id}
                      <div class="border-t border-white/5 bg-black/30 p-5 space-y-3">
                        {#each o.order_items || [] as it}
                          <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-3 min-w-0">
                              {#if it.image_url}<img src={it.image_url} class="w-10 h-10 rounded-lg object-cover shrink-0" alt={it.name} />{/if}
                              <div class="min-w-0">
                                <p class="text-white font-bold text-xs truncate">{it.name}</p>
                                <p class="text-[9px] text-amber-400 font-black uppercase tracking-widest truncate">{it.vendor_store_name || 'Vendor'} · x{it.quantity}</p>
                              </div>
                            </div>
                            <div class="text-right shrink-0">
                              <p class="text-white font-black text-xs">৳{Number(it.line_total).toLocaleString()}</p>
                              <p class="text-[9px] text-gray-500">−{it.commission_rate}% → payout ৳{Number(it.vendor_payout).toLocaleString()}</p>
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>

        {:else if activeTab === 'TRACKING'}
          <div transition:fade={{ duration: 500 }} class="space-y-8">
            <div class="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
              <div class="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] rounded-full"></div>

              <div class="flex flex-col items-center text-center mb-10">
                <div class="p-4 bg-aura-purple/10 border border-aura-purple/20 rounded-full mb-4">
                  <Activity size={32} class="text-aura-purple" />
                </div>
                <h2 class="text-3xl font-serif font-black text-white mb-2 uppercase tracking-tight">ECOSYSTEM PRODUCT TRACKING</h2>
                <p class="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Monitor logistics and package lifecycle in the grid</p>
              </div>

              <form
                onsubmit={(e) => { e.preventDefault(); handleSearchOrder(trackingOrderId); }}
                class="flex gap-4 mb-20"
              >
                <div class="flex-1 relative">
                  <Search size={18} class="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input type="text" placeholder="ENTER ORDER OR TRACKING ID (e.g. ORD-5001)" bind:value={trackingOrderId} class="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-sm focus:outline-none focus:border-aura-purple transition-all font-mono tracking-widest" required />
                </div>
                <button type="submit" disabled={isTrackingLoading} class="px-10 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-aura-purple hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50">
                  {isTrackingLoading ? 'LOCATING...' : 'LOCATE'}
                </button>
              </form>

              {#if trackedOrder}
                <div transition:fade={{ duration: 700 }} class="bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                  <div class="absolute top-0 right-0 p-20 bg-aura-purple/5 blur-[100px] rounded-full pointer-events-none"></div>

                  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-white/5 relative z-10">
                    <div>
                      <div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status Report</div>
                      <div class="text-3xl font-serif font-black text-white flex items-center gap-4">
                        {trackedOrder.id}
                        <span class="w-2 h-2 bg-aura-purple rounded-full animate-ping"></span>
                        <span class="text-aura-purple">{trackedOrder.currentStatus}</span>
                      </div>
                      <div class="mt-2 flex items-center gap-4">
                        <div class="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                          <Users size={12} class="text-gray-500" />
                          <span class="text-[10px] font-bold text-gray-300">{trackedOrder.customerName}</span>
                        </div>
                        <div class="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                          <CreditCard size={12} class="text-gray-500" />
                          <span class="text-[10px] font-bold text-gray-300">EST. {trackedOrder.estimatedDelivery}</span>
                        </div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Valuation</div>
                      <div class="text-4xl font-black text-green-400 font-mono tracking-tighter">৳{trackedOrder.totalAmount.toLocaleString()}</div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                    <div class="space-y-8">
                      <h3 class="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        <Package size={14} class="text-aura-purple" />
                        Logistics Lifecycle
                      </h3>
                      <div class="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                        {#each trackedOrder.timeline as step, i}
                          <div class="flex gap-6 items-start relative transition-all duration-500 {step.completed ? 'opacity-100' : 'opacity-20'}">
                            <div class="w-4 h-4 rounded-full border-2 border-black z-10 mt-1 {step.completed ? 'bg-aura-purple shadow-[0_0_15px_rgba(124,58,237,0.8)]' : 'bg-gray-800'}"></div>
                            <div class="flex-1">
                              <div class="flex justify-between items-start">
                                <h4 class="text-[11px] font-black uppercase tracking-widest {step.completed ? 'text-white' : 'text-gray-500'}">{step.label}</h4>
                                <span class="text-[9px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded">{step.timestamp}</span>
                              </div>
                              <p class="text-[10px] text-gray-500 mt-1 leading-relaxed max-w-sm">{step.description}</p>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>

                    <div class="bg-black/40 rounded-3xl p-8 border border-white/5 h-fit">
                      <h3 class="text-xs font-black uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-2">
                        <RefreshCw size={14} class="text-aura-purple" />
                        Override Controls
                      </h3>
                      <div class="space-y-4">
                        <p class="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Update Order Phase</p>
                        <div class="grid grid-cols-1 gap-3">
                          {#each ['CONFIRMED', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED'] as phase}
                            <button
                              disabled={trackedOrder.currentStatus === phase}
                              onclick={() => handleOverridePhase(phase)}
                              class="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border {trackedOrder.currentStatus === phase ? 'bg-aura-purple/20 border-aura-purple text-aura-purple cursor-default' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}"
                            >
                              {phase}
                            </button>
                          {/each}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              {:else if trackingOrderId && !isTrackingLoading}
                <div class="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                  <p class="text-gray-600 text-[10px] font-black uppercase tracking-widest">No matching record found in the local node</p>
                </div>
              {/if}
            </div>
          </div>

        {:else if activeTab === 'CATEGORIES'}
          <div transition:fade={{ duration: 500 }} class="space-y-8">
            <div class="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-6">
              <div>
                <h2 class="text-2xl font-serif font-black text-white">ECOSYSTEM TAXONOMY</h2>
                <p class="text-[10px] text-gray-500 uppercase tracking-widest font-black">Manage product categories and neural tags</p>
              </div>
              <button
                onclick={() => isCategoryModalOpen = true}
                class="px-6 py-3 bg-aura-purple text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all"
              >
                <Plus size={16} class="inline mr-2" /> Add Category
              </button>
            </div>

            <div class="bg-white/5 border border-white/10 rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
              <div class="absolute top-0 right-0 w-24 h-24 bg-aura-purple/10 blur-[40px] rounded-full"></div>
              <div class="flex flex-col items-center mb-6">
                <div class="p-4 bg-white/5 border border-white/10 rounded-2xl mb-4">
                  <Tag size={32} class="text-aura-purple" />
                </div>
                <h2 class="text-2xl font-serif font-black text-white mb-1">Ecosystem Taxonomy</h2>
                <p class="text-gray-500 text-[9px] uppercase tracking-[0.4em] font-black">Neural Classification Node</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {#if categories.length > 0}
                  {#each categories as cat (cat.id)}
                    <div class="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-left hover:border-aura-purple hover:bg-aura-purple/[0.05] transition-all duration-500 relative">
                      <div class="flex justify-between items-start mb-4">
                        <div class="p-2.5 bg-black rounded-xl border border-white/5 group-hover:bg-aura-purple group-hover:text-white transition-all">
                          <Tag size={14} />
                        </div>
                        <button
                          onclick={() => handleDeleteCategory(cat.id)}
                          class="p-1.5 text-gray-600 hover:text-red-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <h3 class="text-lg font-bold text-white mb-0.5">{cat.name}</h3>
                      <p class="text-[8px] text-gray-500 line-clamp-2 mb-4">{cat.description || 'No description provided.'}</p>
                      <div class="flex items-center gap-2">
                        <span class="text-[20px] font-black text-white/40 group-hover:text-white transition-colors">
                          {products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length}
                        </span>
                        <span class="text-[8px] font-black uppercase tracking-widest text-gray-500">Synchronized</span>
                      </div>
                    </div>
                  {/each}
                {:else}
                  <div class="col-span-full py-12 text-gray-600 italic">No categories found in neural grid. Add one to begin.</div>
                {/if}
              </div>

              <div class="mt-12 p-6 bg-aura-purple/5 border border-aura-purple/20 rounded-2xl">
                <p class="text-gray-400 text-xs leading-relaxed">Global category mapping is automated via Aura Neural Labeling. <span class="text-white font-bold underline decoration-aura-purple">Status: Optimized for {products.length} catalog points.</span></p>
              </div>
            </div>
          </div>
        {/if}
      {/key}
    </main>

    {#if vendorCred}
      <div class="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/70" transition:fade={{ duration: 200 }}>
        <div class="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-8 shadow-2xl" transition:scale={{ duration: 300 }}>
          <div class="flex items-center gap-3 mb-6">
            <div class="p-3 bg-blue-500/10 rounded-xl"><KeyRound size={22} class="text-blue-400" /></div>
            <div>
              <h2 class="text-xl font-serif font-black text-white">New Vendor Password</h2>
              <p class="text-[9px] uppercase tracking-widest text-gray-500 font-black">Share these credentials with the vendor</p>
            </div>
          </div>
          <div class="space-y-3 mb-8">
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <p class="text-[9px] uppercase tracking-widest text-gray-500 font-black mb-1">Store</p>
              <p class="text-sm text-white font-bold">{vendorCred.store}</p>
            </div>
            <div class="bg-white/5 border border-white/10 rounded-xl p-4">
              <p class="text-[9px] uppercase tracking-widest text-gray-500 font-black mb-1">Email</p>
              <p class="text-sm text-white font-mono select-all">{vendorCred.email}</p>
            </div>
            <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p class="text-[9px] uppercase tracking-widest text-blue-300 font-black mb-1">Password</p>
              <p class="text-lg text-white font-mono font-black select-all">{vendorCred.password}</p>
            </div>
          </div>
          <button onclick={() => vendorCred = null} class="w-full py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-aura-purple hover:text-white transition-all cursor-pointer">Done</button>
        </div>
      </div>
    {/if}

    {#if isCategoryModalOpen}
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/60" transition:fade={{ duration: 200 }}>
        <div class="w-full max-w-md bg-aura-glass border border-aura-glassBorder rounded-2xl p-0.5 shadow-2xl" transition:scale={{ duration: 300 }}>
          <div class="bg-aura-black/95 rounded-xl p-10">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-2xl font-serif font-black text-white">ADD CATEGORY</h2>
              <button onclick={() => isCategoryModalOpen = false} class="text-gray-500 hover:text-white transition-colors">
                <XCircle size={24} />
              </button>
            </div>
            <form onsubmit={handleAddCategory} class="space-y-6">
              <div class="space-y-1.5">
                <label class="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Category Name</label>
                <input type="text" placeholder="e.g. Wedding Heritage" required bind:value={newCategory.name} class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800" />
              </div>
              <div class="space-y-1.5">
                <label class="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Description</label>
                <textarea bind:value={newCategory.description} class="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-aura-purple transition-all resize-none" placeholder="Brief purpose of this category..."></textarea>
              </div>
              <button type="submit" disabled={isLoading} class="w-full py-4 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all disabled:opacity-50">
                {#if isLoading}
                  <span class="flex items-center justify-center"><Loader2 size={16} class="animate-spin" /></span>
                {:else}
                  Register in Neural Grid
                {/if}
              </button>
            </form>
          </div>
        </div>
      </div>
    {/if}

    {#if isProductModalOpen}
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/60" transition:fade={{ duration: 200 }}>
        <div class="w-full max-w-md bg-aura-glass border border-aura-glassBorder rounded-[2rem] p-0.5 shadow-[0_0_60px_rgba(124,58,237,0.15)]" transition:scale={{ duration: 300 }}>
          <div class="bg-aura-black/90 rounded-[1.95rem] p-6">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h2 class="text-xl font-serif font-black text-white leading-none mb-1">GLOBAL UPLOAD</h2>
                <p class="text-[6px] uppercase tracking-[0.4em] text-gray-500 font-bold">Inject items into the Aura Grid</p>
              </div>
              <button onclick={() => isProductModalOpen = false} class="p-2 bg-white/5 border border-white/10 rounded-full text-gray-500 hover:text-white transition-all">
                <XCircle size={18} />
              </button>
            </div>

            <form onsubmit={handleAddProduct} class="space-y-4">
              <div class="space-y-4">
                <div class="grid grid-cols-1 gap-4">
                  <div class="space-y-1.5">
                    <label class="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Item Label</label>
                    <input type="text" placeholder="Heritage Muslin..." required bind:value={newProduct.name} class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800" />
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1.5">
                      <label class="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Net Price (৳)</label>
                      <input type="number" placeholder="1500" required bind:value={newProduct.price} class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800" />
                    </div>
                    <div class="space-y-1">
                      <label class="text-[8px] text-gray-500 font-black uppercase tracking-widest px-1">Taxonomy</label>
                      <select required bind:value={newProduct.category} class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] text-white focus:outline-none focus:border-aura-purple transition-all appearance-none cursor-pointer">
                        <option value="" class="bg-black text-white">Select Type</option>
                        {#each ['Saree', 'Panjabi', 'Three-Piece', 'T-Shirt', 'Pant', 'Baby', 'Hoodie', 'Others'] as c}
                          <option value={c} class="bg-black text-white">{c}</option>
                        {/each}
                      </select>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <label class="text-[8px] text-gray-500 font-black uppercase tracking-widest px-1">Description Protocol</label>
                    <textarea required bind:value={newProduct.description} class="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white focus:outline-none focus:border-aura-purple resize-none transition-all placeholder:text-gray-800 font-medium" placeholder="Enter neural metadata for this artifact..."></textarea>
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="text-[8px] text-gray-500 font-black uppercase tracking-widest px-1">Artifact Media [Neural Inject]</label>
                  <div class="grid grid-cols-1 gap-3">
                    <div class="w-full aspect-video bg-white/5 border-2 border-dashed rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all relative group/upload {!!newProduct.imageUrl ? 'border-aura-purple/50' : 'border-white/10'}"
                    >
                      {#if newProduct.imageUrl}
                        <img src={newProduct.imageUrl} alt="Artifact Preview" class="w-full h-full object-cover" />
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover/upload:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                          <label class="p-3 bg-white/10 backdrop-blur-xl rounded-full cursor-pointer hover:bg-aura-purple hover:scale-110 transition-all text-white border border-white/10">
                            <Upload size={18} />
                            <input type="file" accept="image/*" class="hidden" onchange={(e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleImageUpload(file); }} />
                          </label>
                        </div>
                      {:else}
                        <label class="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center p-4">
                          <div class="p-4 bg-white/5 rounded-xl group-hover/upload:bg-aura-purple group-hover/upload:text-white transition-all duration-500 text-gray-500 border border-white/5">
                            {#if isUploadingImage}<Loader2 size={20} class="animate-spin" />{:else}<Upload size={20} />{/if}
                          </div>
                          <div class="text-center space-y-0.5">
                            <p class="text-white text-[10px] font-black tracking-tight">{isUploadingImage ? 'Synchronizing...' : 'Direct Image Inject'}</p>
                            <p class="text-[7px] text-gray-600 uppercase tracking-widest font-black">Max 5MB</p>
                          </div>
                          <input type="file" accept="image/*" class="hidden" onchange={(e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleImageUpload(file); }} />
                        </label>
                      {/if}
                    </div>

                    <div class="relative group/input">
                      <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <ImageIcon size={10} class="text-gray-700" />
                      </div>
                      <input type="text" placeholder="Manual URL Override..." bind:value={newProduct.imageUrl} class="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-2 text-[8px] text-gray-500 font-mono focus:outline-none focus:border-aura-purple/30 transition-all placeholder:text-gray-800" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex gap-2 pt-3 border-t border-white/5">
                <button type="button" onclick={() => isProductModalOpen = false} class="flex-1 py-3 border border-white/5 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/10 hover:text-white transition-all active:scale-95">
                  Abort
                </button>
                <button type="submit" disabled={isLoading || isUploadingImage} class="flex-[2] py-3 bg-gradient-to-r from-aura-purple via-indigo-600 to-aura-purple bg-[length:200%_100%] animate-gradient text-white rounded-lg font-black uppercase tracking-widest text-[8px] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {#if isLoading}
                      Uploading Hub <Loader2 size={12} class="animate-spin inline" />
                    {:else}
                      Finalize Deployment <Zap size={12} class="inline fill-current" />
                    {/if}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
