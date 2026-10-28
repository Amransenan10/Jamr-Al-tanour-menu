import React, { useState } from 'react';
import { Compass, Link2, Copy, Check, ExternalLink, QrCode, Sparkles, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminTrafficAttributionViewProps {
  trafficStats: Record<string, { count: number; totalSales: number }>;
}

interface QuickChannel {
  id: string;
  name: string;
  icon: string;
  color: string;
  param: string;
  description: string;
}

const PRESET_CHANNELS: QuickChannel[] = [
  {
    id: 'tiktok',
    name: 'إعلان تيك توك',
    icon: '🎵',
    color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    param: 'source=tiktok&utm_campaign=ad1',
    description: 'ضعه كـ (Website URL) في حملتك الإعلانية على TikTok Ads'
  },
  {
    id: 'snapchat',
    name: 'إعلان سناب شات',
    icon: '👻',
    color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
    param: 'source=snapchat&utm_campaign=ad1',
    description: 'ضعه كرابط السحب لأعلى (Swipe Up) في Snapchat Ads'
  },
  {
    id: 'instagram',
    name: 'إنستغرام / بايو',
    icon: '📷',
    color: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
    param: 'source=instagram&utm_campaign=bio',
    description: 'ضعه في بايو إنستغرام أو القصص (Stories)'
  },
  {
    id: 'google',
    name: 'خرائط جوجل / بحث',
    icon: '📍',
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    param: 'source=google_maps',
    description: 'ضعه كرابط الموقع في ملف المطعم على Google Maps'
  },
  {
    id: 'table_1',
    name: 'طاولة 1 (كود QR)',
    icon: '🏷️',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    param: 'source=table_1',
    description: 'اطبعه كرمز QR ملصق على طاولة رقم 1 بالصالة'
  },
  {
    id: 'table_2',
    name: 'طاولة 2 (كود QR)',
    icon: '🏷️',
    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    param: 'source=table_2',
    description: 'اطبعه كرمز QR ملصق على طاولة رقم 2 بالصالة'
  }
];

export const AdminTrafficAttributionView: React.FC<AdminTrafficAttributionViewProps> = ({ trafficStats }) => {
  const totalOrders = Object.values(trafficStats).reduce((acc, d) => acc + d.count, 0) || 1;
  const totalRevenue = Object.values(trafficStats).reduce((acc, d) => acc + d.totalSales, 0);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jamr-al-tanour-menu.vercel.app';

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customTableNum, setCustomTableNum] = useState('3');
  const [customCampaign, setCustomCampaign] = useState('');

  // Fallback copy helper
  const copyToClipboard = (text: string, label: string, channelId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedId(channelId);
      toast.success(`تم نسخ رابط (${label}) بنجاح! 📋`);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (err) {
      toast.error('تعذر نسخ الرابط تلقائياً، يمكنك نسخه يدوياً');
    }
  };

  const openUrl = (param: string) => {
    const fullUrl = `${siteUrl}/?${param}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Educational Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-900 border border-cyan-500/20 p-5 rounded-3xl space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-cyan-400" />
          <h4 className="text-sm font-black text-white">ما هي روابط التتبع (Campaign Links) وما فائدتها؟</h4>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          بدلاً من وضع الرابط العام للموقع في إعلاناتك، استخدم الروابط المخصصة أدناه. بمجرد أن يضغط الزبون على إعلان تيك توك أو سناب شات أو يمسح كود طاولة معينة، يتعرف النظام تلقائياً على مصدره، ويسجل لك في هذا التقرير كم طلب ومبيعات جاءت من كل إعلان بالريال لتعرف أي منصة تحقق لك أعلى أرباح!
        </p>
      </div>

      {/* Main Stats Card */}
      <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Compass size={20} className="text-cyan-400" />
              <span>تقرير مصادر الزوار والطلبات (Traffic Attribution)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              توزيع طلبات المطعم ومبيعاته حسب القنوات الإعلانية (تيك توك، سناب شات، طاولات، خرائط، مباشر)
            </p>
          </div>

          <div className="flex items-center gap-4 text-left">
            <div>
              <span className="text-xs text-gray-400 font-bold block">إجمالي مبيعات القنوات</span>
              <span className="text-xl font-black text-emerald-400">{totalRevenue.toFixed(2)} ر.س</span>
            </div>
            <div className="border-r border-white/10 pr-4">
              <span className="text-xs text-gray-400 font-bold block">القنوات النشطة</span>
              <span className="text-xl font-black text-cyan-400">{Object.keys(trafficStats).length} منصات</span>
            </div>
          </div>
        </div>

        {/* Channels Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(trafficStats).length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500 font-bold">
              لا توجد طلبات مسجلة بعد لحساب مصادر الزوار
            </div>
          ) : (
            Object.entries(trafficStats).map(([sourceName, data]) => {
              const percentage = Math.round((data.count / totalOrders) * 100);

              return (
                <div key={sourceName} className="bg-black/30 border border-white/5 p-5 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-white text-base">{sourceName}</h4>
                    <span className="text-xs font-black bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                      {percentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-white/5">
                    <div>
                      <p className="text-[11px] text-gray-400 font-bold">عدد الطلبات</p>
                      <p className="text-lg font-black text-amber-400">{data.count} طلب</p>
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] text-gray-400 font-bold">إجمالي المبيعات</p>
                      <p className="text-lg font-black text-emerald-400">{data.totalSales.toFixed(2)} ر.س</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Interactive Campaign Link Generator Box */}
        <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900 border border-white/10 p-6 rounded-3xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 size={20} className="text-amber-400" />
              <h4 className="font-black text-white text-base">صانع روابط التتبع السريع للإعلانات (Campaign Link Generator)</h4>
            </div>
            <span className="text-xs bg-amber-500/10 text-amber-300 font-bold px-3 py-1 rounded-full border border-amber-500/20">
              جاهزة للنسخ والتجربة المباشرة
            </span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            اضغط على <b>«نسخ الرابط»</b> لوضعه في إعلانك أو طباعة رمز الـ QR، أو اضغط <b>«تجربة الرابط 🔗»</b> للتأكد بنفسك من عمله:
          </p>

          {/* Preset Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {PRESET_CHANNELS.map(ch => {
              const fullUrl = `${siteUrl}/?${ch.param}`;
              const isCopied = copiedId === ch.id;

              return (
                <div key={ch.id} className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white flex items-center gap-1.5">
                        <span>{ch.icon}</span>
                        <span>{ch.name}</span>
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ch.color}`}>
                        جاهز
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-normal">{ch.description}</p>
                    
                    {/* URL Display */}
                    <div className="mt-2 bg-zinc-900/90 border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center justify-between" dir="ltr">
                      <span className="text-[11px] font-mono text-cyan-300 truncate select-all">{fullUrl}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(fullUrl, ch.name, ch.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isCopied 
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10'
                      }`}
                    >
                      {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isCopied ? 'تم النسخ بنجاح ✓' : 'نسخ الرابط'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openUrl(ch.param)}
                      className="p-2 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 rounded-xl text-xs border border-white/10 transition-colors cursor-pointer"
                      title="فتح الرابط في صفحة جديدة للتجربة"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom QR Table Generator */}
          <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <QrCode size={20} />
              </div>
              <div>
                <h5 className="text-xs font-black text-white">تخصيص رابط لطاولة معينة بالرقم:</h5>
                <p className="text-[11px] text-gray-400">اختر رقم الطاولة لإنشاء رابط الـ QR الخاص بها فوراً</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-gray-400 font-bold shrink-0">طاولة رقم:</span>
              <input
                type="number"
                min="1"
                max="99"
                value={customTableNum}
                onChange={(e) => setCustomTableNum(e.target.value)}
                className="w-16 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white text-center font-mono focus:outline-none focus:border-emerald-400"
              />

              {(() => {
                const tableParam = `source=table_${customTableNum || '1'}`;
                const tableUrl = `${siteUrl}/?${tableParam}`;
                const isCopied = copiedId === `table_custom_${customTableNum}`;

                return (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tableUrl, `طاولة ${customTableNum}`, `table_custom_${customTableNum}`)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer ${
                        isCopied ? 'bg-emerald-500 text-black' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isCopied ? <Check size={13} /> : <Copy size={13} />}
                      <span>{isCopied ? 'تم النسخ ✓' : 'نسخ رابط الطاولة'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openUrl(tableParam)}
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded-xl border border-white/10 cursor-pointer"
                      title="فتح رابط الطاولة للتجربة"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};