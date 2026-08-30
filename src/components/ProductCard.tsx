import React from 'react';
import { Product } from '../types';
import { ShoppingBag, UtensilsCrossed, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  isPopular?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, isPopular }) => {
  const currentPrice = product.price > 0 ? product.price : (product.starting_price || 0);
  const hasOriginalPrice = product.original_price && product.original_price > currentPrice;
  const discountPercent = hasOriginalPrice
    ? Math.round(((product.original_price! - currentPrice) / product.original_price!) * 100)
    : (product.offer_discount_percent || null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group bg-white dark:bg-zinc-900 rounded-3xl sm:rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 dark:border-white/5 flex flex-col h-full",
        !product.is_available && "opacity-65 grayscale-[40%] bg-gray-50/80 dark:bg-zinc-950/80"
      )}
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
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-primary text-white backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-sm shadow-lg shadow-primary/20 flex flex-col items-end">
          <span className="leading-none">{currentPrice} ر.س</span>
          {hasOriginalPrice && (
            <span className="text-[9px] sm:text-xs text-white/70 line-through mt-0.5 font-normal">
              {product.original_price} ر.س
            </span>
          )}
        </div>

        {/* Discount Badge */}
        {discountPercent && discountPercent > 0 && product.is_available && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-emerald-500 text-white backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs shadow-lg shadow-emerald-500/20">
            خصم {discountPercent}%
          </div>
        )}

        {/* Popular Star Tag */}
        {isPopular && !discountPercent && (
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-amber-400 text-white backdrop-blur-md px-2 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg shadow-amber-400/30 flex items-center justify-center">
            <Star size={14} className="fill-white sm:w-5 sm:h-5 w-4 h-4" />
          </div>
        )}

        {/* Unavailable overlay */}
        {!product.is_available && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-zinc-800/90 text-gray-300 border border-white/10 px-4 py-1.5 sm:px-6 sm:py-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs font-bold tracking-wide shadow-xl">
              غير متوفر حالياً
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-6 flex flex-col flex-1">
        <div className="mb-2 sm:mb-4">
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <h3 className="font-black text-sm sm:text-xl text-gray-900 dark:text-white line-clamp-1">{product.name_ar}</h3>
            {product.calories && (
              <span className="shrink-0 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full">
                {product.calories} سعرة
              </span>
            )}
          </div>
          <p className="hidden sm:block text-gray-500 dark:text-gray-400 text-xs leading-relaxed line-clamp-2">
            {product.description_ar || 'لا يوجد وصف متاح'}
          </p>
        </div>

        <div className="mt-auto">
          <button
            disabled={!product.is_available}
            onClick={() => onSelect(product)}
            className="w-full py-2.5 sm:py-4 bg-primary text-white rounded-xl sm:rounded-[1.5rem] text-[10px] sm:text-sm font-black flex items-center justify-center gap-2 sm:gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-gray-300 dark:disabled:bg-zinc-800 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
          >
            <ShoppingBag size={14} className="sm:w-5 sm:h-5" />
            {product.is_available ? 'أضف للسلة' : 'غير متوفر حالياً'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
