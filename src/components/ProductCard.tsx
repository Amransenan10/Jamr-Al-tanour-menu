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
      className="group bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-white/5 flex flex-col h-full"
    >
      <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name_ar}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-zinc-700">
            <UtensilsCrossed size={48} />
          </div>
        )}

        {/* Price Tag in corner */}
        <div className="absolute top-4 right-4 bg-primary text-white backdrop-blur-md px-4 py-2 rounded-2xl font-black text-sm shadow-lg shadow-primary/20">
          {product.price} ر.س
        </div>

        {!product.is_available && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">غير متوفر</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="font-black text-xl text-gray-900 dark:text-white mb-2 line-clamp-1">{product.name_ar}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
            {product.description_ar || 'لا يوجد وصف متاح'}
          </p>
        </div>

        <div className="mt-auto">
          <button
            disabled={!product.is_available}
            onClick={() => onSelect(product)}
            className="w-full py-4 bg-primary text-white rounded-[1.5rem] text-sm font-black flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
          >
            <ShoppingBag size={20} />
            أضف للسلة
          </button>
        </div>
      </div>
    </motion.div>
  );
};
