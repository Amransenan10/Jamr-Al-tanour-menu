import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, MessageCircle, Star, Instagram, Twitter, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

interface SideMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  appSettings: any;
}

export const SideMenuDrawer: React.FC<SideMenuDrawerProps> = ({ isOpen, onClose, appSettings }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [pointsResult, setPointsResult] = useState<{ points?: number, error?: string } | null>(null);
  const navigate = useNavigate();

  const handleCheckPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoadingPoints(true);
    setPointsResult(null);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const { data, error } = await supabase
        .from('customer_points')
        .select('points')
        .eq('phone', cleanPhone)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setPointsResult({ points: data.points });
      } else {
        setPointsResult({ points: 0 }); // New customer
      }
    } catch (err: any) {
      setPointsResult({ error: 'حدث خطأ أثناء البحث. حاول مرة أخرى.' });
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleNavigation = (path: string) => {
    onClose();
    navigate(path);
  };

  // Prepare support URL
  const supportPhone = appSettings?.social_whatsapp;
  const supportUrl = supportPhone 
    ? `https://wa.me/${supportPhone}?text=${encodeURIComponent('أهلاً، لدي استفسار/شكوى بخصوص مطعم جمر التنور:')}`
    : '#';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[85vw] max-w-sm bg-white dark:bg-zinc-950 shadow-2xl z-[110] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span className="text-2xl">👋</span> أهلاً بك
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                title="إغلاق القائمة"
              >
                <X size={24} className="text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Group 1: Navigation */}
              <div className="space-y-3">
                <button 
                  onClick={() => handleNavigation('/my-orders')}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 hover:border-primary/50 transition-colors text-right"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">طلباتي السابقة</h3>
                    <p className="text-sm text-gray-500">تتبع طلباتك وتاريخها</p>
                  </div>
                </button>
              </div>

              {/* Group 2: Points Component */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-amber-500 text-white p-2 rounded-xl">
                    <Star size={20} />
                  </div>
                  <h3 className="font-bold text-amber-600 dark:text-amber-400">نقاطي ومكافآتي</h3>
                </div>
                
                <form onSubmit={handleCheckPoints} className="space-y-3">
                  <p className="text-xs text-gray-500">أدخل رقم جوالك لمعرفة رصيد نقاطك</p>
                  <div className="flex gap-2">
                    <input 
                      type="tel"
                      placeholder="05xxxx..."
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="flex-1 bg-white dark:bg-zinc-900 border border-amber-500/20 rounded-xl px-3 py-2 text-sm focus:border-amber-500 outline-none w-full"
                      dir="ltr"
                    />
                    <button 
                      type="submit"
                      disabled={loadingPoints || !phoneNumber}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {loadingPoints ? 'جاري...' : 'تحقق'}
                    </button>
                  </div>
                </form>

                {pointsResult && (
                  <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-xl border border-amber-500/20 text-center">
                    {pointsResult.error ? (
                      <span className="text-red-500 text-sm font-bold">{pointsResult.error}</span>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs text-gray-500 font-bold">رصيد نقاطك المتاح هو</span>
                        <span className="text-3xl font-black text-amber-500">{pointsResult.points}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Group 3: Support */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 mb-3">الدعم والمساعدة</h3>
                
                {supportPhone ? (
                  <a 
                    href={supportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 hover:border-green-500/50 transition-colors text-right"
                  >
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/20">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-green-700 dark:text-green-400">مقترح أو شكوى</h3>
                      <p className="text-sm text-green-600/70 dark:text-green-500/70">تواصل مع الإدارة عبر الواتساب</p>
                    </div>
                  </a>
                ) : (
                  <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 text-center">
                    <p className="text-sm text-gray-500">خدمة الواتساب غير متوفرة حالياً</p>
                  </div>
                )}
              </div>

              {/* Group 4: Socials */}
              {appSettings && (
                 <div className="space-y-3">
                    <h3 className="text-sm font-bold text-gray-400 mb-3">حسابات التواصل</h3>
                    <div className="flex flex-wrap gap-2">
                       {appSettings.social_instagram && (
                         <a href={appSettings.social_instagram} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-gray-100 dark:bg-zinc-800 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-gray-500 dark:text-gray-300">
                           <Instagram size={24} />
                         </a>
                       )}
                       {appSettings.social_twitter && (
                         <a href={appSettings.social_twitter} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-gray-100 dark:bg-zinc-800 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-gray-500 dark:text-gray-300">
                           <Twitter size={24} />
                         </a>
                       )}
                       {appSettings.social_snapchat && (
                         <a href={appSettings.social_snapchat} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-gray-500 dark:text-gray-300 flex items-center justify-center font-bold text-xl leading-none w-[52px] h-[52px]">
                           👻
                         </a>
                       )}
                       {appSettings.social_tiktok && (
                         <a href={appSettings.social_tiktok} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors text-gray-500 dark:text-gray-300 flex items-center justify-center font-bold text-xl leading-none w-[52px] h-[52px]">
                           🎵
                         </a>
                       )}
                    </div>
                 </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-100 dark:border-white/5 text-center">
              <p className="text-xs text-gray-400 font-medium">جمر التنور © 2024</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
