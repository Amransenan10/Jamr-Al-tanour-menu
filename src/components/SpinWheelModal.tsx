import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Trophy, Gift, Copy, Check, Volume2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon?: (code: string) => void;
}

interface Prize {
  id: number;
  label: string;
  code: string;
  type: 'discount' | 'item' | 'points' | 'unlucky';
  color: string;
}

const PRIZES: Prize[] = [
  { id: 1, label: 'خصم 10%', code: 'WHEEL10', type: 'discount', color: '#f59e0b' },
  { id: 2, label: 'مشروب مجاني', code: 'FREEJUICE', type: 'item', color: '#ec4899' },
  { id: 3, label: 'خصم 15%', code: 'WHEEL15', type: 'discount', color: '#10b981' },
  { id: 4, label: 'مقبلات مجانية', code: 'FREEAPP', type: 'item', color: '#6366f1' },
  { id: 5, label: '50 نقطة ولاء', code: 'POINTS50', type: 'points', color: '#8b5cf6' },
  { id: 6, label: 'خصم 20%', code: 'WHEEL20', type: 'discount', color: '#ef4444' },
  { id: 7, label: 'وفّر 5 ر.س', code: 'SAVE5', type: 'discount', color: '#14b8a6' },
  { id: 8, label: 'حظ أوفير غداً', code: '', type: 'unlucky', color: '#6b7280' },
];

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  onApplyCoupon
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [copied, setCopied] = useState(false);
  const [hasSpun, setHasSpun] = useState(() => {
    const lastSpin = localStorage.getItem('jamr_last_spin_time');
    if (!lastSpin) return false;
    // Check if 24 hours passed
    const hours = (Date.now() - parseInt(lastSpin)) / (1000 * 60 * 60);
    return hours < 24;
  });

  if (!isOpen) return null;

  const handleSpin = () => {
    if (spinning || hasSpun) return;

    setSpinning(true);
    setWinningPrize(null);

    // Pick a prize (weighted random, pick index 0 to 6 with higher chance)
    const prizeIndex = Math.floor(Math.random() * (PRIZES.length - 1)); // 0..6
    const selectedPrize = PRIZES[prizeIndex];

    // Calculate rotation angle
    const segmentAngle = 360 / PRIZES.length;
    // Extra full spins (5 to 8 rounds)
    const extraRounds = (5 + Math.floor(Math.random() * 3)) * 360;
    // Target angle (invert because wheel spins clockwise)
    const targetAngle = extraRounds + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

    setRotation(prev => prev + targetAngle);

    setTimeout(() => {
      setSpinning(false);
      setWinningPrize(selectedPrize);
      setHasSpun(true);
      localStorage.setItem('jamr_last_spin_time', Date.now().toString());

      if (selectedPrize.type !== 'unlucky') {
        toast.success(`🎉 مبروك! فزت بـ ${selectedPrize.label}`);
      }
    }, 4500);
  };

  const handleCopyCode = () => {
    if (!winningPrize?.code) return;
    navigator.clipboard.writeText(winningPrize.code);
    setCopied(true);
    toast.success('تم نسخ كود الخصم!');
    setTimeout(() => setCopied(false), 2000);
    if (onApplyCoupon) {
      onApplyCoupon(winningPrize.code);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-right">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm sm:max-w-md relative overflow-hidden shadow-2xl"
      >
        {/* Glow background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 w-9 h-9 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-black">
            <Sparkles size={14} />
            <span>عجلة الحظ والجوائز الفورية</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">دَوّر واكسب جوائز المنيو!</h2>
          <p className="text-xs text-gray-400">جرب حظك الآن واحصل على كوبونات خصم وهدايا مباشرة</p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto my-4 flex items-center justify-center">
          {/* Wheel Pointer Arrow */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 drop-shadow-md" />

          {/* SVG Wheel */}
          <div 
            className="w-full h-full rounded-full border-4 border-amber-500/30 shadow-2xl overflow-hidden transition-all duration-[4500ms] ease-[cubic-bezier(0.15,0.99,0.18,0.99)]"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {PRIZES.map((prize, idx) => {
                const angle = 360 / PRIZES.length;
                const startAngle = idx * angle;
                const endAngle = (idx + 1) * angle;
                
                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                const textAngle = startAngle + angle / 2;
                const textRad = (Math.PI * textAngle) / 180;
                const textX = 50 + 32 * Math.cos(textRad);
                const textY = 50 + 32 * Math.sin(textRad);

                return (
                  <g key={prize.id}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color}
                      opacity={0.9}
                      stroke="#18181b"
                      strokeWidth="0.8"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="3.8"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                    >
                      {prize.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center Spin Button Badge */}
          <button
            onClick={handleSpin}
            disabled={spinning || hasSpun}
            className={cn(
              "absolute z-10 w-16 h-16 rounded-full border-4 border-zinc-900 shadow-xl flex items-center justify-center font-black text-xs transition-all cursor-pointer",
              spinning
                ? "bg-amber-500 text-black animate-pulse"
                : hasSpun
                ? "bg-zinc-800 text-gray-400 cursor-not-allowed opacity-80"
                : "bg-gradient-to-tr from-amber-500 to-orange-500 text-black hover:scale-110 active:scale-95 shadow-amber-500/50"
            )}
          >
            {spinning ? 'جاري...' : hasSpun ? 'تم التدوير' : 'دَوّر!'}
          </button>
        </div>

        {/* Prize Winner Modal Result */}
        <AnimatePresence>
          {winningPrize && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-4 bg-zinc-800/90 border border-amber-500/30 p-4 rounded-2xl text-center space-y-3"
            >
              {winningPrize.type !== 'unlucky' ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm">
                    <Trophy size={18} />
                    <span>مبروك! لقد كسبت: {winningPrize.label}</span>
                  </div>

                  {winningPrize.code && (
                    <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                      <span className="font-mono text-amber-400 font-black text-sm px-2">
                        {winningPrize.code}
                      </span>
                      <button
                        onClick={handleCopyCode}
                        className="px-3 py-1.5 bg-amber-500 text-black text-xs font-black rounded-lg flex items-center gap-1.5 hover:brightness-110 cursor-pointer"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-400 text-xs font-bold">
                  حظاً سعيداً! حاول التدوير مجدداً بعد 24 ساعة.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Note */}
        <p className="text-[10px] text-gray-500 text-center mt-4">
          * يحق لكل عميل محاولة واحدة كل 24 ساعة. الكوبونات سارية لفترة محدودة.
        </p>
      </motion.div>
    </div>
  );
};
