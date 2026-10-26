import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, X, Sparkles, Gift, ArrowRight, Phone, CheckCircle2, 
  ShoppingBag, Trophy, Flame, ChevronLeft, Loader2
} from 'lucide-react';
import { supabaseLoyalty } from '../lib/loyaltySupabase';
import { normalizeSaudiPhone } from '../utils/phoneUtils';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCart?: () => void;
  onOpenSpinWheel?: () => void;
  initialPhone?: string;
  onPointsUpdate?: (newPoints: number) => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  isOpen,
  onClose,
  onOpenCart,
  onOpenSpinWheel,
  initialPhone = '',
  onPointsUpdate
}) => {
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  
  // Loyalty config
  const [config, setConfig] = useState({
    earningRate: 1, // كل كم ريال = 1 نقطة
    redemptionRate: 10, // كل كم نقطة = 1 ريال خصم
    minPointsToRedeem: 5,
    isEnabled: true
  });

  const loadCustomerData = async (targetPhone: string) => {
    if (!targetPhone || targetPhone.length < 9) return;
    setLoading(true);
    try {
      if (!supabaseLoyalty) return;

      // Fetch config & customer balance in parallel
      const [{ data: cfg }, { data: cust }] = await Promise.all([
        supabaseLoyalty.from('loyalty_config').select('*').eq('id', 1).maybeSingle(),
        supabaseLoyalty.from('customers').select('points_balance, full_name').eq('phone_number', targetPhone).maybeSingle()
      ]);

      if (cfg) {
        setConfig({
          earningRate: Number(cfg.earning_rate) || 1,
          redemptionRate: Number(cfg.redemption_rate) || 10,
          minPointsToRedeem: Number(cfg.min_points_to_redeem) || 5,
          isEnabled: cfg.is_enabled !== false
        });
      }

      const currentPts = cust?.points_balance || 0;
      setPoints(currentPts);
      if (onPointsUpdate) onPointsUpdate(currentPts);
    } catch (e) {
      console.warn('Error loading loyalty data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const saved = initialPhone || localStorage.getItem('jamr_customer_phone') || localStorage.getItem('customerPhone') || '';
    const clean = saved.replace(/\D/g, '');
    if (clean && clean.length >= 9) {
      setPhone(clean);
      setInputPhone(clean.startsWith('966') ? clean.slice(3) : clean);
      loadCustomerData(clean);
    } else {
      setPhone('');
      setPoints(null);
    }
  }, [isOpen, initialPhone]);

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPhone.trim()) {
      toast.error('الرجاء إدخال رقم الجوال');
      return;
    }

    setIsSavingPhone(true);
    const normalized = normalizeSaudiPhone(inputPhone);
    const clean = normalized.replace(/\D/g, '');
    
    if (clean.length < 9) {
      toast.error('رقم الجوال غير صحيح');
      setIsSavingPhone(false);
      return;
    }

    try {
      localStorage.setItem('jamr_customer_phone', clean);
      setPhone(clean);
      await loadCustomerData(clean);
      toast.success('تم ربط حسابك بنجاح ✨');
    } catch (e) {
      toast.error('تعذر جلب بيانات النقاط');
    } finally {
      setIsSavingPhone(false);
    }
  };

  if (!isOpen) return null;

  const currentPoints = points || 0;
  const discountValue = Math.floor(currentPoints / config.redemptionRate);
  
  // Calculate next goal / milestone (e.g., next multiple of 20 or 50 points)
  const nextMilestone = currentPoints < 50 ? 50 : Math.ceil((currentPoints + 1) / 50) * 50;
  const pointsRemaining = Math.max(0, nextMilestone - currentPoints);
  const milestoneDiscount = Math.floor(nextMilestone / config.redemptionRate);
  const progressPercent = Math.min(100, Math.round((currentPoints / nextMilestone) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10 flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white p-6 pb-8 overflow-hidden">
            {/* Background Decorative Rings */}
            <div className="absolute -top-12 -left-12 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-black/10 blur-lg pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Star className="text-amber-200 fill-amber-200" size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black">برنامج مكافآت مذاق | MITHAQ</h3>
                <p className="text-xs text-amber-100 font-medium">اجمع النقاط مع كل طلب وحولها لخصم فوري</p>
              </div>
            </div>
          </div>

          {/* Main Content Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 size={36} className="text-amber-500 animate-spin" />
                <p className="text-xs text-gray-500 font-bold">جاري تحديث رصيد نقاطك...</p>
              </div>
            ) : !phone ? (
              /* Phone Input View */
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                  <Phone size={30} />
                </div>
                <div>
                  <h4 className="font-black text-lg text-gray-900 dark:text-white">أدخل رقم جوالك</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    لمعرفة رصيد نقاطك المكتسبة والمكافآت الجاهزة للاستخدام في طلبك القادم
                  </p>
                </div>

                <form onSubmit={handleSavePhone} className="space-y-3 pt-2">
                  <div className="relative">
                    <input
                      type="tel"
                      dir="ltr"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      placeholder="05XXXXXXXX"
                      className="w-full py-3.5 px-4 rounded-2xl bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-center font-bold tracking-wider outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingPhone}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-95 text-white font-black rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2"
                  >
                    {isSavingPhone ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    <span>عرض نقاطي ومكافآتي</span>
                  </button>
                </form>
              </div>
            ) : (
              /* Balance & Milestones View */
              <>
                {/* Balance Hero Card */}
                <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 rounded-3xl p-5 text-center relative overflow-hidden">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center justify-center gap-1.5">
                    <Sparkles size={14} />
                    <span>رصيدك المتاح حالياً</span>
                  </div>

                  <div className="flex items-baseline justify-center gap-2 my-2">
                    <span className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                      {currentPoints}
                    </span>
                    <span className="text-base font-bold text-amber-600 dark:text-amber-400">نقطة ذهبية</span>
                  </div>

                  {discountValue > 0 ? (
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-black">
                      <CheckCircle2 size={14} />
                      <span>تمنحك خصماً فورياً بقيمة {discountValue} ر.س</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      كل {config.redemptionRate} نقاط = 1 ر.س خصم في الفاتورة
                    </p>
                  )}
                </div>

                {/* Next Milestone Progress Card */}
                <div className="bg-gray-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-gray-100 dark:border-white/5 space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <Trophy size={15} className="text-amber-500" />
                      <span>المكافأة القادمة: {milestoneDiscount} ر.س خصم</span>
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-black">
                      {currentPoints} / {nextMilestone}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    />
                  </div>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 text-right">
                    {pointsRemaining > 0 
                      ? `باقي لك ${pointsRemaining} نقطة فقط وتفتح خصم ${milestoneDiscount} ريال على طلبك القادم! 🎯`
                      : 'أنت في أعلى مستوى مكافآت! يمكنك استخدام رصيدك كاملاً في السلة 🌟'
                    }
                  </p>
                </div>

                {/* How to earn - 3 micro steps */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-2xl p-3 text-right border border-gray-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs mb-2">
                      1
                    </div>
                    <div className="font-black text-xs text-gray-900 dark:text-white">اطلب وجبتك</div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">تكسب نقطة لكل 10 ريال</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-800/40 rounded-2xl p-3 text-right border border-gray-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-xs mb-2">
                      2
                    </div>
                    <div className="font-black text-xs text-gray-900 dark:text-white">خصم مباشر</div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">استبدل نقاطك بكبسة زر في السلة</p>
                  </div>
                </div>

                {/* Change Phone Link */}
                <div className="text-center pt-1">
                  <button
                    onClick={() => {
                      setPhone('');
                      localStorage.removeItem('jamr_customer_phone');
                    }}
                    className="text-[11px] text-gray-400 hover:text-amber-500 transition-colors underline"
                  >
                    تغيير رقم الجوال ({phone})
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-gray-50 dark:bg-zinc-950 border-t border-gray-100 dark:border-white/10 flex flex-col gap-2">
            {discountValue > 0 && onOpenCart && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCart();
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingBag size={16} />
                <span>استخدم خصم {discountValue} ر.س في السلة</span>
              </button>
            )}

            {onOpenSpinWheel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSpinWheel();
                }}
                className="w-full py-2.5 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 font-bold rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <Gift size={15} className="text-amber-500" />
                <span>عجلة الجوائز اليومية 🎡</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
