
import React, { useState, useEffect } from 'react';
import { Link } from '../components/Navigation';
import { useParams } from '../lib/router';
import { getOrderById } from '../services/mockData';
import { Order } from '../types';
import { 
  Search, Truck, MapPin, 
  Loader2, ArrowRight, Navigation2, Zap, Volume2, 
  Clock, ShieldCheck, Box, AlertCircle, Sparkles
} from 'lucide-react';
import { generateAuraSpeech } from '../services/geminiService';

export const OrderTracking: React.FC = () => {
  const { orderId: paramOrderId } = useParams<{ orderId: string }>();
  const [searchInput, setSearchInput] = useState(paramOrderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fetchOrder = (id: string) => {
    setLoading(true);
    setError('');
    
    setTimeout(() => {
        const foundOrder = getOrderById(id);
        if (foundOrder) {
            setOrder(foundOrder);
        } else {
            setOrder(null);
            setError('অর্ডারটি খুঁজে পাওয়া যায়নি। দয়া করে Order ID টি চেক করুন। (Try: ORD-5001)');
        }
        setLoading(false);
    }, 1200);
  };

  useEffect(() => {
    if (paramOrderId) {
      // Use microtask to avoid synchronous setState inside effect
      Promise.resolve().then(() => fetchOrder(paramOrderId));
    }
  }, [paramOrderId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
        window.location.hash = `/tracking/${searchInput}`;
    }
  };

  const playStatusBriefing = async () => {
    if (!order || isSpeaking) return;
    setIsSpeaking(true);
    const text = `আসসালামু আলাইকুম। আপনার অর্ডার ${order.id} বর্তমানে ${order.currentStatus} পর্যায়ে আছে। এটি ${order.estimatedDelivery} তারিখের মধ্যে আপনার ঠিকানায় পৌঁছাবে বলে আশা করা হচ্ছে।`;
    
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
        source.onended = () => setIsSpeaking(false);
        source.start();
    } else {
        setIsSpeaking(false);
    }
  };

  return (
    <div className="min-h-screen bg-aura-black pb-32 selection:bg-aura-purple selection:text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Hub Navigation Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-aura-purple/10 border border-aura-purple/20 mb-4">
                 <Navigation2 size={14} className="text-aura-purple" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-aura-purple">Neural Logistics System</span>
              </div>
              <h1 className="text-5xl font-serif font-black text-white">Neural Hub <span className="text-aura-purple">Tracking</span></h1>
           </div>

           <div className="w-full md:w-96">
                <form onSubmit={handleSearch} className="relative flex items-center bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-aura-purple transition-all p-1">
                    <Search className="ml-4 text-gray-600" size={18} />
                    <input 
                        type="text" 
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="TRACK ID: ORD-5001" 
                        className="flex-1 bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-gray-700 font-mono text-sm"
                    />
                    <button type="submit" className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-aura-purple hover:text-white transition-all">
                        Locate
                    </button>
                </form>
           </div>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="relative">
                    <Loader2 className="animate-spin text-aura-purple" size={64} />
                    <Sparkles className="absolute inset-0 m-auto text-white animate-pulse" size={24} />
                </div>
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Syncing with Aura Neural Grid...</p>
            </div>
        ) : error ? (
            <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto animate-in fade-in zoom-in">
                <AlertCircle className="mx-auto text-red-500 mb-6" size={48} />
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Order Not Synced</h2>
                <p className="text-gray-500 text-sm mb-8">{error}</p>
                <Link to="/" className="text-aura-purple font-black uppercase tracking-widest text-xs hover:underline">Explore Hub Collections</Link>
            </div>
        ) : order ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                
                {/* Status Command Center - Left (Timeline) */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-serif font-bold text-white">Track Progression</h2>
                            <button 
                                onClick={playStatusBriefing}
                                disabled={isSpeaking}
                                className={`p-3 rounded-xl transition-all ${isSpeaking ? 'bg-aura-purple text-white animate-pulse' : 'bg-white/5 text-aura-purple border border-aura-purple/20 hover:bg-aura-purple hover:text-white'}`}
                            >
                                <Volume2 size={20} />
                            </button>
                        </div>

                        <div className="relative pl-10 space-y-12">
                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-white/5"></div>
                            {order.timeline.map((step, index) => (
                                <div key={index} className={`relative group ${step.completed ? 'opacity-100' : 'opacity-20'}`}>
                                    <div className={`absolute -left-[10px] top-0 w-5 h-5 rounded-full border-4 border-aura-black z-10 transition-all duration-500 ${
                                        step.completed ? 'bg-aura-purple shadow-[0_0_15px_rgba(124,58,237,0.8)]' : 'bg-gray-800'
                                    }`}>
                                        {step.status === order.currentStatus && <div className="absolute inset-0 bg-aura-purple rounded-full animate-ping opacity-50"></div>}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-white group-hover:text-aura-purple transition-colors">{step.label}</h4>
                                            <span className="text-[9px] font-mono text-gray-600">{step.timestamp}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-500 leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-aura-purple/5 border border-aura-purple/10 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="text-aura-purple" size={20} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white">Neural Delivery Insights</h3>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed italic">
                            "Aura has analyzed current traffic patterns in {order.currentStatus === 'SHIPPED' ? 'Dhaka South' : 'the Hub'}. 
                            Expect arrival {order.currentStatus === 'SHIPPED' ? 'precisely at 4:30 PM' : 'on schedule'}. Weather: Optimal."
                        </p>
                    </div>
                </div>

                {/* Visual Command Area - Right (Map & Details) */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Simulated Live Map */}
                    <div className="bg-aura-glass border border-aura-glassBorder rounded-[3rem] overflow-hidden relative group h-[500px] shadow-2xl">
                        <div className="absolute inset-0 bg-[#0a0a0a]">
                             {/* Map Grid Pattern */}
                             <div className="absolute inset-0 opacity-10" style={{ 
                                backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                                backgroundSize: '40px 40px'
                             }} />
                             {/* Simulated Path */}
                             <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 500">
                                <path d="M100 400 Q 200 100, 400 250 T 700 100" stroke="#7c3aed" strokeWidth="4" fill="none" strokeDasharray="10,10" />
                                <circle cx="100" cy="400" r="8" fill="#7c3aed" />
                                <circle cx="700" cy="100" r="8" fill="#10b981" />
                             </svg>
                             {/* Moving Courier Icon */}
                             <div className="absolute" style={{ top: '25%', left: '45%' }}>
                                <div className="relative animate-bounce">
                                    <div className="absolute inset-0 bg-aura-purple blur-xl rounded-full opacity-40 scale-150"></div>
                                    <div className="bg-aura-purple p-4 rounded-2xl border border-white/20 shadow-2xl relative z-10">
                                        <Truck className="text-white" size={32} />
                                    </div>
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-black/50 blur-sm rounded-full"></div>
                                </div>
                                <div className="mt-6 bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full whitespace-nowrap">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Courier ID: Aura-Logix-09</span>
                                </div>
                             </div>
                        </div>

                        {/* Map HUD Overlays */}
                        <div className="absolute top-8 left-8 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl">
                             <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Real-time Location</div>
                             <div className="text-white font-serif text-lg font-bold flex items-center gap-2">
                                <MapPin className="text-aura-purple" size={18} /> Banani High Road, Sec 2
                             </div>
                        </div>

                        <div className="absolute bottom-8 right-8 p-6 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl">
                             <div className="flex items-center gap-6">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Distance</div>
                                    <div className="text-white font-bold">2.4 KM</div>
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Speed</div>
                                    <div className="text-white font-bold">32 KM/H</div>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Order Meta Footer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DetailCard icon={<Box className="text-aura-purple" />} title="Package" value={`${order.items.length} Eco-Certified Items`} />
                        <DetailCard icon={<ShieldCheck className="text-green-500" />} title="Security" value="Aura Quality Insured" />
                        <DetailCard icon={<Clock className="text-amber-500" />} title="ETA" value={order.estimatedDelivery} />
                    </div>

                    <div className="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-10">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-serif font-bold text-white">Package Manifest</h3>
                            <div className="text-2xl font-black text-white">৳{order.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="space-y-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-6 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-aura-purple/30 transition-all">
                                    <img src={item.imageUrl} className="w-16 h-16 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                                        <p className="text-[10px] text-gray-600 uppercase font-black tracking-widest">{item.category}</p>
                                    </div>
                                    <Link to={`/store/royal-bengal-looms`} className="text-gray-600 hover:text-aura-purple">
                                        <ArrowRight size={20} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        ) : null}

      </div>
    </div>
  );
};

const DetailCard = ({ icon, title, value }: any) => (
    <div className="bg-aura-glass border border-aura-glassBorder rounded-3xl p-6 flex items-center gap-4 hover:border-aura-purple/30 transition-all">
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10">{icon}</div>
        <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">{title}</div>
            <div className="text-xs font-bold text-white">{value}</div>
        </div>
    </div>
);
