import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LayoutDashboard, KeyRound, ShoppingBag, Settings as SettingsIcon,
    UtensilsCrossed, LogOut, Loader2, Plus, Edit2, Trash2, CheckCircle2,
    X, Store, Clock, RefreshCw, Upload, TicketPercent, Image as ImageIcon,
    Camera, Sliders, Volume2, VolumeX, Copy, Search, User, BarChart3, Send, Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { AdminAnalyticsView } from '../components/AdminAnalyticsView';
import { AdminMarketingView } from '../components/AdminMarketingView';
import { CategoryAdminManager } from '../components/CategoryAdminManager';
import { normalizeCouponCode } from '../utils/couponUtils';

export const AdminPage: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'menu' | 'categories' | 'additions' | 'stories' | 'coupons' | 'marketing' | 'settings'>('analytics');

    useEffect(() => {
        if (localStorage.getItem('jamr_admin_auth') === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        try {
            const { data, error } = await supabase
                .from('branch_credentials')
                .select('password')
                .eq('branch_name', 'admin')
                .single();

            // If the admin user doesn't exist yet, we can fallback to the hardcoded env or test
            if (error || !data || data.password !== password) {
                // Fallback check just in case the database isn't updated yet
                if (password !== 'admin123') {
                    toast.error('كلمة المرور غير صحيحة');
                    setIsLoggingIn(false);
                    return;
                }
            }
            
            setIsAuthenticated(true);
            localStorage.setItem('jamr_admin_auth', 'true');
        } catch (err) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (!isAuthenticated) return (
        <div className="min-h-screen bg-charcoal flex items-center justify-center p-6 text-white text-right" dir="rtl">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm bg-zinc-900 rounded-[2rem] p-8 shadow-2xl border border-white/5 relative">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <KeyRound size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black">إدارة النظام</h1>
                        <p className="text-gray-500 text-sm mt-1">الرجاء إدخال كلمة المرور للمشرفين</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            placeholder="كلمة المرور"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-800 text-white rounded-xl p-4 text-center font-bold focus:ring-2 focus:ring-primary outline-none"
                        />
                        <button type="submit" disabled={isLoggingIn || !password} className="w-full bg-primary text-white font-black p-4 rounded-xl flex items-center justify-center gap-2">
                            {isLoggingIn ? <Loader2 className="animate-spin" /> : 'دخول'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="min-h-screen bg-charcoal text-white text-right select-none" dir="rtl">
            {/* Admin Header */}
            <div className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-white/5 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0">
                            <LayoutDashboard size={20} />
                        </div>
                        <div>
                            <h1 className="font-black text-base sm:text-xl text-white">لوحة الإدارة</h1>
                            <p className="text-[10px] text-gray-400 hidden sm:block">مطعم جمر التنور</p>
                        </div>
                    </div>
                    <button onClick={() => { localStorage.removeItem('jamr_admin_auth'); setIsAuthenticated(false); }} className="flex items-center gap-1.5 text-red-400 bg-red-500/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl hover:bg-red-500/20 font-bold text-xs sm:text-sm transition-colors cursor-pointer">
                        <LogOut size={16} /> <span className="hidden sm:inline">تسجيل خروج</span>
                    </button>
                </div>
                {/* Responsive Touch & Mouse Friendly Tabs */}
                <div 
                    onWheel={(e) => {
                        if (e.deltaY !== 0 && window.innerWidth < 1280) {
                            e.currentTarget.scrollLeft += e.deltaY;
                        }
                    }}
                    className="max-w-7xl mx-auto px-2 sm:px-4 flex gap-1.5 sm:gap-2 flex-nowrap lg:flex-wrap overflow-x-auto lg:overflow-visible no-scrollbar pb-3 pt-1 snap-x snap-mandatory touch-pan-x"
                >
                    {[
                        { id: 'analytics', label: 'الإحصائيات والتحليلات', icon: <BarChart3 size={16} /> },
                        { id: 'orders', label: 'الطلبات الحية', icon: <ShoppingBag size={16} /> },
                        { id: 'menu', label: 'لائحة الطعام', icon: <UtensilsCrossed size={16} /> },
                        { id: 'categories', label: 'إدارة الأقسام والعبارات', icon: <Layers size={16} /> },
                        { id: 'additions', label: 'تخصيص الوجبات', icon: <Sliders size={16} /> },
                        { id: 'stories', label: 'القصص والعروض', icon: <ImageIcon size={16} /> },
                        { id: 'coupons', label: 'كوبونات الخصم', icon: <TicketPercent size={16} /> },
                        { id: 'marketing', label: 'التسويق والإشعارات 📢', icon: <Send size={16} /> },
                        { id: 'settings', label: 'الفروع والإعدادات', icon: <SettingsIcon size={16} /> }
                    ].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)} 
                            className={cn(
                                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer snap-start shrink-0", 
                                activeTab === tab.id 
                                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                    : "bg-zinc-800/80 text-gray-400 hover:bg-zinc-700 hover:text-white"
                            )}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'analytics' && <AdminAnalyticsView />}
                {activeTab === 'orders' && <AdminOrdersView />}
                {activeTab === 'menu' && <AdminMenuView />}
                {activeTab === 'categories' && <CategoryAdminManager />}
                {activeTab === 'additions' && <AdminAdditionsView />}
                {activeTab === 'stories' && <AdminStoriesView />}
                {activeTab === 'coupons' && <AdminCouponsView />}
                {activeTab === 'marketing' && <AdminMarketingView />}
                {activeTab === 'settings' && <AdminSettingsView />}
            </main>
        </div>
    );
};

// --- Subviews ---

const playOrderChime = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
        gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.5);
        
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
        osc2.start(audioCtx.currentTime + 0.15);
        osc2.stop(audioCtx.currentTime + 0.65);
    } catch (e) {
        console.warn('AudioContext failed:', e);
    }
};

const AdminOrdersView = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => localStorage.getItem('admin_sound_alert') !== 'false');
    const [timeframe, setTimeframe] = useState<'today' | '7days' | '30days' | 'all'>('all');

    const [stats, setStats] = useState({
        todaySales: 0,
        todayOrdersCount: 0,
        todayDeliveryCount: 0,
        todayPickupCount: 0,
        swaydiSales: 0,
        twaiqSales: 0,
        outOfStockCount: 0,
        activeCoupons: 0,
        uniqueCustomers: 0,
        averageOrderValue: 0,
        swaydiOrders: 0,
        twaiqOrders: 0
    });

    const toggleSound = () => {
        const val = !isSoundEnabled;
        setIsSoundEnabled(val);
        localStorage.setItem('admin_sound_alert', String(val));
        toast.success(val ? '🔊 تم تفعيل جرس تنبيه الطلبات' : '🔇 تم كتم وبث طلبات معطل');
    };

    const fetchOrders = async () => {
        setLoading(true);
        // Use supabaseAdmin to bypass RLS and list all orders correctly
        const { data } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) setOrders(data);
        setLoading(false);
    };

    const fetchStats = async () => {
        try {
            let query = supabaseAdmin.from('orders').select('total_price, branch, order_type, status, created_at, phone');
            
            if (timeframe === 'today') {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                query = query.gte('created_at', today.toISOString());
            } else if (timeframe === '7days') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                query = query.gte('created_at', sevenDaysAgo.toISOString());
            } else if (timeframe === '30days') {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                query = query.gte('created_at', thirtyDaysAgo.toISOString());
            }

            const [ordersRes, productsRes, couponsRes] = await Promise.all([
                query,
                supabaseAdmin.from('products').select('id').eq('is_available', false),
                supabaseAdmin.from('coupons').select('id').eq('is_active', true)
            ]);
            
            let totalSales = 0;
            let ordersCount = 0;
            let deliveryCount = 0;
            let pickupCount = 0;
            let swaydiSales = 0;
            let twaiqSales = 0;
            let swaydiOrders = 0;
            let twaiqOrders = 0;
            const uniquePhones = new Set<string>();
            
            if (ordersRes.data) {
                const periodOrders = ordersRes.data;
                ordersCount = periodOrders.length;
                
                periodOrders.forEach(o => {
                    if (o.phone) {
                        uniquePhones.add(o.phone.trim());
                    }
                    if (o.status !== 'cancelled') {
                        const price = Number(o.total_price) || 0;
                        totalSales += price;
                        
                        if (o.branch === 'طويق') {
                            twaiqSales += price;
                            twaiqOrders++;
                        } else {
                            swaydiSales += price;
                            swaydiOrders++;
                        }
                    }
                    if (o.order_type === 'delivery') {
                        deliveryCount++;
                    } else {
                        pickupCount++;
                    }
                });
            }
            
            setStats({
                todaySales: totalSales,
                todayOrdersCount: ordersCount,
                todayDeliveryCount: deliveryCount,
                todayPickupCount: pickupCount,
                swaydiSales,
                twaiqSales,
                outOfStockCount: productsRes.data?.length || 0,
                activeCoupons: couponsRes.data?.length || 0,
                uniqueCustomers: uniquePhones.size,
                averageOrderValue: ordersCount > 0 ? (totalSales / (ordersCount || 1)) : 0,
                swaydiOrders,
                twaiqOrders
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchStats();

        const channel = supabase.channel('admin-orders-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                setOrders(prev => [payload.new, ...prev].slice(0, 50));
                if (isSoundEnabled) {
                    playOrderChime();
                }
                toast.success('🔔 وصل طلب جديد للوحة تحكم الأدمين!');
                fetchStats();
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isSoundEnabled, timeframe]);

    const totalSales = stats.swaydiSales + stats.twaiqSales || 1;
    const swaydiPct = (stats.swaydiSales / totalSales) * 100;
    const twaiqPct = (stats.twaiqSales / totalSales) * 100;

    const totalOrders = stats.todayOrdersCount || 1;
    const deliveryPct = (stats.todayDeliveryCount / totalOrders) * 100;
    const pickupPct = (stats.todayPickupCount / totalOrders) * 100;

    return (
        <div className="space-y-8 select-none">
            {/* أزرار الفلترة الزمنية للتحليل الإحصائي */}
            <div className="flex justify-between items-center bg-zinc-900 border border-white/5 p-5 rounded-3xl flex-wrap gap-3">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">لوحة تحليل المبيعات والإحصائيات</h3>
                    <p className="text-[10px] text-gray-500">يمكنك فلترة أرقام وحصص الفروع والعملاء ديناميكياً</p>
                </div>
                <div className="flex bg-zinc-800 p-1 rounded-2xl gap-1">
                    {[
                        { id: 'all', label: 'الكل (كل الأوقات)' },
                        { id: '30days', label: 'آخر 30 يوم' },
                        { id: '7days', label: 'آخر 7 أيام' },
                        { id: 'today', label: 'اليوم' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTimeframe(t.id as any)}
                            className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                timeframe === t.id ? "bg-primary text-white" : "text-gray-400 hover:text-white"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي المبيعات (ر.س)</p>
                        <h3 className="text-lg font-black text-white mt-1">{stats.todaySales.toFixed(2)} ر.س</h3>
                        <p className="text-[10px] text-gray-400 mt-1">حجم المعاملات غير الملغاة</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <ShoppingBag size={20} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">عدد الطلبات وسجل الحجوزات</p>
                        <h3 className="text-lg font-black text-white mt-1">{stats.todayOrdersCount} طلب</h3>
                        <p className="text-[10px] text-gray-400 mt-1">{stats.todayDeliveryCount} توصيل | {stats.todayPickupCount} استلام</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
                        <Store size={20} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي العملاء والمشترين</p>
                        <h3 className="text-lg font-black text-white mt-1">{stats.uniqueCustomers} عميل</h3>
                        <p className="text-[10px] text-gray-400 mt-1">أرقام هواتف مميزة وفريدة</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-450">
                        <User size={20} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">متوسط قيمة الطلب الواحد</p>
                        <h3 className="text-lg font-black text-white mt-1">{stats.averageOrderValue.toFixed(2)} ر.س</h3>
                        <p className="text-[10px] text-gray-405 mt-1">معدل سلة المشتريات المالي</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-550">
                        <TicketPercent size={20} />
                    </div>
                </div>
            </div>

            {/* تحليل فروع ومقارنة مبيعات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-gray-400">مقارنة فروع المطعم والانتشار المالي</h4>
                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex flex-row-reverse">
                        <div style={{ width: `${swaydiPct}%` }} className="h-full bg-primary" />
                        <div style={{ width: `${twaiqPct}%` }} className="h-full bg-indigo-500" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-primary">
                                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                                فرع السويدي الغربي: {swaydiPct.toFixed(0)}%
                            </span>
                            <span className="text-gray-300 font-mono">{stats.swaydiSales.toFixed(2)} ر.س ({stats.swaydiOrders} طلب)</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-indigo-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                                فرع طويق: {twaiqPct.toFixed(0)}%
                            </span>
                            <span className="text-gray-300 font-mono">{stats.twaiqSales.toFixed(2)} ر.s ({stats.twaiqOrders} طلب)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h4 className="font-bold text-xs text-gray-400">توزيع الطلبات حسب طريقة الاستلام</h4>
                    <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex flex-row-reverse">
                        <div style={{ width: `${deliveryPct}%` }} className="h-full bg-green-500" />
                        <div style={{ width: `${pickupPct}%` }} className="h-full bg-zinc-600" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-green-450">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                كلي توصيل: {deliveryPct.toFixed(0)}%
                            </span>
                            <span className="text-gray-300 font-mono">{stats.todayDeliveryCount} طلب</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="flex items-center gap-1.5 text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                                كلي استلام: {pickupPct.toFixed(0)}%
                            </span>
                            <span className="text-gray-300 font-mono">{stats.todayPickupCount} طلب</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        آخر الطلبات وخطوط التحضير
                        {loading && <Loader2 size={16} className="animate-spin text-primary" />}
                    </h2>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={toggleSound} 
                            className={cn(
                                "flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer",
                                isSoundEnabled 
                                    ? "bg-primary/10 text-primary border-primary/20" 
                                    : "bg-zinc-800 text-gray-450 border-transparent hover:bg-zinc-700"
                            )}
                        >
                            {isSoundEnabled ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
                            {isSoundEnabled ? "صوت التنبيه: نشط" : "صوت التنبيه: صامت"}
                        </button>
                        
                        <button onClick={fetchOrders} className="p-2 bg-zinc-805 rounded-xl hover:bg-zinc-700 text-gray-455 mr-auto cursor-pointer"><RefreshCw size={16} /></button>
                    </div>
                </div>

                {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                    <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 overflow-x-auto">
                        <table className="w-full text-xs text-right">
                            <thead className="bg-zinc-80/50 text-gray-400 border-b border-white/5">
                                <tr>
                                    <th className="p-4 font-bold">العميل</th>
                                    <th className="p-4 font-bold">الفرع</th>
                                    <th className="p-4 font-bold">النوع</th>
                                    <th className="p-4 font-bold">المبلغ</th>
                                    <th className="p-4 font-bold">الحالة</th>
                                    <th className="p-4 font-bold">الوقت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.map(order => {
                                    const isExpanded = selectedOrderId === order.id;
                                    return (
                                        <React.Fragment key={order.id}>
                                            <tr 
                                                onClick={() => setSelectedOrderId(isExpanded ? null : order.id)} 
                                                className={cn(
                                                    "hover:bg-white/[0.02] cursor-pointer transition-colors",
                                                    isExpanded && "bg-white/[0.01]"
                                                )}
                                            >
                                                <td className="p-4">
                                                    <span className="font-bold text-white block">{order.customer_name}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono">{order.phone}</span>
                                                </td>
                                                <td className="p-4">{order.branch}</td>
                                                <td className="p-4">
                                                    {order.order_type === 'delivery' ? (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400">🛵 توصيل</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400">🚶 استلام</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-primary font-bold">{order.total_price} ر.س</td>
                                                <td className="p-4">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded text-[9px] font-bold",
                                                        order.status === 'new' && "bg-blue-500/10 text-blue-400",
                                                        order.status === 'accepted' && "bg-indigo-500/10 text-indigo-400",
                                                        order.status === 'preparing' && "bg-yellow-500/10 text-yellow-400 animate-pulse",
                                                        order.status === 'ready' && "bg-green-500/10 text-green-400",
                                                        order.status === 'completed' && "bg-zinc-800 text-gray-400",
                                                        order.status === 'cancelled' && "bg-red-500/10 text-red-400"
                                                    )}>
                                                        {order.status === 'new' && 'جديد'}
                                                        {order.status === 'accepted' && 'مقبول'}
                                                        {order.status === 'preparing' && 'قيد التحضير'}
                                                        {order.status === 'ready' && 'جاهز للتسليم'}
                                                        {order.status === 'completed' && 'مكتمل'}
                                                        {order.status === 'cancelled' && 'ملغي'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 text-xs font-mono">{new Date(order.created_at).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-black/20 border-y border-white/5">
                                                    <td colSpan={6} className="p-5 text-right">
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <h4 className="font-bold text-xs text-primary mb-3">محتويات وعناصر الطلب:</h4>
                                                                    <ul className="space-y-2">
                                                                        {order.items?.map((item: any, idx: number) => (
                                                                            <li key={idx} className="bg-zinc-900 p-3 rounded-xl border border-white/5 space-y-1">
                                                                                <div className="flex justify-between items-center text-xs font-bold">
                                                                                    <span>{item.name} x {item.quantity}</span>
                                                                                    <span className="text-primary">{item.totalPrice} ر.س</span>
                                                                                </div>
                                                                                {(item.options?.length > 0 || item.removedIngredients?.length > 0 || item.notes) && (
                                                                                    <div className="text-[10px] text-gray-400 space-y-1 pt-1.5 border-t border-white/5">
                                                                                        {item.options?.map((opt: any, oIdx: number) => (
                                                                                            <div key={oIdx} className="flex justify-between">
                                                                                                <span>• {opt.groupName}: <span className="text-white font-bold">{opt.itemName}</span></span>
                                                                                                {opt.price > 0 && <span className="text-gray-500">+{opt.price} ر.س</span>}
                                                                                            </div>
                                                                                        ))}
                                                                                        {item.removedIngredients?.map((ing: any, iIdx: number) => (
                                                                                            <div key={iIdx} className="text-red-400 font-bold">• بدون: {ing.name_ar || ing}</div>
                                                                                        ))}
                                                                                        {item.notes && <div className="text-yellow-450">• ملاحظة: {item.notes}</div>}
                                                                                    </div>
                                                                                )}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                                <div className="space-y-3">
                                                                    <h4 className="font-bold text-xs text-primary mb-2">تفاصيل الاستلام والرموز والتعليقات:</h4>
                                                                    <p className="text-xs"><span className="text-gray-400">فرع التحضير:</span> <span className="font-bold">{order.branch}</span></p>
                                                                    <p className="text-xs"><span className="text-gray-400">طريقة الاستلام:</span> <span className="font-bold">{order.order_type === 'delivery' ? '🚗 توصيل للموقع' : '🚶 استلام مباشر'}</span></p>
                                                                    {order.location && (
                                                                        <p className="text-xs"><span className="text-gray-405">العنوان:</span> <span className="font-bold text-blue-450 break-all">{order.location}</span></p>
                                                                    )}
                                                                    {order.notes && (
                                                                        <p className="text-xs"><span className="text-gray-400">ملاحظات الطلب:</span> <span className="text-yellow-405 bg-yellow-400/5 px-2 py-0.5 rounded inline-block font-bold">{order.notes}</span></p>
                                                                    )}
                                                                    {order.promo_code && (
                                                                        <p className="text-xs"><span className="text-gray-400 font-bold">كوبون خصم:</span> <span className="font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded font-bold">{order.promo_code} (وفّر: {order.discount_amount} ر.س)</span></p>
                                                                    )}
                                                                    
                                                                    <div className="pt-2 border-t border-white/5 space-y-2">
                                                                        <span className="text-[10px] text-gray-500 block">تحديث حالة الطلب فورياً:</span>
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {[
                                                                                { status: 'new', label: 'جديد', color: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
                                                                                { status: 'accepted', label: 'مقبول', color: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' },
                                                                                { status: 'preparing', label: 'قيد التحضير', color: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold animate-pulse' },
                                                                                { status: 'ready', label: 'جاهز 🛵', color: 'bg-green-500/20 text-green-400 border border-green-500/30 font-bold' },
                                                                                { status: 'completed', label: 'مكتمل ✅', color: 'bg-zinc-800 text-gray-300 border border-zinc-700' },
                                                                                { status: 'cancelled', label: 'ملغي ❌', color: 'bg-red-500/20 text-red-400 border border-red-500/30' },
                                                                            ].map(s => (
                                                                                <button 
                                                                                    key={s.status} 
                                                                                    onClick={async (e) => {
                                                                                        e.stopPropagation();
                                                                                        const { error } = await supabaseAdmin.from('orders').update({ status: s.status }).eq('id', order.id);
                                                                                        if (error) {
                                                                                            toast.error('فشل تحديث الحالة');
                                                                                        } else {
                                                                                            toast.success(`تم تحديث حالة الطلب إلى: ${s.label}`);
                                                                                            setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: s.status } : o));
                                                                                            fetchStats();
                                                                                        }
                                                                                    }}
                                                                                    className={cn(
                                                                                        "px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer",
                                                                                        order.status === s.status ? "brightness-125 ring-2 ring-primary/40 bg-primary text-white border-transparent" : s.color
                                                                                    )}
                                                                                >
                                                                                    {s.label}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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

const AdminMenuView = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [quickUploadingId, setQuickUploadingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name_ar: '',
        price: '',
        original_price: '',
        is_offer: false,
        description_ar: '',
        category_id: '',
        image_url: '',
        is_available: true,
        is_hidden: false,
        calories: ''
    });

    const [optionGroups, setOptionGroups] = useState<any[]>([]);
    const [optionItems, setOptionItems] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
            supabase.from('products').select('*').order('category_id').order('name_ar'),
            supabase.from('categories').select('*').order('sort_order')
        ]);
        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) {
            setCategories(catRes.data);
            if (!formData.category_id && catRes.data.length > 0) {
                setFormData(prev => ({ ...prev, category_id: catRes.data[0].id }));
            }
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = async (product?: any) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name_ar: product.name_ar,
                price: product.price?.toString() || '0',
                original_price: product.original_price?.toString() || '',
                is_offer: product.is_offer ?? false,
                description_ar: product.description_ar || '',
                category_id: product.category_id,
                image_url: product.image_url || '',
                is_available: product.is_available ?? true,
                is_hidden: product.is_hidden ?? false,
                calories: product.calories?.toString() || ''
            });
            // Fetch product options
            const { data: groupsData } = await supabase.from('option_groups').select('*').eq('product_id', product.id).order('name_ar');
            const { data: itemsData } = await supabase.from('option_items').select('*');
            if (groupsData) setOptionGroups(groupsData);
            if (itemsData) setOptionItems(itemsData);
        } else {
            setEditingProduct(null);
            setFormData({
                name_ar: '',
                price: '',
                original_price: '',
                is_offer: false,
                description_ar: '',
                category_id: categories.length > 0 ? categories[0].id : '',
                image_url: '',
                is_available: true,
                is_hidden: false,
                calories: ''
            });
            setOptionGroups([]);
            setOptionItems([]);
        }
        setIsModalOpen(true);
    };

    // --- Option Groups Management ---
    const handleAddOptionGroup = async () => {
        const payload = { product_id: editingProduct.id, name_ar: 'مجموعة جديدة', name_en: 'New Group', min_selection: 0, max_selection: 1 };
        const { data, error } = await supabaseAdmin.from('option_groups').insert([payload]).select().single();
        if (data) setOptionGroups(prev => [...prev, data]);
        else if (error) toast.error('تعذر إضافة مجموعة جديدة');
    };
    
    const handleUpdateGroup = (id: string, field: string, val: any) => {
        setOptionGroups(prev => prev.map(g => g.id === id ? { ...g, [field]: val } : g));
    };

    const saveGroup = async (id: string) => {
        const group = optionGroups.find(g => g.id === id);
        if (group) await supabaseAdmin.from('option_groups').update({ 
            name_ar: group.name_ar, 
            name_en: group.name_ar, // Ensure both are updated
            max_selection: group.max_selection 
        }).eq('id', id);
        toast.success('تم حفظ المجموعة');
    };

    const deleteGroup = async (id: string) => {
        if (!window.confirm('موافق للحديث؟')) return;
        setOptionGroups(prev => prev.filter(g => g.id !== id));
        await supabaseAdmin.from('option_groups').delete().eq('id', id);
    };

    const handleAddItem = async (groupId: string) => {
        const payload = { group_id: groupId, name_ar: 'خيار جديد', name_en: 'New Item', price: 0, calories: 0, is_available: true };
        const { data } = await supabaseAdmin.from('option_items').insert([payload]).select().single();
        if (data) setOptionItems(prev => [...prev, data]);
    };

    const handleUpdateItem = (id: string, field: string, val: any) => {
        setOptionItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));
    };

    const saveItem = async (id: string) => {
        const item = optionItems.find(i => i.id === id);
        if (item) {
            const cleanPrice = parseFloat(item.price.toString()) || 0;
            const cleanCalories = parseInt(item.calories?.toString() || '0') || 0;
            const { error } = await supabaseAdmin.from('option_items').update({ 
                name_ar: item.name_ar, 
                name_en: item.name_ar,
                price: cleanPrice,
                calories: cleanCalories
            }).eq('id', id);
            if (error) toast.error('خطأ في حفظ البيانات');
            else toast.success('تم حفظ التعديل');
        }
    };

    const deleteItem = async (id: string) => {
        setOptionItems(prev => prev.filter(i => i.id !== id));
        await supabaseAdmin.from('option_items').delete().eq('id', id);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
            toast.success('تم رفع الصورة بنجاح');
        } catch (error) {
            toast.error('حدث خطأ أثناء رفع الصورة');
        } finally {
            setIsUploading(false);
        }
    };

    const handleQuickImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setQuickUploadingId(productId);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `quick_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            const { error: updateError } = await supabaseAdmin
                .from('products')
                .update({ image_url: publicUrl })
                .eq('id', productId);

            if (updateError) throw updateError;

            toast.success('تم تحديث الصورة فوراً');
            fetchData();
        } catch (error) {
            console.error('Quick Upload Error:', error);
            toast.error('لم نتمكن من تحديث الصورة');
        } finally {
            setQuickUploadingId(null);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name_ar || !formData.price || !formData.category_id) {
            toast.error('الرجاء تعبئة بعض الحقول الإجبارية (الاسم، السعر، القسم)');
            return;
        }

        setIsSaving(true);
        const payload = {
            name_ar: formData.name_ar,
            name_en: formData.name_ar, // Optional fallback
            price: parseFloat(formData.price) || 0,
            original_price: formData.original_price ? parseFloat(formData.original_price) : null,
            is_offer: formData.is_offer,
            description_ar: formData.description_ar,
            description_en: formData.description_ar,
            category_id: formData.category_id,
            image_url: formData.image_url,
            is_available: formData.is_available,
            is_hidden: formData.is_hidden,
            calories: parseInt(formData.calories) || null
        };

        try {
            if (editingProduct) {
                const { error } = await supabaseAdmin.from('products').update(payload).eq('id', editingProduct.id);
                if (error) throw error;
                toast.success('تم التعديل بنجاح');
            } else {
                const { error } = await supabaseAdmin.from('products').insert([payload]);
                if (error) throw error;
                toast.success('تمت الإضافة بنجاح');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الصنف نهائياً؟ لا يمكن التراجع عن هذه الخطوة.')) return;
        try {
            const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
            if (error) throw error;
            toast.success('تم الحذف بنجاح');
            fetchData();
        } catch (error) {
            toast.error('تعذر الحذف، قد يكون الصنف مرتبطاً بطلبات سابقة.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">إدارة الأصناف الشاملة</h2>
                <div className="flex gap-2">
                    <button onClick={fetchData} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-gray-400"><RefreshCw size={18} /></button>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                        <Plus size={18} /> إضافة صنف
                    </button>
                </div>
            </div>

            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
                        <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:border-white/10 relative group">
                            <div className="flex gap-3">
                                <div className="relative shrink-0">
                                    <img src={p.image_url || '/placeholder.png'} className={cn("w-20 h-20 rounded-xl object-cover bg-zinc-800", quickUploadingId === p.id && "opacity-50 blur-[2px]")} />
                                    {quickUploadingId === p.id ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 size={24} className="animate-spin text-primary" />
                                        </div>
                                    ) : (
                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl cursor-pointer">
                                            <Camera size={24} className="text-white" />
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleQuickImageUpload(e, p.id)} />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold flex items-center justify-between">
                                        {p.name_ar}
                                        <div className="flex items-center gap-1">
                                            {p.is_hidden && <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">مخفي (للعروض)</span>}
                                            {!p.is_available && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">نَفَد</span>}
                                        </div>
                                    </h3>
                                    <p className="text-primary font-bold text-sm mt-1">{p.price} ر.س</p>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description_ar}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                                <button onClick={() => handleOpenModal(p)} className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-colors"><Edit2 size={12}/> تعديل</button>
                                <button onClick={() => handleDelete(p.id)} className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"><Trash2 size={12}/> حذف</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 rounded-3xl p-6 w-full max-w-lg relative z-10 border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className="text-xl font-black">{editingProduct ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400">اسم الصنف <span className="text-red-500">*</span></label>
                                    <input required type="text" value={formData.name_ar} onChange={e => setFormData({...formData, name_ar: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none" />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">سعر البيع (ر.س) <span className="text-red-500">*</span></label>
                                        <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-amber-400">قبل الخصم (اختياري)</label>
                                        <input type="number" step="0.01" value={formData.original_price} onChange={e => setFormData({...formData, original_price: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-amber-500/50 outline-none" placeholder="مثال: 50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">القسم <span className="text-red-500">*</span></label>
                                        <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none appearance-none cursor-pointer">
                                            <option value="offers_weekly">🏷️ قسم العروض الأسبوعية</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">الوصف / مكونات العرض (اختياري)</label>
                                        <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none h-20 resize-none" placeholder="مثال: 2 بيتزا + عصير مجاني" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">السعرات الحرارية (اختياري)</label>
                                        <div className="relative">
                                            <input type="number" value={formData.calories} onChange={e => setFormData({...formData, calories: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none pr-12" placeholder="مثال: 450" />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-bold">سعرة</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400 flex items-center justify-between">
                                        <span>صورة الصنف / العرض</span>
                                        {isUploading && <Loader2 size={14} className="animate-spin text-primary" />}
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" className="w-16 h-16 rounded-xl object-cover bg-zinc-800 shrink-0 border border-white/10" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-zinc-800 border-2 border-dashed border-white/10 flex items-center justify-center shrink-0">
                                                <UtensilsCrossed size={20} className="text-gray-500" />
                                            </div>
                                        )}
                                        <label className="flex-1 border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors h-16 rounded-xl flex items-center justify-center cursor-pointer bg-zinc-800/50 group">
                                            <span className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors flex items-center gap-2">
                                                <Upload size={16} /> رفع صورة جديدة
                                            </span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors mt-2">
                                    <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border", formData.is_available ? "bg-primary border-primary" : "bg-zinc-900 border-white/20")}>
                                        {formData.is_available && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <span className="text-sm font-bold flex-1">الصنف متوفر لطلبات العملاء</span>
                                    <input type="checkbox" className="hidden" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} />
                                </label>

                                <label className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl cursor-pointer hover:bg-purple-500/20 transition-colors mt-2">
                                    <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border", formData.is_hidden ? "bg-purple-500 border-purple-500" : "bg-zinc-900 border-white/20")}>
                                        {formData.is_hidden && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <span className="text-sm font-bold text-purple-300 flex-1">إخفاء من المنيو الأساسي (يُستخدم للقصص والعروض فقط)</span>
                                    <input type="checkbox" className="hidden" checked={formData.is_hidden} onChange={e => setFormData({...formData, is_hidden: e.target.checked})} />
                                </label>

                                {editingProduct ? (
                                    <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-bold text-lg">خيارات الصنف</h4>
                                                <p className="text-xs text-gray-500">مثل: الحجم (كبير، وسط) أو إضافات (دجاج، جبن)</p>
                                            </div>
                                            <button type="button" onClick={handleAddOptionGroup} className="text-xs bg-zinc-800 text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-primary transition-colors"><Plus size={14}/> إضافة مجموعة</button>
                                        </div>
                                        
                                        {optionGroups.map(group => (
                                            <div key={group.id} className="bg-zinc-800/30 p-4 rounded-xl space-y-3 border border-white/5">
                                                <div className="flex gap-2 items-center relative">
                                                    <input type="text" value={group.name_ar} onChange={e => handleUpdateGroup(group.id, 'name_ar', e.target.value)} onBlur={() => saveGroup(group.id)} className="flex-1 bg-zinc-900/50 text-white rounded-lg px-3 py-2 text-sm border-none outline-none focus:ring-1 focus:ring-primary font-bold" placeholder="اسم الخيار (مثال: الحجم)" />
                                                    <select value={group.max_selection} onChange={e => { handleUpdateGroup(group.id, 'max_selection', parseInt(e.target.value)); saveGroup(group.id); }} className="w-28 bg-zinc-900/50 text-white rounded-lg px-2 py-2 text-sm border-none outline-none focus:ring-1 focus:ring-primary">
                                                        <option value={1}>اختيار 1 فقط</option>
                                                        <option value={10}>اختيار متعدد</option>
                                                    </select>
                                                    <button type="button" onClick={() => deleteGroup(group.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                                </div>

                                                <div className="mr-8 space-y-2 relative before:absolute before:right-[-16px] before:top-0 before:bottom-0 before:w-px before:bg-white/10">
                                                    {optionItems.filter(i => i.group_id === group.id).map(item => (
                                                        <div key={item.id} className="flex gap-2 items-center relative before:absolute before:right-[-16px] before:top-1/2 before:w-4 before:h-px before:bg-white/10">
                                                            <input type="text" value={item.name_ar} onChange={e => handleUpdateItem(item.id, 'name_ar', e.target.value)} onBlur={() => saveItem(item.id)} className="flex-1 bg-zinc-800 text-white rounded-lg px-3 py-1.5 text-sm border-none outline-none focus:ring-1 focus:ring-primary" placeholder="مثال: كبير" />
                                                            <div className="relative shrink-0">
                                                                <input type="number" step="1" value={item.calories || ''} onChange={e => handleUpdateItem(item.id, 'calories', e.target.value)} onBlur={() => saveItem(item.id)} className="w-16 bg-zinc-800 text-white rounded-lg pl-2 pr-2 py-1.5 text-[10px] border-none outline-none focus:ring-1 focus:ring-primary text-center" placeholder="سعرة" />
                                                            </div>
                                                            <div className="relative shrink-0">
                                                                <input type="number" step="0.01" value={item.price} onChange={e => handleUpdateItem(item.id, 'price', e.target.value)} onBlur={() => saveItem(item.id)} className="w-16 bg-zinc-800 text-white rounded-lg pl-2 pr-7 py-1.5 text-[10px] border-none outline-none focus:ring-1 focus:ring-primary text-left" placeholder="0" />
                                                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-gray-500">ر.س</span>
                                                            </div>
                                                            <button type="button" onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><X size={14}/></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => handleAddItem(group.id)} className="text-xs text-primary font-bold flex items-center gap-1 py-1 px-2 hover:bg-primary/10 rounded overflow-hidden mt-1 transition-colors"><Plus size={12}/> إضافة خيار فرعي</button>
                                                </div>
                                            </div>
                                        ))}
                                        {optionGroups.length === 0 && <p className="text-sm text-gray-500 text-center py-4 bg-zinc-800/30 rounded-xl">لا توجد خيارات إضافية لهذا الصنف</p>}
                                    </div>
                                ) : (
                                    <p className="text-xs text-center text-gray-500 pt-4 mt-2 border-t border-white/5">أضف الصنف أولاً للتمكن من تخصيص (الخيارات والإضافات).</p>
                                )}

                                <div className="pt-4 mt-4 border-t border-white/5 flex gap-3">
                                    <button type="submit" disabled={isSaving || isUploading} className="flex-1 bg-primary text-white font-black py-3.5 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors">
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : editingProduct ? 'تحديث الصنف' : 'حفظ الصنف الجديد'}
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 bg-zinc-800 text-white font-bold py-3.5 rounded-xl hover:bg-zinc-700 transition-colors">
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AdminSettingsView = () => {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // App settings state
    const [appSettings, setAppSettings] = useState({
        announcement_text: '',
        announcement_active: false,
        social_instagram: '',
        social_snapchat: '',
        social_tiktok: '',
        social_twitter: '',
        social_whatsapp: '',
        logo_url: '',
        working_hours: ''
    });
    const [isSavingApp, setIsSavingApp] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        const [branchesRes, appRes] = await Promise.all([
            supabase.from('branch_credentials').select('*'),
            supabase.from('app_settings').select('*').eq('id', 1).single()
        ]);
        
        if (branchesRes.data) setBranches(branchesRes.data.filter(b => b.branch_name !== 'admin'));
        if (appRes.data) {
            setAppSettings({
                announcement_text: appRes.data.announcement_text || '',
                announcement_active: appRes.data.announcement_active || false,
                social_instagram: appRes.data.social_instagram || '',
                social_snapchat: appRes.data.social_snapchat || '',
                social_tiktok: appRes.data.social_tiktok || '',
                social_twitter: appRes.data.social_twitter || '',
                social_whatsapp: appRes.data.social_whatsapp || '',
                logo_url: appRes.data.logo_url || '',
                working_hours: appRes.data.working_hours || ''
            });
        }
        setLoading(false);
    };

    const handlePasswordChange = async (branchName: string, newPassword: string) => {
        if (!newPassword) return;
        try {
            const { error } = await supabaseAdmin.from('branch_credentials').update({ password: newPassword }).eq('branch_name', branchName);
            if (error) throw error;
            toast.success(`تم تحديث كلمة مرور ${branchName} بنجاح`);
            fetchSettings();
        } catch {
            toast.error('حدث خطأ أثناء التحديث');
        }
    };
    
    const handleSaveAppSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingApp(true);
        try {
            const { error } = await supabaseAdmin.from('app_settings').update(appSettings).eq('id', 1);
            if (error) throw error;
            toast.success('تم حفظ الإعدادات العامة بنجاح');
        } catch (err) {
            toast.error('حدث خطأ أثناء حفظ الإعدادات');
        } finally {
            setIsSavingApp(false);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingLogo(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `logo_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
            const newSettings = { ...appSettings, logo_url: publicUrl };
            setAppSettings(newSettings);
            const { error } = await supabaseAdmin.from('app_settings').update({ logo_url: publicUrl }).eq('id', 1);
            if (error) throw error;
            toast.success('تم تحديث اللوجو بنجاح لجميع المستخدمين فوراً');
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ أثناء رفع اللوجو');
        } finally {
            setIsUploadingLogo(false);
        }
    };
    
    useEffect(() => { fetchSettings(); }, []);

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-bold">الإعدادات الشاملة</h2>
            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                <>
                {/* Global App Settings Section */}
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-black mb-6 text-primary flex items-center gap-2">🌐 إعدادات التطبيق العامة (تظهر لجميع الفروع)</h3>
                    <form onSubmit={handleSaveAppSettings} className="space-y-6">
                        
                        {/* Announcement Settings */}
                        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-zinc-800/30">
                            <h4 className="font-bold flex items-center justify-between">
                                شريط الإعلانات (يظهر أعلى المنيو)
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={appSettings.announcement_active} onChange={e => setAppSettings({...appSettings, announcement_active: e.target.checked})} />
                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    <span className="mr-3 text-sm font-bold text-gray-400">تفعيل الإعلان</span>
                                </label>
                            </h4>
                            <div className="space-y-1.5">
                                <input type="text" placeholder="اكتب نص الإعلان هنا (مثال: خصم 20% بمناسبة الافتتاح استخدم كود WELCOME)" value={appSettings.announcement_text} onChange={e => setAppSettings({...appSettings, announcement_text: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none text-sm" />
                            </div>
                        </div>

                        {/* Logo Upload */}
                        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-zinc-800/30">
                            <h4 className="font-bold flex items-center gap-2">
                                <ImageIcon size={16} className="text-primary" /> شعار المتجر (اللوجو)
                            </h4>
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                                    {appSettings.logo_url ? (
                                        <img src={appSettings.logo_url} alt="لوجو المتجر" className="w-full h-full object-contain" />
                                    ) : (
                                        <img src="/assets/logo.png" alt="لوجو المتجر" className="w-full h-full object-contain" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/10 hover:border-primary/50 rounded-xl cursor-pointer bg-zinc-900/50 group transition-colors">
                                        {isUploadingLogo ? (
                                            <div className="flex items-center gap-2 text-primary">
                                                <Loader2 size={18} className="animate-spin" />
                                                <span className="text-sm font-bold">جاري الرفع...</span>
                                            </div>
                                        ) : (
                                            <span className="flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-primary transition-colors">
                                                <Upload size={16} /> رفع لوجو جديد
                                            </span>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                                    </label>
                                    <p className="text-[10px] text-gray-500 mt-1.5">يتحدث اللوجو فوراً لجميع الزوار. المقاس المثالي: 512×512 بكسل بدون هوامش.</p>
                                </div>
                            </div>
                        </div>

                        {/* Working Hours */}
                        <div className="space-y-3 p-4 border border-white/10 rounded-xl bg-zinc-800/30">
                            <h4 className="font-bold flex items-center gap-2">
                                <Clock size={16} className="text-primary" /> أوقات الدوام (تظهر في الإعلان العلوي)
                            </h4>
                            <textarea
                                placeholder="مثال: نفتح ٦ مساءً - ١٢ منتصف الليل | السبت: مغلق"
                                value={appSettings.working_hours}
                                onChange={e => setAppSettings({...appSettings, working_hours: e.target.value})}
                                className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none text-sm resize-none h-16"
                            />
                            <p className="text-[10px] text-gray-500">يمكنك كتابة أوقات الدوام هنا ليتم عرضها في شريط الإعلان إذا كان مفعلاً.</p>
                        </div>


                        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-zinc-800/30">
                            <h4 className="font-bold">حسابات التواصل الاجتماعي (تظهر أسفل المنيو)</h4>
                            <p className="text-xs text-gray-500">اترك الحقل فارغاً إذا كنت لا ترغب بعرضه</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">واتساب الدعم (بدون فواصل، مثال: 966500000000)</label>
                                    <input type="text" placeholder="9665..." value={appSettings.social_whatsapp} onChange={e => setAppSettings({...appSettings, social_whatsapp: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm focus:border-primary/50 outline-none border border-transparent" dir="ltr" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">رابط انستجرام</label>
                                    <input type="text" placeholder="https://instagram.com/..." value={appSettings.social_instagram} onChange={e => setAppSettings({...appSettings, social_instagram: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm focus:border-primary/50 outline-none border border-transparent" dir="ltr" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">رابط تيك توك</label>
                                    <input type="text" placeholder="https://tiktok.com/@..." value={appSettings.social_tiktok} onChange={e => setAppSettings({...appSettings, social_tiktok: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm focus:border-primary/50 outline-none border border-transparent" dir="ltr" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">رابط سناب شات</label>
                                    <input type="text" placeholder="https://snapchat.com/add/..." value={appSettings.social_snapchat} onChange={e => setAppSettings({...appSettings, social_snapchat: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm focus:border-primary/50 outline-none border border-transparent" dir="ltr" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-400">رابط إكس (تويتر)</label>
                                    <input type="text" placeholder="https://twitter.com/..." value={appSettings.social_twitter} onChange={e => setAppSettings({...appSettings, social_twitter: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 text-sm focus:border-primary/50 outline-none border border-transparent" dir="ltr" />
                                </div>
                            </div>
                        </div>

                        <button type="submit" disabled={isSavingApp} className="w-full bg-primary text-white font-black py-4 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors">
                            {isSavingApp ? <Loader2 size={18} className="animate-spin" /> : 'حفظ الإعدادات العامة'}
                        </button>
                    </form>
                </div>

                {/* Branches Settings */}
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Store className="text-gray-400"/> إعدادات الفروع وحسابات الكاشير</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {branches.map(b => (
                            <div key={b.branch_name} className="bg-zinc-800/50 border border-white/5 rounded-xl p-5 space-y-4">
                                <h4 className="text-base font-bold flex items-center gap-2">{b.branch_name}</h4>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-400">كلمة مرور لكاشير الفرع:</p>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            defaultValue={b.password} 
                                            onBlur={(e) => {
                                                if (e.target.value !== b.password) {
                                                    handlePasswordChange(b.branch_name, e.target.value);
                                                }
                                            }}
                                            className="flex-1 bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm font-mono border border-transparent focus:border-primary outline-none transition-colors" 
                                        />
                                        <div className="text-[10px] text-gray-500 self-center">تعديل مباشر</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

// --- Coupons View ---
const AdminCouponsView = () => {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        max_uses: '',
        min_order_value: '',
        is_active: true
    });

    const fetchCoupons = async () => {
        setLoading(true);
        const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (data) setCoupons(data);
        setLoading(false);
    };

    useEffect(() => { fetchCoupons(); }, []);

    const handleOpenModal = () => {
        setFormData({
            code: '',
            discount_type: 'percentage',
            discount_value: '',
            max_uses: '',
            min_order_value: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const rawCode = formData.code.trim();
            if (!rawCode) {
                toast.error('الرجاء إدخال كود خصم صحيح');
                setIsSaving(false);
                return;
            }

            const payload = {
                code: rawCode,
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
                min_order_value: formData.min_order_value ? parseFloat(formData.min_order_value) : 0,
                is_active: formData.is_active
            };
            
            const { error } = await supabaseAdmin.from('coupons').insert([payload]);
            if (error) throw error;
            
            toast.success('تمت إضافة الكوبون بنجاح');
            setIsModalOpen(false);
            fetchCoupons();
        } catch (error: any) {
            toast.error(error.code === '23505' ? 'هذا الكود متوفر مسبقاً' : 'حدث خطأ أثناء حفظ الكوبون');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
        try {
            const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id);
            if (error) throw error;
            toast.success('تم الحذف بنجاح');
            fetchCoupons();
        } catch {
            toast.error('حدث خطأ');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await supabaseAdmin.from('coupons').update({ is_active: !currentStatus }).eq('id', id);
            fetchCoupons();
        } catch {}
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">إدارة الكوبونات والخصومات</h2>
                <div className="flex gap-2">
                    <button onClick={fetchCoupons} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-gray-400"><RefreshCw size={18} /></button>
                    <button onClick={handleOpenModal} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                        <Plus size={18} /> كوبون جديد
                    </button>
                </div>
            </div>

            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-zinc-800/50 text-gray-400">
                            <tr>
                                <th className="p-4 font-bold">الكود</th>
                                <th className="p-4 font-bold">الخصم</th>
                                <th className="p-4 font-bold">الاستخدامات</th>
                                <th className="p-4 font-bold">الحد الأدنى</th>
                                <th className="p-4 font-bold">الحالة</th>
                                <th className="p-4 font-bold text-center">إجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {coupons.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">لا توجد كوبونات، أضف أول كوبون</td></tr>
                            ) : coupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-white/[0.02]">
                                    <td className="p-4"><span className="font-mono font-black text-white bg-zinc-800 px-3 py-1 rounded-lg tracking-widest">{coupon.code}</span></td>
                                    <td className="p-4 text-primary font-bold">{coupon.discount_value}{coupon.discount_type === 'percentage' ? '%' : ' ر.س'}</td>
                                    <td className="p-4 text-gray-400">
                                        <span className="text-white font-bold">{coupon.current_uses}</span> 
                                        {coupon.max_uses ? ` / ${coupon.max_uses}` : ' (غير محدود)'}
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        {coupon.min_order_value ? `${coupon.min_order_value} ر.س` : 'لا يوجد'}
                                    </td>
                                    <td className="p-4">
                                        <button onClick={() => toggleStatus(coupon.id, coupon.is_active)} className={cn("px-3 py-1 rounded-lg text-xs font-bold transition-colors", coupon.is_active ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700")}>
                                            {coupon.is_active ? "مفعل" : "معطل"}
                                        </button>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDelete(coupon.id)} className="p-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg inline-flex"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm relative z-10 border border-white/10 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black">إضافة كوبون جديد</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400">كود الخصم <span className="text-red-500">*</span></label>
                                    <input required type="text" placeholder="مثال: WELCOME10" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none uppercase font-mono tracking-widest text-center" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">نوع الخصم <span className="text-red-500">*</span></label>
                                        <select required value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value as any})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none">
                                            <option value="percentage">نسبة مئوية (%)</option>
                                            <option value="fixed">مبلغ ثابت (ر.س)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">قيمة الخصم <span className="text-red-500">*</span></label>
                                        <input required type="number" step="0.01" value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">الحد الأقصى للاستخدام (اختياري)</label>
                                        <input type="number" placeholder="لامحدود إذا تركته فارغاً" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">الحد الأدنى للطلب (اختياري)</label>
                                        <input type="number" step="0.01" placeholder="مثال: 30" value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none" />
                                    </div>
                                </div>

                                <div className="pt-4 mt-6 border-t border-white/5">
                                    <button type="submit" disabled={isSaving} className="w-full bg-primary text-white font-black py-3.5 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors">
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'إنشاء الكوبون'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AdminStoriesView = () => {
    const [stories, setStories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [formData, setFormData] = useState({
        image_url: '',
        product_id: '',
        offer_name: '',
        offer_price: '',
        is_active: true
    });

    const fetchData = async () => {
        setLoading(true);
        const [{ data: storiesData }, { data: productsData }] = await Promise.all([
            supabaseAdmin.from('stories').select('*, product:products(name_ar)').order('created_at', { ascending: false }),
            supabaseAdmin.from('products').select('id, name_ar, is_hidden')
        ]);
        if (storiesData) setStories(storiesData);
        if (productsData) setProducts(productsData);
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, []);

    const handleOpenModal = () => {
        setFormData({ image_url: '', product_id: '', offer_name: '', offer_price: '', is_active: true });
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `story_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
            toast.success('تم رفع الصورة بنجاح');
        } catch (error) {
            console.error('Upload Error:', error);
            toast.error('حدث خطأ أثناء رفع الصورة');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.image_url) {
            toast.error('الرجاء رفع صورة للقصة أولاً');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                image_url: formData.image_url,
                product_id: formData.product_id || null, // null if no product linked
                offer_name: formData.offer_name || null,
                offer_price: formData.offer_price ? parseFloat(formData.offer_price) : null,
                is_active: formData.is_active
            };
            const { error } = await supabaseAdmin.from('stories').insert([payload]);
            if (error) throw error;
            toast.success('تم إضافة القصة بنجاح');
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('موافق على حذف هذه القصة؟')) return;
        try {
            const { error } = await supabaseAdmin.from('stories').delete().eq('id', id);
            if (error) throw error;
            toast.success('تم الحذف');
            fetchData();
        } catch {
            toast.error('حدث خطأ');
        }
    };

    const toggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await supabaseAdmin.from('stories').update({ is_active: !currentStatus }).eq('id', id);
            fetchData();
        } catch {}
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">القصص والعروض</h2>
                <button onClick={handleOpenModal} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors">
                    <Plus size={18} /> قصة جديدة
                </button>
            </div>

            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {stories.map(story => (
                        <div key={story.id} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden relative group">
                            <div className="aspect-[9/16] relative bg-zinc-800">
                                <img src={story.image_url} alt="Story" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                                
                                {/* Status Toggle */}
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <button onClick={() => toggleStatus(story.id, story.is_active)} className={cn("px-2 py-1 rounded-lg text-[10px] font-bold", story.is_active ? "bg-green-500 text-white" : "bg-red-500 text-white")}>
                                        {story.is_active ? 'نشط' : 'مخفي'}
                                    </button>
                                </div>

                                {/* Delete Button */}
                                <button onClick={() => handleDelete(story.id)} className="absolute top-2 left-2 p-1.5 bg-red-500/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={14} />
                                </button>

                                {/* Linked Product / Offer Label */}
                                <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 bg-gradient-to-t from-black/90 to-transparent text-center">
                                    {story.product ? (
                                        <>
                                            <p className="text-[10px] text-white/70">مرتبط بمنتج:</p>
                                            <p className="font-bold text-white text-sm truncate">{story.product.name_ar}</p>
                                        </>
                                    ) : story.offer_name ? (
                                        <>
                                            <p className="text-[10px] text-primary/90">عرض مباشر:</p>
                                            <p className="font-bold text-primary text-sm truncate">{story.offer_name}</p>
                                            <p className="text-xs text-white">{story.offer_price} ر.س</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400">صورة فقط</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {stories.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 bg-zinc-900 border border-white/5 rounded-2xl">لا توجد قصص، أضف أول قصتك لجذب العملاء 🔥</div>
                    )}
                </div>
            )}

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-zinc-900 rounded-3xl p-6 w-full max-w-sm relative z-10 border border-white/10 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-black">إضافة قصة جديدة</h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                            </div>
                            
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400 flex items-center justify-between">
                                        <span>صورة القصة (تصميم طولي) <span className="text-red-500">*</span></span>
                                        {isUploading && <Loader2 size={14} className="animate-spin text-primary" />}
                                    </label>
                                    <div className="flex gap-3 items-center">
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" className="w-16 h-24 rounded-xl object-cover bg-zinc-800 shrink-0 border border-white/10" />
                                        ) : (
                                            <div className="w-16 h-24 rounded-xl bg-zinc-800 border-2 border-dashed border-white/10 flex items-center justify-center shrink-0">
                                                <ImageIcon size={20} className="text-gray-500" />
                                            </div>
                                        )}
                                        <label className="flex-1 border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors h-24 rounded-xl flex items-center justify-center cursor-pointer bg-zinc-800/50 group">
                                            <span className="text-sm font-bold text-gray-400 group-hover:text-primary transition-colors flex items-center gap-2">
                                                <Upload size={16} /> رفع صورة الاستوري
                                            </span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                                        </label>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-zinc-800/30 border border-white/5 space-y-4">
                                    <h4 className="font-bold text-primary text-sm flex items-center gap-2">
                                        <ShoppingBag size={16} /> عرض مباشر من الاستوري (مستقل)
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400">اسم العرض</label>
                                            <input type="text" placeholder="مثال: عرض الغداء" value={formData.offer_name} onChange={e => setFormData({...formData, offer_name: e.target.value, product_id: ''})} className="w-full bg-zinc-900 text-white rounded-lg p-2.5 text-sm border-none focus:ring-1 focus:ring-primary outline-none" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-400">السعر</label>
                                            <input type="number" step="0.01" placeholder="مثال: 50" value={formData.offer_price} onChange={e => setFormData({...formData, offer_price: e.target.value})} className="w-full bg-zinc-900 text-white rounded-lg p-2.5 text-sm border-none focus:ring-1 focus:ring-primary outline-none" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500">في حال كتابة العرض هنا، بضغطة زر سيتم إضافته فوراً للسلة وبدون ربطه بمنتج محدد.</p>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400">أو ربط القصة بمنتج موجود من المنيو بدل العرض المستقل (اختياري)</label>
                                    <select value={formData.product_id} onChange={e => setFormData({...formData, product_id: e.target.value, offer_name: '', offer_price: ''})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none text-sm">
                                        <option value="">بدون منتج</option>
                                        <optgroup label="منتجات العروض (مخفية)">
                                            {products.filter(p => p.is_hidden).map(p => (
                                                <option key={p.id} value={p.id}>🔥 {p.name_ar}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="المنتجات العادية">
                                            {products.filter(p => !p.is_hidden).map(p => (
                                                <option key={p.id} value={p.id}>{p.name_ar}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1">عند ربط منتج، تفتح نافذة تفاصيل المنتج بدلاً من إضافته تلقائياً.</p>
                                </div>

                                <label className="flex items-center gap-3 p-4 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors mt-2">
                                    <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border", formData.is_active ? "bg-primary border-primary" : "bg-zinc-900 border-white/20")}>
                                        {formData.is_active && <CheckCircle2 size={14} className="text-white" />}
                                    </div>
                                    <span className="text-sm font-bold flex-1">نشط ومتاح للعملاء الآن</span>
                                    <input type="checkbox" className="hidden" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} />
                                </label>

                                <div className="pt-4 mt-6 border-t border-white/5">
                                    <button type="submit" disabled={isSaving} className="w-full bg-primary text-white font-black py-3.5 rounded-xl hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors">
                                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : 'حفظ القصة'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const AdminAdditionsView: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    
    const [optionGroups, setOptionGroups] = useState<any[]>([]);
    const [optionItems, setOptionItems] = useState<any[]>([]);
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
    const [isCloning, setIsCloning] = useState(false);

    const [newIngredientName, setNewIngredientName] = useState('');
    const [isAddingIngredient, setIsAddingIngredient] = useState(false);

    const fetchProductsData = async () => {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
            supabase.from('products').select('*').order('name_ar'),
            supabase.from('categories').select('*').order('sort_order')
        ]);
        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) setCategories(catRes.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchProductsData();
    }, []);

    const fetchProductDetails = async (productId: string) => {
        setDetailsLoading(true);
        try {
            const [groupsRes, itemsRes, ingredientsRes] = await Promise.all([
                supabase.from('option_groups').select('*').eq('product_id', productId).order('name_ar'),
                supabase.from('option_items').select('*'),
                supabase.from('ingredients').select('*').eq('product_id', productId).order('name_ar')
            ]);
            
            if (groupsRes.data) setOptionGroups(groupsRes.data);
            if (itemsRes.data) setOptionItems(itemsRes.data);
            if (ingredientsRes.data) setIngredients(ingredientsRes.data);
        } catch (error) {
            toast.error('حدث خطأ في تحميل خيارات الصنف');
        } finally {
            setDetailsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedProductId) {
            fetchProductDetails(selectedProductId);
            setNewIngredientName('');
        } else {
            setOptionGroups([]);
            setOptionItems([]);
            setIngredients([]);
        }
    }, [selectedProductId]);

    const handleAddGroup = async () => {
        if (!selectedProductId) return;
        const payload = { 
            product_id: selectedProductId, 
            name_ar: 'مجموعة خيارات جديدة', 
            name_en: 'New Option Group', 
            min_selection: 0, 
            max_selection: 1 
        };
        const { data, error } = await supabaseAdmin.from('option_groups').insert([payload]).select().single();
        if (data) {
            setOptionGroups(prev => [...prev, data]);
            toast.success('تمت إضافة مجموعة خيارات جديدة');
        } else {
            toast.error('تعذر إضافة مجموعة جديدة');
        }
    };

    const handleUpdateGroupLocal = (id: string, field: string, value: any) => {
        setOptionGroups(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
    };

    const handleSaveGroup = async (id: string) => {
        const group = optionGroups.find(g => g.id === id);
        if (!group) return;
        const { error } = await supabaseAdmin.from('option_groups').update({
            name_ar: group.name_ar,
            name_en: group.name_ar,
            min_selection: group.min_selection,
            max_selection: group.max_selection
        }).eq('id', id);
        if (error) toast.error('تعذر حفظ المجموعة');
        else toast.success('تم حفظ تعديل المجموعة');
    };

    const handleDeleteGroup = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف مجموعة الخيارات هذه بالكامل وكل خياراتها الفرعية؟')) return;
        const { error } = await supabaseAdmin.from('option_groups').delete().eq('id', id);
        if (error) {
            toast.error('تعذر حذف المجموعة');
        } else {
            setOptionGroups(prev => prev.filter(g => g.id !== id));
            setOptionItems(prev => prev.filter(i => i.group_id !== id));
            toast.success('تم حذف المجموعة بنجاح');
        }
    };

    const handleAddOptionItem = async (groupId: string) => {
        const payload = { 
            group_id: groupId, 
            name_ar: 'خيار فرعي جديد', 
            name_en: 'New Choice', 
            price: 0, 
            calories: 0, 
            is_available: true 
        };
        const { data, error } = await supabaseAdmin.from('option_items').insert([payload]).select().single();
        if (data) {
            setOptionItems(prev => [...prev, data]);
            toast.success('تمت إضافة خيار فرعي');
        } else {
            toast.error('تعذر إضافة خيار');
        }
    };

    const handleUpdateItemLocal = (id: string, field: string, value: any) => {
        setOptionItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleSaveOptionItem = async (id: string) => {
        const item = optionItems.find(i => i.id === id);
        if (!item) return;
        const cleanPrice = parseFloat(item.price?.toString()) || 0;
        const cleanCalories = parseInt(item.calories?.toString() || '0') || 0;
        const { error } = await supabaseAdmin.from('option_items').update({
            name_ar: item.name_ar,
            name_en: item.name_ar,
            price: cleanPrice,
            calories: cleanCalories,
            is_available: item.is_available
        }).eq('id', id);
        if (error) toast.error('خطأ أثناء الحفظ');
        else toast.success('تم حفظ التعديل');
    };

    const handleDeleteOptionItem = async (id: string) => {
        const { error } = await supabaseAdmin.from('option_items').delete().eq('id', id);
        if (error) {
            toast.error('تعذر الحذف');
        } else {
            setOptionItems(prev => prev.filter(i => i.id !== id));
            toast.success('تم حذف الخيار');
        }
    };

    const handleAddIngredient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || !newIngredientName.trim()) return;
        setIsAddingIngredient(true);
        try {
            const payload = {
                product_id: selectedProductId,
                name_ar: newIngredientName.trim(),
                name_en: newIngredientName.trim(),
                is_removable: true
            };
            const { data, error } = await supabaseAdmin.from('ingredients').insert([payload]).select().single();
            if (error) throw error;
            if (data) {
                setIngredients(prev => [...prev, data]);
                setNewIngredientName('');
                toast.success('تمت إضافة المكون الافتراضي');
            }
        } catch (error) {
            toast.error('تعذر إضافة المكون');
        } finally {
            setIsAddingIngredient(false);
        }
    };

    const handleDeleteIngredient = async (id: string) => {
        const { error } = await supabaseAdmin.from('ingredients').delete().eq('id', id);
        if (error) {
            toast.error('تعذر الحذف');
        } else {
            setIngredients(prev => prev.filter(ing => ing.id !== id));
            toast.success('تم حذف المكون');
        }
    };

    const handleCloneConfig = async (targetProductId: string) => {
        if (!selectedProductId) return;
        setIsCloning(true);
        try {
            const { data: sourceGroups } = await supabase.from('option_groups').select('*').eq('product_id', selectedProductId);
            
            let sourceItems: any[] = [];
            if (sourceGroups && sourceGroups.length > 0) {
                const groupIds = sourceGroups.map(g => g.id);
                const { data: resItems } = await supabase.from('option_items').select('*').in('group_id', groupIds);
                if (resItems) sourceItems = resItems;
            }

            const { data: sourceIngredients } = await supabase.from('ingredients').select('*').eq('product_id', selectedProductId);

            const { data: existingTargetGroups } = await supabase.from('option_groups').select('id').eq('product_id', targetProductId);
            if (existingTargetGroups && existingTargetGroups.length > 0) {
                await supabaseAdmin.from('option_groups').delete().eq('product_id', targetProductId);
            }
            await supabaseAdmin.from('ingredients').delete().eq('product_id', targetProductId);

            if (sourceGroups && sourceGroups.length > 0) {
                for (const group of sourceGroups) {
                    const { data: clonedGroup, error: gErr } = await supabaseAdmin.from('option_groups').insert({
                        product_id: targetProductId,
                        name_ar: group.name_ar,
                        name_en: group.name_en,
                        min_selection: group.min_selection,
                        max_selection: group.max_selection
                    }).select().single();

                    if (gErr) throw gErr;

                    const itemsInGroup = sourceItems.filter(i => i.group_id === group.id);
                    if (clonedGroup && itemsInGroup.length > 0) {
                        const itemsPayloads = itemsInGroup.map(i => ({
                            group_id: clonedGroup.id,
                            name_ar: i.name_ar,
                            name_en: i.name_en,
                            price: i.price,
                            calories: i.calories,
                            is_available: i.is_available
                        }));
                        await supabaseAdmin.from('option_items').insert(itemsPayloads);
                    }
                }
            }

            if (sourceIngredients && sourceIngredients.length > 0) {
                const ingPayloads = sourceIngredients.map(ing => ({
                    product_id: targetProductId,
                    name_ar: ing.name_ar,
                    name_en: ing.name_en,
                    is_removable: ing.is_removable
                }));
                await supabaseAdmin.from('ingredients').insert(ingPayloads);
            }

            toast.success('تم نسخ وتطبيق جميع الخيارات والمكونات بنجاح للمنتج المختار!');
            setIsCloneModalOpen(false);
        } catch (error) {
            console.error('Cloning error:', error);
            toast.error('حدث خطأ في استنساخ البيانات');
        } finally {
            setIsCloning(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesCategory = selectedCategoryId === 'all' ? true : p.category_id === selectedCategoryId;
        const matchesSearch = p.name_ar.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-right" dir="rtl">
            <div className="lg:col-span-1 bg-zinc-900 border border-white/5 rounded-3xl p-4 flex flex-col gap-4 max-h-[85vh]">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-sm text-primary">قائمة الوجبات</h3>
                    </div>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="ابحث عن وجبة..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 text-white rounded-xl py-2 px-3 pl-9 text-xs border border-transparent focus:border-primary/50 outline-none" 
                        />
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    </div>

                    <select 
                        value={selectedCategoryId} 
                        onChange={e => setSelectedCategoryId(e.target.value)}
                        className="w-full bg-zinc-800 text-white rounded-xl p-2 text-xs border border-transparent focus:border-primary/50 outline-none appearance-none cursor-pointer"
                    >
                        <option value="all">جميع الأقسام</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                ) : (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {filteredProducts.map(p => (
                            <button 
                                key={p.id} 
                                onClick={() => setSelectedProductId(p.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-2.5 rounded-2xl border transition-all text-right cursor-pointer",
                                    selectedProductId === p.id 
                                        ? "bg-primary/10 border-primary text-white" 
                                        : "bg-zinc-85 border-white/5 text-gray-400 hover:bg-zinc-800 hover:text-white"
                                )}
                            >
                                <img src={p.image_url || '/placeholder.png'} className="w-10 h-10 rounded-lg object-cover bg-zinc-805" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-xs truncate">{p.name_ar}</p>
                                    <p className="text-[10px] text-gray-500">{p.price} ر.س</p>
                                </div>
                            </button>
                        ))}
                        {filteredProducts.length === 0 && (
                            <p className="text-xs text-center text-gray-500 py-8">لا توجد أطباق مطابقة</p>
                        )}
                    </div>
                )}
            </div>

            <div className="lg:col-span-3 bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col min-h-[50vh] max-h-[85vh] overflow-y-auto custom-scrollbar">
                {!selectedProductId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500 gap-4 text-center">
                        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center text-primary">
                            <Sliders size={36} />
                        </div>
                        <div>
                            <h4 className="font-black text-lg text-white mb-1">تخصيص مكونات وإضافات الوجبات</h4>
                            <p className="text-sm max-w-sm">يرجى تحديد وجبة من القائمة الجانبية لإدارة خياراتها وحجمها ومكوناتها الافتراضية بنظام متكامل.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            const p = products.find(prod => prod.id === selectedProductId);
                            if (!p) return null;
                            const cat = categories.find(c => c.id === p.category_id);
                            return (
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-white/5 shrink-0">
                                    <div className="flex items-center gap-3">
                                        <img src={p.image_url || '/placeholder.png'} className="w-14 h-14 rounded-xl object-cover bg-zinc-800 border border-white/10" />
                                        <div>
                                            <h3 className="font-black text-md text-white">{p.name_ar}</h3>
                                            <p className="text-xs text-gray-400">{cat?.name_ar} • {p.price} ر.س</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsCloneModalOpen(true)}
                                        className="flex items-center gap-2 bg-zinc-800 border border-white/10 hover:border-primary/50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                        <Copy size={14} className="text-primary" /> نسخ إعدادات هذا الصنف
                                    </button>
                                </div>
                            );
                        })()}

                        {detailsLoading ? (
                            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-zinc-950/20 p-2 rounded-xl">
                                        <h4 className="font-black text-xs text-primary flex items-center gap-1.5">🍟 خيارات الوجبة (الصوصات، المقاسات، والخيارات)</h4>
                                        <button 
                                            onClick={handleAddGroup}
                                            className="bg-primary/10 hover:bg-primary text-primary hover:text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                                        >
                                            <Plus size={12} /> إضافة مجموعة
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                                        {optionGroups.map(group => (
                                            <div key={group.id} className="bg-zinc-850/50 border border-white/5 rounded-2xl p-4 space-y-4 hover:border-white/10 transition-colors">
                                                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                                                    <input 
                                                        type="text" 
                                                        value={group.name_ar} 
                                                        onChange={e => handleUpdateGroupLocal(group.id, 'name_ar', e.target.value)}
                                                        onBlur={() => handleSaveGroup(group.id)}
                                                        className="flex-1 bg-zinc-900 text-white rounded-lg px-3 py-1.5 text-xs font-bold border border-transparent focus:border-primary/50 outline-none"
                                                        placeholder="اسم المجموعة (مثل: حجم الوجبة)"
                                                    />
                                                    
                                                    <div className="flex gap-2">
                                                        <select
                                                            value={`${group.min_selection}-${group.max_selection}`}
                                                            onChange={e => {
                                                                const [min, max] = e.target.value.split('-').map(Number);
                                                                handleUpdateGroupLocal(group.id, 'min_selection', min);
                                                                handleUpdateGroupLocal(group.id, 'max_selection', max);
                                                                setTimeout(() => handleSaveGroup(group.id), 50);
                                                            }}
                                                            className="bg-zinc-900 border border-white/10 text-white rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer"
                                                        >
                                                            <option value="1-1">اختيار إجباري واحد فقط</option>
                                                            <option value="0-1">اختيار واحد اختياري</option>
                                                            <option value="0-10">إضافات متعددة (اختياري)</option>
                                                            <option value="1-10">إضافات متعددة (إجباري 1+)</option>
                                                        </select>

                                                        <button 
                                                            onClick={() => handleDeleteGroup(group.id)}
                                                            className="p-1 px-2 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                                            title="حذف المجموعة"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mr-6 space-y-2 border-r border-white/5 pr-4 relative">
                                                    {optionItems.filter(item => item.group_id === group.id).map(item => (
                                                        <div key={item.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-zinc-900/40 p-1.5 rounded-lg border border-white/[0.01]">
                                                            <input 
                                                                type="text" 
                                                                value={item.name_ar}
                                                                onChange={e => handleUpdateItemLocal(item.id, 'name_ar', e.target.value)}
                                                                onBlur={() => handleSaveOptionItem(item.id)}
                                                                className="flex-1 min-w-[100px] bg-zinc-800 text-white rounded-lg px-2 py-1 text-xs border border-transparent focus:border-primary/50 outline-none"
                                                                placeholder="الخيار (مثل: دبل جبن)"
                                                            />

                                                            <div className="relative w-16 shrink-0">
                                                                <input 
                                                                    type="number" 
                                                                    value={item.calories || ''}
                                                                    onChange={e => handleUpdateItemLocal(item.id, 'calories', e.target.value)}
                                                                    onBlur={() => handleSaveOptionItem(item.id)}
                                                                    className="w-full bg-zinc-800 text-white rounded-lg px-1.5 py-1 text-xs text-center border border-transparent focus:border-primary/50 outline-none"
                                                                    placeholder="سعرة"
                                                                />
                                                            </div>

                                                            <div className="relative w-20 shrink-0">
                                                                <input 
                                                                    type="number" 
                                                                    step="0.01"
                                                                    value={item.price}
                                                                    onChange={e => handleUpdateItemLocal(item.id, 'price', e.target.value)}
                                                                    onBlur={() => handleSaveOptionItem(item.id)}
                                                                    className="w-full bg-zinc-800 text-white rounded-lg pl-6 pr-2 py-1 text-xs text-left font-bold border border-transparent focus:border-primary/50 outline-none"
                                                                    placeholder="0"
                                                                />
                                                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-gray-500">ر.س</span>
                                                            </div>

                                                            <button 
                                                                onClick={async () => {
                                                                    const val = !item.is_available;
                                                                    handleUpdateItemLocal(item.id, 'is_available', val);
                                                                    const { error } = await supabaseAdmin.from('option_items').update({ is_available: val }).eq('id', item.id);
                                                                    if (error) toast.error('تعذر تعديل التوفر');
                                                                    else toast.success(val ? 'الخيار متاح' : 'الخيار نفد');
                                                                }}
                                                                className={cn(
                                                                    "px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer",
                                                                    item.is_available 
                                                                        ? "bg-green-500/10 text-green-400" 
                                                                        : "bg-red-500/10 text-red-400"
                                                                )}
                                                            >
                                                                {item.is_available ? "متوفر" : "نفد"}
                                                            </button>

                                                            <button 
                                                                onClick={() => handleDeleteOptionItem(item.id)}
                                                                className="text-gray-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button 
                                                        onClick={() => handleAddOptionItem(group.id)}
                                                        className="text-[11px] text-primary font-bold flex items-center gap-1 py-1 px-2 bg-primary/5 hover:bg-primary/10 rounded transition-colors cursor-pointer"
                                                    >
                                                        <Plus size={10} /> إضافة خيار فرعي
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {optionGroups.length === 0 && (
                                            <div className="text-center py-8 bg-zinc-800/10 border border-dashed border-white/5 rounded-2xl text-gray-500 text-xs">
                                                لا توجد خيارات بعد لهذ الوجبة. يمكنك الضغط على "إضافة مجموعة" بالأعلى.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-zinc-950/20 p-2 rounded-xl">
                                        <h4 className="font-black text-xs text-primary flex items-center gap-1.5">🥬 المكونات الافتراضية (قابلة للإزالة من العميل)</h4>
                                    </div>

                                    <div className="bg-zinc-850/50 border border-white/5 rounded-2xl p-4 space-y-4 max-h-[55vh] overflow-y-auto">
                                        <p className="text-xs text-gray-500">
                                            المكونات التي تأتي بالوجبة افتراضياً ويمكن للعميل حذفها بضغطة زر عند الطلب (مثال: بدون بصل، بدون مخلل).
                                        </p>

                                        <form onSubmit={handleAddIngredient} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="أضف مكون جديد (مثل: بصل، مخلل)..." 
                                                value={newIngredientName}
                                                onChange={e => setNewIngredientName(e.target.value)}
                                                className="flex-1 bg-zinc-900 text-white rounded-xl py-1.5 px-3 text-xs border border-transparent focus:border-primary/50 outline-none"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={isAddingIngredient || !newIngredientName.trim()}
                                                className="bg-primary hover:bg-primary/95 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 disabled:opacity-50 transition-colors cursor-pointer"
                                            >
                                                {isAddingIngredient ? <Loader2 size={10} className="animate-spin" /> : <Plus size={12} />} إضافة
                                            </button>
                                        </form>

                                        <div className="space-y-2 pt-2">
                                            {ingredients.map(ing => (
                                                <div key={ing.id} className="flex justify-between items-center bg-zinc-900/40 p-2 rounded-xl border border-white/[0.01]">
                                                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                        {ing.name_ar}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleDeleteIngredient(ing.id)}
                                                        className="text-gray-500 hover:text-red-400 p-1 hover:bg-red-500/10 rounded transition-colors cursor-pointer"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            
                                            {ingredients.length === 0 && (
                                                <div className="text-center py-6 text-gray-500 text-xs">
                                                    لا توجد مكونات مسجلة تمنح العميل خيار حذفها (مثل "بدون بصل"). اكتب اسماً للبدء.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isCloneModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setIsCloneModalOpen(false)} 
                            className="absolute inset-0 bg-black/70 backdrop-blur-xs" 
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }} 
                            className="bg-zinc-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl flex flex-col max-h-[80vh]"
                        >
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h3 className="text-sm font-black text-white">استنساخ إعدادات الوجبة</h3>
                                <button onClick={() => setIsCloneModalOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
                            </div>
                            
                            <p className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                                سيتم مسح أي إضافات ومكونات فرعية للمنتج المستهدف واستنساخ جميع خيارات وجبة 
                                <span className="text-primary font-bold px-1">{products.find(p => p.id === selectedProductId)?.name_ar}</span>
                                إليه.
                            </p>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar mb-4">
                                <span className="text-[11px] text-gray-550 block mb-1">اختر الصنف المستهدف للاستنساخ:</span>
                                {products.filter(p => p.id !== selectedProductId).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={async () => {
                                            if (window.confirm(`هل تريد تأكيد نسخ جميع خيارات ومكونات هذا الصنف إلى الوجبة "${p.name_ar}"؟ الخيارات القديمة للوجبة المستهدفة ستمسح.`)) {
                                                await handleCloneConfig(p.id);
                                            }
                                        }}
                                        disabled={isCloning}
                                        className="w-full flex items-center gap-3 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-right cursor-pointer"
                                    >
                                        <img src={p.image_url || '/placeholder.png'} className="w-8 h-8 rounded-lg object-cover bg-zinc-900 border border-white/5 shrink-0" />
                                        <span className="text-xs font-bold text-white flex-1 truncate">{p.name_ar}</span>
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setIsCloneModalOpen(false)}
                                className="w-full bg-zinc-800 text-white font-bold py-2 rounded-xl border border-white/5 hover:bg-zinc-700 transition-colors text-xs cursor-pointer"
                            >
                                إلغاء
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminPage;
