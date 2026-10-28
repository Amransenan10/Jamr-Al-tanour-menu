import React from 'react';
import { ShoppingCart, Flame, TrendingUp, RefreshCw, Loader2, CheckCircle2, MessageSquare, Check } from 'lucide-react';
import { AbandonedCartRecord, generateWhatsAppRecoveryUrl } from '../services/abandonedCartService';

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
                {carts.map(cart => (
                  <tr key={cart.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5">
                      <div>
                        <p className="text-white font-bold text-sm">{cart.customer_name || 'عميل عزيز'}</p>
                        <p className="text-xs font-mono text-gray-400 dir-ltr text-right">{cart.phone}</p>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        {(cart.items || []).slice(0, 2).map((it: any, idx: number) => (
                          <p key={idx} className="text-xs text-gray-300 font-medium">
                            • {it.name_ar} {it.quantity > 1 ? `(x${it.quantity})` : ''}
                          </p>
                        ))}
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
                          href={generateWhatsAppRecoveryUrl(cart, 'BACK10')}
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
                          onClick={() => onRecover(cart.id, cart.phone)}
                          className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="وسم كمسترجع أو إزالة من القائمة"
                        >
                          <Check size={14} />
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
    </div>
  );
};
