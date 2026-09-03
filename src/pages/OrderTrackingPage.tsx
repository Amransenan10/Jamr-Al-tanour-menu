import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import {
    Loader2, CheckCircle2, Package, Clock, LogOut, FileText, MapPin, Phone,
    ChefHat, UtensilsCrossed, CheckCircle, Store, AlertCircle, Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Order } from '../types';
import toast from 'react-hot-toast';
import { updateStoredOrderStatus } from '../utils/orderStorage';
import { notifyCustomerStatusChange, testCustomerNotificationAndSound, unlockCustomerAudio } from '../utils/customerNotifications';
import { SpinWheelModal } from '../components/SpinWheelModal';
import { Sparkles } from 'lucide-react';

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
    const prevStatusRef = useRef<string | null>(null);
    const [isWheelOpen, setIsWheelOpen] = useState(false);
    const [appSettings, setAppSettings] = useState<any>({});
    const [hasSpunCurrentOrder, setHasSpunCurrentOrder] = useState(false);
    const [notifPermission, setNotifPermission] = useState<NotificationPermission>(() => {
        return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'denied';
    });

    const requestNotifications = async () => {
        unlockCustomerAudio();
        testCustomerNotificationAndSound();
        if ('Notification' in window) {
            const p = await Notification.requestPermission();
            setNotifPermission(p);
            if (p === 'granted') {
                toast.success('تم تفعيل واختبار الإشعارات بنجاح! 🔔');
            }
        }
    };

    const processOrderUpdate = (updatedOrder: Order & { id: string }, isInitial = false) => {
        setOrder(updatedOrder);

        if (['completed', 'cancelled'].includes(updatedOrder.status)) {
            localStorage.removeItem('jamr_active_order');
        } else {
            localStorage.setItem('jamr_active_order', updatedOrder.id);
        }
        updateStoredOrderStatus(updatedOrder.id, updatedOrder.status);

        if (!isInitial && prevStatusRef.current && prevStatusRef.current !== updatedOrder.status) {
            const stepMsg = STATUS_STEPS.find(s => s.id === updatedOrder.status)?.label || 'تحديث جديد';
            toast.success(`تحديث في الطلب: ${stepMsg}`, {
                duration: 5000,
                icon: '🔔',
            });
            // Trigger sound chime, vibration, and push notification
            notifyCustomerStatusChange(updatedOrder.status, stepMsg, updatedOrder.id);
        }
        prevStatusRef.current = updatedOrder.status;
    };

    useEffect(() => {
        if (!id) {
            setError('رقم الطلب غير متاح');
            setLoading(false);
            return;
        }

        // Check wheel spin status for this order
        const spun = localStorage.getItem(`jamr_wheel_spun_${id}`);
        setHasSpunCurrentOrder(!!spun);

        const fetchOrderAndSettings = async (isSilent = false) => {
            if (!isSilent) setLoading(true);
            
            const [orderRes, settingsRes] = await Promise.all([
                supabase.from('orders').select('*').eq('id', id).single(),
                supabase.from('app_settings').select('*').single()
            ]);

            if (settingsRes.data) {
                setAppSettings(settingsRes.data);
            }

            if (orderRes.error || !orderRes.data) {
                console.error(orderRes.error);
                if (!isSilent) setError('لم نتمكن من العثور على الطلب. قد يكون رقمه غير صحيح.');
            } else {
                processOrderUpdate(orderRes.data, prevStatusRef.current === null);

                // Auto-trigger wheel spin popup 1 second after landing if not spun yet
                if (!spun && (settingsRes.data?.wheel_active !== false)) {
                    setTimeout(() => {
                        setIsWheelOpen(true);
                    }, 1000);
                }
            }
            if (!isSilent) setLoading(false);
        };

        fetchOrderAndSettings(false);

        // Fast 3-second polling fallback to guarantee notification triggers even on mobile sleep
        const pollInterval = setInterval(() => {
            fetchOrderAndSettings(true);
        }, 3000);

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`order-${id}`)
            .on('postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
                (payload) => {
                    const updatedOrder = payload.new as (Order & { id: string });
                    processOrderUpdate(updatedOrder, false);
                }
            )
            .subscribe();

        return () => {
            clearInterval(pollInterval);
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
                    
                    <button
                        onClick={() => {
                            testCustomerNotificationAndSound();
                            toast.success('تم اختبار نغمة التنبيه والاهتزاز! 🎵', { icon: '🔔' });
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold transition-all border border-primary/20"
                    >
                        <Bell size={14} className="animate-pulse" />
                        <span>اختبار نغمة التنبيه والاهتزاز 🎵</span>
                    </button>
                </div>

                {/* Notification Permission Card (iOS & Android friendly prompt) */}
                {notifPermission === 'default' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-600 dark:text-amber-400 shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                <Bell size={20} className="animate-bounce text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs font-black">تفعيل التنبيهات الفورية 🔔</p>
                                <p className="text-[11px] opacity-90 font-medium">احصل على تنبيه بالصوت والاهتزاز فور استلامك أو جاهزية وجبتك</p>
                            </div>
                        </div>
                        <button
                            onClick={requestNotifications}
                            className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl text-xs shadow-md hover:bg-amber-600 transition-colors shrink-0"
                        >
                            تفعيل
                        </button>
                    </motion.div>
                )}

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
                                {order.pickup_time && (
                                    <p className="text-xs text-amber-500 font-bold mt-1">
                                        ⏱️ وقت الاستلام المحدد: {order.pickup_time}
                                    </p>
                                )}
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

                {/* Spin Wheel Post-Order Banner if eligible */}
                {(appSettings?.wheel_active !== false) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 rounded-3xl p-5 text-center space-y-3 shadow-lg"
                    >
                        <div className="flex items-center justify-center gap-2 text-amber-500 font-black">
                            <Sparkles size={20} className="animate-spin" />
                            <span className="text-base">هدية خاصة بعد طلبك! 🎡</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                            {hasSpunCurrentOrder 
                                ? 'شكراً لتدوير العجلة! استمتع بهديتك في طلبك القادم 🎉' 
                                : 'ألف مبروك إتمام الطلب! اضغط أدناه لتدوير عجلة الحظ وكسب هديتك لطلبك القادم 🎁'}
                        </p>
                        {!hasSpunCurrentOrder && (
                            <button
                                onClick={() => setIsWheelOpen(true)}
                                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                            >
                                <span>تدوير عجلة الحظ الآن! 🎡</span>
                            </button>
                        )}
                    </motion.div>
                )}

                <div className="text-center">
                    <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold text-sm">
                        <UtensilsCrossed size={16} /> العودة وتصفح المنيو
                    </Link>
                </div>

                {/* Spin Wheel Modal */}
                <SpinWheelModal
                    isOpen={isWheelOpen}
                    onClose={() => setIsWheelOpen(false)}
                    title={appSettings?.wheel_title}
                    customerPhone={order?.phone}
                    orderId={order?.id}
                    prizes={
                        appSettings?.wheel_prizes
                            ? typeof appSettings.wheel_prizes === 'string'
                                ? JSON.parse(appSettings.wheel_prizes)
                                : appSettings.wheel_prizes
                            : undefined
                    }
                />
            </div>
        </div>
    );
};
