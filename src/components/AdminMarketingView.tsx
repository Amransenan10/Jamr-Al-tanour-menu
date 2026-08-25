import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { 
  Send, Bell, Users, Crown, MessageSquare, Sparkles, 
  Search, Copy, CheckCircle2, Loader2, RefreshCw, Ticket, ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface CustomerAggregated {
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  badge: 'vip' | 'preferred' | 'new';
}

export const AdminMarketingView: React.FC = () => {
  const [subView, setSubView] = useState<'broadcast' | 'vip'>('broadcast');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<CustomerAggregated[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'vip' | 'preferred' | 'new'>('all');

  // Form State for Sending Notification
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    promo_code: '',
    url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscribers Count
      const { count: subCount } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });
      setSubscribersCount(subCount || 0);

      // 2. Fetch Broadcast History
      const { data: bData } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (bData) setBroadcasts(bData);

      // 3. Aggregate Orders to get Customer VIP list
      const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select('phone, total_price, created_at')
        .not('phone', 'is', null);

      if (ordersData) {
        const customerMap: Record<string, { count: number; total: number; lastDate: string }> = {};

        ordersData.forEach(ord => {
          const phone = ord.phone?.trim();
          if (!phone || phone.length < 8) return;

          if (!customerMap[phone]) {
            customerMap[phone] = { count: 0, total: 0, lastDate: ord.created_at };
          }
          customerMap[phone].count += 1;
          customerMap[phone].total += (ord.total_price || 0);

          if (new Date(ord.created_at) > new Date(customerMap[phone].lastDate)) {
            customerMap[phone].lastDate = ord.created_at;
          }
        });

        const aggregated: CustomerAggregated[] = Object.entries(customerMap).map(([phone, data]) => {
          let badge: 'vip' | 'preferred' | 'new' = 'new';
          if (data.count >= 5) badge = 'vip';
          else if (data.count >= 3) badge = 'preferred';

          return {
            phone,
            orderCount: data.count,
            totalSpent: data.total,
            lastOrderDate: data.lastDate,
            badge
          };
        });

        // Sort by total orders descending
        aggregated.sort((a, b) => b.orderCount - a.orderCount);
        setCustomers(aggregated);
      }
    } catch (e) {
      console.error('Error fetching marketing data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title.trim() || !notifForm.message.trim()) {
      toast.error('الرجاء إدخال عنوان ورسالة الإشعار');
      return;
    }

    setSending(true);
    try {
      const payload = {
        title: notifForm.title.trim(),
        message: notifForm.message.trim(),
        promo_code: notifForm.promo_code.trim() ? notifForm.promo_code.trim().toUpperCase() : null,
        url: notifForm.url.trim() || null,
        target_group: 'all'
      };

      const { data, error } = await supabaseAdmin.from('broadcast_notifications').insert([payload]).select().single();
      if (error) throw error;

      toast.success('تم إرسال الإشعار لجميع العملاء والمشتركين بنجاح! 🚀');
      setNotifForm({ title: '', message: '', promo_code: '', url: '' });
      if (data) setBroadcasts(prev => [data, ...prev]);
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      toast.error('حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  const formatWhatsAppLink = (phone: string, customerBadge: string) => {
    // Format phone to international 966 standard
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('05')) {
      cleaned = '966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5')) {
      cleaned = '966' + cleaned;
    }

    const badgeTitle = customerBadge === 'vip' ? 'عميلنا المميز جداً VIP 🏆' : 'عميلنا العزيز 🌟';
    const text = encodeURIComponent(
      `أهلاً بك! لأنك ${badgeTitle} في مطعم جمر التنور 🔥\n` +
      `يسعدنا تقديم كود خصم حصري لك (WELCOME10) لخصم 10% على طلبك القادم! 🍕✨\n\n` +
      `استخدم الكود عند الطلب من المنيو:\nhttps://jamr-al-tanour-menu.vercel.app/`
    );

    return `https://wa.me/${cleaned}?text=${text}`;
  };

  const filteredCustomers = customers.filter(c => {
    const matchesPhone = c.phone.toLowerCase().includes(searchPhone.trim().toLowerCase());
    const matchesLevel = filterLevel === 'all' || c.badge === filterLevel;
    return matchesPhone && matchesLevel;
  });

  const vipCount = customers.filter(c => c.badge === 'vip').length;
  const preferredCount = customers.filter(c => c.badge === 'preferred').length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">مشتركي الإشعارات</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{subscribersCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Bell size={20} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">العملاء المميزون (VIP)</p>
            <h3 className="text-2xl font-black text-yellow-400 mt-1">{vipCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center">
            <Crown size={20} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">إجمالي قاعدة العملاء</p>
            <h3 className="text-2xl font-black text-blue-400 mt-1">{customers.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Users size={20} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">الإشعارات المرسلة</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{broadcasts.length}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Send size={20} />
          </div>
        </div>
      </div>

      {/* Main Mode Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setSubView('broadcast')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer",
            subView === 'broadcast'
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "bg-zinc-900 text-gray-400 hover:bg-zinc-800"
          )}
        >
          <Bell size={18} />
          <span>إرسال إشعار عام بالجوال</span>
        </button>

        <button
          onClick={() => setSubView('vip')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer",
            subView === 'vip'
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "bg-zinc-900 text-gray-400 hover:bg-zinc-800"
          )}
        >
          <Crown size={18} />
          <span>تسويق العملاء المميزين (WhatsApp VIP)</span>
        </button>

        <button
          onClick={fetchData}
          className="mr-auto p-2 bg-zinc-900 hover:bg-zinc-800 text-gray-400 rounded-xl transition-colors"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-primary" : ""} />
        </button>
      </div>

      {/* SubView 1: Broadcast Notification Form */}
      {subView === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Send size={18} />
              </div>
              <h3 className="font-black text-lg text-white">إرسال إشعار مباشر</h3>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">عنوان الإشعار <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 🎉 عرض يوم الجمعة من جمر التنور"
                  value={notifForm.title}
                  onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">نص الإشعار <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={3}
                  placeholder="اكتب تفاصيل العرض والخصم المشوق هنا..."
                  value={notifForm.message}
                  onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">كود الخصم المرتبط (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: FRIDAY20"
                  value={notifForm.promo_code}
                  onChange={e => setNotifForm({ ...notifForm, promo_code: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-amber-500/50 outline-none font-mono uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>إرسال لجميع المشتركين 🚀</span>
              </button>
            </form>
          </div>

          {/* Broadcast History Table */}
          <div className="lg:col-span-2 bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-black text-lg text-white">سجل الإشعارات المرسلة سابقاً</h3>
              <span className="text-xs font-bold text-gray-400">{broadcasts.length} إشعار</span>
            </div>

            <div className="p-4 overflow-y-auto max-h-[500px] space-y-3">
              {broadcasts.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  لم يتم إرسال إشعارات عامة بعد. استخدم النموذج لإرسال أول إشعار!
                </div>
              ) : (
                broadcasts.map(b => (
                  <div key={b.id} className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400 text-sm">{b.title}</span>
                        {b.promo_code && (
                          <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                            كود: {b.promo_code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{b.message}</p>
                    </div>

                    <span className="text-[11px] text-gray-500 whitespace-nowrap shrink-0">
                      {new Date(b.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SubView 2: VIP Customer WhatsApp List */}
      {subView === 'vip' && (
        <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden space-y-4 p-6">
          {/* Controls & Search */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search size={18} className="absolute right-3 top-3 text-gray-500" />
              <input
                type="text"
                placeholder="بحث برقم الجوال..."
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value)}
                className="w-full bg-zinc-800 text-white rounded-xl pr-10 pl-4 py-2.5 text-sm border border-transparent focus:border-amber-500/50 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              <button
                onClick={() => setFilterLevel('all')}
                className={cn("px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer", filterLevel === 'all' ? "bg-amber-500 text-black" : "bg-zinc-800 text-gray-400")}
              >
                الكل ({customers.length})
              </button>
              <button
                onClick={() => setFilterLevel('vip')}
                className={cn("px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer", filterLevel === 'vip' ? "bg-yellow-500 text-black" : "bg-zinc-800 text-gray-400")}
              >
                🏆 VIP ذهبي ({vipCount})
              </button>
              <button
                onClick={() => setFilterLevel('preferred')}
                className={cn("px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer", filterLevel === 'preferred' ? "bg-blue-500 text-black" : "bg-zinc-800 text-gray-400")}
              >
                🌟 مميز ({preferredCount})
              </button>
            </div>
          </div>

          {/* Customers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-zinc-800/60 text-gray-400 text-xs">
                <tr>
                  <th className="p-3 font-bold">رقم الجوال</th>
                  <th className="p-3 font-bold">تصنيف العميل</th>
                  <th className="p-3 font-bold">عدد الطلبات</th>
                  <th className="p-3 font-bold">إجمالي المشتريات</th>
                  <th className="p-3 font-bold">آخر طلب</th>
                  <th className="p-3 font-bold text-center">إرسال عرض واتساب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">لا يوجد عملاء يطابقون خيارات البحث</td>
                  </tr>
                ) : (
                  filteredCustomers.map(cust => (
                    <tr key={cust.phone} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-mono font-bold dir-ltr text-right text-white">
                        {cust.phone}
                      </td>
                      <td className="p-3">
                        {cust.badge === 'vip' ? (
                          <span className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-400 px-2.5 py-0.5 rounded-lg text-xs font-black">
                            <Crown size={12} /> 🏆 VIP ذهبي
                          </span>
                        ) : cust.badge === 'preferred' ? (
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                            🌟 عميل مميز
                          </span>
                        ) : (
                          <span className="bg-zinc-800 text-gray-400 px-2.5 py-0.5 rounded-lg text-xs font-bold">
                            👤 عميل جديد
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-amber-400">{cust.orderCount} طلبات</td>
                      <td className="p-3 font-bold text-emerald-400">{cust.totalSpent.toFixed(2)} ر.س</td>
                      <td className="p-3 text-xs text-gray-400">
                        {new Date(cust.lastOrderDate).toLocaleDateString('ar-SA')}
                      </td>
                      <td className="p-3 text-center">
                        <a
                          href={formatWhatsAppLink(cust.phone, cust.badge)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-xl font-bold text-xs transition-all hover:scale-105"
                        >
                          <MessageSquare size={14} />
                          <span>واتساب 💬</span>
                          <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
