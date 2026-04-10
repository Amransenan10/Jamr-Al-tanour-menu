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
        className="bg-gradient-to-r from-primary to-orange-500 text-white shadow-md relative z-[60]"
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="bg-white/20 p-1.5 rounded-full shrink-0">
              <Megaphone size={16} className="text-white animate-pulse" />
            </div>
            
            <div className="flex-1">
               <p className="font-bold text-sm leading-snug">
                  {text}
               </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
