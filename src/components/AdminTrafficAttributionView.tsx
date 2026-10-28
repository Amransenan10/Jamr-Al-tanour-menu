import React from 'react';
import { Compass, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminTrafficAttributionViewProps {
  trafficStats: Record<string, { count: number; totalSales: number }>;
}

export const AdminTrafficAttributionView: React.FC<AdminTrafficAttributionViewProps> = ({ trafficStats }) => {
  const totalOrders = Object.values(trafficStats).reduce((acc, d) => acc + d.count, 0) || 1;
  const totalRevenue = Object.values(trafficStats).reduce((acc, d) => acc + d.totalSales, 0);

  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jamr-al-tanour-menu.vercel.app';

  const copyUrl = (param: string, label: string) => {
    const fullUrl = `${siteUrl}/?${param}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success(`تم نسخ رابط (${label}) بنجاح! 📋`);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Compass size={20} className="text-cyan-400" />
              <span>تقرير مصادر الزوار والطلبات (Traffic Attribution)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              توزيع طلبات المطعم بحسب القنوات الإعلانية (تيك توك، سناب شات، طاولات، خرائط، مباشر)
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

        {/* Quick UTM Link Generator Box */}
        <div className="bg-gradient-to-r from-zinc-800/80 to-zinc-900 border border-white/10 p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-amber-400" />
            <h4 className="font-black text-white text-sm">صانع روابط التتبع السريع للإعلانات (Campaign Link Generator)</h4>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            انسخ هذه الروابط الجاهزة وضعها مباشرة في إعلاناتك ليتعرف النظام تلقائياً على كل طلب قادم من الإعلان:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <button
              type="button"
              onClick={() => copyUrl('source=tiktok&utm_campaign=ad1', 'إعلان تيك توك')}
              className="p-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl text-right transition-colors cursor-pointer group"
            >
              <p className="text-xs font-black text-cyan-400 group-hover:underline">رابط إعلان تيك توك 🎵</p>
              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">?source=tiktok</p>
            </button>

            <button
              type="button"
              onClick={() => copyUrl('source=snapchat&utm_campaign=ad1', 'إعلان سناب شات')}
              className="p-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl text-right transition-colors cursor-pointer group"
            >
              <p className="text-xs font-black text-yellow-400 group-hover:underline">رابط إعلان سناب شات 👻</p>
              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">?source=snapchat</p>
            </button>

            <button
              type="button"
              onClick={() => copyUrl('source=instagram&utm_campaign=ad1', 'إعلان إنستغرام')}
              className="p-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl text-right transition-colors cursor-pointer group"
            >
              <p className="text-xs font-black text-blue-400 group-hover:underline">رابط إنستغرام 📷</p>
              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">?source=instagram</p>
            </button>

            <button
              type="button"
              onClick={() => copyUrl('source=table_1', 'طاولة 1 بالمحل')}
              className="p-3 bg-black/40 hover:bg-black/60 border border-white/10 rounded-xl text-right transition-colors cursor-pointer group"
            >
              <p className="text-xs font-black text-emerald-400 group-hover:underline">رابط QR طاولة 1 🏷️</p>
              <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">?source=table_1</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
