import React, { useState } from 'react';
import { 
  Search, LayoutGrid, Tag, ChevronRight, TrendingUp, Zap, 
  ArrowRight, ShieldCheck, ShoppingBag, Menu, X, Filter,
  Globe, Store
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { getProducts, getVendors } from '../services/mockData';
import { BD_LOCATIONS } from '../services/locationData';
import { motion, AnimatePresence } from 'motion/react';

const ECO_CATEGORIES = [
  { id: 'all', name: 'সব সংগ্রহ (All)', icon: <LayoutGrid size={16} /> },
  { id: 'saree', name: 'শাড়ি (Saree)', icon: <Tag size={16} /> },
  { id: 'panjabi', name: 'পাঞ্জাবি (Panjabi)', icon: <Tag size={16} /> },
  { id: 'three-piece', name: 'থ্রি-পিস (3-Piece)', icon: <Tag size={16} /> },
  { id: 't-shirt', name: 'টি-শার্ট (T-Shirt)', icon: <Tag size={16} /> },
  { id: 'pant', name: 'প্যান্ট (Pant)', icon: <Tag size={16} /> },
  { id: 'baby', name: 'বেবি আইটেম (Baby)', icon: <Tag size={16} /> },
  { id: 'market', name: 'মার্কেট প্লেস (Market)', icon: <TrendingUp size={16} /> },
  { id: 'others', name: 'অন্যান্য (Others)', icon: <Tag size={16} /> }
];

export const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [products] = useState<any[]>(() => getProducts());
  const [vendors] = useState<any[]>(() => getVendors());

  const filteredProducts = products.filter(p => {
    const vendor = vendors.find(v => v.id === p.vendorId);
    const matchesCat = selectedCategory === 'all' || p.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = selectedDistrict === 'all' || vendor?.district === selectedDistrict;
    return matchesCat && matchesSearch && matchesDistrict;
  });

  const categoryVendors = vendors.filter(v => {
      // Simple heuristic: if a vendor has products in this category and matches district
      const matchesDistrict = selectedDistrict === 'all' || v.district === selectedDistrict;
      if (!matchesDistrict) return false;
      
      if (selectedCategory === 'all') return true;
      return products.some(p => p.vendorId === v.id && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-aura-purple/30 font-sans">
      {/* Dynamic Search Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-3xl border-b border-white/5 py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all"
            >
                <Menu size={20} />
            </button>
            
            <div className="flex-1 relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-aura-purple transition-colors" size={20} />
                <input 
                    type="text"
                    placeholder="SNEHALATA Aura AI-তে সার্চ করুন..."
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-4 pl-16 pr-6 text-sm focus:outline-none focus:border-aura-purple/50 focus:ring-8 focus:ring-aura-purple/5 transition-all placeholder:text-gray-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
                    <ShieldCheck className="text-green-500" size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Neural Verified</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:border-aura-purple transition-colors cursor-pointer">
                    <ShoppingBag size={20} />
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex relative">
        
        {/* Sidebar - Amazon/Daraz Style Layout */}
        <aside className="hidden lg:block w-80 h-[calc(100vh-100px)] sticky top-[100px] overflow-y-auto p-8 scrollbar-hide border-r border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 px-4">Neural Grid Categories</h3>
            <nav className="space-y-2">
                {ECO_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${selectedCategory === cat.id ? 'bg-aura-purple text-white shadow-xl shadow-aura-purple/20 translate-x-2' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <div className="flex items-center gap-4">
                            <span className={selectedCategory === cat.id ? 'text-white' : 'text-gray-600 group-hover:text-aura-purple transition-colors'}>
                                {cat.icon}
                            </span>
                            <span className="text-[13px] font-bold tracking-wide">{cat.name}</span>
                        </div>
                        <ChevronRight size={14} className={`transition-transform ${selectedCategory === cat.id ? 'translate-x-1 opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                    </button>
                ))}
            </nav>

            <div className="mt-12 p-8 bg-gradient-to-br from-aura-purple/20 to-indigo-500/20 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                <div className="relative z-10 text-center">
                    <h4 className="text-lg font-serif font-black italic mb-3">SNEHALATA Sell</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed mb-6 font-medium">Launch your AI-powered brand storefront today.</p>
                    <button 
                        onClick={() => window.location.hash = '/onboarding'}
                        className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                    >
                        Join Network
                    </button>
                </div>
                <Zap className="absolute -right-6 -bottom-6 text-white/5 group-hover:text-white/10 transition-colors" size={120} />
            </div>
        </aside>

        {/* Main Product Feed */}
        <main className="flex-1 p-6 lg:p-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-8">
                <div className="flex items-center gap-4">
                    <h2 className="text-4xl font-serif font-black italic leading-none">{selectedCategory === 'all' ? 'Neural Collection' : ECO_CATEGORIES.find(c => c.id === selectedCategory)?.name}</h2>
                    <span className="h-px w-12 bg-white/10 hidden sm:block"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{filteredProducts.length} Neural Items</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex -space-x-4">
                        {categoryVendors.slice(0, 5).map((v) => (
                            <div key={v.id} className="w-10 h-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-[10px] font-bold overflow-hidden" title={v.store_name}>
                                {v.store_name?.[0] || '?'}
                            </div>
                        ))}
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                        <Filter size={14} /> 
                        <select 
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="all" className="bg-black text-white">All Bangladesh</option>
                            {Object.keys(BD_LOCATIONS).sort().map(district => (
                                <option key={district} value={district} className="bg-black text-white">{district}</option>
                            ))}
                        </select>
                    </button>
                </div>
            </div>

            {/* Featured Vendors Section for Category - Enhanced List */}
            {selectedCategory !== 'all' && categoryVendors.length > 0 && (
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Verified Artisan Nodes in {ECO_CATEGORIES.find(c => c.id === selectedCategory)?.name}</h3>
                        <div className="h-px flex-1 mx-8 bg-white/5 hidden sm:block" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {categoryVendors.map(v => (
                            <div 
                                key={v.id}
                                onClick={() => window.location.hash = `/store/${v.slug}`}
                                className="group relative bg-[#0A0A0A] border border-white/5 p-5 rounded-3xl hover:border-aura-purple transition-all cursor-pointer flex items-center gap-6 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Globe size={80} />
                                </div>
                                
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                    <Store size={24} className="text-aura-purple" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xl font-serif font-black italic mb-1 truncate group-hover:text-aura-purple transition-colors">{v.store_name}</h4>
                                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest truncate">{v.description || 'Verified Artisan Hub'}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-green-500/80">Neural Node Active</span>
                                    </div>
                                </div>

                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-transform">
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Dynamic Category Sections when "All" is selected */}
            {selectedCategory === 'all' && searchQuery === '' && (
                <div className="space-y-32 mb-32">
                    {ECO_CATEGORIES.filter(c => c.id !== 'all').slice(0, 4).map(cat => {
                        const catProducts = products.filter(p => p.category.toLowerCase().includes(cat.id)).slice(0, 4);
                        if (catProducts.length === 0) return null;
                        
                        return (
                            <section key={cat.id}>
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-aura-purple/10 rounded-2xl text-aura-purple">{cat.icon}</div>
                                        <h3 className="text-3xl font-serif font-black italic">{cat.name}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        Explore All <ChevronRight size={14} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-10">
                                    {catProducts.map(p => (
                                        <ProductCard key={p.id} product={p} />
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}

            {/* Grid Layout - Mobile Responsive Optimization */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-10">
                <AnimatePresence mode="popLayout">
                    {filteredProducts.map((p, idx) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <ProductCard product={p} />
                        </motion.div>
                    ))}
                    
                    {filteredProducts.length === 0 && (
                        <div className="col-span-full py-40 text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                                <Search size={32} className="text-gray-800" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold mb-2">No Neural Signal</h3>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto">Try another category or decipher your search query.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination / Footer Info (Daraz Style) */}
            {filteredProducts.length > 0 && (
                <div className="mt-32 text-center border-t border-white/5 pt-20">
                    <button className="group px-12 py-5 bg-[#0A0A0A] border border-white/10 rounded-[2rem] hover:border-aura-purple transition-all duration-700 relative overflow-hidden inline-flex items-center gap-4">
                        <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.4em] text-white">Load More Decrypted Artifacts</span>
                        <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform text-aura-purple" />
                    </button>
                    <p className="mt-12 text-[10px] text-gray-700 font-black uppercase tracking-[0.5em] leading-relaxed">
                        No. 1 Retail AI Ecosystem • Snehalata Aura • World Class Infrastructure
                    </p>
                </div>
            )}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSidebarOpen(false)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 lg:hidden"
                />
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="fixed top-0 left-0 bottom-0 w-80 bg-black z-[60] p-10 lg:hidden border-r border-white/10"
                >
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-2xl font-serif font-black italic">Categories</h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {ECO_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setSelectedCategory(cat.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={`w-full flex items-center gap-6 p-5 rounded-3xl border transition-all ${selectedCategory === cat.id ? 'bg-aura-purple border-aura-purple text-white shadow-2xl' : 'bg-white/5 border-white/10 text-gray-400'}`}
                            >
                                {cat.icon}
                                <span className="font-bold tracking-wide">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
};
