import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Flame, 
  TrendingUp, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  MessageSquare, 
  Check, 
  Sliders, 
  Save, 
  RotateCcw, 
  Copy, 
  ExternalLink,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  AbandonedCartRecord, 
  generateWhatsAppRecoveryUrl,
  DEFAULT_WHATSAPP_TEMPLATE,
  STORAGE_WHATSAPP_TEMPLATE_KEY,
  STORAGE_RECOVERY_PROMO_KEY
} from '../services/abandonedCartService';

interface AdminAbandonedCartsViewProps {
  carts: AbandonedCartRecord[];
  loading: boolean;
  onRefresh: () => void;
  onRecover: (cartId: string, phone: string) => void;
}

export const AdminAbandonedCartsView: React.FC<AdminAbandonedCartsViewProps> = ({
  carts,
  loading,
  onRefresh,
  onRecover
}) => {
  const totalValue = carts.reduce((acc, c) => acc + (c.total_price || 0), 0);
  const avgValue = carts.length > 0 ? (totalValue / carts.length).toFixed(2) : '0.00';

  // Template Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [templateText, setTemplateText] = useState(DEFAULT_WHATSAPP_TEMPLATE);
  const [promoCode, setPromoCode] = useState('');
  const [copiedCartId, setCopiedCartId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedTemplate = localStorage.getItem(STORAGE_WHATSAPP_TEMPLATE_KEY);
      if (savedTemplate) setTemplateText(savedTemplate);

      const savedPromo = localStorage.getItem(STORAGE_RECOVERY_PROMO_KEY);
      if (savedPromo) setPromoCode(savedPromo);
    } catch (e) {}
  }, []);

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(STORAGE_WHATSAPP_TEMPLATE_KEY, templateText);
      localStorage.setItem(STORAGE_RECOVERY_PROMO_KEY, promoCode.trim());
      toast.success('تم حفظ قالب ورسالة الواتساب بنجاح! 💾');
    } catch (e) {
      toast.error('تعذر حفظ القالب محلياً');
    }
  };

  const handleResetTemplate = () => {
    setTemplateText(DEFAULT_WHATSAPP_TEMPLATE);
    setPromoCode('');
    try {
      localStorage.removeItem(STORAGE_WHATSAPP_TEMPLATE_KEY);
      localStorage.removeItem(STORAGE_RECOVERY_PROMO_KEY);
      toast.success('تمت استعادة القالب الافتراضي');
    } catch (e) {}
  };

  const handleCopyMessage = (cart: AbandonedCartRecord) => {
    const rawUrl = generateWhatsAppRecoveryUrl(cart, templateText, promoCode);
    const parsedText = decodeURIComponent(rawUrl.split('?text=')[1] || '');
    
    // Robust copy
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(parsedText);
    } else {
      const ta = document.createElement('textarea');
      ta.value = parsedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    setCopiedCartId(cart.id);
    toast.success('تم نسخ نص الرسالة بالكامل! يمكنك لصقه في أي محادثة 📋');
    setTimeout(() => setCopiedCartId(null), 3000);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">السلات المتروكة النشطة</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">{carts.length} سلة</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">إجمالي القيمة المتروكة</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              {totalValue.toFixed(2)} ر.س
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Flame size={24} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">متوسط قيمة السلة المفقودة</p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">
              {avgValue} ر.س
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Template & Settings Toggle Banner */}
      <div className="bg-zinc-900 rounded-3xl border border-white/5 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sliders size={18} className="text-emerald-400" />
              <span>تخصيص نص رسالة تذكير السلة المتروكة بالواتساب</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              تحكم بالكامل في الكلمات ونبرة الرسالة، وأضف كود الخصم الحقيقي الذي تختاره أو اتركه فارغاً بدون أي كود خصم.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-2 self-start sm:self-auto border border-white/5"
          >
            <Sliders size={14} />
            <span>{showSettings ? 'إخفاء محرر الرسالة' : 'تعديل نص الرسالة وكود الخصم ✍️'}</span>
          </button>
        </div>

        {/* Collapsible Editor */}
        {showSettings && (
          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Message Editor */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-300 block">
                  نص الرسالة (يمكنك استخدام المتغيرات التلقائية أدناه):
                </label>
                <textarea
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  rows={9}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed resize-none"
                  placeholder="اكتب نص رسالة التذكير..."
                />

                {/* Available Variables */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[11px] text-gray-400 font-bold ml-1">المتغيرات المتاحة:</span>
                  {[
                    { tag: '{customer_name}', desc: 'اسم العميل' },
                    { tag: '{items}', desc: 'قائمة الوجبات' },
                    { tag: '{total_price}', desc: 'المبلغ الإجمالي' },
                    { tag: '{recovery_link}', desc: 'رابط استرجاع السلة' },
                    { tag: '{promo_section}', desc: 'فقرة كود الخصم' }
                  ].map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => setTemplateText(prev => prev + ' ' + v.tag)}
                      className="text-[10px] bg-white/5 hover:bg-white/10 text-emerald-300 px-2 py-0.5 rounded-md border border-white/5 cursor-pointer font-mono"
                      title={v.desc}
                    >
                      {v.tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo Code & Live Preview */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Tag size={14} className="text-amber-400" />
                    <span>كود الخصم التحفيزي (اختياري - اتركه فارغاً إذا لا ترغب بأي خصم):</span>
                  </label>
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="مثال: TANOUR10 أو اتركه فارغاً"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <p className="text-[11px] text-gray-400">
                    إذا تركت الحقل فارغاً، لن يظهر أي ذكر لكود خصم في الرسالة أبداً.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 block">معاينة شكل الرسالة التجريبية:</span>
                  <div className="bg-black/60 border border-emerald-500/20 rounded-2xl p-3.5 text-[11px] text-gray-200 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto font-sans">
                    {templateText
                      .replace(/{customer_name}/g, 'أ/ عبد الله')
                      .replace(/{items}/g, '• شاورما عربي دبل (x1)\n• بطاطس مقلية (x1)')
                      .replace(/{total_price}/g, '35')
                      .replace(/{promo_code}/g, promoCode.trim())
                      .replace(/{promo_section}/g, promoCode.trim() ? `\n🎁 استخدم كود الخصم الحصري: *${promoCode.trim()}* عند الطلب!` : '')
                      .replace(/{recovery_link}/g, 'https://jamr-al-tanour-menu.vercel.app/?recover_cart=demo')}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                  >
                    <Save size={14} />
                    <span>حفظ هذا النموذج لجميع الرسائل</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTemplate}
                    className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                    title="استعادة النص الافتراضي"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Abandoned Carts Table */}
      <div className="bg-zinc-900 rounded-3xl border border-white/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>قائمة السلات المتروكة الجاهزة للتذكير</span>
              <span className="text-xs bg-rose-500/20 text-rose-300 font-bold px-2 py-0.5 rounded-full">WhatsApp Recovery</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              عملاء وضعوا وجبات في سلتهم وكتبوا أرقامهم دون إتمام الطلب — أرسل تذكيراً بالواتساب بنقرة زر واحدة لإتمام الطلب!
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-primary" : ""} />
            <span>تحديث السلات</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : carts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-bold text-white text-base">رائع! لا توجد سلات متروكة حالياً</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              كل العملاء الذين أضافوا أصنافاً إما أكملوا طلباتهم بنجاح أو لم يتركوا سلات معلقة بعد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-right text-sm">
              <thead className="bg-zinc-800/60 text-gray-400 text-xs font-bold border-b border-white/5">
                <tr>
                  <th className="p-3.5">العميل / الجوال</th>
                  <th className="p-3.5">الوجبات في السلة</th>
                  <th className="p-3.5">قيمة السلة</th>
                  <th className="p-3.5">مصدر الزيارة</th>
                  <th className="p-3.5">الوقت</th>
                  <th className="p-3.5 text-center">إجراء الاسترجاع السريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {carts.map(cart => {
                  const waUrl = generateWhatsAppRecoveryUrl(cart, templateText, promoCode);
                  const isCopied = copiedCartId === cart.id;

                  return (
                    <tr key={cart.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <div>
                          <p className="text-white font-bold text-sm">{cart.customer_name || 'عميل عزيز'}</p>
                          <p className="text-xs font-mono text-gray-400 dir-ltr text-right">{cart.phone}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {(cart.items || []).slice(0, 2).map((it: any, idx: number) => {
                            const itemName = it.name || it.name_ar || it.title || 'وجبة';
                            return (
                              <p key={idx} className="text-xs text-gray-300 font-medium">
                                • {itemName} {it.quantity > 1 ? `(x${it.quantity})` : ''}
                              </p>
                            );
                          })}
                          {(cart.items || []).length > 2 && (
                            <p className="text-[10px] text-amber-400 font-bold">+ {(cart.items.length - 2)} أصناف أخرى</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 font-black text-emerald-400 text-base">
                        {cart.total_price} ر.س
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 bg-white/5 text-gray-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-white/5">
                          {cart.source || 'مباشر'}
                        </span>
                      </td>
                      <td className="p-3.5 text-xs text-gray-400">
                        {new Date(cart.updated_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-black px-3.5 py-1.5 rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-500/20 hover:scale-105 cursor-pointer"
                            title="فتح محادثة واتساب بتذكير لطيف ورابط السلة"
                          >
                            <MessageSquare size={14} />
                            <span>تذكير بالواتساب 📲</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(cart)}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isCopied 
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                                : 'bg-zinc-800 hover:bg-zinc-700 border-white/5 text-gray-400 hover:text-white'
                            }`}
                            title="نسخ نص الرسالة بالكامل للصقها يدوياً"
                          >
                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => onRecover(cart.id, cart.phone)}
                            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="وسم كمسترجع أو إزالة من القائمة"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};