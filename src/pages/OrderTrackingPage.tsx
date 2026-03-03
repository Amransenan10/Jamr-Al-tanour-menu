import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import {
    Loader2, CheckCircle2, Package, Clock, LogOut, FileText, MapPin, Phone,
    ChefHat, UtensilsCrossed, CheckCircle, Store, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Order } from '../types';

type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

const STATUS_STEPS = [
    { id: 'new', label: 'تم الاستلام', icon: <FileText size={20} /> },
    { id: 'accepted', label: 'مقبول', icon: <CheckCircle size={20} /> },
    { id: 'preparing', label: 'قيد التحضير', icon: <ChefHat size={20} /> },
    { id: 'ready', label: 'جاهز للاستلام/التوصيل', icon: <Package size={20} /> },
    { id: 'completed', label: 'مكتمل', icon: <CheckCircle2 size={20} /> }
];

export const OrderTrackingPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order & { id: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError('رقم الطلب غير متاح');
            setLoading(false);
            return;
        }

        const fetchOrder = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error(error);
                setError('لم نتمكن من العثور على الطلب. قد يكون رقمه غير صحيح.');
            } else {
                setOrder(data);
                // Save active order to local storage
                if (!['completed', 'cancelled'].includes(data.status)) {
                    localStorage.setItem('jamr_active_order', data.id);
                } else {
                    localStorage.removeItem('jamr_active_order');
                }
            }
            setLoading(false);
        };

        fetchOrder();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`order-${id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
                (payload) => {
                    const updatedOrder = payload.new as (Order & { id: string });
                    setOrder(updatedOrder);

                    if (['completed', 'cancelled'].includes(updatedOrder.status)) {
                        localStorage.removeItem('jamr_active_order');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-charcoal flex flex-col items-center justify-center p-6 text-gray-900 dark:text-white pb-20">
                <Loader2 size={48} className="text-primary animate-spin mb-4" />
                <p className="font-bold text-gray-500">جاري البحث عن الطلب...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-white dark:bg-charcoal flex flex-col items-center justify-center p-6 text-center text-gray-900 dark:text-white pb-20">
                <AlertCircle size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-black mb-2">عذراً!</h1>
                <p className="text-gray-500 mb-8 max-w-sm">{error}</p>
                <Link to="/" className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
                    العودة للمنيو الرئيسي
                </Link>
            </div>
        );
    }

    const currentStatusIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
    const isCancelled = order.status === 'cancelled';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-charcoal pt-6 pb-20 px-4">
            <div className="max-w-xl mx-auto space-y-6">

                {/* Header */}
                <div className="text-center">
                    <Link to="/" className="inline-block mb-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mx-auto overflow-hidden border border-gray-100 dark:border-white/10 p-1">
                            <img src="/assets/logo.png" alt="جمر التنور" className="w-full h-full object-contain" />
                        </div>
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white">تتبع طلبك</h1>
                    <p className="text-gray-500 mt-1 text-sm font-medium">رقم الطلب: {order.id.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* Tracking Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-white/5 overflow-hidden">

                    <div className="p-6 sm:p-8 bg-primary/5 border-b border-primary/10">
                        {isCancelled ? (
                            <div className="flex flex-col items-center text-center text-red-500 py-4">
                                <LogOut size={48} className="mb-3" />
                                <h2 className="text-2xl font-black">تم إلغاء الطلب</h2>
                                <p className="text-sm mt-2 opacity-80">للأسف تم إلغاء هذا الطلب. نعتذر عن ذلك ونتمنى خدمتك في وقت لاحق.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Lines between steps */}
                                <div className="absolute top-5 right-[10%] left-[10%] h-1 bg-gray-200 dark:bg-white/10 rounded-full" dir="ltr">
                                    <motion.div
                                        className="h-full bg-primary rounded-full origin-left"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(0, (currentStatusIndex / (STATUS_STEPS.length - 1)) * 100)}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>

                                <div className="relative z-10 flex justify-between">
                                    {STATUS_STEPS.map((step, index) => {
                                        const isCompleted = index <= currentStatusIndex;
                                        const isCurrent = index === currentStatusIndex;

                                        return (
                                            <div key={step.id} className="flex flex-col items-center relative gap-2">
                                                <motion.div
                                                    animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500",
                                                        isCompleted
                                                            ? "bg-primary border-white dark:border-zinc-900 text-white"
                                                            : "bg-gray-100 dark:bg-zinc-800 border-white dark:border-zinc-900 text-gray-400"
                                                    )}
                                                >
                                                    {step.icon}
                                                </motion.div>
                                                <span className={cn(
                                                    "absolute -bottom-6 whitespace-nowrap text-[10px] sm:text-xs font-bold transition-colors duration-500",
                                                    isCurrent ? "text-primary" : (isCompleted ? "text-gray-900 dark:text-white" : "text-gray-400")
                                                )}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="h-6" /> {/* Spacer for labels */}
                            </div>
                        )}
                    </div>

                    {/* Order Details */}
                    <div className="p-6 sm:p-8 space-y-6">
                        <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/5">
                            <div>
                                <p className="text-gray-500 text-sm mb-1">الفرع</p>
                                <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 hover:text-primary">
                                    <Store size={16} className="text-primary" /> {order.branch}
                                </p>
                            </div>
                            <div className="text-left">
                                <p className="text-gray-500 text-sm mb-1">نوع الطلب</p>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    {order.order_type === 'delivery' ? 'توصيل 🛵' : 'استلام 🛍️'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4">تفاصيل الفاتورة</h3>
                            <div className="space-y-3">
                                {order.items.map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <div className="text-gray-600 dark:text-gray-300">
                                            <span className="text-primary font-bold ml-2">{item.quantity}×</span>
                                            {item.name}
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {item.totalPrice} ر.س
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 -mx-6 sm:-mx-8 px-6 sm:px-8 mt-6">
                            <span className="font-bold text-gray-600 dark:text-gray-300">الإجمالي</span>
                            <span className="text-2xl font-black text-primary">{order.total_price} ر.س</span>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm">
                        <UtensilsCrossed size={16} /> العودة وتصفح المنيو
                    </Link>
                </div>
            </div>
        </div>
    );
};
