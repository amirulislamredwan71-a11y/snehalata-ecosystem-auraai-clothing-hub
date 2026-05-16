import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const FloatingCart: React.FC = () => {
  const [cartStats, setCartStats] = useState(() => {
    const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
    const total = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    return { count, total };
  });
  const [pulse, setPulse] = useState(false);

  const updateStats = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem('aura_cart') || '[]');
    const count = cart.reduce((acc: number, item: any) => acc + item.quantity, 0);
    const total = cart.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);
    setCartStats({ count, total });
    
    if (count > 0) {
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('cartUpdated', updateStats);
    return () => window.removeEventListener('cartUpdated', updateStats);
  }, [updateStats]);

  return (
    <>
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-4 items-end pointer-events-none">
        {/* Floating Cart Bag */}
        <AnimatePresence>
          {cartStats.count > 0 && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="pointer-events-auto"
            >
              <button
                onClick={() => window.location.hash = '/cart'}
                className={`
                  flex flex-col items-center bg-[#E11D48] text-white rounded-l-2xl shadow-2xl transition-all active:scale-95 border-l border-y border-white/20
                  ${pulse ? 'scale-110' : 'hover:scale-105'}
                `}
              >
                <div className="p-3 flex flex-col items-center border-b border-white/10 w-full">
                  <ShoppingBag size={20} className="mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-tighter whitespace-nowrap">
                    {cartStats.count} ITEMS
                  </span>
                </div>
                <div className="p-3 bg-black/10 w-full rounded-bl-2xl">
                   <span className="text-[12px] font-black tabular-nums tracking-tighter">৳{cartStats.total.toLocaleString()}</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
