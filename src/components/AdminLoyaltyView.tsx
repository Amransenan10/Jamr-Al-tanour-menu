import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Gift, Users, Award, TrendingUp, Plus, Minus, Search, 
    Settings, Save, History, Sparkles, CheckCircle2, X, 
    Loader2, Phone, User, RefreshCw, ToggleLeft, ToggleRight,
    Coins, DollarSign, ShieldAlert, AlertCircle, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

interface LoyaltyConfig {
    is_enabled: boolean;
    earning_rate: number; // كل كم ريال = 1 نقطة
    redemption_rate: number; // كل كم نقطة = 1 ريال خصم
    min_points_to_redeem: number; // الحد الأدنى للاستبدال
    welcome_bonus_points: number; // نقاط ترحيبية
}

interface Customer {
    phone_number: string;
    full_name: string;
    points_balance: number;
    created_at?: string;
    updated_at?: string;
}

interface Transaction {
    id: number;
    customer_phone: string;
    type?: string; // 'earn', 'redeem', 'admin_add', 'admin_deduct'
    amount: number;
    points_earned: number;
    points_redeemed: number;
    notes?: string;
    staff_id?: string;
    created_at: string;
}

export const AdminLoyaltyView: React.FC = () => {
    const [activeSubTab, setActiveSubTab] = useState<'config' | 'customers' | 'transactions'>('config');

    // Config state
    const [config, setConfig] = useState<LoyaltyConfig>({
        is_enabled: true,
        earning_rate: 10,
        redemption_rate: 5,
        min_points_to_redeem: 5,
        welcome_bonus_points: 0
    });
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [savingConfig, setSavingConfig] = useState(false);

    // Customers state
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Transactions state
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [txSearchQuery, setTxSearchQuery] = useState('');

    // Modals
    const [adjustModal, setAdjustModal] = useState<{
        isOpen: boolean;
        customer: Customer | null;
        type: 'add' | 'deduct';
        points: string;
        reason: string;
        isSubmitting: boolean;
    }>({
        isOpen: false,
        customer: null,
        type: 'add',
        points: '',
        reason: '',
        isSubmitting: false
    });

    const [newCustomerModal, setNewCustomerModal] = useState<{
        isOpen: boolean;
        phone: string;
        name: string;
        points: string;
        isSubmitting: boolean;
    }>({
        isOpen: false,
        phone: '',
        name: '',
        points: '0',
        isSubmitting: false
    });

    // Fetch All Data
    const fetchConfig = async () => {
        setLoadingConfig(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('loyalty_config')
                .select('*')
                .eq('id', 1)
                .single();

            if (data) {
                setConfig({
                    is_enabled: data.is_enabled ?? true,
                    earning_rate: Number(data.earning_rate) || 10,
                    redemption_rate: Number(data.redemption_rate) || 5,
                    min_points_to_redeem: Number(data.min_points_to_redeem) || 5,
                    welcome_bonus_points: Number(data.welcome_bonus_points) || 0
                });
            } else if (error) {
                console.warn('loyalty_config query info:', error.message);
            }
        } catch (e) {
            console.error('Error fetching loyalty config:', e);
        } finally {
            setLoadingConfig(false);
        }
    };

    const fetchCustomers = async () => {
        setLoadingCustomers(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('customers')
                .select('*')
                .order('points_balance', { ascending: false });

            if (data) setCustomers(data);
            if (error) console.error('Error fetching customers:', error);
        } catch (e) {
            console.error('Error fetching customers:', e);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const fetchTransactions = async () => {
        setLoadingTransactions(true);
        try {
            const { data, error } = await supabaseAdmin
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (data) setTransactions(data);
            if (error) console.error('Error fetching transactions:', error);
        } catch (e) {
            console.error('Error fetching transactions:', e);
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchCustomers();
        fetchTransactions();

        // Realtime Subscription
        const channel = supabase
            .channel('admin-loyalty-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_config' }, () => fetchConfig())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => fetchCustomers())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Save Loyalty Config
    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setSavingConfig(true);
        try {
            const payload = {
                id: 1,
                is_enabled: config.is_enabled,
                earning_rate: Math.max(1, Number(config.earning_rate) || 10),
                redemption_rate: Math.max(1, Number(config.redemption_rate) || 5),
                min_points_to_redeem: Math.max(0, Number(config.min_points_to_redeem) || 5),
                welcome_bonus_points: Math.max(0, Number(config.welcome_bonus_points) || 0),
                updated_at: new Date().toISOString()
            };

            const { error } = await supabaseAdmin
                .from('loyalty_config')
                .upsert([payload]);

            if (error) throw error;
            toast.success('تم حفظ إعدادات نظام الولاء بنجاح 🌟');
        } catch (err: any) {
            console.error('Save config error:', err);
            toast.error('حدث خطأ أثناء حفظ الإعدادات');
        } finally {
            setSavingConfig(false);
        }
    };

    // Handle Adjust Points (Add / Deduct)
    const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { customer, type, points, reason } = adjustModal;
        if (!customer || !points || parseInt(points) <= 0) {
            toast.error('يرجى إدخال عدد نقاط صحيح');
            return;
        }

        const ptsAmount = parseInt(points);
        setAdjustModal(prev => ({ ...prev, isSubmitting: true }));

        try {
            const currentBalance = customer.points_balance || 0;
            const newBalance = type === 'add' 
                ? currentBalance + ptsAmount 
                : Math.max(0, currentBalance - ptsAmount);

            // 1. Update customer balance
            const { error: custError } = await supabaseAdmin
                .from('customers')
                .update({ 
                    points_balance: newBalance,
                    updated_at: new Date().toISOString()
                })
                .eq('phone_number', customer.phone_number);

            if (custError) throw custError;

            // 2. Insert transaction record
            const txPayload = {
                customer_phone: customer.phone_number,
                type: type === 'add' ? 'admin_add' : 'admin_deduct',
                amount: 0,
                points_earned: type === 'add' ? ptsAmount : 0,
                points_redeemed: type === 'deduct' ? ptsAmount : 0,
                notes: reason ? `[تعديل أدمن]: ${reason}` : 'تعديل رصيد النقاط من لوحة الإدارة',
                staff_id: 'الأدمن',
                created_at: new Date().toISOString()
            };

            await supabaseAdmin.from('transactions').insert([txPayload]);

            toast.success(`تم ${type === 'add' ? 'إضافة' : 'خصم'} ${ptsAmount} نقطة للعميل بنجاح!`);
            setAdjustModal({ isOpen: false, customer: null, type: 'add', points: '', reason: '', isSubmitting: false });
            fetchCustomers();
            fetchTransactions();
        } catch (err: any) {
            console.error('Adjust points error:', err);
            toast.error('حدث خطأ أثناء تعديل النقاط');
            setAdjustModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // Handle Create New Customer
    const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { phone, name, points } = newCustomerModal;
        const cleanPhone = phone.trim();
        const cleanName = name.trim();
        const initialPts = parseInt(points) || 0;

        if (!cleanPhone || cleanPhone.length < 9) {
            toast.error('يرجى إدخال رقم جوال صحيح');
            return;
        }

        setNewCustomerModal(prev => ({ ...prev, isSubmitting: true }));

        try {
            // 1. Upsert customer
            const { error: custError } = await supabaseAdmin
                .from('customers')
                .upsert([{
                    phone_number: cleanPhone,
                    full_name: cleanName || 'عميل المحل',
                    points_balance: initialPts,
                    updated_at: new Date().toISOString()
                }]);

            if (custError) throw custError;

            // 2. If initial points > 0, log transaction
            if (initialPts > 0) {
                await supabaseAdmin.from('transactions').insert([{
                    customer_phone: cleanPhone,
                    type: 'admin_add',
                    amount: 0,
                    points_earned: initialPts,
                    points_redeemed: 0,
                    notes: 'رصيد افتتاحي عند التسجيل في اللوحة',
                    staff_id: 'الأدمن',
                    created_at: new Date().toISOString()
                }]);
            }

            toast.success('تم تسجيل العميل بنجاح في نظام الولاء!');
            setNewCustomerModal({ isOpen: false, phone: '', name: '', points: '0', isSubmitting: false });
            fetchCustomers();
            fetchTransactions();
        } catch (err: any) {
            console.error('Create customer error:', err);
            toast.error('حدث خطأ أثناء إضافة العميل');
            setNewCustomerModal(prev => ({ ...prev, isSubmitting: false }));
        }
    };

    // Filtered Customers
    const filteredCustomers = customers.filter(c => 
        (c.full_name && c.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.phone_number && c.phone_number.includes(searchQuery))
    );

    // Filtered Transactions
    const filteredTransactions = transactions.filter(t =>
        (t.customer_phone && t.customer_phone.includes(txSearchQuery)) ||
        (t.notes && t.notes.toLowerCase().includes(txSearchQuery.toLowerCase()))
    );

    // Stats Summary Calculations
    const totalCustomersCount = customers.length;
    const totalActivePoints = customers.reduce((sum, c) => sum + (c.points_balance || 0), 0);
    const totalMonetaryValue = config.redemption_rate > 0 ? (totalActivePoints / config.redemption_rate) : 0;
    const totalRedeemedPoints = transactions.reduce((sum, t) => sum + (t.points_redeemed || 0), 0);

    return (
        <div className="space-y-8 select-none text-right" dir="rtl">
            {/* Header Title & Status Bar */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/30">
                            <Gift size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                إدارة نظام الولاء والنقاط
                                <span className={cn(
                                    "text-xs px-3 py-1 rounded-full font-bold border",
                                    config.is_enabled 
                                        ? "bg-green-500/10 text-green-400 border-green-500/30" 
                                        : "bg-red-500/10 text-red-400 border-red-500/30"
                                )}>
                                    {config.is_enabled ? '● نَشِط ومُفَعَّل' : '○ مُعَطَّل حالياً'}
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">تحكم كامل بالإعدادات، نسب الاكتساب والاستبدال، ورصيد نقاط العملاء</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <button
                        onClick={() => { fetchConfig(); fetchCustomers(); fetchTransactions(); }}
                        className="p-3 bg-zinc-800/80 hover:bg-zinc-700 text-gray-300 rounded-2xl transition-all cursor-pointer border border-white/5"
                        title="تحديث البيانات"
                    >
                        <RefreshCw size={18} />
                    </button>
                    
                    <button
                        onClick={() => setNewCustomerModal(prev => ({ ...prev, isOpen: true }))}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-lg shadow-primary/20 transition-all cursor-pointer"
                    >
                        <Plus size={18} /> إضافة عميل بالولاء
                    </button>
                </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي أعضاء الولاء</p>
                        <h3 className="text-2xl font-black text-white mt-1">{totalCustomersCount} <span className="text-xs font-normal text-gray-400">عميل</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">مسجلين برقم الجوال في القاعدة</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 border border-blue-500/20">
                        <Users size={22} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي النقاط النشطة</p>
                        <h3 className="text-2xl font-black text-amber-400 mt-1">{totalActivePoints.toLocaleString()} <span className="text-xs font-normal text-amber-400/70">نقطة</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">في أرصدة جميع العملاء الحالية</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400 border border-amber-500/20">
                        <Coins size={22} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">قيمة خصم الأرصدة الحالية</p>
                        <h3 className="text-2xl font-black text-emerald-400 mt-1">{totalMonetaryValue.toFixed(2)} <span className="text-xs font-normal text-emerald-400/70">ر.س</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">استناداً لنسبة الاستبدال الحالية</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Award size={22} />
                    </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500">إجمالي النقاط المستبدلة</p>
                        <h3 className="text-2xl font-black text-purple-400 mt-1">{totalRedeemedPoints.toLocaleString()} <span className="text-xs font-normal text-purple-400/70">نقطة</span></h3>
                        <p className="text-[10px] text-gray-400 mt-1">تم استهلاكها في خصومات سابقة</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 border border-purple-500/20">
                        <TrendingUp size={22} />
                    </div>
                </div>
            </div>

            {/* Inner Tabs Navigation */}
            <div className="flex border-b border-white/10 gap-2">
                {[
                    { id: 'config', label: 'إعدادات وقواعد الولاء ⚙️', icon: <Settings size={16} /> },
                    { id: 'customers', label: 'دليل وأرصدة العملاء 👥', icon: <Users size={16} /> },
                    { id: 'transactions', label: 'سجل حركات النقاط 📜', icon: <History size={16} /> }
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveSubTab(t.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-t-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer border-b-2",
                            activeSubTab === t.id
                                ? "bg-zinc-900 text-primary border-primary"
                                : "text-gray-400 hover:text-white border-transparent hover:bg-zinc-900/50"
                        )}
                    >
                        {t.icon} {t.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: CONFIGURATION */}
            {activeSubTab === 'config' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <form onSubmit={handleSaveConfig} className="bg-zinc-900 border border-white/5 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
                        <div className="flex justify-between items-center pb-4 border-b border-white/5 flex-wrap gap-3">
                            <div>
                                <h3 className="text-lg font-black text-white">إعدادات ونسب احتساب نظام الولاء</h3>
                                <p className="text-xs text-gray-400">حدد قواعد جمع واستبدال النقاط للتطبيق والكاشير</p>
                            </div>
                            
                            {/* Toggle System Enabled */}
                            <button
                                type="button"
                                onClick={() => setConfig(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-2xl font-bold text-xs transition-all cursor-pointer border",
                                    config.is_enabled 
                                        ? "bg-green-500/20 text-green-400 border-green-500/40" 
                                        : "bg-zinc-800 text-gray-400 border-white/10"
                                )}
                            >
                                {config.is_enabled ? <ToggleRight size={24} className="text-green-400" /> : <ToggleLeft size={24} className="text-gray-500" />}
                                <span>{config.is_enabled ? 'نظام الولاء: مُفَعَّل' : 'نظام الولاء: مُعَطَّل'}</span>
                            </button>
                        </div>

                        {loadingConfig ? (
                            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Earning Rate */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <Coins size={20} />
                                        <label className="font-bold text-sm text-white">معدل كسب النقاط (Earning Rate)</label>
                                    </div>
                                    <p className="text-xs text-gray-400">كم ريال ينفقه العميل في الفاتورة يحصل على <span className="text-white font-bold">1 نقطة</span>؟</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400">كل</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={config.earning_rate}
                                            onChange={e => setConfig(prev => ({ ...prev, earning_rate: Math.max(1, parseFloat(e.target.value) || 1) }))}
                                            className="w-28 bg-zinc-900 text-amber-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">ريال = 1 نقطة ولاء 🌟</span>
                                    </div>
                                    <p className="text-[11px] text-amber-400/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                                        مثال: فاتورة بـ 50 ريال تمنح العميل <span className="font-bold">{Math.floor(50 / (config.earning_rate || 1))} نقاط</span>.
                                    </p>
                                </div>

                                {/* Redemption Rate */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Award size={20} />
                                        <label className="font-bold text-sm text-white">معدل استبدال النقاط (Redemption Rate)</label>
                                    </div>
                                    <p className="text-xs text-gray-400">كم نقطة يستبدلها العميل لتعادله <span className="text-white font-bold">1 ريال خصم</span>؟</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-400">كل</span>
                                        <input
                                            type="number"
                                            min="1"
                                            value={config.redemption_rate}
                                            onChange={e => setConfig(prev => ({ ...prev, redemption_rate: Math.max(1, parseFloat(e.target.value) || 1) }))}
                                            className="w-28 bg-zinc-900 text-emerald-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">نقاط = 1 ريال خصم 💰</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-400/80 bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                                        مثال: رصيد 25 نقطة يعادل خصماً قيمته <span className="font-bold">{Math.floor(25 / (config.redemption_rate || 1))} ريال</span>.
                                    </p>
                                </div>

                                {/* Min Points to Redeem */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <ShieldAlert size={20} />
                                        <label className="font-bold text-sm text-white">الحد الأدنى لاستبدال النقاط</label>
                                    </div>
                                    <p className="text-xs text-gray-400">الحد الأدنى من النقاط الواجب توفرها في رصيد العميل لتفعيل زر الخصم</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            value={config.min_points_to_redeem}
                                            onChange={e => setConfig(prev => ({ ...prev, min_points_to_redeem: Math.max(0, parseInt(e.target.value) || 0) }))}
                                            className="w-28 bg-zinc-900 text-blue-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">نقاط كحد أدنى للاستبدال</span>
                                    </div>
                                </div>

                                {/* Welcome Bonus Points */}
                                <div className="bg-zinc-800/50 p-5 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <Sparkles size={20} />
                                        <label className="font-bold text-sm text-white">النقاط الترحيبية للعميل الجديد</label>
                                    </div>
                                    <p className="text-xs text-gray-400">عدد النقاط المجانية الممنوحة تلقائياً للعميل عند أول تسجيل برقم جواله</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="0"
                                            value={config.welcome_bonus_points}
                                            onChange={e => setConfig(prev => ({ ...prev, welcome_bonus_points: Math.max(0, parseInt(e.target.value) || 0) }))}
                                            className="w-28 bg-zinc-900 text-purple-400 font-black text-center text-lg rounded-xl p-3 border border-white/10 focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <span className="text-xs font-bold text-white">نقطة هدية ترحيبية 🎁</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 border-t border-white/5 flex justify-end">
                            <button
                                type="submit"
                                disabled={savingConfig || loadingConfig}
                                className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-primary/20 transition-all cursor-pointer disabled:opacity-50"
                            >
                                {savingConfig ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                حفظ إعدادات الولاء
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* TAB 2: CUSTOMERS MANAGEMENT */}
            {activeSubTab === 'customers' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-zinc-900 border border-white/5 p-5 rounded-3xl">
                        <div className="relative flex-1">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="ابحث باسم العميل أو رقم الجوال..."
                                className="w-full pr-12 pl-4 py-3 bg-zinc-800 text-white rounded-2xl border border-white/5 focus:ring-2 focus:ring-primary outline-none text-xs sm:text-sm font-bold"
                            />
                        </div>
                        <div className="text-xs font-bold text-gray-400 flex items-center justify-between sm:justify-start gap-3">
                            <span>عدد نتائج البحث: <strong className="text-primary font-mono">{filteredCustomers.length}</strong> عميل</span>
                        </div>
                    </div>

                    {loadingCustomers ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
                    ) : (
                        <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 overflow-x-auto shadow-2xl">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-zinc-800/60 text-gray-400 border-b border-white/5">
                                    <tr>
                                        <th className="p-4 font-bold">اسم العميل</th>
                                        <th className="p-4 font-bold">رقم الجوال</th>
                                        <th className="p-4 font-bold">رصيد النقاط الحالية</th>
                                        <th className="p-4 font-bold">القيمة الموازية بالخصم</th>
                                        <th className="p-4 font-bold">تاريخ التسجيل</th>
                                        <th className="p-4 font-bold text-center">إجراءات وتعديل</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredCustomers.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-gray-500 font-bold">
                                                لا يوجد عملاء مطابقين للبحث في نظام الولاء
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCustomers.map(cust => {
                                            const pts = cust.points_balance || 0;
                                            const sarValue = config.redemption_rate > 0 ? Math.floor(pts / config.redemption_rate) : 0;
                                            return (
                                                <tr key={cust.phone_number} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 font-bold text-white flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                                            {cust.full_name?.charAt(0) || 'ع'}
                                                        </div>
                                                        {cust.full_name || 'عميل المحل'}
                                                    </td>
                                                    <td className="p-4 font-mono text-gray-300" dir="ltr">{cust.phone_number}</td>
                                                    <td className="p-4">
                                                        <span className="font-black text-amber-400 text-sm bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20 inline-block">
                                                            {pts} نقطة 🌟
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-bold text-emerald-400">
                                                        = {sarValue} ر.س خصم
                                                    </td>
                                                    <td className="p-4 text-gray-500 font-mono text-[11px]">
                                                        {cust.created_at ? new Date(cust.created_at).toLocaleDateString('ar-SA') : 'سابق'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => setAdjustModal({
                                                                    isOpen: true,
                                                                    customer: cust,
                                                                    type: 'add',
                                                                    points: '',
                                                                    reason: '',
                                                                    isSubmitting: false
                                                                })}
                                                                className="flex items-center gap-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                                                            >
                                                                <Plus size={14} /> إضافة
                                                            </button>
                                                            <button
                                                                onClick={() => setAdjustModal({
                                                                    isOpen: true,
                                                                    customer: cust,
                                                                    type: 'deduct',
                                                                    points: '',
                                                                    reason: '',
                                                                    isSubmitting: false
                                                                })}
                                                                className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                                                            >
                                                                <Minus size={14} /> خصم
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* TAB 3: TRANSACTIONS HISTORY */}
            {activeSubTab === 'transactions' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    <div className="flex justify-between items-center bg-zinc-900 border border-white/5 p-5 rounded-3xl">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={txSearchQuery}
                                onChange={e => setTxSearchQuery(e.target.value)}
                                placeholder="فلترة بالحركات برقم الجوال أو السبب..."
                                className="w-full pr-12 pl-4 py-3 bg-zinc-800 text-white rounded-2xl border border-white/5 focus:ring-2 focus:ring-primary outline-none text-xs font-bold"
                            />
                        </div>
                        <span className="text-xs text-gray-400 font-bold">عرض آخر <strong className="text-white font-mono">{filteredTransactions.length}</strong> حركة سجل</span>
                    </div>

                    {loadingTransactions ? (
                        <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={32} /></div>
                    ) : (
                        <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/5 overflow-x-auto shadow-2xl">
                            <table className="w-full text-xs text-right">
                                <thead className="bg-zinc-800/60 text-gray-400 border-b border-white/5">
                                    <tr>
                                        <th className="p-4 font-bold">جوال العميل</th>
                                        <th className="p-4 font-bold">نوع العملية</th>
                                        <th className="p-4 font-bold">النقاط المكتسبة (+)</th>
                                        <th className="p-4 font-bold">النقاط المستبدلة (-)</th>
                                        <th className="p-4 font-bold">مبلغ العملية</th>
                                        <th className="p-4 font-bold">السبب والتفاصيل</th>
                                        <th className="p-4 font-bold">الوقت والتاريخ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-12 text-center text-gray-500 font-bold">
                                                لا توجد حركات مسجلة مؤخراً في السجل
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map(tx => {
                                            const isEarn = tx.points_earned > 0;
                                            const isRedeem = tx.points_redeemed > 0;
                                            return (
                                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-4 font-mono font-bold text-white" dir="ltr">{tx.customer_phone}</td>
                                                    <td className="p-4">
                                                        <span className={cn(
                                                            "px-2.5 py-1 rounded-xl text-[10px] font-bold inline-flex items-center gap-1",
                                                            tx.type === 'admin_add' && "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                                                            tx.type === 'admin_deduct' && "bg-red-500/10 text-red-400 border border-red-500/20",
                                                            tx.type === 'earn' && "bg-green-500/10 text-green-400 border border-green-500/20",
                                                            tx.type === 'redeem' && "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                                        )}>
                                                            {tx.type === 'admin_add' && <ArrowUpRight size={12} />}
                                                            {tx.type === 'admin_deduct' && <ArrowDownRight size={12} />}
                                                            {tx.type === 'admin_add' ? 'تعديل أدمن (+)' : tx.type === 'admin_deduct' ? 'خصم أدمن (-)' : tx.type === 'earn' ? 'كسب نقاط طلب' : 'استبدال خصم'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-bold text-green-400">
                                                        {isEarn ? `+${tx.points_earned} نقطة` : '-'}
                                                    </td>
                                                    <td className="p-4 font-bold text-amber-400">
                                                        {isRedeem ? `-${tx.points_redeemed} نقطة` : '-'}
                                                    </td>
                                                    <td className="p-4 font-mono text-gray-300">
                                                        {tx.amount > 0 ? `${tx.amount} ر.س` : 'ـ'}
                                                    </td>
                                                    <td className="p-4 text-gray-400 max-w-xs truncate">
                                                        {tx.notes || 'معاملة ولاء تلقائية'}
                                                    </td>
                                                    <td className="p-4 text-gray-500 font-mono text-[11px]">
                                                        {new Date(tx.created_at).toLocaleString('ar-SA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            )}

            {/* MODAL 1: ADJUST POINTS (Add / Deduct) */}
            <AnimatePresence>
                {adjustModal.isOpen && adjustModal.customer && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-zinc-900 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 text-right" dir="rtl">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    {adjustModal.type === 'add' ? <Plus className="text-green-400" /> : <Minus className="text-red-400" />}
                                    {adjustModal.type === 'add' ? 'إضافة نقاط لعميل' : 'خصم نقاط من عميل'}
                                </h3>
                                <button onClick={() => setAdjustModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
                            </div>

                            <div className="bg-zinc-800/70 p-4 rounded-2xl border border-white/5 space-y-1">
                                <p className="text-xs text-gray-400">العميل المستهدف:</p>
                                <p className="text-sm font-black text-white">{adjustModal.customer.full_name}</p>
                                <p className="text-xs font-mono text-primary" dir="ltr">{adjustModal.customer.phone_number}</p>
                                <p className="text-xs text-amber-400 font-bold pt-2 border-t border-white/5">الرصيد الحالي: {adjustModal.customer.points_balance || 0} نقطة</p>
                            </div>

                            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">عدد النقاط المراد {adjustModal.type === 'add' ? 'إضافتها' : 'خصمها'}</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={adjustModal.points}
                                        onChange={e => setAdjustModal(prev => ({ ...prev, points: e.target.value }))}
                                        placeholder="مثال: 10"
                                        className="w-full bg-zinc-800 text-white font-black text-lg p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">سبب التعديل / ملاحظة (اختياري)</label>
                                    <input
                                        type="text"
                                        value={adjustModal.reason}
                                        onChange={e => setAdjustModal(prev => ({ ...prev, reason: e.target.value }))}
                                        placeholder="مثال: مكافأة ولاء، تعويض طلب، تعديل..."
                                        className="w-full bg-zinc-800 text-white text-xs p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={adjustModal.isSubmitting || !adjustModal.points}
                                    className={cn(
                                        "w-full py-3.5 rounded-xl font-black text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50",
                                        adjustModal.type === 'add' ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/20" : "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20"
                                    )}
                                >
                                    {adjustModal.isSubmitting ? <Loader2 className="animate-spin" /> : 'تأكيد التعديل ورصد العملية'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL 2: ADD NEW CUSTOMER */}
            <AnimatePresence>
                {newCustomerModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setNewCustomerModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-md bg-zinc-900 rounded-3xl p-6 border border-white/10 shadow-2xl space-y-5 text-right" dir="rtl">
                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    <User className="text-primary" /> تسجيل عميل جديد بالولاء
                                </h3>
                                <button onClick={() => setNewCustomerModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-white p-1 cursor-pointer"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleCreateCustomerSubmit} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">رقم الجوال *</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newCustomerModal.phone}
                                        onChange={e => setNewCustomerModal(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="05xxxxxxxx"
                                        className="w-full bg-zinc-800 text-white font-mono p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none text-left"
                                        dir="ltr"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">اسم العميل بالكامل</label>
                                    <input
                                        type="text"
                                        value={newCustomerModal.name}
                                        onChange={e => setNewCustomerModal(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="مثال: محمد علي"
                                        className="w-full bg-zinc-800 text-white text-xs p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300">رصيد نقاط افتتاحي (اختياري)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newCustomerModal.points}
                                        onChange={e => setNewCustomerModal(prev => ({ ...prev, points: e.target.value }))}
                                        placeholder="0"
                                        className="w-full bg-zinc-800 text-amber-400 font-black p-3.5 rounded-xl border border-white/10 focus:ring-2 focus:ring-amber-500 outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={newCustomerModal.isSubmitting || !newCustomerModal.phone}
                                    className="w-full py-3.5 rounded-xl font-black bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
                                >
                                    {newCustomerModal.isSubmitting ? <Loader2 className="animate-spin" /> : 'حفظ وتسجيل العميل'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
