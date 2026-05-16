import React, { useState } from 'react';
import { Product, Vendor } from '../types';
import { Eye, X, Plus, Minus, CheckCircle2, ShoppingBag, Shirt, Sparkles, ShieldCheck, Palette, Loader2, Share2, Zap } from 'lucide-react';
import { Link } from './Navigation';
import { editAuraImage } from '../services/geminiService';

interface ProductCardProps {
  product: Product;
  vendor?: Vendor;
}

const STYLE_PRESETS = [
  { id: 'vintage', name: 'Vintage', prompt: 'Apply a warm, nostalgic vintage film aesthetic with muted colors, soft lighting, and subtle grain.', icon: '🎬' },
  { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'Apply a cyberpunk aesthetic with neon pink and blue lighting, high contrast, and a futuristic, dark atmosphere.', icon: '🦾' },
  { id: 'minimalist', name: 'Minimal', prompt: 'Apply a minimalist aesthetic with clean lines, neutral colors, and a bright, airy, uncluttered background.', icon: '⚪' },
  { id: 'bohemian', name: 'Boho', prompt: 'Apply a bohemian aesthetic with earthy tones, natural textures, warm sunlight, and a cozy, eclectic vibe.', icon: '🌿' },
];

export const ProductCard: React.FC<ProductCardProps> = ({ product, vendor }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(product.imageUrl);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isQuickAdded, setIsQuickAdded] = useState(false);

  // Modal Add to Cart
  const handleAddToCartModal = () => {
    const currentCart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    const existingIndex = currentCart.findIndex((item: any) => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += quantity;
    } else {
      currentCart.push({ ...product, imageUrl: currentImageUrl, quantity });
    }

    localStorage.setItem('aura_cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cartUpdated'));
    setIsAdded(true);
    
    setTimeout(() => {
      window.location.hash = '/cart';
    }, 800);
  };

  // Quick Add (No Modal)
  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const currentCart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    const existingIndex = currentCart.findIndex((item: any) => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({ ...product, imageUrl: currentImageUrl, quantity: 1 });
    }

    localStorage.setItem('aura_cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cartUpdated'));
    
    setIsQuickAdded(true);
    setTimeout(() => setIsQuickAdded(false), 2000);
  };

  // Fast Checkout (Add & Redirect)
  const handleFastCheckout = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const currentCart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    const existingIndex = currentCart.findIndex((item: any) => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({ ...product, imageUrl: currentImageUrl, quantity: 1 });
    }

    localStorage.setItem('aura_cart', JSON.stringify(currentCart));
    window.dispatchEvent(new Event('cartUpdated'));
    window.location.hash = '/cart';
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
        title: product.name,
        text: `Check out ${product.name} on Snehalata Ecosystem! Price: ৳${product.price}`,
        url: window.location.href
    };

    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) {
            console.error("Share cancelled/failed", err);
        }
    } else {
        navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        alert("Product info copied to clipboard");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsAdded(false);
    setQuantity(1);
  };

  const convertUrlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleApplyStyle = async (presetPrompt: string) => {
    setIsRefining(true);
    setIsRefineModalOpen(false);
    try {
      const base64 = await convertUrlToBase64(currentImageUrl!);
      const refinedImage = await editAuraImage(presetPrompt, base64);
      if (refinedImage) {
        setCurrentImageUrl(refinedImage);
      }
    } catch (error) {
      console.error("Style refinement failed", error);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <>
      <div className="group space-y-4">
        {/* Image Container */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/5 group-hover:border-aura-purple/40 transition-all duration-500 shadow-xl cursor-pointer"
        >
          <img 
            src={currentImageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
          />
          
          {/* Refinement Loading Overlay */}
          {isRefining && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <Loader2 className="animate-spin text-aura-purple" size={48} />
                <Sparkles className="absolute inset-0 m-auto text-white animate-pulse" size={16} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Aura Refinement Active</p>
            </div>
          )}

          {/* Subtle Overlay to highlight product */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        {/* Product Details - Enhanced Footer */}
        <div className="space-y-3 px-1 sm:px-2">
          {/* Header Info */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] sm:text-[15px] font-bold text-white group-hover:text-aura-purple transition-colors truncate mb-0.5">{product.name}</h3>
              {vendor && (
                <Link to={`/store/${vendor.slug}`} className="text-[8px] text-gray-600 uppercase tracking-widest block hover:text-white transition-colors">
                  {vendor.name}
                </Link>
              )}
              <div className="text-[13px] sm:text-[15px] font-black text-white tabular-nums mt-1">৳{product.price.toLocaleString()}</div>
            </div>
          </div>

          {/* Action Buttons: Add & Buy */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleQuickAdd}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                isQuickAdded 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black'
              }`}
            >
              {isQuickAdded ? <CheckCircle2 size={12} /> : <ShoppingBag size={12} />}
              {isQuickAdded ? 'Added' : 'Add'}
            </button>
            <button 
              onClick={handleFastCheckout}
              className="flex items-center justify-center gap-1.5 py-2.5 bg-aura-purple text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              <Zap size={12} className="fill-current" />
              Buy
            </button>
          </div>

          {/* Footer Icons: Share, View Store, Virtual Try-On */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
             <div className="flex items-center gap-3">
               <button 
                 onClick={handleShare}
                 className="flex items-center gap-1 text-gray-600 hover:text-white transition-colors group/foot"
                 title="Share Artifact"
               >
                 <Share2 size={14} className="group-hover/foot:scale-110" />
               </button>
               <Link 
                 to={`/store/${vendor?.slug || ''}`}
                 className="flex items-center gap-1 text-gray-600 hover:text-white transition-colors group/foot"
                 title="Explore Brand"
               >
                 <Eye size={14} className="group-hover/foot:scale-110" />
               </Link>
             </div>

             <Link 
               to={`/try-on/${product.id}`}
               className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] hover:bg-aura-purple/20 border border-white/5 rounded-lg text-gray-500 hover:text-aura-purple transition-all group/try"
             >
               <Shirt size={10} className="group-hover/try:animate-bounce" />
               <span className="text-[7px] font-black uppercase tracking-widest">Virtual Try-on</span>
             </Link>
          </div>
        </div>
      </div>

      {/* Style Refinement Modal (Advanced) */}
      {isRefineModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-aura-glass border border-aura-glassBorder rounded-[3rem] p-1 shadow-2xl overflow-hidden animate-in zoom-in duration-500">
            <div className="bg-black/40 backdrop-blur-3xl rounded-[2.9rem] p-10 md:p-12 relative z-10">
              <button 
                onClick={() => setIsRefineModalOpen(false)}
                className="absolute top-8 right-8 p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-aura-purple/10 border border-aura-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Palette className="text-aura-purple" size={32} />
                </div>
                <h2 className="text-2xl font-serif font-black text-white mb-2">Refine Style</h2>
                <p className="text-gray-500 text-xs uppercase tracking-widest font-black">Choose an AI-Powered Aesthetic Preset</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {STYLE_PRESETS.map((preset) => (
                  <button 
                    key={preset.id}
                    onClick={() => handleApplyStyle(preset.prompt)}
                    className="group relative flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 rounded-3xl hover:border-aura-purple hover:bg-aura-purple/5 transition-all active:scale-95"
                  >
                    <span className="text-3xl mb-3 group-hover:scale-125 transition-transform">{preset.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{preset.name}</span>
                    <div className="absolute inset-0 bg-aura-purple/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>

              <p className="text-[9px] text-center text-gray-600 mt-10 uppercase tracking-[0.3em] font-black">
                Powered by Aura Vision Generative Engine
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative w-full max-w-lg bg-aura-glass border border-aura-glassBorder rounded-[3.5rem] p-1 shadow-[0_0_100px_rgba(124,58,237,0.15)] overflow-hidden animate-in zoom-in duration-500">
            <div className="bg-black/40 backdrop-blur-3xl rounded-[3.4rem] p-10 md:p-12 relative z-10">
              <button 
                onClick={closeModal}
                className="absolute top-8 right-8 p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>

              {isAdded ? (
                <div className="text-center py-12 space-y-8 animate-in zoom-in">
                  <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 relative">
                    <div className="absolute inset-0 bg-green-500/20 blur-2xl animate-pulse" />
                    <CheckCircle2 size={48} className="text-green-400 relative z-10" />
                  </div>
                  <h2 className="text-3xl font-serif font-black text-white">Added to Hub</h2>
                  <p className="text-gray-400 text-sm">Aura is synchronizing your selection...</p>
                </div>
              ) : (
                <div className="space-y-10">
                  <header className="flex items-center gap-8">
                    <div className="w-28 h-28 rounded-3xl overflow-hidden border border-white/10 shrink-0 shadow-2xl">
                      <img src={currentImageUrl} className="w-full h-full object-cover" alt={product.name} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-serif font-bold text-white mb-2">{product.name}</h2>
                      <div className="text-aura-purple font-black text-2xl tracking-tighter">৳{product.price.toLocaleString()}</div>
                    </div>
                  </header>

                  <div className="space-y-5">
                    <label className="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em] px-2">Quantity Allocation</label>
                    <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-[2rem]">
                      <button 
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-4 bg-white/5 hover:bg-white hover:text-black rounded-2xl transition-all text-white"
                      >
                        <Minus size={22} />
                      </button>
                      <span className="text-3xl font-black text-white tabular-nums">{quantity}</span>
                      <button 
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-4 bg-white/5 hover:bg-white hover:text-black rounded-2xl transition-all text-white"
                      >
                        <Plus size={22} />
                      </button>
                    </div>
                  </div>

                  <div className="pt-6 grid grid-cols-2 gap-6">
                    <button 
                      onClick={closeModal}
                      className="py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all border border-transparent hover:border-white/10"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddToCartModal}
                      className="bg-white text-black py-6 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-aura-purple hover:text-white transition-all shadow-2xl active:scale-95"
                    >
                      <ShoppingBag size={18} /> Confirm Order
                    </button>
                  </div>

                  <p className="text-[10px] text-center text-gray-600 uppercase tracking-[0.3em] font-black flex items-center justify-center gap-3">
                    <ShieldCheck size={14} className="text-aura-purple" /> Secure Neural Transaction
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};