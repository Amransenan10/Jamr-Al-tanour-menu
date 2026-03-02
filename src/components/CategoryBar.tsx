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
    <div className="sticky top-[140px] sm:top-[100px] z-30 bg-white dark:bg-charcoal py-4 border-b border-gray-100 dark:border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => onCategoryChange(null)}
            className={cn(
              "whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
              activeCategoryId === null
                ? "bg-primary text-white shadow-lg shadow-primary/20"
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
                "whitespace-nowrap px-6 py-2.5 rounded-2xl text-sm font-bold transition-all",
                activeCategoryId === category.id
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
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
