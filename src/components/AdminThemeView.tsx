import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Gift, ToggleLeft, ToggleRight, Loader2, Check, RefreshCw, Ticket, ShieldCheck
} from 'lucide-react';
import { SeasonalEventSettings, EventPreset } from '../types';
import { getPresetDetails } from './SeasonalEventOverlay';
import { fetchThemeSettings, saveThemeSettings, DEFAULT_THEME_SETTINGS } from '../utils/themeSettingsUtils';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export const AdminThemeView: React.FC = () => {
  const [themeForm, setThemeForm] = useState<SeasonalEventSettings>(DEFAULT_THEME_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchThemeSettings();
      setThemeForm(data);
    } catch (e) {
      toast.error('حدث خطأ عند تحميل إعدادات الثيم');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    const nextState = !themeForm.event_active;
    const updated = { ...themeForm, event_active: nextState };
    setThemeForm(updated);

    try {
      setSaving(true);
      await saveThemeSettings(updated);
      if (nextState) {
        toast.success(`تم تفعيل وتطبيق الثيم (${updated.event_title}) بنجاح على المتجر! 🟢🎉`);
      } else {
        toast.success('تم إيقاف تفعيل الثيم في المتجر بنجاح ⚪');
      }
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ حالة التفعيل');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = async (preset: EventPreset) => {
    const details = getPresetDetails(preset);
    let title = details.badge;
    let subtitle = '';
    let promo = '';

    switch (preset) {
      case 'saudi_national_day':
        title = 'اليوم الوطني السعودي 🇸🇦';
        subtitle = 'نحتفل معكم باليوم الوطني! استمتع بأشهر الأطباق والوجبات بخصم خاص';
        promo = 'SAUDI';
        break;
      case 'founding_day':
        title = 'نحتفل بيوم التأسيس 🇸🇦 1727م';
        subtitle = 'يوم بدينا! استمتع بأصالة المذاق والتراث مع خصم خاص بمناسبة يوم التأسيس';
        promo = 'FOUNDING';
        break;
      case 'back_to_school':
        title = 'موسم العودة للمدارس 🎒📚';
        subtitle = 'بداية جديدة وتفوق! خصم حصري وجبات العائلات والطلاب مع عودة المدارس';
        promo = 'SCHOOL';
        break;
      case 'ramadan_eid':
        title = 'موسم رمضان والعيد المبارك 🌙✨';
        subtitle = 'مبارك عليكم الشهر والعيد! اطلب أشهر الوجبات الرمضانية واستفد من العرض';
        promo = 'EID2026';
        break;
      case 'custom':
      default:
        title = 'عرض احتفالي خاص 🔥';
        subtitle = 'استمتع بعرضنا المميز لفترة محدودة على المنيو!';
        promo = 'SPECIAL';
        break;
    }

    const updated: SeasonalEventSettings = {
      ...themeForm,
      event_active: true, // Force active when choosing a preset
      event_preset: preset,
      event_title: title,
      event_subtitle: subtitle,
      event_promo_code: promo,
      event_timestamp: Date.now()
    };

    setThemeForm(updated);

    try {
      setSaving(true);
      await saveThemeSettings(updated);
      toast.success(`تم تفعيل وتطبيق ثيم (${title}) بنجاح على المتجر! 🇸🇦🎉`);
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ الثيم التلقائي');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updated: SeasonalEventSettings = {
        ...themeForm,
        event_active: true, // Clicking Save & Apply forces active to true
        event_title: (themeForm.event_title || 'اليوم الوطني السعودي 🇸🇦').trim(),
        event_subtitle: (themeForm.event_subtitle || 'نحتفل معكم باليوم الوطني!').trim(),
        event_promo_code: (themeForm.event_promo_code || 'SAUDI').trim().toUpperCase(),
        event_timestamp: Date.now()
      };

      await saveThemeSettings(updated);
      setThemeForm(updated);
      toast.success(`تم حفظ وتفعيل ثيم (${updated.event_title}) بنجاح على المتجر! 🚀✨`);
    } catch (err) {
      toast.error('حدث خطأ أثناء تطبيق إعدادات الثيم');
    } finally {
      setSaving(false);
    }
  };

  const currentPresetDetails = getPresetDetails(themeForm.event_preset);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 size={36} className="animate-spin text-emerald-400" />
        <p className="text-gray-400 text-sm font-bold">جاري تحميل نظام الثيمات والمواسم...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 border border-emerald-500/30 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl shadow-lg border border-emerald-500/30">
            🎨
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>نظام ثيمات المتجر والمواسم المباشرة</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">مستقل 100%</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">تفعيل وتصميم الطابع الخاص بالمتجر للمناسبات الوطنية والدينية والعروض المخصصة</p>
          </div>
        </div>

        {/* Master Active Toggle */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={saving}
          className={cn(
            "px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-3 transition-all cursor-pointer shadow-xl shrink-0",
            themeForm.event_active
              ? "bg-emerald-500 text-black shadow-emerald-500/30 hover:bg-emerald-400"
              : "bg-zinc-800 text-gray-400 hover:text-white hover:bg-zinc-700"
          )}
        >
          {saving ? <Loader2 size={22} className="animate-spin" /> : themeForm.event_active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
          <span>{themeForm.event_active ? 'حالة الثيم: مفعل الآن 🟢' : 'حالة الثيم: غير مفعل ⚪'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Form */}
        <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-6 shadow-xl">
          {/* Preset Buttons */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-gray-300 block">اختر ثيم المناسبة (القوالب الجاهزة تفرَض وتُحفظ بنقرة واحدة):</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <button
                type="button"
                onClick={() => handlePresetSelect('saudi_national_day')}
                className={cn(
                  "p-3.5 rounded-2xl border text-xs font-black flex flex-col items-center gap-2 transition-all cursor-pointer text-center shadow-md",
                  themeForm.event_preset === 'saudi_national_day' && themeForm.event_active
                    ? "bg-emerald-950 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 shadow-emerald-500/20"
                    : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <span className="text-2xl">🇸🇦</span>
                <span>اليوم الوطني</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('founding_day')}
                className={cn(
                  "p-3.5 rounded-2xl border text-xs font-black flex flex-col items-center gap-2 transition-all cursor-pointer text-center shadow-md",
                  themeForm.event_preset === 'founding_day' && themeForm.event_active
                    ? "bg-amber-950 border-amber-500 text-amber-300 ring-2 ring-amber-500/50 shadow-amber-500/20"
                    : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <span className="text-2xl">🏛️</span>
                <span>يوم التأسيس</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('back_to_school')}
                className={cn(
                  "p-3.5 rounded-2xl border text-xs font-black flex flex-col items-center gap-2 transition-all cursor-pointer text-center shadow-md",
                  themeForm.event_preset === 'back_to_school' && themeForm.event_active
                    ? "bg-blue-950 border-blue-500 text-blue-300 ring-2 ring-blue-500/50 shadow-blue-500/20"
                    : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <span className="text-2xl">🎒</span>
                <span>العودة للمدارس</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('ramadan_eid')}
                className={cn(
                  "p-3.5 rounded-2xl border text-xs font-black flex flex-col items-center gap-2 transition-all cursor-pointer text-center shadow-md",
                  themeForm.event_preset === 'ramadan_eid' && themeForm.event_active
                    ? "bg-purple-950 border-purple-500 text-purple-300 ring-2 ring-purple-500/50 shadow-purple-500/20"
                    : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <span className="text-2xl">🌙</span>
                <span>رمضان والعيد</span>
              </button>

              <button
                type="button"
                onClick={() => handlePresetSelect('custom')}
                className={cn(
                  "p-3.5 rounded-2xl border text-xs font-black flex flex-col items-center gap-2 transition-all cursor-pointer text-center shadow-md",
                  themeForm.event_preset === 'custom' && themeForm.event_active
                    ? "bg-orange-950 border-orange-500 text-orange-300 ring-2 ring-orange-500/50 shadow-orange-500/20"
                    : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <span className="text-2xl">🎨</span>
                <span>عرض مخصص</span>
              </button>
            </div>
          </div>

          {/* Settings Customization Form */}
          <form onSubmit={handleSaveForm} className="space-y-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">عنوان المناسبة / التهنئة <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: اليوم الوطني السعودي 🇸🇦"
                  value={themeForm.event_title}
                  onChange={e => setThemeForm({ ...themeForm, event_title: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-emerald-500/50 outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">كود الخصم المرتبط بالموسم</label>
                <input
                  type="text"
                  placeholder="مثال: SAUDI"
                  value={themeForm.event_promo_code}
                  onChange={e => setThemeForm({ ...themeForm, event_promo_code: e.target.value.toUpperCase() })}
                  className="w-full bg-zinc-800 text-amber-400 font-mono font-bold rounded-xl p-3 text-sm border border-transparent focus:border-emerald-500/50 outline-none uppercase"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300">الوصف والنص الفرعي للزوار <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={2}
                placeholder="نص التهنئة وتفاصيل الخصم للزوار..."
                value={themeForm.event_subtitle}
                onChange={e => setThemeForm({ ...themeForm, event_subtitle: e.target.value })}
                className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-emerald-500/50 outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center justify-between p-3.5 bg-zinc-800/80 rounded-xl border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white">تفعيل قصاصات زينة الاحتفال (Confetti)</span>
                </div>
                <input
                  type="checkbox"
                  checked={themeForm.event_show_confetti}
                  onChange={e => setThemeForm({ ...themeForm, event_show_confetti: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-zinc-800/80 rounded-xl border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <Gift size={18} className="text-amber-400" />
                  <span className="text-xs font-bold text-white">تفعيل النافذة المنبثقة الترحيبية (Modal)</span>
                </div>
                <input
                  type="checkbox"
                  checked={themeForm.event_show_modal}
                  onChange={e => setThemeForm({ ...themeForm, event_show_modal: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-black font-black text-base rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer mt-4"
            >
              {saving ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
              <span>حفظ وتطبيق إعدادات ثيم المناسبة على المتجر 🚀</span>
            </button>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-4 shadow-xl">
          <h4 className="font-black text-sm text-gray-300 flex items-center gap-2">
            <span>معاينة حية للمظهر في المتجر</span>
            <span className={cn("text-xs font-bold px-2 py-0.5 rounded", themeForm.event_active ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800 text-gray-500")}>
              {themeForm.event_active ? '🟢 Live' : '⚪ Disabled'}
            </span>
          </h4>

          {/* Top Banner Preview */}
          <div className={`p-4 rounded-2xl bg-gradient-to-r ${currentPresetDetails.colors.gradient} text-white border border-white/10 shadow-lg space-y-1.5`}>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentPresetDetails.icon}</span>
              <p className="font-black text-xs text-white truncate">
                {themeForm.event_title || currentPresetDetails.badge}
              </p>
            </div>
            <p className="text-[11px] text-gray-200 line-clamp-2 leading-relaxed">
              {themeForm.event_subtitle}
            </p>
            {themeForm.event_promo_code && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/40 text-amber-300 font-mono text-[10px] font-black rounded border border-amber-400/30">
                <Ticket size={12} />
                <span>كود الخصم: {themeForm.event_promo_code}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-zinc-800/40 rounded-2xl border border-white/5 space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck size={16} />
              <span>نظام مستقل وحصري</span>
            </div>
            <p className="leading-relaxed">
              هذا القسم يعمل بشكل منفصل تماماً عن جميع الأقسام الأخرى. أي تعديل يتم هنا يظهر فوراً للعميل دون الحاجة لتغيير أي إعدادات أخرى.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
