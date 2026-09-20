import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, X, Copy, Check, Sparkles } from 'lucide-react';
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

  const displayText = isEventActive
    ? `${eventSettings?.event_title || presetDetails.badge} - ${eventSettings?.event_subtitle || text}`
    : text;

  const activeShow = isEventActive || (isActive && text);

  if (!activeShow || !isVisible) return null;

  const handleCopyCode = () => {
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
            ? `bg-gradient-to-r ${presetDetails.colors.gradient} border-b-2 text-white shadow-xl relative z-[60]`
            : `bg-zinc-950 border-b-2 border-primary/50 text-white shadow-xl relative z-[60]`
        }
        style={{
          borderColor: isEventActive ? presetDetails.colors.accent : undefined
        }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            <div
              className="p-2 rounded-full shrink-0 shadow-lg flex items-center justify-center text-lg"
              style={{
                backgroundColor: isEventActive ? presetDetails.colors.glowColor : 'rgba(255, 98, 0, 0.2)'
              }}
            >
              {isEventActive ? (
                <span className="animate-bounce">{presetDetails.icon}</span>
              ) : (
                <Megaphone size={18} className="text-primary animate-pulse" />
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <p className="font-black text-[14px] md:text-base leading-snug text-white tracking-wide truncate">
                {displayText}
              </p>
            </div>
          </div>

          {/* Optional Copy Promo Code Button */}
          {isEventActive && promoCode && (
            <button
              onClick={handleCopyCode}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-amber-300 font-mono text-xs font-black rounded-lg border border-amber-400/30 transition-all shrink-0 cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'تم النسخ' : promoCode}</span>
            </button>
          )}

          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-full transition-colors shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
