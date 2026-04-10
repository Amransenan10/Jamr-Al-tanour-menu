import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X } from 'lucide-react';

interface AnnouncementBannerProps {
  text: string;
  isActive: boolean;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ text, isActive }) => {
  const [isVisible, setIsVisible] = useState(true);

  // If the admin disables it, or there is no text, don't show
  if (!isActive || !text) return null;
  // If the user dismissed it manually, don't show
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="bg-zinc-950 border-b-2 border-primary/50 text-white shadow-xl relative z-[60]"
      >
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="bg-primary/20 p-2 rounded-full shrink-0 shadow-[0_0_15px_rgba(255,98,0,0.3)]">
              <Megaphone size={18} className="text-primary animate-pulse" />
            </div>
            
            <div className="flex-1">
               <p className="font-black text-[15px] md:text-base leading-snug text-white tracking-wide">
                  {text}
               </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-full transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
