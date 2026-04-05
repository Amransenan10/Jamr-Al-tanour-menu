import React from 'react';
import { useCart } from '../context/CartContext';
import { ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface FloatingCartButtonProps {
  onClick: () => void;
  storeStatus: string;
  hasActiveOrder?: boolean;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ onClick, storeStatus, hasActiveOrder }) => {
  const { cart, totalPrice } = useCart();
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn("fixed left-4 right-4 z-40 mx-auto max-w-sm transition-all duration-300", hasActiveOrder ? "bottom-24" : "bottom-6")}
        >
          <button
            onClick={onClick}
            className="w-full bg-primary text-white p-4 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-between hover:scale-[1.02] active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black">
                  {itemCount}
                </span>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">عرض السلة</p>
                {storeStatus === 'prayer' && (
                  <p className="text-[10px] font-bold text-white/80">تجهيز بعد الصلاة 🕌</p>
                )}
                {storeStatus === 'busy' && (
                  <p className="text-[10px] font-bold text-white/80">المطعم مزدحم 🟠</p>
                )}
              </div>
            </div>
            <div className="font-black text-lg">
              {totalPrice} ر.س
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
