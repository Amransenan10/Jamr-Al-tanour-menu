import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Trophy, Gift, Copy, Check, Star, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';

export interface Prize {
  id: number | string;
  label: string;
  code?: string;
  type: 'discount' | 'item' | 'points' | 'free_delivery' | 'unlucky';
  color: string;
  discount_value?: number;
  discount_type?: 'percentage' | 'fixed' | 'free_delivery';
}

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyCoupon?: (code: string) => void;
  prizes?: Prize[];
  title?: string;
  customerPhone?: string;
  orderId?: string;
}

const DEFAULT_PRIZES: Prize[] = [
  { id: 1, label: 'خصم 10% لطلبك القادم', code: '', type: 'discount', color: '#f59e0b', discount_value: 10, discount_type: 'percentage' },
  { id: 2, label: 'توصيل مجاني لطلبك القادم 🚚', code: '', type: 'free_delivery', color: '#10b981', discount_value: 0, discount_type: 'free_delivery' },
  { id: 3, label: 'مشروب مجاني مع طلبك 🥤', code: '', type: 'item', color: '#ec4899', discount_value: 10, discount_type: 'fixed' },
  { id: 4, label: '50 نقطة ولاء مجانية 🌟', code: '', type: 'points', color: '#8b5cf6' },
  { id: 5, label: 'خصم 15% على الوجبات', code: '', type: 'discount', color: '#3b82f6', discount_value: 15, discount_type: 'percentage' },
  { id: 6, label: 'وفّر 10 ر.س لطلبك القادم 💵', code: '', type: 'discount', color: '#ef4444', discount_value: 10, discount_type: 'fixed' },
  { id: 7, label: 'حظ أوفير في الطلب القادم ⭐️', code: '', type: 'unlucky', color: '#6b7280' },
];

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  onApplyCoupon,
  prizes,
  title,
  customerPhone = '',
  orderId = ''
}) => {
  const activePrizes = (prizes && prizes.length > 0) ? prizes : DEFAULT_PRIZES;

  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [pointsGranted, setPointsGranted] = useState<number | null>(null);
  const [savingPrize, setSavingPrize] = useState(false);

  // Check if customer already spun for this specific order
  const wheelStorageKey = orderId ? `jamr_wheel_spun_${orderId}` : `jamr_wheel_spun_time`;
  const [hasSpun, setHasSpun] = useState(() => {
    const value = localStorage.getItem(wheelStorageKey);
    if (!value) return false;
    if (orderId) return true;
    const hours = (Date.now() - parseInt(value)) / (1000 * 60 * 60);
    return hours < 24;
  });

  if (!isOpen) return null;

  const handleSpin = () => {
    if (spinning || hasSpun) return;

    setSpinning(true);
    setWinningPrize(null);
    setGeneratedCode('');
    setPointsGranted(null);

    // Pick a prize index (weighted random, non-unlucky preferred)
    const prizeIndex = Math.floor(Math.random() * activePrizes.length);
    const selectedPrize = activePrizes[prizeIndex] || activePrizes[0];

    // Calculate rotation angle
    const segmentAngle = 360 / activePrizes.length;
    const extraRounds = (6 + Math.floor(Math.random() * 3)) * 360;
    const targetAngle = extraRounds + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

    setRotation(prev => prev + targetAngle);

    setTimeout(async () => {
      setSpinning(false);
      setWinningPrize(selectedPrize);
      setHasSpun(true);
      localStorage.setItem(wheelStorageKey, Date.now().toString());

      // Save Prize dynamically to Supabase & Generate Unique Single-Use Code
      if (selectedPrize.type !== 'unlucky') {
        setSavingPrize(true);
        try {
          const cleanPhone = customerPhone.replace(/\D/g, '') || '0500000000';
          const shortPhone = cleanPhone.slice(-4);

          if (selectedPrize.type === 'points') {
            // Loyalty points prize
            const pointsVal = selectedPrize.discount_value || 50;
            setPointsGranted(pointsVal);

            // Fetch & update customer points in Supabase
            const { data: existingCust } = await supabase
              .from('customers')
              .select('points_balance')
              .eq('phone_number', cleanPhone)
              .single();

            const currentBal = existingCust?.points_balance || 0;
            const newBal = currentBal + pointsVal;

            let res = await supabaseAdmin
              .from('customers')
              .upsert([{ phone_number: cleanPhone, points_balance: newBal }], { onConflict: 'phone_number' });

            if (res.error) {
              await supabase.from('customers').upsert([{ phone_number: cleanPhone, points_balance: newBal }], { onConflict: 'phone_number' });
            }

            toast.success(`🎉 مبروك! أضيفت ${pointsVal} نقطة ولاء لرصيدك بنجاح! 🌟`);

          } else {
            // Dynamic Single-Use Coupon Prize
            const uniqueCode = `SPIN-${shortPhone}-${Math.floor(1000 + Math.random() * 9000)}`;
            setGeneratedCode(uniqueCode);

            // Determine discount type and value compliant with DB constraint (percentage or fixed or free_delivery)
            let discType: 'percentage' | 'fixed' | 'free_delivery' = 'percentage';
            let discVal = 10;

            if (selectedPrize.type === 'free_delivery' || selectedPrize.discount_type === 'free_delivery' || selectedPrize.label.includes('توصيل')) {
              discType = 'free_delivery';
              discVal = 0;
            } else if (selectedPrize.discount_type === 'fixed') {
              discType = 'fixed';
              discVal = selectedPrize.discount_value !== undefined ? selectedPrize.discount_value : 10;
            } else {
              discType = 'percentage';
              discVal = selectedPrize.discount_value !== undefined ? selectedPrize.discount_value : 10;
            }

            const couponData = {
              code: uniqueCode,
              discount_type: discType,
              discount_value: discVal,
              max_uses: 1,
              current_uses: 0,
              is_active: true,
              bound_phone: cleanPhone
            };

            // Save to LocalStorage as instant guaranteed fallback
            try {
              const localCoupons = JSON.parse(localStorage.getItem('jamr_dynamic_coupons') || '[]');
              localCoupons.push(couponData);
              localStorage.setItem('jamr_dynamic_coupons', JSON.stringify(localCoupons));
            } catch (e) {
              console.error('LocalStorage coupon save error:', e);
            }

            // DB Insert (mapping free_delivery to fixed 5 SAR for DB constraint check)
            const dbType = discType === 'free_delivery' ? 'fixed' : discType;
            const dbVal = discType === 'free_delivery' ? 5 : discVal;

            const couponPayload = {
              code: uniqueCode,
              discount_type: dbType,
              discount_value: dbVal,
              max_uses: 1,
              current_uses: 0,
              is_active: true
            };

            let res = await supabaseAdmin.from('coupons').insert([couponPayload]);
            if (res.error) {
              await supabase.from('coupons').insert([couponPayload]);
            }

            // Save to localStorage for quick user reference
            localStorage.setItem('jamr_applied_promo', uniqueCode);
            toast.success(`🎉 مبروك! فزت بـ (${selectedPrize.label})`);
          }
        } catch (err) {
          console.error('Error auto-generating coupon/points:', err);
        } finally {
          setSavingPrize(false);
        }
      } else {
        toast('حظاً سعيداً في الطلب القادم! ⭐️', { icon: '🎁' });
      }
    }, 4500);
  };

  const handleCopyCode = () => {
    const codeToCopy = generatedCode || winningPrize?.code;
    if (!codeToCopy) return;

    navigator.clipboard.writeText(codeToCopy);
    setCopied(true);
    toast.success('تم نسخ كود الخصم!');
    setTimeout(() => setCopied(false), 2000);
    if (onApplyCoupon) {
      onApplyCoupon(codeToCopy);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 dir-rtl text-right">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-zinc-900 border border-amber-500/20 rounded-3xl p-6 w-full max-w-sm sm:max-w-md relative overflow-hidden shadow-2xl"
      >
        {/* Glow Effects */}
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
        <div className="text-center space-y-1.5 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full text-xs font-black">
            <Sparkles size={14} className="animate-spin" />
            <span>هدية فورية بعد الطلب 🎉</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">{title || 'دَوّر واكسب هديتك لطلبك القادم!'}</h2>
          <p className="text-xs text-gray-400">تدوير حصري مرة واحدة لكل طلب ناجح</p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto my-3 flex items-center justify-center">
          {/* Top Golden Pointer Arrow */}
          <div className="absolute -top-3.5 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-400 drop-shadow-[0_4px_8px_rgba(245,158,11,0.6)]" />

          {/* SVG Wheel */}
          <div 
            className="w-full h-full rounded-full border-4 border-amber-500/40 shadow-2xl overflow-hidden transition-all duration-[4500ms] ease-[cubic-bezier(0.15,0.99,0.18,0.99)]"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {activePrizes.map((prize, idx) => {
                const angle = 360 / activePrizes.length;
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
                  <g key={prize.id || idx}>
                    <path
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
                      fill={prize.color || '#f59e0b'}
                      opacity={0.92}
                      stroke="#18181b"
                      strokeWidth="0.8"
                    />
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="3.6"
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

          {/* Center Action Button */}
          <button
            onClick={handleSpin}
            disabled={spinning || hasSpun}
            className={cn(
              "absolute z-10 w-16 h-16 rounded-full border-4 border-zinc-900 shadow-2xl flex flex-col items-center justify-center font-black text-xs transition-all cursor-pointer",
              spinning
                ? "bg-amber-500 text-black animate-pulse"
                : hasSpun
                ? "bg-zinc-800 text-gray-400 cursor-not-allowed opacity-80"
                : "bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-black hover:scale-110 active:scale-95 shadow-amber-500/50"
            )}
          >
            {spinning ? 'جاري...' : hasSpun ? 'تم!' : 'دَوّر!'}
          </button>
        </div>

        {/* Winner Announcement Section */}
        <AnimatePresence>
          {winningPrize && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mt-3 bg-zinc-800/90 border border-amber-500/30 p-4 rounded-2xl text-center space-y-3 shadow-xl"
            >
              {winningPrize.type !== 'unlucky' ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-sm">
                    <Trophy size={18} className="text-amber-400 animate-bounce" />
                    <span>مبروك! لقد كسبت: {winningPrize.label}</span>
                  </div>

                  {pointsGranted !== null ? (
                    <div className="bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl text-purple-300 font-bold text-xs flex items-center justify-center gap-2">
                      <Star size={16} className="text-purple-400" />
                      <span>تم إضافة {pointsGranted} نقطة محفظة لرقمك تلقائياً لاستخدامها في الطلب القادم 🌟</span>
                    </div>
                  ) : generatedCode ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-white/10">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">كود الخصم المخصص لك:</p>
                          <span className="font-mono text-amber-400 font-black text-sm px-1">
                            {generatedCode}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyCode}
                          className="px-3 py-1.5 bg-zinc-800 text-gray-200 text-xs font-bold rounded-lg flex items-center gap-1.5 hover:bg-zinc-700 cursor-pointer"
                        >
                          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                          <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-emerald-400 font-bold">
                        * الكود صالح للاستخدام مرة واحدة فقط لطلبك القادم برقم جوالك.
                      </p>
                    </div>
                  ) : savingPrize ? (
                    <div className="text-xs text-amber-400 animate-pulse font-bold">
                      جاري إصدار هديتك وكودك الخاص...
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-gray-400 text-xs font-bold">
                  حظاً سعيداً! حاول التدوير مجدداً بعد طلبك القادم.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Note */}
        <p className="text-[10px] text-gray-500 text-center mt-3">
          * الكوبونات صالحة لطلبك القادم ومحمية برقم جوالك.
        </p>
      </motion.div>
    </div>
  );
};
