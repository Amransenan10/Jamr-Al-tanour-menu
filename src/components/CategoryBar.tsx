import React from 'react';
import { Category } from '../types';
import { cn } from '../lib/utils';
import { Sparkles, Tag } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  activeCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
  showWeeklyOffers?: boolean;
  offersTitle?: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  activeCategoryId,
  onCategoryChange,
  showWeeklyOffers = true,
  offersTitle = 'العروض الأسبوعية',
}) => {
  return (
    <div className="sticky top-[60px] sm:top-[70px] z-30 bg-white/90 dark:bg-charcoal/90 backdrop-blur-xl py-2.5 sm:py-3.5 border-b border-gray-100 dark:border-white/5 transition-all">
      <div className="container mx-auto px-2 sm:px-4 relative">
        {/* Gradient Masks for Scroll */}
        <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-r from-white dark:from-charcoal to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 sm:w-8 bg-gradient-to-l from-white dark:from-charcoal to-transparent z-10 pointer-events-none" />
        
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar pb-0.5 snap-x snap-mandatory px-2 sm:px-4">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "whitespace-nowrap px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all snap-start flex items-center gap-1.5 shrink-0",
              activeCategoryId === null
                ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
            )}
          >
            <Sparkles size={14} className="sm:w-4 sm:h-4 text-amber-300" />
            <span>الأكثر طلباً</span>
          </button>

          {showWeeklyOffers && (
            <button
              onClick={() => onCategoryChange('offers_weekly')}
              className={cn(
                "whitespace-nowrap px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all snap-start flex items-center gap-1.5 shrink-0",
                activeCategoryId === 'offers_weekly'
                  ? "bg-amber-500 text-black shadow-md shadow-amber-500/20 scale-[1.02]"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20"
              )}
            >
              <Tag size={14} className="sm:w-4 sm:h-4" />
              <span>{offersTitle}</span>
            </button>
          )}

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "whitespace-nowrap px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all snap-start flex items-center gap-1.5 shrink-0",
                activeCategoryId === category.id
                  ? "bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]"
                  : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              <span>{category.name_ar}</span>
              {category.name_ar === 'الفطور' && (
                <span className={cn(
                  "text-[9px] px-1.5 py-0.5 rounded-full font-black transition-colors animate-pulse",
                  activeCategoryId === category.id
                    ? "bg-white text-primary"
                    : "bg-red-500 text-white"
                )}>
                  جديد
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
