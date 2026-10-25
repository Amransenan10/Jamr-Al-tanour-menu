import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Story } from '../types';
import { ChevronLeft, ChevronRight, X, ShoppingBag, ZoomIn, Ticket } from 'lucide-react';
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
    return stories.filter(s => s.is_active !== false);
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
  const displayTitle = currentStory.title || currentStory.offer_name;

  const handleStoryClick = (story: Story) => {
    if (story.is_active === false) return;
    if (story.product_id && onSelectProductById) {
      onSelectProductById(story.product_id);
    } else if (story.offer_price && onAddDirectOfferToCart) {
      const offerTitle = story.offer_name || story.title || 'عرض خاص';
      onAddDirectOfferToCart(offerTitle, story.offer_price, story.image_url);
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
          isCollapsed ? "max-h-0 opacity-0 my-0 py-0 scale-95" : "max-h-[550px] opacity-100 mt-4 mb-2 scale-100"
        )}
      >
        <div className="relative max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/10 group">
          {/* Main Hero Slider Container - aspect 2:1 matches standard restaurant designs (1080x540) */}
          <div className="relative aspect-[2/1] sm:aspect-[2.1/1] w-full overflow-hidden bg-zinc-950">
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
                
                {/* Overlay Gradients - subtle to keep image text crisp and readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent pointer-events-none" />

                {/* Content Overlay – Title only, clean */}
                <div className="absolute bottom-0 right-0 left-0 p-4 sm:p-6 flex flex-col justify-end items-start text-right">
                  {displayTitle && (
                    <h3 className="text-white font-extrabold text-base sm:text-2xl drop-shadow-md leading-snug mb-2">
                      {displayTitle}
                    </h3>
                  )}

                  {/* Smart CTA button based on story type */}
                  {currentStory.offer_price ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStoryClick(currentStory); }}
                      className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-primary text-black font-black text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all"
                    >
                      <ShoppingBag size={14} />
                      <span>أضف للسلة • {currentStory.offer_price} ر.س</span>
                    </button>
                  ) : currentStory.product_id ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleStoryClick(currentStory); }}
                      className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-white/15 backdrop-blur-md text-white border border-white/20 font-bold text-xs sm:text-sm hover:bg-white/25 active:scale-95 transition-all"
                    >
                      <ShoppingBag size={14} />
                      <span>عرض المنتج</span>
                    </button>
                  ) : currentStory.promo_code ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 font-mono font-black text-xs">
                      <Ticket size={13} />
                      <span>كود الخصم: {currentStory.promo_code}</span>
                    </div>
                  ) : null}
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
