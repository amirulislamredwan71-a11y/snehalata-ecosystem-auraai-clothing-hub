import React, { useState, useEffect } from 'react';
import { Link } from '../components/Navigation';
import { ShoppingBag, ArrowLeft, Trash2, Minus, Plus, ShoppingCart, Truck, Wallet, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { addOrder } from '../services/mockData';
import { BD_LOCATIONS } from '../services/locationData';

interface CartItem extends Product {
  quantity: number;
}

export const Cart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'CART' | 'DETAILS' | 'DONE'>('CART');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', district: '', area: '', address: '', email: '', note: ''
  });

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    setCartItems(items);
    
    const handleCartUpdate = () => {
      const updated = JSON.parse(localStorage.getItem('aura_cart') || '[]');
      setCartItems(updated);
    };
    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const updateQuantity = (id: string | number, delta: number) => {
    const newCart = cartItems.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCartItems(newCart);
    localStorage.setItem('aura_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (id: string | number) => {
    const newCart = cartItems.filter(item => item.id !== id);
    setCartItems(newCart);
    localStorage.setItem('aura_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = formData.district === 'Dhaka' ? 78 : 118;
  const total = subtotal + shipping;

  const [error, setError] = useState<string | null>(null);

  const handlePlaceOrder = () => {
    setError(null);
    if (!formData.name || !formData.phone || !formData.address) {
      setError("Please fill in all required fields (Name, Phone, Address)");
      return;
    }

    const newOrder = {
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: formData.name,
      totalAmount: total,
      items: cartItems,
      currentStatus: "PLACED" as const,
      estimatedDelivery: formData.district === 'Dhaka' ? "১-২ কার্যদিবস" : "২-৩ কার্যদিবস",
      timeline: []
    };
    
    addOrder(newOrder);
    localStorage.removeItem('aura_cart');
    setCartItems([]);
    window.dispatchEvent(new Event('cartUpdated'));
    setCompletedOrder(newOrder);
    setCheckoutStep('DONE');
  };

  if (checkoutStep === 'DONE') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
         <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
         </div>
         <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Received!</h1>
         <p className="text-gray-500 mb-8 tracking-widest text-[10px] uppercase font-black">Reference: {completedOrder.id}</p>
         <Link to="/" className="px-10 py-4 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-aura-purple transition-all">
            Continue Shopping
         </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32 pt-24 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-16 relative">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-0.5 bg-gray-200 -z-10" />
            <div className={`absolute top-1/2 left-[15%] -translate-y-1/2 h-0.5 bg-green-500 transition-all duration-700 -z-10 ${checkoutStep === 'CART' ? 'w-0' : 'w-[35%]'}`} />
            
            <StepNode number={1} label="CART" active={true} completed={checkoutStep !== 'CART'} />
            <StepNode number={2} label="DETAILS" active={checkoutStep === 'DETAILS'} completed={false} />
            <StepNode number={3} label="DONE" active={false} completed={false} />
        </div>

        <header className="flex items-center justify-center gap-4 mb-20">
           {checkoutStep === 'DETAILS' && (
             <button onClick={() => setCheckoutStep('CART')} className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white transition-all">
                <ArrowLeft size={18} />
             </button>
           )}
           <h1 className="text-4xl font-serif font-black italic tracking-tight">Checkout</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
           {/* Form Section */}
           <div className="lg:col-span-7 space-y-6">
              {checkoutStep === 'CART' ? (
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                   <h2 className="text-lg font-bold mb-8 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-pink-600" /> Your Items
                   </h2>
                   {cartItems.length === 0 ? (
                     <div className="text-center py-20">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Your bag is empty</p>
                        <Link to="/" className="text-pink-600 font-bold text-sm mt-4 inline-block underline">Shop Now</Link>
                     </div>
                   ) : (
                     <div className="space-y-6">
                        {cartItems.map(item => (
                          <div key={item.id} className="flex gap-6 items-center">
                             <img src={item.imageUrl} className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                             <div className="flex-1">
                                <h4 className="font-bold text-sm">{item.name}</h4>
                                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mt-1">৳{item.price}</p>
                             </div>
                             <div className="flex items-center gap-4 bg-gray-50 rounded-full px-4 py-1">
                                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-pink-600 transition-colors"><Minus size={14} /></button>
                                <span className="font-black tabular-nums text-xs">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-pink-600 transition-colors"><Plus size={14} /></button>
                             </div>
                             <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                          </div>
                        ))}
                        <button 
                           onClick={() => setCheckoutStep('DETAILS')}
                           className="w-full py-5 bg-pink-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-gray-900 transition-all mt-6"
                        >
                           Proceed to Details
                        </button>
                     </div>
                   )}
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Full Name</label>
                         <input 
                           type="text" placeholder="Your Name" 
                           className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm focus:border-pink-600 outline-none transition-all shadow-sm"
                           value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 ml-4">Phone Number</label>
                         <input 
                           type="tel" placeholder="Mobile Number" 
                           className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm focus:border-pink-600 outline-none transition-all shadow-sm"
                           value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <select 
                        value={formData.district}
                        onChange={e => setFormData({...formData, district: e.target.value, area: ''})}
                        className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm appearance-none outline-none focus:border-pink-600 shadow-sm transition-all focus:bg-pink-50"
                      >
                         <option value="">Select District</option>
                         {Object.keys(BD_LOCATIONS).sort().map(d => (
                            <option key={d} value={d}>{d}</option>
                         ))}
                      </select>
                      <select 
                        value={formData.area}
                        onChange={e => setFormData({...formData, area: e.target.value})}
                        disabled={!formData.district}
                        className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm appearance-none outline-none focus:border-pink-600 shadow-sm transition-all focus:bg-pink-50 disabled:bg-gray-50 disabled:text-gray-400"
                      >
                         <option value="">{formData.district ? 'Select Area/Upazila' : 'Select District First'}</option>
                         {formData.district && BD_LOCATIONS[formData.district]?.map(a => (
                            <option key={a} value={a}>{a}</option>
                         ))}
                      </select>
                   </div>

                   <textarea 
                     placeholder="Full Address" 
                     className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm h-32 resize-none outline-none focus:border-pink-600 shadow-sm"
                     value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                   />
                   
                   <input 
                     type="email" placeholder="Email (optional)" 
                     className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm outline-none focus:border-pink-600 shadow-sm"
                     value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                   />

                   <input 
                     type="text" placeholder="Order Note (optional)" 
                     className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-8 text-sm outline-none focus:border-pink-600 shadow-sm"
                     value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}
                   />

                   <label className="flex items-center gap-3 cursor-pointer group mt-4">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 accent-pink-600" defaultChecked />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover:text-gray-900 transition-colors">Save delivery address for next time</span>
                   </label>

                   <div className="pt-10">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                         <Truck size={14} className="text-pink-600" /> Shipping Region
                      </h3>
                      <div className="p-6 bg-white border border-pink-100 rounded-2xl flex items-center justify-between shadow-sm">
                         <div>
                            <p className="text-xs font-bold text-gray-900">{formData.district === 'Dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</p>
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                               {formData.district === 'Dhaka' ? '১-২ কার্যদিবস (Standard)' : '২-৩ কার্যদিবস (Standard)'}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-xs font-black text-pink-600">৳{shipping}</p>
                            <p className="text-[8px] text-gray-400 uppercase tracking-widest mt-1">Delivery Charge</p>
                         </div>
                      </div>
                   </div>

                   {/* Cash on Delivery Notification */}
                   <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl flex items-center gap-4 mt-10 animate-pulse">
                      <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">
                         <Wallet size={20} />
                      </div>
                      <div>
                         <p className="text-xs font-bold text-orange-900">Cash on Delivery Available</p>
                         <p className="text-[9px] font-bold text-orange-700 uppercase tracking-widest mt-1">bKash / Nagad / Rocket: +880 1712-426871</p>
                      </div>
                   </div>

                   {error && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 animate-bounce">
                        {error}
                      </p>
                   )}

                   <button 
                     onClick={handlePlaceOrder}
                     className="w-full py-6 bg-[#1A1C30] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-pink-600 transition-all flex items-center justify-center gap-4 active:scale-95"
                   >
                      <CheckCircle2 size={18} /> CONFIRM & PLACE ORDER
                   </button>
                </div>
              )}
           </div>

           {/* Summary Panel */}
           <div className="lg:col-span-5">
              <div className="bg-[#1A1C30] text-white rounded-[2.5rem] p-8 sticky top-32 shadow-2xl overflow-hidden group">
                 <div className="absolute top-0 right-0 p-32 bg-pink-500/10 blur-[80px] rounded-full pointer-events-none" />
                 
                 <h3 className="text-xl font-bold flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
                    <ShoppingCart size={22} className="text-pink-500" /> Order Summary
                 </h3>

                 <div className="space-y-6 mb-10 max-h-[300px] overflow-y-auto scrollbar-hide">
                    {cartItems.map(item => (
                       <div key={item.id} className="flex gap-4 items-center">
                          <img src={item.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-xs truncate">{item.name}</h4>
                             <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Qty: {item.quantity}</p>
                          </div>
                          <span className="font-black tabular-nums text-sm">৳{(item.price * item.quantity).toLocaleString()}</span>
                       </div>
                    ))}
                 </div>

                 <div className="space-y-4 py-8 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500 font-bold uppercase tracking-widest">Subtotal</span>
                       <span className="font-black tabular-nums">৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-gray-500 font-bold uppercase tracking-widest">Shipping (—)</span>
                       <span className="font-black tabular-nums">—</span>
                    </div>
                 </div>

                 <div className="mb-8 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-end mb-8">
                       <span className="text-2xl font-serif font-black italic">Total</span>
                       <span className="text-2xl font-black text-pink-500 tracking-tighter">৳{total.toLocaleString()}</span>
                    </div>
                    <div className="bg-pink-600 text-white p-5 rounded-2xl flex items-center justify-between shadow-xl">
                       <span className="text-[10px] font-black uppercase tracking-widest">{cartItems.length} ITEMS</span>
                       <span className="text-lg font-black tabular-nums">৳{total.toLocaleString()}</span>
                    </div>
                 </div>

                 <p className="text-[8px] text-center text-gray-600 font-black uppercase tracking-[0.2em]">SNEHALATA NEURAL COMMERCE v4.0 SECURED</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const StepNode = ({ number, label, active, completed }: any) => (
  <div className="flex flex-col items-center gap-3 z-10 relative">
     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 ${completed ? 'bg-green-500 text-white' : active ? 'bg-pink-600 text-white ring-8 ring-pink-500/10' : 'bg-gray-200 text-gray-400'}`}>
        {completed ? <CheckCircle2 size={16} /> : number}
     </div>
     <span className={`text-[8px] font-black uppercase tracking-widest transition-colors ${active || completed ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
  </div>
);


