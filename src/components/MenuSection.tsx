import React, { useEffect, useRef } from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, Tag } from 'lucide-react';

interface MenuSectionProps {
  id: string;
  title: string;
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onInView: (id: string | null) => void;
  isPopular?: boolean;
  isOffers?: boolean;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ 
  id, 
  title, 
  products, 
  onSelectProduct, 
  onInView, 
  isPopular,
  isOffers
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Find if the section is crossing the threshold in the viewport
        if (entries[0].isIntersecting) {
          onInView(id === 'popular' ? null : id);
        }
      },
      // This margin effectively creates a detection line just below the sticky header.
      // -135px accounts for header. Bottom margin ignores the rest of the screen.
      { rootMargin: '-140px 0px -60% 0px', threshold: 0 }
    );
    
    observer.observe(sectionRef.current);
    
    return () => observer.disconnect();
  }, [id, onInView]);

  if (products.length === 0) return null;

  return (
    <div id={`category-${id}`} ref={sectionRef} className="pt-4 pb-8 scroll-mt-[195px]">
      <div className="flex items-center gap-3 mb-6 px-1">
        {isPopular && <Sparkles className="text-amber-400" size={24} />}
        {isOffers && <Tag className="text-emerald-500" size={24} />}
        <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-l from-gray-200 dark:from-white/10 to-transparent" />
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        <AnimatePresence mode="popLayout">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onSelectProduct}
              isPopular={isPopular || (id === 'popular')}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
