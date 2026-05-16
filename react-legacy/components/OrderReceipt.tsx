import React from 'react';
import { Order } from '../types';
import { 
  ShieldCheck, Download, Share2, 
  MapPin, CreditCard, Calendar, ShoppingBag, 
  CheckCircle2, QrCode 
} from 'lucide-react';
import { Logo } from './Logo';

interface OrderReceiptProps {
  order: Order;
  onClose?: () => void;
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({ order }) => {
  return (
    <div className="bg-aura-black text-white p-8 md:p-12 rounded-[3rem] border border-aura-glassBorder relative overflow-hidden shadow-2xl max-w-2xl w-full mx-auto animate-in zoom-in fade-in duration-500">
      {/* Texture & Gradients */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-aura-purple/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/5 blur-[100px] pointer-events-none" />
      
      {/* Receipt Content */}
      <div className="relative z-10 space-y-10">
        
        {/* Header */}
        <header className="flex justify-between items-start">
            <div className="space-y-4">
                <Logo />
                <div className="bg-aura-purple/10 border border-aura-purple/20 px-3 py-1 rounded-full w-fit">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-aura-purple">Official Neural Receipt</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1">Receipt Number</div>
                <div className="text-sm font-mono font-bold text-white">#RC-{order.id.split('-')[1]}-{order.id.slice(-4)}</div>
            </div>
        </header>

        {/* Status Banner */}
        <div className="flex items-center gap-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400">
                <CheckCircle2 size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white leading-tight">Payment Confirmed</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Transaction Synced with Aura Node</p>
            </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-8">
            <DetailItem label="Customer" value={order.customerName} icon={<ShoppingBag size={14} />} />
            <DetailItem label="Order Date" value={order.timeline[0].timestamp} icon={<Calendar size={14} />} />
            <DetailItem label="Shipping To" value="Uttara, Dhaka" icon={<MapPin size={14} />} />
            <DetailItem label="Method" value="Direct Gateway" icon={<CreditCard size={14} />} />
        </div>

        {/* Itemized List */}
        <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600">Items Manifest</h4>
                <div className="h-px flex-1 bg-white/5 mx-4" />
            </div>
            <div className="space-y-3">
                {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                                <img src={item.imageUrl} className="w-full h-full object-cover grayscale opacity-60" alt={item.name} />
                            </div>
                            <div>
                                <h5 className="text-xs font-bold text-white">{item.name}</h5>
                                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{item.category}</p>
                            </div>
                        </div>
                        <div className="text-sm font-black text-white">৳{item.price.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>

        {/* Totals Section */}
        <div className="pt-6 border-t border-white/5 space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
                <span>Ecosystem Fee (0%)</span>
                <span>৳0</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
                <span>Logistic Allocation</span>
                <span>৳120</span>
            </div>
            <div className="flex justify-between items-end pt-4">
                <div>
                    <div className="text-[10px] text-aura-purple font-black uppercase tracking-widest mb-1">Grand Total</div>
                    <div className="text-4xl font-black text-white">৳{(order.totalAmount + 120).toLocaleString()}</div>
                </div>
                <div className="p-3 bg-white border border-white rounded-2xl">
                    <QrCode className="text-black" size={40} />
                </div>
            </div>
        </div>

        {/* Authenticity Footer */}
        <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5">
            <div className="flex items-center gap-3">
                <ShieldCheck className="text-aura-purple" size={20} />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Aura Authenticity Guaranteed</span>
            </div>
            <div className="flex gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    <Download size={14} /> Save PDF
                </button>
                <button className="flex items-center gap-2 px-6 py-3 bg-aura-purple text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    <Share2 size={14} /> Share
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, icon }: any) => (
    <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[9px] text-gray-600 font-black uppercase tracking-widest">
            {icon} {label}
        </div>
        <div className="text-xs font-bold text-white leading-relaxed truncate">{value}</div>
    </div>
);