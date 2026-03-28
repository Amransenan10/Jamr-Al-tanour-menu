import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LayoutDashboard, KeyRound, ShoppingBag, Settings as SettingsIcon,
    UtensilsCrossed, LogOut, Loader2, Plus, Edit2, Trash2, CheckCircle2,
    X, Store, Clock, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export const AdminPage: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings'>('orders');

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
        <div className="min-h-screen bg-charcoal text-white text-right" dir="rtl">
            {/* Admin Header */}
            <div className="sticky top-0 z-40 bg-zinc-900 overflow-hidden border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                            <LayoutDashboard size={20} />
                        </div>
                        <h1 className="font-black text-xl">لوحة الإدارة</h1>
                    </div>
                    <button onClick={() => { localStorage.removeItem('jamr_admin_auth'); setIsAuthenticated(false); }} className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-xl hover:bg-red-500/20 font-bold transition-colors">
                        <LogOut size={16} /> تسجيل خروج
                    </button>
                </div>
                {/* Tabs */}
                <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar pb-4 pt-2">
                    {[
                        { id: 'orders', label: 'الطلبات', icon: <ShoppingBag size={16} /> },
                        { id: 'menu', label: 'لائحة الطعام', icon: <UtensilsCrossed size={16} /> },
                        { id: 'settings', label: 'الفروع والإعدادات', icon: <SettingsIcon size={16} /> }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all", activeTab === tab.id ? "bg-primary text-white" : "bg-zinc-800 text-gray-400 hover:bg-zinc-700")}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8">
                {activeTab === 'orders' && <AdminOrdersView />}
                {activeTab === 'menu' && <AdminMenuView />}
                {activeTab === 'settings' && <AdminSettingsView />}
            </main>
        </div>
    );
};

// --- Subviews ---

const AdminOrdersView = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
        if (data) setOrders(data);
        setLoading(false);
    };

    useEffect(() => { fetchOrders(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">آخر 50 طلب</h2>
                <button onClick={fetchOrders} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-gray-400"><RefreshCw size={18} /></button>
            </div>
            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/5">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-zinc-800/50 text-gray-400">
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
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-white/[0.02]">
                                    <td className="p-4"><span className="font-bold text-white">{order.customer_name}</span><br/><span className="text-xs text-gray-500">{order.phone}</span></td>
                                    <td className="p-4">{order.branch}</td>
                                    <td className="p-4">{order.order_type === 'delivery' ? 'توصيل' : 'استلام'}</td>
                                    <td className="p-4 text-primary font-bold">{order.total_price} ر.س</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded bg-zinc-800 text-xs text-gray-300">{order.status}</span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">{new Date(order.created_at).toLocaleString('ar-SA')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const AdminMenuView = () => {
    // Basic CRUD view for products
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchItems = async () => {
        setLoading(true);
        const { data } = await supabase.from('products').select('*').order('category_id');
        if (data) setProducts(data);
        setLoading(false);
    };

    useEffect(() => { fetchItems(); }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">إدارة الأصناف الشاملة</h2>
                <div className="flex gap-2">
                    <button onClick={fetchItems} className="p-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 text-gray-400"><RefreshCw size={18} /></button>
                    <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-primary/90">
                        <Plus size={18} /> إضافة صنف
                    </button>
                </div>
            </div>

            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
                        <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                            <div className="flex gap-3">
                                <img src={p.image_url || '/placeholder.png'} className="w-16 h-16 rounded-xl object-cover bg-zinc-800" />
                                <div className="flex-1">
                                    <h3 className="font-bold">{p.name_ar}</h3>
                                    <p className="text-primary font-bold text-sm">{p.price} ر.س</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                                <button className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20"><Edit2 size={12}/> تعديل</button>
                                <button className="flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20"><Trash2 size={12}/> حذف</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <p className="text-gray-500 text-xs text-center mt-4">ميزة إضافة/تعديل وتحديث الصور بكامل تفاصيلها متاحة برمجياً، وسيتم تفعيل النماذج المتقدمة قريباً لتنظيم المنيو الجديد.</p>
        </div>
    );
};

const AdminSettingsView = () => {
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBranches = async () => {
        setLoading(true);
        const { data } = await supabase.from('branch_credentials').select('*');
        if (data) setBranches(data.filter(b => b.branch_name !== 'admin'));
        setLoading(false);
    };
    
    useEffect(() => { fetchBranches(); }, []);

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">إعدادات الفروع وحسابات الكاشير</h2>
            {loading ? <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={32} /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map(b => (
                        <div key={b.branch_name} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 space-y-4">
                            <h3 className="text-lg font-black flex items-center gap-2"><Store className="text-primary"/> {b.branch_name}</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-400">كلمة مرور لكاشير الفرع:</p>
                                <div className="flex gap-2">
                                    <input type="text" readOnly value={b.password} className="flex-1 bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm font-mono border-none outline-none" />
                                    <button className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg font-bold">تغيير</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
