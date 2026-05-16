import React, { useState, useEffect } from 'react';
import { Link } from '../components/Navigation';
import { useParams } from '../lib/router';
import { 
  History, ArrowRight, ShoppingBag, Clock, CheckCircle2, Truck, 
  Search, ChevronLeft, MapPin, ShieldCheck, Calendar, Navigation2,
  FileText, X
} from 'lucide-react';
import { Order, OrderStatus } from '../types';
import { getOrders } from '../services/mockData';
import { OrderReceipt } from '../components/OrderReceipt';

export const OrderHistory: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [isLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const selectedOrder = React.useMemo(() => {
    if (!orderId) return null;
    return orders.find(o => o.id === orderId) || null;
  }, [orderId, orders]);

  const fetchOrders = React.useCallback(() => {
    const data = getOrders();
    setOrders(data);
  }, []);

  useEffect(() => {
    // Orders are initialized in useState, so we only need to listen for updates
    // Listen for order updates from Cart or Backend
    window.addEventListener('orderUpdated', fetchOrders);
    window.addEventListener('cartUpdated', fetchOrders); // Keep legacy listener just in case
    return () => {
        window.removeEventListener('orderUpdated', fetchOrders);
        window.removeEventListener('cartUpdated', fetchOrders);
    };
  }, [fetchOrders]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED': return 'text-green-400 border-green-400/20 bg-green-400/10';
      case 'SHIPPED': return 'text-aura-purple border-aura-purple/20 bg-aura-purple/10';
      case 'QUALITY_CHECK': return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
      case 'PLACED': return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
      default: return 'text-amber-400 border-amber-400/20 bg-amber-400/10';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle2 size={14} />;
      case 'SHIPPED': return <Truck size={14} />;
      case 'QUALITY_CHECK': return <Search size={14} />;
      default: return <Clock size={14} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-aura-purple border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px]">Aura Retrieval Active...</p>
      </div>
    );
  }

  // --- ORDER DETAILS VIEW ---
  if (selectedOrder) {
    return (
      <div className="min-h-screen bg-aura-black pb-20 pt-10 px-6 animate-in fade-in duration-500">
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-12">
                <Link to="/orders" className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Log
                </Link>
                <button 
                    onClick={() => setShowReceipt(true)}
                    className="flex items-center gap-2 bg-aura-purple/10 border border-aura-purple/20 text-aura-purple px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-aura-purple hover:text-white transition-all"
                >
                    <FileText size={14} /> View Hub Receipt
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                    <div className="bg-aura-glass border border-aura-glassBorder rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-aura-purple/5 blur-[120px] rounded-full"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                            <div className="space-y-4">
                                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border w-fit text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedOrder.currentStatus)}`}>
                                    {getStatusIcon(selectedOrder.currentStatus)}
                                    {selectedOrder.currentStatus.replace('_', ' ')}
                                </div>
                                <h1 className="text-5xl font-serif font-black text-white leading-tight">Order Insight <span className="text-aura-purple">#{selectedOrder.id.split('-')[1]}</span></h1>
                                <p className="text-gray-500 text-sm max-w-sm">Synchronized with Aura Neural Hub. Security verified for artisan-to-customer direct transfer.</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] h-fit text-center min-w-[160px]">
                                <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Final Amount</div>
                                <div className="text-3xl font-black text-white">৳{selectedOrder.totalAmount.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-aura-glass border border-aura-glassBorder rounded-[3rem] p-10 shadow-2xl">
                        <h3 className="text-xl font-serif font-bold text-white mb-12 flex items-center gap-3"><Navigation2 className="text-aura-purple" /> Node Propagation Timeline</h3>
                        <div className="relative pl-12 space-y-12">
                            <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-white/5" />
                            {selectedOrder.timeline.map((step, idx) => (
                                <div key={idx} className={`relative flex gap-10 transition-all duration-700 ${step.completed ? 'opacity-100' : 'opacity-20'}`}>
                                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 z-10 ${step.completed ? 'bg-aura-purple border-aura-purple text-white shadow-[0_0_20px_rgba(124,58,237,0.4)]' : 'bg-black border-white/5 text-gray-700'}`}>
                                        {step.completed ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-lg font-bold text-white">{step.label}</h4>
                                            <span className="text-[10px] font-mono text-gray-500">{step.timestamp}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 leading-relaxed font-light">{step.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 shadow-2xl">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-aura-purple mb-8">Manifest Details</h4>
                        <div className="space-y-4">
                            {selectedOrder.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-aura-purple/30 transition-all">
                                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                        <img src={item.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt={item.name} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
                                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest">{item.category}</p>
                                    </div>
                                    <div className="text-sm font-black text-white">৳{item.price.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8">
                        <div className="space-y-6">
                            <DetailRow label="Delivery Target" value="Uttara, Sector 4, Dhaka" icon={<MapPin size={16} />} />
                            <DetailRow label="Security Hash" value="SHA-256 Verified" icon={<ShieldCheck size={16} />} />
                            <DetailRow label="Est. Arrival" value={selectedOrder.estimatedDelivery} icon={<Calendar size={16} />} />
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Modal Overlay for Receipt */}
        {showReceipt && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in">
                <div className="relative w-full max-w-2xl">
                    <button 
                        onClick={() => setShowReceipt(false)}
                        className="absolute -top-12 right-0 p-3 bg-white/5 hover:bg-red-500 text-white rounded-2xl transition-all"
                    >
                        <X size={24} />
                    </button>
                    <OrderReceipt order={selectedOrder} />
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <div className="min-h-screen bg-aura-black pb-20 pt-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-16">
            <div className="p-4 bg-aura-purple/10 border border-aura-purple/20 rounded-[2rem]">
                <History className="text-aura-purple" size={36} />
            </div>
            <div>
                <h1 className="text-4xl font-serif font-black text-white">Hub History</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold mt-2">Neural Access • Synced 2m ago</p>
            </div>
        </div>

        {orders.length === 0 ? (
            <div className="text-center py-24 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                <ShoppingBag size={48} className="text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No Active Orders</h3>
                <p className="text-xs text-gray-600 mb-8">Start your journey in the Snehalata ecosystem.</p>
                <Link to="/" className="text-aura-purple uppercase tracking-widest font-black text-[10px] hover:underline">Browse Catalog</Link>
            </div>
        ) : (
            <div className="space-y-6">
                {orders.map((order) => (
                    <div 
                        key={order.id} 
                        onClick={() => window.location.hash = `/orders/${order.id}`}
                        className="group bg-aura-glass border border-aura-glassBorder rounded-[2.5rem] p-8 hover:border-aura-purple/50 transition-all duration-500 cursor-pointer shadow-xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-48 h-48 bg-aura-purple/5 blur-[80px] rounded-full pointer-events-none" />
                        <div className="flex flex-col md:flex-row justify-between gap-8 relative z-10">
                            <div className="flex gap-4">
                                <div className="flex -space-x-6">
                                    {order.items.slice(0, 3).map((it, i) => (
                                        <div key={i} className="w-16 h-16 rounded-2xl border-4 border-aura-black overflow-hidden shadow-2xl">
                                            <img src={it.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt={it.name} />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col justify-center ml-2">
                                    <h4 className="text-xl font-bold text-white mb-1">{order.items.length} Artisan Items</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Tracking ID: {order.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-10">
                                <div className="text-right">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest mb-2 ${getStatusColor(order.currentStatus)}`}>
                                        {getStatusIcon(order.currentStatus)}
                                        {order.currentStatus.replace('_', ' ')}
                                    </div>
                                    <div className="text-2xl font-black text-white">৳{order.totalAmount.toLocaleString()}</div>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-500 group-hover:bg-aura-purple group-hover:text-white transition-all">
                                    <ArrowRight size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

const DetailRow = ({ label, value, icon }: any) => (
    <div className="flex gap-4">
        <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-gray-400 h-fit">{icon}</div>
        <div>
            <div className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-0.5">{label}</div>
            <div className="text-xs font-bold text-white">{value}</div>
        </div>
    </div>
);
