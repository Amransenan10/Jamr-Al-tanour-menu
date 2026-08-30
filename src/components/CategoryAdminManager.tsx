import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { Category } from '../types';
import { 
  FolderPlus, Edit, Trash2, Check, X, ArrowUp, ArrowDown, 
  Layers, Type, Loader2, Sparkles, Eye, EyeOff, Save, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';

export const CategoryAdminManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Category Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    display_order: 1,
    is_active: true
  });

  // App Settings Headings State
  const [appSettings, setAppSettings] = useState<{
    announcement_text?: string;
    announcement_active?: boolean;
    popular_title?: string;
    popular_subtitle?: string;
    offers_title?: string;
    offers_active?: boolean;
  }>({});

  useEffect(() => {
    fetchCategoriesAndSettings();
  }, []);

  const fetchCategoriesAndSettings = async () => {
    setLoading(true);
    try {
      const [catsRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').order('display_order', { ascending: true }),
        supabase.from('app_settings').select('*').single()
      ]);

      if (catsRes.data) {
        setCategories(catsRes.data);
      }
      if (settingsRes.data) {
        setAppSettings(settingsRes.data || {});
      }
    } catch (err) {
      console.error('Error loading category data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormData({
      name_ar: '',
      name_en: '',
      display_order: (categories.length > 0 ? Math.max(...categories.map(c => c.display_order || c.sort_order || 0)) + 1 : 1),
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name_ar: cat.name_ar,
      name_en: cat.name_en || '',
      display_order: cat.display_order || cat.sort_order || 1,
      is_active: cat.is_active
    });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ar.trim()) {
      toast.error('يرجى إدخال اسم القسم بالعربية');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name_ar: formData.name_ar.trim(),
        name_en: formData.name_en.trim() || formData.name_ar.trim(),
        display_order: formData.display_order,
        sort_order: formData.display_order,
        is_active: formData.is_active
      };

      if (editingCategory) {
        // Update
        let res = await supabaseAdmin.from('categories').update(payload).eq('id', editingCategory.id);
        if (res.error) res = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
        if (res.error) throw res.error;

        toast.success('تم تحديث بيانات القسم بنجاح!');
      } else {
        // Insert
        let res = await supabaseAdmin.from('categories').insert([payload]);
        if (res.error) res = await supabase.from('categories').insert([payload]);
        if (res.error) throw res.error;

        toast.success('تمت إضافة القسم الجديد بنجاح!');
      }

      setIsModalOpen(false);
      fetchCategoriesAndSettings();
    } catch (err: any) {
      console.error('Error saving category:', err);
      toast.error(err?.message || 'حدث خطأ أثناء حفظ القسم');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      const newStatus = !cat.is_active;
      let res = await supabaseAdmin.from('categories').update({ is_active: newStatus }).eq('id', cat.id);
      if (res.error) res = await supabase.from('categories').update({ is_active: newStatus }).eq('id', cat.id);
      if (res.error) throw res.error;

      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: newStatus } : c));
      toast.success(newStatus ? `تم تفعيل قسم (${cat.name_ar})` : `تم إيقاف قسم (${cat.name_ar})`);
    } catch (err: any) {
      toast.error('عذراً تعذر تغيير حالة القسم');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`هل أنت تأكد من إزالة قسم (${name})؟ قد يؤثر ذلك على المنتجات المرتبطة به.`)) return;

    try {
      let res = await supabaseAdmin.from('categories').delete().eq('id', id);
      if (res.error) res = await supabase.from('categories').delete().eq('id', id);
      if (res.error) throw res.error;

      setCategories(prev => prev.filter(c => c.id !== id));
      toast.success(`تم حذف قسم (${name}) بنجاح`);
    } catch (err: any) {
      toast.error('حدث خطأ عند حذف القسم');
    }
  };

  const handleSaveAppSettings = async () => {
    setSaving(true);
    try {
      let res = await supabaseAdmin.from('app_settings').upsert([appSettings]);
      if (res.error) res = await supabase.from('app_settings').upsert([appSettings]);
      if (res.error) throw res.error;

      toast.success('تم حفظ عبارات المنيو بنجاح!');
    } catch (err: any) {
      toast.error(err?.message || 'حدث خطأ عند حفظ العبارات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 text-right dir-rtl" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="text-amber-400" size={24} />
            <h2 className="text-xl font-black text-white">إدارة الأقسام والعبارات الرئيسية</h2>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            إضافة أقسام المنيو، إعادة ترتيبها، والتحكم بالنصوص والعناوين المنبثقة
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-sm rounded-2xl flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {/* Category List & Table */}
      <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden p-6 space-y-4">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <span>أقسام المنيو الحالية</span>
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full font-mono">{categories.length} أقسام</span>
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center items-center text-amber-400">
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            لا توجد أقسام مسجلة بعد. اضغط على "إضافة قسم جديد" للبدء!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-zinc-800/60 text-gray-400 text-xs">
                <tr>
                  <th className="p-3 font-bold">الترتيب</th>
                  <th className="p-3 font-bold">اسم القسم (بالعربية)</th>
                  <th className="p-3 font-bold">اسم القسم (بالإنجليزية)</th>
                  <th className="p-3 font-bold">الحالة</th>
                  <th className="p-3 font-bold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 font-mono text-amber-400 font-black">
                      #{cat.display_order || cat.sort_order || 1}
                    </td>
                    <td className="p-3 font-black text-white">{cat.name_ar}</td>
                    <td className="p-3 font-mono text-gray-400">{cat.name_en || '-'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleCategoryActive(cat)}
                        className={cn(
                          "px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                          cat.is_active
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                        )}
                      >
                        {cat.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                        <span>{cat.is_active ? 'مفعل ومتاح' : 'موقف'}</span>
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(cat)}
                          className="p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl transition-colors cursor-pointer"
                          title="تعديل القسم"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name_ar)}
                          className="p-2 bg-zinc-800 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer"
                          title="حذف القسم"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Headings & Announcement Phrases Manager */}
      <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-white/10 pb-4">
          <Type className="text-amber-400" size={22} />
          <h3 className="text-lg font-black text-white">العبارات والعناوين الترويجية بالمنيو</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block">شريط الإعلانات الترويجي الأعلى</label>
            <input
              type="text"
              placeholder="مثال: خصم 15% على جميع طلبات الحفلات كود: TANOUR15"
              value={appSettings.announcement_text || ''}
              onChange={e => setAppSettings({ ...appSettings, announcement_text: e.target.value })}
              className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block">تنشيط شريط الإعلانات الأعلى</label>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAppSettings({ ...appSettings, announcement_active: !appSettings.announcement_active })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer",
                  appSettings.announcement_active ? "bg-amber-500" : "bg-zinc-700"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full bg-black transition-transform", appSettings.announcement_active ? "translate-x-0" : "-translate-x-6")} />
              </button>
              <span className="text-sm font-bold text-gray-300">
                {appSettings.announcement_active ? 'مفعل ويظهر أعلى المنيو' : 'مخفي'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block">اسم زر قسم العروض في الشريط</label>
            <input
              type="text"
              placeholder="العروض الأسبوعية"
              value={appSettings.offers_title || 'العروض الأسبوعية'}
              onChange={e => setAppSettings({ ...appSettings, offers_title: e.target.value })}
              className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 block">إظهار قسم العروض في شريط الأقسام</label>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAppSettings({ ...appSettings, offers_active: !(appSettings.offers_active ?? true) })}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer",
                  (appSettings.offers_active ?? true) ? "bg-amber-500" : "bg-zinc-700"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full bg-black transition-transform", (appSettings.offers_active ?? true) ? "translate-x-0" : "-translate-x-6")} />
              </button>
              <span className="text-sm font-bold text-gray-300">
                {(appSettings.offers_active ?? true) ? 'مفعل ويظهر كزر عروض' : 'مخفي وغير متاح'}
              </span>
            </div>
          </div>

          {/* Spin Wheel Settings */}
          <div className="space-y-2 md:col-span-2 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-amber-400" size={18} />
              <label className="text-sm font-black text-white">إعدادات لعبة عجلة الحظ (Spin the Wheel)</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-800/50 p-4 rounded-2xl border border-white/5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">تنشيط ظهور لعبة عجلة الحظ للعملاء</label>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setAppSettings({ ...appSettings, wheel_active: !appSettings.wheel_active })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer",
                      appSettings.wheel_active ? "bg-amber-500" : "bg-zinc-700"
                    )}
                  >
                    <div className={cn("w-4 h-4 rounded-full bg-black transition-transform", appSettings.wheel_active ? "translate-x-0" : "-translate-x-6")} />
                  </button>
                  <span className="text-sm font-bold text-gray-300">
                    {appSettings.wheel_active ? '🎡 مفعلة وتظهر كزر عائم للعميل' : 'مغلقة ومخفية كلياً'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 block">عنوان اللعبة المنبثقة</label>
                <input
                  type="text"
                  placeholder="دَوّر واكسب جوائز المنيو!"
                  value={appSettings.wheel_title || 'دَوّر واكسب جوائز المنيو!'}
                  onChange={e => setAppSettings({ ...appSettings, wheel_title: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAppSettings}
            disabled={saving}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>حفظ العبارات الجديدة</span>
          </button>
        </div>
      </div>

      {/* Category Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-3xl w-full max-w-md space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-black text-lg text-white">
                {editingCategory ? `تعديل قسم: ${editingCategory.name_ar}` : 'إضافة قسم جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">اسم القسم (بالعربية) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: الوجبات العائلية"
                  value={formData.name_ar}
                  onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">اسم القسم (بالإنجليزية - اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: Family Meals"
                  value={formData.name_en}
                  onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">رقم الترتيب الأولية (Order Index)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.display_order}
                  onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative p-1 cursor-pointer",
                    formData.is_active ? "bg-amber-500" : "bg-zinc-700"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full bg-black transition-transform", formData.is_active ? "translate-x-0" : "-translate-x-6")} />
                </button>
                <span className="text-sm font-bold text-gray-300">
                  {formData.is_active ? 'القسم مفعل ويظهر للعملاء' : 'القسم موقف ومخفي'}
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-amber-500 text-black font-black rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>{editingCategory ? 'تحديث القسم' : 'إضافة القسم'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-zinc-800 text-gray-300 font-bold rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
