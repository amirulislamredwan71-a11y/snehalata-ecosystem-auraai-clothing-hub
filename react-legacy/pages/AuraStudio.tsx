import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, Video, Image as ImageIcon, Brain, Search, MapPin, 
  Volume2, Loader2, Download, Maximize2, Layers, Zap, X, ShieldAlert,
  Camera, RefreshCw, CheckCircle2, User,
  Upload, Palette, Sliders, Info, Ruler, ArrowRight, Scan
} from 'lucide-react';
import { 
  generateAuraVideo, generateAuraProImage, generateAuraSpeech, 
  searchGroundedAura, mapsGroundedAura, complexThinkingAura,
  generateTryOnTransformation, generateStyleTransfer
} from '../services/geminiService';
import { getProducts, getVendors } from '../services/mockData';
import { BD_LOCATIONS } from '../services/locationData';
import { Product } from '../types';

export const AuraStudio: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'VIDEO' | 'IMAGE' | 'THINK' | 'SEARCH' | 'MAPS' | 'TRYON' | 'STYLE'>('IMAGE');
  const [prompt, setPrompt] = useState('');
  const [stylePrompt, setStylePrompt] = useState('Cyberpunk / Neon / Futuristic');
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  
  // AR Try-On & Style Transfer Specific States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.4);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const products = getProducts();
  const vendors = getVendors();
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');

  // Track API key selection status for high-end models (Veo, Pro Image)
  const [isKeySelected, setIsKeySelected] = useState<boolean | null>(null);

  useEffect(() => {
    // Initial check for selected API key as required by the Veo/Pro image model guidelines
    const checkKeySelection = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      }
    };
    checkKeySelection();
  }, []);

  // Cleanup stream on unmount or tool change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [activeTool, stream]);

  const startCamera = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } 
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setIsCameraActive(true);
      setCapturedImage(null);
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        setIsCameraActive(false);
        // Stop stream to save energy
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      }
    }
  };

  const handleOpenKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success immediately after opening to avoid race conditions per guidelines
      setIsKeySelected(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        setIsCameraActive(false);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRun = async () => {
    if (activeTool !== 'TRYON' && activeTool !== 'STYLE' && (!prompt.trim() || isProcessing)) return;
    if (activeTool === 'TRYON' && (!selectedProduct || (!capturedImage && !isCameraActive))) return;
    if (activeTool === 'STYLE' && (!capturedImage && !isCameraActive)) return;
    
    // Check for required API key selection before calling Veo or Pro Image models
    if (activeTool === 'VIDEO' || activeTool === 'IMAGE') {
      if (isKeySelected === false) {
        await handleOpenKeySelection();
        return;
      }
    }

    setIsProcessing(true);
    setResult(null);

    try {
      switch (activeTool) {
        case 'IMAGE': {
          const img = await generateAuraProImage(prompt, imageSize);
          setResult({ type: 'IMAGE', url: img });
          break;
        }
        case 'VIDEO': {
          const vidUrl = await generateAuraVideo(prompt, videoRatio);
          setResult({ type: 'VIDEO', url: vidUrl });
          break;
        }
        case 'THINK': {
          const thought = await complexThinkingAura(prompt);
          setResult({ type: 'TEXT', content: thought });
          break;
        }
        case 'SEARCH': {
          const searchData = await searchGroundedAura(prompt);
          setResult({ type: 'GROUNDED', ...searchData });
          break;
        }
        case 'MAPS': {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const mapsData = await mapsGroundedAura(prompt, pos.coords.latitude, pos.coords.longitude);
            setResult({ type: 'GROUNDED', ...mapsData });
          }, async () => {
            const mapsData = await mapsGroundedAura(prompt);
            setResult({ type: 'GROUNDED', ...mapsData });
          });
          break;
        }
        case 'TRYON': {
          const finalUserImg = capturedImage;
          if (isCameraActive && !capturedImage) {
            captureFrame();
            // Need a tiny delay for state sync if we capture at same time
            await new Promise(r => setTimeout(r, 100));
          }
          if (selectedProduct && (finalUserImg || capturedImage)) {
            const transformed = await generateTryOnTransformation(finalUserImg || (capturedImage as string), selectedProduct.imageUrl!);
            setResult({ type: 'TRYON', url: transformed, product: selectedProduct });
          }
          break;
        }
        case 'STYLE': {
          const baseImg = capturedImage;
          if (isCameraActive && !capturedImage) {
            captureFrame();
            await new Promise(r => setTimeout(r, 100));
          }
          if (baseImg || capturedImage) {
            const transformed = await generateStyleTransfer(baseImg || (capturedImage as string), stylePrompt);
            setResult({ type: 'STYLE', url: transformed });
          }
          break;
        }
      }
    } catch (error: any) {
      console.error(error);
      // Reset key selection if the request fails due to missing project/key entities
      if (error?.message?.includes('Requested entity was not found.')) {
        setIsKeySelected(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const playTTS = async (text: string) => {
    const base64 = await generateAuraSpeech(text);
    if (base64) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioCtx.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
    }
  };

  const filteredProducts = products.filter(p => {
    const vendor = vendors.find(v => v.id === p.vendorId);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesDistrict = districtFilter === 'All' || vendor?.district === districtFilter;
    return matchesCategory && matchesDistrict;
  });

  return (
    <div className="min-h-screen bg-aura-black pb-20 pt-10 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aura-purple/10 border border-aura-purple/20 mb-6">
            <Sparkles size={14} className="text-aura-purple" />
            <span className="text-[10px] font-black uppercase tracking-widest text-aura-purple">Neural Creative Hub</span>
          </div>
          <h1 className="text-5xl font-serif font-black text-white mb-4">Aura Studio</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Access the world's most advanced AI models for ecosystem growth. AR Try-On, Veo videos, and Grounded Intelligence.</p>
        </header>

        {/* API Key Selection UI for high-end models */}
        {isKeySelected === false && (activeTool === 'VIDEO' || activeTool === 'IMAGE') && (
           <div className="mb-12 p-8 bg-aura-purple/5 border border-aura-purple/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-5">
                 <div className="p-4 bg-aura-purple/10 rounded-2xl shadow-inner"><ShieldAlert className="text-aura-purple" /></div>
                 <div>
                    <h3 className="text-xl font-bold text-white mb-1">Select a Paid API Key</h3>
                    <p className="text-xs text-gray-500 max-w-sm">Generating video with Veo or high-res images with Pro 3.0 requires a billing-enabled project key.</p>
                 </div>
              </div>
              <div className="flex items-center gap-6">
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white transition-colors">Billing info</a>
                 <button onClick={handleOpenKeySelection} className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-aura-purple hover:text-white transition-all shadow-xl shadow-aura-purple/20">Select Key</button>
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Tool Selector */}
          <aside className="space-y-3">
            <ToolTab active={activeTool === 'TRYON'} icon={<Camera />} label="Neural AR Try-On" onClick={() => setActiveTool('TRYON')} sub="Flash 2.5 • Live Vision" />
            <ToolTab active={activeTool === 'STYLE'} icon={<Palette />} label="Style Transfer" onClick={() => setActiveTool('STYLE')} sub="Flash 2.5 • Creative" />
            <ToolTab active={activeTool === 'IMAGE'} icon={<ImageIcon />} label="Neural Image Pro" onClick={() => setActiveTool('IMAGE')} sub="Pro 3.0 • Up to 4K" />
            <ToolTab active={activeTool === 'VIDEO'} icon={<Video />} label="Cinematic Video" onClick={() => setActiveTool('VIDEO')} sub="Veo 3.1 • HD Motion" />
            <ToolTab active={activeTool === 'THINK'} icon={<Brain />} label="Thinking Mode" onClick={() => setActiveTool('THINK')} sub="Pro 3.0 • Logic Max" />
            <ToolTab active={activeTool === 'SEARCH'} icon={<Search />} label="Search Grounding" onClick={() => setActiveTool('SEARCH')} sub="Flash 3.0 • Live Web" />
            <ToolTab active={activeTool === 'MAPS'} icon={<MapPin />} label="Maps Grounding" onClick={() => setActiveTool('MAPS')} sub="Flash 2.5 • Geodata" />
          </aside>

          {/* Canvas Area */}
          <main className="lg:col-span-3 space-y-8">
            <div className="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] pointer-events-none" />
              
              <div className="relative z-10 space-y-6">
                {(activeTool === 'TRYON' || activeTool === 'STYLE') ? (
                  <div className="space-y-6">
                    {activeTool === 'TRYON' && (
                      <div className="flex flex-wrap justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10 gap-4">
                        <div className="flex gap-4 items-center overflow-x-auto no-scrollbar">
                          <div className="flex gap-2">
                            {['All', 'Kamiz', 'Saree', 'Panjabi', 'Jewelry'].map(cat => (
                              <button 
                                key={cat} 
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold border transition-all flex-shrink-0 ${categoryFilter === cat ? 'bg-aura-purple border-aura-purple text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                          <div className="h-4 w-px bg-white/10" />
                          <select 
                            value={districtFilter}
                            onChange={(e) => setDistrictFilter(e.target.value)}
                            className="bg-transparent text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-aura-purple transition-colors border-none"
                          >
                            <option value="All" className="bg-aura-black">All Districts</option>
                            {Object.keys(BD_LOCATIONS).sort().map(d => (
                              <option key={d} value={d} className="bg-aura-black">{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setShowSizeGuide(!showSizeGuide)} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-black hover:text-aura-purple transition-colors">
                            <Ruler size={14} /> Size Guide
                          </button>
                          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-black">
                            {selectedProduct ? `Selected: ${selectedProduct.name}` : 'Select an item to try on'}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTool === 'STYLE' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-aura-purple px-2">Neural Artistic Vibe</label>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                           {['Cyberpunk', 'Classic Oil', 'Sketch', 'Pop Art', 'Surrealism', 'Vaporwave'].map(v => (
                             <button 
                               key={v}
                               onClick={() => setStylePrompt(v)}
                               className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all flex-shrink-0 ${stylePrompt === v ? 'bg-aura-purple border-aura-purple text-white shadow-lg' : 'bg-white/5 border-white/10 text-gray-600 hover:text-white'}`}
                             >
                               {v}
                             </button>
                           ))}
                        </div>
                        <input 
                          type="text" 
                          value={stylePrompt}
                          onChange={(e) => setStylePrompt(e.target.value)}
                          placeholder="Or specify a custom artistic medium..."
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xs text-white focus:outline-none focus:border-aura-purple transition-all"
                        />
                      </div>
                    )}

                    {activeTool === 'TRYON' && showSizeGuide && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-aura-purple/5 border border-aura-purple/20 rounded-3xl p-6"
                      >
                         <div className="flex justify-between items-start mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-aura-purple flex items-center gap-2">
                              <Info size={14} /> Neural Fitting Guidelines & Measurements
                            </h4>
                            <button onClick={() => setShowSizeGuide(false)} className="text-gray-600 hover:text-white"><X size={14} /></button>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                               <div className="text-[10px] font-bold text-white uppercase tracking-widest pb-2 border-b border-white/5">Standard Fit Node Matrix (inches)</div>
                               <div className="space-y-2">
                                  <div className="flex justify-between text-[10px]">
                                     <span className="text-gray-500 uppercase tracking-widest">Small</span>
                                     <span className="text-white font-mono">Chest 36 • Length 40</span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                     <span className="text-gray-500 uppercase tracking-widest">Medium</span>
                                     <span className="text-white font-mono">Chest 38 • Length 42</span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                     <span className="text-gray-500 uppercase tracking-widest">Large</span>
                                     <span className="text-white font-mono">Chest 40 • Length 44</span>
                                  </div>
                               </div>
                            </div>
                            <div className="space-y-4">
                               <div className="text-[10px] font-bold text-white uppercase tracking-widest pb-2 border-b border-white/5">Neural Quality Assurance</div>
                               <p className="text-[10px] text-gray-500 leading-relaxed italic">"The engine automatically adjusts fabric drape based on identified shoulder-to-waist ratios. Ensure a clear silhouette for 98.4% fitting accuracy."</p>
                               <div className="flex gap-4">
                                  <div className="p-2 bg-aura-purple/10 rounded-lg flex items-center gap-2 border border-aura-purple/20">
                                     <CheckCircle2 size={10} className="text-aura-purple" />
                                     <span className="text-[8px] font-black uppercase text-aura-purple">HD Mapping OK</span>
                                  </div>
                                  <div className="p-2 bg-green-500/10 rounded-lg flex items-center gap-2 border border-green-500/20">
                                     <Zap size={10} className="text-green-500" />
                                     <span className="text-[8px] font-black uppercase text-green-500">Live Calibration Active</span>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {activeTool === 'TRYON' && (
                      <div className="overflow-x-auto no-scrollbar flex gap-4 pb-4">
                        {filteredProducts.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setSelectedProduct(p)}
                            className={`flex-shrink-0 w-32 h-40 rounded-2xl overflow-hidden border-2 transition-all group relative ${selectedProduct?.id === p.id ? 'border-aura-purple scale-95 ring-4 ring-aura-purple/20' : 'border-white/10 hover:border-white/30'}`}
                          >
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black to-transparent">
                              <div className="text-[8px] font-black uppercase text-white truncate">{p.name}</div>
                              <div className="text-[8px] font-bold text-gray-400">৳{p.price.toLocaleString()}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      activeTool === 'IMAGE' ? "A hyper-realistic Dhakai Jamdani loom with cinematic lighting..." :
                      activeTool === 'VIDEO' ? "A drone shot over the busy streets of Dhaka at night..." :
                      "Type your complex query or creative prompt here..."
                    }
                    className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white focus:outline-none focus:border-aura-purple transition-all placeholder:text-gray-700 resize-none"
                  />
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex gap-4">
                    {activeTool === 'IMAGE' && (
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-2">Scale</label>
                        <select 
                          value={imageSize} 
                          onChange={(e) => setImageSize(e.target.value as any)}
                          className="bg-transparent text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-aura-purple transition-colors"
                        >
                          <option value="1K" className="bg-aura-black">1K Pro</option>
                          <option value="2K" className="bg-aura-black">2K Ultra</option>
                          <option value="4K" className="bg-aura-black">4K Neural</option>
                        </select>
                      </div>
                    )}
                    {activeTool === 'VIDEO' && (
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-2xl">
                        <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 pl-2">Aspect</label>
                        <select 
                          value={videoRatio} 
                          onChange={(e) => setVideoRatio(e.target.value as any)}
                          className="bg-transparent text-white text-[10px] font-black uppercase tracking-wider focus:outline-none cursor-pointer pr-4 hover:text-aura-purple transition-colors"
                        >
                          <option value="16:9" className="bg-aura-black">16:9 Cinematic</option>
                          <option value="9:16" className="bg-aura-black">9:16 Social</option>
                        </select>
                      </div>
                    )}
                    {(activeTool === 'TRYON' || activeTool === 'STYLE') && (
                      <div className="flex gap-3">
                         <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleFileUpload} 
                           accept="image/*" 
                           className="hidden" 
                         />
                         <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="px-6 py-4 bg-white/5 border border-white/10 text-gray-300 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-xl"
                         >
                           <Upload size={14} /> Upload Node Photo
                         </button>
                         <button 
                           onClick={startCamera}
                           className="px-6 py-4 bg-aura-purple/10 border border-aura-purple/20 text-aura-purple rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-aura-purple hover:text-white transition-all shadow-xl shadow-aura-purple/5"
                         >
                           <RefreshCw size={14} /> {isCameraActive ? 'Reset Vision' : 'Activate Vision'}
                         </button>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleRun}
                    disabled={isProcessing || (activeTool === 'TRYON' && !selectedProduct) || (!capturedImage && !isCameraActive && (activeTool === 'TRYON' || activeTool === 'STYLE'))}
                    className="bg-white text-black px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center gap-3 hover:bg-aura-purple hover:text-white transition-all shadow-xl disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                    {isProcessing ? 'Synthesizing...' : activeTool === 'TRYON' ? 'Synthesize AR Look' : activeTool === 'STYLE' ? 'Synthesize Style' : 'Generate with Aura'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Area */}
            <div className={`bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] min-h-[500px] flex items-center justify-center relative overflow-hidden ${activeTool === 'TRYON' ? 'aspect-video' : ''}`}>
               {/* Neural Processing Scan Line */}
               {isProcessing && (
                 <motion.div 
                   initial={{ top: '-10%' }}
                   animate={{ top: '110%' }}
                   transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                   className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-aura-purple to-transparent z-20 shadow-[0_0_20px_rgba(124,58,237,1)]"
                 />
               )}
               
               {isProcessing ? (
                 <div className="flex flex-col items-center gap-6 relative z-10">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-aura-purple border-t-transparent rounded-full animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap size={14} className="text-aura-purple animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-aura-purple">Synthesizing Neural Flow</p>
                      <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Applying style matrices • Map reconstruction</p>
                    </div>
                 </div>
               ) : result ? (
                 <div className="w-full h-full p-6">
                    {result.type === 'IMAGE' && (
                      <div className="group relative rounded-3xl overflow-hidden shadow-2xl">
                        <img src={result.url} className="w-full h-auto object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                           <button className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform"><Download size={20} /></button>
                           <button className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform"><Maximize2 size={20} /></button>
                        </div>
                      </div>
                    )}
                    {result.type === 'VIDEO' && (
                      <div className="rounded-3xl overflow-hidden shadow-2xl bg-black aspect-video">
                        <video src={result.url} controls className="w-full h-full" autoPlay loop muted />
                      </div>
                    )}
                    {result.type === 'TEXT' && (
                      <div className="p-10 text-gray-200 leading-relaxed font-light whitespace-pre-wrap text-lg animate-in fade-in slide-in-from-bottom-4">
                         {result.content}
                         <button onClick={() => playTTS(result.content)} className="mt-8 flex items-center gap-2 px-6 py-3 bg-aura-purple text-white rounded-xl text-xs font-bold uppercase tracking-widest"><Volume2 size={16} /> Listen to Aura</button>
                      </div>
                    )}
                    {result.type === 'GROUNDED' && (
                        <div className="space-y-8 animate-in fade-in">
                            <div className="p-10 bg-white/[0.02] rounded-[2rem] border border-white/5 text-gray-300 leading-relaxed text-lg">
                                {result.text}
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[10px] uppercase tracking-widest font-black text-aura-purple px-4">Sources & Verified Grounds</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.sources.map((chunk: any, i: number) => (
                                        <a key={i} href={chunk.web?.uri || chunk.maps?.uri} target="_blank" className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-aura-purple transition-all flex items-center justify-between group">
                                            <span className="text-xs font-bold text-white truncate max-w-[200px]">{chunk.web?.title || chunk.maps?.title || "Verification Link"}</span>
                                            <ArrowRight size={14} className="text-gray-600 group-hover:text-aura-purple" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    {result.type === 'TRYON' && (
                      <div className="relative w-full h-full animate-in zoom-in duration-700">
                        <img src={result.url} className="w-full h-full object-contain rounded-3xl" />
                        <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                          <CheckCircle2 size={16} className="text-green-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Try-On Complete</span>
                        </div>
                        <div className="absolute bottom-6 right-6 p-6 bg-aura-glass backdrop-blur-3xl border border-aura-glassBorder rounded-[2rem] flex items-center gap-6 shadow-2xl">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                            <img src={result.product.imageUrl} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-aura-purple mb-1">{result.product.category}</div>
                            <div className="text-white font-bold">{result.product.name}</div>
                            <div className="text-green-400 font-mono text-sm mt-1">৳{result.product.price.toLocaleString()}</div>
                          </div>
                          <button className="px-6 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-aura-purple hover:text-white transition-all">Add to Cart</button>
                        </div>
                      </div>
                    )}
                    {result.type === 'STYLE' && (
                      <div className="relative w-full h-full animate-in zoom-in duration-700">
                        <img src={result.url} className="w-full h-full object-contain rounded-3xl" />
                        <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
                          <Palette size={16} className="text-aura-purple" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Neural Style Transfer Applied</span>
                        </div>
                        <button className="absolute bottom-6 right-6 p-6 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-transform"><Download size={24} /></button>
                      </div>
                    )}
                 </div>
               ) : (activeTool === 'TRYON' || activeTool === 'STYLE') ? (
                 <div className="w-full h-full relative group">
                    <canvas ref={canvasRef} className="hidden" />
                    {isCameraActive ? (
                      <div className="relative w-full h-full bg-black">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover scale-x-[-1]" 
                        />
                        <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] border-2 border-dashed border-aura-purple/40 rounded-[3rem] pointer-events-none">
                           <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-aura-purple rounded-tl-3xl"></div>
                           <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-aura-purple rounded-tr-3xl"></div>
                           <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-aura-purple rounded-bl-3xl"></div>
                           <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-aura-purple rounded-br-3xl"></div>
                        </div>

                        {/* Live Product Overlay Preview */}
                        {activeTool === 'TRYON' && selectedProduct && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div 
                               className="relative w-1/2 h-2/3 shadow-[0_0_100px_rgba(124,58,237,0.2)] animate-pulse"
                               style={{ opacity: overlayOpacity }}
                             >
                                <img src={selectedProduct.imageUrl} className="w-full h-full object-contain mix-blend-screen" />
                                <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase tracking-[0.4em] text-aura-purple bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">Live Projection Overlay</div>
                             </div>
                             
                             <div className="absolute right-10 top-1/2 -translate-y-1/2 w-8 h-48 bg-white/5 border border-white/10 rounded-full flex flex-col items-center justify-between py-6 pointer-events-auto">
                                <span className="text-[8px] font-black vertical-text uppercase tracking-widest text-gray-500">Overlay</span>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="1" 
                                  step="0.01" 
                                  value={overlayOpacity}
                                  onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                                  className="appearance-none w-32 -rotate-90 bg-aura-purple/20 rounded-full h-1 cursor-pointer accent-aura-purple" 
                                />
                                <Sliders size={14} className="text-aura-purple" />
                             </div>
                          </div>
                        )}
                        
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                           <button 
                             onClick={captureFrame}
                             className="w-20 h-20 bg-white rounded-full border-8 border-white/20 shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
                           >
                              <div className="w-6 h-6 bg-aura-purple rounded-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                           </button>
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-white/10">Capture Neural Silhouette</p>
                        </div>
                      </div>
                    ) : capturedImage ? (
                      <div className="relative w-full h-full p-4">
                        <img src={capturedImage} className="w-full h-full object-contain rounded-3xl" />
                        <div className="absolute top-6 right-6 flex gap-4">
                           <button onClick={() => setCapturedImage(null)} className="p-3 bg-red-500/20 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-xl"><X size={20} /></button>
                        </div>
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
                           <p className="text-[10px] font-black uppercase tracking-widest text-white mb-4">Node Profile Captured. Ready for Neural Processing.</p>
                           <div className="flex gap-4 justify-center">
                              <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Re-upload</button>
                              <div className="w-px h-3 bg-white/10" />
                              <button onClick={startCamera} className="text-[10px] font-black uppercase tracking-widest text-aura-purple hover:text-white transition-colors">Re-take Photo</button>
                           </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-8 text-center p-10">
                        <div className="flex gap-6">
                            <div className="p-10 bg-white/5 rounded-[3rem] border border-white/10 group-hover:border-aura-purple/30 transition-all duration-700 shadow-inner">
                              <User size={64} className="text-gray-500 group-hover:text-aura-purple transition-colors" />
                            </div>
                            <div className="p-10 bg-aura-purple/5 rounded-[3rem] border border-aura-purple/10 border-dashed animate-pulse flex items-center justify-center">
                              <Scan size={64} className="text-aura-purple/40" />
                            </div>
                        </div>
                        <div>
                          <h3 className="text-3xl font-serif font-black text-white mb-3 uppercase tracking-tighter">Neural Grid Vision</h3>
                          <p className="text-gray-500 text-sm max-w-sm">Capture or upload your silhouette to start the <span className="text-aura-purple font-black">Neural AR</span> transformation.</p>
                        </div>
                        <div className="flex gap-4">
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="px-8 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all shadow-xl"
                            >
                              Upload Silhouette
                            </button>
                            <button 
                              onClick={startCamera}
                              className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-aura-purple hover:text-white transition-all shadow-2xl"
                            >
                              Activate Live Vision
                            </button>
                        </div>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="text-center space-y-4 opacity-20">
                    <Layers size={64} className="mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Canvas Ready for Generation</p>
                 </div>
               )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const ToolTab = ({ active, icon, label, sub, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full text-left p-6 rounded-3xl border transition-all flex items-center gap-4 ${active ? 'bg-aura-purple border-aura-purple shadow-[0_10px_30px_rgba(124,58,237,0.3)]' : 'bg-aura-glass border-aura-glassBorder hover:border-aura-purple/50'}`}
  >
    <div className={`p-3 rounded-2xl ${active ? 'bg-white/20' : 'bg-white/5'}`}>{icon}</div>
    <div>
      <div className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-gray-300'}`}>{label}</div>
      <div className={`text-[8px] uppercase tracking-widest mt-1 ${active ? 'text-white/60' : 'text-gray-600'}`}>{sub}</div>
    </div>
  </button>
);

