import React, { useState, useEffect } from 'react';
import { 
  Search, Globe, FileText, CheckCircle2, AlertCircle, 
  Save, Loader2, Plus, Trash2, Edit3, Eye, 
  Share2, Check, RefreshCw, Smartphone, Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { parseAppSettings, saveAppSettings } from '../utils/appSettingsUtils';
import { 
  SeoSettings, SeoArticle, DEFAULT_SEO_SETTINGS, 
  DEFAULT_SEO_ARTICLES, applySeoSettings, calculateSeoScore 
} from '../utils/seoUtils';

export const AdminSeoView: React.FC<{ variant?: 'light' | 'dark' }> = ({ variant = 'dark' }) => {
  const isLight = variant === 'light';
  const [activeTab, setActiveTab] = useState<'meta' | 'articles' | 'schema' | 'preview'>('meta');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [seoForm, setSeoForm] = useState<SeoSettings>(DEFAULT_SEO_SETTINGS);
  const [articles, setArticles] = useState<SeoArticle[]>(DEFAULT_SEO_ARTICLES);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Article Modal / Form State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState<Partial<SeoArticle>>({
    title: '',
    slug: '',
    category: 'أخبار',
    summary: '',
    content: '',
    image_url: 'https://jamraltanour.com/assets/logo.png',
    keywords: '',
    published: true
  });

  // Load existing settings from DB on mount
  useEffect(() => {
    fetchSeoData();
  }, []);

  const fetchSeoData = async () => {
    try {
      setLoading(true);
      const { data: rawData } = await supabaseAdmin
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      const sourceData = rawData || (await supabase.from('app_settings').select('*').eq('id', 1).maybeSingle()).data;
      if (sourceData) {
        const parsed = parseAppSettings(sourceData);
        if (parsed.seo_settings) {
          setSeoForm({ ...DEFAULT_SEO_SETTINGS, ...parsed.seo_settings });
        }
        if (Array.isArray(parsed.seo_articles)) {
          setArticles(parsed.seo_articles);
        }
      }
    } catch (e) {
      console.error('Failed to load SEO data:', e);
      toast.error('حدث خطأ أثناء تحميل بيانات الـ SEO');
    } finally {
      setLoading(false);
    }
  };

  // Master Save Handler
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);

      // Save to Supabase using appSettingsUtils
      await saveAppSettings({
        seo_settings: seoForm,
        seo_articles: articles
      });

      // Apply dynamically to DOM
      applySeoSettings(seoForm);

      setLastSavedAt(new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
      toast.success('تم حفظ وتفعيل إعدادات الـ SEO بنجاح');
    } catch (error: any) {
      console.error('Error saving SEO settings:', error);
      toast.error(error?.message || 'فشل حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  // Suggested Keywords from real menu
  const addSuggestedKeywords = () => {
    const suggestions = [
      'جمر التنور', 'فطائر', 'بيتزا', 'شاورما', 'برجر',
      'فلافل', 'فطور', 'مقبلات', 'عصائر', 'منيو جمر التنور'
    ];
    const current = (seoForm.meta_keywords || '').split(/[،,]/).map(s => s.trim()).filter(Boolean);
    const combined = Array.from(new Set([...current, ...suggestions]));
    setSeoForm(prev => ({ ...prev, meta_keywords: combined.join('، ') }));
    toast.success('تمت إضافة الكلمات المفتاحية المقترحة من المنيو');
  };

  // Article Actions
  const handleOpenNewArticle = () => {
    setEditingArticleId(null);
    setArticleForm({
      title: '',
      slug: '',
      category: 'أخبار',
      summary: '',
      content: '',
      image_url: seoForm.og_image || 'https://jamraltanour.com/assets/logo.png',
      keywords: '',
      published: true
    });
    setIsArticleModalOpen(true);
  };

  const handleEditArticle = (art: SeoArticle) => {
    setEditingArticleId(art.id);
    setArticleForm(art);
    setIsArticleModalOpen(true);
  };

  const handleDeleteArticle = (id: string) => {
    if (!window.confirm('هل ترغب في حذف هذا المقال؟')) return;
    setArticles(prev => prev.filter(a => a.id !== id));
    toast.success('تم حذف المقال من القائمة، اضغط حفظ لتأكيد التغيير');
  };

  const handleSaveArticleModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title?.trim()) {
      toast.error('يرجى كتابة عنوان المقال');
      return;
    }

    const slug = (articleForm.slug || articleForm.title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (editingArticleId) {
      setArticles(prev => prev.map(a => a.id === editingArticleId ? {
        ...a,
        ...articleForm,
        slug: slug || a.slug,
        updated_at: new Date().toISOString()
      } as SeoArticle : a));
      toast.success('تم تحديث المقال بنجاح');
    } else {
      const newArticle: SeoArticle = {
        id: `art_${Date.now()}`,
        title: articleForm.title || '',
        slug: slug || `article-${Date.now()}`,
        category: articleForm.category || 'أخبار',
        summary: articleForm.summary || '',
        content: articleForm.content || '',
        image_url: articleForm.image_url || 'https://jamraltanour.com/assets/logo.png',
        keywords: articleForm.keywords || '',
        published: articleForm.published ?? true,
        views_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setArticles(prev => [newArticle, ...prev]);
      toast.success('تمت إضافة المقال بنجاح');
    }

    setIsArticleModalOpen(false);
  };

  const seoScoreData = calculateSeoScore(seoForm);

  const seoTabs = [
    { id: 'meta', label: isLight ? 'السيو SEO' : 'العناوين والأوصاف', icon: <Search size={16} /> },
    { id: 'articles', label: `المقالات (${articles.length})`, icon: <FileText size={16} /> },
    { id: 'schema', label: 'معلومات المطعم', icon: <Globe size={16} /> },
    { id: 'preview', label: 'معاينة إضافية', icon: <Eye size={16} /> }
  ];

  if (isLight) {
    const scoreRadius = 42;
    const scoreCircumference = 2 * Math.PI * scoreRadius;
    const scoreOffset = scoreCircumference - (seoScoreData.score / 100) * scoreCircumference;
    const scoreColor =
      seoScoreData.score >= 80 ? '#15803D' : seoScoreData.score >= 50 ? '#B45309' : '#DC2626';

    return (
      <div className="space-y-6 text-right pb-12" dir="rtl">
        {/* Top Centered Pill Navigation */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
          {seoTabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === tab.id
                  ? "bg-white text-[#C2410C] border border-[#E5E0D8] shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Two-Column Layout matching screenshot */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right Column: Main Editor (lg:col-span-8) */}
          <div className="lg:col-span-8 space-y-6">
            {activeTab === 'meta' && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-start justify-between gap-4 border-b border-[#F1EDE6] pb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-stone-900">إعدادات السيو — الصفحة الرئيسية</h2>
                    <p className="text-xs text-stone-500 mt-1">
                      هذه النصوص تظهر لقوقل ولزوار موقعك. اكتبها بأسلوبك، والنظام يحدّثها تلقائياً.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchSeoData}
                    disabled={loading}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-stone-100 text-stone-600 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-[#E5E0D8] cursor-pointer shrink-0"
                    title="تحديث البيانات"
                  >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                    <span>تحديث</span>
                  </button>
                </div>

                {/* H1: Restaurant Name */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                      <span>عنوان الصفحة الرئيسي (H1)</span>
                      <span className="text-xs font-normal text-stone-500">— العنوان الذي يظهر للزائر وقوقل أول شيء</span>
                    </label>
                    <span className={cn(
                      "text-xs font-bold",
                      (seoForm.restaurant_name || '').trim().length > 0 ? "text-emerald-700" : "text-stone-400"
                    )}>
                      {(seoForm.restaurant_name || '').length} حرفاً
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoForm.restaurant_name}
                    onChange={e => setSeoForm(prev => ({ ...prev, restaurant_name: e.target.value }))}
                    placeholder="اتركه فارغاً إذا لا تريد إظهار H1"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#C2410C] focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors"
                  />
                </div>

                {/* Meta Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                      <span>عنوان نتائج البحث (Meta Title)</span>
                      <span className="text-xs font-normal text-stone-500">— يظهر في تبويب المتصفح وقوقل</span>
                    </label>
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      seoForm.meta_title.length >= 25 && seoForm.meta_title.length <= 70 ? "text-emerald-700" : "text-amber-700"
                    )}>
                      {seoForm.meta_title.length} / 70 حرفاً
                    </span>
                  </div>
                  <input
                    type="text"
                    value={seoForm.meta_title}
                    onChange={e => setSeoForm(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="عنوان الصفحة في محركات البحث..."
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#C2410C] focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">يفضّل بين 30 و 60 حرفاً</p>
                </div>

                {/* Meta Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-stone-800 flex items-center gap-1.5">
                      <span>وصف المطعم (وصف قوقل والصفحة الرئيسية)</span>
                    </label>
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      seoForm.meta_description.length >= 70 && seoForm.meta_description.length <= 170 ? "text-emerald-700" : "text-amber-700"
                    )}>
                      {seoForm.meta_description.length} / 165 حرفاً
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={seoForm.meta_description}
                    onChange={e => setSeoForm(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="اكتب وصف المطعم..."
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#C2410C] focus:bg-white rounded-xl p-4 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors resize-y"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">يفضّل بين 120 و 160 حرفاً</p>
                </div>

                {/* Keywords */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-stone-800">
                      الكلمات المفتاحية <span className="text-xs font-normal text-stone-500">— افصل بينها بفاصلة</span>
                    </label>
                    <button
                      type="button"
                      onClick={addSuggestedKeywords}
                      className="text-xs text-[#C2410C] hover:underline font-bold cursor-pointer"
                    >
                      إضافة كلمات المنيو تلقائياً
                    </button>
                  </div>
                  <input
                    type="text"
                    value={seoForm.meta_keywords}
                    onChange={e => setSeoForm(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    placeholder="افصل بين الكلمات بفواصل"
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#C2410C] focus:bg-white rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-colors"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[11px] text-stone-500">من 5 إلى 10 كلمات مرتبطة بمطعمك</span>
                    <span className="text-[11px] font-bold text-stone-600">
                      {seoForm.meta_keywords.split(/[،,]/).map(s => s.trim()).filter(Boolean).length} كلمات
                    </span>
                  </div>
                </div>

                {/* OG Image & Canonical */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#F1EDE6]">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">رابط صورة المشاركة (OG Image)</label>
                    <input
                      type="text"
                      value={seoForm.og_image}
                      onChange={e => setSeoForm(prev => ({ ...prev, og_image: e.target.value }))}
                      placeholder="https://..."
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#C2410C] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-mono text-stone-800 outline-none dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">الرابط الأساسي (Canonical URL)</label>
                    <input
                      type="text"
                      value={seoForm.canonical_url}
                      onChange={e => setSeoForm(prev => ({ ...prev, canonical_url: e.target.value }))}
                      placeholder="https://jamraltanour.com/"
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] focus:border-[#C2410C] focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-mono text-stone-800 outline-none dir-ltr text-right"
                    />
                  </div>
                </div>

                {/* Indexing Toggle */}
                <div className="flex items-center justify-between p-4 bg-[#FAF8F5] rounded-xl border border-[#E5E0D8]">
                  <div>
                    <h4 className="font-bold text-sm text-stone-800 flex items-center gap-2">
                      <span>السماح بمحركات البحث وفهرسة الموقع</span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        seoForm.robots_index ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                      )}>
                        {seoForm.robots_index ? 'مفعل' : 'معطل'}
                      </span>
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSeoForm(prev => ({ ...prev, robots_index: !prev.robots_index }))}
                    className={cn(
                      "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer relative",
                      seoForm.robots_index ? "bg-emerald-600" : "bg-stone-300"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full bg-white transition-transform",
                      seoForm.robots_index ? "translate-x-0" : "-translate-x-6"
                    )} />
                  </button>
                </div>

                {/* Full-width Save Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleSaveAll()}
                    disabled={saving}
                    className="w-full py-3.5 bg-[#C2410C] hover:bg-[#9A3412] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    <span>حفظ وتفعيل</span>
                  </button>
                  <p className="text-center text-[11px] text-stone-500 mt-2.5">
                    {lastSavedAt
                      ? `آخر حفظ: اليوم ${lastSavedAt} — التغييرات تظهر للزوار فوراً`
                      : 'اضغط حفظ وتفعيل لتحديث الإعدادات في قاعدة البيانات'}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'articles' && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-stone-900">إدارة المقالات والمحتوى</h3>
                    <p className="text-xs text-stone-500 mt-0.5">إضافة مقالات وتدوينات تظهر في الموقع ومحركات البحث.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleOpenNewArticle}
                      className="px-4 py-2 bg-[#C2410C] hover:bg-[#9A3412] text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={15} />
                      <span>إضافة مقال</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAll()}
                      disabled={saving}
                      className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save size={14} />
                      <span>حفظ</span>
                    </button>
                  </div>
                </div>

                {articles.length === 0 ? (
                  <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-10 text-center text-stone-500 text-sm">
                    لا توجد مقالات مضافة حالياً. اضغط على "إضافة مقال" لكتابة مقال.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {articles.map(art => (
                      <div key={art.id} className="bg-[#FAF8F5] border border-[#E5E0D8] p-4 rounded-xl space-y-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] bg-orange-100 text-[#C2410C] px-2.5 py-0.5 rounded-full font-bold">
                              {art.category}
                            </span>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold",
                              art.published ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                            )}>
                              {art.published ? 'منشور' : 'مسودة'}
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-stone-900 line-clamp-1">{art.title}</h4>
                          <p className="text-xs text-stone-600 mt-1.5 line-clamp-2">{art.summary || art.content}</p>
                        </div>
                        <div className="pt-2.5 border-t border-[#E5E0D8] flex items-center justify-between text-xs text-stone-500">
                          <span className="font-mono text-[11px]">/{art.slug}</span>
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => handleEditArticle(art)} className="p-1.5 bg-white border border-[#E5E0D8] text-stone-700 hover:text-[#C2410C] rounded-lg cursor-pointer">
                              <Edit3 size={14} />
                            </button>
                            <button type="button" onClick={() => handleDeleteArticle(art.id)} className="p-1.5 bg-white border border-[#E5E0D8] text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schema' && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-black text-stone-900">بيانات المطعم المنظمة (Local Business Schema)</h3>
                  <p className="text-xs text-stone-500 mt-0.5">كود تقني يقرأه محرك البحث لربط موقع المطعم وتصنيفه وساعات العمل.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">اسم المطعم الرسمي (H1)</label>
                    <input type="text" value={seoForm.restaurant_name} onChange={e => setSeoForm(prev => ({ ...prev, restaurant_name: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-[#C2410C]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">نوع المطبخ والتصنيف</label>
                    <input type="text" value={seoForm.restaurant_cuisine} onChange={e => setSeoForm(prev => ({ ...prev, restaurant_cuisine: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-[#C2410C]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">رقم الهاتف للتواصل</label>
                    <input type="text" value={seoForm.restaurant_phone} onChange={e => setSeoForm(prev => ({ ...prev, restaurant_phone: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-[#C2410C] dir-ltr text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">عنوان الفرع والمدينة</label>
                    <input type="text" value={seoForm.restaurant_address} onChange={e => setSeoForm(prev => ({ ...prev, restaurant_address: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-[#C2410C]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">ساعات العمل الرسمية</label>
                  <input type="text" value={seoForm.business_hours} onChange={e => setSeoForm(prev => ({ ...prev, business_hours: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-[#C2410C]" />
                </div>
                <button
                  type="button"
                  onClick={() => handleSaveAll()}
                  disabled={saving}
                  className="w-full py-3 bg-[#C2410C] hover:bg-[#9A3412] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>حفظ وتفعيل</span>
                </button>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-stone-900">معاينة المشاركة في المنصات</h3>
                  <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E5E0D8] p-1 rounded-xl">
                    <button type="button" onClick={() => setPreviewDevice('mobile')} className={cn("px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer", previewDevice === 'mobile' ? "bg-[#C2410C] text-white" : "text-stone-600")}>
                      <Smartphone size={13} /> جوال
                    </button>
                    <button type="button" onClick={() => setPreviewDevice('desktop')} className={cn("px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer", previewDevice === 'desktop' ? "bg-[#C2410C] text-white" : "text-stone-600")}>
                      <Monitor size={13} /> كمبيوتر
                    </button>
                  </div>
                </div>
                <div className={cn("bg-[#FAF8F5] rounded-xl p-4 border border-[#E5E0D8]", previewDevice === 'mobile' ? "max-w-sm mx-auto" : "w-full")}>
                  {seoForm.og_image && (
                    <img src={seoForm.og_image} alt="صورة المشاركة" className="w-full h-44 object-cover rounded-lg mb-3" />
                  )}
                  <h4 className="font-bold text-sm text-stone-900">{seoForm.meta_title}</h4>
                  <p className="text-xs text-stone-600 mt-1 line-clamp-2">{seoForm.meta_description}</p>
                  <span className="text-[11px] text-stone-400 mt-2 block font-mono">jamraltanour.com</span>
                </div>
              </div>
            )}
          </div>

          {/* Left Column: Readiness Ring + Google Preview + Checklist (lg:col-span-4) */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {/* 1. Circular SEO Score */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs text-center space-y-3">
              <h3 className="text-sm font-black text-stone-800">جاهزية السيو</h3>
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={scoreRadius} fill="none" stroke="#EFECE6" strokeWidth="9" />
                  <circle
                    cx="50"
                    cy="50"
                    r={scoreRadius}
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={scoreCircumference}
                    strokeDashoffset={scoreOffset}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black" style={{ color: scoreColor }}>{seoScoreData.score}%</span>
                  <span className="text-[11px] font-bold text-stone-500">جاهز</span>
                </div>
              </div>
              <p className="text-xs text-stone-500">
                {seoScoreData.score >= 80 ? 'ممتاز. أكمل البنود الباقية تحت' : 'أكمل الحقول الأساسية لرفع الجاهزية'}
              </p>
            </div>

            {/* 2. Live Google Search Preview */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-stone-800">هكذا تظهر في قوقل</h3>
              <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5 text-right space-y-1">
                <div className="text-[11px] text-stone-500">معاينة نتيجة البحث</div>
                <div className="text-[11px] text-stone-600 font-mono dir-ltr text-right">
                  {(seoForm.canonical_url || 'https://jamraltanour.com').replace(/^https?:\/\//, '').replace(/\/$/, '')} › ar
                </div>
                <h4 className="text-sm font-bold text-[#1A0DAB] leading-snug line-clamp-2">
                  {seoForm.meta_title || 'عنوان الصفحة'}
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                  {seoForm.meta_description || 'وصف الموقع يظهر هنا...'}
                </p>
              </div>
            </div>

            {/* 3. Checklist */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-stone-800">قائمة التحقق</h3>
              <div className="space-y-2.5">
                {seoScoreData.checks.map((c, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold text-[11px]",
                      c.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {c.passed ? '✓' : '!'}
                    </span>
                    <span className={c.passed ? "text-stone-700 font-medium" : "text-stone-500"}>
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Article Modal (Light) */}
        {isArticleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-xl w-full p-6 space-y-4 text-right shadow-2xl" dir="rtl">
              <div className="flex items-center justify-between border-b border-[#F1EDE6] pb-3">
                <h3 className="text-base font-black text-stone-900">
                  {editingArticleId ? 'تعديل المقال' : 'إضافة مقال جديد'}
                </h3>
                <button type="button" onClick={() => setIsArticleModalOpen(false)} className="text-stone-500 hover:text-stone-900 text-xs px-2.5 py-1 rounded-lg bg-stone-100 cursor-pointer">
                  إغلاق
                </button>
              </div>
              <form onSubmit={handleSaveArticleModal} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">عنوان المقال *</label>
                  <input type="text" required value={articleForm.title || ''} onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-xs text-stone-900 outline-none focus:border-[#C2410C]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">الرابط (Slug)</label>
                    <input type="text" value={articleForm.slug || ''} onChange={e => setArticleForm(p => ({ ...p, slug: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2 text-xs text-stone-900 outline-none font-mono dir-ltr text-right" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">التصنيف</label>
                    <input type="text" value={articleForm.category || ''} onChange={e => setArticleForm(p => ({ ...p, category: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2 text-xs text-stone-900 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ملخص المقال</label>
                  <textarea rows={2} value={articleForm.summary || ''} onChange={e => setArticleForm(p => ({ ...p, summary: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs text-stone-900 outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المحتوى</label>
                  <textarea rows={4} value={articleForm.content || ''} onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs text-stone-900 outline-none resize-none" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800">
                    <input type="checkbox" checked={articleForm.published ?? true} onChange={e => setArticleForm(p => ({ ...p, published: e.target.checked }))} className="rounded text-[#C2410C]" />
                    <span>نشر المقال</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setIsArticleModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-stone-100 text-stone-700 cursor-pointer">إلغاء</button>
                    <button type="submit" className="px-5 py-2 rounded-xl text-xs font-black bg-[#C2410C] hover:bg-[#9A3412] text-white cursor-pointer">حفظ المقال</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right pb-12" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-slate-900/90 p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/15 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            <Search size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white">مركز تحكم SEO ومحركات البحث</h2>
              <span className="bg-emerald-500/15 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={12} /> Google Ready
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              إدارة العناوين، الكلمات المفتاحية، المقالات، وبيانات المتجر في نتائج البحث.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={fetchSeoData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="flex-1 md:flex-none px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>حفظ وتفعيل التعديلات</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Vertical Sidebar + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vertical Sidebar */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
          <nav className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar">
            <div className="hidden lg:block px-3 py-1.5 text-[11px] font-bold text-slate-400">
              أقسام السيو
            </div>
            {seoTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-right shrink-0 lg:w-full",
                  activeTab === tab.id
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/35"
                    : "text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent"
                )}
              >
                <span className={activeTab === tab.id ? "text-teal-400" : "text-slate-400"}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* SEO Score Card in Sidebar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border shrink-0",
                seoScoreData.score >= 80 ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                seoScoreData.score >= 50 ? "bg-sky-500/15 text-sky-300 border-sky-500/30" :
                "bg-rose-500/15 text-rose-300 border-rose-500/30"
              )}>
                {seoScoreData.score}%
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">جاهزية محركات البحث</h4>
                <span className={cn(
                  "text-[11px] font-bold",
                  seoScoreData.score >= 80 ? "text-emerald-400" :
                  seoScoreData.score >= 50 ? "text-sky-400" : "text-rose-400"
                )}>
                  {seoScoreData.score >= 80 ? "ممتازة" : seoScoreData.score >= 50 ? "جيدة" : "تحتاج ضبط"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              {seoScoreData.checks.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-[11px] text-slate-300"
                  title={c.tip}
                >
                  {c.passed ? <Check size={12} className="text-emerald-400 shrink-0" /> : <AlertCircle size={12} className="text-slate-400 shrink-0" />}
                  <span className={c.passed ? "text-slate-200" : "text-slate-400"}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content Column */}
        <div className="lg:col-span-9 space-y-6">

      {/* TAB 1: META TAGS */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6">
            {/* Title Tag */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span>عنوان الصفحة (Meta Title)</span>
                  <span className="text-[11px] font-normal text-gray-400">(العنوان الرئيسي في نتائج البحث)</span>
                </label>
                <span className={cn(
                  "text-xs font-mono font-bold",
                  seoForm.meta_title.length >= 25 && seoForm.meta_title.length <= 70 ? "text-emerald-400" : "text-amber-400"
                )}>
                  {seoForm.meta_title.length} / 70 حرفاً
                </span>
              </div>
              <input
                type="text"
                value={seoForm.meta_title}
                onChange={e => setSeoForm(prev => ({ ...prev, meta_title: e.target.value }))}
                placeholder="جمر التنور | المنيو الإلكتروني والطلب أونلاين"
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span>وصف الموقع (Meta Description)</span>
                  <span className="text-[11px] font-normal text-gray-400">(الوصف أسفل العنوان)</span>
                </label>
                <span className={cn(
                  "text-xs font-mono font-bold",
                  seoForm.meta_description.length >= 70 && seoForm.meta_description.length <= 170 ? "text-emerald-400" : "text-amber-400"
                )}>
                  {seoForm.meta_description.length} / 165 حرفاً
                </span>
              </div>
              <textarea
                rows={3}
                value={seoForm.meta_description}
                onChange={e => setSeoForm(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="اكتب وصف الموقع الذي يظهر في نتائج البحث..."
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl p-4 text-sm text-white placeholder:text-gray-600 outline-none transition-colors resize-none"
              />
            </div>

            {/* Keywords */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white">الكلمات المفتاحية (Keywords)</label>
                <button
                  type="button"
                  onClick={addSuggestedKeywords}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>إضافة كلمات المنيو تلقائياً</span>
                </button>
              </div>
              <input
                type="text"
                value={seoForm.meta_keywords}
                onChange={e => setSeoForm(prev => ({ ...prev, meta_keywords: e.target.value }))}
                placeholder="افصل بين الكلمات بفواصل"
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {seoForm.meta_keywords.split(/[،,]/).map(s => s.trim()).filter(Boolean).map((kw, i) => (
                  <span key={i} className="bg-zinc-800 text-amber-300 border border-amber-400/20 text-xs px-2.5 py-0.5 rounded-lg">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Share Image & Canonical */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/5">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  رابط صورة المشاركة (OG Image)
                </label>
                <input
                  type="text"
                  value={seoForm.og_image}
                  onChange={e => setSeoForm(prev => ({ ...prev, og_image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  الرابط الأساسي (Canonical URL)
                </label>
                <input
                  type="text"
                  value={seoForm.canonical_url}
                  onChange={e => setSeoForm(prev => ({ ...prev, canonical_url: e.target.value }))}
                  placeholder="https://jamraltanour.com/"
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
                />
              </div>
            </div>

            {/* Robots & Indexing Toggle */}
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>السماح بمحركات البحث وفهرسة الموقع (Indexing)</span>
                  {seoForm.robots_index ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">مفعل</span>
                  ) : (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">معطل</span>
                  )}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  تفعيل ظهور الموقع في نتائج البحث.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSeoForm(prev => ({ ...prev, robots_index: !prev.robots_index }))}
                className={cn(
                  "w-12 h-6 rounded-full p-1 transition-colors cursor-pointer relative",
                  seoForm.robots_index ? "bg-emerald-500" : "bg-zinc-700"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white transition-transform",
                  seoForm.robots_index ? "translate-x-0" : "-translate-x-6"
                )} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ARTICLES & BLOG */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">إدارة المقالات والمحتوى</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                إضافة مقالات وتدوينات تظهر في الموقع ومحركات البحث.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenNewArticle}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus size={16} />
              <span>إضافة مقال جديد</span>
            </button>
          </div>

          {/* Articles Grid or Empty state */}
          {articles.length === 0 ? (
            <div className="bg-zinc-900 border border-white/5 rounded-3xl p-12 text-center text-gray-400 text-sm">
              لا توجد مقالات مضافة حالياً. اضغط على "إضافة مقال جديد" لكتابة مقال.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map(art => (
                <div key={art.id} className="bg-zinc-900 border border-white/5 hover:border-amber-500/30 p-5 rounded-3xl space-y-4 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-bold border border-amber-500/20">
                        {art.category}
                      </span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        art.published ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-gray-400"
                      )}>
                        {art.published ? 'منشور' : 'مسودة'}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-white line-clamp-1">{art.title}</h4>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">{art.summary || art.content}</p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                    <span className="font-mono text-[11px]">/{art.slug}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditArticle(art)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 rounded-lg transition-colors cursor-pointer"
                        title="تعديل المقال"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(art.id)}
                        className="p-2 bg-zinc-800 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="حذف المقال"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCHEMA / LOCAL BUSINESS */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">بيانات المطعم المنظمة (Local Business Schema)</h3>
                <p className="text-xs text-gray-400">
                  كود تقني يقرأه محرك البحث لربط موقع المطعم وتصنيفه وساعات العمل في نتائج البحث.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">اسم المطعم الرسمي</label>
                <input
                  type="text"
                  value={seoForm.restaurant_name}
                  onChange={e => setSeoForm(prev => ({ ...prev, restaurant_name: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">نوع المطبخ والتصنيف</label>
                <input
                  type="text"
                  value={seoForm.restaurant_cuisine}
                  onChange={e => setSeoForm(prev => ({ ...prev, restaurant_cuisine: e.target.value }))}
                  placeholder="فطائر، بيتزا، شاورما، برجر، فطور، فلافل"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">رقم الهاتف للتواصل</label>
                <input
                  type="text"
                  value={seoForm.restaurant_phone}
                  onChange={e => setSeoForm(prev => ({ ...prev, restaurant_phone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400 dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">عنوان الفرع والمدينة</label>
                <input
                  type="text"
                  value={seoForm.restaurant_address}
                  onChange={e => setSeoForm(prev => ({ ...prev, restaurant_address: e.target.value }))}
                  placeholder="الرياض"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">ساعات العمل الرسمية</label>
              <input
                type="text"
                value={seoForm.business_hours}
                onChange={e => setSeoForm(prev => ({ ...prev, business_hours: e.target.value }))}
                placeholder="أدخل ساعات العمل"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREVIEW */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">معاينة نتائج البحث</h3>
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors",
                  previewDevice === 'mobile' ? "bg-amber-500 text-black font-black" : "text-gray-400 hover:text-white"
                )}
              >
                <Smartphone size={14} /> جوال
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors",
                  previewDevice === 'desktop' ? "bg-amber-500 text-black font-black" : "text-gray-400 hover:text-white"
                )}
              >
                <Monitor size={14} /> كمبيوتر
              </button>
            </div>
          </div>

          {/* Search Result Mockup */}
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-1">
              <Search size={14} className="text-amber-400" />
              <span>مظهر الموقع في نتائج البحث</span>
            </div>

            <div className={cn(
              "bg-white rounded-2xl p-5 text-left border border-gray-200 shadow-sm",
              previewDevice === 'mobile' ? "max-w-md mx-auto" : "max-w-2xl"
            )} dir="ltr">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-xs border border-zinc-200">
                  JT
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900">جمر التنور</div>
                  <div className="text-[11px] text-gray-500 font-mono">https://jamraltanour.com</div>
                </div>
              </div>

              <h4 className="text-lg font-medium text-blue-800 hover:underline cursor-pointer line-clamp-2 leading-snug">
                {seoForm.meta_title || 'جمر التنور | المنيو الإلكتروني والطلب أونلاين'}
              </h4>

              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                {seoForm.meta_description || 'مطعم جمر التنور - المنيو الرسمي.'}
              </p>
            </div>
          </div>

          {/* Social Share Mockup */}
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-1">
              <Share2 size={14} className="text-emerald-400" />
              <span>معاينة الرابط عند المشاركة</span>
            </div>

            <div className="max-w-sm mx-auto bg-[#0b141a] rounded-2xl p-4 border border-[#202c33]" dir="rtl">
              <div className="bg-[#202c33] rounded-xl overflow-hidden shadow-md">
                <div className="w-full h-40 bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                  {seoForm.og_image ? (
                    <img 
                      src={seoForm.og_image} 
                      alt="Preview" 
                      className="w-full h-full object-cover" 
                      onError={(e) => { (e.target as any).style.display = 'none'; }}
                    />
                  ) : (
                    <span className="text-xs text-gray-400 font-mono">jamraltanour.com</span>
                  )}
                </div>
                <div className="p-3 text-right">
                  <h5 className="font-bold text-sm text-white line-clamp-1">{seoForm.meta_title}</h5>
                  <p className="text-[11px] text-gray-300 mt-1 line-clamp-2">{seoForm.meta_description}</p>
                  <span className="text-[10px] text-gray-400 mt-2 block font-mono">jamraltanour.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT ARTICLE */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-5 text-right shadow-2xl" dir="rtl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingArticleId ? 'تعديل المقال' : 'إضافة مقال جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-zinc-800 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveArticleModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">عنوان المقال *</label>
                <input
                  type="text"
                  required
                  value={articleForm.title || ''}
                  onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="عنوان المقال"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">الرابط المخصص (Slug)</label>
                  <input
                    type="text"
                    value={articleForm.slug || ''}
                    onChange={e => setArticleForm(p => ({ ...p, slug: e.target.value }))}
                    placeholder="article-slug"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={articleForm.category || ''}
                    onChange={e => setArticleForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="أخبار"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">ملخص المقال</label>
                <textarea
                  rows={2}
                  value={articleForm.summary || ''}
                  onChange={e => setArticleForm(p => ({ ...p, summary: e.target.value }))}
                  placeholder="ملخص قصير للمقال..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">المحتوى</label>
                <textarea
                  rows={5}
                  value={articleForm.content || ''}
                  onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="نص المقال..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={articleForm.published ?? true}
                    onChange={e => setArticleForm(p => ({ ...p, published: e.target.checked }))}
                    className="rounded bg-black/40 border-white/20 text-amber-500 focus:ring-0"
                  />
                  <span>نشر المقال</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsArticleModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-gray-300 hover:bg-zinc-700 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-black cursor-pointer shadow-lg shadow-amber-500/20"
                  >
                    حفظ المقال
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
