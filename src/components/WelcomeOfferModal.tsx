import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Sparkles, X, Phone, User, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { supabaseLoyaltyAdmin } from '../lib/loyaltySupabase';
import toast from 'react-hot-toast';

interface WelcomeOfferModalProps {
  onSuccess?: (phone: string, points: number) => void;
  welcomePointsAmount?: number;
  isEnabled?: boolean;
}

export const WelcomeOfferModal: React.FC<WelcomeOfferModalProps> = ({
  onSuccess,
  welcomePointsAmount = 50,
  isEnabled = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Dynamic Points Amount State
  const [effectivePoints, setEffectivePoints] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('jamr_welcome_points_amount') : null;
    return saved ? Number(saved) : welcomePointsAmount;
  });

  // Sync points dynamically on mount
  useEffect(() => {
    const fetchLatestConfig = async () => {
      try {
        const { data: loyaltyCfg } = await supabase
          .from('loyalty_config')
          .select('welcome_bonus_points')
          .eq('id', 1)
          .maybeSingle();

        if (loyaltyCfg && Number(loyaltyCfg.welcome_bonus_points) > 0) {
          const pts = Number(loyaltyCfg.welcome_bonus_points);
          setEffectivePoints(pts);
          localStorage.setItem('jamr_welcome_points_amount', String(pts));
          return;
        }
      } catch (e) {}

      // Fallback to local storage or prop
      const saved = localStorage.getItem('jamr_welcome_points_amount');
      if (saved) {
        setEffectivePoints(Number(saved));
      } else if (welcomePointsAmount) {
        setEffectivePoints(welcomePointsAmount);
      }
    };

    fetchLatestConfig();
  }, [welcomePointsAmount]);

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    // Check if user already claimed or dismissed
    const hasClaimed = localStorage.getItem('jamr_welcome_offer_claimed');
    const hasDismissed = sessionStorage.getItem('jamr_welcome_offer_dismissed');
    const existingPhone = localStorage.getItem('jamr_customer_phone');

    if (hasClaimed || hasDismissed || existingPhone) {
      return;
    }

    // Trigger after 2.5 seconds for smooth, non-intrusive appearance
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isEnabled]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('jamr_welcome_offer_dismissed', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Name (REQUIRED)
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error('يرجى كتابة اسمك الكريم لتسجيل هديتك 🌸');
      return;
    }

    // Validate Phone (REQUIRED)
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      toast.error('يرجى إدخال رقم جوال صحيح مكون من 10 أرقام (05xxxxxxxx)');
      return;
    }

    setSubmitting(true);
    try {
      // Format 05xxxxxxxx
      let formattedPhone = cleanPhone;
      if (!formattedPhone.startsWith('05') && formattedPhone.length === 9 && formattedPhone.startsWith('5')) {
        formattedPhone = '0' + formattedPhone;
      }

      const client = supabaseLoyaltyAdmin || supabase;

      // 1. Anti-fraud check: Check if phone already registered in database
      const { data: existingCustomer } = await client
        .from('customers')
        .select('phone_number, full_name, points_balance')
        .eq('phone_number', formattedPhone)
        .maybeSingle();

      if (existingCustomer) {
        // Customer already exists! Do NOT grant welcome points again
        toast(
          `أهلاً بك مجدداً يا ${existingCustomer.full_name || cleanName}! رقمك مسجل بالفعل ورصيدك الحالي ${existingCustomer.points_balance || 0} نقطة 🌟`,
          { icon: '👋', duration: 5000 }
        );

        localStorage.setItem('jamr_customer_phone', formattedPhone);
        localStorage.setItem('jamr_customer_name', existingCustomer.full_name || cleanName);
        localStorage.setItem('jamr_welcome_offer_claimed', 'true');

        if (onSuccess) {
          onSuccess(formattedPhone, existingCustomer.points_balance || 0);
        }

        setIsOpen(false);
        return;
      }

      // 2. Genuine New Customer: Register and grant welcome points
      const initialPoints = effectivePoints || 50;

      const { error } = await client
        .from('customers')
        .insert({
          phone_number: formattedPhone,
          full_name: cleanName,
          points_balance: initialPoints,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.warn('New customer registration warning:', error.message);
        // Fallback upsert attempt
        await client.from('customers').upsert({
          phone_number: formattedPhone,
          full_name: cleanName,
          points_balance: initialPoints,
          updated_at: new Date().toISOString()
        }, { onConflict: 'phone_number' });
      }

      // Save locally
      localStorage.setItem('jamr_customer_phone', formattedPhone);
      localStorage.setItem('jamr_customer_name', cleanName);
      localStorage.setItem('jamr_welcome_offer_claimed', 'true');

      setClaimed(true);
      toast.success(`🎉 مبروك يا ${cleanName}! تم إضافة ${initialPoints} نقطة هدية في حسابك!`);

      if (onSuccess) {
        onSuccess(formattedPhone, initialPoints);
      }

      setTimeout(() => {
        setIsOpen(false);
      }, 2000);
    } catch (err: any) {
      console.error('Welcome offer error:', err);
      toast.error('حدث خطأ أثناء تفعيل الهدية، يرجى المحاولة لاحقاً');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-right overflow-hidden shadow-2xl shadow-amber-500/10 text-white"
          dir="rtl"
        >
          {/* Background Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="إغلاق"
          >
            <X size={20} />
          </button>

          {!claimed ? (
            <div className="space-y-5">
              {/* Header Icon */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 shrink-0">
                  <Gift size={28} className="animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400 text-xs font-black">
                    <Sparkles size={14} />
                    <span>هدية ترحيبية خاصة بالزوار الجدد</span>
                  </div>
                  <h2 className="text-xl font-black text-white mt-0.5">يا هلا بك في جمر التنور! 🔥</h2>
                </div>
              </div>

              {/* Offer description */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4">
                <p className="text-sm font-bold text-gray-200 leading-relaxed">
                  سجّل الآن واحصل على{' '}
                  <span className="text-amber-400 font-black text-base underline underline-offset-4">
                    {effectivePoints} نقطة مجانية
                  </span>{' '}
                  في رصيدك فوراً، واستبدلها بخصومات على أشهى وجباتنا! 🍕🍔
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    الاسم الكريم <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="اكتب اسمك هنا"
                      className="w-full bg-black/40 border border-white/10 focus:border-amber-500 rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-white placeholder:text-gray-500 outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    رقم الجوال <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full bg-black/40 border border-white/10 focus:border-amber-500 rounded-xl pr-10 pl-4 py-2.5 text-sm font-bold text-white placeholder:text-gray-500 outline-none transition-colors"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !phone || !name}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>جاري تفعيل هديتك...</span>
                    </>
                  ) : (
                    <>
                      <span>احصل على {effectivePoints} نقطة الآن</span>
                      <ArrowLeft size={16} />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-200 py-1 transition-colors cursor-pointer"
                >
                  تصفح المنيو أولاً
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-2xl font-black text-white">تم تفعيل هديتك بنجاح! 🎉</h3>
              <p className="text-sm font-bold text-gray-300">
                أضيفت <span className="text-amber-400 font-black">{effectivePoints} نقطة</span> إلى حسابك! نتمنى لك وجبة هنيئة في جمر التنور.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};