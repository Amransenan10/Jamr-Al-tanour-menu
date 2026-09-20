import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, Copy, Check, Sparkles, Gift } from 'lucide-react';
import { SeasonalEventSettings } from '../types';
import { getPresetDetails } from './SeasonalEventOverlay';
import toast from 'react-hot-toast';

interface AnnouncementBannerProps {
  text: string;
  isActive: boolean;
  eventSettings?: SeasonalEventSettings;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ text, isActive, eventSettings }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  const isEventActive = Boolean(eventSettings?.event_active);
  const presetDetails = getPresetDetails(eventSettings?.event_preset);
  const promoCode = eventSettings?.event_promo_code;

  const eventTitle = eventSettings?.event_title || presetDetails.badge;
  const eventSubtitle = eventSettings?.event_subtitle || text;

  const activeShow = isEventActive || (isActive && text);

  if (!activeShow || !isVisible) return null;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast.success(`تم نسخ كود الخصم (${promoCode}) بنجاح! 📋✨`);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className={
          isEventActive
            ? `bg-gradient-to-r ${presetDetails.colors.gradient} border-b text-white shadow-2xl relative z-[60] overflow-hidden`
            : `bg-zinc-950 border-b border-primary/50 text-white shadow-xl relative z-[60]`
        }
        style={{
          borderColor: isEventActive ? presetDetails.colors.accent : undefined
        }}
      >
        {/* Subtle Animated Gold Shimmer Line for Seasonal Theme */}
        {isEventActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse pointer-events-none" />
        )}

        <div className="container mx-auto px-3.5 py-2.5 sm:py-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 flex-1 overflow-hidden">
            {/* Event Icon / Badge */}
            <div
              className="p-1.5 sm:p-2 rounded-xl shrink-0 shadow-md flex items-center justify-center text-lg border border-white/10"
              style={{
                backgroundColor: isEventActive ? presetDetails.colors.glowColor : 'rgba(255, 98, 0, 0.2)'
              }}
            >
              {isEventActive ? (
                <span className="animate-bounce text-xl">{presetDetails.icon}</span>
              ) : (
                <Megaphone size={18} className="text-primary animate-pulse" />
              )}
            </div>

            {/* Event Title & Subtitle */}
            <div className="flex-1 overflow-hidden space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-xs sm:text-sm text-white tracking-wide truncate drop-shadow-sm">
                  {isEventActive ? eventTitle : text}
                </span>
                {isEventActive && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    موسم خاص ✨
                  </span>
                )}
              </div>
              {isEventActive && eventSubtitle && (
                <p className="text-[11px] sm:text-xs text-emerald-100/90 font-medium truncate">
                  {eventSubtitle}
                </p>
              )}
            </div>
          </div>

          {/* Promo Code Pill Button */}
          {isEventActive && promoCode && (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-black/40 hover:bg-black/60 text-amber-300 font-mono text-xs font-black rounded-xl border border-amber-400/40 transition-all shrink-0 cursor-pointer shadow-sm active:scale-95"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-amber-400" />}
              <span>{copied ? 'تم النسخ' : promoCode}</span>
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-full transition-colors shrink-0 cursor-pointer"
            title="إغلاق التنبيه"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
