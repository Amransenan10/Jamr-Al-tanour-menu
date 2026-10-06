import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story } from '../types';
import { Sparkles, Tag, ChevronLeft, ChevronRight, X, ZoomIn, ShoppingBag } from 'lucide-react';
import { cn } from '../lib/utils';

interface CollapsibleHeroSectionProps {
  stories: Story[];
  onSelectProductById?: (productId: string) => void;
  onAddDirectOfferToCart?: (offerName: string, offerPrice: number, imageUrl?: string) => void;
}

export const CollapsibleHeroSection: React.FC<CollapsibleHeroSectionProps> = ({
  stories,
  onSelectProductById,
  onAddDirectOfferToCart
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Active stories filtering
  const activeStories = React.useMemo(() => {
    return stories.filter(s => s.is_active);
  }, [stories]);

  // Listen to window scroll to collapse/expand
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY || document.documentElement.scrollTop);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto slide interval
  useEffect(() => {
    if (activeStories.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeStories.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeStories.length]);

  if (activeStories.length === 0) return null;

  // Collapse threshold: when scrolled past 70px
  const isCollapsed = scrollY > 70;

  const currentStory = activeStories[currentIndex] || activeStories[0];

  const handleStoryClick = (story: Story) => {
    if (story.product_id && onSelectProductById) {
      onSelectProductById(story.product_id);
    } else if (story.offer_name && story.offer_price && onAddDirectOfferToCart) {
      onAddDirectOfferToCart(story.offer_name, story.offer_price, story.image_url);
    } else {
      // Image-only poster or promotional banner -> Open full preview modal
      setFullscreenImage(story.image_url);
    }
  };

  return (
    <>
      <div 
        className={cn(
          "transition-all duration-500 ease-out overflow-hidden px-4 container mx-auto",
          isCollapsed ? "max-h-0 opacity-0 my-0 py-0 scale-95" : "max-h-[380px] opacity-100 mt-4 mb-2 scale-100"
        )}
      >
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10 group">
          {/* Main Hero Slider Container */}
          <div className="relative aspect-[21/9] sm:aspect-[2.5/1] w-full overflow-hidden bg-zinc-950">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStory.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                onClick={() => handleStoryClick(currentStory)}
                className="absolute inset-0 cursor-pointer"
              >
                <img
                  src={currentStory.image_url}
                  alt={currentStory.title || currentStory.offer_name || 'عرض جمر التنور'}
                  className="w-full h-full object-cover object-center"
                />
                
                {/* Overlay Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 right-0 left-0 p-4 sm:p-6 flex flex-col justify-end items-start text-right">
                  {currentStory.offer_name ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-black font-black text-xs sm:text-sm shadow-lg mb-2">
                      <Sparkles size={14} className="animate-spin" />
                      <span>{currentStory.offer_name}</span>
                      {currentStory.offer_price && (
                        <span className="bg-black/20 px-2 py-0.5 rounded-full text-white mr-1">
                          {currentStory.offer_price} ر.س
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-300 border border-amber-500/30 text-[11px] font-bold mb-2">
                      <Tag size={12} />
                      <span>عرض خاص حصري</span>
                    </div>
                  )}

                  {currentStory.title && (
                    <h3 className="text-white font-extrabold text-base sm:text-2xl drop-shadow-md leading-snug">
                      {currentStory.title}
                    </h3>
                  )}

                  <div className="mt-2 flex items-center gap-2 text-xs font-bold text-gray-300 group-hover:text-primary transition-colors">
                    <ZoomIn size={14} />
                    <span>اضغط لمعاينة العرض والتفاصيل 🔥</span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slider Dots */}
            {activeStories.length > 1 && (
              <div className="absolute bottom-3 left-4 flex items-center gap-1.5 z-10">
                {activeStories.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300 cursor-pointer",
                      idx === currentIndex ? "w-6 bg-primary" : "w-2 bg-white/40 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            )}

            {/* Left/Right Arrows for Desktop */}
            {activeStories.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex((prev) => (prev - 1 + activeStories.length) % activeStories.length);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-md hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex((prev) => (prev + 1) % activeStories.length);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white backdrop-blur-md hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-black cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Image Preview Modal */}
      <AnimatePresence>
        {fullscreenImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFullscreenImage(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative z-10 max-w-lg w-full max-h-[85vh] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
            >
              <button
                onClick={() => setFullscreenImage(null)}
                className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex-1 overflow-y-auto p-2">
                <img
                  src={fullscreenImage}
                  alt="معاينة العرض الكامل"
                  className="w-full h-auto rounded-2xl object-contain max-h-[75vh]"
                />
              </div>

              <div className="p-4 bg-zinc-900 border-t border-white/10 text-center">
                <button
                  onClick={() => setFullscreenImage(null)}
                  className="w-full py-3 bg-primary text-black font-black rounded-xl hover:bg-primary/90 transition-colors"
                >
                  إغلاق وتصفح المنيو
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
