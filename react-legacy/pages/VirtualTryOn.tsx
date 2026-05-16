import React, { useState, useEffect } from 'react';
import { Link } from '../components/Navigation';
import { useParams } from '../lib/router';
import { getProducts } from '../services/mockData';
import { Product } from '../types';
import { ArrowLeft, Upload, Sparkles, RefreshCcw, Camera, X, ShoppingBag, CheckCircle2, Trash2 } from 'lucide-react';
import { generateTryOnTransformation, generateStyleSuggestion } from '../services/geminiService';

export const VirtualTryOn: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [allProducts] = useState<Product[]>(getProducts());
  const [product, setProduct] = useState<Product | undefined>(() => {
    if (id) {
      return getProducts().find(p => p.id === Number(id));
    }
    return undefined;
  });
  const [userImage, setUserImage] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(product?.imageUrl || null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
       generateStyleSuggestion(product.name, product.category || 'Apparel').then(setSuggestion);
    } else {
       // Wrap in a promise to keep it async even for simple value updates
       Promise.resolve().then(() => setSuggestion(null));
    }
  }, [product]);

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

  const processFile = (file: File, type: 'user' | 'product') => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'user') {
            setUserImage(reader.result as string);
        } else {
            setProductImage(reader.result as string);
            setProduct(undefined); // Clear linked product if custom uploaded
        }
        setGeneratedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'user' | 'product') => {
    const file = e.target.files?.[0];
    if (file) {
        processFile(file, type);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'user' | 'product') => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files?.[0];
      if (file) {
          processFile(file, type);
      }
  };

  const selectCatalogProduct = (p: Product) => {
    setProduct(p);
    setProductImage(p.imageUrl || null);
    setGeneratedImage(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!userImage || !productImage) return;
    setIsProcessing(true);
    setError(null);

    try {
        let productBase64 = "";
        
        if (productImage.startsWith('data:')) {
            productBase64 = productImage;
        } else {
            try {
                productBase64 = await convertUrlToBase64(productImage);
            } catch (e) {
                setError("ইকোসিস্টেমের ছবি অ্যাক্সেস করতে সমস্যা হচ্ছে। দয়া করে আপনার ডিভাইসে ছবিটি ডাউনলোড করে আপলোড করুন।");
                setIsProcessing(false);
                return;
            }
        }

        const result = await generateTryOnTransformation(userImage, productBase64);
        
        if (result) {
            setGeneratedImage(result);
        } else {
            setError("AI ট্রান্সফরমেশন ব্যর্থ হয়েছে। দয়া করে আরো পরিষ্কার ছবি ব্যবহার করে পুনরায় চেষ্টা করুন।");
        }
    } catch (err) {
        setError("একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। Aura সিস্টেম পুনরায় চেক করা হচ্ছে।");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20 selection:bg-aura-purple selection:text-white">
       <div className="max-w-7xl mx-auto px-6 py-10">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors text-xs font-bold uppercase tracking-widest">
             <ArrowLeft size={14} /> Back to Hub
          </Link>

          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Control Panel */}
            <div className="w-full lg:w-1/3 space-y-8">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-white mb-3">
                        Aura <span className="text-aura-purple">Vision</span> Try-On
                    </h1>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        আপনার নিজের ফটো এবং পোশাকের ছবি আপলোড করুন অথবা আমাদের কালেকশন থেকে বেছে নিন। Aura AI আপনাকে রিয়েল-টাইম প্রিভিউ দেখাবে।
                    </p>
                </div>

                {/* STEP 1: YOUR PHOTO */}
                <div className="space-y-3">
                    <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">1</span> 
                        আপনার ছবি দিন
                    </h3>
                    <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'user')}
                        className={`relative h-48 rounded-2xl border-2 border-dashed transition-all overflow-hidden ${userImage ? 'border-aura-purple bg-aura-purple/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                    >
                        {userImage ? (
                            <>
                                <img src={userImage} alt="User" className="w-full h-full object-cover" />
                                <button onClick={() => setUserImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors">
                                    <X size={14} />
                                </button>
                            </>
                        ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center">
                                <Camera className="text-gray-500 mb-2" size={24} />
                                <span className="text-xs font-bold text-gray-400">আপনার ছবি আপলোড করুন</span>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'user')} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* STEP 2: THE ITEM */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">2</span> 
                            পোশাক নির্বাচন করুন
                        </h3>
                        {/* Direct Upload Option */}
                        <label className="cursor-pointer text-[9px] font-bold text-aura-purple hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
                            <Upload size={10} /> Upload Custom
                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} className="hidden" />
                        </label>
                    </div>
                    
                    <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, 'product')}
                        className={`relative h-48 rounded-2xl border-2 border-dashed transition-all overflow-hidden ${productImage ? 'border-aura-purple bg-aura-purple/5' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                    >
                        {productImage ? (
                            <div className="w-full h-full flex p-3 gap-4">
                                <div className="w-1/3 h-full rounded-xl overflow-hidden border border-white/10 bg-black/20">
                                    <img src={productImage} alt="Item" className="w-full h-full object-contain" />
                                </div>
                                <div className="flex-1 flex flex-col justify-center py-2">
                                    <h4 className="text-white font-bold text-sm truncate">{product ? product.name : 'Custom Upload'}</h4>
                                    <p className="text-xs text-gray-500 mb-4">{product ? `৳${product.price.toLocaleString()}` : 'User provided image'}</p>
                                    <div className="flex gap-2">
                                        <label className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer" title="Replace Image">
                                            <RefreshCcw size={14} />
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} className="hidden" />
                                        </label>
                                        <button 
                                            onClick={() => {setProductImage(null); setProduct(undefined);}} 
                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                            title="Remove"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center group">
                                <div className="p-4 bg-white/5 rounded-full mb-3 group-hover:bg-aura-purple/20 transition-colors">
                                    <Upload className="text-gray-400 group-hover:text-aura-purple" size={24} />
                                </div>
                                <span className="text-xs font-bold text-gray-300 group-hover:text-white">Upload Product Image</span>
                                <span className="text-[9px] text-gray-600 mt-1 uppercase tracking-widest">or drag & drop here</span>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'product')} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {suggestion && (
                    <div className="p-4 bg-gradient-to-r from-aura-purple/10 to-transparent border border-aura-purple/20 rounded-2xl flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="p-2 bg-aura-purple/20 rounded-lg h-fit">
                            <Sparkles size={14} className="text-aura-purple shrink-0" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-aura-purple mb-1">Aura Suggestion</p>
                            <p className="text-xs text-gray-300 italic leading-relaxed">"{suggestion}"</p>
                        </div>
                    </div>
                )}

                <button 
                    onClick={handleGenerate}
                    disabled={!userImage || !productImage || isProcessing}
                    className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all ${
                        !userImage || !productImage || isProcessing 
                        ? 'bg-white/10 text-gray-500 cursor-not-allowed opacity-50' 
                        : 'bg-white text-black hover:bg-aura-purple hover:text-white shadow-[0_0_30px_rgba(124,58,237,0.3)]'
                    }`}
                >
                    {isProcessing ? (
                        <>
                           <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                           Aura AI জেনারেট করছে...
                        </>
                    ) : (
                        <>
                           <Sparkles size={16} /> জেনারেট প্রিভিউ
                        </>
                    )}
                </button>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 leading-relaxed animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}
                
                {/* Catalog Quick Browse */}
                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-600 mb-4 flex items-center gap-2">
                        <ShoppingBag size={12} /> কালেকশন থেকে বেছে নিন
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        {allProducts.slice(0, 4).map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => selectCatalogProduct(p)}
                                className={`aspect-square rounded-lg overflow-hidden border transition-all ${product?.id === p.id ? 'border-aura-purple scale-95 ring-2 ring-aura-purple/20' : 'border-white/5 hover:border-white/20'}`}
                            >
                                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Display Area */}
            <div className="flex-1 h-[700px] bg-white/5 border border-white/10 rounded-[32px] overflow-hidden relative flex items-center justify-center shadow-2xl">
                {/* Visual Glow */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-aura-purple/10 blur-[100px] rounded-full" />
                
                {generatedImage ? (
                    <div className="w-full h-full p-2 relative animate-in fade-in zoom-in duration-700">
                        <img src={generatedImage} alt="AI Result" className="w-full h-full object-contain rounded-2xl" />
                        <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white">
                            <CheckCircle2 size={12} className="text-green-400" /> Aura AI Verified Result
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-6 max-w-sm px-6">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 animate-pulse-slow">
                            <Sparkles size={32} className="text-aura-purple" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold text-white opacity-40">Aura Vision Preview</h2>
                        <p className="text-sm text-gray-600 leading-relaxed italic">
                            "আপনার স্টাইল, আপনার নিয়ম। Aura AI আপনার কল্পনাকে বাস্তব রূপ দেবে।"
                        </p>
                    </div>
                )}
                
                {/* Loader Overlay */}
                {isProcessing && (
                    <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-aura-purple/20 border-t-aura-purple rounded-full animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto text-aura-purple animate-pulse" size={24} />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white animate-pulse">Aura is thinking...</p>
                    </div>
                )}
            </div>

          </div>
       </div>
    </div>
  );
};