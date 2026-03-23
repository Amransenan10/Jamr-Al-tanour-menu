import React from 'react';
import { Category } from '../types';
import { cn } from '../lib/utils';

interface CategoryBarProps {
  categories: Category[];
  activeCategoryId: string | null;
  onCategoryChange: (id: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  activeCategoryId,
  onCategoryChange,
}) => {
  return (
    <div className="sticky top-[70px] z-30 bg-white/80 dark:bg-charcoal/80 backdrop-blur-xl py-4 border-b border-gray-100 dark:border-white/5 transition-all">
      <div className="container mx-auto px-4 relative">
        {/* Gradient Masks for Scroll */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-charcoal to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-charcoal to-transparent z-10 pointer-events-none" />
        
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 snap-x snap-mandatory px-4">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all snap-start",
              activeCategoryId === null
                ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
            )}
          >
            الكل
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all snap-start",
                activeCategoryId === category.id
                  ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                  : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10"
              )}
            >
              {category.name_ar}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
