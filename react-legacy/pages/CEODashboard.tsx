import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
    getEcosystemStats, getVendors, getProducts, getOrders, getCategories, syncWithNeuralGrid,
    deleteProduct as mockDeleteProduct, deleteVendor as mockDeleteVendor, deleteCategory as mockDeleteCategory,
    getOrderById
} from '../services/mockData';
import { 
    updateVendorStatusInSupabase, 
    deleteVendorFromSupabase, 
    addProductToSupabase, 
    deleteProductFromSupabase,
    uploadImageToSupabase,
    addCategoryToSupabase,
    deleteCategoryFromSupabase
} from '../services/supabaseClient';
import { EcosystemStats, Vendor, Product, Category } from '../types';
import { 
    TrendingUp, Users, ShoppingCart, Activity, Globe, Zap, 
    ShieldCheck, ShieldAlert, Shield, Trash2, 
    CheckCircle, XCircle, Plus, Search, Filter, RefreshCw, 
    Package, Tag, Building2, BarChart3, CreditCard,
    Upload, Loader2, Image as ImageIcon
} from 'lucide-react';

type DashboardTab = 'OVERVIEW' | 'VENDORS' | 'PRODUCTS' | 'ORDERS' | 'CATEGORIES' | 'TRACKING';

export const CEODashboard: React.FC = () => {
    const [stats, setStats] = useState<EcosystemStats | null>(null);
    const [activeTab, setActiveTab] = useState<DashboardTab>('OVERVIEW');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [liveStats, setLiveStats] = useState<EcosystemStats | null>(null);
    
    // Management states
    const [searchTerm, setSearchTerm] = useState('');
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [trackingOrderId, setTrackingOrderId] = useState('');
    const [trackedOrder, setTrackedOrder] = useState<any>(null);
    const [isTrackingLoading, setIsTrackingLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        category: '',
        description: '',
        imageUrl: ''
    });

    const [newCategory, setNewCategory] = useState({
        name: '',
        description: ''
    });

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        await syncWithNeuralGrid();
        const freshStats = getEcosystemStats();
        setStats(freshStats);
        setLiveStats(freshStats);
        setVendors(getVendors());
        setProducts(getProducts());
        setOrders(getOrders());
        setCategories(getCategories());
        setIsLoading(false);
    }, []);

    const hasLiveStats = !!liveStats;
    useEffect(() => {
        if (!hasLiveStats) return;
        
        const interval = setInterval(() => {
            setLiveStats(prev => {
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
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [hasLiveStats]);

    useEffect(() => {
        const token = localStorage.getItem('aura_admin_token');
        if (!token) {
            window.location.hash = '/admin-login';
        } else {
            // Use a microtask to avoid synchronous setState in effect
            Promise.resolve().then(() => {
                setIsAuthenticated(true);
                loadData();
            });
        }
    }, [loadData]);

    const handleUpdateVendorStatus = async (id: string | number, status: string) => {
        setIsLoading(true);
        try {
            const { error } = await updateVendorStatusInSupabase(id, status);
            if (!error) {
                await loadData();
            } else {
                throw error;
            }
        } catch (err: any) {
            alert(`Approval Failed: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteVendor = async (id: string | number) => {
        if (window.confirm('Are you sure you want to PERMANENTLY remove this vendor?')) {
            await deleteVendorFromSupabase(id);
            mockDeleteVendor(id);
            await loadData();
        }
    };

    const handleDeleteProduct = async (id: string | number) => {
        if (window.confirm('Delete this product from ecosystem?')) {
            await deleteProductFromSupabase(id);
            mockDeleteProduct(id);
            await loadData();
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        const finalImageUrl = newProduct.imageUrl;

        // If it's a fictional/placeholder or empty, we keep it as is unless an image is provided
        // In this implementation, the "imageUrl" state will store the uploaded URL if used.
        
        const productData = {
            name: newProduct.name,
            price: Number(newProduct.price),
            category: newProduct.category,
            description: newProduct.description,
            imageUrl: finalImageUrl || `https://picsum.photos/400/600?random=${Date.now()}`
        };

        const { error } = await addProductToSupabase(productData);
        if (!error) {
            await loadData();
            setIsProductModalOpen(false);
            setNewProduct({ name: '', price: '', category: '', description: '', imageUrl: '' });
        } else {
            console.error('Final product addition failed:', error);
            alert(`Deployment Failed: ${error.message || 'Metadata injection rejected by the grid.'}`);
        }
        setIsLoading(false);
    };

    const handleImageUpload = async (file: File) => {
        if (!file) return;
        
        // Basic size check (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Maximum size is 5MB.');
            return;
        }

        setIsUploadingImage(true);
        try {
            console.log('Starting upload for:', file.name);
            const { data: publicUrl, error } = await uploadImageToSupabase(file);
            
            if (error) {
                console.error('Upload error details:', error);
                const errorMessage = typeof error === 'string' ? error : (error.message || 'Unknown storage error');
                alert(`Upload failed: ${errorMessage}. Please ensure you have run the Bucket Policies in Supabase SQL Editor.`);
                return;
            }

            if (publicUrl) {
                setNewProduct(prev => ({ ...prev, imageUrl: publicUrl }));
            }
        } catch (err: any) {
            console.error('Catch block upload error:', err);
            alert(`Unexpected error: ${err.message}`);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleAddCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const { error } = await addCategoryToSupabase(newCategory);
        if (!error) {
            await loadData();
            setIsCategoryModalOpen(false);
            setNewCategory({ name: '', description: '' });
        }
        setIsLoading(false);
    };

    const handleDeleteCategory = async (id: string | number) => {
        if (window.confirm('Delete this category?')) {
            await deleteCategoryFromSupabase(id);
            mockDeleteCategory(id);
            await loadData();
        }
    };

    const handleSearchOrder = (id: string) => {
        setIsTrackingLoading(true);
        setTimeout(() => {
            const found = getOrderById(id);
            setTrackedOrder(found || null);
            setIsTrackingLoading(false);
        }, 800);
    };

    // Filtered data
    const filteredVendors = vendors.filter(v => v?.store_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false);
    const filteredProducts = products.filter(p => p?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false);

    if (!isAuthenticated || !stats) return <div className="min-h-screen bg-black flex items-center justify-center text-aura-purple animate-pulse font-mono tracking-widest uppercase">Initializing Command Center...</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* CEO Header */}
            <header className="bg-[#050505] border-b border-white/10 sticky top-20 z-40">
                <div className="max-w-7xl mx-auto px-6 py-6 border-x border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-serif font-black text-white tracking-tight">CEO COMMAND CENTER</h1>
                                <div className="px-2 py-0.5 bg-aura-purple/20 border border-aura-purple/30 rounded text-[8px] font-black uppercase tracking-widest text-aura-purple">Root Access</div>
                            </div>
                            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 font-bold">Snehalata Ecosystem Infrastructure</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={loadData}
                                className={`p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all ${isLoading ? 'animate-spin' : ''}`}
                            >
                                <RefreshCw size={18} />
                            </button>
                            <button 
                                onClick={() => {
                                    localStorage.removeItem('aura_admin_token');
                                    window.location.hash = '/admin-login';
                                }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                title="Sign Out"
                            >
                                <XCircle size={18} />
                            </button>
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/5 border border-green-500/20 rounded-xl">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                                <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">Aura Core: Live</span>
                            </div>
                        </div>
                    </div>

                    {/* Sub-navigation */}
                    <div className="flex items-center gap-2 md:gap-4 mt-8 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
                        <TabButton active={activeTab === 'OVERVIEW'} onClick={() => setActiveTab('OVERVIEW')} icon={<BarChart3 size={14} />} label="Overview" />
                        <TabButton active={activeTab === 'VENDORS'} onClick={() => setActiveTab('VENDORS')} icon={<Building2 size={14} />} label="Vendors" />
                        <TabButton active={activeTab === 'PRODUCTS'} onClick={() => setActiveTab('PRODUCTS')} icon={<Package size={14} />} label="Inventory" />
                        <TabButton active={activeTab === 'ORDERS'} onClick={() => setActiveTab('ORDERS')} icon={<CreditCard size={14} />} label="Orders" />
                        <TabButton active={activeTab === 'CATEGORIES'} onClick={() => setActiveTab('CATEGORIES')} icon={<Tag size={14} />} label="Categories" />
                        <TabButton active={activeTab === 'TRACKING'} onClick={() => setActiveTab('TRACKING')} icon={<Activity size={14} />} label="Product Tracking" />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
                
                {activeTab === 'OVERVIEW' && (
                    <div className="space-y-12 animate-in fade-in duration-500">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="Total Vendors" value={(liveStats || stats).totalVendors.toLocaleString()} icon={<Users className="text-blue-400" />} trend="+12% weekly" />
                            <StatCard title="Active Inventory" value={(liveStats || stats).activeProducts.toLocaleString()} icon={<ShoppingCart className="text-purple-400" />} trend="Stock Heavy" />
                            <StatCard title="Ecosystem Volume" value={`৳${((liveStats || stats).monthlyVolume / 1000).toLocaleString()}k`} icon={<Activity className="text-green-400" />} trend="Stable" />
                            <StatCard title="AI Operations" value={(liveStats || stats).aiInteractions.toLocaleString()} icon={<Zap className="text-yellow-400" />} trend="Automated" />
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] rounded-full group-hover:bg-aura-purple/10 transition-all"></div>
                                <div className="flex items-center gap-3 mb-6">
                                    <TrendingUp className="text-aura-purple" size={20} />
                                    <h2 className="text-lg font-bold font-serif text-white uppercase tracking-wider">Predictive Trend Analysis</h2>
                                </div>
                                <div className="space-y-6">
                                    {(liveStats || stats).trendForecast.map((item, idx) => (
                                        <div key={idx} className="relative group/item">
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{item.year} Projection</span>
                                                        <span className="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
                                                    </div>
                                                    <h3 className="text-base font-bold text-white transition-colors group-hover/item:text-aura-purple">{item.trend}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xl font-black text-green-400 font-mono tracking-tighter">+{item.growth.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-aura-purple to-pink-500 rounded-full shadow-[0_0_10px_rgba(124,58,237,0.5)] transition-all duration-300" 
                                                    style={{ width: `${Math.min(item.growth / 2, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="absolute -inset-x-3 -inset-y-1.5 bg-white/[0.02] rounded-lg opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div className="bg-gradient-to-br from-aura-purple/20 to-indigo-900/20 border border-aura-purple/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group h-full">
                                    <Globe size={40} className="text-aura-purple/50 mb-3 group-hover:scale-110 group-hover:text-aura-purple transition-all duration-700" />
                                    <h3 className="text-base font-bold text-white mb-1">Network Expansion</h3>
                                    <p className="text-gray-400 text-[10px] mb-4 leading-relaxed line-clamp-2">System ready for cross-border logistics mapping. Regional hub synchronization required.</p>
                                    <button className="w-full py-3 bg-white text-black rounded-lg font-black uppercase tracking-widest text-[8px] hover:bg-aura-purple hover:text-white transition-all shadow-xl active:scale-95">Deploy Global Modules</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'VENDORS' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="relative w-full md:w-96">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search artisans..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-aura-purple transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-gray-400 hover:text-white"><Filter size={14}/> Filter</button>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Artisan Brand</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Identity</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Website</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Ecosystem Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredVendors.map((v) => (
                                        <tr key={v.id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-aura-purple/10 rounded-xl flex items-center justify-center text-aura-purple font-black">{(v.store_name || 'V')[0]}</div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{v.store_name || 'Legacy Vendor'}</div>
                                                        <div className="text-[10px] text-gray-500 font-mono">{v.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-xs text-gray-300 font-medium">{v.owner_name}</div>
                                                <div className="text-[10px] text-gray-600 truncate max-w-[150px]">{v.email}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {v.website_url ? (
                                                    <a href={v.website_url} target="_blank" rel="noreferrer" className="text-[10px] text-aura-purple hover:underline font-mono truncate max-w-[120px] block">
                                                        {v.website_url.replace(/^https?:\/\//, '')}
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] text-gray-700 italic">None</span>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <StatusBadge status={v.status} />
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    {v.status !== 'approved' && (
                                                        <button 
                                                            onClick={() => handleUpdateVendorStatus(v.id, 'approved')}
                                                            className="p-2.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all shadow-lg"
                                                            title="Authorize Vendor"
                                                        >
                                                            <CheckCircle size={16} />
                                                        </button>
                                                    )}
                                                    {v.status !== 'blocked' && (
                                                        <button 
                                                            onClick={() => handleUpdateVendorStatus(v.id, 'blocked')}
                                                            className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-lg"
                                                            title="Restrict System Access"
                                                        >
                                                            <ShieldAlert size={16} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDeleteVendor(v.id)}
                                                        className="p-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                                        title="Purge Identity"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'PRODUCTS' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="relative w-full md:w-96">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input 
                                    type="text" 
                                    placeholder="Inventory scan..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-aura-purple transition-all"
                                />
                            </div>
                            <button 
                                onClick={() => setIsProductModalOpen(true)}
                                className="flex items-center gap-3 px-6 py-3.5 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all"
                            >
                                <Plus size={16}/> Load Global Inventory
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredProducts.map((p) => (
                                <div key={p.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-aura-purple/30 transition-all relative">
                                    <div className="aspect-[4/5] overflow-hidden relative">
                                        <img src={p.image_url || p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>
                                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                                            <button 
                                                onClick={() => handleDeleteProduct(p.id)}
                                                className="p-2.5 bg-red-500/80 backdrop-blur-md text-white rounded-xl shadow-2xl hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 duration-300"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-aura-purple bg-black/40 backdrop-blur-md px-2 py-0.5 rounded mb-2 inline-block border border-aura-purple/20">{p.category || 'Legacy'}</span>
                                            <h3 className="text-white font-bold truncate">{p.name}</h3>
                                            <p className="text-green-400 font-black text-sm">৳{p.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'ORDERS' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <h2 className="text-2xl font-serif font-black text-white">ECOSYSTEM TRANSACTIONS</h2>
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Real-time Stream</span>
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-white/[0.02] border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Order ID</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Customer</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Amount</th>
                                        <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {orders.map((o) => (
                                        <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-8 py-5 font-mono text-xs text-aura-purple uppercase tracking-widest">{o.id}</td>
                                            <td className="px-8 py-5 text-sm font-bold text-white">{o.customerName || 'Syncing...'}</td>
                                            <td className="px-8 py-5 text-sm font-black text-green-400">৳{o.totalAmount?.toLocaleString() || 0}</td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                    o.currentStatus === 'SHIPPED' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                                                    o.currentStatus === 'DELIVERED' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                    'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                }`}>
                                                    {o.currentStatus || 'PENDING'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {orders.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-20 text-center text-gray-600 font-black uppercase tracking-[0.3em] text-xs">No transactions detected in primary hub</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'TRACKING' && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] rounded-full"></div>
                            
                            <div className="flex flex-col items-center text-center mb-10">
                                <div className="p-4 bg-aura-purple/10 border border-aura-purple/20 rounded-full mb-4">
                                    <Activity size={32} className="text-aura-purple" />
                                </div>
                                <h2 className="text-3xl font-serif font-black text-white mb-2 uppercase tracking-tight">ECOSYSTEM PRODUCT TRACKING</h2>
                                <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">Monitor logistics and package lifecycle in the grid</p>
                            </div>

                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleSearchOrder(trackingOrderId); }}
                                className="flex gap-4 mb-20"
                            >
                                <div className="flex-1 relative">
                                    <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder="ENTER ORDER OR TRACKING ID (e.g. ORD-5001)" 
                                        value={trackingOrderId}
                                        onChange={(e) => setTrackingOrderId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-sm focus:outline-none focus:border-aura-purple transition-all font-mono tracking-widest"
                                        required
                                    />
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isTrackingLoading}
                                    className="px-10 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-aura-purple hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {isTrackingLoading ? 'LOCATING...' : 'LOCATE'}
                                </button>
                            </form>

                            {trackedOrder ? (
                                <div className="animate-in slide-in-from-bottom-8 duration-700 bg-white/[0.02] border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-20 bg-aura-purple/5 blur-[100px] rounded-full pointer-events-none"></div>
                                    
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-white/5 relative z-10">
                                        <div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Status Report</div>
                                            <div className="text-3xl font-serif font-black text-white flex items-center gap-4">
                                                {trackedOrder.id} 
                                                <span className="w-2 h-2 bg-aura-purple rounded-full animate-ping"></span>
                                                <span className="text-aura-purple">{trackedOrder.currentStatus}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                                    <Users size={12} className="text-gray-500" />
                                                    <span className="text-[10px] font-bold text-gray-300">{trackedOrder.customerName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                                    <CreditCard size={12} className="text-gray-500" />
                                                    <span className="text-[10px] font-bold text-gray-300">EST. {trackedOrder.estimatedDelivery}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total Valuation</div>
                                            <div className="text-4xl font-black text-green-400 font-mono tracking-tighter">৳{trackedOrder.totalAmount.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10">
                                        {/* Timeline */}
                                        <div className="space-y-8">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                                <Package size={14} className="text-aura-purple" />
                                                Logistics Lifecycle
                                            </h3>
                                            <div className="space-y-8 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
                                                {trackedOrder.timeline.map((step: any, i: number) => (
                                                    <div key={i} className={`flex gap-6 items-start relative transition-all duration-500 ${step.completed ? 'opacity-100' : 'opacity-20'}`}>
                                                        <div className={`w-4 h-4 rounded-full ${step.completed ? 'bg-aura-purple shadow-[0_0_15px_rgba(124,58,237,0.8)]' : 'bg-gray-800'} border-2 border-black z-10 mt-1`}></div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className={`text-[11px] font-black uppercase tracking-widest ${step.completed ? 'text-white' : 'text-gray-500'}`}>{step.label}</h4>
                                                                <span className="text-[9px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded">{step.timestamp}</span>
                                                            </div>
                                                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed max-w-sm">{step.description}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Admin Controls */}
                                        <div className="bg-black/40 rounded-3xl p-8 border border-white/5 h-fit">
                                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-2">
                                                <RefreshCw size={14} className="text-aura-purple" />
                                                Override Controls
                                            </h3>
                                            <div className="space-y-4">
                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Update Order Phase</p>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {['CONFIRMED', 'QUALITY_CHECK', 'SHIPPED', 'DELIVERED'].map((phase) => (
                                                        <button
                                                            key={phase}
                                                            disabled={trackedOrder.currentStatus === phase}
                                                            onClick={() => {
                                                                const updated = {
                                                                    ...trackedOrder,
                                                                    currentStatus: phase,
                                                                    timeline: trackedOrder.timeline.map((t: any) => 
                                                                        t.status === phase || (phase === 'DELIVERED' && t.status !== 'PLACED') ? { ...t, completed: true, timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ', ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : t
                                                                    )
                                                                };
                                                                setTrackedOrder(updated);
                                                                // Sync with localStorage
                                                                const orders = getOrders();
                                                                const idx = orders.findIndex(o => o.id === trackedOrder.id);
                                                                if (idx !== -1) {
                                                                    orders[idx] = updated;
                                                                    localStorage.setItem('aura_orders', JSON.stringify(orders));
                                                                }
                                                            }}
                                                            className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                                trackedOrder.currentStatus === phase 
                                                                ? 'bg-aura-purple/20 border-aura-purple text-aura-purple cursor-default' 
                                                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                                                            }`}
                                                        >
                                                            {phase}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : trackingOrderId && !isTrackingLoading && (
                                <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                                    <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">No matching record found in the local node</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'CATEGORIES' && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div>
                                <h2 className="text-2xl font-serif font-black text-white">ECOSYSTEM TAXONOMY</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Manage product categories and neural tags</p>
                            </div>
                            <button 
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="px-6 py-3 bg-aura-purple text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all"
                            >
                                <Plus size={16} className="inline mr-2" /> Add Category
                            </button>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-aura-purple/10 blur-[40px] rounded-full"></div>
                            <div className="flex flex-col items-center mb-6">
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-4">
                                    <Tag size={32} className="text-aura-purple" />
                                </div>
                                <h2 className="text-2xl font-serif font-black text-white mb-1">Ecosystem Taxonomy</h2>
                                <p className="text-gray-500 text-[9px] uppercase tracking-[0.4em] font-black">Neural Classification Node</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.length > 0 ? categories.map(cat => (
                                    <div 
                                        key={cat.id} 
                                        className="group p-6 bg-white/[0.03] border border-white/10 rounded-2xl text-left hover:border-aura-purple hover:bg-aura-purple/[0.05] transition-all duration-500 relative"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-2.5 bg-black rounded-xl border border-white/5 group-hover:bg-aura-purple group-hover:text-white transition-all">
                                                <Tag size={14} />
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="p-1.5 text-gray-600 hover:text-red-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-0.5">{cat.name}</h3>
                                        <p className="text-[8px] text-gray-500 line-clamp-2 mb-4">{cat.description || 'No description provided.'}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[20px] font-black text-white/40 group-hover:text-white transition-colors">
                                                {products.filter(p => p.category?.toLowerCase() === cat.name.toLowerCase()).length}
                                            </span>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Synchronized</span>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-12 text-gray-600 italic">No categories found in neural grid. Add one to begin.</div>
                                )}
                            </div>
                            
                            <div className="mt-12 p-6 bg-aura-purple/5 border border-aura-purple/20 rounded-2xl">
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    Global category mapping is automated via Aura Neural Labeling. <span className="text-white font-bold underline decoration-aura-purple">Status: Optimized for {products.length} catalog points.</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Category Add Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/60">
                    <div className="w-full max-w-md bg-aura-glass border border-aura-glassBorder rounded-2xl p-0.5 shadow-2xl animate-in zoom-in duration-300">
                        <div className="bg-aura-black/95 rounded-xl p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-serif font-black text-white">ADD CATEGORY</h2>
                                <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleAddCategory} className="space-y-6">
                                <CEOInput 
                                    label="Category Name" 
                                    placeholder="e.g. Wedding Heritage" 
                                    value={newCategory.name} 
                                    onChange={(v: string) => setNewCategory({...newCategory, name: v})} 
                                    required 
                                />
                                <div className="space-y-1.5">
                                    <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">Description</label>
                                    <textarea 
                                        value={newCategory.description}
                                        onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-aura-purple transition-all resize-none"
                                        placeholder="Brief purpose of this category..."
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-4 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-2xl transition-all disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Register in Neural Grid'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Upload Modal */}
            {isProductModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-3xl bg-black/60">
                    <div className="w-full max-w-md bg-aura-glass border border-aura-glassBorder rounded-[2rem] p-0.5 shadow-[0_0_60px_rgba(124,58,237,0.15)] animate-in zoom-in duration-300">
                        <div className="bg-aura-black/90 rounded-[1.95rem] p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-serif font-black text-white leading-none mb-1">GLOBAL UPLOAD</h2>
                                    <p className="text-[6px] uppercase tracking-[0.4em] text-gray-500 font-bold">Inject items into the Aura Grid</p>
                                </div>
                                <button onClick={() => setIsProductModalOpen(false)} className="p-2 bg-white/5 border border-white/10 rounded-full text-gray-500 hover:text-white transition-all">
                                    <XCircle size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        <CEOInput label="Item Label" placeholder="Heritage Muslin..." value={newProduct.name} onChange={(v: string) => setNewProduct({...newProduct, name: v})} required />
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <CEOInput label="Net Price (৳)" placeholder="1500" value={newProduct.price} onChange={(v: string) => setNewProduct({...newProduct, price: v})} required type="number" />
                                            <div className="space-y-1">
                                                <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest px-1">Taxonomy</label>
                                                <select 
                                                    value={newProduct.category}
                                                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-[11px] text-white focus:outline-none focus:border-aura-purple transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="" className="bg-black text-white">Select Type</option>
                                                    {['Saree', 'Panjabi', 'Streetwear', 'Accessories', 'Heritage', 'Fusion'].map(c => (
                                                        <option key={c} value={c} className="bg-black text-white">{c}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest px-1">Description Protocol</label>
                                            <textarea 
                                                value={newProduct.description}
                                                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                                                className="w-full h-20 bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] text-white focus:outline-none focus:border-aura-purple resize-none transition-all placeholder:text-gray-800 font-medium"
                                                placeholder="Enter neural metadata for this artifact..."
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[8px] text-gray-500 font-black uppercase tracking-widest px-1">Artifact Media [Neural Inject]</label>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className={`w-full aspect-video bg-white/5 border-2 border-dashed ${newProduct.imageUrl ? 'border-aura-purple/50' : 'border-white/10'} rounded-xl flex flex-col items-center justify-center overflow-hidden transition-all relative group-hover:border-aura-purple/40`}>
                                                {newProduct.imageUrl ? (
                                                    <>
                                                        <img src={newProduct.imageUrl} alt="Artifact Preview" className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                                                            <label className="p-3 bg-white/10 backdrop-blur-xl rounded-full cursor-pointer hover:bg-aura-purple hover:scale-110 transition-all text-white border border-white/10">
                                                                <Upload size={18} />
                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleImageUpload(file);
                                                                }} />
                                                            </label>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <label className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center group/upload p-4">
                                                        <div className="p-4 bg-white/5 rounded-xl group-hover/upload:bg-aura-purple group-hover/upload:text-white transition-all duration-500 text-gray-500 border border-white/5">
                                                            {isUploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                                        </div>
                                                        <div className="text-center space-y-0.5">
                                                            <p className="text-white text-[10px] font-black tracking-tight">{isUploadingImage ? 'Synchronizing...' : 'Direct Image Inject'}</p>
                                                            <p className="text-[7px] text-gray-600 uppercase tracking-widest font-black">Max 5MB</p>
                                                        </div>
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) handleImageUpload(file);
                                                        }} />
                                                    </label>
                                                )}
                                            </div>
                                            
                                            <div className="relative group/input">
                                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                                    <ImageIcon size={10} className="text-gray-700" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    placeholder="Manual URL Override..."
                                                    value={newProduct.imageUrl}
                                                    onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-2 py-2 text-[8px] text-gray-500 font-mono focus:outline-none focus:border-aura-purple/30 transition-all placeholder:text-gray-800"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-3 border-t border-white/5">
                                    <button 
                                        type="button"
                                        onClick={() => setIsProductModalOpen(false)}
                                        className="flex-1 py-3 border border-white/5 bg-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 hover:bg-white/10 hover:text-white transition-all active:scale-95"
                                    >
                                        Abort
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isLoading || isUploadingImage}
                                        className="flex-[2] py-3 bg-gradient-to-r from-aura-purple via-indigo-600 to-aura-purple bg-[length:200%_100%] animate-gradient text-white rounded-lg font-black uppercase tracking-widest text-[8px] hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {isLoading ? (
                                            <>Uploading Hub <Loader2 size={12} className="animate-spin" /></>
                                        ) : (
                                            <>Finalize Deployment <Zap size={12} className="fill-current" /></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
    <button 
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        className={`flex items-center gap-2.5 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer relative z-10 whitespace-nowrap active:scale-95 group ${
            active 
            ? 'bg-aura-purple text-white shadow-[0_15px_40px_rgba(124,58,237,0.4)] border border-white/20' 
            : 'bg-white/5 text-gray-400 border border-white/5 hover:text-white hover:bg-white/10'
        }`}
    >
        <span className={`${active ? 'text-white' : 'text-gray-600 group-hover:text-aura-purple'} transition-colors`}>{icon}</span>
        <span className="pointer-events-none">{label}</span>
        {active && (
            <motion.div 
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-white/10 rounded-xl blur-lg -z-10"
            />
        )}
    </button>
);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend: string }> = ({ title, value, icon, trend }) => (
    <div className="bg-aura-glass border border-aura-glassBorder rounded-2xl p-6 relative overflow-hidden group hover:bg-white/[0.05] transition-all">
        <div className="absolute top-0 right-0 p-10 bg-white/5 blur-[40px] rounded-full"></div>
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-black rounded-xl border border-white/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                {icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">{trend}</span>
        </div>
        <div className="relative z-10">
            <h3 className="text-2xl font-black text-white mb-0.5 tracking-tight">{value}</h3>
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">{title}</p>
        </div>
    </div>
);

const CEOInput = ({ label, placeholder, value, onChange, required = false, type = "text" }: any) => (
    <div className="space-y-1.5">
        <label className="text-[9px] text-gray-500 font-black uppercase tracking-widest px-1">{label}</label>
        <input 
            type={type}
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800"
        />
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toLowerCase();
    if (s === 'approved') return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-[9px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} /> Authorized
        </div>
    );
    if (s === 'pending') return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
            <Shield size={12} /> Pending Hub
        </div>
    );
    return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-[9px] font-black uppercase tracking-widest">
            <ShieldAlert size={12} /> Restricted
        </div>
    );
};