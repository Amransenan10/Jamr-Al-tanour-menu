import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, X, Sparkles, ChevronLeft } from 'lucide-react';
import { supabaseLoyalty } from '../lib/loyaltySupabase';

interface LoyaltyReminderBarProps {
  onOpenCart?: () => void;
  onOpenSideMenu?: () => void;
}

export const LoyaltyReminderBar: React.FC<LoyaltyReminderBarProps> = ({ onOpenCart, onOpenSideMenu }) => {
  const [points, setPoints] = useState<number | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [dismissed, setDismissed] = useState(false);
  const [redemptionRate, setRedemptionRate] = useState(10);

  useEffect(() => {
    const savedPhone = localStorage.getItem('jamr_customer_phone') || localStorage.getItem('customerPhone') || '';
    if (!savedPhone) return;

    const cleanPhone = savedPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) return;

    setPhone(cleanPhone);

    const fetchLoyaltyInfo = async () => {
      try {
        if (!supabaseLoyalty) return;
        
        // Config
        const { data: cfg } = await supabaseLoyalty.from('loyalty_config').select('redemption_rate, is_enabled').eq('id', 1).single();
        if (cfg && cfg.is_enabled === false) return;
        if (cfg?.redemption_rate) setRedemptionRate(Number(cfg.redemption_rate));

        // Customer Points
        const { data: cust } = await supabaseLoyalty.from('customers').select('points_balance').eq('phone_number', cleanPhone).single();
        if (cust && cust.points_balance > 0) {
          setPoints(cust.points_balance);
        }
      } catch (e) {
        console.warn('LoyaltyReminderBar fetch warning:', e);
      }
    };

    fetchLoyaltyInfo();
  }, []);

  if (dismissed || points === null || points <= 0) return null;

  const discountVal = Math.floor(points / redemptionRate);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-[90] max-w-md mx-auto"
      >
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white rounded-2xl p-3 shadow-xl shadow-amber-500/20 border border-amber-400/30 flex items-center justify-between gap-2 backdrop-blur-md">
          <div 
            onClick={() => onOpenCart ? onOpenCart() : onOpenSideMenu?.()} 
            className="flex items-center gap-2.5 flex-1 cursor-pointer"
          >
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <Star className="text-amber-200 fill-amber-200" size={20} />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1.5 font-black text-xs text-amber-100">
                <span>رصيد نقاطك المتاحة</span>
                <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] text-white font-bold">{points} نقطة</span>
              </div>
              <p className="text-[11px] font-bold text-white/95">
                {discountVal > 0 ? `تمنحك خصماً بقيمة ${discountVal} ر.س جاهز للاستخدام 🌟` : 'واكسب نقاطاً إضافية مع كل طلب!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onOpenCart ? onOpenCart() : onOpenSideMenu?.()}
              className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-0.5"
            >
              <span>استخدم</span>
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 hover:bg-black/20 text-white/80 hover:text-white rounded-xl transition-colors"
              title="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
