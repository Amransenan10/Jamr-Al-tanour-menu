import React, { useState, useEffect } from 'react';
import { 
  Search, Globe, FileText, Sparkles, CheckCircle2, AlertCircle, 
  ExternalLink, Save, Loader2, Plus, Trash2, Edit3, Eye, Copy, 
  Share2, ArrowRight, Check, RefreshCw, Smartphone, Monitor, Info
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

export const AdminSeoView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'meta' | 'articles' | 'schema' | 'preview'>('meta');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seoForm, setSeoForm] = useState<SeoSettings>(DEFAULT_SEO_SETTINGS);
  const [articles, setArticles] = useState<SeoArticle[]>(DEFAULT_SEO_ARTICLES);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');

  // Article Modal / Form State
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleForm, setArticleForm] = useState<Partial<SeoArticle>>({
    title: '',
    slug: '',
    category: 'أخبار وعروض',
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
        if (Array.isArray(parsed.seo_articles) && parsed.seo_articles.length > 0) {
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

      toast.success('تم حفظ وتفعيل إعدادات الـ SEO والمحتوى بنجاح! 🚀');
    } catch (error: any) {
      console.error('Error saving SEO settings:', error);
      toast.error(error?.message || 'فشل حفظ الإعدادات، يرجى المحاولة ثانية');
    } finally {
      setSaving(false);
    }
  };

  // Quick Suggestion Keywords
  const addSuggestedKeywords = () => {
    const suggestions = [
      'مطعم جمر التنور', 'أفضل مشاوي بالرياض', 'فطائر على الفحم',
      'شاورما دجاج على الجمر', 'فلافل طازجة', 'منيو جمر التنور السويدي',
      'توصيل مطاعم الرياض', 'بوكسات شاورما'
    ];
    const current = (seoForm.meta_keywords || '').split(',').map(s => s.trim()).filter(Boolean);
    const combined = Array.from(new Set([...current, ...suggestions]));
    setSeoForm(prev => ({ ...prev, meta_keywords: combined.join(', ') }));
    toast.success('تمت إضافة الكلمات المفتاحية المقترحة بنجاح! 🎯');
  };

  // Article Actions
  const handleOpenNewArticle = () => {
    setEditingArticleId(null);
    setArticleForm({
      title: '',
      slug: '',
      category: 'أخبار وعروض',
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
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المقال؟')) return;
    setArticles(prev => prev.filter(a => a.id !== id));
    toast.success('تم حذف المقال من القائمة، اضغط حفظ لتأكيد التغيير.');
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
      toast.success('تم تحديث المقال بنجاح!');
    } else {
      const newArticle: SeoArticle = {
        id: `art_${Date.now()}`,
        title: articleForm.title || '',
        slug: slug || `article-${Date.now()}`,
        category: articleForm.category || 'أخبار وعروض',
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
      toast.success('تمت إضافة المقال بنجاح!');
    }

    setIsArticleModalOpen(false);
  };

  const seoScoreData = calculateSeoScore(seoForm);

  return (
    <div className="space-y-6 text-right pb-12" dir="rtl">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-amber-950/60 via-zinc-900 to-amber-950/40 p-6 rounded-3xl border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-inner">
            <Search size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">مركز تحكم SEO ومحركات البحث</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={12} /> Google Ready
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              تحكم بالعناوين، الكلمات المفتاحية، المقالات، وبيانات المتجر في قوقل والسوشيال ميديا بضغطة زر وبدون كتابة كود.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={fetchSeoData}
            disabled={loading}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-white/10 cursor-pointer disabled:opacity-50"
            title="إعادة جلب أحدث بيانات من السيرفر"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>حفظ وتفعيل التعديلات فوراً 🚀</span>
          </button>
        </div>
      </div>

      {/* Quick SEO Score Bar */}
      <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm border",
            seoScoreData.score >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
            seoScoreData.score >= 50 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
            "bg-red-500/20 text-red-400 border-red-500/30"
          )}>
            {seoScoreData.score}%
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>جاهزية الموقع لقوقل:</span>
              <span className={cn(
                "text-xs font-black",
                seoScoreData.score >= 80 ? "text-emerald-400" :
                seoScoreData.score >= 50 ? "text-amber-400" : "text-red-400"
              )}>
                {seoScoreData.score >= 80 ? "ممتازة جداً 🌟" : seoScoreData.score >= 50 ? "جيدة وتحتاج تحسينات" : "تحتاج ضبط"}
              </span>
            </h4>
            <p className="text-[11px] text-gray-400 mt-0.5">
              كلما زادت النسبة، كلما كانت فرص تصدر موقعك في نتائج بحث قوقل أعلى.
            </p>
          </div>
        </div>

        {/* Mini checks */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-300">
          {seoScoreData.checks.map((c, i) => (
            <span 
              key={i} 
              className={cn(
                "px-2.5 py-1 rounded-lg border flex items-center gap-1.5",
                c.passed ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" : "bg-zinc-800 text-gray-400 border-white/5"
              )}
              title={c.tip}
            >
              {c.passed ? <Check size={12} className="text-emerald-400" /> : <AlertCircle size={12} className="text-amber-400" />}
              <span>{c.label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'meta', label: 'العناوين والأوصاف (Meta Tags)', icon: <Search size={16} /> },
          { id: 'articles', label: `المقالات والمدونة (${articles.length})`, icon: <FileText size={16} /> },
          { id: 'schema', label: 'بيانات المطعم في قوقل (Local Schema)', icon: <Globe size={16} /> },
          { id: 'preview', label: 'المعاينة في قوقل والسوشيال', icon: <Eye size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]"
                : "bg-zinc-900 text-gray-400 hover:bg-zinc-800 hover:text-white border border-white/5"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: META TAGS */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-6">
            {/* Title Tag */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span>عنوان الصفحة في قوقل (Meta Title)</span>
                  <span className="text-[11px] font-normal text-gray-400">(السطر الأزرق الرئيسي في البحث)</span>
                </label>
                <span className={cn(
                  "text-xs font-mono font-bold",
                  seoForm.meta_title.length >= 35 && seoForm.meta_title.length <= 70 ? "text-emerald-400" : "text-amber-400"
                )}>
                  {seoForm.meta_title.length} / 70 حرفاً
                </span>
              </div>
              <input
                type="text"
                value={seoForm.meta_title}
                onChange={e => setSeoForm(prev => ({ ...prev, meta_title: e.target.value }))}
                placeholder="مثال: مطعم جمر التنور | المنيو الرسمي والطلب أونلاين - الرياض"
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                💡 الأفضل أن يبدأ باسم المطعم ويليه التصنيف والمدينة (مثال: جمر التنور | أفضل منيو فطائر ومشاوي بالرياض).
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white flex items-center gap-2">
                  <span>وصف الموقع في قوقل (Meta Description)</span>
                  <span className="text-[11px] font-normal text-gray-400">(السطران التوضيحيان أسفل العنوان)</span>
                </label>
                <span className={cn(
                  "text-xs font-mono font-bold",
                  seoForm.meta_description.length >= 100 && seoForm.meta_description.length <= 170 ? "text-emerald-400" : "text-amber-400"
                )}>
                  {seoForm.meta_description.length} / 165 حرفاً
                </span>
              </div>
              <textarea
                rows={3}
                value={seoForm.meta_description}
                onChange={e => setSeoForm(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="اكتب وصفاً جذاباً يشجع الزبائن على الضغط على الرابط وطلب الطعام..."
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl p-4 text-sm text-white placeholder:text-gray-600 outline-none transition-colors resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1.5">
                💡 اذكر أشهر الوجبات وميزات الخدمة مثل "توصيل سريع" و "استلام من الفرع".
              </p>
            </div>

            {/* Keywords */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-white">الكلمات المفتاحية المستهدفة (Keywords)</label>
                <button
                  type="button"
                  onClick={addSuggestedKeywords}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>إضافة كلمات مقترحة تلقائياً</span>
                </button>
              </div>
              <input
                type="text"
                value={seoForm.meta_keywords}
                onChange={e => setSeoForm(prev => ({ ...prev, meta_keywords: e.target.value }))}
                placeholder="افصل بين الكلمات بفاصلة (مثال: جمر التنور, منيو جمر التنور, مطاعم الرياض, مشاوي)"
                className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 outline-none transition-colors"
              />
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {seoForm.meta_keywords.split(',').map(s => s.trim()).filter(Boolean).map((kw, i) => (
                  <span key={i} className="bg-zinc-800 text-amber-300 border border-amber-400/20 text-xs px-2.5 py-0.5 rounded-lg">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Social Share Image & Robots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/5">
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  رابط صورة المشاركة (OG Social Image)
                </label>
                <input
                  type="text"
                  value={seoForm.og_image}
                  onChange={e => setSeoForm(prev => ({ ...prev, og_image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
                />
                <p className="text-[11px] text-gray-400 mt-1">تظهر هذه الصورة عند إرسال رابط الموقع في واتساب أو تويتر.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  الرابط الأساسي للموقع (Canonical URL)
                </label>
                <input
                  type="text"
                  value={seoForm.canonical_url}
                  onChange={e => setSeoForm(prev => ({ ...prev, canonical_url: e.target.value }))}
                  placeholder="https://jamraltanour.com/"
                  className="w-full bg-black/40 border border-white/10 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-600 outline-none transition-colors dir-ltr text-right"
                />
                <p className="text-[11px] text-gray-400 mt-1">يمنع ازدواجية الروابط عند محركات البحث.</p>
              </div>
            </div>

            {/* Robots & Indexing Toggle */}
            <div className="flex items-center justify-between p-4 bg-black/30 rounded-2xl border border-white/5">
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>السماح لقوقل بأرشفة وفهرسة الموقع (Google Indexing)</span>
                  {seoForm.robots_index ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">مفعل</span>
                  ) : (
                    <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">معطل</span>
                  )}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  اتركه مفعّلاً دائماً ليظهر الموقع في نتائج البحث وخرائط قوقل.
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
              <h3 className="text-base font-black text-white">إدارة المقالات والمحتوى الحصري</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                كتابة مقالات تزيد من ظهور المطعم في قوقل عند بحث الناس عن أفضل أكلات أو وصفات أو عروض.
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

          {/* Articles Grid */}
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
                      {art.published ? 'منشور للعامة' : 'مسودة'}
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
                  كود تقني مخفي يقرأه قوقل ليعرف موقع المطعم، رقم الهاتف، وساعات العمل لعرضها في نتائج البحث.
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
                  placeholder="مشاوي، فطائر، مأكولات شرقية"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">رقم الهاتف للتواصل / الحجز</label>
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
                  placeholder="الرياض - السويدي الغربي"
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
                placeholder="يومياً من 12:00 ظهراً إلى 02:00 صباحاً"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PREVIEW (Google & Social) */}
      {activeTab === 'preview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">المعاينة الحية لنتائج البحث والمشاركة</h3>
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

          {/* Google Result Mockup */}
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-1">
              <Search size={14} className="text-amber-400" />
              <span>مظهر الموقع في نتائج بحث قوقل (Google Search)</span>
            </div>

            <div className={cn(
              "bg-white rounded-2xl p-5 text-left border border-gray-200 shadow-sm",
              previewDevice === 'mobile' ? "max-w-md mx-auto" : "max-w-2xl"
            )} dir="ltr">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold text-xs border border-amber-500/20">
                  🔥
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
                {seoForm.meta_description || 'مطعم جمر التنور - المنيو الرسمي. تصفح قائمتنا واطلب أشهى الفطائر والمشويات أونلاين بسهولة.'}
              </p>
            </div>
          </div>

          {/* WhatsApp / Social Mockup */}
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-1">
              <Share2 size={14} className="text-emerald-400" />
              <span>مظهر الرابط عند المشاركة في واتساب (WhatsApp Preview)</span>
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
                    <span className="text-3xl">🔥</span>
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

      {/* MODAL: ADD / EDIT ARTICLE */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 space-y-5 text-right shadow-2xl animate-in fade-in zoom-in-95" dir="rtl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-lg font-black text-white">
                {editingArticleId ? 'تعديل المقال' : 'إضافة مقال جديد للمدونة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg bg-zinc-800 cursor-pointer"
              >
                ✕ إغلاق
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
                  placeholder="مثال: سر نكهة الفطائر على الجمر في جمر التنور"
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
                    placeholder="secret-of-falafel"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-400 font-mono dir-ltr text-right"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={articleForm.category || ''}
                    onChange={e => setArticleForm(p => ({ ...p, category: e.target.value }))}
                    placeholder="قصتنا، نصائح، عروض"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">ملخص المقال (يظهر في قوقل)</label>
                <textarea
                  rows={2}
                  value={articleForm.summary || ''}
                  onChange={e => setArticleForm(p => ({ ...p, summary: e.target.value }))}
                  placeholder="سطران يوضحان فكرة المقال..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">محتوى المقال بالكامل</label>
                <textarea
                  rows={5}
                  value={articleForm.content || ''}
                  onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="اكتب تفاصيل المقال هنا..."
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
                  <span>نشر المقال فوراً</span>
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
                    تأكيد وإضافة
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
