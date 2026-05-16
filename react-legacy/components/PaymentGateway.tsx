import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Smartphone, CheckCircle2, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';

interface PaymentGatewayProps {
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaymentGateway: React.FC<PaymentGatewayProps> = ({ amount, onSuccess, onClose }) => {
  const [method, setMethod] = useState<'CARD' | 'BKASH' | 'NAGAD'>('BKASH');
  const [step, setStep] = useState<'SELECTION' | 'PROCESSING' | 'SUCCESS'>('SELECTION');
  const [progress, setProgress] = useState(0);

  const handlePayment = () => {
    setStep('PROCESSING');
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setStep('SUCCESS');
          setTimeout(onSuccess, 2000);
        }, 500);
      }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-aura-glass border border-aura-glassBorder rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-aura-purple/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="bg-black/40 backdrop-blur-3xl p-8 md:p-12 relative z-10">
          {step === 'SELECTION' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <header className="flex justify-between items-start">
                <div>
                  <div className="mb-2">
                    <Logo />
                  </div>
                  <h2 className="text-3xl font-serif font-black text-white">Payment Secure</h2>
                </div>
                <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </header>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Total Payable</p>
                  <p className="text-3xl font-black text-white tabular-nums">৳{amount.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase tracking-widest">
                  <Lock size={12} /> Secure Link
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PaymentMethodTab 
                  active={method === 'BKASH'} 
                  onClick={() => setMethod('BKASH')}
                  icon={<Smartphone size={18} />}
                  label="bKash"
                  color="bg-[#d12053]"
                />
                <PaymentMethodTab 
                  active={method === 'NAGAD'} 
                  onClick={() => setMethod('NAGAD')}
                  icon={<Smartphone size={18} />}
                  label="Nagad"
                  color="bg-[#f7941d]"
                />
                <PaymentMethodTab 
                  active={method === 'CARD'} 
                  onClick={() => setMethod('CARD')}
                  icon={<CreditCard size={18} />}
                  label="Card"
                  color="bg-aura-purple"
                />
              </div>

              <div className="space-y-4">
                {method === 'CARD' ? (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-xs text-white outline-none focus:border-aura-purple" placeholder="Card Number" />
                    <div className="grid grid-cols-2 gap-4">
                      <input className="bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-xs text-white outline-none focus:border-aura-purple" placeholder="MM/YY" />
                      <input className="bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-xs text-white outline-none focus:border-aura-purple" placeholder="CVC" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <input className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-xs text-white outline-none focus:border-aura-purple" placeholder={`${method} Mobile Number`} />
                  </div>
                )}
              </div>

              <button 
                onClick={handlePayment}
                className="w-full bg-white text-black py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-aura-purple hover:text-white transition-all shadow-2xl active:scale-95"
              >
                Complete Payment <ArrowRight size={18} />
              </button>

              <div className="flex items-center justify-center gap-3 text-[9px] text-gray-600 font-black uppercase tracking-widest">
                <ShieldCheck size={14} className="text-aura-purple" /> Aura AI Fraud Protection Active
              </div>
            </div>
          )}

          {step === 'PROCESSING' && (
            <div className="text-center py-20 space-y-8 animate-in zoom-in">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-aura-purple/20 rounded-full"></div>
                <div 
                  className="absolute inset-0 border-4 border-aura-purple rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: '0.8s' }}
                ></div>
                <Sparkles className="absolute inset-0 m-auto text-aura-purple animate-pulse" size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-black text-white mb-2">Neural Synchronization</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Verifying transaction hash... {progress}%</p>
              </div>
              <div className="w-full max-w-xs mx-auto bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-aura-purple transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="text-center py-20 space-y-6 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 relative">
                <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 animate-pulse"></div>
                <CheckCircle2 size={48} className="text-green-400 relative z-10" />
              </div>
              <h2 className="text-3xl font-serif font-black text-white leading-tight">Authentic Payment <br/>Received</h2>
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-black animate-pulse">Redirecting to Aura Receipt...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentMethodTab = ({ active, onClick, icon, label, color }: any) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
      active ? `border-white/20 shadow-xl scale-105 ${color} text-white` : 'bg-white/5 border-white/5 text-gray-500 hover:border-white/10'
    }`}
  >
    <div className={`p-2 rounded-xl ${active ? 'bg-white/20' : 'bg-white/5'}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </button>
);