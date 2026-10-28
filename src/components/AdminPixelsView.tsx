import React from 'react';
import { Activity, Play, Check, Loader2, ToggleRight, ToggleLeft, ExternalLink, Gift, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { MarketingPixelsConfig } from '../services/pixelTrackingService';

interface AdminPixelsViewProps {
  pixelForm: MarketingPixelsConfig;
  setPixelForm: React.Dispatch<React.SetStateAction<MarketingPixelsConfig>>;
  welcomeOfferForm: { enabled: boolean; points_amount: number };
  setWelcomeOfferForm: React.Dispatch<React.SetStateAction<{ enabled: boolean; points_amount: number }>>;
  saving: boolean;
  onSave: (e: React.FormEvent) => void;
  onTest: () => void;
}

export const AdminPixelsView: React.FC<AdminPixelsViewProps> = ({
  pixelForm,
  setPixelForm,
  welcomeOfferForm,
  setWelcomeOfferForm,
  saving,
  onSave,
  onTest
}) => {
  return (
    <div className="space-y-6 text-right" dir="rtl">
      <form onSubmit={onSave} className="space-y-6">
        {/* Header description */}
        <div className="bg-gradient-to-r from-indigo-950/60 via-zinc-900 to-indigo-950/40 p-6 rounded-3xl border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>منظومة أدوات التتبع والبيكسل الذكية</span>
                <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-indigo-500/30">Live Tracking</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                اربط إعلانات سناب شات وتيك توك وإنستغرام وقوقل لقياس المبيعات وأحداث الشراء تلقائياً دون كتابة كود.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onTest}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
              title="إرسال حدث تجريبي للمنصات لفحص الاتصال"
            >
              <Play size={14} className="text-amber-400 fill-amber-400" />
              <span>فحص اتصال البيكسل 🚀</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>حفظ وتفعيل الإعدادات</span>
            </button>
          </div>
        </div>

        {/* Pixels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Snapchat Pixel */}
          <div className="bg-zinc-900 border border-white/5 hover:border-yellow-500/30 p-5 rounded-3xl space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 text-yellow-400 flex items-center justify-center font-black text-lg border border-yellow-400/20">
                  👻
                </div>
                <div>
                  <h4 className="font-black text-white text-base">بيكسل سناب شات (Snapchat Pixel)</h4>
                  <p className="text-xs text-gray-400">تتبع تحويلات حملات سناب شات وحسابات المشاهير</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPixelForm(p => ({ ...p, snapchat_enabled: !p.snapchat_enabled }))}
                className={cn("cursor-pointer transition-colors", pixelForm.snapchat_enabled ? "text-yellow-400" : "text-gray-600")}
              >
                {pixelForm.snapchat_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Snapchat Pixel ID</label>
              <input
                type="text"
                value={pixelForm.snapchat_pixel_id || ''}
                onChange={e => setPixelForm(p => ({ ...p, snapchat_pixel_id: e.target.value }))}
                placeholder="مثال: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-black/40 border border-white/10 focus:border-yellow-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-white/5">
              <span>الأحداث: ViewContent, AddToCart, Purchase</span>
              <a href="https://ads.snapchat.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline flex items-center gap-1">
                <span>لوحة إعلانات سناب</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* 2. TikTok Pixel */}
          <div className="bg-zinc-900 border border-white/5 hover:border-cyan-500/30 p-5 rounded-3xl space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center font-black text-lg border border-cyan-400/20">
                  🎵
                </div>
                <div>
                  <h4 className="font-black text-white text-base">بيكسل تيك توك (TikTok Pixel)</h4>
                  <p className="text-xs text-gray-400">تتبع نقرات وإعلانات تيك توك المباشرة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPixelForm(p => ({ ...p, tiktok_enabled: !p.tiktok_enabled }))}
                className={cn("cursor-pointer transition-colors", pixelForm.tiktok_enabled ? "text-cyan-400" : "text-gray-600")}
              >
                {pixelForm.tiktok_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">TikTok Pixel ID</label>
              <input
                type="text"
                value={pixelForm.tiktok_pixel_id || ''}
                onChange={e => setPixelForm(p => ({ ...p, tiktok_pixel_id: e.target.value }))}
                placeholder="مثال: CXXXXXXXXXXXXXXX"
                className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-white/5">
              <span>الأحداث: ViewContent, AddToCart, CompletePayment</span>
              <a href="https://ads.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline flex items-center gap-1">
                <span>مدير إعلانات تيك توك</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* 3. Meta Pixel (Facebook & Instagram) */}
          <div className="bg-zinc-900 border border-white/5 hover:border-blue-500/30 p-5 rounded-3xl space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-lg border border-blue-500/20">
                  📷
                </div>
                <div>
                  <h4 className="font-black text-white text-base">بيكسل ميتا (Instagram & Facebook)</h4>
                  <p className="text-xs text-gray-400">تتبع إعلانات الإنستغرام والستوري والريلز</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPixelForm(p => ({ ...p, meta_enabled: !p.meta_enabled }))}
                className={cn("cursor-pointer transition-colors", pixelForm.meta_enabled ? "text-blue-400" : "text-gray-600")}
              >
                {pixelForm.meta_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">Meta Pixel ID</label>
              <input
                type="text"
                value={pixelForm.meta_pixel_id || ''}
                onChange={e => setPixelForm(p => ({ ...p, meta_pixel_id: e.target.value }))}
                placeholder="مثال: 123456789012345"
                className="w-full bg-black/40 border border-white/10 focus:border-blue-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-white/5">
              <span>الأحداث: ViewContent, AddToCart, Purchase</span>
              <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                <span>Events Manager</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>

          {/* 4. Google Analytics 4 */}
          <div className="bg-zinc-900 border border-white/5 hover:border-amber-500/30 p-5 rounded-3xl space-y-4 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-lg border border-amber-500/20">
                  📊
                </div>
                <div>
                  <h4 className="font-black text-white text-base">إحصائيات قوقل (Google Analytics 4)</h4>
                  <p className="text-xs text-gray-400">تحليل مسار الزائر والمدة والأجهزة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPixelForm(p => ({ ...p, ga4_enabled: !p.ga4_enabled }))}
                className={cn("cursor-pointer transition-colors", pixelForm.ga4_enabled ? "text-amber-400" : "text-gray-600")}
              >
                {pixelForm.ga4_enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">GA4 Measurement ID</label>
              <input
                type="text"
                value={pixelForm.ga4_measurement_id || ''}
                onChange={e => setPixelForm(p => ({ ...p, ga4_measurement_id: e.target.value }))}
                placeholder="مثال: G-XXXXXXXXXX"
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-white/5">
              <span>الأحداث: page_view, view_item, purchase</span>
              <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline flex items-center gap-1">
                <span>Google Analytics</span>
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* Welcome Offer Points Config */}
        <div className="bg-zinc-900 border border-amber-500/20 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Gift size={20} />
              </div>
              <div>
                <h4 className="font-black text-white text-base">نافذة الهدية الترحيبية للزوار الجدد (Lead Magnet)</h4>
                <p className="text-xs text-gray-400">نافذة تظهر لمن يدخل من الإعلانات للحصول على رقمه مقابل نقاط هدية في رصيده فوراً</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWelcomeOfferForm(w => ({ ...w, enabled: !w.enabled }))}
              className={cn("cursor-pointer transition-colors", welcomeOfferForm.enabled ? "text-amber-400" : "text-gray-600")}
            >
              {welcomeOfferForm.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">عدد النقاط المهداة مع أول تسجيل</label>
              <input
                type="number"
                min={10}
                max={500}
                value={welcomeOfferForm.points_amount}
                onChange={e => setWelcomeOfferForm(w => ({ ...w, points_amount: Number(e.target.value) || 50 }))}
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">الافتراضي: 50 نقطة (تساوي خصماً بسيطاً يشجع على الطلب الفوري)</p>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>ميزة التقاط رقم العميل التلقائي</span>
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                بمجرد إدخال الزائر لرقمه، يتم حفظه فوراً في النظام ويرتبط بسلته لتمكين استرجاعها إذا لم يكمل الشراء.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
