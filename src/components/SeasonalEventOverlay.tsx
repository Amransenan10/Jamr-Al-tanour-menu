import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Copy, Check, Gift, ArrowLeft, Star, Heart } from 'lucide-react';
import { SeasonalEventSettings, EventPreset } from '../types';
import toast from 'react-hot-toast';

interface SeasonalEventOverlayProps {
  settings?: SeasonalEventSettings;
  onApplyPromoCode?: (code: string) => void;
}

export const getPresetDetails = (preset: EventPreset = 'saudi_national_day') => {
  switch (preset) {
    case 'saudi_national_day':
      return {
        badge: 'اليوم الوطني السعودي 🇸🇦',
        themeTitle: 'نحتفل بعز وفخر 🇸🇦',
        colors: {
          primary: '#006C35', // Saudi Palm Green
          accent: '#D4AF37', // Gold
          gradient: 'from-emerald-900 via-green-800 to-emerald-950',
          badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          btnBg: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-600/30',
          glowColor: 'rgba(0, 108, 53, 0.4)',
          particleColors: ['#006C35', '#00A859', '#D4AF37', '#FFFFFF', '#10B981']
        },
        icon: '🇸🇦'
      };
    case 'founding_day':
      return {
        badge: 'يوم التأسيس 🇸🇦 1727م',
        themeTitle: 'يوم بدينا 🌴',
        colors: {
          primary: '#800020', // Burgundy
          accent: '#DAA520', // Sand Gold
          gradient: 'from-amber-950 via-red-950 to-stone-950',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          btnBg: 'bg-gradient-to-r from-amber-600 to-red-700 text-white shadow-amber-600/30',
          glowColor: 'rgba(128, 0, 32, 0.4)',
          particleColors: ['#800020', '#DAA520', '#B8860B', '#D2691E', '#FFFFFF']
        },
        icon: '🏛️'
      };
    case 'back_to_school':
      return {
        badge: 'موسم العودة للمدارس 🎒',
        themeTitle: 'أهلاً بالسنة الجديدة! 📚',
        colors: {
          primary: '#2563EB', // Vibrant Blue
          accent: '#F59E0B', // Bright Amber
          gradient: 'from-blue-950 via-indigo-950 to-slate-950',
          badgeBg: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
          btnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30',
          glowColor: 'rgba(37, 99, 235, 0.4)',
          particleColors: ['#2563EB', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6']
        },
        icon: '🎒'
      };
    case 'ramadan_eid':
      return {
        badge: 'موسم رمضاني ومبارك 🌙',
        themeTitle: 'كل عام وأنتم بخير ✨',
        colors: {
          primary: '#4C1D95', // Deep Purple
          accent: '#FBBF24', // Crescent Gold
          gradient: 'from-purple-950 via-slate-950 to-indigo-950',
          badgeBg: 'bg-purple-500/20 text-amber-300 border-purple-500/40',
          btnBg: 'bg-gradient-to-r from-amber-500 to-purple-600 text-white shadow-purple-600/30',
          glowColor: 'rgba(76, 29, 149, 0.4)',
          particleColors: ['#FBBF24', '#8B5CF6', '#3B82F6', '#EC4899', '#FFFFFF']
        },
        icon: '🌙'
      };
    case 'custom':
    default:
      return {
        badge: 'عرض خاص ومميز 🔥',
        themeTitle: 'عروض احتفالية حصرياً ✨',
        colors: {
          primary: '#FF6200', // Jamr Orange
          accent: '#F59E0B',
          gradient: 'from-zinc-950 via-amber-950 to-zinc-950',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          btnBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-amber-500/30',
          glowColor: 'rgba(255, 98, 0, 0.4)',
          particleColors: ['#FF6200', '#F59E0B', '#EF4444', '#10B981', '#FFFFFF']
        },
        icon: '🎉'
      };
  }
};

export const SeasonalEventOverlay: React.FC<SeasonalEventOverlayProps> = ({
  settings,
  onApplyPromoCode
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isActive = settings?.event_active;
  const preset = settings?.event_preset || 'saudi_national_day';
  const presetDetails = getPresetDetails(preset);

  const title = settings?.event_title || presetDetails.badge;
  const subtitle = settings?.event_subtitle || 'نحتفل معكم بالمناسبة السعيدة! استمتع بكود الخصم الحصري.';
  const promoCode = settings?.event_promo_code || 'SAUDI94';
  const showConfetti = settings?.event_show_confetti ?? true;
  const showModal = settings?.event_show_modal ?? true;

  // Confetti Particle Engine (Zero external dependencies)
  useEffect(() => {
    if (!isActive || !showConfetti) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particleCount = 85;
    const colors = presetDetails.colors.particleColors;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: Math.random() * 9 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3.5 + 2,
      speedX: Math.random() * 2.5 - 1.25,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 5 - 2.5,
      shape: Math.random() > 0.6 ? 'rect' : Math.random() > 0.3 ? 'circle' : 'star'
    }));

    let startTime = Date.now();
    const duration = 7000; // Run confetti for 7 seconds

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.8);
        } else if (p.shape === 'star') {
          // Draw star shape
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * p.size, -Math.sin((18 + i * 72) * Math.PI / 180) * p.size);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * (p.size / 2), -Math.sin((54 + i * 72) * Math.PI / 180) * (p.size / 2));
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }
      });

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, showConfetti, preset]);

  // Modal Dismissal Session Check
  useEffect(() => {
    if (!isActive || !showModal) return;

    const storageKey = `jamr_event_dismissed_${preset}_${promoCode}`;
    const dismissed = localStorage.getItem(storageKey);
    
    if (!dismissed) {
      // Delay modal appearance slightly for smooth experience
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isActive, showModal, preset, promoCode]);

  const handleClose = () => {
    setIsOpen(false);
    const storageKey = `jamr_event_dismissed_${preset}_${promoCode}`;
    localStorage.setItem(storageKey, 'true');
  };

  const handleCopyCode = () => {
    if (!promoCode) return;
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    toast.success(`تم نسخ كود الخصم (${promoCode}) بنجاح! 📋✨`);
    if (onApplyPromoCode) {
      onApplyPromoCode(promoCode);
    }
    setTimeout(() => setCopied(false), 3000);
  };

  if (!isActive) return null;

  return (
    <>
      {/* Canvas for Celebration Confetti Effects */}
      {showConfetti && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-[100]"
          style={{ width: '100vw', height: '100vh' }}
        />
      )}

      {/* Celebration Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6" dir="rtl">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`relative w-full max-w-lg rounded-3xl bg-gradient-to-b ${presetDetails.colors.gradient} text-white p-6 sm:p-8 shadow-2xl border border-white/10 overflow-hidden text-center space-y-6 z-10`}
            >
              {/* Background Glow Effect */}
              <div
                className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: presetDetails.colors.primary, opacity: 0.5 }}
              />
              <div
                className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl pointer-events-none"
                style={{ backgroundColor: presetDetails.colors.accent, opacity: 0.3 }}
              />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/15 rounded-full transition-colors z-20 cursor-pointer"
              >
                <X size={20} />
              </button>

              {/* Top Event Badge & Icon */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs sm:text-sm font-black backdrop-blur-md shadow-lg"
                   style={{ borderColor: presetDetails.colors.accent }}>
                <span className="text-xl animate-bounce">{presetDetails.icon}</span>
                <span className="tracking-wide text-amber-300">{presetDetails.badge}</span>
              </div>

              {/* Main Banner Graphic / Title */}
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                  {title}
                </h2>
                <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-medium px-2">
                  {subtitle}
                </p>
              </div>

              {/* Promo Code Box */}
              {promoCode && (
                <div className="bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl p-4 space-y-2 relative overflow-hidden">
                  <span className="text-xs font-bold text-gray-300 block">كود الخصم الحصري للمناسبة</span>
                  
                  <div className="flex items-center justify-between gap-3 bg-zinc-900/80 p-3 rounded-xl border border-amber-500/30">
                    <div className="flex items-center gap-2">
                      <Gift size={22} className="text-amber-400 animate-pulse" />
                      <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
                        {promoCode}
                      </span>
                    </div>

                    <button
                      onClick={handleCopyCode}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>نسخ الكود</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => {
                    handleCopyCode();
                    handleClose();
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-base transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${presetDetails.colors.btnBg}`}
                >
                  <Sparkles size={20} />
                  <span>اطلب واستفد من الخصم الآن 🚀</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
