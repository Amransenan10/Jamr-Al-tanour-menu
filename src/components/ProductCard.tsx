import React from 'react';
import { Product } from '../types';
import { ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-white/5 flex flex-col h-full"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-zinc-800/50">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_ar}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:scale-110 transition-transform duration-700">
            <UtensilsCrossed size={64} strokeWidth={1} />
          </div>
        )}


        {/* Price Tag in corner */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-primary text-white backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm shadow-lg shadow-primary/20">
          {product.price} ر.س
        </div>

        {!product.is_available && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white px-4 py-1.5 sm:px-6 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-widest">غير متوفر</span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-6 flex flex-col flex-1">
        <div className="mb-2 sm:mb-4">
          <h3 className="font-black text-sm sm:text-xl text-gray-900 dark:text-white mb-1 sm:mb-2 line-clamp-1">{product.name_ar}</h3>
          <p className="hidden sm:block text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
            {product.description_ar || 'لا يوجد وصف متاح'}
          </p>
        </div>

        <div className="mt-auto">
          <button
            disabled={!product.is_available}
            onClick={() => onSelect(product)}
            className="w-full py-2.5 sm:py-4 bg-primary text-white rounded-xl sm:rounded-[1.5rem] text-[10px] sm:text-sm font-black flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            <ShoppingBag size={14} className="sm:w-5 sm:h-5" />
            أضف للسلة
          </button>
        </div>
      </div>
    </motion.div>
  );
};
