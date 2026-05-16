import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, Users,
  Plus, ShieldCheck,
  Network, LayoutDashboard, Globe, Cpu,
  Zap, Palette, Eye, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard } from '../components/ProductCard';
import { analyzeWebsiteProducts } from '../services/geminiService';
import { 
    getVendors, getProductsByVendor, addProduct, 
    syncWithNeuralGrid 
} from '../services/mockData';
import { addProductToSupabase } from '../services/supabaseClient';

export const VendorDashboard: React.FC = () => {
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [detectedItems, setDetectedItems] = useState<any[]>([]);
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isStylizing, setIsStylizing] = useState(false);
  const [accentColor, setAccentColor] = useState('#7c3aed');

  const loadVendorData = React.useCallback(() => {
    setLoading(true);
    const activeId = localStorage.getItem('aura_active_vendor_id');
    const activeEmail = localStorage.getItem('aura_active_vendor_email');
    const allVendors = getVendors();
    
    // Find the vendor by ID or email
    let currentVendor = null;
    if (activeId) currentVendor = allVendors.find(v => String(v.id) === activeId);
    if (!currentVendor && activeEmail) currentVendor = allVendors.find(v => v.email === activeEmail);
    
    if (currentVendor) {
      setVendor(currentVendor);
      setProducts(getProductsByVendor(Number(currentVendor.id)));
      if (currentVendor.website_url) setExternalUrlInput(currentVendor.website_url);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Wrapping in a promise to ensure loadVendorData runs in a macrotask/microtask
    // and doesn't trigger synchronous setState within the effect body
    Promise.resolve().then(() => loadVendorData());
  }, [loadVendorData]);

  const handleLogout = () => {
    localStorage.removeItem('aura_active_vendor_id');
    localStorage.removeItem('aura_active_vendor_email');
    window.location.reload();
  };

  const syncWithNeuralProxy = async () => {
    const urlToAnalyze = externalUrlInput || vendor?.website_url;
    if (!urlToAnalyze || !vendor) return;

    if (vendor.status !== 'APPROVED') {
        alert('Compliance Check Required: Your neural node is currently pending SNEHALATA CEO approval.');
        return;
    }

    setIsAnalysisMode(true);
    setAnalysisProgress(10);
    
    try {
        setAnalysisProgress(30);
        const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: urlToAnalyze })
        });
        
        if (!response.ok) throw new Error('Neural proxy failed.');
        
        const data = await response.json();
        setAnalysisProgress(60);

        const productsResult = await analyzeWebsiteProducts(data.content);
        setAnalysisProgress(90);

        setDetectedItems(productsResult || []);
        setAnalysisProgress(100);
    } catch (error: any) {
        console.error("Neural Sync Error:", error);
        alert(`Analysis failed: ${error.message}`);
        setIsAnalysisMode(false);
    }
  };

  const handleImport = async () => {
    if (!vendor || detectedItems.length === 0) return;

    for (const item of detectedItems) {
        const productData = {
            id: Date.now() + Math.random(),
            vendorId: vendor.id,
            name: item.name,
            price: Number(item.price),
            category: 'Imported',
            description: item.description || `Verified item from ${vendor.store_name}.`,
            imageUrl: item.imageUrl || `https://picsum.photos/400/600?random=${Math.random()}`
        };

        await addProductToSupabase(productData);
        addProduct(productData);
    }

    await syncWithNeuralGrid();
    loadVendorData();
    setDetectedItems([]);
    setIsAnalysisMode(false);
  };

  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'General', description: '', imageUrl: '' });

  const handleAddManualProduct = async () => {
    if (!vendor) return;
    const pData = {
        vendorId: vendor.id,
        id: Date.now(),
        name: newProduct.name,
        price: Number(newProduct.price),
        category: newProduct.category,
        description: newProduct.description,
        imageUrl: newProduct.imageUrl || `https://picsum.photos/800/1000?random=${Math.random()}`
    };
    
    await addProductToSupabase(pData);
    addProduct(pData);
    await syncWithNeuralGrid();
    loadVendorData();
    setIsAddingProduct(false);
    setNewProduct({ name: '', price: '', category: 'General', description: '', imageUrl: '' });
  };

  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    setTimeout(() => {
        const allVendors = getVendors();
        const found = allVendors.find(v => v.email?.toLowerCase() === loginEmail.toLowerCase());
        
        if (found) {
            localStorage.setItem('aura_active_vendor_id', String(found.id));
            localStorage.setItem('aura_active_vendor_email', found.email || '');
            loadVendorData();
        } else {
            setLoginError('Neural node not found. Please verify your credentials or register.');
        }
        setIsLoggingIn(false);
    }, 1000);
  };

  if (loading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><Zap className="text-aura-purple animate-pulse" size={40} /></div>;
  }

  if (!vendor) {
    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 md:p-20 flex flex-col items-center justify-center relative overflow-hidden font-sans">
            {/* Background Atmosphere */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-aura-purple/5 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-900/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-xl"
            >
                <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl relative group overflow-hidden">
                   <div className="absolute inset-0 bg-aura-purple/20 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                   <LayoutDashboard size={40} className="text-aura-purple relative z-10" />
                </div>
                
                <div className="text-center mb-12">
                    <h2 className="text-5xl font-serif font-black mb-6 italic tracking-tighter uppercase">
                        Portal Entrance <br />
                        <span className="text-aura-purple text-6xl">Locked</span>
                    </h2>
                    <p className="text-gray-400 leading-relaxed font-medium max-w-sm mx-auto">
                        Authenticate your business identity to access the <span className="text-white">Aura Management Grid</span>. Manage products, analyze neural traffic, and scale your artisan brand.
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {!showLogin ? (
                        <motion.div 
                            key="options"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-col gap-4"
                        >
                            <button 
                                onClick={() => setShowLogin(true)}
                                className="w-full py-5 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_50px_rgba(124,58,237,0.3)] border border-white/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Sign In to Dashboard
                            </button>
                            
                            <a href="/#/onboarding" className="w-full py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-white hover:text-black transition-all flex items-center justify-center">
                                Register New Business Node
                            </a>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="login-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 shadow-2xl"
                        >
                            <form onSubmit={handleLogin} className="space-y-6">
                                {loginError && (
                                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-in shake duration-500">
                                        <p className="text-[10px] text-red-400 font-black uppercase tracking-widest text-center">{loginError}</p>
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Neural Email</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-aura-purple transition-colors">
                                            <Users size={18} />
                                        </div>
                                        <input 
                                            autoFocus
                                            type="email"
                                            required
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            placeholder="enter your corporate email"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-16 pr-6 py-5 text-sm text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-800"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        type="button"
                                        onClick={() => setShowLogin(false)}
                                        className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white hover:text-black transition-all"
                                    >
                                        Back
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isLoggingIn}
                                        className="flex-1 py-5 bg-aura-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isLoggingIn ? 'Verifying Node...' : 'Access Dashboard'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-16 flex items-center justify-center gap-10 grayscale opacity-20 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                    <ShieldCheck size={28} className="text-gray-400" />
                    <div className="w-px h-6 bg-white/10" />
                    <Cpu size={28} className="text-gray-400" />
                    <div className="w-px h-6 bg-white/10" />
                    <Network size={28} className="text-gray-400" />
                </div>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-aura-purple/30">
        {/* Manual Add Modal */}
        <AnimatePresence>
            {isAddingProduct && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-3xl" 
                        onClick={() => setIsAddingProduct(false)} 
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative bg-[#0A0A0A] border border-white/10 rounded-[3rem] w-full max-w-xl p-10 shadow-2xl overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Plus size={120} /></div>
                        <h2 className="text-3xl font-serif font-black italic mb-8">Add Neural Asset</h2>
                        <div className="space-y-6">
                            <input 
                                type="text" placeholder="Item Name" 
                                value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="number" placeholder="Price (৳)" 
                                    value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all"
                                />
                                <select 
                                    value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all appearance-none"
                                >
                                    <option value="General">Category</option>
                                    <option value="Saree">Saree</option>
                                    <option value="Panjabi">Panjabi</option>
                                    <option value="Modern">Modern</option>
                                </select>
                            </div>
                            <textarea 
                                placeholder="Neural Description" 
                                value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                                className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-aura-purple outline-none transition-all resize-none"
                            />
                            <button 
                                onClick={handleAddManualProduct}
                                className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-aura-purple hover:text-white transition-all shadow-xl"
                            >
                                Deploy to Catalog
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-3xl border-b border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${vendor.status === 'APPROVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                    {vendor.status === 'APPROVED' ? 'Aura Verified Node' : 'Audit Pending'}
                </span>
                {vendor.metadata?.vendor_type === 'SUBDOMAIN' && (
                    <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-aura-purple/10 text-aura-purple border border-aura-purple/20">
                        Managed Sub-domain
                    </span>
                )}
            </div>
            <h1 className="text-6xl font-serif font-black italic tracking-tighter mb-2">{vendor.store_name}</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-4">
                {vendor.email} • Neural ID: {vendor.id}
                <button onClick={handleLogout} className="text-red-500 hover:underline">Switch Account</button>
            </p>
          </div>
          
          <button 
            onClick={() => setIsAddingProduct(true)}
            className="group px-10 py-5 bg-aura-purple text-white rounded-3xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-white hover:text-black transition-all shadow-[0_20px_40px_rgba(124,58,237,0.2)]"
          >
            <Plus size={18} />
            <span className="relative">Add Neural Catalog Item</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Dash Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Col: Analytics & Catalog */}
            <div className="lg:col-span-8 space-y-12">
                
                {/* 1-Click Store Generator for Subdomain Vendors */}
                {vendor.metadata?.vendor_type === 'SUBDOMAIN' && (
                    <div className="bg-gradient-to-br from-aura-purple/20 via-black to-black border border-white/5 rounded-[3rem] p-12 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-12 text-white/5 group-hover:text-white/10 transition-colors">
                            <Layout size={180} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <Zap className="text-aura-purple" size={32} />
                                <h2 className="text-4xl font-serif font-black italic">1-Click Store Generator</h2>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-10 max-w-xl font-medium">
                                Design your digital presence in the Aura Ecosystem. Customize colors, layout, and neural features to stand out in the global marketplace.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button 
                                    onClick={() => setIsStylizing(true)}
                                    className="px-8 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    <Palette size={16} /> Stylize Store
                                </button>
                                <button
                                    onClick={() => window.open(`/#/store/${vendor.slug}`, '_blank')}
                                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                                >
                                    <Eye size={16} /> Live Preview
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stylization Modal */}
                {isStylizing && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl" onClick={() => setIsStylizing(false)} />
                        <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[3rem] w-full max-w-2xl p-12 overflow-hidden shadow-2xl">
                            <h2 className="text-4xl font-serif font-black italic mb-8">Neural Identity Studio</h2>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Aura Accent Color</label>
                                    <div className="flex gap-4">
                                        {['#7c3aed', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'].map(c => (
                                            <button 
                                                key={c}
                                                onClick={() => setAccentColor(c)}
                                                className={`w-12 h-12 rounded-full border-4 transition-transform ${accentColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Storefront Blueprint</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-white/5 border border-aura-purple rounded-2xl">
                                            <p className="text-xs font-bold uppercase tracking-widest mb-1">Aura Brutalist</p>
                                            <p className="text-[9px] text-gray-500">High contrast, sharp edges, bold typography.</p>
                                        </div>
                                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl opacity-40">
                                            <p className="text-xs font-bold uppercase tracking-widest mb-1">Ethereal Soft</p>
                                            <p className="text-[9px] text-gray-500">Soft shadows, glassmorphism, pastel accents.</p>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setIsStylizing(false);
                                        alert('Store aesthetic updated in the Neural Grid.');
                                    }}
                                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[11px]"
                                >
                                    Apply Configuration
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Website Neural Bridge for External Vendors */}
                {vendor.metadata?.vendor_type === 'EXTERNAL_BRIDGE' && (
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-12">
                        <div className="flex items-center gap-4 mb-10">
                            <Network className="text-aura-purple" size={32} />
                            <h2 className="text-3xl font-serif font-black italic">Neural Website Bridge</h2>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 mb-8">
                            <div className="flex-1 relative group">
                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none group-focus-within:text-aura-purple transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    value={externalUrlInput}
                                    onChange={(e) => setExternalUrlInput(e.target.value)}
                                    placeholder="https://yourbrand.com/shop"
                                    className="w-full bg-black border border-white/10 rounded-3xl py-5 pl-16 pr-6 text-sm font-serif focus:outline-none focus:border-aura-purple/50 transition-all"
                                />
                            </div>
                            <button 
                                onClick={syncWithNeuralProxy}
                                className="px-10 py-5 bg-white text-black rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-aura-purple hover:text-white transition-all shadow-xl"
                            >
                                Initiate Scrape
                            </button>
                        </div>

                        {isAnalysisMode && (
                            <div className="bg-black/50 border border-white/5 rounded-3xl p-10 text-center">
                                {detectedItems.length === 0 ? (
                                    <div className="py-12">
                                        <div className="w-16 h-16 border-4 border-aura-purple border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Neural Scraping in Progress... {analysisProgress}%</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-xl font-serif font-bold italic">Artifacts Detected ({detectedItems.length})</h3>
                                            <button onClick={handleImport} className="px-6 py-2 bg-green-500 text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-transform">Import Verified Items</button>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {detectedItems.map((item, i) => (
                                                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                                    <span className="text-xs font-serif truncate pr-4">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-green-500 whitespace-nowrap">৳{item.price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Catalog List */}
                <div>
                    <div className="flex items-center justify-between mb-10 px-4">
                        <div className="flex items-center gap-4">
                            <Package className="text-aura-purple" size={32} />
                            <h2 className="text-3xl font-serif font-black italic">Active Catalog</h2>
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                            {products.length} Neural Entries
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.length > 0 ? (
                            products.map(p => <ProductCard key={p.id} product={p} />)
                        ) : (
                            <div className="col-span-full py-40 border-4 border-dashed border-white/5 rounded-[4rem] text-center flex flex-col items-center">
                                <Package size={64} className="text-gray-800 mb-6" />
                                <h3 className="text-2xl font-serif italic text-gray-600">Your Neural Vault is Empty</h3>
                                <p className="text-gray-700 text-sm mt-2 max-w-xs mx-auto">Populate your digital presence by importing artifacts or adding manual entries.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Col: Stats & Quick Actions */}
            <aside className="lg:col-span-4 space-y-8">
                <div className="bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-10">
                    <h3 className="text-xl font-serif font-black italic mb-8 flex items-center gap-3">
                        <BarChart3 size={24} className="text-aura-purple" />
                        Neural Insights
                    </h3>
                    <div className="space-y-6">
                        <StatItem label="Total Sales" value="৳15,500" change="+12%" positive={true} />
                        <StatItem label="Impression Index" value="1.2k" change="+4%" positive={true} />
                        <StatItem label="Neural Ranking" value="#12" change="-2" positive={false} />
                        <StatItem label="Try-On Pulse" value="482" change="+24%" positive={true} />
                    </div>
                </div>

                <div className="bg-aura-purple/10 border border-aura-purple/20 rounded-[3rem] p-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-aura-purple/10 blur-[60px]" />
                    <h3 className="text-xl font-serif font-black italic mb-6 relative z-10 italic">Performance Pulse</h3>
                    <div className="h-40 flex items-end gap-2 relative z-10">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <div key={i} className="flex-1 bg-aura-purple rounded-t-lg transition-all duration-1000" style={{ height: `${h}%` }}></div>
                        ))}
                    </div>
                    <div className="mt-6 flex justify-between text-[8px] font-black uppercase tracking-widest text-gray-500">
                        <span>Mon</span><span>Sun</span>
                    </div>
                </div>
            </aside>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, change, positive }: { label: string; value: string; change: string; positive: boolean }) => (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0 hover:border-white/10 transition-colors group">
        <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-1">{label}</p>
            <p className="text-xl font-serif font-bold group-hover:text-aura-purple transition-colors">{value}</p>
        </div>
        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
            {change}
        </div>
    </div>
);
