import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { motion, AnimatePresence } from 'motion/react';
import { 
    LayoutDashboard, KeyRound, ShoppingBag, Settings as SettingsIcon,
    UtensilsCrossed, LogOut, Loader2, Plus, Edit2, Trash2, CheckCircle2,
    X, Store, Clock, RefreshCw, Upload, TicketPercent
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export const AdminPage: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settings' | 'coupons'>('orders');

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
                        { id: 'coupons', label: 'كوبونات الخصم', icon: <TicketPercent size={16} /> },
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
                {activeTab === 'coupons' && <AdminCouponsView />}
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
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        name_ar: '',
        price: '',
        description_ar: '',
        category_id: '',
        image_url: '',
        is_available: true
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
                description_ar: product.description_ar || '',
                category_id: product.category_id,
                image_url: product.image_url || '',
                is_available: product.is_available ?? true
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
                description_ar: '',
                category_id: categories.length > 0 ? categories[0].id : '',
                image_url: '',
                is_available: true
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
        if (group) await supabaseAdmin.from('option_groups').update({ name_ar: group.name_ar, max_selection: group.max_selection }).eq('id', id);
    };

    const deleteGroup = async (id: string) => {
        if (!window.confirm('موافق للحديث؟')) return;
        setOptionGroups(prev => prev.filter(g => g.id !== id));
        await supabaseAdmin.from('option_groups').delete().eq('id', id);
    };

    const handleAddItem = async (groupId: string) => {
        const payload = { group_id: groupId, name_ar: 'خيار جديد', name_en: 'New Item', price: 0, is_available: true };
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
            const { error } = await supabaseAdmin.from('option_items').update({ name_ar: item.name_ar, price: cleanPrice }).eq('id', id);
            if (error) toast.error('خطأ في حفظ السعر');
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
            description_ar: formData.description_ar,
            description_en: formData.description_ar,
            category_id: formData.category_id,
            image_url: formData.image_url,
            is_available: formData.is_available
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
                        <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 transition-transform hover:-translate-y-1 hover:border-white/10">
                            <div className="flex gap-3">
                                <img src={p.image_url || '/placeholder.png'} className="w-20 h-20 rounded-xl object-cover bg-zinc-800 shrink-0" />
                                <div className="flex-1">
                                    <h3 className="font-bold flex items-center justify-between">
                                        {p.name_ar}
                                        {!p.is_available && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">نَفَد</span>}
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
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">السعر (ر.س) <span className="text-red-500">*</span></label>
                                        <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-400">القسم <span className="text-red-500">*</span></label>
                                        <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none appearance-none cursor-pointer">
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400">الوصف (اختياري)</label>
                                    <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none h-20 resize-none" />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400 flex items-center justify-between">
                                        <span>صورة الصنف</span>
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
                                    <span className="text-sm font-bold">هذا الصنف متوفر حالياً لطلبات العملاء</span>
                                    <input type="checkbox" className="hidden" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} />
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
                                                            <div className="relative">
                                                                <input type="number" step="0.01" value={item.price} onChange={e => handleUpdateItem(item.id, 'price', e.target.value)} onBlur={() => saveItem(item.id)} className="w-20 bg-zinc-800 text-white rounded-lg pl-3 pr-6 py-1.5 text-sm border-none outline-none focus:ring-1 focus:ring-primary text-left" placeholder="0" />
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">ر.س</span>
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

    const fetchBranches = async () => {
        setLoading(true);
        const { data } = await supabase.from('branch_credentials').select('*');
        if (data) setBranches(data.filter(b => b.branch_name !== 'admin'));
        setLoading(false);
    };

    const handlePasswordChange = async (branchName: string, newPassword: string) => {
        if (!newPassword) return;
        try {
            const { error } = await supabaseAdmin.from('branch_credentials').update({ password: newPassword }).eq('branch_name', branchName);
            if (error) throw error;
            toast.success(`تم تحديث كلمة مرور ${branchName} بنجاح`);
            fetchBranches();
        } catch {
            toast.error('حدث خطأ أثناء التحديث');
        }
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
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const payload = {
                code: formData.code.toUpperCase().replace(/\s/g, ''),
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
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
                <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-white/5">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-zinc-800/50 text-gray-400">
                            <tr>
                                <th className="p-4 font-bold">الكود</th>
                                <th className="p-4 font-bold">الخصم</th>
                                <th className="p-4 font-bold">الاستخدامات</th>
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

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-400">الحد الأقصى للاستخدام (اختياري)</label>
                                    <input type="number" placeholder="اتركه فارغاً للاستخدام اللامحدود" value={formData.max_uses} onChange={e => setFormData({...formData, max_uses: e.target.value})} className="w-full bg-zinc-800 text-white rounded-xl p-3 border border-transparent focus:border-primary/50 outline-none" />
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
export default AdminPage;
