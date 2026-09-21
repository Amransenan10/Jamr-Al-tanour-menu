import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { sendOneSignalPushNotification } from '../utils/oneSignalService';
import { 
  Send, Bell, Users, Crown, MessageSquare, Sparkles, 
  Search, Copy, CheckCircle2, Loader2, RefreshCw, Ticket, ExternalLink,
  Calendar, Flag, Gift, Check, ToggleLeft, ToggleRight, Layers, Flame
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { SeasonalEventSettings, EventPreset } from '../types';
import { getPresetDetails } from './SeasonalEventOverlay';

import { parseAppSettings, saveAppSettings } from '../utils/appSettingsUtils';

interface CustomerAggregated {
  phone: string;
  name?: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  badge: 'vip' | 'preferred' | 'new';
}

export const AdminMarketingView: React.FC = () => {
  const [subView, setSubView] = useState<'broadcast' | 'vip' | 'events'>('broadcast');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingEvents, setSavingEvents] = useState(false);
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

  // Form State for Seasonal Event Engine
  const [eventForm, setEventForm] = useState<SeasonalEventSettings>({
    event_active: true,
    event_preset: 'saudi_national_day',
    event_title: 'اليوم الوطني السعودي 🇸🇦',
    event_subtitle: 'نحتفل معكم باليوم الوطني! استمتع بأشهى الأطباق بخصم حصري ومميز',
    event_promo_code: 'SAUDI',
    event_show_confetti: true,
    event_show_modal: true
  });

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('admin-marketing-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'push_subscriptions' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Subscribers Count using supabaseAdmin to bypass RLS
      const { count: subCount, error: subErr } = await supabaseAdmin
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });
      
      if (!subErr && subCount !== null) {
        setSubscribersCount(subCount);
      } else {
        setSubscribersCount(subCount || 0);
      }

      // 2. Fetch Broadcast History
      const { data: bData } = await supabase
        .from('broadcast_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (bData) setBroadcasts(bData);

      // 3. Fetch App Settings for Seasonal Event Engine - DB IS THE ONLY SOURCE OF TRUTH
      const { data: appSettingsRaw } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      const parsedSettings = parseAppSettings(appSettingsRaw);

      setEventForm({
        event_active: Boolean(parsedSettings.event_active),
        event_preset: (parsedSettings.event_preset as EventPreset) || 'saudi_national_day',
        event_title: parsedSettings.event_title || 'اليوم الوطني السعودي 🇸🇦',
        event_subtitle: parsedSettings.event_subtitle || 'نحتفل معكم باليوم الوطني! استمتع بأشهى الأطباق بخصم حصري ومميز',
        event_promo_code: parsedSettings.event_promo_code || 'SAUDI',
        event_show_confetti: parsedSettings.event_show_confetti ?? true,
        event_show_modal: parsedSettings.event_show_modal ?? true
      });

      // 4. Fetch Orders & Loyalty Customers to build VIP marketing list
      const [ordersRes, loyaltyCustRes] = await Promise.all([
        supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('customers').select('*').order('points_balance', { ascending: false })
      ]);

      let rawOrders = ordersRes.data || [];
      if (ordersRes.error) {
        const fallbackOrders = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        rawOrders = fallbackOrders.data || [];
      }

      let rawLoyaltyCust = loyaltyCustRes.data || [];
      if (loyaltyCustRes.error) {
        const fallbackCust = await supabase.from('customers').select('*').order('points_balance', { ascending: false });
        rawLoyaltyCust = fallbackCust.data || [];
      }

      const customerMap: Record<string, {
        phone: string;
        name?: string;
        orderCount: number;
        totalSpent: number;
        lastOrderDate: string;
        pointsBalance: number;
      }> = {};

      rawOrders.forEach((o: any) => {
        const rawPhone = o.phone || o.customer_phone || o.phone_number;
        if (!rawPhone) return;
        const cleanPhone = String(rawPhone).trim();
        if (!cleanPhone) return;

        if (!customerMap[cleanPhone]) {
          customerMap[cleanPhone] = {
            phone: cleanPhone,
            name: o.customer_name || o.name || o.full_name || '',
            orderCount: 0,
            totalSpent: 0,
            lastOrderDate: o.created_at || new Date().toISOString(),
            pointsBalance: 0
          };
        }

        const existing = customerMap[cleanPhone];
        if (!existing.name && (o.customer_name || o.name || o.full_name)) {
          existing.name = o.customer_name || o.name || o.full_name;
        }

        if (o.status !== 'cancelled') {
          existing.orderCount += 1;
          existing.totalSpent += Number(o.total_price) || 0;
        }

        if (new Date(o.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.created_at;
        }
      });

      rawLoyaltyCust.forEach((c: any) => {
        const rawPhone = c.phone_number || c.phone;
        if (!rawPhone) return;
        const cleanPhone = String(rawPhone).trim();
        if (!cleanPhone) return;

        if (!customerMap[cleanPhone]) {
          customerMap[cleanPhone] = {
            phone: cleanPhone,
            name: c.full_name || c.name || '',
            orderCount: 0,
            totalSpent: 0,
            lastOrderDate: c.updated_at || c.created_at || new Date().toISOString(),
            pointsBalance: Number(c.points_balance) || 0
          };
        } else {
          if (!customerMap[cleanPhone].name && c.full_name) {
            customerMap[cleanPhone].name = c.full_name;
          }
          customerMap[cleanPhone].pointsBalance = Number(c.points_balance) || 0;
        }
      });

      const aggregatedList: CustomerAggregated[] = Object.values(customerMap).map(c => {
        let badge: 'vip' | 'preferred' | 'new' = 'new';
        if (c.orderCount >= 3 || c.totalSpent >= 150 || c.pointsBalance >= 50) {
          badge = 'vip';
        } else if (c.orderCount >= 1 || c.totalSpent >= 50 || c.pointsBalance > 0) {
          badge = 'preferred';
        }

        return {
          phone: c.phone,
          name: c.name || undefined,
          orderCount: c.orderCount,
          totalSpent: c.totalSpent,
          lastOrderDate: c.lastOrderDate,
          badge
        };
      });

      aggregatedList.sort((a, b) => {
        const badgeScore = { vip: 3, preferred: 2, new: 1 };
        if (badgeScore[b.badge] !== badgeScore[a.badge]) {
          return badgeScore[b.badge] - badgeScore[a.badge];
        }
        if (b.totalSpent !== a.totalSpent) {
          return b.totalSpent - a.totalSpent;
        }
        return b.orderCount - a.orderCount;
      });

      setCustomers(aggregatedList);
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

      let res = await supabaseAdmin.from('broadcast_notifications').insert([payload]).select();
      if (res.error) {
        res = await supabase.from('broadcast_notifications').insert([payload]).select();
      }

      if (res.error) throw res.error;

      const created = res.data && res.data[0];

      sendOneSignalPushNotification({
        title: notifForm.title.trim(),
        message: notifForm.message.trim(),
        url: notifForm.url.trim() || undefined
      }).catch(err => console.warn('OneSignal background push error:', err));

      toast.success('تم إرسال الإشعار لجميع العملاء والمشتركين بنجاح! 🚀');
      setNotifForm({ title: '', message: '', promo_code: '', url: '' });
      if (created) setBroadcasts(prev => [created, ...prev]);
    } catch (error: any) {
      console.error('Error sending broadcast:', error);
      toast.error(error?.message || 'حدث خطأ أثناء إرسال الإشعار');
    } finally {
      setSending(false);
    }
  };

  const handlePresetSelect = (preset: EventPreset) => {
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

    setEventForm(prev => ({
      ...prev,
      event_active: true,
      event_preset: preset,
      event_title: title,
      event_subtitle: subtitle,
      event_promo_code: promo
    }));
  };

  const handleSaveEventSettings = async (e?: React.FormEvent | React.MouseEvent, overrideActive?: boolean) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingEvents(true);

    const targetActive = overrideActive !== undefined ? overrideActive : eventForm.event_active;

    try {
      const eventConfig = {
        event_active: targetActive,
        event_preset: eventForm.event_preset,
        event_title: (eventForm.event_title || 'اليوم الوطني السعودي 🇸🇦').trim(),
        event_subtitle: (eventForm.event_subtitle || 'نحتفل معكم باليوم الوطني!').trim(),
        event_promo_code: (eventForm.event_promo_code || 'SAUDI').trim().toUpperCase(),
        event_show_confetti: eventForm.event_show_confetti,
        event_show_modal: eventForm.event_show_modal,
        event_timestamp: Date.now()
      };

      await saveAppSettings(eventConfig);

      setEventForm(prev => ({ ...prev, event_active: targetActive }));

      if (targetActive) {
        toast.success(`تم تفعيل وتطبيق ثيم (${eventConfig.event_title}) بنجاح على المتجر! 🇸🇦🎉`);
      } else {
        toast.success('تم إيقاف وحفظ إعدادات الموسم بنجاح! ⚡');
      }
    } catch (error: any) {
      console.error('Error saving event settings:', error);
      toast.error(error?.message || 'حدث خطأ عند حفظ إعدادات الموسم');
    } finally {
      setSavingEvents(false);
    }
  };

  const formatWhatsAppLink = (phone: string, customerName?: string, customerBadge?: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('05')) {
      cleaned = '966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5')) {
      cleaned = '966' + cleaned;
    }

    const badgeTitle = customerBadge === 'vip' ? 'عميلنا المميز جداً VIP 🏆' : 'عميلنا العزيز 🌟';
    const nameGreeting = customerName ? `أهلاً بك أ/ ${customerName}! 🌸` : 'أهلاً بك! 🌸';

    const text = encodeURIComponent(
      `${nameGreeting}\n` +
      `لأنك ${badgeTitle} في مطعم جمر التنور 🔥\n` +
      `يسعدنا تقديم كود خصم حصري لك (WELCOME10) لخصم 10% على طلبك القادم! 🍕✨\n\n` +
      `استخدم الكود عند الطلب من المنيو:\nhttps://jamr-al-tanour-menu.vercel.app/`
    );

    return `https://wa.me/${cleaned}?text=${text}`;
  };

  const filteredCustomers = customers.filter(c => {
    const matchesPhone = c.phone.toLowerCase().includes(searchPhone.trim().toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(searchPhone.trim().toLowerCase()));
    const matchesLevel = filterLevel === 'all' || c.badge === filterLevel;
    return matchesPhone && matchesLevel;
  });

  const vipCount = customers.filter(c => c.badge === 'vip').length;
  const preferredCount = customers.filter(c => c.badge === 'preferred').length;
  const currentPresetDetails = getPresetDetails(eventForm.event_preset);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400">حالة ثيم المناسبة</p>
            <h3 className={cn("text-lg font-black mt-1 flex items-center gap-1", eventForm.event_active ? "text-emerald-400" : "text-gray-500")}>
              {eventForm.event_active ? '🟢 مفعل الآن' : '⚪ غير مفعل'}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>

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
      </div>

      {/* Main Mode Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-3 flex-wrap">
        <button
          onClick={() => setSubView('events')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all text-sm cursor-pointer relative overflow-hidden",
            subView === 'events'
              ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black"
              : "bg-zinc-900 text-gray-400 hover:bg-zinc-800"
          )}
        >
          <Sparkles size={18} className="animate-pulse" />
          <span>إدارة المواسم والاحتفالات (اليوم الوطني 🇸🇦)</span>
          {eventForm.event_active && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          )}
        </button>

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
          className="mr-auto p-2 bg-zinc-900 hover:bg-zinc-800 text-gray-400 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw size={18} className={loading ? "animate-spin text-primary" : ""} />
        </button>
      </div>

      {/* SubView 0: Seasonal & Events Manager Engine */}
      {subView === 'events' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls Form */}
          <div className="lg:col-span-2 bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">نظام محرك الاحتفالات والمواسم</h3>
                  <p className="text-xs text-gray-400">تفعيل وتغيير طابع المتجر للمناسبات الوطنية والترويجية بضغطة زر</p>
                </div>
              </div>

              {/* Master Toggle Switch */}
              <button
                type="button"
                onClick={() => {
                  const nextVal = !eventForm.event_active;
                  setEventForm(prev => ({ ...prev, event_active: nextVal }));
                  handleSaveEventSettings(undefined, nextVal);
                }}
                className={cn(
                  "px-4 py-2 rounded-2xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md",
                  eventForm.event_active
                    ? "bg-emerald-500 text-black shadow-emerald-500/30"
                    : "bg-zinc-800 text-gray-400 hover:text-white"
                )}
              >
                {eventForm.event_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                <span>{eventForm.event_active ? 'ثيم المناسبة: مفعل 🟢' : 'ثيم المناسبة: معطل ⚪'}</span>
              </button>
            </div>

            {/* Event Presets Quick Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 block">اختر ثيم المناسبة القادمة (القوالب الجاهزة):</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <button
                  type="button"
                  onClick={() => handlePresetSelect('saudi_national_day')}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center",
                    eventForm.event_preset === 'saudi_national_day'
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/50 shadow-lg"
                      : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800"
                  )}
                >
                  <span className="text-xl">🇸🇦</span>
                  <span>اليوم الوطني</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('founding_day')}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center",
                    eventForm.event_preset === 'founding_day'
                      ? "bg-amber-950/80 border-amber-500 text-amber-300 ring-2 ring-amber-500/50 shadow-lg"
                      : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800"
                  )}
                >
                  <span className="text-xl">🏛️</span>
                  <span>يوم التأسيس</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('back_to_school')}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center",
                    eventForm.event_preset === 'back_to_school'
                      ? "bg-blue-950/80 border-blue-500 text-blue-300 ring-2 ring-blue-500/50 shadow-lg"
                      : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800"
                  )}
                >
                  <span className="text-xl">🎒</span>
                  <span>العودة للمدارس</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('ramadan_eid')}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center",
                    eventForm.event_preset === 'ramadan_eid'
                      ? "bg-purple-950/80 border-purple-500 text-purple-300 ring-2 ring-purple-500/50 shadow-lg"
                      : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800"
                  )}
                >
                  <span className="text-xl">🌙</span>
                  <span>رمضان والعيد</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePresetSelect('custom')}
                  className={cn(
                    "p-3 rounded-2xl border text-xs font-black flex flex-col items-center gap-1.5 transition-all cursor-pointer text-center",
                    eventForm.event_preset === 'custom'
                      ? "bg-orange-950/80 border-orange-500 text-orange-300 ring-2 ring-orange-500/50 shadow-lg"
                      : "bg-zinc-800/60 border-white/5 text-gray-400 hover:bg-zinc-800"
                  )}
                >
                  <span className="text-xl">🎨</span>
                  <span>عرض مخصص</span>
                </button>
              </div>
            </div>

            {/* Event Details Form */}
            <form onSubmit={handleSaveEventSettings} className="space-y-4 pt-2 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">عنوان المناسبة / الاحتفال <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: اليوم الوطني السعودي 🇸🇦"
                    value={eventForm.event_title}
                    onChange={e => setEventForm({ ...eventForm, event_title: e.target.value })}
                    className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-emerald-500/50 outline-none font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-300">كود الخصم المرتبط بالموسم</label>
                  <input
                    type="text"
                    placeholder="مثال: SAUDI"
                    value={eventForm.event_promo_code}
                    onChange={e => setEventForm({ ...eventForm, event_promo_code: e.target.value.toUpperCase() })}
                    className="w-full bg-zinc-800 text-amber-400 font-mono font-bold rounded-xl p-3 text-sm border border-transparent focus:border-emerald-500/50 outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-300">الوصف والنص الفرعي للتهنئة <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={2}
                  placeholder="نص التهنئة وتفاصيل الخصم للزوار..."
                  value={eventForm.event_subtitle}
                  onChange={e => setEventForm({ ...eventForm, event_subtitle: e.target.value })}
                  className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm border border-transparent focus:border-emerald-500/50 outline-none resize-none"
                />
              </div>

              {/* Toggles for Effects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center justify-between p-3.5 bg-zinc-800/80 rounded-xl border border-white/5 cursor-pointer hover:border-emerald-500/30 transition-all">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-400" />
                    <span className="text-xs font-bold text-white">تفعيل قصاصات زينة الاحتفال (Confetti)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={eventForm.event_show_confetti}
                    onChange={e => setEventForm({ ...eventForm, event_show_confetti: e.target.checked })}
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
                    checked={eventForm.event_show_modal}
                    onChange={e => setEventForm({ ...eventForm, event_show_modal: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleSaveEventSettings}
                disabled={savingEvents}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-black font-black text-base rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer mt-4"
              >
                {savingEvents ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                <span>حفظ وتطبيق إعدادات ثيم المناسبة على المتجر 🚀</span>
              </button>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-4">
            <h4 className="font-black text-sm text-gray-300 flex items-center gap-2">
              <span>معاينة حية للمظهر في الواجهة</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Live</span>
            </h4>

            {/* Top Ribbon Banner Preview */}
            <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${currentPresetDetails.colors.gradient} text-white border border-white/10 shadow-lg space-y-1`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentPresetDetails.icon}</span>
                <p className="font-black text-xs text-white truncate">
                  {eventForm.event_title || currentPresetDetails.badge}
                </p>
              </div>
              <p className="text-[11px] text-gray-200 line-clamp-2 leading-relaxed">
                {eventForm.event_subtitle}
              </p>
              {eventForm.event_promo_code && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/40 text-amber-300 font-mono text-[10px] font-black rounded border border-amber-400/30">
                  <Ticket size={12} />
                  <span>كود: {eventForm.event_promo_code}</span>
                </div>
              )}
            </div>

            {/* Modal Popup Mini Preview */}
            <div className={`p-5 rounded-3xl bg-gradient-to-b ${currentPresetDetails.colors.gradient} text-white border border-white/10 text-center space-y-3 relative overflow-hidden shadow-2xl`}>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-black text-amber-300">
                <span>{currentPresetDetails.icon}</span>
                <span>{currentPresetDetails.badge}</span>
              </div>
              <h5 className="font-black text-base text-white">{eventForm.event_title}</h5>
              <p className="text-xs text-gray-200 leading-relaxed line-clamp-2">{eventForm.event_subtitle}</p>
              
              {eventForm.event_promo_code && (
                <div className="p-2.5 bg-black/40 rounded-xl border border-amber-500/30 font-mono text-sm font-black text-amber-400">
                  {eventForm.event_promo_code}
                </div>
              )}

              <div className={`py-2 rounded-xl text-xs font-black ${currentPresetDetails.colors.btnBg}`}>
                اطلب واستفد من الخصم الان
              </div>
            </div>
          </div>
        </div>
      )}

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
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black rounded-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
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
                  <div key={b.id} className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-amber-400 text-sm">{b.title}</span>
                        {b.promo_code && (
                          <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                            كود: {b.promo_code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{b.message}</p>
                      <span className="text-[10px] text-gray-500 block pt-0.5">
                        {new Date(b.created_at).toLocaleDateString('ar-SA')} - {new Date(b.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <button
                        onClick={() => {
                          setNotifForm({
                            title: b.title,
                            message: b.message,
                            promo_code: b.promo_code || '',
                            url: b.url || ''
                          });
                          toast.success('تم نسخ بيانات الإشعار للنموذج اعلاه 📋');
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-amber-500/20"
                        title="تكرار وحشو بيانات الإشعار"
                      >
                        <RefreshCw size={14} />
                        <span>تكرار 📋</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`هل ترغب بإعادة إرسال الإشعار "${b.title}" لجميع المشتركين الآن؟`)) {
                            setSending(true);
                            try {
                              const payload = {
                                title: b.title,
                                message: b.message,
                                promo_code: b.promo_code || null,
                                url: b.url || null,
                                target_group: 'all'
                              };
                              let res = await supabaseAdmin.from('broadcast_notifications').insert([payload]).select();
                              if (res.error) res = await supabase.from('broadcast_notifications').insert([payload]).select();
                              if (res.error) throw res.error;

                              sendOneSignalPushNotification({ title: b.title, message: b.message, url: b.url || undefined });
                              toast.success('تم إعادة إرسال الإشعار لجميع المشتركين بنجاح! 🚀');
                              if (res.data && res.data[0]) setBroadcasts(prev => [res.data[0], ...prev]);
                            } catch (err: any) {
                              toast.error(err?.message || 'حدث خطأ أثناء إعادة الإرسال');
                            } finally {
                              setSending(false);
                            }
                          }
                        }}
                        className="flex-1 sm:flex-initial px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-emerald-500/20"
                        title="إعادة إرسال الإشعار فوراً"
                      >
                        <Send size={14} />
                        <span>إعادة إرسال 🚀</span>
                      </button>
                    </div>
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

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-zinc-800/60 text-gray-400 text-xs">
                <tr>
                  <th className="p-3 font-bold">اسم العميل / الجوال</th>
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
                      <td className="p-3 font-bold text-white">
                        {cust.name ? (
                          <div>
                            <p className="text-amber-400 text-sm font-black">{cust.name}</p>
                            <p className="text-xs font-mono text-gray-400 dir-ltr text-right">{cust.phone}</p>
                          </div>
                        ) : (
                          <p className="font-mono text-white dir-ltr text-right">{cust.phone}</p>
                        )}
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
                          href={formatWhatsAppLink(cust.phone, cust.name, cust.badge)}
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
